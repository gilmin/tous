import type * as THREE from "three";

const registry = new Map<string, THREE.Mesh>();

export function registerBodyMesh(id: string, mesh: THREE.Mesh): void {
  registry.set(id, mesh);
}

export function unregisterBodyMesh(id: string, mesh: THREE.Mesh): void {
  if (registry.get(id) === mesh) registry.delete(id);
}

export function getBodyMesh(id: string): THREE.Mesh | undefined {
  return registry.get(id);
}

// Drop every registered mesh. /discover calls this at a warp swap: all spheres
// share the root id "self" (and may share child ids), so stale entries from the
// outgoing sphere would otherwise let the camera target a unmounted mesh. The
// swap happens behind a blackout (ADR-0003 D3) so no two sphere meshes coexist.
export function clearBodyMeshRegistry(): void {
  registry.clear();
}
