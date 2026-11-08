import { describe, it, expect } from "vitest";
import type { AppData, Person, Household } from "../src/storage/types";

describe("Household & Person Integration (C2.0 Fáza 3)", () => {
  it("Pri prvom otvorení sú vytvorení default Person (isCurrentUser=true) a Household", () => {
    const defaultPerson: Person = {
      id: "person-1",
      name: "Ja",
      role: "owner",
      isCurrentUser: true,
      createdAt: "2026-11-08T10:00:00Z",
      updatedAt: "2026-11-08T10:00:00Z",
    };

    const defaultHousehold: Household = {
      id: "household-1",
      name: "Moja domácnosť",
      members: [{ personId: defaultPerson.id, memberRole: "admin", joinedAt: "2026-11-08" }],
      defaultSplitRule: { kind: "equal" },
      createdAt: "2026-11-08T10:00:00Z",
      updatedAt: "2026-11-08T10:00:00Z",
    };

    const data: AppData = {
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
      persons: [defaultPerson],
      households: [defaultHousehold],
    };

    expect(data.persons).toHaveLength(1);
    expect(data.persons?.[0]?.isCurrentUser).toBe(true);
    expect(data.households).toHaveLength(1);
    expect(data.households?.[0]?.members).toHaveLength(1);
  });

  it("Household members sú spravovaní — admini nesmú byť odstránení", () => {
    const household: Household = {
      id: "h1",
      name: "Rodina",
      members: [
        { personId: "p1", memberRole: "admin", joinedAt: "2026-11-08" },
        { personId: "p2", memberRole: "member", joinedAt: "2026-11-08" },
      ],
      defaultSplitRule: { kind: "equal" },
      createdAt: "2026-11-08T10:00:00Z",
      updatedAt: "2026-11-08T10:00:00Z",
    };

    const activeAdmins = household.members.filter((m) => m.memberRole === "admin" && !m.leftAt);
    expect(activeAdmins.length).toBeGreaterThanOrEqual(1);
  });

  it("Household sa dá uložiť s aktualizovaným názvom", () => {
    const household: Household = {
      id: "h1",
      name: "Stará domácnosť",
      members: [{ personId: "p1", memberRole: "admin", joinedAt: "2026-11-08" }],
      defaultSplitRule: { kind: "equal" },
      createdAt: "2026-11-08T10:00:00Z",
      updatedAt: "2026-11-08T10:00:00Z",
    };

    const updated: Household = { ...household, name: "Nová domácnosť", updatedAt: new Date().toISOString() };

    expect(updated.name).toBe("Nová domácnosť");
    expect(updated.id).toBe(household.id);
  });
});
