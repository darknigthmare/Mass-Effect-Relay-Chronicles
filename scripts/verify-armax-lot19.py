#!/usr/bin/env python3
"""Verify files, accounting and guide/workbook structure, not artistic fidelity."""
from pathlib import Path
import hashlib, json, re, subprocess, xml.etree.ElementTree as E, zipfile
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
BASE='231ffde14652932ffaa667c40315f1232f802d4a'
LOT='docs/armax/lot19'
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
checks=[]
def read(p): return json.loads((ROOT/p).read_text())
def sha(p): return hashlib.sha256((ROOT/p).read_bytes() if (ROOT/p).is_file() else oldbytes(p)).hexdigest()
def oldbytes(p): return subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT)
def check(name,condition,detail=None):
    checks.append(dict(name=name,passed=bool(condition),detail=detail))
    assert condition, name+': '+str(detail)

base=read('docs/armax/lot18/production-catalog.json')
cat=read(LOT+'/production-catalog.json')
manifest=read(LOT+'/art-production/manifest.json')
attributions=read(LOT+'/recovered-attributions.json')
index=read('docs/armax/bible/content-associations.json')
manifest_paths={a['path'] for a in manifest['assets']}
generated_paths={a['path'] for a in manifest['attempts'] if a.get('outcome')=='generated'}
native_paths={p.relative_to(ROOT).as_posix() for p in (ROOT/'public/assets/armax/lot19').rglob('*.png')}
check('All native outputs and revisions accounted for',manifest_paths==generated_paths==native_paths and len(manifest_paths)==len(manifest['assets']))
fields=('id','category','name','work','dlc','variant','plannedUse','addedInLot')
check('196 identities and order retained',len(cat['entries'])==len(base['entries'])==196 and all(all(x.get(k)==y.get(k) for k in fields) for x,y in zip(base['entries'],cat['entries'])))
check('Historical images retained',all(set(x['assetFiles']).issubset(y['assetFiles']) and set(x['alternateAssetFiles']).issubset(y['alternateAssetFiles']) for x,y in zip(base['entries'],cat['entries'])))
excluded=set(base['policy']['automaticRetryExcludedIds'])
check('Historical exclusions respected',excluded.issubset(cat['policy']['automaticRetryExcludedIds']) and not any(a['catalogId'] in excluded for a in manifest['assets']))
check('New refusal exclusions recorded',all(a['catalogId'] in cat['policy']['automaticRetryExcludedIds'] for a in manifest['attempts'] if a.get('outcome') in ('refused','blocked','service_refusal')))
by_id={e['id']:e for e in cat['entries']}
check('No fidelity or engine promotion',all(e['fidelity1to1Validated'] is False and e['engineIntegrated'] is False and e['status']!='Validé' for e in cat['entries']))
pngs=[]
for a in manifest['assets']:
    p=a['path']; key=a['assetId']
    check('PNG digest '+key,sha(p)==a['technical']['sha256'])
    with Image.open(ROOT/p) as im:
        im.load()
        check('PNG static RGBA '+key,im.format=='PNG' and im.mode=='RGBA' and getattr(im,'n_frames',1)==1)
        check('PNG dimensions '+key,[im.width,im.height]==[a['technical']['width'],a['technical']['height']])
        alpha=im.getchannel('A'); hist=alpha.histogram()
        check('Real transparency '+key,alpha.getextrema()[0]==0 and alpha.getextrema()[1]>0)
        pngs.append(dict(path=p,sha256=sha(p),width=im.width,height=im.height,alphaZero=hist[0],alphaOpaque=hist[255],alphaPartial=sum(hist[1:255])))
    e=by_id[a['catalogId']]
    check('Image association '+key,p in (e['assetFiles'] if a['selected'] else e['alternateAssetFiles']))
    check('Prompt present '+key,(ROOT/a['promptFile']).is_file())
