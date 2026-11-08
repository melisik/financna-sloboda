import type { AppData } from "../src/storage/types";

/** Helper: vytvorí AppData so všetkými povinným polami (default na prázdne polia) */
export function createAppData(over: Partial<AppData> = {}): AppData {
  return {
    settings: null,
    transactions: [],
    snapshots: [],
    properties: [],
    assets: [],
    investments: [],
    liabilities: [],
    incomes: [],
    budgets: [],
    recurringExpenses: [],
    stockItems: [],
    recipes: [],
    dogs: [],
    goals: [],
    wasteRecords: [],
    shoppingItems: [],
    persons: [],
    households: [],
    ...over,
  };
}
