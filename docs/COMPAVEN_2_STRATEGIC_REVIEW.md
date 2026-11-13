# COMPAVEN 2.0 — Nezávislý strategický a architektonický audit

- **Dátum:** 2026-11-12
- **Základ analýzy:** vetva `recovery-test`, HEAD `41a8e7a` a necommitnuté zmeny pracovného stromu (44 M, 1 D, 203 ??); `docs/COMPAVEN_2_FINAL_AUDIT_AND_HANDOVER.md`; `docs/00_Project_Vision.md`, `docs/06_Roadmap.md`, `decisions/Decisions.md`; `COMPAVEN_2.0_TARGET_ARCHITECTURE.md`; nesledovaný `COMPAVEN_MVP_SCOPE_V1.3.2_FINAL.1.md`; zdrojový kód `src/compaven-ui`, `src/domain`, `src/app`, `src/storage`, `src/config`; testy v `tests/`.
- **Režim:** výlučne analytický. Kód, testy, databázy ani Git stav sa nemenili; tento dokument je jediný vytvorený súbor (nesledovaný, bez commitu). Výsledky testov preberám z auditu 2026-11-12 (nespúšťal som ich znova).
- **Nadväznosť:** nálezy **F-01 až F-24** z odovzdávacieho dokumentu neopakujem, len na ne odkazujem. Nové nálezy majú predpony **A-** (architektúra), **FN-** (financie), **P-** (produkt), **U-** (UX), **DA-** (dátová architektúra), **AI-**.
- **Ilustratívne prepočty** sú moje výpočty podľa vzorcov v kóde, nie výstupy aplikácie.

| Značka | Význam |
|---|---|
| **[POTVRDENÝ PROBLÉM]** | Overené v aktuálnom kóde alebo dokumentácii; uvedený dôkaz. |
| **[POTENCIÁLNE RIZIKO]** | Mechanizmus v kóde existuje, dopad závisí od dát alebo správania používateľa. |
| **[ODPORÚČANIE]** | Môj návrh; nie je rozhodnutý ani implementovaný. |
| **[OTVORENÁ OTÁZKA]** | Treba rozhodnutie zakladateľa alebo chýba dôkaz (NEOVERENÉ). |

---

## 1. Manažérske zhrnutie

**Verdikt.** COMPAVEN stojí na kvalitnom deterministickom výpočtovom jadre (doména v celých centoch, golden cases, property-based testy). Nové vrstvy COMPAVEN 2.0 ho však na kľúčových miestach **obchádzajú a zavádzajú vlastné definície**. Hlavný problém projektu dnes nie je nedostatok funkcií, ale **viac právd o tom istom čísle**, **rozptýlený rozsah** a **proces, ktorý produkuje dokumenty rýchlejšie než overené rozhodnutia**.

**Najdôležitejšie zistenia:**
1. **Hlavné číslo nástenky — čas do finančnej slobody — nepočíta FIRE motor projektu** (FN-01). Nástenka používa lineárne `ceil((T − K_FIRE) / m)` bez výnosu. Ilustratívne pre T = 648 649 €, K_FIRE = 100 000 €, 1 000 €/mes., r = 3,5 %: nástenka **45 r 9 m**, motor projektu **23 r 3 m**. Stránka Scenáre používa motor, takže aplikácia ukazuje dva protichodné dátumy. Nález audit 2026-11-12 nezachytil.
2. **Mesačný tok `m` bol predefinovaný bez rozhodnutia** a na obrazovkách existujú tri rôzne „mesačné toky“ (FN-02, FN-03). Plánovanie zobrazuje sporenie ako „výdavky“ (FN-04).
3. **COMPAVEN nespúšťa amortizáciu hypoték** (D-137), takže K_nem a K_total sa časom vzďaľujú od reality (FN-05).
4. **Dátový model nesie nepoužité a duplicitné koncepty:** dva systémy cieľov, vlastnícke podiely bez výpočtovej sémantiky, investície, ktoré sa v COMPAVEN nedajú zadať (A-05, FN-10, FN-11).
5. **Dve aplikácie a 17 vetiev nad spoločnou vrstvou úložiska a domény;** zmena pre jednu rozbíja druhú (A-01, A-02).
6. **Procesný dlh:** 122 nesledovaných iteratívnych dokumentov v koreni, definície rozhodované mimo `decisions/Decisions.md` (A-10).
7. Ostávajú otvorené P0 z auditu: neobnoviteľné zálohy, dvojité započítanie v automatickom vyhodnotení, XSS (F-02 až F-06).

**Čo je silné a treba zachovať:** čistá doména v centoch s testami; lokálne-first súkromie bez účtov; oddelenie K_FIRE od K_nem (vlastné bývanie nie je kapitál na slobodu); viditeľné predpoklady (V, p, r); koncept záznamu rozhodnutí D-xxx.

**Odporúčanie jednou vetou:** zúžiť COMPAVEN na **deterministický nástroj na rozhodovanie o finančnej slobode** s jedným výpočtovým motorom, jedným slovníkom definícií a jednou vetvou, a nové funkcie zastaviť, kým neprejdú brány P0 (oddiel 8).

**Tri rozhodnutia potrebné pred ďalším rozvojom** sú v oddiele 9.7.

---

## 2. Architektonická revízia

**A-01 [POTVRDENÝ PROBLÉM] Dve aplikácie bez hraníc v jednom repozitári.**
Legacy „Finančná sloboda“ (`index.html` → `src/ui/`) a COMPAVEN 2.0 (`src/compaven.html` → `src/compaven-ui/`) zdieľajú `src/storage` a `src/domain`. `vite.config.ts` buildí oba vstupy naraz a oba dostanú `public/` vrátane OCR dát pre legacy (`public/tesseract` 20 MB, `public/tessdata` 5,8 MB; `tesseract.js`, `@zxing/library`, `pdf-lib` sa používajú len v `src/features`, `jsqr` v `src/ui`). COMPAVEN importuje `features/rocny-prehlad`, `ui/kit/*`, `ui/ErrorBoundary`. Dôkaz dopadu: zmena PHASE 1A v `indexeddb.ts` rozbila legacy (F-10).
*Dôsledok:* každá zmena v zdieľanej vrstve má neznámy dosah; nasadenie COMPAVEN nesie desiatky MB, ktoré nepotrebuje.
**[ODPORÚČANIE]** Rozhodnúť osud legacy (O-02). Technicky: `domain` ako čistá zdieľaná knižnica; úložisko a UI oddelené pre každú aplikáciu; samostatný build COMPAVEN bez legacy `public/` assetov.

**A-02 [POTVRDENÝ PROBLÉM] Divergencia vetiev, schém a rozhodnutí.**
17 lokálnych vetiev a 17 worktree (12 s necommitnutými zmenami); lokálny `main` je 466 commitov za `origin/main`; COMPAVEN práca na `recovery-test` je 20 commitov nepushnutá + 203 nesledovaných položiek. V `decisions/Decisions.md` tejto vetvy chýbajú D-337 až D-345 (číslovanie skáče z D-336 na D-346). D-347 rezervuje verzie schémy v17/v18 pre iné vetvy (`src/storage/types.ts:5,10`).
*Dôsledok:* zlučovanie bude drahé a rizikové; číslo verzie dát je viazané na vetvu, nie na obsah.
**[ODPORÚČANIE]** Jedna hlavná vetva pre COMPAVEN, krátke vetvy funkcií, jeden register rozhodnutí; verzie schémy prideľovať až pri zlúčení.

