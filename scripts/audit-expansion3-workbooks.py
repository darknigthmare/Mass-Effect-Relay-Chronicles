#!/usr/bin/env python3
"""Audit variable-size Lot 3 declarations; preserve catalogues and Lots 1 and 2 bytes."""
import argparse
import hashlib
import json
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

GROUPS = {
    'characters': ('Personnages', 'EXPANSION3_CHARACTERS'),
    'armor': ('Equipement', 'EXPANSION3_ARMOR'),
    'weapons': ('Armes', 'EXPANSION3_WEAPONS'),
    'fleet': ('Vehicules_vaisseaux', 'EXPANSION3_FLEET'),
    'enemies': ('Ennemis', 'EXPANSION3_ENEMIES'),
}
sha = lambda raw: hashlib.sha256(raw).hexdigest()


def declarations(root):
    script = """
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const root=process.argv[1], groups=JSON.parse(process.argv[2]), modules={};
for(const [id,[label,exportName]] of Object.entries(groups)) {
 const module=await import(pathToFileURL(path.join(root,`src/expansion3-${id}.js`)).href);
 if(!Array.isArray(module[exportName])) throw Error(`Missing array export ${exportName}`);
 modules[id]=module[exportName];
}
const {getEntryContinuity}=await import(pathToFileURL(path.join(root,'src/continuity-data.js')).href);
const manifest=JSON.parse(await fs.readFile(path.join(root,'docs/universe/manifest.json'),'utf8'));
const continuity={};
for(const input of [{id:'ME1',catalogPath:'docs/content-catalog.json'},...manifest.workbooks]) {
 const book=JSON.parse(await fs.readFile(path.join(root,input.catalogPath),'utf8'));
 for(const record of book.entries) continuity[record.id]=getEntryContinuity(input.id,record);
}
console.log(JSON.stringify({modules,continuity}));
"""
    return json.loads(subprocess.check_output(
        ['node', '--input-type=module', '-e', script, str(root), json.dumps(GROUPS)],
        cwd=root, text=True))


