# COMPAVEN REAL Security Phase 1 — Independent 4-Eyes Review

**Dátum revízie:** 2026-11-12  
**Reviewer:** nezávislý senior security reviewer (Claude Sonnet 4.6)  
**Vetva:** `recovery-test`  
**Preskúmané súbory:** read-only, žiadne zmeny

---

## Metodika

Revízia prebehla výlučne čítaním zdrojového kódu. Neboli spustené žiadne príkazy, build ani testy. Každý záver je podložený konkrétnym riadkom kódu.

---

## Kontext architektúry

V repozitári existujú **dve oddelené aplikácie** s dvoma vstupnými bodmi:

| Vstupný bod | Aplikácia | Databáza | App súbor |
|---|---|---|---|
| `index.html` | Finančná sloboda (prototyp) | `financna-sloboda` | `src/ui/main.tsx` → `src/ui/App.tsx` |
| `src/compaven.html` | COMPAVEN 2.0 | `compaven-2.0-real` / `-sandbox` | `src/compaven.tsx` → `src/compaven-ui/App.tsx` |

Bezpečnostná implementácia Phase 1 sa týka **výlučne COMPAVEN 2.0** (`src/compaven.html`).

---

## Zistenia

---

### CRITICAL — ŽIADNE

Žiadna z preskúmaných verejných metód neumiestňuje zápis do REAL databázy pred guard kontrolou.

---

### HIGH — H-01: `_performAtomicReplace` nemá REAL guard a je prístupná cez `repo as any`

**Súbor:** `src/storage/indexeddb.ts:526`  
**Dôkaz:**
```typescript
private async _performAtomicReplace(data: AppData, attachments: Attachment[]): Promise<void> {
  // PHASE 1B: Atomická transakcia — dáta aj prílohy naraz (20 úložísk)
  const stores = ["transactions", "snapshots", ...];
  const tx = this.db.transaction(stores, "readwrite");
  // ... žiadna kontrola this.environment === "real"
```

Metóda `_performAtomicReplace` **nemá žiadnu REAL guard na svojom začiatku**. TypeScript `private` je výlučne compile-time ochrana — za behu (runtime) je metóda plne prístupná:

```typescript
// Toto v runtime prejde bez akejkoľvek REAL kontroly:
(repo as any)._performAtomicReplace(data, attachments);
```

**Scenár:** Kód v konzole prehliadača (developer tools), injektovaný skript alebo XSS útok môže zavolať `_performAtomicReplace` priamo a prepísať všetky dáta v REAL databáze bez zálohy.

**Vzor zneužitia je v kóde samotnom:** `src/compaven-ui/BackupForm.tsx:131` používa `repo as any` a explicitne volá metódy cez pretypovanie — rovnaký vzor je dostupný pre `_performAtomicReplace`.

**Test INTERNALS (riadok 508–531) je zavádzajúci:** Tvrdí „v REAL nevykonáva operáciu bez guard", ale to je **nepravda** — test iba overuje, že verejné metódy existujú (riadok 521–523), nie že `_performAtomicReplace` má vlastný guard.

**Odporúčanie:** Pridať `if (this.environment === "real") { throw new Error(...) }` na začiatok `_performAtomicReplace`.

---

### HIGH — H-02: Všetky REAL testy sa nikdy nevykonajú v štandardnom spustení Vitest

**Súbor:** `vitest.config.ts:7` + `tests/phase1b-security.test.ts` (všetky REAL bloky)  
**Dôkaz:**
```typescript
// vitest.config.ts:7
env: { VITE_COMPAVEN_ENV: process.env.VITE_COMPAVEN_ENV ?? "sandbox" },
```

Vitest vždy beží s `VITE_COMPAVEN_ENV=sandbox` (ak nie je explicitne nastavené v prostredí). Každý REAL test má štruktúru:

```typescript
if (config.env === "real") {
  // REAL logika — NIKDY sa nevykoná pri npm test
} else {
  expect(true).toBe(true);  // ← toto je to, čo sa skutočne spustí
}
```

**Ovplyvnené testy:** Test 1 (REAL časť), Test 2, Test 3, Test 4, Test 5, Test 5b, Test INTERNALS.

**Tvrdenie „17/17 REAL testov úspešných" je zavádzajúce.** Všetky REAL testy prešli triviálnym `expect(true).toBe(true)`. Bezpečnostné správanie v REAL prostredí **nebolo skutočne otestované** v žiadnom z reportovaných 17 testov.

