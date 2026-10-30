"""Explainable catalog retrieval. No hidden LLM, vector service, or value forecast."""
from __future__ import annotations
import json
import re
import sqlite3
from .catalog import normalize

# Restricted domain lexicon, not an assertion that similar series are identical.
SYNONYMS = {
    '重质纯碱':['重质纯碱','重质碱','重碱','纯碱重质'], '轻质纯碱':['轻质纯碱','轻质碱','轻碱','纯碱轻质'], '磷酸铁锂':['磷酸铁锂','LFP'], '正极材料':['正极材料'], '电解液':['电解液'], '零售均价':['零售均价'], '零售量':['零售量'], '零售额':['零售额'], '美的':['美的','美的系'], '美的系':['美的系'], '格力系':['格力系'], '海尔系':['海尔系'], '线上':['线上'], '线下':['线下'], '综合指数':['综合指数'],
    '布油':['布伦特','brent'], '布伦特':['布伦特','brent'], 'brent':['布伦特','brent'],
    '美油':['WTI','西德克萨斯'], 'wti':['WTI','西德克萨斯'],
    '烧碱':['烧碱','氢氧化钠'], '氢氧化钠':['氢氧化钠','烧碱'],
    '纯碱':['纯碱','碳酸钠'], '碳酸钠':['碳酸钠','纯碱'],
    '螺纹':['螺纹钢','螺纹'], '水泥':['水泥'], '甲醇':['甲醇','methanol'],
    '聚氯乙烯':['聚氯乙烯','PVC'], 'pvc':['PVC','聚氯乙烯'],
    '聚丙烯':['聚丙烯','PP'], '聚乙烯':['聚乙烯','PE'],
    '聚酯':['聚酯'], 'pta':['PTA','精对苯二甲酸'], 'mdi':['MDI','二苯基甲烷二异氰酸酯'],
    'tdi':['TDI','甲苯二异氰酸酯'], 'scfi':['SCFI','上海出口集装箱运价指数'],
    'ccfi':['CCFI','中国出口集装箱运价指数'],
    '开工率':['开工率','开工负荷','负荷率'], '负荷率':['负荷率','开工负荷','开工率'],
    '价格':['价格','市场价','出厂价','结算价','收盘价','均价','现货价','期货价'],
    '库存':['库存','港口存量'], '产量':['产量'], '销量':['销量','销售量'],
    '进口':['进口'], '出口':['出口'], '产能':['产能'], '利润':['利润'],
    '营收':['营业收入','营收'], '营业收入':['营业收入','营收'],
    '房地产':['房地产','地产'], '汽车':['汽车'], '家电':['家电'],
    '空调':['空调'], '冰箱':['冰箱'], '铜':['铜'], '铝':['铝'],
    '黄金':['黄金'], '铁矿石':['铁矿石'], '钢材':['钢材'], '煤炭':['煤炭'],
    '原油':['原油'], '天然气':['天然气'], '锂电池':['锂电池','锂离子电池'],
    '光伏':['光伏'], '半导体':['半导体'], '芯片':['芯片','集成电路'],
    '港口':['港口'], '社会库存':['社会库存','社会存量'], '厂库':['厂库','厂家库存','企业库存'],
}
FREQUENCIES = {'月度':'月','月频':'月','按月':'月','日度':'日','日频':'日','按日':'日','周度':'周','周频':'周','按周':'周','季度':'季','季频':'季','年度':'年','年频':'年'}


