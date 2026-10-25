"""Build the catalogue index, manifest and ZIP from verified workbook exports.

This script reads XLSX files without modifying them. Spreadsheet authoring is
handled by build-universe-workbooks.mjs.
"""
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
import argparse
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'docs/universe'
OUT = BASE / 'outputs/relay-chronicles-20261022'
GROUPS = [
    ('Jeux', ['ME2', 'ME3', 'MEA', 'INF', 'GAL']),
    ('Romans', ['REV', 'ASC', 'RET', 'DEC', 'NEX', 'INI', 'ANN']),
    ('Comics et collections', ['RED', 'EVO', 'INV', 'HOM', 'FOU', 'INC', 'INQ', 'CON', 'BLA', 'HWB', 'LIB', 'DIS']),
    ('Film, extrapolation et contenus coupés', ['PL', 'ME4', 'CUT']),
]
EXPECTED = [bid for _, ids in GROUPS for bid in ids]
STATUSES = ['Défini', 'Prototype', 'Intégré', 'Validé']
CATEGORIES = [
    ('characters', 'Personnages'), ('npcs', 'PNJ'), ('lore', 'Espèces et factions'),
    ('worlds', 'Mondes'), ('zones', 'Zones et cartes'), ('links', 'Liaisons et parcours'),
    ('scenery', 'Décors 3D'), ('props', 'Objets et véhicules'), ('enemies', 'Ennemis et boss'),
    ('main_quests', 'Missions principales'), ('side_quests', 'Secondaires et DLC'),
    ('choices', 'Choix et relations'), ('dialogues', 'Dialogues'), ('cinematics', 'Cinématiques'),
    ('weapons', 'Armes'), ('equipment', 'Armures et équipement'), ('powers', 'Pouvoirs'),
    ('ally_moves', 'Movesets alliés'), ('enemy_moves', 'Movesets ennemis'),
    ('animations', 'Animations'), ('sprites', 'Sprites et atlas'), ('vfx', 'Effets visuels'),
    ('audio', 'Audio'), ('systems', 'Systèmes et interface'), ('qa', 'Tests de validation'),
    ('continuity', 'Continuité et sauvegardes'),
]


