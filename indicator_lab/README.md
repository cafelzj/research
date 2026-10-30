# Indicator Lab：本地指标治理、检索与数据准备引擎

本工具把 Excel **指标目录**变为带来源行、统计口径、分类和候选关系的可检索索引，不把指标目录冒充数据序列。原始工作簿、全量 SQLite/JSON 和观测数据均应保留在网站发布目录之外。程序不会上传它们，也不向模型发送内容。当前没有连接大模型/向量服务；自然语言检索是可解释的受控词典和规则解析，可扩展而不会伪称“理解所有表达”。

## 安装与完整运行

Python 3.10+（需支持 SQLite JSON1，FTS5 trigram 可选；无 FTS5 时自动使用 LIKE），仅导入 Excel 需要 openpyxl：

```sh
python3 -m pip install -r indicator_lab/requirements.txt
python3 -m indicator_lab build --input '/你的目录/行业指标预料和联想治理.xlsx' --output '/你的私有目录/catalog.sqlite'
python3 -m indicator_lab export --db '/你的私有目录/catalog.sqlite' --output '/你的私有目录/catalog.json'
python3 -m indicator_lab search --db '/你的私有目录/catalog.sqlite' --query '华东重质纯碱周价格' --limit 10
python3 -m indicator_lab serve --db '/你的私有目录/catalog.sqlite' --port 8765
```

然后打开 `http://127.0.0.1:8765/`。默认仅监听 loopback，不提供目录列表。服务只读并只开放明确的 HTML、assets 静态子树及 API。不会把仓库源码、AGENTS.md、SQLite、原工作簿或任意磁盘文件作为静态文件发送。拒绝目录穿越、编码穿越、assets 外的符号链接、外部 Host/Origin 与跨站 fetch。没有设置 CORS 放开，也没有远程通用 URL 代理。公开 GitHub Pages 版不能直接访问本机私有目录；在本机使用服务或在浏览器导入已导出的 JSON。

完整导入示例工作簿的实际结果为 62,241 来源行、61,781 个指标实体、460 个跨行业 code 引用、0 个同 code 非行业属性冲突。27,451 条原始行标“停更”、1,041 条标“预警”是**原表状态**，合并多行业引用后实体数会不同；不得称为本程序发现的数值异常。工作簿没有日期/数值列，没有 Excel 公式。

## 数据契约与可追溯性

导出根对象：`{schema_version, meta, records, audit, relations}`。主要字段：

- `records[].id`：正常情况下采用指标 code；同 code 非行业元数据冲突时保留多个实体，冲突项使用带来源行的 ID。不会静默覆盖。
- `code/name/frequency/unit/source/health`：保留原始定义字段。NFKC/标点归一化只用于检索，不覆盖原名称。
- `industry`：兼容显示用首个原始行业；`industries[]`：全部原始行业；`source_row/source_rows[]`：所有来源行。
- `aliases[]`：只按原表明确的 `@,@` 分隔，不按普通逗号拆开产品规格。原别名没有自动改写成“正式同义指标”。
- `role/roles[]`：名称规则推断的研究角色，保留与原始行业并列。`transform` 是名称提示的同比/环比/累计/占比/原值类别。`base_name` 是用于寻找候选族的规范化主体，不是已验证公式。
- `geography`：有限词典从名称识别的地区；`未明确` 不能视作全国，不能靠猜测填地区。
- `audit.counts/issues/homonyms`：结构化元数据缺失、频率/单位冲突候选、多行业引用和同名异 code。缺失项定位原始行，健康项在 `records.health` 完整保留，`counts.source_health` 按实体统计、不在 `issues` 重复生成几万条文本。

`meta.industries` 对所有原始行业标签计数，合计可大于实体数。原始标签本身不保证专业分类正确，不能把原表中大量“家电”标签当成真实的行业覆盖。跨行业、产业链和研究角色是不同分类维度，尤其不能把原始类别替换成名称正则的猜测。

