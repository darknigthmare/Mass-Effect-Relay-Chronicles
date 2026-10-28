#!/usr/bin/env python3
"""Author only the dedicated200overlay workbook; historical catalogues stay read-only."""
import argparse
import hashlib
import json
import math
import subprocess
from collections import Counter
from pathlib import Path
import xlsxwriter

GROUPS={'characters':'Personnages','armor':'Armures','weapons':'Armes','fleet':'Vehicules_vaisseaux','enemies':'Ennemis'}
FIELDS=[('deliveryId','Identifiant SIM',36),('recordId','Référence catalogue',31),('name','Élément',36),('catalogId','Œuvre',10),('periods','Périodes explicites',28),('originalNature','Nature originale',23),('catalogueStatus','Statut catalogue conservé',17),('deliveryStatus','État du livrable SIM',17),('function','Fonction disponible',28),('edition','Édition requise',16),('description','Fait documentaire',57),('conditions','Conditions originales',58),('role','Rôle / mode',28),('simulation','Réglages ATB proposés',58),('limits','Limites et fermeture',90),('notes','Notes du prototype',80),('sourceIds','Sources déclarées',28),('sourceUrls','URL des sources',90),('implementation','Implémentation du nouvel overlay',45),('proof','Preuve de fonctionnement',65),('reference','Repère original',50)]
sha=lambda raw:hashlib.sha256(raw).hexdigest()

