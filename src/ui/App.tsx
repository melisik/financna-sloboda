import { useEffect, useMemo, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import { SOURCES, type AppData, type Settings, type Snapshot, type Source, type Transaction, type TransactionType } from "../storage/types";
import { checkDate } from "../storage/validate";
import { buildBackup, parseBackup } from "../storage/backup";
import { capitalWithFlags, reserveBalance } from "../app/ledger";
import { filterHistory, totalsByType } from "../app/history";
import { backupOverdue, reviewOverdue } from "../app/reminders";
import { targetAmountCents, targetDate } from "../domain/goal";
import { formatImpact, UNREACHABLE_IMPACT_TEXT } from "../domain/impact";
import { monthlySaving } from "../domain/saving";
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

export function App() {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

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
  return (
    <Shell>
      <HomeSection data={data} ctx={ctx} lastExport={lastExport} />
      <SettingsSection repo={repo} settings={data.settings} derived={ctx.derived} onSaved={reload} />
      <SnapshotSection repo={repo} latest={ctx.latest} snapshots={data.snapshots} onSaved={reload} />
      <TransactionSection repo={repo} data={data} ctx={ctx} onChanged={reload} />
      <BackupSection repo={repo} data={data} onChanged={reload} onExported={async (iso) => { await repo.setMeta("lastExportAt", iso); setLastExport(iso); }} />
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
      <p style={{ color: "#555" }}>Potom už budeš pracovať len z ikony na ploche (D-053).</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "16px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: "1.5rem" }}>Finančná sloboda (prototyp)</h1>
      <p style={{ color: "#555" }}>Údaje sa ukladajú len v tomto zariadení. Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš (D-064).</p>
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
    <section style={{ background: "#f7f5f0", padding: 12, borderRadius: 8, marginBottom: 8 }}>
      <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Prehľad</h2>
      {reviewOverdue(ctx.latest?.date ?? null, today) && (
        <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>
          Vyhodnotenie za predchádzajúci mesiac chýba. Dátum cieľa sa mení len pri vyhodnotení.
        </p>
      )}
      {backupOverdue(lastExport, today) && (
        <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>
          Záloha ešte nebola exportovaná alebo je staršia ako 7 dní (FR-19). Dáta sú len v tomto zariadení.
        </p>
      )}
      {ctx.target !== null ? <p>Cieľová suma: <strong>{eur(ctx.target)}</strong></p> : <p>Najprv zadaj nastavenia (ročné výdavky, miera výberu).</p>}
      {(ctx.negative.cash || ctx.negative.inv) && (
        <p style={{ background: "#fbe3e3", padding: 8, borderRadius: 6 }}>
          Pozor: záznamy vedú k zápornému stavu {ctx.negative.cash ? "hotovosti" : "investícií"} a hodnoty sú zarazené na 0. Skontroluj transakcie po poslednom vyhodnotení (R2).
        </p>
      )}
      {ctx.latest && ctx.target !== null ? (
        <>
          <p>Dátum cieľa: <strong>{scenarioText(ctx, ctx.realReturn)}</strong></p>
          <p style={{ fontSize: "0.9rem" }}>
            Výnos: {pctText(ctx.realReturn)} reálne po poplatkoch, nominálne ≈ {pctText(nominalFromReal(ctx.realReturn, RETURN_ASSUMPTIONS.inflation))} pri inflácii 2 % (predpoklad, D-063).
          </p>
          {ctx.longHorizon && (
            <p style={{ fontSize: "0.9rem", background: "#fff4e0", padding: 8, borderRadius: 6 }}>
              Pri dlhom horizonte (viac ako 20 rokov) je predpoklad výnosu menej istý; výsledok je v dnešných eurách (D-065).
            </p>
          )}
          <p style={{ fontSize: "0.9rem" }}>
            Rozsah: od {scenarioText(ctx, ctx.realReturn + 0.02)} do {scenarioText(ctx, Math.max(0, ctx.realReturn - 0.02))} (opatrný – základný – optimistický).
          </p>
          <p>Posledné vyhodnotenie: <strong>{ctx.latest.date}</strong>. Dátum platí k tomuto dňu.</p>
          <p>
            Predbežný dopad posledných transakcií:{" "}
            <strong>{pending === null ? UNREACHABLE_IMPACT_TEXT : formatImpact(pending)}</strong>
          </p>
        </>
      ) : (
        <p>{ctx.latest ? "" : "Zatiaľ nie je vyhodnotenie. Dátum cieľa sa zobrazí po prvom vyhodnotení (L6)."}</p>
      )}
      <p style={{ fontSize: "0.85rem", color: "#555" }}>Transakcií: {data.transactions.length}</p>
      <a href="#nova-transakcia" style={{ ...btn, display: "inline-block", textDecoration: "none", color: "inherit", border: "1px solid #888", borderRadius: 4 }}>
        Pridať transakciu
      </a>
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
    if (vals.some((x) => Number.isNaN(x))) return setErr("Vyplň ročné výdavky, mieru výberu, výnos, rezervu a prah.");
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
      <h2 style={{ fontSize: "1.1rem" }}>Nastavenia</h2>
      {!settings && (
        <p style={{ background: "#eef5f1", padding: 8, borderRadius: 6 }}>
          Prvé nastavenie: polia sú prázdne. Pod každým je východisková hodnota; ročné výdavky zadaj sám (UR-10, D-057).
        </p>
      )}
      <Field label="Ročné výdavky pri nezávislosti (€)" value={v.expenses} onChange={(x) => setV({ ...v, expenses: x })} />
      <Field label="Miera výberu (%)" value={v.withdrawalPct} step={0.1} onChange={(x) => setV({ ...v, withdrawalPct: x })}
        hint={`východisková hodnota ${pct(rec.withdrawalRate)}`} onReset={() => setV({ ...v, withdrawalPct: rec.withdrawalRate * 100 })} />
      <Field label="Reálny výnos r (%)" value={v.returnPct} step={0.1} onChange={(x) => setV({ ...v, returnPct: x })}
        hint={`východisková hodnota ${pct(rec.realReturn)}; nominálne ≈ ${pct(nominalFromReal(realIn, RETURN_ASSUMPTIONS.inflation))} pri inflácii 2 % (D-063)`} onReset={() => setV({ ...v, returnPct: rec.realReturn * 100 })} />
      <Field label="Rezerva, cieľová hodnota (€)" value={v.reserve} onChange={(x) => setV({ ...v, reserve: x })}
        hint={`východisková hodnota ${eurs(rec.reserveCents)} (3 mesiace výdavkov)`} onReset={() => setV({ ...v, reserve: rec.reserveCents / 100 })} />
      <Field label="Prah výdavkov (€)" value={v.threshold} onChange={(x) => setV({ ...v, threshold: x })}
        hint={`východisková hodnota ${eurs(rec.thresholdCents)}`} onReset={() => setV({ ...v, threshold: rec.thresholdCents / 100 })} />
      <Field label="Poplatky p. a. (%)" value={v.fees} step={0.01} onChange={(x) => setV({ ...v, fees: x })}
        hint="predvolene 0 %, zatiaľ bez overeného údaja; doplň z dokumentácie poskytovateľa (D-064)" onReset={() => setV({ ...v, fees: 0 })} />
      <Field label="Mesačné sporenie do investícií (€), prázdne = odvodené" value={v.savingInv} onChange={(x) => setV({ ...v, savingInv: x })}
        hint={`prázdne = odvodené z transakcií: ${eurs(derived.inv)} mesačne (D-031)`} onReset={() => setV({ ...v, savingInv: "" })} />
      <Field label="Mesačné sporenie do hotovosti (€), prázdne = odvodené" value={v.savingCash} onChange={(x) => setV({ ...v, savingCash: x })}
        hint={`prázdne = odvodené z transakcií: ${eurs(derived.cash)} mesačne (D-031)`} onReset={() => setV({ ...v, savingCash: "" })} />
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť nastavenia</button>
    </section>
  );
}

function SnapshotSection({ repo, latest, snapshots, onSaved }: { repo: Repository; latest: Snapshot | null; snapshots: Snapshot[]; onSaved: () => void }) {
  const [date, setDate] = useState(todayIso());
  const [inv, setInv] = useState<NumIn>(latest ? latest.investmentsCents / 100 : "");
  const [cash, setCash] = useState<NumIn>(latest ? latest.cashCents / 100 : "");
  const [err, setErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const write = async (existingId: string | undefined) => {
    try {
      await repo.addSnapshot({
        id: existingId ?? uid(),
        date,
        investmentsCents: cents(asNum(inv)),
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
    if (Number.isNaN(asNum(inv)) || Number.isNaN(asNum(cash))) return setErr("Vyplň investície aj hotovosť.");
    if (asNum(inv) < 0 || asNum(cash) < 0) return setErr("Hodnoty nesmú byť záporné.");
    const same = snapshots.find((s) => s.date === date);
    if (same) return setConfirmId(same.id); // D-055: prepis len po potvrdení
    await write(undefined);
  };

  return (
    <section>
      <h2 style={{ fontSize: "1.1rem" }}>Vyhodnotenie (D_L)</h2>
      <p style={{ color: "#555" }}>
        {latest ? `Posledné vyhodnotenie: ${latest.date}.` : "Zatiaľ nebolo vyhodnotenie. Dátum cieľa sa zobrazí až po ňom (L6)."}
      </p>
      <Field label="Dátum vyhodnotenia (RRRR-MM-DD)" value={date} type="text" onChange={setDate} />
      <Field label="Hodnota investícií (€)" value={inv} onChange={setInv} />
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

function GoalSection({ ctx }: { ctx: Ctx }) {
  if (!ctx.latest || ctx.target === null) return null;
  return (
    <section>
      <h2 style={{ fontSize: "1.1rem" }}>Cieľ</h2>
      <p>Cieľová suma: <strong>{eur(ctx.target)}</strong></p>
      <p>Kapitál: investície {eur(ctx.capital.inv)}, hotovosť {eur(ctx.capital.cash)}. Rezerva: {eur(ctx.reserve)}.</p>
      <ul>
        <li>Opatrný (r − 2 p. b.): {scenarioText(ctx, Math.max(0, ctx.realReturn - 0.02))}</li>
        <li>Základný (r): {scenarioText(ctx, ctx.realReturn)}</li>
        <li>Optimistický (r + 2 p. b.): {scenarioText(ctx, ctx.realReturn + 0.02)}</li>
      </ul>
    </section>
  );
}

function TransactionSection({ repo, data, ctx, onChanged }: { repo: Repository; data: AppData; ctx: Ctx; onChanged: () => void }) {
  const [type, setType] = useState<TransactionType>("vydavok");
  const [amount, setAmount] = useState<NumIn>("");
  const [date, setDate] = useState(todayIso());
  const [source, setSource] = useState<Source>("z_hotovosti");
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
        if (r.ok && r.warning === "exhausted") return { after: r.capital, needsConfirm: true, message: "Investície nestačia. Po uložení bude K_inv 0 € (D-059). Ak výdavok platíš z príjmu, zvoľ zdroj „z príjmu“." };
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
      return { after: { inv: cap.inv, cash: cap.cash - ca }, message: `Vklad do rezervy zníži kapitál pre cieľ o ${eur(ca)}; peniaze zostávajú v rezerve (D-060).` };
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
    if (c.needsConfirm && !confirmExhausted) return setErr("Potvrď, že investície sa vyčerpajú (D-059).");
    const existing = editingId ? data.transactions.find((x) => x.id === editingId) : undefined;
    const excess = type === "vydavok" && source === "z_investicii" && c.needsConfirm ? cents(a) - base.capital.inv : 0;
    const noteText = [note, excess > 0 ? `prečerpanie ${eur(excess)} nad K_inv (D-059, D-066)` : ""].filter(Boolean).join("; ");
    const t: Transaction = {
      id: existing?.id ?? uid(),
      date,
      type,
      amountCents: cents(a),
      ...(needsSource ? { source } : {}),
      ...(type === "vydavok" ? { belowThreshold: cents(a) < (ctx.settings?.thresholdCents ?? 0) } : {}),
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
    <section id="nova-transakcia">
      <h2 style={{ fontSize: "1.1rem" }}>{inEdit ? "Úprava transakcie" : "Transakcie"}</h2>
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
          <input type="checkbox" checked={confirmExhausted} onChange={(e) => setConfirmExhausted(e.target.checked)} /> Rozumiem, investície sa vyčerpajú a K_inv bude 0 € (D-059).
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
      <GoalSection ctx={ctx} />
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
    setStatus("Záloha sa stiahla. Obsahuje citlivé finančné údaje: neukladaj ju do verejných priečinkov (FR-17).");
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
      <h2 style={{ fontSize: "1.1rem" }}>Záloha</h2>
      <p style={{ color: "#555" }}>Dáta sú len v tomto zariadení. Pravidelne si ulož zálohu (FR-17, FR-19).</p>
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
            Pred importom stiahnuť zálohu aktuálnych dát (D-078)
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

function Field(props: { label: string; value: NumIn | string; onChange: (v: any) => void; step?: number; type?: string; hint?: string; onReset?: () => void }) {
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
          {props.onReset && (
            <button type="button" onClick={props.onReset} style={{ ...btn, padding: "2px 8px", fontSize: "0.85rem", marginTop: 0 }}>
              Vrátiť východiskovú hodnotu
            </button>
          )}
        </span>
      )}
    </label>
  );
}

