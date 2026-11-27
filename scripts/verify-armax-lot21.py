#!/usr/bin/env python3
"""Verify the recovered lot21 documentary and static-art delivery, not gameplay."""
import hashlib,json,re,subprocess,sys,zipfile
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path,PurePosixPath
from xml.etree import ElementTree as ET
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE='8542d7ca03702dcf4b3bccd8ac938bd6574f20bc'
LOT='docs/armax/lot21';CAT=f'{LOT}/production-catalog.json';MAN=f'{LOT}/art-production/manifest.json';IDX='docs/armax/bible/content-associations.json';BOOK=f'{LOT}/Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx'
CHECKS=[]
def read(p):return json.loads((ROOT/p).read_text())
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def base(p):return json.loads(git('show',f'{BASE}:{p}'))
def check(name,ok,detail=None):CHECKS.append({'id':name,'passed':bool(ok),'detail':detail})
def xml_book(path):
 ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
 with zipfile.ZipFile(path) as z:
  integrity=z.testzip();strings=[]
  if 'xl/sharedStrings.xml' in z.namelist():strings=[''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
  rels={e.attrib['Id']:e.attrib['Target'] for e in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))};sheets={};errors=[]
  for s in ET.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet',ns):
   target=rels[s.attrib['{'+ns['r']+'}id']];part=target.lstrip('/') if target.startswith('/') else str(PurePosixPath('xl')/target)
   tree=ET.fromstring(z.read(part));cells={};formulas={}
   for c in tree.findall('.//m:sheetData/m:row/m:c',ns):
    addr=c.attrib['r'];typ=c.get('t');v=c.find('m:v',ns);txt=v.text if v is not None else ''
    if typ=='s':value=strings[int(txt)]
    elif typ=='inlineStr':value=''.join(c.find('m:is',ns).itertext())
    elif typ=='b':value=txt=='1'
    elif typ=='e':errors.append((s.attrib['name'],addr,txt));value=txt
    else:
     try:value=float(txt) if txt and '.' in txt else int(txt) if txt else ''
     except ValueError:value=txt
    cells[addr]=value;f=c.find('m:f',ns)
    if f is not None:formulas[addr]=f.text
   sheets[s.attrib['name']]={'cells':cells,'formulas':formulas}
  return sheets,integrity,errors

