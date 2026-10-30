import { useEffect, useRef, useState } from "react";
import type { Repository } from "../../storage/repository";
import type { AppData, BudgetCategory, CalendarObligation, Source } from "../../storage/types";
import { BUDGET_CATEGORIES, SOURCES } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import {
  CalendarLinkError,
  applyPayment,
  buildPaymentTransaction,
  defaultPaymentNote,
  obligationsForMonth,
  newObligation,
  toMonth,
  findNewlyOverdue,
} from "../../domain/calendarObligation";
import { cents, eur, dateSk } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, inp, type NumIn, btnPrimary, btnDanger, card } from "../../ui/kit/controls";
import { hintStyle, calloutStyle } from "../../ui/kit/controls";

/** Finančný kalendár (D-345): povinnosti podľa mesiaca, splatnosť, zaplatenie. */

const STATUS_LABEL: Record<CalendarObligation["status"], string> = {
  caka: "čaká na úhradu",
  zaplatene: "zaplatené",
  po_splatnosti: "po splatnosti",
};

const SOURCE_LABEL: Record<Source, string> = { z_prijmu: "z príjmu", z_hotovosti: "z hotovosti", z_investicii: "z investícií" };

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
  const [info, setInfo] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<{ id: string; date: string; amount: NumIn; source: Source; note: string } | null>(null);
  const [unpayFor, setUnpayFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

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

  const failMessage = (e: unknown) => (e instanceof CalendarLinkError ? e.message : STORAGE_ERROR);

  const startPay = (o: CalendarObligation) => {
    setUnpayFor(null);
    setErr(null);
    setInfo(null);
    setPayFor({ id: o.id, date: today, amount: o.amountCents / 100, source: "z_prijmu", note: defaultPaymentNote(o) });
  };

  // Transakcia a zaplatená povinnosť sa zapíšu atómovo v úložisku; busyRef bráni opakovanému kliknutiu (D-345).
  const confirmPay = async (o: CalendarObligation) => {
    if (!payFor || busyRef.current) return;
    const amount = asNum(payFor.amount);
    if (Number.isNaN(amount) || !(amount > 0)) return setErr("Suma musí byť kladná.");
    const dateErr = checkDate(payFor.date, today, "dátum platby");
    if (dateErr.length) return setErr(dateErr[0]);
    busyRef.current = true;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const base: CalendarObligation = o.id.startsWith("virtual:") ? { ...o, id: uid(), createdAt: now } : o;
      const t = buildPaymentTransaction(base, { date: payFor.date, amountCents: cents(amount), source: payFor.source, note: payFor.note }, now);
      const { created } = await repo.payCalendarObligation(applyPayment(base, t, payFor.date, now), t);
      setErr(null);
      setPayFor(null);
      setInfo(created ? "Transakcia bola vytvorená a povinnosť je označená ako zaplatená." : "Povinnosť je už zaplatená. Nová transakcia nevznikla.");
      onChanged();
    } catch (e) {
      setErr(failMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const confirmUnpay = async (o: CalendarObligation) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await repo.unpayCalendarObligation(o.id);
      setErr(null);
      setUnpayFor(null);
      setInfo(o.transactionId ? "Zaplatenie bolo zrušené. Súvisiaca transakcia bola odstránená z histórie." : "Zaplatenie bolo zrušené.");
      onChanged();
    } catch (e) {
      setUnpayFor(null);
      setErr(failMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
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
        // Atomicky nad aktuálnymi záznamami: zaplatená povinnosť sa starým snímkom neprepíše.
        const changed = await repo.markCalendarObligationsOverdue(overdue.map((o) => o.id), today);
        if (changed > 0) onChanged();
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

      {info && <p role="status" style={{ color: "var(--ok)" }}>{info}</p>}
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
                  <button style={btnPrimary} disabled={busy} onClick={() => startPay(o)}>Zaplatené</button>
                )}
                {o.status === "zaplatene" && !o.id.startsWith("virtual:") && (
                  <button style={btn} disabled={busy} onClick={() => { setPayFor(null); setInfo(null); setErr(null); setUnpayFor(o.id); }}>Zrušiť zaplatenie</button>
                )}
                {!o.recurringExpenseId && !o.id.startsWith("virtual:") && o.transactionId === undefined && (
                  <>
                    <button style={btn} onClick={() => openEdit(o)}>Upraviť</button>
                    <button style={btnDanger} onClick={() => removeObligation(o)}>Zmazať</button>
                  </>
                )}
              </div>
            </div>
            {o.transactionId !== undefined && (
              <div style={{ fontSize: "0.85em", color: "var(--muted)", marginTop: 4 }}>
                Zaplatené {o.paidDate ? dateSk(o.paidDate) : ""} · prepojená s transakciou v sekcii Transakcie
              </div>
            )}
            {payFor?.id === o.id && (
              <div role="group" aria-label="Potvrdenie vytvorenia transakcie" style={{ ...calloutStyle("warn"), marginTop: 8 }}>
                <p style={{ margin: 0 }}><strong>Vytvoriť transakciu (výdavok) k povinnosti „{o.name}“?</strong> Až po potvrdení sa povinnosť označí ako zaplatená.</p>
                <Field label="Suma (€)" value={payFor.amount} onChange={(v) => setPayFor({ ...payFor, amount: v })} />
                <Field label="Dátum platby" value={payFor.date} type="date" onChange={(v) => setPayFor({ ...payFor, date: String(v) })} />
                <label style={{ display: "block", marginBottom: 8 }}>
                  Zdroj úhrady
                  <select style={{ ...inp, display: "block", width: "100%", marginTop: 2 }} value={payFor.source} onChange={(e) => setPayFor({ ...payFor, source: e.target.value as Source })}>
                    {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
                  </select>
                </label>
                <Field label="Poznámka" value={payFor.note} type="text" onChange={(v) => setPayFor({ ...payFor, note: String(v) })} maxLength={200} />
                <p style={{ margin: "4px 0", color: "var(--muted)" }}>Kategória: {o.category}</p>
                <button style={btnPrimary} disabled={busy} onClick={() => confirmPay(o)}>Vytvoriť transakciu a označiť ako zaplatené</button>{" "}
                <button style={btn} disabled={busy} onClick={() => { setPayFor(null); setErr(null); }}>Zrušiť</button>
              </div>
            )}
            {unpayFor === o.id && (
              <div role="alertdialog" aria-label="Potvrdenie zrušenia zaplatenia" style={{ ...calloutStyle("error"), marginTop: 8, border: "2px solid var(--danger)" }}>
                <p style={{ margin: 0 }}><strong>Zrušiť zaplatenie povinnosti „{o.name}“?</strong></p>
                <p style={{ margin: "4px 0" }}>
                  {o.transactionId !== undefined
                    ? "Súvisiaca transakcia sa odstráni z histórie (aj jej prílohy) a povinnosť sa vráti do stavu „Čaká na úhradu“. Odstráni sa len táto jedna transakcia."
                    : "K tejto platbe nie je evidovaná žiadna transakcia, preto sa nič nemaže. Povinnosť sa len vráti do stavu „Čaká na úhradu“."}
                </p>
                <button style={btnDanger} disabled={busy} onClick={() => confirmUnpay(o)}>Áno, zrušiť zaplatenie</button>{" "}
                <button style={btn} disabled={busy} onClick={() => setUnpayFor(null)}>Ponechať zaplatené</button>
              </div>
            )}
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
