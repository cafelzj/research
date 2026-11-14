/* Deterministic teaching diagrams. No model inference or benchmark is performed. */

const mounted = new WeakMap();
let nextId = 0;

const HISTORY = [
  { title: "记录 A", tokens: ["A 公司", "2019 年", "存货跌价", "23 万元"] },
  { title: "记录 B", tokens: ["A 公司", "2020 年", "存货跌价", "31 万元"] },
  { title: "记录 C", tokens: ["B 公司", "2019 年", "存货跌价", "18 万元"] },
];

const MODES = {
  full: {
    label: "全注意力",
    steps: [
      ["读入历史", "读入三条虚构记录。这里的十二个词块是便于阅读的教学单元，不是真实 tokenizer 的十二个 token。"],
      ["逐位置保存", "每个位置都有自己的 K/V 表示。历史增长，缓存通常也随之增长；K/V 是学习表示，并不是一份原文数据库。"],
      ["提出查询", "问题是：A 公司 2019 年的存货跌价金额是多少？当前 query 可以对全部可见历史位置重新打分。"],
      ["所有位置参与注意力", "主注意力对全部可见 K/V 打分，做 softmax 和 value 加权。图中一起点亮表示参与计算，不代表每个位置权重相同。"],
      ["形成读出", "示意命中记录 A 的 23 万元。真实输出是多层计算后的表示；即使历史全部可访问，也可能选错年份、公司或单位。"],
    ],
    boundary: "保留逐位置 K/V 提供回看路径；不保证逐字还原或事实正确。FlashAttention 优化计算安排，不改变精确全注意力的二次主项。",
  },
  gdn: {
    label: "Gated DeltaNet · GDN",
    steps: [
      ["读入历史", "用同一组虚构记录作对照。下一步把历史持续写入固定大小的状态，而不是逐条保留 K/V。"],
      ["保存固定状态", "示意状态只有 2 × 2。它不是财务表格：每个数是任意教学特征，没有“这一格就是某公司金额”的固定含义。"],
      ["提出查询", "query 读取固定状态中的关联。若某个原始细节已经在写入、干扰或遗忘中丢失，后来的 query 不能直接回到该层旧 K/V。"],
      ["先遗忘，再按残差改写", "每头用一个标量 α = 0.80 衰减全部旧状态；再用 β = 0.60、k = [1, 0]、v = [0.70, 0.10] 写入预测差额。参数仅为教学算术。"],
      ["读取关联与边界", "q = [1, 0] 从更新后的状态读出一个特征向量。向量不是 23 万元的模型预测，不能拿这个教学状态评价真实模型精度。"],
    ],
    boundary: "状态大小不随历史长度增长，但容量有限。所谓残差“纠错”是向量关联更新，不等于核验事实，也不等于永久微调模型权重。",
  },
  kda: {
    label: "Kimi Delta Attention · KDA",
    steps: [
      ["读入历史", "KDA 也把历史写入固定状态。它改变的是遗忘粒度，不是恢复成逐位置 K/V 档案。"],
      ["保存固定状态", "仍用同一个 2 × 2 任意教学状态。比较重点是下一步不同 key 通道可以采用不同保留率。"],
      ["提出查询", "query 从状态读关联。不同通道可以有不同寿命，但通道是学习特征，不天然等于“事实”或“预测”。"],
      ["按通道遗忘，再改写", "两个 key 通道保留率分别为 0.95 与 0.25；β = 0.60、k 与 v 和 GDN 相同。先施加对角衰减，再按衰减后状态计算残差，顺序不能互换。"],
      ["读取关联与边界", "更细的门能有选择地保留不同方向的信息；它依然受有限状态约束。此处向量只展示更新机制，不代表真实模型的答案。"],
    ],
    boundary: "KDA 把 GDN 的每头标量遗忘门细化为 key 通道门；原方案的 β 仍是每头标量。它不能无损保存任意长历史。",
  },
  qsa: {
    label: "Qwen Sparse Attention · QSA",
    steps: [
      ["读入历史", "QSA 保留逐位置的主注意力 K/V，另用一条轻量路径建立块索引。目录和正文是两套表示。"],
      ["压缩索引，保留原 K/V", "示意每四个 index key 平均为一个目录块。压缩的是选位置用的 index key，下面十二个主 K/V 位置仍全部保留。"],
      ["给目录块打分", "当前 query 对所有可见目录块评分。本演示只选一个块来说明流程；这不是生产模型的选择预算。"],
      ["展开位置，精读原 K/V", "示意选中块 1，展开其四个位置，读取未压缩的主 K/V 做 softmax 与加权。未选中记录 B、C 的原 K/V 仍在，下一次查询可能选中它们。"],
      ["形成读出与边界", "示意在原始位置找到 23 万元。索引若漏选关键块，本次精读就看不到它；保留原 K/V 不等于每次都能找对。"],
    ],
    boundary: "Flash-Next 的实际配置为 4 个位置一块、最多选 512 块，再加未满块尾部；本图压成 3 块并只选 1 块。QSA 层仍保存增长的主 K/V；轻量索引也不等于严格线性 prefill。",
  },
  csa: {
    label: "Compressed Sparse Attention · CSA",
    steps: [
      ["读入历史", "只展示 CSA 的压缩历史路径，用它与 QSA 的“仅压缩目录”作对照。真实模型还可能混合局部窗口和其他分支。"],
      ["压缩内容表示", "示意把每条记录的历史内容压到一个表示槽。压缩路径之后读取的是这些内容表示，不能假定原来每个位置的细节仍独立可读。"],
      ["查询压缩内容", "当前 query 在压缩后的历史表示中选择相关内容。压缩率与选择预算决定计算量，也会影响细节保真。"],
      ["读取压缩槽", "示意读取槽 1；这里没有像 QSA 一样再展开到这条压缩路径的四个原 K/V。真实 CSA 的具体多级压缩、选择和局部分支以对应模型论文为准。"],
      ["形成读出与边界", "模型仍可利用压缩内容回答问题，但不能由本动画保证还原 23 万元或脚注原句。压缩后容量可随历史增长，不等于 GDN 的固定状态。"],
    ],
    boundary: "CSA 图只说明“压缩内容”这一差别，不实现某篇论文的全部算法，也不代表整个模型把所有原始 K/V 都删除了。数字槽是任意教学表示，不是实际模型缓存。",
  },
};

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

