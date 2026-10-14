import { useEffect, useMemo, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import { SOURCES, type AppData, type Settings, type Snapshot, type Source, type Transaction, type TransactionType } from "../storage/types";
import { currentCapital, reserveBalance } from "../app/ledger";
import { buildBackup, parseBackup } from "../storage/backup";
import { filterHistory, totalsByType } from "../app/history";
import { recommendedSettings } from "../domain/recommendations";
import { backupOverdue, reviewOverdue } from "../app/reminders";
import { targetAmountCents, targetDate } from "../domain/goal";
import { formatImpact } from "../domain/impact";
import { impactMonthsSplit, monthsToTargetSplit, payFromCash, payFromInvestments, transferToInvestments, type Capital } from "../domain/capital";

const MONTHS = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
const cents = (x: number) => Math.round(x * 100);
const eur = (c: number) => `${(c / 100).toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €`;
const todayIso = () => new Date().toISOString().slice(0, 10);
const monthYear = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_SETTINGS: Settings = {
  expensesCents: cents(24_000),
  withdrawalRate: 0.037,
  realReturn: 0.035,
  reserveCents: cents(6_000),
  thresholdCents: cents(100),
  savingInvCents: cents(500),
  savingCashCents: 0,
};

const TYPE_LABEL: Record<TransactionType, string> = {
  sporenie: "sporenie (do hotovosti)",
  investicia: "investícia",
  vydavok: "výdavok",
  rezerva: "vklad do rezervy",
  vyber_rezervy: "výber z rezervy",
};
const SOURCE_LABEL: Record<Source, string> = { z_prijmu: "z príjmu", z_hotovosti: "z hotovosti", z_investicii: "z investícií" };

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

  if (error) return <Shell><p style={{ color: "#8a0000" }}>{error}</p></Shell>;
  if (!repo || !data) return <Shell><p>Načítavam údaje…</p></Shell>;

  return (
    <Shell>
      <HomeSection data={data} lastExport={lastExport} />
      <SettingsSection repo={repo} settings={data.settings ?? DEFAULT_SETTINGS} isFirst={data.settings === null} onSaved={reload} />
      <SnapshotSection repo={repo} snapshots={data.snapshots} onSaved={reload} />
      <GoalSection data={data} />
      <TransactionSection repo={repo} data={data} onChanged={reload} />
      <BackupSection repo={repo} data={data} onChanged={reload} onExported={async (iso) => { await repo.setMeta("lastExportAt", iso); setLastExport(iso); }} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "16px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: "1.5rem" }}>Finančná sloboda (prototyp)</h1>
      <p style={{ color: "#555" }}>Údaje sa ukladajú len v tomto prehliadači. Výpočet je pred daňou a poplatkami (D-043, D-050).</p>
      {children}
    </main>
  );
}

