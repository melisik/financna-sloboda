# COMPAVEN 2.0 — Záverečný audit a odovzdanie

- **Dátum auditu:** 2026-11-12
- **Repozitár / worktree:** `C:\Users\Firefly G8\compaven-scenario-worktrees\phase3-ux-redesign`
- **Vetva:** `recovery-test` (HEAD `000f970`)
- **Režim:** výhradne READ ONLY. Počas auditu sa žiadny súbor v repozitári nezmenil, Git staging je nedotknutý. Spustené boli len nedeštruktívne kontroly: `tsc --noEmit` a `vitest run` (fake-indexeddb v Node, bez prístupu k reálnym dátam v prehliadači). `vite build` (zapisuje do `dist/`) ani Playwright sa nespúšťali.
- **Umiestnenie:** dokument vznikol mimo repozitára a na pokyn zakladateľa (2026-11-12) bol skopírovaný do `docs/COMPAVEN_2_FINAL_AUDIT_AND_HANDOVER.md` a commitnutý na vetvu `recovery-test` (nepushnuté).

### Legenda stavov

| Stav | Význam |
|---|---|
| NAVRHNUTÉ | Existuje len návrh v texte alebo v konverzácii, nie kód. |
| IMPLEMENTOVANÉ | Kód existuje v pracovnom strome (nemusí byť commitnutý ani otestovaný). |
| OTESTOVANÉ | Automatické testy pre túto časť sa skutočne spustia a prejdú. |
| OVERENÉ | Overené v bežiacej aplikácii. |
| HOTOVÉ | Implementované, otestované, commitnuté a zapísané v `decisions/Decisions.md`. |
| NEOVERENÉ | Nedalo sa overiť z kódu ani testov. |
| NEURČENÉ | Pôvod zmeny sa nedá spoľahlivo určiť. |

---

## 1. Executive summary

1. **COMPAVEN 2.0 nie je pripravený na používanie s REAL dátami.** Ochrany PHASE 1A/1B sú čiastočne implementované, ale záloha a obnova majú tri chyby, ktoré vedú k nenávratnej strate alebo k neobnoviteľnej zálohe (osobné ciele, prílohy, polia potvrdení v nastaveniach).
2. **PHASE 1A premenovala databázy bez migrácie:** pôvodne `compaven-2.0` / `compaven-2.0-test`, teraz `compaven-2.0-real` / `compaven-2.0-sandbox`. Ak niekto má REAL dáta v `compaven-2.0`, nová zostava ich neuvidí (nie sú zmazané, sú „osirelé“). NEOVERENÉ, či také dáta existujú.
3. **Potvrdená chyba dvojitého započítania v aktívnom kóde:** automatické mesačné vyhodnotenie s dátumom konca minulého mesiaca obsahuje aj transakcie z aktuálneho mesiaca a ledger ich potom pripočíta znova (`src/app/snapshotBuilder.ts:25-35`). Netestované.
4. **Bezpečnosť:** reflektované XSS cez parameter `?env=` v `src/compaven.tsx` (vkladanie cez `innerHTML`), `src/compaven.html` nemá CSP. COMPAVEN 2.0 nemá PIN ani šifrovanú zálohu.
5. **Build a testy:** `tsc` má 1 chybu (v teste), takže `npm run build` zlyhá už na kroku `tsc`. `vitest`: 65 z 1087 testov zlyhá; so `VITE_COMPAVEN_ENV=sandbox` 55 z 1087. Všetky zlyhania sú infraštruktúrne (prostredie, názov DB), nie finančné asercie, ale **všetky testy úložiska sa momentálne nespustia** — vrstva úložiska vrátane zmien PHASE 1B je neotestovaná. Pre COMPAVEN 2.0 neexistuje žiadny E2E test.
6. **Legacy aplikácia (index.html, „Finančná sloboda“) je na tejto vetve nefunkčná:** `src/ui/App.tsx:62` volá `openRepository()` s menom `financna-sloboda`, ktoré nová kontrola odmietne.
7. **Rozsiahla necommitnutá práca:** 44 zmenených, 1 zmazaný a 203 nesledovaných súborov (z toho 19 zdrojových súborov a 24 testov, vrátane celého `environment.ts` a `backupDb.ts`), 18 lokálnych commitov nepushnutých. PHASE 1A/1B nie sú zapísané v `decisions/Decisions.md`.
8. **PHASE 1B.2 (verziovanie `_dbVersion`, SHA256, úplná záloha) je len NAVRHNUTÁ.** Architektonický smer je technicky správny a s `idb` 8.0.4 realizovateľný; nič z neho nie je implementované.
9. **Odporúčanie:** zastaviť ďalšie funkcie. Najprv zabezpečiť rozpracovanú prácu v Gite (po schválení), potom P0 opravy dátovej bezpečnosti a testovacej infraštruktúry, až potom verziovanie a REAL nasadenie.

---

## 2. Aktuálny stav Git a projektu

### 2.1 Git (overené príkazmi 2026-11-12)

| Položka | Hodnota |
|---|---|
| Vetva | `recovery-test` |
| HEAD | `000f970b8aaf2d8aa274c346d5d1aa5c7ac6418c` — „feat(financial-goals): Phase 3.1 — K0 Field and Custom Delete Dialog“ |
| Upstream | `origin/recovery-test`: **18 commitov pred**, 0 za |
| Staged | 0 súborov |
| Modified (M) | 44 |
| Deleted (D) | 1 — `tests/personalGoal-phase4-integration.test.ts` (commitnutý v `f0acf61`; dôvod zmazania NEURČENÝ) |
| Untracked (??) | 203 (127 `.md` v koreni, 37 v `docs/`, 19 v `src/`, 24 v `tests/`, ďalšie) |
| `main` | lokálne `4375a41`, 466 commitov za `origin/main` |
| Release báza M1 | `m1-release-preparation` (`e695806`), DB `financna-sloboda`, `DB_VERSION` 12 |

Poznámka: v koreni je chybne pomenovaný súbor `C:UsersFIREFL~1AppDataLocalTempclaude0f4a…scratchpadtest-worker-logic.md` (pozostatok staršej relácie). Nemazať bez súhlasu.

### 2.2 Pôvod zmien

| Skupina | Súbory | Stav v Gite |
|---|---|---|
| Commitnuté (18 lokálnych commitov) | Etapa 1 (K_nem, K_total, K_FIRE, Dashboard, PropertyForm), Household, finančné ciele fázy 1–3.1 | commit, nepushnuté |
| **PHASE 1A** | `src/config/environment.ts` (??), `src/compaven.tsx` (M), `src/compaven-ui/TestModeIndicator.tsx` (M), časť `src/compaven-ui/App.tsx` (M), `tests/configuration.test.ts` (??), `src/compaven-test.tsx`/`.html` (??) | necommitnuté |
| **PHASE 1B** | `src/storage/backupDb.ts` (??), časť `src/storage/indexeddb.ts` (M), `src/storage/repository.ts` (M), `src/compaven-ui/BackupForm.tsx` (M), `src/features/zamok/Lock.tsx` (M, legacy), `tests/phase1b-security.test.ts` (??) | necommitnuté |
| Ostatné novšie (OPRAVA B, BLOK 1–5, plánovanie, príjmy, UI) | `src/app/snapshotBuilder.ts`, `snapshotValidator.ts`, `src/compaven-ui/useAutomaticSnapshot.ts`, `PlanningPage`, `ScenarioPanel`, `BudgetPanel`, `HistoriaAnalytics`, `IncomeForm`, `TransactionTabs/List`, `LiabilitySection`, `src/utils/currency.ts`, `src/domain/{historiaAnalytics,monthlyInvestmentScenario,planningEstimates}.ts`, zmeny v `ledger.ts`, `monthlyCashFlow.ts`, `annualOverview.ts`, `personalGoal.ts`, `entities.ts`, väčšina testov | necommitnuté |
| NEURČENÉ | zmazanie `tests/personalGoal-phase4-integration.test.ts`; zmiešané súbory (`indexeddb.ts` = PHASE 1B + OPRAVA B; `App.tsx` = PHASE 1A + OPRAVA B + UI) | — |

### 2.3 Build a testy (skutočne spustené)

