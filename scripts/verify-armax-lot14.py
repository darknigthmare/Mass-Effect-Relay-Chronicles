#!/usr/bin/env python3
"""Verify lot14 catalogue continuity, native PNGs, references and bible links."""
import hashlib,json,re,subprocess,sys
from collections import Counter
from pathlib import Path
from urllib.parse import unquote,urlsplit
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'docs/armax/lot14';BASE='06d85522ad0165aedcf96b67948f8b836327c785'
def read(p):return json.loads(Path(p).read_text())
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True)
def old(p):return json.loads(git('show',BASE+':'+p))
errors=[];warnings=[]
def check(ok,msg):
 if not ok:errors.append(msg)
cat=read(D/'production-catalog.json');base=old('docs/armax/lot13/production-catalog.json');man=read(D/'manifest.json');refs=read(D/'reference-library.json');reviews=read(D/'independent-art-review.json');assoc=read(D/'bible-asset-associations.json');wb=read(D/'workbook-verification.json')
git_paths=set(git('ls-tree','-r','--name-only',BASE).splitlines()); entries={e['id']:e for e in cat['entries']};refmap={r['id']:r for r in refs['references']};identity=['category','name','work','dlc','variant','plannedUse']
check(len(entries)==188==len(cat['entries']),'Catalogue must contain188 unique identities')
check(len(base['entries'])==172,'Wrong inherited catalogue')
check(cat['parentCatalogSha256']==hashlib.sha256(git('show',BASE+':docs/armax/lot13/production-catalog.json').encode()).hexdigest(),'Parent catalogue hash mismatch')
for e in base['entries']:
 n=entries.get(e['id'],{});check(all(n.get(k)==e.get(k) for k in identity),'Inherited identity changed: '+e['id'])
 for p in e['assetFiles']+e.get('alternateAssetFiles',[]):check(p in n.get('assetFiles',[])+n.get('alternateAssetFiles',[]),'Inherited image omitted: '+p)
 if e.get('latestGenerationAttempt')=='blocked':check(n.get('latestGenerationAttempt')=='blocked','Historical blocked status changed: '+e['id'])
adds=refs['catalogAdditions'];check(len(adds)==16,'Expected16 additions')
for e in adds:check(all(entries[e['id']].get(k)==e.get(k) for k in identity),'Addition identity mismatch: '+e['id'])
selected=[a for a in man['assets'] if a['selected']];check(len(selected)==20 and len(man['assets'])==21,'PNG subject/revision count mismatch')
check(len({a['path'] for a in man['assets']})==21,'Duplicate asset path')
keys=lambda rows:{(x['catalogId'],x.get('revision','R0'),x['path']) for x in rows}
check(keys(reviews['assets'])==keys(man['assets']),'Independent review coverage differs')
check(len(assoc['associations'])==20,'Missing bible associations')
new_records=[];native_checked=0;input_checked=0;ref_checked=0
for a in man['assets']:
 p=ROOT/a['path'];t=a['technical'];check(p.exists(),'Missing PNG: '+a['path'])
 if not p.exists():continue
 check(sha(p)==t['sha256'],'PNG SHA mismatch: '+a['path']);check(p.stat().st_size==t['byteLength'],'PNG length mismatch: '+a['path'])
 with Image.open(p) as im:
  im.load();check(im.size==(t['width'],t['height']) and im.mode==t['mode'],'PNG geometry mismatch: '+a['path'])
  if a['category']!='stage':check(im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0,'Missing real alpha: '+a['path'])
  else:check(im.mode=='RGB','Unexpected stage mode: '+a['path'])
 native=Path(a['nativeOutputPath'])
 if native.exists():native_checked+=1;check(sha(native)==t['sha256'],'Native PNG modified: '+a['path'])
 check((ROOT/a['promptFile']).is_file(),'Missing exact prompt: '+a['catalogId'])
 original_prompt=Path(a['promptPath'])
 if original_prompt.exists():check(sha(original_prompt)==sha(ROOT/a['promptFile']),'Prompt altered: '+a['catalogId'])
 for rid in a['referenceIds']:check(rid in refmap and rid in cat['sources'],'Undefined reference: '+rid)
 for x in a['orderedGenerationInputs']:
  ip=ROOT/x['path'] if 'path' in x else Path(x['localPathAtGeneration'])
  if ip.exists():input_checked+=1;check(sha(ip)==x['sha256'],'Generation input hash mismatch: '+str(ip))
 check(a['fidelity1to1Validated'] is False and a['engineIntegrated'] is False,'Unsupported status promotion: '+a['catalogId'])
 check(a['review']['independentReview']=='docs/armax/lot14/independent-art-review.json','Review link not resolved: '+a['catalogId'])
 new_records.append({'id':a['catalogId'],'revision':a['revision'],'selected':a['selected'],'path':a['path'],'sha256':t['sha256'],'width':t['width'],'height':t['height'],'mode':t['mode']})
