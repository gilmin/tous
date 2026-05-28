import type { OrbitalBody } from "../types";

export function selectBodyById(
  tree: OrbitalBody,
  id: string,
): OrbitalBody | null {
  if (tree.id === id) return tree;
  if (!tree.children) return null;
  for (const child of tree.children) {
    const found = selectBodyById(child, id);
    if (found) return found;
  }
  return null;
}

export function hasBodyId(tree: OrbitalBody, id: string): boolean {
  return selectBodyById(tree, id) !== null;
}
