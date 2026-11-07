import { describe, expect, it } from "vitest";
import { amortizeMortgage, applyExtraPayment } from "../src/domain/mortgage";
import { mortgagePaymentInMonthCents, mortgagePaymentRecordValid, mortgageParamsChanged, withMortgagePaymentRecord } from "../src/domain/property";
import { householdMonthBalance } from "../src/domain/householdBalance";
import { validateProperty } from "../src/storage/validate";
import { buildBackup, parseBackup } from "../src/storage/backup";
import { SCHEMA_VERSION, type AppData, type Property } from "../src/storage/types";

// Posledná splátka hypotéky (D-347, F-01): automatické splácanie zapíše zaplatenú sumu, mesiac ju vykáže.
// Načítanie appky = automatické splácanie a uloženie ako v useAutomaticUpdates, potom mesačná bilancia. Syntetické hodnoty.
const T = "2026-09-01T10:00:00Z";
const hypoteka = (extra: Partial<Property> = {}): Property => ({
  id: "p1", mode: "prenajom", valueCents: 20_000_000, valueDate: "2026-09-01", mortgageBalanceCents: 80_000, mortgageRate: 0,
  monthlyPaymentCents: 60_000, balanceDate: "2026-09-01", createdAt: T, updatedAt: T, ...extra,
});
const open = (p: Property, today: string): Property => {
  const upd = amortizeMortgage(p, today);
  return upd ? { ...p, ...upd } : p;
};
const vstup = (p: Property) => ({ transactions: [], budgets: [], recurringExpenses: [], properties: [p], liabilities: [], incomes: [] });
// Hypotéka v mesiaci na troch obrazovkách: Prehľad a Príjmy (spoločná bilancia), Rozpočet (kategória bývanie).
const screens = (p: Property, today: string) => {
  const b = householdMonthBalance(vstup(p), today);
  return { prehladPrijmy: b.housingCents, vydavky: b.totalExpensesCents, rozpocet: b.summary.spentByCategory["bývanie"] };
};
const walk = (p: Property, days: string[]) =>
  days.map((d) => {
    p = open(p, d);
    return mortgagePaymentInMonthCents(p, d);
  });

describe("scenár A: 800 €, splátka 600 €, 0 %", () => {
  it("splátka k 1. dňu: október 600 €, november 200 €, december 0 €", () => {
    expect(walk(hypoteka(), ["2026-09-15", "2026-10-15", "2026-11-15", "2026-12-15"])).toEqual([60_000, 60_000, 20_000, 0]);
  });

  it("splátka k 20. dňu: rovnaká suma pred výročím aj po ňom", () => {
    const days = ["2026-10-10", "2026-10-25", "2026-11-10", "2026-11-25", "2026-12-10", "2026-12-25"];
    expect(walk(hypoteka({ balanceDate: "2026-09-20" }), days)).toEqual([60_000, 60_000, 20_000, 20_000, 0, 0]);
  });

  it("Prehľad, Príjmy a Rozpočet ukazujú v každom mesiaci rovnakú sumu", () => {
    let p = hypoteka();
    for (const [day, expected] of [["2026-10-15", 60_000], ["2026-11-15", 20_000], ["2026-12-15", 0]] as const) {
      p = open(p, day);
      expect(screens(p, day)).toEqual({ prehladPrijmy: expected, vydavky: expected, rozpocet: expected });
    }
  });
});

describe("scenár B: posledná splátka s úrokom 3,6 % (D-255)", () => {
  it("november je zostatok plus úrok za mesiac, nie viac; spolu sa zaplatí istina a úrok presne raz", () => {
    let p = open(hypoteka({ mortgageRate: 0.036 }), "2026-10-15");
    expect(p.mortgageBalanceCents).toBe(20_240); // 800 € + úrok 2,40 € − 600 €
    expect(mortgagePaymentInMonthCents(p, "2026-10-15")).toBe(60_000);
    const before = p.mortgageBalanceCents;
    const interest = Math.round((before * 0.036) / 12); // 0,61 €
    p = open(p, "2026-11-15");
    expect(mortgagePaymentInMonthCents(p, "2026-11-15")).toBe(before + interest);
    expect(mortgagePaymentInMonthCents(p, "2026-11-15")).toBe(20_301);
    expect(p.mortgageBalanceCents).toBe(0);
    expect(60_000 + 20_301).toBe(80_000 + 240 + interest);
    expect(mortgagePaymentInMonthCents(open(p, "2026-12-15"), "2026-12-15")).toBe(0);
  });

  it("pred výročím v mesiaci poslednej splátky sa vykáže zostatok plus úrok (D-255)", () => {
    const p = open(hypoteka({ mortgageRate: 0.036, balanceDate: "2026-09-20" }), "2026-10-25");
    expect(mortgagePaymentInMonthCents(p, "2026-11-10")).toBe(20_301);
  });
});

