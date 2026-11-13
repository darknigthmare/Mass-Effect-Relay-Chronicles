import test from 'node:test';
import assert from 'node:assert/strict';
import { nearbyConversationOperation } from '../src/horizon-ui.js';

test('a nearby NPC operation contact stays accessible without activating a distant battle', () => {
  const npc = { operationId:'feros-varrens' }, contact = { x:2, z:3 };
  const hunt = { operationId:'feros-varrens', stepId:'hunt', x:20, z:-45 };
  const report = { operationId:'feros-varrens', stepId:'report', x:3.5, z:3 };
  assert.equal(nearbyConversationOperation(npc, contact, [hunt]), null);
  assert.equal(nearbyConversationOperation(npc, contact, [hunt, report]), report);
  assert.equal(nearbyConversationOperation(npc, contact, [{ ...report, operationId:'other' }]), null);
  assert.equal(nearbyConversationOperation(npc, contact, [{ ...report, x:NaN }]), null);
});
