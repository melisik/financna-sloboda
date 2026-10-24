import { useState } from "react";
import type { Repository } from "../../storage/repository";
import type { Settings } from "../../storage/types";
import { recommendedSettings } from "../../domain/recommendations";
import { cents, eur } from "../../ui/kit/format";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, differs, type NumIn, btnPrimary } from "../../ui/kit/controls";
import { calloutStyle } from "../../ui/kit/controls";

/** Nastavenia výpočtu (FR-13, D-049, D-118): cieľové výdavky, miera výberu, výnos, rezerva a prah. Feature „nastavenia“ (docs/23). */

export function SettingsSection({ repo, settings, derived, onSaved }: { repo: Repository; settings: Settings | null; derived: { inv: number; cash: number }; onSaved: () => void }) {
  const [v, setV] = useState({
    expenses: settings ? settings.expensesCents / 100 : "" as NumIn,
    // zaokrúhlenie: 0,035 * 100 dáva 3,5000000000000004 (binárna aritmetika)
    withdrawalPct: settings ? Number((settings.withdrawalRate * 100).toFixed(6)) : "" as NumIn,
    returnPct: settings ? Number((settings.realReturn * 100).toFixed(6)) : "" as NumIn,
    fees: settings ? (settings.feesRate ?? 0) * 100 : "" as NumIn,
    reserve: settings ? settings.reserveCents / 100 : "" as NumIn,
    threshold: settings ? settings.thresholdCents / 100 : "" as NumIn,
    savingInv: settings?.savingInvCents !== undefined ? settings.savingInvCents / 100 : "" as NumIn,
    savingCash: settings?.savingCashCents !== undefined ? settings.savingCashCents / 100 : "" as NumIn,
  });
  const [err, setErr] = useState<string | null>(null);
  const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;
  // Východiskové hodnoty sa počítajú z práve zadaných výdavkov (R21/R22: jeden zdroj, bez natvrdo zadanej sumy).
  const expCents = typeof v.expenses === "number" ? cents(v.expenses) : 0;
  const rec = recommendedSettings(expCents);

  const save = async () => {
    // D-118: ročné výdavky sú povinné; prázdne ostatné polia použijú východiskovú hodnotu.
    const fee = v.fees === "" ? 0 : v.fees;
    if (!(fee >= 0 && fee < 100)) return setErr("Poplatky musia byť od 0 do menej ako 100 % ročne.");
    const exp = asNum(v.expenses);
    if (Number.isNaN(exp)) return setErr("Vyplň ročné výdavky.");
    if (!(exp > 0)) return setErr("Ročné výdavky musia byť väčšie ako 0.");
    const pick = (x: NumIn, fallback: number) => (Number.isNaN(asNum(x)) ? fallback : asNum(x));
    const wr = pick(v.withdrawalPct, rec.withdrawalRate * 100);
    const rr = pick(v.returnPct, rec.realReturn * 100);
    const res = pick(v.reserve, rec.reserveCents / 100);
    const thr = pick(v.threshold, rec.thresholdCents / 100);
    if (!(wr > 0 && wr <= 100)) return setErr("Miera výberu musí byť väčšia ako 0 % a najviac 100 %.");
    if (!(rr >= 0 && rr <= 100)) return setErr("Výnos r musí byť v rozsahu 0 až 100 %.");
    if (res < 0 || thr < 0) return setErr("Rezerva a prah nesmú byť záporné.");
    if (asNum(v.savingInv) < 0 || asNum(v.savingCash) < 0) return setErr("Mesačné sporenie nesmie byť záporné. Ak nechceš sporiť, zadaj 0.");
    setErr(null);
    try {
      await repo.saveSettings({
        expensesCents: cents(exp),
        withdrawalRate: wr / 100,
        realReturn: rr / 100,
        feesRate: fee / 100,
        reserveCents: cents(res),
        thresholdCents: cents(thr),
        ...(v.savingInv === "" ? {} : { savingInvCents: cents(v.savingInv) }),
        ...(v.savingCash === "" ? {} : { savingCashCents: cents(v.savingCash) }),
        checkedAt: new Date().toISOString(),
      });
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      {!settings && (
        <p style={calloutStyle("ok")}>
          Prvé nastavenie: polia sú prázdne. Pod každým je východisková hodnota; ročné výdavky zadaj sám.
        </p>
      )}
      <Field label="Ročné výdavky pri nezávislosti (€)" value={v.expenses} onChange={(x) => setV({ ...v, expenses: x })} />
      <Field label="Miera výberu (%)" value={v.withdrawalPct} step={0.1} onChange={(x) => setV({ ...v, withdrawalPct: x })}
        hint={`východisková hodnota ${pct(rec.withdrawalRate)} (neoverený predpoklad)`} changed={differs(v.withdrawalPct, rec.withdrawalRate * 100)} onReset={() => setV({ ...v, withdrawalPct: Number((rec.withdrawalRate * 100).toFixed(6)) })} />
      <Field label="Reálny výnos r (%)" value={v.returnPct} step={0.1} onChange={(x) => setV({ ...v, returnPct: x })}
        hint={`východisková hodnota ${pct(rec.realReturn)} (neoverený predpoklad); reálny výnos je po odpočítaní inflácie`} changed={differs(v.returnPct, rec.realReturn * 100)} onReset={() => setV({ ...v, returnPct: Number((rec.realReturn * 100).toFixed(6)) })} />
      {typeof v.withdrawalPct === "number" && (v.withdrawalPct < 3 || v.withdrawalPct > 4) && (
        <p style={{ ...calloutStyle("warn"), fontSize: "var(--font-small)" }}>
          Miera výberu je mimo rozsahu 3–4 %, ktorý je neoverený predpoklad, nie odporúčanie. Uloženie je možné; over si, či je to tvoj zámer.
        </p>
      )}
      {typeof v.returnPct === "number" && (v.returnPct < 2 || v.returnPct > 6) && (
        <p style={{ ...calloutStyle("warn"), fontSize: "var(--font-small)" }}>
          Výnos r je mimo rozsahu 2–6 %, ktorý je neoverený predpoklad, nie odporúčanie. Uloženie je možné, ale ide o odhad a dátum cieľa sa výrazne zmení.
        </p>
      )}
      <Field label="Rezerva, cieľová hodnota (€)" value={v.reserve} onChange={(x) => setV({ ...v, reserve: x })}
        hint={v.expenses === "" ? "3 mesiace výdavkov; doplní sa po zadaní ročných výdavkov" : `východisková hodnota ${eur(rec.reserveCents)} (3 mesiace výdavkov)`} changed={differs(v.reserve, rec.reserveCents / 100)} onReset={() => setV({ ...v, reserve: rec.reserveCents / 100 })} />
      <Field label="Prah výdavkov (€)" value={v.threshold} onChange={(x) => setV({ ...v, threshold: x })}
        hint={`východisková hodnota ${eur(rec.thresholdCents)}`} changed={differs(v.threshold, rec.thresholdCents / 100)} onReset={() => setV({ ...v, threshold: rec.thresholdCents / 100 })} />
      <Field label="Poplatky p. a. (%)" value={v.fees} step={0.01} onChange={(x) => setV({ ...v, fees: x })}
        hint="predvolene 0 %; zadaj, ak ti banka alebo poskytovateľ účtuje poplatky" changed={differs(v.fees, 0)} onReset={() => setV({ ...v, fees: 0 })} />
      <Field label="Mesačné sporenie do investícií (€), prázdne = odvodené" value={v.savingInv} onChange={(x) => setV({ ...v, savingInv: x })}
        hint={`prázdne = počíta sa zo zapísaných transakcií: ${eur(derived.inv)} mesačne`} changed={differs(v.savingInv, null)} onReset={() => setV({ ...v, savingInv: "" })} />
      <Field label="Mesačné sporenie do hotovosti (€), prázdne = odvodené" value={v.savingCash} onChange={(x) => setV({ ...v, savingCash: x })}
        hint={`prázdne = počíta sa zo zapísaných transakcií: ${eur(derived.cash)} mesačne`} changed={differs(v.savingCash, null)} onReset={() => setV({ ...v, savingCash: "" })} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť nastavenia</button>
    </section>
  );
}
