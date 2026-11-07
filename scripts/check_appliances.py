"""Check the handbook's evidence graph, calculation models and static links.

These checks protect editorial structure and arithmetic. Original documents and
causal interpretations also require human review; a passing check is no proof
of an investment thesis.
"""
from collections import Counter
from datetime import date
from html.parser import HTMLParser
import json
import math
import re
from pathlib import Path
from urllib.parse import urlsplit

from build_appliances import build
from check_sw_research import calculate

ROOT = Path(__file__).resolve().parents[1]
CUTOFF = date(2026, 11, 7)
SECTIONS = {'map','chains','companies','reports','technology','frontiers','hotspots',
            'metrics','methods','models','training','reference','sources'}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.hashes = []
        self.headings = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'a' and attrs.get('href', '').startswith('#'):
            self.hashes.append(attrs['href'][1:])


def nonempty(record, fields):
    for field in fields.split():
        assert record.get(field), (record.get('id', record.get('title', 'record')), field)


def walk(value, sources):
    if isinstance(value, list):
        for item in value:
            walk(item, sources)
    elif isinstance(value, dict):
        if 'sourceIds' in value:
            assert value['sourceIds'], value.get('id', value.get('title'))
            assert set(value['sourceIds']) <= sources, value.get('id', value.get('title'))
        if 'sourceId' in value:
            assert value['sourceId'] in sources, value['sourceId']
        if 'table' in value:
            table = value['table']
            nonempty(table, 'columns rows')
            assert all(len(row) == len(table['columns']) for row in table['rows']), value.get('title')
        for item in value.values():
            walk(item, sources)


def check(data):
    sources = data['sources']
    source_ids = {s['id'] for s in sources}
    assert len(source_ids) == len(sources), 'duplicate source IDs'
    for source in sources:
        nonempty(source, 'id title url published accessed status scope')
        assert re.fullmatch(r'(?:chain|co|tech|metric)-[a-zA-Z0-9_-]+', source['id']), source['id']
        url = urlsplit(source['url'])
        assert url.scheme in ('http', 'https') and url.netloc, source['id']
        assert date.fromisoformat(source['accessed']) <= CUTOFF, source['id']
        # Some undated source landing pages are explicitly recorded as such.
        if re.fullmatch(r'\d{4}-\d{2}-\d{2}', source['published']):
            assert date.fromisoformat(source['published']) <= CUTOFF, source['id']
    walk(data, source_ids)
    chain, co = data['chains'], data['companyResearch']
    tech, met = data['technology'], data['measurement']
    assert len(chain['categories']) >= 9
    assert len(chain['readingPaths']) >= 3 and chain['crossChain'] and chain['glossary']
    for path in chain['readingPaths']:
        nonempty(path, 'goal sections output')
        assert set(path['sections']) <= SECTIONS
    for cat in chain['categories']:
        nonempty(cat, 'upstream manufacturing downstream profitMechanism researchFocus metrics failureModes sourceIds')
        assert len(cat['profitMechanism']) >= 3, cat['name']
    assert len(co['companies']) >= 20 and len(co['comparisons']) >= 3
    for company in co['companies']:
        nonempty(company, 'id name ticker role position advantage hypothesis risks watch firstRead sourceIds')
    assert len(co['currentReadings']) >= 3
    for report in co['currentReadings']:
        nonempty(report, 'company period published observations analysis limits sourceId')
        assert date.fromisoformat(report['published'][:10]) <= CUTOFF
        assert len(report['observations']) >= 3
        for fact in report['observations']:
            nonempty(fact, 'fact locator')
    assert len(tech['foundations']) >= 15 and len(tech['frontiers']) >= 6
    assert tech['standards'] and tech['hotspots']
    for item in tech['foundations']:
        nonempty(item, 'principle system customerValue metrics tradeoffs economics verify sourceIds')
    for item in tech['frontiers']:
        nonempty(item, 'eventDate stage announcement mechanism economics verify falsify sourceIds')
        assert date.fromisoformat(item['eventDate']) <= CUTOFF, item['id']
    for item in tech['hotspots']:
        nonempty(item, 'causalChain whoPays necessaryConditions tracking counterEvidence sourceIds')
    assert len(met['metrics']) >= 25 and len(met['methods']) >= 6
    for metric in met['metrics']:
        nonempty(metric, 'definition unit frequency leadingLagging positiveCombination negativeCombination trap access sourceIds')
    for method in met['methods']:
        nonempty(method, 'question paragraphs steps falsify sourceIds')
        assert len(method['paragraphs']) >= 3
    assert len(met['models']) >= 4 and len(met['curriculum']) >= 8
    checks = 0
    for report in co['currentReadings']:
        for line in report.get('calculationChecks', []):
            actual = calculate(line['expression'])
            assert math.isclose(actual, float(line['expected']), rel_tol=1e-7,
                                abs_tol=float(line.get('tolerance', 0.005))), (report['company'], line, actual)
            assert line['unit']
            checks += 1
    for model in met['models']:
        assert model['kind'] == '教学假设'
        nonempty(model, 'inputs equations conclusion caveats calculationChecks')
        assert len(model['calculationChecks']) >= 2
        for line in model['calculationChecks']:
            actual = calculate(line['expression'])
            assert math.isclose(actual, float(line['expected']), rel_tol=1e-7,
                                abs_tol=float(line.get('tolerance', 0.005))), (model['id'], line, actual)
            assert line['unit']
            checks += 1
    for week in met['curriculum']:
        nonempty(week, 'reading exercise deliverable rubric')
    for group in (chain['categories'], co['companies'], tech['foundations'], tech['frontiers'],
                  tech['hotspots'], met['metrics'], met['methods'], met['models']):
        ids = [x['id'] for x in group]
        assert len(ids) == len(set(ids)), 'duplicate record IDs'
    document = build(data) + '\n'
    links = Links()
    links.feed(document)
    duplicates = [k for k, v in Counter(links.ids).items() if v != 1]
    assert not duplicates, duplicates
    assert set(links.hashes) <= set(links.ids), set(links.hashes) - set(links.ids)
    assert all('ap-' + key in links.ids for key in SECTIONS)
    assert (ROOT/'appliances.html').read_text() == document, 'rebuild the static handbook'
    return checks


if __name__ == '__main__':
    data = json.loads((ROOT/'assets/appliances-research.json').read_text())
    checks = check(data)
    print(f'PASS appliance handbook: evidence references, complete learning sections, unique anchors, '
          f'{checks} independently recomputed arithmetic checks and source/build consistency')
