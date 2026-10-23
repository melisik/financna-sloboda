import { describe, expect, it } from "vitest";
import { findItemByBarcode, isValidBarcode } from "../src/domain/stock";
import { validateStockItem } from "../src/storage/validate";
import type { StockItem } from "../src/storage/types";

// Čiarový kód položky skladu (D-232). Syntetické hodnoty, verejné príklady GS1.
const item = (over: Partial<StockItem>): StockItem => ({
  id: "s1", name: "mlieko", quantity: 1, unit: "l", createdAt: "2026-10-01T10:00:00.000Z", updatedAt: "2026-10-01T10:00:00.000Z", ...over,
});

describe("kontrola čiarového kódu (GS1, D-232)", () => {
  it("správne kódy EAN-13, EAN-8 a UPC-A prejdú", () => {
    expect(isValidBarcode("4006381333931")).toBe(true);
    expect(isValidBarcode("96385074")).toBe(true);
    expect(isValidBarcode("036000291452")).toBe(true);
  });

  it("zlý kontrolný súčet, iné dĺžky a nečíselné znaky sa odmietnu", () => {
    expect(isValidBarcode("4006381333932")).toBe(false);
    expect(isValidBarcode("96385075")).toBe(false);
    expect(isValidBarcode("400638133393")).toBe(false);
    expect(isValidBarcode("40063813339X1")).toBe(false);
    expect(isValidBarcode("")).toBe(false);
  });
});

describe("vyhľadanie položky podľa čiarového kódu", () => {
  it("vráti najnovšie upravenú položku s rovnakým kódom", () => {
    const items = [
      item({ id: "a", barcode: "4006381333931", updatedAt: "2026-09-01T10:00:00.000Z", name: "staré" }),
      item({ id: "b", barcode: "4006381333931", updatedAt: "2026-10-05T10:00:00.000Z", name: "nové" }),
      item({ id: "c", barcode: "96385074", name: "iný výrobok" }),
    ];
    expect(findItemByBarcode(items, "4006381333931")?.name).toBe("nové");
    expect(findItemByBarcode(items, "036000291452")).toBeUndefined();
  });
});

describe("validácia položky so čiarovým kódom", () => {
  it("platný kód prejde, neplatný sa odmietne", () => {
    expect(validateStockItem({ ...item({}), barcode: "4006381333931" })).toEqual([]);
    expect(validateStockItem({ ...item({}), barcode: "4006381333932" }).length).toBeGreaterThan(0);
  });
});
