/* Enhance the static research map without requiring storage or a data fetch. */
(() => {
  const normalize=s=>String(s).toLocaleLowerCase().replace(/\s+/g,' ').trim();
  const panel=document.getElementById('model-filters');
  let resetFilters=()=>{};
  if(panel){
    panel.hidden=false;
    const q=document.getElementById('model-query'),vendor=document.getElementById('model-vendor'),segment=document.getElementById('model-segment');
    const cards=[...document.querySelectorAll('[data-model-vendor]')].map(node=>({node,text:normalize(node.textContent)}));
    const apply=()=>{let visible=0;for(const c of cards){c.node.hidden=!!((q.value&&!c.text.includes(normalize(q.value)))||(vendor.value&&vendor.value!==c.node.dataset.modelVendor)||(segment.value&&segment.value!==c.node.dataset.modelSegment));if(!c.node.hidden)visible++;}document.getElementById('model-count').textContent='显示 '+visible+' / '+cards.length+' 个型号'+(visible?'':'，可清空筛选继续查看。');};
    resetFilters=()=>{q.value='';vendor.value='';segment.value='';apply();};
    q.addEventListener('input',apply);vendor.addEventListener('change',apply);segment.addEventListener('change',apply);document.getElementById('model-reset').addEventListener('click',resetFilters);apply();
  }
  const reveal=()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(!target)return;const model=target.closest('[data-model-vendor]');if(model?.hidden)resetFilters();for(let n=target;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;if(target.id==='network'){const graph=target.querySelector('details');if(graph)graph.open=true;}if(target.matches('[data-model-vendor]')){const detail=target.querySelector('details');if(detail)detail.open=true;}requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));};
  document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link)return;const url=new URL(link.href,location.href);if(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search&&url.hash)requestAnimationFrame(reveal);});
  window.addEventListener('hashchange',reveal);reveal();
})();
