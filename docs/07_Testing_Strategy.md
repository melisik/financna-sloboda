# 07 – Testovacia stratégia (MVP)

> Stav: v0.8 (2026-10-14). Oddiely 2–4 opisujú skutočné a cieľové pokrytie (R18).

## 1. Priority testovania
Stratégia sa riadi rizikom. Chyba v jednej z týchto oblastí má väčšiu váhu než chyba v ostatných:

| Oblasť | Riziko | Dôsledok chyby | Úroveň testov |
|---|---|---|---|
| Správnosť cieľa a dátumu | zlý vzorec, zaokrúhľovanie, mesiace | používateľ robí rozhodnutia na zlom čísle | jednotkové, property-based, porovnanie so simuláciou, tabuľkové overenie |
| Integrita dát | strata alebo poškodenie transakcií | nenávratná strata histórie rozhodnutí | úložisko, export/import round trip, atomicita |
| Súkromie | nechtené odosielanie dát | únik citlivých finančných údajov | sieťové testy, kontrola závislostí |
| Použiteľnosť na telefóne | zlé dotykové plochy, dlhé toky | vyššia záťaž, opustenie appky | E2E na mobilných viewportoch, používateľské testy |
| Dostupnosť | čítačky, klávesnica, kontrast | používateľ nemôže dokončiť úlohu | axe-core, manuálne testy s čítačkou |
| Offline a inštalácia | PWA sa nespustí bez siete | nefunkčná appka v chvíli potreby | E2E offline, manuálna inštalácia |

## 2. Úrovne testov
1. **Jednotkové (Vitest)** – čisté funkcie v `domain/` (FR-01 až FR-05, FR-07, FR-08). Cieľ: všetky vetvy výpočtov pokryté [predpoklad].
2. **Property-based (fast-check)** – invarianty z oddielu 4. **Stav (2026-10-14): nie je zavedené** (fast-check nie je v závislostiach); invarianty sú zatiaľ len špecifikácia.
3. **Porovnávacie** – uzavretý vzorec vs. mesačná simulácia (oddiel 3; simulácia zatiaľ nie je spustená, doplní sa v M1).
4. **Úložisko (Vitest + fake-indexeddb)** – CRUD, migrácie, import/export, atomicita.
5. **Komponentové (React Testing Library)** – **stav (2026-10-14): nie je zavedené**; formuláre a texty sa zatiaľ overujú len cez Playwright E2E.
6. **End-to-end (Playwright)** – kľúčové toky z `03_UX` (prvé nastavenie, týždenné zadanie, mesačné vyhodnotenie, záloha), na mobilných viewportoch, aj offline.
7. **Dostupnosť** – axe-core **stav (2026-10-14): nie je zavedené**; zatiaľ len atribúty aria-label pri poliach a manuálne čítačky (oddiel 9).
8. **Súkromie a bezpečnosť** – sieťové testy, npm audit, CSP (oddiel 7).
9. **Používateľské** – self-test zakladateľa a checklist kognitívnej záťaže (oddiel 10).

**Stav automatizovaných testov (2026-10-14, R18):** tabuľka nižšie je *cieľové* pokrytie. Dnes automatizované sú:
- jednotkové testy (Vitest, 63 testov): GC-01, GC-02, GC-03, GC-04, GC-08, GC-11, GC-13, GC-15 až GC-21 (ID v názvoch testov); FR-01, FR-02, FR-04, FR-05, FR-13, FR-14, FR-15, FR-16 (manifest a offline cez E2E), FR-17, FR-18, FR-19, FR-09, FR-10 (pripomienky a história v čistých funkciách a v E2E);
- úložisko (CRUD, validácia, atomicita importu, duplicitné id): FR-17, FR-18;
- E2E (Playwright, desktop a mobil 390): záloha, úprava a vrátenie, offline režim.

