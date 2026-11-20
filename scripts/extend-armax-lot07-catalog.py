"""Extend the Armax register without rewriting the historical lot 06.

Research was checked on 2026-11-20. This script defines production work; it
does not generate images, integrate gameplay, or certify canonical fidelity.
Existing lot 07 states are retained if the script is run again.
"""
from collections import Counter
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/armax/lot06/production-catalog.json"
DEST = ROOT / "docs/armax/lot07/production-catalog.json"
DATE = "2026-11-20"
catalog = json.loads(BASE.read_text())
previous = json.loads(DEST.read_text()) if DEST.exists() else None
sources = catalog["sources"]

def source(key, title, url, kind="secondary_index", retrieval="search_index_verified"):
    sources[key] = {"title": title, "url": url, "sourceType": kind,
                    "retrievalStatus": retrieval, "checkedOn": DATE}

source("rion_me3", "Rion Swanson — modèles ME3, dont Marauder et Brute", "https://www.rion-art.com/mass-effect-3", "primary_character_artist_portfolio", "full_page_and_selected_images_read")
source("zbrush_me3", "Équipe BioWare — interview et planches ME3", "https://www.zbrushcentral.com/t/interview-mass-effect-3-bioware-new-images-added-may-3/309131", "primary_developer_team_interview", "full_page_and_selected_images_read")
source("ea_me3_manual", "EA — manuel Mass Effect 3, conseils sur les ennemis", "https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_Sony%20Playstation%203.pdf", "primary_official")
source("xbox_me2_dlc", "EA sur Xbox — contenus de Mass Effect 2 (2010 Edition)", "https://www.xbox.com/en-US/games/store/mass-effect-2-2010-edition/9MTP3NKHVWM6", "primary_official", "full_page_read")
source("xbox_aegis", "EA sur Xbox — Aegis Pack et cinq pièces Kestrel", "https://www.xbox.com/en-us/games/store/aegis-pack/bx34v4wgh17q", "primary_official", "full_page_read")
source("xbox_equalizer", "EA sur Xbox — Equalizer Pack et armure Inferno", "https://www.xbox.com/en-us/games/store/equalizer-pack/BTDZ45B7N5J4", "primary_official")
source("ea_reckoner", "EA — bonus croisés Amalur / ME3, Reckoner Knight Armor", "https://s204.q4cdn.com/701424631/files/doc_news/2012/01/1/638555.pdf", "primary_official", "full_pdf_text_read")
source("me1_enemy_guide", "Prima — Known Resistance, ennemis ME1", "https://primagames.com/eguides/mass-effect-pc-eguide/essentials/combat/known-resistance", "licensed_game_guide")
source("me1_rachni", "Rachni Brood Warrior et index des ennemis ME1", "https://masseffect.fandom.com/wiki/Rachni_Brood_Warrior")
source("me2_mechs", "Modèles de mechs et opus d'apparition", "https://masseffect.fandom.com/wiki/Mechs")
source("me2_collectors", "Collecteurs — variantes Drone, Assassin et Guardian", "https://masseffect.fandom.com/wiki/Collector")
source("me2_enemy_index", "Index des ennemis de Mass Effect 2", "https://masseffect.fandom.com/wiki/Category%3AEnemies_%28Mass_Effect_2%29")
source("me3_enemy_index", "Index des ennemis de Mass Effect 3", "https://masseffect.fandom.com/wiki/Category%3AEnemies_%28Mass_Effect_3%29")
source("me3_omega_enemies", "Omega — Adjutant et Rampart Mech", "https://masseffect.fandom.com/wiki/Mass_Effect_3%3A_Omega")
source("me3_cat6", "CAT6 — unités du DLC Citadel", "https://masseffect.fandom.com/wiki/CAT6")
source("mea_enemy_index", "Index des ennemis d'Andromeda", "https://masseffect.fandom.com/wiki/Category%3AEnemies_%28Mass_Effect%3A_Andromeda%29")
source("mea_observer", "Observer — Remnant, index des unités", "https://masseffectandromeda.fandom.com/wiki/Observer")
source("mea_kett_codex", "Codex Andromeda — espèces et unités kett", "https://masseffect.fandom.com/wiki/Codex_%28Mass_Effect%3A_Andromeda%29/Andromeda_Species")
source("mea_eiroch", "Eiroch — faune d'Andromeda", "https://masseffectandromeda.fandom.com/wiki/Eiroch")
source("stage_normandy_sr1", "SSV Normandy — centre d'information de combat", "https://masseffect.fandom.com/wiki/SSV_Normandy")
source("stage_thorian", "Feros: The Thorian — enceinte et nœuds", "https://masseffect.fandom.com/wiki/Feros%3A_The_Thorian")
source("stage_virmire_facility", "Virmire — installation de Saren", "https://masseffect.fandom.com/wiki/Virmire_%28mission%29")
source("stage_choras_den", "Chora's Den — club de la Citadelle", "https://masseffect.fandom.com/wiki/Chora%27s_Den")
source("stage_reaper_iff", "Reaper IFF — intérieur du Moissonneur abandonné", "https://masseffect.fandom.com/wiki/Reaper_IFF")
source("stage_geth_dreadnought", "Priority: Geth Dreadnought — cœur du vaisseau", "https://masseffect.fandom.com/wiki/Priority%3A_Geth_Dreadnought")
source("stage_citadel_archives", "Citadel Archives: Escape", "https://masseffect.fandom.com/wiki/Citadel_Archives%3A_Escape")
source("stage_eos_vault", "A Better Beginning — caveau d'Eos", "https://masseffect.fandom.com/wiki/A_Better_Beginning")

