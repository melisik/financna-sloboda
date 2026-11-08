# Závěrečný Report — Opravené Údaje
**Dátum:** 2026-11-08  
**Etapa:** Krok 2 — PropertySection.tsx Uzavretie  
**Stav:** Overený a Opravený

---

## 1. PRESNÝ POČET TESTOV — ROZPÍSANIE PODĽA SÚBOROV

### Unit Testy (Vitest)

| Súbor | Počet `it()` | Popis | Stav |
|-------|-------------|-------|------|
| `tests/property-form-functions.test.ts` | **35** | Validácia `isValidEurString()`, `parseEurStrict()`, EUR/centy konverzia | ✅ PASSED |
| `tests/property-form-input.test.ts` | **30** | Spravovanie state (valueStr vs valueCents), vstupné pole manipulácia | ✅ PASSED |
| `tests/property-form-preservation.test.ts` | **5** | Field preservation (spread operátor, ID, timestamps) | ✅ PASSED |
| **SPOLU UNIT** | **70** | — | **✅ PASSED** |

### E2E Testy (Playwright)

| Súbor | Počet testov | Scenáre | Profily | Stav |
|-------|------------|---------|---------|------|
| `tests/e2e/property-form.spec.ts` | **8** | 1. Prázdny formulár 2. 1000.50 EUR 3. 0 EUR 4. Odmietnutie prázdneho 5. Odmietnutie "1250abc" 6. Parsing presnosť 7. Field preservation 8. (8. test TBD) | Bez profilej (dev server nie je spustený) | ⚠️ NEMOŽNÉ SPUSTIŤ |

### Zhrnutie Počtov

```
Unit Testy:        70 ✅ PASSED
E2E Testy:         8 testov vytvorených (nie spustené bez dev server)
Regresné Testy:    789 PASSED, 11 FAILED (v iných moduloch)
TypeScript:        ✅ BEZ CHÝB
```

**Korekcia:** Návrh tvrdil "70 + 14 = 84", ale realita je:
- 70 unit testov ✓ (spustené a overené)
- 8 E2E testov (vytvorené, nie spustené — dev server bol vypnutý)
- Nie je  "2 profily" Playwright konfigurácia v kóde

---

## 2. ANALÝZA 11 ZLYHANÝCH TESTOV

| # | Test | Modul | Chybové Hlásenie | Typ Problému | Vplyv na COMPAVEN 2.0 |
|---|------|-------|-----------------|-------------|---------------------|
| 1 | schéma verzie export property | `backup-v2.test.ts:41` | Očakávaná verzia 19, dostali 20 | Schéma versioning mismatch | ❌ Áno — validácia backup/import |
| 2 | m: voľný peňažný tok | `etapa1-scenario.test.ts:112` | m = 550000, musí byť < 1000 od expected | Logika výpočtu m (príjmy − výdavky) | ❌ Áno — dashboard metriky |
| 3 | cieľ a položka odkazovanie | `investment-goals.test.ts:42` | validateAppData returned false | Validácia goals v zálohe | ⚠️ Čiastočne — ciele nie sú v MVP |
| 4 | vyššia verzia schémy odmietnutá | `mortgage-last-payment.test.ts:352` | Očakávaná `ok: false`, dostali `ok: true` | Kontrola verzie schémy | ❌ Áno — bezpečnosť importu |
| 5 | SCHEMA_VERSION konstanta | `position-provider.test.ts:10` | Očakávaná 19, dostali 20 | Schéma versioning | ❌ Áno — backup schéma |
| 6 | validácia minimálnej zásoby | `shopping.test.ts:56` | validateAppData returned false | Validácia stock items | ⚠️ Nie — Shopping nie je v COMPAVEN 2.0 |
| 7 | záloha v14 schéma verzie | `shopping.test.ts:63` | Očakávaná 19, dostali 20 | Schéma versioning | ⚠️ Nie — Shopping nie je v COMPAVEN 2.0 |
| 8 | validácia ceny a výdavok | `stock-waste.test.ts:45` | validateAppData returned false | Validácia stock/waste | ⚠️ Nie — Stock/Waste nie sú v COMPAVEN 2.0 |
| 9 | záloha v13 schéma verzie | `stock-waste.test.ts:53` | Očakávaná 19, dostali 20 | Schéma versioning | ⚠️ Nie — Stock/Waste nie sú v COMPAVEN 2.0 |
| 10 | vyššia verzia je odmietnutá | `storage.test.ts:141` | Chybové hlásenie iné — "properties musí byť pole..." namiesto "novšej verzie" | Chybná chybová správa pri verzovaní | ⚠️ Čiastočne — backup import UX |
| 11 | prázdne zbierky sú platné | `validate-settings-appdata.test.ts:95` | validateAppData returned false pre empty zbierky | Validácia schémy — missing povinných polí | ❌ Áno — inicializácia dát |

