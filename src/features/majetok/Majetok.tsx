import { useState } from "react";
import type { ReactNode } from "react";
import type { Repository } from "../../storage/repository";
import type { Asset, AssetKind, ExtraPaymentMode, Property, PropertyMode, RentalEntry, RentalEntryKind } from "../../storage/types";
import { ASSET_KINDS, EXTRA_PAYMENT_MODES, PROPERTY_MODES } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import { applyExtraPayment, paymentBelowInterest, remainingMonths } from "../../domain/mortgage";
import { monthlyCostsCents, netPropertyValueCents, splitPayment, valueIsStale } from "../../domain/property";
import { rentalRow11, rentalTotalsForYear, rentalYears } from "../../domain/rental";
import { cents, dateSk, eur } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";
import { parseLvText, type LvFields, type LvFlatChoice, type LvTaxFields } from "../../domain/listVlastnictva";
import { LV_MAX_FILE_BYTES, parseLvHtml } from "./lvHtml";
import { NextStep } from "../../ui/kit/NextStep";

/** Majetok (Fáza 2, D-080 až D-158): nehnuteľnosti, hypotéka, prenájom, mimoriadne splátky a ďalšie aktíva. Feature „majetok“ (docs/23). */

const PROPERTY_MODE_LABEL: Record<PropertyMode, string> = {
  vlastne_byvanie: "bývam v nej",
  prenajom: "prenajímam",
  nezadane: "nezadané",
};

/** Karta majetku (Fáza 2, návrh docs/11_Karta_majetku.md): nehnuteľnosť a jej čistá hodnota. */




