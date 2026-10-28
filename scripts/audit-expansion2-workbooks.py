#!/usr/bin/env python3
"""Audit variable-size Lot 2 declarations; preserve catalogues and Lot 1 bytes."""
import argparse
import hashlib
import json
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

GROUPS = {
    'characters': ('Personnages', 'EXPANSION2_CHARACTERS'),
    'armor': ('Equipement', 'EXPANSION2_ARMOR'),
    'weapons': ('Armes', 'EXPANSION2_WEAPONS'),
    'fleet': ('Vehicules_vaisseaux', 'EXPANSION2_FLEET'),
    'enemies': ('Ennemis', 'EXPANSION2_ENEMIES'),
}
sha = lambda raw: hashlib.sha256(raw).hexdigest()


def declarations(root):
    script = """
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const root=process.argv[1], groups=JSON.parse(process.argv[2]), modules={};
for(const [id,[label,exportName]] of Object.entries(groups)) {
 const module=await import(pathToFileURL(path.join(root,`src/expansion2-${id}.js`)).href);
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
        module_path = f'src/expansion2-{group}.js'
        module_digest = sha((root / module_path).read_bytes())
        group_rows = []
        for overlay in entries:
            rid = overlay.get('recordId')
            if rid not in records:
                failures.append(f'{group}: unknown catalogue record {rid}')
                continue
            if rid in identifiers:
                failures.append(f'Duplicate Lot 2 record: {rid}')
            if rid in prior:
                failures.append(f'Lot 2 repeats a Lot 1 profile: {rid}')
            identifiers.add(rid)
            media, catalog_path, entry, sources = records[rid]
            continuity = loaded['continuity'][rid]
            source_ids = list(dict.fromkeys(([entry['sourceId']] if entry.get('sourceId') else []) + entry.get('sourceIds', [])))
            for sid in source_ids:
                if sid not in sources:
                    failures.append(f'{rid}: undeclared original source {sid}')
            reason = overlay.get('blockedReason') or (overlay.get('constraints') or {}).get('blockedReason')
            eligible = (overlay.get('simulation') is not None and not reason
                        and continuity['fact'] and bool(continuity['availability']))
            if (not continuity['fact'] or continuity['lockReason']) and not reason:
                failures.append(f'{rid}: non-factual or unavailable record is not explicitly closed')
            for key, original in [('name', entry['name']), ('identityFact', entry['description']),
                                  ('conditions', entry.get('conditions', '')), ('sourceIds', source_ids)]:
                if key in overlay and overlay[key] != original:
                    failures.append(f'{rid}: copied {key} differs from original')
            if overlay.get('mediaId') and overlay['mediaId'] != media:
                failures.append(f'{rid}: mediaId differs from original work')
            if overlay.get('periodId') and not any(overlay['periodId'] in a['periodIds'] for a in continuity['availability']):
                failures.append(f'{rid}: declared period is not supported by the registry')
            if not source_ids:
                warnings.append({'id': rid, 'reason': 'Original record has no declared source identifier.'})
            row = {'group': group, 'sheetName': GROUPS[group][0], 'deliveryId': f'SIM2-{group.upper()}-{rid}',
                   'recordId': rid, 'name': entry['name'], 'catalogId': media, 'catalogPath': catalog_path,
                   'catalogueStatus': entry['status'], 'originalNature': entry.get('nature') or entry.get('canonLevel'),
                   'description': entry['description'], 'conditions': entry.get('conditions', ''),
                   'sourceIds': source_ids, 'sources': [sources[s] for s in source_ids if s in sources],
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
    modules = {g: {'count': len(es), 'sha256': sha((root / f'src/expansion2-{g}.js').read_bytes()),
                   'declaredExecutable': sum(r['executableDeclaration'] for r in rows if r['group'] == g),
                   'closedOrInspection': sum(not r['executableDeclaration'] for r in rows if r['group'] == g)}
               for g, es in loaded['modules'].items()}
    result = {'schemaVersion': 2, 'at': at, 'phase': 'source review, not functional acceptance',
              'baselineCommit': baseline['baselineCommit'], 'baselinePath': str(baseline_path.relative_to(root)),
              'baselineSha256': sha(baseline_path.read_bytes()), 'sourceChecksPassed': not failures,
              'globalFidelityCertified': False, 'cataloguesModified': False, 'historicalExportsModified': False,
              'catalogueCount': len(books), 'catalogueRecordCount': len(records), 'catalogueSourceCount': source_total,
              'overlayCount': len(rows), 'overlayCountIsNotNewFacts': True, 'lot1Overlap': len(identifiers & prior),
              'historicalFileCount': len(baseline['digests']), 'books': books, 'modules': modules,
              'sourceReviewSampleCount': len(samples), 'sampleMethod': 'min(8,n) per family: first four, a closure if present, last three, then deterministic fill. Metadata checked for every row.',
              'samples': samples, 'failures': failures, 'warnings': warnings,
              'manualSourceFindings': [
                  'Characters: seven MEA entries are APEX-only multiplayer archetypes, not seven named people or Tempest recruits. Jacob preserves a prepared ME2-survival state; Petrovsky uses prepared Legendary Omega. Kai is a second documentary occurrence supported by the existing same-work enemy card, not a newly invented identity. Civilian and unestablished roles remain closed.',
                  'Equipment: thirty contextual references do not add thirty named armors. Nine declared benches reuse native tools, three ME3 module families, thermal clips, grenade stock and power cells. ME2/ME3 medi-gel, heavy cells, MEA ammo consumables, fusion, fabrication, weight and unverified scopes stay closed. MEA power-cell attribution is explicitly general, not proof of a named power or original quantity.',
                  'Weapons: forty exact conventional equipment IDs reuse existing thermal-clip budgets. No rank, acquisition, mode-specific counterpart, named special mechanic or new source fact is granted; source pointers and solo conditions are preserved.',
                  'Fleet: twenty-six contextual dossiers are not twenty-six hulls. Jade is a named transport; Hyperion is an occurrence in mea-prologue. Nineteen station references, one derelict, three Normandy systems and one Nomad appearance stay inspection-only. Narrative outcomes and system consequences are unchanged.',
                  'Enemies: six closures preserve Citadel access/class dependence, Retaliation multiplayer only, Rannoch and Meridian special encounters, and uncertain kett-scientist identity. Remaining budgets are generic ATB samples with no named powers or reconstructed boss phases. Blue Suns Legionnaire is distinct from Legion; INF/GAL occurrences do not inherit ME2/ME3 kits.',
              ],
              'limits': ['Local catalogue declarations and repository reports only; no new source facts or cross-chat access.',
                         'Variable group sizes are intentional; no quota, inferred identity or fabricated equipment fills a shortfall.',
                         'Declared URLs remain inherited pointers, not newly verified primary evidence.',
                         'Existence does not certify a combat kit, exact statistics, acquisitions, hull topology, artwork or likeness.',
                         'Historical facts, natures, sources, conditions, statuses and Lot 1 files are preserved.',
                         'Prototype delivery requires current positive frozen proofs; closed inspections remain Défini.']}
    data = {'schemaVersion': 2, 'at': at, 'sourceReport': 'docs/qa/expansion2-source-review.json',
            'baselinePath': result['baselinePath'], 'baselineSha256': result['baselineSha256'],
            'rows': rows, 'historicalDigests': baseline['digests']}
    return result, data


def safe_output(root, path):
    path = path.resolve()
    if not (path.is_relative_to(Path('/tmp')) or
            (path.parent == root / 'docs/qa' and path.name.startswith('expansion2-'))):
        raise ValueError('New Lot 2 reports only; historical paths are read-only.')
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
    result, data = audit(root, (args.baseline or root / 'docs/qa/expansion2-baseline.json').resolve())
    for path, content in [(args.report, result), (args.snapshot, data)]:
        if path:
            safe_output(root, path).write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['sourceChecksPassed', 'overlayCount', 'sourceReviewSampleCount', 'modules', 'failures']}, ensure_ascii=False))
    return 0 if result['sourceChecksPassed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
