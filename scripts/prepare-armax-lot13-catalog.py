#!/usr/bin/env python3
"""Consolidate lot 13 from lot 12 and the reviewed producer manifests.

Every run starts from the frozen parent catalogue. No identity, old asset or
gameplay status is inferred from a generated image or a reference thumbnail.
"""
from collections import Counter
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'docs/armax/lot13'
PARENT = ROOT / 'docs/armax/lot12/production-catalog.json'
BASE = 'c67af65cd469da9cc3eb3748d2497ea50a578fbd'
DATE = '2026-11-24'
IDENTITY_FIELDS = ('category', 'name', 'work', 'dlc', 'variant', 'plannedUse')
PARTS = ('fighters', 'costumes', 'stages', 'quarians', 'enemies', 'narrative')
ALLOWED_UPDATES = {'productionNote', 'producedSubzone', 'referenceReadiness',
                   'referenceIdentification', 'referenceGap', 'sourceIds'}


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def as_list(value):
    return value if isinstance(value, list) else ([] if value is None else [value])


def urls(values):
    result = []
    for item in as_list(values):
        if isinstance(item, str):
            result.append(item)
        elif isinstance(item, dict):
            result.extend(item[key] for key in ('url', 'sourcePage', 'directImageUrl') if item.get(key))
    return result


def unique(values):
    return list(dict.fromkeys(value for value in values if value is not None))


def canonical_id(item):
    return item.get('catalogId') or item.get('id')


