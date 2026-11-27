#!/usr/bin/env python3
"""Verify the delivered lot16 files, inherited identities, workbook and bible links."""
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlsplit

from PIL import Image
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'docs/armax/lot16'
BASE = '71955d9143562d6a44a8b8d48bc552978372bc1e'
IDENTITY = ['category', 'name', 'work', 'dlc', 'variant', 'plannedUse']
ALLOWED_OLD = {'README.md', 'docs/armax/README.md',
    'docs/armax/bible/BIBLE_ARMAX_INTEGREE.md', 'docs/armax/bible/ASSOCIATIONS_CONTENU.md',
    'docs/armax/bible/FICHES_ET_LIAISONS.md', 'docs/armax/bible/SOURCES_ET_DECISIONS.md',
    'docs/armax/bible/guide-associations.json', 'docs/armax/bible/content-associations.json'}
checks, errors = [], []


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def base(path):
    return git('show', BASE + ':' + path)


def read(path):
    return json.loads((ROOT / path).read_text())


def digest(data):
    return hashlib.sha256(data).hexdigest()


def check(name, ok, evidence=None):
    checks.append({'id': name, 'passed': bool(ok), 'evidence': evidence})
    if not ok:
        errors.append(name)


def anchors(data):
    result = set(re.findall(r'<a\s+id=["\']([^"\']+)', data))
    counts = Counter()
    for heading in re.findall(r'^#{1,6}\s+(.+)$', data, re.M):
        heading = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', heading)
        heading = re.sub(r'<[^>]*>', '', heading).strip().lower()
        slug = re.sub(r'[^\w\- ]', '', heading).replace(' ', '-')
        occurrence = counts[slug]
        result.add(slug + ('-' + str(occurrence) if occurrence else ''))
        counts[slug] += 1
    return result


