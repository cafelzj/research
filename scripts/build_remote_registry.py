"""Pin a small, public World Bank metadata registry; never mirror a private catalog."""
import concurrent.futures
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen
ITEMS=[('NY.GDP.MKTP.CD','国内生产总值 GDP（现价美元）',['GDP','国内生产总值','经济总量']),('NY.GDP.MKTP.KD.ZG','GDP 实际增长率（年度）',['实际GDP增长','GDP增速']),('NY.GDP.PCAP.CD','人均 GDP（现价美元）',['人均GDP']),('FP.CPI.TOTL.ZG','居民消费价格通胀率（年度）',['CPI','消费者物价','居民消费价格','通胀']),('NE.EXP.GNFS.CD','商品与服务出口额（现价美元）',['出口','出口额']),('NE.IMP.GNFS.CD','商品与服务进口额（现价美元）',['进口','进口额']),('NV.IND.MANF.CD','制造业增加值（现价美元）',['制造业','工业增加值']),('GC.DOD.TOTL.GD.ZS','中央政府债务占 GDP 比例',['政府债务','政府杠杆','债务GDP']),('SE.XPD.TOTL.GD.ZS','政府教育支出占 GDP 比例',['教育投入','教育经费','教育支出']),('EG.ELC.ACCS.ZS','电力可及人口比例',['电力','电气化'])]
def fetch(item):
 code,name,aliases=item
 with urlopen('https://api.worldbank.org/v2/indicator/'+code+'?format=json',timeout=30) as r:
  raw=json.load(r)
 if not isinstance(raw,list) or len(raw)<2 or not raw[1]:raise ValueError(code)
 x=raw[1][0]
 return {'id':'wb:'+code,'code':code,'name':name,'original_name':x['name'],'aliases':aliases,'frequency':'年','industry':'国际宏观与公共指标','industries':['国际宏观与公共指标'],'unit':x.get('unit') or '以来源定义为准','source':'World Bank · '+x['source']['value'],'health':'接口元数据已核对，未核验各国最新观测','role':'宏观与政策','transform':'同比' if code.endswith('.ZG') else '原值','geography':'按国家选择','source_note':x.get('sourceNote',''),'source_url':'https://data.worldbank.org/indicator/'+code,'metadata_url':'https://api.worldbank.org/v2/indicator/'+code+'?format=json','namespace':'wb'}
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:records=list(pool.map(fetch,ITEMS))
 out=Path(__file__).resolve().parents[1]/'assets/indicator-remote.json'
 out.write_text(json.dumps({'provider':'World Bank','checked_at':datetime.now(timezone.utc).isoformat(),'scope':'仅列举下列公共年度指标；不代表已接入 Wind、彭博或全部远程目录','records':records},ensure_ascii=False,indent=2)+'\n')
 print('Verified remote metadata:',len(records))
