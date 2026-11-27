#!/usr/bin/env python3
"""Consolidate verified lot17 recovery and lot18 images; never edit historical lots."""
from pathlib import Path
from collections import Counter
import copy
import hashlib
import json
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = '1e3cea80b1a6ec81d7ca6df8ad70d96988973f10'
IDENTITY = ('category', 'name', 'work', 'dlc', 'variant', 'plannedUse')
DATE = '2026-11-25'

def read(path):
    return json.loads((ROOT / path).read_text())

def write(path, data):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()

def technical(path):
    p = ROOT / path
    with Image.open(p) as image:
        image.load()
        a = image.getchannel('A')
        hist = a.histogram()
        return dict(width=image.width, height=image.height, mode=image.mode,
                    bytes=p.stat().st_size, sha256=sha(path), nativeSha256=sha(path),
                    frameCount=getattr(image, 'n_frames', 1), alphaExtrema=list(a.getextrema()),
                    alphaBBox=list(a.getbbox()),
                    alphaBBoxAt128=list(a.point(lambda n: 255 if n >= 128 else 0).getbbox()),
                    alphaPixelCounts=dict(transparent=hist[0], opaque=hist[255], partial=sum(hist[1:255])))

def counts(catalog):
    entries = catalog['entries']
    with_image = sum(bool(e['assetFiles']) for e in entries)
    catalog['counts'] = dict(Counter(e['category'] for e in entries))
    catalog['totalEntries'] = len(entries)
    catalog['currentCounts'] = dict(total=len(entries), withImage=with_image,
        withoutImage=len(entries)-with_image, certified1to1=0,
        stageMasters=sum(e['plannedUse'] == 'arene_adaptee' for e in entries),
        stageLayers=sum(e['plannedUse'] == 'calque_decor' for e in entries))

baseline = read('docs/armax/lot16/production-catalog.json')
recovery = read('docs/armax/lot17/recovery-audit.json')
costumes = read('docs/armax/lot18/costume-generation.json')
original17 = []
for p in ['docs/armax/lot17/source-me1-me2-mea/manifest.json', 'docs/armax/lot17/source-me3/manifest.json']:
    original17.extend(read(p)['assets'])

cat17 = copy.deepcopy(baseline)
cat17.update(catalogId='armax-production-catalog-lot17', revisionLot='lot17',
    updatedOn=DATE, baseCommit=BASE, parentCatalog='docs/armax/lot16/production-catalog.json',
    parentCatalogSha256=sha('docs/armax/lot16/production-catalog.json'),
    carriedForwardEntries=192, addedEntries=0, addedEntryIds=[],
    baselineCounts=dict(total=192, withImage=132, withoutImage=60),
    scope='Consolidation de deux images déjà publiées et de douze originaux récupérés. Onze associations candidates retenues, trois images sans attribution certaine. Aucun nouveau dessin produit par la récupération.')
by17 = {e['id']: e for e in cat17['entries']}
for entry in cat17['entries']:
    entry['pngCountLot17'] = 0
    entry['pngCountLot18'] = 0

def apply_asset(catalog_by_id, asset, lot, origin, manifest):
    entry = catalog_by_id[asset['catalogId']]
    if not asset.get('selected', False):
        raise ValueError('Cannot bind an unselected asset')
    path = asset['path']
    actual_sha = sha(path)
    expected_sha = asset.get('sha256') or asset['technical']['sha256']
    assert actual_sha == expected_sha, path
    assert path not in entry['assetFiles'], path
    entry['assetFiles'].append(path)
    entry.setdefault('alternateAssetFiles', [])
    notes = asset.get('reviewNotes') or asset.get('reservations') or asset.get('visualObservations') or ''
    if isinstance(notes, str): notes = [notes]
    entry.setdefault('generationNotes', []).extend(notes)
    entry.update(status='Prototype', assetPresence='candidat_genere_fichier_present',
        imageLot=lot, fidelity1to1Validated=False, engineIntegrated=False,
        latestGenerationAttempt='recovered_candidate' if origin == 'recovered' else 'generated',
        referenceReadiness='candidat_documente; comparaison_1to1_et_moteur_non_validees')
    entry['pngCount' + lot.title()] = entry.get('pngCount' + lot.title(), 0) + 1
    entry.setdefault('assetAvailabilityEvidence', []).append(dict(path=path, sha256=actual_sha,
        locallyMaterialized=True, baseCommit=BASE, origin=origin, manifestRef=manifest))
    entry['latestManifestRef'] = manifest
    entry['productionNote'] = (entry.get('productionNote', '') + '\n' + lot + ' : ' +
        ('original récupéré et association de travail' if origin == 'recovered' else 'image fixe candidate') +
        ', fidélité et moteur non validés.').strip()
    entry['referenceGap'] = 'Comparer silhouette, costume, surfaces reconstruites et alpha aux références exactes ; pas de validation moteur.'
    if origin == 'recovered':
        entry['recoveryAssociationStatus'] = asset['identificationStatus']
        entry['originalGenerationReceiptRecovered'] = False
        entry['generationPromptReconstructed'] = False
    for url in asset.get('sourceUrls', []):
        if url not in entry.setdefault('sourceUrls', []): entry['sourceUrls'].append(url)

