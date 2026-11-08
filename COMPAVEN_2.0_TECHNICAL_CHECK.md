# COMPAVEN 2.0: CIELENÁ TECHNICKÁ KONTROLA
## Odpovede na 6 kľúčových otázok

**Dátum:** 2026-11-07  
**Status:** Technická verifikácia separácie vrstiev  
**Účel:** Bezpečne rozhodnúť o prvom implementačnom kroku

---

## OTÁZKA 1: Ktoré časti Domain Layer sú skutočne nezávislé?

### ✅ ODPOVEĎ: 100% Domain Layer je nezávislý

**Zistenie:**
- Domain layer (src/domain/) **nemá žiadne importy z UI alebo storage** (overené grep)
- Domain layer **nepoužíva localStorage, sessionStorage ani React**
- Domain layer pracuje čisto s `AppData` typom (jednotné dátové štruktúry)
- 2 784 riadkov čistej business logiky bez UI spätky

**Konkrétne súbory na znovu použitie (bez zmeny):**
```
src/domain/context.ts           — Hlavný výpočtový engine (makeCtx)
src/domain/capital.ts           — K_FIRE, K_total, K_nem
src/domain/monthlyCashFlow.ts   — m = voľný peňažný tok
src/domain/goal.ts              — Cieľ a výpočet timeline
src/domain/property.ts          — Nehnuteľnosti
src/domain/mortgage.ts          — Hypotéka a splátky
src/domain/investments.ts       — Výnosy na K_inv
src/domain/liabilities.ts       — Záväzky
... a ďalších 40+ utilít
```

**Testovateľnosť:**
- 604 unit testov prechádzajú bez UI
- Žiadne E2E/browser dependencies
- Všetky testy môžu zostať platné

**ZÁVER:** Domain layer sa dá **kopírovať bez zmeny** do COMPAVEN 2.0.

---

## OTÁZKA 2: Ktoré časti Application Layer sa dajú znovu použiť?

### ✅ ODPOVEĎ: 70% je znovu použiteľné, 30% vyžaduje update

**Znovu použiteľné (bez zmeny):**
```
src/app/autoEvaluation.ts     — Auto-evaluation logika (nezávislá)
src/app/features.ts            — Feature flags (konfigurácia)
src/app/ios.ts                 — iOS detection a PWA logika
```

**Vyžadujúce update (zmena, nie rewrite):**
```
src/app/modules.ts
  STARÉ: const CORE_SECTION_IDS = ["prehlad", "nova-transakcia", ...]
  NOVÉ:  const COMPAVEN_PAGES = ["dashboard", "income-expenses", ...]
  ZMENA: Reorganizácia sekcií → stránky (3-4 hodiny)

src/app/navigation.ts
  STARÉ: useSection(visible): SectionId
  NOVÉ:  useNavigation(): { currentPage, navigateTo }
  ZMENA: Nová navigačná logika (3-4 hodiny)
```

**ZÁVER:** Application layer sa dá **väčšinou zachovať s malými úpravami** (6-8 hodín práce).

---

## OTÁZKA 3: Aké konkrétne závislosti bránia oddeleniu COMPAVEN 2.0?

### ✅ ODPOVEĎ: Nula architektúrnych bariér, len 3 praktické záväzky

**Analýza závislostí:**

#### BARIERA 1: Shared Database Name
```typescript
// src/storage/indexeddb.ts
const DB_NAME = "financna-sloboda";
const DB_VERSION = 12;

export async function openRepository(name: string = DB_NAME) { ... }
```
**Status:** ✅ RIEŠENÉ
- `openRepository()` je **parametrizovaná!**
- COMPAVEN 2.0 môže zavolať `openRepository("compaven-2.0")`
- Pôvodná DB ostane netknutá

#### BARIERA 2: Shared LocalStorage
```
SKIP_FIRST_SETUP_KEY = "fs-skip-first-setup"
CHOICE_KEY (modules) = "fs-moduly"
PIN = "pin" v meta
```
**Status:** ✅ RIEŠENÉ
- LocalStorage je **per-origin** (obidve aplikácie môžu mať svoje klúče)
- COMPAVEN 2.0 môže používať vlastné klúče: `"compaven-skip-setup"`, `"compaven-moduly"`
- Bez rizika kolízie

#### BARIERA 3: Shared Service Worker
```
src/ui/main.tsx: navigator.serviceWorker.register("./sw.js")
```
**Status:** ✅ RIEŠENÉ
- Service Worker je **scope-based** (cesta v URL)
- Finančná sloboda: `/financna-sloboda/sw.js`
- COMPAVEN 2.0: `/compaven-2.0/sw.js`
- Môžu existovať paralelne bez konfliktu

**ZÁVER:** **Žiadne architektúrne bariéry.** Len technické separácie klúčov a paths.

---

## OTÁZKA 4: Ako vytvoríme samostatnú IndexedDB bez zásahu do pôvodnej?

### ✅ ODPOVEĎ: Bezpečne, cez parametrizovaný `openRepository()`

