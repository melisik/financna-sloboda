import { useState } from "react";
import type { AppData, Transaction } from "../../storage/types";
import type { Ctx } from "../../domain/context";
import { scenarioDateText } from "../../domain/scenario";
import { backupOverdue, monthEndApproaching, reviewOverdue, settingsCheckOverdue } from "../../domain/reminders";
import { StockWarning } from "../../ui/StockWarning";
import { monthSummary } from "../../domain/monthSummary";
import { monthlyIncomeCents } from "../../domain/income";
import { endingSoon } from "../../domain/recurring";
import { weeklySummary } from "../../domain/weekly";
import { weeklyMailto, weeklySummaryLines } from "./weeklyMail";
import { impactWithRentals } from "../../domain/rentalGoal";
import { UNREACHABLE_IMPACT_TEXT, formatImpactOutcome } from "../../domain/impact";
import { NextStep } from "../../ui/kit/NextStep";
import { RETURN_ASSUMPTIONS } from "../../domain/assumptions";
import { returnLine } from "./returnLine";
import { goalDateShift, goalProgress } from "../../domain/progress";
import { progressLine, shiftLine } from "./progressText";
import { VyvojBlock } from "./Vyvoj";
import { recommendedSettings } from "../../domain/recommendations";
import { positionsChangedSince } from "../../domain/investments";
import { propertyChangedSince } from "../../domain/property";
import { dateSk, eur, monthYear, pctText, todayIso } from "../../ui/kit/format";
import { btn, btnPrimary } from "../../ui/kit/controls";
import { saveTextFile } from "../../ui/kit/files";
import { calloutStyle } from "../../ui/kit/controls";
import { hintStyle } from "../../ui/kit/controls";

/** Prehľad (domovská obrazovka): dátum cieľa a pokrok, hlavná akcia, pripomienky, mesačný prehľad a týždenný súhrn. Feature „prehlad“ (docs/23, D-283). */