function setGrid(node, minimum = "12rem") {
  node.style.display = "grid";
  node.style.gridTemplateColumns = `repeat(auto-fit, minmax(min(100%, ${minimum}), 1fr))`;
  node.style.gap = "0.75rem";
  node.style.minWidth = "0";
}

function historyMarkup(step, mode) {
  return HISTORY.map((record, block) => {
    const selected = step >= 3 && (mode === "full" && step === 3 || block === 0);
    const muted = step >= 3 && mode === "qsa" && block !== 0;
    return `<section class="lab-node${selected ? " lab-active" : ""}${muted ? " lab-muted" : ""}" data-role="history-block" data-block="${block}" data-retained="true"><b>${record.title}</b><div class="lab-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem;min-width:0">${record.tokens.map((token, offset) => `<span class="lab-token" data-position="${block * 4 + offset}">${token}</span>`).join("")}</div>${mode === "qsa" && step >= 3 && block !== 0 ? '<small>本次未读 · 原 K/V 仍保留</small>' : ""}</section>`;
  }).join("");
}

function matrixMarkup(mode, updated) {
  const initial = [[0.42, -0.18], [0.09, 0.61]];
  const decay = mode === "kda" ? [0.95, 0.25] : [0.8, 0.8];
  const state = initial.map((row) => [...row]);
  if (updated) {
    state.forEach((row, index) => row.forEach((value, column) => { state[index][column] = value * decay[index]; }));
    state[0][0] += 0.6 * (0.7 - state[0][0]);
    state[0][1] += 0.6 * (0.1 - state[0][1]);
  }
  return `<section class="lab-node${updated ? " lab-active" : ""}" data-role="fixed-state" data-storage="fixed-state"><b>固定状态 S · 2 × 2 教学示意</b><div class="lab-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem;min-width:0">${state.flat().map((value, index) => `<span class="lab-token" data-state-cell="${index}">${value.toFixed(4)}</span>`).join("")}</div><p class="lab-note">${mode === "kda" ? "通道门：α₁ = 0.95；α₂ = 0.25" : "每头标量门：α = 0.80"}；写入门 β = 0.60</p>${updated ? `<p data-role="state-readout">q = [1, 0] 的特征读出：[${state[0].map((value) => value.toFixed(4)).join(", ")}]</p>` : ""}</section>`;
}

