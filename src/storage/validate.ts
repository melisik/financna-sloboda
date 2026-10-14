import { SOURCES, TRANSACTION_TYPES, type AppData, type Settings, type Snapshot, type Transaction } from "./types";

export type Check = { ok: true } | { ok: false; errors: string[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Platný kalendárny dátum „YYYY-MM-DD“ a nie v budúcnosti (ak je zadaný today). */
export function checkDate(value: unknown, today: string, label: string): string[] {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return [`${label}: dátum musí mať tvar RRRR-MM-DD`];
  const [y, m, d] = value.split("-").map(Number);
  const real = new Date(Date.UTC(y, m - 1, d));
  if (real.getUTCFullYear() !== y || real.getUTCMonth() !== m - 1 || real.getUTCDate() !== d) {
    return [`${label}: neexistujúci dátum`];
  }
  if (value > today) return [`${label}: dátum nesmie byť v budúcnosti`];
  return [];
}

function unknownKeys(obj: Record<string, unknown>, allowed: readonly string[], label: string): string[] {
  return Object.keys(obj)
    .filter((k) => !allowed.includes(k))
    .map((k) => `${label}: neznáme pole „${k}“`);
}

const isCents = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0;

export function validateTransaction(t: unknown, today: string, label = "transakcia"): string[] {
  if (typeof t !== "object" || t === null || Array.isArray(t)) return [`${label}: musí byť objekt`];
  const o = t as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "date", "type", "amountCents", "source", "belowThreshold", "note", "createdAt", "updatedAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  errors.push(...checkDate(o.date, today, label));
  if (!TRANSACTION_TYPES.includes(o.type as never)) errors.push(`${label}: neznámy typ`);
  if (typeof o.amountCents !== "number" || !Number.isInteger(o.amountCents) || o.amountCents <= 0) {
    errors.push(`${label}: suma musí byť kladné celé číslo v centoch`);
  }
  if (o.type === "vydavok" && !SOURCES.includes(o.source as never)) errors.push(`${label}: výdavok vyžaduje zdroj úhrady`);
  if (o.source !== undefined && !SOURCES.includes(o.source as never)) errors.push(`${label}: neznámy zdroj úhrady`);
  if (o.note !== undefined && (typeof o.note !== "string" || o.note.length > 200)) errors.push(`${label}: poznámka max 200 znakov`);
  if (typeof o.createdAt !== "string" || typeof o.updatedAt !== "string") errors.push(`${label}: chýba čas vytvorenia alebo úpravy`);
  return errors;
}

export function validateSnapshot(s: unknown, today: string, label = "vyhodnotenie"): string[] {
  if (typeof s !== "object" || s === null || Array.isArray(s)) return [`${label}: musí byť objekt`];
  const o = s as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "date", "investmentsCents", "cashCents", "createdAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  errors.push(...checkDate(o.date, today, label));
  if (!isCents(o.investmentsCents)) errors.push(`${label}: hodnota investícií musí byť celé číslo ≥ 0`);
  if (!isCents(o.cashCents)) errors.push(`${label}: nasporená suma musí byť celé číslo ≥ 0`);
  if (typeof o.createdAt !== "string") errors.push(`${label}: chýba čas vytvorenia`);
  return errors;
}

export function validateSettings(s: unknown, today: string): string[] {
  if (typeof s !== "object" || s === null || Array.isArray(s)) return ["nastavenia: musia byť objekt"];
  const o = s as Record<string, unknown>;
  const errors = unknownKeys(o, ["expensesCents", "withdrawalRate", "realReturn", "reserveCents", "thresholdCents", "savingInvCents", "savingCashCents", "lastReviewDate"], "nastavenia");
  if (typeof o.expensesCents !== "number" || !Number.isInteger(o.expensesCents) || o.expensesCents <= 0) errors.push("nastavenia: výdavky musia byť kladné celé číslo v centoch");
  if (typeof o.withdrawalRate !== "number" || !(o.withdrawalRate > 0 && o.withdrawalRate <= 1)) errors.push("nastavenia: miera výberu musí byť v (0, 1]");
  if (typeof o.realReturn !== "number" || !(o.realReturn >= 0 && o.realReturn <= 1)) errors.push("nastavenia: výnos r musí byť v [0, 1]");
  for (const k of ["reserveCents", "thresholdCents", "savingInvCents", "savingCashCents"]) {
    if (!isCents(o[k])) errors.push(`nastavenia: ${k} musí byť celé číslo ≥ 0`);
  }
  if (o.lastReviewDate !== undefined) errors.push(...checkDate(o.lastReviewDate, today, "nastavenia: D_L"));
  return errors;
}

/** Overí celý obsah zálohy. Pri chybe sa nič nezapíše (FR-18). */
export function validateAppData(d: unknown, today: string): Check & { data?: AppData } {
  if (typeof d !== "object" || d === null || Array.isArray(d)) return { ok: false, errors: ["záloha musí byť objekt"] };
  const o = d as Record<string, unknown>;
  const errors = unknownKeys(o, ["settings", "transactions", "snapshots"], "záloha");
  if (o.settings !== null && o.settings !== undefined) errors.push(...validateSettings(o.settings, today));
  if (!Array.isArray(o.transactions)) errors.push("záloha: transactions musí byť pole");
  else o.transactions.forEach((t, i) => errors.push(...validateTransaction(t, today, `transakcia ${i + 1}`)));
  if (!Array.isArray(o.snapshots)) errors.push("záloha: snapshots musí byť pole");
  else o.snapshots.forEach((s, i) => errors.push(...validateSnapshot(s, today, `vyhodnotenie ${i + 1}`)));
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      settings: (o.settings as Settings | null) ?? null,
      transactions: o.transactions as Transaction[],
      snapshots: o.snapshots as Snapshot[],
    },
  };
}