export function HomeSection({ data, ctx, lastExport, incomeVisible }: { data: AppData; ctx: Ctx; lastExport: string | null; incomeVisible: boolean }) {
  const today = todayIso();
  const pending =
    ctx.latest && ctx.target !== null && ctx.settings
      ? impactWithRentals({ inv: ctx.latest.investmentsCents, cash: ctx.latest.cashCents }, ctx.capital, ctx.mInv, ctx.mCash, ctx.realReturn, ctx.target, ctx.rentals)
      : null;
  // Dátum cieľa, pokrok a posun sú z kapitálu pri poslednom vyhodnotení (D-283, D-285, FR-04).
  const progress = ctx.latest && ctx.target !== null ? goalProgress(ctx.evaluated, ctx.target, ctx.rentals) : null;
  const previous = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-2) ?? null;
  const shift =
    ctx.latest && ctx.target !== null
      ? goalDateShift({ previous, latestDate: ctx.latest.date, capital: ctx.evaluated, mInv: ctx.mInv, mCash: ctx.mCash, rate: ctx.realReturn, targetCents: ctx.target, rentals: ctx.rentals })
      : null;
  const threshold = ctx.settings?.thresholdCents ?? recommendedSettings(0).thresholdCents;
  // Poradie (D-283, docs/43 A1): cieľ a pokrok, hlavná akcia, upozornenia, potom mesiac a týždeň.
  return (
    <div>
      {ctx.target === null && (
        <p>Cieľová suma: <strong>nezadaná</strong>. Zadaj ročné výdavky v Nastaveniach; ostatné hodnoty sú predvolené. <NextStep to="nastavenia">Nastavenia</NextStep></p>
      )}
      {(ctx.negative.cash || ctx.negative.inv) && (
        <p style={calloutStyle("error")}>
          Pozor: záznamy vedú k zápornému stavu {ctx.negative.cash ? "hotovosti" : "investícií"} a hodnoty sú zarazené na 0. Skontroluj transakcie po poslednom vyhodnotení.
          {ctx.shortfall.inv > 0 && <> Prečerpanie investícií: <strong>{eur(ctx.shortfall.inv)}</strong>. Do hodnoty K sa nezapočíta.</>}
          {ctx.shortfall.cash > 0 && <> Prečerpanie hotovosti: <strong>{eur(ctx.shortfall.cash)}</strong>. Do hodnoty K sa nezapočíta.</>}
        </p>
      )}
      {ctx.latest && ctx.target !== null && progress ? (
        <>
          <p style={{ fontSize: "var(--font-heading)", margin: "8px 0 4px" }}>Dátum cieľa: <strong>{scenarioDateText(ctx, ctx.realReturn, today, monthYear)}</strong></p>
          <p style={{ margin: "4px 0" }}>{progressLine(progress)}</p>
          <div aria-hidden="true" style={{ height: 8, borderRadius: 4, background: "var(--border-soft)", overflow: "hidden", margin: "4px 0 8px" }}>
            <div style={{ width: `${progress.percent}%`, height: "100%", background: "var(--primary-bg)" }} />
          </div>
          {shift && <p style={{ margin: "4px 0" }}>{shiftLine(shift)}</p>}
          <p style={hintStyle}>Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.</p>
          <p style={hintStyle}>
            Posledné vyhodnotenie: <strong>{dateSk(ctx.latest.date)}</strong>. Dátum sa zmení až po ďalšom vyhodnotení.
          </p>
          {ctx.latest.auto && (
            <p style={hintStyle}>
              Vyhodnotenie vzniklo automaticky z transakcií.
              {data.investments.length === 0 && <> Investície sú odhad z výnosu r, kým ich neupravíš v sekcii <a href="#investicie">Investície</a>.</>}
            </p>
          )}
          {ctx.longHorizon && (
            <p style={{ ...calloutStyle("warn"), fontSize: "var(--font-small)" }}>
              Pri dlhom horizonte (viac ako 20 rokov) je predpoklad výnosu menej istý; výsledok je v dnešných eurách.
            </p>
          )}
          <details style={{ marginTop: 8 }}>
            <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Podrobnosti ▾</summary>
            <p>
              Rozsah dátumu: od {scenarioDateText(ctx, ctx.realReturn + 0.02, today, monthYear)} do {scenarioDateText(ctx, Math.max(0, ctx.realReturn - 0.02), today, monthYear)} (opatrný – základný – optimistický).
            </p>
            <p>{returnLine(ctx.realReturn, RETURN_ASSUMPTIONS.inflation)}</p>
            {ctx.settings && (
              <p>Miera výberu: {pctText(ctx.settings.withdrawalRate)} (predpoklad, zdroj neoverený).</p>
            )}
            <p>Kapitál pri vyhodnotení: investície {eur(ctx.evaluated.inv)}, hotovosť {eur(ctx.evaluated.cash)}. Rezerva: {eur(ctx.reserve)}.</p>
            {(ctx.capital.inv !== ctx.evaluated.inv || ctx.capital.cash !== ctx.evaluated.cash) && (
              <p>Po transakciách od vyhodnotenia (predbežne): investície {eur(ctx.capital.inv)}, hotovosť {eur(ctx.capital.cash)}.</p>
            )}
            <p>
              Predbežný dopad posledných transakcií:{" "}
              <strong>{pending === null ? UNREACHABLE_IMPACT_TEXT : formatImpactOutcome(pending)}</strong>
            </p>
            <p style={{ color: "var(--muted)" }}>Transakcií: {data.transactions.length}</p>
          </details>
          <VyvojBlock data={data} ctx={ctx} />
        </>
      ) : (
        <>
          {ctx.target !== null && <p>Cieľová suma: <strong>{eur(ctx.target)}</strong></p>}
          {!ctx.latest && <p>Urob prvé vyhodnotenie. Dátum cieľa sa zobrazí po ňom. <NextStep to="vyhodnotenie">Vyhodnotenie</NextStep></p>}
        </>
      )}
      <p style={{ margin: "12px 0 16px" }}>
        <a href="#nova-transakcia" style={{ ...btnPrimary, marginTop: 0 }}>
          Pridať transakciu
        </a>
      </p>
      {ctx.latest && positionsChangedSince(data.investments, ctx.latest.createdAt) && (
        <p style={calloutStyle("warn")}>
          Investície sa zmenili od posledného vyhodnotenia. Dátum cieľa sa prepočíta až pri novom vyhodnotení.
        </p>
      )}
      {ctx.latest && propertyChangedSince(data.properties, ctx.latest.createdAt) && (
        <p style={calloutStyle("warn")}>
          Majetok sa zmenil od posledného vyhodnotenia. Dátum cieľa sa prepočíta až pri novom vyhodnotení.
        </p>
      )}
      {!reviewOverdue(ctx.latest?.date ?? null, today) && monthEndApproaching(ctx.latest?.date ?? null, today) && (
        <p style={calloutStyle("warn")}>
          Koniec mesiaca sa blíži. Vyhodnotenie za tento mesiac urob do konca mesiaca.
        </p>
      )}
      <StockWarning items={data.stockItems} today={today} />
      {reviewOverdue(ctx.latest?.date ?? null, today) && (
        <p style={calloutStyle("warn")}>
          Vyhodnotenie za predchádzajúci mesiac chýba. Dátum cieľa sa mení len pri vyhodnotení. <NextStep to="vyhodnotenie">Vyhodnotenie</NextStep>
        </p>
      )}
      {data.settings !== null && settingsCheckOverdue(data.settings.checkedAt, today) && (
        <p style={calloutStyle("warn")}>
          Nastavenia sa ešte neoverili alebo sú staršie ako rok. Skontroluj infláciu, rezervu a mieru výberu v sekcii <a href="#nastavenia">Nastavenia</a>.
        </p>
      )}
      {(data.snapshots.length > 0 || data.transactions.length > 0 || data.settings !== null) && backupOverdue(lastExport, today) && (
        <p style={calloutStyle("warn")}>
          Záloha ešte nebola exportovaná alebo je staršia ako 7 dní. Dáta sú len v tomto zariadení.
        </p>
      )}
      <MonthSpendingBlock incomeVisible={incomeVisible} data={data} today={today} thresholdCents={threshold} />
      <WeeklySummaryBlock transactions={data.transactions} today={today} thresholdCents={threshold} />
    </div>
  );
}

