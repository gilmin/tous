"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "미니멀" },
  { href: "/v/cosmic", label: "우주" },
  { href: "/me", label: "내 우주" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        position: "fixed",
        top: 14,
        left: 14,
        zIndex: 50,
        display: "flex",
        gap: 6,
        padding: "6px 8px",
        background: "rgba(20,20,24,0.55)",
        backdropFilter: "blur(6px)",
        borderRadius: 999,
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
      }}
    >
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              color: active ? "#fff" : "rgba(255,255,255,0.65)",
              background: active ? "rgba(255,255,255,0.15)" : "transparent",
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