def parse_query(query):
    s=query.strip()
    exclude=[]; warnings=[]
    for token in ['累计同比','累计环比','同比','环比','累计']:
        if re.search(r'(?:不要|不含|排除|不看|非)\s*'+token,s):
            exclude += {'同比':['同比','累计同比'],'环比':['环比','累计环比'],'累计':['累计值','累计同比','累计环比']}.get(token,[token])
            s=re.sub(r'(?:不要|不含|排除|不看|非)\s*'+token,' ',s)
    excluded_frequencies=[]
    for word,freq in FREQUENCIES.items():
        if re.search(r'(?:不要|不含|排除|不看|非)\s*'+word,s):
            excluded_frequencies.append(freq);s=re.sub(r'(?:不要|不含|排除|不看|非)\s*'+word,' ',s)
    source=None
    sm=re.search(r'来源(?:是|为|:|：)?([^，,;；\s]+)',s)
    if sm:source=sm.group(1);s=s[:sm.start()]+' '+s[sm.end():]
    excluded_terms=[]
    for m in re.finditer(r'(?:不要|不含|排除|不看)\s*([^，,;；。\s]+)',s):
        term=m.group(1).strip()
        if term:excluded_terms.append(normalize(term))
    s=re.sub(r'(?:不要|不含|排除|不看)\s*[^，,;；。\s]+',' ',s)
    raw_hint=bool(re.search(r'(?:当|本)?(?:月|周|日|季|年)值',s))
    transform=None
    for t in ['累计同比','累计环比','同比','环比','累计值','累计']:
        if t in s:
            transform='累计值' if t=='累计' else t
            s=s.replace(t,' ')
            break
    if not transform and raw_hint:transform='原值'
    unit=None
    for word,target in [('美元每桶','美元/桶'),('美元/桶','美元/桶'),('元每吨','元/吨'),('元/吨','元/吨'),('美元每吨','美元/吨'),('美元/吨','美元/吨')]:
        if word in s:unit=target;s=s.replace(word,' ');break
    geography=None
    from .catalog import REGIONS
    for region in sorted(REGIONS,key=len,reverse=True):
        if region in s:geography=region;s=s.replace(region,' ');break
    wants_price='价格' in s and '价差' not in s
    for view in ['折线图','柱状图','画图']:
        if view in s:s=s.replace(view,' ');warnings.append('当前定位指标定义；绘图需连接真实观测值，未执行绘图')
    frequency=None
    for word,f in FREQUENCIES.items():
        if word in s:
            if frequency and frequency!=f: warnings.append('查询包含冲突频率，请使用明确筛选')
            frequency=f;s=s.replace(word,' ')
    for m in list(re.finditer(r'(?:当|本)?(日|周|月|季|年)(?:度)?(?=(?:价格|产量|库存|销量|均价|值))',s)):
        f=m.group(1)
        if frequency and frequency!=f:warnings.append('查询包含冲突频率，请使用明确筛选')
        frequency=f
    s=re.sub(r'(?:当|本)?(?:日|周|月|季|年)(?:度)?值',' ',s)
    s=re.sub(r'(?:当|本)?(?:日|周|月|季|年)(?:度)?(?=(?:价格|产量|库存|销量|均价))',' ',s)
    for m in list(re.finditer(r'(?:当|本)(日|周|月|季|年)',s)):
        f=m.group(1)
        if frequency and frequency!=f:warnings.append('查询包含冲突频率，请使用明确筛选')
        frequency=f
        if not transform:transform='原值'
    s=re.sub(r'(?:当|本)(?:日|周|月|季|年)',' ',s)
    # Time requests cannot be answered by a metadata-only catalog.
    if re.search(r'(?:近|过去)\s*[一二三四五六七八九十\d]+\s*(?:个)?(?:月|年|周|日)|20\d{2}',s):
        warnings.append('目录不含观测值；时间范围需要在数据连接后执行，当前只检索指标定义')
        s=re.sub(r'(?:近|过去)\s*[一二三四五六七八九十\d]+\s*(?:个)?(?:月|年|周|日)|20\d{2}(?:年)?',' ',s)
    s=re.sub(r'请|帮我|找一下|查一下|看看|我想看|想看|我想找|查找|搜索|指标名称|指标|数据|一下',' ',s)
    text=normalize(s)
    concepts=[]
    for key in sorted(SYNONYMS,key=len,reverse=True):
        n=normalize(key)
        if n and n in text:
            concepts.append({'term':key,'alternatives':list(dict.fromkeys(normalize(v) for v in SYNONYMS[key]))})
            text=text.replace(n,' ')
    for leftover in text.split():
        if leftover and leftover not in ('的',):concepts.append({'term':leftover,'alternatives':[leftover]})
    # A single-character entity is accepted only when explicitly listed.
    return {'transform':transform,'frequency':frequency,'unit':unit,'geography':geography,'wants_price':wants_price,'source':source,'excluded_frequencies':excluded_frequencies,'excluded_terms':excluded_terms,'exclude_transforms':list(dict.fromkeys(exclude)),'concepts':concepts,'warnings':warnings}


