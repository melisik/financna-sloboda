# COMPAVEN — Centrálny riadiaci dokument (Master Plan)

**Verzia:** 1.0  
**Dátum:** 2026-11-13  
**Stav:** AKTÍVNY — jediný autoritatívny prehľad projektu  
**Základná vetva:** `recovery-test`, HEAD `41a8e7a`  
**Zostavil:** Claude Sonnet 4.6 (nezávislá syntéza zo zdrojových dokumentov)

> **Pravidlo tohto dokumentu:** Každý oddiel opisuje stav overený priamo z kódu alebo dokumentácie. Predpoklady sú označené [PREDPOKLAD]. Tento dokument nie je nadradený `decisions/Decisions.md` — záväzné sú záznamy D-xxx. Ak nastane rozpor, `decisions/Decisions.md` vyhráva.

---

## A. Manažérske zhrnutie

### Čo je COMPAVEN

COMPAVEN je lokálne-first webová aplikácia na sledovanie a projekciu osobnej finančnej slobody (FIRE — Financial Independence, Retire Early). Beží v prehliadači bez servera, bez účtu, bez odosielania dát. Dáta sú v IndexedDB lokálneho prehliadača. Záloha je exportovateľný súbor.

Projekt má dva aktívne vstupné body v jednom repozitári:
- **Legacy „Finančná sloboda"** — `index.html` → `src/ui/` (starší prototyp, nemenný)
- **COMPAVEN 2.0** — `src/compaven.html` → `src/compaven-ui/` (aktívny vývoj)

Oba zdieľajú doménovú vrstvu (`src/domain/`) a úložisko (`src/storage/`).

### Cieľ V3 (COMPAVEN 2.0 target)

Deterministický nástroj na rozhodovanie o finančnej slobode s:
- jedným výpočtovým motorom (`goalMonths` z `goal.ts`, `capital.ts`, `rentalGoal.ts`)
- jedným slovníkom definícií (`m`, `K_FIRE`, `K_nem`, `K_total`, `T`)
- garantovanou izoláciou REAL/SANDBOX prostredia
- šifrovanou, obnoviteľnou zálohou (.cvb formát, AES-256-GCM)

### Hotovo

| Oblasť | Stav |
|--------|------|
| Výpočtové jadro domény (centy, golden cases, property testy) | ✅ HOTOVO |
| Environment centralizácia (`src/config/environment.ts`) | ✅ HOTOVO |
| REAL ochrana úložiska (4 vrstvy, defense-in-depth) | ✅ HOTOVO |
| Atomický import zálohy (jedna transakcia, 20 úložísk) | ✅ HOTOVO |
| Windows-kompatibilné REAL security testy | ✅ HOTOVO |
| Nezávislý bezpečnostný audit REAL Phase 1 | ✅ APPROVED WITH MINOR FINDINGS |
| Unit testy 1116/1116 prechádzajú | ✅ HOTOVO |
| TypeScript kontrola bez chýb | ✅ HOTOVO |

### Blokujúce problémy (pred ďalším vývojom)

| ID | Problém | Priorita |
|----|---------|----------|
| FN-01 | Nástenka nepoužíva FIRE motor — zobrazuje dvojnásobne dlhší čas | KRITICKÁ |
| A-02 | 17 vetiev, 20 commitov nepushnutých, 203 nesledovaných súborov | KRITICKÁ |
| FN-02 | Symbol `m` má tri rôzne definície v kóde | KRITICKÁ |
| A-03 | Finančné výpočty priamo v UI komponentoch, žiadne testy | KRITICKÁ |
| F-02–F-04 | Záloha môže byť neobnoviteľná (nové polia bez migrácie) | VYSOKÁ |

---

## B. Aktuálny stav projektu

### B.1 Prostredie a databázy

| Parameter | Hodnota |
|-----------|---------|
| Autoritatívny zdroj prostredia | `VITE_COMPAVEN_ENV` (build-time) |
| REAL databáza | `compaven-2.0-real` |
| SANDBOX databáza | `compaven-2.0-sandbox` |
| Konfiguračný súbor | `src/config/environment.ts` |
| Fallback | `throw Error` — nevalidný build havaruje pri štarte |

