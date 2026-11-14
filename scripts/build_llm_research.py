"""Build the static model research reader from its curated, tracked sources."""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import hashlib
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'llm'
AS_OF = '2026-11-14'
PAGES = [
    ('index', '研究地图', '从版本变化，理解计算与记忆'),
    ('timeline', '模型时间线', '发布了什么，何时真正可用'),
    ('models', '厂商与模型', '把每次升级放回自己的技术路线'),
    ('attention', '注意力与 KV', '历史怎样保存，又怎样被读取'),
    ('compute', '计算与条件记忆', '把读入、计算和查表分开理解'),
    ('depth', '层间信息流', '信息怎样穿过越来越深的网络'),
    ('multimodal', '多模态', '图像、声音怎样进入理解与生成'),
    ('decoding', '生成与解码', '草稿、验收与数值精度怎样配合'),
    ('glossary', '术语词典', '把专业词接回机制与研究场景'),
    ('methods', '研究方法与证据', '从模型宣传走到可验证的判断'),
]


def esc(value):
    return html.escape(str(value), quote=True)


def inline(value):
    saved = []
    def save(markup):
        saved.append(markup)
        return '\x00'+str(len(saved)-1)+'\x00'
    value = re.sub(r'`([^`]+)`', lambda m: save('<code>'+esc(m[1])+'</code>'), value)
    value = re.sub(r'\[([^\]]+)\]\((https?://(?:[^\s()]|\([^)]*\))+)\)', lambda m: save('<a href="'+esc(m[2])+'" target="_blank" rel="noopener noreferrer">'+esc(m[1])+' ↗</a>'), value)
    value = re.sub(r'\\\((.+?)\\\)', lambda m: save('<span class="inline-math">'+esc(m[0])+'</span>'), value)
    value = esc(value)
    value = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', value)
    return re.sub(r'\x00(\d+)\x00', lambda m: saved[int(m[1])], value)


def plain(value):
    value = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', value)
    return re.sub(r'[`*#]', '', value).strip()


def cells(line):
    out, current, code, escaped = [], '', False, False
    for ch in line.strip().strip('|'):
        if ch == '`' and not escaped:
            code = not code
        if ch == '|' and not code and not escaped:
            out.append(current.strip()); current = ''
        else:
            current += ch
        escaped = ch == '\\' and not escaped
    return out+[current.strip()]


def diagram(source):
    labels = {}
    for match in re.finditer(r'([A-Za-z][\w-]*)\s*\[([^\]]+)\]', source):
        labels[match[1]] = match[2].strip('"').replace('\\n', ' ')
    stripped = re.sub(r'([A-Za-z][\w-]*)\s*\[[^\]]+\]', r'\1', source)
    edges = re.findall(r'([A-Za-z][\w-]*)\s*(?:-->|==>|-\.->)\s*([A-Za-z][\w-]*)', stripped)
    if not edges:
        return '<details class="diagram-description"><summary>结构关系与技术表示</summary><pre class="code-block">'+esc(source)+'</pre></details>'
    items = ''.join('<li><span>'+esc(labels.get(a,a))+'</span><span aria-label="流向"> → </span><span>'+esc(labels.get(b,b))+'</span></li>' for a,b in edges)
    return '<details class="diagram-description"><summary>查看结构连接（文字版）</summary><ul class="flow-edges">'+items+'</ul></details>'


