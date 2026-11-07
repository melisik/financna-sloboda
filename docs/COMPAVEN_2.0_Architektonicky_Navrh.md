# COMPAVEN 2.0 – Architektonický návrh (OUTSIDE IN)

**Dátum:** 2026-11-07  
**Stav:** Návrh na schválenie  
**Metodika:** OUTSIDE IN (od produktu k detailom)  
**Poznámka:** Tento návrh nevytvára zmeny kódu. Všetky rozhodnutia sú vedené existujúcou dokumentáciou a rozhodnutiami (D-001 až D-336).

---

## 1. VÍZIA COMPAVEN 2.0

**Výrok o vízii:**  
COMPAVEN je personalizovaný finančný advisor, ktorý používateľa vedie k **finančnej slobode** — nezávislosti od zamestnania — tým, že **visuálne a intuitívne** ukazuje dopad každého finančného rozhodnutia (spárenia, investície, výdavku) na dátum jeho cieľa.

**Kľúčová vlastnosť:**  
Dynamický cieľ sa prepočítava pri každom mesačnom vyhodnotení a používateľ vidí **okamžitý dopad** svojich rozhodnutí na dátum cieľa, pričom sa vedľa cieľa zobrazujú aj tri scenáre (opatrný, základný, optimistický) na zachytenie neistoty.

**Dosah:**  
- **Fáza 1 (MVP):** Jediný používateľ, webová aplikácia, lokálne ukladanie (IndexedDB), offline-first.
- **Neskôr:** Mobilná aplikácia, integrácie na bankové účty, viacužívateľské scenáre, viacmenové / viacštátne rozšírenie.

---

## 2. CIEĽOVÁ SKUPINA A KONTEXT

### Primárny používateľ (MVP)
- **Zakladateľ** (osobné použitie).
- **Psychografická charakteristika:** Aktívne myslí na finančnú budúcnosť, robí viac rozhodnutí týkajúcich sa sporenia a investícií ako bežná populácia, chce pochopiť dopad svojich rozhodnutí na dlhodobý cieľ.
- **Technická gramotnosť:** Vysoká (zakladateľ je tech-orientovaný).

### Budúci používatelia (Fáza 1b a ďalej)
- Používatelia v EÚ (potenciálne 18–65 rokov).
- **Regulačné medziľahlosti:** GDPR, MiFID II (pri daňových scenároch a projektoch), Správa spotrebiteľa podľa jednotlivých krajín.

---

## 3. HLAVNÉ FUNKČNÉ OBLASTI

### 3.1 Jedno jadro: Prepočet cieľa (Financial Goal Engine)

Centrálnym mechanizmom aplikácie je výpočet dynamického cieľa:

```
VSTUP                    VÝPOČET                        VÝSTUP
─────────────────────    ────────────────────────────   ──────────────────
Ročné výdavky (V)        T = V / p                      Cieľová suma
Miera výberu (p)         
Reálny výnos (r)         n = F(K, m, r, T)              Počet mesiacov
Mesačné sporenie (m)     (viď FR-02, FR-02a v 04_)      
Kapitál (K)              
Dátum posledného         Tri scenáre: ± 2 p.b. od r     Rozsah dátumov
  vyhodnotenia (D_L)     
```

**Vlastnosti:**
- Výpočet je **deterministický** (same input → same output).
- Je **offline** (bez API).
- Nešpekuluje (nezlepšuje/nezhoršuje realitu).
- Ukazuje **tri scenáre** (opatrný – základný – optimistický) na vizualizáciu rozsahu.

### 3.2 Oblasti funkcií — vysoká vrstva

