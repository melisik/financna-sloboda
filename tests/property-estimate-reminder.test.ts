import { describe, expect, it } from "vitest";
import { staleEstimates } from "../src/domain/reminders";

// D-326 (docs/62, R1, zakladateľ: a): odhad hodnoty nehnuteľnosti je ručný; raz za rok appka pripomenie aktualizáciu.
describe("pripomienka odhadu nehnuteľnosti (D-326)", () => {
  const p = (name: string, valueDate: string) => ({ name, valueDate });
  it("ukáže len nehnuteľnosti s odhadom starším ako rok", () => {
    expect(staleEstimates([p("Byt A", "2025-10-25"), p("Byt B", "2025-10-27"), p("Chata", "2026-05-01")], "2026-10-26")).toEqual(["Byt A"]);
  });
  it("bez nehnuteľností nič", () => {
    expect(staleEstimates([], "2026-10-26")).toEqual([]);
  });
});
