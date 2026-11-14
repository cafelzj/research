/* Deterministic teaching diagrams. No model calls, network requests, or timing claims. */

const mounted = new WeakMap();

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));

const formatNumber = (value) => new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
}).format(value);

const scalar = (value) => Math.abs(value) < 0.00001 ? "0.00" : value.toFixed(2);
const vector = (values) => `[${values.map(scalar).join(", ")}]`;

function stepsMarkup(steps, current) {
  return `<ol class="lab-grid" aria-label="计算步骤">${steps.map((step, index) =>
    `<li class="lab-node ${index === current ? "lab-active" : "lab-muted"}" data-stage="${escapeHTML(step.key)}"${index === current ? ' aria-current="step"' : ""}>
      <span class="lab-token">${index + 1}</span>
      <strong>${escapeHTML(step.title)}</strong>
      <span>${escapeHTML(step.caption)}</span>
    </li>`).join("")}</ol>`;
}

const cedSteps = [
  { key: "input", title: "准备已知输入", caption: "prompt 全部已知；保持因果顺序" },
  { key: "encoder", title: "输入经过 20E", caption: "长输入的大部分计算停在 encoder" },
  { key: "global-kv", title: "建立 global KV", caption: "从 encoder 最终状态投影，再跨层共享" },
  { key: "decoder-tail", title: "尾部经过 20D", caption: "初始化各 decoder 层自己的 local SWA" },
  { key: "new-token", title: "新 token 经过 20E + 20D", caption: "输出仍按自回归顺序逐步生成" },
  { key: "reuse", title: "复用旧缓存，追加新状态", caption: "没有逐 token 重跑整段旧输入" },
];

const moeSteps = [
  { key: "input", title: "输入当前 token 表示", caption: "专家是可学习的 FFN 模块" },
  { key: "router", title: "router 打分", caption: "8 个路由专家中选得分最高的 2 个" },
  { key: "dispatch", title: "dispatch 分发", caption: "输入发往 2 个路由专家与 1 个共享专家" },
  { key: "experts", title: "所选模块执行", caption: "未选模块当步不参与这次 FFN 计算" },
  { key: "combine", title: "加权合并", caption: "路由输出归一化加权，再加共享输出" },
];

const engramSteps = [
  { key: "tokens", title: "已知 token 片段", caption: "索引来自当前已知 token，不依赖未来输出" },
  { key: "hash", title: "计算 hash 索引", caption: "离散片段确定查表地址" },
  { key: "lookup", title: "主存查表 / 预取", caption: "查回训练得到的向量，不是答案" },
  { key: "gate", title: "结合上下文门控", caption: "相同片段，在不同上下文中贡献可不同" },
  { key: "fuse", title: "融合进隐藏表示", caption: "后续 Transformer 继续推理与生成" },
];

