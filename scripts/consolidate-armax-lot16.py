#!/usr/bin/env python3
"""Consolidate native lot16 outputs without changing inherited identities or rules."""
import copy
import hashlib
import json
from collections import Counter
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
LOT = ROOT / 'docs/armax/lot16'
BASE = '71955d9143562d6a44a8b8d48bc552978372bc1e'
FIELDS = ['category', 'name', 'work', 'dlc', 'variant', 'plannedUse']
DATE = '2026-11-25'
EXPECTED = {
    'layer_port_hanshan_architecture_distant_fixed',
    'layer_port_hanshan_rear_structures_fixed',
    'layer_port_hanshan_floor_fixed',
    'prop_me2_illusive_man_chair', 'chr_me2_illusive_man',
}


def base_bytes(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)


def base_json(path):
    return json.loads(base_bytes(path))


def read(path):
    return json.loads((ROOT / path).read_text())


def save(path, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def text(path, value):
    (ROOT / path).write_text(value.rstrip() + '\n')


def uniq(items):
    return list(dict.fromkeys(items))


def main():
    source_dirs = ['source-port-hanshan', 'source-illusive-man']
    assets, attempts, inputs = [], [], []
    for directory in source_dirs:
        manifest_path = f'docs/armax/lot16/{directory}/manifest.json'
        attempt_path = f'docs/armax/lot16/{directory}/attempts.json'
        assets.extend(read(manifest_path)['assets'])
        rows = read(attempt_path)['attempts']
        attempts.extend(rows)
        inputs.append({'path': manifest_path, 'sha256': sha((ROOT / manifest_path).read_bytes()),
                       'attemptPath': attempt_path, 'count': len(rows)})
    selected = [a for a in assets if a.get('selected', True)]
    assert {a['catalogId'] for a in selected} == EXPECTED
    assert len(selected) == 5
    assert len({a['path'] for a in assets}) == len(assets)
    for a in assets:
        assert (ROOT / a['path']).is_file(), a['path']
        assert sha((ROOT / a['path']).read_bytes()) == a['technical']['sha256'], a['path']
        assert (ROOT / a['promptFile']).is_file()
        assert a['fidelity1to1Validated'] is False and a['engineIntegrated'] is False
        assert a['status'] == 'Prototype'
        a['independentReviewFile'] = 'docs/armax/lot16/qa/port-hanshan-independent-review.json' if a['catalogId'].startswith('layer_') else 'docs/armax/lot16/qa/illusive-man-independent-review.json'

    old = base_json('docs/armax/lot14/production-catalog.json')
    catalog = copy.deepcopy(old)
    entries = catalog['entries']
    by_id = {e['id']: e for e in entries}
    old_ids = set(by_id)
    assert len(old_ids) == 188
    for e in entries:
        e['pngCountLot16'] = 0
    for a in selected:
        identity = a['catalogId']
        if identity not in by_id:
            e = {k: copy.deepcopy(a[k]) for k in FIELDS}
            e.update(id=identity, priority='P1', status='Défini', assetFiles=[], alternateAssetFiles=[],
                     sourceIds=[], sourceUrls=[], addedInLot='lot16', generationNotes=[],
                     fidelity1to1Validated=False, engineIntegrated=False)
            for n in range(7, 17):
                e[f'pngCountLot{n:02d}'] = 0
            entries.append(e)
            by_id[identity] = e
        else:
            e = by_id[identity]
            assert [e[k] for k in FIELDS] == [a[k] for k in FIELDS], identity
            e['productionHistoryBeforeLot16'] = {
                'source': 'docs/armax/lot14/production-catalog.json', 'commit': BASE,
                'productionNote': e.get('productionNote'), 'generationNotes': e.get('generationNotes', [])}
        related = [x for x in assets if x['catalogId'] == identity]
        e['assetFiles'] = uniq(e['assetFiles'] + [a['path']])
        e['alternateAssetFiles'] = uniq(e['alternateAssetFiles'] + [x['path'] for x in related if not x.get('selected', True)])
        e['sourceUrls'] = uniq(e['sourceUrls'] + a.get('sourceUrls', []))
        e['sourceIds'] = uniq(e.get('sourceIds', []) + ['lot16_' + identity])
        e.update(status='Prototype', assetPresence='candidat_genere_fichier_present',
                 latestGenerationAttempt='generated', imageLot='lot16', pngCountLot16=len(related),
                 referenceReadiness='references_inspectees; candidat_compare; fidelite_et_moteur_non_valides')
        e['productionNote'] = ('Lot16 — ' + a['observedPose'] +
            (' La pose debout lot13 reste conservée séparément.' if identity == 'chr_me2_illusive_man' else ''))
        e['generationNotes'] = list(a.get('reviewNotes', []))
        e['lot16ManifestRef'] = 'docs/armax/lot16/manifest.json'
        e['referenceEvidenceLot16'] = copy.deepcopy(a.get('referenceFiles', []))
        e['referenceGap'] = 'Comparaison au jeu, surfaces cachées et intégration moteur restent ouvertes.'
        e['assetAvailabilityEvidenceLot16'] = [{'path': x['path'], 'sha256': x['technical']['sha256'],
                                               'locallyMaterialized': True} for x in related]
        if a.get('layerId'):
            e.update(contentSubtype='calque_decor', layerId=a['layerId'],
                     relatedStageDocumentaryId='ME1-VS-PORT-HANSHAN-REF-01')
        if identity == 'prop_me2_illusive_man_chair':
            e['relatedCharacterId'] = 'chr_me2_illusive_man'

    for previous in old['entries']:
        current = by_id[previous['id']]
        assert all(current[k] == previous[k] for k in FIELDS)
        retained = set(current['assetFiles'] + current['alternateAssetFiles'])
        assert set(previous['assetFiles'] + previous['alternateAssetFiles']) <= retained
        if previous.get('latestGenerationAttempt') == 'blocked':
            assert current['latestGenerationAttempt'] == 'blocked'

    additional_exclusions = [
        'chr_me3_daro_xen', 'chr_me2_collector_assassin', 'chr_me2_collector_guardian',
        'chr_me1_kate_bowman', 'chr_me3_shala_raan', 'chr_mea_reyes_vidal',
        'cst_me2_garrus_loyalty', 'cst_me3_edi_aap1', 'cst_me3_shepard_male_ajax',
        'cst_me2_shepard_female_kestrel', 'cst_me2_shepard_male_blood_dragon',
        'cst_me2_zaeed_loyalty', 'cst_me2_legion_loyalty',
    ]
    historical_exclusions = [e['id'] for e in old['entries'] if e['latestGenerationAttempt'] == 'blocked']
    excluded_ids = historical_exclusions + additional_exclusions
    assert len(excluded_ids) == len(set(excluded_ids)) == 26
    assert all(i in by_id for i in excluded_ids)
    catalog['policy']['automaticRetryExcludedIds'] = excluded_ids
    catalog['policy']['exclusionEvidenceQualification'] = '13 exclusions documentées dans le catalogue lot14 ; 13 supplémentaires rapportées dans le contexte précédent, journaux originaux non récupérés.'
    for identity in additional_exclusions:
        by_id[identity]['generationExclusionReportedInPriorSession'] = {
            'source': 'docs/armax/lot16/recovery-status.json',
            'evidenceKind': 'previous_conversation_report_original_logs_unavailable',
            'retryAllowed': False, 'newAttemptInLot16': False,
            'note': 'Refus antérieur rapporté ; journal original non récupéré. Le statut hérité du lot14 reste historique.'}
    assert not EXPECTED.intersection(excluded_ids)

    total, with_image = len(entries), sum(bool(e['assetFiles']) for e in entries)
    new_ids = [e['id'] for e in entries if e['id'] not in old_ids]
    catalog.update(catalogId='armax-production-catalog-lot16', revisionLot='lot16', updatedOn=DATE,
        createdOn=DATE, parentCatalog='docs/armax/lot14/production-catalog.json', baseCommit=BASE,
        parentCatalogSha256=sha(base_bytes('docs/armax/lot14/production-catalog.json')),
        totalEntries=total, carriedForwardEntries=188, addedEntries=len(new_ids), addedEntryIds=new_ids,
        researchReferenceFile='docs/armax/lot16/reference-library.json', counts=dict(Counter(e['category'] for e in entries)),
        baselineCounts={'total': 188, 'withImage': 128, 'withoutImage': 60},
        globalFidelityCertified=False, engineImplementationClaimed=False)
    catalog['scope'] = f'Lot16 : trois calques Port Hanshan, un fauteuil narratif et une pose assise sur une identité déjà illustrée. Les188identités héritées sont conservées. {len(assets)}PNG natifs pour5sujets, dont une révision écartée ; quatre nouvellesfiches. Lot15 non récupéré, sans certification1:1 ni intégration moteur.'
    catalog['currentCounts'] = dict(total=total, withImage=with_image, withoutImage=total-with_image,
        certified1to1=0, newIllustratedSubjects=len(selected), newInheritedIllustratedSubjects=1,
        newAddedIllustratedSubjects=len(new_ids), newPngFiles=len(assets), blockedSubjects=13,
        priorReportedAdditionalExclusions=13, totalGenerationExclusions=26,
        previouslyUnillustratedInheritedSubjectsNowIllustrated=0, inheritedSubjectsWithAdditionalPose=1,
        stageMasters=52, stageLayers=3)
    catalog['accountingNote'] = 'Lot15 non récupéré : ses113PNG rapportés sont exclus des présences. Les5sujets du lot16 comprennent4nouvellesfiches et1pose additionnelle sur une fiche déjà illustrée.'
    catalog['remainingCoverage'] += [
        'Lot15 : récupération des originaux, des prompts, des références et du classeur avant restauration à l’identique.',
        'Lot16 : calage des calques Port Hanshan, contours alpha et intégration de la parallaxe restent à contrôler.',
        'Lot16 : fauteuil et pose assise de l’Homme Trouble candidats ; géométrie, costume et visage à comparer au modèle ME2.',
    ]
    for a in selected:
        catalog['sources']['lot16_' + a['catalogId']] = {
            'title': a['name'], 'urls': a.get('sourceUrls', []),
            'sourceType': 'visual_references_with_per_asset_qualification',
            'manifestRef': 'docs/armax/lot16/manifest.json', 'checkedOn': DATE}
    save('docs/armax/lot16/production-catalog.json', catalog)
    save('docs/armax/lot16/manifest.json', dict(schemaVersion=1, lot='lot16', date=DATE,
        timezone='Europe/Paris', baseCommit=BASE, scope='Images fixes candidates, aucune animation ou intégration moteur.',
        counts=dict(subjects=len(selected), selectedPngs=len(selected), supersededPngs=len(assets)-len(selected),
                    originalPngs=len(assets), generationCalls=len(attempts), addedEntries=len(new_ids),
                    inheritedSubjectsWithAdditionalPose=1, previouslyMissingInheritedIdentitiesIllustrated=0),
        globalFidelityCertified=False, engineImplementationClaimed=False, nativeBytesPreserved=True, assets=assets))
    save('docs/armax/lot16/attempts.json', {'attempts': attempts})
    save('docs/armax/lot16/consolidation-inputs.json', {'baseCommit': BASE, 'attemptSources': inputs,
        'lot15OriginalsAvailable': False, 'generationExclusions': excluded_ids,
        'exclusionEvidence': {'baselineManifested': historical_exclusions, 'priorConversationReportedOnly': additional_exclusions}})
    save('docs/armax/lot16/reference-library.json', {'schemaVersion': 1, 'date': DATE, 'baseCommit': BASE,
        'catalogAdditions': [{k: e[k] for k in ['id']+FIELDS} for e in entries if e['id'] in new_ids],
        'assets': [{k: a.get(k) for k in ['catalogId', 'path', 'sourceUrls', 'referenceFiles', 'promptFile', 'reviewNotes']} for a in selected],
        'unresolvedReferenceReview': 'docs/armax/lot16/research/reference-locks-review.json',
        'externalImagesRedistributed': False})

    index = base_json('docs/armax/bible/content-associations.json')
    index['previousIndexRef'] = {'path': 'docs/armax/bible/content-associations.json', 'commit': BASE}
    index.update(indexId='content-associations-lot16-2026-11-25', date=DATE, baseCommit=BASE)
    index['authority'].update(productionSource='docs/armax/lot16/production-catalog.json', productionChanges=True,
        snapshotRule='Les identités héritées restent celles du commit de base ; le catalogue lot16 de cette livraison ajoute les composants documentés. Les empreintes des sources courantes sont consignées dans sourceSnapshots.')
    layer_policy = copy.deepcopy(index['rolePolicies']['arene_adaptee'])
    layer_policy.update(label='Calque de décor', plannedUse='calque_decor',
        purpose='Séparer l’architecture, les structures arrière et le sol de l’arène Port Hanshan.',
        qualification='Calque fixe associé à une arène existante ; ne crée aucune arène supplémentaire, collision ou vitesse de parallaxe validée.')
    index['rolePolicies']['calque_decor'] = layer_policy
    associations = []
    for a in selected:
        role = a['plannedUse']
        sheets = ['G', 'J'] if role == 'calque_decor' else ['B', 'F', 'J']
        gids = ['ARMAX-G02','ARMAX-G13','ARMAX-G14','ARMAX-G15','ARMAX-G17','ARMAX-G22','ARMAX-G26','ARMAX-G27'] if role == 'calque_decor' else ['ARMAX-G02','ARMAX-G03','ARMAX-G07','ARMAX-G09','ARMAX-G10','ARMAX-G16','ARMAX-G17','ARMAX-G26','ARMAX-G27']
        associations.append(dict(catalogId=a['catalogId'], path=a['path'], work=a['work'], dlc=a['dlc'],
            bibleSheets=sheets, guideRequirementIds=gids,
            guideRefs=['docs/armax/bible/BIBLE_ARMAX_INTEGREE.md#g'+g[-2:] for g in gids],
            role=role, status='visual_candidate_documented', runtimeAttachment=False,
            fidelity1to1Validated=False, fullActionDependencyClosed=False, completeNarrativeSceneProduced=False,
            actionAssociations=[], relatedDocumentaryId='ME1-VS-PORT-HANSHAN-REF-01' if role == 'calque_decor' else 'chr_me2_illusive_man',
            qualification='Hypothèses de calage et de parallaxe conservées ; aucun moteur validé.' if role == 'calque_decor' else 'Briefing et présence narrative ME2 ; aucune capacité de combat ajoutée.',
            reviewNotes=a.get('reviewNotes', [])))
    save('docs/armax/lot16/bible-asset-associations.json', dict(schemaVersion=1, date=DATE, baseCommit=BASE,
        commonRules='RC-ARMAX-0.1', scope='Raccord documentaire des images fixes du lot16.',
        fullActionDependenciesClosed=0, narrativeScenesProduced=0, associations=associations))
    assoc_by_id = {a['catalogId']: a for a in associations}
    for row in index['entries']:
        row['catalogSource']['path'] = 'docs/armax/lot16/production-catalog.json'
        if row['catalogId'] in assoc_by_id:
            row['lot16AssetAssociations'] = [assoc_by_id[row['catalogId']]]
            row['lot16ContextNotes'] = [by_id[row['catalogId']]['productionNote']]
    for identity in new_ids:
        e, a = by_id[identity], assoc_by_id[identity]
        row = {k: e[k] for k in FIELDS}
        row.update(catalogId=identity, catalogSource=dict(path='docs/armax/lot16/production-catalog.json', collection='entries', id=identity),
            policyRef=e['plannedUse'], bibleSheets=a['bibleSheets'], guideRequirementIds=a['guideRequirementIds'],
            productionSnapshot=dict(status='Prototype', hasImageCandidate=True, fidelity1to1Validated=False, engineIntegrated=False),
            readerRef='docs/armax/bible/ASSOCIATIONS_CONTENU.md#'+identity, designLinks=[], existingLotAssociation=None,
            contextNotes=[], lot16ContextNotes=[a['qualification']], lot16AssetAssociations=[a],
            designBindingState='documentary_component_binding_no_new_kit')
        if e['plannedUse'] == 'calque_decor':
            row['componentParent'] = {'sourcePath':'docs/combat-2d/production.json','id':'ME1-VS-PORT-HANSHAN-REF-01','layerId':e['layerId']}
        else:
            row['relatedCharacterId'] = 'chr_me2_illusive_man'
            row['specificSheetQualification'] = 'B/F/J : accessoire de scène narrative ; le cadre C général des accessoires de combat ne lui attribue aucune action.'
        index['entries'].append(row)
    index['counts'].update(catalogEntriesAssociated=total, byCategory=catalog['counts'],
        byPlannedUse=dict(Counter(e['plannedUse'] for e in entries)), withImageCandidate=with_image,
        withoutImageCandidate=total-with_image, newImages=len(assets), selectedNewImages=len(selected),
        existingLot14AssetAssociationsRetained=20, lot16AssetAssociations=5, stageMasters=52, stageLayers=3)
    index['sourceSnapshots'].append({'path':'docs/armax/lot16/production-catalog.json',
        'sha256':sha((LOT/'production-catalog.json').read_bytes()), 'commit':None,
        'state':'same_delivery_verified_by_sha256'})
    index['sourceSnapshots'].append({'path':'docs/armax/lot16/bible-asset-associations.json',
        'sha256':sha((LOT/'bible-asset-associations.json').read_bytes()), 'commit':None,
        'state':'same_delivery_verified_by_sha256'})
    save('docs/armax/bible/content-associations.json', index)
    guide = base_json('docs/armax/bible/guide-associations.json')
    guide['productionContinuations'].append(dict(lot='lot16', date=DATE,
        catalogRef='docs/armax/lot16/production-catalog.json', assetAssociationsRef='docs/armax/lot16/bible-asset-associations.json',
        manifestRef='docs/armax/lot16/manifest.json', verificationRef='docs/armax/lot16/verification.json',
        subjects=5, newNativePngs=len(assets), selectedPngs=5, fidelity1to1Validated=False, engineImplementationClaimed=False,
        scope='Quatre fiches ajoutées, une pose sur une fiche déjà illustrée. Les30rubriques et90critères restent inchangés. Lot15 exclu des présences.'))
    guide['contentAssociationIndex'].update(revision='content-associations-lot16-2026-11-25', baseCommit=BASE,
        catalogRef='docs/armax/lot16/production-catalog.json', verificationRef='docs/armax/lot16/verification.json',
        catalogEntriesAssociated=total, productionChanges=True, runtimeChanges=False)
    save('docs/armax/bible/guide-associations.json', guide)

    remaining = [dict(catalogId=e['id'], name=e['name'], work=e['work'], variant=e['variant'],
        nextStep='Conserver l’exclusion de génération.' if e['id'] in excluded_ids else
                 'Retrouver les originaux et références du lot15, puis vérifier l’identité avant restauration ou nouvelle production.',
        generationExcluded=e['id'] in excluded_ids, hasPublishedImage=False) for e in entries if not e['assetFiles']]
    save('docs/armax/lot16/remaining-work.json', dict(schemaVersion=1, date=DATE,
        missingCatalogEntries=remaining, totalMissingEntries=len(remaining), generationExcludedIds=excluded_ids,
        referencesStillOpen=['cst_me2_thane_loyalty','DRONE-FIDELITY'],
        revisionsAwaitingLot15Originals=['Meridian floor','Fortification vertical framing','Randall rival p02 orientation','Nyreen ending p02 profile'],
        fixedLayersProduced=['PH-20','PH-30','PH-40'], existingForegroundRetained='ME1-VS-PORT-HANSHAN-NEAR-01',
        fullAnimationFamiliesClosed=0, completeNarrativeScenesProduced=0,
        recoveryRef='docs/armax/lot16/RECUPERATION_LOT15.md'))
    lines = ['# Armax — manquants vérifiables après le lot16', '',
        f'**{total} fiches : {with_image} avec image candidate et {total-with_image} sans.** Les trois calques ajoutés ne sont pas trois nouvelles arènes.', '',
        'Les originaux du lot15 ne sont pas récupérés ; leurs présences annoncées ne sont pas comptées. Les26exclusions antérieures restent actives, dont13documentées dans le catalogue lot14 et13rapportées dans le contexte de la session précédente. Aucun nouvel essai sur ces identités.', '',
        '| Identifiant | Sujet | Œuvre / variante | Suite |', '|---|---|---|---|']
    for e in remaining:
        lines.append(f"| `{e['catalogId']}` | {e['name']} | {e['work']} — {e['variant']} | {'Exclusion conservée' if e['generationExcluded'] else 'Originaux / références à retrouver'} |")
    lines += ['', '## Dépendances qui restent ouvertes', '',
        '- Thane loyauté : variante native non établie par les références inspectées.',
        '- Drone de Legion : invocation, propriétaire, évolution, palette et géométrie à relier dans une même preuve.',
        '- Port Hanshan : raccords des calques, contours, échelle et parallaxe à valider dans le moteur ; PH50 était déjà présent.',
        '- Homme Trouble : géométrie du fauteuil, correspondance entre les deux nouveaux rendus, costume et visage à comparer au jeu.',
        '- Révisions annoncées au lot15 : Méridiane, Fortification, Randall et Nyreen attendent leurs originaux.',
        '- Animations, états d’action, collisions, scènes complètes et validation en jeu restent ouverts.', '',
        'Détails : [récupération du lot15](RECUPERATION_LOT15.md), [recherche des références](research/REFERENCE_LOCKS_REVIEW.md), [dépendances structurées](remaining-work.json).']
    text('docs/armax/lot16/MANQUANTS_2026-11-25.md', '\n'.join(lines))
    print(json.dumps({'entries':total,'withImage':with_image,'withoutImage':total-with_image,
                      'newSubjects':len(selected),'newPngs':len(assets),'addedEntries':len(new_ids)},ensure_ascii=False))


if __name__ == '__main__':
    main()