class Renderer:
    def __init__(self, prefix):
        self.prefix, self.serial = prefix, 0
        self.aliases = set()

    def render(self, text):
        lines, out, i = text.strip().splitlines(), [], 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1; continue
            if line.startswith('```'):
                language, body = line[3:].strip(), []
                i += 1
                while i < len(lines) and not lines[i].strip().startswith('```'):
                    body.append(lines[i]); i += 1
                i += 1
                source = '\n'.join(body)
                out.append(diagram(source) if language == 'mermaid' else '<pre class="code-block"><code>'+esc(source)+'</code></pre>')
                continue
            if line in ('\\[', '$$'):
                end = '\\]' if line == '\\[' else '$$'
                body = []; i += 1
                while i < len(lines) and lines[i].strip() != end:
                    body.append(lines[i]); i += 1
                i += 1
                out.append('<div class="math-display">'+esc('\\['+'\n'.join(body)+'\\]')+'</div>')
                continue
            if line.startswith('|') and i+1 < len(lines) and re.fullmatch(r'[\s|:\-]+', lines[i+1]):
                headers, rows = cells(line), []; i += 2
                while i < len(lines) and lines[i].strip().startswith('|'):
                    row = cells(lines[i]); i += 1
                    if len(row) != len(headers):
                        raise ValueError(('Unequal columns', self.prefix, row))
                    rows.append(row)
                long = any(len(plain(c)) > 130 for row in rows for c in row)
                if long:
                    out.append('<div class="evidence-rows">')
                    for row in rows:
                        self.serial += 1
                        alias = ''
                        if self.prefix == 'vendor-global':
                            for token, slug in [('GPT','openai'),('Claude','claude'),('Gemini','gemini')]:
                                if token in row[1] and slug not in self.aliases:
                                    self.aliases.add(slug); alias += '<span id="vendor-'+slug+'"></span>'
                        out.append('<article class="evidence-row">'+alias+'<h4>'+inline(row[0])+' · '+inline(row[1])+'</h4><dl>'+''.join('<dt>'+inline(h)+'</dt><dd>'+inline(c)+'</dd>' for h,c in zip(headers[2:],row[2:]))+'</dl></article>')
                    out.append('</div>')
                else:
                    out.append('<div class="table-wrap"><table><thead><tr>'+''.join('<th scope="col">'+inline(h)+'</th>' for h in headers)+'</tr></thead><tbody>')
                    for row in rows:
                        alias = ''
                        if self.prefix == 'vendor-global' and len(row)>1:
                            for token, slug in [('GPT','openai'),('Claude','claude'),('Gemini','gemini')]:
                                if token in row[1] and slug not in self.aliases:
                                    self.aliases.add(slug); alias += '<span id="vendor-'+slug+'"></span>'
                        out.append('<tr>'+''.join(('<th scope="row">' if j == 0 else '<td>')+(alias if j==0 else '')+inline(c)+('</th>' if j == 0 else '</td>') for j,c in enumerate(row))+'</tr>')
                    out.append('</tbody></table></div>')
                continue
            heading = re.match(r'^(#{1,6}) (.+)$', line)
            if heading:
                self.serial += 1
                level = min(6, max(3,len(heading[1])+1))
                anchor = self.prefix+'-part-'+str(self.serial)
                if self.prefix == 'vendor-other-china':
                    for token, slug in [('MiniMax','minimax'),('Seed','seed'),('阶跃','step'),('百度','ernie'),('腾讯','hy'),('小米','mimo'),('讯飞','iflytek'),('inclusionAI','inclusionai')]:
                        if token in heading[2] and slug not in self.aliases:
                            self.aliases.add(slug); anchor = 'vendor-'+slug
                display_title = re.sub(r'^\d+(?:\.\d+)*[.、]?\s*', '', heading[2])
                out.append(f'<h{level} id="{anchor}">'+inline(display_title)+f'</h{level}>')
                i += 1; continue
            if re.match(r'^(?:[-*]|\d+\.) ', line):
                tag = 'ol' if re.match(r'^\d+\.',line) else 'ul'
                entries = []
                while i < len(lines):
                    match = re.match(r'^(?:[-*]|\d+\.) (.+)$',lines[i].strip())
                    if not match: break
                    alias = ''
                    if self.prefix == 'vendor-global':
                        for token,slug in [('Mistral','mistral'),('Grok','grok'),('Meta','meta')]:
                            if match[1].startswith(token) and slug not in self.aliases:
                                self.aliases.add(slug); alias=' id="vendor-'+slug+'"'
                    entries.append('<li'+alias+'>'+inline(match[1])+'</li>'); i += 1
                out.append('<'+tag+'>'+''.join(entries)+'</'+tag+'>'); continue
            if line.startswith('> '):
                out.append('<blockquote>'+inline(line[2:])+'</blockquote>'); i += 1; continue
            if re.fullmatch(r'[-*_]{3,}',line):
                out.append('<hr>'); i += 1; continue
            paragraph = [line]; i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r'^(?:#|\||```|[-*] |\d+\. |>|\\\[|\$\$)',lines[i].strip()):
                paragraph.append(lines[i].strip()); i += 1
            out.append('<p>'+inline(' '.join(paragraph))+'</p>')
        return '\n'.join(out)