for r in refs['references']:
 p=r.get('localCachePath',r.get('path'))
 if p and Path(p).exists():ref_checked+=1;check(sha(p)==r['sha256'],'Reference hash mismatch: '+r['id'])
for e in cat['entries']:
 check(e['fidelity1to1Validated'] is False,'Unproven1:1 validation: '+e['id'])
 for p in e['assetFiles']+e['alternateAssetFiles']:check((ROOT/p).exists() or p in git_paths,'Missing catalogue image: '+p)
 for sid in e['sourceIds']:check(sid in cat['sources'],'Undefined sourceID: '+sid)
blocked=[e['id'] for e in cat['entries'] if e.get('latestGenerationAttempt')=='blocked'];check(len(blocked)==13,'Wrong preserved exclusion count')
check(not(set(blocked)&{a['catalogId'] for a in man['assets']}),'Excluded subject retried')
check(not any('claymore' in a['path'].lower() for a in man['assets']),'Claymore retry prohibited by production history')
recovered=old('docs/armax/recovery-20261120/asset-inventory.json')
historical=set(a['path'] for a in recovered['assets'])|set(p for e in base['entries'] for p in e['assetFiles']+e['alternateAssetFiles'])
current=historical|{a['path'] for a in man['assets']};check(len(historical)==204,'Historical corpus is not204 originals');check(len(current)==225,'Current corpus is not225 originals');check(historical<=git_paths,'Historical original absent from baseline tree')
modified=set(git('diff','--name-only',BASE).splitlines());allowed={'README.md','docs/armax/README.md','docs/armax/bible/BIBLE_ARMAX_INTEGREE.md','docs/armax/bible/FICHES_ET_LIAISONS.md','docs/armax/bible/guide-associations.json'}
check(not(modified&historical),'Historical PNG modified');unexpected={p for p in modified if p in git_paths and p not in allowed};check(not unexpected,'Unexpected historical mutation: '+str(sorted(unexpected)))
g=read(ROOT/'docs/armax/bible/guide-associations.json');og=old('docs/armax/bible/guide-associations.json');check(g['requirements']==og['requirements'],'Original guide requirements changed');criteria=sum(len(x['acceptanceCriteria']) for x in g['requirements']);check(len(g['requirements'])==30 and criteria==90,'Guide coverage changed')
check(git('show',BASE+':docs/armax/bible/common-rules.json')==(ROOT/'docs/armax/bible/common-rules.json').read_text(),'Combat rules changed')
check(git('show',BASE+':docs/armax/bible/CAMPAGNES_ET_SCENES.md')==(ROOT/'docs/armax/bible/CAMPAGNES_ET_SCENES.md').read_text(),'Narrative scene statuses changed')
links=[]
md_files=list(D.glob('*.md'))+[ROOT/p for p in sorted(allowed) if p.endswith('.md')]
for f in md_files:
 for match in re.finditer(r'\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)',f.read_text()):
  dest=match.group(1)
  if urlsplit(dest).scheme or dest.startswith('#'):continue
  target=unquote(dest.split('#')[0]);p=(f.parent/target).resolve()
  try:rp=p.relative_to(ROOT).as_posix()
  except ValueError:errors.append('Link escapes repo: '+dest);continue
  exists=p.exists() or rp in git_paths or any(x.startswith(rp.rstrip('/')+'/') for x in git_paths)
  check(exists,'Broken link in '+f.relative_to(ROOT).as_posix()+': '+dest);links.append({'source':f.relative_to(ROOT).as_posix(),'target':rp,'exists':exists})
