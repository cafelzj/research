# DeepSeek：2026 模型发布与技术演进

核验区间：2026-01-01 至 2026-11-14；访问日期：2026-11-14。以下均来自官方 API 文档、官方 Hugging Face 模型卡、官方 GitHub 与作者论文。

## 已核验模型和 API 时间线

| 日期与事件类型 | 发布对象 | 核心变化与研究解读 | 证据与边界 |
| --- | --- | --- | --- |
| 2026-01-27，仓库公告/开放代码和权重；论文提交为01-28 | DeepSeek-OCR 2，专项文档视觉模型 | DeepEncoder V2 在交给语言模型前按图像语义重新组织视觉 token，针对复杂文档版面与阅读顺序；不是新通用聊天底座。 | [原OCR仓库发布记录](https://github.com/deepseek-ai/DeepSeek-OCR)明确写01-27；[新仓库](https://github.com/deepseek-ai/DeepSeek-OCR-2)提供推理代码与模型下载；[论文](https://arxiv.org/abs/2601.20552)提交01-28。论文将方法表述为探索，不能说已经证明通用二维推理。 |
| 2026-04-24，官方公告+API+开放权重预览 | DeepSeek-V4-Pro / V4-Flash Preview | Pro 1.6T总参数、49B激活；Flash 284B、13B激活；均为1M上下文、思考/非思考双模式。CSA/HCA压缩注意力、mHC连接、Muon优化器和领域专家后训练组合，核心经济价值是长上下文缓存和计算效率。 | [发布公告](https://api-docs.deepseek.com/news/news260424/)、[V4模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)。属于Preview，不能混同08-13 Pro GA。公告中的开源SOTA等是厂商结论。 |
| 2026-07-31，API升级；正式权重模型卡可获取 | DeepSeek-V4-Flash-0731 | 官方明确主架构/主模型规模不变，重新后训练；重点加强agent，多了DSpark投机解码模块的权重封装。支持Responses API并适配Codex。说明不换大底座也能靠训练数据、RL和工具适配显著改善任务执行。 | [更新日志07-31](https://api-docs.deepseek.com/updates/)、[0731模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731)。日志说此次仅升级Flash API，Pro及App/Web当时未同步。模型卡比较表中Terminal Bench 2.1为61.8→82.7（官方自测）；max effort、DeepSeek Harness minimal、temperature=1、top_p=.95。DSBench两项为内部题集。 |
| 2026-08-13，App/Web/API正式版公告 | DeepSeek-V4-Pro GA，当前快照名DeepSeek-V4-Pro-0813 | 重点继续转向agent的真实工程执行；低/高/max三档思考预算，Responses API/Codex适配。模型卡说明基于Preview结构并附DSpark。峰谷价机制于UTC08-16 16:00即北京时间08-17 00:00生效，谷价为峰价一半。 | [GA公告](https://api-docs.deepseek.com/news/news260813/)、[0813模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813)。不要把“生产环境显著提升”当作独立企业样本证据。 |
| 2026-08-21，实验API+Files API | DeepSeek-V4-Flash-Vision-Exp | 在Flash体系加入图像理解和视觉agent能力；支持文图混合、base64/URL/file_id，三个兼容API协议。图片可上传一次反复引用，减少请求传输重复。 | [官方公告](https://api-docs.deepseek.com/news/news260821/)。实验版本，不等于04-24 Flash一开始就具备原生视觉；不应把“接近Opus-4.8”扩展为全面追平。 |
| 2026-09-10，官方模型/API/开放权重 | DeepSeek-V4.1-Flash，API别名deepseek-flash | 原生视觉+新CED因果编码器/解码器架构：552B是主干规模，输入预填充8B激活、输出解码16B激活，另含196B Engram等模块。CSA2、FP4 KV与有界重放共同降低缓存；针对输入密集、多轮agent链的成本结构优化。 | [09-10公告](https://api-docs.deepseek.com/news/news260910/)、[V4.1模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash)。“KV显存1/4、SSD1/8”比较对象是上一代Flash的KV，不是整模型显存/总成本。模型卡说明新底座从头进行多模态预训练，不能说只是Vision-Exp的改名。 |
| 2026-10-17，模型小版本+App/Web/API+开放权重；同时开放搜索服务 | DeepSeek-V4.1-Flash-1017 + Search/Fetch | 后训练小版本加强推理、编程、视觉与agent；官方说明自反馈RL支持从零开发项目，减少任务耗时和输出长度。搜索/抓取API另行开放，不是模型参数知识变成实时。 | [10-17公告](https://api-docs.deepseek.com/news/news261017/)、[1017模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017)。同一官方表中Terminal-Bench 4.0 31.2→42.3，DeepSWE v1.1 74.2→77.0；前者Claude Code、后者Mini-SWE-V2。不是独立测评。API名和token价当日不变。 |
| 2026-11-13，应用能力API扩展 | 完整App功能API，底座仍V4.1-Flash | 服务端组合联网、深度搜索、文件输入、URL读取等，另有OCR/ASR/TTS独立接口。开发者可复用检索和上下文拼装系统，减少自建管线；属于系统/接口升级，不是V4.2底座首发。 | [11-13官方公告](https://api-docs.deepseek.com/news/news261113/)。工具按调用/页/语音用量另收费；因此单token降价不能直接推断完整agent任务同比例降本。 |

## 重要机制与含义

1. **04-24突破重点是长上下文经济性。** V4模型卡在1M上下文、单token推理条件下，报告Pro相对V3.2约27% FLOPs、10% KV缓存。不能改写为所有任务便宜90%或总显存只需一成。1M窗口是可接收上限，长文检索、跨文件依赖、位置偏差仍需另测。
2. **07-31到08-13主要体现后训练与系统适配的价值。** 模型规模没有同比大增，但agent官方自测显著提高，不能把性能提升机械归因参数数量。完整任务质量还受harness、工具权限、上下文管理和重试预算影响。
3. **09-10是架构层变化。** CED分开输入与输出计算、共享/压缩KV；Engram把一部分固定知识模式变成稀疏查表，DSpark降低逐token解码的等待。8B/16B激活说明每token运算路径，不代表一张8B稠密模型显存就能部署；552B主干也不是权重文件所有参数。
4. **10-17改善任务性价比。** 相同定价下若输出更短且重试更少，单任务费用仍可下降。但官方“Pareto改进”有特定基准、模型设置与代理框架边界，应再看自家任务成功率、p50/p95时延、工具调用成本、人工接管率。
5. **11-13属于模型产品化。** API把模型、检索、文档解析、语音等串起来。接入搜索不会自动保证证据可靠；搜索源质量、正文抓取、引用是否支持结论仍要单独检验。对行业研究者，最有价值的改进是资料输入与证据链，而不是只看考试榜单。

## 不能混算的研究/基础设施节点

| 日期 | 节点 | 应如何分类 |
| --- | --- | --- |
| 2025-12-31首次论文，2026-01-05修订 | [mHC论文](https://arxiv.org/abs/2512.24880) | 连接架构研究。2026修订可作背景，不能计为2026新通用模型。 |
| 2026-01-12论文，07-12修订 | [Engram论文](https://arxiv.org/abs/2601.07372)与[官方实现](https://github.com/deepseek-ai/Engram) | 条件记忆/稀疏查表研究；之后V4.1模型卡明确采用196B Engram，才能把“研究机制”与“已部署底座”连接。并非1月已发布V4。 |
| 2026-07-06论文 | [DSpark](https://arxiv.org/abs/2607.05147)及[DeepSpec官方训练评测代码](https://github.com/deepseek-ai/DeepSpec) | 投机解码/推理系统研究。半自回归草稿+按置信度与负载选择验证长度；作者报告在其V4线上系统相同吞吐下相对MTP-1单用户速度快60%—85%，不是任意GPU/任意模型普适加速比。 |

## 官方文档冲突与别名核对

- 09-10新闻页仍写“09-14将Pro调用转到Flash”，但[更新日志09-10条](https://api-docs.deepseek.com/updates/)明确后续决定继续提供V4 Pro；截至核验时[定价页](https://api-docs.deepseek.com/quick_start/pricing/)仍列V4-Pro-0813。因此不能说Pro已于09-14下线。
- 当前deepseek-flash实际版本是V4.1-Flash-1017；旧deepseek-v4-flash、deepseek-v4-flash-vision-exp字符串仍可用，但对应旧模型已停用并路由到新Flash。别名字符串不等于可复现模型快照。官方[首调文档](https://api-docs.deepseek.com/)与当前定价页共同支持。
- 2025-12-01 V3.2、2025-05-28 R1-0528、2025-01-20 R1均不算2026首发。2026年初主线沿用V3.2，官方API发布日志第一项2026通用模型事件是04-24 V4。
- V4.1-Pro在09-10页中是未来计划；本轮查到的官方发布日志截至11-13没有其正式发布条目，不计为已发布。

## 评测与价格口径

- Terminal-Bench 2.1、3.0、4.0互非同一个题集版本；DeepSWE与DeepSWE v1.1同样不能混成一条增长曲线。
- HLE文本子集与完整HLE不可横向直接比。HLE有工具/无工具、ZeroBench Pass@5/其他Pass@1亦要明确区分。
- 0731官方表明确max effort、temperature=1、top_p=.95；V4.1 Instruct模型卡表注明max数字预算100。更长思考预算本身增加成本与时延，不能和其他模型默认模式混比。
- 截至11-14官方美元价每百万token，Flash高峰cache-hit/miss/output分别0.006/0.30/1.20；Pro分别0.044/1.32/3.96，谷价减半。这是现价快照，不应回填成全年历史价。搜索与fetch各0.75美元/千次，11-13后额外文件/语音能力另计费；见[官方现价页](https://api-docs.deepseek.com/quick_start/pricing/)。

## 可用于核对的短原文（每来源最多一处）

- 04-24公告："Preview is officially live & open-sourced"。
- 更新日志07-31："was only re-post-trained"。
- 0731模型卡："superseding the preview version"。
- 08-13公告："Native OpenAI Responses API support"。
- 08-21公告："This experimental multimodal model"。
- V4.1模型卡："552B backbone parameters"。
- 10-17公告："reinforcement learning with self-feedback"。
- 1017模型卡："is a minor update"。
- 11-13公告："tool calls and context assembly handled server-side"。

以上官方分数、比较结论均为作者/厂商自报，本节未做模型实测或独立复现。
