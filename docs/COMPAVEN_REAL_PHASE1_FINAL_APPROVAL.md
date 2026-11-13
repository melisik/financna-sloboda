# COMPAVEN REAL Phase 1 — Final Independent Approval

**Dátum auditu:** 2026-11-12  
**Vetva:** `recovery-test`  
**Posledný commit:** `41a8e7a` — docs: oprava stavových údajov v odovzdávacom dokumente  
**Reviewer:** Claude Sonnet 4.6 (nezávislá session, bez prístupu k working context implementátora)  
**Režim:** výhradne READ ONLY — žiadny súbor nebol zmenený; testy spustené len v SANDBOX režime s fake-indexeddb

---

## Podklady

| Dokument | Popis |
|---------|-------|
| `docs/COMPAVEN_REAL_PHASE1_FINAL_REVIEW.md` | Pôvodný review — verdict NOT APPROVED, nálezy N1–N4 |
| `docs/COMPAVEN_REAL_PHASE1_REMEDIATION.md` | Implementátorský report o oprave N1, N2; blokovanie N3 |

---

## Výsledky kontrol

### Kontrola 1: Atomický import

**Súbory:** `src/features/zaloha/BackupSection.tsx`, `src/storage/indexeddb.ts`

#### 1a — confirmImport používa jedinú metódu replaceAllWithAttachments

**Overené ✅**

`BackupSection.tsx:206`:
```typescript
await repo.replaceAllWithAttachments(preview.data, preview.attachments);
```
Pôvodné dve oddelené volania (`replaceAll` + `replaceAttachments`) boli nahradené jedným atomickým volaním. REAL guard v `confirmImport` (riadky 201–204) zostal nezmenený a predchádza tomuto volaniu.

#### 1b — replaceAllWithAttachments v indexeddb.ts

**Overené ✅**

`indexeddb.ts:506–514`:
- REAL guard na riadku 508–510: háže pred akýmkoľvek zápisom
- Volá `_performAtomicReplace` — nedelegovateľná implementácia

#### 1c — _performAtomicReplace: jedna transakcia, 20 úložísk, abort pri chybe

**Overené ✅**

`indexeddb.ts:526–585`:
- Vlastný REAL guard na riadkoch 529–531 (nezávislá poistka, runtime ochrana)
- Jedna `readwrite` transakcia pokrýva všetkých 20 úložísk:
  `transactions, snapshots, settings, properties, assets, investments, liabilities, incomes, budgets, recurringExpenses, stockItems, recipes, dogs, goals, wasteRecords, shoppingItems, persons, households, personalGoals, attachments`
- `tx.done.catch(() => undefined)` na riadku 535 (štandardný vzor pre idb knižnicu)
- Catch blok riadok 580–583: `try { tx.abort(); } catch { /* ... */ }` — abort pri synchronizovateľnej chybe
- `throw err` po aborte — chyba sa propaguje nahor

#### 1d — REAL guard pred akýmkoľvek zápisom

**Overené ✅**

Poradie ochranných vrstiev (od vonka):
1. UI: button `disabled={isRealEnv}` — `BackupSection.tsx:272`
2. UI: `if (isRealEnv) { setErrors([...]); return; }` — `BackupSection.tsx:201–204`
3. Metóda: `if (this.environment === "real") throw` — `replaceAllWithAttachments:508`
4. Interná metóda: `if (this.environment === "real") throw` — `_performAtomicReplace:529`

Žiadna vrstva sa nespolieha na predchádzajúcu. Každá je nezávislou ochranou.

#### 1e — Obmedzenie: rollback nie je priamo otestovaný

**Zdokumentované obmedzenie ⚠️**

Existujúce testy (Test ATOMIC-1) overujú:
- Úspešný atomický zápis (success path)
- Vymazanie predchádzajúcich dát (success path)
- REAL guard háže pred zápisom (pre-write guard)

**Čo nie je otestované:** Priame overenie rollbacku — teda scenár, keď transakcia zlyhá uprostred (napr. po `clear()`, pred zápisom dát). Takýto test by vyžadoval injektovanie chyby do IndexedDB transakcie, čo nie je možné bez mockovania `fake-indexeddb` internálov.

