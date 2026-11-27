#!/usr/bin/env python3
"""Serialize the reviewed artifact-tool checkpoint using the unchanged lot12 XLSX package.

All values, formulas, caches and layout are authored/recalculated by artifact-tool.
This bounded fallback only packages that exported model when the WASM exporters stall.
"""
import argparse
from datetime import datetime
import hashlib
import io
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import zipfile

from openpyxl import load_workbook  # Read-back only; all authoring stays in artifact-tool.
from openpyxl.utils import get_column_letter

NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
X = '{' + NS + '}'
ET.register_namespace('x', NS)
BASE = 'c67af65cd469da9cc3eb3748d2497ea50a578fbd'
TEMPLATE = 'docs/armax/lot12/Mass_Effect_Armax_Suivi_Lot12_2026-11-20.xlsx'


def xml(element):
    return ET.tostring(element, encoding='utf-8', xml_declaration=True)


def flag(value):
    return '1' if value else '0'


def replace_child(parent, tag, child):
    old = parent.find(X + tag)
    if old is not None:
        index = list(parent).index(old)
        parent.remove(old)
        parent.insert(index, child)
    else:
        raise AssertionError('Required native template element missing: ' + tag)


def validate_styles(styles, native):
    """Refuse a template whose styles differ from the authored checkpoint."""
    fonts = native.find(X + 'fonts')
    assert len(fonts) == len(styles['fonts'])
    for expected, actual in zip(styles['fonts'], fonts):
        assert actual.find(X+'name').get('val') == expected['typeface']
        assert float(actual.find(X+'sz').get('val')) == expected['fontSize']/100
        assert (actual.find(X+'b') is not None) == bool(expected.get('bold'))
        color = expected.get('fill', {}).get('color', {}).get('value')
        if color:
            assert actual.find(X+'color').get('rgb') == 'FF'+color
    fills = native.find(X+'fills')
    assert len(fills) == len(styles['fills'])
    for expected, actual in zip(styles['fills'], fills):
        pattern = actual.find(X+'patternFill')
        if expected.get('color'):
            assert pattern.get('patternType') == 'solid'
            assert pattern.find(X+'fgColor').get('rgb') == 'FF'+expected['color']['value']
        else:
            assert pattern.get('patternType') == {1:'none',18:'gray125'}[expected['pattern']['patternType']]
    xfs = native.find(X+'cellXfs')
    assert len(xfs) == len(styles['cellXfs'])
    alignment_names = {'verticalAlignment':'vertical','horizontalAlignment':'horizontal','wrapText':'wrapText'}
    for expected, actual in zip(styles['cellXfs'], xfs):
        alignment = actual.find(X+'alignment')
        for key, value in expected.items():
            if key in alignment_names:
                observed = alignment.get(alignment_names[key]) if alignment is not None else None
                if isinstance(value, bool):
                    assert (observed in ('1','true')) == value
                else:
                    assert observed == value
            else:
                observed = actual.get(key)
                assert observed == (flag(value) if isinstance(value, bool) else str(value)), (key, observed, value)
    formats = native.find(X+'numFmts')
    assert [(int(e.get('numFmtId')),e.get('formatCode')) for e in formats] == [(e['id'],e['formatCode']) for e in styles['numberFormats']]
    assert len(native.find(X+'borders')) == len(styles['borders']) == 1
    assert all(not side.attrib for side in native.find(X+'borders')[0])
    dxfs = native.find(X+'dxfs')
    assert len(dxfs) == len(styles['dxfs']) == 2
    for expected, actual in zip(styles['dxfs'], dxfs):
        pattern = actual.find(X+'fill/'+X+'patternFill')
        color = pattern.find(X+'fgColor')
        if color is None:
            color = pattern.find(X+'bgColor')
        assert color.get('rgb') == 'FF'+expected['fill']['color']['value']
        f = expected.get('font', {})
        if f.get('bold'):
            assert actual.find(X+'font/'+X+'b') is not None
        if f.get('fill'):
            assert actual.find(X+'font/'+X+'color').get('rgb') == 'FF'+f['fill']['color']['value']


