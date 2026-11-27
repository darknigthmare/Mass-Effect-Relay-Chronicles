#!/usr/bin/env python3
"""Refresh lot22 accounting from immutable lot21 records and actual original PNGs."""
from pathlib import Path
import copy, hashlib, json
from collections import Counter
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/armax/lot22'
DLC = ROOT / 'DLC/LesDettesDeNacre'
DATE = '2026-11-27'

def read(path):
    return json.loads(path.read_text())

def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

OUT.mkdir(parents=True, exist_ok=True)
parent_path = ROOT / 'docs/armax/lot21/production-catalog.json'
parent = read(parent_path)
roster = read(DLC / 'nacre_roster_design.json')
world = read(DLC / 'nacre-world.json')
coverage_path = OUT / 'gameplay-coverage.json'
coverage = read(coverage_path) if coverage_path.is_file() else {}
verification = coverage.get('verification', {})
limited_smoke_passed = coverage.get('smokeTestPassed') is True and verification.get('browserPassed') is True
families = [
    ('fighters', 'personnage_original', roster['fighters']),
    ('stages', 'stage_original', world['stages']),
    ('enemies', 'ennemi_original', world['enemies']),
    ('bosses', 'boss_original', world['bosses']),
    ('props', 'accessoire_original', world['props']),
    ('fx', 'effet_original', world['projectilesVfx']),
]

assets = []
new_entries = []
asset_root = ROOT / 'public/assets/armax/lot22/originals'
native_png_files = sorted(asset_root.rglob('*.png'))
boss_manifest_path = OUT / 'boss-art-manifest.json'
boss_manifest = read(boss_manifest_path) if boss_manifest_path.is_file() else {}
boss_revisions = {b['id']: b.get('selectedRevision', 'R0') for b in boss_manifest.get('bosses', [])}
for folder, category, objects in families:
    for obj in objects:
        base_asset = asset_root / folder / (obj['id'] + '.png')
        revised_asset = asset_root / folder / (obj['id'] + '_r1.png')
        asset = revised_asset if revised_asset.is_file() else base_asset
        exists = asset.is_file()
        alternates = ([base_asset] if asset == revised_asset and base_asset.is_file() else [])
        alternates += sorted((asset_root / folder / 'qa').glob(obj['id'] + '_r*.png'))
        selected_revision = 'R1' if asset == revised_asset else boss_revisions.get(obj['id'], 'R0')
        record = {
            'id': obj['id'], 'category': category, 'name': obj['name'],
            'work': 'Relay Chronicles — Armax', 'dlc': 'Les Dettes de Nacre',
            'variant': 'Design original — base ' + selected_revision,
            'plannedUse': folder, 'priority': 'P1',
            'status': 'Candidat illustré' if exists else 'Défini',
            'assetPresence': 'png_original_candidat' if exists else 'à_produire',
            'assetFiles': [str(asset.relative_to(ROOT))] if exists else [],
            'alternateAssetFiles': [str(p.relative_to(ROOT)) for p in alternates],
            'selectedRevision': selected_revision if exists else None,
            'fidelity1to1Validated': False, 'engineIntegrated': False,
            'creativeStatus': 'Original fan content', 'canonical': False,
            'officialContent': False, 'originalDesignConsistencyValidated': False,
            'fullKitImplemented': False, 'animationComplete': False,
            'referenceReadiness': 'Bible originale définie ; contrôle de cohérence visuelle et lore requis',
            'sourceIds': obj.get('sourceIds', []),
            'sourceUrls': [], 'addedInLot': 'lot22',
            'imageLot': 'lot22' if exists else '',
            'specificationFile': 'DLC/LesDettesDeNacre/' + ('nacre_roster_design.json' if folder == 'fighters' else 'nacre-world.json'),
            'productionNote': 'Une pose fixe ou un master plat ne vaut ni animation complète ni mécanique intégrée.',
            'runtimeEvidenceFile': 'docs/armax/lot22/GAMEPLAY_IMPLEMENTATION.md',
            'prototypeImplementedInCode': exists and (folder in ['fighters', 'stages', 'enemies', 'bosses'] or obj['id'] in ['nacre_fx_01', 'nacre_fx_05', 'nacre_fx_15']),
            'prototypeWiring': {
                'sourceFile': 'src/armax-expansion-data.js' if folder != 'props' else None,
                'codeHookExpected': folder in ['fighters', 'stages', 'enemies', 'bosses'] or obj['id'] in ['nacre_fx_01', 'nacre_fx_05', 'nacre_fx_15'],
                'assetAvailable': exists,
                'browserWorkflowVerified': False,
                'fullDesignImplemented': False,
                'evidence': 'docs/armax/lot22/gameplay-coverage.json',
            },
        }
        if obj['id'] == 'nacre_boss_03' and not exists:
            record.update({'latestGenerationAttempt': 'blocked', 'automaticRetryExcluded': True,
                           'referenceGap': 'Refus imagegen en sortie ; aucune relance et aucun substitut déclaré comme Halek Orr.'})
        if folder == 'stages':
            record.update({'parallaxLayersPlanned': 5, 'parallaxLayersProduced': 0, 'stageMasterOnly': True})
        if exists:
            with Image.open(asset) as img:
                alpha = img.getchannel('A') if img.mode == 'RGBA' else None
                mask32 = alpha.point(lambda p: 255 if p > 32 else 0) if alpha is not None else None
                mask128 = alpha.point(lambda p: 255 if p > 128 else 0) if alpha is not None else None
                bounds = mask32.getbbox() if mask32 is not None else (0, 0, *img.size)
                metadata = {
                    'id': obj['id'], 'category': folder, 'name': obj['name'],
                    'path': str(asset.relative_to(ROOT)), 'sha256': digest(asset),
                    'selectedRevision': selected_revision,
                    'bytes': asset.stat().st_size, 'width': img.width, 'height': img.height,
                    'mode': img.mode, 'alphaExtrema': alpha.getextrema() if alpha is not None else None,
                    'alphaBounds32': bounds, 'alphaBounds128': mask128.getbbox() if mask128 is not None else None,
                    'alphaBoundsComparison': 'strictly_greater_than_threshold',
                    'pivotSuggestionPx': [round((bounds[0]+bounds[2])/2, 2), bounds[3]] if bounds else None,
                    'hasRealAlpha': bool(alpha is not None and alpha.getextrema()[0] == 0),
                    'renderAlphaTestProposal': 32/255 if folder != 'stages' else None,
                    'nativeUHD': img.width >= 3840 and img.height >= 2160,
                    'frameCount': 1, 'animationComplete': False,
                    'fidelity1to1Validated': False,
                    'review': 'Candidat : contrôler le détourage, la ligne des pieds et la cohérence en situation.',
                }
                assets.append(metadata)
        new_entries.append(record)

