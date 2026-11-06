
"use strict";
(() => {
  const root = document.getElementById("sw-atlas");
  if (!root) return;
  const directory = document.getElementById("sw-directory"), reader = document.getElementById("sw-detail"), legacy = document.getElementById("sw-legacy-bar");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let sectors = [], group = "", query = "", dataReady = false;
  const aliases = {"801030":["chemical","深入基础化工产品手册"],"801110":["appliances","深入家电研究"],"801730":["electrical","深入电新研究"],"801150":["medicine","深入医药·创新药"]};
  function mode(kind) {
    document.body.classList.toggle("sw-overview", kind === "catalog");
    document.body.classList.toggle("sw-reader", kind === "reader");
    directory.hidden = kind !== "catalog"; reader.hidden = kind !== "reader"; legacy.hidden = kind !== "legacy";
    document.dispatchEvent(new Event("sw:change"));
    window.dispatchEvent(new Event("resize"));
  }
  function urlFor(code) { return "atlas.html?sw=" + encodeURIComponent(code) + "#sw-detail"; }
  const card = (title, body, attrs = "") => '<article class="sw-card" '+attrs+'><h3>'+esc(title)+'</h3>'+body+'</article>';
  const field = (title, body) => "<h4>"+esc(title)+"</h4><p>"+esc(body)+"</p>";
  const block = (key, title, body) => '<section class="sw-block" id="sw-'+key+'" data-outline="'+esc(title)+'"><h2>'+esc(title)+'</h2>'+body+"</section>";
  function referenceLinks(s, ids) {
    return '<div class="sw-source-links">相关资料 / 支持范围：'+ids.map(id => {
      const ref = s.sources.find(x => x.id === id);
      return '<a href="#sw-ref-'+esc(s.code+"-"+id)+'">'+esc(ref.title)+' ['+esc(ref.status)+']</a>';
    }).join("")+"</div>";
  }
  function catalog() {
    const q = query.trim().toLowerCase();
    const list = sectors.filter(s => (!group || s.group === group) && (!q || JSON.stringify(s).toLowerCase().includes(q)));
    document.getElementById("sw-sector-grid").innerHTML = list.map(s => '<a class="sw-sector-link" href="'+urlFor(s.code)+'" data-sw-code="'+esc(s.code)+'"><small>'+esc(s.group)+' · '+esc(s.code)+'</small><strong>'+esc(s.name)+'</strong><p>'+esc(s.essence)+'</p><span class="sw-tags">'+s.metrics.slice(0,3).map(m=>esc(m.name)).join(" / ")+' →</span></a>').join("");
    document.getElementById("sw-count").textContent = "显示 "+list.length+" / "+sectors.length+" 个行业";
    document.getElementById("sw-no-results").hidden = list.length !== 0;
  }
  function renderSector(s) {
    const chainTitle = s.chainTitle || "主要链条与价值流向";
    const metricTitle = s.metricTitle || "决定行业变化的特色指标";
    const methodTitle = s.methodTitle || "怎样建立可证伪的判断";
    const order = ["801780","801790","801230"].includes(s.code) ? ["methods","chains","metrics","themes","pitfalls","sources"] : ["chains","metrics","methods","themes","pitfalls","sources"];
    const titles = {chains:chainTitle,metrics:metricTitle,methods:methodTitle,themes:"新技术与热点：如何走到商业兑现",pitfalls:"最容易看错什么",sources:"资料依据与核验入口"};
    const bodies = {
      chains:'<div class="sw-reading-grid">'+s.chains.map(c=>card(c.name,'<div class="sw-chain"><div><b>上游 / 要素来源</b>'+esc(c.up)+'</div><div><b>中游 / 价值转化</b>'+esc(c.mid)+'</div><div><b>下游 / 谁来付费</b>'+esc(c.down)+'</div></div>'+field("价值如何留在这一环",c.value)+'<div class="sw-critical"><b>约束与风险：</b>'+esc(c.risk)+'</div>','data-sw-searchable')).join("")+'</div>',
      metrics:'<p class="sw-muted">下面是指标定义和使用方法，没有填入未经核验的当前数值；同名指标也需核对样本、地区、期间与会计口径。</p><div class="sw-reading-grid">'+s.metrics.map(m=>card(m.name,'<span class="sw-status">'+esc(m.unit)+' · '+esc(m.cadence)+'</span>'+field("口径 / 怎样计算",m.meaning)+field("和什么一起看",m.watch)+'<div class="sw-critical"><b>误读：</b>'+esc(m.trap)+'</div>','data-sw-searchable')).join("")+'</div>',
      methods:'<div class="sw-reading-grid">'+s.methods.map(m=>card(m.name,'<ol>'+m.steps.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ol><div class="sw-proof"><b>支持判断的证据：</b>'+esc(m.proof)+'</div><div class="sw-critical"><b>什么会推翻判断：</b>'+esc(m.refute)+'</div>','data-sw-searchable')).join("")+'</div>',
      themes:'<p class="sw-muted">这些是值得跟踪的技术与结构性议题，并非实时新闻榜。成熟度是定性研究判断；政策倡导、样机展示、试点和客户持续付费是不同证据层级。资料链接的支持范围在文末逐项注明。</p><div class="sw-reading-grid">'+s.themes.map(t=>card(t.name,'<span class="sw-status">'+esc(t.stage)+'</span>'+field("为什么可能改变生意",t.mechanism)+field("商业化要验证什么",t.verify)+'<div class="sw-critical"><b>降温 / 证伪信号：</b>'+esc(t.falsify)+'</div>'+referenceLinks(s,t.sourceIds),'data-sw-searchable')).join("")+'</div>',
      pitfalls:'<div class="sw-card"><ul>'+s.pitfalls.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><p class="sw-muted">读研报时，先找数据来源与时间、样本和口径，再检查因果链。价格、估值和交易热度不能替代经营证据；公司披露也需与行业和交易对手交叉核对。</p></div>',
      sources:'<p class="sw-muted">已读取资料只支持下面明确写出的范围，不代表所有技术、财务推演和当前景气判断已被核验。核验入口尚未逐项读取；本页的研究机制由独立整理形成。</p><div class="sw-reading-grid">'+s.sources.map(r=>card(r.title,'<span class="sw-status">'+esc(r.status)+'</span><p><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">打开原始资料 ↗</a></p><p>'+esc(r.scope)+'</p>'+(r.published?'<small>文档日期 / 时间说明：'+esc(r.published)+'</small>':""),'id="sw-ref-'+esc(s.code+"-"+r.id)+'"')).join("")+'</div>'
    };
    const more = aliases[s.code];
    reader.innerHTML = '<a href="atlas.html" class="sw-back" data-sw-home>← 全部 31 个行业</a><header class="sw-read-head"><span class="sw-eyebrow">SHENWAN 2021 / 一级指数 '+esc(s.code)+'</span><h1>'+esc(s.name)+'</h1><p>'+esc(s.essence)+'</p><p class="sw-muted"><b>行业边界：</b>'+esc(s.boundary)+'</p>'+(more?'<a class="sw-button" href="atlas.html?industry='+more[0]+'">'+esc(more[1])+' ↗</a>':"")+'</header><div class="sw-lens"><b>研究起手式</b><p>'+esc(s.lens)+'</p></div><label for="sw-reader-query">搜索本行业的链条、指标、方法与技术</label><input id="sw-reader-query" type="search" placeholder="输入术语或研究问题"><p id="sw-reader-count" role="status" class="sw-muted"></p><nav class="sw-reader-nav" aria-label="本行业阅读目录">'+order.map(k=>'<a href="#sw-'+k+'">'+esc(titles[k])+'</a>').join("")+'</nav>'+order.map(k=>block(k,titles[k],bodies[k])).join("")+'<footer class="sw-footer">申万一级行业研究入门 · 分类采用2021版。每项资料按其文档时点理解；未接实时行情，不能将热点推演当作当前行业结论。<br><a href="atlas.html" data-sw-home>返回全部行业 ↑</a></footer>';
    document.getElementById("sw-reader-query").oninput = e => {
      const q = e.target.value.trim().toLowerCase();
      let count=0;
      reader.querySelectorAll("[data-sw-searchable]").forEach(el => { el.hidden=!!q&&!el.textContent.toLowerCase().includes(q); if(!el.hidden)count++; });
      document.getElementById("sw-reader-count").textContent = q ? "匹配 "+count+" 张内容卡片；清空搜索恢复全部。" : "";
    };
    document.title = s.name+" · 产业链与行业研究 · 知研集";
  }
  function route(scroll = false) {
    const params = new URLSearchParams(location.search), code = params.get("sw");
    if(code && dataReady) {
      const sector = sectors.find(s=>s.code===code);
      if(sector){renderSector(sector);mode("reader");}
      else {mode("catalog");document.getElementById("sw-count").textContent="未找到该行业代码，请从以下31个行业选择。";}
    } else if(params.has("industry") || params.has("chemChain")) mode("legacy");
    else { mode("catalog");document.title="31个申万一级行业 · 产业链总览 · 知研集"; }
    if(scroll) {
      const target = code && !reader.hidden ? reader : root;
      target.scrollIntoView({block:"start",behavior:"auto"});
      target.setAttribute("tabindex","-1");target.focus({preventScroll:true});
    } else if (dataReady && location.hash.startsWith("#sw-")) {
      requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({block:"start"}));
    }
  }
  root.addEventListener("click",e=>{
    const link=e.target.closest("a[data-sw-code],a[data-sw-home]");
    if(!link||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button)return;
    e.preventDefault();
    history.pushState(null,"",link.getAttribute("href"));route(true);
  });
  window.addEventListener("popstate",()=>route());
  document.addEventListener("industry:change",()=>{if(!new URLSearchParams(location.search).has("sw"))route();});
  route();
  async function init() {
    const status=document.getElementById("sw-count");
    status.textContent="正在加载行业研究内容…";
    try {
      const response=await fetch("assets/sw-atlas.json");
      if(!response.ok)throw Error("HTTP "+response.status);
      const data=await response.json();
      if(!Array.isArray(data.sectors)||data.sectors.length!==31)throw Error("行业数据不完整");
      sectors=data.sectors;dataReady=true;
      document.getElementById("sw-query").oninput=e=>{query=e.target.value;catalog();};
      document.querySelectorAll("[data-sw-group]").forEach(b=>b.onclick=()=>{
        group=b.dataset.swGroup;document.querySelectorAll("[data-sw-group]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));catalog();
      });
      catalog();route();
    } catch(error) {
      status.innerHTML='行业研究内容未能加载，请稍后重试。 <button type="button" id="sw-retry" class="sw-button">重新加载</button>';
      document.getElementById("sw-retry").onclick=init;
    }
  }
  init();
})();
