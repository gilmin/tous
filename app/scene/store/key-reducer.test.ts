import { describe, it, expect } from "vitest";
import { keyReducer } from "./key-reducer";

describe("keyReducer — ADD mode", () => {
  it("Enter exits add (commit handled by panel)", () => {
    expect(keyReducer({ mode: "add", hasFocus: true }, { key: "Enter" })).toEqual(
      { type: "exit-add" },
    );
  });
  it("Escape exits add", () => {
    expect(
      keyReducer({ mode: "add", hasFocus: true }, { key: "Escape" }),
    ).toEqual({ type: "exit-add" });
  });
  it("other keys are noop in add", () => {
    expect(keyReducer({ mode: "add", hasFocus: true }, { key: "a" })).toEqual({
      type: "noop",
    });
  });
});

describe("keyReducer — NORMAL mode", () => {
  it("Escape with focus clears the focus", () => {
    expect(
      keyReducer({ mode: "normal", hasFocus: true }, { key: "Escape" }),
    ).toEqual({ type: "clear-focus" });
  });

  it("Escape without focus is a noop", () => {
    expect(
      keyReducer({ mode: "normal", hasFocus: false }, { key: "Escape" }),
    ).toEqual({ type: "noop" });
  });

  it("ArrowLeft / ArrowRight drive DFS nav (#10)", () => {
    expect(
      keyReducer({ mode: "normal", hasFocus: true }, { key: "ArrowLeft" }),
    ).toEqual({ type: "nav-prev" });
    expect(
      keyReducer({ mode: "normal", hasFocus: true }, { key: "ArrowRight" }),
    ).toEqual({ type: "nav-next" });
  });

  it("nav works even without a current focus (starts from an end)", () => {
    expect(
      keyReducer({ mode: "normal", hasFocus: false }, { key: "ArrowRight" }),
    ).toEqual({ type: "nav-next" });
    expect(
      keyReducer({ mode: "normal", hasFocus: false }, { key: "ArrowLeft" }),
    ).toEqual({ type: "nav-prev" });
  });

  it("Cmd+Z / Ctrl+Z → tree-undo (#12)", () => {
    expect(
      keyReducer({ mode: "normal", hasFocus: false }, { key: "z", metaKey: true }),
    ).toEqual({ type: "tree-undo" });
    expect(
      keyReducer({ mode: "normal", hasFocus: false }, { key: "z", ctrlKey: true }),
    ).toEqual({ type: "tree-undo" });
  });

  it("Cmd+Shift+Z / Ctrl+Y → tree-redo (#12)", () => {
    expect(
      keyReducer(
        { mode: "normal", hasFocus: false },
        { key: "z", metaKey: true, shiftKey: true },
      ),
    ).toEqual({ type: "tree-redo" });
    // Shift produces an uppercase key — the reducer is case-insensitive.
    expect(
      keyReducer(
        { mode: "normal", hasFocus: false },
        { key: "Z", ctrlKey: true, shiftKey: true },
      ),
    ).toEqual({ type: "tree-redo" });
    expect(
      keyReducer({ mode: "normal", hasFocus: false }, { key: "y", ctrlKey: true }),
    ).toEqual({ type: "tree-redo" });
  });

  it("a bare z (no modifier) is a noop", () => {
    expect(
      keyReducer({ mode: "normal", hasFocus: false }, { key: "z" }),
    ).toEqual({ type: "noop" });
  });
});

describe("keyReducer — EDIT mode (mode owns the keyboard)", () => {
  it("Escape exits edit", () => {
    expect(
      keyReducer({ mode: "edit", hasFocus: true }, { key: "Escape" }),
    ).toEqual({ type: "exit-edit" });
  });

  it("Enter exits edit", () => {
    expect(
      keyReducer({ mode: "edit", hasFocus: true }, { key: "Enter" }),
    ).toEqual({ type: "exit-edit" });
  });

  it("ArrowLeft / ArrowRight stay with the text caret (D10)", () => {
    expect(
      keyReducer({ mode: "edit", hasFocus: true }, { key: "ArrowLeft" }),
    ).toEqual({ type: "noop" });
    expect(
      keyReducer({ mode: "edit", hasFocus: true }, { key: "ArrowRight" }),
    ).toEqual({ type: "noop" });
  });

  it("Cmd+Z / Ctrl+Z stay with the input history (D11)", () => {
    expect(
      keyReducer(
        { mode: "edit", hasFocus: true },
        { key: "z", metaKey: true },
      ),
    ).toEqual({ type: "noop" });
    expect(
      keyReducer(
        { mode: "edit", hasFocus: true },
        { key: "z", ctrlKey: true },
      ),
    ).toEqual({ type: "noop" });
  });

  it("Cmd+Shift+Z stays with the input history (D11)", () => {
    expect(
      keyReducer(
        { mode: "edit", hasFocus: true },
        { key: "z", metaKey: true, shiftKey: true },
      ),
    ).toEqual({ type: "noop" });
  });

  it("typing keys are a noop (the input owns them)", () => {
    expect(
      keyReducer({ mode: "edit", hasFocus: true }, { key: "a" }),
    ).toEqual({ type: "noop" });
    expect(
      keyReducer({ mode: "edit", hasFocus: true }, { key: " " }),
    ).toEqual({ type: "noop" });
  });
});
