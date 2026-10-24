"""Browser regressions for the daily research map; pass an optional server base URL."""
import csv
import io
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = (sys.argv[1] if len(sys.argv)>1 else "http://127.0.0.1:8001/").rstrip('/')+'/'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'daily.html')
    expect(page.locator('#map-host [data-country]')).to_have_count(10)
    expect(page.locator('#country-summary')).to_contain_text('112.6')
    expect(page.locator('#country-summary')).to_contain_text('2 / 10')
    expect(page.locator('#country-summary')).to_contain_text('70.7')
    expect(page.locator('#event-scope')).to_contain_text('年份')
    expect(page.locator('#event-link')).to_have_attribute('href',page.evaluate('DailyResearchData.event.url'))
    # Values are joined by ISO code, not guessed from country names or map position.
    for code in ['FRA','DEU','ITA','ESP','NLD','BEL','POL','SWE','AUT','DNK']:
        shape=page.locator(f'#map-host [data-country="{code}"]')
        shape.focus();shape.press('Enter')
        expect(page.locator('#daily-country')).to_have_value(code)
        expect(shape).to_have_attribute('aria-pressed','true')
        assert page.locator('#country-summary .country-value').inner_text()!='—'
    page.locator('#daily-reset').click()
    with page.expect_download() as export:
        page.locator('#download-view').click()
    rows=list(csv.DictReader(io.StringIO(Path(export.value.path()).read_text(encoding='utf-8-sig'))))
    assert len(rows)==10
    fr=next(r for r in rows if r['ISO3']=='FRA')
    assert fr['指标代码']=='GGXWDG_NGDP' and fr['年份']=='2024' and abs(float(fr['值'])-112.573)<1e-9
    with page.expect_download() as svg:
        page.locator('#download-map').click()
    text=Path(svg.value.path()).read_text()
    assert 'xmlns="http://www.w3.org/2000/svg"' in text and '2024年' in text and 'Natural Earth' in text and '官方原发布待回查' in text
    assert '<style>' in text and 'daily-missing' in text
    page.locator('#daily-metric').select_option('education')
    expect(page.locator('#daily-year')).to_have_value('2022')
    expect(page.locator('#daily-status')).to_contain_text('2022')
    expect(page.locator('#metric-definition')).to_contain_text('SE.XPD.TOTL.GD.ZS')
    expect(page.locator('#country-summary')).to_contain_text('5.3')
    page.locator('#save-view').click();page.locator('#save-view').click()
    expect(page.locator('.saved-view')).to_have_count(1)
    page.locator('#daily-metric').select_option('gini')
    expect(page.locator('#daily-year')).to_have_value('2021')
    page.locator('#daily-year').select_option('2023')
    expect(page.locator('#map-subtitle')).to_contain_text('8 / 10')
    page.locator('#daily-year').select_option('2024')
    expect(page.locator('#country-summary .country-value')).to_have_text('—')
    expect(page.locator('#map-legend')).to_contain_text('不填零')
    for metric in ['public_pensions','civil_pensions']:
        page.locator('#daily-metric').select_option(metric)
        expect(page.locator('#country-summary .country-value')).to_have_text('—')
        expect(page.locator('#country-summary')).to_contain_text('不排名')
        assert page.locator('#map-host [data-country][fill="url(#daily-missing)"]').count()==10
    page.locator('#daily-metric').select_option('balance')
    expect(page.locator('#country-summary .country-value')).to_contain_text('-5.8')
    page.locator('#daily-sort').select_option('asc')
    expect(page.locator('#comparison-body tr').first).to_have_attribute('data-country-row','POL')
    form=page.locator('#daily-notes-form')
    form.locator('[name="question"]').fill('<img src=x onerror=alert(1)> 我的研究问题')
    form.locator('[name="facts"]').fill('待回查的来源与年份')
    form.locator('[name="review"]').fill('2026-11-01')
    with page.expect_download() as notes:
        page.locator('#export-notes').click()
    assert '待回查的来源与年份' in Path(notes.value.path()).read_text()
    page.reload()
    expect(form.locator('[name="question"]')).to_have_value('<img src=x onerror=alert(1)> 我的研究问题')
    expect(page.locator('#daily-notes-form img')).to_have_count(0)
    page.locator('[data-open-view]').click()
    expect(page.locator('#daily-metric')).to_have_value('education')
    expect(page.locator('#daily-year')).to_have_value('2022')
    page.locator('[data-remove-view]').click();expect(page.locator('.saved-view')).to_have_count(0)
    # Inspect actual cutoffs and no forecast values in the shipped snapshot.
    assert page.evaluate("DailyResearchData.metrics.filter(m=>m.source==='imf').every(m=>Object.entries(m.values).every(([year,rows])=>Object.values(rows).every(r=>Number(year)<=r.lastActual)))")
    for width in [768,390,320]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
        if width<=390:
            page.locator('.page-outline-trigger').click()
            expect(page.locator('#pageOutline')).to_contain_text('欧洲指标地图')
            page.keyboard.press('Escape')
    page.goto(BASE+'daily.html?metric=education&country=DEU')
    expect(page.locator('#daily-year')).to_have_value('2022')
    expect(page.locator('#daily-country')).to_have_value('DEU')
    page.goto(BASE+'daily.html?metric=bad&year=2030&country=bad')
    expect(page.locator('#daily-metric')).to_have_value('debt')
    expect(page.locator('#daily-country')).to_have_value('FRA')
    for filename in ['index.html','atlas.html','data.html','studio.html','intelli.html','daily.html']:
        page.goto(BASE+filename)
        expect(page.locator('.site-nav a[href="daily.html"]')).to_have_count(1)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),filename
    assert not errors,errors
    context=browser.new_context()
    context.add_init_script("Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')}")
    q=context.new_page();q.goto(BASE+'daily.html')
    q.locator('#daily-notes-form [name="facts"]').fill('无法存储时保留内存')
    expect(q.locator('#notes-status')).to_contain_text('无法保存')
    q.locator('#save-view').click();expect(q.locator('.saved-view')).to_have_count(1)
    print('PASS: country joins and keyboard map, same-year indicators, missing-vs-zero, no forecasts, source codes, CSV/SVG exports, saved views, notes, URL validation, mobile outline/layout, six-page navigation and blocked storage; no runtime errors')
    browser.close()
