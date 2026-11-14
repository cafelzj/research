/* Teaching diagrams only: this module does not run or benchmark a model. */
const mounted = new WeakMap();
const SUPPORTED = new Set(["residual", "multimodal", "speculative"]);

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

function node(id, title, detail, active = false, muted = false) {
  return `<div class="lab-node${active ? " lab-active" : ""}${muted ? " lab-muted" : ""}" data-node="${escape(id)}"><strong>${escape(title)}</strong><span>${escape(detail)}</span></div>`;
}

function grid(content, columns = 3) {
  return `<div class="lab-grid" style="--structure-columns:${columns}">${content}</div>`;
}

function arrow(text = "↓") {
  return `<div class="structure-arrow">${escape(text)}</div>`;
}

function axis() {
  return `<div class="structure-axes"><span>token 轴 →</span><span class="lab-token lab-muted">前一个</span><span class="lab-token lab-active">当前 token</span><span class="lab-token lab-muted">后一个</span><small>下图固定当前 token，沿网络深度 ↓ 看信息流。</small></div>`;
}

const RESIDUAL = {
  residual: {
    title: "标准加法残差",
    note: "2、6、−1 是人为选取的同一观测方向数值；省略归一化与实际子层计算。旧信息仍在累加流中，不是每过一层就全部遗忘。",
    frames: [
      "先固定当前 token。初始表示在这个教学方向上取值为 2。",
      "第一子层产生增量 6，加入旧状态：2 + 6 = 8。",
      "第二子层产生增量 −1，继续相加：8 − 1 = 7。",
      "下一子层读取当前混合流 7；它不能像翻独立档案一样，直接只选出那份值为 6 的历史输出。",
    ],
    stage(step) {
      return axis() + grid(
        node("residual-input", "初始表示", "2", step === 0) +
        node("residual-first", "第 1 子层增量", "+6 → 当前流 8", step === 1, step < 1) +
        node("residual-second", "第 2 子层增量", "−1 → 当前流 7", step === 2, step < 2),
      ) + arrow("沿深度累加 ↓") +
        node("residual-output", "下一子层的输入", step >= 2 ? "7 = 2 + 6 − 1" : "等待前面的增量", step === 3, step < 2);
    },
  },
  attnres: {
    title: "AttnRes：选择历史深度",
    note: "这是单独的块级读取示例：2、6、−1 是三份历史状态，不是标准残差例中那条增量轨迹。权重人为指定，沿历史层/块归一化；完整模型还要处理历史状态与通信成本。",
    frames: [
      "保留当前 token 的三份历史来源：初始表示 2、块 1 输出 6、块 2 输出 −1。",
      "当前层对这些历史来源打分。教学权重指定为 0.7、0.2、0.1，总和为 1；实际权重由训练得到的查询与内容共同决定。",
      "分别计算贡献：2 × 0.7 = 1.4；6 × 0.2 = 1.2；−1 × 0.1 = −0.1。",
      "本次读取得到 1.4 + 1.2 − 0.1 = 2.5，再送给当前子层。softmax 权重非负，贡献仍可为负。",
      "选择发生在深度轴。它没有扩展前文窗口；也没有无损保留全部历史细节。Block AttnRes 用块级来源换取较低状态保存成本。",
    ],
    stage(step) {
      const values = [["初始表示", "2", "0.7", "1.4"], ["块 1 输出", "6", "0.2", "1.2"], ["块 2 输出", "−1", "0.1", "−0.1"]];
      return axis() + grid(values.map(([title, value, weight, term], i) => node(
        `attnres-source-${i}`, title,
        step === 0 ? value : step === 1 ? `${value} · 权重 ${weight}` : `${value} × ${weight} = ${term}`,
        step === 0 || step === 1 || step === 2,
      )).join("")) + arrow("沿历史层 / 块 softmax 读取 ↓") +
        node("attnres-output", "当前子层的读取值", step >= 3 ? "2.5" : "加权汇总", step >= 3, step < 3);
    },
  },
  mhc: {
    title: "mHC：约束多路残差混合",
    note: "仅演示旧流的 P 混合，省略读门、写门与 F。本例 P 在精确算术下可逆；但全为 0.5 的双随机矩阵会将 3、1 都混成 2，无法反推原流。双随机约束不承诺任意混合或完整网络无损。",
    frames: [
      "把同一个 token 的状态放在两条残差流中，教学输入为 3 和 1。它们不是两个 Agent。",
      "混合矩阵 P = [[0.75, 0.25], [0.25, 0.75]]。元素非负，每行与每列之和都是 1。",
      "混合后的流 1：0.75 × 3 + 0.25 × 1 = 2.5；流 2：0.25 × 3 + 0.75 × 1 = 1.5。",
      "两流总和仍为 4，但差异从 2 缩成 1。本例 P 在精确算术下可逆；缩小差异本身不能直接证明信息丢失。",
      "若再用同一 P 混合一次，两流变为 2.25、1.75。双随机约束也允许不可逆矩阵，因此它给出混合的稳定性约束，不给出无损保证。",
    ],
    stage(step) {
      const result = step >= 4 ? ["2.25", "1.75"] : ["2.5", "1.5"];
      return axis() + grid(node("mhc-input-1", "旧流 1", "3", step === 0) + node("mhc-input-2", "旧流 2", "1", step === 0), 2) +
        arrow() + node("mhc-matrix", "双随机混合 P", "[ 0.75  0.25 ]\n[ 0.25  0.75 ]", step === 1, step < 1) + arrow() +
        grid(node("mhc-output-1", "新流 1", step >= 2 ? result[0] : "待混合", step >= 2, step < 2) +
          node("mhc-output-2", "新流 2", step >= 2 ? result[1] : "待混合", step >= 2, step < 2), 2) +
        `<p class="structure-caption">${step >= 3 ? `总和 4 · 两流差异 ${step >= 4 ? "0.5" : "1"} · 不推出无损保证` : "行和为 1；列和为 1"}</p>`;
    },
  },
  gr: {
    title: "GR：逐通道读门与标量写回",
    note: "用两路、两个通道说明 Qwen GR 的读写，生产结构为多路。门值与子层输出都是教学假设；读门是独立 sigmoid，不要求在分支间加起来为 1。",
    frames: [
      "固定同一个 token。教学中两路已归一化状态为 R̂1 = (1, −1)、R̂2 = (−1, 1)。每条流仍有多个特征通道。",
      "按通道读取：g1 = (0.9, 0.2)、g2 = (0.3, 0.9)。两个通道的跨流门值和分别是 1.2、1.1，明确不是分支间 softmax。",
      "两路平均后，读取 x = [(0.9, −0.2) + (−0.3, 0.9)] / 2 = (0.30, 0.35)。可在不同通道读取不同来源。",
      "设子层 F(x) 的教学输出为 (2, 0)，两路标量写门为 s1 = 0.2、s2 = 1.8；分别写入 (0.4, 0) 和 (3.6, 0)。",
      "旧状态各自保留，再加写入：R′1 = (1.4, −1)，R′2 = (2.6, 1)。本示意没有显式 P 混合，但分支仍通过共同读写间接交流。",
    ],
    stage(step) {
      return axis() + grid(
        node("gr-stream-1", "流 1 · 两个通道", step >= 1 ? "R̂1 (1, −1)\ng1 (0.9, 0.2)" : "R̂1 = (1, −1)", step <= 1) +
        node("gr-stream-2", "流 2 · 两个通道", step >= 1 ? "R̂2 (−1, 1)\ng2 (0.3, 0.9)" : "R̂2 = (−1, 1)", step <= 1), 2,
      ) + arrow("独立通道门 · 两路平均 ↓") +
        node("gr-read", "子层读取", step >= 2 ? "x = (0.30, 0.35)" : "不是跨流 softmax", step === 2, step < 2) +
        (step >= 3 ? arrow("设 F(x) = (2, 0)，经标量写门 ↓") + grid(
          node("gr-write-1", step >= 4 ? "更新流 1" : "写入流 1", step >= 4 ? "(1.4, −1)" : "0.2 × (2, 0) = (0.4, 0)", true) +
          node("gr-write-2", step >= 4 ? "更新流 2" : "写入流 2", step >= 4 ? "(2.6, 1)" : "1.8 × (2, 0) = (3.6, 0)", true), 2,
        ) : "");
    },
  },
};

