#!/usr/bin/env python3
"""Read catalogue/module declarations without changing historical data or XLSX."""
import argparse
import hashlib
import json
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

GROUPS = {
    'characters': ('Personnages', 'EXPANSION_CHARACTERS'),
    'armor': ('Armures', 'EXPANSION_ARMOR'),
    'weapons': ('Armes', 'EXPANSION_WEAPONS'),
    'fleet': ('Vehicules_vaisseaux', 'EXPANSION_FLEET'),
    'enemies': ('Ennemis', 'EXPANSION_ENEMIES'),
}
sha = lambda raw: hashlib.sha256(raw).hexdigest()

def load_declarations(root):
    # Local, reviewed source modules; no connector or other-chat access.
    script = """
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=process.argv[1], groups=JSON.parse(process.argv[2]), out={};
for(const [id,[label,exportName]] of Object.entries(groups)) {
 const module=await import(pathToFileURL(path.join(root,`src/expansion-${id}.js`)).href);
 if(!Array.isArray(module[exportName])) throw Error(`Missing array export ${exportName}`);
 out[id]=module[exportName];
}
const {getEntryContinuity}=await import(pathToFileURL(path.join(root,'src/continuity-data.js')).href);
const fs=await import('node:fs/promises');
const manifest=JSON.parse(await fs.readFile(path.join(root,'docs/universe/manifest.json'),'utf8'));
const continuity={};
for(const input of [{id:'ME1',catalogPath:'docs/content-catalog.json'},...manifest.workbooks]) {
 const book=JSON.parse(await fs.readFile(path.join(root,input.catalogPath),'utf8'));
 for(const record of book.entries) continuity[record.id]=getEntryContinuity(input.id,record);
}
console.log(JSON.stringify({modules:out,continuity}));
"""
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script, str(root), json.dumps(GROUPS)], cwd=root, text=True))

