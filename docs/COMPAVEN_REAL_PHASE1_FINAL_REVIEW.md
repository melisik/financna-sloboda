# COMPAVEN REAL Phase 1 — Nezávislý bezpečnostný re-review

**Dátum auditu:** 2026-11-12  
**Vetva:** `recovery-test`  
**Posledný commit:** `41a8e7a` — docs: oprava stavových údajov v odovzdávacom dokumente  
**Reviewer:** Claude Sonnet 4.6 (nezávislý re-review)  
**Režim:** výhradne READ ONLY — žiadny súbor nebol zmenený

---

## 1. Rozsah auditu

Overenie opráv šiestich nálezov z predchádzajúceho NOT APPROVED review:

| ID | Typ | Popis |
|----|-----|-------|
| H01 | HIGH | `_performAtomicReplace` nemal REAL guard |
| H02 | HIGH | REAL security testy nevykonávali REAL vetvy |
| INTERNALS | — | Nesprávne tvrdenie o ochrane TypeScript `private` |
| M01 | MED | Chýbalo REAL upozornenie v `BackupSection.tsx` |
| M02 | MED | Mŕtvy kód v `BackupForm.tsx` |
| M03 | MED | `useAutomaticUpdates` nemal REAL guard |

---

## 2. Kontrolované súbory

| Súbor | Riadky | Dôvod kontroly |
|-------|--------|----------------|
| `src/storage/indexeddb.ts` | 1–622 | H01, H02, replaceAll/replaceAttachments guardy |
| `src/storage/repository.ts` | 1–70 | Interfejs, verejné metódy |
| `src/config/environment.ts` | 1–101 | Zdroj pravdy pre detekciu prostredia |
| `src/features/zaloha/BackupSection.tsx` | 1–280 | M01 |
| `src/compaven-ui/BackupForm.tsx` | 1–174 | M02 |
| `src/ui/useAutomaticUpdates.ts` | 1–57 | M03 |
| `src/compaven-ui/useAutomaticSnapshot.ts` | 1–130 | Test 6 referencia |
| `tests/phase1b-security.test.ts` | 1–566 | H02, INTERNALS |
| `vitest.config.ts` | 1–9 | H02 — konfigurácia prostredia |
| `package.json` | 1–40 | H02 — testovacie skripty |

---

## 3. Výsledok pôvodných nálezov

### H01 — `_performAtomicReplace` REAL guard

**Stav: OPRAVENÉ ✓**

Guard je prítomný priamo na začiatku metódy (`indexeddb.ts:529–531`):

```typescript
if (this.environment === "real") {
  throw new Error("❌ Priama hromadná náhrada je v REAL prostredí zakázaná...");
}
```

**Obídenie guardu nie je možné:**

- `this.environment` je nastavený pri konštrukcii z overeného `envConfig.env` (riadok 99).
- Jediný spôsob nastavenia `environment` je cez konštruktor, nie externú vlastnosť.
- Volanie cez `(repo as any)._performAtomicReplace(...)` stále narazí na runtime kontrolu `this.environment === "real"` — TypeScript `private` je len compile-time, guard je runtime.
- Obe verejné metódy (`replaceAllWithAttachments` a `replaceAllWithAttachmentsForRestore`) tiež hádžu pred delegovaním, ale guard v `_performAtomicReplace` je nezávislá poistka.
- `replaceAll` a `replaceAttachments` majú vlastné REAL guardy a nevolajú `_performAtomicReplace`.

**Všetky priame cesty k náhrade REAL dát sú blokované na úrovni metódy.**

---

### H02 — REAL testy nevykonávali REAL vetvy

**Stav: ČIASTOČNE OPRAVENÉ — zostatok rizika**

**Čo bolo opravené:**
- `vitest.config.ts` (riadok 7) správne preposiela `VITE_COMPAVEN_ENV` z procesu: `process.env.VITE_COMPAVEN_ENV ?? "sandbox"`.
- `package.json` obsahuje nové skripty `test:security-real` a `test:security-sandbox`.
- `tests/phase1b-security.test.ts` obsahuje testy s explicitnou vetvou pre REAL (`if (config.env === "real") { ... }`), nie iba triviálny `expect(true).toBe(true)`.
- Všetky testy používajú `fake-indexeddb/auto` — izolovanú falošnú IndexedDB; žiadna REAL databáza nie je dotknutá.