**A-03 [POTVRDENÝ PROBLÉM] Finančné výpočty v UI komponentoch.**
`Dashboard.tsx:19-24` (vlastný odhad cieľa), `PlanningPage.tsx:23-30` a `PersonalGoalsPage.tsx:93-101` (rozpočet `R` počítaný v komponentoch, dvakrát), `PlanningPage.tsx:138-145` (súčty príjmov a výdavkov). Doménová funkcia `checkGoalContributionsSurplus` (`personalGoal.ts:122-131`) počíta tú istú vec inak.
*Dôsledok:* obchádzajú sa testy domény (golden cases z `docs/07`); FN-01 a FN-04 sú priame následky.
**[ODPORÚČANIE]** Pravidlo „UI nepočíta financie“: jedna aplikačná funkcia (napr. `computeDashboard(data, today)`) vráti všetky zobrazované čísla; UI ich len formátuje. Vynútiť testom alebo lintom.

**A-04 [POTVRDENÝ PROBLÉM] Duplicitné implementácie toho istého pojmu.**
- Automatické vyhodnotenie: `autoSnapshot` (`src/app/autoEvaluation.ts:34-65`, filtruje `t.date <= end`, rieši výnos a pozície) vs. `buildCompleteSnapshot` (`src/app/snapshotBuilder.ts`, nefiltruje, výnos ani pozície nerieši). COMPAVEN používa druhú (`useAutomaticSnapshot.ts`).
- Mesačný tok: `monthlyCashFlow.ts`, `planningEstimates.ts`, `householdBalance`/`monthSummary` (používa `BudgetPanel.tsx:24-32`).
- Typ `OwnerRef` je definovaný dvakrát (`src/domain/model/entities.ts:466`, `src/domain/model/household.ts:36`).

**A-05 [POTVRDENÝ PROBLÉM] Dátový model nesie nepoužité koncepty.**
- `OwnershipEditor.tsx` sa nikde neimportuje; `OwnerRef` nemá v doméne žiadnu výpočtovú sémantiku (grep `src/domain`, `src/app`).
- `calendarObligations` nemá zapisovač (F-13).
- `handleAddPosition` (`App.tsx:147`) sa nikde nepoužíva, investície sa v COMPAVEN nedajú zadať, no nástenka ponúka „Evidovať investície“ (`Dashboard.tsx:234`) a dlaždicu „Investície“ (`Dashboard.tsx:254`).
- `AppData` má 22 polí vrátane psov, receptov, skladu, nákupného zoznamu a vyhodených potravín (`entities.ts:471-495`), ktoré COMPAVEN UI nemá.
*Dôsledok:* každá migrácia, záloha a validácia platí za funkcie, ktoré produkt nepoužíva; F-02 a F-13 vznikli práve na takýchto okrajoch.

**A-06 [POTVRDENÝ PROBLÉM] Dve verzie dát bez migračného rámca.**
`DB_VERSION` 14 (`indexeddb.ts:8`) a `SCHEMA_VERSION` 20 s dierami 17/18 (`types.ts:5,10`). Migrácie zálohy sú ad hoc vetvy v `parseBackup` (`backup.ts:57-61, 99`). Validátor povoľuje len vymenované kľúče (`validate.ts:444`, `validate.ts:424`), preto každé nové pole bez úpravy validátora urobí zálohu neobnoviteľnou (mechanizmus F-02 a F-04).
**[ODPORÚČANIE]** Jedna verzia dátového modelu; migrácie ako čisté funkcie `vN → vN+1` testované na fixtures každej historickej verzie; rovnaká validácia pri zápise aj importe.

**A-07 [POTVRDENÝ PROBLÉM] Testovateľnosť je nerovnomerná.**
Doména: 1087 unit testov, property testy (`tests/invariants.property.test.ts`, `tests/goal-shares.test.ts`). COMPAVEN UI: **0 testov** pre výpočty komponentov (žiadny test neodkazuje na `compaven-ui/Dashboard`) a **0 E2E**; testy úložiska sa dnes nespustia (handover, oddiel 2.3).
*Dôsledok:* najviditeľnejšie číslo aplikácie je neotestované — FN-01 to dokazuje.

**A-08 [POTENCIÁLNE RIZIKO] Udržiavateľnosť UI.**
`App.tsx` má 370 riadkov (všetky handlery, migrácia default osoby `App.tsx:47-72`, synchronizácia stránok cez `useEffect` `App.tsx:89-108`), `repo as any` (`BackupForm.tsx:121`), inline štýly v každom komponente, preklep v navigácii („Nástennka“, `Navigation.tsx:31`).

**A-09 [POTENCIÁLNE RIZIKO] Prístup k dátam neškáluje.**
Po každom zápise sa číta celé `AppData` (20 úložísk, `indexeddb.ts:94-129`); automatické vyhodnotenie beží pri každom renderi (F-20). Pri rokoch histórie (tisíce transakcií) NEOVERENÉ meraním.

**A-10 [POTVRDENÝ PROBLÉM] Procesný dlh nahrádza testy dokumentmi.**
122 nesledovaných `.md` v koreni, napr. 8 verzií `COMPAVEN_MVP_SCOPE_*`, 7 verzií `PLAN_FINAL_OPRAVA_B_A_OBNOVA_C_*`, `BLOK5_MODEL_HYPOTEKY_VARIANT_B_V4…V9`, `BLOK5_V11_OTAZKY_A_ROZHODNUTIA*`. Definícia `m` bola „schválená“ v nich (FN-02), nie v `decisions/Decisions.md`, čo `CLAUDE.md` vyžaduje. 147 sledovaných súborov v `docs/` a 338 riadkov rozhodnutí.
*Dôsledok:* nejasný zdroj pravdy; reviewer ani ďalšia relácia nevedia, čo platí; veľa analýzy, málo overiteľných invariantov.
**[ODPORÚČANIE]** „Rozhodnutie = záznam D-xxx + test, ktorý ho vynucuje“; iterácie archivovať mimo koreňa.

**A-11 [POTENCIÁLNE RIZIKO] Oddelenie REAL/SANDBOX je len názvom databázy.**
Oddelené originy (domény) nie sú v repozitári definované (žiadny workflow pre COMPAVEN); NEOVERENÉ.

**A-12 [ODPORÚČANIE] Cieľová vrstvová architektúra (bez prepisovania od nuly).**
`domain` (čisté funkcie, jediný zdroj výpočtov) → `application` (výpočtový motor obrazoviek, register definícií) → `storage` (verziované zápisy podľa PHASE 1B.2, migrácie) → `ui` (bez výpočtov). Doplniť **register definícií**: každá zobrazená metrika má jednu funkciu, jeden text vysvetlenia a testy invariantov.

---

## 3. Nezávislý finančný audit

### 3.1 Nové zistenia

**FN-01 [POTVRDENÝ PROBLÉM — kritický] Odhad „Cieľ dosiahnutia“ na nástenke nepoužíva FIRE motor.**
- `Dashboard.tsx:23-24`: `estimatedMonths = Math.ceil((fireTargetEur − kFire) / monthlyFlow)`, kde `monthlyFlow = ctx.m` (príjmy − výdavky, `monthlyCashFlow.ts`).
- Ignoruje výnos `r`, rozdelenie na `mInv`/`mCash`, rezervu aj model prenájmov (`rentalGoal.ts`). Zdokumentovaný model (FR-02, D-046, `capital.ts:39-64`, `goal.ts:26-44`) sa na nástenke nepoužije; `goalMonths` volá len Scenáre (`monthlyInvestmentScenario.ts`) a `context.ts:58` (iba príznak `longHorizon`).
- `Dashboard.tsx:19`: `fireTargetCents = ctx.target || 1000000` → bez nastavení (a so snapshotom) nástenka zobrazí „Cielová suma: € 10 000“ (`Dashboard.tsx:182`, text vrátane preklepu podľa kódu), teda vymyslené číslo ako údaj používateľa.
- Ilustratívne (T = 648 649 € podľa príkladu v `docs/00`, K_FIRE = 100 000 €, 1 000 €/mes., r = 3,5 %): nástenka 549 mesiacov (45 r 9 m), motor 278,8 mesiaca (23 r 3 m).
- Žiadny test (0 testov odkazuje na Dashboard).
*Dôsledok:* hlavné číslo produktu je pri bežných vstupoch zhruba dvojnásobne mimo modelu a protirečí stránke Scenáre. Je to zavádzajúce voči používateľovi (pravidlo kvality v `CLAUDE.md`).

