import Link from "next/link";

// /why — the manifesto. Why this exists. Reached from the landing's "왜?" button.
// A calm, scrollable reading page (the rest of the app is full-screen canvases,
// so this page owns its own scroll since the body is overflow-hidden).

const STANZAS = [
  `우리는 SNS의 발달로 유례없는 연결성과 편리함을 누리게 되었습니다.`,
  `인터넷에는 끊임없이 새로운 콘텐츠가 올라오고, 우리는 서로의 일상을 실시간으로 공유합니다. 얼핏 보면 이러한 환경은 더 많은 영감과 연결을 가져다줄 것처럼 보입니다.`,
  `하지만 현실은 기대와 조금 다릅니다.`,
  `우리는 이전보다 훨씬 많은 콘텐츠를 접하지만, 그만큼 스스로 생각하고 표현하는 시간은 줄어들었습니다. 하루 중 상당한 시간을 소비자로서 보내며, 남이 만든 생각과 경험을 받아들이는 데 사용합니다.`,
  `또한 우리는 서로의 일상을 더 많이 알게 되었지만, 역설적으로 더 깊은 관계를 맺고 있다고 느끼지는 못합니다. 수많은 사람들과 연결되어 있음에도 외로움과 단절감을 경험하기도 합니다.`,
  `알고리즘은 우리에게 익숙하고 선호하는 것들을 반복해서 보여줍니다. 우리는 비슷한 콘텐츠를 소비하고, 비슷한 관점을 접하며, 비슷한 반응을 학습합니다. 그렇게 거대한 흐름 속에서 개인의 목소리는 점점 희미해지고, 서로 다른 생각과 삶의 방식은 잘 보이지 않게 됩니다.`,
  `인간은 자신이 바라본 세상이 세상의 전부라고 믿는 경향이 있습니다.`,
  `같은 콘텐츠를 보고,
같은 이야기를 듣고,
같은 정답을 말하는 사람이 많아질수록,`,
  `우리는 그것이 곧 세상의 모습이라고 착각하게 됩니다.`,
  `하지만 세상은 언제나 우리가 보고 있는 것보다 넓습니다.`,
  `이 프로젝트는 각자의 마음 깊은 곳에 존재하는 개인을 다시 발견하기 위해 시작되었습니다.`,
  `자신이 무엇을 좋아하는지,
무엇을 믿는지,
어떤 경험을 통해 지금의 자신이 되었는지 돌아보며,`,
  `자기 자신을 더 깊이 이해하고,
서로 다른 개인들의 존재를 실감하며,
더 넓은 세상을 인식할 수 있도록 돕고자 합니다.`,
];

const CLOSING = `사회에 적응하기 위해 잠시, 혹은 오랫동안 묻어두었던 자신만의 목소리를 다시 꺼내보세요.

그 목소리는 생각보다 특별할 수도 있고 평범할 수도 있습니다.
변하지 않는 본질일 수도 있고, 계속 변화하는 과정일 수도 있습니다.

중요한 것은 그것이 '나'라는 사실입니다.`;

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
