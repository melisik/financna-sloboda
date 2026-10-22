import { Fragment, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import { ASSET_KINDS, EXTRA_PAYMENT_MODES, type ExtraPaymentMode, type RentalEntry, type RentalEntryKind, BUDGET_CATEGORIES, RECURRING_FREQUENCIES, STOCK_UNITS, type StockItem, type StockUnit, type RecurringExpense, type RecurringFrequency, PROPERTY_MODES, SOURCES, type AppData, type Asset, type AssetKind, type BudgetCategory, type Liability, type Position, type Property, type PropertyMode, type Settings, type Snapshot, type Source, type Transaction, type TransactionType } from "../storage/types";
import { checkDate } from "../storage/validate";
import { isValidPin, makePinRecord } from "../features/zamok/pin";
import { buildBackup, parseBackup } from "../storage/backup";
import { capitalWithFlags, reserveBalance } from "../app/ledger";
import { expenseTotalsByCategory, filterHistory, totalsByType } from "../app/history";
import { backupOverdue, reviewOverdue, settingsCheckOverdue } from "../domain/reminders";
import { targetAmountCents } from "../domain/goal";
import { goalDisplay } from "../domain/goalDisplay";
import { goalDateText } from "../domain/goalText";
import { formatImpactOutcome, plural, UNREACHABLE_IMPACT_TEXT } from "../domain/impact";
import { annualOverview, yearlySummary, type OverviewSettings } from "../domain/annualOverview";
import { monthlySaving } from "../domain/saving";
import { monthlyCostsCents, netPropertyValueCents, propertyChangedSince, splitPayment, valueIsStale } from "../domain/property";
import { amortizeLoan, amortizeMortgage, applyExtraPayment, remainingMonths } from "../domain/mortgage";
import { FEEDBACK_FORM_URL, feedbackIssueUrl } from "../app/feedback";
import { investmentsTotalCents, positionsChangedSince, staleValuationNames } from "../domain/investments";
import { monthlyIncomeCents } from "../domain/income";
import { rentalRow11, rentalTotalsForYear, rentalYears } from "../domain/rental";
import { weeklySummary } from "../domain/weekly";
import { monthSummary } from "../domain/monthSummary";
import { annualRecurringTotalCents, endingSoon, isRecurringActive, monthlyRecurringByCategory, monthlyRecurringTotalCents, monthlyShareCents } from "../domain/recurring";
import { PHASE2_ENABLED } from "../app/features";
import { MONTHS, cents, dateSk, eur, monthYear, todayIso } from "./kit/format";
import { uid } from "./kit/ids";
import { RecipesBlock, StockSection } from "../features/sklad/Sklad";
import { saveBlobFile, saveTextFile } from "./kit/files";
import { STORAGE_ERROR } from "./kit/messages";
import { BackupSection, exportBackupFile } from "../features/zaloha/BackupSection";
import { LockScreen, PinSection } from "../features/zamok/Lock";
import { DogSection, TaxFormBlock, TaxSection } from "../features/dane/Dane";
import { LiabilitySection } from "../features/zavazky/Zavazky";
import { InvestmentSection } from "../features/investicie/Investicie";
import { IncomeSection } from "../features/prijmy/Prijmy";
import { BudgetSection } from "../features/rozpocet/Rozpocet";
import { Field, Section, asNum, btn, inp, type NumIn } from "./kit/controls";
import { isIosOtherBrowser, isIosSafari } from "../app/ios";
import { CORE_SECTION_IDS, OPTIONAL_MODULES, readModuleChoice, visibleSectionIds, writeModuleChoice } from "../app/modules";
import { readQrFromImage } from "../app/receiptScan";
import { ReceiptCamera } from "./ReceiptCamera";
import { isReceiptId, RECEIPT_CHECK_URL, receiptIdFromQr } from "../domain/receipt";
import { parseReceiptItems } from "../domain/receiptItems";
import type { Recipe, RecipeIngredient, Attachment } from "../storage/types";
import { ATTACHMENT_MAX_BYTES, ATTACHMENT_TYPES } from "../storage/types";
import { encodeAttachment } from "../storage/attachments";
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


const TYPE_LABEL: Record<TransactionType, string> = {
  sporenie: "sporenie (do hotovosti)",
  investicia: "investícia",
  vydavok: "výdavok",
  rezerva: "vklad do rezervy",
  vyber_rezervy: "výber z rezervy",
};
const SOURCE_LABEL: Record<Source, string> = { z_prijmu: "z príjmu", z_hotovosti: "z hotovosti", z_investicii: "z investícií" };
/** Kamera je dostupná len v bezpečnom kontexte (HTTPS alebo localhost) a ak prehliadač podporuje getUserMedia. */
const canUseCamera = (): boolean => typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";


/** Kontext vypočítaný raz pre všetky sekcie. */
interface Ctx {
  settings: Settings | null;
  latest: Snapshot | null;
  capital: Capital;
  negative: { inv: boolean; cash: boolean };
  shortfall: { inv: number; cash: number };
  derived: { inv: number; cash: number };
  reserve: number;
  mInv: number;
  mCash: number;
  target: number | null;
  realReturn: number;
  rentals: Rental[];
  longHorizon: boolean;
}

function makeCtx(data: AppData): Ctx {
  const latest = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
  const s = data.settings;
  const derived = latest ? monthlySaving(data.transactions, latest.date) : { inv: 0, cash: 0 };
  const flags = capitalWithFlags(latest, data.transactions);
  const target = s ? targetAmountCents(s.expensesCents, s.withdrawalRate) : null;
  const mInv = s?.savingInvCents ?? derived.inv;
  const mCash = s?.savingCashCents ?? derived.cash;
  const realReturn = netRealReturn(s?.realReturn ?? RETURN_ASSUMPTIONS.realReturn, s?.feesRate ?? 0);
  const rentals = rentalsFor(data.properties);
  const g = latest && target !== null ? goalMonths(flags.capital, mInv, mCash, realReturn, target, rentals) : null;
  return {
    settings: s,
    latest,
    capital: flags.capital,
    negative: flags.negative,
    shortfall: flags.shortfall,
    derived,
    reserve: reserveBalance(data.transactions),
    mInv,
    mCash,
    target,
    realReturn,
    rentals,
    longHorizon: g?.kind === "months" && g.months > LONG_HORIZON_MONTHS,
  };
}

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

const PROPERTY_MODE_LABEL: Record<PropertyMode, string> = {
  vlastne_byvanie: "bývam v nej",
  prenajom: "prenajímam",
  nezadane: "nezadané",
};

/** Karta majetku (Fáza 2, návrh docs/11_Karta_majetku.md): nehnuteľnosť a jej čistá hodnota. */




function PropertySection({ repo, properties, assets, today, onSaved }: { repo: Repository; properties: Property[]; assets: Asset[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<Property | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      await repo.deleteProperty(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Hodnota je tvoj odhad, nie trhová cena. Do kapitálu K sa počíta len nehnuteľnosť, ktorú prenajímaš; vlastné bývanie sa zobrazí zvlášť.
      </p>
      {(properties.length > 0 || assets.length > 0) && (() => {
        // Súhrn: čo sa počíta do K a čo je mimo K (D-093, D-058). Čistá hodnota ako v K.
        const inK = properties.filter((p) => p.mode === "prenajom").reduce((sum, p) => sum + netPropertyValueCents(p), 0);
        const outK = properties.filter((p) => p.mode === "vlastne_byvanie").reduce((sum, p) => sum + netPropertyValueCents(p), 0);
        const unset = properties.filter((p) => p.mode === "nezadane").reduce((sum, p) => sum + netPropertyValueCents(p), 0);
        const assetsTotal = assets.reduce((sum, a) => sum + a.valueCents, 0);
        const monthly = properties.reduce((sum, p) => sum + monthlyCostsCents(p), 0);
        return (
          <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 12 }}>
            <p style={{ margin: "4px 0" }}>Do K sa počíta: <strong>{eur(inK)}</strong> (prenajímané nehnuteľnosti, čistá hodnota)</p>
            <p style={{ margin: "4px 0" }}>
              Mimo K: vlastné bývanie {eur(outK)}, automobily a práva {eur(assetsTotal)}
              {properties.some((p) => p.mode === "nezadane") ? `, nezadaný režim ${eur(unset)}` : ""}
            </p>
            {monthly > 0 && <p style={{ margin: "4px 0" }}>Mesačné náklady na nehnuteľnosti spolu: <strong>{eur(monthly)}</strong></p>}
        {properties.some((p) => p.mode === "prenajom") && (() => {
          const year = Number(today.slice(0, 4));
          const rentals = properties.filter((p) => p.mode === "prenajom");
          const income = rentals.reduce((sum, p) => sum + rentalTotalsForYear(p.rentalLedger ?? [], year).incomeCents, 0);
          const costs = rentals.reduce((sum, p) => sum + rentalTotalsForYear(p.rentalLedger ?? [], year).costsCents, 0);
          const row = rentalRow11(income, costs);
          return (
            <p style={{ margin: "4px 0" }}>
              Podklad pre DP za {year}, oddiel VI, tabuľka 1, riadok 11: stĺpec 1 <strong>{eur(row.col1Cents)}</strong>, stĺpec 2 <strong>{eur(row.col2Cents)}</strong>. Na overenie, nie konečné číslo daňového priznania.
            </p>
          );
        })()}
          </div>
        );
      })()}
      {properties.length === 0 && editing === null && <p>Zatiaľ nie je zapísaná žiadna nehnuteľnosť.</p>}
      {properties.map((p) => {
        const net = netPropertyValueCents(p);
        const stale = valueIsStale(p.valueDate, today);
        return (
          <div key={p.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
            <p style={{ margin: 0 }}><strong>{p.name || "Nehnuteľnosť"}</strong> · {PROPERTY_MODE_LABEL[p.mode]}</p>
            <p style={{ margin: "4px 0" }}>Odhad: {eur(p.valueCents)} (k {dateSk(p.valueDate)})</p>
            {(p.acquisitionDate || p.acquisitionCostCents !== undefined) && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                Obstarané{p.acquisitionDate ? ` ${dateSk(p.acquisitionDate)}` : ""}{p.acquisitionCostCents !== undefined ? ` za ${eur(p.acquisitionCostCents)}` : ""} (evidencia pre dane)
              </p>
            )}
            {p.mode === "prenajom" && p.rentalStartDate && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Prenájom od {dateSk(p.rentalStartDate)}</p>
            )}
            {(p.taxMunicipality || p.cadastralArea || p.parcelNumber || p.buildingNumber || p.flatNumber || p.floorAreaSqm !== undefined) && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                Údaje pre daň: {[
                  p.taxMunicipality && `obec ${p.taxMunicipality}`,
                  p.cadastralArea && `k. ú. ${p.cadastralArea}`,
                  p.parcelNumber && `parcela ${p.parcelNumber}`,
                  p.buildingNumber && `súp. č. ${p.buildingNumber}`,
                  p.flatNumber && `byt ${p.flatNumber}`,
                  p.floorAreaSqm !== undefined && `${p.floorAreaSqm.toLocaleString("sk-SK")} m²`,
                ].filter(Boolean).join(", ")}
              </p>
            )}
            {p.mode === "prenajom" && <RentalLedger repo={repo} property={p} today={today} onDone={onSaved} />}
            {stale && <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Odhad je starší ako 12 mesiacov. Over ho a zadaj nový.</p>}
            <p style={{ margin: "4px 0" }}>Hypotéka: {eur(p.mortgageBalanceCents)}</p>
            <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", margin: "8px 0", fontSize: "0.95rem" }}>
              {p.mode === "prenajom" && <><dt>Nájom</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyRentCents ?? 0)}</dd></>}
              <dt>Splátka hypotéky</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyPaymentCents ?? 0)}</dd>
              {(p.monthlyPaymentCents ?? 0) > 0 && p.mortgageBalanceCents > 0 && (
                <>
                  <dt style={{ paddingLeft: 12, color: "var(--muted)" }}>z toho úrok</dt><dd style={{ margin: 0, textAlign: "right", color: "var(--muted)" }}>{eur(splitPayment(p).interestCents)}</dd>
                  <dt style={{ paddingLeft: 12, color: "var(--muted)" }}>z toho istina</dt><dd style={{ margin: 0, textAlign: "right", color: "var(--muted)" }}>{eur(splitPayment(p).principalCents)}</dd>
                </>
              )}
              <dt>Ostatné náklady</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyOtherCostsCents ?? 0)}</dd>
              <dt><strong>Mesačné náklady spolu</strong></dt><dd style={{ margin: 0, textAlign: "right" }}><strong>{eur(monthlyCostsCents(p))}</strong></dd>
            </dl>
            <p style={{ margin: "4px 0" }}>
              Čistá hodnota: <strong>{eur(net)}</strong>
              {net < 0 && <span> (hypotéka presahuje odhad)</span>}
            </p>
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              {p.mode === "nezadane" ? "Do K sa zatiaľ nepočíta: zadaj režim." : p.mode === "prenajom" ? "Do K sa počíta ako čistá hodnota." : "Do K sa nepočíta."}
            </p>
            {p.mortgageBalanceCents > 0 && (p.monthlyPaymentCents ?? 0) > 0 && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                {(() => {
                  const months = remainingMonths(p.mortgageBalanceCents, p.mortgageRate ?? 0, p.monthlyPaymentCents ?? 0);
                  return months === null ? "Splátka nepokrýva úrok, zostatok nekleslo." : `Pri tejto splátke sa zostatok splatí za ${months} mesiacov.`;
                })()}
              </p>
            )}
            {p.mortgageBalanceCents > 0 && (
              <details style={{ margin: "8px 0" }}>
                <summary>Mimoriadna splátka hypotéky</summary>
                <ExtraPaymentForm key={(p.extraPayments ?? []).length} repo={repo} property={p} today={today} onDone={onSaved} />
              </details>
            )}
            {(p.extraPayments ?? []).length > 0 && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                Mimoriadne splátky: {(p.extraPayments ?? []).map((e) => `${dateSk(e.date)} ${eur(e.amountCents)} (${EXTRA_PAYMENT_LABEL[e.mode]})`).join("; ")}
              </p>
            )}
            <ExtraPaymentUndo repo={repo} property={p} onDone={onSaved} />
            {confirmId === p.id ? (
              <div>
                <p>Naozaj zmazať nehnuteľnosť „{p.name || "Nehnuteľnosť"}“?</p>
                <button onClick={() => remove(p.id)} style={btn}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
              </div>
            ) : (
              <div>
                <button onClick={() => { setEditing(p); setErr(null); }} style={btn}>Upraviť</button>{" "}
                <button onClick={() => setConfirmId(p.id)} style={btn}>Zmazať</button>
              </div>
            )}
          </div>
        );
      })}
      {editing !== null ? (
        <PropertyForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btn}>Pridať nehnuteľnosť</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <AssetSection repo={repo} assets={assets} today={today} onSaved={onSaved} />
    </section>
  );
}

