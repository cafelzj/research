"""Verify the uploaded GPU atlas stays usable when hosted below /research/."""
import os
from pathlib import Path
import sys
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright

BASE = (sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8000/').rstrip('/')+'/'
PAGES = sorted(p.name for p in Path('gpu-memory').glob('*.html'))

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ATLAS_BROWSER'),
        channel=None if os.environ.get('ATLAS_BROWSER') else 'chrome', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
    if BASE.startswith('https:'):
        def relay(route):
            with urlopen(route.request.url, timeout=40) as response:
                route.fulfill(status=response.status, body=response.read(),
                    headers={'content-type':response.headers.get('content-type','text/plain')})
        context.route(BASE+'**', relay)
    page = context.new_page()
    errors, failed = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failed.append((response.status,response.url))
        if response.status>=400 and response.url.startswith(BASE) else None)
    for origin in ('daily.html','washoku.html','chinese-menu.html'):
        page.goto(BASE+origin)
        page.get_by_role('link', name='GPU 与显存技术', exact=True).click()
        expect(page.locator('h1')).to_contain_text('技术知识网络')
    for width in (1440,390,320):
        page.set_viewport_size({'width':width,'height':900})
        for name in PAGES:
            response = page.goto(BASE+'gpu-memory/'+name)
            assert response.status==200, name
            expect(page.locator('h1')).to_have_count(1)
            expect(page.locator('.research-return a')).to_have_attribute('href','../daily.html')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), (name,width)
        if width==320:
            page.locator('#mobile-toggle').click()
            expect(page.locator('#sidebar')).to_be_visible()
            page.locator('#sidebar a[href="memory.html"]').click()
            expect(page.locator('#bw-width')).to_have_count(1)
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(BASE+'gpu-memory/index.html')
    expect(page.locator('#knowledge-graph [role="button"]')).to_have_count(15)
    node = page.locator('#knowledge-graph [data-id="tensor"]')
    node.focus();node.press('Enter')
    expect(page.locator('#graph-detail h3')).to_have_text('Tensor Core')
    page.locator('#graph-detail a').click()
    assert page.url.endswith('gpu.html#tensor')
    assert page.locator('#tensor').evaluate('e=>e.getBoundingClientRect().top')>=95
    page.locator('#search-trigger').click()
    page.locator('#global-search').fill('CoWoS')
    expect(page.locator('#search-results a').first).to_be_visible()
    page.locator('#search-results a').first.click()
    assert '/gpu-memory/' in page.url
    page.locator('#search-trigger').click()
    page.locator('#global-search').fill('zzzz不存在')
    expect(page.locator('#search-results')).to_contain_text('未找到')
    page.keyboard.press('Escape')
    expect(page.locator('#search-modal')).not_to_be_visible()
    page.goto(BASE+'gpu-memory/timeline.html')
    expect(page.locator('.milestone')).to_have_count(21)
    page.locator('#filter-vendor').select_option('Samsung')
    page.locator('#filter-type').select_option('memory')
    page.locator('#filter-period').select_option('2026')
    expect(page.locator('.milestone')).to_have_count(2)
    expect(page.locator('#timeline-items')).to_contain_text('HBM4E')
    page.locator('#filter-period').select_option('post')
    expect(page.locator('#timeline-items')).to_contain_text('没有符合')
    page.goto(BASE+'gpu-memory/glossary.html')
    page.locator('#term-search').fill('TSV')
    expect(page.locator('#glossary-body tr')).to_have_count(1)
    expect(page.locator('#glossary-body')).to_contain_text('Through-Silicon Via')
    page.goto(BASE+'gpu-memory/memory.html')
    page.locator('#bw-width').fill('2048');page.locator('#bw-speed').fill('16')
    expect(page.locator('#bw-result')).to_have_text('4.096 TB/s')
    page.goto(BASE+'gpu-memory/packaging.html')
    page.locator('#power-w').fill('1000');page.locator('#power-v').fill('0.8')
    page.locator('#power-r').fill('10')
    expect(page.locator('#power-current')).to_have_text('1,250 A')
    expect(page.locator('#power-loss')).to_have_text('15.63 W')
    page.locator('.research-return a').click()
    expect(page.locator('#map-host [data-country]')).to_have_count(10)
    context.add_init_script("Storage.prototype.getItem=Storage.prototype.setItem=function(){throw Error('blocked')}")
    page.goto(BASE+'gpu-memory/index.html')
    expect(page.locator('#knowledge-graph [role="button"]')).to_have_count(15)
    page.locator('[data-learning-check="memory"]').check()
    assert not errors, errors
    assert not failed, failed
    browser.close()
print('PASS GPU atlas: three daily-topic entries, all ten pages at 1440/390/320px, '
      'mobile navigation, graph/anchor links, search, timeline, glossary, bandwidth/power '
      'calculators, return to daily map and operation with blocked storage')