const MULTIMODAL_FRAMES = [
  "先看输入：图像、语音和文字是不同信号。这个示意不运行模型，也不会把图片或声音发往服务器。",
  "图像由视觉编码器提取 patch 特征；语音由音频编码器提取声学与语义特征。编码器的输出通常是向量，不是先把所有内容翻译成文字。",
  "投影器将不同模态的特征映射到骨干可处理的维度，并保留需要的空间或时间信息。early fusion 说训练何时融合；它仍然可以有视觉编码器。",
  "骨干结合多模态表示与文字进行理解、推理。统一表示不意味着像素、声波和文字共用一个原始分词器。",
  "理解路径可以输出文字或工具调用。能看图、读视频，不等于模型本体就会生成图片或视频；调用媒体工具也应另外标注。",
  "若需要语音回答，Talker接收文字及相关上下文，产生当前音频帧的首码本；小 MTP 模块补同帧残差码本。它不是文本草稿的投机验收。",
  "因果 Code2Wav 将已生成的码本逐片还原为可播放声音。流式表示不用等整段说完；首包延迟、稳态实时率和并发吞吐仍须分别测量。",
];

function multimodalStage(step) {
  return grid(
    node("modal-image", "图像 / 视频帧", "空间信号", step === 0) +
    node("modal-audio", "语音 / 声音", "时间信号", step === 0) +
    node("modal-text", "文字输入", "文本 token", step === 0),
  ) + arrow() + grid(
    node("modal-vision-encoder", "视觉编码器", "patch → 视觉特征", step === 1, step < 1) +
    node("modal-audio-encoder", "音频编码器", "声音 → 音频特征", step === 1, step < 1) +
    node("modal-embedding", "文本 embedding", "文字 → 向量", step === 1, step < 1),
  ) + arrow() + node("modal-projector", "投影 / adapter", "对齐维度；保留空间 / 时间线索", step === 2, step < 2) +
    arrow() + node("modal-backbone", "共享骨干 / Thinker", "跨模态理解与推理", step === 3, step < 3) + arrow() +
    grid(node("modal-text-output", "理解 → 文字 / 工具调用", "不自动等于原生图像或视频生成", step === 4, step < 4) +
      node("modal-talker", "语音路径 → Talker + MTP", "当前帧：首码本 + 残差码本", step === 5, step < 5) +
      node("modal-wave", "Code2Wav → 声音", "因果解码，逐片播放", step === 6, step < 6));
}

