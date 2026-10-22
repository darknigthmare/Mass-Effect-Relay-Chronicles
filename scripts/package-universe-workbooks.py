"""Build the catalogue index, manifest and ZIP from verified workbook exports.

This script reads XLSX files without modifying them. Spreadsheet authoring is
handled by build-universe-workbooks.mjs.
"""
from collections import Counter
from hashlib import sha256
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


def main():
    books = {p.stem: json.loads(p.read_text()) for p in (BASE / 'catalogs').glob('*.json')}
    assert set(books) == set(EXPECTED), f'Catalogue set differs: {set(books) ^ set(EXPECTED)}'
    expected_files = {b['filename'] for b in books.values()}
    actual_files = {p.name for p in OUT.glob('*.xlsx')}
    assert actual_files == expected_files, f'Workbook files differ: {actual_files ^ expected_files}'
    qa = json.loads((BASE / 'qa/verification.json').read_text())
    checks = {row['id']: row for row in qa['results']}
    assert set(checks) == set(EXPECTED) and qa['workbooks'] == 27
    visual = {}
    for report in (BASE / 'qa').glob('visual-*.json'):
        payload = json.loads(report.read_text())
        for item in payload.get('workbooks', []):
            assert len(set(item['worksheetsReviewed'])) == 28, f'Incomplete visual review: {item["id"]}'
            assert not item.get('blockingIssues', []), f'Blocking visual issue: {item["id"]}'
            visual[item['id']] = item
    assert set(visual) == set(EXPECTED), f'Missing visual reviews: {set(EXPECTED)-set(visual)}'
    seen = set()
    records = []
    all_natures = Counter()
    source_urls = set()
    for group, ids in GROUPS:
        for bid in ids:
            b = books[bid]
            workbook = OUT / b['filename']
            digest = sha256(workbook.read_bytes()).hexdigest()
            assert checks[bid]['sha256'] == digest, f'Outdated verification: {bid}'
            for entry in b['entries']:
                assert entry['id'] not in seen, f'Duplicate global identifier {entry["id"]}'
                assert entry['status'] == 'Défini'
                seen.add(entry['id'])
            natures = Counter(e['nature'] for e in b['entries'])
            all_natures.update(natures)
            source_urls.update(s['url'] for s in b['sources'])
            records.append({
                'id': bid, 'title': b['title'], 'group': group, 'medium': b['medium'],
                'filename': b['filename'], 'records': len(b['entries']), 'sheets': 28,
                'domainsWithRecords': len({e['category'] for e in b['entries']}),
                'categoryCounts': dict(Counter(e['category'] for e in b['entries'])),
                'natureCounts': dict(natures), 'sourceReferences': len(b['sources']),
                'sha256': digest, 'bytes': workbook.stat().st_size,
                'catalogSha256': sha256((BASE / 'catalogs' / f'{bid}.json').read_bytes()).hexdigest(),
                'scope': b['scope'], 'limits': b['canonNote'],
            })
    total = sum(r['records'] for r in records)
    manifest = {
        'version': 1, 'date': '2026-10-22', 'workbookCount': 27,
        'worksheetCount': 756, 'recordCount': total,
        'formulaCount': sum(r['formulas'] for r in checks.values()),
        'sourceReferences': sum(r['sourceReferences'] for r in records),
        'uniqueSourceUrls': len(source_urls), 'natureCounts': dict(all_natures),
        'implementationStatus': 'Toutes les fiches sont au statut Défini ; aucune nouvelle campagne ou ressource implémentée n’est attestée par ces classeurs.',
        'workbooks': records,
    }
    (BASE / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

    def index(zip_mode=False):
        by_id = {r['id']: r for r in records}
        text = [
            '# Relay Chronicles — 27 classeurs de l’univers Mass Effect', '',
            f'**27 fichiers Excel · 756 onglets · {total:,} fiches de production** — état documentaire du 22 octobre 2026.'.replace(',', ' '), '',
            'Ces classeurs prolongent le catalogue ME1 existant pour préparer des adaptations en RPG à commandes ATB, avec personnages principalement en sprites 2D et décors 3D. Ils partagent la charte du classeur initial : titres bleu nuit, accents turquoise, lignes alternées, filtres, volets figés et cellules de statut ambre.', '',
            '**Toutes les nouvelles fiches sont au statut « Défini ».** Les colonnes de conception décrivent le travail proposé. Elles ne certifient pas que les campagnes, cartes ou sprites correspondants sont déjà réalisés. Le prototype jouable du dépôt conserve son périmètre ME1 décrit dans le README principal.', '',
        ]
        if not zip_mode:
            text.extend(['**[Télécharger les 27 classeurs en une archive](outputs/relay-chronicles-20261022/Mass_Effect_Universe_27_Classeurs.zip)**', '',
                         '[Classeur ME1 existant](../Mass_Effect_Relay_Chronicles_Production.xlsx) · [Manifeste et empreintes](manifest.json) · [Données JSON](catalogs/) · [Rapports de vérification](qa/)', ''])
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
            '- **ME4** : le titre est un nom de travail. Les annonces officielles du 21 octobre 2026 sont répertoriées séparément. Le module **Les Routes du silence** est une campagne originale extrapolée : équipage, mondes, missions, boss et conclusions ne sont pas présentés comme un scénario officiel retrouvé. Sources : [EA](https://www.ea.com/news/building-eas-next-chapter) et [BioWare](https://blog.bioware.com/2026/10/21/bioware-update/).',
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
            f'Les 27 fichiers ont été ouverts comme archives XLSX et contrôlés contre leurs catalogues : 756 onglets, {format(total, ",").replace(",", " ")} identifiants, tous les champs exportés, dépendances et sources, compteurs, filtres, validations et volets figés. Les {format(manifest["formulaCount"], ",").replace(",", " ")} formules ne présentent pas d’erreur de cellule dans les exports. Une modification temporaire de statut a vérifié la mise à jour des compteurs avant restitution de « Défini ».', '',
            'Chaque onglet a fait l’objet d’un rendu et d’une revue visuelle de sa zone d’ouverture. Des extraits des colonnes de production et de la couverture ont également été revus. Cette inspection ne signifie pas une lecture visuelle de chaque cellule ; les textes complets font l’objet du contrôle automatique distinct. Les scénarios QA décrits dans les fiches restent des tests futurs du jeu.', '',
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
                'Depuis la racine du dépôt, vérifier puis reconstruire l’index et l’archive après la revue visuelle des nouveaux rendus :', '',
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
                      'archive': str(archive), 'bytes': archive.stat().st_size,
                      'sha256': sha256(archive.read_bytes()).hexdigest()}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