### Zoznam Známych Problémov

**Kritické (vplývajú na COMPAVEN 2.0):**
- **Schéma versioning (4 testy):** SCHEMA_VERSION je teraz 20, ale testy očakávajú 19
  - Príčina: Nové polia (properties, assets, investments, liabilities, incomes, budgets) boli pridané
  - Vplyv: Backup/import validácia zlyhá, ak nechýbajú tieto polia
  
- **Voľný peňažný tok m (1 test):** Výpočet m v doménový vrstve nezahŕňa príjmy/výdavky presne
  - Príčina: Nedostavy pri odrodzení messačného toku
  - Vplyv: Dashboard metriky budú nesprávne
  
- **Prázdne zbierky (1 test):** Validácia vyžaduje povinné polia
  - Príčina: AppData schéma teraz vyžaduje properties, assets, atď.
  - Vplyv: Inicializácia novej aplikácie zlyhá

**Nie je Regresie v COMPAVEN 2.0:** 
- Shopping, Stock/Waste, Investment Goals nie sú v COMPAVEN 2.0 scope
- Ich zlyhania nezahŕňajú PropertyForm/PropertySection

---

## 3. GIT PREHĽAD — PRESNÉ VÝSTUPY

### `git status --short` (38 zmien)

```
MODIFIED (16 súborov):
M src/compaven-ui/App.tsx                     — PropertySection integrácia
M src/compaven-ui/BackupForm.tsx              — Household rozšírenie
M src/compaven-ui/HouseholdForm.tsx           — Person & Household UI
M src/compaven-ui/Navigation.tsx              — Navigation aktualizácia
M src/compaven-ui/PersonForm.tsx              — Person editing
M src/compaven-ui/TransactionForm.tsx         — Transaction UI update
M src/compaven.tsx                             — Query parameter detekcia (?test=true)
M src/domain/annualOverview.ts                — Metrika updates
M src/domain/ledger.ts                         — Ledger logika
M src/domain/model/entities.ts                — Property entity
M src/domain/monthlyCashFlow.ts               — Cash flow výpočet
M src/features/rocny-prehlad/RocnyPrehlad.tsx — Dashboard updates
M src/features/transakcie/Transakcie.tsx      — Transaction list
M tests/annual-summary.test.ts                — Test updates
M tests/annualOverview.test.ts                — Test updates
M vite.config.ts                               — Dual entry points (index.html + compaven.html)

UNTRACKED NEW (22 súborov):
?? docs/audit-majetok-zavazky-2026-11-08.md
?? docs/crud-testovanie-rezultaty-2026-11-08.md
?? docs/etapa-1-definitvny-rozsah.md
?? docs/implementacny-plan-etapa-1.md
?? docs/implementacny-plan-majetok-zavazky.md
?? docs/navrh-dalších-funkcionalit-compaven-2.0.md
?? docs/verifikacia-k_nem-databaza.md
?? src/compaven-test.html
?? src/compaven-test.tsx
?? src/compaven-ui/PropertyForm.tsx            — React form komponent
?? src/compaven-ui/PropertySection.tsx        — React list CRUD komponent
?? src/compaven-ui/TestModeIndicator.tsx      — Test DB banner
?? src/compaven-ui/TransactionList.tsx        — Transaction list komponent
?? src/compaven-ui/propertyFormUtils.ts       — Utility funkcie (isValidEurString, parseEurStrict)
?? tests/backup-filename-format.test.ts
?? tests/backup-filename-milliseconds.test.ts
?? tests/backup-same-second.test.ts
?? tests/e2e/property-form.spec.ts             — Playwright E2E testy (8 scenárov)
?? tests/prijem-scenario.test.ts
?? tests/property-form-functions.test.ts      — Unit testy (35 testov)
?? tests/property-form-input.test.ts          — Unit testy (30 testov)
?? tests/property-form-preservation.test.ts   — Unit testy (5 testov)
```

### `git diff --stat` (16 upravených, 22 nových)

```
 src/compaven-ui/App.tsx                     |  40 +++--
 src/compaven-ui/BackupForm.tsx              |   7 +-
 src/compaven-ui/HouseholdForm.tsx           | 252 ++++++++++++++++++++++++++
 src/compaven-ui/Navigation.tsx              |   3 +-
 src/compaven-ui/PersonForm.tsx              |   4 +-
 src/compaven-ui/TransactionForm.tsx         |  97 ++++++++---
 src/compaven.tsx                            |   6 +-
 src/domain/annualOverview.ts                |  96 ++++++++---
 src/domain/ledger.ts                        |   3 +
 src/domain/model/entities.ts                |   2 +-
 src/domain/monthlyCashFlow.ts               |   4 +-
 src/features/rocny-prehlad/RocnyPrehlad.tsx |   6 +-
 src/features/transakcie/Transakcie.tsx      |   1 +
 tests/annual-summary.test.ts                |  18 +-
 tests/annualOverview.test.ts                |   4 +-
 vite.config.ts                              |   4 +-

 16 files changed, 415 insertions(+), 132 deletions(-)
```

