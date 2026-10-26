import { describe, expect, it } from "vitest";
import { selectProviders, type NbsInstitution } from "../src/domain/nbsProviders";

// D-329, docs/63: výber priamych poskytovateľov investičných produktov z registra NBS. Syntetické záznamy.
const inst = (id: string, name: string, scopes: (string | { scope: string; licenses: { scope: string }[] })[], country = "SK"): NbsInstitution => ({
  id, name, address: "Ulica 1, 81101 Bratislava", country,
  licenses: scopes.map((s) => (typeof s === "string" ? { scope: s, valid_from: "2020-01-01" } : { ...s, valid_from: "2020-01-01" })),
});

describe("selectProviders (D-329)", () => {
  it("zaradí obchodníka s cennými papiermi a jeho pobočku zahraničného obchodníka", () => {
    const r = selectProviders([inst("1", "Test o.c.p., a.s.", ["obchodník s cennými papiermi"]), inst("2", "Test XTB, organizačná zložka", ["pobočka zahraničného obchodníka s cennými papiermi"])]);
    expect(r.map((p) => p.type)).toEqual(["obchodník s cennými papiermi", "obchodník s cennými papiermi"]);
  });
  it("vynechá agentov, sprostredkovateľov a firmy s voľným cezhraničným pôsobením", () => {
    const r = selectProviders([
      inst("3", "Jozef Syntetický", ["podriadený finančný agent"]),
      inst("4", "Agent s.r.o.", ["samostatný finančný agent", "viazaný finančný agent"]),
      inst("5", "Broker Ltd", ["voľné cezhraničné pôsobenie obchodníka s cennými papiermi na území SR"]),
    ]);
    expect(r).toEqual([]);
  });
  it("banku zaradí len s oprávnením na investičné služby", () => {
    const withInv = inst("6", "Banka A, a. s.", [{ scope: "banka, úverová inštitúcia", licenses: [{ scope: "poskytovanie investičných služieb" }] }]);
    const without = inst("7", "Banka B, a. s.", [{ scope: "banka, úverová inštitúcia", licenses: [{ scope: "program krytých dlhopisov" }] }]);
    const branch = inst("8", "Pobočka C", [{ scope: "pobočka zahraničnej banky", licenses: [{ scope: "poskytovanie investičných služieb" }] }]);
    expect(selectProviders([withInv, without, branch]).map((p) => p.ico)).toEqual(["6", "8"]);
  });
  it("rozlišuje II. a III. pilier, poisťovne, kryptoaktíva a hromadné financovanie", () => {
    const r = selectProviders([
      inst("10", "DSS", ["dôchodková správcovská spoločnosť"]),
      inst("11", "DDS", ["doplnková dôchodková spoločnosť"]),
      inst("12", "Poisťovňa", ["poisťovňa"]),
      inst("13", "Pobočka poisťovne", ["pobočka poisťovne z iného členského štátu"]),
      inst("14", "Krypto", ["poskytovateľ služieb kryptoaktív"]),
      inst("15", "Crowd", ["poskytovateľ služieb hromadného financovania"]),
      inst("16", "Správ. spol.", ["správcovská spoločnosť"]),
    ]);
    expect(Object.fromEntries(r.map((p) => [p.ico, p.type]))).toEqual({
      "10": "dôchodková spoločnosť (II. pilier)", "11": "doplnková dôchodková spoločnosť (III. pilier)", "12": "poisťovňa", "13": "poisťovňa",
      "14": "kryptoaktíva", "15": "hromadné financovanie", "16": "správcovská spoločnosť",
    });
  });
  it("preberá len IČO, názov a typ; názov doslovne; adresu nie", () => {
    const [p] = selectProviders([inst("20", "  Názov,  s.r.o. ", ["poisťovňa"])]);
    expect(Object.keys(p).sort()).toEqual(["ico", "name", "type"]);
    expect(p.name).toBe("  Názov,  s.r.o. ");
  });
  it("firma s viac oprávneniami je v zozname raz; typ podľa poradia dôležitosti", () => {
    const r = selectProviders([inst("30", "Skupina a. s.", ["poisťovňa", "obchodník s cennými papiermi"])]);
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe("obchodník s cennými papiermi");
  });
  it("zoradí podľa typu a potom podľa názvu (slovenská abeceda)", () => {
    const r = selectProviders([inst("40", "Ždiar o.c.p.", ["obchodník s cennými papiermi"]), inst("41", "Čaj o.c.p.", ["obchodník s cennými papiermi"]), inst("42", "Alfa", ["poisťovňa"])]);
    expect(r.map((p) => p.ico)).toEqual(["41", "40", "42"]);
  });
});
