#!/usr/bin/env python3
"""Check lot20 file evidence and workbook accounting; never certify visual 1:1."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as E
import zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = 'b83a62d277d93cd8140113ee2318745fcdedf8d6'
LOT = 'docs/armax/lot20'
NS = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
checks = []


def oldbytes(path):
    return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)


def data(path):
    return (ROOT/path).read_bytes() if (ROOT/path).is_file() else oldbytes(path)


def read(path):
    return json.loads(data(path))


def sha(path):
    return hashlib.sha256(data(path)).hexdigest()


def check(name, condition, detail=None):
    checks.append(dict(name=name, passed=bool(condition), detail=detail))
    assert condition, name+': '+str(detail)


base = read('docs/armax/lot19/production-catalog.json')
cat = read(LOT+'/production-catalog.json')
manifest = read(LOT+'/art-production/manifest.json')
attributions = read(LOT+'/recovered-attributions.json')
if attributions['sourceReport']:
    attribution_source=read(attributions['sourceReport'])
    check('Attribution source report pinned',sha(attributions['sourceReport'])==attributions['sourceReportSha256'] and attributions['associations']==attribution_source['associations'] and attributions['references']==attribution_source['references'] and attributions['qaFiles']==attribution_source['qaFiles'])
review = read(LOT+'/independent-art-review.json')
consolidation = read(LOT+'/consolidation-review.json')
check('Independent consolidation review snapshot',consolidation['blockingDocumentaryFindings']==0 and all(sha(f['path'])==f['sha256'] for f in consolidation['reviewedFiles']))
index = read('docs/armax/bible/content-associations.json')
tracked = set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=ROOT).decode().splitlines())
manifest_paths = {a['path'] for a in manifest['assets']}
generated_paths = {a['path'] for a in manifest['attempts'] if a.get('outcome')=='generated'}
native_paths = {p.relative_to(ROOT).as_posix() for p in (ROOT/'public/assets/armax/lot20').rglob('*.png')}
check('All native PNGs and revisions accounted for',manifest_paths==generated_paths==native_paths and len(manifest_paths)==len(manifest['assets']))
check('No unfinished attempt',not any(a.get('outcome') in ('requested','running','pending') for a in manifest['attempts']))
check('Three source manifests preserved',len(manifest['sourceManifests'])==3 and all(sha(s['path'])==s['sha256'] for s in manifest['sourceManifests']))
for key in ('assets','attempts','referenceSearches','qaFiles'):
    check('Aggregate '+key,manifest[key]==[a for source in manifest['sourceManifests'] for a in read(source['path']).get(key,[])])
fields = ('id','category','name','work','dlc','variant','plannedUse','addedInLot')
check('196 identities and order retained',len(cat['entries'])==len(base['entries'])==196 and all(all(x.get(k)==y.get(k) for k in fields) for x,y in zip(base['entries'],cat['entries'])))
check('Historical assets retained',all(set(x['assetFiles']).issubset(y['assetFiles']) and set(x['alternateAssetFiles']).issubset(y['alternateAssetFiles']) for x,y in zip(base['entries'],cat['entries'])))
excluded = set(base['policy']['automaticRetryExcludedIds'])
covered = {a.get('catalogId') for key in ('assets','attempts','referenceSearches') for a in manifest[key]}
targets = {e['id'] for e in base['entries'] if not e['assetFiles'] and e['id'] not in excluded}
check('All twelve eligible subjects examined',set(manifest['targetCatalogIds'])==targets and len(targets)==12 and targets.issubset(covered))
check('Historical exclusions respected',len(excluded)==29 and excluded.issubset(cat['policy']['automaticRetryExcludedIds']) and not (covered & excluded))
check('Excluded records unchanged',all({k:v for k,v in new.items() if k!='pngCountLot20'}==old for old,new in zip(base['entries'],cat['entries']) if old['id'] in excluded))
refusals = [a for a in manifest['attempts'] if a.get('outcome') in ('refused','blocked','service_refusal')]
check('New refusals excluded',all(a['catalogId'] in cat['policy']['automaticRetryExcludedIds'] for a in refusals))
for refusal in refusals:
    sequence = [a for a in manifest['attempts'] if a.get('catalogId')==refusal['catalogId']]
    check('No automatic retry after refusal '+refusal['catalogId'],sequence[-1]==refusal)
by_id = {e['id']:e for e in cat['entries']}
check('No fidelity or engine promotion',all(e['fidelity1to1Validated'] is False and e['engineIntegrated'] is False and e['status']!='Validé' for e in cat['entries']))
pngs = []
for a in manifest['assets']:
    p=a['path']; key=a['assetId']; entry=by_id[a['catalogId']]
    check('PNG digest '+key,sha(p)==a['technical']['sha256'])
    with Image.open(ROOT/p) as im:
        im.load()
        check('Static RGBA '+key,im.format=='PNG' and im.mode=='RGBA' and getattr(im,'n_frames',1)==1)
        check('Dimensions '+key,[im.width,im.height]==[a['technical']['width'],a['technical']['height']])
        alpha=im.getchannel('A'); histogram=alpha.histogram()
        check('Real alpha '+key,alpha.getextrema()[0]==0 and alpha.getextrema()[1]>0)
        pngs.append(dict(path=p,sha256=sha(p),width=im.width,height=im.height,alphaExtrema=list(alpha.getextrema()),alphaZero=histogram[0],alphaOpaque=histogram[255],alphaPartial=sum(histogram[1:255])))
    check('Asset association '+key,p in (entry['assetFiles'] if a['selected'] else entry['alternateAssetFiles']) and a.get('plannedUse',entry['plannedUse'])==entry['plannedUse'])
    check('Prompt present '+key,(ROOT/a['promptFile']).is_file())
selected = [a for a in manifest['assets'] if a['selected']]
reviewed = {a['path']:a for a in review['assets']}
check('Every selected image independently reviewed',all(a['path'] in reviewed and reviewed[a['path']]['sha256']==sha(a['path']) and reviewed[a['path']]['selected'] for a in selected))
check('Review qualification retained',review['fidelity1to1Validated'] is False and review['engineIntegrated'] is False and all(a['fidelity1to1Validated'] is False for a in review['assets']))
present = sum(bool(e['assetFiles']) for e in cat['entries'])
newly = sum(not old['assetFiles'] and bool(new['assetFiles']) for old,new in zip(base['entries'],cat['entries']))
expected = dict(total=196,withImage=present,withoutImage=196-present,newPngFiles=len(manifest['assets']),selectedNewPngFiles=len(selected),newGeneratedSubjects=len({a['catalogId'] for a in manifest['assets']}),newSelectedSubjects=len({a['catalogId'] for a in selected}),newIllustratedSubjects=newly,historicalAttributionsResolved=len(attributions['associations']),unassignedRecoveredPngFiles=len(attributions['unresolved']),totalGenerationExclusions=len(cat['policy']['automaticRetryExcludedIds']))
check('Catalogue counts',all(cat['currentCounts'][k]==v for k,v in expected.items()),expected)
check('Per-record lot20 counts',all(e['pngCountLot20']==sum(a['catalogId']==e['id'] for a in manifest['assets']) for e in cat['entries']))
check('Historical PNG counts preserved',all(all(old.get(k)==new.get(k) for k in old if re.match(r'pngCountLot\d+$',k) and not (k=='pngCountLot17' and new.get('attributionLot')=='lot20')) for old,new in zip(base['entries'],cat['entries'])))
check('Bible projection',len(index['entries'])==196 and index['authority']['productionSource']==LOT+'/production-catalog.json' and index['counts']['withImageCandidate']==present and index['counts']['withoutImageCandidate']==196-present and all(i['productionSnapshot']['hasImageCandidate']==bool(by_id[i['catalogId']]['assetFiles']) for i in index['entries']))
old_index=json.loads(oldbytes('docs/armax/bible/content-associations.json'))
allowed_keys={'catalogSource','productionSnapshot','lot20AssetAssociations','lot20HistoricalAttribution'}
check('Design relationships retained',all({k:v for k,v in old.items() if k not in allowed_keys}=={k:v for k,v in new.items() if k not in allowed_keys} for old,new in zip(old_index['entries'],index['entries'])))
for a in attributions['associations']:
    e=by_id[a['catalogId']]
    check('New historical attribution '+a['catalogId'],a['path'] in tracked and a['path'] not in manifest_paths and sha(a['path'])==a['sha256'] and a['path'] in e['assetFiles'] and e['imageLot']=='lot17' and e['attributionLot']=='lot20' and e['pngCountLot20']==0)
check('Unresolved images remain unassigned',all(a['catalogId'] is None and a['selected'] is False and not any(a['path'] in e['assetFiles'] for e in cat['entries']) for a in attributions['unresolved']))
paths={p for e in cat['entries'] for p in e['assetFiles']+e['alternateAssetFiles']}
check('All catalogue paths available',all((ROOT/p).is_file() or p in tracked for p in paths),len(paths))
for filename in ['guide-associations.json','common-rules.json','extension-01-specs.json','extension-02-specs.json','EXTENSION_01_EQUIPES_ET_BONUS.md','EXTENSION_02_DEBLOCAGES.md']:
    p='docs/armax/bible/'+filename
    check('Guide content unchanged '+filename,data(p)==oldbytes(p))
coverage=read('docs/armax/bible/guide-coverage-2026-11-27.json')
old_coverage=json.loads(oldbytes('docs/armax/bible/guide-coverage-2026-11-27.json'))
check('Guide registry only changes current-authority description',{k:v for k,v in coverage.items() if k!='currentContentAuthority'}=={k:v for k,v in old_coverage.items() if k!='currentContentAuthority'} and coverage['currentContentAuthority']['path']==old_coverage['currentContentAuthority']['path'])
check('68 requirements retained',len(coverage['requirements'])==68 and coverage['requirements']==old_coverage['requirements'])
for p in sorted(t for t in tracked if t.startswith('docs/armax/guides/')):
    check('Original source unchanged '+Path(p).name,data(p)==oldbytes(p))


def book(p):
    z=zipfile.ZipFile(ROOT/p)
    assert z.testzip() is None
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


old=book('docs/armax/lot19/Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx')
new=book(LOT+'/Mass_Effect_Armax_Suivi_Lot20_2026-11-27.xlsx')
check('Workbook sheet order',new[0]==old[0]+['Revue20'] and old[0]==['Synthese','Catalogue','Recuperes','Attributions19'])
for i in (2,3):
    check('Historical sheet values/formulas retained '+new[0][i],all(all(v.get(k)==new[2][i].get(cell,{}).get(k) for k in ('value','formula')) for cell,v in old[2][i].items()))
check('Workbook identity cells retained',all(old[2][1].get(c+str(r),{}).get('value')==new[2][1].get(c+str(r),{}).get('value') for r in range(6,202) for c in ('A','B','C','D','E','K','L','P')))
check('No saved Excel error cell',not any(c['type']=='e' for sheet in new[2] for c in sheet.values()))
summary_cells={'B13':'total','C13':'withImage','D13':'withoutImage','B18':'newGeneratedSubjects','B19':'newPngFiles','B29':'historicalAttributionsResolved','B30':'newIllustratedSubjects'}
check('Saved summary matches catalogue',all(int(new[2][0][cell]['value'])==expected[key] for cell,key in summary_cells.items()))
for i,e in enumerate(cat['entries']):
    row=str(6+i)
    check('Saved presence/count '+e['id'],new[2][1]['H'+row]['value']==('Présent' if e['assetFiles'] else 'Absent') and int(new[2][1]['R'+row]['value'])==e['pngCountLot20'])
check('Review sheet covers twelve exact IDs',[new[2][4]['A'+str(6+i)]['value'] for i in range(12)]==manifest['targetCatalogIds'])
check('Native review table',any(t.get('name')=='ArmaxRevue20' and t.get('ref')=='A5:N17' for t in new[3]))
check('Native current-lot header',any(t.get('name')=='ArmaxCatalogue' and t.find('m:tableColumns',NS)[17].get('name')=='PNG du lot 20' for t in new[3]))
old_table_names={t.get('name') for t in old[3]}
def table_signature(t):
    return (t.get('name'),t.get('ref'),tuple(sorted(t.find('m:tableStyleInfo',NS).attrib.items())))
check('Historical tables retained',{table_signature(t) for t in old[3]}=={table_signature(t) for t in new[3] if t.get('name') in old_table_names})
for i in (1,2,3):
    check('Frozen panes '+new[0][i],old[1][i].find('.//m:pane',NS).attrib==new[1][i].find('.//m:pane',NS).attrib)
def validations(tree):
    return [(v.attrib,v.findtext('m:formula1',None,NS),v.findtext('m:formula2',None,NS)) for v in tree.findall('.//m:dataValidation',NS)]
check('Catalogue validations retained',validations(old[1][1])==validations(new[1][1]))
wb_report=read(LOT+'/workbook-verification.json')
check('Workbook report digest',sha(wb_report['workbook']['path'])==wb_report['workbook']['sha256'])
check('Workbook preview digests',all(sha(p['path'])==p['sha256'] for p in wb_report['previews']))
changed=subprocess.check_output(['git','diff','--name-only',BASE],cwd=ROOT).decode().splitlines()
untracked=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT).decode().splitlines()
check('Historical lots untouched',not any(re.match(r'(?:docs/armax|public/assets/armax)/lot(?:0[1-9]|1[0-9])/',p) for p in changed))
links=[]
for name in sorted(set(changed+untracked)):
    if not name.endswith('.md') or not (name.startswith('docs/armax/') or name=='README.md'): continue
    for m in re.finditer(r'(?<!!)\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)',(ROOT/name).read_text()):
        href=m.group(1).split('#',1)[0]
        if not href or re.match(r'^[a-zA-Z]+:',href): continue
        resolved=((ROOT/name).parent/href).resolve()
        try: relative=resolved.relative_to(ROOT).as_posix()
        except ValueError: continue
        available=resolved.exists() or relative in tracked or any(p.startswith(relative.rstrip('/')+'/') for p in tracked) or relative==LOT+'/verification.json'
        links.append(dict(source=name,target=href,available=available))
check('Local Markdown targets',all(x['available'] for x in links),[x for x in links if not x['available']])
check('No runtime/dependency changes',not any(p.startswith(('src/','tests/')) or p in ('package.json','package-lock.json','vite.config.js') for p in changed+untracked))
subprocess.run(['git','diff','--check',BASE],cwd=ROOT,check=True)
checks.append(dict(name='git diff --check',passed=True))
report=dict(schemaVersion=1,lot='lot20',date='2026-11-27',baseCommit=BASE,command='python3 scripts/verify-armax-lot20.py',checks=checks,passed=True,counts=cat['currentCounts'],pngs=pngs,localLinksChecked=len(links),historicalFilesCheckedByGitTree=sum(not (ROOT/p).is_file() for p in paths),limits=['File structure, evidence and workbook only.','No certification of exact 1:1 fidelity, animation or gameplay.','No native Microsoft Excel, combat, multiplayer, payment or Windows run.'])
(ROOT/LOT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(checksPassed=len(checks),counts=cat['currentCounts'],localLinksChecked=len(links)),ensure_ascii=False,indent=2))
