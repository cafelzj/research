"""Exercise the LLM research reader and its mechanism teaching interactions."""
import json
import math
import os
from pathlib import Path
import re
import sys
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import urlopen

from playwright.sync_api import TimeoutError as BrowserTimeout, expect, sync_playwright

from check_llm_research import LABS, PAGES


ROOT = Path(__file__).resolve().parents[1]
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/").rstrip("/") + "/"
EVENTS = json.loads((ROOT / "llm/assets/timeline.json").read_text())["events"]
TERMS = json.loads((ROOT / "llm/assets/glossary.json").read_text())["terms"]


def context_for(browser, **options):
    context = browser.new_context(**options)
    # Use urllib's configured proxy/CA for public checks, matching GPU tests.
    if BASE.startswith("https:"):
        def relay(route):
            try:
                response = urlopen(route.request.url, timeout=40)
            except HTTPError as error:
                response = error
            with response:
                route.fulfill(status=response.status, body=response.read(),
                              headers={"content-type": response.headers.get("content-type", "text/plain")})
        context.route(BASE + "**", relay)
    return context


def nav_check(page):
    nav = page.locator(".site-nav")
    expect(nav).to_have_count(1)
    expect(nav.locator("a")).to_have_text(["行业研究", "日常研究"])
    hrefs = nav.locator("a").evaluate_all("links => links.map(a => a.href)")
    assert hrefs == [urljoin(BASE, "atlas.html"), urljoin(BASE, "daily.html")], (page.url, hrefs)
    expect(nav.locator("a[aria-current='page']")).to_have_count(1)
    expect(nav.locator("a[aria-current='page']")).to_have_attribute("href", "../daily.html")
    internal = page.locator(".llm-nav")
    expect(internal).to_have_count(1)
    expect(internal.locator("a[aria-current='page']")).to_have_count(1)
    targets = internal.locator("a[href]").evaluate_all("links => links.map(a => new URL(a.href).pathname.split('/').pop())")
    assert set(PAGES) <= set(targets), (page.url, targets)


def no_overflow(page, label):
    try:
        page.wait_for_function("document.documentElement.scrollWidth <= innerWidth + 1", timeout=5000)
    except BrowserTimeout:
        sizes = page.evaluate("({viewport:innerWidth, document:document.documentElement.scrollWidth, body:document.body.scrollWidth})")
        raise AssertionError((label, page.url, sizes)) from None
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), label


def shown(page, selector):
    return page.locator(selector).evaluate_all("nodes => nodes.filter(node => !node.hidden && node.getClientRects().length).length")


def read_number(locator):
    text = locator.inner_text().replace(",", "")
    match = re.search(r"[-+]?\d+(?:\.\d+)?", text)
    assert match, ("numeric output missing", text)
    return float(match[0])


def diagram_snapshot(host):
    return host.evaluate("""host => {
        const canvas = host.querySelector('canvas');
        if (canvas) return canvas.toDataURL();
        const svg = host.querySelector('svg');
        if (svg) return svg.outerHTML;
        const stage = host.querySelector('.lab-stage,[data-lab-stage],.lab-diagram,.lab-visual,.lab-viz');
        if (!stage) throw new Error('Lab has no identifiable visual stage: '+host.dataset.lab);
        return stage.outerHTML;
    }""")


def check_lab(page, host):
    name = host.get_attribute("data-lab")
    if name == "kv":
        return check_kv(page, host)
    expect(host.locator(".lab-readout[aria-live]")).to_have_count(1)
    readout = host.locator(".lab-readout")
    expect(readout).not_to_have_text("")
    for action in ("prev", "next", "play"):
        expect(host.locator(f'button[data-action="{action}"]')).to_have_count(1)
    choices = host.locator("select[data-action]")
    if name != "multimodal":
        expect(choices.first).to_be_visible()
    step = host.get_attribute("data-step")
    assert step is not None, (name, "missing step state")
    initial_text, initial_diagram = readout.inner_text(), diagram_snapshot(host)
    host.locator('button[data-action="next"]').click()
    page.wait_for_function("arg => document.querySelector('[data-lab=\"'+arg.name+'\"]').dataset.step !== arg.before", arg={"name": name, "before": step})
    assert readout.inner_text() != initial_text, (name, "next did not update explanation")
    assert diagram_snapshot(host) != initial_diagram, (name, "next did not change diagram")
    host.locator('button[data-action="prev"]').click()
    expect(host).to_have_attribute("data-step", step)
    def final_state():
        for _ in range(20):
            advance = host.locator('button[data-action="next"]')
            if advance.is_disabled():
                return readout.inner_text(), diagram_snapshot(host)
            advance.click()
        raise AssertionError((name, "unbounded teaching sequence"))
    if choices.count():
        choice = choices.first
        selected = choice.input_value()
        values = choice.locator("option").evaluate_all("nodes => nodes.filter(n => !n.disabled && n.value).map(n => n.value)")
        alternatives = [value for value in values if value != selected]
        assert alternatives, (name, "only one mechanism/case")
        before_final = final_state()
        choice.select_option(alternatives[0])
        # Cases may share the same first frame: compare their eventual result,
        # rather than demanding an invented difference before a branch occurs.
        after_final = final_state()
        assert after_final != before_final, (name, "selection did not affect the teaching result")

    # Explicit play changes the state. Changing the OS motion preference pauses
    # the running sequence, and switching back must not restart it by itself.
    page.emulate_media(reduced_motion="no-preference")
    host.locator('button[data-action="play"]').click()
    play_step = host.get_attribute("data-step")
    page.wait_for_function("arg => document.querySelector('[data-lab=\"'+arg.name+'\"]').dataset.step !== arg.before", arg={"name": name, "before": play_step}, timeout=6000)
    page.emulate_media(reduced_motion="reduce")
    page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
    stopped = host.get_attribute("data-step")
    page.wait_for_timeout(2400)
    expect(host).to_have_attribute("data-step", stopped)
    page.emulate_media(reduced_motion="no-preference")
    page.wait_for_timeout(2400)
    expect(host).to_have_attribute("data-step", stopped)


