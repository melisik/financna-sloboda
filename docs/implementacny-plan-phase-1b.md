# Implementačný Plán Phase 1b — Rozšírenie Majetku & Záväzkov
**Dátum:** 2026-11-08  
**Stav:** Návrh na Schválenie (BEZ IMPLEMENTÁCIE)  
**Základňa:** Phase 1 (PropertyForm, PropertySection, K_nem) ✅ Hotová

---

## I. HYPOTÉKY NA NEHNUTEĽNOSTIACH

### 1. Účel a Rozsah
Rozšíriť PropertyForm o hypotekárne informácie bez spúšťania automatických výpočtov.

**Cieľ:**
- Sledovať hypotekárny zostatok na každej nehnuteľnosti
- Vypočítať K_nem ako (majetok − hypotekárny zostatok) v real-time
- Zobraziť hypoteku v PropertySection UI bez automatických splátok

**OUT OF SCOPE (Phase 2+):**
- Automatický výpočet mesačných splátok
- Hypotekárne kalkulačky
- Integrácia s bankami
- Progóza splácania

### 2. Závislosti od Existujúcich Modelov

#### A. Entita Property (`src/domain/model/entities.ts`)
**Stav:** Polia už existujú v type ✅

```typescript
export interface Property {
  id: string;
  name: string;
  valueCents: number;           // ✅ Existuje
  mortgageBalanceCents?: number; // ✅ Existuje (optional)
  lastMortgagePayment?: string;  // ✅ Existuje (optional)
  // + ďalšie polia
}
```

**Čo treba pridať:**
- `monthlyPaymentCents?: number` (mesačná splátka — iba číslo, bez výpočtu)
- `mortgageRate?: number` (úroková sadzba ako % — iba na zobrazenie)
- `mortgageStartDate?: string` (dátum začiatku hypotéky)

#### B. Repository (`src/storage/repository.ts`)
**Stav:** `saveProperty()` a `deleteProperty()` existujú ✅

**Čo sa nemení:**
- Signatúra funkcie ostáva rovnaká
- Persistencia v IndexedDB bez zmien

#### C. K_nem Výpočet (`src/domain/model/entities.ts` alebo nová funkcia)
**Stav:** Logika je už implementovaná v PropertySection.tsx ✅

```typescript
// Aktuálna logika v PropertySection
const netValue = property.valueCents - (property.mortgageBalanceCents ?? 0);
```

**Čo treba zmeniť:**
- Presunúť K_nem výpočet do `src/domain/` (čistej domény)
- Implementovať ako odsekovaná funkcia `calculateNetPropertyValue(property: Property): number`
- Vystaviť cez `makeCtx()` pre dashboard

### 3. Potrebné Zmeny v UI

#### A. PropertyForm.tsx
**Čo treba pridať:**
- 4 nové input polia pod "Hypotékové Informácie" sekciou:
  1. **Hypotekárny zostatok** (`mortgageBalanceCents`)
     - Type: EUR input (ako valueCents)
     - Optional: nie (ak je zadaný, je povinný)
     - Validácia: `parseEurStrict()` (existuje) ✓
  
  2. **Dátum poslednej platby** (`lastMortgagePayment`)
     - Type: Date input
     - Format: YYYY-MM-DD
     - Optional: áno
     - Validácia: Nie v budúcnosti
  
  3. **Mesačná splátka** (`monthlyPaymentCents`)
     - Type: EUR input (ako valueCents)
     - Optional: áno (iba na informáciu)
     - Validácia: `parseEurStrict()` ✓
  
  4. **Úroková sadzba** (`mortgageRate`)
     - Type: Number (% — napr. 2.5 pre 2,5%)
     - Optional: áno
     - Validácia: Medzi 0 a 50

**Príklad UI štruktúra:**
```
[Základné Informácie]
  Názov: [text]
  Hodnota: [EUR input]

[Hypotékové Informácie]
  Hypotekárny zostatok: [EUR input]
  Dátum poslednej platby: [date input]
  Mesačná splátka: [EUR input]
  Úroková sadzba: [number input %]

[Zjednoť ďalšie polia z Phase 1 existujúce]
  ...
```

