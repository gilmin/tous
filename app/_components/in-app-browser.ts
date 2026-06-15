// Detects common in-app webviews (KakaoTalk, Instagram, Facebook, Line, Naver,
// Daum, generic Android WebView). Google blocks OAuth inside embedded webviews,
// so /login nudges these users to open the page in a real browser. Pure (ua
// string → bool) for testability; the component passes navigator.userAgent.
export function isInAppBrowser(ua: string): boolean {
  const s = ua.toLowerCase();
  return /kakaotalk|instagram|fbav|fban|fb_iab|line\/|daumapps|naver|; wv/.test(s);
}
