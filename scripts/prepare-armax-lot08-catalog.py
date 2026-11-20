"""Prepare lot 08 from the frozen lot 07 without enlarging the register.

Reference images remain research files outside the repository. This script
records inspected references; it does not generate, integrate, or certify art.
Run the dedicated workbook builder after all lot 08 manifests are final.
"""
from copy import deepcopy
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DATE = "2026-11-20"
BASE = ROOT / "docs/armax/lot07/production-catalog.json"
DEST = ROOT / "docs/armax/lot08/production-catalog.json"
REFERENCE_FILE = ROOT / "docs/armax/lot08/reference-library.json"
catalog = json.loads(BASE.read_text())
identity_fields = ("category", "name", "work", "dlc", "variant")
base_identity_by_id = {e["id"]: {field: e[field] for field in identity_fields} for e in catalog["entries"]}
previous = json.loads(DEST.read_text()) if DEST.exists() else None
previous_by_id = {e["id"]: e for e in previous["entries"]} if previous else {}
references = json.loads(REFERENCE_FILE.read_text())["references"]

new_sources = {
    "jaemus_guardian": ("Jaemus Wurzbach — Cerberus Guardian, modèle de jeu ME3", "https://jwurzbach.artstation.com/projects/5WPZP", "primary_character_artist_portfolio", "full_page_and_selected_images_read"),
    "jaemus_nemesis": ("Jaemus Wurzbach — Cerberus Nemesis, modèle de jeu ME3", "https://jwurzbach.artstation.com/projects/QKgLZ", "primary_character_artist_portfolio", "full_page_and_selected_images_read"),
    "jaemus_assault_trooper": ("Jaemus Wurzbach — Cerberus Trooper, modèle de jeu ME3", "https://jwurzbach.artstation.com/projects/mAm01", "primary_character_artist_portfolio", "full_page_and_selected_images_read"),
    "jaemus_atlas": ("Jaemus Wurzbach — Cerberus Atlas, modèle de jeu ME3", "https://jwurzbach.artstation.com/projects/OvgXe", "primary_character_artist_portfolio", "full_page_and_selected_images_read"),
    "jaemus_mechs": ("Jaemus Wurzbach — LOKI et FENRIS, modèles de jeu ME2", "https://jwurzbach.artstation.com/projects/3EmmA", "primary_character_artist_portfolio", "full_page_and_selected_images_read"),
    "rion_me2": ("Rion Swanson — modèles et variantes ME2", "https://www.rion-art.com/mass-effect-2", "primary_character_artist_portfolio", "full_page_and_selected_images_read"),
    "mordin_loyalty_guide": ("RPGuides — Mordin ME2 et déblocage de la tenue alternative", "https://www.rpguides.de/mass-effect-2/nicht-spieler-charaktere/squad-mordin-solus.htm", "secondary_game_guide", "full_page_read"),
    "neil_mars_archives": ("Neil McKnight — Mars, environnement de Mass Effect 3", "https://neilmcknight.artstation.com/projects/2L9gg", "primary_environment_artist_portfolio", "full_page_read; selected_reference_images_inspected_by_stage_producer"),
    "neil_pragia_facility": ("Neil McKnight — Pragia, environnement de Mass Effect 2", "https://neilmcknight.artstation.com/projects/egloX", "primary_environment_artist_portfolio", "full_page_read; selected_reference_images_inspected_by_stage_producer"),
    "paul_kadara_market": ("Paul Haskins — Kadara Market, Mass Effect Andromeda", "https://phaskins.artstation.com/projects/YEOwq", "primary_environment_artist_portfolio", "full_page_read; selected_reference_images_inspected_by_stage_producer"),
    "jonathon_eos_vault": ("Jonathon Banks — caveau reliquat, Mass Effect Andromeda", "https://jbbanks.artstation.com/projects/l2LJz", "primary_environment_artist_portfolio", "full_page_read; selected_reference_images_inspected_by_stage_producer"),
}
for key, (title, url, kind, retrieval) in new_sources.items():
    catalog["sources"][key] = {"title": title, "url": url, "sourceType": kind,
                                "retrievalStatus": retrieval, "checkedOn": DATE}
