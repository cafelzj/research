"""Allowlisted World Bank metadata/observation adapter, no arbitrary URL proxy."""
from __future__ import annotations
import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE='https://api.worldbank.org/v2'
_CACHE={}


def _fetch(path,params):
    url=BASE+path+'?'+urlencode(params)
    req=Request(url,headers={'User-Agent':'IndicatorLab/1.0 (research catalog)','Accept':'application/json'})
    with urlopen(req,timeout=15) as response:
        if response.status!=200:raise ValueError(f'World Bank HTTP {response.status}')
        # Fixed host and fixed API routes are the only network destinations.
        if not response.url.startswith(BASE+'/'):raise ValueError('Unexpected remote redirect')
        body=response.read(8*1024*1024+1)
        if len(body)>8*1024*1024:raise ValueError('远程响应超过8MiB上限')
    data=json.loads(body)
    if not isinstance(data,list) or len(data)!=2 or not isinstance(data[0],dict):raise ValueError('World Bank返回错误或未知格式')
    if data[1] is None: return data[0],[],url
    if not isinstance(data[1],list):raise ValueError('World Bank记录格式错误')
    return data[0],data[1],url


def search_worldbank(query,limit=20):
    query=str(query).strip()
    if not query:raise ValueError('请输入英文指标名称或精确 World Bank code；未连接远程中文语义模型')
    started=time.time()
    if re.fullmatch(r'[A-Z][A-Z0-9_.]{3,80}',query) and '.' in query:
        meta,rows,url=_fetch('/indicator/'+query,{'format':'json'})
        scope='精确指标code';cached=False
    else:
        key='source-2-indicators'
        if key in _CACHE and started-_CACHE[key][0]<86400:
            _,meta,rows,url=_CACHE[key];cached=True
        else:
            meta,rows,url=_fetch('/source/2/indicator',{'format':'json','per_page':20000})
            if int(meta.get('pages',1))>1:raise ValueError('远程目录分页超出一次抓取范围；拒绝把局部目录冒充完整目录')
            _CACHE[key]=(started,meta,rows,url);cached=False
        scope='World Development Indicators (source=2)，非全部远程数据库'
        words=query.lower().split()
        rows=[r for r in rows if all(w in (' '.join(str(r.get(k,'')) for k in ['id','name','sourceNote'])).lower() for w in words)]
    return {'provider':'worldbank','scope':scope,'query':query,'source_url':url,'cached':cached,'retrieved_at_unix':started,'total':len(rows),'records':[{'id':'wb:'+r['id'],'code':r['id'],'name':r.get('name',''),'source':'World Bank: '+str(r.get('source',{}).get('value','WDI')),'unit':r.get('unit',''),'definition':r.get('sourceNote',''),'organization':r.get('sourceOrganization',''),'status':'远程候选，尚未映射本地指标','frequency':'需观测接口核对'} for r in rows[:max(1,min(int(limit),100))]],'warnings':['名称匹配不代表与本地同名指标等价；定义、单位、频率、地理及授权须独立核对','中文自然语言尚未接入远程语义翻译；可用英文或精确code']}


def observations_worldbank(code,country,start,end):
    if not re.fullmatch(r'[A-Z][A-Z0-9_.]{3,80}',code):raise ValueError('无效World Bank指标code')
    if not re.fullmatch(r'[A-Z]{3}',country):raise ValueError('country必须是三个大写字母代码')
    start,end=int(start),int(end)
    if not (1900<=start<=end<=2100) or end-start>60:raise ValueError('年份需在1900-2100范围且跨度不超过60年')
    meta,rows,url=_fetch('/country/'+country+'/indicator/'+code,{'format':'json','date':f'{start}:{end}','per_page':1000})
    if int(meta.get('pages',1))>1:raise ValueError('观测数据未完整分页')
    return {'provider':'worldbank','code':code,'country':country,'source_url':url,'metadata':meta,'records':rows,'null_policy':'远程null原样保留，不补零','warning':'此适配器返回原始观测，不自动连接或覆盖本地商业数据'}
