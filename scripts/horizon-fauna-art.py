"""Read native pixels only. No image transformation or raster cleanup."""
from pathlib import Path
from hashlib import sha256
from datetime import datetime, timezone
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/workspace/generated_images/exec-a5c43abd-3bab-403e-905b-7a3220d1f414.png')
PNG = ROOT / 'public/assets/horizon-fauna.png'
META = ROOT / 'public/assets/horizon-fauna.json'
report = {'passed': False, 'at': datetime.now(timezone.utc).isoformat(),
          'asset': str(PNG.relative_to(ROOT)), 'metadata': str(META.relative_to(ROOT)),
          'sha256': sha256(PNG.read_bytes()).hexdigest(), 'nativeSource': str(SOURCE),
          'pixelEditingApplied': False, 'nativeCopyVerified': False, 'actuallyOpened': False,
          'scope': 'Eight isolated fixed fauna drawings, not eight playable creatures or complete original models.', 'frames': []}
try:
    assert PNG.read_bytes() == SOURCE.read_bytes()
    report['nativeCopyVerified'] = True
    config = json.loads(META.read_text())
    image = Image.open(PNG)
    assert image.mode == 'RGBA' and image.size == (1536, 1024) == (config['width'], config['height'])
    alpha = np.asarray(image.getchannel('A'))
    visible = alpha >= config['alphaCutoff']
    covered = np.zeros_like(visible)
    assert len(config['frames']) == 8
    for key, frame in config['frames'].items():
        x, y, w, h = frame['rect']
        assert x >= 0 and y >= 0 and x + w <= image.width and y + h <= image.height
        assert not covered[y:y+h, x:x+w].any(), key
        covered[y:y+h, x:x+w] = True
        yy, xx = np.where(visible[y:y+h, x:x+w])
        assert len(xx) > 1000
        margins = [int(xx.min()), int(yy.min()), int(w - 1 - xx.max()), int(h - 1 - yy.max())]
        assert min(margins) >= 8, (key, margins)
        report['frames'].append({'id': key, 'rect': frame['rect'], 'pivot': frame['pivot'],
                                 'visibleMargins': margins, 'visiblePixels': len(xx)})
    outside = int((visible & ~covered).sum())
    assert outside == 0, f'{outside} visible pixels are not assigned'
    report.update({'passed': True, 'mode': image.mode, 'width': image.width, 'height': image.height,
                   'alphaExtrema': [int(alpha.min()), int(alpha.max())],
                   'alphaCutoff': config['alphaCutoff'], 'visiblePixelsOutsideAssignedFrames': outside,
                   'lowAlphaPixels': int(((alpha > 0) & (alpha < config['alphaCutoff'])).sum()),
                   'limitations': ['Low-alpha generated traces remain in the unchanged native PNG; crops and renderer alpha testing isolate visible bodies.',
                                   'Primary shape references are partial; later-game animals are reference drawings only.']})
except Exception as error:
    report['failure'] = repr(error)
(ROOT / 'docs/qa/horizon-fauna-art.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'frames': len(report['frames']), 'failure': report.get('failure')}))
raise SystemExit(0 if report['passed'] else 1)
