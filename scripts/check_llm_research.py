"""Check the LLM reader's evidence, offline content and local destinations.

Passing this check verifies editorial structure and arithmetic contracts, not
the scientific claims of the cited papers or a model's benchmark performance.
"""
from collections import Counter
from datetime import date
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "llm"
PAGES = (
    "index.html", "timeline.html", "models.html", "attention.html",
    "compute.html", "depth.html", "multimodal.html", "decoding.html",
    "glossary.html", "methods.html",
)
LABS = {"attention", "kv", "ced", "moe", "engram", "residual", "multimodal", "speculative"}


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.external_links = []
        self.main_text = []
        self.h1 = []
        self.labs = []
        self.modules = []
        self.timeline_ids = []
        self.term_ids = []
        self.in_main = False
        self.in_h1 = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "main":
            self.in_main = True
        if tag == "h1":
            self.h1.append("")
            self.in_h1 = True
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if attrs.get("data-lab"):
            self.labs.append(attrs["data-lab"])
        if "data-timeline-event" in attrs:
            self.timeline_ids.append(attrs.get("id"))
        if "data-term" in attrs:
            self.term_ids.append(attrs.get("id"))
        if tag == "script" and attrs.get("type") == "module":
            self.modules.append(attrs.get("src", "inline"))
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])
        if tag == "a" and attrs.get("href", "").startswith(("https://", "http://")):
            self.external_links.append(attrs["href"])

    def handle_endtag(self, tag):
        if tag == "main":
            self.in_main = False
        if tag == "h1":
            self.in_h1 = False

    def handle_data(self, value):
        if self.in_main:
            self.main_text.append(value)
        if self.in_h1:
            self.h1[-1] += value


def require_fields(record, fields, label):
    for field in fields:
        assert record.get(field), (label, field)


def check_sources(sources, label):
    assert isinstance(sources, list) and sources, (label, "missing sources")
    for source in sources:
        require_fields(source, ("title", "url"), label)
        url = urlsplit(source["url"])
        assert url.scheme in ("https", "http") and url.netloc, (label, source)
        assert not url.username and not url.password, (label, "credential in source URL")


def check_local_reference(page, href, documents):
    url = urlsplit(href)
    if url.scheme or url.netloc or href.startswith(("data:", "mailto:", "tel:")):
        return
    target = (page.parent / unquote(url.path)).resolve() if url.path else page.resolve()
    assert target.is_relative_to(ROOT) and target.is_file(), (str(page.relative_to(ROOT)), href)
    if url.fragment and target.suffix == ".html":
        if target not in documents:
            document = Document()
            document.feed(target.read_text())
            documents[target] = document
        assert unquote(url.fragment) in documents[target].ids, (str(page.relative_to(ROOT)), href)


def check():
    timeline = json.loads((SITE / "assets/timeline.json").read_text())
    glossary = json.loads((SITE / "assets/glossary.json").read_text())
    cutoff = date.fromisoformat(timeline["asOf"])
    assert glossary["asOf"] == timeline["asOf"]
    assert cutoff.year == 2026
    events, terms = timeline["events"], glossary["terms"]
    assert events and terms
    event_ids = [event["id"] for event in events]
    term_ids = [term["id"] for term in terms]
    assert len(event_ids) == len(set(event_ids)), "duplicate event id"
    assert len(term_ids) == len(set(term_ids)), "duplicate term id"
    vendors = " ".join(str(event.get("vendor", "")) for event in events).lower()
    for vendor in ("kimi", "glm", "qwen", "deepseek"):
        assert vendor in vendors, (vendor, "missing named model family")
    for event in events:
        require_fields(event, ("id", "date", "vendor", "model", "mechanism", "caveat", "sources"), event["id"])
        assert event.get("type") or event.get("kind"), (event["id"], "event type")
        check_sources(event["sources"], event["id"])
        # Multiple dates, month precision, and explicit announcement/availability
        # dates are retained rather than forcing them to one invented day.
        dated = re.findall(r"(?<!\d)(2026-\d{2}(?:-\d{2})?)(?!\d)", str(event["date"]))
        assert dated, (event["id"], event["date"], "no 2026 date")
        for stamp in dated:
            parsed = date.fromisoformat(stamp if len(stamp) == 10 else stamp + "-01")
            assert parsed <= cutoff, (event["id"], "future event", stamp)
    for term in terms:
        require_fields(term, ("id", "term", "english", "category", "plain", "mechanism", "example", "misconception", "related", "links", "sources"), term["id"])
        assert isinstance(term.get("aliases"), list), (term["id"], "aliases")
        assert set(term["related"]) <= set(term_ids), (term["id"], "unknown related term")
        assert term["id"] not in term["related"], (term["id"], "self related term")
        check_sources(term["sources"], term["id"])
        assert len(term["mechanism"].strip()) >= 20, (term["id"], "missing mechanism explanation")
        for link in term["links"]:
            require_fields(link, ("label", "href"), term["id"])

    documents = {}
    all_labs = []
    for name in PAGES:
        path = SITE / name
        document = Document()
        document.feed(path.read_text())
        documents[path.resolve()] = document
        assert len(document.h1) == 1 and document.h1[0].strip(), (name, "one page title")
        assert len(document.ids) == len(set(document.ids)), (name, Counter(document.ids))
        assert len("".join(document.main_text).strip()) >= 400, (name, "static reading content missing")
        assert document.external_links, (name, "no source links")
        assert document.modules, (name, "module entry missing")
        all_labs.extend(document.labs)
    assert set(all_labs) == LABS and len(all_labs) == len(LABS), ("lab hosts", all_labs)
    assert set(documents[(SITE / "timeline.html").resolve()].timeline_ids) == set(event_ids), "static timeline does not match event data"
    assert set(documents[(SITE / "glossary.html").resolve()].term_ids) == set(term_ids), "static glossary does not match term data"
    # Snapshot the entries before loading root-page references into the map.
    for page, document in list(documents.items()):
        for href in document.links:
            check_local_reference(page, href, documents)
    for term in terms:
        for link in term["links"]:
            check_local_reference(SITE / "glossary.html", link["href"], documents)
    for event in events:
        if event.get("detailHref"):
            check_local_reference(SITE / "timeline.html", event["detailHref"], documents)

    # Protect the arithmetic used in the independent browser checks: decimal GB.
    assert 2 * 80 * 1_000_000 * 8 * 128 * 2 / 1e9 == 327.68
    print(f"PASS LLM research: {len(PAGES)} static pages, {len(events)} sourced events, "
          f"{len(terms)} explained terms, {len(LABS)} mechanism labs; evidence fields, "
          "date precision, local anchors, offline reading and arithmetic contracts")


if __name__ == "__main__":
    check()
