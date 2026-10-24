import { useState } from "react";
import type { Repository } from "../../storage/repository";
import type { Property, Position, Snapshot } from "../../storage/types";
import type { Capital } from "../../domain/capital";
import { checkDate } from "../../storage/validate";
import { positionsChangedSince, staleValuationNames } from "../../domain/investments";
import { propertyChangedSince } from "../../domain/property";
import { cents, dateSk, eur, todayIso } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";
import { NextStep } from "../../ui/kit/NextStep";
import { calloutStyle } from "../../ui/kit/controls";

/** Vyhodnotenie (FR-05, D-116, D-121): ručné vyhodnotenie a kontrola stavu investícií a hotovosti; zmazanie. Feature „vyhodnotenie“ (docs/23). */

/** derivedInvCents: súčet položiek v sekcii Investície; ak existuje, suma sa odvodzuje, nie zadáva (D-101). */
export function SnapshotSection({ repo, latest, capital, derivedInvCents, snapshots, properties, positions, onSaved }: { repo: Repository; latest: Snapshot | null; capital: Capital; derivedInvCents: number | null; snapshots: Snapshot[]; properties: Property[]; positions: Position[]; onSaved: () => void }) {
  const [date, setDate] = useState(todayIso());
  // N-04 (D-096): predvyplní K z posledného stavu plus sporenie a investície od D_L.
  const [inv, setInv] = useState<NumIn>(latest ? capital.inv / 100 : "");
  const [cash, setCash] = useState<NumIn>(latest ? capital.cash / 100 : "");
  const [err, setErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [bigChange, setBigChange] = useState(false);

  const write = async (existingId: string | undefined) => {
    try {
      await repo.addManualSnapshot({
        id: existingId ?? uid(),
        date,
        investmentsCents: derivedInvCents ?? cents(asNum(inv)),
        cashCents: cents(asNum(cash)),
        createdAt: new Date().toISOString(),
      });
      setConfirmId(null);
      setBigChange(false);
      setEditingDate(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const save = async () => {
    const dateErr = checkDate(date, todayIso(), "dátum vyhodnotenia");
    if (dateErr.length) return setErr(dateErr[0]);
    const invMissing = derivedInvCents === null && Number.isNaN(asNum(inv));
    if (invMissing && Number.isNaN(asNum(cash))) return setErr("Vyplň hodnotu investícií aj nasporenú sumu v hotovosti.");
    if (invMissing) return setErr("Vyplň hodnotu investícií.");
    if (Number.isNaN(asNum(cash))) return setErr("Vyplň nasporenú sumu v hotovosti.");
    if ((derivedInvCents === null && asNum(inv) < 0) || asNum(cash) < 0) return setErr("Hodnoty nesmú byť záporné.");
    const same = snapshots.find((s) => s.date === date);
    if (same) return setConfirmId(same.id); // D-055: prepis len po potvrdení
    // Preklep (napr. 3 000 namiesto 30 000) sa len overí: zmena nad 50 % sa potvrdí, nezablokuje.
    const newK = (derivedInvCents ?? cents(asNum(inv))) + cents(asNum(cash));
    const oldK = latest ? latest.investmentsCents + latest.cashCents : 0;
    if (!bigChange && oldK > 0 && Math.abs(newK - oldK) > oldK * 0.5) return setBigChange(true);
    await write(undefined);
  };

  // Úprava existujúceho ručného vyhodnotenia: údaje sa načítajú do formulára, uloženie ide cez prepis (D-055).
  const startEdit = (s: Snapshot) => {
    setEditingDate(s.date);
    setDate(s.date);
    setInv(s.investmentsCents / 100);
    setCash(s.cashCents / 100);
    setErr(null);
    setBigChange(false);
  };

  const remove = async (id: string) => {
    try {
      await repo.deleteSnapshot(id);
      setDeleteId(null);
      setDelErr(null);
      onSaved();
    } catch {
      setDelErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        {latest ? `Posledné vyhodnotenie: ${dateSk(latest.date)}.` : "Zatiaľ nebolo vyhodnotenie. Dátum cieľa sa zobrazí až po ňom."}
      </p>
      <p style={{ color: "var(--muted)" }}>Mesačné vyhodnotenie sa vytvára automaticky. Tu ho zadáš len na opravu. Dátum cieľa sa mení až pri vyhodnotení.</p>
      {latest && <p style={{ color: "var(--muted)" }}>Dátum cieľa a stav uvidíš na Prehľade. <NextStep to="prehlad">Prehľad</NextStep></p>}
      {staleValuationNames(positions, todayIso()).length > 0 && (
        <p style={calloutStyle("warn")}>Ocenenie niektorých investícií je staršie ako 3 mesiace. Suma vo vyhodnotení môže byť zastaraná.</p>
      )}
      {latest && positionsChangedSince(positions, latest.createdAt) && (
        <p style={calloutStyle("warn")}>Investície sa zmenili od posledného vyhodnotenia. Nové vyhodnotenie zohľadní aj túto zmenu.</p>
      )}
      {latest && propertyChangedSince(properties, latest.createdAt) && (
        <p style={calloutStyle("warn")}>Majetok sa zmenil od posledného vyhodnotenia. Nové vyhodnotenie zohľadní aj túto zmenu.</p>
      )}
      {editingDate && <p style={{ background: "var(--banner)", padding: 8, borderRadius: 6 }}>Upravuješ vyhodnotenie z {dateSk(editingDate ?? "")}. Uložením sa prepíše.</p>}
      <Field label="Dátum vyhodnotenia" value={date} type="date" max={todayIso()} onChange={setDate} />
      {derivedInvCents === null ? (
        <Field label="Hodnota investícií (€)" value={inv} onChange={setInv} />
      ) : (
        <p>Hodnota investícií: <strong>{eur(derivedInvCents)}</strong> (súčet položiek v sekcii <a href="#investicie">Investície</a>)</p>
      )}
      <Field label="Nasporená suma, hotovosť (€)" value={cash} onChange={setCash} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      {bigChange && (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6 }}>
          <p>Zmena K je viac ako 50 % oproti poslednému vyhodnoteniu. Je to správne?</p>
          <button onClick={() => write(undefined)} style={btn}>Áno, uložiť</button>{" "}
          <button onClick={() => setBigChange(false)} style={btn}>Upraviť údaje</button>
        </div>
      )}
      {confirmId && (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6 }}>
          <p>Vyhodnotenie s dátumom {dateSk(date)} už existuje. Prepísať ho? História sa zachová v zálohe.</p>
          <button onClick={() => write(confirmId)} style={btn}>Prepísať vyhodnotenie</button>{" "}
          <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
        </div>
      )}
      <button onClick={save} style={btnPrimary}>Uložiť vyhodnotenie</button>

      <h3 style={{ fontSize: "var(--font-text)", marginTop: 24 }}>Uložené vyhodnotenia</h3>
      {snapshots.length === 0 && <p>Zatiaľ nie sú uložené vyhodnotenia.</p>}
      {[...snapshots].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
        <div key={s.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{dateSk(s.date)}</strong>{s.auto ? " · automaticky" : ""}</p>
          <p style={{ margin: "4px 0" }}>K: {eur(s.investmentsCents + s.cashCents)} (investície {eur(s.investmentsCents)}, hotovosť {eur(s.cashCents)})</p>
          {s.auto ? (
            <p style={{ margin: "4px 0", fontSize: "var(--font-small)", color: "var(--muted)" }}>Automatické vyhodnotenie sa vytvorí znova z ručných údajov.</p>
          ) : deleteId === s.id ? (
            <div>
              <p>Naozaj zmazať vyhodnotenie z {dateSk(s.date)}? Ak chceš mať kópiu, najprv stiahni zálohu v sekcii <a href="#zaloha">Záloha</a>.</p>
              <button onClick={() => remove(s.id)} style={btnDanger}>Zmazať vyhodnotenie</button>{" "}
              <button onClick={() => setDeleteId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => startEdit(s)} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setDeleteId(s.id)} style={btnDanger}>Zmazať</button>
            </>
          )}
        </div>
      ))}
      {delErr && <p style={{ color: "var(--danger)" }}>{delErr}</p>}
    </section>
  );
}
