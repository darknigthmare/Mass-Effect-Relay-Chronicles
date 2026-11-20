const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('node:path');

const externalHosts = new Set(['github.com', 'www.github.com', 'ea.com', 'www.ea.com']);

function openReference(url) {
  let target;
  try {
    target = new URL(url);
  } catch {
    return;
  }
  if (target.protocol !== 'https:' || !externalHosts.has(target.host) || target.username || target.password) return;
  shell.openExternal(target.href).catch(error => console.error('Impossible d’ouvrir ce lien.', error));
}

async function openGameWindow() {
  const current = BrowserWindow.getAllWindows()[0];
  if (current) {
    if (current.isMinimized()) current.restore();
    current.focus();
    return;
  }

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#060e18',
    title: 'Mass Effect — Relay Chronicles',
    autoHideMenuBar: true,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    openReference(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-frame-navigate', event => event.preventDefault());
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || input.key !== 'F11') return;
    event.preventDefault();
    if (!input.isAutoRepeat) win.setFullScreen(!win.isFullScreen());
  });

  const index = path.join(app.getAppPath(), 'dist', 'index.html');
  try {
    await win.loadFile(index);
    if (!win.isDestroyed()) win.show();
  } catch (error) {
    if (win.isDestroyed()) return;
    console.error(`Impossible de charger ${index}.`, error);
    dialog.showErrorBox('Relay Chronicles', 'Les fichiers du jeu sont introuvables ou illisibles. Réinstallez l’application ou reconstruisez le jeu.');
    app.exit(1);
  }
}

if (app.requestSingleInstanceLock()) {
  app.whenReady().then(() => {
    app.on('activate', openGameWindow);
    return openGameWindow();
  });
  app.on('second-instance', () => app.whenReady().then(openGameWindow));
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
} else {
  app.quit();
}