export function PropertySection({ repo, properties, assets, today, onSaved, renderRentalAttachments }: { repo: Repository; properties: Property[]; assets: Asset[]; today: string; onSaved: () => void; renderRentalAttachments: (entryId: string) => ReactNode }) {
  const [editing, setEditing] = useState<Property | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      await repo.deleteProperty(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Hodnota je tvoj odhad, nie trhová cena. Do kapitálu K sa počíta len nehnuteľnosť, ktorú prenajímaš; vlastné bývanie sa zobrazí zvlášť.
      </p>
      {(properties.length > 0 || assets.length > 0) && (() => {
        // Súhrn: čo sa počíta do K a čo je mimo K (D-093, D-058). Čistá hodnota ako v K.
        const inK = properties.filter((p) => p.mode === "prenajom").reduce((sum, p) => sum + netPropertyValueCents(p), 0);
        const outK = properties.filter((p) => p.mode === "vlastne_byvanie").reduce((sum, p) => sum + netPropertyValueCents(p), 0);
        const unset = properties.filter((p) => p.mode === "nezadane").reduce((sum, p) => sum + netPropertyValueCents(p), 0);
        const assetsTotal = assets.reduce((sum, a) => sum + a.valueCents, 0);
        const monthly = properties.reduce((sum, p) => sum + monthlyCostsCents(p), 0);
        return (
          <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 12 }}>
            <p style={{ margin: "4px 0" }}>Do K sa počíta: <strong>{eur(inK)}</strong> (prenajímané nehnuteľnosti, čistá hodnota)</p>
            <p style={{ margin: "4px 0" }}>
              Mimo K: vlastné bývanie {eur(outK)}, automobily a práva {eur(assetsTotal)}
              {properties.some((p) => p.mode === "nezadane") ? `, nezadaný režim ${eur(unset)}` : ""}
            </p>
            {monthly > 0 && <p style={{ margin: "4px 0" }}>Mesačné náklady na nehnuteľnosti spolu: <strong>{eur(monthly)}</strong></p>}
        {properties.some((p) => p.mode === "prenajom") && (() => {
          const year = Number(today.slice(0, 4));
          const rentals = properties.filter((p) => p.mode === "prenajom");
          const income = rentals.reduce((sum, p) => sum + rentalTotalsForYear(p.rentalLedger ?? [], year).incomeCents, 0);
          const costs = rentals.reduce((sum, p) => sum + rentalTotalsForYear(p.rentalLedger ?? [], year).costsCents, 0);
          const row = rentalRow11(income, costs);
          return (
            <p style={{ margin: "4px 0" }}>
              Podklad pre DP za {year}, oddiel VI, tabuľka 1, riadok 11: stĺpec 1 <strong>{eur(row.col1Cents)}</strong>, stĺpec 2 <strong>{eur(row.col2Cents)}</strong>. Na overenie, nie konečné číslo daňového priznania.
            </p>
          );
        })()}
          </div>
        );
      })()}
      {properties.length === 0 && editing === null && <p>Zatiaľ nie je zapísaná žiadna nehnuteľnosť.</p>}
      {properties.map((p) => {
        const net = netPropertyValueCents(p);
        const stale = valueIsStale(p.valueDate, today);
        return (
          <div key={p.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
            <p style={{ margin: 0 }}><strong>{p.name || "Nehnuteľnosť"}</strong> · {PROPERTY_MODE_LABEL[p.mode]}</p>
            <p style={{ margin: "4px 0" }}>Odhad: {eur(p.valueCents)} (k {dateSk(p.valueDate)})</p>
            {(p.acquisitionDate || p.acquisitionCostCents !== undefined) && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                Obstarané{p.acquisitionDate ? ` ${dateSk(p.acquisitionDate)}` : ""}{p.acquisitionCostCents !== undefined ? ` za ${eur(p.acquisitionCostCents)}` : ""} (evidencia pre dane)
              </p>
            )}
            {p.mode === "prenajom" && p.rentalStartDate && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Prenájom od {dateSk(p.rentalStartDate)}</p>
            )}
            {(p.taxMunicipality || p.cadastralArea || p.parcelNumber || p.buildingNumber || p.flatNumber || p.floorAreaSqm !== undefined) && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                Údaje pre daň: {[
                  p.taxMunicipality && `obec ${p.taxMunicipality}`,
                  p.cadastralArea && `k. ú. ${p.cadastralArea}`,
                  p.parcelNumber && `parcela ${p.parcelNumber}`,
                  p.buildingNumber && `súp. č. ${p.buildingNumber}`,
                  p.flatNumber && `byt ${p.flatNumber}`,
                  p.floorAreaSqm !== undefined && `${p.floorAreaSqm.toLocaleString("sk-SK")} m²`,
                ].filter(Boolean).join(", ")}
              </p>
            )}
            {p.mode === "prenajom" && <RentalLedger repo={repo} property={p} today={today} onDone={onSaved} renderAttachments={renderRentalAttachments} />}
            {stale && <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Odhad je starší ako 12 mesiacov. Over ho a zadaj nový.</p>}
            <p style={{ margin: "4px 0" }}>Hypotéka: {eur(p.mortgageBalanceCents)}</p>
            {paymentBelowInterest(p.mortgageBalanceCents, p.mortgageRate ?? 0, p.monthlyPaymentCents ?? 0) && (
              <p role="note" style={{ margin: "4px 0", background: "var(--warn-bg)", padding: 6, borderRadius: 6, fontSize: "0.9rem" }}>
                Splátka {eur(p.monthlyPaymentCents ?? 0)} nepokrýva nominálny úrok ({eur(splitPayment(p).interestCents)} mesačne pri sadzbe {String(Number(((p.mortgageRate ?? 0) * 100).toFixed(4)))} % p. a.). Zostatok hypotéky sa nezníži.
              </p>
            )}
            <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", margin: "8px 0", fontSize: "0.95rem" }}>
              {p.mode === "prenajom" && <><dt>Nájom</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyRentCents ?? 0)}</dd></>}
              <dt>Splátka hypotéky</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyPaymentCents ?? 0)}</dd>
              {(p.monthlyPaymentCents ?? 0) > 0 && p.mortgageBalanceCents > 0 && (
                <>
                  <dt style={{ paddingLeft: 12, color: "var(--muted)" }}>z toho úrok</dt><dd style={{ margin: 0, textAlign: "right", color: "var(--muted)" }}>{eur(splitPayment(p).interestCents)}</dd>
                  <dt style={{ paddingLeft: 12, color: "var(--muted)" }}>z toho istina</dt><dd style={{ margin: 0, textAlign: "right", color: "var(--muted)" }}>{eur(splitPayment(p).principalCents)}</dd>
                </>
              )}
              <dt>Ostatné náklady</dt><dd style={{ margin: 0, textAlign: "right" }}>{eur(p.monthlyOtherCostsCents ?? 0)}</dd>
              <dt><strong>Mesačné náklady spolu</strong></dt><dd style={{ margin: 0, textAlign: "right" }}><strong>{eur(monthlyCostsCents(p))}</strong></dd>
            </dl>
            <p style={{ margin: "4px 0" }}>
              Čistá hodnota: <strong>{eur(net)}</strong>
              {net < 0 && <span> (hypotéka presahuje odhad)</span>}
            </p>
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              {p.mode === "nezadane" ? "Do K sa zatiaľ nepočíta: zadaj režim." : p.mode === "prenajom" ? "Do K sa počíta ako čistá hodnota." : "Do K sa nepočíta."}
            </p>
            {p.mortgageBalanceCents > 0 && (p.monthlyPaymentCents ?? 0) > 0 && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                {(() => {
                  const months = remainingMonths(p.mortgageBalanceCents, p.mortgageRate ?? 0, p.monthlyPaymentCents ?? 0);
                  return months === null ? null : `Pri tejto splátke sa zostatok splatí za ${months} mesiacov.`;
                })()}
              </p>
            )}
            {p.mortgageBalanceCents > 0 && (
              <details style={{ margin: "8px 0" }}>
                <summary>Mimoriadna splátka hypotéky</summary>
                <ExtraPaymentForm key={(p.extraPayments ?? []).length} repo={repo} property={p} today={today} onDone={onSaved} />
              </details>
            )}
            {(p.extraPayments ?? []).length > 0 && (
              <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
                Mimoriadne splátky: {(p.extraPayments ?? []).map((e) => `${dateSk(e.date)} ${eur(e.amountCents)} (${EXTRA_PAYMENT_LABEL[e.mode]})`).join("; ")}
              </p>
            )}
            <ExtraPaymentUndo repo={repo} property={p} onDone={onSaved} />
            {confirmId === p.id ? (
              <div>
                <p>Naozaj zmazať nehnuteľnosť „{p.name || "Nehnuteľnosť"}“?</p>
                <button onClick={() => remove(p.id)} style={btnDanger}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
              </div>
            ) : (
              <div>
                <button onClick={() => { setEditing(p); setErr(null); }} style={btn}>Upraviť</button>{" "}
                <button onClick={() => setConfirmId(p.id)} style={btnDanger}>Zmazať</button>
              </div>
            )}
          </div>
        );
      })}
      {properties.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: "var(--muted)" }}>Údaje z nehnuteľností sa použijú v tlačive 17-dp-md.</p>
          <NextStep to="dane">Dane a tlačivo</NextStep>
          {properties.some((p) => p.mortgageBalanceCents > 0) && <NextStep to="zavazky">Záväzky (úver, kreditná karta)</NextStep>}
        </div>
      )}
      {editing !== null ? (
        <PropertyForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btnPrimary}>Pridať nehnuteľnosť</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <AssetSection repo={repo} assets={assets} today={today} onSaved={onSaved} />
    </section>
  );
}