### B.2 Git stav (k 2026-11-13)

| Parameter | Hodnota |
|-----------|---------|
| Vetva | `recovery-test` |
| Posledný commit | `41a8e7a` (docs: oprava stavových údajov) |
| Necommitnuté zmeny | 44 M, 1 D (pracovný strom) |
| Nesledované súbory | 203+ (vrátane `vitest.config.real.ts`, `docs/`) |
| Stash | 5 položiek — NEMAŽ (`stash@{0}` = recovery-test, `stash@{1–4}` = phase3-ux-base) |
| Lokálny main vs. origin/main | `origin/main` je 466 commitov vpred [podľa auditu 2026-11-12] |

> ⚠️ Všetky opravy Phase 1 sú v pracovnom strome, **nie commitnuté**. Commitovanie je krokom Phase 0.

### B.3 Záloha a obnova

| Stav | Detail |
|------|--------|
| Export zálohy (sandbox) | ✅ funguje (`BackupSection.tsx`, `repo.exportBackup()`) |
| Import zálohy (sandbox) | ✅ funguje, atomický (jedna transakcia) |
| Import zálohy (REAL) | ⛔ blokovaný na 4 vrstvách |
| Šifrovaný .cvb formát | 📋 NAVRHNUTÝ v `docs/38_`, **NIČ neimplementované** |
| SHA256 integrita | 📋 NAVRHNUTÝ, **NIČ neimplementované** |
| Verziovaná záloha (PHASE 1B.2) | 📋 NAVRHNUTÝ, **NIČ neimplementované** |

### B.4 Bezpečnosť

| Vrstva | Stav |
|--------|------|
| Environment guard (UI) | ✅ `isRealEnv` → tlačidlo disabled |
| Handler guard (UI) | ✅ `confirmImport` → `setErrors([REAL_IMPORT_BLOCKED_MESSAGE]); return` |
| Verejná metóda guard | ✅ `replaceAllWithAttachments` → `throw` pred zmenami |
| Interná metóda guard | ✅ `_performAtomicReplace` → `throw` (obrana do hĺbky) |
| Auto-snapshot isolation (REAL) | ✅ `useAutomaticUpdates.ts:21-23` (try/catch, LOW riziko — viď N3) |
| XSS / CSP | ⛔ NERIEŠENÉ (nález F-06) |
| PIN zamykanie | ⛔ NERIEŠENÉ |

### B.5 Testovanie

| Sada | Príkaz | Výsledok (2026-11-13) |
|------|--------|-----------------------|
| Celá unit sada | `npm test` | 1116/1116 ✅ |
| REAL security | `npm run test:security-real` | 20/20 ✅ |
| SANDBOX security | `npm run test:security-sandbox` | 20/20 ✅ |
| TypeScript | `npx tsc --noEmit` | 0 chýb ✅ |
| E2E (COMPAVEN 2.0) | — | ⛔ 0 testov |
| Dashboard výpočty | — | ⛔ 0 testov (FN-01 je nezachytený) |

### B.6 UI a nasadenie

| Stav | Detail |
|------|--------|
| Cloudflare Pages (produkcia) | ⛔ Žiadny projekt pre COMPAVEN 2.0 |
| Vite build | `build:real` a `build:sandbox` skripty existujú |
| Standalone V3 URL | ⛔ Nedefinované |
| Legacy ochrana pri deploymente | ⛔ Nedefinované |

---

## C. Schválené architektonické rozhodnutia

Tieto rozhodnutia sú overené priamo v kóde a dokumentácii. Pre implementované rozhodnutia platia ako záväzné pravidlá projektu.

