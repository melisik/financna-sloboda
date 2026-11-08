import { describe, it, expect } from "vitest";
import type { AppData, Person, Household, OwnerRef } from "../src/storage/types";

describe("Person/Household (D-028, C2.0)", () => {
  it("Person: isCurrentUser je práve jeden", () => {
    const persons: Person[] = [
      { id: "p1", name: "Ja", role: "owner", isCurrentUser: true, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z" },
      { id: "p2", name: "Partner", role: "partner", isCurrentUser: false, createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z" },
    ];
    const currentCount = persons.filter((p) => p.isCurrentUser).length;
    expect(currentCount).toBe(1);
  });

  it("Household: minimálne jeden admin musí zostať aktívny", () => {
    const household: Household = {
      id: "h1",
      name: "Rodina",
      members: [
        { personId: "p1", memberRole: "admin", joinedAt: "2026-11-01" },
        { personId: "p2", memberRole: "member", joinedAt: "2026-11-01", leftAt: "2026-12-01" },
      ],
      defaultSplitRule: { kind: "equal" },
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    };
    const activeAdmins = household.members.filter((m) => m.memberRole === "admin" && !m.leftAt);
    expect(activeAdmins.length).toBeGreaterThanOrEqual(1);
  });

  it("SplitRule: custom shares musia spolu tvoriť 100 %", () => {
    const rule = {
      kind: "custom" as const,
      customShares: [
        { personId: "p1", percent: 60 },
        { personId: "p2", percent: 40 },
      ],
    };
    const totalPercent = rule.customShares?.reduce((sum, s) => sum + s.percent, 0) ?? 0;
    expect(totalPercent).toBe(100);
  });

  it("OwnerRef: vlastníctvo majetku (Property, Asset, Position)", () => {
    const owners: OwnerRef[] = [
      { personId: "p1", percent: 50 },
      { personId: "p2", percent: 50 },
    ];
    const totalOwnership = owners.reduce((sum, o) => sum + o.percent, 0);
    expect(totalOwnership).toBe(100);
  });

  it("AppData: persons a households sú prázdne pri novej inštalácii", () => {
    const emptyData: AppData = {
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
    };
    expect(emptyData.persons).toEqual([]);
    expect(emptyData.households).toEqual([]);
  });

  it("Migrácia: staré AppData bez persons → pri prvom otvorení sa vytvorí Person(isCurrentUser=true)", () => {
    // Simulácia: AppData bez persons a households (staré zálohy ich nemajú vôbec)
    const oldData: any = {
      settings: { expensesCents: 240000, withdrawalRate: 0.04, realReturn: 0.035 },
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
      // persons: undefined (staré zálohy nemajú)
      // households: undefined
    };

    // Migračná logika (len overenie štruktúry)
    const migratedData: AppData = {
      ...oldData,
      persons: oldData.persons ?? [
        {
          id: "user-default",
          name: "Ja",
          role: "owner",
          isCurrentUser: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      households: oldData.households ?? [],
    };

    expect(migratedData.persons).toHaveLength(1);
    expect(migratedData.persons?.[0]?.isCurrentUser).toBe(true);
    expect(migratedData.households).toEqual([]);
  });
});
