import { mountAttentionLabs } from './attention-lab.js';
import { mountComputeLabs } from './compute-lab.js';
import { mountStructureLabs } from './structure-lab.js';

const navigation = document.querySelector('.llm-navigation');
const narrow = matchMedia('(max-width: 900px)');
function navigationMode() { if (navigation) navigation.open = !narrow.matches; }
navigationMode();
narrow.addEventListener('change', navigationMode);

mountAttentionLabs(document);
mountComputeLabs(document);
mountStructureLabs(document);

function math() {
  if (typeof window.renderMathInElement !== 'function') return;
  window.renderMathInElement(document.querySelector('.research-article'), {
    delimiters: [
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$$', right: '$$', display: true },
    ],
    ignoredClasses: ['architecture-lab', 'code-block', 'katex'],
    throwOnError: false,
    trust: false,
    strict: 'warn',
  });
}
math();
if (document.readyState !== 'complete') window.addEventListener('load', math, { once: true });

function normalized(value) { return value.trim().toLocaleLowerCase(); }
function filtering(kind) {
  const timeline = kind === 'timeline';
  const query = document.getElementById(timeline ? 'timeline-query' : 'term-query');
  if (!query) return null;
  const category = document.getElementById(timeline ? 'timeline-vendor' : 'term-category');
  const type = timeline ? document.getElementById('timeline-type') : null;
  const items = [...document.querySelectorAll(timeline ? '[data-timeline-event]' : '[data-term]')];
  const count = document.getElementById(timeline ? 'timeline-count' : 'term-count');
  const empty = document.getElementById(timeline ? 'timeline-empty' : 'term-empty');
  const params = new URLSearchParams(location.search);
  query.value = params.get('q') || '';
  const selected = params.get(timeline ? 'vendor' : 'category');
  if ([...category.options].some(option => option.value === selected)) category.value = selected;
  if (type && [...type.options].some(option => option.value === params.get('type'))) type.value = params.get('type');

  function apply(updateURL = false) {
    const words = normalized(query.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    items.forEach(item => {
      const matches = words.every(word => item.dataset.search.includes(word)) &&
        (!category.value || item.dataset[timeline ? 'vendor' : 'category'] === category.value) &&
        (!type?.value || item.dataset.type === type.value);
      item.hidden = !matches;
      if (matches) visible += 1;
    });
    document.querySelectorAll('.timeline-month').forEach(month => {
      month.hidden = ![...month.querySelectorAll('[data-timeline-event]')].some(item => !item.hidden);
    });
    count.textContent = `显示 ${visible} / ${items.length} ${timeline ? '条日期记录' : '个术语'}`;
    empty.hidden = visible !== 0;
    if (updateURL) {
      const url = new URL(location.href);
      for (const [key, value] of [['q', query.value], [timeline ? 'vendor' : 'category', category.value], ['type', type?.value || '']]) {
        if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
      }
      history.replaceState(null, '', url);
    }
  }
  query.addEventListener('input', () => apply(true));
  category.addEventListener('change', () => apply(true));
  type?.addEventListener('change', () => apply(true));
  apply();
  return {
    reveal(node) {
      if (!node.closest(timeline ? '[data-timeline-event]' : '[data-term]')) return;
      query.value = ''; category.value = ''; if (type) type.value = '';
      apply(false);
    },
  };
}
const timelineFilter = filtering('timeline');
const termFilter = filtering('glossary');

function revealHash() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  timelineFilter?.reveal(target);
  termFilter?.reveal(target);
  if (target.matches('[data-timeline-event]')) target.querySelector('details').open = true;
  for (let node = target.parentElement; node; node = node.parentElement) {
    if (node.tagName === 'DETAILS') node.open = true;
  }
  requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'auto' }));
}
window.addEventListener('hashchange', revealHash);
window.addEventListener('load', revealHash, { once: true });
revealHash();

let printDetails = [];
window.addEventListener('beforeprint', () => {
  printDetails = [...document.querySelectorAll('.research-article details:not([open])')];
  printDetails.forEach(details => { details.open = true; });
});
window.addEventListener('afterprint', () => {
  printDetails.forEach(details => { details.open = false; });
  printDetails = [];
});
