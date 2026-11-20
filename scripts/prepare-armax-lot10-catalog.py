"""Prepare lot 10 from the frozen lot 09, preserving every subject identity.

Inspected references are metadata, not proof of exact visual fidelity. Image
files and generation outcomes are incorporated by the dedicated workbook
builder only after the lot manifests are available.
"""
from collections import Counter
from copy import deepcopy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATE = "2026-11-20"
BASE = ROOT / "docs/armax/lot09/production-catalog.json"
DEST = ROOT / "docs/armax/lot10/production-catalog.json"
REFERENCE_FILE = ROOT / "docs/armax/lot10/reference-library.json"
REFERENCE_PARTS = (
    "fighters-reference-library.json",
    "costumes-reference-library.json",
    "stages-reference-library.json",
)
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
library = {
    "schemaVersion": 2, "date": DATE,
    "baseCommit": "9321b4f77d8f857d8c40265c0fca70e03121a4ea",
    "scope": "Lot 10 : références des sujets existants, sans extension des 164 identités. Une référence sélectionnée ne prouve ni génération réussie ni fidélité 1:1.",
    "fidelityCertified": False,
    "referenceHandling": "Images tierces conservées hors dépôt ; URLs, empreintes et limites dans le registre. Les fichiers générés restent Prototype.",
    "sourceDefinitions": {}, "catalogUpdates": {}, "references": [],
    "sourceParts": [], "excludedResearch": [],
}
reference_ids = set()
for name in REFERENCE_PARTS:
    part_path = REFERENCE_FILE.parent / name
    if not part_path.exists():
        continue
    part = json.loads(part_path.read_text())
    assert part.get("fidelityCertified") is False, name
    library["sourceParts"].append({
        "path": str(part_path.relative_to(ROOT)),
        "sha256": hashlib.sha256(part_path.read_bytes()).hexdigest(),
    })
    library["excludedResearch"].extend(deepcopy(part.get("excludedResearch", [])))
    for source_id, source in part.get("sourceDefinitions", {}).items():
        existing = library["sourceDefinitions"].get(source_id)
        assert not existing or existing["url"] == source["url"], source_id
        library["sourceDefinitions"][source_id] = source
    for entry_id, update in part.get("catalogUpdates", {}).items():
        assert entry_id not in library["catalogUpdates"], entry_id
        library["catalogUpdates"][entry_id] = update
    for reference in part.get("references", []):
        assert reference["id"] not in reference_ids, reference["id"]
        reference_ids.add(reference["id"])
        library["references"].append(reference)
assert library["sourceParts"], "No inspected reference library part found"
REFERENCE_FILE.parent.mkdir(parents=True, exist_ok=True)
REFERENCE_FILE.write_text(json.dumps(library, ensure_ascii=False, indent=2) + "\n")
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
    # Even an intermediate lot 10 catalog cannot change a subject's identity.
    entry.update(identity_by_id[entry["id"]])
    entry.setdefault("pngCountLot10", 0)
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
    "catalogId": "armax-current-lot10-20261120", "revisionLot": "lot10",
    "updatedOn": DATE, "parentCatalog": "docs/armax/lot09/production-catalog.json",
    "parentCatalogSha256": hashlib.sha256(BASE.read_bytes()).hexdigest(),
    "baseCommit": "9321b4f77d8f857d8c40265c0fca70e03121a4ea",
    "carriedForwardEntries": len(catalog["entries"]), "addedEntries": 0,
    "scope": "Lot 10 : réduction des 129 fiches sans image du lot 09, à périmètre constant de 164 fiches. Les originaux historiques et les sprites RPG gardent leurs périmètres distincts.",
    "researchReferenceFile": "docs/armax/lot10/reference-library.json",
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
    "newIllustratedSubjects": sum(e.get("imageLot") == "lot10" for e in catalog["entries"]),
    "newPngFiles": sum(e.get("pngCountLot10", 0) for e in catalog["entries"]),
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
notes = [
    "# Références inspectées — lot 10", "",
    "État au 20 novembre 2026. Le [registre complet](reference-library.json) contient les URLs directes, dimensions, empreintes SHA-256 et décisions de sélection. Les fichiers de référence tierces restent hors dépôt.", "",
    "Une référence sélectionnée sert à guider un essai. Elle ne prouve ni qu’un fichier a été produit, ni qu’une reproduction est fidèle 1:1. Les fichiers effectivement obtenus et leurs révisions sont suivis séparément dans les manifestes et le [catalogue courant](production-catalog.json).", "",
    f"La recherche documentée concerne **{len(updates)} identités existantes** et **{len(references)} images inspectées**, dont **{sum(bool(ref['selectedForGeneration']) for ref in references)} références retenues pour guidage**. Aucun sujet n’est ajouté aux 164 fiches héritées.", "",
]
for entry in catalog["entries"]:
    if entry["id"] not in updates:
        continue
    relevant = [ref for ref in references if entry["id"] in ref.get("catalogIds", [])]
    notes.extend([
        f"## {entry['name']} — {entry['work']}", "",
        f"Identifiant : `{entry['id']}`. Variante conservée : **{entry['variant']}**.", "",
        updates[entry["id"]].get("productionNote", entry.get("productionNote", "")), "",
    ])
    if updates[entry["id"]].get("referenceGap"):
        notes.extend(["Référence encore insuffisante : " + updates[entry["id"]]["referenceGap"], ""])
    for ref in relevant:
        state = "Retenue pour guidage" if ref["selectedForGeneration"] else "Documentée, non retenue pour guidage"
        notes.append(f"- **{state} : `{ref['filename']}`** ({ref['width']} × {ref['height']}). [Source]({ref['sourcePage']}). {ref.get('referenceScope', '')} {' '.join(ref['reviewNotes'])}")
    notes.append("")
if library["excludedResearch"]:
    notes.extend(["## Autres pistes écartées", ""])
    for research in library["excludedResearch"]:
        notes.append(f"- [Source examinée]({research['sourcePage']}) : {research['reason']}")
    notes.append("")
(DEST.parent / "REFERENCE_NOTES.md").write_text("\n".join(notes))
print(json.dumps({"catalog": str(DEST), "entries": 164, "newEntries": 0,
                  "referenceUpdates": len(updates), "sources": len(catalog["sources"]),
                  "identityFieldsUnchanged": len(catalog["entries"]) * len(IDENTITY_FIELDS)}))
