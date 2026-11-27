#!/usr/bin/env python3
"""Resolve Markdown links in the lot13 docs and the three updated indexes."""
import hashlib
import json
from pathlib import Path
import posixpath
import re
import subprocess
import unicodedata
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
BASE = 'c67af65cd469da9cc3eb3748d2497ea50a578fbd'
FOLDER = ROOT / 'docs/armax/lot13'
FILES = [ROOT / 'README.md', ROOT / 'docs/ASSETS.md', ROOT / 'docs/armax/README.md']
FILES += sorted(FOLDER.glob('*.md'))
TRACKED = set(subprocess.check_output(['git', 'ls-tree', '-rz', '--name-only', BASE], cwd=ROOT).decode().split('\0'))


def content(path):
    if (ROOT / path).is_file():
        return (ROOT / path).read_text()
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT).decode()


def anchors(text):
    result, seen = set(), {}
    for line in text.splitlines():
        match = re.match(r'^#{1,6}\s+(.+?)\s*#*$', line)
        if not match:
            continue
        heading = re.sub(r'[`*_~]', '', match[1]).lower()
        slug = ''.join(character for character in heading if character == '-' or character == '_' or character.isspace() or not unicodedata.category(character).startswith(('P', 'S')))
        slug = slug.replace(' ', '-')
        number = seen.get(slug, 0)
        seen[slug] = number + 1
        result.add(slug if number == 0 else f'{slug}-{number}')
    return result


errors, targets, external, documents = [], set(), set(), []
occurrences = local_count = git_count = anchor_count = 0
for file in FILES:
    text = file.read_text()
    relative = file.relative_to(ROOT).as_posix()
    documents.append({'path': relative, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    for match in re.finditer(r'!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)', text):
        target = match[1].strip('<>')
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc:
            external.add(target)
            continue
        occurrences += 1
        resolved = posixpath.normpath(posixpath.join(posixpath.dirname(relative), unquote(parsed.path))) if parsed.path else relative
        targets.add(resolved)
        if (ROOT / resolved).is_file():
            local_count += 1
        elif resolved in TRACKED:
            git_count += 1
        else:
            errors.append({'document': relative, 'link': target, 'resolved': resolved, 'error': 'target_missing'})
            continue
        if parsed.fragment and resolved.endswith('.md'):
            anchor_count += 1
            if unquote(parsed.fragment) not in anchors(content(resolved)):
                errors.append({'document': relative, 'link': target, 'resolved': resolved, 'error': 'anchor_missing'})

report = {
    'date': '2026-11-24', 'baseCommit': BASE,
    'scope': 'Markdown links in complete lot13 Markdown files and three root indexes. External URLs are enumerated, not network-tested.',
    'documents': documents, 'counts': {'documents': len(documents), 'localLinkOccurrences': occurrences,
        'distinctLocalTargets': len(targets), 'localFilesystemResolutions': local_count,
        'baseGitTreeResolutions': git_count, 'anchorsChecked': anchor_count, 'distinctExternalUrls': len(external)},
    'externalUrls': sorted(external), 'errors': errors, 'success': not errors,
}
FOLDER.mkdir(parents=True, exist_ok=True)
(FOLDER / 'link-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'success': report['success'], 'counts': report['counts'], 'errors': errors}, ensure_ascii=False))
raise SystemExit(0 if report['success'] else 1)
