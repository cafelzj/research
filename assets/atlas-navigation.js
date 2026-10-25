/* Page-level hierarchy and product discovery; detailed content has one source. */
(() => {
  const root = document.getElementById('chemicalContent');
  if (!root) return;
  const chapters = window.ChemicalResearch.chapters;
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sections = [['sectors','子行业目录'],['map','工艺全景'],['product-applications','产品研究专题'],['framework','分析框架'],['metrics','指标与来源'],['glossary','入门术语']];
  const aside = document.querySelector('aside nav');
  aside.innerHTML = `<small class="atlas-nav-group">选择研究对象</small>${sections.slice(0,3).map(([id,label],i)=>`<a href="#${id}"><span>0${i+1}</span>${label}</a>`).join('')}<small class="atlas-nav-group">通用研究工具</small>${sections.slice(3).map(([id,label],i)=>`<a href="#${id}"><span>0${i+4}</span>${label}</a>`).join('')}`;
  root.querySelector('.section-guide').innerHTML = '阅读顺序：先选子行业，再看产品与应用，最后查指标与资料。<div class="journey-links"><a href="index.html">行业看板 ↗</a><a href="intelli.html">IntelliUI ↗</a></div>';
  root.querySelector('.hero h1').innerHTML = '化工研究，<br>从<em>行业到产品</em>。';
  root.querySelector('.hero p').textContent = '先建立行业位置，再深入产品机制、应用优势和替代关系。子行业目录是统一入口，完整专题与研究框架分别标明。';
  const steps = document.createElement('nav');
  steps.className='atlas-reading-path'; steps.setAttribute('aria-label','化工研究阅读路径');
  steps.innerHTML = `<a href="#sectors"><b>01 / 选行业</b><span>按研究问题浏览 14 个子行业</span></a><a href="#map"><b>02 / 看工艺</b><span>从原料走到工艺与需求</span></a><a href="#product-applications"><b>03 / 读产品</b><span>6 个专题 · 48 组产品与材料</span></a><a href="#framework"><b>04 / 查工具</b><span>分析框架、指标来源与术语</span></a>`;
  root.querySelector('.summary').after(steps);
  const search = document.getElementById('search');
  search.placeholder='搜索子行业、产品、用途或指标'; search.setAttribute('aria-label','搜索子行业、产品、用途或指标');
  const results = document.createElement('div');results.id='atlas-product-results';results.hidden=true;
  results.setAttribute('aria-live','polite');document.getElementById('searchstatus').after(results);
  search.addEventListener('input', () => {
    const q=search.value.trim().toLowerCase();
    if(!q){results.hidden=true;results.innerHTML='';return;}
    const matches=chapters.flatMap(c=>c.products.map((p,index)=>({c,p,index}))).filter(({c,p})=>[c.name,...['name','mechanism','application','advantage','alternative'].map(k=>p[k])].join(' ').toLowerCase().includes(q));
    results.hidden=false;
    results.innerHTML=`<h3>产品与应用匹配 · ${matches.length} 项</h3>${matches.length?`<ul>${matches.map(({c,p,index})=>`<li><a href="?industry=chemical&chemChain=${c.key}#chem-product-${index}"><small>${esc(c.name)}</small><b>${esc(p.name)}</b><span>${esc(p.application)}</span></a></li>`).join('')}</ul>`:'<p>没有匹配的产品。下方仍会显示匹配的子行业和指标。</p>'}`;
  });
  let frame;
  function active(){
    frame=null;if(root.hidden)return;
    let selected='sectors';
    sections.forEach(([id])=>{if(document.getElementById(id).getBoundingClientRect().top<=180)selected=id;});
    aside.querySelectorAll('a').forEach(a=>{const on=a.hash==='#'+selected;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  const schedule=()=>{if(frame==null)frame=requestAnimationFrame(active);};
  window.addEventListener('scroll',schedule,{passive:true});document.addEventListener('industry:change',schedule);active();
})();