| Oblasť | Popis | Garant v rozhodnutiach |
|--------|-------|--------|
| **Sledovanie výdavkov** | Záznam sporenia, investícií, výdavkov; klasifikácia podľa zdroja úhrady. | FR-01 až FR-15 (D-013 až D-054) |
| **Cieľ a projekcia** | Prepočet cieľa, scenáre, predbežný dopad, história. | FR-01 až FR-04, FR-06 (D-008, D-014, D-016, D-024, D-046) |
| **Mesačné vyhodnotenie** | Záznam mesačného stavu investícií a hotovosti; prepočet cieľa. | FR-05, FR-10 (D-016, D-044) |
| **Rezerva (núdzový fond)** | Oddělená od kapitálu; vklady znižujú K, výbery ho zvyšujú. | FR-01, D-017, D-047, D-058 |
| **Záloha a obnova** | Export do JSON, import s validáciou, bezpečnosť dát. | FR-17 až FR-19 (D-018, D-078) |
| **Nehnuteľnosti a hypotéky** (Fáza 2) | Záznam vlastníctva (vlastné bývanie / prenájom), hypotékárnych záväzkov, automatické splácanie, nájom. | FR-20 až FR-23, FR-27 (D-080 až D-093) |
| **Dane a scenáre** (Fáza 2) | Daňový režim investícií, daňový scenár vedľa nominálneho. | FR-24 až FR-25 (D-070 až D-083) |

### 3.3 Hranice podľa fáz

**MVP (Fáza 1):**
- Sledovanie výdavkov (bez nehnuteľností).
- Cieľ a projekcia na základe investícií a hotovosti (K = K_inv + K_cash).
- Jednoduché nastavenie cieľa (V, p, r, rezerva).
- Mesačné vyhodnotenie.
- Záloha.

**Fáza 2 (čiastočne implementovaná):**
- Nehnuteľnosti (vlastníctvo a prenájom).
- Hypotéky (automatické splácanie, D-347).
- Príjmy a tok (nájom, splátky).
- Dane (nastavovanie a scenár).
- Budúci:
  - Viacužívateľskosť.
  - Mobilná aplikácia.
  - Integrácie.

---

## 4. ARCHITEKTONICKÉ PRINCIPY (OUTSIDE IN)

Popis úrovní:

```
        ┌─── PRODUKT ───────────────────────────────────────────┐
        │ Používateľ vidí:                                       │
        │ • Prehľad (cieľ, scenáre, dopad)                       │
        │ • História (transakcie, vyhodnotenia)                  │
        │ • Formuláre (nastavenie, transakcie)                   │
        └─────────────────────────────────────────────────────┘
                            ↓
        ┌─── USE-CASE VRSTVA ───────────────────────────────────┐
        │ Aplikačná logika:                                      │
        │ • Zápis transakcie (validácia, dopad)                  │
        │ • Mesačné vyhodnotenie (snapshot, prepočet)            │
        │ • Import/Export (schéma, migracia)                     │
        └─────────────────────────────────────────────────────┘
                            ↓
        ┌─── DOMÉNOVÁ VRSTVA ───────────────────────────────────┐
        │ Čisté funkcie (bez UI, bez úložiska):                  │
        │ • goal(V, p, r, K, m, D_L) → T, n, scenáre            │
        │ • impact(K_L, m_po_D_L) → Δn                           │
        │ • isValid(transakcia) → boolean                        │
        │ • mortgagePayment(p, month) → suma (D-347)             │
        └─────────────────────────────────────────────────────┘
                            ↓
        ┌─── ÚLOŽISKO VRSTVA ───────────────────────────────────┐
        │ Dáta v zariadení (IndexedDB):                          │
        │ • transactions, snapshots, settings, meta              │
        │ • Žiadne online volania                                │
        └─────────────────────────────────────────────────────┘
```

**Pravidlá:**
1. **Doménová vrstva** musí byť čistá (bez React, bez IndexedDB).
2. **Use-case vrstva** transformuje vstup na doménové funkcie.
3. **UI vrstva** sa opiera o use-case a zobrazuje výsledky bez výpočtov.
4. **Úložisko** je abstraktný — implementáciu je možné vymeniť.

---

## 5. DÁTOVÝ MODEL (VYSOKÁ ÚROVEŇ)

### Entity a vzťahy

