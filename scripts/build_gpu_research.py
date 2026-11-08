"""Build the GPU research entry points, shared navigation and search index.

Existing technical essays remain editable in their HTML pages; the sections
between IA markers and the three entry pages are generated from reviewed data.
"""
import argparse
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'gpu-memory'
MAIN=[('models.html','01','型号与代际','有哪些产品，哪些参数可以比较？'),
      ('gpu.html','02','内部架构','数据怎样进入，计算单元怎样协作？'),
      ('bottlenecks.html','03','技术难点','性能、成本与交付卡在哪里？'),
      ('ecosystem.html','04','产业链','谁交付什么，瓶颈怎样向下游传导？'),
      ('timeline.html','05','时间线','什么时间、以什么阶段发生了变化？')]
DEEP=[('memory.html','显存与内存'),('packaging.html','先进封装'),('trends.html','前沿技术路线')]
TOOLS=[('glossary.html','技术词典'),('dialogues.html','研究问题索引'),('sources.html','资料与核验')]
META={
 'index.html':('GPU研究地图','从型号出发，把结构、瓶颈、产业分工与技术演进串成一条研究路径。','RESEARCH MAP'),
 'models.html':('GPU型号与代际','先分用途和产品形态，再比较架构、显存、带宽、功率与交付阶段。','01 / MODELS & GENERATIONS'),
 'gpu.html':('GPU内部架构','先分清裸片、封装、模组、节点与机柜，再沿数据路径理解计算。具体单元以 NVIDIA H200 / Hopper 为例。','02 / ARCHITECTURE'),
 'bottlenecks.html':('GPU技术难点','从任务表现定位约束，连接技术机制、验证指标、解决代价与产业环节。','03 / BOTTLENECKS'),
 'ecosystem.html':('GPU产业链','沿设计、制造、存储、封装测试与系统交付，观察每一环节的投入、产出和限制。','04 / INDUSTRY CHAIN'),
 'timeline.html':('产品与技术时间线','沿时间观察 GPU 产品、显存、标准和软件的演进；发布、送样、量产与最终交付分别判断。','05 / TIMELINE'),
 'memory.html':('显存、内存与存储墙','技术深读：为型号表里的容量与带宽找到物理解释，并理解 HBM、GDDR 与分层存储的取舍。','TECHNOLOGY / MEMORY'),
 'packaging.html':('先进封装与制造难点','技术深读：区分 HBM 堆叠与 GPU 系统封装，理解互连、供电、热、翘曲、良率与测试。','TECHNOLOGY / PACKAGING'),
 'trends.html':('前沿技术路线','技术深读：按各自解决的问题理解新路线，并检查标准、样品、平台支持与商业交付之间的距离。','TECHNOLOGY / FRONTIERS'),
 'glossary.html':('GPU与显存技术词典','查缩写、英文全称和技术含义；遇到厂商专有概念时，回到对应架构理解。','REFERENCE / GLOSSARY'),
 'dialogues.html':('GPU研究问题索引','从具体问题找到对应的型号、结构、难点、产业链与时间线章节。','REFERENCE / QUESTIONS'),
 'sources.html':('资料来源与核验','型号资料核验至2026年11月8日；其余专题按来源记录的时点理解。厂商规格、教学模型与研究推断分别阅读。','REFERENCE / EVIDENCE')}

def e(v):
    if isinstance(v,list):v=' / '.join(str(x) for x in v)
    return html.escape(str(v),quote=True)
def ps(values):
    if isinstance(values,str):values=[values]
    return ''.join('<p>'+e(x)+'</p>' for x in values)
def ul(values):return '<ul>'+''.join('<li>'+e(x)+'</li>' for x in values)+'</ul>'
def links(values):return '<div class="ia-links">'+''.join('<a href="'+e(x.get('url',x.get('href','')))+'">'+e(x['label'])+' →</a>' for x in values)+'</div>'
def table(cols,rows,caption):return '<div class="data-table-wrap"><table class="data-table"><caption>'+e(caption)+'</caption><thead><tr>'+''.join('<th scope="col">'+e(x)+'</th>' for x in cols)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(('<th scope="row">' if i==0 else '<td>')+e(x)+('</th>' if i==0 else '</td>') for i,x in enumerate(row))+'</tr>' for row in rows)+'</tbody></table></div>'
def block(name,body):return '<!-- IA:'+name+' -->'+body+'<!-- /IA:'+name+' -->'
def strip_block(body,name):return re.sub(r'<!-- IA:'+name+r' -->.*?<!-- /IA:'+name+r' -->','',body,flags=re.S)
def source_refs(ids,sources):return '<div class="ia-refs">依据：'+''.join('<a href="sources.html#ia-source-'+e(key)+'">'+e(sources[key]['title'])+'</a>' for key in ids)+'</div>'
def section(key,title,body):return '<section class="section" id="'+e(key)+'"><h2>'+e(title)+'</h2>'+body+'</section>'

