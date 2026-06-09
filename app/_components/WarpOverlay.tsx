"use client";

import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────
// Spaceship warp transition — a full-screen hyperspace streak overlay.
//
// Theme-agnostic 2D canvas (sits above the R3F Canvas, pointer-events: none),
// so it reads as a ship jumping to/from lightspeed regardless of what scene is
// behind it. Two uses:
//   • warping  — drive the streaks while a transition is in flight (e.g.
//     /discover swapping spheres). Caller toggles it; streaks + tint cover the
//     swap, then fade as the new scene arrives.
//   • bootOnMount — play a one-shot "drop out of hyperspace" arrival when a
//     scene first loads ("켜질 때").
// When idle the canvas clears to fully transparent → zero scene interference.
// ─────────────────────────────────────────────────────────

const STREAK_COLORS = ["#ffffff", "#9fe8ff", "#ffd9f6", "#ffe9a8"];

export function WarpOverlay({
  warping = false,
  bootOnMount = false,
}: {
  warping?: boolean;
  bootOnMount?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mirror the prop in a ref so the RAF loop always reads the latest value
  // without re-running the effect (which would reset the star field).
  const warpingRef = useRef(warping);
  warpingRef.current = warping;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let maxR = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = w / 2;
      cy = h / 2;
      maxR = Math.hypot(cx, cy);
    };
    resize();
    window.addEventListener("resize", resize);

    // Star field in polar coords (angle + normalized distance 0..1 from center).
    const N = 200;
    const stars = Array.from({ length: N }, () => ({
      a: Math.random() * Math.PI * 2,
      d: Math.random(),
      v: 0.4 + Math.random() * 0.9,
      c: STREAK_COLORS[(Math.random() * STREAK_COLORS.length) | 0],
    }));

    let speed = bootOnMount ? 1.3 : 0; // warp drive, eases toward target
    let boot = bootOnMount ? 1 : 0; // one-shot arrival envelope, decays to 0
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Warp accelerates fast (so it hides a mid-transition swap) and the boot
      // envelope coasts down → "dropping out of hyperspace".
      const target = warpingRef.current ? 1.3 : 0;
      speed += (target - speed) * Math.min(dt * 9, 1);
      boot += (0 - boot) * Math.min(dt * 2.2, 1);
      const drive = Math.max(speed, boot);

      ctx.clearRect(0, 0, w, h);
      if (drive < 0.01) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Deep-space tint rises with the drive (indigo — matches cosmic void).
      const tint = Math.min(drive, 1) * 0.92;
      ctx.fillStyle = `rgba(20,12,52,${tint})`;
      ctx.fillRect(0, 0, w, h);

      // Stars shoot radially outward, stretched into streaks by the drive.
      ctx.lineCap = "round";
      for (const s of stars) {
        s.d += drive * s.v * dt * 0.9;
        if (s.d > 1.1) {
          s.d -= 1.1;
          s.a = Math.random() * Math.PI * 2;
        }
        const r0 = s.d * maxR;
        const r1 = Math.max(0, r0 - drive * s.v * 90);
        const alpha = Math.min(1, s.d * 1.4) * Math.min(1, drive);
        ctx.strokeStyle = s.c;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1 + s.d * 2.2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0);
        ctx.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [bootOnMount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none" }}
    />
  );
}
