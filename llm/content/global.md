# 2026 海外主要模型：发布与技术解读

根据官方公告与技术正文整理海外主要模型，用于比较 Kimi、GLM、Qwen、DeepSeek 的演进，未声称穷尽所有海外小版本。日期保留官方英文站发布日；中国时间可能次日。以下商业模型均未在这些公告中公开完整可复现训练配方，不能把产品效果反推为已证实的架构机制。

## 海外核心发布时间线

| 日期与事件类型 | 模型/家族 | 经官方正文确认的变化 | 研究解读及限制 | 来源 |
| --- | --- | --- | --- | --- |
| 02-05正式发布；02-12另有Spark研究预览 | GPT-5.3-Codex | 结合前代Codex编码能力与GPT-5.2推理/专业知识；官方称快25%，强调持续执行、工具及交互中途纠偏。Spark另定位低延迟编码。 | 编码与通用代理栈开始汇合；Codex应用/CLI是运行环境，不能把产品并行会话视作模型架构。演示游戏有skills与预设追问，不是完全无干预。 | [5.3-Codex](https://openai.com/index/introducing-gpt-5-3-codex/)、[Spark](https://openai.com/index/introducing-gpt-5-3-codex-spark/) |
| 02-05、02-17；04-16、05-28后续迭代 | Claude Opus4.6/Sonnet4.6→Opus4.7/4.8 | Opus4.6带自适应思考、effort、上下文压缩beta、1M输入beta及128k输出；4.7进一步改善视觉/持续工作，更新tokenizer；4.8延续判断与工具效率提升。 | 长上下文、推理预算和压缩是不同维度；4.7同一输入可能变为1.0–1.35倍token，单价不变不代表成本不变。4.6高effort也可能简单任务过度思考。 | [Opus4.6](https://www.anthropic.com/news/claude-opus-4-6)、[Sonnet4.6](https://www.anthropic.com/news/claude-sonnet-4-6)、[4.7](https://www.anthropic.com/news/claude-opus-4-7)、[4.8](https://www.anthropic.com/news/claude-opus-4-8) |
| 02-19预览上线 | Gemini3.1 Pro | 升级核心推理，API/Vertex/应用等分渠道推出；官方ARC-AGI-2为77.1%。 | 图形生成与多API综合是应用样例，不能直接推出所有研究任务能力翻倍；77.1%是特定基准，不是通用智能百分比。 | [3.1 Pro](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/) |
| 03-05正式发布；03-17小模型发布 | GPT-5.4/Pro、mini/nano | 主线模型纳入5.3-Codex能力、原生computer use、1M上下文和tool search。mini支持图像/工具/电脑操作，400k上下文；官方提出大模型协调、小模型并行分工。 | 从生成答案转向执行完整工作流；tool search可减少把大量工具定义塞进上下文的负担。编排、工具和模型必须分开归因。 | [5.4](https://openai.com/index/introducing-gpt-5-4/)、[mini/nano](https://openai.com/index/introducing-gpt-5-4-mini-and-nano/) |
| 04-23产品发布；04-24 API可用 | GPT-5.5/Pro | 更擅长模糊多步骤任务、代码/电脑/文档及早期科研；官方称保持5.4的每token延迟，同时完成相同Codex任务用更少token。 | 每token延迟、总token数、重试数合起来才决定完成时间和费用。4/23不能写成API同步首发，官方次日才补API可用。 | [5.5](https://openai.com/index/introducing-gpt-5-5/) |
| 05-19正式可用 | Gemini3.5 Flash | 3.5家族先推出Flash，强调长程编码/代理、速度和多模态；配合Antigravity子代理。公告当时3.5 Pro仍是未来计划。 | Flash说明高能力可下沉到低延迟层级；官方“4倍速度”是输出token速度比较，不等于完整任务4倍。不能将同期预告3.5 Pro算当日已发布。 | [3.5](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/) |
| 04-07受限Mythos Preview；06-09发布Fable5/Mythos5；06-12暂停；07-01恢复 | Claude Mythos/Fable新层级 | 官方明确Fable5与Mythos5是同一底座，区别在安全防护与准入；强调长程软件/视觉/科学工作。Mythos最初面向Glasswing伙伴。 | 同一底座的两种服务策略不能算两次架构突破。必须记录暂停与恢复，而不只写首发。底座能力、生产防护、降级模型都会影响用户结果。 | [Glasswing](https://www.anthropic.com/glasswing)、[Fable5/Mythos5与状态更新](https://www.anthropic.com/news/claude-fable-5-mythos-5) |
| 06-26有限预览；07-09扩大产品/API可用 | GPT-5.6 Sol/Terra/Luna | 固定能力层级命名；max增加单代理推理时间，ultra默认4代理并行；Programmatic Tool Calling可在程序中筛选中间结果，减少模型往返。 | ultra是多代理系统配置，不是独立底座；预算应计所有子代理token。部分演示与成本/延迟是离线模拟，不能当实际生产SLA。 | [预览](https://openai.com/index/previewing-gpt-5-6-sol/)、[7/9发布](https://openai.com/index/gpt-5-6/) |
| 09-02发布（此前07–08月3.6/3.7快速迭代） | Gemini3.8 Flash/Flash Cyber | 普通版与Cyber共享基础智能，后者经Fairwind面向可信防御者；更长推理、反复调用工具/验证，初始输入/输出$0.75/$3.75每百万token。 | 官方直言高难度任务可能花更多token；与3.7同单价不能推得同任务费用。长程代理能力增强与安全准入是两件事。 | [3.8](https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/) |
| 09-03发布并分批开放 | GPT-6 Astra | 预训练、强化学习与对齐进步；强调电脑操作、浏览、专业工作、科学和安全。官方同时升级Codex harness，报告Mind2Web完整体验约1.9倍速度。 | 体验提速包含模型与运行框架两个来源；不能全归模型。个别ARC/数学基准近饱和，也不等于已证明通用能力饱和。 | [Astra](https://openai.com/index/gpt-6-astra/)、[官方09-03安全说明](https://openai.com/index/safety-overview-gpt-6-astra/) |
| 09-15发布5.1；11-09发布5.2 | Claude Fable/Mythos5.1→5.2 | 5.1改善长程科学/编码与防护误报，主要通过缓存费降价；5.2更强编码、推理、视觉、科学，token输出快至30%，输入/输出降至$8/$40。仍是同底座、不同准入。 | 高阶层级逐步进入科研工作；模型给出的数学/生物结论仍需独立证明或实验。原文明确最开放复杂任务选Fable，多数日常从Opus5.5开始，并非最新最贵总适合。 | [5.1](https://www.anthropic.com/claude-fable-and-mythos-5-1)、[5.2](https://www.anthropic.com/claude-fable-and-mythos-5-2) |
| 09-22发布Sol/Luna；09-29发布6.1 Sol；10-26 Terra补位 | GPT-6向成本层级下沉 | Sol/Luna沿用Astra类似训练方法，降低API单价；6.1 Sol加强编码/电脑/专业工作，价格$2/$10、缓存$0.10每百万token。Terra见10/26官方模型日志。 | 竞争从最高分扩展到每成功任务成本；“Astra五分之一价格”是标准token单价，不能保证所有任务总费用五分之一。6.1 Sol发布时在Work/Codex/API，并非Chat页。 | [Sol/Luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/)、[6.1 Sol](https://openai.com/index/introducing-gpt-6-1-sol/)、[模型日志](https://help.openai.com/en/articles/9624314-model-release-notes) |
| 09-22 Opus5.5、09-28 Sonnet5.5、10-07 Haiku5.5 | Claude5.5成本/吞吐家族 | Opus5.5输入/输出$4/$20、缓存$0.20；官方典型工作量成本降40%，输出快30%+。Sonnet及Haiku进一步覆盖日常与高并发、子代理；Haiku首次支持effort。 | 40%不是token单价降40%：输入/输出降20%、缓存降60%，且任务少用token。不同层级能分工，最终应测质量门槛下成本/延迟，而不是只比API标价。 | [Opus5.5](https://www.anthropic.com/claude-opus-5-5)、[Sonnet5.5](https://www.anthropic.com/claude-sonnet-5-5)、[Haiku5.5](https://www.anthropic.com/claude-haiku-5-5) |
| 09-30受限发布；10-13开发者/用户开放 | Gemini4 Argon | 强化长程工作、代码迁移与专业任务；输出上限由64k提高到1M；最初是Fairwind可信防御者，10/13才全球API/订阅渠道开放。 | 此处1M是输出上限，别误写为首次1M输入上下文。更大的输出预算可能显著增加长任务费用；公告和普遍可用日期必须分开。 | [09-30 Argon](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)、[10-13开放](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/) |
| 10-28可信伙伴；11-10广泛付费API/Ultra上线 | Gemini4 Carbon | 更深入的长程代码/科研与验证循环；比Argon可能用更多token，Antigravity /swarm预览让模型分工；11/10初始$2/$10，11/30后将是$4/$20。 | 不把10/28受限测试等同普通开发者可用。价格有临时促销，不能据初始价判断长期毛利或永久相对成本。/swarm是系统功能，不是第二个模型发布。 | [10-28](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/)、[11-10](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/) |

## 评测可比性的具体反例

1. GPT-5.4公告将5.3-Codex的OSWorld-Verified结果从原64.7%改为74.0%，原因是API参数保留原始图像分辨率。不是新底座，更不是模型“突然进化”。[官方表脚注](https://openai.com/index/introducing-gpt-5-4/)
2. Opus4.7公告将4.6的CyberGym从66.6改为73.8，原因是harness参数；SWE-bench Multimodal还是内部实现，不可直接对照公共榜单。[官方评测脚注](https://www.anthropic.com/news/claude-opus-4-7)
3. Fable5.1的OSWorld2.0同一模型可报告77.9% partial、41.7% strict；任务版本又是2026年8月。若只抄77.9而与旧严格全成功率比，会制造虚假进步。[5.1方法与表](https://www.anthropic.com/claude-fable-and-mythos-5-1)
4. GPT5.6的ultra默认4代理，速度以根代理计、费用/token统计所有代理；多代理不能和单代理不标预算地排一张榜。[5.6脚注](https://openai.com/index/gpt-5-6/)
5. 前沿性能=模型能力×工具权限×推理预算×运行框架×验证/降级策略；这五者不能从营销基准中拆不清。上述为分析框架，不是厂商披露的数学恒等式。

## 其他海外模型主线

- Mistral：03-16 Small4，把推理/多模态/编码归到统一模型；05-22 Medium3.5，128B dense、256k、开放权重但modified MIT而非原MIT；10-06 Large4，open weight不自动等于无约束开源。[Small4](https://mistral.ai/news/mistral-small-4/)、[Medium3.5](https://mistral.ai/news/vibe-remote-agents-mistral-medium-3-5/)、[Large4](https://mistral.ai/news/mistral-large-4/)
- Grok：07-16 Grok4.5、08-12 Grok4.6、09-21 Grok4.7；4.7官方明确更大底座、在更难且耗时更长任务上更长RL训练，改善自验证与上下文。公开性能对比混用各家harness/effort，不能据此直接跨家排名。[4.5](https://x.ai/news/grok-4-5)、[4.6](https://x.ai/news/grok-4-6)、[4.7](https://x.ai/news/grok-4-7)。4.20的04-07是system-card日期，不据此认定首发，故不收入主时间线。
- Meta：2026主线已转向Muse品牌，不能臆造Llama5发布日期。已检到官方04-08 Muse Spark与10月Muse Wonder/Wonder Full文章；后者官方原站公告日为10-12、网页更新为10-13，已由datePublished/dateModified元数据区分，保留英文站日期；Wonder可在Meta Model API/Muse Code使用，Full在Muse Code订阅提供。[Muse Spark](https://about.fb.com/news/2026/04/introducing-muse-spark-meta-superintelligence-labs)、[Muse Wonder](https://about.fb.com/news/2026/10/introducing-muse-wonder-models/)。Muse个人代理产品和Muse模型品牌需分开。

## 信息边界

- 证据包括官方公告和部分 system card；绝大部分原始评测未独立复跑，性能结论保留为官方报告或声称。
- 未将2025 GPT5.2、Claude4.5、Gemini3初发等放入2026发布条目；年内调系统提示词、退役旧模型、Voice/图片产品迭代也不自动当底座大版本。
- 未穷尽全部语音/视觉专用模型、所有低延迟硬件服务和区域上市变动。重点是通用/推理/编码与代理能力主线。
- Grok4.6日期已核官方正文为08-12；新闻列表摘要相邻项容易误读为08-14。主表日期均有官方正文支持。
