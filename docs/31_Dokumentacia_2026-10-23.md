# 31 – Kontrola dokumentácie voči kódu (2026-10-23)

> Stav k 2026-10-23. Vetva `claude/phase2-property-card`, HEAD `455b599` pri spustení. Agent `docs` (`.claude/agents/docs.md`). Zmeny len v `README.md`, `CLAUDE.md` a `docs/`. `src/`, `tests/`, `package.json`, `.github/` a `decisions/Decisions.md` sa nemenili. Existujúce audity (`docs/NN_Audit_*`, `docs/NN_Zavislosti_*`, `docs/NN_Testy_*`, `docs/NN_Vypocty_*`) sa nemenili. Nič nie je commitnuté.

## 1. Zhrnutie

- **Opravené súbory:** 5 (`CLAUDE.md`, `README.md`, `docs/07_Testing_Strategy.md`, `docs/13_Zoznam_obrazoviek.md`, `docs/Podklad_pravne_posudenie.md`). Rozsah `git diff --stat`: 10 riadkov pridaných, 8 odstránených.
- **Počet opráv:** 12 (oddiel 2).
- **Nezhody bez opravy:** 13 (oddiel 3). **Finančné položky na overenie:** 4 (oddiel 4).
- **Overené v tomto behu:** `npx vitest run` (75 súborov, 405 prejde, 6 skip, 3 todo, exit 0); `npx tsc --noEmit` (exit 0); `npx playwright test --list` (362 testov v 84 súboroch). Beh E2E ani `vite build` sa nespúšťal.

## 2. Opravy

| # | Súbor:riadok | Pôvodný údaj | Nový údaj | Dôkaz |
|---|---|---|---|---|
| 1 | `CLAUDE.md:4` | „D-001 až D-072“ | „D-001 až D-252; v tabuľke chýba D-132“ | `grep -c "^| D-" decisions/Decisions.md` = 251; prvý D-001, posledný D-252; jediná medzera D-132 |
| 2 | `CLAUDE.md:6` | „`vitest` 358 jednotkových testov (66 súborov)“ | „`vitest` 405 jednotkových testov prejde (75 súborov; 6 preskočených `it.skip`, 3 `it.todo`)“ | `npx vitest run`: „Test Files 75 passed (75)“, „Tests 405 passed | 6 skipped | 3 todo (414)“ |
| 3 | `CLAUDE.md:6` | „`vite build` (dist-test) bez chýb“ (bez označenia) | doplnené „v behu 2026-10-23 nespustený“ | build sa v tomto behu nespúšťal; nie je overený |
| 4 | `CLAUDE.md:6` | „`playwright` 362 E2E testov … bez zlyhaní“ | „výpis overený 2026-10-23, beh bez zlyhaní prevzatý z `docs/27`“ | `npx playwright test --list`: „Total: 362 tests in 84 files“; beh sa nespúšťal |
| 5 | `CLAUDE.md:6` | odkaz na audity `docs/22` a `docs/24` | pridaný `docs/27_Audit_2026-10-23.md` | súbor existuje; je to najnovší audit v `docs/` |
| 6 | `README.md:3` | „Nový projekt, zatiaľ vo fáze objavovania (discovery).“ | „Projekt je vo fáze MVP (stav k 2026-10-23, pozri `CLAUDE.md`): rozhodnutia … kód je čiastočne implementovaný.“ | `CLAUDE.md:4`; `src/` obsahuje doménu, UI a úložisko; 75 testových súborov |
| 7 | `README.md` (oddiel Štruktúra) | chýbali `src/` a `tests/` | doplnené `src/` a `tests/` | `ls src tests` |
| 8 | `docs/13_Zoznam_obrazoviek.md` (riadok tabuľky) | „Pravidelné príjmy“ | „Príjmy“ | `src/app/navigation.ts:10`: `prijmy: "Príjmy"` |
| 9 | `docs/13_Zoznam_obrazoviek.md` (riadok tabuľky) | „Rozpočet kategórií“ | „Rozpočet“ | `src/app/navigation.ts:11`: `rozpocet: "Rozpočet"` |
| 10 | `docs/07_Testing_Strategy.md:72` (GC-09) | „K = 0, m = 500, r = 4 %“ (bez T) | „K = 0, m = 500, r = 4 %, T = 600 000 €“ | `tests/monthsToTarget.test.ts:73`: `monthsToTarget(0, eur(500), 0.04, eur(600_000))`; výsledok 488,02 platí len pre T = 600 000 (potvrdené aj v `docs/29`, GC-09) |
| 11 | `docs/Podklad_pravne_posudenie.md:22` | „(`src/app/pin.ts`)“ | „(`src/features/zamok/pin.ts`)“ | `src/app/pin.ts` neexistuje; PBKDF2 je v `src/features/zamok/pin.ts:3,20–21` |
| 12 | `docs/Podklad_pravne_posudenie.md:57` | „PIN a jeho obnova (`src/app/pin.ts`)“ | „PIN a jeho obnova (`src/features/zamok/pin.ts`, `src/features/zamok/Lock.tsx`)“ | obnova (zabudnutý PIN, vymazanie údajov) je v `Lock.tsx:85–88`; `pin.ts` ju neobsahuje |

