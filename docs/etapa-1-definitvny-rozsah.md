# ETAPA 1: DEFINITÍVNY ROZSAH — Základná Evidencia Nehnuteľností

**Dátum:** 2026-11-08  
**Status:** Finálny plán bez zmien v kóde  
**Cieľ:** Základná evidencia nehnuteľností (zoznam, pridanie, úprava, mazanie)

---

## 📋 ROZSAH ETAPY 1 (ÚZKO DEFINOVANÝ)

### **ČO JE ZARADENÉ**

✅ **Základná Nehnuteľnosť:**
- Zoznam nehnuteľností
- Pridanie nehnuteľnosti (Create)
- Úprava nehnuteľnosti (Read/Update)
- Mazanie nehnuteľnosti (Delete)
- Uloženie do databázy
- Načítanie z databázy

✅ **Dashboard Integrácia:**
- K_nem sa počíta správne (JUŽ HOTOVÉ)
- K_total sa aktualizuje (JUŽ HOTOVÉ)
- Zmena K_nem sa zobrazuje v Dashboard (JUŽ HOTOVÉ)

✅ **Formulár Polia (BEZ HYPOTÉK):**
- Názov (text, max 80 znakov)
- Režim (select: vlastne_byvanie / prenajom / nezadane)
- Odhad hodnoty (číslo, EUR, povinné)
- Dátum odhadu (date, max dnes, povinné)
- Validácia (odhad >= 0, budúcnosť = chyba, dátum platný)

### **ČO VYRAĎUJEM Z ETAPY 1**

❌ **Hypotéka:** Zostatok, sadzba, splátka, dátum zostatku — **ETAPA 2**
❌ **Prenájom:** Mesačný nájom, nájomné ledger — **ETAPA 3**
❌ **Mimoriadne Splátky:** Extra Payment Form — **ETAPA 4**
❌ **List Vlastníctva (LV Parser):** Predvyplnenie z HTML/textu — **ETAPA 5**
❌ **Automobily a Práva (Asset):** AssetSection, AssetForm — **ETAPA 6**
❌ **Záväzky (Liability):** LiabilitySection, LiabilityForm — **ETAPA 7**

---

## 📁 SÚBORY: VYTVORÍŤ ALEBO ZMENIŤ

### **VYTVORÍŤ (2 nové komponenty)**

1. **`src/compaven-ui/PropertyForm.tsx`** — 150-200 riadkov
   - Jednoduchý formulár s 4 polami (názov, režim, odhad, dátum)
   - State management pre edit mode (new vs. update)
   - Validácia (názov, odhad, dátum)
   - Save handler s `repo.saveProperty()`
   - Cancel handler

2. **`src/compaven-ui/PropertySection.tsx`** — 200-250 riadkov
   - Zoznam nehnuteľností (prázdny stav)
   - Karta nehnuteľnosti s:
     - Názov, režim (label)
     - Odhad, dátum odhadu
     - Čistá hodnota (K_nem príspevok) — vypočítané z `netPropertyValueCents()`
     - Tlačidlá: Upraviť, Zmazať
   - Potvrdenie mazania
   - NextStep link na Dane (ak existujú nehnuteľnosti s prenájmom)

### **ZMENIŤ (3 existujúce súbory)**

1. **`src/compaven-ui/App.tsx`** — 1-2 zmeny
   - **Zmena 1:** Import `PropertySection` (riadok ~15)
   - **Zmena 2:** Render condition pre "assets" (riadok ~193)
     - Zmeniť z: `<div>Majetok & Záväzky (v príprave)</div>`
     - Na: `<PropertySection repo={repo} properties={data.properties} today={todayIso()} onSaved={reload} />`

2. **`src/compaven-ui/Navigation.tsx`** — 0 zmien (JUŽ AKTÍ)
   - Link "Majetok & Záväzky" s id "assets" — JUŽ EXISTUJE

3. **`src/compaven-ui/Layout.tsx`** (ak je potrebné) — 0 zmien
   - Pravdepodobne bez zmien

