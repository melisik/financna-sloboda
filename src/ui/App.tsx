import { useEffect, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import type { AppData } from "../storage/types";
import { amortizeLoan, amortizeMortgage } from "../domain/mortgage";
import { FEEDBACK_FORM_URL, feedbackIssueUrl } from "../app/feedback";
import { investmentsTotalCents } from "../domain/investments";
import { PHASE2_ENABLED } from "../app/features";
import { makeCtx } from "../domain/context";
import { todayIso } from "./kit/format";
import { uid } from "./kit/ids";
import { StockSection } from "../features/sklad/Sklad";
import { BackupSection } from "../features/zaloha/BackupSection";
import { LockScreen, PinSection } from "../features/zamok/Lock";
import { DogSection, TaxFormBlock, TaxSection } from "../features/dane/Dane";
import { LiabilitySection } from "../features/zavazky/Zavazky";
import { TransactionSection } from "../features/transakcie/Transakcie";
import { SnapshotSection } from "../features/vyhodnotenie/Vyhodnotenie";
import { SettingsSection } from "../features/nastavenia/Nastavenia";
import { HomeSection } from "../features/prehlad/Prehlad";
import { NavodBlock } from "../features/prehlad/Navod";
import { RocnyPrehladSection } from "../features/rocny-prehlad/RocnyPrehlad";
import { FirstSetup } from "./Sprievodca";
import { ModulesBlock, ModulesProvider, useModules } from "./Moduly";
import { Nav, useSection, type SectionId } from "./Navigacia";
import { InvestmentSection } from "../features/investicie/Investicie";
import { IncomeSection } from "../features/prijmy/Prijmy";
import { BudgetSection } from "../features/rozpocet/Rozpocet";
import { PropertySection } from "../features/majetok/Majetok";
import { RecurringSection } from "../features/pravidelne/Pravidelne";
import { Section, btn } from "./kit/controls";
import { isIosOtherBrowser, isIosSafari } from "../app/ios";
import { autoSnapshot } from "../app/autoEvaluation";

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
    openRepository()
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

  // Automatické vyhodnotenie (D-116): po zmene dát sa vytvorí vyhodnotenie za posledný ukončený mesiac, ak ešte nie je.
  // Po uložení sa dáta znova načítajú, a tak sa ďalšie vyhodnotenie nevytvorí, kým nenastane ďalší mesiac.
  useEffect(() => {
    if (!repo || !data || !data.settings) return;
    const ctxNow = makeCtx(data);
    const snap = autoSnapshot({
      latest: ctxNow.latest,
      transactions: data.transactions,
      positionsTotalCents: data.investments.length ? investmentsTotalCents(data.investments) : null,
      realReturn: ctxNow.realReturn,
      today: todayIso(),
      id: uid(),
      now: new Date().toISOString(),
    });
    if (snap) void repo.addSnapshot(snap).then(reload).catch(() => undefined);
  }, [repo, data]);

  // Automatické splácanie hypotéky (D-137): za uplynulé mesiace sa zostatok zníži o istinu; po uložení sa znova načíta.
  useEffect(() => {
    if (!repo || !data) return;
    const today = todayIso();
    const now = new Date().toISOString();
    const propertyUpdates = data.properties.flatMap((p) => {
      const upd = amortizeMortgage(p, today);
      return upd ? [{ ...p, ...upd, updatedAt: now }] : [];
    });
    // Úvery a kreditky (D-140) sa splácajú rovnako ako hypotéka.
    const liabilityUpdates = data.liabilities.flatMap((l) => {
      const upd = amortizeLoan(l.balanceCents, l.rate, l.monthlyPaymentCents, l.balanceDate, today);
      return upd ? [{ ...l, balanceCents: upd.balanceCents, balanceDate: upd.balanceDate, updatedAt: now }] : [];
    });
    if (propertyUpdates.length === 0 && liabilityUpdates.length === 0) return;
    void Promise.all([
      ...propertyUpdates.map((p) => repo.saveProperty(p)),
      ...liabilityUpdates.map((l) => repo.saveLiability(l)),
    ]).then(reload).catch(() => undefined);
  }, [repo, data]);

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
      {section === "prehlad" && (
        <Section id="prehlad" title="Prehľad">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <HomeSection data={data} ctx={ctx} lastExport={lastExport} incomeVisible={visible.has("prijmy")} />
              <NavodBlock />
            </div>
            {PHASE2_ENABLED && (
              <aside style={{ flex: "0 0 260px", maxWidth: "100%", background: "var(--surface)", padding: 12, borderRadius: 8 }}>
                <ModulesBlock style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }} />
              </aside>
            )}
          </div>
        </Section>
      )}
      {section === "nova-transakcia" && (
        <Section id="nova-transakcia" title="Transakcie">
          <TransactionSection repo={repo} data={data} ctx={ctx} onChanged={reload} />
        </Section>
      )}
      {section === "vyhodnotenie" && (
        <Section id="vyhodnotenie" title="Vyhodnotenie">
          <SnapshotSection key={`${ctx.latest?.id ?? "none"}-${ctx.capital.inv}-${ctx.capital.cash}-${data.investments.length}`} repo={repo} latest={ctx.latest} capital={ctx.capital} derivedInvCents={data.investments.length ? investmentsTotalCents(data.investments) : null} snapshots={data.snapshots} properties={data.properties} positions={data.investments} onSaved={reload} />
        </Section>
      )}
      {section === "majetok" && (
        <Section id="majetok" title="Majetok">
          <PropertySection repo={repo} properties={data.properties} assets={data.assets} today={todayIso()} onSaved={reload} />
        </Section>
      )}
      {section === "rozpocet" && (
        <Section id="rozpocet" title="Rozpočet">
          {budgetFlash && <p style={{ background: "var(--ok-bg)", padding: 8, borderRadius: 6, color: "var(--ok)" }}>{budgetFlash}</p>}
          <BudgetSection key={data.budgets.map((b) => `${b.category}${b.limitCents}`).join("|")} repo={repo} budgets={data.budgets} transactions={data.transactions} recurring={data.recurringExpenses} properties={data.properties} today={todayIso()} onSaved={() => { reload(); setBudgetFlash("Rozpočet je uložený."); }} />
        </Section>
      )}
      {section === "prijmy" && (
        <Section id="prijmy" title="Príjmy">
          <IncomeSection repo={repo} incomes={data.incomes} data={data} today={todayIso()} onSaved={reload} />
        </Section>
      )}
      {section === "zavazky" && (
        <Section id="zavazky" title="Záväzky">
          <LiabilitySection repo={repo} liabilities={data.liabilities} today={todayIso()} onSaved={reload} />
        </Section>
      )}
      {section === "investicie" && (
        <Section id="investicie" title="Investície">
          <InvestmentSection repo={repo} positions={data.investments} today={todayIso()} onSaved={reload} />
        </Section>
      )}
      {section === "pravidelne-vydavky" && (
        <Section id="pravidelne-vydavky" title="Pravidelné výdavky">
          <RecurringSection repo={repo} items={data.recurringExpenses} today={todayIso()} onSaved={reload} />
        </Section>
      )}
      {section === "dane" && (
        <Section id="dane" title="Dane">
          <TaxSection positions={data.investments} />
          <DogSection repo={repo} dogs={data.dogs} today={todayIso()} onSaved={reload} />
          <TaxFormBlock properties={data.properties} dogs={data.dogs} today={todayIso()} />
        </Section>
      )}
      {section === "sklad" && (
        <Section id="sklad" title="Sklad">
          <StockSection repo={repo} items={data.stockItems} recipes={data.recipes} today={todayIso()} onSaved={reload} />
        </Section>
      )}
      {section === "rocny-prehlad" && (
        <Section id="rocny-prehlad" title="Ročný prehľad">
          <RocnyPrehladSection data={data} ctx={ctx} />
        </Section>
      )}
      {section === "nastavenia" && (
        <Section id="nastavenia" title="Nastavenia">
          {settingsFlash && <p style={{ background: "var(--ok-bg)", padding: 8, borderRadius: 6, color: "var(--ok)" }}>{settingsFlash}</p>}
          <SettingsSection key={JSON.stringify(data.settings)} repo={repo} settings={data.settings} derived={ctx.derived} onSaved={() => { reload(); setSettingsFlash("Nastavenia sú uložené."); }} />
          <ModulesBlock />
          <section style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: "1rem" }}>Sprievodca</h3>
            <p style={{ color: "var(--muted)" }}>Prejdi sprievodcu znova. Údaje sa predvyplnia a nič sa nevymaže.</p>
            <button onClick={() => setWizardOpen(true)} style={btn}>Spustiť sprievodcu znova</button>
          </section>
          <PinSection repo={repo} pinSet={pinSet} onChanged={(on) => setPinSet(on)} onLock={() => setLocked(true)} />
        </Section>
      )}
      {section === "zaloha" && (
        <Section id="zaloha" title="Záloha">
          <BackupSection repo={repo} data={data} lastExport={lastExport} onChanged={reload} onExported={async (iso) => { await repo.setMeta("lastExportAt", iso); setLastExport(iso); }} />
        </Section>
      )}
    </Shell>
  );
}

