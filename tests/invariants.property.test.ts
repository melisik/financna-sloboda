import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { monthlyRate, monthsToTarget } from "../src/domain/goal";
import { impactMonths } from "../src/domain/impact";
import { payFromCash, payFromInvestments, transferToInvestments, type Capital } from "../src/domain/capital";

// Invarianty z docs/07, oddiel 4: property-based testy pre bránu M1 (D-222). Sumy v centoch, náhodné vstupy.
const CAPITAL = fc.integer({ min: 0, max: 1_000_000_000 }); // do 10 000 000 €
const SAVING = fc.integer({ min: 0, max: 1_000_000 }); // do 10 000 € mesačne
// Nulová sadzba je osobitný prípad. Nenulové sadzby pod 1e-12 nie sú zmysluplné (a denormalizované čísla kazia presnosť).
const RATE = fc.oneof(fc.constant(0), fc.double({ min: 1e-12, max: 0.1, noNaN: true }));
const TARGET = fc.integer({ min: 100_000, max: 1_000_000_000 }); // od 1 000 € do 10 000 000 €

const TOL = 1e-6;

/** a ≥ b v rozšírených reálnych číslach: null znamená nedosiahnuteľné (nekonečno). */
const atLeast = (a: number | null, b: number | null): boolean => (a === null ? true : b === null ? false : a >= b - TOL);

describe("invarianty: hraničná podmienka (docs/07, oddiel 4)", () => {
  it("K_uzavretý(k−1) < T ≤ K_uzavretý(k) pre k = ⌈n − 1e-6⌉, aj pri r = 0", () => {
    fc.assert(
      fc.property(CAPITAL, SAVING, RATE, TARGET, (k0, m, r, t) => {
        const n = monthsToTarget(k0, m, r, t);
        fc.pre(n !== null && n > 0 && Number.isFinite(n));
        const k = Math.ceil(n! - TOL);
        fc.pre(k >= 1);
        const i = monthlyRate(r);
        const closed = (months: number) =>
          i === 0 ? k0 + m * months : k0 * Math.exp(months * Math.log1p(i)) + (m * Math.expm1(months * Math.log1p(i))) / i;
        expect(closed(k - 1)).toBeLessThan(t * (1 + 1e-9));
        expect(closed(k)).toBeGreaterThanOrEqual(t * (1 - 1e-9));
      }),
      { numRuns: 500 },
    );
  });
});

describe("invarianty: monotónnosť (docs/07, oddiel 4)", () => {
  it("n nerastie so zvyšovaním K", () => {
    fc.assert(
      fc.property(CAPITAL, CAPITAL, SAVING, RATE, TARGET, (a, b, m, r, t) => {
        const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
        expect(atLeast(monthsToTarget(lo, m, r, t), monthsToTarget(hi, m, r, t))).toBe(true);
      }),
      { numRuns: 300 },
    );
  });

  it("n nerastie so zvyšovaním m", () => {
    fc.assert(
      fc.property(CAPITAL, SAVING, SAVING, RATE, TARGET, (k, a, b, r, t) => {
        const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
        expect(atLeast(monthsToTarget(k, lo, r, t), monthsToTarget(k, hi, r, t))).toBe(true);
      }),
      { numRuns: 300 },
    );
  });

  it("n nerastie so zvyšovaním r (porovnávame celé mesiace, ktoré používa dátum cieľa, D-024)", () => {
    // Pri zlomkovom n pod 1 (cieľ sa dosiahne v prvom mesiaci) spojitá interpolácia v r nemonotónna; dátum takéto n nepoužíva.
    const whole = (n: number | null) => (n === null ? null : Math.ceil(n - TOL));
    fc.assert(
      fc.property(CAPITAL, SAVING, RATE, RATE, TARGET, (k, m, a, b, t) => {
        const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
        expect(atLeast(whole(monthsToTarget(k, m, lo, t)), whole(monthsToTarget(k, m, hi, t)))).toBe(true);
      }),
      { numRuns: 300 },
    );
  });

  it("n nerastie s klesaním T", () => {
    fc.assert(
      fc.property(CAPITAL, SAVING, RATE, TARGET, TARGET, (k, m, r, a, b) => {
        const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
        expect(atLeast(monthsToTarget(k, m, r, hi), monthsToTarget(k, m, r, lo))).toBe(true);
      }),
      { numRuns: 300 },
    );
  });
});

describe("invarianty: predbežný dopad (docs/07, oddiel 4)", () => {
  it("bez transakcií po poslednom vyhodnotení je dopad 0 (a výdavok z príjmu nemení K, teda ani n)", () => {
    fc.assert(
      fc.property(CAPITAL, SAVING, RATE, TARGET, (k, m, r, t) => {
        const d = impactMonths(k, k, m, r, t);
        if (monthsToTarget(k, m, r, t) === null) expect(d).toBeNull();
        else expect(d).toBe(0);
      }),
      { numRuns: 300 },
    );
  });

  it("sporenie alebo investícia nikdy nezhorší dátum (n_pred ≤ n_base)", () => {
    fc.assert(
      fc.property(CAPITAL, fc.nat(1_000_000_000), SAVING, RATE, TARGET, (k, add, m, r, t) => {
        const d = impactMonths(k, k + add, m, r, t);
        if (d !== null) expect(d).toBeGreaterThanOrEqual(-TOL);
      }),
      { numRuns: 300 },
    );
  });

  it("výdavok z kapitálu nikdy nezlepší dátum (n_pred ≥ n_base)", () => {
    fc.assert(
      fc.property(CAPITAL, fc.nat(1_000_000_000), SAVING, RATE, TARGET, (k, sub, m, r, t) => {
        const pending = k - Math.min(sub, k);
        const d = impactMonths(k, pending, m, r, t);
        if (d !== null) expect(d).toBeLessThanOrEqual(TOL);
      }),
      { numRuns: 300 },
    );
  });
});

describe("invarianty: nezápornosť kapitálu a celé centy (docs/07, oddiel 4)", () => {
  type Op = { kind: "cash" | "inv" | "transfer"; amount: number };
  const OP = fc.record({
    kind: fc.constantFrom<Op["kind"]>("cash", "inv", "transfer"),
    amount: fc.integer({ min: 0, max: 100_000_000 }),
  });

  it("K_inv a K_cash nikdy nie sú záporné a zostávajú celé čísla pri ľubovoľnej postupnosti výdavkov", () => {
    fc.assert(
      fc.property(CAPITAL, CAPITAL, fc.array(OP, { maxLength: 30 }), (inv, cash, ops) => {
        let c: Capital = { inv, cash };
        for (const o of ops) {
          const r = o.kind === "cash" ? payFromCash(c, o.amount) : o.kind === "inv" ? payFromInvestments(c, o.amount) : transferToInvestments(c, o.amount);
          if (!r.ok) continue;
          c = r.capital;
          expect(c.inv).toBeGreaterThanOrEqual(0);
          expect(c.cash).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(c.inv) && Number.isInteger(c.cash)).toBe(true);
        }
      }),
      { numRuns: 300 },
    );
  });
});