def shell(page,body):
    title,lead,kicker=META[page]
    parent={'memory.html':'bottlenecks.html','packaging.html':'bottlenecks.html','trends.html':'timeline.html'}.get(page,page)
    top=''.join('<a href="'+p+'"'+(' class="active"' if p==parent else '')+'>'+label+'</a>' for p,n,label,q in MAIN)
    groups=[('研究主线',[('index.html','研究首页')]+[(p,n+' · '+label) for p,n,label,q in MAIN]),('技术深读',DEEP),('查阅工具',TOOLS)]
    aside=''.join('<div class="group">'+name+'</div>'+''.join('<a class="side-link'+(' active' if p==page else '')+'" href="'+p+'"'+(' aria-current="page"' if p==page else '')+'>'+label+'</a>' for p,label in rows) for name,rows in groups)
    aside+='<div class="side-hint"><strong>从一个型号开始</strong><br>先锁定用途与形态，再看架构、技术难点、产业分工和时间变化。<br><br><a href="sources.html">来源与状态怎么读 →</a></div>'
    breadcrumb='<div class="ia-breadcrumb"><a href="../daily.html">日常研究</a> / <a href="index.html">GPU研究</a>'+(' / '+e(title) if page!='index.html' else '')+'</div>'
    related=[]
    if page in [p for p,n,l,q in MAIN]:
        i=[p for p,n,l,q in MAIN].index(page)
        if i:related.append({'label':'上一主线：'+MAIN[i-1][2],'url':MAIN[i-1][0]})
        if i<len(MAIN)-1:related.append({'label':'下一主线：'+MAIN[i+1][2],'url':MAIN[i+1][0]})
    elif page!='index.html':related=[{'label':'返回'+META[parent][0],'url':parent}] if parent!=page else [{'label':'回到研究地图','url':'index.html'}]
    ending=block('related','<nav class="ia-reading-next" aria-label="继续研究">'+links(related)+'</nav>') if related else ''
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="description" content="'+e(lead)+'"><title>'+e(title)+' · GPU研究</title><link rel="stylesheet" href="assets/style.css"><link rel="stylesheet" href="assets/organization.css"></head><body><header class="site-header"><nav class="research-return" aria-label="返回知研集"><a href="../daily.html">← 知研集 · 日常研究</a><span class="gpu-site-nav"><a href="../atlas.html">行业研究</a><a href="../daily.html" aria-current="page">日常研究</a></span></nav><div class="header-inner"><button class="mobile-toggle" id="mobile-toggle" aria-label="打开研究目录" aria-expanded="false" aria-controls="sidebar">☰</button><a href="index.html" class="brand"><span class="brand-icon">G</span><span><span class="brand-name">GPU & MEMORY ATLAS</span><span class="brand-sub">型号、架构与产业研究</span></span></a><nav class="top-nav" aria-label="GPU研究主线">'+top+'</nav><button class="search-trigger" id="search-trigger" aria-label="检索GPU全部研究页面">⌕ 检索 <span class="micro">⌘K</span></button></div></header><div class="layout"><aside class="sidebar" id="sidebar" aria-label="GPU研究目录">'+aside+'</aside><main class="content">'+breadcrumb+body+ending+'<footer class="footer-site"><span>GPU & MEMORY ATLAS · 研究与学习</span><span>示意图非工程图纸 · <a href="sources.html">资料、时点与证据范围</a></span></footer></main></div><div class="search-modal" id="search-modal" role="dialog" aria-label="GPU专题检索"><div class="search-box"><input type="search" id="global-search" placeholder="搜索型号、架构、瓶颈、公司或技术…" aria-label="检索GPU全部章节"><div class="search-results" id="search-results"></div><p class="micro" style="padding:0 21px 12px">按 Esc 关闭 · 覆盖五条研究主线与技术深读</p></div></div><script src="assets/search_index.js"></script><script src="assets/research-data.js"></script><script src="assets/app.js"></script><script src="assets/research.js"></script></body></html>\n'