/** Výdavky tohto mesiaca: plnenie mesačného plánu a rozpis na nevyhnutné a nie nevyhnutné (D-131). */

/** Týždenný súhrn výdavkov (N-10): posledných 7 dní, uložiť ako textový súbor. */
function WeeklySummaryBlock({ transactions, today, thresholdCents }: { transactions: Transaction[]; today: string; thresholdCents: number }) {
  const [err, setErr] = useState<string | null>(null);
  const s = weeklySummary(transactions, today, thresholdCents);
  const save = async () => {
    try {
      await saveTextFile(`financna-sloboda-tyzden-${today}.txt`, weeklySummaryLines(s).join("\n"));
      setErr(null);
    } catch {
      setErr("Súhrn sa nepodarilo uložiť. Skús to znova.");
    }
  };
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 12, background: "var(--surface)" }}>
      <p style={{ margin: 0 }}><strong>Týždenný súhrn</strong></p>
      <p style={{ margin: "4px 0" }}>{dateSk(s.fromIso)} – {dateSk(s.toIso)}: výdavky spolu <strong>{eur(s.totalCents)}</strong>, zápisov {s.count}.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button onClick={save} style={btn}>Uložiť týždenný súhrn</button>
        <a href={weeklyMailto(s)} style={btn}>Poslať mailom</a>
      </div>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}

function MonthSpendingBlock({ data, today, thresholdCents, incomeVisible }: { data: AppData; today: string; thresholdCents: number; incomeVisible: boolean }) {
  const s = monthSummary(data.transactions, data.budgets, data.recurringExpenses, today, thresholdCents, data.properties, data.liabilities);
  const spent = s.byNecessity.nevyhnutne + s.byNecessity.nie_nevyhnutne + s.byNecessity.ostatne + s.unassignedCents;
  const income = monthlyIncomeCents(data.incomes, today);
  const ending = data.recurringExpenses.filter((e) => endingSoon(e, today));
  const over = s.percent !== null && s.percent > 100;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 12, background: "var(--surface)" }}>
      <p style={{ margin: 0 }}><strong>Tento mesiac</strong></p>
      {s.percent !== null ? (
        <p style={{ margin: "4px 0", color: over ? "var(--danger)" : undefined }}>
          Plnenie plánu: <strong>{s.percent} %</strong> ({eur(s.plannedSpentCents)} z {eur(s.planCents)})
        </p>
      ) : (
        <p style={{ margin: "4px 0", color: "var(--muted)" }}>
          Mesačný plán nie je nastavený. Limity nastavíš v <a href="#rozpocet">Rozpočte</a>. 
          Minuté tento mesiac: {eur(spent)}.
        </p>
      )}
      {incomeVisible && (
        <p style={{ margin: "4px 0" }}>
          Príjem: <strong>{eur(income)}</strong> · rozdiel: <strong>{income - spent >= 0 ? "+" : "−"}{eur(Math.abs(income - spent))}</strong>
        </p>
      )}
      <details>
        <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Rozpis výdavkov ▾</summary>
        <ul style={{ paddingLeft: 20 }}>
          <li>Nevyhnutné: {eur(s.byNecessity.nevyhnutne)}</li>
          {s.liabilitiesCents > 0 && <li>Splátky úverov a kariet: {eur(s.liabilitiesCents)}</li>}
          <li>Nie nevyhnutné: {eur(s.byNecessity.nie_nevyhnutne)}{spent > 0 ? ` (${Math.round((100 * s.byNecessity.nie_nevyhnutne) / spent)} % minutého)` : ""}</li>
          <li>Ostatné a nezaradené: {eur(s.byNecessity.ostatne + s.unassignedCents)}</li>
          <li>Výdavky nad prahom: {s.overThresholdCount}</li>
        </ul>
      </details>
      {ending.length > 0 && (
        <p style={{ ...calloutStyle("warn"), margin: "8px 0 0", fontSize: "var(--font-small)" }}>
          Koniec platnosti do 30 dní: {ending.map((e) => e.name).join(", ")}. <a href="#pravidelne-vydavky">Pozrieť</a>
        </p>
      )}
    </div>
  );
}