function speculativeFrames(mode) {
  return [
    "从已确认前缀 P 开始。A、B、C、D、X、E 都是教学 token；这里不运行模型，不测 TPS。",
    "小草稿模型提议 A、B、C、D。它们尚未提交给用户；草稿生成与目标验收是两件事。",
    "目标模型带因果 mask，一次计算 p(A|P)、p(B|PA)、p(C|PAB)、p(D|PABC)。并行验算不表示偷看未来答案。",
    "先从左到右验收 A。这里人为安排 A 通过；实际随机采样必须使用接受概率和拒绝校正。",
    mode === "high" ? "高接受示例中，B、C、D 也依次通过。四个草稿 token 全部保留，等待目标模型补一个 bonus token。" :
      "低接受示例中，B 首次被拒绝。C、D 依赖含错误 B 的前缀，必须一并丢弃；不能跳过 B 单独保留它们。",
    mode === "high" ? "目标模型补一个 bonus token E。本轮确认输出 ABCDE：接受草稿 4、bonus 1，共 5 个；这是计数，不是速度结论。" :
      "在 B 的位置按残差分布抽到教学纠正 token X。本轮只确认 AX：接受草稿 1、拒绝 1、丢弃后缀 2、纠正 1，共 2 个输出。",
  ];
}

function token(value, status = "pending") {
  const active = status === "accepted" || status === "bonus" || status === "corrected";
  return `<span class="lab-token${active ? " lab-active" : ""}${status === "pending" || status === "discarded" ? " lab-muted" : ""}" data-token="${value}" data-status="${status}">${value}<small>${({
    pending: "草稿", accepted: "接受", rejected: "拒绝", discarded: "丢弃", bonus: "bonus", corrected: "纠正",
  })[status]}</small></span>`;
}

