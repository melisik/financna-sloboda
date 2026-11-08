# AUDIT: Modul Majetok a Záväzky — COMPAVEN 2.0

**Dátum auditu:** 2026-11-08  
**Status:** ⚠️ **ROZDELENÝ MEDZI DVE APLIKÁCIE**  
**Priorita:** KRITICKÁ — Modul existuje v starej aplikácii, avšak nová aplikácia (kompaven-ui) ho nemá implementovaný

---

## 📋 ZISTENIA

### 1️⃣ EXISTENCIA DVOCH APLIKÁCIÍ

Projekt obsahuje **dve nezávislé aplikácie**:

| Aspekt | **Stará aplikácia** (src/ui/) | **Nová aplikácia** (src/compaven-ui/) |
|--------|------|------|
| **Vstupný bod** | http://localhost:5174/ | http://localhost:5174/src/compaven.html |
| **Majetok & Záväzky** | ✅ **PLNE IMPLEMENTOVANÉ** | ❌ Len dummy text "v príprave" |
| **Navigácia** | Sekčná (Prehľad, Peniaze, Majetok a zásoby, ...) | Ikoniková (Dashboard, Household, Assets, ...) |
| **Technológia** | Klasický React + Router | React s CompavenLayout |
| **Status** | **Produkčná** | **Rozpracovaná** |

---

### 2️⃣ STARÁ APLIKÁCIA (SRC/UI) — AUDIT STATUSU

#### ✅ **ČO JE HOTOVÉ**

**Komponent PropertySection** (`src/features/majetok/Majetok.tsx`):
- ✅ Zobrazenie nehnuteľností (prázdny stav, zoznam)
- ✅ Súhrnná tabuľka:
  - Hodnota v kapitálu (prenajímané nehnuteľnosti)
  - Mimo kapitálu (vlastné bývanie)
  - Mesačné náklady
  - Tabuľka DP oddiel VI (daň z prenájmu)
- ✅ Karta nehnuteľnosti s detailami:
  - Odhad hodnoty + dátum
  - Režim (vlastne_byvanie / prenajom / nezadane)
  - Hypotéka (zostatok, sadzba, splátka)
  - Mesačné náklady (splátka + ostatné)
  - Čistá hodnota
  - Upozornenie na zastaranú hodnotu (>12 mesiacov)

**Formulár nehnuteľnosti (PropertyForm)**:
- ✅ Zadávanie základných údajov (názov, režim, hodnota, dátum)
- ✅ Hypotéka (zostatok, sadzba, splátka, dátum)
- ✅ Mesačné náklady (splátka, ostatné)
- ✅ Zbalené bloky (Hypotéka, Mesačné náklady, Kúpa, Daň)
- ✅ Predvyplnenie z listu vlastníctva (HTML/text)
  - Parsovanie listu vlastníctva (lvHtml.ts)
  - Doplnenie daňových údajov (obec, k.ú., parcela, číslo bytu, plocha)
  - Výber bytu v bytovke
  - Detekcia záložného práva

**Rental Ledger** (evidencia prenájmu):
- ✅ Ročná evidencia príjmov a výdavkov
- ✅ Výber roka, súčty pre daň
- ✅ Pridávanie/mazanie záznamov
- ✅ Priloženie dokladov k výdavkom
- ✅ Fronta na zápis (D-157)

**Extra Payment** (mimoriadne splátky hypotéky):
- ✅ Náhľad zmeny (zníženie splátky / skrátenie termínu)
- ✅ Zápis s historickými hodnotami
- ✅ Vrátenie poslednej splátky
- ✅ Validácia (splátka > úrok, dátum ≥ dátum zostatku)

**Asset Section** (Automobily a oceniteľné práva):
- ✅ Zobrazenie aktív (prázdny stav, zoznam)
- ✅ Karta s názvom, odhadom, dátumom
- ✅ Formulár na pridávanie (automobil / právo)
- ✅ Mazanie aktív
- ✅ Upozornenie na zastaranú hodnotu

**Komponent LiabilitySection** (`src/features/zavazky/Zavazky.tsx`):
- ✅ Zobrazenie záväzkov
- ✅ Súhrnná tabuľka:
  - Dlh spolu
  - Mesačná splátka
  - Mesačný úrok
