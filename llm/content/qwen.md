# Qwen / 通义：2026 模型发布与技术演进

核验范围：2026-01-01 至 2026-11-14。只把一手材料支持的事件放入主线；公告、权重、API 上线、快照和平台扩区分别标注。以下“解读”为机制与研究含义，不是独立实测结论。

## 详细发布时间线

| 日期与类型 | 事件 | 主要变化与研究解读 | 主要证据 |
| --- | --- | --- | --- |
| 01-08，技术报告；01-21/29 国内 API | Qwen3-VL-Embedding / Qwen3-VL-Reranker（2B/8B） | 将文本、图像、截图和视频放入统一检索空间，Embedding 召回、Reranker 重排，补的是 RAG 的“找资料”环节，不能误称对话底座换代。开放仓库 Apache-2.0；文本版 Qwen3-Embedding 的原发布是 2025-06，不能因 HF 今年更新而算今年新发。 | [技术报告，01-08 提交](https://arxiv.org/abs/2601.04720)、[官方仓库](https://github.com/QwenLM/Qwen3-VL-Embedding)、[阿里云逐日 API 日志](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) |
| 01-22，权重 | Qwen3-TTS 0.6B/1.7B | 声音克隆、自然语言设计声音、情绪与语速控制；12Hz 编码器和流式生成降低语音交互等待。属于输出模态专用模型，不是通用文本智力排行。 | [官方仓库 News](https://github.com/QwenLM/Qwen3-TTS)、[报告](https://arxiv.org/abs/2601.15621) |
| 01-22，API 快照 | Qwen3-VL-Flash-2026-01-22 | 更新混合思考/非思考视觉理解，官方特别提到安防、巡店、设备监控、拍照解题的识别准确性。是已有 VL 线升级，不是 Qwen3.5 提前发布。 | [API 日志](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) |
| 01-23，API/快照；01-27，云社区解读 | Qwen3-Max-Thinking / qwen3-max-2026-01-23 | 混合思考/非思考；推理时可按需检索、抽取网页、执行代码；测试时扩展进一步提高推理成绩。知识内化和工具增强需分开，官方有工具与无工具成绩不能混为一榜。 | [官方解读](https://www.alibabacloud.com/blog/pushing-qwen3-max-thinking-beyond-its-limits_602834)、[API 日志的 01-23 条目](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) |
| 01-26，国内 API | Qwen3-VL-Plus | 视觉编程、空间感知、多模态推理、视觉 Agent 和超长视频理解升级；属于 Qwen3-VL 已有系列的 API 升级。 | [API 日志](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) |
| 01-29，权重 | Qwen3-ASR 0.6B/1.7B + ForcedAligner-0.6B | 识别 30 种语言、22 种中文方言，统一流式/离线；强制对齐把文本与音频时间戳对上。研报会议、视频资料的可检索化改善，不能推断财务数字识别已经足够可靠。06-26 原生 Transformers 支持是工程接入升级，不是第二次底座首发。 | [官方仓库 News](https://github.com/QwenLM/Qwen3-ASR)、[报告](https://arxiv.org/abs/2601.21337) |
| 02-03，权重/发布材料；02-20，阿里云 API | Qwen3-Coder-Next，80B 总量/3B 激活 | 以 Qwen3-Next 为底座，把可执行任务合成、环境交互、RL 用于长程编程、工具使用、失败恢复。262,144 原生上下文，**只有非思考模式**；不是缺少长程推理能力，而是不输出独立 think 块。Apache-2.0。 | [官方模型卡](https://huggingface.co/Qwen/Qwen3-Coder-Next)、[官方文章](https://www.alibabacloud.com/blog/qwen3-coder-next-pushing-small-hybrid-models-on-agentic-coding_602864)、[官方 README](https://github.com/QwenLM/Qwen3-Coder) |
| 02-15，云 API；02-16，代际发布与权重 | Qwen3.5-Plus / Qwen3.5-397B-A17B | 原生视觉语言早融合，Gated DeltaNet + Gated Attention 混合架构，稀疏 MoE 与大规模环境 RL，覆盖 201 种语言及方言。397B 总量、17B 激活；开放权重 Apache-2.0，262,144 原生/扩展至约 1M；云端 Plus 默认 1M 并提供内置工具。 | [官方模型卡](https://huggingface.co/Qwen/Qwen3.5-397B-A17B)、[官方系列仓库 News](https://github.com/QwenLM/Qwen3.8)、[官方发布博客](https://qwen.ai/blog?id=qwen3.5) |
| 02-23，Flash/API；02-24，权重扩展 | Qwen3.5-122B-A10B、35B-A3B、27B；Qwen3.5-Flash | 把相同代际能力铺到不同吞吐/内存成本点，27B 为稠密、其他为 MoE。研究时要比较完整模型显存、精度、并发与任务成功率，不能只比激活参数。 | [官方系列仓库日期](https://github.com/QwenLM/Qwen3.8)、[API 日志](https://www.alibabacloud.com/help/en/model-studio/newly-released-models) |
| 03-02，权重扩展 | Qwen3.5-9B/4B/2B/0.8B | 小尺寸原生视觉语言模型扩大端侧/本地应用选择；小模型的“接近大模型”须限定具体任务，不可等同所有推理任务。 | [官方系列仓库 News](https://github.com/QwenLM/Qwen3.8)、[9B 模型卡](https://huggingface.co/Qwen/Qwen3.5-9B) |
| 03-25，国际 Plus-Realtime API；03-30，多版本 API；04-17，报告 | Qwen3.5-Omni（Plus / Flash / Realtime） | 扩展音频、视频理解和交互；报告描述混合注意力 MoE Thinker/Talker 及 ARIA 文本/语音动态对齐，改进流式合成的稳定性与韵律。报告与 API 的语言覆盖口径不同，不能拼接成“一个开源型号支持一切”。 | [技术报告](https://arxiv.org/abs/2604.15804)、[API 日志](https://www.alibabacloud.com/help/en/model-studio/newly-released-models)、[Omni API 文档](https://www.alibabacloud.com/help/en/model-studio/qwen-omni) |
| 04-02，API/公告 | Qwen3.6-Plus | 强化 Agent 编程、前端与完整工程，升级 OCR、目标定位、通用物体感知并修复 3.5 已知问题，属于从“能力能展示”到“任务更稳定”的迭代。 | [官方新闻稿，04-02](https://www.alibabacloud.com/en/press-room/alibaba-unveils-qwen3-6-plus-to-accelerate-agentic?_p_lc=1)、[技术解读](https://www.alibabacloud.com/blog/alibaba-unveils-qwen3-6-plus-to-accelerate-agentic-ai-deployment-for-enterprises-and-alibaba%E2%80%99s-ai-applications_603005) |
| 04-16，权重与 API | Qwen3.6-35B-A3B / Qwen3.6-Flash | 35B 总量、3B 激活，维持 3.5 混合架构，强化仓库级/前端 Agent；引入 `preserve_thinking` 保留多轮历史思考状态，减少迭代任务丢失中间状态。Apache-2.0。 | [模型卡](https://huggingface.co/Qwen/Qwen3.6-35B-A3B)、[官方 News](https://github.com/QwenLM/Qwen3.8) |
| 04-20，API 预览 | Qwen3.6-Max-Preview | 更大闭源 Max 预览，文本输入、思考、显式缓存与工具调用；定位更强编程与更有效率的 Agent，不等于全量正式版或权重开放。 | [官方博客](https://qwen.ai/blog?id=qwen3.6-max-preview)、[API 日志](https://docs.qwencloud.com/changelog/models) |
| 04-22，权重；04-23，API | Qwen3.6-27B | 27B 稠密模型，延续编程与 STEM 升级，视觉定位/空间智能进一步增强。不要把同代 35B-A3B 的激活参数与 27B 全激活直接当容量排名。 | [官方 News](https://github.com/QwenLM/Qwen3.8)、[27B 官方博客](https://qwen.ai/blog?id=qwen3.6-27b)、[模型卡](https://huggingface.co/Qwen/Qwen3.6-27B) |
| 04-23，API 快照 | Qwen3.5-Plus-2026-04-20 | 旧代际也继续升级 Agent 编程和推理速度；说明稳定 alias、带日期 snapshot 与“代际号”是三套身份，不能只按 3.5/3.6 高低猜现有 API。 | [API 日志](https://docs.qwencloud.com/changelog/models) |
| 05-21，公告/API | Qwen3.7-Max | 以扩展训练环境追求跨 harness 长程 Agent、编程和办公工作流。官方 35 小时/千次工具调用是一个展示样本，不能当任意企业任务的可靠性统计。首版文本模型；视觉要看 06-08 快照。 | [官方解读，05-21](https://www.alibabacloud.com/blog/qwen3-7-the-agent-frontier_603154)、[API 日志](https://docs.qwencloud.com/changelog/models) |
| 06-01，API；06-03，云社区解读 | Qwen3.7-Plus / 05-26 快照 | 文本能力叠加视觉 Agent，GUI 与 CLI 混合操作、视觉参考编程、手机 App 任务；`preserve_thinking` 延续。所谓全模态应按 API 支持检查：本篇示例为文本、图片/视频，不可自动等同音频原生输入输出。 | [官方解读](https://www.alibabacloud.com/blog/qwen3-7-plus-multimodal-agent-intelligence_603206)、[API 日志](https://docs.qwencloud.com/changelog/models) |
| 06-10，API，06-08 快照 | Qwen3.7-Max-2026-06-08 | Max 版加入视觉理解与多模态交互 Agent，不能把该能力倒写到 05-21 纯文本首版。 | [API 日志](https://docs.qwencloud.com/changelog/models) |
| 07-19，Qoder 渠道预览已可用/优惠起始记录 | Qwen3.8-Max-Preview | 官方优惠规则以 07-19 为开始日，并明确可在模型选择器切入预览版，足以核实该渠道当日已可用，不能单独证明这是全平台最早首发日；2.4T、编程与办公定位，持续迭代。这里不能把“将开放权重”写成当日已开权重。 | [官方预览活动及精确开始日](https://help.aliyun.com/en/lingma/qwen3-8-max-preview-limited-time-offer) |
| 07-25，API，07-15 快照 | Qwen3.7-Flash | 相比 3.6-Flash 增强物体识别、真实场景空间智能、Search/CI Agent、多模态编程；属于成本效率档升级。 | [API 日志](https://docs.qwencloud.com/changelog/models) |
| 08-03，API 正式版 | Qwen3.8-Max | 2.4T 级 MoE，多模态、默认 1M、思考/非思考和工具生态；显著强化工程、办公、研究及长程执行。07-19 Qoder 渠道预览已可用、08-03 正式云端、08-12 开放权重是三个不同事件。 | [官方博客](https://qwen.ai/blog?id=qwen3.8)、[API 日志](https://docs.qwencloud.com/changelog/models)、[官方预览升级通知](https://www.alibabacloud.com/en/notice/alibaba_cloud_model_studio_model_upgrade_notice_81a?_p_lc=1) |
| 08-11，API | Qwen3.7-Text-Embedding | 新托管多语言文本向量接口，256–2560 维可选；与 2025 的开放 Qwen3-Embedding 不是同一次首发，托管模型没有由此自动开权重。 | [API 日志](https://docs.qwencloud.com/changelog/models) |
| 08-12，权重；08-13，托管 API | Qwen3.8-2.4T-A95B | 第一次开放 Max 级参数模型，2.4T 总量/95B 激活，支持思考强度和历史思考保留。**开放版纯文本，不支持云端 Max 的全部功能；许可证自定义 qwen3.8-max。** | [官方 News](https://github.com/QwenLM/Qwen3.8)、[模型卡与许可证标识](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B) |
| 08-14，权重；08-19，托管 API | Qwen3.8-27B | 27B 稠密视觉语言，侧重文字和视觉场景的编程/办公任务，改善端到端交付；较适合企业本地化复现，但仍须按量化、框架和业务数据测试。 | [官方 News](https://github.com/QwenLM/Qwen3.8)、[官方卡](https://huggingface.co/Qwen/Qwen3.8-27B) |
| 08-26，Flash API/架构发布；08-27，官方解读；08-31，论文 | Qwen3.8-Flash / 开放 Flash-Next | 125B 主模型+51B n-gram embedding，6B 激活；GDN+QSA、四路 Gated Residual、主存表预取、Muon 协同优化。开放版 262K 原生+YaRN，托管 Flash 默认 1M 和内置工具；不是完整 Qwen4 已经正式发布。 | [官方架构解读](https://www.alibabacloud.com/blog/qwen-3-8-flash-next-a-new-architecture-towards-ultimate-cost-efficiency_603501)、[论文](https://arxiv.org/abs/2608.30320)、[仓库](https://github.com/QwenLM/Qwen3.8-Flash-Next) |
| 09-02，API 快照 | Qwen3.8-Max-0902 / qwen3.8-max-2026-09-02 | 编程、协同 Agent、图表推理/文档理解升级；保留 1M、思考与工具生态。这是既有 Max 改版，不是“Qwen3.9”。 | [API 日志](https://docs.qwencloud.com/changelog/models) |
| 09-18，API；09-22，技术报告 | Qwen3.8-Omni-Flash；09-21 Realtime | 基于 Flash-Next，原生文本/图片/音频/视频理解与长程 Agent，1M context；Qwen-MM-Plugins 接入现有 Agent，Qwen-Live-Harness 管理实时状态。**非 realtime 版输出文本；语音输出要区分 Realtime 型号。插件开放不等于 Omni 模型权重已开放。** | [论文](https://arxiv.org/abs/2609.25611)、[官方 API 说明](https://www.alibabacloud.com/help/en/model-studio/qwen-omni)、[发布日志](https://docs.qwencloud.com/changelog/models) |
| 11-11 10:00（UTC+8），限时 API 预览 | Qwen4-Max-Preview | Token Plan 专享，非按量付费，预览至 11-25 24:00 后退役；原生视觉、深推理、工具和结构化输出，1M context，393,216 总输出预算。新语义：`max_tokens` 合并思考+最终答案预算；默认保留历史思考。当前没有据此证明所有 Qwen4 家族/权重已全面发布。 | [官方预览规格与时间](https://docs.qwencloud.com/developer-guides/getting-started/latest-model)、[发布日志](https://docs.qwencloud.com/changelog/models) |

## 机制解读与批判性结论

1. **3.5 的核心是训练/架构基础改变，3.6/3.7 重心转到把任务跑完。** GDN 把历史压到状态中，隔层全注意力补精确访问，再结合 MoE 降每 token 计算；因此“总参数大、激活少”可以同时出现。但少激活不等于同等比例少显存：权重仍要存储/分布，专家路由、通信和 KV 状态都要算。3.6 的历史思考保留影响多轮任务状态，3.7 的环境扩展影响泛化范围，二者不是单纯继续堆预训练参数。

2. **Flash-Next 值得比 Max 的一个排行榜更深入地研究。** GDN 压缩历史、QSA 以小块选信息，减的是长序列注意力和索引成本；Gated Residual 改信息流；N-gram 表给局部模式记忆且可放主存，Muon 与架构一起改训练稳定性和超参。论文明确指出更低 loss 不总意味着更高下游分数，n-gram 词表扩大后精度会饱和。该事实直接反驳“更多容量必定更好”的简单宣传。

3. **成本宣传不能直接翻译成终端用户收益。** 论文“约 1/9”比较的是训练 FLOPs，并伴随更少训练 token/激活参数，不是每次用户调用便宜九倍。官方 8.6 倍 prefill 吞吐采用 1M 上下文和 90% prefix-cache 命中的特定实验；短输入、低命中、通信瓶颈或低并发不应照搬。真实研究指标应为同硬件/精度/并发下的 TTFT、tokens/s、峰值显存、工具费、重试率与每成功任务总成本。

4. **长上下文、长期执行、永久记忆不同。** 1M 是一次请求可接收的窗口上限，`preserve_thinking` 是多轮协议保留中间状态；框架的存储/压缩/检索才构成长时记忆系统。单次 35 小时 demo 或一套自动演进仓库不能识别通用成功率，必须有任务样本分母、超时/人工介入统计与失败类型。

5. **排行榜不能当成控制变量实验。** 3.8 大卡表头列的是 Qwen3.8-Max，而非保证所有分数由开放纯文本 2.4T 同设置复现；Terminal Bench 比较中其他模型取各自最好公开 harness，DeepSWE 取多个 harness 最优；若引入代码解释器、搜索、工具以及“改正过的题目集”，必须列设置。跨发布文章不同 AIME 集、SWE harness、输出预算/重复采样不可直接算提升百分比。

6. **API 品牌与模型权重必须拆开。** Plus/Max/Flash 是服务产品档，不是稳定的参数尺寸；alias 可能更新，snapshot 才固定一个版本；地区开通晚数周不是底座又发布一次。3.8 开权重版本纯文本且自定义许可证，是本次最容易被二手新闻写错的两点。Qwen4 此刻只有限时 Preview，Flash-Next 是架构先行材料，二者不证明完整第四代开放。

## 其他事件如何归组，避免主线失焦

- 图像生成/编辑：Qwen-Image-2.0、2.1、Turbo 等应该放“生成视觉专用模型”附录，不能混入通用 LLM 智力升级榜。Wan、HappyHorse、HappyOyster 也不是 Qwen 文本底座。
- Qwen-Audio-3.0/3.1 以及 LiveTranslate 可做语音附录：07-14 TTS，07-30 ASR，08-10 双工交互；09-17 LiveTranslate3.8，09-20/21 Audio3.1-Realtime/ASR，10-12/21 TTS Flash/Plus，10-22 TTS-Next（统一声音/环境音/语音生成），10-27 双工 Flash。这些日期来自官方云日志，地区不同可有后续重复记录。
- Qwen Code、Qoder、QwenWork、浏览器插件是应用/Agent框架层，其功能升级不能作为新的底座型号发布；本报告只在解释模型能力如何落地时引用。
- `Qwen3.8-Max-Prime` 在第三方路由目录可见，但此次未在官方型号目录和发布文中核实为新权重/质量升级，不放主表，也不凭更高价格推出更强能力。
- 07-19 Qwen3.8-Max-Preview 日期最终找到一手佐证：Qoder CN 官方限时优惠页明确开始日 07-19、结束 08-03 10:00，且写明可以切换模型。该证据证明服务当日可用，不单独证明全球首次公开公告的精确时刻。官方升级通知另证明08-05预览 alias 路由到正式版。

## 关键短原文（每源不超过 25 个英文词）

- Qwen3.8 开放卡："vision input & non-thinking support" 被列为官方云端 Max 的额外能力；许可证显示 "qwen3.8-max"。
- Coder-Next 卡："supports only non-thinking mode"。
- Qwen3.6 卡："retain reasoning context from historical messages"。
- Qwen4 文档："available through Token Plan only"；"the model will be retired after the preview ends"。
- Flash-Next 论文："Loss and downstream accuracy do not always move together"。

以上来源均为本轮实时读取的一手资料；没有独立跑 benchmark、没有采集真实调用账单，也没有确认所有地区访问权限。
