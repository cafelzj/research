"use strict";
(() => {
  const D = window.WashokuData;
  if (!D) return;
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
    focuses = new Set(Object.keys(D.focus));
  const normalize = (s) => String(s).normalize("NFKC").toLowerCase().trim();
  const params = new URLSearchParams(location.search),
    state = {
      category: categories.has(params.get("category"))
        ? params.get("category")
        : "all",
      focus: focuses.has(params.get("focus")) ? params.get("focus") : "all",
      query: (params.get("q") || "").slice(0, 100),
      proof: false,
      saved: false,
    };
  const KEY = "washoku.research.v1",
    basisChoices = {
      unasked: "未询问 / 暂无证据",
      staff: "店家口头说明（未独立核实）",
      package: "看过包装/菜单标示（注明内容）",
      observed: "看过部分工序（不代表全流程）",
    },
    stageChoices = {
      unknown: "实际供餐路径未确认",
      whole: "记录为整品/成品路径",
      half: "记录为成型/裹粉半成品",
      component: "记录为成品配料参与",
      onsite: "记录为现场操作（注明已见环节）",
      mixed: "混合路径 / 仍有疑问",
    };
  let book = { version: 1, pinned: [], records: {}, restaurant: "" },
    storageWarning = "";
  try {
    const old = JSON.parse(localStorage.getItem(KEY) || "null");
    if (old) {
      if (
        old.version !== 1 ||
        !Array.isArray(old.pinned) ||
        typeof old.records !== "object" ||
        old.records === null
      )
        throw Error("format");
      book.pinned = [...new Set(old.pinned.filter((id) => dishes.has(id)))];
      book.restaurant =
        typeof old.restaurant === "string" ? old.restaurant.slice(0, 100) : "";
      for (const id of dishes.keys()) {
        const r = old.records[id];
        if (r && typeof r === "object")
          book.records[id] = {
            basis: basisChoices[r.basis] ? r.basis : "unasked",
            stage: stageChoices[r.stage] ? r.stage : "unknown",
            note: typeof r.note === "string" ? r.note.slice(0, 3000) : "",
          };
      }
    }
  } catch (_) {
    storageWarning =
      "浏览器存储不可用或旧清单格式异常；本次清单仅在页面内存保留，请导出备份。";
  }
  const verified = (d) => d.refs.some((id) => D.sources[id]?.verified === true);
  const record = (id) =>
    book.records[id] ||
    (book.records[id] = { basis: "unasked", stage: "unknown", note: "" });
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(book));
      return "已保存到此浏览器。";
    } catch (_) {
      return "浏览器无法保存，当前内容仅在本页有效，请导出。";
    }
  }
  function syncUrl() {
    const url = new URL(location.href);
    if (state.category === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", state.category);
    if (state.focus === "all") url.searchParams.delete("focus");
    else url.searchParams.set("focus", state.focus);
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }
  function baseMatches(d) {
    if (state.focus !== "all" && d.focus !== state.focus) return false;
    if (state.proof && !verified(d)) return false;
    if (state.saved && !book.pinned.includes(d.id)) return false;
    const tokens = normalize(state.query).split(/\s+/).filter(Boolean),
      text = normalize(
        [
          d.name,
          d.ja,
          ...d.aliases,
          D.focus[d.focus].name,
          d.preparedPath,
          d.onsitePath,
          d.ask,
          d.trap,
        ].join(" "),
      );
    return tokens.every((t) => text.includes(t));
  }
  function filtered() {
    return D.dishes.filter(
      (d) =>
        baseMatches(d) &&
        (state.category === "all" || d.category === state.category),
    );
  }
  function stage(d) {
    const f = D.focus[d.focus];
    return `<span class="w-stage ${f.color}">${esc(f.short)}</span>`;
  }
  function sourceLinks(d) {
    const refs = d.refs.filter((id) => D.sources[id]?.verified);
    return refs.length
      ? `<div class="w-source-links">商品例证：${refs.map((id) => `<a href="#evidence-${esc(id)}">${esc(D.sources[id].short)} ↗</a>`).join("")}</div>`
      : '<p class="w-muted">本卡为制作工序参考，未绑定直接商品例证；不据此推断店铺或市场使用率。</p>';
  }
  function card(d) {
    const pinned = book.pinned.includes(d.id);
    return `<article id="dish-${esc(d.id)}" class="w-dish" data-dish="${esc(d.id)}"><div class="w-dish-top"><div><h4>${esc(d.name)}</h4><div class="w-dish-ja">${esc(d.ja)}</div></div><button type="button" class="w-dish-save" data-pin="${esc(d.id)}" aria-pressed="${pinned}" aria-label="${pinned ? "从核实清单移除" : "加入核实清单"}：${esc(d.name)}">${pinned ? "●" : "＋"}</button></div>${stage(d)}<p class="w-dish-path">${esc(d.preparedPath)}</p><p class="w-question"><b>到店问一句</b>${esc(d.ask)}</p><p class="w-proof ${verified(d) ? "verified" : ""}">${verified(d) ? "● 有同类厂商商品例证（非门店采购证据）" : "○ 工序参考 · 实际门店待核实"}</p><details><summary>看现场做法与易误判之处</summary><p><b>现场制作路径：</b>${esc(d.onsitePath)}</p><p><b>容易误判：</b>${esc(d.trap)}</p>${sourceLinks(d)}</details></article>`;
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
  function renderMenu() {
    const list = filtered();
    renderCategories();
    $("dish-results").innerHTML = list.length
      ? D.categories
          .map((c) => {
            const selected = list.filter((d) => d.category === c.id);
            return selected.length
              ? `<section class="w-category-section"><div class="w-category-heading"><h3>${esc(c.name)}</h3><span>${esc(c.ja)} / ${selected.length}道</span></div><p class="w-category-intro">${esc(c.intro)}</p><div class="w-dish-grid">${selected.map(card).join("")}</div></section>`
              : "";
          })
          .join("")
      : `<div class="w-empty">没有匹配菜品。试试清空关键词、改选全部路径，或取消“只看清单/商品例证”。</div>`;
    $("menu-status").textContent =
      `显示 ${list.length} / ${D.dishes.length} 道菜 · ${list.filter(verified).length} 道有同类厂商商品例证 · 标签是核实方向，实际门店均需证据。`;
    $("export-menu").disabled = !list.length;
    syncUrl();
  }
  function renderNotebook() {
    const target = $("checklist-items");
    target.innerHTML = book.pinned.length
      ? book.pinned
          .map((id) => {
            const d = dishes.get(id),
              r = record(id);
            return `<article class="w-note-card" data-note-card="${esc(id)}"><div class="w-note-heading"><div><h3>${esc(d.name)}</h3>${stage(d)}</div><button type="button" data-remove="${esc(id)}">移出清单</button></div><p class="w-note-question">可以问：${esc(d.ask)}</p><div class="w-note-fields"><div><label>这条记录的依据<select data-record="${esc(id)}" data-field="basis">${Object.entries(
              basisChoices,
            )
              .map(
                ([key, text]) =>
                  `<option value="${key}" ${r.basis === key ? "selected" : ""}>${esc(text)}</option>`,
              )
              .join(
                "",
              )}</select></label><label>我记录的实际路径<select data-record="${esc(id)}" data-field="stage">${Object.entries(
              stageChoices,
            )
              .map(
                ([key, text]) =>
                  `<option value="${key}" ${r.stage === key ? "selected" : ""}>${esc(text)}</option>`,
              )
              .join(
                "",
              )}</select></label></div><label>原话、包装内容、所见工序与仍有疑问<textarea data-record="${esc(id)}" data-field="note" maxlength="3000" placeholder="区分自己见到的、店家说的和仍不知道的部分；不要只写“预制/现做”两个字。">${esc(r.note)}</textarea></label></div></article>`;
          })
          .join("")
      : '<p class="w-empty">还没有菜品加入清单。点击菜单卡片右上角“＋”，带着具体问题到店核实。</p>';
    $("export-checklist").disabled = !book.pinned.length && !book.restaurant;
  }
  function togglePin(id) {
    if (!dishes.has(id)) return;
    const i = book.pinned.indexOf(id);
    if (i < 0) book.pinned.push(id);
    else book.pinned.splice(i, 1);
    renderMenu();
    renderNotebook();
    $("notebook-status").textContent =
      (i < 0 ? "已加入核实清单。" : "已移出清单，历史备注暂存于本浏览器。") +
      persist();
    return i < 0;
  }
  $("dish-results").onclick = (e) => {
    const b = e.target.closest("[data-pin]");
    if (!b) return;
    const id = b.dataset.pin;
    togglePin(id);
    const replacement = $("dish-results").querySelector(`[data-pin="${id}"]`);
    if (replacement) replacement.focus({ preventScroll: true });
    else $("saved-only").focus({ preventScroll: true });
  };
  $("category-buttons").onclick = (e) => {
    const b = e.target.closest("[data-category]");
    if (!b) return;
    state.category = b.dataset.category;
    renderMenu();
    $("category-buttons")
      .querySelector(`[data-category="${state.category}"]`)
      .focus({ preventScroll: true });
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
    $("focus-filter").value = state.focus;
    renderMenu();
    $("menu-guide").scrollIntoView({ block: "start" });
  };
  for (const [id, f] of Object.entries(D.focus)) {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = f.name;
    $("focus-filter").append(o);
  }
  $("dish-search").value = state.query;
  $("focus-filter").value = state.focus;
  $("dish-search").oninput = (e) => {
    state.query = e.target.value;
    renderMenu();
  };
  $("focus-filter").onchange = (e) => {
    state.focus = e.target.value;
    renderMenu();
  };
  $("proof-only").onchange = (e) => {
    state.proof = e.target.checked;
    renderMenu();
  };
  $("saved-only").onchange = (e) => {
    state.saved = e.target.checked;
    renderMenu();
  };
  $("reset-filters").onclick = () => {
    Object.assign(state, {
      category: "all",
      focus: "all",
      query: "",
      proof: false,
      saved: false,
    });
    $("dish-search").value = "";
    $("focus-filter").value = "all";
    $("proof-only").checked = false;
    $("saved-only").checked = false;
    renderMenu();
  };
  $("checklist-items").onclick = (e) => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    togglePin(b.dataset.remove);
    $("research-checklist").focus({ preventScroll: true });
  };
  function updateRecord(e) {
    const el = e.target;
    if (!el.dataset.record) return;
    const id = el.dataset.record,
      field = el.dataset.field;
    if (!dishes.has(id) || !["basis", "stage", "note"].includes(field)) return;
    if (field === "basis" && !basisChoices[el.value]) return;
    if (field === "stage" && !stageChoices[el.value]) return;
    record(id)[field] = field === "note" ? el.value.slice(0, 3000) : el.value;
    $("notebook-status").textContent = persist();
  }
  $("checklist-items").oninput = updateRecord;
  $("checklist-items").onchange = updateRecord;
  $("restaurant-name").value = book.restaurant;
  $("restaurant-name").oninput = (e) => {
    book.restaurant = e.target.value.slice(0, 100);
    $("notebook-status").textContent = persist();
    $("export-checklist").disabled = !book.pinned.length && !book.restaurant;
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
        "日文名",
        "分类",
        "核实方向（非门店结论）",
        "可采购路径参考",
        "现场制作路径",
        "到店询问",
        "易误判之处",
        "商品例证URL",
      ],
      ...filtered().map((d) => [
        d.name,
        d.ja,
        D.categories.find((c) => c.id === d.category).name,
        D.focus[d.focus].short,
        d.preparedPath,
        d.onsitePath,
        d.ask,
        d.trap,
        d.refs
          .filter((id) => D.sources[id]?.verified)
          .map((id) => D.sources[id].url)
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
      "日料菜单-制作路径研究.csv",
      "\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  };
  $("export-checklist").onclick = () => {
    const text =
      "# 日料店到店核实清单\n\n店铺/研究：" +
      book.restaurant +
      "\n\n" +
      D.disclaimer +
      "\n\n" +
      book.pinned
        .map((id) => {
          const d = dishes.get(id),
            r = record(id);
          return `## ${d.name}\n\n网页核实方向：${D.focus[d.focus].short}（不是门店结论）\n建议询问：${d.ask}\n记录依据：${basisChoices[r.basis]}\n自己记录的路径：${stageChoices[r.stage]}\n备注：${r.note || "（尚未记录）"}\n商品例证：${
            d.refs
              .filter((id) => D.sources[id]?.verified)
              .map((id) => D.sources[id].url)
              .join("；") || "无直接例证，制作工序参考"
          }`;
        })
        .join("\n\n");
    download("日料店核实笔记.md", text, "text/markdown;charset=utf-8");
  };
  $("evidence-cards").innerHTML = Object.entries(D.sources)
    .filter(([, s]) => s.verified)
    .map(
      ([id, s]) =>
        `<article class="w-evidence-card" id="evidence-${esc(id)}"><span class="w-proof verified">已读取厂商公开页 · ${esc(s.market)}</span><h3>${esc(s.title)}</h3><p>${esc(s.supports)}</p><p><b>不能据此判断：</b>${esc(s.limit)}</p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">阅读商品原页 ↗</a><small>核验：${esc(s.checked)}<br>${s.sha256 ? "读取时HTML SHA-256：" + esc(s.sha256.slice(0, 16)) + "…" : ""}</small></article>`,
    )
    .join("");
  $("starter-dishes").innerHTML = [
    "wakame",
    "tako-wasabi",
    "kabayaki",
    "tamagoyaki",
    "korokke",
    "takoyaki",
  ]
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
      query: d.name,
      proof: true,
      saved: false,
    });
    $("dish-search").value = state.query;
    $("focus-filter").value = "all";
    $("proof-only").checked = true;
    $("saved-only").checked = false;
    renderMenu();
    $("menu-guide").scrollIntoView({ block: "start" });
  };
  $("dish-total").textContent = D.dishes.length;
  renderMenu();
  renderNotebook();
  if (storageWarning) $("notebook-status").textContent = storageWarning;
  window.addEventListener("popstate", () => {
    const p = new URLSearchParams(location.search);
    state.category = categories.has(p.get("category"))
      ? p.get("category")
      : "all";
    state.focus = focuses.has(p.get("focus")) ? p.get("focus") : "all";
    state.query = (p.get("q") || "").slice(0, 100);
    $("dish-search").value = state.query;
    $("focus-filter").value = state.focus;
    renderMenu();
  });
})();
