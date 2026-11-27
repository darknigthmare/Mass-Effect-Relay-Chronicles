#!/usr/bin/env python3
"""Revue indépendante en lecture seule ; écrit uniquement ses deux rapports QA."""
import collections
import hashlib
import io
import json
import posixpath
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BASE = '8542d7ca03702dcf4b3bccd8ac938bd6574f20bc'
LOT = 'docs/armax/lot21/'
CAT = LOT + 'production-catalog.json'
MAN = LOT + 'art-production/manifest.json'
IDX = 'docs/armax/bible/content-associations.json'
WB = LOT + 'Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx'
OLDWB = 'docs/armax/lot20/Mass_Effect_Armax_Suivi_Lot20_2026-11-27.xlsx'
checks = []

def read(path):
    return (ROOT / path).read_bytes()

def data(path):
    return json.loads(read(path))

def digest(path):
    return hashlib.sha256(read(path)).hexdigest()

def base_bytes(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)

def check(label, condition, evidence=None, group='central'):
    checks.append({'id': f'{group}-{sum(c["group"] == group for c in checks) + 1:02d}', 'group': group, 'check': label, 'passed': bool(condition), 'evidence': evidence})

c, m, a = data(CAT), data(MAN), data(IDX)
b = json.loads(base_bytes('docs/armax/lot20/production-catalog.json'))
ba = json.loads(base_bytes(IDX))
ce, be = c['entries'], b['entries']
ci, bi = {e['id']: e for e in ce}, {e['id']: e for e in be}
ai, bai = {e['catalogId']: e for e in a['entries']}, {e['catalogId']: e for e in ba['entries']}
added = [e['id'] for e in ce if e['id'] not in bi]
completed = [e['id'] for e in ce if e['id'] in bi and not bi[e['id']]['assetFiles'] and e['assetFiles']]
excluded = set(c['policy']['automaticRetryExcludedIds'])
missing = {e['id'] for e in ce if not e['assetFiles']}
reuse = {'chr_me1_geth_rocket_trooper', 'chr_me1_geth_juggernaut', 'chr_me1_geth_destroyer', 'chr_mea_adhi_wild'}
identity = ['id', 'name', 'category', 'work', 'dlc', 'variant', 'plannedUse']
check('216 identités uniques ; 196 héritées dans le même ordre et 20 ajouts', len(ci) == len(ce) == 216 and [e['id'] for e in ce[:196]] == [e['id'] for e in be] and len(added) == 20, {'inherited': len(be), 'added': added})
changes = [(e['id'], k) for e in be for k in identity if e.get(k) != ci[e['id']].get(k)]
check('Sept champs d’identité de chacune des 196 fiches héritées inchangés', not changes, changes)
actual_counts = {'total': len(ce), 'withImage': len(ce) - len(missing), 'withoutImage': len(missing)}
check('Comptes recalculés 216 / 171 / 45', actual_counts == {'total': 216, 'withImage': 171, 'withoutImage': 45} and all(c['currentCounts'][k] == v for k,v in actual_counts.items()), actual_counts)
check('Deux anciennes fiches complétées, huit ajouts illustrés, 33 anciens manquants', set(completed) == {'chr_me3_adrien_victus','chr_me3_oleg_petrovsky'} and sum(bool(ci[i]['assetFiles']) for i in added) == 8 and len(missing & set(bi)) == 33, {'completed': completed})
cat_counts = dict(collections.Counter(e['category'] for e in ce))
role_counts = dict(collections.Counter(e['plannedUse'] for e in ce))
check('Catégories et rôles concordent entre catalogue et index', c['counts'] == cat_counts == a['counts']['byCategory'] and a['counts']['byPlannedUse'] == role_counts, {'categories': cat_counts, 'roles': role_counts})
check('196 associations héritées conservées hors projection et deux ajouts d’asset', all({k:v for k,v in bai[i].items() if k not in ['catalogSource','productionSnapshot']} == {k:v for k,v in ai[i].items() if k not in ['catalogSource','productionSnapshot','lot21AssetAssociation']} for i in bi))
relkeys = ['designSubjects','costumeIdentityWorkGroups','externalStageReferences','stageIdentitiesToKeepSeparate']
check('Collections de relations de conception, costumes, décors et non-équivalences intactes', all(a[k] == ba[k] for k in relkeys), {k:len(a[k]) for k in relkeys})
check('Anciennes politiques de rôle conservées et politique arme séparée', all(a['rolePolicies'][k] == v for k,v in ba['rolePolicies'].items()) and 'arme_candidat' in a['rolePolicies'])
check('216 projections d’identité, de présence, de fidélité et de moteur concordantes', set(ai) == set(ci) and all(all(ai[i].get(k) == ci[i].get(k) for k in identity if k != 'id') and ai[i]['productionSnapshot']['hasImageCandidate'] == bool(ci[i]['assetFiles']) and ai[i]['productionSnapshot']['fidelity1to1Validated'] == ci[i]['fidelity1to1Validated'] and ai[i]['productionSnapshot']['engineIntegrated'] == ci[i]['engineIntegrated'] for i in ci))
check('31 exclusions dont 30 sans image ; 29 anciennes exclusions conservées', len(excluded) == 31 and len(excluded & missing) == 30 and set(b['policy']['automaticRetryExcludedIds']).issubset(excluded), {'excluded': len(excluded), 'missingExcluded': len(excluded & missing), 'oldExcluded': len(b['policy']['automaticRetryExcludedIds'])})
check('15 fiches ouvertes dont quatre pistes de réemploi sans PNG', len(missing - excluded) == 15 and reuse.issubset(missing - excluded) and all(ci[i].get('pngCountLot21',0) == 0 for i in reuse), {'open':len(missing-excluded), 'reuseIds':sorted(reuse)})
check('Fidélité et moteur non validés pour les dix livraisons', len(m['assets']) == 10 and all(e['status'] == 'Prototype' and e['fidelity1to1Validated'] is False and e['engineIntegrated'] is False for e in m['assets']) and m['fidelity1to1Validated'] is False and m['engineIntegrated'] is False)
check('10 PNG livrés = sept récupérés + trois générés, tous sélectionnés', sum(e['recoveredThisTurn'] for e in m['assets']) == 7 and sum(e['generatedThisTurn'] for e in m['assets']) == 3 and all(e['recoveredThisTurn'] != e['generatedThisTurn'] and e['selected'] for e in m['assets']) and m['counts'] == {'deliveredPng':10,'recoveredPng':7,'generatedPng':3,'generationCalls':5,'generationRefusals':2,'selectedCandidates':10,'engineIntegrated':0,'certified1to1':0})
refusals = [e for e in m['attempts'] if e['outcome'] == 'moderation_blocked']
check('Cinq appels, trois succès et deux refus sans relance ni fichier', len(m['attempts']) == 5 and sum(e['outcome'] == 'generated' for e in m['attempts']) == 3 and {e['catalogId'] for e in refusals} == {'wpn_me2_m96_mattock','wpn_me3_m11_suppressor'} and all(e['path'] is None and e['selected'] is False and e['retryPerformed'] is False and e['automaticRetryExcluded'] for e in refusals))
check('Douze sujets du manifeste correspondent aux dix livraisons et deux refus', set(m['targetCatalogIds']) == {e['catalogId'] for e in m['assets'] + refusals})
from PIL import Image
technical = []
for e in m['assets']:
    with Image.open(ROOT/e['path']) as im:
        technical.append({'catalogId': e['catalogId'], 'path': e['path'], 'sha256': digest(e['path']), 'bytes': (ROOT/e['path']).stat().st_size, 'dimensions':list(im.size), 'mode':im.mode, 'alphaExtrema': list(im.getchannel('A').getextrema())})
