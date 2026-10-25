"""Browser checks for menu research, source scope and a read-only menu."""
import csv
import io
import sys
import re
from urllib.request import urlopen
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8004/').rstrip('/') + '/'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440, 'height':1000})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE+'chinese-menu.html')
    expect(page.locator('[data-quick-dish]')).to_have_count(94)
    expect(page.locator('input,textarea,select,form,[data-pin],#research-checklist')).to_have_count(0)
    expect(page.locator('.c-quick-table').first.locator('thead th')).to_have_count(3)
    expect(page.locator('.w-category-section')).to_have_count(9)
    expect(page.locator('.w-evidence-card')).to_have_count(31)
    expect(page.locator('.w-hotspot')).to_have_count(6)
    expect(page.locator('#menu-status')).to_contain_text('56 项有同类厂商商品例证')
    with urlopen(BASE+'assets/chinese-menu-risk.csv') as response:
        complete = list(csv.DictReader(io.StringIO(response.read().decode('utf-8-sig'))))
    assert len(complete)==94 and sum(row['预制风险（定性判断，非门店查实）'].startswith('高风险') for row in complete)==66
    assert all(row['风险判断对象'] and row['风险判断理由'] for row in complete)
    assert page.evaluate('new Set(MenuRiskData.dishes.map(d=>d.id)).size===94')
    assert page.evaluate('MenuRiskData.dishes.every(d=>MenuRiskData.riskLevels[d.risk.level] && d.risk.reason && d.risk.target && d.refs.every(r=>MenuRiskData.sources[r]?.verified))')
    assert page.evaluate('MenuRiskData.hotspots.every(g=>g.dishes.every(id=>MenuRiskData.dishes.find(d=>d.id===id)?.risk.level==="high"))')
    expect(page.locator('[data-quick-dish="suancai"]')).to_contain_text('鱼片与汤料')
    expect(page.locator('[data-quick-dish="luroufan"]')).to_contain_text('米饭另看')
    expect(page.locator('[data-quick-dish="tomatoegg"] .w-risk-badge')).to_contain_text('低风险')
    # Wide list is practical in both compact and detailed views.
    page.locator('#high-risk-shortcut').click()
    expect(page.locator('[data-quick-dish]')).to_have_count(66)
    assert 'risk=high' in page.url
    page.locator('#proof-only').click()
    assert 0 < page.locator('[data-quick-dish]').count() < 66
    page.locator('[data-category="dim-sum"]').click()
    expect(page.locator('[data-quick-dish]')).to_have_count(10)
    page.locator('[data-menu-view="cards"]').click()
    expect(page.locator('.w-dish')).to_have_count(10)
    expect(page.locator('[data-menu-view="cards"]')).to_have_attribute('aria-pressed','true')
    page.locator('[data-risk-filter="low"]').click()
    expect(page.locator('.w-dish')).to_have_count(8)
    expect(page.locator('#proof-only')).to_have_attribute('aria-pressed','false')
    page.locator('[data-hotspot-dish="xiaosurou"]').click()
    expect(page.locator('.w-dish')).to_have_count(1)
    expect(page.locator('.w-dish .w-risk-reason')).to_contain_text('鸡肉')
    page.locator('.w-dish details summary').click()
    expect(page.locator('.w-source-links')).to_contain_text('安井食品')
    with page.expect_download() as download:
        page.locator('#export-menu').click()
    assert download.value.suggested_filename=='中餐预制风险避雷清单.csv'
    rows=list(csv.DictReader(io.StringIO(Path(download.value.path()).read_text(encoding='utf-8-sig'))))
    assert len(rows)==1 and rows[0]['菜品']=='小酥肉'
    assert rows[0]['预制风险（定性判断，非门店查实）'].startswith('高风险')
    assert '鸡肉' in rows[0]['风险判断理由'] and rows[0]['适用场景']
    assert 'menuId=44' in rows[0]['官网公开产品数据URL']
    page.goto(BASE+'washoku.html')
    expect(page.locator('.w-dish')).to_have_count(60)
    expect(page.locator('input,textarea,select,form,[data-pin],#research-checklist')).to_have_count(0)
    page.locator('.w-topics a[href="chinese-menu.html"]').click()
    expect(page.locator('[data-quick-dish]')).to_have_count(94)
    # Deep links, source-only reset, no-match state, and responsive semantic tables.
    page.goto(BASE+'chinese-menu.html?category=seafood&risk=low')
    expect(page.locator('[data-quick-dish]')).to_have_count(2)
    page.locator('#reset-filters').click()
    page.goto(BASE+'chinese-menu.html?q=不存在的菜xyz')
    expect(page.locator('#export-menu')).to_be_disabled()
    expect(page.locator('#dish-results .w-empty')).to_contain_text('没有匹配')
    page.locator('[data-starter="hongshao"]').click()
    expect(page.locator('[data-quick-dish]')).to_have_count(1)
    page.locator('#evidence-library').scroll_into_view_if_needed()
    expect(page.locator('#evidence-anjoy-mister a').last).to_have_attribute('href', re.compile('menuId=48'))
    page.goto(BASE+'chinese-menu.html?category=bad&risk=bad&focus=bad')
    expect(page.locator('[data-quick-dish]')).to_have_count(94)
    for width in [1100,768,390,320]:
        page.set_viewport_size({'width':width,'height':844})
        page.wait_for_function('document.documentElement.scrollWidth<=innerWidth')
        if width<=390:
            page.locator('.page-outline-trigger').click()
            expect(page.locator('#pageOutline')).to_contain_text('中餐点单避雷速查表')
            page.keyboard.press('Escape')
    page.locator('[data-hotspot-dish="meicai"]').click()
    expect(page.locator('[data-quick-dish]')).to_have_count(1)
    page.locator('[data-quick-dish="meicai"] summary').click()
    expect(page.locator('[data-quick-dish="meicai"] .w-source-links')).to_contain_text('安井冻品先生')
    page.goto(BASE+'daily.html')
    page.locator('.research-topic-nav a[href="chinese-menu.html"]').click()
    expect(page.locator('.w-topics a[aria-current]')).to_have_text('中餐预制菜避雷')
    assert not errors, errors
    context=browser.new_context()
    context.add_init_script("Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')}")
    q=context.new_page();q.goto(BASE+'chinese-menu.html')
    expect(q.locator('[data-quick-dish]')).to_have_count(94)
    expect(q.locator('input,textarea,select,form,[data-pin]')).to_have_count(0)
    print('PASS 94 entries/9 categories, 66 high/20 medium/8 low, 56 linked examples/31 sources, table/cards, combined filters, risk scope and meat species, exports, no inputs/favorites/notebooks, source APIs, deep links, mobile/outline/navigation without storage dependence')
    browser.close()
