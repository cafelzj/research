"""Meaningful engine regression checks: provenance, exact scope, and CP boundaries."""
import csv
import json
import os
import socket
import time
import multiprocessing
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from indicator_lab.catalog import HEADERS,import_workbook,write_sqlite,export_sqlite,normalize
from indicator_lab.search import search,get_record
from indicator_lab.pipeline import prepare_csv,quality_candidates
from indicator_lab.remote import observations_worldbank,search_worldbank
from openpyxl import Workbook

class EngineTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        b=Workbook();s=b.active;s.title='全行业指标';s.append(['行业指标信息']);s.append(HEADERS)
        s.append(['示例','A000','示例价','日','元','示例来源','正常','',''])
        rows=[
            ['建材','A001','产量:水泥:当月值','月','万吨','统计局','正常','',''],
            ['基础化工','A001','产量:水泥:当月值','月','万吨','统计局','正常','',''],
            ['建材','D001','产量:水泥:同比','月','%','统计局','正常','',''],
            ['建材','D002','产量:水泥:累计值','月','万吨','统计局','正常','',''],
            ['建材','D003','产量:水泥:累计同比','月','%','统计局','正常','',''],
            ['建材','A002','产量:水泥:当月值','月','万吨','统计局','正常','',''],
            ['基础化工','A003','市场价:甲醇(优等品,含税)','日','元/吨','某机构','停更','木醇,含税价@,@methanol spot',''],
            ['基础化工','D004','市场价:甲醇(优等品,含税):同比','日','%','某机构','正常','',''],
            ['传媒','A004','月度总票房','年','亿元','某机构','预警','',''],
            ['家电','A005','空调产销率','月','万台','某机构','正常','',''],
            ['基础化工','A006','测试名称','月','吨','某机构','正常','',''],
            ['基础化工','A006','测试名称','月','元','某机构','正常','',''],
        ]
        for r in rows:s.append(r)
        self.file=self.root/'input.xlsx';b.save(self.file)
        self.catalog=import_workbook(self.file);self.db=self.root/'catalog.sqlite';write_sqlite(self.catalog,self.db)
    def tearDown(self):self.temp.cleanup()
    def csv(self,rows):
        path=self.root/'values.csv'
        with path.open('w',newline='',encoding='utf-8') as f:
            w=csv.DictWriter(f,fieldnames=['series_id','date','value','unit','frequency','region','source','coverage']);w.writeheader()
            for row in rows:w.writerow(dict(series_id='A001',date=row[0],value=row[1],unit=row[2] if len(row)>2 else '万吨',frequency='月',region='中国',source='统计局',coverage=row[3] if len(row)>3 else ''))
        return path
    def test_import_preserves_multilabel_and_code_conflict(self):
        self.assertEqual(self.catalog['meta']['source_row_count'],12)
        self.assertEqual(self.catalog['meta']['record_count'],11)
        row=get_record(self.db,'A001')[0]
        self.assertEqual(row['industries'],['建材','基础化工']);self.assertEqual(row['source_rows'],[4,5])
        self.assertEqual(len(get_record(self.db,'A006')),2)
        self.assertEqual(self.catalog['meta']['code_conflict_count'],1)
        self.assertFalse(self.catalog['meta']['has_observations'])
        self.assertEqual(self.catalog['meta']['formula_cells'],0)
        aliases=get_record(self.db,'A003')[0]['aliases'];self.assertEqual(aliases,['木醇,含税价','methanol spot'])
        self.assertTrue(any(x['kind']=='name_frequency_conflict' for x in self.catalog['audit']['issues']))
        self.assertTrue(any(x['kind']=='name_unit_conflict' for x in self.catalog['audit']['issues']))
        self.assertTrue(any(set(x['ids'])=={'A001','A002'} for x in self.catalog['audit']['homonyms']))
    def test_exact_search_and_scope(self):
        self.assertEqual(search(self.db,'a001')['results'][0]['record']['id'],'A001')
        self.assertEqual(search(self.db,'产量：水泥：当月值')['results'][0]['score'],9002)
        self.assertEqual(search(self.db,'木醇,含税价')['results'][0]['record']['id'],'A003')
        self.assertEqual(search(self.db,'methanol spot')['results'][0]['record']['id'],'A003')
        self.assertEqual(search(self.db,'水泥累计同比')['results'][0]['record']['id'],'D003')
        self.assertEqual(search(self.db,'A001',industry='基础化工')['total'],1)
        self.assertEqual(search(self.db,'A001',industry='不存在')['total'],0)
        self.assertTrue(all(x['record']['transform'] not in ('同比','累计同比') for x in search(self.db,'甲醇价格，不要同比')['results']))
        self.assertEqual(search(self.db,'月度水泥',frequency='日')['total'],0)
        self.assertEqual(search(self.db,"'; DROP TABLE records; --")['total'],0)
        self.assertTrue(get_record(self.db,'A001'))
    def test_relations_are_candidates_and_ambiguous_base_not_picked(self):
        # A001/A002 have identical names but separate codes, so there is no
        # trustworthy unique base to attach the plain YoY to.
        self.assertFalse(any(x['target']=='D001' for x in self.catalog['relations']))
        edge=next(x for x in self.catalog['relations'] if x['target']=='D003')
        self.assertEqual(edge['source'],'D002');self.assertEqual(edge['type'],'derived_candidate')
        self.assertIn('待',edge['status'])
        self.assertEqual(export_sqlite(self.db)['meta']['record_count'],11)
    def test_cp_missing_zero_and_calendar_alignment(self):
        p=self.csv([('2023-01',0),('2024-01',10),('2024-03',20)])
        rows=prepare_csv(p,'yoy')['records']
        self.assertIsNone(rows[1]['output_value']);self.assertIn('zero_base_not_computable',rows[1]['flags'])
        self.assertIn('missing_base_period',rows[2]['flags'])
        p=self.csv([('2023-12',100),('2024-01',110),('2024-03',130)])
        rows=prepare_csv(p,'mom')['records'];self.assertAlmostEqual(rows[1]['output_value'],10)
        self.assertIsNone(rows[2]['output_value']);self.assertEqual(rows[1]['provenance']['base_rows'],[2])
    def test_cumulative_january_and_janfeb(self):
        p=self.csv([('2023-12',1000),('2024-01',100),('2024-02',230),('2024-03',330)])
        with self.assertRaises(ValueError):prepare_csv(p,'cumulative_to_period')
        rows=prepare_csv(p,'cumulative_to_period','flow')['records']
        self.assertEqual([r['output_value'] for r in rows],[None,100,130,100])
        p=self.csv([('2024-02',230,'万吨','合并1-2月'),('2024-03',330)])
        rows=prepare_csv(p,'cumulative_to_period','flow')['records']
        self.assertIsNone(rows[0]['output_value']);self.assertIsNone(rows[1]['output_value'])
        self.assertIn('invalid_base_observation',rows[1]['flags'])
    def test_cp_duplicates_mixed_units_nonfinite(self):
        p=self.csv([('2024-01',100),('2024-01-31',110),('2024-02',120)])
        rows=prepare_csv(p,'mom')['records'];self.assertTrue(all(r['output_value'] is None for r in rows))
        self.assertIn('duplicate_period',rows[0]['flags'])
        p=self.csv([('2024-01',100),('2024-02',120,'吨')])
        with self.assertRaises(ValueError):prepare_csv(p,'mom')
        p=self.csv([('2024-01','nan'),('2024-02',''),('2024-03','not numeric')])
        rows=prepare_csv(p)['records'];self.assertTrue(all(r['output_value'] is None for r in rows))
        self.assertEqual(rows[0]['provenance']['raw_value'],'nan')
    def test_finite_inputs_derived_overflow(self):
        p=self.csv([('2024-01',1e-300),('2024-02',1e300)])
        row=prepare_csv(p,'mom')['records'][1]
        self.assertIsNone(row['output_value']);self.assertIn('derived_nonfinite',row['flags'])
        self.assertEqual(row['value'],1e300)
        json.dumps(row,allow_nan=False)
    def test_remote_boundaries_and_empty(self):
        with self.assertRaises(ValueError):observations_worldbank('https://evil/','CHN',2020,2024)
        with self.assertRaises(ValueError):observations_worldbank('NY.GDP.MKTP.CD','../',2020,2024)
        with patch('indicator_lab.remote._fetch',return_value=({'pages':1},[], 'https://api.worldbank.org/v2/indicator/NY.GDP.MKTP.CD')):
            result=search_worldbank('NY.GDP.MKTP.CD');self.assertEqual(result['total'],0)
        with patch('indicator_lab.remote._fetch',side_effect=OSError('network down')):
            with self.assertRaises(OSError):search_worldbank('NY.GDP.MKTP.CD')
    def test_outlier_scan_requires_real_history_and_is_not_causality(self):
        p=self.csv([(f'2024-{i:02d}',i) for i in range(1,12)]+[('2024-12',1000)])
        candidates=quality_candidates(prepare_csv(p)['records'])
        self.assertTrue(candidates);self.assertEqual(candidates[-1]['type'],'flat_baseline_review')
        self.assertIsNone(candidates[-1]['score'])

