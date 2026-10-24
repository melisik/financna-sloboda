import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Repository } from "../../storage/repository";
import type { AppData, Attachment, BudgetCategory, Transaction, TransactionType, Source } from "../../storage/types";
import { BUDGET_CATEGORIES, SOURCES } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import { expenseTotalsByCategory, filterHistory, totalsByType } from "../../domain/history";
import { reserveBalance, capitalWithFlags } from "../../domain/ledger";
import type { Ctx } from "../../domain/context";
import { INVESTMENTS_EXHAUSTED_TEXT, payFromCash, payFromInvestments, transferToInvestments, type Capital } from "../../domain/capital";
import { impactWithRentals } from "../../domain/rentalGoal";
import { formatImpactOutcome } from "../../domain/impact";
import { parseReceiptItems } from "../../domain/receiptItems";
import { RECEIPT_CHECK_URL, isReceiptId, receiptIdFromQr } from "../../domain/receipt";
import { recommendedSettings } from "../../domain/recommendations";
import { cents, dateSk, eur, todayIso } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, inp, type NumIn, btnDanger, btnPrimary } from "../../ui/kit/controls";
import { NextStep } from "../../ui/kit/NextStep";
import { ReceiptCamera } from "../../ui/ReceiptCamera";
import { readQrFromImage } from "../../ui/receiptScan";
import { calloutStyle, hintStyle } from "../../ui/kit/controls";

/** Transakcie (FR-08 až FR-12, D-120, D-121, D-160, D-286): zápis, história, filter; prílohy a zmazanie v úprave. Feature „transakcie“ (docs/23). */

const TYPE_LABEL: Record<TransactionType, string> = {
  sporenie: "sporenie (do hotovosti)",
  investicia: "investícia",
  vydavok: "výdavok",
  rezerva: "vklad do rezervy",
  vyber_rezervy: "výber z rezervy",
};
const SOURCE_LABEL: Record<Source, string> = { z_prijmu: "z príjmu", z_hotovosti: "z hotovosti", z_investicii: "z investícií" };
/** Kamera je dostupná len v bezpečnom kontexte (HTTPS alebo localhost) a ak prehliadač podporuje getUserMedia. */
const canUseCamera = (): boolean => typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";