def expected_cell(cell):
    value = cell.get('value')
    if cell['dataType'] == 7:
        value = str((datetime.fromisoformat(value.replace('Z','+00:00')).replace(tzinfo=None)-datetime(1899,12,30)).total_seconds()/86400)
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('checkpoint', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('report', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    model = json.loads(args.checkpoint.read_text())
    assert [s['name'] for s in model['sheets']] == ['Synthese','Catalogue','Recuperes']
    for key in ('images','threads','notes','slicerCaches','pivotCaches','timelineCaches'):
        assert not model.get(key), 'Unsupported objects must not be silently discarded: '+key
    template = subprocess.check_output(['git','show',BASE+':'+TEMPLATE],cwd=root)
    source = zipfile.ZipFile(io.BytesIO(template))
    files = {name:source.read(name) for name in source.namelist()}
    validate_styles(model['styles'],ET.fromstring(files['xl/styles.xml']))
    cell_count = formula_count = 0
    for position,sheet in enumerate(model['sheets'],1):
        assert not sheet.get('drawings') and not sheet.get('mergedCells') and not sheet.get('sharedFormulas')
        path = f'xl/worksheets/sheet{position}.xml'
        native = ET.fromstring(files[path])
        sheet_data = ET.Element(X+'sheetData')
        for row in sheet['rows']:
            attrs = {'r':str(row['index'])}
            if row.get('customHeight'):
                assert row['height'] <= 409
                attrs.update(ht=str(row['height']),customHeight='1')
            target_row = ET.SubElement(sheet_data,X+'row',attrs)
            for cell in row['cells']:
                attrs = {'r':cell['address'],'s':str(cell['styleIndex'])}
                target = ET.SubElement(target_row,X+'c',attrs)
                kind = cell['dataType']
                assert kind in (0,3,5,7), kind
                if cell.get('formula'):
                    ET.SubElement(target,X+'f').text = cell['formula'].lstrip('=')
                    ET.SubElement(target,X+'v').text = str(expected_cell(cell))
                    formula_count += 1
                elif kind == 3:
                    target.set('t','inlineStr')
                    text = ET.SubElement(ET.SubElement(target,X+'is'),X+'t')
                    text.set('{http://www.w3.org/XML/1998/namespace}space','preserve')
                    text.text = str(cell.get('value',''))
                elif kind in (5,7):
                    ET.SubElement(target,X+'v').text = str(expected_cell(cell))
                cell_count += 1
        replace_child(native,'sheetData',sheet_data)
        columns = ET.Element(X+'cols')
        for column in sheet['columns']:
            ET.SubElement(columns,X+'col',{k:(flag(v) if isinstance(v,bool) else str(v)) for k,v in column.items()})
        replace_child(native,'cols',columns)
        last_column = sheet['columns'][-1]['max']
        letter = ''
        while last_column:
            last_column,remainder = divmod(last_column-1,26)
            letter = chr(65+remainder)+letter
        dimension = native.find(X+'dimension')
        if dimension is not None:
            dimension.set('ref',f'A1:{letter}{max(r["index"] for r in sheet["rows"])}')
        view = native.find(X+'sheetViews/'+X+'sheetView')
        view.set('showGridLines',flag(sheet['showGridLines']))
        if sheet.get('pane'):
            pane = native.find(X+'sheetViews/'+X+'sheetView/'+X+'pane')
            assert float(pane.get('xSplit','0')) == sheet['pane']['horizontalSplit']
            assert float(pane.get('ySplit','0')) == sheet['pane']['verticalSplit']
            assert pane.get('topLeftCell') == sheet['pane']['topLeftCell']
        cfs = native.findall(X+'conditionalFormatting')
        assert len(cfs) == len(sheet['conditionalFormattings'])
        for expected,actual in zip(sheet['conditionalFormattings'],cfs):
            actual.set('sqref',' '.join(r['startAddress']+':'+r['endAddress'] for r in expected['ranges']))
            for rule,native_rule in zip(expected['rules'],actual):
                for key in ('type','priority','dxfId','operator','text'):
                    if key in rule:
                        assert str(rule[key]) == native_rule.get(key)
        dvs = native.find(X+'dataValidations')
        expected_dvs = sheet.get('dataValidations',{}).get('items',[])
        assert (len(dvs) if dvs is not None else 0) == len(expected_dvs)
        for expected,actual in zip(expected_dvs,list(dvs) if dvs is not None else []):
            assert expected['type'] == 4 and actual.get('type') == 'list'
            actual.set('sqref',expected['sqref'])
            actual.find(X+'formula1').text = expected['formula1']
        files[path] = xml(native)
        for table in sheet['tables']:
            table_path = f'xl/tables/table{table["id"]}.xml'
            native_table = ET.fromstring(files[table_path])
            for key in ('name','displayName','ref'):
                native_table.set(key,str(table[key]))
            auto_filter = native_table.find(X+'autoFilter')
            if auto_filter is not None:
                auto_filter.set('ref',table['ref'])
            native_columns = native_table.find(X+'tableColumns')
            assert len(native_columns) == len(table['columns'])
            for expected,actual in zip(table['columns'],native_columns):
                actual.set('name',expected['name'])
                assert actual.get('id') == str(expected['id'])
            style = native_table.find(X+'tableStyleInfo')
            for key,value in table['style'].items():
                assert style.get(key) == (flag(value) if isinstance(value,bool) else str(value))
            files[table_path] = xml(native_table)
    workbook = ET.fromstring(files['xl/workbook.xml'])
    calc = workbook.find(X+'calcPr')
    if calc is None:
        calc = ET.SubElement(workbook,X+'calcPr')
    calc.set('calcMode','auto')
    calc.set('fullCalcOnLoad','1')
    files['xl/workbook.xml'] = xml(workbook)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED) as target:
        for name,data in files.items():
            entry = zipfile.ZipInfo(name,(2026,11,24,12,0,0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            target.writestr(entry,data)
    # Independent read-back of every serialized cell, formula cache and layout.
    compared = 0
    with zipfile.ZipFile(args.output) as final:
        for i,sheet in enumerate(model['sheets'],1):
            native = ET.fromstring(final.read(f'xl/worksheets/sheet{i}.xml'))
            actual_cells = {c.get('r'):c for c in native.findall(X+'sheetData/'+X+'row/'+X+'c')}
            for row in sheet['rows']:
                actual_row = native.find(X+f'sheetData/{X}row[@r="{row["index"]}"]')
                if row.get('customHeight'):
                    assert float(actual_row.get('ht')) == row['height']
                for cell in row['cells']:
                    actual = actual_cells[cell['address']]
                    assert int(actual.get('s')) == cell['styleIndex']
                    if cell.get('formula'):
                        assert actual.find(X+'f').text == cell['formula'].lstrip('=')
                    value = actual.find(X+'v')
                    observed = value.text if value is not None else ''.join(actual.itertext())
                    expected = expected_cell(cell)
                    assert observed == ('' if expected is None else str(expected)), (sheet['name'],cell['address'])
                    compared += 1
            assert [(c.get('min'),c.get('max'),float(c.get('width'))) for c in native.find(X+'cols')] == [(str(c['min']),str(c['max']),c['width']) for c in sheet['columns']]
        assert final.read('xl/styles.xml') == files['xl/styles.xml'] == source.read('xl/styles.xml')
    # Read the actual delivered package through an independent XLSX reader.
    # Populate a render model from the cells read back, after exact style/layout checks.
    formulas = load_workbook(args.output,data_only=False)
    cached = load_workbook(args.output,data_only=True)
    independent_count = 0
    for sheet in model['sheets']:
        ws, values = formulas[sheet['name']], cached[sheet['name']]
        assert ws.sheet_view.showGridLines == sheet['showGridLines']
        if sheet.get('pane'):
            assert ws.freeze_panes == sheet['pane']['topLeftCell']
        for column in sheet['columns']:
            dimension = ws.column_dimensions[get_column_letter(column['min'])]
            assert dimension.width == column['width']
            column['width'] = dimension.width
        for row in sheet['rows']:
            if row.get('customHeight'):
                assert ws.row_dimensions[row['index']].height == row['height']
                row['height'] = ws.row_dimensions[row['index']].height
            for cell in row['cells']:
                actual, value = ws[cell['address']], values[cell['address']].value
                style = model['styles']['cellXfs'][cell['styleIndex']]
                # The reader renumbers custom number formats (200 -> 164).
                # XML style IDs were checked above; compare semantic formatting here.
                font = model['styles']['fonts'][style['fontId']]
                assert actual.font.name == font['typeface'] and actual.font.sz == font['fontSize']/100
                assert bool(actual.font.bold) == bool(font.get('bold'))
                color = font.get('fill',{}).get('color',{}).get('value')
                if color:
                    assert actual.font.color.type == 'rgb' and actual.font.color.rgb == 'FF'+color
                assert actual.alignment.vertical == style.get('verticalAlignment')
                assert actual.alignment.horizontal == style.get('horizontalAlignment')
                assert bool(actual.alignment.wrap_text) == bool(style.get('wrapText'))
                fmt = next((f['formatCode'] for f in model['styles']['numberFormats'] if f['id']==style['numFmtId']),'General')
                assert actual.number_format == fmt
                fill = model['styles']['fills'][style['fillId']]
                if fill.get('color'):
                    assert actual.fill.patternType == 'solid'
                    assert actual.fill.fgColor.rgb == 'FF'+fill['color']['value']
                expected = cell.get('value')
                if cell.get('formula'):
                    assert actual.value == '='+cell['formula'].lstrip('=')
                    assert float(value) == float(expected)
                    cell['formula'] = actual.value[1:]
                    cell['value'] = str(value)
                elif cell['dataType'] == 7:
                    assert value == datetime.fromisoformat(expected.replace('Z','+00:00')).replace(tzinfo=None)
                    cell['value'] = value.isoformat(timespec='milliseconds')+'Z'
                elif cell['dataType'] == 5:
                    assert float(value) == float(expected)
                    cell['value'] = str(value)
                else:
                    assert (value or '') == (expected or '')
                    if cell['dataType'] == 3:
                        cell['value'] = value or ''
                independent_count += 1
        expected_dvs = sheet.get('dataValidations',{}).get('items',[])
        actual_dvs = list(ws.data_validations.dataValidation)
        assert [(str(v.sqref),v.type,v.formula1) for v in actual_dvs] == [(v['sqref'],'list',v['formula1']) for v in expected_dvs]
        assert len(ws.conditional_formatting) == len(sheet['conditionalFormattings'])
        for cf,expected in zip(ws.conditional_formatting,sheet['conditionalFormattings']):
            assert str(cf.sqref) == ' '.join(r['startAddress']+':'+r['endAddress'] for r in expected['ranges'])
        assert len(ws.tables) == len(sheet['tables'])
        for table in sheet['tables']:
            actual = ws.tables[table['name']]
            assert actual.ref == table['ref']
            assert [c.name for c in actual.tableColumns] == [c['name'] for c in table['columns']]
    readback_path = args.report.with_name('workbook-readback-model.json')
    readback_path.write_text(json.dumps(model,ensure_ascii=False)+'\n')
    report = {'method':'artifact-tool toProto checkpoint packaged as OpenXML with Python standard library',
        'template':TEMPLATE,'templateCommit':BASE,'templateSha256':hashlib.sha256(template).hexdigest(),
        'checkpointSha256':hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
        'xlsxSha256':hashlib.sha256(args.output.read_bytes()).hexdigest(),
        'sheets':[s['name'] for s in model['sheets']], 'serializedCells':cell_count,
        'readBackCellsCompared':compared,'formulaCachesPreserved':formula_count,
        'styleDefinitionsCompared':len(model['styles']['cellXfs']),
        'stylesByteIdenticalToNativeTemplate':True,'rowHeightsAndColumnWidthsCompared':True,
        'tablesValidationsConditionalFormatsAndPanesPreserved':True,
        'independentReader':'openpyxl read-only API usage; no creation or save',
        'independentCellsCompared':independent_count,
        'independentFontsFormatsAlignmentsWidthsHeightsAndControlsCompared':True,
        'readbackRenderModelSha256':hashlib.sha256(readback_path.read_bytes()).hexdigest(),
        'success':True}
    args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))


if __name__ == '__main__':
    main()