| ID | Rozhodnutie | Stav | Zdroj |
|----|-------------|------|-------|
| AD-01 | `VITE_COMPAVEN_ENV` je jediný autoritatívny zdroj prostredia; URL parametre a localStorage sú len diagnostika | ✅ IMPLEMENTOVANÉ | `src/config/environment.ts` |
| AD-02 | Každé prostredie má samostatnú databázu: `compaven-2.0-real` a `compaven-2.0-sandbox` | ✅ IMPLEMENTOVANÉ | `src/config/environment.ts:42-45` |
| AD-03 | REAL ochrana má minimálne 4 vrstvy (UI disabled → handler guard → verejná metóda → interná metóda); každá vrstva háže/vracia samostatne | ✅ IMPLEMENTOVANÉ | `BackupSection.tsx`, `indexeddb.ts` |
| AD-04 | Import zálohy je vždy atomický: jedna IndexedDB `readwrite` transakcia pokrývajúca všetkých 20 úložísk; `tx.abort()` pri chybe | ✅ IMPLEMENTOVANÉ | `indexeddb.ts:526-585` |
| AD-05 | Všetky testy bežia s `fake-indexeddb` bez prístupu k reálnej IndexedDB prehliadača | ✅ IMPLEMENTOVANÉ | `vitest.config.ts`, `tests/setup.ts` |
| AD-06 | REAL security testy musia byť spustiteľné cross-platform (Windows aj Unix) pomocou `vitest.config.real.ts` s hardkódovanou `env: { VITE_COMPAVEN_ENV: "real" }` | ✅ IMPLEMENTOVANÉ | `vitest.config.real.ts` |
| AD-07 | `src/ui/` (legacy) je chránený adresár; v rámci práce na COMPAVEN 2.0 sa nesmie meniť | ✅ ZÁVÄZNÉ | `CLAUDE.md` Pravidlo 9 |
| AD-08 | COMPAVEN 2.0 (`src/compaven-ui/`) je oddelená aplikácia; legacy (`src/ui/`) ostáva nezmenená ako izolovaný prototyp | ✅ IMPLEMENTOVANÉ | `vite.config.ts` |
| AD-09 | Osobné finančné dáta (skutočné transakcie, zostatky, účty) nepatria do repozitára, ani do lokálnych commitov; testy používajú len syntetické alebo anonymizované dáta | ✅ ZÁVÄZNÉ | `CLAUDE.md` |
| AD-10 | URL parameter `env` musí súhlasiť s build-time konfiguráciou; nesúlad je `FATAL` chyba pri štarte | ✅ IMPLEMENTOVANÉ | `src/config/environment.ts:69-90` |
| AD-11 | Auto-snapshot sa v REAL prostredí nespustí; guard je v `useAutomaticUpdates.ts` s dokumentovaným LOW rizikom (N3) | ✅ IMPLEMENTOVANÉ (N3 DOKUMENTOVANÉ) | `src/ui/useAutomaticUpdates.ts:21-23` |
| AD-12 | Každé záväzné rozhodnutie projektu má záznam D-xxx v `decisions/Decisions.md`; iteratívne dokumenty nie sú zdrojom pravdy | ✅ ZÁVÄZNÉ | `CLAUDE.md`, `docs/COMPAVEN_2_STRATEGIC_REVIEW.md` A-10 |

---

## D. REAL Phase 1 — Bezpečnostný audit

**Výsledok:** ✅ **APPROVED WITH MINOR FINDINGS**  
**Dátum schválenia:** 2026-11-13  
**Schválil:** Nezávislý reviewer (oddelená session)  
**Schvaľovací dokument:** `docs/COMPAVEN_REAL_PHASE1_FINAL_APPROVAL.md`

### Vyriešené nálezy

| ID | Nález | Stav |
|----|-------|------|
| N1 | `BackupSection.confirmImport` volal dve oddelené transakcie (neatomický import) | ✅ OPRAVENÉ |
| N2 | `test:security-real` používal Unix syntax, nefungoval na Windows | ✅ OPRAVENÉ |
| N4 | Stav git stash (5 položiek) | ✅ ZAZNAMENANÉ |

### Zostávajúci nález