**Zostatok rizika — NEW FINDING N2:**

Skript `test:security-real` v `package.json` (riadok 15):
```
"test:security-real": "VITE_COMPAVEN_ENV=real vitest run tests/phase1b-security.test.ts"
```

Táto syntax `VITE_COMPAVEN_ENV=real` je **Unix-only**. Na Windows PowerShell (cieľová platforma projektu — `win32`, `PowerShell`) sa tento skript nespustí správne: prefix sa nevyhodnotí ako nastavenie env premennej, ale ako neznámy príkaz. `VITE_COMPAVEN_ENV` zostane `undefined`, vitest použije fallback `"sandbox"` a **všetky REAL vetvy budú triviálne preskočené cez `else { expect(true).toBe(true) }`**.

**Dôsledok:** Na tejto vývojovej platforme nie je možné spoľahlivo overiť REAL security vetvy testami.

**Štandardné `npm test` REAL vetvy nikdy netestuje** — všetky REAL podmienky padajú do `else { expect(true).toBe(true) }`. Toto je dizajnové rozhodnutie, ale znamená to, že REAL bezpečnosť nie je súčasťou štandardného CI.

---

### Test INTERNALS — TypeScript `private` a runtime ochrana

**Stav: OPRAVENÉ ✓**

Komentár v `tests/phase1b-security.test.ts:515–518` správne uvádza:

> TypeScript `private` je výlučne compile-time ochrana. Za behu (runtime) je `_performAtomicReplace` prístupná priamo cez pretypovanie. Tento test overuje, že REAL guard je implementovaný AJ v tejto internej metóde.

Test na riadku 528–530 overuje, že priame volanie `repoAny._performAtomicReplace(emptyData, [])` v REAL háže s chybou `/priama hromadná náhrada je v REAL prostredí zakázaná/i`.

Nesprávne tvrdenie o ochrane TypeScript `private` bolo odstránené.

---

### M01 — BackupSection.tsx: REAL upozornenie a ochrana

**Stav: OPRAVENÉ ✓ — s novým nálezom (pozri N1)**

**Overené:**
- **Viditeľnosť upozornenia:** `BackupSection.tsx:270–272` — blok `{isRealEnv && (<p>⚠️ {REAL_IMPORT_BLOCKED_MESSAGE}</p>)}` je prítomný v UI v sekcii preview.
- **Deaktivácia tlačidla:** Riadok 273 — `disabled={isRealEnv}` — tlačidlo „Nahradiť dáta zálohou" je vypnuté v REAL.
- **Ochrana handlera:** `confirmImport` (riadok 201–204) kontroluje `if (isRealEnv)` a vracia chybu pred akýmkoľvek zápisom.
- **Syntaktická a typová správnosť:** Súbor sa správne importuje z `../../storage/indexeddb` a používa konštantu `REAL_IMPORT_BLOCKED_MESSAGE` — Unicode úvodzovky nie sú problém (konštanta je v `indexeddb.ts`).

**Nový nález N1 (MEDIUM):** `confirmImport` je neatomická operácia (pozri sekciu 5).

---

### M02 — BackupForm.tsx: Mŕtvy kód

**Stav: OPRAVENÉ ✓ — s poznámkou**

`src/compaven-ui/BackupForm.tsx` existuje, importuje a používa `REAL_IMPORT_BLOCKED_MESSAGE`.  
REAL guard je prítomný na dvoch miestach:
- Riadok 49: `if (isRealEnv) { setError(REAL_IMPORT_BLOCKED_MESSAGE); return; }` — blokuje otvorenie súborového dialógu.
- Riadok 64: druhá poistka — ak je `handleImportFile` zavolaná bez kliknutia na tlačidlo.
- Riadok 142: `disabled={loading || isRealEnv}` — tlačidlo je vypnuté.

**Zostatok (nízka závažnosť):** Riadky 95–102 obsahujú podmienku `typeof repoAny.replaceAllWithAttachments === "function"` s fallback vetvou `replaceAll()`. Keďže `replaceAllWithAttachments` je súčasťou `Repository` interfejsu a vždy prítomná v `IdbRepository`, vetva `else` nikdy nevykoná. Ide o potenciálny zvyšok pôvodného mŕtveho kódu alebo novozavedený defenzívny kód; nie je bezpečnostne kritický.

