import { useState } from "react";
import type { Repository } from "../../storage/repository";
import { BUDGET_CATEGORIES, RECURRING_FREQUENCIES, type BudgetCategory, type RecurringExpense, type RecurringFrequency } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import { annualRecurringTotalCents, endingSoon, isRecurringActive, monthlyRecurringByCategory, monthlyRecurringTotalCents, monthlyShareCents } from "../../domain/recurring";
import { cents, dateSk, eur } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";
import { NextStep } from "../../ui/kit/NextStep";
import { hintStyle } from "../../ui/kit/controls";

/** Pravidelné výdavky (D-124): zoznam, súčet za mesiac a podľa kategórie, ukončenie. Iba zobrazenie výpočtov. Feature „pravidelne“ (docs/23). */

const RECURRING_FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  mesacne: "mesačne",
  rocne: "ročne",
};

/** Pravidelné výdavky (D-124): zoznam, súčet za mesiac a podľa kategórie. Iba zobrazenie. */
export function RecurringSection({ repo, items, today, onSaved }: { repo: Repository; items: RecurringExpense[]; today: string; onSaved: () => void }) {
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
      {items.length > 0 && (
        <p style={hintStyle}>Pravidelné výdavky sa berú do rozpočtu podľa kategórie. <NextStep to="rozpocet">Rozpočet</NextStep></p>
      )}
      {items.length === 0 && editing === null && <p>Zatiaľ nie sú zapísané pravidelné výdavky.</p>}
      {items.map((e) => (
        <div key={e.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{e.name}</strong> · {e.category}</p>
          <p style={{ margin: "4px 0" }}>
            {eur(e.amountCents)} {RECURRING_FREQUENCY_LABEL[e.frequency]}
            {e.frequency === "rocne" ? ` (≈ ${eur(monthlyShareCents(e))} mesačne)` : ""}
          </p>
          <p style={{ margin: "4px 0", fontSize: "var(--font-small)", color: "var(--muted)" }}>
            Od {dateSk(e.startDate)}{e.endDate ? `, do ${dateSk(e.endDate)}` : ""}{isRecurringActive(e, today) ? "" : " · dnes neplatí"}
          </p>
          {endingSoon(e, today) && (
            <p style={{ margin: "4px 0", color: "var(--danger)", fontSize: "var(--font-small)" }}>Koniec platnosti o menej ako 30 dní. Ak sa platba obnoví, upravte koniec.</p>
          )}
          {confirmId === e.id ? (
            <div>
              <p>Naozaj zmazať pravidelný výdavok „{e.name}“?</p>
              <button onClick={() => remove(e.id)} style={btnDanger}>Zmazať</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => setEditing(e)} style={btn}>Upraviť</button>{" "}
              {isRecurringActive(e, today) && (e.endDate === undefined || e.endDate > today) && (
                <button onClick={() => endNow(e)} style={btn}>Ukončiť od zajtra</button>
              )}{" "}
              <button onClick={() => setConfirmId(e.id)} style={btnDanger}>Zmazať</button>
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
        <button onClick={() => setEditing("new")} style={btnPrimary}>Pridať pravidelný výdavok</button>
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
      <h4 style={{ fontSize: "var(--font-text)", marginTop: 0 }}>{initial ? "Upraviť pravidelný výdavok" : "Nový pravidelný výdavok"}</h4>
      <Field label="Názov (napr. predplatné)" value={name} type="text" onChange={setName} maxLength={80} />
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
      <button onClick={save} style={btnPrimary}>Uložiť výdavok</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
