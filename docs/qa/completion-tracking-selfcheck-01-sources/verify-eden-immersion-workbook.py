"""Read-only preservation check for the scoped Eden immersion workbook and metadata update."""

import argparse
import copy
import hashlib
import json
import posixpath
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile
import subprocess


NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
ALLOWED_IDS = {
    'WRL-eden-prime', 'SCN-eden-prime-agriculture', 'SCN-eden-prime-fumee', 'SCN-eden-prime-quais',
    'SPR-guerrier-krogan-ennemi', 'SPR-rachni-soldat-ennemi', 'SYS-carte-locale', 'SYS-transitions-de-camera',
}
PROMOTED_IDS = {id for id in ALLOWED_IDS if id.startswith(('SCN-', 'SPR-'))}
FIELD_COLUMNS = {'status': 'C', 'assetStatus': 'D', 'description': 'H', 'acceptance': 'I', 'assetPath': 'L', 'gameKey': 'M', 'notes': 'Q'}
FULL_FIELDS = set(FIELD_COLUMNS) | {'implementationPaths', 'evidence'}
WORLD_FIELDS = {'description', 'acceptance', 'notes', 'implementationPaths', 'evidence'}
CAMERA_FIELDS = WORLD_FIELDS | {'assetPath'}
CACHE_CELLS = frozenset({'C16', 'D16', 'C30', 'D30', 'C37', 'D37'})
COVERAGE_FIELDS = {'visualLimit', 'coverageLimit', 'animationLimit', 'atlases', 'combatKeyPoseCount',
                   'enemyCombatPoseCount', 'maleCombatPoseCount', 'companionCombatPoseCount', 'seatedDrawingCount',
                   'nativePNGCount', 'terrainTextureCount', 'chronicles'}
FIELDS = ['id', 'name', 'status', 'assetStatus', 'priority', 'episode', 'canonLevel',
          'description', 'acceptance', 'dependencies', 'plannedPath', 'assetPath',
          'gameKey', 'reference', 'sourceUrl', 'scope', 'notes']


def q(name):
    return f'{{{NS}}}{name}'


def relationship_part(part):
    folder, name = posixpath.split(part)
    return posixpath.join(folder, '_rels', name + '.rels')


def relationships(archive, part):
    rel_part = relationship_part(part)
    if rel_part not in archive.namelist():
        return {}
    root = ET.fromstring(archive.read(rel_part))
    return {entry.attrib['Id']: (entry.attrib.get('Type'), entry.attrib.get('Target'), entry.attrib.get('TargetMode')) for entry in root}


def sheets(archive):
    workbook = ET.fromstring(archive.read('xl/workbook.xml'))
    rels = relationships(archive, 'xl/workbook.xml')
    result = []
    for sheet in workbook.find(q('sheets')):
        target = rels[sheet.attrib[f'{{{REL_NS}}}id']][1]
        part = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join('xl', target))
        result.append((sheet.attrib['name'], part))
    return result


def shared_strings(archive):
    if 'xl/sharedStrings.xml' not in archive.namelist():
        return []
    return [''.join(element.itertext()) for element in ET.fromstring(archive.read('xl/sharedStrings.xml'))]


def cell_value(cell, strings):
    if cell is None:
        return None
    value = cell.find(q('v'))
    kind = cell.attrib.get('t')
    if kind == 'inlineStr':
        inline = cell.find(q('is'))
        return ''.join(inline.itertext()) if inline is not None else ''
    if kind == 's':
        return strings[int(value.text)]
    if value is None or value.text is None:
        return None
    if kind == 'b':
        return value.text == '1'
    if kind in ['str', 'e']:
        return value.text
    try:
        return float(value.text)
    except ValueError:
        return value.text


