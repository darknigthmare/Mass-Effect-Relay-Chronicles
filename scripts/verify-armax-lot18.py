#!/usr/bin/env python3
"""Verify catalogue, file provenance and documentary links for Armax lots17/18."""
from pathlib import Path
from collections import Counter
from urllib.parse import unquote
import hashlib
import json
import re
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
BASE='1e3cea80b1a6ec81d7ca6df8ad70d96988973f10'
OUT='docs/armax/lot18/verification.json'
def read(path): return json.loads((ROOT/path).read_text())
def digest(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
checks=[]
def check(name, condition, detail=None):
    checks.append(dict(name=name, passed=bool(condition), detail=detail))

cat16=read('docs/armax/lot16/production-catalog.json')
cat17=read('docs/armax/lot17/production-catalog.json')
cat18=read('docs/armax/lot18/production-catalog.json')
manifest=read('docs/armax/lot18/manifest.json')
recovery=read('docs/armax/lot17/recovery-audit.json')
index=read('docs/armax/bible/content-associations.json')
independent=read('docs/armax/lot18/independent-review.json')
workbook=read('docs/armax/lot18/workbook-verification.json')
entries={e['id']:e for e in cat18['entries']}
fields=['category','name','work','dlc','variant','plannedUse']
check('196 unique identities',len(entries)==len(cat18['entries'])==196)
changed=[e['id'] for e in cat16['entries'] if e['id'] not in entries or any(e[k]!=entries[e['id']][k] for k in fields)]
check('192 inherited identities and usages preserved',not changed,dict(comparedFields=192*6,differences=changed))
count=Counter(e['category'] for e in entries.values())
present=sum(bool(e['assetFiles']) for e in entries.values())
check('presence and category totals',present==150 and len(entries)-present==46 and count==cat18['counts'],dict(withImage=present,withoutImage=len(entries)-present,byCategory=dict(count)))
check('parent catalogue digests',all(digest(c['parentCatalog'])==c['parentCatalogSha256'] for c in [cat17,cat18]))
check('lot17 baseline corrected',cat17['baselineCounts']==dict(total=192,withImage=132,withoutImage=60))
check('no unsupported status promotion',all(e['fidelity1to1Validated'] is False and e['engineIntegrated'] is False and e['status']!='Validé' for e in entries.values()))
check('historical files retained',all(set(e['assetFiles']).issubset(entries[e['id']]['assetFiles']) and set(e.get('alternateAssetFiles',[])).issubset(entries[e['id']]['alternateAssetFiles']) for e in cat16['entries']))
check('catalogue and bible agree',len(index['entries'])==196 and all(row['productionSnapshot']['hasImageCandidate']==bool(entries[row['catalogId']]['assetFiles']) for row in index['entries']))
check('lot18 images and revisions',len(manifest['assets'])==8 and sum(a['selected'] for a in manifest['assets'])==7 and sum(e['pngCountLot18'] for e in entries.values())==8)
active={f for e in entries.values() for f in e['assetFiles']}
unselected=[a for a in recovery['assets']+manifest['assets'] if not a['selected']]
check('four non-selected images remain outside active bindings',len(unselected)==4 and not any(a['path'] in active for a in unselected))
check('three recovered identities are still unassigned',sum(a['catalogId'] is None and not a['selected'] for a in recovery['assets'])==3)

declared=list(manifest['assets'])+recovery['assets']
for path in ['docs/armax/lot17/source-me1-me2-mea/manifest.json','docs/armax/lot17/source-me3/manifest.json']:
    declared+=read(path)['assets']
sha_fail=[]
for a in declared:
    expected=a.get('sha256') or a['technical']['sha256']
    if not (ROOT/a['path']).is_file() or digest(a['path'])!=expected: sha_fail.append(a['path'])
check('22 PNG native digests retained',len(declared)==22 and len({a['path'] for a in declared})==22 and not sha_fail,sha_fail)
paths={str(p.relative_to(ROOT)) for lot in ['lot17','lot18'] for p in (ROOT/'public/assets/armax'/lot).rglob('*.png')}
check('no unregistered PNG in the two lots',paths=={a['path'] for a in declared})
prompt_missing=[a['promptFile'] for a in manifest['assets'] if not (ROOT/a['promptFile']).is_file()]
check('new generation prompts retained',not prompt_missing,prompt_missing)

tree=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=ROOT,text=True).splitlines())
available=lambda p: (ROOT/p).exists() or p in tree or any(x.startswith(p.rstrip('/')+'/') for x in tree)
historical_missing=[]
for entry in entries.values():
    for path in entry['assetFiles']+entry.get('alternateAssetFiles',[]):
        if not available(path):historical_missing.append(path)
