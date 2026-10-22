# Architektúra: znovupoužiteľné balíčky (NÁVRH – čaká na schválenie)

Stav: **schválené s úpravami** (D-171, D-172). Rozhodnutia zakladateľa: len tento projekt; jeden repozitár; najprv typy a výpočty.

Hotové v tejto vetve:
- Krok 1: entity a číselníky sú v `src/domain/model/entities.ts`; `storage/types.ts` ich znovu exportuje.
- Krok 2: doména (výpočty) importuje len vlastné súbory a nikdy úložisko, aplikáciu ani UI (`tests/architecture.test.ts`).

Zmena oproti návrhu: výpočty ostávajú v `src/domain/` (nie `core/finance/`), aby sa nepremenovalo 31 súborov naraz (D-172). Kroky 3–5 (spoločné prvky, sekcie do features/, samostatné balíky) čakajú na samostatné schválenie.

Ak sa jadro neskôr použije v inom projekte, vyčlení sa ako samostatný balík s verziou (git závislosť), nie kopírovaním, a to len po rozhodnutí podľa CLAUDE.md.

Vzťahuje sa na: `docs/05_Technical_Architecture.md` (pravidlo závislostí, §3), `docs/21_Architektura_moduly_NAVRH.md` (moduly v aplikácii, D-162, D-163), `CLAUDE.md` (nezávislosť od iných projektov).

## 1. Východisko: čo je dnes

Zmerané v repozitári (2026-10-22, vetva `claude/phase2-property-card`):

| Časť | Stav | Poznámka |
|---|---|---|
| `src/domain/` | 31 súborov, čisté funkcie | 22 importuje `storage/types`; 12 importuje iné doménové súbory |
| `src/storage/` | typy, validácia, záloha, IndexedDB | `validate.ts` importuje `domain/receipt` (smer je v poriadku) |
| `src/app/` | pomocné moduly (PIN, OCR, sken, spätná väzba, reminders, moduly) | väčšina je bez závislostí na UI |
| `src/ui/App.tsx` | **4 132 riadkov, 44 komponentov** | všetky sekcie, formuláre aj formátovanie v jednom súbore |
| `src/ui/ReceiptCamera.tsx` | 79 riadkov | samostatný, len kamera a QR |

Najväčšie komponenty v `App.tsx`: `TransactionSection` (435 riadkov), `AppContent` (237), `FirstSetup` (221), `PropertySection` (154), `SnapshotSection` (137), `PropertyForm` (136), `IncomeSection` (124), `HomeSection` (114).

Všeobecné pomocné funkcie sú v `App.tsx` zmiešané s konkrétnou logikou: `eur`, `dateSk`, `cents`, `asNum`, `NumIn`, `todayIso`, `uid`, komponenty `Field`, `Section`, `btn`.

Architektonický test (`tests/architecture.test.ts`) dnes zakazuje len doméne importovať `ui` a `app`. Nekontroluje ostatné smery.

## 2. Problémy, ktoré bránia znovupoužitiu

1. **Doména závisí od typov úložiska.** 22 z 29 súborov importuje `storage/types`. Typy entít (Transaction, Property, Liability…) by mali byť súčasťou domény (`docs/05` §3). Kým to nie je, doménu nemožno použiť bez úložiska.
2. **Formátovanie a vstupy sú v UI.** `eur`, `dateSk`, `asNum` sa nedajú použiť v inom projekte bez kopírovania.
3. **Jeden súbor pre všetky sekcie.** Ak chceš použiť napríklad hypotéku alebo sklad inde, musíš vziať 4 000 riadkov.
4. **Sekcie sa navzájom ovplyvňujú cez `AppData`.** Napríklad `makeCtx` číta majetok, investície a záväzky naraz. Toto treba riešiť cez explicitné vstupy (výpočty dostanú len to, čo potrebujú), nie cez celý `AppData`.
5. **Závislosti nie sú merané.** Architektonický test kontroluje len jeden smer. Pri rozdelení na balíčky treba pravidlá overiť pre všetky.

## 3. Navrhované balíčky

Tri vrstvy a jedna aplikačná. Závislosti smerujú len dole.

```
              ┌───────────────────────────────────────────┐
  app/        │ zloženie appky: sekcie, navigácia, moduly  │  všetko
              └──────────────▲────────────────────────────┘
                             │
  features/   ┌──────────────┴────────────────────────────┐
              │ transakcie · majetok · záväzky · investície│  core + ui-kit
              │ príjmy · rozpočet · pravidelné · dane      │  (nie navzájom)
              │ sklad · ročný prehľad · doklady · záloha   │
              └──────▲─────────────────────▲──────────────┘
                     │                     │
  ui-kit/     ┌──────┴──────┐       ┌──────┴────────────────┐
              │ Field,      │       │ core/                  │
              │ Section,    │       │  model/   typy entít   │
              │ Nav, btn,   │       │  finance/ výpočty      │
              │ formátovanie│       │  data/    úložisko,    │
              └─────────────┘       │           validácia,   │
                                    │           záloha       │
                                    └────────────────────────┘
```