Opravy 8 a 9 menia len názov riadku. Stav riadku („na vetve“) sa nemení, viď N-01.

## 3. Nezhody bez opravy

Tieto položky sa neopravovali, lebo ide o rozhodnutie, zmenu požiadavky alebo nejasnú definíciu. Pri každej je uvedené, kto má rozhodnúť.

| # | Dokument vs. kód / rozhodnutie | Prečo neopravené | Odporúčanie, kto rozhodne |
|---|---|---|---|
| N-01 | `docs/13` stav „na vetve“ pri Vyhodnotenie (zoznam a mazanie), Majetok, Investície, Záväzky, Príjmy, Pravidelné výdavky, Rozpočet, Sklad, Dane, Ročný prehľad | Podľa definície v `docs/13` („kód nie je na `main`“) je kód na `origin/main`: `git ls-tree origin/main src/features/` obsahuje všetky tieto priečinky; `origin/main:src/ui/Sekcie.tsx` má vetvy pre všetkých 14 sekcií; `navigation.ts` je na `origin/main` zhodný. HEAD má o 8 commitov viac než `origin/main` a nemá žiadny chýbajúci commit; v `src/` sa líši len `src/domain/impact.ts`. Lokálna vetva `main` (4375a41) je 231 commitov za HEAD a nie je referenciou. Verejná zostava má `VITE_PHASE2 "0"` (`.github/workflows/pages.yml:28`) a `PHASE2_ENABLED` (`src/app/features.ts:5`), takže tieto obrazovky sú vo verejnej zostave skryté. Nebol spustený `git fetch`, aktuálny stav GitHubu nie je overený. | Zakladateľ určí, čo znamená „na main“ (`origin/main`, alebo verejná zostava). Potom docs-agent upraví stĺpec Stav v `docs/13`. |
| N-02 | `docs/13` uvádza „Pripomienky“ ako obrazovku | `navigation.ts` nemá sekciu „Pripomienky“. Pripomienky sú súčasťou Prehľadu (`src/features/prehlad/Prehlad.tsx:5, 21`, `src/domain/reminders.ts`). | Zakladateľ alebo docs-agent: buď zapísať ako súčasť Prehľadu, alebo ponechať ako samostatný bod. |
| N-03 | `docs/13` má dva oddiely „## 4“ („Poradie implementácie“ a „Ročný prehľad“) | Kód cituje „docs/13, oddiel 4“ pre Ročný prehľad (`src/domain/annualOverview.ts:62`, `src/features/rocny-prehlad/RocnyPrehlad.tsx:15`). Prečíslovanie by rozbilo komentáre v kóde, na ktoré nemám zápis. | Vlastník kódu a dokumentu spolu: prečíslovať a zmeniť komentáre v kóde v jednom kroku. |
| N-04 | `docs/13`, oddiel „Nálezy kroku 1 (2026-10-20)“: „Všetkých 11 sekcií“, „88 na oboch profiloch“ | Datovaný historický záznam. Navigácia má dnes 14 sekcií; počty z 2026-10-20 nie sú overené v tomto behu. | Ponechané ako historický záznam. Ak sa má aktualizovať, urobí to vlastník. |
| N-05 | `docs/09_Navrh_Nehnutelnosti_Dane.md:52` odkazuje na `docs/16_Development_Plan.md` a `PROJECT_CHECKPOINT.md` | Obidva súbory v repozitári nie sú. `docs/16` je `16_Rodinna_verzia.md`. Nie je jasné, ktorý dokument plán nahrádza (`docs/06_Roadmap.md`?). | Zakladateľ: buď obnoviť súbor, alebo určiť náhradu. Odkaz nemením tipom. |
| N-06 | `docs/09_Navrh_Nehnutelnosti_Dane.md:5` odkazuje na `docs/19_Idea_Backlog.md`, položky 1 a 2, z 2026-10-16 | Súbor neexistuje. Kandidát `docs/08_Backlog_Napady.md` má dátum v0.1 2026-10-14 a nie je overené, že jeho položky sú tie isté. | Vlastník projektu: potvrdiť zdrojový zoznam a opraviť odkaz. |
| N-07 | `docs/07_Testing_Strategy.md:128` tvrdí, že fixture `tests/fixtures/export-v1.json` „sa importuje v každom vydaní“ | Súbor v `tests/fixtures/` nie je (sú tam len `ean13-synthetic.png`, `integracia-syntetika.json`, `lv-synthetic*.html`). Nezistené, či niektorý iný súbor túto úlohu plní. | Vlastník testov: doplniť fixture, alebo zmeniť vetu na plán. |
| N-08 | `docs/21_Architektura_moduly_NAVRH.md:127–128` (krok 4): register modulov v `src/modules/registry.ts`; dokument uvádza, že kroky 1 a 4–7 sú hotové | `src/modules/` neexistuje. Register je v `src/app/modules.ts` (`CORE_SECTION_IDS`, `OPTIONAL_MODULES`) bez polí návrhu `requires`, `effectText`, `dataKeys`, `autoJobs`. `PHASE2_SECTION_IDS` a `isPhase2Section` v `src/` nie sú. | Zakladateľ a autor návrhu: aktualizovať návrh na skutočný stav, alebo krok 4 označiť ako čiastočný. |
| N-09 | Dve čísla dokumentov: `docs/08` (`08_Backlog_Napady`, `08_Navrh_vynosovej_sadzby`), `docs/21` (`21_Architektura_moduly_NAVRH`, `21_Pracovny_zapis_pojem_a_nazov`), `docs/24` (`24_Audit_2026-10-23`, `24_Tok_obrazoviek`) | Premenovanie by rozbilo odkazy (napr. `docs/24` v `CLAUDE.md`). Nové súbory dostanú nasledujúce voľné číslo. | Vlastník projektu, pri ďalšej úprave číslovania. |
| N-10 | `decisions/Decisions.md`: chýba D-132 | Tabuľka má 251 riadkov, D-001 až D-252. Nezistené, či ide o zámer. Súbor patrí zakladateľovi a nemení sa. | Zakladateľ. |
| N-11 | `docs/04_Functional_Requirements.md:131` („Sumy: EUR na celé eurá v zobrazení“) a `docs/07_Testing_Strategy.md:40` (FR-06 „zobrazenie sumy v celých eurách“) | D-144 (2026-10-21) určuje, že peniaze sa zobrazujú vždy s centami. Kód a `tests/format.test.ts` sú podľa D-144 (potvrdené v `docs/29` bod 5). Dokument odporuje rozhodnutiu. | Zakladateľ potvrdí; potom vlastník požiadaviek upraví FR-06 a `docs/07` §2. Nemením požiadavku bez rozhodnutia. |
| N-12 | `docs/04:131` a `docs/07:40`, `docs/07:76` (GC-13): nominatív „august 2054“, „marec 2038“ | Kód používa genitív (`src/ui/kit/format.ts:3, 17`: pole `MONTHS` a `monthYear`); test `tests/format.test.ts:17` očakáva „októbra 2026“. Viď `docs/29` bod 4. | Zakladateľ určí tvar mesiaca; potom sa zosúladí dokument a test. |
| N-13 | `docs/24` a `docs/27` uvádzajú „zlúčenie do main (8943d4c, D-251)“ | `8943d4c` je na `origin/main` (posledný záznam tam je D-250). Záznam D-251 je v HEAD, nie v `origin/main`. Lokálny `main` je zastaraný. Informatívne. | Vlastník projektu: skontrolovať, kde je záznam D-251 po zlúčení. |