| Kontrola | Výsledok |
|---|---|
| `tsc -p tsconfig.json --noEmit` | **1 chyba**: `tests/phase1b-security.test.ts(115,23)` — objekt `Settings` s neexistujúcimi poliami (`currency`, `budgeted`, `id`, `version`). Keďže `npm run build` = `tsc && vite build`, **build zlyhá**. |
| `vitest run` (bez env) | 138 súborov: 13 zlyhalo / 125 prešlo; **1087 testov: 65 zlyhalo / 1022 prešlo**. 59× „VITE_COMPAVEN_ENV is not set“, 1× očakávaná iná chyba, zvyšok v `configuration.test.ts` (príčina pravdepodobne prostredie, NEOVERENÉ v detaile). |
| `VITE_COMPAVEN_ENV=sandbox vitest run` | 12 súborov zlyhalo; **55 / 1087 zlyhalo**: 52× „Database name mismatch“ (testy používajú izolované názvy DB, PHASE 1A ich zakazuje), 3× „indexedDB is not defined“ (`phase1b-security.test.ts` nenačíta fake-indexeddb). Žiadna finančná asercia nezlyhala. |
| Nespúšťajúce sa testové súbory (sandbox) | `storage.test.ts`, `storage-personalgoals.test.ts`, `snapshot-atomic-property.test.ts`, `snapshot-atomic-invalidation.test.ts`, `snapshot-b5-integration.test.ts`, `snapshot-stale-state.test.ts`, `manual-snapshot.test.ts`, `income-storage-integration.test.ts`, `attachments-migration.test.ts`, `shopping.test.ts`, `stock-waste.test.ts`, `phase1b-security.test.ts` |
| `vite build` | NEOVERENÉ (nespustené, zapisuje do `dist/`) |
| Playwright E2E (114 spec) | NEOVERENÉ (nespustené). Všetky cielia na legacy `index.html`; webServer buildí bez `VITE_COMPAVEN_ENV`, takže sa očakáva hromadné zlyhanie. **0 E2E testov pre `compaven.html`.** |

Rozpor s predchádzajúcimi reportmi: skoršie tvrdenie „build prešiel (376 ms, 421 ms)“ sa týkalo len `vite build` alebo stavu pred pridaním testu; plný `npm run build` dnes neprejde.

### 2.4 Štruktúra

- `src/compaven-ui/` — aktívna aplikácia COMPAVEN 2.0 (`src/compaven.html` → `src/compaven.tsx` → `CompavenApp`).
- `src/ui/`, `src/features/` — legacy „Finančná sloboda“ (`index.html` → `src/ui/main.tsx`). COMPAVEN z nich zdieľa `features/rocny-prehlad`, `ui/kit/*` a `ui/ErrorBoundary`.
- `src/domain/` — čisté výpočty; `src/app/` — vyhodnotenia; `src/storage/` — IndexedDB, záloha, validácia; `src/config/` — prostredie.
- Obe aplikácie zdieľajú `src/storage/indexeddb.ts`, preto zmena PHASE 1A rozbila legacy aplikáciu.
- Nasadenie: `pages.yml` (len `main`, GitHub Pages, bez `VITE_COMPAVEN_ENV`), `preview-phase2.yml` (Cloudflare Pages `financna-sloboda-preview` s heslom, D-271). **Pre REAL/SANDBOX COMPAVEN 2.0 v repozitári neexistuje žiadne nasadenie.**

---

## 3. Register rozpracovaných procesov

### A. Cloud a prostredia

| Proces | Stav | Dôkazy | Otvorené problémy | Riziko | Ďalší krok | Závislosti |
|---|---|---|---|---|---|---|
| PHASE 0 audit | NEOVERENÉ | žiadny dokument „PHASE 0“ nenájdený podľa názvu | — | nízke | potvrdiť, ktorý dokument je PHASE 0 | — |
| PHASE 1A centralizácia prostredia | ČIASTOČNE HOTOVÉ (IMPLEMENTOVANÉ, neotestované, necommitnuté) | `src/config/environment.ts:21-90`, `indexeddb.ts:15-26`, `App.tsx:36-42` | premenovanie DB bez migrácie (F-01), XSS (F-06), rozbité testy (F-09) a legacy (F-10), env nikde nenastavené | **kritické** | rozhodnúť názov REAL DB; opraviť zobrazenie chyby; testovací režim kontroly názvu | rozhodnutie zakladateľa |
| PHASE 1B ochrana REAL | ČIASTOČNE HOTOVÉ | `indexeddb.ts:180-190, 440-516`, `backupDb.ts`, `BackupForm.tsx:84-135` | neúplná záloha (F-02, F-03, F-04), bez checksumu, bez obnovy zo zálohy v UI, obíditeľné `backupId` | **kritické** | P0 opravy zálohy | PHASE 1A |
| PHASE 1B.2 verziovanie a integrita | NAVRHNUTÉ (smer schválený, nič neimplementované) | tento dokument, oddiel 4.3 | — | vysoké | implementovať po P0 | P0 |
| Rozdelenie REAL/SANDBOX | IMPLEMENTOVANÉ na úrovni názvu DB | `environment.ts:42-45` | oddelenie originov (samostatné domény) NEOVERENÉ; `compaven-2.0-real-backups` je dostupná z rovnakého originu | stredné | definovať nasadenie na 2 originoch | cloud rozhodnutie |
| Cloudflare Pages projekty pre COMPAVEN | NAVRHNUTÉ / NEOVERENÉ | v repozitári žiadny workflow ani `wrangler` konfigurácia | — | stredné | rozhodnúť a pripraviť workflow s `VITE_COMPAVEN_ENV` | rozhodnutie |
| Cloudflare Access | ZAMIETNUTÉ (D-271) | `decisions/Decisions.md` D-270, D-271 | Access vyžaduje platobnú kartu; použitá Basic Auth cez Pages Functions | — | ak treba ochranu REAL, rovnaký mechanizmus ako D-271 | — |
| Plán cloudu a synchronizácie | NAVRHNUTÉ, v rozpore | `docs/technicka-analyza-internet-2026-11-08.md` (nesledovaný) odporúča Vercel + Supabase; rozhodnutia smerujú ku Cloudflare | žiadne rozhodnutie | nízke (teraz) | odložiť na P4 | P0–P2 |

### B. Finančné jadro

| Proces | Stav | Dôkazy | Otvorené problémy | Riziko | Ďalší krok |
|---|---|---|---|---|---|
| K_FIRE = K_inv + K_cash | IMPLEMENTOVANÉ, OTESTOVANÉ (unit) | `context.ts:57`, `capital.ts:28-30`, `buildCompleteSnapshot.test.ts` | nafúknutie cez F-05 | vysoké | opraviť F-05 |
| K_total = K_inv + K_cash + K_nem | IMPLEMENTOVANÉ, OTESTOVANÉ | `context.ts:76`, `snapshotBuilder.ts:42-43` | ignoruje záväzky (F-15) | stredné | rozhodnutie |
| K_nem (vlastné bývanie + prenájom) | IMPLEMENTOVANÉ | `property.ts:5-7`, `context.ts:53-54` | oddelenie vlastného bývania a investičných nehnuteľností sa v K_nem nerozlišuje (všetky spolu) | stredné | rozhodnúť, či zobrazovať rozpis |
| Hypotéky | IMPLEMENTOVANÉ (legacy D-347 aj COMPAVEN) | `property.ts`, `mortgage-last-payment.test.ts` | v COMPAVEN `m` sa splátka započíta len ak je zadaná ako transakcia | stredné | F-16 |
| Príjmy, výdavky, cash flow (`m`) | IMPLEMENTOVANÉ, odlišné od D-346 | `monthlyCashFlow.ts` | F-16 | vysoké | rozhodnutie |
| Investície a sporenie | IMPLEMENTOVANÉ, OTESTOVANÉ | `ledger.ts:47-90`, `capital.ts`, `invariants.property.test.ts` | — | nízke | — |
| Plánované vs. skutočné | IMPLEMENTOVANÉ | `ledger.ts:12-22, 106-121` | UTC vs. lokálny dátum (F-18) | stredné | zjednotiť `today` |
| Prenájmy | IMPLEMENTOVANÉ v legacy (D-346); v COMPAVEN `m` ignorované | `householdBalance.ts`, `monthlyCashFlow.ts` | F-16 | stredné | rozhodnutie |
| Snapshoty a história | IMPLEMENTOVANÉ (D-116) | `snapshotBuilder.ts`, `useAutomaticSnapshot.ts`, `historiaAnalytics.ts` | **F-05 dvojité započítanie**; auto snapshot ticho blokovaný bez potvrdení | **kritické** | P0 |
| FIRE výpočty a scenáre | IMPLEMENTOVANÉ | `capital.ts:39-64`, `rentalGoal.ts:99-112`, `ScenarioPanel.tsx` (??) | scenáre nesledované v Gite | stredné | commit + testy |
| Plánovanie a rozpočty | IMPLEMENTOVANÉ (nesledované) | `PlanningPage.tsx`, `BudgetPanel.tsx`, `planningEstimates.ts` | rozpočet môže uložiť NaN/≤0 (F-17) | stredné | validácia pri zápise |
| Sklad a nákupy | legacy; COMPAVEN UI ich nemá | `discardStock` (`indexeddb.ts:378-384`) | — | nízke | — |

