"""Exercise real reading/navigation flows; public TLS uses the configured system trust."""
import json
import sys
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parents[1]
BASE = (sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8026/').rstrip('/')+'/'
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
    expect(page.locator('#model,#workflow')).to_have_count(0)
    assert page.locator('#chemicalContent>section').evaluate_all('(els)=>els.map(e=>e.id)')[:6]==['sectors','map','product-applications','framework','metrics','glossary']
    expect(page.locator('.atlas-sector-group')).to_have_count(4)
    expect(page.locator('.atlas-sector-row')).to_have_count(14)
    expect(page.locator('.atlas-topic-link')).to_have_count(6)
    page.locator('#search').fill('冰箱')
    expect(page.locator('#atlas-product-results')).to_be_visible()
    result=page.locator('#atlas-product-results a').first
    result.click()
    assert 'chemChain=pu' in page.url and '#chem-product-' in page.url
    assert page.locator('#'+page.url.split('#')[1]).is_visible()
    page.locator('#search').fill('')
    expect(page.locator('#atlas-product-results')).to_be_hidden()
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
        page.locator('.chem-reader-menu summary').click()
        expect(page.locator('.chem-reader-menu')).to_have_attribute('open','')
        page.locator('.chem-menu-products a').last.click()
        expect(page.locator('.chem-reader-menu')).not_to_have_attribute('open','')
        page.wait_for_timeout(350)
        bar=page.locator('.chem-reading-bar').bounding_box()
        assert -1 <= bar['y'] <= 2, bar
        page.locator('.chem-reader-menu summary').click()
        page.keyboard.press('Escape')
        expect(page.locator('.chem-reader-menu')).not_to_have_attribute('open','')
    page.goto(BASE+'atlas.html?industry=chemical&chemChain=fluoro#chem-product-5')
    expect(page.locator('.chem-chapter-header h3')).to_have_text('氟化工')
    page.locator('[data-chem-chain="silicon"]').click()
    page.go_back()
    expect(page.locator('.chem-chapter-header h3')).to_have_text('氟化工')
    assert '#chem-product-5' in page.url
    page.locator('[data-industry-choice="appliances"]').click()
    expect(host).to_be_hidden()
    page.locator('[data-industry-choice="chemical"]').click()
    expect(host).to_be_visible()
    page.set_viewport_size({'width':390,'height':844})
    for c in data['chapters']:
        page.locator('[data-chem-chain="'+c['key']+'"]').click()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    page.locator('.chem-reader-menu summary').click()
    page.wait_for_timeout(100)
    menu=page.locator('.chem-reader-links').bounding_box()
    assert menu['y']>=0 and menu['y']+menu['height']<=844,menu
    page.keyboard.press('Escape')
    page.locator('.page-outline-trigger').click()
    expect(page.locator('#pageOutline')).to_contain_text('01 · 子行业目录')
    expect(page.locator('#pageOutline')).not_to_contain_text('价差推演')
    expect(page.locator('#pageOutline')).not_to_contain_text('研究路径')
    page.keyboard.press('Escape')
    page.set_viewport_size({'width':320,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    expect(host.locator('a[download]')).to_have_count(1)
    with urlopen(BASE+'assets/chemical-research-handbook.md',timeout=40) as r:
        handbook=r.read().decode()
    assert all('## '+c['name'] in handbook for c in data['chapters'])
    assert len(handbook)>25000
    assert not errors,errors
    b.close()
print('PASS six research chapters, product/source integrity, deep links, nine-part reading flow, industry switch, mobile layout, same-content handbook and no runtime errors')