function SettingsSection({ repo, settings, isFirst, onSaved }: { repo: Repository; settings: Settings; isFirst: boolean; onSaved: () => void }) {
  const [v, setV] = useState({
    expenses: settings.expensesCents / 100,
    withdrawalPct: settings.withdrawalRate * 100,
    returnPct: settings.realReturn * 100,
    reserve: settings.reserveCents / 100,
    threshold: settings.thresholdCents / 100,
    savingInv: settings.savingInvCents / 100,
    savingCash: settings.savingCashCents / 100,
  });
  const rec = recommendedSettings(cents(v.expenses));
  const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;
  const eurs = (c: number) => `${(c / 100).toLocaleString("sk-SK")} €`;
  const save = async () => {
    await repo.saveSettings({
      expensesCents: cents(v.expenses),
      withdrawalRate: v.withdrawalPct / 100,
      realReturn: v.returnPct / 100,
      reserveCents: cents(v.reserve),
      thresholdCents: cents(v.threshold),
      savingInvCents: cents(v.savingInv),
      savingCashCents: cents(v.savingCash),
    });
    onSaved();
  };
  return (
    <section>
      <h2 style={{ fontSize: "1.1rem" }}>Nastavenia</h2>
      {isFirst && (
        <p style={{ background: "#eef5f1", padding: 8, borderRadius: 6 }}>
          Prvé nastavenie: skontroluj hodnoty. Pod každým poľom je odporúčanie a tlačidlo na jeho vrátenie. Ročné výdavky zadaj sám (UR-10).
        </p>
      )}
      <Field label="Ročné výdavky pri nezávislosti (€)" value={v.expenses} onChange={(x) => setV({ ...v, expenses: x })} />
      <Field label="Miera výberu (%)" value={v.withdrawalPct} step={0.1} onChange={(x) => setV({ ...v, withdrawalPct: x })}
        hint={`odporúčané ${pct(rec.withdrawalRate)}`} onReset={() => setV({ ...v, withdrawalPct: rec.withdrawalRate * 100 })} />
      <Field label="Reálny výnos r (%)" value={v.returnPct} step={0.1} onChange={(x) => setV({ ...v, returnPct: x })}
        hint={`odporúčané ${pct(rec.realReturn)}`} onReset={() => setV({ ...v, returnPct: rec.realReturn * 100 })} />
      <Field label="Rezerva, cieľová hodnota (€)" value={v.reserve} onChange={(x) => setV({ ...v, reserve: x })}
        hint={`odporúčané ${eurs(rec.reserveCents)} (3 mesiace výdavkov)`} onReset={() => setV({ ...v, reserve: rec.reserveCents / 100 })} />
      <Field label="Prah výdavkov (€)" value={v.threshold} onChange={(x) => setV({ ...v, threshold: x })}
        hint={`odporúčané ${eurs(rec.thresholdCents)}`} onReset={() => setV({ ...v, threshold: rec.thresholdCents / 100 })} />
      <Field label="Mesačné sporenie do investícií (€)" value={v.savingInv} onChange={(x) => setV({ ...v, savingInv: x })}
        hint="odporúčané 0 €" onReset={() => setV({ ...v, savingInv: 0 })} />
      <Field label="Mesačné sporenie do hotovosti (€)" value={v.savingCash} onChange={(x) => setV({ ...v, savingCash: x })}
        hint="odporúčané 0 €" onReset={() => setV({ ...v, savingCash: 0 })} />
      <button onClick={save} style={btn}>Uložiť nastavenia</button>
    </section>
  );
}

function SnapshotSection({ repo, snapshots, onSaved }: { repo: Repository; snapshots: Snapshot[]; onSaved: () => void }) {
  const latest = [...snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const [date, setDate] = useState(todayIso());
  const [inv, setInv] = useState(latest ? latest.investmentsCents / 100 : 100000);
  const [cash, setCash] = useState(latest ? latest.cashCents / 100 : 20000);
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    if (date > todayIso()) return setErr("Dátum vyhodnotenia nesmie byť v budúcnosti.");
    if (inv < 0 || cash < 0) return setErr("Hodnoty nesmú byť záporné.");
    setErr(null);
    await repo.addSnapshot({ id: uid(), date, investmentsCents: cents(inv), cashCents: cents(cash), createdAt: new Date().toISOString() });
    onSaved();
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
      <button onClick={save} style={btn}>Uložiť vyhodnotenie</button>
    </section>
  );
}

