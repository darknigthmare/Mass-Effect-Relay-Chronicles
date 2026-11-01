# Secours médicaux ME2 et ME3 — troisième lot

Deux nouvelles études de pouvoirs, `ME2-POW-UNITY` et `ME3-POW-FIRST-AID`, exécutent une commande de secours native dans un banc explicitement activé. Elles ne représentent aucune nouvelle armure. Les dossiers d’équipement et leurs fermetures publiées dans le lot 2 restent des preuves historiques de cette version.

Les deux manuels officiels EA ont été directement téléchargés et leurs pages ouvertes visuellement lors de ce lot. Le [relevé primaire](../qa/expansion3-medical-reference-report.json) indique la date UTC réelle, la réponse HTTP, les octets, la signature PDF et les empreintes des fichiers et pages.

| Source | Page lue | Fait retenu | Limite |
|---|---|---|---|
| [ME2 — manuel PC français](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf) | PDF 14, imprimée 25 ; [page ouverte](expansion3-medical-me2-page14.png) | Le médi-gel s’utilise avec Unité pour ranimer les équipiers tombés au combat. | Aucun montant de santé, nombre de doses, nombre de cibles ou délai original relevé sur cette page. |
| [ME3 — manuel PC anglais](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_PC.pdf) | PDF et imprimée 26 ; [page ouverte](expansion3-medical-me3-page26.png) | First Aid relève un équipier à distance en consommant du médi-gel. La réanimation de proximité ne consomme pas de médi-gel. | La réanimation de proximité et la santé en segments ne sont pas implémentées par ce banc. |

Le prototype prépare un secouriste avec le pouvoir correspondant et deux équipiers abstraits KO, dans la même œuvre. Un ordre ATB utilise une dose partagée pour le groupe préparé. Les équipiers reviennent avec 30 % de leur budget de santé, sans bouclier et avec une jauge ATB vide. Le stock d’une dose, la cible de groupe et les valeurs de retour sont des **choix de démonstration ATB**, pas des chiffres certifiés des jeux originaux.

Le banc vérifie aussi le refus d’une nouvelle commande à réserve épuisée malgré une jauge ATB pleine et un patient KO, le refus d’une cible explicitement exclue et le refus de dépense quand aucun équipier n’est relevable. Les alliés conscients ne reçoivent aucun soin dans ce test. Les combattants d’une autre œuvre, les soutiens temporaires et les cibles explicitement mortes dans le récit ou non relevables ne sont pas réanimés.

Les commandes `unityMedigel` et `firstAid` nécessitent à la fois la configuration médicale du banc, la bonne œuvre et le pouvoir préparé sur l’acteur. Aucune campagne ou ancienne escarmouche ne les active. La commande `unity` ME1 demeure son talent Spectre sans dépense de médi-gel ; la commande `medigel` existante demeure un soin d’allié conscient. Il n’y a ni migration d’inventaire, ni progression, ni transfert de dose ou de pouvoir, ni changement d’un décès de campagne.

Les fichiers PNG liés ci-dessus sont des pages de référence de recherche. Aucun nouveau sprite, modèle, vêtement, son ou animation médicale n’est livré par ce chantier. Aucun parcours du jeu original n’a été exécuté pour cette preuve ; la reconstitution mécanique et artistique 1:1 reste incomplète.