### C. Používateľské funkcie (COMPAVEN 2.0)

| Funkcia | Stav | Dôkaz | Poznámka |
|---|---|---|---|
| Dashboard | IMPLEMENTOVANÉ (commit + zmeny) | `Dashboard.tsx` | pokrok cez K_FIRE; ovplyvnený F-05 |
| Finančný prehľad / Ročný prehľad | IMPLEMENTOVANÉ (zdieľané z legacy) | `features/rocny-prehlad`, `annualOverview.ts` | „K“ v ročnom prehľade = K_FIRE (bez K_nem) |
| Plánovanie | IMPLEMENTOVANÉ, nesledované | `PlanningPage.tsx` | |
| Scenáre | IMPLEMENTOVANÉ, nesledované | `ScenarioPanel.tsx` | |
| Osobné ciele | IMPLEMENTOVANÉ (commit fázy 1–3.1 + zmeny) | `PersonalGoals*.tsx`, `personalGoal.ts` | **nezálohujú sa (F-02)** |
| Domácnosť | IMPLEMENTOVANÉ | `HouseholdForm.tsx`, `PersonForm.tsx` | default osoba sa tvorí pri prázdnej DB (`App.tsx:47-72`) |
| Nehnuteľnosti | IMPLEMENTOVANÉ | `PropertySection.tsx` | každé uloženie zruší potvrdenia |
| Majetok a záväzky | čiastočne: záväzky len zobrazenie + potvrdenie | `LiabilitySection.tsx` | v COMPAVEN sa záväzky nedajú pridať (len importom) |
| Prílohy | NEIMPLEMENTOVANÉ v COMPAVEN UI | — | dostanú sa sem len importom; potom sa strácajú (F-03) |
| Nastavenia | IMPLEMENTOVANÉ | `SettingsForm.tsx` | |
| Záloha a obnova | ČIASTOČNE HOTOVÉ, nebezpečné | `BackupForm.tsx` | F-02, F-03, F-04, F-21 |
| História / analytika | IMPLEMENTOVANÉ, nesledované | `HistoriaAnalytics.tsx` | používa uložené polia snapshotov (správne) |
| PIN / zámok | NEIMPLEMENTOVANÉ v COMPAVEN | len legacy `Lock.tsx` | |

### D. Technická architektúra

| Oblasť | Stav | Hlavný problém |
|---|---|---|
| IndexedDB | 22 Object Stores, `DB_VERSION` 14 | 21 používateľských úložísk, ale obnova pokrýva 20 a čítanie 20 (rôzne podmnožiny) |
| Repository vrstva | jediná vrstva zápisu do hlavnej DB (overené grepom) | 48 zapisovacích metód, 32 bez explicitnej transakcie, žiadne verziovanie |
| Migrácie | lineárne v1→v14 | v12 `calendarObligations` bez akéhokoľvek zapisovača |
| Typy | `AppData.calendarObligations?: any[]` | slabý typ; `repo as any` v `BackupForm`/`Lock` obchádza typy zbytočne |
| Stav aplikácie | `App.tsx` (370 riadkov) drží všetko | god component |
| Testy | 1087 unit, 114 E2E (legacy) | úložisko neotestované; COMPAVEN bez E2E |
| Build/deploy | `npm run build` zlyhá; žiadny deploy COMPAVEN | |
| Výkon | `useAutomaticSnapshot` beží pri každom renderi | F-20 |
| Bezpečnosť | XSS, bez CSP, bez PIN, bez šifrovania | F-06 |

---

## 4. Výsledky PHASE 1A, PHASE 1B a PHASE 1B.2

### 4.1 PHASE 1A

| Kontrola | Výsledok | Dôkaz |
|---|---|---|
| Jediný zdroj prostredia `VITE_COMPAVEN_ENV` | ✓ | `environment.ts:21-57` |
| Neznáme/chýbajúce prostredie | ✓ vyhodí FATAL (žiadny fallback na SANDBOX) | `environment.ts:25-39` |
| Mapovanie | ✓ `real → compaven-2.0-real`, `sandbox → compaven-2.0-sandbox` | `environment.ts:42-45` |
| Kontrola URL `?env=` | ✓ porovná a vyhodí chybu; **✗ chyba sa vykreslí cez `innerHTML` s hodnotou z URL → XSS** | `environment.ts:63-80`, `compaven.tsx:15-24` |
| localStorage nie je autorita | ✓ len diagnostický marker | `environment.ts:86-90` |
| Všetky otvorenia IndexedDB | `openRepository` (`indexeddb.ts:15`), `openBackupDb` (`backupDb.ts:19`). Iné `openDB`/`deleteDatabase` v `src/` nie sú. | grep |
| Iný spôsob výberu DB | legacy `src/ui/App.tsx:62` `openRepository()` → `financna-sloboda` → **vyhodí chybu (legacy rozbitá)**; `compaven-test.tsx` má natvrdo `isSandboxMode = true` (dev entry, nie je v build vstupoch) | |
| Zámena prostredí za behu | ✓ nemožná (build-time) | |
| **Migrácia existujúcich dát** | **✗ chýba**: `HEAD:src/compaven-ui/App.tsx:27` používal `compaven-2.0` / `compaven-2.0-test` | F-01 |
| Konfigurácia prostredia v repozitári/CI | **✗** žiadny `.env*`, workflows ho nenastavujú | F-10 |
| Testovateľnosť | **✗** prísna kontrola mena zakazuje izolované testovacie DB (52 zlyhaní) | F-09 |

**Stav PHASE 1A: ČIASTOČNE HOTOVÉ.** Implementované, neotestované, necommitnuté, nezapísané v rozhodnutiach.

### 4.2 PHASE 1B

| Kontrola | Výsledok | Dôkaz |
|---|---|---|
| `replaceAll()` v REAL | ✓ vyhodí chybu | `indexeddb.ts:440-444` |
| `replaceAttachments()` v REAL | ✓ vyhodí chybu | `indexeddb.ts:180-184` |
| `replaceAllWithAttachments()` v REAL | ✓ vyhodí chybu | `indexeddb.ts:495-499` |
| `replaceAllWithAttachmentsForRestore()` | ⚠ verejná metóda rozhrania; v REAL kontroluje len **existenciu** záznamu s daným `backupId`, nie jeho obsah, vek ani súvis s aktuálnymi dátami. Akékoľvek staré ID (napr. z `getAllBackups()`) kontrolu prejde. | `repository.ts:62`, `indexeddb.ts:505-516`, `backupDb.ts:56-60` |
| Automatická záloha pred obnovou v REAL | ⚠ vytvorí sa, ale: z React stavu `data` (nie čerstvé čítanie DB); **bez príloh** (`attachmentsJson = "[]"`); **bez `personalGoals`**; bez `calendarObligations`; bez checksumu | `BackupForm.tsx:85-116` |
| Databáza záloh | ✓ samostatná `compaven-2.0-real-backups` | `backupDb.ts:4-33` |
| Integrita záloh | **✗** `checksum` neexistuje, `verifyBackupIntegrity()` neexistuje (overené grepom) | `backupDb.ts:7-14` |
| Obnova zo zálohy v databáze záloh | **✗** UI ani kód na obnovu z `compaven-2.0-real-backups` neexistuje; zálohy sa len zapisujú | grep |
| Retencia záloh | **✗** žiadna; každá záloha až do ~100 MB, databáza rastie bez limitu | |
| Prílohy | **✗** export COMPAVEN aj auto-záloha ich vynechávajú, obnova ich zmaže | `BackupForm.tsx:26, 92`, `indexeddb.ts:544` |
| Aktívne cesty resetu/importu v COMPAVEN | jediná: `BackupForm.handleImportFile`. `Lock.tsx` a `BackupSection.tsx` sú legacy (nepoužité v `compaven-ui`). | grep |
| Obídenie ochrany REAL | Hromadné operácie nie (vyhodia chybu). Možné: (a) volanie `replaceAllWithAttachmentsForRestore` s ľubovoľným existujúcim ID, (b) mazanie po jednej položke (bežné operácie, zámerne nepovolené blokovať), (c) zmazanie dát prehliadača používateľom (mimo aplikácie). | |
| Používateľ je informovaný | **✗** potvrdenie ukazuje len počet transakcií a vyhodnotení; neupozorní, že osobné ciele a prílohy budú zmazané | `BackupForm.tsx:74-82` |

