import { isReceiptId } from "../domain/receipt";
import { ASSET_KINDS, BUDGET_CATEGORIES, INCOME_FREQUENCIES, INCOME_KINDS, INVESTMENT_KINDS, LIABILITY_KINDS, PROPERTY_MODES, RECURRING_FREQUENCIES, SOURCES, STOCK_UNITS, TAX_REGIMES, TRANSACTION_TYPES, type AppData, type Recipe, type ReceiptItem, type Asset, type Budget, type Liability, type Position, type Property, type RecurringExpense, type RegularIncome, type StockItem, type Settings, type Snapshot, type Transaction } from "./types";

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
  const errors = unknownKeys(o, ["id", "date", "type", "amountCents", "source", "belowThreshold", "note", "category", "receiptId", "receiptItems", "createdAt", "updatedAt"], label);
  if (o.receiptId !== undefined && (o.type !== "vydavok" || !isReceiptId(o.receiptId))) errors.push(`${label}: číslo dokladu patrí len k výdavku a má 20 až 40 znakov`);
  if (o.receiptItems !== undefined) {
    if (o.type !== "vydavok" || !Array.isArray(o.receiptItems)) errors.push(`${label}: položky dokladu patria len k výdavku`);
    else o.receiptItems.forEach((i, n) => errors.push(...validateReceiptItem(i, `${label}, položka ${n + 1}`)));
  }
  if (o.category !== undefined && (o.type !== "vydavok" || !(BUDGET_CATEGORIES as readonly unknown[]).includes(o.category))) errors.push(`${label}: kategória patrí len k výdavku a musí byť z katalógu`);
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
  const errors = unknownKeys(o, ["id", "date", "investmentsCents", "cashCents", "createdAt", "auto"], label);
  if (o.auto !== undefined && typeof o.auto !== "boolean") errors.push(`${label}: príznak automatického vyhodnotenia musí byť pravdivostná hodnota`);
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

export function validatePosition(p: unknown, today: string, label = "položka"): string[] {
  if (typeof p !== "object" || p === null || Array.isArray(p)) return [`${label}: musí byť objekt`];
  const o = p as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "name", "kind", "quantity", "unitPrice", "currency", "fxToEur", "valueDate", "monthlyContributionCents", "taxRegime", "createdAt", "updatedAt"], label);
  if (o.taxRegime !== undefined && !(TAX_REGIMES as readonly unknown[]).includes(o.taxRegime)) errors.push(`${label}: daňový režim musí byť z katalógu`);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 80) errors.push(`${label}: názov je povinný, max 80 znakov`);
  if (!(INVESTMENT_KINDS as readonly unknown[]).includes(o.kind)) errors.push(`${label}: druh musí byť z katalógu`);
  if (typeof o.quantity !== "number" || !(o.quantity > 0)) errors.push(`${label}: počet kusov musí byť kladné číslo`);
  if (typeof o.unitPrice !== "number" || !(o.unitPrice >= 0)) errors.push(`${label}: cena musí byť číslo 0 alebo viac`);
  if (typeof o.currency !== "string" || !/^[A-Z]{3}$/.test(o.currency)) errors.push(`${label}: mena musí byť trojpísmenový kód (napr. EUR)`);
  if (typeof o.fxToEur !== "number" || !(o.fxToEur > 0)) errors.push(`${label}: kurz k euru musí byť kladný`);
  if (o.currency === "EUR" && o.fxToEur !== 1) errors.push(`${label}: pri EUR musí byť kurz 1`);
  errors.push(...checkDate(o.valueDate, today, `${label}: dátum ocenenia`));
  if (o.monthlyContributionCents !== undefined && !isCents(o.monthlyContributionCents)) errors.push(`${label}: mesačný vklad musí byť celé číslo ≥ 0`);
  if (typeof o.createdAt !== "string" || typeof o.updatedAt !== "string") errors.push(`${label}: chýba čas vytvorenia alebo úpravy`);
  return errors;
}

