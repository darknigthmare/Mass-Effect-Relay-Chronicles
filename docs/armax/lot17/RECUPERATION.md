# Lot 17 — récupération locale des sorties natives

## Résultat

**12 PNG intègres ont été récupérés, copiés octet pour octet.** Neuf reçoivent une association de travail à une fiche existante ; trois restent non sélectionnés, faute d’identification ou de variante suffisamment établie. Aucun PNG n’est déclaré validé 1:1 ou intégré au moteur par cette opération.

Le répertoire source contient **21 entrées portant l’extension `.png` : 20 PNG décodables et un fichier vide**. Parmi les PNG, six correspondent exactement à des manifestes du lot16 et deux à des manifestes du lot17 (Padok Wiks et Gil Brodie). Ces huit fichiers déjà enregistrés n’ont pas été recopiés. Le fichier vide reste consigné dans l’inventaire et exclu des comptes PNG.

L’ajout des douze sorties récupérées aux deux sorties du lot17 déjà enregistrées donne **14 PNG physiques pour ce périmètre**, dont trois sans association de catalogue retenue. Cela ne signifie ni quatorze identités validées, ni quatorze assets prêts pour le moteur.

## Provenance et limites

- Source explicite : `/workspace/scratch/8eb3f23d9927/generated_images/`, déjà mentionnée dans les manifestes lot17.
- Projet : `darknigthmare/Mass-Effect-Relay-Chronicles`, PR #11. Aucun asset d’un autre univers n’est ajouté.
- Copie dans `public/assets/armax/lot17/recovered/` sans retouche, recadrage, réencodage, nettoyage alpha ni nouvelle génération.
- Noms natifs de type `exec-<uuid>.png` et métadonnées PNG vides : les identités sont des rapprochements visuels avec le plan de production, pas des reçus de génération retrouvés.
- Le prompt Lexi existe déjà dans `source-me1-me2-mea/prompts/lexi-tperro-mea.json`, mais aucun reçu ne prouve son lien avec le PNG récupéré. Aucun autre prompt manquant n’est reconstitué.
- Le lot15 annoncé à 113 PNG et `Combat_Games_Guide_General_v1.0.txt` ne sont pas retrouvés dans cette opération. Les présentes sorties ne leur sont pas attribuées.

## Associations de travail retenues

`selected=true` signifie uniquement : association de travail conservée pour un candidat à revoir. La fidélité, les détails de variante et la revue moteur restent ouverts.

| Fiche | Variante visée | Fichier récupéré | SHA-256 abrégé |
|---|---|---|---|
| `chr_mea_lexi_tperro` | Tenue médicale du Tempest (MEA) | `lexi-tperro-mea-fixed.png` | `45be672aa1407050` |
| `cst_me2_shepard_female_cerberus_assault` | Armure Cerberus Assault complète — corps féminin (ME2) | `shepard-female-cerberus-assault-me2-fixed.png` | `fb2ff7875730b5dd` |
| `chr_mea_sloane_kelly` | Apparence Kadara (MEA) | `sloane-kelly-mea-fixed.png` | `b9aaba42315f1f2b` |
| `chr_me2_gavin_archer` | Apparence du projet Overlord (ME2) | `gavin-archer-me2-overlord-fixed.png` | `5bfdd7e5abcf6fa1` |
| `chr_me3_maya_brooks` | Apparence finale du DLC (ME3) | `maya-brooks-me3-citadel-fixed.png` | `73927f5508f4f915` |
| `chr_me1_chakwas` | Tenue médicale Normandy SR-1 (ME1) | `karin-chakwas-me1-sr1-fixed.png` | `7a65c0564eeb9ce7` |
| `cst_me2_shepard_male_cerberus_assault` | Armure Cerberus Assault complète — corps masculin (ME2) | `shepard-male-cerberus-assault-me2-fixed.png` | `ddb6cd465ce64f06` |
| `cst_me2_shepard_male_kestrel` | Armure Kestrel complète — corps masculin (ME2) | `shepard-male-kestrel-me2-fixed.png` | `c4a4f3df0e4cb0b8` |
| `chr_me3_samantha_traynor` | Tenue de service Alliance (ME3) | `samantha-traynor-me3-fixed.png` | `9218c47e76f02125` |

## Candidats conservés sans sélection

| Hypothèse seulement | Fichier | Motif |
|---|---|---|
| `chr_me3_han_gerrel` | `candidate-quarian-purple-e3b9a976.png` | Identité et variante ME3 ambiguës entre les deux amiraux récupérés. Ne pas assigner cette image au catalogue avant comparaison aux captures ME3 exactes. Les palettes ME2, ME3 et les mods ne sont pas interchangeables. |
| `chr_me3_zaal_koris` | `candidate-quarian-maroon-5c7ec3e1.png` | Identité et variante ME3 ambiguës entre les deux amiraux récupérés. Ne pas assigner cette image au catalogue avant comparaison aux captures ME3 exactes. Les portraits seuls ne suffisent pas. |
| `chr_me1_jenkins` | `candidate-alliance-marine-1b151607.png` | Un marine en armure ne suffit pas à identifier Jenkins. Aucun reçu, prompt ou rapprochement exact avec une capture Eden Prime ME1 n’a été retrouvé. Ne pas assigner cette image au catalogue. |

