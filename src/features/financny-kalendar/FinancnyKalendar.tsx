import { useEffect, useState } from "react";
import type { Repository } from "../../storage/repository";
import type { AppData, BudgetCategory, CalendarObligation } from "../../storage/types";
import { BUDGET_CATEGORIES } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import {
  obligationsForMonth,
  newObligation,
  toMonth,
  findNewlyOverdue,
} from "../../domain/calendarObligation";
import { eur, dateSk } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, inp, type NumIn, btnPrimary, btnDanger, card } from "../../ui/kit/controls";
import { hintStyle, calloutStyle } from "../../ui/kit/controls";

/** Finančný kalendár (D-342): povinnosti podľa mesiaca, splatnosť, zaplatenie. */

const STATUS_LABEL: Record<CalendarObligation["status"], string> = {
  caka: "čaká",
  zaplatene: "zaplatené",
  po_splatnosti: "po splatnosti",
};

const STATUS_COLOR: Record<CalendarObligation["status"], string> = {
  caka: "var(--text)",
  zaplatene: "var(--ok)",
  po_splatnosti: "var(--warn)",
};

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const names = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
  return `${names[m - 1]} ${y}`;
}

export function FinancnyKalendar({ repo, data, today, onChanged }: {
  repo: Repository;
  data: AppData;
  today: string;
  onChanged: () => void;
}) {
  const [month, setMonth] = useState(toMonth(today));
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CalendarObligation | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Formulár pre novú/editovanú jednorazovú povinnosť
  const [fName, setFName] = useState("");
  const [fAmount, setFAmount] = useState<NumIn>("");
  const [fDue, setFDue] = useState(`${month}-15`);
  const [fCategory, setFCategory] = useState<BudgetCategory | "">("");
  const [fNote, setFNote] = useState("");
  const [fVs, setFVs] = useState("");

  const obligations = obligationsForMonth(data.recurringExpenses, data.calendarObligations, month, today);

  const totalCents = obligations.reduce((s, o) => s + o.amountCents, 0);
  const paidCents = obligations.filter((o) => o.status === "zaplatene").reduce((s, o) => s + o.amountCents, 0);
  const pendingCents = totalCents - paidCents;

  const openAdd = () => {
    setFName(""); setFAmount(""); setFDue(`${month}-15`); setFCategory(""); setFNote(""); setFVs("");
    setEditing(null);
    setAdding(true);
    setErr(null);
  };

  const openEdit = (o: CalendarObligation) => {
    if (o.recurringExpenseId) return; // iba jednorazové
    setFName(o.name);
    setFAmount(o.amountCents / 100);
    setFDue(o.dueDate);
    setFCategory(o.category);
    setFNote(o.note ?? "");
    setFVs(o.variableSymbol ?? "");
    setEditing(o);
    setAdding(true);
    setErr(null);
  };

  const cancelAdd = () => { setAdding(false); setEditing(null); setErr(null); };

  const saveObligation = async () => {
    const amountNum = asNum(fAmount);
    if (!fName.trim()) { setErr("Zadaj názov."); return; }
    if (fName.trim().length > 80) { setErr("Názov je príliš dlhý (max 80 znakov)."); return; }
    if (!amountNum || amountNum <= 0) { setErr("Zadaj kladnú sumu."); return; }
    if (fCategory === "") { setErr("Vyber kategóriu."); return; }
    if (checkDate(fDue, "2099-12-31", "splatnosť").some((e) => e.includes("tvar"))) { setErr("Neplatný dátum splatnosti."); return; }
    if (fVs && fVs.length > 10) { setErr("Variabilný symbol je príliš dlhý (max 10 znakov)."); return; }

    const now = new Date().toISOString();
    const o: CalendarObligation = editing
      ? { ...editing, name: fName.trim(), amountCents: Math.round(amountNum * 100), category: fCategory as BudgetCategory, dueDate: fDue, note: fNote.trim() || undefined, variableSymbol: fVs.trim() || undefined, updatedAt: now }
      : { ...newObligation({ name: fName.trim(), amountCents: Math.round(amountNum * 100), category: fCategory as BudgetCategory, dueDate: fDue, note: fNote.trim() || undefined, variableSymbol: fVs.trim() || undefined }) };

    try {
      await repo.saveCalendarObligation(o);
      setAdding(false); setEditing(null); setErr(null);
      onChanged();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const markPaid = async (o: CalendarObligation) => {
    const isVirtual = o.id.startsWith("virtual:");
    const now = new Date().toISOString();
    const real: CalendarObligation = isVirtual
      ? { ...o, id: uid(), status: "zaplatene", paidDate: today, updatedAt: now, createdAt: now }
      : { ...o, status: "zaplatene", paidDate: today, updatedAt: now };
    try {
      await repo.saveCalendarObligation(real);
      setErr(null);
      onChanged();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const markUnpaid = async (o: CalendarObligation) => {
    if (o.id.startsWith("virtual:")) return;
    try {
      await repo.saveCalendarObligation({ ...o, status: "caka", paidDate: undefined, updatedAt: new Date().toISOString() });
      setErr(null);
      onChanged();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const removeObligation = async (o: CalendarObligation) => {
    if (o.id.startsWith("virtual:") || o.recurringExpenseId) return;
    try {
      await repo.deleteCalendarObligation(o.id);
      setErr(null);
      onChanged();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  useEffect(() => {
    const overdue = findNewlyOverdue(data.calendarObligations, today);
    if (!overdue.length) return;
    void (async () => {
      try {
        for (const o of overdue) {
          await repo.saveCalendarObligation({ ...o, status: "po_splatnosti", updatedAt: new Date().toISOString() });
        }
        onChanged();
      } catch {
        setErr(STORAGE_ERROR);
      }
    })();
  }, [data.calendarObligations, today, repo, onChanged]);

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Platobné povinnosti: predplatné, splátky, dane, poistky. Stav platby eviduj tu; transakciu zapisuj v sekcii Transakcie.
      </p>

      {/* Navigácia mesiacov */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button style={btn} onClick={() => setMonth(prevMonth(month))}>◀</button>
        <strong style={{ minWidth: 160, textAlign: "center" }}>{monthLabel(month)}</strong>
        <button style={btn} onClick={() => setMonth(nextMonth(month))}>▶</button>
        <button style={{ ...btn, marginLeft: "auto" }} onClick={() => setMonth(toMonth(today))}>Tento mesiac</button>
      </div>

      {/* Súhrn */}
      <p style={{ margin: "0 0 12px" }}>
        Spolu: <strong>{eur(totalCents)}</strong>
        {" · "}zaplatené: <strong style={{ color: "var(--ok)" }}>{eur(paidCents)}</strong>
        {" · "}zostatok: <strong>{eur(pendingCents)}</strong>
      </p>

      {err && !adding && <p role="alert" style={{ color: "var(--warn)" }}>{err}</p>}

      {/* Zoznam povinností */}
      {obligations.length === 0 && (
        <p style={hintStyle}>Žiadne povinnosti v tomto mesiaci.</p>
      )}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {obligations.map((o) => (
          <li key={o.id} style={{ ...card, marginBottom: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <strong>{o.name}</strong>
                {o.recurringExpenseId && <span style={{ color: "var(--muted)", fontSize: "0.85em" }}> · pravidelný</span>}
                <div style={{ fontSize: "0.85em", color: "var(--muted)" }}>
                  Splatnosť: {dateSk(o.dueDate)} · {o.category}
                  {o.variableSymbol && <span> · VS: {o.variableSymbol}</span>}
                  {o.note && <span> · {o.note}</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600 }}>{eur(o.amountCents)}</span>
                <span style={{ color: STATUS_COLOR[o.status], fontSize: "0.85em" }}>{STATUS_LABEL[o.status]}</span>
                {o.status !== "zaplatene" && (
                  <button style={btnPrimary} onClick={() => markPaid(o)}>Zaplatené</button>
                )}
                {o.status === "zaplatene" && !o.id.startsWith("virtual:") && (
                  <button style={btn} onClick={() => markUnpaid(o)}>Zrušiť</button>
                )}
                {!o.recurringExpenseId && !o.id.startsWith("virtual:") && (
                  <>
                    <button style={btn} onClick={() => openEdit(o)}>Upraviť</button>
                    <button style={btnDanger} onClick={() => removeObligation(o)}>Zmazať</button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Formulár na pridanie/úpravu jednorazovej povinnosti */}
      {adding ? (
        <div style={{ ...card, marginTop: 16, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>{editing ? "Upraviť povinnosť" : "Nová povinnosť"}</h3>
          <Field label="Názov (napr. Poistenie auta)" value={fName} type="text" onChange={setFName} maxLength={80} />
          <Field label="Suma (€)" value={fAmount} onChange={setFAmount} />
          <Field label="Dátum splatnosti" value={fDue} type="date" onChange={(v) => setFDue(String(v))} />
          <label style={{ display: "block", marginBottom: 8 }}>
            Kategória
            <select style={{ ...inp, display: "block", width: "100%", marginTop: 2 }} value={fCategory} onChange={(e) => setFCategory(e.target.value as BudgetCategory | "")}>
              <option value="">— vyber —</option>
              {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <Field label="Poznámka (voliteľné)" value={fNote} type="text" onChange={(v) => setFNote(String(v))} maxLength={200} />
          <Field label="Variabilný symbol (voliteľné, max 10 znakov)" value={fVs} type="text" onChange={(v) => setFVs(String(v))} maxLength={10} />
          {err && <p role="alert" style={{ color: "var(--warn)" }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button style={btnPrimary} onClick={saveObligation}>Uložiť</button>
            <button style={btn} onClick={cancelAdd}>Zrušiť</button>
          </div>
        </div>
      ) : (
        <button style={{ ...btn, marginTop: 12 }} onClick={openAdd}>+ Pridať jednorazovú povinnosť</button>
      )}

    </section>
  );
}