**FN-02 [POTVRDENÝ PROBLÉM] Definícia `m` sa posunula bez rozhodnutia a symbol má dva významy.**
- D-031: `m` = **súčet sporenia a investícií** za 12 mesiacov, delený počtom mesiacov histórie (pri menej ako 12); `docs/00` ho volá „Mesačné sporenie (m)“.
- `context.ts:26` s odkazom na D-031 a D-040: `m` = **príjmy − všetky výdavky**.
- `COMPAVEN_MVP_SCOPE_V1.3.2_FINAL.1.md` (2026-11-10, nesledovaný): príjmy z transakcií + nájom + `incomes[]`, delené počtom mesiacov s dátami.
- Commit `672ffd6` pridal `incomes[]`; pracovný strom ich zase odstránil, delí vždy 12 a vynecháva mesiac snapshotu (`monthlyCashFlow.ts:10-39`).
- V `Decisions.md` po D-031 nie je žiadny záznam, ktorý by definíciu menil. D-346 uvádza, že výnimka z D-153 (zmena výpočtu počas pilota) nie je rozhodnutá.
*Dôsledok:* tri definície za štyri dni; rovnaký symbol pre „sporenie“ aj „voľný tok“ priamo vedie k chybám typu FN-01.

**FN-03 [POTVRDENÝ PROBLÉM] Tri rôzne „mesačné toky“ v aplikácii; plánované sa mieša so skutočným.**
| Obrazovka | Funkcia | Okno | Obsah |
|---|---|---|---|
| Nástenka, Ciele | `monthlyCashFlow` | 12 celých mesiacov pred mesiacom snapshotu, vždy /12 | len transakcie príjem/výdavok |
| Plánovanie | `planningEstimates` (`planningEstimates.ts:20-90`) | 6 mesiacov končiacich **dátumom** snapshotu | transakcie + **plánovaný nájom** `monthlyRentCents × 6` + **plánované** `incomes[] × 6` |
| Rozpočty | `monthSummary` (`BudgetPanel.tsx:24-32`) | mesiac | transakcie, pravidelné výdavky, splátky nehnuteľností a záväzkov (D-346) |
`planningEstimates` porušuje D-346 bod 4 (plánovaný nájom nie je skutočný príjem). Ak používateľ nájom alebo mzdu zapisuje aj ako transakciu príjem, **započíta sa dvakrát**. Komentár „6 úplných mesiacov“ nesedí, keď snapshot nie je k poslednému dňu mesiaca.

**FN-04 [POTVRDENÝ PROBLÉM] Plánovanie zobrazuje nesprávne veličiny pod nesprávnymi názvami.**
`PlanningPage.tsx:138-145`: „Príjmy (mesačne)“ = `cashFlow + savingInv + savingCash` (voľný tok plus sporenie, nie príjmy); „Výdavky (mesačne)“ = `savingInv + savingCash` (**sporenie a investície zobrazené ako výdavky**); tretia karta „Voľný tok“ = `ctx.m` s iným oknom a definíciou. Komentár v `planningEstimates.ts:11` tvrdí, že `savingInv` obsahuje sporenie; kód ho správne neobsahuje (zavádzajúci komentár).

**FN-05 [POTVRDENÝ PROBLÉM] COMPAVEN nespúšťa automatické splácanie hypoték a úverov.**
`amortizeMortgage` (D-137, D-347, `mortgage.ts:78-82`) a `amortizeLoan` volá iba legacy `src/ui/useAutomaticUpdates.ts:37`. V COMPAVEN ostáva `mortgageBalanceCents` taký, ako bol zadaný; neukladá sa ani `lastMortgagePayment`.
*Dôsledok:* splatená istina sa nikdy neprejaví v K_nem ani K_total; snapshoty ukladajú zastarané K_nem; legacy a COMPAVEN dajú pre rovnaké vstupy rôzny majetok.

**FN-06 [POTVRDENÝ PROBLÉM] Scenáre počítajú z inej východiskovej hodnoty než oficiálny cieľ; predvoľby sú arbitrárne.**
`monthlyInvestmentScenario.ts:32-33` počíta základ aj scenár z `ctx.capital` (K_pred: snapshot + neskoršie transakcie k dnešku), ale dátum ukotvuje k `ctx.latest.date` (`ScenarioPanel.tsx:62-63`). Oficiálny model (`context.ts:56-58`) používa K_L k dátumu snapshotu. Scenár „Realistický – aktuálny plán bez zmeny“ preto nesúhlasí ani s modelom, ani s nástenkou (FN-01). Predvoľby ±20 % mInv, ±10 % mCash, ±1,5 p. b. výnosu (`monthlyInvestmentScenario.ts`, `PREDEFINED_SCENARIOS`) nie sú v rozhodnutiach; vízia chce rozsah z predpokladov (r 2–6 %, `docs/00`).

**FN-07 [POTENCIÁLNE RIZIKO] Dvojité započítanie nájmu v projekcii.**
`rentalGoal.ts` pripočítava mesačne `netRent − splátka` do hotovosti, zatiaľ čo `mCash` je z nastavení alebo odvodené z histórie sporenia (`context.ts:45-46`). Ak používateľ nájom ukladá ako transakciu „sporenie“, odvodené `mCash` nájom už obsahuje a projekcia ho pripočíta druhýkrát. Podobne so splátkou hypotéky, ktorá znižuje historické sporenie.

**FN-08 [POTENCIÁLNE RIZIKO] Optimistické skreslenie výnosu.**
`netRealReturn` (`assumptions.ts:23-25`) orezáva na 0: poplatky vyššie než reálny výnos dajú 0 % namiesto záporného výnosu. Validátor nepripúšťa záporný reálny výnos (`validate.ts:428`) a povoľuje mieru výberu až 100 % (`validate.ts:427`).

**FN-09 [POTVRDENÝ PROBLÉM] Výber „posledného“ vyhodnotenia nie je deterministický pri rovnakom dátume.**
`context.ts:40` triedi len podľa dátumu. Ručné a automatické vyhodnotenie môžu mať rovnaký dátum, lebo OPRAVA B zrušila mazanie automatických (`indexeddb.ts:232-247`). Ktoré sa použije ako K_L, rozhodne poradie z úložiska (poradie kľúčov `id`), nie zámer používateľa.

**FN-10 [POTVRDENÝ PROBLÉM] Osobné ciele nie sú zosúladené s FIRE.**
- Komentár `PersonalGoal.monthlySavingCents` „počíta sa v mCash“ (`entities.ts:244`) je nepravdivý; FIRE motor ho nepoužíva (grep `src/domain`).
- K0 (`currentCapitalCents`) môžu byť peniaze, ktoré sú už v K_cash/K_inv, takže tie isté peniaze sú v K_FIRE aj ako kapitál cieľa (dvojité priradenie; pre investičné ciele to D-334 až D-336 riešia, pre osobné nie).
- Osobné ciele počítajú nominálne a lineárne `n = ceil((T − K0) / mGoal)` (`personalGoal.ts:185`), FIRE reálne s výnosom.
- Existujú **dva systémy cieľov:** `InvestmentGoal` (`entities.ts:220`, D-105, D-334 až D-336; v COMPAVEN UI nie je) a `PersonalGoal` (`entities.ts:234`; v COMPAVEN „Finančné ciele“, `App.tsx:354`).

