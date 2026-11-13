"""Completion candidate author; fixed existing identities, explicit base, no public copy.

Adapted from the preserved priority author; its historical CLI is not executed.
"""
import argparse
import copy
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = None
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
ET.register_namespace('x', NS)
ET.register_namespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
FIELDS = ['id','name','status','assetStatus','priority','episode','canonLevel','description','acceptance',
          'dependencies','plannedPath','assetPath','gameKey','reference','sourceUrl','scope','notes']
WIDTHS = [33,39,15,16,10,11,25,55,62,44,54,48,24,60,64,22,66]
spec = importlib.util.spec_from_file_location('completion_author_native', ROOT/'scripts/verify-eden-immersion-workbook.py')
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)
q = native.q

def digest(data):
    return hashlib.sha256(data).hexdigest()

def display(value):
    return ', '.join(value) if isinstance(value,list) else ('' if value is None else str(value))

def metrics(records):
    return [len(records), *[sum(entry['status']==status for entry in records) for status in ['Défini','Prototype','Intégré','Validé']],
            *[sum(entry['canonLevel']==canon for entry in records) for canon in ['Confirmé','Référence à vérifier','Adaptation']],
            sum(entry['episode']=='ME1' for entry in records),sum(entry['scope']=='Extension future' for entry in records)]

