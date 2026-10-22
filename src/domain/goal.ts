/**
 * Cieľová suma (FR-01): T = V / p.
 * Sumy sú v centoch (05 §4); p je ročná miera výberu ako desatinné číslo (0,04 = 4 %).
 */
export function targetAmountCents(annualExpensesCents: number, withdrawalRate: number): number {
  if (!(annualExpensesCents > 0) || !(withdrawalRate > 0)) {
    throw new RangeError("Ročné výdavky aj miera výberu musia byť kladné (FR-01).");
  }
  return Math.round(annualExpensesCents / withdrawalRate);
}

/** Mesačná sadzba z ročnej reálnej: i = (1 + r)^(1/12) − 1 (FR-02). */
export function monthlyRate(annualRate: number): number {
  // expm1/log1p zachovajú presnosť pri malých sadzbách (invariant monotónnosti v r, docs/07 oddiel 4).
  return Math.expm1(Math.log1p(annualRate) / 12);
}

/**
 * Počet mesiacov do cieľa (FR-02). Sumy v centoch.
 * Poradie vetiev je záväzné (04 FR-02):
 *  1) K ≥ T → 0 (cieľ dosiahnutý),
 *  2) K·i + m = 0 → null (nedosiahnuteľné, delenie nulou by inak nastalo),
 *  3) r = 0 → (T − K) / m,
 *  4) inak n = ln((T·i + m) / (K·i + m)) / ln(1 + i).
 */
export function monthsToTarget(
  capitalCents: number,
  monthlySavingCents: number,
  annualRate: number,
  targetCents: number,
): number | null {
  if (capitalCents >= targetCents) return 0;
  const i = monthlyRate(annualRate);
  if (capitalCents * i + monthlySavingCents === 0) return null;
  if (i === 0) return monthlySavingCents > 0 ? (targetCents - capitalCents) / monthlySavingCents : null;
  // (T·i + m) / (K·i + m) = 1 + (T − K)·i / (K·i + m): tvar log1p je presný aj pre veľmi malé i.
  const n = Math.log1p(((targetCents - capitalCents) * i) / (capitalCents * i + monthlySavingCents)) / Math.log1p(i);
  // Záporné sporenie môže cieľ urobiť nedosiahnuteľným: log nekladného pomeru dá NaN alebo záporný čas (nález 5).
  return n >= 0 ? n : null;
}

/**
 * Dátum cieľa = D_L + ceil(n − 1e-6) mesiacov, orezané na posledný deň cieľového mesiaca (D-024, 07 §5).
 * D_L je ISO dátum "YYYY-MM-DD" bez časovej zóny (05 §4).
 */
export function targetDate(lastReviewIso: string, months: number): string {
  const [y, m, d] = lastReviewIso.split("-").map(Number);
  const addMonths = Math.ceil(months - 1e-6);
  const total = (m - 1) + addMonths;
  const year = y + Math.floor(total / 12);
  const month = (total % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