```
         ┌─────────────────┐
         │   NASTAVENIE    │  (jednoduchý záznam)
         ├─────────────────┤
         │ V (výdavky)     │  Cieľové parametre
         │ p (miera výberu)│  + príznak "zmenené"
         │ r (výnos)       │  + história změn
         │ rezerva         │
         │ prah výdavkov   │
         │ m (odvodené)    │
         └─────────────────┘
                  ↑
                  │ (1:1)
         ┌─────────────────────────────────────┐
         │      HLAVNÝ VÝPOČTOVÝ STAV          │
         ├─────────────────────────────────────┤
         │ K_L (posledný kapitál)               │
         │ D_L (dátum posledného vyhodnotenia) │
         │ Cieľ (T, n, n_opatrný, n_opt)       │
         └─────────────────────────────────────┘
                  ↑
                  │ Vypočítané z:
         ┌─────────────────────────────────────┐
         │       TRANSAKCIE & VYHODNOTENIA     │
         ├─────────────────────────────────────┤
         │ Transakcii (ID, dátum, typ,         │
         │           suma, zdroj, poznámka)    │
         │                                      │
         │ Vyhodnotenia (ID, dátum,            │
         │             K_inv, K_cash)          │
         │                                      │
         │ (Fáza 2)                             │
         │ Nehnuteľnosti (ID, hodnota,         │
         │   režim, hypotéka)                   │
         │ Hypotéky (zostatok, sadzba,         │
         │   splátka, dátum, lastPayment)      │
         │ Nájom (dátum, suma)                  │
         └─────────────────────────────────────┘
```

**Dôležité poznámky:**
- **Transakcie** sú immutable po zápise (úprava vytvorí novú verziu).
- **Vyhodnotenia** (snapshots) sú milníky; história sa zachováva.
- **Kapitál K** sa rozděluje na K_inv (investície, rastú s výnosom) a K_cash (hotovosť, bez výnosu).
- **Rezerva** je oddělená od K (nie je v kapitáli).
- **(Fáza 2) Hypotékarne záväzky** menia tok (splátky), K (čistá hodnota nehnuteľnosti) a scenáre.

---

## 6. JEDNOTLIVÉ KOMPONENTY A ICH ROZHRANÍ

### 6.1 Doménová vrstva (`src/domain/`)

**Modul: `goal.ts`** — Výpočet cieľa
```typescript
// Input
interface GoalInput {
  annualExpenses: number;        // V (cent)
  withdrawalRate: number;         // p (%)
  realYield: number;              // r (%)
  capital: number;                // K_inv + K_cash (cent)
  monthlySavings: number;         // m (cent)
  lastEvaluationDate: string;     // D_L (YYYY-MM-DD)
}

// Output
interface GoalOutput {
  targetAmount: number;           // T (cent)
  monthsUntilGoal: number;        // n
  goalDate: string;               // D_L + n mesiacov
  scenarios: {
    cautious: number;             // n s r-2%
    baseline: number;             // n s r
    optimistic: number;           // n s r+2%
  };
  displayRange: string;           // "január 2038 – december 2040"
}

function calculateGoal(input: GoalInput): GoalOutput
```

**Modul: `impact.ts`** — Predbežný dopad
```typescript
interface ImpactInput {
  previousCapital: number;        // K_L
  transactionsAfterLastEval: Transaction[];
  goal: GoalOutput;
}

interface ImpactOutput {
  newCapital: number;             // K_pred
  monthsShifted: number;          // Δn (môže byť zlomok, mesiacov)
  displayText: string;            // "predbežne +2 mesiace" alebo "−4 dni"
}

function calculateImpact(input: ImpactInput): ImpactOutput
```

**Modul: `snapshot.ts`** — Mesačné vyhodnotenie
```typescript
interface EvaluationInput {
  date: string;                   // Dátum vyhodnotenia
  investmentValue: number;        // K_inv
  savingsAmount: number;          // K_cash (kumulatívny stav)
}

interface EvaluationOutput {
  capital: number;                // K_inv + K_cash
  updatedGoal: GoalOutput;        // Prepočítaný cieľ
  displayText: string;            // "Posledné vyhodnotenie: ..."
}

function evaluateMonth(input: EvaluationInput): EvaluationOutput
```