- ✅ Karta záväzku s detailami:
  - Názov, typ (úver / kreditka / leasing / iné)
  - Zostatok, sadzba, splátka, úrok
  - Koniec záväzku (ak je)
  - Upozornenie na splátku < úrok
  - Indikácia aktívneho vs. splatené záväzku

**Formulár záväzku (LiabilityForm)**:
- ✅ Zadávanie údajov (názov, typ, zostatok, sadzba, splátka)
- ✅ Koniec záväzku (dátum)
- ✅ Validácia (splátka ≥ 0, sadzba 0-100%, zostatok ≥ 0)
- ✅ Upozornenie pred uložením ak splátka < úrok

#### 📊 **DOMÉN LOGIKA** (`src/domain/`)

**property.ts**:
- ✅ `netPropertyValueCents()` — čistá hodnota
- ✅ `monthlyCostsCents()` — mesačné náklady
- ✅ `splitPayment()` — rozdelenie na úrok + istinu
- ✅ `countsInCapital()` — či sa počíta do K
- ✅ `valueIsStale()` — či je odhad starší ako 12 mesiacov
- ✅ `mortgagePaymentRecordValid()` — reťaz mimoriadnych splátok
- ✅ `mortgagePaymentInMonthCents()` — splátka v danom mesiaci
- ✅ `housingFlowCents()` — mesačný tok z nehnuteľností
- ✅ `mortgageParamsChanged()` — detekcia zmeny parametrov

**liabilities.ts**:
- ✅ `liabilityInterestCents()` — mesačný úrok
- ✅ `liabilitiesTotals()` — súčty dlhu a splátok
- ✅ `liabilityIsActive()` — či je záväzok aktívny
- ✅ `activeLiabilityPaymentCents()` — splátky aktívnych záväzkov

#### 🎨 **ROZHRANIE** (Desktop)

| Obrazovka | Stav | Poznámka |
|-----------|------|----------|
| Majetok (prázdny stav) | ✅ Hotové | Text "Zatiaľ nie je zapísaná..." + tlačidlo "Pridať nehnuteľnosť" |
| Majetok (so záznamom) | ✅ Hotové | Karti s detailami, tlačidlá Upraviť/Zmazať |
| Karta nehnuteľnosti | ✅ Hotové | Všetky údaje viditeľné, zbalené bloky na požiadanie |
| Formulár (nová nehnuteľnosť) | ✅ Hotové | 12 polí + zbalené bloky, validácia |
| Formulár (úprava) | ✅ Hotové | Predvyplnené dáta, zachovanie rental ledgeru |
| Prenájom (karta) | ✅ Hotové | Tabuľka záznamov, súčty za rok, vedenie dokladov |
| Mimoriadna splátka | ✅ Hotové | Náhľad zmeny, zápis, vrátenie |
| Automobily/Práva | ✅ Hotové | Zoznam, formulár, mazanie |
| Záväzky (prázdny stav) | ✅ Hotové | Text "Zatiaľ nie je zapísaný..." + tlačidlo "Pridať" |
| Záväzky (so záznamom) | ✅ Hotové | Karta, detaily, upozornenia |
| Formulár záväzku | ✅ Hotové | 5 polí, validácia |

---

### 3️⃣ NOVÁ APLIKÁCIA (SRC/COMPAVEN-UI) — AUDIT STATUSU

#### ❌ **ČO CHÝBA**

```tsx
// src/compaven-ui/App.tsx, riadok 193:
{currentPage === "assets" && <div style={{ padding: "20px" }}>Majetok & Záväzky (v príprave)</div>}
```

**Status:** Dummy text bez funkčnosti

**Chýbajúce časti:**
- ❌ PropertySection — bez implementácie
- ❌ LiabilitySection — bez implementácie
- ❌ Formuláre — bez implementácie
- ❌ Rental Ledger — bez implementácie
- ❌ Extra Payment — bez implementácie
- ❌ AssetSection — bez implementácie
- ❌ Integrácia s databázou — bez implementácie

