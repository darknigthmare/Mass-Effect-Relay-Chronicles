"""Independent completion preservation check; no Excel mutation or promotion inference.

Adapted from the preserved native verifier, with dynamic baseline and explicitly
reviewed monotonic status transitions. Authoring assertions are not trusted.
"""
import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = None
HELPER = ROOT / 'scripts/verify-eden-immersion-workbook.py'
spec = importlib.util.spec_from_file_location('completion_independent_native', HELPER)
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)
q = native.q
FIELDS = ['id', 'name', 'status', 'assetStatus', 'priority', 'episode', 'canonLevel', 'description', 'acceptance',
          'dependencies', 'plannedPath', 'assetPath', 'gameKey', 'reference', 'sourceUrl', 'scope', 'notes']
IMMUTABLE_FIELDS = ['id', 'category', 'name', 'episode', 'scope', 'canonLevel', 'reference', 'sourceId', 'sourceUrl',
                    'acceptance', 'dependencies', 'priority', 'plannedPath']


def sha(value):
    return hashlib.sha256(value).hexdigest()


def text(value):
    return ', '.join(value) if isinstance(value, list) else ('' if value is None else str(value))


def tally(entries):
    return [len(entries), *[sum(e['status'] == s for e in entries) for s in ['Défini', 'Prototype', 'Intégré', 'Validé']],
            *[sum(e['canonLevel'] == s for e in entries) for s in ['Confirmé', 'Référence à vérifier', 'Adaptation']],
            sum(e['episode'] == 'ME1' for e in entries), sum(e['scope'] == 'Extension future' for e in entries)]


