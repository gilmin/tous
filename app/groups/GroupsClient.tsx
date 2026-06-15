"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  type GroupWithMembers,
} from "@/lib/group/groups";

const GLASS = "rgba(43,28,84,0.55)";
const BORDER = "2px solid rgba(255,255,255,0.2)";

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "9px 13px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "#f5f5f7",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
};

const goldBtn: React.CSSProperties = {
  padding: "9px 22px",
  borderRadius: 999,
  background: "linear-gradient(180deg,#ffe2ad,#ffc97a)",
  color: "#3a1f6b",
  border: "none",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export default function GroupsClient({
  userId,
  groups,
}: {
  userId: string;
  groups: GroupWithMembers[];
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [createName, setCreateName] = useState("");
  const [createNick, setCreateNick] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinNick, setJoinNick] = useState("");

  async function onCreate() {
    const name = createName.trim();
    const nick = createNick.trim();
    if (!name || !nick) return setMsg("그룹 이름과 닉네임을 모두 입력해 주세요.");
    setBusy(true);
    setMsg(null);
    const res = await createGroup(supabase, name, nick);
    setBusy(false);
    if (!res) return setMsg("그룹 생성에 실패했어요. 다시 시도해 주세요.");
    setCreateName("");
    setCreateNick("");
    router.refresh();
  }

  async function onJoin() {
    const code = joinCode.trim();
    const nick = joinNick.trim();
    if (!code || !nick) return setMsg("초대 코드와 닉네임을 모두 입력해 주세요.");
    setBusy(true);
    setMsg(null);
    const res = await joinGroup(supabase, code, nick);
    setBusy(false);
    if (res === "error") return setMsg("참여에 실패했어요. 다시 시도해 주세요.");
    if (res === null) return setMsg("그런 초대 코드를 찾을 수 없어요.");
    setJoinCode("");
    setJoinNick("");
    router.refresh();
  }

  async function onLeave(groupId: string) {
    setBusy(true);
    setMsg(null);
    const ok = await leaveGroup(supabase, groupId, userId);
    setBusy(false);
    if (!ok) return setMsg("나가기에 실패했어요.");
    router.refresh();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
  }

  return (
    <main
      style={{
        height: "100dvh",
        overflowY: "auto",
        background:
          "radial-gradient(circle at 50% -10%, #3a2486 0%, #18103f 46%, #0b0622 100%)",
        fontFamily: "var(--font-cute), system-ui, sans-serif",
        color: "rgba(255,255,255,0.9)",
      }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "96px 24px 80px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 40, fontWeight: 700 }}>그룹</h1>
        <p style={{ margin: "0 0 36px", color: "rgba(255,255,255,0.55)", fontSize: 15 }}>
          코드로 친구를 묶고, 서로의 우주를 나눠보세요.
        </p>

        {/* 내 그룹 */}
        {groups.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 36px" }}>
            아직 속한 그룹이 없어요. 아래에서 만들거나 코드로 참여해 보세요.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
            {groups.map((g) => (
              <div
                key={g.id}
                style={{
                  padding: "16px 18px",
                  borderRadius: 18,
                  background: GLASS,
                  border: BORDER,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 19, fontWeight: 700 }}>{g.name}</span>
                  <button
                    type="button"
                    onClick={() => onLeave(g.id)}
                    disabled={busy}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: "inherit",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    나가기
                  </button>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0" }}>
                  {g.members.map((m) => (
                    <span
                      key={m.user_id}
                      style={{
                        padding: "4px 11px",
                        borderRadius: 999,
                        fontSize: 13,
                        background:
                          m.user_id === userId
                            ? "linear-gradient(180deg,#ffe2ad,#ffc97a)"
                            : "rgba(255,255,255,0.1)",
                        color: m.user_id === userId ? "#3a1f6b" : "rgba(255,255,255,0.85)",
                        fontWeight: m.user_id === userId ? 700 : 400,
                      }}
                    >
                      {m.nickname}
                      {m.user_id === userId ? " (나)" : ""}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => copyCode(g.invite_code)}
                    title="초대 코드 복사"
                    style={{
                      padding: "5px 13px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "inherit",
                      fontSize: 12,
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                    }}
                  >
                    {copied === g.invite_code ? "복사됨!" : `초대 코드: ${g.invite_code}`}
                  </button>
                  <Link
                    href={`/groups/${g.id}`}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 999,
                      background: "linear-gradient(180deg,#ffe2ad,#ffc97a)",
                      color: "#3a1f6b",
                      fontFamily: "inherit",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    이 그룹 탐험 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 만들기 / 참여 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <section>
            <h2 style={{ margin: "0 0 10px", fontSize: 16, color: "rgba(255,255,255,0.75)" }}>
              그룹 만들기
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="그룹 이름"
                style={inputStyle}
              />
              <input
                value={createNick}
                onChange={(e) => setCreateNick(e.target.value)}
                placeholder="내 닉네임"
                style={inputStyle}
              />
              <button type="button" onClick={onCreate} disabled={busy} style={goldBtn}>
                만들기
              </button>
            </div>
          </section>

          <section>
            <h2 style={{ margin: "0 0 10px", fontSize: 16, color: "rgba(255,255,255,0.75)" }}>
              코드로 참여
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="초대 코드"
                style={{ ...inputStyle, letterSpacing: "0.06em" }}
              />
              <input
                value={joinNick}
                onChange={(e) => setJoinNick(e.target.value)}
                placeholder="내 닉네임"
                style={inputStyle}
              />
              <button type="button" onClick={onJoin} disabled={busy} style={goldBtn}>
                참여
              </button>
            </div>
          </section>
        </div>

        {msg && (
          <p style={{ marginTop: 22, fontSize: 14, color: "#ffb3bf" }}>{msg}</p>
        )}
      </div>
    </main>
  );
}
