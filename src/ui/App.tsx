import { useEffect, useMemo, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import { ASSET_KINDS, BALANCE_INVESTMENT_KINDS, BUDGET_CATEGORIES, INCOME_FREQUENCIES, INCOME_KINDS, type IncomeFrequency, type IncomeKind, INVESTMENT_KINDS, LIABILITY_KINDS, PROPERTY_MODES, SOURCES, type AppData, type Asset, type AssetKind, type Budget, type BudgetCategory, type InvestmentKind, type Liability, type LiabilityKind, type Position, type Property, type PropertyMode, type RegularIncome, type Settings, type Snapshot, type Source, type Transaction, type TransactionType } from "../storage/types";
import { checkDate } from "../storage/validate";
import { buildBackup, parseBackup } from "../storage/backup";
import { capitalWithFlags, reserveBalance } from "../app/ledger";
import { filterHistory, totalsByType } from "../app/history";
import { backupOverdue, reviewDueSoon, reviewOverdue } from "../app/reminders";
import { targetAmountCents, targetDate } from "../domain/goal";
import { formatImpact, UNREACHABLE_IMPACT_TEXT } from "../domain/impact";
import { monthlySaving } from "../domain/saving";
import { countsInCapital, monthlyCostsCents, netPropertyValueCents, splitPayment, valueIsStale } from "../domain/property";
import { investmentsTotalCents, monthlyContributionsTotalCents, positionValueCents } from "../domain/investments";
import { liabilityInterestCents, liabilitiesTotals } from "../domain/liabilities";
import { irregularIncomes, isIncomeActive, monthlyIncomeCents } from "../domain/income";
import { FEED_MAX_BYTES, parseFeed, type ParsedFeed } from "../storage/feed";
import { budgetStatus, spentInMonthCents } from "../domain/budget";
import { recommendedSettings } from "../domain/recommendations";
import { LONG_HORIZON_MONTHS, netRealReturn, nominalFromReal, RETURN_ASSUMPTIONS } from "../domain/assumptions";
import {
  impactMonthsSplit,
  monthsToTargetSplit,
  payFromCash,
  payFromInvestments,
  transferToInvestments,
  type Capital,
} from "../domain/capital";

const MONTHS = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
const cents = (x: number) => Math.round(x * 100);
const eur = (c: number) => `${(c / 100).toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €`;
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
  const n = latest && target !== null ? monthsToTargetSplit(flags.capital, mInv, mCash, realReturn, target) : null;
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
    longHorizon: n !== null && n > LONG_HORIZON_MONTHS,
  };
}

const pctText = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;

/** Dátum cieľa pre danú mieru výnosu (FR-02, FR-03). */
function scenarioText(ctx: Ctx, rate: number, capital: Capital = ctx.capital): string {
  if (!ctx.latest || ctx.target === null) return "—";
  const n = monthsToTargetSplit(capital, ctx.mInv, ctx.mCash, rate, ctx.target);
  if (n === null) return "Pri súčasnom sporení a výnose sa cieľ nedosiahne";
  if (n === 0) return "Cieľ je dosiahnutý";
  return monthYear(targetDate(ctx.latest.date, n));
}

const SKIP_FIRST_SETUP_KEY = "fs-skip-first-setup";

