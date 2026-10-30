"""Optional local full-catalog integration. Start indicator_lab serve before running."""
import json
import sys
from urllib.request import urlopen
from playwright.sync_api import sync_playwright,expect
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8767/').rstrip('/')+'/'
with urlopen(BASE+'health') as r:assert json.load(r)['service']=='indicator-lab'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE)
 expect(page.locator('#catalog-label')).to_contain_text('61,781',timeout=120000)
 expect(page.locator('#catalog-description')).to_contain_text('62,241')
 expect(page.locator('#catalog-description')).to_contain_text('460')
 expect(page.locator('#catalog-mode')).not_to_contain_text('演示')
 def find(query,count):
  page.locator('#metric-query').fill(query);page.locator('#metric-search-form').evaluate('(e)=>e.requestSubmit()');expect(page.locator('.metric-row')).to_have_count(count)
 find('甲醇价格，华东周频，不要同比',2)
 find('美的系空调线上当月零售均价，不要同比',1)
 page.locator('.metric-open').click();expect(page.locator('#metric-detail')).to_contain_text('D021449535');expect(page.locator('#metric-detail')).to_contain_text('SHA-256');page.keyboard.press('Escape')
 find('CPI',0)
 find('A000011476',1)
 page.locator('#filter-frequency').select_option('日');expect(page.locator('.metric-row')).to_have_count(0)
 page.locator('#clear-filters').click();find('',40)
 first=page.locator('.metric-row .row-label').first.inner_text()
 page.locator('#load-more').click();expect(page.locator('.metric-row')).to_have_count(40)
 assert page.locator('.metric-row .row-label').first.inner_text()!=first
 page.locator('#previous-page').click();expect(page.locator('.metric-row .row-label').first).to_have_text(first)
 page.locator('[data-view=quality]').click();expect(page.locator('#quality-issues')).to_contain_text('名称 / 单位需核验')
 expect(page.locator('#quality-issues')).to_contain_text('名称 / 频率需核验')
 with page.expect_download() as info:page.locator('#export-audit').click()
 assert info.value.suggested_filename.endswith('.json')
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 page.screenshot(path='/tmp/indicator-private-mobile.png',full_page=True)
 b.close()
print('PASS private full catalog auto-load, 61781 entities, exact/natural queries, no CPI false match, filters, pagination, provenance, quality export and mobile layout')