const definitions = {
  ced: {
    title: "CED 输入与输出路径教学",
    steps: cedSteps,
    cases: [
      { id: "long", label: "长输入：32,768 token", count: 32768 },
      { id: "short", label: "短输入：64 token", count: 64 },
    ],
    note: "DeepSeek V4.1 架构教学示意；E 是因果 encoder，非双向 encoder。尾部 bounded replay 是近似状态重建，不是全输入零 decoder 计算。本图不模拟真实速度或显存。",
    describe(item, step) {
      const count = formatNumber(item.count);
      const tail = Math.min(item.count, 128);
      return [
        `${count} 个已知输入 token 准备送入模型。图中的 token 标记只代表位置组，不对应实际分词。`,
        `${count} 个输入位置经过下半部 20 层 causal encoder。8B prefill 是长输入主干路径的激活参数口径，不是模型只需存 8B 权重。`,
        "从 encoder 最终状态生成 decoder 第一个 Full 层的 global KV；其余 decoder 层复用这组 KV。各层仍计算自己的 query 与 local SWA，不能把 KV 共享理解为复制层输出。",
        `本情景最后 ${tail} 个输入位置的 encoder 输出仍经过 20 层 decoder，初始化各层 local SWA，并取得首个输出所需的末位置状态。128 token 有界重放接受近似，不能保证与完整 decoder forward 数学等价。`,
        "新生成 token 再经过 20E + 20D，并为新位置追加缓存。16B decode 是完整主干每 token 的激活口径；旧 prompt 的 encoder 不会因此从头再跑一次。",
        item.count > 128
          ? "长输入主要省去上半部 decoder 对绝大多数旧输入位置的重复工作。缓存复用、尾部重放、索引、通信和模型权重仍有开销，不能由半层路径推导实际时延减半。"
          : "短输入只有 64 token，全部落入尾部窗口；上半部 decoder 仍处理这些位置。因此不能把长输入的近半主干计算优势机械套到短输入。",
      ][step];
    },
    render(item, step) {
      const tail = Math.min(item.count, 128);
      const ratio = (item.count * 20 + tail * 20) / (item.count * 40);
      return `${stepsMarkup(cedSteps, step)}
        <div class="lab-grid" aria-label="当前情景的计算口径">
          <div class="lab-node"><strong>输入位置</strong><span class="lab-token">${formatNumber(item.count)}</span><span>教学情景</span></div>
          <div class="lab-node ${step >= 3 ? "lab-active" : "lab-muted"}"><strong>decoder 尾部位置</strong><span class="lab-token">${tail}</span><span>窗口上限 128</span></div>
          <div class="lab-node ${step >= 5 ? "lab-active" : "lab-muted"}"><strong>token × 层工作量近似比</strong><span class="lab-token">${(ratio * 100).toFixed(1)}%</span><span>相对全部输入过 40 层</span></div>
        </div>
        <p class="lab-note">近似算式：[N × 20 + min(N, 128) × 20] ÷ [N × 40]。只计主干位置与层数，不是 FLOPs、延迟或价格的实测比例；缓存边界恢复也可能增加工作。</p>`;
    },
  },
  moe: {
    title: "MoE 路由与合并教学",
    steps: moeSteps,
    cases: [
      { id: "a", label: "token 表示 A：选 R2、R5", scores: [0.08, 0.32, 0.04, 0.14, 0.18, 0.07, 0.11, 0.06] },
      { id: "b", label: "token 表示 B：选 R3、R8", scores: [0.05, 0.10, 0.27, 0.09, 0.03, 0.12, 0.08, 0.26] },
    ],
    note: "教学参数为 8 个路由专家选 2 个，外加 1 个共享专家；不对应 Kimi K3 或其他具体模型配置。专家是神经网络模块，不代表人类职业。图示不是速度或负载模拟。",
    describe(item, step) {
      const chosen = selectedExperts(item.scores);
      const names = chosen.map((index) => `R${index + 1}`).join("、");
      const total = chosen.reduce((sum, index) => sum + item.scores[index], 0);
      return [
        "同一个 token 的隐藏表示 x 送给 router。此处没有预设某个专家负责数学或写作，模块行为由训练和路由共同形成。",
        `确定的教学分数选中 ${names}。这些分数仅演示 Top-2 选择，不是任务成功概率或真实模型测量。共享专家 S 不参与这次 Top-2 排名。`,
        `把 x 分发给 ${names} 和共享专家 S。实际多卡实现还要处理通信、批量打包与负载均衡；本图只展示数据依赖。`,
        `本 token 执行 2 个路由 FFN 及共享 FFN。未选的 6 个路由模块不执行这次计算，但权重仍需在 GPU 或可访问的主存等存储中存在，不能推断总显存按 2/8 缩减。`,
        `所选路由分数之和为 ${scalar(total)}，先在两者内归一化，再加共享输出。下方只取输出向量的 1 个维度做算术教学，不是模型回答。`,
      ][step];
    },
    render(item, step) {
      const chosen = selectedExperts(item.scores);
      const denominator = chosen.reduce((sum, index) => sum + item.scores[index], 0);
      const weights = chosen.map((index) => item.scores[index] / denominator);
      const outputs = [1.2, -0.4, 0.8, 1.5, -0.9, 0.3, 0.6, -1.1];
      const sum = 0.25 + chosen.reduce((result, index, position) => result + weights[position] * outputs[index], 0);
      const cards = item.scores.map((score, index) => {
        const selected = chosen.includes(index) && step >= 1;
        return `<div class="lab-node ${selected ? "lab-active" : "lab-muted"}" data-expert="R${index + 1}" data-selected="${selected}">
          <strong>R${index + 1}</strong><span class="lab-token">${step >= 1 ? `分数 ${scalar(score)}` : "等待路由"}</span>
          <span>${step >= 2 && selected ? "接收 x" : step >= 2 ? "本 token 未选" : "路由 FFN"}</span>
          ${step >= 3 && selected ? `<span>输出单维：${scalar(outputs[index])}</span>` : ""}
        </div>`;
      }).join("");
      return `${stepsMarkup(moeSteps, step)}
        <div class="lab-grid" aria-label="8 个路由专家与 1 个共享专家">${cards}
          <div class="lab-node ${step >= 2 ? "lab-active" : "lab-muted"}" data-expert="S"><strong>S · 共享 FFN</strong><span>${step >= 2 ? "始终接收 x" : "不参与 Top-2 排名"}</span>${step >= 3 ? '<span>输出单维：0.25</span>' : ""}</div>
        </div>
        <p class="lab-note">${step >= 4
          ? `归一化权重：${chosen.map((index, position) => `R${index + 1} = ${scalar(weights[position])}`).join("，")}。单维合并：0.25 + ${scalar(weights[0])} × (${scalar(outputs[chosen[0]])}) + ${scalar(weights[1])} × (${scalar(outputs[chosen[1]])}) ≈ ${scalar(sum)}。计算使用未四舍五入权重。`
          : "共享分支与路由分支分别计算，最后才合并；少激活模块不等于所有权重都消失。"}</p>`;
    },
  },
  engram: {
    title: "Engram 条件记忆教学",
    steps: engramSteps,
    cases: [
      { id: "strong", label: "相同片段，上下文 A：门控较强", context: "上下文 A", gate: 0.8 },
      { id: "weak", label: "相同片段，上下文 B：门控较弱", context: "上下文 B", gate: 0.2 },
    ],
    note: "单头、2-gram、3 维向量的教学示意，非真实分词、真实表项或模型性能。实际机制可用多头、多阶 hash 与可学习门控；主存预取是部署示意，表所在内存层级依实现而定。不是 RAG，也不是会话记忆。",
    describe(item, step) {
      const lookup = [0.6, -0.2, 0.4];
      const hidden = [0.2, 0.5, -0.1];
      const fused = hidden.map((value, index) => value + item.gate * lookup[index]);
      return [
        "已知片段示意为 New / York，教学 token ID 为 17 / 29。切换上下文不会改变这两个 ID；这些 ID 不对应已发布模型的真实 tokenizer。",
        "以教学 hash：(17 × 31 + 29) mod 97 = 71，确定查表槽。索引可提前计算和预取；实际多头哈希还需面对碰撞等问题。",
        `从表槽 71 读回向量 v = ${vector(lookup)}。这是训练得到的表示，不是外部网页、数据库文档或一句现成答案；两个情景查回同一向量。`,
        `${item.context} 的教学门控 g = ${scalar(item.gate)}。门控利用当前隐藏表示判断贡献强弱，图中 g 是固定示例值，并未执行真实模型。`,
        `简化融合 h + g × v = ${vector(fused)}，再交给后续网络。改变上下文会改变融合贡献；查表本身不等于推理结束或答案生成。`,
      ][step];
    },
    render(item, step) {
      const lookup = [0.6, -0.2, 0.4];
      const hidden = [0.2, 0.5, -0.1];
      const contribution = lookup.map((value) => item.gate * value);
      const fused = hidden.map((value, index) => value + contribution[index]);
      return `${stepsMarkup(engramSteps, step)}
        <div class="lab-grid" aria-label="查表与融合示例">
          <div class="lab-node ${step <= 1 ? "lab-active" : "lab-muted"}"><strong>已知 token</strong><span class="lab-token">New · 17</span><span class="lab-token">York · 29</span></div>
          <div class="lab-node ${step >= 2 ? "lab-active" : "lab-muted"}"><strong>相同表槽 71</strong><span>${step >= 2 ? vector(lookup) : "等待查表"}</span></div>
          <div class="lab-node ${step >= 3 ? "lab-active" : "lab-muted"}"><strong>${escapeHTML(item.context)} 的门控</strong><span class="lab-token">${step >= 3 ? `g = ${scalar(item.gate)}` : "等待上下文门控"}</span></div>
          <div class="lab-node ${step >= 4 ? "lab-active" : "lab-muted"}"><strong>融合后的隐藏表示</strong><span>${step >= 4 ? vector(fused) : "尚未融合"}</span></div>
        </div>
        <p class="lab-note">${step >= 4
          ? `h = ${vector(hidden)}；g × v = ${vector(contribution)}。真实实现还包含投影、归一化等，本例仅展示条件记忆如何作为一条贡献融入网络。`
          : "模型参数中的静态表项与当前上下文的动态门控配合；不会自动保存用户对话，也不从公网检索资料。"}</p>`;
    },
  },
};

