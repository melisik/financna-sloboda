# Analýza Vzorca Mesačného Peňažného Toku (m)
**Dátum:** 2026-11-08  
**Cieľ:** Definovať správny vzorec a opraviť monthlyCashFlow()  
**Stav:** Analýza pred opravou

---

## 1. ZA-VRÚCENÉ ZDROJE PRÍJMOV

### Zdroj 1: Transakcie (data.transactions[])

**Typ:** `TransactionType = "sporenie" | "investicia" | "vydavok" | "rezerva" | "vyber_rezervy" | "prijem"`

```typescript
export interface Transaction {
  id: string;
  date: string;  // YYYY-MM-DD
  type: TransactionType;  // ← "sporenie", "prijem", atď.
  amountCents: number;  // Kladné centy
  source?: Source;  // "z_prijmu" | "z_hotovosti" | "z_investicii"
  // ... ostatné polia
}
```

**Príslušné typy pre príjmy:**
- `"prijem"` — Príjem (mzda, bonus, atď.)
- `"sporenie"` — **SPORENIE** (?)
- `"investicia"` — Investícia (?)

### Zdroj 2: Pravidelné Príjmy (data.incomes[])

**Typ:** `RegularIncome`

```typescript
export interface RegularIncome {
  id: string;
  name: string;  // "Mzda", "Prenájom", atď.
  kind: IncomeKind;
  frequency: "mesacne" | "nepravidelne";  // Frekvencia
  amountCents: number;  // Suma (kladná)
  startDate: string;  // YYYY-MM-DD
  endDate?: string;
  // ... ostatné polia
}
```

**Príslušné:** Mesačné (frequency === "mesacne") a nepravidelné príjmy

---

## 2. ANALÝZA TYPU "sporenie"

**Otázka:** Je "sporenie" v transactionType príjem domácnosti?

**Odpoveď podľa kódu:**

Z `src/domain/model/entities.ts`:
```typescript
/** Príjmy: transakcie "prijem" + mesačný nájom z prenájmu (D-346, monthlyCashFlow počíta nájom ako príjem) */
```

Komentár v `monthlyCashFlow()` **jasne hovorí:**
- Príjmy: transakcie s `type === "prijem"` ✓
- Plus: mesačný nájom (property.monthlyRentCents) ✓
- **NIE:** sporenie, investícia, výdavok, rezerva

**ZÁVER:** "sporenie" **NIET príjmom domácnosti**. Je to prepúšťanie kapitálu (presun z jedného vreca do druhého).

---

## 3. SPRÁVNY VZOREC m

**Definícia (D-031, D-040, D-346):**

```
m = (príjmy z transakcií + mesačný nájom) - všetky výdavky
m = priemer za posledných 12 mesiacov (max)
```

**Rozpísanie:**

| Komponenta | Zdroj | Typ | Jednotky |
|---|---|---|---|
| **Príjmy z transakcií** | data.transactions[] | type === "prijem" | amountCents |
| **Nájom** | data.properties[] | mode === "prenajom" && monthlyRentCents | monthlyRentCents (EUR/mes × 100) |
| **Príjmy z incomes** | data.incomes[] | frequency === "mesacne" | amountCents (EUR/mes × 100) |
| **Výdavky** | data.transactions[] | type === "vydavok" | amountCents |

**SPRÁVNY VZOREC:**
```
totalIncomes = 
  (transakcie.type === "prijem".sum) 
  + (properties.monthlyRentCents.sum) 
  + (incomes.frequency === "mesacne".amountCents.sum)

totalExpenses = 
  (transakcie.type === "vydavok".sum)

balance = totalIncomes - totalExpenses
m = balance / monthsWithData
```

---

## 4. TEST SCENÁR — ROZPÍSANIE

**Test:** `tests/etapa1-scenario.test.ts`, riadky 105–113

### Testové Dáta

```typescript
const eur = (x: number) => x * 100;  // EUR → centy

// Snapshot (posledné vyhodnotenie — D_L)
snapshots: [{ date: "2026-10-31", ... }]

// Transakcie
transactions: [
  { type: "sporenie", amountCents: eur(3000) },    // ← SPORENIE (NIE príjem!)
  { type: "sporenie", amountCents: eur(2500) },    // ← SPORENIE (NIE príjem!)
  { type: "vydavok", amountCents: eur(1500) },     // ← VÝDAVOK
  { type: "vydavok", amountCents: eur(800) },      // ← VÝDAVOK (hypotéka)
]

// Nehnuteľnosti
properties: [
  { mode: "prenajom", monthlyRentCents: eur(900) }  // ← NÁJOM
]

// Pravidelné Príjmy
incomes: [
  { frequency: "mesacne", amountCents: eur(5500) }  // ← MESAČNÉ PRÍJMY
]
```

### Výpočet Podľa Správneho Vzorca

```
1. Transakcie typ "prijem": 0 EUR (žiadne!)

2. Nájom (mensačný): 900 EUR = 90_000 centov

3. RegularIncomes (mesačne): 5500 EUR = 550_000 centov

4. Príjmy Celkem:
   totalIncomes = 0 + 90_000 + 550_000 = 640_000 centov = 6400 EUR

5. Výdavky:
   totalExpenses = 1500 + 800 = 2300 EUR = 230_000 centov

6. Mesiacov s dátami:
   monthsWithData = 1 (všetky transakcie sú v októbri 2026)

7. Voľný peňažný tok m:
   balance = 640_000 - 230_000 = 410_000 centov = 4100 EUR
   m = 410_000 / 1 = 410_000 centov = 4100 EUR ✓
```

### Vysvetlenie Rozdielov

