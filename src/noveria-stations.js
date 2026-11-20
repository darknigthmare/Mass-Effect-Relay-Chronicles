import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { getMissionProgress, MISSION_DEFINITIONS } from './mission-progress.js';

const steps = MISSION_DEFINITIONS.noveria.steps;
export const MIRA_STATUS = Object.freeze({
  locked: Object.freeze({ label: 'Hors circuit', color: 0x425267 }),
  pending: Object.freeze({ label: 'À réparer', color: 0xffa94e }),
  online: Object.freeze({ label: 'En service', color: 0x72f0c9 }),
  unknown: Object.freeze({ label: 'État non consigné', color: 0x95a4bb }),
});

export function getMiraStations(state) {
  const mission = getMissionProgress(state, 'noveria');
  return steps.map((step, index) => ({
    id: step.id, label: step.label,
    status: mission?.status === 'legacy-complete' ? 'unknown'
      : mission?.steps[index].done ? 'online'
        : mission?.status === 'active' ? 'pending' : 'locked',
  }));
}

/** Low equipment panels sit beside the existing walkable station markers. */
export function installMiraPanels(stage) {
  const bodyMaterial = new MeshStandardMaterial({ color: 0x44566a, roughness: .72, metalness: .36 });
  const body = new BoxGeometry(1.65, .36, 1.15);
  const window = new BoxGeometry(1.32, .09, .75);
  return steps.map(step => {
    const panel = new Group();
    panel.name = `mira-panel:${step.id}`;
    panel.userData.keep = true;
    panel.position.set(step.x + 1.55, .04, step.z - .75);
    const caseMesh = new Mesh(body, bodyMaterial);
    caseMesh.position.y = .18;
    const lamp = new Mesh(window, new MeshBasicMaterial({ color: MIRA_STATUS.locked.color, toneMapped: false }));
    lamp.position.y = .37;
    panel.add(caseMesh, lamp);
    stage.add(panel);
    return { id: step.id, lamp };
  });
}

export function updateMiraPanels(panels = [], stations = []) {
  for (const panel of panels) {
    const status = stations.find(station => station.id === panel.id)?.status || 'locked';
    panel.lamp.material.color.setHex(MIRA_STATUS[status].color);
  }
}