| ID | Nález | Závažnosť | Stav |
|----|-------|-----------|------|
| N3 | `useAutomaticUpdates.ts:114` — `try/catch` ticho prehltne `VITE_COMPAVEN_ENV` chybu; `isReal` zostane `false` pri nevalidnom builde | LOW | ⛔ BLOCKED (Pravidlo AD-07) |

**Odporúčanie pre budúci release:** Zmeniť `let isReal = false` na `let isReal = true` — fail-safe default, ktorý blokuje auto-aktualizácie pri nedeterminovanom prostredí.

---

## E. Implementačné fázy

### Prehľad

| Fáza | Názov | Stav |
|------|-------|------|
| Phase 0 | Stabilizácia | 🔄 IN PROGRESS |
| Phase 1 | REAL ochrana | ✅ HOTOVO S MENŠÍMI NÁLEZMI |
| Phase 2 | Oprava FIRE motora a definícií | 📋 NOT STARTED |
| Phase 3 | Bezpečný prístup k dátam | 📋 NOT STARTED |
| Phase 4 | Kompletná REAL/SANDBOX izolácia | 🔄 ČIASTOČNE HOTOVO |
| Phase 5 | Šifrovaná záloha a obnova | 📋 NOT STARTED |
| Phase 6 | Bezpečnostný audit V3 | 📋 NOT STARTED |
| Phase 7 | Build a nasadenie | 📋 NOT STARTED |

---

### Phase 0 — Stabilizácia

**Cieľ:** Uviesť repozitár do stavu, kde jeden commit na jednej vetve reprezentuje overený stav projektu.

**Stav:** 🔄 IN PROGRESS

| ID | Úloha | Popis | Závislosť | Akceptačné kritérium | Testy | Schválenie | Stav |
|----|-------|-------|-----------|----------------------|-------|------------|------|
| P0-T1 | Commit Phase 1 opráv | Commitovať všetky necommitnuté zmeny pracovného stromu na `recovery-test` | — | `git status` čistý; všetky 203+ nesledovaných súborov commitnuté alebo v `.gitignore` | `npm test` 1116/1116 po commite | Zakladateľ | ⏳ PENDING |
| P0-T2 | Push na origin | Pushnutie `recovery-test` na GitHub | P0-T1 | `git status` synchronizovaný s origin | — | Zakladateľ | ⏳ PENDING |
| P0-T3 | Stratégia jednej aktívnej vetvy | Rozhodnutie o osude 17 lokálnych vetiev (archivovať / zmazať / zlúčiť) | P0-T2 | Maximálne 2 lokálne vetvy (main + aktívna vetva funkcie) | — | Zakladateľ | ⏳ PENDING |
| P0-T4 | Register rozhodnutí | Zapísať chýbajúce D-337 až D-345 alebo vysvetliť medzeru | P0-T2 | `decisions/Decisions.md` bez číselnej medzery | — | Zakladateľ | ⏳ PENDING |

**Zakázané akcie v Phase 0:**
- `git stash drop`, `git stash clear` — 5 stash položiek sa nesmú stratiť
- `git reset --hard` — bez potvrdenia zakladateľa
- `git push --force` na `main`

---

### Phase 1 — REAL ochrana

**Cieľ:** Garantovať, že REAL databáza nikdy neprijme import zálohy a že testy overujú REAL vetvy na každej platforme.

**Stav:** ✅ HOTOVO S MENŠÍMI NÁLEZMI (nález N3 zostáva dokumentovaný)

Podrobnosti v `docs/COMPAVEN_REAL_PHASE1_FINAL_APPROVAL.md`.

---

### Phase 2 — Oprava FIRE motora a definícií

**Cieľ:** Všetky zobrazené čísla pochádzajú z jedného výpočtového motora; `m` má jednu definíciu; FN-01, FN-02 sú opravené.

**Stav:** 📋 NOT STARTED

**Závislosť:** Phase 0 (commitnutý čistý repozitár)

