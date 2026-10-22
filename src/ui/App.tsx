import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import { STOCK_UNITS, type StockItem, type StockUnit, type AppData, type BudgetCategory, type Property, type Settings, type Snapshot, type Source, type Transaction, type TransactionType } from "../storage/types";
import { isValidPin, makePinRecord } from "../features/zamok/pin";
import { buildBackup, parseBackup } from "../storage/backup";
import { backupOverdue, reviewOverdue, settingsCheckOverdue } from "../domain/reminders";
import { targetAmountCents } from "../domain/goal";
import { goalDisplay } from "../domain/goalDisplay";
import { goalDateText } from "../domain/goalText";
import { formatImpactOutcome, plural, UNREACHABLE_IMPACT_TEXT } from "../domain/impact";
import { annualOverview, yearlySummary, type OverviewSettings } from "../domain/annualOverview";
import { monthlySaving } from "../domain/saving";
import { propertyChangedSince } from "../domain/property";
import { amortizeLoan, amortizeMortgage } from "../domain/mortgage";
import { FEEDBACK_FORM_URL, feedbackIssueUrl } from "../app/feedback";
import { investmentsTotalCents, positionsChangedSince } from "../domain/investments";
import { monthlyIncomeCents } from "../domain/income";
import { weeklySummary } from "../domain/weekly";
import { monthSummary } from "../domain/monthSummary";
import { endingSoon } from "../domain/recurring";
import { PHASE2_ENABLED } from "../app/features";
import { makeCtx, type Ctx } from "../domain/context";
import { MONTHS, cents, dateSk, eur, monthYear, todayIso } from "./kit/format";
import { uid } from "./kit/ids";
import { RecipesBlock, StockSection } from "../features/sklad/Sklad";
import { saveBlobFile, saveTextFile } from "./kit/files";
import { STORAGE_ERROR } from "./kit/messages";
import { BackupSection, exportBackupFile } from "../features/zaloha/BackupSection";
import { LockScreen, PinSection } from "../features/zamok/Lock";
import { DogSection, TaxFormBlock, TaxSection } from "../features/dane/Dane";
import { LiabilitySection } from "../features/zavazky/Zavazky";
import { TransactionSection } from "../features/transakcie/Transakcie";
import { SnapshotSection } from "../features/vyhodnotenie/Vyhodnotenie";
import { InvestmentSection } from "../features/investicie/Investicie";
import { IncomeSection } from "../features/prijmy/Prijmy";
import { BudgetSection } from "../features/rozpocet/Rozpocet";
import { PropertySection } from "../features/majetok/Majetok";
import { RecurringSection } from "../features/pravidelne/Pravidelne";
import { Field, Section, asNum, btn, inp, type NumIn, differs } from "./kit/controls";
import { isIosOtherBrowser, isIosSafari } from "../app/ios";
import { CORE_SECTION_IDS, OPTIONAL_MODULES, readModuleChoice, visibleSectionIds, writeModuleChoice } from "../app/modules";
import { isReceiptId, RECEIPT_CHECK_URL, receiptIdFromQr } from "../domain/receipt";
import { parseReceiptItems } from "../domain/receiptItems";
import type { Recipe, RecipeIngredient, Attachment } from "../storage/types";
import { autoSnapshot } from "../app/autoEvaluation";
import { recommendedSettings } from "../domain/recommendations";
import { LONG_HORIZON_MONTHS, netRealReturn, nominalFromReal, RETURN_ASSUMPTIONS } from "../domain/assumptions";
import { goalMonths, impactWithRentals, rentalsFor, type Rental } from "../domain/rentalGoal";
import {
  payFromCash,
  payFromInvestments,
  transferToInvestments,
  type Capital,
} from "../domain/capital";




/** Kontext vypočítaný raz pre všetky sekcie. */
const pctText = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;

/** Dátum cieľa pre danú mieru výnosu (FR-02, FR-03). */
function scenarioText(ctx: Ctx, rate: number, capital: Capital = ctx.capital): string {
  if (!ctx.latest || ctx.target === null) return "—";
  const g = goalMonths(capital, ctx.mInv, ctx.mCash, rate, ctx.target, ctx.rentals);
  if (g.kind === "cash_exhausted") return `Hotovosť by sa vyčerpala v mesiaci ${g.month}; dátum sa nezobrazuje.`;
  const display = goalDisplay(g.kind === "months" ? g.months : null, ctx.latest.date, todayIso());
  return goalDateText(display, ctx.mInv + ctx.mCash === 0, monthYear);
}

const SKIP_FIRST_SETUP_KEY = "fs-skip-first-setup";

type ModulesValue = { visible: Set<string>; choice: string[] | null; setChoice: (ids: string[]) => void };
const ModulesCtx = createContext<ModulesValue>({ visible: new Set(CORE_SECTION_IDS), choice: null, setChoice: () => undefined });

/** Výber voliteľných modulov pre celú appku (D-162). Sekcie a navigácia čítajú viditeľnosť odtiaľto. */
function useModules(): ModulesValue {
  return useContext(ModulesCtx);
}

function ModulesProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<string[] | null>(readModuleChoice);
  const visible = useMemo(() => visibleSectionIds(choice, PHASE2_ENABLED), [choice]);
  return <ModulesCtx.Provider value={{ visible, choice, setChoice }}>{children}</ModulesCtx.Provider>;
}

