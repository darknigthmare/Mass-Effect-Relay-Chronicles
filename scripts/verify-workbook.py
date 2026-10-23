#!/usr/bin/env python3
"""Read-only stdlib XLSX verification; --write-report writes the single named report."""
import argparse, collections, datetime, hashlib, io, json, pathlib, posixpath, re, subprocess, sys, xml.etree.ElementTree as E, zipfile

M="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
R="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
P="http://schemas.openxmlformats.org/package/2006/relationships"
NS={"m":M,"p":P}
ERROR=re.compile(r"#(?:REF!|DIV/0!|VALUE!|NAME\?|N/A\b|NUM!|NULL!|SPILL!|CALC!)")
def digest(data): return hashlib.sha256(data).hexdigest()
def column(n):
    result=""
    while n: n,d=divmod(n-1,26); result=chr(65+d)+result
    return result
def xtext(value): return re.sub(r"_x([0-9A-Fa-f]{4})_",lambda m:chr(int(m[1],16)),value)
def flatten(value):
    if value is None:return ""
    if isinstance(value,list):return ", ".join(str(item) for item in value)
    if isinstance(value,bool):return str(value).lower()
    return str(value)
def rels(archive,owner):
    name=posixpath.join(posixpath.dirname(owner),"_rels",posixpath.basename(owner)+".rels")
    if name not in archive.namelist():return {}
    return {el.attrib["Id"]:posixpath.normpath(el.attrib["Target"].lstrip("/") if el.attrib["Target"].startswith("/") else posixpath.join(posixpath.dirname(owner),el.attrib["Target"]))
            for el in E.fromstring(archive.read(name)).findall("p:Relationship",NS) if el.attrib.get("TargetMode")!="External"}
def read_cells(xml,shared):
    result={}
    for el in xml.findall("m:sheetData/m:row/m:c",NS):
        kind=el.attrib.get("t");raw=el.findtext("m:v",default="",namespaces=NS)
        value=shared[int(raw)] if kind=="s" and raw else xtext(raw)
        if kind=="inlineStr":value=xtext("".join(t.text or "" for t in el.findall(".//m:t",NS)))
        result[el.attrib["r"]]={"value":value,"kind":kind,"formula":el.findtext("m:f",default="",namespaces=NS)}
    return result
