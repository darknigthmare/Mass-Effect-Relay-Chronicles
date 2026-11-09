"""Read-only scoped Open XML verification; the old canonical parser is imported without running its CLI."""
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
HELPER = ROOT / 'scripts/verify-eden-immersion-workbook.py'
spec = importlib.util.spec_from_file_location('relay_workbook_native_helpers', HELPER)
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)
q, sheets, relationships = native.q, native.sheets, native.relationships
shared_strings, cell_value, canonical = native.shared_strings, native.cell_value, native.canonical
BASE = 'ff8a1cf7fd343d2bb8df6b01d5f18f3f5e7723cd'
NPC = ['NPC-greg-adams','NPC-charles-pressly','NPC-officier-des-requisitions','NPC-richard-l-jenkins',
       'NPC-gianna-parasini','NPC-administrator-anoleis','NPC-lorik-qui-in','NPC-lilihierax']
ENEMY = ['drone-de-reconnaissance-geth','drone-d-assaut-geth','lance-roquettes-geth','soldat-de-choc-geth',
         'juggernaut-geth','traqueur-geth','rachni-ouvrier','tourelle-automatisee']
BOSSES = ['SPR-matriarche-benezia-ennemi','SPR-thorian-ennemi','SPR-saren-sur-virmire-ennemi','SPR-saren-a-la-citadelle-ennemi']
WORLDS = ['WRL-therum','WRL-noveria','WRL-virmire']
IDS = NPC + ['ENM-'+slug for slug in ENEMY] + ['SPR-'+slug+'-ennemi' for slug in ENEMY] + BOSSES + WORLDS + ['SYS-mako','SYS-transitions-de-camera','SPR-VEH-mako']
PROMOTED = set(IDS[:24]) | {'SYS-mako'}
COLS = {'status':'C','assetStatus':'D','description':'H','assetPath':'L','gameKey':'M','notes':'Q'}
CACHE = frozenset(f'{column}{row}' for row in [11,18,30,33,37] for column in ['C','D'])
COVERAGE = {'atlases','combatKeyPoseCount','bossCombatPoseCount','nativePNGCount','frontierNPCBodyCount','frontierEnemyBodyCount',
            'makoDirectionalDrawingCount','conversationPointCount','conversationTopicCount','visualLimit','animationLimit','coverageLimit','vehicleLimit'}
FULL_FIELDS = ['id','name','status','assetStatus','priority','episode','canonLevel','description','acceptance',
               'dependencies','plannedPath','assetPath','gameKey','reference','sourceUrl','scope','notes']
