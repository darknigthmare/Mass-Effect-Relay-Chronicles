# Lot21 — revue indépendante de consolidation après restauration

**Résultat : 47/47 contrôles réussis**, dont 28 contrôles centraux et 19 contrôles ZIP/XML du classeur. Aucun défaut bloquant relevé.

Base examinée : `8542d7ca03702dcf4b3bccd8ac938bd6574f20bc`. Les présents résultats proviennent d’une nouvelle exécution après restauration. Ils ne reprennent pas les comptes de tests antérieurs.

## Identités, comptes et relations

Les 196 identités héritées et leur ordre sont conservés. Leurs noms, catégories, opus, DLC, variantes et usages n’ont pas changé. Les collections de relations de conception, costumes, décors et non-équivalences sont identiques à la base ; les seules évolutions des anciennes associations sont leur source courante, leur projection de production et les liens vers les deux images récupérées.

Le catalogue contient **216 identités, 171 avec image candidate et 45 sans**. Victus et Petrovsky complètent deux anciennes fiches ; huit des vingt ajouts sont illustrés. Il reste 33 manquants dans le périmètre hérité. Les dix PNG livrés sont **sept récupérations et trois générations**, tous retenus comme prototypes. Les cinq appels de génération comprennent trois succès et deux refus sans relance ; aucun fichier vide ni réemploi potentiel ne compte comme PNG livré.

Les 31 exclusions comprennent 30 fiches sans image et Kallo déjà illustré. Les 15 fiches ouvertes incluent quatre pistes de réemploi et onze autres lacunes de référence ou de production. Les 68 rubriques, 204 critères et 40 scénarios planifiés du guide sont conservés, avec zéro scénario exécuté par cette livraison.

## Classeur vérifié en lecture seule

Le classeur est identique à l’export préservé : SHA-256 `0c72622d22bed67d59836477a95006977a5492f485d8b4b462c37f1ee31032c4`. Ses six feuilles, la table `Catalogue!A5:Z221`, les 216 IDs et les colonnes actuelles T–Z concordent avec le catalogue restauré. Les valeurs et formules de Recuperes, Attributions19 et Revue20 sont identiques au lot20. Les identités et colonnes historiques H/R des 196 anciennes lignes sont préservées.

Revue21 couvre 22 fiches, dont les deux refus. Ses 110 formules de liaison vers Catalogue et leurs valeurs en cache sont concordantes. Les totaux 216/171/45, 10=7+3 et 31/30/15/4 sont recalculés depuis les cellules. L’extraction de récupération correspond aux 22 lignes × 26 valeurs du classeur. Ce contrôle n’est pas une exécution de Microsoft Excel natif.

## Provenance, rédaction et limites

- **Autorité actuelle et historique :** Le lien lot20 est historique ; la phrase sur le passage à 45 manquants est corrigée ; remainingCoverage qualifie les 45 manquants courants.
- **Provenance après récupération :** Les octets des dix PNG et du classeur sont préservés. Les documents et scripts sont reconstitués. Plusieurs caches de références ont disparu ; URL, observations antérieures et empreintes seulement quand conservées restent qualifiées dans les revues.
- **Fidélité et intégration :** Dix candidats au statut Prototype ; aucune certification 1:1, aucune intégration moteur. Les réserves sur silhouettes, microdétails, marquages et cadrage restent actives.
- **Classeur :** Contrôle ZIP/XML en lecture seule des valeurs, formules, plages et identités. Les résultats en cache sont contrôlés ; aucune ouverture ou exécution Microsoft Excel native n’est déclarée.

Les dix PNG ont été décodés de nouveau et leurs empreintes comparées aux trois rapports artistiques et au manifeste. Les prompts, sous-manifestes et snapshots courants de l’index correspondent aux fichiers livrés. La relecture des READMEs, de l’index et de la bible distingue le lot21 courant des résultats historiques. Les réserves particulières restent dans les trois revues artistiques ; la récupération technique ne les annule pas.

## Fichiers relus et empreintes

| Fichier | Octets | SHA-256 |
|---|---:|---|
| `docs/armax/lot21/production-catalog.json` | 1297767 | `7b06bd0c4f9e7e6e30dd06bc47318d01a8d4461c4bb652e5fab9a1c221bf60c1` |
| `docs/armax/lot21/art-production/manifest.json` | 38290 | `dc21f5982b6a8fcb4de2222c5af2e801cbb1097dbf04f8b85f85b93dfd16feeb` |
| `docs/armax/bible/content-associations.json` | 387253 | `5f7c23b4d167241ec19ebcd172dd97719564df10cac181713a74babb0d2d2517` |
| `docs/armax/bible/ASSOCIATIONS_CONTENU.md` | 79079 | `c41dbc19d1a322ec2c7298f7dfe8ffdeafa0a9d69a91a0e5066756c3075017de` |
| `docs/armax/bible/BIBLE_ARMAX_INTEGREE.md` | 57298 | `b7be992c45ad15d9e670b5b321a596ccddf98c132c0a57c8a7b89b208097557c` |
| `README.md` | 60048 | `add70d606e15529dde372de081b243db82dcb35066e6d81e5f50ad98a0a0ee2c` |
| `docs/armax/README.md` | 22593 | `bf7ab2a2fb74b9eb7caac021a68835993e1d184e5fad922fd899463c0f8471ed` |
| `docs/armax/lot21/README.md` | 6353 | `9735d5bc921b3245ac1e95913b4f0e16a6801cd5815a330bcbf6d38e40ba9d96` |
| `docs/armax/lot21/BIBLE_COMPLEMENTS_LOT21.md` | 15598 | `bf3dff0664990ece0e47d2192e89692191ce84dcbbbd48feb41af2713a8afd88` |
| `docs/armax/lot21/RECUPERATION_TECHNIQUE.md` | 4732 | `5b2059d109d800c09c79a3a1aed2ed7e98afedeffebf4a4477a8bf614f521441` |
| `docs/armax/lot21/MANQUANTS_2026-11-27.md` | 11820 | `15ee901c182e060deabd34556dcf268f9b538ed150cc0de10fa8bb3407c0c4f9` |
| `docs/armax/bible/guide-coverage-2026-11-27.json` | 89586 | `e307a210d6cf21a5e0d119c744ba169d97a365e7764f7eaf0ae31e81a117d1f6` |
| `docs/armax/lot21/audit/recovered-workbook-entries.json` | 38912 | `02c029584e581b34f10db84b9104311bfdaa5ea5560fb5a36f62ce21c86e025b` |
| `docs/armax/lot21/Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx` | 192616 | `0c72622d22bed67d59836477a95006977a5492f485d8b4b462c37f1ee31032c4` |
| `docs/armax/lot20/Mass_Effect_Armax_Suivi_Lot20_2026-11-27.xlsx` | 166982 | `67127b632801adbe77e3366a4dc311621d9b61f1ff45518bd82c9c10c547cf9c` |

## Reproduction

Commande : `python docs/armax/lot21/qa/review-consolidation.py --write`. Le script ne modifie que les deux rapports de cette revue. Le [JSON détaillé](consolidation-review.json) expose chaque contrôle, sa portée et les preuves associées.
