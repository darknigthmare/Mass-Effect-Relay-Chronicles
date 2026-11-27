#!/usr/bin/env python3
"""Rebuild lot21 documentary projections from immutable lot20 + recovered evidence.
No engine changes, image edits, generation calls, or spreadsheet exports.
"""
import copy
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '8542d7ca03702dcf4b3bccd8ac938bd6574f20bc'
LOT = 'docs/armax/lot21'
CAT = f'{LOT}/production-catalog.json'
MAN = f'{LOT}/art-production/manifest.json'
IDX = 'docs/armax/bible/content-associations.json'
WORKBOOK = f'{LOT}/Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx'
QA = [f'{LOT}/qa/recovered-art-review.json', f'{LOT}/qa/new-weapons-independent-review.json', f'{LOT}/qa/swarmer-independent-review.json']
SUBMAN = [f'{LOT}/art-production/locust/manifest.json', f'{LOT}/art-production/new-weapons/manifest.json', f'{LOT}/art-production/complements/manifest.json']
GEN = {'wpn_me2_m12_locust', 'wpn_me2_m5_phalanx', 'chr_me3_swarmer'}
REFUSED = {'wpn_me2_m96_mattock': 'df917ba3-3838-4ef4-9213-cb6436ae6e4e', 'wpn_me3_m11_suppressor': 'f477b460-6a7c-4972-bce3-5d3408e51d36'}
REUSE = {
 'chr_me1_geth_rocket_trooper': {'assetPath': 'public/assets/frontier-enemies.png', 'frameId': 'rocket-geth'},
 'chr_me1_geth_juggernaut': {'assetPath': 'public/assets/frontier-enemies.png', 'frameId': 'juggernaut'},
 'chr_me1_geth_destroyer': {'assetPath': 'public/assets/enemy-geth-destroyer-combat.png', 'frameId': None, 'qualification': 'Quatre poses RPG ; arme générique non certifiée.'},
 'chr_mea_adhi_wild': {'assetPath': 'public/assets/horizon-fauna.png', 'frameId': 'adhi-mea', 'qualification': 'Variante sauvage/dressée non certifiée.'},
}

def read(path): return json.loads((ROOT / path).read_text())
def digest(path): return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
def base_bytes(path): return subprocess.check_output(['git', 'show', f'{BASE}:{path}'], cwd=ROOT)
def base_json(path): return json.loads(base_bytes(path))
def write(path, data):
 p=ROOT/path; p.parent.mkdir(parents=True, exist_ok=True)
 p.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n' if not isinstance(data,str) else data)
def md(s): return str(s or '').replace('|','\\|').replace('\n',' ; ')

