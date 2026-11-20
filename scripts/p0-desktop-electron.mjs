import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { _electron as electron } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.env.RELAY_DESKTOP_OUTPUT || path.join(root, 'test-results/p0-desktop'));
const distribution = path.resolve(process.env.RELAY_DESKTOP_DIST || path.join(root, 'dist'));
const headless = process.env.RELAY_ELECTRON_HEADLESS === '1';
const reportFile = path.join(output, 'report.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  passed: false,
  criterion: { id: 'SYS-mode-bureau', description: 'Lancement local dans une fenêtre dédiée.', acceptance: 'Chemins de fichiers, sauvegarde et fermeture contrôlés.' },
  at: new Date().toISOString(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  platform: process.platform,
  run: headless ? 'Electron headless avec rendu logiciel et profil temporaire' : 'Fenêtre Electron avec profil temporaire',
  command: 'node scripts/p0-desktop-electron.mjs',
  scope: 'Application Electron avec les fichiers compilés copiés dans un dossier isolé. Sauvegardes exercées via les commandes publiques.',
  checks: [], sourceHashes: {}, rendererErrors: [], screenshots: [],
};

await mkdir(output, { recursive: true });
try {
  await access(reportFile);
  throw new Error(`Choisissez un nouveau répertoire de preuves. ${reportFile} existe déjà.`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const temporary = await mkdtemp(path.join(tmpdir(), 'relay-electron-'));
const application = path.join(temporary, 'Application locale – test');
const cwd = path.join(temporary, 'Répertoire de lancement');
const profile = path.join(temporary, 'Profil de test');
const appArgs = [
  `--user-data-dir=${profile}`,
  ...(headless ? ['--headless', '--ozone-platform=headless', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
  application,
];
let instance;
let executablePath;

function action(page, name, id) {
  return page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`);
}

async function newCampaign(page, name) {
  await action(page, 'new').click();
  await page.locator('#commander-name').fill(name);
  await action(page, 'begin').click();
  await action(page, 'dialogue-choice').click();
  await page.locator('#hud:not(.hidden)').waitFor();
  await page.getByText(name, { exact: true }).first().waitFor();
}

async function launch() {
  instance = await electron.launch({ executablePath, args: appArgs, cwd, chromiumSandbox: !headless, timeout: 30_000 });
  const page = await instance.firstWindow();
  page.setDefaultTimeout(25_000);
  page.on('pageerror', error => report.rendererErrors.push(error.message));
  page.on('requestfailed', request => report.rendererErrors.push(`${request.url()} : ${request.failure()?.errorText}`));
  await page.locator('.title-menu').waitFor();
  return page;
}

async function screenshot(page, name) {
  const outputPath = path.join(output, `${name}.png`);
  const bytes = await page.screenshot();
  await writeFile(outputPath, bytes, { flag: 'wx' });
  report.screenshots.push({ path: path.relative(root, outputPath), sha256: sha256(bytes) });
}

async function closeWindow() {
  const closed = instance.waitForEvent('close', { timeout: 20_000 });
  const exited = once(instance.process(), 'exit', { signal: AbortSignal.timeout(20_000) });
  await instance.evaluate(({ BrowserWindow, app }) => {
    const window = BrowserWindow.getAllWindows()[0];
    if (process.platform === 'darwin') app.once('window-all-closed', () => app.quit());
    setTimeout(() => window.close(), 100);
  });
  const [, [code, signal]] = await Promise.all([closed, exited]);
  assert.equal(code, 0, 'La fermeture native doit rendre le code 0');
  assert.equal(signal, null, 'Le processus doit terminer par sa fermeture normale');
  instance = null;
}

try {
  executablePath = process.env.RELAY_ELECTRON_EXECUTABLE || (await import('electron')).default;
  if (!executablePath) throw new Error('Le binaire Electron installé manque. Configurez RELAY_ELECTRON_EXECUTABLE si nécessaire.');
  await mkdir(application);
  await mkdir(cwd);
  for (const name of ['desktop', 'package.json']) {
    await cp(path.join(root, name), path.join(application, name), { recursive: true });
  }
  await cp(distribution, path.join(application, 'dist'), { recursive: true });
  for (const name of ['desktop/main.cjs', 'package.json', 'package-lock.json', 'scripts/p0-desktop-electron.mjs']) {
    report.sourceHashes[name] = sha256(await readFile(path.join(root, name)));
  }

  let page = await launch();
  assert.equal(page.url(), pathToFileURL(path.join(application, 'dist/index.html')).href);
  const native = await instance.evaluate(({ app, BrowserWindow }) => {
    const windows = BrowserWindow.getAllWindows();
    return { electron: process.versions.electron, windows: windows.length, userData: app.getPath('userData'), visible: windows[0].isVisible() };
  });
  assert.equal(native.windows, 1);
  assert.equal(native.userData, profile);
  assert.equal(native.visible, true);
  assert.equal(await page.evaluate(() => '__RELAY_TEST__' in window || typeof window.require !== 'undefined'), false);
  report.electron = native.electron;

  const localResources = new Set();
  page.on('request', request => localResources.add(request.url()));
  await page.reload();
  await action(page, 'credits').click();
  await page.getByRole('dialog', { name: /Crédits/ }).waitFor();
  const localRoot = pathToFileURL(path.join(application, 'dist') + path.sep).href;
  assert.ok([...localResources].some(url => url.endsWith('.js')));
  assert.ok([...localResources].some(url => url.endsWith('.png')));
  assert.ok([...localResources].every(url => url.startsWith(localRoot) || url.startsWith('data:')), 'Les ressources du jeu sont locales');
  await action(page, 'production-back').click();
  report.localFiles = await Promise.all([...localResources].filter(url => url.startsWith(localRoot)).sort().map(async url => {
    const filename = fileURLToPath(url);
    const bytes = await readFile(filename);
    return { path: path.relative(path.join(application, 'dist'), filename).split(path.sep).join('/'), bytes: bytes.length, sha256: sha256(bytes) };
  }));
  report.checks.push('Une fenêtre Electron charge le jeu et ses ressources locales depuis un chemin avec espace et caractères Unicode, lancé depuis un autre dossier. Les crédits chargent leur module compilé.');

  const second = spawn(executablePath, [...(headless ? ['--no-sandbox'] : []), ...appArgs], { cwd, stdio: 'ignore' });
  try {
    const [code, signal] = await once(second, 'exit', { signal: AbortSignal.timeout(15_000) });
    assert.equal(code, 0);
    assert.equal(signal, null);
    assert.equal(await instance.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 1);
    await action(page, 'new').waitFor();
  } finally {
    if (second.exitCode === null && second.signalCode === null) second.kill();
  }
  report.checks.push('Un deuxième lancement avec le même profil laisse une seule fenêtre et se termine normalement.');

  const manualName = 'Reprise manuelle';
  const automaticName = 'Reprise automatique';
  await newCampaign(page, manualName);
  await page.keyboard.press('Escape');
  await action(page, 'manual-saves').click();
  await page.locator('#manual-save-name-1').fill('Contrôle bureau');
  await action(page, 'manual-save', '1').click();
  await page.locator('[data-save-slot="1"][data-status="saved"]').waitFor();
  await action(page, 'manual-back').click();
  await action(page, 'quit').click();
  await newCampaign(page, automaticName);
  await closeWindow();

  page = await launch();
  await action(page, 'continue').click();
  await page.getByText(automaticName, { exact: true }).first().waitFor();
  await page.keyboard.press('Escape');
  await action(page, 'dossier').click();
  assert.equal(await page.locator('.commander-name').textContent(), automaticName);
  await screenshot(page, 'automatic-after-restart');
  await action(page, 'dossier-back').click();
  await action(page, 'manual-saves').click();
  const slot = page.locator('[data-save-slot="1"][data-status="saved"]');
  assert.equal(await slot.locator('.save-slot-name').textContent(), 'Contrôle bureau');
  assert.ok((await slot.locator('.save-slot-commander').textContent()).includes(manualName));
  await screenshot(page, 'manual-after-restart');
  await action(page, 'manual-load', '1').click();
  await page.getByText(manualName, { exact: true }).first().waitFor();
  await closeWindow();
  report.checks.push('Deux fermetures natives aboutissent à un arrêt normal. Au démarrage suivant, la reprise automatique et l’emplacement manuel restaurent chacun le commandant choisi.');
  assert.deepEqual(report.rendererErrors, []);
  for (const [name, expected] of Object.entries(report.sourceHashes)) {
    assert.equal(sha256(await readFile(path.join(root, name))), expected, name);
  }
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await instance?.close().catch(() => {});
  await rm(temporary, { recursive: true, force: true });
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, report: reportFile, failure: report.failure }));
}
