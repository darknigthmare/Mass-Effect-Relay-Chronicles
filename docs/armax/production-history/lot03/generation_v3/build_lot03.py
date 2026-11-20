from pathlib import Path
from PIL import Image
from html import escape
import hashlib, json, shutil, re, zipfile, collections

BASE = Path('/workspace/scratch/c3ca3f19d191')
WORK = BASE / 'work/generation_v3'
OUT = BASE / 'outputs/mass-effect/lot03'
DATE = '2026-11-19'

def read(path):
    return json.loads(Path(path).read_text())

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

NAMES = {
    'ashley':'Ashley Williams', 'kaidan':'Kaidan Alenko', 'miranda':'Miranda Lawson',
    'jacob':'Jacob Taylor', 'grunt':'Grunt', 'cora':'Cora Harper', 'liam':'Liam Kosta',
    'samara':'Samara', 'kasumi':'Kasumi Goto', 'zaeed':'Zaeed Massani',
    'james':'James Vega', 'javik':'Javik', 'peebee':'Peebee', 'jaal':'Jaal Ama Darav',
    'shepard_female_n7':'Commandant Shepard — féminine', 'vetra_nyx_mea':'Vetra Nyx',
    'nakmor_drack_mea':'Nakmor Drack',
}
VARIANTS = {
    'ashley':'Tenue Alliance bleue à col haut du guide EA',
    'kaidan':'Armure cobalt et bleu nuit à filets blancs du guide EA',
    'miranda':'Combinaison blanche et noire à motif hexagonal du guide EA',
    'jacob':'Tenue Cerberus sombre du guide EA',
    'cora':'Tenue du Character Kit BioWare, manches asymétriques',
    'liam':'Tenue du Character Kit BioWare, épaule droite et pochette gauche',
    'samara':'Armure rouge, col sombre et ornements dorés du guide EA',
    'kasumi':'Tenue noire et grise à capuche du guide EA',
    'zaeed':'Armure blanche, jaune-orangé et noire du guide EA',
    'james':'Tenue de repos, tee-shirt gris SF-03, harnais et tatouages du guide EA',
    'javik':'Armure rouge et noire du guide EA ; main corrigée en R1',
    'peebee':'Tenue du Character Kit BioWare, marquage facial et bracelet gauche',
    'jaal':'Tenue du Character Kit BioWare, viseur droit et dispositif gauche',
}
ORDER = ['shepard_female_n7','ashley','kaidan','miranda','jacob','samara','kasumi',
         'zaeed','james','javik','cora','liam','peebee','jaal','vetra_nyx_mea','nakmor_drack_mea']
KINDS = {'fighter':'Personnage', 'keypose':'Pose de combat', 'stage':'Décor'}

logs = {name: read(WORK/'runs'/f'{name}.json') for name in ['root','fighters_a','fighters_b','stages_c']}
attempts=[]
selected=[]
for owner,d in logs.items():
    records=d.get('runs', d.get('records', d.get('assets', [])))
    selected_paths={x['output_path']:x for x in d.get('selected_assets',[]) if 'output_path' in x}
    for i,r in enumerate(records):
        r=dict(r)
        r['_owner']=owner
        r['_attempt_id']=f'{owner}:{i+1:02d}:{r["id"]}'
        attempts.append(r)
        if owner=='fighters_a':
            chosen=r.get('output_path') in selected_paths
            if chosen:r['_qa_path']=selected_paths[r['output_path']].get('qa_path')
            path=r.get('output_path')
        elif owner=='fighters_b':
            path=r.get('copied_to')
            if 'selected' in r:chosen=bool(r['selected'])
            else:
                later=[x for x in records[i+1:] if x.get('character_id')==r.get('character_id') and x.get('copied_to')]
                chosen=bool(path) and not later
            r['_qa_path']=r.get('qa_path')
        else:
            path=r.get('selected_path');chosen=bool(path)
        if chosen:
            assert path and Path(path).is_file(), f'Absent selected file: {path}'
            r['_path']=path;selected.append(r)

def qa_notes(qa):
    if not isinstance(qa,dict):return []
    notes=[]
    for key in ('notes','identity','costume_observations','asymmetry','anchoring','priority_corrections',
                'observations','reservations','remaining_issues','fidelity_notes','visible_deviations'):
        value=qa.get(key)
        if isinstance(value,str):notes.append(value)
        elif isinstance(value,list):notes.extend(str(x) for x in value)
        elif isinstance(value,dict):notes.extend(str(x) for x in value.values() if isinstance(x,str))
    return list(dict.fromkeys(notes))

