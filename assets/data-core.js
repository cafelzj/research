"use strict";
window.ChemData = (() => {
  const knownFields = {
    price: { label: "价格", unit: "元/吨" },
    output: { label: "产量", unit: "万吨" },
    rate: { label: "开工率", unit: "%" },
    cost: { label: "成本", unit: "元/吨" },
    inventory: { label: "库存", unit: "万吨" },
  };
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
          inventory: +(output * (0.16 + 0.05 * Math.sin(m * 0.4 + j))).toFixed(
            1,
          ),
        });
      });
    }
    return data;
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

  const DATA_KEY = "chem.dataset.v1",
    ANALYSIS_KEY = "chem.analysis.v1";
  function fieldName(key) {
    if (key === "date") return "月份";
    if (key === "product") return "产品";
    const f = knownFields[key];
    return f ? f.label + (f.unit ? "（" + f.unit + "）" : "") : key;
  }
  function toCSV(rows) {
    const headers = Object.keys(rows[0]),
      cell = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    return (
      "\ufeff" +
      [
        headers.map(cell).join(","),
        ...rows.map((row) => headers.map((k) => cell(row[k])).join(",")),
      ].join("\r\n")
    );
  }
  function save(rows, source, analysis = false) {
    const data = { version: 1, source, rows };
    try {
      sessionStorage.setItem(
        analysis ? ANALYSIS_KEY : DATA_KEY,
        JSON.stringify(data),
      );
    } catch (error) {
      throw Error(
        "浏览器无法暂存数据，请允许本站会话存储，或先导出CSV后在图表页导入。",
      );
    }
  }
  function load(analysis = false) {
    const text = sessionStorage.getItem(analysis ? ANALYSIS_KEY : DATA_KEY);
    if (!text) return null;
    const data = JSON.parse(text);
    if (
      data.version !== 1 ||
      !Array.isArray(data.rows) ||
      !data.rows.length ||
      typeof data.source !== "string"
    )
      throw Error("暂存数据格式无效，请重新导入CSV。");
    return { rows: importCSV(toCSV(data.rows)), source: data.source };
  }
  function clear() {
    sessionStorage.removeItem(DATA_KEY);
    sessionStorage.removeItem(ANALYSIS_KEY);
  }
  return {
    knownFields,
    demoData,
    parseCSV,
    importCSV,
    fieldName,
    toCSV,
    save,
    load,
    clear,
  };
})();
