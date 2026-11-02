"""Read-only aggregate checks of generated PNG bytes and actual frame rectangles."""
from pathlib import Path
import hashlib, json, datetime
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()
read = lambda p: (ROOT / p).read_bytes()
keys = ['geth', 'geth-sniper', 'geth-destroyer', 'husk', 'joker']
report = {'passed': False, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope': 'Read-only native-image equality, alpha51 framing and actual review references. No original-game likeness certification.',
          'assets': [], 'sourceHashes': {}, 'errors': []}
try:
    review_path = 'docs/qa/me1-enemy-poses-native-art-review.json'
    review = json.loads(read(review_path)); assert review['passed']
    report['sourceHashes'][review_path] = sha(read(review_path))
    for key in keys:
        prior_path = f'docs/qa/me1-enemy-poses-{key}-art.json'
        prior = json.loads(read(prior_path)); assert prior['passed'] is True
        png = f'public/assets/{"joker-seated" if key == "joker" else "enemy-" + key + "-combat"}.png'
        meta = f'public/assets/{"joker-seated.json" if key == "joker" else "enemy-" + key + "-animation.json"}'
        raw = read(png); config = json.loads(read(meta)); data = config if key == 'joker' else config['combat']
        assert config['characterId'] == key and config['mediaId'] == 'ME1' and config['periodId'] == 'me1'
        assert config['status'] == 'Prototype'
        image = Image.open(ROOT / png); assert image.mode == 'RGBA' and image.size == (1536, 1024)
        assert [data['width'], data['height']] == list(image.size)
        alpha = np.asarray(image.getchannel('A')); visible = alpha >= 51
        assert alpha.min() == 0 and alpha.max() >= 51
        assigned = np.zeros(alpha.shape, dtype=np.uint8); frames = []
        expected = ['idle', 'pilot'] if key == 'joker' else ['aim', 'power', 'hit', 'down']
        assert sorted(data['frames']) == sorted(expected)
        for pose in expected:
            frame = data['frames'][pose]; x, y, w, h = frame['rect']
            assert x >= 0 and y >= 0 and w > 0 and h > 0 and x+w <= image.width and y+h <= image.height
            region = visible[y:y+h, x:x+w]; rows, cols = np.where(region); assert len(rows) > 100
            margins = [int(cols.min()), int(rows.min()), int(w-1-cols.max()), int(h-1-rows.max())]
            assert min(margins) > 0, (key, pose, margins)
            assert 0 <= frame['pivot'][0] <= w and 0 <= frame['pivot'][1] <= h
            assert 0 < frame['heightScale'] <= 1.5
            assigned[y:y+h, x:x+w] += 1
            frames.append({'pose': pose, 'id': frame['id'], 'rect': frame['rect'], 'pivot': frame['pivot'],
                           'heightScale': frame['heightScale'], 'visiblePixels': len(rows), 'visibleMarginsLTRB': margins})
        assert np.count_nonzero(visible & (assigned != 1)) == 0
        native = prior['nativeSource']
        if isinstance(native, dict): native = str(ROOT.parent / 'generated_images' / native['generatedFile'])
        assert Path(native).read_bytes() == raw, key
        opened = next(item for item in review['images'] if item['path'] == png)
        assert opened['actuallyOpened'] and opened['sha256'] == sha(raw)
        report['assets'].append({'key': key, 'path': png, 'metadata': meta, 'sha256': sha(raw), 'nativeCopyVerified': True,
                                 'actuallyOpened': True, 'frames': frames, 'nonzeroLowAlphaPixels': int(np.count_nonzero((alpha > 0) & (alpha < 51))),
                                 'visiblePixelsAssignedExactlyOnce': True})
        for p in [png, meta, prior_path]: report['sourceHashes'][p] = sha(read(p))
    report['sourceHashes']['scripts/audit-me1-enemy-poses-art.py'] = sha(read('scripts/audit-me1-enemy-poses-art.py'))
    report['passed'] = True
except Exception as error:
    report['errors'].append(repr(error))
(ROOT / 'docs/qa/me1-enemy-poses-art-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'assets': len(report['assets']), 'drawings': sum(len(a['frames']) for a in report['assets']), 'errors': report['errors']}))
if not report['passed']: raise SystemExit(1)