function isStandalone(): boolean {
  return (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) || (navigator as { standalone?: boolean }).standalone === true;
}
function IosInstallGate() {
  return (
    <div style={{ background: "var(--ok-bg)", padding: 16, borderRadius: 8 }}>
      <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Najprv pridaj appku na plochu</h2>
      <p>Údaje sa v Safari ukladajú slabšie. Na plochu sa appka pridá takto: klikni <strong>Zdieľať</strong> (štvorček so šípkou), vyber <strong>Pridať na plochu</strong> a potom otvor appku z ikony.</p>
      <p style={{ color: "var(--muted)" }}>Potom už budeš pracovať len z ikony na ploche.</p>
    </div>
  );
}

/** Nahlásenie pripomienky (D-149): tester si vyberie GitHub, alebo formulár bez účtu. */
function Feedback() {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} style={{ ...btn, marginTop: 16 }}>Nahlásiť pripomienku</button>;
  return (
    <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      <p>Vyber, ako pripomienku pošleš. Nepíš čísla účtov ani osobné údaje.</p>
      <a href={feedbackIssueUrl()} target="_blank" rel="noopener noreferrer" style={btn}>Mám účet na GitHube</a>{" "}
      <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" style={btn}>Nemám účet</a>{" "}
      <button onClick={() => setOpen(false)} style={btn}>Zrušiť</button>
    </div>
  );
}

