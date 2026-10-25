"""Export the same research content used by atlas.html to a readable Markdown file."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
raw = (ROOT / 'assets/chemical-applications-data.js').read_text()
data = json.loads(raw.removeprefix('window.ChemicalResearch = ').rstrip().removesuffix(';'))
lines = ['# 六大化工产业链研究手册', '', '整理日期：' + data['date'], '', '技术用途参考厂商资料；跨材料比较与盈利分析为教学归纳。具体牌号、标准、认证、政策须按目标应用复核。来源缺口在相应产品条目中注明。没有实时行情或未经核验的市场份额。', '']
for c in data['chapters']:
    lines += ['## ' + c['name'], '', c['question'], '', c['intro'], '', '### 产业链与工艺', '', c['route'], '']
    for p in c['process']:
        lines += ['#### ' + p['name'], '', p['how'], '', p['tradeoff'], '']
    for p in c['products']:
        lines += ['### ' + p['name'], '', p['mechanism'], '']
        for key,label in [('application','典型应用'),('advantage','核心优势'),('alternative','替代比较'),('metrics','性能指标'),('boundary','使用与研究边界')]:
            lines += [f'**{label}**：{p[key]}', '']
        lines += ['相关技术资料：' + '；'.join(f"[{data['sources'][s]['title']}]({data['sources'][s]['url']})" for s in p['refs'].split(',')), '']
    lines += ['### 客户选材推演（教学情景）', '', c['case'], '', '### 研究指标', '']
    for m in c['metrics']:
        lines += ['#### ' + m['name'], '', m['meaning'], '', m['signal'], '', '误区：' + m['trap'], '']
    lines += ['### 成本与竞争', '', c['economics'], '', '### 周期复盘方法', '', c['cycle'], '', '### 术语', '']
    for g in c['glossary']: lines += [f"**{g['term']}**：{g['definition']}", '']
lines += ['## 来源索引', '']
for sid,s in data['sources'].items():lines += [f"- [{s['title']}]({s['url']}) · {s['kind']} · 阅读 {s['read']}"]
(ROOT/'assets/chemical-research-handbook.md').write_text('\n'.join(lines)+'\n')
print('Exported handbook:', len('\n'.join(lines)), 'characters')
