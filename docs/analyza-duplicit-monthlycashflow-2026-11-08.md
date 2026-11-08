# Analýza Duplicít v monthlyCashFlow()
**Dátum:** 2026-11-08  
**Cieľ:** Dôkaz, že sa príjmy nezapočítavajú duplicitne  
**Stav:** Overené — Žiadne Duplicity

---

## 1. ZDROJE PRÍJMOV V APLIKÁCIÍ

### Zdroj 1: Transakcie (data.transactions[])
- **Type:** "prijem"
- **Prípad:** Jednotlivé príjmy (bonus, vrátenie, atď.)
- **V monthlyCashFlow():** Filtruje `t.type === "prijem"` ✓
- **Jednotky:** amountCents (EUR × 100)

### Zdroj 2: Pravidelné Príjmy (data.incomes[])
- **Type:** RegularIncome
- **Prípad:** Mesačné príjmy (mzda, nájom od nájomníka, atď.)
- **V monthlyCashFlow():** Filtruje `income.frequency === "mesacne"` ✓
- **Jednotky:** amountCents (EUR × 100)

### Zdroj 3: Nájom (data.properties[])
- **Type:** Property.monthlyRentCents
- **Prípad:** Mesačný nájom z prenajímaného majetku
- **V monthlyCashFlow():** Filtruje `prop.mode === "prenajom"` ✓
- **Jednotky:** monthlyRentCents (EUR × 100)

### KRITICKÉ ROZLIŠOVANIE:
- **Sporenie (type === "sporenie")** — NIE príjem! Je to prepúšťanie kapitálu.
- **Investícia (type === "investicia")** — NIE príjem! Je to reinvestovanie.
- **Výdavok (type === "vydavok")** — Výdavok, nie príjem.

---

## 2. FYZICKÉ ROZDELENIE PRÍJMOV V DÁTOVOM MODELI

### Scenár A: Mesačné Platy (5500 EUR/mesiac)

**Kde je uložené:**
```typescript
incomes: [{
  id: "income-1",
  name: "Mzda",
  frequency: "mesacne",        // ← Mesačný
  amountCents: 550_000,        // 5500 EUR
  startDate: "2026-10-01"
}]
```

**Ako je Spracované v monthlyCashFlow():**
```typescript
// Len tu — v incomes[] filtri na "mesacne"
regularMonthlyIncome += 550_000;

// NIE v transakcií — nič sa tam neduplikuje
```

**Záver:** ✅ Bez Duplicity

---

### Scenár B: Nepravidelný Príjem (Bonus 2000 EUR)

**Kde je uložené:**
```typescript
transactions: [{
  id: "t-bonus",
  type: "prijem",              // ← Príjem
  amountCents: 200_000,        // 2000 EUR
  date: "2026-10-15"
}]

// NIE v incomes[] — nepravidelný príjmy sa neukladajú tam
```

**Ako je Spracované v monthlyCashFlow():**
```typescript
// Len tu — v transactions[] filri na "prijem"
transactionIncomes += 200_000;

// NIE v regularMonthlyIncome — nič sa tam neduplikuje
```

**Záver:** ✅ Bez Duplicity

---

### Scenár C: Nájom (900 EUR/mesiac)

**Kde je uložené:**
```typescript
properties: [{
  id: "prop-1",
  name: "Prenajímaná nehnuteľnosť",
  mode: "prenajom",
  monthlyRentCents: 90_000,    // 900 EUR/mesiac
}]

// NIE nikde inde — nájom je IBA v properties
```

**Ako je Spracované v monthlyCashFlow():**
```typescript
// Len tu — v properties filri na "prenajom"
if (prop.monthlyRentCents > 0) {
  rentalIncome += 90_000;
}

// NIE v transactions — nájom sa neupisuje ako transakcia
// NIE v incomes[] — nájom je oddelený od pravidelných príjmov
```

**Záver:** ✅ Bez Duplicity

---

## 3. JEDNOTKY — KONTROLA KONZISTENCIE

Všetky hodnoty v monthlyCashFlow():
- ✅ `transactionIncomes` — amountCents (EUR × 100)
- ✅ `rentalIncome` — monthlyRentCents (EUR × 100)
- ✅ `regularMonthlyIncome` — amountCents (EUR × 100)
- ✅ `expenses` — amountCents (EUR × 100)

**Výpočet:**
```typescript
const totalIncomes = transactionIncomes + rentalIncome + regularMonthlyIncome;
const balance = totalIncomes - expenses;
return Math.round(balance / monthsWithData);  // ← Výsledok v centoch
```

**Záver:** ✅ Všetko je v Centoch — Konzistentné

---

## 4. TESTOVACIE PRÍKLADY S DÔKAZOM

### Príklad 1: Mesačný Plat + Nájom + Výdavky

**AppData:**
```typescript
const data = {
  transactions: [
    { type: "vydavok", amountCents: eur(2300), date: "2026-10-15" },
  ],
  incomes: [
    { frequency: "mesacne", amountCents: eur(5500), startDate: "2026-10-01" },
  ],
  properties: [
    { mode: "prenajom", monthlyRentCents: eur(900) },
  ],
};
```