Dans l’audit machine, ces trois fichiers portent `catalogId: null` et `selected: false`. `hypothesisCatalogId` conserve la piste de recherche ; il ne doit pas servir à remplir automatiquement une fiche. Les deux PNG quariens peuvent encore nécessiter une réattribution entre Han’Gerrel et Zaal’Koris.

## Réserves visuelles

- **Lexi T'Perro — Tenue médicale du Tempest :** Prompt descriptif existant, mais aucun reçu ne relie cryptographiquement ce prompt à ce PNG. Visage, étoffe, coutures et bas du corps restent à comparer aux captures exactes.
- **Shepard féminin — Armure Cerberus Assault complète — corps féminin :** Liserés des épaules et du torse interprétés. Bas des jambes et bottes non verrouillés par la capture de référence cadrée. Visage non certifié.
- **Sloane Kelly — Apparence Kadara :** Pas de reçu de génération ni de prompt retrouvé. Tatouages, visage, assemblage de l’armure et pieds nécessitent une comparaison aux captures exactes de la variante Kadara.
- **Gavin Archer — Apparence du projet Overlord :** Pas de reçu de génération ni de prompt retrouvé. Traits du visage, motifs des panneaux et bas du corps non certifiés par une référence exacte complète.
- **Maya Brooks — Apparence finale du DLC :** Pas de reçu de génération ni de prompt retrouvé. La tenue finale et les proportions doivent être confrontées à la scène exacte du DLC ; cette association ne valide pas son équipement ni son comportement de boss.
- **Karin Chakwas — Tenue médicale Normandy SR-1 :** Pas de reçu de génération ni de prompt retrouvé. Âge apparent, visage, coupe de la tenue et chaussures restent à vérifier contre la variante ME1 exacte.
- **Shepard masculin — Armure Cerberus Assault complète — corps masculin :** La capture féminine confirme la famille de costume, pas le gabarit masculin exact. Genouillères rondes et bas des jambes/bottes à verrouiller avec une référence masculine ME2 complète.
- **Shepard masculin — Armure Kestrel complète — corps masculin :** Coloris gris cohérent avec une armure personnalisable, mais coutures, texture et proportions restent interprétés. La comparaison ne vaut pas certification 1:1.
- **Samantha Traynor — Tenue de service Alliance :** Pas de reçu de génération ni de prompt retrouvé. Le catalogue antérieur documente surtout le buste ; visage, pantalon et chaussures restent à verrouiller avec des captures exactes non modifiées.

Les trois costumes ont reçu une comparaison indépendante par l’agent `new_costumes`. Pour Kestrel, les deux captures officielles EA de l’Aegis Pack corroborent aussi le casque et les bottes ; les textures et coutures restent interprétées. Pour Cerberus Assault, la capture féminine ne certifie pas le gabarit masculin ni les jambes et pieds absents du cadrage. Les URLs et empreintes des références inspectées sont consignées dans l’audit.

## Contrôles techniques

- Douze fichiers décodés, un seul frame par image, RGBA, 1024 × 1536.
- Empreintes SHA-256 source et destination identiques pour les douze copies ; les SHA-256 complets sont enregistrés dans l’audit.
- Alpha minimum 0, maximum 254 pour les douze fichiers : pixels transparents présents, aucun pixel totalement opaque à 255. Des halos à faible alpha peuvent atteindre les bords.
- La boîte à alpha ≥ 128 et les marges sont mesurées pour diagnostic. Aucun seuil n’est appliqué aux fichiers livrés.
- Revue des originaux à taille native et planche de contact temporaire. Cette planche ne constitue pas une spritesheet livrée.
- Aucune animation, aucune association d’attaque/pouvoir, aucun test ou branchement moteur. La présence d’un PNG ne modifie pas l’usage prévu de la fiche (support narratif, combattant ou boss candidat).

## Fichiers de preuve

- [Audit complet](recovery-audit.json) : inventaire des 21 entrées, preuves des huit enregistrements antérieurs, SHA-256 complets, alpha, hypothèses, décisions et références.
- [Plan de production original](production-plan.json) : cibles du lot17 et exclusions conservées.
- [Dossier des PNG récupérés](../../../public/assets/armax/lot17/recovered/) : les douze copies natives.

Cette passe de récupération ne modifie que les douze copies et ces deux documents. Aucun manifeste source, catalogue, fichier moteur, commit ou action GitHub n’a été modifié par l’agent de récupération.
