"""The handbook is static, counts reconcile, and tool handoffs preserve the catalog."""
import json
import sys
from pathlib import Path
from urllib.request import urlopen
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parents[1]
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8041/').rstrip('/')+'/'
summary=json.loads((ROOT/'assets/indicator-audit-summary.json').read_text())
assert summary['totals']['references']==62241 and summary['totals']['entities']==61781
assert sum(summary['reference_counts']['industry'].values())==62241
assert sum(summary['reference_counts']['frequency'].values())==62241
assert sum(summary['entity_counts']['frequency'].values())==61781
assert summary['reference_counts']['missing_unit']==709
assert summary['entity_counts']['missing_unit']==508
assert summary['totals']['has_observations'] is False
assert 'records' not in summary and 'issues' not in summary

class IDs(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.anchors=[]
    def handle_starttag(self,tag,attrs):
        data=dict(attrs)
        if data.get('id'):self.ids.append(data['id'])
        if tag=='a' and data.get('href'):self.anchors.append(data['href'])
for name in ['indicators.html','indicator-guide.html']:
    parser=IDs();parser.feed((ROOT/name).read_text())
    assert len(parser.ids)==len(set(parser.ids)),name
    assert all(h[1:] in parser.ids for h in parser.anchors if h.startswith('#guide-')),name

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':1000});errors=[]
    if BASE.startswith('https:'):
        def relay(route):
            with urlopen(route.request.url,timeout=40) as r:
                route.fulfill(status=r.status,body=r.read(),headers={'content-type':r.headers.get('content-type','text/plain')})
        context.route(BASE+'**',relay)
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'indicators.html')
    expect(page.locator('#view-guide')).to_be_hidden()
    expect(page.locator('.research-guide-entry')).to_contain_text('62,241')
    page.locator('.research-guide-entry .guide-primary').click()
    expect(page.locator('#view-guide')).to_be_visible()
    assert '#view=guide' in page.url
    expect(page.locator('#view-guide .guide-chapter')).to_have_count(8)
    expect(page.locator('#guide-audit')).to_contain_text('709')
    expect(page.locator('#guide-audit')).to_contain_text('508')
    assert page.locator('#catalog-label').inner_text().startswith('演示目录')
    # Print expands advanced definitions and restores the prior reading state.
    assert page.locator('#view-guide details[open]').count()==0
    page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
    assert page.locator('#view-guide details:not([open])').count()==0
    page.evaluate("window.dispatchEvent(new Event('afterprint'))")
    assert page.locator('#view-guide details[open]').count()==0
    page.locator('#view-guide .guide-contents a[href="#guide-relations"]').click()
    assert '#guide-relations' in page.url
    expect(page.locator('#guide-relations')).to_contain_text('23,857')
    page.go_back();expect(page.locator('#view-guide')).to_be_visible()
    page.locator('#guide-relations [href="#view=paths"]').click()
    expect(page.locator('#view-paths')).to_be_visible()
    page.go_back();expect(page.locator('#view-guide')).to_be_visible()
    # Import one private indicator and enter the guide without losing it.
    record={'id':'PRIVATE-1','code':'PRIVATE-1','name':'碳酸二甲酯(DMC)价格:当周值','industry':'私有标签','frequency':'周','unit':'元/吨','source':'用户当前目录','health':'正常','aliases':[],'role':'价格与成本','transform':'原值'}
    doc={'schema_version':1,'meta':{'source_row_count':1},'records':[record],'audit':{'issues':[]},'relations':[]}
    page.locator('#catalog-file').set_input_files({'name':'private-one.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
    expect(page.locator('#catalog-label')).to_contain_text('private-one.json')
    page.locator('[data-view=search]').click()
    page.locator('#filter-industry').select_option('私有标签')
    page.locator('[data-view=guide]').click()
    page.locator('#guide-search a[href*="q=DMC"]').click()
    expect(page.locator('#view-search')).to_be_visible()
    expect(page.locator('.metric-row')).to_have_count(1)
    expect(page.locator('.metric-row')).to_contain_text('PRIVATE-1')
    assert page.locator('#filter-industry').input_value()==''
    expect(page.locator('#catalog-label')).to_contain_text('private-one.json')
    page.locator('.metric-open').click()
    expect(page.locator('#metric-dialog')).to_be_visible()
    page.keyboard.press('Escape')
    page.locator('[data-view=guide]').click()
    page.locator('#guide-start a[href="#catalog-manager"]').click()
    expect(page.locator('#view-search')).to_be_visible()
    expect(page.locator('#catalog-label')).to_contain_text('private-one.json')
    # Standalone guide opens a correctly scoped preset in the tool.
    page.goto(BASE+'indicator-guide.html#guide-search')
    expect(page.locator('h1')).to_have_text('指标研究手册')
    page.locator('#guide-search a[href*="q=CPI"][href*="scope=remote"]').click()
    expect(page.locator('#view-search')).to_be_visible()
    expect(page.locator('[name=scope][value=remote]')).to_be_checked()
    expect(page.locator('.metric-row')).to_have_count(1)
    expect(page.locator('.metric-row')).to_contain_text('年度')
    for width in [390,320]:
        page.set_viewport_size({'width':width,'height':844})
        page.goto(BASE+'indicators.html#guide-pipeline')
        expect(page.locator('#view-guide')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.goto(BASE+'indicator-guide.html#guide-relations')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.locator('.page-outline-trigger').click()
        expect(page.locator('#pageOutline .page-outline-list li')).to_have_count(8)
        page.locator('#pageOutline a[href="#guide-capabilities"]').click()
        expect(page.locator('#pageOutline')).not_to_be_visible()
        assert '#guide-capabilities' in page.url
    page.screenshot(path='/tmp/indicator-guide-mobile.png')
    assert not errors,errors
    # All audit/method text remains readable when scripts are disabled.
    offline=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    if BASE.startswith('https:'):offline.route(BASE+'**',relay)
    q=offline.new_page();q.goto(BASE+'indicator-guide.html#guide-audit')
    expect(q.locator('#guide-audit')).to_be_visible()
    expect(q.locator('#guide-audit')).to_contain_text('61,781')
    expect(q.locator('.guide-chapter')).to_have_count(8)
    assert q.locator('script[src*="indicator-search"]').count()==0
    q.goto(BASE+'indicators.html#guide-audit')
    expect(q.locator('#view-guide')).to_be_visible()
    expect(q.locator('.guide-noscript')).to_be_visible()
    offline.close();context.close();browser.close()
print('PASS handbook static counts, shared content, anchors/deep links, no-script reading, query/scope handoff without replacing private catalog, back navigation, print restoration and mobile outline')
