"use client";

import { useEffect, useRef, useState } from "react";
import {
  beginSliderCoalesce,
  endSliderCoalesce,
  useSphereStore,
} from "./store/sphere-store";
import { selectBodyById } from "./store/tree-ops";
import { PLANET_SHAPES, type PlanetShape } from "../_components/Planet";
import type { OrbitalBody } from "./types";

// Appearance editors shown inside the EDIT form (#13). Every change flows
// through editBody → instant render + persist. Size/speed are drags, so they
// open a coalesce window (one undo entry per drag, #12); shape/color are
// single events.
function AppearanceControls({
  body,
  editBody,
}: {
  body: OrbitalBody;
  editBody: (id: string, patch: Partial<OrbitalBody>) => void;
}) {
  const labelColor = "rgba(255,255,255,0.6)";
  const controlBg = "rgba(255,255,255,0.08)";
  const controlBorder = "1px solid rgba(255,255,255,0.2)";
  const valueColor = "#f5f5f7";
  const hasOrbit = (body.orbitRadius ?? 0) > 0;

  // Collapse a pointer drag into one undo entry: open the coalesce window on
  // pointerdown, close it on the next global pointerup so it fires even when
  // the pointer is released off the slider.
  const startSliderDrag = () => {
    beginSliderCoalesce();
    const end = () => {
      endSliderCoalesce();
      window.removeEventListener("pointerup", end);
    };
    window.addEventListener("pointerup", end);
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  } as const;
  const tagStyle = {
    width: 34,
    textAlign: "left",
    fontSize: 11,
    color: labelColor,
    flexShrink: 0,
  } as const;
  const selectStyle = {
    flex: 1,
    fontFamily: "inherit",
    fontSize: 12,
    padding: "3px 6px",
    background: controlBg,
    border: controlBorder,
    borderRadius: 6,
    color: valueColor,
  } as const;

  return (
    <div style={{ marginTop: 12 }}>
      <label style={rowStyle}>
        <span style={tagStyle}>크기</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={body.size}
          onPointerDown={startSliderDrag}
          onChange={(e) => editBody(body.id, { size: Number(e.target.value) })}
          aria-label="크기"
          style={{ flex: 1 }}
        />
      </label>
      <label style={rowStyle}>
        <span style={tagStyle}>자전</span>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={body.selfRotation ?? 0}
          onPointerDown={startSliderDrag}
          onChange={(e) =>
            editBody(body.id, { selfRotation: Number(e.target.value) })
          }
          aria-label="자전 속도"
          style={{ flex: 1 }}
        />
      </label>
      {hasOrbit && (
        <>
          <label style={rowStyle}>
            <span style={tagStyle}>궤도</span>
            <input
              type="range"
              min={0.3}
              max={8}
              step={0.05}
              value={body.orbitRadius ?? 0}
              onPointerDown={startSliderDrag}
              onChange={(e) =>
                editBody(body.id, { orbitRadius: Number(e.target.value) })
              }
              aria-label="궤도 길이"
              style={{ flex: 1 }}
            />
          </label>
          <label style={rowStyle}>
            <span style={tagStyle}>공전</span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.05}
              value={body.orbitSpeed ?? 0}
              onPointerDown={startSliderDrag}
              onChange={(e) =>
                editBody(body.id, { orbitSpeed: Number(e.target.value) })
              }
              aria-label="공전 속도"
              style={{ flex: 1 }}
            />
          </label>
        </>
      )}
      <label style={rowStyle}>
        <span style={tagStyle}>모양</span>
        <select
          value={body.shape ?? "smooth"}
          onChange={(e) =>
            editBody(body.id, { shape: e.target.value as PlanetShape })
          }
          aria-label="모양"
          style={selectStyle}
        >
          {PLANET_SHAPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label style={rowStyle}>
        <span style={tagStyle}>색</span>
        <input
          type="color"
          value={body.color}
          onChange={(e) => editBody(body.id, { color: e.target.value })}
          aria-label="색"
          style={{
            flex: 1,
            height: 26,
            padding: 0,
            background: "transparent",
            border: controlBorder,
            borderRadius: 6,
            cursor: "pointer",
          }}
        />
      </label>
    </div>
  );
}

export function FocusPanel() {
  const focusedBody = useSphereStore((s) =>
    s.focusedId ? selectBodyById(s.tree, s.focusedId) : null,
  );
  const mode = useSphereStore((s) => s.mode);
  const setFocus = useSphereStore((s) => s.setFocus);
  const setMode = useSphereStore((s) => s.setMode);
  const editBody = useSphereStore((s) => s.editBody);
  const addChild = useSphereStore((s) => s.addChild);
  const deleteBody = useSphereStore((s) => s.deleteBody);
  const rootId = useSphereStore((s) => s.tree.id);
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

  const buttonBg = "rgba(255,255,255,0.14)";
  const buttonColor = "#f7f3ff";
  const inputBg = "rgba(255,255,255,0.08)";
  const inputBorder = "1px solid rgba(255,255,255,0.2)";

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
        background: "rgba(38,25,72,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: 24,
        color: "#f7f3ff",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        boxShadow: "0 10px 30px rgba(15,8,40,0.5)",
      }}
    >
      {isEditing ? (
        <>
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
          <AppearanceControls body={focusedBody} editBody={editBody} />
        </>
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
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 700,
                background: buttonBg,
                border: "none",
                borderRadius: 999,
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
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 700,
                background: buttonBg,
                border: "none",
                borderRadius: 999,
                color: buttonColor,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              + 자식
            </button>
            {focusedBody.id !== rootId && (
              <button
                onClick={() => deleteBody(focusedBody.id)}
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
                삭제
              </button>
            )}
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
          color: "rgba(255,255,255,0.5)",
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