export function validateLiability(l: unknown, today: string, label = "záväzok"): string[] {
  if (typeof l !== "object" || l === null || Array.isArray(l)) return [`${label}: musí byť objekt`];
  const o = l as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "name", "kind", "balanceCents", "rate", "monthlyPaymentCents", "endDate", "createdAt", "updatedAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 80) errors.push(`${label}: názov je povinný, max 80 znakov`);
  if (!(LIABILITY_KINDS as readonly unknown[]).includes(o.kind)) errors.push(`${label}: druh musí byť z katalógu`);
  if (!isCents(o.balanceCents)) errors.push(`${label}: zostatok musí byť celé číslo ≥ 0`);
  if (typeof o.rate !== "number" || !(o.rate >= 0 && o.rate < 1)) errors.push(`${label}: úroková sadzba musí byť v [0, 1)`);
  if (!isCents(o.monthlyPaymentCents)) errors.push(`${label}: splátka musí byť celé číslo ≥ 0`);
  // Koniec záväzku môže byť v budúcnosti, preto sa overuje len tvar a platnosť dátumu.
  if (o.endDate !== undefined) errors.push(...checkDate(o.endDate, "9999-12-31", `${label}: koniec`));
  if (typeof o.createdAt !== "string" || typeof o.updatedAt !== "string") errors.push(`${label}: chýba čas vytvorenia alebo úpravy`);
  return errors;
}

export function validateStockItem(i: unknown, label = "položka skladu"): string[] {
  if (typeof i !== "object" || i === null || Array.isArray(i)) return [`${label}: musí byť objekt`];
  const o = i as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "name", "quantity", "unit", "expiryDate", "createdAt", "updatedAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 80) errors.push(`${label}: názov je povinný, max 80 znakov`);
  if (typeof o.quantity !== "number" || !(o.quantity >= 0)) errors.push(`${label}: množstvo musí byť číslo 0 alebo väčšie`);
  if (!(STOCK_UNITS as readonly unknown[]).includes(o.unit)) errors.push(`${label}: jednotka musí byť z katalógu`);
  if (o.expiryDate !== undefined) errors.push(...checkDate(o.expiryDate, "9999-12-31", `${label}: dátum spotreby`));
  return errors;
}

export function validateReceiptItem(i: unknown, label = "položka dokladu"): string[] {
  if (typeof i !== "object" || i === null || Array.isArray(i)) return [`${label}: musí byť objekt`];
  const o = i as Record<string, unknown>;
  const errors = unknownKeys(o, ["code", "name", "quantity", "vatPercent", "unitPriceCents", "amountCents"], label);
  if (typeof o.code !== "string" || o.code.length === 0) errors.push(`${label}: chýba kód`);
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 200) errors.push(`${label}: názov je povinný, max 200 znakov`);
  if (typeof o.quantity !== "number" || !(o.quantity > 0)) errors.push(`${label}: počet musí byť kladné číslo`);
  if (typeof o.vatPercent !== "number" || !(o.vatPercent >= 0)) errors.push(`${label}: DPH musí byť číslo 0 alebo väčšie`);
  if (!isCents(o.unitPriceCents)) errors.push(`${label}: jednotková cena musí byť celé číslo v centoch`);
  if (typeof o.amountCents !== "number" || !Number.isInteger(o.amountCents) || o.amountCents <= 0) errors.push(`${label}: suma musí byť kladné celé číslo v centoch`);
  return errors;
}

export function validateRecipe(r: unknown, label = "recept"): string[] {
  if (typeof r !== "object" || r === null || Array.isArray(r)) return [`${label}: musí byť objekt`];
  const o = r as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "name", "ingredients", "createdAt", "updatedAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 80) errors.push(`${label}: názov je povinný, max 80 znakov`);
  if (!Array.isArray(o.ingredients) || o.ingredients.length === 0) {
    errors.push(`${label}: recept musí mať aspoň jednu surovinu`);
  } else {
    const seen = new Set<unknown>();
    for (const ing of o.ingredients as unknown[]) {
      const x = (typeof ing === "object" && ing !== null ? ing : {}) as Record<string, unknown>;
      if (typeof x.stockItemId !== "string" || x.stockItemId.length === 0) errors.push(`${label}: surovina nemá položku skladu`);
      else if (seen.has(x.stockItemId)) errors.push(`${label}: rovnaká surovina je dvakrát`);
      else seen.add(x.stockItemId);
      if (typeof x.quantity !== "number" || !(x.quantity > 0)) errors.push(`${label}: množstvo suroviny musí byť kladné číslo`);
    }
  }
  if (typeof o.createdAt !== "string" || typeof o.updatedAt !== "string") errors.push(`${label}: chýba čas vytvorenia alebo úpravy`);
  return errors;
}