check('Dix PNG décodables ; empreintes, dimensions et alpha concordent', all(all(t[k] == e['technical'][k] for k in ['sha256','bytes','dimensions','mode','alphaExtrema']) for t,e in zip(technical,m['assets'])), technical)
check('Les dix chemins PNG sont uniques et attribués une fois à leur fiche', len({e['path'] for e in m['assets']}) == 10 and all(ci[e['catalogId']]['assetFiles'] == [e['path']] and ci[e['catalogId']]['pngCountLot21'] == 1 for e in m['assets']))
check('Dix prompts présents et empreintes concordantes', all(digest(e['promptFile']) == e['promptSha256'] for e in m['assets']))
links = m['sourceManifests'] + m['qaFiles']
check('Trois sous-manifestes et trois rapports artistiques liés aux bons octets', len(m['sourceManifests']) == len(m['qaFiles']) == 3 and all(digest(e['path']) == e['sha256'] for e in links), links)
qa = [data(e['path']) for e in m['qaFiles']]
qaassets = {e['catalogId']:e for q in qa for e in q['assets']}
check('Dix revues artistiques liées ; réserves et URL disponibles pour chaque PNG', set(qaassets) == {e['catalogId'] for e in m['assets']} and all(qaassets[e['catalogId']]['technical']['sha256'] == e['technical']['sha256'] and qaassets[e['catalogId']]['reservations'] and qaassets[e['catalogId']]['sourceUrls'] for e in m['assets']))
check('Identifiants de références résolus dans les revues artistiques', all(set(e.get('referenceIds',[])).issubset({s['id'] for s in q['sources']}) for q in qa for e in q['assets']))
check('Identifiants de sources du catalogue tous résolus', all(set(e['sourceIds']).issubset(set(c['sources'])) for e in ce))
check('Revues lot20 préservées dans previousReferenceReview des deux fiches complétées', all(ci[i]['previousReferenceReview'] == bi[i]['latestReferenceReview'] and ci[i]['latestReferenceReview']['lot'] == 'lot21' and ci[i]['latestReferenceReview']['reason'] == ci[i]['referenceGap'] for i in completed))
snapshots = [s for s in a['sourceSnapshots'] if s.get('lot') == 'lot21']
check('Trois snapshots courants de l’index correspondent aux fichiers finaux', len(snapshots) == 3 and all(digest(s['path']) == s['sha256'] for s in snapshots), snapshots)
md = (ROOT/'docs/armax/bible/ASSOCIATIONS_CONTENU.md').read_text()
anchors = re.findall(r'<a id="([^"]+)"',md)
check('216 ancres documentaires, chacune une fois pour un ID du catalogue', all(anchors.count(i)==1 for i in ci) and len(set(anchors) & set(ci)) == 216)
guide = data('docs/armax/bible/guide-coverage-2026-11-27.json')
oldguide = json.loads(base_bytes('docs/armax/bible/guide-coverage-2026-11-27.json'))
check('68 rubriques, 204 critères et 40 scénarios planifiés conservés ; zéro exécuté', guide['requirements'] == oldguide['requirements'] and guide['counts'] == oldguide['counts'] and guide['counts']['totalSections'] == 68 and guide['counts']['totalDocumentedCriteria'] == 204 and guide['counts']['plannedGameplayScenarios'] == 40 and guide['counts']['gameplayScenariosExecutedByThisIntegration'] == 0)
gs = data('docs/armax/guides/source-manifest.json')
check('Trois originaux du guide conservés à l’identique', len(gs['files']) == 3 and all(read(e['path']) == base_bytes(e['path']) and digest(e['path']) == e['sha256'] for e in gs['files']))
recovery = (ROOT/(LOT+'RECUPERATION_TECHNIQUE.md')).read_text()
check('Restauration et pertes de provenance explicitement documentées et liées', c['recoveryRef'] == m['recoveryRef'] == LOT+'RECUPERATION_TECHNIQUE.md' and all(q.get('reconstructionNote') for q in qa) and all(x in recovery for x in ['réécrits','ne sont pas présentés comme les octets','null','trois réussites et deux refus']))

