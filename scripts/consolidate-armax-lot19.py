#!/usr/bin/env python3
"""Continue the fixed-image catalogue from lot18 without rewriting history."""
from collections import Counter
from pathlib import Path
import copy
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = '231ffde14652932ffaa667c40315f1232f802d4a'
DATE = '2026-11-27'
LOT = 'docs/armax/lot19'
ART = LOT + '/art-production/manifest.json'
ATTR = LOT + '/recovered-attributions.json'
PARENT = 'docs/armax/lot18/production-catalog.json'
IDENTITY = ('id', 'category', 'name', 'work', 'dlc', 'variant', 'plannedUse', 'addedInLot')


def read(path):
    return json.loads((ROOT / path).read_text())


def write(path, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def sha(path):
    data=(ROOT/path).read_bytes() if (ROOT/path).is_file() else subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
    return hashlib.sha256(data).hexdigest()


def historic(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT).decode()


baseline = read(PARENT)
manifest = read(ART)
attributions = read(ATTR)
recovered = attributions['associations']
assert len({a['catalogId'] for a in recovered}) == len(recovered)
catalogue = copy.deepcopy(baseline)
entries = {entry['id']: entry for entry in catalogue['entries']}
assert len(entries) == 196
excluded = set(baseline['policy']['automaticRetryExcludedIds'])
assets = manifest.get('assets', [])
selected = [asset for asset in assets if asset.get('selected', False)]
assert selected, 'No selected image: do not publish an empty production lot'
assert len({asset['path'] for asset in assets}) == len(assets)
generated_ids = set()
for entry in catalogue['entries']:
    entry['pngCountLot19'] = 0
for asset in assets:
    identifier = asset['catalogId']
    assert identifier in entries and identifier not in excluded, identifier
    entry = entries[identifier]
    generated_ids.add(identifier)
    path = asset['path']
    assert path.startswith('public/assets/armax/lot19/') and path.endswith('.png')
    actual = sha(path)
    assert actual == asset['technical']['sha256'], path
    assert asset.get('fidelity1to1Validated') is not True
    assert asset.get('engineIntegrated') is not True
    entry['pngCountLot19'] += 1
    target = entry['assetFiles'] if asset.get('selected', False) else entry['alternateAssetFiles']
    if path not in target:
        target.append(path)
    entry['assetAvailabilityEvidence'].append({
        'path': path, 'sha256': actual, 'origin': 'builtin_imagegen_lot19',
        'baseCommit': BASE, 'manifestRef': ART, 'nativeBytesPreserved': True,
    })
    for url in asset.get('sourceUrls', []):
        if url not in entry['sourceUrls']:
            entry['sourceUrls'].append(url)
    notes = asset.get('reviewNotes', [])
    if isinstance(notes, str):
        notes = [notes]
    unique_notes = entry.setdefault('generationNotes', [])
    for note in notes:
        if note not in unique_notes:
            unique_notes.append(note)
    entry['latestManifestRef'] = ART
    entry['fidelity1to1Validated'] = False
    entry['engineIntegrated'] = False
    if asset.get('selected', False):
        entry.update(status='Prototype', imageLot='lot19',
                     assetPresence='candidat_genere_fichier_present',
                     latestGenerationAttempt='generated',
                     referenceReadiness='candidat_documente; comparaison_1to1_et_moteur_non_validees')
        entry['productionNote'] += '\nLot19 : image fixe candidate référencée ; identité, opus et rôle conservés. Fidélité et intégration moteur à valider.'
        entry['referenceGap'] = ' '.join(notes) or 'Comparer les détails du modèle et la pose aux références exactes, puis contrôler en moteur.'
for attempt in manifest.get('attempts', []):
    identifier = attempt.get('catalogId') or attempt.get('id')
    if identifier not in entries:
        continue
    if attempt.get('outcome') in ('blocked', 'refused', 'service_refusal'):
        entry = entries[identifier]
        entry['latestGenerationAttempt'] = 'blocked'
        entry['generationExclusionEvidence'] = {'manifestRef': ART, 'attemptId': attempt.get('attemptId', identifier), 'requestId':attempt.get('requestId'), 'proof': 'service_refusal_lot19'}
        if identifier not in catalogue['policy']['automaticRetryExcludedIds']:
            catalogue['policy']['automaticRetryExcludedIds'].append(identifier)
        entry['referenceGap'] = entry.get('referenceGap','')+'\nNouvelle génération ou retouche refusée dans le lot19 ; aucune nouvelle tentative automatique. Tout candidat antérieur reste conservé avec ses réserves.'

for attribution in recovered:
    identifier=attribution['catalogId']
    assert identifier in entries and attribution['selected'] is True
    path=attribution['path']
    assert sha(path)==attribution['sha256']
    entry=entries[identifier]
    assert not entry['assetFiles'], 'This reconciliation only covers previously unassigned images'
    entry['assetFiles'].append(path)
    entry['pngCountLot17AtLot18']=entry.get('pngCountLot17',0)
    entry['pngCountLot17']=sum('/lot17/' in p for p in entry['assetFiles']+entry['alternateAssetFiles'])
    entry.update(status='Prototype',imageLot='lot17',attributionLot='lot19',
                 assetPresence='candidat_historique_attribue_fichier_present',
                 latestAttributionRef=ATTR,fidelity1to1Validated=False,engineIntegrated=False,
                 referenceReadiness='identite_visuelle_raccordee; details_1to1_et_moteur_non_valides')
    entry['assetAvailabilityEvidence'].append({'path':path,'sha256':attribution['sha256'],
        'origin':'native_lot17_recovered_in_lot18_attributed_in_lot19','baseCommit':BASE,
        'attributionRef':ATTR,'nativeBytesPreserved':True})
    entry['productionNote']+='\nLot19 : attribution visuelle corrigée d’un PNG historique lot17 déjà récupéré au lot18 ; aucun nouveau fichier ni nouvelle génération pour ce sujet.'
    entry['generationNotes']=list(dict.fromkeys(entry.get('generationNotes',[])+attribution['reviewNotes']+attribution['limits']))
    entry['referenceGap']=' '.join(attribution['limits'])
    for url in attribution['sourceUrls']:
        if url not in entry['sourceUrls']: entry['sourceUrls'].append(url)

for old, new in zip(baseline['entries'], catalogue['entries']):
    assert all(old.get(k) == new.get(k) for k in IDENTITY), old['id']
    assert set(old['assetFiles']).issubset(new['assetFiles'])
    assert set(old['alternateAssetFiles']).issubset(new['alternateAssetFiles'])
    if old['id'] in excluded:
        assert {k:v for k,v in new.items() if k != 'pngCountLot19'} == old

with_image = sum(bool(e['assetFiles']) for e in catalogue['entries'])
newly_illustrated = [e['id'] for old,e in zip(baseline['entries'],catalogue['entries']) if not old['assetFiles'] and e['assetFiles']]
catalogue.update(catalogId='armax-production-catalog-lot19', revisionLot='lot19',
                 updatedOn=DATE, baseCommit=BASE, parentCatalog=PARENT,
                 parentCatalogSha256=sha(PARENT), carriedForwardEntries=196,
                 addedEntries=0, addedEntryIds=[], researchReferenceFile=ART,
                 baselineCounts={'total':196,'withImage':150,'withoutImage':46},
                 scope='Continuation des sprites fixes manquants ; guide général et deux extensions intégrés à la bible. Aucun moteur, clip animé ni certificat de fidélité 1:1 livré.')
catalogue['currentCounts'] = {
    'total':196, 'withImage':with_image, 'withoutImage':196-with_image,
    'certified1to1':0, 'stageMasters':52, 'stageLayers':5,
    'newPngFiles':len(assets), 'selectedNewPngFiles':len(selected),
    'newIllustratedSubjects':len(newly_illustrated),
    'newGeneratedSubjects':len({a['catalogId'] for a in selected}),
    'historicalAttributionsResolved':len(recovered),
    'previouslyUnillustratedInheritedSubjectsNowIllustrated':len(newly_illustrated),
    'newInheritedIllustratedSubjects':len(newly_illustrated), 'newAddedIllustratedSubjects':0,
    'recoveredPngFilesThisTurn':0, 'unassignedRecoveredPngFiles':len(attributions['unresolved']),
    'totalGenerationExclusions':len(catalogue['policy']['automaticRetryExcludedIds']),
}
catalogue['counts'] = dict(Counter(e['category'] for e in catalogue['entries']))
catalogue['accountingNote'] = f"150 fiches avec candidat au lot18 + {len(selected)} nouveaux sujets générés + {len(recovered)} attributions de PNG historiques résolues = {with_image}/196. {196-with_image} fiches restent sans image sélectionnée ; aucune nouvelle identité. Les PNG attribués existaient déjà au lot18, sans nouvelle récupération ni génération. Catalogue partiel, sans certification 1:1."
catalogue['remainingCoverage'][-1] = f"Les {196-with_image} manquants mesurent ce catalogue récupéré, pas l'exhaustivité des jeux, romans, comics et variantes Mass Effect."
catalogue['remainingCoverage']=[item.replace('Lot17 : Jenkins et deux amiraux quariens présumés restent à identifier ; trois PNG non sélectionnés.', 'Lot17 réconcilié au lot19 : deux PNG quariens attribués comme candidats ME3 ; le marine supposé Jenkins reste sans identité démontrée. Les réserves des jambes, pieds, dos et animations restent ouvertes.') for item in catalogue['remainingCoverage']]
catalogue['remainingCoverage'].append('Lot19 : comparaison des nouvelles silhouettes aux références, surfaces reconstruites, alpha et revue en jeu restent ouverts. Les 68 rubriques de guide sont documentaires ; leurs animations et mécanismes ne sont pas réalisés par cette écriture.')
write(LOT+'/production-catalog.json',catalogue)

index = json.loads(historic('docs/armax/bible/content-associations.json'))
index['indexId'] = 'content-associations-lot19-2026-11-27'
index['date'] = DATE
index['baseCommit'] = BASE
index['previousIndexRef'] = {'path':'docs/armax/bible/content-associations.json','commit':BASE}
index['authority']['productionSource'] = LOT+'/production-catalog.json'
index['authority']['snapshotRule'] = '196 identités héritées inchangées ; les compteurs courants dérivent du catalogue lot19.'
index['authority']['historicalGuideMatrixRef'] = index['authority']['guideMatrixRef']
index['authority']['historicalGuideMatrixNote'] = 'guide-associations.json conserve les 30 rubriques et 90 critères initiaux ; son sous-objet contentAssociationIndex lot16 est historique.'
index['authority']['guideMatrixRef'] = 'docs/armax/bible/guide-coverage-2026-11-27.json'
index['authority']['currentGuideRequirementCount'] = 68
index['sourceSnapshots'].append({'path':PARENT,'commit':BASE,'sha256':sha(PARENT)})
index['sourceSnapshots'].append({'path':LOT+'/production-catalog.json','commit':None,'sha256':sha(LOT+'/production-catalog.json'),'qualification':'SHA-256 of the delivered file; publication commit recorded in PR #11'})
index['sourceSnapshots'].append({'path':ATTR,'commit':None,'sha256':sha(ATTR),'qualification':'Reconciliation of previously unassigned native lot17 files; no new image'})
index['counts'].update(withImageCandidate=with_image,withoutImageCandidate=196-with_image,
                       newImages=len(assets),selectedNewImages=len(selected),
                       recoveredImagesThisTurn=0,newNarrativeRoutes=0,newNarrativeBriefs=0,
                       newNarrativeImages=0,lot19AssetAssociations=len(selected),
                       lot19RecoveredAttributions=len(recovered),unassignedRecoveredImages=len(attributions['unresolved']),
                       newPlayableContent=0,newCombatKits=0,newFidelityCertifications=0)
index['counts']['lot17SelectedAssociationsAtLot18']=index['counts']['lot17SelectedAssociations']
index['counts']['lot17SelectedAssociations']+=len(recovered)
by_asset = {}
for asset in selected:
    by_asset.setdefault(asset['catalogId'],[]).append(asset)
by_recovered={a['catalogId']:a for a in recovered}
for item in index['entries']:
    entry = entries[item['catalogId']]
    item['catalogSource']['path'] = LOT+'/production-catalog.json'
    item['productionSnapshot'].update(status=entry['status'],hasImageCandidate=bool(entry['assetFiles']),fidelity1to1Validated=False,engineIntegrated=False)
    if item['catalogId'] in by_asset:
        item['lot19AssetAssociations'] = [{'assetId':a['assetId'],'path':a['path'],'manifestRef':ART,'qualification':'Image fixe candidate ; aucun kit ou rôle de sélection déduit.'} for a in by_asset[item['catalogId']]]
    if item['catalogId'] in by_recovered:
        a=by_recovered[item['catalogId']]
        item['lot19HistoricalAttribution']={'path':a['path'],'attributionRef':ATTR,'imageLot':'lot17','qualification':'Identity attribution of an existing candidate; no new PNG, generation, kit or fidelity certification'}
write('docs/armax/bible/content-associations.json',index)

md = historic('docs/armax/bible/ASSOCIATIONS_CONTENU.md')
md = md.replace('**Révision documentaire du 25 novembre 2026 — Europe/Paris.**','**Révision documentaire du 27 novembre 2026 — Europe/Paris.**')
md = md.replace('196 fiches du catalogue lot 18','196 fiches du catalogue lot 19')
md = md.replace('[catalogue courant](../lot18/production-catalog.json)','[catalogue courant](../lot19/production-catalog.json)')
md = md.replace('catalogue courant lot 18','catalogue courant lot 19')
md = md.replace('Les **192 identités antérieures** sont conservées ; quatre composants du marché Urdnot sont ajoutés. Onze fiches sont illustrées par le lot17 consolidé et trois costumes par le lot18.', 'Les **196 identités héritées du lot 18** sont conservées. Les quatre composants du marché Urdnot, les onze fiches illustrées par le lot17 consolidé et les trois costumes du lot18 appartiennent aux livraisons antérieures.')
md = md.replace('Les [manquants courants](../lot18/MANQUANTS_2026-11-25.md), le [classeur lot 18](../lot18/Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx), la [vérification courante](../lot18/verification.json) et le [bilan du lot 18](../lot18/README.md) constituent les points de reprise artistique pour les 196 fiches.', 'Les [manquants historiques](../lot18/MANQUANTS_2026-11-25.md), le [classeur lot 18](../lot18/Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx), la [vérification du lot 18](../lot18/verification.json) et son [bilan](../lot18/README.md) conservent la preuve de cette étape. Les [manquants courants](../lot19/MANQUANTS_2026-11-27.md), le [classeur lot 19](../lot19/Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx), la [vérification courante](../lot19/verification.json) et le [bilan du lot 19](../lot19/README.md) portent la reprise actuelle des 196 fiches.')
md = md.replace('## 1. Lecture et portée', 'Le [registre complet des 68 rubriques](guide-coverage-2026-11-27.json) est la référence documentaire courante du guide et des deux extensions. Les associations aux 30 rubriques initiales ci-dessous restent valables.\n\n## 1. Lecture et portée', 1)
md = md.replace('## 1. Lecture et portée',f"## Continuation lot 19\n\nLes 196 identités sont conservées. **{len(newly_illustrated)} fiches précédemment sans image disposent d'un candidat**, portant la présence à **{with_image}/196**, avec **{196-with_image} fiches sans image**. Les images et leurs réserves figurent dans le [lot19](../lot19/README.md). Les comptes des lots16–18 décrivent les livraisons antérieures. La matrice générale initiale reste un instantané historique ; son sous-objet lot16 ne constitue pas le compteur courant.\n\n## 1. Lecture et portée")
for category,label in [('personnage','Personnages et adversaires'),('costume','Costumes')]:
    rows = [e for e in catalogue['entries'] if e['category']==category]
    n = sum(bool(e['assetFiles']) for e in rows)
    md = re.sub(r'\| '+re.escape(label)+r' \| \d+ \| \d+ \| \d+ \|',f'| {label} | {len(rows)} | {n} | {len(rows)-n} |',md)
md = re.sub(r'\| \*\*Total\*\* \| \*\*196\*\* \| \*\*150\*\* \| \*\*46\*\* \|',f'| **Total** | **196** | **{with_image}** | **{196-with_image}** |',md)
lines = []
for line in md.splitlines():
    if any('id="'+identifier+'"' in line for identifier in by_recovered):
        line = line.replace('| Sans image |','| Image candidate lot17 — attribution lot19 |')
    elif any('id="'+identifier+'"' in line for identifier in newly_illustrated):
        line = line.replace('| Sans image |','| Image candidate lot19 |')
    lines.append(line)
(ROOT/'docs/armax/bible/ASSOCIATIONS_CONTENU.md').write_text('\n'.join(lines)+'\n')

missing = [e for e in catalogue['entries'] if not e['assetFiles']]
lines = ['# Armax — manquants après lot 19','',f'**196 fiches : {with_image} avec image candidate, {len(missing)} sans.** Catalogue de production partiel ; aucun pourcentage global de jeu terminé ne se déduit de ces chiffres.','',
         '| Catégorie | Fiches | Avec image | Sans image |','|---|---:|---:|---:|']
for category,total in catalogue['counts'].items():
    n = sum(e['category']==category and bool(e['assetFiles']) for e in catalogue['entries'])
    lines.append(f'| {category} | {total} | {n} | {total-n} |')
lines += ['','## Fiches encore sans image sélectionnée','','| ID | Sujet / variante | Opus | Suite |','|---|---|---|---|']
for entry in missing:
    suite = 'Exclusion conservée — pas de relance automatique' if entry['id'] in catalogue['policy']['automaticRetryExcludedIds'] else 'Référence et production à poursuivre'
    if entry['id'] in ('chr_me1_jenkins','chr_me3_han_gerrel','chr_me3_zaal_koris'):
        suite = 'Ancien PNG non attribué ; identité et période à confirmer'
    lines.append(f"| {entry['id']} | {entry['name']} — {entry['variant']} | {entry['work']} | {suite} |")
lines += ['','## Travail restant au-delà des images fixes','']
lines += ['- '+item for item in catalogue['remainingCoverage']]
(ROOT/LOT/'MANQUANTS_2026-11-27.md').write_text('\n'.join(lines)+'\n')

guide_link='../bible/guide-coverage-2026-11-27.json'
overview=f'''# Armax — lot 19 et intégration des deux extensions

**27 novembre 2026, Europe/Paris · PR #11 · base `{BASE}`.**

Les trois guides originaux sont désormais conservés avec leurs empreintes dans le [dossier sources](../guides/README.md). La [réconciliation](../bible/GUIDE_RECONCILIATION_2026-11-27.md) confirme la correspondance des 30 rubriques historiques et ajoute les 38 rubriques des extensions. Le [registre complet]({guide_link}) réunit 68 rubriques et 204 critères de conception : 90 conservés, 114 nouveaux.

## Production réellement livrée

| Mesure | Valeur |
|---|---:|
| Fiches du catalogue conservées | 196 |
| Nouvelles identités | 0 |
| PNG natifs produits dans cette passe, révisions incluses | {len(assets)} |
| PNG sélectionnés | {len(selected)} |
| Sujets représentés par de nouveaux PNG | {len({a['catalogId'] for a in selected})} |
| Attributions de PNG historiques résolues | {len(recovered)} |
| Anciennes fiches nouvellement illustrées | {len(newly_illustrated)} |
| Fiches avec image candidate | {with_image} |
| Fiches sans image sélectionnée | {196-with_image} |
| Nouvelles certifications de fidélité 1:1 | 0 |
| Nouveaux systèmes de combat intégrés au moteur | 0 |

Le [catalogue](production-catalog.json), l'[index de la bible](../bible/ASSOCIATIONS_CONTENU.md), les [manquants](MANQUANTS_2026-11-27.md) et le [classeur](Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx) décrivent le même périmètre. Il s'agit d'un catalogue partiel de production, pas d'un pourcentage d'achèvement de tout Mass Effect. Une silhouette fixe ne termine pas toutes les vues, accessoires, poses, animations ou illustrations de son personnage.

### Images retenues

Chaque fichier contient un seul sujet. Les variantes non sélectionnées restent dans `history/` et ne créent pas de nouvelles identités.

| Sujet | Opus et variante | Fichier |
|---|---|---|
'''
for asset in selected:
    entry=entries[asset['catalogId']]
    overview+=f"| {entry['name']} | {entry['work']} — {entry['variant']} | [{Path(asset['path']).name}](../../../{asset['path']}) |\n"
overview+='\n### Attributions historiques résolues\n\nLes deux fichiers suivants étaient déjà présents au lot18 et proviennent du lot17. La comparaison des signatures visuelles résout leurs anciennes hypothèses inversées ; aucun nouveau PNG ni aucune nouvelle génération ne leur sont imputés. Le [rapport de rapprochement](recovered-attributions.json) conserve les preuves, les hypothèses antérieures et les réserves.\n\n| Fiche actuelle | Fichier historique inchangé |\n|---|---|\n'
for attribution in recovered:
    entry=entries[attribution['catalogId']]
    overview+=f"| {entry['name']} — {entry['work']} | [{Path(attribution['path']).name}](../../../{attribution['path']}) |\n"
overview+='\nLe marine précédemment supposé être Jenkins reste non attribué. Les attributions des deux Quariens portent sur leur identité visuelle ; les détails des jambes, pieds et animations restent à valider.\n'
overview+='''
Le [manifeste artistique](art-production/manifest.json) lie les fichiers, prompts, sources réellement inspectées, contrôles d'alpha et réserves. Les références tierces utilisées pour inspection restent hors du dépôt. Les notes distinguent les régions documentées et les surfaces reconstruites. [Oleg Petrovsky reste sans nouvelle image](REFERENCE_GAPS_ROOT.md), faute de référence intégrale suffisante dans cette passe.

## Extensions appliquées au contexte Mass Effect

- [Équipes, personnalité et bonus](../bible/EXTENSION_01_EQUIPES_ET_BONUS.md) : taunts, sélection/confirmation/désélection, assistances, relais, supers duo, Neutralisations coordonnées et fins dramatiques, clashes/QTE, drones/mines/projectiles persistants, dix activités bonus et exploration des archives.
- [Déblocages et présentation des verrous](../bible/EXTENSION_02_DEBLOCAGES.md) : états de découverte, droits et disponibilité, contenu installé, silhouettes ou secrets, conditions ET/OU, récompenses, voies de progression, modèles de soutien optionnels, accès hors ligne, expiration, replays et accessibilité.
- [Données extension 01](../bible/extension-01-specs.json) et [extension 02](../bible/extension-02-specs.json) : paramètres candidats et scénarios d'acceptation à réaliser. Ces scénarios écrits ne sont pas des tests exécutés.

Les noms de projet, chorégraphies, coûts, timings et rencontres hypothétiques sont identifiés comme adaptations. Les capacités restent liées à leur personnage et à leur version. Les volets ME1/ME2/ME3 et Andromeda ne créent aucun voyage temporel narratif ; un costume ne confère pas une nouvelle classe. Les PNJ de soutien restent des PNJ. La désignation Neutralisation coordonnée complète la Neutralisation décisive existante.

Les 30 associations et 90 critères historiques de `guide-associations.json`, ainsi que `common-rules.json`, restent inchangés. Le sous-objet d'index lot16 de la matrice historique ne porte pas les comptes actuels ; ceux-ci proviennent du catalogue et de l'index lot19.

## Vérifications et portée

Le [rapport de vérification](verification.json), la [relecture des guides](guide-review.json) et le [contrôle Excel](workbook-verification.json) précisent les commandes, sources et limites. La vérification de fichiers se lance avec `python3 scripts/verify-armax-lot19.py` depuis la racine. Le classeur est importé du lot18 puis modifié avec artifact-tool ; les identités, la feuille de récupérations, les tableaux, volets figés et validations sont préservés.

Tous les nouveaux actifs restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`. Les animations, les systèmes de tag, les déblocages exécutables, les services de paiement et l'intégration jouable ne sont pas produits par cette livraison documentaire et artistique. Aucune nouvelle illustration de campagne n'est déclarée. Les exclusions de génération antérieures restent actives ; une retouche supplémentaire de Kallo a été refusée, sa version R1 est conservée et aucune relance automatique n'est prévue. Le marine historique reste non attribué et les 113 PNG non récupérés du lot15 restent hors des comptes.

## Continuité

- [Bible intégrée](../bible/BIBLE_ARMAX_INTEGREE.md).
- [Lot18 historique](../lot18/README.md).
- [Dossier Armax](../README.md).
'''
(ROOT/LOT/'README.md').write_text(overview)

root_md=historic('README.md')
current=f'''### Continuation courante — lot 19 et deux extensions

Le [lot19](docs/armax/lot19/README.md) ajoute **{len(assets)} PNG natifs, dont {len(selected)} sélectionnés**, et résout **{len(recovered)} attributions de PNG historiques**, pour **{len(newly_illustrated)} fiches auparavant sans image**. Le [suivi courant](docs/armax/lot19/MANQUANTS_2026-11-27.md) conserve **196 identités, {with_image} avec candidat et {196-with_image} sans**. Les fichiers originaux du guide général et des deux extensions sont récupérés et associés à **68 rubriques / 204 critères documentaires**, avec [sources exactes](docs/armax/guides/README.md) et [réconciliation](docs/armax/bible/GUIDE_RECONCILIATION_2026-11-27.md). Les extensions équipes/bonus et déblocages restent des spécifications ; les nouvelles images sont des prototypes fixes, sans validation 1:1 ni nouvelle intégration moteur.

### Historique — lots 17 et 18'''
root_md=root_md.replace('### Continuation courante — lots 17 et 18',current,1)
root_md=root_md.replace('### Bible intégrée — guide général du 25 novembre 2026','### Bible intégrée — guide général et deux extensions',1)
root_md=root_md.replace('applique les 30 rubriques du guide de combat fourni par Darknigthmare aux systèmes, personnages et périodes du projet. Les [associations et 90 critères]', 'applique les **68 rubriques du guide général et de ses deux extensions** aux systèmes, personnages et périodes du projet. La [matrice courante et ses 204 critères](docs/armax/bible/guide-coverage-2026-11-27.json) conserve les 30 rubriques historiques et ajoute les 38 rubriques des extensions. Les [associations historiques et 90 critères]',1)
root_md=root_md.replace('**196 fiches du catalogue lot 18**','**196 fiches du catalogue lot 19**',1)
root_md=root_md.replace('**150 avec image candidate et 46 sans**',f'**{with_image} avec image candidate et {196-with_image} sans**',1)
(ROOT/'README.md').write_text(root_md)
hub=historic('docs/armax/README.md')
hub=hub.replace('## Bible courante — intégration du guide général','## Bible courante — guide général et deux extensions',1)
hub=hub.replace('relie les **30 rubriques** de **Combat_Games_Guide_General_v1.0.txt** aux contrats et fiches Armax.', 'relie les **68 rubriques** du guide général et de ses deux extensions aux contrats et fiches Armax : 30 rubriques historiques et 38 supplémentaires.',1)
hub=hub.replace('- [Associations et 90 critères d’acceptation](bible/guide-associations.json).', '- [Matrice courante : 68 rubriques et 204 critères](bible/guide-coverage-2026-11-27.json).\n- [Associations historiques et 90 critères conservés](bible/guide-associations.json).',1)
hub=hub.replace('Le suivi artistique courant est celui du lot 18 ci-dessous','Le suivi artistique courant est celui du lot 19 ci-dessous',1)
hub=hub.replace('[catalogue courant](lot18/production-catalog.json)','[catalogue historique](lot18/production-catalog.json)',1)
hub=hub.replace('## Lot 18 — continuation courante du 25 novembre 2026',f'''## Lot 19 — continuation courante du 27 novembre 2026

Le [lot19](lot19/README.md) poursuit les sprites fixes : **{len(assets)} PNG natifs, {len(selected)} sélectionnés et {len(recovered)} attributions historiques résolues**, soit **{len(newly_illustrated)} anciennes fiches nouvellement illustrées**. Le [catalogue courant](lot19/production-catalog.json), les [manquants](lot19/MANQUANTS_2026-11-27.md) et le [classeur](lot19/Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx) comptent **196 identités, {with_image} avec image candidate et {196-with_image} sans**. Les totaux lot18 ci-dessous restent historiques.

Les [trois guides originaux](guides/README.md) sont maintenant récupérés à l'identique. Le [registre complet](bible/guide-coverage-2026-11-27.json) associe **68 rubriques et 204 critères de conception**. Les [équipes et bonus](bible/EXTENSION_01_EQUIPES_ET_BONUS.md) et les [déblocages](bible/EXTENSION_02_DEBLOCAGES.md) complètent la bible avec règles d'opus, rôles, sources et scénarios à tester. Les 90 critères initiaux restent conservés. Aucun système jouable ou abonnement réel n'est déclaré opérationnel.

## Lot 18 — historique du 25 novembre 2026''',1)
(ROOT/'docs/armax/README.md').write_text(hub)
print(json.dumps({'counts':catalogue['currentCounts'],'newlyIllustratedIds':newly_illustrated,'preservedIdentityRows':196},ensure_ascii=False,indent=2))