def heading(page,toc=''):
    title,lead,kicker=META[page]
    return '<header class="page-head"><div class="eyebrow">'+kicker+'</div><h1>'+title+'</h1><p class="lead">'+lead+'</p>'+toc+'</header>'

def home():
    hero='<header class="hero ia-hero"><div class="eyebrow">GPU RESEARCH / START WITH A PRODUCT</div><h1>从GPU型号出发，<br>读懂架构与产业链。</h1><p>先确定研究对象，再解释性能、成本与交付；用同一条主线连接技术和产业证据。</p><div class="hero-actions"><a class="btn btn-primary" href="models.html">先看型号与代际 →</a><a class="btn btn-outline" href="gpu.html">从内部架构开始</a></div></header>'
    cards='<div class="ia-main-grid">'+''.join('<a class="ia-main-card" href="'+p+'"><small>'+n+'</small><h3>'+label+'</h3><p>'+q+'</p><span>进入研究 →</span></a>' for p,n,label,q in MAIN)+'</div>'
    example=section('paths','以H200为例，怎样串起一次研究？','<p>从 H100 到 H200，计算架构仍属 Hopper，而显存系统发生变化。先核对具体形态和规格，再问变化能解决什么任务，最后检查产业交付与实际应用。</p><ol class="ia-case-path">'+''.join('<li><b>'+t+'</b><p>'+d+'</p><a href="'+u+'">'+l+' →</a></li>' for t,d,l,u in [('锁定型号','比较 H100 SXM 与 H200 SXM，确认容量、带宽和版本。','型号比较','models.html#model-h200'),('拆开结构','区分计算裸片、HBM、封装、模组与服务器。','H200架构解剖','gpu.html#anatomy'),('定位难点','容量装不下、带宽不足、计算或通信等待，需要不同证据。','技术瓶颈诊断','bottlenecks.html'),('连接产业','把变化映射到 HBM、封装、测试和系统集成，而非直接推断受益份额。','产业交付链','ecosystem.html#chain'),('核对时间','分清产品公布、厂商供货、系统部署与性能实测。','产品时间线','timeline.html#timelines')])+'</ol>')
    deep=section('chapters','遇到具体概念，再进入技术深读','<div class="ia-deep-grid">'+''.join('<a class="card" href="'+p+'"><h3>'+t+'</h3><p>'+d+'</p><span>查阅专题 →</span></a>' for p,t,d in [('memory.html','显存与内存','HBM、GDDR、缓存和容量/带宽取舍。'),('packaging.html','先进封装','HBM堆叠、CoWoS、供电、散热与良率。'),('trends.html','前沿技术路线','分层存储、PIM、混合键合等方案及验证条件。')])+'</div>')
    graph=section('network','技术关系图：按需定位概念','<details class="ia-network"><summary>展开计算、显存、封装与互连的关系图</summary><div class="graph-layout"><div id="knowledge-graph" class="graph-canvas"></div><div id="graph-detail" class="graph-info"><h3>请选择节点</h3><p>点击概念查看职责和对应章节。</p></div></div><p class="micro">图谱用于辅助查阅；它是概念联系，不是芯片真实物理版图。</p></details>')
    checks=section('study-progress','用问题检验学习进展','<div class="panel"><div class="columns-2">'+''.join('<label class="checkline"><input type="checkbox" data-learning-check="'+k+'"> '+t+'</label>' for k,t in [('memory','能解释显存容量与带宽分别约束什么'),('compute','能沿数据路径解释GPU内部的分工'),('h200','能区分芯片、封装、模组与系统'),('package','能把封装工艺连接到良率和交付'),('barrier','能为性能瓶颈提出验证指标'),('timeline','能区分发布、送样和商业交付'),('future','能说出前沿路线的必要条件与代价'),('industry','能解释供应环节的投入、产出与约束')])+'</div><p class="micro">勾选仅保存在当前浏览器。</p></div>')
    return hero+section('research-main','五条研究主线',cards)+example+deep+graph+checks

