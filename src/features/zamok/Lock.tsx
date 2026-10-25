import { useEffect, useRef, useState } from "react";
import type { Repository } from "../../storage/repository";
import type { AppData } from "../../storage/types";
import { checkPin, isValidPin, makePinRecord } from "./pin";
import { NO_ATTEMPTS, afterFailure, readAttempts, waitSeconds, writeAttempts, type PinAttempts } from "./pinLimit";
import { Field, btn, inp } from "../../ui/kit/controls";
import { STORAGE_ERROR } from "../../ui/kit/messages";

/** Zámok a PIN (D-119, D-135): obrazovka odomknutia a zapnutie/vypnutie PIN-u v Nastaveniach. Feature „zamok“ (docs/23). */

/** Odomknutie PIN-om (D-119). Údaje sa nezobrazia, kým PIN nie je správny. */
const EMPTY_DATA: AppData = {
  settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [],
  incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [],
};

/** Odomknutie PIN-om. Zabudnutý PIN = vymazanie dát v zariadení po dvojitom potvrdení (D-135). */
export function LockScreen({ repo, onUnlock, onWiped }: { repo: Repository; onUnlock: () => void; onWiped: () => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [understood, setUnderstood] = useState(false);
  // Obmedzenie pokusov (audit, nález 10): stav z úložiska; čas sa počas blokovania prepočíta každú sekundu.
  const [attempts, setAttempts] = useState<PinAttempts>(NO_ATTEMPTS);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    void readAttempts(repo).then(setAttempts);
  }, [repo]);
  useEffect(() => {
    if (attempts.lockedUntil <= Date.now()) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= attempts.lockedUntil) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [attempts.lockedUntil]);
  const wait = waitSeconds(attempts, now);
  // Synchrónna ochrana: rýchle opakované kliknutia nesmú čítať ten istý stav pokusov naraz.
  const busy = useRef(false);
  const unlock = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const stored = await readAttempts(repo);
      setAttempts(stored);
      if (waitSeconds(stored, Date.now()) > 0) return setNow(Date.now());
      const record = await repo.getMeta("pin");
      if (record && (await checkPin(pin, record))) {
        await writeAttempts(repo, NO_ATTEMPTS).catch(() => undefined);
        return onUnlock();
      }
      const next = afterFailure(stored, Date.now());
      await writeAttempts(repo, next).catch(() => undefined);
      setAttempts(next);
      setNow(Date.now());
      setErr("Nesprávny PIN. Skús znova.");
      setPin("");
    } finally {
      busy.current = false;
    }
  };
  const wipe = async () => {
    try {
      await repo.replaceAll(EMPTY_DATA);
      await repo.replaceAttachments([]);
      await repo.setMeta("pin", "");
      onWiped();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };
  return (
    <section aria-label="Odomknutie">
      <h2 style={{ fontSize: "var(--font-heading)" }}>Zadaj PIN</h2>
      <p style={{ color: "var(--muted)" }}>Údaje sú v tomto telefóne. Ak PIN zabudneš, môžeš údaje v zariadení vymazať a obnoviť ich zo zálohy.</p>
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "var(--font-small)" }}>PIN</span>
        <input type="password" inputMode="numeric" aria-label="PIN" value={pin} disabled={wait > 0} onChange={(e) => setPin(e.target.value)} style={inp} />
      </label>
      {wait > 0 && <p style={{ color: "var(--danger)" }}>Príliš veľa pokusov. Skús znova o {wait} s.</p>}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={unlock} disabled={wait > 0} style={btn}>Odomknúť</button>
      {!forgot ? (
        <p><button onClick={() => setForgot(true)} style={{ ...btn, marginTop: 16 }}>Zabudol som PIN</button></p>
      ) : (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginTop: 12 }}>
          <p><strong>Údaje v tomto zariadení sa vymažú a PIN sa zruší.</strong> Bez zálohy sa údaje nedajú obnoviť. Ak zálohu máš, po vymazaní ju môžeš importovať v sekcii Záloha.</p>
          <label style={{ display: "block", margin: "8px 0" }}>
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />{" "}
            Rozumiem, že údaje v tomto zariadení sa vymažú
          </label>
          <button onClick={wipe} disabled={!understood} style={btn}>Vymazať údaje a zrušiť PIN</button>{" "}
          <button onClick={() => { setForgot(false); setUnderstood(false); }} style={btn}>Zrušiť</button>
        </div>
      )}
    </section>
  );
}

/** Zapnutie, vypnutie a zamknutie PIN-u v Nastaveniach (D-119). */
/** `heading={false}`: nadpis nahrádza súhrn zbaleného bloku v Nastaveniach (D-293). */
export function PinSection({ repo, pinSet, onChanged, onLock, heading = true }: { repo: Repository; pinSet: boolean; onChanged: (on: boolean) => void; onLock: () => void; heading?: boolean }) {
  const [newPin, setNewPin] = useState("");
  const [repeat, setRepeat] = useState("");
  const [current, setCurrent] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const enable = async () => {
    if (!isValidPin(newPin)) return setErr("PIN musí mať 4 až 6 číslic.");
    if (newPin !== repeat) return setErr("PIN sa nezhoduje so zopakovaním.");
    try {
      await repo.setMeta("pin", await makePinRecord(newPin));
      await writeAttempts(repo, NO_ATTEMPTS).catch(() => undefined);
      setNewPin("");
      setRepeat("");
      setErr(null);
      onChanged(true);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const disable = async () => {
    const stored = await readAttempts(repo);
    const blocked = waitSeconds(stored, Date.now());
    if (blocked > 0) return setErr(`Príliš veľa pokusov. Skús znova o ${blocked} s.`);
    const record = await repo.getMeta("pin");
    if (!record || !(await checkPin(current, record))) {
      const next = afterFailure(stored, Date.now());
      await writeAttempts(repo, next).catch(() => undefined);
      const left = waitSeconds(next, Date.now());
      return setErr(left > 0 ? `Aktuálny PIN nesedí. Ďalší pokus o ${left} s.` : "Aktuálny PIN nesedí.");
    }
    try {
      await repo.setMeta("pin", "");
      await writeAttempts(repo, NO_ATTEMPTS).catch(() => undefined);
      setCurrent("");
      setErr(null);
      onChanged(false);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section style={{ marginTop: 16 }}>
      {heading && <h3 style={{ fontSize: "var(--font-text)" }}>PIN</h3>}
      {pinSet ? (
        <>
          <p style={{ color: "var(--muted)" }}>PIN je zapnutý. Appka sa pri otvorení najprv opýta na PIN. PIN chráni prístup v tomto telefóne; údaje nie sú zašifrované.</p>
          <button onClick={onLock} style={btn}>Zamknúť teraz</button>
          <Field label="Aktuálny PIN (na vypnutie)" value={current} type="password" inputMode="numeric" onChange={setCurrent} />
          <button onClick={disable} style={btn}>Vypnúť PIN</button>
        </>
      ) : (
        <>
          <p style={{ color: "var(--muted)" }}>PIN je nepovinný. Údaje nie sú zašifrované; PIN bráni len otvoreniu appky.</p>
          <Field label="Nový PIN (4 až 6 číslic)" value={newPin} type="password" inputMode="numeric" onChange={setNewPin} />
          <Field label="Zopakuj PIN" value={repeat} type="password" inputMode="numeric" onChange={setRepeat} />
          <button onClick={enable} style={btn}>Zapnúť PIN</button>
        </>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}