independent_data = read(WORK/'root/independent-review.json') if (WORK/'root/independent-review.json').exists() else {}
revision_review = read(WORK/'root/independent-revision-review.json') if (WORK/'root/independent-revision-review.json').exists() else {}
assets=[]
qa_dir=OUT/'qa';qa_dir.mkdir(parents=True,exist_ok=True)
for r in selected:
    path=Path(r['_path']); rel=str(path.relative_to(OUT));owner=r['_owner']
    kind='stage' if owner=='stages_c' else r.get('kind','fighter')
    entity=r.get('character_id',r['id'])
    if kind=='keypose':entity='shepard_female_n7'
    title=r.get('name_fr',r.get('name',NAMES.get(entity,entity)))
    variant=r.get('variant',VARIANTS.get(entity,''))
    if kind=='fighter' and entity in NAMES:title=NAMES[entity]
    game=r.get('game','Mass Effect: Andromeda' if entity in ['cora','liam','peebee','jaal'] else 'Mass Effect — guide Legendary Edition')
    qa=r.get('qa',r.get('visual_qa',{}))
    qa_path=r.get('_qa_path')
    if qa_path and Path(qa_path).exists():qa=read(qa_path)
    im=Image.open(path);im.load()
    tech={'dimensions':list(im.size),'mode':im.mode,'file_bytes':path.stat().st_size,'sha256':sha(path)}
    if 'A' in im.getbands():
        a=im.getchannel('A');h=a.histogram();n=im.width*im.height
        bbox=a.point(lambda x:255 if x>=16 else 0).getbbox()
        tech.update({'alpha_extrema':list(a.getextrema()),'transparent_pixels_percent':round(h[0]*100/n,3),
                     'alpha_1_to_15_percent':round(sum(h[1:16])*100/n,3),'bbox_alpha16':list(bbox),
                     'margins_alpha16_px':{'left':bbox[0],'top':bbox[1],'right':im.width-bbox[2],'bottom':im.height-bbox[3]},
                     'true_transparency':h[0]>0 and sum(h[16:])>0})
    else:tech['opaque']=True
    original=r.get('source_output_path',r.get('output_path'))
    if owner=='fighters_a':original=r.get('source_output_path')
    assert original and Path(original).is_file(), ('missing original',r['id'])
    tech['identical_to_generator_output']=sha(original)==tech['sha256']
    assert tech['identical_to_generator_output']
    sources=r.get('reference_urls',r.get('source_urls',r.get('urls',[])))
    if owner=='stages_c':sources=[u for x in r.get('references',[]) for u in (x.get('page_url'),x.get('image_url')) if u]
    sources=list(dict.fromkeys(sources))
    independent_matches = [x for x in independent_data.get('characters',[])+independent_data.get('poses',[])+revision_review.get('reviews',[]) if x.get('id')==r['id']]
    if independent_matches:
        qa=dict(qa)
        qa['independent_review']=independent_matches[0]
    notes=qa_notes(qa)
    for independent_match in independent_matches:
        notes += [x['finding'] for x in independent_match.get('issues',[])]
        notes += independent_match.get('observations',[])
        notes += [x['target']+' : '+x['result'] for x in independent_match.get('corrected_points',[])]
        notes += independent_match.get('remaining_reservations',[])
    notes=list(dict.fromkeys(notes))
    if not notes:notes=['Consulter la QA détaillée ; fidélité, appuis et usage moteur non validés.']
    asset_id=r['id']
    if owner=='fighters_a':asset_id=entity+'_ready_right_lot03'
    qa_rel=f'qa/{asset_id}.json';write_json(OUT/qa_rel,{'asset_id':asset_id,'technical':tech,'review':qa})
    item={'id':asset_id,'entity_id':entity,'kind':kind,'title':title,'variant':variant,'game':game,
          'path':rel,'qa_path':qa_rel,'technical':tech,'sources':sources,'notes':notes,
          'generation_attempt_id':r['_attempt_id'],'status':'concept_retained_with_reservations',
          'facing':'screen_right' if kind!='stage' else None,
          'state':r.get('state','neutral_or_ready' if kind=='fighter' else 'arena_master'),
          'single_static_image':True,'animation_clip_complete':False,'engine_integrated':False,
          'fidelity_1_to_1_validated':False,'pivot':None,'world_scale':None,
          'reference_images_included':False}
    if kind=='stage':item.update({'parallax_layers_delivered':0,'target_parallax_layers':6,'canonical_geometry_extraction':False})
    if kind=='keypose':item['reference_parent_asset_id']='shepard_female_n7'
    assets.append(item)

assets.sort(key=lambda a:({'fighter':0,'keypose':1,'stage':2}[a['kind']],ORDER.index(a['entity_id']) if a['entity_id'] in ORDER else 100,a['title']))
generated=[r for r in attempts if r.get('has_image') or (r.get('source_output_path') or r.get('output_path')) and r.get('status') not in ['generation_failed','queued','ready_to_generate']]
failures=[r for r in attempts if r.get('status')=='generation_failed' or r.get('error') or r.get('failure')]
counts={'generation_calls':len(attempts),'images_created':len(generated),'generation_failures':len(failures),
        'selected_images':len(assets),'selected_fighter_poses':sum(a['kind']=='fighter' for a in assets),
        'selected_action_keyposes':sum(a['kind']=='keypose' for a in assets),'selected_arena_masters':sum(a['kind']=='stage' for a in assets),
        'images_created_not_selected':len(generated)-len(assets),'animation_clips_completed':0,'parallax_sets_completed':0}