---

## 🧪 TESTY: VYTVORIŤ

### **NOVÉ TEST SÚBORY (2)**

1. **`tests/property-section-e2e.test.ts`** — 100-150 riadkov
   - Test: Prázdny stav (text "Zatiaľ nie je zapísaná...")
   - Test: Formulár sa otvorí pri kliknutí na "Pridať nehnuteľnosť"
   - Test: Záznam sa uloží a zobrazí v zozname
   - Test: Karta zobrazuje správne údaje
   - Test: Edit: Formulár sa naplní existujúcimi dátami
   - Test: Delete: Potvrdenie a mazanie funguje

2. **`tests/property-integration-k_nem.test.ts`** — 80-100 riadkov
   - Test: K_nem sa zmení keď sa pridá nehnuteľnosť
   - Test: K_nem = odhad - hypotéka (BEZ hypoték, tak len odhad)
   - Test: Dashboard JUŽ zobrazuje zmenu v K_nem
   - Scenár: Pridaj nehnuteľnosť s odhad 200 000 EUR
     - Očakávaný K_nem príspevok: 200 000 EUR

### **EXISTUJÚCE TESTY (bez zmien)**

✅ `tests/property.card.test.ts` — JUŽ POKRYŤ `netPropertyValueCents()`
✅ `tests/etapa1-scenario.test.ts` — JUŽ POKRYŤ K_nem výpočty

---

## ✅ KRITÉRIÁ ÚSPEŠNÉHO DOKONČENIA ETAPY 1

### **Technické Kritériá**

1. ✅ **Kompilácia bez chýb**
   - `npm run build` — bez TypeScript chýb
   - `tsc` — bez type errors

2. ✅ **Testy (2 nové)**
   - `npm test` — oba nové testy prejdú
   - Bez nových failov (11 schemaVersion failov sú OK — nie majetok-špecifické)

3. ✅ **Databáza**
   - `repo.saveProperty()` — uloží nehnuteľnosť
   - `repo.getData().properties` — vráti uložené údaje
   - IndexedDB: `compaven-2.0` — bez zmien schémy

4. ✅ **Validácia**
   - Prázdny názov — chyba "Vyplň názov"
   - Záporný odhad — chyba "Odhad nesmie byť záporný"
   - Budúci dátum — chyba "Dátum v budúcnosti"
   - Bez dátumu — chyba "Vyplň dátum"

5. ✅ **UI Správne**
   - Formulár sa otvorí pri kliknutí na tlačidlo
   - Formulár sa zatvorí pri Cancel
   - Záznam sa zobrazí v zozname po Save
   - Karta zobrazuje: názov, režim, odhad, dátum, K_nem príspevok
   - Edit: Formulár sa naplní údajmi
   - Delete: Potvrdenie dialóg
   - Delete: Záznam sa zmaže

### **Integračné Kritériá**

6. ✅ **Dashboard Integrácia**
   - Dashboard JUŽ zobrazuje K_nem
   - K_nem sa zmení keď sa pridá nehnuteľnosť (iba odhad, bez hypoték)
   - Scenár: Pridaj nehnuteľnosť s odhad 200 000 EUR
     - K_nem sa zvýši o 200 000 EUR
     - K_total sa zvýši o 200 000 EUR
     - K_FIRE sa bez zmeny

7. ✅ **Bez Regresií**
   - Existujúce testy (unit, E2E) — bez nových failov (okrem 11 schemaVersion)
   - Dashboard — bez zmien v iných údajoch
   - Ostatné moduly — bez vplyvu

---

## 📊 VÝPOČTY NA OVERENIE (IZOLOVANÝ SCENÁR)

### **Test: Pridaj 1 Nehnuteľnosť**

**Vstup:**
```
Vlastné bývanie:
- Odhad: 200 000 EUR
- Bez hypotéky (mortgageBalanceCents = 0)
```

**Očakávaný Výstup:**

