(() => {
  const host = document.getElementById('product-applications');
  if (!host || !window.ChemicalResearch) return;
  const {chapters, sources, date} = window.ChemicalResearch;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sourceLinks = ids => ids.map(id => `<a href="#chem-source-${esc(id)}">${esc(sources[id].title)}</a>`).join('；');
  const table = (heads, rows) => `<div class="chem-table-wrap" tabindex="0" aria-label="可横向滚动的比较表"><table><thead><tr>${heads.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((v,i) => i ? `<td>${esc(v)}</td>` : `<th scope="row">${esc(v)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const initial = new URL(location.href).searchParams.get('chemChain');
  host.classList.add('chem-research');
  host.innerHTML = `<div class="eyebrow">CHEMICAL INDUSTRY / RESEARCH HANDBOOK</div><h2>六大产业链研究手册</h2><p class="chem-lead">从分子与工艺，走到客户选材、企业利润和行业周期。读懂产品为什么被使用，才能判断需求是否真实、替代是否可行、增长能否变成利润。</p><div class="chem-study"><h3>建议按这条路径学习</h3><ol><li>读清产业链分支：原料、反应中间体和终端材料不是同一种市场。</li><li>逐项读产品详解：用途 → 性能原因 → 替代方案 → 客户验收指标。</li><li>用应用案例理解客户选择，再用研究指标解释公司经营。</li><li>查技术来源和公司披露，对比不同牌号与历史阶段；“了解材料族”不等于“掌握任何牌号”。</li></ol></div><div class="chem-tabs" role="group" aria-label="选择行业研究专题"></div><div class="chem-body" aria-live="polite"></div>`;
  const tabs = host.querySelector('.chem-tabs'), body = host.querySelector('.chem-body');
  tabs.innerHTML = chapters.map(d => `<button type="button" data-chem-chain="${d.key}">${d.name}</button>`).join('');
  function show(key, update = true) {
    const d = chapters.find(c => c.key === key) || chapters[0];
    tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.chemChain === d.key)));
    const refs = [...new Set([...d.refs, ...d.products.flatMap(p => p.refs.split(','))])];
    body.innerHTML = `<header class="chem-chapter-header"><small>行业专题 · ${d.products.length} 组产品与应用详解</small><h3>${d.name}</h3><p class="chem-question">${d.question}</p></header>
      <nav class="chem-chapter-nav" aria-label="专题阅读目录">${[['overview','行业原理'],['routes','工艺比较'],['products','产品详解'],['case','客户案例'],['metrics','研究指标'],['economics','成本与壁垒'],['history','周期复盘'],['glossary','术语'],['sources','资料来源']].map(([id,label]) => `<a href="#chem-${id}">${label}</a>`).join('')}</nav>
      <section id="chem-overview"><h4>01 / 先理解行业在解决什么问题</h4><p>${esc(d.intro)}</p><div class="chem-route"><b>产业链分支</b><p>${esc(d.route)}</p></div></section>
      <section id="chem-routes"><h4>02 / 工艺、路线与取舍</h4>${table(['环节 / 路线','如何理解','经济性与限制'], d.process.map(p => [p.name,p.how,p.tradeoff]))}</section>
      <section id="chem-products"><h4>03 / 产品详解：从性能到客户选择</h4><p>先按材料族理解功能，再区分晶型、形态、等级与牌号。以下条目包含重叠的应用分类，不可相加为行业产量。</p><nav class="chem-product-index" aria-label="产品目录">${d.products.map((p,i) => `<a href="#chem-product-${i}">${esc(p.name)}</a>`).join('')}</nav>${d.products.map((p,i) => `<article class="chem-product" id="chem-product-${i}"><div class="chem-product-heading"><span>${String(i+1).padStart(2,'0')}</span><h5>${esc(p.name)}</h5></div><p class="chem-mechanism">${esc(p.mechanism)}</p><dl><div><dt>典型应用</dt><dd>${esc(p.application)}</dd></div><div><dt>核心优势与价值</dt><dd>${esc(p.advantage)}</dd></div><div><dt>与替代材料比较</dt><dd>${esc(p.alternative)}</dd></div><div><dt>客户关注的性能指标</dt><dd>${esc(p.metrics)}</dd></div><div><dt>使用与研究边界</dt><dd>${esc(p.boundary)}</dd></div></dl><p class="chem-evidence">相关技术资料：${sourceLinks(p.refs.split(','))}。引用支持相关材料/用途；跨材料比较为研究归纳。条目注明的资料缺口不视作已验证牌号结论。</p></article>`).join('')}</section>
      <section id="chem-case" class="chem-case"><h4>04 / 站在客户一侧：一个选材推演</h4><p>${esc(d.case)}</p><small>教学情景，用于解释判断方法，不是特定客户的采购事实。</small></section>
      <section id="chem-metrics"><h4>05 / 研究员应该跟踪什么</h4>${table(['指标','看什么','如何解读','容易误判的地方'], d.metrics.map(m => [m.name,m.meaning,m.signal,m.trap]))}<p class="chem-evidence">指标表是研究框架，不是已采集行情；没有以空白或演示数据代替真实值。更新时应记录来源、日期、单位、区域和税运口径。</p></section>
      <section id="chem-economics"><h4>06 / 成本、盈利与竞争壁垒</h4><p>${esc(d.economics)}</p><div class="chem-formula">需求量 ≈ 终端实际产量 × 单位材料耗用 ± 库存变化<br>经营利润 ≈ 实际销量 × 净售价 − 原料/能源/制造/物流成本 − 期间费用</div><p>上述是分析分解，不是可以跨工艺套用的精确公式。耗用、良率、联产品、计价和库存都要按公司及产品校准。</p></section>
      <section id="chem-history"><h4>07 / 如何复盘历史、检验判断</h4><p>${esc(d.cycle)}</p><p>先建立时间轴：价格和订单变化 → 可核验的需求/供给事件 → 当期出货与库存 → 下一期财务表现。保留与原判断相反的证据。本节提供复盘方法，未编造历史收益率、市场份额或供需数量。</p></section>
      <section id="chem-glossary"><h4>08 / 读报告前要懂的术语</h4><dl class="chem-glossary">${d.glossary.map(g => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.definition)}</dd></div>`).join('')}</dl></section>
      <section id="chem-sources"><h4>09 / 技术来源与证据范围</h4><p>资料核对日期 ${date}。生产商资料用于确认材料和应用特征，宣传性优点不能代替独立对比试验。原理、选材比较和盈利推演是教学归纳；具体牌号、合规及当期政策须查对应技术表、标准和最新公告。</p><ol class="chem-sources">${refs.map(id => `<li id="chem-source-${id}"><a href="${esc(sources[id].url)}" target="_blank" rel="noopener">${esc(sources[id].title)} ↗</a><small>${esc(sources[id].kind)} · 阅读 ${sources[id].read}</small></li>`).join('')}</ol><a href="assets/chemical-research-handbook.md" download>下载完整研究手册（Markdown） ↗</a></section>`;
    if(update) {const u = new URL(location.href);u.searchParams.set('chemChain',d.key);history.replaceState(null,'',u);}
  }
  tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => show(b.dataset.chemChain)));
  window.addEventListener('popstate', () => show(new URL(location.href).searchParams.get('chemChain'), false));
  show(initial,false);
})();
