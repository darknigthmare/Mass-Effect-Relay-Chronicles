#!/usr/bin/env python3
"""Exercise variable/empty sheet sizes and proof/output guards on temporary fixtures."""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sha = lambda raw: hashlib.sha256(raw).hexdigest()


def run(arguments, success=True):
    result = subprocess.run(['python', *map(str, arguments)], cwd=ROOT, capture_output=True, text=True)
    assert (result.returncode == 0) is success, result.stdout + result.stderr
    return result


def main():
    source = json.loads((ROOT / 'docs/qa/expansion-workbook-data.json').read_text())
    baseline = ROOT / 'docs/qa/expansion2-baseline.json'
    frozen = json.loads(baseline.read_text())
    rows = []
    for group, count in [('characters', 3), ('armor', 1), ('weapons', 0), ('fleet', 2), ('enemies', 4)]:
        options = [r for r in source['rows'] if r['group'] == group]
        chosen = options[:count]
        closed = next((r for r in options if not r['executableDeclaration']), None)
        if count and closed:
            chosen[-1] = closed
        rows.extend(chosen)
    checks = []
    with tempfile.TemporaryDirectory(prefix='relay-expansion2-tool-test-') as directory:
        temp = Path(directory)
        fixture = {**source, 'schemaVersion': 2, 'baselinePath': 'docs/qa/expansion2-baseline.json',
                   'baselineSha256': sha(baseline.read_bytes()), 'rows': rows,
                   'historicalDigests': frozen['digests']}
        data_path = temp / 'fixture-data.json'
        data_path.write_text(json.dumps(fixture, ensure_ascii=False))
        workbook, build = temp / 'variable.xlsx', temp / 'build.json'
        common = ['scripts/build-expansion2-workbook.py', '--data', data_path,
                  '--output', workbook, '--report', build]
        run([*common, '--draft'])
        audit = run(['scripts/verify-expansion2-workbook.py', '--workbook', workbook, '--build-report', build])
        result = json.loads(audit.stdout)
        assert result['rows'] == 10 and result['cellsCompared'] == 210
        assert [s['rows'] for s in result['sheets']] == [3, 1, 0, 2, 4]
        assert result['sheets'][2]['filters'] == result['sheets'][2]['validations'] == 0
        checks.append('Variable sizes 3/1/0/2/4, exact210 values, empty-sheet structure and dynamic formula ranges pass.')
        before = sha((ROOT / 'docs/Expansion_Simulations_200.xlsx').read_bytes())
        run(['scripts/build-expansion2-workbook.py', '--data', data_path, '--draft',
             '--output', ROOT / 'docs/Expansion_Simulations_200.xlsx'], success=False)
        assert sha((ROOT / 'docs/Expansion_Simulations_200.xlsx').read_bytes()) == before
        checks.append('Writing the historical Lot1 workbook is refused without changing its bytes.')
        snapshots = {r['modulePath']: r['moduleSha256'] for r in rows}
        executable = sum(r['executableDeclaration'] for r in rows)
        native = {'passed': True, 'fixtureOnly': True, 'nativeTrials': executable,
                  'replayedTrials': executable, 'consultationOnly': len(rows) - executable,
                  'previouslyDefinedWithNewStudy': sum(r['catalogueStatus'] == 'Défini' and r['executableDeclaration'] for r in rows),
                  'sourceHashes': snapshots,
                  'cards': [{'id': r['recordId'], 'executable': r['executableDeclaration'],
                             'result': {'fixtureOnly': True} if r['executableDeclaration'] else None} for r in rows]}
        native_path, visual_path = temp / 'native-fixture.json', temp / 'visual-fixture.json'
        native_path.write_text(json.dumps(native))
        visual_path.write_text(json.dumps({'passed': True, 'fixtureOnly': True, 'sources': snapshots}))
        proof_args = ['--proof', visual_path, '--proof-sha', sha(visual_path.read_bytes()),
                      '--native-proof', native_path, '--native-proof-sha', sha(native_path.read_bytes())]
        run([*common, *proof_args])
        audit = json.loads(run(['scripts/verify-expansion2-workbook.py', '--workbook', workbook,
                               '--build-report', build]).stdout)
        assert audit['deliveryStatusCounts']['Prototype'] == executable
        checks.append('Frozen temporary proof fixtures bind every tested record, source hashes and variable open/closed counts.')
        native_path.write_text(json.dumps({**native, 'nativeTrials': executable + 1}))
        changed_args = ['--proof', visual_path, '--proof-sha', sha(visual_path.read_bytes()),
                        '--native-proof', native_path, '--native-proof-sha', sha(native_path.read_bytes())]
        run([*common, *changed_args], success=False)
        checks.append('A positive report with mismatched replay counts is refused.')
        run([*common, *proof_args], success=False)
        checks.append('An obsolete frozen proof SHA is refused.')
    assert all(sha((ROOT / p).read_bytes()) == digest for p, digest in frozen['digests'].items())
    result = {'passed': True, 'scope': 'Workbook tooling only; temporary fixtures are not application or original-mechanics evidence.',
              'checks': checks, 'historicalFilesUnchanged': len(frozen['digests'])}
    target = ROOT / 'docs/qa/expansion2-workbook-tool-tests.json'
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