def main():
 evidence=read(f'{LOT}/audit/recovered-workbook-entries.json')
 assert evidence['rows'] and len(evidence['rows'])==20
 baseline=base_json('docs/armax/lot20/production-catalog.json')
 cat=copy.deepcopy(baseline)
 by_id={e['id']:e for e in cat['entries']}
 reviews={a['catalogId']:(a,p) for p in QA for a in read(p)['assets']}
 assert len(reviews)==10
 for e in cat['entries']: e['pngCountLot21']=0
 categories={'Personnages / ennemis':'personnage','Armes':'arme','Accessoires':'accessoire'}
 roles={'Opposant proposé':'opposant_candidat','Arme proposée':'arme_candidat','Accessoire proposé':'accessoire_candidat'}
 attempts={'Généré':'generated','Récupéré':'recovered','Bloqué':'blocked','Non produit':'not_attempted'}
 all_rows=evidence['rows']+evidence['inheritedChangedRows']
 added_ids=[]
 for row in all_rows:
  v=row['values']; id=row['id']; new=id not in by_id
  if new:
   e={'id':id,'category':categories[v[1]],'name':v[0],'work':v[2],'dlc':v[4] or None,'variant':v[3],'plannedUse':roles[v[10]],'priority':v[5], 'addedInLot':'lot21','alternateAssetFiles':[], 'assetAvailabilityEvidence':[]}
   e.update({f'pngCountLot{n:02d}':0 for n in [7,8,9,10, 11,12,13,14,16,17,18,19,20]})
   cat['entries'].append(e);by_id[id]=e;added_ids.append(id)
  else:e=by_id[id]
  source_urls=list(dict.fromkeys(str(v[13] or '').splitlines()))
  e.update({'status':v[6], 'assetPresence':'present_candidate' if v[19]=='Présent' else 'manquant_dans_lots_armax_audites', 'assetFiles':[v[14]] if v[14] else [], 'fidelity1to1Validated':False,'engineIntegrated':False,'productionNote':v[12], 'sourceUrls':source_urls,'latestGenerationAttempt':attempts[v[8]],'imageLot':v[16] or '', 'pngCountLot21':int(v[20] or 0),'selectedPngCountLot21':int(v[22] or 0), 'recoveredPngCountLot21':int(v[23] or 0), 'generatedPngCountLot21':int(v[24] or 0), 'automaticRetryExcluded':id in REFUSED, 'referenceReadiness':'prototype_visuel_avec_reserves' if v[19]=='Présent' else 'reference_exacte_et_production_a_completer'})
  e.setdefault('sourceIds',[])
  for url in source_urls:
   if not url:continue
   source_id='lot21_ref_'+hashlib.sha256(url.encode()).hexdigest()[:12]
   cat['sources'].setdefault(source_id,{'title':'Référence lot21 — voir audit ou revue du sujet','url':url,'sourceType':'reference_qualified_in_lot21_evidence','checkedOn':'2026-11-27','qualification':'La source documente seulement les éléments explicités dans la revue ; aucune preuve 1:1 globale.'})
   if source_id not in e['sourceIds']:e['sourceIds'].append(source_id)
  if 'latestReferenceReview' in e:e['previousReferenceReview']=copy.deepcopy(e['latestReferenceReview'])
  if id in reviews:
   art,qa=reviews[id]
   e['referenceGap']=' '.join(art.get('reservations',[]))
   e['latestReferenceReview']={'lot':'lot21','manifestRef':MAN,'reviewRef':qa,'outcome':'candidate_with_reservations','reason':e['referenceGap'],'sourceUrls':art['sourceUrls']}
   e['assetAvailabilityEvidence'].append({'path':v[14],'sha256':digest(v[14]),'evidence':'native_png_checked_after_recovery','lot':'lot21','generatedThisTurn':id in GEN})
  else:
   e['referenceGap']=v[12]
   e['latestReferenceReview']={'lot':'lot21','manifestRef':MAN,'outcome':'moderation_blocked' if id in REFUSED else 'reuse_review_pending' if id in REUSE else 'reference_or_production_gap','reason':v[12]}
  if id in REUSE:
   e['historicalReuseCandidate']=dict(REUSE[id],selectedForArmax=False,newPngCount=0)
  if id in REFUSED:
   e['latestRefusal']={'requestId':REFUSED[id],'errorCode':'moderation_blocked','stage':'output','returnedCategories':['illicit'],'retryPerformed':False,'pngReturned':False}
  if id=='prop_me1_eden_prime_prothean_beacon':e['specificBibleSheets']=['B','F','G','J']
 cat['remainingCoverage'] = [x.replace('Les 35 manquants mesurent', 'Les 45 manquants courants mesurent') for x in cat['remainingCoverage']]
 cat['remainingCoverage'].append('Lot21 : dix candidats fixes avec réserves ; aucune certification 1:1, pose supplémentaire, animation ou nouvelle intégration moteur. Quatre pistes de réemploi restent sans image Armax sélectionnée.')
 exclusions=baseline['policy']['automaticRetryExcludedIds']+list(REFUSED)
 cat['policy']['automaticRetryExcludedIds']=exclusions
 cat['policy']['weaponsAreSeparateFromHoldersAndActions']=True
 cat['policy']['nativeImagesPreservedDuringRecovery']=True
 cats=dict(Counter(e['category'] for e in cat['entries']))
 counts={'total':216,'withImage':171,'withoutImage':45,'certified1to1':0,'stageMasters':52,'stageLayers':5,'newPngFiles':3,'selectedNewPngFiles':3,'newGeneratedSubjects':3,'newSelectedSubjects':10,'newIllustratedSubjects':10,'historicalAttributionsResolved':0,'previouslyUnillustratedInheritedSubjectsNowIllustrated':2,'newInheritedIllustratedSubjects':2,'newAddedIllustratedSubjects':8,'recoveredPngFilesThisTurn':7,'deliveredPngFilesThisTurn':10,'unassignedRecoveredPngFiles':0,'totalGenerationExclusions':31,'withoutImageAutomaticRetryExcluded':30,'withoutImageReferenceGap':15,'withoutImageReuseCandidates':4,'withoutImageReferenceOrProductionGapExcludingReuse':11,'newGenerationRefusals':2,'inheritedWithoutImageRemaining':33}
 cat.update({'catalogId':'armax-production-catalog-lot21','revisionLot':'lot21','updatedOn':'2026-11-27','parentCatalog':'docs/armax/lot20/production-catalog.json','baseCommit':BASE,'parentCatalogSha256':hashlib.sha256(base_bytes('docs/armax/lot20/production-catalog.json')).hexdigest(),'carriedForwardEntries':196,'addedEntries':20,'addedEntryIds':added_ids,'totalEntries':216,'counts':cats,'currentCounts':counts,'baselineCounts':{'total':196,'withImage':161,'withoutImage':35},'researchReferenceFile':MAN,'scope':'Sprites fixes et audit ciblé des lacunes. 196 identités héritées et20 ajouts ; pas un inventaire exhaustif de la franchise. Fidélité 1:1 et moteur non certifiés.','accountingNote':'161 candidats hérités + 2 anciennes fiches complétées + 8 nouvelles identités illustrées =171/216 ; 7 PNG récupérés et3 générés. 45 sans image =30 exclus +15 ouverts (4 pistes de réemploi et11 lacunes).','recoveryRef':f'{LOT}/RECUPERATION_TECHNIQUE.md','workbookRecoveryEvidence':f'{LOT}/audit/recovered-workbook-entries.json'})
 assert sum(bool(e['assetFiles']) for e in cat['entries'])==171
 write(CAT,cat)
 # Ten delivered candidates, five calls (not seventeen), two unchanged refusals.
 assets=[]
 for e in cat['entries']:
  if e['id'] not in reviews:continue
  a,qa=reviews[e['id']]
  assets.append({'catalogId':e['id'],'assetId':'lot21_'+e['id'],'name':e['name'],'work':e['work'],'dlc':e['dlc'],'variant':e['variant'],'plannedUse':e['plannedUse'],'path':a['path'],'selected':True,'status':'Prototype','fidelity1to1Validated':False,'engineIntegrated':False,'generationStatus':'generated_this_turn' if e['id'] in GEN else 'recovered_unpublished','generatedThisTurn':e['id'] in GEN,'recoveredThisTurn':e['id'] not in GEN,'assetKind':'single_fixed_weapon_profile' if e['category']=='arme' else 'single_fixed_subject_pose','promptFile':a['promptFile'],'promptSha256':digest(a['promptFile']),'sourceUrls':a['sourceUrls'],'technical':a['technical'],'reviewNotes':a.get('observations',[])+a.get('reservations',[]),'reviewRef':qa,'nativeBytesPreserved':True})
 attempts_list=[{'catalogId':a['catalogId'],'outcome':'generated','path':a['path'],'selected':True,'nativeBytesPreserved':True,'sha256':a['technical']['sha256']} for a in assets if a['generatedThisTurn']]
 for path in SUBMAN:
  d=read(path)
  for a in d['assets']:
   if a['catalogId'] in REFUSED:attempts_list.append({'catalogId':a['catalogId'],'outcome':'moderation_blocked','path':None,'selected':False,'promptFile':a['promptPath'],'requestId':REFUSED[a['catalogId']],'automaticRetryExcluded':True,'retryPerformed':False})
 manifest={'schemaVersion':1,'lot':'lot21','createdOn':'2026-11-27','timezone':'Europe/Paris','baseCommit':BASE,'generationTool':'image_gen.imagegen (built-in)','generationMode':'single_static_subject_with_inspected_reference','fidelity1to1Validated':False,'engineIntegrated':False,'counts':{'deliveredPng':10,'recoveredPng':7,'generatedPng':3,'generationCalls':5,'generationRefusals':2,'selectedCandidates':10,'engineIntegrated':0,'certified1to1':0},'sourceManifests':[{'path':p,'sha256':digest(p)} for p in SUBMAN],'assets':assets,'attempts':attempts_list,'qaFiles':[{'path':p,'sha256':digest(p)} for p in QA],'targetCatalogIds':[a['catalogId'] for a in assets]+list(REFUSED),'referencePolicy':'Les sources textuelles établissent une identité, pas une géométrie 1:1 ; toutes les réserves de revue restent actives. Références tierces hors dépôt.','qaScope':'PNG natifs, dimensions, empreintes, transparence et vues compositées ; aucun gameplay ni filtrage moteur testé.','recoveryRef':f'{LOT}/RECUPERATION_TECHNIQUE.md','referenceSearches':f'{LOT}/audit/coverage-additions.json'}
 write(MAN,manifest)
 # Preserve all existing design relationships and update only current projections.
 index=base_json(IDX)
 index.update({'indexId':'content-associations-lot21-2026-11-27','baseCommit':BASE,'date':'2026-11-27','previousIndexRef':{'path':IDX,'commit':BASE,'sha256':hashlib.sha256(base_bytes(IDX)).hexdigest()}})
 index['authority'].update({'productionSource':CAT,'snapshotRule':'196 identités héritées conservées ;20 ajouts distincts ; compteurs courants dérivés du lot21.','currentGuideRequirementCount':68})
 policy={'label':'Arme candidate','sheets':['B','C','J'],'purpose':'Documenter objet, opus, variante et éventuelle action séparément de son porteur.','qualification':'Un profil ne prouve ni équipement en main, ni attaque, ni kit ou sélection jouable.','plannedUse':'arme_candidat','guideRequirementIds':['ARMAX-G02','ARMAX-G03','ARMAX-G05','ARMAX-G16','ARMAX-G17','ARMAX-G18','ARMAX-G22','ARMAX-G26','ARMAX-G27'],'sheetContractRef':'docs/armax/bible/FICHES_ET_LIAISONS.md','sheetAssignmentMeaning':'Cadre à compléter ; pas fiche d’action terminée.'}
 policy['guideRefs']=['docs/armax/bible/BIBLE_ARMAX_INTEGREE.md#g'+v[-2:] for v in policy['guideRequirementIds']]
 index['rolePolicies']['arme_candidat']=policy
 existing={e['catalogId']:e for e in index['entries']}
 for e in cat['entries']:
  id=e['id'];role=e['plannedUse'];rp=index['rolePolicies'][role]
  if id in existing:x=existing[id]
  else:
   x={'catalogId':id,'name':e['name'],'category':e['category'],'work':e['work'],'dlc':e['dlc'],'variant':e['variant'],'plannedUse':role,'policyRef':role,'bibleSheets':e.get('specificBibleSheets',rp['sheets']),'guideRequirementIds':rp['guideRequirementIds'],'readerRef':'docs/armax/bible/ASSOCIATIONS_CONTENU.md#'+id,'designLinks':[{'sourcePath':f'{LOT}/BIBLE_COMPLEMENTS_LOT21.md','relation':'documentary_proposal_only','gameplayImplemented':False}],'existingLotAssociation':None,'contextNotes':[],'designBindingState':'lot21_documentary_proposal_not_runtime'}
   index['entries'].append(x)
  x['catalogSource']={'path':CAT,'collection':'entries','id':id}
  x['productionSnapshot']={'status':e['status'],'hasImageCandidate':bool(e['assetFiles']),'fidelity1to1Validated':e['fidelity1to1Validated'],'engineIntegrated':e['engineIntegrated']}
  if id in reviews:x['lot21AssetAssociation']={'path':e['assetFiles'][0],'manifest':MAN,'reviewRef':reviews[id][1],'generatedThisTurn':id in GEN,'fidelity1to1Validated':False,'engineIntegrated':False}
  if id in REUSE:x['historicalReuseCandidate']=e['historicalReuseCandidate']
 index['counts'].update({'catalogEntriesAssociated':216,'byCategory':cats,'byPlannedUse':dict(Counter(e['plannedUse'] for e in cat['entries'])),'withImageCandidate':171,'withoutImageCandidate':45,'newImages':3,'selectedNewImages':3,'recoveredImagesThisTurn':7,'lot21AssetAssociations':10,'lot21AddedIdentities':20,'newCombatKits':0,'newPlayableContent':0,'newFidelityCertifications':0})
 index['sourceSnapshots'] += [{'path':p,'sha256':digest(p),'lot':'lot21'} for p in [CAT,MAN,f'{LOT}/BIBLE_COMPLEMENTS_LOT21.md']]
 write(IDX,index)
 guide=base_json('docs/armax/bible/guide-coverage-2026-11-27.json')
 guide['currentContentAuthority'].update({'productionCatalog':CAT,'scope':'Projection courante lot21 :216 fiches. Les 68 exigences,204 critères et40 scénarios planifiés conservent leur contenu et leur état non exécuté.'})
 write('docs/armax/bible/guide-coverage-2026-11-27.json',guide)
 # Current navigation. Historical sections remain explicit and unmodified in scope.
 summary='**216 fiches :171avecimage candidate et45sans**. Le lot21 conserve196 identités et en ajoute20. Il livre **10 PNG :7récupérés et3 générés**, pour2anciennes fiches complétées et8nouvelles identités illustrées. Dans le périmètre hérité, les manquants passent de 35 à 33. La fidélité 1:1 et l’intégration moteur restent non certifiées.'
 summary=summary.replace('216 fiches :171avecimage candidate et45sans','216 fiches : 171 avec image candidate et 45 sans').replace('conserve196 identités','conserve 196 identités').replace('ajoute20','ajoute 20').replace('10 PNG :7récupérés et3 générés','10 PNG : 7 récupérés et 3 générés').replace('pour2anciennes','pour 2 anciennes').replace('et8nouvelles','et 8 nouvelles').replace('de 35 à 33','de 35 à 33').replace('fidélité 1:1','fidélité 1:1')
 text=base_bytes('README.md').decode()
 text=re.sub(r'### Continuation courante — lot 20\n.*?(?=### Historique — lot 19)', '### Continuation courante — lot 21\n\nLe [lot21](docs/armax/lot21/README.md) actualise les sprites fixes et la bible. '+summary+' La [bible complémentaire](docs/armax/lot21/BIBLE_COMPLEMENTS_LOT21.md) distingue personnages narratifs, ennemis, armes, accessoires et pistes de réemploi. Le [lot20](docs/armax/lot20/README.md) reste historique.\n\n', text, flags=re.S)
 text=text.replace('196 fiches du catalogue lot 20','216 fiches du catalogue lot 21').replace('**161 avec image candidate et 35 sans**','**171 avec image candidate et 45 sans**')
 write('README.md',text)
 text=base_bytes('docs/armax/README.md').decode().replace('Associations des 196 fiches','Associations des 216 fiches').replace('suivi artistique courant est celui du lot 20','suivi artistique courant est celui du lot 21')
 text=text.replace('## Lot 20 — continuation courante', '## Lot 20 — historique').replace('[catalogue courant](lot20/production-catalog.json)', '[catalogue historique](lot20/production-catalog.json)')
 p=text.find('\n## Lot 20')
 assert p>=0
 section='\n## Lot 21 — continuation courante\n\n'+summary+'\n\n[Livraison](lot21/README.md) · [Manquants](lot21/MANQUANTS_2026-11-27.md) · [Bible complémentaire](lot21/BIBLE_COMPLEMENTS_LOT21.md) · [Classeur](lot21/Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx). Les 68 rubriques et 204 critères des guides sont conservés ; aucun des 40 scénarios de gameplay n’est exécuté ici.\n'
 text=text[:p]+section+text[p:];write('docs/armax/README.md',text)
 text=base_bytes('docs/armax/bible/BIBLE_ARMAX_INTEGREE.md').decode()
 text=text.replace('continuation artistique courante est le lot 20','continuation artistique courante est le lot 21').replace('| 196 fiches rattachées','| 216 fiches rattachées').replace('[Catalogue courant lot 20](../lot20/production-catalog.json) et [bilan](../lot20/README.md)','[Catalogue courant lot 21](../lot21/production-catalog.json) et [bilan](../lot21/README.md)')
 text=re.sub(r'## Reprise courante — lot 20\n.*?(?=## Intégration historique)', '## Reprise courante — lot 21\n\n'+summary+' Le [catalogue](../lot21/production-catalog.json), le [bilan](../lot21/README.md) et la [bible complémentaire](../lot21/BIBLE_COMPLEMENTS_LOT21.md) portent la reprise. Les30 exclusions parmi 45 fiches sans image restent respectées ; 15 fiches ouvertes comprennent 4 pistes de réemploi. Les 68 rubriques et 204 critères restent documentaires. Le [lot20](../lot20/README.md) conserve son résultat historique.\n\n',text,flags=re.S)
 text=text.replace('chacune des **196 fiches**','chacune des **216 fiches**').replace('22 boss candidats, 31 adversaires et 25 soutiens narratifs','22 boss candidats, 42 adversaires et 25 soutiens narratifs').replace('5 calques et 14 effets/projectiles/accessoires','5 calques, 15 effets/projectiles/accessoires et 8 armes').replace('sans les ajouter aux 196 lignes','sans les ajouter aux 216 lignes').replace('liés au [lot 20](../lot20/README.md)','liés au [lot 21](../lot21/README.md)')
 write('docs/armax/bible/BIBLE_ARMAX_INTEGREE.md',text)
 text=base_bytes('docs/armax/bible/ASSOCIATIONS_CONTENU.md').decode().replace('196 fiches du catalogue lot 20','216 fiches du catalogue lot 21').replace('196 identités héritées du lot 18','196 identités héritées du lot 20').replace('[catalogue courant](../lot20/production-catalog.json)','[catalogue courant](../lot21/production-catalog.json)')
 text=text.replace('La projection courante reprend les apports vérifiés des lots17–18','La projection historique des lots17–18 reprend leurs apports vérifiés').replace('Les relations de conception antérieures restent conservées.','La projection courante lot21 repart du commit `'+BASE+'`. Les relations de conception antérieures restent conservées.')
 text=re.sub(r'## Continuation courante — lot 20\n.*?(?=## Continuation historique)', '## Continuation courante — lot 21\n\n'+summary+' Les [preuves](../lot21/README.md), [manquants](../lot21/MANQUANTS_2026-11-27.md) et [compléments de bible](../lot21/BIBLE_COMPLEMENTS_LOT21.md) portent cette continuation. Le [lot20](../lot20/README.md) reste historique.\n\n',text,flags=re.S)
 text=text.replace('| Personnages et adversaires | 87 | 68 | 19 |','| Personnages et adversaires | 98 | 74 | 24 |').replace('| Accessoires | 5 | 5 | 0 |','| Accessoires | 6 | 5 | 1 |\n| Armes | 8 | 4 | 4 |').replace('| **Total** | **196** | **161** | **35** |','| **Total** | **216** | **171** | **45** |').replace('| Adversaire candidat | 31 |','| Adversaire candidat | 42 |').replace('| Accessoire candidat | 5 |','| Accessoire candidat | 6 |').replace('Les 87 fiches de personnages','Les 98 fiches de personnages').replace('31 adversaires candidats','42 adversaires candidats').replace('catalogue courant lot 20','catalogue courant lot 21')
 text=text.replace('| Calque de décor — `calque_decor` |','| Arme candidate | 8 | B, C, J | Objet, porteur et action séparés ; aucun équipement ou kit créé par un profil. |\n| Calque de décor — `calque_decor` |')
 for row in evidence['inheritedChangedRows']:
  id=row['id'];text=re.sub(r'(^\| <a id="'+re.escape(id)+r'".*?\|.*?\|).*?(\|.*$)',r'\1 Image candidate lot21, réserves conservées \2',text,flags=re.M)
 text=text.replace('[manquants courants](../lot20/','[manquants courants](../lot21/').replace('[classeur lot20](../lot20/Mass_Effect_Armax_Suivi_Lot20_','[classeur lot21](../lot21/Mass_Effect_Armax_Suivi_Lot21_').replace('[vérification courante](../lot20/','[vérification courante](../lot21/').replace('[bilan du lot20](../lot20/README.md) portent la reprise actuelle des 196 fiches','[bilan du lot21](../lot21/README.md) portent la reprise actuelle des 216 fiches')
 text+='\n## Ajouts du lot21 : vingt identités distinctes\n\nCes fiches suivent les cadres du rôle et les [compléments de bible](../lot21/BIBLE_COMPLEMENTS_LOT21.md). Aucun nouveau kit exécutable.\n\n| Identifiant et sujet | Opus / variante | Présence | Rôle / fiches |\n|---|---|---|---|\n'
 for id in added_ids:
  e=by_id[id];rp=index['rolePolicies'][e['plannedUse']]
  text+=f'| <a id="{id}"></a>`{id}` — {md(e["name"])} | {md(e["work"])} — {md(e["variant"])} | '+('Image candidate lot21' if e['assetFiles'] else 'Sans image — refus sans relance' if id in REFUSED else 'Sans image — piste de réemploi' if id in REUSE else 'Sans image')+f' | {md(rp["label"])} / {", ".join(e.get("specificBibleSheets",rp["sheets"]))} |\n'
 write('docs/armax/bible/ASSOCIATIONS_CONTENU.md',text)
 missing=[e for e in cat['entries'] if not e['assetFiles']]
 open_missing=[e for e in missing if e['id'] not in exclusions]
 closed_missing=[e for e in missing if e['id'] in exclusions]
 text='# Armax — manquants au27 novembre 2026 / lot21\n\n'+summary+'\n\n**45 fiches sans image :30exclues des relances automatiques +15ouvertes.** Les 15 ouvertes comprennent 4 pistes de réemploi RPG et11 lacunes de référence ou de production. Les chiffres portent sur ce catalogue, pas sur l’achèvement de toute la franchise.\n\n## Fiches ouvertes\n\n| ID / sujet | Opus / variante | Prochaine preuve nécessaire |\n|---|---|---|\n'
 for e in open_missing:
  gap=e.get('referenceGap') or e['productionNote']
  text+=f'| `{e["id"]}` — {md(e["name"])} | {md(e["work"])} — {md(e["variant"])} | '+('Piste de réemploi : '+md(REUSE[e['id']]['assetPath'])+'. ' if e['id'] in REUSE else '')+md(gap)+' |\n'
 text+='\n## Exclusions sans image\n\nAucune nouvelle tentative automatique sur ces30 fiches. Les 29 exclusions héritées sont conservées ; Kallo possède déjà une image et n’apparaît donc pas dans cette table. Mattock et Suppressor ajoutent 2 refus sans PNG et sans relance.\n\n| ID / sujet | Opus / variante | État |\n|---|---|---|\n'
 for e in closed_missing:text+=f'| `{e["id"]}` — {md(e["name"])} | {md(e["work"])} — {md(e["variant"])} | '+('Refus lot21 ; aucun PNG' if e['id'] in REFUSED else 'Exclusion historique conservée')+' |\n'
 text+='\n## Les présences ne ferment pas toute la production\n\nLes171 fiches illustrées peuvent encore manquer de vues, poses, animations, effets, plans de campagne ou intégration. Toutes les nouvelles images restent Prototype et non certifiées 1:1. Les réserves par asset figurent au [manifeste](art-production/manifest.json), à la [bible complémentaire](BIBLE_COMPLEMENTS_LOT21.md) et dans les revues. Le [classeur](Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx) garde ses colonnes historiques lot20 et ses colonnes courantes lot21 séparées.\n'
 write(f'{LOT}/MANQUANTS_2026-11-27.md',text)
 text='# Armax — lot21 : sprites fixes, audit et compléments de bible\n\n**27 novembre 2026 — Europe/Paris. Base publiée : `'+BASE+'` ; continuation de la PR #11.**\n\n'+summary+'\n\n## Livrables\n\n- [Catalogue courant](production-catalog.json) et [liste complète des45 manquants](MANQUANTS_2026-11-27.md).\n- [Bible complémentaire du lot21](BIBLE_COMPLEMENTS_LOT21.md) et [bible intégrée](../bible/BIBLE_ARMAX_INTEGREE.md).\n- [Classeur actualisé](Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx), [contrôle du classeur](workbook-verification.json) et [revue visuelle](workbook-visual-review.md).\n- [Audit ciblé des15 ajouts supplémentaires](audit/coverage-additions.md), distinct des5 identités ajoutées par récupération.\n- [Manifeste des10 PNG](art-production/manifest.json), prompts et références qualifiées.\n- [Vérification finale](verification.json) et [relecture indépendante de consolidation](qa/consolidation-review.md).\n- [Reconstitution technique](RECUPERATION_TECHNIQUE.md) : octets des images et du classeur préservés, documents et contrôles reconstitués explicitement.\n\n## Dix PNG effectivement livrés\n\n| Sujet | Opus / variante | Origine de cette livraison | PNG |\n|---|---|---|---|\n'
 for a in assets:text+=f'| {md(a["name"])} | {md(a["work"])} — {md(a["variant"])} | '+('Généré ce tour' if a['generatedThisTurn'] else 'Récupéré, auparavant non publié')+f' | [{Path(a["path"]).name}](../../../{a["path"]}) |\n'
 text+='\nUn seul sujet par image, pose fixe et alpha réel. Les sept récupérations ne sont pas comptées comme de nouvelles générations. Les3 nouveaux PNG proviennent de5 appels :3 réussites et2 refus (Mattock, Suppressor), conservés sans relance. Aucune retouche locale des PNG natifs.\n\n## Comptes comparables\n\n| Mesure | Lot20 historique | Lot21 courant |\n|---|---:|---:|\n| Fiches |196|216|\n| Avec image candidate |161|171|\n| Sans image |35|45|\n| Manquants du périmètre hérité |35|33|\n| Ajouts de fiches |0|20|\n| Fidélité 1:1 certifiée |0|0|\n\nLe passage à 45 fiches sans image tient à l’élargissement du suivi :196 anciens +20 ajouts. Deux anciennes fiches sont complétées, huit nouveaux sujets sont illustrés et douze nouveaux restent sans image. Les45 sans image comprennent 30 exclusions et 15 fiches ouvertes (4 réemplois à examiner, 11 lacunes de référence/production). Les 31 exclusions totales comprennent aussi Kallo, déjà illustré.\n\n## Fidélité et limites\n\nLes revues [sept récupérés](qa/recovered-art-review.md), [Locust/Phalanx](qa/new-weapons-independent-review.md) et [Swarmer](qa/swarmer-independent-review.md) distinguent les ressemblances et les écarts. Bas des tenues de Victus/Petrovsky insuffisamment documenté ; petite inscription de l’Eviscerator incorrecte/illisible ; détails et usure du Locust, microtextures du Phalanx et intensité de l’optique du Swarmer encore interprétés. Plusieurs marges sont plus courtes que le brief, sans rognage du sujet observé. Le filtrage moteur reste à vérifier.\n\nLa catégorie arme sépare l’objet de son porteur et de l’action. Les soutiens narratifs ne reçoivent aucun pouvoir. Seeker ME2 et Swarmer ME3, Harvester ME3 et version organique ME2, Adhi sauvage et Adhi dressé restent distincts. Les 196 identités héritées, les sources originales du guide et les fichiers des lots précédents restent conservés.\n\n## Guide, extensions et validation\n\nLes trois [sources originales](../guides/README.md),68 rubriques,204 critères et40 scénarios planifiés sont conservés. Les scénarios de gameplay restent non exécutés. Le script `python scripts/verify-armax-lot21.py` vérifie les fichiers de cette livraison ; les revues indépendantes qualifient leur portée. Aucun test de combat, réseau, paiement, animation, Microsoft Excel natif ou lancement Windows n’est déclaré. Le moteur et ses dépendances ne sont pas modifiés.\n\n## Historique\n\n[Lot20](../lot20/README.md) · [Lot19 et extensions](../lot19/README.md) · [Dossier Armax](../README.md).\n'
 write(f'{LOT}/README.md',text)
 print(json.dumps({'catalogue':counts,'catalogueSha256':digest(CAT),'manifestSha256':digest(MAN),'indexSha256':digest(IDX)},ensure_ascii=False))

if __name__=='__main__':main()