def models(data,sources):
    d=data['models'];rows=d['models']
    filters='<div class="ia-model-filter" id="model-filters" hidden><label>查找型号、架构或用途<input id="model-query" type="search" placeholder="例如 H200、Blackwell、AMD"></label><label>厂商<select id="model-vendor"><option value="">全部厂商</option>'+''.join('<option>'+e(x)+'</option>' for x in sorted({m['vendor'] for m in rows}))+'</select></label><label>用途<select id="model-segment"><option value="">全部用途</option>'+''.join('<option>'+e(x)+'</option>' for x in sorted({m['segment'] for m in rows}))+'</select></label><button type="button" id="model-reset">清空筛选</button><p id="model-count" role="status"></p></div>'
    cards=[]
    for m in rows:
        facts=table(['字段','当前比较口径'],[[k,m[v]] for k,v in [('架构','architecture'),('形态 / 设备层次','form'),('显存类型','memoryType'),('容量','capacity'),('显存带宽','bandwidth'),('功率','power'),('阶段 / 所引时点','stage')]],m['name']+' · 规格与边界')
        details='<details><summary>研究这款产品：变化、用途与比较边界</summary><h4>变化在哪里</h4>'+ps(m['whatChanged'])+'<h4>为什么值得研究</h4>'+ps(m['whyItMatters'])+'<div class="callout warn">'+e(m['comparisonCaveat'])+'</div>'+source_refs(m['sourceIds'],sources)+links([{'label':'用架构解释参数','url':'gpu.html'},{'label':'判断任务瓶颈','url':'bottlenecks.html'},{'label':'查产品事件','url':'timeline.html#timelines'}])+'</details>'
        cards.append('<article class="ia-model-card" id="model-'+e(m['id'])+'" data-model-vendor="'+e(m['vendor'])+'" data-model-segment="'+e(m['segment'])+'"><span class="tag">'+e(m['segment'])+'</span><h3>'+e(m['name'])+'</h3><p class="micro">'+e(m['vendor'])+' · '+e(m['architecture'])+' · '+e(m['stageDate'])+'</p>'+facts+details+'</article>')
    overview=table(['产品 / 形态','架构','显存','容量','带宽','功率','阶段'],[[m['name']+' / '+m['form'],m['architecture'],m['memoryType'],m['capacity'],m['bandwidth'],m['power'],m['stage']] for m in rows],'型号规格总览：按单GPU / 指定模组阅读，系统参数须另核')
    comparisons=''.join(section('compare-'+str(c.get('id',i)),c['title'],ps(c['paragraphs'])+table(c['columns'],c['rows'],c['title'])+links([{'label':next(m['name'] for m in rows if m['id']==mid),'url':'#model-'+mid} for mid in c['modelIds']])) for i,c in enumerate(d['comparisons']))
    guide=''.join('<article class="panel"><h3>'+e(g['question'])+'</h3>'+ps(g['how'])+links(g['links'])+'</article>' for g in d['readingGuide'])
    family=''.join('<div><h3>'+e(f['name'])+'</h3>'+ps(f['explanation'])+'</div>' for f in d['families'])
    return heading('models.html','<div class="toc"><a href="#model-families">先分用途</a><a href="#model-cards">查型号</a><a href="#model-table">规格总览</a><a href="#model-comparisons">代际比较</a></div>')+'<p class="ia-date">型号资料核验：'+e(d['asOf'])+'；产品阶段按所引来源时点理解。</p><details class="ia-brief" id="model-families"><summary>比较之前：用途、产品形态与参数口径</summary>'+ps(d['intro'])+'<div class="ia-deep-grid">'+family+'</div></details>'+section('model-cards','按型号进入研究',filters+'<div class="ia-model-grid">'+''.join(cards)+'</div>')+section('model-table','按字段比较规格',overview)+'<div id="model-comparisons">'+comparisons+'</div>'+section('model-reading','怎样把规格变成研究判断',guide)

def bottlenecks(data,sources):
    d=data['bottlenecks'];items=[]
    for b in d['items']:
        routes=table(['解决路径','可能改善什么','代价 / 新约束'],[[r['route'],r['gain'],r['cost']] for r in b['approaches']],b['title']+' · 技术取舍')
        items.append(section(b['id'],b['title'],'<p class="ia-question">'+e(b['question'])+'</p>'+ps(b['mechanism'])+'<div class="columns-2"><div><h3>任务中会看见什么</h3>'+ul(b['symptoms'])+'</div><div><h3>用什么指标验证</h3>'+ul(b['metrics'])+'</div></div>'+routes+'<h3>哪些产品与产业环节相关</h3>'+ps(b['appliesTo'])+ps(b['chainLink'])+'<div class="callout"><strong>下一步验证：</strong>'+e(b['verify'])+'</div>'+links(b['links'])+source_refs(b['sourceIds'],sources)))
    scenarios=''.join('<article class="panel"><h3>'+e(x['title'])+'</h3>'+ul(x['observations'])+ps(x['reasoning'])+'<h4>先做什么检查</h4>'+ul(x['firstChecks'])+links(x['links'])+'</article>' for x in d['scenarios'])
    nav='<div class="ia-bottleneck-grid">'+''.join('<a href="#'+b['id']+'"><b>'+e(b['title'])+'</b><span>'+e(b['question'])+'</span></a>' for b in d['items'])+'</div>'
    return heading('bottlenecks.html')+ps(d['intro'])+section('bottleneck-map','从约束定位问题',nav)+''.join(items)+section('workloads','把难点放回工作负载', '<p class="micro">以下是定性教学场景，不是某型号的性能测试。</p>'+scenarios)

