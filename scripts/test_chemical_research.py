"""Exercise real reading/navigation flows; public TLS uses the configured system trust."""
import json
import sys
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parents[1]
BASE = (sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8021/').rstrip('/')+'/'
data = json.loads((ROOT/'assets/chemical-applications-data.js').read_text().removeprefix('window.ChemicalResearch = ').strip().removesuffix(';'))
assert len(data['chapters']) == 6
for c in data['chapters']:
    assert len(c['products']) >= 6 and len(c['glossary']) >= 5
    for p in c['products']:
        for key in ['mechanism','application','advantage','alternative','metrics','boundary']:
            assert p[key], (c['name'],p['name'],key)
        assert all(s in data['sources'] for s in p['refs'].split(','))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':1000}); errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    if BASE.startswith('https:'):
        def relay(route):
            with urlopen(route.request.url,timeout=40) as r:
                route.fulfill(status=r.status,body=r.read(),headers={'content-type':r.headers.get('content-type','text/plain')})
        page.route(BASE+'**',relay)
    page.goto(BASE+'atlas.html?chemChain=phosphate#product-applications')
    expect(page.locator('.chem-chapter-header h3')).to_have_text('磷化工')
    host=page.locator('#product-applications')
    expect(host.locator('input,textarea,select,form')).to_have_count(0)
    for c in data['chapters']:
        page.locator('[data-chem-chain="'+c['key']+'"]').click()
        expect(page.locator('.chem-product')).to_have_count(len(c['products']))
        expect(page.locator('.chem-body>section')).to_have_count(9)
        assert 'chemChain='+c['key'] in page.url
        assert page.locator('.chem-body').inner_text().count('客户关注的性能指标') == len(c['products'])
        # Every product source resolves to the currently rendered bibliography.
        targets=host.locator('.chem-evidence a').evaluate_all('(els)=>els.map(a=>a.hash)')
        assert targets and all(page.locator(t).count()==1 for t in targets)
        first=page.locator('.chem-product-index a').first
        first.click(); assert '#chem-product-0' in page.url
        assert page.locator('#chem-product-0').is_visible()
    page.locator('[data-industry-choice="appliances"]').click()
    expect(host).to_be_hidden()
    page.locator('[data-industry-choice="chemical"]').click()
    expect(host).to_be_visible()
    page.set_viewport_size({'width':390,'height':844})
    for c in data['chapters']:
        page.locator('[data-chem-chain="'+c['key']+'"]').click()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    expect(host.locator('a[download]')).to_have_count(1)
    with urlopen(BASE+'assets/chemical-research-handbook.md',timeout=40) as r:
        handbook=r.read().decode()
    assert all('## '+c['name'] in handbook for c in data['chapters'])
    assert len(handbook)>25000
    assert not errors,errors
    b.close()
print('PASS six research chapters, product/source integrity, deep links, nine-part reading flow, industry switch, mobile layout, same-content handbook and no runtime errors')