**Stav PHASE 1B: ČIASTOČNE HOTOVÉ.** Bloky hromadných operácií fungujú (neotestované); záloha je neúplná a neobnoviteľná.

### 4.3 PHASE 1B.2 — posúdenie návrhu `runVersionedWrite()`

**Čo je schválený architektonický smer** (podľa pokynu zakladateľa):
- Každý zápis do používateľských Object Stores zvýši `_dbVersion` v tej istej IndexedDB transakcii.
- Obnova REAL: zachytiť verziu → záloha → overenie → jedna readwrite transakcia nad všetkými používateľskými úložiskami a `meta` → kontrola verzie → abort alebo úplná náhrada → zvýšenie verzie v tej istej transakcii.

**Čo nie je implementované:** nič z toho. `_dbVersion`, `runVersionedWrite`, checksum, `verifyBackupIntegrity`, zahrnutie `personalGoals`/`calendarObligations` do zálohy, zlúčenie `deleteProperty` — všetko len NAVRHNUTÉ.

**Technické posúdenie:**

| Bod | Záver |
|---|---|
| Kompatibilita s `idb` 8.0.4 | ✓ `db.transaction(names[], "readwrite", { durability })`, `tx.objectStore()`, `tx.done`, `tx.abort()` sa už v kóde používajú. |
| Kľúčové obmedzenie | Callback nesmie čakať na nič okrem IDB požiadaviek (žiadne `crypto.subtle`, `fetch`, časovače). Inak sa transakcia automaticky uzavrie (`TransactionInactiveError`). SHA256 sa počíta pred alebo po transakcii. |
| Izolácia | IndexedDB serializuje readwrite transakcie s prekrývajúcim sa rozsahom. Ak má **každý** zápis v rozsahu `meta`, žiadna iná karta nemôže zapísať medzi čítaním verzie a commitom obnovy. Dnes to neplatí — `meta` nie je v rozsahu žiadneho zápisu. |
| Prechodné obdobie (staré karty) | Karta so starým kódom zapisuje bez zvýšenia verzie a garanciu by porušila. **Odporúčanie:** zvýšiť `DB_VERSION` na 15 a pridať `db.onversionchange = () => { db.close(); /* výzva na obnovenie */ }`, aby sa staré spojenia musela zavrieť. |
| Formát `_dbVersion` | **Odporúčanie:** `meta["_dbVersion"]` = desiatkový reťazec nezáporného celého čísla (`"0"`, `"1"`…), chýbajúci = `"0"`. Je to v súlade s `getMeta(): Promise<string \| null>` a existujúcimi kľúčmi (`pin`, `lastExportAt`, pokusy o PIN). **Nepoužívať** objekt `{ value: "N" }` z predchádzajúceho návrhu — ten bol nekonzistentný (porovnával objekt s reťazcom). `setMeta` má odmietať kľúče začínajúce `_`. |
| Systémové vs. používateľské zápisy | Zvyšujú verziu: všetkých 48 metód nad používateľskými úložiskami (vrátane `invalidateConfirmations`, `addSnapshot`, `savePerson`). Nezvyšujú: `setMeta` (`pin`, `lastExportAt`, pokusy o PIN) a databáza záloh. |
| Poradie obnovy (11 krokov) | Bezpečné, ak sa verzia zachytí **pred** čítaním dát (zmena medzitým spôsobí len falošný abort, nie stratu). Lepšie: verzia + všetky úložiská + prílohy v **jednej readonly transakcii**. Opačné poradie (dáta pred verziou) by umožnilo stratiť zápis. |
| Konzistentné čítanie | `getData()` číta 20 úložísk v jednej readonly transakcii (✓), ale **bez `attachments` a `meta`**. Pre zálohu treba nové čítanie vrátane oboch. |
| SHA256 | Kanonický JSON (stabilné poradie kľúčov) nad dátami + záznamami príloh (base64 cez `encodeAttachment`), mimo transakcie. Overenie: znovu načítať z DB záloh, prepočítať, porovnať, a **suchý `parseBackup`** (round-trip), aby záloha bola skutočne obnoviteľná. |
| Trvanlivosť | Pre transakciu obnovy použiť `{ durability: "strict" }`. |
| `deleteProperty()` | Jedna readwrite transakcia nad `properties`, `attachments`, `meta`: `get` → `delete` → kurzor cez index `rentalEntryId` → zvýšenie verzie. |
| Garancia ochrany pred súbežnými zápismi | **Áno, v rámci jedného prehliadača a originu**, ak (1) všetky zápisy idú cez verziovanú vrstvu, (2) nie sú otvorené staré verzie kódu, (3) callbacky nečakajú na ne-IDB operácie. **Nie** medzi zariadeniami (neexistuje synchronizácia) ani proti vymazaniu dát prehliadača. |
| Výkon | +2 IDB požiadavky na zápis a serializácia všetkých zápisov (spoločné `meta`). Pre jedného používateľa zanedbateľné — NEOVERENÉ meraním. |
| Vynútenie | Test, ktorý pre každú verejnú zapisovaciu metódu `Repository` overí zvýšenie verzie; test/lint, ktorý v `indexeddb.ts` zakáže `this.db.put/add/delete` mimo verziovanej vrstvy. |

**Presný rozsah zmien zápisov (overené v `indexeddb.ts`):** 48 verejných metód nad používateľskými dátami + `setMeta` (systém) + privátne `_performAtomicReplace`.
- 32 metód so samostatným implicitným zápisom (`this.db.put/delete`) — prepísať na verziovanú vrstvu.
- 15 metód už v explicitnej transakcii (13 priamo, 2 cez `_performAtomicReplace`) — pridať `meta` a zvýšenie verzie.
- 1 metóda rozdelená do viacerých transakcií (`deleteProperty`) — zlúčiť.
- Skoršie číslo „51 metód (13 + 35 + 2 + 1)“ bolo aritmeticky aj vecne nepresné.

### 4.4 Úplnosť zálohy (overené v kóde)

| Kolekcia | Object Store | `getData` | `buildBackup` | `validateAppData` povolí kľúč | `_performAtomicReplace` |
|---|---|---|---|---|---|
| transactions … shoppingItems (16) | ✓ | ✓ | ✓ | ✓ | clear + put |
| settings | ✓ | ✓ | ✓ | ✓, **ale `validateSettings` odmietne `propertiesConfirmed`/`liabilitiesConfirmed`** | clear + put |
| persons, households | ✓ | ✓ | ✓ | ✓ | clear + put |
| **personalGoals** | ✓ (v14) | ✓ | **✗** | **✗ (neznáme pole)**, výstup ho neobsahuje | **clear + put `[]` → zmazanie** |
| **calendarObligations** | ✓ (v12) | ✓ | ✗ | ✗ (neznáme pole); výstup vždy `[]` | **nedotknuté** (ostáva staré) |
| attachments | ✓ | ✗ (iná metóda) | len ak sa odovzdajú (COMPAVEN neodovzdá) | samostatne v `parseBackup` | clear + put |
| meta | ✓ (systém) | ✗ | ✗ | — | ✗ |

Používateľských úložísk je **21**, nie 20. Obnova pokrýva 20 (bez `calendarObligations`), `replaceAll` 19 (bez príloh a kalendára).

---

## 5. Výsledky finančného auditu

### 5.1 Invarianty