def context_arch(d):
    steps='<ol class="ia-architecture-flow">'+''.join('<li><h3>'+e(x['title'])+'</h3>'+ps(x['what'])+links([x['link']])+'</li>' for x in d['steps'])+'</ol>'
    vocab=table(['通用职责','NVIDIA语境','AMD语境','比较边界'],[[x['generic'],x['nvidia'],x['amd'],x['boundary']] for x in d['vocabulary']],'职责可对照，单元数量与组织不可直接等同')
    return section('architecture-map',d['title'],ps(d['intro'])+steps+vocab+links(d['researchLinks'])+direct_sources(d['sourceLinks']))
def direct_sources(rows):return '<div class="ia-refs">'+''.join('<p><a target="_blank" rel="noopener noreferrer" href="'+e(x['url'])+'">'+e(x['title'])+' ↗</a>：'+e(x['scope'])+'</p>' for x in rows)+'</div>'
def context_industry(d):
    return section('chain','1. '+d['title'],ps(d['intro'])+table(['环节','投入 → 交付物','角色示例','观察什么 / 边界'],[[x['role'],x['input']+' → '+x['output'],x['players'],x['watch']+' '+x['boundary']] for x in d['stages']],'GPU产业链：环节与有效交付')+links(d['researchLinks'])+direct_sources(d['sourceLinks']))

def existing_body(page,data,sources):
    raw=(SITE/page).read_text()
    body=re.search(r'<main class="content">(.*?)<footer class="footer-site">',raw,re.S).group(1)
    for name in ['breadcrumb','related','architecture','sources']:body=strip_block(body,name)
    body=re.sub(r'^<div class="ia-breadcrumb">.*?</div>','',body,flags=re.S)
    if page=='gpu.html':body=strip_block(body,'architecture');body=body.replace('<section class="section" id="anatomy">',block('architecture',context_arch(data['context']['architecture']))+'<section class="section" id="anatomy">',1)
    if page=='ecosystem.html':body=re.sub(r'<section class="section" id="chain">.*?</section>',context_industry(data['context']['industry']),body,count=1,flags=re.S)
    if page=='timeline.html':
        body=re.sub(r'<section class="section" id="product-compare">.*?</section>',section('product-compare','横向查型号，纵向看时间','<p>比较容量、带宽和产品形态，先进入型号页；在这里观察事件顺序与阶段变化。</p>'+links([{'label':'型号、规格与代际比较','url':'models.html#model-table'},{'label':'可筛选事件时间线','url':'#timelines'},{'label':'前沿路线及验证条件','url':'trends.html'}])),body,count=1,flags=re.S)
        body=body.replace('2. 点击筛选每项真实里程碑','1. 按厂商、类型与年份观察事件').replace('3. 2026 年的典型案例：Rubin 规格为什么会出现两个版本？','2. 读事件，也要读规格版本').replace('4. 接下来要关注哪些验证节点？','3. 接下来要关注哪些验证节点？')
        rubin=section('rubin','2. 读事件，也要读规格版本','<p>2026年11月8日核验时，NVIDIA 架构正文与 HGX 单GPU表给出最高22 TB/s，Vera Rubin NVL72页的单GPU表给出19.2 TB/s。两种当前官方表述并存，差异原因未核实，不能仅按页面先后推断为已经确认的降规格。</p>'+table(['当前官方来源','所述单GPU显存带宽','阅读边界'],[['架构正文 / HGX 产品表','最高22 TB/s','以对应架构与平台表为准'],['Vera Rubin NVL72 产品表','19.2 TB/s','区分单GPU、Superchip与72GPU机柜']],'Rubin：官方页面的规格版本差异')+'<div class="callout">平台量产声明、产品页供货状态、具体OEM系统交付和应用实测是不同证据。型号页保留这些阶段与来源范围。</div>'+links([{'label':'Rubin型号与当前阶段','url':'models.html#model-rubin'}])+source_refs(['model-rubin-architecture','model-hgx','model-rubin-nvl72','model-rubin-production'],sources))
        body=re.sub(r'<section class="section" id="rubin">.*?</section>',rubin,body,count=1,flags=re.S)
    if page=='dialogues.html':body=body.replace('按提问顺序追溯知识脉络','从问题进入对应研究章节').replace('这份对话索引是学习用的主题级整理，不是逐字聊天转录。为了避免技术资料过时，产品参数、日期和商业成熟度优先以网站中的最新核验记录为准。','查型号先确认用途和产品形态；查技术先明确任务与约束。产品参数、日期和商业成熟度以对应来源记录为准。')
    if page=='sources.html':
        body=re.sub(r'<p>本站依据本次.*?</p>','<p>本站用于学习GPU型号、架构、技术约束与产业分工。厂商公开材料用于核对披露和规格，应用表现还需对应工作负载与实测条件。</p>',body,count=1,flags=re.S)
        entries=''.join('<article class="ia-source" id="ia-source-'+e(s['id'])+'"><span class="tag">'+e(s['status'])+'</span><h3><a href="'+e(s['url'])+'" target="_blank" rel="noopener noreferrer">'+e(s['title'])+' ↗</a></h3>'+ps(s['scope'])+'<p class="micro">资料日期 '+e(s['published'])+' · 核验 '+e(s['accessed'])+'</p></article>' for s in sources.values())
        body+=block('sources',section('research-sources','型号与技术难点的来源记录',entries))
    old_head=re.search(r'<header class="page-head">.*?</header>',body,re.S)
    toc=re.search(r'<div class="toc">.*?</div>',old_head.group(0),re.S) if old_head else None
    body=re.sub(r'<header class="page-head">.*?</header>',heading(page,toc.group(0) if toc else ''),body,count=1,flags=re.S)
    return body.replace('timeline.html#product-compare','models.html#model-table')

