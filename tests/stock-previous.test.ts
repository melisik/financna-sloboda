import { describe, expect, it } from "vitest";
import { previousProducts } from "../src/domain/stock";
import type { StockItem } from "../src/storage/types";

// Výber predchádzajúcich výrobkov pri zadávaní položky (D-238). Syntetické hodnoty.
const item = (over: Partial<StockItem>): StockItem => ({
  id: "x", name: "mlieko", quantity: 1, unit: "l", createdAt: "2026-10-01T10:00:00.000Z", updatedAt: "2026-10-01T10:00:00.000Z", ...over,
});

describe("predchádzajúce výrobky (D-238)", () => {
  it("jeden výrobok sa ukáže raz, najnovšie upravenú položku a zoradené podľa názvu", () => {
    const list = previousProducts([
      item({ id: "a", name: "Mlieko", barcode: "4006381333931", updatedAt: "2026-09-01T10:00:00.000Z" }),
      item({ id: "b", name: "Mlieko", barcode: "4006381333931", updatedAt: "2026-10-05T10:00:00.000Z" }),
      item({ id: "c", name: "Chlieb", unit: "ks" }),
      item({ id: "d", name: "chlieb", unit: "ks" }),
    ]);
    expect(list.map((i) => i.name)).toEqual(["Chlieb", "Mlieko"]);
    expect(list.find((i) => i.name === "Mlieko")?.id).toBe("b");
  });

  it("prázdny sklad nedá žiadny výrobok", () => {
    expect(previousProducts([])).toEqual([]);
  });
});
