"use strict";
(() => {
  const query = document.getElementById("glossaryQuery"),
    category = document.getElementById("glossaryCategory");
  const cards = Array.from(document.querySelectorAll(".glossary-card"));
  const normalize = (text) =>
    text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  const texts = cards.map((card) => normalize(card.textContent));
  function filter() {
    const words = normalize(query.value).split(" ").filter(Boolean);
    let count = 0;
    cards.forEach((card, i) => {
      card.hidden =
        (!!category.value && card.dataset.category !== category.value) ||
        !words.every((word) => texts[i].includes(word));
      if (!card.hidden) count++;
    });
    document.getElementById("glossaryCount").textContent =
      "显示 " +
      count +
      " / " +
      cards.length +
      " 个术语" +
      (category.value ? " · " + category.value : "");
    document.getElementById("glossaryEmpty").hidden = count !== 0;
    const needle = normalize(query.value);
    const ranked = cards
      .map((card, index) => {
        const names = card
          .querySelector("h3")
          .textContent.split(/[·/]/)
          .map(normalize);
        const rank = !needle
          ? 2
          : names.includes(needle)
            ? 0
            : names.some((name) => name.startsWith(needle))
              ? 1
              : 2;
        return { card, index, rank };
      })
      .sort((a, b) => a.rank - b.rank || a.index - b.index);
    ranked.forEach(({ card }) =>
      document.getElementById("glossaryCards").append(card),
    );
  }
  query.addEventListener("input", filter);
  category.addEventListener("change", filter);
  document.getElementById("glossaryClear").onclick = () => {
    query.value = "";
    category.value = "";
    filter();
    query.focus();
  };
  document.querySelectorAll("[data-glossary-query]").forEach(
    (button) =>
      (button.onclick = () => {
        query.value = button.dataset.glossaryQuery;
        category.value = "";
        filter();
        query.focus();
      }),
  );
  document.querySelectorAll("[data-chain-target]").forEach((link) =>
    link.addEventListener("click", () => {
      if (typeof chain === "function") chain(+link.dataset.chainTarget);
    }),
  );
  const globalSearch = document.getElementById("search"),
    jump = document.getElementById("glossarySearchLink");
  globalSearch.addEventListener("input", () => {
    const words = normalize(globalSearch.value).split(" ").filter(Boolean),
      count = words.length
        ? texts.filter((text) => words.every((word) => text.includes(word)))
            .length
        : 0;
    jump.hidden = !words.length;
    jump.textContent = "术语表匹配 " + count + " 条 →";
  });
  jump.addEventListener("click", () => {
    query.value = globalSearch.value;
    category.value = "";
    filter();
  });
  function revealHash() {
    const id = location.hash.slice(1);
    if (!id.startsWith("term-")) return;
    const card = cards.find((card) => card.id === id);
    if (card) {
      query.value = "";
      category.value = "";
      filter();
      card.querySelector("details").open = true;
      card.scrollIntoView({ block: "center" });
    }
  }
  window.addEventListener("hashchange", revealHash);
  revealHash();
})();
