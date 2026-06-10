import type { OrbitalBody } from "../types";
import { flattenDFS, nextBodyId, prevBodyId } from "./tree-ops";

// Maps a keyboard event code to a focus change for /discover's within-sphere
// navigation. ArrowRight/ArrowLeft cycle focus through the sphere's bodies in
// DFS order (circular, reusing the editor's nextBodyId/prevBodyId); Escape
// clears focus. Returns null when the key isn't a focus key, or when Escape is
// pressed with nothing focused — the caller should not preventDefault in that
// case. Otherwise returns the focusedId to apply (which may be null for Escape).
export type FocusKeyResult = { focusId: string | null } | null;

export function focusForKey(
  tree: OrbitalBody,
  focusedId: string | null,
  code: string,
): FocusKeyResult {
  switch (code) {
    case "ArrowRight":
      return { focusId: nextBodyId(flattenDFS(tree), focusedId) };
    case "ArrowLeft":
      return { focusId: prevBodyId(flattenDFS(tree), focusedId) };
    case "Escape":
      return focusedId === null ? null : { focusId: null };
    default:
      return null;
  }
}
