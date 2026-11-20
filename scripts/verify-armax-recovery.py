#!/usr/bin/env python3
"""Check recovered originals; no artistic or gameplay certification is implied."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    inventory = json.loads((ROOT/'docs/armax/recovery-20261120/asset-inventory.json').read_text())
    ids, paths, hashes, proofs = set(), set(), set(), set()
    assets_with_proof = 0
    for asset in inventory['assets']:
        assert asset['id'] not in ids, asset['id']
        assert asset['path'] not in paths, asset['path']
        proof = asset.get('historicalProof')
        if proof is not None:
            assert isinstance(proof, str) and proof, asset['id']
            assert (ROOT/proof).is_file(), f"Missing historicalProof for {asset['id']}: {proof}"
            proofs.add(proof)
            assets_with_proof += 1
        p = ROOT/asset['path']
        expected = asset['technical']
        data = p.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        assert digest == expected['sha256'], p
        assert digest not in hashes, p
        assert len(data) == expected['sizeBytes'], p
        with Image.open(p) as image:
            assert image.format == 'PNG', p
            assert [image.width, image.height] == [expected['width'], expected['height']], p
            assert image.mode == expected['mode'], p
            image.verify()
        assert asset['fidelityValidated'] is False, asset['id']
        assert asset['engineIntegrated'] is False, asset['id']
        assert asset['newGenerationThisSession'] is False, asset['id']
        ids.add(asset['id']); paths.add(asset['path']); hashes.add(digest)
    assert len(ids) == inventory['summary']['originalPngs'] == 86
    report = {
        'status': 'passed', 'originalPngs': len(ids),
        'uniqueSha256': len(hashes), 'dimensionsAndPngDecode': 'passed',
        'historicalProofPaths': 'passed', 'uniqueHistoricalProofFiles': len(proofs),
        'assetsWithHistoricalProof': assets_with_proof,
        'assetsWithoutHistoricalProof': len(ids) - assets_with_proof,
        'assetsWithUnrecoveredProofReference': sum(bool(a.get('historicalProofRecovery')) for a in inventory['assets']),
        'historicalZip': 'excluded_as_redundant; all original PNGs verified unpacked',
        'scope': 'Recovered local originals only; new lot06 assets checked separately',
        'artisticFidelityCertified': False, 'engineTest': False,
    }
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
