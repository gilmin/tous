import { describe, expect, it } from "vitest";
import { isInAppBrowser } from "./in-app-browser";

describe("isInAppBrowser", () => {
  it("카카오톡 인앱 브라우저를 감지", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 KAKAOTALK 10.4.5",
      ),
    ).toBe(true);
  });

  it("인스타그램/페이스북 인앱 브라우저를 감지", () => {
    expect(isInAppBrowser("Mozilla/5.0 ... Instagram 300.0.0.0")).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 ... [FBAN/FBIOS;FBAV/400.0]")).toBe(true);
  });

  it("안드로이드 WebView(; wv)를 감지", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 13; SM-G991N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe(true);
  });

  it("진짜 Safari/Chrome은 통과(false)", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe(false);
  });
});