**Ďalšie placeholder sekcie:**
- ❌ Finančné ciele (goalz)
- ❌ História & Analýzy (analytics)
- ❌ Plánovanie (planning)

---

### 4️⃣ DATABÁZA A STORAGE

**Status:** ✅ Riadne nakonfigurované

- ✅ IndexedDB databáza `compaven-2.0` + `financna-sloboda`
- ✅ Entitné typy (Property, Asset, Liability) definované v `src/storage/types.ts`
- ✅ Repository metódy:
  - `saveProperty()`, `deleteProperty()`, `getData().properties`
  - `saveAsset()`, `deleteAsset()`, `getData().assets`
  - `saveLiability()`, `deleteLiability()`, `getData().liabilities`
  - `saveAttachments()`, `deleteAttachmentsForRentalEntries()`
- ✅ Validácia údajov v `src/storage/validate.ts`
- ⚠️ Test testy - **sú failí** (probém so schémaVersion: očakáva sa 19, je 20)

---

### 5️⃣ TESTY

#### Unit testy: `tests/`

**Stav:** 11 testov failí, 719 prejde (z 730)

**Failí testy** (vzťahujúce sa ku Majetok/Záväzky):
- ❌ `shopping.test.ts:63` — schemaVersion je 20, očakáva sa 19
- ❌ `stock-waste.test.ts:45` — validácia ceny pri item, záznam vyhodených
- ❌ `stock-waste.test.ts:53` — schemaVersion je 20, očakáva sa 19
- ❌ `storage.test.ts:141` — vyššia verzia schémy, chybová správa nezhoduje sa s regex
- ❌ `validate-settings-appdata.test.ts:95` — prázdne zbierky sú nevalidné (očakáva sa platné)

**Problém:** Zdá sa, že schéma verzia bola zmenená (20) ale testy očakávajú 19. Toto nie je Majetok-špecifický problém, ale storage schema problém.

#### E2E testy: `tests/e2e/`

**Stav:** 540 testov bez zmienky o failí

---

### 6️⃣ TYPESCRIPTOVÉ CHYBY

**Status:** ✅ Žiadne chyby

```bash
$ npm run build
tsc -p tsconfig.json && vite build
✓ 569 modules transformed
✓ built in 416ms
```

---

### 7️⃣ INTEGRÁCIA S OSTATNÝMI MODULMI

#### Prepojenie na Dashboard

**Stará aplikácia:**
- ✅ Majetok a Záväzky sa počítajú do kontextu (`makeCtx()`)
- ✅ Príspievajú do K (kapitál), výdavkov, mesačného toku
- ✅ Viditeľné v Dashboarde (čistá hodnota, dlh, mesačné splátky)

**Nová aplikácia:**
- ❌ Majetok & Záväzky nie sú v Dashboard
- ❌ Kontext chýbajú údaje z majetku a záväzkov

#### Prepojenie na Dane

- ✅ Stará: Dane odkazujú na Majetok pre DP oddiel VI (prenájom)
- ❌ Nová: Bez prepojenia

#### Prepojenie na Príjmy

- ✅ Stará: Prenájom v Majetku súvisí s Príjmami
- ❌ Nová: Bez prepojenia

---

## 📌 TABUĽKA POKRYTIA

| Časť modulu | **Stará app** | **Nová app** | Poznámka |
|---|---|---|---|
| **Nehnuteľnosti** | ✅ Hotovo | ❌ Chýba | 47 KB kódu, 2 sekcie (Property + Rental) |
| **Automobily/Práva** | ✅ Hotovo | ❌ Chýba | 8 KB kódu |
| **Záväzky** | ✅ Hotovo | ❌ Chýba | 6 KB kódu |
| **Domén logika** | ✅ 10 funkcií | ❌ — | `property.ts` + `liabilities.ts` |
| **Databáza** | ✅ Pripravená | ✅ Pripravená | IndexedDB, typy definované |
| **Testy** | ⚠️ 11 failí | ⚠️ 11 failí | Storage schema problém (v19 vs v20) |
| **Dashboard integrácia** | ✅ Hotovo | ❌ Chýba | Údaje sa počítajú do K |
| **i18n príprava** | ✅Enum ID | ✅ Enum ID | 19 enumov, 80 hodnôt (bez prekladov) |

