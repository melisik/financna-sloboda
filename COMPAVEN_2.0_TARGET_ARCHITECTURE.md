# COMPAVEN 2.0: TARGET ARCHITECTURE
## Technické rozdelenie a migračná stratégia

**Dátum:** 2026-11-07  
**Status:** Návrh technickej architektúry nového produktu  
**Účel:** Dokonči analýzu možnosti vytvorenia COMPAVEN 2.0 ako **úplne nového produktu** s **úplným zachovaním finančných dát a doménovej logiky**

---

## EXECUTIVE SUMMARY

COMPAVEN 2.0 je možné vytvoriť ako **čistý nový produkt** s **minimálnym rizikom straty dát**. Existujúca aplikácia má **dokonalú separáciu vrstiev**:

| Vrstva | Status | Zachovať | Pretvoriť | Riziká |
|--------|--------|----------|-----------|--------|
| **Domain Layer** | ✅ STABILNÁ | 100% | Nič | Nula — čistá logika bez UI |
| **Data Layer** | ✅ OVERENÁ | 100% | Nič | Nula — abstraktné cez Repository |
| **Application Layer** | ⚠️ ČIASTOČNE | ~70% | ~30% | Nízke — navigačná logika |
| **Presentation Layer** | ❌ ZASTARALÁ | Nič | 100% | Nula — úplný rewrite je očakávaný |

**Záver:** Môžete vytvoriť COMPAVEN 2.0 bez obavy straty dát. Domain a Data layers sú **prenositeľné bez zmeny**.

---

## 1. PRESENTATION LAYER (Úplný Rewrite)

### Aktuálny stav:
- **Súbory:** `src/ui/`, `src/features/`
- **Technológia:** React 19 + CSS-in-JSX
- **Štruktúra:** Horná navigácia s tlačidlami, moduly v sidepaneli
- **Komponenty:** ~20 sekcií, ~100 React komponentov

### Na ZACHOVAŤ:
Nič. Celá Presentation Layer sa prepíše.

**Výnimka:** Lze referenciami na použitý dizajn systém a CSS-in-JSX prístup.

### Na PRETVORIŤ:
- **src/ui/App.tsx** → Nová App.tsx
  - Iniciácia Repository (zachovať)
  - Initiácia makeCtx (zachovať)
  - Nová navigácia a Shell
  - Súč logika (update)

- **src/ui/Shell.tsx** → Nová Shell.tsx
  - Desktop: Sidebar (NEW) + Content area (NEW)
  - Mobile: Bottom Navigation (NEW) + Top bar (NEW)
  - iOS Safari support (zachovať prístup)

- **src/ui/Sekcie.tsx** → Nová PageRouter.tsx
  - Místo switch statement -> nový router na základe navigácie
  - 7 głównych stránok namísto modulov

- **src/ui/Navigacia.tsx** → Nová Navigation.tsx
  - Desktop: Sidebar items
  - Mobile: Bottom navigation items
  - React Router v7 (NEW)

- **src/features/\*** → Úplný rewrite
  - Nové komponenty pre COMPAVEN 2.0 design
  - Nová vizuálna hierarchia
  - Nový CSS/styling systém (TailwindCSS?)

### Čo sa PŘENÁŠÍ bez zmeny:

```
useAutomaticUpdates.ts — logika auto-updates (nemenná)
receiptScan.ts — OCR/QR logika (nemenná)
trialNotice.ts — trial notice (nemenná)
ErrorBoundary.tsx — error handling (nemenná)
```

### Estimácia práce:
- **40-60 hodín** na rewrite presentačnej vrstvy
- Nové komponenty pre 7 obrazoviek
- Nový dizajnový systém (colors, fonts, spacing)
- Responsive design (desktop + mobile)

---

## 2. APPLICATION LAYER (Čiastočný Rewrite)

### Aktuálny stav:
- **Súbory:** `src/app/modules.ts`, `src/app/navigation.ts`, `src/app/features.ts`, `src/app/autoEvaluation.ts`, `src/app/ios.ts`
- **Funkcia:** Spájanie domény a UI, feature flags, navigácia

### Na ZACHOVAŤ (100%):
```
src/app/autoEvaluation.ts
  - Logic na automatické vyhodnotenie
  - Bez UI dependencií
  - PRENOSITEĽNÉ BEZ ZMENY

src/app/features.ts
  - Feature flags a produktové rozhodnutia
  - PRENOSITEĽNÉ s updatemi na nové features

src/app/ios.ts
  - iOS detection a PWA logika
  - PRENOSITEĽNÉ BEZ ZMENY
```