def search(db, query, limit=30, **filters):
    limit=max(1,min(int(limit),100))
    query=str(query or '').strip()
    intent=parse_query(query)
    if not query and not any(filters.values()):
        return {'query':query,'intent':intent,'total':0,'results':[],'warnings':['请输入名称、代码、应用词或选择分类，不返回任意首条充当命中']}
    clauses=[];params=[]
    conflicts=[key for key in ('frequency','transform','unit','geography','source') if filters.get(key) and intent.get(key) and filters[key]!=intent[key]]
    if conflicts:return {'query':query,'intent':intent,'total':0,'results':[],'warnings':['自然语言与显式筛选冲突：'+','.join(conflicts)]}
    mapping={'industry':'industry','frequency':'frequency','transform':'transform','unit':'unit','source':'source','health':'health','role':'role'}
    for key,column in mapping.items():
        value=filters.get(key) or intent.get(key)
        if value:
            # Industry is a multivalued membership stored in JSON; use JSON1.
            if key=='industry':
                clauses.append("EXISTS (SELECT 1 FROM json_each(records.payload,'$.industries') WHERE value=?)")
            else:clauses.append(column+'=?')
            params.append(value)
    if intent['wants_price']:
        clauses.append("name NOT LIKE '%价差%' AND name NOT LIKE '%比价%'")
    if filters.get('geography') or intent.get('geography'):
        clauses.append("json_extract(payload,'$.geography') LIKE ?")
        params.append('%'+str(filters.get('geography') or intent['geography'])+'%')
    for freq in intent['excluded_frequencies']:
        clauses.append('frequency<>?');params.append(freq)
    if not intent['transform'] and any(c['term'] in ('价格','库存','产量','销量','开工率','零售均价','零售量','零售额','cpi','ppi','pmi') for c in intent['concepts']):
        clauses.append("transform NOT IN ('同比','环比','累计同比','累计环比','移动平均')")
    if any(c['term']=='零售额' for c in intent['concepts']) and not any(c['term'] in ('份额','占比') for c in intent['concepts']):
        clauses.append("name NOT LIKE '%份额%' AND name NOT LIKE '%占比%'")
    for term in intent['excluded_terms']:
        clauses.append('body NOT LIKE ?');params.append('%'+term+'%')
    for t in intent['exclude_transforms']:
        clauses.append('transform<>?');params.append(t)
    con=sqlite3.connect(db)
    # Exact code or name still respects explicit scope constraints.
    norm=normalize(query)
    exact_clause='(norm_code=? OR norm_name=?)'
    exact_rows=con.execute('SELECT payload FROM records WHERE '+(' AND '.join(clauses)+' AND ' if clauses else '')+exact_clause,params+[norm,norm]).fetchall() if norm else []
    has_fts=bool(con.execute("SELECT 1 FROM sqlite_master WHERE name='search_fts'").fetchone())
    concepts=intent['concepts']
    candidate_clauses=list(clauses);candidate_params=list(params)
    # Require every concept group, OR within synonyms; avoids returning copper
    # prices merely because the user requested methanol prices.
    for c in concepts:
        candidate_clauses.append('('+' OR '.join('id IN (SELECT id FROM search_fts WHERE body LIKE ?)' if has_fts and len(alt)>=3 else 'body LIKE ?' for alt in c['alternatives'])+')')
        candidate_params += ['%'+x+'%' for x in c['alternatives']]
    if concepts or not query:
        rows=con.execute('SELECT payload FROM records'+(' WHERE '+' AND '.join(candidate_clauses) if candidate_clauses else ''),candidate_params).fetchall()
    else: rows=[]
    found={json.loads(v[0])['id']:json.loads(v[0]) for v in exact_rows+rows}
    scored=[]
    for r in found.values():
        # Exact ASCII concepts must be tokens; CPI is not CCPI. Check the
        # original punctuation-preserving names/aliases, not the flattened body.
        raw_text=' '.join([r['name'],r['code'],*r['aliases']])
        ascii_groups=[c for c in concepts if re.fullmatch(r'[a-z0-9]+',normalize(c['term'])) and re.search(r'[a-z]',normalize(c['term']))]
        if norm not in [normalize(r['name']),*[normalize(a) for a in r['aliases']]] and any(not any(re.search(r'(?<![A-Za-z0-9])'+re.escape(alt)+r'(?![A-Za-z0-9])',raw_text,re.I) if re.fullmatch(r'[a-z0-9]+',alt) else alt in normalize(raw_text) for alt in c['alternatives']) for c in ascii_groups):continue
        rn=normalize(r['name']); aliases=[normalize(a) for a in r['aliases']]
        matched=[]
        if norm and normalize(r['code'])==norm:score=10000;matched.append('指标代码精确命中')
        elif norm and rn==norm:score=9000;matched.append('标准名称精确命中；请核对来源/频率/单位')
        elif norm and norm in aliases:score=8500;matched.append('工作簿别名精确命中')
        else:
            score=1000
            for c in concepts:
                if any(v in rn for v in c['alternatives']):score+=120;matched.append('名称/受控同义词：'+c['term'])
                elif any(v in ''.join(aliases) for v in c['alternatives']):score+=90;matched.append('原表别名：'+c['term'])
            if norm and norm in rn:score+=300
        if r['health']=='正常':score+=2
        # No health-based dropping: historical series can remain useful.
        scored.append({'record':r,'score':score,'match_reasons':matched,'scope_warning':'同名或同义词不是同一数据序列；需核对频率、单位、来源、地区与变换口径'})
    con.close()
    scored.sort(key=lambda v:(-v['score'],len(v['record']['name']),v['record']['id']))
    warnings=list(intent['warnings'])
    if len({(x['record']['frequency'],x['record']['unit'],x['record']['source'],x['record']['transform']) for x in scored[:limit]})>1:
        warnings.append('命中多个统计口径，结果保持分列，未自动合并或代选')
    return {'query':query,'intent':intent,'total':len(scored),'results':scored[:limit],'warnings':warnings,'mode':'deterministic_local_catalog','model_connected':False}


def get_record(db, record_id):
    con=sqlite3.connect(db)
    rows=con.execute('SELECT payload FROM records WHERE id=? OR code=?',(record_id,record_id)).fetchall();con.close()
    return [json.loads(r[0]) for r in rows]


def get_relations(db, record_id, limit=100):
    con=sqlite3.connect(db)
    rows=con.execute('SELECT payload FROM relations WHERE source=? OR target=? LIMIT ?',(record_id,record_id,max(1,min(limit,500)))).fetchall();con.close()
    return [json.loads(r[0]) for r in rows]
