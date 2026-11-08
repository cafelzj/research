/* Keep each existing dashboard inside its own industry's research page. */
(() => {
  const mapping={chemical:{code:'801030',name:'基础化工',kind:'化工跨链模拟样本与图表教学',scope:'化工链条的模拟样本用于学习筛选、图表与指标口径，不是当前行情，也不代表申万基础化工的完整覆盖。'},appliances:{code:'801110',name:'家用电器',kind:'待采集指标与教学计算',scope:'观察清单中的当前数值尚未采集；教学曲线与量价计算用于推演，不代替行业统计。'},electrical:{code:'801730',name:'电力设备',kind:'待采集指标、历史快照与教学计算',scope:'当前待采集指标、2015—2024年风光发电历史快照和教学情景分别展示，功率、电量与利润须分开理解。'}};
  const byCode=Object.fromEntries(Object.entries(mapping).map(([key,value])=>[value.code,key]));
  let queued=false;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sync(){
    queued=false;
    const params=new URLSearchParams(location.search),code=params.get('sw');
    const key=code?byCode[code]:params.has('industry')?params.get('industry'):params.has('chemChain')?'chemical':null;
    const config=mapping[key];
    const host=config?(code?document.getElementById('sw-detail'):document.getElementById(key==='chemical'?'chemicalContent':'industryHub')):null;
    document.querySelectorAll('[data-industry-monitor]').forEach(node=>{if(!host||node.parentElement!==host||node.dataset.industryMonitor!==key){node.parentElement?.querySelectorAll('[data-monitor-jump]').forEach(link=>link.remove());node.remove();}});
    if(!host||host.hidden||!config)return;
    let details=host.querySelector(':scope > [data-industry-monitor]');
    if(!details){
      details=document.createElement('details');details.className='industry-monitor';details.id=code?'sw-monitor':'ir-monitor';details.dataset.industryMonitor=key;details.dataset.outline='行业指标跟踪';
      details.innerHTML='<summary><span><b>'+escape(config.name)+' · 指标跟踪</b><small>'+escape(config.kind)+'</small></span><span class="monitor-action">展开看板</span></summary><div class="monitor-content"><p class="monitor-context">'+escape(config.scope)+'</p><p class="monitor-loading" role="status">展开后加载本行业看板。</p><iframe data-monitor-frame title="'+escape(config.name)+'指标跟踪与教学工具" style="height:640px" loading="lazy"></iframe><p class="monitor-window"><a href="industry-dashboard.html?industry='+key+'" target="_blank" rel="noopener noreferrer">在独立窗口查看 ↗</a></p></div>';
      const header=host.querySelector(':scope > .sw-read-head,:scope > .ir-intro,:scope > .hero');
      if(header)header.after(details);else host.prepend(details);
      const link=document.createElement('a');link.href='#'+details.id;link.className=code?'sw-button':'monitor-jump';link.textContent='本行业指标跟踪 ↓';link.dataset.monitorJump='';
      (header||host).append(link);
      details.addEventListener('toggle',()=>{
        const frame=details.querySelector('iframe');
        details.querySelector('.monitor-action').textContent=details.open?'收起看板':'展开看板';
        if(details.open){
          if(!frame.hasAttribute('src')){
            frame.src='industry-dashboard.html?industry='+key+'&embed=1';
            frame.addEventListener('load',()=>{details.querySelector('.monitor-loading').hidden=true;},{once:true});
          }else frame.contentWindow?.postMessage({type:'industry-dashboard-resize'},location.origin);
        }else frame.contentWindow?.postMessage({type:'industry-dashboard-pause'},location.origin);
      });
      document.dispatchEvent(new Event('industry-monitor:mounted'));
    }
    if(location.hash==='#'+details.id){details.open=true;requestAnimationFrame(()=>details.scrollIntoView({block:'start'}));}
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(sync);}}
  document.addEventListener('sw:change',schedule);
  document.addEventListener('industry:change',schedule);
  window.addEventListener('popstate',schedule);
  window.addEventListener('hashchange',schedule);
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a[href="#sw-monitor"],a[href="#ir-monitor"]');
    if(anchor){const node=document.querySelector(anchor.hash);if(node){node.open=true;requestAnimationFrame(()=>node.scrollIntoView({block:'start'}));}}
  });
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const frame=[...document.querySelectorAll('iframe[data-monitor-frame]')].find(node=>node.contentWindow===event.source);
    if(!frame)return;
    const message=event.data;
    if(message?.type==='industry-dashboard-size'&&Number.isFinite(message.height))frame.style.height=Math.max(320,Math.min(200000,Math.ceil(message.height)))+'px';
    if(message?.type==='industry-dashboard-scroll'&&Number.isFinite(message.top))window.scrollTo({top:window.scrollY+frame.getBoundingClientRect().top+message.top-24,behavior:'auto'});
  });
  schedule();
})();