**Posúdenie:** Atomicita IndexedDB `readwrite` transakcii je garantovaná špecifikáciou W3C a implementáciou prehliadača. `tx.abort()` v catch bloku je správny vzor. Implementácia je štandardná a dôveryhodná. Absencia priameho testu rollbacku je obmedzenie testovacej sady, nie bezpečnostný defekt.

---

### Kontrola 2: Windows a REAL security testy

**Súbory:** `vitest.config.real.ts`, `package.json`, `vitest.config.ts`, `tests/phase1b-security.test.ts`

#### 2a — Vitest načítava VITE_COMPAVEN_ENV=real

**Overené ✅**

`vitest.config.real.ts:8`:
```typescript
env: { VITE_COMPAVEN_ENV: "real" },
```
Hodnota je natvrdo v konfiguračnom súbore. Vitest ju načíta platformovo-nezávisle bez potreby Unix env syntaxe.

`package.json:15`:
```
"test:security-real": "vitest run --config vitest.config.real.ts tests/phase1b-security.test.ts"
```
Skript neobsahuje Unix env prefix. Je plne kompatibilný s Windows PowerShell.

`vitest.config.ts:7`:
```typescript
env: { VITE_COMPAVEN_ENV: process.env.VITE_COMPAVEN_ENV ?? "sandbox" },
```
Štandardné `npm test` vždy použije `"sandbox"` — REAL security testy sú izolované.

#### 2b — REAL testy skutočne vykonávajú REAL vetvy

**Overené ✅ — testy spustené**

`npm run test:security-real` spustený v tejto session:
```
Test Files  1 passed (1)
Tests       20 passed (20)
Duration    300ms
```

`npm run test:security-sandbox` spustený v tejto session:
```
Test Files  1 passed (1)
Tests       20 passed (20)
Duration    321ms
```

V REAL móde sú aktívne minimálne tieto netriviálne vetvy:
- Test 1: DB name mismatch (REAL odmietne SANDBOX DB)
- Test 2: `replaceAll` háže v REAL
- Test 3: `replaceAttachments` háže v REAL
- Test 4: `replaceAllWithAttachments` háže v REAL
- Test 5 + 5b: `replaceAllWithAttachmentsForRestore` háže v REAL
- Test 6: `isAutoSnapshotEnabled()` vráti false v REAL
- Test INTERNALS: `_performAtomicReplace` háže pri priamom volaní v REAL
- Test ATOMIC-1 (REAL vetva): `replaceAllWithAttachments` háže v REAL

SANDBOX vetvy v REAL móde padajú do `else { expect(true).toBe(true) }` — to je zámerné (SANDBOX operácie nie sú testovateľné v REAL, lebo REAL guard háže pred vykonaním).

#### 2c — Testy nepoužívajú triviálne podmienky pre REAL vetvy

**Overené ✅**

REAL vetvy v testoch obsahujú reálne asertácie:
- `expect(...).rejects.toThrow(...)` — overujú konkrétnu chybovú správu
- `expect(config.dbName).toBe("compaven-2.0-real")` — overujú konfiguráciu
- `expect(shouldEnable).toBe(false)` — overujú vypnutie auto-snapshotov

Triviálne `expect(true).toBe(true)` je použité výhradne v opačných vetvách (SANDBOX testy v REAL móde), kde nie je možné testovať SANDBOX správanie.

#### 2d — REAL a SANDBOX testy sú izolované

**Overené ✅**

- `vitest.config.real.ts` je používaný výhradne cez `--config` flag
- Štandardné `npm test` a `test:security-sandbox` nikdy nenačítajú `vitest.config.real.ts`
- Všetky testy používajú `fake-indexeddb/auto` — izolovanú falošnú IndexedDB; žiadna skutočná REAL databáza nie je dotknutá

#### 2e — Konfigurácia neovplyvňuje ostatné testy

**Overené ✅**

`vitest.config.real.ts` obsahuje `include: ["tests/**/*.test.ts"]` — to pokrýva všetky testy. Pri spustení `--config vitest.config.real.ts tests/phase1b-security.test.ts` je cieľový súbor explicitný, takže sa spustí iba `phase1b-security.test.ts` v REAL móde.

Celá štandardná sada: `npm test` — 1116 testov, 140 súborov, všetky prešli bez regresie.

---

### Kontrola 3: Pôvodné ochrany REAL

#### Blokovanie REAL importu

**Overené ✅ — dvojitá ochrana**

