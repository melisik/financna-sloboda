# Architektúra: zapínateľné moduly (NÁVRH – čaká na schválenie)

Stav: **schválené s úpravami** (D-162, D-163). Kroky 1 a 4–7 sa spravili v tejto vetve; kroky 2–3 sa nerobia, viď nižšie.

### Aktualizácia po rozhodnutí (D-162, D-163)

- **Jadro:** Transakcie, Prehľad, Vyhodnotenie, Rozpočet, Pravidelné výdavky, Nastavenia, Záloha. Rozpočet a pravidelné výdavky nie sú voliteľné (pôvodný návrh ich mal ako modul).
- **Vypnutie nemení výpočty.** Pravidlo 3.1 bod 1 (prázdna predvoľba parametrov) sa neuplatňuje a kroky 2–3 sa nerobia. Výpočty čítajú dáta bez ohľadu na moduly. Moduly sú len viditeľnosť sekcií.
- **Psy** sú v module Dane, nie samostatne. Tlačivo 17-dp-md tiež.
- **Sprievodca** pýta výber modulov v kroku 6 (pred výsledkom). Opätovné spustenie z Nastavení tento krok preskočí.
- **Výber je per zariadenie** (`localStorage`, `fs-moduly`). Neuložený výber = všetky moduly zapnuté.
- **Otvorené:** skrytý modul s dátami sa ďalej počíta (napr. nájom v cieli). Používateľ by to mal vidieť, napr. poznámkou v Prehľade. Zatiaľ to nie je urobené.

Pôvodný návrh nižšie zostáva ako zdôvodnenie.

Vzťahuje sa na: `docs/05_Technical_Architecture.md` (pravidlo závislostí, §3), D-094, D-125, D-142 (brána Fázy 2 a príznak `VITE_PHASE2`).

---

## 1. Problém

Zostava obsahuje jadro (transakcie, prehľad, vyhodnotenie, cieľ) aj deväť sekcií Fázy 2. Používateľ väčšinou nepotrebuje všetko naraz. Chceme vedieť moduly zapnúť a vypnúť, a to bez toho, že jedno vypnuté časť zlomí iné.

## 2. Zistenie: vertikálne závislosti existujú

Dnes **príznak fázy 2 izoluje len navigáciu**. Dáta sa načítavajú vždy a výpočty ich používajú aj vtedy, keď je sekcia skrytá.

### 2.1 Jadro závisí od modulov (najvážnejšie)

| Jadro (súbor) | Závisí od | Dôsledok, ak modul vypnutý |
|---|---|---|
| `src/ui/App.tsx:117` (`makeCtx`) | `rentalsFor(data.properties)` | Cieľ, dátum cieľa a dopad sa počítajú s nájomnými nehnuteľnosťami aj pri vypnutom Majetku |
| `src/domain/rentalGoal.ts:1-5` | `property.ts`, `capital.ts`, `goal.ts`, `assumptions.ts` | Jadrová matematika cieľa je v module Majetok, a preto ju nemožno vypnúť |
| `src/domain/impact.ts:2` | `rentalGoal.ts` | Jadrový dopad nákupu (Transakcie) závisí od Majetku |
| `src/domain/annualOverview.ts:2` | `rentalGoal.ts` | Ročný prehľad (modul) a Vyhodnotenie (jadro) zdieľajú súbor s Majetkom |
| `src/domain/monthSummary.ts:1-5` | `budget.ts`, `liabilities.ts`, `property.ts`, `recurring.ts` | Mesačný prehľad (jadro) počíta s rozpočtom, záväzkami, hypotékou aj pravidelnými výdavkami |
| `App.tsx:936`, `App.tsx:2160` (`monthSummary`) | dáta `budgets`, `recurringExpenses`, `properties`, `liabilities` | Rovnaký problém v UI |

### 2.2 Moduly závisia od seba navzájom (nie cez deklarované „requires“)

