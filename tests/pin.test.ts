import { describe, expect, it } from "vitest";
import { checkPin, isValidPin, makePinRecord } from "../src/features/zamok/pin";

// D-119: lokálny PIN. Syntetické hodnoty.
describe("lokálny PIN (D-119)", () => {
  it("platný PIN má 4 až 6 číslic", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
  });

  it("správny PIN prejde, nesprávny nie, a záznam neobsahuje PIN v čistom texte", async () => {
    const record = await makePinRecord("4821");
    expect(record).not.toContain("4821");
    expect(await checkPin("4821", record)).toBe(true);
    expect(await checkPin("4822", record)).toBe(false);
  });

  it("rovnaký PIN dá vždy iný záznam (náhodná soľ)", async () => {
    expect(await makePinRecord("1111")).not.toBe(await makePinRecord("1111"));
  });

  it("poškodený záznam sa berie ako nesprávny PIN", async () => {
    expect(await checkPin("1234", "nie je json")).toBe(false);
  });
});