def matrix_row(row, verified, proof_label):
    overlay=row['overlay'];eligible=row['executableDeclaration']
    values={**row,'periods':' ; '.join(f"{v['mediaId']}/{p}" for v in row['continuity']['availability'] for p in v['periodIds']),
      'deliveryStatus':'Prototype' if verified and eligible else 'Défini',
      'function':('Simulation sous conditions' if verified else 'Simulation à valider') if eligible else 'Consultation',
      'edition':(overlay.get('constraints') or {}).get('editionProfile') or 'Sans profil supplémentaire',
      'role':f"{overlay.get('role','')} / {overlay.get('mode','')}",
      'simulation':json.dumps(overlay.get('simulation'),ensure_ascii=False,sort_keys=True) if eligible else 'Aucune simulation autorisée.',
      'limits':'\n'.join(([row['blockedReason']] if row['blockedReason'] else [])+overlay.get('limitations',[])),
      'notes':'\n'.join(overlay.get('notes',[])),
      'sourceIds':', '.join(row['sourceIds']),'sourceUrls':'\n'.join(s.get('url','') for s in row['sources']),
      'implementation':row['modulePath'],'proof':proof_label if verified and eligible else 'QA fonctionnelle non accordée à cette fiche.'}
    return [values.get(key) or '' for key,_,_ in FIELDS]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);parser.add_argument('--data',type=Path)
    parser.add_argument('--output',type=Path);parser.add_argument('--draft',action='store_true')
    parser.add_argument('--proof',type=Path);parser.add_argument('--proof-sha');parser.add_argument('--report',type=Path)
    parser.add_argument('--native-proof',type=Path);parser.add_argument('--native-proof-sha')
    args=parser.parse_args();root=args.root.resolve();data_path=args.data or root/'docs/qa/expansion-workbook-data.json'
    data=json.loads(data_path.read_text());rows=data['rows'];assert len(rows)==200 and len({r['recordId'] for r in rows})==200
    assert all(sum(r['group']==g for r in rows)==40 for g in GROUPS)
    for rel,digest in data['historicalDigests'].items():assert sha((root/rel).read_bytes())==digest,f'Historical file changed: {rel}'
    for row in rows:assert sha((root/row['modulePath']).read_bytes())==row['moduleSha256'],row['modulePath']
    verified=not args.draft;proof_label='Brouillon — aucune preuve fonctionnelle.';proof_info=None
    if verified:
        if not all([args.proof,args.proof_sha,args.native_proof,args.native_proof_sha]):parser.error('Final export requires frozen --proof/--proof-sha and --native-proof/--native-proof-sha; use --draft for layout only.')
        raw=args.proof.read_bytes();proof=json.loads(raw);assert sha(raw)==args.proof_sha and proof.get('passed') is True
        snapshots=proof.get('sources') or proof.get('sourceSnapshots') or proof.get('sourceHashes') or {}
        if isinstance(snapshots,list):snapshots={p['path']:p['sha256'] for p in snapshots}
        for rel,digest in snapshots.items():assert sha((root/rel).read_bytes())==digest,rel
        native_raw=args.native_proof.read_bytes();native=json.loads(native_raw)
        assert sha(native_raw)==args.native_proof_sha and native.get('passed') is True
        assert native['nativeTrials']==145 and native['replayedTrials']==145 and native['consultationOnly']==55
        assert native['previouslyDefinedWithNewStudy']==sum(r['catalogueStatus']=='Défini' and r['executableDeclaration'] for r in rows)==103
        for rel,digest in native['sourceHashes'].items():assert sha((root/rel).read_bytes())==digest,rel
        combined={**snapshots,**native['sourceHashes']}
        for row in rows:assert combined.get(row['modulePath'])==row['moduleSha256'],f'Frozen native/visual proofs must bind {row["modulePath"]}'
        display=lambda p:str(p.relative_to(root)) if p.is_absolute() and p.is_relative_to(root) else str(p)
        proof_label=f'{display(args.proof)} ; SHA256 {args.proof_sha}\n{display(args.native_proof)} ; SHA256 {args.native_proof_sha}'
        proof_info={'path':display(args.proof),'sha256':args.proof_sha,'resultPointer':'/passed','native':{'path':display(args.native_proof),'sha256':args.native_proof_sha,'replayedTrials':145},'scope':'Common independent simulation engine and declared modules; original mechanics/fidelity remain uncertified.'}
    output=args.output or root/'docs/Expansion_Simulations_200.xlsx';output.parent.mkdir(parents=True,exist_ok=True)
    workbook=xlsxwriter.Workbook(output,{'strings_to_urls':False,'strings_to_formulas':False})
    workbook.set_properties({'title':'Expansion — 200 overlays de simulation','subject':'Références existantes, simulations indépendantes et consultations bornées','comments':'200 livrables SIM ne sont pas200nouveaux faits. Aucun catalogue historique modifié.'})
    workbook.set_calc_mode('auto')
    base={'font_name':'Arial','font_size':10,'valign':'top','text_wrap':True,'font_color':'#183044','border':1,'border_color':'#D5E2E8'}
    formats={key:workbook.add_format({**base,**extra}) for key,extra in {
      'cell':{},'alt':{'bg_color':'#F3F8FA'},'heading':{'bold':True,'bg_color':'#102438','font_color':'white','valign':'vcenter'},
      'title':{'bold':True,'font_size':16,'border':0,'font_color':'#102438'},'note':{'border':0,'font_color':'#4A6374'},
      'count':{'border':0,'bold':True,'font_size':12},'prototype':{'bg_color':'#FFF1D0','font_color':'#865000'},
      'closed':{'bg_color':'#EEF1F4','font_color':'#566775'},'active':{'bg_color':'#DDF1E8','font_color':'#176A4D'},
    }.items()}
    sheets=[]
    for group,name in GROUPS.items():
        selected=[r for r in rows if r['group']==group];matrix=[matrix_row(r,verified,proof_label) for r in selected]
        sheet=workbook.add_worksheet(name);sheet.hide_gridlines(2);sheet.freeze_panes(6,3);sheet.set_zoom(80)
        for index,(_,_,width) in enumerate(FIELDS):sheet.set_column(index,index,width)
        sheet.merge_range('A1:J1',f'{name} — 40 fiches SIM'+(' — BROUILLON' if args.draft else ''),formats['title']);sheet.set_row(0,30)
        sheet.merge_range('A2:J2','200 overlays liés à des références existantes. Le statut et la nature du catalogue sont conservés ; les chiffres ATB restent des réglages d’adaptation.',formats['note']);sheet.set_row(1,30)
        sheet.merge_range('A3:J3','Contexte et édition obligatoires. Consultation ≠ simulation. Aucun ajout aux campagnes, inventaires historiques, animations ou modèles originaux.',formats['note']);sheet.set_row(2,30)
        proto=sum(verified and r['executableDeclaration'] for r in selected);closed=sum(not r['executableDeclaration'] for r in selected)
        sheet.write('A4','Fiches',formats['count']);sheet.write_formula('B4','=COUNTA(A7:A46)',formats['count'],40)
        sheet.write('C4','Prototype SIM',formats['count']);sheet.write_formula('D4','=COUNTIF(H7:H46,"Prototype")',formats['count'],proto)
        sheet.write('E4','Consultations',formats['count']);sheet.write_formula('F4','=COUNTIF(I7:I46,"Consultation")',formats['count'],closed)
        sheet.set_row(3,23);sheet.set_row(5,44)
        table_name='SIM_'+group.upper();sheet.add_table(5,0,45,len(FIELDS)-1,{'name':table_name,'columns':[{'header':label,'header_format':formats['heading']} for _,label,_ in FIELDS],'style':'Table Style Medium 2'})
        for index,values in enumerate(matrix,6):
            fmt=formats['alt'] if index%2 else formats['cell']
            for col,value in enumerate(values):
                if value=='':sheet.write_blank(index,col,None,fmt)
                else:sheet.write_string(index,col,str(value),fmt)
            height=max(sum(max(1,math.ceil(len(line)/max(8,width*.9))) for line in str(v).split('\n')) for v,(_,_,width) in zip(values,FIELDS))
            row_height=max(48,height*14+12)
            if row_height>409:raise ValueError(f'Cell text exceeds the native Excel row-height limit: {name}!{index+1}')
            sheet.set_row(index,row_height)
        sheet.data_validation('G7:G46',{'validate':'list','source':['Défini','Prototype','Intégré','Validé']})
        sheet.data_validation('H7:H46',{'validate':'list','source':['Défini','Prototype']})
        sheet.conditional_format('H7:H46',{'type':'cell','criteria':'==','value':'"Prototype"','format':formats['prototype']})
        sheet.conditional_format('I7:I46',{'type':'text','criteria':'containing','value':'Consultation','format':formats['closed']})
        sheet.conditional_format('I7:I46',{'type':'text','criteria':'containing','value':'Simulation sous','format':formats['active']})
        sheet.set_landscape();sheet.fit_to_pages(1,0);sheet.repeat_rows(0,5);sheet.print_area(0,0,45,len(FIELDS)-1)
        sheets.append({'group':group,'name':name,'rows':40,'columns':len(FIELDS),'prototypeDeliveries':proto,'consultations':closed,'matrix':matrix})
    workbook.close()
    assert all(sha((root/p).read_bytes())==digest for p,digest in data['historicalDigests'].items())
    portable=lambda p:str(p.relative_to(root)) if p.is_absolute() and p.is_relative_to(root) else str(p)
    report={'schemaVersion':1,'draft':args.draft,'output':portable(output),'xlsxSha256':sha(output.read_bytes()),'dataPath':portable(data_path),'dataSha256':sha(data_path.read_bytes()),'proof':proof_info,
      'overlays':200,'newCanonicalFacts':0,'historicalFilesUnchanged':True,'sheets':sheets,'fields':FIELDS,'scope':'Dedicated independent simulation/inspection delivery; all historical catalogue statuses and exports retained.'}
    if args.report:args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ['sheets','fields']},ensure_ascii=False))

if __name__=='__main__':main()