mapping = {
    "chr_me3_guardian": ["jaemus_guardian"],
    "chr_me3_nemesis": ["jaemus_nemesis"],
    "chr_me3_assault_trooper": ["jaemus_assault_trooper"],
    "chr_me3_atlas": ["jaemus_atlas"],
    "chr_me2_loki_mech": ["jaemus_mechs"],
    "chr_me2_fenris_mech": ["jaemus_mechs"],
    "cst_me2_mordin_loyalty": ["rion_me2", "squad2", "mordin_loyalty_guide"],
    "cst_me2_kasumi_loyalty": ["rion_me2", "squad2"],
}
for entry in catalog["entries"]:
    if entry["id"] in previous_by_id:
        entry.update(deepcopy(previous_by_id[entry["id"]]))
    entry.update(base_identity_by_id[entry["id"]])
    entry.setdefault("pngCountLot08", 0)
    if entry["id"] not in mapping:
        continue
    entry["sourceIds"] = list(dict.fromkeys(entry["sourceIds"] + mapping[entry["id"]]))
    relevant = [r for r in references if entry["id"] in r.get("catalogIds", [])]
    entry["sourceUrls"] = list(dict.fromkeys(entry["sourceUrls"] + [catalog["sources"][k]["url"] for k in mapping[entry["id"]]] + [r["directImageUrl"] for r in relevant]))
    entry["referenceReadiness"] = "planches_primaires_corps_entier_consultees; comparaison_de_production_restante"
    entry["referenceEvidence"] = [{"referenceId": r["id"], "sourcePage": r["sourcePage"], "directImageUrl": r["directImageUrl"], "sha256": r["sha256"], "inspectedOn": r["inspectedOn"], "reviewNotes": r["reviewNotes"]} for r in relevant]
    if entry["id"] in {"cst_me2_mordin_loyalty", "cst_me2_kasumi_loyalty"}:
        entry["referenceIdentification"] = "Recoupement : variante ME2 publiée par son artiste, identifiée comme tenue de loyauté grâce à l'index Default/Loyalty des équipiers. Ce recoupement ne certifie pas la fidélité du prototype."
        entry["productionNote"] = "Planche de la variante ME2 consultée en corps entier. Identité de tenue recoupée avec l'index des équipiers ; ne pas assimiler cette tenue de loyauté à un pack AAP. Comparer les détails et le modèle du jeu avant validation 1:1."

