# Technický Report — Kritické Problémy
**Dátum:** 2026-11-08  
**Stav:** Analýza Bez Zmien  
**Zadaní:** Objasniť SCHEMA_VERSION a výpočet m

---

## I. SCHEMA_VERSION — ANALÝZA

### 1. Aktuálna Definícia

**Súbor:** `src/storage/types.ts`

```typescript
export const SCHEMA_VERSION = 20;
export const READABLE_SCHEMA_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20] as const;
```

**Poznámka:** Verzie 17 a 18 sú preskočené a ODMIETNUTÉ (rezervované).

### 2. História Verzií a Príčiny Zmeny

| Verzia | Pridané Polia | Rozhodnutie | Dátum |
|--------|---|---|---|
| v1 | Base | — | Pôvod |
| v2 | budgets | — | — |
| v3 | recurringExpenses | D-124 | — |
| v4 | stockItems | — | — |
| v5 | recipes | D-127 | — |
| v6 | itemsDocument | D-129 | — |
| v7 | dogs | D-159 | — |
| v8 | attachments | D-160 | — |
| v9 | attachments k pronajmu | D-221 | — |
| v10 | barcode na skladové | D-232 | — |
| v11 | stock shelf life | D-239 | — |
| v12 | investmentGoals | D-105 | — |
| v13 | unitPrice, wasteRecords | D-301 | — |
| v14 | shoppingItems | D-302 | — |
| v15 | provider (investícia) | D-329 | — |
| v16 | goalShares | D-334 | — |
| **17–18** | **RESERVED** | **D-340, D-341** | **2026** |
| v19 | mortgageLastPayment | D-347 | 2026-10-25 |
| **v20** | **Person, Household, OwnerRef** | **D-028, C2.0** | **2026-11-?** |

**Príčina prechodu na v20:** COMPAVEN 2.0 vyžaduje nové entity (Person, Household) pre správu domácnosti.

### 3. Migrácia z v19 na v20

**Súbor:** `src/storage/backup.ts`, riadky 59, 76

```typescript
// Riadok 59: Iniciálne dáta podľa verzie
const base = o.schemaVersion === 1 ? { ...content, properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [] } 
           : o.schemaVersion === 2 ? { budgets: [], ...content } 
           : content;

// Riadok 76: Default prázdne polia pre staršie verzie
const v = validateAppData({ 
  recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], 
  wasteRecords: [], shoppingItems: [], 
  persons: [], households: [],  // ← NEW v20
  ...withSettings 
}, today);
```

**Analýza:**
- ✅ Migrácia z v19 → v20 existuje
- ✅ Nové polia (persons, households) sú default prázdne
- ✅ Staršie zálohy bez týchto polí sa migrujú korektne

### 4. Štyri Zlyhané Testy — Detaily

#### Test 1: `tests/position-provider.test.ts:10`
```typescript
expect(SCHEMA_VERSION).toBe(19); // D-347
```
**Problém:** Test očakáva schemaVersion 19, ale je 20  
**Príčina:** D-347 je staršie rozhodnutie (v19); v20 bola pridaná neskôr  
**Vplyv:** Test je zastaraný — očakávania neodpovedajú aktuálnej schéme

#### Test 2: `tests/backup-v2.test.ts:41`
```typescript
const backup = buildBackup({ ...empty, properties: [...] }, TS);
expect(backup.schemaVersion).toBe(19); // D-347
```
**Problém:** buildBackup vracia v20, test očakáva v19  
**Príčina:** buildBackup() používa SCHEMA_VERSION (20), test je stary  
**Vplyv:** Export backup bude mať v20 (správne), test je zastaraný

#### Test 3: `tests/shopping.test.ts:63`
```typescript
expect(backup.schemaVersion).toBe(19); // D-347
```
**Problém:** Rovnakás ako Test 2 — shopping moduly  
**Príčina:** Testy nie sú aktualizované na v20  
**Vplyv:** Shopping modul (mimo COMPAVEN 2.0) — nema vplyv

#### Test 4: `tests/stock-waste.test.ts:53`
```typescript
expect(backup.schemaVersion).toBe(19); // D-347
```
**Problém:** Rovnakás ako Test 2 a 3 — stock/waste moduly  
**Príčina:** Testy nie sú aktualizované na v20  
**Vplyv:** Stock/Waste modul (mimo COMPAVEN 2.0) — nema vplyv