describe("scenár C a D: bežná a splatená hypotéka", () => {
  it("pri dostatočnom zostatku sa vykáže plná splátka", () => {
    expect(walk(hypoteka({ mortgageBalanceCents: 10_000_000, mortgageRate: 0.036 }), ["2026-10-15", "2026-11-15", "2026-12-15"])).toEqual([60_000, 60_000, 60_000]);
  });

  it("splatená hypotéka ukazuje 0 € aj s novembrovým záznamom v nasledujúcich mesiacoch", () => {
    expect(walk(hypoteka({ mortgageBalanceCents: 0 }), ["2026-10-15", "2026-11-15"])).toEqual([0, 0]);
    const paid = open(open(hypoteka(), "2026-10-15"), "2026-11-15");
    expect(["2026-12-15", "2027-01-15", "2027-06-15"].map((d) => mortgagePaymentInMonthCents(open(paid, d), d))).toEqual([0, 0, 0]);
  });
});

describe("scenár E: appka nebola otvorená niekoľko mesiacov", () => {
  it("otvorenie v decembri spracuje október aj november a uloží novembrovú poslednú splátku", () => {
    const p = open(hypoteka(), "2026-12-15");
    expect(p.lastMortgagePayment).toEqual({ date: "2026-11-01", amountCents: 20_000, balanceAfterCents: 0 });
    expect(p.mortgageBalanceCents).toBe(0);
    expect(mortgagePaymentInMonthCents(p, "2026-12-15")).toBe(0);
  });

  it("otvorenie v novembri po septembri vykáže poslednú splátku 200 € a december potom 0 €", () => {
    expect(walk(hypoteka(), ["2026-11-15", "2026-12-15"])).toEqual([20_000, 0]);
  });
});

describe("scenár F: opakované načítanie", () => {
  it("tá istá splátka sa nezapíše ani nezapočíta dvakrát", () => {
    const nov = open(open(hypoteka(), "2026-10-15"), "2026-11-15");
    expect(amortizeMortgage(nov, "2026-11-16")).toBeNull();
    expect(walk(nov, ["2026-11-15", "2026-11-16", "2026-11-30"])).toEqual([20_000, 20_000, 20_000]);
    expect(screens(open(nov, "2026-11-30"), "2026-11-30").vydavky).toBe(20_000);
  });
});

