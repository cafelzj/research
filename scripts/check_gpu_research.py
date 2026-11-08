"""Check reviewed GPU organization, evidence references and static navigation."""
from collections import Counter
from datetime import date
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

from build_gpu_research import build, META

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'gpu-memory'

class Links(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.links=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:self.ids.append(attrs['id'])
        for key in ('href','src'):
            if attrs.get(key):self.links.append(attrs[key])

def check(data):
    models=data['models']['models']
    model_ids={m['id'] for m in models}
    assert len(model_ids)==len(models)
    sources=[s for name in ('models','bottlenecks') for s in data[name]['sources']]
    source_ids={s['id'] for s in sources}
    assert len(source_ids)==len(sources)
    cutoff=date.fromisoformat(data['models']['asOf'])
    for s in sources:
        assert all(s.get(key) for key in ('title','url','published','accessed','status','scope')),s['id']
        assert urlsplit(s['url']).scheme in ('http','https')
        assert date.fromisoformat(s['accessed'])<=cutoff
        if re.match(r'^\d{4}-\d{2}-\d{2}',s['published']):assert date.fromisoformat(s['published'][:10])<=cutoff
    for m in models:
        assert re.fullmatch(r'[a-z0-9_-]+',m['id'])
        for key in ('name','vendor','segment','architecture','form','stage','stageDate','memoryType','capacity','bandwidth','power','whatChanged','whyItMatters','comparisonCaveat','sourceIds'):
            assert m.get(key),(m['id'],key)
        assert set(m['sourceIds'])<=source_ids,m['id']
    for c in data['models']['comparisons']:
        assert set(c['modelIds'])<=model_ids
        assert c['paragraphs'] and c['columns'] and c['rows']
        assert all(len(row)==len(c['columns']) for row in c['rows']),c['id']
    ids=[x['id'] for x in data['bottlenecks']['items']]
    assert len(ids)==len(set(ids))
    for item in data['bottlenecks']['items']:
        for key in ('question','mechanism','symptoms','metrics','approaches','appliesTo','chainLink','verify','links','sourceIds'):
            assert item.get(key),(item['id'],key)
        assert set(item['sourceIds'])<=source_ids,item['id']
    for event in data['timelineAdditions']:
        assert event['modelId'] in model_ids
        assert date.fromisoformat(event['date'])<=cutoff
        assert event['status']=='production' and event['src'].startswith('https://')
    output=build(data)
    for name,text in output.items():assert (SITE/name).read_text()==text,'Rebuild '+name
    pages={}
    for filename in META:
        path=SITE/filename;links=Links();links.feed(path.read_text());pages[path.resolve()]=links
        assert len(links.ids)==len(set(links.ids)),(filename,Counter(links.ids))
    for path,links in pages.items():
        for href in links.links:
            url=urlsplit(href)
            if url.scheme or url.netloc:continue
            target=(path.parent/unquote(url.path)).resolve() if url.path else path
            assert target.is_relative_to(ROOT) and target.is_file(),(path.name,href)
            if url.fragment and target in pages:assert unquote(url.fragment) in pages[target].ids,(path.name,href)
    search=json.loads(output['assets/search_index.js'].split('=',1)[1].strip().removesuffix(';'))
    for row in search:
        assert row['title'] and row['text']
        url=urlsplit(row['url']);target=(SITE/url.path).resolve()
        assert target in pages,row
        if url.fragment:assert url.fragment in pages[target].ids,row
    print(f'PASS GPU research: {len(pages)} pages, {len(models)} product records, '
          f'{len(data["bottlenecks"]["items"])} bottlenecks; evidence graph, tables, '
          'source dates, static build, internal links and search destinations')

if __name__=='__main__':check(json.loads((SITE/'assets/research-map.json').read_text()))