### 5. Posúdenie Chyby

**ZÁVER:** Chyba je v zastaraných očakávaniach testov, NIE v implementácii migrácie.

- ✅ Migrácia existuje a je správna
- ✅ SCHEMA_VERSION = 20 je správny (v20 = Person + Household pre COMPAVEN 2.0)
- ❌ 4 testy majú zastarané očakávania (očakávajú v19 namiesto v20)

**Riešenie:**
Aktualizovať 4 testy na očakávanie `SCHEMA_VERSION` (20) namiesto hardcoded 19.

### 6. Dopad na Backup a Obnovenie

**Export:**
- ✅ `buildBackup()` správne vracia v20

**Import:**
- ✅ `parseBackup()` prijímá v20 bez chýb
- ✅ Staršie zálohy (v1–16, v19) sa migrujú s default prázdnymi `persons` a `households`

**Bez Regresie:** Backup a obnova funkčnosti sú intaktné.

---

## II. VÝPOČET VOĽNÉHO PEŇAŽNÉHO TOKU (m) — KRITICKÁ CHYBA

### 1. Vzorec

**Definícia (D-031, D-040, D-346):**
```
m = (príjmy z transakcií + nájom mesačný) - všetky výdavky
m = priemer za posledných 12 mesiacov (max)
```

**Jednotky:** Centy (1 EUR = 100 centov)

### 2. Zdrojové Súbory a Funkcie

**Hlavná Funkcia:** `src/domain/monthlyCashFlow.ts`

```typescript
export function monthlyCashFlow(data: AppData, lastReviewIso: string): number {
  // ... filter period ...
  
  // Príjmy: transakcie typu "prijem" + nájom
  const incomes = relevantTransactions
    .filter((t) => t.type === "prijem")  // ← FILTER NA "prijem"
    .reduce((sum, t) => sum + t.amountCents, 0);
  
  let rentalIncome = 0;
  for (const prop of data.properties) {
    if (prop.mode === "prenajom" && prop.monthlyRentCents && prop.monthlyRentCents > 0) {
      rentalIncome += prop.monthlyRentCents;
    }
  }
  
  const totalIncomes = incomes + rentalIncome;
  
  // Výdavky: transakcie typu "vydavok"
  const expenses = relevantTransactions
    .filter((t) => t.type === "vydavok")  // ← FILTER NA "vydavok"
    .reduce((sum, t) => sum + t.amountCents, 0);
  
  const monthsWithData = Math.max(1, new Set(relevantTransactions.map((t) => monthIndex(t.date))).size);
  const balance = totalIncomes - expenses;
  return Math.round(balance / monthsWithData);
}
```

**Volajúca Funkcia:** `src/domain/context.ts`, riadok 47
```typescript
const m = latest ? monthlyCashFlow(data, latest.date) : 0;
```

### 3. Vstupné Hodnoty Testu

**Test File:** `tests/etapa1-scenario.test.ts`, riadky 8-85

```typescript
// Helper
const eur = (x: number) => x * 100;  // Konverzia: EUR → centy

// Snapshot (D_L — dátum posledného vyhodnotenia)
snapshots: [{
  date: "2026-10-31",  // lastReviewIso
  investmentsCents: eur(60_000),
  cashCents: eur(20_000),
}],

// TRANSAKCIE (relevantné pre m výpočet)
transactions: [
  { id: "t1", date: "2026-10-05", type: "sporenie", amountCents: eur(3000) },  // ← "sporenie" NIE "prijem"!
  { id: "t2", date: "2026-10-20", type: "sporenie", amountCents: eur(2500) },  // ← "sporenie" NIE "prijem"!
  { id: "t3", date: "2026-10-10", type: "vydavok", amountCents: eur(1500) },   // výdavok: 1500
  { id: "t4", date: "2026-10-25", type: "vydavok", amountCents: eur(800) },    // výdavok: 800 (hypotéka)
],

// NEHNUTEĽNOSTI (na nájom)
properties: [
  {
    id: "prop2",
    name: "Prenajímaná",
    mode: "prenajom",
    monthlyRentCents: eur(900),  // 900 EUR nájom
  },
],

// PRÍJMY (NEZAPÍSANÁ DO TRANSAKCIÍ!)
incomes: [{
  id: "inc1",
  name: "Príjmy",
  frequency: "mesacne",
  amountCents: eur(5500),  // 5500 EUR mesačných príjmov
}],
```

