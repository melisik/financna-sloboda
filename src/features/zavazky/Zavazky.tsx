import { useState } from "react";
import type { Repository } from "../../storage/repository";
import { LIABILITY_KINDS, type Liability, type LiabilityKind } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import { liabilityInterestCents, liabilitiesTotals, liabilityIsActive } from "../../domain/liabilities";
import { paymentBelowInterest } from "../../domain/mortgage";
import { cents, dateSk, eur } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";

/** Záväzky okrem hypotéky (D-103, D-140): úvery a kreditné karty. Hypotéka je v Majetku. Feature „zavazky“ (docs/23). */

const LIABILITY_KIND_LABEL: Record<LiabilityKind, string> = {
  uver: "Úver",
  kreditka: "Kreditná karta",
  leasing: "Leasing",
  ine: "Iné",
};

/** Záväzky okrem hypotéky (D-103). Hypotéka je v Majetku. */
export function LiabilitySection({ repo, liabilities, today, onSaved }: { repo: Repository; liabilities: Liability[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<Liability | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const totals = liabilitiesTotals(liabilities);

  const remove = async (id: string) => {
    try {
      await repo.deleteLiability(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Hypotéku evidujte v sekcii Majetok. Tu sú ostatné dlhy: úver, kreditná karta, leasing.</p>
      {liabilities.length === 0 && editing === null && <p>Zatiaľ nie je zapísaný žiadny záväzok.</p>}
      {liabilities.length > 0 && (
        <p style={{ fontSize: "1.05rem" }}>
          Dlh spolu: <strong>{eur(totals.debtCents)}</strong>. Mesačne odchádza: <strong>{eur(totals.monthlyPaymentCents)}</strong>, z toho úrok {eur(totals.monthlyInterestCents)}.
        </p>
      )}
      {liabilities.map((l) => (
        <div key={l.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{l.name}</strong> · {LIABILITY_KIND_LABEL[l.kind]}</p>
          {paymentBelowInterest(l.balanceCents, l.rate, l.monthlyPaymentCents) && (
            <p role="note" style={{ margin: "4px 0", background: "var(--warn-bg)", padding: 6, borderRadius: 6, fontSize: "0.9rem" }}>
              Splátka nepokrýva úrok, zostatok rastie. Skontroluj splátku.
            </p>
          )}
          <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", margin: "8px 0", fontSize: "0.95rem" }}>
            <dt>Zostatok</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(l.balanceCents)}</dd>
            <dt>Úroková sadzba</dt><dd style={{ margin: 0, textAlign: "right" }}>{String(Number((l.rate * 100).toFixed(4)))} % p. a.</dd>
            <dt>Splátka mesačne</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(l.monthlyPaymentCents)}</dd>
            <dt>Úrok za mesiac</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(liabilityInterestCents(l))}</dd>
          </dl>
          {l.endDate && <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Koniec: {dateSk(l.endDate ?? "")}</p>}
          {!liabilityIsActive(l, today) && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              {l.balanceCents <= 0 ? "Splatené. Nerátajú sa do mesačných výdavkov." : `Skončené k ${dateSk(l.endDate ?? "")}. Nerátajú sa do mesačných výdavkov.`}
            </p>
          )}
          {confirmId === l.id ? (
            <div>
              <p>Naozaj zmazať záväzok „{l.name}“?</p>
              <button onClick={() => remove(l.id)} style={btnDanger}>Potvrdiť zmazanie</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <div>
              <button onClick={() => { setEditing(l); setErr(null); }} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(l.id)} style={btnDanger}>Zmazať</button>
            </div>
          )}
        </div>
      ))}
      {editing !== null ? (
        <LiabilityForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btnPrimary}>Pridať záväzok</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

function LiabilityForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: Liability | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<LiabilityKind>(initial?.kind ?? "uver");
  const [balance, setBalance] = useState<NumIn>(initial ? initial.balanceCents / 100 : "");
  const [rate, setRate] = useState<NumIn>(initial ? Number((initial.rate * 100).toFixed(6)) : "");
  const [payment, setPayment] = useState<NumIn>(initial ? initial.monthlyPaymentCents / 100 : "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [balanceDate, setBalanceDate] = useState(initial?.balanceDate ?? today);
  const [err, setErr] = useState<string | null>(null);
  // Upozornenie pred uložením (nález 8): splátka pod úrokom by zostatok zvyšovala.
  const belowInterest =
    !Number.isNaN(asNum(balance)) && !Number.isNaN(asNum(rate)) && !Number.isNaN(asNum(payment)) &&
    paymentBelowInterest(cents(asNum(balance)), asNum(rate) / 100, cents(asNum(payment)));

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const b = asNum(balance);
    if (Number.isNaN(b) || b < 0) return setErr("Vyplň zostatok dlhu (0 alebo viac).");
    if (b > 0) {
      const balanceErr = checkDate(balanceDate, today, "dátum zostatku");
      if (balanceErr.length) return setErr(balanceErr[0]);
    }
    const r = rate === "" ? 0 : asNum(rate);
    if (Number.isNaN(r) || r < 0 || r >= 100) return setErr("Úroková sadzba musí byť od 0 do menej ako 100 %.");
    const pay = payment === "" ? 0 : asNum(payment);
    if (Number.isNaN(pay) || pay < 0) return setErr("Splátka musí byť číslo 0 alebo viac.");
    if (endDate.trim() !== "") {
      // Koniec môže byť v budúcnosti, preto sa overuje len platnosť dátumu.
      const endErr = checkDate(endDate.trim(), "9999-12-31", "koniec");
      if (endErr.length) return setErr(endErr[0]);
    }
    const now = new Date().toISOString();
    const liability: Liability = {
      id: initial?.id ?? uid(),
      name: trimmed,
      kind,
      balanceCents: cents(b),
      rate: r / 100,
      monthlyPaymentCents: cents(pay),
      ...(b > 0 ? { balanceDate } : {}),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(endDate.trim() !== "" ? { endDate: endDate.trim() } : {}),
    };
    try {
      await repo.saveLiability(liability);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť záväzok" : "Nový záväzok"}</h4>
      <Field label="Názov" value={name} type="text" onChange={setName} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Druh
        <select value={kind} onChange={(e) => setKind(e.target.value as LiabilityKind)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {LIABILITY_KINDS.map((k) => (
            <option key={k} value={k}>{LIABILITY_KIND_LABEL[k]}</option>
          ))}
        </select>
      </label>
      <Field label="Zostatok dlhu (€)" value={balance} onChange={setBalance} />
      {typeof balance === "number" && balance > 0 && (
        <Field label="Zostatok platí k (dátum)" value={balanceDate} type="date" max={today} onChange={setBalanceDate} hint="od tohto dátumu sa každý mesiac automaticky znižuje o istinu" />
      )}
      <Field label="Úroková sadzba (% p. a.)" value={rate} step={0.01} onChange={setRate} hint="0, ak úrok nie je" />
      <Field label="Splátka mesačne (€)" value={payment} onChange={setPayment} hint="0, ak splátku nemáš" />
      {belowInterest && (
        <p role="note" style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6, fontSize: "0.9rem" }}>
          Splátka nepokryje mesačný úrok ({eur(Math.round((cents(asNum(balance)) * asNum(rate)) / 100 / 12))}). Zostatok by sa nezmenšil; skontroluj splátku.
        </p>
      )}
      <Field label="Koniec (nepovinné)" value={endDate} type="date" onChange={setEndDate} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť záväzok</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
