import { useEffect, useMemo, useRef, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import { ASSET_KINDS, BALANCE_INVESTMENT_KINDS, BUDGET_CATEGORIES, RECURRING_FREQUENCIES, STOCK_UNITS, type StockItem, type StockUnit, TAX_REGIMES, type TaxRegime, type RecurringExpense, type RecurringFrequency, INCOME_FREQUENCIES, INCOME_KINDS, type IncomeFrequency, type IncomeKind, INVESTMENT_KINDS, LIABILITY_KINDS, PROPERTY_MODES, SOURCES, type AppData, type Asset, type AssetKind, type Budget, type BudgetCategory, type InvestmentKind, type Liability, type LiabilityKind, type Position, type Property, type PropertyMode, type RegularIncome, type Settings, type Snapshot, type Source, type Transaction, type TransactionType } from "../storage/types";
import { checkDate } from "../storage/validate";
import { checkPin, isValidPin, makePinRecord } from "../app/pin";
import { buildBackup, parseBackup } from "../storage/backup";
import { capitalWithFlags, reserveBalance } from "../app/ledger";
import { expenseTotalsByCategory, filterHistory, totalsByType } from "../app/history";
import { backupOverdue, daysSince, reviewOverdue } from "../app/reminders";
import { targetAmountCents } from "../domain/goal";
import { goalDisplay } from "../domain/goalDisplay";
import { goalDateText } from "../domain/goalText";
import { formatImpactOutcome, plural, UNREACHABLE_IMPACT_TEXT } from "../domain/impact";
import { annualOverview, type OverviewSettings } from "../domain/annualOverview";
import { monthlySaving } from "../domain/saving";
import { monthlyCostsCents, netPropertyValueCents, splitPayment, valueIsStale } from "../domain/property";
import { investmentsTotalCents, monthlyContributionsTotalCents, positionValueCents } from "../domain/investments";
import { liabilityInterestCents, liabilitiesTotals } from "../domain/liabilities";
import { irregularIncomes, isIncomeActive, monthlyIncomeCents } from "../domain/income";
import { monthSummary } from "../domain/monthSummary";
import { annualRecurringTotalCents, endingSoon, isRecurringActive, monthlyRecurringByCategory, monthlyRecurringTotalCents, monthlyShareCents } from "../domain/recurring";
import { TAX_CATALOG, taxScenario } from "../domain/tax";
import { PHASE2_ENABLED, visibleSections } from "../app/features";
import { daysUntil, expiringItems, stockStatus } from "../domain/stock";
import { findExpiryDate, findProductName } from "../domain/scan";
import { cookRecipe } from "../domain/recipe";
import { readQrFromImage } from "../app/receiptScan";
import { ReceiptCamera } from "./ReceiptCamera";
import { isReceiptId, RECEIPT_CHECK_URL, receiptIdFromQr } from "../domain/receipt";
import { parseReceiptItems } from "../domain/receiptItems";
import type { Recipe, RecipeIngredient } from "../storage/types";
import { FEED_MAX_BYTES, parseFeed, type ParsedFeed } from "../storage/feed";
import { autoSnapshot } from "../app/autoEvaluation";
import { budgetStatus, spentInMonthCents } from "../domain/budget";
import { recommendedSettings } from "../domain/recommendations";
import { LONG_HORIZON_MONTHS, netRealReturn, nominalFromReal, RETURN_ASSUMPTIONS } from "../domain/assumptions";
import { goalMonths, impactWithRentals, rentalsFor, type Rental } from "../domain/rentalGoal";
import {
  payFromCash,
  payFromInvestments,
  transferToInvestments,
  type Capital,
} from "../domain/capital";

const MONTHS = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
const cents = (x: number) => Math.round(x * 100);
const eur = (c: number) => `${(c / 100).toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €`;
const eurExact = (c: number) => `${(c / 100).toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
/** Lokálny dnešný dátum YYYY-MM-DD (R14: nie UTC). */
const todayIso = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const monthYear = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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
const STORAGE_ERROR = "Úložisko zlyhalo a dáta sa nezmenili. Skús znova alebo exportuj zálohu.";

/** Číselné pole môže byť prázdne (NaN); validácia pri uložení (R11). */
type NumIn = number | "";
const asNum = (x: NumIn) => (x === "" ? NaN : x);

/** Kontext vypočítaný raz pre všetky sekcie. */
interface Ctx {
  settings: Settings | null;
  latest: Snapshot | null;
  capital: Capital;
  negative: { inv: boolean; cash: boolean };
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

export function App() {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [settingsFlash, setSettingsFlash] = useState<string | null>(null);
  // Lokálny PIN (D-119): pinSet = PIN je zapnutý; locked = appka čaká na odomknutie.
  const [pinSet, setPinSet] = useState(false);
  const [locked, setLocked] = useState(false);
  // Sprievodca otvorený z Nastavení nad existujúcimi údajmi (nemaže dáta).
  const [wizardOpen, setWizardOpen] = useState(false);
  const section = useSection();
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

  if (isIosBrowser() && !isStandalone()) return <Shell><IosInstallGate /></Shell>;
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
          <HomeSection data={data} ctx={ctx} lastExport={lastExport} />
          <details id="navod" style={{ marginTop: 16, background: "var(--surface)", padding: 12, borderRadius: 8 }}>
            <summary style={{ fontWeight: 600, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Návod</summary>
            <ol style={{ paddingLeft: 20 }}>
              <li><strong>Prvé nastavenie:</strong> pri prvom spustení zadaj ročné výdavky a mieru výberu. Ostatné polia majú východiskové hodnoty.</li>
              <li><strong>Vyhodnotenie:</strong> mesačné vyhodnotenie vzniká automaticky. Ručne ho zadáš len na opravu. Dátum cieľa sa mení len po vyhodnotení.</li>
              {PHASE2_ENABLED && <li><strong>Rozpočet:</strong> limity na kategórie sú mesačný plán. Prehľad ukáže plnenie a rozpis na nevyhnutné a nie nevyhnutné výdavky.</li>}
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
        </Section>
      )}
      {section === "nova-transakcia" && (
        <Section id="nova-transakcia" title="Transakcie">
          <TransactionSection repo={repo} data={data} ctx={ctx} onChanged={reload} />
        </Section>
      )}
      {section === "vyhodnotenie" && (
        <Section id="vyhodnotenie" title="Vyhodnotenie">
          <SnapshotSection key={`${ctx.latest?.id ?? "none"}-${ctx.capital.inv}-${ctx.capital.cash}-${data.investments.length}`} repo={repo} latest={ctx.latest} capital={ctx.capital} derivedInvCents={data.investments.length ? investmentsTotalCents(data.investments) : null} snapshots={data.snapshots} onSaved={reload} />
        </Section>
      )}
      {section === "majetok" && (
        <Section id="majetok" title="Majetok">
          <PropertySection repo={repo} properties={data.properties} assets={data.assets} today={todayIso()} onSaved={reload} />
        </Section>
      )}
      {section === "rozpocet" && (
        <Section id="rozpocet" title="Rozpočet">
          <BudgetSection key={data.budgets.map((b) => `${b.category}${b.limitCents}`).join("|")} repo={repo} budgets={data.budgets} transactions={data.transactions} recurring={data.recurringExpenses} today={todayIso()} onSaved={reload} />
        </Section>
      )}
      {section === "prijmy" && (
        <Section id="prijmy" title="Príjmy">
          <IncomeSection repo={repo} incomes={data.incomes} today={todayIso()} onSaved={reload} />
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

/** iOS Safari mimo plochy (D-053): povinná výzva na pridanie. */
function isIosBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
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
const ONBOARD_STEPS = 7; // 0 úvod, 1 výdavky, 2 miera výberu, 3 dnešný stav, 4 záloha, 5 PIN (voliteľný), 6 výsledok

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
      const r = await exportBackupFile(d);
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
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
      {step > 0 && step < 6 && <button onClick={() => go(step - 1)} style={btn}>Späť</button>}
      <button onClick={onSkip} style={btn}>{rerun ? "Zavrieť sprievodcu" : "Preskočiť na hlavnú stránku"}</button>
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
          <p style={{ color: "var(--muted)" }}>Ak nevieš, nechaj prázdne. Použije sa východisková hodnota {(rec.withdrawalRate * 100).toFixed(1).replace(".", ",")} %.</p>
          <Field label="Miera výberu (%)" value={withdrawal} step={0.1} onChange={setWithdrawal} />
          <button onClick={() => go(3)} style={btn}>Pokračovať</button>
          {nav}
        </>
      )}
      {step === 3 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Koľko máš dnes?</h2>
          <p style={{ color: "var(--muted)" }}>Investície sú súčet účtov a cenných papierov. Hotovosť je suma, ktorú máš na účte. Môžeš to neskôr zmeniť.</p>
          <Field label="Hodnota investícií (€)" value={inv} onChange={setInv} hint="0, ak nemáš" />
          <Field label="Nasporená suma, hotovosť (€)" value={cash} onChange={setCash} hint="0, ak nemáš" />
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          <button onClick={saveAll} disabled={busy} style={btn}>Uložiť a pokračovať</button>
          {nav}
        </>
      )}
      {step === 4 && (
        <>
          <h2 style={{ fontSize: "1.1rem" }}>Ulož si zálohu</h2>
          <p>Údaje sú len v tomto telefóne. Ak telefón stratíš alebo vymažeš prehliadač, údaje budú preč.</p>
          <p style={{ color: "var(--muted)" }}>Stiahni si zálohu a ulož ju mimo telefónu. Zálohu môžeš urobiť aj neskôr v sekcii Záloha.</p>
          <button onClick={backupNow} style={btn}>Stiahnuť zálohu</button>{" "}
          <button onClick={() => go(rerun ? 6 : 5)} style={btn}>Pokračovať</button>
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
function sectionFromHash(): SectionId {
  const id = window.location.hash.slice(1);
  return NAV_VISIBLE.some((n) => n.id === id) ? (id as SectionId) : "prehlad";
}

/** Zobrazí sa len jedna sekcia; zmena kotvy (odkaz v paneli) ju prepne. */
function useSection(): SectionId {
  const [section, setSection] = useState<SectionId>(sectionFromHash);
  useEffect(() => {
    const onChange = () => {
      setSection(sectionFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return section;
}

/** Horný panel s odkazmi na sekcie (D-095, D-099). Dotyková plocha aspoň 44 px. */
/** Sekcie v hornom paneli; ostatné sú v ponuke „Viac“ (rozhodnutie zakladateľa, navigácia sa môže meniť). */
const PRIMARY_NAV: SectionId[] = ["prehlad", "nova-transakcia", "vyhodnotenie", "majetok", "nastavenia", "zaloha"];
/** Navigácia podľa prepínača Fázy 2 (D-125); verejná zostava ponúka len MVP. */
const NAV_VISIBLE = visibleSections(NAV, PHASE2_ENABLED);

function Nav({ active }: { active: SectionId }) {
  const [more, setMore] = useState(false);
  const primary = NAV_VISIBLE.filter((n) => PRIMARY_NAV.includes(n.id));
  const secondary = NAV_VISIBLE.filter((n) => !PRIMARY_NAV.includes(n.id));
  const moreActive = secondary.some((n) => n.id === active);
  return (
    <div style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 1, borderBottom: "1px solid var(--border-soft)" }}>
    <nav aria-label="Hlavná navigácia" style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: 0, padding: "4px 0" }}>
      {primary.map((n) => (
        <a
          key={n.id}
          href={`#${n.id}`}
          aria-current={n.id === active ? "page" : undefined}
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 6px", color: "inherit", whiteSpace: "nowrap", flex: "0 0 auto", fontSize: "0.9rem", fontWeight: n.id === active ? 700 : 400, textDecoration: n.id === active ? "underline" : "none" }}
        >
          {n.label}
        </a>
      ))}
      {secondary.length > 0 && (
      <button
        type="button"
        aria-expanded={more}
        aria-controls="nav-viac"
        onClick={() => setMore(!more)}
        style={{ minHeight: 44, padding: "0 6px", border: "none", background: "none", color: "inherit", whiteSpace: "nowrap", flex: "0 0 auto", fontSize: "0.9rem", fontWeight: moreActive ? 700 : 400, textDecoration: moreActive ? "underline" : "none", cursor: "pointer" }}
      >
        Viac ▾
      </button>
      )}
    </nav>
    {more && secondary.length > 0 && (
      <div id="nav-viac" aria-label="Ďalšie sekcie" style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 0", background: "var(--surface)", borderBottom: "1px solid var(--border-soft)" }}>
        {secondary.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            onClick={() => setMore(false)}
            aria-current={n.id === active ? "page" : undefined}
            style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 10px", color: "inherit", whiteSpace: "nowrap", fontWeight: n.id === active ? 700 : 400, textDecoration: n.id === active ? "underline" : "none" }}
          >
            {n.label}
          </a>
        ))}
      </div>
    )}
    <div aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 28, pointerEvents: "none", background: "linear-gradient(to right, transparent, var(--surface))" }} />
    </div>
  );
}