def main():
    cat = read('docs/armax/lot16/production-catalog.json')
    previous = json.loads(base('docs/armax/lot14/production-catalog.json'))
    manifest = read('docs/armax/lot16/manifest.json')
    attempts = read('docs/armax/lot16/attempts.json')['attempts']
    index = read('docs/armax/bible/content-associations.json')
    old_index = json.loads(base('docs/armax/bible/content-associations.json'))
    guide = read('docs/armax/bible/guide-associations.json')
    old_guide = json.loads(base('docs/armax/bible/guide-associations.json'))
    wb = read('docs/armax/lot16/workbook-verification.json')
    entries = {e['id']: e for e in cat['entries']}
    old_entries = {e['id']: e for e in previous['entries']}
    rows = {e['catalogId']: e for e in index['entries']}
    paths = set(git('ls-tree', '-r', '--name-only', BASE).decode().splitlines())
    selected = [a for a in manifest['assets'] if a['selected']]
    current_counts = [len(entries), sum(bool(e['assetFiles']) for e in entries.values()),
                      sum(not e['assetFiles'] for e in entries.values())]
    check('catalogue_unique_counts', len(entries) == len(cat['entries']) and current_counts == [192,132,60], current_counts)
    check('parent_snapshot', cat['parentCatalogSha256'] == digest(base('docs/armax/lot14/production-catalog.json')))
    identity_errors = [identity for identity, e in old_entries.items() if
        identity not in entries or any(entries[identity][k] != e[k] for k in IDENTITY)]
    check('188_inherited_identities_1128_fields', len(old_entries) == 188 and not identity_errors, identity_errors)
    check('same_60_unillustrated_ids', {e['id'] for e in previous['entries'] if not e['assetFiles']} ==
        {e['id'] for e in entries.values() if not e['assetFiles']})
    check('inherited_statuses_preserved', all(
        all(entries[i].get(k) == e.get(k) for k in ['status','fidelity1to1Validated','engineIntegrated','latestGenerationAttempt'])
        for i, e in old_entries.items()))
    check('new_components_and_existing_pose', len(set(entries)-set(old_entries)) == 4 and
        len(entries['chr_me2_illusive_man']['assetFiles']) == 2 and
        cat['currentCounts']['previouslyUnillustratedInheritedSubjectsNowIllustrated'] == 0)
    uses = Counter(e['plannedUse'] for e in entries.values())
    check('52_arenas_3_layers', uses['arene_adaptee'] == 52 and uses['calque_decor'] == 3, dict(uses))
    check('categories_match', cat['counts'] == dict(Counter(e['category'] for e in entries.values())))
    check('native_and_selected_counts', len(manifest['assets']) == 6 and len(selected) == 5 and
        len({a['path'] for a in manifest['assets']}) == 6 and len({a['catalogId'] for a in selected}) == 5)
    check('six_generation_calls_no_refusal', len(attempts) == 6 and all(a['outcome'] == 'generated' for a in attempts))
    excluded = set(cat['policy']['automaticRetryExcludedIds'])
    historic = {e['id'] for e in previous['entries'] if e['latestGenerationAttempt'] == 'blocked'}
    reported = {e['id'] for e in entries.values() if e.get('generationExclusionReportedInPriorSession')}
    check('26_exclusions_with_qualified_evidence', len(historic) == len(reported) == 13 and
        not historic.intersection(reported) and excluded == historic | reported)
    check('no_exclusion_or_claymore_retry', not excluded.intersection(a['catalogId'] for a in attempts) and
        not any('claymore' in a['path'].lower() for a in manifest['assets']))

    asset_records, bad_assets, native_count, prompt_count, ref_count = [], [], 0, 0, 0
    for a in manifest['assets']:
        p, t = ROOT/a['path'], a['technical']
        raw = p.read_bytes()
        with Image.open(p) as im:
            im.load()
            actual = {'width':im.width, 'height':im.height, 'mode':im.mode,
                      'alphaExtrema':list(im.getchannel('A').getextrema())}
        if digest(raw) != t['sha256'] or any(actual[k] != t[k] for k in actual):
            bad_assets.append(a['path'])
        if actual['mode'] != 'RGBA' or actual['alphaExtrema'][0] != 0:
            bad_assets.append(a['path'] + ':alpha')
        native = Path(a['nativeOutputPath'])
        if native.exists():
            native_count += 1
            if digest(native.read_bytes()) != t['sha256']:
                bad_assets.append(a['path'] + ':native')
        prompt = ROOT/a['promptFile']
        if prompt.is_file():
            prompt_count += 1
        else:
            bad_assets.append(a['path'] + ':prompt')
        for reference in a.get('referenceFiles', []):
            local = reference.get('path') or reference.get('localPath')
            if local and Path(local).is_file():
                ref_count += 1
                if reference.get('sha256') and digest(Path(local).read_bytes()) != reference['sha256']:
                    bad_assets.append(a['path'] + ':reference')
        if a['status'] != 'Prototype' or a['fidelity1to1Validated'] or a['engineIntegrated']:
            bad_assets.append(a['path'] + ':status')
        asset_records.append({'path':a['path'], 'sha256':t['sha256'], 'bytes':len(raw),
            'selected':a['selected'], 'catalogId':a['catalogId'], **actual})
    check('native_bytes_geometry_alpha_prompts', not bad_assets and prompt_count == 6, bad_assets)
    check('all_six_native_sources_rehashed', native_count == 6, native_count)
    check('all_candidates_uncertified', all(e['fidelity1to1Validated'] is False and e['engineIntegrated'] is False for e in entries.values()))
    recovered = json.loads(base('docs/armax/recovery-20261120/asset-inventory.json'))
    historical = {a['path'] for a in recovered['assets']} | {
        p for e in previous['entries'] for p in e['assetFiles'] + e['alternateAssetFiles']}
    current = {a['path'] for a in recovered['assets']} | {
        p for e in entries.values() for p in e['assetFiles'] + e['alternateAssetFiles']}
    check('historical_corpus_in_git_tree', len(historical) == 225 and historical <= paths, len(historical))
    check('231_distinct_originals', len(current) == 231 and historical <= current and wb['originalPngCorpusCount'] == 231, len(current))
    check('historical_paths_retained_per_identity', all(set(e['assetFiles']+e['alternateAssetFiles']) <=
        set(entries[i]['assetFiles']+entries[i]['alternateAssetFiles']) for i,e in old_entries.items()))
    modified = set(git('diff','--name-only',BASE).decode().splitlines())
    check('no_unrelated_tracked_changes', not {p for p in modified if p in paths and p not in ALLOWED_OLD},
          sorted(p for p in modified if p in paths and p not in ALLOWED_OLD))
    check('historical_images_unchanged', not modified.intersection(historical))

    index_errors = []
    for old in old_index['entries']:
        row = rows.get(old['catalogId'], {})
        keys = IDENTITY + ['designLinks','existingLotAssociation','stageContext','contextNotes','designBindingState','productionSnapshot']
        if any(row.get(k) != old.get(k) for k in keys):
            index_errors.append(old['catalogId'])
    check('188_bible_associations_preserved', not index_errors, index_errors)
    check('192_current_bible_associations', len(rows) == len(index['entries']) == 192 and set(rows) == set(entries))
    check('current_catalogue_authority', index['authority']['productionSource'] == 'docs/armax/lot16/production-catalog.json' and
        all(r['catalogSource']['path'] == 'docs/armax/lot16/production-catalog.json' for r in rows.values()))
    assoc = read('docs/armax/lot16/bible-asset-associations.json')['associations']
    check('five_selected_assets_bound', {(a['catalogId'],a['path']) for a in assoc} == {(a['catalogId'],a['path']) for a in selected})
    check('component_roles_and_sheets', all(
        a['bibleSheets'] == (['G','J'] if a['role'] == 'calque_decor' else ['B','F','J']) and
        not a['runtimeAttachment'] and not a['fullActionDependencyClosed'] and not a['completeNarrativeSceneProduced'] and
        not a['actionAssociations'] for a in assoc))
    check('same_30_requirements_90_criteria', guide['requirements'] == old_guide['requirements'] and
        len(guide['requirements']) == 30 and sum(len(r['acceptanceCriteria']) for r in guide['requirements']) == 90)
    unchanged = ['docs/armax/bible/common-rules.json','docs/armax/bible/CAMPAGNES_ET_SCENES.md',
                 'docs/armax/lot04/fighters.json','docs/combat-2d/production.json','docs/combat-2d/CONTINUATION_2026-11-19.md']
    check('rules_kits_scenes_and_source_layers_unchanged', all((ROOT/p).read_bytes() == base(p) for p in unchanged))
    check('design_subjects_and_costume_groups_preserved', index['designSubjects'] == old_index['designSubjects'] and
        index['costumeIdentityWorkGroups'] == old_index['costumeIdentityWorkGroups'])
    check('current_source_snapshot_hashes', all(digest((ROOT/s['path']).read_bytes()) == s['sha256']
        for s in index['sourceSnapshots'] if s.get('state') == 'same_delivery_verified_by_sha256'))
    check('source_manifest_hashes', all(digest((ROOT/s['path']).read_bytes()) == s['sha256']
        for s in read('docs/armax/lot16/consolidation-inputs.json')['attemptSources']))

    xlsx = D/'Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx'
    cached = load_workbook(xlsx, data_only=True, read_only=True)
    formulas = load_workbook(xlsx, data_only=False, read_only=True)
    values = [cached['Synthese'][cell].value for cell in ['B13','C13','D13','E13','B17','B18','B19','B23','B24']]
    check('xlsx_totals_and_styles_verified', values == [192,132,60,0,4,5,6,1,4] and
        wb['serialization']['success'] and wb['serialization']['stylesByteIdenticalToNativeTemplate'], values)
    formula_count = sum(1 for ws in formulas for row in ws.iter_rows() for c in row if c.data_type == 'f')
    check('xlsx_formula_caches_and_recalculation', formula_count == wb['serialization']['formulaCachesPreserved'] == 36 and
        wb['recalculationInputCheck']['passed'] and wb['recalculationInputCheck']['before'] == [132,60] and
        wb['recalculationInputCheck']['temporarilyAbsent'] == [131,61] and wb['recalculationInputCheck']['restored'] == [132,60])
    check('xlsx_delivered_hash_and_input_hashes', digest(xlsx.read_bytes()) == wb['xlsxSha256'] and
        all(digest((D/name).read_bytes()) == value for name,value in wb['inputHashes'].items()))
    check('xlsx_visual_review_completed', wb['visualReviewCompleted'] and not wb['nativeExcelOpened'])
    review = read('docs/armax/lot16/qa/catalogue-independent-review.json')
    check('independent_catalogue_review_current', review['result'] == 'pass' and not review.get('findings') and
        all(digest((ROOT/f['path']).read_bytes()) == f['sha256'] for f in review['reviewedFiles']))

    links, broken = [], []
    markdowns = sorted(D.rglob('*.md')) + [ROOT/p for p in sorted(ALLOWED_OLD) if p.endswith('.md')]
    outputs = {'docs/armax/lot16/verification.json','docs/armax/lot16/link-verification.json'}
    for file in markdowns:
        for destination in re.findall(r'\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)', file.read_text()):
            if urlsplit(destination).scheme:
                continue
            path_part, _, fragment = destination.partition('#')
            target = (file.parent/unquote(path_part)).resolve() if path_part else file
            try:
                relative = target.relative_to(ROOT).as_posix()
            except ValueError:
                broken.append({'source':str(file.relative_to(ROOT)), 'target':destination, 'reason':'outside_repository'})
                continue
            exists = target.exists() or relative in paths or relative in outputs or any(p.startswith(relative.rstrip('/')+'/') for p in paths)
            anchor_ok = True
            if exists and fragment and target.suffix == '.md':
                data = target.read_text() if target.exists() else base(relative).decode()
                anchor_ok = unquote(fragment) in anchors(data)
            record = {'source':file.relative_to(ROOT).as_posix(), 'target':destination,
                      'resolvedPath':relative, 'exists':exists, 'anchorValid':anchor_ok}
            links.append(record)
            if not exists or not anchor_ok:
                broken.append(record)
    check('markdown_paths_and_anchors', not broken, broken)
    reader = (ROOT/'docs/armax/bible/ASSOCIATIONS_CONTENU.md').read_text()
    check('all_192_reader_ids', all(identity in anchors(reader) for identity in entries))
    recovery = read('docs/armax/lot16/recovery-status.json')
    check('lot15_not_claimed_recovered', recovery['priorArchive']['recovered'] is False and
        recovery['priorArchive']['published'] is False and not recovery['currentAccounting']['missingLot15BytesCountedAsPresent'])
    report = {'schemaVersion':1, 'date':'2026-11-25', 'timezone':'Europe/Paris', 'baseCommit':BASE,
        'scope':'Native files, inherited identities, workbook and documentary bible associations; no gameplay or native Excel certification.',
        'success':not errors, 'passedChecks':sum(c['passed'] for c in checks), 'totalChecks':len(checks),
        'counts':{'catalogEntries':192,'withImage':132,'withoutImage':60,'nativePngs':6,'selectedPngs':5,
                  'historicalOriginals':225,'totalOriginals':231,'identityFieldsCompared':1128,
                  'nativeOutputsRehashed':native_count,'referenceFilesRehashed':ref_count,
                  'markdownLinksChecked':len(links),'xlsxCellsCompared':wb['serialization']['independentCellsCompared'],
                  'xlsxFormulaCachesCompared':formula_count},
        'assets':asset_records, 'checks':checks, 'errors':errors,
        'limitations':['Lot15 original archive unavailable; its reported images are excluded from presence counts.',
            'Port Hanshan composition remains unvalidated: native widths differ and residual alpha remains.',
            'Chair and seated character are complete separate candidates, not registered compositing layers.',
            'External create-game-assets guide fetch was disabled; local project art guidance applied.',
            'No runtime, animation completion, native Excel application or Windows gameplay validation.']}
    (D/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    (D/'link-verification.json').write_text(json.dumps({'date':'2026-11-25','links':links,'errors':broken,'success':not broken},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'success':not errors,'passed':report['passedChecks'],'total':len(checks),
                      'links':len(links),'errors':errors,'brokenLinks':broken[:12]},ensure_ascii=False))
    raise SystemExit(1 if errors else 0)


if __name__ == '__main__':
    main()