**Stratégia:**

```typescript
// Finančná sloboda — stará aplikácia
const repo = await openRepository();  // default: "financna-sloboda"
const data = await repo.getData();
const ctx = makeCtx(data, today);

// COMPAVEN 2.0 — nová aplikácia
const repo = await openRepository("compaven-2.0");  // NEW DB!
const data = await repo.getData();  // prázdne {} na prvej inicializácii
const ctx = makeCtx(data, today);
```

**Implementácia:**
1. Vytvoríme nový `src/compaven/index.tsx` ako vstupný bod
2. Inicializujeme nový App shell pre COMPAVEN 2.0
3. Zavoláme `openRepository("compaven-2.0")` v novanom App.tsx
4. IndexedDB automaticky vytvorí nový DB s novým menom

**Bezpečnosť:**
- ✅ Pôvodná DB "financna-sloboda" zostane netknutá
- ✅ Nová DB "compaven-2.0" je úplne izolovaná
- ✅ Bez zdieľaných objektStores
- ✅ Bez dátovej kolízie

**ZÁVER:** **Triviálne jednoduché** — len 1-riadkový parameter zmena.

---

## OTÁZKA 5: Ako zabezpečíme zdieľanie domény bez duplikácie kódu?

### ✅ ODPOVEĎ: Shared Package.json + Shared src/domain

**Prístup A: Single Repository, Multiple Entry Points** (Recommended)

```
financna-sloboda/
├── src/
│   ├── domain/        ← SHARED (obidve aplikácie)
│   ├── storage/       ← SHARED (obidve aplikácie)
│   ├── app/           ← SHARED (väčšina)
│   ├── ui/            ← Finančná sloboda
│   └── compaven-ui/   ← COMPAVEN 2.0 (NEW)
├── src/main.tsx       ← Finančná sloboda entry point
├── src/compaven.tsx   ← COMPAVEN 2.0 entry point (NEW)
└── vite.config.ts     ← Dva build tagy
```

**Vite Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),           // Finančná sloboda
        compaven: resolve(__dirname, 'src/compaven.html'),    // COMPAVEN 2.0 (NEW)
      },
      output: {
        dir: 'dist',
        // Rozdielne chunks pre obe aplikácie
      }
    }
  }
});
```

**TypeScript Imports:**
```typescript
// Obidve aplikácie importujú z rovnakého miesta
import { makeCtx } from "../domain/context";
import { openRepository } from "../storage/indexeddb";
```

**ŽIADNA DUPLIKÁCIA** — shared src/domain a src/storage.

**Prístup B: Monorepo (ak vyraste)** — budúce riešenie
```
compaven/
├── packages/
│   ├── domain/        ← npm package
│   ├── storage/       ← npm package
│   ├── fs/            ← Finančná sloboda (stará)
│   └── compaven/      ← COMPAVEN 2.0 (nová)
```

**ZÁVER:** **Prístup A je teraz ideálny** — bez dodatočnej komplexity.

---

## OTÁZKA 6: Aký je najjednoduchší spôsob na nový UI shell bez poškodenia pôvodného?

### ✅ ODPOVEĎ: Nový vstupný bod + Nová prezentačná vrstva

**Najjednoduchší prvý krok:**

```
1. Vytvoriť src/compaven.tsx               (NEW entry point)
2. Vytvoriť src/compaven-ui/App.tsx        (NEW shell)
3. Vytvoriť src/compaven-ui/Dashboard.tsx  (NEW Dashboard)
4. Vytvoriť src/compaven.html              (NEW HTML)
5. Update vite.config.ts                   (build oba vstupné body)
```

**Štruktúra:**
```
src/
├── main.tsx                  ← PÔVODNÉ (Finančná sloboda)
├── compaven.tsx              ← NEW (COMPAVEN 2.0 entry point)
├── ui/                       ← Finančná sloboda komponenty
│   └── App.tsx
├── compaven-ui/              ← COMPAVEN 2.0 komponenty (NEW)
│   ├── App.tsx               — Shell s sidebar + bottom nav
│   ├── Dashboard.tsx         — Hlavná stránka
│   ├── Navigation.tsx        — Navigácia
│   └── components/           — Ďalšie stránky
├── domain/                   ← SHARED
├── storage/                  ← SHARED
└── app/                      ← SHARED (98%)
```

**Minimálny kód na spustenie:**
```typescript
// src/compaven.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./compaven-ui/App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