outstanding=[
 {'id':'grunt_ready','subject':'Grunt — pose individuelle','status':'not_generated','reason':'Deux refus de sortie du générateur dans ce lot ; aucun fichier créé.','priority':'P1'},
 {'id':'m300_claymore_me3','subject':'M-300 Claymore — modèle ME3','status':'not_generated','reason':'Refus de sortie du générateur ; aucun fichier créé dans ce lot.','priority':'P1'},
 {'id':'port_hanshan_plaza_me1','subject':'Port Hanshan — plaza intérieure','status':'awaiting_reference','reason':'Vue large de référence suffisamment fiable non obtenue ; Menae produit à sa place dans cette vague.','priority':'P1'},
 {'id':'legion_drone','subject':'Drone de Legion','status':'awaiting_reference','reason':'Manquant conservé du lot précédent ; référence insuffisante, aucune nouvelle tentative dans ce lot.','priority':'P2'},
 {'id':'fighter_scale_and_ground','subject':'Échelle des corps et ligne des appuis','status':'pending','reason':'Les poses ne partagent pas encore un pivot, une hauteur de corps et des contacts au sol validés.','priority':'P0'},
 {'id':'canonical_detail_pass','subject':'Revue de fidélité des visages, costumes et anatomies','status':'pending','reason':'Réserves concrètes conservées dans les fiches QA ; aucun personnage ou stage certifié 1:1.','priority':'P0'},
 {'id':'shepard_female_animation','subject':'Clips de combat de Shepard féminine','status':'keyposes_only','reason':'Quatre poses clés produites ; échelle, appuis, intermédiaires, anticipation, récupération et timing encore à construire.','priority':'P0'},
 {'id':'six_stage_parallax','subject':'Parallaxe des six nouvelles arènes','status':'masters_only','reason':'Six images aplaties ; les 36 couches visées ne sont pas générées dans ce lot.','priority':'P1'},
 {'id':'broader_fighting_mode','subject':'Intros, rivalités, endings, finishers, VFX et autres animations','status':'not_produced_in_this_batch','reason':'Le lot étend la production visuelle ; il ne prouve aucune implémentation des modes de la bible.','priority':'P2'}]

independent=WORK/'root/independent-review.json'
if independent.exists():shutil.copy2(independent,qa_dir/'independent-review-root.json')
measurements=WORK/'root/independent-review-measurements.json'
if measurements.exists():shutil.copy2(measurements,qa_dir/'independent-review-measurements.json')
if (WORK/'root/independent-revision-review.json').exists():shutil.copy2(WORK/'root/independent-revision-review.json',qa_dir/'independent-revision-review.json')
if (WORK/'root/independent-revision-measurements.json').exists():shutil.copy2(WORK/'root/independent-revision-measurements.json',qa_dir/'independent-revision-measurements.json')
(qa_dir/'README.md').write_text('La QA individuelle pointée par le manifeste concerne chaque image sélectionnée. La revue indépendante initiale décrit notamment Drack R0 et la garde basse R0, désormais remplacés. Le complément independent-revision-review.json contrôle les deux R1 sélectionnés. Les mesures alpha sont des repères de silhouette, pas des points de collision.\n')
provenance=OUT/'provenance';provenance.mkdir(parents=True,exist_ok=True)
for owner in logs:shutil.copy2(WORK/'runs'/f'{owner}.json',provenance/f'{owner}.json')
attempt_summaries=[]
chosen_ids={a['generation_attempt_id'] for a in assets}
for r in attempts:
    attempt_summaries.append({'id':r['_attempt_id'],'subject_id':r['id'],'selected':r['_attempt_id'] in chosen_ids,
                             'status':r.get('status'),'prompt':r.get('prompt'),
                             'parameters':r.get('parameters',{'transparent_background':r.get('transparent',True),'referenced_image_paths':r.get('refs',[])}),
                             'output_path':r.get('source_output_path',r.get('output_path')),
                             'failure':r.get('failure',r.get('error'))})
write_json(provenance/'generation-attempts.json',attempt_summaries)

manifest={'schema_version':'3.0.0','project':'Mass Effect — Armax Relay Clash','batch':'lot03','created':DATE,'timezone':'Europe/Paris',
 'scope':'Nouvelles images du lot 03 ; les fichiers des lots antérieurs ne sont pas inclus.',
 'counts':counts,'asset_status_policy':'Une image générée et retenue reste un concept ; son existence ne valide ni le canon, ni un clip, ni son intégration.',
 'files_edited_after_generation':False,'all_selected_files_match_original_outputs':True,
 'old_files_recovered_in_this_run':False,'assets':assets,'outstanding':outstanding,
 'verification':{'png_decode':True,'sha256_matches':True,'alpha_and_dimensions_measured':True,
                 'direct_visual_review':True,'in_engine':False,'animation_playback':False,'exact_fidelity':False,
                 'catalogue_browser_review':False},
 'primary_character_hubs':['https://www.ea.com/games/mass-effect/community/cosplay-guides','https://www.bioware.com/digitalmedia/mass-effect/']}