def read(name):
    text = (SITE/'content'/f'{name}.md').read_text()
    return re.sub(r'^# [^\n]+\n', '', text).strip()


def parts(name):
    text = read(name)
    pieces = re.split(r'(?m)^(?=## )',text)
    return pieces


def part_select(name, start, end=None):
    groups = parts(name)
    selected = []
    active = start is None
    for group in groups:
        title = group.splitlines()[0] if group else ''
        if start and start in title: active = True
        if active and end and end in title: break
        if active: selected.append(group)
    return '\n'.join(selected)


LABS = {
    'attention': ('历史保存与读取的五种方式','切换机制，再逐步观察：哪些位置被读取，哪些表示仍然保存。','固定状态格、位置和权重均为教学简化；QSA 保留原 K/V，CSA 在真实模型中还结合局部等分支。'),
    'kv': ('算一笔 KV 容量账','改变长度、层数或并发，观察标准 GQA 缓存的字节量。','只计算所列 GQA 配置的 K/V；不包括权重、工作区、元数据、复制和其他状态，不能直接套给 MLA 或线性层。'),
    'ced': ('把长输入与逐 token 生成分开','观察输入经过哪些层，尾部为什么仍需处理，以及生成时使用哪些部分。','采用 V4.1 公开结构作流程简化；图示不模拟时延，有限重放存在近似，生产缓存调度未完整公开。'),
    'moe': ('路由、专家计算与合并','切换 token 特征，观察被选专家、共享专家和保留的权重。','8 个路由专家选 2 个，加 1 个共享专家，是教学配置；不对应 K3 等真实模型规模或职业分工。'),
    'engram': ('同一片段，查表后仍要看上下文','跟随 token 地址、主存表、门控和融合，区分查表与推理。','哈希槽与门值是教学例；表中是训练向量，不是答案库或用户会话记忆，也不自动更新现实事实。'),
    'residual': ('在深度方向选择与传递信息','比较标准残差、AttnRes、mHC 与 GR，观察各自的读写方式。','向量投影和门值为教学参数。双随机约束不自动保证全网络无损；多残差流不是多个 Agent。'),
    'multimodal': ('从画面与声音走到理解、发声','逐步观察编码、投影、共享骨干与输出路径。','统一表示可以包含专用编码器；早融合描述训练组织，看到视频或调用工具不等于本体原生生成视频。'),
    'speculative': ('草稿被拒绝之后，为什么要丢弃后续','切换接受情景，观察连续前缀、拒绝、纠正和下一轮。','确定性教学轨迹，不是模型实测。保持目标分布需要正确验收、纠正与采样条件，计数不代表速度倍数。'),
}


def lab(name):
    title, lead, caveat = LABS[name]
    return '<div class="lab-panel"><div class="lab-heading"><span class="llm-kicker">逐步图解 · 教学示意</span><h3>'+esc(title)+'</h3><p>'+esc(lead)+'</p></div><div class="architecture-lab" data-lab="'+name+'" id="lab-'+name+'"><noscript><p>逐步动画需要 JavaScript；下方正文、公式和文字结构关系仍可阅读。</p></noscript></div><details class="lab-boundary"><summary>图示的简化与适用范围</summary><p>'+esc(caveat)+'</p></details></div>'


def section(anchor, title, markdown='', labs=(), prefix=None):
    body = Renderer(prefix or anchor).render(markdown) if markdown else ''
    return '<section class="research-section" id="'+anchor+'" data-outline="'+esc(title)+'"><h2>'+esc(title)+'</h2>'+''.join(lab(x) for x in labs)+body+'</section>'


