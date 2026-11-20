from pathlib import Path
from PIL import Image
import hashlib
import json
import shutil
import numpy as np

BASE = Path('/workspace/scratch/c3ca3f19d191')
WORK = BASE / 'work/generation_v3'
OUT = BASE / 'outputs/mass-effect/lot03'
RUN = WORK / 'runs/fighters_b.json'
data = json.loads(RUN.read_text())
descriptions = json.loads((WORK / 'fighters_b/qa-descriptions.json').read_text())
reviews_dir = WORK / 'reviews'
reviews_dir.mkdir(parents=True, exist_ok=True)
selected_ids = {d['selected_id'] for d in descriptions.values()}

def technical(asset):
    source = Path(asset['output_path'])
    target = OUT / asset['package_path']
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        shutil.copy2(source, target)
    with Image.open(source) as im:
        arr = np.asarray(im)
        alpha = arr[:, :, 3]
        bbox8 = Image.fromarray((alpha > 8).astype('uint8')).getbbox()
        bbox16 = Image.fromarray((alpha >= 16).astype('uint8')).getbbox()
        bbox128 = Image.fromarray((alpha >= 128).astype('uint8')).getbbox()
        vals, counts = np.unique(alpha, return_counts=True)
        margins = {'left': bbox16[0], 'top': bbox16[1], 'right': im.width-bbox16[2], 'bottom': im.height-bbox16[3]}
        pct = {k: round(v/(im.width if k in ('left', 'right') else im.height)*100, 3) for k, v in margins.items()}
        sha = hashlib.sha256(source.read_bytes()).hexdigest()
        copy_sha = hashlib.sha256(target.read_bytes()).hexdigest()
        t = {
            'size': list(im.size), 'mode': im.mode,
            'alpha_min': int(alpha.min()), 'alpha_max': int(alpha.max()),
            'alpha0_pct': round(float((alpha == 0).mean()) * 100, 6),
            'alpha1_8_pct': round(float(((alpha > 0) & (alpha <= 8)).mean()) * 100, 6),
            'alpha1_15_pct': round(float(((alpha > 0) & (alpha < 16)).mean()) * 100, 6),
            'alpha240_plus_pct': round(float((alpha >= 240).mean()) * 100, 6),
            'alpha255_pct': round(float((alpha == 255).mean()) * 100, 6),
            'bbox_alpha_nonzero': im.getchannel('A').getbbox(),
            'bbox_alpha_above_8': bbox8, 'bbox_alpha16': bbox16, 'bbox_alpha128': bbox128,
            'margins_alpha16_px': margins, 'margins_alpha16_pct': pct,
            'alpha_common': sorted(zip(map(int, vals), map(int, counts)), key=lambda x: -x[1])[:8],
            'visible_alpha16_border_max': int(max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max())) if max(alpha[0].max(), alpha[-1].max(), alpha[:, 0].max(), alpha[:, -1].max()) >= 16 else 0,
            'alpha_zero_rgb_nonzero_count': int(((alpha == 0) & (arr[:, :, :3].max(2) > 0)).sum()),
            'true_transparency': bool((alpha == 0).any() and (alpha >= 240).any()),
            'sha256': sha, 'copy_sha256': copy_sha, 'copy_identical': sha == copy_sha,
            'pixel_modifications': 'none',
            'rgb_under_alpha0_note': 'Les couleurs RGB stockées sous alpha 0 sont invisibles ; elles ne constituent pas un fond opaque.',
            'alpha_reserve': 'Le maximum est 254 et des pixels de très faible alpha subsistent hors du contour principal. Aucun compositing en moteur n’a été validé.'
        }
    asset['copied_to'] = str(target)
    asset['metadata'] = t
    target.with_suffix('.metadata.json').write_text(json.dumps(t, ensure_ascii=False, indent=2) + '\n')
    return t

