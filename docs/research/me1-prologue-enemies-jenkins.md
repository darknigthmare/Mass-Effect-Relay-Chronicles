# Jenkins ME1 — quatre poses de combat

La famille [companion-jenkins-combat.png](../../public/assets/companion-jenkins-combat.png) prolonge le Jenkins du prototype : quatrième cellule de la première ligne du [crew-atlas](../../public/assets/crew-atlas.png), rectangle `[1152, 0, 384, 512]`. Le casque fermé autour du visage, l’armure Alliance charbon/gris ardoise, les panneaux d’acier et le petit accent d’épaule sont conservés. Aucun insigne N7 ni bande rouge de Shepard n’est ajouté. L’atlas Ashley sert uniquement de référence de finition HD, d’éclairage et de composition ; son identité et sa tenue ne sont pas reprises.

Une seule génération a été nécessaire. Le [prompt exact](me1-prologue-enemies-jenkins-exactprompts.json) demande quatre corps entiers, fond transparent natif et séparation des états. La sortie `exec-d5567167-ad76-4301-b2ad-4d9c7460df78.png` est conservée sous `/workspace/generated_images/` et copiée octet pour octet. Aucun redimensionnement, détourage, recoloriage, assemblage ou nettoyage alpha n’est appliqué. Les zones chiffrées du prompt ne sont pas reproduites exactement ; les rectangles irréguliers sont mesurés sur la sortie réelle et restent séparés.

| Contrôle de source | Résultat |
|---|---|
| Format natif | RGBA, 1 536 × 1 024 |
| SHA-256 du PNG | `1be179bc6722a4e74d9f6f9b417afd269789c6caa2828f4d2f3e08766c125f72` |
| Dessins | Visée, geste tactique, impact, KO de combat |
| Alpha natif | De 0 à 254 ; 1 267 650 pixels entièrement transparents |
| Seuil du renderer | Quatre composants à partir de 51/255 ; 277 593 pixels visibles |
| Cadres | Huit pixels de marge autour de chaque silhouette visible |
| Découpage | Aucun pixel visible partagé, non assigné, coupé ou provenant d’une pose voisine |

Les [métadonnées](../../public/assets/companion-jenkins-animation.json) décrivent rectangles, pivots et hauteurs. Les pivots debout sont placés entre les zones basses des bottes ; les poses debout gardent une unité de dessin commune. L’impact est plus bas car les genoux sont fléchis. La longueur couchée reprend la convention déjà employée pour les compagnons : une longueur corporelle proche de la hauteur debout, sans étirement des pixels.

Deux aperçus ont été réellement ouverts : [PNG natif à l’échelle 1:1 dans Chromium](../qa/me1-prologue-enemies-jenkins-source-preview.png) et [cadres à hauteur de référence 110 pixels](../qa/me1-prologue-enemies-jenkins-scale-preview.png). Ils utilisent la même image inchangée, un damier ou deux fonds de contrôle et les rectangles CSS mesurés. Ce sont des contrôles de source, pas des captures du jeu ni une preuve d’intégration. L’aperçu RGBA direct de `view_image` présentait initialement un fond sombre sans les silhouettes ; le chargement natif dans Chromium et les valeurs RGB/alpha ont permis leur inspection réelle, sans modifier le fichier.

Les quatre silhouettes sont complètes, le casque et les masses d’armure restent cohérents, les bottes gardent leur ancrage et les états se distinguent à petite échelle. Le fusil illustré est générique et ne représente pas nécessairement l’arme équipée. Les détails du visage, du casque et des panneaux d’armure restent des interprétations de la référence du prototype.

Le cadre `power` représente un geste neutre de halte ou d’appui, sans lumière biotique ni OmniTech. Le kit natif de Jenkins conserve sa liste `powers: []` ; le dessin ne crée aucune aptitude. La commande Couverture existante peut employer ce geste par le mécanisme de présentation courant. L’intégration, les événements natifs et les sauvegardes doivent être vérifiés dans leur rapport distinct.

## Référence primaire et portée narrative

Le [guide Prima officiel du prologue](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) a été téléchargé de nouveau avec HTTP 200 : 4 677 689 octets, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. Le texte de la page PDF 8 confirme le groupe initial avec Kaidan et Jenkins ; la page PDF 9 décrit la mort de Jenkins sous le feu des drones. Les pages PDF 9 et 12 ont aussi été ouvertes visuellement. La note de la page PDF 12 distingue explicitement cette mort scénaristique du retour des autres équipiers après un KO. Les petites captures de ce document ne constituent pas un relevé complet et identifiable du corps, du casque et des matériaux de Jenkins.

La pose `down` n’illustre qu’un KO de combat. Elle ne révoque jamais la mort scénaristique persistante, ne rend pas Jenkins recruté dans un autre épisode et ne lui donne pas accès aux Chroniques. Le statut reste **Prototype** ; les références corporelles primaires complètes, les autres directions, transitions et cycles animés restent à produire. Aucune fidélité artistique intégrale **1:1** n’est certifiée.

Le [rapport artistique](../qa/me1-prologue-enemies-jenkins-art.json) contient les mesures, les empreintes et les limites. Le guide méthodologique `create-game-assets`, son registre épinglé et ses références art-direction/raster-pipeline/provenance ont été lus à la révision `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` ; aucun script upstream n’est exécuté ni importé dans le moteur.
