#!/usr/bin/env python3
"""Check Armax lot04 files and design data; never certify art or gameplay."""
import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve()
    lot = root / 'docs/armax/lot04'
    roster = json.loads((lot / 'fighters.json').read_text())
    manifest = json.loads((lot / 'asset-manifest.json').read_text())
    fighters = roster['fighters']
    by_id = {f['id']: f for f in fighters}
    errors, warnings, images = [], [], []
    moves, combos = {}, []

    def require(condition, message):
        if not condition:
            errors.append(message)

    def repo_path(relative):
        target = (root / relative).resolve()
        require(target.is_relative_to(root), f'Path outside repository: {relative}')
        return target

    require(len(by_id) == len(fighters), 'Duplicate fighter IDs')
    require(len(fighters) == 14, 'Lot04 must contain its 14 declared character records')
    require(roster['simulationHz'] == 60, 'Design timing must use 60 Hz')
    require(roster['gameplayImplemented'] is False, 'This lot does not implement gameplay')
    require(roster['fidelityCertified'] is False, 'Global fidelity is not certified')
    source_ids = {s['id'] for s in roster['sources']}

    for fighter in fighters:
        fid = fighter['id']
        require(fighter['expectedAsset'] == f"public/assets/armax/lot04/{fighter['slug']}-idle.png", f'{fid}: inconsistent asset path')
        require(fighter.get('fidelityCertified') is False, f'{fid}: unsupported fidelity claim')
        require(fighter.get('gameplayImplemented') is False, f'{fid}: unsupported playable claim')
        for sid in fighter.get('sourceIds', []):
            require(sid in source_ids, f'{fid}: unresolved source {sid}')
        if fighter['selection']['support']:
            require(not fighter['normals'] and not fighter['specials'], f'{fid}: support must not receive a combat kit')
            require(all(fighter.get(k) is None for k in ['throw', 'super', 'finisher']), f'{fid}: unsupported combat action on support')
        else:
            require(len(fighter['normals']) == 6 and len(fighter['specials']) == 3, f'{fid}: incomplete specified move groups')
            require(len(fighter['combos']) == 2, f'{fid}: expected two proposed combos')
        grouped = fighter['normals'] + fighter['specials']
        grouped += [fighter[k] for k in ['throw', 'super', 'finisher'] if fighter.get(k)]
        grouped += fighter.get('supportActions', [])
        for move in grouped:
            mid = move['id']
            require(mid not in moves, f'Duplicate move ID: {mid}')
            moves[mid] = move
            for key in ['startupFrames', 'activeFrames', 'recoveryFrames', 'damage', 'cost']:
                value = move.get(key)
                if value is not None:
                    require(isinstance(value, (int, float)) and value >= 0, f'{mid}: invalid {key}')
        combos.extend(fighter['combos'])
        for scene in fighter['story'].values():
            require(scene.get('canonicalDialogue') is False, f'{fid}: dialogue must be identified as an adaptation')

    for combo in combos:
        ids = combo['moveIds']
        require(all(mid in moves for mid in ids), f"{combo['id']}: unresolved move")
        if not all(mid in moves for mid in ids):
            continue
        scales = roster['rules']['damageScaling']
        require(len(ids) <= len(scales), f"{combo['id']}: too many damage events")
        expected = sum(math.floor(moves[mid]['damage'] * scales[i]) for i, mid in enumerate(ids))
        require(combo['rawScaledDamage'] == expected, f"{combo['id']}: damage {combo['rawScaledDamage']} != {expected}")
        require(combo['meterCost'] == sum(moves[mid].get('cost', 0) for mid in ids), f"{combo['id']}: inconsistent meter cost")

    assets = manifest['assets']
    asset_by_id = {a['fighterId']: a for a in assets}
    require(len(asset_by_id) == len(assets), 'Duplicate selected asset for a character')
    tracked_paths = set()
    for item in assets + manifest.get('sourceArtifacts', []):
        fid, relative = item['fighterId'], item['path']
        require(fid in by_id, f'Unknown asset fighter: {fid}')
        require(relative not in tracked_paths, f'Duplicate image path: {relative}')
        tracked_paths.add(relative)
        path = repo_path(relative)
        require(path.is_file(), f'Missing recorded image: {relative}')
        if not path.is_file():
            continue
        if item.get('sha256'):
            require(item['sha256'] == sha256(path), f'SHA-256 mismatch: {relative}')
        with Image.open(path) as im:
            require(im.format == 'PNG', f'Expected PNG: {relative}')
            require(im.mode == 'RGBA', f'Expected RGBA: {relative}')
            if im.mode != 'RGBA':
                continue
            alpha = im.getchannel('A')
            histogram = alpha.histogram()
            body = alpha.point(lambda v: 255 if v >= 16 else 0).getbbox()
            require(histogram[0] > 0 and body is not None, f'No real transparency or visible subject: {relative}')
            if item in assets:
                require(item['width'] == im.width and item['height'] == im.height, f'Dimensions differ from manifest: {relative}')
                require(item.get('frameCount') == 1, f'Only one still pose was generated: {relative}')
                require(item.get('playable') is False, f'Unsupported playable claim: {relative}')
                require(item['visualReview']['fidelityCertified'] is False, f'Unsupported visual fidelity claim: {relative}')
            images.append({'path': relative, 'sha256': sha256(path), 'bytes': path.stat().st_size, 'size': list(im.size), 'mode': im.mode, 'alphaExtrema': list(alpha.getextrema()), 'transparentFraction': histogram[0] / (im.width * im.height), 'bodyBoundsAlpha16': list(body) if body else None, 'selected': item in assets})

    for fighter in fighters:
        produced = fighter['id'] in asset_by_id
        require(fighter['assetProduced'] is produced, f"{fighter['id']}: assetProduced differs from real selected file")
        require(fighter['status'] in ['Défini', 'Prototype'], f"{fighter['id']}: status advances beyond this production lot")
    # Later recovered originals are tracked separately from historical selections.
    # Validate their recorded bytes instead of ignoring this subdirectory.
    recovered_paths = set()
    recovery_path = root / 'docs/armax/recovery-20261120/asset-inventory.json'
    if recovery_path.is_file():
        recovery = json.loads(recovery_path.read_text())
        for item in recovery.get('assets', []):
            relative = item.get('path', '')
            if not relative.startswith('public/assets/armax/lot04/recovered/'):
                continue
            require(relative not in recovered_paths, f'Duplicate recovered image path: {relative}')
            recovered_paths.add(relative)
            path = repo_path(relative)
            require(path.is_file(), f'Missing recovered image: {relative}')
            if path.is_file():
                require(item.get('technical', {}).get('sha256') == sha256(path), f'Recovered SHA-256 mismatch: {relative}')
    require(not tracked_paths.intersection(recovered_paths), 'Recovered images must not duplicate historical selections')
    tracked_paths.update(recovered_paths)
    actual_paths = {str(p.relative_to(root)) for p in (root / 'public/assets/armax/lot04').rglob('*.png')}
    require(actual_paths == tracked_paths, 'Untracked or absent PNG files in lot04')
    latest_attempts = {}
    for attempt in manifest['generationAttempts']:
        require(attempt['fighterId'] in by_id, f"Unknown attempt fighter: {attempt['fighterId']}")
        latest_attempts[attempt['fighterId']] = attempt
        if attempt['status'] == 'blocked':
            require(attempt['fileProduced'] is False, f"Refused request cannot produce a file: {attempt['fighterId']}")
    blocked = [fid for fid, a in latest_attempts.items() if a['status'] == 'blocked' and fid not in asset_by_id]
    missing = [f['id'] for f in fighters if f['id'] not in asset_by_id]
    for asset in assets:
        if asset['technicalReview'].get('passed') is not True:
            warnings.append({'fighterId': asset['fighterId'], 'reason': 'Technical art cleanup remains open'})
        for issue in asset['visualReview'].get('issues', []):
            warnings.append({'fighterId': asset['fighterId'], 'reason': issue})
    report = {
        'scope': 'Local file integrity and arithmetic checks only; no gameplay or 1:1 certification',
        'baseCommit': roster['baseCommit'],
        'structuralChecksPassed': not errors,
        'counts': {'characters': len(fighters), 'combatKitsSpecified': sum(not f['selection']['support'] for f in fighters), 'supportCharacters': sum(f['selection']['support'] for f in fighters), 'normals': sum(len(f['normals']) for f in fighters), 'specials': sum(len(f['specials']) for f in fighters), 'proposedCombos': len(combos), 'bossPhases': sum(len(f['bossPhases']) for f in fighters), 'selectedImages': len(assets), 'archivedImages': len(manifest.get('sourceArtifacts', [])), 'missingCharacterImages': len(missing), 'blockedCharacterImages': len(blocked), 'generationAttempts': len(manifest['generationAttempts'])},
        'missing': missing, 'blocked': blocked, 'images': images, 'errors': errors, 'artReservations': warnings,
        'additionalRecoveredOriginals': len(recovered_paths),
        'sourceHashes': {name: sha256(lot / name) for name in ['fighters.json', 'asset-manifest.json', 'BIBLE_EXTENSION.md', 'REPRISE.md'] if (lot / name).is_file()},
    }
    if args.write:
        (lot / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'structuralChecksPassed': report['structuralChecksPassed'], 'counts': report['counts'], 'errors': errors, 'artReservations': len(warnings)}, ensure_ascii=False, indent=2))
    raise SystemExit(0 if not errors else 1)


if __name__ == '__main__':
    main()
