"""Independent preservation check for the scoped Horizon OpenXML candidate."""
import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import zipfile

ROOT=Path(__file__).resolve().parents[1]
BASE='2ab3f7c10d3bdd9ca04b7a962df9447aee2b3e75'
HELPER=ROOT/'scripts/verify-eden-immersion-workbook.py'
spec=importlib.util.spec_from_file_location('horizon_independent_native',HELPER)
native=importlib.util.module_from_spec(spec);spec.loader.exec_module(native)
q=native.q
FIELDS=['id','name','status','assetStatus','priority','episode','canonLevel','description','acceptance',
        'dependencies','plannedPath','assetPath','gameKey','reference','sourceUrl','scope','notes']

def sha(data):return hashlib.sha256(data).hexdigest()
def text(value):return ', '.join(value) if isinstance(value,list) else ('' if value is None else str(value))
def tally(records):return [len(records),*[sum(e['status']==s for e in records)for s in ['Défini','Prototype','Intégré','Validé']],*[sum(e['canonLevel']==s for e in records)for s in ['Confirmé','Référence à vérifier','Adaptation']],sum(e['episode']=='ME1'for e in records),sum(e['scope']=='Extension future'for e in records)]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ['before','after','catalog-before','catalog-after','changes','output']:
        parser.add_argument('--'+name,required=True)
    a=parser.parse_args()
    before_cat=json.loads(Path(a.catalog_before).read_text());after_cat=json.loads(Path(a.catalog_after).read_text())
    update=json.loads(Path(a.changes).read_text());scope=json.loads((ROOT/'scripts/horizon-workbook-scope.json').read_text())
    baseline=json.loads((ROOT/'docs/qa/horizon-workbook-baseline.json').read_text())
    assert update['baseCommit']==scope['baseCommit']==baseline['baselineCommit']==BASE
    for relative,filename in [('docs/content-catalog.json',a.catalog_before),('docs/Mass_Effect_Relay_Chronicles_Production.xlsx',a.before)]:
        original=subprocess.check_output(['git','show',f'{BASE}:{relative}'],cwd=ROOT)
        assert sha(original)==sha(Path(filename).read_bytes())==baseline['sourceHashes'][relative]
    old={entry['id']:entry for entry in before_cat['entries']};new={entry['id']:entry for entry in after_cat['entries']}
    assert len(old)==1382 and len(new)==len(after_cat['entries'])==1385
    assert [entry['id']for entry in after_cat['entries'][:1382]]==list(old)
    assert set(new)-set(old)==set(scope['newIds'])
    assert before_cat['categories']==after_cat['categories'] and before_cat['sources']==after_cat['sources']
    prior_meta=copy.deepcopy(before_cat['meta']);next_meta=copy.deepcopy(after_cat['meta'])
    prior_meta.pop('prototypeCoverage');next_meta.pop('prototypeCoverage');assert prior_meta==next_meta
    changed={};content_promotions=[];asset_promotions=[]
    expected_cells={};expected_metadata=0
    for id,entry in old.items():
        after=new[id]
        fields={key for key in set(entry)|set(after)if entry.get(key)!=after.get(key)}
        if not fields:continue
        assert id in scope['changedIds'] and fields<=set(scope['allowedFieldsById'][id]),(id,fields)
        assert all(entry.get(field)==after.get(field)for field in scope['immutableExistingFields'])
        if entry['status'] in ['Intégré','Validé']:assert entry==after
        for field in ['implementationPaths','evidence']:
            previous=entry.get(field,[]);following=after.get(field,[])
            assert following[:len(previous)]==previous and len(following)==len(set(following))
        for field in ['status','assetStatus']:
            if field not in fields:continue
            assert id in scope['promoteIfProved'] and entry[field] in ['Défini','À produire'] and after[field]=='Prototype'
            (content_promotions if field=='status'else asset_promotions).append(id)
        changed[id]=fields
        location=baseline['rowLocations'][id]
        for column,field in enumerate(FIELDS):
            if text(entry.get(field))!=text(after.get(field)):
                expected_cells[(location['sheetName'],f'{chr(65+column)}{location["row"]}')]=(id,field,entry.get(field),after.get(field))
        expected_metadata+=sum(field in fields for field in ['implementationPaths','evidence'])
    assert set(changed)==set(scope['changedIds'])==set(update['changedIds'])
    assert len(content_promotions)==21 and len(asset_promotions)==20
    assert all(new[id]['status']==new[id]['assetStatus']=='Prototype' for id in scope['newIds'])
    source_ids={source['id']for source in before_cat['sources']}
    for id in scope['newIds']:
        entry=new[id];assert entry['category']=='sprites' and entry['episode']=='ME1'
        assert entry['sourceId'] in source_ids and entry['canonLevel']=='Référence à vérifier'
        assert set(entry['dependencies'])<=set(new) and id not in entry['dependencies']
        assert entry['acceptance'] and entry['reference'] and '1:1' in entry['notes']
        assert (ROOT/entry['assetPath']).is_file()
    coverage=after_cat['meta']['prototypeCoverage']
    allowed_coverage={'atlases','conversationPointCount','conversationTopicCount','operationCount','operationStepCount',
      'operationEncounterCount','assignmentCount','nativePNGCount','horizonNPCBodyCount','horizonEnemyBodyCount',
      'horizonFleetDrawingCount','horizonFaunaDrawingCount','horizonWorldFaunaBodyCount','horizonDocumentaryFaunaBodyCount',
      'assignmentLimit','visualLimit','animationLimit','coverageLimit','vehicleLimit'}
    actual_coverage={key for key in set(before_cat['meta']['prototypeCoverage'])|set(coverage)if before_cat['meta']['prototypeCoverage'].get(key)!=coverage.get(key)}
    assert actual_coverage<=allowed_coverage
    for key,value in {'conversationPointCount':25,'conversationTopicCount':50,'operationCount':12,'operationEncounterCount':5,
      'assignmentCount':15,'nativePNGCount':46,'horizonNPCBodyCount':8,'horizonEnemyBodyCount':5,'horizonFleetDrawingCount':8,
      'horizonFaunaDrawingCount':8,'horizonWorldFaunaBodyCount':3,'horizonDocumentaryFaunaBodyCount':5,'combatKeyPoseCount':84}.items():assert coverage[key]==value,(key,coverage.get(key))
    assert coverage['chronicles']==before_cat['meta']['prototypeCoverage']['chronicles']
    assert sorted(item['path']for item in coverage['atlases'])==sorted(str(p.relative_to(ROOT))for p in(ROOT/'public/assets').glob('*.png'))
    for name,expected in {**baseline['publicPNGHashes'],**baseline['otherWorkbookHashes'],**baseline['universeCatalogueHashes']}.items():assert sha((ROOT/name).read_bytes())==expected,name
    actual_cells={(item['sheet'],item['address']):(item['id'],item['field'],item['before'],item['after'])for item in update['cellChanges']}
    assert actual_cells==expected_cells and len(actual_cells)==len(update['cellChanges'])
    authored=update['nativeAuthoring']
    assert sha(Path(a.before).read_bytes())==authored['sourceSHA256']
    assert sha(Path(a.after).read_bytes())==authored['outputSHA256']==update['outputHashes']['workbook']
    assert sha(Path(a.catalog_after).read_bytes())==update['outputHashes']['catalogue']
    heights={(item['sheet'],str(item['row'])):item for item in authored['rowHeightChanges']}
    assert all(item['id']in scope['changedIds'] and item['after']>item['before'] and item['after']<=409.5 for item in heights.values())
    appended=authored['appendedRows'];assert len(appended)==3 and {item['id']for item in appended}==set(scope['newIds'])
    assert {item['row']for item in appended}=={89,90,91} and all(item['sheet']=='Sprites'for item in appended)
    new_rows={(item['sheet'],str(item['row'])):item for item in appended}
    for gate in update['integrationProofs']:
        data=(ROOT/gate['path']).read_bytes();assert sha(data)==gate['sha256'] and json.loads(data)['passed']is True
    for filename,expected in update['assetSourceHashes'].items():assert sha((ROOT/filename).read_bytes())==expected,filename
    manifest_raw=(ROOT/update['manifestProof']['path']).read_bytes();assert sha(manifest_raw)==update['manifestProof']['sha256']
    manifest=json.loads(manifest_raw)
    previous_manifest=json.loads(subprocess.check_output(['git','show',f'{BASE}:public/assets/manifest.json'],cwd=ROOT))
    assert manifest['assets'][:36]==previous_manifest['assets'] and len(manifest['assets'])==41
    for key,value in previous_manifest.items():
        if key not in ['assets','date']:assert manifest[key]==value,key
    expected_assets={'horizon-npcs.png':8,'horizon-enemies.png':5,'horizon-fleet-me1.png':4,'horizon-fleet-later.png':4,'horizon-fauna.png':8}
    assert {entry['file']for entry in manifest['assets'][36:]}==set(expected_assets)
    for entry in manifest['assets'][36:]:
        raw=(ROOT/'public/assets'/entry['file']).read_bytes()
        assert sha(raw)==entry['sha256'] and raw[25]==6
        assert entry['staticSubjectCount']==expected_assets[entry['file']] and entry['assetStatus']=='Prototype'
        assert entry['partial']is True and entry['primaryVisualVerified']is False
    assert manifest['horizonStaticDrawingCount']==29 and manifest['combatKeyPoses']==84
    counts={'sheets':0,'tables':0,'formulas':0,'dataValidations':0,'conditionalRules':0,'catalogueCells':0,'unmodifiedZipMembers':0}
    expected_formulas=[];expected_caches=[]
    with zipfile.ZipFile(a.before)as before,zipfile.ZipFile(a.after)as after:
        assert before.namelist()==after.namelist()
        old_sheets=native.sheets(before);assert old_sheets==native.sheets(after);paths=dict(old_sheets)
        old_strings=native.shared_strings(before);new_strings=native.shared_strings(after)
        old_sst=ET.fromstring(before.read('xl/sharedStrings.xml'));new_sst=ET.fromstring(after.read('xl/sharedStrings.xml'))
        assert len(new_sst)>=len(old_sst) and all(ET.tostring(x)==ET.tostring(y)for x,y in zip(old_sst,new_sst))
        assert int(new_sst.get('uniqueCount'))==len(new_strings)
        old_dxfs=list(ET.fromstring(before.read('xl/styles.xml')).find(q('dxfs')))
        assert before.read('xl/styles.xml')==after.read('xl/styles.xml')
        totals_old=[];totals_new=[]
        dashboard_left=ET.fromstring(before.read(paths['Dashboard']));dashboard_right=ET.fromstring(after.read(paths['Dashboard']))
        dashboard_old={cell.get('r'):cell for cell in dashboard_left.iter(q('c'))};dashboard_new={cell.get('r'):cell for cell in dashboard_right.iter(q('c'))}
        cache_addresses=set()
        def verify_cache(address,prior,following):
            assert native.cell_value(dashboard_old[address],old_strings)==prior
            assert native.cell_value(dashboard_new[address],new_strings)==following
            if prior!=following:cache_addresses.add(address);expected_caches.append({'sheet':'Dashboard','address':address,'before':prior,'after':following})
        for index,category in enumerate(before_cat['categories']):
            old_records=[e for e in before_cat['entries']if e['category']==category['id']]
            new_records=[e for e in after_cat['entries']if e['category']==category['id']]
            old_end=len(old_records)+6;new_end=len(new_records)+6
            prior=tally(old_records);following=tally(new_records);totals_old.append(prior);totals_new.append(following)
            name=category['sheetName'].replace("'","''")
            def ref(col,end):return f"'{name}'!${col}$7:${col}${end}"
            def formulas(end):return [f"COUNTA({ref('A',end)})",*[f'COUNTIFS({ref("C",end)},"{s}")'for s in ['Défini','Prototype','Intégré','Validé']],*[f'COUNTIFS({ref("G",end)},"{s}")'for s in ['Confirmé','Référence à vérifier','Adaptation']],f'COUNTIFS({ref("F",end)},"ME1")',f'COUNTIFS({ref("P",end)},"Extension future")']
            previous_formulas=formulas(old_end);next_formulas=formulas(new_end)
            for column in range(10):
                address=f'{chr(66+column)}{10+index}';left=dashboard_old[address].find(q('f'));right=dashboard_new[address].find(q('f'))
                assert left.text==previous_formulas[column] and right.text==next_formulas[column]
                if left.text!=right.text:
                    assert category['id']=='sprites';expected_formulas.append({'sheet':'Dashboard','address':address,'before':left.text,'after':right.text});left.text=right.text
                verify_cache(address,prior[column],following[column])
        sum_old=[sum(row[column]for row in totals_old)for column in range(10)];sum_new=[sum(row[column]for row in totals_new)for column in range(10)]
        for column in range(10):verify_cache(f'{chr(66+column)}37',sum_old[column],sum_new[column])
        for address,prior,following in [('B5',sum_old[0],sum_new[0]),('E5',sum(sum_old[3:5]),sum(sum_new[3:5])),('H5',sum_old[6],sum_new[6]),('K5',sum_old[4],sum_new[4])]:verify_cache(address,prior,following)
        assert expected_formulas==authored['formulaChanges'] and expected_caches==authored['formulaCacheChanges']
        assert len(expected_formulas)==10 and sum_new[:5]==[1385,980,399,3,3]
        refs=0
        for sheet,part in old_sheets:
            counts['sheets']+=1
            left=dashboard_left if sheet=='Dashboard'else ET.fromstring(before.read(part))
            right=dashboard_right if sheet=='Dashboard'else ET.fromstring(after.read(part))
            counts['formulas']+=len(list(right.iter(q('f'))));counts['dataValidations']+=len(list(right.iter(q('dataValidation'))));counts['conditionalRules']+=len(list(right.iter(q('cfRule'))))
            refs+=sum(cell.get('t')=='s'for cell in right.iter(q('c')))
            before_rows={row.get('r'):row for row in left.iter(q('row'))};after_rows={row.get('r'):row for row in right.iter(q('row'))}
            for (name,row),change in heights.items():
                if name!=sheet:continue
                assert float(before_rows[row].get('ht'))==change['before'] and float(after_rows[row].get('ht'))==change['after']
                before_rows[row].set('ht',after_rows[row].get('ht'));before_rows[row].set('customHeight',after_rows[row].get('customHeight'))
            for (name,row),info in new_rows.items():
                if name!=sheet:continue
                node=after_rows[row];assert float(node.get('ht'))==info['height']
                for column in range(17):
                    template=before_rows[str(info['templateRow'])].find(f"{q('c')}[@r='{chr(65+column)}{info['templateRow']}']")
                    current=node.find(f"{q('c')}[@r='{chr(65+column)}{row}']")
                    assert template.get('s')==current.get('s')
                right.find(q('sheetData')).remove(node)
            if sheet=='Sprites':
                for node in right.iter():
                    if node.tag in [q('conditionalFormatting'),q('dataValidation')]:
                        sqref=node.get('sqref');assert ':C91' in sqref or ':D91' in sqref or ':E91' in sqref or ':F91' in sqref or ':G91' in sqref
                        node.set('sqref',sqref.replace('91','88'))
                dimension=right.find(q('dimension'))
                if dimension is not None:dimension.set('ref','A1:Q88')
            masked=frozenset(address for name,address in expected_cells if name==sheet)
            caches=frozenset(cache_addresses)if sheet=='Dashboard'else frozenset()
            assert native.canonical(left,native.relationships(before,part),masked,old_dxfs,caches)==native.canonical(right,native.relationships(after,part),masked,old_dxfs,caches),f'Unexpected worksheet structure/style change: {sheet}'
        assert int(new_sst.get('count'))==refs
        for category in after_cat['categories']:
            records=[e for e in after_cat['entries']if e['category']==category['id']]
            xml=ET.fromstring(after.read(paths[category['sheetName']]))
            cells={cell.get('r'):cell for cell in xml.iter(q('c'))}
            for row,entry in enumerate(records,7):
                for column,field in enumerate(FIELDS):
                    assert text(native.cell_value(cells.get(f'{chr(65+column)}{row}'),new_strings))==text(entry.get(field)),(entry['id'],field)
                    counts['catalogueCells']+=1
        sheet_parts=set(paths.values())
        for part in before.namelist():
            if part in sheet_parts or part=='xl/sharedStrings.xml':continue
            if part.startswith('xl/tables/')and part.endswith('.xml'):
                counts['tables']+=1
                left=ET.fromstring(before.read(part));right=ET.fromstring(after.read(part))
                if left.get('name')=='Catalog_sprites':
                    assert left.get('ref')=='A6:Q88'and right.get('ref')=='A6:Q91'
                    assert right.find(q('autoFilter')).get('ref')=='A6:Q91'
                    right.set('ref','A6:Q88');right.find(q('autoFilter')).set('ref','A6:Q88')
                    assert native.canonical(left,{})==native.canonical(right,{})
                    continue
            assert before.read(part)==after.read(part),f'Unrelated ZIP member changed: {part}'
            counts['unmodifiedZipMembers']+=1
        assert counts['sheets']==28 and counts['tables']==26 and counts['formulas']==274
        assert counts['dataValidations']==130 and counts['conditionalRules']==130 and counts['catalogueCells']==1385*17
        counts.update(stylesXmlByteIdentical=True,differentialStyleDefinitionsBefore=len(old_dxfs),
          differentialStyleDefinitionsAfter=len(old_dxfs),sharedStringEntriesBefore=len(old_strings),sharedStringEntriesAfter=len(new_strings))
    report={'passed':True,'ok':True,'baselineCommit':BASE,'changedIds':scope['changedIds'],'newIds':scope['newIds'],
      'catalogueEntries':1385,'unchangedEntries':1382-len(changed),'statusPromotions':len(content_promotions),'assetStatusPromotions':len(asset_promotions),
      'newPrototypeEntries':3,'integratedOrValidatedPromotions':0,'changedWorkbookCells':len(expected_cells),'changedMetadataFields':expected_metadata,
      'resizedRows':len(heights),'sha256':sha(Path(a.after).read_bytes()),'nativeChecks':counts,'formulaChanges':expected_formulas,'formulaCacheChanges':expected_caches,
      'preservedHistoricalPNG':41,'preservedOtherWorkbooks':31,'preservedUniverseCatalogues':27,
      'canonicalParser':{'path':str(HELPER.relative_to(ROOT)),'sha256':sha(HELPER.read_bytes()),'historicalCLIExecuted':False},
      'limits':['Read-only independent OpenXML comparison. Final candidate must still be imported, counters exercised and rendered panels actually opened before publication.','Prototype records describe partial deliveries; existing canonical acceptance criteria remain unchanged.']}
    Path(a.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':True,'records':1385,'promotions':21,'newRows':3,'nativeChecks':counts}))

if __name__=='__main__':main()
