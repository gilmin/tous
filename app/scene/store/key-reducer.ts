import type { Mode } from "./sphere-store";

export type KeyAction =
  | { type: "noop" }
  | { type: "exit-edit" }
  | { type: "exit-add" }
  | { type: "clear-focus" }
  | { type: "nav-prev" }
  | { type: "nav-next" }
  | { type: "tree-undo" }
  | { type: "tree-redo" };

export type KeyContext = {
  mode: Mode;
  hasFocus: boolean;
};

export type KeyInput = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
};

const NOOP: KeyAction = { type: "noop" };

// Pure dispatcher: given (mode, focus, key) → which action should fire.
// Encapsulates the "mode owns the keyboard" contract (ADR-0002 D9/D10/D11)
// so it can be unit-tested without DOM.
export function keyReducer(ctx: KeyContext, input: KeyInput): KeyAction {
  if (ctx.mode === "edit") {
    // EDIT mode: the input owns the keyboard. Only Enter/Escape exit edit;
    // ←/→ stay with the text caret (D10), Cmd/Ctrl+Z stays with the input
    // history (D11), everything else is a literal keystroke for the input.
    if (input.key === "Escape" || input.key === "Enter") {
      return { type: "exit-edit" };
    }
    return NOOP;
  }
  if (ctx.mode === "add") {
    // ADD mode mirrors EDIT: the input owns the keyboard. Only Enter (commit,
    // handled by the panel which holds the draft) and Escape (cancel) exit;
    // everything else is a literal keystroke for the input.
    if (input.key === "Escape" || input.key === "Enter") {
      return { type: "exit-add" };
    }
    return NOOP;
  }
  if (ctx.mode === "normal") {
    if (input.key === "Escape" && ctx.hasFocus) {
      return { type: "clear-focus" };
    }
    // #10 will return nav-prev / nav-next here; #12 will return tree-undo /
    // tree-redo. Until then, leave NORMAL keys as noop.
    return NOOP;
  }
  return NOOP;
}