| Metryka | Pred Etapou 1 | Po Etape 1 | Zmena |
|---------|---|---|---|
| K_nem | 0 EUR | 200 000 EUR | +200 000 EUR |
| K_inv | 60 000 EUR | 60 000 EUR | 0 EUR |
| K_cash | 20 000 EUR | 20 000 EUR | 0 EUR |
| K_FIRE | 80 000 EUR | 80 000 EUR | 0 EUR |
| K_total | 80 000 EUR | 280 000 EUR | +200 000 EUR |
| Mesačný tok (m) | Bez zmeny | Bez zmeny | 0 EUR |

**Čo sa overuje:**
1. ✅ K_nem sa počíta správne (200 000 EUR)
2. ✅ K_FIRE sa NEMENÍ (bez hypoték, bez hypotékárnych splátok)
3. ✅ K_total sa zvýši presne o K_nem príspevok
4. ✅ Mesačný tok sa NEMĚNÍ (bez hypoték, bez nájmu — Etapa 3)

---

## 🎯 IMPLEMENTAČNÝ PLÁN ETAPY 1

### **Krok 1: PropertyForm.tsx** (~2-3 hodiny)
- State (name, mode, valueCents, valueDate)
- Renderovať 4 polia
- Validácia
- Save handler
- Cancel handler

### **Krok 2: PropertySection.tsx** (~3-4 hodiny)
- State (editing, properties)
- Prázdny stav
- Zoznam s kartami
- Karta: názov, režim, odhad, dátum, K_nem
- Tlačidlá: Upraviť, Zmazať
- Potvrdenie mazania
- onSaved callback

### **Krok 3: App.tsx Integrácia** (~30 min)
- Import PropertySection
- Render "assets" page s PropertySection
- Prepojenie repo, data, reload

### **Krok 4: Testy** (~2-3 hodiny)
- property-section-e2e.test.ts (CRUD)
- property-integration-k_nem.test.ts (K_nem zmeny)
- Spustenie a overenie

### **Krok 5: Manual Testing** (~1-2 hodiny)
- Pridaj nehnuteľnosť
- Over K_nem v Dashboard
- Uprav nehnuteľnosť
- Zmaž nehnuteľnosť
- Desktop + Mobile

---

## ⏱️ CELKOVÝ ČAS: 10-15 Hodín

- Implementácia: 8-10 hodín
- Testy: 2-3 hodiny
- Manual Testing: 1-2 hodiny

---

## 🚫 ČÍTANIA Z ETAPY 1

**NEBUDE ZARADENÉ:**
- ❌ Hypotéka (žiadne polia, žiadne výpočty)
- ❌ Prenájom (žiadne polia)
- ❌ Mimoriadne splátky (žiadny formulár)
- ❌ LV Parser (žiadny import)
- ❌ Automobily (žiadna AssetSection)
- ❌ Záväzky (žiadna LiabilitySection)

**ZÁVÄZKY ETAPY 1:**
- Databáza: ✅ **PRIPRAVENÁ** (bez zmien)
- Repository: ✅ **HOTOVÉ** (saveProperty, deleteProperty)
- Kontext: ✅ **HOTOVÉ** (K_nem sa počíta)
- Dashboard: ✅ **HOTOVÉ** (zobrazuje K_nem)
- Validácia: ✅ **HOTOVÁ** (validateProperty)

---

## ✅ POTVRDENIE FAKTOV

**Všetky tvrdenia sú OVERENÉ bez zmien v kóde:**
1. ✅ netPropertyValueCents() je správne implementovaná
2. ✅ K_nem sa počíta bez filtra `countsInCapital`
3. ✅ Dashboard JUŽ zobrazuje K_nem
4. ✅ Repository má metódy gotové
5. ✅ AppData má properties pole
6. ✅ Bez porušenia existujúcich testov (okrem 11 schemaVersion — nie majetok-špecifické)

---

**Status:** ✅ **ETAPA 1 JE PRIPRAVENÁ NA SCHVÁLENIE A IMPLEMENTÁCIU**

**Bez zmien v kóde:** Všetky analýzy sú len čítané.