**Odporúčanie:** Spustiť testy s `VITE_COMPAVEN_ENV=real npm test` alebo vytvoriť samostatnú CI konfiguráciu pre REAL security smoke-test. Zvážiť pridelenie inštancie fake-indexeddb s menom `compaven-2.0-real` pre testy REAL ciest.

---

### MEDIUM — M-01: `BackupSection.tsx` nemá UI-level REAL ochranu (iba storage-layer)

**Súbor:** `src/features/zaloha/BackupSection.tsx:195–207`  
**Dôkaz:**
```typescript
const confirmImport = async () => {
  if (!preview) return;
  try {
    await repo.replaceAll(preview.data);       // ← žiadna isRealEnv kontrola pred volaním
    await repo.replaceAttachments(preview.attachments);  // ← žiadna isRealEnv kontrola
  } catch {
    setErrors([STORAGE_ERROR]);  // ← nerozlišuje REAL blokáciu od inej chyby
    return;
  }
  // ...
};
```

Tlačidlo „Nahradiť dáta zálohou" nie je `disabled` v REAL, nie je zobrazené žiadne upozornenie a chybová správa pri zlyhaní (`STORAGE_ERROR`) nehovorí, prečo import zlyhá.

**Mitigovanie:** `BackupSection` je súčasťou starého prototypu (`src/ui/App.tsx`), ktorý otvára databázu `financna-sloboda`. Táto databáza neexistuje v REAL buildoch COMPAVEN 2.0 — `openRepository()` by vyhadzovalo chybu `Database name mismatch` ešte pred akýmkoľvek importom. Hrozba je teda mitigovaná, nie eliminovaná.

**Scenár:** Ak by niekto otvoril `index.html` v browseri s REAL buildovým prostredím a prepojil `BackupSection` na REAL repozitár (napr. cez console injection), storage-layer guard zastaví zápis.

**Odporúčanie:** Pridať `isRealEnv` kontrolu v `confirmImport()` a zobraziť zrozumiteľnú správu namiesto generickej `STORAGE_ERROR`.

---

### MEDIUM — M-02: `BackupForm.tsx` obsahuje nedosiahnuteľný kód (mŕtvy kód) — false sense of safety

**Súbor:** `src/compaven-ui/BackupForm.tsx:94–125`  
**Dôkaz — tok kódu:**

```typescript
// handleImportClick (riadok 48–55):
if (isRealEnv) {
  setError(REAL_IMPORT_BLOCKED_MESSAGE);
  return;  // ← EARLY RETURN — súborový dialóg sa nikdy neotvorí
}
fileInputRef.current?.click();
```

```typescript
// handleImportFile (riadok 65–68):
if (isRealEnv) {
  setError(REAL_IMPORT_BLOCKED_MESSAGE);
  return;  // ← EARLY RETURN — záloha sa nikdy nevytvorí
}
```

Riadky **94–125** (vytvorenie zálohy pred importom v REAL) sú **nedosiahnuteľné**. `backupId` zostáva `undefined`, pretože guard na riadku 65 vráti skôr. Kontrola na riadku 133 (`if (isRealEnv && ... && backupId)`) bude vždy `false`.

Kód vytvára dojem, že REAL import prebieha cez zálohu — ale táto cesta sa nikdy nevykoná.

**Odporúčanie:** Odstrániť mŕtvy kód (riadky 94–125 a podmienku na riadkoch 133–135) alebo ho explicitne označiť ako obsolete.

---

### MEDIUM — M-03: `useAutomaticUpdates` (starý prototyp) nemá REAL guard

**Súbor:** `src/ui/useAutomaticUpdates.ts:17–28`  
**Dôkaz:**
```typescript
useEffect(() => {
  if (!repo || !data || !data.settings) return;
  // ...
  if (snap) void repo.addSnapshot(snap).then(reload).catch(() => undefined);
}, [repo, data]);
```

Hook `useAutomaticUpdates` volá `repo.addSnapshot()` bez kontroly `isAutoSnapshotEnabled()` alebo `isRealEnv`. Na rozdiel od `useAutomaticSnapshot` v COMPAVEN 2.0 nemá žiadnu ochranu.

**Mitigovanie:** `useAutomaticUpdates` je len v starOM prototypu (`src/ui/App.tsx`), ktorý nemôže otvoriť REAL databázu (databáza `financna-sloboda` by spôsobila `Database name mismatch` chybu).

**Odporúčanie:** Pridať `isAutoSnapshotEnabled()` guard, alebo aktualizovať komentár, že hook je výlučne pre prototyp.

---

### LOW — L-01: `EMPTY_DATA` v `Lock.tsx` chýba `personalGoals`

