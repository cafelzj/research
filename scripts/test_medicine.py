"""Check the atlas-only medicine flow, including navigation and source integrity."""
import sys
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/").rstrip("/") + "/"
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    # Use the configured system proxy/CA for public pages as in the chemical checks.
    if BASE.startswith("https:"):
        def relay(route):
            with urlopen(route.request.url, timeout=40) as response:
                route.fulfill(status=response.status, body=response.read(), headers={"content-type": response.headers.get("content-type", "text/plain")})
        context.route(BASE + "**", relay)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE + "atlas.html")
    page.get_by_role("button", name="医药·创新药", exact=True).click()
    expect(page.locator("body")).to_have_attribute("data-industry", "medicine")
    expect(page.locator('[data-industry-choice="medicine"]')).to_have_attribute("aria-pressed", "true")
    expect(page.locator("#chemicalContent")).to_be_hidden()
    expect(page.locator("#industryHub h1")).to_contain_text("临床价值")
    for section, count in [("chains", 6), ("methods", 5), ("metrics", 8), ("history", 3), ("technology", 6), ("glossary", 18), ("learning", 4)]:
        expect(page.locator(f"#ir-{section} .ir-card")).to_have_count(count)
    expect(page.locator("#industryHub")).to_contain_text("2026-10-26")
    expect(page.locator("#industryHub")).to_contain_text("上市后监测")
    expect(page.locator("#ir-glossary")).to_contain_text("IND许可不是上市批准")
    expect(page.locator("#ir-source-owid")).to_have_count(0)
    # Every source and chapter link resolves to rendered content.
    targets = page.locator("#industryHub a[href^='#']").evaluate_all("els => els.map(a => a.hash)")
    assert targets and all(page.locator(target).count() == 1 for target in targets)
    for term in ["ADC", "现金跑道", "OS", "医保"]:
        page.locator("#ir-search").fill(term)
        assert page.locator("[data-ir-searchable]:visible").count() > 0, term
    page.locator("#ir-search").fill("没有这个术语zzzz")
    expect(page.locator("#ir-search-count")).to_contain_text("匹配 0")
    assert page.locator("[data-ir-searchable]:visible").count() == 0
    page.locator("#ir-search").fill("")
    expect(page.locator("#ir-chains .ir-card:visible")).to_have_count(6)
    # Atlas-only content never links to a non-existent medicine dashboard.
    expect(page.locator(".site-nav a[href^='index.html']")).to_have_attribute("href", "index.html")
    page.get_by_role("link", name="查看创新药研究指标").click()
    assert page.url.endswith("#ir-metrics")
    page.reload()
    expect(page.locator("body")).to_have_attribute("data-industry", "medicine")
    expect(page.locator("#ir-metrics")).to_be_visible()
    for key in ["appliances", "electrical", "chemical"]:
        page.locator(f'[data-industry-choice="{key}"]').click()
        expect(page.locator("body")).to_have_attribute("data-industry", key)
    page.go_back()
    expect(page.locator("body")).to_have_attribute("data-industry", "electrical")
    page.goto(BASE + "atlas.html?industry=medicine#ir-glossary")
    expect(page.locator("#ir-glossary .ir-card")).to_have_count(18)
    for width in [390, 320]:
        page.set_viewport_size({"width": width, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
        page.locator(".page-outline-trigger").click()
        expect(page.locator("#pageOutline .page-outline-list a")).to_have_count(8)
        expect(page.locator("#pageOutline")).not_to_contain_text("化工")
        page.locator('#pageOutline a[data-target="ir-metrics"]').click()
        expect(page.locator("#pageOutline")).not_to_be_visible()
        expect(page.locator("#ir-metrics")).to_be_focused()
    page.locator('[data-industry-choice="medicine"]').scroll_into_view_if_needed()
    page.screenshot(path="/tmp/medicine-atlas-mobile.png")
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.screenshot(path="/tmp/medicine-atlas-desktop.png")
    page.goto(BASE + "index.html?industry=medicine")
    expect(page.locator("body")).to_have_attribute("data-industry", "chemical")
    # The new content is also readable when browser storage is blocked.
    page.add_init_script("Storage.prototype.getItem=Storage.prototype.setItem=function(){throw Error('blocked')}")
    page.goto(BASE + "atlas.html?industry=medicine")
    expect(page.locator("#ir-chains .ir-card")).to_have_count(6)
    expect(page.locator("#industryHub textarea,#industryHub form")).to_have_count(0)
    assert not errors, errors
    browser.close()
print("PASS medicine: full atlas, source links, search, deep links/reload, industry/back navigation, mobile outline/layout, no invalid dashboard links or storage dependency")
