"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const D = window.ChemData,
    KEY = "chem.intelli.v1";
  const views = new Map(),
    charts = new Set();
  let rows = [],
    source = "模拟数据",
    cards = [],
    history = [],
    pending = null,
    ready = false;
  const node = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
  function status(text, error = false) {
    $("status").textContent = text;
    $("status").classList.toggle("error", error);
  }
  const fields = () =>
    Object.keys(rows[0]).filter((k) => k !== "date" && k !== "product");
  const products = () => [...new Set(rows.map((r) => r.product))];
  const months = () => [...new Set(rows.map((r) => r.date))].sort();
  const defaultField = () =>
    fields().includes("price") ? "price" : fields()[0];
  function persist() {
    try {
      sessionStorage.setItem(
        KEY,
        JSON.stringify({ version: 1, signature: JSON.stringify(rows), cards }),
      );
      return "";
    } catch (_) {
      return " 浏览器无法保存工作区，本次调整仅在当前页面有效，请及时导出。";
    }
  }
  function snapshot() {
    history.push({ rows, source, cards: structuredClone(cards) });
    if (history.length > 10) history.shift();
  }
  function validate(plan) {
    if (
      !plan ||
      !views.has(plan.view) ||
      !fields().includes(plan.field) ||
      (plan.product !== "*" && !products().includes(plan.product)) ||
      !Number.isInteger(plan.period) ||
      plan.period < 0 ||
      plan.period > 120
    )
      throw Error("参数与当前数据不匹配，请重新选择。");
    return {
      view: plan.view,
      field: plan.field,
      product: plan.product,
      period: plan.period,
    };
  }
  function selected(plan) {
    const dates = months(),
      end = dates[dates.length - 1];
    // Use calendar months, not the last N available observations.
    const [year, month] = end.split("-").map(Number);
    const begin = plan.period
      ? new Date(Date.UTC(year, month - plan.period, 1))
          .toISOString()
          .slice(0, 7)
      : "0000-00";
    return rows.filter(
      (r) =>
        r.date >= begin && (plan.product === "*" || r.product === plan.product),
    );
  }
  function title(plan) {
    return (
      (plan.product === "*" ? "全部产品" : plan.product) +
      " · " +
      D.fieldName(plan.field)
    );
  }
  function describe(plan) {
    const sample = selected(plan),
      dates = [...new Set(sample.map((r) => r.date))].sort();
    return `${source} · ${dates[0] || "无观测"} — ${dates[dates.length - 1] || "无观测"} · ${sample.length} 条观测`;
  }
  function options(select, values, current) {
    select.replaceChildren(
      ...values.map(([value, label]) => {
        const o = node("option", label);
        o.value = String(value);
        return o;
      }),
    );
    select.value = String(current);
  }
  function populate(form, plan, ids = false) {
    const get = (name) => (ids ? $(name) : form.elements.namedItem(name));
    options(
      get("view"),
      [...views].map(([id, v]) => [id, v.label]),
      plan.view,
    );
    options(
      get("product"),
      [["*", "全部产品"], ...products().map((p) => [p, p])],
      plan.product,
    );
    options(
      get("field"),
      fields().map((f) => [f, D.fieldName(f)]),
      plan.field,
    );
    const periods = [...new Set([6, 12, 0, 1, plan.period])];
    options(
      get("period"),
      periods.map((n) => [
        n,
        n === 0 ? "全部月份" : n === 1 ? "最新月份" : `近${n}个月`,
      ]),
      plan.period,
    );
  }
  function readPlan(form, ids = false) {
    const get = (name) => (ids ? $(name) : form.elements.namedItem(name)).value;
    return validate({
      view: get("view"),
      product: get("product"),
      field: get("field"),
      period: +get("period"),
    });
  }
  function download(sample) {
    if (!sample.length) throw Error("当前筛选没有观测，无法导出。");
    const url = URL.createObjectURL(
      new Blob([D.toCSV(sample)], { type: "text/csv;charset=utf-8" }),
    );
    const a = node("a");
    a.href = url;
    a.download = "intelli-data.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function chartRenderer(type) {
    return (container, plan, sample) => {
      if (!window.echarts) throw Error("图表引擎未加载，请刷新或使用数据表。");
      const el = node("div", undefined, "card-chart");
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", title(plan) + views.get(type).label);
      container.append(el);
      const chart = echarts.init(el, null, { renderer: "canvas" });
      charts.add(chart);
      const dates = [...new Set(sample.map((r) => r.date))].sort();
      const names = [...new Set(sample.map((r) => r.product))];
      const byKey = new Map(
        sample.map((r) => [r.product + "|" + r.date, r[plan.field]]),
      );
      chart.setOption({
        animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        color: ["#236b62", "#507da4", "#bb8653", "#8575a8", "#bd6571"],
        tooltip: { trigger: "axis", renderMode: "richText" },
        legend: { type: "scroll", top: 5, left: 16, right: 16 },
        grid: { top: 58, bottom: 35, left: 25, right: 25, containLabel: true },
        xAxis: { type: "category", data: dates, boundaryGap: type === "bar" },
        yAxis: { type: "value", scale: false, axisLabel: { fontSize: 10 } },
        series: names.map((name) => ({
          name,
          type,
          data: dates.map((d) => byKey.get(name + "|" + d) ?? null),
          showSymbol: dates.length < 15,
          connectNulls: false,
          barMaxWidth: 22,
          lineStyle: { width: 2 },
        })),
      });
    };
  }
  function tableRenderer(container, plan, sample) {
    const wrap = node("div", undefined, "table-scroll"),
      table = node("table");
    const caption = node(
      "caption",
      title(plan) + "；最多预览100条，导出包含全部筛选记录",
    );
    const head = node("thead"),
      tr = node("tr");
    ["月份", "产品", D.fieldName(plan.field)].forEach((s) => {
      const th = node("th", s);
      th.scope = "col";
      tr.append(th);
    });
    head.append(tr);
    const body = node("tbody");
    sample.slice(0, 100).forEach((r) => {
      const tr = node("tr");
      [r.date, r.product, r[plan.field]].forEach((s) =>
        tr.append(node("td", String(s))),
      );
      body.append(tr);
    });
    table.append(caption, head, body);
    wrap.append(table);
    container.append(wrap);
  }
  function metricRenderer(container, plan, sample) {
    const latest = [...new Set(sample.map((r) => r.date))].sort().pop();
    const grid = node("div", undefined, "metrics");
    sample
      .filter((r) => r.date === latest)
      .forEach((r) => {
        const e = node("div", undefined, "metric");
        e.append(
          node("span", r.product),
          node(
            "strong",
            r[plan.field].toLocaleString("zh-CN", { maximumFractionDigits: 4 }),
          ),
          node("small", latest + " · " + D.fieldName(plan.field)),
        );
        grid.append(e);
      });
    container.append(
      grid,
      node("p", "仅展示筛选区间最新月份的观测；缺失产品不补值，不跨月份求和。"),
    );
  }
  function registerView(id, spec) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      views.has(id) ||
      typeof spec.label !== "string" ||
      !Array.isArray(spec.aliases) ||
      !spec.aliases.length ||
      spec.aliases.some((s) => typeof s !== "string" || !s) ||
      typeof spec.render !== "function"
    )
      throw Error("卡片注册需要唯一 id、label、aliases 和 render。");
    views.set(id, Object.freeze({ ...spec }));
  }
  registerView("line", {
    label: "折线图",
    aliases: ["折线图", "折线", "趋势图", "趋势"],
    render: chartRenderer("line"),
  });
  registerView("bar", {
    label: "柱状图",
    aliases: ["柱状图", "柱状", "柱形图"],
    render: chartRenderer("bar"),
  });
  registerView("table", {
    label: "数据表",
    aliases: ["数据表", "表格", "明细"],
    render: tableRenderer,
  });
  registerView("metric", {
    label: "指标卡",
    aliases: ["指标卡", "指标概览", "概览"],
    render: metricRenderer,
  });
  function render() {
    charts.forEach((c) => c.dispose());
    charts.clear();
    $("cards").replaceChildren();
    $("sourceName").textContent = source;
    $("sourceInfo").textContent =
      `${rows.length} 条 · ${products().length} 个产品 · ${months().length} 个月`;
    $("empty").hidden = cards.length > 0;
    $("undo").disabled = !history.length;
    $("clear").disabled = !cards.length;
    populate(
      $("manualForm"),
      { view: "line", product: "*", field: defaultField(), period: 6 },
      true,
    );
    cards.forEach((plan, i) => {
      const article = node("article", undefined, "work-card");
      article.tabIndex = -1;
      const top = node("div", undefined, "card-top"),
        heading = node("div");
      heading.append(
        node(
          "span",
          `0${i + 1} / ${views.get(plan.view).label}`,
          "card-kicker",
        ),
        node("h3", title(plan)),
      );
      const actions = node("div", undefined, "card-actions"),
        exp = node("button", "↓ CSV"),
        remove = node("button", "移除 ×");
      exp.setAttribute("aria-label", "导出" + title(plan));
      remove.setAttribute("aria-label", "移除" + title(plan));
      exp.onclick = () => {
        try {
          download(selected(plan));
          status("已导出此卡片的全部筛选数据。");
        } catch (e) {
          status(e.message, true);
        }
      };
      remove.onclick = () => {
        snapshot();
        cards.splice(i, 1);
        render();
        $("command").focus();
        status("已移除卡片，可撤销。" + persist());
      };
      actions.append(exp, remove);
      top.append(heading, actions);
      const content = node("div", undefined, "card-content");
      article.append(top, node("p", describe(plan), "card-context"));
      try {
        const sample = selected(plan);
        if (!sample.length)
          content.append(node("p", "当前区间没有该产品的观测，请调整参数。"));
        else
          views
            .get(plan.view)
            .render(
              content,
              Object.freeze({ ...plan }),
              structuredClone(sample),
            );
      } catch (e) {
        content.append(node("p", "卡片暂时无法显示：" + e.message));
      }
      article.append(content);
      const editor = node("details", undefined, "card-editor"),
        summary = node("summary", "调整这张卡片的参数"),
        form = node("form");
      const controls = node("div", undefined, "controls");
      [
        ["view", "展示方式"],
        ["product", "产品"],
        ["field", "指标"],
        ["period", "时间"],
      ].forEach(([name, label]) => {
        const l = node("label", label),
          select = node("select");
        select.name = name;
        l.append(select);
        controls.append(l);
      });
      const apply = node("button", "应用调整");
      apply.type = "submit";
      form.append(controls, apply);
      populate(form, plan);
      form.onsubmit = (e) => {
        e.preventDefault();
        try {
          const next = readPlan(form);
          snapshot();
          cards[i] = next;
          render();
          $("cards").children[i].focus();
          status("卡片已更新，可撤销。" + persist());
        } catch (e) {
          status(e.message, true);
        }
      };
      editor.append(summary, form);
      article.append(editor);
      $("cards").append(article);
    });
    // Charts are initialized before insertion, then resized after layout is available.
    requestAnimationFrame(() => charts.forEach((c) => c.resize()));
  }
  const observer = new ResizeObserver(() => charts.forEach((c) => c.resize()));
  observer.observe($("cards"));
  function add(plan) {
    try {
      const valid = validate(plan);
      if (cards.length >= 8)
        throw Error("工作区最多8张卡片，请移除一张后再添加。");
      snapshot();
      cards.unshift(valid);
      pending = null;
      $("clarify").hidden = true;
      render();
      $("cards").firstElementChild.focus();
      status(
        "已生成" +
          views.get(valid.view).label +
          "。可调整参数或撤销。" +
          persist(),
      );
    } catch (e) {
      status(e.message, true);
    }
  }
  function resolvePlan(input) {
    let rest = input.trim(),
      plan = { view: "line", product: "*", field: defaultField(), period: 6 };
    const hits = [];
    const consume = (words) => {
      let found = false;
      [...words]
        .sort((a, b) => b.length - a.length)
        .forEach((word) => {
          if (rest.includes(word)) {
            found = true;
            rest = rest.split(word).join(" ");
          }
        });
      return found;
    };
    const names = products().filter((p) => input.includes(p));
    if (names.length === 1) {
      plan.product = names[0];
      consume(names);
    } else if (names.length > 1) {
      return {
        error:
          "一次可选择一个产品或全部产品。请使用参数面板，或为不同产品分别添加卡片。",
      };
    }
    const fieldHits = fields().filter(
      (f) =>
        input.includes(f) ||
        (D.knownFields[f] && input.includes(D.knownFields[f].label)),
    );
    if (fieldHits.length > 1)
      return { error: "一次请选择一个指标；比较不同指标可添加多张卡片。" };
    if (fieldHits.length) {
      plan.field = fieldHits[0];
      consume([plan.field, D.knownFields[plan.field]?.label].filter(Boolean));
    }
    for (const [id, v] of views) if (consume(v.aliases)) hits.push(id);
    if (hits.length > 1)
      return { error: "一次请选择一种展示方式；可以分别添加多张卡片。" };
    if (hits.length) plan.view = hits[0];
    const period = rest.match(/近\s*(\d+)\s*个?月/);
    if (period) {
      plan.period = +period[1];
      rest = rest.replace(period[0], " ");
      if (plan.period < 1 || plan.period > 120)
        return { error: "时间范围需为近1至120个月。" };
    }
    const allTime = consume(["全部月份", "全部时间", "所有月份"]),
      latest = consume(["最新月份", "最新月", "最新"]);
    if (+allTime + +latest + +!!period > 1)
      return { error: "检测到多个时间范围，请保留一个。" };
    if (allTime) plan.period = 0;
    if (latest) plan.period = 1;
    consume([
      "全部产品",
      "所有产品",
      "查看",
      "展示",
      "生成",
      "帮我",
      "请",
      "分析",
      "的",
      "用",
      "看",
    ]);
    rest = rest.replace(/[\s，。！？、,!?：:；;]/g, "");
    return { plan, unknown: rest };
  }
  $("commandForm").onsubmit = (e) => {
    e.preventDefault();
    const text = $("command").value.trim();
    if (!text) return;
    pending = null;
    $("clarify").hidden = true;
    if (/支持什么|怎么用|帮助|可以做什么/.test(text)) {
      status(
        "可选展示：" +
          [...views.values()].map((v) => v.label).join("、") +
          "；指标：" +
          fields().map(D.fieldName).join("、") +
          "。试试：近6个月全部产品" +
          D.fieldName(defaultField()).split("（")[0] +
          "折线图。",
      );
      return;
    }
    const result = resolvePlan(text);
    if (result.error) {
      status(result.error, true);
      return;
    }
    if (result.unknown) {
      pending = result.plan;
      $("clarifyText").textContent =
        `未识别「${result.unknown}」。已识别：${title(pending)} · ${views.get(pending.view).label} · ${pending.period ? "近" + pending.period + "个月" : "全部月份"}。是否按这些设置生成？`;
      $("clarify").hidden = false;
      status("请核对未识别内容，工作区尚未改变。", true);
      return;
    }
    add(result.plan);
  };
  $("acceptPlan").onclick = () => {
    if (pending) add(pending);
  };
  $("editPlan").onclick = () => {
    pending = null;
    $("clarify").hidden = true;
    $("command").focus();
  };
  $("command").oninput = () => {
    pending = null;
    $("clarify").hidden = true;
  };
  $("manualForm").onsubmit = (e) => {
    e.preventDefault();
    try {
      add(readPlan($("manualForm"), true));
    } catch (e) {
      status(e.message, true);
    }
  };
  $("clear").onclick = () => {
    snapshot();
    cards = [];
    render();
    status("已清空卡片，可撤销。" + persist());
  };
  $("undo").onclick = () => {
    if (!history.length) return;
    const prev = history.pop();
    const datasetChanged = rows !== prev.rows;
    rows = prev.rows;
    source = prev.source;
    cards = prev.cards;
    pending = null;
    $("clarify").hidden = true;
    render();
    let warning = "";
    if (datasetChanged) {
      try {
        D.save(rows, source);
      } catch (e) {
        warning = " " + e.message;
      }
    }
    status("已撤销上一步。" + warning + persist());
  };
  function useData(next, name) {
    snapshot();
    rows = next;
    source = name;
    cards = [];
    pending = null;
    $("clarify").hidden = true;
    let warning = "";
    try {
      D.save(rows, source);
    } catch (e) {
      warning = " " + e.message;
    }
    render();
    status("已切换数据，原工作区可通过撤销恢复。" + warning + persist());
  }
  $("importFile").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw Error("CSV 文件不能超过2 MB。");
      const imported = D.importCSV(await file.text());
      useData(imported, file.name);
    } catch (e) {
      status(e.message, true);
    } finally {
      $("importFile").value = "";
    }
  };
  $("demoData").onclick = () => useData(D.demoData(), "模拟数据");
  document.addEventListener("keydown", (e) => {
    const editing =
      /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) ||
      document.activeElement.isContentEditable;
    if (e.key === "/" && !editing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      $("command").focus();
    }
    if (
      e.key === "Enter" &&
      (e.ctrlKey || e.metaKey) &&
      document.activeElement === $("command")
    ) {
      e.preventDefault();
      $("commandForm").requestSubmit();
    }
  });
  const suggestions = [
    [
      "↗ 观察指标走势",
      () => ({ view: "line", field: defaultField(), product: "*", period: 6 }),
    ],
    [
      "▥ 比较最新月份",
      () => ({ view: "bar", field: defaultField(), product: "*", period: 1 }),
    ],
    [
      "▤ 核对数据明细",
      () => ({ view: "table", field: defaultField(), product: "*", period: 6 }),
    ],
    [
      "◈ 最新指标概览",
      () => ({
        view: "metric",
        field: defaultField(),
        product: "*",
        period: 1,
      }),
    ],
  ];
  suggestions.forEach(([label, plan]) => {
    const b = node("button", label);
    b.onclick = () => add(plan());
    $("quickActions").append(b);
  });
  function initialize() {
    let warning = "";
    try {
      const data = D.load();
      rows = data?.rows || D.demoData();
      source = data?.source || "模拟数据";
    } catch (e) {
      rows = D.demoData();
      warning = "读取共享数据失败，当前显示模拟数据：" + e.message;
    }
    try {
      const state = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (
        state?.version === 1 &&
        state.signature === JSON.stringify(rows) &&
        Array.isArray(state.cards)
      )
        cards = state.cards.slice(0, 8).map(validate);
    } catch (_) {
      warning += " 工作区暂存不可用或格式无效，已使用空白工作区。";
      cards = [];
    }
    ready = true;
    render();
    if (warning) status(warning, true);
  }
  // Extensions are trusted local code; natural-language input is never executable.
  window.IntelliUI = Object.freeze({
    registerView: (id, spec) => {
      registerView(id, spec);
      if (ready) render();
    },
    resolvePlan,
    addCard: add,
  });
  if (document.readyState === "complete") initialize();
  else
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
})();