#### B. PropertySection.tsx
**Čo treba zmeniť:**
- **Zoznam vlastností:** Pridať K_nem stĺpec s detailom hypotéky

**Príklad zoznam:**
```
Názov          | Hodnota   | Hypotéka  | K_nem (čistá)
Byt 1         | 300 000 € | 200 000 € | 100 000 €
Vila           | 150 000 € | 50 000 €  | 100 000 €
---            | ---       | ---       | ---
Celkem        | 450 000 € | 250 000 € | 200 000 €
```

- **Kliknutie na riadok:** Otvor PropertyForm s hypotekárnym formulárom

### 4. Navrhované Testy

#### Unit Testy (`tests/mortgage-calculation.test.ts` — NEW)
```
✓ K_nem = valueCents - mortgageBalanceCents (presne)
✓ K_nem = valueCents ak mortgageBalanceCents je undefined
✓ K_nem = valueCents ak mortgageBalanceCents je 0
✓ K_nem = 0 ak mortgageBalanceCents ≥ valueCents
✓ Hypotéka bez dátumu poslednej platby je OK
✓ Budúci dátum poslednej platby je zamietnutý
✓ Hypotékový zostatok > 0 je možný bez mesačnej splátky
✓ Úroková sadzba je v [0, 50]
```

**Počet:** ~8 testov (bez E2E — len jednotkové)

#### E2E Testy — PropertyForm (`tests/e2e/property-form-mortgage.spec.ts` — NEW)
```
✓ Hypotékový formulár sa načíta prázdny
✓ Zadanie hypotéky 200 000 € sa zobrazí ako "200 000.00"
✓ Dátum sa validuje (nie v budúcnosti)
✓ Mesačná splátka je optional
✓ Persisten cia: Hypotéka sa zachová po obnovení
✓ K_nem sa aktualizuje v real-time (valueCents - mortgageBalanceCents)
✓ Delete property zmaže aj hypotekárne údaje
```

**Počet:** ~7 E2E testov (desktop, bez mobile profilu — aby sa rýchlejší vývoj)

#### Integračné Testy — Záloba
```
✓ Záloha v20 obsahuje nové polia: mortgageBalanceCents, monthlyPaymentCents, mortgageRate
✓ Import zálohy v19 bez hypotekárnych polí sa načíta bez chyby (polia sú undefined)
✓ Hypotékové údaje sa exportujú a importujú bez zmeny
✓ Migrácia: ak Property nemá mortgageBalanceCents, je null (nie 0)
```

**Počet:** ~4 regresné testy v `tests/backup-v2.test.ts` (UPDATE)

**CELKEM TESTY:** 8 unit + 7 E2E + 4 integrácia = **19 nových testov**

### 5. Časový Odhad

| Činnosť | Čas |
|---------|-----|
| UI: PropertyForm hypotékový formulár | 6h |
| UI: PropertySection zoznam s K_nem | 4h |
| Doména: Presun K_nem výpočtu do domain vrstvy | 2h |
| Unit testy (8) | 3h |
| E2E testy (7) | 4h |
| Regresné testy a migrácia | 2h |
| Dokumentácia a opravy | 2h |
| **CELKEM** | **23h** |

---

## II. PRENÁJOM NEHNUTEĽNOSTÍ

### 1. Účel a Rozsah
Sledovať nájomné príjmy z nehnuteľností a zahrnúť ich do voľného peňažného toku `m`.

**Cieľ:**
- Evidovať mesačný nájom za každú nehnuteľnosť
- Zahrnutie nájmu do výpočtu m (voľný peňažný tok)
- Dashboard: Zobrazenie nájmu ako súčasť príjmov

**OUT OF SCOPE:**
- Dáťové transakcie nájmu (záznam jednorazový mesačný odhad)
- Nájomné zmluvy a histórie
- Automatické upozornenia na nájom

### 2. Závislosti

