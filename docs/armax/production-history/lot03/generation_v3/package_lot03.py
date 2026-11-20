from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
from collections import Counter
import hashlib, json, re, subprocess, zipfile

BASE=Path('/workspace/scratch/c3ca3f19d191')
OUT=BASE/'outputs/mass-effect/lot03'
WORK=BASE/'work/generation_v3'
m=json.loads((OUT/'asset-manifest.json').read_text())
assets=m['assets']
assert len({a['id'] for a in assets})==len(assets)==26
assert Counter(a['kind'] for a in assets)==Counter({'fighter':16,'keypose':4,'stage':6})
assert m['counts']['generation_calls']==36
assert m['counts']['images_created']==29
assert m['counts']['generation_failures']==7
assert m['counts']['images_created_not_selected']==3

class Parser(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.images=[];self.scripts=[];self.current=None;self.cards=0
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='a' and attrs.get('href'):self.links.append(attrs['href'])
        if tag=='img' and attrs.get('src'):self.images.append(attrs['src'])
        if tag=='article' and 'card' in attrs.get('class','').split():self.cards+=1
        if tag=='script':self.current={'type':attrs.get('type','javascript'),'id':attrs.get('id'),'body':''}
    def handle_data(self,data):
        if self.current is not None:self.current['body']+=data
    def handle_endtag(self,tag):
        if tag=='script' and self.current is not None:self.scripts.append(self.current);self.current=None

p=Parser();p.feed((OUT/'Catalogue_Lot03.html').read_text())
assert p.cards==26
assert set(p.images)=={a['path'] for a in assets}
for href in p.links:
    if not re.match(r'https?://|#',href):assert (OUT/href).is_file(),href
data=next(x['body'] for x in p.scripts if x['type']=='application/json')
assert json.loads(data)==assets
js='\n'.join(x['body'] for x in p.scripts if x['type']=='javascript')
js_path=WORK/'catalogue-check.js';js_path.write_text(js)
syntax=subprocess.run(['node','--check',str(js_path)],capture_output=True,text=True)
assert syntax.returncode==0,syntax.stderr

for a in assets:
    path=OUT/a['path'];assert path.is_file()
    assert hashlib.sha256(path.read_bytes()).hexdigest()==a['technical']['sha256']
    with Image.open(path) as im:
        im.load();assert list(im.size)==a['technical']['dimensions']
        if a['kind']=='stage':assert im.mode=='RGB'
        else:
            assert im.mode=='RGBA' and im.size==(1024,1536)
            assert im.getchannel('A').getextrema()==(0,254)
    assert (OUT/a['qa_path']).is_file()
    assert a['fidelity_1_to_1_validated'] is False and a['engine_integrated'] is False

selected_paths={a['path'] for a in assets}
assert 'assets/fighters/javik/javik_ready_right_R1.png' in selected_paths
assert 'assets/fighters/nakmor_drack_mea/nakmor_drack_mea_r1.png' in selected_paths
assert 'assets/keyposes/shepard_female_n7/shepard_female_low_guard_r1.png' in selected_paths
assert not any(x.endswith('javik_ready_right_R0.png') or x.endswith('shepard_female_low_guard_r0.png') or x.endswith('nakmor_drack_mea_ready_right_r0.png') for x in selected_paths)

report={'date':'2026-11-19','status':'passed','selected_images':26,'png_decode':'passed',
        'dimensions_modes_alpha':'passed','sha256_manifest_match':'passed','original_output_equality':'checked_during_manifest_build',
        'catalogue_cards':p.cards,'catalogue_image_links':'passed','catalogue_embedded_data':'passed','javascript_syntax':'passed',
        'selected_revisions':'Javik R1, Drack R1, garde basse Shepard R1','browser_visual_review':False,
        'engine_tests':False,'animation_validation':False,'fidelity_1_to_1_validation':False}
(OUT/'qa/package-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')

files=set(selected_paths)|{a['qa_path'] for a in assets}
files|={'README.md','Bible_Complement_Lot03.md','asset-manifest.json','Catalogue_Lot03.html',
        'qa/README.md','qa/package-verification.json','qa/independent-review-root.json',
        'qa/independent-review-measurements.json','qa/independent-revision-review.json',
        'qa/independent-revision-measurements.json'}
files|={str(p.relative_to(OUT)) for p in (OUT/'provenance').glob('*.json')}
for name in files:assert (OUT/name).is_file(),name
zip_path=OUT/'Mass_Effect_Armax_Lot03_v3.0.0.zip'
prefix='Mass_Effect_Armax_Lot03/'
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for name in sorted(files):z.write(OUT/name,prefix+name)
with zipfile.ZipFile(zip_path) as z:
    assert z.testzip() is None
    assert len(z.infolist())==len(files)
    assert sum(x.filename.endswith('.png') for x in z.infolist())==26
    for a in assets:assert hashlib.sha256(z.read(prefix+a['path'])).hexdigest()==a['technical']['sha256']
result={'file':str(zip_path),'bytes':zip_path.stat().st_size,'MiB':round(zip_path.stat().st_size/1048576,3),
        'sha256':hashlib.sha256(zip_path.read_bytes()).hexdigest(),'members':len(files),'pngs':26,
        'zip_crc':'passed','zipped_sha256_match':'passed','verification':report}
(WORK/'package-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
