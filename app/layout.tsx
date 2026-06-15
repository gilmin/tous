import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "./_components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 둥근미소 — 동글동글 손글씨풍 한글 폰트. 카툰 무드의 기본 UI 글꼴.
const dunggeunmiso = localFont({
  variable: "--font-cute",
  src: [
    { path: "./fonts/Dunggeunmiso-R.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Dunggeunmiso-B.ttf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "tous",
  description: "당신의 마음 깊은 곳에 있는 개인을 다시 불러내는 공간",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 노치/홈 인디케이터 영역까지 채우고 safe-area 인셋을 활성화.
  viewportFit: "cover",
  // 키보드가 뜰 때 레이아웃 뷰포트를 수축(Android). iOS는 useKeyboardInset의
  // visualViewport 계산이 보정.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dunggeunmiso.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-100 overflow-hidden">
        <Nav />
        {children}
      </body>
    </html>
  );
}