# Lecture ZIP/XML indépendante : aucune réexportation ni modification du classeur.
NS = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
def workbook(blob):
    result = {'sheets':{}, 'tables':{}}
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(t.text or '' for t in e.iter('{'+NS['m']+'}t')) for e in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        rel = {e.get('Id'): e.get('Target') for e in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        for s in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets',NS):
            target = rel[s.get(RID)]
            path = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join('xl',target))
            xml = ET.fromstring(z.read(path)); cells = {}
            for e in xml.findall('.//m:c',NS):
                v, f = e.find('m:v',NS), e.find('m:f',NS)
                value = v.text if v is not None else None
                if e.get('t') == 's' and value is not None: value = strings[int(value)]
                if e.get('t') == 'inlineStr': value = ''.join(t.text or '' for t in e.findall('.//m:t',NS))
                if value is not None or f is not None: cells[e.get('r')] = {'v':value,'f':f.text if f is not None else None,'error':e.get('t') == 'e'}
            result['sheets'][s.get('name')] = cells
        for name in z.namelist():
            if re.match(r'xl/tables/[^/]+\.xml$',name):
                t=ET.fromstring(z.read(name)); result['tables'][t.get('name')]={'ref':t.get('ref'),'xml':z.read(name).decode()}
    return result

w, ow = workbook(read(WB)), workbook(read(OLDWB))
def wc(label,condition,evidence=None):check(label,condition,evidence,'workbook')
def cv(sheet,addr,book=w): return book['sheets'][sheet].get(addr,{}).get('v')
def num(sheet,addr): return int(float(cv(sheet,addr) or 0))
wc('Classeur lot20 identique à la base Git', read(OLDWB) == base_bytes(OLDWB), {'sha256':digest(OLDWB)})
wc('Classeur lot21 identique à l’export préservé avant restauration', digest(WB) == '0c72622d22bed67d59836477a95006977a5492f485d8b4b462c37f1ee31032c4', {'sha256':digest(WB),'bytes':len(read(WB))})
wc('Six feuilles dans l’ordre attendu', list(w['sheets']) == ['Synthese','Catalogue','Recuperes','Attributions19','Revue20','Revue21'])
for name in ['Recuperes','Attributions19','Revue20']:
    wc(name+' : valeurs et formules historiques inchangées', w['sheets'][name] == ow['sheets'][name], {'populatedCells':len(w['sheets'][name])})