added = []
def add(id, category, name, work, variant, refs, note, *, dlc=None,
        use="opposant_candidat", priority="P1", faction=None, visual=False):
    row = {"id": id, "category": category, "name": name, "work": work,
           "dlc": dlc, "variant": variant, "plannedUse": use,
           "priority": priority, "status": "Défini",
           "assetPresence": "manquant_dans_catalogue_armax_documente",
           "assetFiles": [], "fidelity1to1Validated": False,
           "engineIntegrated": False, "addedInLot": "lot07",
           "referenceReadiness": "images_primaires_consultees; comparaison_de_production_restante" if visual else "existence_et_opus_documentes; reference_visuelle_complete_a_verrouiller",
           "sourceIds": refs, "sourceUrls": [sources[k]["url"] for k in refs],
           "productionNote": note, "latestGenerationAttempt": "not_attempted"}
    if faction:
        row["faction"] = faction
        row["contentSubtype"] = "ennemi_ou_creature"
    added.append(row)

# ME1 units: the existence of campaign sprites is not evidence of an Armax body.
me1 = [
 ("varren", "Varren", "Modèle sauvage ME1", "Conserver le modèle ME1; une variante alpha nécessiterait une fiche distincte.", "Faune", "opposant_candidat"),
 ("thresher_maw", "Dévoreur / Thresher Maw", "Créature ME1 émergée", "Gabarit de boss de décor à définir; ne pas réduire arbitrairement la créature au gabarit humanoïde.", "Faune", "boss_candidat"),
 ("rachni_worker", "Rachni Worker", "Ouvrier rachni ME1", "Silhouette et échelle propres à l'ouvrier; ne pas réutiliser le corps du soldat.", "Rachni", "opposant_candidat"),
 ("rachni_soldier", "Rachni Soldier", "Soldat rachni ME1", "Vue latérale intégrale et points de contact des pattes à relever avant animation.", "Rachni", "opposant_candidat"),
 ("rachni_brood_warrior", "Rachni Brood Warrior", "Guerrier rachni ME1", "Variante séparée du soldat; proportions et palette à relever sur le modèle publié.", "Rachni", "boss_candidat"),
 ("thorian_creeper", "Thorian Creeper", "Créature de Féros ME1", "Garder l'apparence de Féros; la marche et l'attaque restent des clips à produire.", "Thorien", "opposant_candidat"),
 ("geth_armature", "Geth Armature", "Plateforme lourde ME1", "Corps mécanisé et appuis à suivre séparément de sa silhouette d'ensemble.", "Geth", "boss_candidat"),
 ("geth_colossus", "Geth Colossus", "Plateforme colossale ME1", "Fiche ME1 distincte des versions ME2/ME3; traitement de boss à dimensionner.", "Geth", "boss_candidat"),
 ("geth_stalker", "Geth Stalker", "Sous-type Stalker des hoppers ME1", "Ne pas confondre les sous-types Stalker, Ghost et Sapper; capture de ce modèle requise.", "Geth", "opposant_candidat"),
]
for slug, name, variant, note, faction, use in me1:
    add(f"chr_me1_{slug}", "personnage", name, "ME1", variant,
        ["me1_enemy_guide", "me1_rachni"], note, faction=faction, use=use)