**Súbor:** `src/features/zamok/Lock.tsx:13–17`  
**Dôkaz:**
```typescript
const EMPTY_DATA: AppData = {
  settings: null, transactions: [], snapshots: [], ..., persons: [], households: [],
  // ↑ CHÝBA: personalGoals: []
};
```

TypeScript by mal zachytiť chýbajúcu povinnú vlastnosť pri kompilácii. Ak `personalGoals` je v `AppData` required, `tsc` by mal vyhodiť chybu. Ak sa kompiluje bez chyby, buď je `personalGoals` optional alebo `tsc` nie je správne nastavený.

**Scenár:** Pri wipe v SANDBOX cez `replaceAll(EMPTY_DATA)` by `personalGoals` zostali v databáze (bez vyčistenia), ak `replaceAll` nemaže `personalGoals` store — avšak `replaceAll` explicitne čistí `personalGoals` store (riadok 483).

**Odporúčanie:** Doplniť `personalGoals: []` pre konzistentnosť.

---

### LOW — L-02: `BackupSection.confirmImport` volá `replaceAll` a `replaceAttachments` sekvenčne, nie atomicky

**Súbor:** `src/features/zaloha/BackupSection.tsx:198–199`  
**Dôkaz:**
```typescript
await repo.replaceAll(preview.data);        // ← transakcia 1
await repo.replaceAttachments(preview.attachments);  // ← transakcia 2
```

Dve oddelené transakcie — ak druhá zlyhá, dáta sú nahradené ale prílohy nie. Táto nesúlad nie je v COMPAVEN 2.0 (kde sa používa atomické `replaceAllWithAttachments`).

**Odporúčanie:** V COMPAVEN 2.0 `BackupForm.tsx` je to vyriešené správne. Ak sa `BackupSection` plánuje zachovať, migrujte na `replaceAllWithAttachments`.

---

### INFO — I-01: Architektúra prostredia je správna a konzistentná

- `VITE_COMPAVEN_ENV` je jediný autoritatívny zdroj (build-time, nie URL param)
- `getEnvironmentConfig()` vyhadzuje pri neznámej hodnote
- `openRepository()` validuje zhodu názvu DB s prostredím
- `validateEnvironmentConsistency()` sa volá na štarte aplikácie (`src/compaven.tsx:17–24`)

---

### INFO — I-02: Ochrana REAL v `IdbRepository` — potvrdená read-only kontrolou

Všetky tri write paths v `IdbRepository` majú guard na prvom riadku:

| Metóda | Súbor:riadok | Guard | Dôkaz |
|---|---|---|---|
| `replaceAll` | `indexeddb.ts:452–455` | `if (this.environment === "real") throw` | ✅ |
| `replaceAllWithAttachments` | `indexeddb.ts:508–510` | `if (this.environment === "real") throw` | ✅ |
| `replaceAllWithAttachmentsForRestore` | `indexeddb.ts:517–519` | `if (this.environment === "real") throw` | ✅ |
| `replaceAttachments` | `indexeddb.ts:193–195` | `if (this.environment === "real") throw` | ✅ |

**_performAtomicReplace: guard CHÝBA** — viď H-01.

---

### INFO — I-03: Tlačidlo importu v REAL je `disabled` aj vizuálne blokované

**Súbor:** `src/compaven-ui/BackupForm.tsx:185`
```typescript
disabled={loading || isRealEnv}
```

**Súbor:** `src/compaven-ui/BackupForm.tsx:208–212` — zobrazí sa varovná správa `REAL_IMPORT_BLOCKED_MESSAGE`.

Dvojitá poistka v `handleImportClick` (riadok 50–53) a `handleImportFile` (riadok 65–68) je správna.

---

### INFO — I-04: Auto-snapshoty v COMPAVEN 2.0 sú správne vypnuté v REAL

**Súbor:** `src/compaven-ui/useAutomaticSnapshot.ts:11–13`
```typescript
export function isAutoSnapshotEnabled(): boolean {
  return !getEnvironmentConfig().isRealEnv;
}
```

Guard je na prvom riadku `createAutoSnapshotIfNeeded()` (riadok 35): `if (!isAutoSnapshotEnabled()) return;`

Oba `useEffect` hooku volajú `createAutoSnapshotIfNeeded()`, ktorý obsahuje guard. Ďalší spúšťač (visibility change, riadok 96–101) tiež prechádza cez tú istú funkciu.

**Žiadna alternatívna cesta auto-snapshot v REAL neexistuje** v COMPAVEN 2.0 (starý prototyp je mimo scope — viď M-03).