const ASSET_KIND_LABEL: Record<AssetKind, string> = {
  automobil: "Automobil",
  pravo: "Ocenitelné právo",
};

/** Automobil a ocenitelné právo (docs/11, bod 10): názov, odhad a dátum; do K sa zatiaľ nepočítajú. */
function AssetSection({ repo, assets, today, onSaved }: { repo: Repository; assets: Asset[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<Asset | AssetKind | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      await repo.deleteAsset(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: "1rem" }}>Automobily a ocenitelné práva</h3>
      <p style={{ color: "var(--muted)" }}>Odhad je tvoj, nie trhová cena. Zatiaľ sa do K nepočítajú (predpoklad).</p>
      {assets.length === 0 && editing === null && <p>Zatiaľ nie je zapísané žiadne aktívum.</p>}
      {assets.map((a) => (
        <div key={a.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{a.name}</strong> · {ASSET_KIND_LABEL[a.kind]}</p>
          <p style={{ margin: "4px 0" }}>Odhad: {eur(a.valueCents)} (k {dateSk(a.valueDate)})</p>
          {valueIsStale(a.valueDate, today) && <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>Odhad je starší ako 12 mesiacov. Over ho a zadaj nový.</p>}
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Do K sa zatiaľ nepočíta.</p>
          {confirmId === a.id ? (
            <div>
              <p>Naozaj zmazať aktívum „{a.name}“?</p>
              <button onClick={() => remove(a.id)} style={btnDanger}>Potvrdiť zmazanie</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <div>
              <button onClick={() => { setEditing(a); setErr(null); }} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(a.id)} style={btnDanger}>Zmazať</button>
            </div>
          )}
        </div>
      ))}
      {editing !== null ? (
        <AssetForm
          key={typeof editing === "string" ? `new-${editing}` : editing.id}
          repo={repo}
          kind={typeof editing === "string" ? editing : editing.kind}
          initial={typeof editing === "string" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div>
          {ASSET_KINDS.map((k) => (
            <button key={k} onClick={() => setEditing(k)} style={{ ...btn, marginRight: 8 }}>Pridať: {ASSET_KIND_LABEL[k].toLowerCase()}</button>
          ))}
        </div>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}

function AssetForm({ repo, kind, initial, today, onDone, onCancel }: { repo: Repository; kind: AssetKind; initial: Asset | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [value, setValue] = useState<NumIn>(initial ? initial.valueCents / 100 : "");
  const [valueDate, setValueDate] = useState(initial?.valueDate ?? today);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    if (Number.isNaN(asNum(value))) return setErr("Vyplň odhad hodnoty.");
    if (asNum(value) < 0) return setErr("Odhad hodnoty nesmie byť záporný.");
    const dateErr = checkDate(valueDate, today, "dátum odhadu");
    if (dateErr.length) return setErr(dateErr[0]);
    const now = new Date().toISOString();
    const asset: Asset = {
      id: initial?.id ?? uid(),
      kind,
      name: trimmed,
      valueCents: cents(asNum(value)),
      valueDate,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await repo.saveAsset(asset);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť" : "Nové"}: {ASSET_KIND_LABEL[kind].toLowerCase()}</h4>
      <Field label="Názov (napr. značka a rok, alebo podiel)" value={name} type="text" onChange={setName} maxLength={80} />
      <Field label="Odhad hodnoty (€)" value={value} onChange={setValue} />
      <Field label="Dátum odhadu" value={valueDate} type="date" max={today} onChange={setValueDate} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

/** Upozornenie k podlahovej ploche z listu (D-231): z podielu sa nedá vždy vyčítať, preto ju overí vlastník. */
function floorWarning(area: number | undefined): string {
  return area === undefined
    ? "Podlahovú plochu z podielu nevieme vyčítať. Zadaj ju sám z kúpnej zmluvy alebo z listu, ak je v ňom uvedená."
    : "Podlahová plocha je vypočítaná z podielu spoluvlastníctva. Over ju s kúpnou zmluvou.";
}

/** Front zápisov do evidencie prenájmu (D-157): jeden zápis naraz, aby sa žiadny neprepísal. */
let rentalSaveQueue: Promise<void> = Promise.resolve();

/** Ročná evidencia príjmov a výdavkov z prenájmu (D-157): priebežne počas roka, súčty sú len podklad pre daňové priznanie. */
function RentalLedger({ repo, property, today, onDone, renderAttachments }: { repo: Repository; property: Property; today: string; onDone: () => void; renderAttachments: (entryId: string) => ReactNode }) {
  const entries = property.rentalLedger ?? [];
  const currentYear = Number(today.slice(0, 4));
  const years = [...new Set([currentYear, ...rentalYears(entries)])].sort((a, b) => b - a);
  const [year, setYear] = useState(currentYear);
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<RentalEntryKind>("prijem");
  const [amount, setAmount] = useState<NumIn>("");
  const [note, setNote] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const totals = rentalTotalsForYear(entries, year);
  const yearEntries = entries.filter((e) => e.date.startsWith(`${year}-`)).sort((a, b) => a.date.localeCompare(b.date));

  // Zápisy sa radia za sebou a vždy čítajú aktuálne dáta, aby sa rýchly zápis neprepísal (D-157).
  // Voliteľný krok po úspešnom zápise (mazanie príloh výdavku, D-221).
  const save = (mutate: (list: RentalEntry[]) => RentalEntry[], after?: () => Promise<void>) => {
    rentalSaveQueue = rentalSaveQueue.then(async () => {
      try {
        const fresh = (await repo.getData()).properties.find((p) => p.id === property.id) ?? property;
        await repo.saveProperty({ ...fresh, rentalLedger: mutate(fresh.rentalLedger ?? []), updatedAt: new Date().toISOString() });
        if (after) await after();
        setErr(null);
        onDone();
      } catch {
        setErr(STORAGE_ERROR);
      }
    });
    return rentalSaveQueue;
  };

  const add = async () => {
    const dErr = checkDate(date, today, "dátum záznamu");
    if (dErr.length) return setErr(dErr[0]);
    const a = asNum(amount);
    if (Number.isNaN(a) || a <= 0) return setErr("Vyplň sumu väčšiu ako 0.");
    const entry: RentalEntry = { id: uid(), date, kind, amountCents: cents(a), ...(note.trim() ? { note: note.trim().slice(0, 120) } : {}) };
    setAmount("");
    setNote("");
    await save((list) => [...list, entry]);
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 10, margin: "8px 0" }}>
      <p style={{ margin: 0 }}><strong>Príjmy a výdavky z prenájmu</strong></p>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "4px 0" }}>Zapisuj priebežne. Súčty sú len podklad pre daňové priznanie, nie daňový výpočet.</p>
      <label style={{ display: "block", margin: "6px 0" }}>
        Rok{" "}
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ minHeight: 44 }}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <p style={{ margin: "4px 0" }}>Za rok {year}: prijatý nájom <strong>{eur(totals.incomeCents)}</strong>, výdavky <strong>{eur(totals.costsCents)}</strong>, zápisov {totals.count}.</p>
      {yearEntries.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Za tento rok zatiaľ nie sú záznamy.</p>}
      <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "0.9rem" }}>
        {yearEntries.map((e) => (
          <li key={e.id}>
            {dateSk(e.date)} · {e.kind === "prijem" ? "príjem" : "výdavok"} · {eur(e.amountCents)}{e.note ? ` (${e.note})` : ""}{" "}
            {confirmId === e.id ? (
              <>
                <button onClick={() => save((list) => list.filter((x) => x.id !== e.id), () => repo.deleteAttachmentsForRentalEntries([e.id]))} style={btnDanger}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
              </>
            ) : (
              <button onClick={() => setConfirmId(e.id)} style={btnDanger}>Zmazať</button>
            )}
            {e.kind === "vydavok" && <details style={{ margin: "4px 0" }}><summary>Doklady</summary>{renderAttachments(e.id)}</details>}
          </li>
        ))}
      </ul>
      <Field label="Dátum záznamu" value={date} type="date" max={today} onChange={setDate} />
      <label style={{ display: "block", margin: "6px 0" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>Druh záznamu</span>
        <select aria-label="Druh záznamu" value={kind} onChange={(e) => setKind(e.target.value as RentalEntryKind)} style={{ minHeight: 44, width: "100%" }}>
          <option value="prijem">Príjem z nájmu</option>
          <option value="vydavok">Výdavok na prenájom</option>
        </select>
      </label>
      <Field label="Suma (€) – prenájom" value={amount} onChange={setAmount} />
      <Field label="Poznámka (nepovinné)" value={note} type="text" onChange={setNote} maxLength={120} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={add} style={btnPrimary}>Pridať záznam</button>
    </div>
  );
}

const EXTRA_PAYMENT_LABEL: Record<ExtraPaymentMode, string> = {
  znizit_splatku: "znížená splátka",
  skratit_termin: "skrátený termín",
};

/** Vrátenie poslednej mimoriadnej splátky (D-145): obnoví zostatok a splátku pred ňou. Záznamy bez uložených hodnôt sa vrátiť nedajú. */
function ExtraPaymentUndo({ repo, property, onDone }: { repo: Repository; property: Property; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const list = property.extraPayments ?? [];
  const last = list[list.length - 1];
  if (!last) return null;
  if (last.balanceBeforeCents === undefined || last.monthlyPaymentBeforeCents === undefined) {
    // Záznam z obdobia pred opravou: nevieme, aké hodnoty boli pred ním, preto sa len odstráni z histórie.
    const removeRecord = async () => {
      try {
        await repo.saveProperty({ ...property, extraPayments: list.slice(0, -1), updatedAt: new Date().toISOString() });
        setConfirming(false);
        onDone();
      } catch {
        setErr(STORAGE_ERROR);
      }
    };
    return (
      <div style={{ margin: "4px 0" }}>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Poslednú splátku nie je možné vrátiť automaticky. Zostatok a splátku uprav v Upraviť.</p>
        {confirming ? (
          <div>
            <p>Naozaj zmazať záznam z {dateSk(last.date)} ({eur(last.amountCents)})? Zostatok a splátka sa nezmenia.</p>
            <button onClick={removeRecord} style={btnDanger}>Potvrdiť zmazanie záznamu</button>{" "}
            <button onClick={() => setConfirming(false)} style={btn}>Zrušiť</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} style={btnDanger}>Zmazať záznam z histórie</button>
        )}
        {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      </div>
    );
  }
  const undo = async () => {
    try {
      await repo.saveProperty({
        ...property,
        mortgageBalanceCents: last.balanceBeforeCents as number,
        monthlyPaymentCents: last.monthlyPaymentBeforeCents as number,
        extraPayments: list.slice(0, -1),
        updatedAt: new Date().toISOString(),
      });
      setConfirming(false);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };
  return (
    <div style={{ margin: "4px 0" }}>
      {confirming ? (
        <div>
          <p>Naozaj vrátiť splátku z {dateSk(last.date)} ({eur(last.amountCents)})? Zostatok a splátka sa vrátia na hodnoty pred ňou.</p>
          <button onClick={undo} style={btn}>Potvrdiť vrátenie</button>{" "}
          <button onClick={() => setConfirming(false)} style={btn}>Zrušiť</button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} style={btn}>Vrátiť poslednú mimoriadnu splátku</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}

/** Mimoriadna splátka hypotéky (N-15, D-145): najprv náhľad, čo sa stane, potom zápis. */
function ExtraPaymentForm({ repo, property, today, onDone }: { repo: Repository; property: Property; today: string; onDone: () => void }) {
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState<NumIn>("");
  const [mode, setMode] = useState<ExtraPaymentMode>("znizit_splatku");
  const [err, setErr] = useState<string | null>(null);

  const amountValue = asNum(amount);
  const amountCents = Number.isFinite(amountValue) && amountValue > 0 ? cents(amountValue) : 0;
  const preview = amountCents > 0 && amountCents <= property.mortgageBalanceCents ? applyExtraPayment(property, amountCents, mode) : null;
  const oldPayment = eur(property.monthlyPaymentCents ?? 0);
  let description: string | null = null;
  if (amountCents === 0) description = "Zadaj sumu mimoriadnej splátky.";
  else if (amountCents > property.mortgageBalanceCents) description = "Suma je vyššia ako zostatok hypotéky.";
  else if (preview === null) description = "Splátka sa nedá znížiť, lebo nepokrýva úrok. Zvoľ skrátenie termínu.";
  else if (mode === "znizit_splatku") description = `Zostatok po splátke: ${eur(preview.mortgageBalanceCents)}. Nová splátka: ${eur(preview.monthlyPaymentCents)} (bola ${oldPayment}), termín ostane ${preview.monthsAfter ?? "?"} mesiacov.`;
  else if (preview.monthsBefore === null) description = `Zostatok po splátke: ${eur(preview.mortgageBalanceCents)}. Splátka ostane ${eur(preview.monthlyPaymentCents)}.`;
  else description = `Zostatok po splátke: ${eur(preview.mortgageBalanceCents)}. Splátka ostane ${eur(preview.monthlyPaymentCents)}; termín sa skráti z ${preview.monthsBefore} na ${preview.monthsAfter ?? "?"} mesiacov.`;

  const save = async () => {
    if (!property.balanceDate) return setErr("Najprv v úprave nehnuteľnosti nastav dátum, ku ktorému platí zostatok.");
    const dErr = checkDate(date, today, "dátum splátky");
    if (dErr.length) return setErr(dErr[0]);
    if (date < property.balanceDate) return setErr(`Dátum musí byť od ${dateSk(property.balanceDate)}, keď platí zostatok.`);
    if (amountCents <= 0) return setErr("Vyplň sumu väčšiu ako 0.");
    if (amountCents > property.mortgageBalanceCents) return setErr("Suma je vyššia ako zostatok hypotéky.");
    const result = applyExtraPayment(property, amountCents, mode);
    if (!result) return setErr("Splátka sa nedá znížiť, lebo nepokrýva úrok. Zvoľ skrátenie termínu.");
    try {
      await repo.saveProperty({
        ...property,
        mortgageBalanceCents: result.mortgageBalanceCents,
        monthlyPaymentCents: result.monthlyPaymentCents,
        extraPayments: [...(property.extraPayments ?? []), { id: uid(), date, amountCents, mode, balanceBeforeCents: property.mortgageBalanceCents, monthlyPaymentBeforeCents: property.monthlyPaymentCents ?? 0 }],
        updatedAt: new Date().toISOString(),
      });
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, marginTop: 8, background: "var(--surface)" }}>
      <Field label="Dátum splátky" value={date} type="date" max={today} onChange={setDate} />
      <Field label="Suma (€)" value={amount} onChange={setAmount} />
      <fieldset style={{ border: 0, padding: 0, margin: "8px 0" }}>
        <legend style={{ fontSize: "0.9rem" }}>Čo sa má zmeniť</legend>
        {EXTRA_PAYMENT_MODES.map((m) => (
          <label key={m} style={{ display: "block", margin: "4px 0" }}>
            <input type="radio" name={`mimoriadna-${property.id}`} checked={mode === m} onChange={() => setMode(m)} />{" "}
            {m === "znizit_splatku" ? "Znížiť splátku (termín ostane)" : "Skrátiť termín (splátka ostane)"}
          </label>
        ))}
      </fieldset>
      {description && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{description}</p>}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Zapísať mimoriadnu splátku</button>
    </div>
  );
}

function PropertyForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: Property | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [mode, setMode] = useState<PropertyMode>(initial?.mode ?? "nezadane");
  const [value, setValue] = useState<NumIn>(initial ? initial.valueCents / 100 : "");
  const [valueDate, setValueDate] = useState(initial?.valueDate ?? today);
  const [mortgage, setMortgage] = useState<NumIn>(initial ? initial.mortgageBalanceCents / 100 : 0);
  const [rent, setRent] = useState<NumIn>(initial?.monthlyRentCents !== undefined ? initial.monthlyRentCents / 100 : "");
  const [rate, setRate] = useState<NumIn>(initial?.mortgageRate !== undefined ? Number((initial.mortgageRate * 100).toFixed(6)) : "");
  const [payment, setPayment] = useState<NumIn>(initial?.monthlyPaymentCents !== undefined ? initial.monthlyPaymentCents / 100 : "");
  const [otherCosts, setOtherCosts] = useState<NumIn>(initial?.monthlyOtherCostsCents !== undefined ? initial.monthlyOtherCostsCents / 100 : "");
  const [balanceDate, setBalanceDate] = useState(initial?.balanceDate ?? today);
  const [acqDate, setAcqDate] = useState(initial?.acquisitionDate ?? "");
  const [acqCost, setAcqCost] = useState<NumIn>(initial?.acquisitionCostCents !== undefined ? initial.acquisitionCostCents / 100 : "");
  const [rentalStart, setRentalStart] = useState(initial?.rentalStartDate ?? "");
  const [taxKind, setTaxKind] = useState<"" | "dom" | "byt">(initial?.taxObjectKind ?? "");
  const [taxMuni, setTaxMuni] = useState(initial?.taxMunicipality ?? "");
  const [cadastral, setCadastral] = useState(initial?.cadastralArea ?? "");
  const [parcel, setParcel] = useState(initial?.parcelNumber ?? "");
  const [building, setBuilding] = useState(initial?.buildingNumber ?? "");
  const [flat, setFlat] = useState(initial?.flatNumber ?? "");
  // Predvyplnenie z listu vlastníctva (D-209, D-211): text alebo uložená HTML stránka; nič sa neukladá.
  const [lvText, setLvText] = useState("");
  const [lvNote, setLvNote] = useState<string | null>(null);
  const [lvPledge, setLvPledge] = useState<"none" | "mortgage" | "owners">("none");
  const [lvOpen, setLvOpen] = useState(false);
  const [lvFlats, setLvFlats] = useState<LvFlatChoice[]>([]);
  const [flatIdx, setFlatIdx] = useState("");
  const [lvWarn, setLvWarn] = useState<string | null>(null);
  const applyFields = (x: LvTaxFields) => {
    if (x.taxMunicipality) setTaxMuni(x.taxMunicipality);
    if (x.cadastralArea) setCadastral(x.cadastralArea);
    if (x.parcelNumber) setParcel(x.parcelNumber);
    if (x.buildingNumber) setBuilding(x.buildingNumber);
    if (x.flatNumber) setFlat(x.flatNumber);
    if (x.floorAreaSqm !== undefined) setFloorArea(x.floorAreaSqm);
    if (x.taxObjectKind) setTaxKind(x.taxObjectKind);
  };
  const applyLv = (f: LvFields) => {
    setLvPledge(f.pledgeForOwners ? "owners" : f.hasPledge ? "mortgage" : "none");
    setLvFlats(f.flats ?? []);
    setFlatIdx("");
    setLvWarn(null);
    if (f.found.length === 0) return setLvNote("V texte sme nenašli údaje pre daň. Skontroluj, že si vložil celý text alebo celú stránku listu vlastníctva.");
    if (f.flats) {
      // Údaje bytu sa nedoplnia sami: vlastník vyberie svoj byt, inak by sa doplnil cudzí byt (D-231).
      applyFields({ taxMunicipality: f.taxMunicipality, cadastralArea: f.cadastralArea, parcelNumber: f.parcelNumber, buildingNumber: f.buildingNumber });
      setLvNote(`V liste je ${f.flats.length} bytov. Vyber svoj byt v zozname; jeho údaje sa doplnia po výbere.`);
      return;
    }
    applyFields(f);
    setLvNote(`Doplnené: ${f.found.join(", ")}. Skontroluj údaje a ulož nehnuteľnosť.`);
    if (f.flatNumber) setLvWarn(floorWarning(f.floorAreaSqm));
  };
  const chooseFlat = (c: LvFlatChoice) => {
    setFlat(c.fields.flatNumber ?? "");
    setFloorArea(c.fields.floorAreaSqm ?? "");
    applyFields(c.fields);
    setLvNote(`Údaje vybraného bytu (${c.label}) sú doplnené. Skontroluj ich a ulož nehnuteľnosť.`);
    setLvWarn(floorWarning(c.fields.floorAreaSqm));
  };
  const fillFromText = () => {
    const f = /<(?:table|td|html)\b/i.test(lvText) ? parseLvHtml(lvText) : parseLvText(lvText);
    setLvText("");
    applyLv(f);
  };
  const fillFromFile = (file: File) => {
    if (file.size > LV_MAX_FILE_BYTES) {
      setLvNote("Súbor je väčší než 2 MB. Ulož stránku listu bez obrázkov alebo vlož text z listu.");
      return;
    }
    void file.text().then((html) => applyLv(parseLvHtml(html)));
  };
  const [floorArea, setFloorArea] = useState<NumIn>(initial?.floorAreaSqm !== undefined ? initial.floorAreaSqm : "");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (name.trim().length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    if (acqDate !== "") {
      const aErr = checkDate(acqDate, today, "dátum obstarania");
      if (aErr.length) return setErr(aErr[0]);
    }
    const ac = acqCost === "" ? undefined : asNum(acqCost);
    if (ac !== undefined && (Number.isNaN(ac) || ac < 0)) return setErr("Obstarávacia cena musí byť číslo 0 alebo viac.");
    if (mode === "prenajom" && rentalStart !== "") {
      const rErr = checkDate(rentalStart, today, "dátum začiatku prenájmu");
      if (rErr.length) return setErr(rErr[0]);
    }
    if (Number.isNaN(asNum(value))) return setErr("Vyplň odhad hodnoty.");
    if (asNum(value) < 0) return setErr("Odhad hodnoty nesmie byť záporný.");
    const dateErr = checkDate(valueDate, today, "dátum odhadu");
    if (dateErr.length) return setErr(dateErr[0]);
    const m = mortgage === "" ? 0 : asNum(mortgage);
    if (Number.isNaN(m) || m < 0) return setErr("Zostatok hypotéky musí byť číslo 0 alebo viac.");
    if (m > 0) {
      const bErr = checkDate(balanceDate, today, "dátum zostatku hypotéky");
      if (bErr.length) return setErr(bErr[0]);
    }
    const r = mode === "prenajom" && rent !== "" ? asNum(rent) : undefined;
    if (r !== undefined && (Number.isNaN(r) || r < 0)) return setErr("Nájom musí byť číslo 0 alebo viac.");
    const rt = rate === "" ? 0 : asNum(rate);
    if (Number.isNaN(rt) || rt < 0 || rt >= 100) return setErr("Úroková sadzba musí byť od 0 do menej ako 100 %.");
    const pay = payment === "" ? 0 : asNum(payment);
    if (Number.isNaN(pay) || pay < 0) return setErr("Splátka hypotéky musí byť číslo 0 alebo viac.");
    const other = otherCosts === "" ? 0 : asNum(otherCosts);
    if (Number.isNaN(other) || other < 0) return setErr("Ostatné náklady musia byť číslo 0 alebo viac.");
    const now = new Date().toISOString();
    const trimmed = name.trim();
    const property: Property = {
      id: initial?.id ?? uid(),
      mode,
      valueCents: cents(asNum(value)),
      valueDate,
      mortgageBalanceCents: cents(m),
      ...(m > 0 ? { balanceDate } : {}),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(trimmed ? { name: trimmed } : {}),
      ...(r !== undefined ? { monthlyRentCents: cents(r) } : {}),
      ...(pay > 0 ? { monthlyPaymentCents: cents(pay) } : {}),
      ...(rt > 0 ? { mortgageRate: rt / 100 } : {}),
      ...(other > 0 ? { monthlyOtherCostsCents: cents(other) } : {}),
      ...(initial?.extraPayments ? { extraPayments: initial.extraPayments } : {}),
      ...(initial?.rentalLedger ? { rentalLedger: initial.rentalLedger } : {}),
      ...(acqDate !== "" ? { acquisitionDate: acqDate } : {}),
      ...(ac !== undefined ? { acquisitionCostCents: cents(ac) } : {}),
      ...(mode === "prenajom" && rentalStart !== "" ? { rentalStartDate: rentalStart } : {}),
      ...(taxKind !== "" ? { taxObjectKind: taxKind } : {}),
      ...(taxMuni.trim() ? { taxMunicipality: taxMuni.trim() } : {}),
      ...(cadastral.trim() ? { cadastralArea: cadastral.trim() } : {}),
      ...(parcel.trim() ? { parcelNumber: parcel.trim() } : {}),
      ...(building.trim() ? { buildingNumber: building.trim() } : {}),
      ...(flat.trim() ? { flatNumber: flat.trim() } : {}),
      ...(floorArea !== "" && !Number.isNaN(asNum(floorArea)) ? { floorAreaSqm: asNum(floorArea) } : {}),
    };
    try {
      await repo.saveProperty(property);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h3 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť nehnuteľnosť" : "Nová nehnuteľnosť"}</h3>
      <Field label="Názov (nepovinné)" value={name} type="text" onChange={setName} maxLength={80} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Režim
        <select value={mode} onChange={(e) => setMode(e.target.value as PropertyMode)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {PROPERTY_MODES.map((m) => (
            <option key={m} value={m}>{PROPERTY_MODE_LABEL[m]}</option>
          ))}
        </select>
      </label>
      <Field label="Odhad hodnoty (€)" value={value} onChange={setValue} />
      <Field label="Dátum odhadu" value={valueDate} type="date" max={today} onChange={setValueDate} />
      <Field label="Dátum obstarania (nepovinné)" value={acqDate} type="date" max={today} onChange={setAcqDate} hint="evidencia pre dane; nepočíta sa" />
      <Field label="Obstarávacia cena (€, nepovinné)" value={acqCost} onChange={setAcqCost} hint="cena pri kúpe, nie odhad; nepočíta sa" />
      {mode === "prenajom" && <Field label="Dátum začiatku prenájmu (nepovinné)" value={rentalStart} type="date" max={today} onChange={setRentalStart} />}
      <button type="button" onClick={() => setLvOpen((o) => !o)} aria-expanded={lvOpen} style={{ ...btn, marginBottom: 8 }}>Predvyplniť z listu vlastníctva</button>
      {lvOpen && (
        <div style={{ marginBottom: 12 }}>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Ako získať súbor: na katastrálnom portáli otvor výpis z listu vlastníctva a stlač Ctrl+S. V Edge zvoľ „Webová stránka, úplne“, v Chrome „Webová stránka, kompletná“. Potom súbor nahraj tu.
          Skopíruj text z listu vlastníctva a vlož ho sem, alebo nahraj uloženú stránku listu (HTML). Appka doplní údaje pre daň. Text sa neukladá a vlastníkov ani číslo LV appka neberie.
        </p>
        <textarea aria-label="Text z listu vlastníctva" value={lvText} onChange={(e) => setLvText(e.target.value)} rows={6} style={{ width: "100%", boxSizing: "border-box", fontSize: "1rem" }} />
        <button type="button" onClick={fillFromText} disabled={lvText.trim() === ""} style={btn}>Predvyplniť z textu</button>
        <label style={{ display: "block", margin: "8px 0" }}>
          <span style={{ display: "block", fontSize: "0.9rem" }}>Alebo nahraj uloženú stránku listu (HTML)</span>
          <input
            type="file"
            accept=".html,.htm,text/html"
            aria-label="Nahrať uloženú stránku listu vlastníctva"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) fillFromFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {lvNote && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{lvNote}</p>}
        {lvWarn && <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>{lvWarn}</p>}
        {lvFlats.length > 1 && (
          <label style={{ display: "block", margin: "8px 0" }}>
            <span style={{ display: "block", fontSize: "0.9rem" }}>Ktorý byt je tvoj?</span>
            <select
              aria-label="Byt v liste vlastníctva"
              value={flatIdx}
              onChange={(e) => {
                setFlatIdx(e.target.value);
                if (e.target.value !== "") chooseFlat(lvFlats[Number(e.target.value)]);
              }}
              style={{ minHeight: 44, width: "100%" }}
            >
              <option value="">Vyber byt</option>
              {lvFlats.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
            </select>
          </label>
        )}
        {lvPledge === "mortgage" && (
          <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
            V liste je záložné právo. Ak máš hypotéku, zadaj jej zostatok nižšie. Hypotéku appka nevytvára sama.
          </p>
        )}
        {lvPledge === "owners" && (
          <p style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6 }}>
            V liste je záložné právo v prospech ostatných vlastníkov bytov. Nie je to hypotéka.
          </p>
        )}
        </div>
      )}
      <label style={{ display: "block", marginBottom: 8 }}>
        Druh objektu pre daň (nepovinné)
        <select aria-label="Druh objektu pre daň" value={taxKind} onChange={(e) => setTaxKind(e.target.value as "" | "dom" | "byt")} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          <option value="">nezadané</option>
          <option value="dom">stavba na bývanie (dom)</option>
          <option value="byt">byt</option>
        </select>
      </label>
      <Field label="Obec (pre daň z nehnuteľností, nepovinné)" value={taxMuni} type="text" onChange={setTaxMuni} maxLength={80} />
      <Field label="Katastrálne územie (nepovinné)" value={cadastral} type="text" onChange={setCadastral} maxLength={80} />
      <Field label="Číslo parcely (nepovinné)" value={parcel} type="text" onChange={setParcel} maxLength={80} />
      <Field label="Súpisné číslo (nepovinné)" value={building} type="text" onChange={setBuilding} maxLength={80} />
      <Field label="Číslo bytu (nepovinné)" value={flat} type="text" onChange={setFlat} maxLength={80} />
      <Field label="Podlahová plocha (m², nepovinné)" value={floorArea} onChange={setFloorArea} hint="z kúpnej zmluvy alebo listu vlastníctva; len na podklad pre daň" />
      <Field label="Zostatok hypotéky (€)" value={mortgage} onChange={setMortgage} hint="0, ak hypotéku nemáš" />
      {typeof mortgage === "number" && mortgage > 0 && (
        <Field label="Zostatok platí k (dátum)" value={balanceDate} type="date" max={today} onChange={setBalanceDate} hint="nechaj dnešný dátum, ak si zostatok práve zistil; od tohto dátumu sa každý mesiac automaticky znižuje o istinu" />
      )}
      <Field label="Úroková sadzba hypotéky (% p. a.)" value={rate} step={0.01} onChange={setRate} hint="0, ak hypotéku nemáš" />
      <Field label="Mesačná splátka hypotéky (€)" value={payment} onChange={setPayment} hint="0, ak hypotéku nemáš" />
      <Field label="Ostatné mesačné náklady (€)" value={otherCosts} onChange={setOtherCosts} hint="údržba, poistenie, poplatky; 0, ak nie sú" />
      {mode === "prenajom" && <Field label="Mesačný nájom (€, nepovinné)" value={rent} onChange={setRent} />}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť nehnuteľnosť</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