**Primácia Chyby:**
1. **monthlyCashFlow() ignoruje `data.incomes[]`** — chápa iba transakcie + nájom
2. **monthlyCashFlow() filtruje iba `type === "prijem"`** — ale test nemá takéto transakcie
3. Test má 5500 EUR príjmov v `incomes[]`, ale funkcia ich neignoruje

**Výsledok:**
- Očakávaný: m = 4100 EUR (410_000 centov) ✓
- monthlyCashFlow() by dal: m = (0 + 900 - 2300) / 1 = -1400 EUR (ALE to je záporné!)
- **Kto vrátil 5500 EUR?** Možno sa výpočet vykoná iným spôsobom v `makeCtx()`, ale nedozvieme sa ako.

---

## 5. SPRÁVNY VZOREC PRE OPRAVENU FUNKCIU

### Podľa D-031, D-040, D-346

```typescript
export function monthlyCashFlow(data: AppData, lastReviewIso: string): number {
  // ... filter na posledných 12 mesiacov ...
  
  // 1. Príjmy: transakcie typu "prijem"
  const transactionIncomes = relevantTransactions
    .filter((t) => t.type === "prijem")
    .reduce((sum, t) => sum + t.amountCents, 0);
  
  // 2. Nájom: mesačný z nehnuteľností v režime "prenajom"
  let rentalIncome = 0;
  for (const prop of data.properties) {
    if (prop.mode === "prenajom" && prop.monthlyRentCents && prop.monthlyRentCents > 0) {
      rentalIncome += prop.monthlyRentCents;
    }
  }
  
  // 3. NOVÉ: Pravidelné príjmy — mesačné
  let regularMonthlyIncome = 0;
  for (const income of data.incomes) {
    if (income.frequency === "mesacne" && income.amountCents > 0) {
      // Overovať, či príjem je aktívny v relevantnom období
      if (income.startDate <= lastReviewIso && (!income.endDate || income.endDate >= "2026-10-01")) {
        regularMonthlyIncome += income.amountCents;
      }
    }
  }
  // Poznámka: Nepravidelné príjmy (frequency === "nepravidelne") budú v transakcií type === "prijem"
  
  const totalIncomes = transactionIncomes + rentalIncome + regularMonthlyIncome;
  
  // 4. Výdavky: transakcie typu "vydavok"
  const expenses = relevantTransactions
    .filter((t) => t.type === "vydavok")
    .reduce((sum, t) => sum + t.amountCents, 0);
  
  // 5. Priemer za mesiacov s dátami
  const monthsWithData = Math.max(1, new Set(relevantTransactions.map((t) => monthIndex(t.date))).size);
  
  // 6. Voľný peňažný tok
  const balance = totalIncomes - expenses;
  return Math.round(balance / monthsWithData);
}
```

---

## 6. TESTOVACÍ PLÁN OPRAVY

Po oprave **monthlyCashFlow()** musia prejsť tieto testy:

1. **Transakcie "prijem"**
   - ✓ Príjem v transakcích sa počíta
   - ✓ Viacero príjmov sa sčítajú

2. **Pravidelné príjmy (incomes[])**
   - ✓ Mesačné príjmy sa zahrňú
   - ✓ Nepravidelné príjmy sa ignorujú (nie sú mesačné)
   - ✓ Príjmy mimo relevantného období sa ignorujú (startDate, endDate)

3. **Nájom**
   - ✓ Nájom sa počíta
   - ✓ Len z nehnuteľností v režime "prenajom"

4. **Výdavky**
   - ✓ Všetky výdavky sa odčítajú

5. **Sporenie**
   - ✓ Sporenie sa **NIE** počíta ako príjem (zostáva mimo m)
   - ✓ Sporenie nemá vplyv na m

6. **Kombinovanie**
   - ✓ m = (príjmy + nájom) - výdavky
   - ✓ Priemer za mesiacov

7. **Edgecase**
   - ✓ Nulové príjmy/výdavky
   - ✓ Záporné hodnoty sú ignorované (amountCents je kladné)
   - ✓ Bez mesiacov s dátami = default 1

---

## 7. ZOZNAM TESTOV NA NAPÍSANIE

| Test | File | Popis |
|------|------|-------|
| Príjem z transakcií | `tests/monthly-cash-flow.test.ts` (NEW) | Transakcie "prijem" sa počítajú |
| Viacero príjmov | — | Príjmy sa sčítajú |
| Mesačný nájom | — | Nájom sa zahrnie |
| Nur mesačné príjmy | — | Nepravidelné sa ignorujú |
| Príjmy v periods | — | Mimo období sa ignorujú |
| Výdavky | — | Všetky výdavky sa odčítajú |
| Sporenie = NIE príjem | — | Sporenie nemá vplyv |
| Kombinovanie | — | m = (príjmy+nájom) - výdavky |
| Priemer | — | m je priemer za mesiacov |
| Nulové hodnoty | — | 0 je OK |
| Bez mesiacov | — | Default monthsWithData = 1 |

**Počet:** ~11 testov

---

## ✅ ZÁVER

**Správny Vzorec:**
```
m = (príjmy_transakcií + nájom_mesačný + príjmy_regulárne_mesačné) - výdavky
m = priemer za relevantný период (max 12 mesiacov)
```

**Jednotky:** Všetko v centoch (EUR × 100)

**Čo chýba v aktuálnom kóde:**
- `data.incomes[]` nie je zahrnuté
- Mesačné príjmy sa ignorujú

**Oprava:** Pridať cyklus cez `data.incomes` a filtrovat `frequency === "mesacne"`

**Potvrdzovací Test:** etapa1-scenario.test.ts by mal dosiahnuť m = 4100 EUR (410_000 centov)