Neautomatizované (zatiaľ len cieľ): GC-05, GC-06, GC-07, GC-09, GC-10, GC-12, GC-14, GC-22; komponentové testy FR-06, FR-11, FR-12, FR-13 (vizuálne odlíšenie), FR-14 (rozsah), FR-07, D-030, M2 (dátum v budúcnosti v UI); axe-core a čítačky. Pri neautomatizovanej položke sa testovanie robí ručne.

**Pokrytie požiadaviek bez výpočtovej GC (cieľ, doplnené po revízii):**

| Požiadavka | Test | Typ |
|---|---|---|
| FR-06 Formát | zobrazenie sumy v celých eurách, mesiace celé čísla, dátum slovensky („marec 2038“) | jednotkový |
| FR-11 Pripomienka | pripomienka na konci mesiaca bez vyhodnotenia; vypnutie v nastaveniach; systémová notifikácia len po povolení | komponentový |
| FR-13 Odporúčania | odporúčanie je označené odlišne od vlastnej hodnoty; vrátenie odporúčanej hodnoty jedným úkonom | komponentový |
| FR-14 Prehľad | cieľ, dátum ako rozsah od D_L, zostávajúci čas, predbežný dopad, dátum posledného vyhodnotenia | komponentový, E2E |
| FR-15 História | zoradenie od najnovšej, filter podľa typu a obdobia, súčty za obdobie | komponentový |
| FR-19 Pripomenutie zálohy | banner po 7 dňoch bez exportu alebo ak sa nikdy neexportovalo; zmizne po exporte | komponentový |
| D-030 výdavok pod prahom | uložený s príznakom, zahrnutý do predbežného dopadu (prehľad spotreby odložený, D-038) | jednotkový, komponentový |
| FR-04 zobrazenie pod 1 mesiac | dopad 100 € (≈ 0,12 mesiaca) sa zobrazí v dňoch, nie ako „bez zmeny“ | jednotkový |
| M2 dátum vyhodnotenia | dátum v budúcnosti sa odmietne; predvolená hodnota je min(koniec mesiaca; dnes) | jednotkový, komponentový |
| FR-01 neplatný vstup | V ≤ 0 alebo p ≤ 0: výpočet sa nespustí, zobrazí sa výzva na opravu | jednotkový |
| FR-05 transakcia s dátumom ≤ D_L | nepridá sa znovu do K_L | jednotkový |
| FR-07 prah ako filter | výdavok pod prahom sa uloží s príznakom a zobrazí sa podľa filtra | komponentový |
| FR-09 úprava a mazanie | prepočíta sa len predbežný dopad; mazanie ponúka vrátenie späť | komponentový |
| FR-10 pripomienka | pripomienka sa zobrazí po konci mesiaca bez vyhodnotenia, nie len text o dátume | komponentový |
| FR-12 prvé nastavenie | bez vyhodnotenia sa zobrazí výzva „urobte prvé vyhodnotenie“, nie dátum | komponentový, E2E |
| Stav „Nezadané“ | chýbajúci údaj sa zobrazí ako „Nezadané“, nie ako nula | komponentový |
| D-037 rezerva | sporenie do rezervy sa nezapočíta do m ani do K; zobrazí sa ako stav rezervy | jednotkový |
| UR-09 Predpoklady | na obrazovke výpočtu sú viditeľné pravidlo 4 % a predvolená miera 3,7 % (D-051), reálny výnos a upozornenie bez daní a poplatkov | komponentový |

## 3. Zlaté prípady (golden cases)
Hodnoty sú overené uzavretým vzorcom (FR-02). GC-03 a GC-07 sú navyše overené tabuľkovou funkciou NPER (viď nižšie). Mesačná simulácia a overenie ostatných prípadov nie sú zatiaľ spustené; doplnia sa v M1. Prípady budú uložené v `tests/golden/goal-cases.json` a každý bude mať odkaz na požiadavku.