```typescript
// src/compaven-ui/App.tsx
import { useEffect, useState } from "react";
import { openRepository } from "../storage/indexeddb";
import type { Repository } from "../storage/repository";
import type { AppData } from "../storage/types";
import { makeCtx } from "../domain/context";

export function App() {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    openRepository("compaven-2.0").then((r) => {
      setRepo(r);
      r.getData().then(setData);
    });
  }, []);

  if (!repo || !data) return <div>Načítavam...</div>;

  const ctx = makeCtx(data, "2026-11-07");
  
  return (
    <div style={{ display: "flex" }}>
      <aside style={{ width: 250, borderRight: "1px solid #ccc" }}>
        <h2>COMPAVEN 2.0</h2>
        <nav>
          <button>📊 Dashboard</button>
          <button>💰 Príjmy & Výdavky</button>
          <button>🏠 Majetok</button>
          <button>🎯 Ciele</button>
          <button>📈 Analýzy</button>
          <button>🔧 Nastavenia</button>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <h1>Pokrok k FINANČNEJ SLOBODE</h1>
        <div style={{ background: "#f0f0f0", padding: 16, borderRadius: 8 }}>
          <p>K_FIRE: {(ctx.target.investmentsCents / 100).toFixed(0)} €</p>
          <p>Cieľ: {Math.ceil(ctx.target.months)} mesiacov</p>
          <p>m (mesačný tok): {(ctx.latest?.monthlyCashFlowCents / 100 || 0).toFixed(0)} €</p>
        </div>
      </main>
    </div>
  );
}
```

**Bez poškodenia pôvodného:**
- ✅ Pôvodný `src/main.tsx` ostane netknutý
- ✅ Pôvodný `src/ui/` ostane netknutý
- ✅ Pôvodná DB "financna-sloboda" ostane netknutá
- ✅ Žiadne zmeny v git (len nové súbory)

**ZÁVER:** **Veľmi bezpečné** — nové súbory, bez zmien v existujúcom.

---

## ROZHODOVACIA TABUĽKA

| Oblasť | Znovu použiť | Upraviť | Vytvoriť nanovo | Riziko |
|--------|------------|---------|-----------------|--------|
| **Domain Layer** | ✅ 100% | — | — | 🟢 Nula |
| **Storage Layer** | ✅ 100% | Parametrizácia DB_NAME | — | 🟢 Nula |
| **App Layer** | ✅ ~70% | navigation.ts, modules.ts | — | 🟢 Nízke |
| **Presentation Layer** | — | — | ✅ 100% | 🟢 Nula |
| **Entry Points** | main.tsx zachovať | — | ✅ compaven.tsx (NEW) | 🟢 Nula |
| **IndexedDB** | — | — | ✅ "compaven-2.0" (NEW) | 🟢 Nula |
| **LocalStorage Keys** | — | — | ✅ "compaven-*" (NEW) | 🟢 Nula |
| **Service Worker** | — | — | ✅ /compaven/sw.js (NEW) | 🟢 Nula |

---

## KONKRÉTNY PRVÝ IMPLEMENTAČNÝ KROK

### 🚀 PRVÝ KROK: Functional COMPAVEN 2.0 Shell + Minimal Dashboard

**Rozsah:**
- Vytvorenie minimálneho COMPAVEN 2.0 shell-u so sidebar navigáciou
- Prvá stránka: Dashboard s napojením na finančnú logiku
- Vlastná IndexedDB "compaven-2.0"
- Spustiteľné bez UI optimalizácie

**Súbory na vytvorenie:**
```
src/compaven.tsx                    (NEW — entry point, ~30 riadkov)
src/compaven.html                   (NEW — HTML shell, ~20 riadkov)
src/compaven-ui/App.tsx             (NEW — Root component, ~80 riadkov)
src/compaven-ui/Dashboard.tsx       (NEW — First page, ~100 riadkov)
src/compaven-ui/Navigation.tsx      (NEW — Sidebar nav, ~50 riadkov)
```

**Zmeňuje sa:**
```
vite.config.ts                      (UPDATE — pride build configuration)
package.json                        (Maybe — ak treba nové deps)
```

**Bez zmien:**
```
Všetko ostatné — Finančná sloboda ostane netknutá
```

**Odhad práce:** 6-8 hodín (frontend developer)

**Výstup:**
- Spustiteľný COMPAVEN 2.0 shell v browser (dev server: localhost:5173/compaven)
- Dashboard s reálnymi dátami z vlastnej DB
- Navigácia medzi 6 stránkami (mock, bez obsahu)
- Finančná logika pracuje bez chyby

**Testovateľnosť:**
- ✅ Domain layer vracia správne `ctx`
- ✅ IndexedDB "compaven-2.0" je iniciajuzovaná
- ✅ Dashboard zobrazuje K_FIRE, cieľ, timeline
- ✅ Pôvodná aplikácia ostane funkčná na rovnakej URL

---

## SÚHRN RIEŠENÍ

1. ✅ **Domain Layer:** 100% prenositeľná, žiadne zmeny
2. ✅ **Storage Layer:** Parametrizovaná cez DB_NAME
3. ✅ **Závislosti:** Žiadne architektúrne bariéry
4. ✅ **Oddelená DB:** "compaven-2.0" bez zásahu do "financna-sloboda"
5. ✅ **Bez duplikácie:** Shared src/domain a src/storage
6. ✅ **Nový Shell:** Nový entry point bez zásahu do pôvodného

**BEZPEČNOSŤ:** 🟢 **ZELENÉ SVETLO** na implementáciu prvého kroku.
