# Phases de boss ME1 — adaptation ATB

Base de travail : `main` à `259d51267a64404048c1e18a1e549f5a356b63c6`. Le module ajoute un séquençage de combat à Bénézia et au Thorien. Les personnages, les images, les statistiques des profils de base et les récompenses de campagne ne sont pas remplacés. Les résultats restent **Prototype** : les phases, les effectifs et la géographie du jeu original ne sont pas certifiés 1:1.

## Sources effectivement examinées

Le guide méthodologique `rpg` épinglé par le projet a été relu dans `/tmp/relay-guides/rpg.md`, avec `AGENTS.md`, `GAMEDEV_GUIDANCE.md`, `ART_BRIEFS.md` et la recherche historique `frontier-bosses.md`.

L’extrait Prima officiel disponible localement a été inspecté : **23 pages, 4 677 689 octets**, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. Le sommaire renvoie à la confrontation Bénézia à la page imprimée 136 et à la destruction du Thorien à la page 156. Ces pages ne figurent pas dans cet extrait. Il ne prouve donc ni les effectifs de vagues, ni le nombre de nœuds, ni les seuils numériques du combat original.

URL de cet extrait : `https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf`.

Les trois lectures HTTP du 13 novembre 2026 ont retourné **402**, sans contenu de quête consultable :

- `https://masseffect.fandom.com/wiki/Noveria:_Matriarch_Benezia`
- `https://masseffect.fandom.com/wiki/Feros:_The_Thorian`
- `https://masseffect.fandom.com/wiki/Race_Against_Time:_Sovereign`

Le séquençage reprend des principes connus — Bénézia protégée pendant ses renforts, objectifs neuraux du Thorien — mais les compteurs et leur restitution ATB ci-dessous sont des **choix du prototype à recouper**, pas des relevés de ces pages inaccessibles. Aucune mécanique supplémentaire de Saren n’est déduite de l’extrait ou d’une URL non consultée.

## Bénézia

La formation de départ reste issue des profils Bénézia et commando asari. Le budget de l’escorte est réparti en **trois adversaires successifs** ; un seul est présent au début. Avec les profils non amplifiés : Bénézia conserve **340 PV / 170 bouclier**, chaque escorte reçoit **50 PV / 20 bouclier**. L’ensemble conserve donc **490 PV / 230 bouclier nominal**. La répartition suit les valeurs réellement fournies à la bataille, y compris leur amplification de campagne.

Pendant les trois vagues, une tentative de ciblage hostile direct de Bénézia est refusée avant les coûts, la jauge ATB et le RNG. Les dégâts de zone, persistants et autonomes utilisent le même verrou. Ses pouvoirs existants restent actifs. Chaque escorte doit réellement être neutralisée pour insérer la suivante. Après la troisième, la protection est levée ; Bénézia garde sa santé, son bouclier, ses statuts et ses recharges courants. Aucun soin de transition n’est ajouté.

Ce prototype ne réalise pas le dialogue intermédiaire original, la barre de puissance originale, la composition complète des renforts ou les déplacements de la scène. Les trois vagues ne sont pas déclarées comme une reproduction exhaustive du combat original.

## Thorien

Le budget du Thorien devient **six objectifs neuraux successifs**, passifs, à la même ancre tactique. Avec le profil non amplifié, chacun reçoit **70 PV**, pour **420 PV** au total. Le budget du rampant existant devient trois renforts de **125 / 3 PV**, introduits avec les nœuds 1, 3 et 5. Le total nominal reste donc **545 PV / aucun bouclier**.

Un nœud ne dispose d’aucun ordre autonome ou manuel ; l’ancien jet d’acide du profil ne devient pas une attaque de nœud. Les nœuds ne reçoivent pas de nouvelle invulnérabilité conditionnée aux rampants. La destruction réelle du nœud actif insère le suivant avant le calcul de victoire. Les rampants déjà actifs survivent à cette transition. Après le sixième nœud, ils doivent aussi être neutralisés pour obtenir la victoire.

L’illustration existante du Thorien sert aux six objectifs : elle ne constitue pas six modèles originaux de nœuds. Le plan ne reconstruit pas les étages du repaire ; les clones asari, Shiala et la persistance du Cypher restent ouverts. Les cinq anciens corps neuraux et les renforts tombés sont masqués par `bossPhaseRetired`, tandis que leurs acteurs demeurent dans l’historique natif. Le dernier nœud peut garder sa pose finale.

## Isolation et raccord

