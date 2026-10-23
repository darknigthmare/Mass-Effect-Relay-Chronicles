// Work IDs are documentary identifiers, not necessarily valid file names.
// Windows reserves CON even with an extension: https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
const fileStems = Object.freeze({ CON: 'CONVICTION' });
const reservedDevice = /^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])$/i;

export function universeFileStem(id) {
  if (typeof id !== 'string' || !/^[A-Z][A-Z0-9_-]*$/.test(id)) {
    throw new Error(`Invalid universe work ID: ${id}`);
  }
  const stem = fileStems[id] ?? id;
  if (reservedDevice.test(stem)) throw new Error(`Reserved Windows file name for work ID: ${id}`);
  return stem;
}

export function universeJsonFilename(id) {
  return `${universeFileStem(id)}.json`;
}
