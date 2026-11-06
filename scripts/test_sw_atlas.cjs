"use strict";
const fs = require("node:fs"), assert = require("node:assert/strict");
const data=JSON.parse(fs.readFileSync("assets/sw-atlas.json","utf8"));
const expected={"801010":"农林牧渔","801030":"基础化工","801040":"钢铁","801050":"有色金属","801080":"电子","801110":"家用电器","801120":"食品饮料","801130":"纺织服饰","801140":"轻工制造","801150":"医药生物","801160":"公用事业","801170":"交通运输","801180":"房地产","801200":"商贸零售","801210":"社会服务","801230":"综合","801710":"建筑材料","801720":"建筑装饰","801730":"电力设备","801740":"国防军工","801750":"计算机","801760":"传媒","801770":"通信","801780":"银行","801790":"非银金融","801880":"汽车","801890":"机械设备","801950":"煤炭","801960":"石油石化","801970":"环保","801980":"美容护理"};
assert.equal(data.sectors.length,31);
assert.deepEqual(Object.fromEntries(data.sectors.map(s=>[s.code,s.name])),expected);
assert.equal(new Set(data.sectors.map(s=>s.code)).size,31);
for(const s of data.sectors){
  assert.ok(typeof s.group==="string"&&s.group.length);
  for(const key of ["essence","boundary","lens"])assert.ok(typeof s[key]==="string"&&s[key].length>8,s.name+":"+key);
  for(const [key,min] of [["chains",3],["metrics",5],["methods",2],["themes",3],["pitfalls",3],["sources",1]])assert.ok(Array.isArray(s[key])&&s[key].length>=min,s.name+":"+key);
  for(const c of s.chains)for(const key of ["name","up","mid","down","value","risk"])assert.ok(typeof c[key]==="string"&&c[key].trim(),s.name+":"+key);
  for(const m of s.metrics)for(const key of ["name","unit","cadence","meaning","watch","trap"])assert.ok(typeof m[key]==="string"&&m[key].trim(),s.name+":"+key);
  for(const m of s.methods){assert.ok(m.steps.length>=2);assert.ok(m.proof&&m.refute);}
  const ids=new Set(s.sources.map(r=>r.id));assert.equal(ids.size,s.sources.length);
  assert.ok(s.sources.some(r=>r.status.includes("已读")||r.status.includes("已核")),s.name+": no read source");
  for(const r of s.sources){assert.match(r.id,/^[a-zA-Z0-9_-]+$/);assert.ok(/^https?:\/\//.test(r.url));assert.ok(r.scope&&r.status&&r.title);}
  for(const t of s.themes){assert.ok(t.mechanism&&t.stage&&t.verify&&t.falsify);assert.ok(t.sourceIds.length);for(const id of t.sourceIds)assert.ok(ids.has(id),s.name+":"+id);}
}
for(const path of ["assets/sw-atlas.js","assets/industry-research.js"])new Function(fs.readFileSync(path,"utf8"));
const html=fs.readFileSync("atlas.html","utf8");assert.ok(html.includes('id="sw-atlas"'));assert.ok(html.includes("assets/sw-atlas.js"));assert.ok(html.includes("assets/sw-atlas.css"));
for(const code of Object.keys(expected))assert.ok(html.includes("sw="+code),code+": static catalog link");
console.log("PASS SW2021: all 31 names/codes, unique coverage, complete industry-specific chains/metrics/methods/themes, evidence scopes and source integrity, JavaScript syntax and static catalog");