| ID | Úloha | Popis | Akceptačné kritérium | Testy |
|----|-------|-------|----------------------|-------|
| P2-T1 | Definícia `m` v Decisions | Zakladateľ schváli jednu definíciu `m`; záznam D-xxx | Jedno rozhodnutie, žiadna iná implementácia | Nový test INV-12 (rovnaká hodnota na všetkých obrazovkách) |
| P2-T2 | Opravi FN-01 — nástenka a FIRE motor | `Dashboard.tsx` musí volať `goalMonths()` z `goal.ts`, nie vlastný `estimatedMonths` | TS-02: T=648 649 €, K=100 000, m=1 000, r=3,5 % → ≈278,8 mes. na nástenke aj v Scenároch | Test `Dashboard` (prvý test pre `compaven-ui/Dashboard`) |
| P2-T3 | Aplikačná funkcia `computeDashboard` | Všetky čísla nástenky vráti jedna funkcia; UI len formátuje | Žiadny výpočet v JSX; test pokryje `computeDashboard` | Unit test `computeDashboard` s golden cases |
| P2-T4 | Opravi FN-09 — deterministický výber snapshotu | `context.ts:40` — sort podľa (dátum, ručné pred automatickým, createdAt) | TS-08: pri rovnakom dátume vždy ručné | Test TS-08 |
| P2-T5 | INV-24 — UI nezobrazuje predvolené konštanty ako dáta | `Dashboard.tsx:19`: `ctx.target || 1000000` → ak nastavenia chýbajú, skryť cieľ | TS-03: bez nastavení → žiadna cieľová suma na nástenke | Test TS-03 |

**Zakázané v Phase 2:** Zmeny v `src/ui/`, nové funkcie mimo rozsahu FN-01/FN-02.

---

### Phase 3 — Bezpečný prístup k dátam

**Cieľ:** Záloha je vždy obnoviteľná; dvojité započítanie odstránené; migračný rámec existuje.

**Stav:** 📋 NOT STARTED

**Závislosť:** Phase 2

| ID | Úloha | Popis | Akceptačné kritérium | Testy |
|----|-------|-------|----------------------|-------|
| P3-T1 | Opravi F-05 — dvojité započítanie v auto-snapshot | `buildCompleteSnapshot` nesmie počítať to isté ako `autoEvaluation.ts` | TS-01: výdavok 1 000 € sa v K zobrazí práve raz | Test TS-01 |
| P3-T2 | Migračný rámec zálohy | Migrácie ako čisté `vN → vN+1` funkcie; nové polia musia byť v migrácii | Záloha zo schémy v18 je obnoviteľná na v20 | Test TS-16 (export → import = identita) |
| P3-T3 | Opravi F-02, F-04 — neobnoviteľná záloha | `validate.ts` prijíma nové polia; migrácia pokrýva všetky historické verzie | INV-23: záloha → obnova je identita | Regresné testy pre každú historickú schémy verziu |
| P3-T4 | INV-22 — NaN/Infinity sa nikdy neuložia | Validácia pri zápise aj importe | TS-17: prázdny limit rozpočtu → odmietnuté | Testy F-17 |

---

### Phase 4 — Kompletná REAL/SANDBOX izolácia

**Cieľ:** REAL a SANDBOX nezdieľajú dáta ani UI na úrovni domén.

**Stav:** 🔄 ČIASTOČNE HOTOVO

| ID | Úloha | Popis | Stav | Závislosť |
|----|-------|-------|------|-----------|
| P4-T1 | Izolácia DB názvom | `compaven-2.0-real` / `compaven-2.0-sandbox` | ✅ HOTOVO | — |
| P4-T2 | Auto-snapshot isolation | REAL guard v `useAutomaticUpdates.ts` (N3) | ✅ HOTOVO (dokumentované LOW riziko) | — |
| P4-T3 | PHASE 1B.2 — verziovaná záloha | SHA256 integrita, verzia v názve súboru | 📋 NOT STARTED | Phase 3 |
| P4-T4 | Izolácia originom (Cloudflare Pages) | REAL a SANDBOX bežia na oddelených subdoménach | 📋 NOT STARTED | Phase 7 (deployment) |