**Modul: `property.ts`** (Fáza 2) — Nehnuteľnosti a hypotéky
```typescript
// Vypočet mesačnej splátky hypotéky (D-347)
function mortgagePaymentInMonthCents(property: Property, today: string): number

// Validácia záznamu o poslednej splátke
function mortgagePaymentRecordValid(property: Property): boolean

// Automatické splácanie
function amortizeMortgage(property: Property, today: string): MortgagePayment | null
```

**Charakteristika doménových funkcií:**
- Čisté, bez vedľajších účinkov.
- Testovateľné bez UI alebo úložiska.
- Vstup a výstup sú jednoduché dátové štruktúry.

### 6.2 Use-case vrstva (`src/app/`)

**Prípadové použitie: ZapísOTransakciu**
```typescript
interface SaveTransactionRequest {
  type: 'savings' | 'investment' | 'expense' | 'reserveDeposit' | 'reserveWithdraw';
  date: string;
  amount: number;
  source?: 'fromIncome' | 'fromCash' | 'fromInvestments';
  note?: string;
}

interface SaveTransactionResponse {
  success: boolean;
  transaction?: Transaction;
  impact?: ImpactOutput;
  errors?: string[];  // napr. "Hotovosť nestačila; zobraž ponuku zdroja"
}

async function saveTransaction(req: SaveTransactionRequest): Promise<SaveTransactionResponse> {
  // 1. Validácia vstupov
  // 2. Načítanie aktuálneho stavu (K_L, D_L)
  // 3. Výpočet predbežného dopadu (impact.ts)
  // 4. Uloženie transakcie (repository)
  // 5. Vrátenie výsledku s dopadom alebo chybou
}
```

**Prípadové použitie: VykonajMesačnéVyhodnotenie**
```typescript
interface EvaluateMonthRequest {
  date: string;
  investmentValue: number;
  savingsAmount: number;
}

interface EvaluateMonthResponse {
  success: boolean;
  evaluation?: EvaluationOutput;
  errors?: string[];
}

async function evaluateMonth(req: EvaluateMonthRequest): Promise<EvaluateMonthResponse> {
  // 1. Validácia vstupov
  // 2. Uloženie vyhodnotenia (snapshot)
  // 3. Prepočet cieľa
  // 4. Zobrazenie textu v prehľade
}
```

### 6.3 Úložisko (`src/storage/`)

**Rozhranie (abstrakt):**
```typescript
interface Repository {
  // Transakcie
  createTransaction(tx: Transaction): Promise<void>;
  updateTransaction(id: string, tx: Partial<Transaction>): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  listTransactions(filters?: FilterOptions): Promise<Transaction[]>;

  // Vyhodnotenia
  createEvaluation(eval: Evaluation): Promise<void>;
  getLatestEvaluation(): Promise<Evaluation | null>;
  listEvaluations(): Promise<Evaluation[]>;

  // Nastavenia
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<void>;

  // Záloha
  exportBackup(): Promise<string>;  // JSON
  importBackup(json: string): Promise<ValidationResult>;
}
```

**Implementácia: IndexedDB** (`src/storage/indexeddb.ts`)
```typescript
class IndexedDBRepository implements Repository {
  private db: IDBDatabase;

  async createTransaction(tx: Transaction): Promise<void> {
    const store = this.db.transaction('transactions', 'readwrite').objectStore('transactions');
    await store.add(tx);
  }
  // ... ostatné metódy
}
```

**Schéma IndexedDB (v19, spätne kompatibilná):**
- Store `transactions`: {id, date, type, amountCents, source, note, prizedPodPrahom, createdAt, updatedAt}
- Store `snapshots`: {id, date, investmentValueCents, savingsAmountCents, createdAt}
- Store `settings`: {key: "current", V, p, r, reserveMonths, thresholdCents, m, changedByUser: {...}}
- Store `meta`: {schemaVersion, lastExportAt}
- Store `properties` (Fáza 2): {id, valueCents, mortgageBalanceCents, ...}

---

## 7. POUŽÍVATEĽSKÉ SCENÁRE (OUTSIDE IN)

### Scenár 1: Nový používateľ prvýkrát otváram aplikáciu

