"""Build the static appliance research handbook from its reviewed source data."""
import argparse
import html
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def esc(value):
    if isinstance(value,(list,tuple)):value=" / ".join(str(x) for x in value)
    return html.escape(str(value),quote=True)
def paras(value):
    if value is None:return ''
    if isinstance(value,str):value=[value]
    return ''.join('<p>'+esc(x)+'</p>' for x in value)
def bullets(value):
    if not value:return ''
    if isinstance(value,str):value=[value]
    return '<ul>'+''.join('<li>'+esc(x)+'</li>' for x in value)+'</ul>'
def field(title,value):return '<h4>'+esc(title)+'</h4>'+paras(value)
def table(columns,rows,caption):return '<div class="ap-table-wrap"><table><caption>'+esc(caption)+'</caption><thead><tr>'+''.join('<th scope="col">'+esc(x)+'</th>' for x in columns)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(('<th scope="row">' if i==0 else '<td>')+esc(x)+('</th>' if i==0 else '</td>') for i,x in enumerate(row))+'</tr>' for row in rows)+'</tbody></table></div>'
def slug(value):return re.sub(r'[^a-z0-9_-]+','-',str(value).lower()).strip('-')


def build(data):
    titles=[('map','行业地图'),('chains','品类与产业链'),('companies','重要公司'),('reports','最新财报核读'),('technology','核心技术'),('frontiers','最新技术'),('hotspots','热点与反证'),('metrics','行业数据指标'),('methods','研究方法论'),('models','推演模型'),('training','研究员训练'),('reference','标准与术语'),('sources','资料依据')]
    section_names=dict(titles)
    source_map={s['id']:s for s in data['sources']}
    def refs(ids):
        if not ids:return ''
        return '<div class="ap-refs">资料与支持范围：'+''.join('<a href="#ap-source-'+esc(key)+'">'+esc(source_map[key]['title'])+'</a>' for key in ids)+'</div>'
    def section(key,title,body,intro=''):
        return '<section id="ap-'+key+'" class="ap-section" data-outline="'+esc(title)+'"><div class="ap-section-head"><span>'+esc(key.upper())+'</span><h2>'+esc(title)+'</h2></div>'+paras(intro)+body+'</section>'
    def searchable(key,title,body,classes='ap-paper'):
        return '<article id="'+esc(key)+'" class="'+esc(classes)+'" data-ap-search="'+esc(title)+'">'+body+'</article>'
    def comparisons(rows,prefix):
        return ''.join(searchable('ap-compare-'+prefix+'-'+str(i)+'-'+slug(x['title']),x['title'],'<h3>'+esc(x['title'])+'</h3>'+paras(x.get('paragraphs',[]))+table(x['table']['columns'],x['table']['rows'],x['title'])+refs(x.get('sourceIds',[]))) for i,x in enumerate(rows))
    def filterbar(prefix,label,items,key):
        values=sorted(set(str(x.get(key,'')) for x in items if x.get(key)))
        return '<div class="ap-filter" data-filter-group="'+prefix+'" hidden><label>'+esc(label)+'<input id="'+prefix+'-query" type="search" placeholder="输入公司、业务、指标或关键词"></label><label>分类<select id="'+prefix+'-category"><option value="">全部分类</option>'+''.join('<option>'+esc(v)+'</option>' for v in values)+'</select></label><p id="'+prefix+'-count" role="status"></p></div>'
    chain=data['chains'];co=data['companyResearch'];tech=data['technology'];met=data['measurement']
    body=[]
    routes='<div class="ap-route-grid">'+''.join('<article><span>'+esc(x['level'])+'</span><h3>'+esc(x['title'])+'</h3>'+paras(x['goal'])+'<p class="ap-route-links">'+''.join('<a href="#ap-'+esc(k)+'">'+esc(section_names[k])+' →</a> ' for k in x['sections'])+'</p>'+field('本轮产出',x['output'])+'</article>' for x in chain['readingPaths'])+'</div>'
    flow='<div class="ap-evidence-flow" aria-label="家电研究证据链">'+''.join('<div><b>'+a+'</b><small>'+b+'</small></div>' for a,b in [('需求来源','新增 / 更新 / 渗透 / 天气'),('真实动销','零售 / 安装 / 激活'),('渠道与工厂','库存 / 订单 / 出货'),('利润兑现','净价 / 成本 / 费用'),('现金与价值','营运资金 / 再投资 / 回报')])+'</div>'
    body.append(section('map','先建立行业地图与研究问题',paras(chain['overview']['paragraphs'])+flow+bullets(chain['overview']['coreQuestions'])+routes+comparisons(chain['crossChain'],'chains')))
    cats=[]
    for i,c in enumerate(chain['categories']):
        key='ap-category-'+slug(c['id'])
        up=table(['上游环节','核心投入 / 技术','代表参与者','价值与约束'],[[x['link'],x['inputs'],x['players'],str(x['value'])+'；'+str(x['risks'])] for x in c['upstream']],c['name']+' · 上游分工')
        content='<div class="ap-detail-body">'+field('客户怎样作购买决定',c['consumerDecision'])+up+field('制造与系统集成',c['manufacturing'])+field('渠道、安装与售后',c['downstream'])+'<h4>利润怎样形成和转移</h4>'+paras(c['profitMechanism'])+field('研究优先问题',c['researchFocus'])+field('技术驱动',c['technologyDrivers'])+field('跟踪指标',c['metrics'])+'<div class="ap-counter"><b>哪些情况会使判断失效</b>'+bullets(c['failureModes'])+'</div>'+refs(c.get('sourceIds',[]))+'</div>'
        cats.append('<details id="'+key+'" class="ap-category" data-ap-search="'+esc(c['name'])+'"><summary><span>'+str(i+1).zfill(2)+'</span><b>'+esc(c['name'])+'</b><small>'+esc(c['need'])+'</small></summary>'+content+'</details>')
    body.append(section('chains','按品类拆上下游与利润池',''.join(cats),'先选一种产品，再沿实物流、货权与现金追溯。商用暖通及上游部件是关联研究范围，研究对象不等同申万家电成分股。'))
    companies=[]
    for c in co['companies']:
        key='ap-company-'+slug(c['id']);search_text=esc(json.dumps(c,ensure_ascii=False))
        detail=field('竞争能力从哪里来',c['advantage'])+field('需要验证的研究假说',c['hypothesis'])+field('最脆弱的环节',c['risks'])+field('优先跟踪',c['watch'])+field('对照对象',c['peers'])+field('第一份材料怎样读',c['firstRead'])+refs(c.get('sourceIds',[]))
        companies.append(searchable(key,c['name'],'<small>'+esc(c['role'])+' · '+esc(c['market'])+'</small><h3>'+esc(c['name'])+'</h3><span class="ap-ticker">'+esc(c['ticker'])+'</span><p>'+esc(c['position'])+'</p><div class="ap-tags">'+esc(' / '.join(c['segments']))+'</div>'+(paras(c.get('classification','')) if c.get('classification') else '')+'<details><summary>沿业务、风险与指标研究这家公司</summary>'+detail+'</details>','ap-company ap-filter-item').replace('data-ap-search=', 'data-filter-owner="ap-companies" data-filter-value="'+esc(c['role'])+'" data-filter-text="'+search_text+'" data-ap-search=',1))
    groupintro=''.join('<h3>'+esc(g['name'])+'</h3>'+paras(g['logic'])+paras(g['comparison']) for g in co['groups'])
    body.append(section('companies','重要公司：建立可比较的研究样本',paras(co['intro'])+'<details class="ap-paper"><summary>怎样按商业模式选择公司和对照组</summary>'+groupintro+'</details>'+filterbar('ap-companies','查找公司、代码或业务',co['companies'],'role')+'<div class="ap-company-grid">'+''.join(companies)+'</div>'+comparisons(co['comparisons'],'companies')))
    readings=[]
    for i,c in enumerate(co['currentReadings']):
        obs='<ol class="ap-observations">'+''.join('<li>'+paras(o['fact'])+'<small>原件定位：'+esc(o['locator'])+'</small></li>' for o in c['observations'])+'</ol>'
        checks=table(['原件计算 / 口径桥','复核结果'],[[x['formula'],x['result']] for x in c.get('calculationChecks',[])],c['company']+' · 原始数字复算') if c.get('calculationChecks') else ''
        readings.append(searchable('ap-current-'+str(i),c['company']+' '+c['period'],'<span class="ap-badge">'+esc(c['published'])+' 披露</span><h3>'+esc(c['company'])+' · '+esc(c['period'])+'</h3>'+paras(c.get('auditStatus'))+obs+checks+'<h4>怎样从事实走到判断</h4>'+paras(c['analysis'])+'<div class="ap-counter"><b>这份报告仍不能回答什么</b>'+bullets(c['limits'])+'</div>'+refs([c['sourceId']])))
    body.append(section('reports','用最新可得财报校验研究框架',''.join(readings),'以下是截至2026年11月7日实际读取的披露示范。先对齐报告期和合并口径，再讨论原因；公司引用的第三方行业数据，仍是该来源样本的观察。'))
    foundations=[]
    for t in tech['foundations']:
        detail=paras(t['principle'])+field('放回整机系统看',t['system'])+field('用户实际获得什么',t['customerValue'])+field('技术性能怎样测',t['metrics'])+field('必须付出的代价',t['tradeoffs'])+field('怎样进入经济账',t['economics'])+field('研究时怎样验证',t['verify'])+refs(t.get('sourceIds',[]))
        foundations.append('<details id="ap-tech-'+slug(t['id'])+'" class="ap-paper ap-filter-item" data-filter-owner="ap-tech" data-filter-value="'+esc(t['category'])+'" data-filter-text="'+esc(json.dumps(t,ensure_ascii=False))+'" data-ap-search="'+esc(t['name'])+'"><summary><span class="ap-badge">'+esc(t['category'])+'</span><h3>'+esc(t['name'])+'</h3></summary>'+detail+'</details>')
    body.append(section('technology','核心技术：从物理原理走到系统经济性',paras(tech['intro'])+filterbar('ap-tech','查找技术、性能或应用',tech['foundations'],'category')+''.join(foundations)))
    frontiers=[]
    for f in tech['frontiers']:
        frontiers.append(searchable('ap-frontier-'+slug(f['id']),f['name'],'<div class="ap-meta"><span class="ap-badge">'+esc(f.get('stageLabel',f['stage']))+'</span><small>所引披露时点 '+esc(f['eventDate'])+'</small></div><h3>'+esc(f['name'])+'</h3>'+field('原始披露说了什么',f['announcement'])+paras(f['mechanism'])+field('商业化经济账',f['economics'])+field('提高判断把握需要什么证据',f['verify'])+'<div class="ap-counter"><b>降温或证伪信号</b>'+bullets(f['falsify'])+'</div>'+refs(f.get('sourceIds',[]))))
    body.append(section('frontiers','最新技术与产品：核验阶段和兑现条件',''.join(frontiers),'“最新”以本手册核验截止日为界。阶段按所引文档的披露时点理解；样机、厂商测试、上市和持续盈利分别判断。'))
    hotspot=[]
    for h in tech['hotspots']:
        hotspot.append(searchable('ap-hotspot-'+slug(h['id']),h['title'],'<h3>'+esc(h['title'])+'</h3><ol>'+''.join('<li>'+esc(x)+'</li>' for x in h['causalChain'])+'</ol>'+field('潜在受益环节',h['beneficiaries'])+field('谁支付，谁承担成本',h['whoPays'])+field('成立的必要条件',h['necessaryConditions'])+field('跟踪什么',h['tracking'])+'<div class="ap-counter"><b>反向证据</b>'+bullets(h['counterEvidence'])+'</div>'+refs(h.get('sourceIds',[]))))
    body.append(section('hotspots','把行业热点写成可证伪的命题',''.join(hotspot)))
    metrics=[]
    for m in met['metrics']:
        detail=field('指标定义与计算边界',m['definition'])+field('领先或滞后于什么',m['leadingLagging'])+field('怎样解释',m['interpretation'])+'<div class="ap-proof">'+field('支持改善的组合',m['positiveCombination'])+'</div><div class="ap-counter">'+field('转弱或推翻判断的组合',m['negativeCombination'])+field('最容易误读',m['trap'])+'</div>'+refs(m.get('sourceIds',[]))
        metrics.append('<details id="ap-metric-'+slug(m['id'])+'" class="ap-paper ap-filter-item" data-filter-owner="ap-metrics" data-filter-value="'+esc(m['category'])+'" data-filter-text="'+esc(json.dumps(m,ensure_ascii=False))+'" data-ap-search="'+esc(m['name'])+'"><summary><div><h3>'+esc(m['name'])+'</h3><small>'+esc(m['unit'])+' · '+esc(m['frequency'])+'</small></div><span class="ap-badge">'+esc(m['access'])+'</span></summary>'+detail+'</details>')
    regimes=table(['观察组合','终端零售','厂家出货','库存','价格','订单','可能解释与下一步'],[[r['name'],r['retail'],r['shipments'],r['inventory'],r['price'],r['orders'],str(r['interpretation'])+'；'+str(r['nextTest'])] for r in met['regimes']],'行业状态：证据组合，非机械打分器')
    body.append(section('metrics','判断行业情况：数据字典与证据组合',paras(met['intro'])+regimes+filterbar('ap-metrics','查找指标、口径或数据源',met['metrics'],'category')+''.join(metrics)))
    methods=[]
    for m in met['methods']:
        steps=table(['实际操作','提取字段','怎样判断与分叉'],[[x['action'],x['fields'],x['decision']] for x in m['steps']],m['title']+' · 桌面研究步骤')
        methods.append(searchable('ap-method-'+slug(m['id']),m['title'],'<h3>'+esc(m['title'])+'</h3><p class="ap-question">'+esc(m['question'])+'</p>'+paras(m['paragraphs'])+steps+'<div class="ap-counter"><b>什么会推翻原观点</b>'+bullets(m['falsify'])+'</div>'+refs(m.get('sourceIds',[]))))
    body.append(section('methods','研究方法论：从问题、模型走到反证',''.join(methods)))
    models=[]
    for m in met['models']:
        models.append(searchable('ap-model-'+slug(m['id']),m['title'],'<span class="ap-badge">教学假设 · 参数非实测行业均值</span><h3>'+esc(m['title'])+'</h3>'+table(['条件','假设取值','单位'],[[x['name'],x['value'],x['unit']] for x in m['inputs']],m['title']+' · 输入')+'<ol>'+''.join('<li><div class="ap-equation">'+esc(x)+'</div></li>' for x in m['equations'])+'</ol><div class="ap-result">'+esc(m['conclusion'])+'</div><h4>模型边界</h4>'+bullets(m['caveats'])))
    body.append(section('models','动手推演：让每个判断有算术约束',''.join(models)))
    weeks=[]
    for i,w in enumerate(met['curriculum'],1):
        weeks.append(searchable('ap-week-'+str(i),str(w['week'])+' '+w['title'],'<span class="ap-eyebrow">'+esc(w['week'])+'</span><h3>'+esc(w['title'])+'</h3>'+field('材料与阅读',w['reading'])+field('实际练习',w['exercise'])+field('本周交付',w['deliverable'])+'<div class="ap-proof"><b>验收标准</b>'+bullets(w['rubric'])+'</div>'))
    questions=''.join('<details class="ap-paper"><summary>'+esc(q['title'])+'</summary>'+bullets(q['questions'])+field('需要取得什么证据',q['evidence'])+field('哪些回答会推翻原假设',q['disconfirm'])+'</details>' for q in met['researchQuestions'])
    body.append(section('training','研究员训练：按交付成果检验进步',''.join(weeks)+'<h3>公司、渠道与技术调研的问题库</h3>'+questions,'训练从画清商业关系开始，逐步做数据表、财报桥、模型、竞争比较和研究报告。最终评价证据、口径、推演和修正能力。'))
    standards=''.join('<article class="ap-paper"><h3>'+esc(x['name'])+'</h3>'+field('实际测量什么',x['whatItMeasures'])+field('解释边界',x['limits'])+refs([x['sourceId']])+'</article>' for x in tech['standards'])
    terms=''.join('<details class="ap-term" data-ap-search="'+esc(g['term'])+'" id="ap-term-'+str(i)+'"><summary>'+esc(g['term'])+'</summary>'+paras(g['explanation'])+field('例子',g['example'])+field('不要混淆',g['confusion'])+'</details>' for i,g in enumerate(chain['glossary']))
    body.append(section('reference','标准与常见概念：把同名词的不同口径分开',standards+'<h3>术语速查</h3><div class="ap-term-grid">'+terms+'</div>'))
    sources=[]
    for prefix,label in [('chain-','产业与品类'),('co-','公司与最新披露'),('tech-','技术与标准'),('metric-','数据与研究方法')]:
        matched=[x for x in data['sources'] if x['id'].startswith(prefix)]
        entries=''.join('<article id="ap-source-'+esc(s['id'])+'" class="ap-source"><span class="ap-badge">'+esc(s['status'])+'</span><h3><a href="'+esc(s['url'])+'" target="_blank" rel="noopener noreferrer">'+esc(s['title'])+' ↗</a></h3>'+paras(s['scope'])+'<small>资料日期 '+esc(s.get('published','未确认'))+' · 核验 '+esc(s.get('accessed','2026-11-07'))+'</small></article>' for s in matched)
        sources.append('<details class="ap-source-group"><summary>'+label+' · '+str(len(matched))+'份来源记录</summary>'+entries+'</details>')
    body.append(section('sources','来源、证据范围与更新边界',''.join(sources),'来源按实际读取范围标注。企业自述不等于独立测评，核验入口不等于已取得数据；研究推断、教学参数与披露事实在正文分开呈现。'))
    nav='<nav class="ap-contents" aria-label="家电研究目录"><b>家电研究手册</b><ol>'+''.join('<li><a href="#ap-'+k+'">'+str(i+1).zfill(2)+' / '+t+'</a></li>' for i,(k,t) in enumerate(titles))+'</ol><a href="#ap-top">回到页首 ↑</a></nav>'
    return '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>家电行业研究框架与学习手册 · 知研集</title><meta name="description" content="学习家电研究：品类产业链、重要公司、技术原理与最新动态、行业指标、利润与现金模型及研究员训练路径。"><link rel="stylesheet" href="assets/site.css"><link rel="stylesheet" href="assets/appliances.css"><link rel="stylesheet" href="assets/outline.css"><script defer src="assets/outline.js"></script><script defer src="assets/appliances.js"></script></head><body class="page-appliances"><header class="site-header"><a class="site-brand" href="index.html">知研集<small>IDEAS / EVIDENCE / RESEARCH</small></a><nav class="site-nav" aria-label="网站主导航"><a href="atlas.html" aria-current="page">产业链总览</a><a href="index.html">行业看板</a><a href="intelli.html">IntelliUI <small>BETA</small></a><a href="daily.html">日常研究</a></nav></header><main id="ap-top" class="ap-wrap"><div class="ap-breadcrumb"><a href="atlas.html">行业全景</a> / <a href="atlas.html?sw=801110">家用电器</a> / 研究框架与学习</div><header class="ap-hero"><div><span class="ap-eyebrow">APPLIANCE RESEARCH / LEARN TO REASON</span><h1>把家电研究，<br>做到能独立判断。</h1><p>从一台机器的技术与成本，到一家公司的渠道、现金和竞争位置，再用数据与反证判断行业变化。先建立联系，再形成结论。</p><div class="ap-hero-links"><a href="#ap-map">第一次系统学习 →</a><a href="#ap-companies">从重要公司开始 →</a><a href="#ap-training">进入研究训练 →</a></div></div><div class="ap-hero-note"><b>研究员要回答的四个问题</b><ol><li>真实需求从哪里来，货和钱停在哪里？</li><li>技术改善了什么，谁愿意为它付费？</li><li>利润怎样转成现金和可持续回报？</li><li>哪一条证据会使我修改观点？</li></ol><small>中国家电为主 / 全球公司作对照<br>资料核验截至 2026年11月7日<br>研究学习手册 / 数据源与权限逐项注明</small></div></header><div class="ap-search-panel" hidden><label for="ap-search">在手册中查找公司、技术、指标或问题<input id="ap-search" type="search" placeholder="例如：三花、热泵、渠道库存、SCOP、现金流"></label><div id="ap-search-results" role="status" hidden></div></div><div class="ap-layout">'''+nav+'<div class="ap-main">'+''.join(body)+'''<footer class="ap-footer"><a href="atlas.html?sw=801110">返回家用电器研究总览 ↗</a><p>一份好的研究结论应能重建证据与假设，并在新证据出现时更新。手册中的公司用于学习商业模式与研究方法。</p></footer></div></div></main></body></html>'''

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    data=json.loads((ROOT/'assets/appliances-research.json').read_text());result=build(data)+'\n';path=ROOT/'appliances.html'
    if args.check:
        assert path.read_text()==result,'appliances.html differs from reviewed source data; rebuild with scripts/build_appliances.py'
        print('PASS appliance handbook static build matches source')
    else:
        path.write_text(result);print('Built',path,len(result),'characters')