---

### M03 — useAutomaticUpdates: REAL guard

**Stav: OPRAVENÉ ✓ — s poznámkou**

`src/ui/useAutomaticUpdates.ts:21–23`:

```typescript
let isReal = false;
try { isReal = getEnvironmentConfig().isRealEnv; } catch { /* starý prototyp */ }
if (isReal) return;
```

Guard je prítomný a funkčný. Ak `getEnvironmentConfig()` vráti `isRealEnv: true`, auto-aktualizácie sa nezapnú.

**Poznámka:** try/catch ticho prehltí výnimku ak `VITE_COMPAVEN_ENV` nie je nastavené (nová striktná konfigurácia hodí). V takom prípade `isReal` zostane `false` a auto-aktualizácie prebehnú. V praxi je táto situácia nepravdepodobná — ak env nie je nastavené, `openRepository()` tiež hodí výnimku a aplikácia sa neotvorí. Nová implementácia `useAutomaticSnapshot.ts` používa `!getEnvironmentConfig().isRealEnv` bez try/catch.

---

## 4. Výsledky vlastných testov

Testy neboli spúšťané (READ ONLY audit). Štruktúra testov bola overená staticky.

**Statická analýza `tests/phase1b-security.test.ts`:**

| Test | Sandbox vetva | REAL vetva | Poznámka |
|------|--------------|------------|----------|
| Test 1: DB name mismatch | ✓ aktivuje sa | ✗ Windows problém | SANDBOX priechod ✓ |
| Test 2: replaceAll REAL | ✓ trivially pass | ✗ Windows problém | REAL vetva neoveriteľná na Windows |
| Test 3: replaceAttachments REAL | ✓ trivially pass | ✗ Windows problém | REAL vetva neoveriteľná na Windows |
| Test 4: replaceAllWithAttachments REAL | ✓ trivially pass | ✗ Windows problém | REAL vetva neoveriteľná na Windows |
| Test 5: replaceAllWithAttachmentsForRestore REAL | ✓ trivially pass | ✗ Windows problém | REAL vetva neoveriteľná na Windows |
| Test 6: isAutoSnapshotEnabled SANDBOX=true | ✓ aktivuje sa | ✗ Windows problém | SANDBOX priechod ✓ |
| Test INTERNALS: _performAtomicReplace | ✓ SANDBOX priechod | ✗ Windows problém | Správna logika |
| Test BONUS: základné metódy existujú | ✓ vždy | ✓ vždy | Triviálna kontrola |

**Záver statickej analýzy:** Testy sú správne logicky štruktúrované. REAL vetvy sú kódom neoveriteľné pri štandardnom spustení na Windows.

---

## 5. Nové nálezy

### N1 — MEDIUM: BackupSection.confirmImport je neatomická operácia

**Súbor:** `src/features/zaloha/BackupSection.tsx:205–208`

```typescript
await repo.replaceAll(preview.data);
await repo.replaceAttachments(preview.attachments);
```

Tieto dve volania nie sú v jednej transakcii. Ak `replaceAll` uspeje, ale `replaceAttachments` zlyhá (napr. chyba IndexedDB), dáta budú nahradené zálohou, ale prílohy zostanú z pôvodného stavu — nekonzistentný stav.

**V REAL:** Obe metódy hádžu pred vykonaním — žiadne dáta nie sú dotknuté. Bezpečnostne nie je kritické.  
**V SANDBOX:** Riziko čiastočnej obnovy. Používateľ dostane chybu, ale databáza môže byť v nekonzistentnom stave.

**Odporúčanie:** Použiť `repo.replaceAllWithAttachments(preview.data, preview.attachments)` v jednej atomickej operácii, rovnako ako to robí `BackupForm.tsx`.

---

### N2 — MEDIUM: test:security-real nefunguje na Windows

**Súbor:** `package.json:15`

```
"test:security-real": "VITE_COMPAVEN_ENV=real vitest run tests/phase1b-security.test.ts"
```

Unix env syntax nie je kompatibilná s Windows PowerShell. Skript selhal by bez nastavenia prostredia, čo spôsobí fallback na `"sandbox"` a všetky REAL vetvy by boli triviálne preskočené.