function mountAttention(host) {
  const doc = host.ownerDocument;
  const win = doc.defaultView || window;
  const id = `attention-lab-${++nextId}`;
  const media = win.matchMedia ? win.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  let mechanism = Object.hasOwn(MODES, host.dataset.mechanism) ? host.dataset.mechanism : "full";
  let step = 0;
  let timer = null;
  let visible = true;
  let observer = null;

  host.innerHTML = `<div class="lab-controls" style="display:flex;flex-wrap:wrap;align-items:end;gap:.6rem;min-width:0"><label style="display:grid;gap:.3rem;min-width:0;flex:1 1 14rem">比较机制<select name="mechanism" data-action="mechanism" aria-controls="${id}-stage" style="width:100%;max-width:100%;min-width:0">${Object.entries(MODES).map(([key, mode]) => `<option value="${key}">${mode.label}</option>`).join("")}</select></label><button type="button" data-action="prev">上一步</button><button type="button" data-action="next">下一步</button><button type="button" data-action="play" aria-pressed="false">播放演示</button></div><p class="lab-note" id="${id}-help">默认静态。也可聚焦示意区，用 ← / →、Home / End 切换步骤。</p><p class="lab-note" data-output="playback" aria-live="polite"></p><p data-output="step" aria-live="off"></p><div class="lab-stage" id="${id}-stage" data-action="stage" role="group" tabindex="0" aria-describedby="${id}-help" aria-keyshortcuts="ArrowLeft ArrowRight Home End" style="min-width:0;max-width:100%"></div><div class="lab-readout" data-output="readout" aria-live="polite" aria-atomic="true"></div><p class="lab-note" data-output="boundary"></p><p class="lab-note">全部记录、状态、选择结果均为确定的教学示意；没有调用模型，不是模型实测、性能排名或准确率承诺。</p>`;

  const select = host.querySelector('[data-action="mechanism"]');
  const previous = host.querySelector('[data-action="prev"]');
  const next = host.querySelector('[data-action="next"]');
  const play = host.querySelector('[data-action="play"]');
  const stage = host.querySelector('[data-action="stage"]');
  const playback = host.querySelector('[data-output="playback"]');

  function updateControls() {
    previous.disabled = step === 0;
    next.disabled = step === 4;
    play.disabled = media.matches;
    play.textContent = timer === null ? "播放演示" : "暂停播放";
    play.setAttribute("aria-pressed", String(timer !== null));
    play.setAttribute("aria-label", timer === null ? "播放当前机制的五步教学演示" : "暂停当前教学演示");
  }

  function stop(reason = "") {
    if (timer !== null) win.clearInterval(timer);
    timer = null;
    updateControls();
    if (reason) playback.textContent = reason;
  }

  function render() {
    const mode = MODES[mechanism];
    const [title, explanation] = mode.steps[step];
    host.dataset.mechanism = mechanism;
    host.dataset.step = String(step);
    select.value = mechanism;
    host.querySelector('[data-output="step"]').textContent = `第 ${step + 1} / 5 步 · ${title}`;
    host.querySelector('[data-output="readout"]').textContent = explanation;
    host.querySelector('[data-output="boundary"]').textContent = mode.boundary;
    stage.setAttribute("aria-label", `${mode.label}：${title}`);

    let content = '<p class="lab-note" data-role="query">查询：A 公司 2019 年的存货跌价金额是多少？</p>';
    if (step === 0 || mechanism === "full" || mechanism === "qsa") {
      content += `<p><b>${step === 0 ? "待写入的虚构输入" : "保留的逐位置主 K/V · 表示示意"}</b></p><div class="lab-grid" data-role="history" data-storage="${step === 0 ? "input" : "raw-kv"}">${historyMarkup(step, mechanism)}</div>`;
    }
    if (step >= 1 && (mechanism === "gdn" || mechanism === "kda")) {
      content += matrixMarkup(mechanism, step >= 3);
      content += '<p class="lab-muted" data-role="no-raw-kv">此层没有随输入条数增长的逐位置 K/V 档案。混合模型的其他全局层可另保留历史访问路径。</p>';
    }
    if (step >= 1 && mechanism === "qsa") {
      content += `<p><b>轻量块目录 · 用于选位置</b></p><div class="lab-grid" data-role="index">${HISTORY.map((_, block) => `<div class="lab-node${step >= 3 && block === 0 ? " lab-active" : ""}" data-role="index-block" data-block="${block}">目录块 ${block + 1}<small style="display:block">对应位置 ${block * 4 + 1}–${block * 4 + 4}${step >= 3 && block === 0 ? " · 本次选中" : ""}</small></div>`).join("")}</div>`;
    }
    if (step >= 1 && mechanism === "csa") {
      content += `<p><b>压缩内容路径 · 不再展开为原四个位置</b></p><div class="lab-grid" data-role="compressed-history" data-storage="compressed-content">${["[0.72, −0.18]", "[0.35, 0.44]", "[−0.12, 0.61]"].map((value, block) => `<div class="lab-node${step >= 3 && block === 0 ? " lab-active" : ""}" data-role="compressed-slot" data-block="${block}"><b>内容槽 ${block + 1}</b><span class="lab-token" style="display:block">${value}</span><small>任意教学表示${step >= 3 && block === 0 ? " · 本次读取" : ""}</small></div>`).join("")}</div><p class="lab-muted">只画压缩分支；真实模型的局部窗口、多级压缩或其他分支没有在此展开。</p>`;
    }
    if (step >= 2) {
      const route = {
        full: "当前 query → 全部可见 K/V → 加权读出",
        gdn: "当前 query → 固定矩阵状态 → 关联读出",
        kda: "当前 query → 按通道控制的固定状态 → 关联读出",
        qsa: "当前 query → 压缩块目录 → 展开位置 → 未压缩主 K/V",
        csa: "当前 query → 压缩历史内容槽 → 内容表示读出",
      }[mechanism];
      content += `<p class="lab-node${step >= 3 ? " lab-active" : ""}" data-role="read-path">${escapeHTML(route)}</p>`;
    }
    stage.innerHTML = content;
    stage.querySelectorAll(':scope > .lab-grid').forEach((grid) => setGrid(grid));
    stage.querySelectorAll('.lab-node, .lab-token, p').forEach((node) => { node.style.overflowWrap = "anywhere"; node.style.minWidth = "0"; });
    updateControls();
  }

  function goTo(value) {
    stop("已暂停，可逐步阅读。");
    step = Math.max(0, Math.min(4, value));
    render();
  }

  function togglePlayback() {
    if (timer !== null) { stop("已暂停。"); return; }
    if (media.matches) { stop("已开启减少动态效果，请使用上一步或下一步。"); return; }
    if (doc.hidden || !visible || !host.isConnected) { stop("演示区不可见，保持暂停。"); return; }
    if (step === 4) { step = 0; render(); }
    playback.textContent = "正在逐步播放；可随时暂停。";
    timer = win.setInterval(() => {
      if (doc.hidden || !visible || !host.isConnected || media.matches) { stop("演示区不可见或已启用减少动态效果，播放已停止。"); return; }
      step = Math.min(4, step + 1);
      render();
      if (step === 4) stop("五步演示已结束，可切换机制比较。");
    }, 2200);
    updateControls();
  }

  const onSelect = () => { stop("已切换机制，默认暂停。"); mechanism = select.value; step = 0; render(); };
  const onPrevious = () => goTo(step - 1);
  const onNext = () => goTo(step + 1);
  const onKey = (event) => {
    if (event.target !== stage) return;
    const destination = { ArrowLeft: step - 1, ArrowRight: step + 1, Home: 0, End: 4 }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    goTo(destination);
  };
  const onVisibility = () => { if (doc.hidden) stop("页面已隐藏，播放已停止。"); };
  const onPageHide = () => stop();
  const onMotion = () => { if (media.matches) stop("已开启减少动态效果，请使用上一步或下一步。"); updateControls(); };

  select.addEventListener("change", onSelect);
  previous.addEventListener("click", onPrevious);
  next.addEventListener("click", onNext);
  play.addEventListener("click", togglePlayback);
  stage.addEventListener("keydown", onKey);
  doc.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("pagehide", onPageHide);
  if (media.addEventListener) media.addEventListener("change", onMotion);
  else if (media.addListener) media.addListener(onMotion);
  if (win.IntersectionObserver) {
    observer = new win.IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0);
      if (!visible && timer !== null) stop("演示区已离开视口，播放已停止。");
    }, { threshold: [0, 0.01] });
    observer.observe(host);
  }
  render();
  if (media.matches) playback.textContent = "已开启减少动态效果，请使用上一步或下一步。";

  return {
    host,
    type: "attention",
    destroy() {
      stop();
      observer?.disconnect();
      select.removeEventListener("change", onSelect);
      previous.removeEventListener("click", onPrevious);
      next.removeEventListener("click", onNext);
      play.removeEventListener("click", togglePlayback);
      stage.removeEventListener("keydown", onKey);
      doc.removeEventListener("visibilitychange", onVisibility);
      win.removeEventListener("pagehide", onPageHide);
      if (media.removeEventListener) media.removeEventListener("change", onMotion);
      else if (media.removeListener) media.removeListener(onMotion);
      mounted.delete(host);
    },
  };
}