export function validateRecurringExpense(e: unknown, label = "pravidelný výdavok"): string[] {
  if (typeof e !== "object" || e === null || Array.isArray(e)) return [`${label}: musí byť objekt`];
  const o = e as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "name", "category", "frequency", "amountCents", "startDate", "endDate", "createdAt", "updatedAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 80) errors.push(`${label}: názov je povinný, max 80 znakov`);
  if (!(BUDGET_CATEGORIES as readonly unknown[]).includes(o.category)) errors.push(`${label}: kategória musí byť z rozpočtu`);
  if (!(RECURRING_FREQUENCIES as readonly unknown[]).includes(o.frequency)) errors.push(`${label}: frekvencia musí byť mesačne alebo ročne`);
  if (typeof o.amountCents !== "number" || !Number.isInteger(o.amountCents) || o.amountCents <= 0) errors.push(`${label}: suma musí byť kladné celé číslo v centoch`);
  errors.push(...checkDate(o.startDate, "9999-12-31", `${label}: začiatok`));
  if (o.endDate !== undefined) errors.push(...checkDate(o.endDate, "9999-12-31", `${label}: koniec`));
  return errors;
}

export function validateIncome(i: unknown, label = "príjem"): string[] {
  if (typeof i !== "object" || i === null || Array.isArray(i)) return [`${label}: musí byť objekt`];
  const o = i as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "name", "kind", "frequency", "amountCents", "dayOfMonth", "startDate", "endDate", "source", "fetchedAt", "createdAt", "updatedAt"], label);
  if (typeof o.id !== "string" || o.id.length === 0) errors.push(`${label}: chýba id`);
  if (!(INCOME_KINDS as readonly unknown[]).includes(o.kind)) errors.push(`${label}: druh musí byť z katalógu`);
  if (!(INCOME_FREQUENCIES as readonly unknown[]).includes(o.frequency)) errors.push(`${label}: frekvencia musí byť pravidelná alebo nepravidelná`);
  if (typeof o.name !== "string" || o.name.trim().length === 0 || o.name.length > 80) errors.push(`${label}: názov je povinný, max 80 znakov`);
  if (typeof o.amountCents !== "number" || !Number.isInteger(o.amountCents) || o.amountCents <= 0) errors.push(`${label}: suma musí byť kladné celé číslo v centoch`);
  if (o.dayOfMonth !== undefined && !(Number.isInteger(o.dayOfMonth) && (o.dayOfMonth as number) >= 1 && (o.dayOfMonth as number) <= 31)) errors.push(`${label}: deň v mesiaci musí byť 1 až 31`);
  // Začiatok aj koniec môžu byť v budúcnosti (plánovaný príjem), preto sa overuje len platnosť dátumu.
  errors.push(...checkDate(o.startDate, "9999-12-31", `${label}: začiatok`));
  if (o.endDate !== undefined) errors.push(...checkDate(o.endDate, "9999-12-31", `${label}: koniec`));
  if (typeof o.startDate === "string" && typeof o.endDate === "string" && o.endDate < o.startDate) errors.push(`${label}: koniec nesmie byť pred začiatkom`);
  if (typeof o.createdAt !== "string" || typeof o.updatedAt !== "string") errors.push(`${label}: chýba čas vytvorenia alebo úpravy`);
  return errors;
}

