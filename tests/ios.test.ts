import { describe, expect, it } from "vitest";
import { isIosOtherBrowser, isIosSafari } from "../src/app/ios";

// Rozpoznanie prehliadača na iPhone (D-168). Reťazce sú typické User-Agenty, syntetické.
const SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const CHROME_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1";
const FIREFOX_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15";
const FACEBOOK_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0]";
const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

describe("iOS prehliadač (D-168)", () => {
  it("len Safari na iPhone je Safari", () => {
    expect(isIosSafari(SAFARI_IPHONE)).toBe(true);
    expect(isIosSafari(CHROME_IPHONE)).toBe(false);
    expect(isIosSafari(FIREFOX_IPHONE)).toBe(false);
    expect(isIosSafari(FACEBOOK_IPHONE)).toBe(false);
    expect(isIosSafari(ANDROID_CHROME)).toBe(false);
  });

  it("iOS mimo Safari je iný prehliadač; Android a počítač nie sú", () => {
    expect(isIosOtherBrowser(CHROME_IPHONE)).toBe(true);
    expect(isIosOtherBrowser(FIREFOX_IPHONE)).toBe(true);
    expect(isIosOtherBrowser(FACEBOOK_IPHONE)).toBe(true);
    expect(isIosOtherBrowser(SAFARI_IPHONE)).toBe(false);
    expect(isIosOtherBrowser(ANDROID_CHROME)).toBe(false);
  });
});