### 为什么不把相似指标合并

只有 code 相同且所有非行业原始元数据相同时，才合并一个实体并保留多行业和原始行号。**同名但不同 code 不合并**，即使频率、单位、来源目前看起来一样，也可能有不同历史、修订和权限。甲醇 `A000011476` 与 `A000182672` 在文件中同名，但仍分列。DMC 既出现在碳酸二甲酯，也出现在二甲基环硅氧烷；搜索 DMC 展示多个候选，不选一个当唯一正确答案。CPI 没有本地准确匹配时返回 0，不能拿 CCPI 代替。

### 候选关系不是公式和因果证明

`relations` 是按名称主体、频率、来源、已识别地区与相交原行业发现的 `derived_candidate`，状态始终为“待口径与数值验证”。基项有多个不同 code 时不任意选一个。某些名称相同的同比系列也可能是特殊口径，因此还需取得定义和实际序列后才能验证。

`formula_hint` 只供核验：目标单位“百分点”不能套比值增长公式；基项为比率/份额时，比值变化与百分点差均可能，需要原始定义。累计值不意味着基项可加，存量、比例、均价不能简单累加。派生、同族、研究假设、统计相关和经济因果应该是不同关系类型，当前引擎没有从目录创建“已证实因果”边。

## 检索规则与 API

```sh
python3 -m indicator_lab search --db '/私有/catalog.sqlite' --query '美的系空调线上当月零售均价，不要同比'
python3 -m indicator_lab search --db '/私有/catalog.sqlite' --query 'SCFI综合指数周值'
python3 -m indicator_lab search --db '/私有/catalog.sqlite' --query 'A000011476' --industry 基础化工
```

代码精确、完整名称精确、原表别名精确优先；随后按全部概念组交集检索，受控同义词组内部取并集。输出包含匹配理由、识别口径、范围提醒，不给无法校准的“置信概率”。显式频率/单位/地区/同比环比等作为筛选，和自然语言冲突时拒绝匹配，不悄悄忽略。ASCII 术语有字母数字边界，品牌“美的系”中的“的”不删。已有“正常”状态只作为很小的排序参考，停更系列可能对历史研究仍有用，不直接删除。

支持多个真实指标和常见表达，不承诺通用自然语言理解。未识别的词仍然需要匹配，所以可能返回 0；不会靠随意放松维度制造命中。时间范围和画图指令只提示“需要观测值”，不假装目录包含历史行情。主搜索使用规范化精确索引、可选 FTS5 trigram 对长词的 LIKE 加速和短中文词 fallback；无需假装搜索已经使用大模型或 embedding。

只读端点（同时接受 `/api/` 前缀）：

| 路径 | 用途 |
| --- | --- |
| `/health` | 服务、模型和远程启用状态 |
| `/catalog` | 完整本地 JSON，供同源网页自动加载 |
| `/search?q=...&limit=30` | 返回结构化 `intent/results/match_reasons/warnings` |
| `/indicator?id=...` | 查实体 ID 或 code，可能多个，不自动挑选 |
| `/relations?id=...` | 关联候选，默认最多 100 条 |

检索筛选参数：`industry/frequency/transform/unit/source/health/role/geography`。行业按 `industries[]` 成员匹配。`limit` 最多 100。单位目前只做严格匹配，不隐式换算。

## 数据 CP：先取到真实序列，再计算

当前落实的是可审计的月度数据准备和衍生计算。`prepare` 输入独立 CSV，不从指标名称编造观测值。必需字段：

```csv
series_id,date,value,unit,frequency,region,source,coverage
A001,2023-01,100,万吨,月,中国,某数据源,
A001,2024-01,120,万吨,月,中国,某数据源,
A001,2024-02,150,万吨,月,中国,某数据源,
```

