"""Import spreadsheet metadata without inventing observations or verified formulas."""
from __future__ import annotations
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

SCHEMA_VERSION = 1
HEADERS = ['行业', '指标code', '指标名称', '频率', '单位', '来源', '健康状态', '语料&行业黑话', '联想查询']
ROLES = {
    '价格与成本': ['价格', '价差', '售价', '成本', '结算价', '运价', '运费', '价指数'],
    '供给与产能': ['产量', '产能', '开工', '负荷', '交付', '新增', '船队', '钻机'],
    '需求与消费': ['消费', '销量', '销售', '订单', '需求', '产销', '零售', '装机'],
    '库存与物流': ['库存', '仓单', '港口', '吞吐', '货运', '周转', '运输'],
    '进出口与贸易': ['进口', '出口', '贸易', '净出口', '净进口'],
    '盈利与财务': ['利润', '收入', '毛利', '现金流', '资产', '负债', '资本', '营业'],
    '宏观与政策': ['GDP', 'CPI', 'PPI', '利率', '货币', '税', '债务', '财政', '人口', '失业'],
}
# Explicit, limited region recognition: absence means unknown, never "全国".
REGIONS = ['全国', '中国', '美国', '日本', '韩国', '法国', '德国', '英国', '欧盟', '欧洲', '印度', '巴西', '俄罗斯', '上海', '北京', '天津', '重庆', '河北', '河南', '山东', '山西', '陕西', '江苏', '浙江', '广东', '广西', '福建', '安徽', '江西', '湖北', '湖南', '四川', '云南', '贵州', '内蒙古', '辽宁', '吉林', '黑龙江', '海南', '宁夏', '新疆', '甘肃', '青海', '西藏', '华东', '华南', '华北', '东北', '西南', '西北', '华中']


def clean(value):
    return '' if value is None else str(value).strip()


def normalize(value):
    return re.sub(r'[\W_]+', '', unicodedata.normalize('NFKC', clean(value)).lower())


def aliases(value):
    return list(dict.fromkeys(x.strip() for x in clean(value).split('@,@') if x.strip()))


def transform_of(name):
    if '累计' in name and '同比' in name: return '累计同比'
    if '累计' in name and '环比' in name: return '累计环比'
    if '同比' in name: return '同比'
    if '环比' in name: return '环比'
    if '累计' in name: return '累计值'
    if re.search(r'\d+个?月均值|移动平均|滚动均值',name):return '移动平均'
    if any(x in name for x in ['占比', '比重', '比例']): return '占比'
    return '原值'


def base_name_of(name):
    # Strip explicitly named transformation/period suffixes only. No generic
    # removal of geographic, product, contract, source or unit qualifiers.
    s = unicodedata.normalize('NFKC', name)
    s = re.sub(r'(?:(?:当|本)(?:月|季|季度|年|周|日))?(?:累计同比|累计环比|同比|环比|累计值|累计|当期值)', '', s)
    s = re.sub(r'(?:当|本)(?:月|季|季度|年|周|日)值', '', s)
    return normalize(s)


def classify(name):
    roles = [role for role, words in ROLES.items() if any(w.lower() in name.lower() for w in words)]
    return roles or ['其他与待分类']


def geography_of(name):
    hits = [r for r in REGIONS if r in name]
    return '/'.join(hits) if hits else '未明确'


def infer_relations(records):
    """Bounded, explicitly unverified naming-family candidates, never causality."""
    groups = defaultdict(list)
    for r in records:
        if r['base_name']:
            groups[(r['base_name'], r['frequency'], r['source'], r['geography'])].append(r)
    edges = []
    for group in groups.values():
        # Cross-industry copies remain separate; pick only one unambiguous code
        # per transform, preferring the same industry when linking.
        for target in group:
            t = target['transform']
            expected = {'同比': '原值', '环比': '原值', '累计值': '原值', '累计同比': '累计值', '累计环比': '累计值'}.get(t)
            if not expected: continue
            candidates = [x for x in group if x['transform'] == expected and set(x.get('industries',[x['industry']])) & set(target.get('industries',[target['industry']]))]
            codes = {x['code'] for x in candidates}
            if len(codes) != 1: continue
            base = candidates[0]
            # Percent differences are plausible; cumulative and original must
            # share an explicit unit. Never convert units by name similarity.
            if t == '累计值' and (not base['unit'] or base['unit'] != target['unit']): continue
            if t in ('同比', '环比', '累计同比', '累计环比') and target['unit'] not in ('%', '％', '百分点', '百分比'): continue
            edges.append({'source': base['id'], 'target': target['id'], 'type': 'derived_candidate', 'status': '待口径与数值验证', 'reason': f'名称主体、行业、频率、来源与已识别地区一致；{expected} → {t}。工作簿未提供公式和数值，不能确认数学派生。', 'formula_hint': ('基期差值与百分点口径需人工核对，不自动套比值公式' if target['unit']=='百分点' else '基项为比率/份额：比值变化或百分点差均可能，需原始定义核验' if base['unit'] in ('%','％','百分点','百分比') else {'同比': '候选：100 * (x_t / x_(t-year) - 1)，需确认定义及基期', '环比': '候选：100 * (x_t / x_prev - 1)，需确认定义及相邻期', '累计值': '累计口径待核对，不代表基项可求和；存量/比率/均价不得简单相加', '累计同比': '候选：100 * (cum_t / cum_(t-year) - 1)，需确认累计范围一致', '累计环比': '需人工确认统计定义'}[t])})
    return edges


