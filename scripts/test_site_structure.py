"""Check the two research sections and the industry readers' preserved monitors."""
import csv
import io
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import parse_qs, urljoin, urlsplit
from urllib.request import urlopen

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/").rstrip("/") + "/"
SECTORS = json.loads((ROOT / "assets/sw-atlas.json").read_text())["sectors"]
MONITORS = {"801030": "chemical", "801110": "appliances", "801730": "electrical"}
TOOLS = ["intelli.html", "indicators.html", "data.html", "studio.html"]
FRAME = "#sw-detail #sw-monitor iframe[data-monitor-frame]"


def new_context(browser):
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, accept_downloads=True, reduced_motion="reduce")
    # Public checks use the session's urllib proxy and CA, like the GPU checks.
    if BASE.startswith("https:"):
        def relay(route):
            with urlopen(route.request.url, timeout=40) as response:
                route.fulfill(status=response.status, body=response.read(), headers={"content-type": response.headers.get("content-type", "text/plain")})
        context.route(BASE + "**", relay)
    return context


def check_nav(page, current, selector=".site-nav"):
    nav = page.locator(selector)
    expect(nav).to_have_count(1)
    expect(nav.locator("a")).to_have_text(["行业研究", "日常研究"])
    links = nav.locator("a").evaluate_all("links => links.map(a => a.href)")
    assert links == [urljoin(BASE, "atlas.html"), urljoin(BASE, "daily.html")], (page.url, links)
    expect(nav.locator("a[aria-current='page']")).to_have_count(1)
    assert urljoin(page.url, nav.locator("a[aria-current='page']").get_attribute("href")) == urljoin(BASE, current), page.url


def check_layout(page, label):
    # Chart canvases resize on the next animation frame after viewport changes.
    try:
        page.wait_for_function("document.documentElement.scrollWidth <= innerWidth + 1")
    except PlaywrightTimeoutError:
        raise AssertionError(("horizontal page overflow", label, page.evaluate("({width:innerWidth, scroll:document.documentElement.scrollWidth})"))) from None


def check_monitor_source(page, selector, key):
    element = page.locator(selector)
    expect(element).to_have_count(1)
    expect(element).to_have_attribute("src", re.compile(r"industry-dashboard\.html\?"))
    source = urlsplit(urljoin(page.url, element.get_attribute("src")))
    assert source.path == urlsplit(urljoin(BASE, "industry-dashboard.html")).path, source.geturl()
    assert parse_qs(source.query) == {"industry": [key], "embed": ["1"]}, source.geturl()


def check_frame_height(page, selector):
    # The embedded document must fit in its outer frame after data and charts render.
    try:
        page.wait_for_function("""selector => {
            const frame = document.querySelector(selector), doc = frame?.contentDocument;
            if (!doc?.body || doc.readyState !== 'complete') return false;
            const height = frame.getBoundingClientRect().height;
            return height > 300 && height >= Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) - 2;
        }""", arg=selector)
    except PlaywrightTimeoutError:
        sizes = page.locator(selector).evaluate("frame => ({height:frame.getBoundingClientRect().height, body:frame.contentDocument?.body?.scrollHeight, document:frame.contentDocument?.documentElement?.scrollHeight})")
        raise AssertionError(("embedded monitor does not fit", page.url, page.viewport_size, sizes)) from None
    assert page.locator(selector).evaluate("frame => frame.contentDocument.documentElement.scrollWidth <= frame.contentWindow.innerWidth + 1"), (page.url, selector)


