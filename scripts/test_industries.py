import sys
"""Run against the repository server on port 8000; requires Playwright + Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = (sys.argv[1] if len(sys.argv)>1 else "http://127.0.0.1:8000/").rstrip("/")+"/"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE + "atlas.html")
    expect(page.locator("#chemicalContent")).to_be_visible()
    expect(page.locator("#workflow,#model")).to_have_count(0)
    expect(page.locator("#sectorCards .atlas-sector-row")).to_have_count(14)
    for key, name, routes in [("appliances", "家电", 5), ("electrical", "电新", 6)]:
        page.locator(f'[data-industry-choice="{key}"]').click()
        expect(page.locator("#chemicalContent")).to_be_hidden()
        expect(page.locator("#industryHub")).to_be_visible()
        expect(page.locator("#ir-chains .ir-card")).to_have_count(routes)
        expect(page.locator("#ir-metrics .ir-card")).to_have_count(12)
        expect(page.locator("#ir-methods .ir-card")).to_have_count(5)
        expect(page.locator("#ir-history .ir-card")).to_have_count(4)
        assert page.locator("#ir-glossary .ir-card").count() >= 16
        expect(page.locator("#industryHub")).to_contain_text("待联网核验")
        page.locator("#ir-search").fill("不存在的术语zzz")
        expect(page.locator("#ir-search-count")).to_contain_text("匹配 0")
        assert page.locator("[data-ir-searchable]:visible").count() == 0
        page.locator("#ir-search").fill("库存" if key == "appliances" else "LCOE")
        assert page.locator("[data-ir-searchable]:visible").count() > 0
        page.locator("#ir-search").fill("")
        expect(page.locator("#ir-notes-input,#ir-evidence-form,[data-ir-check]")).to_have_count(0)
        page.screenshot(path=f"/tmp/{key}-atlas.png", full_page=True)
        page.goto(BASE + "index.html?industry=" + key)
        expect(page.locator("#ir-notes-input,#ir-evidence-form,#ir-records")).to_have_count(0)
        expect(page.locator("#ir-watch tbody tr")).to_have_count(12)
        expect(page.locator("#ir-watch")).to_contain_text("暂无已核验数据")
        page.locator("#ir-demo-toggle").click()
        expect(page.locator("#ir-demo-chart svg")).to_be_visible()
        expect(page.locator("#ir-demo-chart")).to_contain_text("纯教学")
        page.locator("#ir-calc-form").get_by_role("button", name="计算教学情景").click()
        expect(page.locator("#ir-calc-result")).to_contain_text("15.50%" if key == "appliances" else "1866.67")
        if key == "electrical":
            expect(page.locator("#ir-history-data tbody tr")).to_have_count(10)
            expect(page.locator("#ir-history-data")).to_contain_text("18.20%")
            expect(page.locator("#ir-history-data")).to_contain_text("1836.08")
            expect(page.locator("#ir-calc-result")).to_contain_text("2.00 小时")
        page.set_viewport_size({"width": 390, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.screenshot(path=f"/tmp/{key}-dashboard-mobile.png", full_page=True)
        page.goto(BASE + "atlas.html?industry=" + key)
        expect(page.locator("#ir-notes-input,#ir-evidence-form,[data-ir-check]")).to_have_count(0)
        page.locator(".page-outline-trigger").click()
        expect(page.locator("#pageOutline")).to_contain_text("产业链与利润分布")
        expect(page.locator("#pageOutline")).not_to_contain_text("价差推演")
        page.keyboard.press("Escape")
        for width in [390, 320]:
            page.set_viewport_size({"width": width, "height": 844})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (key, width)
        page.set_viewport_size({"width": 1440, "height": 1000})
        page.locator('[data-industry-choice="chemical"]').click()
        expect(page.locator("#chemicalContent")).to_be_visible()
        expect(page.locator("#industryHub")).to_be_hidden()
        page.go_back()
        expect(page.locator("#industryHub")).to_be_visible()
    # Existing chemical dashboard and glossary remain interactive.
    page.goto(BASE + "index.html?industry=chemical")
    expect(page.locator("#trend svg")).to_be_visible()
    page.locator("#period").select_option("3")
    expect(page.locator("#table th")).to_have_count(4)
    page.goto(BASE + "atlas.html?industry=chemical")
    page.locator("#glossaryQuery").fill("PX")
    assert 0 < page.locator(".glossary-card:visible").count() < 45
    assert not errors, errors
    # Reading research content has no dependency on private browser storage.
    context = browser.new_context()
    context.add_init_script("Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')}")
    q = context.new_page()
    q.goto(BASE + "atlas.html?industry=appliances")
    expect(q.locator("#ir-chains .ir-card")).to_have_count(5)
    q.locator('[data-industry-choice="electrical"]').click()
    expect(q.locator("#ir-chains .ir-card")).to_have_count(6)
    expect(q.locator("textarea,#ir-evidence-form,[data-ir-check]")).to_have_count(0)
    print("PASS both industries: chains, metrics, research/technical/glossary content, search, read-only research paths with no note/observation forms, teaching calculations, mobile outline/layout, history navigation, legacy chemistry without storage dependence")
    browser.close()