write_json(OUT/'asset-manifest.json',manifest)

def dims(a):return ' × '.join(map(str,a['technical']['dimensions']))
def mdtable(rows):return '\n'.join('| '+' | '.join(str(v).replace('|','/') for v in row)+' |' for row in rows)
charrows=[['Personnage','Variante produite','État'],['---','---','---']]+[[a['title'],a['variant'],'Pose statique, réserves QA'] for a in assets if a['kind']=='fighter']
stagerows=[['Arène','Période / variante','Dimensions'],['---','---','---']]+[[a['title'],a['game']+' — '+a['variant'],dims(a)] for a in assets if a['kind']=='stage']
actionrows=[['Pose','Ce que le fichier contient','Travail restant'],['---','---','---']]
for a in assets:
    if a['kind']=='keypose':actionrows.append([a['title'],a['notes'][0],a['notes'][1] if len(a['notes'])>1 else 'Échelle, appuis et timing'])

readme=f'''# Mass Effect — Armax Relay Clash\n## Lot 03 · Génération des manquants\n\n**{counts['selected_images']} PNG sélectionnés : {counts['selected_fighter_poses']} poses individuelles, {counts['selected_action_keyposes']} poses de combat de Shepard féminine et {counts['selected_arena_masters']} décors.**\n\nDate : 19 novembre 2026.\n\n### Ouvrir le lot\n\n1. Décompresser toute l’archive.\n2. Ouvrir `Catalogue_Lot03.html` dans un navigateur : les filtres, la recherche et les fonds clair/sombre/damier fonctionnent sans serveur ni connexion.\n3. Ouvrir une fiche pour lire ses dimensions, sa variante et ses réserves ; le lien PNG ouvre le fichier original retenu.\n4. Lire `Bible_Complement_Lot03.md` pour les décisions de production et `asset-manifest.json` pour les chemins, SHA-256 et statuts.\n\n### Production réelle\n\n- {counts['generation_calls']} appels de génération ; {counts['images_created']} fichiers créés et {counts['generation_failures']} refus conservés.\n- {counts['selected_images']} fichiers sélectionnés ; {counts['images_created_not_selected']} sortie créée non retenue.\n- Tous les PNG sélectionnés sont identiques aux sorties du générateur : aucun redimensionnement, détourage ou repeint manuel.\n- Les personnages et poses de combat mesurent 1024 × 1536 et possèdent un canal alpha réel. Leurs niveaux alpha plafonnent à 254 ; les couleurs RGB sous alpha 0 sont invisibles. Des pixels de très faible alpha peuvent toutefois produire une frange sur certains fonds.\n- Les six décors sont des masters RGB opaques de dimensions natives variables.\n\n### Ce que signifie « retenu »\n\nLes sources de costume ont été inspectées et chaque sortie a reçu une revue visuelle et un contrôle de fichier. Les images restent des **concepts ou poses clés d’étude**. La fidélité 1:1, la stabilité d’animation, le pivot, l’échelle commune, les hitboxes et la composition dans le moteur restent à valider. Les quatre actions de Shepard ne forment pas une animation prête à lire. Les six décors ne constituent pas des ensembles de parallaxe séparés.\n\n### Manquants immédiats\n\n- **Grunt** : deux refus de sortie, aucun PNG.\n- **M-300 Claymore ME3** : refus de sortie, aucun PNG dans cette vague.\n- **Port Hanshan** : référence large insuffisante ; Menae a été produit à sa place.\n- **Drone de Legion** : manquant documentaire conservé du lot précédent.\n\n### Organisation\n\n- `assets/fighters/` : poses individuelles.\n- `assets/keyposes/` : études de combat de Shepard féminine.\n- `assets/stages/` : six masters d’arènes.\n- `qa/` : dimensions, alpha, SHA et observations détaillées ; revue indépendante des sorties principales.\n- `provenance/` : journaux de génération, prompts exacts et références. Les chemins de travail y sont historiques ; les sources restent consultables par leurs URLs.\n\nLes PDF et captures tiers de référence ne sont pas redistribués dans le paquet. Cette archive contient les nouveaux assets de ce lot ; les anciens lots et la bible v1 ne sont pas recopiés. Le complément de bible décrit la production actuelle sans prétendre avoir fusionné un document antérieur non récupéré.\n'''
(OUT/'README.md').write_text(readme)