check('all active and historical catalogue files resolve locally or in base tree',not historical_missing,dict(pathsChecked=sum(len(e['assetFiles'])+len(e.get('alternateAssetFiles',[])) for e in entries.values()),missing=historical_missing))

narrative=read('docs/armax/lot18/narrative-complements.json')
check('narrative family and routes',narrative['finishersFamily']=='Neutralisation décisive' and len(narrative['routes'])==4,narrative['accounting'])
check('workbook authoring and recalculation',workbook['baselineIdentitiesPreserved']==192 and workbook['finalCalculationCompleted'] is True and workbook['formulaErrorCount']==0 and workbook['nativeExcelApplicationOpened'] is False)
workbook_source_errors=[]
for source in workbook['sources']:
    if not isinstance(source,dict): continue
    p=source.get('path');h=source.get('sha256')
    if p and h and (ROOT/p).is_file() and digest(p)!=h:workbook_source_errors.append(p)
check('workbook source snapshots match',not workbook_source_errors,workbook_source_errors)

docs=['README.md','docs/armax/README.md','docs/armax/lot17/README.md','docs/armax/lot17/RECUPERATION.md',
      'docs/armax/lot18/README.md','docs/armax/lot18/BIBLE_COMPLEMENTS_LOT18.md','docs/armax/lot18/MANQUANTS_2026-11-25.md',
      'docs/armax/bible/BIBLE_ARMAX_INTEGREE.md','docs/armax/bible/CAMPAGNES_ET_SCENES.md',
      'docs/armax/bible/FICHES_ET_LIAISONS.md','docs/armax/bible/ASSOCIATIONS_CONTENU.md']
missing_links=[];local_links=0
for path in docs:
    text=(ROOT/path).read_text()
    for raw in re.findall(r'\]\(([^\s)]+)(?:\s+"[^"]*")?\)',text):
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',raw) or raw.startswith('#'):continue
        url=unquote(raw.split('#')[0])
        target=(ROOT/path).parent.joinpath(url).resolve()
        local_links+=1
        try: rel=str(target.relative_to(ROOT))
        except ValueError:missing_links.append(dict(source=path,target=raw,reason='outside repository'));continue
        if rel!=OUT and not available(rel): missing_links.append(dict(source=path,target=raw))
check('local documentation links resolve',not missing_links,dict(checked=local_links,missing=missing_links))

report=dict(schemaVersion=1,lot='lot18',date='2026-11-25',timezone='Europe/Paris',baseCommit=BASE,
    command='python scripts/verify-armax-lot18.py',checks=checks,
    passed=sum(c['passed'] for c in checks),failed=sum(not c['passed'] for c in checks),
    independentImageReview=dict(path='docs/armax/lot18/independent-review.json',sha256=digest('docs/armax/lot18/independent-review.json'),
        scope='Decode, dimensions, alpha and comparative image inspection reused from the independent review; not represented as a runtime test.'),
    workbookReview=dict(path='docs/armax/lot18/workbook-verification.json',sha256=digest('docs/armax/lot18/workbook-verification.json')),
    sourceDigests={p:digest(p) for p in ['docs/armax/lot17/production-catalog.json','docs/armax/lot18/production-catalog.json','docs/armax/lot18/manifest.json','docs/armax/lot18/narrative-complements.json','docs/armax/bible/content-associations.json']},
    runtimeChanged=False,runtimeTestsExecuted=False,fidelity1to1Certified=False,
    limitations=['Les calques restent non alignés à origine identique ; voir les mesures R0/R1 de la revue indépendante.',
        'Références partielles et régions reconstruites ; trois identités récupérées non attribuées.',
        'Aucun test de gameplay, animation, parallaxe ou application Microsoft Excel exécuté dans cette passe.'])
(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(passed=report['passed'],failed=report['failed'],links=local_links,errors=[c for c in checks if not c['passed']]),ensure_ascii=False,indent=2))
sys.exit(1 if report['failed'] else 0)
