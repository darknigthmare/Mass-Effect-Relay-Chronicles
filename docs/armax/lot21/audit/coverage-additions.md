# Audit de couverture Armax — lot 21

**15 identités absentes du catalogue lot20** sont proposées : 4 pour ME1, 4 pour ME2, 4 pour ME3 et 3 pour Andromeda. L’audit identifie des sujets et leurs prérequis ; il n’accorde aucun pouvoir, aucune validation artistique ni intégration moteur.

## Reconstitution documentaire

Le JSON initial a disparu avec le répertoire temporaire. Cette version est reconstruite depuis le **XLSX final conservé et inchangé**, ses 20 nouvelles lignes extraites et les catalogues Git de base. Les identifiants, œuvres, variantes et décisions sont conservés. Les trois réserves initiales devenues des revues d’images ne sont pas présentées comme des citations exactes du fichier perdu.

## Proposition et usage

| Identifiant | Œuvre | Sujet | Usage | Décision d’audit | État observé au bilan final |
|---|---|---|---|---|---|
| `wpn_me2_m12_locust` | ME2 | M-12 Locust | arme_candidat | production_apres_reference | Image candidate |
| `wpn_me2_m96_mattock` | ME2 | M-96 Mattock | arme_candidat | production_apres_reference | Refus sans relance |
| `wpn_me2_m5_phalanx` | ME2 | M-5 Phalanx | arme_candidat | production_apres_reference | Image candidate |
| `wpn_me2_m920_cain` | ME2 | M-920 Cain | arme_candidat | production_apres_reference | Sans image |
| `chr_me1_geth_rocket_trooper` | ME1 | Lance-roquettes geth | opposant_candidat | reemploi_a_inspecter | Sans image |
| `chr_me1_geth_juggernaut` | ME1 | Juggernaut geth | opposant_candidat | reemploi_a_inspecter | Sans image |
| `chr_me1_geth_destroyer` | ME1 | Destructeur geth | opposant_candidat | reemploi_a_inspecter | Sans image |
| `prop_me1_eden_prime_prothean_beacon` | ME1 | Balise prothéenne d’Eden Prime | accessoire_candidat | production_apres_reference | Sans image |
| `chr_me3_geth_hunter` | ME3 | Geth Hunter | opposant_candidat | production_apres_reference | Sans image |
| `chr_me3_geth_pyro` | ME3 | Geth Pyro | opposant_candidat | production_apres_reference | Sans image |
| `chr_me3_swarmer` | ME3 | Swarmer | opposant_candidat | production_apres_reference | Image candidate |
| `wpn_me3_m11_suppressor` | ME3 | M-11 Suppressor | arme_candidat | production_apres_reference | Refus sans relance |
| `chr_mea_adhi_wild` | MEA | Adhi sauvage | opposant_candidat | reemploi_a_inspecter | Sans image |
| `chr_mea_adhi_trained_outlaws` | MEA | Adhi dressé des Outlaws | opposant_candidat | recherche_reference_independante | Sans image |
| `wpn_mea_paw` | MEA | P.A.W. | arme_candidat | production_apres_reference | Sans image |

Les 15 propositions comprennent **10 productions conditionnées à une référence, 4 pistes de réemploi et 1 recherche de publication indépendante**. L’audit lui-même n’a généré aucun PNG. Le bilan final observe ensuite **3 images candidates** sur ces propositions — Locust, Phalanx et Swarmer — et **2 refus sans relance** — Mattock et Suppressor. Les 10 autres restent ouverts.

## Réemploi à examiner avant toute nouvelle image

- **Lance-roquettes geth** : `public/assets/frontier-enemies.png` / cadre `rocket-geth`. Corps fixe RPG présent dans frontier-enemies. Comparer au modèle de l’édition retenue, cadrage et armement avant toute nouvelle image ou association Armax. La roquette et l’explosion restent des actifs distincts.
- **Juggernaut geth** : `public/assets/frontier-enemies.png` / cadre `juggernaut`. Corps fixe RPG présent dans frontier-enemies. Ne pas confondre le Juggernaut ME1 avec le Geth Prime ni le personnage multijoueur de ME3.
- **Destructeur geth** : `public/assets/enemy-geth-destroyer-combat.png`. Quatre poses RPG présentes, arme générique explicitement non certifiée. Le catalogue principal conserve assetPath=null : écart d’attribution à examiner sans déclarer une absence globale.
- **Adhi sauvage** : `public/assets/horizon-fauna.png` / cadre `adhi-mea`. Le cadre adhi-mea de horizon-fauna est un candidat historique. Son identifiant ne prouve pas seul sauvage/dressé ; inspection visuelle et comparaison de l’anatomie requises avant attribution. Ne pas générer de doublon à l’aveugle.

