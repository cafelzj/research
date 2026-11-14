# Kimi / Moonshot AI：2026 模型发布与技术演进

检索截至 2026-11-14。范围为模型、API 与关键 Agent 系统升级；不把产品、基准或 CLI 小版本等同于新底座。以官方正文为依据，第三方目录仅作发现线索。下列跑分均为厂商报告或其汇总，未在本次研究中自行复现。

## 主时间线

| 日期及类型 | 事件 | 已核实变化 | 研究解读与边界 |
| --- | --- | --- | --- |
| 2026-01-27，官方发布 / 产品与 API 可用 | Kimi K2.5 | 在 K2-Base 上继续预训练约 15T 图文混合 token；原生视觉、多模态编程，统一 Instant / Thinking。模型卡：1T 总参、32B 激活、256K 上下文、MLA、400M MoonViT。Agent Swarm Beta 是同一模型的编排形态，不是四个新底座。 | 关键是视觉输入进入代码与工具闭环，而非只增大聊天知识。15T 是续训 token，不是参数；1T 总参不代表每 token 都激活 1T。视觉生成示例部分使用外部图像生成工具，不应宣传为底座原生图片生成。 |
| 2026-01-29，模型卡部署修正 | K2.5 提示词 / chat template 修复 | 移除可能引发困惑的默认 system prompt；媒体 token 修正为 `<|media_begin|>`。 | 是复现与部署的重要细节，但不是 K2.6 式新代际；错误模板可以造成第三方服务能力偏差。 |
| 2026-02-02，论文 v1；2026-02-09，独立系统博客 | K2.5 报告 / Agent Swarm | PARL 训练协调者动态拆任务；最多 100 子 Agent、1,500 步协调调用，厂商宽搜索任务最高约 4.5 倍墙钟加速。 | 并行降低关键路径延迟，不等于总 token 或总费用降低；适合可分解任务，串行依赖任务收益有限。2 月博客不能再次算一个新模型。 |
| 2026-04-20，官方发布 / API / 权重开放 | Kimi K2.6 | 仍为 1T / 32B / 256K / MLA；重点转向长程工程、指令遵循、工具调用与主动后台 Agent。Swarm 产品扩展到 300 子 Agent、4,000 协调步骤。 | 主要是同一规模下的任务执行可靠性，而非参数跃迁；12—13 小时工程演示和 5 天后台运行是挑选案例，不是所有任务稳定运行保证。 |
| 2026-06-12，官方 Code 发布记录；6 月 API 上线 | Kimi K2.7 Code | K2.6 派生、编程专精；仍为 1T / 32B / 256K。仅 Thinking；官方称较 K2.6 少约 30% 思考 token，改善长期任务完成。 | 与 K3 并行的成本 / 专精路线，不应按编号把它当 K3 后继。约 30% 是思考 token，不是总 token、延迟或总任务费一律减少 30%。 |
| 2026-07-16，产品 / API 首发；07-27，HF 初始提交（含权重分片） | Kimi K3 | 2.8T 总参、104B 激活、1M 上下文；KDA + Gated MLA 混合注意力、Attention Residuals、Stable LatentMoE，896 专家选 16。原生视觉与长程编程 / 知识工作。 | 相较 K2 的确有架构与规模变化。稀疏激活降低计算，但全部权重仍要存储；1M 窗口不等于同样长的有效理解或免费缓存。厂商约 2.5 倍 scaling efficiency 不是 API 推理吞吐提升 2.5 倍。 |
| 2026-09-11，Kimi Code 预览模型上线 | K2.8 Preview | 官方 Code 更新记录：同一 `kimi-for-coding` 入口更新，1M 上下文，low / high / max；称接近 K3 的编程与 Agent 能力、思考更高效。 | 预览和路由更新不等于权重开放。该记录未公开足够的架构 / 训练参数和同条件分数，不替它补写“新架构”。关闭思考时，K3 系列请求也可能由 K2.8 Preview 非思考模式服务，故前端标签不总等于实际服务底座。 |
| 2026-10-23，Code 上线；官方研究目录标 10-24；11-02，HF 初始提交（含权重分片） | Kimi K3.1 Pro / Highspeed | 由 K3 大规模多领域联合 RL 后训练而来；保持 2.8T / 104B / 1M，将 24 层 Gated MLA 换为 Gated DSA，69 层 KDA 保留；MXFP4 权重 / MXFP8 激活 QAT。强化长程编码、3D、金融研究与事实准确性。Highspeed 为同质高速服务，官方称 2—3 倍速度。 | 不是完全重新预训练的 K4。10-23 / 24 是不同官方渠道记录，不擅自确定为时区原因；权重公告承诺最迟 11-04，HF 记录显示含权重分片的初始提交在 11-02；尚不能仅凭提交记录确定仓库当时公开可下载的时刻。Highspeed 不单算新底座。 |

