import { useEffect, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import type { AppData } from "../storage/types";
import { makeCtx } from "../domain/context";
import { DEMO_ENABLED } from "../app/features";
import { createDemoRepository } from "../storage/demoRepository";
import { LockScreen } from "../features/zamok/Lock";
import { FirstSetup } from "./Sprievodca";
import { ModulesProvider, useModules } from "./Moduly";
import { useSection } from "./Navigacia";
import { IosInstallGate, Shell, isStandalone } from "./Shell";
import { isIosSafari } from "../app/ios";
import { useAutomaticUpdates } from "./useAutomaticUpdates";
import { SectionView } from "./Sekcie";

/** Kontext vypočítaný raz pre všetky sekcie. */


const SKIP_FIRST_SETUP_KEY = "fs-skip-first-setup";


export function App() {
  return (
    <ModulesProvider>
      <AppContent />
    </ModulesProvider>
  );
}

function AppContent() {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [settingsFlash, setSettingsFlash] = useState<string | null>(null);
  const [budgetFlash, setBudgetFlash] = useState<string | null>(null);
  // Lokálny PIN (D-119): pinSet = PIN je zapnutý; locked = appka čaká na odomknutie.
  const [pinSet, setPinSet] = useState(false);
  const [locked, setLocked] = useState(false);
  // Sprievodca otvorený z Nastavení nad existujúcimi údajmi (nemaže dáta).
  const [wizardOpen, setWizardOpen] = useState(false);
  const { visible } = useModules();
  const section = useSection(visible);
  // Voľba „preskočiť“ sa pamätá v tomto zariadení (per-zariadenie predvoľba); bez úložiska ostáva v pamäti.
  const [skipFirstSetup, setSkipFirstSetup] = useState(() => {
    try {
      return localStorage.getItem(SKIP_FIRST_SETUP_KEY) === "1";
    } catch {
      return false;
    }
  });
  const skipFirstSetupAndRemember = () => {
    try {
      localStorage.setItem(SKIP_FIRST_SETUP_KEY, "1");
    } catch {
      // bez úložiska sa voľba udrží len do obnovenia stránky
    }
    setSkipFirstSetup(true);
  };

  useEffect(() => {
    let alive = true;
    const openRepo = DEMO_ENABLED ? Promise.resolve(createDemoRepository()) : openRepository();
    openRepo
      .then(async (r) => {
        const d = await r.getData();
        if (!alive) return;
        setRepo(r);
        setData(d);
        setLastExport(await r.getMeta("lastExportAt"));
        const pinRecord = await r.getMeta("pin");
        setPinSet(!!pinRecord);
        setLocked(!!pinRecord);
      })
      .catch((e) => setError(`Úložisko sa nepodarilo otvoriť: ${String(e)}`));
    return () => {
      alive = false;
    };
  }, []);

  const reload = async () => {
    if (!repo) return;
    setData(await repo.getData());
    // PIN mohol vzniknúť v onboardingu; stav sa musí načítať znova (D-119).
    setPinSet(!!(await repo.getMeta("pin")));
  };

  useAutomaticUpdates(repo, data, reload);

  // Brána len v Safari (D-053); iné iOS prehliadače appku neblokujú, viď Shell (D-168).
  if (isIosSafari(navigator.userAgent) && !isStandalone()) return <Shell><IosInstallGate /></Shell>;
  if (error) return <Shell><p style={{ color: "var(--danger)" }}>{error}</p></Shell>;
  if (!repo || !data) return <Shell><p>Načítavam údaje…</p></Shell>;
  if (locked) return <Shell><LockScreen repo={repo} onUnlock={() => setLocked(false)} onWiped={() => { setLocked(false); setPinSet(false); void reload(); }} /></Shell>;

  const ctx = makeCtx(data);
  // FR-12: prvé spustenie (prázdne nastavenia a žiadne vyhodnotenie) ide cez sprievodcu, kým ho používateľ nepreskočí.
  if (wizardOpen) {
    return (
      <Shell>
        <FirstSetup
          repo={repo}
          rerun
          initial={{ expenses: data.settings ? data.settings.expensesCents / 100 : "", withdrawal: data.settings ? Number((data.settings.withdrawalRate * 100).toFixed(4)) : "", inv: ctx.capital.inv / 100, cash: ctx.capital.cash / 100 }}
          onChanged={() => { setWizardOpen(false); void reload(); }}
          onSkip={() => setWizardOpen(false)}
        />
      </Shell>
    );
  }
  if (!data.settings && data.snapshots.length === 0 && !skipFirstSetup) {
    return (
      <Shell>
        <FirstSetup repo={repo} onChanged={reload} onSkip={skipFirstSetupAndRemember} />
      </Shell>
    );
  }
  return (
    <Shell nav={section}>
      <SectionView
        key={section}
        section={section}
        repo={repo}
        data={data}
        ctx={ctx}
        reload={reload}
        lastExport={lastExport}
        setLastExport={setLastExport}
        budgetFlash={budgetFlash}
        setBudgetFlash={setBudgetFlash}
        settingsFlash={settingsFlash}
        setSettingsFlash={setSettingsFlash}
        pinSet={pinSet}
        setPinSet={setPinSet}
        setLocked={setLocked}
        setWizardOpen={setWizardOpen}
      />
    </Shell>
  );
}
