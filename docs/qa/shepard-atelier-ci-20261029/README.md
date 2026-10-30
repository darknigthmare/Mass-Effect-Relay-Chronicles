# Preuves des contrôles Shepard et atelier — 29 octobre 2026

Les 33 fichiers de l’artefact **Relay-Chronicles-Shepard-Atelier** sont copiés ici octet pour octet. Ils proviennent de l’[exécution CI 40921772352](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/40921772352), [job navigateur 123616630701](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/40921772352/job/123616630701), réussie sur le [commit 756ed424fb13c9abb8ef34fbac0c1293263b2389](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/commit/756ed424fb13c9abb8ef34fbac0c1293263b2389).

| Rapport | Résultat | Portée |
|---|---:|---|
| [Rendu WorldView](shepard-combat-world-report.json) | 12 contrôles réussis | Scène isolée du renderer en développement, poses masculines/féminines, couleurs et casque. |
| [Navigation clavier](customization-keyboard-report.json) | 14 contrôles réussis | Atelier en développement, ordinateur et viewport mobile avec texte agrandi. |
| [Build de production](customization-poses-production-report.json) | 7 contrôles réussis | 18 aperçus, 4 captures, application, annulation par Échap, exports et reprise après fermeture complète de Chromium. |

Les trois rapports indiquent `passed: true`, sans erreur JavaScript ni requête échouée. Leurs 26 références d’empreintes couvrent 16 fichiers source distincts et correspondent toutes aux contenus du **commit testé `756ed42`**, vérifiés dans Git. Cette vérification historique reste rattachée à ce commit ; le script de production corrigé est vérifié séparément ci-dessous. Les exports de sauvegarde proviennent de fixtures synthétiques importées par les scénarios ; ils ne représentent pas une progression acquise dans la campagne.

## Validation de suivi après correction de disponibilité

L’[exécution CI 40925514808](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/40925514808), [job navigateur 123629834800](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/40925514808/job/123629834800), réussit sur le [commit `ea396cbbb0cbe3e804438d00b12e813790de1f25`](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/commit/ea396cbbb0cbe3e804438d00b12e813790de1f25). Le sous-dossier `validation-ea396cb/` conserve une **sélection de 12 copies exactes** : les trois rapports, une fixture synthétique, quatre exports de sauvegarde et quatre captures de production.

| Rapport de suivi | Résultat |
|---|---:|
| [Rendu WorldView](validation-ea396cb/shepard-combat-world-report.json) | 12 contrôles réussis |
| [Navigation clavier](validation-ea396cb/customization-keyboard-report.json) | 14 contrôles réussis |
| [Build de production](validation-ea396cb/customization-poses-production-report.json) | 7 contrôles réussis, 18 aperçus et 4 captures |

Les trois rapports indiquent `passed: true`, sans erreur JavaScript ni requête échouée. Le rapport de production consigne **six transitions de focus observées** : trois ouvertures avec le focus initial sur Personnage et trois retours à Pause avec le focus sur l’entrée de personnalisation, toutes avec `focused: true`. L’attente de disponibilité du scénario corrige la course de focus conservée dans la tentative précédente ; ce nouveau passage valide le scénario après cette correction.

Les 26 références d’empreintes des trois nouveaux rapports couvrent 16 sources distinctes et correspondent aux fichiers du dépôt courant, au HEAD `ea396cbbb0cbe3e804438d00b12e813790de1f25`, lors de cet archivage. Parmi ces sources renseignées, seule l’empreinte du script `scripts/customization-poses-production.mjs` diffère de celle de la première CI réussie : elle vaut désormais `a47461a030234b9bc6ebfb0f98808ac2071846c84915ad9575f4d4697b8623ac`.

L’artefact de suivi porte l’ID **12921140386**. Son ZIP mesure **10 147 090 octets** et son SHA-256 vérifié est `ce6a0a58daa864d4e2b646b0ec79ff886ce34db4ed7f37b36638efce4fb47303`. Les captures WorldView/clavier et les journaux de cette répétition restent dans l’artefact CI complet. Les 33 preuves originales et les six fichiers historiques sont conservés sans modification.

## Provenance et chemins