def check_monitor(page, code, key):
    page.goto(BASE + "atlas.html?sw=" + code)
    details = page.locator("#sw-detail #sw-monitor")
    expect(page.locator("#sw-detail h1")).to_be_visible()
    expect(details).to_have_count(1)
    expect(details).not_to_have_attribute("open", "")
    details.locator("summary").click()
    expect(details).to_have_attribute("open", "")
    check_monitor_source(page, FRAME, key)
    page.locator(FRAME).scroll_into_view_if_needed()
    frame = page.frame_locator(FRAME)
    if key == "chemical":
        expect(frame.locator("#trend svg")).to_be_visible()
        frame.locator("#period").select_option("3")
        expect(frame.locator("#table th")).to_have_count(4)
        with page.expect_download() as exported:
            frame.locator("#export").click()
        assert exported.value.suggested_filename == "chemical-data.csv"
        rows = list(csv.DictReader(io.StringIO(Path(exported.value.path()).read_text(encoding="utf-8-sig"))))
        assert rows and set(rows[0]) == {"date", "product", "price", "output", "rate"}
        assert {row["product"] for row in rows} == {"甲醇", "尿素", "纯碱", "聚乙烯", "聚丙烯"}
        assert all(re.fullmatch(r"\d{4}-\d{2}", row["date"]) and float(row["price"]) > 0 for row in rows)
    else:
        expect(frame.locator("#ir-watch tbody tr")).to_have_count(12)
        check_frame_height(page, FRAME)
        before = page.locator(FRAME).evaluate("frame => frame.getBoundingClientRect().height")
        frame.locator("#ir-demo-toggle").click()
        expect(frame.locator("#ir-demo-chart svg")).to_be_visible()
        page.wait_for_function("arg => document.querySelector(arg.selector).getBoundingClientRect().height > arg.before + 100", arg={"selector": FRAME, "before": before})
        frame.locator("#ir-calc-form").get_by_role("button", name="计算教学情景").click()
        expect(frame.locator("#ir-calc-result")).to_contain_text("15.50%" if key == "appliances" else "1866.67")
        if key == "electrical":
            expect(frame.locator("#ir-history-data tbody tr")).to_have_count(10)
            expect(frame.locator("#ir-history-data")).to_contain_text("18.20%")
            expect(frame.locator("#ir-history-data")).to_contain_text("1836.08")
            expect(frame.locator("#ir-calc-result")).to_contain_text("2.00 小时")
        check_frame_height(page, FRAME)
        expanded = page.locator(FRAME).evaluate("frame => frame.getBoundingClientRect().height")
        frame.locator("#ir-demo-toggle").click()
        expect(frame.locator("#ir-demo-chart svg")).not_to_be_visible()
        page.wait_for_function("arg => document.querySelector(arg.selector).getBoundingClientRect().height < arg.expanded - 100", arg={"selector": FRAME, "expanded": expanded})
    check_frame_height(page, FRAME)
    for width in (390, 320):
        page.set_viewport_size({"width": width, "height": 844})
        check_layout(page, (key, width))
        check_frame_height(page, FRAME)
    page.set_viewport_size({"width": 1440, "height": 1000})
    # A copied monitor link opens the disclosure and reloads the same industry.
    page.goto(BASE + "atlas.html?sw=" + code + "#sw-monitor")
    expect(page.locator("#sw-detail #sw-monitor")).to_have_attribute("open", "")
    expect(page.frame_locator(FRAME).locator("#trend svg" if key == "chemical" else "#ir-watch")).to_be_visible()
    check_monitor_source(page, FRAME, key)
    check_frame_height(page, FRAME)


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=os.environ.get("ATLAS_BROWSER"), channel=None if os.environ.get("ATLAS_BROWSER") else "chrome", args=["--no-sandbox"])
        context = new_context(browser)
        page = context.new_page()
        page.set_default_timeout(15000)
        errors, failed = [], []
        page.on("pageerror", lambda error: errors.append(str(error)))
        # The indicator tool intentionally probes /health and uses its public
        # demo when the optional local service is absent from a static server.
        page.on("response", lambda response: failed.append((response.status, response.url)) if response.status >= 400 and response.url.startswith(BASE) and urlsplit(response.url).path != "/health" else None)

        page.goto(BASE + "index.html")
        expect(page).to_have_url(BASE + "atlas.html")
        expect(page.locator("#sw-directory")).to_be_visible()
        expect(page.locator(".sw-sector-link")).to_have_count(31)

        # Check every reader; the other 28 industries have no invented monitor.
        for sector in SECTORS:
            code = sector["code"]
            page.locator('.sw-sector-link[data-sw-code="' + code + '"]').click()
            expect(page.locator("#sw-detail h1")).to_have_text(sector["name"])
            expect(page.locator("#sw-detail #sw-monitor")).to_have_count(1 if code in MONITORS else 0)
            expect(page.locator("#sw-detail [data-monitor-frame]")).to_have_count(1 if code in MONITORS else 0)
            page.locator("#sw-detail .sw-back[data-sw-home]").click()
            expect(page.locator("#sw-directory")).to_be_visible()

        for code, key in MONITORS.items():
            check_monitor(page, code, key)
            page.goto(BASE + "atlas.html?industry=" + key)
            host = "#chemicalContent" if key == "chemical" else "#industryHub"
            details = page.locator(host + " #ir-monitor")
            expect(details).not_to_have_attribute("open", "")
            details.locator("summary").click()
            selector = host + " #ir-monitor iframe[data-monitor-frame]"
            check_monitor_source(page, selector, key)
            expect(page.frame_locator(selector).locator("#trend svg" if key == "chemical" else "#ir-watch")).to_be_visible()
            check_frame_height(page, selector)

        # Browser back/forward returns to the right reader and monitor source.
        page.goto(BASE + "atlas.html")
        page.locator('.sw-sector-link[data-sw-code="801030"]').click()
        expect(page.locator("#sw-detail h1")).to_have_text("基础化工")
        page.go_back()
        expect(page.locator("#sw-directory")).to_be_visible()
        page.go_forward()
        expect(page.locator("#sw-detail h1")).to_have_text("基础化工")
        page.locator("#sw-detail .sw-back[data-sw-home]").click()
        page.locator('.sw-sector-link[data-sw-code="801110"]').click()
        expect(page.locator("#sw-detail h1")).to_have_text("家用电器")
        page.locator("#sw-detail #sw-monitor summary").click()
        check_monitor_source(page, FRAME, "appliances")
        page.go_back()
        expect(page.locator("#sw-directory")).to_be_visible()
        page.go_back()
        expect(page.locator("#sw-detail h1")).to_have_text("基础化工")
        page.locator("#sw-detail #sw-monitor summary").click()
        check_monitor_source(page, FRAME, "chemical")

        for key, code in [(key, code) for code, key in MONITORS.items()] + [("medicine", "801150")]:
            page.goto(BASE + "index.html?industry=" + key)
            expect(page).to_have_url(BASE + "atlas.html?sw=" + code + ("#sw-detail" if key == "medicine" else "#sw-monitor"))
            expect(page.locator("#sw-detail h1")).to_be_visible()
            if key == "medicine":
                expect(page.locator("#sw-detail [data-monitor-frame]")).to_have_count(0)
            else:
                expect(page.locator("#sw-detail #sw-monitor")).to_have_attribute("open", "")
                check_monitor_source(page, FRAME, key)

        # A chart request leaves the merged monitor and opens the full-size tool.
        page.goto(BASE + "atlas.html?sw=801030#sw-monitor")
        prompt = "近6个月甲醇价格折线图"
        frame = page.frame_locator(FRAME)
        frame.locator("#quick-analysis > summary").click()
        frame.locator("#prompt").fill(prompt)
        frame.locator("#ask").evaluate("form => form.requestSubmit()")
        expect(page).to_have_url(re.compile(r"/studio\.html\?prompt="))
        assert parse_qs(urlsplit(page.url).query).get("prompt") == [prompt], page.url
        expect(page.locator("#chart")).to_be_visible()
        check_nav(page, "daily.html")

        roots = ["atlas.html", "appliances.html", "industry-dashboard.html", "daily.html", "washoku.html", "chinese-menu.html", *TOOLS, "indicator-guide.html"]
        for name in roots:
            page.goto(BASE + name)
            check_nav(page, "atlas.html" if name in ["atlas.html", "appliances.html", "industry-dashboard.html"] else "daily.html")
            if name in [*TOOLS, "indicator-guide.html"]:
                assert page.locator(".section-tabs a").evaluate_all("links => links.map(a => a.getAttribute('href'))") == TOOLS, name
            for width in (390, 320):
                page.set_viewport_size({"width": width, "height": 844})
                check_layout(page, (name, width))
            page.set_viewport_size({"width": 1440, "height": 1000})

        page.goto(BASE + "daily.html")
        expect(page.locator('nav[aria-label="日常研究专题"] a[href="intelli.html"]')).to_be_visible()
        expect(page.locator('.daily-tools-links a')).to_have_count(4)
        assert page.locator('.daily-tools-links a').evaluate_all("links => links.map(a => a.getAttribute('href'))") == TOOLS
        page.locator('.daily-tools-links a[href="intelli.html"]').click()
        expect(page.locator("#command")).to_be_visible()
        check_nav(page, "daily.html")

        for path in sorted((ROOT / "gpu-memory").glob("*.html")):
            page.goto(BASE + "gpu-memory/" + path.name)
            check_nav(page, "daily.html", ".gpu-site-nav")
            expect(page.locator(".research-return > a")).to_have_attribute("href", "../daily.html")
            for width in (390, 320):
                page.set_viewport_size({"width": width, "height": 844})
                check_layout(page, (path.name, width))
            page.set_viewport_size({"width": 1440, "height": 1000})

        assert not errors, errors
        assert not failed, failed
        browser.close()
    print("PASS site structure: two sections, 31 readers, three embedded monitors and calculations, CSV export, automatic frame sizing, deep links, redirects, history, full-page chart handoff, tool access, GPU parent navigation and 320/390px layout")


if __name__ == "__main__":
    main()
