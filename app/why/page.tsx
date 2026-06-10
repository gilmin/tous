import Link from "next/link";

// /why — the manifesto. Why this exists. Reached from the landing's "왜?" button.
// A calm, scrollable reading page (the rest of the app is full-screen canvases,
// so this page owns its own scroll since the body is overflow-hidden).

const STANZAS = [
  `우리는 SNS의 발달로 유례 없는 연결성과 편리함을 누리게 됐습니다. 인터넷엔 쉴 틈 없이 중독적인 릴스들이 올라오고, 서로의 실시간 일상을 공유할 수도 있습니다.
막연히 생각해보면 새로운 릴스를 접하면서 창의적이어지고, 서로의 일상을 공유하며 연결될 것으로 기대되지만 현실은 그렇지 않았습니다.
재밌고 창의적인 릴스들은 계속해서 올라오지만 우리 대부분은 스크롤에 시간을 쏟으며 하루중에 소비자로서 존재하는 시간은 증가했습니다.
연결된 것 같던 우리는 실시간을 공유받으면서도 단절감이 극대화됩니다.
다함께 유행을 따라가는데 익숙해지면서 개개인의 존재감은 사라지고 취향은 획일화되고 있습니다.`,
  `인간은 본인이 바라 본 세상이 실제 세상이라고 믿는 경향이 있습니다.
우리는 모두 같은 것을 봅니다.
우리는 모두 같은 정답을 말합니다.
우리의 수는 계속 늘어나고, 그 증가는 빨라집니다.
그 밖에 있는 사람은 새로운 ‘우리’를 만들거나, 배척됩니다.
하지만 세상은 언제나 인간보다 넓습니다.
이 프로젝트는 각자의 마음 깊은 곳에 있는 개개인을 다시 불러내고,
자기 자신에 대해 더 깊이 이해하고,
다양한 개인이 있음을 실감하고,
더 넓은 세상을 인식하게 도와주는데 그 의의가 있습니다.`,
];

const CLOSING = `사회에 어울리기 위해 잠깐, 혹은 꽤나 오랫동안 묻어두었던 개인을 꺼내보세요.
그 개인은 생각보다 특이하거나 평범할 수도, 불변적이거나 가변적일 수도 있습니다.`;

export default function WhyPage() {
  return (
    <main
      style={{
        height: "100vh",
        overflowY: "auto",
        background:
          "radial-gradient(circle at 50% -10%, #3a2486 0%, #18103f 46%, #0b0622 100%)",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        color: "rgba(255,255,255,0.9)",
      }}
    >
      <article
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "120px 28px 96px",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(40px, 9vw, 72px)",
            fontWeight: 700,
            color: "#ffd27a",
            textShadow: "0 4px 24px rgba(255,170,70,0.35)",
          }}
        >
          왜?
        </h1>
        <p
          style={{
            margin: "0 0 56px",
            fontSize: 16,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          이 우주를 만든 이유에 대하여.
        </p>

        {STANZAS.map((text, i) => (
          <p
            key={i}
            style={{
              whiteSpace: "pre-line",
              margin: "0 0 36px",
              fontSize: 18,
              lineHeight: 1.95,
              letterSpacing: "0.01em",
            }}
          >
            {text}
          </p>
        ))}

        <p
          style={{
            whiteSpace: "pre-line",
            margin: "48px 0 0",
            paddingTop: 36,
            borderTop: "1px solid rgba(255,255,255,0.14)",
            fontSize: 19,
            lineHeight: 2,
            fontWeight: 700,
            color: "#ffe9c2",
          }}
        >
          {CLOSING}
        </p>

        <div
          style={{
            marginTop: 64,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/discover"
            style={{
              padding: "14px 36px",
              borderRadius: 999,
              background: "linear-gradient(180deg,#ffe2ad,#ffc97a)",
              color: "#3a1f6b",
              fontSize: 18,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow:
                "0 8px 26px rgba(255,180,90,0.4), 0 2px 6px rgba(20,10,50,0.4)",
            }}
          >
            탐험하러 가기
          </Link>
          <Link
            href="/"
            style={{
              padding: "14px 28px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 16,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