for asset in original17:
    apply_asset(by17, asset, 'lot17', 'already_published_at_base',
        'docs/armax/lot17/source-me3/manifest.json' if 'padok' in asset['catalogId'] else 'docs/armax/lot17/source-me1-me2-mea/manifest.json')
for asset in recovery['assets']:
    if asset['selected']:
        apply_asset(by17, asset, 'lot17', 'recovered', 'docs/armax/lot17/recovery-audit.json')

additional_exclusions = [
    dict(catalogId='cst_me3_garrus_aap1', evidence='docs/armax/lot17/source-costumes/dispositions.json', proof='published_service_refusal'),
    dict(catalogId='chr_me3_steve_cortez', evidence='continuity context retrieved on 2026-11-25', proof='reported_refusal_original_log_unavailable')]
for item in additional_exclusions:
    if item['catalogId'] not in cat17['policy']['automaticRetryExcludedIds']:
        cat17['policy']['automaticRetryExcludedIds'].append(item['catalogId'])
    e = by17[item['catalogId']]
    e['latestGenerationAttempt'] = 'blocked' if item['proof'] == 'published_service_refusal' else 'reported_blocked'
    e['generationExclusionEvidence'] = item
    e['referenceGap'] = 'Exclusion de génération conservée ; aucun nouvel essai dans cette livraison.'
counts(cat17)
cat17['currentCounts'].update(lot17PhysicalPngFiles=14, lot17SelectedAssociations=11,
    recoveredNativePngFiles=12, unassignedRecoveredPngFiles=3, newGeneratedThisRecovery=0,
    totalGenerationExclusions=len(cat17['policy']['automaticRetryExcludedIds']))
cat17['accountingNote'] = '132 candidats lot16 + 11 fiches désormais illustrées = 143 sur 192 ; 49 sans. Les trois candidats sans identité confirmée restent hors assetFiles et hors compteur de présence.'
write('docs/armax/lot17/production-catalog.json', cat17)

