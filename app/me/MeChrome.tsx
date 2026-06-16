"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";

// useLayoutEffect on the client (positions before paint, no flicker), useEffect
// on the server (avoids the SSR warning — effects don't run during SSR anyway).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The /me top-right cluster (heart + publish toggle + sign-out). The user wants
// the heart button's vertical CENTER on the nav's center line — not the tops
// aligned. The nav and this cluster are different heights (and the cluster is
// scale(0.78) on touch), so a static top can't keep their centers together
// across devices/fonts. Instead we measure both at runtime and nudge the cluster
// down via --me-align (composed into its transform in globals.css) until the
// heart's center matches the nav's. One correction is exact — translateY sits
// outside scale() so it moves in viewport px — and we re-run on resize + font load.
export default function MeChrome({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const align = () => {
      const nav = document.querySelector("nav");
      const row = el.firstElementChild;
      // Row 1's first child is the heart button (when the universe has ever been
      // published); otherwise fall back to the row itself.
      const anchor = (row?.firstElementChild ?? row) as HTMLElement | null;
      if (!nav || !anchor) return;
      const navR = nav.getBoundingClientRect();
      const aR = anchor.getBoundingClientRect();
      const delta =
        navR.top + navR.height / 2 - (aR.top + aR.height / 2);
      if (Math.abs(delta) < 0.5) return;
      const cur = parseFloat(el.style.getPropertyValue("--me-align")) || 0;
      el.style.setProperty("--me-align", `${cur + delta}px`);
    };
    align();
    window.addEventListener("resize", align);
    document.fonts?.ready.then(align);
    return () => window.removeEventListener("resize", align);
  }, []);

  return (
    <div
      ref={ref}
      className="me-chrome"
      style={{
        position: "fixed",
        right: "calc(14px + env(safe-area-inset-right))",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-end",
      }}
    >
      {children}
    </div>
  );
}
