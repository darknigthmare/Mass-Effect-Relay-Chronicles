#!/usr/bin/env python3
"""Verify the Armax lot06 inventory and actual PNG files; not artistic fidelity."""
import argparse
import hashlib
import json
import struct
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', help='Optional report path relative to the repository')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    folder = root / 'docs/armax/lot06'
    catalog = json.loads((folder / 'production-catalog.json').read_text())
    recovered = json.loads((root / 'docs/armax/recovery-20261120/asset-inventory.json').read_text())
    records, errors, inventory = [], [], []
    for name in ('stages-manifest.json', 'costumes-manifest.json', 'fighters-extra-manifest.json'):
        file = folder / name
        if file.exists():
            manifest = json.loads(file.read_text())
            records.extend(manifest.get('assets', []))
    ids = [entry['id'] for entry in catalog['entries']]
    if len(ids) != len(set(ids)):
        errors.append('Duplicate IDs in production catalogue')
    new_ids = [entry['id'] for entry in records if entry.get('path')]
    if len(new_ids) != len(set(new_ids)):
        errors.append('Duplicate asset IDs in new generation manifests')
    hashes = []
    for entry in records:
        if not entry.get('path'):
            continue
        path = root / entry['path']
        if not path.is_file():
            errors.append(f"Missing PNG: {entry['path']}")
            continue
        raw = path.read_bytes()
        if raw[:8] != b'\x89PNG\r\n\x1a\n':
            errors.append(f"Invalid PNG signature: {entry['path']}")
            continue
        width, height = struct.unpack('>II', raw[16:24])
        digest = hashlib.sha256(raw).hexdigest()
        hashes.append(digest)
        tech = entry.get('technical', {})
        if tech.get('sha256') != digest:
            errors.append(f"SHA256 mismatch: {entry['path']}")
        if (tech.get('width'), tech.get('height')) != (width, height):
            errors.append(f"Dimensions mismatch: {entry['path']}")
        if entry.get('fidelityValidated') or entry.get('fidelity1to1Validated') or entry.get('engineIntegrated'):
            errors.append(f"Unexpected validation/integration claim: {entry['id']}")
        matching = [x for x in catalog['entries'] if x['id'] == entry['id']]
        if len(matching) != 1:
            errors.append(f"Asset ID not uniquely linked to catalogue: {entry['id']}")
        elif entry['path'] not in matching[0].get('assetFiles', []):
            errors.append(f"Catalogue does not link actual asset: {entry['id']}")
        inventory.append({'id': entry['id'], 'path': entry['path'], 'sha256': digest, 'width': width, 'height': height})
    if len(hashes) != len(set(hashes)):
        errors.append('Duplicate new PNG bytes')
    for entry in catalog['entries']:
        for name in entry.get('assetFiles', []):
            if not (root / name).is_file():
                errors.append(f"Catalogue references a missing file: {name}")
        if entry.get('fidelity1to1Validated') or entry.get('engineIntegrated'):
            errors.append(f"Unexpected catalogue validation claim: {entry['id']}")
    recovered_hashes = {x['technical']['sha256'] for x in recovered['assets']}
    if recovered_hashes.intersection(hashes):
        errors.append('A recovered file is incorrectly counted as newly generated')
    categories = {}
    for entry in catalog['entries']:
        key = entry['category']
        categories[key] = categories.get(key, 0) + 1
    report = {
        'date': '2026-11-20',
        'scope': 'Lot06 actual files, catalogue IDs, file links, dimensions and SHA256 only',
        'catalogEntries': len(ids),
        'catalogCategories': categories,
        'catalogEntriesWithImage': sum(bool(x.get('assetFiles')) for x in catalog['entries']),
        'catalogEntriesWithoutImage': sum(not x.get('assetFiles') for x in catalog['entries']),
        'recoveredOriginalPngs': len(recovered['assets']),
        'newOriginalPngs': len(inventory),
        'totalOriginalPngs': len(recovered['assets']) + len(inventory),
        'assets': inventory,
        'errors': errors,
        'success': not errors,
        'limitations': ['Does not certify artistic fidelity 1:1', 'Does not validate animation or gameplay', 'Spreadsheet formula/visual checks are recorded separately'],
    }
    if args.report:
        destination = root / args.report
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key != 'assets'}, ensure_ascii=False))
    raise SystemExit(0 if not errors else 1)


if __name__ == '__main__':
    main()