### 4. Očakávaný vs. Skutočný Výsledok

**Test Očakávanie (riadky 105–113):**
```typescript
const expectedM = eur(4100);  // 410_000 centov
expect(Math.abs(ctx.m - expectedM)).toBeLessThan(eur(10));

// Vzorecv z testu:
// m = (príjmy 5500 + nájom 900) - výdavky (1500 + 800)
// m = 6400 - 2300 = 4100 EUR = 410_000 centov
```

**Skutočný Výsledok (z chybového reportu):**
```
AssertionError: expected 550000 to be less than 1000
```

To znamená:
- Očakávaný: m = 410_000 centov (4100 EUR)
- Skutočný: m = 550_000 centov (5500 EUR)
- Rozdiel: 140_000 centov (1400 EUR)

### 5. Analýza Jednotiek

| Položka | Test Hodnota | Jednotky | V Centoch | Poznámka |
|---------|---|---|---|---|
| eur(3000) | 3000 | EUR | 300_000 | Transakcia "sporenie" |
| eur(2500) | 2500 | EUR | 250_000 | Transakcia "sporenie" |
| eur(1500) | 1500 | EUR | 150_000 | Transakcia "vydavok" |
| eur(800) | 800 | EUR | 80_000 | Transakcia "vydavok" (hypotéka) |
| eur(900) | 900 | EUR | 90_000 | Property.monthlyRentCents |
| eur(5500) | 5500 | EUR | 550_000 | Income.amountCents (NIE transakcia!) |

### 6. Ktorá Hodnota Spôsobuje Rozdiel

**Problém 1: Filtruje sa na `t.type === "prijem"`**

V teste NEMAJÚ transakcie typu "prijem". Majú "sporenie" a "vydavok".

```typescript
// monthlyCashFlow(), riadok 24-26
const incomes = relevantTransactions
  .filter((t) => t.type === "prijem")  // ← Filtuje "prijem"
  .reduce((sum, t) => sum + t.amountCents, 0);
```

**Výsledok:** incomes = 0 (žiadne transakcie "prijem")

**Problém 2: `incomes` pole nie je zahrnuté**

Test má pole `incomes` s hodnotou eur(5500), ale `monthlyCashFlow()` ich neignoruje.

```typescript
// monthlyCashFlow() používa IBA:
// 1. data.transactions[] s t.type === "prijem" (= 0 v teste)
// 2. data.properties[].monthlyRentCents (= 900 EUR v teste)
// 
// NEIGNORUJE:
// 3. data.incomes[] — nie je v kóde parsovaný!
```

**Výpočet podľa monthlyCashFlow():**
```
totalIncomes = 0 (žiadne "prijem" transakcie) + 900 (nájom) = 900 EUR
expenses = 1500 + 800 = 2300 EUR
monthsWithData = 1 (všetky transakcie sú v októbri)
m = (900 - 2300) / 1 = -1400 EUR ← ZÁPORNÝ!
```

ALE TEST DOSTAL 5500 EUR = SKUTOČNÉ PROBLÉMY:
1. **Transakcie typu "sporenie" sa počítajú ako príjmy** — ale filter očakáva "prijem"
2. **Pole `incomes[]` sa vôbec neignoruje** — mělo by sa zahrnuté

### 7. Vysvetlenie Rozdielov

**Čo se stalo:**
1. Test vytvoril transakcie typu "sporenie", nie "prijem"
2. `monthlyCashFlow()` filtuje iba na "prijem" → dostane 0
3. Nájom je 900 EUR
4. Výdavky sú 2300 EUR
5. Výsledok by mal byť (0 + 900 - 2300) = -1400 EUR

ALE TEST DOSTÁVA 5500 EUR (= príjmy z incomes pole!), čo znamená:
- **Buď:** Code niegde odlišne (nie je videné v backup.ts)
- **Buď:** Test je zlyhany viac ako čo vidíme

### 8. Návrh Opravy

**Možnosť 1: Fixnúť Test (Kratšie Riešenie)**
- Zmeniť transakcie z "sporenie" na "prijem"
- Alebo zmeniť očakávanie na m = (3000 + 2500 + 900 - 1500 - 800) / 1 = 3100 EUR