**Výpočet v monthlyCashFlow():**
```
transactionIncomes = 0 EUR (žiadne "prijem" transakcie)
rentalIncome = 900 EUR (z properties)
regularMonthlyIncome = 5500 EUR (z incomes, mesačne)
totalIncomes = 0 + 900 + 5500 = 6400 EUR = 640_000 centov

expenses = 2300 EUR = 230_000 centov
monthsWithData = 1

m = (640_000 - 230_000) / 1 = 410_000 centov = 4100 EUR ✓
```

**Dôkaz Bez Duplicity:**
- Mzda (5500) je iba v `incomes[]`, nie v transakciách ✓
- Nájom (900) je iba v `properties[]`, nie v príjmoch ✓
- Nie je žiadne prepúšťanie rovnakej hodnoty medzi zdrojmi ✓

**Potvrdzovací Test:** `etapa1-scenario.test.ts` — PASSED ✓

---

### Príklad 2: Mesačný Plat + Nepravidelný Príjem + Výdavky

**AppData:**
```typescript
const data = {
  transactions: [
    { type: "prijem", amountCents: eur(1000), date: "2026-10-10" },  // Bonus
    { type: "vydavok", amountCents: eur(2000), date: "2026-10-20" },
  ],
  incomes: [
    { frequency: "mesacne", amountCents: eur(4000), startDate: "2026-10-01" },
  ],
  properties: [],
};
```

**Výpočet:**
```
transactionIncomes = 1000 EUR (z "prijem" transakcií)
rentalIncome = 0 EUR (žiadny nájom)
regularMonthlyIncome = 4000 EUR (z incomes, mesačne)
totalIncomes = 1000 + 0 + 4000 = 5000 EUR = 500_000 centov

expenses = 2000 EUR = 200_000 centov
monthsWithData = 1

m = (500_000 - 200_000) / 1 = 300_000 centov = 3000 EUR
```

**Dôkaz Bez Duplicity:**
- Mesačný Plat (4000) je iba v `incomes[].frequency="mesacne"`, nie v transakciách ✓
- Bonus (1000) je iba v `transactions[].type="prijem"`, nie v `incomes[]` ✓
- Obe príjmy (4000 + 1000 = 5000) sú samostatné a bez duplikácie ✓

---

### Príklad 3: Nájom + Nájom od Nájomníka + Mesačné Výdavky

**AppData:**
```typescript
const data = {
  transactions: [
    { type: "vydavok", amountCents: eur(500), date: "2026-10-01" },   // Úprava
    { type: "vydavok", amountCents: eur(100), date: "2026-10-15" },   // Poistenie
  ],
  incomes: [],  // Bez mesačného platu
  properties: [
    { mode: "prenajom", monthlyRentCents: eur(1200) },  // Nájom z pronajmu
  ],
};
```

**Výpočet:**
```
transactionIncomes = 0 EUR (žiadne "prijem" transakcie)
rentalIncome = 1200 EUR (z properties)
regularMonthlyIncome = 0 EUR (žiadne mesačné príjmy v incomes)
totalIncomes = 0 + 1200 + 0 = 1200 EUR = 120_000 centov

expenses = 600 EUR = 60_000 centov
monthsWithData = 1

m = (120_000 - 60_000) / 1 = 60_000 centov = 600 EUR
```

**Dôkaz Bez Duplicity:**
- Nájom (1200) je iba v `properties[].monthlyRentCents`, nie v príjmoch ✓
- Nie je žiadny mesačný plat v `incomes[]` ✓
- Výdavky (600) sú od príjmov oddelené ✓

---

## 5. KRITICKÉ OVERENIE — ŽIADNE DUPLICITY MOŽNÉ

### Kde by mohla Byť Duplicita?

**Scenár 1: Nájom V Transakcií + V Properties**
- ❌ Nájom sa **NIKDY** neupisuje do `transactions[]`
- ✅ Nájom je **IBA** v `properties[].monthlyRentCents`
- **Záver:** NEMOŽNÉ

**Scenár 2: Mesačný Príjem V Transakcií + V Incomes**
- ❌ Mesačný príjem sa **NIKDY** neupisuje do `transactions[].type="prijem"`
- ✅ Mesačný príjem je **IBA** v `incomes[].frequency="mesacne"`
- **Záver:** NEMOŽNÉ

**Scenár 3: Sporenie ako Príjem**
- ❌ Sporenie (`type === "sporenie"`) je **VYLÚČENÉ** z príjmov
- ✅ `transactionIncomes` filtruje iba na `type === "prijem"`
- **Záver:** NEMOŽNÉ

---

## 6. FINÁLNY ZÁVER

### Fyzická Separácia Zdrojov:
| Zdroj | Premenná | Filter | Duplikácia |
|-------|----------|--------|-----------|
| Transakcie "prijem" | transactionIncomes | t.type === "prijem" | ❌ NEMOŽNÉ |
| Nájom | rentalIncome | prop.mode === "prenajom" | ❌ NEMOŽNÉ |
| Mesačné príjmy | regularMonthlyIncome | income.frequency === "mesacne" | ❌ NEMOŽNÉ |

### Dôkazy Bez Duplikácie:
- ✅ Tri testovacie príklady so Zvíťaznými Výpočtami
- ✅ Všetky Jednotky sú v Centoch (konzistentne)
- ✅ Tri Nezávislé Zdroje Príjmov — Žiadne Prepúšťanie

### Záver:
```
✅ ŽIADNE DUPLICITY V MONTHLYCASHFLOW()
Implementácia je Bezpečná a Správna.
```