root_specs = [
    ('layer_me2_tuchanka_market_rear_architecture', 'stage', 'Tuchanka — marché Urdnot : architecture arrière', 'Calque arrière du marché ME2', 'calque_decor', 'stages/tuchanka-me2-market-rear-architecture.png',
     'Conserve kiosque grillagé, poutres, conduite, mur oblique, gravats arrière et éclairages. Occlusions reconstruites. Largeur native 1585 au lieu de 1586 pixels du master ; raccord et placement restent à valider.'),
    ('layer_me2_tuchanka_market_floor', 'stage', 'Tuchanka — marché Urdnot : sol', 'Calque de pavés et débris du marché ME2', 'calque_decor', 'stages/tuchanka-me2-market-floor.png',
     'Sol isolé, zones cachées par le mobilier reconstruites. Découpe supérieure et droite irrégulière ; compatibilité de superposition avec le calque arrière non certifiée.'),
    ('prop_me2_tuchanka_market_table', 'accessoire', 'Tuchanka — table du marché Urdnot', 'Table, deux chaises et petits objets en un groupe de décor', 'accessoire_candidat', 'props/tuchanka-me2-market-table.png',
     'Un groupe de mobilier cohérent, pas plusieurs sprites individuels. Perspective rapprochée et taille modifiées par rapport au master ; il nécessite placement et échelle propres. Aucun objet de combat ou interaction ajoutés.'),
    ('prop_me2_tuchanka_market_terminal', 'accessoire', 'Tuchanka — console du marché Urdnot', 'Caisse technique avec console articulée', 'accessoire_candidat', 'props/tuchanka-me2-market-terminal.png',
     'Console et caisse isolées ; commandes et surfaces autrefois peu visibles réinterprétées. Les proportions du clavier sont reconstruites. Aucun texte lisible ni fonctionnement terminal ajouté.')
]
master_ref = 'public/assets/armax/lot12/stages/tuchanka-me2-urdnot-ratch-market-master.png'
master_bytes = subprocess.check_output(['git', 'show', BASE + ':' + master_ref], cwd=ROOT)
master_sha = hashlib.sha256(master_bytes).hexdigest()
root_assets = []
for identifier, category, name, variant, role, suffix, note in root_specs:
    path = 'public/assets/armax/lot18/' + suffix
    root_assets.append(dict(assetId=identifier + '_lot18', catalogId=identifier, category=category,
        name=name, work='ME2', dlc=None, variant=variant, plannedUse=role,
        path=path, promptFile='docs/armax/lot18/prompts/' + identifier + '.txt',
        productionMethod='builtin_imagegen', nativeOutput='PNG bytes decoded directly from imagegen data URL',
        sourceUrls=['https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/' + BASE + '/' + master_ref],
        referenceFiles=[dict(path=master_ref, sha256=master_sha, role='internal_prototype_continuity_reference',
            primaryOfficialReference=False, visuallyReviewed=True)],
        referenceComparisonCompleted=True, primarySourceReinspected=False,
        referenceAccessNote='Les liens ArtStation et Prima originaux ont été consultés ; les images externes ciblées ont échoué avec HTTP403/inaccessibles. La référence visuelle réellement utilisée est le master interne publié, non une nouvelle preuve officielle.',
        observedPose='Composant de décor fixe, sans animation',
        reviewNotes=[note, 'Dérivé d’un prototype interne : aucune fidélité 1:1 supplémentaire déduite.',
            'Transparence réelle et octets natifs préservés ; franges de détourage et occlusions à revoir en moteur.'],
        technical=technical(path), selected=True, status='Prototype', fidelity1to1Validated=False,
        engineIntegrated=False, engineReviewCompleted=False, nativeBytesPreserved=True,
        parentStageId='stg_me2_tuchanka_urdnot'))

floor = next(a for a in root_assets if a['catalogId'] == 'layer_me2_tuchanka_market_floor')
floor_r0 = copy.deepcopy(floor)
floor_r0.update(assetId='layer_me2_tuchanka_market_floor_lot18_r0',
    path='public/assets/armax/lot18/history/tuchanka-me2-market-floor-r0.png',
    selected=False, revision=0, selectionReason='Remplacé après constat de vides de raccord ; original conservé.')
floor_r0['technical'] = technical(floor_r0['path'])
floor_r0['reviewNotes'] = ['R0 : espaces verticaux à origine identique avec le rear, dont une découpe droite très prononcée. Non sélectionné.',
    'Révision historique native, aucun nettoyage de pixels.']
floor.update(promptFile='docs/armax/lot18/prompts/layer_me2_tuchanka_market_floor-r1.txt', revision=1,
    selectionReason='R1 élargit le sol sur toute la largeur ; raccord complet encore à contrôler.')
floor['reviewNotes'] = ['R1 étend le pavement à gauche et à droite et supprime le grand évidement droit de R0.',
    'Alignement supérieur, occlusions, contraste et limites de l’assemblage restent à contrôler ; aucune validation moteur.',
    'Même perspective générale ; texture des nouvelles surfaces reconstruite. R0 conservé dans history.',
    'Largeur native 1585 contre 1586 pixels du master interne. Aucune fidélité 1:1 déduite.']

attempts = read('docs/armax/lot18/generation-attempts.json')['attempts'] + costumes['attempts']
attempts += [dict(id=a['catalogId'], outcome='generated', path=a['path'], promptFile=a['promptFile'],
                 imageProduced=True, retried=False) for a in root_assets]
