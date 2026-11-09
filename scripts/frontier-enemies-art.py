"""Read native pixels only; assert measured crops, padding and byte provenance."""
from pathlib import Path
import hashlib, json, datetime
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sha = lambda value: hashlib.sha256(value).hexdigest()
png = ROOT / 'public/assets/frontier-enemies.png'
meta = ROOT / 'public/assets/frontier-enemies.json'
report = {'passed': False, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope': 'Read-only PNG provenance and alpha>8 UV bounds. One body per enemy, not a multi-pose family or original-game certification.',
          'path': str(png.relative_to(ROOT)), 'metadata': str(meta.relative_to(ROOT)),
          'sha256': sha(png.read_bytes()), 'pixelEditingApplied': False,
          'actuallyOpened': False, 'nativeCopyVerified': False, 'frames': [], 'errors': []}
try:
    native = Path('/workspace/generated_images/exec-bbf157c5-3816-48b1-9d9f-aa8d1d15f6eb.png')
    assert native.read_bytes() == png.read_bytes()
    report['nativeCopyVerified'] = True
    report['nativeSource'] = str(native)
    config = json.loads(meta.read_text())
    image = Image.open(png)
    assert image.mode == 'RGBA' and image.size == (config['width'], config['height']) == (1536, 1024)
    alpha = np.asarray(image.getchannel('A'))
    visible = alpha > 8
    assert alpha.min() == 0 and alpha.max() == 254
    assigned = np.zeros(alpha.shape, dtype=np.uint8)
    assert len(config['frames']) == 8
    for key, frame in config['frames'].items():
        assert frame['key'] == frame['sprite'] == key
        assert frame['mediaId'] == 'ME1' and frame['periodId'] == 'me1'
        x, y, width, height = frame['rect']
        assert x >= 0 and y >= 0 and x+width <= image.width and y+height <= image.height
        rows, cols = np.where(visible[y:y+height, x:x+width])
        assert len(rows) > 1000
        margins = [int(cols.min()), int(rows.min()), int(width-1-cols.max()), int(height-1-rows.max())]
        assert min(margins) >= 8, (key, margins)
        assert 0 <= frame['pivot'][0] <= width and 0 <= frame['pivot'][1] <= height
        assert 0 < frame['heightScale'] <= 1.5
        assigned[y:y+height, x:x+width] += 1
        report['frames'].append({'key': key, 'rect': frame['rect'], 'pivot': frame['pivot'],
                                 'heightScale': frame['heightScale'], 'visiblePixels': len(rows),
                                 'visibleMarginsLTRB': margins,
                                 'alphaBoundsExclusive': [int(x+cols.min()), int(y+rows.min()), int(x+cols.max()+1), int(y+rows.max()+1)]})
    assert np.count_nonzero(visible & (assigned != 1)) == 0
    report['visiblePixelsAssignedExactlyOnce'] = True
    report['alphaRange'] = [int(alpha.min()), int(alpha.max())]
    report['transparentPixels'] = int(np.count_nonzero(alpha == 0))
    report['lowAlphaPixels1to8'] = int(np.count_nonzero((alpha > 0) & (alpha <= 8)))
    report['lowAlphaPixelsOutsideFrames'] = int(np.count_nonzero((alpha > 0) & (alpha <= 8) & (assigned == 0)))
    review = json.loads((ROOT / 'docs/qa/frontier-enemies-native-review.json').read_text())
    assert review['actuallyOpened'] and review['sha256'] == report['sha256']
    report['actuallyOpened'] = True
    report['nativeReview'] = 'docs/qa/frontier-enemies-native-review.json'
    report['limitations'] = ['Residual low alpha1 background pixels remain native; alpha>8 is used for silhouette padding.',
                            'Native view_image presentation appeared black; both actual byte-identical images were opened on browser light/dark backgrounds.',
                            'No primary-reference comparison certifies the drone chassis, stalker anatomy, launcher, turret or worker morphology.',
                            'No generated action, hit or defeat pose; procedural runtime presentation remains an adaptation.']
    report['sourceHashes'] = {str(meta.relative_to(ROOT)): sha(meta.read_bytes()),
                            'scripts/frontier-enemies-art.py': sha(Path(__file__).read_bytes())}
    report['passed'] = True
except Exception as error:
    report['errors'].append(repr(error))
(ROOT / 'docs/qa/frontier-enemies-art.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'frames': len(report['frames']), 'errors': report['errors']}))
if not report['passed']:
    raise SystemExit(1)
