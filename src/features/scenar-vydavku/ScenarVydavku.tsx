import { useState } from "react";
import type { Ctx } from "../../domain/context";
import { INVESTMENTS_EXHAUSTED_TEXT } from "../../domain/capital";
import { bigExpenseScenario, type ExpenseScenarioOutcome } from "../../domain/expenseScenario";
import { goalDisplay } from "../../domain/goalDisplay";
import { goalDateText } from "../../domain/goalText";
import { formatImpactOutcome } from "../../domain/impact";
import { SOURCES, type Source } from "../../storage/types";
import { cents, monthYear, todayIso } from "../../ui/kit/format";
import { Field, asNum, inp, type NumIn } from "../../ui/kit/controls";
import { NextStep } from "../../ui/kit/NextStep";
import { card, hintStyle } from "../../ui/kit/controls";

const SOURCE_LABEL: Record<Source, string> = { z_prijmu: "z príjmu", z_hotovosti: "z hotovosti", z_investicii: "z investícií" };

/** Scenár veľkého výdavku (N-12, docs/36). Nič sa neukladá: výsledok existuje len na obrazovke. */
export function ScenarVydavkuSection({ ctx }: { ctx: Ctx }) {
  const [amount, setAmount] = useState<NumIn>("");
  const [source, setSource] = useState<Source>("z_hotovosti");
  if (!ctx.latest || ctx.target === null) {
    const text =
      ctx.target === null && !ctx.latest
        ? "Dopad sa dá vyčísliť až po nastaveniach a vyhodnotení."
        : ctx.target === null
          ? "Dopad sa dá vyčísliť až po nastaveniach."
          : "Dopad sa dá vyčísliť až po vyhodnotení.";
    return (
      <div>
        <p>{text}</p>
        {ctx.target === null && <NextStep to="nastavenia">Nastavenia</NextStep>}
        {!ctx.latest && <NextStep to="vyhodnotenie">Vyhodnotenie</NextStep>}
      </div>
    );
  }
  const today = todayIso();
  const savingZero = ctx.mInv + ctx.mCash === 0;
  const a = asNum(amount);
  const outcome: ExpenseScenarioOutcome | null =
    Number.isNaN(a) || a <= 0
      ? null
      : bigExpenseScenario({
          base: ctx.capital,
          amountCents: cents(a),
          source,
          mInv: ctx.mInv,
          mCash: ctx.mCash,
          realReturn: ctx.realReturn,
          targetCents: ctx.target,
          rentals: ctx.rentals,
        });
  return (
    <div>
      <p style={{ color: "var(--muted)" }}>Zisti, ako by veľký výdavok posunul dátum cieľa nezávislosti. Nič sa neukladá a nevznikne transakcia.</p>
      <Field label="Suma (€)" value={amount} onChange={setAmount} />
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "var(--font-small)" }}>Zdroj</span>
        <select aria-label="Zdroj" value={source} onChange={(e) => setSource(e.target.value as Source)} style={inp}>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
          ))}
        </select>
      </label>
      {outcome === null && <p>Zadaj sumu, aby sa ukázal dopad.</p>}
      {outcome && !outcome.ok && (
        <p role="alert">
          {outcome.reason === "insufficient_cash" ? "Hotovosti nestačí na tento výdavok. Zvoľ zdroj „z investícií“." : "Zadaj sumu väčšiu ako nula."}
        </p>
      )}
      {outcome && outcome.ok && (
        <div style={card}>
          {outcome.exhausted && <p role="note">{INVESTMENTS_EXHAUSTED_TEXT}</p>}
          {!outcome.exhausted && <p style={{ margin: "4px 0" }}>Predbežný dopad: <strong>{formatImpactOutcome(outcome.impact)}</strong></p>}
          {outcome.monthsBefore !== null && outcome.monthsAfter !== null && !outcome.exhausted && (
            <>
              <p style={{ margin: "4px 0" }}>
                Dátum cieľa bez výdavku: <strong>{goalDateText(goalDisplay(outcome.monthsBefore, today, today), savingZero, monthYear)}</strong>
              </p>
              <p style={{ margin: "4px 0" }}>
                Dátum cieľa s výdavkom: <strong>{goalDateText(goalDisplay(outcome.monthsAfter, today, today), savingZero, monthYear)}</strong>
              </p>
            </>
          )}
        </div>
      )}
      <p style={hintStyle}>Odhad je pred daňou, po poplatkoch, ak ich zadáš, a nie je finančným poradenstvom.</p>
    </div>
  );
}