stage_updates = {
    "stg_me3_mars_archives": {
        "sourceId": "neil_mars_archives", "producedSubzone": "Galerie intérieure des archives",
        "productionNote": "Galerie intérieure de Mars choisie à partir de la capture de Neil McKnight. L'escalier et la fosse du premier plan ne sont pas repris : le sol est nivelé et prolongé pour le duel. Vue plus frontale, profondeur et raccords des panneaux redessinés ; géométrie et échelle des combattants restent à valider en moteur.",
    },
    "stg_me2_pragia_facility": {
        "sourceId": "neil_pragia_facility", "producedSubzone": "Salle du centre de recherche envahie de végétation",
        "productionNote": "Salle envahie de végétation du centre de recherche de Jack choisie sur la capture de Neil McKnight. Premier plan élargi, sol recomposé et grosses racines reportées derrière la bande de duel. Canopée, panneaux et volumes des boîtiers sont redessinés ; implantation exacte non validée, lumière et végétation figées dans un seul master.",
    },
    "stg_mea_kadara_market": {
        "sourceId": "paul_kadara_market", "producedSubzone": "Zone du marché sous la bâche bleue",
        "productionNote": "Zone du marché de Kadara choisie sur la vue Kadara Market de Paul Haskins, distincte des bas-fonds et du QG des Exilés. Sol étendu vers l'avant, accessoires déplacés sur les bords et habitants retirés pour le duel. Glyphes, bâche, façades et câbles sont redessinés ; reflets, vapeur et néons restent figés et ne constituent pas une reproduction exacte.",
    },
    "stg_mea_eos_vault": {
        "sourceId": "jonathon_eos_vault", "producedSubzone": "Salle du cœur avec faisceau",
        "productionNote": "Salle du cœur du caveau d'Eos représentée avec son faisceau et son ferrofluide, d'après deux vues de Jonathon Banks ; aucun état précis de la mission n'est certifié. Caméra et bande rectiligne de combat reconstruites, dont le tracé exact n'est pas établi par les captures. Lamelles, circuits et proportions du récepteur redessinés ; perspective des sprites à tester en moteur, sans calques séparés ni cycle de réactivation livré.",
    },
}
for entry in catalog["entries"]:
    if entry["id"] not in stage_updates:
        continue
    update = stage_updates[entry["id"]]
    entry["producedSubzone"] = update["producedSubzone"]
    entry["productionNote"] = update["productionNote"]
    entry["sourceIds"] = list(dict.fromkeys(entry["sourceIds"] + [update["sourceId"]]))
    entry["sourceUrls"] = list(dict.fromkeys(entry["sourceUrls"] + [catalog["sources"][update["sourceId"]]["url"]]))

catalog.update({
    "catalogId": "armax-current-lot08-20261120", "revisionLot": "lot08", "updatedOn": DATE,
    "parentCatalog": "docs/armax/lot07/production-catalog.json",
    "parentCatalogSha256": hashlib.sha256(BASE.read_bytes()).hexdigest(),
    "baseCommit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
    "carriedForwardEntries": len(catalog["entries"]), "addedEntries": 0,
    "scope": "Lot 08 : réduction des 151 fiches sans image du lot 07, à périmètre constant de 164 fiches. Les originaux historiques et les sprites RPG gardent leurs périmètres distincts.",
    "researchReferenceFile": "docs/armax/lot08/reference-library.json",
})
catalog["totalEntries"] = len(catalog["entries"])
catalog["counts"] = dict(Counter(e["category"] for e in catalog["entries"]))
catalog["baselineCounts"] = {"total": 164, "withImage": 13, "withoutImage": 151}
catalog["currentCounts"] = {
    "total": len(catalog["entries"]),
    "withImage": sum(bool(e["assetFiles"]) for e in catalog["entries"]),
    "withoutImage": sum(not e["assetFiles"] for e in catalog["entries"]),
    "certified1to1": sum(bool(e["fidelity1to1Validated"]) for e in catalog["entries"]),
    "newIllustratedSubjects": sum(e.get("imageLot") == "lot08" for e in catalog["entries"]),
    "newPngFiles": sum(e.get("pngCountLot08", 0) for e in catalog["entries"]),
    "blockedSubjects": sum(e.get("latestGenerationAttempt") == "blocked" for e in catalog["entries"]),
}
catalog["policy"]["missingDefinition"] = "Variante sans fichier dans le catalogue Armax courant ; la présence des fichiers historiques est vérifiée par l'arbre Git, même sans copie locale du blob."
catalog["policy"]["automaticRetryExcludedIds"] = sorted(set(
    catalog["policy"]["automaticRetryExcludedIds"]
    + (previous or {}).get("policy", {}).get("automaticRetryExcludedIds", [])
    + [e["id"] for e in catalog["entries"] if e.get("latestGenerationAttempt") == "blocked"]
))
assert len(catalog["entries"]) == 164
assert len({e["id"] for e in catalog["entries"]}) == 164
DEST.parent.mkdir(parents=True, exist_ok=True)
DEST.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"catalog": str(DEST), "entries": 164, "newEntries": 0,
                  "referencesImproved": len(mapping) + len(stage_updates), "sources": len(catalog["sources"])}))