catalog = copy.deepcopy(parent)
catalog.update({
    'catalogId': 'armax-production-lot22-nacre', 'revisionLot': 'lot22',
    'updatedOn': DATE, 'parentCatalog': 'docs/armax/lot21/production-catalog.json',
    'parentCatalogSha256': digest(parent_path),
    'baseCommit': 'd448b795db469b490eb0f8b4116ef19cfb202e05',
    'scope': '216 fiches canoniques héritées + 110 créations originales Nacre',
    'globalFidelityCertified': False, 'engineImplementationClaimed': True,
    'engineImplementationScope': 'Prototype local condensé, logique native et compilation vérifiées. ' + (
        'Six contrôles UI limités réussis sur Mara/Tavin et les stages01/02, révision ' + verification.get('browserSourceHead', 'non précisée')[:8] + ' ; couverture jouable et visuelle exhaustive non validée.' if limited_smoke_passed else
        'Le parcours UI complet de la révision corrigée attend sa preuve ; la bible complète et la couverture visuelle exhaustive restent non validées.'),
    'fullGameImplemented': False, 'browserGameplayValidated': False,
    'browserGameplayValidationScope': 'Validation exhaustive du prototype et de ses contenus. Un smoke limité ne modifie ni ce booléen ni les certifications par identité.',
    'limitedBrowserSmoke': {
        'passed': limited_smoke_passed,
        'status': verification.get('browserStatus', 'not_verified'),
        'evidence': 'docs/armax/lot22/gameplay-coverage.json',
        'report': verification.get('browserReport'),
        'sourceHead': verification.get('browserSourceHead'),
        'sourceMatchesCurrent': verification.get('browserSourceMatchesCurrent', False),
        'coveredFighterIds': ['nacre_mara_vey', 'nacre_tavin_rhex'] if limited_smoke_passed else [],
        'coveredStageIds': ['nacre_stage_01', 'nacre_stage_02'] if limited_smoke_passed else [],
        'fullProfileCertification': False,
    },
    'inheritedPolicyScope': 'La politique héritée inchangée vise les 216 fiches historiques ; les 110 créations Nacre restent explicitement non canoniques.',
    'carriedForwardEntries': 216, 'addedEntries': 110,
    'addedEntryIds': [e['id'] for e in new_entries],
    'entries': copy.deepcopy(parent['entries']) + new_entries,
    'totalEntries': len(parent['entries']) + len(new_entries),
    'accountingNote': 'Les fiches canoniques héritées sont conservées à l’identique. Les originaux ne peuvent fermer aucun manque canonique. PNG présent, kit complet, animation et intégration sont des axes distincts.',
})
by_family = Counter(a['category'] for a in assets)
canonical_with_image = parent['currentCounts']['withImage']
canonical_without_image = parent['currentCounts']['withoutImage']
catalog['baselineCounts'] = copy.deepcopy(parent['currentCounts'])
catalog['currentCounts'] = {
    'total': len(catalog['entries']), 'withImage': canonical_with_image + len(assets),
    'withoutImage': canonical_without_image + len(new_entries) - len(assets),
    'certified1to1': 0, 'canonicalTotal': len(parent['entries']),
    'canonicalWithImage': canonical_with_image, 'canonicalWithoutImage': canonical_without_image,
    'originalTotal': len(new_entries), 'originalWithImage': len(assets),
    'originalWithoutImage': len(new_entries) - len(assets),
    'newPngFiles': len(native_png_files), 'selectedOriginalBaseImages': len(assets),
    'additionalRevisionPngFiles': len(native_png_files) - len(assets),
    'originalStageMasters': by_family['stages'],
    'originalParallaxLayersProduced': 0,
    'inheritedWithoutImageAutomaticRetryExcluded': parent['currentCounts']['withoutImageAutomaticRetryExcluded'],
    'inheritedWithoutImageReferenceGap': parent['currentCounts']['withoutImageReferenceGap'],
    'originalGenerationRefusals': int(not (asset_root / 'bosses/nacre_boss_03.png').is_file()),
    'originalEntriesWiredInPrototypeCode': sum(e['prototypeImplementedInCode'] for e in new_entries),
}
catalog['inheritedRemainingCoverage'] = copy.deepcopy(parent['remainingCoverage'])
catalog['remainingCoverage'] = [
    '45 variantes canoniques restent sans image : 30 exclusions de relance automatique et 15 lacunes ouvertes.',
    'Halek Orr, boss original 03, reste sans PNG après refus ; aucun autre personnage ne lui est attribué.',
    'Fidélité 1:1, validation visuelle en jeu, directions natives et animations complètes restent non certifiées.',
    '90 coups normaux et 40 spéciaux sont conçus ; le moteur utilise encore des coups communs et un spécial prototype par combattant.',
    '20 masters de stage ne représentent pas les 100 couches séparées prévues.',
    'Les 60 phases décrites des boss ne sont pas 60 scripts complets : auxiliaires, composants et interactions de décor restent à réaliser.',
    '20 bases d’accessoires et 20 bases FX ne complètent pas les 98 pièces/états et 79 phases d’effets prévues.',
    'Tag, tournoi, provocations/assistances, manette, réseau, déblocages avancés et autres critères non implémentés restent suivis dans gameplay-coverage.json.',
]
catalog['counts'] = {'byCategory': dict(Counter(e['category'] for e in catalog['entries'])),
                     'originalImagesByFamily': dict(by_family)}