```
1. Aplikácia sa načíta (PWA, offline-first).
2. Používateľ vidí vítacú obrazovku: „Vitajte v Compavene!"
3. Postupnosť nastavenia:
   a) Nastavenie cieľa (V, p, r, rezerva) s východiskovými hodnotami.
   b) Zadanie aktuálneho kapitálu (K_inv, K_cash).
   c) (Nepovinné) Nastavenie prahe výdavkov.
   d) Prvé mesačné vyhodnotenie.
4. Aplikácia zobrazuje cieľ a scenáre.
5. Používateľ môže začať zapisovať transakcie.
```

**Výstup:** Inicializovaná aplikácia s D_L, K_L a cieľovým dátumom.

---

### Scenár 2: Mesačný cyklus — zápis transakcií a vyhodnotenie

```
Počas mesiaca:
  1. Používateľ zapisuje sporenie, investície a výdavky.
  2. U každej transakcie vidí predbežný dopad (Δn).
  3. Na konci mesiaca používateľ otvorí "Mesačné vyhodnotenie".
  4. Zadá novú hodnotu investícií a stav hotovosti.
  5. Aplikácia uloží vyhodnotenie a prepočíta cieľ.
  6. Cieľ a scenáre sa aktualizujú.

Každý mesiac:
  Cieľ sa posúva (ak K rastie).
  Scenáre ostávajú rovnaké (relatívne k r).
  História snapshotov sa zobrazí v sekcii "Historia".
```

**Výstup:** Aktualizovaný cieľ (T, n, scenáre).

---

### Scenár 3: Nehnuteľnosť a hypotéka (Fáza 2)

```
Používateľ má nehnuteľnosť s hypotékou.

1. Záznam nehnuteľnosti:
   - Odhad hodnoty (V).
   - Režim: vlastné bývanie / prenájom.
   - Dátum odhadu (potreba aktualizácie ročne, D-089).

2. Záznam hypotéky:
   - Zostatok (Z).
   - Úroková sadzba (nominálna).
   - Mesačná splátka (P) podľa zmluvy.

3. Aplikácia počíta:
   - Čistá hodnota = V − Z.
   - Automatické splácanie mesiac po mesiaci.
   - K sa rozšíri o [V − Z(k)].
   - Nájom (ak prenájom) zvyšuje K_cash.

4. Dopad na cieľ:
   - Nehnuteľnosť v prenájme zvyšuje K a urýchľuje cieľ.
   - Vlastné bývanie sa do K nepočíta (D-093).
   - Po splatení hypotéky sa nájom stáva čistým sporiením.
```

**Výstup:** Prepočítaný cieľ s nehnuteľnosťami.

---

### Scenár 4: Daňový scenár (Fáza 2)

```
Používateľ chce vidieť, ako dane ovplyvňujú cieľ.

1. Používateľ si v každej investícii zvolí daňový režim (z katalógu).
2. Aplikácia zobrazí dva výpočty vedľa seba:
   a) Nominálny (bez daní).
   b) Daňový scenár (s daňami).
3. Scenár zobrazuje, či je režim "overený" alebo "neoverený".
4. Scenár nezastaví nominálny výpočet; je to doplnkový pohľad.
```

**Výstup:** Dva scenáre; používateľ má viac informácií.

---

### Scenár 5: Export zálohy a obnova

```
Používateľ si chce zálohovať dáta alebo ich preniesť na iné zariadenie.

1. Klik na "Exportovať zálohu".
2. Aplikácia vygeneruje JSON súbor (schéma v19).
3. Súbor sa stiahne (aplikácia upozorní na citlivosť dát).
4. Používateľ si súbor uloží (napr. v šifrovanom úložisku).

Pri obnove:
1. Klik na "Importovať zálohu".
2. Používateľ si zvolí súbor.
3. Aplikácia overí schému a zobrazí náhľad.
4. Po potvrdení sa dáta nahradia (s opätovným vytvorením zálohy aktuálneho stavu).
5. Aplikácia sa obnoví s importovanými dátami.
```

**Výstup:** Bezpečné presúvanie dát bez straty.

---

## 8. PORADIE IMPLEMENTÁCIE (VEĽKÉ FUNKČNÉ BLOKY)