`createBattle({bossPhases:true})` est demandé explicitement par la campagne. Par défaut, les phases sont désactivées. Le plan refuse les acteurs portant un autre média ou une autre période, les autres boss et les formations qui ne correspondent pas exactement aux deux profils attendus. Il ne transforme pas les Chroniques ni les rencontres de Saren.

Le module `src/boss-phases.js` reste pur :

| Fonction | Rôle |
|---|---|
| `createBossPhasePlan` | Copie les acteurs normalisés, répartit les budgets et retourne l’état initial et les événements. |
| `advanceBossPhases` | Retourne le prochain état, les nouveaux acteurs et les corps à masquer, sans modifier la bataille. |
| `getBossTargetReason` / `bossDamageBlocked` | Verrou commun de ciblage et de dégâts de Bénézia. |
| `bossActorCanAct` | Interdit les ordres des objectifs neuraux passifs. |
| `getBossPhaseView` | Fournit le titre, l’instruction et la cible d’objectif au HUD. |

`src/combat.js` normalise et ajoute les acteurs, émet les événements, puis calcule l’issue. Il reste l’unique propriétaire du moteur, des coûts et du RNG. Les nouvelles identités gardent la forme native `sprite-N` pour les gardes d’atlas. Les nouveaux nœuds reprennent `tacticalAnchorId` de l’acteur initial ; chaque identité reste unique, même si un autre combattant utilise un numéro envisagé.

Les transitions ne donnent ni XP, ni crédits, ni victoire intermédiaire. La résolution de campagne et sa récompense unique restent attachées à l’identifiant de rencontre existant. La campagne n’enregistre pas un combat en cours : une reprise conserve son point de sauvegarde antérieur comme auparavant.

## Contrôles et portée

`node --test tests/boss-phases.test.js` passe **neuf tests** après le raccord natif : opt-in et refus de contexte, copie détachée, budgets, séquences, identités, absence de RNG dans les plans, absence de résurrection, ciblage protégé sans dépense et victoire unique après de vrais ordres du moteur. Les trois tests d’intégration utilisent des entrées de PV/dégâts élevés explicitement déclarées pour isoler la transition ; ils ne servent pas de preuve d’équilibrage.

La comparaison initiale `docs/qa/priority-bosses-comparison-initial-01.json` exécute **108 paires / 216 batailles détachées** : six classes, trois difficultés, deux boss et trois graines. Le contrôle utilise le même moteur courant avec `bossPhases:false`, puis `true`, et désactive la portée tactique pour isoler le séquençage. La politique existante de `simulate-campaign.mjs` n’ajoute qu’un filtre des cibles protégées. Les préparations utilisent les fonctions natives de progression et d’achat ; les victoires précédant les boss sont préparées, pas jouées.

Ce passage initial donne **108 victoires avant et après, aucun KO et aucune alerte**. Féros prend en moyenne 8,10 secondes supplémentaires ; Novéria, 8,01 secondes de moins. La pire variation de santé minimale à Novéria est de −37,05 points de pourcentage malgré l’absence de KO : conserver le budget nominal n’implique pas une difficulté identique. Le rapport initial garde les empreintes réellement exécutées ; le rapport final de livraison doit vérifier les sources finales et le parcours avec la tactique activée.

La comparaison s’exécute avec un nouveau préfixe, sans écraser un passage précédent :

```bash
BOSS_PHASE_QA_PREFIX=priority-bosses-comparison-final-01 node scripts/boss-phases-comparison.mjs
```

Les sources de l’interface et du monde, les captures réellement ouvertes et le build de distribution relèvent des contrôles du lot principal. Ce document n’annonce aucun test navigateur, essai matériel, animation supplémentaire ou certification artistique 1:1.

La finalisation sur le gel produit passe dans [priority-bosses-native-final-01-report.json](../qa/priority-bosses-native-final-01-report.json) : les neuf tests réussissent et [les 108 paires finales](../qa/priority-bosses-comparison-final-01.json) conservent 108 victoires de chaque côté, aucun KO et aucune alerte. Le passage initial reste inchangé. Le contrôle visuel des phases est séparé de cette preuve native.

Le [contrôle du renderer DEV final](../qa/priority-bosses-dev-final-02-report.json) passe 13 stades avec tactique active. Les [13 captures ont réellement été ouvertes](../qa/priority-bosses-dev-final-02-visual-review.json) : cadrages natifs, protection annoncée, retrait des corps précédents et maintien des survivants vérifiés. Les PV élevés et la première jauge prête sont des entrées déclarées de fixture ; aucune victoire de campagne publique n’est revendiquée. Le premier passage est conservé en échec pour le seul import HMR du harnais, corrigé avant le passage02.