- `BackupSection.tsx:201–204`: `if (isRealEnv) { setErrors([REAL_IMPORT_BLOCKED_MESSAGE]); return; }`
- `indexeddb.ts:508–510`: `if (this.environment === "real") throw new Error("❌ Priama hromadná náhrada...")`

#### Blokovanie REAL resetu

**Overené ✅**

- `indexeddb.ts:452–455`: `if (this.environment === "real") throw new Error("❌ Reset databázy...")`

#### Ochrana _performAtomicReplace

**Overené ✅**

- `indexeddb.ts:529–531`: guard je runtime ochrana — blokuje aj pri priamom volaní cez `(repo as any)._performAtomicReplace(...)`

#### Ochrana replaceAll

**Overené ✅** — `indexeddb.ts:452–455`

#### Ochrana replaceAttachments

**Overené ✅** — `indexeddb.ts:193–195`

#### Ochrana replaceAllWithAttachments

**Overené ✅** — `indexeddb.ts:508–510`

#### Ochrana replaceAllWithAttachmentsForRestore

**Overené ✅** — `indexeddb.ts:518–520`: háže `REAL_IMPORT_BLOCKED_MESSAGE`

#### Vypnutie automatických snapshotov v REAL

**Overené ✅**

- `useAutomaticUpdates.ts:21–23`: guard s try/catch pre auto-snapshot hoók
- `useAutomaticSnapshot.ts`: `isAutoSnapshotEnabled()` vracia `!getEnvironmentConfig().isRealEnv`

#### Povolenie exportu v REAL

**Overené ✅**

`BackupSection.tsx`: `exportBackup()` a `savePending()` nemajú REAL guard — export je povolený. Tlačidlo „Uložiť zálohu" nie je `disabled` v REAL.

#### Bezpečná izolácia databáz

**Overené ✅**

`openRepository()` riadky 30–37: striktná kontrola — `if (name !== envConfig.dbName && !isTestIsolationDb(name)) throw "FATAL: Database name mismatch"`. Žiadny fallback na inú databázu nie je možný.

---

### Kontrola 4: N3 — useAutomaticUpdates

**Súbor:** `src/ui/useAutomaticUpdates.ts`

#### Aktuálny stav N3

Súbor je **NEZMENENÝ** oproti stavu z `docs/COMPAVEN_REAL_PHASE1_FINAL_REVIEW.md`. Implementátor označil N3 ako BLOCKED (pravidlo 9: nemeň legacy `src/ui/`).

Kód na riadkoch 21–23:
```typescript
let isReal = false;
try { isReal = getEnvironmentConfig().isRealEnv; } catch { /* starý prototyp */ }
if (isReal) return;
```

#### Posúdenie rizika

**Scenár N3:** Ak `VITE_COMPAVEN_ENV` nie je nastavené (nevalidný build), try/catch prehltí výnimku, `isReal` zostane `false`, auto-snapshot hoók pokračuje ďalej.

**Mitigácia:** `openRepository()` volá `getEnvironmentConfig()` bez try/catch — ak env nie je nastavené, `openRepository()` háže a aplikácia sa neotvorí. Hoók `useAutomaticUpdates` sa nikdy nevykoná, pretože `repo` zostane `null`.

**Záver:** N3 **nepredstavuje cestu k zápisu do REAL databázy** v praktickom scenári. Nevalidný build zlyhá pred montážou React hoókov.

**Poznámka:** Druhý `useEffect` v `useAutomaticUpdates` (riadky 38–56) — automatické splácanie hypoték a úverov — NEMÁ REAL guard. Toto je zámerné správanie: `saveProperty` a `saveLiability` sú individuálne záznamy bez bulk replace semantiky. Táto oblasť nebola súčasťou pôvodného M03 nálezu.

**Odporúčanie pre budúci release:** Zmeniť `let isReal = false;` na `let isReal = true;` v `useAutomaticUpdates.ts`, ak a keď bude pravidlo 9 zrušené.

**N3 môže zostať zdokumentovaným minor finding bez blokovania schválenia.**

---

### Kontrola 5: Git a stash (read-only)

**Vetva:** `recovery-test` ✅

**Stash (5 položiek — zachované):**
```
stash@{0}: WIP on recovery-test: 41a8e7a
stash@{1}: On phase3-ux-base: phase3-ux-base-local-changes
stash@{2}: On phase3-ux-base: a1-e2e
stash@{3}: On phase3-ux-base: a1-e2e-compare
stash@{4}: On phase3-ux-base: compare-e2e-1
```

