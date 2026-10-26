"""Read-only XLSX package checks; standard library, no workbook authoring."""
import argparse
import datetime
import hashlib
import importlib.util
import json
import posixpath
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main", "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
FIELDS = ["id", "name", "status", "assetStatus", "priority", "episode", "canonLevel", "description", "acceptance", "dependencies", "plannedPath", "assetPath", "gameKey", "reference", "sourceUrl", "scope", "notes"]

def git_catalog(root, ref):
    commit = subprocess.check_output(["git", "rev-parse", "--verify", ref+"^{commit}"], cwd=root, text=True).strip()
    return commit, json.loads(subprocess.check_output(["git", "show", commit+":docs/content-catalog.json"], cwd=root))

def extends_range(previous, current):
    pattern = r"([A-Z]+)(\d+):([A-Z]+)(\d+)"
    old, new = re.fullmatch(pattern, previous), re.fullmatch(pattern, current)
    return previous == current or bool(old and new and old.group(1, 2, 3) == new.group(1, 2, 3) and int(new[4]) >= int(old[4]))

def verify_merged(root, args, baseline, catalog, old, new):
    """Verify a regenerated main workbook plus the unchanged PR additions.

    The historical append-only mode below intentionally retains its original
    strict package checks. Main's generator replaces full validation/format
    ranges when rows grow, so this mode checks range extension and the complete
    current workbook semantically instead of requiring old XML ranges verbatim.
    """
    main_ref, main = git_catalog(root, args.main_ref)
    pr_ref, pr = git_catalog(root, args.customization_ref)
    assert baseline == main, "--baseline-catalog must be the exact merged main catalogue."
    original = {entry["id"]: entry for entry in main["entries"]}
    custom = {entry["id"]: entry for entry in pr["entries"] if entry["id"].startswith("CUST-")}
    current = {entry["id"]: entry for entry in catalog["entries"]}
    assert len(custom) == 50, "The customization PR must retain its exact 50 records."
    assert len(current) == len(catalog["entries"]), "Duplicate catalogue IDs."
    assert set(current) == set(original) | set(custom), "Merged IDs differ from main plus the customization PR."
    for identifier, record in {**original, **custom}.items():
        assert current[identifier] == record, f"Protected record changed: {identifier}"
    assert catalog["categories"] == main["categories"] == pr["categories"], "Category definitions changed."
    assert catalog["meta"]["version"] == "0.3.0"
    for key, value in main["meta"].items():
        if key not in ("version", "updatedAt"):
            assert catalog["meta"][key] == value, f"Main metadata lost or changed: {key}"
    for key, value in pr["meta"]["customization"].items():
        if key != "equipmentModel":
            assert catalog["meta"]["customization"][key] == value, f"Customization metadata lost: {key}"
    main_sources = {source["id"]: source for source in main["sources"]}
    pr_sources = {source["id"]: source for source in pr["sources"]}
    sources = {source["id"]: source for source in catalog["sources"]}
    assert len(sources) == len(catalog["sources"])
    assert set(sources) == set(main_sources) | set(pr_sources), "A source from either branch is missing."
    for identifier, source in main_sources.items():
        assert sources[identifier] == source, f"Latest main source annotation changed: {identifier}"
    for identifier, source in pr_sources.items():
        if identifier not in main_sources:
            assert sources[identifier] == source, f"Customization source changed: {identifier}"
        else:
            for field in ("id", "title", "url"):
                assert sources[identifier].get(field) == source.get(field), f"Shared source identity changed: {identifier}"
    assert list(old.sheets) == list(new.sheets) and len(new.sheets) == 28
    assert set(old.tables) == set(new.tables) and len(new.tables) == 26
    baseline_cells = 0
    for category in main["categories"]:
        cells = old.cells(category["sheetName"])
        for row, entry in enumerate((record for record in main["entries"] if record["category"] == category["id"]), 7):
            for index, field in enumerate(FIELDS):
                expected = entry.get(field) or ""
                if isinstance(expected, list): expected = ", ".join(expected)
                assert cells.get(f"{chr(65+index)}{row}", {}).get("value", "") == str(expected), "The baseline XLSX does not match its catalogue."
                baseline_cells += 1
    for name in old.sheets:
        for query in ("s:sheetViews", "s:cols", "s:sheetProtection", "s:mergeCells"):
            assert tree(old.sheets[name].find(query, NS)) == tree(new.sheets[name].find(query, NS)), f"Native feature changed: {name} {query}"
        old_cf, new_cf = old.conditional_formats(name), new.conditional_formats(name)
        for old_range, rules in old_cf:
            assert any(rules == candidate and extends_range(old_range, new_range) for new_range, candidate in new_cf), f"Conditional formatting lost: {name} {old_range}"
    spec = importlib.util.spec_from_file_location("relay_current_workbook_verifier", root/"scripts/verify-workbook.py")
    verifier = importlib.util.module_from_spec(spec); spec.loader.exec_module(verifier)
    native = verifier.verify(root, len(catalog["entries"]), len(sources), main_ref)
    assert native["passed"], native["errors"][:20]
    return {
        "passed": True, "at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "version": "0.3.0",
        "mode": "main-regenerated-customization-merge", "mainRef": main_ref, "customizationRef": pr_ref,
        "records": len(catalog["entries"]), "preservedMainRecords": len(original), "preservedCustomizationRecords": len(custom),
        "protectedRecordsUnchanged": True, "mainMetadataPreserved": True, "customizationMetadataPreserved": True,
        "sources": len(sources), "sourceIdentitiesFromBothBranchesPreserved": True, "latestMainSourceAnnotationsPreserved": True,
        "sharedSourceScopePriority": "Latest main annotations retained for shared IDs; historical PR reports remain unchanged.",
        "baselineCatalogueCellsCompared": baseline_cells, "sheets": 28, "tablesWithFilters": 26,
        "nativeViewsColumnsProtectionAndMergesPreserved": True, "conditionalFormattingRangesPreservedOrExtended": True,
        "nativeWorkbookVerification": native,
        "method": "Read-only JSON and ZIP/XML comparisons against both Git baselines, then current main workbook validation; no native desktop execution.",
    }