#### A. Entita Property
**Polia na pridanie:**
```typescript
export interface Property {
  // ... existujúce polia
  monthlyRentCents?: number;    // Mesačný nájom v centoch
  rentalStartDate?: string;     // Kedy sa nájom začína (YYYY-MM-DD)
  rentalIncludeInM?: boolean;   // Zahrnuté do výpočtu m (default: true)
}
```

#### B. Doménová Vrstva (`src/domain/`)
**Čo sa zmení:**
- Funkcia na výpočet m musí zahrnúť nájom:
  ```
  m = (príjmy + nájom_celkem) - výdavky / 12 mesiacov
  ```
- Nájom sa počíta ako **ročný priemerný príjem** (mesiac × 12)

#### C. Repository
**Bez zmien** — `saveProperty()` bude persistovať nové polia

### 3. Potrebné Zmeny v UI

#### A. PropertyForm.tsx — Nová Sekcia "Prenájom"
```
[Prenájom Informácie]
  Mesačný nájom: [EUR input]
  Dátum začiatku nájmu: [date input]
  ☑ Zahrnuté do výpočtu mesačného toku (default: ON)
```

**Validácia:**
- Mesačný nájom: `parseEurStrict()` (existuje) ✓
- Dátum začiatku: Nie v budúcnosti
- Optional: Všetky polia sú optional

#### B. PropertySection.tsx
**Zmeny v zozname:**
```
Názov    | Hodnota   | Hypotéka  | Nájom/mesiac | K_nem
Byt 1   | 300 000 € | 200 000 € | 500 €        | 100 000 €
Vila    | 150 000 € | 50 000 €  | 1 000 €      | 100 000 €
```

#### C. Dashboard (`src/compaven-ui/Dashboard.tsx`)
**Zmeny v metrikes:**
- **m (mesačný tok):** Zahrnúť nájom v súčte príjmov
  ```
  m = (príjmy z transakcií + nájom_celkem_ročný/12) - výdavky/12
  ```

### 4. Navrhované Testy

#### Unit Testy (`tests/rental-income.test.ts` — NEW)
```
✓ m sa zvýši o nájom, ak rentalIncludeInM je true
✓ Nájom sa nezahŕňa, ak rentalIncludeInM je false
✓ Nájom 500 € mesačne = 6000 € ročne v m
✓ Viacero nehnuteľností: m = suma(nájom) / 12 + ostatné príjmy
✓ Dátum začiatku nájmu v budúcnosti sa ignoruje (nájom 0)
✓ Nájom bez dátumu začiatku sa počíta od dneška
```

**Počet:** ~6 testov

#### E2E Testy — PropertyForm
```
✓ Nájom formulár sa načíta prázdny
✓ Nájom 500 € sa zobrazí ako "500.00"
✓ Zahrnutie do m: checkbox zmení stav
✓ Persisten cia: Nájom sa zachová po obnovení
```

**Počet:** ~4 E2E testov

#### Integračné Testy — m Výpočet (`tests/annualOverview.test.ts` — UPDATE)
```
✓ Scenár: m bez nájmu vs s nájmom (rozdiel presne 500 EUR/12 = 41.67)
✓ Nájom sa nezapočítava v cieli FIRE (iba K_FIRE = K_inv + K_cash)
✓ K_nem sa nezmenší nájmom (je nezávislý)
```

**Počet:** ~3 regresné testy

**CELKEM TESTY:** 6 unit + 4 E2E + 3 integrácia = **13 nových testov**

### 5. Časový Odhad

| Činnosť | Čas |
|---------|-----|
| UI: PropertyForm nájomný formulár | 4h |
| UI: PropertySection nájom stĺpec | 2h |
| Doména: m výpočet s nájmom | 3h |
| Unit testy (6) | 2h |
| E2E testy (4) | 3h |
| Regresné testy | 2h |
| Dokumentácia | 1h |
| **CELKEM** | **17h** |

---

## III. DODATOČNÉ VÝDAVKY NA MAJETOK

### 1. Účel a Rozsah
Sledovať fixné mesačné výdavky na majetok (údržba, dane, poistenie).

**Cieľ:**
- Evidovať mesačné výdavky za nehnuteľnosť
- Zahrnutie do mesačného toku m (znížiť voľný peňažný tok)
- Kategorizácia výdavkov (údržba / daň / poistenie)