**FN-11 [POTVRDENÝ PROBLÉM] Hodnota investícií sa medzi ručnými vyhodnoteniami nevyvíja.**
K_inv = posledné ručné vyhodnotenie + transakcie (`context.ts`, `ledger.ts`). Investičné položky sa v COMPAVEN nedajú zadať (A-05). Automatické vyhodnotenie v COMPAVEN nepripočíta výnos ani hodnotu pozícií (`snapshotBuilder.ts`; na rozdiel od `autoEvaluation.ts:49-56`).
*Dôsledok:* História ukazuje nulový výnos medzi ručnými vyhodnoteniami a rozklad „ostatné/výnos“ v ročnom prehľade je pri automatických vyhodnoteniach prakticky nula.

**FN-12 [POTENCIÁLNE RIZIKO] Záväzky raz áno, raz nie.**
K_total spotrebiteľské záväzky ignoruje (F-15), `monthSummary` ich splátky započíta do výdavkov (`monthSummary.ts:58-59`, Rozpočty), `m` nie. Pre používateľa s úverom tak Rozpočty a nástenka nesúhlasia.

Súvisiace nálezy z auditu (bez opakovania): dvojité započítanie v automatickom vyhodnotení (F-05), definícia `m` v prvom roku (F-16), NaN v rozpočte (F-17), UTC vs. lokálny dátum (F-18), záväzky v K_total (F-15).

### 3.2 Finančné invarianty, ktoré musia platiť v celej aplikácii

**Kapitál**
- **INV-01** K_total = K_inv + K_cash + K_nem (− ostatné záväzky, ak tak rozhodne O-06).
- **INV-02** K_FIRE = K_inv + K_cash; K_nem nikdy nevstupuje do K_FIRE ani do porovnania s cieľom T.
- **INV-03** K_nem = Σ (hodnota − zostatok hypotéky); každý zostatok úveru sa v K_total odpočíta práve raz (hypotéka v nehnuteľnosti XOR v záväzkoch).
- **INV-04** Transakcia typu príjem nemení K; mení len tok.
- **INV-05** Vnútorný presun (hotovosť ↔ investície) nemení K_FIRE ani K_total.
- **INV-06** Každá transakcia ovplyvní K práve raz: zmena K medzi dvoma vyhodnoteniami = kapitálové toky s dátumom v (D_prev, D_next] + výnos/trh (zvyšok).

**Čas a história**
- **INV-07** Transakcia s dátumom po dnešku (lokálne) nevstupuje do K ani do skutočných tokov; po nastaní dátumu práve raz.
- **INV-08** Vyhodnotenie s dátumom D obsahuje len transakcie s dátumom ≤ D.
- **INV-09** Vyhodnotenie je nemenné; história sa neprepočítava z aktuálnych dát.
- **INV-10** „Posledné“ vyhodnotenie je určené deterministicky (dátum, potom ručné pred automatickým, potom `createdAt`).
- **INV-11** V celej aplikácii platí jeden lokálny „dnes“.

**Toky**
- **INV-12** Každý zobrazený tok (`m`, príjmy, výdavky) má jednu definíciu a tú istú hodnotu na všetkých obrazovkách pre ten istý dátum.
- **INV-13** Plánované položky (`incomes[]`, plánovaný nájom, pravidelné výdavky ako plán) nikdy nie sú v súčtoch označených ako skutočné.
- **INV-14** Každá položka toku sa započíta práve raz (transakcia vs. evidencia prenájmu vs. splátka z Majetku; D-346 bod 7).

**Projekcia a cieľ**
- **INV-15** Každý zobrazený dátum cieľa pochádza z jedného motora (`goalMonths`) z K_L a nastavení; nástenka, Scenáre „bez zmeny“ a Ciele ukazujú pre rovnaké vstupy to isté číslo.
- **INV-16** Monotónnosť: vyššie r, mInv, mCash alebo p, prípadne nižšie V → dátum cieľa nie neskôr.
- **INV-17** K_FIRE ≥ T → 0 mesiacov; nedosiahnuteľný cieľ sa zobrazí ako „nedosiahnuteľné“, nikdy ako predvolené číslo (INV-24).
- **INV-18** Projekcia s prenájmom: hotovosť neklesne pod 0 bez upozornenia; po splatení hypotéky sa splátka neplatí; nájom vstupuje do projekcie raz.
- **INV-19** Reálne a nominálne hodnoty sa v jednom porovnaní nemiešajú, alebo sú zreteľne označené.

**Ciele a plán**
- **INV-20** Žiadne euro nie je priradené dvom cieľom a súčet priradení ≤ dostupný kapitál.
- **INV-21** Σ alokácií (mInv + mCash + Σ mGoal) sa porovnáva s tokom podľa tej istej definície ako INV-12.

**Dáta**
- **INV-22** Sumy sú celé centy; NaN, Infinity a nepovolené záporné hodnoty sa nikdy neuložia.
- **INV-23** Záloha → obnova je identita pre všetky používateľské kolekcie (okrem `exportedAt`).
- **INV-24** UI nikdy nezobrazí predvolenú konštantu ako údaj používateľa.
- **INV-25** Zostatok úveru k dátumu D je deterministická funkcia vstupov (zostatok, dátum zostatku, sadzba, splátka, mimoriadne splátky) a je rovnaký vo všetkých aplikáciách.

### 3.3 Hraničné testovacie scenáre, ktoré súčasné testy nezachytávajú

| ID | Scenár | Očakávaný výsledok | Odhalí |
|---|---|---|---|
| TS-01 | Ručné vyhodnotenie 30. 9.; potvrdenia vypnuté do 12. 11.; výdavok 1 000 € z hotovosti 5. 11.; otvorenie 12. 11. vytvorí automatické vyhodnotenie k 31. 10. | K_cash znížené o 1 000 € práve raz | F-05 |
| TS-02 | T = 648 649 €, K_FIRE = 100 000 €, mInv = 1 000 €, r = 3,5 % | Nástenka aj Scenáre „Realistický“ ≈ 278,8 mes. | FN-01, FN-06 |
| TS-03 | Vyhodnotenie existuje, nastavenia chýbajú | Nástenka nezobrazí cieľovú sumu ani dátum | FN-01, INV-24 |
| TS-04 | Nájom 800 € ako transakcia príjem a zároveň `monthlyRentCents = 800 €` | Príjem v Plánovaní 800 €/mes., nie 1 600 € | FN-03 |
| TS-05 | Príjem 3 000 €, výdavky 2 000 €, sporenie 500 €, investícia z príjmu 300 € | Plánovanie: príjmy 3 000, výdavky 2 000, alokácie 800 | FN-04 |
| TS-06 | Prvý mesiac používania (1 mesiac dát) | `m` = skutočný mesačný tok, nie jeho 1/12 | F-16, FN-02 |
| TS-07 | Hypotéka 150 000 €, 3,5 %, splátka 700 €, dátum zostatku pred 12 mesiacmi | K_nem v COMPAVEN = výsledok `amortizeMortgage` | FN-05, INV-25 |
| TS-08 | Ručné a automatické vyhodnotenie s rovnakým dátumom a rôznym K; rôzne poradie `id` | Vždy sa použije ručné | FN-09 |
| TS-09 | Reálny výnos 0,5 %, poplatky 1 % | Projekcia s −0,5 % alebo výslovné upozornenie | FN-08 |
| TS-10 | Prenájom so splátkou nižšou než mesačný úrok | Zostatok rastie, upozornenie, `cash_exhausted` v správnom mesiaci | INV-18 |
| TS-11 | Nájom ukladaný ako „sporenie“ + model prenájmov | Nájom v projekcii raz | FN-07 |
| TS-12 | Osobný cieľ K0 = 20 000 € pri K_cash = 20 000 € | Tie isté peniaze nie sú voľné pre FIRE aj cieľ | FN-10, INV-20 |
| TS-13 | Transakcia 1. 11. o 00:30 miestneho času (UTC 31. 10.) | Patrí do novembra vo všetkých moduloch | F-18, INV-11 |
| TS-14 | Transakcia s dátumom o 10 dní, zadaná pred koncom mesiaca | Nie je v K ani v toku, kým dátum nenastane; potom raz | INV-07 |
| TS-15 | Výdavok z investícií vyšší než K_inv | K_inv = 0 + upozornenie; rozklad v ročnom prehľade sedí | `capital.ts:101-106` |
| TS-16 | Osobné ciele, potvrdenia, príloha, rozpočet → export → import | Identita | F-02 až F-04, INV-23 |
| TS-17 | Prázdne pole limitu rozpočtu | NaN sa neuloží | F-17, INV-22 |
| TS-18 | Hypotéka vyššia než hodnota nehnuteľnosti | K_nem záporné, zrozumiteľne zobrazené; K_FIRE nedotknuté | INV-02, INV-03 |
| TS-19 | Ten istý úver ako hypotéka nehnuteľnosti aj ako záväzok | Odpočíta sa raz, výdavok raz, upozornenie (D-346) | INV-03, FN-12 |
| TS-20 | Rok len s automatickými vyhodnoteniami | Rozklad zmeny K sa presne sčíta na `deltaK` | FN-11, INV-06 |

