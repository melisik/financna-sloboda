import { useEffect, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import type { AppData, Settings, Snapshot, Person, Household } from "../storage/types";
import { makeCtx } from "../domain/context";
import { CompavenLayout } from "./Layout";
import { Dashboard } from "./Dashboard";
import { SettingsForm } from "./SettingsForm";
import { SnapshotForm } from "./SnapshotForm";
import { HouseholdForm } from "./HouseholdForm";
import { MemberList } from "./MemberList";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { BackupForm } from "./BackupForm";
import { RocnyPrehladSection } from "../features/rocny-prehlad/RocnyPrehlad";
import { PropertySection } from "./PropertySection";
import { TestModeIndicator } from "./TestModeIndicator";

export function CompavenApp({ testMode }: { testMode?: boolean } = {}) {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>("dashboard");

  useEffect(() => {
    let alive = true;
    const dbName = testMode ? "compaven-2.0-test" : "compaven-2.0";
    localStorage.setItem("__COMPAVEN_DB_NAME__", dbName);
    console.log(`[COMPAVEN] Connected to database: ${dbName}`);
    openRepository(dbName)
      .then(async (r) => {
        let d = await r.getData();
        if (!alive) return;

        // Migrácia: ak nie sú persons, vytvoriť default
        if ((d.persons ?? []).length === 0) {
          const defaultPerson: Person = {
            id: `person-${Date.now()}`,
            name: "Ja",
            role: "owner",
            isCurrentUser: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await r.savePerson(defaultPerson);

          // Vytvoriť default Household
          const defaultHousehold: Household = {
            id: `household-${Date.now()}`,
            name: "Moja domácnosť",
            members: [{ personId: defaultPerson.id, memberRole: "admin", joinedAt: new Date().toISOString().split("T")[0] }],
            defaultSplitRule: { kind: "equal" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await r.saveHousehold(defaultHousehold);

          // Znovu načítať dáta s novými osôbami a domácnosťou
          d = await r.getData();
        }

        setRepo(r);
        setData(d);
      })
      .catch((e) => {
        if (alive) {
          setError(`Úložisko sa nepodarilo otvoriť: ${String(e)}`);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSaveSettings = async (settings: Settings) => {
    if (!repo) return;
    await repo.saveSettings(settings);
    const d = await repo.getData();
    setData(d);
    setCurrentPage("dashboard");
  };

  const handleSaveSnapshot = async (snapshot: Snapshot) => {
    if (!repo) return;
    await repo.addSnapshot(snapshot);
    const d = await repo.getData();
    setData(d);
    setCurrentPage("dashboard");
  };

  const handleSaveHousehold = async (household: any) => {
    if (!repo) return;
    await repo.saveHousehold(household);
    const d = await repo.getData();
    setData(d);
    setCurrentPage("dashboard");
  };

  const handleAddTransaction = async (transaction: any) => {
    if (!repo) return;
    await repo.addTransaction(transaction);
    const d = await repo.getData();
    setData(d);
    setCurrentPage("dashboard");
  };

  const handleAddPosition = async (position: any) => {
    if (!repo) return;
    await repo.savePosition(position);
    const d = await repo.getData();
    setData(d);
    setCurrentPage("dashboard");
  };

  const handleSavePerson = async (person: Person) => {
    if (!repo) return;
    await repo.savePerson(person);
    const d = await repo.getData();
    setData(d);
    setCurrentPage("household");
  };

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>
        <h2>Chyba pri inicializácii</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!repo || !data) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", textAlign: "center" }}>
        <h2>Načítavam COMPAVEN 2.0...</h2>
      </div>
    );
  }

  // try/catch v tele renderu — žiadne setState počas renderu (React anti-pattern).
  // ctxError je lokálna konštanta; ak nastane chyba, chybová obrazovka umožňuje otvoriť SettingsForm.
  let ctx: ReturnType<typeof makeCtx> | null = null;
  let ctxError: string | null = null;
  try {
    ctx = makeCtx(data);
  } catch (e) {
    ctxError = `Chyba výpočtu kontextu: ${String(e)}`;
  }

  if (ctxError) {
    return (
      <CompavenLayout currentPage={currentPage} onPageChange={setCurrentPage}>
        {currentPage === "settings-form"
          ? <SettingsForm settings={data.settings} onSave={handleSaveSettings} onCancel={() => setCurrentPage("dashboard")} />
          : (
            <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
              <h2 style={{ color: "var(--danger, red)" }}>Chyba pri výpočte</h2>
              <p style={{ marginBottom: "16px" }}>{ctxError}</p>
              <button
                onClick={() => setCurrentPage("settings-form")}
                style={{ padding: "8px 16px", cursor: "pointer" }}
              >
                Otvoriť nastavenia
              </button>
            </div>
          )
        }
      </CompavenLayout>
    );
  }

  const currentHousehold = (data.households ?? [])[0] ?? null;

  const handleRestoreBackup = async () => {
    const d = await repo?.getData();
    if (d) {
      setData(d);
      setCurrentPage("dashboard");
    }
  };

  const handlePropertySaved = async () => {
    const d = await repo?.getData();
    if (d) {
      setData(d);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <TestModeIndicator />
      <CompavenLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {currentPage === "dashboard" && <Dashboard ctx={ctx!} data={data} onAddSettings={() => setCurrentPage("settings-form")} onAddSnapshot={() => setCurrentPage("snapshot-form")} />}
      {currentPage === "settings-form" && (
        <div>
          <SettingsForm settings={data.settings} onSave={handleSaveSettings} onCancel={() => setCurrentPage("dashboard")} />
          {repo && <BackupForm repo={repo} data={data} onRestored={handleRestoreBackup} />}
        </div>
      )}
      {currentPage === "snapshot-form" && <SnapshotForm onSave={handleSaveSnapshot} onCancel={() => setCurrentPage("dashboard")} />}
      {currentPage === "household" && (
        <HouseholdForm household={currentHousehold} persons={data.persons ?? []} onSave={handleSaveHousehold} onSavePerson={handleSavePerson} onCancel={() => setCurrentPage("dashboard")} />
      )}
      {currentPage === "income" && <TransactionForm onSave={handleAddTransaction} onCancel={() => setCurrentPage("dashboard")} />}
      {currentPage === "transactions" && <TransactionList transactions={data.transactions ?? []} />}
      {currentPage === "annual-overview" && <RocnyPrehladSection data={data} ctx={ctx!} />}
      {(currentPage === "assets" || currentPage === "majetok") && repo && (
        <PropertySection repo={repo} properties={data.properties ?? []} today={today} onSaved={handlePropertySaved} />
      )}
      {currentPage === "goals" && <div style={{ padding: "20px" }}>Finančné ciele (v príprave)</div>}
      {currentPage === "analytics" && <div style={{ padding: "20px" }}>História & Analýzy (v príprave)</div>}
      {currentPage === "planning" && <div style={{ padding: "20px" }}>Plánovanie (v príprave)</div>}
      </CompavenLayout>
    </>
  );
}
