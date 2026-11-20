"""Prepare lot 09 from the frozen lot 08, preserving every subject identity.

Inspected references are metadata, not proof of exact visual fidelity. Image
files and generation outcomes are incorporated by the dedicated workbook
builder only after the lot manifests are available.
"""
from collections import Counter
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DATE = "2026-11-20"
BASE = ROOT / "docs/armax/lot08/production-catalog.json"
DEST = ROOT / "docs/armax/lot09/production-catalog.json"
REFERENCE_FILE = ROOT / "docs/armax/lot09/reference-library.json"
IDENTITY_FIELDS = ("category", "name", "work", "dlc", "variant")
ALLOWED_REFERENCE_UPDATES = {
    "productionNote", "producedSubzone", "referenceReadiness",
    "referenceIdentification", "referenceGap", "sourceIds",
}

baseline = json.loads(BASE.read_text())
catalog = deepcopy(baseline)
identity_by_id = {
    entry["id"]: {field: entry[field] for field in IDENTITY_FIELDS}
    for entry in baseline["entries"]
}
previous = json.loads(DEST.read_text()) if DEST.exists() else None
previous_by_id = {e["id"]: e for e in previous["entries"]} if previous else {}
library = json.loads(REFERENCE_FILE.read_text())
references = library["references"]
updates = library.get("catalogUpdates", {})

assert not (set(updates) - set(identity_by_id)), "Unknown subject in reference updates"
for entry_id, update in updates.items():
    assert not (set(update) - ALLOWED_REFERENCE_UPDATES), (entry_id, set(update))
for reference in references:
    assert not (set(reference.get("catalogIds", [])) - set(identity_by_id)), reference["id"]

catalog["sources"].update(deepcopy(library.get("sourceDefinitions", {})))
for entry in catalog["entries"]:
    if entry["id"] in previous_by_id:
        entry.update(deepcopy(previous_by_id[entry["id"]]))
    # Even an intermediate lot 09 catalog cannot change a subject's identity.
    entry.update(identity_by_id[entry["id"]])
    entry.setdefault("pngCountLot09", 0)
    update = deepcopy(updates.get(entry["id"], {}))
    extra_source_ids = update.pop("sourceIds", [])
    entry.update(update)
    relevant = [r for r in references if entry["id"] in r.get("catalogIds", [])]
    extra_source_ids += [key for r in relevant for key in r.get("sourceIds", [])]
    entry["sourceIds"] = list(dict.fromkeys(entry["sourceIds"] + extra_source_ids))
    assert all(key in catalog["sources"] for key in entry["sourceIds"]), entry["id"]
    entry["sourceUrls"] = list(dict.fromkeys(
        entry["sourceUrls"]
        + [catalog["sources"][key]["url"] for key in entry["sourceIds"]]
        + [r["directImageUrl"] for r in relevant]
    ))
    prior_evidence = {e["referenceId"]: e for e in entry.get("referenceEvidence", [])}
    for ref in relevant:
        prior_evidence[ref["id"]] = {
            "referenceId": ref["id"], "sourcePage": ref["sourcePage"],
            "directImageUrl": ref["directImageUrl"], "sha256": ref["sha256"],
            "inspectedOn": ref["inspectedOn"], "reviewNotes": ref["reviewNotes"],
            "selectedForGeneration": ref["selectedForGeneration"],
        }
    if prior_evidence:
        entry["referenceEvidence"] = list(prior_evidence.values())

catalog.update({
    "catalogId": "armax-current-lot09-20261120", "revisionLot": "lot09",
    "updatedOn": DATE, "parentCatalog": "docs/armax/lot08/production-catalog.json",
    "parentCatalogSha256": hashlib.sha256(BASE.read_bytes()).hexdigest(),
    "baseCommit": subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip(),
    "carriedForwardEntries": len(catalog["entries"]), "addedEntries": 0,
    "scope": "Lot 09 : réduction des 141 fiches sans image du lot 08, à périmètre constant de 164 fiches. Les originaux historiques et les sprites RPG gardent leurs périmètres distincts.",
    "researchReferenceFile": "docs/armax/lot09/reference-library.json",
})
catalog["totalEntries"] = len(catalog["entries"])
catalog["counts"] = dict(Counter(e["category"] for e in catalog["entries"]))
catalog["baselineCounts"] = {
    "total": len(baseline["entries"]),
    "withImage": sum(bool(e["assetFiles"]) for e in baseline["entries"]),
    "withoutImage": sum(not e["assetFiles"] for e in baseline["entries"]),
}
catalog["currentCounts"] = {
    "total": len(catalog["entries"]),
    "withImage": sum(bool(e["assetFiles"]) for e in catalog["entries"]),
    "withoutImage": sum(not e["assetFiles"] for e in catalog["entries"]),
    "certified1to1": sum(bool(e["fidelity1to1Validated"]) for e in catalog["entries"]),
    "newIllustratedSubjects": sum(e.get("imageLot") == "lot09" for e in catalog["entries"]),
    "newPngFiles": sum(e.get("pngCountLot09", 0) for e in catalog["entries"]),
    "blockedSubjects": sum(e.get("latestGenerationAttempt") == "blocked" for e in catalog["entries"]),
}
catalog["policy"]["automaticRetryExcludedIds"] = sorted(set(
    catalog["policy"]["automaticRetryExcludedIds"]
    + (previous or {}).get("policy", {}).get("automaticRetryExcludedIds", [])
    + [e["id"] for e in catalog["entries"] if e.get("latestGenerationAttempt") == "blocked"]
))
assert len(catalog["entries"]) == 164
assert len({e["id"] for e in catalog["entries"]}) == 164
assert all(
    {field: entry[field] for field in IDENTITY_FIELDS} == identity_by_id[entry["id"]]
    for entry in catalog["entries"]
)
DEST.parent.mkdir(parents=True, exist_ok=True)
DEST.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"catalog": str(DEST), "entries": 164, "newEntries": 0,
                  "referenceUpdates": len(updates), "sources": len(catalog["sources"]),
                  "identityFieldsUnchanged": len(catalog["entries"]) * len(IDENTITY_FIELDS)}))