**[ODPORÚČANIE]** Doplniť property-based generátor: náhodné postupnosti transakcií (typy, zdroje, budúce dátumy, rovnaké dni) a náhodné časy vyhodnotení; overovať INV-04 až INV-10, INV-12 a INV-23.

---

## 4. Produktová stratégia

**P-01 Aký problém aplikácia rieši najlepšie.**
Odpoveď na otázku *„Kedy môžem prestať byť závislý od zamestnania a ako ma tam posunie toto rozhodnutie?“* (`docs/00`: „Používateľ vidí, ako každé jeho finančné rozhodnutie posúva dátum“). Jadro na to existuje a je otestované: `goal.ts`, `capital.ts` a `rentalGoal.ts` (projekcia s hypotékou a nájmom), predbežný dopad `impactWithRentals`.
**[POTVRDENÝ PROBLÉM]** COMPAVEN 2.0 túto hlavnú hodnotu oproti legacy stratil: predbežný dopad rozhodnutia používa iba legacy (`src/features/transakcie/Transakcie.tsx`, `src/features/prehlad/Prehlad.tsx`), v `src/compaven-ui` ho nemá žiadna obrazovka okrem Scenárov, a hlavný dátum je nesprávny (FN-01).

**P-02 Čím sa môže odlišovať** (môj úsudok; konkurenciu som v tejto analýze neoveroval):
1. **Dohľadateľnosť každého čísla** — deterministický motor, viditeľné predpoklady, rozklad zmien.
2. **Nehnuteľnosti s pákou v projekcii FIRE** — amortizácia, nájom a hotovostné riziko (`rentalGoal.ts`); bežné rozpočtové aplikácie to zvyčajne nemodelujú.
3. **Lokálne-first súkromie bez účtov** (D-148).
4. **Slovenský a EÚ kontext** (register NBS D-333, návod na list vlastníctva `docs/26`).

**P-03 Nevyhnutné funkcie (jadro):** nastavenie cieľa s viditeľnými predpokladmi; mesačné vyhodnotenie; kapitál po zložkách (investície, hotovosť, nehnuteľnosti); dátum slobody ako **rozsah** s vysvetlením zmeny; predbežný dopad rozhodnutia pri zápise; nehnuteľnosti a hypotéky s amortizáciou; spoľahlivá a šifrovaná záloha; história vyhodnotení.

**P-04 Predčasné funkcie [ODPORÚČANIE odložiť]:**
- domácnosť s viacerými osobami a vlastníckymi podielmi (`OwnerRef` bez sémantiky, `OwnershipEditor` nepoužitý);
- scenáre s pevnými percentami (FN-06);
- rozpočty s vlastnou definíciou tokov (FN-03);
- história a analytika nad vyhodnoteniami bez výnosu (FN-11);
- cloud a synchronizácia; AI.

**P-05 Odstrániť alebo zjednodušiť [ODPORÚČANIE, vyžaduje rozhodnutie O-01]:**
- Z COMPAVEN vypustiť sklad, recepty, psov, nákupný zoznam, vyhodené potraviny, finančný kalendár, OCR/skener dokladov a prílohy, kým nie je jadro stabilné. Ostávajú v legacy alebo v archíve; dátový model COMPAVEN ich nemusí niesť.
- Zlúčiť osobné a investičné ciele do jedného modelu „cieľ s vyčlenenými peniazmi“ (FN-10).
- Zlúčiť „Príjmy a výdavky“ s „Transakciami“ a „Plánovanie“, „Scenáre“ a „Finančné ciele“ do jednej obrazovky „Plán“.
- Navigácia z 12 položiek na približne 6: **Prehľad, Zapísať, Majetok, Plán, História, Nastavenia** (vrátane zálohy).

**P-06 Čo má byť jadrom produktu.**
„Finančný denník rozhodnutí s FIRE motorom“: vstupy (transakcie, vyhodnotenia, nehnuteľnosti) → jeden motor → jeden dátum slobody s rozsahom → vysvetlenie, čo ho posunulo. Všetko ostatné je doplnok, ktorý sa pridá až po overení jadra pilotom (`docs/06`, fáza 1b).

---

## 5. UX a používateľská skúsenosť

**U-01 [POTVRDENÝ PROBLÉM] Žargón v hlavných metrikách.** Nadpisy „K_FIRE“, „K_total“, „K_nem“ (`Dashboard.tsx:122-124`); podnadpisy pomáhajú len čiastočne. Pre používateľa bez finančného vzdelania sú symboly bariérou.
**U-02 [POTVRDENÝ PROBLÉM] Protichodné čísla medzi obrazovkami** (FN-01, FN-03, FN-04, FN-06) — najväčšie ohrozenie dôvery.
**U-03 [POTVRDENÝ PROBLÉM] Orientácia.** 12 položiek navigácie (`Navigation.tsx`), duplicity („Príjmy a výdavky“ vs. „Transakcie“; „Finančné ciele“, „Plánovanie“ a „Scenáre“) a preklep „Nástennka“.
**U-04 [POTVRDENÝ PROBLÉM] Slepé cesty.** „Evidovať investície“ bez možnosti investíciu pridať (`Dashboard.tsx:234`, `App.tsx:147`); záväzky sa nedajú pridať (`LiabilitySection.tsx` iba zobrazuje a potvrdzuje).
**U-05 [POTVRDENÝ PROBLÉM] Skryté brány.** Automatické vyhodnotenie vyžaduje dve potvrdenia (`snapshotValidator.ts:27-35`), ktoré sa rušia pri každom uložení nehnuteľnosti a obnove (`indexeddb.ts:280-306`, `App.tsx:226-242`). Zablokovanie sa zapíše len do `console.debug` (`useAutomaticSnapshot.ts`).
**U-06 [POTVRDENÝ PROBLÉM] Zadávanie prenáša účtovníctvo na používateľa.** Šesť typov transakcií (`entities.ts:7`) a zdroje `z_hotovosti`/`z_investicii`/`z_prijmu`; používateľ musí pochopiť, prečo výdavok „z príjmu“ nemení kapitál (`capital.ts:95`).
**[ODPORÚČANIE]** Sprievodca otázkami („Odkiaľ si to zaplatil?“) s predvolenou voľbou a okamžitým predbežným dopadom.
**U-07 [POTVRDENÝ PROBLÉM] Vysoká vstupná bariéra.** Prvé vyhodnotenie je ručné so zadaním investícií a hotovosti (`SnapshotForm.tsx`; automatické vyžaduje existujúce, `useAutomaticSnapshot.ts`) — používateľ musí pochopiť pojmy skôr, než dostane prvý úžitok.
**U-08 [POTVRDENÝ PROBLÉM] Chýba vysvetlenie výsledkov.** COMPAVEN neukazuje predbežný dopad ani dôvod zmeny dátumu. Dobrý základ je rozklad v ročnom prehľade (`annualOverview.ts`, `flowsBetween`).
**U-09 [POTVRDENÝ PROBLÉM] Chybové stavy.** Tiché zlyhania (automatické vyhodnotenie, `getData` prehĺta chyby — F-19), obnova bez zhrnutia a so zavádzajúcim potvrdením (F-21).
**U-10 [OTVORENÁ OTÁZKA] Jedno číslo alebo rozsah.** Vízia požaduje dátum ako rozsah opatrný – základný – optimistický (`docs/00`); nástenka ukazuje jedno číslo (`Dashboard.tsx:165-176`), rozsah je len v Scenároch s inými percentami.