attempts.append(dict(id=floor_r0['catalogId'], revision=0, outcome='generated', path=floor_r0['path'],
    promptFile=floor_r0['promptFile'], imageProduced=True, selected=False))
for attempt in attempts:
    if attempt.get('path') == floor['path']:
        attempt.update(revision=1, revisionReason='Correction du raccord après inspection de R0', retried=False)
manifest = dict(schemaVersion=1, lot='lot18', date=DATE, timezone='Europe/Paris', baseCommit=BASE,
    productionMethod='builtin_imagegen', assets=costumes['assets'] + root_assets + [floor_r0], attempts=attempts,
    lot17Consolidation=dict(manifestRefs=['docs/armax/lot17/source-me1-me2-mea/manifest.json',
        'docs/armax/lot17/source-me3/manifest.json', 'docs/armax/lot17/recovery-audit.json'],
        physicalPngFiles=14, selectedCandidateAssociations=11, unassignedPngFiles=3,
        recoveredThisTurn=12, alreadyPublishedAtBase=2),
    counts=dict(newGeneratedPngFiles=8, selectedGeneratedPngFiles=7, newGeneratedSubjects=7, newInheritedSubjects=3,
        newCatalogEntries=4, generationAttemptsThisTurn=9, generationRefusalsThisTurn=1,
        historicalOriginalsAtLot16=231, documentedCorpusIncludingLot17And18=253),
    historicalCorpusNote='231 est le compteur historique publié lot16 ; cette passe vérifie par décodage les 22 PNG lot17/18 et les chemins historiques par arbre Git. Révisions et trois récupérés non attribués inclus.',
    narrativeRef='docs/armax/lot18/narrative-complements.json',
    fidelity1to1Validated=False, engineIntegrated=False)
write('docs/armax/lot18/manifest.json', manifest)

cat18 = copy.deepcopy(cat17)
cat18.update(catalogId='armax-production-catalog-lot18', revisionLot='lot18', updatedOn=DATE,
    parentCatalog='docs/armax/lot17/production-catalog.json', parentCatalogSha256=sha('docs/armax/lot17/production-catalog.json'),
    carriedForwardEntries=192, addedEntries=4, addedEntryIds=[a['catalogId'] for a in root_assets],
    researchReferenceFile='docs/armax/lot18/manifest.json',
    scope='Consolidation de lot17, trois costumes féminins ME2 et quatre composants du marché Urdnot. Images fixes uniquement, sans animation ni moteur validés.',
    baselineCounts=dict(total=192, withImage=132, withoutImage=60))
by18 = {e['id']: e for e in cat18['entries']}
cat18['sources']['lot18_internal_tuchanka_master'] = dict(
    title='Master interne — marché de Ratch, camp Urdnot ME2',
    url='https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/' + BASE + '/' + master_ref,
    sourceType='internal_prototype_continuity_reference', retrievalStatus='git_blob_inspected', checkedOn=DATE,
    sha256=master_sha, primaryOfficialReference=False)
for asset in root_assets:
    e = {k: asset[k] for k in IDENTITY}
    e.update(id=asset['catalogId'], priority='P1', status='Défini', assetFiles=[], alternateAssetFiles=[],
        sourceIds=['lot18_internal_tuchanka_master'], sourceUrls=[], addedInLot='lot18',
        pngCountLot17=0, pngCountLot18=0, parentStageId=asset['parentStageId'],
        fidelity1to1Validated=False, engineIntegrated=False)
    cat18['entries'].append(e)
    by18[e['id']] = e
for asset in manifest['assets']:
    if not asset['selected']: continue
    apply_asset(by18, asset, 'lot18', 'generated_this_turn', 'docs/armax/lot18/manifest.json')
    by18[asset['catalogId']]['newGenerationThisTurn'] = True
by18[floor['catalogId']]['alternateAssetFiles'].append(floor_r0['path'])
by18[floor['catalogId']]['pngCountLot18'] += 1
counts(cat18)
cat18['currentCounts'].update(newIllustratedSubjects=7, newInheritedIllustratedSubjects=3,
    newAddedIllustratedSubjects=4, newPngFiles=8, selectedNewPngFiles=7, recoveredPngFilesThisTurn=12,
    lot17PhysicalPngFiles=14, lot17SelectedAssociations=11, unassignedRecoveredPngFiles=3,
    previouslyUnillustratedInheritedSubjectsNowIllustrated=14,
    totalGenerationExclusions=len(cat18['policy']['automaticRetryExcludedIds']))
