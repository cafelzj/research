"use strict";
const $ = (id) => document.getElementById(id),
  esc = (text) =>
    String(text).replace(
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
let data,
  source,
  fields,
  page = 1,
  sortKey = "date",
  direction = -1,
  filtered = [];
const analysisView =
  new URLSearchParams(location.search).get("view") === "analysis";
function status(text, error = false) {
  $("dataStatus").textContent = text;
  $("dataStatus").classList.toggle("error", error);
}
function init(rows, label) {
  data = rows;
  source = label;
  fields = Object.keys(data[0]).filter((k) => !["date", "product"].includes(k));
  const dates = [...new Set(data.map((r) => r.date))].sort();
  $("start").value = dates[0];
  $("end").value = dates[dates.length - 1];
  $("product").innerHTML =
    '<option value="">全部产品</option>' +
    [...new Set(data.map((r) => r.product))]
      .map((p) => `<option value="${esc(p)}">${esc(p)}</option>`)
      .join("");
  $("search").value = "";
  $("fields").innerHTML = fields
    .map(
      (k) =>
        `<label><input type="checkbox" value="${esc(k)}" checked>${esc(ChemData.fieldName(k))}</label>`,
    )
    .join("");
  $("sourceDetail").textContent = source + " · " + data.length + "条原始观测";
  $("sourceBadge").textContent = source.includes("模拟")
    ? "模拟数据"
    : "会话数据";
  $("dictionary").innerHTML = fields
    .map(
      (k) =>
        "<p><b>" + esc(k) + "</b> · " + esc(ChemData.fieldName(k)) + "</p>",
    )
    .join("");
  sortKey = "date";
  direction = -1;
  page = 1;
  render();
}
function visibleFields() {
  return Array.from($("fields").querySelectorAll("input:checked")).map(
    (n) => n.value,
  );
}
function render() {
  const start = $("start").value,
    end = $("end").value,
    product = $("product").value,
    query = $("search").value.trim().toLowerCase();
  if (start && end && start > end) {
    filtered = [];
    status("开始月份不能晚于结束月份。", true);
  } else {
    filtered = data.filter(
      (r) =>
        (!start || r.date >= start) &&
        (!end || r.date <= end) &&
        (!product || r.product === product) &&
        (!query || (r.product + " " + r.date).toLowerCase().includes(query)),
    );
    status(
      "已筛选 " +
        filtered.length +
        " / " +
        data.length +
        " 条观测。点击字段标题排序，或将筛选数据带入图表制作。",
    );
  }
  filtered.sort((a, b) => {
    const av = a[sortKey],
      bv = b[sortKey];
    return (
      direction *
      (typeof av === "number" ? av - bv : String(av).localeCompare(String(bv)))
    );
  });
  const dates = [...new Set(filtered.map((r) => r.date))].sort(),
    count = +$("pageSize").value,
    pages = Math.max(1, Math.ceil(filtered.length / count));
  page = Math.min(page, pages);
  const keys = ["date", "product", ...visibleFields()];
  $("summary").innerHTML = [
    ["筛选观测", filtered.length + "条"],
    ["产品", new Set(filtered.map((r) => r.product)).size + "个"],
    [
      "覆盖月份",
      dates.length ? dates[0] + " — " + dates[dates.length - 1] : "—",
    ],
    ["可用数值字段", fields.length + "项"],
  ]
    .map(
      (r, i) =>
        "<article><small>" +
        r[0] +
        '</small><strong class="' +
        (i === 2 ? "date-range" : "") +
        '">' +
        esc(r[1]) +
        "</strong></article>",
    )
    .join("");
  $("records").innerHTML =
    "<table><thead><tr>" +
    keys
      .map(
        (k) =>
          `<th><button type="button" data-sort="${esc(k)}">${esc(ChemData.fieldName(k))} ${sortKey === k ? (direction > 0 ? "↑" : "↓") : "↕"}</button></th>`,
      )
      .join("") +
    "<th>分析</th></tr></thead><tbody>" +
    (filtered.length
      ? filtered
          .slice((page - 1) * count, page * count)
          .map(
            (r, i) =>
              "<tr>" +
              keys
                .map(
                  (k) =>
                    "<td>" +
                    esc(
                      typeof r[k] === "number"
                        ? r[k].toLocaleString("zh-CN", {
                            maximumFractionDigits: 2,
                          })
                        : r[k],
                    ) +
                    "</td>",
                )
                .join("") +
              `<td><button type="button" class="record-action" data-row="${(page - 1) * count + i}">单条绘图 ↗</button></td></tr>`,
          )
          .join("")
      : `<tr><td colspan="${keys.length + 1}" class="empty-cell">没有匹配观测，请调整筛选条件。</td></tr>`) +
    "</tbody></table>";
  $("pageInfo").textContent = page + " / " + pages + " 页";
  $("prev").disabled = page <= 1;
  $("next").disabled = page >= pages;
  $("analyze").disabled = !filtered.length;
  $("export").disabled = !filtered.length;
  $("records")
    .querySelectorAll("[data-sort]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          direction = sortKey === b.dataset.sort ? -direction : 1;
          sortKey = b.dataset.sort;
          page = 1;
          render();
        }),
    );
  $("records")
    .querySelectorAll("[data-row]")
    .forEach(
      (b) =>
        (b.onclick = () => analyze([filtered[+b.dataset.row]], "单条观测")),
    );
}
function analyze(rows, label) {
  try {
    ChemData.save(rows, source + " / " + label, true);
    location.href = "studio.html?dataset=selection";
  } catch (error) {
    status(error.message, true);
  }
}
for (const id of ["start", "end", "product", "search", "fields", "pageSize"])
  $(id).addEventListener("input", () => {
    page = 1;
    render();
  });
$("prev").onclick = () => {
  page--;
  render();
};
$("next").onclick = () => {
  page++;
  render();
};
$("clearFilters").onclick = () => init(data, source);
$("analyze").onclick = () =>
  analyze(filtered, "筛选" + filtered.length + "条观测");
$("export").onclick = () => {
  const url = URL.createObjectURL(
      new Blob([ChemData.toCSV(filtered)], { type: "text/csv;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = "chemical-filtered-data.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("upload").onchange = async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) throw Error("CSV上限2MB");
    const rows = ChemData.importCSV(await file.text());
    ChemData.save(rows, "导入文件：" + file.name);
    history.replaceState(null, "", "data.html");
    $("fullData").hidden = true;
    init(rows, "导入文件：" + file.name);
  } catch (error) {
    status("导入失败：" + error.message, true);
  } finally {
    e.target.value = "";
  }
};
$("restore").onclick = () => {
  try {
    ChemData.clear();
    history.replaceState(null, "", "data.html");
    init(ChemData.demoData(), "化工模拟月度数据");
    $("fullData").hidden = true;
  } catch (error) {
    status(error.message, true);
  }
};
try {
  const stored = ChemData.load(analysisView);
  init(
    stored ? stored.rows : ChemData.demoData(),
    stored ? stored.source : "化工模拟月度数据",
  );
  if (analysisView) {
    $("fullData").hidden = false;
    if (!stored)
      status(
        "未找到分析数据，当前显示模拟数据。请重新从明细或图表页带入数据。",
        true,
      );
  }
} catch (error) {
  init(ChemData.demoData(), "化工模拟月度数据");
  status("暂存数据读取失败：" + error.message, true);
}
