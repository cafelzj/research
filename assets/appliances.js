"use strict";
(() => {
  const root = document.querySelector('.page-appliances');
  if (!root) return;
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => String(s).toLocaleLowerCase().replace(/\s+/g,' ').trim();
  const filters = new Map();
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    group.hidden=false;
    const key = group.dataset.filterGroup;
    const input = document.getElementById(key+'-query'), select = document.getElementById(key+'-category'), count = document.getElementById(key+'-count');
    const items = [...document.querySelectorAll('[data-filter-owner="'+key+'"]')].map(node=>({node,text:normalize(node.dataset.filterText || node.textContent),category:node.dataset.filterValue}));
    const apply = () => {
      const q=normalize(input.value), category=select.value;
      let visible=0;
      items.forEach(item=>{item.node.hidden=!!((q&&!item.text.includes(q))||(category&&category!==item.category));if(!item.node.hidden)visible++;});
      count.textContent='显示 '+visible+' / '+items.length+' 项'+(visible===0?'；可清空关键词或选择全部分类。':'');
    };
    input.addEventListener('input',apply);select.addEventListener('change',apply);
    filters.set(key,{input,select,apply});apply();
  });
  const reveal = (target,focus=false) => {
    if (!target) return;
    const owner=target.closest('[data-filter-owner]');
    if(owner&&owner.hidden){const f=filters.get(owner.dataset.filterOwner);if(f){f.input.value='';f.select.value='';f.apply();}}
    for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
    target.scrollIntoView({block:'start',behavior:'auto'});
    if(focus){const existing=target.hasAttribute('tabindex');if(!existing)target.setAttribute('tabindex','-1');target.focus({preventScroll:true});if(!existing)target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});}
  };
  const revealHash = () => {let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(id)requestAnimationFrame(()=>reveal(document.getElementById(id)));};
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button)return;
    const a=event.target.closest('a[href^="#ap-"]');if(!a)return;
    const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));if(!target)return;
    event.preventDefault();history.pushState(null,'',a.hash);reveal(target,true);window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  window.addEventListener('hashchange',revealHash);window.addEventListener('popstate',revealHash);revealHash();
  const search = document.getElementById('ap-search'), results = document.getElementById('ap-search-results');
  search.closest('.ap-search-panel').hidden=false;
  const entries=[...document.querySelectorAll('[data-ap-search][id]')].map(node=>({node,id:node.id,title:node.dataset.apSearch,text:normalize(node.textContent)}));
  search.addEventListener('input',()=>{
    const q=normalize(search.value);results.hidden=!q;if(!q){results.replaceChildren();return;}
    const matches=entries.map((item,index)=>({item,index,title:normalize(item.title)}))
      .map(x=>({...x,score:x.title===q?3:x.title.includes(q)?2:x.item.text.includes(q)?1:0}))
      .filter(x=>x.score).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.item);
    results.innerHTML='<b>'+matches.length+' 项匹配'+(matches.length>12?'，先显示前12项':'')+'</b>'+(matches.length?'<ul>'+matches.slice(0,12).map(item=>'<li><a href="#'+escape(item.id)+'">'+escape(item.title)+'</a></li>').join('')+'</ul>':'<p>试试较短的词，或查看目录中的公司、技术和指标栏目。</p>');
  });
  const links=[...document.querySelectorAll('.ap-contents a[href^="#ap-"]')], sections=[...document.querySelectorAll('[data-outline]')];
  let frame;
  const active = () => {
    frame=null;let selected=sections[0]?.id;
    sections.forEach(s=>{if(s.getBoundingClientRect().top<=180)selected=s.id;});
    links.forEach(a=>{if(a.hash==='#'+selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  };
  window.addEventListener('scroll',()=>{if(frame==null)frame=requestAnimationFrame(active);},{passive:true});active();
})();
