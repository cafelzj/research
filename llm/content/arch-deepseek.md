# DeepSeek V4 → V4.1：计算图究竟改变在哪里

核验日期：2026-11-14。范围是官方论文与参考实现的架构解释，不是模型实测。V4.1 架构解释核对官方技术报告正文。下文层号统一从1开始；源码配置数组从0开始。

## 先固定问题：读输入与写输出是两种工作

普通 causal decoder 中，prompt 的每个位置都过全部 L 层。第 l 层通常从本层输入状态生成自己的 K/V：`K_l = H_l W_lK, V_l = H_l W_lV`；新 token 的 Q 读取这一层缓存的历史 K/V，得到新隐状态，再过 FFN。prefill 把很多输入位置并行处理；decode 一次追加一个或一小批位置，反复读历史缓存。过去位置已经算出的状态由 KV 缓存保存，并不会每产生一个字就重跑全部历史。

分开看两笔账：① 每个位置过几层、激活多少 FFN/专家；② 历史里保存和读取多少 KV，索引器又扫描多少位置。MoE 省 FFN 激活量，稀疏注意力省远程访问，压缩 KV 省存储，它们作用于不同环节。

普通分离K/V的GQA，可用 `M_KV ≈ N × L × 2 × n_kv_heads × head_dim × bytes_per_scalar` 理解缓存线性增长。DeepSeek共享KV向量同时作为key与value，不能把这个普通公式中的“×2”原封不动套进其缓存账本。

## V4：先把时间轴压短，再决定看哪些块

