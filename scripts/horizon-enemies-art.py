"""Read native source bytes only: no raster editing, cropping or resampling."""
from pathlib import Path
import datetime, hashlib, json, sys
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sha = lambda value: hashlib.sha256(value).hexdigest()
analysis_only = '--analysis' in sys.argv
image_path = ROOT / 'public/assets/horizon-enemies.png'
meta_path = ROOT / 'public/assets/horizon-enemies.json'
provenance_path = ROOT / 'docs/research/horizon-enemies-generation.json'
report = {'passed': False, 'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope': 'Five fixed native body drawings and measured metadata; no full original-game fidelity or multi-pose family certification.',
          'sha256': sha(image_path.read_bytes()), 'nativeCopyVerified': False,
          'pixelEditingApplied': False, 'actuallyOpened': False, 'frames': [], 'errors': []}
try:
    provenance = json.loads(provenance_path.read_text())
    source = Path(provenance['nativeSource'])
    assert source.read_bytes() == image_path.read_bytes()
    assert provenance['nativeSHA256'] == report['sha256']
    report['nativeSource'] = str(source)
    report['nativeCopyVerified'] = True
    image = Image.open(image_path)
    meta = json.loads(meta_path.read_text())
    assert image.mode == 'RGBA' and image.size == (1536, 1024) == (meta['width'], meta['height'])
    alpha = np.asarray(image.getchannel('A'))
    assert alpha.min() == 0 and alpha.max() >= 250
    visible = alpha > 8
    assigned = np.zeros(alpha.shape, dtype=np.uint8)
    assert len(meta['frames']) == 5
    for key, frame in meta['frames'].items():
        x, y, width, height = frame['rect']
        assert frame['key'] == frame['sprite'] == key
        assert frame['id'] == key + '-body'
        assert frame['mediaId'] == 'ME1' and frame['periodId'] == 'me1'
        assert frame['file'] == 'horizon-enemies.png'
        assert x >= 0 and y >= 0 and x+width <= image.width and y+height <= image.height
        assert frame['heightScale'] == 1
        assert 0 <= frame['pivot'][0] <= width and 0 <= frame['pivot'][1] <= height
        ys, xs = np.where(visible[y:y+height, x:x+width])
        assert len(xs) > 1000
        margins = [int(xs.min()), int(ys.min()), int(width-1-xs.max()), int(height-1-ys.max())]
        assert min(margins) >= 8, (key, margins)
        assigned[y:y+height, x:x+width] += 1
        report['frames'].append({'key': key, 'rect': frame['rect'], 'pivot': frame['pivot'],
                                 'visibleMarginsLTRB': margins, 'visiblePixels': len(xs)})
    assert np.count_nonzero(visible & (assigned != 1)) == 0
    assert not visible[512:, 1024:].any()
    report.update({'width': image.width, 'height': image.height, 'mode': image.mode,
                   'alphaRange': [int(alpha.min()), int(alpha.max())],
                   'transparentPixels': int(np.count_nonzero(alpha == 0)),
                   'lowAlpha1to8Pixels': int(np.count_nonzero((alpha > 0) & (alpha <= 8))),
                   'visiblePixelsAssignedExactlyOnce': True,
                   'emptySixthCellMaxAlpha': int(alpha[512:, 1024:].max())})
    if not analysis_only:
        review_path = ROOT / 'docs/qa/horizon-enemies-native-review.json'
        review = json.loads(review_path.read_text())
        assert review['actuallyOpened'] is True and review['sha256'] == report['sha256']
        assert len(review['captures']) == 3
        for capture in review['captures']:
            assert capture['actuallyOpened'] is True
            assert sha((ROOT / capture['path']).read_bytes()) == capture['sha256']
        report['actuallyOpened'] = True
        report['nativeReview'] = str(review_path.relative_to(ROOT))
    report['sourceHashes'] = {str(meta_path.relative_to(ROOT)): sha(meta_path.read_bytes()),
                              str(provenance_path.relative_to(ROOT)): sha(provenance_path.read_bytes()),
                              'scripts/horizon-enemies-art.py': sha(Path(__file__).read_bytes())}
    report['limits'] = ['Residual native alpha1 pixels remain outside visible bodies; no pixel cleanup applied.',
                       'Only five static bodies, no movement/action/hit/defeat drawings.',
                       'Four-legged machine silhouettes were visually corrected; exact original armor, cannon geometry, colors and facial likeness remain unverified.',
                       'Body crops are measured irregular rectangles; the colossus slightly crosses the nominal512px cell into an empty gutter without contamination.']
    report['passed'] = True
except Exception as error:
    report['errors'].append(repr(error))
target = 'horizon-enemies-art-analysis.json' if analysis_only else 'horizon-enemies-art.json'
(ROOT / 'docs/qa' / target).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'actuallyOpened': report['actuallyOpened'], 'frames': len(report['frames']), 'errors': report['errors']}))
if not report['passed']:
    raise SystemExit(1)