### 3.1 `core/model` – typy entít
- Obsah: dnešný `storage/types.ts` bez úložiskových konštánt. Čisté TypeScript typy a konštanty (kategórie, frekvencie…).
- Závisí na ničom.
- Znovupoužiteľné: áno, ktorákoľvek appka s rovnakými dátami.

### 3.2 `core/finance` – výpočty
- Obsah: `goal`, `capital`, `mortgage`, `liabilities`, `budget`, `recurring`, `monthSummary`, `rental`, `rentalGoal`, `investments`, `tax`, `outlook`, `weekly`, `saving`, `impact`, `annualOverview`, `goalDisplay`, `goalText`, `recipe`, `stock`, `scan`, `receipt`, `receiptItems`, `taxForm`, `dogs`, `ztp`.
- Závisí len na `core/model`. Žiadny React, žiadne úložisko, žiadne `Date.now()` bez parametra.
- Znovupoužiteľné: áno. Najcennejšia časť: golden testy výpočtov (GC-01 až GC-24) sa dajú použiť aj v inom projekte.
- Poznámka: `taxForm`, `dogs` a `ztp` sú domény daní; môžu byť samostatný balíček `core/tax`, ak sa to ukáže ako užitočné.

### 3.3 `core/data` – úložisko a záloha
- Obsah: rozhranie `Repository`, IndexedDB adaptér (`indexeddb.ts`), `validate.ts`, `backup.ts`, `attachments.ts`, `feed.ts`.
- Závisí na `core/model` (a výnimočne na `core/finance` pre validáciu dokladov).
- Znovupoužiteľné: rozhranie a validácia áno; IndexedDB adaptér len pre webové appky.

### 3.4 `ui-kit` – spoločné prvky
- Obsah: `Field`, `Section`, `btn`, `Nav` (ako všeobecný panel odkazov), formátovanie peňazí a dátumov (`eur`, `dateSk`, `monthYear`), `cents`, `asNum`, `NumIn`, `todayIso`, `uid`, `Feedback` (ak je všeobecný), `WarningBanner`.
- Závisí na Reacte, nie na doméne ani na úložisku.
- Znovupoužiteľné: áno, pre každú React appku s podobným štýlom.

### 3.5 `features/*` – sekcie ako samostatné moduly
Každá sekcia z `App.tsx` sa presunie do vlastného priečinka. Každý priečinok obsahuje komponenty svojej sekcie, lokálne formuláre a volania `core` a `ui-kit`.

| Feature | Obsah z `App.tsx` (približne) | Závisí na |
|---|---|---|
| `transakcie` | `TransactionSection`, `TYPE_LABEL`, `SOURCE_LABEL`, filtre | core, ui-kit |
| `vyhodnotenie` | `SnapshotSection`, `RocnyPrehladSection` | core, ui-kit |
| `majetok` | `PropertySection`, `PropertyForm`, `RentalLedger`, `AssetSection`, `MortgageBlock` | core, ui-kit |
| `zavazky` | `LiabilitySection`, `LiabilityForm` | core, ui-kit |
| `investicie` | `InvestmentSection`, `InvestmentForm`, `StockSection` | core, ui-kit |
| `prijmy` | `IncomeSection`, `IncomeBalance`, `OutlookBlock` | core, ui-kit |
| `rozpocet` | `BudgetSection`, `RecurringSection` | core, ui-kit |
| `dane` | `TaxSection`, `DogSection`, `DogForm`, `TaxFormBlock` | core/finance (tax, dogs, taxForm), ui-kit |
| `sklad` | `StockSection`, `RecipesBlock`, `RecipeForm`, `StockForm` | core/finance (stock, recipe), ui-kit |
| `doklady` | `AttachmentsBlock`, `ReceiptCamera`, sken OCR | core/finance (receipt, scan), core/data |
| `zaloha` | `BackupSection`, import/export | core/data |
| `zamok` | PIN, `LockScreen` | ui-kit, `app/pin.ts` |
| `sprievodca` | `FirstSetup`, `ONBOARD_*` | core, ui-kit |
| `prehlad` | `HomeSection`, `MonthSpendingBlock`, `WeeklySummaryBlock`, `Návod` | core, ui-kit, ostatné features len cez čisté dáta |

Pravidlá pre features:
- Feature **nesmie** importovať inú feature. Ak potrebuje údaje z inej, dostane ich ako parameter (napríklad `Prehľad` dostane čisté čísla, nie celú sekciu majetku).
- Feature používa len verejné rozhranie `core` a `ui-kit`.
- Vypnutie modulu (D-162) = feature sa nezobrazí v `app/`. Mapovanie modulov na features je priame.