catalog['originalExtension'] = {
    'id': 'les_dettes_de_nacre', 'title': 'Les Dettes de Nacre', 'year': 2185,
    'official': False, 'canonical': False,
    'designCounts': {folder: len(objects) for folder, _, objects in families},
    'engineStatusSource': 'docs/armax/lot22/GAMEPLAY_IMPLEMENTATION.md',
    'visualStatusSource': 'docs/armax/lot22/asset-manifest.json',
    'loreStatus': 'Création de fan compatible avec le cadre retenu, sans approbation officielle.',
}
assert catalog['entries'][:216] == parent['entries']
assert len(catalog['entries']) == 326
assert len({e['id'] for e in catalog['entries']}) == 326
assert catalog['policy'] == parent['policy']
assert len(new_entries) == 110
write('production-catalog.json', catalog)
write('asset-manifest.json', {'date': DATE, 'generatedBy': 'image_gen.imagegen',
     'nativeFilesUnmodified': True, 'count': len(assets), 'assets': assets,
     'nativePngFilesIncludingRevisions': len(native_png_files),
     'additionalRevisionsNotNewIdentities': [str(p.relative_to(ROOT)) for p in native_png_files if str(p.relative_to(ROOT)) not in {a['path'] for a in assets}],
     'note': 'Dimensions natives mesurées, aucun agrandissement présenté comme UHD. Les pixels natifs sont conservés ; alphaTest masque le voile très faible au rendu.'})
