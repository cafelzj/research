"""Recheck the committed mirror snapshot without writing application files.

Requires rdata==1.0.0 for the IMF RDA. Uses fixed URLs and normal TLS verification.
This validates extraction from mirrors, not the unavailable official publishers.
"""
import csv
import hashlib
import io
import json
from pathlib import Path
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / 'assets/daily-data.js').read_text()
data = json.loads(text[text.index('{'):text.rindex('}')+1])

def fetch(url):
    with urllib.request.urlopen(url, timeout=45) as response:
        return response.read()

def check_value(actual, expected):
    assert abs(float(actual)-expected) < 1e-9, (actual,expected)

for metric in data['metrics']:
    if metric['source'] != 'wdi':
        continue
    raw = fetch(metric['file'])
    assert hashlib.sha256(raw).hexdigest() == metric['sha256'], metric['id']
    rows = list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
    records = {(r['Country Code'],r['Year']):r['Value'] for r in rows}
    for year, countries in metric['values'].items():
        for country, observation in countries.items():
            check_value(records[country,year],observation['value'])
    print('PASS WDI snapshot and exact extraction:',metric['code'])

# Import only for the development audit; no dependency is required by the site.
import rdata
source = data['sources']['imf']
raw = fetch(source['file'])
assert hashlib.sha256(raw).hexdigest() == source['integrity']
with tempfile.TemporaryDirectory() as directory:
    path = Path(directory)/'source.rda'
    path.write_bytes(raw)
    frame = rdata.read_rda(path)['data_2610']
    for metric in data['metrics']:
        if metric['source'] != 'imf':
            continue
        subset = frame[frame['concept']==metric['code']]
        rows = {(str(r['ref_area']),str(int(r['year']))):r for _,r in subset.iterrows()}
        for year, countries in metric['values'].items():
            for country, observation in countries.items():
                row = rows[country,year]
                assert int(year) <= int(row['lastactualdate']) == observation['lastActual']
                assert row['unit'] == 'PT' and row['scale'] == 0
                check_value(row['value'],observation['value'])
        print('PASS IMF actual cutoff, unit and exact extraction:',metric['code'])
assert not next(m for m in data['metrics'] if m['id']=='public_pensions')['values']
assert not next(m for m in data['metrics'] if m['id']=='civil_pensions')['values']
print('PASS pension gaps retained; no replacement metrics or invented observations')