### Blok 1: Jadro — Prepočet cieľa (Týždeň 1–2)
**Čo:** Doménová vrstva, jednotkové testy, bez UI.
- `goal.ts` — T, n, scenáre (FR-01 až FR-03).
- `impact.ts` — predbežný dopad (FR-04).
- `types.ts` — Entity (Transakcija, Vyhodnotenie).
- Golden cases: GC-01 až GC-24 (doc/07_Testing_Strategy.md).

**Výstup:** Testovaný výpočtový modul.
**Kritériá dokončenia:** Vitest 100 %, všetky GC prístupné bez UI.

---

### Blok 2: Úložisko — IndexedDB a validácia (Týždeň 2–3)
**Čo:** Úložisko a záloha.
- `indexeddb.ts` — Implementácia Repository.
- `backup.ts` — Export/Import s validáciou (FR-17, FR-18).
- Migrácia schémy (v1 až v19, spätne kompatibilná).

**Výstup:** Funkčné ukladanie a obnova.
**Kritériá dokončenia:** Import/Export testovaný bez UI; spätna kompatibilita v1–v16.

---

### Blok 3: UI — Úvodná obrazovka a prehľad (Týždeň 3–4)
**Čo:** Hlavné rozhranie.
- Prehľad (cieľ, scenáre, dopad posledných transakcií).
- Nastavenie cieľa (V, p, r, rezerva) — s východiskovými hodnotami.
- Formulár na zápis transakcie (typ, suma, dátum, poznámka).
- Mesačné vyhodnotenie (snapshot).

**Výstup:** Pracovná aplikácia bez nehnuteľností.
**Kritériá dokončenia:** Prehľad a Transakcije funkcný; E2E test (Playwright).

---

### Blok 4: História a filtrovanie (Týždeň 4–5)
**Čo:** Podrobný pohľad na minulosť.
- Zoznam transakcií s filtrami (typ, obdobie).
- História vyhodnotení (snapshots).
- Suma za obdobie.

**Výstup:** Podrobný audit a analýza.
**Kritériá dokončenia:** Filter a zoznam funkčné; E2E test.

---

### Blok 5: Offline a PWA (Týždeň 5–6)
**Čo:** Nainštalovať na zariadení.
- Service Worker (offline).
- Web App Manifest (pridanie na plochu).
- Synchrónizácia pri obnovení.

**Výstup:** Aplikácia pracuje bez internetu a ide sa pridať na plochu.
**Kritériá dokončenia:** Service Worker pracuje; iPhone: offline test a "Pridaj na plochu".

---

### Blok 6: Nehnuteľnosti a hypotéky (Fáza 2, Týždeň 7–9)
**Čo:** Rozšírenie na nehnuteľnosti.
- `property.ts` — Hypotékarne funkcie (D-347: `mortgagePaymentInMonthCents`, `amortizeMortgage`).
- UI: Formulár na nehnuteľnosť, zápis nájmu.
- Prepočet cieľa s K_nem.

**Výstup:** Aplikácia podporuje nehnuteľnosti a prenájom.
**Kritériá dokončenia:** GC-P2-01 až GC-P2-04; E2E test prenájmu.

---

### Blok 7: Daňové scenáre (Fáza 2, Týždeň 9–10)
**Čo:** Daňový modul.
- Katalóg daňových režimov.
- Daňový scenár vedľa nominálneho.
- Priradenie režimu k investícií.

**Výstup:** Dve čiary v Prehľade (nominálna + daňová).
**Kritériá dokončenia:** Scenario test; UI zobrazuje oba výpočty.

---

### Blok 8: Pokročilé — Náhľad, notifikácie, dokumentácia (Týždeň 10–11)
**Čo:** Výrazný lesk a monitoring.
- Náhľad importu (počet transakcií, dátum).
- Pripomienka na vyhodnotenie (koniec mesiaca).
- Pripomienka na zálohu (7 dní bez exportu).
- In-app pomocník (hovory?).

**Výstup:** Používateľ dostáva podporu bez zmätenia.
**Kritériá dokončenia:** Notifikácie pracujú; UI jasný.

---

