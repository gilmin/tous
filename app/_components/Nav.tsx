"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "우주" },
  { href: "/me", label: "내 우주" },
  { href: "/discover", label: "탐험" },
  { href: "/groups", label: "그룹" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        position: "fixed",
        top: "calc(16px + env(safe-area-inset-top))",
        left: "calc(16px + env(safe-area-inset-left))",
        zIndex: 50,
        display: "flex",
        gap: 4,
        padding: "6px 7px",
        background: "rgba(43,28,84,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "2px solid rgba(255,255,255,0.18)",
        borderRadius: 999,
        boxShadow: "0 6px 20px rgba(20,10,50,0.35)",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        fontSize: 14,
      }}
    >
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: "9px 14px",
              borderRadius: 999,
              fontWeight: active ? 700 : 400,
              color: active ? "#3a1f6b" : "rgba(255,255,255,0.72)",
              background: active
                ? "linear-gradient(180deg,#ffe2ad,#ffc97a)"
                : "transparent",
              boxShadow: active ? "0 2px 8px rgba(255,180,90,0.4)" : "none",
              textDecoration: "none",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