Ďalšie zistenia z kontroly kódu, ktoré nie sú v dokumentoch a treba ich nahlásiť: kód sa nemenil. Nálezy z `docs/27`, `docs/29` a `docs/30` (napr. T1 až T9 v `docs/30`, A-02 až A-05 v `docs/27`) sú nálezy kódu, nie dokumentácie. Tento report ich neopravuje.

## 4. Finančné tvrdenia na overenie

| # | Tvrdenie | Kde | Stav overenia | Odporúčanie |
|---|---|---|---|---|
| F-01 | Predvolená miera výberu 3,7 % | `docs/20_Onboarding_navrh.md:29`; kód `src/domain/recommendations.ts:16` (D-049) | `docs/27` (oddiel 2, D-249) a `src/features/prehlad/Prehlad.tsx:98` ju označujú ako „predpoklad, zdroj neoverený“. `docs/20` to neoznačuje. Nemenené. | Označiť v `docs/20` ako predpoklad so zdrojom, alebo uviesť zdroj. Rozhodne vlastník. |
| F-02 | Predvolená reálna miera výnosu r = 3,5 % | `src/domain/assumptions.ts:8`; príklady v `docs/04`, `docs/05`, `docs/07` | Zdroj a označenie predpokladu v tomto behu nezistené. Hodnota je v kóde a dokumentoch zhodná. | Overiť voči D-050, D-063 a D-064 a označiť ako predpoklad, ak nemá zdroj. |
| F-03 | Prah zmeny K 50 % pri vyhodnotení | `src/features/vyhodnotenie/Vyhodnotenie.tsx:113` (riadok potvrdený) | Bez označenia v kóde. D-záznam v tomto behu nehľadaný. `docs/27` A-05 uvádza, že zdroj nie je overený. | Zakladateľ: určiť, či ide o rozhodnutie (uviesť D-záznam), alebo predpoklad. |
| F-04 | Rozsah scenára ±2 percentuálne body (opatrný / optimistický) | `docs/04_Functional_Requirements.md:101` | Zhodné s kódom `src/features/prehlad/Prehlad.tsx:92` (±0,02). Zdroj ani označenie v `docs/04` nie sú uvedené. | Označiť ako predpoklad, alebo uviesť zdroj. |

