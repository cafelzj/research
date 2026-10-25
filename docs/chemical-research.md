# 六大化工研究手册

入口：`atlas.html#product-applications`；可用 `?chemChain=pu|soda|tio2|phosphate|fluoro|silicon` 直达专题。保持现有行业选择和浏览工具，无记录输入、打卡或存储功能。

每个专题按原理、工艺、产品详解、客户选材情景、指标、成本壁垒、周期复盘方法、术语和来源九个部分展开。产品详解分机制、用途、优势、替代方案、验收指标和边界，不把应用等级当成可相加的独立产品产量。客户案例为教学推演，不冒充真实访谈。

数据维护：`assets/chemical-applications-data.js` 是内容唯一来源，`assets/chemical-applications.js` 负责渲染。来源记录含 URL、标题、阅读日期、种类和抓取 HTML SHA-256（页面更新后可能变化）。厂商材料支持相关技术用途；跨材料选择与经济性为研究归纳。基础化学说明和明确标出的资料缺口，不能当作已查证的牌号性能或客户认证。

未提供未经核验的实时价格、配额数量、市场份额、历史业绩与采购事实。历史部分是复盘方法，而非已完成的量化事件研究；进入实证研究仍需同期公告、财报和标准化数据。

运行 `python3 scripts/export_chemical_handbook.py` 生成同源离线手册 `assets/chemical-research-handbook.md`。运行 `python3 scripts/test_chemical_research.py [base_url]` 检查六专题、来源关联、深链接、行业切换、移动布局与下载内容。