/** Zaškrtávacie políčka voliteľných modulov (Sprievodca aj Nastavenia). Jadro sa nezobrazuje, je vždy zapnuté. */
function ModuleCheckboxes({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...selected, id] : selected.filter((x) => x !== id);
    onChange(OPTIONAL_MODULES.map((m) => m.id).filter((x) => next.includes(x)));
  };
  return (
    <>
      {OPTIONAL_MODULES.map((m) => (
        <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
          <input type="checkbox" checked={selected.includes(m.id)} onChange={(e) => toggle(m.id, e.target.checked)} />
          {m.label}
        </label>
      ))}
    </>
  );
}

/** Nastavenia → Moduly. Vypnutie skryje sekcie; údaje ostanú a výpočty sa nemenia (D-162). */
function ModulesBlock({ style }: { style?: React.CSSProperties }) {
  const { choice, setChoice } = useModules();
  if (!PHASE2_ENABLED) return null;
  const selected = choice ?? OPTIONAL_MODULES.map((m) => m.id);
  return (
    <section aria-label="Moduly" style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12, ...style }}>
      <h3 style={{ fontSize: "1.05rem" }}>Moduly</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        Vypnutá sekcia sa skryje. Údaje v nej ostanú uložené a výpočty v appke sa nemenia.
      </p>
      <ModuleCheckboxes
        selected={selected}
        onChange={(ids) => {
          writeModuleChoice(ids);
          setChoice(ids);
        }}
      />
    </section>
  );
}

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
              <HomeSection data={data} ctx={ctx} lastExport={lastExport} />
              <details id="navod" style={{ marginTop: 16, background: "var(--surface)", padding: 12, borderRadius: 8 }}>
                <summary style={{ fontWeight: 600, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Návod</summary>
                <ol style={{ paddingLeft: 20 }}>
                  <li><strong>Prvé nastavenie:</strong> pri prvom spustení zadaj ročné výdavky a mieru výberu. Ostatné polia majú východiskové hodnoty.</li>
                  <li><strong>Vyhodnotenie:</strong> mesačné vyhodnotenie vzniká automaticky. Ručne ho zadáš len na opravu. Dátum cieľa sa mení len po vyhodnotení.</li>
                  <li><strong>Rozpočet:</strong> limity na kategórie sú mesačný plán. Prehľad ukáže plnenie a rozpis na nevyhnutné a nie nevyhnutné výdavky.</li>
                  <li><strong>Transakcie:</strong> zapisuj sporenie, investície a výdavky. Výdavok nad prah sa zvýrazní.</li>
                  <li><strong>Záloha:</strong> pravidelne exportuj zálohu. Dáta sú len v tomto zariadení; neukladaj ju do verejných priečinkov.</li>
                  <li><strong>Obnova:</strong> import nahradí všetky dáta a vyžaduje potvrdenie.</li>
                </ol>
                <p>
                  <strong>Ako testovať:</strong> stiahnite testovaciu zálohu nižšie a importujte ju v sekcii Záloha. Skúste pridať výdavok s kategóriou, zadať vyhodnotenie, exportovať zálohu a znova ju importovať. Pripomienky pošlite autorovi spôsobom, ktorý ste dostali.
                </p>
                <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                  Výpočty sú odhady podľa zadaných predpokladov, nie finančné poradenstvo.
                  Testovacie dáta (syntetické): <a href="./testovacia-zaloha.json" download>stiahnuť testovaciu zálohu</a>, potom ju importuj v sekcii Záloha.
                </p>
              </details>
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

/**
 * Sprievodca prvým nastavením (FR-12): dva kroky, každý sa dá preskočiť.
 * Krok 1: cieľ a prah (SettingsSection). Krok 2: investície a prvé vyhodnotenie (SnapshotSection);
 * uložením vyhodnotenia sa nastaví D_L a sprievodca zmizne.
 */
/** Sprievodca prvým nastavením (FR-12, D-117, docs/20): jedna otázka na obrazovke, krok so zálohou, výsledok. */
const ONBOARD_STEP_KEY = "fs-onboarding-step";
const ONBOARD_STEPS = 8; // 0 úvod, 1 výdavky, 2 miera výberu, 3 dnešný stav, 4 záloha, 5 PIN (voliteľný), 6 moduly, 7 výsledok

function FirstSetup({ repo, onChanged, onSkip, rerun = false, initial }: { repo: Repository; onChanged: () => void; onSkip: () => void; rerun?: boolean; initial?: { expenses: NumIn; withdrawal: NumIn; inv: number; cash: number } }) {
  const [step, setStep] = useState<number>(() => {
    if (rerun) return 0;
    try {
      const n = Number(localStorage.getItem(ONBOARD_STEP_KEY));
      return Number.isInteger(n) && n >= 0 && n < ONBOARD_STEPS ? n : 0;
    } catch {
      return 0;
    }
  });
  const [expenses, setExpenses] = useState<NumIn>(initial?.expenses ?? "");
  const [withdrawal, setWithdrawal] = useState<NumIn>(initial?.withdrawal ?? "");
  const [inv, setInv] = useState<NumIn>(initial ? initial.inv : "");
  const [cash, setCash] = useState<NumIn>(initial ? initial.cash : "");
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pinNew, setPinNew] = useState("");
  const [pinRepeat, setPinRepeat] = useState("");
  const { choice, setChoice } = useModules();
  const [modules, setModules] = useState<string[]>(choice ?? []);

  const go = (n: number) => {
    setErr(null);
    setStep(n);
    if (rerun) return;
    try {
      localStorage.setItem(ONBOARD_STEP_KEY, String(n));
    } catch {
      // bez úložiska sa priebeh udrží len do obnovenia stránky
    }
  };
  const rec = recommendedSettings(Number.isNaN(asNum(expenses)) ? 0 : cents(asNum(expenses)));

  const saveAll = async () => {
    const invVal = asNum(inv);
    const cashVal = asNum(cash);
    if (Number.isNaN(invVal) || Number.isNaN(cashVal)) return setErr("Vyplň hodnotu investícií aj hotovosti. Ak nemáš, zadaj 0.");
    if (invVal < 0 || cashVal < 0) return setErr("Hodnoty nesmú byť záporné.");
    setBusy(true);
    try {
      const wr = Number.isNaN(asNum(withdrawal)) ? rec.withdrawalRate : asNum(withdrawal) / 100;
      await repo.saveSettings({
        expensesCents: cents(asNum(expenses)),
        withdrawalRate: wr,
        realReturn: rec.realReturn,
        feesRate: 0,
        reserveCents: rec.reserveCents,
        thresholdCents: rec.thresholdCents,
        checkedAt: new Date().toISOString(),
      });
      // Vyhodnotenie na dnešok sa prepíše, nie zdvojí (rovnaké pravidlo ako vo Vyhodnotení).
      const sameDay = (await repo.getData()).snapshots.find((x) => x.date === todayIso());
      await repo.addManualSnapshot({ id: sameDay?.id ?? uid(), date: todayIso(), investmentsCents: cents(invVal), cashCents: cents(cashVal), createdAt: new Date().toISOString() });
      const fresh = await repo.getData();
      const c = makeCtx(fresh);
      setResult(scenarioText(c, c.realReturn));
      go(4);
    } catch {
      setErr(STORAGE_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const nextFromExpenses = () => {
    const e = asNum(expenses);
    if (Number.isNaN(e)) return setErr("Vyplň ročné výdavky. Napríklad 24 000 € ročne.");
    if (!(e > 0)) return setErr("Ročné výdavky musia byť väčšie ako 0.");
    go(2);
  };

  const backupNow = async () => {
    try {
      const d = await repo.getData();
      const r = await exportBackupFile(d, await repo.listAllAttachments());
      if (r.result !== "cancelled") await repo.setMeta("lastExportAt", r.exportedAt);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const finish = () => {
    if (rerun) return onChanged();
    try {
      localStorage.removeItem(ONBOARD_STEP_KEY);
    } catch {
      // nič
    }
    onChanged();
  };

  const nav = (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {step > 0 && step < 7 && <button onClick={() => go(step - 1)} style={btn}>Späť</button>}
        <button onClick={onSkip} style={btn}>{rerun ? "Zavrieť sprievodcu" : "Preskočiť na hlavnú stránku"}</button>
      </div>
      {!rerun && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Návod nájdeš v sekcii Prehľad, dole pod „Návod“.</p>}
    </div>
  );

  return (
    <section aria-label="Prvé nastavenie">
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Krok {step + 1} z {ONBOARD_STEPS}</p>
      {step === 0 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Vitaj</h2>
          <p>Appka ukáže, kedy by si mohol dosiahnuť finančnú slobodu, ak budeš pokračovať v sporení. Údaje zostávajú len v tomto telefóne.</p>
          <p style={{ color: "var(--muted)" }}>Výsledky sú odhady podľa tvojich predpokladov, nie finančné poradenstvo.</p>
          <button onClick={() => go(1)} style={btn}>Pokračovať</button>
          {nav}
        </>
      )}
      {step === 1 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Koľko by si ročne potreboval na život?</h2>
          <p style={{ color: "var(--muted)" }}>Suma, ktorú by si ročne minul bez práce. Napríklad 24 000 € ročne.</p>
          <Field label="Ročné výdavky pri nezávislosti (€)" value={expenses} onChange={setExpenses} />
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          <button onClick={nextFromExpenses} style={btn}>Pokračovať</button>
          {nav}
        </>
      )}
      {step === 2 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Koľko z kapitálu ročne vyberieš?</h2>
          <p style={{ color: "var(--muted)" }}>Miera výberu je podiel kapitálu, ktorý ročne minieš. Ak nevieš, nechaj ju prázdnu: použije sa východisková hodnota {(rec.withdrawalRate * 100).toFixed(1).replace(".", ",")} %.</p>
          <Field label="Miera výberu (%)" value={withdrawal} step={0.1} onChange={setWithdrawal} />
          <button onClick={() => go(3)} style={btn}>{withdrawal === "" ? `Nechať ${(rec.withdrawalRate * 100).toFixed(1).replace(".", ",")} %` : "Pokračovať"}</button>
          {nav}
        </>
      )}
      {step === 3 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Koľko máš dnes?</h2>
          <p style={{ color: "var(--muted)" }}>Investície sú súčet účtov a cenných papierov. Hotovosť je suma, ktorú máš na účte. Môžeš to neskôr zmeniť.</p>
          <Field label="Hodnota investícií (€)" value={inv} onChange={setInv} hint="súčet účtov a cenných papierov, napr. stav v aplikácii banky alebo brokera; 0, ak nemáš" />
          <Field label="Nasporená suma, hotovosť (€)" value={cash} onChange={setCash} hint="zostatok na bežnom účte a v peňaženke; 0, ak nemáš" />
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          <button onClick={saveAll} disabled={busy} style={btn}>Uložiť a zobraziť dátum</button>
          {nav}
        </>
      )}
      {step === 4 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Ulož si zálohu</h2>
          <p>Údaje sú len v tomto telefóne. Ak telefón stratíš alebo vymažeš prehliadač, údaje budú preč.</p>
          <p style={{ color: "var(--muted)" }}>Stiahni si zálohu a ulož ju mimo telefónu. Zálohu môžeš urobiť aj neskôr v sekcii Záloha.</p>
          <button onClick={backupNow} style={btn}>Stiahnuť zálohu</button>{" "}
          <button onClick={() => go(rerun ? 7 : 5)} style={btn}>Pokračovať</button>
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
        </>
      )}
      {step === 5 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Chceš PIN?</h2>
          <p style={{ color: "var(--muted)" }}>PIN je nepovinný. Ak ho nastavíš, appka sa pri otvorení najprv opýta na PIN. PIN chráni prístup v tomto telefóne, údaje nie sú zašifrované.</p>
          <Field label="Nový PIN (4 až 6 číslic)" value={pinNew} type="password" inputMode="numeric" onChange={setPinNew} />
          <Field label="Zopakuj PIN" value={pinRepeat} type="password" inputMode="numeric" onChange={setPinRepeat} />
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          <button
            onClick={async () => {
              if (!isValidPin(pinNew)) return setErr("PIN musí mať 4 až 6 číslic.");
              if (pinNew !== pinRepeat) return setErr("PIN sa nezhoduje so zopakovaním.");
              try {
                await repo.setMeta("pin", await makePinRecord(pinNew));
                go(6);
              } catch {
                setErr(STORAGE_ERROR);
              }
            }}
            style={btn}
          >
            Nastaviť PIN
          </button>{" "}
          <button onClick={() => go(6)} style={btn}>Bez PIN</button>
        </>
      )}
      {step === 6 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Čo chceš sledovať?</h2>
          <p style={{ color: "var(--muted)" }}>
            Vždy vidíš Prehľad, Transakcie, Vyhodnotenie, Rozpočet, Pravidelné výdavky, Nastavenia a Zálohu.
            Ostatné sekcie zapni, ak ich budeš používať. Neskôr ich zapneš alebo vypneš v Nastaveniach.
          </p>
          {PHASE2_ENABLED ? (
            <ModuleCheckboxes selected={modules} onChange={setModules} />
          ) : (
            <p style={{ color: "var(--muted)" }}>V tejto zostave sú dostupné všetky základné sekcie.</p>
          )}
          <button
            onClick={() => {
              writeModuleChoice(modules);
              setChoice(modules);
              go(7);
            }}
            style={btn}
          >
            Pokračovať
          </button>
        </>
      )}
      {step === 7 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Hotovo</h2>
          {result && <p>Dátum cieľa: <strong>{result}</strong></p>}
          <p style={{ color: "var(--muted)" }}>Ďalšie kroky:</p>
          <ol style={{ paddingLeft: 20 }}>
            <li>Zapíš transakcie, keď niečo sporíš alebo minieš (sekcia Transakcie).</li>
            <li>Na konci mesiaca zapíš stav investícií a hotovosti (sekcia Vyhodnotenie).</li>
            <li>Občas si ulož zálohu (sekcia Záloha).</li>
          </ol>
          <button onClick={finish} style={btn}>{rerun ? "Zavrieť" : "Otvoriť prehľad"}</button>
        </>
      )}
    </section>
  );
}