| ID | Vstup | Očakávaný výsledok | Zdroj |
|---|---|---|---|
| GC-01 | V = 24 000 €, p = 4 % | T = 600 000 € | FR-01 |
| GC-02 | V = 24 000 €, p = 3 % | T = 800 000 € | FR-01, D-011 |
| GC-03 | K = 100 000, m = 500, r = 4 %, T = 600 000 | n = 333,92 → **334 mesiacov** | FR-02 |
| GC-04 | K = 105 000 (predbežne), m = 500, r = 4 % | n = 327,93 → **328**; dopad **+6 mesiacov skôr** | FR-04 |
| GC-05 | K = 100 000, m = 500, r = 6 % (optimistický) | n = 256,01 → **257** | FR-03 |
| GC-06 | K = 100 000, m = 500, r = 2 % (opatrný) | n = 489,11 → **490** | FR-03 |
| GC-07 | K = 100 000, m = 0, r = 4 % | n = 548,21 → **549** (≈ 45,7 roka, dátum sa zobrazí, pretože je do 50 rokov) | FR-02, D-019 |
| GC-08 | K = 0, m = 0, r = 4 % | bez dátumu: „Pri súčasnom sporení a výnose sa cieľ nedosiahne“ | D-019 |
| GC-09 | K = 0, m = 500, r = 4 % | n = 488,02 → **489** | FR-02 |
| GC-10 | K = 100 000, T = 600 000, m = 500, r = 0 % | n = (T − K) / m = **1 000** (presne celé číslo; `ceil(n − 1e-6)` musí dať 1 000, nie 1 001) | FR-02 |
| GC-11 | K_L ≥ T | cieľ dosiahnutý, dátum = D_L (dátum posledného vyhodnotenia) | FR-02, D-024 |
| GC-12 | K = 100 000, m = 500, r = 4 %, T = 2 000 000 | n ≈ 655,4 → **656 mesiacov** (≈ 54,6 roka); zobrazí sa „viac ako 50 rokov“ | FR-02, D-019 |
| GC-13 | D_L = 2026-10-14, K = 100 000, m = 500, r = 4 %, T = 600 000; dnes = 2026-12-14 (bez nového vyhodnotenia) | dátum cieľa **nezmenený**: august 2054 (interne 2054-08-14 = D_L + 334 mesiacov); zostávajúci čas = **332 mesiacov** | D-024, FR-02 |
| GC-14 | D_L = 2026-10-14, K = 100 000, m = 500, r = 4 %, T = 600 000; dnes = 2055-01-01 (po dátume cieľa) | „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“; žiadny záporný čas; dátum sa nemení | FR-10, D-024 |
| GC-15 | K_L = 100 000, m = 500, r = 4 %, T = 600 000; po D_L dva výdavky z kapitálu po 60 000 € | K_pred = max(0; −20 000) = **0**; dopad = n(K_L) − n(0) = 333,92 − 488,02 = **−154 mesiacov** (zaokrúhlené; N1: surový rozdiel); text „Hotovosť nestačila; kapitál je 0 €“, žiadny záporný kapitál | FR-04, FR-08, H2 |
| GC-16 | sporenie 500 € v každom z troch mesiacov pred D_L, žiadne staršie transakcie | m = 1 500 / 3 = **500** (nie 125; D-031) | D-031 |
| GC-17 | D_L = 2026-10-14, K_inv = 50 000, K_cash = 60 000, m = 500, r = 4 %, T = 100 000 | K_L = 110 000 ≥ T → cieľ dosiahnutý, dátum = D_L (hotovosť sa počíta v K) | FR-02, D-036 |
| GC-18 | D_L = 2026-10-14, K_inv = 90 000, K_cash = 5 000, m = 500 (investícia, m_inv), r = 4 %, T = 100 000 | T′ = T − K_cash = 95 000; n ≈ 6,24 → **7 mesiacov** (dátum D_L + 7 mesiacov) | FR-02, D-036, D-039 |
| GC-19 | V = 24 000 €, K_cash = 20 000 €, rezerva = 3 × 2 000 = 6 000 € (mimo K_cash), výdavok 15 000 € z hotovosti | prejde; K_cash = 5 000 €, rezerva zostáva 6 000 € (nezasahuje); výdavok 25 000 € > K_cash je zamietnutý s ponukou „z investícií“ | FR-08, D-045, D-058 |
| GC-20 | K_inv = 100 000, K_cash = 0, m_inv = 0, m_cash = 500, r = 4 %, T = 600 000 | n ≈ 417,42 → **418 mesiacov** (iterácia po celých mesiacoch, D-046); pri m_cash = 0 je uzavretý tvar 333,92 | D-046 |
| GC-21 | ako GC-20, ale K_cash = 100 € navyše | dopad = 417,417 − 417,360 = **0,056 mesiaca ≈ 1,7 dňa** (interpolácia; prepočítané cez `monthsToTargetSplit`); zobrazí sa v dňoch | FR-04, D-046 |
| GC-22 | vklad do rezervy 6 000 €, potom výber z rezervy 1 000 € | stav rezervy = 6 000 − 1 000 = **5 000 €** (vklady mínus výbery); K sa nemení | D-047 |

