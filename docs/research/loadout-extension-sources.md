# Complément équipement après la version 0.2.0

Le complément reprend `c614a452b1cdd2712d34ad2344471c01d2c8d209`, conserve les 48 références et leurs transactions, et ajoute quatre outils génériques. Les 20 armes, 16 armures et 12 modules existants restent décrits dans [loadout-sources.md](loadout-sources.md). Les onze opérations, les animations féminines et le correctif de chemins Windows sont conservés.

Les sources primaires réellement consultées sont le manuel officiel PC français, l’extrait Prima de 23 pages et l’article EA sur les différences de Legendary Edition. Les URL, empreintes et pages sont conservées dans [equipment-primary-reference-report.json](../qa/equipment-primary-reference-report.json). Ces documents établissent des règles générales ; ils ne fournissent pas les tables de chaque modèle. Les pages communautaires Weapons et Upgrades ont répondu HTTP 402 dans cet environnement. Les références secondaires documentées par la livraison 0.2.0 restent des preuves historiques, sans nouvelle certification de leurs tables ici.

| Règle | Référence consultée | Portée du complément |
| --- | --- | --- |
| Quatre familles d’armes | Manuel, pp. 20–21 ; Prima, p. 65 | Métadonnées et tracés distincts. Port et maîtrise séparés ; précision et portée originales non simulées. |
| Formation aux armures | Manuel, p. 22 | Formation explicite pour les classes éligibles. Aucune formation lourde initiale. Les seuils de points ATB ne sont pas ceux des talents originaux. |
| Ports de modifications | Manuel, p. 23 | Emplacements d’arme, munition et armure séparés. Deux ports d’arme et deux d’armure fixes ; le nombre selon le rang original reste à produire. |
| Amplificateur et OmniTech | Manuel, p. 24 | Quatre outils génériques standards/améliorés, avec droits bio/tech distincts. Ils ne donnent aucun pouvoir. |
| Chauffe | Prima, p. 64 ; article EA | Munitions non consommables et surchauffe. Les chiffres et variantes entre éditions restent à comparer. |

Le port d’armure contrôle la morphologie et la formation. Les profils des huit identités suivent les rôles actuels ; ils ne constituent pas leurs arbres complets. Liara peut porter un omni-outil séparément de sa liste de pouvoirs. Son talent Electronics et ses effets complets restent à reconstituer et à recouper dans une fiche de personnage primaire.

L’inventaire interne passe de la version 1 à la version 2, dans la même enveloppe de sauvegarde. Les anciennes quantités, stocks, transactions, recrutements et équipements sont préservés. Une armure anciennement portée grâce au déblocage automatique reçoit une exception limitée à cette pièce ; changer de pièce demande ensuite la formation explicite. Les nouveaux ports sont vides. Un ancien module sans arme ou armure porteuse retourne au stock disponible sans créer d’exemplaire.

Retirer ou remplacer une arme/armure libère ses modules, avec avertissement avant l’action et comparaison tenant compte de ce retrait. Les objets restent comptés par référence et non par exemplaire individualisé ; les modules ne sont pas mémorisés sur chaque pièce stockée. Les multiplicateurs d’amplificateur et d’omni-outil renforcent uniquement les pouvoirs de leur domaine, sans appliquer une seconde fois les bonus de base.

Prix, niveaux, stock, budget de formation et multiplicateurs sont des choix d’équilibrage ATB. Les quatre outils n’inventent aucun fabricant ni rang original. Aucun nouvel atlas d’arme ou d’armure n’est ajouté et changer d’objet ne change pas le costume du sprite. Les gammes complètes, licences, grenades, armes de véhicules, talents, apparences et chiffres originaux restent à produire ou à vérifier. Les fiches ajoutées restent **Prototypes**.