def main():
 cat=read(CAT);old=base('docs/armax/lot20/production-catalog.json');man=read(MAN);idx=read(IDX);oldidx=base(IDX)
 rows=cat['entries'];lookup={e['id']:e for e in rows};oldlookup={e['id']:e for e in old['entries']};new=rows[196:];completed={'chr_me3_adrien_victus','chr_me3_oleg_petrovsky'}
 check('catalogue_identity_uniqueness',len(lookup)==len(rows)==216)
 check('inherited_order_196',[e['id'] for e in rows[:196]]==[e['id'] for e in old['entries']])
 fields=['id','name','category','work','dlc','variant','plannedUse','priority']
 check('inherited_identity_fields',all(all(e.get(k)==lookup[e['id']].get(k) for k in fields) for e in old['entries']))
 check('twenty_unique_new_identities',len(new)==20 and not set(e['id'] for e in new)&set(oldlookup))
 check('added_identity_registry',cat['addedEntryIds']==[e['id'] for e in new])
 check('baseline_commit_and_digest',cat['baseCommit']==BASE and cat['parentCatalogSha256']==hashlib.sha256(git('show',f'{BASE}:docs/armax/lot20/production-catalog.json')).hexdigest())
 oldpresent={e['id'] for e in old['entries'] if e['assetFiles']};present={e['id'] for e in rows if e['assetFiles']}
 check('historical_presence_preserved',oldpresent<=present)
 check('historical_asset_pointers',all(e['assetFiles']==lookup[e['id']]['assetFiles'] for e in old['entries'] if e['id'] not in completed))
 check('exactly_two_inherited_subjects_completed',(present-oldpresent)&set(oldlookup)==completed)
 check('eight_added_subjects_illustrated',len(present-set(oldlookup))==8)
 check('inherited_missing_35_to_33',len(old['entries'])-len(oldpresent)==35 and 196-len(present&set(oldlookup))==33)
 check('presence_counts',len(present)==171 and len(rows)-len(present)==45)
 check('declared_category_counts',cat['counts']==dict(Counter(e['category'] for e in rows)))
 check('declared_current_counts',cat['currentCounts']['total']==216 and cat['currentCounts']['withImage']==171 and cat['currentCounts']['withoutImage']==45)
 check('all_source_ids_resolve',all(s in cat['sources'] for e in rows for s in e['sourceIds']))
 check('all_candidates_not_certified_or_integrated',all(e['fidelity1to1Validated'] is False and e['engineIntegrated'] is False for e in rows))
 exclusions=set(cat['policy']['automaticRetryExcludedIds']);oldex=set(old['policy']['automaticRetryExcludedIds'])
 check('historical_exclusions_preserved',len(oldex)==29 and oldex<=exclusions)
 check('two_new_exclusions_only',exclusions-oldex=={'wpn_me2_m96_mattock','wpn_me3_m11_suppressor'} and len(exclusions)==31)
 missing={e['id'] for e in rows if not e['assetFiles']};reuse={e['id'] for e in rows if e.get('historicalReuseCandidate')}
 check('missing_partition_30_and_15',len(missing&exclusions)==30 and len(missing-exclusions)==15)
 check('four_reuse_candidates_not_counted_as_png',len(reuse)==4 and reuse<=missing-exclusions and all(not lookup[id]['assetFiles'] for id in reuse))
 check('eleven_other_open_gaps',len(missing-exclusions-reuse)==11)
 check('narrative_roles_preserved',all(lookup[id]['plannedUse']=='narration_support' for id in completed))
 check('current_reference_reviews_and_history',all(lookup[id]['latestReferenceReview']['lot']=='lot21' and lookup[id]['previousReferenceReview']==oldlookup[id]['latestReferenceReview'] for id in completed))
 check('fixed_asset_count',len(man['assets'])==10 and len({a['path'] for a in man['assets']})==10)
 check('seven_recovered_three_generated',sum(a['recoveredThisTurn'] for a in man['assets'])==7 and sum(a['generatedThisTurn'] for a in man['assets'])==3)
 check('five_calls_three_success_two_refusals',len(man['attempts'])==5 and Counter(a['outcome'] for a in man['attempts'])=={'generated':3,'moderation_blocked':2})
 check('no_excluded_subject_retried',not ({a['catalogId'] for a in man['attempts']}&oldex))
 check('refusals_not_counted_or_retried',all(a.get('path') is None and a.get('retryPerformed') is False and not lookup[a['catalogId']]['assetFiles'] for a in man['attempts'] if a['outcome']=='moderation_blocked'))
 check('source_manifests_current',all(sha(x['path'])==x['sha256'] for x in man['sourceManifests']))
 check('qa_report_digests_current',all(sha(x['path'])==x['sha256'] for x in man['qaFiles']))
 check('actual_lot21_png_set',set(str(p.relative_to(ROOT)) for p in (ROOT/'public/assets/armax/lot21').rglob('*.png'))=={a['path'] for a in man['assets']})
 for a in man['assets']:
  id=a['catalogId'];p=ROOT/a['path'];im=Image.open(p);im.load();alpha=im.getchannel('A') if im.mode=='RGBA' else None;tech=a['technical']
  check(id+'_native_sha',sha(a['path'])==tech['sha256'] and p.stat().st_size==tech['bytes'])
  check(id+'_dimensions',im.size==(tech['width'],tech['height']))
  check(id+'_single_frame_rgba',im.format=='PNG' and im.mode=='RGBA' and getattr(im,'n_frames',1)==1)
  check(id+'_real_transparency',alpha is not None and alpha.getextrema()[0]==0 and alpha.getextrema()[1]>=250)
  bbox=alpha.point(lambda x:255 if x>10 else 0).getbbox()
  check(id+'_visible_subject_inside_canvas',bbox is not None and bbox[0]>0 and bbox[1]>0 and bbox[2]<im.width and bbox[3]<im.height,{'alphaThreshold':10,'bbox':list(bbox) if bbox else None})
  check(id+'_prompt_hash',sha(a['promptFile'])==a['promptSha256'])
  qa=read(a['reviewRef']);q=next((e for e in qa['assets'] if e['catalogId']==id),None)
  check(id+'_independent_review_matches',q is not None and q['path']==a['path'] and q['technical']['sha256']==tech['sha256'] and bool(q['reservations']))
  check(id+'_catalogue_association',lookup[id]['assetFiles']==[a['path']] and lookup[id]['status']=='Prototype' and lookup[id]['pngCountLot21']==1)
  check(id+'_fidelity_flags_false',a['fidelity1to1Validated'] is False and a['engineIntegrated'] is False and a['nativeBytesPreserved'] is True)
 check('index_all_identities_in_order',[e['catalogId'] for e in idx['entries']]==[e['id'] for e in rows]);ilookup={e['catalogId']:e for e in idx['entries']}
 check('inherited_design_relationships_preserved',all(all(ilookup[e['catalogId']].get(k)==v for k,v in e.items() if k not in {'catalogSource','productionSnapshot'}) for e in oldidx['entries']))
 check('historical_role_policies_preserved',all(idx['rolePolicies'][k]==v for k,v in oldidx['rolePolicies'].items()))
 check('new_weapon_role_declared',idx['rolePolicies']['arme_candidat']['sheets']==['B','C','J'])
 check('index_presence_and_counts',idx['counts']['catalogEntriesAssociated']==216 and idx['counts']['withImageCandidate']==171 and idx['counts']['withoutImageCandidate']==45 and sum(e['productionSnapshot']['hasImageCandidate'] for e in idx['entries'])==171)
 check('index_current_catalogue_pointers',idx['authority']['productionSource']==CAT and all(e['catalogSource']['path']==CAT for e in idx['entries']))
 check('index_ten_art_associations',sum('lot21AssetAssociation' in e for e in idx['entries'])==10)
 check('index_source_snapshots',all(sha(x['path'])==x['sha256'] for x in idx['sourceSnapshots'] if x.get('lot')=='lot21'))
 gp='docs/armax/bible/guide-coverage-2026-11-27.json';guide=read(gp);oldguide=base(gp)
 check('guide_all_requirements_unchanged',guide['requirements']==oldguide['requirements'] and len(guide['requirements'])==68)
 check('guide_counts_unchanged',guide['counts']==oldguide['counts'])
 protected=[p for p in git('ls-tree','-r','--name-only',BASE,'docs/armax/guides','docs/armax/lot20').decode().splitlines() if (ROOT/p).is_file()]
 check('historical_lot20_and_guide_files_unchanged',all((ROOT/p).read_bytes()==git('show',f'{BASE}:{p}') for p in protected),{'filesChecked':len(protected)})
 allbase=set(git('ls-tree','-r','--name-only',BASE).decode().splitlines())
 check('all_selected_image_paths_exist_in_delivery_or_base',all((ROOT/p).is_file() or p in allbase for e in rows for p in e['assetFiles']))
 audit=read(f'{LOT}/audit/coverage-additions.json');ae=audit.get('entries',audit.get('additions',audit.get('candidates',[])))
 if isinstance(ae,dict):ae=list(ae.values())
 aids={e.get('id',e.get('catalogId',e.get('proposedCatalogId'))) for e in ae}
 check('audit_fifteen_new_identities',len(aids)==15 and aids<={e['id'] for e in new},{'ids':sorted(str(x) for x in aids)})
 sheets,integrity,errors=xml_book(ROOT/BOOK)
 check('workbook_native_bytes_preserved',sha(BOOK)=='0c72622d22bed67d59836477a95006977a5492f485d8b4b462c37f1ee31032c4')
 check('workbook_zip_integrity',integrity is None)
 check('workbook_six_sheets',list(sheets)==['Synthese','Catalogue','Recuperes','Attributions19','Revue20','Revue21'])
 check('workbook_no_serialized_errors',not errors,errors)
 cells=sheets['Catalogue']['cells'];bids=[cells.get(f'L{r}') for r in range(6,222)]
 check('workbook_all_216_ids_in_order',bids==[e['id'] for e in rows])
 check('workbook_presence_171_45',Counter(cells.get(f'T{r}') for r in range(6,222))=={'Présent':171,'Absent':45})
 check('workbook_delivered_generated_recovered',sum(cells.get(f'U{r}',0) or 0 for r in range(6,222))==10 and sum(cells.get(f'X{r}',0) or 0 for r in range(6,222))==7 and sum(cells.get(f'Y{r}',0) or 0 for r in range(6,222))==3)
 check('workbook_exclusions_and_reuse',sum(cells.get(f'V{r}')=='Oui' for r in range(6,222))==31 and sum(cells.get(f'Z{r}')=='Oui' for r in range(6,222))==4)
 check('workbook_current_matches_catalogue',all((cells.get(f'T{r}')=='Présent')==bool(e['assetFiles']) and cells.get(f'G{r}')==e['status'] and cells.get(f'O{r}','')=='\n'.join(e['assetFiles']) for r,e in enumerate(rows,6)))
 ex=read(f'{LOT}/audit/recovered-workbook-entries.json');exrows=ex['rows']+ex['inheritedChangedRows']
 check('reconstruction_twenty_plus_two_rows',len(ex['rows'])==20 and len(ex['inheritedChangedRows'])==2)
 check('reconstructed_current_fields_match_retained_workbook',all(lookup[r['id']]['name']==r['values'][0] and lookup[r['id']]['variant']==r['values'][3] and lookup[r['id']]['productionNote']==r['values'][12] and lookup[r['id']]['sourceUrls']==list(dict.fromkeys((r['values'][13] or '').splitlines())) for r in exrows))
 check('workbook_revue21_formula_links',len(sheets['Revue21']['formulas'])==110 and all(re.search(r"'?Catalogue'?!", f) for f in sheets['Revue21']['formulas'].values()))
 wbp=ROOT/f'{LOT}/workbook-verification.json'
 wbr=read(f'{LOT}/workbook-verification.json') if wbp.is_file() else {}
 check('workbook_fresh_report_and_source_hashes',bool(wbr) and wbr.get('recovery',{}).get('sourceBindingComplete') is True and all(sha(x['path'])==x['sha256'] for x in wbr.get('inputs',{}).values()) and wbr.get('workbook',{}).get('sha256')==sha(BOOK))
 broken=[];markdown=[ROOT/'README.md',ROOT/'docs/armax/README.md',ROOT/'docs/armax/bible/ASSOCIATIONS_CONTENU.md',ROOT/'docs/armax/bible/BIBLE_ARMAX_INTEGREE.md']+list((ROOT/LOT).rglob('*.md'))
 for f in markdown:
  for target in re.findall(r'(?<!!)\[[^\]]*\]\(([^)]+)\)',f.read_text()):
   if re.match(r'(https?://|mailto:|#)',target):continue
   target=target.split('#')[0]
   if not target:continue
   resolved=(f.parent/target).resolve()
   try:rel=str(resolved.relative_to(ROOT))
   except ValueError:broken.append((str(f.relative_to(ROOT)),target));continue
   if not resolved.exists() and rel not in allbase and rel!=f'{LOT}/verification.json':broken.append((str(f.relative_to(ROOT)),target))
 check('local_markdown_links_resolve',not broken,broken)
 changed=set(git('diff','--name-only',BASE).decode().splitlines());allowed={'README.md','docs/armax/README.md',IDX,gp,'docs/armax/bible/ASSOCIATIONS_CONTENU.md','docs/armax/bible/BIBLE_ARMAX_INTEGREE.md'}
 check('changed_scope_has_no_engine_files',all(p in allowed or p.startswith(LOT+'/') or p.startswith('public/assets/armax/lot21/') or p in {'scripts/consolidate-armax-lot21.py','scripts/verify-armax-lot21.py','scripts/build-armax-lot21-workbook.mjs','scripts/verify-armax-lot21-workbook.mjs','scripts/review-armax-lot21-workbook.mjs'} for p in changed),sorted(changed-allowed))
 check('no_historical_png_modified',not any(p in allbase and p.endswith('.png') for p in changed))
 diff=subprocess.run(['git','diff','--check',BASE],cwd=ROOT,capture_output=True,text=True);check('git_diff_whitespace',diff.returncode==0,diff.stdout+diff.stderr)
 result={'schemaVersion':1,'lot':'lot21','baseCommit':BASE,'verifiedAt':datetime.now(timezone.utc).isoformat(),'timezone':'Europe/Paris','scope':'Recovered documentary and static-art delivery; no gameplay tests','checksPassed':sum(c['passed'] for c in CHECKS),'checksTotal':len(CHECKS),'passed':all(c['passed'] for c in CHECKS),'sourceHashes':{p:sha(p) for p in [CAT,MAN,IDX,BOOK]},'checks':CHECKS,'limitations':['No certified1:1 fidelity','No engine integration or gameplay tests','No native Microsoft Excel opening','Lost reference hashes not reconstructed; see recovery documentation']}
 (ROOT/f'{LOT}/verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:result[k] for k in ['passed','checksPassed','checksTotal','sourceHashes']},ensure_ascii=False))
 for c in CHECKS:
  if not c['passed']:print('FAIL',c['id'],json.dumps(c['detail'],ensure_ascii=False))
 return 0 if result['passed'] else 1
if __name__=='__main__':sys.exit(main())
