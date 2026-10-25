import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Repository } from "../../storage/repository";
import type { AppData, Attachment, BudgetCategory, ReceiptItem, RecurringExpense, Transaction, TransactionType, Source } from "../../storage/types";
import { matchingRecurring } from "../../domain/recurring";
import { BUDGET_CATEGORIES, SOURCES } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import { expenseTotalsByCategory, filterHistory, totalsByType } from "../../domain/history";
import { reserveBalance, capitalWithFlags } from "../../domain/ledger";
import type { Ctx } from "../../domain/context";
import { INVESTMENTS_EXHAUSTED_TEXT, payFromCash, payFromInvestments, transferToInvestments, type Capital } from "../../domain/capital";
import { impactWithRentals } from "../../domain/rentalGoal";
import { formatImpactOutcome } from "../../domain/impact";
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

export function TransactionSection({ repo, data, ctx, onChanged, renderAttachments, renderStockTransfer, stockModuleOff }: { repo: Repository; data: AppData; ctx: Ctx; onChanged: () => void; renderAttachments: (transactionId: string) => ReactNode; renderStockTransfer?: (t: Transaction) => ReactNode; stockModuleOff?: boolean }) {
  const [type, setType] = useState<TransactionType>("vydavok");
  const [amount, setAmount] = useState<NumIn>("");
  const [date, setDate] = useState(todayIso());
  // Predvolený zdroj výdavku je „z príjmu“ (D-014, D-288).
  const [source, setSource] = useState<Source>("z_prijmu");
  const [category, setCategory] = useState<BudgetCategory | "">("");
  const [note, setNote] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [qrMsg, setQrMsg] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
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
  // História: najprv 10 posledných záznamov, ďalšie po 10 (D-293, docs/46); filter zbalený, kým nie je zapnutý.
  const [shown, setShown] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => setShown(10), [fType, fFrom, fTo, fCategory]);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [confirmExhausted, setConfirmExhausted] = useState(false);
  const exhaustedRef = useRef<HTMLInputElement>(null);
  useEffect(() => setConfirmExhausted(false), [type, source, amount]);
  // Upozornenie na dvojitý zápis pravidelného výdavku; „Uložiť aj tak“ ho pre tento formulár potvrdí (D-299, docs/53).
  const [recurringMatch, setRecurringMatch] = useState<RecurringExpense | null>(null);
  const [recurringConfirmed, setRecurringConfirmed] = useState(false);
  useEffect(() => { setRecurringMatch(null); setRecurringConfirmed(false); }, [type, amount, category, date]);

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

  // Návrhy položiek z predchádzajúcich nákupov a zo skladu: názov a posledná cena za kus (docs/58, D).
  const itemSuggestions = useMemo(() => {
    const byName = new Map<string, { name: string; unitPriceCents: number }>();
    for (const s of data.stockItems) if (s.unitPriceCents !== undefined && s.unitPriceCents > 0) byName.set(s.name.trim().toLowerCase(), { name: s.name.trim(), unitPriceCents: s.unitPriceCents });
    const withItems = data.transactions.filter((t) => t.receiptItems && t.receiptItems.length > 0).sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
    for (const t of withItems) for (const i of t.receiptItems ?? []) if (i.unitPriceCents > 0) byName.set(i.name.trim().toLowerCase(), { name: i.name.trim(), unitPriceCents: i.unitPriceCents });
    return byName;
  }, [data.stockItems, data.transactions]);
  // Najnovšie hore, najviac 50 (revízia 2026-10-25d, N-1): Map drží poradie vloženia, posledné vložené sú najnovšie.
  const suggestionList = useMemo(() => [...itemSuggestions.values()].reverse().slice(0, 50), [itemSuggestions]);
  // Cena sa doplní až po dopísaní názvu (opustenie poľa alebo výber návrhu), nie pri každom znaku (N-1).
  const fillPrice = (v: string) => {
    const hit = itemSuggestions.get(v.trim().toLowerCase());
    if (hit && mPrice === "") setMPrice(hit.unitPriceCents / 100);
  };
  // Výdavok sa zapisuje buď rýchlo (jedna suma), alebo po položkách; suma sa vtedy vypočíta z položiek
  // a nezadáva sa druhýkrát (D-313, docs/57). Zľava je záporná položka.
  const [mode, setMode] = useState<"rychly" | "polozky">("rychly");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [mName, setMName] = useState("");
  const [mQty, setMQty] = useState<NumIn>(1);
  const [mPrice, setMPrice] = useState<NumIn>("");
  const [origCents, setOrigCents] = useState<number | null>(null);
  // Potvrdenie po uložení (D-313); pri nákupe po položkách aj ponuka Pridať do skladu.
  const [saved, setSaved] = useState<Transaction | null>(null);
  // Prepnutie na Rýchly výdavok zahodí položky; najprv otázka (revízia 2026-10-25d, S-2, zakladateľ: a).
  const [confirmQuick, setConfirmQuick] = useState(false);
  const byItems = type === "vydavok" && mode === "polozky";
  const changeQty = (n: number, delta: number) => setItems((all) => all.map((i, k) => {
    if (k !== n) return i;
    const quantity = Math.round((i.quantity + delta) * 1000) / 1000;
    const amountCents = Math.round(i.unitPriceCents * quantity);
    return quantity > 0 && amountCents !== 0 ? { ...i, quantity, amountCents } : i;
  }));
  const itemsTotal = items.reduce((sum, i) => sum + i.amountCents, 0);
  useEffect(() => { if (byItems && items.length > 0) setAmount(itemsTotal / 100); }, [byItems, itemsTotal, items.length]);
  // Rozpísaná položka z polí Položka, Množstvo, Cena za kus: null, keď sú prázdne, inak položka alebo chyba.
  const draftItem = (): ReceiptItem | string | null => {
    if (mName.trim() === "" && mPrice === "") return null;
    const q = asNum(mQty);
    const p = asNum(mPrice);
    if (mName.trim() === "" || Number.isNaN(q) || q <= 0 || Number.isNaN(p) || p === 0) return "Položka potrebuje názov, množstvo a cenu za kus (zľavu zadaj zápornou cenou).";
    const unitPriceCents = cents(p);
    const amountCents = Math.round(unitPriceCents * q);
    // Suma riadku 0,00 € by zálohu urobila neobnoviteľnou (revízia 2026-10-25d, S-1).
    if (amountCents === 0) return "Suma riadku vychádza 0,00 €; skontroluj množstvo a cenu.";
    return { code: "ručne", name: mName.trim().slice(0, 200), quantity: q, vatPercent: 0, unitPriceCents, amountCents };
  };
  const addItem = () => {
    const d = draftItem();
    if (d === null) return setErr("Položka potrebuje názov, množstvo a cenu za kus (zľavu zadaj zápornou cenou).");
    if (typeof d === "string") return setErr(d);
    setItems([...items, d]);
    setMName(""); setMQty(1); setMPrice(""); setErr(null);
  };
  const resetForm = () => {
    setConfirmExhausted(false);
    // Po uložení aj zrušení úpravy späť na predvolené: výdavok z príjmu (D-014, D-288; revízia 2026-10-25b, S-1).
    setType("vydavok");
    setSource("z_prijmu");
    setRecurringMatch(null);
    setRecurringConfirmed(false);
    setEditingId(null);
    setNote("");
    setReceiptId("");
    setQrMsg(null);
    setCameraOn(false);
    setItems([]);
    setMode("rychly");
    setConfirmQuick(false);
    setOrigCents(null);
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
    setSource(t.source ?? "z_prijmu");
    setCategory(t.category ?? "");
    setNote(t.note ?? "");
    setReceiptId(t.receiptId ?? "");
    setQrMsg(null);
    setItems(t.receiptItems ?? []);
    setMode((t.receiptItems?.length ?? 0) > 0 ? "polozky" : "rychly");
    setOrigCents(t.amountCents);
    setSaved(null);
    setErr(null);
    setDocOpen(!!t.receiptId);
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

  const save = async (confirmedRecurring = recurringConfirmed) => {
    setSaved(null);
    if (!ctx.latest) return setErr("Najprv zapíš stav investícií a hotovosti vo Vyhodnotení.");
    // Vyplnená, ale nepridaná položka sa pridá sama, aby sa výdavok neuložil nižší (revízia 2026-10-25d, S-3).
    const draft = byItems ? draftItem() : null;
    if (typeof draft === "string") return setErr(draft);
    const allItems = draft ? [...items, draft] : items;
    if (draft) { setItems(allItems); setMName(""); setMQty(1); setMPrice(""); }
    const a = byItems ? allItems.reduce((sum, i) => sum + i.amountCents, 0) / 100 : asNum(amount);
    if (byItems && allItems.length === 0) return setErr("Pridaj aspoň jednu položku.");
    if (Number.isNaN(a) || !(a > 0)) return setErr(byItems ? "Súčet položiek musí byť kladný." : "Suma musí byť kladná.");
    const dateErr = checkDate(date, todayIso(), "dátum");
    if (dateErr.length) return setErr(dateErr[0]);
    const c = check();
    if (c.after === null) return setErr(c.message ?? "Transakciu nie je možné uložiť.");
    if (c.needsConfirm && !confirmExhausted) {
      // Políčko je nad prilepeným pruhom; zameranie ho posunie do zobrazenia (revízia 2026-10-25b, N-1).
      exhaustedRef.current?.focus();
      return setErr("Potvrď, že investície sa vyčerpajú.");
    }
    const existing = editingId ? data.transactions.find((x) => x.id === editingId) : undefined;
    const excess = type === "vydavok" && source === "z_investicii" && c.needsConfirm ? cents(a) - base.capital.inv : 0;
    const noteText = [note, excess > 0 ? `prečerpanie ${eur(excess)} nad K_inv` : ""].filter(Boolean).join("; ");
    const receipt = receiptId.trim();
    if (type === "vydavok" && receipt !== "" && !isReceiptId(receipt)) return setErr("Číslo dokladu má 20 až 40 znakov: písmená, číslice a pomlčky.");
    const receiptItems = byItems ? allItems : undefined;
    // Len pri novom výdavku; pri úprave existujúceho by upozornenie len zdržiavalo.
    if (type === "vydavok" && !existing && !confirmedRecurring) {
      const match = matchingRecurring(data.recurringExpenses, { date, category: category === "" ? undefined : category, amountCents: cents(a) });
      if (match) { setErr(null); return setRecurringMatch(match); }
    }
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
    setSaved(t);
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
  const filterActive = fType !== "all" || fCategory !== "all" || fFrom !== "" || fTo !== "";

  const editingTx = editingId ? data.transactions.find((x) => x.id === editingId) : undefined;
  // Doklad sa sám rozbalí, keď v ňom niečo pribudne; stav otvorenia má jeden zdroj, aby sa dal aj zbaliť (revízia 2026-10-25b, S-2).
  const docHasContent = cameraOn || qrMsg !== null || receiptId !== "";
  useEffect(() => { if (docHasContent) setDocOpen(true); }, [docHasContent]);

  // Poradie (D-286, docs/43 A3): suma, typ, zdroj, kategória, dátum, poznámka; doklad zbalený; potom upozornenia a prilepený pruh s dopadom a uložením (D-287).
  return (
    <section>
      {!ctx.latest && <p style={calloutStyle("warn")}>Najprv urob vyhodnotenie, potom môžeš zapisovať transakcie. <NextStep to="vyhodnotenie">Vyhodnotenie</NextStep></p>}
      {inEdit && <h2 style={{ fontSize: "var(--font-heading)" }}>Úprava transakcie</h2>}
      {type === "vydavok" && (
        <div role="group" aria-label="Spôsob zápisu" style={{ display: "flex", gap: 8, margin: "4px 0 8px" }}>
          <button type="button" aria-pressed={mode === "rychly"} onClick={() => (mode === "polozky" && items.length > 0 ? setConfirmQuick(true) : setMode("rychly"))} style={mode === "rychly" ? btnPrimary : btn}>Rýchly výdavok</button>
          <button type="button" aria-pressed={mode === "polozky"} onClick={() => setMode("polozky")} style={mode === "polozky" ? btnPrimary : btn}>Nákup po položkách</button>
          {confirmQuick && (
            <div role="alert" style={{ ...calloutStyle("warn"), margin: "8px 0 0" }}>
              <p style={{ margin: 0 }}>Položky ({items.length}) sa zahodia; suma ostane {eur(itemsTotal)}. Pokračovať?</p>
              <button type="button" onClick={() => { setItems([]); setMode("rychly"); setConfirmQuick(false); }} style={btn}>Zahodiť položky</button>{" "}
              <button type="button" onClick={() => setConfirmQuick(false)} style={btn}>Nechať položky</button>
            </div>
          )}
        </div>
      )}
      {!byItems && <Field label="Suma (€)" value={amount} onChange={setAmount} />}
      {byItems && (
        <div style={{ margin: "8px 0" }}>
          {items.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "4px 0" }}>
              {items.map((i, n) => (
                <li key={`${i.code}-${n}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "2px 0" }}>
                  <span>{i.name} · {String(i.quantity).replace(".", ",")} × {eur(i.unitPriceCents)} = <strong>{eur(i.amountCents)}</strong></span>
                  {/* Množstvo sa mení o 1 bez prepisovania položky (prehliadka 2026-10-25, bod 4). */}
                  <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button type="button" aria-label={`Menej: ${i.name}`} disabled={i.quantity <= 1} onClick={() => changeQty(n, -1)} style={{ ...btn, padding: "2px 12px", marginTop: 0 }}>−</button>
                  <button type="button" aria-label={`Viac: ${i.name}`} onClick={() => changeQty(n, 1)} style={{ ...btn, padding: "2px 12px", marginTop: 0 }}>+</button>
                  <button type="button" aria-label={`Odstrániť položku ${i.name}`} onClick={() => setItems(items.filter((_, k) => k !== n))} style={{ ...btn, padding: "2px 8px", marginTop: 0 }}>Odstrániť</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
            <label style={{ flex: "2 1 140px" }}><span style={{ display: "block", fontSize: "var(--font-small)" }}>Položka</span><input type="text" maxLength={200} value={mName} list="navrhy-poloziek" onChange={(e) => { setMName(e.target.value); if (!(e.nativeEvent instanceof InputEvent) || e.nativeEvent.inputType === "insertReplacementText") fillPrice(e.target.value); }} onBlur={(e) => fillPrice(e.target.value)} style={inp} /></label>
            <datalist id="navrhy-poloziek">{suggestionList.map((v) => <option key={v.name} value={v.name} label={eur(v.unitPriceCents)} />)}</datalist>
            <label style={{ flex: "1 1 70px" }}><span style={{ display: "block", fontSize: "var(--font-small)" }}>Množstvo</span><input type="number" step={0.001} value={mQty} onChange={(e) => setMQty(e.target.value === "" ? "" : Number(e.target.value))} style={inp} /></label>
            <label style={{ flex: "1 1 90px" }}><span style={{ display: "block", fontSize: "var(--font-small)" }}>Cena za kus (€)</span><input type="number" step={0.01} value={mPrice} onChange={(e) => setMPrice(e.target.value === "" ? "" : Number(e.target.value))} style={inp} /></label>
            <button type="button" onClick={addItem} style={btn}>Pridať položku</button>
          </div>
          <p style={hintStyle}>Zľavu zadaj ako položku „zľava“ so zápornou cenou.</p>
          {origCents !== null && items.length > 0 && origCents !== itemsTotal && (
            <div style={calloutStyle("warn")}>
              <p style={{ margin: 0 }}>Pôvodná suma bola {eur(origCents)}; po uložení bude súčet položiek {eur(itemsTotal)}.</p>
              {/* Pôvodnú sumu zachová položka „rozdiel“ (revízia 2026-10-25d, N-2, zakladateľ: a). */}
              <button type="button" onClick={() => setItems([...items, { code: "ručne", name: "rozdiel", quantity: 1, vatPercent: 0, unitPriceCents: origCents - itemsTotal, amountCents: origCents - itemsTotal }])} style={btn}>Zachovať pôvodnú sumu</button>
            </div>
          )}
        </div>
      )}
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
      {(byItems || (type === "vydavok" && receiptId !== "")) && (
        <details open={docOpen} onToggle={(e) => setDocOpen(e.currentTarget.open)} style={{ margin: "8px 0" }}>
          <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Overiť doklad (QR){receiptId !== "" ? " · priradený" : ""} ▾</summary>
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
        </details>
      )}
      {preview && !preview.blocked && preview.note && (
        <p style={calloutStyle("warn")}>{preview.note}</p>
      )}
      {preview && !preview.blocked && preview.needsConfirm && (
        <label style={{ display: "block", margin: "8px 0" }}>
          <input ref={exhaustedRef} type="checkbox" checked={confirmExhausted} onChange={(e) => setConfirmExhausted(e.target.checked)} /> Rozumiem, investície sa vyčerpajú a K_inv bude 0 €.
        </label>
      )}
      {inEdit && date <= (ctx.latest?.date ?? "") && (
        <p style={{ color: "var(--muted)" }}>Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.</p>
      )}
      {/* Predbežný dopad a uloženie sú prilepené na spodku obrazovky, kým je formulár dlhší než obrazovka (D-287). */}
      <div style={{ position: "sticky", bottom: 0, zIndex: 1, background: "var(--page)", borderTop: "1px solid var(--border-soft)", padding: "4px 0 8px" }}>
        {preview && (
          <p style={{ margin: "4px 0" }}>
            {preview.blocked
              ? preview.message
              : <>Predbežný dopad: <strong>{formatImpactOutcome(preview.impact)}</strong></>}
          </p>
        )}
        {byItems && <p style={{ margin: "4px 0", fontSize: "var(--font-heading)" }}>Spolu: <strong>{eur(itemsTotal)}</strong></p>}
        {err && <p style={{ color: "var(--danger)", margin: "4px 0" }}>{err}</p>}
        {saved && !inEdit && (
          <div style={{ ...calloutStyle("ok"), margin: "4px 0" }}>
            <p style={{ margin: 0 }}>Zapísané: {TYPE_LABEL[saved.type]} {eur(saved.amountCents)}. <button type="button" onClick={() => { setSaved(null); document.getElementById("historia-transakcii")?.scrollIntoView({ block: "start" }); }} style={{ ...btn, marginTop: 0, padding: "2px 8px" }}>Zobraziť v histórii</button></p>
            {renderStockTransfer && (saved.receiptItems?.length ?? 0) > 0 && renderStockTransfer(saved)}
            {/* Bez modulu Sklad sa tlačidlo neukáže (D-162); veta povie prečo (prehliadka 2026-10-25, bod 2.5). */}
            {stockModuleOff && (saved.receiptItems?.length ?? 0) > 0 && (
              <p style={{ ...hintStyle, margin: "4px 0 0" }}>Položky sa dajú pridať do skladu, keď zapneš modul Sklad. <NextStep to="nastavenia">Nastavenia → Moduly</NextStep></p>
            )}
          </div>
        )}
        {recurringMatch && (
          <div style={{ ...calloutStyle("warn"), margin: "4px 0" }}>
            <p style={{ margin: 0 }}>Toto vyzerá ako pravidelný výdavok „{recurringMatch.name}“, ktorý sa už ráta automaticky každý mesiac. Uložiť aj tak?</p>
            <button onClick={() => { setRecurringConfirmed(true); void save(true); }} style={btn}>Uložiť aj tak</button>{" "}
            <button onClick={resetForm} style={btn}>Neukladať</button>
          </div>
        )}
        <button onClick={() => void save()} style={btnPrimary}>{inEdit ? "Uložiť zmeny" : "Uložiť transakciu"}</button>
        {inEdit && <button onClick={resetForm} style={{ ...btn, marginLeft: 8 }}>Zrušiť úpravu</button>}
      </div>
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
              {/* Položky dokladu do skladu; len keď je Sklad zapnutý (D-301). */}
              {renderStockTransfer && (editingTx.receiptItems?.length ?? 0) > 0 && renderStockTransfer(editingTx)}
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

      <h3 id="historia-transakcii" style={{ fontSize: "var(--font-text)", marginTop: 24 }}>História</h3>
      <details open={filterOpen} onToggle={(e) => setFilterOpen(e.currentTarget.open)} style={{ margin: "8px 0" }}>
        <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Filter{filterActive ? " · zapnutý" : ""} ▾</summary>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
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
      {filterActive && (
        <button type="button" onClick={() => { setFType("all"); setFCategory("all"); setFFrom(""); setFTo(""); }} style={{ ...btn, marginTop: 8 }}>Zrušiť filter</button>
      )}
      </details>
      <p style={hintStyle}>
        {filterActive ? "Súčet transakcií vo filtri" : "Súčet všetkých transakcií"}{list.length > 0 ? ` (${list.length})` : ""}: {(Object.keys(totals) as TransactionType[]).length === 0
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
        {list.slice(0, shown).map((t) => (
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
      {list.length > shown && (
        <button type="button" onClick={() => setShown(shown + 10)} style={btn}>Zobraziť staršie</button>
      )}
    </section>
  );
}
