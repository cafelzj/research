# GPU 与显存技术专题部署

入口为 [GPU 与显存技术知识网络](https://cafelzj.github.io/research/gpu-memory/index.html)，从“日常研究”及中餐、日料专题的研究导航进入。专题每页顶部可返回日常研究。

内容来自用户上传的 `gpu_memory_atlas_2026.zip`，部署10个HTML页面和3个本地样式/脚本文件，保留七个学习模块、知识图谱、全站检索、时间线、词典、带宽/供电计算和学习清单。目录保留相对路径，无构建、CDN或外部字体依赖。说明文件未作为网页发布。

上传压缩包SHA-256：`641f4e7071adf63c9bb1309c1701b324883a267a63f108d18d32bbea267d78a8`。

首次部署增加了主站入口、各页返回导航、导航高度和锚点偏移、手机顶栏布局及减少动态效果设置。技术正文和数据脚本保持上传版本；保留原资料截止日、教学示意、路线图与送样/量产的状态说明，部署不等同重新逐条核验技术资料。

2026年11月7日按用户要求增加茜茜公主主题，10个页面共同加载 `assets/sisi.css`。以象牙白、酒红、古金、星形饰物、细框和衬线标题形成宫廷藏书的视觉气质，首页采用双栏封面和原创SVG芯片版画。灵感参考[美泉宫白金室](https://www.schoenbrunn.at/en/about-schoenbrunn/the-palace/tour-of-the-palace/white-and-gold-rooms)与[茜茜星形发饰](https://www.habsburger.net/en/items/sisis-stars-famous-jewels-empress-elisabeth-wore-her-hair)。`salon-memory.svg` 和 `salon-flourish.svg` 均为本次原创、自包含装饰图，无外部图片或字体依赖。正文使用清晰的无衬线字，状态标签仍保留不同颜色与文字；技术示意图配色在主题样式中调整，大幅图在手机上局部滚动，保持标签可读。原始样式保留在 `assets/style.css`，主题文件在其后加载；更新主题时同时检查动态图谱、内联SVG、分层图及检索面板。

学习清单由原包脚本保存在浏览器 `localStorage` 的 `atlas-*` 键中，不发送到服务器；存储受限时仍可阅读、搜索和计算。外部资料链接仅在主动点击时访问。

维护目录 `gpu-memory/`，新增页面时保留本地资源的相对地址及返回导航。GitHub Pages工作流复制整个目录，公网验证逐文件检查HTTP状态、HTML类型和内容与提交一致。`scripts/test_gpu_memory.py [网站根地址]` 检查三处入口、十页桌面/手机布局、图谱、检索、时间线、词典、算术工具、返回主站和存储受限情况。
