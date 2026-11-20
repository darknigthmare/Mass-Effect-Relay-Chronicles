#!/usr/bin/env python3
"""Read-only QA for the combat 2D production manifest and its Markdown links.

Run from any directory with Python and Pillow installed. Relative --manifest
paths are resolved from the repository root. --report is optional and must
point outside the repository; no report or image is written automatically.

technical.alpha means effective transparency: alpha min < 255 and max > 0.
technical.bbox is the exclusive PIL bounding box of pixels with alpha > 128.
Validated fidelity claims require fidelityEvidence.report, a nonempty file
inside the repository. Its existence is checked, not its artistic conclusion.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys
import unicodedata
from urllib.parse import unquote, urlsplit

from PIL import Image, UnidentifiedImageError


REPO = Path(__file__).resolve().parents[1]
STATUSES = {"Défini", "Prototype", "Intégré", "Validé"}
STAGE_KINDS = {"stage-layer", "stage-reference"}
PNG_MODES = {"1", "L", "LA", "P", "RGB", "RGBA", "I", "I;16"}


def inside_repo(path: Path) -> bool:
    return path.resolve().is_relative_to(REPO)


def repo_file(value: object) -> Path:
    """Accept portable repository-relative paths without traversal or escape."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Expected a nonempty repository-relative path")
    if "\\" in value or "\x00" in value:
        raise ValueError("Backslashes and NUL are not allowed in source paths")
    posix = PurePosixPath(value)
    if posix.is_absolute() or ".." in posix.parts or ":" in value:
        raise ValueError("Absolute paths and parent traversal are not allowed")
    path = (REPO / value).resolve()
    if not inside_repo(path):
        raise ValueError("Resolved source path escapes the repository")
    return path


def valid_source_url(value: object) -> bool:
    if not isinstance(value, str) or not value or value != value.strip():
        return False
    try:
        parsed = urlsplit(value)
        return (
            parsed.scheme in {"http", "https"}
            and bool(parsed.hostname)
            and not parsed.username
            and not parsed.password
            and not any(c.isspace() for c in value)
            and ".." not in PurePosixPath(unquote(parsed.path)).parts
        )
    except ValueError:
        return False


def fidelity_claims_validation(value: str) -> bool:
    normalized = "".join(
        c for c in unicodedata.normalize("NFKD", value.casefold())
        if not unicodedata.combining(c)
    )
    words = set(re.findall(r"[a-z]+", normalized))
    negatives = {"non", "not", "unverified", "unvalidated", "uncertified", "pending"}
    if words & negatives or "a verifier" in normalized or "a valider" in normalized:
        return False
    claims = {"valide", "validated", "verifie", "verified", "certifie", "certified", "approved"}
    return bool(words & claims) or normalized.strip() == "1:1"


def edge_counts(alpha: Image.Image) -> tuple[int, int]:
    """Count each perimeter pixel once, both any alpha and strong alpha."""
    width, height = alpha.size
    if width == 1 or height == 1:
        histograms = [alpha.histogram()]
    else:
        regions = [(0, 0, width, 1), (0, height - 1, width, height)]
        if height > 2:
            regions.extend([(0, 1, 1, height - 1), (width - 1, 1, width, height - 1)])
        histograms = [alpha.crop(region).histogram() for region in regions]
    return (
        sum(sum(hist[1:]) for hist in histograms),
        sum(sum(hist[129:]) for hist in histograms),
    )


def markdown_targets(text: str) -> list[str]:
    """Read inline and reference links, excluding fenced/inline code examples."""
    lines, fence = [], None
    for line in text.splitlines():
        marker = re.match(r"^\s{0,3}(`{3,}|~{3,})", line)
        if marker:
            run = marker.group(1)
            if fence is None:
                fence = run
            elif run[0] == fence[0] and len(run) >= len(fence):
                fence = None
            continue
        if fence is None:
            lines.append(line)
    plain = re.sub(r"(`+).*?\1", "", "\n".join(lines))
    inline = re.findall(r"!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)", plain)
    reference = re.findall(r"(?m)^\s{0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)", plain)
    return [target.strip("<>") for target in inline + reference]