[V4论文§2.3.1—§2.3.3](https://arxiv.org/html/2606.19348v1#S2.SS3)同时采用CSA与HCA，并加一条保留最近细节的滑窗分支。它并没有把整个序列都变成512个token。

```text
原始历史位置 1 ... N
   ├─最近 W 个位置：未压缩 SWA KV ─────────────────┐
   ├─CSA层：压为 N/m 个槽 → 轻量索引打分 → Top-k ─┤→ 本层Q做注意力
   └─HCA层：压为 N/m' 个槽 → 全部压缩槽参与注意力 ─┘
```

CSA、HCA是交替层的两种全局分支；不是同一层必须同时运行上图两条全局分支。每层都有本层local SWA。

- **CSA不是DSA的同义词。** DSA是索引器挑选少量历史位置的方法；V4的CSA先在序列维度压缩KV，再把DSA应用到压缩槽上。减少读取的槽数，与减少必须保存的总槽数，是两件事。
- **压缩不是简单截断或均值。** 可用 `c_j = Σ_i α_{ji} ⊙ v_i` 理解，α由可训练门控按通道加权产生。V4 CSA每个输出槽汇合相邻、重叠的2m个源条目，输出长度仍约N/m；HCA用更大、非重叠块。源码的`Compressor`明确实现门控池化和未满一块时的尾状态。
- **HCA不再Top-k。** 它把更长一段历史压成一个槽，然后读全部压缩槽。Flash配置CSA m=4、k=512；HCA m'=128；W=128。Pro的CSA k=1024，别把Flash与Pro配置混用。见[V4论文§4.2.1](https://arxiv.org/html/2606.19348v1#S4.SS2.SSS1)。
- 以Flash的N=1,000,000为教学例：CSA索引器仍面对约250,000个压缩候选，而重型主注意力最多读512个远程槽及128个local槽；HCA则读约7,813个全局压缩槽及local槽。这个例子说明，**“主注意力只看固定k”不等于全部注意力计算对N为常数**，轻量索引仍可能随长度增长。

粗略地说，CSA一层每个query的全局部分是 `index_cost(N/m) + core_attention_cost(k)`；HCA是 `core_attention_cost(N/m')`，再分别加local W与投影/归一化开销。prefill还要对许多query重复做索引，不能由“decode主核固定k”推导prefill线性复杂度。

代价也很具体：远处原始token被合并，罕见细节可能损失；相关槽若没进Top-k，主注意力就读不到。local SWA补救的是最近一段精确信息，不保证任意远处的数字、否定词和引用都完整保存。

## V4.1的CED：让长输入减少逐位置执行完整网络的计算

直接证据：[V4.1技术报告§2.2，PDF第9页](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=9)。模型为40层：下20层是causal encoder，上20层是decoder；两部分都保持因果性，encoder不是传统seq2seq的双向encoder。

一般CED公式把decoder全局KV的数据来源改成encoder最终状态E，而不是本decoder层隐状态：

```text
传统：每层本层状态 H_l → 自己的global K/V
CED：token → E1...E20 → E_final → 投影得到decoder global KV
                              └→ D21...D40 → logits

一般设计：C_l = E_final W_lKV，Z_l = E_final W_lZ，l > 20
```

这里“同一个encoder最终状态”不自动等于“所有层同一组KV”。上式允许各个decoder Full层有自己的投影。**实际V4.1再叠加CSA2层间共享后，decoder只有第21层产生一组global KV；第22—40层共享这组main KV和对应indexer K。** 每个decoder层仍有自己的Q、自己的local SWA KV、输出投影和FFN，绝不是复制第21层输出。

实际共享关系由[官方config.json](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/inference/config.json)直接给出：

| 位置 | 实际做什么 |
| --- | --- |
| encoder第1—2层 | 只有SWA |
| encoder第3、9、15层 | 三个独立Full KV源，每个2:1压缩；中间层复用最近源 |
| decoder第21层 | 从E_final产生一组不做序列压缩的global KV（m=1），并运行全局索引 |
| decoder第25、29、33、37层 | 用本层indexer Q对共享indexer K重新选Top-512 |
| 其余decoder层 | 复用最近一次Top-512选择，仍用本层Q对这些KV重新计算注意力 |

**冷prefill：** 全prompt先过20层encoder，得到全prompt的E_final及decoder需要的global KV。大部分位置到这里结束；但最后W=128个prompt位置仍要过20层decoder，建立每层自己的local SWA状态，并得到产生首个输出所需的末位置logits。所以不能说“decoder读prompt完全零计算”。

**decode：** 每个新产生的token仍依次过20层encoder和20层decoder，追加encoder与共享decoder global KV，并更新各层滑窗。旧prompt的encoder结果由缓存复用，不是每次生成token重跑整段encoder。

8B prefill/16B decode对应这条不对称主干路径：绝大多数长prompt token只跑半个主干，生成token跑全主干；不是把同一计算任务 magically 用一半参数完成，也不是8B权重就能部署。尾部重放、KV投影、索引、视觉编码、通信均不应忽略。

论文写的层工作量近似为 `NL/2 + WL/2`，相对完整prefill的`NL`。它是token×层级别的解释，不是包括注意力索引在内的严格全部FLOPs公式。教学例N=32,768、L=40、W=128，比例约0.502；若prompt短于128，尾部decoder工作已占很大部分，不能许诺首token时延一定减半。

## CSA2：共享“记忆本体”与共享“去哪找”可以分开

证据：[V4.1报告§2.3.1，第10页](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=10)，[源码Attention与SharedAttentionRuntime](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/inference/model.py)。

| 模式 | 新造main KV/indexer K | 本层重新打分选Top-k | 本层Q、SWA、主注意力、FFN |
| --- | --- | --- | --- |
| Full | 是 | 是 | 都要算 |
| Reindex | 否，复用此前Full的KV/K | 是 | 都要算 |
| Reuse | 否 | 否，复用最新indices | 都要算 |

KV共享减少存储；indices共享减少索引计算。这两个收益不等价。Reuse仍可对同一候选集合赋予不同注意力权重；但不能在本层选择之前没入选的新位置。

V4.1用纯CSA2替代V4的CSA/HCA交替，并把压缩器简化为无重叠、无压缩绝对位置偏置；indexer K从main KV投影，不再单独从hidden states走一条压缩路径。

**分层索引避免重复扫描全部历史。** 第21层先扫描全部因果可见位置，按每8个位置一块取块内最高分，选2,048块，组成最多16,384位置的候选池。后续Reindex层只在这个池里选自己的512个位置。这样是“第一次扫描仍随N增长，后续几次扫描上限固定”，不是整个模型与上下文长度彻底无关。若最初把相关块剪掉，后续重新打分也救不回来。候选限制在后训练中模拟；见[§2.3.2，第11—12页](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=11)。

## FP4 KV：省的是持久记忆的字节，不是把所有矩阵算子改成FP4

证据：[V4.1报告§2.4.4，第14页](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=14)，[kernel.py的fp4_act_quant](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/inference/kernel.py)。

main KV用E2M1，每16个通道共用一个8bit E4M3 scale，近似4.5bit/数，不是完全没有元数据的4bit。读入注意力前反量化，因而这种格式的主要作用是减少存储和搬运，不要求该格式原生矩阵乘法。RoPE后量化；RoPE与非RoPE部分同格式。作者在后训练加QAT。对量化较敏感的local SWA KV仍保留FP8。

**890 bytes/token可以从配置复算，不必背宣传数字：**

- 四个global源的槽数因子是`3/2 + 1 = 2.5`：encoder三个源各N/2，decoder一个源N。
- 每个main KV槽512维，字节为`512×0.5 + 512/16×1 = 288`。
- 每个indexer K槽128维，FP4加每32维一个8bit scale：`128×0.5 + 128/32×1 = 68`。
- 合计`2.5 × (288 + 68) = 890 bytes / 原始token`。

这是本节按官方代码/格式的独立算术复核，不是实测显存。若N按十进制100万算，global KV约0.89GB/序列；不含模型权重、local SWA、尾块、元数据、工作区、并行复制和请求批量。**1/4指global KV相对V4-Flash，不是整机显存或整任务费用变1/4。**

## Bounded Replay：少存local状态，恢复时接受近似

证据：[V4.1报告§3.2.1，第19页](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=19)、[§3.2.2，第20页](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=20)。

单层SWA只看W个近邻，但层层堆叠后的依赖范围扩大。若没有local缓存，要精确恢复L层的最后W个local状态，可能需重算约L×W个历史位置；不能因为“滑窗128”就说完整模型只依赖128个token。作者只重放最后W个位置，并把重放段开始之前的local注意力截掉：`SWA_allowed(i) = [max(s, i-W+1), i]`，s是重放起点。

这里有两种不同场景：

1. **Encoder SWA Bounded Replay是缓存缺失恢复。** global前缀缓存仍在、encoder local SWA状态已经过期时，重放已缓存前缀末128个token，再接新的工具结果/用户输入。重放区只重建SWA，复用旧global KV，不重算和覆盖它；未缓存新后缀正常生成global与local KV。并非重新编码整个长前缀。
2. **Decoder SWA Bounded Replay是CED prefill收尾。** 每次prefill，把prompt最后128个位置的encoder输出过20层decoder，以初始化各decoder层local状态；这些decoder local状态供随后的decode使用，不写长效前缀缓存。它是“跳过绝大多数prompt的decoder”能够成立的配套处理。

冷prefill已算出尾部encoder输出。暖缓存情况下，短后缀之前那部分尾部encoder输出如何在各引擎中保留/调度，论文没有给出足以复现的完整服务端实现；不要擅自承诺某种引擎完全不额外重算encoder。可以明确证明的是：没有每生成一个token重跑整个encoder前缀；encoder local缓存缺失时有界重放；decoder不能跳过尾部状态初始化。

**代价是数学近似，不是无损缓存格式。** 作者明确说，重放的前缀状态是近似的，后来新后缀算出的global/local KV可能依赖命中边界；因此同一完整prompt从不同cache-hit位置继续，不保证中间状态逐位相同。作者在后训练模拟decoder重放，报告已测场景质量损失小，但这里未找到一个逐项量化“所有边界退化上限”的消融表。不能把“negligible”写成已独立证明普遍无损。

## 为什么persistent KV可约降到1/8，却不等于HBM再除8

V4.1论文中的两项口径不同：global runtime KV常驻HBM，约V4-Flash的1/4；persistent KV是SSD/host上用于复用的长效缓存，约1/8。作者原部署persistent容量约一半是global、一半是SWA。新设计把SWA移出长效缓存，只给活跃会话的encoder local状态一个分钟级DRAM池；global仍长效保留。`去掉约一半 × 剩下global压成1/4 ≈ 原persistent的1/8`。

报告说其DRAM池约用每机10% host内存，global缓存保留至少72小时；这是作者部署配置，不能改写为所有第三方托管、所有API请求均承诺同样命中时效。V4论文§3.5.2另谈“存所有token的SWA会是global约8倍”；那是另一存储策略，不要与V4.1描述的实际检查点容量“一半”混算。

## 证据强度与复现边界

- [V4.1最小推理README](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/inference/README.md)明确它是可读参考实现，不是生产服务引擎。核验时`Transformer.forward`对整个传入prompt循环全部40层，没有CED“只处理decoder尾部”的生产调度；源码可证明共享和数值路径，不能直接拿它跑出的时延验证论文的prefill减半。
- 同一参考代码的`fp4_act_quant(..., inplace=True)`把量化后反量化值写回原张量，便于复现数值效果；不代表该运行路径真的按890 B/token打包所有main KV。`Indexer`也先构造分数再mask候选，不能把它当已展示生产级索引吞吐优势的证据。
- V4“1M上下文时Pro单tokenFLOPs约V3.2的27%、KV约10%”是特定型号/长度条件；V4.1图2还把BF16、FP8、FP4操作分别按1、0.5、0.25加权。加权FLOPs、物理指令数、首token延迟、单用户输出速率、整服务吞吐不是同一指标。
- [V4.1报告§6，第37页](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=37)明确承认：CSA2误选和SWA近似重建在未覆盖边界可能退化。研究员应分别做cold/warm前缀、不同命中边界、极短工具返回、长文多事实/否定/精确引用测试；同时记录任务成功率、人工接管率、p50/p95时延、缓存/工具/输出费用。

## 直接阅读路线

1. [V4论文§2.3 CSA/HCA](https://arxiv.org/html/2606.19348v1#S2.SS3)，配合[其参考Compressor/Indexer/Attention源码](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/inference/model.py)：理解压缩与稀疏选择不是一回事。
2. [V4.1 PDF第9页CED公式](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=9)：理解decoder global KV为什么不必依赖上半层全prompt状态。
3. [第10—12页CSA2](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=10)+[实际config](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/inference/config.json)：一般公式与实际共享分组分开读。
4. [第14页FP4](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=14)+[kernel.py](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/inference/kernel.py)：复算字节，区分量化模拟与物理打包。
5. [第19—20页缓存与重放](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/DeepSeek_V41_Tech_Report.pdf#page=19)+第37页局限：看清省掉了什么，以及哪些质量保证尚不存在。