type SectionId = "prehlad" | "nova-transakcia" | "prijmy" | "rozpocet" | "vyhodnotenie" | "majetok" | "zavazky" | "investicie" | "pravidelne-vydavky" | "dane" | "sklad" | "rocny-prehlad" | "nastavenia" | "zaloha";

const NAV: { id: SectionId; label: string }[] = [
  { id: "prehlad", label: "Prehľad" },
  { id: "nova-transakcia", label: "Transakcie" },
  { id: "prijmy", label: "Príjmy" },
  { id: "rozpocet", label: "Rozpočet" },
  { id: "vyhodnotenie", label: "Vyhodnotenie" },
  { id: "majetok", label: "Majetok" },
  { id: "zavazky", label: "Záväzky" },
  { id: "investicie", label: "Investície" },
  { id: "pravidelne-vydavky", label: "Pravidelné výdavky" },
  { id: "dane", label: "Dane" },
  { id: "sklad", label: "Sklad" },
  { id: "rocny-prehlad", label: "Ročný prehľad" },
  { id: "nastavenia", label: "Nastavenia" },
  { id: "zaloha", label: "Záloha" },
];

/** Sekcia z kotvy v adrese; bez platnej kotvy ide na Prehľad. */
function sectionFromHash(visible: Set<string>): SectionId {
  const id = window.location.hash.slice(1);
  return visible.has(id) ? (id as SectionId) : "prehlad";
}

