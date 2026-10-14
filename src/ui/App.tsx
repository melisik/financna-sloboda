import { useMemo, useState } from "react";
import { targetAmountCents } from "../domain/goal";
import { formatImpact } from "../domain/impact";
import {
  Capital,
  impactMonthsSplit,
  monthsToTargetSplit,
  payFromCash,
  payFromInvestments,
  transferToInvestments,
} from "../domain/capital";
import { targetDate } from "../domain/goal";

const MONTHS = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];

/** Dátum „mesiac rok“ podľa FR-06 (napr. „august 2054“). */
function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

type Source = "income" | "cash" | "investments";

export function App() {
  // Vstupy v eurách (zobrazenie); výpočty v centoch (05 §4).
  const [expenses, setExpenses] = useState(24000);
  const [withdrawalPct, setWithdrawalPct] = useState(3.7);
  const [returnPct, setReturnPct] = useState(3.5);
  const [capitalInv, setCapitalInv] = useState(100000);
  const [capitalCash, setCapitalCash] = useState(20000);
  const [savingInv, setSavingInv] = useState(500);
  const [savingCash, setSavingCash] = useState(0);
  const [reserve, setReserve] = useState(6000);
  const [lastReview, setLastReview] = useState("2026-10-14");

  // Náhľady (predbežné, nemenia oficiálny cieľ, D-014).
  const [expAmount, setExpAmount] = useState(15000);
  const [expSource, setExpSource] = useState<Source>("cash");
  const [transferAmount, setTransferAmount] = useState(5000);

  const cents = (x: number) => Math.round(x * 100);
  const targetC = useMemo(
    () => targetAmountCents(cents(expenses), withdrawalPct / 100),
    [expenses, withdrawalPct],
  );

  const base: Capital = { inv: cents(capitalInv), cash: cents(capitalCash) };
  const mInv = cents(savingInv);
  const mCash = cents(savingCash);
  const r = returnPct / 100;

  const scenario = (rate: number) => {
    const n = monthsToTargetSplit(base, mInv, mCash, rate, targetC);
    if (n === null) return "Bez sporenia a výnosu sa cieľ nedosiahne";
    if (n === 0) return "Cieľ je dosiahnutý";
    return formatMonthYear(targetDate(lastReview, n));
  };

  // Náhľad výdavku alebo presunu.
  const preview = useMemo(() => {
    const res = { after: base as Capital | null, message: "", warning: false };
    if (expSource === "income") {
      res.message = "Výdavok z príjmu nemení kapitál.";
    } else if (expSource === "cash") {
      const r1 = payFromCash(base, cents(expAmount), cents(reserve));
      if (r1.ok) res.after = r1.capital;
      else {
        res.after = null;
        res.message = "Hotovosť by klesla pod rezervu. Zvoľ zdroj „z investícií“.";
      }
    } else {
      const r1 = payFromInvestments(base, cents(expAmount));
      if (r1.ok) {
        res.after = r1.capital;
        if (r1.warning === "exhausted") {
          res.warning = true;
          res.message = "Investície by nestačili; kapitál je 0 €.";
        }
      }
    }
    return res;
  }, [base.inv, base.cash, expAmount, expSource, reserve]);

  const expenseImpact =
    preview.after === null
      ? null
      : impactMonthsSplit(base, preview.after, mInv, mCash, r, targetC);

  // Presun hotovosti do investícií (doinvestovanie, D-045).
  const transfer = transferToInvestments(base, cents(transferAmount), cents(reserve));
  const transferImpact = transfer.ok
    ? impactMonthsSplit(base, transfer.capital, mInv, mCash, r, targetC)
    : null;

  const eur = (c: number) => `${(c / 100).toLocaleString("sk-SK", { maximumFractionDigits: 0 })} €`;

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
        <Field label="Mesačné sporenie do hotovosti (€)" value={savingCash} onChange={setSavingCash} />
        <Field label="Rezerva (€)" value={reserve} onChange={setReserve} />
        <Field label="Posledné vyhodnotenie D_L (RRRR-MM-DD)" value={lastReview} onChange={setLastReview} type="text" />
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem" }}>Cieľ</h2>
        <p>Cieľová suma: <strong>{eur(targetC)}</strong></p>
        <ul>
          <li>Opatrný (r − 2 p. b.): {scenario(Math.max(0, r - 0.02))}</li>
          <li>Základný (r): {scenario(r)}</li>
          <li>Optimistický (r + 2 p. b.): {scenario(r + 0.02)}</li>
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem" }}>Výdavok (náhľad)</h2>
        <Field label="Suma výdavku (€)" value={expAmount} onChange={setExpAmount} />
        <label style={{ display: "block", margin: "8px 0" }}>
          <span style={{ display: "block", fontSize: "0.9rem" }}>Zdroj úhrady</span>
          <select value={expSource} onChange={(e) => setExpSource(e.target.value as Source)} style={{ width: "100%", padding: "8px", fontSize: "1rem" }}>
            <option value="income">z príjmu</option>
            <option value="cash">z hotovosti</option>
            <option value="investments">z investícií</option>
          </select>
        </label>
        {preview.message && <p style={{ color: preview.warning ? "#8a4b00" : "#8a0000" }}>{preview.message}</p>}
        {preview.after && (
          <p>
            Predbežný dopad: <strong>{expenseImpact === null ? "Bez sporenia a výnosu sa cieľ nedosiahne" : formatImpact(expenseImpact)}</strong>
          </p>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem" }}>Presun do investícií (náhľad)</h2>
        <Field label="Suma presunu z hotovosti (€)" value={transferAmount} onChange={setTransferAmount} />
        {!transfer.ok && <p style={{ color: "#8a0000" }}>Hotovosť by klesla pod rezervu.</p>}
        {transfer.ok && transferImpact !== null && (
          <p>Predbežný dopad: <strong>{formatImpact(transferImpact)}</strong> (K sa nemení, mení sa rozdelenie).</p>
        )}
      </section>

      <p style={{ color: "#555", fontSize: "0.9rem" }}>
        Náhľady ukazujú predbežný dopad. Oficiálny cieľ sa mení až pri vyhodnotení (D-014).
      </p>
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