describe("zneplatnenie zastaraného záznamu (D-347)", () => {
  const oct = open(hypoteka(), "2026-10-15"); // záznam 1. 10.: 600 €, zostatok po nej 200 €
  const nov = open(oct, "2026-11-15"); // záznam 1. 11.: 200 €, zostatok 0

  it("úprava bez zmeny hypotéky (názov, odhad, režim, nájom, prenájom) záznam zachová", () => {
    const edited = withMortgagePaymentRecord(nov, {
      ...nov, name: "Byt", valueCents: 21_000_000, mode: "vlastne_byvanie", monthlyRentCents: 55_000, rentalStartDate: "2026-01-01", lastMortgagePayment: undefined,
    });
    expect(edited.lastMortgagePayment).toEqual(nov.lastMortgagePayment);
    expect(mortgagePaymentInMonthCents(edited, "2026-11-20")).toBe(20_000);
    // Zápis do evidencie prenájmu ukladá nehnuteľnosť cez {...nehnuteľnosť}; záznam ostáva.
    const ledger = { ...nov, rentalLedger: [{ id: "r", date: "2026-11-05", kind: "prijem" as const, amountCents: 50_000 }] };
    expect(mortgagePaymentInMonthCents(ledger, "2026-11-20")).toBe(20_000);
  });

  it("formulár pri nulovom zostatku vynechá dátum zostatku; to nie je zmena hypotéky", () => {
    const { balanceDate: _d, lastMortgagePayment: _l, ...fromForm } = nov;
    expect(withMortgagePaymentRecord(nov, fromForm).lastMortgagePayment).toEqual(nov.lastMortgagePayment);
  });

  it("sadzba po prevode % a späť (0,036 → 3,6 → 0,036) nie je zmena", () => {
    const p = { ...oct, mortgageRate: 0.036 };
    const roundTrip = Number((0.036 * 100).toFixed(6)) / 100;
    expect(mortgageParamsChanged(p, { ...p, mortgageRate: roundTrip })).toBe(false);
  });

  it.each([
    ["zostatok", { mortgageBalanceCents: 30_000 }],
    ["dátum zostatku", { balanceDate: "2026-10-05" }],
    ["splátka", { monthlyPaymentCents: 55_000 }],
    ["sadzba", { mortgageRate: 0.02 }],
  ])("ručná zmena: %s záznam zmaže", (_name, change) => {
    const edited = withMortgagePaymentRecord(oct, { ...oct, ...change });
    expect(edited.lastMortgagePayment).toBeUndefined();
  });

  it("nová nehnuteľnosť nemá záznam a cudzí záznam sa z formulára neprevezme", () => {
    expect(withMortgagePaymentRecord(null, { ...oct }).lastMortgagePayment).toBeUndefined();
    expect(withMortgagePaymentRecord(hypoteka(), { ...hypoteka(), lastMortgagePayment: nov.lastMortgagePayment }).lastMortgagePayment).toBeUndefined();
  });

  it("záznam so zostatkom, ktorý nesedí, sa pri vykázaní ignoruje", () => {
    expect(mortgagePaymentInMonthCents({ ...nov, mortgageBalanceCents: 50_000 }, "2026-11-20")).toBe(60_000);
  });

  it("po zmazaní záznamu sa vykáže pravidlo bez záznamu: zmluvná splátka, pri splatenej 0 €", () => {
    const edited = withMortgagePaymentRecord(oct, { ...oct, monthlyPaymentCents: 55_000 });
    expect(mortgagePaymentInMonthCents(edited, "2026-10-20")).toBe(55_000);
    const paidEdited = withMortgagePaymentRecord(nov, { ...nov, monthlyPaymentCents: 55_000 });
    expect(mortgagePaymentInMonthCents(paidEdited, "2026-11-20")).toBe(0);
  });
});

