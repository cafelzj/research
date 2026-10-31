/* Progressive reading aids; handbook text and links work without this script. */
(() => {
  const guides=[...document.querySelectorAll('.indicator-guide')];
  if(!guides.length)return;
  document.body.classList.add('guide-reader-ready');
  let frame=null;
  function update(){
    frame=null;
    for(const root of guides){
      if(!root.getClientRects().length)continue;
      const toc=root.querySelector('.guide-contents');
      if(!toc)continue;
      const offset=toc.getBoundingClientRect().height+25;
      const chapters=[...root.querySelectorAll('.guide-chapter')];
      const current=chapters.filter(s=>s.getBoundingClientRect().top<=offset).at(-1)||chapters[0];
      for(const a of toc.querySelectorAll('a')){
        if(a.hash==='#'+current?.id)a.setAttribute('aria-current','location');
        else a.removeAttribute('aria-current');
      }
    }
  }
  const schedule=()=>{if(frame===null)frame=requestAnimationFrame(update);};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('hashchange',schedule);
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-guide-print]'))window.print();
    schedule();
  });
  let printState=[];
  window.addEventListener('beforeprint',()=>{
    if(printState.length)return;
    const root=guides.find(g=>g.getClientRects().length);
    if(!root)return;
    document.body.classList.add('guide-printing');
    printState=[...root.querySelectorAll('details')].map(d=>[d,d.open]);
    printState.forEach(([d])=>{d.open=true;});
  });
  window.addEventListener('afterprint',()=>{
    printState.forEach(([d,open])=>{d.open=open;});printState=[];
    document.body.classList.remove('guide-printing');schedule();
  });
  update();
})();