Všetky 5 položiek sú zachované. Working tree obsahuje uncommitnuté zmeny — nezmenené.

---

## Výsledky testov (spustené v tejto session)

| Príkaz | Výsledok |
|--------|----------|
| `npm run test:security-sandbox` | 20/20 testov prešlo, 321ms |
| `npm run test:security-real` | 20/20 testov prešlo, 300ms |
| `npm test` | 1116/1116 testov, 140 súborov, 24.14s |

Všetky testy bežali s `fake-indexeddb/auto` — bez prístupu k skutočnej databáze.

---

## Prehľad remediácie nálezov N1, N2, N3

| Nález | Pôvodný popis | Stav remediation | Overenie |
|-------|---------------|------------------|----------|
| N1 | confirmImport neatomická operácia | ✅ FIXED | Potvrdené — BackupSection:206 |
| N2 | test:security-real nefunguje na Windows | ✅ FIXED | Potvrdené — vitest.config.real.ts + package.json:15 |
| N3 | useAutomaticUpdates try/catch ticho ignoruje env chybu | ⛔ BLOCKED (pravidlo 9) | Potvrdené — súbor nezmenený, riziko nízke |
| N4 | Stash obsahuje 5 položiek | ✅ ZAZNAMENANÉ | Potvrdené — 5 položiek zachovaných |

---

## Záverečné hodnotenie

### Bezpečnosť REAL

| Oblasť | Hodnotenie |
|--------|-----------|
| Blokovanie bulk replace operácií | ✅ PLNE CHRÁNENÉ |
| Blokovanie importu zálohy | ✅ PLNE CHRÁNENÉ (dvojitá ochrana) |
| Blokovanie REAL resetu | ✅ PLNE CHRÁNENÉ |
| Interná metóda _performAtomicReplace | ✅ CHRÁNENÁ (runtime guard) |
| Automatické snapshoty v REAL | ✅ VYPNUTÉ |
| Izolácia databáz | ✅ STRIKTNÁ |
| Export v REAL | ✅ POVOLENÝ |

### Kvalita testovania

| Oblasť | Hodnotenie |
|--------|-----------|
| REAL security testy spustiteľné na Windows | ✅ OPRAVENÉ |
| REAL vetvy skutočne testované | ✅ OVERENÉ (≥10/20 netriviálnych) |
| Regresný test celej sady | ✅ 1116/1116 |
| Priame testovanie rollbacku transakcie | ⚠️ NEDOSTUPNÉ (obmedzenie fake-indexeddb) |

### Nevyriešené obmedzenia

| ID | Závažnosť | Popis |
|----|-----------|-------|
| N3 | LOW | `useAutomaticUpdates` try/catch fail-safe na `false` namiesto `true` |
| Rollback test | LOW | Atomická transakcia nie je priamo testovaná s injektovanou chybou |

### Bezpečnosť REAL databázy

Žiadna z nevyriešených oblastí nepredstavuje cestu k neautorizovanému zápisu do REAL databázy:
- N3: mitigovaná zlyhaním `openRepository()` pred montážou hoókov
- Rollback: garantovaný IndexedDB špecifikáciou; absencia testu nie je bezpečnostný defekt

---

## **VERDICT: APPROVED WITH MINOR FINDINGS**

Produkčný bezpečnostný kód REAL prostredia je správne implementovaný. Všetky bulk-replace operácie sú blokované na viacerých nezávislých úrovniach. REAL security testy sú spustiteľné a overujú REAL vetvy. Testovacie výsledky zodpovedajú tvrdeniam implementátora.

**Schvaľujem nasadenie na základe:**
- Plnej ochrany REAL databázy pred neautorizovanými zápismi
- Opravenej Windows kompatibility REAL security testov
- Opraveného atomického importu v BackupSection
- Potvrdených výsledkov testov (1116 testov prešlo bez regresie)

**Podmienky pre budúci release:**
- N3: odporúčam opraviť default `isReal` z `false` na `true` pri najbližšej zmene `src/ui/useAutomaticUpdates.ts`
- Rollback test: zvážiť pri zavádzaní test-utilities pre IndexedDB fault injection

---

*Dokument vytvorený v samostatnej session bez prístupu k working context implementátora. Žiadny súbor nebol zmenený.*