selected=[a for a in manifest['assets'] if a['selected']]
present=sum(bool(e['assetFiles']) for e in cat['entries'])
check('Catalogue counts',cat['currentCounts']['withImage']==present and cat['currentCounts']['withoutImage']==196-present and cat['currentCounts']['newPngFiles']==len(manifest['assets']) and cat['currentCounts']['selectedNewPngFiles']==len(selected))
check('Bible catalogue projection',len(index['entries'])==196 and index['counts']['withImageCandidate']==present and index['counts']['withoutImageCandidate']==196-present and index['authority']['productionSource']==LOT+'/production-catalog.json' and all(i['productionSnapshot']['hasImageCandidate']==bool(by_id[i['catalogId']]['assetFiles']) for i in index['entries']))
tracked=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=ROOT).decode().splitlines())
for a in attributions['associations']:
    e=by_id[a['catalogId']]
    check('Historical attribution '+a['catalogId'],sha(a['path'])==a['sha256'] and a['path'] in tracked and a['path'] not in manifest_paths and a['path'] in e['assetFiles'] and e['imageLot']=='lot17' and e['attributionLot']=='lot19' and e['pngCountLot19']==0 and e['pngCountLot17']==sum('/lot17/' in p for p in e['assetFiles']+e['alternateAssetFiles']) and e['latestGenerationAttempt']==next(x for x in base['entries'] if x['id']==e['id'])['latestGenerationAttempt'])
check('Unresolved marine kept separate',all(a['catalogId'] is None and a['selected'] is False and not any(a['path'] in e['assetFiles'] for e in cat['entries']) for a in attributions['unresolved']))
check('Historical attribution counts',cat['currentCounts']['historicalAttributionsResolved']==len(attributions['associations']) and cat['currentCounts']['unassignedRecoveredPngFiles']==len(attributions['unresolved']) and cat['currentCounts']['recoveredPngFilesThisTurn']==0)
paths={p for e in cat['entries'] for p in e['assetFiles']+e['alternateAssetFiles']}
check('Catalogue paths available locally or in base tree',all((ROOT/p).is_file() or p in tracked for p in paths),len(paths))
source_hashes={
 'Combat_Games_Guide_General_v1.0.txt':'4844584616072ac0d52d37c2fab4365e1ec489240f17a721ee216e223b0355b7',
 'Combat_Games_Extension_01_Tag_Taunts_Bonus_v1.0.txt':'330fb7485a7a52b2a20f855646c940aaac0fcd9510032bc84b2e17c518edd25f',
 'Combat_Games_Extension_02_Slots_Verrouilles_Deblocages_Abonnes_v1.0.txt':'08b57ea542e83c487fef3276997a612d4657f2ee9ed4f8e46b0bf65a2778038b'}
for filename,digest in source_hashes.items():
    found=list((ROOT/'docs/armax/guides').rglob(filename))
    check('Exact source '+filename,len(found)==1 and hashlib.sha256(found[0].read_bytes()).hexdigest()==digest)
requirements=read('docs/armax/bible/guide-coverage-2026-11-27.json')['requirements']
check('68 unique guide sections',len(requirements)==68 and {r['id'] for r in requirements}=={'ARMAX-G'+str(i).zfill(2) for i in range(68)})
for f in ['guide-associations.json','common-rules.json']:
    p='docs/armax/bible/'+f
    check('Historical contract unchanged '+f,(ROOT/p).read_bytes()==oldbytes(p))
guide_review=read(LOT+'/guide-review.json')
check('Reviewed guide snapshot retained',guide_review['blockingDocumentaryFindings']==0 and all(sha(f['path'])==f['sha256'] for f in guide_review['reviewedFiles']))