---

### Phase 5 — Šifrovaná záloha a obnova

**Cieľ:** Záloha je šifrovaná (AES-256-GCM), chránená heslom, obnoviteľná na novom zariadení.

**Stav:** 📋 NOT STARTED — architektúra navrhnutá v `docs/38_`, nič neimplementované

**Závislosť:** Phase 3 (obnoviteľná záloha)

| ID | Úloha | Popis | Akceptačné kritérium | Schválenie |
|----|-------|-------|----------------------|------------|
| P5-T1 | Schválenie architektúry .cvb | Zakladateľ schváli formát `.cvb`, šifru AES-256-GCM, deriváciu kľúča | D-xxx záznam | Zakladateľ |
| P5-T2 | Implementácia exportu `.cvb` | Šifrovaný export; metadata `exportedAt`, `schemaVersion`, SHA256 | Súbor `.cvb` overiteľný na referenčnom dekryptore | Unit testy |
| P5-T3 | Implementácia importu `.cvb` | Dešifrovanie, overenie integrity, migrácia schémy, atomický import | TS-16 s `.cvb` formátom | Unit + integračné testy |
| P5-T4 | Pre-restore záloha | Pred importom automaticky zálohovať aktuálny stav | Pri zlyhaní importu je predchádzajúci stav obnoviteľný | Test zlyhaného importu |

---

### Phase 6 — Bezpečnostný audit V3

**Cieľ:** XSS odstránené, CSP nastavené, PIN zamykanie implementované.

**Stav:** 📋 NOT STARTED

**Závislosť:** Phase 5

| ID | Úloha | Popis | Akceptačné kritérium | Schválenie |
|----|-------|-------|----------------------|------------|
| P6-T1 | Opravi F-06 — XSS | Všetky `dangerouslySetInnerHTML` a priame DOM manipulácie preskúmané a opravené | Žiadne XSS vektory identifikované nezávislým reviewom | Nezávislý reviewer |
| P6-T2 | CSP hlavičky | Content Security Policy v Cloudflare Pages konfig | Prehliadač blokuje inline skripty z externých zdrojov | — |
| P6-T3 | PIN zamykanie | Implementácia zamykania aplikácie PINom | Aplikácia nezdieľa dáta po zamknutí | Unit + E2E testy |
| P6-T4 | Nezávislý bezpečnostný audit V3 | Rovnaký formát ako Phase 1: nezávislá session, samostatný dokument | APPROVED alebo APPROVED WITH MINOR FINDINGS | Nezávislý reviewer |

---

### Phase 7 — Build a nasadenie

**Cieľ:** COMPAVEN 2.0 beží na vlastnom Cloudflare Pages projekte, oddelene od legacy.

**Stav:** 📋 NOT STARTED

**Závislosť:** Phase 6 (bezpečnostný audit V3 APPROVED)

| ID | Úloha | Popis | Akceptačné kritérium | Schválenie |
|----|-------|-------|----------------------|------------|
| P7-T1 | Nový Cloudflare Pages projekt | `compaven-v3.pages.dev` (alebo iná doména); oddelený od legacy projektu | COMPAVEN 2.0 build dostupný na vlastnej URL | Zakladateľ |
| P7-T2 | Build overenie SANDBOX | `npm run build:sandbox` bez chýb; dist-sandbox nasadený na testovaciu URL | Plná funkčnosť SANDBOX na URL | Zakladateľ |
| P7-T3 | Build overenie REAL | `npm run build:real` bez chýb; kontrola REAL guards | REAL import nedostupný; databáza `compaven-2.0-real` | Zakladateľ |
| P7-T4 | Nasadenie produkcia (REAL) | Explicitné schválenie zakladateľa pred akýmkoľvek REAL deploymentom | Schvaľovací dokument podpísaný zakladateľom | **Výhradne zakladateľ** |
| P7-T5 | Ochrana legacy (index.html) | Legacy ostáva na pôvodnej URL; COMPAVEN 2.0 na novej URL | Žiadna kolízia medzi vstupnými bodmi | Zakladateľ |

