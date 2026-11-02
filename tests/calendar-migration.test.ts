import "fake-indexeddb/auto";
import { openDB } from "idb";
import { describe, expect, it } from "vitest";
import { openRepository } from "../src/storage/indexeddb";

// Migrácia databázy z verzie 11 na 12: finančné povinnosti (D-342). Syntetické hodnoty.
let counter = 0;
const freshName = () => `calendar-migration-test-${++counter}-${Date.now()}`;

describe("migrácia úložiska na verziu 12 (D-342)", () => {
  it("migrácia z v11 na v12 vytvorí obchod calendarObligations bez straty starých dát", async () => {
    const name = freshName();
    // Vytvor staršiu databázu (v11) bez calendarObligations
    const old = await openDB(name, 11, {
      upgrade(d) {
        d.createObjectStore("transactions", { keyPath: "id" });
        d.createObjectStore("snapshots", { keyPath: "id" });
        d.createObjectStore("settings");
        d.createObjectStore("properties", { keyPath: "id" });
        d.createObjectStore("assets", { keyPath: "id" });
        d.createObjectStore("investments", { keyPath: "id" });
        d.createObjectStore("liabilities", { keyPath: "id" });
        d.createObjectStore("incomes", { keyPath: "id" });
        d.createObjectStore("budgets", { keyPath: "id" });
        d.createObjectStore("recurringExpenses", { keyPath: "id" });
        d.createObjectStore("stockItems", { keyPath: "id" });
        d.createObjectStore("recipes", { keyPath: "id" });
        d.createObjectStore("dogs", { keyPath: "id" });
        d.createObjectStore("goals", { keyPath: "id" });
        d.createObjectStore("wasteRecords", { keyPath: "id" });
        d.createObjectStore("shoppingItems", { keyPath: "id" });
        // v12 pridáva: calendarObligations (ale v starej verzii ho tu nemáme)
      },
    });
    // Vložíme testovacie dáta (transakcie, aby sme overili, že staré dáta ostanú)
    await old.put("transactions", { id: "t1", date: "2026-10-20", type: "sporenie", amountCents: 1000, createdAt: "2026-10-20T10:00:00Z", updatedAt: "2026-10-20T10:00:00Z" });
    old.close();

    // Otvoríme cez openRepository - to spustí migráciu v11→v12
    const repo = await openRepository(name);
    const data = await repo.getData();

    // Overíme, že staré dáta zostali
    expect(data.transactions.map((t) => t.id)).toEqual(["t1"]);
    // Overíme, že nový obchod existuje (aj keď je prázdny)
    expect(data.calendarObligations).toEqual([]);

    repo.close();
  });

  it("migrácia umožní ukladanie nových trvalých povinností po migácii", async () => {
    const name = freshName();
    const old = await openDB(name, 11, {
      upgrade(d) {
        d.createObjectStore("transactions", { keyPath: "id" });
        d.createObjectStore("snapshots", { keyPath: "id" });
        d.createObjectStore("settings");
        d.createObjectStore("properties", { keyPath: "id" });
        d.createObjectStore("assets", { keyPath: "id" });
        d.createObjectStore("investments", { keyPath: "id" });
        d.createObjectStore("liabilities", { keyPath: "id" });
        d.createObjectStore("incomes", { keyPath: "id" });
        d.createObjectStore("budgets", { keyPath: "id" });
        d.createObjectStore("recurringExpenses", { keyPath: "id" });
        d.createObjectStore("stockItems", { keyPath: "id" });
        d.createObjectStore("recipes", { keyPath: "id" });
        d.createObjectStore("dogs", { keyPath: "id" });
        d.createObjectStore("goals", { keyPath: "id" });
        d.createObjectStore("wasteRecords", { keyPath: "id" });
        d.createObjectStore("shoppingItems", { keyPath: "id" });
      },
    });
    old.close();

    // Teraz otvoríme cez openRepository a vložíme povinnosti
    const repo = await openRepository(name);
    await repo.saveCalendarObligation({
      id: "o1",
      name: "Test povinnosť",
      category: "jedlo",
      amountCents: 5000,
      dueDate: "2026-11-15",
      status: "caka",
      createdAt: "2026-10-20T10:00:00Z",
      updatedAt: "2026-10-20T10:00:00Z",
    });

    const data = await repo.getData();
    expect(data.calendarObligations).toHaveLength(1);
    expect(data.calendarObligations?.[0]?.id).toBe("o1");

    repo.close();
  });
});
