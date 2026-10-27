import type { Position, TaxRegime } from "./model/entities";
import { TAX_REGIMES } from "./model/entities";
import { positionValueCents } from "./investments";

/**
 * Katalóg daňových režimov (FR-24). Každý parameter má zdroj, dátum platnosti a stav.
 * Zatiaľ žiadny parameter nie je overený, sadzby nie sú zadané (D-104): scenár po dani sa nepočíta.
 */
interface TaxRegimeParams {
  id: TaxRegime;
  label: string;
  rate: number | null; // sadzba po overení; zatiaľ null
  source: string | null;
  validFrom: string | null;
  status: "neoverené" | "overené";
}

export const TAX_CATALOG: Record<TaxRegime, TaxRegimeParams> = {
  nezadane: { id: "nezadane", label: "Nezadané", rate: null, source: null, validFrom: null, status: "neoverené" },
  zdanene: { id: "zdanene", label: "Zdanené", rate: null, source: null, validFrom: null, status: "neoverené" },
  oslobodene: { id: "oslobodene", label: "Oslobodené", rate: null, source: null, validFrom: null, status: "neoverené" },
};

/** Riadok daňového scenára: hodnota investícií v režime a stav výpočtu po dani. */
interface TaxLine {
  regime: TaxRegime;
  label: string;
  valueCents: number;
  afterTaxCents: null; // zatiaľ vždy null: vzorec vyžaduje overené pravidlá (D-104)
}

/** Hodnota investícií rozdelená podľa daňového režimu. Položky bez režimu sú „nezadané”. */
export function taxScenario(positions: Position[]): TaxLine[] {
  return TAX_REGIMES.map((regime) => ({
    regime,
    label: TAX_CATALOG[regime].label,
    valueCents: positions
      .filter((p) => (p.taxRegime ?? "nezadane") === regime)
      .reduce((sum, p) => sum + positionValueCents(p), 0),
    afterTaxCents: null,
  }));
}

// --- Danovy engine (D-339) ---
// Sadzby su predpoklad; overenie G1. Vypocet je informativny, nie danove poradenstvo.

export type AssetClass = "stocks_etf" | "crypto" | "real_estate" | "cash";

export interface TaxContext {
  grossReturnRate: number;
  assetClass: AssetClass;
  holdingPeriodYears: number;
}

export interface TaxPolicy {
  id: string;
  name: string;
  calculateNetReturn(ctx: TaxContext): number;
}

export const slovakTaxPolicy: TaxPolicy = {
  id: "sk",
  name: "Slovensko",
  calculateNetReturn(ctx) {
    if (ctx.assetClass === "stocks_etf" && ctx.holdingPeriodYears >= 1) return ctx.grossReturnRate;
    return ctx.grossReturnRate * (1 - 0.19);
  },
};

export function taxAdjustedReturn(grossReturn: number, assetClass: AssetClass, holdingPeriodYears: number): number {
  return slovakTaxPolicy.calculateNetReturn({ grossReturnRate: grossReturn, assetClass, holdingPeriodYears });
}