---

## F. Architektúra zálohy a obnovy

### F.1 Aktuálny stav (implementovaný)

```
Používateľ → BackupSection.tsx
  → isRealEnv? → ⛔ blokované (UI + handler + verejná metóda + interná metóda)
  → repo.exportBackup() → JSON.stringify(AppData) → .cvb (nešifrované v súčasnosti)

Obnova (SANDBOX):
  Používateľ vyberie súbor → parseBackup() → replaceAllWithAttachments()
    → jedna IDB readwrite transakcia (20 úložísk)
    → tx.abort() pri chybe → atomický rollback
```

### F.2 Cieľový stav (Phase 5 — navrhnutý, nie schválený)

```
Export SANDBOX/REAL:
  AppData + Attachments
    → JSON serialize
    → AES-256-GCM encrypt (kľúč z PBKDF2 hesla)
    → SHA256 integrity hash
    → .cvb binary container
    → {version, schemaVersion, exportedAt, salt, iv, ciphertext, hmac}

Import SANDBOX (REAL blokovaný):
  .cvb file
    → validácia formátu + HMAC
    → dešifrovanie (heslo od používateľa)
    → validácia schémy
    → migrácia vN → vCurrent
    → pre-restore záloha aktuálneho stavu
    → replaceAllWithAttachments() [atomická transakcia]
```

### F.3 Záväzné invarianty zálohy

| Invariant | Pravidlo |
|-----------|---------|
| INV-23 | Záloha → obnova je identita pre všetky používateľské kolekcie (okrem `exportedAt`) |
| AD-03 | REAL import je blokovaný na 4 vrstvách; nikdy sa neobíde |
| AD-04 | Import je vždy atomický; čiastočný import je neprípustný |
| — | Záloha nikdy neobsahuje osobné dáta iných používateľov |

---

## G. Plán nasadenia

### G.1 Princípy

1. **REAL nasadenie vyžaduje výhradne schválenie zakladateľa** — žiadny automatický deploy
2. **COMPAVEN 2.0 má vlastný Cloudflare Pages projekt** — oddelený od legacy `financna-sloboda`
3. **REAL a SANDBOX sú oddelené buildmi a URL** — nie prepínačom v runtime

### G.2 Plánovaná topológia (Phase 7)

| Aplikácia | URL (plánovaná) | Build | Stav |
|-----------|-----------------|-------|------|
| COMPAVEN 2.0 SANDBOX | `sandbox.compaven-v3.pages.dev` | `build:sandbox` | 📋 NOT STARTED |
| COMPAVEN 2.0 REAL | `app.compaven-v3.pages.dev` | `build:real` | 📋 NOT STARTED |
| Legacy „Finančná sloboda" | (existujúca URL) | (existujúci build) | ✅ EXISTUJE |

### G.3 Zakázané akcie pri deploymente

- `git push --force` na produkčnú vetvu
- Deployment REAL bez písomného schválenia zakladateľa
- Nasadenie kódu, ktorý neprešiel Phase 6 bezpečnostným auditom
- Zmena Cloudflare konfigurácie bez záznamu v rozhodnutiach

---

## H. Riadenie projektu

### H.1 Statusy úloh

| Status | Popis |
|--------|-------|
| ✅ HOTOVO | Implementované, testované, zdokumentované |
| ✅ HOTOVO S MENŠÍMI NÁLEZMI | Implementované a schválené; zostávajúce nálezy dokumentované |
| 🔄 IN PROGRESS | Aktívna práca, čiastočne hotové |
| ⏳ PENDING | Čaká na predchádzajúcu závislosť alebo schválenie |
| 📋 NOT STARTED | Naplánované, nič neimplementované |
| ⛔ BLOCKED | Blokované externým pravidlom alebo rozhodnutím |
| 🗑️ ZRUŠENÉ | Zrušené rozhodnutím zakladateľa |

### H.2 Pravidlá procesu

