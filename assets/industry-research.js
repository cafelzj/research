"use strict";
(() => {
  const data = window.IndustryResearchData,
    hub = document.getElementById("industryHub");
  if (!data || !hub) return;
  const mode = hub.dataset.mode,
    esc = (s) =>
      String(s).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  let industry = "chemical",
    demoVisible = false;
  const allKeys = ["chemical", ...Object.keys(data.industries)];
  function refs(keys) {
    return `<div class="ir-source-links">相关阅读 / 核验入口：${keys.map((k) => `<a href="#ir-source-${esc(k)}">${esc(data.sources[k].title.split("：")[0].split(" · ")[0])}〔${esc(data.sources[k].status)}〕</a>`).join("")}</div>`;
  }
  function section(id, title, body) {
    return `<section class="ir-block" id="ir-${id}" data-outline="${esc(title)}"><h2>${esc(title)}</h2>${body}</section>`;
  }
  function card(title, body, search = true) {
    return `<article class="ir-card"${search ? " data-ir-searchable" : ""}><h3>${esc(title)}</h3>${body}</article>`;
  }
  function field(label, text) {
    return `<h4>${esc(label)}</h4><p>${esc(text)}</p>`;
  }
  function sourceSection() {
    return section(
      "sources",
      "资料、核验状态与阅读顺序",
      `<p class="ir-muted">先读官方口径和政策，再读公司披露，最后比较行业数据和模型。下面的入口不是已核验数据的证明；研究方法中的推断属于教学框架。标记“已读取”仅覆盖明确说明的文档范围。</p><div class="ir-grid">${Object.entries(
        data.sources,
      )
        .filter(
          ([key]) =>
            data.industries[industry].refs.includes(key) ||
            data.industries[industry].routes.some((x) =>
              x.refs.includes(key),
            ) ||
            data.industries[industry].history.some((x) =>
              x.refs.includes(key),
            ) ||
            key === "owid",
        )
        .map(
          ([key, s]) =>
            `<article class="ir-card ir-source-item" id="ir-source-${key}"><span class="ir-badge">${esc(s.kind)} · ${esc(s.status)}</span><h3><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></h3><p>${esc(s.scope)}</p><small class="ir-muted">${s.checkedAt ? "读取日期：" + esc(s.checkedAt) : "尚未完成在线逐条核验；不得据此标记当前景气。"}</small></article>`,
        )
        .join("")}</div>`,
    );
  }
  function measuredHistory() {
    if (industry !== "electrical") return "";
    const h = data.historyData,
      rows = h.rows,
      last = rows[rows.length - 1];
    const total = last.solar_electricity + last.wind_electricity,
      share = (total / last.electricity_generation) * 100;
    const max = 1000,
      x = (i) => 50 + i * 55,
      y = (v) => 240 - (v / max) * 200;
    const line = (key) =>
      rows.map((r, i) => (i ? "L" : "M") + x(i) + " " + y(r[key])).join(" ");
    const plot = `<div class="ir-history-chart"><svg viewBox="0 0 600 280" role="img" aria-label="中国2015至2024年风电与光伏发电量，单位TWh，来源OWID固定版本历史数据"><title>中国风光发电量历史；不是装机规模或制造利润</title>${[0, 250, 500, 750, 1000].map((v) => `<line x1="50" y1="${y(v)}" x2="560" y2="${y(v)}" stroke="#d6e1e8"/><text x="43" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}<path d="${line("solar_electricity")}" fill="none" stroke="#b87833" stroke-width="3"/><path d="${line("wind_electricity")}" fill="none" stroke="#2377ad" stroke-width="3"/>${rows.map((r, i) => `<text x="${x(i)}" y="265" text-anchor="middle">${r.year}</text>`).join("")}</svg></div>`;
    return section(
      "history-data",
      "可复算的历史数据 / 中国风光发电",
      `<p>使用已读取的同一固定版本历史电量：2015—2024年，单位 TWh（1TWh=10亿kWh）。<b>蓝线为风电，棕线为光伏</b>，下表提供精确值。</p>${plot}<p>该快照2024年风光发电合计 <b>${total.toFixed(2)} TWh</b>，占同口径总发电量 <b>${share.toFixed(2)}%</b>。它能说明电量结构变化，不能直接回答设备公司赚了多少钱，更不能据此判断当前周期已见底。</p><div class="ir-table-scroll"><table class="ir-table"><caption>OWID历史快照；功率GW与电量TWh不可混用。未采集2025/2026当前数据。</caption><thead><tr><th scope="col">年份</th><th scope="col">光伏发电 TWh</th><th scope="col">风电发电 TWh</th><th scope="col">总发电量 TWh</th><th scope="col">风光电量占比</th></tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${r.year}</th><td>${r.solar_electricity.toFixed(3)}</td><td>${r.wind_electricity.toFixed(3)}</td><td>${r.electricity_generation.toFixed(3)}</td><td>${(((r.solar_electricity + r.wind_electricity) / r.electricity_generation) * 100).toFixed(2)}%</td></tr>`).join("")}</tbody></table></div><p class="ir-muted">复算公式：（风电发电量+光伏发电量）÷总发电量×100%。${esc(h.upstream)}</p><p><a href="${esc(h.url)}" target="_blank" rel="noopener noreferrer">固定提交原始CSV ↗</a> · <a href="${esc(h.codebookUrl)}" target="_blank" rel="noopener noreferrer">同版本字段字典 ↗</a></p><details><summary>数据版本与能说 / 不能说的结论</summary><p class="ir-muted">读取日期 ${esc(h.retrievedAt)} · 提交 ${esc(h.snapshotCommit)}。${esc(h.caution)}</p><p>下一步研究：分别补充各环节价格、有效产能和公司现金流，解释为什么发电需求扩张时制造利润仍可能下降。来源机构每年修订也可能改变历史值，应保留版本。</p></details>`,
    );
  }
  function metricBody(m) {
    return `<span class="ir-badge">${esc(m.unit)} · ${esc(m.freq)}</span>${field("怎么计算 / 什么口径", m.definition)}${field("在证据链中的位置", m.leading)}<div class="ir-criteria">${field("支持改善的组合证据", m.positive)}</div><div class="ir-criteria ir-refute">${field("反证 / 转弱信号", m.negative)}</div>${field("最容易看错", m.trap)}${refs(m.refs)}`;
  }
  function atlas(s) {
    const routes = section(
      "chains",
      "01 / 产业链与利润分布",
      `<p>先选一个细分链条，从最终客户往上追溯，再从材料成本往下推演利润。这里的箭头表示业务关系，不代表统一报价或上市公司分类。</p><div class="ir-grid">${s.routes.map((r) => card(r.name, `<div class="ir-chain"><div><b>01 / 上游</b>${esc(r.up)}</div><div><b>02 / 中游</b>${esc(r.mid)}</div><div><b>03 / 下游</b>${esc(r.down)}</div></div>${field("钱在哪里赚", r.profit)}${field("先跟踪什么", r.watch)}${field("研究陷阱", r.pitfall)}${refs(r.refs)}`)).join("")}</div>`,
    );
    const methods = section(
      "methods",
      "02 / 逻辑、方法与判断标准",
      `<p class="ir-muted">判断标准是证据组合与失效条件，不能拿一个同比或固定阈值给全行业打分。</p><div class="ir-grid">${s.methods.map((m) => card(m.title, `<p><b>核心问题：</b>${esc(m.question)}</p><ol>${m.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol><div class="ir-criteria">${field("什么证据支持", m.proof)}</div><div class="ir-criteria ir-refute">${field("什么情况推翻", m.refute)}</div>${refs(m.refs)}`)).join("")}</div>`,
    );
    const metrics = section(
      "metrics",
      "03 / 重要指标与口径字典",
      `<div class="ir-grid">${s.metrics.map((m) => card(m.name, metricBody(m))).join("")}</div>`,
    );
    const history = section(
      "history",
      "04 / 历史事件复盘训练",
      `<p class="ir-warning">以下是历史研究题目与机制框架，不是已经完成的事件收益回测。政策原文、具体数值与各公司因果关系仍待来源核验；练习时只使用当时已经公开的资料。</p><div class="ir-grid">${s.history.map((c) => card(c.title, field("事件线索", c.event) + field("可能的传导机制", c.mechanism) + field("怎么复盘", c.test) + field("如何避免后见之明", c.falsify) + refs(c.refs))).join("")}</div>`,
    );
    const tech = section(
      "technology",
      "05 / 技术路线与商业化",
      `<div class="ir-grid">${s.technologies.map((t) => card(t.name, field("小白解释", t.meaning) + field("为什么影响生意", t.why) + field("应该验证什么", t.verify) + field("不要混淆", t.trap) + refs(t.refs))).join("")}</div>`,
    );
    const terms = section(
      "glossary",
      "06 / 新手术语与例子",
      `<div class="ir-grid">${s.glossary.map((t) => card(t.name, `<p>${esc(t.meaning)}</p>${field("举个例子", t.example)}${field("易混点", t.trap)}`)).join("")}</div>`,
    );
    const learning = section(
      "learning",
      "07 / 四周入门到研究练习",
      `<p>四周是开始建立研究习惯，不代表完成专业训练。每周都要产出可复核的材料，再持续跟踪和改错。</p><div class="ir-grid">${data.learning.map((x) => card(x.week, `<p>${esc(x.task)}</p>${field("交付成果", x.deliverable)}${field("自测标准", x.check)}`, false)).join("")}</div>`,
    );
    return (
      routes +
      methods +
      metrics +
      history +
      measuredHistory() +
      tech +
      terms +
      learning +
      sourceSection()
    );
  }
  function dashboard(s) {
    const summary = `<div class="ir-stats"><div><strong>${s.metrics.length}</strong>核心跟踪指标</div><div><strong>${s.routes.length}</strong>产业链研究方向</div><div><strong>${s.methods.length}</strong>研究方法</div></div>`;
    const watch = section(
      "watch",
      "01 / 行业观察与反证清单",
      `<p class="ir-muted">这里提供指标口径、改善证据与反证方向，尚未接入自动行情。缺失不表示行业停产或指标为零。</p><div class="ir-table-scroll"><table class="ir-table"><caption>${esc(s.name)}核心指标；判断须结合历史、季节与多源验证</caption><thead><tr><th scope="col">指标与频率</th><th scope="col">数据状态</th><th scope="col">支持改善的证据</th><th scope="col">反证 / 注意</th></tr></thead><tbody>${s.metrics
        .map((m) => {
          return `<tr><th scope="row">${esc(m.name)}<small>${esc(m.unit)} · ${esc(m.freq)}</small></th><td>暂无已核验数据</td><td>${esc(m.positive)}</td><td>${esc(m.negative)}<details><summary>查看统计口径</summary><p>${esc(m.definition)}</p><p>${esc(m.trap)}</p>${refs(m.refs)}</details></td></tr>`;
        })
        .join("")}</tbody></table></div>`,
    );
    const teaching = section(
      "demo",
      "02 / 教学演示与敏感性练习",
      `<p class="ir-warning">此区域完全是教学假设，不是行业统计，与已核验的历史数据分开展示。曲线不用于当前景气判断。</p><button id="ir-demo-toggle" type="button" aria-expanded="${demoVisible}">${demoVisible ? "收起" : "显示"}教学指数曲线（非真实数据）</button><div id="ir-demo-chart" class="ir-demo" ${demoVisible ? "" : "hidden"}></div><form class="ir-form" id="ir-calc-form"><h3>${industry === "appliances" ? "量价如何一起影响收入？" : "储能时长与单循环价差练习"}</h3>${industry === "appliances" ? `<div class="ir-fields"><label>销量变化（%，教学假设）<input name="a" type="number" value="10" min="-100" max="10000" step="any" required></label><label>ASP变化（%，教学假设）<input name="b" type="number" value="5" min="-100" max="10000" step="any" required></label></div>` : `<div class="ir-fields"><label>额定放电功率（MW）<input name="power" type="number" value="2" min="0.001" max="100000" step="any" required></label><label>可用放电能量（MWh，教学假设）<input name="energy" type="number" value="4" min="0.001" max="1000000" step="any" required></label><label>交流侧往返效率（%）<input name="eff" type="number" value="90" min="0.001" max="100" step="any" required></label><label>购电价（元/kWh）<input name="buy" type="number" value="0.3" min="0" max="100" step="any" required></label><label>售电价（元/kWh）<input name="sell" type="number" value="0.8" min="0" max="100" step="any" required></label></div>`}<button type="submit">计算教学情景</button><p id="ir-calc-result" role="status" class="ir-status"></p><p class="ir-muted">${industry === "appliances" ? "公式：(1+销量变化)×(1+ASP变化)−1。未考虑渠道样本与产品结构；收入增长不等于利润增长。" : "时长=可用放电能量÷功率；购电量=放电量÷RTE。单循环毛价差=售电收入−购电成本，不含衰减、辅机以外其他成本、运维、税费、容量费、融资或CAPEX，不是利润或IRR。假设RTE已包含交流侧辅机损耗，且可完成一个完整循环。"}</p></form>`,
    );
    return summary + watch + measuredHistory() + teaching + sourceSection();
  }
  function renderDemo() {
    const target = hub.querySelector("#ir-demo-chart");
    if (!target) return;
    target.hidden = !demoVisible;
    if (!demoVisible) return;
    const vals = Array.from(
      { length: 12 },
      (_, i) => 100 + 7 * Math.sin(i * 0.65) + i * 0.6,
    );
    target.innerHTML = `<b>假设需求指数 · 第1月归一为100 · 纯教学</b><svg viewBox="0 0 620 240" role="img" aria-label="虚构的12个月需求指数教学曲线，不是真实市场数据"><line x1="40" y1="200" x2="600" y2="200"/><line x1="40" y1="30" x2="40" y2="200"/><text x="5" y="40">120</text><text x="5" y="120">100</text><text x="10" y="200">80</text><path d="${vals.map((v, i) => (i ? "L" : "M") + (40 + i * 50) + " " + (200 - ((v - 80) / 40) * 170)).join(" ")}" fill="none" stroke="#176d70" stroke-width="3"/><text x="40" y="225">假设第1月</text><text x="500" y="225">假设第12月</text></svg><p class="ir-muted">练习：曲线上升时，提出需求增长、渠道补库、样本变化三种解释；列出能区分三者的证据。该曲线未采集任何实际行情。</p>`;
  }
  function render() {
    if (industry === "chemical") return;
    const s = data.industries[industry];
    const cross = mode === "atlas" ? "index.html" : "atlas.html";
    const crossLabel = mode === "atlas" ? "打开本行业看板" : "学习本行业产业链";
    hub.innerHTML = `<div class="ir-intro"><div><span class="ir-kicker">${mode === "atlas" ? "INDUSTRY RESEARCH / LEARN" : "INDUSTRY MONITOR / VERIFY"} · ${esc(s.name)}</span><h1>${esc(s.subtitle)}</h1><p>${esc(s.intro)}</p><p class="ir-muted">研究范围：${esc(s.scope)}</p><a href="${cross}?industry=${industry}">${crossLabel} ↗</a></div><div class="ir-context"><b>研究主线</b><p>${esc(s.core)}</p></div></div><p class="ir-warning">内容整理：${esc(data.preparedAt)}。${esc(data.researchStatus)}</p>${mode === "atlas" ? `<div class="ir-search-row"><label>搜索本行业的链条、指标、技术、术语<input id="ir-search" type="search" placeholder="试试：库存、热泵、LCOE、现金流"></label><span id="ir-search-count" class="ir-muted" role="status"></span></div>` : ""}<nav class="ir-jump" aria-label="本行业章节">${(mode ===
    "atlas"
      ? [
          ["chains", "产业链"],
          ["methods", "方法与标准"],
          ["metrics", "指标"],
          ["history", "历史复盘"],
          ["technology", "技术"],
          ["glossary", "术语"],
          ["learning", "学习路径"],
          ["sources", "资料"],
        ]
      : [
          ["watch", "指标跟踪"],
          ["demo", "教学练习"],
          ["sources", "资料"],
        ]
    )
      .map(([id, label]) => `<a href="#ir-${id}">${label}</a>`)
      .join(
        "",
      )}</nav>${mode === "atlas" ? atlas(s) : dashboard(s)}<footer class="ir-foot">家电 / 电新研究入门 · 不含实时行情或当前评级。资料核验未完成的部分已逐项标注。内容是研究训练，不能代替原始统计与公司公告。</footer>`;
    bind();
    renderDemo();
  }
  function bind() {
    const search = hub.querySelector("#ir-search");
    if (search)
      search.oninput = () => {
        const q = search.value.trim().toLowerCase();
        let visible = 0;
        hub.querySelectorAll("[data-ir-searchable]").forEach((el) => {
          el.hidden = !!q && !el.textContent.toLowerCase().includes(q);
          if (!el.hidden) visible++;
        });
        hub.querySelector("#ir-search-count").textContent = q
          ? `匹配 ${visible} 张卡片；清空搜索查看全部。`
          : "";
      };
    const toggle = hub.querySelector("#ir-demo-toggle");
    if (toggle)
      toggle.onclick = () => {
        demoVisible = !demoVisible;
        toggle.setAttribute("aria-expanded", String(demoVisible));
        toggle.textContent =
          (demoVisible ? "收起" : "显示") + "教学指数曲线（非真实数据）";
        renderDemo();
      };
    const calc = hub.querySelector("#ir-calc-form");
    if (calc)
      calc.onsubmit = (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(calc));
        const vals = Object.values(f).map(Number);
        const el = hub.querySelector("#ir-calc-result");
        if (vals.some((x) => !Number.isFinite(x))) {
          el.textContent = "请填写有限数值。";
          return;
        }
        if (industry === "appliances") {
          const a = +f.a,
            b = +f.b;
          if (a < -100 || b < -100) {
            el.textContent = "销量与单价变化不能低于−100%。";
            return;
          }
          el.textContent = `教学假设：收入变化约 ${((1 + a / 100) * (1 + b / 100) * 100 - 100).toFixed(2)}%。这不是利润增速。`;
        } else {
          const p = +f.power,
            n = +f.energy,
            eff = +f.eff / 100,
            buy = +f.buy,
            sell = +f.sell;
          if (p <= 0 || n <= 0 || eff <= 0 || eff > 1 || buy < 0 || sell < 0) {
            el.textContent =
              "功率和能量应为正，效率在0至100%之间且不为0，电价非负。";
            return;
          }
          el.textContent = `教学假设：名义时长 ${(n / p).toFixed(2)} 小时；需购电 ${(n / eff).toFixed(3)} MWh；单循环毛价差 ${(n * 1000 * sell - (n / eff) * 1000 * buy).toFixed(2)} 元。未扣完整成本，不等于利润。`;
        }
      };
  }
  function choose(key, push = false) {
    if (!allKeys.includes(key)) key = "chemical";
    industry = key;
    demoVisible = false;
    document.body.dataset.industry = key;
    document.getElementById("chemicalContent").hidden = key !== "chemical";
    hub.hidden = key === "chemical";
    document
      .querySelectorAll("[data-industry-choice]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.industryChoice === key),
        ),
      );
    if (key !== "chemical") {
      render();
    }
    document.title =
      (key === "chemical" ? "化工" : data.industries[key].name) +
      " · " +
      (mode === "atlas" ? "产业链研究" : "行业看板") +
      " · 知研集";
    document.querySelectorAll(".site-nav a").forEach((a) => {
      const file = a.getAttribute("href").split("?")[0];
      if (["atlas.html", "index.html"].includes(file))
        a.href = file + (key === "chemical" ? "" : "?industry=" + key);
    });
    if (push) {
      const url = new URL(location.href);
      url.searchParams.set("industry", key);
      url.hash = "";
      history.pushState(null, "", url);
    }
    document.dispatchEvent(
      new CustomEvent("industry:change", { detail: { industry: key } }),
    );
    if (location.hash.startsWith("#ir-"))
      requestAnimationFrame(() =>
        document
          .getElementById(decodeURIComponent(location.hash.slice(1)))
          ?.scrollIntoView(),
      );
  }
  document
    .querySelectorAll("[data-industry-choice]")
    .forEach((b) => (b.onclick = () => choose(b.dataset.industryChoice, true)));
  window.addEventListener("popstate", () =>
    choose(new URLSearchParams(location.search).get("industry") || "chemical"),
  );
  choose(new URLSearchParams(location.search).get("industry") || "chemical");
})();