export function App() {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);
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
      })
      .catch((e) => setError(`Úložisko sa nepodarilo otvoriť: ${String(e)}`));
    return () => {
      alive = false;
    };
  }, []);

  const reload = async () => {
    if (repo) setData(await repo.getData());
  };

  if (isIosBrowser() && !isStandalone()) return <Shell><IosInstallGate /></Shell>;
  if (error) return <Shell><p style={{ color: "#8a0000" }}>{error}</p></Shell>;
  if (!repo || !data) return <Shell><p>Načítavam údaje…</p></Shell>;

  const ctx = makeCtx(data);
  // FR-12: prvé spustenie (prázdne nastavenia a žiadne vyhodnotenie) ide cez sprievodcu, kým ho používateľ nepreskočí.
  if (!data.settings && data.snapshots.length === 0 && !skipFirstSetup) {
    return (
      <Shell>
        <FirstSetup repo={repo} data={data} ctx={ctx} onChanged={reload} onSkip={skipFirstSetupAndRemember} />
      </Shell>
    );
  }
  return (
    <Shell nav={section}>
      {section === "prehlad" && (
        <Section id="prehlad" title="Prehľad">
          <HomeSection data={data} ctx={ctx} lastExport={lastExport} />
          <details id="navod" style={{ marginTop: 16, background: "#fff", padding: 12, borderRadius: 8 }}>
            <summary style={{ fontWeight: 600, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Návod</summary>
            <ol style={{ paddingLeft: 20 }}>
              <li><strong>Prvé nastavenie:</strong> pri prvom spustení zadaj ročné výdavky a mieru výberu. Ostatné polia majú východiskové hodnoty.</li>
              <li><strong>Vyhodnotenie:</strong> na konci mesiaca zadaj hodnotu investícií a hotovosť. Dátum cieľa sa mení len po vyhodnotení.</li>
              <li><strong>Transakcie:</strong> zapisuj sporenie, investície a výdavky. Výdavok nad prah sa zvýrazní.</li>
              <li><strong>Záloha:</strong> pravidelne exportuj zálohu. Dáta sú len v tomto zariadení; neukladaj ju do verejných priečinkov.</li>
              <li><strong>Obnova:</strong> import nahradí všetky dáta a vyžaduje potvrdenie.</li>
            </ol>
            <p style={{ fontSize: "0.9rem", color: "#555" }}>
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
          <BudgetSection key={data.budgets.map((b) => `${b.category}${b.limitCents}`).join("|")} repo={repo} budgets={data.budgets} transactions={data.transactions} today={todayIso()} onSaved={reload} />
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
      {section === "nastavenia" && (
        <Section id="nastavenia" title="Nastavenia">
          <SettingsSection repo={repo} settings={data.settings} derived={ctx.derived} onSaved={reload} />
        </Section>
      )}
      {section === "zaloha" && (
        <Section id="zaloha" title="Záloha">
          <BackupSection repo={repo} data={data} onChanged={reload} onExported={async (iso) => { await repo.setMeta("lastExportAt", iso); setLastExport(iso); }} />
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
    <div style={{ background: "#eef5f1", padding: 16, borderRadius: 8 }}>
      <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Najprv pridaj appku na plochu</h2>
      <p>Údaje sa v Safari ukladajú slabšie. Na plochu sa appka pridá takto: klikni <strong>Zdieľať</strong> (štvorček so šípkou), vyber <strong>Pridať na plochu</strong> a potom otvor appku z ikony.</p>
      <p style={{ color: "#555" }}>Potom už budeš pracovať len z ikony na ploche.</p>
    </div>
  );
}

/**
 * Sprievodca prvým nastavením (FR-12): dva kroky, každý sa dá preskočiť.
 * Krok 1: cieľ a prah (SettingsSection). Krok 2: investície a prvé vyhodnotenie (SnapshotSection);
 * uložením vyhodnotenia sa nastaví D_L a sprievodca zmizne.
 */
function FirstSetup({ repo, data, ctx, onChanged, onSkip }: { repo: Repository; data: AppData; ctx: Ctx; onChanged: () => void; onSkip: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Krok 1 z 2: cieľ a prah", note: "" },
    { title: "Krok 2 z 2: investície a prvé vyhodnotenie", note: "Zadaj aktuálnu hodnotu investícií a hotovosť. Týmto krokom sa nastaví dátum cieľa." },
  ];
  return (
    <section aria-label="Prvé nastavenie">
      <h2 style={{ fontSize: "1.1rem" }}>{steps[step].title}</h2>
      {steps[step].note && <p style={{ color: "#555" }}>{steps[step].note}</p>}
      {step === 0 ? (
        <SettingsSection repo={repo} settings={data.settings} derived={ctx.derived} onSaved={onChanged} />
      ) : (
        <SnapshotSection repo={repo} latest={ctx.latest} capital={ctx.capital} derivedInvCents={null} snapshots={data.snapshots} onSaved={onChanged} />
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={btn}>Späť</button>}
        {step < steps.length - 1 && <button onClick={() => setStep(step + 1)} style={btn}>Ďalej</button>}
        <button onClick={onSkip} style={btn}>Preskočiť na hlavnú stránku</button>
      </div>
    </section>
  );
}


type SectionId = "prehlad" | "nova-transakcia" | "prijmy" | "rozpocet" | "vyhodnotenie" | "majetok" | "zavazky" | "investicie" | "nastavenia" | "zaloha";

const NAV: { id: SectionId; label: string }[] = [
  { id: "prehlad", label: "Prehľad" },
  { id: "nova-transakcia", label: "Transakcie" },
  { id: "prijmy", label: "Príjmy" },
  { id: "rozpocet", label: "Rozpočet" },
  { id: "vyhodnotenie", label: "Vyhodnotenie" },
  { id: "majetok", label: "Majetok" },
  { id: "zavazky", label: "Záväzky" },
  { id: "investicie", label: "Investície" },
  { id: "nastavenia", label: "Nastavenia" },
  { id: "zaloha", label: "Záloha" },
];

/** Sekcia z kotvy v adrese; bez platnej kotvy ide na Prehľad. */
function sectionFromHash(): SectionId {
  const id = window.location.hash.slice(1);
  return NAV.some((n) => n.id === id) ? (id as SectionId) : "prehlad";
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
function Nav({ active }: { active: SectionId }) {
  return (
    <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1, borderBottom: "1px solid #ddd" }}>
    <nav aria-label="Hlavná navigácia" style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: 0, padding: "4px 0" }}>
      {NAV.map((n) => (
        <a
          key={n.id}
          href={`#${n.id}`}
          aria-current={n.id === active ? "page" : undefined}
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 6px", color: "inherit", whiteSpace: "nowrap", flex: "0 0 auto", fontSize: "0.9rem", fontWeight: n.id === active ? 700 : 400, textDecoration: n.id === active ? "underline" : "none" }}
        >
          {n.label}
        </a>
      ))}
    </nav>
    <div aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 28, pointerEvents: "none", background: "linear-gradient(to right, rgba(255,255,255,0), #fff)" }} />
    </div>
  );
}

/** Nadpis a obsah jednej sekcie (zobrazuje sa samostatne). */
function Section({ id, title, children }: { id: SectionId; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ background: "#f7f5f0", padding: 12, borderRadius: 8, marginBottom: 8 }}>
      <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

function Shell({ children, nav }: { children: React.ReactNode; nav?: SectionId }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "16px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: "1.5rem" }}>Finančná sloboda</h1>
      <p style={{ color: "#555" }}>Údaje sa ukladajú len v tomto zariadení. Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.</p>
      {nav && <Nav active={nav} />}
      {children}
    </main>
  );
}