def verify(manifest_path: Path) -> dict:
    errors, warnings, asset_results = [], [], []
    counts = {
        "assets": 0, "backlog": 0, "pngChecked": 0,
        "markdownFiles": 0, "localMarkdownLinks": 0,
    }

    def issue(collection: list, scope: str, message: str) -> None:
        collection.append({"scope": scope, "message": message})

    def check_identity(record: dict, scope: str, seen: dict) -> None:
        ident = record.get("id")
        if not isinstance(ident, str) or not ident.strip() or ident != ident.strip():
            issue(errors, scope, "id must be a nonempty trimmed string")
        elif ident in seen:
            issue(errors, scope, f"Duplicate id {ident!r}; first seen in {seen[ident]}")
        else:
            seen[ident] = scope
        if not isinstance(record.get("status"), str) or record["status"] not in STATUSES:
            issue(errors, scope, "status must be Défini, Prototype, Intégré or Validé")

    def check_fidelity(record: dict, scope: str, required: bool = False) -> None:
        fidelity = record.get("fidelityStatus")
        if fidelity is None and not required:
            return
        if not isinstance(fidelity, str) or not fidelity.strip():
            issue(errors, scope, "fidelityStatus must be a nonempty string")
            return
        if not fidelity_claims_validation(fidelity):
            return
        proof = record.get("fidelityEvidence")
        try:
            if not isinstance(proof, dict):
                raise ValueError("Missing fidelityEvidence object")
            proof_path = repo_file(proof.get("report"))
            if not proof_path.is_file() or proof_path.stat().st_size == 0:
                raise ValueError("Fidelity comparison report is absent or empty")
            issue(warnings, scope, "Fidelity evidence file exists; its artistic conclusion is not certified by this script")
        except (ValueError, OSError) as exc:
            issue(errors, scope, f"Validated fidelity claim has no usable evidence: {exc}")

    manifest_hash = None
    try:
        raw = manifest_path.read_bytes()
        manifest_hash = hashlib.sha256(raw).hexdigest()
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("Manifest root must be an object")
    except (OSError, ValueError, UnicodeError) as exc:
        issue(errors, "manifest", f"Cannot read manifest: {exc}")
        data = {}

    seen_ids, seen_files = {}, {}
    asset_statuses, backlog_statuses, kinds = Counter(), Counter(), Counter()
    for section in ("assets", "backlog"):
        records = data.get(section)
        if not isinstance(records, list):
            issue(errors, section, "Expected an array")
            continue
        counts[section] = len(records)
        for index, record in enumerate(records):
            scope = f"{section}[{index}]"
            if not isinstance(record, dict):
                issue(errors, scope, "Expected an object")
                continue
            check_identity(record, scope, seen_ids)
            check_fidelity(record, scope, required=section == "assets")
            statuses = asset_statuses if section == "assets" else backlog_statuses
            statuses[str(record.get("status"))] += 1
            if section == "backlog":
                continue

            kind = record.get("kind")
            if not isinstance(kind, str) or not kind.strip():
                issue(errors, scope, "kind must be a nonempty string")
                kind = "invalid"
            kinds[str(kind)] += 1
            urls = record.get("sourceUrls")
            if not isinstance(urls, list) or not urls:
                issue(errors, scope, "sourceUrls must contain at least one HTTP(S) URL")
            elif any(not valid_source_url(url) for url in urls):
                issue(errors, scope, "sourceUrls contains an invalid URL or parent traversal")
            technical = record.get("technical")
            if not isinstance(technical, dict):
                issue(errors, scope, "technical must be an object")
                technical = {}
            try:
                path = repo_file(record.get("file"))
                if path in seen_files:
                    issue(errors, scope, f"Duplicate asset file; first seen in {seen_files[path]}")
                else:
                    seen_files[path] = scope
                if path.suffix.lower() != ".png" or not path.is_file():
                    raise ValueError("Expected an existing PNG file")
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
                with Image.open(path) as picture:
                    if picture.format != "PNG":
                        raise ValueError("Image content is not PNG")
                    picture.load()
                    mode, (width, height) = picture.mode, picture.size
                    if mode not in PNG_MODES:
                        issue(errors, scope, f"Unsupported PNG mode: {mode}")
                    alpha = picture.convert("RGBA").getchannel("A")
                    alpha_min, alpha_max = alpha.getextrema()
                    transparent = alpha_min < 255 and alpha_max > 0
                    # Temporary in-memory measurement mask; source pixels are never saved.
                    bbox = alpha.point(lambda value: 255 if value > 128 else 0).getbbox()
                    bbox = list(bbox) if bbox is not None else None
                    edge_any, edge_strong = edge_counts(alpha)
                    if getattr(picture, "n_frames", 1) > 1:
                        issue(warnings, scope, "Animated PNG: metrics describe the first frame only")
                counts["pngChecked"] += 1
                if alpha_max == 0:
                    issue(errors, scope, "Image is fully transparent")
                for name, actual in (("width", width), ("height", height)):
                    expected = technical.get(name)
                    if type(expected) is not int or expected <= 0 or expected != actual:
                        issue(errors, scope, f"technical.{name} mismatch: declared {expected!r}, actual {actual}")
                if technical.get("mode") != mode:
                    issue(errors, scope, f"technical.mode mismatch: declared {technical.get('mode')!r}, actual {mode}")
                expected_hash = technical.get("sha256")
                if not isinstance(expected_hash, str) or not re.fullmatch(r"[0-9a-f]{64}", expected_hash) or expected_hash != digest:
                    issue(errors, scope, "technical.sha256 does not match the file SHA-256")
                if type(technical.get("alpha")) is not bool or technical["alpha"] != transparent:
                    issue(errors, scope, f"technical.alpha mismatch: actual {transparent}")
                if transparent or technical.get("bbox") is not None:
                    expected_bbox = technical.get("bbox")
                    valid_bbox = (
                        isinstance(expected_bbox, list) and len(expected_bbox) == 4
                        and all(type(v) is int for v in expected_bbox)
                    )
                    if not valid_bbox or expected_bbox != bbox:
                        issue(errors, scope, f"technical.bbox mismatch at alpha >128: declared {expected_bbox!r}, actual {bbox!r}")
                if transparent and edge_any:
                    issue(warnings, scope, f"{edge_any} perimeter pixels have nonzero alpha; {edge_strong} exceed 128")
                if edge_strong:
                    if kind == "sprite":
                        issue(errors, scope, "Sprite has alpha >128 on its edge; at least one clear pixel of margin is required")
                    elif kind not in STAGE_KINDS:
                        issue(warnings, scope, "Alpha >128 reaches the edge; check the intended framing")
                    elif transparent:
                        issue(warnings, scope, "Stage layer reaches the edge; intentional stage coverage is allowed")
                asset_results.append({
                    "id": record.get("id"), "file": record.get("file"), "kind": kind,
                    "mode": mode, "width": width, "height": height,
                    "alpha": transparent, "alphaMin": alpha_min, "alphaMax": alpha_max,
                    "bbox": bbox, "sha256": digest,
                    "edgeAlphaNonzero": edge_any, "edgeAlphaAbove128": edge_strong,
                })
            except (OSError, ValueError, UnidentifiedImageError, Image.DecompressionBombError) as exc:
                issue(errors, scope, f"Cannot verify asset: {exc}")

    for markdown in sorted((REPO / "docs/combat-2d").rglob("*.md")):
        scope = markdown.relative_to(REPO).as_posix()
        counts["markdownFiles"] += 1
        try:
            if not inside_repo(markdown):
                raise ValueError("Markdown source resolves outside the repository")
            for target in markdown_targets(markdown.read_text(encoding="utf-8")):
                parsed = urlsplit(target)
                if parsed.scheme or parsed.netloc or not parsed.path:
                    continue
                counts["localMarkdownLinks"] += 1
                decoded = unquote(parsed.path)
                linked = (markdown.parent / decoded).resolve()
                if "\\" in decoded or not inside_repo(linked):
                    issue(errors, scope, f"Local link escapes the repository: {target}")
                elif not linked.exists():
                    issue(errors, scope, f"Missing local link target: {target}")
        except (OSError, ValueError, UnicodeError) as exc:
            issue(errors, scope, f"Cannot verify Markdown links: {exc}")

    counts.update({
        "assetStatuses": dict(sorted(asset_statuses.items())),
        "backlogStatuses": dict(sorted(backlog_statuses.items())),
        "assetKinds": dict(sorted(kinds.items())),
        "warnings": len(warnings), "errors": len(errors),
    })
    return {
        "schemaVersion": 1,
        "checkedAtUtc": datetime.now(timezone.utc).isoformat(),
        "manifest": manifest_path.relative_to(REPO).as_posix(),
        "manifestSha256": manifest_hash,
        "passed": not errors,
        "scope": "File integrity, manifest consistency and local Markdown targets; no artistic or gameplay certification",
        "counts": counts, "assets": asset_results, "warnings": warnings, "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default="docs/combat-2d/production.json")
    parser.add_argument("--report", help="Optional JSON report outside the repository")
    args = parser.parse_args()
    manifest = Path(args.manifest)
    if not manifest.is_absolute():
        try:
            manifest = repo_file(args.manifest)
        except ValueError as exc:
            parser.error(str(exc))
    manifest = manifest.resolve()
    if not inside_repo(manifest):
        parser.error("Manifest must be inside the repository")
    report = Path(args.report).resolve() if args.report else None
    if report is not None and inside_repo(report):
        parser.error("--report must be outside the repository; use a scratch destination")
    result = verify(manifest)
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if report is not None:
        try:
            report.parent.mkdir(parents=True, exist_ok=True)
            report.write_text(rendered, encoding="utf-8")
        except OSError as exc:
            print(f"Cannot write scratch report: {exc}", file=sys.stderr)
            return 2
    print(rendered, end="")
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