**Overenie tabuľkou (NPER):** `NPER(i; −m; −K; T; 0)`, kde `i = (1 + r)^(1/12) − 1`. Výsledok musí zodpovedať n z FR-02. Hodnoty GC-03 a GC-07 sú overené touto metódou. Pri GC-08 funkcia nevráti číslo, čo je očakávané.

**Stav:** GC-03, GC-04, GC-08, GC-11, GC-13, GC-15 až GC-21 sú označené v jednotkových testoch; GC-05, GC-06, GC-07, GC-09, GC-10, GC-12, GC-14 a GC-22 zatiaľ nemajú označený test. Súbor `tests/golden/goal-cases.json` zatiaľ neexistuje.

**Tolerancia:** porovnávame celé mesiace po `ceil(n − 1e-6)`; interné hodnoty n sa porovnávajú s presnosťou 1e-6.

## 4. Invarianty (property-based testy)
**Stav (2026-10-14): nie sú implementované** (pozri oddiel 2, bod 2). Nižšie je špecifikácia.

Pre náhodné vstupy (K ∈ [0, 10 000 000], m ∈ [0, 10 000], r ∈ [0; 0,10], T ∈ [1 000; 10 000 000]):
- **Hraničná podmienka:** pre n = `monthsToTarget(...)` platí K_uzavretý(⌈n − 1e-6⌉ − 1) < T ≤ K_uzavretý(⌈n − 1e-6⌉), kde K_uzavretý(k) = K·(1+i)^k + m·((1+i)^k − 1)/i je kapitál po k mesiacoch (D-024) pre i > 0; pre i = 0 (r = 0) je K_uzavretý(k) = K + m·k. Property test pokrýva r = 0 samostatne (K2). Toto je presnejšie než porovnanie so simuláciou a zachytí chybu v zaokrúhľovaní.
- **Nezápornosť:** K_pred ≥ 0 pre ľubovoľnú postupnosť výdavkov z kapitálu po D_L (H2).
- **Monotónnosť:** n nerastie so zvyšovaním K, m alebo r; n nerastie s klesaním T.
- **Predbežný dopad:**
  - bez transakcií po poslednom vyhodnotení je dopad 0;
  - výdavok „z príjmu“ nemení n;
  - sporenie alebo investícia nikdy nezhorší dátum (n_pred ≤ n_base);
  - výdavok „z kapitálu“ nikdy nezlepší dátum (n_pred ≥ n_base).
- **Peniaze:** všetky sumy v úložisku sú celé čísla (centy); súčty sa nerobia v plávajúcej desatinnej čiarke.

## 5. Dátum a čas
- Dátumy sa ukladajú ako `YYYY-MM-DD` bez časovej zóny; test, že sa pri prechode na letný čas (Europe/Bratislava) dátum neposúva o deň.
- Hranice mesiaca: transakcia dňa 31. a vyhodnotenie dňa 30. (FR-05, „≤ dátum vyhodnotenia“); priestupný rok (29. 2.).
- Dátum cieľa = D_L + ⌈n − 1e-6⌉ mesiacov (D-024) s **orezaním na posledný deň cieľového mesiaca** (31. 1. + 1 mesiac = 28. 2.). Test s falošnými hodinami (fake timers) pre dni 1., 28., 29., 30. a 31.
- Pripomienka konca mesiaca sa testuje s nastavenou časovou zónou.

