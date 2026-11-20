import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { getUniverseRecord, getUniverseWork, UNIVERSE_SUMMARY } from '../src/universe-data.js';

const citationIdsByWork = {
  BLA: ['SCOPE', 'FICTION', 'KRONUS'],
  CON: ['SCOPE', 'OMEGA', 'ANDERSON'],
  DIS: ['SCOPE', 'TIRAN', 'ZETA', 'FOUR'],
  EVO: ['SCOPE', 'WAR', 'CONTACT', 'META'],
  FOU: ['SCOPE', 'VOL1', 'VOL2', 'VOL3', 'BINDINGS', 'ALIAS'],
  HOM: ['SCOPE', 'ISSUE1', 'ISSUE2', 'ISSUE3', 'ISSUE4'],
  HWB: ['SCOPE', 'PILOT', 'SR1'],
  INC: ['SCOPE', 'TIMING', 'INTEL'],
  INQ: ['SCOPE', 'DOUBT', 'PROMOTION'],
  INV: ['SCOPE', 'FINAL', 'DLC', 'GANGS'],
  LIB: ['COLLECTION', 'VOL2'],
  RED: ['SCOPE', 'SHEPARD', 'FERON', 'BONUS'],
};

export async function loadReferenceCases() {
  const cases = [];
  for (const [workId, suffixes] of Object.entries(citationIdsByWork)) {
    const work = getUniverseWork(workId);
    assert.equal(work.id, workId);
    const raw = await readFile(new URL(`../${work.catalogPath}`, import.meta.url));
    const catalogueSha256 = createHash('sha256').update(raw).digest('hex');
    assert.equal(catalogueSha256, UNIVERSE_SUMMARY.catalogDigests[work.catalogPath], `Registre ${workId} obsolète`);
    const catalogue = JSON.parse(raw);
    assert.equal(catalogue.id, workId);

    for (const suffix of suffixes) {
      const id = `${workId}-REF-${suffix}`;
      const matches = catalogue.entries.filter(entry => entry.id === id);
      assert.equal(matches.length, 1, id);
      const entry = matches[0];
      const { description: exactDescription, acceptance: exactCriterion, nature, sourceIds } = entry;
      const citation = /^Le dossier cite la source ([A-Z\d]+) et distingue cette information de toute règle de gameplay\.$/.exec(exactCriterion);
      assert.ok(citation && exactDescription.trim(), id);
      const sourceId = `${workId}-S-${citation[1]}`;
      assert.deepEqual(sourceIds, [sourceId], id);
      assert.equal(entry.priority, 'P0', id);
      assert.ok(['Établi', 'À vérifier'].includes(nature), id);
      assert.equal(entry.category, 'lore', id);
      assert.equal(entry.gameplay.trim(), '', id);

      const declared = catalogue.sources.filter(source => source.id === sourceId);
      assert.equal(declared.length, 1, sourceId);
      const matchesInGame = work.sources.filter(source => source.id === sourceId);
      assert.deepEqual(matchesInGame, declared, sourceId);
      const source = matchesInGame[0];
      for (const field of ['title', 'kind', 'scope', 'note']) assert.ok(source[field]?.trim(), `${sourceId} ${field}`);
      const address = new URL(source.url);
      assert.equal(address.protocol, 'https:', sourceId);
      assert.equal(address.username + address.password, '', sourceId);

      const record = getUniverseRecord(id);
      assert.deepEqual({
        catalogWorkId: record.catalogWorkId, description: record.description, status: record.status,
        nature: record.nature, sourceIds: record.sourceIds, playable: record.playable,
      }, { catalogWorkId: workId, description: exactDescription, status: entry.status, nature, sourceIds, playable: false }, id);
      assert.equal(record.provenance.catalogPath, work.catalogPath, id);
      cases.push({ id, workId, exactDescription, exactCriterion, nature, sourceIds, sourceId, source, catalogueSha256 });
    }
  }
  return cases;
}
