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

// Flattens the tree into DFS pre-order (a parent before its children, children
// left-to-right). This is the canonical Body ordering for keyboard nav (#10):
// ←/→ walk this list. Self is always index 0.
export function flattenDFS(tree: OrbitalBody): OrbitalBody[] {
  const out: OrbitalBody[] = [tree];
  if (tree.children) {
    for (const child of tree.children) out.push(...flattenDFS(child));
  }
  return out;
}

// Circular neighbour lookup over a flattened Body list. Wraps at both ends
// (last → first, first → last). When currentId is not in the list (e.g. nothing
// focused yet), nav starts at an end: next → first, prev → last. Returns null
// only for an empty list (which never happens — Self is always present).
export function nextBodyId(
  flat: OrbitalBody[],
  currentId: string | null,
): string | null {
  if (flat.length === 0) return null;
  const idx = flat.findIndex((b) => b.id === currentId);
  if (idx === -1) return flat[0].id;
  return flat[(idx + 1) % flat.length].id;
}

export function prevBodyId(
  flat: OrbitalBody[],
  currentId: string | null,
): string | null {
  if (flat.length === 0) return null;
  const idx = flat.findIndex((b) => b.id === currentId);
  if (idx === -1) return flat[flat.length - 1].id;
  return flat[(idx - 1 + flat.length) % flat.length].id;
}

// Child size shrinks toward the parent but never collapses (ADR-0002 D8).
// Depth is unbounded; this just keeps deep descendants visible.
export function childSize(parentSize: number): number {
  return Math.max(0.05, parentSize * 0.6);
}

// Appends newBody under parentId, structural-sharing every untouched subtree.
// Returns the same tree reference when parentId is missing (ADR-0002 D7),
// mirroring editBody.
export function addChild(
  tree: OrbitalBody,
  parentId: string,
  newBody: OrbitalBody,
): OrbitalBody {
  if (tree.id === parentId) {
    return { ...tree, children: [...(tree.children ?? []), newBody] };
  }
  if (!tree.children) return tree;
  let changed = false;
  const nextChildren = tree.children.map((child) => {
    const next = addChild(child, parentId, newBody);
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...tree, children: nextChildren } : tree;
}

// Removes the body with the given id and its entire subtree (no orphans),
// structural-sharing every untouched subtree. Returns the same tree reference
// when id is missing or refers to the root — the root (Self) has no parent to
// detach from and is undeletable (CONTEXT.md); Self is also guarded at the
// store reducer so no code path can remove it.
export function deleteBody(tree: OrbitalBody, id: string): OrbitalBody {
  if (tree.id === id) return tree;
  if (!tree.children) return tree;
  const filtered = tree.children.filter((child) => child.id !== id);
  if (filtered.length !== tree.children.length) {
    return { ...tree, children: filtered };
  }
  let changed = false;
  const nextChildren = tree.children.map((child) => {
    const next = deleteBody(child, id);
    if (next !== child) changed = true;
    return next;
  });
  return changed ? { ...tree, children: nextChildren } : tree;
}