me2 = [
 ("loki_mech", "LOKI Mech", "Mech bipède ME2", "Distinguer le LOKI de la variante Rampart introduite dans Omega ME3.", "Mechs", "opposant_candidat", ["me2_mechs"]),
 ("fenris_mech", "FENRIS Mech", "Mech quadrupède ME2", "Gabarit quadrupède, pattes et tête de capteurs à relever au modèle ME2.", "Mechs", "opposant_candidat", ["me2_mechs"]),
 ("ymir_mech", "YMIR Mech", "Mech lourd ME2", "Définir une échelle de boss et garder les modules du modèle ME2.", "Mechs", "boss_candidat", ["me2_mechs"]),
 ("scion", "Scion", "Apparence ME2", "Garder la variante ME2; ne pas mélanger avec les variantes possédées du multijoueur ME3.", "Récolteurs", "boss_candidat", ["me2_enemy_index"]),
 ("praetorian", "Praetorian", "Apparence ME2", "Corps et état flottant à documenter; les variantes ME3 ont une fiche potentielle séparée.", "Récolteurs", "boss_candidat", ["me2_enemy_index"]),
 ("collector_drone", "Collector Drone", "Drone récolteur ME2 non possédé", "Verrouiller le modèle de soldat ordinaire; la possession n'est pas incluse dans cette fiche.", "Récolteurs", "opposant_candidat", ["me2_collectors", "me2_enemy_index"]),
 ("collector_assassin", "Collector Assassin", "Assassin récolteur ME2", "Équipement et apparence de l'Assassin à vérifier séparément de ceux du Drone.", "Récolteurs", "opposant_candidat", ["me2_collectors"]),
 ("collector_guardian", "Collector Guardian", "Gardien récolteur ME2", "Unité distincte du Guardian Cerberus; éventuels effets de protection seront des fichiers séparés.", "Récolteurs", "opposant_candidat", ["me2_collectors"]),
]
for slug, name, variant, note, faction, use, refs in me2:
    add(f"chr_me2_{slug}", "personnage", name, "ME2", variant, refs, note, faction=faction, use=use)