describe("mimoriadne splátky a nadväznosť cez balanceBeforeCents (D-347)", () => {
  // Hypotéka 100 000 €, 3,6 %, splátka 600 €, zostatok k 1. 10.; pravidelná splátka 1. 11.
  const big = () => hypoteka({ mortgageBalanceCents: 10_000_000, mortgageRate: 0.036, balanceDate: "2026-10-01" });
  // Zápis a vrátenie mimoriadnej splátky rovnako ako ExtraPaymentForm a ExtraPaymentUndo v Majetok.tsx.
  const extra = (p: Property, date: string, amountCents: number, mode: "znizit_splatku" | "skratit_termin"): Property => {
    if (!p.balanceDate || date < p.balanceDate || amountCents > p.mortgageBalanceCents) throw new Error("formulár by zápis odmietol");
    const r = applyExtraPayment(p, amountCents, mode)!;
    const list = p.extraPayments ?? [];
    return {
      ...p, mortgageBalanceCents: r.mortgageBalanceCents, monthlyPaymentCents: r.monthlyPaymentCents,
      extraPayments: [...list, { id: `m${list.length + 1}`, date, amountCents, mode, balanceBeforeCents: p.mortgageBalanceCents, monthlyPaymentBeforeCents: p.monthlyPaymentCents ?? 0 }],
    };
  };
  const undo = (p: Property): Property => {
    const list = p.extraPayments!;
    const last = list[list.length - 1];
    return { ...p, mortgageBalanceCents: last.balanceBeforeCents!, monthlyPaymentCents: last.monthlyPaymentBeforeCents!, extraPayments: list.slice(0, -1) };
  };
  const nov = (p: Property) => mortgagePaymentInMonthCents(p, "2026-11-20");
  const sameOnScreens = (p: Property, cents: number) => expect(screens(p, "2026-11-20")).toEqual({ prehladPrijmy: cents, vydavky: cents, rozpocet: cents });

  it("A1: mimoriadna v deň výročia pred automatickým splácaním je už v zostatku po splátke", () => {
    const afterExtra = extra(big(), "2026-11-01", 830_000, "znizit_splatku");
    const p = open(afterExtra, "2026-11-01");
    expect(afterExtra.mortgageBalanceCents).toBe(9_170_000);
    expect(p.lastMortgagePayment).toEqual({ date: "2026-11-01", amountCents: 54_921, balanceAfterCents: 9_142_589 });
    expect(mortgagePaymentRecordValid(p)).toBe(true);
    expect(nov(p)).toBe(54_921);
    sameOnScreens(p, 54_921);
  });

  it("B1: mimoriadna v deň výročia po automatickom splácaní; december už nová splátka", () => {
    const afterRegular = open(big(), "2026-11-01");
    const p = extra(afterRegular, "2026-11-01", 830_000, "znizit_splatku");
    expect(afterRegular.lastMortgagePayment).toEqual({ date: "2026-11-01", amountCents: 60_000, balanceAfterCents: 9_970_000 });
    expect(p.mortgageBalanceCents).toBe(9_140_000);
    expect(p.monthlyPaymentCents).toBe(54_906);
    expect(mortgagePaymentRecordValid(p)).toBe(true);
    expect(nov(p)).toBe(60_000);
    sameOnScreens(p, 60_000); // mimoriadna splátka sa k výdavkom nepripočíta
    expect(mortgagePaymentInMonthCents(open(p, "2026-12-15"), "2026-12-15")).toBe(54_906);
  });

  it("A2: po A1 ďalšia mimoriadna 15. 11. so znížením splátky; november ostáva zaplatená suma", () => {
    const p = extra(open(extra(big(), "2026-11-01", 830_000, "znizit_splatku"), "2026-11-01"), "2026-11-15", 500_000, "znizit_splatku");
    expect(p.monthlyPaymentCents).toBe(51_918);
    expect(mortgagePaymentRecordValid(p)).toBe(true);
    expect(nov(p)).toBe(54_921);
    sameOnScreens(p, 54_921);
  });

  it("A3: mimoriadna pred splácaním, novembrová splátka je posledná (zostatok 500 € + úrok)", () => {
    const small = hypoteka({ mortgageBalanceCents: 100_000, mortgageRate: 0.036, balanceDate: "2026-10-01" });
    const p = open(extra(small, "2026-11-01", 50_000, "skratit_termin"), "2026-11-01");
    expect(p.lastMortgagePayment).toEqual({ date: "2026-11-01", amountCents: 50_150, balanceAfterCents: 0 });
    expect(nov(p)).toBe(50_150);
    expect(mortgagePaymentInMonthCents(open(p, "2026-12-15"), "2026-12-15")).toBe(0);
  });

  it("B2: mimoriadna po pravidelnej splátke splatí celý zostatok; november 600 €, december 0 €", () => {
    const afterRegular = open(big(), "2026-11-01");
    const p = extra(afterRegular, "2026-11-15", afterRegular.mortgageBalanceCents, "skratit_termin");
    expect(p.mortgageBalanceCents).toBe(0);
    expect(nov(p)).toBe(60_000);
    sameOnScreens(p, 60_000);
    expect(mortgagePaymentInMonthCents(open(p, "2026-12-15"), "2026-12-15")).toBe(0);
  });

  it("AB: mimoriadna pred aj po splácaní v ten istý deň; zostatok sa odpočíta presne raz", () => {
    const p = extra(open(extra(big(), "2026-11-01", 300_000, "znizit_splatku"), "2026-11-01"), "2026-11-01", 200_000, "znizit_splatku");
    expect(mortgagePaymentRecordValid(p)).toBe(true);
    expect(p.monthlyPaymentCents).not.toBe(p.lastMortgagePayment!.amountCents);
    expect(nov(p)).toBe(p.lastMortgagePayment!.amountCents);
    sameOnScreens(p, p.lastMortgagePayment!.amountCents);
  });

  it("viac mimoriadnych pred aj po splátke v ľubovoľnom poradí v zozname", () => {
    const before = extra(extra(big(), "2026-10-20", 200_000, "skratit_termin"), "2026-11-01", 300_000, "znizit_splatku");
    const p = extra(extra(open(before, "2026-11-01"), "2026-11-01", 100_000, "znizit_splatku"), "2026-11-12", 400_000, "znizit_splatku");
    const paid = p.lastMortgagePayment!.amountCents;
    const list = p.extraPayments!;
    const orders = [list, [...list].reverse(), [list[2], list[0], list[3], list[1]], [list[3], list[2], list[1], list[0]]];
    for (const order of orders) {
      const q = { ...p, extraPayments: order };
      expect(mortgagePaymentRecordValid(q)).toBe(true);
      expect(nov(q)).toBe(paid);
    }
  });

  it("nejednoznačná nadväznosť sa nepotvrdí: dve mimoriadne s rovnakým zostatkom pred nimi", () => {
    const r = open(big(), "2026-11-01");
    const base = r.lastMortgagePayment!.balanceAfterCents;
    const p: Property = {
      ...r, mortgageBalanceCents: base - 100_000, monthlyPaymentCents: 55_000,
      extraPayments: [
        { id: "a", date: "2026-11-05", amountCents: 100_000, mode: "skratit_termin", balanceBeforeCents: base, monthlyPaymentBeforeCents: 60_000 },
        { id: "b", date: "2026-11-06", amountCents: 200_000, mode: "skratit_termin", balanceBeforeCents: base, monthlyPaymentBeforeCents: 60_000 },
      ],
    };
    expect(mortgagePaymentRecordValid(p)).toBe(false);
    expect(nov(p)).toBe(55_000); // náhradné pravidlo, nie zaznamenaných 600 €
  });

  it("prerušená reťaz alebo nevyužitá nadväzujúca splátka sa nepotvrdí", () => {
    const r = open(big(), "2026-11-01");
    const base = r.lastMortgagePayment!.balanceAfterCents;
    const legacy: Property = { ...r, mortgageBalanceCents: base - 100_000, monthlyPaymentCents: 55_000, extraPayments: [{ id: "a", date: "2026-11-05", amountCents: 100_000, mode: "skratit_termin" }] };
    expect(mortgagePaymentRecordValid(legacy)).toBe(false);
    const unused: Property = { ...r, monthlyPaymentCents: 55_000, extraPayments: [{ id: "b", date: "2026-11-05", amountCents: 100_000, mode: "skratit_termin", balanceBeforeCents: base, monthlyPaymentBeforeCents: 60_000 }] };
    expect(mortgagePaymentRecordValid(unused)).toBe(false);
    expect(nov(unused)).toBe(55_000);
  });

  it("U1: mimoriadna a jej vrátenie v tom istom mesiaci", () => {
    const r = open(big(), "2026-11-15");
    const u = undo(extra(r, "2026-11-15", 830_000, "znizit_splatku"));
    expect(u.mortgageBalanceCents).toBe(9_970_000);
    expect(u.monthlyPaymentCents).toBe(60_000);
    expect(nov(u)).toBe(60_000);
  });

  it("U2: dve mimoriadne, vráti sa posledná", () => {
    const r = open(big(), "2026-11-15");
    const u = undo(extra(extra(r, "2026-11-12", 300_000, "skratit_termin"), "2026-11-14", 200_000, "znizit_splatku"));
    expect(u.mortgageBalanceCents).toBe(9_670_000);
    expect(mortgagePaymentRecordValid(u)).toBe(true);
    expect(nov(u)).toBe(60_000);
  });

  it("U4: vrátenie mimoriadnej, ktorá splatila celú hypotéku, v novembri aj v decembri", () => {
    const r = open(big(), "2026-11-15");
    const paid = extra(r, "2026-11-15", r.mortgageBalanceCents, "skratit_termin");
    const uNov = undo(paid);
    expect(uNov.mortgageBalanceCents).toBe(9_970_000);
    expect(nov(uNov)).toBe(60_000);
    const uDec = open(undo(open(paid, "2026-12-20")), "2026-12-20"); // pri nulovom zostatku splácanie nebeží, december sa doplní
    expect(uDec.mortgageBalanceCents).toBe(open(r, "2026-12-20").mortgageBalanceCents);
    expect(mortgagePaymentInMonthCents(uDec, "2026-12-20")).toBe(60_000);
  });

  it("U3 (otvorený problém, D-145): vrátenie po ďalšej splátke záznam nesprávne nepotvrdí", () => {
    const dec = open(extra(open(big(), "2026-11-15"), "2026-11-15", 830_000, "znizit_splatku"), "2026-12-15");
    expect(mortgagePaymentRecordValid(undo(dec))).toBe(false);
  });

  it("ručná zmena vo formulári po mimoriadnej splátke záznam zmaže", () => {
    const p = extra(open(big(), "2026-11-01"), "2026-11-15", 830_000, "znizit_splatku");
    const edited = withMortgagePaymentRecord(p, { ...p, monthlyPaymentCents: 50_000 });
    expect(edited.lastMortgagePayment).toBeUndefined();
    expect(nov(edited)).toBe(50_000);
  });
});

