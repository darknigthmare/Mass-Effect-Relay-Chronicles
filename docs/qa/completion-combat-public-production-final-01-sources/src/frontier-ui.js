// Keep the visible prompt and the keyboard/touch action on the same target.
export function getExploreInteraction({ vehicle, poi, position } = {}) {
  if (vehicle?.id === 'mako' && vehicle.mounted) {
    return { kind: 'vehicle', id: 'mako:leave', label: 'Descendre du M35 Mako' };
  }
  const vehicleReady = vehicle?.id === 'mako' && vehicle.available === true
    && Number.isFinite(vehicle.distance) && vehicle.distance >= 0;
  const poiDistance = poi && Number.isFinite(position?.x) && Number.isFinite(position?.z)
    && Number.isFinite(poi.x) && Number.isFinite(poi.z)
    ? Math.hypot(poi.x - position.x, poi.z - position.z) : Infinity;
  if (vehicleReady && (!poi || vehicle.distance < poiDistance)) {
    return { kind: 'vehicle', id: 'mako:board', label: 'Monter à bord du M35 Mako' };
  }
  return poi ? { kind: 'poi', id: poi.id, label: poi.label } : null;
}
