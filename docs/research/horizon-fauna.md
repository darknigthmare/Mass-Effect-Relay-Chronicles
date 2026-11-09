# Horizon — faune et ravitaillement de Féros

Base : `main` au commit `2ab3f7c10d3bdd9ca04b7a962df9447aee2b3e75`. Ce lot conserve les personnages 2D HD dans les scènes Three.js et les commandes ATB existantes.

## Portée produite

`public/assets/horizon-fauna.png` contient huit corps fixes séparés : varren ME1, alpha varren ME1, créature paisible d’Eden Prime dite gasbag, varren ME2, pyjak de Tuchanka ME2, Dévoreur ME1, adhi sauvage et kaerkyn Andromeda. Le JSON associé conserve les rectangles mesurés, pivots et hauteurs. Le PNG natif RGBA 1536 × 1024 est une copie sans retouche de pixels ; sa provenance et les deux prompts sont dans [horizon-fauna-prompts.json](horizon-fauna-prompts.json).

Seuls le varren et son alpha fournissent deux profils de combat, pour une nouvelle opération annexe à Féros. La créature paisible est réservée à Eden Prime. Les cinq autres corps sont des illustrations de dossiers : aucune adoption, faction, acquisition, rencontre ou campagne supplémentaire n’est créée par leur présence.

La première génération laissait trop peu d’espace entre certaines cellules. Une édition imagegen a conservé les sujets en les séparant davantage. Les rectangles finaux ont huit pixels de marge autour de l’alpha visible au seuil 32, sans chevauchement. Les faibles traces d’alpha générées restent dans les octets natifs. L’aperçu SVG a également reçu un clipPath au rectangle source : un simple viewBox laisse apparaître les cellules voisines dans les bandes latérales des sujets étroits. Cette correction concerne le renderer d’aperçu et ne retouche pas l’image.

## Sources réellement consultées

- [Prima — Feros Assignments](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/spectre-assignments-noveria-and-feros/feros-assignments), HTTP 200. SHA256 HTML : `d8849d86ef0f585a3d05e8ce4ccde038990c943fbfa83bf0338797926cc011a6`. La section de ravitaillement identifie Davin Reynolds, l’alpha et les autres varrens du pont effondré, accessible depuis les tunnels. Elle décrit l’absence de boucliers et le danger supérieur de l’alpha, sans donner d’effectif exact. La courte formule « don't even have shields » confirme l’absence de protection cinétique du groupe.
- [Prima — Objective 2: Head to the Dig Site](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/prologue-normandy-and-eden-prime/objective-2-head-to-the-dig-site), HTTP 200. SHA256 HTML : `600faca354e1e45926ef7c115d3c9ea5aee52e3a76f7dd1c17aa2aca66acce0c`. Le texte et l’image correspondante de l’[extrait officiel PDF](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf), page PDF 9 / guide p.65, ont été ouverts. Le guide place les créatures dociles au nord du débarquement : « Odd creatures mill about just north of the drop zone. » La petite image montre une silhouette gonflée orangée, mais n’en établit pas tous les détails anatomiques.
- Le nom gasbag reste une dénomination à recouper : le passage Prima ne le donne pas. Les pages Fandom Gas Bags et Varren ont répondu HTTP 402. Les trois images JPEG demandées sur le site Prima ont répondu HTTP 403 ; elles ne sont pas présentées comme nouvellement consultées. Les images visibles dans le PDF existant ont été utilisées uniquement comme références, sans extraction livrée au jeu.
- Les quatre dossiers hors ME1 reprennent les identifiants et sources des catalogues ME2/Andromeda existants : `ME2-ENM-VARRREN`, `ME2-SQ-TUCH-PYJAK`, `MEA-ENM-ADHI-WILD`, `MEA-ENM-KAERKYN`. Aucun modèle corporel primaire complet supplémentaire n’a été obtenu pour eux. Ils restent des interprétations graphiques partielles.

## Opération native de ravitaillement

`feros-varrens` ajoute trois étapes aux onze opérations historiques : demande de Davin, affrontement de la meute, rapport. Le combat `feros-varrens-pack` contient deux varrens et un alpha distinct. Ce groupe de trois est une condensation explicitement choisie pour l’ATB ; il ne reproduit pas un compteur original attesté.

Les deux profils sont organiques, sans boucliers, armes humaines ou pouvoirs biotiques. Ils utilisent `strike`, l’assaut organique existant. Le profil alpha est plus robuste et plus dangereux ; les valeurs HP, attaque, défense et vitesse de jauge sont adaptées au prototype. La course, l’encerclement, une animation de morsure dédiée et les dégâts originaux ne sont pas terminés par un corps fixe et cette commande.

Le système existant d’opération gère la progression, le combat armé, la reprise, le rapport et l’attribution unique. Le format de sauvegarde reste en version 1. La nouvelle clé est facultative pour les anciennes parties et les enregistrements présents malformés restent refusés. Une victoire ne verse pas encore les récompenses : seuls le rapport final et sa validation native accordent 70 XP, 80 crédits et quatre points de Conciliation, valeurs de conception adaptées. Le compteur narratif d’aides à la colonie peut atteindre quatre ; il n’ajoute aucun bonus de combat.

La version actuelle exige le premier barrage de Féros sécurisé et une remise avant le Thorien. Prima permet aussi une remise ultérieure si Davin a survécu ; la campagne condensée ne conserve pas son état individuel. Ce cas n’est donc pas déclaré reproduit. Les onze autres opérations, leurs dialogues, coûts, étapes et récompenses restent conservés. Seule la note descriptive de feros-power est actualisée : elle ne doit plus annoncer l’absence d’une meute et d’une quête qui existent désormais. Les deux opérations restent indépendantes.

## Gardes et limites

Les corps de combat ne sont autorisés que pour les identifiants natifs `feros-varrens-pack-0/1` (varrens) et `feros-varrens-pack-2` (alpha), équipe ennemie et contexte ME1/me1. Le renderer confirme également la zone Féros. La présence ambiante de la meute suit son étape active ; elle disparaît après sa résolution. Les gasbags exigent Eden Prime et ME1/me1.

Les dossiers nécessitent l’œuvre et la période exactes. En campagne, le gasbag est connu après la visite d’Eden, le varren après Féros, l’alpha après la demande de Davin et le Dévoreur après le statut de Spectre. Le dossier du Dévoreur ne place aucun animal sur Thérum ou une autre carte existante. Les visuels ME2 et Andromeda passent en plus par les gardes documentaires des Chroniques. Aucun pyjak de l’édition Deluxe, hamster, poisson d’aquarium ou KEI-9 n’est introduit dans le Normandy SR-1.

Les [contrôles techniques et revue native](../qa/horizon-fauna-art.json) portent sur les huit corps fixes. Les tests `tests/horizon-fauna.test.js` et `tests/horizon-fauna-world.test.js` vérifient les profils, l’isolation de contexte, les dossiers, les gardes de combat, une véritable victoire ATB de l’opération, les reprises et les récompenses uniques. Le parcours public complet sera collecté séparément, avec ses fixtures et ses limites ; les contrôles de règles ne sont pas présentés comme une promenade ou une partie publique jouée.

Les apparences, costumes, proportions, cycles et comportements originaux restent Prototype. Aucune fidélité artistique ou mécanique intégrale 1:1 n’est certifiée.
