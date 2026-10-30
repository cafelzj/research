"""Auditable monthly data preparation. Metadata catalogs never supply values."""
from __future__ import annotations
import csv
import hashlib
import math
import re
import statistics
from collections import defaultdict
from pathlib import Path

OPERATIONS = ('identity', 'yoy', 'mom', 'cumulative_to_period')
REQUIRED = ('series_id','date','value','unit','frequency','region','source')


def month_key(text):
    # A monthly series is bucketed by the provided calendar year/month. Daily
    # data is rejected rather than aggregated with an undocumented convention.
    m=re.fullmatch(r'(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?',text)
    if not m: raise ValueError('日期必须为 YYYY-MM 或 YYYY-MM-DD')
    if m.group(3):
        import datetime
        datetime.date(int(m[1]),int(m[2]),int(m[3]))
    return int(m[1])*12+int(m[2])-1


def month_name(key):
    return f'{key//12:04d}-{key%12+1:02d}'


def prepare_csv(input_path, operation='identity', measure=None):
    if operation not in OPERATIONS: raise ValueError('未知操作')
    if operation=='cumulative_to_period' and measure!='flow':
        raise ValueError('累计转当期仅适用于已确认可加的流量；请显式声明 --measure flow')
    with open(input_path,encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f)
        missing=set(REQUIRED)-set(reader.fieldnames or [])
        if missing: raise ValueError('缺少列：'+','.join(sorted(missing)))
        raw=list(reader)
    result=[];groups=defaultdict(list)
    for line,r in enumerate(raw,2):
        flags=[]
        if not r['series_id'].strip(): raise ValueError(f'第{line}行缺少series_id')
        if r['frequency'].strip() not in ('月','M','monthly'): raise ValueError(f'第{line}行不是月度数据；禁止隐式重采样')
        if any(not r[k].strip() for k in ['unit','region','source']):raise ValueError(f'第{line}行单位、地区、来源不能为空')
        try:key=month_key(r['date'].strip())
        except ValueError as e:raise ValueError(f'第{line}行：{e}') from e
        value=None
        if not r['value'].strip():flags.append('missing_value')
        else:
            try:
                value=float(r['value'])
                if not math.isfinite(value):value=None;flags.append('nonfinite_value')
            except (ValueError,TypeError):flags.append('invalid_number')
        if any(x in r.get('coverage','') for x in ['合并','Jan-Feb','1-2','1至2']):flags.append('combined_period_not_separable')
        item=dict(series_id=r['series_id'].strip(),date=month_name(key),value=value,unit=r['unit'].strip(),frequency='月',region=r['region'].strip(),source=r['source'].strip(),operation=operation,output_value=None,output_unit='%' if operation in ('yoy','mom') else r['unit'].strip(),flags=flags,provenance={'input_file':Path(input_path).name,'input_row':line,'raw_date':r['date'],'raw_value':r['value'],'base_rows':[]},_key=key)
        result.append(item);groups[item['series_id']].append(item)
    for sid,items in groups.items():
        if len({(x['unit'],x['frequency'],x['region'],x['source']) for x in items})!=1:
            raise ValueError(f'{sid} 的单位/频率/地区/来源不一致；请先拆分序列，禁止自动拼接')
        periods=defaultdict(list)
        for x in items:periods[x['_key']].append(x)
        for entries in periods.values():
            if len(entries)>1:
                for x in entries:x['flags'].append('duplicate_period')
        for x in items:
            if x['flags']:continue
            k=x['_key'];v=x['value']
            if operation=='identity':x['output_value']=v;continue
            if operation=='cumulative_to_period' and k%12==0:
                x['output_value']=v; x['flags'].append('january_cumulative_equals_period');continue
            bk=k-12 if operation=='yoy' else k-1
            base=periods.get(bk,[])
            if len(base)!=1:
                x['flags'].append('missing_base_period' if not base else 'ambiguous_base_period');continue
            b=base[0]
            x['provenance']['base_rows']=[b['provenance']['input_row']]
            # Quality flags for *derived output* must not invalidate original
            # observations as a later base; only input defects propagate.
            input_flags=[f for f in b['flags'] if f in ('missing_value','nonfinite_value','invalid_number','combined_period_not_separable','duplicate_period')]
            if b['value'] is None or input_flags:
                x['flags'].append('invalid_base_observation');continue
            if operation=='cumulative_to_period':
                # January has already been handled; subtraction never crosses year.
                x['output_value']=v-b['value']
                if x['output_value']<0:x['flags'].append('negative_period_or_revision_review')
            elif b['value']==0:x['flags'].append('zero_base_not_computable')
            else:
                x['output_value']=(v/b['value']-1)*100
                if b['value']<0:x['flags'].append('negative_base_interpret_with_care')
    for x in result:
        if x['output_value'] is not None and not math.isfinite(x['output_value']):
            x['output_value']=None;x['flags'].append('derived_nonfinite')
        x.pop('_key')
    return {'schema_version':1,'source_sha256':hashlib.sha256(Path(input_path).read_bytes()).hexdigest(),'operation':operation,'measure':measure,'record_count':len(result),'records':result,'policy':{'missing':'preserve_null_never_zero_fill','alignment':'same_series_calendar_month','units':'no_implicit_conversion','revision':'input values and source rows preserved; no vintage inferred','anomaly':'quality flags are review candidates, not economic causes'}}


def quality_candidates(records, window=12, threshold=6.0):
    """Trailing MAD of monthly first differences; no future information.

    Exploratory candidates only. A flat/insufficient baseline is explicitly
    returned as unscorable; cannot claim a statistical anomaly from metadata.
    """
    if window<8:raise ValueError('window must be >= 8')
    groups=defaultdict(list)
    for r in records:groups[r['series_id']].append(r)
    candidates=[]
    for sid,rows in groups.items():
        rows=sorted(rows,key=lambda r:r['date']);changes=[];previous=None
        for r in rows:
            v=r.get('value');valid=v is not None and not any(f in r.get('flags',[]) for f in ['invalid_number','nonfinite_value','duplicate_period','combined_period_not_separable'])
            consecutive=previous is not None and month_key(r['date'])-month_key(previous['date'])==1
            if not valid or not consecutive or previous['value'] is None:
                previous=r if valid else None;continue
            delta=v-previous['value'];history=changes[-window:]
            if not math.isfinite(delta):
                candidates.append({'series_id':sid,'date':r['date'],'type':'nonfinite_difference_review','score':None,'warning':'有限输入的差值溢出，不能判定统计异常'})
                previous=r;continue
            if len(history)>=8:
                median=statistics.median(history);mad=statistics.median(abs(d-median) for d in history)
                if mad>0:
                    score=abs(delta-median)/(1.4826*mad)
                    if not math.isfinite(score):
                        candidates.append({'series_id':sid,'date':r['date'],'type':'nonfinite_score_review','score':None,'warning':'标准化分数溢出，需数值尺度复核'})
                    elif score>threshold:candidates.append({'series_id':sid,'date':r['date'],'type':'statistical_review_candidate','score':score,'threshold':threshold,'window':len(history),'method':'trailing_monthly_first_difference_MAD','warning':'不是因果判断；需排查季节性、修订、统计口径和真实经济变化'})
                elif delta!=median:
                    candidates.append({'series_id':sid,'date':r['date'],'type':'flat_baseline_review','score':None,'window':len(history),'warning':'历史差分MAD为零，不输出伪造的无限分数或确定异常'})
            changes.append(delta);previous=r
    return candidates
