"""Exercise the appliance handbook through the actual public reader flows."""
import json
import os
from pathlib import Path
import sys
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright
from build_appliances import slug

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000/').rstrip('/') + '/'
DATA = json.loads(Path('assets/appliances-research.json').read_text())


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ATLAS_BROWSER'),
                               channel=None if os.environ.get('ATLAS_BROWSER') else 'chrome',
                               args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
    if BASE.startswith('https:'):
        def relay(route):
            with urlopen(route.request.url, timeout=40) as r:
                route.fulfill(status=r.status, body=r.read(),
                              headers={'content-type':r.headers.get('content-type','text/plain')})
        context.route(BASE+'**', relay)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    # The industry catalog and original deeper topic both expose the handbook.
    for route in ('atlas.html?sw=801110', 'atlas.html?industry=appliances'):
        page.goto(BASE+route)
        page.get_by_role('link', name='家电研究框架与学习手册 ↗', exact=True).click()
        expect(page.locator('h1')).to_contain_text('做到能独立判断')
    expect(page.locator('[data-outline]')).to_have_count(13)
    expect(page.locator('#ap-companies-count')).to_contain_text('31 / 31')
    for frontier in DATA['technology']['frontiers']:
        expect(page.locator('#ap-frontier-'+slug(frontier['id'])+' .ap-badge')).to_have_text(frontier['stageLabel'])
    # Combining role and keyword filters must never leave stale results.
    company = DATA['companyResearch']['companies'][0]
    page.locator('#ap-companies-query').fill(company['name'])
    page.locator('#ap-companies-category').select_option(company['role'])
    expect(page.locator('#ap-company-'+slug(company['id']))).to_be_visible()
    assert page.locator('[data-filter-owner="ap-companies"]:visible').count() < len(DATA['companyResearch']['companies'])
    page.locator('#ap-companies-query').fill('zzzz不存在')
    expect(page.locator('#ap-companies-count')).to_contain_text('显示 0')
    # Global search must reveal content even if a local filter hid it.
    page.locator('#ap-search').fill(company['name'])
    result = page.locator('#ap-search-results a').filter(has_text=company['name']).first
    target = result.get_attribute('href')
    result.click()
    expect(page.locator(target)).to_be_visible()
    expect(page.locator('#ap-companies-query')).to_have_value('')
    # Technical definitions and data dictionaries remain searchable separately.
    for prefix, key in [('ap-tech', 'foundations'), ('ap-metrics','metrics')]:
        rows = DATA['technology' if key == 'foundations' else 'measurement'][key]
        page.locator('#'+prefix+'-query').fill(rows[0]['name'])
        assert 0 < page.locator('[data-filter-owner="'+prefix+'"]:visible').count() < len(rows)
        page.locator('#'+prefix+'-query').fill('zzzz不存在')
        expect(page.locator('#'+prefix+'-count')).to_contain_text('显示 0')
        page.locator('#'+prefix+'-query').fill('')
        expect(page.locator('[data-filter-owner="'+prefix+'"]:visible')).to_have_count(len(rows))
    # A source link opens its enclosing group; a direct reload also reveals it.
    reference = page.locator('.ap-refs a:visible').first
    source = reference.get_attribute('href')
    reference.click()
    expect(page.locator(source)).to_be_visible()
    page.reload()
    expect(page.locator(source)).to_be_visible()
    # A deep technical link expands details and survives reload/back navigation.
    technical_id = page.locator('[data-filter-owner="ap-tech"]').first.get_attribute('id')
    page.goto(BASE+'appliances.html#'+technical_id)
    expect(page.locator('#'+technical_id)).to_have_attribute('open','')
    page.reload()
    expect(page.locator('#'+technical_id)).to_have_attribute('open','')
    # No whole-page horizontal overflow, including expanded supply-chain tables.
    for width in (390, 320):
        page.set_viewport_size({'width':width, 'height':844})
        page.goto(BASE+'appliances.html')
        page.locator('#ap-chains details').first.locator('summary').click()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), width
        page.locator('.page-outline-trigger').click()
        expect(page.locator('#pageOutline a')).to_have_count(13)
        page.locator('#pageOutline a[data-target="ap-training"]').click()
        expect(page.locator('#pageOutline')).not_to_be_visible()
        expect(page.locator('#ap-training')).to_be_focused()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), width
    # Static content remains usable without any script or browser storage.
    no_js = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
    if BASE.startswith('https:'):
        no_js.route(BASE+'**', relay)
    static = no_js.new_page()
    static.goto(BASE+'appliances.html')
    expect(static.locator('[data-outline]')).to_have_count(13)
    expect(static.locator('#ap-chains details')).to_have_count(len(DATA['chains']['categories']))
    static.locator('#ap-chains details').first.locator('summary').click()
    expect(static.locator('#ap-chains .ap-detail-body').first).to_be_visible()
    assert not errors, errors
    browser.close()
print('PASS appliance reader: catalog and legacy entries, company/technology/data filters, '
      'global search revealing filtered content, source and technical deep links, '
      '320/390px layouts, mobile outline and static reading without JavaScript')
