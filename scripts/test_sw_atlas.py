"""Exercise the 31-sector catalog, reader, legacy links and mobile navigation."""
import sys
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect
import json
BASE=(sys.argv[1] if len(sys.argv)>1 else "http://127.0.0.1:8000/").rstrip("/")+"/"
data=json.loads(Path("assets/sw-atlas.json").read_text())
with sync_playwright() as p:
    browser=p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    context=browser.new_context(viewport={"width":1440,"height":1000})
    if BASE.startswith("https:"):
        def relay(route):
            with urlopen(route.request.url,timeout=40) as r:
                route.fulfill(status=r.status,body=r.read(),headers={"content-type":r.headers.get("content-type","text/plain")})
        context.route(BASE+"**",relay)
    page=context.new_page();errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.goto(BASE+"atlas.html")
    expect(page.locator(".sw-sector-link")).to_have_count(31)
    expect(page.locator("#sw-count")).to_contain_text("31 / 31")
    expect(page.locator("#chemicalContent")).to_be_hidden()
    page.locator("#sw-query").fill("净息差")
    expect(page.locator('[data-sw-code="801780"]')).to_be_visible()
    page.locator("#sw-query").fill("zzzz不存在")
    expect(page.locator("#sw-no-results")).to_be_visible()
    page.locator("#sw-query").fill("")
    page.locator('[data-sw-group="资源与能源"]').click()
    expect(page.locator(".sw-sector-link")).to_have_count(8)
    page.locator('[data-sw-group=""]').click()
    # Every listed sector must open complete content and have valid internal references.
    for s in data["sectors"]:
        page.locator('[data-sw-code="'+s["code"]+'"]').click()
        expect(page.locator("#sw-detail h1")).to_have_text(s["name"])
        expect(page.locator("#sw-chains article")).to_have_count(len(s["chains"]))
        expect(page.locator("#sw-metrics article")).to_have_count(len(s["metrics"]))
        expect(page.locator("#sw-methods article")).to_have_count(len(s["methods"]))
        expect(page.locator("#sw-themes article")).to_have_count(len(s["themes"]))
        hashes=page.locator("#sw-detail a[href^='#']").evaluate_all("(els)=>els.map(a=>a.hash)")
        assert hashes and all(page.locator(h).count()==1 for h in hashes),s["name"]
        page.locator("#sw-reader-query").fill("zzzz不存在")
        assert page.locator("[data-sw-searchable]:visible").count()==0
        page.locator("#sw-reader-query").fill("")
        assert page.locator("#sw-chains article:visible").count()>=3
        page.locator("#sw-detail [data-sw-home]").first.click()
        expect(page.locator(".sw-sector-link")).to_have_count(31)
    page.goto(BASE+"atlas.html?sw=801780#sw-metrics")
    expect(page.locator("#sw-detail h1")).to_have_text("银行")
    page.reload();expect(page.locator("#sw-metrics")).to_be_visible()
    page.locator("#sw-detail [data-sw-home]").first.click()
    page.go_back();expect(page.locator("#sw-detail h1")).to_have_text("银行")
    page.go_forward();expect(page.locator("#sw-directory")).to_be_visible()
    for width in [390,320]:
        page.set_viewport_size({"width":width,"height":844})
        page.goto(BASE+"atlas.html")
        expect(page.locator("#sw-count")).to_contain_text("31 / 31")
        for s in data["sectors"]:
            page.locator('[data-sw-code="'+s["code"]+'"]').click()
            expect(page.locator("#sw-detail h1")).to_have_text(s["name"])
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+1"),(s["name"],width)
            page.locator("#sw-detail [data-sw-home]").first.click()
        page.goto(BASE+"atlas.html?sw=801150")
        expect(page.locator("#sw-detail h1")).to_have_text("医药生物")
        page.locator(".page-outline-trigger").click()
        expect(page.locator('#pageOutline a[data-target="sw-metrics"]')).to_be_visible()
        page.locator('#pageOutline a[data-target="sw-metrics"]').click()
        expect(page.locator("#pageOutline")).not_to_be_visible()
        expect(page.locator("#sw-metrics")).to_be_focused()
        page.screenshot(path="/tmp/sw31-mobile-"+str(width)+".png")
    page.set_viewport_size({"width":1440,"height":1000})
    page.goto(BASE+"atlas.html?sw=801150")
    expect(page.locator("#sw-detail h1")).to_have_text("医药生物")
    page.get_by_role("link",name="深入医药·创新药").click()
    expect(page.locator("#industryHub h1")).to_contain_text("临床价值")
    expect(page.locator("#sw-detail")).to_be_hidden()
    page.locator("#sw-legacy-bar [data-sw-home]").click()
    expect(page.locator("#sw-directory")).to_be_visible()
    page.goto(BASE+"atlas.html?industry=chemical")
    expect(page.locator("#chemicalContent")).to_be_visible()
    page.locator('[data-industry-choice="appliances"]').click()
    expect(page.locator("#industryHub")).to_be_visible()
    page.locator('[data-industry-choice="electrical"]').click()
    expect(page.locator("#industryHub")).to_be_visible()
    page.goto(BASE+"atlas.html?sw=bad")
    expect(page.locator("#sw-count")).to_contain_text("未找到")
    expect(page.locator(".sw-sector-link")).to_have_count(31)
    # Browsing never depends on personal storage.
    page.add_init_script("Storage.prototype.getItem=Storage.prototype.setItem=function(){throw Error('blocked')}")
    page.goto(BASE+"atlas.html?sw=801780")
    expect(page.locator("#sw-detail h1")).to_have_text("银行")
    assert not errors,errors
    browser.close()
print("PASS SW31 browser: all 31 readers, topical search, category filter, source anchors, deep links/reload/back/forward, every reader at 320/390px, mobile outline and legacy research preserved")
