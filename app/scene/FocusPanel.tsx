"use client";

import { useEffect, useRef, useState } from "react";
import { useSphereStore } from "./store/sphere-store";
import { selectBodyById } from "./store/tree-ops";
import type { SceneVariant } from "./types";

export function FocusPanel({ variant }: { variant: SceneVariant }) {
  const focusedBody = useSphereStore((s) =>
    s.focusedId ? selectBodyById(s.tree, s.focusedId) : null,
  );
  const mode = useSphereStore((s) => s.mode);
  const setFocus = useSphereStore((s) => s.setFocus);
  const setMode = useSphereStore((s) => s.setMode);
  const editBody = useSphereStore((s) => s.editBody);
  const addChild = useSphereStore((s) => s.addChild);
  const inputRef = useRef<HTMLInputElement>(null);
  const [addDraft, setAddDraft] = useState("");

  const isEditing = mode === "edit" && focusedBody !== null;
  const isAdding = mode === "add" && focusedBody !== null;

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  // Reset the draft each time the user enters ADD mode (D9: no carryover).
  useEffect(() => {
    if (isAdding) setAddDraft("");
  }, [isAdding]);

  const focusedId = focusedBody?.id;
  const commitAdd = () => {
    if (!focusedId) return;
    const name = addDraft.trim();
    if (name) addChild(focusedId, name);
    setMode("normal");
  };

  if (!focusedBody) return null;

  const isMono = variant === "mono";
  const buttonBg = isMono ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)";
  const buttonColor = isMono ? "#1a1a1a" : "#f5f5f7";
  const inputBg = isMono ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)";
  const inputBorder = isMono
    ? "1px solid rgba(0,0,0,0.15)"
    : "1px solid rgba(255,255,255,0.2)";

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 36,
        transform: "translateX(-50%)",
        zIndex: 30,
        padding: "14px 22px",
        minWidth: 220,
        textAlign: "center",
        background: isMono ? "rgba(255,255,255,0.85)" : "rgba(15,15,20,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: isMono
          ? "1px solid rgba(0,0,0,0.08)"
          : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        color: isMono ? "#1a1a1a" : "#f5f5f7",
        fontFamily: "system-ui, sans-serif",
        boxShadow: isMono
          ? "0 8px 24px rgba(0,0,0,0.06)"
          : "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          autoFocus
          value={focusedBody.label ?? ""}
          onChange={(e) =>
            editBody(focusedBody.id, { label: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.preventDefault();
              setMode("normal");
            }
          }}
          aria-label="이름 편집"
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.01em",
            textAlign: "center",
            width: "100%",
            padding: "4px 8px",
            background: inputBg,
            border: inputBorder,
            borderRadius: 8,
            color: buttonColor,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      ) : (
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.01em" }}>
          {focusedBody.label}
        </div>
      )}
      {isAdding ? (
        <input
          autoFocus
          value={addDraft}
          onChange={(e) => setAddDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitAdd();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setMode("normal");
            }
          }}
          placeholder="새 자식 이름"
          aria-label="자식 이름 입력"
          style={{
            marginTop: 10,
            fontSize: 15,
            fontWeight: 500,
            textAlign: "center",
            width: "100%",
            padding: "4px 8px",
            background: inputBg,
            border: inputBorder,
            borderRadius: 8,
            color: buttonColor,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      ) : (
        !isEditing && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setMode("edit")}
              style={{
                padding: "4px 12px",
                fontSize: 12,
                background: buttonBg,
                border: "none",
                borderRadius: 6,
                color: buttonColor,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              편집
            </button>
            <button
              onClick={() => setMode("add")}
              style={{
                padding: "4px 12px",
                fontSize: 12,
                background: buttonBg,
                border: "none",
                borderRadius: 6,
                color: buttonColor,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              + 자식
            </button>
          </div>
        )
      )}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          opacity: 0.55,
        }}
      >
        {isEditing
          ? "Enter 또는 ESC로 확정"
          : isAdding
            ? "Enter로 추가, ESC로 취소"
            : "빈 공간 클릭 또는 ESC로 닫기"}
      </div>
      <button
        onClick={() => {
          setMode("normal");
          setFocus(null);
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          width: 24,
          height: 24,
          padding: 0,
          background: "transparent",
          border: "none",
          color: isMono ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
        }}
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}