Overené bez nálezu: prah výdavkov 100 € (`docs/02_User_Requirements.md:32` zhodné s `src/domain/recommendations.ts:19`, D-048). Príklady GC v `docs/05` a `docs/07` boli overené v `docs/29` nezávislým výpočtom.

Informatívne: `docs/Podklad_pravne_posudenie.md:58` uvádza „244 jednotkových a 256 E2E testov (stav 2026-10-21)“. Ide o datovaný údaj, nezmenený.

## 5. Overenie stavu z `docs/27` až `docs/30`

| Tvrdenie | Výsledok v tomto behu |
|---|---|
| `docs/27`: vitest 358 testov, 66 súborov | Zmenené na 405 testov, 75 súborov (`npx vitest run`, exit 0). Oprava 2. |
| `docs/27`: `tsc` bez chýb | Potvrdené: `npx tsc --noEmit`, exit 0. |
| `docs/27`: playwright 362 testov (2 × 181) | Potvrdené výpisom `--list` (362 testov v 84 súboroch). Beh nespúšťaný. |
| `docs/27`: `npm audit` 0 zraniteľností | Nespúšťané v tomto behu. |
| `docs/27` A-01: rozsah rozhodnutí | Potvrdené: 251 riadkov, D-001 až D-252, chýba D-132. Oprava 1. D-132 viď N-10. |
| `docs/27` A-05: prah 50 % | Riadok potvrdený (`Vyhodnotenie.tsx:113`). Viď F-03. |
| `docs/27` A-06: počty testov v `CLAUDE.md` | Už nezhodné s výstupom tohto behu. Opravené v `CLAUDE.md:6` (oprava 2). |
| `docs/28`: 9 zastaraných balíkov, `npm outdated` | Nespúšťané v tomto behu. Nezmenené. |
| `docs/29`: GC-09 bez vstupu T | Potvrdené (`tests/monthsToTarget.test.ts:73` používa 600 000 €). Oprava 10. |
| `docs/29`: `tests/golden/goal-cases.json` neexistuje | Potvrdené (`ls`). Zhodné s `docs/07:93`. |
| `docs/30`: 9 nových testových súborov | Potvrdené (9 súborov v `git status`). |
| `docs/30`: 56 pridaných položiek (47 prejde + 6 skip + 3 todo) | Potvrdené: 405 − 358 = 47; 6 + 3 = 9; spolu 56. |
| `docs/30`: korekcia nálezu 3 (D-123) | D-123 je v `decisions/Decisions.md` (1 riadok). Nezmenené. |