def shell(key, lead, sections, chapter_links):
    _, label, title = next(p for p in PAGES if p[0] == key)
    nav = ''.join('<a href="'+p+'.html"'+(' aria-current="page"' if key == p else '')+'>'+esc(name)+'</a>' for p,name,_ in PAGES)
    chapters = '<nav class="chapter-links" aria-label="本页章节">'+''.join('<a href="#'+anchor+'">'+esc(name)+'</a>' for anchor,name in chapter_links)+'</nav>' if chapter_links else ''
    pos = [p[0] for p in PAGES].index(key)
    next_page = PAGES[(pos+1)%len(PAGES)]
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="description" content="'+esc(lead)+'"><title>'+esc(label)+' · 大模型演进研究 · 知研集</title><link rel="stylesheet" href="../assets/site.css"><link rel="stylesheet" href="assets/research.css"><link rel="stylesheet" href="assets/vendor/katex/katex.min.css"><script defer src="assets/vendor/katex/katex.min.js"></script><script defer src="assets/vendor/katex/auto-render.min.js"></script><script type="module" src="assets/research.js"></script></head><body class="llm-page" data-page="'+key+'"><a class="skip-link" href="#main-content">跳到研究正文</a><header class="site-header"><a class="site-brand" href="../atlas.html">知研集<small>IDEAS / EVIDENCE / RESEARCH</small></a><nav class="site-nav" aria-label="网站主导航"><a href="../atlas.html">行业研究</a><a href="../daily.html" aria-current="page">日常研究</a></nav></header><div class="llm-layout"><aside class="llm-sidebar"><details class="llm-navigation" open><summary>大模型研究目录</summary><a class="llm-series" href="index.html">大模型演进研究</a><nav class="llm-nav" aria-label="大模型研究章节">'+nav+'</nav><p class="sidebar-note">资料核验截至<br><b>2026.11.14</b><br>事实、厂商自报、研究推断与教学示意分别说明。</p><a class="sidebar-return" href="../daily.html">← 返回日常研究</a></details></aside><main class="llm-main" id="main-content"><div class="topic-breadcrumb"><a href="../daily.html">日常研究</a><span>/</span><a href="index.html">大模型演进研究</a><span>/</span><span>'+esc(label)+'</span></div><header class="llm-hero"><span class="llm-kicker">MODELS / ARCHITECTURE / EVIDENCE</span><h1>'+esc(title)+'</h1><p class="llm-lead">'+esc(lead)+'</p><p class="llm-meta">2026-01-01—'+AS_OF+' · 官方公告、论文、模型卡与实现 · 动画为教学示意</p></header>'+chapters+'<article class="research-article">'+sections+'</article><nav class="related-reading" aria-label="继续阅读"><a href="index.html">回到研究地图</a><a href="'+next_page[0]+'.html">继续：'+next_page[1]+' →</a></nav><footer class="llm-footer">知研集 · 日常研究 / 大模型演进<br>正文、术语与已加载图解可离线阅读；外部来源需要网络。未接入模型推理或付费调用。</footer></main></div></body></html>\n'


class TermLinker(HTMLParser):
    def __init__(self, terms):
        super().__init__(convert_charrefs=False)
        self.out, self.stack, self.used, self.lookup = [], [], set(), {}
        for term in terms:
            for name in [term['term'],term.get('english',''),*term.get('aliases',[])]:
                if name and len(name) > 1:
                    self.lookup.setdefault(name,term['id'])
        self.pattern = re.compile('|'.join(re.escape(x) for x in sorted(self.lookup,key=len,reverse=True))) if self.lookup else None
    def handle_starttag(self,tag,attrs):
        self.out.append(self.get_starttag_text())
        if tag not in ('br','hr','img','input','meta','link','wbr'):
            inherited = self.stack[-1][1] if self.stack else False
            d=dict(attrs)
            skip=inherited or tag in ('a','code','pre','script','style','h1','h2','h3','h4','h5','h6','button','select','textarea','label') or 'math' in d.get('class','') or 'data-lab' in d
            self.stack.append((tag,skip))
    def handle_startendtag(self,tag,attrs): self.out.append(self.get_starttag_text())
    def handle_endtag(self,tag):
        self.out.append('</'+tag+'>')
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag:
                del self.stack[i:]; break
    def handle_entityref(self,name): self.out.append('&'+name+';')
    def handle_charref(self,name): self.out.append('&#'+name+';')
    def handle_data(self,data):
        if not self.pattern or (self.stack and self.stack[-1][1]):
            self.out.append(data); return
        def replace(m):
            word=m[0]; tid=self.lookup[word]
            if tid in self.used: return word
            left=data[m.start()-1] if m.start()>0 else ''
            right=data[m.end()] if m.end()<len(data) else ''
            if word.isascii() and ((left.isascii() and (left.isalnum() or left=='_')) or (right.isascii() and (right.isalnum() or right=='_'))): return word
            self.used.add(tid)
            return '<a class="term-link" href="glossary.html#'+tid+'" aria-label="术语：'+esc(word)+'">'+word+'</a>'
        self.out.append(self.pattern.sub(replace,data))


