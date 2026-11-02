# Husk ME1 — quatre poses fixes

Le lot du 2 novembre 2026 reprend le husk déjà représenté dans la deuxième cellule supérieure de [l’atlas ennemi](../../public/assets/enemy-atlas.png). Sa silhouette humanoïde maigre, son crâne nu, ses yeux bleus, ses conduits cybernétiques et ses mains nues restent reconnaissables. Il ne porte aucune arme. La cible reste le renderer Three.js 0.180.0, ses sprites HD et son alpha-test 0,2.

Le [guide Prima officiel du prologue](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) a été téléchargé le 2 novembre : 4 677 689 octets, 23 pages, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. La page PDF 12, imprimée 68, a été rendue et réellement ouverte. Sa notice **Husk** contient un petit buste gris à yeux et implants bleus ; le texte décrit les attaques de mêlée et Tesla Pulse, sans attaque à distance. La page PDF 11 montre aussi des corps sur les pics dans une capture de contexte. Ces petites vues ne forment pas une planche anatomique complète et ne valident pas les doigts, les pieds, les proportions ou tous les conduits des nouveaux dessins. Les attaques du guide ne sont pas accordées par les images.

Les [prompts exacts](me1-enemy-poses-husk-prompts.json) indiquent les deux références réellement fournies à `image_gen.imagegen` : atlas du prototype et page Prima nommée. Une seule génération a produit le [PNG natif](../../public/assets/enemy-husk-combat.png), RGBA 1536 × 1024, copié sans retouche depuis `/workspace/generated_images/exec-5d0a0678-75ca-435c-9519-0b354bcdaca6.png`. SHA-256 livré : `bcd2977ce016f3cff2b320e02fd5b342ca3ee44426d3d2c48d4885f1965e35ff`. La copie livrée est identique octet par octet à la sortie native.

| État | Dessin | Rectangle `[x,y,largeur,hauteur]` |
|---|---|---|
| `aim` | Attente courbée et mains ouvertes, sans arme | `[180,0,450,510]` |
| `power` | Geste de frappe de mêlée, sans effet incorporé | `[770,35,735,485]` |
| `hit` | Recul d’impact, genoux fléchis | `[175,510,445,504]` |
| `down` | Corps entier couché sur le côté, tête à gauche | `[790,760,726,216]` |

Les [métadonnées](../../public/assets/enemy-husk-animation.json) utilisent les cadres réellement mesurés et des pivots propres à chaque appui. Les rapports de hauteur gardent la même échelle par pixel entre les poses ; les différences de hauteur visible correspondent au geste courbé ou couché. Le PNG n’a pas été découpé, nettoyé ou redimensionné.

Le [contrôle technique](../qa/me1-enemy-poses-husk-art.json), reproductible avec `python scripts/check-me1-geth-husk-art.py`, passe : 285 651 pixels visibles au seuil alpha 51, quatre composantes entières, aucun pixel visible non attribué ou partagé et aucune silhouette touchant le bord de son cadre. Les 65 347 pixels natifs d’alpha 1–50 restent conservés. Le PNG a été ouvert à sa résolution d’origine : les quatre corps sont entiers, les poses distinctes et le husk reste sans arme. Le rapport sépare cette inspection des futurs contrôles du renderer.

Cette famille reste un **Prototype** à quatre poses fixes sous un seul angle. Les mouvements nerveux, cycles de frappe, transitions, directions et anatomie exacte restent à produire ou à vérifier. Le mot technique `power` désigne ici le dessin du geste ; il ne fournit aucun pouvoir ni attaque électrique au personnage. Aucun effet, statistique ou équipement ne provient de cette illustration. Aucune fidélité artistique intégrale 1:1 n’est certifiée.
