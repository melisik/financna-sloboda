import { useState } from "react";
import type { Ctx } from "../../domain/context";
import { monthlyExpenseScenario, type MonthlyExpenseOutcome } from "../../domain/monthlyExpense";
import { goalDisplay } from "../../domain/goalDisplay";
import { goalDateText } from "../../domain/goalText";
import { UNREACHABLE_IMPACT_TEXT, formatImpactOutcome } from "../../domain/impact";
import { cents, eur, monthYear, todayIso } from "../../ui/kit/format";
import { Field, asNum, type NumIn } from "../../ui/kit/controls";
import { NextStep } from "../../ui/kit/NextStep";
import { card, hintStyle } from "../../ui/kit/controls";
import type { AppData } from "../../storage/types";
import { OpakovaneVydavkyBlock } from "./OpakovaneVydavky";

/** Mesačný výdavok (N-12b, docs/37). Nič sa neukladá: výsledok existuje len na obrazovke. */
export function MesacnyVydavokSection({ ctx, data }: { ctx: Ctx; data: AppData }) {
  const [amount, setAmount] = useState<NumIn>("");
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
  if (ctx.mInv + ctx.mCash === 0) {
    return (
      <div>
        <p>Mesačné sporenie je 0 €, takže výdavok nemá z čoho znížiť. Zadaj ho v Nastaveniach.</p>
        <NextStep to="nastavenia">Nastavenia</NextStep>
      </div>
    );
  }
  const today = todayIso();
  const a = asNum(amount);
  const outcome: MonthlyExpenseOutcome | null =
    Number.isNaN(a) || a <= 0
      ? null
      : monthlyExpenseScenario({
          base: ctx.capital,
          expenseCents: cents(a),
          mInv: ctx.mInv,
          mCash: ctx.mCash,
          realReturn: ctx.realReturn,
          targetCents: ctx.target,
          rentals: ctx.rentals,
        });
  return (
    <div>
      <p style={{ color: "var(--muted)" }}>Zisti, koľko mesiacov by stál výdavok, ktorý sa opakuje každý mesiac. Berie sa zo sporenia. Nič sa neukladá.</p>
      <Field label="Suma mesačne (€)" value={amount} onChange={setAmount} />
      {outcome === null && <p>Zadaj sumu, aby sa ukázal dopad.</p>}
      {outcome && !outcome.ok && (
        <p role="alert">
          {outcome.reason === "exceeds_saving"
            ? "Výdavok je väčší než mesačné sporenie, takže by sporenie bolo záporné. Tento scenár to nepočíta."
            : "Zadaj sumu väčšiu ako nula."}
        </p>
      )}
      {outcome && outcome.ok && <Result outcome={outcome} today={today} />}
      <p style={hintStyle}>Odhad je pred daňou a poplatkami a nie je finančným poradenstvom.</p>
      <OpakovaneVydavkyBlock data={data} ctx={ctx} />
    </div>
  );
}

function Result({ outcome, today }: { outcome: Extract<MonthlyExpenseOutcome, { ok: true }>; today: string }) {
  const totalBefore = outcome.savingBefore.inv + outcome.savingBefore.cash;
  const totalAfter = outcome.savingAfter.inv + outcome.savingAfter.cash;
  let impact: string;
  if (outcome.deltaMonths !== null) impact = formatImpactOutcome({ kind: "delta", months: outcome.deltaMonths });
  else if (outcome.after.kind === "unreachable") impact = UNREACHABLE_IMPACT_TEXT;
  else impact = "Dopad sa nedá vyčísliť v mesiacoch.";
  return (
    <div style={card}>
      <p style={{ margin: "4px 0" }}>
        Mesačné sporenie sa zníži z <strong>{eur(totalBefore)}</strong> na <strong>{eur(totalAfter)}</strong>.
      </p>
      <p style={{ margin: "4px 0" }}>Predbežný dopad: <strong>{impact}</strong></p>
      {outcome.before.kind === "months" && outcome.after.kind === "months" && (
        <>
          <p style={{ margin: "4px 0" }}>
            Dátum cieľa pri pôvodnom sporení: <strong>{goalDateText(goalDisplay(outcome.before.months, today, today), false, monthYear)}</strong>
          </p>
          <p style={{ margin: "4px 0" }}>
            Dátum cieľa po zníženom sporení: <strong>{goalDateText(goalDisplay(outcome.after.months, today, today), false, monthYear)}</strong>
          </p>
        </>
      )}
    </div>
  );
}
