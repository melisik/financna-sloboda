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
 * Výpočet mesiacov k dosiahnutiu individuálneho finančného cieľa.
 * Lineárny model (bez výnosu):
 * K(n) = K0 + mGoal × n
 * n = ceil((T − K0) / mGoal)
 *
 * @param k0Cents Počiatočný kapitál určený na cieľ (€ v centoch)
 * @param targetCents Cieľová suma (€ v centoch)
 * @param monthlyGoalCents Mesačný príspevek na cieľ (€ v centoch)
 * @returns Počet mesiacov (celočíslo) alebo null ak nedosiahnuteľný
 */
export function monthsToPersonalGoal(
  k0Cents: number,
  targetCents: number,
  monthlyGoalCents: number,
): number | null {
  // Validácia vstupov
  if (targetCents < 0 || k0Cents < 0 || monthlyGoalCents < 0) {
    return null; // Neplatné vstupné hodnoty
  }

  // Cieľ je už dosiahnutý
  if (k0Cents >= targetCents) {
    return 0;
  }

  // Cieľ je nedosiahnuteľný (bez príspevku, ale nedostatok kapitálu)
  if (monthlyGoalCents === 0) {
    return null;
  }

  // Lineárny výpočet: potrebný príspevok
  const needed = targetCents - k0Cents;
  const months = Math.ceil(needed / monthlyGoalCents);

  return months;
}

/**
 * Analýza individuálneho cieľa s klasifikáciou dosiahnuteľnosti.
 * Lineárny model — cieľ bez výnosu.
 * K0 (počiatočný kapitál) je z goal.currentCapitalCents, nie z externého parametra.
 */
export function analyzePersonalGoal(
  goal: PersonalGoal,
): PersonalGoalAnalysis {
  const k0Cents = goal.currentCapitalCents ?? 0; // K0 z individuálneho cieľa
  const monthlyGoal = goal.monthlySavingCents ?? 0;
  const months = monthsToPersonalGoal(
    k0Cents,
    goal.targetCents,
    monthlyGoal,
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
    currentCents: k0Cents,
    monthlyAdditionCents: monthlyGoal,
    monthsToTarget: months,
    classification,
    flexible: goal.flexible ?? false,
    note: goal.note,
  };
}

/**
 * Kontrola, či suma príspevkov na individuálne ciele neprekročí voľný peňažný tok.
 * @param freeCashFlowCents Voľný mesačný peňažný tok (m)
 * @param personalGoalsCents Príspevky na individuálne ciele
 * @returns null ak je v poriadku, alebo prekročenie v centoch
 */
export function checkGoalContributionsSurplus(
  freeCashFlowCents: number,
  personalGoalsCents: number,
): number | null {
  const surplus = personalGoalsCents - freeCashFlowCents;
  if (surplus > 0) {
    return surplus;
  }
  return null;
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
