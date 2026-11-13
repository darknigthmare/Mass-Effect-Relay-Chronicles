// Navigation for the larger authored ground mask. Other legacy tableaux keep
// their existing pathfinder; no combat or progression state is owned here.
export function findLevelPath({ bounds, start, destination, isWalkable, step = .75, maxVisits } = {}) {
  if (!bounds || !start || !destination || typeof isWalkable !== 'function'
    || ![start.x, start.z, destination.x, destination.z, step].every(Number.isFinite) || step <= 0
    || !isWalkable(start.x, start.z) || !isWalkable(destination.x, destination.z)) return null;
  const columns = Math.floor((bounds.maxX - bounds.minX) / step) + 1;
  const rows = Math.floor((bounds.maxZ - bounds.minZ) / step) + 1, total = columns * rows;
  if (!Number.isSafeInteger(total) || total < 1 || total > 100000) return null;
  const limit = Math.min(total, maxVisits ?? total);
  const costs = new Float64Array(total).fill(Infinity), previous = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total), walk = new Uint8Array(total), heap = [];
  const point = key => ({ x: bounds.minX + key % columns * step, z: bounds.minZ + Math.floor(key / columns) * step });
  const grid = p => [Math.round((p.x - bounds.minX) / step), Math.round((p.z - bounds.minZ) / step)];
  const keyAt = (x, z) => x < 0 || z < 0 || x >= columns || z >= rows ? -1 : z * columns + x;
  const allowed = key => {
    if (key < 0) return false;
    if (!walk[key]) { const p = point(key); walk[key] = isWalkable(p.x, p.z) ? 1 : 2; }
    return walk[key] === 1;
  };
  const clearSegment = (a, b) => {
    const count = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / .2));
    for (let i = 1; i <= count; i++) if (!isWalkable(a.x + (b.x - a.x) * i / count, a.z + (b.z - a.z) * i / count)) return false;
    return true;
  };
  const less = (a, b) => a.score < b.score || a.score === b.score && a.distance < b.distance;
  const push = node => {
    heap.push(node); let i = heap.length - 1;
    while (i > 0) { const parent = (i - 1) >> 1; if (!less(node, heap[parent])) break; heap[i] = heap[parent]; i = parent; }
    heap[i] = node;
  };
  const pop = () => {
    const first = heap[0], last = heap.pop();
    if (heap.length) { let i = 0; while (i * 2 + 1 < heap.length) {
      let child = i * 2 + 1; if (child + 1 < heap.length && less(heap[child + 1], heap[child])) child++;
      if (!less(heap[child], last)) break; heap[i] = heap[child]; i = child;
    } heap[i] = last; }
    return first;
  };
  const [sx, sz] = grid(start), starts = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const key = keyAt(sx + dx, sz + dz); if (!allowed(key)) continue;
    const p = point(key); if (clearSegment(start, p)) starts.push({ key, distance: Math.hypot(p.x - start.x, p.z - start.z) });
  }
  starts.sort((a, b) => a.distance - b.distance);
  if (!starts.length) return null;
  const startKey = starts[0].key, heuristic = key => { const p = point(key); return Math.hypot(p.x - destination.x, p.z - destination.z); };
  costs[startKey] = 0; push({ key: startKey, cost: 0, distance: heuristic(startKey), score: heuristic(startKey) });
  let found = -1, visited = 0;
  while (heap.length && visited < limit) {
    const current = pop(), key = current.key; if (closed[key] || current.cost !== costs[key]) continue;
    closed[key] = 1; visited++;
    const p = point(key);
    if (heuristic(key) <= step * 1.5 && clearSegment(p, destination)) { found = key; break; }
    const x = key % columns, z = Math.floor(key / columns);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const next = keyAt(x + dx, z + dz);
      if (!allowed(next) || closed[next] || dx && dz && (!allowed(keyAt(x + dx, z)) || !allowed(keyAt(x, z + dz)))) continue;
      const q = point(next); if (!clearSegment(p, q)) continue;
      const cost = current.cost + step * Math.hypot(dx, dz); if (cost >= costs[next]) continue;
      costs[next] = cost; previous[next] = key;
      const distance = heuristic(next); push({ key: next, cost, distance, score: cost + distance });
    }
  }
  if (found < 0) return null;
  const result = []; let key = found;
  while (key !== startKey) { result.unshift(point(key)); key = previous[key]; if (key < 0) return null; }
  const first = point(startKey);
  if (Math.hypot(first.x - start.x, first.z - start.z) > .02) result.unshift(first);
  if (!result.length || Math.hypot(result.at(-1).x - destination.x, result.at(-1).z - destination.z) > .01) result.push({ x: destination.x, z: destination.z });
  return result;
}