const ASSET_KIND_LABEL: Record<AssetKind, string> = {
  automobil: "Automobil",
  pravo: "Ocenitelné právo",
};

/** Automobil a ocenitelné právo (docs/11, bod 10): názov, odhad a dátum; do K sa zatiaľ nepočítajú. */
function AssetSection({ repo, assets, today, onSaved }: { repo: Repository; assets: Asset[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<Asset | AssetKind | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      await repo.deleteAsset(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: "1rem" }}>Automobily a ocenitelné práva</h3>
      <p style={{ color: "var(--muted)" }}>Odhad je tvoj, nie trhová cena. Zatiaľ sa do K nepočítajú (predpoklad).</p>
      {assets.length === 0 && editing === null && <p>Zatiaľ nie je zapísané žiadne aktívum.</p>}
      {assets.map((a) => (
        <div key={a.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{a.name}</strong> · {ASSET_KIND_LABEL[a.kind]}</p>
          <p style={{ margin: "4px 0" }}>Odhad: {eur(a.valueCents)} (k {dateSk(a.valueDate)})</p>
          {valueIsStale(a.valueDate, today) && <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Odhad je starší ako 12 mesiacov. Over ho a zadaj nový.</p>}
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Do K sa zatiaľ nepočíta.</p>
          {confirmId === a.id ? (
            <div>
              <p>Naozaj zmazať aktívum „{a.name}“?</p>
              <button onClick={() => remove(a.id)} style={btn}>Potvrdiť zmazanie</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <div>
              <button onClick={() => { setEditing(a); setErr(null); }} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(a.id)} style={btn}>Zmazať</button>
            </div>
          )}
        </div>
      ))}
      {editing !== null ? (
        <AssetForm
          key={typeof editing === "string" ? `new-${editing}` : editing.id}
          repo={repo}
          kind={typeof editing === "string" ? editing : editing.kind}
          initial={typeof editing === "string" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div>
          {ASSET_KINDS.map((k) => (
            <button key={k} onClick={() => setEditing(k)} style={{ ...btn, marginRight: 8 }}>Pridať: {ASSET_KIND_LABEL[k].toLowerCase()}</button>
          ))}
        </div>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}

function AssetForm({ repo, kind, initial, today, onDone, onCancel }: { repo: Repository; kind: AssetKind; initial: Asset | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [value, setValue] = useState<NumIn>(initial ? initial.valueCents / 100 : "");
  const [valueDate, setValueDate] = useState(initial?.valueDate ?? today);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    if (Number.isNaN(asNum(value))) return setErr("Vyplň odhad hodnoty.");
    if (asNum(value) < 0) return setErr("Odhad hodnoty nesmie byť záporný.");
    const dateErr = checkDate(valueDate, today, "dátum odhadu");
    if (dateErr.length) return setErr(dateErr[0]);
    const now = new Date().toISOString();
    const asset: Asset = {
      id: initial?.id ?? uid(),
      kind,
      name: trimmed,
      valueCents: cents(asNum(value)),
      valueDate,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await repo.saveAsset(asset);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť" : "Nové"}: {ASSET_KIND_LABEL[kind].toLowerCase()}</h4>
      <Field label="Názov (napr. značka a rok, alebo podiel)" value={name} type="text" onChange={setName} />
      <Field label="Odhad hodnoty (€)" value={value} onChange={setValue} />
      <Field label="Dátum odhadu" value={valueDate} type="date" max={today} onChange={setValueDate} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

/** Front zápisov do evidencie prenájmu (D-157): jeden zápis naraz, aby sa žiadny neprepísal. */
let rentalSaveQueue: Promise<void> = Promise.resolve();

/** Ročná evidencia príjmov a výdavkov z prenájmu (D-157): priebežne počas roka, súčty sú len podklad pre daňové priznanie. */
function RentalLedger({ repo, property, today, onDone }: { repo: Repository; property: Property; today: string; onDone: () => void }) {
  const entries = property.rentalLedger ?? [];
  const currentYear = Number(today.slice(0, 4));
  const years = [...new Set([currentYear, ...rentalYears(entries)])].sort((a, b) => b - a);
  const [year, setYear] = useState(currentYear);
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<RentalEntryKind>("prijem");
  const [amount, setAmount] = useState<NumIn>("");
  const [note, setNote] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const totals = rentalTotalsForYear(entries, year);
  const yearEntries = entries.filter((e) => e.date.startsWith(`${year}-`)).sort((a, b) => a.date.localeCompare(b.date));

  // Zápisy sa radia za sebou a vždy čítajú aktuálne dáta, aby sa rýchly zápis neprepísal (D-157).
  const save = (mutate: (list: RentalEntry[]) => RentalEntry[]) => {
    rentalSaveQueue = rentalSaveQueue.then(async () => {
      try {
        const fresh = (await repo.getData()).properties.find((p) => p.id === property.id) ?? property;
        await repo.saveProperty({ ...fresh, rentalLedger: mutate(fresh.rentalLedger ?? []), updatedAt: new Date().toISOString() });
        setErr(null);
        onDone();
      } catch {
        setErr(STORAGE_ERROR);
      }
    });
    return rentalSaveQueue;
  };

  const add = async () => {
    const dErr = checkDate(date, today, "dátum záznamu");
    if (dErr.length) return setErr(dErr[0]);
    const a = asNum(amount);
    if (Number.isNaN(a) || a <= 0) return setErr("Vyplň sumu väčšiu ako 0.");
    const entry: RentalEntry = { id: uid(), date, kind, amountCents: cents(a), ...(note.trim() ? { note: note.trim().slice(0, 120) } : {}) };
    setAmount("");
    setNote("");
    await save((list) => [...list, entry]);
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 10, margin: "8px 0" }}>
      <p style={{ margin: 0 }}><strong>Príjmy a výdavky z prenájmu</strong></p>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "4px 0" }}>Zapisuj priebežne. Súčty sú len podklad pre daňové priznanie, nie daňový výpočet.</p>
      <label style={{ display: "block", margin: "6px 0" }}>
        Rok{" "}
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ minHeight: 44 }}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <p style={{ margin: "4px 0" }}>Za rok {year}: prijatý nájom <strong>{eur(totals.incomeCents)}</strong>, výdavky <strong>{eur(totals.costsCents)}</strong>, zápisov {totals.count}.</p>
      {yearEntries.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Za tento rok zatiaľ nie sú záznamy.</p>}
      <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "0.9rem" }}>
        {yearEntries.map((e) => (
          <li key={e.id}>
            {dateSk(e.date)} · {e.kind === "prijem" ? "príjem" : "výdavok"} · {eur(e.amountCents)}{e.note ? ` (${e.note})` : ""}{" "}
            {confirmId === e.id ? (
              <>
                <button onClick={() => save((list) => list.filter((x) => x.id !== e.id))} style={btn}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
              </>
            ) : (
              <button onClick={() => setConfirmId(e.id)} style={btn}>Zmazať</button>
            )}
          </li>
        ))}
      </ul>
      <Field label="Dátum záznamu" value={date} type="date" max={today} onChange={setDate} />
      <label style={{ display: "block", margin: "6px 0" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>Druh záznamu</span>
        <select aria-label="Druh záznamu" value={kind} onChange={(e) => setKind(e.target.value as RentalEntryKind)} style={{ minHeight: 44, width: "100%" }}>
          <option value="prijem">Príjem z nájmu</option>
          <option value="vydavok">Výdavok na prenájom</option>
        </select>
      </label>
      <Field label="Suma (€) – prenájom" value={amount} onChange={setAmount} />
      <Field label="Poznámka (nepovinné)" value={note} type="text" onChange={setNote} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={add} style={btn}>Pridať záznam</button>
    </div>
  );
}

const EXTRA_PAYMENT_LABEL: Record<ExtraPaymentMode, string> = {
  znizit_splatku: "znížená splátka",
  skratit_termin: "skrátený termín",
};

/** Vrátenie poslednej mimoriadnej splátky (D-145): obnoví zostatok a splátku pred ňou. Záznamy bez uložených hodnôt sa vrátiť nedajú. */
function ExtraPaymentUndo({ repo, property, onDone }: { repo: Repository; property: Property; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const list = property.extraPayments ?? [];
  const last = list[list.length - 1];
  if (!last) return null;
  if (last.balanceBeforeCents === undefined || last.monthlyPaymentBeforeCents === undefined) {
    // Záznam z obdobia pred opravou: nevieme, aké hodnoty boli pred ním, preto sa len odstráni z histórie.
    const removeRecord = async () => {
      try {
        await repo.saveProperty({ ...property, extraPayments: list.slice(0, -1), updatedAt: new Date().toISOString() });
        setConfirming(false);
        onDone();
      } catch {
        setErr(STORAGE_ERROR);
      }
    };
    return (
      <div style={{ margin: "4px 0" }}>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Poslednú splátku nie je možné vrátiť automaticky. Zostatok a splátku uprav v Upraviť.</p>
        {confirming ? (
          <div>
            <p>Naozaj zmazať záznam z {dateSk(last.date)} ({eur(last.amountCents)})? Zostatok a splátka sa nezmenia.</p>
            <button onClick={removeRecord} style={btn}>Potvrdiť zmazanie záznamu</button>{" "}
            <button onClick={() => setConfirming(false)} style={btn}>Zrušiť</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} style={btn}>Zmazať záznam z histórie</button>
        )}
        {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      </div>
    );
  }
  const undo = async () => {
    try {
      await repo.saveProperty({
        ...property,
        mortgageBalanceCents: last.balanceBeforeCents as number,
        monthlyPaymentCents: last.monthlyPaymentBeforeCents as number,
        extraPayments: list.slice(0, -1),
        updatedAt: new Date().toISOString(),
      });
      setConfirming(false);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };
  return (
    <div style={{ margin: "4px 0" }}>
      {confirming ? (
        <div>
          <p>Naozaj vrátiť splátku z {dateSk(last.date)} ({eur(last.amountCents)})? Zostatok a splátka sa vrátia na hodnoty pred ňou.</p>
          <button onClick={undo} style={btn}>Potvrdiť vrátenie</button>{" "}
          <button onClick={() => setConfirming(false)} style={btn}>Zrušiť</button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} style={btn}>Vrátiť poslednú mimoriadnu splátku</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}

/** Mimoriadna splátka hypotéky (N-15, D-145): najprv náhľad, čo sa stane, potom zápis. */
function ExtraPaymentForm({ repo, property, today, onDone }: { repo: Repository; property: Property; today: string; onDone: () => void }) {
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState<NumIn>("");
  const [mode, setMode] = useState<ExtraPaymentMode>("znizit_splatku");
  const [err, setErr] = useState<string | null>(null);

  const amountValue = asNum(amount);
  const amountCents = Number.isFinite(amountValue) && amountValue > 0 ? cents(amountValue) : 0;
  const preview = amountCents > 0 && amountCents <= property.mortgageBalanceCents ? applyExtraPayment(property, amountCents, mode) : null;
  const oldPayment = eur(property.monthlyPaymentCents ?? 0);
  let description: string | null = null;
  if (amountCents === 0) description = "Zadaj sumu mimoriadnej splátky.";
  else if (amountCents > property.mortgageBalanceCents) description = "Suma je vyššia ako zostatok hypotéky.";
  else if (preview === null) description = "Splátka sa nedá znížiť, lebo nepokrýva úrok. Zvoľ skrátenie termínu.";
  else if (mode === "znizit_splatku") description = `Zostatok po splátke: ${eur(preview.mortgageBalanceCents)}. Nová splátka: ${eur(preview.monthlyPaymentCents)} (bola ${oldPayment}), termín ostane ${preview.monthsAfter ?? "?"} mesiacov.`;
  else if (preview.monthsBefore === null) description = `Zostatok po splátke: ${eur(preview.mortgageBalanceCents)}. Splátka ostane ${eur(preview.monthlyPaymentCents)}.`;
  else description = `Zostatok po splátke: ${eur(preview.mortgageBalanceCents)}. Splátka ostane ${eur(preview.monthlyPaymentCents)}; termín sa skráti z ${preview.monthsBefore} na ${preview.monthsAfter ?? "?"} mesiacov.`;

  const save = async () => {
    if (!property.balanceDate) return setErr("Najprv v úprave nehnuteľnosti nastav dátum, ku ktorému platí zostatok.");
    const dErr = checkDate(date, today, "dátum splátky");
    if (dErr.length) return setErr(dErr[0]);
    if (date < property.balanceDate) return setErr(`Dátum musí byť od ${dateSk(property.balanceDate)}, keď platí zostatok.`);
    if (amountCents <= 0) return setErr("Vyplň sumu väčšiu ako 0.");
    if (amountCents > property.mortgageBalanceCents) return setErr("Suma je vyššia ako zostatok hypotéky.");
    const result = applyExtraPayment(property, amountCents, mode);
    if (!result) return setErr("Splátka sa nedá znížiť, lebo nepokrýva úrok. Zvoľ skrátenie termínu.");
    try {
      await repo.saveProperty({
        ...property,
        mortgageBalanceCents: result.mortgageBalanceCents,
        monthlyPaymentCents: result.monthlyPaymentCents,
        extraPayments: [...(property.extraPayments ?? []), { id: uid(), date, amountCents, mode, balanceBeforeCents: property.mortgageBalanceCents, monthlyPaymentBeforeCents: property.monthlyPaymentCents ?? 0 }],
        updatedAt: new Date().toISOString(),
      });
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, marginTop: 8, background: "var(--surface)" }}>
      <Field label="Dátum splátky" value={date} type="date" max={today} onChange={setDate} />
      <Field label="Suma (€)" value={amount} onChange={setAmount} />
      <fieldset style={{ border: 0, padding: 0, margin: "8px 0" }}>
        <legend style={{ fontSize: "0.9rem" }}>Čo sa má zmeniť</legend>
        {EXTRA_PAYMENT_MODES.map((m) => (
          <label key={m} style={{ display: "block", margin: "4px 0" }}>
            <input type="radio" name={`mimoriadna-${property.id}`} checked={mode === m} onChange={() => setMode(m)} />{" "}
            {m === "znizit_splatku" ? "Znížiť splátku (termín ostane)" : "Skrátiť termín (splátka ostane)"}
          </label>
        ))}
      </fieldset>
      {description && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{description}</p>}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Zapísať mimoriadnu splátku</button>
    </div>
  );
}

function PropertyForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: Property | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [mode, setMode] = useState<PropertyMode>(initial?.mode ?? "nezadane");
  const [value, setValue] = useState<NumIn>(initial ? initial.valueCents / 100 : "");
  const [valueDate, setValueDate] = useState(initial?.valueDate ?? today);
  const [mortgage, setMortgage] = useState<NumIn>(initial ? initial.mortgageBalanceCents / 100 : 0);
  const [rent, setRent] = useState<NumIn>(initial?.monthlyRentCents !== undefined ? initial.monthlyRentCents / 100 : "");
  const [rate, setRate] = useState<NumIn>(initial?.mortgageRate !== undefined ? Number((initial.mortgageRate * 100).toFixed(6)) : "");
  const [payment, setPayment] = useState<NumIn>(initial?.monthlyPaymentCents !== undefined ? initial.monthlyPaymentCents / 100 : "");
  const [otherCosts, setOtherCosts] = useState<NumIn>(initial?.monthlyOtherCostsCents !== undefined ? initial.monthlyOtherCostsCents / 100 : "");
  const [balanceDate, setBalanceDate] = useState(initial?.balanceDate ?? today);
  const [acqDate, setAcqDate] = useState(initial?.acquisitionDate ?? "");
  const [acqCost, setAcqCost] = useState<NumIn>(initial?.acquisitionCostCents !== undefined ? initial.acquisitionCostCents / 100 : "");
  const [rentalStart, setRentalStart] = useState(initial?.rentalStartDate ?? "");
  const [taxKind, setTaxKind] = useState<"" | "dom" | "byt">(initial?.taxObjectKind ?? "");
  const [taxMuni, setTaxMuni] = useState(initial?.taxMunicipality ?? "");
  const [cadastral, setCadastral] = useState(initial?.cadastralArea ?? "");
  const [parcel, setParcel] = useState(initial?.parcelNumber ?? "");
  const [building, setBuilding] = useState(initial?.buildingNumber ?? "");
  const [flat, setFlat] = useState(initial?.flatNumber ?? "");
  const [floorArea, setFloorArea] = useState<NumIn>(initial?.floorAreaSqm !== undefined ? initial.floorAreaSqm : "");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (name.trim().length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    if (acqDate !== "") {
      const aErr = checkDate(acqDate, today, "dátum obstarania");
      if (aErr.length) return setErr(aErr[0]);
    }
    const ac = acqCost === "" ? undefined : asNum(acqCost);
    if (ac !== undefined && (Number.isNaN(ac) || ac < 0)) return setErr("Obstarávacia cena musí byť číslo 0 alebo viac.");
    if (mode === "prenajom" && rentalStart !== "") {
      const rErr = checkDate(rentalStart, today, "dátum začiatku prenájmu");
      if (rErr.length) return setErr(rErr[0]);
    }
    if (Number.isNaN(asNum(value))) return setErr("Vyplň odhad hodnoty.");
    if (asNum(value) < 0) return setErr("Odhad hodnoty nesmie byť záporný.");
    const dateErr = checkDate(valueDate, today, "dátum odhadu");
    if (dateErr.length) return setErr(dateErr[0]);
    const m = mortgage === "" ? 0 : asNum(mortgage);
    if (Number.isNaN(m) || m < 0) return setErr("Zostatok hypotéky musí byť číslo 0 alebo viac.");
    if (m > 0) {
      const bErr = checkDate(balanceDate, today, "dátum zostatku hypotéky");
      if (bErr.length) return setErr(bErr[0]);
    }
    const r = mode === "prenajom" && rent !== "" ? asNum(rent) : undefined;
    if (r !== undefined && (Number.isNaN(r) || r < 0)) return setErr("Nájom musí byť číslo 0 alebo viac.");
    const rt = rate === "" ? 0 : asNum(rate);
    if (Number.isNaN(rt) || rt < 0 || rt >= 100) return setErr("Úroková sadzba musí byť od 0 do menej ako 100 %.");
    const pay = payment === "" ? 0 : asNum(payment);
    if (Number.isNaN(pay) || pay < 0) return setErr("Splátka hypotéky musí byť číslo 0 alebo viac.");
    const other = otherCosts === "" ? 0 : asNum(otherCosts);
    if (Number.isNaN(other) || other < 0) return setErr("Ostatné náklady musia byť číslo 0 alebo viac.");
    const now = new Date().toISOString();
    const trimmed = name.trim();
    const property: Property = {
      id: initial?.id ?? uid(),
      mode,
      valueCents: cents(asNum(value)),
      valueDate,
      mortgageBalanceCents: cents(m),
      ...(m > 0 ? { balanceDate } : {}),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(trimmed ? { name: trimmed } : {}),
      ...(r !== undefined ? { monthlyRentCents: cents(r) } : {}),
      ...(pay > 0 ? { monthlyPaymentCents: cents(pay) } : {}),
      ...(rt > 0 ? { mortgageRate: rt / 100 } : {}),
      ...(other > 0 ? { monthlyOtherCostsCents: cents(other) } : {}),
      ...(initial?.extraPayments ? { extraPayments: initial.extraPayments } : {}),
      ...(initial?.rentalLedger ? { rentalLedger: initial.rentalLedger } : {}),
      ...(acqDate !== "" ? { acquisitionDate: acqDate } : {}),
      ...(ac !== undefined ? { acquisitionCostCents: cents(ac) } : {}),
      ...(mode === "prenajom" && rentalStart !== "" ? { rentalStartDate: rentalStart } : {}),
      ...(taxKind !== "" ? { taxObjectKind: taxKind } : {}),
      ...(taxMuni.trim() ? { taxMunicipality: taxMuni.trim() } : {}),
      ...(cadastral.trim() ? { cadastralArea: cadastral.trim() } : {}),
      ...(parcel.trim() ? { parcelNumber: parcel.trim() } : {}),
      ...(building.trim() ? { buildingNumber: building.trim() } : {}),
      ...(flat.trim() ? { flatNumber: flat.trim() } : {}),
      ...(floorArea !== "" && !Number.isNaN(asNum(floorArea)) ? { floorAreaSqm: asNum(floorArea) } : {}),
    };
    try {
      await repo.saveProperty(property);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h3 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť nehnuteľnosť" : "Nová nehnuteľnosť"}</h3>
      <Field label="Názov (nepovinné)" value={name} type="text" onChange={setName} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Režim
        <select value={mode} onChange={(e) => setMode(e.target.value as PropertyMode)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {PROPERTY_MODES.map((m) => (
            <option key={m} value={m}>{PROPERTY_MODE_LABEL[m]}</option>
          ))}
        </select>
      </label>
      <Field label="Odhad hodnoty (€)" value={value} onChange={setValue} />
      <Field label="Dátum odhadu" value={valueDate} type="date" max={today} onChange={setValueDate} />
      <Field label="Dátum obstarania (nepovinné)" value={acqDate} type="date" max={today} onChange={setAcqDate} hint="evidencia pre dane; nepočíta sa" />
      <Field label="Obstarávacia cena (€, nepovinné)" value={acqCost} onChange={setAcqCost} hint="cena pri kúpe, nie odhad; nepočíta sa" />
      {mode === "prenajom" && <Field label="Dátum začiatku prenájmu (nepovinné)" value={rentalStart} type="date" max={today} onChange={setRentalStart} />}
      <label style={{ display: "block", marginBottom: 8 }}>
        Druh objektu pre daň (nepovinné)
        <select aria-label="Druh objektu pre daň" value={taxKind} onChange={(e) => setTaxKind(e.target.value as "" | "dom" | "byt")} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          <option value="">nezadané</option>
          <option value="dom">stavba na bývanie (dom)</option>
          <option value="byt">byt</option>
        </select>
      </label>
      <Field label="Obec (pre daň z nehnuteľností, nepovinné)" value={taxMuni} type="text" onChange={setTaxMuni} />
      <Field label="Katastrálne územie (nepovinné)" value={cadastral} type="text" onChange={setCadastral} />
      <Field label="Číslo parcely (nepovinné)" value={parcel} type="text" onChange={setParcel} />
      <Field label="Súpisné číslo (nepovinné)" value={building} type="text" onChange={setBuilding} />
      <Field label="Číslo bytu (nepovinné)" value={flat} type="text" onChange={setFlat} />
      <Field label="Podlahová plocha (m², nepovinné)" value={floorArea} onChange={setFloorArea} hint="z kúpnej zmluvy alebo listu vlastníctva; len na podklad pre daň" />
      <Field label="Zostatok hypotéky (€)" value={mortgage} onChange={setMortgage} hint="0, ak hypotéku nemáš" />
      {typeof mortgage === "number" && mortgage > 0 && (
        <Field label="Zostatok platí k (dátum)" value={balanceDate} type="date" max={today} onChange={setBalanceDate} hint="nechaj dnešný dátum, ak si zostatok práve zistil; od tohto dátumu sa každý mesiac automaticky znižuje o istinu" />
      )}
      <Field label="Úroková sadzba hypotéky (% p. a.)" value={rate} step={0.01} onChange={setRate} hint="0, ak hypotéku nemáš" />
      <Field label="Mesačná splátka hypotéky (€)" value={payment} onChange={setPayment} hint="0, ak hypotéku nemáš" />
      <Field label="Ostatné mesačné náklady (€)" value={otherCosts} onChange={setOtherCosts} hint="údržba, poistenie, poplatky; 0, ak nie sú" />
      {mode === "prenajom" && <Field label="Mesačný nájom (€, nepovinné)" value={rent} onChange={setRent} />}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť nehnuteľnosť</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}



const RECURRING_FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  mesacne: "mesačne",
  rocne: "ročne",
};

/** Pravidelné výdavky (D-124): zoznam, súčet za mesiac a podľa kategórie. Iba zobrazenie. */
function RecurringSection({ repo, items, today, onSaved }: { repo: Repository; items: RecurringExpense[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<RecurringExpense | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const total = monthlyRecurringTotalCents(items, today);
  const annual = annualRecurringTotalCents(items, today);
  const byCat = monthlyRecurringByCategory(items, today);

  // Ukončenie bez mazania: koniec platnosti sa nastaví na dnešok a história ostane (D-124).
  const endNow = async (e: RecurringExpense) => {
    try {
      await repo.saveRecurringExpense({ ...e, endDate: today, updatedAt: new Date().toISOString() });
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const remove = async (id: string) => {
    try {
      await repo.deleteRecurringExpense(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Predplatné, poistky a paušály. Iba zobrazenie: nemenia Kapitál, dátum cieľa ani sporenie.</p>
      <p>Spolu za mesiac: <strong>{eur(total)}</strong> · za rok: <strong>{eur(annual)}</strong></p>
      {Object.keys(byCat).length > 0 && (
        <ul style={{ paddingLeft: 20 }}>
          {Object.entries(byCat).map(([c, v]) => <li key={c}>{c}: {eur(v ?? 0)}</li>)}
        </ul>
      )}
      {items.length === 0 && editing === null && <p>Zatiaľ nie sú zapísané pravidelné výdavky.</p>}
      {items.map((e) => (
        <div key={e.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{e.name}</strong> · {e.category}</p>
          <p style={{ margin: "4px 0" }}>
            {eur(e.amountCents)} {RECURRING_FREQUENCY_LABEL[e.frequency]}
            {e.frequency === "rocne" ? ` (≈ ${eur(monthlyShareCents(e))} mesačne)` : ""}
          </p>
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
            Od {dateSk(e.startDate)}{e.endDate ? `, do ${dateSk(e.endDate)}` : ""}{isRecurringActive(e, today) ? "" : " · dnes neplatí"}
          </p>
          {endingSoon(e, today) && (
            <p style={{ margin: "4px 0", color: "var(--danger)", fontSize: "0.9rem" }}>Koniec platnosti o menej ako 30 dní. Ak sa platba obnoví, upravte koniec.</p>
          )}
          {confirmId === e.id ? (
            <div>
              <p>Naozaj zmazať pravidelný výdavok „{e.name}“?</p>
              <button onClick={() => remove(e.id)} style={btn}>Zmazať</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => setEditing(e)} style={btn}>Upraviť</button>{" "}
              {isRecurringActive(e, today) && (e.endDate === undefined || e.endDate > today) && (
                <button onClick={() => endNow(e)} style={btn}>Ukončiť od zajtra</button>
              )}{" "}
              <button onClick={() => setConfirmId(e.id)} style={btn}>Zmazať</button>
            </>
          )}
        </div>
      ))}
      {editing ? (
        <RecurringForm
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btn}>Pridať pravidelný výdavok</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

function RecurringForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: RecurringExpense | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<BudgetCategory>(initial?.category ?? "predplatné a služby");
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? "mesacne");
  const [amount, setAmount] = useState<NumIn>(initial ? initial.amountCents / 100 : "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const a = asNum(amount);
    if (Number.isNaN(a) || !(a > 0)) return setErr("Vyplň sumu (väčšiu ako 0).");
    const startErr = checkDate(startDate, "9999-12-31", "začiatok");
    if (startErr.length) return setErr(startErr[0]);
    if (endDate.trim() !== "") {
      const endErr = checkDate(endDate.trim(), "9999-12-31", "koniec");
      if (endErr.length) return setErr(endErr[0]);
      if (endDate.trim() < startDate) return setErr("Koniec nesmie byť pred začiatkom.");
    }
    const now = new Date().toISOString();
    const item: RecurringExpense = {
      id: initial?.id ?? uid(),
      name: trimmed,
      category,
      frequency,
      amountCents: cents(a),
      startDate,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(endDate.trim() !== "" ? { endDate: endDate.trim() } : {}),
    };
    try {
      await repo.saveRecurringExpense(item);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť pravidelný výdavok" : "Nový pravidelný výdavok"}</h4>
      <Field label="Názov (napr. predplatné)" value={name} type="text" onChange={setName} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Kategória
        <select aria-label="Kategória pravidelného výdavku" value={category} onChange={(e) => setCategory(e.target.value as BudgetCategory)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Frekvencia
        <select aria-label="Frekvencia pravidelného výdavku" value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {RECURRING_FREQUENCIES.map((f) => <option key={f} value={f}>{RECURRING_FREQUENCY_LABEL[f]}</option>)}
        </select>
      </label>
      <Field label={frequency === "mesacne" ? "Suma mesačne (€)" : "Suma ročne (€)"} value={amount} onChange={setAmount} />
      <Field label="Od" value={startDate} type="date" onChange={setStartDate} />
      <Field label="Do (nepovinné)" value={endDate} type="date" onChange={setEndDate} hint="bez hodnoty trvá" />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť výdavok</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
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

/** derivedInvCents: súčet položiek v sekcii Investície; ak existuje, suma sa odvodzuje, nie zadáva (D-101). */
function SnapshotSection({ repo, latest, capital, derivedInvCents, snapshots, properties, positions, onSaved }: { repo: Repository; latest: Snapshot | null; capital: Capital; derivedInvCents: number | null; snapshots: Snapshot[]; properties: Property[]; positions: Position[]; onSaved: () => void }) {
  const [date, setDate] = useState(todayIso());
  // N-04 (D-096): predvyplní K z posledného stavu plus sporenie a investície od D_L.
  const [inv, setInv] = useState<NumIn>(latest ? capital.inv / 100 : "");
  const [cash, setCash] = useState<NumIn>(latest ? capital.cash / 100 : "");
  const [err, setErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [bigChange, setBigChange] = useState(false);

  const write = async (existingId: string | undefined) => {
    try {
      await repo.addManualSnapshot({
        id: existingId ?? uid(),
        date,
        investmentsCents: derivedInvCents ?? cents(asNum(inv)),
        cashCents: cents(asNum(cash)),
        createdAt: new Date().toISOString(),
      });
      setConfirmId(null);
      setBigChange(false);
      setEditingDate(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const save = async () => {
    const dateErr = checkDate(date, todayIso(), "dátum vyhodnotenia");
    if (dateErr.length) return setErr(dateErr[0]);
    const invMissing = derivedInvCents === null && Number.isNaN(asNum(inv));
    if (invMissing && Number.isNaN(asNum(cash))) return setErr("Vyplň hodnotu investícií aj nasporenú sumu v hotovosti.");
    if (invMissing) return setErr("Vyplň hodnotu investícií.");
    if (Number.isNaN(asNum(cash))) return setErr("Vyplň nasporenú sumu v hotovosti.");
    if ((derivedInvCents === null && asNum(inv) < 0) || asNum(cash) < 0) return setErr("Hodnoty nesmú byť záporné.");
    const same = snapshots.find((s) => s.date === date);
    if (same) return setConfirmId(same.id); // D-055: prepis len po potvrdení
    // Preklep (napr. 3 000 namiesto 30 000) sa len overí: zmena nad 50 % sa potvrdí, nezablokuje.
    const newK = (derivedInvCents ?? cents(asNum(inv))) + cents(asNum(cash));
    const oldK = latest ? latest.investmentsCents + latest.cashCents : 0;
    if (!bigChange && oldK > 0 && Math.abs(newK - oldK) > oldK * 0.5) return setBigChange(true);
    await write(undefined);
  };

  // Úprava existujúceho ručného vyhodnotenia: údaje sa načítajú do formulára, uloženie ide cez prepis (D-055).
  const startEdit = (s: Snapshot) => {
    setEditingDate(s.date);
    setDate(s.date);
    setInv(s.investmentsCents / 100);
    setCash(s.cashCents / 100);
    setErr(null);
    setBigChange(false);
  };

  const remove = async (id: string) => {
    try {
      await repo.deleteSnapshot(id);
      setDeleteId(null);
      setDelErr(null);
      onSaved();
    } catch {
      setDelErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        {latest ? `Posledné vyhodnotenie: ${dateSk(latest.date)}.` : "Zatiaľ nebolo vyhodnotenie. Dátum cieľa sa zobrazí až po ňom."}
      </p>
      <p style={{ color: "var(--muted)" }}>Mesačné vyhodnotenie sa vytvára automaticky. Tu ho zadáš len na opravu. Dátum cieľa sa mení až pri vyhodnotení.</p>
      {staleValuationNames(positions, todayIso()).length > 0 && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Ocenenie niektorých investícií je staršie ako 3 mesiace. Suma vo vyhodnotení môže byť zastaraná.</p>
      )}
      {latest && positionsChangedSince(positions, latest.createdAt) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Investície sa zmenili od posledného vyhodnotenia. Nové vyhodnotenie zohľadní aj túto zmenu.</p>
      )}
      {latest && propertyChangedSince(properties, latest.createdAt) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Majetok sa zmenil od posledného vyhodnotenia. Nové vyhodnotenie zohľadní aj túto zmenu.</p>
      )}
      {editingDate && <p style={{ background: "var(--banner)", padding: 8, borderRadius: 6 }}>Upravuješ vyhodnotenie z {dateSk(editingDate ?? "")}. Uložením sa prepíše.</p>}
      <Field label="Dátum vyhodnotenia" value={date} type="date" max={todayIso()} onChange={setDate} />
      {derivedInvCents === null ? (
        <Field label="Hodnota investícií (€)" value={inv} onChange={setInv} />
      ) : (
        <p>Hodnota investícií: <strong>{eur(derivedInvCents)}</strong> (súčet položiek v sekcii Investície)</p>
      )}
      <Field label="Nasporená suma, hotovosť (€)" value={cash} onChange={setCash} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      {bigChange && (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6 }}>
          <p>Zmena K je viac ako 50 % oproti poslednému vyhodnoteniu. Je to správne?</p>
          <button onClick={() => write(undefined)} style={btn}>Áno, uložiť</button>{" "}
          <button onClick={() => setBigChange(false)} style={btn}>Upraviť údaje</button>
        </div>
      )}
      {confirmId && (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6 }}>
          <p>Vyhodnotenie s dátumom {dateSk(date)} už existuje. Prepísať ho? História sa zachová v zálohe.</p>
          <button onClick={() => write(confirmId)} style={btn}>Prepísať vyhodnotenie</button>{" "}
          <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
        </div>
      )}
      <button onClick={save} style={btn}>Uložiť vyhodnotenie</button>

      <h3 style={{ fontSize: "1rem", marginTop: 24 }}>Uložené vyhodnotenia</h3>
      {snapshots.length === 0 && <p>Zatiaľ nie sú uložené vyhodnotenia.</p>}
      {[...snapshots].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
        <div key={s.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{dateSk(s.date)}</strong>{s.auto ? " · automaticky" : ""}</p>
          <p style={{ margin: "4px 0" }}>K: {eur(s.investmentsCents + s.cashCents)} (investície {eur(s.investmentsCents)}, hotovosť {eur(s.cashCents)})</p>
          {s.auto ? (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Automatické vyhodnotenie sa vytvorí znova z ručných údajov.</p>
          ) : deleteId === s.id ? (
            <div>
              <p>Naozaj zmazať vyhodnotenie z {dateSk(s.date)}? Ak chceš mať kópiu, najprv stiahni zálohu v sekcii Záloha.</p>
              <button onClick={() => remove(s.id)} style={btn}>Zmazať vyhodnotenie</button>{" "}
              <button onClick={() => setDeleteId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => startEdit(s)} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setDeleteId(s.id)} style={btn}>Zmazať</button>
            </>
          )}
        </div>
      ))}
      {delErr && <p style={{ color: "var(--danger)" }}>{delErr}</p>}
    </section>
  );
}

/** Prílohy k výdavku (D-160): doklady a fotky, uložené v zariadení a zahrnuté v zálohe. */
function AttachmentsBlock({ repo, transactionId }: { repo: Repository; transactionId: string }) {
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    try {
      setItems(await repo.listAttachments(transactionId));
    } catch {
      setMsg(STORAGE_ERROR);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  const onFile = async (file: File) => {
    if (!(ATTACHMENT_TYPES as readonly string[]).includes(file.type) || file.size > ATTACHMENT_MAX_BYTES) {
      return setMsg("Príloha musí byť JPG, PNG, WEBP alebo PDF, najviac 2 MB.");
    }
    try {
      await repo.saveAttachment({ id: uid(), transactionId, name: file.name.slice(0, 120) || "príloha", type: file.type, size: file.size, createdAt: new Date().toISOString(), data: file });
      setMsg(null);
      await load();
    } catch {
      setMsg(STORAGE_ERROR);
    }
  };

  const open = (a: Attachment) => {
    const url = URL.createObjectURL(a.data);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const remove = async (id: string) => {
    try {
      await repo.deleteAttachment(id);
      setConfirmId(null);
      await load();
    } catch {
      setMsg(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ fontSize: "0.9rem" }}>
      <p style={{ margin: "4px 0", color: "var(--muted)" }}>Doklady k výdavku: JPG, PNG, WEBP alebo PDF, najviac 2 MB.</p>
      {items && items.length === 0 && <p style={{ margin: "4px 0" }}>Zatiaľ nie je priložený žiadny doklad.</p>}
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {(items ?? []).map((a) => (
          <li key={a.id}>
            {a.name} · {Math.max(1, Math.round(a.size / 1024))} kB{" "}
            <button onClick={() => open(a)} style={btn}>Otvoriť</button>{" "}
            {confirmId === a.id ? (
              <>
                <button onClick={() => remove(a.id)} style={btn}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
              </>
            ) : (
              <button onClick={() => setConfirmId(a.id)} style={btn}>Zmazať prílohu</button>
            )}
          </li>
        ))}
      </ul>
      <label style={{ display: "block", margin: "6px 0" }}>
        <span style={{ display: "block" }}>Pridať prílohu</span>
        <input
          type="file"
          aria-label="Pridať prílohu"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void onFile(f);
          }}
        />
      </label>
      {msg && <p style={{ color: "var(--danger)" }}>{msg}</p>}
    </div>
  );
}

function TransactionSection({ repo, data, ctx, onChanged }: { repo: Repository; data: AppData; ctx: Ctx; onChanged: () => void }) {
  const [type, setType] = useState<TransactionType>("vydavok");
  const [amount, setAmount] = useState<NumIn>("");
  const [date, setDate] = useState(todayIso());
  const [source, setSource] = useState<Source>("z_hotovosti");
  const [category, setCategory] = useState<BudgetCategory | "">("");
  const [note, setNote] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [qrMsg, setQrMsg] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [itemsText, setItemsText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Transaction | null>(null);
  const [undoAtt, setUndoAtt] = useState<Attachment[]>([]);
  const [openAttId, setOpenAttId] = useState<string | null>(null);
  const [fType, setFType] = useState<"all" | TransactionType>("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fCategory, setFCategory] = useState<BudgetCategory | "all" | "none">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [confirmExhausted, setConfirmExhausted] = useState(false);
  useEffect(() => setConfirmExhausted(false), [type, source, amount]);

  useEffect(() => {
    if (!undo) return;
    const h = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(h);
  }, [undo]);

  const needsSource = type === "vydavok" || type === "investicia";
  // Pri úprave sa pôvodná transakcia z výpočtu vyradí (R12).
  const base = useMemo(() => {
    const others = data.transactions.filter((t) => t.id !== editingId);
    const capital = capitalWithFlags(ctx.latest, others).capital;
    return { capital, reserve: reserveBalance(others) };
  }, [data.transactions, editingId, ctx.latest]);

  /** Výsledok náhľadu: nový kapitál, alebo dôvod zamietnutia (D-045, D-052, FR-08). */
  const check = (): { after: Capital | null; message?: string; needsConfirm?: boolean } => {
    const a = asNum(amount);
    const cap = base.capital;
    if (Number.isNaN(a) || !(a > 0)) return { after: cap };
    const ca = cents(a);
    if (type === "vydavok") {
      if (source === "z_hotovosti") {
        const r = payFromCash(cap, ca);
        return r.ok ? { after: r.capital } : { after: null, message: "Hotovosti nestačí na tento výdavok. Zvoľ zdroj „z investícií“." };
      }
      if (source === "z_investicii") {
        const r = payFromInvestments(cap, ca);
        if (r.ok && r.warning === "exhausted") return { after: r.capital, needsConfirm: true, message: "Investície nestačia. Po uložení bude K_inv 0 €. Ak výdavok platíš z príjmu, zvoľ zdroj „z príjmu“." };
        return { after: r.ok ? r.capital : cap };
      }
      return { after: cap }; // z príjmu
    }
    if (type === "investicia") {
      if (source === "z_hotovosti") {
        const r = transferToInvestments(cap, ca);
        return r.ok ? { after: r.capital } : { after: null, message: "Hotovosti nestačí na presun do investícií." };
      }
      return { after: { inv: cap.inv + ca, cash: cap.cash } };
    }
    if (type === "sporenie") return { after: { inv: cap.inv, cash: cap.cash + ca } };
    if (type === "rezerva") {
      if (cap.cash - ca < 0) return { after: null, message: "Hotovosť nestačí na vklad do rezervy." };
      return { after: { inv: cap.inv, cash: cap.cash - ca }, message: `Vklad do rezervy zníži kapitál pre cieľ o ${eur(ca)}; peniaze zostávajú v rezerve.` };
    }
    if (ca > base.reserve) return { after: null, message: "Výber je väčší než stav rezervy." };
    return { after: { inv: cap.inv, cash: cap.cash + ca } }; // výber z rezervy
  };

  const preview = useMemo(() => {
    if (!ctx.latest || ctx.target === null) return null;
    if (Number.isNaN(asNum(amount)) || asNum(amount) <= 0) return { blocked: true as const, message: "Zadaj sumu, aby sa ukázal predbežný dopad." };
    const c = check();
    if (c.after === null) return { blocked: true as const, message: c.message };
    const d = impactWithRentals(base.capital, c.after, ctx.mInv, ctx.mCash, ctx.realReturn, ctx.target, ctx.rentals);
    return { blocked: false as const, impact: d, note: c.message, needsConfirm: !!c.needsConfirm };
  }, [type, source, amount, base, ctx]);

  const parsedItems = useMemo(() => parseReceiptItems(itemsText), [itemsText]);
  const itemsTotal = parsedItems.items.reduce((sum, i) => sum + i.amountCents, 0);
  const itemsMismatch = parsedItems.items.length > 0 && !Number.isNaN(asNum(amount)) && cents(asNum(amount)) !== itemsTotal;
  const storedItems = (editingId ? data.transactions.find((x) => x.id === editingId)?.receiptItems : undefined) ?? [];

  const resetForm = () => {
    setConfirmExhausted(false);
    setEditingId(null);
    setNote("");
    setReceiptId("");
    setQrMsg(null);
    setCameraOn(false);
    setItemsText("");
    setCategory("");
    setAmount("");
    setDate(todayIso());
    setErr(null);
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.amountCents / 100);
    setDate(t.date);
    setSource(t.source ?? "z_hotovosti");
    setCategory(t.category ?? "");
    setNote(t.note ?? "");
    setReceiptId(t.receiptId ?? "");
    setQrMsg(null);
    setItemsText("");
    setErr(null);
  };

  // Fotka QR kódu dokladu: číslo dokladu sa len navrhne, potvrdí ho používateľ (D-126).
  // Overenie na portáli: číslo ide len do schránky, nezobrazuje sa (D-133).
  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(receiptId.trim());
      setCopyMsg("Číslo je v schránke. Vložte ho na portál.");
    } catch {
      setCopyMsg("Schránku sa nepodarilo použiť. Overenie na portáli urobte neskôr.");
    }
  };

  // Text z QR kódu: ak je to číslo dokladu, vyplní pole; inak povie, čo sa prečítalo (bez obsahu).
  const useQrText = (text: string) => {
    const id = receiptIdFromQr(text);
    if (id) {
      setReceiptId(id);
      setQrMsg("QR kód je načítaný.");
    } else {
      setQrMsg(`QR kód sa prečítal, ale nie je to číslo dokladu (${text.trim().length} znakov). Zadajte ho ručne.`);
    }
  };

  const scanReceipt = async (file: File) => {
    setQrMsg("Načítavam QR kód…");
    try {
      const text = await readQrFromImage(file);
      if (text === null) setQrMsg("QR kód sa v obrázku nenašiel. Nafoťte ho bližšie, rovno a v dobrom svetle.");
      else useQrText(text);
    } catch {
      setQrMsg("Skener QR kódu sa nepodarilo spustiť. Zadajte číslo dokladu ručne.");
    }
  };

  const save = async () => {
    if (!ctx.latest) return setErr("Najprv zapíš stav investícií a hotovosti vo Vyhodnotení.");
    const a = asNum(amount);
    if (Number.isNaN(a) || !(a > 0)) return setErr("Suma musí byť kladná.");
    const dateErr = checkDate(date, todayIso(), "dátum");
    if (dateErr.length) return setErr(dateErr[0]);
    const c = check();
    if (c.after === null) return setErr(c.message ?? "Transakciu nie je možné uložiť.");
    if (c.needsConfirm && !confirmExhausted) return setErr("Potvrď, že investície sa vyčerpajú.");
    const existing = editingId ? data.transactions.find((x) => x.id === editingId) : undefined;
    const excess = type === "vydavok" && source === "z_investicii" && c.needsConfirm ? cents(a) - base.capital.inv : 0;
    const noteText = [note, excess > 0 ? `prečerpanie ${eur(excess)} nad K_inv` : ""].filter(Boolean).join("; ");
    const receipt = receiptId.trim();
    if (type === "vydavok" && receipt !== "" && !isReceiptId(receipt)) return setErr("Číslo dokladu má 20 až 40 znakov: písmená, číslice a pomlčky.");
    // Nerozpoznané riadky sa nesmú potichu vynechať (D-129).
    if (type === "vydavok" && parsedItems.unparsed.length > 0) return setErr("Niektoré riadky položiek sa nepodarilo rozpoznať. Opravte text alebo ho vymažte.");
    const receiptItems = type === "vydavok" ? (parsedItems.items.length > 0 ? parsedItems.items : existing?.receiptItems) : undefined;
    const t: Transaction = {
      id: existing?.id ?? uid(),
      date,
      type,
      amountCents: cents(a),
      ...(needsSource ? { source } : {}),
      ...(type === "vydavok" && category !== "" ? { category } : {}),
      ...(noteText ? { note: noteText.slice(0, 200) } : {}),
      ...(type === "vydavok" && receipt !== "" ? { receiptId: receipt } : {}),
      ...(receiptItems && receiptItems.length > 0 ? { receiptItems } : {}),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await repo.addTransaction(t);
    } catch {
      return setErr(STORAGE_ERROR);
    }
    resetForm();
    onChanged();
  };

  const remove = async (id: string) => {
    const gone = data.transactions.find((x) => x.id === id) ?? null;
    let atts: Attachment[] = [];
    try {
      // Prílohy sa odložia, aby ich vrátenie späť obnovilo (D-160).
      atts = await repo.listAttachments(id);
      await repo.deleteTransaction(id);
    } catch {
      return setErr(STORAGE_ERROR);
    }
    if (editingId === id) resetForm();
    setUndo(gone);
    setUndoAtt(atts);
    onChanged();
  };

  const restore = async () => {
    if (!undo) return;
    try {
      await repo.addTransaction(undo);
      for (const a of undoAtt) await repo.saveAttachment(a);
      setUndoAtt([]);
    } catch {
      return setErr(STORAGE_ERROR);
    }
    setUndo(null);
    onChanged();
  };

  const list = filterHistory(data.transactions, { type: fType === "all" ? undefined : fType, from: fFrom || undefined, to: fTo || undefined, category: fCategory === "all" ? undefined : fCategory });
  const totals = totalsByType(list);
  const categoryTotals = expenseTotalsByCategory(list);
  const inEdit = editingId !== null;

  return (
    <section>
      {!ctx.latest && <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Najprv urob vyhodnotenie vo <a href="#vyhodnotenie">Vyhodnotení</a>, potom môžeš zapisovať transakcie.</p>}
      {inEdit && <h2 style={{ fontSize: "1.1rem" }}>Úprava transakcie</h2>}
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>Typ</span>
        <select aria-label="Typ transakcie" value={type} onChange={(e) => setType(e.target.value as TransactionType)} style={inp}>
          {(Object.keys(TYPE_LABEL) as TransactionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      </label>
      {needsSource && (
        <label style={{ display: "block", margin: "8px 0" }}>
          <span style={{ display: "block", fontSize: "0.9rem" }}>Zdroj</span>
          <select aria-label="Zdroj úhrady" value={source} onChange={(e) => setSource(e.target.value as Source)} style={inp}>
            {SOURCES.map((x) => <option key={x} value={x}>{SOURCE_LABEL[x]}</option>)}
          </select>
        </label>
      )}
      {type === "vydavok" && (
        <label style={{ display: "block", margin: "8px 0" }}>
          <span style={{ display: "block", fontSize: "0.9rem" }}>Kategória (nepovinná)</span>
          <select aria-label="Kategória" value={category} onChange={(e) => setCategory(e.target.value as BudgetCategory | "")} style={inp}>
            <option value="">bez kategórie</option>
            {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      )}
      <Field label="Suma (€)" value={amount} onChange={setAmount} />
      <Field label="Dátum" value={date} type="date" max={todayIso()} onChange={setDate} />
      {type === "vydavok" && (
        <div style={{ margin: "8px 0" }}>
          {cameraOn ? (
            <ReceiptCamera
              onFound={(text) => { setCameraOn(false); useQrText(text); }}
              onClose={() => setCameraOn(false)}
            />
          ) : (
            canUseCamera() && <button type="button" onClick={() => setCameraOn(true)} style={btn}>Skenovať QR kód kamerou</button>
          )}
          <label style={{ display: "block", margin: "4px 0" }}>
            <span style={{ display: "block", fontSize: "0.9rem" }}>Alebo nafoťte QR kód z dokladu</span>
            <input type="file" accept="image/*" capture="environment" aria-label="Fotka QR kódu dokladu" onChange={(e) => { const f = e.target.files?.[0]; if (f) void scanReceipt(f); }} />
          </label>
          {qrMsg && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{qrMsg}</p>}
          {/* Číslo dokladu sa nezobrazuje a nedá sa zadať ručne; používa sa len na overenie (D-133). */}
          {receiptId !== "" && (
            <>
              <p style={{ fontSize: "0.9rem" }}>
                Doklad je priradený.{" "}
                <button type="button" onClick={() => { setReceiptId(""); setQrMsg(null); setCopyMsg(null); }} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Odstrániť doklad</button>
              </p>
              <a
                href={RECEIPT_CHECK_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void copyReceipt()}
                style={{ ...btn, display: "inline-block", textDecoration: "none", color: "inherit", border: "1px solid var(--border-strong)", borderRadius: 4 }}
              >
                Overiť doklad na portáli
              </a>
              {copyMsg && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{copyMsg}</p>}
            </>
          )}
        </div>
      )}
      {type === "vydavok" && (
        <div style={{ margin: "8px 0" }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: "0.9rem" }}>Položky z dokladu (nepovinné; vložte text skopírovaný z portálu)</span>
            <textarea aria-label="Položky z dokladu" value={itemsText} onChange={(e) => setItemsText(e.target.value)} rows={4} style={{ ...inp, fontFamily: "inherit" }} />
          </label>
          {parsedItems.items.length > 0 && (
            <>
              <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "0.9rem" }}>
                {parsedItems.items.map((i) => (
                  <li key={i.code}>{i.name}: {i.quantity} ks, DPH {i.vatPercent} %, {eur(i.amountCents)}</li>
                ))}
              </ul>
              <p style={{ fontSize: "0.9rem" }}>Súčet položiek: <strong>{eur(itemsTotal)}</strong></p>
            </>
          )}
          {parsedItems.unparsed.length > 0 && (
            <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>Nerozpoznané riadky: {parsedItems.unparsed.length}. Opravte text alebo ho vymažte; bez toho sa výdavok neuloží.</p>
          )}
          {itemsMismatch && (
            <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>Súčet položiek sa nezhoduje so sumou výdavku {eur(cents(asNum(amount)))} (napr. zľava). Uložiť sa dá, ak je to v poriadku.</p>
          )}
          {itemsText.trim() === "" && storedItems.length > 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Uložené položky: {storedItems.length}. Vložením nového textu sa nahradia.</p>
          )}
        </div>
      )}
      <Field label="Poznámka (voliteľná)" value={note} type="text" onChange={setNote} />
      {preview && (
        <p>
          {preview.blocked
            ? preview.message
            : <>Predbežný dopad: <strong>{formatImpactOutcome(preview.impact)}</strong></>}
        </p>
      )}
      {preview && !preview.blocked && preview.note && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>{preview.note}</p>
      )}
      {preview && !preview.blocked && preview.needsConfirm && (
        <label style={{ display: "block", margin: "8px 0" }}>
          <input type="checkbox" checked={confirmExhausted} onChange={(e) => setConfirmExhausted(e.target.checked)} /> Rozumiem, investície sa vyčerpajú a K_inv bude 0 €.
        </label>
      )}
      {inEdit && date <= (ctx.latest?.date ?? "") && (
        <p style={{ color: "var(--muted)" }}>Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.</p>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>{inEdit ? "Uložiť zmeny" : "Uložiť transakciu"}</button>
      {inEdit && <button onClick={resetForm} style={{ ...btn, marginLeft: 8 }}>Zrušiť úpravu</button>}

      <h3 style={{ fontSize: "1rem", marginTop: 24 }}>História</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select aria-label="Filter typu" value={fType} onChange={(e) => setFType(e.target.value as "all" | TransactionType)} style={{ ...inp, width: "auto" }}>
          <option value="all">všetky typy</option>
          {(Object.keys(TYPE_LABEL) as TransactionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <select aria-label="Filter kategórie" value={fCategory} onChange={(e) => setFCategory(e.target.value as BudgetCategory | "all" | "none")} style={{ ...inp, width: "auto" }}>
          <option value="all">všetky kategórie</option>
          <option value="none">nezaradené</option>
          {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input aria-label="Od dátumu" type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={{ ...inp, width: "auto" }} />
        <input aria-label="Do dátumu" type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} style={{ ...inp, width: "auto" }} />
      </div>
      <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
        Súčet zobrazených transakcií: {(Object.keys(totals) as TransactionType[]).length === 0
          ? "žiadne transakcie"
          : (Object.keys(totals) as TransactionType[]).map((t) => `${TYPE_LABEL[t]} ${eur(totals[t] ?? 0)}`).join(" · ")}
      </p>
      {Object.keys(categoryTotals).length > 0 && (
        <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          Výdavky podľa kategórie: {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([c, v]) => `${c} ${eur(v)}`).join(" · ")}
        </p>
      )}
      {undo && (
        <p style={{ background: "var(--banner)", padding: 8, borderRadius: 6 }}>
          Transakcia bola zmazaná. <button onClick={restore} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Vrátiť späť</button>
        </p>
      )}
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {list.length === 0 && <li style={{ color: "var(--muted)" }}>Zatiaľ žiadne.</li>}
        {list.map((t) => (
          <Fragment key={t.id}>
          <li style={{ borderBottom: "1px solid var(--border-soft)", padding: "6px 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span>
              {dateSk(t.date)} · {TYPE_LABEL[t.type]} · {eur(t.amountCents)}
              {t.source ? ` (${SOURCE_LABEL[t.source]})` : ""}
              {t.type === "vydavok" && t.amountCents >= (ctx.settings?.thresholdCents ?? recommendedSettings(0).thresholdCents) ? " · nad prahom" : ""}
              {t.note ? ` · ${t.note}` : ""}
              {t.receiptId ? " · doklad" : ""}
              {t.receiptItems && t.receiptItems.length > 0 ? ` · položiek: ${t.receiptItems.length}` : ""}
            </span>
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {t.type === "vydavok" && <button onClick={() => setOpenAttId(openAttId === t.id ? null : t.id)} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Prílohy</button>}
              <button onClick={() => startEdit(t)} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Upraviť</button>
              {confirmDeleteId === t.id ? (
                <>
                  <span>Naozaj zmazať?</span>
                  <button onClick={() => { setConfirmDeleteId(null); void remove(t.id); }} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Zmazať</button>
                  <button onClick={() => setConfirmDeleteId(null)} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Zrušiť</button>
                </>
              ) : (
                <button onClick={() => setConfirmDeleteId(t.id)} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Zmazať</button>
              )}
            </span>
          </li>
          {openAttId === t.id && t.type === "vydavok" && (
            <li style={{ borderBottom: "1px solid var(--border-soft)", padding: "6px 0" }}>
              <AttachmentsBlock repo={repo} transactionId={t.id} />
            </li>
          )}
          </Fragment>
        ))}
      </ul>
    </section>
  );
}



/** Hodnota poľa sa líši od východiskovej (FR-13): tlačidlo „vrátiť“ sa ukáže len vtedy. */
function differs(value: NumIn | string, defaultValue: number | null): boolean {
  if (value === "" || Number.isNaN(value as number)) return false; // nezadané: výzva je v nápovede, nie tlačidlo
  if (defaultValue === null) return true; // prepísané pole bez východiskovej hodnoty
  return Math.abs(Number(value) - defaultValue) > 1e-9;
}