function Shell({ children, nav }: { children: React.ReactNode; nav?: SectionId }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "16px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: "1.5rem" }}>Finančná sloboda</h1>
      <div role="note" style={{ background: "var(--warn-bg)", padding: 10, borderRadius: 6, marginBottom: 12, fontSize: "0.9rem" }}>
        <strong>Skúšobná verzia.</strong> Údaje sú len v tomto zariadení, nie sú zašifrované a môžu sa stratiť, preto si pravidelne ukladaj zálohu. Appka sa poskytuje bez záruky a nie je finančné poradenstvo. Fáza 2 zatiaľ nie je právne posúdená ani bezpečnostne auditovaná.
      </div>
      <p style={{ color: "var(--muted)" }}>Údaje sa ukladajú len v tomto zariadení. Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.</p>
      {typeof navigator !== "undefined" && isIosOtherBrowser(navigator.userAgent) && !isStandalone() && (
        <p role="note" style={{ background: "var(--ok-bg)", padding: 10, borderRadius: 6, fontSize: "0.9rem" }}>
          Na plochu appku pridáš v Safari: otvor túto adresu v Safari, potom Zdieľať → Pridať na plochu. Tu ju môžeš používať aj bez toho.
        </p>
      )}
      {nav && <Nav active={nav} />}
      {children}
      <Feedback />
    </main>
  );
}


