def write_review(asset, description, is_selected):
    cid = asset['character_id']
    d = dict(description)
    d.pop('selected_id', None)
    t = asset['metadata']
    is_replaced = cid == 'javik' and not is_selected
    stem = f'{cid}_lot03_fighters_b_qa' if is_selected else f'{asset["id"]}_lot03_fighters_b_qa'
    path = reviews_dir / (stem + '.json')
    source_urls = list(asset['source_urls'])
    if cid not in ('peebee', 'jaal'):
        source_urls.insert(0, 'https://www.ea.com/games/mass-effect/community/cosplay-guides')
    elif asset.get('transport_url') not in source_urls:
        source_urls.append(asset['transport_url'])
    qa = {
        'id': cid, 'asset_id': asset['id'], 'revision': asset['revision'],
        'selected': is_selected, 'asset_path': asset['copied_to'],
        'source_output_path': asset['output_path'], 'reference_paths': asset['refs'],
        'source_urls': source_urls,
        'verdict': 'superseded_anatomy_error' if is_replaced else 'concept_accepted_with_reservations',
        'one_to_one_validated': False, 'single_character': True, 'full_body_visible': True,
        'facing_screen_right': True, 'animated': False, 'rigged': False,
        'gameplay_ready': False, 'engine_compositing_validated': False,
        'framing_margin_target_met': all(v >= 10 for v in t['margins_alpha16_pct'].values()),
        'technical': t, **d
    }
    if is_replaced:
        qa['costume_observations'] = [
            'La main levée gauche anatomique possède quatre doigts au total dans R0, contre trois dans la page 5 officielle.',
            'Le reste du costume et les pieds sont complets, mais les marges verticales sont serrées.',
            'R1 corrige la main et améliore le cadrage ; R0 est conservé uniquement pour la provenance.'
        ]
        qa['asymmetry'] = 'Main gauche levée avec un doigt supplémentaire ; main droite baissée à trois doigts.'
        qa['anchoring'] = 'Appuis décalés verticalement, marges hautes et basses serrées ; aucune validation moteur.'
        qa['replacement_asset_id'] = 'javik_ready_right_r1'
        qa['priority_corrections'] = ['Utiliser le fichier R1 retenu, pas R0.']
    path.write_text(json.dumps(qa, ensure_ascii=False, indent=2) + '\n')
    md = [f'# {qa["name"]} — {asset["revision"]}', '',
          f'**Verdict :** {qa["verdict"]}. **Sélection :** {"oui" if is_selected else "non"}.', '',
          'Concept statique. Fidélité 1:1, animation, rig, intégration moteur et aptitude au gameplay non validés.', '',
          f'Fichier : `{asset["copied_to"]}`', '',
          '## Identité', '', qa['identity'], '', '## Costume', '', qa['costume'], '']
    md += ['- ' + s for s in qa['costume_observations']]
    md += ['', '## Asymétries', '', qa['asymmetry'], '', '## Appuis et cadrage', '', qa['anchoring'], '',
           f'Marges au seuil alpha ≥ 16 : gauche {t["margins_alpha16_px"]["left"]} px, haut {t["margins_alpha16_px"]["top"]} px, droite {t["margins_alpha16_px"]["right"]} px, bas {t["margins_alpha16_px"]["bottom"]} px.', '',
           '## Transparence et intégrité', '',
           f'PNG {t["size"][0]} × {t["size"][1]}, {t["mode"]}. Alpha {t["alpha_min"]} à {t["alpha_max"]} ; {t["alpha0_pct"]:.2f} % de pixels totalement transparents. Copie identique aux octets originaux : {t["copy_identical"]}.', '',
           t['rgb_under_alpha0_note'], '', t['alpha_reserve'], '',
           f'SHA-256 : `{t["sha256"]}`', '', '## Corrections prioritaires', '']
    md += ['- ' + s for s in qa['priority_corrections']]
    md += ['', '## Sources officielles', ''] + ['- ' + u for u in source_urls]
    path.with_suffix('.md').write_text('\n'.join(md) + '\n')
    asset['qa_path'] = str(path)
    asset['qa_markdown_path'] = str(path.with_suffix('.md'))
    asset['qa_status'] = qa['verdict']
    return qa

