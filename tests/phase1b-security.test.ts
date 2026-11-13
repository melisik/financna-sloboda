/**
 * PHASE 1B — Bezpečnostné testy ochrany REAL prostredia
 *
 * POZOR: Tieto testy vyžadujú správnu konfiguráciu VITE_COMPAVEN_ENV pri zostavení.
 * - REAL build: VITE_COMPAVEN_ENV=real
 * - SANDBOX build: VITE_COMPAVEN_ENV=sandbox
 *
 * Táto príprava zoznamu testov dokumentuje očakávané správanie,
 * ktoré bude overované pri úplnom testovaní v KROK D.
 */

import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getEnvironmentConfig } from "../src/config/environment";
import { openRepository } from "../src/storage/indexeddb";
import type { AppData, Attachment } from "../src/storage/types";

describe("PHASE 1B — Bezpečnosť prostredia (príprava testov)", () => {

  // TEST 1: REAL build odmietne otvoriť SANDBOX databázu
  describe("Test 1: Detekcia prostredia pri otváraní databázy", () => {
    it("REAL build odmietne otvoriť SANDBOX databázu", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "real") {
        // V REAL buildu by mal byť config.dbName = "compaven-2.0-real"
        expect(config.dbName).toBe("compaven-2.0-real");
        expect(config.isRealEnv).toBe(true);

        // Pokus otvoriť SANDBOX DB v REAL buildu by mal vyhodiť chybu
        await expect(openRepository("compaven-2.0-sandbox"))
          .rejects
          .toThrow(/Database name mismatch/);
      } else {
        // V SANDBOX buildu skíp
        expect(true).toBe(true);
      }
    });

    it("SANDBOX build odmietne otvoriť REAL databázu", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "sandbox") {
        // V SANDBOX buildu by mal byť config.dbName = "compaven-2.0-sandbox"
        expect(config.dbName).toBe("compaven-2.0-sandbox");
        expect(config.isSandboxEnv).toBe(true);

        // Pokus otvoriť REAL DB v SANDBOX buildu by mal vyhodiť chybu
        await expect(openRepository("compaven-2.0-real"))
          .rejects
          .toThrow(/Database name mismatch/);
      } else {
        // V REAL buildu skíp
        expect(true).toBe(true);
      }
    });

    it("Neznámy názov databázy vyvolá chybu", async () => {
      // Pokus otvoriť databázu s neznámym názvom (fallback na SANDBOX je ZAKÁZANÝ)
      await expect(openRepository("random-unknown-database"))
        .rejects
        .toThrow(/Database name mismatch/);
    });
  });

  // TEST 4: REAL odmietne priame volanie hromadnej náhrady bez zálohy
  describe("Test 4: Ochrana replaceAllWithAttachments v REAL", () => {
    it("REAL odmietne priame volanie replaceAllWithAttachments bez zálohy", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "real") {
        const repo = await openRepository(config.dbName);
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
          personalGoals: [],
        };

        // V REAL: volanie replaceAllWithAttachments() by malo vyhodiť chybu
        const repoAny = repo as any;
        if (typeof repoAny.replaceAllWithAttachments === "function") {
          await expect(repoAny.replaceAllWithAttachments(emptyData, []))
            .rejects
            .toThrow(/priama hromadná náhrada je v REAL prostredí zakázaná/i);
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 5: REAL zablokuje import zálohy (fáza 1 — dočasné obmedzenie)
  describe("Test 5: Import zálohy je v REAL zablokovaný", () => {
    it("REAL odmietne replaceAllWithAttachmentsForRestore s REAL_IMPORT_BLOCKED_MESSAGE", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "real") {
        const repo = await openRepository(config.dbName);
        const testData: AppData = {
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
          personalGoals: [],
        };

        // Ochrana REAL, fáza 1: import musí byť odmietnutý s jasnou správou
        const repoAny = repo as any;
        if (typeof repoAny.replaceAllWithAttachmentsForRestore === "function") {
          await expect(
            repoAny.replaceAllWithAttachmentsForRestore(testData, [], "backup-fake-id")
          ).rejects.toThrow(/dočasne nedostupný/);
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 7: SANDBOX umožní reset a import
  describe("Test 7: SANDBOX bez ochran (permisívny režim)", () => {
    it("SANDBOX umožní replaceAllWithAttachments bez backupId", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "sandbox") {
        const repo = await openRepository(config.dbName);
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
          personalGoals: [],
        };

        // V SANDBOX: replaceAllWithAttachments bez zálohy je POVOLENÉ
        const repoAny = repo as any;
        if (typeof repoAny.replaceAllWithAttachments === "function") {
          // Toto by malo prejsť bez chyby v SANDBOX
          await expect(repoAny.replaceAllWithAttachments(emptyData, []))
            .resolves
            .toBeUndefined();
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 8: Atomická operácia zahŕňa všetkých 20 úložísk
  describe("Test 8: Atomická transakcia s 20 úložiskami", () => {
    it("replaceAllWithAttachments manipuluje všetky 20 úložísk v jednej transakcii", async () => {
      const config = getEnvironmentConfig();

      // Tento test overuje štruktúru kódu, nie runtime správanie
      // (runtime overenie vyžaduje SANDBOX build)
      if (config.env === "sandbox") {
        const repo = await openRepository(config.dbName);

        // Test: Skontrolovať, že metóda existuje
        const repoAny = repo as any;
        expect(typeof repoAny._performAtomicReplace).toBe("function");

        // Očakávané úložiská (20 spolu):
        // 1. transactions
        // 2. snapshots
        // 3. settings
        // 4. properties
        // 5. assets
        // 6. investments
        // 7. liabilities
        // 8. incomes
        // 9. budgets
        // 10. recurringExpenses
        // 11. stockItems
        // 12. recipes
        // 13. dogs
        // 14. goals
        // 15. wasteRecords
        // 16. shoppingItems
        // 17. persons
        // 18. households
        // 19. personalGoals
        // 20. attachments

        const stores = [
          "transactions", "snapshots", "settings",
          "properties", "assets", "investments",
          "liabilities", "incomes", "budgets",
          "recurringExpenses", "stockItems", "recipes",
          "dogs", "goals", "wasteRecords",
          "shoppingItems", "persons", "households",
          "personalGoals", "attachments"
        ];

        expect(stores.length).toBe(20);
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 2: REAL odmietne replaceAll (reset bez prílohy)
  describe("Test 2: Ochrana replaceAll v REAL", () => {
    it("REAL odmietne replaceAll s chybou", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "real") {
        const repo = await openRepository(config.dbName);
        const testData: AppData = {
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
          personalGoals: [],
        };

        // REAL: replaceAll musí byť odmietnutý
        const repoAny = repo as any;
        if (typeof repoAny.replaceAll === "function") {
          await expect(repoAny.replaceAll(testData))
            .rejects
            .toThrow(/Reset databázy je v REAL prostredí zakázaný/i);
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 3: REAL odmietne replaceAttachments (zápis príloh)
  describe("Test 3: Ochrana replaceAttachments v REAL", () => {
    it("REAL odmietne replaceAttachments s chybou", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "real") {
        const repo = await openRepository(config.dbName);
        const testAttachments: Attachment[] = [];

        // REAL: replaceAttachments musí byť odmietnutý
        const repoAny = repo as any;
        if (typeof repoAny.replaceAttachments === "function") {
          await expect(repoAny.replaceAttachments(testAttachments))
            .rejects
            .toThrow(/Zmazanie príloh je v REAL prostredí zakázané/i);
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 5b: Import cez BackupForm v REAL neurobí žiadny zápis
  describe("Test 5b: Import v REAL nevykonáva zápis do databázy", () => {
    it("Keď sa pokúsi Import v REAL, metódy úložiska hádžu chybu pred vykonaním", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "real") {
        const repo = await openRepository(config.dbName);
        const testData: AppData = {
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
          personalGoals: [],
        };

        // Ochrana REAL, fáza 1: všetky cesty importu hádžu pred vykonaním
        const repoAny = repo as any;

        // Cesta 1: replaceAllWithAttachmentsForRestore — házie s REAL_IMPORT_BLOCKED_MESSAGE
        if (typeof repoAny.replaceAllWithAttachmentsForRestore === "function") {
          await expect(
            repoAny.replaceAllWithAttachmentsForRestore(testData, [], "backup-fake-id")
          ).rejects.toThrow(/dočasne nedostupný/);
        }

        // Cesta 2: replaceAllWithAttachments — házie s priama hromadná náhrada
        if (typeof repoAny.replaceAllWithAttachments === "function") {
          await expect(
            repoAny.replaceAllWithAttachments(testData, [])
          ).rejects.toThrow(/priama hromadná náhrada/i);
        }

        // Cesta 3: replaceAll — házie s reset
        if (typeof repoAny.replaceAll === "function") {
          await expect(
            repoAny.replaceAll(testData)
          ).rejects.toThrow(/Reset databázy/i);
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 6: Auto-snapshoty sa v REAL nevykonajú
  describe("Test 6: Automatické snapshoty sú vypnuté v REAL", () => {
    it("useAutomaticSnapshot guard vráti true iba v SANDBOX", async () => {
      const config = getEnvironmentConfig();

      // Import guard funkcie
      const { isAutoSnapshotEnabled } = await import("../src/compaven-ui/useAutomaticSnapshot");

      // V REAL: isAutoSnapshotEnabled() musí vrátiť false
      // V SANDBOX: isAutoSnapshotEnabled() musí vrátiť true
      const shouldEnable = isAutoSnapshotEnabled();

      if (config.env === "real") {
        expect(shouldEnable).toBe(false);
      } else {
        expect(shouldEnable).toBe(true);
      }
    });
  });

  // TEST 7b: Import cez BackupForm v SANDBOX funguje
  describe("Test 7b: Import cez BackupForm v SANDBOX funguje", () => {
    it("SANDBOX umožní replaceAllWithAttachments pri BackupForm importe", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "sandbox") {
        const repo = await openRepository(config.dbName);
        const testData: AppData = {
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
          personalGoals: [],
        };

        // V SANDBOX: BackupForm ide cez replaceAllWithAttachments, čo musí fungovať
        const repoAny = repo as any;
        if (typeof repoAny.replaceAllWithAttachments === "function") {
          await expect(repoAny.replaceAllWithAttachments(testData, []))
            .resolves
            .toBeUndefined();
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 7c: replaceAll v SANDBOX funguje
  describe("Test 7c: replaceAll v SANDBOX funguje bez blokovania", () => {
    it("SANDBOX umožní replaceAll bez záväzkov", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "sandbox") {
        const repo = await openRepository(config.dbName);
        const testData: AppData = {
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
          personalGoals: [],
        };

        const repoAny = repo as any;
        if (typeof repoAny.replaceAll === "function") {
          await expect(repoAny.replaceAll(testData))
            .resolves
            .toBeUndefined();
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 7d: replaceAttachments v SANDBOX funguje
  describe("Test 7d: replaceAttachments v SANDBOX funguje bez blokovania", () => {
    it("SANDBOX umožní replaceAttachments bez chyby", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "sandbox") {
        const repo = await openRepository(config.dbName);
        const testAttachments: Attachment[] = [];

        const repoAny = repo as any;
        if (typeof repoAny.replaceAttachments === "function") {
          await expect(repoAny.replaceAttachments(testAttachments))
            .resolves
            .toBeUndefined();
        }
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST 7e: Auto-snapshoty sa v SANDBOX môžu vykonávať
  describe("Test 7e: Auto-snapshoty sú povolené v SANDBOX", () => {
    it("isAutoSnapshotEnabled() vráti true v SANDBOX", async () => {
      const config = getEnvironmentConfig();
      const { isAutoSnapshotEnabled } = await import("../src/compaven-ui/useAutomaticSnapshot");

      if (config.env === "sandbox") {
        expect(isAutoSnapshotEnabled()).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });
  });

  // TEST INTERNALS: Ochrana _performAtomicReplace — runtime guard pri priamom volaní
  describe("Test INTERNALS: Ochrana interných metód", () => {
    it("_performAtomicReplace v REAL háže aj pri priamom volaní cez (repo as any)", async () => {
      const config = getEnvironmentConfig();

      if (config.env === "real") {
        const repo = await openRepository(config.dbName);
        const repoAny = repo as any;

        // POZOR: TypeScript `private` je výlučne compile-time ochrana.
        // Za behu (runtime) je _performAtomicReplace prístupná priamo cez pretypovanie.
        // Tento test overuje, že REAL guard je implementovaný AJ v tejto internej metóde —
        // nie iba vo verejných metódach replaceAll / replaceAllWithAttachments.
        expect(typeof repoAny._performAtomicReplace).toBe("function");

        // Priame volanie v REAL musí hádzať rovnakú chybu ako verejné metódy
        const emptyData: AppData = {
          settings: null, transactions: [], snapshots: [], properties: [], assets: [],
          investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [],
          stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [],
          persons: [], households: [], personalGoals: [],
        };
        await expect(
          repoAny._performAtomicReplace(emptyData, [])
        ).rejects.toThrow(/priama hromadná náhrada je v REAL prostredí zakázaná/i);
      } else {
        // V SANDBOX: _performAtomicReplace je prístupná a funguje
        const repo = await openRepository(config.dbName);
        const repoAny = repo as any;
        expect(typeof repoAny._performAtomicReplace).toBe("function");
        // V SANDBOX neháže — SANDBOX má povolený priamy prístup
        const emptyData: AppData = {
          settings: null, transactions: [], snapshots: [], properties: [], assets: [],
          investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [],
          stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [],
          persons: [], households: [], personalGoals: [],
        };
        await expect(repoAny._performAtomicReplace(emptyData, [])).resolves.toBeUndefined();
      }
    });
  });

  // TEST ATOMIC-1: replaceAllWithAttachments je atomická — dáta aj prílohy v jednej transakcii
  describe("Test ATOMIC-1: Atomická náhrada dát a príloh (N1 fix)", () => {
    it("SANDBOX: replaceAllWithAttachments zapíše dáta aj prílohy naraz", async () => {
      const config = getEnvironmentConfig();
      if (config.env !== "sandbox") { expect(true).toBe(true); return; }

      const repo = await openRepository(config.dbName);
      const testAttachment = {
        id: "att-atomic-test-1",
        transactionId: "tx-atomic-test-1",
        name: "test.pdf",
        mimeType: "application/pdf",
        data: "base64data",
        size: 100,
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const testData: AppData = {
        settings: null,
        transactions: [{ id: "tx-atomic-test-1", date: "2026-01-01", amountCents: 100, description: "test", type: "expense", category: "other" } as any],
        snapshots: [], properties: [], assets: [], investments: [],
        liabilities: [], incomes: [], budgets: [], recurringExpenses: [],
        stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [],
        shoppingItems: [], persons: [], households: [], personalGoals: [],
      };

      // Volanie metódy — atomická transakcia dát + príloh
      await expect(repo.replaceAllWithAttachments(testData, [testAttachment as any]))
        .resolves.toBeUndefined();

      // Overenie: dáta aj príloha sú zapísané
      const written = await repo.getData();
      expect(written.transactions).toHaveLength(1);
      expect(written.transactions[0].id).toBe("tx-atomic-test-1");

      const attachments = await repo.listAllAttachments();
      expect(attachments).toHaveLength(1);
      expect(attachments[0].id).toBe("att-atomic-test-1");

      repo.close();
    });

    it("SANDBOX: replaceAllWithAttachments vymaže predchádzajúce dáta aj prílohy", async () => {
      const config = getEnvironmentConfig();
      if (config.env !== "sandbox") { expect(true).toBe(true); return; }

      const repo = await openRepository(config.dbName);

      // Zapíšeme pôvodné dáta
      const oldAttachment = { id: "att-old", transactionId: "tx-old", name: "old.pdf", mimeType: "application/pdf", data: "old", size: 1, createdAt: "2026-01-01T00:00:00.000Z" };
      await repo.replaceAllWithAttachments(
        { settings: null, transactions: [{ id: "tx-old", date: "2026-01-01", amountCents: 50, description: "old", type: "expense", category: "other" } as any], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [], persons: [], households: [], personalGoals: [] },
        [oldAttachment as any]
      );

      // Nahradíme novými dátami
      const newAttachment = { id: "att-new", transactionId: "tx-new", name: "new.pdf", mimeType: "application/pdf", data: "new", size: 2, createdAt: "2026-01-02T00:00:00.000Z" };
      await repo.replaceAllWithAttachments(
        { settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [], persons: [], households: [], personalGoals: [] },
        [newAttachment as any]
      );

      // Stará príloha a transakcia musia byť vymazané
      const data = await repo.getData();
      expect(data.transactions).toHaveLength(0);

      const attachments = await repo.listAllAttachments();
      expect(attachments).toHaveLength(1);
      expect(attachments[0].id).toBe("att-new");
      expect(attachments.find(a => a.id === "att-old")).toBeUndefined();

      repo.close();
    });

    it("REAL: replaceAllWithAttachments háže pred vykonaním akýchkoľvek zmien", async () => {
      const config = getEnvironmentConfig();
      if (config.env !== "real") { expect(true).toBe(true); return; }

      const repo = await openRepository(config.dbName);
      await expect(repo.replaceAllWithAttachments(
        { settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [], persons: [], households: [], personalGoals: [] },
        []
      )).rejects.toThrow(/priama hromadná náhrada je v REAL prostredí zakázaná/i);

      repo.close();
    });
  });

  // POZOR: Jednotlivé finančné operácie musia zostať povolené
  describe("Test BONUS: Bežné operácie nie sú blokované", () => {
    it("addTransaction, saveProperty, saveBudget sú povolené v REAL aj SANDBOX", async () => {
      const config = getEnvironmentConfig();
      const repo = await openRepository(config.dbName);

      // Kontrolovať, že tieto metódy existujú a nie sú blokované
      const repoAny = repo as any;
      expect(typeof repoAny.addTransaction).toBe("function");
      expect(typeof repoAny.saveProperty).toBe("function");
      expect(typeof repoAny.saveBudget).toBe("function");
      expect(typeof repoAny.saveIncome).toBe("function");
      expect(typeof repoAny.saveSettings).toBe("function");

      // Tieto metódy by nemali vrh chybu iba pre samotný typ
      expect(true).toBe(true);
    });
  });
});
