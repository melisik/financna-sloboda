import { useMemo, useState } from "react";
import { targetAmountCents, monthsToTarget, targetDate } from "../domain/goal";
import { formatImpact, impactMonths } from "../domain/impact";

const MONTHS = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];

/** Dátum „mesiac rok“ podľa FR-06 (napr. „august 2054“). */
function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Celé mesiace od dneška do dátumu cieľa (zostávajúci čas, D-024). */
function monthsLeft(todayIso: string, targetIso: string): number {
  const [ty, tm] = todayIso.split("-").map(Number);
  const [gy, gm] = targetIso.split("-").map(Number);
  return (gy - ty) * 12 + (gm - tm);
}

/** Vstupy v eurách (zobrazenie), výpočty v centoch (05 §4). */
export function App() {
  const [expenses, setExpenses] = useState(24000);
  const [withdrawalPct, setWithdrawalPct] = useState(3.7);
  const [returnPct, setReturnPct] = useState(3.5);
  const [capitalInv, setCapitalInv] = useState(100000);
  const [capitalCash, setCapitalCash] = useState(20000);
  const [savingInv, setSavingInv] = useState(500);
  const [lastReview, setLastReview] = useState("2026-10-14");
  const [pending, setPending] = useState(5000);
  const today = new Date().toISOString().slice(0, 10);

  const view = useMemo(() => {
    const cents = (x: number) => Math.round(x * 100);
    const targetC = targetAmountCents(cents(expenses), withdrawalPct / 100);
    // Prototyp: m ide len do K_inv; m_cash sa zatiaľ nepočíta (O-11 / D-046 v ďalšom kroku).
    const kInv = cents(capitalInv);
    const kCash = cents(capitalCash);
    const m = cents(savingInv);
    const remainingTarget = Math.max(0, targetC - kCash); // T − K_cash (D-036, D-039)

    const scenario = (rate: number) => {
      const n = monthsToTarget(kInv, m, rate, remainingTarget);
      if (n === null) return { label: "Bez sporenia a výnosu sa cieľ nedosiahne", date: null, n: null };
      if (n === 0) return { label: "Cieľ je dosiahnutý", date: null, n: 0 };
      return { label: formatMonthYear(targetDate(lastReview, n)), date: targetDate(lastReview, n), n };
    };

    const r = returnPct / 100;
    const cautious = scenario(Math.max(0, r - 0.02));
    const base = scenario(r);
    const optimistic = scenario(r + 0.02);

    const impact = impactMonths(kInv, kInv + cents(pending), m, r, remainingTarget);

    return { targetC, cautious, base, optimistic, impact };
  }, [expenses, withdrawalPct, returnPct, capitalInv, capitalCash, savingInv, lastReview, pending]);

  const eurFmt = (cents: number) => `${(cents / 100).toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €`;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "16px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: "1.5rem" }}>Finančná sloboda (prototyp)</h1>
      <p style={{ color: "#555" }}>Syntetické údaje. Výpočet je pred daňou a poplatkami (D-043, D-050).</p>

      <section>
        <h2 style={{ fontSize: "1.1rem" }}>Vstupy</h2>
        <Field label="Ročné výdavky pri nezávislosti (€)" value={expenses} onChange={setExpenses} />
        <Field label="Miera výberu (%)" value={withdrawalPct} onChange={setWithdrawalPct} step={0.1} />
        <Field label="Reálny výnos r (%)" value={returnPct} onChange={setReturnPct} step={0.1} />
        <Field label="Investovaný kapitál K_inv (€)" value={capitalInv} onChange={setCapitalInv} />
        <Field label="Hotovosť K_cash (€)" value={capitalCash} onChange={setCapitalCash} />
        <Field label="Mesačné sporenie do investícií (€)" value={savingInv} onChange={setSavingInv} />
        <Field label="Posledné vyhodnotenie D_L (RRRR-MM-DD)" value={lastReview} onChange={setLastReview} type="text" />
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem" }}>Cieľ</h2>
        <p>Cieľová suma: <strong>{eurFmt(view.targetC)}</strong></p>
        <ul>
          <li>Opatrný (r − 2 p. b.): {view.cautious.label}</li>
          <li>Základný (r): {view.base.label}</li>
          <li>Optimistický (r + 2 p. b.): {view.optimistic.label}</li>
        </ul>
        {view.base.date && (
          <p>Zostáva približne {monthsLeft(today, view.base.date)} mesiacov od dneška (dátum platí k D_L).</p>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem" }}>Predbežný dopad</h2>
        <Field label="Nová investícia po D_L (€)" value={pending} onChange={setPending} />
        <p><strong>{view.impact === null ? "Bez sporenia a výnosu sa cieľ nedosiahne" : formatImpact(view.impact)}</strong></p>
        <p style={{ color: "#555", fontSize: "0.9rem" }}>Ukazuje len predbežný dopad. Oficiálny cieľ sa mení až pri vyhodnotení (D-014).</p>
      </section>
    </main>
  );
}

function Field(props: { label: string; value: number | string; onChange: (v: any) => void; step?: number; type?: string }) {
  return (
    <label style={{ display: "block", margin: "8px 0" }}>
      <span style={{ display: "block", fontSize: "0.9rem" }}>{props.label}</span>
      <input
        type={props.type ?? "number"}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(props.type === "text" ? e.target.value : Number(e.target.value))}
        style={{ width: "100%", padding: "8px", fontSize: "1rem", boxSizing: "border-box" }}
      />
    </label>
  );
}