def audit(root, baseline_path):
    baseline = json.loads(baseline_path.read_text())
    failures, warnings, rows, samples, books = [], [], [], [], []
    for rel, digest in baseline['digests'].items():
        if sha((root / rel).read_bytes()) != digest:
            failures.append(f'Protected historical file changed: {rel}')
    manifest = json.loads((root / 'docs/universe/manifest.json').read_text())
    inputs = [{'id': 'ME1', 'catalogPath': 'docs/content-catalog.json'}, *manifest['workbooks']]
    records, source_total = {}, 0
    for item in inputs:
        book = json.loads((root / item['catalogPath']).read_text())
        sources = {s['id']: s for s in book['sources']}
        if len(sources) != len(book['sources']):
            failures.append(f'Duplicate source identifier: {item["id"]}')
        source_total += len(sources)
        for entry in book['entries']:
            if entry['id'] in records:
                failures.append(f'Duplicate catalogue identifier: {entry["id"]}')
            records[entry['id']] = item['id'], item['catalogPath'], entry, sources
        books.append({'id': item['id'], 'path': item['catalogPath'],
                      'records': len(book['entries']), 'sources': len(sources),
                      'statusCounts': dict(Counter(e['status'] for e in book['entries']))})
    loaded = declarations(root)
    identifiers = set()
    prior = set(baseline['priorRecordIds'])
    for group, entries in loaded['modules'].items():
        module_path = f'src/expansion3-{group}.js'
        module_digest = sha((root / module_path).read_bytes())
        group_rows = []
        for overlay in entries:
            rid = overlay.get('recordId')
            if rid not in records:
                failures.append(f'{group}: unknown catalogue record {rid}')
                continue
            if rid in identifiers:
                failures.append(f'Duplicate Lot 3 record: {rid}')
            if rid in prior:
                failures.append(f'Lot 3 repeats a prior study profile: {rid}')
            identifiers.add(rid)
            media, catalog_path, entry, sources = records[rid]
            continuity = loaded['continuity'][rid]
            original_source_ids = list(dict.fromkeys(([entry['sourceId']] if entry.get('sourceId') else []) + entry.get('sourceIds', [])))
            source_ids = list(original_source_ids)
            supporting_records = []
            for support_id in overlay.get('sourceEntryIds', [rid]):
                if support_id == rid:
                    continue
                if support_id not in records or records[support_id][0] != media:
                    failures.append(f'{rid}: unknown or foreign supporting record {support_id}')
                    continue
                _, support_path, support_entry, _ = records[support_id]
                support_continuity = loaded['continuity'][support_id]
                if not support_continuity['fact'] or not any(
                    a['mediaId'] == b['mediaId'] and set(a['periodIds']) & set(b['periodIds'])
                    for a in continuity['availability'] for b in support_continuity['availability']):
                    failures.append(f'{rid}: unsupported evidence or period for {support_id}')
                support_sources = ([support_entry['sourceId']] if support_entry.get('sourceId') else []) + support_entry.get('sourceIds', [])
                source_ids.extend(s for s in support_sources if s not in source_ids)
                supporting_records.append({'recordId': support_id, 'catalogPath': support_path,
                                           'sourceIds': support_sources, 'reference': support_entry.get('reference', '')})
            if 'sourceIds' in overlay and (
                overlay['sourceIds'][:len(original_source_ids)] != original_source_ids
                or len(set(overlay['sourceIds'])) != len(overlay['sourceIds'])
                or any(s not in source_ids for s in overlay['sourceIds'])):
                failures.append(f'{rid}: declared sources omit the original or exceed the explicit supporting records')
            for sid in source_ids:
                if sid not in sources:
                    failures.append(f'{rid}: undeclared original source {sid}')
            reason = overlay.get('blockedReason') or (overlay.get('constraints') or {}).get('blockedReason')
            eligible = (overlay.get('simulation') is not None and not reason
                        and continuity['fact'] and bool(continuity['availability']))
            if (not continuity['fact'] or continuity['lockReason']) and not reason:
                failures.append(f'{rid}: non-factual or unavailable record is not explicitly closed')
            for key, original in [('name', entry['name']), ('identityFact', entry['description']),
                                  ('conditions', entry.get('conditions', ''))]:
                if key in overlay and overlay[key] != original:
                    failures.append(f'{rid}: copied {key} differs from original')
            if overlay.get('mediaId') and overlay['mediaId'] != media:
                failures.append(f'{rid}: mediaId differs from original work')
            if overlay.get('periodId') and not any(overlay['periodId'] in a['periodIds'] for a in continuity['availability']):
                failures.append(f'{rid}: declared period is not supported by the registry')
            if not source_ids:
                warnings.append({'id': rid, 'reason': 'Original record has no declared source identifier.'})
            row = {'group': group, 'sheetName': GROUPS[group][0], 'deliveryId': f'SIM3-{group.upper()}-{rid}',
                   'recordId': rid, 'name': entry['name'], 'catalogId': media, 'catalogPath': catalog_path,
                   'catalogueStatus': entry['status'], 'originalNature': entry.get('nature') or entry.get('canonLevel'),
                   'description': entry['description'], 'conditions': entry.get('conditions', ''),
                   'originalSourceIds': original_source_ids, 'sourceIds': source_ids,
                   'supportingRecords': supporting_records,
                   'sources': [sources[s] for s in source_ids if s in sources],
                   'reference': entry.get('reference', ''), 'continuity': continuity, 'overlay': overlay,
                   'modulePath': module_path, 'moduleSha256': module_digest,
                   'executableDeclaration': bool(eligible), 'blockedReason': reason or continuity['lockReason'] or '',
                   'auditNote': 'Identity and source pointers are documentary; simulation parameters do not certify original mechanics.'}
            rows.append(row)
            group_rows.append(row)
        selected = group_rows[:4]
        for candidate in [next((r for r in group_rows if r['blockedReason']), None), *group_rows[-3:], *group_rows]:
            if candidate and candidate not in selected and len(selected) < min(8, len(group_rows)):
                selected.append(candidate)
        samples.extend(selected)
    for rel, digest in baseline['digests'].items():
        if sha((root / rel).read_bytes()) != digest:
            failures.append(f'Protected historical file changed during audit: {rel}')
    at = datetime.now(timezone.utc).isoformat()
    modules = {g: {'count': len(es), 'sha256': sha((root / f'src/expansion3-{g}.js').read_bytes()),
                   'declaredExecutable': sum(r['executableDeclaration'] for r in rows if r['group'] == g),
                   'closedOrInspection': sum(not r['executableDeclaration'] for r in rows if r['group'] == g)}
               for g, es in loaded['modules'].items()}
    result = {'schemaVersion': 3, 'at': at, 'phase': 'source review, not functional acceptance',
              'baselineCommit': baseline['baselineCommit'], 'baselinePath': str(baseline_path.relative_to(root)),
              'baselineSha256': sha(baseline_path.read_bytes()), 'sourceChecksPassed': not failures,
              'globalFidelityCertified': False, 'cataloguesModified': False, 'historicalExportsModified': False,
              'catalogueCount': len(books), 'catalogueRecordCount': len(records), 'catalogueSourceCount': source_total,
              'overlayCount': len(rows), 'overlayCountIsNotNewFacts': True, 'priorBatchesOverlap': len(identifiers & prior),
              'historicalFileCount': len(baseline['digests']), 'books': books, 'modules': modules,
              'sourceReviewSampleCount': len(samples), 'sampleMethod': 'min(8,n) per family: first four, a closure if present, last three, then deterministic fill. Metadata checked for every row.',
              'samples': samples, 'failures': failures, 'warnings': warnings,
              'sourceReviewMethod': 'Every identity, original status/nature, condition, declared source and availability is compared to the current catalogue. Selected sample rows bind the same metadata and module bytes; no external source URL is certified by this script.',
              'limits': ['Local catalogue declarations and repository reports only; no new source facts or cross-chat access.',
                         'Variable group sizes are intentional; no quota, inferred identity or fabricated equipment fills a shortfall.',
                         'Catalogue source IDs remain inherited pointers. Any separate current primary reading is identified by primaryEvidence and its domain-specific report, not certified by this metadata audit.',
                         'Existence does not certify a combat kit, exact statistics, acquisitions, hull topology, artwork or likeness.',
                         'Historical facts, natures, sources, conditions, statuses and both prior study batches are preserved.',
                         'Prototype delivery requires current positive frozen proofs; closed inspections remain Défini.']}
    data = {'schemaVersion': 3, 'at': at, 'sourceReport': 'docs/qa/expansion3-workbook-source-review.json',
            'baselinePath': result['baselinePath'], 'baselineSha256': result['baselineSha256'],
            'rows': rows, 'historicalDigests': baseline['digests']}
    return result, data


def safe_output(root, path):
    path = path.resolve()
    if not (path.is_relative_to(Path('/tmp')) or
            (path.parent == root / 'docs/qa' and path.name.startswith('expansion3-'))):
        raise ValueError('New Lot 3 reports only; historical paths are read-only.')
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--report', type=Path)
    parser.add_argument('--snapshot', type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    result, data = audit(root, (args.baseline or root / 'docs/qa/expansion3-baseline.json').resolve())
    for path, content in [(args.report, result), (args.snapshot, data)]:
        if path:
            safe_output(root, path).write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['sourceChecksPassed', 'overlayCount', 'sourceReviewSampleCount', 'modules', 'failures']}, ensure_ascii=False))
    return 0 if result['sourceChecksPassed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
