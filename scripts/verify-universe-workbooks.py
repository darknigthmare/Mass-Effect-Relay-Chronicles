"""Read-only verification of exported XLSX files against the production catalogues."""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'docs/universe/catalogs'
OUTPUT = ROOT / 'docs/universe/outputs/relay-chronicles-20261022'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'p': 'http://schemas.openxmlformats.org/package/2006/relationships'}
CATEGORIES = ['characters','npcs','lore','worlds','zones','links','scenery','props','enemies',
              'main_quests','side_quests','choices','dialogues','cinematics','weapons','equipment',
              'powers','ally_moves','enemy_moves','animations','sprites','vfx','audio','systems','qa','continuity']
NATURES = ['Établi','À vérifier','Extrapolation','Coupé attesté','Concept abandonné','Allégation écartée']

def values(sheet, strings):
    out = {}
    for cell in sheet.findall('.//s:sheetData/s:row/s:c',NS):
        t=cell.get('t');v=cell.find('s:v',NS)
        if t=='inlineStr':out[cell.get('r')]=''.join(cell.itertext())
        elif t=='s':out[cell.get('r')]=strings[int(v.text)] if v is not None else ''
        elif v is not None:out[cell.get('r')]=v.text or ''
    return out

def check(book):
    file=OUTPUT/book['filename']
    assert file.is_file(),f'Missing workbook {file}'
    with ZipFile(file) as z:
        assert z.testzip() is None,'Corrupted ZIP entry'
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            strings=[''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS)]
        wb=ET.fromstring(z.read('xl/workbook.xml'))
        rels={r.get('Id'):r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets=[]
        for s in wb.findall('s:sheets/s:sheet',NS):
            target=rels[s.get('{'+NS['r']+'}id')]
            location=target.lstrip('/') if target.startswith('/') else 'xl/'+target
            sh=ET.fromstring(z.read(location))
            sheets.append((s.get('name'),sh,values(sh,strings)))
        assert len(sheets)==28,f'Wrong sheet count {book["id"]}'
        assert sheets[0][0]=='Dashboard' and sheets[-1][0]=='Guide'
        dash=sheets[0][2]
        assert int(float(dash['B37']))==len(book['entries']),'Dashboard total differs from JSON'
        assert int(float(dash['C37']))==len(book['entries']),'Status total differs from JSON'
        assert all(int(float(dash[f'{c}37']))==0 for c in 'DEF'),'Unproved implementation status'
        for col,nature in zip('GHIJKL',NATURES):
            expected=sum(e['nature']==nature for e in book['entries'])
            assert int(float(dash[f'{col}37']))==expected,f'Nature count mismatch {nature}'
        assert int(float(dash['M37']))==sum(e['priority']=='P0' for e in book['entries'])
        formula_count=0;table_count=0;record_count=0
        for i,(name,sh,vals) in enumerate(sheets):
            errors=[c.get('r') for c in sh.findall('.//s:c',NS) if c.get('t')=='e']
            assert not errors,f'Formula errors {book["id"]} {name}: {errors}'
            formula_count+=len(sh.findall('.//s:f',NS))
            table_count+=len(sh.findall('.//s:tablePart',NS))
            if 0<i<27:
                cat=CATEGORIES[i-1]
                records=[e for e in book['entries'] if e['category']==cat]
                for j,e in enumerate(records,7):
                    assert vals.get(f'A{j}')==e['id'],f'ID missing or reordered {e["id"]}'
                    assert vals.get(f'B{j}')==e['name'],f'Name changed {e["id"]}'
                    assert vals.get(f'C{j}')==e['status'],f'Status changed {e["id"]}'
                    assert vals.get(f'D{j}')==e['nature'],f'Nature changed {e["id"]}'
                    assert vals.get(f'E{j}')==e['priority'],f'Priority changed {e["id"]}'
                    assert vals.get(f'O{j}','')==', '.join(e.get('dependencies',[])),f'Dependencies changed {e["id"]}'
                    assert vals.get(f'Q{j}','')==', '.join(e.get('sourceIds',[])),f'Source IDs changed {e["id"]}'
                    source_map={source['id']:source['url'] for source in book['sources']}
                    urls='\n'.join(source_map[s] for s in e.get('sourceIds',[]) if source_map[s])
                    assert vals.get(f'R{j}','')==urls,f'Source URLs changed {e["id"]}'
                    for c,k in [('F','description'),('G','adaptation'),('H','gameplay'),('I','visual'),('J','animation'),('K','audio'),('L','implementation'),('M','conditions'),('N','acceptance'),('P','reference'),('S','notes')]:
                        assert vals.get(f'{c}{j}','')==str(e.get(k,'') or ''),f'Text mismatch {e["id"]} {k}'
                    record_count+=1
                if records:
                    assert len(sh.findall('.//s:tablePart',NS))==1
                    assert len(sh.findall('.//s:dataValidation',NS))>=3
                assert sh.find('.//s:pane',NS) is not None,f'Missing frozen header {name}'
        assert record_count==len(book['entries'])
        for part in z.namelist():
            if part.startswith('xl/tables/') and part.endswith('.xml'):
                table=ET.fromstring(z.read(part))
                assert ':S' in table.get('ref'),f'Sources and notes excluded from sortable table: {part}'
                assert len(table.findall('s:tableColumns/s:tableColumn',NS))==19
        assert formula_count>=328,f'Missing summary formulas: {formula_count}'
        return {'id':book['id'],'title':book['title'],'file':book['filename'],
                'records':record_count,'sheets':len(sheets),'tables':table_count,
                'formulas':formula_count,'formulaErrors':0,'exactTextMatch':True,
                'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--ids');args=p.parse_args()
    ids=set(args.ids.split(',')) if args.ids else None
    books=[json.loads(f.read_text()) for f in sorted(DATA.glob('*.json'))]
    reports=[check(b) for b in books if ids is None or b['id'] in ids]
    result={'date':'2026-10-22','scope':'Classeur et données uniquement. Les critères QA du jeu ne sont pas exécutés par ce contrôle.',
            'workbooks':len(reports),'records':sum(r['records'] for r in reports),
            'sheets':sum(r['sheets'] for r in reports),'results':reports}
    if ids is None:
        (ROOT/'docs/universe/qa/verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False,indent=2))
