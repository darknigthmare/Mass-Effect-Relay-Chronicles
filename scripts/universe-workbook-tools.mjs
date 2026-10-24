import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const CONTENT_STATUSES = Object.freeze(['Défini', 'Prototype', 'Intégré', 'Validé']);
const csv = (value, option) => {
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${option}.`);
  const items = value.split(',');
  if (items.some(item => !item || item.trim() !== item) || new Set(items).size !== items.length) throw new Error(`Empty or duplicate selection for ${option}.`);
  return items;
};

export function parseWorkbookOptions(args) {
  const result = { ids: null, renderSheets: null, focusStatus: null, focusIds: null, noRender: false, planPreviews: false, help: false };
  const lists = { '--ids': 'ids', '--render-sheets': 'renderSheets', '--focus-status': 'focusStatus', '--focus-ids': 'focusIds' };
  for (let i = 0; i < args.length; i++) {
    const option = args[i];
    if (Object.hasOwn(lists, option)) {
      if (result[lists[option]] !== null) throw new Error(`Repeated option ${option}.`);
      result[lists[option]] = csv(args[++i], option);
    } else if (option === '--no-render') result.noRender = true;
    else if (option === '--plan-previews') result.planPreviews = true;
    else if (option === '--help') result.help = true;
    else throw new Error(`Unknown option ${option}.`);
  }
  if (result.focusStatus?.some(status => !CONTENT_STATUSES.includes(status))) throw new Error('Unknown focus status.');
  return result;
}

export function validateWorkbookSelection(books, categories, options) {
  const known = new Set(books.map(book => book.id));
  if (known.size !== books.length) throw new Error('Duplicate catalogue IDs.');
  if (options.ids?.some(id => !known.has(id))) throw new Error('Unknown catalogue selection.');
  const sheetNames = new Set(['Dashboard', ...categories.map(category => category.sheetName), 'Guide']);
  if (options.renderSheets?.some(name => !sheetNames.has(name))) throw new Error('Unknown worksheet selection.');
  const selected = books.filter(book => !options.ids || options.ids.includes(book.id));
  const allIds = selected.flatMap(book => book.entries.map(entry => entry.id));
  const ids = new Set(allIds);
  if (ids.size !== allIds.length) throw new Error('Duplicate record IDs in selected catalogues.');
  if (options.focusIds?.some(id => !ids.has(id))) throw new Error('Focus IDs must belong to the selected catalogues.');
  return selected;
}

function windows(selected, maximum = 4) {
  const result = [];
  for (const row of selected) {
    const last = result.at(-1);
    if (last && row.row <= last.end + 2 && row.row - last.start + 1 <= maximum) {
      last.end = row.row;
      last.ids.push(row.id);
    } else result.push({ start: row.row, end: row.row, ids: [row.id] });
  }
  return result;
}

/** A rendering plan does not touch workbooks and never changes record order. */
export function planWorkbookPreviews(book, categories, options = {}) {
  if (options.noRender) return [];
  const focused = Boolean(options.focusStatus?.length || options.focusIds?.length);
  const include = name => !options.renderSheets || options.renderSheets.includes(name);
  const previews = [];
  const add = (sheetName, range, filename, kind, ids = []) => previews.push({ sheetName, range, filename, kind, selectedIds: ids });
  if (!focused || options.renderSheets) {
    for (const name of ['Dashboard', ...categories.map(category => category.sheetName), 'Guide']) {
      if (include(name)) add(name, name === 'Dashboard' ? 'A1:M38' : name === 'Guide' ? 'A1:B13' : 'A1:H7', `${name}.png`, 'opening');
    }
  }
  if (focused) {
    for (const category of categories) {
      if (!include(category.sheetName)) continue;
      const records = book.entries.filter(entry => entry.category === category.id);
      const selected = records.flatMap((entry, index) =>
        (!options.focusStatus || options.focusStatus.includes(entry.status)) && (!options.focusIds || options.focusIds.includes(entry.id))
          ? [{ row: index + 7, id: entry.id }] : []);
      for (const group of windows(selected)) {
        for (const [panel, left, right] of [['identity', 'A', 'H'], ['production', 'I', 'P'], ['sources', 'Q', 'S']]) {
          add(category.sheetName, `${left}${group.start}:${right}${group.end}`, `${category.sheetName}-focus-${group.start}-${group.end}-${panel}.png`, 'focus', group.ids);
        }
      }
    }
  } else {
    const nonempty = categories.filter(category => book.entries.some(entry => entry.category === category.id));
    const sample = nonempty[0];
    const chosen = nonempty.find(category => category.id === 'main_quests') || sample;
    if (chosen && include(chosen.sheetName)) {
      const end = Math.min(8, 6 + book.entries.filter(entry => entry.category === chosen.id).length);
      add(chosen.sheetName, `I6:Q${end}`, 'Detail.png', 'detail');
    }
    const coverageStart = book.sources.length ? 30 + book.sources.length : 27;
    if (include('Guide') && book.coverage.length) add('Guide', `A${coverageStart}:C${Math.min(coverageStart + 3, coverageStart + book.coverage.length)}`, 'Couverture.png', 'coverage');
    if (sample && include(sample.sheetName)) {
      const end = Math.min(8, 6 + book.entries.filter(entry => entry.category === sample.id).length);
      add(sample.sheetName, `Q6:S${end}`, 'Sources_notes.png', 'sources');
    }
  }
  return previews;
}

export const sha256 = data => createHash('sha256').update(data).digest('hex');

/** Proof paths are project-relative regular files; symlinks are not followed. */
export async function checkedProjectFile(root, declaredPath) {
  if (typeof declaredPath !== 'string' || !declaredPath || declaredPath.trim() !== declaredPath || /[\\\0\r\n]/.test(declaredPath) || path.isAbsolute(declaredPath) || /^[A-Za-z]:/.test(declaredPath)) throw new Error('Expected a project-relative proof path.');
  const components = declaredPath.split('/');
  if (components.some(component => !component || component === '.' || component === '..')) throw new Error(`Unsafe project path ${declaredPath}.`);
  let current = path.resolve(root);
  const base = await fs.lstat(current);
  if (base.isSymbolicLink() || !base.isDirectory()) throw new Error('Project root must be a real directory.');
  for (const component of components) {
    current = path.join(current, component);
    const metadata = await fs.lstat(current);
    if (metadata.isSymbolicLink()) throw new Error(`Symlink proof path rejected: ${declaredPath}.`);
  }
  if (!(await fs.lstat(current)).isFile()) throw new Error(`Proof must be a file: ${declaredPath}.`);
  const bytes = await fs.readFile(current);
  return { path: declaredPath, sha256: sha256(bytes), bytes, absolutePath: current };
}

export async function checkDeclaredProofs(entry, root) {
  if (entry.status === 'Défini') return null;
  if (entry.implementationPaths?.length && entry.implementationPath) throw new Error(`Use implementationPath or implementationPaths, not both: ${entry.id}.`);
  const implementations = entry.implementationPaths || (entry.implementationPath ? [entry.implementationPath] : []);
  if (!Array.isArray(implementations) || !implementations.length || !Array.isArray(entry.evidence) || !entry.evidence.length) throw new Error(`Explicit implementationPaths and evidence required: ${entry.id}.`);
  for (const list of [implementations, entry.evidence]) if (new Set(list).size !== list.length) throw new Error(`Duplicate proof path: ${entry.id}.`);
  if (!implementations.some(item => typeof item === 'string' && item.startsWith('src/') && /\.(?:[cm]?js|tsx?|jsx)$/.test(item))) throw new Error(`Implementation source in src/ required: ${entry.id}.`);
  const paths = await Promise.all(implementations.map(item => checkedProjectFile(root, item)));
  const evidence = await Promise.all(entry.evidence.map(item => checkedProjectFile(root, item)));
  const compact = file => ({ path: file.path, sha256: file.sha256 });
  return { id: entry.id, status: entry.status, implementationPaths: paths.map(compact), evidence: evidence.map(compact) };
}