**[ODPORÚČANIE] Princípy na zníženie kognitívnej záťaže:**
1. Na prvej obrazovke jedna veta: „Pri dnešnom tempe budeš finančne nezávislý približne v rokoch X až Y“ a pod ňou „Od minulého mesiaca sa to posunulo o Z mesiacov, lebo…“.
2. Bežné názvy: „Peniaze na slobodu“, „Celý majetok“, „Nehnuteľnosti po odpočítaní hypotéky“; symboly len v detaile.
3. Postupné odkrývanie: predpoklady a vzorce v rozbaľovacom vysvetlení.
4. Každá blokujúca podmienka viditeľná s jedným tlačidlom na vyriešenie.
5. Onboarding podľa existujúceho návrhu `docs/20` so vzorovými hodnotami.

---

## 6. Budúca dátová architektúra

### 6.1 Súčasný stav (overené)
- IndexedDB v prehliadači, 22 úložísk, bez účtov; záloha = celý JSON, v COMPAVEN nešifrovaný (legacy má návrh a implementáciu šifrovania, `docs/38`).
- Mazanie je tvrdé (`this.db.delete`), bez záznamov o zmazaní; ID = `Date.now` v base36 + 6 znakov z `Math.random` (`src/ui/kit/ids.ts`).
- Väčšina entít má `createdAt`/`updatedAt`; `Settings` a `Budget` nemajú `createdAt` a vnorené polia (`rentalLedger` v `Property`, `members` v `Household`) sú hrubé jednotky konfliktu.
- Dve verzie (A-06); riziko vymazania dát v Safari na iOS (`docs/06`, D-042).

### 6.2 Predpoklady pre akúkoľvek synchronizáciu (nezávisle od dodávateľa)
**[ODPORÚČANIE]**
1. UUID z `crypto.randomUUID()`.
2. `updatedAt` a `deletedAt` (tombstone) pri každom zázname.
3. Verzia záznamu.
4. Migračný rámec (A-06).
5. Výpočty výlučne na klientovi.
6. **Denník zmien (append-only)**: rieši konflikty, audit a zároveň víziu „záznam rozhodnutí“ (`docs/00`).
7. Vnorené zoznamy (evidencia prenájmu) ako samostatné záznamy.

### 6.3 Porovnanie alternatív

| | A: Lokálne + šifrované zálohy | B: Lokálne-first + E2E šifrovaná synchronizácia cez úložisko používateľa | C: Lokálne-first + vlastný sync server s ciphertextom | D: Cloud ako primárna databáza |
|---|---|---|---|---|
| Viac zariadení | ručne (export/import) | áno, s oneskorením | áno | áno |
| Súkromie | najvyššie | vysoké (kľúč u používateľa) | vysoké (server vidí len metadáta) | nižšie (server vidí dáta) |
| Zložitosť | nízka | stredná (konflikty na úrovni súborov) | vysoká (protokol, autentifikácia, prevádzka) | stredná až vysoká |
| Prevádzka a náklady | žiadne | žiadne až nízke | priebežné | priebežné |
| Konflikty | nevznikajú | časté pri súbežných úpravách | riešiteľné po záznamoch | riešené serverom |
| GDPR a regulácia | minimálne | nízke | stredné (šifrované osobné údaje ostávajú osobnými údajmi — treba právne posúdenie) | vysoké |
| Závislosť od dodávateľa | žiadna | nízka | stredná | vysoká |
| Offline | plne | plne | plne | obmedzene |
| Hlavné riziko | strata zariadenia bez zálohy | strata kľúča = strata dát | bezpečnosť servera a protokolu | únik dát, uzamknutie u dodávateľa |

**[ODPORÚČANIE]**
- **Na 12 mesiacov variant A** v spevnenej podobe: round-trip záloha, šifrovanie, pripomienky exportu, kópia na externé médium. Paralelne pripraviť dátový model podľa 6.2.
- **B alebo C** až keď pilot potvrdí reálnu potrebu viacerých zariadení.
- **D** až pri bankových integráciách (PSD2) a po právnom posúdení.
- Cloudovú architektúru neodporúčam len preto, že je modernejšia. Nesledovaný dokument `docs/technicka-analyza-internet-2026-11-08.md` odporúča Vercel + Supabase, čo je v rozpore so smerom D-270/D-271 (Cloudflare); nie je to rozhodnutie (O-12).

### 6.4 Konflikty, migrácie a exportovateľnosť
- **Konflikty [ODPORÚČANIE]:** transakcie a vyhodnotenia nemenné (oprava = nový záznam); nastavenia a jednoduché entity podľa posledného zápisu na úrovni poľa; zmazania cez tombstone; zoznamy v nehnuteľnostiach rozdeliť na samostatné záznamy.
- **Migrácie:** jedna verzia dátového modelu, čisté a otestované migrácie; koncept `READABLE_SCHEMA_VERSIONS` (`types.ts:10`) rozšíriť na fixtures každej verzie.
- **Nezávislosť:** zdokumentovaná otvorená schéma JSON, export transakcií do CSV, šifrovanie heslom používateľa. Žiadny proprietárny formát.

---

## 7. AI a pokročilá analytika

**Zásady [ODPORÚČANIE]:**
1. **Deterministický motor je jediný zdroj čísel.** AI dostane štruktúrované fakty (výstupy motora a rozklad zmien) a vráti text; nikdy nepočíta ani nezapisuje do úložiska.
2. **Kontrola výstupu:** každé číslo v texte AI sa overí voči faktom; ak nesedí, text sa nezobrazí.
3. **Dobrovoľnosť a súkromie:** výslovný súhlas, minimalizácia dát, voľba lokálneho alebo EÚ poskytovateľa; bez súhlasu nič neopustí zariadenie.
4. **Žiadne personalizované investičné odporúčania.** Investičné poradenstvo je regulované (MiFID II, NBS); `docs/06` už uvádza právne riziko rozsahov výnosu. Iba vysvetlenie a vzdelávanie.
5. **Predpoklad:** AI nad nekonzistentnými číslami (FN-01 až FN-04) by nedôveru zosilnila, preto až po P0/P1.

