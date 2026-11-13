# COMPAVEN REAL Phase 1 — Final Remediation Report

**Dátum:** 2026-11-12  
**Vetva:** `recovery-test`  
**Posledný commit pred opravami:** `41a8e7a`  
**Implementátor:** Claude Sonnet 4.6  
**Základný audit:** `docs/COMPAVEN_REAL_PHASE1_FINAL_REVIEW.md`

---

## Prehľad úloh

| ID | Popis | Stav |
|----|-------|------|
| N1 | Atomický import v BackupSection.confirmImport | ✅ FIXED |
| N2 | Windows kompatibilita test:security-real | ✅ FIXED |
| N3 | useAutomaticUpdates try/catch ticho ignoruje env chybu | ⛔ BLOCKED |
| N4 | Stav git stash (dokumentácia, read-only) | ✅ ZAZNAMENANÉ |

---

## N1 — Atomický import v BackupSection

### Problém

`BackupSection.confirmImport` volal dve oddelené metódy úložiska:

```typescript
await repo.replaceAll(preview.data);       // IDB transakcia 1
await repo.replaceAttachments(preview.attachments);  // IDB transakcia 2
```

Pri zlyhaní druhého volania by databáza zostala v nekonzistentnom stave (dáta nahradené, prílohy z pôvodnej zálohy).

### Overenie metódy pred zmenou

Metóda `replaceAllWithAttachments` (`src/storage/indexeddb.ts:506–514`):
- Má REAL guard: hádže pred vykonaním akýchkoľvek zmien.
- Volá `_performAtomicReplace` s 20 úložiskami v jednej IndexedDB transakcii.
- `_performAtomicReplace` má vlastný nezávislý REAL guard (obrana do hĺbky).
- Pri výnimke zavolá `tx.abort()` — celá transakcia sa vráti späť.
- Neobrchádza environment guardy.

### Zmena

**Súbor:** `src/features/zaloha/BackupSection.tsx`

```diff
-  await repo.replaceAll(preview.data);
-  await repo.replaceAttachments(preview.attachments);
+  await repo.replaceAllWithAttachments(preview.data, preview.attachments);
```

REAL guard (`if (isRealEnv)`) zostal v `confirmImport` nezmenený — operácia je dvojnásobne chránená.

---

## N2 — Windows kompatibilita REAL security testov

### Problém

```json
"test:security-real": "VITE_COMPAVEN_ENV=real vitest run tests/phase1b-security.test.ts"
```

Unix syntax `KEY=value cmd` nefunguje v Windows PowerShell. `VITE_COMPAVEN_ENV` sa nenastavilo, testy bežali v SANDBOX a všetky REAL vetvy boli triviálne preskočené.

### Riešenie bez novej závislosti

Vytvorený nový konfiguračný súbor `vitest.config.real.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: { VITE_COMPAVEN_ENV: "real" },
  },
});
```

Hodnota `VITE_COMPAVEN_ENV: "real"` je natvrdo v konfiguračnom súbore — vitest ju načíta platformovo-nezávisle.

Aktualizovaný `package.json`:

```diff
-"test:security-real": "VITE_COMPAVEN_ENV=real vitest run tests/phase1b-security.test.ts",
+"test:security-real": "vitest run --config vitest.config.real.ts tests/phase1b-security.test.ts",
```

`test:security-sandbox` zostal nezmenený (fungoval správne).

**Zmenené súbory:**
- `vitest.config.real.ts` — nový súbor
- `package.json` — aktualizovaný skript

---

## N3 — BLOCKED: useAutomaticUpdates try/catch

### Dôvod blokovania

Súbor `src/ui/useAutomaticUpdates.ts` sa nachádza v adresári `src/ui/`, ktorý je pravidlom 9 chránený:

> „Nemeň legacy `src/ui`."

Opravu nie je možné vykonať bez porušenia záväzného pravidla.

### Zostatok rizika

```typescript
let isReal = false;
try { isReal = getEnvironmentConfig().isRealEnv; } catch { /* starý prototyp */ }
if (isReal) return;
```

Ak `VITE_COMPAVEN_ENV` nie je nastavené (nevalidný build), výnimka je ticho prehltnutá, `isReal` zostane `false` a auto-aktualizácie prebehnú. V praxi by nevalidný build zlyhol pri `openRepository()` ešte pred týmto hoekom.

**Odporúčanie pre budúci release:** Zmeniť fail-safe default na `let isReal = true;` — ak prostredie nie je určiteľné, auto-aktualizácie sa nezapnú.

---

## N4 — Git stash (read-only dokumentácia)

Stav k 2026-11-12:

```
stash@{0}: WIP on recovery-test: 41a8e7a
stash@{1}: On phase3-ux-base: phase3-ux-base-local-changes
stash@{2}: On phase3-ux-base: a1-e2e
stash@{3}: On phase3-ux-base: a1-e2e-compare
stash@{4}: On phase3-ux-base: compare-e2e-1
```

**Počet:** 5 položiek.  
`stash@{0}` je na aktuálnej vetve `recovery-test` a obsahuje necommitnuté zmeny.  
`stash@{1–4}` sú na vetve `phase3-ux-base`.

Žiadna položka nebola zmenená ani vymazaná.

---

## Nové testy (ATOMIC-1)

Pridané 3 testy do `tests/phase1b-security.test.ts` v novej skupine `Test ATOMIC-1`:

| Test | Prostredie | Čo overuje |
|------|------------|------------|
| SANDBOX: zapíše dáta aj prílohy naraz | SANDBOX | `replaceAllWithAttachments` uloží transakciu aj prílohu v jednom volaní |
| SANDBOX: vymaže predchádzajúce dáta aj prílohy | SANDBOX | Stará príloha a transakcia sú vymazané atomicky |
| REAL: háže pred vykonaním akýchkoľvek zmien | REAL | REAL guard blokuje pred akoukoľvek zmenou databázy |

---

## Výsledky testov

### 1. TypeScript kontrola

```
Príkaz: npx tsc --noEmit
Exit code: 0
Výstup: (žiadny)
```

✅ Bez chýb.

### 2. REAL security testy

```
Príkaz: npm run test:security-real
  → vitest run --config vitest.config.real.ts tests/phase1b-security.test.ts
Exit code: 0
Test Files: 1 passed (1)
Tests:      20 passed (20)
Preskočené: 0
Duration:   466ms
```

✅ REAL vetvy boli skutočne aktivované (VITE_COMPAVEN_ENV=real cez vitest.config.real.ts).

### 3. SANDBOX security testy

```
Príkaz: npm run test:security-sandbox
  → vitest run tests/phase1b-security.test.ts
Exit code: 0
Test Files: 1 passed (1)
Tests:      20 passed (20)
Preskočené: 0
Duration:   346ms
```

✅ SANDBOX vetvy aktivované.

### 4. Celá SANDBOX testovacia sada

```
Príkaz: npm test
  → vitest run
Exit code: 0
Test Files: 140 passed (140)
Tests:      1116 passed (1116)
Preskočené: 0
Duration:   24.36s
```

✅ Žiadna regresia. Nové ATOMIC-1 testy sú zahrnuté.

### 5. Nové testy atomického importu

Súčasťou `tests/phase1b-security.test.ts` (Test ATOMIC-1):  
- Spustené v rámci SANDBOX security testov (20 testov) aj celej sady (1116 testov).  
- Všetky prešli bez zlyhaní.

Poznámka k rollbacku: Skutočný rollback by vyžadoval injektovanie chyby do stredu IndexedDB transakcie, čo je v prostredí `fake-indexeddb` bez mockovania neoveriteľné. Atomicita je garantovaná implementáciou `_performAtomicReplace` — všetky operácie sú v jednej `readwrite` transakcii s `tx.abort()` pri výnimke.

---

## Zhrnutie zmenených súborov

| Súbor | Typ zmeny | Súvisiaci nález |
|-------|-----------|-----------------|
| `src/features/zaloha/BackupSection.tsx` | Upravený | N1 |
| `vitest.config.real.ts` | Nový | N2 |
| `package.json` | Upravený | N2 |
| `tests/phase1b-security.test.ts` | Rozšírený | ATOMIC-1 testy |
| `docs/COMPAVEN_REAL_PHASE1_REMEDIATION.md` | Nový | Tento report |

---

## Zostávajúce riziká

| ID | Závažnosť | Popis | Akcia |
|----|-----------|-------|-------|
| N3 | LOW | `useAutomaticUpdates` try/catch ticho ignoruje env chybu | BLOCKED (pravidlo 9: nemeň `src/ui/`) |
| N4 | INFO | `stash@{0}` na `recovery-test` obsahuje necommitnuté zmeny | Nič nemaž — len informácia |

---

## Záver

> **Toto nie je záverečné schválenie. Schválenie patrí nezávislému reviewerovi v samostatnej session.**

| Nález | Stav |
|-------|------|
| N1 (neatomický import) | ✅ FIXED |
| N2 (Windows test kompatibilita) | ✅ FIXED |
| N3 (try/catch v useAutomaticUpdates) | ⛔ BLOCKED |
| N4 (stash dokumentácia) | ✅ ZAZNAMENANÉ |
