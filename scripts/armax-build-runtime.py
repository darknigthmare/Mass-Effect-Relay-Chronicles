#!/usr/bin/env python3
"""Extract the explicitly condensed Nacre encounter data; never mark art as validated.

Run again when a native PNG arrives. This script reads pixels for bounds only;
it does not resample, repaint, or synthesize any art.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'DLC/LesDettesDeNacre'
world = json.loads((SOURCE / 'nacre-world.json').read_text())
roster = json.loads((SOURCE / 'nacre_roster_design.json').read_text())

# Three actual actions per boss phase. These are adaptations, not the full
# environment/auxiliary/node mechanics in the design source.
boss_kinds = [
    ['melee', 'zone', 'charge'], ['projectile', 'pulse', 'projectile'],
    ['trap', 'projectile', 'zone'], ['melee', 'zone', 'throw'],
    ['charge', 'sweep', 'melee'], ['projectile', 'trap', 'projectile'],
    ['melee', 'zone', 'sweep'], ['projectile', 'trap', 'charge'],
    ['projectile', 'shield', 'projectile'], ['charge', 'melee', 'zone'],
    ['sweep', 'projectile', 'melee'], ['zone', 'sweep', 'zone'],
    ['trap', 'zone', 'sweep'], ['zone', 'projectile', 'sweep'],
    ['melee', 'sweep', 'pulse'], ['projectile', 'zone', 'pulse'],
    ['zone', 'sweep', 'projectile'], ['projectile', 'trap', 'pulse'],
    ['melee', 'projectile', 'throw'], ['projectile', 'zone', 'projectile'],
]
boss_static = {7, 11, 12, 14, 15}
enemy_kinds = ['melee', 'projectile', 'throw', 'zone', 'trap', 'charge',
               'projectile', 'shield', 'projectile', 'sweep', 'charge',
               'trap', 'charge', 'melee', 'zone', 'charge', 'pulse',
               'sweep', 'projectile', 'pulse']
enemy_static = {17, 19}
counterplay = {
    'melee': 'Reculer hors de portée pendant l’annonce, puis punir la récupération.',
    'projectile': 'Garder debout ou sauter la ligne de tir ; avancer pendant la récupération.',
    'charge': 'Sauter la percée physique ou la bloquer, puis punir le freinage.',
    'zone': 'Sortir de la zone verrouillée au début de l’annonce, ou sauter son activation.',
    'sweep': 'Sauter le balayage bas ou tenir la garde basse.',
    'pulse': 'Sortir du rayon local annoncé, ou tenir la garde.',
    'trap': 'Sauter la mine ou s’en éloigner ; une seule mine active par adversaire.',
    'throw': 'Sauter avant la prise ou appuyer sur Prise dans les dix frames de déprojection.',
    'shield': 'Interrompre la recharge annoncée ; deux réserves plafonnées, sans soin de vie.',
}
names = {'melee': 'Frappe engagée', 'projectile': 'Tir annoncé',
         'charge': 'Percée physique', 'zone': 'Zone verrouillée',
         'sweep': 'Balayage bas', 'pulse': 'Impulsion locale',
         'trap': 'Balise de proximité', 'throw': 'Prise annoncée',
         'shield': 'Réserve de protection'}


def art(category, id):
    rel = f'assets/armax/lot22/originals/{category}/{id}.png'
    revised = f'assets/armax/lot22/originals/{category}/{id}_r1.png'
    if (ROOT / 'public' / revised).is_file():
        rel = revised
    path = ROOT / 'public' / rel
    result = {'sprite': rel, 'visualBounds': None, 'assetAvailable': path.is_file(), 'sourceVariant': 'r1' if rel == revised else 'base'}
    if path.is_file():
        with Image.open(path) as im:
            result['nativeSize'] = list(im.size)
            result['visualBounds'] = list(im.getchannel('A').point(lambda v: 255 if v > (32 if category == 'fx' else 128) else 0).getbbox() or (0, 0, *im.size)) if im.mode == 'RGBA' else [0, 0, *im.size]
    return result


def body(species, is_boss=False):
    s = species.lower()
    if 'volus' in s:
        return 1100 if is_boss else 600, 400, 1.5, 2.35
    if 'krogan' in s:
        return 1650 if is_boss else 1000, 130, 1.8, 3.9
    if 'elcor' in s:
        return 1750 if is_boss else 1100, 180, 1.2, 3.7
    if any(v in s for v in ['drone', 'sonde']):
        return 1100 if is_boss else 450, 140, 2.1, 1.8
    if any(v in s for v in ['méca', 'machine', 'robot', 'foreuse', 'grue', 'système', 'noyau']):
        return 1600 if is_boss else 800, 180, 1.7, 3.75
    return 1350 if is_boss else 700, 220 if is_boss else 140, 2.3, 3.7


def make(id, name, species, kinds, stages, phases, is_boss, stationary):
    life, shield, speed, height = body(species, is_boss)
    result = dict(id=id, name=name, species=species,
                  role='Défi de boss condensé' if is_boss else 'Rencontre d’avant-poste',
                  life=life, shield=shield, speed=0 if stationary else speed, height=height,
                  specialName=names[kinds[0]], specialKind=kinds[0] if kinds[0] in ['projectile', 'trap', 'charge', 'shield'] else 'melee',
                  color='#8d9ce3' if 'asari' in species.lower() else '#e7b473',
                  stageId=stages[0], stageIds=stages,
                  status='Prototype condensé', fullKitImplemented=False, animationStatus='pose_fixe')
    result.update(art('bosses' if is_boss else 'enemies', id))
    result['encounter'] = dict(kind='boss' if is_boss else 'enemy', stationary=stationary,
        fullDesignImplemented=False,
        implementationScope='Actions simples annoncées. Auxiliaires, pièces destructibles, couverts et interactions de décor restent à produire.',
        phases=[dict(id=p['id'], name=p['name'], threshold=p['entryHpPercentAtOrBelowProposal'],
                     action=kinds[i], actionName=names[kinds[i]],
                     warning=p['warningFramesProposal'], recovery=p['recoveryFramesProposal'],
                     counterplay=counterplay[kinds[i]]) for i, p in enumerate(phases)])
    result['finisherCompatible'] = False
    return result


bosses = []
for i, b in enumerate(world['bosses'], 1):
    p = make(b['id'], b['name'], b['speciesOrChassis'], boss_kinds[i-1], [b['stageId']], b['phases'], True, i in boss_static)
    p.update(narrativeRole=b['narrativeRole'], victory=b['victory'], sourceSignatureMechanic=b['signatureMechanic'])
    bosses.append(p)

enemies = []
for i, e in enumerate(world['enemies'], 1):
    phase = {'id': e['id'] + '_routine', 'name': e['combatRole'].capitalize(),
             'entryHpPercentAtOrBelowProposal': 100, 'warningFramesProposal': 30,
             'recoveryFramesProposal': 36}
    p = make(e['id'], e['name'], e['speciesOrChassis'], [enemy_kinds[i-1]], e['stageIds'], [phase], False, i in enemy_static)
    p.update(narrativeRole=e['behavior'], victory='Poste sécurisé ; adversaire neutralisé, sans mort narrative automatique.')
    enemies.append(p)

campaigns = []
for f in roster['fighters']:
    c = f['campaign']
    campaigns.append(dict(fighterId=f['id'], intro=c['intro'], rivalId=c['rivalId'],
        rivalReason=c['rivalReason'], rivalDialogue=c['rivalDialogue'], rivalOutcome=c['rivalOutcome'],
        stageIds=c['stageIds'], rivalIndex=3, finalBossId=c['finalBossId'],
        ending=c['ending'], canonScope=c['canonScope'], choiceImplemented=False,
        storyIllustrationsComplete=False,
        scope='Route prototype de huit duels : rival au quatrième combat, défis condensés aux autres étapes.'))

stage_info = [dict(id=s['id'], name=s['name'], brief=s['visualBrief'], bossId=s['bossId']) for s in world['stages']]
effects = [dict(id=id, kind=kind, facingSign=-1 if kind == 'biotic' else 1, **art('fx', id)) for id, kind in [('nacre_fx_01', 'kinetic'), ('nacre_fx_05', 'biotic'), ('nacre_fx_15', 'trap')]]
fighter_art = {f['id']: art('fighters', f['id']) for f in roster['fighters']}
stage_art = []
for stage in world['stages']:
    visual = art('stages', stage['id'])
    stage_art.append(dict(id=stage['id'], name=stage['name'], image=visual['sprite'], assetAvailable=visual['assetAvailable'], sourceVariant=visual['sourceVariant']))
output = '// Generated by scripts/armax-build-runtime.py from the Nacre bible.\n// Condensed executable profiles; no assertion of artistic or full-kit validation.\n'
for name, value in [('ARMAX_BOSSES', bosses), ('ARMAX_ENEMIES', enemies), ('ARMAX_CAMPAIGNS', campaigns), ('ARMAX_STAGE_STORIES', stage_info), ('ARMAX_EFFECTS', effects), ('ARMAX_FIGHTER_ART', fighter_art), ('ARMAX_STAGE_ART', stage_art)]:
    output += f'export const {name}=Object.freeze({json.dumps(value, ensure_ascii=False, indent=2)});\n'
(ROOT / 'src/armax-expansion-data.js').write_text(output)
print(json.dumps({'bossProfiles': len(bosses), 'bossImages': sum(b['assetAvailable'] for b in bosses),
                  'enemyProfiles': len(enemies), 'enemyImages': sum(e['assetAvailable'] for e in enemies),
                  'campaignRoutes': len(campaigns), 'effectImages': sum(e['assetAvailable'] for e in effects), 'fullBossDesignsImplemented': 0}, ensure_ascii=False))
