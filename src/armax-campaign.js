import { ARMAX_FIGHTERS } from './armax-data.js';
import { ARMAX_BOSSES, ARMAX_ENEMIES, ARMAX_CAMPAIGNS, ARMAX_STAGE_STORIES } from './armax-expansion-data.js';

// Separate local key. This module never reads or writes the ME1 or Chronicle saves.
export const ARMAX_CAMPAIGN_KEY = 'relay.armax.nacre.campaign.v1';
const fighterById = id => ARMAX_FIGHTERS.find(item => item.id === id);
const campaignById = id => ARMAX_CAMPAIGNS.find(item => item.fighterId === id);

export function createArmaxCampaign(fighterId) {
  if (!fighterById(fighterId) || !campaignById(fighterId)) throw new TypeError('Route Nacre inconnue');
  return { version: 1, fighterId, index: 0, status: 'ready', cleared: [], attempts: 0 };
}

export function armaxCampaignEncounter(campaign, index = campaign.index) {
  const route = campaignById(campaign.fighterId);
  if (!route || !Number.isInteger(index) || index < 0 || index >= route.stageIds.length) return null;
  const stageId = route.stageIds[index], stage = ARMAX_STAGE_STORIES.find(item => item.id === stageId);
  const rival = index === route.rivalIndex;
  // Halek's base visual was not delivered. This is an explicitly different
  // encounter, with its own opponent, name, art and completion identifier.
  const outpost = !rival && stageId === 'nacre_stage_03';
  const opponent = rival ? fighterById(route.rivalId) : outpost ? ARMAX_ENEMIES.find(item => item.id === 'nacre_enemy_05') : ARMAX_BOSSES.find(item => item.id === stage.bossId);
  return { index, stageId, stage, opponent, rival, outpost,
    title: rival ? 'Désaccord de méthode' : outpost ? 'Franchir l’avant-poste' : opponent.name,
    paragraphs: index === 0 ? [route.intro, opponent.narrativeRole, ...(outpost ? ['Le sapeur tient l’accès de l’annexe. Cette étape ne constitue pas une confrontation avec Halek Orr.'] : [])] : rival ? [route.rivalReason, ...route.rivalDialogue, route.rivalOutcome] : outpost ? ['Le sapeur tient l’accès de l’annexe avec ses balises. Franchir ce poste ouvre la route ; Halek Orr n’est pas affronté ici.'] : [stage.brief, opponent.narrativeRole],
    victory: rival ? route.rivalOutcome : outpost ? 'L’avant-poste est franchi. Halek Orr n’a pas été affronté.' : opponent.victory,
    scope: route.scope,
  };
}

export function beginArmaxCampaignBattle(campaign) {
  if (!['ready', 'defeat'].includes(campaign.status) || !armaxCampaignEncounter(campaign)) return null;
  campaign.status = 'in-battle';
  campaign.attempts++;
  return `${campaign.fighterId}:${campaign.index}:${campaign.attempts}`;
}

export function commitArmaxCampaignResult(campaign, token, result) {
  if (campaign.status !== 'in-battle' || token !== `${campaign.fighterId}:${campaign.index}:${campaign.attempts}` || !result || ![0, 1].includes(result.winner) || !['KO_final', 'temps_ecoule'].includes(result.reason)) return false;
  if (result.winner === 1) {
    campaign.status = 'defeat';
    return true;
  }
  const encounter = armaxCampaignEncounter(campaign);
  if (!encounter) return false;
  campaign.cleared.push(encounter.opponent.id);
  campaign.index++;
  campaign.status = campaign.index === 8 ? 'completed' : 'ready';
  return true;
}

export function armaxCampaignEnding(campaign) {
  if (campaign.status !== 'completed' || campaign.index !== 8) return null;
  return campaignById(campaign.fighterId).ending;
}

export function parseArmaxCampaignSave(text) {
  try {
    if (typeof text !== 'string' || text.length > 12000) return null;
    const data = JSON.parse(text);
    if (!data || data.version !== 1 || !fighterById(data.fighterId) || !Number.isInteger(data.index) || data.index < 0 || data.index > 8 || !['ready', 'in-battle', 'defeat', 'completed'].includes(data.status) || !Number.isSafeInteger(data.attempts) || data.attempts < data.index || data.attempts > 100000 || !Array.isArray(data.cleared) || data.cleared.length !== data.index) return null;
    if ((data.status === 'completed') !== (data.index === 8)) return null;
    const clean = createArmaxCampaign(data.fighterId);
    for (let i = 0; i < data.index; i++) if (data.cleared[i] !== armaxCampaignEncounter(clean, i).opponent.id) return null;
    Object.assign(clean, { index: data.index, status: data.status === 'in-battle' ? 'ready' : data.status, attempts: data.attempts, cleared: [...data.cleared] });
    return clean;
  } catch { return null; }
}

export function loadArmaxCampaign(storage) {
  try { return parseArmaxCampaignSave(storage.getItem(ARMAX_CAMPAIGN_KEY)); } catch { return null; }
}

export function saveArmaxCampaign(storage, campaign) {
  try {
    const text = JSON.stringify(campaign);
    if (!parseArmaxCampaignSave(text)) return false;
    storage.setItem(ARMAX_CAMPAIGN_KEY, text);
    return true;
  } catch { return false; }
}