### Na ZMENU:

**src/app/modules.ts** (70% zmena)
```typescript
// Staré:
const CORE_SECTION_IDS = ["prehlad", "nova-transakcia", ...];
const OPTIONAL_MODULES = [
  { id: "majetok", label: "...", sections: [...] },
  ...
];

// Nové:
const COMPAVEN_2_0_SECTIONS = [
  "dashboard",
  "income-expenses",
  "assets-liabilities",
  "financial-goals",
  "history-analytics",
  "planning",
  "settings",
];

export function navigablePages(): readonly string[] {
  return COMPAVEN_2_0_SECTIONS;
}
```

**src/app/navigation.ts** (90% zmena)
```typescript
// Staré: Button-based navigation
export type SectionId = "prehlad" | "peniaze" | ...;

// Nové: Hierarchical navigation
export type PageId = 
  | "dashboard"
  | "income-expenses"
  | "assets-liabilities"
  | "financial-goals"
  | "history-analytics"
  | "planning"
  | "settings";

export interface NavigationState {
  currentPage: PageId;
  previousPage?: PageId;
  subPage?: string; // pre nested pages
}

export function useNavigation(): NavigationState & {
  navigateTo(page: PageId): void;
  navigateBack(): void;
}
```

### Čo sa PRENÁŠA bez zmeny:
- `readModuleChoice()` → future use (users offline)
- Auto-evaluation logic
- Feature detection
- iOS-specific handling

### Estimácia práce:
- **8-12 hodín** na zmenu aplikačnej vrstvy
- Nová navigačná logika
- Update modulov
- Testing

---

## 3. DOMAIN LAYER (100% Zachovanie)

### Status: ✅ PLNE PRENOSITEĽNÉ

**Všetky súbory v `src/domain/` ostávajú BEZE ZMENY.**

### Súbory na zachovanie:
```
src/domain/
├── capital.ts                    ✓ K_FIRE, K_total, K_nem
├── context.ts                    ✓ makeCtx() — hlavný výpočtový engine
├── monthlyCashFlow.ts            ✓ m (voľný peňažný tok)
├── goal.ts                       ✓ Výpočet cieľu
├── goalDisplay.ts                ✓ Formátovanie cieľu
├── investments.ts                ✓ Výnos, úroky
├── property.ts                   ✓ Nehnuteľnosti a prenájom
├── liabilities.ts                ✓ Záväzky
├── mortgage.ts                   ✓ Hypotéka a splátky
├── rental.ts                     ✓ Prenájom a výnosy
├── income.ts                     ✓ Príjmy
├── savings.ts                    ✓ Sporenie
├── budget.ts                     ✓ Rozpočtovanie
├── recurring.ts                  ✓ Pravidelné výdavky
├── dates.ts                      ✓ Dátové výpočty
├── assumptions.ts                ✓ Predpoklady
├── history.ts                    ✓ História zmien
├── progress.ts                   ✓ Pokrok k cieľu
├── householdBalance.ts           ✓ Domáci rozpočet
├── monthlyExpense.ts             ✓ Mesačný výdavok
├── monthSummary.ts               ✓ Mesačný súhrn
├── annualOverview.ts             ✓ Ročný prehľad
├── expenseScenario.ts            ✓ Scenáre výdavkov
├── dogs.ts                       ✓ Psy 😊
├── recipe.ts                     ✓ Recepty
├── shopping.ts                   ✓ Nákupný zoznam
├── stock.ts                      ✓ Skladové položky
├── waste.ts                      ✓ Vyhodené potraviny
├── scan.ts                       ✓ OCR/QR čítanie
├── tax.ts                        ✓ Dane
├── recommendations.ts            ✓ Odporúčania
├── model/entities.ts             ✓ Dátové entity
└── 20+ ďalších utilít...        ✓ Všetko
```

### Prečo sa **NEMENÍA:**
- **Bez React dependencií** — čisté TypeScript
- **Bez UI dependencií** — generické funkcie
- **Bez storage dependencií** — pracujú s AppData
- **Overené testy** — 604 unit testov prechádzajú
- **Finančné výpočty** — overené vzorcami a golden cases

