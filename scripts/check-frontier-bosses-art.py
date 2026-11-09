"""Read-only alpha/frame QA; native PNG files are copied without pixel editing."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, shutil, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'saren': '/workspace/generated_images/exec-bfc3b00c-a688-42df-8e42-b5eb323879b5.png',
    'benezia': '/workspace/generated_images/exec-e6790eac-7fac-48a9-bac6-0d7ce991d687.png',
    'thorian': '/workspace/generated_images/exec-e7424703-d4c7-473a-b084-9215422fcc33.png',
    'saren-final': '/workspace/generated_images/exec-348495ad-b8b3-4397-9c00-853203cfc39f.png',
}
CATALOG_IDS = {'saren': 'SPR-saren-sur-virmire-ennemi', 'benezia': 'SPR-matriarche-benezia-ennemi',
               'thorian': 'SPR-thorian-ennemi', 'saren-final': 'SPR-saren-a-la-citadelle-ennemi'}
POSES = ['aim', 'power', 'hit', 'down']
hash_bytes = lambda data: hashlib.sha256(data).hexdigest()

selected = sys.argv[1:] or list(SOURCES)
assert all(key in SOURCES for key in selected)
for key, source in SOURCES.items():
    if key not in selected:
        continue
    native = Path(source)
    output = ROOT / f'public/assets/boss-{key}-combat.png'
    # A byte-for-byte copy is the only operation applied to the native artwork.
    if native.exists():
        shutil.copyfile(native, output)
    data = output.read_bytes()
    image = Image.open(output)
    assert image.mode == 'RGBA'
    alpha = np.array(image.getchannel('A'))
    visible = alpha >= 51
    width, height = image.size
    assert width % 2 == height % 2 == 0
    labels, count = ndimage.label(visible, structure=np.ones((3, 3), dtype=int))
    sizes = np.bincount(labels.ravel())
    components = []
    for label, box in enumerate(ndimage.find_objects(labels), 1):
        if box:
            components.append({'pixels': int(sizes[label]), 'bounds': [box[1].start, box[0].start, box[1].stop, box[0].stop]})
    frames, frame_reports = {}, {}
    coverage = np.zeros_like(alpha, dtype=np.uint8)
    for pose, (qx, qy) in zip(POSES, [(0, 0), (width//2, 0), (0, height//2), (width//2, height//2)]):
        ys, xs = np.where(visible[qy:qy+height//2, qx:qx+width//2])
        assert xs.size
        left, top, right, bottom = int(xs.min()+qx), int(ys.min()+qy), int(xs.max()+qx+1), int(ys.max()+qy+1)
        rect = [left-8, top-8, right-left+16, bottom-top+16]
        x, y, w, h = rect
        assert x >= 0 and y >= 0 and x+w <= width and y+h <= height
        # Visible bounds get an eight-pixel safety margin without modifying pixels.
        patch = visible[y:y+h, x:x+w]
        fy, fx = np.where(patch)
        margins = [int(fx.min()), int(fy.min()), int(w-fx.max()-1), int(h-fy.max()-1)]
        assert min(margins) >= 8, (key, pose, margins)
        coverage[y:y+h, x:x+w] += 1
        frames[pose] = {'id': f'{key}-combat-{pose}', 'pose': pose, 'rect': rect,
                        'pivot': [w/2, h-8], 'heightScale': 1}
        frame_reports[pose] = {'visibleBounds': [left, top, right, bottom], 'rect': rect,
                              'visibleAlpha51Margin': margins, 'visiblePixels': int(patch.sum())}
    reference_height = frames['aim']['rect'][3]
    for pose in POSES:
        frames[pose]['heightScale'] = round(frames[pose]['rect'][3] / reference_height, 6)
    assert int((visible & (coverage == 0)).sum()) == 0
    assert int((visible & (coverage > 1)).sum()) == 0
    animation = {'version': 1, 'characterId': key, 'mediaId': 'ME1', 'periodId': 'me1', 'status': 'Prototype',
                 'catalogId': CATALOG_IDS[key],
                 'notes': 'Four fixed pose drawings only; existing actor statistics, kits and encounters remain unchanged. Partial identity/body references; not an original-game likeness or complete moveset certification.',
                 'combat': {'file': output.name, 'width': width, 'height': height,
                            'direction': 'three-quarter', 'frames': frames}}
    (ROOT / f'public/assets/boss-{key}-animation.json').write_text(json.dumps(animation, indent=2)+'\n')
    report = {'passed': True, 'generatedAt': datetime.now(timezone.utc).isoformat(),
              'baselineCommit': 'ff8a1cf7fd343d2bb8df6b01d5f18f3f5e7723cd',
              'scope': 'Native unedited PNG bytes and alpha51 frame QA. Detached browser review and in-game integration are distinct checks. No complete original-game likeness/kit/phase claim.',
              'characterId': key, 'mediaId': 'ME1', 'periodId': 'me1', 'status': 'Prototype',
              'catalogId': CATALOG_IDS[key], 'png': str(output.relative_to(ROOT)), 'sha256': hash_bytes(data),
              'bytes': len(data), 'nativeSource': source,
              'nativeCopyVerified': native.exists() and data == native.read_bytes(), 'pixelEditingApplied': False,
              'dimensions': [width, height], 'mode': image.mode, 'visibleAlphaThreshold': 51,
              'alphaMinimum': int(alpha.min()), 'alphaMaximum': int(alpha.max()),
              'transparentPixels': int((alpha == 0).sum()), 'nativeLowAlphaPixels': int(((alpha > 0) & (alpha < 51)).sum()),
              'visiblePixels': int(visible.sum()), 'visiblePixelsUnassigned': int((visible & (coverage == 0)).sum()),
              'visiblePixelsShared': int((visible & (coverage > 1)).sum()),
              'components': sorted(components, key=lambda item: -item['pixels']), 'frames': frame_reports,
              'anchorMethod': 'Centre of each full pose bounds, ground at visible lower edge; fixed drawings scale relative to aim crop height. Runtime capture must confirm staging.',
              'actuallyOpened': False, 'nativeBrowserReview': None,
              'remainingLimitations': ['No accessible primary full-body source for all four bosses.',
                                       'Prototype costume/anatomy; Benezia old fantasy horn costume deliberately corrected but exact original dress unverified.',
                                       'Four static state drawings are not full animations, phase mechanics, or additional named bosses.']}
    (ROOT / f'docs/qa/frontier-boss-{key}-art.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'key': key, 'sha256': report['sha256'], 'components': count, 'frames': frames}))