| Modul | Závisí od | Prečo to je problém |
|---|---|---|
| Investície (`investments.ts:2`) | Majetok (`mortgage.ts`) | Používa len pomocnú funkciu `fullMonthsBetween`. Investície by nemali závisieť od hypotéky. |
| Dane – investície (`tax.ts:3`) | Investície | Pravá závislosť: daň z investícií nedáva zmysel bez investícií. Musí byť deklarovaná. |
| Tlačivo 17-dp-md (`taxForm.ts:2`) | Psy (`dogs.ts`) | Tlačivo vyplní aj psy. Ak je modul Psy vypnutý, tlačivo by malo funkcionovať bez nich (mäkká závislosť). |
| Ročný prehľad | Majetok (cez `rentalGoal`) | Rovnaké ako v 2.1. |

### 2.3 Dáta a automatické úpravy

- `AppData` (`src/storage/types.ts:301-315`) je jeden objekt. Všetky sekcie čítajú všetky dáta.
- `App.tsx:208-217` vytvára automatické vyhodnotenie aj vtedy, keď sú investície vypnuté.
- `App.tsx:224-240` splácava hypotéku a úvery aj vtedy, keď sú Majetok a Záväzky vypnuté. Mechanizmus je ale **idempotentný** (riadi sa `balanceDate`), takže dobiehanie po opätovnom zapnutí je bezpečné. To treba zachovať.
- `storage/validate.ts` importuje `domain/receipt` (smer `storage → domain` je v poriadku).

### 2.4 Porušenie pravidla z `docs/05` §3

Pravidlo hovorí: `domain` nesmie importovať `storage`, `app` ani `ui`. Všetky doménové súbory importujú `../storage/types` (typy entít). Typy sú dátové kontrakty a sú v tomto zmysle technicky „nižšie“ ako doména, ale pravidlo sa tým dopĺňa: typy by mali byť súčasťou domény (viď krok 8).

## 3. Cieľová architektúra: tri vrstvy

```
        ┌───────────────────────────────────────────────┐
  UI    │ Shell: navigácia, zapnuté moduly, nastavenia  │  smie importovať všetko
        └───────────────▲───────────────────────────────┘
                        │
        ┌───────────────┴───────────────────────────────┐
Moduly  │ majetok · zavazky · investicie · prijmy · ... │  smú importovať jadro
        │ (každý: manifest, doménová logika, UI)        │  a deklarované „requires“
        └───────────────▲───────────────────────────────┘
                        │
        ┌───────────────┴───────────────────────────────┐
Jadro   │ transakcie · goal · capital · snapshot ·      │  NESMIE importovať moduly
        │ monthSummary (len transakcie) · záloha · PIN  │  ani UI
        └───────────────────────────────────────────────┘
```

### 3.1 Pravidlá

1. **Jadro nikdy neimportuje modul.** Čo jadro potrebuje od modulu, dostane ako **príspevok (contribution)** cez parameter funkcie s predvolenou hodnotou prázdnou (napr. `goalMonths(capital, …, rentals = [])`). Vypnutý modul nedodá nič a výpočet beží ďalej.
2. **Modul smie importovať jadro a len tie moduly, ktoré uvedie v `requires`.** Tvrdá závislosť: pri zapnutí sa automaticky zapne aj požadovaný modul; pri vypnutí sa vypnutie zablokuje so zoznamom závislých modulov.
3. **Mäkká závislosť** (modul využije iný, ak je zapnutý): nie je v `requires`, deklaruje sa v manifeste ako `optional`. Vypnutie iného modulu len odstráni jeho príspevok.
4. **Vypnutie modulu nemaže dáta.** Dáta zostávajú v úložisku a v zálohe. Vypnutie len odstráni modul z navigácie, z výpočtov a z automatických úprav. Opätovné zapnutie obnoví všetko (vrátane dobehnutia splátok).
5. **Každý modul má manifest** s textom účinku. Napr. „Vypnutie Majetku odstráni nájomné nehnuteľnosti z výpočtu cieľa.“ Text sa zobrazí pri vypínaní, aby sa zmena neprejavila ticho.
6. **Automatické úpravy patria modulu.** Splácanie hypotéky patrí Majetku a splácanie úverov Záväzkom. Bežia len pri zapnutom module.

### 3.2 Navrhnuté moduly