| # | Invariant | Kde | Testy | Riziko porušenia | Čo treba |
|---|---|---|---|---|---|
| 1 | K_total = K_inv + K_cash + K_nem | `context.ts:76`, `snapshotBuilder.ts:42-43` | `buildCompleteSnapshot.test.ts`, `etapa1-scenario.test.ts` | spotrebiteľské záväzky sa neodpočítavajú (F-15) | rozhodnúť definíciu |
| 2 | K_FIRE = K_inv + K_cash | `context.ts:57`, `capital.ts:28-30, 46` | 10 súborov | F-05 nafukuje K_inv/K_cash | opraviť F-05 |
| 3 | K_nem = čistá hodnota po záväzkoch | `property.ts:5-7` (hodnota − zostatok hypotéky) | „Hypotéka sa odpočíta presne raz“ | odpočítava len hypotéky na nehnuteľnosti; komentár `entities.ts:74` tvrdí `propertyValues − liabilities`, kód robí `propertyValues − mortgages` a do `liabilitiesCents` ukladá iné záväzky → polia snapshotu si navzájom nesedia | zosúladiť komentár/polia, rozhodnutie |
| 4 | K_nem nevstupuje do K_FIRE | `context.ts:57`; `monthsToTargetSplit` používa len inv + cash | áno | nízke | — |
| 5 | Hypotéka sa neodpočíta dvakrát | K: raz (`property.ts`) | áno | v `m` sa splátka započíta len ako ručná transakcia; v legacy D-346 môže vzniknúť dvojitý výdavok pri súčasnom zápise ako záväzok (upozornenie ±1 €) | rozhodnutie o `m` |
| 6 | Príjem nezvyšuje kapitál | `ledger.ts:76-78`, `annualOverview.ts` `flowsBetween` | `prijem-scenario.test.ts` a ďalšie | nízke | — |
| 7 | Výdavky/cash flow sa neaplikujú dvakrát | `ledger.ts:12-22, 47-90` | `ledger.test.ts`, `same-day.test.ts` | **F-05 (potvrdené, netestované)** | P0 oprava + test |
| 8 | Interný presun nemení K | `capital.ts:112-116`, `ledger.ts:60-65` | `invariants.property.test.ts` (fast-check) | nízke | — |
| 9 | Plánované ≠ skutočné | `ledger.ts:106-121` (budúce dátumy vynechané), `monthlyCashFlow.ts` (bez `incomes[]`, bez plánovaného nájmu) | `monthly-cashflow-with-income.test.ts` | UTC vs. lokálny „dnes“ (F-18) | zjednotiť dátum |
| 10 | Snapshot = historický stav | snapshot ukladá K_FIRE, K_nem, K_total a rozpisy pri vzniku | `buildCompleteSnapshot.test.ts` (kópia rozpisov) | auto snapshot k dátumu konca mesiaca používa transakcie a nehnuteľnosti k **dnešku** (F-05); ručný snapshot so starším dátumom berie dnešné hodnoty nehnuteľností | P0 |
| 11 | Nájomné príjmy a náklady oddelené | `rentalLedger` (`kind` príjem/výdavok), `householdBalance.ts` (D-346) | `household-balance.test.ts` | COMPAVEN `m` evidenciu prenájmu úplne ignoruje (F-16) | rozhodnutie |
| 12 | Sklad nevytvára duplicitné výdavky | `discardStock` zapisuje len `wasteRecords` | `stock-waste.test.ts` (dnes nespustený) | nízke; COMPAVEN sklad nemá | — |

### 5.2 Konkrétne zistenia

- **F-05 dvojité započítanie (potvrdené čítaním kódu):** `useAutomaticSnapshot.ts` vytvorí snapshot s `date = lastCompletedMonthEnd(today)` a `buildCompleteSnapshot` (`snapshotBuilder.ts:25-35`) spočíta K_inv/K_cash cez `capitalWithFlagsForToday(latest, data.transactions)`, teda so všetkými transakciami **do dnešného dňa**. Ledger potom pripočíta transakcie s dátumom po `snapshot.date` znova (`ledger.ts:12-22`). Spúšťač je pravdepodobný: auto snapshot je blokovaný, kým nie sú obe potvrdenia `true` (`snapshotValidator.ts:27-35`), a potvrdenia sa rušia pri každom uložení nehnuteľnosti a pri obnove — používateľ medzitým zapisuje transakcie nového mesiaca. Staršia funkcia `autoSnapshot` (`autoEvaluation.ts`) filtruje správne `t.date <= end`; dve implementácie sa rozchádzajú. Žiadny test nepokrýva transakcie po dátume snapshotu.
- **Jednotky a centy:** sumy sú celé centy; `parseAmountToCents` (`utils/currency.ts`) je robustný. `BudgetPanel.tsx:284, 358` používa `Math.round(parseFloat(x) * 100)` bez kontroly → môže uložiť `NaN`, 0 alebo zápornú hodnotu, ktorú `validateBudget` (`validate.ts:416`) pri obnove odmietne (F-17).
- **Zaokrúhľovanie:** `m` = `Math.round(bilancia / 12)`; podiely cieľov zaokrúhľované nadol (D-334). Bez nálezu.
- **Časové obdobia:** `m` = 12 **celých mesiacov pred mesiacom posledného snapshotu**, vždy delené 12 → v prvom roku používania systematicky podhodnotené (pri 2 mesiacoch dát šesťnásobne). Plánovanie a osobné ciele porovnávajú `R = m − (mInv + mCash + Σ mGoal)` (`PlanningPage.tsx:19-30`, `PersonalGoalsPage.tsx:93-101`) → falošné „deficity“ v prvom roku. Osobné ciele počítajú `n = ceil((T − K0) / mGoal)` bez výnosu, FIRE s výnosom — dva modely, treba ich v UI pomenovať.
- **Prázdne a nepotvrdené údaje:** auto snapshot sa pri nepotvrdených zoznamoch ticho preskočí (len `console.debug`); `getData()` pri chybe čítania úložiska vráti `[]` bez hlásenia (`indexeddb.ts:98-104`).
- **Rozdiely medzi modulmi:** tri definície „výsledku“: COMPAVEN Dashboard `m` (len transakcie), legacy Prehľad/Príjmy/Rozpočet podľa D-346 (`householdBalance`), Ročný prehľad „K“ = K_FIRE zo snapshotov. Rozhodnutie D-346 hovorí „výpočet je jeden“ — COMPAVEN to porušuje.
- **K0 osobných cieľov vs. K_FIRE:** K0 osobného cieľa je zadaný ručne; ak ide o peniaze, ktoré sú už v K_cash/K_inv, tie isté peniaze sa „plánujú“ dvakrát (nejde o dvojité započítanie v K, ale o dvojité priradenie). Otvorené rozhodnutie.
- **Záväzky v COMPAVEN:** nedajú sa pridať (len importom), K_total ich ignoruje, snapshot ich ukladá len ako informáciu.

---

## 6. Výsledky technického auditu

### Architektúra
- Zdieľaná vrstva úložiska medzi legacy a COMPAVEN: zmena pre jednu aplikáciu rozbila druhú (F-10).
- Duplicitná logika: `autoSnapshot` vs. `buildCompleteSnapshot`; `checkGoalContributionsSurplus` (`personalGoal.ts:122-131`) vs. výpočet `R` v stránkach; `m` vs. `householdBalance`.
- `App.tsx` (370 riadkov) obsahuje všetky handlery, migráciu default osoby, navigáciu aj potvrdenia.
- `repo as any` v `BackupForm.tsx:121` a `Lock.tsx:75` — rozhranie metódy už deklaruje, pretypovanie len skrýva chyby.
- `AppData.calendarObligations?: any[]` — úložisko bez zapisovača, bez typu.
- Nepoužívaný/sporný kód: `compaven-test.tsx` (dev entry s natvrdo nastaveným sandbox príznakom), `compaven.tsx` registruje `./compaven-sw.js`, ktorý v `public/` nie je (offline režim COMPAVEN pravdepodobne nefunguje — NEOVERENÉ v nasadení).

### Bezpečnosť
- **F-06 XSS:** `compaven.tsx` vloží `message` cez `innerHTML`; `message` obsahuje `?env=` z URL (`environment.ts:73-78`). Bez CSP v `compaven.html` sa vložený skript vykoná a má prístup k celej IndexedDB rovnakého originu.
- Legacy `index.html` má prísnu CSP; `compaven.html` nemá žiadnu.
- COMPAVEN nemá PIN a export je nešifrovaný JSON so všetkými financiami (legacy má šifrovanú zálohu).
- Validácia vstupov je len pri importe, nie pri zápise → aplikácia vie uložiť dáta, ktoré jej vlastný import odmietne (F-04, F-17).