/** Zobrazí sa len jedna sekcia; zmena kotvy (odkaz v paneli) ju prepne. */
function useSection(visible: Set<string>): SectionId {
  const [section, setSection] = useState<SectionId>(() => sectionFromHash(visible));
  useEffect(() => {
    const onChange = () => {
      setSection(sectionFromHash(visible));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [visible]);
  // Skrytú sekciu (po vypnutí modulu) nahradí Prehľad, aj keď ju ešte držal stav.
  return visible.has(section) ? section : "prehlad";
}

/** Horný panel: všetky viditeľné sekcie naraz; ak sa nezmestia do riadku, zalomia sa do ďalšieho (D-170). Dotyková plocha aspoň 44 px. */
function Nav({ active }: { active: SectionId }) {
  const { visible } = useModules();
  return (
    <div style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 1, borderBottom: "1px solid var(--border-soft)" }}>
      <nav aria-label="Hlavná navigácia" style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 0" }}>
        {NAV.filter((n) => visible.has(n.id)).map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            aria-current={n.id === active ? "page" : undefined}
            style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 12px", borderRadius: 999, border: "1px solid var(--border-soft)", background: n.id === active ? "var(--ok-bg)" : "var(--surface)", color: "inherit", whiteSpace: "nowrap", fontSize: "0.9rem", fontWeight: n.id === active ? 700 : 400, textDecoration: "none" }}
          >
            {n.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

/** Nadpis a obsah jednej sekcie (zobrazuje sa samostatne). */

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

/** Zmena dátumu cieľa v mesiacoch, slovne (docs/13, oddiel 4). */
function goalShiftText(d: number): string {
  if (d === 0) return "bez zmeny";
  const k = Math.abs(d);
  return `o ${k} ${plural(k, "mesiac", "mesiace", "mesiacov")} ${d < 0 ? "skôr" : "neskôr"}`;
}

/** Ročný prehľad (docs/13, oddiel 4): história K a dátumu cieľa medzi vyhodnoteniami. Len zobrazenie. */
function RocnyPrehladSection({ data, ctx }: { data: AppData; ctx: Ctx }) {
  const s: OverviewSettings | null =
    ctx.settings && ctx.target !== null ? { target: ctx.target, realReturn: ctx.realReturn, mInv: ctx.mInv, mCash: ctx.mCash } : null;
  const rows = annualOverview(data.snapshots, s, data.transactions, ctx.rentals);
  const years = yearlySummary(data.snapshots, data.transactions);
  if (rows.length === 0) return <p>Zatiaľ nie sú vyhodnotenia. Prehľad sa zobrazí po prvom vyhodnotení.</p>;
  const savingZero = ctx.mInv + ctx.mCash === 0;
  return (
    <div>
      <p style={{ color: "var(--muted)" }}>Vyhodnotenia od najstaršieho. Dátum cieľa sa počíta z uloženého K a z aktuálnych Nastavení, bez nehnuteľností.</p>
      {!s && <p style={{ color: "var(--muted)" }}>Nastavenia nie sú zadané; zobrazí sa len K.</p>}
      <h3 style={{ fontSize: "1rem", marginTop: 16 }}>Súhrn po rokoch</h3>
      {years.map((y) => (
        <div key={y.year} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{y.year}</strong></p>
          {y.endK !== null && (
            <p style={{ margin: "4px 0" }}>
              K na konci roka: {eur(y.endK)}
              {y.deltaK !== null ? ` (zmena za rok ${y.deltaK >= 0 ? "+" : "−"}${eur(Math.abs(y.deltaK))})` : ""}
            </p>
          )}
          <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>Sporenie: {eur(y.sporenieCents)} · výdavky celkom: {eur(y.vydavkyCents)}</p>
          {y.topCategory && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Najviac sa minulo na: {y.topCategory.name} ({eur(y.topCategory.cents)})</p>
          )}
        </div>
      ))}
      <h3 style={{ fontSize: "1rem", marginTop: 16 }}>Vyhodnotenia</h3>
      {rows.map((r) => (
        <div key={r.date} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{dateSk(r.date)}</strong>{r.auto ? " · automaticky" : ""}</p>
          <p style={{ margin: "4px 0" }}>K: {eur(r.totalCents)} (investície {eur(r.invCents)}, hotovosť {eur(r.cashCents)})</p>
          {r.deltaTotalCents !== null && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              Zmena K: {r.deltaTotalCents >= 0 ? "+" : "−"}{eur(Math.abs(r.deltaTotalCents))}
            </p>
          )}
          {r.sporenieCents !== null && r.vydavkyCents !== null && r.ostatneCents !== null && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              z toho sporenie {eur(r.sporenieCents)}, výdavky −{eur(r.vydavkyCents)}, výnos a ostatné {r.ostatneCents >= 0 ? "+" : "−"}{eur(Math.abs(r.ostatneCents))}
            </p>
          )}
          {r.goal && <p style={{ margin: "4px 0" }}>Dátum cieľa: <strong>{goalDateText(r.goal, savingZero, monthYear)}</strong></p>}
          {r.deltaGoalMonths !== null && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Zmena dátumu cieľa: {goalShiftText(r.deltaGoalMonths)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function HomeSection({ data, ctx, lastExport }: { data: AppData; ctx: Ctx; lastExport: string | null }) {
  const today = todayIso();
  const pending =
    ctx.latest && ctx.target !== null && ctx.settings
      ? impactWithRentals({ inv: ctx.latest.investmentsCents, cash: ctx.latest.cashCents }, ctx.capital, ctx.mInv, ctx.mCash, ctx.realReturn, ctx.target, ctx.rentals)
      : null;
  return (
    <div>
      {ctx.latest && positionsChangedSince(data.investments, ctx.latest.createdAt) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
          Investície sa zmenili od posledného vyhodnotenia. Dátum cieľa sa prepočíta až pri novom vyhodnotení.
        </p>
      )}
      {ctx.latest && propertyChangedSince(data.properties, ctx.latest.createdAt) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
          Majetok sa zmenil od posledného vyhodnotenia. Dátum cieľa sa prepočíta až pri novom vyhodnotení.
        </p>
      )}
      {reviewOverdue(ctx.latest?.date ?? null, today) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
          Vyhodnotenie za predchádzajúci mesiac chýba. Dátum cieľa sa mení len pri vyhodnotení.
        </p>
      )}
      {data.settings !== null && settingsCheckOverdue(data.settings.checkedAt, today) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
          Nastavenia sa ešte neoverili alebo sú staršie ako rok. Skontroluj infláciu, rezervu a mieru výberu v sekcii Nastavenia.
        </p>
      )}
      {(data.snapshots.length > 0 || data.transactions.length > 0 || data.settings !== null) && backupOverdue(lastExport, today) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
          Záloha ešte nebola exportovaná alebo je staršia ako 7 dní. Dáta sú len v tomto zariadení.
        </p>
      )}
      <MonthSpendingBlock data={data} today={today} thresholdCents={ctx.settings?.thresholdCents ?? recommendedSettings(0).thresholdCents} />
      <WeeklySummaryBlock transactions={data.transactions} today={today} thresholdCents={ctx.settings?.thresholdCents ?? recommendedSettings(0).thresholdCents} />
      {ctx.target !== null ? <p>Cieľová suma: <strong>{eur(ctx.target)}</strong></p> : <p>Cieľová suma: <strong>nezadaná</strong>. Zadaj ročné výdavky v <a href="#nastavenia">Nastaveniach</a>; ostatné hodnoty sú predvolené.</p>}
      {(ctx.negative.cash || ctx.negative.inv) && (
        <p style={{ background: "var(--err-bg)", padding: 8, borderRadius: 6 }}>
          Pozor: záznamy vedú k zápornému stavu {ctx.negative.cash ? "hotovosti" : "investícií"} a hodnoty sú zarazené na 0. Skontroluj transakcie po poslednom vyhodnotení.
          {ctx.shortfall.inv > 0 && <> Prečerpanie investícií: <strong>{eur(ctx.shortfall.inv)}</strong>. Do hodnoty K sa nezapočíta.</>}
          {ctx.shortfall.cash > 0 && <> Prečerpanie hotovosti: <strong>{eur(ctx.shortfall.cash)}</strong>. Do hodnoty K sa nezapočíta.</>}
        </p>
      )}
      {ctx.latest && ctx.target !== null ? (
        <>
          <p>Dátum cieľa: <strong>{scenarioText(ctx, ctx.realReturn)}</strong></p>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
            Posledné vyhodnotenie: <strong>{dateSk(ctx.latest.date)}</strong>. Dátum sa zmení až po ďalšom vyhodnotení.
          </p>
          {ctx.latest.auto && (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
              Vyhodnotenie vzniklo automaticky z transakcií.
              {data.investments.length === 0 && " Investície sú odhad z výnosu r, kým ich neupravíš v sekcii Investície."}
            </p>
          )}
          {ctx.longHorizon && (
            <p style={{ fontSize: "0.9rem", background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
              Pri dlhom horizonte (viac ako 20 rokov) je predpoklad výnosu menej istý; výsledok je v dnešných eurách.
            </p>
          )}
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: "pointer", minHeight: 44, display: "inline-flex", alignItems: "center", padding: "8px 14px", border: "1px solid var(--muted)", borderRadius: 6, background: "var(--surface)", listStyle: "none" }}>Podrobnosti ▾</summary>
            <p>
              Rozsah dátumu: od {scenarioText(ctx, ctx.realReturn + 0.02)} do {scenarioText(ctx, Math.max(0, ctx.realReturn - 0.02))} (opatrný – základný – optimistický).
            </p>
            <p>
              Výnos: {pctText(ctx.realReturn)} reálne po poplatkoch, nominálne ≈ {pctText(nominalFromReal(ctx.realReturn, RETURN_ASSUMPTIONS.inflation))} pri inflácii 2 % (predpoklad).
            </p>
            <p>Kapitál: investície {eur(ctx.capital.inv)}, hotovosť {eur(ctx.capital.cash)}. Rezerva: {eur(ctx.reserve)}.</p>
            <p>
              Predbežný dopad posledných transakcií:{" "}
              <strong>{pending === null ? UNREACHABLE_IMPACT_TEXT : formatImpactOutcome(pending)}</strong>
            </p>
            <p style={{ color: "var(--muted)" }}>Transakcií: {data.transactions.length}</p>
          </details>
        </>
      ) : (
        <p>{ctx.latest ? "" : <>Urob prvé vyhodnotenie vo <a href="#vyhodnotenie">Vyhodnotení</a>. Dátum cieľa sa zobrazí po ňom.</>}</p>
      )}
      <a href="#nova-transakcia" style={{ ...btn, display: "inline-block", textDecoration: "none", color: "inherit", border: "1px solid var(--border-strong)", borderRadius: 4 }}>
        Pridať transakciu
      </a>
    </div>
  );
}

/** Výdavky tohto mesiaca: plnenie mesačného plánu a rozpis na nevyhnutné a nie nevyhnutné (D-131). */

/** Týždenný súhrn výdavkov (N-10): posledných 7 dní, uložiť ako textový súbor. */
function WeeklySummaryBlock({ transactions, today, thresholdCents }: { transactions: Transaction[]; today: string; thresholdCents: number }) {
  const [err, setErr] = useState<string | null>(null);
  const s = weeklySummary(transactions, today, thresholdCents);
  const save = async () => {
    const lines = [
      "Týždenný súhrn výdavkov",
      `Obdobie: ${dateSk(s.fromIso)} – ${dateSk(s.toIso)}`,
      `Výdavky spolu: ${eur(s.totalCents)}`,
      `Počet zápisov: ${s.count}`,
      `Nad prahom: ${s.overThresholdCount}`,
      "",
      "Podľa kategórií:",
      ...(s.byCategory.length === 0 ? ["(žiadne výdavky)"] : s.byCategory.map((c) => `- ${c.category}: ${eur(c.cents)}`)),
      "",
      "Súhrn je len prehľad zadaných údajov, nie finančné poradenstvo.",
      "Obsahuje finančné údaje: neukladaj ho do verejných priečinkov.",
    ];
    try {
      await saveTextFile(`financna-sloboda-tyzden-${today}.txt`, lines.join("\n"));
      setErr(null);
    } catch {
      setErr("Súhrn sa nepodarilo uložiť. Skús to znova.");
    }
  };
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 12, background: "var(--surface)" }}>
      <p style={{ margin: 0 }}><strong>Týždenný súhrn</strong></p>
      <p style={{ margin: "4px 0" }}>{dateSk(s.fromIso)} – {dateSk(s.toIso)}: výdavky spolu <strong>{eur(s.totalCents)}</strong>, zápisov {s.count}.</p>
      <button onClick={save} style={btn}>Uložiť týždenný súhrn</button>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}

function MonthSpendingBlock({ data, today, thresholdCents }: { data: AppData; today: string; thresholdCents: number }) {
  const { visible } = useModules();
  const s = monthSummary(data.transactions, data.budgets, data.recurringExpenses, today, thresholdCents, data.properties, data.liabilities);
  const spent = s.byNecessity.nevyhnutne + s.byNecessity.nie_nevyhnutne + s.byNecessity.ostatne + s.unassignedCents;
  const income = monthlyIncomeCents(data.incomes, today);
  const ending = data.recurringExpenses.filter((e) => endingSoon(e, today));
  const over = s.percent !== null && s.percent > 100;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 12, background: "var(--surface)" }}>
      <p style={{ margin: 0 }}><strong>Tento mesiac</strong></p>
      {s.percent !== null ? (
        <p style={{ margin: "4px 0", color: over ? "var(--danger)" : undefined }}>
          Plnenie plánu: <strong>{s.percent} %</strong> ({eur(s.plannedSpentCents)} z {eur(s.planCents)})
        </p>
      ) : (
        <p style={{ margin: "4px 0", color: "var(--muted)" }}>
          Mesačný plán nie je nastavený. Limity nastavíš v <a href="#rozpocet">Rozpočte</a>. 
          Minuté tento mesiac: {eur(spent)}.
        </p>
      )}
      {visible.has("prijmy") && (
        <p style={{ margin: "4px 0" }}>
          Príjem: <strong>{eur(income)}</strong> · rozdiel: <strong>{income - spent >= 0 ? "+" : "−"}{eur(Math.abs(income - spent))}</strong>
        </p>
      )}
      <details>
        <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Rozpis výdavkov</summary>
        <ul style={{ paddingLeft: 20 }}>
          <li>Nevyhnutné: {eur(s.byNecessity.nevyhnutne)}</li>
          {s.liabilitiesCents > 0 && <li>Splátky úverov a kariet: {eur(s.liabilitiesCents)}</li>}
          <li>Nie nevyhnutné: {eur(s.byNecessity.nie_nevyhnutne)}{spent > 0 ? ` (${Math.round((100 * s.byNecessity.nie_nevyhnutne) / spent)} % minutého)` : ""}</li>
          <li>Ostatné a nezaradené: {eur(s.byNecessity.ostatne + s.unassignedCents)}</li>
          <li>Výdavky nad prahom: {s.overThresholdCount}</li>
        </ul>
      </details>
      {ending.length > 0 && (
        <p style={{ margin: "8px 0 0", background: "var(--warn-bg)", padding: 8, borderRadius: 6, fontSize: "0.9rem" }}>
          Koniec platnosti do 30 dní: {ending.map((e) => e.name).join(", ")}. <a href="#pravidelne-vydavky">Pozrieť</a>
        </p>
      )}
    </div>
  );
}










