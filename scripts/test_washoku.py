"""Meaningful browser regression for the menu process guide."""
import csv
import io
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8002/').rstrip('/')+'/'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'washoku.html')
    expect(page.locator('.w-dish')).to_have_count(60)
    expect(page.locator('input,textarea,select,form,[data-pin],#research-checklist')).to_have_count(0)
    expect(page.locator('.w-category-section')).to_have_count(8)
    expect(page.locator('.w-evidence-card')).to_have_count(12)
    expect(page.locator('.w-risk-tile')).to_have_count(3)
    expect(page.locator('.w-hotspot')).to_have_count(5)
    expect(page.locator('.w-dish[data-risk="high"]')).to_have_count(26)
    expect(page.locator('.w-dish[data-risk="medium"]')).to_have_count(23)
    expect(page.locator('.w-dish[data-risk="low"]')).to_have_count(11)
    expect(page.locator('.w-dish .w-risk-badge')).to_have_count(60)
    expect(page.locator('#menu-status')).to_contain_text('13 道有同类厂商')
    assert page.evaluate('new Set(WashokuData.dishes.map(d=>d.id)).size')==60
    assert page.evaluate('WashokuData.dishes.every(d=>d.refs.every(id=>WashokuData.sources[id]?.verified))')
    assert page.evaluate('WashokuData.dishes.every(d=>WashokuData.riskLevels[d.risk.level] && d.risk.reason.length>20 && d.risk.target.length>4)')
    assert page.evaluate('WashokuData.hotspots.every(g=>g.dishes.every(id=>WashokuData.dishes.find(d=>d.id===id)?.risk.level==="high"))')
    expect(page.locator('.w-scope')).to_contain_text('不是断言某家店一定使用预制菜')
    # Risk is the primary judgment. Main-component risk must not imply a whole meal is bought in.
    expect(page.locator('#dish-unadon .w-risk-badge')).to_contain_text('高风险')
    expect(page.locator('#dish-unadon .w-risk-target')).to_contain_text('米饭另判')
    expect(page.locator('#dish-salmon-sashimi .w-risk-badge')).to_contain_text('低风险')
    expect(page.locator('#dish-udon .w-risk-badge')).to_contain_text('中风险')
    assert page.evaluate('Array.from(document.querySelectorAll(".w-dish-grid")).every(g=>{const ranks=Array.from(g.children,d=>WashokuData.riskLevels[d.dataset.risk].rank);return ranks.every((r,i)=>!i||r>=ranks[i-1])})')
    page.locator('#high-risk-shortcut').click()
    expect(page.locator('.w-dish')).to_have_count(26)
    expect(page.locator('[data-risk-button="high"]')).to_have_attribute('aria-pressed','true')
    assert 'risk=high' in page.url
    page.locator('[data-category="fried"]').click()
    expect(page.locator('.w-dish')).to_have_count(9)
    page.locator('#proof-only').click()
    expect(page.locator('.w-dish')).to_have_count(4)
    page.locator('[data-risk-filter="low"]').click()
    expect(page.locator('.w-dish')).to_have_count(11)
    expect(page.locator('#proof-only')).to_have_attribute('aria-pressed','false')
    page.locator('[data-hotspot-dish="kabayaki"]').click()
    expect(page.locator('.w-dish')).to_have_count(1)
    expect(page.locator('.w-dish .w-risk-badge')).to_contain_text('高风险')
    page.locator('#reset-filters').click()
    page.locator('[data-category="fried"]').click()
    expect(page.locator('.w-dish')).to_have_count(10)
    expect(page.locator('[data-category="fried"]')).to_have_attribute('aria-pressed','true')
    page.locator('.w-path-details summary').click()
    page.locator('[data-focus="half"]').click()
    assert page.locator('.w-dish').count()>0
    assert page.locator('.w-stage.rust').count()==page.locator('.w-dish').count()
    page.locator('#reset-filters').click()
    page.goto(BASE+'washoku.html?q=GYozA')
    expect(page.locator('.w-dish')).to_have_count(1)
    expect(page.locator('.w-dish h4')).to_have_text('日式煎饺')
    page.goto(BASE+'washoku.html?q=不存在的菜xyz')
    expect(page.locator('.w-empty').first).to_contain_text('没有匹配')
    expect(page.locator('#export-menu')).to_be_disabled()
    page.locator('#reset-filters').click()
    page.locator('#proof-only').click()
    expect(page.locator('.w-dish')).to_have_count(13)
    page.locator('[data-starter="kabayaki"]').click()
    expect(page.locator('.w-dish')).to_have_count(1)
    expect(page.locator('.w-dish h4')).to_have_text('蒲烧鳗鱼')
    page.locator('.w-dish summary').click()
    expect(page.locator('.w-source-links')).to_contain_text('川口水产')
    with page.expect_download() as download:
        page.locator('#export-menu').click()
    rows=list(csv.DictReader(io.StringIO(Path(download.value.path()).read_text(encoding='utf-8-sig'))))
    assert len(rows)==1 and rows[0]['菜品']=='蒲烧鳗鱼' and '不是' not in rows[0]['核实方向（非门店结论）']
    assert rows[0]['商品例证URL']=='https://unagiya.com/cp/processing.html'
    assert rows[0]['预制风险（定性判断，非门店查实）']=='高风险 · 预制重灾区'
    assert '已完成蒲烧' in rows[0]['风险判断对象'] and '真空鳗鱼' in rows[0]['风险判断理由']
    assert rows[0]['判断依据类型']=='同类厂商商品例证 + 工序推断'
    # Grade applies to the specified component and remains an editorial judgment.
    page.goto(BASE+'washoku.html?category=staple&q=鳗鱼')
    expect(page.locator('.w-dish')).to_have_count(1)
    expect(page.locator('.w-dish h4')).to_have_text('鳗鱼饭')
    expect(page.locator('.w-dish')).to_contain_text('冷冻鳗鱼饭商品')
    page.goto(BASE+'washoku.html?risk=high&category=staple')
    expect(page.locator('.w-dish')).to_have_count(2)
    page.locator('[data-risk-button="low"]').click()
    expect(page.locator('.w-dish h4')).to_have_text('亲子丼')
    page.evaluate("history.pushState(null,'','?risk=high');dispatchEvent(new PopStateEvent('popstate'))")
    expect(page.locator('[data-risk-button="high"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('.w-dish')).to_have_count(26)
    page.locator('[data-starter="wakame"]').click()
    expect(page.locator('[data-risk-button="all"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('.w-dish')).to_have_count(1)
    page.goto(BASE+'washoku.html?category=bad&focus=bad&risk=bad&q=')
    expect(page.locator('.w-dish')).to_have_count(60)
    for width in [1100,768,390,320]:
        page.set_viewport_size({'width':width,'height':844})
        page.wait_for_function('document.documentElement.scrollWidth<=innerWidth')
        if width<=390:
            page.locator('.page-outline-trigger').click()
            expect(page.locator('#pageOutline')).to_contain_text('菜品分类与制作路径')
            page.keyboard.press('Escape')
    page.goto(BASE+'daily.html')
    page.locator('.research-topic-nav a[href="washoku.html"]').click()
    page.wait_for_url('**/washoku.html')
    expect(page.locator('.w-topics a[aria-current]')).to_contain_text('日料菜单')
    assert not errors,errors
    context=browser.new_context()
    context.add_init_script("Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')}")
    q=context.new_page();q.goto(BASE+'washoku.html')
    expect(q.locator('.w-dish')).to_have_count(60)
    expect(q.locator('input,textarea,select,form,[data-pin]')).to_have_count(0)
    print('PASS 60 risk judgments (26 high/23 medium/11 low), 5 hotspots, risk-first ordering, combined filters/reset/deep links/history, component scope, 13 linked examples/12 sources, CSV with reasons, no forms/favorites/notebooks, responsive/keyboard/outline, topic navigation without storage dependence')
    browser.close()
