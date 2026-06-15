import Link from "next/link";
import LandingScene from "./scene/LandingScene";

// Landing (/) — an acquisition hero, not an editor. A single pulsing "나" planet
// behind a question + a prominent 탐험 CTA that drops the visitor into other
// people's universes (/discover). Making your own lives behind login at /me.
export default function Home() {
  return (
    <main style={{ position: "relative", width: "100vw", height: "100dvh" }}>
      <LandingScene />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          pointerEvents: "none",
          fontFamily: "var(--font-cute), system-ui, sans-serif",
        }}
      >
        <p
          style={{
            position: "absolute",
            top: "19%",
            left: "50%",
            transform: "translateX(-50%)",
            margin: 0,
            width: "90%",
            textAlign: "center",
            color: "#fff",
            fontSize: "clamp(22px, 4vw, 38px)",
            fontWeight: 700,
            letterSpacing: "0.01em",
            textShadow:
              "0 2px 12px rgba(10,4,30,0.7), 0 0 4px rgba(10,4,30,0.6)",
          }}
        >
          당신의 우주는 어떤 모양인가요?
        </p>

        <div
          style={{
            position: "absolute",
            bottom: "17%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "92vw",
          }}
        >
          <Link
            href="/discover"
            style={{
              pointerEvents: "auto",
              padding: "14px 40px",
              borderRadius: 999,
              background: "linear-gradient(180deg,#ffe2ad,#ffc97a)",
              color: "#3a1f6b",
              fontSize: 20,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow:
                "0 8px 26px rgba(255,180,90,0.45), 0 2px 6px rgba(20,10,50,0.4)",
            }}
          >
            탐험
          </Link>
          <Link
            href="/why"
            style={{
              pointerEvents: "auto",
              padding: "14px 26px",
              borderRadius: 999,
              background: "rgba(43,28,84,0.55)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "2px solid rgba(255,255,255,0.22)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 20,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(20,10,50,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            절대 누르지 마시오.
          </Link>
        </div>
      </div>
    </main>
  );
}