def check_kv(page, host):
    total = host.locator('output[data-output="kv-total"]')
    expect(total).to_be_visible()
    assert math.isclose(read_number(total), 327.68, abs_tol=0.01), total.inner_text()
    # A concurrency input doubles memory independently of the model's formula.
    inputs = host.locator('input[type="number"],input[type="range"]')
    batch = None
    for index in range(inputs.count()):
        field = inputs.nth(index)
        identity = " ".join(filter(None, [field.get_attribute("name"), field.get_attribute("id"), field.get_attribute("data-input"), field.get_attribute("aria-label")])).lower()
        if re.search(r"batch|sequence|concurr|并发", identity):
            batch = field
            break
    assert batch is not None, "KV needs an identifiable concurrency input"
    original = float(batch.input_value())
    before = read_number(total)
    def set_input(value):
        if batch.get_attribute("type") == "range":
            batch.evaluate("(field, value) => { field.value=value; field.dispatchEvent(new Event('input', {bubbles:true})); field.dispatchEvent(new Event('change', {bubbles:true})); }", str(value))
        else:
            batch.fill(str(value))
            batch.dispatch_event("input")
            batch.dispatch_event("change")
    set_input(int(original * 2) if original.is_integer() else original * 2)
    page.wait_for_function("selector => /655[.,]36/.test(document.querySelector(selector).textContent)", arg='[data-lab="kv"] output[data-output="kv-total"]')
    assert math.isclose(read_number(total), before * 2, abs_tol=0.02), total.inner_text()
    set_input(int(original) if original.is_integer() else original)
    expect(total).to_contain_text("327.68")
    # Independent second scenario exercises every factor, preventing a
    # calculator that merely scales the default constant from passing.
    scenario = {"layers": 2, "tokens": 1_000_000, "kvHeads": 4,
                "headDim": 128, "bytes": 2, "batch": 3}
    for name, value in scenario.items():
        field = host.locator(f'input[name="{name}"]')
        field.fill(str(value))
        field.dispatch_event("input")
    expected_gb = 2 * 2 * 1_000_000 * 4 * 128 * 2 * 3 / 1e9
    assert math.isclose(read_number(total), expected_gb, abs_tol=0.005), total.inner_text()
    host.locator('input[name="batch"]').fill("0")
    host.locator('input[name="batch"]').dispatch_event("input")
    expect(total).to_contain_text("—")
    expect(host.locator('input[name="batch"]')).to_have_attribute("aria-invalid", "true")
    host.locator('button[data-action="reset-kv"]').click()
    expect(total).to_contain_text("327.68")