cat18['accountingNote'] = '132 candidats lot16 + 11 lot17 + 3 costumes lot18 + 4 nouvelles fiches = 150 sur 196. Il reste 46 fiches sans image dans ce catalogue partiel. Trois PNG récupérés sans attribution certaine ne ferment aucune fiche.'
cat18['remainingCoverage'].extend([
    'Lot17 : Jenkins et deux amiraux quariens présumés restent à identifier ; trois PNG non sélectionnés.',
    'Lot18 : deux calques Tuchanka et deux props candidats ; raccords, franges, échelle et caméra restent à valider.',
    'Lot18 : 32 nouveaux briefs narratifs définis, zéro illustration produite ; fin Grunt refusée sans relance.',
    'Les 46 manquants mesurent ce catalogue récupéré, pas l’exhaustivité de tous les jeux, romans, comics et variantes de Mass Effect.'
])
for prior in baseline['entries']:
    current = by18[prior['id']]
    assert all(current[k] == prior[k] for k in IDENTITY), prior['id']
    assert set(prior['assetFiles']).issubset(current['assetFiles']), prior['id']
assert cat18['currentCounts']['withImage'] == 150
assert cat18['currentCounts']['withoutImage'] == 46
write('docs/armax/lot18/production-catalog.json', cat18)

bindings = []
for asset in original17 + [a for a in recovery['assets'] if a['selected']] + [a for a in manifest['assets'] if a['selected']]:
    entry = by18[asset['catalogId']]
    scene_prop = entry.get('parentStageId') == 'stg_me2_tuchanka_urdnot'
    sheets = ['G', 'J'] if scene_prop else ['B', 'F', 'J'] if entry['plannedUse'] == 'narration_support' else ['B', 'J'] if entry['category'] == 'costume' else ['B', 'C', 'J']
    requirements = ['ARMAX-G02','ARMAX-G17','ARMAX-G26','ARMAX-G27'] + (['ARMAX-G13','ARMAX-G14','ARMAX-G15','ARMAX-G22'] if scene_prop else ['ARMAX-G03'])
    bindings.append(dict(catalogId=entry['id'], path=asset['path'], work=entry['work'], dlc=entry['dlc'],
        bibleSheets=sheets, guideRequirementIds=requirements, role=entry['plannedUse'],
        parentStageId=entry.get('parentStageId'), status='visual_candidate_documented',
        runtimeAttachment=False, fidelity1to1Validated=False, completeNarrativeSceneProduced=False,
        qualification='Composant du même marché Urdnot ; aucune arène ou action supplémentaire.' if scene_prop else 'Candidat visuel associé au rôle existant ; aucune capacité ni sélection jouable ajoutée.'))
write('docs/armax/lot18/bible-asset-associations.json', dict(schemaVersion=1, lot='lot18',
    baseCommit=BASE, entries=bindings, narrativeRef='docs/armax/lot18/narrative-complements.json'))

# Refresh the existing derived index while retaining every prior design relation.
idx = read('docs/armax/bible/content-associations.json')
idx['previousIndexRef'] = dict(path='docs/armax/bible/content-associations.json', commit=BASE)
idx['baseCommit'] = BASE
idx['date'] = DATE
idx['authority']['productionSource'] = 'docs/armax/lot18/production-catalog.json'
idx['authority']['snapshotRule'] = '192 identités héritées inchangées ; quatre composants Tuchanka ajoutés. Les compteurs actuels dérivent du catalogue lot18.'
mapping = {e['catalogId']: e for e in idx['entries']}
for e in cat18['entries']:
    row = mapping.get(e['id'])
    if row is None:
        row = {k:e[k] for k in IDENTITY}
        row.update(catalogId=e['id'], policyRef=e['plannedUse'], bibleSheets=['G','J'],
            readerRef='docs/armax/bible/ASSOCIATIONS_CONTENU.md#' + e['id'],
            designLinks=[], existingLotAssociation=None, contextNotes=[],
            designBindingState='documentary_component_binding_no_new_kit', parentStageId=e['parentStageId'],
            specificSheetQualification='G/J : composant de décor, pas accessoire de combat.')
        row['guideRequirementIds'] = next(b['guideRequirementIds'] for b in bindings if b['catalogId'] == e['id'])
        idx['entries'].append(row)
    row['catalogSource'] = dict(path='docs/armax/lot18/production-catalog.json', collection='entries', id=e['id'])
    row['productionSnapshot'] = dict(status=e['status'], hasImageCandidate=bool(e['assetFiles']), fidelity1to1Validated=False, engineIntegrated=False)
    matching = [b for b in bindings if b['catalogId'] == e['id']]
    if matching: row['lot18AssetAssociations'] = matching
