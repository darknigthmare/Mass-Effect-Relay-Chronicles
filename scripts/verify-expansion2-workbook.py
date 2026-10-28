#!/usr/bin/env python3
"""Read-only exact-value and native XLSX audit of the variable-size Lot 2 delivery."""
import argparse
import hashlib
import importlib.util
import json
import posixpath
from collections import Counter
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
sha = lambda raw: hashlib.sha256(raw).hexdigest()


def col(index):
    out = ''
    while index:
        index, n = divmod(index - 1, 26)
        out = chr(65 + n) + out
    return out


def verify(root, workbook, build_report):
    report = json.loads(build_report.read_text())
    assert sha(workbook.read_bytes()) == report['xlsxSha256']
    data_path = root / report['dataPath']
    data = json.loads(data_path.read_text())
    assert sha(data_path.read_bytes()) == report['dataSha256']
    rows = data['rows']
    assert len(rows) == report['overlays'] == len({r['recordId'] for r in rows})
    assert sha((root / data['baselinePath']).read_bytes()) == data['baselineSha256']
    assert all(sha((root / p).read_bytes()) == digest for p, digest in data['historicalDigests'].items())
    assert all(sha((root / row['modulePath']).read_bytes()) == row['moduleSha256'] for row in rows)
    spec = importlib.util.spec_from_file_location('expansion2_author', root / 'scripts/build-expansion2-workbook.py')
    author = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(author)
    assert [s['name'] for s in report['sheets']] == list(author.GROUPS.values())
    proof_label = 'Brouillon — aucune preuve fonctionnelle.'
    if not report['draft']:
        proof = report['proof']
        for item in [proof, proof['native']]:
            raw = (root / item['path']).read_bytes()
            assert sha(raw) == item['sha256'] and json.loads(raw).get('passed') is True
        proof_label = (f"{proof['path']} ; SHA256 {proof['sha256']}\n"
                       f"{proof['native']['path']} ; SHA256 {proof['native']['sha256']}")
    with ZipFile(workbook) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for item in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', NS):
                strings.append(''.join(x.text or '' for x in item.iterfind('.//s:t', NS)))
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        targets = {r.attrib['Id']: posixpath.normpath('xl/' + r.attrib['Target']) for r in rels}
        sheets = wb.findall('s:sheets/s:sheet', NS)
        assert len(sheets) == len(author.GROUPS)
        results = []
        for info, expected in zip(sheets, report['sheets']):
            selected = [r for r in rows if r['group'] == expected['group']]
            assert expected['rows'] == len(selected)
            matrix = [author.matrix_row(r, not report['draft'], proof_label) for r in selected]
            assert expected['matrix'] == matrix
            assert info.attrib['name'] == expected['name']
            path = targets[info.attrib[f'{{{NS["r"]}}}id']]
            xml = ET.fromstring(z.read(path))
            cells = {}
            for cell in xml.findall('.//s:sheetData/s:row/s:c', NS):
                value = cell.find('s:v', NS)
                value = value.text if value is not None else ''
                if cell.attrib.get('t') == 's':
                    value = strings[int(value)]
                elif cell.attrib.get('t') == 'inlineStr':
                    value = ''.join(t.text or '' for t in cell.findall('.//s:t', NS))
                cells[cell.attrib['r']] = value or ''
            for i, row in enumerate(matrix, 7):
                for j, value in enumerate(row, 1):
                    assert cells.get(f'{col(j)}{i}', '') == str(value), f'{expected["name"]}!{col(j)}{i}'
            for j, (_, label, _) in enumerate(author.FIELDS, 1):
                assert cells[f'{col(j)}6'] == label
            end = max(7, 6 + len(selected))
            formulas = {'B4': (f'COUNTA(A7:A{end})', len(selected)),
                        'D4': (f'COUNTIF(H7:H{end},"Prototype")', expected['prototypeDeliveries']),
                        'F4': (f'COUNTIF(I7:I{end},"Consultation")', expected['consultations'])}
            for address, (formula, count) in formulas.items():
                assert float(cells[address]) == count
                assert xml.find(f'.//s:c[@r="{address}"]/s:f', NS).text == formula
            assert all(c.attrib.get('t') != 'e' for c in xml.findall('.//s:c', NS))
            pane = xml.find('s:sheetViews/s:sheetView/s:pane', NS)
            assert pane is not None and pane.attrib['xSplit'] == '3' and pane.attrib['ySplit'] == '6'
            validations = xml.findall('s:dataValidations/s:dataValidation', NS)
            expected_ranges = {f'G7:G{end}', f'H7:H{end}'} if selected else set()
            validation_range = lambda v: v.attrib['sqref'] if ':' in v.attrib['sqref'] else f"{v.attrib['sqref']}:{v.attrib['sqref']}"
            assert {validation_range(v) for v in validations} == expected_ranges
            if selected:
                assert {validation_range(v): v.find('s:formula1', NS).text for v in validations} == {
                    f'G7:G{end}': '"Défini,Prototype,Intégré,Validé"', f'H7:H{end}': '"Défini,Prototype"'}
            parts = xml.findall('s:tableParts/s:tablePart', NS)
            assert len(parts) == int(bool(selected))
            if selected:
                sheet_rels = ET.fromstring(z.read(posixpath.dirname(path) + '/_rels/' + posixpath.basename(path) + '.rels'))
                target = next(r.attrib['Target'] for r in sheet_rels if r.attrib['Id'] == parts[0].attrib[f'{{{NS["r"]}}}id'])
                table = ET.fromstring(z.read(posixpath.normpath(posixpath.join(posixpath.dirname(path), target))))
                assert table.attrib['ref'] == f'A6:U{end}'
                assert table.find('s:autoFilter', NS).attrib['ref'] == f'A6:U{end}'
                assert [c.attrib['name'] for c in table.findall('s:tableColumns/s:tableColumn', NS)] == [f[1] for f in author.FIELDS]
            results.append({'sheet': expected['name'], 'rows': len(selected), 'columns': len(author.FIELDS),
                            'cellsCompared': len(selected) * len(author.FIELDS), 'cachedSummaryFormulas': 3,
                            'filters': len(parts), 'validations': len(validations), 'frozenRows': 6,
                            'frozenColumns': 3, 'exactValues': True})
    matrices = [row for sheet in report['sheets'] for row in sheet['matrix']]
    return {'passed': True, 'draft': report['draft'], 'xlsxSha256': report['xlsxSha256'],
            'rows': len(rows), 'columns': len(author.FIELDS), 'cellsCompared': sum(s['cellsCompared'] for s in results),
            'sheets': results, 'deliveryStatusCounts': dict(Counter(r[7] for r in matrices)),
            'sourceCatalogueStatusCounts': dict(Counter(r[6] for r in matrices)),
            'historicalFilesUnchanged': True, 'historicalFilesChecked': len(data['historicalDigests']),
            'newCanonicalFacts': 0,
            'scope': 'Exact Lot 2 values/statuses and native XLSX structure; no visual or original-game fidelity certification.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--workbook', type=Path, required=True)
    parser.add_argument('--build-report', type=Path, required=True)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    result = verify(root, args.workbook, args.build_report)
    if args.report:
        target = args.report.resolve()
        assert target.is_relative_to(Path('/tmp')) or (target.parent == root / 'docs/qa' and target.name.startswith('expansion2-'))
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
