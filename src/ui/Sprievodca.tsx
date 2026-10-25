import { useState } from "react";
import type { Repository } from "../storage/repository";
import { recommendedSettings } from "../domain/recommendations";
import { makeCtx } from "../domain/context";
import { scenarioDateText } from "../domain/scenario";
import { cents, monthYear, todayIso } from "./kit/format";
import { uid } from "./kit/ids";
import { STORAGE_ERROR } from "./kit/messages";
import { Field, asNum, btn, type NumIn, btnPrimary } from "./kit/controls";
import { PHASE2_ENABLED } from "../app/features";
import { writeModuleChoice } from "../app/modules";
import { exportBackupFile } from "../features/zaloha/BackupSection";
import { isValidPin, makePinRecord } from "../features/zamok/pin";
import { ModuleCheckboxes, useModules } from "./Moduly";
import { hintStyle } from "./kit/controls";

/** Sprievodca prvým nastavením (FR-12, D-117, docs/20): jedna otázka na obrazovke, krok so zálohou, výsledok. */
const ONBOARD_STEP_KEY = "fs-onboarding-step";
const ONBOARD_STEPS = 8; // 0 úvod, 1 výdavky, 2 miera výberu, 3 dnešný stav, 4 záloha, 5 PIN (voliteľný), 6 moduly, 7 výsledok