def main():
    global BASE
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['before', 'after', 'catalog-before', 'catalog-after', 'changes', 'scope', 'baseline', 'output']:
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    assert not Path(args.output).exists(), 'Preserve the existing verification report'
    prior = json.loads(Path(args.catalog_before).read_text())
    following = json.loads(Path(args.catalog_after).read_text())
    update = json.loads(Path(args.changes).read_text())
    scope = json.loads(Path(args.scope).read_text())
    baseline = json.loads(Path(args.baseline).read_text())
    BASE=baseline['baseCommit']
    record_count=len(prior['entries'])
    assert update['baseCommit'] == scope['baseCommit'] == BASE
    assert scope['baselineProof']['sha256'] == sha(Path(args.baseline).read_bytes())
    row_locations={}
    for category in prior['categories']:
        for row, entry in enumerate([entry for entry in prior['entries'] if entry['category']==category['id']],7):
            row_locations[entry['id']]={'sheetName':category['sheetName'],'row':row}
    assert scope['immutableExistingFields'] == IMMUTABLE_FIELDS
    assert sha(Path(args.scope).read_bytes()) == update['scopeProof']['sha256']
    for relative, filename in [('docs/content-catalog.json', args.catalog_before),
                               ('docs/Mass_Effect_Relay_Chronicles_Production.xlsx', args.before)]:
        exact = subprocess.check_output(['git', 'show', f'{BASE}:{relative}'], cwd=ROOT)
        assert sha(exact) == sha(Path(filename).read_bytes()) == baseline['publicInputHashes'][relative]
    assert len(prior['entries']) == len(following['entries']) == record_count
    assert [e['id'] for e in prior['entries']] == [e['id'] for e in following['entries']]
    assert len(set(e['id'] for e in following['entries'])) == record_count
    assert prior['categories'] == following['categories'] and prior['sources'] == following['sources']
    assert prior['meta'] == following['meta'], 'No catalogue metadata changes are authorized by this fixed-record pipeline'
    old = {e['id']: e for e in prior['entries']}
    new = {e['id']: e for e in following['entries']}
    changed = {}
    expected_cells = {}
    promotions = []
    field_changes = []
    for identifier, before in old.items():
        after = new[identifier]
        fields = {field for field in set(before) | set(after) if before.get(field) != after.get(field)}
        if not fields:
            continue
        assert identifier in scope['changedIds']
        assert fields <= set(scope['allowedFieldsById'][identifier]), (identifier, fields)
        assert all(before.get(field) == after.get(field) for field in scope['immutableExistingFields'])
        assert before['assetStatus']==after['assetStatus'], 'No asset status changes are authorized'
        if before['status']=='Validé':
            assert before==after, 'Already validated historical records remain unchanged'
        if before['status']=='Intégré':
            assert identifier in scope['allowedAdvancedPromotions'] and after['status']=='Validé', 'An advanced promotion needs explicit scope'
        if 'notes' in fields:
            assert after['notes'].startswith(before.get('notes','')), 'Historical reservations must remain in append-only notes'
        for field in ['implementationPaths', 'evidence']:
            a = before.get(field, [])
            b = after.get(field, [])
            assert b[:len(a)] == a and len(b) == len(set(b)), (identifier, field)
        for field in ['status', 'assetStatus']:
            if field in fields:
                assert identifier in scope['promoteIfProved']
                assert field == 'status', 'No new art is produced; asset statuses remain unchanged'
                ranks={'Défini':0,'Prototype':1,'Intégré':2,'Validé':3}
                assert ranks[after[field]]>ranks[before[field]], 'Only explicit forward transitions are allowed'
                review=scope['acceptanceReviews'][identifier]
                assert review['exactCriterion']==before['acceptance']
                assert review['kind'] in ['functional','documentary','artistic']
                if after[field]=='Validé':
                    assert review['complete'] is True and review['coveredClauses'] and review['evidence']
                    for dependency in before['dependencies']:
                        assert new[dependency]['status']=='Validé', (identifier,'unvalidated dependency',dependency)
                promotions.append(identifier)
        changed[identifier] = fields
        for field in sorted(fields):
            field_changes.append((identifier, field, before.get(field), after.get(field)))
        location = row_locations[identifier]
        for column, field in enumerate(FIELDS):
            if text(before.get(field)) != text(after.get(field)):
                expected_cells[(location['sheetName'], f'{chr(65 + column)}{location["row"]}')] = (
                    identifier, field, before.get(field), after.get(field))
    assert set(changed) == set(scope['changedIds']) == set(update['changedIds'])
    assert scope['newIds'] == update['newIds'] == []
    assert sorted(promotions) == sorted(update['explicitPromotions'][i]['id'] for i in range(len(update['explicitPromotions'])))
    declared_fields = [(c['id'], c['field'], c['before'], c['after']) for c in update['catalogueChanges']]
    assert sorted(declared_fields, key=lambda row: row[:2]) == sorted(field_changes, key=lambda row: row[:2])
    actual_cells = {(c['sheet'], c['address']): (c['id'], c['field'], c['before'], c['after']) for c in update['cellChanges']}
    assert actual_cells == expected_cells and len(actual_cells) == len(update['cellChanges'])
    authored = update['nativeAuthoring']
    assert authored['appendedRows'] == [] and authored['formulaChanges'] == []
    assert sha(Path(args.before).read_bytes()) == authored['sourceSHA256']
    assert sha(Path(args.after).read_bytes()) == authored['outputSHA256'] == update['outputHashes']['workbook']
    assert sha(Path(args.catalog_after).read_bytes()) == update['outputHashes']['catalogue']
    heights = {(c['sheet'], str(c['row'])): c for c in authored['rowHeightChanges']}
    assert len(heights) == len(authored['rowHeightChanges'])
    for change in heights.values():
        assert change['id'] in changed and change['before'] < change['after'] <= 409.5
    public_targets={'docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx'}
    for name,expected in baseline['publicInputHashes'].items():
        if name not in public_targets: assert sha((ROOT/name).read_bytes())==expected,name
    for name,expected in baseline['historicalHashes'].items():
        assert sha((ROOT/name).read_bytes())==expected,('historical proof changed',name)
    for proof in update['integrationProofs']:
        data = (ROOT / proof['path']).read_bytes()
        assert sha(data) == proof['sha256'] and json.loads(data)['passed'] is True
    for filename, expected in update['featureSourceHashes'].items():
        assert sha((ROOT / filename).read_bytes()) == expected, filename
    counts = {'sheets': 0, 'tables': 0, 'formulas': 0, 'dataValidations': 0, 'conditionalRules': 0,
              'catalogueCells': 0, 'unmodifiedZipMembers': 0}
    expected_caches = []
    with zipfile.ZipFile(args.before) as before, zipfile.ZipFile(args.after) as after:
        assert before.namelist() == after.namelist()
        sheets = native.sheets(before)
        assert sheets == native.sheets(after)
        paths = dict(sheets)
        old_strings = native.shared_strings(before)
        new_strings = native.shared_strings(after)
        old_sst = ET.fromstring(before.read('xl/sharedStrings.xml'))
        new_sst = ET.fromstring(after.read('xl/sharedStrings.xml'))
        assert len(new_sst) >= len(old_sst)
        assert all(ET.tostring(x) == ET.tostring(y) for x, y in zip(old_sst, new_sst))
        assert int(new_sst.get('uniqueCount')) == len(new_strings)
        assert before.read('xl/styles.xml') == after.read('xl/styles.xml')
        dxfs = list(ET.fromstring(before.read('xl/styles.xml')).find(q('dxfs')))
        left_dashboard = ET.fromstring(before.read(paths['Dashboard']))
        right_dashboard = ET.fromstring(after.read(paths['Dashboard']))
        left_cells = {c.get('r'): c for c in left_dashboard.iter(q('c'))}
        right_cells = {c.get('r'): c for c in right_dashboard.iter(q('c'))}
        cache_addresses = set()

        def verify_cache(address, a, b):
            assert native.cell_value(left_cells[address], old_strings) == a
            assert native.cell_value(right_cells[address], new_strings) == b
            if a != b:
                cache_addresses.add(address)
                expected_caches.append({'sheet': 'Dashboard', 'address': address, 'before': a, 'after': b})

        totals_before, totals_after = [], []
        for index, category in enumerate(prior['categories']):
            a = tally([e for e in prior['entries'] if e['category'] == category['id']])
            b = tally([e for e in following['entries'] if e['category'] == category['id']])
            totals_before.append(a)
            totals_after.append(b)
            for column in range(10):
                verify_cache(f'{chr(66 + column)}{10 + index}', a[column], b[column])
        a = [sum(row[column] for row in totals_before) for column in range(10)]
        b = [sum(row[column] for row in totals_after) for column in range(10)]
        for column in range(10):
            verify_cache(f'{chr(66 + column)}37', a[column], b[column])
        for address, x, y in [('B5', a[0], b[0]), ('E5', sum(a[3:5]), sum(b[3:5])), ('H5', a[6], b[6]), ('K5', a[4], b[4])]:
            verify_cache(address, x, y)
        assert b[0] == record_count and b[3:5] == [sum(e['status']=='Intégré' for e in following['entries']),sum(e['status']=='Validé' for e in following['entries'])]
        assert expected_caches == authored['formulaCacheChanges']
        references = 0
        for name, part in sheets:
            counts['sheets'] += 1
            left = left_dashboard if name == 'Dashboard' else ET.fromstring(before.read(part))
            right = right_dashboard if name == 'Dashboard' else ET.fromstring(after.read(part))
            counts['formulas'] += len(list(right.iter(q('f'))))
            counts['dataValidations'] += len(list(right.iter(q('dataValidation'))))
            counts['conditionalRules'] += len(list(right.iter(q('cfRule'))))
            references += sum(c.get('t') == 's' for c in right.iter(q('c')))
            before_rows = {r.get('r'): r for r in left.iter(q('row'))}
            after_rows = {r.get('r'): r for r in right.iter(q('row'))}
            assert list(before_rows) == list(after_rows)
            for (sheet, row), change in heights.items():
                if sheet == name:
                    assert float(before_rows[row].get('ht')) == change['before']
                    assert float(after_rows[row].get('ht')) == change['after']
                    before_rows[row].set('ht', after_rows[row].get('ht'))
                    before_rows[row].set('customHeight', after_rows[row].get('customHeight'))
            masked = frozenset(address for sheet, address in expected_cells if sheet == name)
            caches = frozenset(cache_addresses) if name == 'Dashboard' else frozenset()
            assert native.canonical(left, native.relationships(before, part), masked, dxfs, caches) == native.canonical(
                right, native.relationships(after, part), masked, dxfs, caches), f'Unexpected structure/style/formula: {name}'
        assert int(new_sst.get('count')) == references
        for category in following['categories']:
            xml = ET.fromstring(after.read(paths[category['sheetName']]))
            cells = {c.get('r'): c for c in xml.iter(q('c'))}
            entries = [e for e in following['entries'] if e['category'] == category['id']]
            for row, entry in enumerate(entries, 7):
                for column, field in enumerate(FIELDS):
                    assert text(native.cell_value(cells.get(f'{chr(65 + column)}{row}'), new_strings)) == text(entry.get(field)), (entry['id'], field)
                    counts['catalogueCells'] += 1
        sheet_parts = set(paths.values())
        for part in before.namelist():
            if part in sheet_parts or part == 'xl/sharedStrings.xml':
                continue
            if part.startswith('xl/tables/') and part.endswith('.xml'):
                counts['tables'] += 1
            assert before.read(part) == after.read(part), f'Unrelated ZIP member changed: {part}'
            counts['unmodifiedZipMembers'] += 1
        assert counts == {**counts, 'sheets': 28, 'tables': 26, 'formulas': 274,
                          'dataValidations': 130, 'conditionalRules': 130, 'catalogueCells': record_count * 17}
        counts.update(stylesXmlByteIdentical=True, sharedStringEntriesBefore=len(old_strings), sharedStringEntriesAfter=len(new_strings))
    report = {'passed': True, 'baselineCommit': BASE, 'catalogueEntries': record_count, 'changedIds': list(changed),
              'unchangedEntries': record_count - len(changed), 'newIds': [], 'statusPromotions': len(promotions),
              'assetStatusPromotions': 0, 'integratedOrValidatedPromotions': sum(new[x]['status'] in ['Intégré','Validé'] for x in promotions),
              'changedWorkbookCells': len(expected_cells), 'changedCatalogueFields': len(field_changes),
              'resizedRows': len(heights), 'sha256': sha(Path(args.after).read_bytes()), 'nativeChecks': counts,
              'formulaChanges': [], 'formulaCacheChanges': expected_caches,
              'preservedHistoricalPNG': baseline['preservation']['publicPngs'], 'preservedOtherWorkbooks': baseline['preservation']['otherWorkbooks'], 'preservedUniverseCatalogues': len(baseline['catalogues'])-1,
              'preservedHistoricalProofs': len(baseline['historicalHashes']),
              'sourceTool': {'path': str(Path(__file__).relative_to(ROOT)), 'sha256': sha(Path(__file__).read_bytes())},
              'manifestUnchanged': True,
              'canonicalParser': {'path': str(HELPER.relative_to(ROOT)), 'sha256': sha(HELPER.read_bytes()), 'historicalCLIExecuted': False},
              'limits': ['Read-only native comparison; candidate import, live counter probe and actual panel opening remain separate gates.',
                         'All existing identities and acceptance criteria remain intact. Each promotion is explicitly reviewed against its unchanged criterion; functional validation does not certify original-game likeness or complete campaigns.']}
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'passed': True, 'records': record_count, 'changed': len(changed), 'promotions': len(promotions), 'cells': len(expected_cells), 'nativeChecks': counts}))


if __name__ == '__main__':
    main()
