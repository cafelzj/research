"""python3 -m indicator_lab --help"""
import argparse
import json
from pathlib import Path
from .catalog import import_workbook,write_sqlite,export_sqlite
from .search import search
from .pipeline import prepare_csv,quality_candidates


def dump(value,path=None,compact=False):
    body=json.dumps(value,ensure_ascii=False,indent=None if compact else 2,separators=(',',':') if compact else None,allow_nan=False)+'\n'
    if path:
        Path(path).parent.mkdir(parents=True,exist_ok=True);Path(path).write_text(body)
    else: print(body,end='')


def main():
    parser=argparse.ArgumentParser(description='本地指标治理、检索与月度数据准备；不上传原工作簿')
    sub=parser.add_subparsers(dest='command',required=True)
    p=sub.add_parser('build');p.add_argument('--input',required=True);p.add_argument('--output',required=True)
    p=sub.add_parser('export');p.add_argument('--db',required=True);p.add_argument('--output',required=True)
    p=sub.add_parser('search');p.add_argument('--db',required=True);p.add_argument('--query',default='');p.add_argument('--limit',type=int,default=20)
    for key in ['industry','frequency','transform','unit','source','health','role','geography']:p.add_argument('--'+key)
    p=sub.add_parser('prepare');p.add_argument('--input',required=True);p.add_argument('--output',required=True);p.add_argument('--operation',choices=['identity','yoy','mom','cumulative_to_period'],default='identity');p.add_argument('--measure',choices=['flow','stock','rate','index']);p.add_argument('--scan-anomalies',action='store_true')
    p=sub.add_parser('serve');p.add_argument('--db',required=True);p.add_argument('--port',type=int,default=8765);p.add_argument('--allow-remote',action='store_true')
    p=sub.add_parser('remote-search');p.add_argument('--query',required=True);p.add_argument('--limit',type=int,default=20)
    args=parser.parse_args()
    try:
        if args.command=='build':
            catalog=import_workbook(args.input);write_sqlite(catalog,args.output);dump({'output':str(Path(args.output).resolve()),'meta':catalog['meta'],'audit_counts':catalog['audit']['counts'],'relations':len(catalog['relations'])})
        elif args.command=='export':
            catalog=export_sqlite(args.db);dump(catalog,args.output,compact=True);dump({'output':str(Path(args.output).resolve()),'record_count':len(catalog['records'])})
        elif args.command=='search':dump(search(args.db,args.query,args.limit,**{k:getattr(args,k) for k in ['industry','frequency','transform','unit','source','health','role','geography']}))
        elif args.command=='prepare':
            result=prepare_csv(args.input,args.operation,args.measure)
            if args.scan_anomalies:result['statistical_candidates']=quality_candidates(result['records'])
            dump(result,args.output);dump({'output':str(Path(args.output).resolve()),'record_count':result['record_count'],'quality_flagged_rows':sum(bool(r['flags']) for r in result['records'])})
        elif args.command=='serve':
            from .server import serve
            serve(args.db,args.port,args.allow_remote)
        elif args.command=='remote-search':
            from .remote import search_worldbank
            dump(search_worldbank(args.query,args.limit))
    except (ValueError,OSError) as exc:parser.exit(2,'Error: '+str(exc)+'\n')

if __name__=='__main__':main()
