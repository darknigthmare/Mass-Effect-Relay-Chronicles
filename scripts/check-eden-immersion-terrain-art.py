"""Read-only native texture, edge statistics and linked WebGL material proof."""
from pathlib import Path
import hashlib, json, datetime
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'grass': '/workspace/generated_images/exec-f3f922ab-ddce-4a15-b94a-ef3cec2b3d5c.png',
    'dirt': '/workspace/generated_images/exec-0eaf762f-6699-4f09-ab67-d58fa6cc7b3a.png',
}
sha = lambda raw: hashlib.sha256(raw).hexdigest()
read = lambda path: (ROOT / path).read_bytes()
report = {'passed': False, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'baselineCommit': '533efaa2ca88c34be21eb53aa30fafcfedd79707',
          'scope': 'Two original prototype ground-colour images. Native equality, dimensions, opacity and measured edge statistics are separate from actual3x3 Three.js material views. No whole-level integration, perfect seamlessness, PBR or original-game1:1 certification.',
          'assets': [], 'sourceHashes': {}, 'proofs': [], 'errors': [],
          'pixelEditingApplied': False, 'wholeLevelIntegrationVerified': False,
          'globalFidelityCertified': False}
try:
    browser_path = 'docs/qa/eden-immersion-terrain-browser-report.json'
    review_path = 'docs/qa/eden-immersion-terrain-material-review.json'
    browser = json.loads(read(browser_path)); review = json.loads(read(review_path))
    assert browser['passed'] and review['passed']
    assert len(browser['captures']) == 2 and len(review['images']) == 4
    for proof in [browser_path, review_path]:
        report['proofs'].append({'path': proof, 'sha256': sha(read(proof))})
    for key, source in SOURCES.items():
        path = f'public/assets/eden-ground-{key}.png'; raw = read(path)
        assert Path(source).read_bytes() == raw
        image = Image.open(ROOT / path)
        assert image.size == (1254, 1254) and image.mode == 'RGB'
        rgb = np.asarray(image).astype(np.float32)
        seam_x = float(np.abs(rgb[:, 0] - rgb[:, -1]).mean())
        seam_y = float(np.abs(rgb[0] - rgb[-1]).mean())
        internal_x = float(np.abs(rgb[:, 1:] - rgb[:, :-1]).mean())
        internal_y = float(np.abs(rgb[1:] - rgb[:-1]).mean())
        actual = next(item for item in review['images'] if item['path'] == path)
        assert actual['actuallyOpened'] and actual['sha256'] == sha(raw)
        report['assets'].append({'key': key, 'path': path, 'nativeSource': source,
            'sha256': sha(raw), 'bytes': len(raw), 'width': 1254, 'height': 1254,
            'mode': image.mode, 'opaque': True, 'nativeCopyVerified': True,
            'actuallyOpened': True, 'status': 'Prototype',
            'edgeStatistics': {'channelRange': 255,
                'meanAbsoluteDifference': {'leftRight': seam_x, 'topBottom': seam_y},
                'internalAdjacentMeanAbsoluteDifference': {'x': internal_x, 'y': internal_y},
                'edgeToInternalDifferenceRatio': {'x': seam_x / internal_x, 'y': seam_y / internal_y},
                'meanEdgeColourDifferenceRGB': {'leftRight': np.abs(rgb[:,0].mean(0) - rgb[:,-1].mean(0)).tolist(),
                    'topBottom': np.abs(rgb[0].mean(0) - rgb[-1].mean(0)).tolist()},
                'qualification': 'Read-only colour differences, not a mathematical seamlessness certificate or a pass/fail visual substitute.'}})
        report['sourceHashes'][path] = sha(raw)
    for item in review['images']:
        assert item['actuallyOpened'] and sha(read(item['path'])) == item['sha256']
    for path, expected in browser['sourceHashes'].items():
        assert sha(read(path)) == expected
    report['sourceHashes'].update(browser['sourceHashes'])
    for path in ['scripts/check-eden-immersion-terrain-art.py',
                 'docs/research/eden-immersion-terrain-art-prompts.json',
                 'docs/research/eden-immersion-terrain-art.md',
                 'docs/screenshots/me1-enemy-poses-visible-geth-husk-aim.png']:
        report['sourceHashes'][path] = sha(read(path))
    report['captures'] = browser['captures']
    report['visualObservations'] = review['observations']
    report['limitations'] = review['limits'] + [
        'Requested1024x1024, delivered1254x1254; source size is retained unchanged.',
        'Only generated colour detail is supplied. Normal, roughness, height and canonical original-game material parameters are not reconstructed.',
        'Materials need final lighting, scale and whole-level review by the renderer workstream.']
    report['passed'] = True
except Exception as error:
    report['errors'].append(repr(error))
(ROOT / 'docs/qa/eden-immersion-terrain-art.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'passed': report['passed'], 'assets': len(report['assets']), 'captures': len(report.get('captures', [])), 'errors': report['errors']}))
if not report['passed']:
    raise SystemExit(1)