me3 = [
 ("marauder", "Marauder", "Modèle ME3 standard", "Turnaround texturé de Rion Swanson consulté; préserver silhouette turienne, câbles et asymétries observées.", "Moissonneurs", "opposant_candidat", ["rion_me3", "ea_me3_manual"], True),
 ("brute_armoured", "Brute", "Modèle ME3 avec plaques d'armure", "Planche du modèle en moteur consultée; distinguer la forme armurée du corps sans plaques.", "Moissonneurs", "boss_candidat", ["rion_me3", "ea_me3_manual"], True),
 ("ravager", "Ravager", "Modèle ME3 standard", "Silhouette complète et positions des appendices à relever; effets et créatures associées non inclus.", "Moissonneurs", "boss_candidat", ["ea_me3_manual", "me3_enemy_index"], False),
 ("banshee", "Banshee", "Modèle ME3 standard", "Capture de profil et hauteur relative requises avant déclinaison en sprites.", "Moissonneurs", "boss_candidat", ["ea_me3_manual", "me3_enemy_index"], False),
 ("cannibal", "Cannibal", "Modèle ME3 sans renfort temporaire", "Choisir un état de base précis; les états renforcés en combat restent distincts.", "Moissonneurs", "opposant_candidat", ["ea_me3_manual", "me3_enemy_index"], False),
 ("phantom", "Phantom", "Armure Cerberus standard ME3", "Turnaround texturé BioWare entier consulté; gantelet droit et sangles de cuisse gauche à conserver.", "Cerberus", "opposant_candidat", ["zbrush_me3", "ea_me3_manual"], True),
 ("atlas", "Atlas", "Mech Cerberus standard ME3", "Le concept préparatoire ne suffit pas; confirmer cockpit, bras et panneaux sur le modèle final.", "Cerberus", "boss_candidat", ["ea_me3_manual", "me3_enemy_index"], False),
 ("guardian", "Guardian", "Fantassin Cerberus avec bouclier ME3", "Bouclier et corps forment des éléments à contrôler séparément avant animation.", "Cerberus", "opposant_candidat", ["ea_me3_manual", "me3_enemy_index"], False),
 ("nemesis", "Nemesis", "Tireuse Cerberus ME3", "Silhouette et équipement du modèle standard; laser de visée éventuel séparé.", "Cerberus", "opposant_candidat", ["ea_me3_manual", "me3_enemy_index"], False),
 ("combat_engineer", "Combat Engineer", "Ingénieur Cerberus ME3", "Le corps de l'ingénieur et sa tourelle éventuelle sont des livrables distincts.", "Cerberus", "opposant_candidat", ["ea_me3_manual", "me3_enemy_index"], False),
 ("assault_trooper", "Assault Trooper", "Fantassin Cerberus standard ME3", "Vérifier le casque et la répartition des panneaux du fantassin publié.", "Cerberus", "opposant_candidat", ["me3_enemy_index", "zbrush_me3"], False),
 ("centurion", "Centurion", "Centurion Cerberus ME3", "Confirmer sa propre armure et visière; ne pas déduire le modèle depuis celui du fantassin.", "Cerberus", "opposant_candidat", ["ea_me3_manual", "me3_enemy_index"], False),
]
for slug, name, variant, note, faction, use, refs, visual in me3:
    add(f"chr_me3_{slug}", "personnage", name, "ME3", variant, refs, note,
        faction=faction, use=use, visual=visual, priority="P0" if visual else "P1")
for slug, name, use in [("adjutant", "Adjutant", "boss_candidat"), ("rampart_mech", "Rampart Mech", "opposant_candidat")]:
    add(f"chr_me3_{slug}_omega", "personnage", name, "ME3", "Modèle du DLC Omega",
        ["bio_omega", "me3_omega_enemies", "me2_mechs"] if slug == "rampart_mech" else ["bio_omega", "me3_omega_enemies"],
        "Capturer le modèle exact du DLC; la présence dans cette fiche ne rend pas l'unité jouable.",
        dlc="Omega", faction="Cerberus", use=use)
for slug, name in [("heavy", "CAT6 Heavy"), ("sniper", "CAT6 Sniper"), ("specialist", "CAT6 Specialist")]:
    add(f"chr_me3_cat6_{slug}", "personnage", name, "ME3", "Unité CAT6 du DLC Citadel", ["me3_cat6"],
        "Adaptation d'adversaire proposée pour Armax Relay Clash; ne pas prétendre que CAT6 est jouable dans l'Armax du jeu original.",
        dlc="Citadel", faction="CAT6")

