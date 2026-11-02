"""Read-only PNG/frame checks; writes JSON evidence, never rewrites image pixels.

Run with Python, Pillow, NumPy and SciPy installed. Native images remain outside
the repository in --native-root (default /workspace/generated_images).
"""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

ROOT = Path(__file__).resolve().parents[1]
POSES = ["aim", "power", "hit", "down"]
SOURCE_FILES = {
    "geth": "exec-6091e2c4-0103-4a36-a1c1-469875b3737b.png",
    "husk": "exec-5d0a0678-75ca-435c-9519-0b354bcdaca6.png",
}
REVIEWED_NATIVE_SHA256 = {
    "geth": "a26b39193130e98031907f7b850f46b8591d74a6e5823af39ba860c76f58614c",
    "husk": "bcd2977ce016f3cff2b320e02fd5b342ca3ee44426d3d2c48d4885f1965e35ff",
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(key, native_root):
    png = ROOT / f"public/assets/enemy-{key}-combat.png"
    metadata = ROOT / f"public/assets/enemy-{key}-animation.json"
    prompt = ROOT / f"docs/research/me1-enemy-poses-{key}-prompts.json"
    native = native_root / SOURCE_FILES[key]
    config = json.loads(metadata.read_text())
    assert config["characterId"] == key and config["mediaId"] == "ME1"
    assert config["periodId"] == "me1" and config["status"] == "Prototype"
    assert config["combat"]["file"] == png.name
    assert list(config["combat"]["frames"]) == POSES
    assert digest(png) == digest(native), "Shipped PNG differs from native generation"
    assert digest(png) == REVIEWED_NATIVE_SHA256[key], "Native image needs a new human review"
    with Image.open(png) as im:
        assert im.mode == "RGBA" and im.size == (1536, 1024)
        assert (config["combat"]["width"], config["combat"]["height"]) == im.size
        alpha = np.asarray(im.getchannel("A"))
        info_keys = list(im.info)
    visible = alpha >= 51
    assert alpha.min() == 0 and alpha.max() >= 250
    coverage = np.zeros_like(alpha, dtype=np.uint8)
    frames = []
    for pose, frame in config["combat"]["frames"].items():
        assert frame["id"] == f"{key}-combat-{pose}" and frame["pose"] == pose
        x, y, w, h = frame["rect"]
        assert 0 <= x < x + w <= 1536 and 0 <= y < y + h <= 1024
        assert 0 <= frame["pivot"][0] <= w and 0 <= frame["pivot"][1] <= h
        assert 0.05 <= frame["heightScale"] <= 1.5
        coverage[y:y+h, x:x+w] += 1
        local = visible[y:y+h, x:x+w]
        ys, xs = np.where(local)
        assert len(xs) > 1000
        bounds = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
        margins = [bounds[0], bounds[1], w - bounds[2], h - bounds[3]]
        assert min(margins) > 0, f"Visible silhouette touches frame edge: {key}/{pose}"
        assert not local[0].any() and not local[-1].any()
        assert not local[:, 0].any() and not local[:, -1].any()
        frames.append({"pose": pose, "id": frame["id"], "rect": frame["rect"],
                       "pivot": frame["pivot"], "heightScale": frame["heightScale"],
                       "visiblePixels": int(local.sum()), "visibleBoundsInFrame": bounds,
                       "visibleMarginsLeftTopRightBottom": margins,
                       "visibleEdgePixels": 0})
    unassigned = int((visible & (coverage == 0)).sum())
    shared = int((visible & (coverage > 1)).sum())
    assert unassigned == 0 and shared == 0
    labels, _ = label(visible)
    components = []
    for i, bounds in enumerate(find_objects(labels), 1):
        if bounds is None:
            continue
        count = int((labels[bounds] == i).sum())
        if count >= 100:
            components.append({"pixels": count, "bounds": [bounds[1].start, bounds[0].start,
                                                            bounds[1].stop, bounds[0].stop]})
    assert len(components) == 4 and sum(c["pixels"] for c in components) == int(visible.sum())
    assert sum(f["visiblePixels"] for f in frames) == int(visible.sum())
    report = {
        "passed": True, "generatedAt": datetime.now(timezone.utc).isoformat(),
        "baselineCommit": "05d1f030dab0925d57d4ba8c5bdb9ccde8db1ad0",
        "command": "python scripts/check-me1-geth-husk-art.py",
        "scope": "Native art bytes, alpha and four measured frame bounds only; no renderer or original-game likeness certification.",
        "characterId": key, "mediaId": "ME1", "periodId": "me1", "status": "Prototype",
        "png": str(png.relative_to(ROOT)), "sha256": digest(png), "bytes": png.stat().st_size,
        "nativeSource": str(native), "nativeCopyVerified": True, "pixelEditingApplied": False,
        "dimensions": [1536, 1024], "mode": "RGBA", "pngInfoKeys": info_keys,
        "alphaMinimum": int(alpha.min()), "alphaMaximum": int(alpha.max()),
        "transparentPixels": int((alpha == 0).sum()),
        "nativeLowAlphaPixels": int(((alpha > 0) & (alpha < 51)).sum()),
        "visibleAlphaThreshold": 51, "visiblePixels": int(visible.sum()),
        "visiblePixelsUnassigned": unassigned, "visiblePixelsShared": shared,
        "components": components, "frames": frames,
        "actuallyOpened": True,
        "humanReview": {"method": "Native PNG opened using view_image at original resolution; source enemy atlas and named Prima page were also actually opened.",
                        "poses": POSES, "blockingFindings": [],
                        "observations": ["Four complete separate bodies are readable, including the horizontal prone pose.",
                                         "The generated layout is irregular; measured rectangles replace the requested regular grid.",
                                         "Low-opacity native fringes remain unchanged and are excluded only by the existing renderer alpha-test."],
                        "primaryOriginalGameFidelityCertified": False},
        "sourceHashes": {str(p.relative_to(ROOT)): digest(p) for p in [png, metadata, prompt,
                         ROOT / "public/assets/enemy-atlas.png", Path(__file__)]},
        "limitations": ["Four fixed drawings at one combat angle, not movement cycles or additional directions.",
                        "The rifle is inherited prototype artwork; exact original model geometry is not certified." if key == "geth"
                        else "The husk remains unarmed; its gesture grants no power. Exact original anatomy and cybernetic layout remain unverified.",
                        "Primary Prima figures are small named busts, not complete costume/body reference sheets.",
                        "No PNG pixels were cleaned or rewritten; native low-alpha fringes remain."]}
    destination = ROOT / f"docs/qa/me1-enemy-poses-{key}-art.json"
    destination.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    return {"key": key, "passed": True, "frames": 4, "sha256": digest(png),
            "visiblePixels": int(visible.sum()), "lowAlphaPixels": report["nativeLowAlphaPixels"]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--native-root", type=Path, default=ROOT.parent / "generated_images")
    args = parser.parse_args()
    print(json.dumps([check(key, args.native_root) for key in SOURCE_FILES]))