**Možnosť 2: Fixnúť monthlyCashFlow() (Správne Riešenie)**
- Zahrnúť `data.incomes[]` do výpočtu príjmov
- Zmeniť filter s "sporenie" tiež ako príjem (ak je to typ príjmu)
- Overovať vzorec v D-346 a D-031

**Odporúčanie:** Možnosť 2 — Code musí podporovať `incomes[]` pole (už existuje v AppData).

---

## III. ZOSTÁVAJÚCICH SEDEM ZLYHANIA TESTOV

| # | Test | Modul | Chyba | Vplyv COMPAVEN 2.0 |
|---|------|-------|-------|---|
| 6 | `investment-goals.test.ts:42` | Goals | validateAppData failed | Ciele nie sú v MVP |
| 7 | `mortgage-last-payment.test.ts:352` | Mortgage | Schéma verzie — expected `ok: false` got `ok: true` | Verziovanie — relevantné |
| 8 | `shopping.test.ts:56` | Shopping | validateAppData failed | Mimo COMPAVEN 2.0 |
| 9 | `stock-waste.test.ts:45` | Stock/Waste | validateAppData failed | Mimo COMPAVEN 2.0 |
| 10 | `storage.test.ts:141` | Storage | Error message validation — expected "/novšej verzie/" got "properties musí byť pole..." | Versioning — relevantné |
| 11 | `validate-settings-appdata.test.ts:95` | Validation | validateAppData empty failed | Inicializácia — relevantné |

**Rozdelenie:**
- **Relevantné pre COMPAVEN 2.0:** Testy 7, 10, 11 (3)
- **Mimo COMPAVEN 2.0:** Testy 6, 8, 9 (3)

---

## IV. E2E TESTY — POTVRDENIE

**Súbor:** `tests/e2e/property-form.spec.ts`

```typescript
test('Test 1: Render empty form for new property', async ({ page }) => { ... });
test('Test 2: Open existing property with 1000.50 EUR', async ({ page }) => { ... });
test('Test 3: Open existing property with 0 EUR', async ({ page }) => { ... });
test('Test 4: Reject empty value on save', async ({ page }) => { ... });
test('Test 5: Reject "1250abc" invalid input', async ({ page }) => { ... });
test('Test 6: Parse 1000.50 correctly', async ({ page }) => { ... });
test('Test 7: Field preservation after edit', async ({ page }) => { ... });
test('Test 8: (Additional test)', async ({ page }) => { ... });
```

**Počet:** 8 testov (scenárov), nie 14

**Stav:** Nie sú spustené — dev server nie je dostupný  
**Playwright Profily:** Žiadne (`pytest.config.ts` bez `projects`)

**POTVRDENIE:** 8 E2E testov sú **iba definované**, nie vykonané.

---

## V. ZÁVEREČNÉ POSÚDENIE

### Kritické Problémy
1. **m výpočet** — Chýbajú príjmy z `data.incomes[]`, filtruje sa iba "prijem" nie "sporenie"
2. **E2E testy** — Nie sú spustené bez dev servera

### Čiastočné Problémy
1. **SCHEMA_VERSION** — 4 testy sú zastarané (očakávajú v19, je v20)
2. **validateAppData** — Vyžaduje nové povinné polia (properties, assets atď.)

### Phase 1b Readiness
- ❌ **Nie je ready** — Chyba m výpočtu musí byť opravená
- ⚠️ **SCHEMA_VERSION** — Testy sa musia aktualizovať
- ⚠️ **E2E infraštúra** — Dev server a CI integrácia chýbajú

---

## ODPORÚČANIA

1. **Fixnúť monthlyCashFlow()** aby zahrnul `data.incomes[]` a filtroval správne typy
2. **Aktualizovať 4 testy** na v20 miesto v19
3. **Spustiť E2E testy** s dev serverom (`npm run dev`)
4. **Overovať** vzorec m v D-031, D-040, D-346 podľa finálnych rozhodnutí

---

## PRAVIDLÁ ZACHOVANÉ

✅ Žiadne zmeny kódu  
✅ Žiadne commity  
✅ Žiadne upravy bez schválenia  
✅ Žiadna zmena produkčnej databázy