def filters(page):
    page.goto(BASE + "llm/timeline.html")
    expect(page.locator("[data-timeline-event]")).to_have_count(len(EVENTS))
    query, vendor, kind = (page.locator(selector) for selector in ("#timeline-query", "#timeline-vendor", "#timeline-type"))
    query.fill("zzzz完全不存在的模型")
    expect(page.locator("#timeline-count")).to_contain_text("0")
    assert shown(page, "[data-timeline-event]") == 0
    query.fill("")
    assert shown(page, "[data-timeline-event]") == len(EVENTS)
    choices = vendor.locator("option").evaluate_all("nodes => nodes.filter(n => n.value && n.value !== 'all').map(n => n.value)")
    assert len(choices) >= 4
    selected = next((value for value in choices if "deepseek" in value.lower()), choices[0])
    vendor.select_option(selected)
    count = shown(page, "[data-timeline-event]")
    assert 0 < count < len(EVENTS), (selected, count)
    records = page.locator("[data-timeline-event]").evaluate_all("nodes => nodes.filter(n => !n.hidden && n.getClientRects().length).map(n => n.innerText)")
    assert all(selected.lower() in row.lower() for row in records), (selected, records)
    vendor.select_option(index=0)
    types = kind.locator("option").evaluate_all("nodes => nodes.filter(n => n.value && n.value !== 'all').map(n => n.value)")
    assert len(types) >= 2
    kind.select_option(types[0])
    assert 0 < shown(page, "[data-timeline-event]") < len(EVENTS)
    kind.select_option(index=0)
    first_model = str(EVENTS[0]["model"])
    query.fill(first_model)
    assert 0 < shown(page, "[data-timeline-event]") <= len(EVENTS)
    query.fill("")
    page.goto(BASE + "llm/timeline.html?q=zzzz-unmatched#" + EVENTS[0]["id"])
    expect(page.locator("#timeline-query")).to_have_value("")
    expect(page.locator("[id='" + EVENTS[0]["id"] + "']")).to_be_visible()

    page.goto(BASE + "llm/glossary.html")
    expect(page.locator("[data-term]")).to_have_count(len(TERMS))
    tq, category = page.locator("#term-query"), page.locator("#term-category")
    tq.fill("zzzz完全不存在的术语")
    expect(page.locator("#term-count")).to_contain_text("0")
    assert shown(page, "[data-term]") == 0
    tq.fill("")
    assert shown(page, "[data-term]") == len(TERMS)
    choices = category.locator("option").evaluate_all("nodes => nodes.filter(n => n.value && n.value !== 'all').map(n => n.value)")
    assert len(choices) >= 3
    category.select_option(choices[0])
    assert 0 < shown(page, "[data-term]") < len(TERMS)
    category.select_option(index=0)
    tq.fill("KV")
    assert 0 < shown(page, "[data-term]") < len(TERMS)
    tq.fill("")
    page.goto(BASE + "llm/glossary.html?q=zzzz-unmatched#" + TERMS[0]["id"])
    expect(page.locator("#term-query")).to_have_value("")
    expect(page.locator("[id='" + TERMS[0]["id"] + "']")).to_be_visible()


def main():
    with sync_playwright() as playwright:
        executable = os.environ.get("ATLAS_BROWSER")
        browser = playwright.chromium.launch(executable_path=executable, channel=None if executable else "chrome", args=["--no-sandbox"])
        context = context_for(browser, viewport={"width": 1440, "height": 1000}, reduced_motion="no-preference")
        page = context.new_page()
        errors, failed = [], []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("response", lambda response: failed.append((response.status, response.url)) if response.status >= 400 and response.url.startswith(BASE) else None)
        discovered_labs = set()
        for name in PAGES:
            response = page.goto(BASE + "llm/" + name)
            assert response.status == 200, name
            expect(page.locator("h1")).to_have_count(1)
            expect(page.locator("h1")).to_be_visible()
            nav_check(page)
            hosts = page.locator("[data-lab]")
            if hosts.count():
                for host in hosts.all():
                    key = host.get_attribute("data-lab")
                    if key != "kv":
                        expect(host).to_have_attribute("data-step", re.compile(r".+"))
                before = hosts.evaluate_all("nodes => nodes.map(n => n.dataset.step)")
                page.wait_for_timeout(1400)
                assert hosts.evaluate_all("nodes => nodes.map(n => n.dataset.step)") == before, (name, "lab started without user action")
                for host in hosts.all():
                    discovered_labs.add(host.get_attribute("data-lab"))
                    check_lab(page, host)
            for width in (390, 320):
                page.set_viewport_size({"width": width, "height": 900})
                no_overflow(page, (name, width))
            page.set_viewport_size({"width": 1440, "height": 1000})
        assert discovered_labs == LABS, discovered_labs
        filters(page)
        for origin in ("daily.html", "washoku.html", "chinese-menu.html"):
            page.goto(BASE + origin)
            link = page.locator('nav[aria-label="日常研究专题"] a[href="llm/index.html"]')
            expect(link).to_be_visible()
            link.click()
            expect(page).to_have_url(BASE + "llm/index.html")
            nav_check(page)
        assert not errors, errors
        assert not failed, failed

        # Long-form content and evidence must remain available with scripts off.
        static = context_for(browser, java_script_enabled=False, viewport={"width": 390, "height": 900})
        offline_page = static.new_page()
        for name in PAGES:
            response = offline_page.goto(BASE + "llm/" + name)
            assert response.status == 200, name
            expect(offline_page.locator("h1")).to_have_count(1)
            assert len(offline_page.locator("main").inner_text().strip()) >= 400, name
            assert offline_page.locator('main a[href^="https://"]').count() > 0, (name, "static source links")
            if name == "timeline.html":
                expect(offline_page.locator("[data-timeline-event]")).to_have_count(len(EVENTS))
            if name == "glossary.html":
                expect(offline_page.locator("[data-term]")).to_have_count(len(TERMS))
        browser.close()
    print("PASS LLM browser: ten readers, eight interactive mechanism labs, KV arithmetic, "
          "timeline/term filters, source/static reading, topic and parent navigation, "
          "motion controls and 320/390px layout; no runtime errors or failed resources")


if __name__ == "__main__":
    main()
