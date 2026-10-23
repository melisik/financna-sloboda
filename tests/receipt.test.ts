import { describe, expect, it } from "vitest";
import { isReceiptId, receiptIdFromQr, RECEIPT_CHECK_URL } from "../src/domain/receipt";
import { validateTransaction } from "../src/storage/validate";

// Číslo dokladu z QR kódu (D-126). Syntetické hodnoty (skutočné čísla dokladov do repozitára nepatria).
const SAMPLE = "O-A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6";

describe("číslo dokladu (D-128)", () => {
  it("prijme vzorku z portálu a odmietne príliš krátke alebo cudzie znaky", () => {
    expect(isReceiptId(SAMPLE)).toBe(true);
    expect(isReceiptId("O-123")).toBe(false);
    expect(isReceiptId(`${SAMPLE}!`)).toBe(false);
    expect(isReceiptId(undefined)).toBe(false);
  });

  it("z QR kódu vezme text bez medzier; URL ani prázdny text nie je číslo dokladu", () => {
    expect(receiptIdFromQr(`  ${SAMPLE}\n`)).toBe(SAMPLE);
    expect(receiptIdFromQr("https://opd.financnasprava.sk/#!/check")).toBeNull();
    expect(receiptIdFromQr("")).toBeNull();
  });

  it("overovací odkaz smeruje na portál finančnej správy", () => {
    expect(RECEIPT_CHECK_URL).toBe("https://opd.financnasprava.sk/#!/check");
  });

  it("transakcia s číslom dokladu prejde len pri výdavku", () => {
    const base = { id: "t1", date: "2026-10-19", amountCents: 1000, source: "z_hotovosti", createdAt: "x", updatedAt: "x" };
    expect(validateTransaction({ ...base, type: "vydavok", receiptId: SAMPLE }, "2026-10-20")).toEqual([]);
    expect(validateTransaction({ ...base, type: "vydavok", receiptId: "krátke" }, "2026-10-20").length).toBeGreaterThan(0);
    expect(validateTransaction({ ...base, type: "sporenie", receiptId: SAMPLE }, "2026-10-20").length).toBeGreaterThan(0);
  });
});