class ServiceSecurityTests(EngineTests):
    def test_service_static_namespace_and_local_origin(self):
        from indicator_lab.server import serve
        root=self.root/'web';(root/'assets').mkdir(parents=True)
        (root/'indicators.html').write_text('<h1>local</h1>')
        (root/'assets'/'public.json').write_text('{}')
        (root/'AGENTS.md').write_text('private text')
        (root/'indicator_lab').mkdir();(root/'indicator_lab'/'server.py').write_text('private source')
        (root/'assets'/'escape.txt').symlink_to(root/'AGENTS.md')
        with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
        proc=multiprocessing.Process(target=serve,args=(self.db,port,False,root));proc.start()
        base=f'http://127.0.0.1:{port}'
        try:
            for _ in range(50):
                try:
                    with urlopen(base+'/health',timeout=1) as r:health=json.load(r)
                    break
                except OSError:time.sleep(.02)
            else:self.fail('service failed to start')
            self.assertEqual(health['service'],'indicator-lab')
            with urlopen(base+'/assets/public.json') as r:self.assertEqual(r.status,200)
            for path in ['/AGENTS.md','/indicator_lab/server.py','/assets/%2e%2e/AGENTS.md','/assets/%2e%2e/indicator_lab/server.py','/assets/%252e%252e/AGENTS.md','/assets/%2f../AGENTS.md','/assets/..%5cAGENTS.md','/assets/escape.txt']:
                with self.assertRaises(HTTPError) as error:urlopen(base+path)
                self.assertEqual(error.exception.code,404,path)
            for headers in [{'Host':'attacker.example'},{'Origin':'https://attacker.example'},{'Sec-Fetch-Site':'cross-site'}]:
                with self.assertRaises(HTTPError) as error:urlopen(Request(base+'/catalog',headers=headers))
                self.assertEqual(error.exception.code,403)
            with self.assertRaises(HTTPError) as error:urlopen(base+'/api/remote/search?q=GDP')
            self.assertEqual(error.exception.code,403)
            with urlopen(base+'/api/catalog') as r:self.assertEqual(json.load(r)['meta']['record_count'],11)
        finally:proc.terminate();proc.join(3)

@unittest.skipUnless(os.environ.get('INDICATOR_TEST_DB'),'Set INDICATOR_TEST_DB to test the private full catalog')
class RealCatalogSearchTests(unittest.TestCase):
    def test_real_disambiguation_and_natural_language(self):
        db=os.environ['INDICATOR_TEST_DB']
        self.assertEqual(search(db,'CPI')['total'],0)
        self.assertEqual(search(db,'A000011476')['results'][0]['record']['code'],'A000011476')
        for query,expected in [('美的系空调线上当月零售均价，不要同比','D021449535'),('华东重质纯碱周价格','A000011461'),('磷酸铁锂正极材料周价格，不要电解液','A000020245'),('SCFI综合指数周值','A000591059')]:
            codes=[r['record']['code'] for r in search(db,query,100)['results']]
            self.assertIn(expected,codes,(query,codes))
        methanol=search(db,'甲醇价格，不要同比',100)
        self.assertEqual({r['record']['code'] for r in methanol['results']},{'A000011476','A000182672'})
        self.assertGreater(search(db,'DMC',100)['total'],1)
        self.assertGreater(search(db,'MDI',100)['total'],1)

if __name__=='__main__':unittest.main()
