#!/usr/bin/env python3
"""Read-only checks for six native generated ME1 companion key-pose atlases."""
import hashlib
import json
import argparse
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--native-root', type=Path, default=ROOT.parent / 'generated_images',
                    help='Directory containing original tool-generated PNG outputs; read only.')
args = parser.parse_args()
CHARACTERS = ['ashley', 'kaidan', 'garrus', 'wrex', 'liara', 'tali']
POSES = ['aim', 'power', 'hit', 'down']
sha = lambda raw: hashlib.sha256(raw).hexdigest()
report = {'passed': False, 'generatedAt': datetime.now(timezone.utc).isoformat(),
          'scope': 'Read-only native RGBA, measured frames, visible alpha isolation, provenance-copy and actual whole-atlas visual review. These are 24 fixed key poses of six existing ME1 companions, not original models or complete animation cycles.',
          'globalFidelityCertified': False, 'sourceHashes': {}, 'assets': [], 'errors': [],
          'limitations': ['The existing crew atlas is the artistic identity reference. A primary per-costume, per-direction original-game comparison is not certified.',
                          'Illustrated weapons and action gestures do not follow every actual loadout or grant equipment, powers, statistics or recruitment.',
                          'Pixels below the renderer alpha-test threshold may remain outside measured opaque silhouettes. No source pixels are edited by this audit.']}


def checked(path):
    raw = (ROOT / path).read_bytes()
    report['sourceHashes'][path] = sha(raw)
    return raw


try:
    review_path = 'docs/qa/companion-combat-native-art-review.json'
    review = json.loads(checked(review_path))
    assert review['actuallyOpened'] is True and review['blockingFindings'] == []
    opened = {row['character']: row for row in review['images']}
    assert set(opened) == set(CHARACTERS)
    native_root = args.native_root.resolve()
    native_by_sha = {}
    if native_root.exists():
        for path in native_root.glob('*.png'):
            native_by_sha.setdefault(sha(path.read_bytes()), []).append(str(path))
    checked('public/assets/crew-atlas.png')
    checked('scripts/audit-companion-combat-art.py')
    for character in CHARACTERS:
        file = f'public/assets/companion-{character}-combat.png'
        config_path = f'public/assets/companion-{character}-animation.json'
        raw = checked(file)
        config = json.loads(checked(config_path))
        assert opened[character]['path'] == file and opened[character]['sha256'] == sha(raw)
        assert opened[character]['actuallyOpened'] is True
        assert (config.get('characterId') or config.get('character')) == character
        assert config['mediaId'] == 'ME1' and config['status'] == 'Prototype'
        combat = config['combat']
        assert combat['file'] == Path(file).name
        assert set(combat['frames']) == set(POSES)
        image = Image.open(ROOT / file)
        assert image.mode == 'RGBA'
        width, height = image.size
        assert (width, height) == (combat['width'], combat['height'])
        alpha = image.getchannel('A')
        histogram = alpha.histogram()
        assert histogram[0] > width * height * .2 and sum(histogram[51:]) > 10000
        coverage = [0] * (width * height)
        frames = []
        for pose in POSES:
            frame = combat['frames'][pose]
            assert frame['id'] == f'{character}-combat-{pose}' and frame['pose'] == pose
            x, y, w, h = frame['rect']
            assert all(isinstance(v, int) for v in [x, y, w, h])
            assert 0 <= x < x + w <= width and 0 <= y < y + h <= height
            px, py = frame['pivot']
            assert 0 <= px <= w and 0 <= py <= h
            assert .05 <= frame['heightScale'] <= 1.2
            if pose == 'down':
                assert w > h and frame['heightScale'] < .6
            local_alpha = alpha.crop((x, y, x + w, y + h))
            visible = local_alpha.point(lambda value: 255 if value >= 51 else 0)
            bbox = visible.getbbox()
            assert bbox and 0 < bbox[0] < bbox[2] < w and 0 < bbox[1] < bbox[3] < h, f'{character}/{pose}: visible silhouette touches crop edge'
            pixels = local_alpha.load()
            for row in range(h):
                start = (y + row) * width + x
                for col in range(w):
                    if pixels[col, row] >= 51:
                        coverage[start + col] += 1
            frames.append({'pose': pose, 'id': frame['id'], 'rect': frame['rect'],
                           'pivot': frame['pivot'], 'heightScale': frame['heightScale'],
                           'visibleBoundsAtAlpha51': list(bbox)})
        values = list(alpha.getdata())
        missed = sum(value >= 51 and count == 0 for value, count in zip(values, coverage))
        shared = sum(value >= 51 and count > 1 for value, count in zip(values, coverage))
        assert missed == 0 and shared == 0, f'{character}: missed/shared visible pixels {missed}/{shared}'
        natives = native_by_sha.get(sha(raw), [])
        assert natives, f'{character}: selected output has no identical native generation file in {native_root}'
        report['assets'].append({'character': character, 'path': file, 'configPath': config_path,
                                 'bytes': len(raw), 'sha256': sha(raw), 'mode': image.mode,
                                 'width': width, 'height': height, 'alphaRange': list(alpha.getextrema()),
                                 'transparentPixels': histogram[0], 'visiblePixelsAtAlpha51': sum(histogram[51:]),
                                 'unassignedVisiblePixels': missed, 'sharedVisiblePixels': shared,
                                 'nativeCopyVerified': True, 'nativeSourceFiles': natives,
                                 'actuallyOpened': True, 'frames': frames})
    assert len(report['assets']) == 6 and sum(len(row['frames']) for row in report['assets']) == 24
    report['passed'] = True
except Exception as error:
    report['errors'].append(f'{type(error).__name__}: {error}')

output = ROOT / 'docs/qa/companion-combat-art-report.json'
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'assets': len(report['assets']), 'errors': report['errors']}))
raise SystemExit(0 if report['passed'] else 1)
