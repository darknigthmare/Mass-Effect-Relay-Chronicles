"""Verify already captured HTTP evidence; no network request is performed here.

Input is the three EA bodies + retrieval manifests produced by urllib.request.
The evidence deliberately separates collective EA statements from inherited
model/extension associations. Failed candidate routes never establish facts.
"""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--capture-dir', type=Path, required=True)
args = parser.parse_args()

captures = json.loads((args.capture_dir / 'primary.json').read_text())
additional = json.loads((args.capture_dir / 'additional.json').read_text())
quotes = {
    'ea-le': 'including promo weapons, armors, and packs',
    'ea-cal': 'Weapons and armor DLC packs are now integrated naturally into the game',
}
primary, unused, failed = [], [], []
for row in captures + additional:
    body = (args.capture_dir / f"{row['key']}.html").read_bytes()
    assert hashlib.sha256(body).hexdigest() == row['sha256']
    assert len(body) == row['bytes']
    item = {key: row[key] for key in ['key', 'url', 'finalUrl', 'status', 'bytes', 'sha256']}
    if row['key'] in quotes:
        item['quote'] = quotes[row['key']]
        plain = re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', body.decode()))
        item['quoteFound'] = item['quote'] in plain
        assert row['status'] == 200 and item['quoteFound']
        item['scope'] = 'Collective inclusion/integration only; no per-model mechanics or original values.'
        primary.append(item)
    elif row['status'] == 200:
        item['usedAsEvidence'] = False
        item['reason'] = 'The current ME3 product page does not identify the candidate weapon/pack links.'
        unused.append(item)
    else:
        item['usedAsEvidence'] = False
        failed.append(item)

catalog_path = ROOT / 'docs/universe/catalogs/ME3.json'
catalog_bytes = catalog_path.read_bytes()
catalog = json.loads(catalog_bytes)
identity = []
for record_id, extension in [('ME3-WPN-SUPPRESSOR', 'Citadel'), ('ME3-WPN-RAIDER', 'Leviathan')]:
    entry = next(entry for entry in catalog['entries'] if entry['id'] == record_id)
    assert extension in entry['description'] + ' ' + entry.get('conditions', '')
    identity.append({
        'recordId': record_id, 'name': entry['name'], 'inheritedDescription': entry['description'],
        'inheritedConditions': entry.get('conditions', ''), 'sourceIds': entry['sourceIds'],
        'catalogueSources': [source for source in catalog['sources'] if source['id'] in entry['sourceIds']],
        'extensionAssociation': extension,
        'individualPrimaryReferenceRechecked': False,
        'basis': 'Explicit association already present in the catalogue and its historical references; no fresh individual article download is claimed.',
        'preparedEdition': 'legendary',
    })

left_closed = []
for suffix in ['HARRIER', 'TYPHOON', 'VALKYRIE', 'PIRANHA', 'INDRA', 'VALIANT', 'HURRICANE']:
    entry = next(entry for entry in catalog['entries'] if entry['id'] == f'ME3-WPN-{suffix}')
    left_closed.append({'recordId': entry['id'], 'name': entry['name'], 'sourceIds': entry['sourceIds'],
                        'inheritedConditions': entry.get('conditions', ''),
                        'reason': 'Only an extended-arsenal/edition condition and generic equipment index are recorded; the model-to-content association is not established by the collective EA page.'})

report = {
    'passed': True, 'generatedAt': datetime.now(timezone.utc).isoformat(),
    'baselineCommit': '05d1f030dab0925d57d4ba8c5bdb9ccde8db1ad0',
    'command': f'python scripts/me3-legendary-weapons-references.py --capture-dir {args.capture_dir}',
    'retrievalMethod': 'Previously executed Python standard-library urllib.request through inherited proxy/TLS trust; three primary/current product routes and three candidate historical product routes. This script verifies their captured byte counts, SHA values and exact quotes without repeating requests.',
    'scope': 'Two existing conventional ME3 profiles become prepared Legendary choices. Collective EA evidence supplements explicitly recorded Citadel/Leviathan associations; no original statistics, named pack assignment for the other seven candidates, acquisition path or full fidelity is inferred.',
    'primaryDownloads': primary, 'unusedSuccessfulDownloads': unused, 'failedReferences': failed,
    'identityEvidence': identity, 'leftClosed': left_closed,
    'sourceSnapshots': {str(catalog_path.relative_to(ROOT)): hashlib.sha256(catalog_bytes).hexdigest(),
                        'scripts/me3-legendary-weapons-references.py': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
    'limitations': [
        'The EA inclusion and integration statements are collective and do not enumerate the two models.',
        'Individual model/extension links are inherited catalogue facts; their original articles have not been freshly downloaded here.',
        'The seven generic extended-arsenal references stay closed. HTTP404 pages and the current generic ME3 product page do not establish their content links.',
        'Generic firing primitives, magazine capacities, reserve budgets, damage, price, ranks, headshot behavior, spread, animations, audio and exact geometry are not primary-source certified.',
        'Legendary selection is a declared prepared workshop state; original purchases, rewards and missions are not granted or simulated.',
    ],
}
out = ROOT / 'docs/qa/me3-legendary-weapons-reference-report.json'
out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'passed': True, 'primaryDownloads': len(primary), 'existingModelLinks': len(identity), 'leftClosed': len(left_closed)}))
