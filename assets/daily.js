"use strict";
(() => {
  const D = window.DailyResearchData;
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
  const years = Array.from({ length: 7 }, (_, i) => 2024 - i),
    countryById = new Map(D.countries.map((c) => [c.iso3, c])),
    metricById = new Map(D.metrics.map((m) => [m.id, m]));
  const params = new URLSearchParams(location.search);
  const state = {
    metric: metricById.has(params.get("metric"))
      ? params.get("metric")
      : "debt",
    country: countryById.has(params.get("country"))
      ? params.get("country")
      : "FRA",
    year: years.includes(+params.get("year"))
      ? +params.get("year")
      : metricById.get(
          metricById.has(params.get("metric")) ? params.get("metric") : "debt",
        ).defaultYear,
    sort: "desc",
  };
  const KEY = "daily.research.france.v1";
  let book = { version: 1, views: [], notes: {} },
    storageProblem = "";
  const noteFields = ["question", "facts", "hypotheses", "next", "review"];
  try {
    const old = JSON.parse(localStorage.getItem(KEY) || "null");
    if (old) {
      if (
        old.version !== 1 ||
        !Array.isArray(old.views) ||
        !old.notes ||
        typeof old.notes !== "object"
      )
        throw Error("format");
      book.views = old.views
        .filter(
          (v) =>
            v &&
            metricById.has(v.metric) &&
            countryById.has(v.country) &&
            years.includes(v.year),
        )
        .slice(0, 12)
        .map((v) => ({ metric: v.metric, country: v.country, year: v.year }));
      for (const k of noteFields)
        if (typeof old.notes[k] === "string")
          book.notes[k] = old.notes[k].slice(0, k === "review" ? 10 : 10000);
    }
  } catch (_) {
    storageProblem =
      "浏览器存储不可用或暂存格式无效；当前笔记仅在本页内存保留，请导出备份。";
  }
  const metric = () => metricById.get(state.metric),
    observations = () => metric().values[String(state.year)] || {},
    value = (code) => observations()[code]?.value;
  const present = (code) => Number.isFinite(value(code));
  const fmt = (v, digits = 1) =>
    Number.isFinite(v)
      ? v.toLocaleString("zh-CN", {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        })
      : "—";
  function status(text, error = false) {
    $("daily-status").textContent = text;
    $("daily-status").classList.toggle("error", error);
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(book));
      return "已保存到此浏览器。";
    } catch (_) {
      return "浏览器无法保存，当前内容仅在本页有效，请导出。";
    }
  }
  function syncUrl() {
    const u = new URL(location.href);
    u.searchParams.set("metric", state.metric);
    u.searchParams.set("year", state.year);
    u.searchParams.set("country", state.country);
    history.replaceState(null, "", u);
  }
  function available() {
    return D.countries.filter((c) => present(c.iso3));
  }
  function median() {
    const a = available()
      .map((c) => value(c.iso3))
      .sort((a, b) => a - b);
    return a.length
      ? a.length % 2
        ? a[(a.length - 1) / 2]
        : (a[a.length / 2 - 1] + a[a.length / 2]) / 2
      : null;
  }
  function numericRows() {
    return [...D.countries].sort((a, b) => {
      if (state.sort === "name")
        return D.countries.indexOf(a) - D.countries.indexOf(b);
      const av = value(a.iso3),
        bv = value(b.iso3);
      if (!Number.isFinite(av)) return Number.isFinite(bv) ? 1 : 0;
      if (!Number.isFinite(bv)) return -1;
      return state.sort === "asc" ? av - bv : bv - av;
    });
  }
  function palette(v) {
    const vals = available().map((c) => value(c.iso3));
    if (!Number.isFinite(v) || !vals.length) return "url(#daily-missing)";
    const min = Math.min(...vals),
      max = Math.max(...vals),
      t = max === min ? 0.5 : (v - min) / (max - min),
      a = [219, 234, 244],
      b = [30, 85, 125];
    return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(",")})`;
  }
  const project = ([lon, lat]) => [60 + (lon + 13) * 16, 35 + (72 - lat) * 16];
  function path(geometry) {
    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : [];
    return polygons
      .map((p) =>
        p
          .map(
            (r) =>
              r
                .map((point, i) => {
                  const [x, y] = project(point);
                  return (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
                })
                .join(" ") + " Z",
          )
          .join(" "),
      )
      .join(" ");
  }
  const labelPositions = {
    FRA: [2, 46],
    DEU: [10.5, 51],
    ITA: [12, 42],
    ESP: [-3.4, 40],
    NLD: [5.5, 53.1],
    BEL: [4.5, 50.3],
    POL: [19, 52],
    SWE: [16.8, 63],
    AUT: [14, 47.4],
    DNK: [9.3, 56.5],
  };
  function renderMap() {
    const m = metric(),
      source = D.sources[m.source],
      vals = available().map((c) => value(c.iso3));
    $("map-title").textContent = m.name;
    $("map-subtitle").textContent =
      `${state.year}年 · ${m.unit} · 有数据 ${vals.length} / ${D.countries.length} 国`;
    const shapes = D.geometry.features
      .map((f) => {
        const code = f.properties.iso3,
          c = countryById.get(code),
          v = value(code);
        return `<path d="${path(f.geometry)}" fill="${c ? palette(v) : "#e4eaf0"}" fill-rule="evenodd" class="country-shape${c ? " interactive" : ""}${code === state.country ? " selected" : ""}" ${c ? `data-country="${code}" tabindex="0" role="button" aria-pressed="${code === state.country}" aria-label="${esc(c.name)}，${state.year}年，${esc(m.name)}，${present(code) ? esc(fmt(v) + " " + m.unit) : "缺失，非零值"}"` : 'aria-hidden="true"'}><title>${esc(c ? c.name + "：" + (present(code) ? fmt(v) + " " + m.unit : "本年缺失") : f.properties.name + "：背景国家，未纳入比较")}</title></path>`;
      })
      .join("");
    const labels = D.countries
      .map((c) => {
        const [x, y] = project(labelPositions[c.iso3]);
        return `<text x="${x}" y="${y}" text-anchor="middle" class="country-label">${esc(c.iso3 === "FRA" ? "法国" : c.iso2)}</text>`;
      })
      .join("");
    const [px, py] = project([2.3522, 48.8566]);
    $("map-host").innerHTML =
      `<svg id="europe-map" viewBox="0 0 900 665" aria-labelledby="map-svg-title map-svg-desc"><title id="map-svg-title">${esc(m.name)}，${state.year}年欧洲十国比较地图</title><desc id="map-svg-desc">颜色仅表示指标数值；未纳入的背景国家为灰色，比较样本缺失为斜线。可聚焦国家后按Enter或空格查看详情。</desc><defs><pattern id="daily-missing" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="7" height="7" fill="#eef3f7"/><line x1="0" y1="0" x2="0" y2="7" stroke="#aab9c7" stroke-width="2"/></pattern><clipPath id="daily-map-clip"><rect width="900" height="665"/></clipPath></defs><g clip-path="url(#daily-map-clip)">${shapes}${labels}<circle cx="${px}" cy="${py}" r="4" fill="#102d60" stroke="white" stroke-width="1.5" pointer-events="none"/><text x="${px + 8}" y="${py - 8}" class="paris-label">巴黎</text></g></svg><div id="map-tooltip" class="map-tooltip" role="tooltip" hidden></div>`;
    $("map-host")
      .querySelectorAll("[data-country]")
      .forEach((el) => {
        const code = el.dataset.country;
        el.onclick = () => selectCountry(code);
        el.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectCountry(code);
          }
        };
        const show = (e) => {
          const host = $("map-host").getBoundingClientRect(),
            tip = $("map-tooltip");
          tip.textContent = `${countryById.get(code).name} · ${state.year} · ${present(code) ? fmt(value(code)) + " " + m.unit : "缺失，非零值"}`;
          tip.hidden = false;
          tip.style.left =
            Math.max(
              8,
              Math.min(
                (e.clientX || host.left + host.width / 2) - host.left + 12,
                host.width - tip.offsetWidth - 8,
              ),
            ) + "px";
          tip.style.top =
            Math.max(
              8,
              Math.min(
                (e.clientY || host.top + host.height / 2) - host.top - 35,
                host.height - tip.offsetHeight - 8,
              ),
            ) + "px";
        };
        el.onpointermove = show;
        el.onfocus = show;
        el.onpointerleave = () => {
          $("map-tooltip").hidden = true;
        };
        el.onblur = () => {
          $("map-tooltip").hidden = true;
        };
      });
    $("map-legend").innerHTML = vals.length
      ? `<span class="legend-scale"><span>${fmt(Math.min(...vals))}</span><span class="legend-gradient"></span><span>${fmt(Math.max(...vals))}</span></span><span>${esc(m.unit)} · 颜色越深数值越大，不代表好坏</span><span><i class="legend-missing"></i>缺失</span>`
      : `<span><i class="legend-missing"></i>${state.year}年无通过核验的可比数值；不填零、不作排名。</span>`;
    $("metric-definition").textContent =
      m.definition + " 指标代码：" + m.code + "。";
    $("metric-caution").textContent = m.caution;
    $("comparison-caption").textContent =
      `${state.year}年 · ${m.name} · ${m.unit}；数据来自固定版本${source.label}`;
  }
  function renderCountry() {
    const m = metric(),
      c = countryById.get(state.country),
      v = value(c.iso3),
      med = median(),
      n = available().length,
      rank = present(c.iso3)
        ? 1 + available().filter((x) => value(x.iso3) > v).length
        : null,
      ties = present(c.iso3)
        ? available().filter((x) => value(x.iso3) === v).length
        : 0,
      diff = med === null || !present(c.iso3) ? null : v - med;
    const diffUnit = m.id === "gini" ? "基尼点" : "个百分点";
    $("country-summary").innerHTML =
      `<span class="daily-kicker">SELECTED / ${c.iso3}</span><h3>${esc(c.name)}</h3><span class="country-unit">${esc(m.name)} · ${state.year}年</span><div class="country-value">${fmt(v)}</div><span class="country-unit">${present(c.iso3) ? esc(m.unit) : "本年无可比数值，非零值"}</span><div class="country-detail"><p>数值位置：<strong>${rank ? (ties > 1 ? "并列" : "") + rank + " / " + n : "不排名"}</strong>（从高到低）</p><p>样本中位数：<strong>${med === null ? "—" : fmt(med) + " " + esc(m.unit)}</strong></p><p>与样本中位数之差：<strong>${diff === null ? "—" : (diff > 0 ? "+" : "") + fmt(diff) + " " + diffUnit}</strong></p><p>${esc(m.meaning)}</p></div><p class="source-note">${esc(D.sources[m.source].status)}<br><a href="#daily-source-${esc(m.source)}">查看来源、版本与限制 →</a>${m.file ? `<br><a href="${esc(m.file)}" target="_blank" rel="noopener noreferrer">本指标固定版本CSV ↗</a> · <a href="${esc(m.metadataFile)}" target="_blank" rel="noopener noreferrer">字段元数据 ↗</a>` : ""}</p>`;
    $("daily-country").value = c.iso3;
    document.querySelectorAll("#map-host [data-country]").forEach((el) => {
      const active = el.dataset.country === c.iso3;
      el.classList.toggle("selected", active);
      el.setAttribute("aria-pressed", String(active));
    });
    document
      .querySelectorAll("[data-country-row]")
      .forEach((el) =>
        el.classList.toggle("selected", el.dataset.countryRow === c.iso3),
      );
    document
      .querySelectorAll("[data-rank-country]")
      .forEach((el) =>
        el.classList.toggle("active", el.dataset.rankCountry === c.iso3),
      );
  }
  function selectCountry(code) {
    if (!countryById.has(code)) return;
    state.country = code;
    renderCountry();
    syncUrl();
    status(
      `${countryById.get(code).name} · ${state.year}年 · ${metric().name}：${present(code) ? fmt(value(code)) + " " + metric().unit : "缺失，不能据此判为零值或低风险"}。`,
    );
  }
  function renderComparisons() {
    const m = metric(),
      rows = numericRows(),
      vals = available().map((c) => value(c.iso3)),
      maxAbs = Math.max(...vals.map(Math.abs), 1);
    $("ranking-bars").innerHTML =
      rows
        .map(
          (c) =>
            `<button type="button" class="rank-row${c.iso3 === state.country ? " active" : ""}" data-rank-country="${c.iso3}" aria-label="查看${esc(c.name)}，${present(c.iso3) ? esc(fmt(value(c.iso3)) + " " + m.unit) : "本年缺失"}"><span>${esc(c.name)}</span><span class="rank-track">${present(c.iso3) ? `<span class="rank-fill" style="display:block;width:${(Math.abs(value(c.iso3)) / maxAbs) * 100}%"></span>` : ""}</span><span class="rank-number">${fmt(value(c.iso3))}</span></button>`,
        )
        .join("") +
      `<p class="daily-muted">条长按绝对值绘制；负号以数字为准。未对样本之外国家推断排名。</p>`;
    $("comparison-body").innerHTML = rows
      .map(
        (c) =>
          `<tr data-country-row="${c.iso3}" class="${c.iso3 === state.country ? "selected" : ""}"><th scope="row"><button type="button" data-table-country="${c.iso3}">${esc(c.name)}</button></th><td>${fmt(value(c.iso3))}</td><td>${state.year}</td><td><small>${present(c.iso3) ? (m.id === "unemployment" ? "ILO模型估计 · 镜像" : "历史值 · 镜像") : "缺失 / 待核验"}</small></td></tr>`,
      )
      .join("");
    document
      .querySelectorAll("[data-rank-country]")
      .forEach(
        (el) => (el.onclick = () => selectCountry(el.dataset.rankCountry)),
      );
    document
      .querySelectorAll("[data-table-country]")
      .forEach(
        (el) => (el.onclick = () => selectCountry(el.dataset.tableCountry)),
      );
  }
  function render() {
    const m = metric();
    $("daily-metric").value = m.id;
    $("daily-year").value = String(state.year);
    renderMap();
    renderComparisons();
    renderCountry();
    syncUrl();
    status(
      available().length
        ? `${m.name} · ${state.year}年，${available().length}/10国有值。每国同一观察年；公开镜像已读取，官方发布待回查。`
        : `${m.name}目前没有通过核验的跨国数值。保留缺失，不用其他制度、年份或分母替代。`,
    );
  }
  function renderSaved() {
    const host = $("saved-views");
    host.innerHTML = book.views.length
      ? book.views
          .map(
            (v, i) =>
              `<div class="saved-view"><button type="button" data-open-view="${i}">${esc(countryById.get(v.country).name)} · ${esc(metricById.get(v.metric).name)}<br><small>${v.year}年</small></button><button type="button" data-remove-view="${i}" aria-label="删除第${i + 1}个视角">移除</button></div>`,
          )
          .join("")
      : '<p class="empty-message">还没有保存视角。选择一个指标与国家，点击“保存研究视角”。</p>';
    host.querySelectorAll("[data-open-view]").forEach(
      (el) =>
        (el.onclick = () => {
          Object.assign(state, book.views[+el.dataset.openView]);
          render();
          $("research-map").scrollIntoView({ block: "start" });
        }),
    );
    host.querySelectorAll("[data-remove-view]").forEach(
      (el) =>
        (el.onclick = () => {
          book.views.splice(+el.dataset.removeView, 1);
          renderSaved();
          $("notes-status").textContent = persist();
        }),
    );
  }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $("daily-metric").innerHTML = ["财政", "代际", "居民"]
    .map(
      (group) =>
        `<optgroup label="${group}">${D.metrics
          .filter((m) => m.group === group)
          .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
          .join("")}</optgroup>`,
    )
    .join("");
  $("daily-year").innerHTML = years
    .map((y) => `<option value="${y}">${y}年</option>`)
    .join("");
  $("daily-country").innerHTML = D.countries
    .map((c) => `<option value="${c.iso3}">${esc(c.name)}</option>`)
    .join("");
  $("daily-metric").onchange = (e) => {
    const prev = state.year;
    state.metric = e.target.value;
    state.year = metric().defaultYear;
    render();
    if (prev !== state.year)
      status(
        `已切换到${metric().name}的最近完整样本年 ${state.year}（原选择 ${prev}）。不会用各国不同年份拼接比较。`,
      );
  };
  $("daily-year").onchange = (e) => {
    state.year = +e.target.value;
    render();
  };
  $("daily-country").onchange = (e) => selectCountry(e.target.value);
  $("daily-sort").onchange = (e) => {
    state.sort = e.target.value;
    renderComparisons();
  };
  $("daily-reset").onclick = () => {
    Object.assign(state, {
      metric: "debt",
      year: 2024,
      country: "FRA",
      sort: "desc",
    });
    $("daily-sort").value = "desc";
    render();
  };
  $("save-view").onclick = () => {
    if (
      book.views.some(
        (v) =>
          v.country === state.country &&
          v.metric === state.metric &&
          v.year === state.year,
      )
    ) {
      status("该研究视角已经保存。");
      return;
    }
    if (book.views.length >= 12) {
      status("最多保存12个视角，请先移除一个或导出笔记。", true);
      return;
    }
    book.views.unshift({
      country: state.country,
      metric: state.metric,
      year: state.year,
    });
    renderSaved();
    status("已保存当前国家、指标和年份。" + persist());
  };
  $("download-view").onclick = () => {
    const m = metric(),
      s = D.sources[m.source],
      rows = [
        [
          "国家",
          "ISO3",
          "指标",
          "指标代码",
          "年份",
          "值",
          "单位",
          "状态",
          "镜像固定版本",
          "原始发布入口",
        ],
        ...D.countries.map((c) => [
          c.name,
          c.iso3,
          m.name,
          m.code,
          state.year,
          present(c.iso3) ? String(value(c.iso3)) : "",
          m.unit,
          present(c.iso3) ? observations()[c.iso3].status : "missing",
          m.file || s.mirror || s.official,
          s.official,
        ]),
      ],
      cell = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    download(
      `欧洲比较-${m.id}-${state.year}.csv`,
      "\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  };
  $("download-map").onclick = () => {
    const m = metric(),
      vals = available().map((c) => value(c.iso3)),
      source = D.sources[m.source];
    const style =
      ".country-shape{stroke:white;stroke-width:1.2}.country-shape.selected{stroke:#102d60;stroke-width:2.8}.country-label{font:13px system-ui;fill:#1d3e59;paint-order:stroke;stroke:white;stroke-width:3px}.paris-label{font:12px system-ui;fill:#183e59;paint-order:stroke;stroke:white;stroke-width:3px}";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="820" viewBox="0 0 900 820"><style>${style}</style><rect width="900" height="820" fill="#f5f8fb"/><text x="25" y="28" font-size="20" font-family="system-ui" fill="#18344c">${esc(m.name)} · ${state.year}年 · ${esc(m.unit)}</text><g transform="translate(0 45)">${$("europe-map").innerHTML}</g><defs><linearGradient id="export-scale"><stop offset="0" stop-color="#dbeaf4"/><stop offset="1" stop-color="#1e557d"/></linearGradient></defs><rect x="25" y="715" width="130" height="9" fill="url(#export-scale)"/><text x="25" y="745" font-size="12" font-family="system-ui" fill="#445d71">${vals.length ? `数值范围 ${fmt(Math.min(...vals))} — ${fmt(Math.max(...vals))}；颜色越深数值越大，非风险评分。` : "本年无可比数据；斜线为缺失，不是零值。"}</text><text x="25" y="768" font-size="11" font-family="system-ui" fill="#445d71">${esc(source.label)}；官方原发布待回查。巴黎仅为城市定位，非事件现场。</text><text x="25" y="791" font-size="11" font-family="system-ui" fill="#445d71">整理 ${D.retrievedAt} · 底图 Natural Earth（公共领域） · cafelzj.github.io/research/daily.html</text></svg>`;
    download(
      `欧洲地图-${m.id}-${state.year}.svg`,
      svg,
      "image/svg+xml;charset=utf-8",
    );
  };
  const notesForm = $("daily-notes-form");
  for (const name of noteFields) {
    const el = notesForm.elements.namedItem(name);
    el.value = book.notes[name] || "";
    el.oninput = () => {
      book.notes[name] = el.value;
      $("notes-status").textContent = persist();
    };
  }
  notesForm.onsubmit = (e) => e.preventDefault();
  $("export-notes").onclick = () => {
    const m = metric(),
      text =
        `# 日常研究：法国事件与欧洲对照\n\n整理日 ${D.retrievedAt}\n事件线索：${D.event.label}\n${D.event.url}\n${D.event.status}\n\n## 当前视角\n${countryById.get(state.country).name} / ${m.name} / ${state.year} / ${present(state.country) ? value(state.country) + " " + m.unit : "缺失"}\n${D.evidenceNote}\n\n` +
        noteFields
          .map(
            (name) =>
              `## ${{ question: "研究问题", facts: "已核实事实与来源", hypotheses: "解释、替代解释与反证", next: "下一步", review: "复核日期" }[name]}\n${book.notes[name] || "（未填写）"}`,
          )
          .join("\n\n") +
        "\n\n## 已保存视角\n" +
        book.views
          .map(
            (v) =>
              `${countryById.get(v.country).name} / ${metricById.get(v.metric).name} / ${v.year}`,
          )
          .join("\n") +
        "\n\n## 镜像来源与版本\n" +
        Object.values(D.sources)
          .map((s) => `${s.label}\n${s.mirror || s.official}\n${s.status}`)
          .join("\n\n");
    download("日常研究-法国与欧洲.md", text, "text/markdown;charset=utf-8");
  };
  const mechanisms = [
    {
      title: "财政空间 → 政策取舍",
      metric: "debt",
      body: "债务与赤字描述财政约束，可能影响税收、补贴和公共服务安排。真正的传导还取决于利息、期限、经济增长、具体政策与协商渠道。",
      refute:
        "反证方向：若事件诉求与财政政策无关，或冲突集中于与宏观财政不同的直接触发因素，这条解释就不足。",
    },
    {
      title: "代际分配 → 改革与公平",
      metric: "education",
      body: "教育、养老和劳动年龄结构共同影响代际分配。应比较单位学生资源、制度缴费与待遇、政府补贴及受影响人群，不能只比两个GDP占比。",
      refute:
        "反证方向：即便支出较高，资源错配仍可能存在；即便公共养老支出较低，私人和职业养老也可能承担较多。",
    },
    {
      title: "就业与生活成本 → 机会感受",
      metric: "unemployment",
      body: "就业机会、工资购买力、住房和服务可及性可能影响不满。巴黎内部、青年与不同教育程度的情况可能远离全国平均值，需要分组与地方证据。",
      refute:
        "反证方向：总失业率下降与部分群体处境恶化可以同时发生。没有群体和街区数据，不能把全国平均关联外推到参与者。",
    },
  ];
  $("mechanism-cards").innerHTML = mechanisms
    .map(
      (m, i) =>
        `<article><span class="daily-kicker">HYPOTHESIS 0${i + 1} / 未检验假设</span><h3>${esc(m.title)}</h3><p>${esc(m.body)}</p><p class="refute">${esc(m.refute)}</p><button type="button" data-mechanism="${m.metric}">查看相关指标 ↗</button></article>`,
    )
    .join("");
  document.querySelectorAll("[data-mechanism]").forEach(
    (b) =>
      (b.onclick = () => {
        state.metric = b.dataset.mechanism;
        state.year = metric().defaultYear;
        render();
        $("research-map").scrollIntoView({ block: "start" });
      }),
  );
  $("source-cards").innerHTML =
    Object.entries(D.sources)
      .map(
        ([id, s]) =>
          `<article class="source-card" id="daily-source-${id}"><span class="status-pill ${s.commit ? "" : "pending"}">${s.commit ? "固定镜像已读取" : "尚待核验"}</span><h3>${esc(s.label)}</h3><p>${esc(s.detail)}</p><p class="daily-muted">${esc(s.status)}</p>${s.publisher ? `<p class="daily-muted">发布 / 镜像：${esc(s.publisher)}</p>` : ""}<a href="${esc(s.official)}" target="_blank" rel="noopener noreferrer">${id === "event" ? "用户提供的事件条目" : "原始发布入口"} ↗</a>${s.mirror ? ` · <a href="${esc(s.mirror)}" target="_blank" rel="noopener noreferrer">固定版本镜像 ↗</a>` : ""}${s.processing ? ` · <a href="${esc(s.processing)}" target="_blank" rel="noopener noreferrer">读取过的处理脚本 ↗</a>` : ""}${s.commit ? `<p class="source-version">版本 ${esc(s.commit)}<br>读取日期 ${D.retrievedAt}</p>` : ""}</article>`,
      )
      .join("") +
    `<article class="source-card"><span class="status-pill">地图底图</span><h3>Natural Earth · 国家轮廓</h3><p>${esc(D.geometry.provenance.note)} 使用1:110m简化经纬度投影，只用于国家级比较，不展示街区或事件位置。底图数据为公共领域；背景国家没有被赋予指标。</p><a href="${esc(D.geometry.provenance.url)}" target="_blank" rel="noopener noreferrer">固定版本GeoJSON ↗</a><p class="source-version">版本 ${esc(D.geometry.provenance.commit)}</p></article>`;
  render();
  renderSaved();
  if (storageProblem) $("notes-status").textContent = storageProblem;
  window.addEventListener("popstate", () => {
    const p = new URLSearchParams(location.search);
    if (metricById.has(p.get("metric"))) state.metric = p.get("metric");
    if (countryById.has(p.get("country"))) state.country = p.get("country");
    if (years.includes(+p.get("year"))) state.year = +p.get("year");
    render();
  });
})();
