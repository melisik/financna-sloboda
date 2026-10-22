import { useState } from "react";
import type { Repository } from "../../storage/repository";
import { INCOME_FREQUENCIES, INCOME_KINDS, type AppData, type IncomeFrequency, type IncomeKind, type RegularIncome } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import { irregularIncomes, isIncomeActive, monthlyIncomeCents } from "../../domain/income";
import { futureOutlook } from "../../domain/outlook";
import { monthSummary } from "../../domain/monthSummary";
import { FEED_MAX_BYTES, parseFeed, type ParsedFeed } from "../../storage/feed";
import { cents, dateSk, eur } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";

/** Pravidelné príjmy (D-102): zoznam, výhľad a rozdiel oproti výdavkom tohto mesiaca. Feature „prijmy“ (docs/23). */

const INCOME_KIND_LABEL: Record<IncomeKind, string> = {
  mzda: "Mzda",
  socialna_davka: "Sociálna dávka",
  invalidny_dochodok: "Invalidný dôchodok",
  starobny_dochodok: "Starobný dôchodok",
  osetrovne: "Ošetrovné",
  nemocenska_davka: "Nemocenská dávka (PN)",
  ine: "Iné",
};
const INCOME_FREQUENCY_LABEL: Record<IncomeFrequency, string> = {
  mesacne: "pravidelne každý mesiac",
  nepravidelne: "nepravidelne",
};

/** Pravidelné príjmy (D-102): len zobrazenie. Sporenie m sa mení až podľa zostatku pri vyhodnotení. */
/** Príjem a minuté tento mesiac: rozdiel ukazuje, kam ide mzda. Nájom je v bývaní (D-137), nie v príjmoch. */
function IncomeBalance({ income, data, today }: { income: number; data: AppData; today: string }) {
  const s = monthSummary(data.transactions, data.budgets, data.recurringExpenses, today, 0, data.properties, data.liabilities);
  const spent = s.byNecessity.nevyhnutne + s.byNecessity.nie_nevyhnutne + s.byNecessity.ostatne + s.unassignedCents;
  const diff = income - spent;
  return (
    <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 12, background: "var(--surface)" }}>
      <p style={{ margin: "4px 0" }}>Mesačný príjem: <strong>{eur(income)}</strong> · minuté tento mesiac: <strong>{eur(spent)}</strong></p>
      <p style={{ margin: "4px 0" }}>Rozdiel: <strong>{diff >= 0 ? "+" : "−"}{eur(Math.abs(diff))}</strong></p>
      {income === 0 && spent > 0 && (
        <p style={{ margin: "8px 0 0", background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
          Nie je zadaný žiadny platný pravidelný príjem. Rozdiel nie je správny, kým ho nepridáš.
        </p>
      )}
    </div>
  );
}

/** Výhľad (docs/14, D-154): budúce dôchodky a dávky zo zadaných údajov. Len zobrazenie; nič sa neodhaduje. */
function OutlookBlock({ incomes, today }: { incomes: RegularIncome[]; today: string }) {
  const items = futureOutlook(incomes, today);
  return (
    <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 12 }}>
      <h3 style={{ fontSize: "1rem", marginTop: 0 }}>Výhľad</h3>
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Zatiaľ nie je zadaný žiadny budúci dôchodok ani dávka. Ak poznáš dátum začiatku, zadaj ho ako príjem s druhom dôchodku alebo dávky.</p>
      ) : (
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          {items.map((i) => (
            <li key={i.id}>Od {dateSk(i.startDate)}: {INCOME_KIND_LABEL[i.kind]} {eur(i.amountCents)} {i.frequency === "mesacne" ? "mesačne" : "jednorazovo"} ({i.name})</li>
          ))}
        </ul>
      )}
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
        Zobrazujú sa len údaje, ktoré si zadal. Appka nič neodhaduje a dátum cieľa sa podľa toho nemení.
      </p>
    </div>
  );
}