export function FirstSetup({ repo, onChanged, onSkip, rerun = false, initial }: { repo: Repository; onChanged: () => void; onSkip: () => void; rerun?: boolean; initial?: { expenses: NumIn; withdrawal: NumIn; inv: number; cash: number } }) {
  const [step, setStep] = useState<number>(() => {
    if (rerun) return 0;
    try {
      const n = Number(localStorage.getItem(ONBOARD_STEP_KEY));
      return Number.isInteger(n) && n >= 0 && n < ONBOARD_STEPS ? n : 0;
    } catch {
      return 0;
    }
  });
  const [expenses, setExpenses] = useState<NumIn>(initial?.expenses ?? "");
  const [withdrawal, setWithdrawal] = useState<NumIn>(initial?.withdrawal ?? "");
  const [inv, setInv] = useState<NumIn>(initial ? initial.inv : "");
  const [cash, setCash] = useState<NumIn>(initial ? initial.cash : "");
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pinNew, setPinNew] = useState("");
  const [pinRepeat, setPinRepeat] = useState("");
  const { choice, setChoice } = useModules();
  const [modules, setModules] = useState<string[]>(choice ?? []);

  const go = (n: number) => {
    setErr(null);
    setStep(n);
    if (rerun) return;
    try {
      localStorage.setItem(ONBOARD_STEP_KEY, String(n));
    } catch {
      // bez úložiska sa priebeh udrží len do obnovenia stránky
    }
  };
  const rec = recommendedSettings(Number.isNaN(asNum(expenses)) ? 0 : cents(asNum(expenses)));

  const saveAll = async () => {
    const invVal = asNum(inv);
    const cashVal = asNum(cash);
    if (Number.isNaN(invVal) || Number.isNaN(cashVal)) return setErr("Vyplň hodnotu investícií aj hotovosti. Ak nemáš, zadaj 0.");
    if (invVal < 0 || cashVal < 0) return setErr("Hodnoty nesmú byť záporné.");
    setBusy(true);
    try {
      const wr = Number.isNaN(asNum(withdrawal)) ? rec.withdrawalRate : asNum(withdrawal) / 100;
      await repo.saveSettings({
        expensesCents: cents(asNum(expenses)),
        withdrawalRate: wr,
        realReturn: rec.realReturn,
        feesRate: 0,
        reserveCents: rec.reserveCents,
        thresholdCents: rec.thresholdCents,
        checkedAt: new Date().toISOString(),
      });
      // Vyhodnotenie na dnešok sa prepíše, nie zdvojí (rovnaké pravidlo ako vo Vyhodnotení).
      const sameDay = (await repo.getData()).snapshots.find((x) => x.date === todayIso());
      await repo.addManualSnapshot({ id: sameDay?.id ?? uid(), date: todayIso(), investmentsCents: cents(invVal), cashCents: cents(cashVal), createdAt: new Date().toISOString() });
      const fresh = await repo.getData();
      const c = makeCtx(fresh);
      setResult(scenarioDateText(c, c.realReturn, todayIso(), monthYear));
      go(4);
    } catch {
      setErr(STORAGE_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const nextFromExpenses = () => {
    const e = asNum(expenses);
    if (Number.isNaN(e)) return setErr("Vyplň ročné výdavky. Napríklad 24 000 € ročne.");
    if (!(e > 0)) return setErr("Ročné výdavky musia byť väčšie ako 0.");
    go(2);
  };

  const backupNow = async () => {
    try {
      const d = await repo.getData();
      const r = await exportBackupFile(d, await repo.listAllAttachments());
      // Bez hesla sa nešifruje; ak by zdieľanie predsa odmietlo oneskorené spustenie, súbor sa stiahne ako pred S-3.
      if (r.result === "needsTap") {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(r.file);
        a.download = r.file.name;
        a.click();
      }
      if (r.result !== "cancelled") await repo.setMeta("lastExportAt", r.exportedAt);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const finish = () => {
    if (rerun) return onChanged();
    try {
      localStorage.removeItem(ONBOARD_STEP_KEY);
    } catch {
      // nič
    }
    onChanged();
  };

  const nav = (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {step > 0 && step < 7 && <button onClick={() => go(step - 1)} style={btn}>Späť</button>}
        <button onClick={onSkip} style={btn}>{rerun ? "Zavrieť sprievodcu" : "Preskočiť na hlavnú stránku"}</button>
      </div>
      {!rerun && <p style={hintStyle}>Návod nájdeš v sekcii Prehľad, dole pod „Návod“.</p>}
    </div>
  );

  return (
    <section aria-label="Prvé nastavenie">
      <p style={hintStyle}>Krok {step + 1} z {ONBOARD_STEPS}</p>
      {step === 0 && (
        <>
          <h2 style={{ fontSize: "var(--font-heading)" }}>Vitaj</h2>
          <p>Appka ukáže, kedy by si mohol dosiahnuť finančnú slobodu, ak budeš pokračovať v sporení. Údaje zostávajú len v tomto telefóne.</p>
          <p style={{ color: "var(--muted)" }}>Výsledky sú odhady podľa tvojich predpokladov, nie finančné poradenstvo.</p>
          <button onClick={() => go(1)} style={btn}>Pokračovať</button>
          {nav}
        </>
      )}
      {step === 1 && (
        <>
          <h2 style={{ fontSize: "var(--font-heading)" }}>Koľko by si ročne potreboval na život?</h2>
          <p style={{ color: "var(--muted)" }}>Suma, ktorú by si ročne minul bez práce. Napríklad 24 000 € ročne.</p>
          <Field label="Ročné výdavky pri nezávislosti (€)" value={expenses} onChange={setExpenses} />
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          <button onClick={nextFromExpenses} style={btn}>Pokračovať</button>
          {nav}
        </>
      )}
      {step === 2 && (
        <>
          <h2 style={{ fontSize: "var(--font-heading)" }}>Koľko z kapitálu ročne vyberieš?</h2>
          <p style={{ color: "var(--muted)" }}>Miera výberu je podiel kapitálu, ktorý ročne minieš. Ak nevieš, nechaj ju prázdnu: použije sa východisková hodnota {(rec.withdrawalRate * 100).toFixed(1).replace(".", ",")} % (neoverený predpoklad).</p>
          <Field label="Miera výberu (%)" value={withdrawal} step={0.1} onChange={setWithdrawal} />
          <button onClick={() => go(3)} style={btn}>{withdrawal === "" ? `Nechať ${(rec.withdrawalRate * 100).toFixed(1).replace(".", ",")} %` : "Pokračovať"}</button>
          {nav}
        </>
      )}
      {step === 3 && (
        <>
          <h2 style={{ fontSize: "var(--font-heading)" }}>Koľko máš dnes?</h2>
          <p style={{ color: "var(--muted)" }}>Investície sú súčet účtov a cenných papierov. Hotovosť je suma, ktorú máš na účte. Môžeš to neskôr zmeniť.</p>
          <Field label="Hodnota investícií (€)" value={inv} onChange={setInv} hint="súčet účtov a cenných papierov, napr. stav v aplikácii banky alebo brokera; 0, ak nemáš" />
          <Field label="Nasporená suma, hotovosť (€)" value={cash} onChange={setCash} hint="zostatok na bežnom účte a v peňaženke; 0, ak nemáš" />
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          <button onClick={saveAll} disabled={busy} style={btnPrimary}>Uložiť a zobraziť dátum</button>
          {nav}
        </>
      )}
      {step === 4 && (
        <>
          <h2 style={{ fontSize: "var(--font-heading)" }}>Ulož si zálohu</h2>
          <p>Údaje sú len v tomto telefóne. Ak telefón stratíš alebo vymažeš prehliadač, údaje budú preč.</p>
          <p style={{ color: "var(--muted)" }}>Stiahni si zálohu a ulož ju mimo telefónu. Zálohu môžeš urobiť aj neskôr v sekcii Záloha.</p>
          <button onClick={backupNow} style={btn}>Stiahnuť zálohu</button>{" "}
          <button onClick={() => go(rerun ? 7 : 5)} style={btn}>Pokračovať</button>
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
        </>
      )}
      {step === 5 && (
        <>
          <h2 style={{ fontSize: "var(--font-heading)" }}>Chceš PIN?</h2>
          <p style={{ color: "var(--muted)" }}>PIN je nepovinný. Ak ho nastavíš, appka sa pri otvorení najprv opýta na PIN. PIN chráni prístup v tomto telefóne, údaje nie sú zašifrované.</p>
          <Field label="Nový PIN (4 až 6 číslic)" value={pinNew} type="password" inputMode="numeric" onChange={setPinNew} />
          <Field label="Zopakuj PIN" value={pinRepeat} type="password" inputMode="numeric" onChange={setPinRepeat} />
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          <button
            onClick={async () => {
              if (!isValidPin(pinNew)) return setErr("PIN musí mať 4 až 6 číslic.");
              if (pinNew !== pinRepeat) return setErr("PIN sa nezhoduje so zopakovaním.");
              try {
                await repo.setMeta("pin", await makePinRecord(pinNew));
                go(6);
              } catch {
                setErr(STORAGE_ERROR);
              }
            }}
            style={btn}
          >
            Nastaviť PIN
          </button>{" "}
          <button onClick={() => go(6)} style={btn}>Bez PIN</button>
        </>
      )}
      {step === 6 && (
        <>
          <h2 style={{ fontSize: "var(--font-heading)" }}>Čo chceš sledovať?</h2>
          <p style={{ color: "var(--muted)" }}>
            Vždy vidíš Prehľad, Transakcie, Vyhodnotenie, Rozpočet, Pravidelné výdavky, Nastavenia a Zálohu.
            Ostatné sekcie zapni, ak ich budeš používať. Neskôr ich zapneš alebo vypneš v Nastaveniach.
          </p>
          {PHASE2_ENABLED ? (
            <ModuleCheckboxes selected={modules} onChange={setModules} />
          ) : (
            <p style={{ color: "var(--muted)" }}>V tejto zostave sú dostupné všetky základné sekcie.</p>
          )}
          <button
            onClick={() => {
              writeModuleChoice(modules);
              setChoice(modules);
              go(7);
            }}
            style={btn}
          >
            Pokračovať
          </button>
        </>
      )}
      {step === 7 && (
        <>
          <h2 style={{ fontSize: "var(--font-heading)" }}>Hotovo</h2>
          {result && <p>Dátum cieľa: <strong>{result}</strong></p>}
          <p style={{ color: "var(--muted)" }}>Ďalšie kroky:</p>
          <ol style={{ paddingLeft: 20 }}>
            <li>Zapíš transakcie, keď niečo sporíš alebo minieš (sekcia Transakcie).</li>
            <li>Na konci mesiaca zapíš stav investícií a hotovosti (sekcia Vyhodnotenie).</li>
            <li>Občas si ulož zálohu (sekcia Záloha).</li>
          </ol>
          <button onClick={finish} style={btn}>{rerun ? "Zavrieť" : "Otvoriť prehľad"}</button>
        </>
      )}
    </section>
  );
}
