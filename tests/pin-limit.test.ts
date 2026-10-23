import { describe, expect, it } from "vitest";
import { NO_ATTEMPTS, afterFailure, lockSeconds, readAttempts, waitSeconds, writeAttempts } from "../src/features/zamok/pinLimit";

// Obmedzenie pokusov pri PIN-e (audit, nález 10). Syntetické hodnoty.
describe("obmedzenie pokusov pri PIN-e (D-203)", () => {
  it("prvé štyri nesprávne pokusy neblokujú", () => {
    for (let n = 0; n < 5; n++) expect(lockSeconds(n)).toBe(0);
  });

  it("od piateho pokusu čas rastie dvojnásobne a je ohraničený", () => {
    expect(lockSeconds(5)).toBe(30);
    expect(lockSeconds(6)).toBe(60);
    expect(lockSeconds(7)).toBe(120);
    expect(lockSeconds(50)).toBe(900);
  });

  it("afterFailure nastaví blokovanie od času pokusu", () => {
    let a = NO_ATTEMPTS;
    for (let i = 0; i < 4; i++) a = afterFailure(a, 1000);
    expect(a).toEqual({ failures: 4, lockedUntil: 0 });
    a = afterFailure(a, 1000);
    expect(a).toEqual({ failures: 5, lockedUntil: 31_000 });
  });

  it("waitSeconds zaokrúhľuje nahor a nikdy nie je záporný", () => {
    expect(waitSeconds({ failures: 5, lockedUntil: 31_000 }, 1000)).toBe(30);
    expect(waitSeconds({ failures: 5, lockedUntil: 31_000 }, 30_500)).toBe(1);
    expect(waitSeconds({ failures: 5, lockedUntil: 31_000 }, 40_000)).toBe(0);
  });

  it("počítadlo sa načíta a uloží cez úložisko; poškodený záznam znamená žiadne pokusy", async () => {
    const store = new Map<string, string>();
    const repo = {
      getMeta: async (k: string) => store.get(k) ?? null,
      setMeta: async (k: string, v: string) => {
        store.set(k, v);
      },
    };
    expect(await readAttempts(repo)).toEqual(NO_ATTEMPTS);
    await writeAttempts(repo, { failures: 6, lockedUntil: 9 });
    expect(await readAttempts(repo)).toEqual({ failures: 6, lockedUntil: 9 });
    store.set("pinPokusy", "neplatné");
    expect(await readAttempts(repo)).toEqual(NO_ATTEMPTS);
  });
});
