"""Catalogue editorial de production. Ne modifie aucun contenu jouable.

Les nombres de gameplay sont des propositions ; aucune valeur du moteur original
n'est reconstituee. Les fiches de sources documentent les consultations du 22/10/2026.
"""
from pathlib import Path
import json
import re
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = 'characters npcs lore worlds zones links scenery props enemies main_quests side_quests choices dialogues cinematics weapons equipment powers ally_moves enemy_moves animations sprites vfx audio systems qa continuity'.split()
PREFIX = {'characters':'CHR','npcs':'NPC','lore':'LOR','worlds':'WRL','zones':'ZON','links':'LNK','scenery':'SCN','props':'PRP','enemies':'ENM','main_quests':'MQ','side_quests':'SQ','choices':'CHO','dialogues':'DIA','cinematics':'CIN','weapons':'WPN','equipment':'EQP','powers':'POW','ally_moves':'AMV','enemy_moves':'EMV','animations':'ANI','sprites':'SPR','vfx':'VFX','audio':'AUD','systems':'SYS','qa':'QA','continuity':'CON'}

class Catalog:
    def __init__(self, id, title, scope):
        self.id, self.title = id, title
        self.sources, self.entries, self.coverage = [], [], []
        self.scope = scope
        self.ids = set()

    def ident(self, category, key):
        return f'{self.id}-{PREFIX[category]}-{key.upper()}'

    def src(self, key, title, url, scope, kind='wiki', note=''):
        sid = f'{self.id}-SRC-{key.upper()}'
        if not note:
            note = ('Consulté le 22 octobre 2026 via les résultats indexés du moteur de recherche ; '
                    'index communautaire secondaire, ouverture directe Fandom limitée par robots/402. '
                    'Titres et faits brefs paraphrasés ; aucune capture ni validation exhaustive en jeu.') if kind == 'wiki' else 'Source officielle consultée le 22 octobre 2026 ; portée limitée au sujet annoncé.'
        self.sources.append(dict(id=sid,title=title,url=url,kind=kind,scope=scope,note=note))
        return sid

    def add(self, category, key, name, description, adaptation, gameplay='', visual='', conditions='', source='', reference='', dependencies=(), priority='P1', nature='Établi', acceptance='', animation='', audio='', notes=''):
        id = self.ident(category,key)
        assert category in CATEGORIES and id not in self.ids, id
        self.ids.add(id)
        sourceIds = [f'{self.id}-SRC-{s.upper()}' for s in source.split(',') if s]
        if not gameplay:
            gameplay = adaptation
        if not animation:
            if category in ('characters','npcs','enemies','sprites'):
                animation = 'Prévoir attente, orientation et réaction au contexte ; conserver les repères décrits dans la silhouette pendant les changements de direction. Les mouvements sont des créations du fan game.'
            elif category in ('main_quests','side_quests','choices','dialogues','continuity','qa','lore','systems'):
                animation = 'Transitions de caméra et d’interface interruptibles ; aucun délai d’animation ne doit consommer une décision encore ouverte.'
            else:
                animation = 'Préparer état de repos, anticipation, activation et retour au repos ; aligner les événements visuels sur la résolution de l’action ATB.'
        if not audio:
            audio = 'Créer des bruitages et ambiances originaux adaptés au livrable ; sous-titrer les indices utiles et proposer un réglage indépendant des effets. Aucune extraction audio demandée.'
        if not acceptance:
            acceptance = f'Le livrable « {name} » possède une scène ou un scénario de contrôle ; ses règles proposées, ses conditions et ses retours visuels sont vérifiables séparément.'
        if not notes:
            notes = 'Spécification à réaliser. Les champs adaptation, gameplay, visual, animation, audio et implementation décrivent le fan game ; ils ne donnent pas des caractéristiques officielles de l’œuvre.'
        self.entries.append(dict(id=id,category=category,name=name,status='Défini',nature=nature,priority=priority,
            description=description,adaptation=adaptation,gameplay=gameplay,visual=visual,animation=animation,audio=audio,
            implementation=f'Prévu : fiche de données {self.id.lower()}/{category}/{key.lower()} ; rattacher les ressources et états cités à cet identifiant. Aucun fichier de jeu créé par ce catalogue.',
            conditions=conditions,acceptance=acceptance,dependencies=list(dependencies),sourceIds=sourceIds,
            reference=reference or name,notes=notes))
        return id

    def rows(self, category, data, source='', reference='', nature='Établi', priority='P1'):
        """key|name|fait court|adaptation/regle|visuel|conditions|source override."""
        result=[]
        for line in data.strip().splitlines():
            if not line.strip() or line.lstrip().startswith('#'): continue
            p = line.strip().split('|')
            assert len(p) >= 5, (category,p)
            p += ['']*(7-len(p))
            key,name,fact,design,look,condition,src = p[:7]
            result.append(self.add(category,key,name,fact,design,visual=look,conditions=condition,source=src or source,reference=reference or name,nature=nature,priority=priority))
        return result

    def original(self, category, key, name, design, look, conditions='', dependencies=(), acceptance='', gameplay='', animation='', audio='', priority='P1'):
        return self.add(category,key,name,f'Livrable original proposé : {name}.',design,gameplay=gameplay,visual=look,conditions=conditions,dependencies=dependencies,nature='Extrapolation',acceptance=acceptance,animation=animation,audio=audio,priority=priority,reference='Adaptation originale — spécification de production')

    def originals(self, category, data, priority='P1'):
        # key|name|design|visuel|condition|dependances category:key,category:key
        for line in data.strip().splitlines():
            if not line.strip() or line.lstrip().startswith('#'):continue
            p=line.strip().split('|'); p+=['']*(6-len(p))
            key,name,design,look,cond,deps=p[:6]
            dep=[self.ident(*d.split(':',1)) for d in deps.split(',') if d]
            self.original(category,key,name,design,look,cond,dep,priority=priority)

    def sprites(self, categories=('characters','enemies')):
        for e in list(self.entries):
            if e['category'] not in categories: continue
            key=e['id'].split('-',2)[2]
            self.original('sprites',f'{PREFIX[e["category"]]}-{key}',f'Planche sprites — {e["name"]}',
                f'Produire une planche originale de {e["name"]} pour le groupe 2D sur décor 3D. Séparer visage, arme et effets pour préserver les variantes d’état décrites dans la fiche de rôle.',
                e['visual'],e['conditions'],[e['id']],
                acceptance=f'À l’échelle de jeu, {e["name"]} est identifiable en silhouette ; pivot aux pieds, masque de profondeur et huit orientations proposés restent stables devant les couverts.',
                gameplay='Le sprite ne définit pas la hitbox. Distinguer position au sol, hauteur visuelle et zone ciblable afin que les grandes silhouettes ne cachent pas les cibles voisines.',
                animation=f'Prévoir un état neutre, déplacement, préparation de l’action signature, impact reçu, mise à terre et retour en contrôle pour {e["name"]}. Éviter la duplication miroir des signes asymétriques.',
                audio='Sans bande sonore embarquée dans la planche ; émettre uniquement des événements nommés vers le système audio pour éviter les doublons.')

    def cover(self, area, covered, remaining):
        self.coverage.append(dict(area=area,covered=covered,remaining=remaining))

    def write(self):
        sources={s['id'] for s in self.sources}
        for e in self.entries:
            assert all(d in self.ids for d in e['dependencies']), (e['id'],e['dependencies'])
            assert all(s in sources for s in e['sourceIds']), (e['id'],e['sourceIds'])
        counts=Counter(e['category'] for e in self.entries)
        missing=set(CATEGORIES)-set(counts)
        assert not missing, missing
        obj=dict(id=self.id,title=self.title,medium='Jeu vidéo',filename=self.title.replace(':','').replace(' ','_').replace('é','e')+'_Production.xlsx',
            scope=self.scope,
            summary=f'{len(self.entries)} fiches de préparation couvrant les 26 familles du schéma. Sources consultées au 22 octobre 2026 ; inventaire de production substantiel, sans prétention d’exhaustivité vérifiée.',
            canonNote='Les faits de l’œuvre sont limités au champ description et à leur référence. Toutes les règles ATB, les valeurs de réglage, les découpages d’arènes, les mouvements combinés et les ressources proposées sont des créations d’adaptation. Les variantes de choix sont mutuellement conditionnelles ; aucune partie type ne devient canon universel. Les sources wiki restent secondaires et les intitulés anglais servent de clés de recherche, pas de traduction française officielle.',
            sources=self.sources,entries=self.entries,coverage=self.coverage)
        out=ROOT/'catalogs'/f'{self.id}.json';out.parent.mkdir(exist_ok=True)
        out.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
        print(self.id,len(self.entries),dict(sorted(counts.items())),len(self.sources),'sources',out)
        return obj