export function validateBudget(b: unknown, label = "rozpočet"): string[] {
  if (typeof b !== "object" || b === null || Array.isArray(b)) return [`${label}: musí byť objekt`];
  const o = b as Record<string, unknown>;
  const errors = unknownKeys(o, ["id", "category", "limitCents", "updatedAt"], label);
  if (!(BUDGET_CATEGORIES as readonly unknown[]).includes(o.category)) errors.push(`${label}: kategória musí byť z katalógu`);
  if (o.id !== o.category) errors.push(`${label}: id musí byť kategória`);
  if (typeof o.limitCents !== "number" || !Number.isInteger(o.limitCents) || o.limitCents <= 0) errors.push(`${label}: limit musí byť kladné celé číslo v centoch`);
  if (typeof o.updatedAt !== "string") errors.push(`${label}: chýba čas úpravy`);
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
  const errors = unknownKeys(o, ["settings", "transactions", "snapshots", "properties", "assets", "investments", "liabilities", "incomes", "budgets", "recurringExpenses", "stockItems", "recipes"], "záloha");
  if (o.settings !== null && o.settings !== undefined) errors.push(...validateSettings(o.settings, today));
  if (!Array.isArray(o.transactions)) errors.push("záloha: transactions musí byť pole");
  else o.transactions.forEach((t, i) => errors.push(...validateTransaction(t, today, `transakcia ${i + 1}`)));
  if (!Array.isArray(o.snapshots)) errors.push("záloha: snapshots musí byť pole");
  else o.snapshots.forEach((s, i) => errors.push(...validateSnapshot(s, today, `vyhodnotenie ${i + 1}`)));
  if (!Array.isArray(o.properties)) errors.push("záloha: properties musí byť pole");
  else o.properties.forEach((p, i) => errors.push(...validateProperty(p, today, `nehnuteľnosť ${i + 1}`)));
  // Chýbajúce pole nesmie zhodiť overenie; chybu už hlási kontrola poľa vyššie.
  const ids = (arr: unknown) => (Array.isArray(arr) ? arr : []).map((x) => (x as { id?: unknown })?.id);
  if (!Array.isArray(o.assets)) errors.push("záloha: assets musí byť pole");
  else o.assets.forEach((a, i) => errors.push(...validateAsset(a, today, `aktívum ${i + 1}`)));
  const propertyList = Array.isArray(o.properties) ? (o.properties as unknown[]) : [];
  const assetList = Array.isArray(o.assets) ? (o.assets as unknown[]) : [];
  if (!Array.isArray(o.investments)) errors.push("záloha: investments musí byť pole");
  else o.investments.forEach((p, i) => errors.push(...validatePosition(p, today, `položka ${i + 1}`)));
  const investmentList = Array.isArray(o.investments) ? (o.investments as unknown[]) : [];
  if (!Array.isArray(o.liabilities)) errors.push("záloha: liabilities musí byť pole");
  else o.liabilities.forEach((l, i) => errors.push(...validateLiability(l, today, `záväzok ${i + 1}`)));
  const liabilityList = Array.isArray(o.liabilities) ? (o.liabilities as unknown[]) : [];
  if (!Array.isArray(o.incomes)) errors.push("záloha: incomes musí byť pole");
  else o.incomes.forEach((i, n) => errors.push(...validateIncome(i, `príjem ${n + 1}`)));
  const incomeList = Array.isArray(o.incomes) ? (o.incomes as unknown[]) : [];
  if (!Array.isArray(o.budgets)) errors.push("záloha: budgets musí byť pole");
  else o.budgets.forEach((b, n) => errors.push(...validateBudget(b, `rozpočet ${n + 1}`)));
  const budgetList = Array.isArray(o.budgets) ? (o.budgets as unknown[]) : [];
  if (!Array.isArray(o.recurringExpenses)) errors.push("záloha: recurringExpenses musí byť pole");
  else o.recurringExpenses.forEach((e, n) => errors.push(...validateRecurringExpense(e, `pravidelný výdavok ${n + 1}`)));
  const recurringList = Array.isArray(o.recurringExpenses) ? (o.recurringExpenses as unknown[]) : [];
  if (!Array.isArray(o.stockItems)) errors.push("záloha: stockItems musí byť pole");
  else o.stockItems.forEach((s, n) => errors.push(...validateStockItem(s, `položka skladu ${n + 1}`)));
  const stockList = Array.isArray(o.stockItems) ? (o.stockItems as unknown[]) : [];
  if (!Array.isArray(o.recipes)) errors.push("záloha: recipes musí byť pole");
  else o.recipes.forEach((r, n) => errors.push(...validateRecipe(r, `recept ${n + 1}`)));
  const recipeList = Array.isArray(o.recipes) ? (o.recipes as unknown[]) : [];
  for (const [name, list] of [["transakcie", ids(o.transactions as unknown[])], ["vyhodnotenia", ids(o.snapshots as unknown[])], ["majetok", ids(propertyList)], ["aktíva", ids(assetList)], ["investície", ids(investmentList)], ["záväzky", ids(liabilityList)], ["príjmy", ids(incomeList)], ["rozpočty", ids(budgetList)], ["pravidelné výdavky", ids(recurringList)], ["sklad", ids(stockList)]] as const) {
    if (new Set(list).size !== list.length) errors.push(`záloha: duplicitné id v ${name}`);
  }
  if (new Set(ids(recipeList)).size !== recipeList.length) errors.push("záloha: duplicitné id v receptoch");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      settings: (o.settings as Settings | null) ?? null,
      transactions: o.transactions as Transaction[],
      snapshots: o.snapshots as Snapshot[],
      properties: o.properties as Property[],
      assets: o.assets as Asset[],
      investments: o.investments as Position[],
      liabilities: o.liabilities as Liability[],
      incomes: o.incomes as RegularIncome[],
      budgets: o.budgets as Budget[],
      recurringExpenses: o.recurringExpenses as RecurringExpense[],
      stockItems: o.stockItems as StockItem[],
      recipes: o.recipes as Recipe[],
    },
  };
}