### Výpočtový engine:
```typescript
// src/domain/context.ts
export function makeCtx(data: AppData, now: string): Context {
  // Vyrába:
  // - latest: Current snapshot
  // - target: Financial goal
  // - K_inv, K_cash, K_nem: Capital components
  // - m: Monthly cash flow
  // - Timeline to goal
  // - Monthly predictions
  // - Scenarios
  // Všetko bez UI
}
```

### Estimácia práce:
**0 hodín** — bez zmeny.

---

## 4. DATA LAYER (100% Zachovanie)

### Status: ✅ PLNE PRENOSITEĽNÉ

**Všetky súbory v `src/storage/` ostávajú BEZE ZMENY.**

### Súbory na zachovanie:
```
src/storage/
├── indexeddb.ts              ✓ DB v12 s calendarObligations
├── repository.ts             ✓ Abstract interface
├── types.ts                  ✓ Storage types (re-exported)
├── validate.ts               ✓ Data validation
├── backup.ts                 ✓ Backup/export
├── backupCrypto.ts           ✓ Encrypted backup
├── attachments.ts            ✓ File attachments
└── feed.ts                   ✓ Change feed
```

### Prečo sa NEMENÍLIA:**
- **Abstract Interface** — Repository pattern
- **Storage-agnostic** — easy to swap implementations
- **Dátová konzistencia** — verzia DB je v12
- **Bez UI dependencií** — čisté dáta

### Data Schema (v12):
```
- transactions (výdavky, príjmy, investície)
- snapshots (finančné vyhodnotenia)
- settings (užívateľské nastavenia)
- properties (nehnuteľnosti)
- investments (investičné pozície)
- liabilities (záväzky, hypotéky)
- incomes (pravidelné príjmy)
- budgets (rozpočtovanie)
- recurringExpenses (pravidelné výdavky)
- recipes (recepty)
- dogs (domáci miláčikovia)
- goals (investičné ciele)
- stockItems (skladové položky)
- wasteRecords (vyhodené potraviny)
- shoppingItems (nákupný zoznam)
- attachments (doklady)
- calendarObligations (finančný kalendár — placeholder)
```

### Stratégia zachovania dát:

**Záruky:**
1. IndexedDB v12 schéma je **kompatibilná** s oboma aplikáciami
2. Migrácия DB verzia v12 → v13, v14, ... je **gradálna**
3. Existujúce dáta sa **nemažú** — len rozširujú

**Implementácia:**
```typescript
// COMPAVEN 2.0 aplikácia sa počíta inicializovať s rovnakým DB
const db = await openRepository("compaven-2.0");
// Može byť:
// a) Nový DB s menom "compaven-2.0"
// b) Rovnaký DB "financna-sloboda" (zdieľané dáta)

// Dáta sa načítavajú rovnakým spôsobom:
const data = await repo.getData();
const ctx = makeCtx(data, today);
```

### Migration Path:
```
Stará aplikácia "Finančná sloboda"
  ↓ (IndexedDB v12)
  ├─ OPTION A: Zdieľaný DB "financna-sloboda"
  │  └─→ COMPAVEN 2.0 sa inicializuje na rovnakých dátach
  │
  └─ OPTION B: Nový DB "compaven-2.0"
     └─→ Používateľ exportuje data a importuje v COMPAVEN 2.0
```

### Estimácia práce:
**0 hodín** — bez zmeny.

---

## 5. DEPENDENT LAYERS

### Tests (`tests/`)
**Status:** Testovateľné bez zmeny, ak sa nezmení doména.

```
tests/
├── domain/*.test.ts          ✓ Všetky testy ostávajú
├── storage/*.test.ts         ✓ Storage testy ostávajú
├── e2e/*.spec.ts            ⚠️ E2E testy vyžadujú nový UI
└── scenario.test.ts          ✓ Finanční scenáre ostávajú
```

**Estimácia práce:**
- **2-4 hodiny** — update E2E testov pre novú navigáciu
- Všetky unit testy sú OK

### Dependencies (`package.json`)
**Status:** Vybrané knižnice si vyžadujú update.

```json
{
  "dependencies": {
    "react": "^19.3.1",        // Keep (novšia verzija)
    "react-dom": "^19.3.1",    // Keep
    "idb": "^8.0.4",           // Keep (storage)
    "jsqr": "^1.4.0",          // Keep (QR čítanie)
    "tesseract.js": "^7.0.0",  // Keep (OCR)
    "pdf-lib": "1.17.1",       // Keep (PDF export)
    "@zxing/library": "^0.23.0" // Keep (barcode)
  },
  "devDependencies": {
    "typescript": "^7.0.2",    // Keep
    "vitest": "^5.0.5",        // Keep
    "@playwright/test": "^1.56.0", // Keep
    "fake-indexeddb": "^6.2.6" // Keep (testing)
  }
}
```