def book(p):
    z=zipfile.ZipFile(ROOT/p); assert z.testzip() is None
    strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
    names=[s.get('name') for s in E.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet',NS)]
    trees=[E.fromstring(z.read('xl/worksheets/sheet'+str(i)+'.xml')) for i in range(1,len(names)+1)]
    cells=[]
    for tree in trees:
        out={}
        for c in tree.findall('.//m:c',NS):
            v=c.findtext('m:v',None,NS)
            if c.get('t')=='s': v=strings[int(v)]
            elif c.get('t')=='inlineStr': v=''.join(c.find('m:is',NS).itertext())
            out[c.get('r')]={'value':v,'formula':c.findtext('m:f',None,NS),'type':c.get('t')}
        cells.append(out)
    tables=[E.fromstring(z.read(n)) for n in z.namelist() if re.match(r'xl/tables/table\d+\.xml$',n)]
    return names,trees,cells,tables
old=book('docs/armax/lot18/Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx')
new=book(LOT+'/Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx')
check('Workbook sheet order',old[0]==new[0][:3]==['Synthese','Catalogue','Recuperes'] and new[0][3:]==['Attributions19'])
check('Recovered cells and formulas retained',all(v==new[2][2].get(k) for k,v in old[2][2].items()))
check('Workbook identity cells retained',all(old[2][1].get(c+str(r),{}).get('value')==new[2][1].get(c+str(r),{}).get('value') for r in range(6,202) for c in ['A','B','C','D','E','K','L','P']))
check('No saved Excel error cell',not any(c['type']=='e' for sheet in new[2] for c in sheet.values()))
check('Saved summary matches catalogue',int(new[2][0]['B13']['value'])==196 and int(new[2][0]['C13']['value'])==present and int(new[2][0]['D13']['value'])==196-present and int(new[2][0]['B19']['value'])==len(manifest['assets']))
check('Saved attribution summary',int(new[2][0]['B29']['value'])==len(attributions['associations']) and int(new[2][0]['B30']['value'])==cat['currentCounts']['newIllustratedSubjects'])
check('Exported historical attribution rows',all(new[2][3]['S'+str(6+i)]['value']==a['catalogId'] and new[2][3]['L'+str(6+i)]['value']==a['path'] and new[2][3]['M'+str(6+i)]['value']==a['sha256'] and new[2][3]['G'+str(6+i)]['value']=='Attribué' and new[2][3]['I'+str(6+i)]['value']=='0' for i,a in enumerate(attributions['associations'])))
check('Native attribution table',any(t.get('name')=='ArmaxAttributions19' and t.get('ref')=='A5:S8' for t in new[3]))
check('Native current-lot table header',any(t.get('name')=='ArmaxCatalogue' and t.find('m:tableColumns',NS)[17].get('name')=='PNG du lot 19' for t in new[3]))
old_table_names={t.get('name') for t in old[3]}
check('Historical table names ranges styles retained',{(t.get('name'),t.get('ref'),tuple(sorted(t.find('m:tableStyleInfo',NS).attrib.items()))) for t in old[3]}=={(t.get('name'),t.get('ref'),tuple(sorted(t.find('m:tableStyleInfo',NS).attrib.items()))) for t in new[3] if t.get('name') in old_table_names})
for i in (1,2):
    check('Frozen panes '+new[0][i],old[1][i].find('.//m:pane',NS).attrib==new[1][i].find('.//m:pane',NS).attrib)
def validations(tree):
    return [(v.attrib,v.findtext('m:formula1',None,NS),v.findtext('m:formula2',None,NS)) for v in tree.findall('.//m:dataValidation',NS)]
check('Catalogue validations',validations(old[1][1])==validations(new[1][1]))
changed=subprocess.check_output(['git','diff','--name-only',BASE],cwd=ROOT).decode().splitlines()
untracked=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT).decode().splitlines()
links=[]
for name in sorted(set(changed+untracked)):
    if not name.endswith('.md') or not (name.startswith('docs/armax/') or name=='README.md'): continue
    for m in re.finditer(r'(?<!!)\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)',(ROOT/name).read_text()):
        href=m.group(1).split('#',1)[0]
        if not href or re.match(r'^[a-zA-Z]+:',href): continue
        resolved=((ROOT/name).parent/href).resolve()
        try: relative=resolved.relative_to(ROOT).as_posix()
        except ValueError: continue
        this_report=relative==LOT+'/verification.json'
        available=resolved.exists() or relative in tracked or any(p.startswith(relative.rstrip('/')+'/') for p in tracked) or this_report
        links.append(dict(source=name,target=href,available=available,generatedByThisCommand=this_report))
check('Local Markdown targets',all(x['available'] for x in links),[x for x in links if not x['available']])
check('No runtime or dependency changes',not any(p.startswith(('src/','tests/')) or p in ('package.json','package-lock.json','vite.config.js') for p in changed))
subprocess.run(['git','diff','--check',BASE],cwd=ROOT,check=True)
checks.append(dict(name='git diff --check against base commit',passed=True))
report=dict(schemaVersion=1,lot='lot19',date='2026-11-27',baseCommit=BASE,command='python3 scripts/verify-armax-lot19.py',checks=checks,passed=True,counts=cat['currentCounts'],pngs=pngs,localLinksChecked=len(links),historicalFilesCheckedByGitTree=sum(not (ROOT/p).is_file() for p in paths),limits=['Files, guide, accounting and workbook only.','No exact 1:1 or gameplay certification.','No native Microsoft Excel, combat, multiplayer, subscription service or Windows run.'])
(ROOT/LOT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(checksPassed=len(checks),counts=cat['currentCounts'],localLinksChecked=len(links)),ensure_ascii=False,indent=2))