def verify(root, expected_rows=None, expected_sources=None, baseline_ref="f6b2390"):
    report={"passed":False,"at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"verifier":"scripts/verify-workbook.py (stdlib zip/xml)","errors":[]}
    checks={};error_count=0
    def check(ok,message,group="structure"):
        nonlocal error_count
        checks[group]=checks.get(group,True) and bool(ok)
        if not ok:
            error_count+=1
            if len(report["errors"])<100:report["errors"].append(message)
    cp=root/"docs/content-catalog.json";wp=root/"docs/Mass_Effect_Relay_Chronicles_Production.xlsx";bp=root/"scripts/build-workbook.mjs"
    snapshots={p:p.read_bytes() for p in (cp,wp,bp)}
    cat=json.loads(snapshots[cp]);builder=snapshots[bp].decode("utf8")
    block=re.search(r"const fields\s*=\s*\[(.*?)\n\];",builder,re.S)
    if not block:raise ValueError("Builder fields array not found.")
    fields=re.findall(r"\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*\]",block[1])
    entries=cat["entries"];categories=cat["categories"];sources=cat["sources"];status=collections.Counter(e["status"] for e in entries)
    if expected_rows is None:expected_rows=len(entries)
    if expected_sources is None:expected_sources=len(sources)
    check(len(fields)==17,f"Builder fields: {len(fields)} != 17")
    check(len(entries)==expected_rows,f"Catalogue rows: {len(entries)} != {expected_rows}")
    check(len(categories)==26,f"Categories: {len(categories)} != 26")
    check(len(sources)==expected_sources,f"Sources: {len(sources)} != {expected_sources}","guideSources")
    ids=[e["id"] for e in entries];idset=set(ids);sourceids={s["id"] for s in sources};catids={c["id"] for c in categories}
    unique=len(ids)==len(idset) and all(isinstance(i,str) and i for i in ids)
    check(unique,"Empty or duplicate catalogue identifiers.","ids")
    check(len(sourceids)==len(sources),"Duplicate source identifiers.","guideSources")
    baseline_sha=subprocess.check_output(["git","rev-parse","--verify",baseline_ref+"^{commit}"],cwd=root,text=True).strip()
    baseline=json.loads(subprocess.check_output(["git","show",baseline_sha+":docs/content-catalog.json"],cwd=root))
    previous={e["id"]:e for e in baseline["entries"]};current={e["id"]:e for e in entries}
    check(len(previous)>0,"Baseline catalogue is empty","baselineIds")
    missing=sorted(set(previous)-idset);new_ids=sorted(idset-set(previous))
    check(not missing,f"Remote catalogue IDs missing: {missing[:20]}","baselineIds")
    prior_future={key:e for key,e in previous.items() if e["scope"]=="Extension future"}
    current_future={key:e for key,e in current.items() if e["scope"]=="Extension future"}
    check(len(prior_future)==57 and current_future==prior_future,"The 57 future-extension rows must remain unchanged","futurePreserved")
    prior_advanced={key:e["status"] for key,e in previous.items() if e["status"] in ("Intégré","Validé")}
    current_advanced={key:e["status"] for key,e in current.items() if e["status"] in ("Intégré","Validé")}
    check(len(prior_advanced)==6 and current_advanced==prior_advanced,"The six advanced statuses from the remote catalogue must remain unchanged","advancedPreserved")
    report.update({"expectedRows":expected_rows,"expectedSources":expected_sources,"baselineRef":baseline_ref,"baselineCommit":baseline_sha,"baselineCatalogueRows":len(previous),"baselineIdsPreserved":not missing,"missingBaselineIds":missing,"newCatalogueIds":new_ids,"futureRows":len(current_future),"futureCatalogueRowsUnchanged":current_future==prior_future,"advancedStatusesPreserved":current_advanced==prior_advanced,"advancedStatusRows":current_advanced})
    proof_count=0;implemented=0;proof_paths=set();dependency_links=0
    for e in entries:
        check(e["category"] in catids,f'{e["id"]}: unknown category',"ids")
        check(e["sourceId"] in sourceids,f'{e["id"]}: unknown source',"ids")
        check(isinstance(e["dependencies"],list),f'{e["id"]}: invalid dependencies',"dependencies")
        dependency_links+=len(e["dependencies"])
        for dep in e["dependencies"]:check(dep in idset,f'{e["id"]}: unresolved dependency {dep}',"dependencies")
        for field,allowed in (("status",cat["meta"]["statusDefinitions"]),("assetStatus",cat["meta"]["assetStatusValues"]),("canonLevel",cat["meta"]["canonDefinitions"])):
            check(e[field] in allowed,f'{e["id"]}: invalid {field}',"cells")
        if e["status"] in ("Intégré","Validé"):
            implemented+=1;check(bool(e.get("assetPath")),f'{e["id"]}: implemented without proof path',"paths")
        if e.get("assetPath"):
            proof_count+=1;proof_paths.add(e["assetPath"]);p=pathlib.Path(e["assetPath"]);resolved=(root/p).resolve()
            check(not p.is_absolute() and resolved.is_relative_to(root),f'{e["id"]}: proof path escapes repository',"paths")
            check(resolved.exists(),f'{e["id"]}: missing proof {e["assetPath"]}',"paths")
    with zipfile.ZipFile(io.BytesIO(snapshots[wp])) as z:
        check(z.testzip() is None,"ZIP integrity failure.")
        shared=[]
        if "xl/sharedStrings.xml" in z.namelist():
            shared=[xtext("".join(t.text or "" for t in si.findall(".//m:t",NS))) for si in E.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si",NS)]
        definitions=E.fromstring(z.read("xl/workbook.xml")).findall("m:sheets/m:sheet",NS)
        expected_names=["Dashboard",*[c["sheetName"] for c in categories],"Guide"]
        check(len(definitions)==28,f"Workbook sheets: {len(definitions)} != 28")
        check([s.attrib["name"] for s in definitions]==expected_names,"Sheet names/order differ from catalogue.")
        wr=rels(z,"xl/workbook.xml");sheets={};details=[];formulas=0
        for s in definitions:
            name=s.attrib["name"];part=wr[s.attrib["{"+R+"}id"]];xml=E.fromstring(z.read(part));cells=read_cells(xml,shared)
            sheets[name]=(xml,cells,part);pane=xml.find("m:sheetViews/m:sheetView/m:pane",NS)
            details.append({"sheet":name,"validations":len(xml.findall("m:dataValidations/m:dataValidation",NS)),"pane":dict(pane.attrib) if pane is not None else None})
            for address,cell in cells.items():
                formulas+=bool(cell["formula"])
                check(cell["kind"]!="e" and not ERROR.search(cell["formula"]),f'{name}!{address}: cached/formula error {cell["value"]!r}',"noCachedFormulaErrors")
        def val(name,address):return sheets[name][1].get(address,{}).get("value","")
        def formula(name,address):return sheets[name][1].get(address,{}).get("formula","").lstrip("=").replace("_xlfn.","")
        def number(name,address):
            try:return float(val(name,address))
            except (ValueError,TypeError):return None
        def freeze(name,expected):
            pane=sheets[name][0].find("m:sheetViews/m:sheetView/m:pane",NS)
            check(pane is not None and all(pane.attrib.get(k)==v for k,v in expected.items()),f"{name}: incorrect frozen pane","freezes")
        freeze("Dashboard",{"ySplit":"9","topLeftCell":"A10","state":"frozen"})
        freeze("Guide",{"ySplit":"6","topLeftCell":"A7","state":"frozen"})
        table_count=0;row_count=0;compared=0;valid_columns={column(i) for i in range(1,len(fields)+1)}
        for idx,c in enumerate(categories):
            name=c["sheetName"];records=[e for e in entries if e["category"]==c["id"]];end=6+len(records)
            xml,cells,part=sheets[name]
            data_rows=sorted(int(a[1:]) for a,v in cells.items() if re.fullmatch(r"A\d+",a) and int(a[1:])>=7 and v["value"]!="")
            row_count+=len(data_rows)
            check(data_rows==list(range(7,end+1)),f"{name}: missing/excess records","cells")
            for i,(key,label,width) in enumerate(fields,1):
                check(val(name,f"{column(i)}6")==label,f"{name}: incorrect header {i}","cells")
                for row,e in enumerate(records,7):
                    address=f"{column(i)}{row}";expected=flatten(e.get(key));actual=val(name,address);compared+=1
                    check(actual==expected,f'{name}!{address} {e["id"]}/{key}: expected {expected[:110]!r}, got {actual[:110]!r}',"cells")
            for address,cell in cells.items():
                match=re.fullmatch(r"([A-Z]+)\d+",address)
                check(not(match and match[1] not in valid_columns and cell["value"]!=""),f"{name}!{address}: data outside 17 columns","cells")
            freeze(name,{"xSplit":"2","ySplit":"6","topLeftCell":"C7","state":"frozen"})
            dvs=xml.findall("m:dataValidations/m:dataValidation",NS);dmap={v.attrib.get("sqref"):v for v in dvs}
            check(len(dvs)==5,f"{name}: expected five data validations","validations")
            options={"C":list(cat["meta"]["statusDefinitions"]),"D":cat["meta"]["assetStatusValues"],"E":["P0","P1","P2"],"F":["ME1","ME2","ME3","TRANSVERSE"],"G":list(cat["meta"]["canonDefinitions"])}
            for letter,items in options.items():
                dv=dmap.get(f"{letter}7:{letter}{end}")
                check(dv is not None and dv.attrib.get("type")=="list" and dv.findtext("m:formula1",default="",namespaces=NS)=='"'+",".join(items)+'"',f"{name}: invalid validation {letter}","validations")
            parts=xml.findall("m:tableParts/m:tablePart",NS);sr=rels(z,part)
            check(len(parts)==1,f"{name}: expected one table","tables")
            for t in parts:
                table=E.fromstring(z.read(sr[t.attrib["{"+R+"}id"]]));expected=f"A6:{column(len(fields))}{end}";af=table.find("m:autoFilter",NS)
                check(table.attrib.get("ref")==expected,f"{name}: invalid table range","tables")
                check(table.attrib.get("name")==f'Catalog_{c["id"]}',f"{name}: invalid table name","tables")
                filtered=af is not None and af.attrib.get("ref")==expected
                check(filtered,f"{name}: absent/incomplete table filter","tables");table_count+=bool(filtered)
                check([tc.attrib.get("name") for tc in table.findall("m:tableColumns/m:tableColumn",NS)]==[f[1] for f in fields],f"{name}: incorrect table columns","tables")
            r=10+idx;sheet_name=name.replace("'","''")
            def rng(letter):return "'"+sheet_name+"'!$"+letter+"$7:$"+letter+"$"+str(end)
            statuses=("Défini","Prototype","Intégré","Validé")
            counts=[len(records),*[sum(e["status"]==s for e in records) for s in statuses]]
            fs=["COUNTA("+rng("A")+")",*['COUNTIFS('+rng("C")+',"'+s+'")' for s in statuses]]
            check(val("Dashboard",f"A{r}")==c["title"],f"Dashboard row {r}: incorrect category","dashboard")
            for i,(expected,f) in enumerate(zip(counts,fs),2):
                address=f"{column(i)}{r}"
                check(number("Dashboard",address)==expected,f"Dashboard!{address}: stale count","dashboard")
                check(formula("Dashboard",address)==f,f"Dashboard!{address}: wrong formula/range","dashboard")
        check(row_count==len(entries),f"Exported records {row_count} != catalogue {len(entries)}","cells")
        all_tables=[n for n in z.namelist() if n.startswith("xl/tables/") and n.endswith(".xml") and "/_rels/" not in n]
        check(table_count==26 and len(all_tables)==26,"Expected exactly 26 filtered tables","tables")
        totals=[len(entries),*[status[s] for s in ("Défini","Prototype","Intégré","Validé")]]
        for i,expected in enumerate(totals,2):
            address=f"{column(i)}37"
            check(number("Dashboard",address)==expected,f"Dashboard!{address}: stale total","dashboard")
            check(formula("Dashboard",address)==f"SUM({column(i)}10:{column(i)}35)",f"Dashboard!{address}: invalid total formula","dashboard")
        for i,header in enumerate(("Source","Titre","Périmètre","URL"),1):check(val("Guide",f"{column(i)}29")==header,f"Guide: incorrect source header {i}","guideSources")
        for row,s in enumerate(sources,30):
            expected=[s["id"],s["title"],s["scope"],s.get("url") or "Conception du projet, sans source externe"]
            for i,v in enumerate(expected,1):check(val("Guide",f"{column(i)}{row}")==v,f"Guide!{column(i)}{row}: source differs","guideSources")
        guide_footer=32+len(sources)
        for row in range(30+len(sources),guide_footer):check(all(val("Guide",f"{column(i)}{row}")=="" for i in range(1,5)),f"Guide row {row}: extra source","guideSources")
        for offset,(label,key) in enumerate((("Périmètre","scope"),("Fidélité","fidelity"),("Version","version"))):
            check(val("Guide",f"A{guide_footer+offset}")==label and val("Guide",f"B{guide_footer+offset}")==cat["meta"][key],f"Guide footer {label}: missing/overlaps sources","guideSources")
        report.update({"sheets":len(definitions),"tablesWithFilters":table_count,"rows":row_count,"columnsPerCategory":len(fields),"catalogueCellsCompared":compared,"guideSources":len(sources),"guideSourceColumns":4,"formulas":formulas,"proofPaths":proof_count,"implementedRowsWithProofs":implemented,"idsUnique":unique,"dependenciesResolved":checks.get("dependencies",True),"proofPathsExist":checks.get("paths",True),"allCatalogueCellsMatch":checks.get("cells",True),"guideSourcesMatch":checks.get("guideSources",True),"dashboardCountsMatch":checks.get("dashboard",True),"noCachedFormulaErrors":checks.get("noCachedFormulaErrors",True),"validationsMatch":checks.get("validations",True),"freezesMatch":checks.get("freezes",True),"statusCounts":dict(status),"dashboardB37F37":{f"{column(i)}37":number("Dashboard",f"{column(i)}37") for i in range(2,7)},"details":details})
    report.update({"uniqueProofPaths":len(proof_paths),"dependencyLinksChecked":dependency_links,"guideSourceCellsCompared":len(sources)*4,"guideFooterRow":32+len(sources)})
    for p,b in snapshots.items():check(p.read_bytes()==b,f"{p.name} changed during verification","snapshot")
    report.update({"xlsxSha256":digest(snapshots[wp]),"catalogueSha256":digest(snapshots[cp]),"builderSha256":digest(snapshots[bp]),"checks":checks,"errorCount":error_count,"errorsTruncated":error_count>len(report["errors"]),"passed":error_count==0})
    return report
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument("--root",type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]);p.add_argument("--write-report",action="store_true");p.add_argument("--expected-rows",type=int,default=None);p.add_argument("--expected-sources",type=int,default=None);p.add_argument("--baseline-ref",default="f6b2390");args=p.parse_args();root=args.root.resolve()
    try:report=verify(root,args.expected_rows,args.expected_sources,args.baseline_ref)
    except Exception as e:report={"passed":False,"at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"verifier":"scripts/verify-workbook.py (stdlib zip/xml)","errorCount":1,"errors":[type(e).__name__+": "+str(e)]}
    if args.write_report:(root/"docs/workbook-previews/native-export-check.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    summary={k:v for k,v in report.items() if k not in ("details","errors")};summary["errors"]=report.get("errors",[])[:12];print(json.dumps(summary,ensure_ascii=False,indent=2))
    return 0 if report["passed"] else 1
if __name__=="__main__":sys.exit(main())