```sh
python3 -m indicator_lab prepare --input '/私有/values.csv' --output '/私有/yoy.json' --operation yoy --scan-anomalies
python3 -m indicator_lab prepare --input '/私有/cumulative.csv' --output '/私有/period.json' --operation cumulative_to_period --measure flow
```

实现 `identity/yoy/mom/cumulative_to_period`，明确仅支持月频，季度、周频、日频不偷偷重采样。每个 series 的单位/地区/来源必须一致，否则拒绝；跨序列不得直接拼接。日期按同一日历月对齐；同比找去年同月，环比找上月，缺月保留空值而非补零。重复月、缺数、非法数值、NaN/Inf、零基期、缺失基期、复合 1–2 月区间、负基期和数值溢出均显式标注。

累计转当期必须显式 `--measure flow`，只是声明可加性，并不代替专业核验。1 月累计可作为当期；其他月必须有同年上月有效累计值，不能跨年相减。`coverage` 标注“合并1-2月”“1-2”“Jan-Feb”等时不可拆分，后续计算也不把它作为正常单月基期。下降的累计差保留并标“修订或负值复核”，不擅自裁为零。

输出保留原始值、原始日期、输入行、基期行、输入文件 SHA-256 和计算操作。有限输入导致计算溢出时，输出 null + `derived_nonfinite`，原值继续保留。`--scan-anomalies` 对真实月度一阶差分使用过去窗口的 MAD 提供待复核候选，不看未来；历史不足或 MAD=0 时不制造无穷分数，更不能从这些候选推断经济原因。统计异常、原表健康状态与元数据错误是三套不同信息。

## 远程指标：固定白名单 World Bank

```sh
python3 -m indicator_lab remote-search --query NY.GDP.MKTP.CD
python3 -m indicator_lab remote-search --query 'consumer price index'
python3 -m indicator_lab serve --db '/私有/catalog.sqlite' --port 8765 --allow-remote
```

只有显式启用远程时，服务开放 `/api/remote/search?q=...` 和 `/api/remote/observations?code=NY.GDP.MKTP.CD&country=CHN&start=2020&end=2024`。仅访问 `https://api.worldbank.org/v2` 的固定路由，不接受用户 URL；超时 15 秒、单响应上限 8 MiB，保留 null 与原始响应元信息。名称搜索限定 WDI/source=2 元数据，非全部数据库；英文关键词或精确 code 可用，中文远程语义翻译尚未连接。网络失败返回明确错误，不回落到演示数据冒充远程成功。

已有 World Bank GDP 精确 code 的真实网络烟测成功，单位字段可能为空，此时应读定义，不能猜填；远程同名不自动映射本地商业库。本实现不读取商业库权限和密钥，也未实现 Wind/同花顺等需授权服务。

## 测试

```sh
python3 scripts/test_indicator_engine.py
INDICATOR_TEST_DB='/私有/catalog.sqlite' python3 scripts/test_indicator_engine.py
```

覆盖工作簿导入与行号、同 code 多行业合并/元数据冲突隔离、同名异 code、不误拆逗号别名、候选关系的歧义拒绝、准确检索与过滤冲突、SQL 字符输入、CPI/CCPI 与 DMC、品牌和复合自然语言、缺月/重复月/零基期/跨年累计/合并 1–2 月/单位混用/溢出、本地 Host/Origin 与 assets 路径逃逸、远程坏格式/网络失败、统计候选边界。

### 直接运行人工示例

`examples/` 中所有数字是人工合成教学数据，与上传表的真实指标和行情无关。月度示例含两年，支持同比/环比；累计示例故意含缺月、跨年和合并 1–2 月，便于看到为何有些输出必须为空。

```sh
python3 -m indicator_lab prepare --input indicator_lab/examples/monthly.csv --output /tmp/indicator-yoy-demo.json --operation yoy --scan-anomalies
python3 -m indicator_lab prepare --input indicator_lab/examples/cumulative.csv --output /tmp/indicator-period-demo.json --operation cumulative_to_period --measure flow
```
