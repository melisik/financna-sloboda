/**
 * Modul FINANČNÉ CIELE: výpočet individuálnych cieľov a ich dosiahnuteľnosti.
 * Vzorce: K_inv(n) = K_inv(0) × (1+i)^n + mInv × ((1+i)^n − 1) / i
 *         K_cash(n) = K_cash(0) + mCash × n
 *         K_total(n) = K_inv(n) + K_cash(n) + K_nem
 * MAX_MONTHS = 600 (50 rokov) pre klasifikáciu dosiahnuteľnosti.
 */

import { PersonalGoal } from './model/entities';

export const MAX_MONTHS = 600;

export interface PersonalGoalAnalysis {
  goal: PersonalGoal;
  targetCents: number;
  currentCents: number;
  monthlyAdditionCents: number;
  monthsToTarget: number | null; // null = matematicky nedosiahnuteľný
  classification: 'dosiahnutelny' | 'horizont_50plus' | 'nedosiahnutelny';
  flexible: boolean;
  note?: string;
}

/** Mesiacov z dátumu targetYear a targetMonth k dnešnému dňu (dnešný deň = mesiac 0). */
export function monthsToTarget(targetYear: number, targetMonth?: number): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const month = targetMonth ?? 12;
  const diff = (targetYear - currentYear) * 12 + (month - currentMonth);
  return Math.max(0, diff);
}

/**
 * Výpočet mesiacov k dosiahnutiu finančného cieľa.
 * K_total(n) = K_inv(n) + K_cash(n) + K_nem >= targetCents
 * Vracia presný (spojitý) počet mesiacov.
 */
export function monthsToPersonalGoal(
  currentCents: number,
  targetCents: number,
  kInv0: number,
  kCash0: number,
  kNem: number,
  mInv: number,
  mCash: number,
  monthlyRate: number, // i = (1+r)^(1/12) - 1
  additionalMCash: number = 0, // mesačný príspevek na cieľ
): number | null {
  // Ak už máme dosť peňazí bez výnosu a sporenia
  const totalCapital = kInv0 + kCash0 + kNem;
  if (totalCapital >= targetCents) {
    return 0;
  }

  const totalMCash = mCash + additionalMCash;
  const i = monthlyRate;

  // Ako sa K_inv mení
  // K_inv(n) = K_inv(0) × (1+i)^n + mInv × ((1+i)^n − 1) / i
  // K_cash(n) = K_cash(0) + (mCash + additionalMCash) × n
  // K_total(n) = K_inv(n) + K_cash(n) + K_nem

  // Cieľ: K_inv(n) + K_cash(n) + K_nem = targetCents
  // K_inv(0) × (1+i)^n + mInv × ((1+i)^n − 1) / i + K_cash(0) + mCash × n + K_nem = targetCents

  // Definuj: T = targetCents - kNem, a = kInv0, b = mInv, c = kCash0, d = mCash
  // a × (1+i)^n + b × ((1+i)^n − 1) / i + c + d × n = T
  // (a + b/i) × (1+i)^n - b/i + c + d × n = T
  // (a + b/i) × (1+i)^n + d × n = T - c + b/i

  // Numerické riešenie: iterácia
  for (let n = 0; n <= MAX_MONTHS * 10; n += 0.001) {
    const expFactor = Math.pow(1 + i, n);
    const kInvN = kInv0 * expFactor + (i > 0 ? mInv * (expFactor - 1) / i : 0);
    const kCashN = kCash0 + totalMCash * n;
    const kTotalN = kInvN + kCashN + kNem;

    if (kTotalN >= targetCents) {
      return n;
    }
  }

  return null; // matematicky nedosiahnuteľný
}

/**
 * Analýza individuálneho cieľa s klasifikáciou dosiahnuteľnosti.
 */
export function analyzePersonalGoal(
  goal: PersonalGoal,
  currentCents: number,
  kInv0: number,
  kCash0: number,
  kNem: number,
  mInv: number,
  mCash: number,
  monthlyRate: number,
): PersonalGoalAnalysis {
  const additionalMCash = goal.monthlySavingCents ?? 0;
  const months = monthsToPersonalGoal(
    currentCents,
    goal.targetCents,
    kInv0,
    kCash0,
    kNem,
    mInv,
    mCash,
    monthlyRate,
    additionalMCash,
  );

  let classification: 'dosiahnutelny' | 'horizont_50plus' | 'nedosiahnutelny';
  if (months === null) {
    classification = 'nedosiahnutelny';
  } else if (months <= MAX_MONTHS) {
    classification = 'dosiahnutelny';
  } else {
    classification = 'horizont_50plus';
  }

  return {
    goal,
    targetCents: goal.targetCents,
    currentCents,
    monthlyAdditionCents: additionalMCash,
    monthsToTarget: months,
    classification,
    flexible: goal.flexible ?? false,
    note: goal.note,
  };
}

/** Konverzia mesiacov na roky a zvyšné mesiace. */
export function formatMonths(months: number | null): string {
  if (months === null) return 'matematicky nedosiahnuteľný';
  if (months === 0) return 'teraz';

  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);

  if (years === 0) {
    return `${remainingMonths} mesiacov`;
  }
  if (remainingMonths === 0) {
    return `${years} rokov`;
  }
  return `${years} rokov ${remainingMonths} mesiacov`;
}