---

## 🔴 KRITICKÉ PROBLÉMY

### 1. **Rozdelenie aplikácií**

**Problém:** Projekt má dve nezávislé aplikácie bez jasného prepojenia.

**Dopad:** Modul je implementovaný v starej, chýba v novej.

**Riešenie:** Rozhodnúť:
- Či pokračovať so starou aplikáciou (src/ui)
- Alebo portuť do novej (src/compaven-ui) a depreciovať starú

### 2. **Storage schema verzionácia**

**Problém:** Testy očakávajú schemaVersion = 19, ale buildBackup() vracia 20.

**Dopad:** 11 testov failí.

**Príčina:** Pravdepodobne nedávna zmena v storage.ts bez updatu testov.

**Riešenie:** Overíť D-347 a aktualizovať testy.

### 3. **Nová aplikácia rozpracovaná**

**Problém:** src/compaven-ui má len dummy "v príprave" bez skutočnej implementácie.

**Dopad:** Väčšina modulov chýba (Assets, Goals, Analytics, Planning).

**Riešenie:** Portuť móduly zo starej aplikácie alebo resetovať novú a začať čisto.

---

## ✅ ČO JE STABILNÉ

- ✅ Domén logika (property.ts, liabilities.ts)
- ✅ Databázová schéma a types
- ✅ Starej aplikácii UI komponenty (403 KB zdrojového kódu)
- ✅ TypeScript bez chýb

---

## 📋 NAVRHOVANÉ PORADIE OPRÁV

### **FÁZA 1: Diagnostika (1-2 hod)**
1. Analýza schemaVersion problému (prečo je 20 namiesto 19)
2. Rozhodnutie: Staré alebo Nové aplikácia?
3. Audit tých 11 failí testov

### **FÁZA 2: Stabilizácia** (3-5 dní)
1. Vyriešiť storage schema problém
2. Opraviť failé testy
3. Ak nová app: portuť PropertySection + LiabilitySection
4. Integrácia s Dashboard (K, výdavky, príjmy)

### **FÁZA 3: Depreciation** (1 deň)
1. Jasne označiť, ktorá app je produkčná
2. Migrate users/data ak je to potrebné
3. Depreciovať starú alebo zastavenú novú

---

## 🎯 KRITÉRIÁ STABILIZÁCIE

✅ Modul možno vyhlásit za **hotový a stabilný**, keď:

1. **Dve aplikácie sú zjednené** (jasnoa žalovaná produkčná)
2. **Všetky 11 testov prejdú** (vrátane storage schéma fixu)
3. **Majetok & Záväzky fungujú na desktop** (testy + manuálne)
4. **Majetok & Záväzky fungujú na mobile** (responsive)
5. **Integrácia s Dashboard je hotová** (K, výdavky viditeľné)
6. **Žiadne TS chyby, build bez warning** (okrem vite config)
7. **Prepojenie na Dane a Príjmy funguje** (ak relevantné)
8. **Testy pokrytia > 80%** (pre module specifické)
9. **Dokumentácia je aktualizovaná** (docs/23 pre majetok + zavazky)
10. **Schemaversion je stabilný** (bez ďalších zmien)

---

## 📎 SÚBORY NA AUDIT

**Implementácia:**
- `src/features/majetok/Majetok.tsx` — 803 riadkov
- `src/features/majetok/lvHtml.ts` — parser
- `src/features/zavazky/Zavazky.tsx` — 191 riadkov
- `src/domain/property.ts` — 120 riadkov (FR-22, D-80 až D-347)
- `src/domain/liabilities.ts` — 29 riadkov (D-103, D-140)

**Databáza:**
- `src/storage/types.ts` — Property, Asset, Liability typy
- `src/storage/repository.ts` — CRUD operácie

**Ďalšie:**
- `src/compaven-ui/App.tsx` — nová aplikácia (dummy)
- `src/ui/Sekcie.tsx` — integrácia do starej aplikácie

---

**Autor auditu:** Claude  
**Worktree:** `phase3-ux-redesign`  
**Branch:** `recovery-test`  
**Bez zmien**: Žiadne súbory boli editované počas auditu