def audit(root):
    manifest = json.loads((root/'docs/universe/manifest.json').read_text())
    inputs = [{'id':'ME1', 'catalogPath':'docs/content-catalog.json', 'filename':'Mass_Effect_Relay_Chronicles_Production.xlsx'}, *manifest['workbooks']]
    records, books, digests, source_total = {}, [], {}, 0
    for info in inputs:
        rel = info['catalogPath']; raw = (root/rel).read_bytes(); book = json.loads(raw)
        digests[rel] = sha(raw); source_total += len(book['sources'])
        sources = {s['id']:s for s in book['sources']}
        if len(sources) != len(book['sources']): raise ValueError(f'Duplicate sources: {rel}')
        for record in book['entries']:
            if record['id'] in records: raise ValueError(f'Duplicate ID: {record["id"]}')
            records[record['id']] = (info['id'], rel, record, sources)
        xlsx = f'docs/{info["filename"]}' if info['id']=='ME1' else f'docs/universe/outputs/relay-chronicles-20261022/{info["filename"]}'
        digests[xlsx] = sha((root/xlsx).read_bytes())
        books.append({'id':info['id'], 'path':rel, 'records':len(book['entries']), 'sources':len(sources), 'statusCounts':dict(Counter(e['status'] for e in book['entries']))})
    for rel in ['docs/universe/manifest.json','docs/universe/README.md','docs/universe/outputs/relay-chronicles-20261022/Mass_Effect_Universe_27_Classeurs.zip']:
        digests[rel] = sha((root/rel).read_bytes())
    loaded = load_declarations(root)
    rows, failures, warnings, samples = [], [], [], []
    all_ids = set()
    for group, entries in loaded['modules'].items():
        if len(entries)!=40: failures.append(f'{group}: expected40 entries, got{len(entries)}')
        module_path = f'src/expansion-{group}.js'
        group_rows = []
        for index, overlay in enumerate(entries):
            rid = overlay.get('recordId')
            if rid not in records: failures.append(f'{group}: unknown recordId{rid}'); continue
            if rid in all_ids: failures.append(f'Duplicate expansion recordId: {rid}')
            all_ids.add(rid)
            media, catalog_path, entry, sources = records[rid]
            con = loaded['continuity'][rid]
            source_ids = list(dict.fromkeys(([entry['sourceId']] if entry.get('sourceId') else [])+entry.get('sourceIds', [])))
            missing = [sid for sid in source_ids if sid not in sources]
            if missing: failures.append(f'{rid}: missing source IDs{missing}')
            reason = overlay.get('blockedReason') or (overlay.get('constraints') or {}).get('blockedReason')
            runnable = overlay.get('simulation') is not None and not reason and con['fact'] and bool(con['availability'])
            if not con['fact'] and not reason: failures.append(f'{rid}: non-factual overlay not explicitly closed')
            if con['lockReason'] and not reason: failures.append(f'{rid}: context closed but no blockedReason')
            if not source_ids: warnings.append({'id':rid,'reason':'No source identifier on original record.'})
            for key, original in [('name',entry['name']),('identityFact',entry['description']),('conditions',entry.get('conditions','')),('sourceIds',source_ids)]:
                if key in overlay and overlay[key]!=original: failures.append(f'{rid}: copied{key} differs from original catalogue')
            row = {'group':group,'sheetName':GROUPS[group][0],'deliveryId':f'SIM-{group.upper()}-{rid}',
                   'recordId':rid,'name':entry['name'],'catalogId':media,'catalogPath':catalog_path,
                   'catalogueStatus':entry['status'],'originalNature':entry.get('nature') or entry.get('canonLevel'),
                   'description':entry['description'],'conditions':entry.get('conditions',''),'sourceIds':source_ids,
                   'sources':[sources[sid] for sid in source_ids if sid in sources],'reference':entry.get('reference',''),
                   'continuity':con,'overlay':overlay,'modulePath':module_path,'moduleSha256':sha((root/module_path).read_bytes()),
                   'executableDeclaration':bool(runnable),'blockedReason':reason or con['lockReason'] or '',
                   'auditNote':'Catalogue facts and source pointers only; module numbers/actions are adaptation parameters, not original-game proof.'}
            rows.append(row);group_rows.append(row)
        # Eight reproducible source-review cases per category, including closures.
        selected = group_rows[:4]
        for candidate in [next((r for r in group_rows if r['blockedReason']), None), *group_rows[-3:], *group_rows]:
            if candidate and candidate not in selected and len(selected)<8: selected.append(candidate)
        samples.extend(selected)
    if len(rows)!=200 or len(all_ids)!=200: failures.append('Expected200 unique source-linked overlays.')
    for rel, digest in digests.items():
        if sha((root/rel).read_bytes())!=digest: failures.append(f'Historical file changed during read-only audit: {rel}')
    result = {'schemaVersion':1,'at':datetime.now(timezone.utc).isoformat(),'phase':'source review, not functional acceptance',
      'baselineCommit':'6182756578e50f44d668b3c0a2ac1561a8e0275e',
      'sourceChecksPassed':not failures,'globalFidelityCertified':False,'cataloguesModified':False,'historicalExportsModified':False,
      'catalogueCount':28,'catalogueRecordCount':len(records),'catalogueSourceCount':source_total,'overlayCount':len(rows),
      'overlayCountIsNotNewFacts':True,'books':books,'historicalDigests':digests,
      'modules':{group:{'count':len(entries),'sha256':sha((root/f'src/expansion-{group}.js').read_bytes()),
        'declaredExecutable':sum(r['executableDeclaration'] for r in rows if r['group']==group),
        'closedOrInspection':sum(not r['executableDeclaration'] for r in rows if r['group']==group)} for group,entries in loaded['modules'].items()},
      'sampleMethod':'Eight source cases per category: first four, one closure if present, last three, then fill deterministically. Full metadata checks cover all200.',
      'sourceReviewSampleCount':len(samples),'samples':samples,'failures':failures,'warnings':warnings,
      'manualSourceFindings':[
        'Military/mercenary roles support only a generic independent sample; no named kit, recruit status or source mission is granted. Vasir/Armax have explicit prepared Legendary conditions; Archuk is restricted to pl-2183.',
        'Recon Hood alone explicitly cites availability at Legendary start. Five other ME2 pieces retain unknown-edition closures; the generic Armor Customization index is not a standard-edition guarantee.',
        'ME3 armor families carry no newly inferred component/rank/statistics. INF distinguishes body from helmet. ASC records the compromised mask of Hilo, not a playable original armor kit.',
        'The forty enemy IDs have no overlap with the sixteen earlier opponent profiles. Vasir/Broker and Rampart/Adjutant stay closed for unestablished DLC access; powers remain empty.',
        'The forty fleet references are not forty physical hulls: rooms, collective references, interfaces and inspection-only locations remain separately described.',
      ],
      'limits':['Only local catalogue declarations/repository reports consulted; no new external source or other chat accessed.',
        'Established existence and contextual identity do not certify an original combat kit, statistics, acquisition, ship topology or generated likeness.',
        'Generic/secondary index URLs remain attributed as originally declared; presence of a URL is not fresh source verification.',
        'Characters retain the work/period and civilian limits. Ship spaces, collective references and fleet identities do not count as distinct physical hulls.',
        'Original statuses, facts, natures, sources, principal workbook and27universe exports remain unchanged. The new200delivery rows describe independent overlays.',
        'No animation, sprite, primary canon status or complete original mechanic promoted by this audit.'],
      'exportStrategy':{'output':'docs/Expansion_Simulations_200.xlsx','worksheets':5,'rowsPerWorksheet':40,
        'originalCatalogueStatusSeparate':True,'prototypeOnlyAfterPositiveFrozenFunctionalProof':True,
        'closedInspectionDeliveryStatus':'Défini','historicalManifestZipUnchanged':True}}
    return result, {'schemaVersion':1,'at':result['at'],'sourceReport':'docs/qa/expansion-source-review.json','rows':rows,'historicalDigests':digests}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--write-report',action='store_true')
    parser.add_argument('--snapshot',type=Path)
    args=parser.parse_args();root=args.root.resolve();report,data=audit(root)
    if args.write_report:
        path=root/'docs/qa/expansion-source-review.json';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    if args.snapshot:
        args.snapshot.parent.mkdir(parents=True,exist_ok=True);args.snapshot.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'sourceChecksPassed':report['sourceChecksPassed'],'catalogues':28,'records':report['catalogueRecordCount'],
      'sources':report['catalogueSourceCount'],'overlays':report['overlayCount'],'samples':report['sourceReviewSampleCount'],
      'modules':report['modules'],'failures':report['failures']},ensure_ascii=False))
    return 0 if report['sourceChecksPassed'] else 1

if __name__=='__main__':raise SystemExit(main())
