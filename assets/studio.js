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
  ])
    if (c[key] !== undefined) $(key).value = String(c[key]);
  for (let key of ["zero", "smooth", "labels"])
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
      bottom: 8,
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
    top: 48,
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
function parsePrompt(text) {
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
  if (!recognized)
    throw Error(
      "暂未识别需求。请描述图表类型与指标，例如“价格与产量散点图，蓝色”。",
    );
  return c;
}
function ask(text) {
  try {
    const c = parsePrompt(text);
    if (![...$("period").options].some((o) => +o.value === c.period))
      $("period").add(new Option("近" + c.period + "个月", c.period));
    setConfig(c);
    render();
    if (lastOption)
      $("chartTitle").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    announce(err.message, true);
  }
}
function validateConfig(c) {
  if (!c || typeof c !== "object" || Array.isArray(c))
    throw Error("配置应为 JSON 对象");
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
