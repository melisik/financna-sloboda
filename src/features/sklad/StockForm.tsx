import { useEffect, useRef, useState } from "react";
import { STOCK_UNITS, type StockItem, type StockUnit, type ShoppingItem } from "../../storage/types";
import { mergedUnitPriceCents } from "../../domain/waste";
import { checkDate } from "../../storage/validate";
import type { Repository } from "../../storage/repository";
import { DEFAULT_WARN_DAYS, WARN_DAY_OPTIONS, findItemByBarcode, isValidBarcode, previousProducts } from "../../domain/stock";
import { readBarcode, SCANNER_OFFLINE_TEXT, ScannerLoadError } from "./barcode";
import { CameraScanner } from "./CameraScanner";
import { findExpiryDate, findProductName } from "../../domain/scan";
import { cents } from "../../ui/kit/format";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { uid } from "../../ui/kit/ids";
import { Field, asNum, btn, type NumIn, btnPrimary } from "../../ui/kit/controls";
import { hintStyle } from "../../ui/kit/controls";


export function StockForm({ repo, items, initial, focusExpiry = false, prefill, onDone, onCancel }: { repo: Repository; items: StockItem[]; initial: StockItem | null; focusExpiry?: boolean; prefill?: ShoppingItem; onDone: (before?: StockItem, after?: StockItem) => void | Promise<void>; onCancel: () => void }) {
  // Z kúpenej položky zoznamu: názov, jednotka a čiarový kód z pôvodnej položky skladu (D-302).
  const linked = prefill?.stockItemId ? items.find((i) => i.id === prefill.stockItemId) : undefined;
  // Minimálna zásoba (D-302): pod ňou appka ponúkne položku na nákupný zoznam.
  const [minQty, setMinQty] = useState<NumIn>(initial?.minQuantity ?? linked?.minQuantity ?? "");
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusExpiry) formRef.current?.querySelector<HTMLInputElement>('input[type="date"]')?.focus();
  }, [focusExpiry]);
  // Cena za jednotku je nepovinná (D-301); z nej sa počíta hodnota vyhodeného.
  const [price, setPrice] = useState<NumIn>(initial?.unitPriceCents !== undefined ? initial.unitPriceCents / 100 : "");
  const [name, setName] = useState(initial?.name ?? prefill?.name ?? "");
  const [quantity, setQuantity] = useState<NumIn>(initial?.quantity ?? prefill?.quantity ?? "");
  const [unit, setUnit] = useState<StockUnit>(initial?.unit ?? prefill?.unit ?? linked?.unit ?? "ks");
  const [barcode, setBarcode] = useState(initial?.barcode ?? linked?.barcode ?? "");
  // Lehota upozornenia si vyberie používateľ; null = bez upozornenia (D-239).
  const [warnDays, setWarnDays] = useState<number | null>(initial?.warnDays === undefined ? DEFAULT_WARN_DAYS : initial.warnDays);
  // Dátum spotreby sa nepredvypĺňa: prázdne pole znamená položku bez dátumu (skener ho môže doplniť).
  const [expiry, setExpiry] = useState(initial?.expiryDate ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [nameSuggestion, setNameSuggestion] = useState<string | null>(null);
  // Výber z výrobkov, ktoré už boli v sklade: doplní názov, jednotku a čiarový kód; množstvo a dátum sa zadajú ručne (D-238).
  const previous = previousProducts(items);
  const pickPrevious = (id: string) => {
    const p = previous.find((x) => x.id === id);
    if (!p) return;
    setName(p.name);
    setUnit(p.unit);
    setBarcode(p.barcode ?? "");
    setWarnDays(p.warnDays === undefined ? DEFAULT_WARN_DAYS : p.warnDays);
    if (p.unitPriceCents !== undefined) setPrice(p.unitPriceCents / 100);
  };

  // Čiarový kód (z kamery alebo fotky) určí výrobok: názov a jednotku doplní uložená položka (D-232, D-233).
  const applyBarcode = (code: string): string => {
    setBarcode(code);
    const known = findItemByBarcode(items, code);
    if (known) {
      if (name.trim() === "") setName(known.name);
      setUnit(known.unit);
      return `Čiarový kód ${code} je v sklade ako „${known.name}“; názov a jednotka sú doplnené.`;
    }
    return `Čiarový kód ${code} zatiaľ nepoznáme. Zadaj názov; pri uložení si ho appka zapamätá.`;
  };

  // Záložný skener: fotka obalu. Čiarový kód z fotky sa použije rovnako; dátum sa len navrhne z textu.
  const onPhoto = async (file: File) => {
    setScanMsg("Rozpoznávam fotku…");
    let code: string | undefined;
    let loadFailed = false;
    try {
      code = await readBarcode(file);
    } catch (e) {
      if (!(e instanceof ScannerLoadError)) throw e;
      loadFailed = true;
    }
    const barcodeMsg = loadFailed ? SCANNER_OFFLINE_TEXT : code === undefined ? "Čiarový kód sa z fotky nenašiel." : applyBarcode(code);
    const known = code !== undefined ? findItemByBarcode(items, code) : undefined;
    try {
      const { recognizeImage } = await import("./ocr");
      const text = await recognizeImage(file);
      setOcrText(text);
      const date = findExpiryDate(text);
      const product = findProductName(text);
      // Názov z textu fotky sa len navrhne, nezapíše sa sám (D-130): OCR pri fotke bez textu vráti šum.
      setNameSuggestion(product && !known ? product : null);
      if (date) setExpiry(date);
      const ocrMsg = date || product
        ? `Navrhnuté: ${product ?? "názov nenájdený"}, dátum spotreby ${date ?? "nenájdený"}. Skontrolujte údaje a množstvo doplňte ručne.`
        : "Text sa nepodarilo rozpoznať. Zadajte údaje ručne.";
      setScanMsg(`${barcodeMsg} ${ocrMsg}`);
    } catch {
      setScanMsg(`${barcodeMsg} Skener sa nepodarilo spustiť. Zadajte údaje ručne.`);
    }
  };
  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const q = asNum(quantity);
    if (Number.isNaN(q) || q < 0) return setErr("Vyplň množstvo (0 alebo viac).");
    if (expiry.trim() !== "") {
      const dErr = checkDate(expiry.trim(), "9999-12-31", "dátum spotreby");
      if (dErr.length) return setErr(dErr[0]);
    }
    const p = price === "" ? undefined : asNum(price);
    if (p !== undefined && (Number.isNaN(p) || p < 0)) return setErr("Cena za jednotku musí byť 0 alebo viac, alebo prázdna.");
    const priceCents = p === undefined ? undefined : cents(p);
    const m = minQty === "" ? undefined : asNum(minQty);
    if (m !== undefined && (Number.isNaN(m) || m < 0)) return setErr("Minimálna zásoba musí byť 0 alebo viac, alebo prázdna.");
    const code = barcode.trim();
    if (code !== "" && !isValidBarcode(code)) return setErr("Čiarový kód musí byť platný EAN-13, EAN-8 alebo UPC-A (len číslice).");
    const now = new Date().toISOString();
    // Rovnaký výrobok (čiarový kód) s rovnakým dátumom spotreby sa pripočíta k jednej položke, nepridá sa druhá (D-234).
    const sameProduct = !initial && code !== "" ? items.find((i) => i.barcode === code && (i.expiryDate ?? "") === expiry.trim()) : undefined;
    if (sameProduct) {
      if (sameProduct.unit !== unit) return setErr(`Výrobok je v sklade v jednotke ${sameProduct.unit}. Zvoľ rovnakú jednotku.`);
      try {
        const merged = mergedUnitPriceCents(sameProduct, q, priceCents);
        const after = { ...sameProduct, quantity: sameProduct.quantity + q, ...(merged !== undefined ? { unitPriceCents: merged } : {}), updatedAt: now };
        await repo.saveStockItem(after);
        await onDone(sameProduct, after);
      } catch {
        setErr(STORAGE_ERROR);
      }
      return;
    }
    const item: StockItem = {
      id: initial?.id ?? uid(),
      name: trimmed,
      quantity: q,
      unit,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(expiry.trim() !== "" ? { expiryDate: expiry.trim() } : {}),
      ...(code !== "" ? { barcode: code } : {}),
      warnDays,
      ...(priceCents !== undefined ? { unitPriceCents: priceCents } : {}),
      ...(initial?.sourceTransactionId ? { sourceTransactionId: initial.sourceTransactionId } : {}),
      ...(m !== undefined ? { minQuantity: m } : {}),
    };
    try {
      await repo.saveStockItem(item);
      await onDone(initial ?? undefined, item);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div ref={formRef} style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "var(--font-text)", marginTop: 0 }}>{initial ? "Upraviť položku skladu" : "Nová položka skladu"}</h4>
      {focusExpiry && <p style={hintStyle}>Uprav dátum spotreby a ulož.</p>}
      {camera ? (
        <CameraScanner
          onFound={(code) => { setCamera(false); setScanMsg(applyBarcode(code)); }}
          onCancel={() => setCamera(false)}
        />
      ) : (
        <button onClick={() => setCamera(true)} style={{ ...btn, margin: "8px 0" }}>Skenovať kódom kamerou</button>
      )}
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "var(--font-small)" }}>Fotka obalu (záložne, ak kamera nejde)</span>
        <input type="file" accept="image/*" aria-label="Fotka obalu" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPhoto(f); }} />
      </label>
      {scanMsg && <p style={hintStyle}>{scanMsg}</p>}
      {ocrText !== null && (
        <details style={{ fontSize: "var(--font-small)", marginBottom: 8 }}>
          <summary>Rozpoznaný text z fotky</summary>
          <pre style={{ whiteSpace: "pre-wrap", background: "var(--surface-2)", padding: 8, borderRadius: 4 }}>{ocrText.trim() || "(žiadny text)"}</pre>
        </details>
      )}
      {!initial && previous.length > 0 && (
        <label style={{ display: "block", marginBottom: 8 }}>
          <span style={{ display: "block", fontSize: "var(--font-small)" }}>Vybrať z predchádzajúcich výrobkov</span>
          <select aria-label="Predchádzajúce výrobky" value="" onChange={(e) => pickPrevious(e.target.value)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
            <option value="">— vyber výrobok —</option>
            {previous.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}
      <Field label="Názov (napr. mlieko)" value={name} type="text" onChange={setName} maxLength={80} />
      {nameSuggestion !== null && name.trim() === "" && (
        <p style={{ fontSize: "var(--font-small)", margin: "4px 0" }}>
          Navrhnutý názov z fotky: <strong>{nameSuggestion}</strong>{" "}
          <button onClick={() => { setName(nameSuggestion); setNameSuggestion(null); }} style={btn}>Použiť názov</button>
        </p>
      )}
      <Field label="Čiarový kód (nepovinné)" value={barcode} type="text" onChange={setBarcode} />
      <Field label="Množstvo" value={quantity} step={0.01} onChange={setQuantity} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Jednotka
        <select aria-label="Jednotka" value={unit} onChange={(e) => setUnit(e.target.value as StockUnit)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {STOCK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
      <Field label="Minimálna zásoba (nepovinné)" value={minQty} step={0.01} onChange={setMinQty} hint="pod ňou appka ponúkne položku na nákupný zoznam; bez nej, keď dôjde" />
      <Field label="Cena za jednotku (€, nepovinné)" value={price} step={0.01} onChange={setPrice} hint="z nej sa počíta hodnota vyhodeného" />
      <Field label="Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)" value={expiry} type="date" onChange={setExpiry} />
      <label style={{ display: "block", marginBottom: 8 }}>
        <span style={{ display: "block", fontSize: "var(--font-small)" }}>Upozorniť na spotrebu</span>
        <select
          aria-label="Upozornenie na spotrebu"
          value={warnDays === null ? "none" : String(warnDays)}
          onChange={(e) => setWarnDays(e.target.value === "none" ? null : Number(e.target.value))}
          style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}
        >
          {WARN_DAY_OPTIONS.map((d) => <option key={d} value={String(d)}>{d === 1 ? "1 deň vopred" : `${d} dní vopred`}</option>)}
          <option value="none">bez upozornenia</option>
        </select>
      </label>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť položku</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