### Blok 9: Bezpečnosť a audit (Týždeň 11–12)
**Čo:** Finálne kontroly.
- CSP headers (connect-src 'self').
- Безопасность exportu (GDPR, šifrovanie).
- Bezpečnostný audit.
- Kompatibilita (Chrome, Safari, Firefox; iPhone, Android).

**Výstup:** Aplikácia je bezpečná a kompatibilná.
**Kritériá dokončenia:** Bezpečnostný audit bez nálezov; Playwright na 3 prehliadačoch.

---

## 9. RIZIKÁ A OTVORENÉ ROZHODNUTIA

### Technické riziká

| Riziko | Pravdepodobnosť | Dopad | Zmierňovacia opatrenie |
|--------|---|---|---|
| **Float presnosť v výpočtoch cieľa** | Nízka | Vysoký (chyby v dátumoch) | Čisté funkcie, golden cases, jednotkové testy. |
| **IndexedDB nedostupná / plná** | Nízka | Vysoký (dáta sa nestratia, ale app padne) | Jasná hlášenie; ponuka exportu; spätná obnova. |
| **Service Worker cache zastaralý** | Stredná | Stredný (offline cachuje staré verzie) | Cache versioning; manuálna obnova. |
| **Kompatibilita schémy zálohy** | Nízka | Vysoký (nové pole môže zlomiť import) | Spätna kompatibilita, verzie, validácia. |
| **Automatické splácanie hypotéky (D-347)** | Stredná | Stredný (neskorá splátka pokazí projekciu) | `mortgagePaymentRecordValid`, E2E test, golden cases. |

### Regulačné a bezpečnostné riziká