## 6. Dáta a úložisko
| Scenár | Očakávané správanie | Typ |
|---|---|---|
| Prázdne úložisko po vymazaní prehliadačom | prázdny stav s výzvou na import zálohy, žiadne tiché obnovy | E2E |
| Import neplatného JSON | chyba, žiadna zmena dát | jednotkový |
| Import s neznámym poľom alebo nadmernou veľkosťou | odmietnutie, žiadna zmena | jednotkový |
| Import so zápornou sumou, budúcim dátumom alebo chýbajúcim poľom | odmietnutie s konkrétnou správou, žiadna zmena | jednotkový |
| Import súboru s vyššou verziou schémy | odmietnutie s vecnou správou | jednotkový |
| Import zlyhá uprostred zápisu | celá transakcia sa zruší, pôvodné dáta zostanú | úložisko |
| Úložisko plné (`QuotaExceededError`) | správa, žiadny čiastočný zápis, ponuka exportu | úložisko |
| Export → import → export | výstupy sú zhodné (okrem `exportedAt`) | round trip |
| Zálohy vo verzii 1 zostanú čitateľné aj po budúcich zmenách | fixture `tests/fixtures/export-v1.json` sa importuje v každom vydaní | regresia |
| Dve karty naraz | zápis v jednej karte sa prejaví v druhej (BroadcastChannel); žiadne prepísanie | manuálny, neskôr E2E |

**Riziko iOS Safari [predpoklad, overiť aktuálne správanie]:** Safari môže po dlhšom nepoužívaní webu vymazať dáta uložené skriptom vrátane IndexedDB, ak aplikácia nie je pridaná na plochu. Test: manuálne na reálnom iPhone (pridanie na plochu, neskoré otvorenie). Mitigácia: odporúčanie pridať na plochu v prvom nastavení a pripomienka zálohy (FR-19).

**Pravidlo pre fixtures:** v repozitári sú len anonymizované alebo syntetické dáta. Žiadne reálne finančné údaje.

## 7. Súkromie a bezpečnosť
- **Sieťový test:** Playwright zachytí všetky požiadavky počas kľúčových tokov. Povolený je len pôvod aplikácie. Zakázané sú externé volania, vrátane externých fontov (MVP ich nepoužíva, písma sú lokálne).
- **Logy:** v produkcii sa nelogujú sumy ani transakcie. Test: lint pravidlo alebo kontrola kódu proti `console.log` nad doménovými dátami.
- **Export:** obsahuje varovanie o citlivých údajoch (FR-17); test prítomnosti textu.
- **Závislosti:** `npm audit` v CI; kontrola licencií.
- **CSP:** test meta tagu bez `unsafe-inline` pre skripty; hlavičky sa netestujú, lebo GitHub Pages ich nenastavuje (S4).

## 8. Zariadenia a prehliadače
| Prostredie | Typ testu | Kedy |
|---|---|---|
| Android Chrome, emulácia viewportu 412 × 915 | automatizované E2E | každý PR |
| iOS Safari, emulácia viewportu 390 × 844 | automatizované E2E (WebKit) | každý PR |
| Reálny iPhone 16 (iOS 26.6.2) | manuálny checklist: plocha a neaktivita (IndexedDB po 7 dňoch bez použitia), dotyky, offline, Safari úložisko | pred M2 a pred každým vydaním |
| Reálny Android (zariadenie k dispozícii; model a verzia systému sa doplnia) | manuálny checklist: dotyky, inštalácia na plochu, offline | pred každým vydaním |
| Desktop Chrome, Firefox, Safari | základné toky | pred vydaním |
| Viewporty 360, 390, 768, 1280 px | bez horizontálneho scrollu, čitateľnosť | každý PR |
| Zoom 200 % a najväčšie systémové písmo | žiadna stratená informácia | pred vydaním |