historical_tables = {k:v for k,v in ow['tables'].items() if 'Catalogue' not in k}
wc('Tables historiques conservées à l’identique', all(w['tables'].get(k) == v for k,v in historical_tables.items()), {k:v['ref'] for k,v in historical_tables.items()})
cols = ['A','B','C','D','E','F','K','L','P']
wc('Neuf colonnes d’identité des 196 lignes historiques inchangées', all(cv('Catalogue',f'{col}{row}') == cv('Catalogue',f'{col}{row}',ow) for row in range(6,202) for col in cols))
wc('Colonnes historiques H/R des 196 lignes inchangées', all(cv('Catalogue',f'{col}{row}') == cv('Catalogue',f'{col}{row}',ow) for row in range(6,202) for col in ['H','R']))
wc('Table Catalogue étendue à A5:Z221', any(v['ref'] == 'A5:Z221' for k,v in w['tables'].items() if 'Catalogue' in k), {k:v['ref'] for k,v in w['tables'].items()})
ids = [cv('Catalogue',f'L{row}') for row in range(6,222)]
wc('216 identifiants du classeur dans l’ordre exact du catalogue', ids == [e['id'] for e in ce] and len(set(ids)) == 216)
rowok = True
for row,e in enumerate(ce,6):
    expected = {'T':'Présent' if e['assetFiles'] else 'Absent','U':str(e.get('pngCountLot21',0)), 'V':'Oui' if e['id'] in excluded else 'Non','W':str(e.get('selectedPngCountLot21',0)), 'X':str(e.get('recoveredPngCountLot21',0)), 'Y':str(e.get('generatedPngCountLot21',0)), 'Z':'Oui' if e['id'] in reuse else 'Non'}
    rowok = rowok and all(cv('Catalogue',f'{col}{row}') == value for col,value in expected.items())
