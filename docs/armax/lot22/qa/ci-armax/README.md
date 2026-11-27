# Vérifications navigateur Armax

Les rapports, journaux, provenances et PNG sont conservés octet pour octet pour chaque exécution. Les chemins des captures dans les JSON proviennent du runner ; les fichiers de même nom figurent dans le répertoire du run. SHA-256 et tailles : [index.json](index.json).

| Run | Version | Résultat | Analyse |
|---|---|---|---|
| [46010749352](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/46010749352) | `b79f5ed4` | 1/6 ; échec | Le clic normal de lancement est intercepté : pointer-events:none hérité du panneau global. Corrigé dans cfd1e104. |
| [46011849232](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/46011849232) | `cfd1e104` | 1/6 ; échec | Le chargement a fini, mais le harnais attend à tort un élément hidden comme visible. Correction du wait sans modifier les assertions dans52052880. |
| [46012230051](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/46012230051) | `52052880` | 1/6 ; échec | Le premier contrôle des dégâts échoue après la commande de déplacement. Diagnostic détaillé ajouté dans6335856. |
| [46014391140](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/46014391140) | `6335856a` | 1/6 ; échec | Les événements prouvent que la navigation globale consomme ArrowRight et déplace le focus. Horloge active, aucune avance. Les captures montrent aussi le miroir absent. Correctifs routage et Mesh dans859fac. |
| [46016000543](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/46016000543) | `859fac83` | 6/6 ; réussi | Premier parcours complet réussi après correction du clic, de la capture des flèches et du miroir. Mara/Tavin et stages01/02 ; contrôle limité, pas de certification globale. Bouton Retour du sélecteur mobile encore coupé sur deux lignes. |
| [46020607485](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/46020607485/job/140578969050) | `f2b756fd` | 6/6 ; réussi | Second parcours complet réussi sur la correction CSS finale. Retour reste sur une ligne ; titre entier et absence de débordement à390×844. Portée limitée à Mara/Tavin et stages01/02. |

## Portée du résultat courant

Le dernier run réussit les six cas sur `f2b756fd` : entrée titre et listes 10/20, déplacement/attaque, pause et blur simulé, CPU, commandes pointer à 390×844 sur la seconde arène, puis retour au titre avec localStorage inchangé. Les treize empreintes de provenance concordent avec les sources finales.

Les captures confirment Mara/Tavin face à face, pieds ancrés au sol, dégâts de 55/90 et bouton Retour sur une ligne. Les poses restent fixes et se chevauchent visuellement au contact. Ce résultat ne certifie pas les dix kits complets, les vingt stages en combat, les routes, boss, FX individuels ou un téléphone physique.

Le [rapport de file](../armax-browser-pending-report.json) décrit l’observation historique de 14:49 UTC ; il n’est pas le résultat courant.