function GoalSection({ data }: { data: AppData }) {
  const s = data.settings ?? DEFAULT_SETTINGS;
  const latest = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
  const capital = useMemo(() => currentCapital(latest, data.transactions), [latest, data.transactions]);
  const target = targetAmountCents(s.expensesCents, s.withdrawalRate);
  const reserve = reserveBalance(data.transactions);
  const scenario = (rate: number) => {
    if (!latest) return "—";
    const n = monthsToTargetSplit(capital, s.savingInvCents, s.savingCashCents, rate, target);
    if (n === null) return "Bez sporenia a výnosu sa cieľ nedosiahne";
    if (n === 0) return "Cieľ je dosiahnutý";
    return monthYear(targetDate(latest.date, n));
  };
  return (
    <section>
      <h2 style={{ fontSize: "1.1rem" }}>Cieľ</h2>
      <p>Cieľová suma: <strong>{eur(target)}</strong></p>
      <p>Kapitál: investície {eur(capital.inv)}, hotovosť {eur(capital.cash)}. Rezerva: {eur(reserve)}.</p>
      <ul>
        <li>Opatrný (r − 2 p. b.): {scenario(Math.max(0, s.realReturn - 0.02))}</li>
        <li>Základný (r): {scenario(s.realReturn)}</li>
        <li>Optimistický (r + 2 p. b.): {scenario(s.realReturn + 0.02)}</li>
      </ul>
      {latest && <p style={{ color: "#555", fontSize: "0.9rem" }}>Dátum platí k poslednému vyhodnoteniu ({latest.date}).</p>}
    </section>
  );
}