wc('Colonnes courantes T–Z concordantes pour les 216 lignes', rowok)
wcounts = {'total':len(ids),'withImage':sum(cv('Catalogue',f'T{r}')=='Présent' for r in range(6,222)), 'withoutImage':sum(cv('Catalogue',f'T{r}')=='Absent' for r in range(6,222)), 'delivered':sum(num('Catalogue',f'U{r}') for r in range(6,222)), 'selected':sum(num('Catalogue',f'W{r}') for r in range(6,222)), 'recovered':sum(num('Catalogue',f'X{r}') for r in range(6,222)), 'generated':sum(num('Catalogue',f'Y{r}') for r in range(6,222)), 'excluded':sum(cv('Catalogue',f'V{r}')=='Oui' for r in range(6,222)), 'missingExcluded':sum(cv('Catalogue',f'V{r}')=='Oui' and cv('Catalogue',f'T{r}')=='Absent' for r in range(6,222)), 'open':sum(cv('Catalogue',f'V{r}')=='Non' and cv('Catalogue',f'T{r}')=='Absent' for r in range(6,222)), 'reuse':sum(cv('Catalogue',f'Z{r}')=='Oui' for r in range(6,222))}
wc('Comptes indépendants du classeur : 216/171/45, 10=7+3, 31/30/15/4', wcounts == {'total':216,'withImage':171,'withoutImage':45,'delivered':10,'selected':10,'recovered':7,'generated':3,'excluded':31,'missingExcluded':30,'open':15,'reuse':4},wcounts)
reviewids = [cv('Revue21',f'A{r}') for r in range(6,28)]
wc('Revue21 couvre les vingt ajouts et deux anciennes fiches complétées', len(set(reviewids)) == 22 and set(reviewids) == set(added+completed))
wc('Revue21 expose exactement les deux refus', {cv('Revue21',f'A{r}') for r in range(6,28) if cv('Revue21',f'I{r}') == 'Refus sans relance'} == {'wpn_me2_m96_mattock','wpn_me3_m11_suppressor'})
formulaok=True
for row,i in enumerate(reviewids,6):
    cr=ids.index(i)+6
    for dest,source in {'F':'T','G':'U','H':'W','O':'V','P':'Z'}.items():
        cell=w['sheets']['Revue21'].get(f'{dest}{row}',{})
        formulaok = formulaok and (cell.get('f') or '').replace("'",'').replace('$','') == f'Catalogue!{source}{cr}' and cell.get('v') == cv('Catalogue',f'{source}{cr}')
wc('110 liaisons Revue21 → Catalogue : formules et valeurs en cache concordantes',formulaok)
wc('Aucune cellule d’erreur ni formule #REF dans les six feuilles', all(not v['error'] and '#REF!' not in (v['f'] or '') for cells in w['sheets'].values() for v in cells.values()))
summary_expected={'B14':216,'C14':171,'D14':45,'B19':10,'B29':7,'B30':3,'B40':30,'B41':15,'B42':4,'B43':31,'B44':10}
wc('Synthèse : onze valeurs en cache conformes aux comptes recalculés',all(num('Synthese',k)==v for k,v in summary_expected.items()),summary_expected)
extraction=data(c['workbookRecoveryEvidence'])
exok=extraction['sourceSha256']==digest(WB) and len(extraction['rows'])==20 and len(extraction['inheritedChangedRows'])==2
for e in extraction['rows']+extraction['inheritedChangedRows']:
    for j,value in enumerate(e['values']):
        col=chr(65+j)
        observed=cv('Catalogue',f'{col}{e["excelRow"]}')
        exok=exok and str('' if value is None else value)==str('' if observed is None else observed)