## 同条件改进与不可比陷阱

1. **K2.6 相对 K2.5**：官方模型卡给 SWE-Bench Verified 76.8 → 80.2（+3.4 个百分点），SWE-Bench Pro 50.7 → 58.6（+7.9 个百分点），Terminal-Bench 2.0 50.8 → 66.7（+15.9 个百分点）。不要把不同测试集揉成“编程提升 15.9%”。SWE 测试使用自建 SWE-agent 变体，报告对编程任务平均 10 次运行，Terminal-Bench 用 Terminus-2；不同 harness、token 预算与重试次数会改变成绩。来源：[模型卡](https://huggingface.co/moonshotai/Kimi-K2.6)、[评测脚注](https://www.kimi.com/en/blog/kimi-k2-6)。
2. **K2.7 Code 相对 K2.6**：模型卡给 Kimi Code Bench v2 50.9 → 62.0、Program Bench 48.3 → 53.6、MCPMark Verified 72.8 → 81.1；Code 更新日志的 +10.4%、+11.4% 是相对增幅，分别对应 +5.3、+8.3 个百分点，不是同一概念。前者为内部评测，后两者也须看任务集、工具与采样。来源：[K2.7 模型卡](https://huggingface.co/moonshotai/Kimi-K2.7-Code)。
3. **K3.1 Pro**：官方博客内部长程 Code Bench 3.0：K3 55.95 → 61.2；内部 Kimi Hallu Bench Hard 的逐主张错误率 23.4% → 8.3%。这是刻意挑选高难事实问题的 stress test，不能说“日常错误率只剩 8.3%”。对外榜单中 HLE-with-tools 与 HLE-no-tools、最高推理档与默认档、最大输出与墙钟预算都须分开。Terminal-Bench 4.0 的 65.7 不可直接对比早代 2.0 的 66.7。来源：[K3.1 技术博客与方法脚注](https://www.kimi.com/en/blog/kimi-k3-1-pro)。
4. **“长时间运行”与“有效工作”不同**：调用更多工具、连续运行更多小时、300 个 Agent，均不直接等于正确率、产出质量或经济性。应跟踪同一任务成功率、人工复核 / 返工时间、总工具费用、成功任务成本及 P95 完成时长。此项为研究推断。
5. **开放权重与许可证**：K2.5/2.6/2.7 模型卡标 modified-MIT；K3 与 K3.1 是自定义 Kimi License。K3.1 许可证对达到收入门槛的 MaaS 经营者有另签协议要求，对超大产品有署名条件，内部使用和官方/认证推理伙伴通道另有豁免。不能笼统写“全系列无条件 MIT 开源”。[K3.1 License 原文](https://huggingface.co/moonshotai/Kimi-K3.1-Pro/blob/main/LICENSE)。

## API / 产品系统变化，须另列而非模型代际

- **4 月**：Batch API 向全量用户开放；异步批处理改善单位推理费用，不能承诺实时响应更快。
- **5 月**：`kimi-k2` 系列 API 下线；含 0711、0905、turbo、thinking 等旧版本。不是 2026 新发布。
- **6 月**：K2.7 Code API 上线，随后高速版；Code 6 月 12 日发布说明只说 HighSpeed Beta “coming soon”，不能据此写同日高速版已正式可用。
- **7 月**：K3 API 上线；K2.5 / moonshot-v1 停止对新注册用户开放。
- **8 月**：K2.5 / moonshot-v1 全系列正式 API 下线，调用返回 404。开放权重仍可自行部署；“官方 API 已下线”不是“模型消失”。
- **9 月**：Hosted Agents Beta：平台托管沙箱、历史、恢复重试、委派、技能及跨会话记忆。是推理 API 之上的 durable harness，不是新底座。
- **10 月**：Batch API 扩展 K3 / K3.1 Pro，标准单价的 60%；K3 系列仍收缓存写入费用，批处理缓存命中仅尽力而为，不能据此直接算任务成本打六折。

本节来源：[官方 API 更新日志](https://platform.kimi.com/docs/changelog)。日志只精确到月，保留月粒度，不伪造日。

## 排除项与日期核验

- K1.5（2025-01-20）、Kimi-VL（2025-04-10）、Kimi-Audio（2025-04-26）、K2（2025-07-11）、K2-0905（2025-09-05）、K2 Thinking（2025-11-06）均不是 2026 首发，即使其 HF 文件在 2026 更新。
- Kimi Vendor Verifier（2026-01-22）、WorldVQA（02-03）、PerceptionBench（07-16）是验证工具 / 数据基准，不算新底座。
- 第三方“11 月 12 日发布 K2.7 Code”的聚合信息与官方 6 月记录冲突，弃用该日期。
- K3.1 权重初始提交不天然证明当时仓库已公开；准确说法是“11-02 有含权重分片的初始提交记录，截至 11-14 可取得权重”，若需精确首个公众可下载时刻仍需官方发布帖进一步交叉。

## 主要来源与短原文定位

| 来源 | 支持范围 | 短证据 |
| --- | --- | --- |
| [官方研究目录](https://www.kimi.com/en/blog/) | 各研究公告日期；排除 2025 项 | “2026-01-27”“2026-04-20”“2026-07-16”“2026-10-24” |
| [K2.5 博客](https://www.kimi.com/en/blog/kimi-k2-5) | 续训与原生视觉、PARL、四产品模式 | “15T mixed visual and text tokens” |
| [K2.5 模型卡](https://huggingface.co/moonshotai/Kimi-K2.5) | 参数 / 窗口 / 1 月 29 日模板修正 | “2026.1.29” |
| [K2.5 论文](https://arxiv.org/abs/2602.02276) | 论文发布日期与技术说明 | “Submitted on 2 Feb 2026” |
| [Agent Swarm 博客](https://www.kimi.com/en/blog/agent-swarm) | 独立系统介绍，非新模型 | “100 sub-agents working in parallel” |
| [K2.6 博客](https://www.kimi.com/en/blog/kimi-k2-6) | 长程任务、swarm 产品和评测协议 | “300 sub-agents”“4,000 coordinated steps” |
| [Kimi Code 更新记录](https://www.kimi.com/code/docs/en/kimi-code/whats-new.html) | 06-12 K2.7、09-11 K2.8、10-23 K3.1；可锚定相应章节 | “Kimi K2.7 Code June 12, 2026”; “K2.8 Preview September 11, 2026” |
| [K2.7 Code 模型卡](https://huggingface.co/moonshotai/Kimi-K2.7-Code) | 派生关系、token 优化、跑分 | “reducing thinking-token usage by approximately 30%” |
| [K3 博客](https://www.kimi.com/en/blog/kimi-k3) | 07-16 产品 / API，权重承诺 07-27 | “full model weights ... July 27, 2026” |
| [K3 模型卡](https://huggingface.co/moonshotai/Kimi-K3) | 实际架构与量化 | 69 KDA + 24 Gated MLA |
| [K3 提交记录](https://huggingface.co/moonshotai/Kimi-K3/commits/main) | 07-27 13:31 初始提交，分片页另证实含 safetensors | “Initial commit” |
| [K3.1 Pro 博客](https://www.kimi.com/en/blog/kimi-k3-1-pro) | 后训练、能力升级、速度版和评测限制 | “post-trained version of Kimi K3” |
| [K3.1 模型卡](https://huggingface.co/moonshotai/Kimi-K3.1-Pro) | DSA 替换、QAT 与 104B 激活参数 | “69 KDA + 24 Gated DSA” |
| [K3.1 提交记录](https://huggingface.co/moonshotai/Kimi-K3.1-Pro/commits/main) | 11-02 04:13 初始提交（含 safetensors），11-05 仅编码修正 | “Initial commit” |
| [官方 API 更新日志](https://platform.kimi.com/docs/changelog) | 月粒度 API 上下线、Batch / Hosted Agents | “批量推理价格仍为标准价格的 60%” |


### 初始提交并非仅 README：补充实物证据

- [K3.1 第一权重分片](https://huggingface.co/moonshotai/Kimi-K3.1-Pro/blob/main/model-00001-of-000096.safetensors) 显示 2.34 GB Xet 文件、下载入口与 SHA256，所属提交为 `6d0a020`（Initial commit）。[当前文件树](https://huggingface.co/moonshotai/Kimi-K3.1-Pro/tree/main) 显示 1.56 TB / 96 分片命名；历史仅 11-02 初始提交与 11-05 encoding 修正。由此可排除“只有 README 的空仓库”，但不能反推出当时是否从私有改为公开。未下载整个 1.56 TB 仓库。
- [K3 第一权重分片](https://huggingface.co/moonshotai/Kimi-K3/blob/main/model-00001-of-000096.safetensors) 同样显示 2.34 GB、下载入口与 SHA256，所属提交 `c5d1dd4`（Initial commit）；[当前文件树](https://huggingface.co/moonshotai/Kimi-K3/tree/main) 显示 1.56 TB。时间线仍标“含权重分片的初始提交日”，不把 commit 日期机械称为首次公众可下载时刻。
