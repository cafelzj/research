"use strict";
(() => {
  const media = window.matchMedia("(max-width: 900px)");
  if (!document.querySelector("[data-outline]")) return;
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "page-outline-trigger";
  trigger.setAttribute("aria-controls", "pageOutline");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = '<span aria-hidden="true">☰</span> 大纲 <small></small>';
  const panel = document.createElement("dialog");
  panel.id = "pageOutline";
  panel.className = "page-outline";
  panel.setAttribute("aria-labelledby", "pageOutlineTitle");
  panel.innerHTML =
    '<div class="page-outline-heading"><h2 id="pageOutlineTitle">本页大纲</h2><button type="button" data-outline-close aria-label="关闭本页大纲">关闭 ×</button></div><p class="page-outline-intro">选择章节跳转，跳转后自动收起。</p><ol class="page-outline-list"></ol><div class="page-outline-footer"><button type="button" class="page-outline-top">回到页首 ↑</button></div>';
  const shade = document.createElement("div");
  shade.className = "page-outline-shade";
  shade.hidden = true;
  document.body.append(trigger, shade, panel);
  const list = panel.querySelector("ol"),
    native = typeof panel.showModal === "function";
  let entries = [],
    current = 0,
    previousOverflow = "",
    frame = null,
    isOpen = false;
  function available(node) {
    for (let parent = node; parent; parent = parent.parentElement) {
      if (parent.hidden || getComputedStyle(parent).display === "none")
        return false;
    }
    return true;
  }
  function sections() {
    return Array.from(document.querySelectorAll("[data-outline]")).filter(
      (node) => node.id && available(node),
    );
  }
  function update() {
    const nodes = sections();
    let index = 0;
    nodes.forEach((node, i) => {
      const rect = node.getBoundingClientRect();
      if (rect.height && rect.top <= window.innerHeight * 0.3) index = i;
    });
    current = index;
    trigger.querySelector("small").textContent =
      (nodes.length ? index + 1 : 0) + "/" + nodes.length;
    trigger.setAttribute(
      "aria-label",
      "打开本页大纲" +
        (nodes[index] ? "，当前位置：" + nodes[index].dataset.outline : ""),
    );
    if (isOpen)
      list.querySelectorAll("a").forEach((link) => {
        const active = link.dataset.target === nodes[index]?.id;
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
  }
  function close(restoreFocus = true) {
    if (!isOpen) return;
    isOpen = false;
    if (native) panel.close();
    else panel.removeAttribute("open");
    shade.hidden = true;
    panel.removeAttribute("aria-modal");
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = previousOverflow;
    if (restoreFocus && media.matches) trigger.focus({ preventScroll: true });
  }
  function reveal(target) {
    for (let parent = target; parent; parent = parent.parentElement)
      if (parent.tagName === "DETAILS") parent.open = true;
  }
  function jump(target) {
    close(false);
    reveal(target);
    history.replaceState(null, "", "#" + encodeURIComponent(target.id));
    target.classList.add("page-outline-target");
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    const existing = target.hasAttribute("tabindex");
    if (!existing) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (!existing)
      target.addEventListener(
        "blur",
        () => target.removeAttribute("tabindex"),
        { once: true },
      );
    schedule();
  }
  function open() {
    if (!media.matches || isOpen) return;
    entries = sections();
    list.replaceChildren();
    entries.forEach((node, index) => {
      const item = document.createElement("li"),
        link = document.createElement("a"),
        number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      link.href = "#" + encodeURIComponent(node.id);
      link.dataset.target = node.id;
      link.append(number, document.createTextNode(node.dataset.outline));
      link.onclick = (event) => {
        event.preventDefault();
        jump(node);
      };
      item.append(link);
      list.append(item);
    });
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    isOpen = true;
    trigger.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-modal", "true");
    if (native) panel.showModal();
    else {
      shade.hidden = false;
      panel.setAttribute("open", "");
    }
    update();
    const active =
      list.querySelector("[aria-current=location]") || list.querySelector("a");
    if (active) {
      active.focus({ preventScroll: true });
      active.scrollIntoView({ block: "nearest" });
    } else panel.querySelector("[data-outline-close]").focus();
  }
  function schedule() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      update();
    });
  }
  trigger.onclick = open;
  panel.querySelector("[data-outline-close]").onclick = () => close();
  shade.onclick = () => close();
  panel.querySelector(".page-outline-top").onclick = () => {
    close();
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    schedule();
  };
  panel.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  panel.addEventListener("click", (event) => {
    const rect = panel.getBoundingClientRect();
    if (
      event.target === panel &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      close();
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      const controls = Array.from(
        panel.querySelectorAll("button,a[href]"),
      ).filter((node) => node.getClientRects().length);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  const onMedia = () => {
    if (!media.matches) close(false);
    schedule();
  };
  if (media.addEventListener) media.addEventListener("change", onMedia);
  else media.addListener(onMedia);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("hashchange", schedule);
  update();
})();
