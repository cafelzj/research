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
    expect(page.locator('.w-category-section')).to_have_count(8)
    expect(page.locator('.w-evidence-card')).to_have_count(12)
    expect(page.locator('#menu-status')).to_contain_text('13 道有同类厂商')
    assert page.evaluate('new Set(WashokuData.dishes.map(d=>d.id)).size')==60
    assert page.evaluate('WashokuData.dishes.every(d=>d.refs.every(id=>WashokuData.sources[id]?.verified))')
    expect(page.locator('.w-scope')).to_contain_text('不是断言某家店一定使用预制菜')
    page.locator('[data-category="fried"]').click()
    expect(page.locator('.w-dish')).to_have_count(10)
    expect(page.locator('[data-category="fried"]')).to_have_attribute('aria-pressed','true')
    page.locator('#focus-filter').select_option('half')
    assert page.locator('.w-dish').count()>0
    assert page.locator('.w-stage.rust').count()==page.locator('.w-dish').count()
    page.locator('#reset-filters').click()
    page.locator('#dish-search').fill('GYozA')
    expect(page.locator('.w-dish')).to_have_count(1)
    expect(page.locator('.w-dish h4')).to_have_text('日式煎饺')
    page.locator('#dish-search').fill('不存在的菜xyz')
    expect(page.locator('.w-empty').first).to_contain_text('没有匹配')
    expect(page.locator('#export-menu')).to_be_disabled()
    page.locator('#reset-filters').click()
    page.locator('#proof-only').check()
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
    page.locator('[data-pin="kabayaki"]').click()
    expect(page.locator('[data-pin="kabayaki"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('.w-note-card')).to_have_count(1)
    note=page.locator('[data-note-card="kabayaki"]')
    note.locator('[data-field="basis"]').select_option('staff')
    note.locator('[data-field="stage"]').select_option('whole')
    note.locator('textarea').fill('<img src=x onerror=alert(1)> 店家说是熟制鳗鱼，尚未看包装')
    page.locator('#restaurant-name').fill('我的日料研究')
    page.reload()
    expect(note.locator('textarea')).to_have_value('<img src=x onerror=alert(1)> 店家说是熟制鳗鱼，尚未看包装')
    expect(note.locator('[data-field="basis"]')).to_have_value('staff')
    expect(page.locator('.w-note-card img')).to_have_count(0)
    with page.expect_download() as download:
        page.locator('#export-checklist').click()
    report=Path(download.value.path()).read_text()
    assert '我的日料研究' in report and '店家口头说明（未独立核实）' in report and '尚未看包装' in report
    page.locator('#reset-filters').click()
    page.locator('#saved-only').check()
    expect(page.locator('.w-dish')).to_have_count(1)
    page.locator('[data-pin="kabayaki"]').click()
    expect(page.locator('.w-dish')).to_have_count(0)
    page.reload();page.locator('#reset-filters').click()
    page.locator('#dish-search').fill('蒲烧鳗鱼')
    page.locator('[data-pin="kabayaki"]').click()
    expect(note.locator('textarea')).to_contain_text('尚未看包装')
    # Label says only which process to investigate, not a claim about a store.
    page.goto(BASE+'washoku.html?category=staple&q=鳗鱼')
    expect(page.locator('.w-dish')).to_have_count(1)
    expect(page.locator('.w-dish h4')).to_have_text('鳗鱼饭')
    expect(page.locator('.w-dish')).to_contain_text('冷冻鳗鱼饭商品')
    page.goto(BASE+'washoku.html?category=bad&focus=bad&q=')
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
    q.locator('[data-pin="wakame"]').click()
    expect(q.locator('.w-note-card')).to_have_count(1)
    expect(q.locator('#notebook-status')).to_contain_text('无法保存')
    print('PASS 60 dishes/8 categories, 13 linked examples/12 sources, category/path/search/proof filters, source links, CSV, notebook evidence levels and export, persistence/safe text, removed-note recovery, URL handling, responsive/keyboard/outline, topic navigation and blocked storage')
    browser.close()
