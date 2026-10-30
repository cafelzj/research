'use strict';
(() => {
  const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Number(n||0).toLocaleString('zh-CN');
  let catalog,index,byId,edges,scope='local',remoteCatalog=null,remoteIndex=null,lastResults=[],offset=0,loadToken=0,searchToken=0,remoteController=null;
  const filters=['industry','role','frequency','transform','health','source'];
  const labels={industry:'行业',role:'研究角色',frequency:'频率',transform:'口径',health:'健康标记',source:'来源'};
  const issueLabels={missing_unit:'单位缺失',missing_source:'来源缺失',missing_frequency:'频率缺失',missing_code:'代码缺失',missing_name:'名称缺失',missing_health:'健康标记缺失',cross_industry_membership:'跨行业引用（已保留多标签）',code_conflict:'同代码属性冲突',source_health:'原表健康提示',unit_semantics_review:'名称 / 单位需核验',name_frequency_review:'名称 / 频率需核验',name_frequency_conflict:'名称 / 频率需核验',name_unit_conflict:'名称 / 单位需核验',same_name:'同名候选'};
  const paths=[
    {name:'原油 → 化工',explain:'原油价格可能经原料成本传导至化工品，但价差、装置检修、库存与需求会改变方向和时滞。只看到上游涨价，不能证明下游利润改善。',nodes:[['资源与能源','原油价格','原油价格与库存'],['基础化工','甲醇价格','甲醇有煤、气等多路线，不能视作单一油价函数'],['聚合与材料','MDI','区分纯 MDI / 聚合 MDI 及对应用途'],['终端应用','冰箱','冰箱保温材料需求还受产量和单位耗用影响']]},
    {name:'纯碱 → 玻璃',explain:'重碱是玻璃原料之一。玻璃日熔量、冷修和光伏玻璃扩产影响采购；需求不能直接等同于规划产能。工业链节点之间只建立研究假说。',nodes:[['原料成本','纯碱价格','轻重碱、地区与交付口径'],['供需验证','纯碱库存','厂库和社会库避免重复计算'],['下游生产','玻璃产量','运行日熔量、冷修与实际产量'],['终端需求','光伏','技术耗用、装机与玻璃采购节奏']]},
    {name:'家电量价与渠道',explain:'同品牌、同品类、同渠道、同期间才适合比较量、额和均价。金额≈销量×均价只是候选恒等式，还需核验折扣、税费、退款与金额单位。',nodes:[['需求量','空调零售量','区分线上/线下、品牌与全部市场'],['价格','空调零售均价','均价不是同质产品价格指数'],['收入验证','空调零售额','量×价需换算台/万台、元/万元'],['库存周期','空调库存','出货不等于终端零售，留意渠道库存']]},
    {name:'锂电材料',explain:'磷酸铁锂是正极活性材料，六氟磷酸锂是电解液盐，PVDF 是相应材料体系的粘结剂等。名称里的“锂”或“氟”不代表同一用途，需求单耗也不同。',nodes:[['正极材料','磷酸铁锂价格','LFP 不是 LiPF₆'],['电解液盐','六氟磷酸锂价格','按频率、纯度与供数来源区分'],['聚合物','PVDF','电池级、膜级与涂料级不可混算'],['需求端','电池产量','先连接容量、单耗、库存与采购时点']]},
    {name:'硅材料分支',explain:'工业硅、有机硅与多晶硅不是同一产品；DMC 又可能表示硅氧烷中间体或碳酸二甲酯。先解决对象歧义，再讨论产业链和价格传导。',nodes:[['基础原料','工业硅价格','电力与供给运行'],['有机硅支线','有机硅DMC','二甲基环硅氧烷'],['光伏支线','多晶硅价格','合格产能、库存与下游拉晶'],['另一化学品','碳酸二甲酯','不是有机硅 DMC，不能误连为其同义词']]},
    {name:'航运供需',explain:'运价需结合运力、交付、拆解、贸易量及航线扰动。SCFI 与 CCFI 的样本和口径不同，不能因名称都含运价指数而直接接续。',nodes:[['供给','集装箱船队运力','新增交付、拆解与实际可用运力'],['即期运价','SCFI','核验航线及计价单位'],['另一口径','CCFI','与 SCFI 分开保存'],['需求','集装箱吞吐量','港口口径、样本与全球贸易并非同一概念']]}
  ];
  function status(message,error=false){$('#app-status').textContent=message;$('#app-status').className=message?(error?'notice':'fine'):'';}
  function validate(data){
    if(!data||data.schema_version!==1||!Array.isArray(data.records)||!data.records.length||data.records.length>200000)throw Error('目录格式不符：需要 schema_version=1 及 1–200000 条 records。');
    if(data.meta!=null&&(typeof data.meta!=='object'||Array.isArray(data.meta)))throw Error('meta 必须是对象');
    if(data.audit!=null&&(typeof data.audit!=='object'||Array.isArray(data.audit)))throw Error('audit 必须是对象');
    if(data.audit?.issues!=null&&(!Array.isArray(data.audit.issues)||data.audit.issues.length>500000||data.audit.issues.some(i=>!i||typeof i.kind!=='string'||typeof i.message!=='string')))throw Error('audit.issues 格式不符');
    if(data.audit?.counts!=null&&(typeof data.audit.counts!=='object'||Array.isArray(data.audit.counts)||Object.values(data.audit.counts).some(n=>!Number.isFinite(n)||n<0)))throw Error('audit.counts 格式不符');
    if(data.audit?.homonyms!=null&&!Array.isArray(data.audit.homonyms))throw Error('audit.homonyms 格式不符');
    const ids=new Set();
    for(const r of data.records){
      if(!r||typeof r.id!=='string'||!r.id||typeof r.name!=='string'||typeof r.code!=='string'||ids.has(r.id))throw Error('指标必须有唯一 id、名称和代码；同 code 属性冲突应保留不同 id。');
      ids.add(r.id);
      for(const key of ['industry','frequency','unit','source','health','role','transform','base_name','geography'])if(r[key]!=null&&typeof r[key]!=='string')throw Error('字段类型错误：'+key);
      if(r.aliases!=null&&(!Array.isArray(r.aliases)||r.aliases.some(x=>typeof x!=='string')))throw Error('aliases 必须为字符串数组');
      if(r.roles!=null&&(!Array.isArray(r.roles)||r.roles.some(x=>typeof x!=='string')))throw Error('roles 必须为字符串数组');
      if(r.industries!=null&&(!Array.isArray(r.industries)||r.industries.some(x=>typeof x!=='string')))throw Error('industries 必须为字符串数组');
    }
    if(data.relations!=null&&(!Array.isArray(data.relations)||data.relations.length>1000000))throw Error('relations 格式或数量不符');
    return data;
  }
  function install(data,source){
    validate(data);
    const nextIndex=IndicatorSearch.createIndex(data.records);
    const nextById=new Map(data.records.map(r=>[r.id,r])),nextEdges=new Map();
    for(const edge of data.relations||[]){if(!edge||!nextById.has(edge.source)||!nextById.has(edge.target))continue;for(const id of [edge.source,edge.target]){if(!nextEdges.has(id))nextEdges.set(id,[]);nextEdges.get(id).push(edge);}}
    catalog=data;index=nextIndex;byId=nextById;edges=nextEdges;scope='local';$('[name=scope][value=local]').checked=true;
    for(const f of filters){
      const values=[...new Set(data.records.flatMap(r=>f==='industry'?(r.industries||[r.industry]):f==='role'?(r.roles||[r.role]):[r[f]]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
      $('#filter-'+f).innerHTML=`<option value="">全部${labels[f]}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    }
    const demo=data.meta?.mode==='demo';
    $('#catalog-mode').textContent=demo?'功能演示 · 非原表数据':'私有目录 · 当前浏览器';
    $('#catalog-label').textContent=`${source} · ${fmt(data.records.length)} 个指标实体`;
    $('#catalog-description').textContent=demo?'人工编制的演示条目与演示代码，无真实观测值；不包含上传的完整 Excel。':`${fmt(data.meta?.source_row_count||data.records.length)} 条原始行业引用；${fmt(data.meta?.cross_industry_codes)} 个代码有多行业归属。仅加载元数据，不代表取得数值或授权 API。`;
    renderQuality();runSearch(true);
  }
  function rowHtml(result){const r=result.record,health=r.health||'未填';return `<article class="metric-row"><span class="row-label">${esc(r.code)} · ${esc(result.match_type||'候选')}</span><h3><button type="button" class="metric-open" data-id="${esc(r.id)}">${esc(r.name)}</button></h3><div class="metric-meta"><span>${esc((r.industries||[r.industry]).join(' / '))}</span><span>频率：${esc(r.frequency||'未填')}</span><span>口径：${esc(r.transform||'未明确')}</span><span>单位：${esc(r.unit||'未填')}</span><span>来源：${esc(r.source||'未填')}</span><span class="${health.includes('停更')?'health-bad':health.includes('预警')?'health-warning':''}">${esc(health)}</span></div><p class="match-reason">${esc((result.reasons||[]).join('；'))}</p></article>`;}
  function activeFilters(){return Object.fromEntries(filters.map(f=>[f,$('#filter-'+f).value]));}
  async function ensureRemote(){if(remoteIndex)return;const r=await fetch('assets/indicator-remote.json');if(!r.ok)throw Error('远程目录注册表加载失败 HTTP '+r.status);const data=await r.json();if(!Array.isArray(data.records))throw Error('远程目录注册表无效');remoteCatalog=data;remoteIndex=IndicatorSearch.createIndex(data.records);}
  async function runSearch(reset=false){
    if(!index)return;
    if(/(?:远程|世界银行|world\s*bank|联网搜索)/i.test($('#metric-query').value)){scope='remote';$('[name=scope][value=remote]').checked=true;}
    const token=++searchToken;if(reset)offset=0;
    const query=$('#metric-query').value.trim();const begin=performance.now();
    let engine=index,q=query,filter=activeFilters();
    if(scope==='remote'){
      try{await ensureRemote();}catch(e){if(token===searchToken){status(e.message,true);$('#metric-results').textContent='无法加载远程目录；本地目录仍可使用。';}return;}
      if(token!==searchToken)return;
      engine=remoteIndex;filter={};q=query.replace(/美国|中国|日本|法国|德国|英国|欧盟|全国|世界银行|World\s*Bank|远程|联网搜索/gi,'');
    }
    const res=engine.search(q,{...filter,offset},40);if(token!==searchToken)return;
    lastResults=res.results;
    $('#metric-results').innerHTML=lastResults.length?lastResults.map(rowHtml).join(''):'<div class="empty"><b>没有满足当前口径的指标。</b><p>可减少筛选、使用准确产品名，或切到远程目录。系统不会用相近名称的其他指标补成答案。</p></div>';
    $('#results-label').textContent=`${scope==='local'?'本地':'世界银行公共目录'} · ${fmt(res.total)} 项匹配`;
    $('#search-cost').textContent=`${Math.round(performance.now()-begin)} ms · 第 ${res.total?offset+1:0}–${Math.min(offset+lastResults.length,res.total)} 项`;
    $('#load-more').hidden=offset+lastResults.length>=res.total;$('#previous-page').hidden=offset===0;
    const intent=res.intent||{};
    const transformLabel=t=>({yoy:'同比',mom:'环比',cumulative:'累计',cumulative_yoy:'累计同比',cumulative_mom:'累计环比',end:'期末',level:'原值'}[t]||t);
    const chips=[...(intent.frequency?['频率 '+intent.frequency]:[]),...(intent.transforms||[]).map(t=>'口径 '+transformLabel(t)),...(intent.excludeTransforms||[]).map(t=>'排除 '+transformLabel(t)),...(intent.geographies||[]).map(t=>'地区 '+t),...(intent.excludeFrequencies||[]).map(t=>'排除频率 '+t),...(intent.source?['来源 '+intent.source]:[]),...filters.filter(f=>filter[f]).map(f=>labels[f]+' '+filter[f])];
    $('#intent-summary').innerHTML=chips.map(t=>`<span class="intent-chip">${esc(t)}</span>`).join('');
    const warnings=[...(res.warnings||[])];
    if(scope==='remote')warnings.unshift('当前仅检索 10 项已登记的世界银行年度公共指标，非全网或商业库搜索。国家在详情中选择，数值需点击联网获取。');
    if(query&&!warnings.length)warnings.push('按词典与口径规则解析，未调用大模型；请核对结果的对象、来源和统计范围。');
    $('#search-warnings').className=warnings.length?'notice':'';$('#search-warnings').textContent=warnings.join(' ');
    for(const f of filters)$('#filter-'+f).disabled=scope==='remote';
  }
  function openDetail(id){
    const remote=scope==='remote',r=remote?remoteCatalog?.records.find(x=>x.id===id):byId.get(id);if(!r)return;
    remoteController?.abort();
    const peers=remote?[]:catalog.records.filter(x=>x.id!==r.id&&IndicatorSearch.normalize(x.name)===IndicatorSearch.normalize(r.name));
    const rel=edges.get(id)||[];
    const fields=[['命名空间',remote?'wb · World Bank':'local · 当前导入目录'],['指标代码',r.code],['原始行业',(r.industries||[r.industry]).join(' / ')],['研究角色（规则标签）',(r.roles||[r.role]).filter(Boolean).join(' / ')||'待分类'],['频率 / 口径',[r.frequency,r.transform].filter(Boolean).join(' / ')],['单位',r.unit||'未填，不能自动换算'],['来源',r.source||'未填'],['表内健康状态',r.health||'未填'],['识别地区',r.geography||'未明确，不默认为全国'],['原始别名',(r.aliases||[]).join('；')||'无已登记别名'],['原表定位',remote?'公共 API':catalog.meta?.mode==='demo'?'人工功能演示，无原表行':`${catalog.meta?.sheet||'全行业指标'} · 行 ${(r.source_rows||[r.source_row]).filter(Boolean).join(', ')}`]];
    $('#metric-detail').innerHTML=`<p class="fine">指标身份 / 口径 / 证据</p><h3 class="detail-name">${esc(r.name)}</h3><dl class="detail-grid">${fields.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${remote?remoteDetail(r):`<h3>同名指标 · ${peers.length} 项</h3><p class="fine">同名不自动合并。来源、代码或范围不同应独立选择。</p><ul class="relation-list">${peers.slice(0,20).map(x=>`<li><button type="button" data-detail-id="${esc(x.id)}">${esc(x.code)} · ${esc(x.name)}</button><small>${esc(x.source)} / ${esc(x.frequency)} / ${esc(x.unit)}</small></li>`).join('')||'<li>没有发现其他同名实体。</li>'}</ul><h3>派生关系候选 · ${rel.length} 条</h3><p class="fine">以下不是已验证公式。只连命名与口径兼容的候选，不把同一行业任意指标连成因果图。</p><ul class="relation-list">${rel.slice(0,24).map(e=>{const x=byId.get(e.source===id?e.target:e.source);return `<li><button type="button" data-detail-id="${esc(x.id)}">${esc(x.name)}</button><small>${esc(e.type)} · ${esc(e.status)}</small><p>${esc(e.reason)}</p>${e.formula_hint?`<code>${esc(e.formula_hint)}</code>`:''}</li>`}).join('')||'<li>没有满足当前候选规则的关系，不自动补造。</li>'}</ul><h3>目录质量提示</h3><ul>${(r.health&&r.health!=='正常'?`<li>原表健康标记为 ${esc(r.health)}，请核验可用期与来源；这不是本程序检测出的数值异常。</li>`:'')+((catalog.audit?.issues||[]).filter(i=>i.record_id===id).slice(0,15).map(i=>`<li>${esc(i.message)}</li>`).join('')||'<li>未命中其他已实现的目录规则，不代表数值或统计口径已通过验证。</li>')}</ul><p class="fine">目录文件 SHA-256：${esc(catalog.meta?.source_sha256||'演示目录，无原文件哈希')}<br>工作簿没有数值观测，不能计算相关系数、滞后或统计离群。</p>`}`;
    if(!$('#metric-dialog').open)$('#metric-dialog').showModal();
    $('#metric-detail').scrollTop=0;
    if(remote){$('#remote-fetch').onclick=()=>fetchRemote(r);$('#remote-country').value=countryForQuery();}
  }
  function remoteDetail(r){return `<h3>来源定义</h3><p>${esc(r.original_name)}</p><p class="fine">${esc(r.source_note)}</p><a href="${esc(r.source_url)}" target="_blank" rel="noopener">世界银行原始指标与说明 ↗</a><div class="remote-settings"><label>国家<select id="remote-country"><option value="CHN">中国</option><option value="USA">美国</option><option value="JPN">日本</option><option value="FRA">法国</option><option value="DEU">德国</option><option value="GBR">英国</option><option value="EUU">欧盟</option></select></label><button type="button" id="remote-fetch">联网获取年度数值</button><p class="fine">固定 World Bank 公共 API，无需密钥。空值显示“未发布/缺失”，不当成零；本地目录不会上传。</p></div><div id="remote-values" role="status"></div>`;}
  function countryForQuery(){const q=$('#metric-query').value;return [['美国','USA'],['日本','JPN'],['法国','FRA'],['德国','DEU'],['英国','GBR'],['欧盟','EUU']].find(([s])=>q.includes(s))?.[1]||'CHN';}
  async function fetchRemote(r){
    remoteController?.abort();remoteController=new AbortController();const controller=remoteController,el=$('#remote-values'),country=$('#remote-country').value;
    if(!['CHN','USA','JPN','FRA','DEU','GBR','EUU'].includes(country)||!remoteCatalog.records.some(x=>x.code===r.code))return;
    const end=new Date().getUTCFullYear()-1;
    const url=`https://api.worldbank.org/v2/country/${country}/indicator/${encodeURIComponent(r.code)}?format=json&date=${end-10}:${end}&per_page=100`;
    el.textContent='正在连接世界银行 API…';$('#remote-fetch').disabled=true;
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('HTTP '+response.status);
      const data=await response.json();
      if(!Array.isArray(data)||!Array.isArray(data[1]))throw Error('接口没有返回有效观测；可能无此国家数据或服务暂不可用');
      const rows=data[1].filter(x=>x&&x.indicator?.id===r.code&&typeof x.date==='string'&&(x.value===null||typeof x.value==='number'));
      if(!rows.length)throw Error('该国家 / 指标没有返回观测，不用空表伪装成功');
      if(controller!==remoteController||!$('#metric-dialog').open)return;
      el.innerHTML=`<p><b>${esc(country)} · ${esc(r.name)}</b></p><table class="remote-observations"><thead><tr><th>年度</th><th>原始数值</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td>${x.value===null?'未发布 / 缺失':esc(x.value.toLocaleString('zh-CN',{maximumFractionDigits:6}))}</td></tr>`).join('')}</tbody></table><p class="fine">来源：World Bank API · 获取 ${esc(new Date().toISOString())} · 接口更新 ${esc(data[0]?.lastupdated||'未提供')}<br>单位请以上方定义为准；未做单位换算或异常剔除。</p><a href="${esc(url)}" target="_blank" rel="noopener">核对原始 API 响应 ↗</a>`;
    }catch(e){if(controller===remoteController&&$('#metric-dialog').open)el.textContent='获取失败：'+(e.name==='AbortError'?'请求超时或已取消':e.message)+'。可以重试；不会回退为模拟数值。';}
    finally{clearTimeout(timer);if(controller===remoteController&&$('#remote-fetch'))$('#remote-fetch').disabled=false;}
  }
  function renderPaths(which=0){
    $('#path-choices').innerHTML=paths.map((p,i)=>`<button type="button" data-path="${i}" aria-pressed="${i===which}">${esc(p.name)}</button>`).join('');const p=paths[which];
    $('#path-detail').innerHTML=`<h3>${esc(p.name)}</h3><div class="path-nodes">${p.nodes.map(([stage,q,note],i)=>`<article class="path-node"><small>0${i+1} / ${esc(stage)}</small><h3>${esc(q)}</h3><p>${esc(note)}</p><button type="button" data-find="${esc(q)}">查找当前目录指标 →</button></article>`).join('')}</div><div class="path-explanation"><b>研究假说与反证</b><p>${esc(p.explain)}</p><p>节点间暂无实证方向、系数或时滞。需用同口径真实序列验证，并检查库存、政策、季节性和共同驱动。</p></div>`;
  }
  function renderQuality(){
    const rec=catalog.records,issues=catalog.audit?.issues||[],counts=Object.create(null);
    if(catalog.audit?.counts)Object.assign(counts,catalog.audit.counts);else for(const i of issues)counts[i.kind]=(counts[i.kind]||0)+1;
    const stats=[['指标实体',rec.length],['跨行业引用代码',catalog.meta?.cross_industry_codes||0],['单位未填',rec.filter(r=>!r.unit).length],['表内停更标记',rec.filter(r=>r.health?.includes('停更')).length]];
    $('#quality-stats').innerHTML=stats.map(([k,v])=>`<div class="quality-stat"><b>${fmt(v)}</b><span>${esc(k)}</span></div>`).join('');
    $('#quality-issues').innerHTML=`<div class="notice">当前目录${catalog.meta?.mode==='demo'?'是人工功能演示，不是原表审计结果。':'的统计按去重后实体计算，可能与 Excel 行数统计不同。'}没有真实观测序列，不执行数值离群或经济异常判断。</div>`+Object.entries(counts).map(([kind,count])=>{const sample=kind==='source_health'?rec.filter(r=>r.health&&r.health!=='正常').slice(0,5).map(r=>({record_id:r.id,message:'原表健康标记需核验；不代表数值异常或新鲜度验证。'})):issues.filter(i=>i.kind===kind).slice(0,5);return `<article class="quality-item"><h3>${esc(issueLabels[kind]||kind)} · ${fmt(count)}</h3><p>${esc(sample[0]?.message||'')}</p>${sample.map(i=>byId.get(i.record_id)).filter(Boolean).map(r=>`<button type="button" data-quality-id="${esc(r.id)}">${esc(r.code)} · ${esc(r.name)}</button>`).join('')}</article>`}).join('')+`<article class="quality-item"><h3>同名异代码候选 · ${fmt(catalog.audit?.homonyms?.length||0)} 组</h3><p>代码、来源和统计范围分开保留，先消歧再取数。不同代码同名不自动合并。</p></article>`;
  }
  function view(name){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));document.querySelectorAll('.workspace-view').forEach(e=>e.hidden=e.id!=='view-'+name);}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.view)view(b.dataset.view);
    if(b.dataset.query){$('#metric-query').value=b.dataset.query;runSearch(true);}
    if(b.dataset.id)openDetail(b.dataset.id);
    if(b.dataset.detailId)openDetail(b.dataset.detailId);
    if(b.dataset.qualityId){scope='local';$('[name=scope][value=local]').checked=true;openDetail(b.dataset.qualityId);}
    if(b.dataset.path)renderPaths(Number(b.dataset.path));
    if(b.dataset.find){scope='local';$('[name=scope][value=local]').checked=true;filters.forEach(f=>$('#filter-'+f).value='');$('#metric-query').value=b.dataset.find;view('search');runSearch(true);$('#metric-query').focus();}
  });
  $('#metric-search-form').onsubmit=e=>{e.preventDefault();runSearch(true);};
  for(const f of filters)$('#filter-'+f).onchange=()=>runSearch(true);
  document.querySelectorAll('[name=scope]').forEach(e=>e.onchange=()=>{scope=e.value;runSearch(true);});
  $('#clear-filters').onclick=()=>{filters.forEach(f=>$('#filter-'+f).value='');runSearch(true);};
  $('#previous-page').onclick=()=>{offset=Math.max(0,offset-40);runSearch();};
  $('#export-audit').onclick=()=>{const blob=new Blob([JSON.stringify({meta:catalog.meta,audit:catalog.audit},null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='indicator-metadata-audit.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);};
  $('#load-more').onclick=()=>{offset+=40;runSearch();};
  $('#dialog-close').onclick=()=>$('#metric-dialog').close();
  $('#metric-dialog').addEventListener('close',()=>remoteController?.abort());
  $('#catalog-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;const token=++loadToken;if(file.size>100*1024*1024){status('目录超过 100 MiB，请使用本地 API 或精简导出。',true);return;}status('正在解析目录和构建检索索引…');try{const data=JSON.parse(await file.text());if(token!==loadToken)return;install(data,file.name);status('目录已载入当前浏览器内存，未上传。');}catch(error){status('导入失败，保留原目录：'+error.message,true);}finally{e.target.value='';}};
  $('#demo-reset').onclick=()=>{loadToken++;install(window.IndicatorDemo,'演示目录');status('已恢复演示。');};
  $('#cp-command').textContent='python3 -m indicator_lab prepare --input observations.csv --output result.json --operation yoy\npython3 -m indicator_lab prepare --input cumulative.csv --output result.json --operation cumulative_to_period --measure flow\n# 必填 CSV 列：series_id,date,value,unit,frequency,region,source\n# 不同单位/频率/地区/来源不可静默拼接；coverage 可标记合并期。';
  renderPaths();install(window.IndicatorDemo,'演示目录');
  if(['127.0.0.1','localhost','[::1]'].includes(location.hostname)){
    const startupToken=loadToken;
    fetch('/health').then(r=>r.ok?r.json():null).then(async health=>{if(health?.service!=='indicator-lab'||startupToken!==loadToken)return;status('检测到本地指标服务，正在加载私有全量目录…');const r=await fetch('/catalog');if(!r.ok)throw Error('目录接口 HTTP '+r.status);const data=await r.json();if(startupToken===loadToken){install(data,data.meta?.source_file||'本地完整目录');status('已连接本地私有目录。');}}).catch(e=>{if(startupToken===loadToken)status('本地目录加载失败：'+e.message+'。当前仍为演示目录，请重试导入或检查本地服务。',true);});
  }
})();