appendix=f'''# Bible de production — complément du lot 03\n\n**Mass Effect — Armax Relay Clash** · 19 novembre 2026\n\n## 1. Livrable et position dans la production\n\nLe lot produit {counts['selected_images']} nouvelles images sélectionnées. Il étend les apparences individuelles du roster, ouvre quatre études de mouvement de Shepard féminine et ajoute six lieux de combat. Les statuts restent séparés : image produite, choix retenu pour étude, correction de fidélité, préparation technique, intégration et validation en jeu. Aucun statut « Validé » n’est déduit de la présence d’un fichier.\n\nLes costumes de la trilogie proviennent des guides EA Legendary Edition ; les six compagnons d’Andromeda proviennent des Character Kits BioWare. La variante réellement visible prime sur une association vague à un épisode. Ashley est représentée dans la tenue bleue du guide, James dans sa tenue de repos. Les visages, coutures et détails générés restent des interprétations à contrôler. [Guides EA](https://www.ea.com/games/mass-effect/community/cosplay-guides) · [Kits BioWare](https://www.bioware.com/digitalmedia/mass-effect/)\n\n## 2. Personnages nouvellement couverts\n\n{mdtable(charrows)}\n\nChaque fichier contient une figure entière, orientée vers la droite. Les vues de dos, profils opposés, expressions dédiées, variantes de costume et cycles complets ne sont pas fournis par cette pose. Il faut produire les vues opposées en préservant les asymétries : le miroir automatique inverserait, entre autres, la bande du bras droit de Shepard, les manches de Cora et les dispositifs de Jaal.\n\n## 3. Première famille de poses de combat\n\n{mdtable(actionrows)}\n\nLa pose neutre de Shepard féminine est la référence de cette famille. Les quatre sorties ont un visage et un costume proches, mais ne conservent pas une échelle de corps et des contacts au sol suffisamment stables pour former un clip. La garde basse R0 remplissait presque tout le cadre malgré l’accroupissement ; R1 corrige nettement sa hauteur dans le cadre et rapproche les semelles d’une même ligne : leur écart passe de 99 à 3 pixels, et la hauteur de silhouette de 1422 à 1102 pixels. Ces mesures sur alpha >127 sont des repères de silhouette, pas des collisions validées. Les proportions locales et les transitions restent à contrôler : un montage brut des quatre poses peut encore provoquer des changements apparents de taille. Le coup léger tend le bras gauche, alors que le prompt demandait le droit : il est catalogué selon le résultat observé, sans miroir.\n\n### Passage vers des animations utilisables\n\n1. Fixer une hauteur du personnage, un pivot et une ligne de contact dans la caméra du mode combat. Utiliser la tête, le bassin et les pieds comme repères ; la boîte alpha ne suffit pas à estimer l’échelle du corps.\n2. Recaler ou régénérer les poses sur cette référence. Le genou plié doit réduire la hauteur de silhouette ; il ne doit pas agrandir le crâne ou le torse.\n3. Produire séparément anticipation, extension, récupération et retour en garde, puis les intermédiaires nécessaires. Les durées et les fenêtres actives relèvent du moveset, pas du nombre d’images obtenu.\n4. Contrôler la continuité du visage, des volumes, de l’emblème N7 et des bandes du bras droit à la taille d’affichage du jeu.\n5. Définir hurtboxes, hitboxes, déplacements de racine et événements sonores/VFX dans le moteur ; observer une séquence complète et ses transitions.\n\nCes étapes sont un plan de travail. Aucun timing de combat, rectangle de collision ou test moteur n’est livré par les PNG actuels.\n\n## 4. Arènes supplémentaires\n\n{mdtable(stagerows)}\n\nLes arènes conservent des repères d’architecture et de palette issus de captures identifiées. Leur caméra et leur sol de combat ont été recomposés pour une lecture latérale. Les plans, distances, géométries exactes et transitions des niveaux d’origine ne sont pas reproduits ni certifiés.\n\n**Thessia :** la sortie montre surtout le buste de la statue au-dessus d’un socle important. Le raccord, les proportions et la silhouette complète d’Athamé demandent une nouvelle comparaison au jeu. **Base des Récolteurs :** les références sont petites ; les microdétails organiques ont été reconstruits et doivent être revalidés. **Menae :** la capture est publiée dans un article sur Legendary Edition ; le build exact de la capture n’a pas été confirmé indépendamment.\n\n### Plan de séparation des décors\n\n| Plan | Rôle prévu | Contrainte de production |\n| --- | --- | --- |\n| L0 | Ciel ou volume d’ambiance lointain | Une base opaque, sans personnages ni éléments de jeu collés au premier plan. |\n| L1 | Horizon, ville lointaine ou fond architectural | Extension latérale adaptée au déplacement de caméra. |\n| L2 | Grandes structures et silhouette du lieu | Conserver les repères canoniques identifiables ; reconstruire les surfaces cachées. |\n| L3 | Objets et architecture derrière les combattants | Séparer leurs alpha et vérifier leur ordre d’occlusion. |\n| L4 | Sol et bande de combat | Une surface continue, un contact lisible, aucun trou au raccord. |\n| L5 | Accents de premier plan | Occultation légère, pieds et silhouettes encore lisibles. |\n\n**État actuel : 6 masters aplatis, 0 ensemble de parallaxe terminé.** La cible de six couches par arène représente 36 sorties à produire et assembler. Les coefficients de défilement, limites de caméra et marges de recouvrement seront réglés après un test dans la scène cible ; ils ne sont pas inventés à partir du seul master.\n\n## 5. Contrôle de fidélité et préparation technique\n\nChaque fiche de `qa/` contient la taille réelle, le mode couleur, le SHA-256, les mesures d’alpha et la revue spécifique. Les corrections prioritaires concernent les proportions du visage, les petits motifs, les accessoires et l’appui des pieds. Les marges demandées n’ont pas été systématiquement respectées. La présence de transparence ne suffit pas à déclarer les contours propres sur tous les décors ; il faut les observer sur des fonds clairs, sombres et contrastés.\n\nPour Javik, une révision corrige le nombre de doigts après comparaison au guide. Drack R1 remet les deux attaches circulaires abdominales côte à côte et rétablit le piston extérieur de tibia. Shepard en garde basse R1 remplace la version trop agrandie. Les trois sorties précédentes ne sont pas retenues dans la sélection finale. Les archives de tentative et les fichiers sélectionnés gardent des rôles distincts. Aucune image ne doit être importée comme un sprite d’animation final simplement parce que son nom contient « ready ».\n\n## 6. Suite de production et blocages\n\n| Priorité | Sujet | Résultat encore attendu |\n| --- | --- | --- |\n| P0 | Repères de personnages | Hauteur de corps, pivot, orientation, ligne de contact et contrôle à la caméra finale. |\n| P0 | Shepard féminine | Famille de poses recalée, phases complètes et premier clip observé en jeu. |\n| P0 | Fidélité | Corrections concrètes des QA ; revue des visages, mains, motifs et asymétries. |\n| P1 | Grunt | Pose individuelle, après résolution du blocage de génération. |\n| P1 | Claymore ME3 | Prop isolé ; aucun fichier livré par la tentative de ce lot. |\n| P1 | Port Hanshan | Captures larges fiables puis master de la plaza. |\n| P1 | Six arènes | Couches séparées, reconstruction des zones cachées et test de raccord. |\n| P2 | Drone de Legion | Référence de définition suffisante avant une nouvelle génération. |\n| P2 | Présentation du combat | Portraits dédiés, intros, rivalités, endings, finishers, VFX et sons selon les fiches de la bible. |\n\nLes trois derniers ensembles exigent des livrables propres. Une pose ou un décor ne prouve pas que le mode histoire, le tournoi, les finishers ou les règles de combat existent dans le moteur. Le présent complément documente uniquement ce qui a effectivement été produit dans ce lot.\n\n## 7. Traçabilité\n\nLes journaux conservent {counts['generation_calls']} appels, {counts['images_created']} fichiers créés, {counts['generation_failures']} refus et {counts['selected_images']} choix finaux. Les PNG sont copiés à l’identique, sans retouche de pixels. Les références tierces restent des documents de travail et ne sont pas incluses dans le paquet. Le manifeste permet de retrouver chaque fichier sélectionné, sa tentative et ses limites.\n'''
(OUT/'Bible_Complement_Lot03.md').write_text(appendix)