def canonical(element, rels, masked_cells=frozenset(), differential_styles=(), cache_cells=frozenset()):
    if element.tag == f'{{{PKG_REL_NS}}}Relationships':
        return element.tag, tuple(sorted(tuple(sorted((key, value) for key, value in child.attrib.items() if key != 'Id')) for child in element))
    if element.tag == q('dxfs'):
        # Exports can retain unused definitions after repairing imported fills.
        # Compare each referenced definition at its consumer below, not its ID.
        return element.tag, 'validated-by-reference'
    attrs = []
    for key, value in element.attrib.items():
        # A declared formerly empty text cell gains a string storage type.
        # Its value is checked independently; its style and all other attrs stay.
        if element.tag == q('c') and element.attrib.get('r') in masked_cells and key == 't':
            continue
        if key == f'{{{REL_NS}}}id':
            value = rels[value]
        elif key.lower().endswith('dxfid'):
            value = canonical(differential_styles[int(value)], {})
        attrs.append((key, value))
    children = []
    for child in element:
        if element.tag == q('c') and element.attrib.get('r') in masked_cells and child.tag in [q('v'), q('is'), q('f')]:
            continue
        if element.tag == q('c') and element.attrib.get('r') in cache_cells and child.tag == q('v'):
            continue
        children.append(canonical(child, rels, masked_cells, differential_styles, cache_cells))
    return element.tag, tuple(sorted(attrs)), element.text or '', tuple(children)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--before', required=True)
    parser.add_argument('--after', required=True)
    parser.add_argument('--catalog-before', required=True)
    parser.add_argument('--catalog-after', required=True)
    parser.add_argument('--changes', required=True)
    parser.add_argument('--output')
    args = parser.parse_args()
    before_catalog = json.loads(Path(args.catalog_before).read_text())
    after_catalog = json.loads(Path(args.catalog_after).read_text())
    update = json.loads(Path(args.changes).read_text())
    selected_ids = update['changedIds']
    assert selected_ids and len(set(selected_ids)) == len(selected_ids) and set(selected_ids) == ALLOWED_IDS
    expected_fields_by_id = {id: CAMERA_FIELDS if id == 'SYS-transitions-de-camera' else WORLD_FIELDS if id in ['WRL-eden-prime', 'SYS-carte-locale'] else FULL_FIELDS for id in selected_ids}
    expected_catalog = copy.deepcopy(before_catalog)
    by_id = {entry['id']: entry for entry in expected_catalog['entries']}
    expected_cells = {}
    errors = []
    expected_fields = {(id, field) for id, fields in expected_fields_by_id.items() for field in fields}
    actual_fields = [(change['id'], change['field']) for change in update['catalogueChanges']]
    if set(actual_fields) != expected_fields or len(actual_fields) != len(expected_fields):
        errors.append('Expected the exact authorized fields for the eight existing scoped production records.')
    for change in update['catalogueChanges']:
        id, field = change['id'], change['field']
        if (id, field) not in expected_fields:
            errors.append(f'Unexpected editable catalogue field: {id}.{field}')
            continue
        original_value = by_id[id].get(field, [] if field in ['implementationPaths', 'evidence'] else None)
        if original_value != change['before']:
            errors.append(f'Incorrect previous value for {id}.{field}')
        if field in ['implementationPaths', 'evidence']:
            before_paths, after_paths = change['before'], change['after']
            if not isinstance(after_paths, list) or after_paths[:len(before_paths)] != before_paths or len(set(after_paths)) != len(after_paths):
                errors.append(f'Existing path metadata was removed, reordered or duplicated for {id}.{field}')
        by_id[id][field] = change['after']
    coverage = update['prototypeCoverage']
    coverage_before = before_catalog['meta']['prototypeCoverage']
    coverage_after = coverage['after']
    if coverage['before'] != coverage_before:
        errors.append('The prototypeCoverage baseline differs from the actual source.')
    changed_coverage = {key for key in set(coverage_before) | set(coverage_after) if coverage_before.get(key) != coverage_after.get(key)}
    if not changed_coverage <= COVERAGE_FIELDS:
        errors.append('Unexpected prototypeCoverage key changed.')
    declared_coverage = {item['path']: item for item in coverage['changes']}
    if set(declared_coverage) != {f'meta.prototypeCoverage.{key}' for key in changed_coverage}:
        errors.append('The exact metadata before/after patch is not declared.')
    for key in changed_coverage:
        item = declared_coverage.get(f'meta.prototypeCoverage.{key}', {})
        if item.get('before') != coverage_before.get(key) or item.get('after') != coverage_after.get(key):
            errors.append(f'Incorrect prototypeCoverage change: {key}')
    for key in set(coverage_before['chronicles']) | set(coverage_after['chronicles']):
        if key not in ['equipmentItems', 'weapons', 'limit'] and coverage_before['chronicles'].get(key) != coverage_after['chronicles'].get(key):
            errors.append(f'Unrelated Chronicles metadata changed: {key}')
    runtime = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
        "import {UNIVERSE_EQUIPMENT as e} from './src/universe-equipment.js';import {getLevelLayout} from './src/level-layout-data.js';const l=getLevelLayout('eden-prime'),s=e.filter(x=>x.runtimeSupported);console.log(JSON.stringify({supported:s.length,weapons:s.filter(x=>x.kind==='weapon').length,sectors:l.rooms.length,landmarks:l.landmarks.length,bounds:l.bounds}));"], cwd=Path(__file__).resolve().parents[1], text=True))
    manifest_path = Path(__file__).resolve().parents[1] / update['manifestProof']['path']
    manifest_bytes = manifest_path.read_bytes()
    if hashlib.sha256(manifest_bytes).hexdigest() != update['manifestProof']['sha256']:
        errors.append('The declared candidate manifest changed.')
    manifest = json.loads(manifest_bytes)
    checks = {'combatKeyPoseCount': manifest['combatKeyPoses'], 'enemyCombatPoseCount': manifest['enemyCombatKeyPoses'],
              'maleCombatPoseCount': 4, 'companionCombatPoseCount': 24, 'seatedDrawingCount': manifest['seatedKeyPoses'],
              'nativePNGCount': 31, 'terrainTextureCount': manifest['terrainTextureCount']}
    for key, expected in checks.items():
        if coverage_after.get(key) != expected:
            errors.append(f'Incorrect current visual metadata: {key}')
    if coverage_after['chronicles']['equipmentItems'] != runtime['supported'] or coverage_after['chronicles']['weapons'] != runtime['weapons']:
        errors.append('Current equipment metadata does not match the native runtime.')
    root = Path(__file__).resolve().parents[1]
    png_paths = sorted(str(path.relative_to(root)) for path in (root / 'public/assets').glob('*.png'))
    if sorted(asset['path'] for asset in coverage_after['atlases']) != png_paths or len(png_paths) != 31:
        errors.append('Current visual asset metadata does not cover exactly the actual31PNG files.')
    expected_catalog['meta']['prototypeCoverage'] = coverage_after
    if expected_catalog != after_catalog:
        errors.append('Catalogue contains changes outside the eight scoped records and explicit prototypeCoverage patch.')
    expected_cell_fields = {(id, field) for id, field in expected_fields if field in FIELD_COLUMNS}
    actual_cell_fields = [(change['id'], change['field']) for change in update['cellChanges']]
    if set(actual_cell_fields) != expected_cell_fields or len(actual_cell_fields) != len(expected_cell_fields):
        errors.append('Expected exactly45 declared worksheet cells across eight existing production records.')
    old_by_id = {entry['id']: entry for entry in before_catalog['entries']}
    new_by_id = {entry['id']: entry for entry in after_catalog['entries']}
    for change in update['cellChanges']:
        id, field = change['id'], change['field']
        if (id, field) not in expected_cell_fields:
            continue
        entry = old_by_id[id]
        category = next(item for item in before_catalog['categories'] if item['id'] == entry['category'])
        rows = [item for item in before_catalog['entries'] if item['category'] == entry['category']]
        row = next(index + 7 for index, item in enumerate(rows) if item['id'] == id)
        address = f'{FIELD_COLUMNS[field]}{row}'
        if (change['sheet'], change['address']) != (category['sheetName'], address):
            errors.append(f'Incorrect target workbook address for {id}.{field}')
        if (change['before'] or '') != (entry.get(field) or '') or change['after'] != new_by_id[id][field]:
            errors.append(f'Workbook change does not match catalogue values for {id}.{field}')
        expected_cells[(category['sheetName'], address)] = change
    if set(update['changedIds']) != set(expected_fields_by_id):
        errors.append('Updated IDs differ from the eight authorized existing production records.')
    for source, filename in [('workbook', args.after), ('catalogue', args.catalog_after)]:
        if update['outputHashes'][source] != hashlib.sha256(Path(filename).read_bytes()).hexdigest():
            errors.append(f'The {source} output hash differs from the authoring report.')
    for source, filename in [('workbook', args.before), ('catalogue', args.catalog_before)]:
        if update['sourceHashes'][source] != hashlib.sha256(Path(filename).read_bytes()).hexdigest():
            errors.append(f'The {source} baseline hash differs from the authoring report.')

    for rel, expected in update['assetSourceHashes'].items():
        root = Path(__file__).resolve().parents[1]
        if hashlib.sha256((root / rel).read_bytes()).hexdigest() != expected:
            errors.append(f'Current asset/config hash differs from the authoring report: {rel}')

    assert len(expected_cells) == 45 and len(actual_fields) == 61
    for id in selected_ids:
        expected_before = 'Défini' if id in PROMOTED_IDS else 'Prototype'
        if old_by_id[id]['status'] != expected_before or new_by_id[id]['status'] != 'Prototype' or new_by_id[id]['assetStatus'] != 'Prototype':
            errors.append(f'Unexpected production status for {id}')
    if len(update['explicitPromotions']) != 5 or {item['id'] for item in update['explicitPromotions']} != PROMOTED_IDS:
        errors.append('The exact five Prototype promotions are not recorded.')
    counts = {'sheets': 0, 'tables': 0, 'formulas': 0, 'dataValidations': 0, 'conditionalRules': 0, 'catalogueCells': 0, 'xmlParts': 0}
    with zipfile.ZipFile(args.before) as before, zipfile.ZipFile(args.after) as after:
        if set(before.namelist()) != set(after.namelist()):
            errors.append('Native workbook parts were added or removed.')
        before_sheets, after_sheets = sheets(before), sheets(after)
        if before_sheets != after_sheets:
            errors.append('Worksheet names, order or parts changed.')
        counts['sheets'] = len(after_sheets)
        counts['tables'] = len([name for name in after.namelist() if name.startswith('xl/tables/') and name.endswith('.xml')])
        before_strings, after_strings = shared_strings(before), shared_strings(after)
        before_dxf = list(ET.fromstring(before.read('xl/styles.xml')).find(q('dxfs')))
        after_dxf = list(ET.fromstring(after.read('xl/styles.xml')).find(q('dxfs')))
        referenced_after_dxf = set()
        part_names = dict((part, name) for name, part in after_sheets)
        for part in set(before.namelist()) & set(after.namelist()):
            if not part.endswith(('.xml', '.rels')):
                if before.read(part) != after.read(part):
                    errors.append(f'Unrelated binary part changed: {part}')
                continue
            counts['xmlParts'] += 1
            left, right = ET.fromstring(before.read(part)), ET.fromstring(after.read(part))
            for element in right.iter():
                referenced_after_dxf.update(int(value) for key, value in element.attrib.items() if key.lower().endswith('dxfid'))
            sheet_name = part_names.get(part)
            masked = frozenset(address for name, address in expected_cells if name == sheet_name)
            cache = CACHE_CELLS if sheet_name == 'Dashboard' else frozenset()
            if canonical(left, relationships(before, part), masked, before_dxf, cache) != canonical(right, relationships(after, part), masked, after_dxf, cache):
                errors.append(f'Unrelated native content or formatting changed: {part}')
            if sheet_name:
                left_cells = {cell.attrib['r']: cell for cell in left.iter(q('c'))}
                right_cells = {cell.attrib['r']: cell for cell in right.iter(q('c'))}
                counts['formulas'] += len(list(right.iter(q('f'))))
                counts['dataValidations'] += len(list(right.iter(q('dataValidation'))))
                counts['conditionalRules'] += len(list(right.iter(q('cfRule'))))
                for address in masked:
                    change = expected_cells[(sheet_name, address)]
                    if cell_value(left_cells.get(address), before_strings) != change['before']:
                        errors.append(f'Unexpected old workbook text at {sheet_name}!{address}')
                    if cell_value(right_cells.get(address), after_strings) != change['after']:
                        errors.append(f'Incorrect updated workbook text at {sheet_name}!{address}')
        # Compare every production cell with its catalogue source.
        sheet_paths = dict(after_sheets)
        for category in after_catalog['categories']:
            entries = [entry for entry in after_catalog['entries'] if entry['category'] == category['id']]
            root = ET.fromstring(after.read(sheet_paths[category['sheetName']]))
            cells = {cell.attrib['r']: cell for cell in root.iter(q('c'))}
            for row, entry in enumerate(entries, 7):
                for column, field in enumerate(FIELDS):
                    value = entry.get(field, '')
                    if isinstance(value, list):
                        value = ', '.join(value)
                    address = f'{chr(65 + column)}{row}'
                    actual = cell_value(cells.get(address), after_strings)
                    counts['catalogueCells'] += 1
                    if (actual or '') != (value or ''):
                        errors.append(f'Catalogue mismatch at {category["sheetName"]}!{address} ({entry["id"]}.{field})')
        dashboard = ET.fromstring(after.read(sheet_paths['Dashboard']))
        dashboard_cells = {cell.attrib['r']: cell for cell in dashboard.iter(q('c'))}
        if cell_value(dashboard_cells.get('B37'), after_strings) != len(after_catalog['entries']):
            errors.append('Dashboard total does not match the catalogue.')
        expected_cache = {'C16': sum(e['category'] == 'scenery' and e['status'] == 'Défini' for e in after_catalog['entries']),
                          'D16': sum(e['category'] == 'scenery' and e['status'] == 'Prototype' for e in after_catalog['entries']),
                          'C30': sum(e['category'] == 'sprites' and e['status'] == 'Défini' for e in after_catalog['entries']),
                          'D30': sum(e['category'] == 'sprites' and e['status'] == 'Prototype' for e in after_catalog['entries']),
                          'C37': sum(e['status'] == 'Défini' for e in after_catalog['entries']),
                          'D37': sum(e['status'] == 'Prototype' for e in after_catalog['entries'])}
        for address, expected in expected_cache.items():
            if cell_value(dashboard_cells.get(address), after_strings) != expected:
                errors.append(f'Incorrect recalculated status cache: Dashboard!{address}')
        counts['recalculatedFormulaCaches'] = expected_cache
        counts['differentialStyleDefinitionsBefore'] = len(before_dxf)
        counts['differentialStyleDefinitionsAfter'] = len(after_dxf)
        counts['referencedDifferentialStyles'] = len(referenced_after_dxf)
        counts['unreferencedDifferentialStylesAfterExport'] = len(after_dxf) - len(referenced_after_dxf)

    report = {
        'ok': not errors, 'changedIds': update['changedIds'], 'changedWorkbookCells': len(expected_cells), 'changedTextCells': len(expected_cells) - 10, 'changedStatusCells': 10,
        'changedCatalogueFields': len(actual_fields), 'changedMetadataFields': len(actual_fields) - len(expected_cells),
        'selectedSubjects': update['selectedSubjects'], 'assetSourceHashes': update['assetSourceHashes'],
        'catalogueEntries': len(after_catalog['entries']), 'unchangedEntries': len(after_catalog['entries']) - len(expected_fields_by_id), 'nativeChecks': counts,
        'sha256': hashlib.sha256(Path(args.after).read_bytes()).hexdigest(),
        'explicitPromotions': update['explicitPromotions'], 'beforeStatuses': update['beforeStatuses'], 'afterStatuses': update['afterStatuses'], 'statusPromotions': 5, 'assetStatusPromotions': 5,
        'prototypeCoverageChangedKeys': sorted(changed_coverage), 'prototypeCoverageRuntimeChecks': runtime,
        'prototypeCoveragePatch': coverage['changes'],
        'errors': errors,
        'limitations': ['Read-only Open XML verification; Microsoft Excel was not executed.'],
    }
    if args.output:
        Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