export function TransactionSection({ repo, data, ctx, onChanged, renderAttachments }: { repo: Repository; data: AppData; ctx: Ctx; onChanged: () => void; renderAttachments: (transactionId: string) => ReactNode }) {
  const [type, setType] = useState<TransactionType>("vydavok");
  const [amount, setAmount] = useState<NumIn>("");
  const [date, setDate] = useState(todayIso());
  const [source, setSource] = useState<Source>("z_hotovosti");
  const [category, setCategory] = useState<BudgetCategory | "">("");
  const [note, setNote] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [qrMsg, setQrMsg] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [itemsText, setItemsText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Transaction | null>(null);
  const [undoAtt, setUndoAtt] = useState<Attachment[]>([]);
  // Doklad (QR kód, položky) je zbalený, kým ho používateľ neotvorí alebo v ňom niečo nie je (D-286).
  const [docOpen, setDocOpen] = useState(false);
  const [fType, setFType] = useState<"all" | TransactionType>("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fCategory, setFCategory] = useState<BudgetCategory | "all" | "none">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [confirmExhausted, setConfirmExhausted] = useState(false);
  useEffect(() => setConfirmExhausted(false), [type, source, amount]);

  useEffect(() => {
    if (!undo) return;
    const h = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(h);
  }, [undo]);

  const needsSource = type === "vydavok" || type === "investicia";
  // Pri úprave sa pôvodná transakcia z výpočtu vyradí (R12).
  const base = useMemo(() => {
    const others = data.transactions.filter((t) => t.id !== editingId);
    const capital = capitalWithFlags(ctx.latest, others).capital;
    return { capital, reserve: reserveBalance(others) };
  }, [data.transactions, editingId, ctx.latest]);

  /** Výsledok náhľadu: nový kapitál, alebo dôvod zamietnutia (D-045, D-052, FR-08). */
  const check = (): { after: Capital | null; message?: string; needsConfirm?: boolean } => {
    const a = asNum(amount);
    const cap = base.capital;
    if (Number.isNaN(a) || !(a > 0)) return { after: cap };
    const ca = cents(a);
    if (type === "vydavok") {
      if (source === "z_hotovosti") {
        const r = payFromCash(cap, ca);
        return r.ok ? { after: r.capital } : { after: null, message: "Hotovosti nestačí na tento výdavok. Zvoľ zdroj „z investícií“." };
      }
      if (source === "z_investicii") {
        const r = payFromInvestments(cap, ca);
        if (r.ok && r.warning === "exhausted") return { after: r.capital, needsConfirm: true, message: INVESTMENTS_EXHAUSTED_TEXT };
        return { after: r.ok ? r.capital : cap };
      }
      return { after: cap }; // z príjmu
    }
    if (type === "investicia") {
      if (source === "z_hotovosti") {
        const r = transferToInvestments(cap, ca);
        return r.ok ? { after: r.capital } : { after: null, message: "Hotovosti nestačí na presun do investícií." };
      }
      return { after: { inv: cap.inv + ca, cash: cap.cash } };
    }
    if (type === "sporenie") return { after: { inv: cap.inv, cash: cap.cash + ca } };
    if (type === "rezerva") {
      if (cap.cash - ca < 0) return { after: null, message: "Hotovosť nestačí na vklad do rezervy." };
      return { after: { inv: cap.inv, cash: cap.cash - ca }, message: `Vklad do rezervy zníži kapitál pre cieľ o ${eur(ca)}; peniaze zostávajú v rezerve.` };
    }
    if (ca > base.reserve) return { after: null, message: "Výber je väčší než stav rezervy." };
    return { after: { inv: cap.inv, cash: cap.cash + ca } }; // výber z rezervy
  };

  const preview = useMemo(() => {
    if (!ctx.latest || ctx.target === null) return null;
    if (Number.isNaN(asNum(amount)) || asNum(amount) <= 0) return { blocked: true as const, message: "Zadaj sumu, aby sa ukázal predbežný dopad." };
    const c = check();
    if (c.after === null) return { blocked: true as const, message: c.message };
    const d = impactWithRentals(base.capital, c.after, ctx.mInv, ctx.mCash, ctx.realReturn, ctx.target, ctx.rentals);
    return { blocked: false as const, impact: d, note: c.message, needsConfirm: !!c.needsConfirm };
  }, [type, source, amount, base, ctx]);

  const parsedItems = useMemo(() => parseReceiptItems(itemsText), [itemsText]);
  const itemsTotal = parsedItems.items.reduce((sum, i) => sum + i.amountCents, 0);
  const itemsMismatch = parsedItems.items.length > 0 && !Number.isNaN(asNum(amount)) && cents(asNum(amount)) !== itemsTotal;
  const storedItems = (editingId ? data.transactions.find((x) => x.id === editingId)?.receiptItems : undefined) ?? [];

  const resetForm = () => {
    setConfirmExhausted(false);
    setEditingId(null);
    setNote("");
    setReceiptId("");
    setQrMsg(null);
    setCameraOn(false);
    setItemsText("");
    setCategory("");
    setAmount("");
    setDate(todayIso());
    setErr(null);
    setDocOpen(false);
    setConfirmDeleteId(null);
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.amountCents / 100);
    setDate(t.date);
    setSource(t.source ?? "z_hotovosti");
    setCategory(t.category ?? "");
    setNote(t.note ?? "");
    setReceiptId(t.receiptId ?? "");
    setQrMsg(null);
    setItemsText("");
    setErr(null);
    setDocOpen(!!t.receiptId || (t.receiptItems?.length ?? 0) > 0);
    setConfirmDeleteId(null);
    // Úprava je vo formulári hore; z histórie dole by ju na telefóne nebolo vidieť (D-286).
    window.scrollTo(0, 0);
  };

  // Fotka QR kódu dokladu: číslo dokladu sa len navrhne, potvrdí ho používateľ (D-126).
  // Overenie na portáli: číslo ide len do schránky, nezobrazuje sa (D-133).
  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(receiptId.trim());
      setCopyMsg("Číslo je v schránke. Vložte ho na portál.");
    } catch {
      setCopyMsg("Schránku sa nepodarilo použiť. Overenie na portáli urobte neskôr.");
    }
  };

  // Text z QR kódu: ak je to číslo dokladu, vyplní pole; inak povie, čo sa prečítalo (bez obsahu).
  const useQrText = (text: string) => {
    const id = receiptIdFromQr(text);
    if (id) {
      setReceiptId(id);
      setQrMsg("QR kód je načítaný.");
    } else {
      setQrMsg(`QR kód sa prečítal, ale nie je to číslo dokladu (${text.trim().length} znakov). Zadajte ho ručne.`);
    }
  };

  const scanReceipt = async (file: File) => {
    setQrMsg("Načítavam QR kód…");
    try {
      const text = await readQrFromImage(file);
      if (text === null) setQrMsg("QR kód sa v obrázku nenašiel. Nafoťte ho bližšie, rovno a v dobrom svetle.");
      else useQrText(text);
    } catch {
      setQrMsg("Skener QR kódu sa nepodarilo spustiť. Zadajte číslo dokladu ručne.");
    }
  };

  const save = async () => {
    if (!ctx.latest) return setErr("Najprv zapíš stav investícií a hotovosti vo Vyhodnotení.");
    const a = asNum(amount);
    if (Number.isNaN(a) || !(a > 0)) return setErr("Suma musí byť kladná.");
    const dateErr = checkDate(date, todayIso(), "dátum");
    if (dateErr.length) return setErr(dateErr[0]);
    const c = check();
    if (c.after === null) return setErr(c.message ?? "Transakciu nie je možné uložiť.");
    if (c.needsConfirm && !confirmExhausted) return setErr("Potvrď, že investície sa vyčerpajú.");
    const existing = editingId ? data.transactions.find((x) => x.id === editingId) : undefined;
    const excess = type === "vydavok" && source === "z_investicii" && c.needsConfirm ? cents(a) - base.capital.inv : 0;
    const noteText = [note, excess > 0 ? `prečerpanie ${eur(excess)} nad K_inv` : ""].filter(Boolean).join("; ");
    const receipt = receiptId.trim();
    if (type === "vydavok" && receipt !== "" && !isReceiptId(receipt)) return setErr("Číslo dokladu má 20 až 40 znakov: písmená, číslice a pomlčky.");
    // Nerozpoznané riadky sa nesmú potichu vynechať (D-129).
    if (type === "vydavok" && parsedItems.unparsed.length > 0) return setErr("Niektoré riadky položiek sa nepodarilo rozpoznať. Opravte text alebo ho vymažte.");
    const receiptItems = type === "vydavok" ? (parsedItems.items.length > 0 ? parsedItems.items : existing?.receiptItems) : undefined;
    const t: Transaction = {
      id: existing?.id ?? uid(),
      date,
      type,
      amountCents: cents(a),
      ...(needsSource ? { source } : {}),
      ...(type === "vydavok" && category !== "" ? { category } : {}),
      ...(noteText ? { note: noteText.slice(0, 200) } : {}),
      ...(type === "vydavok" && receipt !== "" ? { receiptId: receipt } : {}),
      ...(receiptItems && receiptItems.length > 0 ? { receiptItems } : {}),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await repo.addTransaction(t);
    } catch {
      return setErr(STORAGE_ERROR);
    }
    resetForm();
    onChanged();
  };

  const remove = async (id: string) => {
    const gone = data.transactions.find((x) => x.id === id) ?? null;
    let atts: Attachment[] = [];
    try {
      // Prílohy sa odložia, aby ich vrátenie späť obnovilo (D-160).
      atts = await repo.listAttachments(id);
      await repo.deleteTransaction(id);
    } catch {
      return setErr(STORAGE_ERROR);
    }
    if (editingId === id) resetForm();
    setUndo(gone);
    setUndoAtt(atts);
    onChanged();
  };

  const restore = async () => {
    if (!undo) return;
    try {
      await repo.addTransaction(undo);
      for (const a of undoAtt) await repo.saveAttachment(a);
      setUndoAtt([]);
    } catch {
      return setErr(STORAGE_ERROR);
    }
    setUndo(null);
    onChanged();
  };

  const list = filterHistory(data.transactions, { type: fType === "all" ? undefined : fType, from: fFrom || undefined, to: fTo || undefined, category: fCategory === "all" ? undefined : fCategory });
  const totals = totalsByType(list);
  const categoryTotals = expenseTotalsByCategory(list);
  const inEdit = editingId !== null;

  const editingTx = editingId ? data.transactions.find((x) => x.id === editingId) : undefined;
  const docShown = docOpen || cameraOn || qrMsg !== null || receiptId !== "" || itemsText.trim() !== "";
  const docAssigned = receiptId !== "" || storedItems.length > 0;

  // Poradie (D-286, docs/43 A3): suma, typ, zdroj, kategória, dátum, poznámka; doklad zbalený; potom dopad a uloženie.
  return (
    <section>
      {!ctx.latest && <p style={calloutStyle("warn")}>Najprv urob vyhodnotenie, potom môžeš zapisovať transakcie. <NextStep to="vyhodnotenie">Vyhodnotenie</NextStep></p>}
      {inEdit && <h2 style={{ fontSize: "var(--font-heading)" }}>Úprava transakcie</h2>}
      <Field label="Suma (€)" value={amount} onChange={setAmount} />
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "var(--font-small)" }}>Typ</span>
        <select aria-label="Typ transakcie" value={type} onChange={(e) => setType(e.target.value as TransactionType)} style={inp}>
          {(Object.keys(TYPE_LABEL) as TransactionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      </label>
      {needsSource && (
        <label style={{ display: "block", margin: "8px 0" }}>
          <span style={{ display: "block", fontSize: "var(--font-small)" }}>Zdroj</span>
          <select aria-label="Zdroj úhrady" value={source} onChange={(e) => setSource(e.target.value as Source)} style={inp}>
            {SOURCES.map((x) => <option key={x} value={x}>{SOURCE_LABEL[x]}</option>)}
          </select>
        </label>
      )}
      {type === "vydavok" && (
        <>
        <label style={{ display: "block", margin: "8px 0" }}>
          <span style={{ display: "block", fontSize: "var(--font-small)" }}>Kategória (nepovinná)</span>
          <select aria-label="Kategória" value={category} onChange={(e) => setCategory(e.target.value as BudgetCategory | "")} style={inp}>
            <option value="">bez kategórie</option>
            {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        {category !== "" && data.budgets.some((b) => b.category === category) && (
          <p style={hintStyle}>Limit v kategórii {category}: {eur(data.budgets.find((b) => b.category === category)?.limitCents ?? 0)}. <NextStep to="rozpocet">Rozpočet</NextStep></p>
        )}
        </>
      )}
      <Field label="Dátum" value={date} type="date" max={todayIso()} onChange={setDate} />
      <Field label="Poznámka (voliteľná)" value={note} type="text" onChange={setNote} maxLength={200} />
      {type === "vydavok" && (
        <details open={docShown} onToggle={(e) => setDocOpen(e.currentTarget.open)} style={{ margin: "8px 0" }}>
          <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Doklad (voliteľné){docAssigned ? " · priradený" : ""} ▾</summary>
          <div style={{ margin: "8px 0" }}>
            {cameraOn ? (
              <ReceiptCamera
                onFound={(text) => { setCameraOn(false); useQrText(text); }}
                onClose={() => setCameraOn(false)}
              />
            ) : (
              canUseCamera() && <button type="button" onClick={() => setCameraOn(true)} style={btn}>Skenovať QR kód kamerou</button>
            )}
            <label style={{ display: "block", margin: "4px 0" }}>
              <span style={{ display: "block", fontSize: "var(--font-small)" }}>Alebo nafoťte QR kód z dokladu</span>
              <input type="file" accept="image/*" aria-label="Fotka QR kódu dokladu" onChange={(e) => { const f = e.target.files?.[0]; if (f) void scanReceipt(f); }} />
            </label>
            {qrMsg && <p style={hintStyle}>{qrMsg}</p>}
            {/* Číslo dokladu sa nezobrazuje a nedá sa zadať ručne; používa sa len na overenie (D-133). */}
            {receiptId !== "" && (
              <>
                <p style={{ fontSize: "var(--font-small)" }}>
                  Doklad je priradený.{" "}
                  <button type="button" onClick={() => { setReceiptId(""); setQrMsg(null); setCopyMsg(null); }} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Odstrániť doklad</button>
                </p>
                <a
                  href={RECEIPT_CHECK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void copyReceipt()}
                  style={{ ...btn, display: "inline-block", textDecoration: "none", color: "inherit", border: "1px solid var(--border-strong)", borderRadius: 4 }}
                >
                  Overiť doklad na portáli
                </a>
                {copyMsg && <p style={hintStyle}>{copyMsg}</p>}
              </>
            )}
          </div>
          <div style={{ margin: "8px 0" }}>
            <label style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: "var(--font-small)" }}>Položky z dokladu (nepovinné; vložte text skopírovaný z portálu)</span>
              <textarea aria-label="Položky z dokladu" value={itemsText} onChange={(e) => setItemsText(e.target.value)} rows={4} style={{ ...inp, fontFamily: "inherit" }} />
            </label>
            {parsedItems.items.length > 0 && (
              <>
                <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "var(--font-small)" }}>
                  {parsedItems.items.map((i) => (
                    <li key={i.code}>{i.name}: {i.quantity} ks, DPH {i.vatPercent} %, {eur(i.amountCents)}</li>
                  ))}
                </ul>
                <p style={{ fontSize: "var(--font-small)" }}>Súčet položiek: <strong>{eur(itemsTotal)}</strong></p>
              </>
            )}
            {parsedItems.unparsed.length > 0 && (
              <p style={{ color: "var(--danger)", fontSize: "var(--font-small)" }}>Nerozpoznané riadky: {parsedItems.unparsed.length}. Opravte text alebo ho vymažte; bez toho sa výdavok neuloží.</p>
            )}
            {itemsMismatch && (
              <p style={{ color: "var(--danger)", fontSize: "var(--font-small)" }}>Súčet položiek sa nezhoduje so sumou výdavku {eur(cents(asNum(amount)))} (napr. zľava). Uložiť sa dá, ak je to v poriadku.</p>
            )}
            {itemsText.trim() === "" && storedItems.length > 0 && (
              <p style={hintStyle}>Uložené položky: {storedItems.length}. Vložením nového textu sa nahradia.</p>
            )}
          </div>
        </details>
      )}
      {preview && (
        <p>
          {preview.blocked
            ? preview.message
            : <>Predbežný dopad: <strong>{formatImpactOutcome(preview.impact)}</strong></>}
        </p>
      )}
      {preview && !preview.blocked && preview.note && (
        <p style={calloutStyle("warn")}>{preview.note}</p>
      )}
      {preview && !preview.blocked && preview.needsConfirm && (
        <label style={{ display: "block", margin: "8px 0" }}>
          <input type="checkbox" checked={confirmExhausted} onChange={(e) => setConfirmExhausted(e.target.checked)} /> Rozumiem, investície sa vyčerpajú a K_inv bude 0 €.
        </label>
      )}
      {inEdit && date <= (ctx.latest?.date ?? "") && (
        <p style={{ color: "var(--muted)" }}>Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.</p>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>{inEdit ? "Uložiť zmeny" : "Uložiť transakciu"}</button>
      {inEdit && <button onClick={resetForm} style={{ ...btn, marginLeft: 8 }}>Zrušiť úpravu</button>}
      {undo && (
        <p style={{ background: "var(--banner)", padding: 8, borderRadius: 6 }}>
          Transakcia bola zmazaná. <button onClick={restore} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Vrátiť späť</button>
        </p>
      )}
      {/* Prílohy a zmazanie sú v úprave, nie pri každom zázname histórie (D-286). Zmazanie len s potvrdením (D-199). */}
      {editingTx && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border-soft)", paddingTop: 8 }}>
          {editingTx.type === "vydavok" && (
            <>
              <h3 style={{ fontSize: "var(--font-text)" }}>Prílohy</h3>
              {renderAttachments(editingTx.id)}
            </>
          )}
          {confirmDeleteId === editingTx.id ? (
            <p>
              Naozaj zmazať?{" "}
              <button onClick={() => { setConfirmDeleteId(null); void remove(editingTx.id); }} style={{ ...btnDanger, padding: "2px 8px", marginTop: 0 }}>Zmazať</button>{" "}
              <button onClick={() => setConfirmDeleteId(null)} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Zrušiť</button>
            </p>
          ) : (
            <button onClick={() => setConfirmDeleteId(editingTx.id)} style={btnDanger}>Zmazať transakciu</button>
          )}
        </div>
      )}

      <h3 style={{ fontSize: "var(--font-text)", marginTop: 24 }}>História</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select aria-label="Filter typu" value={fType} onChange={(e) => setFType(e.target.value as "all" | TransactionType)} style={{ ...inp, width: "auto" }}>
          <option value="all">všetky typy</option>
          {(Object.keys(TYPE_LABEL) as TransactionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <select aria-label="Filter kategórie" value={fCategory} onChange={(e) => setFCategory(e.target.value as BudgetCategory | "all" | "none")} style={{ ...inp, width: "auto" }}>
          <option value="all">všetky kategórie</option>
          <option value="none">nezaradené</option>
          {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input aria-label="Od dátumu" type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={{ ...inp, width: "auto" }} />
        <input aria-label="Do dátumu" type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} style={{ ...inp, width: "auto" }} />
      </div>
      <p style={hintStyle}>
        Súčet zobrazených transakcií: {(Object.keys(totals) as TransactionType[]).length === 0
          ? "žiadne transakcie"
          : (Object.keys(totals) as TransactionType[]).map((t) => `${TYPE_LABEL[t]} ${eur(totals[t] ?? 0)}`).join(" · ")}
      </p>
      {Object.keys(categoryTotals).length > 0 && (
        <p style={hintStyle}>
          Výdavky podľa kategórie: {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([c, v]) => `${c} ${eur(v)}`).join(" · ")}
        </p>
      )}
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {list.length === 0 && <li style={{ color: "var(--muted)" }}>Zatiaľ žiadne.</li>}
        {list.map((t) => (
          <li key={t.id} style={{ borderBottom: "1px solid var(--border-soft)", padding: "6px 0", display: "flex", flexDirection: "column", gap: 6 }}>
            <span>
              {dateSk(t.date)} · {TYPE_LABEL[t.type]} · {eur(t.amountCents)}
              {t.source ? ` (${SOURCE_LABEL[t.source]})` : ""}
              {t.type === "vydavok" && t.amountCents >= (ctx.settings?.thresholdCents ?? recommendedSettings(0).thresholdCents) ? " · nad prahom" : ""}
              {t.note ? ` · ${t.note}` : ""}
              {t.receiptId ? " · doklad" : ""}
              {t.receiptItems && t.receiptItems.length > 0 ? ` · položiek: ${t.receiptItems.length}` : ""}
            </span>
            <span>
              <button onClick={() => startEdit(t)} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Upraviť</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
