/**
 * Modul FINANČNÉ CIELE (BLOK 4): výpočet individuálnych cieľov a ich dosiahnuteľnosti.
 * Lineárny model bez výnosu: n = ceil((T - K0) / mGoal)
 * Hranica: 1200 mesiacov (100 rokov) pre rozlíšenie medzi "feasible" a "long_horizon"
 */

import { PersonalGoal } from './model/entities';
import { targetDate } from './goal';

export const MAX_MONTHS = 600; // Stare MAX pre compatibility
export const LONG_HORIZON_MONTHS = 1200; // Nová hranica pre BLOK 4

export interface PersonalGoalResult {
  status: "achieved" | "feasible" | "long_horizon" | "impossible" | "invalid";
  months: number | null;
  targetDate: string | null;
  reason: string;
}

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

/**
 * Výpočet mesiacov s kompletným statusom a dátumom (BLOK 4).
 * Vstup: targetCents (T), currentCapitalCents (K0), monthlySavingCents (mGoal)
 * Vzorec: n = ceil((T - K0) / mGoal)
 */
export function monthsToPersonalGoalWithStatus(
  targetCents: number | undefined,
  currentCapitalCents: number | undefined,
  monthlySavingCents: number | undefined,
): PersonalGoalResult {
  // Validácia vstupov
  if (targetCents === undefined || targetCents === null) {
    return {
      status: "invalid",
      months: null,
      targetDate: null,
      reason: "Cieľová suma chýba",
    };
  }

  if (currentCapitalCents === undefined || currentCapitalCents === null) {
    return {
      status: "invalid",
      months: null,
      targetDate: null,
      reason: "Počiatočný kapitál K0 chýba",
    };
  }

  // Ak K0 >= T: cieľ je dosiahnutý
  if (currentCapitalCents >= targetCents) {
    return {
      status: "achieved",
      months: 0,
      targetDate: new Date().toISOString().split("T")[0],
      reason: "Cieľ je dosiahnutý",
    };
  }

  // Ak K0 < T a mGoal <= 0: nedosiahnuteľný
  if (!monthlySavingCents || monthlySavingCents <= 0) {
    return {
      status: "impossible",
      months: null,
      targetDate: null,
      reason: "Pri aktuálnom mesačnom príspevku nedosiahnuteľný.",
    };
  }

  // Výpočet počtu mesiacov
  const needed = targetCents - currentCapitalCents;
  const n = Math.ceil(needed / monthlySavingCents);

  // Rozlíšenie podľa hranice 1200 mesiacov
  let statusKind: "feasible" | "long_horizon";
  let calculatedDate: string | null = null;

  if (n > LONG_HORIZON_MONTHS) {
    statusKind = "long_horizon";
  } else {
    statusKind = "feasible";
    // Výpočet dátumu iba pre feasible
    const today = new Date();
    const isoToday = today.toISOString().split("T")[0];
    calculatedDate = targetDate(isoToday, n);
  }

  return {
    status: statusKind,
    months: n,
    targetDate: calculatedDate,
    reason:
      statusKind === "feasible"
        ? `Cieľ dosiahnuť za ${n} mesiacov`
        : "Cieľ za viac ako 100 rokov",
  };
}

/**
 * Validácia cieľového roku a mesiaca.
 */
export function validatePersonalGoalDate(
  targetYear: number | undefined,
  targetMonth: number | undefined,
): { valid: boolean; reason?: string } {
  if (targetYear === undefined || targetYear === null) {
    return { valid: false, reason: "Rok dosiahnutia chýba" };
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Validácia: rok v minulosti
  if (targetYear < currentYear) {
    return { valid: false, reason: "Rok dosiahnutia je v minulosti" };
  }

  // Validácia: mesiac v minulosti (ak je rok = aktuálny rok)
  if (targetYear === currentYear && targetMonth && targetMonth < currentMonth) {
    return { valid: false, reason: "Mesiac dosiahnutia je v minulosti" };
  }

  return { valid: true };
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
