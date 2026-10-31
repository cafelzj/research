"""Build an embedded and standalone reader from one maintained, static guide.

Only the allowlisted aggregate audit summary is public. This builder never reads
or publishes the private workbook/catalog. Use --check in CI to prevent drift.
"""
import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BEGIN = '<!-- BEGIN INDICATOR GUIDE -->'
END = '<!-- END INDICATOR GUIDE -->'


def esc(value):
    return html.escape(str(value), quote=True)


def table(headers, rows, label):
    head = ''.join(f'<th scope="col">{esc(v)}</th>' for v in headers)
    body = ''.join('<tr>' + ''.join(f'<th scope="row">{esc(v)}</th>' if i == 0 else f'<td>{esc(v)}</td>' for i, v in enumerate(row)) + '</tr>' for row in rows)
    return f'<div class="guide-table-wrap" tabindex="0" aria-label="{esc(label)}，可横向滚动"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


def render_content(summary):
    allowed={'schema_version','snapshot_version','scope','provenance','totals','reference_counts','entity_counts','quality_candidates','notes'}
    if set(summary) != allowed:
        raise ValueError('Public audit summary must contain aggregate fields only; never copy private catalog/issue records')
    if not re.fullmatch(r'[0-9a-f]{64}',summary['provenance']['source_sha256']):
        raise ValueError('Invalid workbook provenance hash')
    total = summary['totals']
    refs, entities = total['references'], total['entities']
    for value in total.values():
        if not isinstance(value, (int, bool)) or value < 0:
            raise ValueError('Audit totals must be nonnegative integer counts')
    if summary['schema_version'] != 1 or total['has_observations']:
        raise ValueError('Expected the metadata-only audit summary v1')
    for key in ['industry', 'frequency', 'health']:
        if sum(summary['reference_counts'][key].values()) != refs:
            raise ValueError(f'Reference {key} counts do not reconcile')
    for key in ['frequency', 'health']:
        if sum(summary['entity_counts'][key].values()) != entities:
            raise ValueError(f'Entity {key} counts do not reconcile')
    if len(summary['reference_counts']['industry']) != total['industries']:
        raise ValueError('Industry count does not reconcile')
    cards = [(refs, '条行业引用', '排除标题和示例'), (entities, '个指标实体', '同代码同属性跨行业归并'), (total['industries'], '个原行业标签', '原标签与研究角色并列保留'), (total['derived_candidates'], '条派生关系候选', '未验证公式与因果')]
    replacements = {'audit_cards': '<div class="guide-audit-cards">' + ''.join(f'<div><strong>{n:,}</strong><span>{esc(label)}</span><small>{esc(note)}</small></div>' for n,label,note in cards) + '</div>'}
    industries = sorted(summary['reference_counts']['industry'].items(), key=lambda p: (-p[1], p[0]))
    replacements['industry_bars'] = '<ul class="guide-bars">' + ''.join(f'<li><span>{esc(name)}</span><div class="guide-bar-track"><span style="width:{count / refs * 100:.2f}%"></span></div><b>{count:,}<small>{count / refs * 100:.1f}%</small></b></li>' for name,count in industries[:6]) + '</ul>'
    replacements['industry_table'] = table(['原行业标签', '引用行数', '占全部引用'], [(name, f'{n:,}', f'{n / refs * 100:.2f}%') for name,n in industries], '原行业引用分布')
    r, e = summary['reference_counts'], summary['entity_counts']
    rows = [(name, f"{r['health'][name]:,}", f"{e['health'][name]:,}", note) for name,note in [('正常','原始标签，未核验最近更新时间'),('停更','历史研究可能仍可使用，按需筛选'),('预警','原表提示，不是本程序计算的数值离群')]]
    rows += [('单位未填', f"{r['missing_unit']:,}", f"{e['missing_unit']:,}", '不猜单位；计算前核对定义'), ('健康未填', f"{r['missing_health']:,}", f"{e['health']['未填']:,}", '未知状态保持未知')]
    replacements['audit_quality_table'] = table(['目录状态', '原始引用行', '去重后实体', '应该如何理解'], rows, '引用行与实体质量统计对照')
    provenance = summary['provenance']
    replacements.update(source_file=esc(provenance['source_file']), source_sheet=esc(provenance['sheet']), source_hash=esc(provenance['source_sha256']), snapshot_version=esc(summary['snapshot_version']))
    content = (ROOT/'docs/indicator-guide-content.html').read_text()
    for key,value in replacements.items():
        content = content.replace('{{' + key + '}}', value)
    if re.search(r'{{.*?}}', content):
        raise ValueError('Unresolved guide placeholders')
    content = re.sub(r'(<section class="guide-chapter"[^>]*)(>)', r'\1 tabindex="-1"\2', content)
    return content


def outputs():
    summary = json.loads((ROOT/'assets/indicator-audit-summary.json').read_text())
    content = render_content(summary)
    page = ROOT/'indicators.html'
    s = page.read_text()
    embedded = BEGIN + '\n<section id="view-guide" class="workspace-view indicator-guide" hidden>\n' + content + '\n</section>\n' + END
    if BEGIN in s:
        start,end = s.index(BEGIN),s.index(END)+len(END)
        s = s[:start] + embedded + s[end:]
    else:
        s = s.replace('</main>', embedded+'\n</main>',1)
    standalone = re.sub(r'href="(#view=[^"]*)"', r'href="indicators.html\1"', content)
    standalone = standalone.replace('href="#catalog-manager"','href="indicators.html#catalog-manager"')
    shell = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>指标研究手册 · 知研集</title><meta name="description" content="62,241条指标引用的审计结论、多维分类、精确搜索、关联证据与数据处理方法。"><link rel="stylesheet" href="assets/site.css"><link rel="stylesheet" href="assets/indicators.css"><link rel="stylesheet" href="assets/indicator-guide.css"><link rel="stylesheet" href="assets/outline.css"><script defer src="assets/outline.js"></script><script defer src="assets/indicator-guide.js"></script></head><body class="indicator-guide-page"><a class="skip" href="#guide-overview">跳到研究手册正文</a><header class="site-header"><a class="site-brand" href="index.html">知研集<small>IDEAS / EVIDENCE / RESEARCH</small></a><nav class="site-nav" aria-label="网站主导航"><a href="atlas.html">产业链总览</a><a href="index.html">行业看板</a><a href="intelli.html" aria-current="page">IntelliUI <small>BETA</small></a><a href="daily.html">日常研究</a></nav></header><main><nav class="section-tabs" aria-label="IntelliUI 子栏目"><a href="intelli.html">智能工作区</a><a href="indicators.html" aria-current="location">指标研究台</a><a href="data.html">数据明细</a><a href="studio.html">图表制作</a></nav><nav class="guide-breadcrumb" aria-label="当前位置"><a href="indicators.html">指标研究台</a><span aria-hidden="true">/</span><span aria-current="page">研究手册</span></nav><h1 class="guide-page-title">指标研究手册</h1><div class="indicator-guide">
'''
    shell += standalone + '\n</div></main><footer>知研集 · 审计口径、关系证据和工具用法可随时查阅。</footer></body></html>\n'
    return {page:s, ROOT/'indicator-guide.html':shell}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    for path,body in outputs().items():
        if args.check:
            if not path.is_file() or path.read_text()!=body:
                raise SystemExit(f'Generated guide is out of date: {path.name}; run python3 scripts/build_indicator_guide.py')
        else:
            path.write_text(body)
    print('PASS shared indicator guide: aggregate counts reconcile; embedded and standalone pages '+('match source' if args.check else 'generated'))


if __name__=='__main__':
    main()
