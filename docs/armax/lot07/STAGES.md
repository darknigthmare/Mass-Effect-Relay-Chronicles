# Armax — décors du lot07

Trois nouveaux masters individuels ont été générés le 20 novembre 2026 avec l’outil `image_gen` intégré, après inspection de références visuelles du bon opus. Chaque fichier est un PNG opaque de **1672 × 941 pixels**, conservé sans modification. Les trois premières tentatives ont abouti; aucune relance ni aucun refus pour cette famille.

| Décor | Référence visuelle | Fichier |
|---|---|---|
| Omega — Afterlife, ME2 | Capture de la salle principale : cylindre magenta, anneau, lampes circulaires, garde-corps et sol rouge | [Master](../../../public/assets/armax/lot07/stages/omega-me2-afterlife-master.png) |
| Académie Grissom — atrium, ME3 | Vue du décor publiée par Graham Kelly : verrière, piliers, rampes, arbres et bacs | [Master](../../../public/assets/armax/lot07/stages/grissom-me3-atrium-master.png) |
| Hagalaz — coque du Courtier, ME2, *Lair of the Shadow Broker* | Captures de la coque : surplomb, capaciteur incliné, témoins cyan et ciel orageux sépia | [Master](../../../public/assets/armax/lot07/stages/hagalaz-me2-shadow-broker-hull-master.png) |

## Revue et réserves

**Afterlife.** Les principaux repères de la salle sont conservés. Le cadrage source 3:2 est adapté au format large et le sol est dégagé pour le duel. La salle est vide et le cylindre conserve un motif abstrait. La géométrie du garde-corps, l’espacement des lampes, les proportions du cylindre et l’intensité magenta demandent encore une comparaison fine et un essai avec les sprites.

**Grissom.** L’asymétrie de la cour, la grande verrière, les rampes et les plantations restent lisibles. Le premier plan est redressé en bande horizontale. Les feuillages, bacs, bancs et articulations architecturales ont été redessinés; la scène n’est pas une restitution de sa topologie. Les petits feux et débris sont incorporés au master.

**Hagalaz.** La superstructure sombre, le capaciteur incliné et les nuages reprennent les captures. Le premier plan est prolongé et nivelé pour le duel. La bande de sol est relativement peu profonde et sombre; l’échelle des combattants et les limites de caméra restent à tester. Les proportions du capaciteur, les câbles et les jonctions de coque ne sont pas validés 1:1. L’ambiance météo et les arcs internes sont incorporés à l’image.

Tous les fichiers conservent le statut **Prototype**. Aucun calque séparé, parallaxe complète, collision, arène jouable ou certification de fidélité 1:1 n’est livré. Le PNG présent, la revue visuelle et l’intégration moteur restent trois états distincts.

## Bekenstein différé

La fiche `stg_me2_bekenstein_hock` reste **Défini**, sans image et sans tentative de génération. Le panorama de Bekenstein et la salle de réception sont documentés, mais la sous-zone de terrasse prévue nécessite encore une capture précise de son sol, de ses garde-corps et de son raccord au bâtiment. Le champ `deferred` du manifeste conserve cette réserve et les références déjà trouvées.

## Sources et traçabilité

- Afterlife : [identification du lieu](https://masseffect.fandom.com/wiki/Afterlife_Club), [article et capture consultés](https://mixmag.asia/feature/best-video-game-nightclubs-gta-cod-call-of-duty-grand-theft-auto-hitman).
- Grissom : [vue du décor dans le portfolio de Graham Kelly](https://irreal.artstation.com/projects/RD3A), [mission ME3](https://masseffect.fandom.com/wiki/Grissom_Academy%3A_Emergency_Evacuation).
- Hagalaz : [galerie de captures du DLC](https://www.gamebanshee.com/masseffect2/imagegallery-lairoftheshadowbroker.php), [capture de composition](https://www.gamebanshee.com/images/sobipro/entries/1680/img_gallery_45_1680_img.jpg), [détail du capaciteur](https://www.gamebanshee.com/images/sobipro/entries/1680/img_gallery_43_1680_img.jpg).

Le [manifeste](stages-manifest.json) contient les chemins, dimensions, empreintes SHA256, rôles et empreintes des références, ainsi que les réserves propres à chaque décor. Les [prompts exacts](stages-generation-prompts.json), le [journal des tentatives](stages-attempts.json) et le [rapport technique](stages-verification.json) complètent la provenance. Les images tierces de référence restent hors du dépôt.
