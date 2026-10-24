import { describe, expect, it } from "vitest";
import { capitalWithFlags } from "../src/domain/ledger";
import { payFromCash, payFromInvestments, transferToInvestments } from "../src/domain/capital";
import type { Snapshot, Transaction } from "../src/storage/types";

const eur = (x: number) => x * 100;

// Vyhodnotenie D_L = 2026-09-30: investície 100 000 €, hotovosť 50 000 €
const snap: Snapshot = {
  id: "s",
  date: "2026-09-30",
  investmentsCents: eur(100_000),
  cashCents: eur(50_000),
  createdAt: "2026-09-30T10:00:00Z",
};

const tx = (over: Partial<Transaction> & Pick<Transaction, "id" | "type" | "amountCents">): Transaction => ({
  date: "2026-10-05",
  createdAt: "2026-10-05T10:00:00Z",
  updatedAt: "2026-10-05T10:00:00Z",
  ...over,
});

describe("výdavky nad kapitál: prečerpanie a zdroj úhrady (D-045, D-059, D-167, GC-15)", () => {
  it("výdavok z investícií nad K_inv: K_inv je 0, K_cash sa nemení, presah je len v prečerpaní", () => {
    // K_inv 100 000 € − výdavok 300 000 € = −200 000 € → K_inv = 0, presah 200 000 € sa nezapočíta do K.
    const r = capitalWithFlags(snap, [tx({ id: "e1", type: "vydavok", amountCents: eur(300_000), source: "z_investicii" })]);
    expect(r.capital).toEqual({ inv: 0, cash: eur(50_000) });
    expect(r.negative).toEqual({ inv: true, cash: false });
    expect(r.shortfall).toEqual({ inv: eur(200_000), cash: 0 });
  });

  it("výdavok z hotovosti nad K_cash: K_cash je 0 a presah sa ukáže ako prečerpanie (D-045, R2)", () => {
    // K_cash 50 000 € − výdavok 60 000 € = −10 000 € → K_cash = 0, presah 10 000 € je len v prečerpaní.
    const r = capitalWithFlags(snap, [tx({ id: "e2", type: "vydavok", amountCents: eur(60_000), source: "z_hotovosti" })]);
    expect(r.capital.cash).toBe(0);
    expect(r.negative.cash).toBe(true);
    expect(r.shortfall.cash).toBe(eur(10_000));
  });

  it("transakcia zadaná po vyhodnotení s dátumom pred ním sa počíta do K (D-123); zadaná pred ním nie", () => {
    const sporenie50 = (id: string, createdAt: string) =>
      tx({ id, type: "sporenie", date: "2026-09-01", amountCents: eur(50), createdAt });
    // zabudnutý výdavok zadaný až po vyhodnotení (2026-10-15) ovplyvní K
    expect(capitalWithFlags(snap, [sporenie50("late", "2026-10-15T09:00:00Z")]).capital.cash).toBe(eur(50_050));
    // rovnaká položka zadaná pred vyhodnotením je už v jeho hodnote
    expect(capitalWithFlags(snap, [sporenie50("early", "2026-09-15T09:00:00Z")]).capital.cash).toBe(eur(50_000));
  });

  // nález T4 (docs/30): rozhodnutie zakladateľa je otvorené (D-167, Q2). Kód zodpovedá D-059 a D-167 (test vyššie).
  // Pri príklade vyššie (K_L = 150 000 €, výdavok 300 000 € z investícií) dávajú pravidlá tri rôzne K_pred:
  // kód 50 000 € (K_cash sa nemení), FR-04 literálne max(0; K_L + Σ − Σ) = 0 €, D-074 (zablokovať) 150 000 €.
  it.todo("nález T4: výdavok z investícií nad K_inv má mať zvolené pravidlo (kód 50 000 €, FR-04 0 €, D-074 zablokovať 150 000 €)");

  // nález T6 (docs/30): doména prijme zápornú sumu presunu alebo výdavku a zvýši K. UI to blokuje (Transakcie.tsx:79, 187),
  // takže ide o obranu do hĺbky. Test: payFromCash(K_cash 100 €, suma −50 €) dá K_cash 150 € (src/domain/capital.ts:68-70).
  it("nález T6: záporná suma výdavku ani presunu nesmie zvýšiť K (kladná suma je invariant, docs/05 §4)", () => {
    const c = { inv: eur(100), cash: eur(100) };
    expect(payFromCash(c, -eur(50))).toEqual({ ok: false, reason: "invalid_amount" });
    expect(payFromInvestments(c, -eur(50))).toEqual({ ok: false, reason: "invalid_amount" });
    expect(transferToInvestments(c, -eur(50))).toEqual({ ok: false, reason: "invalid_amount" });
  });
});