### Databáza
- 22 Object Stores (21 používateľských + `meta`), lineárne migrácie v1–v14, indexy: `transactions.date/type`, `snapshots.date`, `attachments.transactionId/rentalEntryId`, `persons.isCurrentUser`, `households.createdAt`.
- 32 zápisov bez explicitnej transakcie, `deleteProperty` v dvoch krokoch, žiadne verziovanie, `getData` potichu prehĺta chyby.
- Mimo repository vrstvy sa do hlavnej DB nezapisuje (overené); databáza záloh má vlastné funkcie v `backupDb.ts`.

### Testovanie
- Unit: 1087 testov / 138 súborov; finančné jadro pokryté vrátane property-based testov. Testy úložiska sa dnes nespustia (PHASE 1A).
- `phase1b-security.test.ts`: podmienené vetvy s `expect(true).toBe(true)` (test prejde bez overenia), chýba fake-indexeddb, typová chyba.
- Chýba: test F-05, round-trip test COMPAVEN exportu (s osobnými cieľmi, potvrdeniami, prílohami), testy súbežných zápisov, E2E pre `compaven.html`, testy oddelenia REAL/SANDBOX v zostave.

### Používateľské rozhranie
- Chybové stavy: auto snapshot zlyhá ticho; obnova sa po 1 s obnoví bez zhrnutia, čo sa zmazalo.
- Potvrdenie obnovy zavádza (neuvádza osobné ciele a prílohy).
- Formuláre: rozpočet bez validácie; ostatné formuláre COMPAVEN nie sú detailne preverené (NEOVERENÉ).
- Inline štýly všade; responzivita a prístupnosť COMPAVEN neoverené (žiadne E2E ani axe testy pre COMPAVEN).

### Výkon a údržba
- `useAutomaticSnapshot` má v závislostiach inline callback z `App.tsx` → efekt beží pri každom renderi a zakaždým číta celú DB (F-20).
- 127 nesledovaných `.md` v koreni (iterácie V1–V11 tých istých tém) — zdroj pravdy je nejasný, v rozpore s procesom v `CLAUDE.md`.
- `CLAUDE.md` „Stav projektu“ je zastaraný (2026-10-25, iná vetva, iné počty testov).

---

## 7. Zistené chyby a riziká (konsolidovaný register)

| ID | Závažnosť | Zistenie | Dôkaz | Dopad | Navrhované riešenie |
|---|---|---|---|---|---|
| F-01 | **Kritická** | Premenovanie DB bez migrácie | `HEAD:App.tsx:27` vs. `environment.ts:42-45` | REAL dáta v `compaven-2.0` sa nezobrazia; auto-záloha by zálohovala prázdnu DB | rozhodnúť: ponechať `compaven-2.0` pre REAL, alebo jednorazová kontrolovaná kópia so zálohou |
| F-02 | **Kritická** | Osobné ciele sa nezálohujú a obnova ich zmaže | `backup.ts:16-41`, `validate.ts:444, 505-528`, `indexeddb.ts:472-473, 543, 550` | nenávratná strata cieľov pri každej obnove (REAL aj SANDBOX) | pridať do exportu, validácie (vrátane validátora položiek) a obnovy; zvýšiť `SCHEMA_VERSION` |
| F-03 | **Kritická** | Prílohy chýbajú v exporte COMPAVEN aj v auto-zálohe; obnova ich zmaže | `BackupForm.tsx:26, 92`, `indexeddb.ts:544` | strata príloh po importe staršej zálohy | `listAllAttachments` + `encodeAttachment` v exporte aj auto-zálohe |
| F-04 | **Kritická** | `validateSettings` odmieta `propertiesConfirmed`/`liabilitiesConfirmed`, ktoré aplikácia zapisuje | `validate.ts:424`, `App.tsx:231-277`, `indexeddb.ts:261-266, 292-297` | po prvom uložení nehnuteľnosti, potvrdení alebo obnove je každá ďalšia záloha **neobnoviteľná** | povoliť polia vo validátore; round-trip kontrola pri exporte (ako legacy `BackupSection.tsx:24-26`) |
| F-05 | **Kritická** | Dvojité započítanie transakcií v auto snapshote | `snapshotBuilder.ts:25-35`, `useAutomaticSnapshot.ts`, `ledger.ts:12-22` | nesprávne K_inv, K_cash, K_FIRE, K_total, dátum cieľa | filtrovať `t.date <= date`; test; zvážiť jednu implementáciu |
| F-06 | **Kritická** | Reflektované XSS cez `?env=`, bez CSP | `compaven.tsx:15-24`, `environment.ts:73-78`, `src/compaven.html` | únik všetkých finančných dát | `textContent` namiesto `innerHTML`; CSP ako v `index.html` |
| F-07 | **Vysoká** | Rozsiahla práca mimo Gitu | 203 nesledovaných, 44 zmenených, 18 nepushnutých commitov | strata práce, nejasný stav | po schválení WIP commit na samostatnú vetvu a push |
| F-08 | Vysoká | `npm run build` zlyhá na `tsc` | `tests/phase1b-security.test.ts:115` | nedá sa zostaviť ani nasadiť | opraviť test |
| F-09 | Vysoká | Prísna kontrola mena DB zakazuje izolované testy | 52 zlyhaní | vrstva úložiska neotestovaná | injektovateľná konfigurácia alebo povolený testovací prefix len v `MODE === "test"` |
| F-10 | Vysoká | Legacy aplikácia na tejto vetve nefunguje; `VITE_COMPAVEN_ENV` nikde nenastavená | `src/ui/App.tsx:62`, žiadne `.env*`, workflows | merge do `main` by rozbil verejné nasadenie a CI | oddeliť legacy cestu (`openLegacyRepository`) alebo vetvu; nastaviť env v build skriptoch |
| F-11 | Vysoká | Ochrana obnovy REAL je len procedurálna | `indexeddb.ts:505-516`, `backupDb.ts:56-60` | ľubovoľné staré `backupId` prejde; záloha bez integrity a bez možnosti obnovy | PHASE 1B.2 + UI obnovy z internej zálohy + retencia |
| F-12 | Vysoká | Bez ochrany pred súbežnými zápismi | žiadne `_dbVersion` | zápis z inej karty počas obnovy sa stratí | PHASE 1B.2 |
| F-13 | Stredná | `calendarObligations`: úložisko bez zapisovača, nezálohuje sa, obnova ho nečistí | `indexeddb.ts:75, 122`, `validate.ts:524` | prakticky prázdne; ak by sa naplnilo, prežije obnovu (nekonzistencia) | rozhodnúť: odstrániť z `AppData` alebo zahrnúť do zálohy a obnovy |
| F-14 | Stredná | `deleteProperty` nie je atomické | `indexeddb.ts:309-313` | osirelé prílohy pri chybe | jedna transakcia |
| F-15 | Stredná | K_total ignoruje spotrebiteľské záväzky; polia snapshotu nekonzistentné | `property.ts:5-7`, `entities.ts:74`, `snapshotBuilder.ts:60-78` | nadhodnotený čistý majetok | rozhodnutie zakladateľa |
| F-16 | Stredná | `m` sa odlišuje od D-346 a v 1. roku je podhodnotené | `monthlyCashFlow.ts` | zavádzajúce plánovanie a deficity cieľov | rozhodnutie; jedna funkcia pre všetky moduly |
| F-17 | Stredná | Rozpočet môže uložiť NaN/≤0 | `BudgetPanel.tsx:40-58, 284, 358` | neobnoviteľná záloha | validácia pri zápise |
| F-18 | Stredná | „Dnes“ v UTC vs. lokálne | `App.tsx:280`, `PlanningPage.tsx:19`, `BackupForm.tsx:61` vs. `ledger.ts` | posun o deň medzi 00:00 a 02:00 | jedna funkcia `todayLocal()` |
| F-19 | Stredná | `getData` prehĺta chyby | `indexeddb.ts:98-104` | tichý prázdny zoznam | chybu propagovať |
| F-20 | Nízka | Auto snapshot efekt pri každom renderi | `useAutomaticSnapshot.ts` + `App.tsx` | zbytočné čítania DB | `useCallback`/ref |
| F-21 | Stredná | Import v COMPAVEN bez limitu veľkosti a so zavádzajúcim potvrdením | `BackupForm.tsx:50-82` | zamrznutie/strata bez varovania | `backupTooLarge`, úplný náhľad |
| F-22 | Stredná | Dokumentácia: 127 nesledovaných `.md`, PHASE 1A/1B nie sú v rozhodnutiach, zastaraný `CLAUDE.md` | koreň repozitára | nejasný zdroj pravdy | konsolidácia (po schválení) |
| F-23 | Nízka | Zmazaný commitnutý test `personalGoal-phase4-integration.test.ts` | `git status` | strata pokrytia | potvrdiť zámer |
| F-24 | Nízka | `compaven-sw.js` neexistuje v `public/` | `compaven.tsx:9` | bez offline režimu | doplniť alebo odstrániť |