def main():
    global BASE
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ['before','catalog-before','catalog-after','plan','output','report']:
        parser.add_argument('--'+name,required=True)
    args=parser.parse_args()
    assert not Path(args.output).exists() and not Path(args.report).exists(), 'Preserve existing candidate/report files'
    before_cat=json.loads(Path(args.catalog_before).read_text())
    after_cat=json.loads(Path(args.catalog_after).read_text())
    plan=json.loads(Path(args.plan).read_text())
    BASE=plan['baseCommit']
    assert len(BASE)==40 and all(c in '0123456789abcdef' for c in BASE)
    record_count=len(before_cat['entries'])
    assert len(before_cat['entries'])==record_count
    old_ids={entry['id']:entry for entry in before_cat['entries']}
    new_ids={entry['id']:entry for entry in after_cat['entries']}
    assert len(old_ids)==record_count and len(new_ids)==len(after_cat['entries'])
    assert set(old_ids)==set(new_ids) and len(new_ids)==record_count
    assert plan['newIds']==[], 'Priority changes must retain the exact existing records'
    assert before_cat['entries'][0]['id']==after_cat['entries'][0]['id']
    selected=set(plan['changedIds'])
    with zipfile.ZipFile(args.before) as before:
        original={name:before.read(name) for name in before.namelist()}
        sheet_paths=dict(native.sheets(before))
        strings=native.shared_strings(before)
        original_string_count=len(strings)
        sst=ET.fromstring(original['xl/sharedStrings.xml'])
        string_ids={value:index for index,value in enumerate(strings)}
        assert len(strings)==len(sst)
        roots={}
        edits=[]
        heights=[]
        added=[]
        formulas=[]
        caches=[]
        def tree(name):
            part=sheet_paths[name]
            if part not in roots: roots[part]=ET.fromstring(original[part])
            return roots[part]
        def value(cell,text):
            text=display(text)
            for child in list(cell):
                if child.tag in [q('v'),q('is'),q('f')]:cell.remove(child)
            if not text:
                cell.attrib.pop('t',None)
                return
            if text not in string_ids:
                string_ids[text]=len(strings);strings.append(text)
                item=ET.SubElement(sst,q('si'));node=ET.SubElement(item,q('t'))
                if text.strip()!=text:node.set('{http://www.w3.org/XML/1998/namespace}space','preserve')
                node.text=text
            cell.set('t','s');ET.SubElement(cell,q('v')).text=str(string_ids[text])
        dashboard=tree('Dashboard')
        dashboard_cells={cell.get('r'):cell for cell in dashboard.iter(q('c'))}
        def cache(address,old,new,formula_before=None,formula_after=None):
            cell=dashboard_cells[address]
            assert native.cell_value(cell,strings)==old,(address,'stale baseline cache')
            if formula_before is not None:
                node=cell.find(q('f'));assert node is not None and node.text==formula_before,address
                if formula_before!=formula_after:
                    node.text=formula_after;formulas.append({'sheet':'Dashboard','address':address,'before':formula_before,'after':formula_after})
            if old!=new:
                node=cell.find(q('v'))
                if node is None:node=ET.SubElement(cell,q('v'))
                node.text=str(new);caches.append({'sheet':'Dashboard','address':address,'before':old,'after':new})
        all_before=[];all_after=[]
        for index,category in enumerate(before_cat['categories']):
            name=category['sheetName']
            old_records=[entry for entry in before_cat['entries'] if entry['category']==category['id']]
            new_records=[entry for entry in after_cat['entries'] if entry['category']==category['id']]
            assert [entry['id'] for entry in new_records[:len(old_records)]]==[entry['id'] for entry in old_records]
            old_end=len(old_records)+6;new_end=len(new_records)+6
            xml=tree(name)
            data=xml.find(q('sheetData'))
            rows={int(row.get('r')):row for row in data}
            cells={cell.get('r'):cell for cell in xml.iter(q('c'))}
            for offset,entry in enumerate(old_records,7):
                after_entry=new_ids[entry['id']]
                for column,field in enumerate(FIELDS):
                    address=f'{chr(65+column)}{offset}'
                    assert display(native.cell_value(cells.get(address),strings))==display(entry.get(field)),(entry['id'],field,'baseline XLSX/catalogue mismatch')
                    if display(entry.get(field))!=display(after_entry.get(field)):
                        assert entry['id'] in selected and field in plan['expectedFieldsById'][entry['id']]
                        cell=cells.get(address)
                        if cell is None:
                            cell=ET.SubElement(rows[offset],q('c'),{'r':address});cells[address]=cell
                        value(cell,after_entry.get(field))
                        edits.append({'id':entry['id'],'sheet':name,'address':address,'field':field,'before':entry.get(field),'after':after_entry.get(field)})
                if entry['id'] in selected:
                    previous=float(rows[offset].get('ht',15))
                    lines=max(math.ceil(len(display(after_entry.get(field)))/(WIDTHS[column]*.9)) for column,field in enumerate(FIELDS))
                    following=max(previous,lines*13+12)
                    assert following<=409.5,(entry['id'],'text requires a shorter note or wider panel')
                    if following>previous:
                        rows[offset].set('ht',str(following));rows[offset].set('customHeight','1')
                        heights.append({'id':entry['id'],'sheet':name,'row':offset,'before':previous,'after':following})
            for row_number,entry in enumerate(new_records[len(old_records):],old_end+1):
                template=rows[7 if row_number%2 else 8]
                row=copy.deepcopy(template);row.set('r',str(row_number))
                for child in list(row):row.remove(child)
                for column,field in enumerate(FIELDS):
                    old_cell=cells.get(f'{chr(65+column)}{7 if row_number%2 else 8}')
                    attrs={'r':f'{chr(65+column)}{row_number}'}
                    if old_cell is not None and old_cell.get('s') is not None:attrs['s']=old_cell.get('s')
                    cell=ET.SubElement(row,q('c'),attrs);value(cell,entry.get(field))
                lines=max(math.ceil(len(display(entry.get(field)))/(WIDTHS[column]*.9)) for column,field in enumerate(FIELDS))
                height=max(49,lines*13+12);assert height<=409.5
                row.set('ht',str(height));row.set('customHeight','1');data.append(row)
                added.append({'id':entry['id'],'sheet':name,'row':row_number,'height':height,'templateRow':7 if row_number%2 else 8})
            if new_end!=old_end:
                assert category['id']=='sprites'
                for node in xml.iter():
                    if node.tag in [q('conditionalFormatting'),q('dataValidation')]:
                        sqref=node.get('sqref');assert sqref is not None
                        node.set('sqref',sqref.replace(str(old_end),str(new_end)))
                dimension=xml.find(q('dimension'))
                if dimension is not None:dimension.set('ref',f'A1:Q{new_end}')
                matched=[]
                for part,raw in original.items():
                    if part.startswith('xl/tables/') and part.endswith('.xml'):
                        table=ET.fromstring(raw)
                        if table.get('name')=='Catalog_sprites':
                            assert table.get('ref')==f'A6:Q{old_end}'
                            table.set('ref',f'A6:Q{new_end}');table.find(q('autoFilter')).set('ref',f'A6:Q{new_end}');roots[part]=table;matched.append(part)
                assert len(matched)==1
            old_metrics=metrics(old_records);new_metrics=metrics(new_records)
            all_before.append(old_metrics);all_after.append(new_metrics)
            escaped=name.replace("'","''")
            def ref(column,end):return f"'{escaped}'!${column}$7:${column}${end}"
            def row_formulas(end):return [f"COUNTA({ref('A',end)})",*[f'COUNTIFS({ref("C",end)},"{status}")' for status in ['Défini','Prototype','Intégré','Validé']],*[f'COUNTIFS({ref("G",end)},"{canon}")' for canon in ['Confirmé','Référence à vérifier','Adaptation']],f'COUNTIFS({ref("F",end)},"ME1")',f'COUNTIFS({ref("P",end)},"Extension future")']
            old_formulas=row_formulas(old_end);new_formulas=row_formulas(new_end)
            for column in range(10):cache(f'{chr(66+column)}{10+index}',old_metrics[column],new_metrics[column],old_formulas[column],new_formulas[column])
        totals_before=[sum(row[column] for row in all_before) for column in range(10)]
        totals_after=[sum(row[column] for row in all_after) for column in range(10)]
        for column in range(10):cache(f'{chr(66+column)}37',totals_before[column],totals_after[column])
        for address,old,new in [('B5',totals_before[0],totals_after[0]),('E5',sum(totals_before[3:5]),sum(totals_after[3:5])),('H5',totals_before[6],totals_after[6]),('K5',totals_before[4],totals_after[4])]:cache(address,old,new)
        # Retain all historical shared-string positions and append only new text.
        references=0
        for _,part in native.sheets(before):
            xml=roots.get(part) if part in roots else ET.fromstring(original[part])
            references+=sum(cell.get('t')=='s' for cell in xml.iter(q('c')))
        sst.set('count',str(references));sst.set('uniqueCount',str(len(strings)));roots['xl/sharedStrings.xml']=sst
        patched={part:ET.tostring(xml,encoding='utf-8',xml_declaration=True) for part,xml in roots.items()}
        # A logically untouched XML part is kept byte-for-byte, not reserialized.
        for part in list(patched):
            if ET.tostring(ET.fromstring(original[part]))==ET.tostring(roots[part]):patched.pop(part)
        output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(output,'w') as after:
            for item in before.infolist():after.writestr(item,patched.get(item.filename,original[item.filename]))
    report={'passed':True,'baseCommit':BASE,'sourceWorkbook':str(Path(args.before).resolve()),'workbookPath':str(output.resolve()),
      'sourceSHA256':digest(Path(args.before).read_bytes()),'outputSHA256':digest(output.read_bytes()),'cellChanges':edits,'rowHeightChanges':heights,'appendedRows':added,
      'formulaChanges':formulas,'formulaCacheChanges':caches,'patchedZipMembers':list(patched),'sharedStringsBefore':original_string_count,
      'sharedStringsAfter':len(strings),'scope':'Scoped OpenXML authoring. Historical cells/styles/ZIP parts require the separate independent native verifier before publication.'}
    Path(args.report).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'passed':True,'changedCells':len(edits),'appendedRows':len(added),'formulaChanges':len(formulas),'cachedCounts':len(caches),'patchedParts':len(patched)}))

if __name__=='__main__':main()