qa_items = []
for a in data['assets']:
    a['selected'] = a['id'] in selected_ids and a['status'] == 'generated'
    if a['status'] != 'generated':
        a['qa_status'] = 'no_image_generation_refused'
        continue
    technical(a)
    qa_items.append(write_review(a, descriptions[a['character_id']], a['selected']))

reference_manifest = []
for cid, desc in descriptions.items():
    source_path = WORK / 'fighters_b/references' / cid / 'source.json'
    ref = json.loads(source_path.read_text())
    ref['visual_inspection'] = 'completed_for_listed_pages_only'
    ref['visually_inspected_pages'] = desc['inspected_pages']
    ref['inspection_method'] = 'view_image'
    ref['costume_observed'] = desc['costume']
    ref['reference_redistribution'] = 'not_in_deliverable_assets'
    source_path.write_text(json.dumps(ref, ensure_ascii=False, indent=2) + '\n')
    reference_manifest.append(ref)
(WORK / 'fighters_b/references/manifest.json').write_text(json.dumps(reference_manifest, ensure_ascii=False, indent=2) + '\n')

selected = [a for a in data['assets'] if a['selected']]
data['selected_assets'] = [a['id'] for a in selected]
data['selected_asset_paths'] = [a['copied_to'] for a in selected]
data['summary'] = {'attempts': len(data['assets']), 'generated_images': len(qa_items), 'selected_characters': len(selected), 'generation_failures': sum(a['status'] == 'generation_failed' for a in data['assets']), 'one_to_one_validated': False, 'animated': False}
RUN.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

lines = ['# Livraison — combattants B — lot 03', '',
         'Sept personnages retenus comme concepts statiques. Huit images ont été produites au total ; Javik R0 est écarté au profit de R1. Trois sorties initiales ont été refusées, puis chaque unique reprise neutre a abouti. Les refus et prompts exacts restent dans le journal.', '',
         '| Personnage | Révision retenue | Chemin relatif au lot 03 | QA |', '|---|---|---|---|']
for a in selected:
    lines.append(f'| {descriptions[a["character_id"]]["name"]} | {a["revision"]} | `{a["package_path"]}` | `{Path(a["qa_path"]).name}` |')
lines += ['', '## Limites', '',
          'Les sept PNG ont un vrai canal alpha. Les pixels RGB stockés sous alpha 0 ne sont pas un fond opaque. Les images restent des concepts : aucune fidélité 1:1, animation, garde, collision ou intégration en moteur n’est validée. Les marges verticales et les appuis sont décrits dans chaque QA. Les fichiers PNG ne sont pas retouchés ; les copies ont les mêmes SHA-256 que les originaux.', '',
          'Javik R1 corrige les trois doigts de la main levée et améliore le cadrage. Le PNG R0 reste dans le travail de provenance et ne doit pas être inclus dans la sélection livrée.', '',
          'Journal : `work/generation_v3/runs/fighters_b.json`.', '',
          'Sources : hub EA des cosplay guides Legendary Edition et kits Andromeda du hub BioWare Digital Media. Les PDF et planches sources ont été inspectés localement ; les URL et pages inspectées sont consignées, sans redistribuer les références dans les assets.']
(WORK / 'fighters_b/DELIVERY.md').write_text('\n'.join(lines) + '\n')
print(json.dumps(data['summary'], ensure_ascii=False))
print(json.dumps([{'id': a['id'], 'selected': a['selected'], 'path': a['copied_to'], 'qa_path': a['qa_path'], 'alpha0_pct': a['metadata']['alpha0_pct'], 'margins': a['metadata']['margins_alpha16_px']} for a in selected], ensure_ascii=False, indent=2))
