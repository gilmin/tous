import type { OrbitalBody } from "@/app/scene/types";
import { flattenDFS } from "@/app/scene/store/tree-ops";

// The sphere tree is stored verbatim as a JSONB blob (eng-review D2) — no flat
// nodes table, no parallel serialization. supabase-js handles JSON encoding for
// the jsonb column, so there is no hand-rolled stringify here; the tree object
// IS the stored shape. This module only owns the one derived value the sync
// layer must compute before each push.

// node_count is computed from the blob at push time (eng-review D8), not via a
// DB trigger. Counts every Body including Self; M4's discovery filter uses
// node_count >= 3. Reuses the canonical DFS walk so the count never drifts from
// the tree's real membership.
export function countNodes(tree: OrbitalBody): number {
  return flattenDFS(tree).length;
}