const KV_FIELDS = [
  { name: "layers", symbol: "L", label: "层数 L", value: 80, min: 1, max: 10000 },
  { name: "tokens", symbol: "N", label: "缓存长度 N（token）", value: 1000000, min: 1, max: 1000000000 },
  { name: "kvHeads", symbol: "Hkv", label: "KV 头数 Hkv", value: 8, min: 1, max: 65536 },
  { name: "headDim", symbol: "d", label: "每个 KV 头维度 d", value: 128, min: 1, max: 65536 },
  { name: "bytes", symbol: "bytes", label: "每元素字节数 bytes", value: 2, min: 0.125, max: 16, fractional: true },
  { name: "batch", symbol: "batch", label: "同时缓存的序列数 batch", value: 1, min: 1, max: 1000000 },
];

function mountKV(host) {
  const id = `kv-lab-${++nextId}`;
  host.innerHTML = `<form data-action="kv-form" novalidate><div class="lab-controls lab-grid" data-role="kv-fields">${KV_FIELDS.map((field) => `<label style="display:grid;gap:.35rem;min-width:0">${field.label}<input type="number" name="${field.name}" data-param="${field.symbol}" data-action="kv-input" min="${field.min}" max="${field.max}" step="${field.fractional ? "any" : "1"}" value="${field.value}" required aria-describedby="${id}-note" style="width:100%;max-width:100%;min-width:0;box-sizing:border-box"></label>`).join("")}</div><button type="submit" data-action="calculate">重新计算</button><button type="button" data-action="reset-kv">恢复示例</button></form><div class="lab-readout" aria-live="polite" aria-atomic="true"><p>标准 GQA 的 KV cache 估算</p><output data-output="kv-total">327.68 GB</output><p data-output="kv-gib"></p><p data-output="kv-formula" class="lab-note" style="overflow-wrap:anywhere"></p><p data-output="kv-error" role="status"></p></div><p class="lab-note" id="${id}-note">公式：2 × L × N × Hkv × d × bytes × batch。2 分别代表 K 与 V；Hkv 是 KV 头数，不是 query 头数。GB 按 10⁹ 字节，GiB 按 2³⁰ 字节。</p><p class="lab-note">仅估算所有层均使用标准 GQA、缓存完整长度、K/V 维度相同的情况。不含模型权重、激活、临时工作区、服务预留与量化元数据。MLA、线性注意力及混合架构不能直接套用；量化小于 1 字节时还需另计 scale 等开销。</p>`;
  const form = host.querySelector("form");
  const totalOutput = host.querySelector('[data-output="kv-total"]');
  const gibOutput = host.querySelector('[data-output="kv-gib"]');
  const formulaOutput = host.querySelector('[data-output="kv-formula"]');
  const errorOutput = host.querySelector('[data-output="kv-error"]');
  const reset = host.querySelector('[data-action="reset-kv"]');
  setGrid(host.querySelector('[data-role="kv-fields"]'), "10rem");

  function calculate() {
    const values = {};
    const errors = [];
    KV_FIELDS.forEach((field) => {
      const input = form.elements.namedItem(field.name);
      const value = input.valueAsNumber;
      const valid = input.value.trim() !== "" && Number.isFinite(value) && value >= field.min && value <= field.max && (field.fractional || Number.isInteger(value));
      input.setAttribute("aria-invalid", String(!valid));
      if (!valid) errors.push(`${field.label}须为 ${field.min}–${field.max} 的${field.fractional ? "数值" : "整数"}`);
      values[field.name] = value;
    });
    if (errors.length) {
      totalOutput.textContent = "—";
      gibOutput.textContent = "";
      formulaOutput.textContent = "请补全有效输入后查看估算。";
      errorOutput.textContent = errors.join("；") + "。";
      host.dataset.valid = "false";
      delete host.dataset.bytes;
      return;
    }
    const bytes = 2 * values.layers * values.tokens * values.kvHeads * values.headDim * values.bytes * values.batch;
    const number = (value, digits = 2) => value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    totalOutput.textContent = `${number(bytes / 1e9)} GB`;
    gibOutput.textContent = `约 ${number(bytes / 2 ** 30)} GiB`;
    formulaOutput.textContent = `2 × ${KV_FIELDS.map((field) => values[field.name].toLocaleString("en-US", { maximumFractionDigits: 6 })).join(" × ")} = ${bytes.toLocaleString("en-US", { maximumFractionDigits: 3 })} 字节`;
    errorOutput.textContent = "";
    host.dataset.valid = "true";
    host.dataset.bytes = String(bytes);
  }
  const onSubmit = (event) => { event.preventDefault(); calculate(); };
  const onReset = () => { KV_FIELDS.forEach((field) => { form.elements.namedItem(field.name).value = String(field.value); }); calculate(); };
  form.addEventListener("input", calculate);
  form.addEventListener("submit", onSubmit);
  reset.addEventListener("click", onReset);
  calculate();
  return {
    host,
    type: "kv",
    destroy() {
      form.removeEventListener("input", calculate);
      form.removeEventListener("submit", onSubmit);
      reset.removeEventListener("click", onReset);
      mounted.delete(host);
    },
  };
}

/** Mount all matching empty hosts once; returned controllers expose destroy(). */
export function mountAttentionLabs(root = document) {
  const selector = '[data-lab="attention"], [data-lab="kv"]';
  const hosts = [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
  return hosts.map((host) => {
    if (mounted.has(host)) return mounted.get(host);
    const controller = host.dataset.lab === "kv" ? mountKV(host) : mountAttention(host);
    mounted.set(host, controller);
    return controller;
  });
}
