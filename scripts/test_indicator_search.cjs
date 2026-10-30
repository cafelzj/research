/* node scripts/test_indicator_search.cjs
 * Optional full-workbook golden suite: INDICATOR_CATALOG=/private/catalog.json node ...
 * The uploaded workbook and full catalogue are never embedded in this test. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createIndex,normalize}=require('../assets/indicator-search.js');
let checks=0;
function check(ok,message){assert.ok(ok,message);checks++;}
const record=(code,name,extra={})=>({id:code,code,name,industry:'测试化工',industries:['测试化工'],frequency:'月',unit:'元/吨',source:'测试来源',health:'正常',aliases:[],...extra});
const records=[
  record('TEST-1','价格:甲醇:华东:当月值'),
  record('TEST-2','价格:甲醇:华东:当月同比',{unit:'%'}),
  record('TEST-3','价格:甲醇:华东:累计值'),
  record('TEST-4','价格:甲醇:华东:当周值',{frequency:'周',source:'测试周来源'}),
  record('TEST-5','价格:甲醇:华东:当日值',{frequency:'日'}),
  record('TEST-6','价格:甲醇:美国:当月值'),
  record('TEST-7','价格:甲醇:华东:当月值',{source:'另一来源'}),
  record('TEST-8','价格:聚合MDI:华东:当周值',{frequency:'周'}),
  record('TEST-9','价格:纯MDI:华东:当周值',{frequency:'周',aliases:['纯MDI(华东)','纯MDI:规格(98%,原文逗号保留)']}),
  record('TEST-10','CCPI:化工品价格指数:当月值',{unit:'点'}),
  record('TEST-11','美的系:零售均价:空调:线上:当月值',{industry:'家用电器',industries:['家用电器','测试化工'],unit:'元/台'}),
  record('TEST-12','美的系:零售均价:空调:线上:当月值(同比)',{industry:'家用电器',industries:['家用电器'],unit:'%'}),
  record('TEST-13','美的系:零售均价:空调:线上:期末值:月频',{industry:'家用电器',industries:['家用电器'],unit:'元/台'}),
  record('TEST-14','美的系:零售额:空调:线上:当月值',{industry:'家用电器',industries:['家用电器'],unit:'万元'}),
  record('TEST-15','美的系:零售额份额:空调:线上:当月值',{industry:'家用电器',industries:['家用电器'],unit:'%'}),
  record('TEST-16','美的系:零售量:空调:线上:当月值',{industry:'家用电器',industries:['家用电器'],unit:'台'}),
  record('TEST-17','价格:甲醇:华东:当月值',{health:'停更'}),
  record('DEMO-001','价格:二甲基环硅氧烷(DMC):当月值'),
  record('DEMO-002','价格:碳酸二甲酯(DMC):当月值'),
  record('NY.GDP.MKTP.CD','GDP:现价美元',{frequency:'年',unit:'美元'}),
  record('SEM-1','交付艘数:船队:当半年值',{frequency:'半年',unit:'艘'}),
  record('XSS-1','<img src=x onerror=alert(1)>')
];
const index=createIndex(records);
const ids=(q,f={},limit=200)=>index.search(q,f,limit).results.map(x=>x.record.code);
check(normalize('Ａ０００１２３：甲醇（华东）')==='a000123甲醇华东','NFKC and punctuation');
for(const code of ['TEST-1','DEMO-001','NY.GDP.MKTP.CD','XSS-1'])check(ids(code).length===1&&ids(code)[0]===code,'any namespace exact code '+code);
check(ids('TEST-MISSING').length===0,'unknown code abstains');
check(ids('纯MDI(华东)')[0]==='TEST-9','Excel alias exact');
check(ids('纯MDI华东价格').includes('TEST-9')&&!ids('纯MDI华东价格').includes('TEST-8'),'grade not collapsed');
check(index.search('价格:甲醇:华东:当月值').results.every(x=>x.match_type==='名称精确'),'same-name codes are retained');
check(ids('价格:甲醇:华东:当月值').length===3,'same-name source and health ambiguity');
check(index.search('价格:甲醇:华东:当月值').warnings.some(x=>x.includes('同名')),'same-name warning');
check(ids('华东甲醇月度价格').includes('TEST-1')&&!ids('华东甲醇月度价格').includes('TEST-2')&&!ids('华东甲醇月度价格').includes('TEST-4'),'level not YoY, frequency hard');
check(ids('甲醇当月同比').includes('TEST-2')&&!ids('甲醇当月同比').includes('TEST-1'),'YoY not level');
check(ids('华东甲醇价格，不要周频').every(x=>x!=='TEST-4'),'negative frequency never becomes positive');
check(index.search('华东甲醇价格，不要周频').intent.excludeFrequencies.includes('周'),'negative frequency visible');
check(ids('甲醇价格，来源测试周来源').join()==='TEST-4','source label parsed');
check(ids('中国甲醇价格').length===0,'unknown geo never becomes China');
check(ids('CPI').length===0,'CPI cannot match CCPI');
check(index.search('CPI').warnings.some(x=>x.includes('CCPI')),'CPI disambiguation warning');
check(ids('DMC价格').length===2,'DMC meanings remain separate');
check(index.search('DMC价格').warnings.some(x=>x.includes('化学含义')),'DMC ambiguity explicit');
check(ids('美的系空调线上当月均价').join()==='TEST-11','brand 的 preserved; price not sales, YoY or end');
check(ids('美的系空调线上当月均价同比').join()==='TEST-12','YoY current does not match end or level');
check(ids('美的系空调线上当月零售额').join()==='TEST-14','sales value not average price, volume or share');
check(ids('美的系空调线上当月零售额份额').join()==='TEST-15','share not sales amount');
check(ids('美的系空调线上当月零售量').join()==='TEST-16','volume not value');
check(ids('甲醇价格只要正常').every(x=>x!=='TEST-17'),'source health explicit');
check(ids('美的系空调线上当月均价',{industry:'测试化工'}).join()==='TEST-11','multi-industry membership');
for(const [q,f] of [
  ['月度甲醇价格',{frequency:'日'}],['美国甲醇价格',{geography:'中国'}],
  ['甲醇价格来源测试来源',{source:'另一来源'}],['家电空调',{industry:'测试化工'}],
  ['甲醇价格只要正常',{health:'停更'}],['甲醇当月同比',{transform:'原值'}],
  ['甲醇当月价格',{transform:'同比'}],['甲醇价格不要周频',{frequency:'周'}]
]){const r=index.search(q,f);check(r.total===0&&r.warnings.some(w=>w.includes('冲突')),'filter conflict explicit '+q);}
check(ids('NOTIFICATION').length===0&&index.search('NOTIFICATION').warnings.length>0,'unknown English abstains');
check(ids('玉').length===0&&index.search('玉').warnings.some(w=>w.includes('单字')),'no single-Han fallback');
check(ids('甲醇价格不要NOTIFICATION').length===0,'unsupported negative not ignored');
check(index.search('最新甲醇价格').warnings.some(w=>w.includes('数值')),'freshness not invented');
check(index.search('远程查中国CPI月度同比').intent.scope==='remote','remote intent separate');
check(index.search('远程查中国CPI月度同比').total===0,'remote CPI not hallucinated');
check(index.search('甲醇价格',{},1).results.length===1&&index.search('甲醇价格',{},1).total>1,'limit preserves total');
const pageOne=index.search('甲醇价格',{},1),pageTwo=index.search('甲醇价格',{offset:1},1);
check(pageOne.results[0].record.code!==pageTwo.results[0].record.code,'offset pagination');
check(index.search('').total===records.length,'empty query catalogue browse');
check(records[0].name==='价格:甲醇:华东:当月值','input never mutated');
check(ids('船队半年度交付艘数').join()==='SEM-1','semiannual not annual');
console.log(`PASS ${checks} deterministic catalogue-search checks (no model, no network)`);
const golden=[
 ['a000011461',['A000011461'],[]],
 ['Brent期货主连合约',['A000001444'],['A000001445']],
 ['价格:甲醇:华东:当周值',['A000011476','A000182672'],[]],
 ['华东重质纯碱周价格',['A000011461','A000446096'],['A000011460','A000642529']],
 ['纯碱当月开工率，不要环比和均值',['A000013185'],['A000239250','A000239251']],
 ['聚酯周开工率，只要正常',[],['A000012810']],
 ['纯MDI华东价格',['A000000898'],['A000012989']],
 ['聚合MDI进口外盘周价格，美元每吨',['A000012990','A000446152'],['A000012989']],
 ['美湾WTI321价差',['A000182758','A000518140'],[]],
 ['磷酸铁锂正极材料周价格，不要电解液',['A000020245'],['A000020249','A000002132']],
 ['磷酸铁锂电解液周价格，不要正极材料',['A000020249'],['A000020245']],
 ['PVDF锂电级三元周价格',['A000022340','A000440098'],['A000022341','A000440099']],
 ['DMC价差',['A000182797','A000182815'],[]],
 ['硅氧烷DMC与金属硅甲醇价差',['A000182797'],['A000182815']],
 ['美的系空调线上当月零售均价，不要同比',['D021449535'],['D021449594','D021449539']],
 ['美的系空调线上当月均价同比',['D021449594'],['D021449535','D021449597']],
 ['空调线上整体市场累计零售额份额，周频，不要同比和零售量',['A000340336'],['A000340337','A000340697']],
 ['SCFI综合指数周值',['A000591059'],['A000591066']],
 ['冰箱产销率期末月值',['A000504615'],[]],
 ['海尔系空调线下当月均价',['D021449819'],['D021449540','D021449824','D021449598']],
 ['远程查中国CPI月度同比',[],['A000011550']],
 ['美国商业原油库存周',['A000000743'],[]],
 ['西班牙摩托车注册量当月同比',['A000640486','A000640514'],[]],
 ['NOTIFICATION',[],[]],
 ['甲醇开工率，来源百川资讯',['A000013167'],[]],
];
const candidate=process.env.INDICATOR_CATALOG || '/workspace/indicator-lab-private/catalog.json';
if(fs.existsSync(candidate)) {
  const catalog=JSON.parse(fs.readFileSync(candidate,'utf8'));
  const started=performance.now(), full=createIndex(catalog.records), buildMS=performance.now()-started;
  const timings=[];
  for(const [q,want,no] of golden){
    const t=performance.now(),r=full.search(q,{},200);timings.push(performance.now()-t);
    const actual=r.results.map(x=>x.record.code);
    for(const code of want)assert.ok(actual.includes(code),`${q}: missing ${code}; intent=${JSON.stringify(r.intent)}`);
    for(const code of no)assert.ok(!actual.includes(code),`${q}: forbidden ${code}`);
    if(q==='NOTIFICATION'||q.startsWith('远程查中国CPI'))assert.equal(r.total,0,q);
  }
  const disputed=full.search('甲醇价格，来源百川资讯');
  assert.equal(disputed.intent.source,'百川资讯');assert.equal(disputed.total,0,'source has only utilization metadata; do not relax price');
  const nonWeekly=full.search('华东纯碱价格不要周频');
  assert.equal(nonWeekly.intent.frequency,'');assert.ok(nonWeekly.intent.excludeFrequencies.includes('周'));
  assert.ok(nonWeekly.results.every(x=>x.record.frequency!=='周'));
  const aggregate=full.search('西班牙摩托车注册量当月同比');
  assert.deepEqual(aggregate.results.slice(0,2).map(x=>x.record.code).sort(),['A000640486','A000640514']);
  console.log(`PASS ${golden.length} private full-catalogue golden queries against ${catalog.records.length} entities; index ${Math.round(buildMS)}ms, max search ${Math.round(Math.max(...timings))}ms`);
} else console.log('SKIP private full-catalogue golden suite: set INDICATOR_CATALOG to the local exported catalogue (not committed).');
