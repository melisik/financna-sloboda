import { useState } from "react";
import type { Repository } from "../../storage/repository";
import { DOG_KEEPING_PLACES, DOG_PURPOSES, TAX_REGIMES, type Dog, type DogKeepingPlace, type DogPurpose, type Position, type Property, type TaxRegime } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import { DOG_PLACE_LABEL, DOG_PURPOSE_LABEL, activeDogCount } from "../../domain/dogs";
import { TAX_FORM_PATH, buildTaxFormFields } from "../../domain/taxForm";
import { TAX_CATALOG, taxScenario } from "../../domain/tax";
import { cents, dateSk, eur, todayIso } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { saveBlobFile } from "../../ui/kit/files";
import { Field, asNum, btn, inp, type NumIn } from "../../ui/kit/controls";
import { fillTaxFormPdf } from "./taxFormPdf";

/** Dane (FR-24, FR-25, D-104, D-159, D-161): daňový rámec investícií, evidencia psov a tlačivo 17-dp-md. Feature „dane“ (docs/23). */

/** Evidencia psov pre daň za psa (D-159): podklad pre tlačivo 17-dp-md, oddiel V. Sadzbu určuje obec; appka ju nepočíta. */
export function DogSection({ repo, dogs, today, onSaved }: { repo: Repository; dogs: Dog[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<Dog | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (id: string) => {
    try {
      await repo.deleteDog(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section aria-label="Psy">
      <h3 style={{ fontSize: "1.05rem" }}>Psy (daň za psa)</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Evidencia psov pre tlačivo 17-dp-md, oddiel V. Sadzbu určuje obec; appka ju nepočíta.</p>
      <p>Psov evidovaných dnes: <strong>{activeDogCount(dogs, today)}</strong></p>
      {dogs.length === 0 && editing === null && <p>Zatiaľ nie je zapísaný žiadny pes.</p>}
      {dogs.map((d) => (
        <div key={d.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{d.name || "Pes bez mena"}</strong>{d.evidenceNumber ? ` · evidenčné číslo ${d.evidenceNumber}` : ""}</p>
          <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>{d.address}, {d.municipality} · {DOG_PLACE_LABEL[d.keepingPlace]} · účel {DOG_PURPOSE_LABEL[d.purpose]}</p>
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
            Od {dateSk(d.startDate)}{d.endDate ? `, do ${dateSk(d.endDate)}` : ", trvá"}
            {d.breed ? ` · plemeno ${d.breed}` : ""}{d.age ? ` · vek ${d.age}` : ""}{d.holderWithDisability ? " · držiteľ preukazu ŤZP" : ""}
          </p>
          {confirmId === d.id ? (
            <div>
              <p>Naozaj zmazať psa „{d.name || "bez mena"}“?</p>
              <button onClick={() => remove(d.id)} style={btn}>Potvrdiť zmazanie</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <div>
              <button onClick={() => { setEditing(d); setErr(null); }} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(d.id)} style={btn}>Zmazať</button>
            </div>
          )}
        </div>
      ))}
      {editing !== null ? (
        <DogForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btn}>Pridať psa</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

/** Vyplnenie tlačiva 17-dp-md z údajov o nehnuteľnostiach a psoch (D-161). PDF sa uloží alebo zdieľa; nič sa neodosiela. */
export function TaxFormBlock({ properties, dogs, today }: { properties: Property[]; dogs: Dog[]; today: string }) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const fields = buildTaxFormFields(properties, dogs, today);
      const res = await fetch(TAX_FORM_PATH);
      if (!res.ok) throw new Error("tlačivo sa nenašlo");
      const out = await fillTaxFormPdf(new Uint8Array(await res.arrayBuffer()), fields);
      await saveBlobFile(`priznanie-17-dp-md-${today}.pdf`, new Blob([new Uint8Array(out.bytes)], { type: "application/pdf" }));
      setNotes([
        ...(out.tooLong.length > 0 ? [`Tieto údaje sa do tlačiva nezmestili, doplňte ich v PDF ručne: ${out.tooLong.join(", ")}.`] : []),
        ...fields.notes,
      ]);
    } catch {
      setErr("Tlačivo sa nepodarilo vyplniť. Skús to znova.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Tlačivo 17-dp-md" style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      <h3 style={{ fontSize: "1.05rem" }}>Tlačivo 17-dp-md</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        Vyplní sa z údajov o nehnuteľnostiach a psoch (oddiel III, IV a V tlačiva). Údaje daňovníka a ďalšie polia doplníte v PDF.
      </p>
      <button onClick={run} disabled={busy} style={btn}>{busy ? "Vypĺňam…" : "Vyplniť tlačivo (PDF)"}</button>
      {notes.length > 0 && (
        <ul style={{ paddingLeft: 20, fontSize: "0.9rem" }}>
          {notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

function DogForm({ repo, initial, today, onDone, onCancel }: { repo: Repository; initial: Dog | null; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [evidence, setEvidence] = useState(initial?.evidenceNumber ?? "");
  const [breed, setBreed] = useState(initial?.breed ?? "");
  const [age, setAge] = useState(initial?.age ?? "");
  const [municipality, setMunicipality] = useState(initial?.municipality ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [place, setPlace] = useState<DogKeepingPlace>(initial?.keepingPlace ?? "byt");
  const [purpose, setPurpose] = useState<DogPurpose>(initial?.purpose ?? "domaci");
  const [holder, setHolder] = useState(initial?.holderWithDisability ?? false);
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (municipality.trim() === "") return setErr("Vyplň obec, kde je pes chovaný.");
    if (address.trim() === "") return setErr("Vyplň ulicu a číslo domu, kde je pes chovaný.");
    const sErr = checkDate(startDate, today, "dátum vzniku");
    if (sErr.length) return setErr(sErr[0]);
    if (endDate !== "") {
      const eErr = checkDate(endDate, "9999-12-31", "dátum zániku");
      if (eErr.length) return setErr(eErr[0]);
      if (endDate < startDate) return setErr("Zánik nesmie byť pred vznikom.");
    }
    const now = new Date().toISOString();
    const dog: Dog = {
      id: initial?.id ?? uid(),
      municipality: municipality.trim(),
      address: address.trim(),
      keepingPlace: place,
      purpose,
      startDate,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(name.trim() ? { name: name.trim().slice(0, 80) } : {}),
      ...(evidence.trim() ? { evidenceNumber: evidence.trim().slice(0, 40) } : {}),
      ...(breed.trim() ? { breed: breed.trim().slice(0, 80) } : {}),
      ...(age.trim() ? { age: age.trim().slice(0, 20) } : {}),
      ...(holder ? { holderWithDisability: true } : {}),
      ...(endDate !== "" ? { endDate } : {}),
    };
    try {
      await repo.saveDog(dog);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť psa" : "Nový pes"}</h4>
      <Field label="Meno psa (nepovinné)" value={name} type="text" onChange={setName} />
      <Field label="Evidenčné číslo psa (nepovinné)" value={evidence} type="text" onChange={setEvidence} hint="pridelí obec" />
      <Field label="Plemeno (nepovinné)" value={breed} type="text" onChange={setBreed} />
      <Field label="Vek (nepovinné)" value={age} type="text" onChange={setAge} />
      <Field label="Obec, kde je pes chovaný" value={municipality} type="text" onChange={setMunicipality} />
      <Field label="Ulica a číslo domu, kde je pes chovaný" value={address} type="text" onChange={setAddress} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Miesto držania psa
        <select aria-label="Miesto držania psa" value={place} onChange={(e) => setPlace(e.target.value as DogKeepingPlace)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {DOG_KEEPING_PLACES.map((p) => <option key={p} value={p}>{DOG_PLACE_LABEL[p]}</option>)}
        </select>
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Účel držania psa
        <select aria-label="Účel držania psa" value={purpose} onChange={(e) => setPurpose(e.target.value as DogPurpose)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {DOG_PURPOSES.map((p) => <option key={p} value={p}>{DOG_PURPOSE_LABEL[p]}</option>)}
        </select>
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
        <input type="checkbox" checked={holder} onChange={(e) => setHolder(e.target.checked)} />
        Držiteľ preukazu FO s ťažkým zdravotným postihnutím
      </label>
      <Field label="Dátum vzniku daňovej povinnosti" value={startDate} type="date" max={today} onChange={setStartDate} />
      <Field label="Dátum zániku daňovej povinnosti (nepovinné)" value={endDate} type="date" onChange={setEndDate} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btn}>Uložiť psa</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

/** Daňový rámec (FR-24, FR-25, D-104): režimy a stav overenia. Čísla po dani sa nezobrazia, kým nie sú pravidlá overené. */
export function TaxSection({ positions }: { positions: Position[] }) {
  const lines = taxScenario(positions);
  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Hlavný výpočet ostáva nominálny (D-077). Daňový scenár je samostatný a zatiaľ nemá čísla po dani: pravidlá ešte nie sú overené (D-104).</p>
      {lines.map((l) => (
        <div key={l.regime} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{l.label}</strong></p>
          <p style={{ margin: "4px 0" }}>Hodnota investícií v režime: {eur(l.valueCents)}</p>
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
            {l.regime === "nezadane" ? "Zadaj daňový režim v položkách investícií." : "Po dani: čaká na overenie pravidiel."}
          </p>
          <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "var(--muted)" }}>
            Zdroj: {TAX_CATALOG[l.regime].source ?? "nie je zadaný"} · platnosť od: {TAX_CATALOG[l.regime].validFrom ?? "nie je zadaná"} · stav: {TAX_CATALOG[l.regime].status}
          </p>
        </div>
      ))}
    </section>
  );
}
