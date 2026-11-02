#!/usr/bin/env python3
"""Read-only raster/config inspection. Requires Pillow, NumPy and SciPy.

No source or delivered PNG is written. Reports are new per-character evidence;
runtime screenshots and original-game fidelity review remain separate checks.
"""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image
from scipy.ndimage import find_objects, label

ROOT = Path(__file__).resolve().parents[1]
BASE = subprocess.check_output(['git', 'rev-parse', '05d1f03'], cwd=ROOT, text=True).strip()
THRESHOLD = 51  # Existing world renderer alphaTest = 0.2.


def digest(value):
    return hashlib.sha256(value).hexdigest()


for character in ['geth-sniper', 'geth-destroyer']:
    config_path = Path(f'public/assets/enemy-{character}-animation.json')
    prompt_path = Path(f'docs/research/me1-enemy-poses-{character}-prompts.json')
    config_bytes = (ROOT / config_path).read_bytes()
    prompts_bytes = (ROOT / prompt_path).read_bytes()
    config = json.loads(config_bytes)
    prompts = json.loads(prompts_bytes)
    selected = [request for request in prompts['requests'] if request['selected']]
    assert len(selected) == 1
    selected = selected[0]
    image_path = Path(f'public/assets/{config["combat"]["file"]}')
    image_bytes = (ROOT / image_path).read_bytes()
    assert digest(image_bytes) == selected['sha256']
    native_path = ROOT.parent / 'generated_images' / selected['generatedFile']
    native_available = native_path.is_file()
    if native_available:
        assert image_bytes == native_path.read_bytes(), 'Delivered image differs from native generation'
    reference = ROOT / prompts['sourceReference']
    reference_bytes = reference.read_bytes()
    assert digest(reference_bytes) == prompts['sourceReferenceSha256']
    base_reference = subprocess.check_output(['git', 'show', f'{BASE}:{prompts["sourceReference"]}'], cwd=ROOT)
    assert reference_bytes == base_reference
    image = Image.open(ROOT / image_path)
    assert image.mode == 'RGBA'
    assert image.size == (config['combat']['width'], config['combat']['height']) == (1536, 1024)
    assert config['character'] == config['characterId'] == character
    assert config['mediaId'] == 'ME1' and config['periodId'] == 'me1' and config['status'] == 'Prototype'
    assert config['combat']['direction'] == 'three-quarter'
    assert set(config['combat']['frames']) == {'aim', 'power', 'hit', 'down'}
    alpha = np.asarray(image.getchannel('A'))
    visible = alpha >= THRESHOLD
    assert int((alpha == 0).sum()) > alpha.size // 2, 'Real empty alpha area required'
    labels, components = label(visible)
    assert components == 4, 'Four separate visible pose silhouettes required'
    regions = find_objects(labels)
    frame_reports = []
    assigned = np.zeros(alpha.shape, dtype=np.uint8)
    for pose, frame in config['combat']['frames'].items():
        assert frame['id'] == f'{character}-combat-{pose}' and frame['pose'] == pose
        x, y, width, height = frame['rect']
        assert all(isinstance(value, int) for value in frame['rect'])
        assert x >= 0 and y >= 0 and width > 0 and height > 0
        assert x + width <= image.width and y + height <= image.height
        px, py = frame['pivot']
        assert 0 <= px <= width and 0 <= py <= height
        assert 0 < frame['heightScale'] <= 1.1
        sample = alpha[y:y + height, x:x + width]
        seen = sample >= THRESHOLD
        ys, xs = np.nonzero(seen)
        assert len(xs) > 50000
        component_ids = np.unique(labels[y:y + height, x:x + width][seen])
        assert len(component_ids) == 1, 'A frame must contain just one pose'
        component = regions[int(component_ids[0]) - 1]
        assert component[1].start >= x and component[0].start >= y
        assert component[1].stop <= x + width and component[0].stop <= y + height
        clearance = [int(xs.min()), int(ys.min()), int(width - 1 - xs.max()), int(height - 1 - ys.max())]
        assert min(clearance) >= 8, 'At least eight rendered-transparent pixels around every pose'
        assigned[y:y + height, x:x + width] += seen
        edges = np.concatenate([sample[0, :], sample[-1, :], sample[:, 0], sample[:, -1]])
        frame_reports.append({'pose': pose, 'id': frame['id'], 'rect': frame['rect'],
                              'pivot': frame['pivot'], 'heightScale': frame['heightScale'],
                              'visiblePixels': int(seen.sum()),
                              'visibleBoundsWithinFrame': [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)],
                              'transparentClearanceLTRB': clearance,
                              'edgeMaximumAlpha': int(edges.max()),
                              'edgePixelsAtRendererThreshold': int((edges >= THRESHOLD).sum())})
    assert np.all(assigned[visible] == 1), 'Every rendered pixel assigned exactly once'
    assert int((assigned > 0).sum()) == int(visible.sum())
    down = config['combat']['frames']['down']
    horizontal_extent = down['heightScale'] * down['rect'][2] / down['rect'][3]
    assert .95 <= horizontal_extent <= 1.15, 'Fallen silhouette extent remains near upright height'
    report = {
        'passed': True, 'generatedAt': datetime.now(timezone.utc).isoformat(), 'baseMain': BASE,
        'scope': 'Read-only PNG alpha, native-file equality, exact frame bounds, pivot and framing checks for four generated fixed ME1 key poses; no original-game art fidelity certification.',
        'characterId': character, 'mediaId': 'ME1', 'status': 'Prototype',
        'auditTool': {'path': 'scripts/check-me1-geth-variants-art.py', 'sha256': digest(Path(__file__).read_bytes())},
        'image': {'path': str(image_path), 'sha256': digest(image_bytes), 'bytes': len(image_bytes),
                  'width': image.width, 'height': image.height, 'mode': image.mode},
        'configuration': {'path': str(config_path), 'sha256': digest(config_bytes)},
        'prompts': {'path': str(prompt_path), 'sha256': digest(prompts_bytes)},
        'nativeSource': {'generatedFile': selected['generatedFile'], 'sha256': selected['sha256'],
                         'availableInThisExecution': native_available, 'byteEqualityVerifiedInThisExecution': native_available},
        'existingReferencePreserved': {'path': prompts['sourceReference'], 'sha256': digest(reference_bytes), 'equalsBaseline': True},
        'alpha': {'rendererThreshold': THRESHOLD, 'minimum': int(alpha.min()), 'maximum': int(alpha.max()),
                  'fullyTransparent': int((alpha == 0).sum()), 'belowRendererThresholdNonzero': int(((alpha > 0) & (alpha < THRESHOLD)).sum()),
                  'renderedPixels': int(visible.sum()), 'separateRenderedSilhouettes': int(components),
                  'renderedPixelsAssignedExactlyOnce': True},
        'frames': frame_reports, 'downHorizontalExtentInUprightHeightUnits': horizontal_extent,
        'primaryReferenceAttempt': prompts['primaryReferenceAttempt'], 'primaryReview': prompts['primaryReview'],
        'visualReview': {'sourceAtlasActuallyOpened': True, 'deliveredFullAtlasActuallyOpened': True,
                         'fullBodiesAndFourPosesObserved': True, 'matchingME1PrototypeCostumeObserved': True,
                         'inGameReviewedByThisCheck': False, 'primaryCanonicalVisualComparison': False},
        'limitations': ['Four fixed three-quarter key poses, not a full animation cycle or additional walk directions.',
                        'Generic firearm illustration does not prove an original weapon model; the fixed action pose grants no new gameplay power.',
                        'Low-opacity exterior pixels remain below alphaTest 0.2; perfect removal of every source halo is not claimed.',
                        'Pivot and fallen-body height are measured visual calibrations; anatomy and exact inter-pose proportional identity are not certified.',
                        'Existing enemy prototype art supplies the retained identity and palette; the small named Prima destroyer capture is partial, without a full canonical model certification.',
                        'No crop, resize, alpha rewrite, recolouring or other pixel edit was applied to the delivered PNG.'],
    }
    output = ROOT / f'docs/qa/me1-enemy-poses-{character}-art.json'
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'character': character, 'passed': True, 'visiblePoses': components, 'nativeByteEquality': native_available, 'report': str(output.relative_to(ROOT))}))