**Nové dependencie (Odporúčané):**
```json
{
  "dependencies": {
    "react-router-dom": "^7.x",  // NEW — nová navigácia
    "@radix-ui/react-*": "...",  // OPTIONAL — UI library
    "tailwindcss": "^4.x",        // OPTIONAL — styling
    "clsx": "^2.x"                // OPTIONAL — className utility
  }
}
```

### Estimácia práce:
- **4-6 hodín** — integrácia React Router
- **2-4 hodiny** — styling setup (CSS / TailwindCSS)

---

## 6. INTEGRAČNÝ PLÁN

### Fáza 1: Zachovať doménu a dáta (0 h)
```
src/domain/     ← COPY AZ IS do COMPAVEN_2.0
src/storage/    ← COPY AZ IS do COMPAVEN_2.0
src/app/        ← COPY s malými zmeny (navigation.ts, modules.ts)
tests/          ← COPY unit testy
```

### Fáza 2: Vytvoriť novú prezenčnú vrstvu (40-60 h)
```
src/ui/         ← NEW Shell, Navigation, App
src/features/   ← NEW components pre 7 stránok
src/styles/     ← NEW styling system (TailwindCSS / CSS-in-JSX)
```

### Fáza 3: Integrovať navigáciu (8-12 h)
```
React Router v7  ← NEW router setup
Navigation.tsx   ← NEW sidebar + bottom nav
PageRouter.tsx   ← NEW page routing
```

### Fáza 4: Testing (2-4 h)
```
E2E testy        ← UPDATE pre novú navigáciu
Unit testy       ← VERIFY domény bez zmeny
```

### Fáza 5: Migration údajov (4-6 h)
```
export / import  ← OLD app → NEW app
DB schema check  ← v12 kompatibilita
Data validation  ← Všetky transakcie, property, atd.
```

---

## 7. DATA INTEGRITY & BACKUP

### Aktuálny stav:
- IndexedDB v12 s 17 object stores
- Backup: JSON export + AES-256 encryption
- Validation: TypeScript types + runtime checks

### Bezpečnostný plán:
```
1. Pred prvým spustením COMPAVEN_2.0:
   - POVINNÝ: Exportovať všetky dáta z Finančnej slobody
   - AES-256 encrypted backup

2. Počas migrácie:
   - VERIFIKOVAŤ: Data integrity v novom DB
   - RUN: Validation na všetkých entities
   - TEST: Finančné výpočty na oboch aplikáciách

3. Po spustení COMPAVEN_2.0:
   - AUTOBACKUP: Každý deň (ako pôvodne)
   - SYNC: Možnosť zdieľať DB medzi aplikáciami
```

### Migračné scenáre:

**Scenár A: Zdieľaný DB (Recommended)**
```
Finansn sloboda + COMPAVEN_2.0
   ↓
Zdieľajú IndexedDB "financna-sloboda"
   ↓
Všetky dáta sú automaticky synchronizované
```

**Scenár B: Zdrojový DB + Import/Export**
```
Finansn sloboda
   ↓ Export (JSON + AES)
   ↓ Import do COMPAVEN_2.0
COMPAVEN_2.0
   ↓
Nový DB "compaven-2.0" s importovanými dátami
```

**Scenár C: Paralelné aplikácie (Development)**
```
Finančna sloboda (development) — stara veta
   ↓
COMPAVEN_2.0 (beta) — nova veta
   ↓
Users majú volnu, ktorú aplikáciu použiť
```

---

## 8. ARCHITEKTONICKÉ ROZHODNUTIA

### Zásada: Vertikálne oddelenie vrstiev
```
Presentation Layer    ← React, UI komponenty, styling
         ↓
Application Layer     ← Navigation, feature flags, module management
         ↓
Domain Layer          ← Business logic, calculations, rules
         ↓
Data Layer           ← Storage abstraction, IndexedDB implementation
```

### Interface medzi vrstvami:
```typescript
// Presentation → Application
const { currentPage, navigateTo } = useNavigation();

// Application → Domain
const ctx = makeCtx(data, "2026-11-07");

// Domain → Data
const repo: Repository = await openRepository("compaven-2.0");
const data: AppData = await repo.getData();
```

