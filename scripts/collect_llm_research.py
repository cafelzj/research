#!/usr/bin/env python3
"""Build the public model timeline from the maintained llm/content sources.

The selected Markdown is the publication source: normal collection never reads
the private research workspace. Grouped date labels remain intact; the sorting
date is the first stated event, not a later promise, revision, or snapshot date.
"""
from __future__ import annotations

import argparse
import csv
from datetime import date
import hashlib
import io
import json
from pathlib import Path
import re
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "llm" / "content"
ASSETS = ROOT / "llm" / "assets"
AS_OF = "2026-11-14"
SCOPE = (
    "2026-01-01至2026-11-14；重点收录Kimi、GLM、Qwen、DeepSeek主要模型与重要变化，"
    "其他中国及海外主要厂商为选编。合并发布表格与已核正文节点，同一型号同一事件不重复收录；"
    "分组条目保留公告、API、权重记录、论文、预览、研究介绍及转引资料等原日期性质；"
    "分型以首项主要事件为准，不将后续更新、技术报告或未来计划混作首项事件；"
    "月精度仅写YYYY-MM，月内排序位置不表示具体日的先后；"
    "排序日期不代表所有渠道同时开放，也不将初始权重提交视为首次公众下载时刻。"
)
SOURCES = ("kimi", "glm", "qwen", "deepseek", "other-china", "global", "timeline-supplement")
VENDORS = {
    "Kimi": "kimi", "GLM": "glm", "Qwen": "qwen", "DeepSeek": "deepseek",
    "MiniMax": "minimax", "Seed": "seed", "Step": "step", "ERNIE": "ernie",
    "Hy": "hy", "MiMo": "mimo", "讯飞": "iflytek", "OpenAI": "openai",
    "Claude": "claude", "Gemini": "gemini", "Mistral": "mistral", "Grok": "grok",
    "Meta": "meta", "inclusionAI": "inclusionai", "海外其他": "global-other",
}
TYPES = {"模型发布", "模型预览", "模型更新", "专项模型", "论文研究", "接口服务", "部署修正", "资料披露", "研究披露"}
DATE = re.compile(r"(?<!\d)(?:(20\d{2})-)?(\d{2})-(\d{2})(?!\d)")
MONTH = re.compile(r"^(20\d{2})-(\d{2})(?!-\d{2})")
LINK = re.compile(r"\[([^\]]+)\]\((https?://[^\s)]+)\)")

# Kimi's main table keeps a separate reference directory. Give each event its
# direct supporting source(s), instead of using a generic research landing page.
KIMI_SOURCES = {
    "Kimi K2.5": [
        ("K2.5 技术公告", "https://www.kimi.com/en/blog/kimi-k2-5"),
        ("K2.5 模型卡", "https://huggingface.co/moonshotai/Kimi-K2.5"),
    ],
    "K2.5 提示词 / chat template 修复": [
        ("K2.5 模型卡更新记录", "https://huggingface.co/moonshotai/Kimi-K2.5"),
    ],
    "K2.5 报告 / Agent Swarm": [
        ("K2.5 论文与提交历史", "https://arxiv.org/abs/2602.02276"),
        ("Agent Swarm 系统说明", "https://www.kimi.com/en/blog/agent-swarm"),
    ],
    "Kimi K2.6": [
        ("K2.6 技术公告", "https://www.kimi.com/en/blog/kimi-k2-6"),
        ("K2.6 模型卡", "https://huggingface.co/moonshotai/Kimi-K2.6"),
    ],
    "Kimi K2.7 Code": [
        ("Kimi Code 官方发布记录", "https://www.kimi.com/code/docs/en/kimi-code/whats-new.html"),
        ("K2.7 Code 模型卡", "https://huggingface.co/moonshotai/Kimi-K2.7-Code"),
    ],
    "Kimi K3": [
        ("K3 技术公告", "https://www.kimi.com/en/blog/kimi-k3"),
        ("K3 模型卡", "https://huggingface.co/moonshotai/Kimi-K3"),
        ("K3 权重提交记录", "https://huggingface.co/moonshotai/Kimi-K3/commits/main"),
    ],
    "K2.8 Preview": [
        ("Kimi Code 官方发布记录", "https://www.kimi.com/code/docs/en/kimi-code/whats-new.html"),
    ],
    "Kimi K3.1 Pro / Highspeed": [
        ("K3.1 Pro 技术公告", "https://www.kimi.com/en/blog/kimi-k3-1-pro"),
        ("Kimi Code 渠道发布记录", "https://www.kimi.com/code/docs/en/kimi-code/whats-new.html"),
        ("K3.1 Pro 权重提交记录", "https://huggingface.co/moonshotai/Kimi-K3.1-Pro/commits/main"),
    ],
}


def cells_in(line: str) -> list[str]:
    """Split a Markdown table without splitting escaped pipes or inline code."""
    cells, cell, code, escaped = [], "", False, False
    for char in line.strip().strip("|"):
        if char == "`" and not escaped:
            code = not code
        if char == "|" and not code and not escaped:
            cells.append(cell.strip())
            cell = ""
        else:
            cell += char
        escaped = char == "\\" and not escaped
    return cells + [cell.strip()]


