"use client";

import { useEffect, useState } from "react";
import { isInAppBrowser } from "./in-app-browser";

// Shown on /login when the page runs inside an in-app webview (KakaoTalk, etc.),
// where Google blocks OAuth. Nudges the user to reopen in a real browser and
// offers a copy-link button to paste there.
export function InAppBrowserNotice() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShow(isInAppBrowser(navigator.userAgent));
  }, []);

  if (!show) return null;

  const copy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        padding: "14px 16px",
        borderRadius: 14,
        background: "#fff7e6",
        border: "1px solid #f4d27a",
        color: "#7a5200",
        fontSize: 13,
        lineHeight: 1.6,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div>
        카카오톡 등 <b>앱 안 브라우저</b>에서는 구글 로그인이 막혀요.
        <br />
        우측 메뉴(⋮ · 공유)에서 <b>Safari·Chrome으로 열기</b>를 눌러 주세요.
      </div>
      <button
        type="button"
        onClick={copy}
        style={{
          padding: "7px 16px",
          borderRadius: 999,
          border: "1px solid #e0b450",
          background: "#ffe8ad",
          color: "#7a5200",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {copied ? "복사됨! 브라우저에 붙여넣기" : "링크 복사"}
      </button>
    </div>
  );
}
