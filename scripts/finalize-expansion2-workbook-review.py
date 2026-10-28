#!/usr/bin/env python3
"""Bind a human panel-opening record to current Lot 2 workbook/proof/image hashes."""
import argparse
import hashlib
import json
import struct
from datetime import datetime, timezone
from pathlib import Path

sha = lambda raw: hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--review-record', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    load = lambda name: json.loads((root / 'docs/qa' / name).read_text())
    build = load('expansion2-workbook-build-report.json')
    audit = load('expansion2-workbook-report.json')
    render = load('expansion2-workbook-render-report.json')
    data = load('expansion2-workbook-data.json')
    sources = load('expansion2-source-review.json')
    review = json.loads(args.review_record.read_text())
    assert audit['passed'] is True and not audit['draft'] and not build['draft']
    assert sources['sourceChecksPassed'] is True and sources['lot1Overlap'] == 0
    assert review['reviewer'] and review['blockingFindings'] == []
    assert review['scope'] == 'targeted-panels-only'
    assert render['sourceWorkbookUnchanged'] is True
    workbook = root / build['output']
    digest = sha(workbook.read_bytes())
    assert digest == build['xlsxSha256'] == audit['xlsxSha256'] == render['sourceXlsxSha256']
    assert sha((root / build['dataPath']).read_bytes()) == build['dataSha256']
    assert len(data['rows']) == build['overlays'] == audit['rows']
    proofs = []
    for proof in [build['proof'], build['proof']['native']]:
        raw = (root / proof['path']).read_bytes()
        content = json.loads(raw)
        assert sha(raw) == proof['sha256'] and content['passed'] is True
        snapshots = content.get('sources') or content.get('sourceSnapshots') or content.get('sourceHashes') or {}
        if isinstance(snapshots, list):
            snapshots = {s['path']: s['sha256'] for s in snapshots}
        assert all(sha((root / p).read_bytes()) == expected for p, expected in snapshots.items())
        proofs.append({'path': proof['path'], 'sha256': proof['sha256'], 'resultPointer': '/passed'})
    for row in data['rows']:
        assert sha((root / row['modulePath']).read_bytes()) == row['moduleSha256']
    assert all(sha((root / path).read_bytes()) == digest for path, digest in data['historicalDigests'].items())
    opened = {i['path']: i for i in review['images']}
    assert len(opened) == len(review['images']) == len(render['images'])
    assert set(opened) == {i['path'] for i in render['images']}
    images = []
    for image in render['images']:
        raw = (root / image['path']).read_bytes()
        assert raw[:8] == b'\x89PNG\r\n\x1a\n'
        assert sha(raw) == image['sha256'] == opened[image['path']]['sha256']
        assert opened[image['path']]['actuallyOpened'] is True
        width, height = struct.unpack('>II', raw[16:24])
        images.append({**image, 'width': width, 'height': height, 'actuallyOpened': True})
    files = ['scripts/audit-expansion2-workbooks.py', 'scripts/build-expansion2-workbook.py',
             'scripts/verify-expansion2-workbook.py', 'scripts/render-expansion2-workbook.mjs',
             'scripts/finalize-expansion2-workbook-review.py', 'scripts/test-expansion2-workbook-tools.py',
             'docs/qa/expansion2-baseline.json', 'docs/qa/expansion2-source-review.json',
             'docs/qa/expansion2-workbook-data.json', 'docs/qa/expansion2-workbook-build-report.json',
             'docs/qa/expansion2-workbook-report.json', 'docs/qa/expansion2-workbook-render-report.json']
    result = {'schemaVersion': 2, 'at': datetime.now(timezone.utc).isoformat(), 'passed': True,
              'reviewer': review['reviewer'], 'panelsActuallyOpened': len(images), 'images': images,
              'workbook': {'path': build['output'], 'sha256': digest, 'worksheets': len(build['sheets']),
                           'rows': len(data['rows']), 'columns': audit['columns'],
                           'cellsCompared': audit['cellsCompared']},
              'deliveryStatusCounts': audit['deliveryStatusCounts'],
              'sourceCatalogueStatusCounts': audit['sourceCatalogueStatusCounts'],
              'previouslyDefinedWithNewStudy': sum(r['catalogueStatus'] == 'Défini' and r['executableDeclaration'] for r in data['rows']),
              'currentProofs': proofs, 'historicalFilesUnchanged': True,
              'historicalFilesChecked': len(data['historicalDigests']), 'newCanonicalFacts': 0,
              'catalogueStatusPromotions': 0, 'globalFidelityCertified': False,
              'scope': 'Only the recorded targeted panels across the five Lot 2 worksheets were visually inspected. Every delivery value is separately compared with the source-linked snapshot by native XML audit. No full-workbook visual review or original-game 1:1 certification.',
              'observations': review['observations'], 'blockingFindings': [],
              'limits': ['Tail panels can contain both executable and consultation rows; they are not a review of every closure.',
                         'Declared source pointers are inherited. Their presence is not a fresh external or primary verification.',
                         'Partial ATB and logistics studies do not provide original kits, acquisitions, artwork, animations, pilotage or new hulls.',
                         'Historical catalogue status/nature are displayed separately; no original catalogue or Lot 1 file is promoted or regenerated.'],
              'imageEditingApplied': False, 'artifactDigests': {p: sha((root / p).read_bytes()) for p in files},
              'reviewRecord': {'path': str(args.review_record), 'sha256': sha(args.review_record.read_bytes())}}
    output = (args.output or root / 'docs/qa/expansion2-workbook-visual-report.json').resolve()
    assert output.parent == root / 'docs/qa' and output.name.startswith('expansion2-')
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'passed': True, 'panelsActuallyOpened': len(images), 'xlsxSha256': digest,
                      'report': str(output.relative_to(root)), 'reportSha256': sha(output.read_bytes())}))


if __name__ == '__main__':
    main()