def plain(value: str) -> str:
    return LINK.sub(lambda match: match[1], value).replace("`", "").replace("**", "")


def sources_in(values: list[str]) -> list[dict[str, str]]:
    sources, seen = [], set()
    for value in values:
        for title, url in LINK.findall(value):
            if url not in seen:
                sources.append({"title": title, "url": url})
                seen.add(url)
    return sources


def boundary_from(mechanism: str, candidate: str) -> str:
    """A source-only table cell is evidence, not a substantive limitation."""
    remainder = LINK.sub("", candidate)
    remainder = re.sub(r"(?:主要|关键|直接|官方)?(?:来源|证据)[：:]?", "", remainder)
    if remainder.strip(" \t\r\n、，,；;。.：:|·"):
        return candidate
    sentences = re.split(r"(?<=[。；！？])", mechanism)
    boundaries = [part.strip() for part in sentences if re.search(r"不能|不等于|限定|不可|未|需|须|不应|不代表|不自动|而非|局限", part)]
    return "".join(boundaries) or "本条依据官方发布材料；能力与成本未在本轮按同配置独立复现。"


def first_date(label: str) -> str | None:
    # Historical first publications remain in the prose, without creating a
    # misleading 2026 publication from a later revision within the same row.
    if label.startswith("2025"):
        return None
    month = MONTH.match(label)
    if month:
        year, month_number = (int(value) for value in month.groups())
        date(year, month_number, 1)  # Validate the month without publishing a fake day.
        return f"{year:04d}-{month_number:02d}"
    match = DATE.search(label)
    if not match:
        return None
    year, month, day = match.groups()
    return date(int(year or 2026), int(month), int(day)).isoformat()


def vendor_for(key: str, heading: str, model: str) -> str:
    if key in {"kimi", "glm", "qwen", "deepseek"}:
        return {"kimi": "Kimi", "glm": "GLM", "qwen": "Qwen", "deepseek": "DeepSeek"}[key]
    if key == "other-china":
        for token, vendor in (("MiniMax", "MiniMax"), ("Seed", "Seed"), ("阶跃", "Step"),
                              ("百度", "ERNIE"), ("腾讯", "Hy"), ("小米", "MiMo"), ("讯飞", "讯飞")):
            if token in heading:
                return vendor
        raise ValueError(("Unknown Chinese vendor section", heading, model))
    # The overseas table groups multiple companies in one section. Classify
    # each row by model identity, rather than calling all of it 'overseas'.
    for token, vendor in (("GPT", "OpenAI"), ("Claude", "Claude"), ("Gemini", "Gemini")):
        if token in model:
            return vendor
    return "海外其他"


def type_for(vendor: str, model: str, label: str) -> str:
    # Read the first event's description only. Later dates can describe a
    # technical-page update, paper, API rollout, or planned weights. Treating
    # their keywords as the original event's type would change its meaning.
    dates = list(DATE.finditer(label))
    primary = label
    if len(dates) > 1:
        prefix = label[:dates[1].start()]
        # The next event's noun may precede its date ('；论文提交为01-28').
        # Exclude that whole clause, rather than leaving '论文' behind and
        # accidentally reclassifying the original weights announcement.
        separators = list(re.finditer(r"[；;，,、]", prefix))
        boundary = separators[-1].start() if separators else len(prefix)
        primary = prefix[:boundary] if boundary >= dates[0].end() else prefix
    if "部署修正" in primary:
        return "部署修正"
    if any(token in primary for token in ("论文", "技术报告")):
        return "论文研究"
    if any(token in model for token in ("OCR", "TTS", "ASR", "Embedding", "Reranker", "ForcedAligner", "Seeduplex", "GLM-Image", "Coder-Next", "K2.7 Code", "GLM-5V-Turbo")):
        return "专项模型"
    if model in {"GLM-5.3-FlashX", "GLM-5.3-FlashX-Legal上线AutoClaw", "V2.5-Pro-UltraSpeed"} or "完整App功能API" in model:
        return "接口服务"
    if any(token in model for token in ("Preview", "-Exp")) or re.search(r"预览|Preview|实验API", primary, re.IGNORECASE):
        return "模型预览"
    if "Legal" in model:
        return "专项模型"
    # 'Official update log' describes the evidence carrier for a new MiMo
    # family release, rather than identifying an update to the old endpoint.
    if vendor == "MiMo" and model == "MiMo-V2.6 Pro / Flash":
        return "模型发布"
    # The primary June 10 API event itself introduces a dated snapshot of the
    # existing Max model, although that snapshot's June 8 date appears later.
    if vendor == "Qwen" and model == "Qwen3.7-Max-2026-06-08":
        return "模型更新"
    if any(token in primary for token in ("快照", "更新", "修复", "升级", "小版本")):
        return "模型更新"
    if vendor == "Kimi" and "K3.1" in model:
        return "模型更新"
    return "模型发布"