### Benefit:
- Domain layer je **testovateľná bez UI**
- Data layer je **swappable** (mock, IndexedDB, WebSQL, atd.)
- Presentation layer je **výzamnej bez obchodnej logiky**
- Migration je **bezpečná a skúšaná**

---

## 9. EXISTUJÚCE TESTY & VALIDÁCIA

### Unit Tests (604 testů, všetci platní):
```
✓ Domain calculations (capital, goal, progress)
✓ Data validation (entities, types)
✓ Storage operations (backup, import, export)
✓ Edge cases (leap years, mortgage calculations)
✓ Financial scenarios (S&P500 returns, expenses)
```

### E2E Tests (540 testů, vyžadujú update):
```
⚠️ Navigation testy — NOVÝ selector (sidebar, bottom nav)
⚠️ Page flow testy — NOVÝ routing (React Router)
⚠️ UI testy — NOVÉ komponenty a layouty
✓ Domain testy — BEZ ZMENY (OK)
```

---

## 10. RISK ASSESSMENT

| Riziko | Pravdepodobnosť | Dopad | Mitigation |
|--------|----------------|-------|-----------|
| **Data loss** | Nízka | Kritické | Backup + validation |
| **Financial calculation errors** | Nízka | Vysoká | Unit testy (604) |
| **Navigation bugs** | Stredná | Nízka | E2E testy, user testing |
| **Storage incompatibility** | Nízka | Vysoká | DB v12 verified |
| **Performance regression** | Stredná | Stredná | Profiling, caching |
| **iOS Safari compatibility** | Nízka | Stredná | PWA testing, offline support |

---

## 11. TIMELINE ESTIMATE

| Fáza | Práca | Čas |
|------|-------|-----|
| 1. Domain + Data Layer preparation | Copy + verify | 2-4 h |
| 2. Presentation Layer (Sidebar, Bottom Nav) | Design + React | 20-30 h |
| 3. Feature Pages (7 × pages) | Components | 20-30 h |
| 4. Navigation (React Router) | Integration | 8-12 h |
| 5. Styling & Design System | CSS/TailwindCSS | 8-12 h |
| 6. Testing & QA | Unit + E2E + Manual | 10-15 h |
| 7. Migration & Backup | Data validation | 4-6 h |
| **TOTAL** | **Full COMPAVEN 2.0** | **~80-120 h** |

---

## 12. KONKRÉTNE SÚBORY NA AKCIU

### KEEP (Bez zmeny):
```
src/domain/*                 — 100% retain
src/storage/*                — 100% retain
src/app/autoEvaluation.ts    — 100% retain
src/app/features.ts          — 100% retain
src/app/ios.ts               — 100% retain
tests/domain/*               — 100% retain
tests/storage/*              — 100% retain
package.json (väčšina)       — 90% retain
tsconfig.json                — 100% retain
vite.config.ts               — Update
```

### MODIFY (Minimálne zmeny):
```
src/app/modules.ts           — Rewrite COMPAVEN 2.0 sections
src/app/navigation.ts        — New navigation logic
src/ui/App.tsx               — New initialization (domain + storage OK)
src/ui/Shell.tsx             — New shell architecture
src/ui/main.tsx              — Same (React.StrictMode, root)
```

### REWRITE (Kompletne nové):
```
src/ui/Sekcie.tsx            → src/ui/PageRouter.tsx (NEW)
src/ui/Navigacia.tsx         → src/ui/Navigation.tsx (NEW)
src/ui/Moduly.tsx            → src/ui/Moduly.tsx (simplified)
src/features/*               — All feature components (NEW)
src/ui/kit                   — New design system (NEW)
```

---

## ZÁVER

**COMPAVEN 2.0 je architektonicky dosť oddelité na bezpečnú migráciu.**

Kľúčové zistenia:
1. ✅ **Domain Layer** je čistá a prenositeľná bez zmeny
2. ✅ **Data Layer** je abstraktná a bezpečná
3. ✅ **Existing tests** pokryť domain + storage (nie UI)
4. ✅ **Data integrity** je zaručená cez Repository pattern
5. ✅ **Database v12** je kompatibilná s oboma aplikáciami

**Záver:** Vytvorenie COMPAVEN 2.0 ako samostatného produktu s zachovaním dát a domény je **technicky bezpečné** a **architektonicky čisté**.

Odporúčaný přístup: **Fáza-po-fáze integrácia s postupným testovaním.**
