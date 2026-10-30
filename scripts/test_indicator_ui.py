"""Browser integration of synthetic catalog, guarded import, query flow and remote errors."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8032/').rstrip('/')+'/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 if BASE.startswith('https:'):
  from urllib.request import urlopen
  def relay(route):
   with urlopen(route.request.url,timeout=40) as r:route.fulfill(status=r.status,body=r.read(),headers={'content-type':r.headers.get('content-type','text/plain')})
  page.route(BASE+'**',relay)
 page.goto(BASE+'indicators.html')
 expect(page.locator('#catalog-label')).to_contain_text('30')
 page.locator('#metric-query').fill('甲醇价格，周频，不要同比')
 page.locator('#metric-search-form').evaluate('(e)=>e.requestSubmit()')
 expect(page.locator('.metric-row')).to_have_count(2)
 page.locator('.metric-open').first.click();expect(page.locator('#metric-dialog')).to_be_visible()
 expect(page.locator('#metric-detail')).to_contain_text('同名指标 · 1 项')
 expect(page.locator('#metric-detail')).to_contain_text('不是已验证公式')
 page.keyboard.press('Escape')
 page.locator('[data-query="DMC"]').click();expect(page.locator('.metric-row')).to_have_count(2)
 page.locator('[data-query="CPI"]').click();expect(page.locator('.metric-row')).to_have_count(0)
 page.locator('[name=scope][value=remote]').check()
 expect(page.locator('.metric-row')).to_have_count(1)
 page.locator('.metric-open').click();expect(page.locator('#metric-detail')).to_contain_text('World Bank')
 page.locator('#remote-country').select_option('USA')
 page.route('https://api.worldbank.org/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps([{'lastupdated':'TEST FIXTURE'},[{'indicator':{'id':'FP.CPI.TOTL.ZG'},'date':'2024','value':2.5},{'indicator':{'id':'FP.CPI.TOTL.ZG'},'date':'2025','value':None}]])))
 page.locator('#remote-fetch').click();expect(page.locator('#remote-values')).to_contain_text('未发布 / 缺失')
 expect(page.locator('#remote-values')).to_contain_text('USA')
 page.unroute('https://api.worldbank.org/**')
 page.route('https://api.worldbank.org/**',lambda r:r.fulfill(status=503,body='unavailable'))
 page.locator('#remote-fetch').click();expect(page.locator('#remote-values')).to_contain_text('获取失败')
 expect(page.locator('.remote-observations')).to_have_count(0)
 page.keyboard.press('Escape')
 page.locator('[name=scope][value=local]').check()
 page.locator('#metric-query').fill('');page.locator('#metric-search-form').evaluate('(e)=>e.requestSubmit()')
 page.locator('#filter-transform').select_option('同比')
 assert page.locator('.metric-row').count()==2
 page.locator('#clear-filters').click()
 page.locator('[data-view=paths]').click();expect(page.locator('.path-node')).to_have_count(4)
 page.locator('[data-path="4"]').click();expect(page.locator('#path-detail')).to_contain_text('不是有机硅 DMC')
 page.locator('[data-find="碳酸二甲酯"]').click();expect(page.locator('#view-search')).to_be_visible()
 expect(page.locator('.metric-row')).to_have_count(1)
 page.locator('[data-view=quality]').click();expect(page.locator('#quality-issues')).to_contain_text('不是原表审计结果')
 page.locator('[data-quality-id="DEMO-017"]').click();expect(page.locator('#metric-dialog')).to_be_visible();page.keyboard.press('Escape')
 page.locator('[data-view=method]').click();expect(page.locator('#cp-command')).to_contain_text('cumulative_to_period')
 # Malformed and duplicate identity files must preserve the existing catalog.
 before=page.locator('#catalog-label').inner_text()
 page.locator('#catalog-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"schema_version":1,"records":[]}'} )
 expect(page.locator('#app-status')).to_contain_text('导入失败');assert page.locator('#catalog-label').inner_text()==before
 record={'id':'TEST-1','code':'TEST-1','name':'<img src=x onerror="window.pwned=true">','industry':'测试行业','unit':'元','source':'测试源','frequency':'月','transform':'原值','role':'价格与成本','aliases':[]}
 doc={'schema_version':1,'meta':{'source_row_count':1},'records':[record],'audit':{'issues':[]},'relations':[]}
 page.locator('#catalog-file').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
 expect(page.locator('#catalog-label')).to_contain_text('valid.json')
 page.locator('[data-view=search]').click();page.locator('#metric-query').fill('TEST-1');page.locator('#metric-search-form').evaluate('(e)=>e.requestSubmit()')
 expect(page.locator('.metric-row')).to_have_count(1);expect(page.locator('.metric-row img')).to_have_count(0)
 assert not page.evaluate('window.pwned||false')
 page.locator('#demo-reset').click();expect(page.locator('#catalog-label')).to_contain_text('30')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 page.screenshot(path='/tmp/indicator-ui-mobile.png',full_page=True)
 b.close()
print('PASS query and scope boundaries, disambiguation, relations, remote null/error handling, paths, audit, safe transactional import, mobile; no runtime errors')