**OUT OF SCOPE:**
- Historická analýza výdavkov
- Predpovede budúcich výdavkov

### 2. Závislosti

#### A. Entita Property
**Polia na pridanie:**
```typescript
export interface PropertyExpense {
  id: string;
  propertyId: string;
  category: 'maintenance' | 'tax' | 'insurance' | 'other';
  monthlyAmountCents: number;
  description?: string;
  startDate?: string;
  endDate?: string; // Ak výdavok skončil
}

// V Property:
export interface Property {
  // ... existujúce polia
  expenses?: PropertyExpense[]; // Pole výdavkov
}
```

#### B. Doménová Vrstva
**Čo sa zmení:**
- m výpočet: Znížiť o súčet mesačných výdavkov
  ```
  m = príjmy + nájom - výdavky - výdavky_na_majetok
  ```

### 3. Potrebné Zmeny v UI

#### A. PropertyForm.tsx — Nová Sekcia "Výdavky na Majetok"
```
[Mesačné Výdavky]
  + Pridať výdavok
  
  [Údržba]      100 €/mesiac ✎ ✕
  [Daň]         150 €/mesiac ✎ ✕
  [Poistenie]   50 €/mesiac  ✎ ✕
```

**Dialog na pridanie výdavku:**
```
Kategória: [dropdown: Údržba/Daň/Poistenie/Iné]
Mesačná suma: [EUR input]
Popis: [text]
Platí od: [date] (optional)
Platí do: [date] (optional)
[Uložiť] [Zrušiť]
```

#### B. PropertySection.tsx
**Zmeny v zozname:**
```
Názov   | K_nem  | Výdavky/mes
Byt 1  | 100 € | 100 € (údržba) + 150 € (daň) = 250 €
```

- Kliknutie na výdavok: Editácia alebo odstránenie

### 4. Navrhované Testy

#### Unit Testy (`tests/property-expenses.test.ts` — NEW)
```
✓ m sa zníži o výdavky na majetok
✓ Výdavky sa nezapočítavajú po endDate
✓ Výdavky sa nezačínajú pred startDate
✓ Kategória výdavku sa validuje
✓ Mesačná suma musí byť ≥ 0
```

**Počet:** ~5 testov

#### E2E Testy
```
✓ Pridanie výdavku sa zobrazí
✓ Edity výdavku v K_nem
✓ Zmazanie výdavku sa propaguje
```

**Počet:** ~3 E2E testov

**CELKEM TESTY:** 5 unit + 3 E2E = **8 nových testov**

### 5. Časový Odhad

| Činnosť | Čas |
|---------|-----|
| UI: PropertyForm výdavky dialog | 5h |
| UI: PropertySection výdavky zoznam | 3h |
| Doména: m výpočet s výdavkami | 2h |
| Unit testy (5) | 2h |
| E2E testy (3) | 2h |
| Dokumentácia | 1h |
| **CELKEM** | **15h** |

---

## IV. DASHBOARD UPDATE — K_NEM METRIKY

### 1. Účel
Zobraziť K_nem na dashboarde s rozhodením:
- **K_nem_inv:** Investovaný kapitál na nehnuteľnostiach (K_nem bez dlhov)
- **K_nem_liab:** Celkové záväzky na nehnuteľnostiach
- **K_nem_net:** Čistá hodnota (K_nem_inv - K_nem_liab)

### 2. Zmeny v UI

#### A. Dashboard Layout
```
[FINANČNÁ SLOBODA — Pokrok K FINANČNEJ SLOBODE]

[Metriky v 2×2 Grid]
  K_FIRE: 80,000 €
  K_total: 280,000 €
  K_nem: 200,000 €     [NEW]
  m: 4,100 €/mesiac    [UPDATED]

[Detail K_nem]
  Nehnuteľnosti: 450,000 €
  - Hypotéky: 250,000 €
  = K_nem: 200,000 €
  
  Nájom: 500 €/mesiac
  - Výdavky: 250 €/mesiac
  = Čistý Nájom: 250 €/mesiac
```