function TransactionSection({ repo, data, onChanged }: { repo: Repository; data: AppData; onChanged: () => void }) {
  const s = data.settings ?? DEFAULT_SETTINGS;
  const latest = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
  const capital = useMemo(() => currentCapital(latest, data.transactions), [latest, data.transactions]);
  const reserve = reserveBalance(data.transactions);

  const [type, setType] = useState<TransactionType>("vydavok");
  const [amount, setAmount] = useState(15000);
  const [date, setDate] = useState(todayIso());
  const [source, setSource] = useState<Source>("z_hotovosti");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Transaction | null>(null);
  const [fType, setFType] = useState<"all" | TransactionType>("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  const needsSource = type === "vydavok" || type === "investicia";
  const target = targetAmountCents(s.expensesCents, s.withdrawalRate);

  // Náhľad dopadu nového záznamu (predbežný, D-014).
  const preview = useMemo(() => {
    if (!latest || !(amount > 0)) return null;
    const a = cents(amount);
    let after: Capital | null = capital;
    if (type === "vydavok" && source === "z_hotovosti") {
      const r = payFromCash(capital, a, s.reserveCents);
      after = r.ok ? r.capital : null;
    } else if (type === "vydavok" && source === "z_investicii") {
      const r = payFromInvestments(capital, a);
      after = r.ok ? r.capital : null;
    } else if (type === "investicia" && source === "z_hotovosti") {
      const r = transferToInvestments(capital, a, s.reserveCents);
      after = r.ok ? r.capital : null;
    } else if (type === "investicia") {
      after = { inv: capital.inv + a, cash: capital.cash };
    } else if (type === "sporenie") {
      after = { inv: capital.inv, cash: capital.cash + a };
    } else if (type === "vydavok") {
      after = capital; // z príjmu
    }
    if (after === null) return { blocked: true as const };
    const d = impactMonthsSplit(capital, after, s.savingInvCents, s.savingCashCents, s.realReturn, target);
    return { blocked: false as const, impact: d };
  }, [latest, capital, type, source, amount, s, target]);

  useEffect(() => {
    if (!undo) return;
    const h = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(h);
  }, [undo]);

  const resetForm = () => {
    setEditingId(null);
    setNote("");
    setAmount(15000);
    setDate(todayIso());
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
    if (!(amount > 0)) return setErr("Suma musí byť kladná.");
    if (date > todayIso()) return setErr("Dátum nesmie byť v budúcnosti.");
    if (!latest) return setErr("Najprv zadaj vyhodnotenie (D_L).");
    if (type === "vydavok" && source === "z_hotovosti") {
      const r = payFromCash(capital, cents(amount), s.reserveCents);
      if (!r.ok) return setErr("Hotovosť by klesla pod rezervu. Zvoľ zdroj „z investícií“.");
    }
    if (type === "investicia" && source === "z_hotovosti") {
      const r = transferToInvestments(capital, cents(amount), s.reserveCents);
      if (!r.ok) return setErr("Hotovosť by klesla pod rezervu.");
    }
    if (type === "vyber_rezervy" && cents(amount) > reserve) return setErr("Výber je väčší než stav rezervy.");
    setErr(null);
    const existing = editingId ? data.transactions.find((x) => x.id === editingId) : undefined;
    const t: Transaction = {
      id: existing?.id ?? uid(),
      date,
      type,
      amountCents: cents(amount),
      ...(needsSource ? { source } : {}),
      ...(type === "vydavok" ? { belowThreshold: cents(amount) < s.thresholdCents } : {}),
      ...(note ? { note: note.slice(0, 200) } : {}),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.addTransaction(t);
    resetForm();
    onChanged();
  };

  const remove = async (id: string) => {
    const gone = data.transactions.find((x) => x.id === id) ?? null;
    await repo.deleteTransaction(id);
    if (editingId === id) resetForm();
    setUndo(gone);
    onChanged();
  };

  const restore = async () => {
    if (!undo) return;
    await repo.addTransaction(undo);
    setUndo(null);
    onChanged();
  };

  const list = filterHistory(data.transactions, { type: fType === "all" ? undefined : fType, from: fFrom || undefined, to: fTo || undefined });
  const totals = totalsByType(list);

  return (
    <section id="nova-transakcia">
      <h2 style={{ fontSize: "1.1rem" }}>{editingId ? "Úprava transakcie" : "Transakcie"}</h2>
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
            ? "Hotovosť by klesla pod rezervu. Zvoľ zdroj „z investícií“."
            : <>Predbežný dopad: <strong>{preview.impact === null ? "Bez sporenia a výnosu sa cieľ nedosiahne" : formatImpact(preview.impact)}</strong></>}
        </p>
      )}
      {err && <p style={{ color: "#8a0000" }}>{err}</p>}
      {editingId && latest && date <= latest.date && (
        <p style={{ color: "#555" }}>Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.</p>
      )}
      <button onClick={save} style={btn}>{editingId ? "Uložiť zmeny" : "Uložiť transakciu"}</button>
      {editingId && <button onClick={resetForm} style={{ ...btn, marginLeft: 8 }}>Zrušiť úpravu</button>}

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
      {list.length === 0 && <p style={{ color: "#555" }}>Zatiaľ žiadne.</p>}
      {undo && (
        <p style={{ background: "#f4f1e8", padding: 8, borderRadius: 6 }}>
          Transakcia bola zmazaná. <button onClick={restore} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Vrátiť späť</button>
        </p>
      )}
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
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

const inp: React.CSSProperties = { width: "100%", padding: "8px", fontSize: "1rem", boxSizing: "border-box" };
const btn: React.CSSProperties = { padding: "8px 14px", fontSize: "1rem", marginTop: 8 };

function Field(props: { label: string; value: number | string; onChange: (v: any) => void; step?: number; type?: string; hint?: string; onReset?: () => void }) {
  return (
    <label style={{ display: "block", margin: "8px 0" }}>
      <span style={{ display: "block", fontSize: "0.9rem" }}>{props.label}</span>
      <input
        type={props.type ?? "number"}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(props.type === "text" ? e.target.value : Number(e.target.value))}
        style={inp}
      />
      {props.hint && (
        <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.85rem", color: "#555" }}>
          {props.hint}
          {props.onReset && (
            <button type="button" onClick={props.onReset} style={{ ...btn, padding: "2px 8px", fontSize: "0.85rem", marginTop: 0 }}>
              Vrátiť odporúčanie
            </button>
          )}
        </span>
      )}
    </label>
  );
}

type Preview = { data: AppData; counts: { transactions: number; snapshots: number }; exportedAt: string };

