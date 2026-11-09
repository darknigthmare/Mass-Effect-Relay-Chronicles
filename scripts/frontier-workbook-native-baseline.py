"""Read-only native XLSX structure and row-height inventory for the frontier lot."""
import importlib.util
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('frontier_native_helpers', ROOT / 'scripts/verify-eden-immersion-workbook.py')
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)

if __name__ == '__main__':
    result = {'sheets': 0, 'tables': 0, 'formulas': 0, 'dataValidations': 0, 'conditionalRules': 0, 'rowHeights': {}}
    with zipfile.ZipFile(sys.argv[1]) as book:
        result['tables'] = sum(name.startswith('xl/tables/') and name.endswith('.xml') for name in book.namelist())
        for name, part in native.sheets(book):
            result['sheets'] += 1
            root = ET.fromstring(book.read(part))
            result['formulas'] += len(list(root.iter(native.q('f'))))
            result['dataValidations'] += len(list(root.iter(native.q('dataValidation'))))
            result['conditionalRules'] += len(list(root.iter(native.q('cfRule'))))
            result['rowHeights'][name] = {row.get('r'): float(row.get('ht', 0)) for row in root.iter(native.q('row'))}
        result['differentialStyleDefinitions'] = len(ET.fromstring(book.read('xl/styles.xml')).find(native.q('dxfs')))
    print(json.dumps(result))