L’artefact porte l’ID **12918492832**. Le ZIP téléchargé mesure **10 148 270 octets** et son SHA-256 est `e46e2316cc0c97e5425839278c48c6d77f9351680bd55e68b8b778911dc130f2`. Le [manifeste](manifest.json) donne la taille et l’empreinte de chacune des 51 copies, leurs origines et le détail des contrôles de sources.

Les rapports n’ont pas été réécrits : leurs chemins `test-results/...`, chemins de runner, chemins de build et métadonnées de profil restent ceux de l’exécution originale. Pour les fichiers de la CI réussie, le nom après `test-results/` désigne le même fichier dans ce dossier. Les six fichiers historiques sont renommés dans `prior-attempts/` ; le manifeste conserve leur chemin original. Pour le suivi, les 12 fichiers sélectionnés gardent leur nom dans `validation-ea396cb/`. Les autres chemins `test-results/...` des rapports de suivi se rapportent à l’artefact complet de cette exécution. Le ZIP et les profils persistants de navigateur ne font pas partie de cette archive documentaire.

## Tentatives précédentes conservées

- [Rapport clavier initial](prior-attempts/keyboard-ci-attempt-1-report.json) et [capture associée](prior-attempts/keyboard-ci-attempt-1.png) : [exécution 40920729223](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/40920729223), commit `875802def8bdbc17b2ba8708ceff5f5949fa5489`, artefact **12917977233**. Le test s’est arrêté sur un faux découpage de visibilité de `body`. Son calcul a été corrigé avant l’exécution réussie ; l’échec original est conservé.
- [Production locale, tentative 1](prior-attempts/production-local-attempt-1.json) et [tentative 2](prior-attempts/production-local-attempt-2.json) : essais interrompus par des délais d’attente, respectivement sur une action de clic et la lecture d’un aperçu. Ils ont tourné sur un **arbre de travail modifié non commité**, basé sur `79f3567eb5ce89d8f6873c96ee27a16333821e86`. Leurs champs `sourceHead` et `baseMain` désignent ce HEAD de départ ; ces rapports ne sont **pas des preuves d’exécution du commit 79f3567**. Les empreintes capturées des fichiers restent dans les rapports originaux.

- [Répétition CI de production, tentative 3](prior-attempts/production-ci-focus-attempt-3-report.json) et [capture d’échec](prior-attempts/production-ci-focus-attempt-3.png) : [exécution 40924555822](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/40924555822), [job 123626466814](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/40924555822/job/123626466814), commit `fcf3c95b11984c828f6e8ca3d2ce3d8dd74c0860`, artefact **12920610106**, SHA-256 du ZIP `44233697cd1b19a7002e445d658a4b1e08ad6dcb4f9352ed0cd9a814a0b79950`. Sur le même code de jeu que `756ed42`, les 12 contrôles WorldView et les 14 contrôles clavier réussissent, mais la production échoue avant le premier aperçu : le focus **Armure** est repris par le focus initial **Personnage** planifié via `requestAnimationFrame`, visible dans la capture. La correction concerne l’attente de disponibilité du test ; elle est validée par l’exécution réussie `40925514808` sur `ea396cb`, conservée dans `validation-ea396cb/`. Cet échec historique reste inchangé.

## Limites

Ces trois scénarios ont des périmètres distincts et limités. Le rendu WorldView n’est pas un parcours de campagne ; le contrôle clavier porte sur le développement ; le contrôle du build n’est pas un test exhaustif de l’ordre de tabulation ni des événements de combat. Aucun lancement Windows, test d’Excel natif, appareil mobile physique, manette ou mesure de performance n’est revendiqué.

L’égalité pixel à pixel après reprise porte sur le canvas d’aperçu Hors combat. La mesure chiffrée du contexte WebGL précède la première fermeture ; la capture réelle du terrain après reprise fournit une preuve visuelle distincte. L’annulation d’un brouillon modifié est vérifiée par Échap ; le bouton Annuler est activé ensuite, sans deuxième export d’un autre brouillon modifié.

Les assets restent **Prototype** : quatre poses clés par apparence, fusil illustré générique, transitions et variantes exactes d’équipement à produire. Le casque et les couleurs utilisent une recoloration heuristique ; l’alignement artistique de la visière sur les yeux, notamment avec des cheveux longs, n’est pas certifié. Ces contrôles ne certifient pas une fidélité artistique 1:1.