| Použitie | Hodnota | Riziko | Deterministický predpoklad | Odporúčanie |
|---|---|---|---|---|
| Vysvetlenie mesačnej zmeny dátumu a majetku | vysoká | nízke | rozklad zmien (`flowsBetween`, `annualOverview.ts`) | P4, prvý kandidát |
| Neobvyklé výdavky | stredná | nízke | štatistika po kategóriách (bez AI) | najprv bez AI, AI len na formuláciu |
| Kategorizácia transakcií a dokladov | stredná | stredné (chyby) | potvrdenie používateľom | P4–P5 |
| Trendy | stredná | nízke | deterministické agregácie | bez AI |
| Upozornenia na riziká | vysoká | nízke | pravidlá (hotovosť pod 0, rastúci zostatok úveru, rezerva pod cieľom) | pravidlá v P1–P2, AI len na text |
| Scenáre v prirodzenom jazyku („čo ak kúpim auto za 20 000 €“) | stredná | stredné | AI navrhne parametre, motor počíta, používateľ potvrdí | P5 |
| Personalizované odporúčania | — | vysoké (regulácia) | — | **nerobiť** |

---

## 8. Roadmapa na 12 až 24 mesiacov

Hodnotenie 1–5 (5 = najvyššie): **Prínos**, **Náročnosť**, **Riziko** (pri realizácii), **Naliehavosť**.

### P0 — nevyhnutné pred ďalším rozvojom (0–2 mesiace)
| ID | Úloha | Prínos | Nároč. | Riziko | Naliehav. | Závislosti |
|---|---|---|---|---|---|---|
| P0-1 | Zmrazenie nových funkcií; jedna hlavná vetva; commit a push rozpracovanej práce | 5 | 2 | 2 | 5 | O-02 |
| P0-2 | Round-trip zálohy a obnovy (F-02 až F-04, F-17, F-21) + test TS-16 | 5 | 3 | 2 | 5 | P0-1 |
| P0-3 | Jeden FIRE motor pre všetky obrazovky (FN-01, FN-06) + testy nástenky TS-02, TS-03 | 5 | 2 | 2 | 5 | — |
| P0-4 | Jedna definícia tokov (FN-02 až FN-04) zapísaná ako D-xxx + testy TS-04 až TS-06 | 5 | 3 | 3 | 5 | O-04 |
| P0-5 | Dvojité započítanie v automatickom vyhodnotení (F-05) + deterministický výber (FN-09) | 5 | 2 | 2 | 5 | — |
| P0-6 | XSS a CSP (F-06) | 4 | 1 | 1 | 5 | — |
| P0-7 | Testovacia infraštruktúra úložiska + kostra E2E pre COMPAVEN (F-08 až F-10) | 4 | 3 | 2 | 5 | — |
| P0-8 | Amortizácia hypoték a úverov v COMPAVEN (FN-05) alebo výslovné rozhodnutie | 4 | 2 | 2 | 4 | O-08 |
| P0-9 | Finančný slovník a register invariantov INV-01 až INV-25 ako testy | 5 | 3 | 1 | 4 | P0-3, P0-4 |

**Brána P0:** všetky invarianty z 3.2 majú test; nástenka, Scenáre a Ciele ukazujú pre rovnaké vstupy rovnaký dátum; záloha je identita; `tsc` a `vitest` sú zelené; rozhodnutia sú zapísané.

### P1 — základné produktové funkcie (2–6 mesiacov)
| ID | Úloha | Prínos | Nároč. | Riziko | Naliehav. | Závislosti |
|---|---|---|---|---|---|---|
| P1-1 | Verziované zápisy a ochrana obnovy REAL (PHASE 1B.2) | 4 | 3 | 3 | 4 | P0-7 |
| P1-2 | Validácia pri zápise (rovnaká ako pri importe) | 4 | 3 | 2 | 4 | P0-2 |
| P1-3 | Predbežný dopad rozhodnutia pri zápise transakcie (návrat jadra z legacy) | 5 | 2 | 2 | 4 | P0-3 |
| P1-4 | Dátum slobody ako rozsah + vysvetlenie zmeny | 5 | 3 | 2 | 4 | P0-3, O-05 |
| P1-5 | Zadávanie investícií a záväzkov, alebo odstránenie ich ponúk z UI | 4 | 2 | 1 | 3 | O-01 |
| P1-6 | Jeden model cieľov (FN-10) | 4 | 3 | 3 | 3 | O-07 |
| P1-7 | Záväzky v K_total podľa rozhodnutia (FN-12) | 3 | 2 | 2 | 3 | O-06 |
| P1-8 | Migračný rámec a jedna verzia dát (A-06) | 4 | 3 | 3 | 3 | P0-2 |

### P2 — zlepšenie používateľskej skúsenosti (4–9 mesiacov)
| ID | Úloha | Prínos | Nároč. | Riziko | Naliehav. |
|---|---|---|---|---|---|
| P2-1 | Navigácia z 12 na ~6 položiek; zlúčenie Plánu, Scenárov a Cieľov | 4 | 3 | 2 | 3 |
| P2-2 | Bežné názvy metrík, postupné odkrývanie, vysvetlenia | 5 | 2 | 1 | 3 |
| P2-3 | Onboarding (`docs/20`) so vzorovými hodnotami | 4 | 3 | 1 | 3 |
| P2-4 | Viditeľné blokujúce podmienky a chyby (U-05, U-09) | 4 | 2 | 1 | 3 |
| P2-5 | PIN a šifrovaný export v COMPAVEN | 4 | 2 | 1 | 3 |
| P2-6 | Prístupnosť (axe) a mobilné rozloženie s E2E | 3 | 3 | 1 | 2 |
| P2-7 | Plán ukončenia legacy a migrácie dát z `financna-sloboda` | 4 | 3 | 3 | 3 |

### P3 — rozšírenie architektúry (6–15 mesiacov)
| ID | Úloha | Prínos | Nároč. | Riziko | Naliehav. |
|---|---|---|---|---|---|
| P3-1 | Dátový model pre synchronizáciu (UUID, tombstones, denník zmien) | 4 | 4 | 3 | 2 |
| P3-2 | Nasadenie REAL a SANDBOX na oddelené originy s ochranou (D-271) | 3 | 2 | 2 | 2 |
| P3-3 | Import bankových výpisov z CSV (`docs/06`, krok pred PSD2) | 4 | 3 | 2 | 2 |
| P3-4 | Pilot synchronizácie B alebo C (po potvrdení potreby) | 3 | 4 | 4 | 1 |
| P3-5 | Rozdelenie `App.tsx`, odstránenie `any`, dizajnové tokeny | 3 | 3 | 2 | 2 |

### P4 — pokročilé funkcie (12–24 mesiacov)
| ID | Úloha | Prínos | Nároč. | Riziko | Naliehav. |
|---|---|---|---|---|---|
| P4-1 | Vrstva vysvetlení s AI (dobrovoľná, nad deterministickými faktami) | 4 | 3 | 3 | 1 |
| P4-2 | Deterministická detekcia neobvyklých výdavkov | 3 | 2 | 1 | 1 |
| P4-3 | Pripomienky daňových termínov bez výpočtu dane (`docs/52`) | 3 | 2 | 2 | 1 |
| P4-4 | Viac zariadení v produkcii | 3 | 4 | 4 | 1 |

### P5 — experimentálne
- Napojenie na banky cez PSD2 agregátor (vyžaduje licenciu alebo partnera a právne posúdenie).
- Domácnosť s viacerými osobami a vlastníckymi podielmi vo výpočtoch.
- Natívna mobilná aplikácia.
- AI otázky nad vlastnými dátami s citáciou čísel z motora.
- Trhové ceny investícií (N-26).

---

## 9. Kritické závery

**9.1 Čo by som ako hlavný architekt urobil ako prvé.**
1. Zmrazil nové funkcie a zabezpečil celú prácu v jednej vetve.
2. Napísal **register definícií a invariantov** (oddiel 3.2) a ku každému test.
3. Napojil nástenku, Scenáre a Ciele na jeden motor (FN-01) a opravil Plánovanie (FN-04).
4. Spravil zálohu ako overenú identitu (F-02 až F-04).
Až potom by som riešil čokoľvek ďalšie.