### 3.6 `app/` – zloženie
- Obsah: `App` (dnes `AppContent`), navigácia, `ModulesProvider` (D-162), registrácia features, service worker, PWA.
- Len tu sa smie spájať všetko.

## 4. Pravidlá závislostí (na overenie testom)

| Zdroj | Smie importovať | Nesmie |
|---|---|---|
| `core/model` | nič | čokoľvek iné |
| `core/finance` | `core/model` | `core/data`, `ui-kit`, `features`, `app`, React |
| `core/data` | `core/model`, `core/finance` | `ui-kit`, `features`, `app`, React |
| `ui-kit` | React | `core/*`, `features`, `app` |
| `features/X` | `core/*`, `ui-kit` | iné `features/Y`, `app` |
| `app` | všetko | — |

Dnešný architektonický test pokrýva len prvý riadok tabuľky z jednej strany. Rozšírenie: jeden test, ktorý prejde všetky súbory a overí tabuľku. Voliteľne `dependency-cruiser` ako nástroj.

## 5. Čo to prináša a čo stojí

**Prínosy**
- Výpočty (`core/finance`) sa dajú testovať a použiť bez prehliadača a bez úložiska. Dnešné golden testy by sa presunuli bez úprav.
- Jedna sekcia sa dá upraviť bez čítania celého `App.tsx`. Menší diff pri review.
- Moduly z D-162 majú pevné hranice: vypnutá feature sa nedotýka ostatných.
- Ťažké závislosti (OCR, jsQR, pdf-lib) sa dajú načítať len vo features, ktoré ich potrebujú. Dnes sa načítavajú dynamicky (`import()`) v `App.tsx`, `ReceiptCamera.tsx`, `receiptScan.ts` a `taxFormPdf.ts`; zámer je zachovať to pri presune.

**Náklady a riziká**
- **Veľký počet presunov.** `App.tsx` má 4 132 riadkov. Presun je mechanický, ale veľký. Treba ho robiť po jednom feature a po každom kroku mať zelené všetky testy (288 unit, 296 E2E).
- **Správanie sa nesmie zmeniť.** Presun nemá meniť texty, layout ani výpočty. Pri každom kroku stačí porovnať E2E výsledky (už dnes pokrývajú sekcie).
- **Zdieľanie medzi projektmi.** `CLAUDE.md` vyžaduje výslovné rozhodnutie pre prevzatie čohokoľvek z iného projektu. Balíčky v tomto repozitári sú interné. Použitie v `spolu-na-ceste` alebo inde je samostatné rozhodnutie a vyžaduje zápis do `Decisions.md`.

## 6. Odporúčaný postup

Každý krok je samostatný commit so zelenými testami.

1. **Typy do `core/model`** (pravidlo `docs/05` §3). Najväčší prínos pre čistotu domény, bez zmeny správania. Úprava importov v 22 súboroch.
2. **`core/finance` ako priečinok s pravidlom** (zatiaľ bez samostatného balíčka). Presun 31 súborov, test závislostí rozšírený na všetky smery.
3. **`ui-kit`:** `Field`, `Section`, `btn`, formátovanie. Malé, mechanické, bez rizika.
4. **Features, po jednom:** začať s najmenej previazanými (`zaloha`, `zamok`, `sklad`, `dane`), potom `doklady`, `investicie`, `zavazky`, `prijmy`, `rozpocet`, `majetok`, `transakcie`, `vyhodnotenie`, `prehlad`, nakoniec `sprievodca` a `app`.
5. **Samostatné balíčky v npm workspaces** (`packages/core`, `packages/ui-kit`), len ak je reálna potreba použiť ich mimo tejto aplikácie.

Po kroku 4 bude `App.tsx` len zloženie (odhad pod 300 riadkov).

## 7. Otvorené otázky pre zakladateľa

1. **Rozsah znovupoužitia:** len v tomto repozitári (odporúčam), alebo aj v iných projektoch (vyžaduje samostatné rozhodnutie podľa `CLAUDE.md`)?
2. **Balíčky:** priečinky v jednom repozitári (odporúčam), alebo samostatné npm balíčky?
3. **Poradie:** najprv typy a výpočty (kroky 1–2, najväčší prínos pre testy), alebo najprv `ui-kit` (rýchly viditeľný výsledok)?
4. **Rozsah pre tento týždeň:** len návrh a schválenie, alebo rovno krok 1?

Súvisí s otvorenými bodmi z auditu: nález 12 (výpočty v UI) je presne krok 2 a 4 tohto plánu, takže oprava nálezu 12 je súčasťou tejto zmeny, nie samostatná práca.
