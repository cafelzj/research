"use strict";
(() => {
  const D = window.MenuRiskData || window.WashokuData;
  if (!D) return;
  const ui = {
    aliasLabel: "日文名",
    csvName: "日料菜单-制作路径研究.csv",
    unit: "道",
    itemLabel: "道菜",
    starterIds: [
      "wakame",
      "tako-wasabi",
      "kabayaki",
      "tamagoyaki",
      "korokke",
      "takoyaki",
    ],
    ...D.ui,
  };
  let menuView = ui.defaultView === "table" ? "table" : "cards";
  const $ = (id) => document.getElementById(id),
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
  const dishes = new Map(D.dishes.map((d) => [d.id, d])),
    categories = new Set(D.categories.map((c) => c.id)),
    focuses = new Set(Object.keys(D.focus)),
    risks = new Set(Object.keys(D.riskLevels));
  const normalize = (s) => String(s).normalize("NFKC").toLowerCase().trim();
  const params = new URLSearchParams(location.search),
    state = {
      category: categories.has(params.get("category"))
        ? params.get("category")
        : "all",
      focus: focuses.has(params.get("focus")) ? params.get("focus") : "all",
      risk: risks.has(params.get("risk")) ? params.get("risk") : "all",
      query: (params.get("q") || "").slice(0, 100),
      proof: false,
    };
  const verified = (d) => d.refs.some((id) => D.sources[id]?.verified === true);
  function syncUrl() {
    const url = new URL(location.href);
    if (state.category === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", state.category);
    if (state.focus === "all") url.searchParams.delete("focus");
    else url.searchParams.set("focus", state.focus);
    if (state.risk === "all") url.searchParams.delete("risk");
    else url.searchParams.set("risk", state.risk);
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }
  function baseMatches(d) {
    if (state.risk !== "all" && d.risk.level !== state.risk) return false;
    if (state.focus !== "all" && d.focus !== state.focus) return false;
    if (state.proof && !verified(d)) return false;
    const tokens = normalize(state.query).split(/\s+/).filter(Boolean),
      text = normalize(
        [
          d.name,
          d.ja,
          ...d.aliases,
          D.focus[d.focus].name,
          D.riskLevels[d.risk.level].name,
          d.risk.target,
          d.risk.reason,
          d.preparedPath,
          d.onsitePath,
          d.ask,
          d.trap,
        ].join(" "),
      );
    return tokens.every((t) => text.includes(t));
  }
  function filtered() {
    return D.dishes
      .filter(
        (d) =>
          baseMatches(d) &&
          (state.category === "all" || d.category === state.category),
      )
      .sort(
        (a, b) =>
          D.riskLevels[a.risk.level].rank - D.riskLevels[b.risk.level].rank,
      );
  }
  function stage(d) {
    const f = D.focus[d.focus];
    return `<span class="w-stage ${f.color}">${esc(f.short)}</span>`;
  }
  function riskBadge(d) {
    return `<span class="w-risk-badge ${d.risk.level}">${esc(D.riskLevels[d.risk.level].name)}</span>`;
  }
  function sourceLinks(d) {
    const refs = d.refs.filter((id) => D.sources[id]?.verified);
    return refs.length
      ? `<div class="w-source-links">商品例证：${refs.map((id) => `<a href="#evidence-${esc(id)}">${esc(D.sources[id].short)} ↗</a>`).join("")}</div>`
      : '<p class="w-muted">此等级为工序与供餐逻辑推断，未绑定直接商品例证；不是门店使用情况或市场使用率统计。</p>';
  }
  function card(d) {
    return `<article id="dish-${esc(d.id)}" class="w-dish" data-risk="${d.risk.level}" data-dish="${esc(d.id)}"><div class="w-dish-top"><div><h4>${esc(d.name)}</h4><div class="w-dish-ja">${esc(d.ja)}</div></div></div>${riskBadge(d)}<p class="w-risk-target"><b>判断对象：</b>${esc(d.risk.target)}</p><p class="w-risk-reason"><b>我的判断：</b>${esc(d.risk.reason)}</p>${stage(d)}<p class="w-dish-path">${esc(d.preparedPath)}</p><p class="w-question"><b>到店问一句</b>${esc(d.ask)}</p><p class="w-proof ${verified(d) ? "verified" : ""}">${verified(d) ? "判断依据：同类厂商商品例证 + 工序推断" : "判断依据：工序与供餐逻辑推断 · 无直接商品例证"}</p><details><summary>看现场做法、来源与易误判之处</summary><p><b>现场制作路径：</b>${esc(d.onsitePath)}</p><p><b>容易误判：</b>${esc(d.trap)}</p>${sourceLinks(d)}</details></article>`;
  }
  function renderCategories() {
    const all = D.dishes.filter(baseMatches),
      list = [{ id: "all", name: "全部菜品" }, ...D.categories];
    $("category-buttons").innerHTML = list
      .map(
        (c) =>
          `<button type="button" data-category="${c.id}" aria-pressed="${state.category === c.id}"><span>${esc(c.name)}</span><small>${c.id === "all" ? all.length : all.filter((d) => d.category === c.id).length}</small></button>`,
      )
      .join("");
  }
  function quickRow(d) {
    return `<tr data-quick-dish="${esc(d.id)}"><th scope="row">${esc(d.name)}<small>${esc(d.ja)}</small></th><td>${riskBadge(d)}<small>${esc(D.focus[d.focus].name)}</small></td><td><b>${esc(d.risk.target)}</b><p>${esc(d.risk.reason)}</p><details><summary>怎么问 / 看来源</summary><p>${esc(d.ask)}</p>${sourceLinks(d)}</details></td></tr>`;
  }
  function categoryContents(selected) {
    return menuView === "table"
      ? `<div class="c-table-wrap"><table class="c-quick-table"><caption class="c-sr-only">菜品预制风险速查，含判断对象、理由和来源</caption><thead><tr><th scope="col">菜名 / 场景</th><th scope="col">我的风险判断</th><th scope="col">风险在哪 / 为什么</th></tr></thead><tbody>${selected.map(quickRow).join("")}</tbody></table></div>`
      : `<div class="w-dish-grid">${selected.map(card).join("")}</div>`;
  }
  function renderMenu() {
    const list = filtered();
    renderCategories();
    $("dish-results").innerHTML = list.length
      ? D.categories
          .map((c) => {
            const selected = list.filter((d) => d.category === c.id);
            return selected.length
              ? `<section class="w-category-section"><div class="w-category-heading"><h3>${esc(c.name)}</h3><span>${esc(c.ja)} / ${selected.length}${esc(ui.unit)}</span></div><p class="w-category-intro">${esc(c.intro)}</p>${categoryContents(selected)}</section>`
              : "";
          })
          .join("")
      : `<div class="w-empty">没有匹配菜品。点击“显示全部菜品”，或切换风险和分类。</div>`;
    $("menu-status").textContent =
      `显示 ${list.length} / ${D.dishes.length} ${ui.itemLabel} · 高 ${list.filter((d) => d.risk.level === "high").length} / 中 ${list.filter((d) => d.risk.level === "medium").length} / 低 ${list.filter((d) => d.risk.level === "low").length} · ${list.filter(verified).length} ${ui.unit}有同类厂商商品例证 · 同类内高风险优先。`;
    $("risk-legend")
      .querySelectorAll("[data-risk-filter]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(state.risk === b.dataset.riskFilter),
        ),
      );
    $("risk-buttons")
      .querySelectorAll("[data-risk-button]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(state.risk === b.dataset.riskButton),
        ),
      );
    $("proof-only").setAttribute("aria-pressed", String(state.proof));
    $("focus-legend")
      .querySelectorAll("[data-focus]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(state.focus === b.dataset.focus)),
      );
    const selection = [
      state.query ? "当前菜品：" + state.query : "",
      state.focus !== "all" ? "制作路径：" + D.focus[state.focus].name : "",
    ]
      .filter(Boolean)
      .join(" · ");
    $("active-selection").textContent = selection;
    $("active-selection").hidden = !selection;
    $("export-menu").disabled = !list.length;
    syncUrl();
  }
  if ($("menu-view")) {
    $("menu-view").onclick = (e) => {
      const b = e.target.closest("[data-menu-view]");
      if (!b) return;
      menuView = b.dataset.menuView;
      $("menu-view")
        .querySelectorAll("[data-menu-view]")
        .forEach((button) =>
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.menuView === menuView),
          ),
        );
      renderMenu();
    };
  }
  $("category-buttons").onclick = (e) => {
    const b = e.target.closest("[data-category]");
    if (!b) return;
    state.category = b.dataset.category;
    renderMenu();
    $("category-buttons")
      .querySelector(`[data-category="${state.category}"]`)
      .focus({ preventScroll: true });
  };
  $("risk-legend").innerHTML = Object.entries(D.riskLevels)
    .map(([id, r]) => {
      const count = D.dishes.filter((d) => d.risk.level === id).length;
      return `<button type="button" class="w-risk-tile ${id}" data-risk-filter="${id}" aria-pressed="false"><span>${esc(r.name)}</span><b>${count}<small> ${esc(ui.unit)}</small></b><p>${esc(r.lead)}</p><small>查看这一档菜品 ↓</small></button>`;
    })
    .join("");
  function resetFilters() {
    Object.assign(state, {
      category: "all",
      focus: "all",
      risk: "all",
      query: "",
      proof: false,
    });
  }
  function showRisk(level) {
    resetFilters();
    state.risk = level;

    renderMenu();
    $("menu-guide").scrollIntoView({ block: "start" });
  }
  $("risk-legend").onclick = (e) => {
    const b = e.target.closest("[data-risk-filter]");
    if (b) showRisk(b.dataset.riskFilter);
  };
  $("high-risk-shortcut").onclick = (e) => {
    e.preventDefault();
    showRisk("high");
  };
  $("risk-hotspots").innerHTML = D.hotspots
    .map(
      (g, i) =>
        `<article class="w-hotspot"><span>高风险重灾区 / ${String(i + 1).padStart(2, "0")}</span><h3>${esc(g.name)}</h3><p>${esc(g.why)}</p><div>${g.dishes.map((id) => `<button type="button" data-hotspot-dish="${esc(id)}">${esc(dishes.get(id).name)} ↗</button>`).join("")}</div></article>`,
    )
    .join("");
  $("risk-hotspots").onclick = (e) => {
    const b = e.target.closest("[data-hotspot-dish]");
    if (!b) return;
    resetFilters();
    const d = dishes.get(b.dataset.hotspotDish);
    state.category = d.category;
    state.query = d.name;

    renderMenu();
    $("menu-guide").scrollIntoView({ block: "start" });
  };
  $("focus-legend").innerHTML = Object.entries(D.focus)
    .map(
      ([id, f]) =>
        `<button type="button" data-focus="${id}"><div class="w-mark ${f.color}"></div><span>${esc(f.name)}</span><small>${esc(f.lead)}</small></button>`,
    )
    .join("");
  $("focus-legend").onclick = (e) => {
    const b = e.target.closest("[data-focus]");
    if (!b) return;
    state.focus = b.dataset.focus;

    renderMenu();
    $("menu-guide").scrollIntoView({ block: "start" });
  };
  $("proof-only").onclick = () => {
    state.proof = !state.proof;
    renderMenu();
  };
  $("risk-buttons").onclick = (e) => {
    const b = e.target.closest("[data-risk-button]");
    if (!b) return;
    state.risk = b.dataset.riskButton;
    renderMenu();
  };
  $("reset-filters").onclick = () => {
    resetFilters();
    renderMenu();
  };
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $("export-menu").onclick = () => {
    const rows = [
      [
        "菜品",
        ui.aliasLabel,
        "分类",
        "预制风险（定性判断，非门店查实）",
        "风险判断对象",
        "风险判断理由",
        "判断依据类型",
        "核实方向（非门店结论）",
        "可采购路径参考",
        "现场制作路径",
        "到店询问",
        "易误判之处",
        "商品例证URL",
        "官网公开产品数据URL",
      ],
      ...filtered().map((d) => [
        d.name,
        d.ja,
        D.categories.find((c) => c.id === d.category).name,
        D.riskLevels[d.risk.level].name,
        d.risk.target,
        d.risk.reason,
        verified(d)
          ? "同类厂商商品例证 + 工序推断"
          : "工序与供餐逻辑推断（无直接商品例证）",
        D.focus[d.focus].short,
        d.preparedPath,
        d.onsitePath,
        d.ask,
        d.trap,
        d.refs
          .filter((id) => D.sources[id]?.verified)
          .map((id) => D.sources[id].url)
          .join(" "),
        d.refs
          .map((id) => D.sources[id]?.dataUrl || "")
          .filter(Boolean)
          .join(" "),
      ]),
    ];
    const cell = (v) =>
      '"' +
      String(/^\s*[=+\-@]|^[\t\r]/.test(String(v)) ? "'" + v : v).replace(
        /"/g,
        '""',
      ) +
      '"';
    download(
      ui.csvName,
      "\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  };
  $("evidence-cards").innerHTML = Object.entries(D.sources)
    .filter(([, s]) => s.verified)
    .map(
      ([id, s]) =>
        `<article class="w-evidence-card" id="evidence-${esc(id)}"><span class="w-proof verified">已读取厂商公开页 · ${esc(s.market)}</span><h3>${esc(s.title)}</h3><p>${esc(s.supports)}</p><p><b>不能据此判断：</b>${esc(s.limit)}</p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">阅读商品原页 ↗</a>${s.dataUrl ? `<br><a href="${esc(s.dataUrl)}" target="_blank" rel="noopener noreferrer">官网公开产品数据 ↗</a>` : ""}<small>核验：${esc(s.checked)}<br>${s.sha256 ? "读取内容 SHA-256：" + esc(s.sha256.slice(0, 16)) + "…" : ""}</small></article>`,
    )
    .join("");
  $("starter-dishes").innerHTML = ui.starterIds
    .map(
      (id) =>
        `<button type="button" data-starter="${id}">${esc(dishes.get(id).name)} ↗</button>`,
    )
    .join("");
  $("starter-dishes").onclick = (e) => {
    const b = e.target.closest("[data-starter]");
    if (!b) return;
    const d = dishes.get(b.dataset.starter);
    Object.assign(state, {
      category: d.category,
      focus: "all",
      risk: "all",
      query: d.name,
      proof: true,
    });

    renderMenu();
    $("menu-guide").scrollIntoView({ block: "start" });
  };
  $("dish-total").textContent = D.dishes.length;
  $("high-total").textContent = D.dishes.filter(
    (d) => d.risk.level === "high",
  ).length;
  if ($("source-total"))
    $("source-total").textContent = Object.values(D.sources).filter(
      (s) => s.verified,
    ).length;
  renderMenu();
  window.addEventListener("popstate", () => {
    const p = new URLSearchParams(location.search);
    state.category = categories.has(p.get("category"))
      ? p.get("category")
      : "all";
    state.focus = focuses.has(p.get("focus")) ? p.get("focus") : "all";
    state.risk = risks.has(p.get("risk")) ? p.get("risk") : "all";
    state.query = (p.get("q") || "").slice(0, 100);

    renderMenu();
  });
})();
