import { describe, expect, it } from "vitest";
import { parseReceiptItems } from "../src/domain/receiptItems";

// Položky dokladu z portálu (D-126). Syntetické názvy a kódy.
const SAMPLE = [
  "100000001 Testovací výrobok A",
  "1,000x\t23%\t3,50 €",
  "100000002 Testovací výrobok B",
  "1,000x\t23%\t2,00 €",
  "100000003 Výrobok s dlhším názvom C",
  "2,000x\t5%\t5,75 €\t11,50 €",
].join("\n");

describe("položky dokladu z portálu", () => {
  it("rozpozná dvojice riadkov a sumy prepočíta na centy", () => {
    const res = parseReceiptItems(SAMPLE);
    expect(res.unparsed).toEqual([]);
    expect(res.items).toEqual([
      { code: "100000001", name: "Testovací výrobok A", quantity: 1, vatPercent: 23, unitPriceCents: 350, amountCents: 350 },
      { code: "100000002", name: "Testovací výrobok B", quantity: 1, vatPercent: 23, unitPriceCents: 200, amountCents: 200 },
      { code: "100000003", name: "Výrobok s dlhším názvom C", quantity: 2, vatPercent: 5, unitPriceCents: 575, amountCents: 1150 },
    ]);
  });

  it("riadok bez páru alebo s neznámym tvarom sa vráti v unparsed, nič sa nestratí", () => {
    const res = parseReceiptItems("100000001 Bez sumy\nCelkom 5,50 €\n100000002 Dobrý\n1,000x\t23%\t1,00 €");
    expect(res.items.map((i) => i.code)).toEqual(["100000002"]);
    expect(res.unparsed).toEqual(["100000001 Bez sumy", "Celkom 5,50 €"]);
  });

  it("pri viac kusoch sa jednotková cena musí zhodovať s celkovou; inak sa riadok nepreberie", () => {
    const res = parseReceiptItems("100000004 Nesúhlasí\n2,000x\t5%\t5,75 €\t20,00 €");
    expect(res.items).toEqual([]);
    expect(res.unparsed).toEqual(["100000004 Nesúhlasí", "2,000x\t5%\t5,75 €\t20,00 €"]);
  });

  it("prázdny text nevytvorí položky", () => {
    expect(parseReceiptItems("  \n\n")).toEqual({ items: [], unparsed: [] });
  });
});