mea = [
 ("kett_ascendant", "Ascendant kett", "Unité standard, hors Prefect nommé", "Kett", "boss_candidat", ["mea_kett_codex", "mea_enemy_index"]),
 ("kett_fiend", "Fiend kett", "Créature kett standard", "Kett", "boss_candidat", ["mea_kett_codex", "mea_enemy_index"]),
 ("kett_destined", "Destined kett", "Unité kett standard", "Kett", "opposant_candidat", ["mea_kett_codex", "mea_enemy_index"]),
 ("remnant_observer", "Observer reliquat", "Drone standard, hors variante Progenitor", "Reliquats", "opposant_candidat", ["mea_observer"]),
 ("remnant_destroyer", "Destroyer reliquat", "Unité standard, hors Progenitor nommé", "Reliquats", "boss_candidat", ["mea_observer", "mea_enemy_index"]),
 ("remnant_architect", "Architecte reliquat", "Créature mécanique d'Andromeda", "Reliquats", "boss_candidat", ["mea_enemy_index", "mea_observer"]),
 ("eiroch", "Eiroch", "Créature standard, hors Ancient Eiroch", "Faune", "opposant_candidat", ["mea_eiroch"]),
]
for slug, name, variant, faction, use, refs in mea:
    add(f"chr_mea_{slug}", "personnage", name, "Andromeda", variant, refs,
        "Références intégrales du modèle publié à réunir; échelle et adaptation au combat 2D restent à définir.",
        faction=faction, use=use)

# Male and female bodies are separate requested production deliverables. The
# source confirms the armor set; exact body geometry still requires references.
armors = [
 ("me2", "kestrel", "Kestrel", "Aegis Pack", ["xbox_aegis"], "Ensemble complet des cinq pièces; palette à figer sur capture, casque visible."),
 ("me2", "blood_dragon", "Blood Dragon", "Blood Dragon Armor", ["xbox_me2_dlc"], "Ensemble ME2 et casque visible; ne pas importer la géométrie d'une version d'un autre opus."),
 ("me2", "terminus", "Terminus Assault", "Terminus Weapon and Armor Pack", ["xbox_me2_dlc"], "Ensemble ME2 et casque visible; comparer au modèle publié du pack."),
 ("me2", "collector", "Collector", "Collectors' Weapon and Armor Pack", ["xbox_me2_dlc"], "Ensemble ME2 et casque visible; l'armure portée par Shepard est distincte d'un corps récolteur."),
 ("me2", "inferno", "Inferno", "Equalizer Pack", ["xbox_equalizer", "xbox_me2_dlc"], "Ensemble ME2 et casque visible; les casques isolés du pack ne sont pas ajoutés comme costumes complets."),
 ("me2", "cerberus_assault", "Cerberus Assault", "Cerberus Weapon and Armor Pack", ["xbox_me2_dlc"], "Ensemble ME2 et casque visible; distinguer cette tenue des armures Cerberus ME3."),
 ("me3", "reckoner_knight", "Reckoner Knight", "Bonus démo Kingdoms of Amalur: Reckoning", ["ea_reckoner"], "Bonus d'armure ME3 distinct du DLC multijoueur Reckoning; silhouette et casque à référencer."),
]
for opus, slug, name, dlc, refs, note in armors:
    for gender, label in [("male", "masculin"), ("female", "féminin")]:
        add(f"cst_{opus}_shepard_{gender}_{slug}", "costume", f"Shepard {label}", opus.upper(),
            f"Armure {name} complète — corps {label}", refs, note, dlc=dlc, use="variante_visuelle")

