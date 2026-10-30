/* Deterministic catalogue retrieval. Scores rank candidates; they are not probabilities.
 * No model, remote requests, observations or economic causality are inferred here. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IndicatorSearch = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const normalize = value => String(value == null ? '' : value).normalize('NFKC').toLowerCase()
    .replace(/[\s:：,，;；()（）\[\]【】{}_'"“”‘’。?？!！、]/g, '');
  const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Aliases only broaden a concept, never equate its country, grade or transform.
  // DMC intentionally has no single expansion: two different chemicals use it.
  const SYNONYMS = [
    ['cpi', '居民消费价格指数', '居民消费物价指数'],
    ['ppi', '工业生产者出厂价格指数', '生产者价格指数'],
    ['pmi', '采购经理指数'], ['甲醇', 'meoh', 'methanol'],
    ['布伦特', 'brent'], ['wti', '西德克萨斯中质原油', '西德克萨斯'],
    ['聚偏氟乙烯', 'pvdf'], ['磷酸铁锂', 'lifepo4', 'lfp'],
    ['scfi', '上海出口集装箱运价指数'], ['ccfi', '中国出口集装箱运价指数'],
    ['碳酸钠', '纯碱'], ['碳酸氢钠', '小苏打'], ['钛白粉', '二氧化钛'],
    ['纯mdi', '纯二苯基甲烷二异氰酸酯'], ['聚合mdi', '聚合二苯基甲烷二异氰酸酯'],
    ['六氟磷酸锂', 'lipf6'], ['二甲基环硅氧烷', '硅氧烷'],
    ['产销率', '产销比率'], ['开工率', '开工负荷', '开工负荷率'],
    ['均价', '平均价'], ['锂电级', '锂电池用', '锂电池级'], ['运价', '运费'], ['零售均价', '零售平均价格'],
    ['欧线', '欧洲航线'], ['美元/吨', '美元每吨'], ['美元/桶', '美元每桶'],
    ['元/吨', '人民币每吨', '人民币/吨'], ['万元/吨', '万元每吨'], ['%', '百分比'], ['千桶', '千桶'], ['万吨', '万吨'], ['美金/teu', '美元/teu'],
  ].map(group => group.map(normalize));
  const FREQUENCIES = [
    ['半年', /(?:半年度|半年频|半年值)/g],
    ['旬', /(?:每旬|旬频|旬度|当旬值|当旬|旬值)/g],
    ['日', /(?:每日|每天|日频|日度|当日值|当日|日报|日值|日价格|日价|日$)/g],
    ['周', /(?:每周|每星期|周频|周度|当周值|当周|周值|周价格|周价|周开工率|周开工|周库存|周$)/g],
    ['月', /(?:每月|月频|月度|当月值|当月|月值|月价格|月价|月开工率|月开工|月库存|月环比|月同比|月$)/g],
    ['季', /(?:每季度|每季|季度|季频|当季)/g],
    ['年', /(?:每年|年频|年度|当年)/g],
  ];
  const GEO_GROUPS = [
    ['中国台湾', '台湾'], ['中国香港', '香港'], ['中国', '全国', '国内'],
    ['美国', '美國'], ['日本'], ['欧元区'], ['欧盟'], ['欧洲'], ['韩国'], ['德国'], ['法国'],
    ['英国'], ['西班牙'], ['意大利'], ['印度'], ['巴西'], ['俄罗斯'], ['东南亚'],
    ['华东'], ['华北'], ['华南'], ['华中'], ['东北'], ['西南'], ['西北'], ['美湾'],
    ['上海', '沪市'], ['北京'], ['天津'], ['重庆'], ['山东'], ['广东'], ['江苏'], ['浙江'],
    ['河北'], ['河南'], ['湖北'], ['湖南'], ['四川'], ['云南'], ['内蒙古'], ['新疆'],
  ].map(group => group.map(normalize));
  const TRANSFORM_WORDS = [
    ['yoy', ['同比', '较上年同期']], ['mom', ['环比', '较上期']],
    ['cumulative', ['累计']], ['average', ['均值', '移动平均', '平均值']],
    ['end', ['期末']], ['current', ['当期']], ['difference', ['差值', '增减百分点', '同比变化']],
  ];
  const NOISE = ['帮我查询一下', '请帮我查一下', '请帮我', '帮我查一下', '我想看一下', '我想查询', '我想查',
    '我想看', '给我查一下', '给我查询', '帮我找', '帮我查', '查询一下', '查看一下', '搜索一下',
    '想要查看', '想查看', '想看看', '想看', '查询', '搜索', '查找', '找出', '查看', '指标名称', '指标',
    '只要', '只看', '只查', '只搜索', '请问', '请', '一下', '数据', '以及', '或者', '和', '与', '及'];
  const DEFAULT_ENTITIES = ['纯mdi', '聚合mdi', 'mdi', 'tdi', 'hdi', 'ipdi', 'tpu', 'ptfe', 'fep', 'pfa',
    'fkｍ', 'fkm', 'dmc', 'wti321', 'brent321', '原油', '重质', '轻质', '轻碱', '重碱', '纯碱',
    '聚酯', '苯胺', '甲醛', '纯苯', '金属硅', '锂电级', '三元', 'lpf', '电解液', '正极材料',
    '煤', '烟煤', '冰箱', '空调', '洗衣机', '白羽肉鸡', '美的系', '海尔系', '海信系', '格力系',
    '线上', '线下', '整体市场', '零售额份额', '零售量份额', '零售额', '零售量', '零售均价',
    '进口外盘', '期货', '主连', '连续', '结算价', '综合指数', '当周值', '当月值', '期末值'];
  const measureRules = [
    ['spread', /价差/g, ['价差']], ['utilization', /(?:开工率|开工负荷率|开工负荷)/g, ['开工率', '负荷']],
    ['inventory', /(?:库存|库存量)/g, ['库存']], ['sales_ratio', /产销率/g, ['产销率']],
    ['price', /(?:价格|均价|售价|结算价|市场价)/g, ['价格', '均价', '售价', '结算价', '市场价', '运价']],
  ];
  function synonymGroup(term) { return SYNONYMS.find(g => g.includes(term)) || [term]; }
  const termPatterns = new Map();
  function contains(text, term) {
    if (!term) return false;
    // Latin codes cannot match inside another code (CPI must never match CCPI).
    if(!/^[a-z0-9]+$/.test(term))return text.includes(term);
    if(!termPatterns.has(term))termPatterns.set(term,new RegExp('(^|[^a-z0-9])'+escapeRE(term)+'(?![a-z0-9])'));
    return termPatterns.get(term).test(text);
  }
  function splitIndustry(record) {
    return Array.isArray(record.industries) ? record.industries : [record.industry || ''];
  }
  function feature(record) {
    const text = normalize(record.name);
    const tags = new Set();
    if (/同比|较上年同期/.test(text)) tags.add('yoy');
    if (/环比|较上期/.test(text)) tags.add('mom');
    if (text.includes('累计')) tags.add('cumulative');
    if (/均值|移动平均|平均值/.test(text)) tags.add('average');
    if (text.includes('期末')) tags.add('end');
    if (/差值|同比变化|同比增减|增减百分点/.test(text)) tags.add('difference');
    if (/当[日周月季年]值|当期值/.test(text)) tags.add('current');
    return tags;
  }
  function parseQuery(query, context) {
    const raw = String(query == null ? '' : query).trim();
    let work = normalize(raw);
    const intent = {query: raw, terms: [], frequency: '', frequencies: [], excludeFrequencies: [], transforms: [], excludeTransforms: [], geographies: [], source: '', industry: '', health: '', measure: '', negativeTerms: [], units: [], code: '', unsupported: [], unrecognizedTerms: [], scope: /远程|远端|联网/.test(raw) ? 'remote' : 'local'};
    const warnings = [];
    if(intent.scope==='remote'){work=work.replace(/远程|远端|联网/g,'').replace(/^查/,'');warnings.push('本引擎仅检索当前目录；远程连接、授权与实时数据状态须单独验证。');}
    const add = (list, item) => { if (!list.includes(item)) list.push(item); };
    const negativeMarkers = '(?:不是|不要|不看|排除|不含|不包括|非)';
    // Scope a negative list up to punctuation or an explicit change of scope.
    const negativeList = new RegExp(negativeMarkers + '([^,，;；。]+)', 'g');
    for(const match of raw.matchAll(/除(?:了)?([^,，;；。]+?)以外/g)){
      const term=normalize(match[1]);add(intent.negativeTerms,term);work=work.replace(normalize(match[0]),'');
    }
    for (const match of raw.matchAll(negativeList)) {
      const phrase = normalize(match[1].split(/但|只要|只看|而是/)[0]);
      let simplePhrase=phrase;
      for(const [combined,label] of [['cumulative_yoy','累计同比'],['cumulative_mom','累计环比']]){
        if(simplePhrase.includes(label)){add(intent.excludeTransforms,combined);simplePhrase=simplePhrase.replaceAll(label,'');work=work.replace(label,'');}
      }
      for(const fragment of match[1].split(/和|、|与|及/)){
        const piece=normalize(fragment);
        const negativeFrequency = [['日',['日','日频','日度','每日']],['周',['周','周频','周度','每周']],['月',['月','月频','月度','每月']],['季',['季','季频','季度','每季']],['年',['年','年频','年度','每年']],['半年',['半年频','半年度','半年']],['旬',['旬频','旬度','每旬','旬']]].find(([,words])=>words.includes(piece));
        if(negativeFrequency){add(intent.excludeFrequencies,negativeFrequency[0]);work=work.replaceAll(piece,'');continue;}
        if(!piece || TRANSFORM_WORDS.some(([,words])=>words.some(w=>piece.startsWith(w))))continue;
        const entity=longest(context?context.lexicon:makeLexicon(DEFAULT_ENTITIES.concat(SYNONYMS.flat())),piece,0);
        if(entity){add(intent.negativeTerms,entity);work=work.replaceAll(entity,'');}
        else {intent.unsupported.push('negative_scope');warnings.push('有未能安全解析的排除对象，需明确产品或口径：'+piece);}
      }
      for (const [tag, words] of TRANSFORM_WORDS) {
        if (words.some(w => simplePhrase.includes(w))) add(intent.excludeTransforms, tag);
      }
      for (const entity of ['电解液', '正极材料', '零售量', '零售额', '轻质', '重质', '线上', '线下']) {
        if (phrase.includes(entity)) add(intent.negativeTerms, normalize(entity));
      }
      // Do not remove arbitrary free text; known negative dimensions are removed below.
      for (const [tag, words] of TRANSFORM_WORDS) {
        if (intent.excludeTransforms.includes(tag)) for (const w of words) work = work.replaceAll(w, '');
      }
      for (const term of intent.negativeTerms) work = work.replaceAll(term, '');
      work = work.replace(/不是|不要|不看|排除|不含|不包括/g, '');
    }
    if (/最新|实时|近\d+[年月周日]|最近|历史|趋势|折线图|柱状图|异常|最高|最低|增长最快|相关性|因果|预测|计算/.test(raw)) {
      warnings.push('目录没有观测日期和数值：时间范围、最新值、数值异常或统计分析不能在目录检索中验证。');
      work = work.replace(/最新|实时|最近|历史|趋势|折线图|柱状图|最高|最低|增长最快|相关性|因果|预测|计算|近\d+[年月周日]|20\d{2}年/g, '');
      intent.unsupported.push('observation_analysis');
    }
    const code = work.match(/(?:^|[^a-z0-9])([ad]\d{6,})(?![a-z0-9])/i);
    if (code) {intent.code = code[1]; work = work.replace(code[1], '');}
    for (const [tag, words] of TRANSFORM_WORDS) {
      if (words.some(w => work.includes(w))) {
        intent.transforms.push(tag);
        words.forEach(w => {work = work.replaceAll(w, '');});
      }
    }
    // Match before deleting period words; "当月同比" means monthly YoY, not level.
    for (const [frequency, re] of FREQUENCIES) {
      let original = normalize(raw.replace(new RegExp(negativeMarkers + '(同比|环比|累计|均值)', 'g'), ''));
      for(const f of intent.excludeFrequencies)original=original.replace(new RegExp(f+'频|'+f+'度|每'+f+'|'+f,'g'),'');
      if(frequency==='年')original=original.replace(/半年度|半年频|半年值/g,'');
      re.lastIndex = 0;
      if (re.test(original)) add(intent.frequencies, frequency);
      re.lastIndex = 0;
      work = work.replace(re, match => {
        if (/价格|价$/.test(match)) return '价格';
        if (/开工/.test(match)) return '开工率';
        if (/库存/.test(match)) return '库存';
        if (/环比/.test(match)) return '环比';
        if (/同比/.test(match)) return '同比';
        return '';
      });
    }
    if (intent.frequencies.length === 1) intent.frequency = intent.frequencies[0];
    if (intent.frequencies.length > 1) warnings.push('查询含多个频率，按任一频率列出；请选择明确频率以消歧。');
    if (/当[日周月季年]/.test(normalize(raw)) && !intent.transforms.includes('cumulative')) intent.period_basis = 'current';
    // Process long geo labels first so 中国台湾 does not become 中国 + 台湾.
    for (const group of GEO_GROUPS) {
      const alias = group.find(g => work.includes(g));
      if (alias) {add(intent.geographies, group[0]); group.forEach(g => {work = work.replaceAll(g, '');});}
    }
    if (intent.geographies.length > 1) warnings.push('检测到多个地区，按地区并列候选，不合并为同一序列。');
    const industries = context ? context.industries : [];
    const industryAliases = [['家电', '家用电器'], ['电新', '电力设备'], ['化工行业', '基础化工']];
    for (const [alias, canonical] of industryAliases) {
      if (work.includes(alias) && industries.includes(canonical)) {intent.industry = canonical; work = work.replaceAll(alias, '');}
    }
    for (const value of industries) {
      if (value.length > 1 && work.includes(normalize(value))) {intent.industry = value; work = work.replaceAll(normalize(value), '');break;}
    }
    if (/只要正常|只看正常|健康正常|正常指标|正常的/.test(raw)) {intent.health = '正常';work = work.replace(/正常/g, '');}
    else if (/停更|停止更新/.test(work)) {intent.health = '停更';work = work.replace(/停更|停止更新/g, '');}
    else if (/预警/.test(work)) {intent.health = '预警';work = work.replace(/预警/g, '');}
    for (const source of (context ? context.sources : [])) {
      if (source.length > 1 && work.includes(normalize(source))) {intent.source=source;work=work.replaceAll(normalize(source),'');break;}
    }
    if(intent.source)work=work.replace(/指标来源|数据来源|数据源|来源为|来源是|来源/g,'');
    for (const g of SYNONYMS.filter(g => g[0].includes('/'))) {
      const alias = g.find(a => work.includes(a));
      if (alias) {intent.units.push(g[0]);work=work.replaceAll(alias,'');}
    }
    if(intent.units.length)work=work.replace(/单位为|单位是|单位/g,'');
    const semanticText=normalize(raw.replace(new RegExp(negativeMarkers+'[^,，;；。]+','g'),''));
    const retailKinds=[['retail_value_share','零售额份额'],['retail_volume_share','零售量份额'],['retail_price','零售均价'],['retail_value','零售额'],['retail_volume','零售量']];
    const retailKind=retailKinds.find(([,word])=>semanticText.includes(word));
    if(retailKind)intent.metric_kind=retailKind[0];
    else if(/均价|平均价/.test(semanticText))intent.metric_kind='average_price';
    else if(semanticText.includes('库存')&&!semanticText.includes('库存天数'))intent.metric_kind='inventory_level';
    const changeRequested=intent.transforms.some(t=>t==='yoy'||t==='mom'||t==='difference');
    intent.default_level=!changeRequested && /价格|均价|开工率|产销率|零售额|零售量|库存|销量|产量|注册量|份额/.test(semanticText);
    // Full long measure phrases stay lexical to preserve 零售额份额 vs 零售量份额.
    if (!/零售|产销/.test(work)) for (const [measure,re] of measureRules) {
      re.lastIndex=0;
      if (re.test(work)) {
        intent.measure=measure;re.lastIndex=0;work=work.replace(re,'');break;
      }
    }
    work = work.replace(/周频|月频|日频|年频|季频|频率|期末值|期末|当期值|当期|当月值|当周值|日值|周值|月值/g,'');
    NOISE.forEach(word => {work=work.replaceAll(normalize(word),'');});
    work=work.replace(/[+\-/]/g,' ');
    const remaining=work.split(/\s+/).filter(Boolean);
    const lexicon=context ? context.lexicon : makeLexicon(DEFAULT_ENTITIES.concat(SYNONYMS.flat()));
    let unknown='';
    for (const chunk of remaining) {
      let at=0;
      while(at<chunk.length) {
        const match=longest(lexicon,chunk,at);
        if (match) {if(unknown){add(intent.terms,unknown);unknown='';}add(intent.terms,match);at+=match.length;}
        else if(chunk[at]==='的' && !unknown)at++;
        else {unknown+=chunk[at];at++;}
      }
      if(unknown){add(intent.terms,unknown);unknown='';}
    }
    for(const t of intent.terms){if(t.length===1){intent.unrecognizedTerms.push(t);warnings.push('未识别的单字不作模糊匹配：'+t);}}
    if (intent.terms.includes('均价') && !intent.terms.includes('零售均价') && raw.includes('零售')) {
      intent.terms=intent.terms.filter(t=>t!=='均价'&&t!=='零售');intent.terms.push('零售均价');
    }
    if (intent.terms.some(t => /^[a-z]{12,}$/.test(t) && !SYNONYMS.some(g=>g.includes(t)))) warnings.push('包含未识别的长英文词；不会按单字拆分或静默扩大匹配。');
    if (work.includes('dmc') && !/硅氧烷|碳酸二甲酯/.test(raw)) warnings.push('DMC 有不同化学含义：二甲基环硅氧烷与碳酸二甲酯，需结合原名和应用消歧。');
    if (/cpi/i.test(raw) && !/ccpi/i.test(raw)) warnings.push('CPI 与 CCPI 化工品价格指数不是同一个指标。');
    if (intent.terms.includes('lfp')) warnings.push('LFP 不自动匹配原文 LPF；疑似拼写需人工审核。');
    return {intent,warnings};
  }
  function makeLexicon(terms) {
    const root=Object.create(null);
    for (let word of terms) {
      word=normalize(word);
      if(word.length<2 || word.length>55)continue;
      let node=root;
      for(const char of word)node=node[char]||(node[char]=Object.create(null));
      node.$=word;
    }
    return root;
  }
  function longest(root,text,at) {
    let node=root,found='';
    for(let i=at;i<text.length;i++) {
      node=node[text[i]];if(!node)break;
      if(node.$ && (!/[a-z0-9]/.test(text[i]) || !/[a-z0-9]/.test(text[i+1]||'')))found=node.$;
    }
    return found;
  }
  function createIndex(records) {
    if (!Array.isArray(records)) throw new TypeError('records must be an array');
    const entities=DEFAULT_ENTITIES.concat(SYNONYMS.flat());
    const industries=[...new Set(records.flatMap(splitIndustry).filter(Boolean))].sort((a,b)=>b.length-a.length);
    const sources=[...new Set(records.map(r=>r.source).filter(Boolean))].sort((a,b)=>b.length-a.length);
    for (const r of records) {
      for (const fragment of String(r.name||'').normalize('NFKC').split(/[:：()（）,，\s]+/)) {
        if(!/^(?:当|本|期末|最新|累计|12个月|同比|环比|零售均价|价格|开工率)/.test(fragment))entities.push(fragment);
      }
      for(const alias of r.aliases||[])if(String(alias).length<55)entities.push(alias);
    }
    const lexicon=makeLexicon(entities);
    const entries=records.map((record,position)=>({record,position,name:normalize(record.name),code:normalize(record.code),aliases:(record.aliases||[]).map(normalize),base:normalize(record.base_name||''),tags:feature(record),geo:normalize(record.geography||''),source:normalize(record.source),unit:normalize(record.unit)}));
    const codeSet=new Set(entries.map(e=>e.code));
    const exactNames=new Map();
    for(const e of entries){const list=exactNames.get(e.name)||[];list.push(e);exactNames.set(e.name,list);}
    const context={industries,sources,lexicon};
    function search(query, filters, limit) {
      filters=filters||{};limit=Math.min(200,Math.max(1,Number(limit)||40));
      const {intent,warnings}=parseQuery(query,context);
      const q=normalize(query), out=[];
      const exactName=exactNames.has(q);
      const exactAlias=entries.some(e=>e.aliases.includes(q));
      const direct=exactName||exactAlias||codeSet.has(q);
      const selectedFrequency=filters.frequency||intent.frequency;
      const industry=filters.industry||intent.industry;
      const health=filters.health||intent.health;
      const role=filters.role;
      const filterTransform=filters.transform;
      const conflicts=[];
      if(filters.frequency && intent.frequencies.length && !intent.frequencies.includes(filters.frequency))conflicts.push('自然语言频率与筛选频率不同');
      if(filters.frequency && intent.excludeFrequencies.includes(filters.frequency))conflicts.push('筛选频率被自然语言明确排除');
      if(filters.industry && intent.industry && filters.industry!==intent.industry)conflicts.push('自然语言行业与筛选行业不同');
      if(filters.health && intent.health && filters.health!==intent.health)conflicts.push('自然语言健康标记与筛选标记不同');
      if(filters.source && intent.source && filters.source!==intent.source)conflicts.push('自然语言来源与筛选来源不同');
      if(filters.geography && intent.geographies.length){
        const n=normalize(filters.geography),canonical=(GEO_GROUPS.find(g=>g.includes(n))||[n])[0];
        if(!intent.geographies.includes(canonical))conflicts.push('自然语言地区与筛选地区不同');
      }
      if(filterTransform){
        const tags=feature({name:filterTransform});
        if(intent.transforms.some(t=>!tags.has(t)))conflicts.push('自然语言变换口径与筛选口径不同');
        if(intent.excludeTransforms.some(t=>t==='cumulative_yoy'?(tags.has('cumulative')&&tags.has('yoy')):t==='cumulative_mom'?(tags.has('cumulative')&&tags.has('mom')):tags.has(t)))conflicts.push('筛选口径被自然语言明确排除');
        if(intent.period_basis==='current'&&(tags.has('cumulative')||tags.has('end')))conflicts.push('自然语言当期口径不能替换为累计或期末');
        if(intent.default_level&&(tags.has('yoy')||tags.has('mom')||tags.has('average')||tags.has('difference')))conflicts.push('自然语言请求指标水平，但筛选选择了增长或均值');
      }
      if(conflicts.length){intent.conflicts=[...new Set(conflicts)];return {results:[],intent,warnings:[...new Set([...warnings,...conflicts.map(c=>'条件冲突：'+c+'；请修改查询或筛选，不自动覆盖任一方。')])],total:0};}
      const matchGeo=(e,geo)=> {
        const group=GEO_GROUPS.find(g=>g[0]===geo)||[geo];
        return group.some(g=>contains(e.name,g)||contains(e.geo,g));
      };
      const termMatch=(e,term)=> {
        const group=synonymGroup(term);
        let best=0,label='';
        for(const t of group) {
          if(contains(e.name,t)){const score=t===term?24:17;if(score>best){best=score;label=t===term?'名称词':'同义词';}}
          else if(e.aliases.some(a=>contains(a,t)) && best<16){best=16;label='Excel别名';}
        }
        return {score:best,label};
      };
      for(const e of entries) {
        const r=e.record,reasons=[];
        if(intent.code && e.code!==intent.code)continue;
        if(industry && !splitIndustry(r).includes(industry))continue;
        if(selectedFrequency && r.frequency!==selectedFrequency)continue;
        if(intent.excludeFrequencies.includes(r.frequency))continue;
        if(!selectedFrequency && intent.frequencies.length>1 && !intent.frequencies.includes(r.frequency))continue;
        if(health && r.health!==health)continue;
        if(role && !(r.roles||[r.role]).includes(role))continue;
        if(filterTransform && r.transform!==filterTransform)continue;
        if(filters.source && r.source!==filters.source)continue;
        if(filters.geography && !matchGeo(e,normalize(filters.geography)))continue;
        let score=0,match_type='关键词与口径';
        const codeExact=e.code===q || intent.code===e.code;
        const nameExact=e.name===q;
        const aliasExact=e.aliases.includes(q);
        // Exact full names/aliases retain the source's semantics. User-selected
        // filters still apply; parsed dimensions may be aliases' own wording.
        if(direct && !(codeExact||nameExact||aliasExact))continue;
        if(!direct) {
          if(intent.unrecognizedTerms.length||intent.unsupported.includes('negative_scope'))continue;
          if(intent.transforms.some(t=>!e.tags.has(t)))continue;
          if(intent.excludeTransforms.some(t=>t==='cumulative_yoy'?(e.tags.has('cumulative')&&e.tags.has('yoy')):t==='cumulative_mom'?(e.tags.has('cumulative')&&e.tags.has('mom')):e.tags.has(t)))continue;
          if(intent.period_basis==='current' && (e.tags.has('cumulative')||e.tags.has('end')))continue;
          if(intent.default_level && (e.tags.has('yoy')||e.tags.has('mom')||e.tags.has('average')||e.tags.has('difference')))continue;
          if(intent.metric_kind==='retail_value_share'&&!e.name.includes('零售额份额'))continue;
          if(intent.metric_kind==='retail_volume_share'&&!e.name.includes('零售量份额'))continue;
          if(intent.metric_kind==='retail_price'&&!e.name.includes('零售均价'))continue;
          if(intent.metric_kind==='retail_value'&&(!e.name.includes('零售额')||e.name.includes('份额')))continue;
          if(intent.metric_kind==='retail_volume'&&(!e.name.includes('零售量')||e.name.includes('份额')))continue;
          if(intent.metric_kind==='average_price'&&!/均价|平均价|平均价格/.test(e.name))continue;
          if(intent.metric_kind==='inventory_level'&&e.name.includes('库存天数'))continue;
          if(intent.negativeTerms.some(t=>contains(e.name,t)))continue;
          if(intent.geographies.length && !intent.geographies.some(g=>matchGeo(e,g)))continue;
          if(intent.source && e.source!==normalize(intent.source))continue;
          if(intent.units.length && !intent.units.some(t=>synonymGroup(t).includes(e.unit)))continue;
          if(intent.measure) {
            const rule=measureRules.find(x=>x[0]===intent.measure);
            if(!rule[2].some(t=>e.name.includes(t)))continue;
            if(intent.measure==='price' && e.name.includes('价差'))continue;
          }
          let missed=false;
          for(const term of intent.terms) {
            const m=termMatch(e,term);
            if(!m.score){missed=true;break;}
            score+=m.score;reasons.push(`${m.label}：${term}`);
          }
          if(missed)continue;
          if(!intent.terms.length && !intent.code && !industry && !health && !intent.measure && !intent.transforms.length && !intent.geographies.length && !intent.source && !selectedFrequency && !filterTransform && !role && q) continue;
          score+=intent.transforms.length*8+intent.geographies.length*7+(intent.source?7:0)+(intent.measure?5:0);
        }
        if(codeExact){score+=100000;match_type='代码精确';reasons.unshift('指标代码精确匹配');}
        else if(nameExact){score+=90000;match_type='名称精确';reasons.unshift('原始名称精确匹配，未合并不同代码');}
        else if(aliasExact){score+=80000;match_type='别名精确';reasons.unshift('Excel 已有别名精确匹配');}
        if(!q){match_type='目录浏览';score=0;}
        if(selectedFrequency)reasons.push(`频率约束：${selectedFrequency}`);
        if(industry)reasons.push(`原行业约束：${industry}`);
        if(health)reasons.push(`原健康标记：${health}`);
        if(intent.geographies.length)reasons.push(`地区约束：${intent.geographies.join(' / ')}`);
        if(intent.default_level)reasons.push('指标水平检索：未请求同比/环比，不以增长率或移动均值替代');
        if(intent.period_basis==='current')reasons.push('当期口径：排除累计和期末值');
        if(intent.metric_kind)reasons.push('计量对象约束：'+intent.metric_kind);
        if(intent.excludeFrequencies.length)reasons.push('排除频率：'+intent.excludeFrequencies.join(' / '));
        if(intent.transforms.length)reasons.push(`口径约束：${intent.transforms.join(' / ')}`);
        if(intent.excludeTransforms.length)reasons.push(`排除口径：${intent.excludeTransforms.join(' / ')}`);
        // Prefer a focused object over branded subseries when a generic aggregate
        // was requested. This ranks; it never hides valid specific candidates.
        if(!direct && intent.terms.length)score-=Math.min(15,Math.max(0,e.name.length-intent.terms.join('').length)*0.08);
        out.push({record:r,score,match_type,reasons});
      }
      out.sort((a,b)=>b.score-a.score || String(a.record.code||a.record.id).localeCompare(String(b.record.code||b.record.id)));
      if(out.length && (exactName || out.slice(0,8).some((x,i,a)=>a.some((y,j)=>i!==j&&normalize(y.record.name)===normalize(x.record.name)))))warnings.push('存在同名不同代码或来源的候选；按频率、单位、来源、地区与健康状态消歧，未自动合并。');
      if(intent.geographies.length)warnings.push('未明确地区的记录不自动认作中国或全国。');
      if(!out.length && q)warnings.push('没有满足全部已识别条件的结果；没有自动放宽地区、频率、单位或统计口径。');
      const offset=Math.max(0,Number(filters.offset)||0);
      return {results:out.slice(offset,offset+limit),intent,warnings:[...new Set(warnings)],total:out.length};
    }
    return {search,size:records.length,facets:{industries,sources},parseQuery:query=>parseQuery(query,context)};
  }
  return {createIndex,normalize,parseQuery,SYNONYMS};
});
