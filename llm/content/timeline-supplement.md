# 发布与服务补充时间线：语音、海外厂商及月度记录

本表收录各厂商专题正文中的补充节点，与主要发布时间线合并检索。同一型号的同一事件只计一次；模型、接口服务、研究介绍、资料转引分开标注。日期仅能核到月时保留 `YYYY-MM`，不补造具体日；月度条目的显示位置不表示发生在该月第一天。

## Kimi：批处理、服务退役与托管代理

以下日期来自月粒度官方 API 更新日志；不把服务变化计作新底座。K2.7 Code、K3 的模型/API 主节点已分别列入主要发布表，不重复添加。

| 日期与性质 | 厂商 | 发布对象 | 类型 | 机制与解读 | 边界与来源 |
| --- | --- | --- | --- | --- | --- |
| 2026-04（月精度），Batch API 全量开放 | Kimi | Batch API 全量开放 | 接口服务 | 异步批处理向全量用户开放，改善可延迟任务的单位推理费用。 | 不是实时响应提速，也不是新的训练底座；日志只精确到月。[官方 API 更新日志](https://platform.kimi.com/docs/changelog) |
| 2026-05（月精度），旧版 API 下线 | Kimi | kimi-k2 系列 API 退役 | 接口服务 | 0711、0905、turbo、thinking 等旧接口下线，属于服务生命周期变化。 | 不是2026年新模型发布，也不表示既有开放权重不可自行部署；不补造退役日。[官方 API 更新日志](https://platform.kimi.com/docs/changelog) |
| 2026-07（月精度），停止向新用户开放 | Kimi | K2.5 / moonshot-v1 新用户准入停止 | 接口服务 | K2.5 / moonshot-v1 停止对新注册用户开放，是正式退役前的准入阶段变化。 | 与8月全量 API 下线分开；不能把停止新注册推断为所有存量用户同月均无法调用。[官方 API 更新日志](https://platform.kimi.com/docs/changelog) |
| 2026-08（月精度），正式 API 下线 | Kimi | K2.5 / moonshot-v1 API 全量退役 | 接口服务 | 全系列正式 API 下线，调用返回404；迁移研究应区分模型能力与服务可用性。 | 开放权重仍可自行部署；官方接口下线不是模型消失，日志不支持精确到日。[官方 API 更新日志](https://platform.kimi.com/docs/changelog) |
| 2026-09（月精度），Hosted Agents Beta | Kimi | Hosted Agents Beta | 接口服务 | 平台托管沙箱、历史、恢复重试、委派、技能及跨会话记忆，在推理 API 之上提供可持续执行的代理运行框架。 | 是 durable harness/系统服务，不是新底座；系统的恢复与记忆能力不能全部归因于模型参数。[官方 API 更新日志](https://platform.kimi.com/docs/changelog) |
| 2026-10（月精度），Batch 扩展模型范围 | Kimi | K3 / K3.1 Pro Batch API | 接口服务 | 批处理扩展至 K3 / K3.1 Pro，按标准价格的60%计费。 | K3 系列仍收缓存写入费用，批处理缓存命中仅尽力而为；不能直接将完整任务总费用算为六折。日志只精确到月。[官方 API 更新日志](https://platform.kimi.com/docs/changelog) |

## 讯飞：月份、上架日与资料日分别保留

| 日期与性质 | 厂商 | 发布对象 | 类型 | 机制与解读 | 边界与来源 |
| --- | --- | --- | --- | --- | --- |
| 2026-02（月精度；2026半年报确认） | 讯飞 | 星火X2 | 模型更新 | 通用模型升级。 | 一手证券披露确认月份，暂未核到日；没有进一步公开架构细节可据此补写。[讯飞2026半年报](https://disc.static.szse.cn/download/disc/disk03/finalpage/2026-08-21/96392fda-b44a-43a9-9587-02f277a34e67.PDF) |
| 2026-04（月精度；2026半年报确认） | 讯飞 | 星火X2-Flash | 模型发布 | 面向 API、代码/agent 与成本方向优化。 | 一手证券披露确认月份，暂未核到日；不推定同月某日所有渠道同时可用。[讯飞2026半年报](https://disc.static.szse.cn/download/disc/disk03/finalpage/2026-08-21/96392fda-b44a-43a9-9587-02f277a34e67.PDF) |
| 2026-06（月精度；2026半年报确认） | 讯飞 | 星火X2-VL | 专项模型 | 视觉推理、文档与图表理解。 | 暂未核到具体日；视觉理解不自动等于原生图像/视频生成。[讯飞2026半年报](https://disc.static.szse.cn/download/disc/disk03/finalpage/2026-08-21/96392fda-b44a-43a9-9587-02f277a34e67.PDF) |
| 07-10，官方 Coding Plan 版本记录上架日 | 讯飞 | 星火X2 Agent | 模型发布 | 300B-A30B MoE；国产算力训推，面向 agent 与代码任务。 | 正式平台版本记录支持当天上架，不据此推定所有产品/API渠道同日开放。[官方 Coding Plan 版本记录](https://www.xfyun.cn/doc/spark/CodingPlan.html) |
| 09-07，公司站转引文章与 HF Trending 记录；准确模型首发日未核 | 讯飞 | 星火X2.5 资料记录 | 资料披露 | 记录代码、智能体及多步任务优化方向。 | 讯飞自有站文章注明转载黑板洞察；官方开源里程碑的同日 HF Trending 可交叉支持当时已有传播，但 Trending 日和转引文章日都不等于模型准确首发日。[公司站转引文章](https://edu.iflytek.com/about-us/news/special-column/2903)、[官方开源里程碑](https://opensource.iflytek.com/milestone) |
| 10-22，1024开发者节发布；后续活动记录支持事件日 | 讯飞 | 星火X2.6 | 模型更新 | 端云一体、国产算力长程任务训练，代码与 agent 增强。 | 10-23公司站已报道，后续10-22活动记录支持事件日；原始技术细节不足，不能编造参数、attention机制或SOTA幅度。[官方活动记录](https://edu.iflytek.com/about-us/news/company-news/2925.html) |
| 10-26，研究介绍页日期；9月已有 Preview，首次发布日未核 | 讯飞 | SparkAudio1.0 研究介绍 | 研究披露 | 全双工语音基础模型；介绍半监督编码器、动态分段端到端及双范式解码。 | 这是研究文章日；9月已有 Preview，1024活动实际发布日未精确区分，不把10-26写成模型首次出现或论文首次提交。[讯飞研究院介绍](https://iflytekresearch.iflytek.com/technology/model_54LEIhi6ous7HS7MWk) |

## inclusionAI：已核发布月份的文本扩散模型

| 日期与性质 | 厂商 | 发布对象 | 类型 | 机制与解读 | 边界与来源 |
| --- | --- | --- | --- | --- | --- |
| 2026-02（月精度），官方系列仓库发布记录 | inclusionAI | LLaDA2.1 | 专项模型 | 引入 token editing，加快文本扩散生成。 | 与自回归解码机制不同；去噪并行速度不直接等于通用推理更强，不从月份推定精确公开日。[官方系列仓库](https://github.com/inclusionAI/LLaDA2.X) |
| 2026-07（月精度），官方系列仓库发布记录 | inclusionAI | LLaDA2.2 | 专项模型 | Levenshtein editing，面向 agent 场景的文本编辑与生成。 | 不能仅以并行生成速度跨任务断言更强；暂保留官方仓库确认的月粒度。[官方系列仓库](https://github.com/inclusionAI/LLaDA2.X) |

## Qwen：语音生成、识别、双工交互及翻译

语音专项与通用文本底座分别研究。以下为官方云日志上线节点；地区后续重复上线不重复计算，也不据此声称所有地区或开放权重同日可用。

| 日期与性质 | 厂商 | 发布对象 | 类型 | 机制与解读 | 边界与来源 |
| --- | --- | --- | --- | --- | --- |
| 07-14，官方云日志上线记录 | Qwen | Qwen-Audio-3.0-TTS-Plus / Flash | 专项模型 | 语音合成；Plus侧重专业质量，Flash侧重低延迟交互。 | 属于输出语音专项，不是通用文本能力新代际；日志上线日不等于所有地区同步或权重开放日。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 07-30，官方云日志上线记录 | Qwen | Qwen-Audio-3.0-ASR-Flash 系列 | 专项模型 | 流式与非实时语音识别，扩展方言、多语种及热词/上下文支持。 | ASR处理语音转写，不等于语音生成；不同实时/离线端点需按同任务、同延迟预算评估。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 08-10，官方云日志上线记录 | Qwen | Qwen-Audio-3.0-Realtime-Plus / Flash | 专项模型 | 端到端实时双工语音交互。 | 双工交互是专项能力，不能直接推断通用推理强弱；地区与服务规格需分别核对。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 09-17，官方云日志上线记录 | Qwen | Qwen3.8-LiveTranslate-Flash-Realtime | 专项模型 | 实时音视频同声翻译。 | 同传专项的识别、翻译与输出延迟应分开测；不能把翻译模型当通用多模态底座的全面替代。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 09-20，官方云日志上线记录 | Qwen | Qwen-Audio-3.1-Realtime-Plus | 专项模型 | 迭代实时双工语音交互。 | 9月20日是此端点的日志记录，9月21日ASR为另一个事件；不能混为整套3.1家族单日同时首发。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 09-21，官方云日志上线记录 | Qwen | Qwen-Audio-3.1-ASR-Flash 系列 | 专项模型 | 迭代语音识别，覆盖消息、流式与文件转写等端点。 | 应分别评估识别错误率、噪声、说话人和响应时长；专项提升不能替代通用模型能力验证。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 10-12，官方云日志上线记录 | Qwen | Qwen-Audio-3.1-TTS-Flash | 专项模型 | 面向实时交互的低延迟语音合成。 | 与10月21日专业质量Plus端点分开，不能把质量档和低延迟档当作完全相同服务。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 10-21，官方云日志上线记录 | Qwen | Qwen-Audio-3.1-TTS-Plus | 专项模型 | 面向专业声音与内容生产的语音合成。 | 更高语音质量不直接代表更短端到端时延，应在同输入/同声音条件下比较。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 10-22，官方云日志上线记录 | Qwen | Qwen-Audio-3.1-TTS-Next | 专项模型 | 统一生成声音、环境音及语音内容。 | 不应将统一音频生成与纯语音合成的指标混用；未在同配置下独立复现质量和成本。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |
| 10-27，官方云日志上线记录 | Qwen | Qwen-Audio-3.1-Realtime-Flash | 专项模型 | Flash档实时双工语音交互。 | 端点上线不等于整个家族同日重训或开放权重；延迟应计入识别、模型生成与音频输出全链路。[官方云模型日志](https://docs.qwencloud.com/changelog/models) |

## Mistral、Grok 与 Meta：其他海外主线

| 日期与性质 | 厂商 | 发布对象 | 类型 | 机制与解读 | 边界与来源 |
| --- | --- | --- | --- | --- | --- |
| 03-16，官方公告 | Mistral | Mistral Small4 | 模型发布 | 将推理、多模态与编码归入统一模型。 | 统一模型定位不等于每个任务都优于各专用模型；官方能力未在本轮按同配置独立复现。[官方公告](https://mistral.ai/news/mistral-small-4/) |
| 05-22，官方公告 | Mistral | Mistral Medium3.5 | 模型发布 | 128B dense、256K上下文，开放权重。 | modified MIT并非原MIT；开放权重与无条件许可不同，256K上限不保证长文任务准确率。[官方公告](https://mistral.ai/news/vibe-remote-agents-mistral-medium-3-5/) |
| 10-06，官方公告 | Mistral | Mistral Large4 | 模型发布 | 延续开放权重的大模型主线。 | open weight不自动等于无约束开源；当前公开正文不足以自行补写未披露的架构机制。[官方公告](https://mistral.ai/news/mistral-large-4/) |
| 07-16，官方公告 | Grok | Grok4.5 | 模型发布 | Grok模型主线迭代。 | 不补写缺少原始技术证据的架构参数；跨家性能仍需统一harness、effort与工具预算。[官方公告](https://x.ai/news/grok-4-5) |
| 08-12，官方公告正文日期 | Grok | Grok4.6 | 模型发布 | Grok模型主线继续迭代。 | 日期取官方正文08-12，新闻列表相邻摘要的08-14不能代替正文；公开跨家比较的harness/effort不同，不直接排名。[官方公告](https://x.ai/news/grok-4-6) |
| 09-21，官方公告 | Grok | Grok4.7 | 模型发布 | 官方明确更大底座，在更难且耗时更长的任务上进行更长RL训练，改善自验证与上下文。 | 这是官方技术说明；模型规模、训练预算与评测框架的变化共同影响表现，不能仅由单一得分归因。公开跨家对比混用harness/effort。[官方公告](https://x.ai/news/grok-4-7) |
| 04-08，官方公告 | Meta | Muse Spark | 模型发布 | Meta模型主线转向Muse品牌。 | Muse个人代理产品和Muse模型品牌需分开；不能由品牌变化臆造Llama5发布日期。[官方公告](https://about.fb.com/news/2026/04/introducing-muse-spark-meta-superintelligence-labs) |
| 10-12，官方原站公告；10-13网页更新 | Meta | Muse Wonder / Wonder Full | 模型发布 | Wonder通过Meta Model API / Muse Code提供，Wonder Full通过Muse Code订阅提供。 | 官方网页datePublished为2026-10-12T17:08:05+00:00，dateModified为2026-10-13T17:27:26+00:00；页面原站日期分别为10-12、10-13，未统一改写为北京时间。两种服务层级不在缺少证据时算两次架构突破。[官方公告](https://about.fb.com/news/2026/10/introducing-muse-wonder-models/) |

## 收录边界

未将Ling上传/评测快照直接写成公众首发，也未将Step5等计划发布算成已发布。Grok4.20的04-07为system card日期，不足以证明模型首发；这些不确定事项保留在厂商正文。重点厂商发布表、专项附录与资料记录一起提供研究索引，条目总数不代表新的通用底座数量。