def visual_reviews(checks):
    """Old unbound screenshots are history, never proof of a regenerated file."""
    historical, current = [], {}
    for report in sorted((BASE / 'qa').glob('visual-*.json')):
        payload = json.loads(report.read_text())
        items = payload.get('workbooks', [])
        if not isinstance(items, list):
            continue
        historical.append({'reportPath': report.relative_to(ROOT).as_posix(),
                           'date': payload.get('date'), 'workbookIds': [item['id'] for item in items],
                           'scope': 'Archive de revue ; ne vaut pas contrôle visuel des exports actuels sans empreintes concordantes.'})
        for item in items:
            check = checks.get(item.get('id'))
            if not check or item.get('sha256') != check['sha256'] or item.get('catalogSha256') != check['catalogSha256']:
                continue
            assert len(set(item.get('worksheetsReviewed', []))) == 28, f'Incomplete current visual review: {item["id"]}'
            assert not item.get('blockingIssues', []), f'Blocking current visual issue: {item["id"]}'
            current[item['id']] = {'reportPath': report.relative_to(ROOT).as_posix(), 'date': payload.get('date'),
                                   'sha256': item['sha256'], 'catalogSha256': item['catalogSha256']}
    return historical, current


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check inputs and compute the manifest without writing any files.')
    parser.add_argument('--verification', type=Path, default=BASE / 'qa/verification.json')
    args = parser.parse_args()
    books = {}
    catalog_paths = {}
    for p in sorted((BASE / 'catalogs').glob('*.json')):
        book = json.loads(p.read_text())
        bid = book['id']
        assert bid not in books, f'Duplicate work ID: {bid}'
        books[bid] = book
        catalog_paths[bid] = p
    assert set(books) == set(EXPECTED), f'Catalogue set differs: {set(books) ^ set(EXPECTED)}'
    expected_files = {b['filename'] for b in books.values()}
    actual_files = {p.name for p in OUT.glob('*.xlsx')}
    assert actual_files == expected_files, f'Workbook files differ: {actual_files ^ expected_files}'
    qa = json.loads(args.verification.read_text())
    assert qa.get('auditVersion') == 2, 'A current version-2 XLSX audit is required; run verify-universe-workbooks.py.'
    checks = {row['id']: row for row in qa['results']}
    assert set(checks) == set(EXPECTED) and qa['workbooks'] == 27
    historical_visual, current_visual = visual_reviews(checks)
    seen = set()
    records = []
    all_natures = Counter()
    all_statuses = Counter()
    source_urls = set()
    for group, ids in GROUPS:
        for bid in ids:
            b = books[bid]
            workbook = OUT / b['filename']
            digest = sha256(workbook.read_bytes()).hexdigest()
            assert checks[bid]['sha256'] == digest, f'Outdated verification: {bid}'
            catalog_digest = sha256(catalog_paths[bid].read_bytes()).hexdigest()
            assert checks[bid]['catalogSha256'] == catalog_digest, f'Outdated catalogue audit: {bid}'
            statuses = {status: sum(entry['status'] == status for entry in b['entries']) for status in STATUSES}
            assert checks[bid]['statusCounts'] == statuses, f'Outdated status audit: {bid}'
            assert checks[bid]['exactTextMatch'] and checks[bid]['columnsCompared'] == 19, f'Incomplete cell audit: {bid}'
            assert checks[bid]['formulaErrors'] == 0 and checks[bid]['formulaCachesChecked'] == checks[bid]['formulas'], f'Incomplete formula audit: {bid}'
            proof_rows = checks[bid]['nonDefinedRows']
            assert {row['id'] for row in proof_rows} == {entry['id'] for entry in b['entries'] if entry['status'] != 'Défini'}, f'Incomplete implementation proof audit: {bid}'
            for row in proof_rows:
                for proof in [*row['implementationPaths'], *row['evidence']]:
                    proof_file = (ROOT / proof['path']).resolve()
                    assert proof_file.is_relative_to(ROOT.resolve()) and proof_file.is_file(), f'Missing proof file: {proof["path"]}'
                    assert sha256(proof_file.read_bytes()).hexdigest() == proof['sha256'], f'Proof changed since audit: {proof["path"]}'
            for entry in b['entries']:
                assert entry['id'] not in seen, f'Duplicate global identifier {entry["id"]}'
                assert entry['status'] in STATUSES, f'Invalid status: {entry["id"]}'
                seen.add(entry['id'])
            natures = Counter(e['nature'] for e in b['entries'])
            all_natures.update(natures)
            all_statuses.update(statuses)
            source_urls.update(s['url'] for s in b['sources'])
            records.append({
                'id': bid, 'title': 'Mass Effect suivant — dossier prospectif' if bid == 'ME4' else b['title'],
                'catalogTitle': b['title'], 'group': group, 'medium': b['medium'],
                'filename': b['filename'], 'records': len(b['entries']), 'sheets': 28,
                'domainsWithRecords': len({e['category'] for e in b['entries']}),
                'categoryCounts': dict(Counter(e['category'] for e in b['entries'])),
                'natureCounts': dict(natures), 'statusCounts': statuses, 'sourceReferences': len(b['sources']),
                'sha256': digest, 'bytes': workbook.stat().st_size,
                'catalogPath': catalog_paths[bid].relative_to(ROOT).as_posix(),
                'qaPath': (BASE / 'qa' / catalog_paths[bid].name).relative_to(ROOT).as_posix(),
                'catalogSha256': catalog_digest,
                'scope': b['scope'],
                'limits': 'Dossier prospectif verrouillé. L’allégation d’annulation en octobre 2026 présente dans le catalogue n’a pas été validée et n’est pas retenue comme fait.' if bid == 'ME4' else b['canonNote'],
                'implementationProofs': proof_rows,
                'visualReview': {'currentExportReviewed': bid in current_visual,
                                 'current': current_visual.get(bid),
                                 'historicalReports': [item['reportPath'] for item in historical_visual if bid in item['workbookIds']]},
            })
    total = sum(r['records'] for r in records)
    manifest = {
        'version': 2, 'date': datetime.now(timezone.utc).date().isoformat(), 'workbookCount': 27,
        'worksheetCount': 756, 'recordCount': total,
        'formulaCount': sum(r['formulas'] for r in checks.values()),
        'sourceReferences': sum(r['sourceReferences'] for r in records),
        'uniqueSourceUrls': len(source_urls), 'natureCounts': dict(all_natures),
        'statusCounts': {status: all_statuses[status] for status in STATUSES},
        'implementationStatus': 'Les statuts sont repris des catalogues avec preuves de fichiers pour toute fiche non Défini. Les prototypes sont des profils ou équipements d’essai en chroniques isolées ; ils ne constituent pas des campagnes complètes ni une fidélité artistique 1:1. Cet audit XLSX ne réexécute pas les tests du jeu.',
        'xlsxAudit': {'version': qa['auditVersion'], 'verifiedAt': qa['verifiedAt'], 'scope': qa['scope']},
        'visualReview': {'currentExportsReviewed': len(current_visual), 'totalExports': len(records),
                         'historicalReports': historical_visual,
                         'scope': 'Les anciennes revues et leurs aperçus sont historiques. Un export courant n’est déclaré revu visuellement que si les empreintes du classeur et du catalogue correspondent.'},
        'workbooks': records,
    }
    if args.check:
        print(json.dumps({'ok': True, 'readOnly': True, 'workbooks': len(records), 'records': total,
                          'statusCounts': manifest['statusCounts'], 'currentExportsVisuallyReviewed': len(current_visual)}, ensure_ascii=False, indent=2))
        return
    (BASE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

    def index(zip_mode=False):
        by_id = {r['id']: r for r in records}
        status_summary = ' · '.join(f'{status} : {manifest["statusCounts"][status]:,}'.replace(',', ' ') for status in STATUSES)
        text = [
            '# Relay Chronicles — 27 classeurs de l’univers Mass Effect', '',
            f'**27 fichiers Excel · 756 onglets · {total:,} fiches de production** — export documentaire du {manifest["date"]}.'.replace(',', ' '), '',
            'Ces classeurs prolongent le catalogue ME1 existant pour préparer des adaptations en RPG à commandes ATB, avec personnages principalement en sprites 2D et décors 3D. Ils partagent la charte du classeur initial : titres bleu nuit, accents turquoise, lignes alternées, filtres, volets figés et cellules de statut ambre.', '',
            f'**Statuts des fiches : {status_summary}.** Les statuts non Défini ont des chemins de code et de preuves explicites vérifiés dans le dépôt. L’existence de ces fichiers ne promeut aucune fiche automatiquement. Les prototypes de profils et d’équipements sont des essais dans des chroniques indépendantes ; ils ne certifient ni des campagnes complètes, ni des cartes et sprites achevés, ni une fidélité 1:1.', '',
        ]
        if not zip_mode:
            text.extend(['**[Télécharger les 27 classeurs en une archive](outputs/relay-chronicles-20261022/Mass_Effect_Universe_27_Classeurs.zip)**', '',
                         '[Classeur ME1 existant](../Mass_Effect_Relay_Chronicles_Production.xlsx) · [Manifeste et empreintes](manifest.json) · [Données JSON](catalogs/) · [Rapports de vérification](qa/)', ''])
            text.extend([
                '### Chemins compatibles avec Windows', '',
                'L’identifiant documentaire de Conviction reste **`CON`**. Ses fichiers sont désormais [catalogs/CONVICTION.json](catalogs/CONVICTION.json) et [qa/CONVICTION.json](qa/CONVICTION.json), car [Windows réserve le nom `CON`, même avec une extension](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file). Les champs `catalogPath` et `qaPath` du manifeste donnent les chemins actuels.', '',
                'Les mentions historiques de `docs/universe/catalogs/CON.json` se lisent donc `docs/universe/catalogs/CONVICTION.json`. La mention conservée dans le catalogue Library Edition et dans son classeur est un texte de conception, sans lien actif. La correction des chemins Windows conservait les 27 catalogues et classeurs octet pour octet dans l’état historique `c614a45`. Les exports actuels peuvent évoluer avec les statuts et leurs preuves ; leurs empreintes figurent dans le manifeste courant.', '',
            ])
        for group, ids in GROUPS:
            text.extend([f'## {group}', '', '| Classeur | Fiches | Domaines renseignés | Références de sources |', '|---|---:|---:|---:|'])
            for bid in ids:
                r = by_id[bid]
                href = r['filename'] if zip_mode else 'outputs/relay-chronicles-20261022/' + r['filename']
                text.append(f'| [{r["title"]}]({href}) | {r["records"]} | {r["domainsWithRecords"]}/26 | {r["sourceReferences"]} |')
            text.append('')
        text.extend([
            'Le nombre de fiches mesure le contenu du catalogue. Il ne représente ni un pourcentage d’exhaustivité ni un pourcentage de réalisation. Les sources peuvent être communes à plusieurs œuvres ; une référence indiquée comme partielle ou inaccessible n’est pas une lecture intégrale.', '',
            '## Organisation de chaque classeur', '',
            '**Dashboard** compte les fiches par domaine, statut, nature de référence et priorité. Les 26 onglets de production utilisent des tableaux filtrables. **Guide** précise le périmètre, la méthode, les sources avec leurs URL, les limites d’accès et le travail restant.', '',
            '| Domaine | Domaine |', '|---|---|',
        ])
        for left, right in zip(CATEGORIES[:13], CATEGORIES[13:]):
            text.append(f'| {left[1]} | {right[1]} |')
        text.extend([
            '', 'Chaque fiche dispose d’un identifiant stable, d’un nom, d’un statut, d’une nature de référence et d’une priorité. Les colonnes détaillent le fait ou l’hypothèse de départ, l’adaptation, les règles de jeu, la direction visuelle, les animations, l’audio, la mise en œuvre prévue, les conditions et variantes, le critère d’acceptation, les dépendances, le repère dans l’œuvre, les sources et les notes.', '',
            'La description varie selon le domaine : structure et transitions d’une carte, phases et contres d’un adversaire, coûts et effets d’une action, poses et orientations d’un sprite, déclencheurs et conséquences d’un choix. Les valeurs de combat, agencements 3D et séquences jouables proposés sont des décisions de conception à éprouver en jeu.', '',
            'Certains domaines ne contiennent pas de fiche lorsqu’aucun élément assez précis n’a été identifié dans les sources consultées. Par exemple, les noms exacts d’armes ne sont pas inventés pour remplir un roman. L’onglet reste présent, et le Guide expose cette limite.', '',
            '## Interpréter les références', '',
            '| Nature | Signification |', '|---|---|',
            '| Établi | Fait de référence documenté ; les colonnes d’adaptation restent des propositions. |',
            '| À vérifier | Information partielle, contradiction, index ou détail à contrôler dans l’œuvre. |',
            '| Extrapolation | Création ou interprétation pour le fan game. |',
            '| Coupé attesté | Retrait étayé par une source identifiée ; état exact à relever si nécessaire. |',
            '| Concept abandonné | Piste de conception documentée, sans scénario final supposé. |',
            '| Allégation écartée | Hypothèse exclue de la continuité, avec motif. |', '',
            'Ces niveaux sont indépendants du statut de production. Une référence établie peut encore correspondre à une fiche entièrement à produire. Les quatre statuts proposés sont Défini, Prototype, Intégré et Validé. Toute progression de statut doit être accompagnée d’une preuve dans le projet.', '',
            '## Traitement des cas particuliers', '',
            '- **Mass Effect suivant — dossier prospectif (`ME4`)** : dossier verrouillé. L’allégation d’annulation en octobre 2026 figurant dans le catalogue d’origine n’a pas été validée et n’est pas retenue comme fait. Le module **Les Routes du silence** est une création extrapolée ; aucun scénario, équipage ou calendrier officiel complet n’est établi par ce dossier.',
            '- **Paragon Lost** : traité comme un film d’animation, avec une adaptation jouable proposée. [Présentation BioWare](https://blog.bioware.com/2013/03/12/mass-effect-paragon-lost-available-now-in-the-uk/).',
            '- **Library Edition** : traité comme une collection éditoriale. Le catalogue couvre ses volumes, leur contenu, les bonus et les renvois aux arcs ; il évite de compter la collection comme une nouvelle histoire.',
            '- **Deception** : les incohérences et l’annonce d’une révision sont documentées sans supposer qu’une édition corrigée a effectivement été publiée.',
            '- **Contenus coupés** : registre transversal de cas et de pistes, avec provenance, niveau de preuve, vérifications et reconstructions facultatives. Un fichier inutilisé, un concept, un mod, une théorie et un DLC absent d’une édition ne reçoivent pas le même statut.', '',
            '## Utilisation et maintenance', '',
            '1. Ouvrir le Guide pour lire le périmètre et les limites de l’œuvre.',
            '2. Filtrer un domaine par priorité P0/P1/P2 et par nature de référence.',
            '3. Suivre les dépendances entre identifiants avant de produire une mission ou une ressource.',
            '4. Renseigner les preuves et résultats de validation, puis faire progresser le statut.',
            '5. Reporter les décisions approuvées dans le catalogue JSON avant de régénérer le classeur.', '',
            'Les modifications faites dans Excel ne sont pas automatiquement réimportées dans les catalogues. Les formules portent sur les lignes exportées ; l’ajout de nouvelles fiches passe de préférence par le JSON et la régénération pour mettre à jour les plages et les dépendances.', '',
            '## Vérification effectuée', '',
            f'Les 27 fichiers actuels ont été ouverts comme archives XLSX et contrôlés contre les empreintes de leurs catalogues : 756 onglets, {format(total, ",").replace(",", " ")} identifiants, 19 colonnes par fiche, sources du Guide, dépendances, compteurs par statut et nature, filtres complets, validations et volets figés. Les {format(manifest["formulaCount"], ",").replace(",", " ")} formules ont un cache contrôlé sans erreur de cellule. Chaque fiche non Défini possède des chemins de source et de preuves existants, dont les empreintes sont liées à cet audit. Ce contrôle n’exécute pas les tests du jeu.', '',
            f'Revue visuelle liée aux empreintes des exports actuels : **{len(current_visual)}/27 classeurs**. Les anciens rapports `qa/visual-*.json` et leurs rendus restent des archives historiques séparées ; ils ne prouvent pas la lisibilité des nouveaux exports. Une génération avec `--no-render` ne produit aucun nouvel aperçu ni nouvelle revue visuelle. Les vérifications de texte et de structure ci-dessus portent, elles, sur les XLSX actuels.', '',
            'Les catalogues ne constituent pas une certification de fidélité 1:1. Les positions exactes, variantes de dialogues, statistiques d’origine, détails visuels et contenus non accessibles dans les sources consultées restent à relever dans les œuvres. Les limites sont inscrites dans chaque Guide.', '',
        ])
        if not zip_mode:
            text.extend([
                '## Régénération', '',
                'Les classeurs livrés sont utilisables sans outil de développement. Leur régénération nécessite le runtime d’édition `@oai/artifact-tool` ; elle ne fait pas partie des dépendances du jeu. Depuis un répertoire temporaire, lancer le script avec le runtime primaire et un chemin absolu vers le dépôt :', '',
                '```bash',
                '"$CODEX_PRIMARY_RUNTIME_NODE" /chemin/du/depot/scripts/build-universe-workbooks.mjs',
                '# Un seul catalogue : ajouter --ids ME2',
                '```', '',
                'L’option `--no-render` permet une régénération sans nouveaux aperçus. Depuis la racine du dépôt, contrôler les XLSX courants puis reconstruire l’index et l’archive. Une nouvelle revue visuelle doit référencer les empreintes du classeur et du catalogue pour être attribuée aux exports actuels :', '',
                '```bash', 'python3 scripts/verify-universe-workbooks.py', 'python3 scripts/package-universe-workbooks.py', '```', '',
                '[Schéma des catalogues](SCHEMA.md) · [Générateur Excel](../../scripts/build-universe-workbooks.mjs) · [Vérification](../../scripts/verify-universe-workbooks.py)', '',
            ])
        return '\n'.join(text)

    (BASE / 'README.md').write_text(index())
    archive = OUT / 'Mass_Effect_Universe_27_Classeurs.zip'
    with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=9) as z:
        for r in records:
            z.write(OUT / r['filename'], r['filename'])
        z.writestr('LISEZMOI.md', index(zip_mode=True))
        z.write(BASE / 'manifest.json', 'manifest.json')
    with ZipFile(archive) as z:
        assert z.testzip() is None
        assert sum(n.endswith('.xlsx') for n in z.namelist()) == 27
        for r in records:
            assert sha256(z.read(r['filename'])).hexdigest() == r['sha256']
    print(json.dumps({'workbooks': 27, 'sheets': 756, 'records': total,
                      'statusCounts': manifest['statusCounts'], 'currentExportsVisuallyReviewed': len(current_visual),
                      'archive': str(archive), 'bytes': archive.stat().st_size,
                      'sha256': sha256(archive.read_bytes()).hexdigest()}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
