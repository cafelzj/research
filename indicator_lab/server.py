"""Read-only localhost service with a narrow static-file whitelist."""
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs,unquote,urlsplit
from .catalog import export_sqlite
from .search import get_record,get_relations,search
from .remote import search_worldbank,observations_worldbank

HTML = {'indicators.html','intelli.html','data.html','studio.html','atlas.html','index.html','daily.html','washoku.html','chinese-menu.html'}


def serve(db,port=8765,allow_remote=False,root=None):
    db=Path(db).resolve()
    if not db.is_file():raise ValueError('数据库不存在，请先 build')
    root=Path(root or Path(__file__).resolve().parents[1]).resolve()
    catalog_bytes=None
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,fmt,*args):
            # Search terms are not put into the access log.
            print(self.command, urlsplit(self.path).path, flush=True)
        def send(self,status,payload,kind='application/json; charset=utf-8'):
            body=payload if isinstance(payload,bytes) else json.dumps(payload,ensure_ascii=False,allow_nan=False).encode()
            self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(body)
        def do_GET(self):
            nonlocal catalog_bytes
            try:
                allowed_hosts={f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}'}
                if self.headers.get('Host','') not in allowed_hosts:
                    return self.send(403,{'error':'host_not_allowed','message':'只接受localhost/127.0.0.1 Host，防止DNS rebinding读取本地目录'})
                origin=self.headers.get('Origin')
                if origin and origin not in {'http://'+h for h in allowed_hosts}:
                    return self.send(403,{'error':'origin_not_allowed'})
                if self.headers.get('Sec-Fetch-Site')=='cross-site':
                    return self.send(403,{'error':'cross_site_not_allowed'})
                parsed=urlsplit(self.path);path=unquote(parsed.path)
                args=parse_qs(parsed.query)
                one=lambda k,default='':args.get(k,[default])[0]
                if path=='/health':return self.send(200,{'status':'ok','service':'indicator-lab','schema_version':1,'model_connected':False,'remote_enabled':allow_remote,'catalog':'local metadata only'})
                if path in ('/catalog','/api/catalog'):
                    if catalog_bytes is None:catalog_bytes=json.dumps(export_sqlite(db),ensure_ascii=False,allow_nan=False,separators=(',',':')).encode()
                    return self.send(200,catalog_bytes)
                if path in ('/search','/api/search'):
                    filters={k:one(k) for k in ['industry','frequency','transform','unit','source','health','role','geography'] if one(k)}
                    return self.send(200,search(db,one('q'),limit=int(one('limit','30')),**filters))
                if path in ('/indicator','/api/indicator'):
                    records=get_record(db,one('id'))
                    return self.send(200 if records else 404,{'records':records})
                if path in ('/relations','/api/relations'):return self.send(200,{'relations':get_relations(db,one('id'))})
                if path in ('/remote/search','/api/remote/search'):
                    if not allow_remote:return self.send(403,{'error':'remote_disabled','message':'启动时显式添加 --allow-remote 才能访问白名单World Bank连接器'})
                    return self.send(200,search_worldbank(one('q'),int(one('limit','20'))))
                if path in ('/remote/observations','/api/remote/observations'):
                    if not allow_remote:return self.send(403,{'error':'remote_disabled'})
                    return self.send(200,observations_worldbank(one('code'),one('country'),one('start'),one('end')))
                if path=='/':path='/indicators.html'
                if '\\' in path or '\x00' in path or '%' in path or '..' in Path(path).parts:
                    return self.send(404,{'error':'not_found'})
                relative=path.lstrip('/')
                if relative not in HTML and not relative.startswith('assets/'):
                    return self.send(404,{'error':'not_found'})
                file=(root/relative).resolve()
                assets_root=(root/'assets').resolve()
                allowed_scope=assets_root if relative.startswith('assets/') else root
                if not assets_root.is_relative_to(root) or not file.is_relative_to(allowed_scope) or not file.is_file():return self.send(404,{'error':'not_found'})
                return self.send(200,file.read_bytes(),mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
            except (ValueError,TypeError) as exc:return self.send(400,{'error':'invalid_request','message':str(exc)})
            except Exception as exc:
                return self.send(502,{'error':'operation_failed','message':str(exc),'note':'没有将失败伪装为空结果或改用演示数据'})
    server=ThreadingHTTPServer(('127.0.0.1',int(port)),Handler)
    print(f'IndicatorLab http://127.0.0.1:{server.server_port}/ (local only; remote={allow_remote})',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