La balise d’Eden Prime reste un **accessoire narratif**. Le master de stage existant ne livre pas l’objet isolé et ses états. Le P.A.W. possède un profil ATB partiel dans les Chroniques ; ce profil ne tient pas lieu de sprite. La variante équipée de l’Adhi reste séparée du candidat de faune sauvage.

## Références et lacunes par sujet

### M-12 Locust — ME2

Fiche source : `docs/universe/catalogs/ME2.json` / `ME2-WPN-LOCUST` ; statut de la fiche : **Défini**.

Priorité de production : verrouiller une vue entière native ME2, pas un render ME3. Conserver crosse, poignée avant, canon et marquages ; un seul objet sans porteur.

- [M-12 Locust](https://masseffect.fandom.com/wiki/M-12_Locust) — secondaire. Identité ME2 et variante ; capture entière originale requise.

### M-96 Mattock — ME2

Fiche source : `docs/universe/catalogs/ME2.json` / `ME2-WPN-MATTOCK` ; statut de la fiche : **Défini**.

Capturer le modèle ME2 exact et ses proportions. Ne pas remplacer par le Mattock de ME3/Andromeda ni le Mattock Auto d’Infiltrator.

- [Firepower Pack — Xbox](https://www.xbox.com/en-us/games/store/firepower-pack/BVVZ72CC1VJJ) — primaire_officielle. Périmètre du pack ; ne certifie pas les détails du modèle.
- [Mass Effect 2 (2010 Edition) — Xbox](https://www.xbox.com/en-US/games/store/mass-effect-2-2010-edition/9MTP3NKHVWM6) — primaire_officielle. Édition de référence ME2 ; ne remplace pas une capture exacte.
- [M-96 Mattock](https://masseffect.fandom.com/wiki/M-96_Mattock) — secondaire. Identité de l’arme ; versions séparées par opus.

### M-5 Phalanx — ME2

Fiche source : `docs/universe/catalogs/ME2.json` / `ME2-WPN-PHALANX` ; statut de la fiche : **Défini**.

Verrouiller le modèle ME2 du Firepower Pack, une vue entière et le dispositif de visée. Distinguer les variantes ME3/Andromeda ; phases de tir, rechargement et effet de visée sont des livrables séparés.

- [Firepower Pack — Xbox](https://www.xbox.com/en-us/games/store/firepower-pack/BVVZ72CC1VJJ) — primaire_officielle. Périmètre du pack ; ne certifie pas les détails du modèle.
- [Mass Effect 2 (2010 Edition) — Xbox](https://www.xbox.com/en-US/games/store/mass-effect-2-2010-edition/9MTP3NKHVWM6) — primaire_officielle. Édition de référence ME2 ; ne remplace pas une capture exacte.
- [M-5 Phalanx](https://masseffect.fandom.com/wiki/M-5_Phalanx) — secondaire. Identité et modèle ME2 ; variantes ultérieures distinctes.

### M-920 Cain — ME2

Fiche source : `docs/universe/catalogs/ME2.json` / `ME2-WPN-CAIN` ; statut de la fiche : **Défini**.

Verrouiller carcasse entière et échelle. Séparer arme, charge, projectile et explosion ; aucune équivalence au Cain local de ME3 déduite.

- [M-920 Cain](https://masseffect.fandom.com/wiki/M-920_Cain) — secondaire. Arme ME2 ; arme, charge et explosion séparées.

### Lance-roquettes geth — ME1

Fiche source : `docs/content-catalog.json` / `ENM-lance-roquettes-geth` ; statut de la fiche : **Prototype**.

Corps fixe RPG présent dans frontier-enemies. Comparer au modèle de l’édition retenue, cadrage et armement avant toute nouvelle image ou association Armax. La roquette et l’explosion restent des actifs distincts.

- [Mass Effect PC — guide Prima hébergé par EA/BioWare](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) — guide_officiel_heberge_editeur. Identité et contexte ME1 ; modèle exact et édition à capturer.

### Juggernaut geth — ME1

Fiche source : `docs/content-catalog.json` / `ENM-juggernaut-geth` ; statut de la fiche : **Prototype**.

Corps fixe RPG présent dans frontier-enemies. Ne pas confondre le Juggernaut ME1 avec le Geth Prime ni le personnage multijoueur de ME3.

- [Mass Effect PC — guide Prima hébergé par EA/BioWare](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) — guide_officiel_heberge_editeur. Identité et contexte ME1 ; modèle exact et édition à capturer.

### Destructeur geth — ME1

Fiche source : `docs/content-catalog.json` / `ENM-destructeur-geth` ; statut de la fiche : **Défini**.

Quatre poses RPG présentes, arme générique explicitement non certifiée. Le catalogue principal conserve assetPath=null : écart d’attribution à examiner sans déclarer une absence globale.

- [Mass Effect PC — guide Prima hébergé par EA/BioWare](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) — guide_officiel_heberge_editeur. Identité et contexte ME1 ; modèle exact et édition à capturer.

### Balise prothéenne d’Eden Prime — ME1

Fiche source : `docs/content-catalog.json` / `PRP-balise-protheenne` ; statut de la fiche : **Défini**.

Le master de stage Armax existe déjà ; il ne fournit pas l’objet détouré, le revers, le socle ni les états inactif/actif. Vérifier référence ME1 originale, silhouette et place sur la plateforme. Aucun rôle de combattant.

- [Mass Effect PC — guide Prima hébergé par EA/BioWare](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) — guide_officiel_heberge_editeur. Identité et contexte ME1 ; modèle exact et édition à capturer.

### Geth Hunter — ME3

Fiche source : `docs/universe/catalogs/ME3.json` / `ME3-ENM-GETH-HUNTER` ; statut de la fiche : **Défini**.

Capturer le modèle ennemi ME3 entier. Effets entrée/sortie camouflage séparés ; ne pas assimiler au Geth Hunter Infiltrator jouable ni au modèle ME2. Source Marauder héritée trop générale, remplacée ici par le manuel officiel pour l’existence.

- [Mass Effect 3 — manuel Xbox 360 EA](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_Microsoft%20XBOX360.pdf) — primaire_officielle. Existence et rôle du bestiaire ; aucune géométrie 1:1 déduite du texte.

### Geth Pyro — ME3

Fiche source : `docs/universe/catalogs/ME3.json` / `ME3-ENM-GETH-PYRO` ; statut de la fiche : **Défini**.

Capturer réservoirs, tuyaux, arme et silhouette ME3. Jet de feu, ignition et extinction séparés. Ne pas réutiliser le Destructeur ME2 sous ce nom.

- [Mass Effect 3 — manuel Xbox 360 EA](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_Microsoft%20XBOX360.pdf) — primaire_officielle. Existence et rôle du bestiaire ; aucune géométrie 1:1 déduite du texte.

### Swarmer — ME3

Fiche source : `docs/universe/catalogs/ME3.json` / `ME3-ENM-SWARMER` ; statut de la fiche : **Défini**.

Verrouiller une vue entière du Swarmer ME3 individuel ; ne pas remplacer la créature par le Ravager ou par un essaim. Silhouette, échelle, naissance et mouvement restent à vérifier séparément.

- [Mass Effect 3 — manuel Xbox 360 EA](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_Microsoft%20XBOX360.pdf) — primaire_officielle. Existence et rôle du bestiaire ; aucune géométrie 1:1 déduite du texte.

### M-11 Suppressor — ME3

Fiche source : `docs/universe/catalogs/ME3.json` / `ME3-WPN-SUPPRESSOR` ; statut de la fiche : **Défini**.

Capturer profil entier, silencieux et fixation. Usage de projectile et animation à associer ensuite aux porteurs autorisés ; présence documentaire ne rend pas un PNJ combattant.

- [M-11 Suppressor](https://masseffect.fandom.com/wiki/M-11_Suppressor) — secondaire. Identité ME3 / Citadel ; profil entier requis.

### Adhi sauvage — MEA

Fiche source : `docs/universe/catalogs/MEA.json` / `MEA-ENM-ADHI-WILD` ; statut de la fiche : **Défini**.

Le cadre adhi-mea de horizon-fauna est un candidat historique. Son identifiant ne prouve pas seul sauvage/dressé ; inspection visuelle et comparaison de l’anatomie requises avant attribution. Ne pas générer de doublon à l’aveugle.

- [Adhi](https://masseffect.fandom.com/wiki/Adhi) — secondaire. Distinction sauvage/dressé ; ne remplace pas une planche complète.

### Adhi dressé des Outlaws — MEA

Fiche source : `docs/universe/catalogs/MEA.json` / `MEA-ENM-ADHI-TRAINED` ; statut de la fiche : **Défini**.

Historique lot13 : planche complète et équipement non récupérés. Ne pas transformer une image de faune sauvage en variante équipée sans référence. Conserver les refus d’accès documentés ; chercher une publication indépendante permise.

- [Mass Effect Andromeda — guide officiel Prima, Outlaws](https://primagames.com/eguides/mass-effect-andromeda-collectors-edition-eguide/game-mechanics/enemies/outlaws) — guide_officiel. Source textuelle de la variante dressée, documentée dans la recherche lot13.
- [Adhi](https://masseffect.fandom.com/wiki/Adhi) — secondaire. Distinction sauvage/dressé ; ne remplace pas une planche complète.
- [Herbert Lowis — Adhi](https://herbertlowis.artstation.com/projects/X2RP0) — auteur_du_modele_reference. Pointeur historique ; planche complète non récupérée. Aucun nouvel accès ni contournement revendiqué.

### P.A.W. — MEA

Fiche source : `docs/universe/catalogs/MEA.json` / `MEA-WPN-PAW` ; statut de la fiche : **Prototype**.

Un profil ATB à chaleur existe déjà dans les Chroniques ; ce n’est pas une image isolée. Capturer corps de l’arme et sortie du rayon, puis séparer rayon/impact/extinction ; ne pas recopier les variantes multijoueurs dans le solo.

- [P.A.W.](https://masseffect.fandom.com/wiki/P.A.W.) — secondaire. Identité Andromeda ; configuration solo à isoler.

## Registre de couverture

| Œuvre | Catalogue existant | Fiches du catalogue | Propositions de cet audit |
|---|---|---:|---:|
| ME1 | `docs/content-catalog.json` | 1385 | 4 |
| ME2 | `docs/universe/catalogs/ME2.json` | 670 | 4 |
| ME3 | `docs/universe/catalogs/ME3.json` | 736 | 4 |
| MEA | `docs/universe/catalogs/MEA.json` | 763 | 3 |

Les autres fichiers de `docs/universe/catalogs/` sont indexés dans le JSON, sans audit de leurs manquants Armax. Les valeurs ci-dessus décrivent les catalogues du projet ; elles ne constituent pas une mesure d’exhaustivité des œuvres.

## Portée des sources

Les sources officielles ou le guide officiel sont privilégiés pour l’existence et le contexte. Les wikis et galeries sont signalés comme secondaires. Les références visuelles exactes restent une étape distincte. Les URLs sont conservées depuis les pièces retrouvées ; cette récupération documentaire ne revendique aucun nouvel accès réussi aux sites. Les refus d’accès documentés dans la recherche Adhi du lot13 restent applicables.

## Preuve de récupération

- XLSX final SHA-256 : `0c72622d22bed67d59836477a95006977a5492f485d8b4b462c37f1ee31032c4`.
- Extrait : `recovered-workbook-entries.json` ; 20 nouvelles identités et 2 anciennes lignes mises à jour.
- Base Git : `8542d7ca03702dcf4b3bccd8ac938bd6574f20bc`.
- Aucun fichier de catalogue central ni image modifié par cette reconstruction.