describe("scenár G: validácia a záloha (schéma v19)", () => {
  const nov = open(open(hypoteka(), "2026-10-15"), "2026-11-15");
  const data = (properties: Property[]): AppData => ({
    settings: null, transactions: [], snapshots: [], properties, assets: [], investments: [], liabilities: [], incomes: [], budgets: [],
    recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [],
  }) as AppData;

  it("platný záznam prejde; zlý tvar, neznáme pole a budúci dátum sa odmietnu", () => {
    expect(validateProperty(nov, "2026-11-15")).toEqual([]);
    const bad = (lastMortgagePayment: unknown) => validateProperty({ ...nov, lastMortgagePayment }, "2026-11-15").join(" ");
    expect(bad({ date: "2026-11-01", amountCents: 0, balanceAfterCents: 0 })).toMatch(/suma musí byť/);
    expect(bad({ date: "2026-11-01", amountCents: 20_000, balanceAfterCents: -1 })).toMatch(/zostatok po splátke/);
    expect(bad({ date: "2026-11-01", amountCents: 20_000, balanceAfterCents: 0, id: "x" })).toMatch(/neznáme pole/);
    expect(bad({ date: "2026-12-01", amountCents: 20_000, balanceAfterCents: 0 })).not.toBe("");
    expect(bad("200")).toMatch(/musí byť objekt/);
  });

  it("záloha v19 zachová záznam a po obnove sa november vykáže 200 €", () => {
    const json = JSON.parse(JSON.stringify(buildBackup(data([nov]), "2026-11-15T10:00:00Z")));
    expect(json.schemaVersion).toBe(SCHEMA_VERSION);
    const back = parseBackup(json, "2026-11-15");
    expect(back.ok).toBe(true);
    expect(back.data!.properties[0].lastMortgagePayment).toEqual(nov.lastMortgagePayment);
    expect(mortgagePaymentInMonthCents(back.data!.properties[0], "2026-11-20")).toBe(20_000);
  });

  it("staršia záloha v16 bez záznamu sa obnoví a splácanie záznam doplní", () => {
    const { lastMortgagePayment: _l, ...legacy } = open(hypoteka(), "2026-10-15");
    const json = { ...JSON.parse(JSON.stringify(buildBackup(data([legacy as Property]), "2026-10-15T10:00:00Z"))), schemaVersion: 16 };
    const back = parseBackup(json, "2026-10-20");
    expect(back.ok).toBe(true);
    const restored = back.data!.properties[0];
    expect(restored.lastMortgagePayment).toBeUndefined();
    expect(mortgagePaymentInMonthCents(restored, "2026-10-20")).toBe(60_000);
    expect(mortgagePaymentInMonthCents(open(restored, "2026-11-15"), "2026-11-15")).toBe(20_000);
  });

  it("verzie 17 a 18 sú rezervované a odmietnu sa; novšia ako 19 tiež", () => {
    const json = JSON.parse(JSON.stringify(buildBackup(data([]), "2026-11-15T10:00:00Z")));
    for (const v of [17, 18]) expect(parseBackup({ ...json, schemaVersion: v }, "2026-11-15")).toMatchObject({ ok: false, errors: [`neznáma verzia schémy ${v}`] });
    expect(parseBackup({ ...json, schemaVersion: 20 }, "2026-11-15")).toMatchObject({ ok: false, errors: ["záloha pochádza z novšej verzie aplikácie"] });
  });
});