def tree(element):
    if element is None:
        return None
    return (element.tag.split("}")[-1], tuple(sorted(element.attrib.items())), element.text or "", tuple(tree(child) for child in element))

class Package:
    def __init__(self, filename):
        self.zip = ZipFile(filename)
        workbook = ET.fromstring(self.zip.read("xl/workbook.xml"))
        rels = ET.fromstring(self.zip.read("xl/_rels/workbook.xml.rels"))
        targets = {r.attrib["Id"]: posixpath.normpath(posixpath.join("xl", r.attrib["Target"])) if not r.attrib["Target"].startswith("/") else r.attrib["Target"].lstrip("/") for r in rels}
        self.sheets = {s.attrib["name"]: ET.fromstring(self.zip.read(targets[s.attrib[f'{{{NS["r"]}}}id']])) for s in workbook.find("s:sheets", NS)}
        self.strings = []
        if "xl/sharedStrings.xml" in self.zip.namelist():
            self.strings = ["".join(t.text or "" for t in si.iter(f'{{{NS["s"]}}}t')) for si in ET.fromstring(self.zip.read("xl/sharedStrings.xml"))]
        self.styles = ET.fromstring(self.zip.read("xl/styles.xml"))
        self.xfs = list(self.styles.find("s:cellXfs", NS))
        self.components = {k: list(self.styles.find("s:"+k, NS)) for k in ["fonts", "fills", "borders"]}
        self.formats = {n.attrib["numFmtId"]: n.attrib["formatCode"] for n in self.styles.findall("s:numFmts/s:numFmt", NS)}
        self.tables = {t.attrib["name"]: t for name in self.zip.namelist() if re.fullmatch(r"xl/tables/table\d+\.xml", name) for t in [ET.fromstring(self.zip.read(name))]}

    def conditional_formats(self, sheet):
        dxfs = list(self.styles.find("s:dxfs", NS))
        groups = []
        for group in self.sheets[sheet].findall("s:conditionalFormatting", NS):
            rules = []
            for rule in group:
                attributes = {k: v for k, v in rule.attrib.items() if k not in ["priority", "dxfId"]}
                dxf = tree(dxfs[int(rule.attrib["dxfId"])]) if "dxfId" in rule.attrib else None
                rules.append((tuple(sorted(attributes.items())), tuple(tree(child) for child in rule), dxf))
            groups.append((group.attrib["sqref"], tuple(rules)))
        return groups

    def cells(self, sheet):
        result = {}
        for cell in self.sheets[sheet].findall("s:sheetData/s:row/s:c", NS):
            formula = cell.find("s:f", NS)
            v = cell.find("s:v", NS)
            text = v.text if v is not None else None
            if cell.attrib.get("t") == "s":
                text = self.strings[int(text)]
            elif cell.attrib.get("t") == "inlineStr":
                text = "".join(t.text or "" for t in cell.findall("s:is/s:t", NS))
            result[cell.attrib["r"]] = {"value": text or "", "formula": formula.text if formula is not None else None, "type": cell.attrib.get("t", "n"), "style": self.style(int(cell.attrib.get("s", "0")))}
        return result

    def style(self, index):
        xf = self.xfs[index]
        return {
            "font": tree(self.components["fonts"][int(xf.attrib.get("fontId", "0"))]),
            "fill": tree(self.components["fills"][int(xf.attrib.get("fillId", "0"))]),
            "border": tree(self.components["borders"][int(xf.attrib.get("borderId", "0"))]),
            "numfmt": self.formats.get(xf.attrib.get("numFmtId", "0"), xf.attrib.get("numFmtId", "0")),
            "alignment": tree(xf.find("s:alignment", NS)),
            "protection": tree(xf.find("s:protection", NS)),
        }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--baseline-catalog", required=True)
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--main-ref", help="Enable regenerated merge verification against this exact main commit.")
    parser.add_argument("--customization-ref", help="PR commit providing the 50 unchanged CUST- records.")
    parser.add_argument("--report", help="Report path; merge mode defaults to a distinct customization-merge-native-check.json.")
    args = parser.parse_args()
    root = Path(args.root)
    baseline = json.loads(Path(args.baseline_catalog).read_text())
    catalog = json.loads((root / "docs/content-catalog.json").read_text())
    old = Package(args.baseline)
    file = root / "docs/Mass_Effect_Relay_Chronicles_Production.xlsx"
    new = Package(file)
    if args.main_ref:
        assert args.customization_ref, "--customization-ref is required with --main-ref."
        report = verify_merged(root, args, baseline, catalog, old, new)
        destination = Path(args.report) if args.report else root/"docs/workbook-previews/customization-merge-native-check.json"
        destination.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
        print(json.dumps({key: value for key, value in report.items() if key != "nativeWorkbookVerification"}, ensure_ascii=False, indent=2))
        return
    assert list(old.sheets) == list(new.sheets), "Worksheet order or names changed."
    assert len(new.sheets) == 28
    assert set(old.tables) == set(new.tables) and len(new.tables) == 26
    errors, style_changes, historic_cells = [], [], 0
    changed_dashboard = {str(10+i) for i, cat in enumerate(catalog["categories"]) if sum(e["category"] == cat["id"] for e in catalog["entries"]) != sum(e["category"] == cat["id"] for e in baseline["entries"])}
    old_source_end = 29+len(baseline["sources"])
    for name in old.sheets:
        a, b = old.cells(name), new.cells(name)
        for ref, cell in a.items():
            row = int(re.search(r"\d+", ref).group())
            if name == "Guide" and row > old_source_end:
                continue  # Source additions move the four-row metadata footer.
            after = b.get(ref, {"value": "", "formula": None, "style": None})
            if cell["style"] != after["style"]:
                style_changes.append(f"{name}!{ref}")
            if name == "Dashboard" and cell["formula"]:
                if str(row) in changed_dashboard and ref[0] != "A":
                    continue
                if cell["formula"] != after["formula"]:
                    errors.append(f"Unexpected formula change: {name}!{ref}")
                continue  # Cached totals are expected to recalculate.
            if (cell["value"], cell["formula"]) != (after["value"], after["formula"]):
                errors.append(f"Historic content changed: {name}!{ref}")
            historic_cells += 1
        for query in ["s:sheetViews", "s:cols", "s:sheetProtection", "s:mergeCells"]:
            assert tree(old.sheets[name].find(query, NS)) == tree(new.sheets[name].find(query, NS)), f"Native feature changed: {name} {query}"
        if name != "Guide":
            old_rows = {r.attrib["r"]: r.attrib for r in old.sheets[name].findall("s:sheetData/s:row", NS)}
            new_rows = {r.attrib["r"]: r.attrib for r in new.sheets[name].findall("s:sheetData/s:row", NS)}
            for number, row in old_rows.items():
                assert row == new_rows[number], f"Historic row dimension changed: {name} {number}"
        old_validations = [tree(v) for v in old.sheets[name].findall("s:dataValidations/s:dataValidation", NS)]
        new_validations = [tree(v) for v in new.sheets[name].findall("s:dataValidations/s:dataValidation", NS)]
        for validation in old_validations:
            assert validation in new_validations, f"Original validation missing: {name}"
        new_cf = new.conditional_formats(name)
        for conditional_format in old.conditional_formats(name):
            assert conditional_format in new_cf, f"Original conditional formatting missing: {name}"
    assert not errors, errors[:20]
    assert not style_changes, f"Historic cell styles changed: {style_changes[:20]} ({len(style_changes)} total)"
    cells_checked, missing_paths = 0, []
    for category in catalog["categories"]:
        sheet = category["sheetName"]
        entries = [entry for entry in catalog["entries"] if entry["category"] == category["id"]]
        cells = new.cells(sheet)
        table = new.tables["Catalog_"+category["id"]]
        expected_range = f"A6:Q{6+len(entries)}"
        assert table.attrib["ref"] == expected_range
        assert table.find("s:autoFilter", NS).attrib["ref"] == expected_range
        old_count = sum(entry["category"] == category["id"] for entry in baseline["entries"])
        if len(entries) != old_count:
            validation_ranges = {v.attrib["sqref"] for v in new.sheets[sheet].findall("s:dataValidations/s:dataValidation", NS)}
            for col in "CDEFG":
                assert f"{col}{7+old_count}:{col}{6+len(entries)}" in validation_ranges, f"New-row validation missing on {sheet} {col}"
        for i, entry in enumerate(entries, 7):
            for j, key in enumerate(FIELDS):
                expected = entry.get(key) or ""
                if isinstance(expected, list):
                    expected = ", ".join(expected)
                actual = cells.get(f"{chr(65+j)}{i}", {}).get("value", "")
                assert actual == str(expected), f"Catalogue mismatch {sheet}!{chr(65+j)}{i}"
                cells_checked += 1
            if entry["id"].startswith("CUST-") and entry.get("assetPath") and not (root/entry["assetPath"]).is_file():
                missing_paths.append(entry["assetPath"])
    assert not missing_paths, f"Missing evidence files: {sorted(set(missing_paths))}"
    cached_errors = [f"{name}!{ref}" for name in new.sheets for ref,c in new.cells(name).items() if c["type"] == "e"]
    assert not cached_errors, cached_errors
    totals = new.cells("Dashboard")
    assert int(totals["B37"]["value"]) == len(catalog["entries"])
    assert int(totals["B35"]["value"]) == 57
    guide = new.cells("Guide")
    for row, source in enumerate(catalog["sources"], 30):
        for col, expected in zip("ABCD", [source["id"], source["title"], source["scope"], source.get("url") or "Conception du projet, sans source externe"]):
            assert guide[f"{col}{row}"]["value"] == expected, f"Guide source mismatch {col}{row}"
    assert guide[f'B{34+len(catalog["sources"])}']["value"] == catalog["meta"]["version"]
    report = {
        "version": "0.3.0", "sheets": 28, "tablesWithFilters": 26,
        "records": len(catalog["entries"]), "preservedOriginalRecords": len(baseline["entries"]),
        "preservedTrilogyRecords": 57, "originalCellsCompared": historic_cells,
        "catalogueCellsCompared": cells_checked, "originalCellStylesUnchanged": True,
        "originalValuesAndFormulasUnchangedExceptAffectedTotals": True,
        "originalColumnAndRowSizesPreserved": True, "originalValidationsPreserved": True,
        "newRowsValidated": True, "originalConditionalFormattingPreserved": True,
        "guideSourcesMatch": True, "guideSourceCount": len(catalog["sources"]),
        "originalFreezePanesPreserved": True, "cachedFormulaErrors": cached_errors,
        "declaredCustomizationFilesExist": True,
        "xlsxSha256": hashlib.sha256(file.read_bytes()).hexdigest(),
        "method": "Read-only ZIP/XML inspection with Python standard library; no Microsoft Excel desktop execution.",
    }
    destination = Path(args.report) if args.report else root/"docs/workbook-previews/customization-native-check.json"
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
