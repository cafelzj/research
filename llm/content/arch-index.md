# 索引复用不等于 KV 复用：IndexShare / IndexPool / IndexCache / CSA2

核读时间：2026-11-14。以下比较的是推理时实际数据流，不把模型发布宣传或训练框架当成注意力结构。厂商生产 API 的全部实现不公开；“证实采用”指已发布权重配置、参考实现或官方技术报告明确记载，不能外推每个第三方服务的内核均正确高效实现。

## 先分清四种对象

1. **主 Q、主 K/V（或 MLA latent KV）**：注意力真正用来算相关性、聚合内容的向量。
2. **索引器 Q/K**：较便宜的检索代理，用来决定哪些位置值得进入主注意力。
3. **Top-k 索引**：一串整数位置编号，不是 K/V 向量，也不是主注意力 softmax 权重。
4. **主注意力输出**：当前层按自己的 Q 对选中内容重新计算的加权结果。复用“位置清单”或“书架内容”都不等于直接复用这个结果。

普通 DSA 是“轻量索引器扫描历史 → 选位置 → 主注意力只读选中位置”。主注意力稀疏以后，索引器仍可能扫描全部历史，长上下文时这部分会重新成为瓶颈。[DSA/IndexCache 论文](https://arxiv.org/html/2603.12201v1)

## 简洁对照

| 机制 | 复用/压缩什么 | 当前层仍计算什么 | 是否共享主 KV | 已公开证实的模型/范围 |
| --- | --- | --- | --- | --- |
| GLM **IndexShare** | 相邻层复用前一个 full 索引层的 Top-k 整数位置 | 本层主 Q、自己的主 KV、主注意力分数/softmax/输出；full 层还重新检索 | **不因该机制共享** | GLM-5.2、GLM-5.3：78层、21 full / 57 shared |
| 腾讯 Hy4 采用的 **IndexCache** | 与上述同类：shared 层复用前一个 full 层的 Top-k 清单 | 仍有本层 Q/KV 与主注意力；另有模型自身 attention gate | **不因该机制共享** | Hy4-preview：官方模型卡+配置+原生实现，78层、21 full / 57 shared |
| GLM **IndexPool** | **序列维度**把4个相邻索引器 K 可学习加权池化成1个候选，不是跨层共用 | DSA 层本身重新检索池化候选；选中池再展开原位置，由主注意力读取原主 KV | **不因该机制共享** | GLM-5.3-Flash：11个 DSA 层 + 34个线性注意力层；`index_kpool=4` |
| DS **CSA2 Full** | 本层建立全局主 KV、索引器 K，并产出新 Top-k | 主 Q、本地 SWA KV、索引打分、主注意力输出 | 是共享组的来源层 | DeepSeek-V4.1-Flash |
| DS **CSA2 Reindex** | 共享前方 Full 层的全局主 KV、索引器 K；**不沿用旧 Top-k** | 本层索引器 Q 重新评分/选位置；本层主 Q、本地 SWA KV、主注意力输出 | **是** | DeepSeek-V4.1-Flash |
| DS **CSA2 Reuse** | 同时共享全局主 KV、索引器 K及最近一次 Full/Reindex 产生的 Top-k | 跳过索引器 Q/评分；仍算本层主 Q、本地 SWA KV和主注意力输出 | **是** | DeepSeek-V4.1-Flash |

这里的 **full 不代表恢复全历史的稠密主 attention**：IndexCache 的 full 表示运行完整索引器；CSA2 的 Full 表示完整生成 KV/检索流程，主注意力仍按其稀疏规则执行。

## IndexShare 与 IndexCache：省掉反复找位置，保留每层自己的内容表示

IndexCache 原论文作者来自清华/Z.ai，不能称为腾讯原创。腾讯 Hy4-preview 的官方模型卡明确引用并采用它。论文把层分为 F/S：F重新检索，S使用最近F的选中位置；主注意力和FFN在每一层照常运行。论文同时给出无训练的校准集贪心选层，以及把保留索引器蒸馏到其服务的多层注意力分布的训练方案。[论文作者与方法](https://arxiv.org/html/2603.12201v1)、[作者代码](https://github.com/THUDM/IndexCache)、[Hy4 官方模型卡](https://huggingface.co/tencent/Hy4-preview/blob/main/README.md)

**生产配置核验，而非只读博客口号：**

- GLM-5.2/5.3 的 `indexer_types` 都是78项。以0起算，full在 `0,1,2,6,10,…,74`，共21层；不是从第一层开始机械地每4层一组。其余57层shared。[GLM-5.2 配置](https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json)、[GLM-5.3 配置](https://huggingface.co/zai-org/GLM-5.3/blob/main/config.json)
- Hy4-preview也是21个full，但位置为 `0,1,5,9,…,77`，和GLM不完全相同。[Hy4 配置](https://huggingface.co/tencent/Hy4-preview/blob/main/config.json)
- 原生GLM实现先做本层 `q_a_proj / q_b_proj`、`kv_a_proj_with_mqa`，然后 `cache.update(..., self.layer_idx)` 写本层latent KV；只在索引选择处分支复用 `prev_topk_indices`，随后每层仍进入 `attention_interface`。Hy4实现也有同样的本层缓存与选择分支。这直接排除了“各层共享同一套主KV/attention结果”的读法。[GLM 实现](https://github.com/huggingface/transformers/blob/main/src/transformers/models/glm_moe_dsa/modeling_glm_moe_dsa.py)、[Hy4 实现](https://github.com/huggingface/transformers/blob/main/src/transformers/models/hy_v4/modeling_hy_v4.py)

**何时值得：**长上下文、相邻层检索目标相似、索引器已占明显时延时；若主要瓶颈在MoE通信、短输入、小批量固定调度或输出服务排队，收益可能很小。保留21个全历史索引器仍有随上下文增长的扫描成本，不能宣称彻底消除索引器的长序列复杂度。减少索引器自身状态不等于主KV显存按同一比例下降。

**错选的代价：**不同层可能分别需要实体、位置、逻辑依赖和答案证据。上游索引器若漏掉某个关键事实，后续shared层在该次主注意力中就不能直接读它，即使该层的主Q本来能识别它；它只能等后续full刷新，或通过此前隐藏状态间接传递。Top-k位置重合率高也不意味着遗漏内容不重要，因此应按任务损失/下游准确率校准，而非只优化位置重合率。训练适配有助于让共享索引服务多层，但不是无条件零损失。

## IndexPool：先压缩“检索目录”，主内容仍按原token读取

GLM-5.3-Flash 的配置中45层 `indexer_types` 都标full；其 `layer_types` 则是34层线性注意力、11层DSA。**不能把GLM-5.2的FSSS跨层模式直接套到Flash。** Flash的DSA索引器使用 `index_kpool=4`，把邻接4个索引器K通过学习权重合成一个候选。[官方配置](https://huggingface.co/zai-org/GLM-5.3-Flash/blob/main/config.json)

代码进一步表明：`index_topk=2048` 指最终原始位置预算；索引器先选 `2048//4=512` 个pool，再将每池4个成员展开成约2048个原token位置。未凑齐的当前尾组会额外保留，最多加3个位置。**主attention读的是这些原位置的主KV，而不是把四个主KV平均后只读一个。** [`Glm5NextTextIndexer` 的评分、`get_pooled_states` 与展开代码](https://github.com/huggingface/transformers/blob/main/src/transformers/models/glm5_next/modeling_glm5_next.py)

它减少候选数量和索引器缓存/扫描开销；全模型KV减少还同时来自大量线性注意力层，不能全归因IndexPool。代价是选择粒度变粗：一个重要token可能被池化稀释；一池被选中后，多个无关邻居也占用主attention预算。近期不完整尾组的保留处理了因果可见性和新token遗漏，不证明远处细粒度证据永不丢失。[官方架构说明](https://www.zhipuai.cn/zh/research/163)

## CSA2：把“共享内容”和“是否重新检索”拆成两套决策

CSA2比只复用索引更进一步：Full拥有全局主KV/索引K，Reindex共享内容但用本层索引Q重选，Reuse连位置清单也复用。**三种模式都产生新的主Q与本层SWA KV，都重新做主attention，不直接复用上层softmax或输出。** 在CED的Decoder中，Full全局KV从Encoder末层表征生成，不能一概写成来自该Decoder层当前隐藏状态。[报告 §2.3.1](https://arxiv.org/html/2609.19969v1#S2.SS3.SSS1)

公开配置能区分“KV组”和“索引组”：40层骨干，前20 Encoder、后20 Decoder；主KV来源为 `2,8,14,20`，索引来源为 `2,8,14,20,24,28,32,36`（0起算）。Decoder后面四个组的第一层只重新检索、不重新生成全局KV。官方参考代码用 `is_kv_source / is_index_source` 两个条件分别控制缓存生成与选位，`Attention.forward` 每层仍调用 `sparse_attn(q, kv, ..., topk_idxs, ...)`。[配置](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/config.json)、[官方参考代码](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/inference/model.py)

此外Decoder的Hierarchical Sparse Indexer让首个Full做全范围检索，并选出较宽候选池；后续Reindex只在候选池内评分，可重新选自己的Top-512。此处“候选池”与最终Top-k不同。例如2048个8位置块组成16384个候选位置，再筛512；不是把16384个都做主attention，也不是所有层直接使用首层512个位置。首个Full扫描仍存在，局部SWA也仍存在；不能因此宣称全模型全阶段都是对上下文长度O(1)。候选限制如果先漏掉某个远程块，后续重检索也无法从候选池外找回，需要训练时同时适配。[报告 §2.3.2](https://arxiv.org/html/2609.19969v1#S2.SS3.SSS2)、[NVIDIA实现说明](https://github.com/NVIDIA/TensorRT-LLM/blob/main/tensorrt_llm/_torch/attention/backends/sparse/csa2/README.md)

## 不要混入“推理网络架构”的三件事

| 名称 | 应归类 | 不能混写成 |
| --- | --- | --- |
| Preserved Thinking / `clear_thinking:false` | 对话模板、推理上下文与API调用约定；保留历史 `reasoning_content`，可能帮助连续推理与前缀缓存 | 跨层KV共享、线性attention、自动复用上一层attention结果 |
| Slime | RL后训练基础设施；连接训练引擎、rollout引擎、数据缓冲、奖励/环境及同步 | 推理模型新增一层叫“Slime”的神经网络 |
| Muon | 训练时更新权重的优化器，可影响收敛效率与训练结果 | 推理时替代attention的算子或KV缓存结构 |

官方API还要求原顺序、原样返回历史思考块，服务端与Coding Plan默认值不同；这说明它属于上下文构造/接口行为，不能与上述数值KV缓存复用混为一谈。[Thinking Mode官方文档](https://docs.z.ai/guides/capabilities/thinking-mode)、[实际聊天模板](https://huggingface.co/zai-org/GLM-5.3-Flash/blob/main/chat_template.jinja)。Slime的官方项目明确自称RL scaling训练框架。[Slime](https://github.com/THUDM/slime)。GLM官方对Muon的描述也是optimizer，而非attention网络模块。[GLM-4.5官方技术博客](https://z.ai/blog/glm-4.5)

## 研究员应该追的验证项

- 同一硬件、上下文长度、并发与内核，拆出索引扫描、主attention、KV容量/带宽、MoE/通信和调度的占比；避免把局部3倍节省翻译成全任务3倍提速。
- 共享前后做长上下文多跳、细粒度数字/代码标识符、跨文件依赖与位置扰动；同时报绝对成功率、完成任务token和成本。
- 运行时是否真的使用稀疏kernel。某些eager/SDPA参考路径只是用稀疏mask表达同一数学选择，可能仍计算稠密矩阵，不能拿这种路径代表架构可达到的吞吐。
- 区分训练无关改造、训练时已适配的模型、已经公开的权重配置、第三方后端支持及实际线上API；一个可选patch可支持DSA模型，不证明原模型出厂就启用了该patch。

原始核读片段与公开配置副本位于同目录 `arch-src/`，仅为研究底稿，不是网站资源。