1. **Jedna aktívna úloha** — maximálne jedna implementačná úloha súčasne; nová úloha začína až po dokončení predchádzajúcej
2. **Rozhodnutia = D-xxx** — každé záväzné rozhodnutie musí byť v `decisions/Decisions.md`; iteratívne dokumenty nie sú zdrojom pravdy (AD-12)
3. **Nezávislý reviewer** — každá bezpečnostná fáza vyžaduje review v samostatnej session (nie v tej, kde sa dokument písal)
4. **Pred zmenou `git pull`** — každá AI session začína synchronizáciou s remote
5. **Zakázané akcie bez schválenia zakladateľa** — REAL deployment, destructive git operácie, zmena Cloudflare konfigurácie, inštalácia nových závislostí

### H.3 Otvorsné otázky (vyžadujú rozhodnutie zakladateľa)

| ID | Otázka |
|----|--------|
| O-01 | Definícia `m` — sporenie alebo voľný tok? (FN-02) |
| O-02 | Osud legacy `src/ui/` — archív / zachovanie / deprecation? |
| O-03 | Stratégia zlučovania 17 vetiev (priorita Phase 0) |
| O-04 | Cieľová doména pre COMPAVEN 2.0 (Phase 7) |
| O-05 | Heslo na `.cvb` zálohu — zdieľané / per-device / iné (Phase 5)? |
| O-06 | Záväzky spotrebiteľských úverov v K_total? (FN-12, INV-01) |

---

## I. Nasledujúca akcia

### I.1 Aktuálna fáza: Phase 0 — Stabilizácia

**Aktívna úloha:** P0-T1 — Commit Phase 1 opráv na `recovery-test`

**Popis:**  
Všetky zmeny pracovného stromu (Phase 1A environment centralizácia, Phase 1B REAL guards, N1 fix, N2 fix, nové testy, dokumenty) sú necommitnuté. Pred akýmkoľvek ďalším vývojom musia byť commitnuté a pushnuté.

**Príkaz (po schválení zakladateľom):**
```bash
git add <konkrétne súbory — nie git add -A bez kontroly>
git commit -m "feat(compaven): REAL Phase 1 security remediations (N1, N2) + environment config"
git push origin recovery-test
```

**Pred commitom overiť:**
- `npm test` → 1116/1116
- `npx tsc --noEmit` → 0 chýb
- Žiadne osobné finančné dáta v staged súboroch

**Závislosť:** Schválenie zakladateľa (Phase 0 pravidlo)

### I.2 Zakázané pred Phase 0

- Spustiť Phase 2 (FIRE motor) pred commitnutím Phase 1 opráv
- Meniť kód domény alebo UI
- `git stash drop` / `git stash clear`
- REAL deployment v akomkoľvek stave

### I.3 Čo Phase 0 odomkne

Po úspešnom P0-T1 a P0-T2 môže začať Phase 2 (FN-01 — oprava nástenky; najvyššia produktová priorita).

---

## Zdroje

| Dokument | Obsah |
|----------|-------|
| `decisions/Decisions.md` | Záväzné rozhodnutia D-001 až D-346+ |
| `docs/COMPAVEN_2_STRATEGIC_REVIEW.md` | Architektonický a finančný audit (FN-01–12, A-01–12, INV-01–25) |
| `docs/COMPAVEN_REAL_PHASE1_FINAL_APPROVAL.md` | Schválenie bezpečnostného auditu Phase 1 |
| `docs/COMPAVEN_REAL_PHASE1_REMEDIATION.md` | Popis opráv N1, N2, N3 |
| `docs/COMPAVEN_2_FINAL_AUDIT_AND_HANDOVER.md` | Stav projektu k 2026-11-12 |
| `src/config/environment.ts` | Autoritatívna konfigurácia prostredia |
| `src/storage/indexeddb.ts` | REAL guards, atomický import |
| `src/features/zaloha/BackupSection.tsx` | UI vrstva zálohy a obnovy |
| `vitest.config.real.ts` | REAL test konfigurácia (Windows-kompatibilná) |
