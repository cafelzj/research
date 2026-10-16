"""Build the static, searchable beginner glossary in atlas.html."""

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START = "<!-- BEGIN CHEMICAL GLOSSARY -->"
END = "<!-- END CHEMICAL GLOSSARY -->"


def build():
    terms = json.loads((ROOT / "assets/glossary.json").read_text())
    assert len({term["id"] for term in terms}) == len(terms)
    categories = list(dict.fromkeys(term["category"] for term in terms))
    esc = html.escape
    controls = '<option value="">全部分类</option>' + "".join(
        f'<option>{esc(category)}</option>' for category in categories
    )
    cards = []
    for term in terms:
        english = term.get("english", "")
        cards.append(
            f'<article class="glossary-card" id="term-{esc(term["id"])}" data-category="{esc(term["category"])}">'
            f'<span class="tag">{esc(term["category"])}</span><h3>{esc(term["short"])} · {esc(term["term"])}</h3>'
            + (f'<p class="glossary-english">{esc(english)}</p>' if english else "")
            + f'<p>{esc(term["meaning"])}</p><details><summary>看例子与易混点</summary>'
            f'<p><b>举个例子：</b>{esc(term["example"])}</p><p><b>容易混淆：</b>{esc(term["note"])}</p>'
            f'<a href="#map" data-chain-target="{term["chain"]}">回到相关产业链 ↗</a></details></article>'
        )
    section = (
        f'{START}<section id="glossary"><div class="heading"><h2><span class="num">07 /</span>入门术语表</h2>'
        f'<small>{len(terms)}个术语 · 缩写、化学式与研究口径</small></div>'
        '<p class="mini">读不懂缩写时来这里：先看通俗解释，再展开例子和易混点。可搜索英文缩写、中文名称或相关概念。</p>'
        '<div class="glossary-controls"><label for="glossaryQuery">搜索术语<input id="glossaryQuery" type="search" placeholder="例如：PX、烧碱、开工率、价差" aria-controls="glossaryCards"></label>'
        f'<label for="glossaryCategory">分类<select id="glossaryCategory" aria-controls="glossaryCards">{controls}</select></label>'
        '<button id="glossaryClear" type="button">查看全部</button></div>'
        '<div class="glossary-quick" aria-label="常用术语快捷查询">从这些词开始：'
        + "".join(f'<button type="button" data-glossary-query="{esc(query)}">{esc(query)}</button>' for query in ["PX", "PTA", "MTO", "开工率", "价差", "同比"])
        + f'</div><p id="glossaryCount" class="mini" role="status" aria-live="polite">共{len(terms)}个术语</p>'
        '<p id="glossaryEmpty" class="panel" hidden>没有匹配术语，可以换用中文全称或英文缩写，也可以点击“查看全部”。</p>'
        '<div id="glossaryCards" class="glossary-grid">' + "".join(cards)
        + '</div><p class="mini">英文缩写、化学式和统计口径分别解释；同一指标的定义可能随机构和样本变化，使用数据时需核对口径。</p></section>' + END
    )
    target = ROOT / "atlas.html"
    text = target.read_text()
    if START in text:
        before, rest = text.split(START, 1)
        _, after = rest.split(END, 1)
        text = before + section + after
    else:
        text = text.replace('<footer class="footer">', section + '<footer class="footer">', 1)
    target.write_text(text)
    print(f"Built {len(terms)} glossary entries in {len(categories)} categories")


if __name__ == "__main__":
    build()