def import_workbook(path):
    from openpyxl import load_workbook
    path = Path(path)
    book = load_workbook(path, read_only=True, data_only=False)
    if '全行业指标' not in book.sheetnames: raise ValueError('缺少工作表：全行业指标')
    sheet = book['全行业指标']
    found = [clean(x.value) for x in next(sheet.iter_rows(min_row=2,max_row=2))][:9]
    if found != HEADERS: raise ValueError(f'表头不符合契约：{found}')
    records, issues = [], []
    formula_count = 0
    for row in sheet.iter_rows(min_row=3):
        vals = [clean(c.value) for c in row[:9]]
        if not any(vals) or vals[0] == '示例': continue
        n = row[0].row
        formula_count += sum(c.data_type == 'f' for c in row[:9])
        industry, code, name, frequency, unit, source, health, alias, association = vals
        r = dict(id=code or f'row-{n}', code=code, name=name, industry=industry, frequency=frequency, unit=unit, source=source, health=health, aliases=aliases(alias), associations=aliases(association), role=classify(name)[0], roles=classify(name), transform=transform_of(name), base_name=base_name_of(name), geography=geography_of(name), source_row=n)
        records.append(r)
        for field in ['code','name','industry','frequency','unit','source','health']:
            if not r[field]: issues.append(dict(kind='missing_'+field, record_id=r['id'], source_row=n, message=f'缺少{field}，不能假定补齐'))
    book.close()
    raw_records = records
    row_count = len(raw_records)
    codes = Counter(r['code'] for r in records if r['code'])
    merged = {}
    conflicts = set()
    signature = lambda r: tuple((k, json.dumps(v, ensure_ascii=False, sort_keys=True)) for k,v in r.items() if k not in ['id','industry','source_row'])
    for r in raw_records:
        key = r['code'] or r['id']
        if key in merged:
            existing = merged[key]
            if signature({k:v for k,v in existing.items() if k not in ['industries','source_rows']}) == signature(r):
                existing['industries'] = list(dict.fromkeys(existing['industries']+[r['industry']]))
                existing['source_rows'].append(r['source_row'])
                continue
            conflicts.add(key)
            r['id'] = f"{key}@row-{r['source_row']}"
            key = r['id']
        r['industries'] = [r['industry']]
        r['source_rows'] = [r['source_row']]
        merged[key] = r
    records = list(merged.values())
    ids = {n:r['id'] for r in records for n in r['source_rows']}
    for i in issues: i['record_id'] = ids[i['source_row']]
    for r in records:
        if len(r['source_rows'])>1:
            issues.append(dict(kind='cross_industry_membership' if len(r['industries'])>1 else 'duplicate_source_row',record_id=r['id'],source_row=r['source_row'],source_rows=r['source_rows'],message='同 code 且全部非行业元数据一致，合并实体并保留全部行业与行号'))
        if r['code'] in conflicts:
            issues.append(dict(kind='code_conflict',record_id=r['id'],source_row=r['source_row'],message='同 code 非行业元数据冲突；保留多实体，需人工治理'))
        # Original health is kept on every record; avoid duplicating tens of
        # thousands of identical messages in the structural issue list.
    for r in records:
        flags=[]
        if ('月度' in r['name'] or '当月' in r['name']) and r['frequency']=='年':
            flags.append(('name_frequency_conflict','名称含月度/当月但频率标年，需复核，未自动纠正'))
        if any(w in r['name'] for w in ['产销率','开工率','负荷率']) and r['unit'] and r['unit'] not in ['%','％','百分比','百分点','比值','倍']:
            flags.append(('name_unit_conflict','名称像比率但单位不是明确比率单位，需复核定义'))
        if any(w in r['name'] for w in ['零售均价','平均价格','出厂价格']) and r['unit'] in ['台','辆','套','万台','万吨','吨']:
            flags.append(('name_unit_conflict','名称像价格但单位是数量，需复核定义'))
        for kind,message in flags: issues.append(dict(kind=kind,record_id=r['id'],source_row=r['source_row'],message=message))
    names = defaultdict(list)
    for r in records: names[normalize(r['name'])].append(r)
    homonyms = []
    for family in names.values():
        if len(family)>1:
            homonyms.append({'name':family[0]['name'],'ids':[r['id'] for r in family], 'kind':'same_name_distinct_codes_or_scope'})
    count = lambda key: dict(Counter(r[key] or '未填' for r in records))
    relations = infer_relations(records)
    return {'schema_version':SCHEMA_VERSION,'meta':{'record_count':len(records),'source_row_count':row_count,'cross_industry_codes':sum(len(r['source_rows'])>1 for r in records),'code_conflict_count':len(conflicts),'source_file':path.name,'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sheet':'全行业指标','header_row':2,'excluded_example_rows':1,'distinct_codes':len(codes),'industries':dict(Counter(tag for r in records for tag in r['industries'])),'frequencies':count('frequency'),'units':count('unit'),'health':count('health'),'source_row_health':dict(Counter(r['health'] or '未填' for r in raw_records)),'transforms':count('transform'),'roles':count('role'),'has_observations':False,'formula_cells':formula_count,'relation_policy':'名称派生候选，未验证数学或因果关系','geography_policy':'有限名称词典识别；未明确不代表全国','alias_record_count':sum(bool(r['aliases']) for r in records),'association_record_count':sum(bool(r['associations']) for r in records),'industry_count_policy':'多行业标签计数之和可大于实体数'},'records':records,'audit':{'counts':{**dict(Counter(i['kind'] for i in issues)),'source_health':sum(bool(r['health']) and r['health']!='正常' for r in records)},'health_issue_policy':'原健康标记逐条保留在records.health；counts.source_health统计实体，不在issues重复；其他缺失项按来源行定位','issues':issues,'homonyms':homonyms,'numeric_anomalies':{'status':'not_available','reason':'工作簿仅有目录元数据，没有日期与数值，无法检测时序异常、滞后相关或验证公式'}},'relations':relations}


