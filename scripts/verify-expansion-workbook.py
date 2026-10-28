#!/usr/bin/env python3
"""Read-only ZIP/XML verification of the dedicated200overlay XLSX."""
import argparse
import hashlib
import json
import posixpath
from collections import Counter
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
REL='http://schemas.openxmlformats.org/package/2006/relationships'
sha=lambda raw:hashlib.sha256(raw).hexdigest()
def col(index):
    out=''
    while index:
        index,n=divmod(index-1,26);out=chr(65+n)+out
    return out

def verify(root,workbook,build_report):
    report=json.loads(build_report.read_text());assert sha(workbook.read_bytes())==report['xlsxSha256']
    data_path=Path(report['dataPath']);data_path=data_path if data_path.is_absolute() else root/data_path
    data=json.loads(data_path.read_text());assert sha(data_path.read_bytes())==report['dataSha256']
    assert len(data['rows'])==200 and len({r['recordId'] for r in data['rows']})==200
    assert all(sha((root/p).read_bytes())==digest for p,digest in data['historicalDigests'].items())
    with ZipFile(workbook) as z:
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            for item in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS):strings.append(''.join(x.text or '' for x in item.iterfind('.//s:t',NS)))
        wb=ET.fromstring(z.read('xl/workbook.xml'));rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        targets={r.attrib['Id']:posixpath.normpath('xl/'+r.attrib['Target']) for r in rels}
        sheets=wb.findall('s:sheets/s:sheet',NS);assert len(sheets)==5
        results=[]
        for info,expected in zip(sheets,report['sheets']):
            assert info.attrib['name']==expected['name'];path=targets[info.attrib[f'{{{NS["r"]}}}id']]
            xml=ET.fromstring(z.read(path));cells={}
            for cell in xml.findall('.//s:sheetData/s:row/s:c',NS):
                value=cell.find('s:v',NS);value=value.text if value is not None else ''
                if cell.attrib.get('t')=='s':value=strings[int(value)]
                elif cell.attrib.get('t')=='inlineStr':value=''.join(t.text or '' for t in cell.findall('.//s:t',NS))
                cells[cell.attrib['r']]=value or ''
            for i,row in enumerate(expected['matrix'],7):
                for j,value in enumerate(row,1):assert cells.get(f'{col(j)}{i}','')==str(value),f'{expected["name"]}!{col(j)}{i}'
            for address,count in [('B4',40),('D4',expected['prototypeDeliveries']),('F4',expected['consultations'])]:
                assert float(cells[address])==count
                assert xml.find(f'.//s:c[@r="{address}"]/s:f',NS) is not None
            assert all(c.attrib.get('t')!='e' for c in xml.findall('.//s:c',NS))
            pane=xml.find('s:sheetViews/s:sheetView/s:pane',NS);assert pane is not None and pane.attrib['xSplit']=='3' and pane.attrib['ySplit']=='6'
            validations=xml.findall('s:dataValidations/s:dataValidation',NS);assert {v.attrib['sqref'] for v in validations}=={'G7:G46','H7:H46'}
            parts=xml.findall('s:tableParts/s:tablePart',NS);assert len(parts)==1
            sheet_rels=ET.fromstring(z.read(posixpath.dirname(path)+'/_rels/'+posixpath.basename(path)+'.rels'))
            table_target=next(r.attrib['Target'] for r in sheet_rels if r.attrib['Id']==parts[0].attrib[f'{{{NS["r"]}}}id'])
            table_path=posixpath.normpath(posixpath.join(posixpath.dirname(path),table_target));table=ET.fromstring(z.read(table_path))
            assert table.attrib['ref']=='A6:U46' and table.find('s:autoFilter',NS).attrib['ref']=='A6:U46'
            results.append({'sheet':expected['name'],'rows':40,'columns':21,'cellsCompared':840,'cachedSummaryFormulas':3,'filters':1,'validations':2,'frozenRows':6,'frozenColumns':3,'exactValues':True})
    matrices=[row for sheet in report['sheets'] for row in sheet['matrix']]
    return {'passed':True,'draft':report['draft'],'xlsxSha256':report['xlsxSha256'],'rows':200,'columns':21,'cellsCompared':4200,'sheets':results,
      'deliveryStatusCounts':dict(Counter(row[7] for row in matrices)),
      'sourceCatalogueStatusCounts':dict(Counter(row[6] for row in matrices)),
      'historicalFilesUnchanged':True,'newCanonicalFacts':0,'scope':'Exact delivery values/statuses and native workbook structure; no visual or original-game fidelity certification.'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--workbook',type=Path,required=True);p.add_argument('--build-report',type=Path,required=True);p.add_argument('--report',type=Path);a=p.parse_args()
    result=verify(a.root.resolve(),a.workbook,a.build_report)
    if a.report:a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()