### 3. Testy

#### Unit Testy
```
✓ K_nem suma všetkých nehnuteľností
✓ Nájom sa zobrazuje oddelene od K_nem
✓ Dashboard sa aktualizuje po zmene hypotéky
```

**Počet:** ~3 testy

**CELKEM TESTY:** 3 testy

### 4. Časový Odhad

| Činnosť | Čas |
|---------|-----|
| UI: Dashboard K_nem metriky | 4h |
| Doména: K_nem agregácia | 1h |
| Unit testy | 1h |
| Dokumentácia | 1h |
| **CELKEM** | **7h** |

---

## V. CELKOVÝ SÚHRN PHASE 1b

### Funkčnosti a Testy

| Funkcionalita | Unit | E2E | Integrácia | Celkem Testy |
|---------------|------|-----|-----------|-------------|
| Hypotéky | 8 | 7 | 4 | **19** |
| Nájom | 6 | 4 | 3 | **13** |
| Výdavky | 5 | 3 | — | **8** |
| Dashboard | 3 | — | — | **3** |
| **SPOLU** | **22** | **14** | **7** | **43** |

### Časový Odhad

| Modul | Čas |
|-------|-----|
| Hypotéky | 23h |
| Nájom | 17h |
| Výdavky | 15h |
| Dashboard | 7h |
| **CELKEM** | **62h** (~1.5 týždňa pri 40h/týždeň) |

### Dedependencies & Poradie Implementácie

```
1. Hypotéky (23h)
   ↓
2. Nájom (17h) — Závisí od K_nem, ktorý je v Hypotékach
   ↓
3. Výdavky (15h) — Nezávisí od Nájmu, možno paralelne
   ↓
4. Dashboard (7h) — Závisí od všetkých troch
```

**Optimálny poradt:** Hypotéky → (Nájom + Výdavky paralelne) → Dashboard

---

## VI. ARCHITEKTURÁLNE ROZHODNUTIA

### 1. Databázová Schéma
- **Nová verzia:** v21 (z v20)
  - `Property.mortgageBalanceCents`, `monthlyPaymentCents`, `mortgageRate`, `mortgageStartDate`
  - `Property.monthlyRentCents`, `rentalStartDate`, `rentalIncludeInM`
  - `Property.expenses: PropertyExpense[]`

### 2. Testovacie Prostredie
- Ponechať `?test=true` mode pre všetky Phase 1b funkcie
- Spustení testy v `compaven-2.0-test` DB (izolovaná)

### 3. UI Technológia
- Rozšíriť existujúce PropertyForm a PropertySection komponenty
- BEZ zmeny v React verzii, CSS frameworku atď.

---

## ⚠️ RIZIKÁ A UPOZORNENIA

1. **SCHEMA_VERSION:** Aktuálne je v20, Phase 1b bude v21
   - Migrácia: Staršie zálohy bez nových polí sa budú musieť migrova

2. **Výpočet m:** Aktuálne je zlyhanie v `etapa1-scenario.test.ts`
   - Riešenie: Fixnúť pred implementáciou Phase 1b, aby nebol chaos

3. **E2E Testy:** Nie je dev server spustený
   - Riešenie: Konfigurácia `.claude/launch.json` alebo manuálny dev server

4. **Hypotékový Výpočet:** Toto JE iba sledovanie, nie automatizácia
   - Mesačná splátka sa nezapisuje automaticky
   - Užívateľ zadáva ručne

---

## ✅ ZÁVEREČNÝ CHECKLIST PRE SCHVÁLENIE

- [ ] Počty testov sú presné (19 + 13 + 8 + 3 = 43)?
- [ ] Časový odhad je realistický (~62h)?
- [ ] Poradie implementácie (Hypotéky → Nájom + Výdavky → Dashboard) je OK?
- [ ] Schéma versioning (v21) je schválená?
- [ ] E2E dev server je dostupný?
- [ ] SCHEMA_VERSION a m výpočet budú fixnuté pred Phase 1b?

**Bez schválenia:** Žiadna implementácia sa nebude začínať.