function speculativeStage(step, mode) {
  const low = mode === "low";
  const statuses = ["A", "B", "C", "D"].map((value, i) => {
    let status = "pending";
    if (step >= 3 && i === 0) status = "accepted";
    if (step >= 4) status = low ? i === 0 ? "accepted" : i === 1 ? "rejected" : "discarded" : "accepted";
    return token(value, status);
  });
  const accepted = step >= 4 ? low ? 1 : 4 : step >= 3 ? 1 : 0;
  const rejected = low && step >= 4 ? 1 : 0;
  const discarded = low && step >= 4 ? 2 : 0;
  const extra = step >= 5 ? 1 : 0;
  const committed = step >= 5 ? accepted + 1 : 0;
  const output = step >= 5 ? low ? "AX" : "ABCDE" : "尚未提交本轮输出";
  return node("spec-prefix", "已确认前缀", "P", step === 0) + arrow("草稿提议 ↓") +
    `<div class="structure-token-row${step < 1 ? " lab-muted" : ""}">${statuses.join("")}${step >= 5 ? token(low ? "X" : "E", low ? "corrected" : "bonus") : ""}</div>` +
    arrow() + node("spec-target", "目标条件概率验证", "p(A|P) → p(B|PA) → p(C|PAB) → p(D|PABC)", step === 2, step < 2) +
    `<p class="structure-caption">${step < 3 ? "只验收连续前缀" : low && step >= 4 ? "A ✓ · B × · C、D 随错误前缀丢弃" : step >= 4 ? "A ✓ · B ✓ · C ✓ · D ✓" : "A ✓ · 后续待验收"}</p>` +
    node("spec-output", "本轮确认输出", output, step >= 5, step < 5) +
    `<div class="lab-grid structure-counts" style="--structure-columns:3"><span>接受草稿 <b data-count="accepted">${accepted}</b></span><span>拒绝 <b data-count="rejected">${rejected}</b></span><span>丢弃后缀 <b data-count="discarded">${discarded}</b></span><span>${low ? "纠正" : "bonus"} <b data-count="${low ? "correction" : "bonus"}">${extra}</b></span><span>确认输出 <b data-count="committed">${committed}</b></span></div>`;
}

function installGeometry(document) {
  if (document.querySelector("style[data-structure-lab-style]")) return;
  const style = document.createElement("style");
  style.dataset.structureLabStyle = "";
  style.textContent = `
    [data-structure-lab] .lab-stage{min-width:0}
    [data-structure-lab] .lab-stage .lab-grid{display:grid;grid-template-columns:repeat(var(--structure-columns,3),minmax(0,1fr));gap:10px}
    [data-structure-lab] .lab-node{min-width:0;overflow-wrap:anywhere}
    [data-structure-lab] .lab-node strong,[data-structure-lab] .lab-node span{display:block}
    [data-structure-lab] .lab-node span{white-space:pre-line}
    [data-structure-lab] .structure-arrow{text-align:center;padding:6px;color:var(--llm-muted,#627787);font-size:12px}
    [data-structure-lab] .structure-axes{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:16px;font-size:12px}
    [data-structure-lab] .structure-axes small{flex-basis:100%}
    [data-structure-lab] .structure-token-row{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
    [data-structure-lab] .lab-token small{display:block;font-size:10px}
    [data-structure-lab] .lab-token[data-status=rejected]{text-decoration:line-through;text-decoration-thickness:2px}
    [data-structure-lab] .lab-token[data-status=discarded]{text-decoration:line-through}
    [data-structure-lab] .structure-caption{font-size:12px;text-align:center;overflow-wrap:anywhere}
    [data-structure-lab] .structure-counts{margin-top:12px;font-size:12px}
    [data-structure-lab] .structure-counts b{font-variant-numeric:tabular-nums}
    [data-structure-lab] .lab-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
    [data-structure-lab] .lab-controls label{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}
    [data-structure-lab] .lab-controls select{max-width:100%}
    [data-structure-lab]:focus-visible{outline:2px solid var(--llm-accent,#246876);outline-offset:4px}
    @media(max-width:480px){[data-structure-lab] .lab-stage .lab-grid{grid-template-columns:1fr}[data-structure-lab] .structure-counts{grid-template-columns:repeat(2,minmax(0,1fr))!important}[data-structure-lab] .lab-controls label{flex-basis:100%}}
    @media(prefers-reduced-motion:reduce){[data-structure-lab] *,[data-structure-lab] *::before,[data-structure-lab] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
  `;
  (document.head || document.documentElement).append(style);
}