## 6. Odkazy, obrazovky a osobné údaje

- **Odkazy:** 210 unikátnych odkazov (pred zápisom tohto reportu) na `docs/`, `src/`, `tests/`, `decisions/`, `review/` v `README.md`, `CLAUDE.md` a `docs/*.md`. Po opravách existujú všetky okrem: skrátených odkazov na číslo bez názvu (`docs/02`, `docs/13` … zhodné s prefixom existujúceho súboru, overené `ls`), N-05, N-06, N-07, N-08, `tests/e2e/audit-net.spec.ts` (`docs/24` uvádza, že existuje len v scratchpade), `tests/golden/goal-cases.json` (`docs/07:93`).
- **Obrazovky (`docs/13` a `src/app/navigation.ts`):** kód má 14 sekcií. Po oprave názvov (oprava 8 a 9) zodpovedá 14 riadkov docs/13 názvom v kóde. „Scenáre“ (navrhnuté) nemajú sekciu v kóde, čo je zhodné so stavom. „Pripomienky“ nie sú sekcia (N-02). Stavy „na vetve“ sú nezhodné (N-01).
- **Komentáre v kóde (spot-check, nie úplný sken):** `navigation.ts` (päť skupín, 14 sekcií, každá v jednej skupine): zhoda. `annualOverview.ts:62` a `RocnyPrehlad.tsx:15` citujú `docs/13` oddiel 4 (viď N-03). `tax.ts:7` (daňový scenár sa nepočíta) je zhodný s `Dane.tsx:241`. Nenašiel som komentár, ktorý by odporoval kódu.
- **Osobné údaje:** grep na IBAN a dlhé číselné reťazce v `README.md`, `CLAUDE.md` a `docs/*.md` nenašiel reálne údaje. Jediný zásah je syntetický EAN-13 v `docs/24` (fixture).

## 7. Zmenené súbory (`git status --short`)

Pred zápisom tohto reportu:

```
 M CLAUDE.md
 M README.md
 M docs/07_Testing_Strategy.md
 M docs/13_Zoznam_obrazoviek.md
 M docs/Podklad_pravne_posudenie.md
?? docs/31_Dokumentacia_2026-10-23.md
```

Ostatné položky v `git status` (`?? docs/27`–`docs/30`, `?? tests/*.test.ts` deväť nových súborov) existovali pred behom a neboli zmenené.

`git diff --stat`: 5 súborov, 10 riadkov pridaných, 8 odstránených.

Necommitované. Commit spraví človek po kontrole.