**9.2 Päť rozhodnutí, ktoré by som spochybnil.**
1. **Dve aplikácie nad spoločným úložiskom a doménou v jednom repozitári s mnohými vetvami** (A-01, A-02) — zdroj väčšiny nečakaných regresií.
2. **Predefinovanie `m` bez rozhodnutia a pod rovnakým symbolom** (FN-02) — porušuje D-031 aj proces z `CLAUDE.md`.
3. **Brána potvrdení OPRAVA B** (dve zaškrtnutia, ktoré sa rušia pri každej zmene nehnuteľnosti) — vytvára tiché blokovanie (U-05) a spúšťa dvojité započítanie (F-05). Kontrolu úplnosti by som robil pri ručnom vyhodnotení, nie ako bránu automatického.
4. **Rozširovanie rozsahu pred spoľahlivosťou jadra** (sklad, recepty, psy, OCR, domácnosť s podielmi, dva systémy cieľov) — `docs/06` samo uvádza riziko „pretiahnutý rozsah“.
5. **Riadenie projektu iteratívnymi dokumentmi namiesto testov a rozhodnutí** (A-10) — 122 nesledovaných verzií plánov, audity auditov.
Navyše: prísna kontrola mena databázy, ktorá znemožnila testy (F-09).

**9.3 Tri veci, ktoré by som určite nemenil.**
1. **Čistá deterministická doména v celých centoch s golden cases a property testami** (`src/domain`, `tests/invariants.property.test.ts`).
2. **Lokálne-first súkromie bez účtov** (D-148) ako predvolený model.
3. **Oddelenie K_FIRE od K_nem a viditeľné predpoklady** (V, p, r, rezerva) — finančne korektné a odlišujúce.

**9.4 Čo by som v tejto fáze vôbec nevyvíjal.** Synchronizáciu a cloud, bankové integrácie, AI odporúčania, domácnosť s vlastníckymi podielmi, sklad, recepty, nákupy, psov, OCR a skener dokladov v COMPAVEN, ďalšie analytické grafy, nové typy scenárov.

**9.5 Najväčšie riziká projektu.**
1. **Nesprávne čísla vedú k zlým životným rozhodnutiam a strate dôvery** (FN-01, F-05) — pre finančný nástroj existenčné.
2. **Strata dát:** neobnoviteľné zálohy, jedno zariadenie, vymazanie v Safari, osirelá databáza (F-01 až F-04).
3. **Zlučovanie divergentných vetiev** (A-02).
4. **Kapacita a motivácia zakladateľa** pri procese s vysokou réžiou (`docs/06` to uvádza ako riziko; A-10).
5. **Regulácia** pri vstupe do EÚ (investičné odporúčania, GDPR, PSD2) — zatiaľ vzdialené, ale ovplyvňuje návrh AI a cloudu.

**9.6 Čo spôsobí, že aplikácia bude o dva roky ťažko udržiavateľná.** Viac definícií toho istého ukazovateľa v UI; výpočty v komponentoch; dve aplikácie nad spoločnou vrstvou; verzie schémy viazané na vetvy; neotestované úložisko a UI; dátový model s nepoužívanými entitami; rozhodnutia v nesledovaných dokumentoch; `any` a duplicitné typy.

**9.7 Tri strategické rozhodnutia pred ďalším rozvojom.**
1. **Čo je produkt:** úzky nástroj na rozhodovanie o finančnej slobode, alebo široká aplikácia pre domácnosť? (O-01; odporúčam úzky.)
2. **Jedna kódová základňa:** osud legacy, hlavná vetva a migračná cesta dát používateľov M1 (O-02).
3. **Dátový horizont:** jedno zariadenie so spoľahlivou zálohou na 12 mesiacov, alebo synchronizácia? Rozhodne, či sa dátový model upravuje už teraz (O-03; odporúčam jedno zariadenie a prípravu modelu).

---

## 10. Otvorené rozhodnutia

| ID | Rozhodnutie | Môj návrh |
|---|---|---|
| O-01 | Rozsah produktu | úzky FIRE nástroj; vypustiť moduly domácnosti a spotreby z COMPAVEN |
| O-02 | Legacy aplikácia a hlavná vetva | legacy zmraziť na `m1-release-preparation`, COMPAVEN na jednej vetve, naplánovať migráciu |
| O-03 | Jedno zariadenie vs. synchronizácia | 12 mesiacov jedno zariadenie + príprava dátového modelu |
| O-04 | Definícia `m` a tokov (D-031 vs. súčasný kód) | oddeliť symboly: „mesačné sporenie“ (D-031) a „voľný tok“; jedna funkcia; zapísať ako D-xxx |
| O-05 | Hlavný dátum ako číslo alebo rozsah | rozsah podľa `docs/00` |
| O-06 | Záväzky v K_total | odpočítať; zobraziť rozpis |
| O-07 | Osobné a investičné ciele | jeden model s vyčlenením peňazí |
| O-08 | Amortizácia v COMPAVEN | áno, rovnaká funkcia ako legacy |
| O-09 | Projekcia prenájmov vs. história sporenia (FN-07) | projekcia používa model prenájmov a z histórie nájom vylúči, alebo opačne — jedno pravidlo |
| O-10 | Záporný reálny výnos | povoliť v projekcii, upozorniť |
| O-11 | AI | až po P0/P1; len vysvetlenia; dobrovoľne |
| O-12 | Smer cloudu (Cloudflare vs. Vercel + Supabase) | odložiť do P3; rozhodnúť podľa O-03 |
| — | Otvorené rozhodnutia 1–11 z odovzdávacieho dokumentu (oddiel 10) | platia naďalej |

---

## Príloha A — Hlavné zdroje dôkazov
`src/compaven-ui/Dashboard.tsx`, `PlanningPage.tsx`, `PersonalGoalsPage.tsx`, `ScenarioPanel.tsx`, `BudgetPanel.tsx`, `Navigation.tsx`, `App.tsx`, `useAutomaticSnapshot.ts`; `src/domain/context.ts`, `capital.ts`, `goal.ts`, `rentalGoal.ts`, `ledger.ts`, `monthlyCashFlow.ts`, `planningEstimates.ts`, `monthlyInvestmentScenario.ts`, `personalGoal.ts`, `mortgage.ts`, `property.ts`, `assumptions.ts`, `model/entities.ts`, `model/household.ts`; `src/app/snapshotBuilder.ts`, `autoEvaluation.ts`, `snapshotValidator.ts`; `src/storage/indexeddb.ts`, `validate.ts`, `backup.ts`, `types.ts`; `src/ui/useAutomaticUpdates.ts`, `src/ui/kit/ids.ts`; `vite.config.ts`; `docs/00`, `docs/06`; `decisions/Decisions.md` (D-031, D-137, D-148, D-153, D-268, D-270, D-271, D-334 až D-336, D-346, D-347); `COMPAVEN_2.0_TARGET_ARCHITECTURE.md`; `COMPAVEN_MVP_SCOPE_V1.3.2_FINAL.1.md` (nesledovaný).

## Príloha B — Vzťah k záverečnému auditu 2026-11-12
- **Nové oproti auditu:** FN-01 (vzorec nástenky), FN-03 a FN-04 (Plánovanie), FN-05 (amortizácia), FN-06, FN-07 až FN-11, A-01 až A-12, celý produktový, UX a dátový pohľad. Audit nástenku nepreveril a FN-01 prehliadol.
- **Oprava údaja v odovzdávacom dokumente:** v koreni je 122 nesledovaných `.md`, nie 127 (127 je počet všetkých `.md` v koreni vrátane sledovaných).
- Nálezy F-01 až F-24 ostávajú v platnosti.
