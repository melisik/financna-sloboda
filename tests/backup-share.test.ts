import { describe, expect, it } from "vitest";
import { usesMobileBackupShare } from "../src/features/zaloha/BackupSection";

// Rozpoznávanie mobilných zariadení pre zdieľanie zálohy (D-018: zdieľanie súborov v mobilných prehliadačoch).
// Desktop prehliadače: priamy download. Mobilné: systémové zdieľanie.
// iPadOS v režime desktopového User Agent: kontrola maxTouchPoints rozlíši tablet od skutočného macOS.

describe("rozpoznávanie zariadení pre zdieľanie zálohy (usesMobileBackupShare)", () => {
  it("Android s realistickým User Agent je mobilné zariadenie", () => {
    const userAgent = "Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36";
    expect(usesMobileBackupShare(userAgent, 5)).toBe(true);
  });

  it("iPhone s realistickým User Agent je mobilné zariadenie", () => {
    const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Version/18.2 Mobile/15E148 Safari/604.1";
    expect(usesMobileBackupShare(userAgent, 5)).toBe(true);
  });

  it("iPad s realistickým User Agent je mobilné zariadenie", () => {
    const userAgent = "Mozilla/5.0 (iPad; CPU OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Version/18.2 Mobile/15E148 Safari/604.1";
    expect(usesMobileBackupShare(userAgent, 5)).toBe(true);
  });

  it("iPadOS v režime desktopového User Agent (Macintosh) s dotykovou podporou je mobilné zariadenie", () => {
    const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";
    const maxTouchPoints = 5; // iPad má viacero dotykových bodov
    expect(usesMobileBackupShare(userAgent, maxTouchPoints)).toBe(true);
  });

  it("Windows desktop bez dotykovej podpory nie je mobilné zariadenie", () => {
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";
    expect(usesMobileBackupShare(userAgent, 0)).toBe(false);
  });

  it("Windows desktop s dotykovou obrazovkou nie je mobilné zariadenie (nie je iPad)", () => {
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; Touch) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";
    const maxTouchPoints = 10; // dotyková obrazovka má dotykové body
    expect(usesMobileBackupShare(userAgent, maxTouchPoints)).toBe(false);
  });

  it("macOS desktop bez dotykovej podpory nie je mobilné zariadenie", () => {
    const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";
    expect(usesMobileBackupShare(userAgent, 0)).toBe(false);
  });

  it("macOS desktop s jedným bodom dotyku nie je mobilné zariadenie", () => {
    const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";
    const maxTouchPoints = 1;
    expect(usesMobileBackupShare(userAgent, maxTouchPoints)).toBe(false);
  });
});