function selectedExperts(scores) {
  return scores.map((score, index) => ({ score, index }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 2).map((entry) => entry.index);
}

function mountLab(host, kind) {
  if (mounted.has(host)) return mounted.get(host);
  const definition = definitions[kind];
  const document = host.ownerDocument;
  const window = document.defaultView;
  if (!window) return () => {};
  const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let current = 0;
  let selectedCase = 0;
  let playing = false;
  let timer = null;
  let disposed = false;
  let intersects = true;

  host.classList.add("architecture-lab");
  host.dataset.labReady = "true";
  if (!host.hasAttribute("role")) host.setAttribute("role", "region");
  if (!host.hasAttribute("aria-label") && !host.hasAttribute("aria-labelledby")) {
    host.setAttribute("aria-label", definition.title);
  }
  host.innerHTML = `<div class="lab-controls">
    <label>教学情景<select name="${kind}-case" data-action="case">${definition.cases.map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.label)}</option>`).join("")}</select></label>
    <button type="button" data-action="prev">上一步</button>
    <button type="button" data-action="play" aria-pressed="false">播放</button>
    <button type="button" data-action="next">下一步</button>
    <button type="button" data-action="reset">重置</button>
    <span class="lab-token" data-step-count></span>
  </div>
  <div class="lab-stage" role="group" tabindex="0" aria-label="教学计算图，可用左右方向键逐步查看" aria-keyshortcuts="ArrowLeft ArrowRight Home End"></div>
  <p class="lab-readout" role="status" aria-live="polite" aria-atomic="true"></p>
  <p class="lab-note">${escapeHTML(definition.note)}</p>
  <p class="lab-note" data-motion-note hidden>系统已启用减弱动态效果，自动播放已停用；可用上一步、下一步或方向键逐步查看。</p>`;

  const stage = host.querySelector(".lab-stage");
  const readout = host.querySelector(".lab-readout");
  const playButton = host.querySelector('[data-action="play"]');
  const previousButton = host.querySelector('[data-action="prev"]');
  const nextButton = host.querySelector('[data-action="next"]');
  const caseSelect = host.querySelector('[data-action="case"]');
  const total = definition.steps.length;

  function isVisible() {
    if (disposed || !host.isConnected || document.hidden || !intersects) return false;
    if (host.closest('[hidden], [inert], [aria-hidden="true"]') || !host.getClientRects().length) return false;
    const rectangle = host.getBoundingClientRect();
    return rectangle.bottom > 0 && rectangle.right > 0
      && rectangle.top < window.innerHeight && rectangle.left < window.innerWidth;
  }

  function updateReadout(message = "") {
    const item = definition.cases[selectedCase];
    readout.textContent = `第 ${current + 1} / ${total} 步 · ${definition.steps[current].title}。${definition.describe(item, current)}${message ? ` ${message}` : ""}`;
  }

  function syncControls() {
    previousButton.disabled = current === 0;
    nextButton.disabled = current === total - 1;
    playButton.disabled = Boolean(motion?.matches);
    playButton.textContent = playing ? "暂停" : current === total - 1 ? "重新播放" : "播放";
    playButton.setAttribute("aria-pressed", String(playing));
    host.querySelector("[data-motion-note]").hidden = !motion?.matches;
    host.querySelector("[data-step-count]").textContent = `${current + 1} / ${total}`;
    host.dataset.step = String(current + 1);
    host.dataset.playing = String(playing);
    host.dataset.case = definition.cases[selectedCase].id;
  }

  function render(message = "") {
    stage.innerHTML = definition.render(definition.cases[selectedCase], current);
    syncControls();
    updateReadout(message);
  }

  function pause(message = "") {
    const wasPlaying = playing;
    playing = false;
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    syncControls();
    if (wasPlaying && message) updateReadout(message);
  }

  function schedule() {
    timer = window.setTimeout(() => {
      timer = null;
      if (!playing || !isVisible() || motion?.matches) {
        pause("教学图不可见或动态效果设置改变，已暂停。");
        return;
      }
      current = Math.min(current + 1, total - 1);
      if (current === total - 1) {
        playing = false;
        render("播放结束，可返回任一步复看。");
      } else {
        render();
        schedule();
      }
    }, 2400);
  }

  function moveTo(step) {
    pause();
    current = Math.max(0, Math.min(total - 1, step));
    render();
  }

  function onClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button || !host.contains(button) || button.disabled) return;
    switch (button.dataset.action) {
      case "prev": moveTo(current - 1); break;
      case "next": moveTo(current + 1); break;
      case "reset": moveTo(0); break;
      case "play":
        if (playing) {
          pause("已暂停，可手动逐步查看。");
        } else if (!motion?.matches && isVisible()) {
          if (current === total - 1) current = 0;
          playing = true;
          render("自动播放中，可随时暂停。");
          schedule();
        }
        break;
      default: break;
    }
  }

  function onChange(event) {
    if (event.target !== caseSelect) return;
    pause();
    selectedCase = Math.max(0, definition.cases.findIndex((item) => item.id === caseSelect.value));
    current = 0;
    render("已切换教学情景。");
  }

  function onKeydown(event) {
    if (event.target !== stage || event.altKey || event.ctrlKey || event.metaKey) return;
    const destination = {
      ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: total - 1,
    }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    moveTo(destination);
  }

  function onVisibilityChange() {
    if (playing && !isVisible()) pause("教学图离开可见区域，已暂停。");
  }

  function onMotionChange() {
    if (motion?.matches) pause("已启用减弱动态效果，请手动逐步查看。");
    syncControls();
  }

  function onPageHide() {
    pause("页面切换，已暂停。");
  }

  host.addEventListener("click", onClick);
  host.addEventListener("change", onChange);
  stage.addEventListener("keydown", onKeydown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("scroll", onVisibilityChange, { capture: true, passive: true });
  window.addEventListener("resize", onVisibilityChange, { passive: true });
  if (motion?.addEventListener) motion.addEventListener("change", onMotionChange);
  else motion?.addListener?.(onMotionChange);

  const intersectionObserver = window.IntersectionObserver ? new window.IntersectionObserver((entries) => {
    intersects = entries[0]?.isIntersecting ?? false;
    onVisibilityChange();
  }, { threshold: 0 }) : null;
  intersectionObserver?.observe(host);

  // Watch the host and its ancestors, rather than mutations in every diagram node.
  const visibilityObserver = window.MutationObserver ? new window.MutationObserver(onVisibilityChange) : null;
  for (let ancestor = host; ancestor; ancestor = ancestor.parentElement) {
    visibilityObserver?.observe(ancestor, {
      attributes: true, attributeFilter: ["hidden", "inert", "class", "style", "aria-hidden"],
    });
  }

  render();

  const cleanup = () => {
    if (disposed) return;
    pause();
    disposed = true;
    intersectionObserver?.disconnect();
    visibilityObserver?.disconnect();
    host.removeEventListener("click", onClick);
    host.removeEventListener("change", onChange);
    stage.removeEventListener("keydown", onKeydown);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("scroll", onVisibilityChange, true);
    window.removeEventListener("resize", onVisibilityChange);
    if (motion?.removeEventListener) motion.removeEventListener("change", onMotionChange);
    else motion?.removeListener?.(onMotionChange);
    mounted.delete(host);
    host.removeAttribute("data-lab-ready");
    host.replaceChildren();
  };
  mounted.set(host, cleanup);
  return cleanup;
}

/** Mount the three compute diagrams. Safe to call repeatedly; returns an unmount function. */
export function mountComputeLabs(root = document) {
  const selector = '[data-lab="ced"], [data-lab="moe"], [data-lab="engram"]';
  const hosts = [...(root.querySelectorAll?.(selector) ?? [])];
  if (root.matches?.(selector)) hosts.unshift(root);
  const cleanups = [...new Set(hosts)].map((host) => mountLab(host, host.dataset.lab));
  return () => cleanups.forEach((cleanup) => cleanup());
}