idx['counts'].update(catalogEntriesAssociated=196, byCategory=cat18['counts'],
    byPlannedUse=dict(Counter(e['plannedUse'] for e in cat18['entries'])),
    withImageCandidate=150, withoutImageCandidate=46, newImages=8, selectedNewImages=7,
    recoveredImagesThisTurn=12, lot17SelectedAssociations=11, lot18AssetAssociations=18,
    stageMasters=52, stageLayers=5, newNarrativeRoutes=4, newNarrativeBriefs=32,
    newNarrativeImages=0, newCombatKits=0, newPlayableContent=0, newFidelityCertifications=0)
for path in ['docs/armax/lot18/production-catalog.json','docs/armax/lot18/bible-asset-associations.json','docs/armax/lot18/narrative-complements.json']:
    idx['sourceSnapshots'] = [s for s in idx['sourceSnapshots'] if s['path'] != path]
    idx['sourceSnapshots'].append(dict(path=path, sha256=sha(path), commit=None, state='same_delivery_verified_by_sha256'))
write('docs/armax/bible/content-associations.json', idx)

missing = [e for e in cat18['entries'] if not e['assetFiles']]
lines = ['# Armax — manquants après consolidation lot 18', '',
    '**196 fiches : 150 avec image candidate, 46 sans.** Ce catalogue ne couvre pas encore tout l’univers.', '',
    'Les trois PNG sans identité certaine sont conservés mais ne diminuent pas les manquants. Les exclusions de génération restent actives.', '',
    '| Catégorie | Fiches | Avec image | Sans image |', '|---|---:|---:|---:|']
for category, number in cat18['counts'].items():
    n = sum(bool(e['assetFiles']) for e in cat18['entries'] if e['category'] == category)
    lines.append(f'| {category} | {number} | {n} | {number-n} |')
lines += ['', '## Fiches sans image associée', '', '| ID | Sujet / variante | Opus | État de reprise |', '|---|---|---|---|']
for e in missing:
    excluded = e['id'] in cat18['policy']['automaticRetryExcludedIds']
    state = 'Exclusion conservée — pas de relance' if excluded else 'Référence et production à poursuivre'
    if e['id'] in ('chr_me1_jenkins','chr_me3_han_gerrel','chr_me3_zaal_koris'):
        state = 'PNG récupéré non attribué — identité / période à verrouiller'
    lines.append('| '+e['id']+' | '+e['name']+' — '+e['variant']+' | '+e['work']+' | '+state+' |')
lines += ['', '## Autres besoins de production', '',
    '- 52 masters de sous-zones et cinq calques disposent de candidats ; cela ne termine pas toutes les couches et transitions.',
    '- 7 effets et 2 projectiles sont illustrés ; lancement, trajet, impact et extinction restent des composants distincts.',
    '- 36 briefs narratifs antérieurs et 32 nouveaux restent à produire ; aucune nouvelle scène illustrée dans cette passe.',
    '- Le lot15 annoncé reste non retrouvé. Ses 113 PNG ne sont pas comptés présents.',
    '- Fidélité visuelle, silhouettes reconstruites, alpha et intégration moteur restent ouverts.', '']
(ROOT/'docs/armax/lot18/MANQUANTS_2026-11-25.md').write_text('\n'.join(lines))
print(json.dumps(dict(lot17=cat17['currentCounts'],lot18=cat18['currentCounts'], categories=cat18['counts']), ensure_ascii=False))