| ID | Názov (UI) | Typ | Tvrdé `requires` | Mäkké (`optional`) | Príspevky do jadra |
|---|---|---|---|---|---|
| `jadro` | Transakcie, Prehľad, Vyhodnotenie, Nastavenia, Záloha, PIN, Sprievodca | vždy zapnuté | – | – | – |
| `majetok` | Majetok | modul | – | `psy` (tlačivo) | nájomné nehnuteľnosti v K, bývacie toky v mesačnom prehľade, splácanie hypotéky |
| `zavazky` | Záväzky | modul | – | – | splátky úverov v mesačnom prehľade, splácanie úverov |
| `investicie` | Investície | modul | – | – | hodnota pozícií pre vyhodnotenie |
| `prijmy` | Príjmy | modul | – | – | pravidelný príjem v zobrazení a v prehľade budúcnosti |
| `rozpocet` | Rozpočet | modul | – | – | limity kategórií v mesačnom prehľade |
| `pravidelne-vydavky` | Pravidelné výdavky | modul | – | – | pravidelné výdavky v mesačnom prehľade |
| `dane` | Dane (investície) | modul | `investicie` | – | – |
| `psy` | Psy (daň za psa) | modul | – | – | počet psov pre tlačivo |
| `miestne-dane` | Tlačivo 17-dp-md | modul | `majetok` | `psy` | – |
| `sklad` | Sklad, recepty | modul | – | – | – |
| `rocny-prehlad` | Ročný prehľad | modul | – | `majetok` (nájom) | – |
| `prilohy` | Prílohy k výdavkom | modul | – | – | tlačidlá pri transakciách |
| `zty` | ŤZP (placeholder) | modul | – | – | – (bez náplne, D-161) |

Poznámka: „Majetok“ a „Psy“ sú dnes v jednej sekcii. Rozdelenie je navrhnuté, lebo psy nie sú nehnuteľnosť a tlačivo ich môže použiť bez Majetku nezávisle.

## 4. Zapínanie a vypínanie (UX)

- **Nastavenia → Moduly:** zoznam s prepínačmi, zoskupený podľa oblastí (majetok, dane, pravidelné). Pri každom module krátky text účinku (3.1 bod 5).
- **Sprievodca (onboarding):** otázka „Čo chcete sledovať?“ so zaškrtávacími políčkami. Predvolene zaškrtnuté je len jadro. Podporuje to princíp nízkej kognitívnej záťaže (`docs/03`).
- **Navigácia:** odvodí sa zo zapnutých modulov. `PHASE2_SECTION_IDS` a `visibleSections` sa nahradia registrom modulov.
- **Build-predvolenie:** verejná zostava (D-142) má predvolene všetky moduly zapnuté, ako dnes. Používateľ si ich potom vypína. `VITE_PHASE2` sa zmení na „predvolene zapnuté“, nie na brány.

## 5. Ukladanie voľby modulov

Otvorené rozhodnutie. Odporúčanie:

- **Voľba je súčasť nastavení dát** (`settings.modules`, uložená v IndexedDB a v zálohe). Dôvod: zálohu obnovíš s rovnakou zostavou a iné zariadenie nedostane iný výpočet bez vedomia.
- Chýbajúci záznam (stará záloha, verzia 8) = **predvolené moduly podľa buildu** (pre starých používateľov všetko zapnuté, aby sa nič neskrylo).
- Alternatíva: per zariadenie (ako preskočenie sprievodcu). Nevhodné, lebo výpočty by sa líšili medzi zariadeniami.

## 6. Kroky migrácie (každý krok samostatne zelený)