stages = [
 ("stg_me1_normandy_sr1_cic", "Normandy SR-1 — CIC", "ME1", "Centre d'information de combat", "stage_normandy_sr1", None, "Pont ME1 à garder distinct du SR-2 Cerberus et de sa rénovation Alliance."),
 ("stg_me1_feros_thorian_lair", "Féros — enceinte du Thorien", "ME1", "Niveau des nœuds du Thorien", "stage_thorian", None, "Choisir un niveau précis pour le plan de duel; distinct de Zhu's Hope et d'ExoGeni."),
 ("stg_me1_virmire_breeding_lab", "Virmire — installation de Saren", "ME1", "Laboratoire de reproduction krogan", "stage_virmire_facility", None, "Sous-zone intérieure distincte de la côte déjà illustrée; capture du bon laboratoire requise."),
 ("stg_me1_citadel_choras_den", "Citadelle — Chora's Den", "ME1", "Salle principale du club", "stage_choras_den", None, "Plan large sans personnages à construire depuis une capture ME1; circulation et caméra à concevoir."),
 ("stg_me2_derelict_reaper_core", "Moissonneur abandonné — cœur", "ME2", "Zone du cœur de la mission Reaper IFF", "stage_reaper_iff", None, "Cadrage d'une sous-zone exacte; les extérieurs et autres couloirs ne sont pas couverts."),
 ("stg_me3_geth_dreadnought_core", "Cuirassé geth — cœur", "ME3", "Salle du cœur de la mission Priority: Geth Dreadnought", "stage_geth_dreadnought", None, "Ne pas fusionner salle du cœur, batterie principale et coursives dans une composition prétendument exacte."),
 ("stg_me3_citadel_archives", "Citadelle — archives", "ME3", "Salle d'archives de la séquence Escape", "stage_citadel_archives", "Citadel", "Fixer une salle et sa numérotation visuelle; les différentes archives restent des espaces distincts."),
 ("stg_mea_eos_vault", "Eos — caveau reliquat", "Andromeda", "Salle intérieure de réactivation", "stage_eos_vault", None, "Version avant activation à capturer; distinct du monolithe extérieur déjà listé."),
]
for id, name, work, variant, ref, dlc, note in stages:
    add(id, "stage", name, work, variant, [ref], note, dlc=dlc, use="arene_adaptee")

previous_by_id = {e["id"]: e for e in previous["entries"]} if previous else {}
base_ids = {e["id"] for e in catalog["entries"]}
assert len({e["id"] for e in added}) == len(added)
assert not base_ids.intersection(e["id"] for e in added), "New IDs duplicate lot 06"
for entry in catalog["entries"]:
    entry.setdefault("addedInLot", "lot06")
    if entry["id"] in previous_by_id:
        entry.update(deepcopy(previous_by_id[entry["id"]]))
for entry in added:
    if entry["id"] in previous_by_id:
        entry.update(deepcopy(previous_by_id[entry["id"]]))
catalog["entries"].extend(added)
if previous:
    catalog["sources"].update(previous.get("sources", {}))
catalog.update({"catalogId": "armax-current-lot07-20261120", "revisionLot": "lot07", "updatedOn": DATE,
                "parentCatalog": "docs/armax/lot06/production-catalog.json",
                "baseCommit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
                "parentCatalogSha256": hashlib.sha256(BASE.read_bytes()).hexdigest(),
                "carriedForwardEntries": len(base_ids), "addedEntries": len(added),
                "scope": "Catalogue Armax courant: 101 fiches du lot06 et extension lot07. Les sprites RPG, portraits et anciens fichiers Git non matérialisés localement gardent leurs périmètres distincts."})
catalog["counts"] = dict(Counter(e["category"] for e in catalog["entries"]))
catalog["totalEntries"] = len(catalog["entries"])
catalog["currentCounts"] = {"total": len(catalog["entries"]), "withImage": sum(bool(e["assetFiles"]) for e in catalog["entries"]), "withoutImage": sum(not e["assetFiles"] for e in catalog["entries"]), "certified1to1": 0}
catalog["policy"].update({
    "missingDefinition": "Aucune fiche/fichier de cette variante repéré dans le catalogue Armax lot06 et l'inventaire récupéré; une absence locale de blob Git ne signifie jamais une image absente.",
    "enemyRolesAreProjectAdaptations": True,
    "maleFemaleArmorBodiesAreSeparateDeliverables": True,
    "automaticRetryExcludedIds": sorted(set([
        "chr_me2_legion_standard", "chr_me3_edi_standard", "chr_trilogy_urdnot_wrex_guide_ea",
        "cst_me2_garrus_aap1", "chr_me3_kai_leng",
        *(previous or {}).get("policy", {}).get("automaticRetryExcludedIds", []),
        *(e["id"] for e in catalog["entries"] if e.get("latestGenerationAttempt") == "blocked"),
    ])),
})
catalog["researchReferenceFile"] = "docs/armax/lot07/reference-library.json"
DEST.parent.mkdir(parents=True, exist_ok=True)
DEST.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"file": str(DEST), "counts": catalog["counts"], "added": len(added), "total": len(catalog["entries"]), "sources": len(catalog["sources"])}))
