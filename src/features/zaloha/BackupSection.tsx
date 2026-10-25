import { useRef, useState } from "react";
import type { Repository } from "../../storage/repository";
import type { AppData, Attachment } from "../../storage/types";
import { backupTooLarge, buildBackup, parseBackup } from "../../storage/backup";
import { encodeAttachment } from "../../storage/attachments";
import { MIN_PASSWORD_LENGTH, decryptBackup, encryptBackup, isEncryptedBackup, type EncryptedBackup } from "../../storage/backupCrypto";
import { daysSince } from "../../domain/dates";
import { backupOverdue } from "../../domain/reminders";
import { dateSk, todayIso } from "../../ui/kit/format";
import { btn, btnPrimary, inp } from "../../ui/kit/controls";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { calloutStyle, hintStyle } from "../../ui/kit/controls";

/** Záloha a obnova (FR-17, FR-18): export, import s náhľadom, pomocné texty. Feature „zaloha“ (docs/23). */
/** Stiahne zálohu aktuálnych dát a vráti čas exportu (FR-17). */
/**
 * Export zálohy. Ak prehliadač dokáže zdieľať súbory (iPhone), ponúkne zdieľací list, kde sa dá zvoliť
 * „Uložiť do Súborov“. Inak alebo pri chybe zdieľania súbor stiahne. Zrušenie zdieľania nič neuloží.
 */
export type ExportResult = { result: "shared" | "downloaded" | "cancelled"; exportedAt: string } | { result: "needsTap"; exportedAt: string; file: File };

export async function exportBackupFile(data: AppData, attachments: Attachment[], password?: string): Promise<ExportResult> {
  const nowIso = new Date().toISOString();
  const plain = JSON.stringify(buildBackup(data, nowIso, await Promise.all(attachments.map(encodeAttachment))), null, 2);
  // Heslo je voliteľné (N-05, D-276): bez hesla sa zapíše bežný JSON.
  const encrypted = password ? JSON.stringify(await encryptBackup(plain, password)) : null;
  const name = `financna-sloboda-zaloha-${todayIso()}${encrypted ? "-sifrovana" : ""}.json`;
  // Typ text/plain: Safari na iPhone zdieľa len vybrané typy (text, PDF, obrázky), JSON nie. Bez zdieľacieho listu
  // by sa súbor v appke na ploche otvoril na celú obrazovku bez cesty späť (D-305). Koncovka .json ostáva, obnova ju prijme.
  const file = new File([encrypted ?? plain], name, { type: "text/plain" });
  const r = await deliverBackupFile(file);
  return r === "needsTap" ? { result: "needsTap", exportedAt: nowIso, file } : { result: r, exportedAt: nowIso };
}

/**
 * Zdieľa alebo stiahne pripravený súbor zálohy. Ak Safari zdieľanie odmietne, lebo od ťuknutia ubehlo priveľa času
 * (šifrovanie, NotAllowedError), nestiahne ho, ale vráti „needsTap“: appka ukáže tlačidlo na nové ťuknutie
 * (revízia 2026-10-25c, S-3; rovnaký dôvod ako D-307).
 */
export async function deliverBackupFile(file: File): Promise<"shared" | "downloaded" | "cancelled" | "needsTap"> {
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return "shared";
    } catch (err) {
      const n = (err as { name?: string })?.name;
      if (n === "AbortError") return "cancelled";
      if (n === "NotAllowedError") return "needsTap";
      // inak spadneme na stiahnutie
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}

/** Stručný obsah dát pre porovnanie pred importom (D-134). */
function summarizeData(d: AppData): string {
  return [
    `transakcií ${d.transactions.length}`,
    `vyhodnotení ${d.snapshots.length}`,
    `majetok ${d.properties.length + d.assets.length}`,
    `investície ${d.investments.length}`,
    `záväzky ${d.liabilities.length}`,
    `príjmy ${d.incomes.length}`,
    `rozpočty ${d.budgets.length}`,
    `pravidelné výdavky ${d.recurringExpenses.length}`,
    `položky skladu ${d.stockItems.length}`,
    `recepty ${d.recipes.length}`,
    `nastavenia ${d.settings ? "áno" : "nie"}`,
  ].join(", ");
}

/** Preloží technické chyby z overenia zálohy do slovenčiny (bez interných názvov polí). */
function plainBackupError(e: string): string {
  const field = /^záloha: (\w+) musí byť pole$/.exec(e);
  if (field) return `Súbor nemá správne pole „${field[1]}“.`;
  return e;
}