cards=[]
for a in assets:
    src=escape(a['path'],quote=True); title=escape(a['title']); variant=escape(a['variant'])
    cards.append(f'''<article class="card {a['kind']}" data-kind="{a['kind']}" data-search="{escape((a['title']+' '+a['variant']+' '+a['game']).casefold(),quote=True)}"><button class="visual" data-id="{escape(a['id'],quote=True)}" aria-label="Inspecter {title}"><img src="{src}" alt="{title}" loading="lazy"></button><div class="card-body"><div class="kicker">{KINDS[a['kind']]} · {dims(a)}</div><h2>{title}</h2><p>{variant}</p><span class="status">Concept · réserves QA</span></div></article>''')
catalog_data=json.dumps(assets,ensure_ascii=False).replace('</','<\\/')
html='''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Armax Relay Clash · Lot 03</title><style>
:root{color-scheme:dark;--bg:#0b1018;--panel:#121c29;--line:#263547;--text:#eaf0f7;--muted:#98a9bd;--cyan:#70d8ef;--red:#df4a50;--preview:#182536}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,Segoe UI,sans-serif}header,main,footer{max-width:1480px;margin:auto;padding:32px}header{padding-top:48px}a{color:var(--cyan)}.eyebrow{font-size:12px;letter-spacing:.2em;font-weight:800;color:var(--cyan);text-transform:uppercase}h1{font-size:clamp(34px,5vw,64px);letter-spacing:-.055em;line-height:1.02;margin:18px 0}h1 small{display:block;font-size:.42em;letter-spacing:.02em;margin-top:13px;font-weight:500;color:var(--muted)}.intro{max-width:780px;line-height:1.65;color:var(--muted)}.stats{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}.stat{padding:14px 20px;background:var(--panel);border:1px solid var(--line);border-radius:10px;min-width:150px}.stat b{font-size:30px;display:block;color:var(--text)}.stat span{font-size:12px;color:var(--muted)}.notice{border-left:3px solid var(--red);background:#1a1b24;padding:16px 20px;line-height:1.6;margin-top:24px;font-size:14px}.toolbar{display:flex;gap:16px;flex-wrap:wrap;align-items:center;padding-bottom:23px;position:sticky;top:0;background:#0b1018f5;z-index:2;padding-top:12px}.tabs{display:flex;gap:6px;flex-wrap:wrap}button,input,select{font:inherit}button{cursor:pointer}button.tab,.swatches button{background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:7px;padding:10px 14px}.tab.active{background:#1e5360;border-color:var(--cyan)}input{min-width:220px;flex:1;border:1px solid var(--line);background:#101925;color:var(--text);border-radius:7px;padding:11px 13px}.swatches{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--muted)}.swatches button{padding:8px 10px}.swatches button.active{outline:1px solid var(--cyan)}.result-line{font-size:12px;color:var(--muted);margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:20px}.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}.card[hidden]{display:none}.visual{display:block;width:100%;height:370px;border:0;padding:14px;background:var(--preview);background-image:var(--preview-image,none);background-size:28px 28px}.visual img{display:block;object-fit:contain;width:100%;height:100%}.card.stage .visual{height:220px;padding:0}.card.stage .visual img{object-fit:contain}.card-body{padding:18px}.kicker{color:var(--cyan);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}h2{font-size:19px;line-height:1.25;margin:10px 0}.card p{color:var(--muted);font-size:12px;line-height:1.5;min-height:36px}.status{display:inline-block;border:1px solid #64533c;color:#e2be84;padding:5px 8px;border-radius:5px;font-size:10px}.empty{padding:40px;color:var(--muted)}footer{color:var(--muted);font-size:12px;line-height:1.7;border-top:1px solid var(--line);margin-top:30px}dialog{border:1px solid var(--line);border-radius:14px;background:var(--panel);color:var(--text);width:min(1100px,94vw);max-height:92vh;padding:0}dialog::backdrop{background:#02060dcc;backdrop-filter:blur(5px)}.modal-top{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid var(--line)}.modal-top button{color:var(--text);border:1px solid var(--line);background:transparent;border-radius:6px;padding:8px 12px}.modal-content{display:grid;grid-template-columns:1fr 1fr}.modal-visual{min-height:460px;max-height:72vh;background:var(--preview);background-image:var(--preview-image,none);background-size:28px 28px;padding:18px;display:flex;align-items:center;justify-content:center}.modal-visual img{width:100%;height:100%;max-height:68vh;object-fit:contain}.modal-info{padding:24px;max-height:72vh;overflow:auto;font-size:13px;line-height:1.65}.modal-info ul{padding-left:18px}.modal-info li{margin-bottom:10px}.small{font-size:11px;color:var(--muted)}.links{display:flex;gap:18px;flex-wrap:wrap;margin:20px 0}.meta{font-size:12px;color:var(--muted)}button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}@media(max-width:650px){header,main,footer{padding:22px}.visual{height:330px}.toolbar{position:static}.modal-content{grid-template-columns:1fr}.modal-visual{min-height:300px;max-height:45vh}.modal-visual img{max-height:40vh}.modal-info{max-height:none}.stat{min-width:125px}.grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}}
</style></head><body><header><div class="eyebrow">Mass Effect · Production visuelle · 19 novembre 2026</div><h1>ARMAX RELAY CLASH<small>Lot 03 — personnages, poses & arènes</small></h1><p class="intro">Un personnage par image, des costumes référencés et six nouveaux lieux de combat. Inspectez les PNG sur plusieurs fonds et consultez les réserves de chaque sortie.</p><div class="stats">__STATS__</div><div class="notice"><strong>Production en cours.</strong> Ces images sont des concepts et des poses clés d’étude. La fidélité 1:1, les clips animés, les pivots et l’intégration moteur restent à valider. Les décors sont des masters aplatis.</div><div class="links"><a href="Bible_Complement_Lot03.md">Complément de bible</a><a href="asset-manifest.json">Manifeste complet</a><a href="README.md">Lire le lot</a></div></header><main><div class="toolbar"><nav class="tabs" aria-label="Catégorie"><button class="tab active" data-filter="all" aria-pressed="true">Tout</button><button class="tab" data-filter="fighter" aria-pressed="false">Personnages</button><button class="tab" data-filter="keypose" aria-pressed="false">Combat</button><button class="tab" data-filter="stage" aria-pressed="false">Décors</button></nav><input id="search" type="search" placeholder="Rechercher un personnage ou un lieu…" aria-label="Rechercher un personnage ou un lieu"><div class="swatches" aria-label="Fond des aperçus">Fond <button data-bg="dark" class="active" aria-pressed="true">Sombre</button><button data-bg="light" aria-pressed="false">Clair</button><button data-bg="checker" aria-pressed="false">Damier</button></div></div><p id="result-count" class="result-line" aria-live="polite"></p><div class="grid">__CARDS__</div><p id="empty" class="empty" hidden>Aucun fichier ne correspond à cette recherche.</p></main><footer><p><strong>Manquants suivis :</strong> Grunt, M-300 Claymore, Port Hanshan et drone de Legion. Les deux premiers ont rencontré des refus de génération ; les deux autres exigent de meilleures références.</p><p>Les sources officielles des personnages et les captures de décors sont citées dans chaque fiche. Les références originales ne sont pas redistribuées. Les PNG sélectionnés sont conservés sans retouche de pixels.</p><p>Catalogue sans dépendance externe. Contrôles de fichiers et de syntaxe réalisés ; revue de ce catalogue dans un navigateur non effectuée.</p></footer><dialog id="detail"><div class="modal-top"><strong id="detail-title"></strong><button id="close">Fermer</button></div><div class="modal-content"><div class="modal-visual"><img id="detail-image" alt=""></div><div id="detail-info" class="modal-info"></div></div></dialog><script id="asset-data" type="application/json">__DATA__</script><script>
const data=JSON.parse(document.getElementById('asset-data').textContent);const byId=new Map(data.map(a=>[a.id,a]));const cards=[...document.querySelectorAll('.card')];let currentFilter='all';const search=document.getElementById('search');const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();function filter(){const term=normalize(search.value.trim());let n=0;cards.forEach(card=>{const show=(currentFilter==='all'||card.dataset.kind===currentFilter)&&normalize(card.dataset.search).includes(term);card.hidden=!show;if(show)n++});document.getElementById('result-count').textContent=n+' image'+(n>1?'s':'')+' affichée'+(n>1?'s':'')+' sur '+data.length;document.getElementById('empty').hidden=n!==0}document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{currentFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});filter()}));search.addEventListener('input',filter);document.querySelectorAll('[data-bg]').forEach(b=>b.addEventListener('click',()=>{const mode=b.dataset.bg;document.documentElement.style.setProperty('--preview',mode==='light'?'#e6eaf0':mode==='checker'?'#aeb6c1':'#182536');document.documentElement.style.setProperty('--preview-image',mode==='checker'?'repeating-conic-gradient(#d4d9e0 0% 25%, transparent 0% 50%)':'none');document.querySelectorAll('[data-bg]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))})}));const dialog=document.getElementById('detail');function el(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e}function openDetail(id){const a=byId.get(id);if(!a)return;document.getElementById('detail-title').textContent=a.title;const image=document.getElementById('detail-image');image.src=a.path;image.alt=a.title;const box=document.getElementById('detail-info');box.replaceChildren();box.append(el('h2',a.variant),el('p',a.game));const t=a.technical;box.append(el('p',t.dimensions.join(' × ')+' · '+t.mode+' · '+(t.file_bytes/1048576).toFixed(2)+' Mio'));const link=el('a','Ouvrir le PNG original');link.href=a.path;link.target='_blank';link.rel='noopener';box.append(link);box.append(el('h3','Réserves de production'));const list=el('ul');a.notes.forEach(n=>list.append(el('li',n)));box.append(list);box.append(el('p','Fidélité 1:1 non validée · Aucune validation moteur.'));box.append(el('h3','Références'));const sources=el('ul');a.sources.forEach((url,i)=>{const li=el('li');const l=el('a','Source '+(i+1)+' — '+new URL(url).hostname);l.href=url;l.target='_blank';l.rel='noopener';li.append(l);sources.append(li)});box.append(sources);const qa=el('a','Ouvrir la QA détaillée');qa.href=a.qa_path;qa.target='_blank';qa.rel='noopener';box.append(qa);dialog.showModal()}document.querySelectorAll('.visual').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.id)));document.getElementById('close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});filter();
</script></body></html>'''
stats=[(counts['selected_images'],'PNG sélectionnés'),(counts['selected_fighter_poses'],'poses individuelles'),(counts['selected_action_keyposes'],'poses de combat'),(counts['selected_arena_masters'],'décors')]
html=html.replace('__STATS__',''.join(f'<div class="stat"><b>{n}</b><span>{label}</span></div>' for n,label in stats)).replace('__CARDS__',''.join(cards)).replace('__DATA__',catalog_data)
(OUT/'Catalogue_Lot03.html').write_text(html)

print(json.dumps({'counts':counts,'paths':[a['path'] for a in assets],'qa_files':len(list(qa_dir.glob('*.json'))),'selected_bytes':sum(a['technical']['file_bytes'] for a in assets)},ensure_ascii=False,indent=2))
