"""Regenerate the offline menu from the same data as the interactive guide."""
import csv
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def export():
    text = (ROOT / 'assets/chinese-menu-data.js').read_text()
    data = json.loads(text.split('window.MenuRiskData = ', 1)[1].rstrip().removesuffix(';'))
    categories = {item['id']: item['name'] for item in data['categories']}
    output = io.StringIO(newline='')
    writer = csv.writer(output, lineterminator='\n')
    writer.writerow(['菜品', '适用场景', '分类', '预制风险（定性判断，非门店查实）', '风险判断对象', '风险判断理由', '判断依据类型', '供餐路径', '到店询问', '商品例证URL', '官网公开产品数据URL'])
    for item in data['dishes']:
        refs = [data['sources'][key] for key in item['refs']]
        writer.writerow([
            item['name'], item['ja'], categories[item['category']],
            data['riskLevels'][item['risk']['level']]['name'],
            item['risk']['target'], item['risk']['reason'],
            '同类厂商商品例证 + 工序推断' if refs else '工序与供餐逻辑推断（无直接商品例证）',
            data['focus'][item['focus']]['name'], item['ask'],
            ' '.join(source['url'] for source in refs),
            ' '.join(source['dataUrl'] for source in refs if source.get('dataUrl')),
        ])
    target = ROOT / 'assets/chinese-menu-risk.csv'
    target.write_bytes(b'\xef\xbb\xbf' + output.getvalue().encode('utf-8'))
    print(f'Exported {len(data["dishes"])} menu entries to {target.name}')


if __name__ == '__main__':
    export()