---

## Audit testov

### Celkový kontext

Vitest beží s `VITE_COMPAVEN_ENV=sandbox` (default v `vitest.config.ts:7`). Preto:
- **Všetky REAL `if`-bloky sa preskočia** → triviálny `expect(true).toBe(true)` prechádza
- Testy sú validné pre SANDBOX správanie
- Testy **nie sú validné pre overenie REAL bezpečnosti**

### Individuálny audit

| Test | Čo overuje | Čo NEoveruje | Falošne pozitívny? | Prostredie |
|---|---|---|---|---|
| Test 1 (REAL) | REAL odmietne SANDBOX DB | Nespustí sa v SANDBOX | ÁNO — skáče na `expect(true)` | SANDBOX |
| Test 1 (SANDBOX) | SANDBOX odmietne REAL DB, DB mismatch pre neznámy | ✅ — spustí sa | Nie | SANDBOX ✅ |
| Test 2 | REAL odmietne `replaceAll` | Nespustí sa | ÁNO | SANDBOX |
| Test 3 | REAL odmietne `replaceAttachments` | Nespustí sa | ÁNO | SANDBOX |
| Test 4 | REAL odmietne `replaceAllWithAttachments` | Nespustí sa | ÁNO | SANDBOX |
| Test 5 | REAL odmietne `replaceAllWithAttachmentsForRestore` | Nespustí sa | ÁNO | SANDBOX |
| Test 5b | Všetky REAL cesty importu hádžu | Nespustí sa | ÁNO | SANDBOX |
| Test 6 | `isAutoSnapshotEnabled()` REAL=false / SANDBOX=true | ✅ — spustí sa v oboch | Nie | SANDBOX ✅ |
| Test 7 | SANDBOX umožní `replaceAllWithAttachments` | ✅ — spustí sa | Nie | SANDBOX ✅ |
| Test 7b | SANDBOX `BackupForm` import funguje | ✅ — spustí sa | Nie | SANDBOX ✅ |
| Test 7c | SANDBOX `replaceAll` funguje | ✅ — spustí sa | Nie | SANDBOX ✅ |
| Test 7d | SANDBOX `replaceAttachments` funguje | ✅ — spustí sa | Nie | SANDBOX ✅ |
| Test 7e | `isAutoSnapshotEnabled()` SANDBOX=true | ✅ — spustí sa | Nie | SANDBOX ✅ |
| Test 8 | Atomická transakcia má 20 úložísk | Iba komentár + počet, nie runtime test | Nie (len dokumentácia) | SANDBOX ✅ |
| Test INTERNALS | Verejné metódy existujú | `_performAtomicReplace` guard CHÝBA | ÁNO — tvrdenie je nepravdivé | SANDBOX |
| Test BONUS | Bežné operácie nie sú blokované | Iba existencia funkcií, nie blokácia | Nie (len smoke) | SANDBOX ✅ |

### Záver auditu testov

Z 17 testov:
- **9 testov skutočne overuje logiku** (Test 1-SANDBOX, Test 6, Test 7, 7b, 7c, 7d, 7e, Test 8, Test BONUS)
- **7 testov má falošne pozitívny výsledok** (Test 1-REAL, 2, 3, 4, 5, 5b, INTERNALS) — prechádzajú, pretože REAL vetva sa nikdy nevykoná
- **1 test (Test INTERNALS) obsahuje nepravdivé tvrdenie** — `_performAtomicReplace` nemá guard v REAL

---

## Konečné rozhodnutie

### NOT APPROVED

**Dôvod:** Existuje dokazateľná cesta na obídenie REAL ochrany cez `_performAtomicReplace` (H-01), ktorá nemá vlastný guard a je prístupná za behu programu. Zároveň bezpečnostné testy REAL prostredia nikdy neboli skutočne vykonané (H-02) — tvrdenie o ich úspešnosti je zavádzajúce.

**Podmienky schválenia:**
1. Pridať REAL guard do `_performAtomicReplace` (H-01)
2. Spustiť testy s `VITE_COMPAVEN_ENV=real` a potvrdiť, že REAL bloky prechádzajú (H-02)
3. Opraviť nepravdivé tvrdenie v Test INTERNALS

Ostatné nálezy (M-01, M-02, M-03, L-01, L-02) neblokujú schválenie, ale mali by byť adresované.

---

*Revízia vykonaná read-only prečítaním zdrojového kódu. Neboli spustené žiadne príkazy, build ani testy. Každý záver je podložený konkrétnym riadkom zdrojového kódu.*
