"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useKeyboardInset } from "../_components/keyboard-inset";
import { useCoarsePointer } from "../_components/useCoarsePointer";
import {
  beginSliderCoalesce,
  endSliderCoalesce,
  useUniverseStore,
} from "./store/universe-store";
import { clampPanelOffset } from "./panel-drag";
import { selectBodyById } from "./store/tree-ops";
import { PLANET_SHAPES, type PlanetShape } from "../_components/Planet";
import {
  PATTERN_LABELS,
  PLANET_PATTERNS,
  derivePattern,
  type PlanetPattern,
} from "../_components/planet-pattern";
import type { OrbitalBody } from "./types";

// Appearance editors shown inside the EDIT form (#13). Every change flows
// through editBody → instant render + persist. Size/speed are drags, so they
// open a coalesce window (one undo entry per drag, #12); shape/color are
// single events.
function AppearanceControls({
  body,
  editBody,
  isRoot,
}: {
  body: OrbitalBody;
  editBody: (id: string, patch: Partial<OrbitalBody>) => void;
  isRoot: boolean;
}) {
  const labelColor = "rgba(255,255,255,0.6)";
  const controlBg = "rgba(255,255,255,0.08)";
  const controlBorder = "1px solid rgba(255,255,255,0.2)";
  const valueColor = "#f5f5f7";
  const hasOrbit = (body.orbitRadius ?? 0) > 0;
  // Mirror the rendered pattern: when `pattern` is unset the body shows an
  // id-derived one, so display that rather than a misleading default.
  const effectivePattern = derivePattern(
    body.id,
    body.color,
    body.pattern,
    body.patternColor,
  ).pattern;

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
  // The native option popup is an OS layer — it doesn't composite over the
  // translucent panel, so a solid dark bg + light text keeps it readable
  // (matching the nav toggle tone) instead of the browser's white default.
  const optionStyle = {
    background: "#2a1d4d",
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
            <option key={s} value={s} style={optionStyle}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {!isRoot && (
        <label style={rowStyle}>
          <span style={tagStyle}>무늬</span>
          <select
            value={effectivePattern}
            onChange={(e) =>
              editBody(body.id, { pattern: e.target.value as PlanetPattern })
            }
            aria-label="무늬"
            style={selectStyle}
          >
            {PLANET_PATTERNS.map((p) => (
              <option key={p} value={p} style={optionStyle}>
                {PATTERN_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      )}
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
  const focusedBody = useUniverseStore((s) =>
    s.focusedId ? selectBodyById(s.tree, s.focusedId) : null,
  );
  const mode = useUniverseStore((s) => s.mode);
  const setFocus = useUniverseStore((s) => s.setFocus);
  const setMode = useUniverseStore((s) => s.setMode);
  const editBody = useUniverseStore((s) => s.editBody);
  const addChild = useUniverseStore((s) => s.addChild);
  const deleteBody = useUniverseStore((s) => s.deleteBody);
  const rootId = useUniverseStore((s) => s.tree.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [addDraft, setAddDraft] = useState("");
  // Lift the panel above the soft keyboard while an input is focused (U4).
  const kbInset = useKeyboardInset();
  // On touch the editor shows a ←/→ focus-nav row at the bottom; sit above it.
  const coarse = useCoarsePointer();

  // Draggable panel (round-5 item 2). `offset` is added on top of the base
  // transform; a drag starts only on the panel's non-interactive area so it never
  // steals pointerdown from inputs/sliders/buttons/×. Re-focusing a body (id
  // change) snaps it back to the default position.
  const panelRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    zeroRect: { left: number; top: number; width: number; height: number };
  } | null>(null);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [focusedBody?.id]);

  const onPanelPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, button, select, textarea, a")) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
      // The measured rect includes the live offset; subtract it for the
      // zero-offset rect that clampPanelOffset expects.
      zeroRect: {
        left: rect.left - offset.x,
        top: rect.top - offset.y,
        width: rect.width,
        height: rect.height,
      },
    };
    setDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPanelPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const raw = {
      x: d.baseX + (e.clientX - d.startX),
      y: d.baseY + (e.clientY - d.startY),
    };
    setOffset(
      clampPanelOffset(raw, d.zeroRect, {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }),
    );
  };

  const onPanelPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    panelRef.current?.releasePointerCapture(e.pointerId);
  };

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
  // One shared style for 편집 / + 자식 / 삭제 so they match (nowrap keeps the
  // Korean labels horizontal; flexShrink:0 stops the panel squeezing them).
  const panelBtn: CSSProperties = {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 700,
    background: buttonBg,
    border: "none",
    borderRadius: 999,
    color: buttonColor,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  const inputBg = "rgba(255,255,255,0.08)";
  const inputBorder = "1px solid rgba(255,255,255,0.2)";

  return (
    <div
      ref={panelRef}
      onPointerDown={onPanelPointerDown}
      onPointerMove={onPanelPointerMove}
      onPointerUp={onPanelPointerUp}
      style={{
        position: "fixed",
        left: "50%",
        bottom: coarse
          ? "calc(84px + env(safe-area-inset-bottom))"
          : "calc(36px + env(safe-area-inset-bottom))",
        transform: `translateX(-50%) translateY(-${
          isEditing || isAdding ? kbInset : 0
        }px) translate(${offset.x}px, ${offset.y}px)`,
        // No easing while dragging so the panel tracks the finger 1:1; restore it
        // afterwards so the keyboard-lift and re-focus snap-back stay smooth.
        transition: dragging ? "none" : "transform 0.18s ease",
        cursor: dragging ? "grabbing" : "move",
        touchAction: "none",
        zIndex: 30,
        padding: "14px 22px",
        minWidth: 220,
        maxWidth: "calc(100vw - 24px)",
        boxSizing: "border-box",
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
          <AppearanceControls
            body={focusedBody}
            editBody={editBody}
            isRoot={focusedBody.id === rootId}
          />
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
              style={panelBtn}
            >
              편집
            </button>
            <button
              onClick={() => setMode("add")}
              style={panelBtn}
            >
              + 자식
            </button>
            {focusedBody.id !== rootId && (
              <button
                onClick={() => deleteBody(focusedBody.id)}
                style={panelBtn}
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
          width: 32,
          height: 32,
          padding: 0,
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
        }}
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}