**Dôsledok:** Na Windows (cieľová platforma projektu) nie je možné spustiť REAL security testy cez `npm run test:security-real`.

**Odporúčanie:** Použiť `cross-env` alebo PowerShell-kompatibilný skript: `cross-env VITE_COMPAVEN_ENV=real vitest run ...`

---

### N3 — LOW: useAutomaticUpdates try/catch ticho prehltí env chybu

**Súbor:** `src/ui/useAutomaticUpdates.ts:21–23`

Ak `VITE_COMPAVEN_ENV` nie je nastavené (nevalidný build), try/catch spôsobí, že `isReal` zostane `false` a auto-aktualizácie prebehnú. V praxi by nevalidný build zlyhol skôr v `openRepository`, ale ide o tichý bezpečnostný fallback.

---

### N4 — INFO: Stash nie je prázdny

**Tvrdenie implementátora:** prázdna stash položka.

**Skutočnosť (overená `git stash list`):**

```
stash@{0}: WIP on recovery-test: 41a8e7a docs: oprava stavových údajov v odovzdávacom dokumente
stash@{1}: On phase3-ux-base: phase3-ux-base-local-changes
stash@{2}: On phase3-ux-base: a1-e2e
stash@{3}: On phase3-ux-base: a1-e2e-compare
stash@{4}: On phase3-ux-base: compare-e2e-1
```

Stash obsahuje **5 položiek**, vrátane `stash@{0}` na aktuálnej vetve `recovery-test` s necommitnutými zmenami. Tvrdenie implementátora nezodpovedá skutočnosti. Bezpečnostný dopad: stash obsahuje kód; audit neoveroval jeho obsah.

---

## 6. Neoverené oblasti

| Oblasť | Dôvod neoveriteľnosti |
|--------|----------------------|
| Spustenie REAL security testov | Na Windows nefunguje `test:security-real` |
| Zlyhanie testov pri odstránení guardu | Vyžaduje zmenu kódu — zakázané |
| Runtime správanie v REAL browseri | Vyžaduje REAL build a pripojenie k REAL DB |
| Obsah stash@{0} | Nemenil sa working tree |

---

## 7. Zoznam rizík

| ID | Závažnosť | Popis |
|----|-----------|-------|
| R1 | MEDIUM | REAL security testy neoveriteľné na Windows (N2) — developerom chýba spätná väzba |
| R2 | MEDIUM | confirmImport neatomická operácia (N1) — SANDBOX dátová integrita |
| R3 | LOW | try/catch v useAutomaticUpdates ticho ignoruje chybné prostredie (N3) |
| R4 | INFO | Stash nie je prázdny — nezodpovedá tvrdeniu implementátora (N4) |

---

## 8. Záver

### Stav pôvodných nálezov

| ID | Stav |
|----|------|
| H01 | ✅ OPRAVENÉ |
| H02 | ⚠️ ČIASTOČNE OPRAVENÉ — Windows incompatibilita |
| INTERNALS | ✅ OPRAVENÉ |
| M01 | ✅ OPRAVENÉ (s novým N1) |
| M02 | ✅ OPRAVENÉ |
| M03 | ✅ OPRAVENÉ (s poznámkou N3) |

### Hodnotenie

Všetky bezpečnostné guardy v **produkčnom kóde** sú správne implementované:

- `_performAtomicReplace` je chránená na všetkých úrovniach (H01).
- REAL prostredie blokuje `replaceAll`, `replaceAttachments`, `replaceAllWithAttachments` a `replaceAllWithAttachmentsForRestore`.
- `BackupSection` aj `BackupForm` zobrazujú upozornenie a blokujú tlačidlá v REAL.
- `useAutomaticUpdates` aj `useAutomaticSnapshot` obsahujú REAL guard.

Zostatok z H02 (Windows incompatibilita `test:security-real`) a nový nález N1 (neatomický import v BackupSection) neohrozujú REAL bezpečnosť, ale predstavujú riziká pre testovateľnosť a dátovú integritu v SANDBOX.

---

## **VERDICT: APPROVED WITH MINOR FINDINGS**

Produkčný bezpečnostný kód je správny. Odporúčam pred ďalším release opraviť N1 (neatomický import) a N2 (Windows incompatibilita test skriptu).