### Rozpory v predchádzajúcich reportoch (opravené týmto auditom)
1. „`calendarObligations` sa pri obnove vymažú“ — **nepravda**; obnova ich nečistí.
2. „`parseBackup` preskakuje kľúč `calendarObligations` (riadky 60-75)“ — **taký kód neexistuje**; `validateAppData` kľúč odmietne.
3. „`personalGoals` majú v `parseBackup` default `[]` (riadok 76)“ — **nepravda**; riadok 76 ich neobsahuje a validátor kľúč odmietne.
4. „Existuje `verifyBackupIntegrity()`, pole `checksum`, `_dbVersion`“ — **neexistujú** (overené grepom).
5. „Build prešiel“ — plný `npm run build` dnes **neprejde**.
6. Návrh formátu `_dbVersion` ako objekt `{ value }` bol nekonzistentný s `getMeta` (reťazec).
7. „51 metód (13 + 35 + 2 + 1)“ — presne je to 48 + `setMeta` + 1 privátna.
8. „Atomická obnova pokrýva všetkých 20 úložísk“ — používateľských úložísk je 21; `calendarObligations` chýba.
9. „Poradie parametrov `put(value, key)` v `setMeta` je neobvyklé“ — je to štandardná signatúra `idb`, nie problém.

---

## 8. Návrhy na vylepšenia

Legenda: **N** = nevyhnutná oprava, **V** = voliteľné vylepšenie.

### 8.1 Finančná správnosť
| Návrh | Typ | Prínos | Náročnosť | Riziko | Priorita |
|---|---|---|---|---|---|
| Oprava F-05 + test „transakcie po dátume snapshotu sa nezapočítajú dvakrát“ | N | správne K a dátum cieľa | nízka | nízke | P0 |
| Jedna funkcia mesačnej bilancie pre Dashboard, Plánovanie, Ciele (D-346) | N | konzistentné čísla | stredná | stredné (zmena výpočtu, D-153) | P1 |
| `m` delené počtom mesiacov s dátami (min. 1, max. 12) alebo jasné označenie „priemer za 12 mes.“ | N | nezavádzajúce plánovanie | nízka | nízke | P1 |
| Rozhodnúť a zobraziť K_total s/bez spotrebiteľských záväzkov | N | pravdivý čistý majetok | nízka | nízke | P1 |
| Invariantné property-based testy pre ledger + snapshot (fast-check) | V | prevencia regresií | stredná | nízke | P2 |

### 8.2 Bezpečnosť a ochrana dát
| Návrh | Typ | Prínos | Náročnosť | Riziko | Priorita |
|---|---|---|---|---|---|
| Oprava XSS + CSP pre `compaven.html` | N | ochrana dát | nízka | nízke | P0 |
| Úplná záloha (osobné ciele, prílohy, kalendár podľa rozhodnutia) + validátor potvrdení | N | obnoviteľnosť | stredná | nízke | P0 |
| Round-trip kontrola každého exportu a auto-zálohy | N | žiadna neobnoviteľná záloha | nízka | nízke | P0 |
| Validácia pri zápise v repository (rovnaké validátory ako import) | N | konzistentné dáta | stredná | stredné | P1 |
| PHASE 1B.2: `_dbVersion`, SHA256, obnova s kontrolou verzie, `DB_VERSION` 15 + `onversionchange` | N | ochrana pred súbežnými zápismi | stredná | stredné | P1 |
| UI „Obnoviť z internej zálohy“ + retencia (napr. posledných 10) | N | použiteľná ochrana | stredná | nízke | P1 |
| PIN a šifrovaný export v COMPAVEN (prevziať z legacy) | V | súkromie | stredná | nízke | P2 |

### 8.3 Používateľská skúsenosť
| Návrh | Typ | Priorita |
|---|---|---|
| Úplný náhľad pred obnovou (počty všetkých kolekcií, čo sa zmaže) | N | P0 |
| Viditeľná informácia, prečo sa automatické vyhodnotenie nevytvorilo (chýbajúce potvrdenia) | N | P1 |
| Rušiť potvrdenia len pri skutočnej zmene hodnoty/zostatku, nie pri každom uložení | V | P2 |
| Pridávanie záväzkov v COMPAVEN | V | P2 |

### 8.4 Analytika a plánovanie
| Návrh | Typ | Priorita |
|---|---|---|
| Rozlíšiť vlastné bývanie a investičné nehnuteľnosti v rozpise K_nem | V | P3 |
| Jasné pomenovanie modelov (osobné ciele bez výnosu vs. FIRE s výnosom) | N | P2 |
| Priradenie K0 osobných cieľov ku K_cash/K_inv, aby sa peniaze nepriraďovali dvakrát | V | P3 |

### 8.5 Automatizácia
| Návrh | Typ | Priorita |
|---|---|---|
| CI pre COMPAVEN: `tsc`, `vitest` s `VITE_COMPAVEN_ENV=sandbox`, E2E pre `compaven.html` | N | P1 |
| Pripomienka exportu zálohy (ako legacy `lastExportAt`) | V | P2 |

### 8.6 Výkon
| Návrh | Typ | Priorita |
|---|---|---|
| Stabilný callback v `useAutomaticSnapshot` | V | P2 |
| Meranie latencie verziovaných zápisov | V | P2 |

### 8.7 Architektúra a údržba
| Návrh | Typ | Priorita |
|---|---|---|
| Oddeliť legacy a COMPAVEN otváranie DB (`openLegacyRepository` vs. `openCompavenRepository`) | N | P0/P1 |
| Odstrániť `repo as any`, typovať `calendarObligations` alebo ho odstrániť | V | P2 |
| Rozdeliť `App.tsx` (routing, dátový kontext, handlery) | V | P2 |
| Konsolidovať 127 koreňových `.md` do `docs/` a rozhodnutí; aktualizovať `CLAUDE.md` | N | P1 |

### 8.8 Cloud
| Návrh | Typ | Priorita |
|---|---|---|
| Dva Cloudflare Pages projekty (REAL, SANDBOX) na rôznych originoch, chránené ako D-271 | V | P3 |
| Synchronizácia / viac zariadení (Supabase alebo iné) — až po stabilnom lokálnom modeli a verziovaní | V | P4 |

### 8.9 Budúce rozšírenia
- Import výpisov, aktualizácia cien investícií (N-26), viac používateľov v domácnosti — všetko P4, po stabilizácii.

---

## 9. Prioritizovaný plán ďalšieho vývoja

### Etapa 0 — Zabezpečenie práce (pred P0, len so súhlasom)
- **Cieľ:** nič nestratiť.
- **Úlohy:** WIP commit všetkých necommitnutých a nesledovaných zdrojových súborov a testov na samostatnú vetvu (napr. `wip/compaven-phase1ab-2026-11-12`), push. Koreňové `.md` buď do jedného commitu, alebo presunúť do archívu — rozhodne zakladateľ.
- **Podmienka uzavretia:** `git status` bez nesledovaných súborov v `src/` a `tests/`; vetva na `origin`.

### P0 — Kritické chyby a ochrana finančných dát
- **Cieľ:** žiadna strata dát, správne K, žiadne XSS, zostaviteľný projekt.
- **Úlohy:**
  1. Rozhodnutie a riešenie F-01 (názov REAL DB / migrácia).
  2. F-06: `textContent`, CSP v `src/compaven.html`.
  3. F-02, F-03, F-04: úplný export/import (`backup.ts`, `validate.ts`, `BackupForm.tsx`, `indexeddb.ts`), round-trip kontrola, zvýšenie `SCHEMA_VERSION`.
  4. F-05: `snapshotBuilder.ts` filtrovať transakcie `<= date`.
  5. F-08, F-09: opraviť `phase1b-security.test.ts`; testovateľná konfigurácia DB mena.
  6. F-10: legacy cesta otvárania DB; `VITE_COMPAVEN_ENV` v skriptoch (`npm run build:real`, `build:sandbox`) a v testoch.