META = {'implementationPaths','evidence'}
FIELDS_BY_ID = {id: {'status','assetStatus','assetPath','gameKey','notes'} | META for id in PROMOTED}
FIELDS_BY_ID.update({id: {'assetPath','gameKey','notes'} | META for id in BOSSES})
FIELDS_BY_ID.update({id: {'notes'} | META for id in WORLDS})
FIELDS_BY_ID['SYS-transitions-de-camera'] = {'description','notes'} | META
FIELDS_BY_ID['SPR-VEH-mako'] = {'description','assetPath','notes'} | META
def sha(data):
    return hashlib.sha256(data).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for flag in ['before','after','catalog-before','catalog-after','changes','output']:
        parser.add_argument('--' + flag, required=True)
    args = parser.parse_args()
    before_cat = json.loads(Path(args.catalog_before).read_text())
    after_cat = json.loads(Path(args.catalog_after).read_text())
    update = json.loads(Path(args.changes).read_text())
    assert update['baseCommit'] == BASE and update['changedIds'] == IDS
    assert {key:set(value) for key,value in update['expectedFieldsById'].items()} == FIELDS_BY_ID
    for rel, filename in [('docs/content-catalog.json', args.catalog_before), ('docs/Mass_Effect_Relay_Chronicles_Production.xlsx', args.before)]:
        baseline = subprocess.check_output(['git','show',f'{BASE}:{rel}'],cwd=ROOT)
        assert sha(baseline) == sha(Path(filename).read_bytes())
    expected = copy.deepcopy(before_cat)
    by_id = {entry['id']:entry for entry in expected['entries']}
    required_fields = {(id,field) for id,fields in FIELDS_BY_ID.items() for field in fields}
    actual_fields = [(item['id'],item['field']) for item in update['catalogueChanges']]
    assert set(actual_fields) == required_fields and len(actual_fields) == len(required_fields) == 213
    for item in update['catalogueChanges']:
        entry = by_id[item['id']]
        previous = entry.get(item['field'], [] if item['field'] in ['implementationPaths','evidence'] else None)
        assert previous == item['before'], item
        if item['field'] in ['implementationPaths','evidence']:
            assert isinstance(item['after'],list) and item['after'][:len(previous)] == previous
            assert len(set(item['after'])) == len(item['after'])
        entry[item['field']] = item['after']
    coverage = update['prototypeCoverage']
    assert coverage['before'] == before_cat['meta']['prototypeCoverage']
    changed_coverage = {key for key in set(coverage['before']) | set(coverage['after']) if coverage['before'].get(key) != coverage['after'].get(key)}
    assert changed_coverage == COVERAGE
    patch = {item['path']:item for item in coverage['changes']}
    assert set(patch) == {f'meta.prototypeCoverage.{key}' for key in COVERAGE}
    for key in COVERAGE:
        assert patch[f'meta.prototypeCoverage.{key}']['before'] == coverage['before'].get(key)
        assert patch[f'meta.prototypeCoverage.{key}']['after'] == coverage['after'].get(key)
    expected['meta']['prototypeCoverage'] = coverage['after']
    assert expected == after_cat, 'Unrelated catalogue or metadata change.'
    assert len(after_cat['entries']) == 1382 and len({entry['id'] for entry in after_cat['entries']}) == 1382
    old_ids = {entry['id']:entry for entry in before_cat['entries']}
    new_ids = {entry['id']:entry for entry in after_cat['entries']}
    for id in IDS:
        for key in ['status','assetStatus']:
            after = 'Prototype' if id in PROMOTED else old_ids[id][key]
            assert new_ids[id][key] == after
    assert len(update['explicitPromotions']) == 25 and {item['id'] for item in update['explicitPromotions']} == PROMOTED
    cells = {}
    required_cell_fields = {(id,field) for id,field in required_fields if field in COLS}
    observed_cell_fields = [(item['id'],item['field']) for item in update['cellChanges']]
    assert set(observed_cell_fields) == required_cell_fields and len(observed_cell_fields) == 145
    for item in update['cellChanges']:
        entry = old_ids[item['id']]
        cat = next(cat for cat in before_cat['categories'] if cat['id'] == entry['category'])
        row = [x['id'] for x in before_cat['entries'] if x['category'] == cat['id']].index(item['id']) + 7
        assert (item['sheet'],item['address']) == (cat['sheetName'],f"{COLS[item['field']]}{row}")
        assert (entry.get(item['field']) or '') == (item['before'] or '')
        assert new_ids[item['id']][item['field']] == item['after']
        cells[(item['sheet'],item['address'])] = item
    for key, filename in [('workbook',args.before),('catalogue',args.catalog_before)]:
        assert update['sourceHashes'][key] == sha(Path(filename).read_bytes())
    for key, filename in [('workbook',args.after),('catalogue',args.catalog_after)]:
        assert update['outputHashes'][key] == sha(Path(filename).read_bytes())
    for rel, digest in update['assetSourceHashes'].items():
        assert sha((ROOT / rel).read_bytes()) == digest, rel
    manifest_path = ROOT / update['manifestProof']['path']
    assert sha(manifest_path.read_bytes()) == update['manifestProof']['sha256']
    manifest = json.loads(manifest_path.read_text())
    assert len(manifest['assets']) == 36
    metrics = {'combatKeyPoseCount':84,'enemyCombatPoseCount':32,'companionCombatPoseCount':28,'nativePNGCount':41,'bossCombatPoseCount':16,'frontierNPCBodyCount':7,'frontierEnemyBodyCount':8,'makoDirectionalDrawingCount':4,'conversationPointCount':17,'conversationTopicCount':34}
    assert manifest['combatKeyPoses'] == 84 and manifest['enemyCombatKeyPoses'] == 32 and manifest['companionCombatKeyPoses'] == 28
    for key,value in metrics.items():
        assert after_cat['meta']['prototypeCoverage'][key] == value
    pngs = sorted(str(p.relative_to(ROOT)) for p in (ROOT/'public/assets').glob('*.png'))
    assert len(pngs) == 41 and sorted(item['path'] for item in coverage['after']['atlases']) == pngs
    assert coverage['before']['chronicles'] == coverage['after']['chronicles']
    for gate in update['integrationProofs']:
        raw = (ROOT / gate['path']).read_bytes(); assert sha(raw) == gate['sha256'] and json.loads(raw)['passed'] is True
    baseline = json.loads((ROOT/'docs/qa/frontier-workbook-baseline.json').read_text())
    assert baseline['baselineCommit'] == BASE and baseline['selectedIDs'] == IDS
    for rel,digest in {**baseline['publicPNGHashes'],**baseline['otherWorkbookHashes']}.items():
        assert sha((ROOT/rel).read_bytes()) == digest, 'Historical file modified: '+rel
    heights = {(item['sheet'],str(item['row'])):item for item in update['rowHeightChanges']}
    assert len(heights) == len(update['rowHeightChanges'])
    assert all(item['id'] in IDS and item['after'] > item['before'] for item in heights.values())
    assert all(baseline['rowLocations'][item['id']]['sheetName'] == item['sheet'] and baseline['rowLocations'][item['id']]['row'] == item['row'] for item in heights.values())
    errors = []
    counts = {'sheets':0,'tables':0,'formulas':0,'dataValidations':0,'conditionalRules':0,'catalogueCells':0,'xmlParts':0}
    with zipfile.ZipFile(args.before) as before, zipfile.ZipFile(args.after) as after:
        assert set(before.namelist()) == set(after.namelist())
        old_sheets, new_sheets = sheets(before), sheets(after); assert old_sheets == new_sheets
        counts['sheets'] = len(new_sheets)
        counts['tables'] = sum(name.startswith('xl/tables/') and name.endswith('.xml') for name in after.namelist())
        old_strings, new_strings = shared_strings(before), shared_strings(after)
        old_dxf = list(ET.fromstring(before.read('xl/styles.xml')).find(q('dxfs')))
        new_dxf = list(ET.fromstring(after.read('xl/styles.xml')).find(q('dxfs')))
        references = set(); part_names = {part:name for name,part in new_sheets}
        for part in before.namelist():
            if not part.endswith(('.xml','.rels')):
                assert before.read(part) == after.read(part), part
                continue
            counts['xmlParts'] += 1
            left,right = ET.fromstring(before.read(part)),ET.fromstring(after.read(part))
            for node in right.iter(): references.update(int(value) for key,value in node.attrib.items() if key.lower().endswith('dxfid'))
            name = part_names.get(part); masked = frozenset(address for sheet,address in cells if sheet == name)
            caches = CACHE if name == 'Dashboard' else frozenset()
            # Height is the only allowed row-format change; cell styles remain compared.
            if name:
                old_rows = {row.get('r'):row for row in left.iter(q('row'))}
                new_rows = {row.get('r'):row for row in right.iter(q('row'))}
                for (sheet,row),change in heights.items():
                    if sheet == name:
                        assert float(old_rows[row].get('ht')) == change['before']
                        assert float(new_rows[row].get('ht')) == change['after']
                        old_rows[row].set('ht',new_rows[row].get('ht'))
            if canonical(left,relationships(before,part),masked,old_dxf,caches) != canonical(right,relationships(after,part),masked,new_dxf,caches):
                errors.append(f'Unrelated native structure or effective formatting changed: {part}')
            if name:
                old_cells = {cell.attrib['r']:cell for cell in left.iter(q('c'))}; new_cells = {cell.attrib['r']:cell for cell in right.iter(q('c'))}
                counts['formulas'] += len(list(right.iter(q('f')))); counts['dataValidations'] += len(list(right.iter(q('dataValidation')))); counts['conditionalRules'] += len(list(right.iter(q('cfRule'))))
                for address in masked:
                    item = cells[(name,address)]
                    assert cell_value(old_cells.get(address),old_strings) == item['before']
                    assert cell_value(new_cells.get(address),new_strings) == item['after']
        paths = dict(new_sheets)
        for category in after_cat['categories']:
            records = [item for item in after_cat['entries'] if item['category'] == category['id']]
            tree = ET.fromstring(after.read(paths[category['sheetName']]))
            values = {cell.attrib['r']:cell for cell in tree.iter(q('c'))}
            for row,entry in enumerate(records,7):
                for column,field in enumerate(FULL_FIELDS):
                    expected_value = entry.get(field,'')
                    if isinstance(expected_value,list): expected_value = ', '.join(expected_value)
                    actual = cell_value(values.get(f'{chr(65+column)}{row}'),new_strings)
                    assert (actual or '') == (expected_value or ''), (entry['id'],field)
                    counts['catalogueCells'] += 1
        dashboard = ET.fromstring(after.read(paths['Dashboard'])); values = {cell.attrib['r']:cell for cell in dashboard.iter(q('c'))}
        assert cell_value(values['B37'],new_strings) == 1382
        cached = {'C11':48,'D11':18,'C18':23,'D18':16,'C30':26,'D30':56,'C33':7,'D33':55,'C37':1001,'D37':375}
        assert {item['address']:item['after'] for item in update['formulaCacheCells']} == cached
        for address,expected_value in cached.items(): assert cell_value(values[address],new_strings) == expected_value
        counts.update(recalculatedFormulaCaches=cached,differentialStyleDefinitionsBefore=len(old_dxf),
                      differentialStyleDefinitionsAfter=len(new_dxf),referencedDifferentialStyles=len(references),
                      unreferencedDifferentialStylesAfterExport=len(new_dxf)-len(references))
    assert counts['sheets'] == 28 and counts['tables'] == 26 and counts['formulas'] == 274
    assert counts['dataValidations'] == 130 and counts['conditionalRules'] == 130 and counts['catalogueCells'] == 23494
    report = {'ok':not errors,'passed':not errors,'baselineCommit':BASE,'changedIds':IDS,'catalogueEntries':1382,'unchangedEntries':1348,
              'changedWorkbookCells':145,'changedTextCells':95,'changedStatusCells':50,'changedCatalogueFields':213,'changedMetadataFields':68,'resizedRows':len(heights),
              'statusPromotions':25,'assetStatusPromotions':25,'integratedOrValidatedPromotions':0,'explicitPromotions':update['explicitPromotions'],
              'beforeStatuses':update['beforeStatuses'],'afterStatuses':update['afterStatuses'],'nativeChecks':counts,
              'sha256':sha(Path(args.after).read_bytes()),'prototypeCoverageChangedKeys':sorted(COVERAGE),
              'canonicalParser':{'path':str(HELPER.relative_to(ROOT)),'sha256':sha(HELPER.read_bytes()),'historicalCLIExecuted':False},
              'errors':errors,'limitations':['Read-only Open XML preservation; Microsoft Excel was not executed. Active differential styles are compared at their consumers; unused definitions are counted separately.']}
    Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'passed':not errors,'cells':145,'metadataFields':68,'catalogueCells':23494,'nativeChecks':counts,'errors':errors},ensure_ascii=False))
    raise SystemExit(bool(errors))

if __name__ == '__main__': main()
