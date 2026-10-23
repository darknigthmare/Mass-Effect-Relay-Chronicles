"""Read-only XLSX package checks; standard library, no workbook authoring."""
import argparse
import hashlib
import json
import posixpath
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main", "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
FIELDS = ["id", "name", "status", "assetStatus", "priority", "episode", "canonLevel", "description", "acceptance", "dependencies", "plannedPath", "assetPath", "gameKey", "reference", "sourceUrl", "scope", "notes"]

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
    args = parser.parse_args()
    root = Path(args.root)
    baseline = json.loads(Path(args.baseline_catalog).read_text())
    catalog = json.loads((root / "docs/content-catalog.json").read_text())
    old = Package(args.baseline)
    file = root / "docs/Mass_Effect_Relay_Chronicles_Production.xlsx"
    new = Package(file)
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
    (root/"docs/workbook-previews/customization-native-check.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
