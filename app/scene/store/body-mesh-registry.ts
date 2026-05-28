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
