#!/usr/bin/env python3
"""Verify archived Armax files without changing pixels or requiring the game runtime."""
from pathlib import Path
import argparse, hashlib, json, struct, zipfile

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for data in iter(lambda:f.read(1024*1024),b''):h.update(data)
    return h.hexdigest()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--report',type=Path)
    args=parser.parse_args()
    index=json.loads((ROOT/'production-index.json').read_text())
    results=[]
    for lot in index['lots']:
        manifest_path=ROOT/lot['manifest']
        manifest=json.loads(manifest_path.read_text())
        ids=set()
        for asset in manifest['assets']:
            assert asset['id'] not in ids,asset['id']
            ids.add(asset['id'])
            path=manifest_path.parent/asset['path']
            assert path.is_file(),path
            assert digest(path)==asset['technical']['sha256'],path
            with path.open('rb') as f:header=f.read(33)
            assert header[:8]==b'\x89PNG\r\n\x1a\n',path
            width,height=struct.unpack('>II',header[16:24])
            assert [width,height]==asset['technical']['dimensions'],path
            assert (manifest_path.parent/asset['qa_path']).is_file(),asset['qa_path']
            assert asset['fidelity_1_to_1_validated'] is False
            assert asset['engine_integrated'] is False
        archive=ROOT/lot['archive'] if lot.get('archive') else None
        if archive:
            with zipfile.ZipFile(archive) as z:
                assert z.testzip() is None,archive
                for asset in manifest['assets']:
                    matching=[n for n in z.namelist() if n.endswith('/'+asset['path']) or n==asset['path']]
                    assert len(matching)==1,asset['path']
                    assert hashlib.sha256(z.read(matching[0])).hexdigest()==asset['technical']['sha256']
        results.append({'lot':lot['id'],'selected_pngs':len(ids),'sha256_dimensions_qa':'passed','archive_crc':'passed' if archive else 'not_applicable'})
    inventory=json.loads((ROOT/'local-import-inventory.json').read_text())
    imported=0
    for record in inventory['records']:
        if record.get('repository_path'):
            path=REPO/record['repository_path']
            assert path.is_file(),path
            assert digest(path)==record['sha256'],record['repository_path']
            imported+=1
    report={'status':'passed','lots':results,'mapped_local_files_verified':imported,
            'browser_test':False,'engine_test':False,'fidelity_validation':False}
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