def timeline_page(data):
    vendors=sorted({e['vendor'] for e in data['events']})
    types=sorted({e['type'] for e in data['events']})
    controls='<div class="research-filters"><label>搜索型号、机制或日期<input type="search" id="timeline-query" placeholder="例如：KDA、后训练、V4.1"></label><label>厂商<select id="timeline-vendor"><option value="">全部厂商</option>'+''.join('<option>'+esc(v)+'</option>' for v in vendors)+'</select></label><label>事件类型<select id="timeline-type"><option value="">全部类型</option>'+''.join('<option>'+esc(v)+'</option>' for v in types)+'</select></label></div><p id="timeline-count" role="status">共 '+str(len(data['events']))+' 条日期记录</p><p class="filter-empty" id="timeline-empty" hidden>没有匹配项，请调整关键词或筛选。</p><p><a href="assets/timeline.csv" download>下载完整时间线 CSV ↓</a> · 分组日期保留在记录中，不把论文或 API 再上架重复统计成新底座。</p>'
    groups={}
    for e in sorted(data['events'],key=lambda x:x['date'],reverse=True): groups.setdefault(e['date'][:7],[]).append(e)
    body=[controls,'<div id="timeline-list">']
    for month, events in groups.items():
        body.append('<section class="timeline-month"><h2>'+esc(month)+'</h2>')
        for e in events:
            search=plain(' '.join(str(e.get(k,'')) for k in ('vendor','model','dateLabel','mechanism','caveat'))).lower()
            sources=' · '.join('<a href="'+esc(s['url'])+'" target="_blank" rel="noopener noreferrer">'+esc(s['title'])+' ↗</a>' for s in e['sources'])
            intro=plain(e['mechanism'])
            teaser=intro[:130]+('…' if len(intro)>130 else '')
            body.append('<article class="timeline-event" data-timeline-event data-vendor="'+esc(e['vendor'])+'" data-type="'+esc(e['type'])+'" data-search="'+esc(search)+'" id="'+e['id']+'"><header><span class="event-date">'+esc(e['dateLabel'])+'</span><span class="event-kind">'+esc(e['vendor'])+' / '+esc(e['type'])+'</span><h3>'+esc(e['model'])+'</h3></header><p>'+esc(teaser)+'</p><details><summary>展开机制、解读与核验边界</summary><div class="event-body"><h4>变化与研究解读</h4><p>'+inline(e['mechanism'])+'</p><h4>核验边界</h4><p>'+inline(e['caveat'])+'</p><p class="event-sources">'+sources+'</p><a href="'+esc(e['detailHref'])+'">阅读厂商完整综述 →</a></div></details><a class="event-permalink" href="#'+e['id']+'" aria-label="定位'+esc(e['model'])+'">#</a></article>')
        body.append('</section>')
    body.append('</div>')
    return ''.join(body)


def glossary_page(data):
    terms=data['terms']; cats=sorted({t['category'] for t in terms})
    out=['<div class="research-filters"><label>搜索中文、英文或缩写<input id="term-query" type="search" placeholder="例如：KV、条件记忆、TTFT"></label><label>研究环节<select id="term-category"><option value="">全部环节</option>'+''.join('<option>'+esc(c)+'</option>' for c in cats)+'</select></label></div><p id="term-count" role="status">共 '+str(len(terms))+' 个术语</p><p id="term-empty" class="filter-empty" hidden>没有匹配术语，请换一个关键词或分类。</p><div id="term-list">']
    by_id={t['id']:t for t in terms}
    for t in terms:
        links=' · '.join('<a href="'+esc(l['href'])+'">'+esc(l['label'])+' →</a>' for l in t['links'])
        related='、'.join('<a href="#'+esc(x)+'">'+esc(by_id[x]['term'])+'</a>' for x in t['related'])
        sources=' · '.join('<a href="'+esc(s['url'])+'" target="_blank" rel="noopener noreferrer">'+esc(s['title'])+' ↗</a>' for s in t['sources'])
        out.append('<article class="term-entry" data-term data-category="'+esc(t['category'])+'" data-search="'+esc(' '.join([t['term'],t['english'],*t['aliases'],t['plain'],t['mechanism']]).lower())+'" id="'+esc(t['id'])+'"><header><span class="term-category">'+esc(t['category'])+'</span><h2>'+esc(t['term'])+'</h2><p class="term-english">'+esc(t['english'])+'</p><p class="term-aliases">'+esc(' / '.join(t['aliases']))+'</p></header><p class="term-definition">'+esc(t['plain'])+'</p><dl><dt>怎样工作</dt><dd>'+inline(t['mechanism'])+'</dd><dt>研究场景</dt><dd>'+inline(t['example'])+'</dd><dt>容易误读</dt><dd>'+inline(t['misconception'])+'</dd></dl><p>'+links+'</p><p class="term-related">相关：'+related+'</p><p class="term-sources">'+sources+'</p></article>')
    return ''.join(out)+'</div>'


