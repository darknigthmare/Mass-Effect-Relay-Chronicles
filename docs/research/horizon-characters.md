# PNJ Horizon — ME1

Ce lot ajoute huit interlocuteurs d’information et huit corps fixes : Fai Dan, Arcelia Silva Martinez, Macha Doyle et Davin Reynolds à Zhu’s Hope ; l’exécuteur Pallin, Harkin, Barla Von et le docteur Chloé Michel à la Citadelle. Les seize sujets sont des textes français réécrits, sans citation du jeu original, récompense ou recrutement.

Les quatre habitants de Féros sont présents après la Citadelle et l’obtention du statut de Spectre, puis disparaissent de ce groupe de conversations dès la victoire contre le Thorien. Cette borne évite notamment de faire revenir Fai Dan et d’inventer la survie individuelle de colons après une résolution par la force. Les sujets déjà lus restent un historique valide après cette disparition. Les quatre interlocuteurs de la Citadelle demandent la fin d’Eden Prime et leur propre zone. Les médias et périodes explicitement étrangers sont refusés.

Les métadonnées relient Fai Dan à `feros-geth-tunnels`, Macha à `feros-water`, Michel à `citadel-doctor-michel` et Davin à `feros-varrens`. Un échange d’information ne complète ni ne récompense ces opérations. Les textes de maintenance évitent de déclarer une panne toujours active après une réparation. Les anciens critères de production — vannes, récompense des varrens, piste Garrus, etc. — conservent leur portée.

## Art natif et limites

`public/assets/horizon-npcs.png` est la copie exacte de la génération native RGBA 1536 × 1024. Le [prompt exact](horizon-characters-prompt.txt), sa [provenance](horizon-characters-prompts.json) et le [contrôle technique/visuel](../qa/horizon-characters-art.json) sont conservés. Aucun pixel n’est retouché. Les huit rectangles sont mesurés sur l’alpha ≥ 32 avec huit pixels de marge ; Pallin commence trois pixels avant la limite théorique de la deuxième rangée, sans chevauchement d’une autre région. Les pieds utilisent un pivot mesuré ; les hauteurs relatives distinguent le Volus court du Turien.

Les silhouettes sont des propositions de prototype : six humains en vêtements civils/médicaux, un Turien du SSC et un Volus en combinaison pressurisée. Visages, coiffures, uniformes, couleurs exactes et anatomies détaillées ne sont pas certifiés 1:1. Une pose de corps ne constitue pas un cycle de marche ou une animation de conversation.

Les aperçus natifs et à taille de terrain ont été réellement ouverts. Le premier aperçu SVG à petite taille affichait des fragments voisins dans les marges de son viewport ; le harness a été corrigé avec un `clipPath` exact et les captures précédentes restent distinctes. Le renderer des dialogues utilise lui aussi un cadrage strict. Le [parcours final des huit contacts](../qa/horizon-characters-dev-final-01-report.json) vérifie seize sujets, huit autosauvegardes et les quatre ouvertures de demandes suivies d’une annulation sans récompense. Sa [revue distincte](../qa/horizon-characters-dev-final-01-visual-review.json) atteste l’ouverture réelle des huit captures. Les approches sont placées par le hook QA ; les routes et les victoires préparées dans les fixtures ne sont pas présentées comme jouées par ce parcours.

## Références

- Les huit identifiants, rôles et critères proviennent des fiches existantes du [catalogue principal](../content-catalog.json). Sa référence `PRIMA-PROLOGUE` est un point de départ général, sans relevé corporel complet pour ces huit personnes.
- Les opérations Macha/Fai Dan/Michel existaient avant ce lot : voir les [sources des opérations](operations-sources.md) et les définitions natives. Elles ne deviennent pas huit nouvelles quêtes.
- Une tentative de lecture de `https://masseffect.fandom.com/wiki/Fai_Dan` pendant ce lot a répondu **HTTP 402**. Son contenu n’est pas présenté comme nouvellement consulté.
- Méthode : `create-game-assets` et `dialogue-systems` à la révision épinglée `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` du guide gamedev. Ces lectures n’apportent pas une référence canonique d’apparence.
