import { useState } from "react";
import type { AppData, Transaction } from "../../storage/types";
import type { Ctx } from "../../domain/context";
import { scenarioDateText } from "../../domain/scenario";
import { backupOverdue, monthEndApproaching, reviewOverdue, settingsCheckOverdue, staleEstimates } from "../../domain/reminders";
import { StockWarning } from "../../ui/StockWarning";
import { householdMonthBalance, possibleDoubleEntries, type DoubleEntryHint } from "../../domain/householdBalance";
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
import { goalSummaries, positionsChangedSince } from "../../domain/investments";
import { propertyChangedSince } from "../../domain/property";
import { dateSk, eur, monthYear, pctText, todayIso } from "../../ui/kit/format";
import { btn, btnPrimary } from "../../ui/kit/controls";
import { saveTextFile } from "../../ui/kit/files";
import { calloutStyle } from "../../ui/kit/controls";
import { hintStyle } from "../../ui/kit/controls";

/** Prehľad (domovská obrazovka): dátum cieľa a pokrok, hlavná akcia, pripomienky, mesačný prehľad a týždenný súhrn. Feature „prehlad“ (docs/23, D-283). */

export function HomeSection({ data, ctx, lastExport, incomeVisible, investmentsVisible = false }: { data: AppData; ctx: Ctx; lastExport: string | null; incomeVisible: boolean; investmentsVisible?: boolean }) {
  const today = todayIso();
  const pending =
    ctx.latest && ctx.target !== null && ctx.settings
      ? impactWithRentals({ inv: ctx.latest.investmentsCents, cash: ctx.latest.cashCents, nem: ctx.K_nem }, ctx.capital, ctx.mInv, ctx.mCash, ctx.realReturn, ctx.target, ctx.rentals)
      : null;
  // Dátum cieľa, pokrok a posun sú z kapitálu pri poslednom vyhodnotení (D-283, D-285, FR-04).
  // ETAPA 1: Nový Dashboard COMPAVEN 2.0 s K_FIRE, K_total, K_nem metrikami
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
          {ctx.shortfall.inv > 0 && <> Prečerpanie investícií: <strong>{eur(ctx.shortfall.inv)}</strong>. Do kapitálu sa nezapočíta.</>}
          {ctx.shortfall.cash > 0 && <> Prečerpanie hotovosti: <strong>{eur(ctx.shortfall.cash)}</strong>. Do kapitálu sa nezapočíta.</>}
        </p>
      )}
      {ctx.latest && ctx.target !== null ? (
        <>
          <div style={{ background: "linear-gradient(135deg, var(--primary-bg) 0%, #1a4d2e 100%)", borderRadius: 16, padding: 24, marginBottom: 24, color: "white" }}>
            <p style={{ margin: "0 0 8px", fontSize: "var(--font-small)", opacity: 0.9 }}>POKROK K FINANČNEJ SLOBODE</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: "var(--font-small)", opacity: 0.9 }}>K_FIRE</p>
                <p style={{ margin: "0 0 16px", fontSize: "1.8em", fontWeight: "bold" }}>{eur(ctx.K_FIRE)}</p>
                <div aria-hidden="true" style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ width: `${progress ? progress.percent : 0}%`, height: "100%", background: "rgba(255,255,255,0.8)" }} />
                </div>
                <p style={{ margin: 0, fontSize: "var(--font-small)", opacity: 0.8 }}>{progress ? progress.percent : "−"} % z cieľa</p>
              </div>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: "var(--font-small)", opacity: 0.9 }}>Cieľ:</p>
                <p style={{ margin: "0 0 8px", fontSize: "1.4em", fontWeight: "bold" }}>{eur(ctx.target)}</p>
                <p style={{ margin: 0, fontSize: "var(--font-small)", opacity: 0.8 }}>Dátum: {scenarioDateText(ctx, ctx.realReturn, today, monthYear)}</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "var(--surface-light)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "var(--font-small)", fontWeight: 600, color: "var(--muted)" }}>K_FIRE</p>
              <p style={{ margin: "0 0 8px", fontSize: "1.4em", fontWeight: "bold" }}>{eur(ctx.K_FIRE)}</p>
              <p style={{ margin: 0, fontSize: "var(--font-xsmall)", color: "var(--muted)" }}>Investície + hotovosť</p>
            </div>
            <div style={{ background: "var(--surface-light)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "var(--font-small)", fontWeight: 600, color: "var(--muted)" }}>K_total</p>
              <p style={{ margin: "0 0 8px", fontSize: "1.4em", fontWeight: "bold" }}>{eur(ctx.K_total)}</p>
              <p style={{ margin: 0, fontSize: "var(--font-xsmall)", color: "var(--muted)" }}>FIRE + nehnuteľnosti</p>
            </div>
            <div style={{ background: "var(--surface-light)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "var(--font-small)", fontWeight: 600, color: "var(--muted)" }}>K_nem</p>
              <p style={{ margin: "0 0 8px", fontSize: "1.4em", fontWeight: "bold" }}>{eur(ctx.K_nem)}</p>
              <p style={{ margin: 0, fontSize: "var(--font-xsmall)", color: "var(--muted)" }}>Nehnuteľnosti</p>
            </div>
            <div style={{ background: "var(--surface-light)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "var(--font-small)", fontWeight: 600, color: "var(--muted)" }}>Mesačný tok</p>
              <p style={{ margin: "0 0 8px", fontSize: "1.4em", fontWeight: "bold" }}>{eur(ctx.m)}</p>
              <p style={{ margin: 0, fontSize: "var(--font-xsmall)", color: "var(--muted)" }}>m − c = {eur(ctx.m - ctx.c)}</p>
            </div>
          </div>

          <div style={{ background: "var(--surface)", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: "var(--font-small)" }}>
            <p style={{ margin: 0 }}>Posledné vyhodnotenie: <strong>{dateSk(ctx.latest.date)}</strong></p>
          </div>
          <p style={hintStyle}>Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.</p>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, fontSize: "var(--font-small)" }}>
              <div style={{ background: "var(--surface-light)", padding: 8, borderRadius: 4 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 600 }}>K_FIRE (kapitál pre finančnú nezávislosť)</p>
                <p style={{ margin: 0 }}><strong>{eur(ctx.K_FIRE)}</strong></p>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "var(--font-xsmall)" }}>Investície + hotovosť</p>
              </div>
              <div style={{ background: "var(--surface-light)", padding: 8, borderRadius: 4 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 600 }}>K_nem (čistá hodnota nehnuteľností)</p>
                <p style={{ margin: 0 }}><strong>{eur(ctx.K_nem)}</strong></p>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "var(--font-xsmall)" }}>Všetky vlastné a prenajímané</p>
              </div>
              <div style={{ background: "var(--surface-light)", padding: 8, borderRadius: 4 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 600 }}>K_total (celkový čistý majetok)</p>
                <p style={{ margin: 0 }}><strong>{eur(ctx.K_total)}</strong></p>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "var(--font-xsmall)" }}>K_FIRE + K_nem</p>
              </div>
              <div style={{ background: "var(--surface-light)", padding: 8, borderRadius: 4 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 600 }}>m (voľný mesačný peňažný tok)</p>
                <p style={{ margin: 0 }}><strong>{eur(ctx.m)}</strong></p>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "var(--font-xsmall)" }}>Príjmy − všetky výdavky</p>
              </div>
              <div style={{ background: "var(--surface-light)", padding: 8, borderRadius: 4 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 600 }}>c (plánovaný príspevok do investícií)</p>
                <p style={{ margin: 0 }}><strong>{eur(ctx.c)}</strong></p>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "var(--font-xsmall)" }}>Mesačne do K_inv</p>
              </div>
            </div>
            <p>
              Rozsah dátumu: od {scenarioDateText(ctx, ctx.realReturn + 0.02, today, monthYear)} do {scenarioDateText(ctx, Math.max(0, ctx.realReturn - 0.02), today, monthYear)} (opatrný – základný – optimistický).
            </p>
            <p>{returnLine(ctx.realReturn, RETURN_ASSUMPTIONS.inflation)}</p>
            {ctx.settings && (
              <p>Miera výberu: {pctText(ctx.settings.withdrawalRate)} (predpoklad, zdroj neoverený).</p>
            )}
            {(ctx.capital.inv !== ctx.evaluated.inv || ctx.capital.cash !== ctx.evaluated.cash) && (
              <p>Po transakciách od vyhodnotenia (predbežne): FIRE {eur(ctx.capital.inv + ctx.capital.cash)}, z toho investície {eur(ctx.capital.inv)}, hotovosť {eur(ctx.capital.cash)}.</p>
            )}
            <p>
              Predbežný dopad posledných transakcií:{" "}
              <strong>{pending === null ? UNREACHABLE_IMPACT_TEXT : formatImpactOutcome(pending)}</strong>
            </p>
            <p style={{ color: "var(--muted)" }}>Transakcií: {data.transactions.length} · Rezerva: {eur(ctx.reserve)}</p>
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
      {investmentsVisible && goalSummaries(data.investments, data.goals).length > 0 && (
        <div style={{ margin: "0 0 12px" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Ciele investícií</p>
          {goalSummaries(data.investments, data.goals).map((g) => (
            <p key={g.id} style={{ margin: "2px 0" }}>
              {g.name}: {eur(g.totalCents)} z {eur(g.targetCents)} · {g.reached ? "cieľ dosiahnutý" : `${g.percent} %`}
              {g.count === 0 && !g.overflowInCents && <span style={hintStyle}> (zatiaľ bez položiek)</span>}
              {g.overflowOutCents ? <span style={hintStyle}> (nad cieľ {eur(g.overflowOutCents)} ide inam)</span> : null}
              {g.overflowInCents ? <span style={hintStyle}> (z toho {eur(g.overflowInCents)} z preplnených cieľov)</span> : null}
            </p>
          ))}
          <p style={{ ...hintStyle, margin: "2px 0" }}>Len zobrazenie; dátum cieľa to nemení. <NextStep to="investicie">Investície</NextStep></p>
        </div>
      )}
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
          Nastavenia sa ešte neoverili alebo sú staršie ako rok. Skontroluj výnos, rezervu a mieru výberu v sekcii <a href="#nastavenia">Nastavenia</a>.
        </p>
      )}
      {staleEstimates(data.properties, today).length > 0 && (
        <p style={calloutStyle("warn")}>
          Odhad hodnoty je starší ako rok: {staleEstimates(data.properties, today).join(", ")}. Aktualizuj ho v sekcii <a href="#majetok">Majetok</a>; appka ho sama nemení.
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

function doubleEntryText(h: DoubleEntryHint): string {
  if (h.kind === "hypoteka_pravidelny") return `pravidelný výdavok „${h.name}“ (${eur(h.amountCents)}) má sumu splátky hypotéky`;
  if (h.kind === "hypoteka_transakcia") return `výdavok v bývaní ${eur(h.amountCents)} z ${dateSk(h.date)} má sumu splátky hypotéky`;
  return `výdavok ${eur(h.amountCents)} z ${dateSk(h.date)} má sumu výdavku v evidencii prenájmu`;
}

function MonthSpendingBlock({ data, today, thresholdCents, incomeVisible }: { data: AppData; today: string; thresholdCents: number; incomeVisible: boolean }) {
  const b = householdMonthBalance(data, today, thresholdCents);
  const s = b.summary;
  const spent = b.totalExpensesCents;
  const doubles = possibleDoubleEntries(data, today);
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
        <>
          <p style={{ margin: "4px 0" }}>
            Príjmy: <strong>{eur(b.totalIncomeCents)}</strong> · výdavky: <strong>{eur(spent)}</strong> · rozdiel: <strong>{b.balanceCents >= 0 ? "+" : "−"}{eur(Math.abs(b.balanceCents))}</strong>
          </p>
          {b.rentalIncomeCents > 0 && (
            <p style={{ ...hintStyle, margin: "4px 0" }}>Z príjmov: pravidelné {eur(b.regularIncomeCents)}, prijatý nájom {eur(b.rentalIncomeCents)}.</p>
          )}
        </>
      )}
      <details>
        <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Rozpis výdavkov ▾</summary>
        <ul style={{ paddingLeft: 20 }}>
          <li>Nevyhnutné: {eur(s.byNecessity.nevyhnutne)}</li>
          {b.housingCents > 0 && <li>Splátky hypoték (v bývaní): {eur(b.housingCents)}</li>}
          {s.liabilitiesCents > 0 && <li>Splátky úverov a kariet: {eur(s.liabilitiesCents)}</li>}
          <li>Nie nevyhnutné: {eur(s.byNecessity.nie_nevyhnutne)}{spent > 0 ? ` (${Math.round((100 * s.byNecessity.nie_nevyhnutne) / spent)} % minutého)` : ""}</li>
          <li>Ostatné a nezaradené: {eur(s.byNecessity.ostatne + s.unassignedCents)}</li>
          {b.rentalExpensesCents > 0 && <li>Výdavky na prenájom (evidencia v Majetku): {eur(b.rentalExpensesCents)}</li>}
          <li>Výdavky nad prahom: {s.overThresholdCount}</li>
        </ul>
      </details>
      {doubles.length > 0 && (
        <p style={{ ...calloutStyle("warn"), margin: "8px 0 0", fontSize: "var(--font-small)" }}>
          Možný dvojitý zápis: {doubles.map(doubleEntryText).join("; ")}. Splátka hypotéky sa do výdavkov počíta z Majetku a výdavky prenájmu z evidencie prenájmu. Ak ide o tú istú platbu, zmaž druhý zápis. Appka nič nemaže sama.
        </p>
      )}
      {ending.length > 0 && (
        <p style={{ ...calloutStyle("warn"), margin: "8px 0 0", fontSize: "var(--font-small)" }}>
          Koniec platnosti do 30 dní: {ending.map((e) => e.name).join(", ")}. <a href="#pravidelne-vydavky">Pozrieť</a>
        </p>
      )}
    </div>
  );
}