bible=(ROOT/'docs/armax/bible/BIBLE_ARMAX_INTEGREE.md').read_text()
actions={}
def collect_actions(node):
 if isinstance(node,dict):
  if 'id' in node and 'name' in node:actions[node['id']]=node
  for value in node.values():collect_actions(value)
 elif isinstance(node,list):
  for value in node:collect_actions(value)
collect_actions(read(ROOT/'docs/armax/lot04/fighters.json'))
action_links_checked=0
for a in assoc['associations']:
 check(a['catalogId'] in entries,'Association references unknown asset')
 for ref in a['guideRefs']:
  check('id="'+ref.split('#')[1]+'"' in bible,'Unknown guide anchor: '+ref)
 check(not a['runtimeAttachment'] and not a['fullActionDependencyClosed'] and not a['completeNarrativeSceneProduced'],'False integration/scene completion')
 for linked in a['actionAssociations']:
  if linked.get('actionId'):
   action_links_checked+=1
   check(linked['actionId'] in actions,'Missing canonical action ID: '+linked['actionId'])
   check(linked['move']==actions.get(linked['actionId'],{}).get('name'),'Action name does not match exact ID: '+linked['actionId'])
counts={'entries':len(entries),'withImage':sum(bool(e['assetFiles']) for e in entries.values()),'withoutImage':sum(not e['assetFiles'] for e in entries.values()),'categories':dict(Counter(e['category'] for e in entries.values())),'inheritedIdentitiesPreserved':172,'addedEntries':len(adds),'newInheritedIllustratedSubjects':sum(a['catalogId'] in {e['id'] for e in base['entries']} for a in selected),'selectedPngs':len(selected),'newNativePngs':len(man['assets']),'supersededPngs':len(man['assets'])-len(selected),'historicalOriginals':len(historical),'totalOriginals':len(current),'historicalBlockedEntries':len(blocked),'fidelity1to1Certified':0,'nativeOutputsRehashed':native_checked,'referenceImagesRehashed':ref_checked,'orderedGenerationInputsRehashed':input_checked,'independentArtReviews':len(reviews['assets']),'guideSections':len(g['requirements']),'guideAcceptanceCriteria':criteria,'actionIdAssociationsChecked':action_links_checked,'documentedSourceCorrections':len(refs.get('sourceCorrections',[]))}
check(counts['withImage']==128 and counts['withoutImage']==60,'Incorrect coverage')
check(sum(e['pngCountLot14'] for e in entries.values())==21,'PNG count by entry mismatch')
xlsx=D/'Mass_Effect_Armax_Suivi_Lot14_2026-11-25.xlsx';check(sha(xlsx)==wb['xlsxSha256'],'Workbook SHA mismatch');check(wb['visualReviewCompleted'] is True,'Workbook visual QA not complete')
if native_checked!=21:warnings.append('Some scratch native outputs unavailable; repository hashes checked independently.')
report={'schemaVersion':1,'date':'2026-11-25','baseCommit':BASE,'scope':'Catalogue, PNG copies, inputs, references, workbook hash and documentary bible links. No engine or native Excel runtime certification.','counts':counts,'assets':new_records,'historyPreservation':{'pathsVerifiedThroughGit':len(historical),'modifiedHistoricalOriginals':sorted(modified&historical),'unexpectedTrackedChanges':sorted(unexpected)},'markdownLinksChecked':len(links),'nativeExcelOpened':False,'engineTested':False,'errors':errors,'warnings':warnings,'success':not errors}
(D/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(D/'link-verification.json').write_text(json.dumps({'date':'2026-11-25','links':links,'errors':[e for e in errors if 'link' in e.lower()],'success':not any('link' in e.lower() for e in errors)},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'success':not errors,'counts':counts,'errors':errors,'warnings':warnings},ensure_ascii=False,indent=2));sys.exit(bool(errors))
