"""Read-only XLSX/catalogue audit. --no-write-report leaves the repository untouched.

Non-Défini declarations need explicit implementationPaths (or implementationPath)
and evidence files. File existence never changes a status; tests are not executed.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import posixpath
import re
from zipfile import ZipFile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'docs/universe/catalogs'
OUTPUT = ROOT / 'docs/universe/outputs/relay-chronicles-20261022'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
CATEGORIES = ['characters','npcs','lore','worlds','zones','links','scenery','props','enemies',
              'main_quests','side_quests','choices','dialogues','cinematics','weapons','equipment',
              'powers','ally_moves','enemy_moves','animations','sprites','vfx','audio','systems','qa','continuity']
STATUSES = ['Défini', 'Prototype', 'Intégré', 'Validé']
NATURES = ['Établi','À vérifier','Extrapolation','Coupé attesté','Concept abandonné','Allégation écartée']
PRIORITIES = ['P0', 'P1', 'P2']


def require(condition, reason):
    if not condition:
        raise AssertionError(reason)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def builder_fields(root=ROOT):
    source = (root / 'scripts/build-universe-workbooks.mjs').read_text()
    match = re.search(r'const fields=\[(.*?)\];', source, re.S)
    require(match, 'Cannot read the workbook builder field order')
    fields = re.findall(r"\['([^']+)','([^']+)',\d+\]", match.group(1))
    require(len(fields) == 19, f'Expected 19 exported columns, found {len(fields)}')
    return fields


def path_proof(declared, root=ROOT):
    require(isinstance(declared, str) and bool(declared.strip()), 'Proof paths must be nonempty strings')
    relative = Path(declared)
    require(not relative.is_absolute() and '..' not in relative.parts, f'Unsafe proof path: {declared}')
    actual = (root / relative).resolve()
    require(actual.is_relative_to(root.resolve()) and actual.is_file(), f'Missing/local proof file required: {declared}')
    return {'path': declared, 'sha256': digest(actual)}


def implementation_proof(entry, root=ROOT):
    if entry['status'] == 'Défini':
        return None
    paths = entry.get('implementationPaths', [])
    if entry.get('implementationPath'):
        require(not paths, f'Use implementationPath OR implementationPaths: {entry["id"]}')
        paths = [entry['implementationPath']]
    evidence = entry.get('evidence', [])
    require(isinstance(paths, list) and paths, f'Explicit implementationPaths required: {entry["id"]}')
    require(isinstance(evidence, list) and evidence, f'Explicit evidence required: {entry["id"]}')
    implementation = [path_proof(item, root) for item in paths]
    checked_evidence = [path_proof(item, root) for item in evidence]
    require(any(item['path'].startswith('src/') and Path(item['path']).suffix in ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'] for item in implementation),
            f'An implementation source file in src/ is required: {entry["id"]}')
    return {'id': entry['id'], 'status': entry['status'], 'implementationPaths': implementation, 'evidence': checked_evidence}


def values(sheet, strings):
    out = {}
    for cell in sheet.findall('.//s:sheetData/s:row/s:c', NS):
        kind, value = cell.get('t'), cell.find('s:v', NS)
        if kind == 'inlineStr':
            out[cell.get('r')] = ''.join(node.text or '' for node in cell.findall('.//s:t', NS))
        elif kind == 's':
            out[cell.get('r')] = strings[int(value.text)] if value is not None else ''
        elif value is not None:
            out[cell.get('r')] = value.text or ''
    return out


def relationship_path(base, target):
    return target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join(posixpath.dirname(base), target))


def relationships(archive, location):
    relfile = posixpath.join(posixpath.dirname(location), '_rels', posixpath.basename(location) + '.rels')
    if relfile not in archive.namelist():
        return {}
    return {node.get('Id'): relationship_path(location, node.get('Target')) for node in ET.fromstring(archive.read(relfile))}


def count_values(entries):
    counts = Counter(entry['status'] for entry in entries)
    return {status: counts[status] for status in STATUSES}


def check(book, output_dir=OUTPUT, catalog_path=None, root=ROOT):
    file = output_dir / book['filename']
    require(file.is_file(), f'Missing workbook {file}')
    if catalog_path:
        require(json.loads(catalog_path.read_text()) == book, f'Catalogue changed before audit: {book["id"]}')
    entries = book['entries']
    ids = {entry['id'] for entry in entries}
    sources = {source['id']: source for source in book['sources']}
    require(len(ids) == len(entries), f'Duplicate IDs: {book["id"]}')
    require(len(sources) == len(book['sources']), f'Duplicate sources: {book["id"]}')
    proofs = []
    for entry in entries:
        require(entry['category'] in CATEGORIES and entry['status'] in STATUSES and entry['nature'] in NATURES and entry['priority'] in PRIORITIES,
                f'Invalid classification: {entry["id"]}')
        require(all(item in ids for item in entry.get('dependencies', [])), f'Unknown dependency: {entry["id"]}')
        require(all(item in sources for item in entry.get('sourceIds', [])), f'Unknown source: {entry["id"]}')
        proof = implementation_proof(entry, root)
        if proof:
            proofs.append(proof)
    fields = builder_fields(root)
    snapshot = file.read_bytes()
    with ZipFile(file) as archive:
        require(archive.testzip() is None, 'Corrupted ZIP entry')
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(node.text or '' for node in item.findall('.//s:t', NS)) for item in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si', NS)]
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        rels = relationships(archive, 'xl/workbook.xml')
        sheets = []
        for item in workbook.findall('s:sheets/s:sheet', NS):
            location = rels[item.get('{' + NS['r'] + '}id')]
            sheet = ET.fromstring(archive.read(location))
            sheets.append((item.get('name'), sheet, values(sheet, strings), location))
        require(len(sheets) == 28 and sheets[0][0] == 'Dashboard' and sheets[-1][0] == 'Guide', f'Wrong sheets: {book["id"]}')
        formula_count = table_count = record_count = validation_count = compared_cells = 0
        dashboard, dashboard_xml = sheets[0][2], sheets[0][1]
        dashboard_formulas = {cell.get('r'): cell.find('s:f', NS).text for cell in dashboard_xml.findall('.//s:c', NS) if cell.find('s:f', NS) is not None}

        def expect_number(address, expected):
            require(address in dashboard_formulas, f'Missing formula: {book["id"]}/{address}')
            try:
                actual = float(dashboard[address])
            except (KeyError, ValueError, TypeError):
                raise AssertionError(f'Missing numeric formula cache: {book["id"]}/{address}')
            require(actual == expected, f'Dashboard cache mismatch {book["id"]}/{address}: {actual} != {expected}')

        def expect_counters(start, rows):
            counts = [len(rows), *[sum(entry['status'] == status for entry in rows) for status in STATUSES],
                      *[sum(entry['nature'] == nature for entry in rows) for nature in NATURES], sum(entry['priority'] == 'P0' for entry in rows)]
            for col, expected in zip('BCDEFGHIJKLM', counts):
                expect_number(f'{col}{start}', expected)

        expect_counters(37, entries)
        for index, (name, sheet, actual, location) in enumerate(sheets):
            cells = sheet.findall('.//s:sheetData/s:row/s:c', NS)
            require(not [cell.get('r') for cell in cells if cell.get('t') == 'e'], f'Formula/cell errors: {book["id"]}/{name}')
            for cell in cells:
                if cell.find('s:f', NS) is not None:
                    require(cell.find('s:v', NS) is not None and actual.get(cell.get('r'), '') != '', f'Missing formula cache: {book["id"]}/{name}/{cell.get("r")}')
                    formula_count += 1
            if not 0 < index < 27:
                continue
            category = CATEGORIES[index - 1]
            rows = [entry for entry in entries if entry['category'] == category]
            end = max(7, 6 + len(rows))
            expect_counters(9 + index, rows)
            refs = lambda col: f"'{name}'!${col}$7:${col}${end}"
            expected_formulas = [f'COUNTA({refs("A")})',
                                 *[f'COUNTIFS({refs("C")},"{status}")' for status in STATUSES],
                                 *[f'COUNTIFS({refs("D")},"{nature}")' for nature in NATURES],
                                 f'COUNTIFS({refs("E")},"P0")']
            for col, formula in zip('BCDEFGHIJKLM', expected_formulas):
                require(dashboard_formulas.get(f'{col}{9 + index}') == formula, f'Dashboard formula differs: {book["id"]}/{col}{9 + index}')
            for col, (_, label) in zip('ABCDEFGHIJKLMNOPQRS', fields):
                require(actual.get(f'{col}6') == label, f'Column header mismatch {book["id"]}/{name}/{col}')
            for row_index, entry in enumerate(rows, 7):
                for col, (key, _) in zip('ABCDEFGHIJKLMNOPQRS', fields):
                    value = entry.get(key, '')
                    if key == 'sourceUrls':
                        value = '\n'.join(sources[source]['url'] for source in entry.get('sourceIds', []) if sources[source].get('url'))
                    elif isinstance(value, list):
                        value = ', '.join(value)
                    expected = '' if value is None else str(value)
                    require(actual.get(f'{col}{row_index}', '') == expected, f'Text mismatch {entry["id"]}/{key}')
                    compared_cells += 1
                record_count += 1
            actual_ids = [value for address, value in actual.items() if re.fullmatch(r'A(?:[7-9]|[1-9]\d+)', address) and value]
            require(len(actual_ids) == len(rows), f'Unexpected/missing record rows: {book["id"]}/{name}')
            pane = sheet.find('.//s:pane', NS)
            require(pane is not None and pane.get('state') == 'frozen' and pane.get('xSplit') == '2' and pane.get('ySplit') == '6' and pane.get('topLeftCell') == 'C7', f'Frozen panes differ: {name}')
            validations = sheet.findall('.//s:dataValidation', NS)
            require(len(validations) == (3 if rows else 0), f'Wrong validation count: {name}')
            for validation, (col, options) in zip(validations, [('C', STATUSES), ('D', NATURES), ('E', PRIORITIES)]):
                ranges = {f'{col}7:{col}{end}'}
                if end == 7:
                    ranges.add(f'{col}7')  # Excel normalizes a one-cell range.
                require(validation.get('type') == 'list' and validation.get('sqref') in ranges, f'Validation range differs: {book["id"]}/{name}/{col}')
                require(validation.findtext('s:formula1', '', NS) == '"' + ','.join(options) + '"', f'Validation choices differ: {name}/{col}')
            validation_count += len(validations)
            parts = sheet.findall('.//s:tablePart', NS)
            require(len(parts) == (1 if rows else 0), f'Wrong table count: {name}')
            for part in parts:
                target = relationships(archive, location)[part.get('{' + NS['r'] + '}id')]
                table = ET.fromstring(archive.read(target))
                expected_range = f'A6:S{end}'
                auto_filter = table.find('s:autoFilter', NS)
                require(table.get('ref') == expected_range and auto_filter is not None and auto_filter.get('ref') == expected_range, f'Full sortable range differs: {name}')
                require([col.get('name') for col in table.findall('s:tableColumns/s:tableColumn', NS)] == [label for _, label in fields], f'Table columns differ: {name}')
                table_count += 1
        expect_number('B5', len(entries))
        expect_number('E5', sum(entry['status'] in ['Intégré', 'Validé'] for entry in entries))
        expect_number('H5', sum(entry['nature'] == 'À vérifier' for entry in entries))
        expect_number('K5', sum(entry['nature'] == 'Extrapolation' for entry in entries))
        for col in 'BCDEFGHIJKLM':
            require(dashboard_formulas.get(f'{col}37') == f'SUM({col}10:{col}35)', f'Total formula differs: {book["id"]}/{col}37')
        for address, formula in [('B5', 'SUM(B10:B35)'), ('E5', 'SUM(E10:F35)'), ('H5', 'SUM(H10:H35)'), ('K5', 'SUM(I10:I35)')]:
            require(dashboard_formulas.get(address) == formula, f'KPI formula differs: {book["id"]}/{address}')
        guide, guide_xml = sheets[-1][2], sheets[-1][1]
        require([guide.get(f'{col}26') for col in 'ABCDEF'] == ['Source', 'Titre', 'Type', 'URL', 'Périmètre', 'Accès et limites'], 'Guide source headers differ')
        for row, source in enumerate(book['sources'], 27):
            for col, key in zip('ABCDEF', ['id', 'title', 'kind', 'url', 'scope', 'note']):
                require(guide.get(f'{col}{row}', '') == str(source.get(key, '') or ''), f'Guide source changed: {book["id"]}/{source["id"]}/{key}')
        pane = guide_xml.find('.//s:pane', NS)
        require(pane is not None and pane.get('state') == 'frozen' and pane.get('ySplit') == '6' and pane.get('topLeftCell') == 'A7', 'Guide freeze differs')
        require(record_count == len(entries) and formula_count == 328, f'Wrong record/formula count: {book["id"]}')
    require(file.read_bytes() == snapshot, f'Workbook changed during audit: {book["id"]}')
    if catalog_path:
        require(json.loads(catalog_path.read_text()) == book, f'Catalogue changed during audit: {book["id"]}')
    return {'id': book['id'], 'title': book['title'], 'file': book['filename'],
            'records': record_count, 'sheets': len(sheets), 'tables': table_count,
            'formulas': formula_count, 'formulaErrors': 0, 'formulaCachesChecked': formula_count,
            'exactTextMatch': True, 'columnsCompared': len(fields), 'cellsCompared': compared_cells,
            'sourceCellsCompared': len(book['sources']) * 6, 'validationsChecked': validation_count,
            'frozenSheetsChecked': 27, 'statusCounts': count_values(entries), 'nonDefinedRows': proofs,
            'catalogSha256': digest(catalog_path) if catalog_path else None,
            'bytes': len(snapshot), 'sha256': hashlib.sha256(snapshot).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ids')
    parser.add_argument('--output-dir', type=Path, default=OUTPUT)
    parser.add_argument('--no-write-report', action='store_true')
    args = parser.parse_args()
    wanted = set(args.ids.split(',')) if args.ids else None
    books = [(file, json.loads(file.read_text())) for file in sorted(DATA.glob('*.json'))]
    known = {book['id'] for _, book in books}
    require(wanted is None or wanted <= known, f'Unknown catalogue IDs: {(wanted or set()) - known}')
    reports = [check(book, args.output_dir, file) for file, book in books if wanted is None or book['id'] in wanted]
    now = datetime.now(timezone.utc).isoformat()
    result = {'auditVersion': 2, 'date': now[:10], 'verifiedAt': now,
              'scope': 'Classeur et données uniquement. Preuves contrôlées comme fichiers ; aucun test de jeu exécuté ni nouvelle revue visuelle attestée par cet audit.',
              'workbooks': len(reports), 'records': sum(report['records'] for report in reports),
              'sheets': sum(report['sheets'] for report in reports),
              'statusCounts': {status: sum(report['statusCounts'][status] for report in reports) for status in STATUSES}, 'results': reports}
    if wanted is None and not args.no_write_report:
        (ROOT / 'docs/universe/qa/verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
