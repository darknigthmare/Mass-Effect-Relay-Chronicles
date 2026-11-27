## Pourquoi

La bible doit relier les images fixes à leur usage dans notre jeu de combat et distinguer les composants encore manquants des identités déjà illustrées. Le lot 16 complète Port Hanshan et l’Homme Trouble à partir du dernier état effectivement publié.

**Le lot 15 annoncé précédemment n’est pas publié : son archive et ses originaux n’ont pas été retrouvés dans les sources accessibles.** Ses 113 PNG rapportés ne sont donc pas comptés présents. Le dossier de récupération conserve le reçu connu et l’empreinte attendue de l’archive ; le lot 16 possède sa propre provenance.

## Ce que cette continuation apporte

- **6 PNG natifs, 5 versions retenues** : architecture distante PH-20, structures arrière PH-30, sol PH-40 R1, fauteuil de l’Homme Trouble et pose assise avec siège. Le sol R0 est conservé en historique après correction de son raccord.
- **4 nouvelles fiches de composants**, plus une pose ajoutée à `chr_me2_illusive_man`. Les 188 identités héritées, leurs six champs d’identité et leurs fichiers restent conservés.
- **192 fiches : 132 avec image candidate, 60 sans.** La catégorie des décors contient 52 masters de sous-zones et 3 calques de la même arène Port Hanshan. Le corpus documenté atteint 231 PNG originaux, révisions incluses.
- **Associations à la bible** : G/J pour les calques, B/F/J pour le fauteuil et la présence narrative de l’Homme Trouble. La pose assise ne crée aucun nouveau combattant ou pouvoir. Les 30 rubriques, 90 critères, règles communes, kits et 36 briefs narratifs gardent leur portée.
- Catalogue, manquants, prompts exacts, références inspectées, manifestes, revues et classeur `Synthese / Catalogue / Recuperes` actualisés.

## Vérification

Les six copies correspondent aux octets natifs par SHA-256. Dimensions, alpha, références et sélections sont vérifiés. La présence des 225 originaux historiques est contrôlée dans l’arbre Git, sans confondre un checkout partiel avec une absence au dépôt.

La relecture indépendante du catalogue compare **1 128 champs d’identité** et conserve les mêmes 60 identifiants sans image. Les 26 exclusions sont qualifiées selon leur preuve : 13 documentées dans le catalogue publié, 13 rapportées dans le contexte précédent dont les journaux originaux restent indisponibles. Aucun nouvel essai ne les concerne.

Le classeur est recalculé avec artifact-tool, sérialisé à partir de son modèle et relu avec un lecteur indépendant. **5 198 cellules et 36 caches de formules** sont comparés. Le changement temporaire d’une présence donne **132/60 → 131/61 → 132/60** après restauration. Le style natif du lot 14 est conservé et les trois feuilles sont relues visuellement.

La vérification finale passe **38 contrôles et 559 liens locaux**, sans erreur. Les contrôles de cette livraison sont reproductibles avec `python scripts/verify-armax-lot16.py`. Le rapport final distingue les contrôles d’images, de données, de classeur et de liens des validations moteur qui restent ouvertes.

## Réserves

Tous les nouveaux actifs restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`. Le sol Port Hanshan conserve un écart d’un pixel en largeur et une transparence résiduelle de jonction. PH-20 garde un petit îlot alpha et certaines franges. La composition complète n’est pas validée.

Le fauteuil seul et le fauteuil inclus dans la pose assise diffèrent légèrement ; ils constituent des images séparées, sans compatibilité de superposition annoncée. Les surfaces cachées, les détails du visage et les iris restent à comparer au jeu. Thane loyauté et le drone exact de Legion restent soumis à leurs références manquantes.

Les lots 13–14 et leurs résultats historiques restent consultables. Aucune ouverture dans Excel natif, animation complète, validation Windows ou fidélité intégrale n’est revendiquée pour le lot 16. **La PR reste ouverte, sans fusion.**

## Livrables

- [Lot 16, galerie et bilan](README.md).
- [Catalogue](production-catalog.json), [manquants](MANQUANTS_2026-11-25.md) et [classeur](Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx).
- [Associations du contenu à la bible](../bible/ASSOCIATIONS_CONTENU.md).
- [Vérification finale](verification.json), [vérification du classeur](workbook-verification.json) et [audit indépendant](qa/catalogue-independent-review.json).
- [Récupération du lot 15](RECUPERATION_LOT15.md).
