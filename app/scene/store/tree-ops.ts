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

// Returns the tree unchanged if id is missing, so callers can detect no-ops
// by reference equality. Unchanged subtrees keep their refs — required for
// React.memo + per-node selector to skip rerenders (ADR-0002 D7).
export function editBody(
  tree: OrbitalBody,
  id: string,
  patch: Partial<OrbitalBody>,
): OrbitalBody {
  if (tree.id === id) return { ...tree, ...patch };
  if (!tree.children) return tree;
  let changed = false;
  const nextChildren = tree.children.map((child) => {
    const next = editBody(child, id, patch);
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...tree, children: nextChildren } : tree;
}
