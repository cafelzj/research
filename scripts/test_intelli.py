from pathlib import Path
from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000/intelli.html');expect(page.locator('#empty')).to_be_visible()
 page.get_by_role('button',name='↗ 观察指标走势').click()
 expect(page.locator('.work-card')).to_have_count(1)
 assert page.evaluate("echarts.getInstanceByDom(document.querySelector('.card-chart')).getOption().series.length") == 5
 page.locator('#command').fill('近3个月甲醇产量数据表');page.locator('#commandForm').evaluate('(f)=>f.requestSubmit()')
 expect(page.locator('.work-card')).to_have_count(2)
 assert page.locator('.work-card').first.locator('tbody tr').count()==3
 assert '产量' in page.locator('.work-card').first.locator('h3').inner_text()
 page.locator('#command').fill('近6个月甲醇价格同比折线图');page.locator('#commandForm').evaluate('(f)=>f.requestSubmit()')
 expect(page.locator('#clarify')).to_be_visible();expect(page.locator('.work-card')).to_have_count(2)
 page.locator('#editPlan').click();page.locator('#command').fill('近0个月价格');page.locator('#commandForm').evaluate('(f)=>f.requestSubmit()');expect(page.locator('#status')).to_contain_text('1至120')
 card=page.locator('.work-card').first;card.locator('summary').click();card.locator('select[name=view]').select_option('metric');card.get_by_role('button',name='应用调整').click();expect(page.locator('.metric')).to_have_count(1)
 page.locator('#undo').click();expect(page.locator('.work-card').first.locator('tbody tr')).to_have_count(3)
 page.reload();expect(page.locator('.work-card')).to_have_count(2)
 with page.expect_download() as dl:page.locator('.work-card').first.get_by_role('button',name='导出',exact=False).click()
 assert dl.value.suggested_filename=='intelli-data.csv'
 page.locator('#importFile').set_input_files({'name':'custom.csv','mimeType':'text/csv','buffer':b'date,product,revenue\n2026-01,Test,10\n2026-03,Test,20\n'})
 expect(page.locator('#sourceName')).to_have_text('custom.csv');expect(page.locator('.work-card')).to_have_count(0)
 page.locator('#command').fill('近2个月Test revenue数据表');page.locator('#commandForm').evaluate('(f)=>f.requestSubmit()')
 expect(page.locator('.work-card').first.locator('tbody tr')).to_have_count(1)
 assert 'revenue' in page.locator('#field').text_content()
 page.locator('#importFile').set_input_files({'name':'bad.csv','mimeType':'text/csv','buffer':b'date,product,revenue\n2026-99,X,nope'})
 expect(page.locator('#status')).to_have_class('status error');expect(page.locator('#sourceName')).to_have_text('custom.csv')
 page.locator('#demoData').click();page.locator('#undo').click();expect(page.locator('#sourceName')).to_have_text('custom.csv');expect(page.locator('.work-card')).to_have_count(1)
 page.locator('#clear').click();expect(page.locator('.work-card')).to_have_count(0);page.locator('#undo').click();expect(page.locator('.work-card')).to_have_count(1)
 page.goto('http://127.0.0.1:8000/data.html');expect(page.locator('#records')).to_contain_text('Test')
 page.goto('http://127.0.0.1:8000/intelli.html');page.locator('#demoData').click()
 for i in range(8):page.get_by_role('button',name='◈ 最新指标概览').click()
 expect(page.locator('.work-card')).to_have_count(8);page.get_by_role('button',name='◈ 最新指标概览').click();expect(page.locator('#status')).to_contain_text('最多8张')
 page.locator('#clear').click();page.get_by_role('button',name='↗ 观察指标走势').click()
 page.screenshot(path='/tmp/intelli-desktop.png',full_page=True)
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  expect(page.locator('.site-nav a[href="intelli.html"]')).to_be_visible()
 page.screenshot(path='/tmp/intelli-mobile.png',full_page=True)
 page.locator('#command').fill('近6个月甲醇价格折线图');page.locator('#command').press('Control+Enter');expect(page.locator('.work-card')).to_have_count(2)
 for name in ['index.html','atlas.html','data.html','studio.html']:
  page.goto('http://127.0.0.1:8000/'+name);expect(page.locator('.site-nav a[href="intelli.html"]')).to_have_count(1)
 assert not errors,errors
 # Storage-disabled mode keeps working and reports that persistence is unavailable.
 context=b.new_context();context.add_init_script("Storage.prototype.setItem=function(){throw new Error('blocked')}")
 q=context.new_page();q.goto('http://127.0.0.1:8000/intelli.html');q.get_by_role('button',name='↗ 观察指标走势').click();expect(q.locator('.work-card')).to_have_count(1);expect(q.locator('#status')).to_contain_text('无法保存')
 # Declarative extension is registered by a trusted deferred script before restore.
 context2=b.new_context();x=context2.new_page()
 html=Path('intelli.html').read_text().replace('</head>', '<script defer src="extension-test.js"></script></head>')
 x.route('**/intelli.html',lambda route:route.fulfill(status=200,content_type='text/html',body=html))
 x.route('**/extension-test.js',lambda route:route.fulfill(status=200,content_type='text/javascript',body="IntelliUI.registerView('range',{label:'区间统计',aliases:['区间统计'],render(el,plan,rows){el.textContent='观测数 '+rows.length;}});"))
 x.goto('http://127.0.0.1:8000/intelli.html');x.locator('#command').fill('近6个月甲醇价格区间统计');x.locator('#commandForm').evaluate('(f)=>f.requestSubmit()')
 expect(x.locator('.card-content')).to_contain_text('观测数 6');x.reload();expect(x.locator('.card-content')).to_contain_text('观测数 6')
 x.locator('#importFile').set_input_files({'name':'safe.csv','mimeType':'text/csv','buffer':b'date,product,price\n2026-01,<img src=x onerror=alert(1)>,100\n'})
 expect(x.locator('#sourceName')).to_have_text('safe.csv');x.get_by_role('button',name='▤ 核对数据明细').click();expect(x.locator('tbody')).to_contain_text('<img src=x onerror=alert(1)>');expect(x.locator('tbody img')).to_have_count(0)
 print('PASS: extension registration, plan parsing, restored custom cards and safe data rendering')
 print('PASS: chart, parsing, clarification, invalid ranges, edits, undo, restore, export, CSV validation, custom fields, calendar gaps, shared data, card limit, 320/390px layout, keyboard, navigation, blocked storage; no runtime errors')
 b.close()