| Riziko | Dopad | Riešenie |
|--------|---|---|
| **GDPR** (budúce viacužívateľskosť) | Vysoký | Právne posúdenie pred Fázou 1b. |
| **MiFID II** (daňové scenáre ako poradovanie) | Stredný | Jasné označenie („nie je poradovanie"), právne posúdenie. |
| **Šifrovanie exportu** (citlivé dáta) | Stredný | Rozhodnutie pred Fázou 1b: voliteľné či povinné? |
| **Záväzky bez chyby** | Vysoký | Pečlivé testovanie; regresia je neprijateľná. |

### Produktové riziká

| Riziko | Popis | Zmierňovanie |
|--------|-------|---|
| **Психologická záťaž** | Neustále sledovanie cieľa môže spôsobiť stres. | Tón aplikácie (nie urgentný), voliteľné notifikácie. |
| **Nízka frekvencia použitia** | Používateľ zabudne na mesačné vyhodnotenie. | Jemná pripomienka; offline; históriu si zachovú bez tlaku. |
| **Komplexita nehnuteľností** | Hypotékarne výpočty sú na hranici. | Pečlivé testovanie; jednoduché UI bez zastrašovania. |

---

## 10. VEDOME ODLOŽENÉ ÚLOHY

Tieto úlohy sú _užitočné vylepšenia_, ktoré sa odkladajú na neskôr (kategória C/D):

1. **Projekcia v grafe** — Animovaná línia od dnešného dátuma k cieľu (odložená, D-008).
2. **Klasifikácia spotreby** — Pravidelná vs. cielená (odložená na Fázu 1b, D-038).
3. **Mobilná aplikácia** — Natívna React Native / Flutter (Fáza 2+, mimo webovej aplikácie).
4. **Integrácia s bankou** — PSD2 konektory (Fáza 2+, licencovaný poskytovateľ).
5. **Viacmenovosť a viacštátnosť** — Presun na €, CZK, HUF, ..., ak je dopyt (Fáza 2+, právne posúdenie).
6. **Viacužívateľskosť** — Zdieľanie na domácnosti (Fáza 2+, architektonické zmeny).
7. **Automatické oceňovanie investícií** — API na trhové dáta (Fáza 2+, bez cloudovej integrácie v MVP).
8. **Návrhy na úspory** — AI doporučenia (Fáza 2+, uzavretá rozhodnutia D-XXX).
9. **In-app pomôcky a webináre** — Edukačný obsah (Fáza 2+, mimo MVP).
10. **Darčekové kódy / referrals** — Monetizácia (rozhodnuté ako zatiaľ zadarmo, D-297).

---

## 11. PLÁN KOMUNIKÁCIE S TÍMOM

### Rozhodnutia, ktoré čakajú na potvrdenie zakladateľa

1. **Bezpečnosť exportu (šifrovanie)** — Je voliteľné či povinné? (D-276 je návrh.)
2. **Náhľad pri importe** — Zobraziť počet transakcií a dátum exportu? (D-121 je návrh.)
3. **Veta pri „neoverenom daňovom režime"** — Aké vyjadrenie upozornenia? (D-082 je otvorené.)
4. **Grafická podoba scenárov** — Tabuľka, čiara, text? (D-016, S1 je návrh.)
5. **Notifikácie na mobiloch** — Sú požiadavkou či nice-to-have? (D-034 / D-035, D-042 s povinným "Pridaj na plochu".)

### Testovacia stratégia (pre tím)

- **Unit testy** (Vitest): doménová vrstva, > 95 % pokrytie.
- **E2E testy** (Playwright): Prehľad → Transakcije → Vyhodnotenie → Záloha (3 scenáre).
- **Manuálne testy** (zakladateľ, iPhone/Android): offline, cache, PWA, dopad v UI.
- **Bezpečnostný audit** (externý či interný): CSP, XSS, indexedDB, export.

---

## 12. PRÍLOHY A REFERENCIE

### Súbory na čítanie / aktualizáciu
- `docs/00_Project_Vision.md` — Vízia (platí).
- `docs/04_Functional_Requirements.md` — FR-01 až FR-28 (MVP + Fáza 2 návrh).
- `docs/05_Technical_Architecture.md` — Štruktúra kódu (platí, aktualizovať po Bloku 6).
- `decisions/Decisions.md` — D-001 až D-347 (garant rozhodnutí).
- `docs/07_Testing_Strategy.md` — Golden cases GC-01 až GC-24 (overiť).
- `docs/06_Roadmap.md` — Brány M1 až M4 (milestone naváz).

### Vnútorné súbory (v kóde)
- `src/domain/` — Čisté funkcie (bez zmien bez potvrdenia).
- `src/storage/types.ts` — SCHEMA_VERSION, READABLE_SCHEMA_VERSIONS (v19, spätna kompatibilita).
- `src/storage/validate.ts` — Validácia importu.
- `tests/mortgage-last-payment.test.ts` — 43 testov D-347 (preberať).
- `tests/household-balance.test.ts` — Bilancia domácnosti (Fáza 2).

### Externé normy a zdroje (overencie)
- [GDPR](https://gdpr-info.eu/) — Pred viacužívateľskosťou.
- [MiFID II](https://www.esma.europa.eu/policy-rules/mifid-ii-and-mifir) — Pred daňovými scenármi v EÚ.
- [4 % rule](https://www.cfiresearch.org/4-percent-rule/) — Historická referencia (D-008).
- [3,7 % withdrawal rate](https://docs.financna-sloboda.sk/withdrawal-rate-3.7-percent/) — Zdroj (D-049, D-051).

---

## 13. PODPIS NA SCHVÁLENIE

**Návrh pripravil:** Claude (AI tím)  
**Dátum návrhu:** 2026-11-07  
**Stav:** Návrh čaká na schválenie zakladateľa  

### Pole na schválenie

- [ ] Schváľujem víziu a princípy.
- [ ] Schváľujem poradie implementácie (Blok 1–9).
- [ ] Schváľujem odložené úlohy.
- [ ] Schváľujem opatrenia na riziká.
- [ ] **Otázky pred podpisom:**

  _(Prosím, vypĺňte nižšie otvorené body)_

  1. Schválený bol prioritetný Blok? (Adresa Blokov 1–3)
  2. Posúdenie bezpečnosti: Ako je to s šifrovaním exportu? (Blok 9)
  3. Právne posúdenie: Keď má aplikácia daňový scenár, čo s MiFID II? (Blok 7)
  4. Testovacia stratégia: Kto robí bezpečnostný audit? (Blok 11)

**Podpis zakladateľa:** _________________________ **Dátum:** __________

---

**KONIEC DOKUMENTU**
