"use strict";
const $ = (id) => document.getElementById(id);
const escapeHTML = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const knownFields = {
  price: { label: "价格", unit: "元/吨" },
  output: { label: "产量", unit: "万吨" },
  rate: { label: "开工率", unit: "%" },
  cost: { label: "成本", unit: "元/吨" },
  inventory: { label: "库存", unit: "万吨" },
};
const types = {
  scatter: "散点图",
  bubble: "气泡图",
  line: "折线图",
  bar: "柱状图",
  stack: "堆叠柱状图",
  pie: "饼图",
  donut: "环形图",
};
const palettes = {
  research: ["#2377ad", "#e95d65", "#d4a34b", "#48a69d", "#8c83ba"],
  purple: ["#7357b8", "#a486ce", "#514b91", "#c28aba", "#8697cc"],
  green: ["#237f70", "#59a389", "#a2bd64", "#336873", "#83bdb7"],
  blue: ["#185a8c", "#3985bb", "#80b5d9", "#384e91", "#60a4aa"],
  red: ["#bc384b", "#e16b73", "#984f71", "#e7a080", "#d0446b"],
};
let rows, numericFields, instance, lastOption, activeConfig;
function demoData() {
  const products = ["甲醇", "尿素", "纯碱", "聚乙烯", "聚丙烯"];
  let data = [];
  for (let m = 0; m < 24; m++) {
    let date = new Date(Date.UTC(2024, 9 + m, 1)).toISOString().slice(0, 7);
    products.forEach((product, j) => {
      let price = Math.round(
          [2450, 2050, 1750, 7800, 7350][j] *
            (1 +
              0.09 * Math.sin(m * 0.64 + j) +
              0.003 * m +
              0.025 * Math.cos(m * 1.9 + j)),
        ),
        output = +(
          [610, 520, 295, 240, 265][j] *
          (1 + 0.08 * Math.sin(m * 0.8 + j) + m * 0.002)
        ).toFixed(1);
      data.push({
        date,
        product,
        price,
        output,
        rate: +(73 + j * 2 + 6 * Math.sin(m * 0.48 + j)).toFixed(1),
        cost: Math.round(price * (0.76 + 0.06 * Math.cos(m * 0.6 + j))),
        inventory: +(output * (0.16 + 0.05 * Math.sin(m * 0.4 + j))).toFixed(1),
      });
    });
  }
  return data;
}
function fieldName(key) {
  if (key === "date") return "月份";
  if (key === "product") return "产品";
  const f = knownFields[key];
  return f ? f.label + (f.unit ? "（" + f.unit + "）" : "") : key;
}
function announce(text, error = false) {
  $("status").textContent = text;
  $("status").classList.toggle("error", error);
}
function getProducts() {
  return [...new Set(rows.map((r) => r.product))];
}
function getDates() {
  return [...new Set(rows.map((r) => r.date))].sort();
}
function chosenProducts() {
  return Array.from($("products").querySelectorAll("input:checked")).map(
    (n) => n.value,
  );
}
function defaults() {
  return {
    type: "scatter",
    period: 12,
    month: getDates().slice(-1)[0],
    products: getProducts(),
    x: numericFields.includes("price") ? "price" : numericFields[0],
    y: numericFields.includes("output") ? "output" : numericFields[0],
    sizeField: numericFields.includes("output") ? "output" : numericFields[0],
    size: 36,
    symbol: "circle",
    palette: "research",
    customColor: "#2377ad",
    xTitle: "",
    yTitle: "",
    zero: true,
    smooth: false,
    labels: false,
    legendShow: true,
    legendPosition: "bottom",
  };
}
function readConfig() {
  return {
    type: $("type").value,
    period: +$("period").value,
    month: $("month").value,
    products: chosenProducts(),
    x: $("x").value,
    y: $("y").value,
    sizeField: $("sizeField").value,
    size: +$("size").value,
    symbol: $("symbol").value,
    palette: $("palette").value,
    customColor: $("customColor").value,
    xTitle: $("xTitle").value.trim(),
    yTitle: $("yTitle").value.trim(),
    zero: $("zero").checked,
    smooth: $("smooth").checked,
    labels: $("labels").checked,
    legendShow: $("legendShow").checked,
    legendPosition: $("legendPosition").value,
  };
}
function setConfig(c) {
  for (let key of [
    "type",
    "period",
    "month",
    "x",
    "y",
    "sizeField",
    "size",
    "symbol",
    "palette",
    "customColor",
    "xTitle",
    "yTitle",
    "legendPosition",
  ])
    if (c[key] !== undefined) $(key).value = String(c[key]);
  for (let key of ["zero", "smooth", "labels", "legendShow"])
    if (c[key] !== undefined) $(key).checked = !!c[key];
  if (c.products)
    $("products")
      .querySelectorAll("input")
      .forEach((n) => (n.checked = c.products.includes(n.value)));
}
function initData(data) {
  rows = data;
  numericFields = Object.keys(rows[0]).filter(
    (k) => !["date", "product"].includes(k),
  );
  let opts = numericFields
    .map(
      (k) =>
        `<option value="${escapeHTML(k)}">${escapeHTML(fieldName(k))}</option>`,
    )
    .join("");
  $("x").innerHTML =
    '<option value="date">月份</option><option value="product">产品</option>' +
    opts;
  $("y").innerHTML = opts;
  $("sizeField").innerHTML = opts;
  $("month").innerHTML = getDates()
    .map((d) => `<option>${d}</option>`)
    .join("");
  $("products").innerHTML = getProducts()
    .map(
      (p) =>
        `<label><input type="checkbox" value="${escapeHTML(p)}" checked>${escapeHTML(p)}</label>`,
    )
    .join("");
  let c = defaults();
  for (let key of ["x", "y", "sizeField"])
    if (!numericFields.includes(c[key])) c[key] = numericFields[0];
  setConfig(c);
  render();
}
function selectedRows(c) {
  const ds = getDates().slice(-c.period);
  return rows.filter(
    (r) =>
      c.products.includes(r.product) &&
      (c.type === "pie" || c.type === "donut"
        ? r.date === c.month
        : ds.includes(r.date)),
  );
}
function getColors(c) {
  if (c.palette !== "custom") return palettes[c.palette];
  const rgb = c.customColor.match(/\w\w/g).map((n) => parseInt(n, 16));
  return [0, 0.22, 0.44, 0.12, 0.34].map((light, i) => {
    let shade = i === 3 ? -0.2 : light;
    return (
      "#" +
      rgb
        .map((n) =>
          Math.max(
            0,
            Math.min(
              255,
              Math.round(shade < 0 ? n * (1 + shade) : n + (255 - n) * shade),
            ),
          )
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  });
}
function axis(key, title, c, isX) {
  return {
    type: ["date", "product"].includes(key) ? "category" : "value",
    name: title || fieldName(key),
    nameLocation: isX ? "middle" : "end",
    nameGap: isX ? 35 : 15,
    nameTextStyle: { fontSize: 11, color: "#65758a" },
    scale: !c.zero,
    axisLabel: { fontSize: 11, hideOverlap: true },
    axisLine: { lineStyle: { color: "#b7c4d3" } },
    splitLine: {
      show: !["date", "product"].includes(key),
      lineStyle: { color: "#e9edf3" },
    },
  };
}
function buildOption(c, data) {
  const colors = getColors(c),
    pie = ["pie", "donut"].includes(c.type),
    mobile = window.innerWidth < 650;
  const option = {
    color: colors,
    backgroundColor: "#fff",
    animationDuration: 350,
    animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    aria: { enabled: true },
    legend: {
      type: "scroll",
      show: c.legendShow,
      top: c.legendPosition === "top" ? 8 : null,
      bottom: c.legendPosition === "bottom" ? 8 : null,
      left: 12,
      right: 12,
      textStyle: { fontSize: 12, color: "#50647c" },
    },
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (p) => {
        const r = p.data.row;
        if (!r) return escapeHTML(p.name) + ": " + p.value;
        return [
          r.product,
          r.date,
          ...[
            ...new Set([
              c.x,
              c.y,
              ...(c.type === "bubble" ? [c.sizeField] : []),
            ]),
          ].map((k) => fieldName(k) + ": " + r[k]),
        ]
          .map(escapeHTML)
          .join("<br>");
      },
    },
    series: [],
  };
  if (pie) {
    if (data.some((r) => r[c.y] < 0) || !data.some((r) => r[c.y] > 0))
      throw Error("饼图需要非负且合计大于零的数值。请改选指标或使用柱状图。");
    option.tooltip.formatter = (p) =>
      escapeHTML(p.name) +
      "<br>" +
      escapeHTML(fieldName(c.y)) +
      ": " +
      p.value +
      "<br>占比：" +
      p.percent +
      "%";
    option.series = [
      {
        name: fieldName(c.y),
        type: "pie",
        radius: c.type === "donut" ? ["36%", "65%"] : "65%",
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: mobile ? "inside" : "outside",
          formatter: (p) => p.name + "\n" + p.percent + "%",
          fontSize: 12,
        },
        labelLayout: { hideOverlap: true },
        emphasis: { scale: true },
        data: data.map((r) => ({ name: r.product, value: r[c.y], row: r })),
      },
    ];
    return option;
  }
  if (
    ["scatter", "bubble"].includes(c.type) &&
    ["date", "product"].includes(c.x)
  )
    throw Error("散点图和气泡图的 X 轴需要数值字段，请选择价格、产量等指标。");
  if (c.type === "stack" && data.some((r) => r[c.y] < 0))
    throw Error("当前堆叠图仅支持非负数值，请选择普通柱状图。");
  const categorical = ["date", "product"].includes(c.x),
    xValues = categorical ? [...new Set(data.map((r) => r[c.x]))].sort() : null;
  option.grid = {
    left: mobile ? 55 : 76,
    right: mobile ? 22 : 40,
    top: c.legendShow && c.legendPosition === "top" ? 80 : 48,
    bottom: 105,
    containLabel: false,
  };
  option.xAxis = axis(c.x, c.xTitle, c, true);
  option.yAxis = axis(c.y, c.yTitle, c, false);
  if (categorical) option.xAxis.data = xValues;
  if (c.x === "product") {
    let datesByProduct = new Set(data.map((r) => r.date));
    if (datesByProduct.size > 1)
      throw Error("X 轴为产品时，请将时间范围改为近1个月；或使用月份 X 轴。");
  }
  if (["line", "bar", "stack"].includes(c.type))
    option.dataZoom = [
      { type: "inside", filterMode: "none" },
      {
        type: "slider",
        height: 15,
        bottom: 43,
        borderColor: "#dce4ee",
        fillerColor: "#2377ad20",
      },
    ];
  let maximum = Math.max(...data.map((r) => Math.max(0, r[c.sizeField]))),
    excluded = 0;
  option.series = c.products.map((p, i) => {
    let subset = data
      .filter((r) => r.product === p)
      .sort((a, b) =>
        categorical ? a.date.localeCompare(b.date) : a[c.x] - b[c.x],
      );
    if (c.type === "bubble") {
      excluded += subset.filter((r) => r[c.sizeField] < 0).length;
      subset = subset.filter((r) => r[c.sizeField] >= 0);
    }
    let type = ["scatter", "bubble"].includes(c.type)
      ? "scatter"
      : c.type === "line"
        ? "line"
        : "bar";
    let points = categorical
      ? xValues.map((x) => {
          let row = subset.find((r) => r[c.x] === x);
          return row ? { value: row[c.y], row } : { value: null };
        })
      : subset.map((row) => ({
          value: [row[c.x], row[c.y], row[c.sizeField]],
          row,
        }));
    return {
      name: p,
      type,
      stack: c.type === "stack" ? "total" : undefined,
      smooth: c.smooth,
      symbol: c.symbol,
      symbolSize:
        c.type === "bubble"
          ? (v) =>
              maximum ? c.size * Math.sqrt(Math.max(0, v[2]) / maximum) : 0
          : c.type === "scatter"
            ? c.size
            : Math.min(c.size, 18),
      showSymbol: true,
      itemStyle: {
        color: colors[i % colors.length],
        opacity: c.type === "bubble" ? 0.7 : 1,
      },
      lineStyle: { width: 2.4 },
      barMaxWidth: 38,
      label: {
        show: c.labels,
        position: "top",
        formatter: (p) => (Array.isArray(p.value) ? p.value[1] : p.value),
      },
      emphasis: { focus: "series" },
      data: points,
    };
  });
  option.excluded = excluded;
  return option;
}
function render() {
  if (!instance) return;
  const c = readConfig();
  activeConfig = c;
  $("sizeValue").textContent = c.size + " px";
  const pie = ["pie", "donut"].includes(c.type);
  $("month").disabled = !pie;
  $("period").disabled = pie;
  $("x").disabled = pie;
  $("xTitle").disabled = pie;
  $("yTitle").disabled = pie;
  $("swap").disabled = pie;
  $("sizeField").disabled = c.type !== "bubble";
  $("symbol").disabled = !["scatter", "bubble", "line"].includes(c.type);
  $("size").disabled = !["scatter", "bubble", "line"].includes(c.type);
  $("smooth").disabled = c.type !== "line";
  $("zero").disabled = pie;
  $("customColor").disabled = c.palette !== "custom";
  $("configHelp").textContent = pie
    ? "饼图无 X / Y 轴，使用数值字段与产品分组。"
    : c.type === "bubble"
      ? "颜色区分产品，气泡面积编码大小字段；最大直径由滑块决定。"
      : "颜色区分产品；不同图表只启用适用的设置。";
  let data = selectedRows(c);
  $("chartTag").textContent = c.type.toUpperCase() + " / ECHARTS";
  $("chartTitle").textContent = types[c.type] + " · " + fieldName(c.y);
  $("chartSubtitle").textContent =
    (pie
      ? c.month
      : (data[0]?.date || "—") +
        " 至 " +
        (data[data.length - 1]?.date || "—")) +
    " / " +
    c.products.join("、");
  $("chart").setAttribute("aria-label", $("chartTitle").textContent);
  try {
    if (!data.length) throw Error("请至少选择一个产品，且所选区间须有数据。");
    const option = buildOption(c, data);
    let excluded = option.excluded || 0;
    delete option.excluded;
    lastOption = option;
    instance.clear();
    instance.setOption(option);
    $("chartNote").textContent =
      (pie
        ? "构成按所选月份与所选产品合计计算。"
        : c.type === "bubble"
          ? "气泡面积 ∝ " +
            fieldName(c.sizeField) +
            "；零值不可见；负值大小已排除 " +
            excluded +
            " 个点。"
          : c.type === "scatter"
            ? "每个点代表一个产品的一个月份；颜色表示产品。"
            : "点击图例筛选，拖动缩放条调整区间，轻触查看数值。") +
      " 数据为模拟或用户导入，非实时行情。";
    announce(
      "已生成" +
        types[c.type] +
        " · " +
        data.length +
        " 条观测 · 引擎 Apache ECharts " +
        echarts.version,
    );
  } catch (err) {
    instance.clear();
    lastOption = null;
    announce(err.message, true);
    $("chartNote").textContent = err.message;
  }
  renderTable(data, c);
}
function renderTable(data, c) {
  let keys = [
    "product",
    "date",
    ...new Set(
      [c.x, c.y, ...(c.type === "bubble" ? [c.sizeField] : [])].filter(
        (k) => !["date", "product"].includes(k),
      ),
    ),
  ];
  $("count").textContent = data.length + " 条 · 最多预览50条";
  $("table").innerHTML =
    "<table><thead><tr>" +
    keys.map((k) => "<th>" + escapeHTML(fieldName(k)) + "</th>").join("") +
    "</tr></thead><tbody>" +
    data
      .slice(0, 50)
      .map(
        (r) =>
          "<tr>" +
          keys
            .map(
              (k) =>
                "<td>" +
                escapeHTML(
                  typeof r[k] === "number"
                    ? r[k].toLocaleString("zh-CN", { maximumFractionDigits: 2 })
                    : r[k],
                ) +
                "</td>",
            )
            .join("") +
          "</tr>",
      )
      .join("") +
    "</tbody></table>";
}
function download(content, name, type) {
  let url = URL.createObjectURL(new Blob([content], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function parseCSV(text) {
  let result = [],
    row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) result.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("CSV 引号未闭合");
  row.push(cell);
  if (row.some((c) => c.trim())) result.push(row);
  return result;
}
function importCSV(text) {
  let matrix = parseCSV(text.replace(/^\ufeff/, "")),
    headers = matrix.shift()?.map((s) => s.trim());
  if (
    !headers ||
    !headers.includes("date") ||
    !headers.includes("product") ||
    headers.length < 3
  )
    throw Error("CSV 需要 date、product 和至少一个数值列");
  if (
    new Set(headers).size !== headers.length ||
    headers.some(
      (h) => !h || ["__proto__", "constructor", "prototype"].includes(h),
    )
  )
    throw Error("字段名不可为空、重复或使用保留名称");
  let seen = new Set();
  if (matrix.length > 1800) throw Error("最多支持1800条记录");
  let parsed = matrix.map((cells, i) => {
    if (cells.length !== headers.length)
      throw Error("第" + (i + 2) + "行列数不一致");
    let row = {};
    headers.forEach((k, j) => {
      let v = cells[j].trim();
      if (k === "date") {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(v))
          throw Error("日期格式应为 YYYY-MM");
        row[k] = v;
      } else if (k === "product") {
        if (!v || v.length > 40) throw Error("产品名称不能为空或超过40字");
        row[k] = v;
      } else {
        if (!v || !Number.isFinite(+v))
          throw Error("第" + (i + 2) + "行 " + k + " 不是有效数值");
        row[k] = +v;
      }
    });
    let key = row.date + "|" + row.product;
    if (seen.has(key)) throw Error("产品月份重复：" + key);
    seen.add(key);
    return row;
  });
  if (!parsed.length) throw Error("没有数据");
  if (
    new Set(parsed.map((r) => r.product)).size > 15 ||
    new Set(parsed.map((r) => r.date)).size > 120 ||
    headers.length > 22
  )
    throw Error("最多15产品、120个月、20个数值列");
  return parsed.sort((a, b) => a.date.localeCompare(b.date));
}
function parsePromptConfig(text) {
  let c = readConfig(),
    recognized = false;
  const typeRules = [
    ["bubble", /气泡/],
    ["scatter", /散点/],
    ["donut", /环形|圆环/],
    ["pie", /饼图/],
    ["stack", /堆叠/],
    ["bar", /柱状|柱形/],
    ["line", /折线/],
  ];
  for (let [type, re] of typeRules)
    if (re.test(text)) {
      c.type = type;
      recognized = true;
      break;
    }
  let m = text.match(/(?:近|最近)\s*(\d+)\s*个?月/);
  if (m) {
    let n = +m[1];
    if (n < 1 || n > 24) throw Error("时间范围支持近1至24个月");
    c.period = n;
    recognized = true;
  }
  let month = text.match(/(\d{4})[-年](\d{1,2})月?/);
  if (month) {
    c.month = month[1] + "-" + month[2].padStart(2, "0");
    if (!getDates().includes(c.month)) throw Error("数据中没有 " + c.month);
    recognized = true;
  }
  let ps = getProducts().filter((p) => text.includes(p));
  if (ps.length) {
    c.products = ps;
    recognized = true;
  } else if (/全部|所有/.test(text)) c.products = getProducts();
  const fieldPattern = numericFields.map((k) => ({
    key: k,
    names: [k, knownFields[k]?.label].filter(Boolean),
  }));
  let mentions = [];
  for (let field of fieldPattern)
    for (let name of field.names) {
      let index = text.toLowerCase().indexOf(name.toLowerCase());
      if (index >= 0) mentions.push({ key: field.key, index });
    }
  mentions.sort((a, b) => a.index - b.index);
  let fields = [...new Set(mentions.map((f) => f.key))];
  if (fields.length) recognized = true;
  function mapped(re) {
    let match = text.match(re);
    if (!match) return null;
    let part = match[1].trim().toLowerCase();
    return fieldPattern.find((f) =>
      f.names.some((n) => part.startsWith(n.toLowerCase())),
    )?.key;
  }
  let x = mapped(/(?:x\s*轴|横轴)\s*(?:为|是|按|=|：|:)?\s*([^，,；;]+)/i),
    y = mapped(/(?:y\s*轴|纵轴)\s*(?:为|是|按|=|：|:)?\s*([^，,；;]+)/i),
    size = mapped(
      /(?:气泡大小|大小|面积)\s*(?:为|是|按|=|：|:)?\s*([^，,；;]+)/i,
    );
  if (["scatter", "bubble"].includes(c.type)) {
    c.x =
      x || fields[0] || (numericFields.includes(c.x) ? c.x : numericFields[0]);
    c.y = y || fields.find((f) => f !== c.x) || c.y;
  } else {
    if (!["pie", "donut"].includes(c.type)) c.x = "date";
    c.y = y || fields[0] || c.y;
  }
  if (size) c.sizeField = size;
  for (let [key, name] of [
    ["purple", "紫色"],
    ["green", "绿色"],
    ["blue", "蓝色"],
    ["red", "红色"],
    ["research", "红蓝"],
  ])
    if (text.includes(name)) {
      c.palette = key;
      recognized = true;
    }
  for (let [key, re] of [
    ["triangle", /三角/],
    ["diamond", /菱形/],
    ["roundRect", /圆角方/],
    ["rect", /方形/],
    ["circle", /圆形/],
  ])
    if (re.test(text)) {
      c.symbol = key;
      recognized = true;
      break;
    }
  if (["pie", "donut"].includes(c.type)) {
    if (!month) c.month = getDates().slice(-1)[0];
  }
  if (/点大小|气泡最大直径|图例|#[0-9a-f]{6}/i.test(text)) recognized = true;
  if (!recognized)
    throw Error(
      "暂未识别需求。请描述图表类型与指标，例如“价格与产量散点图，蓝色”。",
    );
  return c;
}
function parsePrompt(text) {
  const normalized = text
    .trim()
    .replace(/Ｘ/g, "X")
    .replace(/Ｙ/g, "Y")
    .replace(/：/g, ":");
  if (/子图|分面|双\s*[yY]\s*轴|双轴|多面板|左右两图|上下两图/.test(normalized))
    throw Error(
      "当前仅支持单图，不支持子图、分面或双Y轴。请分别生成单图；此要求未执行。",
    );
  if (/图例\s*(?:按|以)\s*(?!\s*产品)[^，,；;]+/.test(normalized))
    throw Error(
      "当前图例固定按产品分组。可设置显示/隐藏及顶部/底部；其他图例分组尚不支持。",
    );
  let clauses = normalized.split(/[，,；;\n。]+/).filter(Boolean);
  const aliases = numericFields.map((key) => ({
    key,
    names: [key, knownFields[key]?.label].filter(Boolean),
  }));
  const mappingPatterns = [
    /(?:x\s*轴|横轴)\s*(?:为|是|按|=|:)?\s*([^，,；;]+)/i,
    /(?:y\s*轴|纵轴)\s*(?:为|是|按|=|:)?\s*([^，,；;]+)/i,
    /(?:气泡大小|大小|面积)\s*(?:为|是|按|=|:)?\s*([^，,；;]+)/i,
  ];
  for (let re of mappingPatterns) {
    const match = normalized.match(re);
    if (
      match &&
      !/^\d/.test(match[1].trim()) &&
      !aliases.some((f) =>
        f.names.some((n) =>
          match[1].trim().toLowerCase().startsWith(n.toLowerCase()),
        ),
      ) &&
      !/^(月份|date|产品|product)/i.test(match[1].trim())
    )
      throw Error(
        "无法映射字段“" +
          match[1].trim() +
          "”。请使用当前数据字段：" +
          numericFields.map(fieldName).join("、"),
      );
  }
  const typeMatches = [
    ["bubble", /气泡图/],
    ["scatter", /散点图/],
    ["donut", /环形图|圆环图/],
    ["pie", /饼图/],
    ["bar", /柱状图|柱形图/],
    ["line", /折线图/],
  ].filter(([key, re]) => re.test(normalized));
  if (typeMatches.length > 1)
    throw Error("一条指令只能选择一种图形。子图暂不支持，请分别生成。");
  const colorMatches =
    normalized.replace(/红蓝/g, "").match(/紫色|绿色|蓝色|红色/g) || [];
  if (new Set(colorMatches).size > 1)
    throw Error("一次请选择一种配色方案；当前不支持逐产品指定多个颜色。");
  const c = parsePromptConfig(normalized),
    warnings = [];
  const size = normalized.match(
    /(?:点大小|气泡最大直径)\s*(?:为|是|=|:)?\s*(\d+(?:\.\d+)?)\s*(?:px|像素)?/i,
  );
  if (size) {
    c.size = +size[1];
    if (c.size < 8 || c.size > 64)
      throw Error("点大小 / 气泡最大直径必须在8–64px之间。");
  }
  const hex = normalized.match(/#[0-9a-f]{6}\b/i);
  if (hex) {
    c.palette = "custom";
    c.customColor = hex[0];
  }
  if (/隐藏图例|不显示图例/.test(normalized)) c.legendShow = false;
  else if (/显示图例/.test(normalized)) c.legendShow = true;
  if (/图例(?:在|放在|位于)?顶部/.test(normalized)) c.legendPosition = "top";
  if (/图例(?:在|放在|位于)?底部/.test(normalized)) c.legendPosition = "bottom";
  if (/(?:x\s*轴|横轴)\s*(?:为|是|按|=|:)?\s*(?:月份|date)/i.test(normalized))
    c.x = "date";
  if (
    /(?:x\s*轴|横轴)\s*(?:为|是|按|=|:)?\s*(?:产品|product)/i.test(normalized)
  )
    c.x = "product";
  if (
    /(?:y\s*轴|纵轴)\s*(?:为|是|按|=|:)?\s*(?:月份|date|产品|product)/i.test(
      normalized,
    )
  )
    throw Error("Y轴必须为数值字段，不能使用月份或产品。");
  let lexemes = [...getProducts(), ...aliases.flatMap((f) => f.names)].sort(
    (a, b) => b.length - a.length,
  );
  for (let clause of clauses) {
    let rest = clause;
    for (let word of lexemes)
      rest = rest.replace(
        new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        "",
      );
    rest = rest
      .replace(
        /(?:近|最近)\s*\d+\s*个?月|\d{4}[-年]\d{1,2}月?|#[0-9a-f]{6}|(?:点大小|气泡最大直径)\s*(?:为|是|=|:)?\s*\d+(?:\.\d+)?\s*(?:px|像素)?/gi,
        "",
      )
      .replace(
        /堆叠柱状图|堆叠|气泡图|散点图|环形图|圆环图|饼图|柱状图|柱形图|折线图|气泡|散点|折线|圆角方形|三角形|菱形|方形|圆形|红蓝|紫色|绿色|蓝色|红色|(?:隐藏|不显示|显示)图例|图例(?:在|放在|位于)?(?:顶部|底部)|图例按产品/g,
        "",
      )
      .replace(
        /x\s*轴|y\s*轴|横轴|纵轴|气泡大小|大小|面积|颜色|主色|配色|全部产品|所有产品|全部|所有|最新月份|月份|产品|product|date|请帮我|帮我|请|生成|展示|画一张|画|一个|一张|的|用|看|按|为|是|和|与|及|[:=\s]/gi,
        "",
      );
    if (rest)
      warnings.push(
        "未识别片段“" + rest + "”：未作为参数执行，请使用术语表或配置区。",
      );
  }
  if (
    !["pie", "donut"].includes(c.type) &&
    !/(?:x\s*轴|横轴|y\s*轴|纵轴)/i.test(normalized)
  )
    warnings.push(
      "未明确指定坐标轴：散点按指标提及顺序推断，折线/柱状默认月份X轴；请核对配置。",
    );
  if (c.type === "line" && c.size > 18)
    warnings.push("折线标记实际最大直径为18px，散点/气泡上限为64px。");
  if (
    ["pie", "donut"].includes(c.type) &&
    /x\s*轴|y\s*轴|横轴|纵轴|大小按|三角|菱形|方形/i.test(normalized)
  )
    warnings.push("饼图无坐标轴，不应用点形状或气泡大小参数。");
  return { config: c, normalized, warnings };
}
function showParseReport(text, result, error) {
  $("parseReport").hidden = false;
  $("parseReport").open = true;
  $("parseSource").textContent =
    "原句：" + text + (result ? "\n规范化：" + result.normalized : "");
  $("parseSummary").textContent = error
    ? "解析 / 校验未通过；本次请求未生成新图表。"
    : "规范化 → 规则匹配 → 配置校验 → ECharts option → 渲染。下方为生成时配置快照；随后手动调整以配置区为准。未指定项沿用当前选择，图形相关默认值已应用。";
  $("parseWarnings").textContent = error
    ? error
    : result.warnings.length
      ? result.warnings.join("\n")
      : "未发现未识别片段。请核对字段映射与单位。";
  $("parseJson").textContent = result
    ? JSON.stringify(result.config, null, 2)
    : "未生成配置";
}
function isSettingsQuestion(text) {
  return (
    /[?？]|怎么|如何|哪些|什么|多少|区别|支持|能否|能不能|可不可以|帮助|说明|不懂|不知道|不会|教我|介绍|解释|查看|列出|吗|呢|可选|允许|能设置|可设置/.test(
      text,
    ) || /(?:当前|现在).*(?:设置|配置|参数|字段|图表)/.test(text)
  );
}

function settingsKnowledge() {
  const c = readConfig(),
    fields = numericFields.map((k) => fieldName(k) + " [" + k + "]").join("、");
  const options = (id) =>
    Array.from($(id).options)
      .map((o) => o.textContent)
      .join("、");
  const first = numericFields.includes("price") ? "price" : numericFields[0];
  const second = numericFields.includes("output")
    ? "output"
    : numericFields[1] || first;
  const example =
    "全部产品近6个月散点图，X轴" + first + "，Y轴" + second + "，圆形，蓝色";
  return [
    {
      name: "图表类型",
      match: /图表类型|图形|什么图|哪些图|散点|折线|柱状|饼图|环形/,
      answer:
        "可选图表：" +
        options("type") +
        "。散点看两个数值指标的关系，气泡再用面积编码第三个指标；折线看趋势，柱状比较数值，饼图/环形图看单月构成。当前图表为" +
        types[c.type] +
        "。",
      example,
    },
    {
      name: "坐标轴与字段",
      match: /坐标|[xXyY]\s*轴|横轴|纵轴|字段|指标/,
      answer:
        "当前数据的数值字段：" +
        fields +
        "。散点/气泡的X和Y都需数值；折线/柱状通常以月份为X。可说“X轴" +
        first +
        "，Y轴" +
        second +
        "”。轴标题、交换X/Y、零起点通过配置区设置；轴标题与零起点尚无自然语言指令。未知字段会报错。",
      example,
    },
    {
      name: "大小",
      match: /大小|尺寸|直径|面积|像素/,
      answer:
        "“大小按" +
        second +
        "”把气泡面积映射到数值；“点大小24px”设置散点直径；“气泡最大直径48px”设置最大气泡直径。范围" +
        $("size").min +
        "–" +
        $("size").max +
        "px，折线标记最大18px；气泡零值不可见，负大小排除。当前尺寸为" +
        c.size +
        "px，大小字段为" +
        fieldName(c.sizeField) +
        "。",
      example:
        "气泡图，X轴" +
        first +
        "，Y轴" +
        second +
        "，大小按" +
        second +
        "，气泡最大直径48px",
    },
    {
      name: "颜色",
      match: /颜色|配色|色系|主色/,
      answer:
        "配色方案：" +
        options("palette") +
        "。可说“紫色”或“颜色#2377ad”；自定义主色自动生成同色系。颜色按产品区分；逐产品指定颜色、透明度或渐变尚无自然语言接口。当前方案为" +
        $("palette").selectedOptions[0].textContent +
        "。",
      example: "散点图，X轴" + first + "，Y轴" + second + "，颜色#2377ad",
    },
    {
      name: "形状",
      match: /形状|标记|三角|菱形|方形|圆形/,
      answer:
        "点形状可选：" +
        options("symbol") +
        "。可直接说“三角形”或“菱形”，应用于散点、气泡和折线标记。柱状图和饼图不使用点形状。当前形状为" +
        $("symbol").selectedOptions[0].textContent +
        "。",
      example: "散点图，X轴" + first + "，Y轴" + second + "，菱形",
    },
    {
      name: "图例",
      match: /图例|分组/,
      answer:
        "图例固定按产品分组，支持“显示图例”“隐藏图例”“图例在顶部”“图例在底部”，也可在配置区选择。点击图例可筛选系列。按月份或其他字段分组、图例左右位置尚不支持。当前图例" +
        (c.legendShow ? "显示" : "隐藏") +
        "，位置为" +
        (c.legendPosition === "top" ? "顶部" : "底部") +
        "。",
      example:
        "散点图，X轴" + first + "，Y轴" + second + "，显示图例，图例在顶部",
    },
    {
      name: "时间与产品",
      match: /时间|日期|月份|区间|范围|产品|筛选/,
      answer:
        "自然语言支持近1–24个月，使用阿拉伯数字，如“近6个月”；饼图可指定YYYY-MM。当前数据范围为" +
        getDates()[0] +
        "至" +
        getDates().slice(-1)[0] +
        "；产品有" +
        getProducts().join("、") +
        "。可使用准确产品名或“全部产品”。未指定时沿用当前选择。",
      example,
    },
    {
      name: "子图与双轴",
      match: /子图|分面|双\s*[yY]?\s*轴|双图|多图|多面板/,
      answer:
        "当前工作台仅支持单图，尚不支持子图、分面、双Y轴或多面板。请分别生成单图并导出PNG。提问可以查看这项说明；直接要求生成子图会明确报错，保留原图。",
      example: null,
    },
    {
      name: "标签与平滑",
      match: /标签|平滑|零起点|轴标题/,
      answer:
        "配置区支持“显示数值标签”“平滑折线”“数值轴从零开始”和X/Y轴标题。平滑仅适用于折线，饼图无坐标轴。这些选项目前通过控件或配置JSON修改，尚不支持对应的自然语言命令。",
      example: null,
    },
    {
      name: "数据与导出",
      match: /导入|导出|数据|csv|json|png|下载|保存/i,
      answer:
        "CSV需要date、product及至少一个数值列，额外数值列自动成为字段。日期格式YYYY-MM；上限2MB、15产品、120个月、1800条、20个数值列。可导出PNG、当前数据CSV和配置JSON，再导入配置复用。导入数据仅在当前页面内存中，刷新后恢复模拟数据。",
      example: null,
    },
    {
      name: "当前设置",
      match: /当前|现在|目前/,
      answer:
        "当前设置：" +
        types[c.type] +
        "；X=" +
        fieldName(c.x) +
        "，Y=" +
        fieldName(c.y) +
        "；产品=" +
        c.products.join("、") +
        "；近" +
        c.period +
        "个月；饼图月份=" +
        c.month +
        "；大小字段=" +
        fieldName(c.sizeField) +
        "；尺寸=" +
        c.size +
        "px。饼图不使用坐标轴，非气泡图不使用大小字段。",
      example: null,
    },
    {
      name: "解析方式与绘图库",
      match: /原理|解析|自然语言|模型|AI|库|引擎|实现/i,
      answer:
        "绘图使用Apache ECharts " +
        echarts.version +
        "。生成流程是：术语/字段匹配→配置JSON→数据与范围校验→ECharts option→渲染。设置问答先识别提问意图，再从本地功能说明和当前数据生成答案；没有调用大模型，不提供任意领域问答。未匹配的生成片段会列在解析报告中。",
      example,
    },
  ];
}

function answerSettingsQuestion(text) {
  const knowledge = settingsKnowledge();
  const overview =
    /设置什么|设置哪些|哪些参数|什么参数|可用参数|支持什么|有什么功能|参数|设置项|帮助|不知道|不懂|不会|怎么设置|如何设置/.test(
      text,
    );
  const matches = knowledge.filter((topic) => topic.match.test(text));
  let answer, example;
  if (matches.length) {
    answer = matches
      .map((topic) => topic.name + "：\n" + topic.answer)
      .join("\n\n");
    example = matches.find((t) => t.example)?.example;
  } else if (overview) {
    answer =
      "可设置：图表类型、X/Y字段、大小映射与像素尺寸、配色、点形状、图例、时间范围、产品筛选；配置区还可修改轴标题、零起点、平滑折线和数值标签。\n可导入CSV、导出PNG和配置JSON。子图/分面/双Y轴尚未实现。\n可以继续问“颜色有哪些？”“气泡大小怎么设置？”“当前有哪些字段？”；下方有具体主题。";
    example = knowledge[0].example;
  } else {
    answer =
      "这条问题尚未匹配到设置主题。当前本地帮助可以回答图表类型、坐标轴、字段、大小、颜色、形状、图例、时间、产品、子图边界及导入导出。请选择下方主题或换成具体参数问题；开放式数据分析问题需要后续接入模型服务。";
  }
  $("helpAnswers").hidden = false;
  const item = document.createElement("article");
  item.className = "help-message";
  const question = document.createElement("h4");
  question.textContent = text;
  item.append(question);
  const body = document.createElement("p");
  body.textContent = answer;
  item.append(body);
  if (example) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "填入生成示例";
    button.onclick = () => {
      $("prompt").value = example;
      $("prompt").focus();
    };
    item.append(button);
  }
  $("helpMessages").append(item);
  while ($("helpMessages").children.length > 8)
    $("helpMessages").firstElementChild.remove();
  $("helpTopics").replaceChildren();
  for (const topic of knowledge) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = topic.name;
    button.onclick = () =>
      answerSettingsQuestion(topic.name + "可以设置什么？");
    $("helpTopics").append(button);
  }
  announce("已回答设置问题；当前图表与配置保持不变。");
  item.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function ask(text) {
  if (isSettingsQuestion(text)) {
    answerSettingsQuestion(text);
    return;
  }
  let result;
  try {
    result = parsePrompt(text);
    const c = result.config;
    validateConfig(c);
    const data = selectedRows(c);
    if (!data.length) throw Error("所选产品或月份没有数据。");
    buildOption(c, data);
    if (![...$("period").options].some((o) => +o.value === c.period))
      $("period").add(new Option("近" + c.period + "个月", c.period));
    setConfig(c);
    render();
    showParseReport(text, result);
    if (result.warnings.length)
      announce(
        "已生成图表，但有 " +
          result.warnings.length +
          " 条解析提示，请查看展开的解析报告。",
      );
    $("parseReport").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showParseReport(text, result, err.message);
    announce(err.message, true);
  }
}
function validateConfig(c) {
  if (!c || typeof c !== "object" || Array.isArray(c))
    throw Error("配置应为 JSON 对象");
  if (c.legendShow === undefined) c.legendShow = true;
  if (c.legendPosition === undefined) c.legendPosition = "bottom";
  if (
    typeof c.legendShow !== "boolean" ||
    !["top", "bottom"].includes(c.legendPosition)
  )
    throw Error("图例配置无效");
  if (
    !Object.prototype.hasOwnProperty.call(types, c.type) ||
    !["date", "product", ...numericFields].includes(c.x) ||
    !numericFields.includes(c.y) ||
    !numericFields.includes(c.sizeField)
  )
    throw Error("配置图表类型或字段不适用于当前数据");
  if (
    !Array.isArray(c.products) ||
    !c.products.length ||
    c.products.some((p) => !getProducts().includes(p))
  )
    throw Error("配置中的产品不适用于当前数据");
  if (
    !Number.isInteger(c.period) ||
    c.period < 1 ||
    c.period > 24 ||
    !getDates().includes(c.month) ||
    !["circle", "rect", "triangle", "diamond", "roundRect"].includes(
      c.symbol,
    ) ||
    ![...Object.keys(palettes), "custom"].includes(c.palette) ||
    !/^#[0-9a-f]{6}$/i.test(c.customColor) ||
    !Number.isFinite(c.size) ||
    c.size < 8 ||
    c.size > 64
  )
    throw Error("配置范围、形状、颜色或大小无效");
  for (let k of ["xTitle", "yTitle"])
    if (typeof c[k] !== "string" || c[k].length > 80)
      throw Error("坐标轴标题无效");
  for (let k of ["zero", "smooth", "labels"])
    if (typeof c[k] !== "boolean") throw Error("配置布尔字段无效");
  return c;
}
function boot() {
  if (!window.echarts) {
    announce("图表引擎加载失败，请刷新或返回首页查看静态图表。", true);
    return;
  }
  instance = echarts.init($("chart"), null, { renderer: "canvas" });
  initData(demoData());
  document.querySelectorAll("[data-help]").forEach(
    (button) =>
      (button.onclick = () => {
        $("prompt").value = button.dataset.help;
        answerSettingsQuestion(button.dataset.help);
      }),
  );
  $("clearHelp").onclick = () => {
    $("helpMessages").replaceChildren();
    $("helpAnswers").hidden = true;
  };
  document.querySelectorAll(".panel select,.panel input").forEach((el) =>
    el.addEventListener("input", () => {
      if (el.id === "type") {
        const type = $("type").value;
        if (
          ["scatter", "bubble"].includes(type) &&
          ["date", "product"].includes($("x").value)
        )
          $("x").value = numericFields.includes("price")
            ? "price"
            : numericFields[0];
        else if (["line", "bar", "stack"].includes(type)) $("x").value = "date";
      }
      render();
    }),
  );
  $("products").addEventListener("change", render);
  $("reset").onclick = () => {
    setConfig(defaults());
    render();
  };
  $("swap").onclick = () => {
    let c = readConfig();
    if (!numericFields.includes(c.x)) {
      announce("交换 X / Y 需要两个数值字段，请先把 X 轴改为数值指标。", true);
      return;
    }
    [c.x, c.y] = [c.y, c.x];
    [c.xTitle, c.yTitle] = [c.yTitle, c.xTitle];
    setConfig(c);
    render();
  };
  $("ask").onsubmit = (e) => {
    e.preventDefault();
    ask($("prompt").value.trim());
  };
  document.querySelectorAll("[data-prompt]").forEach(
    (b) =>
      (b.onclick = () => {
        $("prompt").value = b.dataset.prompt;
        ask(b.dataset.prompt);
      }),
  );
  $("download").onclick = () => {
    if (!lastOption) {
      announce("请先生成有效图表。", true);
      return;
    }
    let a = document.createElement("a");
    a.download = "chemical-" + activeConfig.type + ".png";
    a.href = instance.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#fff",
    });
    a.click();
  };
  $("saveConfig").onclick = () =>
    download(
      JSON.stringify(
        { version: 1, library: "Apache ECharts 5.6.0", config: readConfig() },
        null,
        2,
      ),
      "chart-config.json",
      "application/json",
    );
  $("loadConfig").onchange = async (e) => {
    try {
      let f = e.target.files[0];
      if (!f) return;
      if (f.size > 100000) throw Error("配置文件过大");
      let parsed = JSON.parse(await f.text());
      if (parsed.version !== 1) throw Error("不支持的配置版本");
      let c = validateConfig(parsed.config);
      if (![...$("period").options].some((o) => +o.value === c.period))
        $("period").add(new Option("近" + c.period + "个月", c.period));
      setConfig(c);
      render();
    } catch (err) {
      announce("导入配置失败：" + err.message, true);
    } finally {
      e.target.value = "";
    }
  };
  $("upload").onchange = async (e) => {
    try {
      let f = e.target.files[0];
      if (!f) return;
      if (f.size > 2000000) throw Error("CSV 上限2 MB");
      initData(importCSV(await f.text()));
    } catch (err) {
      announce("导入失败：" + err.message, true);
    } finally {
      e.target.value = "";
    }
  };
  $("template").onclick = () => {
    let headers = Object.keys(rows[0]),
      cell = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    download(
      "\ufeff" +
        [
          headers.map(cell).join(","),
          ...rows.map((r) => headers.map((k) => cell(r[k])).join(",")),
        ].join("\r\n"),
      "chemical-studio.csv",
      "text/csv;charset=utf-8",
    );
  };
  $("demo").onclick = () => initData(demoData());
  let resize;
  window.addEventListener("resize", () => {
    clearTimeout(resize);
    resize = setTimeout(() => {
      instance.resize();
      render();
    }, 180);
  });
  window.addEventListener("pageshow", () => instance.resize());
  const prompt = new URLSearchParams(location.search).get("prompt");
  if (prompt) {
    $("prompt").value = prompt.slice(0, 500);
    ask(prompt.slice(0, 500));
  }
}
boot();