def collect() -> dict:
    events = []
    identities = set()
    for key in SOURCES:
        heading = ""
        for line in (CONTENT / f"{key}.md").read_text(encoding="utf-8").splitlines():
            if line.startswith("## "):
                heading = line[3:]
            if not line.startswith("|"):
                continue
            cells = cells_in(line)
            if len(cells) < 3:
                continue
            event_date = first_date(cells[0])
            if not event_date:
                continue
            if key == "timeline-supplement":
                if len(cells) != 6:
                    raise ValueError(("Supplement needs six explicit columns", cells))
                date_label, vendor, raw_model, event_type, mechanism, caveat = cells
            else:
                date_label, raw_model, mechanism = cells[:3]
                vendor = vendor_for(key, heading, plain(raw_model))
                event_type = type_for(vendor, plain(raw_model), date_label)
                caveat = "\n\n".join(value for value in cells[3:] if value)
            model = plain(raw_model)
            caveat = boundary_from(mechanism, caveat)
            sources = sources_in(cells[1:])
            if key == "kimi":
                for title, url in KIMI_SOURCES.get(model, []):
                    if not any(source["url"] == url for source in sources):
                        sources.append({"title": title, "url": url})
            # Three-column DeepSeek research rows combine the mechanism and
            # boundary in their last cell; retain it verbatim and flag the type.
            if len(cells) == 3:
                caveat = "本条为论文与基础设施研究，不计作新的通用模型首发；具体限制见机制说明。"
            identity = "\n".join((vendor, date_label, model))
            event_identity = (vendor, event_date, model, event_type)
            if event_identity in identities:
                raise ValueError(("Same model and event appears twice", event_identity))
            identities.add(event_identity)
            suffix = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:10]
            events.append({
                "id": f"event-{VENDORS[vendor]}-{event_date}-{suffix}",
                "date": event_date,
                "datePrecision": "month" if len(event_date) == 7 else "day",
                "dateLabel": date_label,
                "vendor": vendor,
                "model": model,
                "type": event_type,
                "mechanism": mechanism,
                "caveat": caveat,
                "sources": sources,
                "detailHref": f"models.html#vendor-{VENDORS[vendor]}",
            })
    events.sort(key=lambda event: (event["date"], event["vendor"], event["id"]))
    result = {"asOf": AS_OF, "scope": SCOPE, "events": events}
    validate(result)
    return result


def validate(data: dict) -> None:
    ids = set()
    for event in data["events"]:
        if event["id"] in ids:
            raise ValueError(("Duplicate event id", event["id"]))
        ids.add(event["id"])
        if event["datePrecision"] == "month":
            if not re.fullmatch(r"2026-\d{2}", event["date"]):
                raise ValueError(("Invalid month precision", event))
            date.fromisoformat(event["date"] + "-01")
            if not "2026-01" <= event["date"] <= AS_OF[:7]:
                raise ValueError(("Event month outside research interval", event))
        elif event["datePrecision"] == "day":
            if not re.fullmatch(r"2026-\d{2}-\d{2}", event["date"]) or not "2026-01-01" <= date.fromisoformat(event["date"]).isoformat() <= AS_OF:
                raise ValueError(("Event date outside research interval", event))
        else:
            raise ValueError(("Unknown date precision", event))
        if event["vendor"] not in VENDORS or event["type"] not in TYPES:
            raise ValueError(("Unknown event classification", event))
        if not event["sources"]:
            raise ValueError(("Event has no direct source", event["model"]))
        for source in event["sources"]:
            url = urlsplit(source["url"])
            if not source["title"] or url.scheme not in {"http", "https"} or not url.netloc:
                raise ValueError(("Invalid source", source))


def outputs(data: dict) -> dict[str, str]:
    stream = io.StringIO(newline="")
    fields = ["id", "date", "datePrecision", "dateLabel", "vendor", "model", "type", "mechanism", "caveat", "sources", "detailHref"]
    writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    for event in data["events"]:
        writer.writerow({**event, "sources": json.dumps(event["sources"], ensure_ascii=False, separators=(",", ":"))})
    return {
        "timeline.json": json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        "timeline.csv": "\ufeff" + stream.getvalue(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check committed public data matches the maintained Markdown")
    args = parser.parse_args()
    data = collect()
    generated = outputs(data)
    if args.check:
        for name, text in generated.items():
            path = ASSETS / name
            if not path.exists() or path.read_bytes() != text.encode("utf-8"):
                raise SystemExit(f"Stale timeline: {path.relative_to(ROOT)}; run python3 scripts/collect_llm_research.py")
        print(f"PASS public timeline matches content: {len(data['events'])} sourced events")
    else:
        ASSETS.mkdir(parents=True, exist_ok=True)
        for name, text in generated.items():
            (ASSETS / name).write_bytes(text.encode("utf-8"))
        print(f"Built public timeline: {len(data['events'])} sourced events")


if __name__ == "__main__":
    main()
