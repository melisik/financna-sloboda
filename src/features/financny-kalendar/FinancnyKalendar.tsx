import { useState } from "react";
import type { Repository } from "../../storage/repository";
import type { AppData, CalendarObligation } from "../../storage/types";
import { obligationsForMonth, toMonth } from "../../domain/calendarObligation";
import { eur, dateSk } from "../../ui/kit/format";
import { btn, card, hintStyle } from "../../ui/kit/controls";
import { STORAGE_ERROR } from "../../ui/kit/messages";

/** Finančný kalendár (D-345): zobrazenie mesačných povinností podľa stavu. */

/** Výber a zobrazenie mesiaca. */
function MonthPicker({ month, onMonthChange }: { month: string; onMonthChange: (m: string) => void }) {
  const monthLabel = (() => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, m - 1);
    return date.toLocaleDateString("sk-SK", { year: "numeric", month: "long" });
  })();

  const prevMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const p = m === 1 ? new Date(y - 1, 11, 1) : new Date(y, m - 1, 1);
    onMonthChange(`${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const n = m === 12 ? new Date(y + 1, 0, 1) : new Date(y, m, 1);
    onMonthChange(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`);
  };
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
      <button onClick={prevMonth} style={btn}>◀</button>
      <span style={{ fontSize: "var(--font-heading)", fontWeight: 700, minWidth: 150, textAlign: "center" }}>{monthLabel}</span>
      <button onClick={nextMonth} style={btn}>▶</button>
    </div>
  );
}

/** Jedno skupinu povinností (čaká, zaplatená, po_splatnosti). */
function ObligationGroup({
  repo,
  obligations,
  status,
  label,
  today,
  onChanged,
}: {
  repo: Repository;
  obligations: CalendarObligation[];
  status: "caka" | "zaplatene" | "po_splatnosti";
  label: string;
  today: string;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePaid = async (o: CalendarObligation) => {
    setSaving(true);
    setError(null);
    try {
      if (o.id.startsWith("virtual:")) {
        setError("Virtuálne povinnosti sa nemôžu označiť bez transakcie.");
        setSaving(false);
        return;
      }
      const updated = o.status === "zaplatene"
        ? { ...o, status: "caka" as const, paidDate: undefined, transactionId: undefined, updatedAt: new Date().toISOString() }
        : { ...o, status: "zaplatene" as const, paidDate: today, updatedAt: new Date().toISOString() };
      await repo.saveCalendarObligation(updated);
      onChanged();
    } catch {
      setError(STORAGE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  if (obligations.length === 0) return null;

  const isVirtual = obligations.some((o) => o.id.startsWith("virtual:"));

  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: "12px 0 8px 0", fontSize: "var(--font-body)" }}>
        {label} ({obligations.length})
      </h3>
      {error && <p style={{ color: "var(--danger)", marginTop: 8 }}>{error}</p>}
      {obligations.map((o) => (
        <div key={o.id} style={{ ...card, marginBottom: 8, opacity: isVirtual && o.id.startsWith("virtual:") ? 0.8 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px 0", fontWeight: 700 }}>{o.name}</p>
              <p style={{ margin: "0 0 4px 0", color: "var(--muted)", fontSize: "var(--font-small)" }}>
                {o.category} · {eur(o.amountCents)}
              </p>
              <p style={{ margin: "0 0 4px 0", color: "var(--muted)", fontSize: "var(--font-small)" }}>
                Splatnosť: {dateSk(o.dueDate)}
              </p>
              {o.note && <p style={{ margin: "4px 0", color: "var(--muted)", fontSize: "var(--font-small)" }}>{o.note}</p>}
            </div>
            <button
              onClick={() => togglePaid(o)}
              disabled={saving || o.id.startsWith("virtual:")}
              style={{
                ...btn,
                marginTop: 0,
                background: o.status === "zaplatene" ? "var(--ok-bg)" : "var(--surface)",
                color: o.status === "zaplatene" ? "var(--ok)" : "inherit",
              }}
            >
              {o.status === "zaplatene" ? "Zaplatená ✓" : "Označiť"}
            </button>
          </div>
        </div>
      ))}
      {isVirtual && (
        <p style={hintStyle}>
          Povinnosti z pravidelných výdavkov sa generujú automaticky z mesiacami a zobrazujú sa len ako odvodené záznamy.
        </p>
      )}
    </div>
  );
}

/** Finančný kalendár: mesiace a povinnosti podľa stavu. */
export function CalendarSection({
  repo,
  data,
  today,
  onSaved,
}: {
  repo: Repository;
  data: AppData;
  today: string;
  onSaved: () => void;
}) {
  const [month, setMonth] = useState(() => toMonth(today));

  const all = obligationsForMonth(data.recurringExpenses, data.calendarObligations ?? [], month, today);
  const waiting = all.filter((o) => o.status === "caka");
  const paid = all.filter((o) => o.status === "zaplatene");
  const overdue = all.filter((o) => o.status === "po_splatnosti");

  const totalWaiting = waiting.reduce((sum, o) => sum + o.amountCents, 0);
  const totalOverdue = overdue.reduce((sum, o) => sum + o.amountCents, 0);

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Finančné povinnosti za mesiac: záväzky z pravidelných výdavkov a jednorazové povinnosti. Virtuálne (z pravidelných výdavkov) sa zobrazujú len na prehľad a neukladajú sa.
      </p>
      <MonthPicker month={month} onMonthChange={setMonth} />
      {waiting.length + paid.length + overdue.length === 0 ? (
        <p style={{ color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>Žiadne povinnosti na tento mesiac.</p>
      ) : (
        <>
          {waiting.length > 0 && (
            <p style={{ marginBottom: 8, fontSize: "var(--font-small)" }}>
              <strong>Čakajúce:</strong> {eur(totalWaiting)}
            </p>
          )}
          {overdue.length > 0 && (
            <p style={{ marginBottom: 8, fontSize: "var(--font-small)", color: "var(--danger)" }}>
              <strong>Omeškané:</strong> {eur(totalOverdue)}
            </p>
          )}
          <ObligationGroup
            repo={repo}
            obligations={waiting}
            status="caka"
            label="Čakajúce"
            today={today}
            onChanged={onSaved}
          />
          <ObligationGroup
            repo={repo}
            obligations={overdue}
            status="po_splatnosti"
            label="Omeškané"
            today={today}
            onChanged={onSaved}
          />
          <ObligationGroup
            repo={repo}
            obligations={paid}
            status="zaplatene"
            label="Zaplatené"
            today={today}
            onChanged={onSaved}
          />
        </>
      )}
    </section>
  );
}
