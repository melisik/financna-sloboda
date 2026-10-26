import { describe, expect, it } from "vitest";
import data from "../src/data/nbsProviders.json";
import { PROVIDER_TYPE_ORDER } from "../src/domain/nbsProviders";

// D-329, docs/63, docs/64: pribalený zoznam má zdroj, dátum a len IČO, názov, typ (bez adries a agentov).
describe("pribalený zoznam poskytovateľov z NBS (D-329)", () => {
  it("má zdroj, dátum stavu a rozumný počet firiem", () => {
    expect(data.source).toMatch(/Národná banka Slovenska/);
    expect(data.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.providers.length).toBeGreaterThan(50);
    expect(data.providers.length).toBeLessThan(400);
  });
  it("každý záznam má len ico, name, type; IČO 6 až 8 číslic; typ z katalógu", () => {
    for (const p of data.providers) {
      expect(Object.keys(p).sort()).toEqual(["ico", "name", "type"]);
      expect(p.ico).toMatch(/^[0-9]{6,8}$/);
      expect(PROVIDER_TYPE_ORDER).toContain(p.type);
    }
  });
  it("IČO sa neopakuje a agenti ani zahraniční cezhraniční obchodníci tam nie sú", () => {
    const icos = data.providers.map((p) => p.ico);
    expect(new Set(icos).size).toBe(icos.length);
    expect(data.providers.map((p) => p.name).join("|")).not.toMatch(/TRADING 212|Interactive Brokers Ireland/);
  });
});