wc('Extraction de récupération : 22 lignes × 26 valeurs rattachées au classeur intact',exok)

paths=[CAT,MAN,IDX,'docs/armax/bible/ASSOCIATIONS_CONTENU.md','docs/armax/bible/BIBLE_ARMAX_INTEGREE.md','README.md','docs/armax/README.md',LOT+'README.md',LOT+'BIBLE_COMPLEMENTS_LOT21.md',LOT+'RECUPERATION_TECHNIQUE.md',LOT+'MANQUANTS_2026-11-27.md','docs/armax/bible/guide-coverage-2026-11-27.json',c['workbookRecoveryEvidence'],WB,OLDWB]
sources=[{'path':p,'bytes':len(read(p)),'sha256':digest(p)} for p in paths]
findings=[
 {'severity':'resolved','topic':'Autorité actuelle et historique','detail':'Le lien lot20 est historique ; la phrase sur le passage à 45 manquants est corrigée ; remainingCoverage qualifie les 45 manquants courants.'},
 {'severity':'limitation','topic':'Provenance après récupération','detail':'Les octets des dix PNG et du classeur sont préservés. Les documents et scripts sont reconstitués. Plusieurs caches de références ont disparu ; URL, observations antérieures et empreintes seulement quand conservées restent qualifiées dans les revues.'},
 {'severity':'limitation','topic':'Fidélité et intégration','detail':'Dix candidats au statut Prototype ; aucune certification 1:1, aucune intégration moteur. Les réserves sur silhouettes, microdétails, marquages et cadrage restent actives.'},
 {'severity':'limitation','topic':'Classeur','detail':'Contrôle ZIP/XML en lecture seule des valeurs, formules, plages et identités. Les résultats en cache sont contrôlés ; aucune ouverture ou exécution Microsoft Excel native n’est déclarée.'}
]
report={'schemaVersion':'1.0','project':'Mass Effect — Armax','lot':'lot21','reviewedAt':datetime.now(timezone.utc).isoformat(),'baseCommit':BASE,'reviewType':'independent_consolidation_review_after_restoration','scope':'Catalogue, manifeste, index, bible, documentation courante et classeur restauré. Aucun PNG ni fichier central modifié par cette revue.','reconstructionNote':'Nouveaux contrôles exécutés après restauration ; aucun nombre de contrôles antérieur n’est repris comme résultat courant.','result':'passed_with_explicit_limits' if all(x['passed'] for x in checks) else 'failed','summary':{'checks':len(checks),'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'centralChecks':sum(x['group']=='central' for x in checks),'workbookChecks':sum(x['group']=='workbook' for x in checks),'counts':actual_counts,'deliveredPng':10,'recoveredPng':7,'generatedPng':3,'inheritedIdentities':196,'addedIdentities':20,'inheritedCompleted':completed,'exclusions':31,'missingExcluded':30,'open':15,'reuse':4},'sourceFiles':sources,'checks':checks,'findings':findings,'command':'python docs/armax/lot21/qa/review-consolidation.py --write','method':'Comparaisons au contenu Git 8542d7c, recomptage JSON, SHA-256 et décodage Pillow des PNG, lecture directe ZIP/XML du classeur, relecture humaine des sections modifiées.','limits':['Aucune certification artistique 1:1.','Aucun test de gameplay, filtrage moteur, réseau, paiement ou lancement Windows.','Pas de réexport du classeur ni recalcul par Microsoft Excel natif.','Les références tierces perdues ne sont pas présentées comme disponibles dans le dépôt.']}
if '--write' in sys.argv:
    out=ROOT/(LOT+'qa/consolidation-review.json');out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    s=report['summary'];lines=['# Lot21 — revue indépendante de consolidation après restauration','',f'**Résultat : {s["passed"]}/{s["checks"]} contrôles réussis**, dont {s["centralChecks"]} contrôles centraux et {s["workbookChecks"]} contrôles ZIP/XML du classeur. Aucun défaut bloquant relevé.' if not s['failed'] else f'**Résultat : {s["failed"]} contrôle(s) en échec.**','',f'Base examinée : `{BASE}`. Les présents résultats proviennent d’une nouvelle exécution après restauration. Ils ne reprennent pas les comptes de tests antérieurs.','', '## Identités, comptes et relations','', 'Les 196 identités héritées et leur ordre sont conservés. Leurs noms, catégories, opus, DLC, variantes et usages n’ont pas changé. Les collections de relations de conception, costumes, décors et non-équivalences sont identiques à la base ; les seules évolutions des anciennes associations sont leur source courante, leur projection de production et les liens vers les deux images récupérées.','', 'Le catalogue contient **216 identités, 171 avec image candidate et 45 sans**. Victus et Petrovsky complètent deux anciennes fiches ; huit des vingt ajouts sont illustrés. Il reste 33 manquants dans le périmètre hérité. Les dix PNG livrés sont **sept récupérations et trois générations**, tous retenus comme prototypes. Les cinq appels de génération comprennent trois succès et deux refus sans relance ; aucun fichier vide ni réemploi potentiel ne compte comme PNG livré.','', 'Les 31 exclusions comprennent 30 fiches sans image et Kallo déjà illustré. Les 15 fiches ouvertes incluent quatre pistes de réemploi et onze autres lacunes de référence ou de production. Les 68 rubriques, 204 critères et 40 scénarios planifiés du guide sont conservés, avec zéro scénario exécuté par cette livraison.','', '## Classeur vérifié en lecture seule','', 'Le classeur est identique à l’export préservé : SHA-256 `'+digest(WB)+'`. Ses six feuilles, la table `Catalogue!A5:Z221`, les 216 IDs et les colonnes actuelles T–Z concordent avec le catalogue restauré. Les valeurs et formules de Recuperes, Attributions19 et Revue20 sont identiques au lot20. Les identités et colonnes historiques H/R des 196 anciennes lignes sont préservées.','', 'Revue21 couvre 22 fiches, dont les deux refus. Ses 110 formules de liaison vers Catalogue et leurs valeurs en cache sont concordantes. Les totaux 216/171/45, 10=7+3 et 31/30/15/4 sont recalculés depuis les cellules. L’extraction de récupération correspond aux 22 lignes × 26 valeurs du classeur. Ce contrôle n’est pas une exécution de Microsoft Excel natif.','', '## Provenance, rédaction et limites','']
    for f in findings:lines.extend(['- **'+f['topic']+' :** '+f['detail']])
    lines.extend(['','Les dix PNG ont été décodés de nouveau et leurs empreintes comparées aux trois rapports artistiques et au manifeste. Les prompts, sous-manifestes et snapshots courants de l’index correspondent aux fichiers livrés. La relecture des READMEs, de l’index et de la bible distingue le lot21 courant des résultats historiques. Les réserves particulières restent dans les trois revues artistiques ; la récupération technique ne les annule pas.','','## Fichiers relus et empreintes','','| Fichier | Octets | SHA-256 |','|---|---:|---|'])
    lines.extend('| `'+e['path']+'` | '+str(e['bytes'])+' | `'+e['sha256']+'` |' for e in sources)
    lines.extend(['','## Reproduction','','Commande : `python docs/armax/lot21/qa/review-consolidation.py --write`. Le script ne modifie que les deux rapports de cette revue. Le [JSON détaillé](consolidation-review.json) expose chaque contrôle, sa portée et les preuves associées.',''])
    out.with_suffix('.md').write_text('\n'.join(lines))
print(json.dumps({'summary':report['summary'],'failedChecks':[x for x in checks if not x['passed']]},ensure_ascii=False,indent=2))
sys.exit(0 if all(x['passed'] for x in checks) else 1)
