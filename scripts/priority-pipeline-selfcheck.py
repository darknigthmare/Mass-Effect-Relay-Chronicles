"""Exercise preservation on private copies; no gameplay or public tracking writes."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = '259d51267a64404048c1e18a1e549f5a356b63c6'
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
q = lambda name: f'{{{NS}}}{name}'
IMMUTABLE = ['id', 'category', 'name', 'episode', 'scope', 'canonLevel', 'reference', 'sourceId', 'sourceUrl',
             'acceptance', 'dependencies', 'priority', 'plannedPath']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def dump(filename, value):
    Path(filename).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prefix', required=True)
    args = parser.parse_args()
    assert args.prefix.startswith('priority-pipeline-selfcheck-') and '/' not in args.prefix
    output = ROOT / f'docs/qa/{args.prefix}.json'
    assert not output.exists(), 'Preserve the previous self-check attempt'
    baseline_dir = Path('/tmp/priority-workbook-baseline')
    baseline = json.loads((ROOT / 'docs/qa/priority-workbook-baseline.json').read_text())
    source = baseline_dir / 'Mass_Effect_Relay_Chronicles_Production.xlsx'
    catalog_before = baseline_dir / 'content-catalog.json'
    public_files = ['docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'public/assets/manifest.json']
    before_public = {name: sha((ROOT / name).read_bytes()) for name in public_files}
    assert before_public == baseline['sourceHashes']
    directory = Path(tempfile.mkdtemp(prefix=args.prefix + '-', dir='/tmp'))
    report = {'passed': False, 'baselineCommit': BASE, 'privateDirectory': str(directory), 'cases': [],
              'scope': 'One real native OpenXML copy-author/verify path and deliberate unrelated mutations on private candidates. This does not bypass or satisfy native gameplay, DEV, visual or publication gates.',
              'publicTrackingWritten': False}
    try:
        catalogue = json.loads(catalog_before.read_text())
        identifier = 'SYS-portee'
        entry = next(e for e in catalogue['entries'] if e['id'] == identifier)
        original = copy.deepcopy(entry)
        entry['description'] += ' Vérification native sur une copie privée, sans publication.'
        assert 'implementationPaths' not in original and 'evidence' not in original
        entry['implementationPaths'] = ['src/tactical-positions.js']
        entry['evidence'] = ['tests/tactical-combat.test.js']
        assert entry['description'] != original['description']
        scope = {'baseCommit': BASE, 'changedIds': [identifier], 'newIds': [],
                 'allowedFieldsById': {identifier: ['description', 'implementationPaths', 'evidence']}, 'immutableExistingFields': IMMUTABLE,
                 'promoteIfProved': []}
        scope_file = directory / 'scope.json'
        dump(scope_file, scope)
        catalogue_file = directory / 'catalogue.json'
        dump(catalogue_file, catalogue)
        plan = directory / 'plan.json'
        dump(plan, {'baseCommit': BASE, 'changedIds': [identifier], 'newIds': [], 'expectedFieldsById': {identifier: ['description', 'implementationPaths', 'evidence']}})
        candidate = directory / 'candidate.xlsx'
        author = directory / 'author.json'
        command = ['python', 'scripts/priority-patch-workbook.py', '--before', str(source), '--catalog-before', str(catalog_before),
                   '--catalog-after', str(catalogue_file), '--plan', str(plan), '--output', str(candidate), '--report', str(author)]
        authored = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
        assert authored.returncode == 0, authored.stdout + authored.stderr
        native_author = json.loads(author.read_text())
        update = {'baseCommit': BASE, 'scopeProof': {'sha256': sha(scope_file.read_bytes())}, 'changedIds': [identifier], 'newIds': [],
                  'explicitPromotions': [], 'catalogueChanges': [
                      {'id': identifier, 'field': 'description', 'before': original['description'], 'after': entry['description']},
                      {'id': identifier, 'field': 'implementationPaths', 'before': None, 'after': entry['implementationPaths']},
                      {'id': identifier, 'field': 'evidence', 'before': None, 'after': entry['evidence']}],
                  'cellChanges': native_author['cellChanges'], 'nativeAuthoring': native_author,
                  'outputHashes': {'workbook': sha(candidate.read_bytes()), 'catalogue': sha(catalogue_file.read_bytes())},
                  'integrationProofs': [], 'featureSourceHashes': {}}

        def verify(label, workbook, catalog, manifest, scope_data, expected_success):
            update_file = directory / f'{label}-update.json'
            scope_path = directory / f'{label}-scope.json'
            dump(scope_path, scope_data)
            manifest = copy.deepcopy(manifest)
            manifest['scopeProof']['sha256'] = sha(scope_path.read_bytes())
            manifest['outputHashes']['workbook'] = sha(workbook.read_bytes())
            manifest['nativeAuthoring']['outputSHA256'] = sha(workbook.read_bytes())
            manifest['outputHashes']['catalogue'] = sha(catalog.read_bytes())
            dump(update_file, manifest)
            native_output = directory / f'{label}-native.json'
            command = ['python', 'scripts/priority-verify-workbook.py', '--before', str(source), '--after', str(workbook),
                       '--catalog-before', str(catalog_before), '--catalog-after', str(catalog), '--changes', str(update_file),
                       '--scope', str(scope_path), '--output', str(native_output)]
            result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
            log = ROOT / f'docs/qa/{args.prefix}-{label}.txt'
            log.write_text(result.stdout + result.stderr)
            assert (result.returncode == 0) == expected_success, result.stdout + result.stderr
            report['cases'].append({'name': label, 'passed': True, 'expectedSuccess': expected_success, 'exitCode': result.returncode,
                                    'command': command, 'output': str(log.relative_to(ROOT)), 'sha256': sha(log.read_bytes()),
                                    'claim': 'Candidate checksums are deliberately updated before verification; rejection must come from content/structure policy.'})

        verify('scoped-description-only', candidate, catalogue_file, update, scope, True)

        def mutate_zip(name, mutation):
            target = directory / f'{name}.xlsx'
            with zipfile.ZipFile(candidate) as before, zipfile.ZipFile(target, 'w') as after:
                for info in before.infolist():
                    data = before.read(info.filename)
                    replacement = mutation(info.filename, data)
                    after.writestr(info, replacement)
            return target

        def styles_mutation(name, data):
            if name != 'xl/styles.xml':
                return data
            tree = ET.fromstring(data)
            fonts = tree.find(q('fonts'))
            assert fonts is not None and len(fonts) > 0
            node = fonts[0].find(q('sz'))
            assert node is not None
            node.set('val', str(float(node.get('val')) + 1))
            return ET.tostring(tree, encoding='utf-8', xml_declaration=True)

        verify('reject-unrelated-font-change', mutate_zip('font', styles_mutation), catalogue_file, update, scope, False)

        def formula_mutation(name, data):
            if not name.startswith('xl/worksheets/') or not name.endswith('.xml'):
                return data
            tree = ET.fromstring(data)
            cell = tree.find(f".//{q('c')}[@r='D37']")
            formula = None if cell is None else cell.find(q('f'))
            if formula is None:
                return data
            formula.text = 'SUM(D10:D34)'
            return ET.tostring(tree, encoding='utf-8', xml_declaration=True)

        verify('reject-unrelated-formula-change', mutate_zip('formula', formula_mutation), catalogue_file, update, scope, False)
        changed_acceptance = copy.deepcopy(catalogue)
        selected = next(e for e in changed_acceptance['entries'] if e['id'] == identifier)
        selected['acceptance'] += ' Unauthorized extra criterion.'
        changed_catalogue = directory / 'changed-criterion.json'
        dump(changed_catalogue, changed_acceptance)
        changed_scope = copy.deepcopy(scope)
        changed_scope['allowedFieldsById'][identifier].append('acceptance')
        verify('reject-existing-criterion-change', candidate, changed_catalogue, update, changed_scope, False)
        assert {name: sha((ROOT / name).read_bytes()) for name in public_files} == before_public
        report['publicTrackingByteIdentical'] = True
        report['sourceHashes'] = {filename: sha((ROOT / filename).read_bytes()) for filename in ['scripts/priority-pipeline-selfcheck.py',
            'scripts/priority-patch-workbook.py', 'scripts/priority-verify-workbook.py', 'scripts/verify-eden-immersion-workbook.py']}
        report['passed'] = True
    except Exception as error:
        report['failure'] = repr(error)
        raise
    finally:
        dump(output, report)
    print(json.dumps({'passed': True, 'cases': len(report['cases']), 'publicTrackingByteIdentical': True, 'output': str(output.relative_to(ROOT))}))


if __name__ == '__main__':
    main()
