# Lot21 — reconstitution technique avant publication

La copie de travail placée dans un répertoire temporaire a disparu avant l’envoi vers GitHub. La branche publiée est restée au commit `8542d7ca03702dcf4b3bccd8ac938bd6574f20bc`. Une nouvelle copie réelle a été créée depuis cette base, dans le répertoire de travail persistant. Aucune suppression ni altération de la copie originale du projet n’a été effectuée.

## Éléments récupérés sans changement d’octets

- Les sept PNG et sept prompts non publiés ont été retrouvés dans la copie de travail originale du lot20.
- Le résultat natif du Locust a été récupéré depuis la data URI conservée par le résultat de génération. Son prompt exact a été retrouvé dans l’état de la session.
- Les PNG du Phalanx et du Swarmer ont été retrouvés dans les sorties natives du générateur ; leurs quatre prompts (dont deux refus) ont été récupérés depuis l’état de la session.
- Le classeur final du lot21 et son inspection étaient déjà copiés hors du répertoire temporaire. Le classeur est restauré sans réexport ni modification de ses octets.

| Sujet | SHA-256 du PNG restauré | Origine |
|---|---|---|
| Adrien Victus | `fc97a3a81be43dc3086dcbd9888d0e25f00be2fde6c50b1b74a517d5888f4765` | PNG antérieur non publié |
| Oleg Petrovsky | `10aa19a9a6e190f53c50017c14da7ab80f602478f24c7b5c7389b0e8259cd55c` | PNG antérieur non publié |
| Harvester transformé par les Moissonneurs | `d8b4f01a50b9ff05d46388c35173c075b0d62d21b49c26dc10bf08c43c367b8b` | PNG antérieur non publié |
| Geth Bomber | `2ab652eed5a227145e78b75d5897b22d75f820d8f94a460512057f5d6c8ffba9` | PNG antérieur non publié |
| Seeker | `2c9f9a2405b24464757017ed169479654e0fd2ebc57580bfa70780aa9b452ce7` | PNG antérieur non publié |
| M-300 Claymore | `4a8ed2c088251b4ddbb0a4830f96149e83d0932be052cae318ef72dc2fa004a2` | PNG antérieur non publié |
| M-22 Eviscerator | `88d66aee1e509e42c447725d28a68a4cd57bc288e002c33a952f2ddab1a01713` | PNG antérieur non publié |
| M-12 Locust | `a5cfffe37605b4856de8d1461eeba35acfa2730cceab7251537f4fac4582cdfe` | Résultat natif de cette passe |
| M-5 Phalanx | `cd9cd67a25a140cb3be0de15b59046571fc77aec467146a54476c8fe12698f53` | Résultat natif de cette passe |
| Swarmer | `a70013df5825747a15e3395d31eb0e46c659e2d0fc8c9bc2d6361c58aae5414d` | Résultat natif de cette passe |

**Classeur conservé :** `0c72622d22bed67d59836477a95006977a5492f485d8b4b462c37f1ee31032c4`.

## Documents reconstitués et limites de provenance

Le catalogue et les projections de bible repartent du lot20 publié. Les vingt nouvelles identités et les deux lignes héritées actualisées sont reconstituées à partir des vingt-six colonnes exactes du classeur final conservé : [extraction en lecture seule](audit/recovered-workbook-entries.json). Les noms, variantes, sources, notes, présence et ordre sont donc rattachés à un fichier préservé, et non à une nouvelle liste inventée.

Les manifestes, rapports de revue et scripts ont été réécrits à partir des traces de la session, des fichiers conservés et de nouvelles mesures. Ils ne sont pas présentés comme les octets des fichiers temporaires disparus. Les rapports artistiques conservent les observations précédentes et distinguent les références encore disponibles des caches perdus. Les dix aperçus clair/sombre sont reconstruits à partir des PNG natifs et inspectés à nouveau.

Les empreintes de certaines références tierces ne sont plus récupérables : elles restent `null` ou explicitement non retrouvées. Les URL, l’inspection historique et les limites de résolution restent consignées. Aucune empreinte manquante n’est inventée, aucun accès refusé n’est contourné et aucune génération n’est relancée pour compenser la perte de fichiers.

Les deux refus de génération (Mattock et Suppressor) restent conservés avec leurs identifiants. Le fichier de sortie vide observé n’est pas compté comme une image. Les appels réellement effectués restent cinq : trois réussites et deux refus.

## Contrôles après restauration

Le rapport [verification.json](verification.json), le [contrôle du classeur](workbook-verification.json) et la [revue indépendante](qa/consolidation-review.json) portent sur les fichiers effectivement restaurés et leurs nouvelles empreintes. Les contrôles passés avant la perte ne sont pas utilisés seuls pour certifier le nouvel ensemble. Le nombre de contrôles publiés est celui de la dernière exécution du script.

Les images restent des prototypes, sans fidélité 1:1 ni intégration moteur validées. La récupération technique ne ferme aucune réserve visuelle ou fonctionnelle.