function SettingsSection({ repo, settings, derived, onSaved }: { repo: Repository; settings: Settings | null; derived: { inv: number; cash: number }; onSaved: () => void }) {
  const [v, setV] = useState({
    expenses: settings ? settings.expensesCents / 100 : "" as NumIn,
    // zaokrúhlenie: 0,035 * 100 dáva 3,5000000000000004 (binárna aritmetika)
    withdrawalPct: settings ? Number((settings.withdrawalRate * 100).toFixed(6)) : "" as NumIn,
    returnPct: settings ? Number((settings.realReturn * 100).toFixed(6)) : "" as NumIn,
    fees: settings ? (settings.feesRate ?? 0) * 100 : "" as NumIn,
    reserve: settings ? settings.reserveCents / 100 : "" as NumIn,
    threshold: settings ? settings.thresholdCents / 100 : "" as NumIn,
    savingInv: settings?.savingInvCents !== undefined ? settings.savingInvCents / 100 : "" as NumIn,
    savingCash: settings?.savingCashCents !== undefined ? settings.savingCashCents / 100 : "" as NumIn,
  });
  const [err, setErr] = useState<string | null>(null);
  const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;
  // Východiskové hodnoty sa počítajú z práve zadaných výdavkov (R21/R22: jeden zdroj, bez natvrdo zadanej sumy).
  const expCents = typeof v.expenses === "number" ? cents(v.expenses) : 0;
  const rec = recommendedSettings(expCents);
  const realIn = typeof v.returnPct === "number" ? v.returnPct / 100 : rec.realReturn;

  const save = async () => {
    // D-118: ročné výdavky sú povinné; prázdne ostatné polia použijú východiskovú hodnotu.
    const fee = v.fees === "" ? 0 : v.fees;
    if (!(fee >= 0 && fee < 100)) return setErr("Poplatky musia byť od 0 do menej ako 100 % ročne.");
    const exp = asNum(v.expenses);
    if (Number.isNaN(exp)) return setErr("Vyplň ročné výdavky.");
    if (!(exp > 0)) return setErr("Ročné výdavky musia byť väčšie ako 0.");
    const pick = (x: NumIn, fallback: number) => (Number.isNaN(asNum(x)) ? fallback : asNum(x));
    const wr = pick(v.withdrawalPct, rec.withdrawalRate * 100);
    const rr = pick(v.returnPct, rec.realReturn * 100);
    const res = pick(v.reserve, rec.reserveCents / 100);
    const thr = pick(v.threshold, rec.thresholdCents / 100);
    if (!(wr > 0 && wr <= 100)) return setErr("Miera výberu musí byť väčšia ako 0 % a najviac 100 %.");
    if (!(rr >= 0 && rr <= 100)) return setErr("Výnos r musí byť v rozsahu 0 až 100 %.");
    if (res < 0 || thr < 0) return setErr("Rezerva a prah nesmú byť záporné.");
    if (asNum(v.savingInv) < 0 || asNum(v.savingCash) < 0) return setErr("Mesačné sporenie nesmie byť záporné. Ak nechceš sporiť, zadaj 0.");
    setErr(null);
    try {
      await repo.saveSettings({
        expensesCents: cents(exp),
        withdrawalRate: wr / 100,
        realReturn: rr / 100,
        feesRate: fee / 100,
        reserveCents: cents(res),
        thresholdCents: cents(thr),
        ...(v.savingInv === "" ? {} : { savingInvCents: cents(v.savingInv) }),
        ...(v.savingCash === "" ? {} : { savingCashCents: cents(v.savingCash) }),
        checkedAt: new Date().toISOString(),
      });
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      {!settings && (
        <p style={{ background: "var(--ok-bg)", padding: 8, borderRadius: 6 }}>
          Prvé nastavenie: polia sú prázdne. Pod každým je východisková hodnota; ročné výdavky zadaj sám.
        </p>
      )}
      <Field label="Ročné výdavky pri nezávislosti (€)" value={v.expenses} onChange={(x) => setV({ ...v, expenses: x })} />
      <Field label="Miera výberu (%)" value={v.withdrawalPct} step={0.1} onChange={(x) => setV({ ...v, withdrawalPct: x })}
        hint={`východisková hodnota ${pct(rec.withdrawalRate)}`} changed={differs(v.withdrawalPct, rec.withdrawalRate * 100)} onReset={() => setV({ ...v, withdrawalPct: Number((rec.withdrawalRate * 100).toFixed(6)) })} />
      <Field label="Reálny výnos r (%)" value={v.returnPct} step={0.1} onChange={(x) => setV({ ...v, returnPct: x })}
        hint={`východisková hodnota ${pct(rec.realReturn)}; reálny výnos je po odpočítaní inflácie`} changed={differs(v.returnPct, rec.realReturn * 100)} onReset={() => setV({ ...v, returnPct: Number((rec.realReturn * 100).toFixed(6)) })} />
      {typeof v.withdrawalPct === "number" && (v.withdrawalPct < 3 || v.withdrawalPct > 4) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6, fontSize: "0.9rem" }}>
          Miera výberu je mimo bežného rozsahu 3–4 %. Uloženie je možné, ale over si, či je to tvoj zámer.
        </p>
      )}
      {typeof v.returnPct === "number" && (v.returnPct < 2 || v.returnPct > 6) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6, fontSize: "0.9rem" }}>
          Výnos r je mimo bežného rozsahu 2–6 %. Uloženie je možné, ale ide o odhad a dátum cieľa sa výrazne zmení.
        </p>
      )}
      <Field label="Rezerva, cieľová hodnota (€)" value={v.reserve} onChange={(x) => setV({ ...v, reserve: x })}
        hint={v.expenses === "" ? "3 mesiace výdavkov; doplní sa po zadaní ročných výdavkov" : `východisková hodnota ${eur(rec.reserveCents)} (3 mesiace výdavkov)`} changed={differs(v.reserve, rec.reserveCents / 100)} onReset={() => setV({ ...v, reserve: rec.reserveCents / 100 })} />
      <Field label="Prah výdavkov (€)" value={v.threshold} onChange={(x) => setV({ ...v, threshold: x })}
        hint={`východisková hodnota ${eur(rec.thresholdCents)}`} changed={differs(v.threshold, rec.thresholdCents / 100)} onReset={() => setV({ ...v, threshold: rec.thresholdCents / 100 })} />
      <Field label="Poplatky p. a. (%)" value={v.fees} step={0.01} onChange={(x) => setV({ ...v, fees: x })}
        hint="predvolene 0 %; zadaj, ak ti banka alebo poskytovateľ účtuje poplatky" changed={differs(v.fees, 0)} onReset={() => setV({ ...v, fees: 0 })} />
      <Field label="Mesačné sporenie do investícií (€), prázdne = odvodené" value={v.savingInv} onChange={(x) => setV({ ...v, savingInv: x })}
        hint={`prázdne = počíta sa zo zapísaných transakcií: ${eur(derived.inv)} mesačne`} changed={differs(v.savingInv, null)} onReset={() => setV({ ...v, savingInv: "" })} />
      <Field label="Mesačné sporenie do hotovosti (€), prázdne = odvodené" value={v.savingCash} onChange={(x) => setV({ ...v, savingCash: x })}
        hint={`prázdne = počíta sa zo zapísaných transakcií: ${eur(derived.cash)} mesačne`} changed={differs(v.savingCash, null)} onReset={() => setV({ ...v, savingCash: "" })} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť nastavenia</button>
    </section>
  );
}