def write_sqlite(catalog, output):
    path=Path(output); path.parent.mkdir(parents=True,exist_ok=True)
    # Do not overwrite an existing built database if an import/build fails.
    temp=path.with_suffix(path.suffix+'.building')
    if temp.exists(): temp.unlink()
    con=sqlite3.connect(temp)
    con.executescript('''CREATE TABLE records(id TEXT PRIMARY KEY,code TEXT,name TEXT,industry TEXT,frequency TEXT,unit TEXT,source TEXT,health TEXT,transform TEXT,role TEXT,norm_name TEXT,norm_code TEXT,body TEXT,payload TEXT); CREATE INDEX records_code ON records(norm_code); CREATE INDEX records_name ON records(norm_name); CREATE INDEX records_scope ON records(industry,frequency,transform); CREATE TABLE metadata(key TEXT PRIMARY KEY,payload TEXT); CREATE TABLE relations(source TEXT,target TEXT,type TEXT,status TEXT,reason TEXT,payload TEXT); CREATE INDEX rel_src ON relations(source); CREATE INDEX rel_dst ON relations(target);''')
    try:
        con.execute('CREATE VIRTUAL TABLE search_fts USING fts5(id UNINDEXED, body, tokenize="trigram")')
        trigram=True
    except sqlite3.OperationalError: trigram=False
    for r in catalog['records']:
        body=normalize(' '.join([r['name'],r['code'],*r['aliases']]))
        con.execute('INSERT INTO records VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(r['id'],r['code'],r['name'],r['industry'],r['frequency'],r['unit'],r['source'],r['health'],r['transform'],r['role'],normalize(r['name']),normalize(r['code']),body,json.dumps(r,ensure_ascii=False)))
        if trigram: con.execute('INSERT INTO search_fts VALUES (?,?)',(r['id'],body))
    for key in ['schema_version','meta','audit']:
        con.execute('INSERT INTO metadata VALUES (?,?)',(key,json.dumps(catalog[key],ensure_ascii=False)))
    con.execute('INSERT INTO metadata VALUES (?,?)',('search_index',json.dumps({'fts5_trigram':trigram})))
    for r in catalog['relations']:
        con.execute('INSERT INTO relations VALUES(?,?,?,?,?,?)',(r['source'],r['target'],r['type'],r['status'],r['reason'],json.dumps(r,ensure_ascii=False)))
    con.commit();con.close();temp.replace(path)


def export_sqlite(db):
    con=sqlite3.connect(db)
    meta={k:json.loads(v) for k,v in con.execute('SELECT key,payload FROM metadata')}
    result={k:meta[k] for k in ['schema_version','meta','audit']}
    result['records']=[json.loads(r[0]) for r in con.execute('SELECT payload FROM records ORDER BY rowid')]
    result['relations']=[json.loads(r[0]) for r in con.execute('SELECT payload FROM relations')]
    con.close();return result