function lastExportText(iso: string, today: string): string {
  const days = daysSince(iso, today);
  const date = dateSk(iso.slice(0, 10));
  if (days <= 0) return `${date} (dnes)`;
  if (days === 1) return `${date} (včera)`;
  return `${date} (pred ${days} dňami)`;
}

export function BackupSection({ repo, data, lastExport, onChanged, onExported }: { repo: Repository; data: AppData; lastExport: string | null; onChanged: () => void; onExported: (iso: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<{ data: AppData; attachments: Attachment[]; counts: { transactions: number; snapshots: number }; exportedAt: string; notes: string[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  // Správa o exporte je v časti Uložiť zálohu, správa o obnove v časti Obnoviť (D-294, docs/46 3.7).
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportPassword, setExportPassword] = useState("");
  // Pripravená záloha čaká na ťuknutie, ak zdieľanie odmietlo oneskorené spustenie (S-3).
  const [pending, setPending] = useState<{ file: File; exportedAt: string; encrypted: boolean } | null>(null);
  const [encryptedImport, setEncryptedImport] = useState<EncryptedBackup | null>(null);
  const [importPassword, setImportPassword] = useState("");

  const exportBackup = async () => {
    if (exportPassword !== "" && exportPassword.length < MIN_PASSWORD_LENGTH) return setExportStatus(`Heslo musí mať aspoň ${MIN_PASSWORD_LENGTH} znakov. Nič sa neexportovalo.`);
    setPending(null);
    const r = await exportBackupFile(data, await repo.listAllAttachments(), exportPassword || undefined);
    if (r.result === "needsTap") {
      setPending({ file: r.file, exportedAt: r.exportedAt, encrypted: exportPassword !== "" });
      setExportPassword("");
      return setExportStatus("Záloha je pripravená. Ťukni na Uložiť pripravenú zálohu.");
    }
    finishExport(r.result, r.exportedAt, exportPassword !== "");
    setExportPassword("");
  };

  const savePending = async () => {
    if (!pending) return;
    const how = await deliverBackupFile(pending.file);
    if (how === "needsTap") return setExportStatus("Zdieľanie sa neotvorilo. Skús Uložiť pripravenú zálohu znova.");
    setPending(null);
    finishExport(how, pending.exportedAt, pending.encrypted);
  };

  const finishExport = (result: "shared" | "downloaded" | "cancelled", exportedAt: string, encrypted: boolean) => {
    if (result === "cancelled") return setExportStatus("Export bol zrušený. Záloha nie je uložená.");
    onExported(exportedAt);
    const enc = encrypted ? "Záloha je zašifrovaná; na obnovu potrebuješ heslo. " : "";
    setExportStatus(enc + (result === "shared"
      ? "Záloha je uložená podľa tvojho výberu. Obsahuje citlivé finančné údaje vrátane čísel dokladov: neukladaj ju do verejných priečinkov."
      : "Záloha sa stiahla. Obsahuje citlivé finančné údaje vrátane čísel dokladov: neukladaj ju do verejných priečinkov."));
  };

  const onFile = async (file: File) => {
    setErrors([]);
    setPreview(null);
    setStatus(null);
    if (backupTooLarge(file.size)) {
      setErrors(["Súbor zálohy je väčší ako 100 MB. Nič sa nezmenilo."]);
      return;
    }
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      setErrors(["Súbor nie je platný JSON. Nič sa nezmenilo."]);
      return;
    }
    if (isEncryptedBackup(json)) {
      setEncryptedImport(json);
      setImportPassword("");
      return;
    }
    openBackupJson(json);
  };

  /** Overí zálohu a ukáže náhľad (rovnako pre bežný a odomknutý súbor). */
  const openBackupJson = (json: unknown) => {
    const res = parseBackup(json, todayIso());
    if (!res.ok) {
      setErrors([...res.errors.map(plainBackupError), "Nič sa nezmenilo."]);
      return;
    }
    setPreview({ data: res.data!, attachments: res.attachments ?? [], counts: res.counts!, exportedAt: (json as { exportedAt: string }).exportedAt, notes: res.notes ?? [] });
  };

  const unlockBackup = async () => {
    if (!encryptedImport) return;
    setErrors([]);
    let json: unknown;
    try {
      json = JSON.parse(await decryptBackup(encryptedImport, importPassword));
    } catch {
      setErrors(["Heslo nesedí alebo je súbor poškodený. Nič sa nezmenilo."]);
      return;
    }
    setEncryptedImport(null);
    setImportPassword("");
    openBackupJson(json);
  };

  const confirmImport = async () => {
    if (!preview) return;
    try {
      await repo.replaceAll(preview.data);
      await repo.replaceAttachments(preview.attachments);
    } catch {
      setErrors([STORAGE_ERROR]);
      return;
    }
    setPreview(null);
    setStatus("Dáta boli nahradené zálohou.");
    onChanged();
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Dáta sú len v tomto zariadení. Pravidelne si ulož zálohu. Záloha obsahuje aj čísla dokladov, preto ju chráň.</p>
      <h3 style={{ fontSize: "var(--font-text)", marginBottom: 0 }}>Záloha do súboru</h3>
      <p>Posledná záloha: <strong>{lastExport ? lastExportText(lastExport, todayIso()) : "zatiaľ žiadna"}</strong></p>
      {backupOverdue(lastExport, todayIso()) && (
        <p style={calloutStyle("warn")}>Záloha je staršia ako 7 dní alebo ešte nebola urobená. Odporúčame novú zálohu.</p>
      )}
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "var(--font-small)" }}>Heslo na šifrovanie zálohy (nepovinné, aspoň {MIN_PASSWORD_LENGTH} znakov)</span>
        <input type="password" aria-label="Heslo na šifrovanie zálohy" autoComplete="new-password" maxLength={100} value={exportPassword} onChange={(e) => setExportPassword(e.target.value)} style={inp} />
      </label>
      <p style={hintStyle}>Heslo sa nedá obnoviť. Bez neho sa zašifrovaná záloha neotvorí.</p>
      <button onClick={exportBackup} style={pending ? btn : btnPrimary}>Uložiť zálohu</button>
      {pending && <button onClick={savePending} style={{ ...btnPrimary, marginLeft: 8 }}>Uložiť pripravenú zálohu</button>}
      <p style={hintStyle}>Na iPhone sa otvorí zdieľací list (napr. Uložiť do Súborov), v počítači sa súbor stiahne do priečinka Stiahnuté.</p>
      {exportStatus && <p style={{ marginTop: 12 }}>{exportStatus}</p>}
      <h3 style={{ fontSize: "var(--font-text)", marginBottom: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>Obnoviť zo zálohy</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => fileRef.current?.click()} style={btn}>Vybrať súbor zálohy</button>
        <span style={hintStyle}>{fileName || "Nie je vybraný žiadny súbor"}</span>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-label="Súbor zálohy"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileName(f?.name ?? "");
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {encryptedImport && (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginTop: 8 }}>
          <p>Záloha je zašifrovaná. Zadaj heslo, ktorým si ju exportoval.</p>
          <input type="password" aria-label="Heslo k záložnému súboru" autoComplete="current-password" value={importPassword} onChange={(e) => setImportPassword(e.target.value)} style={inp} />
          <div style={{ marginTop: 8 }}>
            <button onClick={unlockBackup} style={btn}>Otvoriť zálohu</button>{" "}
            <button onClick={() => { setEncryptedImport(null); setImportPassword(""); }} style={btn}>Zrušiť</button>
          </div>
        </div>
      )}
      {errors.length > 0 && <ul style={{ color: "var(--danger)" }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
      {preview && (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6 }}>
          <p>Záloha z {dateSk(preview.exportedAt.slice(0, 10))} obsahuje: {summarizeData(preview.data)}.</p>
          <p style={hintStyle}>Teraz v zariadení: {summarizeData(data)}.</p>
          {preview.notes.map((n) => <p key={n} style={{ ...calloutStyle("warn"), fontSize: "var(--font-small)" }}>{n}</p>)}
          <p><strong>Import nahradí všetky aktuálne dáta v tomto zariadení.</strong></p>
          <p style={{ color: "var(--danger)", fontSize: "var(--font-small)" }}>Aktuálne dáta sa nenávratne prepíšu. Ak ich chceš zachovať, najprv ulož zálohu tlačidlom „Uložiť zálohu“ hore.</p>
          <button onClick={confirmImport} style={btn}>Nahradiť dáta zálohou</button>{" "}
          <button onClick={() => setPreview(null)} style={btn}>Zrušiť</button>
        </div>
      )}
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </section>
  );
}