function HomeSection({ data, ctx, lastExport }: { data: AppData; ctx: Ctx; lastExport: string | null }) {
  const today = todayIso();
  const pending =
    ctx.latest && ctx.target !== null && ctx.settings
      ? impactMonthsSplit({ inv: ctx.latest.investmentsCents, cash: ctx.latest.cashCents }, ctx.capital, ctx.mInv, ctx.mCash, ctx.realReturn, ctx.target)
      : null;
  return (
    <div>
      {reviewDueSoon(ctx.latest?.date ?? null, today) && (
        <p style={{ background: "#eef5f1", padding: 8, borderRadius: 6 }}>
          Blíži sa koniec mesiaca. Zadaj vyhodnotenie, aby dátum cieľa zodpovedal stavu.
        </p>
      )}
      {reviewOverdue(ctx.latest?.date ?? null, today) && (
        <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>
          Vyhodnotenie za predchádzajúci mesiac chýba. Dátum cieľa sa mení len pri vyhodnotení.
        </p>
      )}
      {(data.snapshots.length > 0 || data.transactions.length > 0 || data.settings !== null) && backupOverdue(lastExport, today) && (
        <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>
          Záloha ešte nebola exportovaná alebo je staršia ako 7 dní. Dáta sú len v tomto zariadení.
        </p>
      )}
      {ctx.target !== null ? <p>Cieľová suma: <strong>{eur(ctx.target)}</strong></p> : <p>Cieľová suma: <strong>nezadané</strong> (zadaj ročné výdavky a mieru výberu).</p>}
      {(ctx.negative.cash || ctx.negative.inv) && (
        <p style={{ background: "#fbe3e3", padding: 8, borderRadius: 6 }}>
          Pozor: záznamy vedú k zápornému stavu {ctx.negative.cash ? "hotovosti" : "investícií"} a hodnoty sú zarazené na 0. Skontroluj transakcie po poslednom vyhodnotení.
        </p>
      )}
      {ctx.latest && ctx.target !== null ? (
        <>
          <p>Dátum cieľa: <strong>{scenarioText(ctx, ctx.realReturn)}</strong></p>
          <p style={{ fontSize: "0.9rem", color: "#555" }}>
            Posledné vyhodnotenie: <strong>{ctx.latest.date}</strong>. Dátum sa zmení až po ďalšom vyhodnotení.
          </p>
          {ctx.longHorizon && (
            <p style={{ fontSize: "0.9rem", background: "#fff4e0", padding: 8, borderRadius: 6 }}>
              Pri dlhom horizonte (viac ako 20 rokov) je predpoklad výnosu menej istý; výsledok je v dnešných eurách.
            </p>
          )}
          <details style={{ fontSize: "0.9rem" }}>
            <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Podrobnosti</summary>
            <p>
              Rozsah dátumu: od {scenarioText(ctx, ctx.realReturn + 0.02)} do {scenarioText(ctx, Math.max(0, ctx.realReturn - 0.02))} (opatrný – základný – optimistický).
            </p>
            <p>
              Výnos: {pctText(ctx.realReturn)} reálne po poplatkoch, nominálne ≈ {pctText(nominalFromReal(ctx.realReturn, RETURN_ASSUMPTIONS.inflation))} pri inflácii 2 % (predpoklad).
            </p>
            <p>Kapitál: investície {eur(ctx.capital.inv)}, hotovosť {eur(ctx.capital.cash)}. Rezerva: {eur(ctx.reserve)}.</p>
            <p>
              Predbežný dopad posledných transakcií:{" "}
              <strong>{pending === null ? UNREACHABLE_IMPACT_TEXT : formatImpact(pending)}</strong>
            </p>
            <p style={{ color: "#555" }}>Transakcií: {data.transactions.length}</p>
          </details>
        </>
      ) : (
        <p>{ctx.latest ? "" : "Urobte prvé vyhodnotenie. Dátum cieľa sa zobrazí po ňom."}</p>
      )}
      <a href="#nova-transakcia" style={{ ...btn, display: "inline-block", textDecoration: "none", color: "inherit", border: "1px solid #888", borderRadius: 4 }}>
        Pridať transakciu
      </a>
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
      <p style={{ color: "#555" }}>
        Hodnota je tvoj odhad, nie trhová cena. Do kapitálu K sa počíta len nehnuteľnosť, ktorú prenajímaš; vlastné bývanie sa zobrazí zvlášť.
      </p>
      {properties.length === 0 && editing === null && <p>Zatiaľ nie je zapísaná žiadna nehnuteľnosť.</p>}
      {properties.map((p) => {
        const net = netPropertyValueCents(p);
        const stale = valueIsStale(p.valueDate, today);
        return (
          <div key={p.id} style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6, marginBottom: 8, background: "#fff" }}>
            <p style={{ margin: 0 }}><strong>{p.name || "Nehnuteľnosť"}</strong> · {PROPERTY_MODE_LABEL[p.mode]}</p>
            <p style={{ margin: "4px 0" }}>Odhad: {eur(p.valueCents)} (k {p.valueDate})</p>
            {stale && <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>Odhad je starší ako 12 mesiacov. Over ho a zadaj nový.</p>}
            <p style={{ margin: "4px 0" }}>Hypotéka: {eur(p.mortgageBalanceCents)}</p>
            <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", margin: "8px 0", fontSize: "0.95rem" }}>
              {p.mode === "prenajom" && <><dt>Nájom</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyRentCents ?? 0)}</dd></>}
              <dt>Splátka hypotéky</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyPaymentCents ?? 0)}</dd>
              {(p.monthlyPaymentCents ?? 0) > 0 && p.mortgageBalanceCents > 0 && (
                <>
                  <dt style={{ paddingLeft: 12, color: "#555" }}>z toho úrok</dt><dd style={{ margin: 0, textAlign: "right", color: "#555" }}>{eur(splitPayment(p).interestCents)}</dd>
                  <dt style={{ paddingLeft: 12, color: "#555" }}>z toho istina</dt><dd style={{ margin: 0, textAlign: "right", color: "#555" }}>{eur(splitPayment(p).principalCents)}</dd>
                </>
              )}
              <dt>Ostatné náklady</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyOtherCostsCents ?? 0)}</dd>
              <dt><strong>Mesačné náklady spolu</strong></dt><dd style={{ margin: 0, textAlign: "right" }}><strong>{eur(monthlyCostsCents(p))}</strong></dd>
            </dl>
            <p style={{ margin: "4px 0" }}>
              Čistá hodnota: <strong>{eur(net)}</strong>
              {net < 0 && <span> (hypotéka presahuje odhad)</span>}
            </p>
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
              {p.mode === "nezadane" ? "Do K sa zatiaľ nepočíta: zadaj režim." : countsInCapital(p) ? "Do K sa počíta ako čistá hodnota." : "Do K sa nepočíta; zobrazí sa zvlášť."}
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
      <p style={{ color: "#555" }}>Odhad je tvoj, nie trhová cena. Zatiaľ sa do K nepočítajú (predpoklad).</p>
      {assets.length === 0 && editing === null && <p>Zatiaľ nie je zapísané žiadne aktívum.</p>}
      {assets.map((a) => (
        <div key={a.id} style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6, marginBottom: 8, background: "#fff" }}>
          <p style={{ margin: 0 }}><strong>{a.name}</strong> · {ASSET_KIND_LABEL[a.kind]}</p>
          <p style={{ margin: "4px 0" }}>Odhad: {eur(a.valueCents)} (k {a.valueDate})</p>
          {valueIsStale(a.valueDate, today) && <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>Odhad je starší ako 12 mesiacov. Over ho a zadaj nový.</p>}
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Do K sa zatiaľ nepočíta.</p>
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
    <div style={{ border: "1px solid #888", padding: 12, borderRadius: 6, background: "#fff" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť" : "Nové"}: {ASSET_KIND_LABEL[kind].toLowerCase()}</h4>
      <Field label="Názov (napr. značka a rok, alebo podiel)" value={name} type="text" onChange={setName} />
      <Field label="Odhad hodnoty (€)" value={value} onChange={setValue} />
      <Field label="Dátum odhadu (RRRR-MM-DD)" value={valueDate} type="text" onChange={setValueDate} />
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
    <div style={{ border: "1px solid #888", padding: 12, borderRadius: 6, background: "#fff" }}>
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
      <p style={{ color: "#555" }}>
        Zadávaš počet kusov, cenu a kurz k euru. Hodnota v eurách sa počíta v telefóne; nič sa neposiela von. Suma investícií vo Vyhodnotení je súčtom týchto položiek.
      </p>
      {positions.length === 0 && editing === null && <p>Zatiaľ nie je zapísaná žiadna položka. Vo Vyhodnotení sa suma zadáva ručne.</p>}
      {positions.length > 0 && (
        <p style={{ fontSize: "1.05rem" }}>Spolu: <strong>{eur(investmentsTotalCents(positions))}</strong></p>
      )}
      {monthlyContributionsTotalCents(positions) > 0 && (
        <p style={{ color: "#555" }}>Mesačné vklady do tretieho piliera a iných položiek: {eur(monthlyContributionsTotalCents(positions))} (len zobrazenie)</p>
      )}
      {positions.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6, marginBottom: 8, background: "#fff" }}>
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
    };
    try {
      await repo.savePosition(position);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid #888", padding: 12, borderRadius: 6, background: "#fff" }}>
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
      <p style={{ color: "#555" }}>Hypotéku evidujte v sekcii Majetok. Tu sú ostatné dlhy: úver, kreditná karta, leasing.</p>
      {liabilities.length === 0 && editing === null && <p>Zatiaľ nie je zapísaný žiadny záväzok.</p>}
      {liabilities.length > 0 && (
        <p style={{ fontSize: "1.05rem" }}>
          Dlh spolu: <strong>{eur(totals.debtCents)}</strong>. Mesačne odchádza: <strong>{eur(totals.monthlyPaymentCents)}</strong>, z toho úrok {eur(totals.monthlyInterestCents)}.
        </p>
      )}
      {liabilities.map((l) => (
        <div key={l.id} style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6, marginBottom: 8, background: "#fff" }}>
          <p style={{ margin: 0 }}><strong>{l.name}</strong> · {LIABILITY_KIND_LABEL[l.kind]}</p>
          <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", margin: "8px 0", fontSize: "0.95rem" }}>
            <dt>Zostatok</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(l.balanceCents)}</dd>
            <dt>Úroková sadzba</dt><dd style={{ margin: 0, textAlign: "right" }}>{String(Number((l.rate * 100).toFixed(4)))} % p. a.</dd>
            <dt>Splátka mesačne</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(l.monthlyPaymentCents)}</dd>
            <dt>Úrok za mesiac</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(liabilityInterestCents(l))}</dd>
          </dl>
          {l.endDate && <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Koniec: {l.endDate}</p>}
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
    <div style={{ border: "1px solid #888", padding: 12, borderRadius: 6, background: "#fff" }}>
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
      <p style={{ color: "#555" }}>
        Tu len vidíš, koľko pravidelne prichádza. Sporenie sa mení až podľa zostatku na konci mesiaca, pri vyhodnotení. Nájom z nehnuteľnosti eviduj v Majetku, aby sa nerátal dvakrát.
      </p>
      <div style={{ border: "1px dashed #aaa", padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: "0.95rem" }}>Načítať údaje zo súboru integračnej služby</span>
          <input type="file" accept="application/json,.json" aria-label="Súbor od integračnej služby" onChange={onFile} style={{ marginTop: 6 }} />
        </label>
        {feedErr && <p style={{ color: "#8a0000" }}>{feedErr}</p>}
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
        <p style={{ color: "#555" }}>Nepravidelné príjmy (do mesačného súčtu sa nerátajú): {eur(irregularIncomes(incomes).reduce((sum, i) => sum + i.amountCents, 0))}</p>
      )}
      {incomes.map((i) => {
        const active = isIncomeActive(i, today);
        return (
          <div key={i.id} style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6, marginBottom: 8, background: "#fff" }}>
            <p style={{ margin: 0 }}>
              <strong>{i.name}</strong> · {INCOME_KIND_LABEL[i.kind]}{" "}
              {!active && <span style={{ color: "#555" }}>(neplatí dnes)</span>}
            </p>
            <p style={{ margin: "4px 0" }}>
              {eur(i.amountCents)}{i.frequency === "mesacne" ? " mesačne" : " (jednorazovo)"}
              {i.dayOfMonth !== undefined ? `, zvyčajne ${i.dayOfMonth}. v mesiaci` : ""}
            </p>
            {i.source && <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>Zdroj: {i.source}, získané {(i.fetchedAt ?? "").slice(0, 10)}</p>}
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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
    <div style={{ border: "1px solid #888", padding: 12, borderRadius: 6, background: "#fff" }}>
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť príjem</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

/** Rozpočet kategórií (D-106): mesačný limit a čo sa za aktuálny mesiac minulo. Prázdny limit = bez rozpočtu. */
function BudgetSection({ repo, budgets, transactions, today, onSaved }: { repo: Repository; budgets: Budget[]; transactions: Transaction[]; today: string; onSaved: () => void }) {
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

  return (
    <section>
      <p style={{ color: "#555" }}>
        Mesačný limit pre kategóriu. Čo je v kategórii zaradené, vidíš v zázname výdavku. Prázdny limit znamená bez rozpočtu. Zoznam kategórií je návrh.
      </p>
      {BUDGET_CATEGORIES.map((c) => {
        const b = budgets.find((x) => x.category === c);
        const spent = spentInMonthCents(transactions, c, today);
        const st = budgetStatus(b, spent);
        const hint = st
          ? `minuté tento mesiac ${eur(spent)}; ${st.over ? `prekročené o ${eur(st.remainingCents)}` : `zostáva ${eur(st.remainingCents)}`}`
          : `minuté tento mesiac ${eur(spent)}`;
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
      <p style={{ color: "#555" }}>Výdavky bez kategórie tento mesiac: {eur(unassigned)}</p>
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť rozpočet</button>
    </section>
  );
}

function SettingsSection({ repo, settings, derived, onSaved }: { repo: Repository; settings: Settings | null; derived: { inv: number; cash: number }; onSaved: () => void }) {
  const [v, setV] = useState({
    expenses: settings ? settings.expensesCents / 100 : "" as NumIn,
    withdrawalPct: settings ? settings.withdrawalRate * 100 : "" as NumIn,
    returnPct: settings ? settings.realReturn * 100 : "" as NumIn,
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
    const vals = [v.expenses, v.withdrawalPct, v.returnPct, v.reserve, v.threshold].map(asNum);
    const fee = v.fees === "" ? 0 : v.fees;
    if (!(fee >= 0 && fee < 100)) return setErr("Poplatky musia byť od 0 do menej ako 100 % ročne.");
    const labels = ["ročné výdavky", "mieru výberu", "výnos", "rezervu", "prah"];
    const missing = labels.filter((_, i) => Number.isNaN(vals[i]));
    if (missing.length) return setErr(`Vyplň ${missing.join(", ")}.`);
    const [exp, wr, rr, res, thr] = vals;
    if (!(exp > 0)) return setErr("Ročné výdavky musia byť väčšie ako 0.");
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
        <p style={{ background: "#eef5f1", padding: 8, borderRadius: 6 }}>
          Prvé nastavenie: polia sú prázdne. Pod každým je východisková hodnota; ročné výdavky zadaj sám.
        </p>
      )}
      <Field label="Ročné výdavky pri nezávislosti (€)" value={v.expenses} onChange={(x) => setV({ ...v, expenses: x })} />
      <Field label="Miera výberu (%)" value={v.withdrawalPct} step={0.1} onChange={(x) => setV({ ...v, withdrawalPct: x })}
        hint={`východisková hodnota ${pct(rec.withdrawalRate)}`} changed={differs(v.withdrawalPct, rec.withdrawalRate * 100)} onReset={() => setV({ ...v, withdrawalPct: Number((rec.withdrawalRate * 100).toFixed(6)) })} />
      <Field label="Reálny výnos r (%)" value={v.returnPct} step={0.1} onChange={(x) => setV({ ...v, returnPct: x })}
        hint={`východisková hodnota ${pct(rec.realReturn)}; reálny výnos je po odpočítaní inflácie`} changed={differs(v.returnPct, rec.realReturn * 100)} onReset={() => setV({ ...v, returnPct: Number((rec.realReturn * 100).toFixed(6)) })} />
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
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
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

  const write = async (existingId: string | undefined) => {
    try {
      await repo.addSnapshot({
        id: existingId ?? uid(),
        date,
        investmentsCents: derivedInvCents ?? cents(asNum(inv)),
        cashCents: cents(asNum(cash)),
        createdAt: new Date().toISOString(),
      });
      setConfirmId(null);
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
    await write(undefined);
  };

  return (
    <section>
      <p style={{ color: "#555" }}>
        {latest ? `Posledné vyhodnotenie: ${latest.date}.` : "Zatiaľ nebolo vyhodnotenie. Dátum cieľa sa zobrazí až po ňom."}
      </p>
      <p style={{ color: "#555" }}>Na konci mesiaca zadaj hodnotu investícií a hotovosť. Dátum cieľa sa zmení až po tomto kroku.</p>
      <Field label="Dátum vyhodnotenia (RRRR-MM-DD)" value={date} type="text" onChange={setDate} />
      {derivedInvCents === null ? (
        <Field label="Hodnota investícií (€)" value={inv} onChange={setInv} />
      ) : (
        <p>Hodnota investícií: <strong>{eur(derivedInvCents)}</strong> (súčet položiek v sekcii Investície)</p>
      )}
      <Field label="Nasporená suma, hotovosť (€)" value={cash} onChange={setCash} />
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
      {confirmId && (
        <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <p>Vyhodnotenie s dátumom {date} už existuje. Prepísať ho? História sa zachová v zálohe.</p>
          <button onClick={() => write(confirmId)} style={btn}>Prepísať vyhodnotenie</button>{" "}
          <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
        </div>
      )}
      <button onClick={save} style={btn}>Uložiť vyhodnotenie</button>
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
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Transaction | null>(null);
  const [fType, setFType] = useState<"all" | TransactionType>("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
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
    const c = check();
    if (c.after === null) return { blocked: true as const, message: c.message };
    const d = impactMonthsSplit(base.capital, c.after, ctx.mInv, ctx.mCash, ctx.realReturn, ctx.target);
    return { blocked: false as const, impact: d, note: c.message, needsConfirm: !!c.needsConfirm };
  }, [type, source, amount, base, ctx]);

  const resetForm = () => {
    setConfirmExhausted(false);
    setEditingId(null);
    setNote("");
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
    setErr(null);
  };

  const save = async () => {
    if (!ctx.latest) return setErr("Najprv zadaj vyhodnotenie (D_L).");
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
    const t: Transaction = {
      id: existing?.id ?? uid(),
      date,
      type,
      amountCents: cents(a),
      ...(needsSource ? { source } : {}),
      ...(type === "vydavok" ? { belowThreshold: cents(a) < (ctx.settings?.thresholdCents ?? 0) } : {}),
      ...(type === "vydavok" && category !== "" ? { category } : {}),
      ...(noteText ? { note: noteText.slice(0, 200) } : {}),
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

  const list = filterHistory(data.transactions, { type: fType === "all" ? undefined : fType, from: fFrom || undefined, to: fTo || undefined });
  const totals = totalsByType(list);
  const inEdit = editingId !== null;

  return (
    <section>
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
      <Field label="Dátum (RRRR-MM-DD)" value={date} type="text" onChange={setDate} />
      <Field label="Poznámka (voliteľná)" value={note} type="text" onChange={setNote} />
      {preview && (
        <p>
          {preview.blocked
            ? preview.message
            : <>Predbežný dopad: <strong>{preview.impact === null ? UNREACHABLE_IMPACT_TEXT : formatImpact(preview.impact)}</strong></>}
        </p>
      )}
      {preview && !preview.blocked && preview.note && (
        <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>{preview.note}</p>
      )}
      {preview && !preview.blocked && preview.needsConfirm && (
        <label style={{ display: "block", margin: "8px 0" }}>
          <input type="checkbox" checked={confirmExhausted} onChange={(e) => setConfirmExhausted(e.target.checked)} /> Rozumiem, investície sa vyčerpajú a K_inv bude 0 €.
        </label>
      )}
      {inEdit && date <= (ctx.latest?.date ?? "") && (
        <p style={{ color: "#555" }}>Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.</p>
      )}
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
      <button onClick={save} style={btn}>{inEdit ? "Uložiť zmeny" : "Uložiť transakciu"}</button>
      {inEdit && <button onClick={resetForm} style={{ ...btn, marginLeft: 8 }}>Zrušiť úpravu</button>}

      <h3 style={{ fontSize: "1rem", marginTop: 24 }}>História</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select aria-label="Filter typu" value={fType} onChange={(e) => setFType(e.target.value as "all" | TransactionType)} style={{ ...inp, width: "auto" }}>
          <option value="all">všetky typy</option>
          {(Object.keys(TYPE_LABEL) as TransactionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <input aria-label="Od (RRRR-MM-DD)" type="text" placeholder="od RRRR-MM-DD" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={{ ...inp, width: "auto" }} />
        <input aria-label="Do (RRRR-MM-DD)" type="text" placeholder="do RRRR-MM-DD" value={fTo} onChange={(e) => setFTo(e.target.value)} style={{ ...inp, width: "auto" }} />
      </div>
      <p style={{ fontSize: "0.9rem", color: "#555" }}>
        Súčty: {(Object.keys(totals) as TransactionType[]).length === 0
          ? "žiadne"
          : (Object.keys(totals) as TransactionType[]).map((t) => `${TYPE_LABEL[t]} ${eur(totals[t] ?? 0)}`).join(" · ")}
      </p>
      {undo && (
        <p style={{ background: "#f4f1e8", padding: 8, borderRadius: 6 }}>
          Transakcia bola zmazaná. <button onClick={restore} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Vrátiť späť</button>
        </p>
      )}
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {list.length === 0 && <li style={{ color: "#555" }}>Zatiaľ žiadne.</li>}
        {list.map((t) => (
          <li key={t.id} style={{ borderBottom: "1px solid #ddd", padding: "6px 0", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>
              {t.date} · {TYPE_LABEL[t.type]} · {eur(t.amountCents)}
              {t.source ? ` (${SOURCE_LABEL[t.source]})` : ""}
              {t.belowThreshold ? " · pod prahom" : ""}
              {t.note ? ` · ${t.note}` : ""}
            </span>
            <span style={{ display: "flex", gap: 6 }}>
              <button onClick={() => startEdit(t)} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Upraviť</button>
              <button onClick={() => remove(t.id)} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Zmazať</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BackupSection({ repo, data, onChanged, onExported }: { repo: Repository; data: AppData; onChanged: () => void; onExported: (iso: string) => void }) {
  const [preview, setPreview] = useState<{ data: AppData; counts: { transactions: number; snapshots: number }; exportedAt: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [backupFirst, setBackupFirst] = useState(false);

  const exportBackup = () => {
    const nowIso = new Date().toISOString();
    const obj = buildBackup(data, nowIso);
    onExported(nowIso);
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financna-sloboda-zaloha-${todayIso()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Záloha sa stiahla. Obsahuje citlivé finančné údaje: neukladaj ju do verejných priečinkov.");
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
      setErrors([...res.errors, "Nič sa nezmenilo."]);
      return;
    }
    setBackupFirst(false);
    setPreview({ data: res.data!, counts: res.counts!, exportedAt: (json as { exportedAt: string }).exportedAt });
  };

  const confirmImport = async () => {
    if (!preview) return;
    try {
      if (backupFirst) exportBackup(); // D-078: záloha len na výslovné zaškrtnutie používateľom
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
      <p style={{ color: "#555" }}>Dáta sú len v tomto zariadení. Pravidelne si ulož zálohu. Súbor sa stiahne do priečinka Stiahnuté (alebo do priečinka, ktorý nastavil prehliadač).</p>
      <button onClick={exportBackup} style={btn}>Exportovať zálohu</button>
      <label style={{ display: "block", margin: "16px 0 8px" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>Import zálohy (JSON)</span>
        <input
          type="file"
          accept="application/json,.json"
          aria-label="Súbor zálohy"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {errors.length > 0 && <ul style={{ color: "#8a0000" }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
      {preview && (
        <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <p>
            Záloha z {preview.exportedAt.slice(0, 10)}: {preview.counts.transactions} transakcií, {preview.counts.snapshots} vyhodnotení.
          </p>
          <p><strong>Import nahradí všetky aktuálne dáta v tomto zariadení.</strong></p>
          <label style={{ display: "block", margin: "8px 0" }}>
            <input type="checkbox" checked={backupFirst} onChange={(e) => setBackupFirst(e.target.checked)} />{" "}
            Pred importom stiahnuť zálohu aktuálnych dát
          </label>
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

function Field(props: { label: string; value: NumIn | string; onChange: (v: any) => void; step?: number; type?: string; hint?: string; onReset?: () => void; changed?: boolean }) {
  return (
    <label style={{ display: "block", margin: "8px 0" }}>
      <span style={{ display: "block", fontSize: "0.9rem" }}>{props.label}</span>
      <input
        type={props.type ?? "number"}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => {
          if (props.type === "text") return props.onChange(e.target.value);
          props.onChange(e.target.value === "" ? "" : Number(e.target.value));
        }}
        style={inp}
      />
      {props.hint && (
        <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.85rem", color: "#555" }}>
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