function mount(host) {
  if (mounted.has(host)) return;
  const kind = host.dataset.lab;
  if (!SUPPORTED.has(kind)) return;
  const document = host.ownerDocument;
  const view = document.defaultView;
  if (!view) return;
  installGeometry(document);
  const motion = view.matchMedia?.("(prefers-reduced-motion: reduce)");
  let variant = "residual";
  let acceptance = "high";
  let step = 0;
  let timer = null;
  let inView = true;
  const label = ({ residual: "层间信息流逐步示意", multimodal: "多模态结构逐步示意", speculative: "投机解码逐步示意" })[kind];
  host.classList.add("architecture-lab");
  host.dataset.structureLab = "";
  host.tabIndex = 0;
  host.setAttribute("role", "region");
  host.setAttribute("aria-label", label);
  const selection = kind === "residual" ? `<label>连接方式 <select name="residual-variant" data-action="variant">${Object.entries(RESIDUAL).map(([value, item]) => `<option value="${value}">${escape(item.title)}</option>`).join("")}</select></label>` :
    kind === "speculative" ? '<label>教学情景 <select name="acceptance" data-action="acceptance"><option value="high">高接受：全通过</option><option value="low">低接受：B 被拒绝</option></select></label>' : "";
  host.innerHTML = `<div class="lab-controls">${selection}<button type="button" name="prev" data-action="prev" aria-label="上一步">上一步</button><button type="button" name="next" data-action="next" aria-label="下一步">下一步</button><button type="button" name="play" data-action="play" aria-label="播放示意" aria-pressed="false">播放</button><span data-role="step"></span></div><div class="lab-stage" data-role="stage" aria-hidden="true"></div><p class="lab-readout" data-role="readout" role="status" aria-live="polite" aria-atomic="true"></p><p class="lab-note" data-role="note"></p><p class="lab-note" data-role="motion-note"></p>`;
  const stage = host.querySelector('[data-role="stage"]');
  const readout = host.querySelector('[data-role="readout"]');
  const counter = host.querySelector('[data-role="step"]');
  const note = host.querySelector('[data-role="note"]');
  const motionNote = host.querySelector('[data-role="motion-note"]');
  const prev = host.querySelector('[data-action="prev"]');
  const next = host.querySelector('[data-action="next"]');
  const play = host.querySelector('[data-action="play"]');
  const frames = () => kind === "residual" ? RESIDUAL[variant].frames : kind === "multimodal" ? MULTIMODAL_FRAMES : speculativeFrames(acceptance);
  const visible = () => !document.hidden && host.isConnected && inView &&
    !host.closest('[hidden],[aria-hidden="true"]') && host.getClientRects().length > 0 &&
    (() => { const r = host.getBoundingClientRect(); return r.bottom > 0 && r.top < view.innerHeight && r.width > 0 && r.height > 0; })();

  function playbackControls() {
    const playing = timer !== null;
    host.dataset.playing = String(playing);
    play.textContent = playing ? "暂停" : "播放";
    play.setAttribute("aria-label", playing ? "暂停示意" : "播放示意");
    play.setAttribute("aria-pressed", String(playing));
    play.disabled = Boolean(motion?.matches);
    motionNote.textContent = motion?.matches ? "已遵循系统“减少动态效果”偏好：自动播放停用，可用上一步 / 下一步阅读。" : "教学示意，不运行真实模型。可聚焦此区，用左右方向键步进，空格播放或暂停。";
  }

  function stop() {
    if (timer !== null) view.clearTimeout(timer);
    timer = null;
    playbackControls();
  }

  function render() {
    const items = frames();
    host.dataset.step = String(step);
    host.dataset.mode = kind === "residual" ? variant : kind === "speculative" ? acceptance : "understand-speak";
    stage.innerHTML = kind === "residual" ? RESIDUAL[variant].stage(step) : kind === "multimodal" ? multimodalStage(step) : speculativeStage(step, acceptance);
    readout.textContent = items[step];
    counter.textContent = `步骤 ${step + 1} / ${items.length}`;
    prev.disabled = step === 0;
    next.disabled = step === items.length - 1;
    note.textContent = kind === "residual" ? RESIDUAL[variant].note : kind === "multimodal" ?
      "这是结构路径教学，不代表每个模型都使用完全相同模块。理解、语音生成、图像 / 视频生成要分别核对；early fusion 也可以保留 vision encoder。" :
      "“无损”指在正确拒绝采样、真实条件概率、相同目标采样规则与非预见性调度等前提下保持目标分布；不是答案必然正确，也不是用同一个随机种子逐字相同。";
    playbackControls();
  }

  function move(value) {
    stop();
    step = Math.max(0, Math.min(frames().length - 1, value));
    render();
  }

  function tick() {
    if (!visible() || motion?.matches) { stop(); return; }
    if (step >= frames().length - 1) { stop(); return; }
    step += 1;
    render();
    if (step >= frames().length - 1) stop();
    else timer = view.setTimeout(tick, 2200);
  }

  function togglePlay() {
    if (timer !== null) { stop(); return; }
    if (motion?.matches || !visible()) { stop(); return; }
    if (step >= frames().length - 1) step = 0;
    timer = view.setTimeout(tick, 2200);
    render();
  }

  prev.addEventListener("click", () => move(step - 1));
  next.addEventListener("click", () => move(step + 1));
  play.addEventListener("click", togglePlay);
  host.querySelector('[data-action="variant"]')?.addEventListener("change", (event) => {
    if (!Object.hasOwn(RESIDUAL, event.target.value)) return;
    variant = event.target.value;
    move(0);
  });
  host.querySelector('[data-action="acceptance"]')?.addEventListener("change", (event) => {
    if (!["high", "low"].includes(event.target.value)) return;
    acceptance = event.target.value;
    move(0);
  });
  host.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
      event.target.closest("select,input,textarea,[contenteditable=true]")) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); move(step - 1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); move(step + 1); }
    else if (event.key === "Home") { event.preventDefault(); move(0); }
    else if (event.key === "End") { event.preventDefault(); move(frames().length - 1); }
    else if ((event.key === " " || event.key === "Spacebar") && event.target === host) { event.preventDefault(); togglePlay(); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  view.addEventListener("pagehide", stop);
  const motionChanged = () => { stop(); render(); };
  if (motion?.addEventListener) motion.addEventListener("change", motionChanged);
  else motion?.addListener?.(motionChanged);
  if (view.IntersectionObserver) {
    const observer = new view.IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      if (!inView) stop();
    }, { threshold: 0.01 });
    observer.observe(host);
  }
  // Also stop immediately when the parent reader switches tabs or hides a lab.
  const observer = new view.MutationObserver(() => { if (timer !== null && !visible()) stop(); });
  observer.observe(document.body || document.documentElement, { attributes: true, subtree: true, attributeFilter: ["hidden", "aria-hidden", "class", "style", "open"] });
  view.addEventListener("scroll", () => { if (timer !== null && !visible()) stop(); }, { passive: true });
  view.addEventListener("resize", () => { if (timer !== null && !visible()) stop(); }, { passive: true });
  mounted.set(host, { stop });
  render();
}

/** Populate empty teaching hosts; calling again does not reset existing labs. */
export function mountStructureLabs(root = document) {
  const hosts = [...root.querySelectorAll('[data-lab="residual"],[data-lab="multimodal"],[data-lab="speculative"]')];
  if (root.matches?.('[data-lab="residual"],[data-lab="multimodal"],[data-lab="speculative"]')) hosts.unshift(root);
  hosts.forEach(mount);
}
