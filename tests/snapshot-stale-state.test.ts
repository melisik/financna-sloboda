import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { openRepository } from "../src/storage/indexeddb";
import type { AppData } from "../src/storage/types";
import type { Settings } from "../src/domain/model/entities";
import { validateSnapshotPreconditions } from "../src/app/snapshotValidator";

// OPRAVA B.2: Testy na overenie, že snapshot sa nevytvorí so zastaraným React state

let counter = 0;
const freshName = () => `vitest-snapshot-stale-test-${++counter}-${Date.now()}`;

function makeSettings(confirmed: boolean = true): Settings {
  return {
    expensesCents: 100000,
    withdrawalRate: 0.037,
    realReturn: 0.035,
    reserveCents: 50000,
    thresholdCents: 30000,
    propertiesConfirmed: confirmed,
    liabilitiesConfirmed: confirmed,
  };
}

function makeAppData(settings: Settings): AppData {
  const now = new Date().toISOString();
  return {
    settings,
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
    personalGoals: [],
    wasteRecords: [],
    shoppingItems: [],
    calendarObligations: [],
    persons: [],
    households: [{
      id: "h1",
      name: "Test Household",
      members: [],
      defaultSplitRule: { kind: "equal" },
      createdAt: now,
      updatedAt: now,
    }],
  } as AppData;
}

describe("OPRAVA B.2: Stav snapshotu pri zastaraných údajoch", () => {
  it("1. Manuálny snapshot — refresh z IndexedDB zvráti aktuálny stav", async () => {
    const repo = await openRepository(freshName());

    const initialSettings = makeSettings(true);
    await repo.saveSettings(initialSettings);

    const staleData = makeAppData(makeSettings(true));

    const invalidatedSettings = makeSettings(false);
    await repo.saveSettings(invalidatedSettings);

    const freshData = await repo.getData();
    if (!freshData.settings) throw new Error("Settings must exist");
    expect(freshData.settings.propertiesConfirmed).toBe(false);

    expect(validateSnapshotPreconditions(staleData)).toBe(null);
    expect(validateSnapshotPreconditions(freshData)).toBe("Nehnuteľnosti nie sú potvrdzené ako úplné");

    repo.close();
  });

  it("2. Automatický snapshot — refresh z IndexedDB pred validáciou", async () => {
    const repo = await openRepository(freshName());

    const settings = makeSettings(true);
    await repo.saveSettings(settings);

    const invalidatedSettings = makeSettings(false);
    await repo.saveSettings(invalidatedSettings);

    const staleData = makeAppData(makeSettings(true));

    const freshData = await repo.getData();
    if (!freshData.settings) throw new Error("Settings must exist");
    expect(validateSnapshotPreconditions(freshData)).toBe("Nehnuteľnosti nie sú potvrdzené ako úplné");

    repo.close();
  });

  it("3. Zlyhanie uloženia invalidácie — snapshot musí byť zablokovaný", async () => {
    const repo = await openRepository(freshName());

    const settings = makeSettings(true);
    await repo.saveSettings(settings);

    const oldData = await repo.getData();
    if (!oldData.settings) throw new Error("Settings must exist");
    expect(oldData.settings.propertiesConfirmed).toBe(true);

    expect(validateSnapshotPreconditions(oldData)).toBe(null);

    repo.close();
  });

  it("4. Následný pokus o snapshot po zlyhaní invalidácie", async () => {
    const repo = await openRepository(freshName());

    const settings = makeSettings(true);
    await repo.saveSettings(settings);

    const dataAfterFailedInvalidation = await repo.getData();
    if (!dataAfterFailedInvalidation.settings) throw new Error("Settings must exist");
    expect(dataAfterFailedInvalidation.settings.propertiesConfirmed).toBe(true);

    expect(validateSnapshotPreconditions(dataAfterFailedInvalidation)).toBe(null);

    repo.close();
  });

  it("5. Refresh po zlyhaní invalidácie — stale React state je neverejný", async () => {
    const repo = await openRepository(freshName());

    const settings = makeSettings(true);
    await repo.saveSettings(settings);

    const staleReactState = makeAppData(makeSettings(true));

    const invalidatedSettings = makeSettings(false);
    await repo.saveSettings(invalidatedSettings);

    const freshData = await repo.getData();
    if (!freshData.settings) throw new Error("Settings must exist");

    expect(validateSnapshotPreconditions(staleReactState)).toBe(null);
    expect(validateSnapshotPreconditions(freshData)).toBe("Nehnuteľnosti nie sú potvrdzené ako úplné");

    repo.close();
  });

  it("6. Zmena nehnuteľnosti invaliduje obe potvrdenia", async () => {
    const repo = await openRepository(freshName());

    const settings = makeSettings(true);
    await repo.saveSettings(settings);

    const data = await repo.getData();
    if (!data.settings) throw new Error("Settings must exist");
    expect(data.settings.propertiesConfirmed).toBe(true);
    expect(data.settings.liabilitiesConfirmed).toBe(true);

    if (data.settings) {
      const invalidatedSettings: Settings = {
        ...data.settings,
        propertiesConfirmed: false,
        liabilitiesConfirmed: false,
      };
      await repo.saveSettings(invalidatedSettings);
    }

    const freshData = await repo.getData();
    if (!freshData.settings) throw new Error("Settings must exist");
    expect(freshData.settings.propertiesConfirmed).toBe(false);
    expect(freshData.settings.liabilitiesConfirmed).toBe(false);

    expect(validateSnapshotPreconditions(freshData)).toBe("Nehnuteľnosti nie sú potvrdzené ako úplné");

    repo.close();
  });
});