**Kontrolné body:** dotykové plochy aspoň 44 × 44 px [predpoklad]; žiadny horizontálny scroll; offline tok funguje po prvom načítaní.

## 9. Dostupnosť (WCAG 2.2 AA)
- axe-core: nulové kritické a vážne porušenia pre zlúčenie.
- Klávesnica: všetky akcie dosiahnuteľné, viditeľný focus.
- Čítačky: manuálny checklist pre VoiceOver (iOS) a TalkBack (Android) pri každom vydaní.
- Kontrast: text aspoň 4,5 : 1, ovládacie prvky aspoň 3 : 1, rovnako v tmavom režime.
- Význam nie je len farbou: predbežný dopad je text, nie len zelená alebo červená.

## 10. Používateľské testovanie a kognitívna záťaž
- **Self-test:** po každom milníku (M3, M4) aplikáciu používam týždeň a vediem denník: čo ma zmiatlo, koľkokrát som sa musel vrátiť.
- **Metriky [predpoklad]:**
  - zadanie transakcie do 20 sekúnd a do 5 dotykov (bez poznámky);
  - mesačné vyhodnotenie do 3 minút;
  - čísla sa menia len po transakcii alebo vyhodnotení, nikdy inak (invariant z UX princípu 4).
- **Checklist záťaže** pri každej obrazovke: jedna hlavná úloha, predvolené hodnoty, žiadny žargón bez vysvetlenia, žiadne vyčítavé formulácie (UX princípy 1, 2 a 7).
- **Pre fázu 2:** rozhovory s 3–5 ľuďmi z cieľovej skupiny EÚ (mimo rozsahu MVP, povinné pred rozšírením).

## 11. Výkon
- Výpočty v `domain/`: pod 50 ms pre celý prepočet.
- Štart aplikácie: do 2 sekúnd na strednom Androide [predpoklad].
- Záťažový test: 5 000 transakcií (desiatky rokov aktívneho používania) bez spomalenia zoznamu histórie.

## 12. Prostredie, automatizácia a CI
- **Lokálne pred commitom:** lint, typový kontrola, jednotkové testy zmenených modulov [predpoklad: husky].
- **Pri každom PR (GitHub Actions):** lint, typecheck, jednotkové, komponentové, npm audit, axe-core.
- **Pri zlúčení do main:** plné E2E (Android a iOS viewport, offline), sieťový test súkromia.
- **Nasadenie** až po zelenom výsledku všetkých kontrol.
- **Reprodukovateľnosť:** lock file, pevné verzie závislostí.

## 13. Definícia hotového (Definition of Done)
**Funkcia je hotová, keď:**
- prejdú jednotkové, komponentové a E2E testy pre jej tok;
- axe-core nehlási vážne porušenia;
- je overená na mobilnom viewporte;
- dokumenty sú aktualizované (verzia, odkazy na D-xxx);
- rozhodnutia sú zapísané v `decisions/Decisions.md`.

**Vydanie je hotové, keď:**
- všetky automatizované kontroly sú zelené;
- manuálny checklist na reálnom iPhone 16 aj na reálnom Androide je podpísaný v dokumente vydania;
- prebehol round trip export → import na reálnych dátach (anonymizovaných);
- offline tok a inštalácia na plochu fungujú;
- self-test za posledný týždeň neobsahuje blokujúcu chybu.

## 14. Mimo rozsahu MVP
Bankové a investičné integrácie, viacužívateľské scenáre, daňové výpočty, graf projekcie (odložený, D-008), právne texty a ich overenie.

## 15. Otvorené otázky
Zodpovedané:
- **Zariadenia:** iPhone 16 (iOS 26.6.2) a Android zariadenie (model a verzia systému sa doplnia).
- **O-6 (D-021):** výdavok z kapitálu väčší než kapitál sa rieši upozornením a ponukou zmeny na „z príjmu“.

Otvorené:
- **Riziko iOS Safari:** rozhodnuté (D-042): plocha je na iPhone povinná. Overenie na reálnom iPhone pred M2 (nie po M2).