export function IncomeSection({ repo, incomes, data, today, onSaved }: { repo: Repository; incomes: RegularIncome[]; data: AppData; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<RegularIncome | "new" | null>(null);
  const [pendingFeed, setPendingFeed] = useState<ParsedFeed | null>(null);
  const [feedErr, setFeedErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      await repo.deleteIncome(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  // Súbor od integračnej služby (D-112): číta sa len lokálne, bez sieťového volania. Nič sa nezapíše bez potvrdenia.
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setPendingFeed(null);
    setFeedErr(null);
    if (!file) return;
    if (file.size > FEED_MAX_BYTES) return setFeedErr("Súbor je väčší ako 1 MB. Nič sa nenačítalo.");
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      return setFeedErr("Súbor nie je platný JSON. Nič sa nezmenilo.");
    }
    const check = parseFeed(json);
    if (!check.ok) return setFeedErr(`Súbor nie je v poriadku: ${check.errors.join("; ")}. Nič sa nezmenilo.`);
    setPendingFeed(check.feed);
  };

  const confirmFeed = async () => {
    if (!pendingFeed) return;
    try {
      await repo.replaceIncomesFromSource(pendingFeed.source, pendingFeed.items);
      setPendingFeed(null);
      onSaved();
    } catch {
      setFeedErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Tu len vidíš, koľko pravidelne prichádza. Sporenie sa mení až podľa zostatku na konci mesiaca, pri vyhodnotení. Nájom z nehnuteľnosti eviduj v <a href="#majetok">Majetku</a>, aby sa nerátal dvakrát.
      </p>
      <div style={{ border: "1px dashed var(--border-dashed)", padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: "0.95rem" }}>Načítať údaje zo súboru integračnej služby</span>
          <input type="file" accept="application/json,.json" aria-label="Súbor od integračnej služby" onChange={onFile} style={{ marginTop: 6 }} />
        </label>
        {feedErr && <p style={{ color: "var(--danger)" }}>{feedErr}</p>}
        {pendingFeed && (
          <div style={{ marginTop: 8 }}>
            <p>
              Zdroj: <strong>{pendingFeed.source}</strong>, získané {dateSk(pendingFeed.fetchedAt.slice(0, 10))}. Položiek: {pendingFeed.items.length}.
              Nahradia predchádzajúce položky tohto zdroja.
            </p>
            <button onClick={confirmFeed} style={btn}>Importovať</button>{" "}
            <button onClick={() => setPendingFeed(null)} style={btn}>Zrušiť</button>
          </div>
        )}
      </div>
      {incomes.length === 0 && editing === null && <p>Zatiaľ nie je zapísaný žiadny pravidelný príjem.</p>}
      <OutlookBlock incomes={incomes} today={today} />
      <IncomeBalance income={monthlyIncomeCents(incomes, today)} data={data} today={today} />
      {irregularIncomes(incomes).length > 0 && (
        <p style={{ color: "var(--muted)" }}>Nepravidelné príjmy (do mesačného súčtu sa nerátajú): {eur(irregularIncomes(incomes).reduce((sum, i) => sum + i.amountCents, 0))}</p>
      )}
      {incomes.map((i) => {
        const active = isIncomeActive(i, today);
        return (
          <div key={i.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
            <p style={{ margin: 0 }}>
              <strong>{i.name}</strong> · {INCOME_KIND_LABEL[i.kind]}{" "}
              {!active && <span style={{ color: "var(--muted)" }}>(neplatí dnes)</span>}
            </p>
            <p style={{ margin: "4px 0" }}>
              {eur(i.amountCents)}{i.frequency === "mesacne" ? " mesačne" : " (jednorazovo)"}
              {i.dayOfMonth !== undefined ? `, zvyčajne ${i.dayOfMonth}. v mesiaci` : ""}
            </p>
            {i.source && <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Zdroj: {i.source}, získané {dateSk((i.fetchedAt ?? "").slice(0, 10))}</p>}
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              {INCOME_FREQUENCY_LABEL[i.frequency]}; od {dateSk(i.startDate)}{i.endDate ? `, do ${dateSk(i.endDate)}` : i.frequency === "mesacne" ? ", bez konca" : ""}
            </p>
            {confirmId === i.id ? (
              <div>
                <p>Naozaj zmazať príjem „{i.name}“?</p>
                <button onClick={() => remove(i.id)} style={btnDanger}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
              </div>
            ) : (
              <div>
                <button onClick={() => { setEditing(i); setErr(null); }} style={btn}>Upraviť</button>{" "}
                <button onClick={() => setConfirmId(i.id)} style={btnDanger}>Zmazať</button>
              </div>
            )}
          </div>
        );
      })}
      {editing !== null ? (
        <IncomeForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btnPrimary}>Pridať pravidelný príjem</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

function IncomeForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: RegularIncome | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<IncomeKind>(initial?.kind ?? "mzda");
  const [frequency, setFrequency] = useState<IncomeFrequency>(initial?.frequency ?? "mesacne");
  const [amount, setAmount] = useState<NumIn>(initial ? initial.amountCents / 100 : "");
  const [day, setDay] = useState<NumIn>(initial?.dayOfMonth ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const a = asNum(amount);
    if (Number.isNaN(a) || !(a > 0)) return setErr("Vyplň mesačnú sumu (väčšiu ako 0).");
    const d = day === "" ? undefined : asNum(day);
    if (d !== undefined && (Number.isNaN(d) || !Number.isInteger(d) || d < 1 || d > 31)) return setErr("Deň v mesiaci musí byť od 1 do 31.");
    const startErr = checkDate(startDate, "9999-12-31", "začiatok");
    if (startErr.length) return setErr(startErr[0]);
    if (endDate.trim() !== "") {
      const endErr = checkDate(endDate.trim(), "9999-12-31", "koniec");
      if (endErr.length) return setErr(endErr[0]);
      if (endDate.trim() < startDate) return setErr("Koniec nesmie byť pred začiatkom.");
    }
    const now = new Date().toISOString();
    const income: RegularIncome = {
      id: initial?.id ?? uid(),
      name: trimmed,
      kind,
      frequency,
      amountCents: cents(a),
      startDate,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(d !== undefined && frequency === "mesacne" ? { dayOfMonth: d } : {}),
      ...(endDate.trim() !== "" ? { endDate: endDate.trim() } : {}),
    };
    try {
      await repo.saveIncome(income);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť príjem" : "Nový pravidelný príjem"}</h4>
      <Field label="Názov (napr. mzda)" value={name} type="text" onChange={setName} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Druh
        <select value={kind} onChange={(e) => setKind(e.target.value as IncomeKind)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {INCOME_KINDS.map((k) => <option key={k} value={k}>{INCOME_KIND_LABEL[k]}</option>)}
        </select>
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Frekvencia
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as IncomeFrequency)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {INCOME_FREQUENCIES.map((f) => <option key={f} value={f}>{INCOME_FREQUENCY_LABEL[f]}</option>)}
        </select>
      </label>
      <Field label={frequency === "mesacne" ? "Suma mesačne (€)" : "Suma (€)"} value={amount} onChange={setAmount} />
      {frequency === "mesacne" && <Field label="Deň v mesiaci (nepovinné)" value={day} onChange={setDay} hint="len na orientáciu" />}
      <Field label={frequency === "mesacne" ? "Od" : "Dátum"} value={startDate} type="date" onChange={setStartDate} />
      {frequency === "mesacne" && <Field label="Do (nepovinné)" value={endDate} type="date" onChange={setEndDate} hint="bez hodnoty príjem trvá" />}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť príjem</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
