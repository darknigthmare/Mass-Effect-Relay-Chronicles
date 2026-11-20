#!/usr/bin/env python3
"""Check lot10 files, catalogue continuity and provenance; no fidelity certification."""
import argparse
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', help='Write a JSON report relative to the repository')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    folder = root / 'docs/armax/lot10'
    read = lambda path: json.loads((root / path).read_text())
    catalogue = read('docs/armax/lot10/production-catalog.json')
    previous = read('docs/armax/lot09/production-catalog.json')
    recovery = read('docs/armax/recovery-20261120/asset-inventory.json')
    base_commit = '9321b4f77d8f857d8c40265c0fca70e03121a4ea'
    previous_files = (read('docs/armax/lot06/verification.json')['assets']
                      + read('docs/armax/lot07/verification.json')['assets']
                      + read('docs/armax/lot08/verification.json')['assets']
                      + read('docs/armax/lot09/verification.json')['assets'])
    errors, warnings, inventory = [], [], []
    entries = catalogue['entries']
    index = {entry['id']: entry for entry in entries}
    if catalogue.get('baseCommit') != base_commit:
        errors.append('Catalogue base commit differs from the frozen lot10 base')
    if catalogue.get('parentCatalogSha256') != hashlib.sha256((root/'docs/armax/lot09/production-catalog.json').read_bytes()).hexdigest():
        errors.append('Parent catalogue hash mismatch')
    if len(index) != len(entries):
        errors.append('Duplicate catalogue IDs')
    for old in previous['entries']:
        current = index.get(old['id'])
        if current is None:
            errors.append(f"Inherited catalogue entry missing: {old['id']}")
            continue
        for field in ('category', 'name', 'work', 'dlc', 'variant'):
            if current.get(field) != old.get(field):
                errors.append(f"Inherited identity changed: {old['id']} / {field}")
        for asset_field in ('assetFiles', 'alternateAssetFiles'):
            for path in old.get(asset_field, []):
                if path not in current.get(asset_field, []):
                    errors.append(f"Inherited asset link removed: {old['id']} / {path}")
    for entry in entries:
        for source_id in entry.get('sourceIds', []):
            if source_id not in catalogue['sources']:
                errors.append(f"Unknown source ID: {entry['id']} / {source_id}")
            elif catalogue['sources'][source_id]['url'] not in entry.get('sourceUrls', []):
                errors.append(f"Registered source URL missing from entry: {entry['id']} / {source_id}")

    library = read('docs/armax/lot10/reference-library.json')
    reference_ids = set()
    references_locally_checked = 0
    for source_part in library.get('sourceParts', []):
        path = root / source_part['path']
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != source_part['sha256']:
            errors.append(f"Reference source part changed after consolidation: {source_part['path']}")
    for reference in library['references']:
        if reference['id'] in reference_ids:
            errors.append(f"Duplicate reference ID: {reference['id']}")
        reference_ids.add(reference['id'])
        if reference.get('includedInRepository') is not False:
            errors.append(f"Third-party reference marked for repository inclusion: {reference['id']}")
        if not reference.get('inspectedOn') or not reference.get('reviewNotes'):
            errors.append(f"Reference inspection record incomplete: {reference['id']}")
        for subject_id in reference.get('catalogIds', []):
            if subject_id not in index:
                errors.append(f"Reference has unknown subject: {reference['id']} / {subject_id}")
        for source_id in reference.get('sourceIds', []):
            if source_id not in catalogue['sources']:
                errors.append(f"Reference has unknown source: {reference['id']} / {source_id}")
        local_path = Path(reference['localResearchPath'])
        if not local_path.is_absolute():
            local_path = root.parent / local_path
        if local_path.is_file():
            references_locally_checked += 1
            if hashlib.sha256(local_path.read_bytes()).hexdigest() != reference['sha256']:
                errors.append(f"Research reference SHA256 mismatch: {reference['id']}")
            with Image.open(local_path) as reference_image:
                if reference_image.size != (reference['width'], reference['height']):
                    errors.append(f"Research reference dimensions mismatch: {reference['id']}")
        elif not re.fullmatch(r'[0-9a-f]{64}', reference.get('sha256', '')):
            errors.append(f"Invalid recorded reference SHA256: {reference['id']}")

    selected = []
    for name in ('costumes-manifest.json', 'fighters-manifest.json', 'stages-manifest.json'):
        selected.extend(read(f'docs/armax/lot10/{name}').get('assets', []))
    selected_ids = [asset['id'] for asset in selected]
    if len(selected_ids) != len(set(selected_ids)):
        errors.append('Duplicate selected subject IDs')
    records = [(asset, 'selected', asset['id']) for asset in selected]
    for asset in selected:
        records.extend((variant, 'review', asset['id']) for variant in asset.get('alternateFiles', []))
        entry = index.get(asset['id'])
        if entry is None or asset['path'] not in entry.get('assetFiles', []):
            errors.append(f"Selected asset not linked to its catalogue entry: {asset['id']}")
        if entry is not None:
            for field in ('category', 'name', 'work', 'dlc', 'variant'):
                if asset.get(field) != entry.get(field):
                    errors.append(f"Manifest identity differs from catalogue: {asset['id']} / {field}")
        if asset.get('status') != 'Prototype':
            errors.append(f"Unexpected selected asset status: {asset['id']}")
        if any(asset.get(key) for key in ('fidelityValidated', 'fidelity1to1Validated', 'engineIntegrated')):
            errors.append(f"Unsupported validation claim: {asset['id']}")

    hashes, tracked = [], set()
    source_outputs_compared = 0
    for asset, role, subject_id in records:
        relative = asset['path']
        path = root / relative
        tracked.add(relative)
        if not relative.startswith('public/assets/armax/lot10/'):
            errors.append(f'Unexpected new asset location: {relative}')
        if not path.is_file():
            errors.append(f'Missing new PNG: {relative}')
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        hashes.append(digest)
        tech = asset.get('technical', {})
        if digest != tech.get('sha256'):
            errors.append(f'SHA256 mismatch: {relative}')
        source = asset.get('generation', {}).get('originalOutput') or asset.get('sourceOriginal')
        if source and Path(source).is_file():
            source_outputs_compared += 1
            if hashlib.sha256(Path(source).read_bytes()).hexdigest() != digest:
                errors.append(f'Original generator output changed: {relative}')
        try:
            with Image.open(path) as image:
                image.load()
                if image.format != 'PNG':
                    errors.append(f'Invalid PNG format: {relative}')
                if image.size != (tech.get('width'), tech.get('height')):
                    errors.append(f'Dimension mismatch: {relative}')
                if image.mode != tech.get('mode'):
                    errors.append(f'Image mode mismatch: {relative}')
                alpha = None
                if image.mode == 'RGBA':
                    channel = image.getchannel('A')
                    alpha = list(channel.getextrema())
                    if alpha[0] != 0 or alpha[1] < 128:
                        errors.append(f'No usable transparent silhouette: {relative}')
                    box = channel.point(lambda value: 255 if value >= 128 else 0).getbbox()
                    if box and min(box[0], box[1], image.width-box[2], image.height-box[3]) < 16:
                        warnings.append(f'Tight silhouette margin; normalize before integration: {relative}')
                elif '/stages/' not in relative:
                    errors.append(f'Character/costume lacks alpha: {relative}')
                inventory.append({'id': subject_id, 'role': role, 'path': relative,
                                  'sha256': digest, 'width': image.width, 'height': image.height,
                                  'mode': image.mode, 'alphaExtrema': alpha})
        except (OSError, ValueError) as exc:
            errors.append(f'PNG decoding failed: {relative}: {exc}')
    if len(hashes) != len(set(hashes)):
        errors.append('Duplicate new image bytes')
    historical_hashes = {asset['technical']['sha256'] for asset in recovery['assets']}
    historical_hashes.update(asset['sha256'] for asset in previous_files)
    if historical_hashes.intersection(hashes):
        errors.append('Historical image counted as new')
    observed = {str(path.relative_to(root)) for path in (root/'public/assets/armax/lot10').rglob('*.png')}
    if observed != tracked:
        errors.append(f'PNG inventory mismatch: untracked={sorted(observed-tracked)}, absent={sorted(tracked-observed)}')

    # A sparse checkout may omit old PNG bytes. Read their tracked paths from Git,
    # while requiring every new lot10 PNG to exist and decode locally above.
    git = subprocess.run(['git', 'ls-tree', '-rz', '--name-only', '9321b4f77d8f857d8c40265c0fca70e03121a4ea'], cwd=root,
                         check=False, capture_output=True)
    git_paths = set(git.stdout.decode().strip('\0').split('\0')) if git.returncode == 0 else set()
    git_only_paths = set()
    for entry in entries:
        if entry.get('fidelity1to1Validated') or entry.get('engineIntegrated'):
            errors.append(f"Unsupported catalogue validation claim: {entry['id']}")
        for relative in entry.get('assetFiles', []):
            if (root/relative).is_file():
                continue
            if relative in git_paths and not relative.startswith('public/assets/armax/lot10/'):
                git_only_paths.add(relative)
            else:
                errors.append(f'Catalogue file absent locally and in Git: {relative}')
    for path in folder.glob('prompts/*.json'):
        prompt = json.loads(path.read_text())
        if not (prompt.get('request', prompt).get('prompt')) or not prompt.get('id'):
            errors.append(f'Incomplete prompt record: {path.name}')

    attempts = []
    for name in ('generation-attempts.json', 'stages-attempts.json'):
        journal = read(f'docs/armax/lot10/{name}')
        attempts.extend(journal.get('attempts', journal.get('results', [])))
    successful_attempts = [attempt for attempt in attempts if attempt.get('status') == 'generated']
    blocked_attempts = [attempt for attempt in attempts if attempt.get('status') == 'blocked']
    technical_errors = [attempt for attempt in attempts if attempt.get('status') == 'error'
                        and attempt.get('errorType') == 'reference_transport_error'
                        and attempt.get('contentRefusal') is False]
    if len(successful_attempts) != len(records):
        errors.append('Successful attempt / original PNG count mismatch')
    for attempt in attempts:
        output = attempt.get('file') or attempt.get('path')
        if attempt.get('status') in ('blocked', 'error', 'failed') and output:
            errors.append(f"Unsuccessful attempt incorrectly has a file: {attempt['id']}")
        if attempt.get('status') == 'generated' and output not in tracked:
            errors.append(f"Generated output not in the PNG manifest: {attempt['id']}")
        if attempt.get('status') not in ('generated', 'blocked', 'failed') and attempt not in technical_errors:
            errors.append(f"Unexpected generation attempt status: {attempt.get('status')}")
    blocked_ids = {attempt['id'] for attempt in blocked_attempts}
    inherited_blocked_ids = set(previous['policy']['automaticRetryExcludedIds'])
    if not inherited_blocked_ids.issubset(catalogue['policy']['automaticRetryExcludedIds']):
        errors.append('Inherited automatic retry exclusions were removed')
    for attempt in attempts:
        attempt_subject_id = re.sub(r'_r\d+$', '', attempt.get('catalogId') or attempt['id'])
        if attempt_subject_id in inherited_blocked_ids:
            errors.append(f"Previously blocked subject was retried: {attempt['id']}")
    for blocked_id in blocked_ids:
        history = [attempt for attempt in attempts if attempt['id'] == blocked_id]
        first_block = next(i for i, attempt in enumerate(history) if attempt['status'] == 'blocked')
        if first_block != len(history) - 1:
            errors.append(f"Subject retried after a blocked response: {blocked_id}")
        if index.get(blocked_id, {}).get('latestGenerationAttempt') != 'blocked':
            errors.append(f"Blocked response missing from catalogue: {blocked_id}")
        if blocked_id not in catalogue['policy']['automaticRetryExcludedIds']:
            errors.append(f"Blocked subject missing from automatic retry exclusion: {blocked_id}")
    if set(index) != {entry['id'] for entry in previous['entries']}:
        errors.append('Lot10 must preserve the existing 164-entry catalogue without expanding it')
    previous_with = sum(bool(entry.get('assetFiles')) for entry in previous['entries'])
    count_with = sum(bool(entry.get('assetFiles')) for entry in entries)
    if count_with - previous_with != len(selected):
        errors.append('Newly illustrated catalogue entries do not match selected subjects')
    expected_current_counts = {
        'total': len(entries), 'withImage': count_with,
        'withoutImage': len(entries)-count_with, 'certified1to1': 0,
        'newIllustratedSubjects': len(selected), 'newPngFiles': len(records),
        'blockedSubjects': sum(entry.get('latestGenerationAttempt') == 'blocked' for entry in entries),
    }
    if catalogue.get('currentCounts') != expected_current_counts:
        errors.append('Catalogue counters do not match observed entries and PNGs')

    # Read-only ZIP/XML checks compare the final exported cells with the source
    # catalogue. Spreadsheet authoring and recalculation remain in artifact-tool.
    workbook_report = read('docs/armax/lot10/workbook-verification.json')
    xlsx_path = folder / 'Mass_Effect_Armax_Suivi_Lot10_2026-11-20.xlsx'
    workbook_cells_checked = 0
    if workbook_report.get('baseCommit') != base_commit:
        errors.append('Workbook base commit differs from the frozen lot10 base')
    if not workbook_report.get('visualReviewCompleted'):
        errors.append('Workbook visual review is not complete')
    if not workbook_report.get('recalculated') or not workbook_report.get('recalculationInputCheck', {}).get('passed'):
        errors.append('Workbook recalculation or restored-input check missing')
    if hashlib.sha256(xlsx_path.read_bytes()).hexdigest() != workbook_report.get('xlsxSha256'):
        errors.append('Workbook export SHA256 mismatch')
    for filename, expected_hash in workbook_report.get('inputHashes', {}).items():
        if hashlib.sha256((folder/filename).read_bytes()).hexdigest() != expected_hash:
            errors.append(f'Workbook input changed after export: {filename}')
    ns = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(xlsx_path) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared = [''.join(node.itertext()) for node in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        def cells(name):
            result = {}
            for cell in ET.fromstring(archive.read(name)).findall('.//x:c', ns):
                kind = cell.get('t')
                value = cell.find('x:v', ns)
                if kind == 'inlineStr':
                    text = ''.join(cell.find('x:is', ns).itertext())
                elif kind == 's':
                    text = shared[int(value.text)] if value is not None else ''
                else:
                    text = value.text if value is not None and value.text is not None else ''
                if kind == 'e':
                    errors.append(f"Formula error in exported workbook: {name} / {cell.get('r')} / {text}")
                result[cell.get('r')] = text
            return result
        book = ET.fromstring(archive.read('xl/workbook.xml'))
        sheet_names = [sheet.get('name') for sheet in book.findall('x:sheets/x:sheet', ns)]
        if sheet_names != ['Synthese', 'Catalogue', 'Recuperes']:
            errors.append('Workbook sheet names or order changed')
        summary_cells = cells('xl/worksheets/sheet1.xml')
        catalog_cells = cells('xl/worksheets/sheet2.xml')
        cells('xl/worksheets/sheet3.xml')
        category_names = {'personnage': 'Personnages / ennemis', 'costume': 'Costumes', 'stage': 'Stages'}
        for row, entry in enumerate(entries, start=6):
            expected = {
                'A': entry['name'], 'B': category_names[entry['category']],
                'C': entry['work'], 'D': entry['variant'], 'E': entry.get('dlc') or '',
                'F': entry['priority'], 'G': entry['status'],
                'H': 'Présent' if entry['assetFiles'] else 'Absent',
                'J': 'Non', 'L': entry['id'], 'N': '\n'.join(entry['sourceUrls']),
                'O': '\n'.join(entry['assetFiles']), 'P': entry['addedInLot'],
                'Q': entry['imageLot'], 'R': str(entry['pngCountLot10']),
                'S': '\n'.join(entry['alternateAssetFiles']),
            }
            for column, value in expected.items():
                workbook_cells_checked += 1
                if catalog_cells.get(f'{column}{row}', '') != value:
                    errors.append(f"Workbook/catalogue cell mismatch: {entry['id']} / {column}{row}")
            exported_note = catalog_cells.get(f'M{row}', '')
            for note in [entry.get('productionNote'), *entry.get('generationNotes', []), entry.get('referenceGap')]:
                if note and note not in exported_note:
                    errors.append(f"Production caveat missing from workbook: {entry['id']}")
        for address, expected in {'B10': len(entries), 'C10': count_with, 'D10': len(entries)-count_with,
                                  'E10': 0, 'B14': 0, 'B15': len(selected), 'B16': len(records),
                                  'B17': len(recovery['assets']), 'B18': previous_with}.items():
            workbook_cells_checked += 1
            if summary_cells.get(address) != str(expected):
                errors.append(f'Workbook summary cache mismatch: {address}')
    counts = {'catalogueEntries': len(entries), 'inheritedEntries': len(previous['entries']),
              'addedEntries': len(entries)-len(previous['entries']),
              'categories': dict(Counter(entry['category'] for entry in entries)),
              'entriesWithImage': count_with, 'entriesWithoutImage': len(entries)-count_with,
              'newIllustratedSubjects': len(selected),
              'generationCalls': len(attempts), 'blockedGenerationCalls': len(blocked_attempts),
              'technicalErrorCalls': len(technical_errors), 'newSelectedPngs': len(selected),
              'newReviewPngs': len(records)-len(selected), 'newOriginalPngs': len(records),
              'previousOriginalPngs': len(recovery['assets'])+len(previous_files),
              'totalOriginalPngs': len(recovery['assets'])+len(previous_files)+len(records),
              'generatorSourceOutputsCompared': source_outputs_compared,
              'historicalCatalogueFilesCheckedThroughGit': len(git_only_paths)}
    counts.update({'referenceRecords': len(library['references']),
                   'researchReferencesLocallyRehashed': references_locally_checked,
                   'workbookCellsComparedWithCatalogue': workbook_cells_checked})
    report = {'date': '2026-11-20', 'baseCommit': '9321b4f77d8f857d8c40265c0fca70e03121a4ea',
              'scope': 'New lot10 bytes and catalogue continuity; historical files may be checked by Git path only',
              'identityContinuity': {'subjects': len(previous['entries']), 'fieldsPerSubject': 5,
                                     'checkedFields': len(previous['entries']) * 5},
              'counts': counts, 'assets': inventory, 'gitOnlyHistoricalPaths': sorted(git_only_paths),
              'errors': errors, 'warnings': warnings, 'success': not errors,
              'limitations': ['No certification of artistic fidelity 1:1',
                              'No animation, parallax or gameplay validation',
                              'Historical PNGs omitted by sparse checkout are not decoded again',
                              'Spreadsheet recalculation and visual review are recorded separately']}
    if args.report:
        destination = root/args.report
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({key: value for key, value in report.items() if key != 'assets'}, ensure_ascii=False))
    raise SystemExit(0 if report['success'] else 1)


if __name__ == '__main__':
    main()
