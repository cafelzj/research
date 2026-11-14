# 2026 中国其他主要模型：发布与技术解读

核验截止：2026-11-14。日期默认公告日；若只核到月、不把日补造。下文技术与评测数值除特别说明均为厂商自报，未实际复测。开权重不自动等于无条件开源。

## MiniMax：从 agent 强化学习到稀疏长上下文与单位任务成本

| 日期 / 性质 | 模型 | 核验到的变化与解释 | 边界 / 来源 |
| --- | --- | --- | --- |
| 02-12 正式发布/API | M2.5 | 真实交互环境的大规模RL；更强调先写规格、任务分解、10余种语言和20多万环境。官方 SWE-bench Verified 80.2%、Multi-SWE 51.3%；SWE任务耗时较M2.1少37%。意义在完整工程流程与吞吐，而非只提高短代码题分数。 | BrowseComp 76.3%带context management，不是裸模型同条件分数；每小时费用依赖速度、版本和调用量，不是通用TCO。HF当前许可证modified-mit，不能简写原版MIT。[公告](https://www.minimax.io/blog/minimax-m25)、[模型卡](https://huggingface.co/MiniMaxAI/MiniMax-M2.5) |
| 03-18 正式发布 | M2.7 | 复杂Skills、动态工具检索、多agent协同、办公文件多轮编辑；SWE-Pro56.22、Terminal-Bench2 57.0。团队让模型辅助研究实验、修改harness和维护记忆。 | “自我进化”这里仍由研究员设定目标、环境及评价；内部某harness提升30%不能理解为底座权重自主无限递归改进。M2.7辅助30%—50%研发流程是内部观察。[公告](https://www.minimax.io/blog/minimax-m27) |
| 06-01 API/产品与模型发布 | M3 | MSA稀疏注意力支持1M上下文；从训练初始混合模态，支持图像/视频理解与computer use；代码、agent、长上下文统一。官方在1M场景称单token计算量为上一代1/20、prefill >9倍、decode >15倍。 | 加速是特定长度、实现与基线，不是任何硬件/请求都有15倍；12小时论文复现等是厂商精选案例。当前HF开权重许可minimax-community，不是MIT/Apache。[公告](https://www.minimax.io/blog/minimax-m3)、[模型卡](https://huggingface.co/MiniMaxAI/MiniMax-M3) |
| 10-19 API/M Plan/Code发布 | M3.1 Flash | 更激进稀疏化，宣称线上推理接近3倍快、agent使用成本减70%；P50输出170+TPS。DeepSWEv1.1 73.7、OSWorldV2 61.7、ALE29.6。首发标价美元/百万token输入0.15、输出0.60、缓存0.015。 | 首发原文明确“Model weights will be released later”；不得写10-19已开源。Space Bunny是早期匿名版本，不应重复计一次新模型。实际成本取决于重试、工具与成功率，不可仅看token价。[公告](https://www.minimax.io/blog/minimax-m31f) |

排除/单列：01-27 M2-her技术解读可见[官方研究目录](https://www.minimax.io/blog)，但目前未核其模型首次发布是否等于该文章日期；不能把解读日直接当新底座首发。02-14 Forge是RL框架，05-27 Agent Team是产品系统，06-09 MaxProof是专项研究，07-31 H3和11-11 H3-Image为生成媒体模型，与通用文本底座时间线分栏。

## 字节 Seed / 豆包：生产级多模态理解与流程交付

| 日期 / 性质 | 模型 | 主要优化 | 研究含义 / 边界 |
| --- | --- | --- | --- |
| 02-14 正式发布/API | Seed2.0 Pro / Lite / Mini / Code | 强化复杂文档/图表/视频理解、多约束指令、多步长链执行；用不同尺寸覆盖时延/成本，Code专门覆盖软件工程。 | 不可把豆包App新增功能全部当新模型；官方文中02-16榜单是后续时点，不能反推02-14已拥有该排名。闭源API、模型规格和供应商部署档位分清。[公告](https://seed.bytedance.com/en/blog/seed-2-0-official-launch)、[官方家族表](https://seed.bytedance.com/en/seed_model_portfolio) |
| 04-09 语音交互模型 | Seeduplex | 从半双工转“边听边说”，增强打断、噪声/干扰抑制、语音互动自然性。 | 这是实时语音交互架构进展，不等于文本推理底座换代。[公告](https://seed.bytedance.com/en/blog/introducing-seed-full-duplex-speech-llm-attentive-listening-robust-interference-suppression-enabling-more-natural-interaction) |
| 06-23 正式发布/豆包与火山 | Seed2.1 Pro / Turbo | 更可靠的跨工具、跨环境agent；代码从需求分析到部署验证的全流程；强化复杂视觉/视频理解。 | 最重要的是长链一致性和真实交付，演示并不证明所有企业任务可自主完成；须看失败分布与固定harness。官方模型页列Pro/Turbo。[公告](https://seed.bytedance.com/en/blog/seed2-1-officially-released-advancing-ai-productivity)、[模型目录](https://seed.bytedance.com/en/models) |

Seed1.8是2025-12-17发布，不能算2026新发布；Seedance/Seedream为视频/图像生成，单列而不挤入通用LLM主线。

## 阶跃：小激活高效推理 → 视觉agent → 旗舰专业工作

| 日期 / 性质 | 模型 | 技术与能力 | 注意事项 / 来源 |
| --- | --- | --- | --- |
| 02-02 首发开权重；02-12技术页更新 | Step3.5 Flash | 196B总量/11B激活；MTP-3多token预测、3:1滑窗/全局注意力混合、256K上下文。官方SWE-bench Verified74.4、TB2.0 51.0。 | 技术页抬头“02-12 updated”不能写首发02-12；PaCoRe并行思考结果与单次推理分开；峰值350TPS不是普适单用户速度。[首发新闻](https://www.stepfun.com/news/step-3-5-flash-launch)、[技术页](https://static.stepfun.com/blog/step-3.5-flash/) |
| 05-29 发布/API及权重 | Step3.7 Flash | 在3.5基础上补原生视觉理解与行动、网页/视觉搜索、长链工具编排、主流agent框架兼容。官方同页3.5→3.7 SWE-Pro51.3→56.3、TB2.1 53.4→59.5。 | 同页同benchmark版本比较才有意义；不能把3.5旧TB2.0与3.7 TB2.1直接当纯模型提升。词元总数/激活参数须读卡，HF文件参数含视觉模块可与宣传196B口径不同。[技术页](https://static.stepfun.com/blog/step-3.7-flash/) |
| 09-20 产品/API；公告承诺10-15开放权重 | Step5 Preview | 600B/27B激活、1M上下文、视觉输入，长程软件工程、金融建模/检索/研究。官网列High推理档，DeepSWE67.7、金融FrontierFinance66.4。 | 自建FinStepBench不是独立第三方测试；High/Max等计算预算不可忽略。HF当前权重存在、StepFun Model License1.0有商业/署名条件，不等于Apache2.0。HF09-20上传历史不证明当天public；首发公告明说10-15开权重，实际首公开日应额外核验。[公告](https://www.stepfun.com/news/step-5-preview)、[模型页](https://www.stepfun.com/step-5-preview)、[官方模型卡](https://huggingface.co/stepfun-ai/Step-5-Preview)、[提交历史](https://huggingface.co/stepfun-ai/Step-5-Preview/commits/main) |

## 百度：全模态大底座 → 弹性子网络 → 稀疏Flash Base/后训练分离

| 日期 / 性质 | 模型 | 主要变化 | 关键辨析 / 来源 |
| --- | --- | --- | --- |
| 01-22 正式版上线/API | ERNIE5.0 | 2.4T参数统一自回归全模态建模，文本/图像/音频/视频联合训练；强调统一理解与生成。 | 2025已有Preview；01-22为正式版，不是5.0首次出现；02-06技术报告不能重复记为新模型。参数量与激活量不能混用。[百度公告](https://home.baidu.com/home/index/news_detail/id/18049)、[千帆公告](https://cloud.baidu.com/news/news_eacd5e1a-b6ad-4874-b920-15390d26e656) |
| 05-09 正式发布；04-30是Preview榜单 | ERNIE5.1 | Once-For-All弹性深度/宽度/稀疏度从5.0继承最优子网，总参数约1/3、激活约1/2；解耦完全异步RL和agent后训练，降低rollout长尾与训推分歧。 | “预训练成本6%”是继承5.0的比较口径，不等于从零全生命周期训练成本减少94%；AIME26 99.6带工具，非无工具纯推理。[正式技术文](https://ernie.baidu.com/research/posts/ernie-5.1-0508-release/) |
| 11-05 Base权重发布 | ERNIE5.5 Flash Base | 280B/14B激活；33.5T预训练token；1M微调/推理上下文，训练上下文最高128K；混合MLA/HCA稀疏注意力、Latent MoE等。 | 只有预训练完成、没有mid/post-training的checkpoint，不能直接拿聊天/agent表现与Instruct混排。[发布页](https://ernie.baidu.com/release/ernie-5-5-flash-base/)、[官方日期目录](https://ernie.baidu.com/research) |
| 11-11 Preview API发布 | ERNIE5.5 Flash Preview | 基于Flash Base的首个后训练版本，仍280B/14B、1M；面向代码、3D程序化建模、专业工作与创作工具调用。 | 原文明确text-only；制作视频/3D依赖harness和外部工具，不是模型原生图像/视频生成。首发权重Apache2.0“soon”，不得写11-11权重已开放。[发布页](https://ernie.baidu.com/release/ernie-5-5-flash-preview/) |

## 腾讯 Hy：重建基础设施与产品反馈闭环

| 日期 / 性质 | 模型 | 优化 | 边界 / 来源 |
| --- | --- | --- | --- |
| 04-23 Base/Instruct权重开放 | Hy3 Preview | 295B/21B激活、256K，重建预训练/RL基础设施后的首版，推理、指令、上下文学习、代码agent提升；192路由专家top8。 | CL-bench等含厂商自建业务场景，不能视全部独立评测。[官方仓库](https://github.com/Tencent-Hunyuan/Hy3-preview)、[腾讯公告](https://www.tencent.com/tencent-unveils-hy3-preview-model-enhances-agent-capabilities-and-real-world-usability/) |
| 07-06 正式版/API/权重 | Hy3 | 同295B/21B、256K，扩大后训练、业务反馈；工具格式/恢复、跨harness稳定、多轮指令和幻觉治理；Apache2.0。 | 内部幻觉12.5%→5.4%只适用其样本与定义；270专家盲评不是独立抽样普适结论；不是变大参数的架构新代。[腾讯正式公告](https://www.tencent.com/tencent-hunyuan-officially-releases-hy3-advancing-agent-capabilities-and-deeper-product-integration/)、[模型卡](https://github.com/Tencent-Hunyuan/Hy3) |
| 08-28 Preview/开权重 | Hy4 Preview | 770B/49B激活（不含MTP层）；1M；Gated DSA、IndexCache跨层稀疏索引复用、iHC残差流；针对工程/办公/研究大规模后训练。 | 已知过度思考与过度核验，官网/卡明确承认；内部专家比较203工程题、163人，不能当所有任务领先。HF权重存在，日期由官方新闻页支持。[官方日期页](https://hunyuan.tencent.com/research/hy4-preview?langVersion=zh)、[完整卡](https://github.com/Tencent-Hunyuan/Hy4-preview) |

10-16 Hy-Memory2.0作为记忆专项模型+框架+应用三层开放，应在“记忆/系统”栏单列，不能假装Hy5通用底座。[官方发布页](https://memory.hunyuan.tencent.com/en/)。Hy-MT2、HunyuanOCR、具身和3D/视频模型为其他专项，未完整逐项审计。

## 小米 MiMo：补充的重要主线与一例失败反证

| 日期 / 性质 | 模型 | 内容与解释 | 来源 / 局限 |
| --- | --- | --- | --- |
| 01-12 API显著更新 | MiMo-V2-Flash-0112（API名不变） | 增强Thinking模式代码、Claude Code兼容、格式/指令稳定；属于2025-12-16底座的2026升级，不重计底座首发。 | [官方API更新日志](https://mimo.mi.com/docs/updates/model)，搜索索引能读取完整条目，直接open正文受JS限制。01-08技术报告不是首发。 |
| 03-18 正式发布/API | MiMo-V2-Pro | >1T/42B激活，混合注意力比例7:1、1M上下文、MTP，扩大agent后训练；匿名Hunter Alpha是早期测试版。 | 不把匿名版与实名版重复计两次。首发页只明确API，不能直接推定当日开权重。[官方页](https://mimo.xiaomi.com/mimo-v2-pro) |
| 04-22 发布/权重/API | MiMo-V2.5 | 310B/15B激活，48T预训练token，视觉/音频编码器+投影连接语言底座；五阶段训练，RL+MOPD，1M。 | “原生多模态”不同公司含义不同，此页明确是编码器/投影器结合，不能直接归为从step0统一全模态自回归。Base256K，后训练版1M。[官方页](https://mimo.xiaomi.com/mimo-v2-5) |
| 04-27 发布/权重/API | MiMo-V2.5-Pro | 1.02T/42B，1M，强化千次以上工具调用的连贯、指令保持与自我纠错。 | 数小时写编译器/视频编辑器是厂商案例，不能用它估算所有程序员替代率。[官方页](https://mimo.xiaomi.com/mimo-v2-5-pro) |
| 06-08公告；06-09起限期试用 | V2.5-Pro-UltraSpeed | 和TileRT协同，宣称1T模型decode破1000TPS；属于部署/serving优化。 | 首次试用限06-09至06-23，北京时间；峰值不等于常态吞吐/低成本，也非新训练底座。[官方文](https://mimo.xiaomi.com/blog/mimo-tilert-1000tps) |
| 09-22官方更新日志；HF 09-21UTC上传 | MiMo-V2.6 Pro / Flash | 全模态输入、1M；Pro1.02T/42B、Flash309B/15B；公开RL代码/环境，混合RL和多教师OPD，正式模型需与此前训练直播区分。 | 不以09-17训练直播记首发；首发本地日/UTC一天差异需显示。官方HF为MIT开权重，Epoch条目仍写closed说明第三方目录会滞后。[官方日志](https://mimo.mi.com/docs/updates/model)、[Pro卡](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL)、[Flash卡](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Flash-RL) |
| 09-27 可靠性修复披露 | MiMo-V2.6工具重复与MOPD改进 | 厂商承认RL“只奖励正确”会漏掉反复工具调用；公开harness差异、重复率测量局限与修复过程。 | 是极有价值的反宣传证据：RL扩大不一定单调改善产品；精确同回合重复仅为下界，不含跨回合/近似重复/exec内调用。个别问题样本重放的flooding24.6%不是全部线上用户发生率。[官方反思文](https://mimo.xiaomi.com/blog/mimo-v2-6-tool-call-repetition) |

## 讯飞：目前可证实但部分日期粒度不足

一手证券披露[2026半年报](https://disc.static.szse.cn/download/disc/disk03/finalpage/2026-08-21/96392fda-b44a-43a9-9587-02f277a34e67.PDF)确认：02月星火X2（通用升级）、04月X2-Flash（API、代码/agent与成本）、06月X2-VL（视觉推理/文档图表）；该PDF暂未核到日，主表应保留月份，不用二手稿补造精度。

07-10 星火X2 Agent：300B-A30B MoE、国产算力训推、agent/代码；正式平台版本记录可核当天上架，而非只营销新闻。[官方Coding Plan版本记录](https://www.xfyun.cn/doc/spark/CodingPlan.html)。

09-07 星火X2.5：代码与智能体/多步任务优化。[讯飞自有站文章](https://edu.iflytek.com/about-us/news/special-column/2903)明确日，但文章注明转载黑板洞察，日期作为公司站转引信息；[官方开源里程碑](https://opensource.iflytek.com/milestone)同日HF Trending记录可交叉支持，Trending日仍不等同模型准确首发。

10-22 星火X2.6：1024开发者节发布，端云一体、国产算力长程任务训练，代码与agent增强。10-23公司站已报道，后续[10-22活动记录](https://edu.iflytek.com/about-us/news/company-news/2925.html)支持事件日。没有足够原始技术细节，不能编造模型参数、attention机制或SOTA幅度。

10-26 SparkAudio1.0研究发布页：全双工/语音基础模型，半监督编码器、动态分段端到端、双范式解码；9月已有Preview。日期是文章日，1024活动实际发布日未精确区分。[研究院页](https://iflytekresearch.iflytek.com/technology/model_54LEIhi6ous7HS7MWk)。

## 蚂蚁 inclusionAI：作为扩展附录，首发日尚待逐条完全核定

- Ling2.5-1T：官方卡确认1T/63B、29T预训练、混合线性attention，正确性与过程冗余复合奖励，面向instant；月份二月来自辅助线索，未用作已核准确首发。[官方仓库](https://github.com/inclusionAI/Ling-V2.5)。
- Ling2.6-flash/1T：官方卡可读，评测快照04-20不能当发布日；本轮未确认首发日。[官方卡](https://huggingface.co/inclusionAI/Ling-2.6-flash)。
- Ling3.0-flash：08月前后权重已公开（官方HF初期提交与外部PR可交叉）；124B/5.1B，5:1 KDA/MLA、1/64稀疏MoE，1万+交互训练环境，HiCache+Mooncake降低长输入TTFT。首发精确日仍待核。[官方卡](https://huggingface.co/inclusionAI/Ling-3.0-flash)。
- Ling3.1-flash：官方HF10-13已有上传记录，当前560B/25B、1M，7:1 KDA/GatedMLA，办公、科研、金融/材料任务优化。不能仅凭repo创建日宣称public首发。后续-1019为同规模post-training更新，不应当新架构代。[官方卡](https://huggingface.co/inclusionAI/Ling-3.1-flash)、[官方提交历史](https://huggingface.co/inclusionAI/Ling-3.1-flash/commits/main)。
- LLaDA2.1：官方repo确认02月发布，token editing加快文本扩散；LLaDA2.2确认07月，Levenshtein editing面向agent。与自回归区别值得附一栏，不将去噪并行速度直接等于通用推理更强。[官方系列](https://github.com/inclusionAI/LLaDA2.X)。

## 尚未完整覆盖的部分

商汤SenseNova、上海AI实验室Intern系列、面壁MiniCPM、百川医学模型、具身与纯图像/视频/语音专项未逐条完整审计。因此本节为“中国主要发布选编”，不代表已穷尽所有中国大模型。

## 推荐研究判断

1. 2026的主线至少有四个互相不同的变量：底座参数与模态；后训练与交互环境；注意力/KV/解码效率；产品harness与工具编排。不能把四类进展揉成一句“智力提升”。
2. 1M只是可接收上下文上限；需测任务检索/约束保持、并发KV内存、TTFT和价格，不等于读懂100万token。
3. 比价应看“完成且验收通过一次任务的总成本”：输入/输出/缓存、工具调用、重试、超时、人类复核；TPS与token单价分别很低仍可能高总成本。
4. 厂商自建金融/研究基准（FinStepBench、BankerToolBench等）可揭示目标任务，不足以证明真实投资决策收益；重点看数据污染、隐藏测试、可重算与来源追溯。
5. 可靠性修复事件应与能力发布同等重视：小米官方工具重复反思比一张SOTA雷达图更能说明RL奖励盲点与harness依赖。