### Vysvetlenie Rozdielu: 16 + 22 + 5 Dokumentov

- **16 Upravených Súborov:** `git diff --stat` — existujúci zdrojový kód upravený (integrácia Household/PropertySection)
- **22 Nových Súborov:** `git status --short` — úplne nové súbory (PropertyForm, PropertySection, testy, docs)
- **5 Dokumentov v `docs/`:**
  - `crud-testovanie-rezultaty-2026-11-08.md` (nový — záveračný report)
  - `navrh-dalších-funkcionalit-compaven-2.0.md` (nový — Phase 1b)
  - `etapa-1-definitvny-rozsah.md`, `implementacny-plan-*`, `audit-*`, `verifikacia-*` (nové — dokumentácia)

**CELKEM:** 16 (upravené) + 22 (nové) = 38 zmien na filesystéme

---

## 4. KONTROLA OBOCH DOKUMENTOV — ZOSÚLADENIE

### Dokument 1: `crud-testovanie-rezultaty-2026-11-08.md`
✅ **Opravené podľa precyzných počtov:**
- 70 unit testov (presne podľa úboru počtu it())
- E2E: Opravili sme na 8 testov (nie 14) — žiadny "2 profily" nie je konfigurovaný
- Regresné testy: 789 PASSED, 11 FAILED (bez zmeny)
- Git status: 16 + 22 = 38 zmien (opravené podľa presného git outputu)

### Dokument 2: `navrh-dalších-funkcionalit-compaven-2.0.md`
✅ **Zosúladený so skutočným stavom:**
- PropertyForm: ✅ 35 testov (nie 38)
- PropertySection: ✅ 30 testov (nie 32)
- K_nem: ✅ 5 testov (nie 20)
- Hypotéky: Polia v entities sú už prítomné (mortgageBalanceCents) — pripravené na UI
- Nájom: Polia nie sú v entities — budú sa musieť pridať
- Výdavky: Polia nie sú v entities — budú sa musieť pridať

---

## 5. SÚHRN OPRAVY

| Položka | Pôvodne | Opravené | Poznámka |
|---------|---------|----------|----------|
| PropertyForm unit testov | 38 | 35 | Opravené podľa presného `grep -c "it("` |
| PropertySection unit testov | 32 | 30 | Opravené |
| K_nem testov | 20 | 5 | Opravené (iba preservation) |
| E2E testy | 14 (7×2 profily) | 8 | Žiadne profily nie sú v kóde, nie je dev server |
| Upravené súbory v git | 16 | 16 | Potvrdené `git diff --stat` |
| Nové súbory | 22 | 22 | Potvrdené `git status --short` |
| Dokumenty | 5 | Všetky 7 | Vrátane nového zavěrečného reportu |

---

## ⚠️ KRITICKÉ ZISTENIA

1. **SCHEMA_VERSION je 20, nie 19**
   - Nové polia (properties, assets, investments, liabilities, incomes, budgets) sú teraz povinné
   - 4 testy zlyhávajú na schemaVersion validácii
   - Riešenie: Buď vrátť na v19 (bez tých polí) alebo fixnúť testy na očakávanie v20

2. **Voľný peňažný tok `m` je chybne vypočítaný**
   - Test `etapa1-scenario.test.ts` očakáva m = 4100 EUR
   - Dostáva m = 5500 EUR (možne bez odpočítania výdavkov)
   - Vplyv: Dashboard metriky budú chybné

3. **E2E testy nie sú plne konfigurované**
   - 8 testov bez Playwright profilov
   - Dev server nie je spustený (nie je test:e2e skript)
   - Nie sú integrované s CI pipeline

---

## 🎯 ĎALŠÍ POSTUP

**Čakám na schválenie:**
1. ✅ Sú opravené počty testov správne?
2. ❓ Má sa fixnúť SCHEMA_VERSION na 20 (4 testy) alebo vrátť na 19?
3. ❓ Má sa fixnúť výpočet m (voľný peňažný tok) pred Phase 1b?
4. ❓ Má sa integrova E2E do CI pipeline s dev serverom?

**Bez commitu:** Všetky zmeny ostanú v worktree `recovery-test`.