/** Nadpis a obsah jednej sekcie (zobrazuje sa samostatne). */
function Section({ id, title, children }: { id: SectionId; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ background: "var(--page)", padding: 12, borderRadius: 8, marginBottom: 8 }}>
      <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

function Shell({ children, nav }: { children: React.ReactNode; nav?: SectionId }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "16px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: "1.5rem" }}>Finančná sloboda</h1>
      <p style={{ color: "var(--muted)" }}>Údaje sa ukladajú len v tomto zariadení. Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.</p>
      {nav && <Nav active={nav} />}
      {children}
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
  const rows = annualOverview(data.snapshots, s);
  if (rows.length === 0) return <p>Zatiaľ nie sú vyhodnotenia. Prehľad sa zobrazí po prvom vyhodnotení.</p>;
  const savingZero = ctx.mInv + ctx.mCash === 0;
  return (
    <div>
      <p style={{ color: "var(--muted)" }}>Vyhodnotenia od najstaršieho. Dátum cieľa sa počíta z uloženého K a z aktuálnych Nastavení, bez nehnuteľností.</p>
      {!s && <p style={{ color: "var(--muted)" }}>Nastavenia nie sú zadané; zobrazí sa len K.</p>}
      {rows.map((r) => (
        <div key={r.date} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{r.date}</strong>{r.auto ? " · automaticky" : ""}</p>
          <p style={{ margin: "4px 0" }}>K: {eur(r.totalCents)} (investície {eur(r.invCents)}, hotovosť {eur(r.cashCents)})</p>
          {r.deltaTotalCents !== null && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              Zmena K: {r.deltaTotalCents >= 0 ? "+" : "−"}{eur(Math.abs(r.deltaTotalCents))}
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
      {reviewOverdue(ctx.latest?.date ?? null, today) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
          Vyhodnotenie za predchádzajúci mesiac chýba. Dátum cieľa sa mení len pri vyhodnotení.
        </p>
      )}
      {(data.snapshots.length > 0 || data.transactions.length > 0 || data.settings !== null) && backupOverdue(lastExport, today) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
          Záloha ešte nebola exportovaná alebo je staršia ako 7 dní. Dáta sú len v tomto zariadení.
        </p>
      )}
      <MonthSpendingBlock data={data} today={today} thresholdCents={ctx.settings?.thresholdCents ?? recommendedSettings(0).thresholdCents} />
      {ctx.target !== null ? <p>Cieľová suma: <strong>{eur(ctx.target)}</strong></p> : <p>Cieľová suma: <strong>nezadaná</strong>. Zadaj ročné výdavky v <a href="#nastavenia">Nastaveniach</a>; ostatné hodnoty sú predvolené.</p>}
      {(ctx.negative.cash || ctx.negative.inv) && (
        <p style={{ background: "var(--err-bg)", padding: 8, borderRadius: 6 }}>
          Pozor: záznamy vedú k zápornému stavu {ctx.negative.cash ? "hotovosti" : "investícií"} a hodnoty sú zarazené na 0. Skontroluj transakcie po poslednom vyhodnotení.
        </p>
      )}
      {ctx.latest && ctx.target !== null ? (
        <>
          <p>Dátum cieľa: <strong>{scenarioText(ctx, ctx.realReturn)}</strong></p>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
            Posledné vyhodnotenie: <strong>{ctx.latest.date}</strong>. Dátum sa zmení až po ďalšom vyhodnotení.
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
function MonthSpendingBlock({ data, today, thresholdCents }: { data: AppData; today: string; thresholdCents: number }) {
  const s = monthSummary(data.transactions, data.budgets, data.recurringExpenses, today, thresholdCents);
  const spent = s.byNecessity.nevyhnutne + s.byNecessity.nie_nevyhnutne + s.byNecessity.ostatne + s.unassignedCents;
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
          {PHASE2_ENABLED && <>Mesačný plán nie je nastavený. Limity nastavíš v <a href="#rozpocet">Rozpočte</a>. </>}
          Minuté tento mesiac: {eur(spent)}.
        </p>
      )}
      <details>
        <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Rozpis výdavkov</summary>
        <ul style={{ paddingLeft: 20 }}>
          <li>Nevyhnutné: {eur(s.byNecessity.nevyhnutne)}</li>
          <li>Nie nevyhnutné: {eur(s.byNecessity.nie_nevyhnutne)}{spent > 0 ? ` (${Math.round((100 * s.byNecessity.nie_nevyhnutne) / spent)} % minutého)` : ""}</li>
          <li>Ostatné a nezaradené: {eur(s.byNecessity.ostatne + s.unassignedCents)}</li>
          <li>Výdavky nad prahom: {s.overThresholdCount}</li>
        </ul>
      </details>
      {PHASE2_ENABLED && ending.length > 0 && (
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
      {properties.length === 0 && editing === null && <p>Zatiaľ nie je zapísaná žiadna nehnuteľnosť.</p>}
      {properties.map((p) => {
        const net = netPropertyValueCents(p);
        const stale = valueIsStale(p.valueDate, today);
        return (
          <div key={p.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
            <p style={{ margin: 0 }}><strong>{p.name || "Nehnuteľnosť"}</strong> · {PROPERTY_MODE_LABEL[p.mode]}</p>
            <p style={{ margin: "4px 0" }}>Odhad: {eur(p.valueCents)} (k {p.valueDate})</p>
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
              {p.mode === "nezadane" ? "Do K sa zatiaľ nepočíta: zadaj režim." : p.mode === "prenajom" ? "Do K sa počíta ako čistá hodnota." : "Do K sa nepočíta; zobrazí sa zvlášť."}
            </p>
            {confirmId === p.id ? (
              <div>
                <p>Naozaj zmazať túto nehnuteľnosť?</p>
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
          <p style={{ margin: "4px 0" }}>Odhad: {eur(a.valueCents)} (k {a.valueDate})</p>
          {valueIsStale(a.valueDate, today) && <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Odhad je starší ako 12 mesiacov. Over ho a zadaj nový.</p>}
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Do K sa zatiaľ nepočíta.</p>
          {confirmId === a.id ? (
            <div>
              <p>Naozaj zmazať toto aktívum?</p>
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
      <Field label="Dátum odhadu (RRRR-MM-DD)" value={valueDate} type="text" onChange={setValueDate} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
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
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (name.trim().length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    if (Number.isNaN(asNum(value))) return setErr("Vyplň odhad hodnoty.");
    if (asNum(value) < 0) return setErr("Odhad hodnoty nesmie byť záporný.");
    const dateErr = checkDate(valueDate, today, "dátum odhadu");
    if (dateErr.length) return setErr(dateErr[0]);
    const m = mortgage === "" ? 0 : asNum(mortgage);
    if (Number.isNaN(m) || m < 0) return setErr("Zostatok hypotéky musí byť číslo 0 alebo viac.");
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
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(trimmed ? { name: trimmed } : {}),
      ...(r !== undefined ? { monthlyRentCents: cents(r) } : {}),
      ...(pay > 0 ? { monthlyPaymentCents: cents(pay) } : {}),
      ...(rt > 0 ? { mortgageRate: rt / 100 } : {}),
      ...(other > 0 ? { monthlyOtherCostsCents: cents(other) } : {}),
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
      <Field label="Dátum odhadu (RRRR-MM-DD)" value={valueDate} type="text" onChange={setValueDate} />
      <Field label="Zostatok hypotéky (€)" value={mortgage} onChange={setMortgage} hint="0, ak hypotéku nemáš" />
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

const INVESTMENT_KIND_LABEL: Record<InvestmentKind, string> = {
  akcie: "Akcie",
  etf: "ETF",
  fond: "Podielový fond",
  dlhopisy: "Dlhopisy",
  krypto: "Kryptomeny",
  zlato_komodity: "Zlato a komodity",
  sporiaci_ucet: "Sporiaci účet alebo termínovaný vklad",
  treti_pilier: "Tretí pilier",
  dochodkove_sporenie: "Dôchodkové sporenie (2. pilier)",
  ine: "Iné",
};

/** Sekcia Investície (D-101, možnosť A): ručné položky; súčet sa použije vo Vyhodnotení. */
function InvestmentSection({ repo, positions, today, onSaved }: { repo: Repository; positions: Position[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<Position | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      await repo.deletePosition(id);
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
        Zadávaš počet kusov, cenu a kurz k euru. Hodnota v eurách sa počíta v telefóne; nič sa neposiela von. Suma investícií vo Vyhodnotení je súčtom týchto položiek.
      </p>
      {positions.length === 0 && editing === null && <p>Zatiaľ nie je zapísaná žiadna položka. Vo Vyhodnotení sa suma zadáva ručne.</p>}
      {positions.length > 0 && (
        <p style={{ fontSize: "1.05rem" }}>Spolu: <strong>{eur(investmentsTotalCents(positions))}</strong></p>
      )}
      {monthlyContributionsTotalCents(positions) > 0 && (
        <p style={{ color: "var(--muted)" }}>Mesačné vklady do tretieho piliera a iných položiek: {eur(monthlyContributionsTotalCents(positions))} (len zobrazenie)</p>
      )}
      {positions.map((p) => (
        <div key={p.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{p.name}</strong> · {INVESTMENT_KIND_LABEL[p.kind]}</p>
          {(BALANCE_INVESTMENT_KINDS as readonly string[]).includes(p.kind) ? (
            <p style={{ margin: "4px 0" }}>
              Stav účtu: {eur(p.unitPrice * 100)}
              {p.monthlyContributionCents ? `, vklad ${eur(p.monthlyContributionCents)} mesačne` : ""}
            </p>
          ) : (
            <p style={{ margin: "4px 0" }}>
              {String(p.quantity)} ks × {String(p.unitPrice)} {p.currency}
              {p.currency !== "EUR" && <span> (kurz {String(p.fxToEur)})</span>}
            </p>
          )}
          <p style={{ margin: "4px 0" }}>Hodnota: <strong>{eur(positionValueCents(p))}</strong> (k {p.valueDate})</p>
          {confirmId === p.id ? (
            <div>
              <p>Naozaj zmazať túto položku?</p>
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
      ))}
      {editing !== null ? (
        <InvestmentForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btn}>Pridať položku</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

function InvestmentForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: Position | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<InvestmentKind>(initial?.kind ?? "etf");
  const [quantity, setQuantity] = useState<NumIn>(initial?.quantity ?? "");
  const [unitPrice, setUnitPrice] = useState<NumIn>(initial?.unitPrice ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "EUR");
  const [fx, setFx] = useState<NumIn>(initial && initial.currency !== "EUR" ? initial.fxToEur : "");
  const [contribution, setContribution] = useState<NumIn>(initial?.monthlyContributionCents !== undefined ? initial.monthlyContributionCents / 100 : "");
  const [valueDate, setValueDate] = useState(initial?.valueDate ?? today);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(initial?.taxRegime ?? "nezadane");
  const [err, setErr] = useState<string | null>(null);
  const balance = (BALANCE_INVESTMENT_KINDS as readonly string[]).includes(kind);
  const code = balance ? "EUR" : currency.trim().toUpperCase();
  const isEur = code === "EUR";

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    // Účet (stav účtu): počet kusov je 1 a cena je stav účtu.
    const q = balance ? 1 : asNum(quantity);
    if (Number.isNaN(q) || !(q > 0)) return setErr("Vyplň počet kusov (väčší ako 0).");
    const price = asNum(unitPrice);
    if (Number.isNaN(price) || price < 0) return setErr(balance ? "Vyplň aktuálny stav účtu (0 alebo viac)." : "Vyplň cenu za kus (0 alebo viac).");
    if (!/^[A-Z]{3}$/.test(code)) return setErr("Mena musí byť trojpísmenový kód, napr. EUR alebo USD.");
    const rate = isEur ? 1 : asNum(fx);
    if (Number.isNaN(rate) || !(rate > 0)) return setErr("Vyplň kurz k euru (väčší ako 0).");
    const vklad = balance && contribution !== "" ? asNum(contribution) : 0;
    if (Number.isNaN(vklad) || vklad < 0) return setErr("Mesačný vklad musí byť číslo 0 alebo viac.");
    const dateErr = checkDate(valueDate, today, "dátum ocenenia");
    if (dateErr.length) return setErr(dateErr[0]);
    const now = new Date().toISOString();
    const position: Position = {
      id: initial?.id ?? uid(),
      name: trimmed,
      kind,
      quantity: q,
      unitPrice: price,
      currency: code,
      fxToEur: rate,
      valueDate,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(balance && vklad > 0 ? { monthlyContributionCents: cents(vklad) } : {}),
      taxRegime,
    };
    try {
      await repo.savePosition(position);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť položku" : "Nová položka"}</h4>
      <Field label={balance ? "Názov účtu" : "Názov alebo ticker"} value={name} type="text" onChange={setName} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Druh
        <select value={kind} onChange={(e) => setKind(e.target.value as InvestmentKind)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {INVESTMENT_KINDS.map((k) => (
            <option key={k} value={k}>{INVESTMENT_KIND_LABEL[k]}</option>
          ))}
        </select>
      </label>
      {balance ? (
        <>
          <Field label="Aktuálny stav účtu (€)" value={unitPrice} onChange={setUnitPrice} />
          <Field label="Mesačný vklad (€, nepovinné)" value={contribution} onChange={setContribution} hint="len na zobrazenie; sporenie sa mení pri vyhodnotení" />
        </>
      ) : (
        <>
          <Field label="Počet kusov" value={quantity} step={0.0001} onChange={setQuantity} />
          <Field label="Cena za kus (v mene položky)" value={unitPrice} step={0.0001} onChange={setUnitPrice} />
          <Field label="Mena (napr. EUR, USD)" value={currency} type="text" onChange={setCurrency} />
          {!isEur && <Field label="Kurz: koľko € za 1 jednotku meny" value={fx} step={0.0001} onChange={setFx} hint="zadaj kurz v deň ocenenia" />}
        </>
      )}
      <Field label="Dátum ocenenia (RRRR-MM-DD)" value={valueDate} type="text" onChange={setValueDate} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Daňový režim (zatiaľ bez výpočtu, FR-24)
        <select aria-label="Daňový režim investície" value={taxRegime} onChange={(e) => setTaxRegime(e.target.value as TaxRegime)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {TAX_REGIMES.map((r) => <option key={r} value={r}>{TAX_CATALOG[r].label}</option>)}
        </select>
      </label>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť položku</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
const LIABILITY_KIND_LABEL: Record<LiabilityKind, string> = {
  uver: "Úver",
  kreditka: "Kreditná karta",
  leasing: "Leasing",
  ine: "Iné",
};

/** Záväzky okrem hypotéky (D-103). Hypotéka je v Majetku. */
function LiabilitySection({ repo, liabilities, today, onSaved }: { repo: Repository; liabilities: Liability[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<Liability | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const totals = liabilitiesTotals(liabilities);

  const remove = async (id: string) => {
    try {
      await repo.deleteLiability(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Hypotéku evidujte v sekcii Majetok. Tu sú ostatné dlhy: úver, kreditná karta, leasing.</p>
      {liabilities.length === 0 && editing === null && <p>Zatiaľ nie je zapísaný žiadny záväzok.</p>}
      {liabilities.length > 0 && (
        <p style={{ fontSize: "1.05rem" }}>
          Dlh spolu: <strong>{eur(totals.debtCents)}</strong>. Mesačne odchádza: <strong>{eur(totals.monthlyPaymentCents)}</strong>, z toho úrok {eur(totals.monthlyInterestCents)}.
        </p>
      )}
      {liabilities.map((l) => (
        <div key={l.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{l.name}</strong> · {LIABILITY_KIND_LABEL[l.kind]}</p>
          <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", margin: "8px 0", fontSize: "0.95rem" }}>
            <dt>Zostatok</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(l.balanceCents)}</dd>
            <dt>Úroková sadzba</dt><dd style={{ margin: 0, textAlign: "right" }}>{String(Number((l.rate * 100).toFixed(4)))} % p. a.</dd>
            <dt>Splátka mesačne</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(l.monthlyPaymentCents)}</dd>
            <dt>Úrok za mesiac</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(liabilityInterestCents(l))}</dd>
          </dl>
          {l.endDate && <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Koniec: {l.endDate}</p>}
          {confirmId === l.id ? (
            <div>
              <p>Naozaj zmazať tento záväzok?</p>
              <button onClick={() => remove(l.id)} style={btn}>Potvrdiť zmazanie</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <div>
              <button onClick={() => { setEditing(l); setErr(null); }} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(l.id)} style={btn}>Zmazať</button>
            </div>
          )}
        </div>
      ))}
      {editing !== null ? (
        <LiabilityForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btn}>Pridať záväzok</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

function LiabilityForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: Liability | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<LiabilityKind>(initial?.kind ?? "uver");
  const [balance, setBalance] = useState<NumIn>(initial ? initial.balanceCents / 100 : "");
  const [rate, setRate] = useState<NumIn>(initial ? Number((initial.rate * 100).toFixed(6)) : "");
  const [payment, setPayment] = useState<NumIn>(initial ? initial.monthlyPaymentCents / 100 : "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const b = asNum(balance);
    if (Number.isNaN(b) || b < 0) return setErr("Vyplň zostatok dlhu (0 alebo viac).");
    const r = rate === "" ? 0 : asNum(rate);
    if (Number.isNaN(r) || r < 0 || r >= 100) return setErr("Úroková sadzba musí byť od 0 do menej ako 100 %.");
    const pay = payment === "" ? 0 : asNum(payment);
    if (Number.isNaN(pay) || pay < 0) return setErr("Splátka musí byť číslo 0 alebo viac.");
    if (endDate.trim() !== "") {
      // Koniec môže byť v budúcnosti, preto sa overuje len platnosť dátumu.
      const endErr = checkDate(endDate.trim(), "9999-12-31", "koniec");
      if (endErr.length) return setErr(endErr[0]);
    }
    const now = new Date().toISOString();
    const liability: Liability = {
      id: initial?.id ?? uid(),
      name: trimmed,
      kind,
      balanceCents: cents(b),
      rate: r / 100,
      monthlyPaymentCents: cents(pay),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(endDate.trim() !== "" ? { endDate: endDate.trim() } : {}),
    };
    try {
      await repo.saveLiability(liability);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť záväzok" : "Nový záväzok"}</h4>
      <Field label="Názov" value={name} type="text" onChange={setName} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Druh
        <select value={kind} onChange={(e) => setKind(e.target.value as LiabilityKind)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {LIABILITY_KINDS.map((k) => (
            <option key={k} value={k}>{LIABILITY_KIND_LABEL[k]}</option>
          ))}
        </select>
      </label>
      <Field label="Zostatok dlhu (€)" value={balance} onChange={setBalance} />
      <Field label="Úroková sadzba (% p. a.)" value={rate} step={0.01} onChange={setRate} hint="0, ak úrok nie je" />
      <Field label="Splátka mesačne (€)" value={payment} onChange={setPayment} hint="0, ak splátku nemáš" />
      <Field label="Koniec (RRRR-MM-DD, nepovinné)" value={endDate} type="text" onChange={setEndDate} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť záväzok</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

const INCOME_KIND_LABEL: Record<IncomeKind, string> = {
  mzda: "Mzda",
  socialna_davka: "Sociálna dávka",
  invalidny_dochodok: "Invalidný dôchodok",
  starobny_dochodok: "Starobný dôchodok",
  osetrovne: "Ošetrovné",
  nemocenska_davka: "Nemocenská dávka (PN)",
  ine: "Iné",
};
const INCOME_FREQUENCY_LABEL: Record<IncomeFrequency, string> = {
  mesacne: "pravidelne každý mesiac",
  nepravidelne: "nepravidelne",
};

/** Pravidelné príjmy (D-102): len zobrazenie. Sporenie m sa mení až podľa zostatku pri vyhodnotení. */
function IncomeSection({ repo, incomes, today, onSaved }: { repo: Repository; incomes: RegularIncome[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<RegularIncome | "new" | null>(null);
  const [pendingFeed, setPendingFeed] = useState<ParsedFeed | null>(null);
  const [feedErr, setFeedErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      await repo.deleteIncome(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  // Súbor od integračnej služby (D-112): číta sa len lokálne, bez sieťového volania. Nič sa nezapíše bez potvrdenia.
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setPendingFeed(null);
    setFeedErr(null);
    if (!file) return;
    if (file.size > FEED_MAX_BYTES) return setFeedErr("Súbor je väčší ako 1 MB. Nič sa nenačítalo.");
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      return setFeedErr("Súbor nie je platný JSON. Nič sa nezmenilo.");
    }
    const check = parseFeed(json);
    if (!check.ok) return setFeedErr(`Súbor nie je v poriadku: ${check.errors.join("; ")}. Nič sa nezmenilo.`);
    setPendingFeed(check.feed);
  };

  const confirmFeed = async () => {
    if (!pendingFeed) return;
    try {
      await repo.replaceIncomesFromSource(pendingFeed.source, pendingFeed.items);
      setPendingFeed(null);
      onSaved();
    } catch {
      setFeedErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Tu len vidíš, koľko pravidelne prichádza. Sporenie sa mení až podľa zostatku na konci mesiaca, pri vyhodnotení. Nájom z nehnuteľnosti eviduj v Majetku, aby sa nerátal dvakrát.
      </p>
      <div style={{ border: "1px dashed var(--border-dashed)", padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: "0.95rem" }}>Načítať údaje zo súboru integračnej služby</span>
          <input type="file" accept="application/json,.json" aria-label="Súbor od integračnej služby" onChange={onFile} style={{ marginTop: 6 }} />
        </label>
        {feedErr && <p style={{ color: "var(--danger)" }}>{feedErr}</p>}
        {pendingFeed && (
          <div style={{ marginTop: 8 }}>
            <p>
              Zdroj: <strong>{pendingFeed.source}</strong>, získané {pendingFeed.fetchedAt.slice(0, 10)}. Položiek: {pendingFeed.items.length}.
              Nahradia predchádzajúce položky tohto zdroja.
            </p>
            <button onClick={confirmFeed} style={btn}>Importovať</button>{" "}
            <button onClick={() => setPendingFeed(null)} style={btn}>Zrušiť</button>
          </div>
        )}
      </div>
      {incomes.length === 0 && editing === null && <p>Zatiaľ nie je zapísaný žiadny pravidelný príjem.</p>}
      {incomes.length > 0 && (
        <p style={{ fontSize: "1.05rem" }}>Platné pravidelné príjmy za mesiac: <strong>{eur(monthlyIncomeCents(incomes, today))}</strong></p>
      )}
      {irregularIncomes(incomes).length > 0 && (
        <p style={{ color: "var(--muted)" }}>Nepravidelné príjmy (do mesačného súčtu sa nerátajú): {eur(irregularIncomes(incomes).reduce((sum, i) => sum + i.amountCents, 0))}</p>
      )}
      {incomes.map((i) => {
        const active = isIncomeActive(i, today);
        return (
          <div key={i.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
            <p style={{ margin: 0 }}>
              <strong>{i.name}</strong> · {INCOME_KIND_LABEL[i.kind]}{" "}
              {!active && <span style={{ color: "var(--muted)" }}>(neplatí dnes)</span>}
            </p>
            <p style={{ margin: "4px 0" }}>
              {eur(i.amountCents)}{i.frequency === "mesacne" ? " mesačne" : " (jednorazovo)"}
              {i.dayOfMonth !== undefined ? `, zvyčajne ${i.dayOfMonth}. v mesiaci` : ""}
            </p>
            {i.source && <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Zdroj: {i.source}, získané {(i.fetchedAt ?? "").slice(0, 10)}</p>}
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              {INCOME_FREQUENCY_LABEL[i.frequency]}; od {i.startDate}{i.endDate ? `, do ${i.endDate}` : i.frequency === "mesacne" ? ", bez konca" : ""}
            </p>
            {confirmId === i.id ? (
              <div>
                <p>Naozaj zmazať tento príjem?</p>
                <button onClick={() => remove(i.id)} style={btn}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
              </div>
            ) : (
              <div>
                <button onClick={() => { setEditing(i); setErr(null); }} style={btn}>Upraviť</button>{" "}
                <button onClick={() => setConfirmId(i.id)} style={btn}>Zmazať</button>
              </div>
            )}
          </div>
        );
      })}
      {editing !== null ? (
        <IncomeForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btn}>Pridať pravidelný príjem</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

function IncomeForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: RegularIncome | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<IncomeKind>(initial?.kind ?? "mzda");
  const [frequency, setFrequency] = useState<IncomeFrequency>(initial?.frequency ?? "mesacne");
  const [amount, setAmount] = useState<NumIn>(initial ? initial.amountCents / 100 : "");
  const [day, setDay] = useState<NumIn>(initial?.dayOfMonth ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const a = asNum(amount);
    if (Number.isNaN(a) || !(a > 0)) return setErr("Vyplň mesačnú sumu (väčšiu ako 0).");
    const d = day === "" ? undefined : asNum(day);
    if (d !== undefined && (Number.isNaN(d) || !Number.isInteger(d) || d < 1 || d > 31)) return setErr("Deň v mesiaci musí byť od 1 do 31.");
    const startErr = checkDate(startDate, "9999-12-31", "začiatok");
    if (startErr.length) return setErr(startErr[0]);
    if (endDate.trim() !== "") {
      const endErr = checkDate(endDate.trim(), "9999-12-31", "koniec");
      if (endErr.length) return setErr(endErr[0]);
      if (endDate.trim() < startDate) return setErr("Koniec nesmie byť pred začiatkom.");
    }
    const now = new Date().toISOString();
    const income: RegularIncome = {
      id: initial?.id ?? uid(),
      name: trimmed,
      kind,
      frequency,
      amountCents: cents(a),
      startDate,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(d !== undefined && frequency === "mesacne" ? { dayOfMonth: d } : {}),
      ...(endDate.trim() !== "" ? { endDate: endDate.trim() } : {}),
    };
    try {
      await repo.saveIncome(income);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť príjem" : "Nový pravidelný príjem"}</h4>
      <Field label="Názov (napr. mzda)" value={name} type="text" onChange={setName} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Druh
        <select value={kind} onChange={(e) => setKind(e.target.value as IncomeKind)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {INCOME_KINDS.map((k) => <option key={k} value={k}>{INCOME_KIND_LABEL[k]}</option>)}
        </select>
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Frekvencia
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as IncomeFrequency)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {INCOME_FREQUENCIES.map((f) => <option key={f} value={f}>{INCOME_FREQUENCY_LABEL[f]}</option>)}
        </select>
      </label>
      <Field label={frequency === "mesacne" ? "Suma mesačne (€)" : "Suma (€)"} value={amount} onChange={setAmount} />
      {frequency === "mesacne" && <Field label="Deň v mesiaci (nepovinné)" value={day} onChange={setDay} hint="len na orientáciu" />}
      <Field label={frequency === "mesacne" ? "Od (RRRR-MM-DD)" : "Dátum (RRRR-MM-DD)"} value={startDate} type="text" onChange={setStartDate} />
      {frequency === "mesacne" && <Field label="Do (RRRR-MM-DD, nepovinné)" value={endDate} type="text" onChange={setEndDate} hint="bez hodnoty príjem trvá" />}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť príjem</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

/** Rozpočet kategórií (D-106): mesačný limit a čo sa za aktuálny mesiac minulo. Prázdny limit = bez rozpočtu. */
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
            Od {e.startDate}{e.endDate ? `, do ${e.endDate}` : ""}{isRecurringActive(e, today) ? "" : " · dnes neplatí"}
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
      <Field label="Od (RRRR-MM-DD)" value={startDate} type="text" onChange={setStartDate} />
      <Field label="Do (RRRR-MM-DD, nepovinné)" value={endDate} type="text" onChange={setEndDate} hint="bez hodnoty trvá" />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť výdavok</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

/** Daňový rámec (FR-24, FR-25, D-104): režimy a stav overenia. Čísla po dani sa nezobrazia, kým nie sú pravidlá overené. */
function TaxSection({ positions }: { positions: Position[] }) {
  const lines = taxScenario(positions);
  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Hlavný výpočet ostáva nominálny (D-077). Daňový scenár je samostatný a zatiaľ nemá čísla po dani: pravidlá ešte nie sú overené (D-104).</p>
      {lines.map((l) => (
        <div key={l.regime} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{l.label}</strong></p>
          <p style={{ margin: "4px 0" }}>Hodnota investícií v režime: {eur(l.valueCents)}</p>
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
            {l.regime === "nezadane" ? "Zadaj daňový režim v položkách investícií." : "Po dani: čaká na overenie pravidiel."}
          </p>
          <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--muted)" }}>
            Zdroj: {TAX_CATALOG[l.regime].source ?? "nie je zadaný"} · platnosť od: {TAX_CATALOG[l.regime].validFrom ?? "nie je zadaná"} · stav: {TAX_CATALOG[l.regime].status}
          </p>
        </div>
      ))}
    </section>
  );
}

const STOCK_STATUS_TEXT: Record<string, string> = {
  prešlo: "dátum spotreby prešiel",
  blizi_sa: "dátum spotreby sa blíži",
  v_poriadku: "v poriadku",
  bez_datumu: "bez dátumu spotreby",
};

/** Sklad potravín (samostatná sekcia): položky, množstvo, dátum spotreby a upozornenia. */
/** Počet dní od dneška slovami: „dnes“, „za 1 deň“, „za 3 dni“, „pred 2 dňami“. */
function dniText(n: number): string {
  if (n === 0) return "dnes";
  if (n > 0) return `za ${n} ${n === 1 ? "deň" : n < 5 ? "dni" : "dní"}`;
  return `pred ${-n} ${-n === 1 ? "dňom" : "dňami"}`;
}

function StockSection({ repo, items, recipes, today, onSaved }: { repo: Repository; items: StockItem[]; recipes: Recipe[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<StockItem | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const warnings = expiringItems(items, today);

  const remove = async (id: string) => {
    try {
      await repo.deleteStockItem(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Potraviny doma a ich dátum spotreby. Množstvo a dátum zadávate ručne.</p>
      {warnings.length > 0 && (
        <div style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6, marginBottom: 12 }}>
          <strong>Pozor:</strong>
          <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
            {warnings.map((w) => <li key={w.id}>{w.name}: {STOCK_STATUS_TEXT[stockStatus(w, today)]} ({w.expiryDate})</li>)}
          </ul>
        </div>
      )}
      {items.length === 0 && editing === null && <p>Zatiaľ nie sú zapísané položky skladu.</p>}
      {items.map((i) => (
        <div key={i.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{i.name}</strong></p>
          <p style={{ margin: "4px 0" }}>{i.quantity} {i.unit}</p>
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
            {i.expiryDate ? `Spotrebovať do ${i.expiryDate} (${dniText(daysUntil(today, i.expiryDate))})` : "Bez dátumu spotreby"}
            {i.expiryDate ? <>{" · "}{STOCK_STATUS_TEXT[stockStatus(i, today)]}</> : null}
          </p>
          {confirmId === i.id ? (
            <div>
              <p>Naozaj zmazať položku „{i.name}“?</p>
              <button onClick={() => remove(i.id)} style={btn}>Zmazať</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => setEditing(i)} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(i.id)} style={btn}>Zmazať</button>
            </>
          )}
        </div>
      ))}
      {editing ? (
        <StockForm
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btn}>Pridať položku skladu</button>
      )}
      <RecipesBlock repo={repo} recipes={recipes} stock={items} onSaved={onSaved} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

function RecipesBlock({ repo, recipes, stock, onSaved }: { repo: Repository; recipes: Recipe[]; stock: StockItem[]; onSaved: () => void }) {
  const [editing, setEditing] = useState<Recipe | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Uvarenie odpočíta suroviny len vtedy, keď všetky stačia (D-127).
  const cook = async (r: Recipe) => {
    const res = cookRecipe(r, stock, new Date().toISOString());
    if (!res.ok) {
      setResult({ ok: false, text: `Recept „${r.name}“ sa neodpočítal, sklad ostáva bez zmeny. ${res.problems.join("; ")}.` });
      return;
    }
    try {
      await repo.applyStockChanges(res.changed);
      setResult({ ok: true, text: `Uvarené: „${r.name}“. Suroviny sú odpočítané zo skladu.` });
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const remove = async (id: string) => {
    try {
      await repo.deleteRecipe(id);
      setConfirmId(null);
      setResult(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ fontSize: "1rem" }}>Recepty</h4>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Pri uvarení sa suroviny odpočítajú zo skladu. Ak niečo chýba, nič sa neodpočíta.</p>
      {recipes.length === 0 && editing === null && <p>Zatiaľ nie sú zapísané recepty.</p>}
      {recipes.map((r) => (
        <div key={r.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{r.name}</strong></p>
          <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "0.9rem" }}>
            {r.ingredients.map((ing: RecipeIngredient) => {
              const item = stock.find((s) => s.id === ing.stockItemId);
              return <li key={ing.stockItemId}>{item ? `${item.name}: ${ing.quantity} ${item.unit}` : "surovina už nie je v sklade"}</li>;
            })}
          </ul>
          {confirmId === r.id ? (
            <div>
              <p>Naozaj zmazať recept „{r.name}“?</p>
              <button onClick={() => remove(r.id)} style={btn}>Zmazať</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => cook(r)} style={btn}>Uvariť</button>{" "}
              <button onClick={() => setEditing(r)} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(r.id)} style={btn}>Zmazať</button>
            </>
          )}
        </div>
      ))}
      {result && <p style={{ color: result.ok ? "var(--ok)" : "var(--danger)" }}>{result.text}</p>}
      {editing ? (
        <RecipeForm
          repo={repo}
          initial={editing === "new" ? null : editing}
          stock={stock}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btn}>Pridať recept</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}

function RecipeForm({ repo, initial, stock, onDone, onCancel }: { repo: Repository; initial: Recipe | null; stock: StockItem[]; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [rows, setRows] = useState<{ stockItemId: string; quantity: NumIn }[]>(
    initial ? initial.ingredients.map((i) => ({ stockItemId: i.stockItemId, quantity: i.quantity })) : [{ stockItemId: "", quantity: "" }],
  );
  const [err, setErr] = useState<string | null>(null);

  const updateRow = (n: number, patch: Partial<{ stockItemId: string; quantity: NumIn }>) =>
    setRows((prev) => prev.map((r, i) => (i === n ? { ...r, ...patch } : r)));

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov receptu.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const ingredients: RecipeIngredient[] = [];
    for (const row of rows) {
      const q = asNum(row.quantity);
      if (row.stockItemId === "" || Number.isNaN(q) || !(q > 0)) return setErr("Každá surovina potrebuje položku skladu a množstvo väčšie ako 0.");
      if (ingredients.some((i) => i.stockItemId === row.stockItemId)) return setErr("Rovnaká surovina je v recepte dvakrát.");
      ingredients.push({ stockItemId: row.stockItemId, quantity: q });
    }
    const now = new Date().toISOString();
    try {
      await repo.saveRecipe({ id: initial?.id ?? uid(), name: trimmed, ingredients, createdAt: initial?.createdAt ?? now, updatedAt: now });
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť recept" : "Nový recept"}</h4>
      {stock.length === 0 && <p style={{ color: "var(--muted)" }}>Najprv pridajte položky do skladu.</p>}
      <Field label="Názov receptu" value={name} type="text" onChange={setName} />
      {rows.map((row, n) => (
        <div key={n} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 8 }}>
          <label style={{ flex: "2 1 160px" }}>
            <span style={{ display: "block", fontSize: "0.9rem" }}>Surovina</span>
            <select aria-label="Surovina" value={row.stockItemId} onChange={(e) => updateRow(n, { stockItemId: e.target.value })} style={inp}>
              <option value="">vyberte</option>
              {stock.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
            </select>
          </label>
          <label style={{ flex: "1 1 90px" }}>
            <span style={{ display: "block", fontSize: "0.9rem" }}>Množstvo</span>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              aria-label="Množstvo suroviny"
              value={row.quantity}
              onChange={(e) => updateRow(n, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
              style={inp}
            />
          </label>
          <button onClick={() => setRows((prev) => (prev.length === 1 ? [{ stockItemId: "", quantity: "" }] : prev.filter((_, i) => i !== n)))} style={btn}>Odobrať</button>
        </div>
      ))}
      <button onClick={() => setRows((prev) => [...prev, { stockItemId: "", quantity: "" }])} style={btn} disabled={stock.length === 0}>Pridať surovinu</button>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <div>
        <button onClick={save} style={btn}>Uložiť recept</button>{" "}
        <button onClick={onCancel} style={btn}>Zrušiť</button>
      </div>
    </div>
  );
}

function StockForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: StockItem | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [quantity, setQuantity] = useState<NumIn>(initial?.quantity ?? "");
  const [unit, setUnit] = useState<StockUnit>(initial?.unit ?? "ks");
  const [expiry, setExpiry] = useState(initial ? initial.expiryDate ?? "" : today);
  const [err, setErr] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);

  // Skener: fotka obalu, offline rozpoznanie; názov a dátum sa len navrhnú, potvrdí ich používateľ.
  const onPhoto = async (file: File) => {
    setScanMsg("Rozpoznávam text z fotky…");
    try {
      const { recognizeImage } = await import("../app/ocr");
      const text = await recognizeImage(file);
      setOcrText(text);
      const date = findExpiryDate(text);
      const product = findProductName(text);
      if (product && name.trim() === "") setName(product);
      if (date) setExpiry(date);
      setScanMsg(date || product
        ? `Navrhnuté: ${product ?? "názov nenájdený"}, dátum spotreby ${date ?? "nenájdený"}. Skontrolujte údaje a množstvo doplňte ručne.`
        : "Text sa nepodarilo rozpoznať. Zadajte údaje ručne.");
    } catch {
      setScanMsg("Skener sa nepodarilo spustiť. Zadajte údaje ručne.");
    }
  };

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const q = asNum(quantity);
    if (Number.isNaN(q) || q < 0) return setErr("Vyplň množstvo (0 alebo viac).");
    if (expiry.trim() !== "") {
      const dErr = checkDate(expiry.trim(), "9999-12-31", "dátum spotreby");
      if (dErr.length) return setErr(dErr[0]);
    }
    const now = new Date().toISOString();
    const item: StockItem = {
      id: initial?.id ?? uid(),
      name: trimmed,
      quantity: q,
      unit,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(expiry.trim() !== "" ? { expiryDate: expiry.trim() } : {}),
    };
    try {
      await repo.saveStockItem(item);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť položku skladu" : "Nová položka skladu"}</h4>
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>Fotka obalu (navrhne názov a dátum spotreby)</span>
        <input type="file" accept="image/*" capture="environment" aria-label="Fotka obalu" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPhoto(f); }} />
      </label>
      {scanMsg && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{scanMsg}</p>}
      {ocrText !== null && (
        <details style={{ fontSize: "0.9rem", marginBottom: 8 }}>
          <summary>Rozpoznaný text z fotky</summary>
          <pre style={{ whiteSpace: "pre-wrap", background: "var(--surface-2)", padding: 8, borderRadius: 4 }}>{ocrText.trim() || "(žiadny text)"}</pre>
        </details>
      )}
      <Field label="Názov (napr. mlieko)" value={name} type="text" onChange={setName} />
      <Field label="Množstvo" value={quantity} step={0.01} onChange={setQuantity} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Jednotka
        <select aria-label="Jednotka" value={unit} onChange={(e) => setUnit(e.target.value as StockUnit)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {STOCK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
      <Field label="Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)" value={expiry} type="date" onChange={setExpiry} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť položku</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

function BudgetSection({ repo, budgets, transactions, recurring, today, onSaved }: { repo: Repository; budgets: Budget[]; transactions: Transaction[]; recurring: RecurringExpense[]; today: string; onSaved: () => void }) {
  const [limits, setLimits] = useState<Record<string, NumIn>>(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map((c) => {
      const b = budgets.find((x) => x.category === c);
      return [c, b ? b.limitCents / 100 : ""];
    })),
  );
  const [err, setErr] = useState<string | null>(null);
  const unassigned = spentInMonthCents(transactions, null, today);

  const save = async () => {
    try {
      for (const c of BUDGET_CATEGORIES) {
        const v = limits[c];
        const existing = budgets.find((b) => b.category === c);
        if (v === "" || v === undefined) {
          if (existing) await repo.deleteBudget(c);
          continue;
        }
        const n = asNum(v);
        if (Number.isNaN(n) || n <= 0) return setErr(`Limit pre kategóriu „${c}“ musí byť kladný, alebo prázdny.`);
        await repo.saveBudget({ id: c, category: c, limitCents: cents(n), updatedAt: new Date().toISOString() });
      }
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const recurringByCat = monthlyRecurringByCategory(recurring, today);
  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Mesačný limit pre kategóriu. Čo je v kategórii zaradené, vidíš v zázname výdavku. Prázdny limit znamená bez rozpočtu. Zoznam kategórií je návrh.
      </p>
      {BUDGET_CATEGORIES.map((c) => {
        const b = budgets.find((x) => x.category === c);
        // Pravidelné výdavky (D-124) sa rátajú do minutého za mesiac spolu s transakciami v kategórii.
        const rec = recurringByCat[c] ?? 0;
        const spent = spentInMonthCents(transactions, c, today) + rec;
        const st = budgetStatus(b, spent);
        const recText = rec > 0 ? ` (z toho pravidelné ${eur(rec)})` : "";
        const hint = st
          ? `minuté tento mesiac ${eur(spent)}${recText}; ${st.over ? `prekročené o ${eur(st.remainingCents)}` : `zostáva ${eur(st.remainingCents)}`}`
          : `minuté tento mesiac ${eur(spent)}${recText}`;
        return (
          <Field
            key={c}
            label={`${c}: limit (€)`}
            value={limits[c] ?? ""}
            onChange={(v) => setLimits({ ...limits, [c]: v })}
            hint={hint}
          />
        );
      })}
      <p style={{ color: "var(--muted)" }}>Výdavky bez kategórie tento mesiac: {eur(unassigned)}</p>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť rozpočet</button>
    </section>
  );
}

/** Odomknutie PIN-om (D-119). Údaje sa nezobrazia, kým PIN nie je správny. */
const EMPTY_DATA: AppData = {
  settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [],
  incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [],
};

/** Odomknutie PIN-om. Zabudnutý PIN = vymazanie dát v zariadení po dvojitom potvrdení (D-135). */
function LockScreen({ repo, onUnlock, onWiped }: { repo: Repository; onUnlock: () => void; onWiped: () => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const unlock = async () => {
    const record = await repo.getMeta("pin");
    if (record && (await checkPin(pin, record))) return onUnlock();
    setErr("Nesprávny PIN. Skús znova.");
    setPin("");
  };
  const wipe = async () => {
    try {
      await repo.replaceAll(EMPTY_DATA);
      await repo.setMeta("pin", "");
      onWiped();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };
  return (
    <section aria-label="Odomknutie">
      <h2 style={{ fontSize: "1.1rem" }}>Zadaj PIN</h2>
      <p style={{ color: "var(--muted)" }}>Údaje sú v tomto telefóne. Ak PIN zabudneš, môžeš údaje v zariadení vymazať a obnoviť ich zo zálohy.</p>
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>PIN</span>
        <input type="password" inputMode="numeric" aria-label="PIN" value={pin} onChange={(e) => setPin(e.target.value)} style={inp} />
      </label>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={unlock} style={btn}>Odomknúť</button>
      {!forgot ? (
        <p><button onClick={() => setForgot(true)} style={{ ...btn, marginTop: 16 }}>Zabudol som PIN</button></p>
      ) : (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginTop: 12 }}>
          <p><strong>Údaje v tomto zariadení sa vymažú a PIN sa zruší.</strong> Bez zálohy sa údaje nedajú obnoviť. Ak zálohu máš, po vymazaní ju môžeš importovať v sekcii Záloha.</p>
          <label style={{ display: "block", margin: "8px 0" }}>
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />{" "}
            Rozumiem, že údaje v tomto zariadení sa vymažú
          </label>
          <button onClick={wipe} disabled={!understood} style={btn}>Vymazať údaje a zrušiť PIN</button>{" "}
          <button onClick={() => { setForgot(false); setUnderstood(false); }} style={btn}>Zrušiť</button>
        </div>
      )}
    </section>
  );
}

/** Zapnutie, vypnutie a zamknutie PIN-u v Nastaveniach (D-119). */
function PinSection({ repo, pinSet, onChanged, onLock }: { repo: Repository; pinSet: boolean; onChanged: (on: boolean) => void; onLock: () => void }) {
  const [newPin, setNewPin] = useState("");
  const [repeat, setRepeat] = useState("");
  const [current, setCurrent] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const enable = async () => {
    if (!isValidPin(newPin)) return setErr("PIN musí mať 4 až 6 číslic.");
    if (newPin !== repeat) return setErr("PIN sa nezhoduje so zopakovaním.");
    try {
      await repo.setMeta("pin", await makePinRecord(newPin));
      setNewPin("");
      setRepeat("");
      setErr(null);
      onChanged(true);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const disable = async () => {
    const record = await repo.getMeta("pin");
    if (!record || !(await checkPin(current, record))) return setErr("Aktuálny PIN nesedí.");
    try {
      await repo.setMeta("pin", "");
      setCurrent("");
      setErr(null);
      onChanged(false);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: "1rem" }}>PIN</h3>
      {pinSet ? (
        <>
          <p style={{ color: "var(--muted)" }}>PIN je zapnutý. Appka sa pri otvorení najprv opýta na PIN. PIN chráni prístup v tomto telefóne; údaje nie sú zašifrované.</p>
          <button onClick={onLock} style={btn}>Zamknúť teraz</button>
          <Field label="Aktuálny PIN (na vypnutie)" value={current} type="password" inputMode="numeric" onChange={setCurrent} />
          <button onClick={disable} style={btn}>Vypnúť PIN</button>
        </>
      ) : (
        <>
          <p style={{ color: "var(--muted)" }}>PIN je nepovinný. Údaje nie sú zašifrované; PIN bráni len otvoreniu appky.</p>
          <Field label="Nový PIN (4 až 6 číslic)" value={newPin} type="password" inputMode="numeric" onChange={setNewPin} />
          <Field label="Zopakuj PIN" value={repeat} type="password" inputMode="numeric" onChange={setRepeat} />
          <button onClick={enable} style={btn}>Zapnúť PIN</button>
        </>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
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
  const eurs = (c: number) => `${(c / 100).toLocaleString("sk-SK")} €`;
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
        hint={v.expenses === "" ? "3 mesiace výdavkov; doplní sa po zadaní ročných výdavkov" : `východisková hodnota ${eurs(rec.reserveCents)} (3 mesiace výdavkov)`} changed={differs(v.reserve, rec.reserveCents / 100)} onReset={() => setV({ ...v, reserve: rec.reserveCents / 100 })} />
      <Field label="Prah výdavkov (€)" value={v.threshold} onChange={(x) => setV({ ...v, threshold: x })}
        hint={`východisková hodnota ${eurs(rec.thresholdCents)}`} changed={differs(v.threshold, rec.thresholdCents / 100)} onReset={() => setV({ ...v, threshold: rec.thresholdCents / 100 })} />
      <Field label="Poplatky p. a. (%)" value={v.fees} step={0.01} onChange={(x) => setV({ ...v, fees: x })}
        hint="predvolene 0 %; zadaj, ak ti banka alebo poskytovateľ účtuje poplatky" changed={differs(v.fees, 0)} onReset={() => setV({ ...v, fees: 0 })} />
      <Field label="Mesačné sporenie do investícií (€), prázdne = odvodené" value={v.savingInv} onChange={(x) => setV({ ...v, savingInv: x })}
        hint={`prázdne = počíta sa zo zapísaných transakcií: ${eurs(derived.inv)} mesačne`} changed={differs(v.savingInv, null)} onReset={() => setV({ ...v, savingInv: "" })} />
      <Field label="Mesačné sporenie do hotovosti (€), prázdne = odvodené" value={v.savingCash} onChange={(x) => setV({ ...v, savingCash: x })}
        hint={`prázdne = počíta sa zo zapísaných transakcií: ${eurs(derived.cash)} mesačne`} changed={differs(v.savingCash, null)} onReset={() => setV({ ...v, savingCash: "" })} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť nastavenia</button>
    </section>
  );
}

/** derivedInvCents: súčet položiek v sekcii Investície; ak existuje, suma sa odvodzuje, nie zadáva (D-101). */
function SnapshotSection({ repo, latest, capital, derivedInvCents, snapshots, onSaved }: { repo: Repository; latest: Snapshot | null; capital: Capital; derivedInvCents: number | null; snapshots: Snapshot[]; onSaved: () => void }) {
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
        {latest ? `Posledné vyhodnotenie: ${latest.date}.` : "Zatiaľ nebolo vyhodnotenie. Dátum cieľa sa zobrazí až po ňom."}
      </p>
      <p style={{ color: "var(--muted)" }}>Mesačné vyhodnotenie sa vytvára automaticky. Tu ho zadáš len na opravu. Dátum cieľa sa mení až pri vyhodnotení.</p>
      {editingDate && <p style={{ background: "var(--banner)", padding: 8, borderRadius: 6 }}>Upravuješ vyhodnotenie z {editingDate}. Uložením sa prepíše.</p>}
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
          <p>Vyhodnotenie s dátumom {date} už existuje. Prepísať ho? História sa zachová v zálohe.</p>
          <button onClick={() => write(confirmId)} style={btn}>Prepísať vyhodnotenie</button>{" "}
          <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
        </div>
      )}
      <button onClick={save} style={btn}>Uložiť vyhodnotenie</button>

      <h3 style={{ fontSize: "1rem", marginTop: 24 }}>Uložené vyhodnotenia</h3>
      {snapshots.length === 0 && <p>Zatiaľ nie sú uložené vyhodnotenia.</p>}
      {[...snapshots].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
        <div key={s.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{s.date}</strong>{s.auto ? " · automaticky" : ""}</p>
          <p style={{ margin: "4px 0" }}>K: {eur(s.investmentsCents + s.cashCents)} (investície {eur(s.investmentsCents)}, hotovosť {eur(s.cashCents)})</p>
          {s.auto ? (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Automatické vyhodnotenie sa vytvorí znova z ručných údajov.</p>
          ) : deleteId === s.id ? (
            <div>
              <p>Naozaj zmazať vyhodnotenie z {s.date}? Ak chceš mať kópiu, najprv stiahni zálohu v sekcii Záloha.</p>
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
    try {
      await repo.deleteTransaction(id);
    } catch {
      return setErr(STORAGE_ERROR);
    }
    if (editingId === id) resetForm();
    setUndo(gone);
    onChanged();
  };

  const restore = async () => {
    if (!undo) return;
    try {
      await repo.addTransaction(undo);
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
                  <li key={i.code}>{i.name}: {i.quantity} ks, DPH {i.vatPercent} %, {eurExact(i.amountCents)}</li>
                ))}
              </ul>
              <p style={{ fontSize: "0.9rem" }}>Súčet položiek: <strong>{eurExact(itemsTotal)}</strong></p>
            </>
          )}
          {parsedItems.unparsed.length > 0 && (
            <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>Nerozpoznané riadky: {parsedItems.unparsed.length}. Opravte text alebo ho vymažte; bez toho sa výdavok neuloží.</p>
          )}
          {itemsMismatch && (
            <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>Súčet položiek sa nezhoduje so sumou výdavku {eurExact(cents(asNum(amount)))} (napr. zľava). Uložiť sa dá, ak je to v poriadku.</p>
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
          Výdavky podľa kategórie: {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([c, v]) => `${c} ${eurExact(v)}`).join(" · ")}
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
          <li key={t.id} style={{ borderBottom: "1px solid var(--border-soft)", padding: "6px 0", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>
              {t.date} · {TYPE_LABEL[t.type]} · {eur(t.amountCents)}
              {t.source ? ` (${SOURCE_LABEL[t.source]})` : ""}
              {t.type === "vydavok" && t.amountCents >= (ctx.settings?.thresholdCents ?? recommendedSettings(0).thresholdCents) ? " · nad prahom" : ""}
              {t.note ? ` · ${t.note}` : ""}
              {t.receiptId ? " · doklad" : ""}
              {t.receiptItems && t.receiptItems.length > 0 ? ` · položiek: ${t.receiptItems.length}` : ""}
            </span>
            <span style={{ display: "flex", gap: 6 }}>
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
        ))}
      </ul>
    </section>
  );
}

/** Stiahne zálohu aktuálnych dát a vráti čas exportu (FR-17). */
/**
 * Export zálohy. Ak prehliadač dokáže zdieľať súbory (iPhone), ponúkne zdieľací list, kde sa dá zvoliť
 * „Uložiť do Súborov“. Inak alebo pri chybe zdieľania súbor stiahne. Zrušenie zdieľania nič neuloží.
 */
async function exportBackupFile(data: AppData): Promise<{ result: "shared" | "downloaded" | "cancelled"; exportedAt: string }> {
  const nowIso = new Date().toISOString();
  const name = `financna-sloboda-zaloha-${todayIso()}.json`;
  const text = JSON.stringify(buildBackup(data, nowIso), null, 2);
  const file = new File([text], name, { type: "application/json" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return { result: "shared", exportedAt: nowIso };
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return { result: "cancelled", exportedAt: nowIso };
      // inak spadneme na stiahnutie
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { result: "downloaded", exportedAt: nowIso };
}

/** Stručný obsah dát pre porovnanie pred importom (D-134). */
function summarizeData(d: AppData): string {
  return [
    `transakcií ${d.transactions.length}`,
    `vyhodnotení ${d.snapshots.length}`,
    `majetok ${d.properties.length + d.assets.length}`,
    `investície ${d.investments.length}`,
    `záväzky ${d.liabilities.length}`,
    `príjmy ${d.incomes.length}`,
    `rozpočty ${d.budgets.length}`,
    `pravidelné výdavky ${d.recurringExpenses.length}`,
    `položky skladu ${d.stockItems.length}`,
    `recepty ${d.recipes.length}`,
    `nastavenia ${d.settings ? "áno" : "nie"}`,
  ].join(", ");
}

/** Preloží technické chyby z overenia zálohy do slovenčiny (bez interných názvov polí). */
function plainBackupError(e: string): string {
  const field = /^záloha: (\w+) musí byť pole$/.exec(e);
  if (field) return `Súbor nemá správne pole „${field[1]}“.`;
  return e;
}

function lastExportText(iso: string, today: string): string {
  const days = daysSince(iso, today);
  const date = iso.slice(0, 10);
  if (days <= 0) return `${date} (dnes)`;
  if (days === 1) return `${date} (včera)`;
  return `${date} (pred ${days} dňami)`;
}

function BackupSection({ repo, data, lastExport, onChanged, onExported }: { repo: Repository; data: AppData; lastExport: string | null; onChanged: () => void; onExported: (iso: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<{ data: AppData; counts: { transactions: number; snapshots: number }; exportedAt: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [backupFirst, setBackupFirst] = useState(false);

  const exportBackup = async () => {
    const r = await exportBackupFile(data);
    if (r.result === "cancelled") return setStatus("Export bol zrušený. Záloha nie je uložená.");
    onExported(r.exportedAt);
    setStatus(r.result === "shared"
      ? "Záloha je uložená podľa tvojho výberu. Obsahuje citlivé finančné údaje vrátane čísel dokladov: neukladaj ju do verejných priečinkov."
      : "Záloha sa stiahla. Obsahuje citlivé finančné údaje vrátane čísel dokladov: neukladaj ju do verejných priečinkov.");
  };

  const onFile = async (file: File) => {
    setErrors([]);
    setPreview(null);
    setStatus(null);
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      setErrors(["Súbor nie je platný JSON. Nič sa nezmenilo."]);
      return;
    }
    const res = parseBackup(json, todayIso());
    if (!res.ok) {
      setErrors([...res.errors.map(plainBackupError), "Nič sa nezmenilo."]);
      return;
    }
    setBackupFirst(true); // D-134: pred importom sa ponúkne uloženie aktuálnych dát
    setPreview({ data: res.data!, counts: res.counts!, exportedAt: (json as { exportedAt: string }).exportedAt });
  };

  const confirmImport = async () => {
    if (!preview) return;
    try {
      if (backupFirst) { // D-078: záloha len na výslovné zaškrtnutie; bez uloženej zálohy sa dáta nenahradia
        const r = await exportBackupFile(data);
        if (r.result === "cancelled") return setStatus("Import zrušený: záloha nie je uložená, dáta sa nezmenili.");
        onExported(r.exportedAt);
      }
      await repo.replaceAll(preview.data);
    } catch {
      setErrors([STORAGE_ERROR]);
      return;
    }
    setPreview(null);
    setStatus("Dáta boli nahradené zálohou.");
    onChanged();
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Dáta sú len v tomto zariadení. Pravidelne si ulož zálohu. Záloha obsahuje aj čísla dokladov, preto ju chráň.</p>
      <p>Posledná záloha: <strong>{lastExport ? lastExportText(lastExport, todayIso()) : "zatiaľ žiadna"}</strong></p>
      {backupOverdue(lastExport, todayIso()) && (
        <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Záloha je staršia ako 7 dní alebo ešte nebola urobená. Odporúčame novú zálohu.</p>
      )}
      <button onClick={exportBackup} style={btn}>Exportovať zálohu</button>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Na iPhone sa otvorí zdieľací list (napr. Uložiť do Súborov), v počítači sa súbor stiahne do priečinka Stiahnuté.</p>
      <label style={{ display: "block", margin: "16px 0 8px" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>Obnovenie zo zálohy</span>
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => fileRef.current?.click()} style={btn}>Vybrať súbor zálohy</button>
        <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{fileName || "Nie je vybraný žiadny súbor"}</span>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-label="Súbor zálohy"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileName(f?.name ?? "");
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {errors.length > 0 && <ul style={{ color: "var(--danger)" }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
      {preview && (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6 }}>
          <p>Záloha z {preview.exportedAt.slice(0, 10)} obsahuje: {summarizeData(preview.data)}.</p>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Teraz v zariadení: {summarizeData(data)}.</p>
          <p><strong>Import nahradí všetky aktuálne dáta v tomto zariadení.</strong></p>
          <label style={{ display: "block", margin: "8px 0" }}>
            <input type="checkbox" checked={backupFirst} onChange={(e) => setBackupFirst(e.target.checked)} />{" "}
            Pred importom stiahnuť zálohu aktuálnych dát
          </label>
          {!backupFirst && <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>Bez zálohy sa aktuálne dáta nenávratne prepíšu.</p>}
          <button onClick={confirmImport} style={btn}>Nahradiť dáta zálohou</button>{" "}
          <button onClick={() => setPreview(null)} style={btn}>Zrušiť</button>
        </div>
      )}
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </section>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: "8px", fontSize: "1rem", boxSizing: "border-box" };
const btn: React.CSSProperties = { padding: "8px 14px", fontSize: "1rem", marginTop: 8 };

/** Hodnota poľa sa líši od východiskovej (FR-13): tlačidlo „vrátiť“ sa ukáže len vtedy. */
function differs(value: NumIn | string, defaultValue: number | null): boolean {
  if (value === "" || Number.isNaN(value as number)) return false; // nezadané: výzva je v nápovede, nie tlačidlo
  if (defaultValue === null) return true; // prepísané pole bez východiskovej hodnoty
  return Math.abs(Number(value) - defaultValue) > 1e-9;
}

function Field(props: { label: string; value: NumIn | string; onChange: (v: any) => void; step?: number; type?: string; inputMode?: "numeric" | "text"; max?: string; hint?: string; onReset?: () => void; changed?: boolean }) {
  const textual = props.type === "text" || props.type === "date" || props.type === "password";
  return (
    <label style={{ display: "block", margin: "8px 0" }}>
      <span style={{ display: "block", fontSize: "0.9rem" }}>{props.label}</span>
      <input
        type={props.type ?? "number"}
        inputMode={props.inputMode}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => {
          if (textual) return props.onChange(e.target.value);
          props.onChange(e.target.value === "" ? "" : Number(e.target.value));
        }}
        style={inp}
      />
      {props.hint && (
        <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
          {props.hint}
          {props.onReset && props.changed && (
            <button type="button" onClick={props.onReset} style={{ ...btn, padding: "2px 8px", fontSize: "0.85rem", marginTop: 0 }}>
              Vrátiť východiskovú hodnotu
            </button>
          )}
        </span>
      )}
    </label>
  );
}