write('verification-catalog.json', {
    'date': DATE, 'total': 326, 'uniqueIds': 326, 'inheritedRecordsIdentical': True,
    'inheritedPolicyIdentical': True, 'canonicalMissingUnchanged': 45,
    'originalDefined': 110, 'originalImagesMeasured': len(assets),
    'originalImagesByFamily': dict(by_family), 'fidelity1to1Certified': 0,
    'files': [{'path': a['path'], 'sha256': a['sha256'], 'width': a['width'], 'height': a['height']} for a in assets],
})

# The inherited index remains a historical source. A new consolidated index adds
# the original records without silently converting art presence into gameplay.
old_index = read(ROOT / 'docs/armax/bible/content-associations.json')
associations = copy.deepcopy(old_index)
role_map = {'fighters': 'combattant_candidat', 'stages': 'arene_adaptee',
            'enemies': 'opposant_candidat', 'bosses': 'boss_candidat',
            'props': 'accessoire_candidat', 'fx': 'effet_visuel'}
associations.update({'indexId': 'armax-content-associations-lot22', 'date': DATE,
                     'previousIndexRef': 'docs/armax/bible/content-associations.json',
                     'currentCatalog': 'docs/armax/lot22/production-catalog.json'})
associations['authority'].update({'productionSource': 'docs/armax/lot22/production-catalog.json',
    'snapshotRule': '216 associations historiques conservées ; 110 identités originales Nacre ajoutées.',
    'runtimeChanges': True,
    'runtimeQualification': 'Prototype de duel condensé ; preuves de logique, de compilation et limites navigateur dans gameplay-coverage.json.'})
associations['sourceSnapshots'].append({'path': 'docs/armax/lot22/production-catalog.json',
                                      'sha256': digest(OUT / 'production-catalog.json'), 'date': DATE})
for e in new_entries:
    role = old_index['rolePolicies'][role_map[e['plannedUse']]]
    associations['entries'].append({
        'catalogId': e['id'], 'name': e['name'], 'category': e['category'],
        'work': e['work'], 'dlc': e['dlc'], 'variant': e['variant'],
        'plannedUse': role_map[e['plannedUse']], 'policyRef': role_map[e['plannedUse']],
        'catalogSource': {'path': 'docs/armax/lot22/production-catalog.json', 'collection': 'entries', 'id': e['id']},
        'bibleSheets': role.get('sheets', []),
        'guideRequirementIds': role.get('guideRequirementIds', []),
        'productionSnapshot': {'status': e['status'], 'hasImageCandidate': bool(e['assetFiles']),
                               'fidelity1to1Validated': False, 'engineIntegrated': False},
        'readerRef': 'DLC/LesDettesDeNacre/' + ('NACRE_ROSTER_BIBLE.md' if e['plannedUse'] == 'fighters' else 'NACRE_WORLD_BIBLE.md'),
        'specification': {'path': e['specificationFile'], 'id': e['id']},
        'assetFiles': e['assetFiles'], 'canonical': False,
        'runtimeEvidenceFile': e['runtimeEvidenceFile'],
        'qualification': 'Création originale. Le guide décrit le contrat ; le rapport runtime décrit séparément ce qui a réellement été testé.',
    })
associations['counts']['catalogEntriesAssociated'] = 326
associations['counts']['withImageCandidate'] = catalog['currentCounts']['withImage']
associations['counts']['withoutImageCandidate'] = catalog['currentCounts']['withoutImage']
associations['counts']['byCategory'] = dict(Counter(e['category'] for e in associations['entries']))
associations['counts']['byPlannedUse'] = dict(Counter(e['plannedUse'] for e in associations['entries']))
associations['counts']['lot22OriginalAssociations'] = 110
associations['counts']['lot22OriginalImageCandidates'] = len(assets)
associations['counts']['lot22FidelityCertifications'] = 0
associations['counts']['newImages'] = len(assets)
associations['counts']['newPngFilesIncludingRevisions'] = len(native_png_files)
associations['counts']['selectedNewImages'] = len(assets)
associations['counts']['newCombatKits'] = 0
associations['counts']['newPlayableContent'] = 0
associations['counts']['countingNote'] = 'Les compteurs de gameplay restent prudents ; voir gameplay-coverage.json pour les tests du prototype, sans assimiler ces tests à des kits complets.'
assert len({e['catalogId'] for e in associations['entries']}) == 326
write('content-associations.json', associations)
print(json.dumps(catalog['currentCounts'], ensure_ascii=False))
