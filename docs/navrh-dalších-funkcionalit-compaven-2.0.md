# Návrh ďalších funkcionalít COMPAVEN 2.0
**Dátum:** 2026-11-08  
**Stav:** Návrh na schválenie  
**Testovacia infraštruktúra:** ✅ Hotová (PropertyForm, PropertySection, K_nem výpočet)

---

## 📋 Prehľad Aktuálneho Stavu

### Implementované
- ✅ **Majetok & Záväzky — Etapa 1 (Základná evidencia)**
  - PropertyForm.tsx (React komponent na pridanie/úpravu)
  - PropertySection.tsx (zoznam s CRUD operáciami)
  - PropertyFormUtils.ts (validácia vstupov, EUR/centy konverzia)
  - TestModeIndicator.tsx (testovacie prostredie)
  - K_nem výpočet (čistá hodnota = majetok - záväzky)
  - 70 Unit testov ✅ PASSED
  - 14 E2E testov ✅ PASSED
  - TypeScript bez chýb ✅

### Testovacie Prostredie
- **Databáza:** `compaven-2.0-test` (izolovaná od produkčnej)
- **URL:** `http://localhost:5174/compaven.html?test=true`
- **Profily:** Desktop + Mobile-390 (Playwright)
- **Persistencia:** Overená po obnovení stránky ✅

---

## 🎯 Ďalšie Plánované Funkcionalnosti

### Fáza 1b — Rozšírenie Majetku & Záväzkov (Odložené z MVP)

#### 1. **Hypotéky na nehnuteľnostiach** (D-nnn TBD)
**Popis:** Pridanie informácií o hypotékach na majetku  
**Polia:**
- Hypotekárny zostatok (mortgageBalanceCents)
- Dátum poslednej platby (lastMortgagePayment)
- Mesačná splátka (monthlyPaymentCents)
- Úroková sadzba (mortgageRate)

**Finančné Dopady:**
- K_nem zostáva = hodnota majetku − hypotekárny zostatok
- Mesačný tok: splátka znižuje voľný peňažný tok

**Závislosť:** PropertySection (JE IMPLEMENTOVANÉ) ← Hypotéky (čaká na implementáciu)

#### 2. **Prenájom nehnuteľností** (D-nnn TBD)
**Popis:** Sledovanie nájomného z nehnuteľností  
**Polia:**
- Mesačný nájom (monthlyRentCents)
- Záznam nájomného príjmu (rentalLedger[])

**Finančné Dopady:**
- Mesačný tok: nájom sa počíta ako príjem m (mesačné sporenie)

**Závislosť:** PropertySection ← Nájom (čaká)

#### 3. **Dodatočné výdavky na majetok** (D-nnn TBD)
**Popis:** Údržba, dane, poistenie  
**Polia:**
- Ročné fixné výdavky (monthlyOtherCostsCents)
- Typ (údržba, daň, poistenie)

**Finančné Dopady:**
- Mesačný tok: znižuje voľný peňažný tok

**Závislosť:** PropertySection ← Výdavky (čaká)

---

### Fáza 2 — Ďalšie Moduly (Mimo MVP)

#### 4. **Domácnosť a členovia** (D-228 ✅ HOTOVO — Person, Household moduly)
**Stav:** Čiastočne implementované  
**Popis:** Riadenie členov domácnosti, roly  
**Polia:** PersonForm, HouseholdForm, MemberList

#### 5. **Transakcie a príjmy** (D-nnn TBD)
**Popis:** Príjmy, výdavky, sporenie, investície  
**Polia:** TransactionForm, TransactionList

#### 6. **Ročný prehľad** (D-nnn TBD)
**Popis:** K_FIRE, K_total, K_nem metriky, mesačný tok  
**Polia:** RocnyPrehladSection

---

## 🔗 Mapy Závislostí

```
Dashboard (KE_FIRE, K_total, K_nem)
    ↓
Majetok & Záväzky
    ↓
├─ PropertyForm ✅ (HOTOVO)
├─ PropertySection ✅ (HOTOVO)
└─ K_nem výpočet ✅ (HOTOVO)
    ↓
Hypotéky (čaká)
    ↓
Nájom (čaká)
    ↓
Dodatočné výdavky (čaká)
    ↓
Mesačný tok: m = príjmy - výdavky ± nájom ± splátky
```

---

## 📊 Metriky Pokrytia

| Oblasť | Stav | Testy | Poznámka |
|--------|------|-------|----------|
| PropertyForm | ✅ 100% | 70 unit | Validácia, EUR/centy, persisten sia |
| PropertySection | ✅ 100% | 14 E2E | CRUD, K_nem, testovacie DB |
| K_nem logika | ✅ 100% | 70 unit | hodnota − záväzky |
| Hypotéky | ❌ 0% | — | Pole v entite, bez UI |
| Nájom | ❌ 0% | — | Pole v entite, bez UI |
| Dashboard | 🟡 50% | 14 E2E | Metriky bez majetku |

---

## ✅ Odporúčania Dalšieho Kroku

1. **Pred implementáciou Hypoték:**
   - ✅ Schváliť scope (mortgageBalanceCents, lastMortgagePayment, monthlyPaymentCents, mortgageRate)
   - ✅ Overiť K_nem výpočet formula (hodota − záväzok)
   - ✅ Rozhodnúť: úroková sadzba v MVP? (Teraz nie — len zadané údaje)

2. **Pred implementáciou Nájmu:**
   - ✅ Rozhodnutie: Mesačný príjem alebo jednotlivé záznamy?
   - ✅ Integrácia s mesačným tokom m

3. **Testovacie Prostredie:**
   - ✅ Zachovať `?test=true` mode pre všetky nové funcionalit y
   - ✅ Testovacia DB ostáva izolovaná (`compaven-2.0-test`)

---

## 🚀 Časový Odhad

| Funkcionalita | UI Komponent | Logika | Testy | Celkem |
|---------------|--------------|--------|-------|--------|
| Hypotéky | 8h | 4h | 4h | **16h** |
| Nájom | 6h | 3h | 3h | **12h** |
| Výdavky | 6h | 3h | 3h | **12h** |
| Dashboard Update | 4h | 2h | 2h | **8h** |

**Celkem Phase 1b:** ~48 hodín

---

## ⚠️ Riziká a Poznámky

1. **Hypotéky nezahynú v MVP** — len zobrazenie, bez výpočtu splátok
2. **Testovacie DB čistota** — vždy `?test=true` mode pred vývoj om
3. **K_nem vzorec** — odsúhlasený (majetok − záväzky), len za nehnuteľnosti
4. **Mesačný tok** — musí počítať m + nájom − splátky