function BackupSection({ repo, data, onChanged, onExported }: { repo: Repository; data: AppData; onChanged: () => void; onExported: (iso: string) => void }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

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
    setPreview({ data: res.data!, counts: res.counts!, exportedAt: (json as { exportedAt: string }).exportedAt });
  };

  const confirmImport = async () => {
    if (!preview) return;
    await repo.replaceAll(preview.data);
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

      {errors.length > 0 && (
        <ul style={{ color: "#8a0000" }}>
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      {preview && (
        <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <p>
            Záloha z {preview.exportedAt.slice(0, 10)}: {preview.counts.transactions} transakcií,{" "}
            {preview.counts.snapshots} vyhodnotení.
          </p>
          <p><strong>Import nahradí všetky aktuálne dáta v tomto zariadení.</strong></p>
          <button onClick={confirmImport} style={btn}>Nahradiť dáta zálohou</button>{" "}
          <button onClick={() => setPreview(null)} style={btn}>Zrušiť</button>
        </div>
      )}

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </section>
  );
}

function HomeSection({ data, lastExport }: { data: AppData; lastExport: string | null }) {
  const s = data.settings ?? DEFAULT_SETTINGS;
  const today = todayIso();
  const latest = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
  const target = targetAmountCents(s.expensesCents, s.withdrawalRate);
  const capital = useMemo(() => currentCapital(latest, data.transactions), [latest, data.transactions]);
  const dateFor = (rate: number) => {
    if (!latest) return null;
    const n = monthsToTargetSplit(capital, s.savingInvCents, s.savingCashCents, rate, target);
    if (n === null) return "Bez sporenia a výnosu sa cieľ nedosiahne";
    if (n === 0) return "Cieľ je dosiahnutý";
    return monthYear(targetDate(latest.date, n));
  };
  const optimistic = dateFor(s.realReturn + 0.02);
  const cautious = dateFor(Math.max(0, s.realReturn - 0.02));
  const base = dateFor(s.realReturn);
  // Predbežný dopad posledných transakcií: stav pri vyhodnotení oproti aktuálnemu (FR-14, FR-04).
  const pending = latest
    ? impactMonthsSplit({ inv: latest.investmentsCents, cash: latest.cashCents }, capital, s.savingInvCents, s.savingCashCents, s.realReturn, target)
    : null;

  return (
    <section style={{ background: "#f7f5f0", padding: 12, borderRadius: 8, marginBottom: 8 }}>
      <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Prehľad</h2>
      {reviewOverdue(latest?.date ?? null, today) && (
        <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>
          Vyhodnotenie za predchádzajúci mesiac ešte nie je urobené. Dátum cieľa sa mení len pri vyhodnotení.
        </p>
      )}
      {backupOverdue(lastExport, today) && (
        <p style={{ background: "#fff4e0", padding: 8, borderRadius: 6 }}>
          Záloha ešte nebola exportovaná alebo je staršia ako 7 dní (FR-19). Dáta sú len v tomto zariadení.
        </p>
      )}
      <p>Cieľová suma: <strong>{eur(target)}</strong></p>
      {latest ? (
        <>
          <p>Dátum cieľa: <strong>{base}</strong></p>
          <p style={{ fontSize: "0.9rem" }}>Rozsah: od {optimistic} do {cautious} (opatrný – základný – optimistický).</p>
          <p>Posledné vyhodnotenie: <strong>{latest.date}</strong></p>
          <p>
            Predbežný dopad posledných transakcií:{" "}
            <strong>{pending === null ? "Bez sporenia a výnosu sa cieľ nedosiahne" : formatImpact(pending)}</strong>
          </p>
        </>
      ) : (
        <p>Zatiaľ nie je vyhodnotenie. Dátum cieľa sa zobrazí po prvom vyhodnotení (L6).</p>
      )}
      <a href="#nova-transakcia" style={{ ...btn, display: "inline-block", textDecoration: "none", color: "inherit", border: "1px solid #888", borderRadius: 4 }}>
        Pridať transakciu
      </a>
    </section>
  );
}
