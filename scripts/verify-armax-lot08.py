#!/usr/bin/env python3
"""Check lot08 files, catalogue continuity and provenance; no fidelity certification."""
import argparse
import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', help='Write a JSON report relative to the repository')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    folder = root / 'docs/armax/lot08'
    read = lambda path: json.loads((root / path).read_text())
    catalogue = read('docs/armax/lot08/production-catalog.json')
    previous = read('docs/armax/lot07/production-catalog.json')
    recovery = read('docs/armax/recovery-20261120/asset-inventory.json')
    previous_files = (read('docs/armax/lot06/verification.json')['assets']
                      + read('docs/armax/lot07/verification.json')['assets'])
    errors, warnings, inventory = [], [], []
    entries = catalogue['entries']
    index = {entry['id']: entry for entry in entries}
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
        for path in old.get('assetFiles', []):
            if path not in current.get('assetFiles', []):
                errors.append(f"Inherited asset link removed: {old['id']} / {path}")

    selected = []
    for name in ('costumes-manifest.json', 'fighters-manifest.json', 'stages-manifest.json'):
        selected.extend(read(f'docs/armax/lot08/{name}').get('assets', []))
    selected_ids = [asset['id'] for asset in selected]
    if len(selected_ids) != len(set(selected_ids)):
        errors.append('Duplicate selected subject IDs')
    records = [(asset, 'selected', asset['id']) for asset in selected]
    for asset in selected:
        records.extend((variant, 'review', asset['id']) for variant in asset.get('alternateFiles', []))
        entry = index.get(asset['id'])
        if entry is None or asset['path'] not in entry.get('assetFiles', []):
            errors.append(f"Selected asset not linked to its catalogue entry: {asset['id']}")
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
        if not relative.startswith('public/assets/armax/lot08/'):
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
    observed = {str(path.relative_to(root)) for path in (root/'public/assets/armax/lot08').rglob('*.png')}
    if observed != tracked:
        errors.append(f'PNG inventory mismatch: untracked={sorted(observed-tracked)}, absent={sorted(tracked-observed)}')

    # A sparse checkout may omit old PNG bytes. Read their tracked paths from Git,
    # while requiring every new lot08 PNG to exist and decode locally above.
    git = subprocess.run(['git', 'ls-tree', '-rz', '--name-only', 'HEAD'], cwd=root,
                         check=False, capture_output=True)
    git_paths = set(git.stdout.decode().strip('\0').split('\0')) if git.returncode == 0 else set()
    git_only_paths = set()
    for entry in entries:
        if entry.get('fidelity1to1Validated') or entry.get('engineIntegrated'):
            errors.append(f"Unsupported catalogue validation claim: {entry['id']}")
        for relative in entry.get('assetFiles', []):
            if (root/relative).is_file():
                continue
            if relative in git_paths and not relative.startswith('public/assets/armax/lot08/'):
                git_only_paths.add(relative)
            else:
                errors.append(f'Catalogue file absent locally and in Git: {relative}')
    for path in folder.glob('prompts/*.json'):
        prompt = json.loads(path.read_text())
        if not (prompt.get('request', prompt).get('prompt')) or not prompt.get('id'):
            errors.append(f'Incomplete prompt record: {path.name}')

    attempts = []
    for name in ('generation-attempts.json', 'stages-attempts.json'):
        journal = read(f'docs/armax/lot08/{name}')
        attempts.extend(journal.get('attempts', journal.get('results', [])))
    successful_attempts = [attempt for attempt in attempts if attempt.get('status') == 'generated']
    blocked_attempts = [attempt for attempt in attempts if attempt.get('status') == 'blocked']
    if len(successful_attempts) != len(records):
        errors.append('Successful attempt / original PNG count mismatch')
    for attempt in attempts:
        output = attempt.get('file') or attempt.get('path')
        if attempt.get('status') == 'blocked' and output:
            errors.append(f"Blocked attempt incorrectly has a file: {attempt['id']}")
        if attempt.get('status') == 'generated' and output not in tracked:
            errors.append(f"Generated output not in the PNG manifest: {attempt['id']}")
        if attempt.get('status') not in ('generated', 'blocked', 'failed'):
            errors.append(f"Unexpected generation attempt status: {attempt.get('status')}")
    if set(index) != {entry['id'] for entry in previous['entries']}:
        errors.append('Lot08 must preserve the existing 164-entry catalogue without expanding it')
    previous_with = sum(bool(entry.get('assetFiles')) for entry in previous['entries'])
    count_with = sum(bool(entry.get('assetFiles')) for entry in entries)
    if count_with - previous_with != len(selected):
        errors.append('Newly illustrated catalogue entries do not match selected subjects')
    counts = {'catalogueEntries': len(entries), 'inheritedEntries': len(previous['entries']),
              'addedEntries': len(entries)-len(previous['entries']),
              'categories': dict(Counter(entry['category'] for entry in entries)),
              'entriesWithImage': count_with, 'entriesWithoutImage': len(entries)-count_with,
              'newIllustratedSubjects': len(selected),
              'generationCalls': len(attempts), 'blockedGenerationCalls': len(blocked_attempts), 'newSelectedPngs': len(selected),
              'newReviewPngs': len(records)-len(selected), 'newOriginalPngs': len(records),
              'previousOriginalPngs': len(recovery['assets'])+len(previous_files),
              'totalOriginalPngs': len(recovery['assets'])+len(previous_files)+len(records),
              'generatorSourceOutputsCompared': source_outputs_compared,
              'historicalCatalogueFilesCheckedThroughGit': len(git_only_paths)}
    report = {'date': '2026-11-20', 'baseCommit': 'c8bbc3321feb08c85d799211d27b217c94357bed',
              'scope': 'New lot08 bytes and catalogue continuity; historical files may be checked by Git path only',
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