1. **Pomocné funkcie zdieľať:** `fullMonthsBetween` presunúť z `mortgage.ts` do `domain/dates.ts`. Investície prestanú závisieť od Majetku.
2. **Jadrová matematika bez Majetku:** `goalMonths`, `impactWithRentals` a `annualOverview` dostanú `rentals` ako parameter s predvolenou prázdnou hodnotou. `rentalsFor` a `countsInCapital` sa presunú do `domain/majetok`. Testy `rental*.test.ts`, `goal*.test.ts`, `impact.test.ts` musia zostať zelené bez zmeny očakávaní.
3. **Mesačný prehľad:** `monthSummary` sa rozdelí na jadro (len transakcie) a príspevky (`housing`, `liabilities`, `budgets`, `recurring`) ako nepovinný parameter. `monthSummary.test.ts` drží správanie.
4. **Register modulov:** `src/modules/registry.ts` s manifestami (`id`, `label`, `requires`, `optional`, `effectText`, `sections`, `dataKeys`, `autoJobs`). Nahrádza `PHASE2_SECTION_IDS`, `isPhase2Section`, `visibleSections`.
5. **Rozdelenie `App.tsx`** (4 042 riadkov, 44 komponentov) do `src/modules/<id>/`. Shell vykreslí len zapnuté sekcie. Cieľ: `App.tsx` pod ~1 000 riadkov.
6. **Dáta po moduloch:** `AppData` sa zloží zo zložiek (`kernel`, `majetok`, …). Úložisko a schéma zostávajú (žiadna migrácia dát). Záloha vždy obsahuje všetko (pravidlo 3.1 bod 4).
7. **Automatické úpravy** sa registrujú v manifeste modulu a bežia len pri zapnutom module. Test: vypnutý modul nevytvorí zápis.
8. **Typy do domény:** entity z `storage/types.ts` presunúť do `domain/<modul>/types.ts`. Storage ich importuje, doména nie. Tým sa splní pravidlo `docs/05` §3.
9. **Vynútenie pravidiel:** pravidlá závislostí overí test (rovnaký prístup ako `tests/csp.test.ts`): jadro neimportuje moduly, moduly importujú len `requires`/`optional`. Zavedie sa aj kontrola cyklov. Voliteľne `dependency-cruiser` v `npm test`.

Každý krok mení len štruktúru. Správanie sa mení iba v kroku 4 (navigácia) a 7 (zapnutie/vypnutie). Pri kroku 2 a 3 sa mení len to, čo jadro dostáva, nie výsledky pre zapnutú zostavu.

## 7. Riziká

- **Výpočty sa zmenia pri vypnutí modulu** (napr. dátum cieľa bez nájmu). Je to správne podľa 3.1 bod 1, ale je to viditeľná zmena. Treba ju oznámiť v texte účinku a v UI pri vypínaní.
- **Stará záloha bez `settings.modules`** musí načítať všetko zapnuté, inak by používateľ prišiel o sekcie.
- **Testy:** väčšina E2E testov predpokladá všetky sekcie. Treba pridať fixture „jadro len“ a testy, že vypnutie nemení jadrové čísla okrem uvedených príspevkov.
- **Veľkosť zmeny:** kroky 1–3 sú malé. Krok 5 (rozdelenie `App.tsx`) je najväčší a najrizikovejší. Odporúčam ho rozložiť na sekcie, jednu za druhou.
- **Mobil (`docs/05`, fáza 2):** oddelená doména je priamo predpoklad zdieľateľnosti. Tento návrh je v tom súlade.

## 8. Otvorené otázky pre zakladateľa

1. Súhlasíš s rozdelením na jadro a moduly podľa tabuľky 3.2, najmä s tým, že **Rozpočet** a **Pravidelné výdavky** sú moduly, nie jadro?
2. Má sa vypnutie modulu prejaviť vo výpočtoch (odporúčanie, pravidlo 3.1 bod 1), alebo len v navigácii (súčasný stav, ale výpočty by ostali závislé od skrytých dát)?
3. Voľba modulov v zálohe (`settings.modules`), alebo per zariadenie?
4. Sprievodca s otázkou „Čo chcete sledovať?“ už pri prvom spustení, alebo len v Nastaveniach?
5. Rozdelenie `Majetok` / `Psy` (2 moduly), alebo ponechať jeden modul?
6. Poradie: najprv kroky 1–3 (bez zmeny správania, najbezpečnejšie), potom register a UI (kroky 4–5)?

## 9. Súvisiace dokumenty a konflikty

- `docs/05_Technical_Architecture.md` §3 (pravidlo závislostí) – návrh ho dopĺňa a rieši porušenie v bode 2.4.
- D-125 a D-142 (príznak fázy 2 ako brána zobrazenia) – návrh túto bránu nahrádza registrom modulov. Pôvodné rozhodnutia by sa označili ako „nahradené“.
- D-161 (ŤZP placeholder) – v návrhu je modul `zty` bez náplne; zostáva v súlade.