def build():
    data=json.loads((SITE/'assets/timeline.json').read_text())
    glossary=json.loads((SITE/'assets/glossary.json').read_text())
    pages={}
    intro='围绕 2026 年主要模型发布，把型号、技术机制、资源代价与研究方法连接起来。先看图解，再按来源深入；不把演示当实测。'
    topic_cards=[('timeline','按日期核对发布','公告、API、权重、论文与系统升级分型，保留渠道差异。'),('models','沿厂商路线深入','Kimi、GLM、Qwen、DeepSeek及其他主要模型的完整解读。'),('attention','看懂历史怎样被使用','全注意力、GDN/KDA、QSA、CSA与索引复用。'),('compute','拆开计算、容量与查表','CED、MoE、Engram，逐步观察各自保存和执行什么。'),('depth','研究信息的深度方向','AttnRes、mHC与门控残差，区别于前文token注意力。'),('multimodal','从页面与声音理解模型','编码器、早融合、Thinker–Talker与OCR阅读顺序。'),('decoding','跟随一次生成与验收','MTP、投机解码、DSpark与量化的收益和条件。'),('glossary','遇到术语就回到机制','通俗解释、精确机制、误读、例子和关联章节。')]
    roadmap='<div class="concept-map" aria-label="学习关系"><span>型号与日期</span><span aria-hidden="true">→</span><span>机制与动画</span><span aria-hidden="true">→</span><span>资源与代价</span><span aria-hidden="true">→</span><span>证据与验证</span></div><div class="reading-path"><h2>选择一条学习路径</h2><ol><li><b>从零建立结构：</b><a href="attention.html#attention-basics">Q/K/V与缓存</a> → <a href="compute.html#moe">计算与专家</a> → <a href="depth.html#residual-basics">层间信息流</a>。</li><li><b>跟踪模型演进：</b><a href="timeline.html">按日期核实事件</a> → <a href="models.html">读完整厂商综述</a> → <a href="methods.html#evaluation">检查评测可比性</a>。</li><li><b>接回行业研究：</b><a href="compute.html#conditional-memory">存储与互联变化</a> → <a href="methods.html#industry">GPU产业链假设与反证</a> → <a href="../gpu-memory/index.html">GPU研究地图</a>。</li></ol></div><div class="topic-grid">'+''.join('<a class="topic-card" href="'+k+'.html"><span>'+str(i+1).zfill(2)+'</span><h2>'+esc(t)+'</h2><p>'+esc(d)+'</p><b>进入研究 →</b></a>' for i,(k,t,d) in enumerate(topic_cards))+'</div>'
    boundary='本专题覆盖 2026-01-01 至 11-14 的主要发布，时间线包含 '+str(len(data['events']))+' 条分型记录。原始模型综述、架构机制、公式、反证、来源与未核事项完整保留。厂商跑分和效率倍数按原条件说明，本轮未自行复跑模型或采集真实账单。\n\n动画是可操作的教学简化，默认暂停；每幅图都写明与实际模型的差别。公开论文的参考代码与商业部署内核不必相同。GDN、KDA、MoE 等有更早的研究沿革，2026 年采用不等于当年首创。'
    pages['index']=shell('index',intro,roadmap+section('scope','先固定证据边界',boundary+'\n\n入门来源：[Kimi 研究目录](https://www.kimi.ai/blog/)、[GLM 研究目录](https://www.zhipuai.cn/zh/research)、[Qwen 官方系列](https://github.com/QwenLM/Qwen3.8)、[DeepSeek 官方发布日志](https://api-docs.deepseek.com/updates/)。'),[('scope','范围与证据')])
    pages['timeline']=shell('timeline','把型号发布、预览、API升级、论文和系统服务分别记录。完整日期类型与适用范围保留在每条记录中；仅核到月时不补日期，月记录放在该月日记录之后。',timeline_page(data),[])
    model_sections=[]
    model_names=[('kimi','Kimi / Moonshot'),('glm','GLM / 智谱'),('qwen','Qwen / 通义'),('deepseek','DeepSeek'),('other-china','其他中国主要厂商'),('global','海外模型对照')]
    for key,title in model_names:
        model_sections.append(section('vendor-'+key,title,read(key),prefix='vendor-'+key))
    pages['models']=shell('models','每家模型按自己的技术路线组织：参数与架构、后训练、模态、工具、服务、许可和退役分别解释。保留事实、厂商自报与研究推断之间的界线。',''.join(model_sections),[('vendor-'+k,t) for k,t in model_names])
    attention=[('attention-basics','先理解 Q/K/V、缓存与计算阶段',part_select('arch-attention',None,'## 2.'),()),('linear-attention','从固定状态到 GDN 与 KDA',part_select('arch-attention','## 2.','## 7.'),('attention',)),('sparse-compressed','QSA：目录压缩、原始内容精读',part_select('arch-attention','## 7.','## 10.'),()),('index-reuse','索引复用与 KV 复用分别省什么',read('arch-index'),()),('kv-budget','缓存容量、复杂度与研究验证',part_select('arch-attention','## 10.'),('kv',))]
    pages['attention']=shell('attention','把历史的保存方式、读取范围与每次读取的成本分开。先操作图解，再读公式、实际配置、代码与反例。',''.join(section(a,t,m,l) for a,t,m,l in attention),[(a,t) for a,t,_,_ in attention])
    compute=[('ced','CED：长输入与逐 token 生成的不同路径',read('arch-deepseek'),('ced',)),('moe','MoE：选择计算与权重驻留',part_select('arch-memory',None,'## 4.'),('moe',)),('conditional-memory','Engram 与 n-gram：增加查表容量',part_select('arch-memory','## 4.'),('engram',))]
    pages['compute']=shell('compute','读得多、写得少的任务怎样节省计算？少量激活为什么仍要存放大量权重？条件记忆怎样把部分压力转向主存和互联？',''.join(section(a,t,m,l) for a,t,m,l in compute),[(a,t) for a,t,_,_ in compute])
    depth=[('residual-basics','三个坐标轴与标准残差',part_select('arch-depth',None,'## 2.'),('residual',)),('attnres','AttnRes：选择历史层或块的表示',part_select('arch-depth','## 2.','## 3.'),()),('mhc','mHC：多路残差与受约束混合',part_select('arch-depth','## 3.','## 4.'),()),('gated-residual','GR：逐通道读取与门控写回',part_select('arch-depth','## 4.','## 5.'),()),('latent-moe','LatentMoE、对照与技术沿革',part_select('arch-depth','## 5.'),())]
    pages['depth']=shell('depth','层间信息流处理深度方向的问题：历史层怎样被选择，多条表示怎样交流，怎样控制额外带宽与训练稳定性。',''.join(section(a,t,m,l) for a,t,m,l in depth),[(a,t) for a,t,_,_ in depth])
    multimodal=[('multimodal-paths','输入部件、训练融合与输出模态',part_select('arch-modal-decode',None,'## 4.'),('multimodal',)),('thinker-talker','Thinker–Talker：流式理解与发声',part_select('arch-modal-decode','## 4.','## 5.'),()),('ocr','OCR2：视觉表示与阅读顺序',part_select('arch-modal-decode','## 5.','## 6.'),())]
    pages['multimodal']=shell('multimodal','“原生多模态”没有一个可替代所有结构细节的统一定义。沿输入、训练和输出三条轴，理解图像、声音、视频和文档。',''.join(section(a,t,m,l) for a,t,m,l in multimodal),[(a,t) for a,t,_,_ in multimodal])
    quant='量化改变权重、激活或缓存采用的数值格式；QAT 在训练中适应量化误差。要分别记录位宽、缩放元数据、异常值处理、内核与硬件支持，不能把 4-bit 理想裸字节量当作真实部署总显存。\n\nKimi K3.1 公开 MXFP4 权重 / MXFP8 激活；V4.1 的 FP4 KV 则作用于缓存，属于不同对象。参考代码中的量化后反量化模拟，也不能直接验证生产内核的存储和速度。[K3.1 模型卡](https://huggingface.co/moonshotai/Kimi-K3.1-Pro)、[V4.1 数值与部署说明](https://arxiv.org/html/2609.19969v1#S2.SS4)\n\nMuon 是训练优化器，Slime 是强化学习基础设施，历史思考保留是上下文协议，Swarm 是编排形态。它们可以显著改善模型或产品，但应单独说明收益来源。\n\n'+part_select('arch-modal-decode','## 9.')
    decoding=[('mtp','MTP：训练监督与草稿模块',part_select('arch-modal-decode','## 6.','## 7.'),()),('speculative','投机解码、验收与 DSpark',part_select('arch-modal-decode','## 7.','## 9.'),('speculative',)),('quantization','量化、部署与性能验收',quant,())]
    pages['decoding']=shell('decoding','逐步生成怎样利用草稿与批量验算？为什么预测多个 token 不等于同比提速？把接受率、数值精度、负载和质量条件一起看。',''.join(section(a,t,m,l) for a,t,m,l in decoding),[(a,t) for a,t,_,_ in decoding])
    pages['glossary']=shell('glossary','从通俗定义进入精确机制，结合研究场景辨别误读。正文中的点线术语链接可直达这里，再回到相关架构章节。',glossary_page(glossary),[])
    framework=read('research-framework')
    method_groups=[('framework','先把优化分层',framework.split('## 跨厂商比较',1)[0]),('evaluation','评测比较与证据强度',framework.split('## 跨厂商比较',1)[1].split('### 成本应按',1)[0]),('cost','按验收成功任务计算总成本',framework.split('### 成本应按',1)[1].split('## 如何转化',1)[0]),('research-work','把模型评估转为行业研究能力',framework.split('## 如何转化',1)[1].split('## 接回',1)[0]),('industry','GPU、存储与产业链假设',framework.split('## 接回',1)[1].split('## 证据边界',1)[0]),('evidence','资料边界与维护',framework.split('## 证据边界',1)[1])]
    methods=''.join(section(a,t,re.sub(r'^[^\n]+\n','',m)) for a,t,m in method_groups)
    sources={}
    for path in sorted((SITE/'content').glob('*.md')):
        for title,url in re.findall(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',path.read_text()): sources.setdefault(url,title)
    for term in glossary['terms']:
        for source in term['sources']: sources.setdefault(source['url'],source['title'])
    methods+='<section class="research-section" id="source-ledger"><h2>来源索引</h2><p>各条主张的来源在正文就近标注；此索引便于回访论文、模型卡、发布与实现。链接数量不代表独立证据数量。</p><details><summary>展开全部 '+str(len(sources))+' 个来源链接</summary><ul class="sources-ledger">'+''.join('<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(title)+' ↗</a><small>'+esc(url.split('/')[2])+'</small></li>' for url,title in sources.items())+'</ul></details></section>'
    pages['methods']=shell('methods','用固定口径区分宣传、机制、评测与可交付能力。把任务成功率、证据准确性、总成本和瓶颈转移接回行业判断。',methods,[(a,t) for a,t,_ in method_groups]+[('source-ledger','来源索引')])
    for key in pages:
        if key != 'glossary':
            # Annotate the first substantive mention; navigation and code remain quiet.
            page=pages[key]
            start=page.index('<article class="research-article">')
            end=page.index('</article><nav class="related-reading"',start)
            linker=TermLinker(glossary['terms']); linker.feed(page[start:end+10])
            pages[key]=page[:start]+''.join(linker.out)+page[end+10:]
    return {SITE/(key+'.html'):value for key,value in pages.items()}


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--check',action='store_true'); args=parser.parse_args()
    results=build(); stale=[]
    for path,text in results.items():
        if args.check:
            if not path.exists() or path.read_text()!=text: stale.append(str(path.relative_to(ROOT)))
        else: path.write_text(text)
    if stale: raise SystemExit('Stale model research build: '+', '.join(stale))
    print('PASS model research '+('build consistency' if args.check else 'static build')+': '+str(len(results))+' pages')
