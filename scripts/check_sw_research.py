"""Validate research links and independently recompute arithmetic examples.

This checks internal consistency, not the truth of a market thesis. Cases and
source excerpts require editorial review against the original documents.
"""
import ast
import json
import math
import operator
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv}

def calculate(expression):
    tree = ast.parse(expression, mode="eval")
    assert len(list(ast.walk(tree))) <= 200, "oversized expression"
    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return float(node.value)
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            return visit(node.operand) * (-1 if isinstance(node.op, ast.USub) else 1)
        if isinstance(node, ast.BinOp) and type(node.op) in OPS:
            return OPS[type(node.op)](visit(node.left), visit(node.right))
        raise AssertionError("only numeric arithmetic is allowed")
    result = visit(tree)
    assert math.isfinite(result), expression
    return result

def check(data):
    checks = facts = chapters = 0
    assert len({s["code"] for s in data["sectors"]}) == len(data["sectors"]), "duplicate industries"
    for sector in data["sectors"]:
        label = sector["name"]
        research = sector["research"]
        assert research["title"] and research["standfirst"], label
        assert len(research["chapters"]) >= 4, label
        source_ids = {x["id"] for x in research["sources"]}
        assert len(source_ids) == len(research["sources"]), label
        assert not source_ids.intersection(x["id"] for x in sector["sources"]), label
        for source in research["sources"]:
            assert source["status"] == "已读取正文", (label, source["id"])
            assert source["scope"] and source["published"], (label, source["id"])
            assert re.match(r"^https?://", source["url"]), (label, source["id"])
            assert re.fullmatch(r"[A-Za-z0-9_-]+", source["id"])
        chapter_ids = set()
        for chapter in research["chapters"]:
            chapters += 1
            assert re.fullmatch(r"[A-Za-z0-9_-]+", chapter["id"]), label
            assert chapter["id"] not in chapter_ids, (label, chapter["id"])
            chapter_ids.add(chapter["id"])
            assert chapter["title"] and len(chapter["paragraphs"]) >= 3, (label, chapter["id"])
            assert all(isinstance(p, str) and p.strip() for p in chapter["paragraphs"])
            assert set(chapter.get("sourceIds", [])).issubset(source_ids), label
            if "table" in chapter:
                table = chapter["table"]
                assert table["columns"] and table["rows"], label
                assert all(len(row) == len(table["columns"]) for row in table["rows"]), (label, chapter["id"])
        model = research["model"]
        assert model["kind"] == "教学假设", label
        assert model["inputs"] and model["equations"] and model["conclusion"] and model["caveats"], label
        assert len(model["calculationChecks"]) >= 2, label
        for line in model["calculationChecks"]:
            actual = calculate(line["expression"])
            expected = float(line["expected"])
            tolerance = float(line.get("tolerance", 0.005))
            assert math.isclose(actual, expected, rel_tol=1e-7, abs_tol=tolerance), (label, line["expression"], actual, expected)
            assert line["unit"], label
            checks += 1
        case = research["caseStudy"]
        assert case["title"] and case["period"] and len(case["observations"]) >= 2, label
        assert case["reasoning"] and case["alternatives"] and case["limits"], label
        for observation in case["observations"]:
            assert observation["sourceId"] in source_ids, label
            assert observation["locator"].strip() and re.search(r"[0-9]", observation["fact"]), (label, observation)
            facts += 1
        if case.get("table"):
            assert case["table"]["columns"] and case["table"]["rows"], label
            assert all(len(row) == len(case["table"]["columns"]) for row in case["table"]["rows"]), label
        for line in case.get("calculationChecks", []):
            assert math.isclose(calculate(line["expression"]), float(line["expected"]), rel_tol=1e-7, abs_tol=float(line.get("tolerance", 0.005))), (label, line)
            checks += 1
        assert len(research["researchPath"]) >= 3, label
        for step in research["researchPath"]:
            assert all(step[k] for k in ("step", "ask", "materials", "judgment")), label
    return chapters, facts, checks

if __name__ == "__main__":
    data = json.loads((ROOT / "assets/sw-atlas.json").read_text())
    chapters, facts, checks = check(data)
    print(f"PASS research consistency: {len(data['sectors'])} industries, {chapters} chapters, {facts} located case observations, {checks} independently recomputed arithmetic checks; source links, tables and example/real-data separation")