def main():
    baseline = read(PARENT)
    catalog = deepcopy(baseline)
    index = {entry['id']: entry for entry in catalog['entries']}
    inherited_ids = set(index)
    additions_path = FOLDER / 'catalog-additions.json'
    declared_additions = read(additions_path).get('entries', []) if additions_path.is_file() else []
    for addition in declared_additions:
        entry_id = addition['id']
        assert entry_id not in index, f'Added subject already exists: {entry_id}'
        assert all(field in addition for field in IDENTITY_FIELDS), entry_id
        assert addition.get('addedInLot') == 'lot13' and addition.get('assetFiles') == [], entry_id
        assert not addition.get('fidelity1to1Validated') and not addition.get('engineIntegrated'), entry_id
        catalog['entries'].append(deepcopy(addition))
        index[entry_id] = catalog['entries'][-1]
    inherited_illustrated = {entry['id'] for entry in baseline['entries'] if entry['assetFiles']}
    inherited_excluded = set(baseline['policy']['automaticRetryExcludedIds'])
    tree = subprocess.check_output(['git', 'ls-tree', '-r', '-z', BASE], cwd=ROOT).decode()
    tracked = {record.split('\t', 1)[1]: record.split('\t', 1)[0].split()[2]
               for record in tree.split('\0') if record}
    library = {
        'schemaVersion': 2, 'date': DATE, 'baseCommit': BASE,
        'scope': 'Lot 13 : références des 74 fiches héritées sans image et ajouts séparés, sourcés et limités à cinq. Les 169 identités et usages hérités restent inchangés.',
        'fidelityCertified': False,
        'referenceHandling': 'Les images tierces restent hors dépôt. Le registre conserve leurs URLs, empreintes, observations et limites.',
        'sourceDefinitions': {}, 'catalogUpdates': {}, 'references': [],
        'sourceParts': [], 'excludedResearch': [], 'supplementaryResearchStops': [],
        'catalogAdditions': deepcopy(declared_additions),
    }
    if additions_path.is_file():
        library['sourceParts'].append({'path': str(additions_path.relative_to(ROOT)),
            'sha256': hashlib.sha256(additions_path.read_bytes()).hexdigest(), 'role': 'sourced_catalog_additions'})
    reference_ids = set()
    for part in PARTS:
        path = FOLDER / f'{part}-reference-library.json'
        if not path.is_file():
            continue
        data = read(path)
        assert data.get('fidelityCertified') is False, path.name
        for addition in data.get('catalogAdditions', []):
            entry_id = addition['id']
            assert entry_id not in index, f'Added subject already exists: {entry_id}'
            assert all(field in addition for field in IDENTITY_FIELDS), entry_id
            assert addition.get('addedInLot') == 'lot13', entry_id
            assert addition.get('assetFiles') == [], 'New identities must not presume an image'
            assert not addition.get('fidelity1to1Validated') and not addition.get('engineIntegrated'), entry_id
            library['catalogAdditions'].append(deepcopy(addition))
            catalog['entries'].append(deepcopy(addition))
            index[entry_id] = catalog['entries'][-1]
        library['sourceParts'].append({'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        for key in ('excludedResearch', 'supplementaryResearchStops'):
            library[key].extend(deepcopy(data.get(key, [])))
        for source_id, source in data.get('sourceDefinitions', {}).items():
            previous = library['sourceDefinitions'].get(source_id)
            assert not previous or previous == source, source_id
            library['sourceDefinitions'][source_id] = deepcopy(source)
        for entry_id, update in data.get('catalogUpdates', {}).items():
            assert entry_id in index, entry_id
            assert not (set(update) - ALLOWED_UPDATES), (entry_id, set(update) - ALLOWED_UPDATES)
            assert entry_id not in library['catalogUpdates'], f'Duplicate reference update: {entry_id}'
            library['catalogUpdates'][entry_id] = deepcopy(update)
        for reference in data.get('references', []):
            assert reference['id'] not in reference_ids, reference['id']
            assert set(reference.get('catalogIds', [])).issubset(index), reference['id']
            reference_ids.add(reference['id'])
            library['references'].append(deepcopy(reference))
    assert len(library['catalogAdditions']) <= 5, 'At most five sourced new subjects in lot13'
    for addition in library['catalogAdditions']:
        assert any(addition['id'] in ref.get('catalogIds', []) and ref.get('selectedForGeneration')
                   for ref in library['references']), f'New subject lacks a selected visual reference: {addition["id"]}'
    aya_path = FOLDER / 'aya-reference-research.json'
    if aya_path.is_file():
        aya = read(aya_path)
        assert aya['catalogId'] == 'stg_mea_aya_docks'
        assert aya.get('generationAttempted') is False
        library['sourceParts'].append({'path': str(aya_path.relative_to(ROOT)),
                                       'sha256': hashlib.sha256(aya_path.read_bytes()).hexdigest(),
                                       'role': 'research_annex_without_new_visual_input'})
        library['sourceDefinitions'].update(deepcopy(aya.get('sourceDefinitions', {})))
        library['catalogUpdates'].setdefault(aya['catalogId'], {
            'referenceGap': aya['nextReferenceNeeded'] + ' ' + aya['conclusion'],
            'referenceReadiness': 'recherche_lot13_sans_reference_complete_de_la_sous_zone; aucun_essai',
            'sourceIds': list(aya.get('sourceDefinitions', {})),
        })
    adhi_path = FOLDER / 'adhi-reference-research.json'
    if adhi_path.is_file():
        adhi = read(adhi_path)
        assert adhi.get('generationAttempted') is False
        assert adhi.get('catalogEntryAdded') is False
        library['sourceParts'].append({'path': str(adhi_path.relative_to(ROOT)),
            'sha256': hashlib.sha256(adhi_path.read_bytes()).hexdigest(),
            'role': 'research_annex_for_unadded_subject'})
        library['supplementaryResearchStops'].append({
            'proposedSubject': adhi['proposedSubject'], 'researchFile': str(adhi_path.relative_to(ROOT)),
            'reason': adhi['conclusion'], 'generationAttempted': False, 'catalogEntryAdded': False})
    catalog['sources'].update(deepcopy(library['sourceDefinitions']))
    for entry in catalog['entries']:
        update = deepcopy(library['catalogUpdates'].get(entry['id'], {}))
        extra_source_ids = update.pop('sourceIds', [])
        entry.update(update)
        relevant = [ref for ref in library['references'] if entry['id'] in ref.get('catalogIds', [])]
        extra_source_ids += [source_id for ref in relevant for source_id in ref.get('sourceIds', [])]
        entry['sourceIds'] = unique(entry['sourceIds'] + extra_source_ids)
        entry['sourceUrls'] = unique(entry['sourceUrls'] + [ref.get('directImageUrl') for ref in relevant])
        evidence = {item['referenceId']: item for item in entry.get('referenceEvidence', [])}
        for ref in relevant:
            evidence[ref['id']] = {key: deepcopy(ref.get(key)) for key in (
                'sourcePage', 'directImageUrl', 'sha256', 'inspectedOn', 'reviewNotes', 'selectedForGeneration')}
            evidence[ref['id']]['referenceId'] = ref['id']
        if evidence:
            entry['referenceEvidence'] = list(evidence.values())

    manifests = []
    for part in PARTS:
        path = FOLDER / f'{part}-manifest.json'
        if path.is_file():
            manifest = read(path)
            manifests.append((path, manifest))
            catalog['sources'].update(deepcopy(manifest.get('sourceRecords', {})))
    produced = set()
    all_new_files = set()
    for path, manifest in manifests:
        for asset in manifest.get('assets', []):
            entry_id = canonical_id(asset)
            assert entry_id in index, (path.name, entry_id)
            file = asset.get('path') or asset.get('file')
            if not file:
                continue
            assert entry_id not in produced, f'Duplicate selected master: {entry_id}'
            assert entry_id not in inherited_illustrated, f'Previously illustrated subject: {entry_id}'
            assert entry_id not in inherited_excluded, f'Previously excluded subject: {entry_id}'
            assert file.startswith('public/assets/armax/lot13/'), file
            assert (ROOT / file).is_file(), file
            produced.add(entry_id)
            entry = index[entry_id]
            entry.update({'status': 'Prototype', 'assetPresence': 'candidat_genere_fichier_present',
                          'assetFiles': [file], 'fidelity1to1Validated': False,
                          'engineIntegrated': False, 'imageLot': 'lot13'})
            alternates = as_list(asset.get('alternateFiles'))
            entry['alternateAssetFiles'] = unique(item if isinstance(item, str) else item['path'] for item in alternates)
            entry['alternateAssetNotes'] = [f"{item['path']} : {item.get('note') or item.get('reason') or item.get('reasonNotSelected') or item.get('selection') or 'Version conservée'}"
                                          for item in alternates if isinstance(item, dict)]
            for output in [file] + entry['alternateAssetFiles']:
                assert output not in all_new_files, f'Image attributed to multiple subjects: {output}'
                assert (ROOT / output).is_file(), output
                all_new_files.add(output)
            review = asset.get('visualReview') or asset.get('review') or {}
            entry['referenceReadiness'] = ('references_visuelles_inspectees; prototype_compare_aux_references; validation_1to1_et_moteur_restantes'
                if review.get('comparisonReferenceInspected') or review.get('referenceComparison') else
                'images_de_reference_consultees; comparaison_detaillee_restante')
            entry['generationNotes'] = (as_list(asset.get('notes')) + as_list(review.get('issues'))
                + as_list(review.get('notes')) + as_list(asset.get('referenceLimit')) + entry['alternateAssetNotes'])
            pose = asset.get('pose') or asset.get('observedPose')
            if pose:
                entry['generationNotes'].insert(0, f'Pose obtenue : {pose}')
            for key in ('productionNote', 'producedSubzone'):
                if asset.get(key):
                    entry[key] = asset[key]
            entry['sourceIds'] = unique(entry['sourceIds'] + as_list(asset.get('sourceIds')))
            entry['sourceUrls'] = unique(entry['sourceUrls'] + urls(asset.get('sourceUrls'))
                + urls(asset.get('referenceUrls')) + urls(asset.get('sourceReferences')))
            if entry.get('referenceGap'):
                entry['previousReferenceGap'] = entry.pop('referenceGap')
        for deferred in manifest.get('deferred', []):
            entry_id = canonical_id(deferred)
            assert entry_id in index, entry_id
            if not index[entry_id]['assetFiles']:
                index[entry_id]['referenceGap'] = deferred['note']

    art_path = FOLDER / 'independent-art-review.json'
    art_sources = []
    if art_path.is_file():
        art = read(art_path)
        assert art.get('fidelity1to1Validated') is False and art.get('engineIntegrated') is False
        art_sources.append({'path': str(art_path.relative_to(ROOT)),
            'sha256': hashlib.sha256(art_path.read_bytes()).hexdigest()})
        seen_reviews = set()
        for review in art.get('reviews', []):
            entry_id = review['id']
            assert entry_id in produced and entry_id not in seen_reviews, entry_id
            seen_reviews.add(entry_id)
            assert review.get('independent') is True and review.get('reviewedBy') != review.get('generator'), entry_id
            assert review['path'] in index[entry_id]['assetFiles'], entry_id
            assert hashlib.sha256((ROOT / review['path']).read_bytes()).hexdigest() == review['sha256'], entry_id
            entry = index[entry_id]
            entry['independentReview'] = {'path': str(art_path.relative_to(ROOT)), 'reviewedBy': review['reviewedBy'],
                'result': review['result'], 'assetSha256': review['sha256'], 'inGameReviewed': False}
            entry['generationNotes'] = unique(entry.get('generationNotes', []) +
                ['Revue indépendante : ' + note for note in review.get('reservations', [])])

    attempts, attempt_sources = [], []
    for path in sorted(FOLDER.glob('*attempts.json')):
        log = read(path)
        records = log if isinstance(log, list) else log.get('attempts', log.get('results', []))
        for record in records:
            entry_id = record.get('catalogId') or record.get('subjectId') or record.get('id', '')
            if entry_id not in index:
                candidates = [key for key in index if entry_id.startswith(key + '_')]
                assert len(candidates) == 1, (path.name, entry_id)
                entry_id = candidates[0]
            assert entry_id not in inherited_excluded, f'Retry of historical exclusion: {entry_id}'
            attempts.append({**deepcopy(record), 'catalogId': entry_id})
        attempt_sources.append({'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'count': len(records)})
    for entry in catalog['entries']:
        entry.setdefault('imageLot', '')
        entry.setdefault('alternateAssetFiles', [])
        entry.setdefault('latestGenerationAttempt', 'not_attempted')
        own_attempts = [attempt for attempt in attempts if attempt['catalogId'] == entry['id']]
        if own_attempts:
            status = own_attempts[-1]['status']
            if status == 'generation_failed':
                status = 'blocked' if 'moderation' in str(own_attempts[-1]).lower() else 'failed'
            entry['latestGenerationAttempt'] = status
        elif entry['id'] in produced:
            entry['latestGenerationAttempt'] = 'generated'
        entry['sourceIds'] = unique(entry['sourceIds'])
        assert all(source_id in catalog['sources'] for source_id in entry['sourceIds']), entry['id']
        entry['sourceUrls'] = unique(entry['sourceUrls'] + [catalog['sources'][key]['url'] for key in entry['sourceIds']])
        files = unique(entry['assetFiles'] + entry.get('alternateAssetFiles', []))
        entry['pngCountLot13'] = sum(file.startswith('public/assets/armax/lot13/') for file in files)
        evidence = []
        for file in files:
            local, blob = (ROOT / file).is_file(), tracked.get(file)
            assert local or blob, f'Asset missing from local files and parent Git tree: {file}'
            evidence.append({'path': file, 'locallyMaterialized': local, 'gitBlob': blob,
                             'baseCommit': BASE if blob else None})
        entry['assetAvailabilityEvidence'] = evidence
    exclusions = inherited_excluded | {entry['id'] for entry in catalog['entries'] if entry.get('latestGenerationAttempt') == 'blocked'}
    catalog['policy']['automaticRetryExcludedIds'] = sorted(exclusions)
    catalog.update({
        'catalogId': 'armax-current-lot13-20261124', 'revisionLot': 'lot13',
        'updatedOn': DATE, 'timezone': 'Europe/Paris', 'baseCommit': BASE,
        'parentCatalog': str(PARENT.relative_to(ROOT)), 'parentCatalogSha256': hashlib.sha256(PARENT.read_bytes()).hexdigest(),
        'carriedForwardEntries': len(baseline['entries']), 'addedEntries': len(library['catalogAdditions']),
        'addedEntryIds': [entry['id'] for entry in library['catalogAdditions']],
        'scope': 'Lot 13 : production des fiches héritées sans image et ajouts sourcés décomptés séparément. Les 169 identités et usages hérités sont conservés. Les sprites RPG, poses supplémentaires et originaux historiques gardent leurs périmètres distincts.',
        'researchReferenceFile': 'docs/armax/lot13/reference-library.json',
        'baselineCounts': {'total': 169, 'withImage': 95, 'withoutImage': 74},
        'totalEntries': len(catalog['entries']),
        'counts': dict(Counter(entry['category'] for entry in catalog['entries'])),
    })
    catalog['currentCounts'] = {
        'total': len(catalog['entries']), 'withImage': sum(bool(entry['assetFiles']) for entry in catalog['entries']),
        'withoutImage': sum(not entry['assetFiles'] for entry in catalog['entries']),
        'certified1to1': sum(bool(entry['fidelity1to1Validated']) for entry in catalog['entries']),
        'newIllustratedSubjects': len(produced), 'newInheritedIllustratedSubjects': len(produced & inherited_ids),
        'newAddedIllustratedSubjects': len(produced - inherited_ids), 'newPngFiles': len(all_new_files),
        'blockedSubjects': len(exclusions),
    }
    for previous in baseline['entries']:
        current = index[previous['id']]
        assert all(current[field] == previous[field] for field in IDENTITY_FIELDS), previous['id']
        for key in ('assetFiles', 'alternateAssetFiles'):
            assert set(previous.get(key, [])).issubset(current.get(key, [])), (previous['id'], key)
    write(FOLDER / 'reference-library.json', library)
    write(FOLDER / 'production-catalog.json', catalog)
    write(FOLDER / 'consolidation-inputs.json', {'date': DATE, 'baseCommit': BASE,
        'parentCatalogSha256': catalog['parentCatalogSha256'],
        'referenceParts': library['sourceParts'], 'attemptSources': attempt_sources,
        'independentReviewSources': art_sources,
        'manifestSources': [{'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path, _ in manifests],
        'identityContinuity': {'subjects': 169, 'fields': list(IDENTITY_FIELDS), 'checkedFields': 1014, 'unchanged': True},
        'counts': catalog['currentCounts']})
    write_listing(catalog, library)
    print(json.dumps({'catalog': str(FOLDER / 'production-catalog.json'), 'counts': catalog['currentCounts'],
                      'referenceRecords': len(library['references']), 'generationCallsRecorded': len(attempts)}))


def write_listing(catalog, library):
    counts = catalog['currentCounts']
    names = {'personnage': 'Personnages / ennemis', 'costume': 'Costumes', 'stage': 'Stages'}
    roles = {'combattant_candidat': 'Combattant proposé', 'opposant_candidat': 'Adversaire proposé',
             'boss_candidat': 'Boss proposé', 'narration_support': 'Narration / soutien',
             'variante_visuelle': 'Variante de tenue', 'arene_adaptee': 'Arène adaptée'}
    lines = ['# Mass Effect — Armax : catalogue courant, lot 13', '',
        'Mise à jour : 24 novembre 2026. Source éditable : [production-catalog.json](production-catalog.json).', '',
        f"**{counts['total']} fiches : {catalog['counts']['personnage']} personnages/ennemis, {catalog['counts']['costume']} costumes et {catalog['counts']['stage']} stages. {counts['withImage']} ont une image candidate et {counts['withoutImage']} restent sans image.**", '',
        f"Le lot 13 illustre **{counts['newInheritedIllustratedSubjects']} des 74 fiches héritées sans image** et **{counts['newAddedIllustratedSubjects']} nouvelles fiches**, avec **{counts['newPngFiles']} PNG originaux**, révisions conservées comprises. **{catalog['addedEntries']} identités sourcées sont ajoutées**. Les 1014 champs d’identité et d’usage prévu des 169 fiches héritées sont conservés. Le [lot 12](../lot12/README.md) reste un historique intact.", '',
        'Tous les nouveaux fichiers restent **Prototype**. Une image fixe ne valide ni fidélité 1:1, ni animation complète, ni intégration au moteur. Les fonctions de combattant, boss ou soutien sont celles proposées pour le mode annexe. Les sprites du RPG principal gardent leur périmètre propre.', '',
        '## Fiches illustrées dans ce lot', '',
        '| Sujet | Opus | Variante | Image retenue |', '|---|---|---|---|']
    for entry in catalog['entries']:
        if entry.get('imageLot') == 'lot13':
            file = entry['assetFiles'][0]
            lines.append(f"| {entry['name']}{' (nouvelle fiche)' if entry['addedInLot'] == 'lot13' else ''} | {entry['work']} | {entry['variant']} | [{Path(file).name}](../../../{file}) |")
    for category in names:
        lines += ['', '## ' + names[category], '',
            '| Sujet | Opus | Variante / lieu | Usage proposé | Priorité | État | Fiche créée | Sources |',
            '|---|---|---|---|---|---|---|---|']
        for entry in catalog['entries']:
            if entry['category'] != category:
                continue
            refs = ', '.join(f"[{key}]({catalog['sources'][key]['url']})" for key in entry['sourceIds'])
            state = entry['status'] + (' — image candidate' if entry['assetFiles'] else ' — image absente')
            if entry.get('latestGenerationAttempt') == 'blocked':
                state += ' ; essai bloqué'
            lines.append(f"| {entry['name']} | {entry['work']} | {entry['variant']}{' — ' + entry['dlc'] if entry['dlc'] else ''} | {roles[entry['plannedUse']]} | {entry['priority']} | {state} | {entry['addedInLot']} | {refs} |")
    lines += ['', '## Étapes encore nécessaires', '', *['- ' + item for item in catalog['remainingCoverage']], '',
        'La [bibliothèque de références](reference-library.json) distingue les images inspectées et leur sélection. Les références tierces restent hors dépôt. Les 86 originaux récupérés restent suivis dans [l’inventaire de récupération](../recovery-20261120/asset-inventory.json). Les lots 01/02 et la bible originale de 99 pages restent non retrouvés.', '']
    (FOLDER / 'MANQUANTS_2026-11-24.md').write_text('\n'.join(lines))
    notes = ['# Références inspectées — lot 13', '',
        'État au 24 novembre 2026. Le [registre complet](reference-library.json) conserve URLs, empreintes, observations et sélection. Les images de référence tierces restent hors dépôt.', '',
        f"{len(library['references'])} enregistrements visuels, dont {sum(bool(ref.get('selectedForGeneration')) for ref in library['references'])} sélectionnés pour guider un essai. La sélection ne prouve ni génération ni fidélité 1:1.", '']
    for entry in catalog['entries']:
        refs = [ref for ref in library['references'] if entry['id'] in ref.get('catalogIds', [])]
        if not refs and entry['id'] not in library['catalogUpdates']:
            continue
        notes += [f"## {entry['name']} — {entry['work']}", '', f"Identifiant : `{entry['id']}`. Variante : **{entry['variant']}**.", '', entry.get('productionNote', ''), '']
        for ref in refs:
            state = 'Retenue pour guidage' if ref.get('selectedForGeneration') else 'Inspectée, non retenue pour guidage'
            notes.append(f"- **{state} : `{ref.get('filename', ref['id'])}`**. [Source]({ref['sourcePage']}). {' '.join(as_list(ref.get('reviewNotes')))}")
        notes.append('')
    (FOLDER / 'REFERENCE_NOTES.md').write_text('\n'.join(notes))
    gaps = ['# Références encore insuffisantes — lot 13', '',
        'Ces fiches restent sans image. Une piste bibliographique ou un modèle natif incomplet ne suffit pas à confirmer la variante publiée.', '',
        '| Identifiant | Sujet | Variante | Preuve encore nécessaire |', '|---|---|---|---|']
    for entry in catalog['entries']:
        if not entry['assetFiles'] and entry.get('referenceGap'):
            gap = str(entry['referenceGap']).replace('|', '/').replace('\n', ' ')
            gaps.append(f"| `{entry['id']}` | {entry['name']} | {entry['variant']} | {gap} |")
    gaps += ['', 'Les lacunes déjà observées au lot 12 restent consultables dans [l’historique](../lot12/REFERENCE_GAPS.md). Le [listing complet](MANQUANTS_2026-11-24.md) inclut également les fiches non tentées et les exclusions conservées.', '']
    (FOLDER / 'REFERENCE_GAPS.md').write_text('\n'.join(gaps))
    selected = [entry for entry in catalog['entries'] if entry.get('imageLot') == 'lot13']
    table = ['| Catégorie | Fiches | Images avant | Ajouts du lot 13 | Avec image | Sans image |',
             '|---|---:|---:|---:|---:|---:|']
    previous_with = {'personnage': 35, 'costume': 14, 'stage': 46}
    for category, label in names.items():
        population = [entry for entry in catalog['entries'] if entry['category'] == category]
        with_image = sum(bool(entry['assetFiles']) for entry in population)
        table.append(f'| {label} | {len(population)} | {previous_with[category]} | {with_image - previous_with[category]} | {with_image} | {len(population) - with_image} |')
    table.append(f"| **Total** | **{counts['total']}** | **95** | **{len(selected)}** | **{counts['withImage']}** | **{counts['withoutImage']}** |")
    readme = ['# Armax Relay Clash — lot 13', '',
        'Continuation du 24 novembre 2026. Base : `main`, commit `c67af65cd469da9cc3eb3748d2497ea50a578fbd`, après fusion de la PR #6.', '',
        f"Le lot 13 apporte **{len(selected)} fiches nouvellement illustrées et {counts['newPngFiles']} PNG originaux** : **{counts['newInheritedIllustratedSubjects']} des 74 anciens manquants** et **{counts['newAddedIllustratedSubjects']} nouvelles fiches**. Les **169 identités et usages hérités** sont conservés ; **{catalog['addedEntries']} identités sourcées** sont ajoutées séparément. Le corpus atteint **{190 + counts['newPngFiles']} PNG originaux**, hors trois aperçus historiques de contrôle.", '',
        '## Couverture du catalogue', '', *table, '',
        'Une fiche avec image possède un candidat visuel. Des accessoires, poses, faces cachées, animations ou composants prévus peuvent encore manquer. Les nouveaux fichiers restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`.', '',
        '## Images produites', '',
        '| Sujet | Variante | Production de cette passe | Fichier |', '|---|---|---|---|']
    for entry in selected:
        file = entry['assetFiles'][0]
        note = entry.get('producedSubzone') or entry.get('generationNotes', ['Pose fixe'])[0]
        readme.append(f"| {entry['name']} — {entry['work']} | {entry['variant']} | {str(note).replace('|', '/')} | [{Path(file).name}](../../../{file}) |")
    alternates = [(entry, file) for entry in selected for file in entry.get('alternateAssetFiles', [])]
    if alternates:
        readme += ['', '## Révisions conservées', '',
            'Ces sorties originales restent consultables pour documenter les corrections ; elles ne comptent pas comme de nouvelles fiches.', '']
        for entry, file in alternates:
            readme.append(f"- {entry['name']} : [{Path(file).name}](../../../{file}). La version courante figure dans le tableau ci-dessus et les motifs de révision dans le manifeste de sa famille.")
    readme += ['', '## Références et limites', '',
        'La [bibliothèque de références](reference-library.json), les [notes d’inspection](REFERENCE_NOTES.md) et les [lacunes documentées](REFERENCE_GAPS.md) conservent les décisions de sélection. Les références tierces sont conservées hors dépôt ; les fichiers livrés sont les PNG originaux du générateur, accompagnés de leurs empreintes et prompts.', '',
        f"Les **{counts['blockedSubjects']} exclusions de génération** restent recensées dans le catalogue. Les identités historiquement refusées ne sont pas relancées. Les fiches sans référence suffisante restent sans image et ne sont pas comptées comme produites.", '',
        'Le [catalogue courant](production-catalog.json), le [listing complet](MANQUANTS_2026-11-24.md) et le [classeur](Mass_Effect_Armax_Suivi_Lot13_2026-11-24.xlsx) partagent les mêmes identifiants. Le classeur conserve les feuilles Synthese, Catalogue et Recuperes. Les lots antérieurs restent intacts.', '',
        '## Provenance et contrôles', '',
        'Les manifestes par famille relient chaque image au prompt, à la sortie originale et aux références sélectionnées. La [revue indépendante](independent-art-review.json), la [vérification des fichiers et du catalogue](verification.json), le [rapport du classeur](workbook-verification.json) et le [contrôle des liens](link-verification.json) précisent leurs périmètres et limites. Une réussite technique ne certifie pas la fidélité artistique.', '',
        'Le contrôle compare les dimensions, la transparence, les SHA-256, les octets des sorties originales, les identités héritées et les cellules exportées. Dans une copie partielle, les anciens fichiers sont vérifiés par leurs chemins dans l’arbre Git ; leurs pixels ne sont pas redécodés. Le [texte de PR](PR_DESCRIPTION.md) rassemble le périmètre livré et les vérifications exécutées.', '',
        '## Régénérer le suivi', '',
        'Depuis la racine du dépôt, consolider les manifestes terminés :', '', '```bash',
        'python scripts/prepare-armax-lot13-catalog.py', '```', '',
        'Construire le classeur avec le runtime principal géré et un répertoire de travail temporaire :', '', '```bash',
        'ARMAX_BUILD_DIR=$(mktemp -d)',
        'ln -s "$CODEX_PRIMARY_RUNTIME_NODE_MODULES" "$ARMAX_BUILD_DIR/node_modules"',
        'cp scripts/build-armax-lot13-workbook.mjs "$ARMAX_BUILD_DIR/build.mjs"',
        '"$CODEX_PRIMARY_RUNTIME_NODE" "$ARMAX_BUILD_DIR/build.mjs" "$PWD"', '```', '',
        'Le classeur est créé, recalculé et rendu par `@oai/artifact-tool`. Les deux exporteurs WASM ont bloqué dans cet environnement : le générateur utilise donc `scripts/export-armax-lot13-workbook-xml.py` pour sérialiser son checkpoint en OpenXML avec la bibliothèque standard Python et les styles natifs inchangés du classeur lot 12 récupéré dans Git. Il exige aussi `openpyxl` uniquement pour relire le fichier produit, sans le modifier. Les cellules, formules et caches, styles, dimensions et contrôles sont comparés ; deux rendus supplémentaires, Synthese et Jack, sont reconstruits à partir des valeurs effectivement relues du XLSX. Le rapport du classeur distingue ces rendus des huit aperçus du modèle avant export.', '',
        'La vérification complète des images nécessite Python avec Pillow, le cache local des références tierces et les sorties natives du générateur aux chemins consignés dans les manifestes et la bibliothèque. Ces entrées restent hors dépôt : un simple clone ne peut pas rejouer leurs comparaisons. Les PNG livrés et leurs empreintes restent vérifiables dans le dépôt ; le contrôle des liens ne dépend pas de ce cache externe.', '',
        'Le générateur recalcule, contrôle les formules et produit des aperçus. Inspecter les aperçus du nouvel export avant de renseigner sa revue visuelle, puis lancer :', '', '```bash',
        'python scripts/verify-armax-lot13.py --report docs/armax/lot13/verification.json',
        'python scripts/verify-armax-lot13-links.py', '```', '',
        'Aucun changement du moteur ou des sauvegardes n’est inclus. Les poses fixes ne valident ni animation complète, ni arène jouable, ni parallaxe. Le lancement dans le jeu et Excel natif reste distinct des contrôles consignés ici.', '']
    (FOLDER / 'README.md').write_text('\n'.join(readme))


if __name__ == '__main__':
    main()