- **Súbory:** `src/storage/{backup,validate,indexeddb,backupDb}.ts`, `src/compaven-ui/BackupForm.tsx`, `src/app/snapshotBuilder.ts`, `src/compaven.tsx`, `src/compaven.html`, `src/config/environment.ts`, `package.json`, `vitest.config.ts`, testy.
- **Akceptačné kritériá:** pozri oddiel 11.
- **Testy:** round-trip test s osobnými cieľmi, potvrdeniami a prílohami; test F-05; test XSS (správa sa vykreslí ako text); celý `vitest` zelený; `tsc` bez chýb.
- **Riziká:** zmena schémy zálohy (kompatibilita so staršími zálohami); zmena výpočtu počas pilota (D-153).
- **Podmienka uzavretia:** všetky akceptačné kritériá splnené, zapísané v `decisions/Decisions.md`, commit + push.

### P1 — Dokončenie základných funkcií
- **Cieľ:** spoľahlivá ochrana REAL a konzistentné čísla.
- **Úlohy:** PHASE 1B.2 (verziovaná vrstva, 48 metód, `deleteProperty`, SHA256, obnova s kontrolou verzie, `DB_VERSION` 15 + `onversionchange`); UI obnovy z internej zálohy + retencia; validácia pri zápise; jedna funkcia mesačnej bilancie; rozhodnutia F-15, F-16; konsolidácia dokumentácie; CI pre COMPAVEN.
- **Akceptačné kritériá:** test pre každú zapisovaciu metódu, že zvýši `_dbVersion`; test súbežnej zmeny (zápis medzi zálohou a obnovou → abort, dáta nezmenené); test integrity (poškodená záloha → odmietnutá).
- **Podmienka uzavretia:** zelené unit + E2E pre COMPAVEN, rozhodnutia zapísané.

### P2 — Stabilizácia, testy, UX
- E2E pre `compaven.html` (Dashboard, transakcie, nehnuteľnosti, záloha/obnova, osobné ciele), axe prístupnosť, responzivita; PIN a šifrovaný export; výkon `useAutomaticSnapshot`; rozdelenie `App.tsx`; pomenovanie modelov.
- **Podmienka uzavretia:** E2E pokrytie hlavných tokov, žiadne kritické nálezy prístupnosti.

### P3 — Rozšírenia a automatizácia
- Rozpis K_nem (bývanie/investičné), väzba K0 cieľov na kapitál, pridávanie záväzkov, pripomienky exportu, nasadenie REAL/SANDBOX na Cloudflare Pages s ochranou.

### P4 — Cloud a pokročilé funkcie
- Synchronizácia medzi zariadeniami, autentifikácia, šifrovanie na strane klienta, konflikty pri súbežných zmenách z viacerých zariadení.

---

## 10. Otvorené rozhodnutia (pre zakladateľa)

1. **Názov REAL databázy:** ponechať `compaven-2.0` (bez migrácie) alebo `compaven-2.0-real` s kontrolovanou kópiou? Existujú REAL dáta v `compaven-2.0`? (NEOVERENÉ)
2. **Záväzky v K_total:** odpočítavať spotrebiteľské úvery a karty od čistého majetku?
3. **Definícia `m`:** zjednotiť s D-346 (vrátane evidencie prenájmu a splátok z Majetku) a ako deliť v prvom roku? Výnimka z D-153?
4. **`calendarObligations`:** odstrániť z COMPAVEN alebo zahrnúť do zálohy a obnovy?
5. **Legacy aplikácia na tejto vetve:** ponechať funkčnú (oddeliť cestu DB) alebo z tejto vetvy vylúčiť?
6. **Báza pre COMPAVEN 2.0:** ktorá vetva je zdrojom pravdy (`recovery-test` vs. ostatné worktree) a ako sa zladia D-337 až D-345 (v tejto vetve chýbajú v `Decisions.md`)?
7. **Necommitnutá práca:** stratégia commitu 203 nesledovaných súborov (najmä 127 koreňových `.md`).
8. **Cloud:** Cloudflare (podľa D-270/D-271) alebo Vercel + Supabase (nesledovaný návrh)?
9. **Retencia záloh** a **UI obnovy z internej zálohy.**
10. **K0 osobných cieľov:** samostatné peniaze, alebo podiel na K_cash/K_inv?
11. **Zápis PHASE 1A, 1B a 1B.2 do `decisions/Decisions.md`** (nové čísla D-xxx).

---

## 11. Akceptačné kritériá pre ďalšiu etapu (brána P0)

1. `npx tsc -p tsconfig.json --noEmit` — 0 chýb.
2. `VITE_COMPAVEN_ENV=sandbox npx vitest run` — 0 zlyhaní; testy úložiska sa skutočne spustia (nie preskočia).
3. Round-trip test: dáta s osobnými cieľmi, potvrdeniami v nastaveniach a prílohou → export z COMPAVEN → import → identický obsah (okrem `exportedAt`).
4. Auto-záloha v REAL obsahuje všetky používateľské úložiská vrátane príloh a prejde `parseBackup`.
5. Test F-05: transakcia s dátumom po dátume auto snapshotu sa v aktuálnom kapitáli započíta presne raz.
6. `?env=<img src=x onerror=…>` sa zobrazí ako text; `compaven.html` má CSP.
7. Legacy `index.html` sa otvorí bez chyby, alebo je rozhodnutím vylúčený z tejto vetvy.
8. Existujúce REAL dáta (ak sú) sú po nasadení viditeľné a nezmenené.
9. Rozhodnutia zapísané v `decisions/Decisions.md`; zmeny commitnuté a pushnuté.

---

## 12. Pokyny pre novú reláciu

1. **Pracovný priečinok:** `C:\Users\Firefly G8\compaven-scenario-worktrees\phase3-ux-redesign`, vetva `recovery-test`. Je to git worktree — nerobiť `cd` do hlavného repozitára, nepoužívať holé `git stash`.
2. **Najprv overiť stav** (nič nemení):
   - `git status --porcelain=v1 | cut -c1-2 | sort | uniq -c` → očakávané 1 D, 44 M, 203 ?? (tento dokument je už commitnutý; ak sa líši, niekto pracoval medzitým).
   - `git rev-list --left-right --count HEAD...@{u}` → 20 0 (18 commitov z auditu + 2 commity s týmto dokumentom; nič nie je pushnuté).
   - `npx tsc -p tsconfig.json --noEmit` → 1 chyba v `tests/phase1b-security.test.ts:115`.
   - `VITE_COMPAVEN_ENV=sandbox npx vitest run` → 55 zlyhaní (52 názov DB, 3 indexedDB).
3. **Nič nemazať ani necommitovať bez výslovného súhlasu** zakladateľa. Nepracovať v `src/ui/`. Nespúšťať reset DB, `vite build` do `dist/` ani nasadenie bez súhlasu.
4. **Neopakovať audity** PHASE 1A/1B/1B.2 — výsledky sú v oddieloch 4 a 7. Rozhodujúci je kód; predchádzajúce reporty v koreni repozitára obsahujú rozpory (oddiel 7, „Rozpory“).
5. **Prvý krok:** predložiť zakladateľovi otvorené rozhodnutia 1, 5, 6 a 7 (oddiel 10) a návrh Etapy 0. Bez rozhodnutia 1 nesmie COMPAVEN bežať nad REAL dátami.
6. **Potom P0** v poradí: Etapa 0 → F-06 → F-08/F-09/F-10 (aby testy fungovali) → F-04 → F-02/F-03 → F-05 → F-01. Každú opravu najprv test, ktorý zlyhá, potom kód.
7. **Dôležité súbory:** `src/storage/indexeddb.ts`, `src/storage/backup.ts`, `src/storage/validate.ts`, `src/storage/backupDb.ts`, `src/compaven-ui/BackupForm.tsx`, `src/compaven-ui/App.tsx`, `src/app/snapshotBuilder.ts`, `src/compaven-ui/useAutomaticSnapshot.ts`, `src/domain/{context,ledger,capital,monthlyCashFlow,property}.ts`, `src/config/environment.ts`, `src/compaven.tsx`.
8. **Jazyk a proces:** slovenčina; postup podľa `CLAUDE.md` (kontrola dokumentov → konflikty → artefakt → rozhodnutie do `decisions/Decisions.md`); osobné finančné údaje do repozitára nepatria.