class SearchIndex(HTMLParser):
    def __init__(self,page):super().__init__(convert_charrefs=True);self.page=page;self.in_main=False;self.stack=[];self.heading=None;self.title=[];self.text=[];self.anchor='';self.current='';self.rows=[]
    def flush(self):
        if self.current:self.rows.append({'title':self.current,'url':self.page+('#'+self.anchor if self.anchor else ''),'text':' '.join(' '.join(self.text).split())[:2200]})
        self.text=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='main':self.in_main=True
        if not self.in_main:return
        if tag in ('section','article','details'):self.stack.append((tag,attrs.get('id','')))
        if tag in ('h1','h2','h3'):
            self.flush();self.heading=tag;self.title=[];self.anchor=next((key for t,key in reversed(self.stack) if key),'')
    def handle_data(self,value):
        if self.in_main:
            self.text.append(value)
            if self.heading:self.title.append(value)
    def handle_endtag(self,tag):
        if tag==self.heading:self.current=''.join(self.title).strip();self.heading=None
        if tag in ('section','article','details') and self.stack:self.stack.pop()
        if tag=='main':self.flush();self.in_main=False

def build(data):
    sources={s['id']:s for group in ('models','bottlenecks') for s in data[group]['sources']}
    outputs={'index.html':shell('index.html',home()),'models.html':shell('models.html',models(data,sources)),'bottlenecks.html':shell('bottlenecks.html',bottlenecks(data,sources))}
    for page in META:
        if page not in outputs:outputs[page]=shell(page,existing_body(page,data,sources))
    search=[]
    for page,content in outputs.items():p=SearchIndex(page);p.feed(content);search.extend(p.rows)
    outputs['assets/search_index.js']='window.ATLAS_SEARCH = '+json.dumps(search,ensure_ascii=False,separators=(',',':'))+';\n'
    outputs['assets/research-data.js']='window.GPU_RESEARCH_DATA = '+json.dumps({'timelineAdditions':data.get('timelineAdditions',[]),'models':[{'id':m['id'],'name':m['name']} for m in data['models']['models']]},ensure_ascii=False,separators=(',',':'))+';\n'
    return outputs

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    data=json.loads((SITE/'assets/research-map.json').read_text())
    outputs=build(data)
    for name,value in outputs.items():
        path=SITE/name
        if args.check:assert path.read_text()==value,'Rebuild '+name
        else:path.write_text(value)
    print(('PASS static GPU organization matches source: ' if args.check else 'Built GPU research structure: ')+str(len(META))+' pages and research indexes')
