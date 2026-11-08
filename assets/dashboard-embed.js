"use strict";
(() => {
  const embedded = new URLSearchParams(location.search).get("embed") === "1";
  if (!embedded) return;
  document.documentElement.classList.add("dashboard-embedded");

  function init() {
    const main = document.querySelector("main");
    if (!main) return;
    const hasParent = window.parent !== window;
    let frame = null;
    let lastHeight = 0;

    function send(message) {
      if (hasParent) window.parent.postMessage(message, location.origin);
    }

    function reportSize() {
      frame = null;
      // The main element can shrink after switching industries or collapsing a
      // demonstration. document.scrollHeight would retain the iframe's height.
      const height = Math.max(
        1,
        Math.ceil(main.getBoundingClientRect().bottom + window.scrollY),
      );
      if (Math.abs(height - lastHeight) > 2) {
        lastHeight = height;
        send({ type: "industry-dashboard-size", height });
      }
    }

    function scheduleSize() {
      if (frame === null) frame = requestAnimationFrame(reportSize);
    }

    function prepareLinks() {
      main.querySelectorAll("a[href]").forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || link.target === "_blank" || link.hasAttribute("download")) return;
        try {
          if (new URL(href, location.href).origin === location.origin)
            link.target = "_top";
        } catch (_) {
          // Preserve an unrecognized source link instead of changing its URL.
        }
      });
    }

    function reportScroll(hash = location.hash) {
      let target;
      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch (_) {
        return;
      }
      if (!target && hash && hash !== "#") return;
      const top = target
        ? Math.max(0, target.getBoundingClientRect().top + window.scrollY)
        : 0;
      send({ type: "industry-dashboard-scroll", top });
    }

    function pausePlayback() {
      const play = document.getElementById("play");
      // The copied dashboard defines timer as a global lexical binding and stop
      // as a function; neither needs to be exposed by this adapter.
      if (typeof timer !== "undefined" && timer !== null && typeof stop === "function") {
        stop();
      } else if (play && /暂停播放/.test(play.textContent)) {
        play.click();
      }
    }

    window.addEventListener("message", (event) => {
      if (!hasParent || event.source !== window.parent || event.origin !== location.origin) return;
      if (event.data && event.data.type === "industry-dashboard-pause")
        pausePlayback();
      if (event.data && event.data.type === "industry-dashboard-resize") {
        window.dispatchEvent(new Event("resize"));
        scheduleSize();
      }
    });
    window.addEventListener("pagehide", pausePlayback);
    window.addEventListener("resize", scheduleSize);
    window.addEventListener("load", scheduleSize);
    window.addEventListener("hashchange", () => {
      requestAnimationFrame(() => reportScroll());
    });
    main.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        // Also forward repeated clicks on the current fragment: those do not
        // emit hashchange but should still bring the section into view.
        requestAnimationFrame(() => reportScroll(href));
      }
    });
    document.addEventListener("industry:change", () => {
      prepareLinks();
      scheduleSize();
    });

    if (typeof ResizeObserver === "function") {
      new ResizeObserver(scheduleSize).observe(main);
    }
    new MutationObserver(() => {
      prepareLinks();
      scheduleSize();
    }).observe(main, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "open", "class", "style", "aria-expanded"],
    });

    prepareLinks();
    scheduleSize();
    requestAnimationFrame(() => {
      scheduleSize();
      if (location.hash) reportScroll();
    });
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(scheduleSize);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
