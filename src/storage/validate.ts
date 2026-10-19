import { ASSET_KINDS, PROPERTY_MODES, SOURCES, TRANSACTION_TYPES, type AppData, type Asset, type Property, type Settings, type Snapshot, type Transaction } from "./types";

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
  if (o.source !== undefined && o.type !== "vydavok" && o.type !== "investicia") errors.push(`${label}: zdroj úhrady patrí len k výdavku alebo investícii`);
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

export function validateProperty(p: unknown, today: string, label = "nehnuteľnosť"): string[] {
  if (typeof p !== "object" || p === null || Array.isArray(p)) return [`${label}: musí byť objekt`];
  const o = p as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "name", "mode", "valueCents", "valueDate", "mortgageBalanceCents", "monthlyRentCents", "monthlyPaymentCents", "monthlyOtherCostsCents", "mortgageRate", "createdAt", "updatedAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  if (o.name !== undefined && (typeof o.name !== "string" || o.name.length > 80)) errors.push(`${label}: názov max 80 znakov`);
  if (!(PROPERTY_MODES as readonly unknown[]).includes(o.mode)) errors.push(`${label}: režim musí byť z katalógu`);
  if (!isCents(o.valueCents)) errors.push(`${label}: odhad hodnoty musí byť celé číslo ≥ 0`);
  errors.push(...checkDate(o.valueDate, today, `${label}: dátum odhadu`));
  if (!isCents(o.mortgageBalanceCents)) errors.push(`${label}: zostatok hypotéky musí byť celé číslo ≥ 0`);
  if (o.monthlyRentCents !== undefined && !isCents(o.monthlyRentCents)) errors.push(`${label}: nájom musí byť celé číslo ≥ 0`);
  if (o.monthlyPaymentCents !== undefined && !isCents(o.monthlyPaymentCents)) errors.push(`${label}: splátka musí byť celé číslo ≥ 0`);
  if (o.monthlyOtherCostsCents !== undefined && !isCents(o.monthlyOtherCostsCents)) errors.push(`${label}: ostatné náklady musia byť celé číslo ≥ 0`);
  if (o.mortgageRate !== undefined && !(typeof o.mortgageRate === "number" && o.mortgageRate >= 0 && o.mortgageRate < 1)) errors.push(`${label}: úroková sadzba musí byť v [0, 1)`);
  if (typeof o.createdAt !== "string" || typeof o.updatedAt !== "string") errors.push(`${label}: chýba čas vytvorenia alebo úpravy`);
  return errors;
}

export function validateAsset(a: unknown, today: string, label = "aktívum"): string[] {
  if (typeof a !== "object" || a === null || Array.isArray(a)) return [`${label}: musí byť objekt`];
  const o = a as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "kind", "name", "valueCents", "valueDate", "createdAt", "updatedAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  if (!(ASSET_KINDS as readonly unknown[]).includes(o.kind)) errors.push(`${label}: typ musí byť automobil alebo ocenitelné právo`);
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 80) errors.push(`${label}: názov je povinný, max 80 znakov`);
  if (!isCents(o.valueCents)) errors.push(`${label}: odhad hodnoty musí byť celé číslo ≥ 0`);
  errors.push(...checkDate(o.valueDate, today, `${label}: dátum odhadu`));
  if (typeof o.createdAt !== "string" || typeof o.updatedAt !== "string") errors.push(`${label}: chýba čas vytvorenia alebo úpravy`);
  return errors;
}

export function validateSettings(s: unknown, today: string): string[] {
  if (typeof s !== "object" || s === null || Array.isArray(s)) return ["nastavenia: musia byť objekt"];
  const o = s as Record<string, unknown>;
  const errors = unknownKeys(o, ["expensesCents", "withdrawalRate", "realReturn", "reserveCents", "thresholdCents", "savingInvCents", "savingCashCents", "feesRate", "lastReviewDate"], "nastavenia");
  if (typeof o.expensesCents !== "number" || !Number.isInteger(o.expensesCents) || o.expensesCents <= 0) errors.push("nastavenia: výdavky musia byť kladné celé číslo v centoch");
  if (typeof o.withdrawalRate !== "number" || !(o.withdrawalRate > 0 && o.withdrawalRate <= 1)) errors.push("nastavenia: miera výberu musí byť v (0, 1]");
  if (typeof o.realReturn !== "number" || !(o.realReturn >= 0 && o.realReturn <= 1)) errors.push("nastavenia: výnos r musí byť v [0, 1]");
  for (const k of ["reserveCents", "thresholdCents"]) {
    if (!isCents(o[k])) errors.push(`nastavenia: ${k} musí byť celé číslo ≥ 0`);
  }
  for (const k of ["savingInvCents", "savingCashCents"]) {
    if (o[k] !== undefined && !isCents(o[k])) errors.push(`nastavenia: ${k} musí byť celé číslo ≥ 0 alebo prázdne`);
  }
  if (o.feesRate !== undefined && !(typeof o.feesRate === "number" && o.feesRate >= 0 && o.feesRate < 1)) errors.push("nastavenia: poplatky musia byť v [0, 1) alebo chýbať (D-064)");
  if (o.lastReviewDate !== undefined) errors.push(...checkDate(o.lastReviewDate, today, "nastavenia: D_L"));
  return errors;
}

/** Overí celý obsah zálohy. Pri chybe sa nič nezapíše (FR-18). */
export function validateAppData(d: unknown, today: string): Check & { data?: AppData } {
  if (typeof d !== "object" || d === null || Array.isArray(d)) return { ok: false, errors: ["záloha musí byť objekt"] };
  const o = d as Record<string, unknown>;
  const errors = unknownKeys(o, ["settings", "transactions", "snapshots", "properties", "assets"], "záloha");
  if (o.settings !== null && o.settings !== undefined) errors.push(...validateSettings(o.settings, today));
  if (!Array.isArray(o.transactions)) errors.push("záloha: transactions musí byť pole");
  else o.transactions.forEach((t, i) => errors.push(...validateTransaction(t, today, `transakcia ${i + 1}`)));
  if (!Array.isArray(o.snapshots)) errors.push("záloha: snapshots musí byť pole");
  else o.snapshots.forEach((s, i) => errors.push(...validateSnapshot(s, today, `vyhodnotenie ${i + 1}`)));
  if (!Array.isArray(o.properties)) errors.push("záloha: properties musí byť pole");
  else o.properties.forEach((p, i) => errors.push(...validateProperty(p, today, `nehnuteľnosť ${i + 1}`)));
  const ids = (arr: unknown[]) => arr.map((x) => (x as { id?: unknown })?.id);
  if (!Array.isArray(o.assets)) errors.push("záloha: assets musí byť pole");
  else o.assets.forEach((a, i) => errors.push(...validateAsset(a, today, `aktívum ${i + 1}`)));
  const propertyList = Array.isArray(o.properties) ? (o.properties as unknown[]) : [];
  const assetList = Array.isArray(o.assets) ? (o.assets as unknown[]) : [];
  for (const [name, list] of [["transakcie", ids(o.transactions as unknown[])], ["vyhodnotenia", ids(o.snapshots as unknown[])], ["majetok", ids(propertyList)], ["aktíva", ids(assetList)]] as const) {
    if (new Set(list).size !== list.length) errors.push(`záloha: duplicitné id v ${name}`);
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      settings: (o.settings as Settings | null) ?? null,
      transactions: o.transactions as Transaction[],
      snapshots: o.snapshots as Snapshot[],
      properties: o.properties as Property[],
      assets: o.assets as Asset[],
    },
  };
}
