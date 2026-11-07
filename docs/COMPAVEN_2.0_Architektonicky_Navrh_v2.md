# COMPAVEN 2.0 – Architektonický návrh (v2)

**Dátum:** 2026-11-07  
**Stav:** Návrh na schválenie  
**Metodika:** OUTSIDE IN (od produktu k detailom)  
**Výstup:** Produktová vízia, funkčné oblasti, obrazovky, dátový model, poradie vývoja.

---

## ⚠️ ZÁSADNÉ ZMENY OPROTI V1

1. **KOMPLETNE NOVÁ ARCHITEKTÚRA** — Nie preberanie starých modulov (IndexedDB v19, starý model).
2. **NOVÝ DÁTOVÝ MODEL** — Vlastný návrh, adaptácia starých pravidiel a vzorcov.
3. **NOVÁ PRODUKTOVÁ ŠTRUKTÚRA** — 7 funkcných oblastí (nie 8 ako v1).
4. **PORADIE VÝVOJA** — 8 fáz od vízie k detailom (nie 9 technických blokov).
5. **LEPŠÍ FOKUS** — Neurieš detaily ako šifrovanie, grafiku scenárov, notifikácie (až neskôr).
6. **MIGRÁCIA** — Nie súčasť novej aplikácie; vlastná budúca funkcia.

---

## 1. VÍZIA PRODUKTU

### Primárna myšlienka
**COMPAVEN je osobný finančný systém**, ktorý používateľovi pomáha:
1. **Pochopiť** svoju finančnú situáciu (Čo mám? Čo zarábam? Čo trácam?).
2. **Riadiť** financie denne a mesačne (Trácka výdavkov, mesačné aktualizácie).
3. **Plánovať** smerom k finančnej slobode (Cieľ, scenáre, dopad rozhodnutí).

### Ľudia vs. čísla
Aplikácia **nie je kalkulačka**. Je to **kompas a záznam**, ktorý používateľom poskytuje kontekst a sebavedomie pri finančných rozhodnutiach.

### Finančná sloboda — čo to znamená
Finančná sloboda = **nezávislosť od zamestnania** cez dosiahnutie cieľového kapitálu. To je dlhodobý cieľ. Ale aplikácia musí poskytovať hodnotu **aj dnes**:
- Kde som? (Prehľad)
- Koľko som zarábam? (Príjmy)
- Koľko mám majetku? (Majetok)
- Čo ma čaká v budúcnosti? (Cieľ, scenáre)

---

## 2. CIEĽOVÁ SKUPINA A KONTEXT

### Primárny používateľ (MVP)
- **Zakladateľ** (osobné použitie).
- Aktívne spravuje financie, myslí na budúcnosť.
- Vysoká technická gramotnosť.

### Budúci používatelia (Fáza 1b+)
- Používatelia v EÚ (18–65 rokov).
- Rôzne jazyky, meny, daňové scenáre (rozdiely medzi krajinami).

### Regulačné medziľahlosti
- **GDPR** — Pred viacužívateľskosťou.
- **MiFID II** — Keď aplikácia zobrazuje daňové scenáre alebo odhady výnosov (nie skôr).

---

## 3. SEDEM HLAVNÝCH FUNKČNÝCH OBLASTÍ

Každá oblasť má svoju úlohu, dáta a výstupy. Komunikujú s inými oblasťami bez pevných závislostí.

### Oblasť 1: Finančný prehľad (Dashboard)

**Účel:** Používateľ vidí aktuálny stav financií na jeden pohľad.

**Dáta, ktoré potrebuje:**
- Prehľad kapitálu (K_inv, K_cash, K_nem, K_total).
- Posledné vyhodnotenie (dátum, hodnoty).
- Cieľ (suma, dátum, scenáre).
- Predbežný dopad posledných transakcií.

**Informácie, ktoré poskytuje:**
- „Celkový kapitál: 100 000 €"
- „Cieľ: január 2038 (3 roky)"
- „Predbežne: +2 mesiace skôr"
- „Posledné vyhodnotenie: 5. novembra 2026"

**Komunikuje s:**
- Príjmy/Výdavky (predbežný dopad)
- Majetok/Záväzky (K_nem, záväzky)
- Finančné ciele (cieľ, scenáre)

**Hlavné úlohy:**
1. Zobraziť aktuálny stav (0 s chvíľu otvorenia).
2. Zobraziť cieľ a dopad.
3. Prepnúť na mesačné vyhodnotenie.

---

### Oblasť 2: Príjmy a výdavky (Transactions)

**Účel:** Záznam peňažného toku — príjmov, výdavkov, sporenia, investícií, transferov.

**Dáta, ktoré potrebuje:**
- Transakcie (typ, dátum, suma, zdroj úhrady, kategória, poznámka).
- Nastavenie (prah výdavkov, výchozí kategórie).
- Posledné vyhodnotenie (D_L, pre výpočet predbežného dopadu).

**Informácie, ktoré poskytuje:**
- História transakcií s filtrami (typ, mesiac, kategória).
- Súčty za obdobie.
- Predbežný dopad novej transakcie.
- Upozornenia (napr. „Hotovosť nestačila").

**Komunikuje s:**
- Finančný prehľad (predbežný dopad).
- Finančné ciele (m — mesačné sporenie).
- Rezerva (vklady/výbery z núdzového fondu).

**Hlavné úlohy:**
1. Zapísať transakciu (sporenie, investícia, výdavok).
2. Zobraziť históriu a filtrovať.
3. Zmeniť alebo vymazať transakciu.
4. Zobraziť predbežný dopad.

---

### Oblasť 3: Majetok a záväzky (Assets & Liabilities)

**Účel:** Záznam dlhodobého majetku (investície, nehnuteľnosti) a záväzkov (hypotéky, iné úvery).

**Dáta, ktoré potrebuje:**
- Majetok (typ: investícia, nehnuteľnosť; aktuálna hodnota; dátum odhadu).
- Záväzky (typ: hypotéka; zostatok; úroková sadzba; splátka podľa zmluvy; dátum splatenia).
- Nájom (ak je nehnuteľnosť v prenájme: mesačný príjem po nákladoch).

**Informácie, ktoré poskytuje:**
- Zoznam majetku s hodnotami.
- Zoznam záväzkov (zostatok, čas do splatenia).
- Čistá hodnota majetku (V − Z).
- Čistý nájom (príjem − splátka − náklady).

**Komunikuje s:**
- Finančný prehľad (K_nem, súčasný stav).
- Príjmy/Výdavky (nájom ako príjem).
- Finančné ciele (majetok v K, nájom v m).

**Hlavné úlohy:**
1. Zapísať majetok (typ, hodnota, dátum).
2. Zapísať záväzok (hypotéka, zostatok, sadzba, splátka).
3. Zapísať nájom.
4. Aktualizovať odhad hodnoty (ročne).

---

### Oblasť 4: Finančné ciele (Goals)

**Účel:** Definovať cieľ (finančnú slobodu) a vizualizovať cestu k nemu.

**Dáta, ktoré potrebuje:**
- Parametre cieľa (V — ročné výdavky, p — miera výberu, r — výnos, rezerva).
- Kapitál (K = K_inv + K_cash + K_nem).
- Mesačné sporenie (m — odvodené z transakcií alebo ruční vstup).
- Dátum posledného vyhodnotenia (D_L).

**Informácie, ktoré poskytuje:**
- Cieľová suma (T = V / p).
- Cieľový dátum (n mesiacov od D_L).
- Tri scenáre (opatrný, základný, optimistický).
- Dopad zmeny parametra (napr. „Ak zvýšiš spotrebu o 10 %, cieľ sa posunie o 3 roky").

**Komunikuje s:**
- Finančný prehľad (cieľ, scenáre).
- Príjmy/Výdavky (m, predbežný dopad).
- Majetok/Záväzky (K_nem, nájom).

**Hlavné úlohy:**
1. Nastaviť parametre (V, p, r, rezerva).
2. Zobraziť cieľ a scenáre.
3. Zobraziť dopad zmeny parametra.
4. Zobraziť „čo ak" scenáre (ak čas dovolí).

---

### Oblasť 5: História a analýzy (Analytics)

**Účel:** Umožniť hlbšiu analýzu — grafy, trendy, vzory.

**Dáta, ktoré potrebuje:**
- História transakcií za obdobie.
- História vyhodnotení (snapshots) — K_L, D_L.
- História cieľov (ako sa mení s časom).

**Informácie, ktoré poskytuje:**
- Mesačný priemer sporenia (trend).
- Mesačné výdavky (trend).
- Kapitál v čase (línea rastúca k cieľu).
- Scenáre v čase (rozsah možných trajektórií).

**Komunikuje s:**
- Finančný prehľad (histórie údajov).
- Príjmy/Výdavky (transakcie v čase).
- Finančné ciele (histórie cieľov).

**Hlavné úlohy:**
1. Zobraziť trendy (mesiac po mesiaci).
2. Porovnať scenáre.
3. Exportovať dáta (CSV, PDF).

---

### Oblasť 6: Plánovanie (Planning)

**Účel:** Pomôcť používateľovi predstaviť si budúcnosť a plánovať zmeny.

**Dáta, ktoré potrebuje:**
- Aktuálny stav (K, m, parametry).
- Scenáre a ich predpoklady.

**Informácie, ktoré poskytuje:**
- Odhady (napr. „Ak si zníziš spotrebu o 20 %, dosiahnuš cieľ o 5 rokov skôr").
- Scenáre „čo ak" (simulácia zmien bez záznamu).
- Plán krokov (napr. „Na dosah cieľa do 2035 potrebuješ aspoň 800 € mesačného sporenia").

**Komunikuje s:**
- Finančné ciele (parametre, dopad).

**Hlavné úlohy:**
1. Simulovať zmenu parametra.
2. Zobraziť dopad.
3. Uložiť scenár.

---

### Oblasť 7: Nastavenia a správa údajov (Settings & Data)

**Účel:** Kontrola aplikácie a ochranu osobných údajov.

**Dáta, ktoré potrebuje:**
- Všetky údaje (na export).
- Metadáta (schéma verzie, posledný export).

**Informácie, ktoré poskytuje:**
- Nastavenia (jazyk, motív, notifikácie).
- Informácie o aplikácii.
- Návod na import/export.

**Komunikuje s:**
- Všetky ostatné oblasti (export).

**Hlavné úlohy:**
1. Exportovať dáta (JSON, v budúcnosti CSV).
2. Importovať dáta.
3. Zmeniť jazyk, motív.
4. Vymazať všetky dáta.

---

## 4. VZÁJOMNÉ PREPOJENIE FUNKČNÝCH OBLASTÍ

```
┌─────────────────────────────────────────────────────────────┐
│                    FINANČNÝ PREHĽAD                         │
│         (Dashboard — všetko na jeden pohľad)                │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
        ▼          ▼          ▼          ▼
    ┌────┐    ┌────┐    ┌────┐    ┌────┐
    │PR/V│    │MAJ/│    │CIEL│    │HIS/│
    │    │    │ZAV │    │    │    │ANA │
    └────┘    └────┘    └────┘    └────┘
     │  │       │  │      │  │      │  │
     └──┼───────┼──┼──────┼──┼──────┼──┘
        │       │  │      │  │      │
        ▼       ▼  ▼      ▼  ▼      ▼
     ┌────────────────────────────────┐
     │    PLÁNOVANIE (Simulator)      │
     │  („Čo ak" zmena parametra?)    │
     └────────────────────────────────┘
        │
        ▼
     ┌────────────────────────────────┐
     │  NASTAVENIA A EXPORT/IMPORT    │
     │   (Ochranen údajov)            │
     └────────────────────────────────┘

SKRÁTENE:
  PR/V = Príjmy a výdavky
  MAJ/ZAV = Majetok a záväzky
  CIEL = Finančné ciele
  HIS/ANA = História a analýzy
```

**Príklady komunikácie:**
- Keď zapíšem **transakciu** (PR/V), **Prehľad** (Dashboard) ukazuje predbežný dopad (cieľ sa posúva).
- Keď aktualizujem **majetok** (MAJ/ZAV), **Cieľ** (CIEL) sa prepočíta, lebo sa zmení K.
- Keď zmením **parametre cieľa** (CIEL), **Prehľad** sa aktualizuje.
- **Histórie** (HIS/ANA) sú pohľad na dáta z PR/V, MAJ/ZAV a CIEL.

---

## 5. NÁVRH CELKOVÝCH OBRAZOVIEK

### Obrazovka 1: Prehľad (Dashboard)

```
┌─────────────────────────────────────────┐
│  COMPAVEN — Finančný prehľad            │
├─────────────────────────────────────────┤
│                                         │
│  KAPITÁL                                │
│  100 000 €                              │
│  (K_inv: 60k, K_cash: 30k, K_nem: 10k) │
│                                         │
├─────────────────────────────────────────┤
│  CIEĽ: Finančná sloboda                 │
│  Cieľová suma: 648 649 €                │
│  Cieľový dátum: január 2038             │
│  Scenáre: december 2037 — február 2038  │
│                                         │
│  [Posledné vyhodnotenie: 5.11.2026]     │
│  [Predbežne: +2 mesiace skôr]           │
│                                         │
├─────────────────────────────────────────┤
│  RÝCHLY ZÁPIS                           │
│  [+ Transakcia] [+ Vyhodnotenie]        │
│                                         │
├─────────────────────────────────────────┤
│  POSLEDNÉ TRANSAKCIE                    │
│  • Investícia: 5 000 € (3.11.2026)      │
│  • Výdavok: -120 € (3.11.2026)          │
│  • Sporenie: 1 500 € (2.11.2026)        │
│                                         │
├─────────────────────────────────────────┤
│  [Príjmy/Výdavky] [Majetok] [Ciele]    │
│  [Analýzy]       [Plánovanie] [Nastavenia]
└─────────────────────────────────────────┘
```

---

### Obrazovka 2: Príjmy a výdavky (Transactions)

```
┌─────────────────────────────────────────┐
│  PRÍJMY A VÝDAVKY                       │
├─────────────────────────────────────────┤
│  [Filtrovať: Všetko ▼] [Mesiac ▼]      │
│                                         │
│  NOVEMBER 2026                          │
│  ────────────────────────────────────   │
│  Príjem: +2 500 €                       │
│  Výdavky: -800 €                        │
│  Sporenie: +1 500 €                     │
│  Investície: +5 000 €                   │
│                                         │
│  TRANSAKCIE V MESIACIOCH:               │
│  ────────────────────────────────────   │
│  5.11.2026  Investícia        +5 000 €  │
│  3.11.2026  Výdavok           -120 €    │
│  2.11.2026  Sporenie          +1 500 €  │
│  1.11.2026  Príjem (plat)     +2 500 €  │
│                                         │
│  [+ Nová transakcia]                    │
│  [Predbežný dopad: +2 mesiace]          │
│                                         │
└─────────────────────────────────────────┘
```

---

### Obrazovka 3: Majetok a záväzky

```
┌─────────────────────────────────────────┐
│  MAJETOK A ZÁVÄZKY                      │
├─────────────────────────────────────────┤
│  MAJETOK                                │
│  Investičný fond: 60 000 €              │
│  Nehnuteľnosť (vlastné): 150 000 €      │
│  (Odhad hodnoty, nie do kapitálu K)     │
│                                         │
│  ZÁVÄZKY                                │
│  Hypotéka na dom: -100 000 € (0%,       │
│    splátka 1 000 €, do 2035)            │
│  Osobný úver: -10 000 € (5%, +6 mesiacov)
│                                         │
│  NÁJOM (Nehnuteľnosť v prenájme)        │
│  Mesačný príjem: +1 200 €               │
│  Mesačná splátka: -1 000 €              │
│  Mesačné náklady: -200 €                │
│  Čistý nájom: 0 €                       │
│                                         │
│  [+ Nový majetok] [+ Nový záväzok]      │
│                                         │
└─────────────────────────────────────────┘
```

---

### Obrazovka 4: Finančné ciele

```
┌─────────────────────────────────────────┐
│  FINANČNÉ CIELE                         │
├─────────────────────────────────────────┤
│  HLAVNÝ CIEĽ: Finančná sloboda          │
│  Ročné výdavky (V): 24 000 €            │
│  Miera výberu (p): 3,7 % [podľa zákl.] │
│  Cieľová suma (T): 648 649 €            │
│                                         │
│  VÝNOS A SPORENIE                       │
│  Reálny výnos (r): 3,5 % [podľa zákl.] │
│  Mesačné sporenie (m): 1 500 € [odv.]   │
│                                         │
│  SCENÁRE                                │
│  ┌─ Opatrný (3,5% − 2%): február 2039   │
│  ├─ Základný (3,5%): január 2038 ◄──    │
│  └─ Optimistický (3,5% + 2%): dec 2036  │
│                                         │
│  Posúvanie cieľa:                       │
│  Ak zvýšiš sporenie o 500 €: o 3 roky   │
│  Ak zvýšiš výnos o 1%: o 1,5 roka       │
│                                         │
│  [Zmeniť parametre] [Scenáre "čo ak"]   │
│                                         │
└─────────────────────────────────────────┘
```

---

### Obrazovka 5: História a analýzy

```
┌─────────────────────────────────────────┐
│  HISTÓRIA A ANALÝZY                     │
├─────────────────────────────────────────┤
│  [Trend sporenia] [Mesiac] [Rok]        │
│                                         │
│  MESAČNÉ SPORENIE (TREND)               │
│  (Čiara rastúca od septembra do novembra)
│   m = 1 500 € (priemer za 3 mesiace)   │
│                                         │
│  VYHODNOTENIA (SNAPSHOTS)               │
│  5.11.2026: K = 100 000 €               │
│  5.10.2026: K = 98 500 €                │
│  5.9.2026:  K = 97 000 €                │
│                                         │
│  KAPITÁL V ČASE (PRE SCENÁRE)           │
│  (Tri čiary: opatrný, zákl., optimist.) │
│  Na cieľ do: dec 2036 — feb 2039         │
│                                         │
│  [Exportovať dáta] [CSV/PDF]            │
│                                         │
└─────────────────────────────────────────┘
```

---

### Obrazovka 6: Plánovanie

```
┌─────────────────────────────────────────┐
│  PLÁNOVANIE (CHO AK)                    │
├─────────────────────────────────────────┤
│  Simulujem zmenu:                       │
│  [Ročné výdavky (V): 30 000 €] ◄─ zmena │
│  [Mesačné sporenie (m): 2 000 €]        │
│  [Reálny výnos (r): 4 %]                │
│                                         │
│  VÝSLEDOK:                              │
│  Ak zvýšiš V na 30 000 €:               │
│    Nový cieľ: 810 811 €                 │
│    Nový dátum: február 2039             │
│    Zmena: +13 mesiacov (o rok skôr!)    │
│                                         │
│  [Uložiť tento scenár] [Zrušiť]         │
│                                         │
│  ULOŽENÉ SCENÁRE                        │
│  • Agresívny (m = 2 500 €): januar 2037 │
│  • Konzervatívny (r = 2,5 %): apríl 2040│
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. NÁVRH DÁTOVEJ ARCHITEKTÚRY (VYSOKÁ ÚROVEŇ)

### Logická štruktúra dát

```
┌─────────────────────────────────────────────────────────────┐
│                    APLIKAČNÝ STAV                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. NASTAVENIE (globálny záznam)                            │
│     ├─ V (ročné výdavky)                                    │
│     ├─ p (miera výberu)                                     │
│     ├─ r (reálny výnos)                                     │
│     ├─ rezerva (mesiacov)                                   │
│     ├─ prah výdavkov                                        │
│     └─ m (mesačné sporenie, odvodené)                       │
│                                                             │
│  2. TRANSAKCIE (zoznam)                                     │
│     ├─ ID                                                   │
│     ├─ dátum                                                │
│     ├─ typ (príjem, výdavok, sporenie, investícia)          │
│     ├─ suma (EUR, v centoch)                                │
│     ├─ kategória (voliteľné)                                │
│     ├─ zdroj úhrady (príjem, hotovosť, investície)          │
│     └─ poznámka                                             │
│                                                             │
│  3. VYHODNOTENIA (SNAPSHOTS, zoznam)                        │
│     ├─ ID                                                   │
│     ├─ dátum (D_L — dátum posledného vyhodnotenia)          │
│     ├─ K_inv (investícia)                                   │
│     ├─ K_cash (hotovosť)                                    │
│     ├─ K_nem (čistá hodnota nehnuteľností)                  │
│     └─ poznámka (voliteľné)                                 │
│                                                             │
│  4. MAJETOK (zoznam)                                        │
│     ├─ ID                                                   │
│     ├─ typ (investícia, nehnuteľnosť)                       │
│     ├─ názov                                                │
│     ├─ aktuálna hodnota (EUR, v centoch)                    │
│     ├─ dátum odhadu                                         │
│     ├─ režim nehnuteľnosti (vlastníctvo / prenájom)         │
│     └─ poznámka                                             │
│                                                             │
│  5. ZÁVÄZKY (zoznam)                                        │
│     ├─ ID                                                   │
│     ├─ typ (hypotéka, iný úver)                             │
│     ├─ názov                                                │
│     ├─ zostatok (EUR, v centoch)                            │
│     ├─ úroková sadzba (% per annum)                         │
│     ├─ mesačná splátka (EUR, v centoch)                     │
│     ├─ dátum splatenia                                      │
│     └─ poznámka                                             │
│                                                             │
│  6. NÁJOM (zoznam — voliteľne)                              │
│     ├─ ID                                                   │
│     ├─ majetok ID (link na majetok v prenájme)              │
│     ├─ mesiac (YYYY-MM)                                     │
│     ├─ príjem (EUR, v centoch)                              │
│     └─ náklady (EUR, v centoch)                             │
│                                                             │
│  7. SCENÁRE (zoznam — voliteľne)                            │
│     ├─ ID                                                   │
│     ├─ názov (napr. „Agresívny")                            │
│     ├─ parametry (V, p, r, m)                               │
│     ├─ dátum vytvorenia                                     │
│     └─ poznámka                                             │
│                                                             │
│  8. METADÁTA                                                │
│     ├─ schémaVer (číslo verzie)                             │
│     ├─ posledný export (dátum)                              │
│     ├─ jazyk                                                │
│     └─ motív                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Úložisko: IndexedDB (LOCAL FIRST)

**Databáza:** `compaven-2.0`

**Object Stores:**
- `settings` (primárny kľúč: `key`)
- `transactions` (primárny kľúč: `id`; indexy: `date`, `type`)
- `snapshots` (primárny kľúč: `id`; index: `date`)
- `assets` (primárny kľúč: `id`)
- `liabilities` (primárny kľúč: `id`)
- `rental` (primárny kľúč: `id`)
- `scenarios` (primárny kľúč: `id`)
- `metadata` (primárny kľúč: `key`)

**Princípy:**
- Sumy ukladám ako **celé centy** (integer), nie float.
- Dátumy ako **ISO reťazec** `YYYY-MM-DD` (bez času).
- Všetky ID sú **UUID** (deterministické, bez servera).
- Spätna kompatibilita: starú schému migrujeme neskôr (nie v MVP).

---

## 7. PORADIE VÝVOJA (8 FÁZY)

### Fáza 1: Produktová vízia a celková štruktúra (Týždeň 1)

**Výstup:** Dokument s 7 funkčnými oblasťami, ich účelom, údajmi a komunikáciou.
- Podrobné scerenáre používateľa.
- Skice (wireframe) 7 obrazoviek.
- Prvý návrh dátového modelu.

**Kritériá:** Zakladateľ schválí štruktúru a obrazovky.

---

### Fáza 2: Celkový návrh aplikácie a obrazoviek (Týždeň 1–2)

**Výstup:** Detailný návrh všetkých obrazoviek (nie pixel-perfect, iba logika a rozvrhnutie).
- Pripojenie medzi obrazovkami.
- Navigácia.
- Odsúvanie formulárov.

**Kritériá:** Zakladateľ a tím pochopí ui flow; nie sú žiadne otázky.

---

### Fáza 3: Dátový model a architektúra (Týždeň 2–3)

**Výstup:** Definítívny dátový model, api rozhraní (bez kódu).
- Štruktúra tabuliek v IndexedDB.
- Typ entít (TypeScript interfaces).
- Rozhranie medzi komponentami (use-case vrstva).

**Kritériá:** Všetky entity sú jasne definované; vývojári môžu vedľa seba pracovať.

---

### Fáza 4: Finančné výpočtové jadro (Týždeň 3–5)

**Výstup:** Čisté funkcie pre výpočty (bez UI, bez IndexedDB).
- `calculateGoal(V, p, r, K, m, D_L) → T, n, scenáre`
- `calculateImpact(K_L, transactions) → Δn`
- `calculateMortgagePayment(property, month) → suma`
- Jednotkové testy (Vitest), golden cases.

**Kritériá:** Všetky výpočty sú overené; testy prelezú bez chýb.

---

### Fáza 5: Ukladanie údajov a zálohovanie (Týždeň 5–6)

**Výstup:** Repository rozhranie + IndexedDB implementácia + Export/Import.
- Zápis a čítanie z IndexedDB.
- Export do JSON.
- Import s validáciou.

**Kritériá:** Dáta sa ukladajú a obnovia bez straty; export je bezpečný.

---

### Fáza 6: Kompletný MVP (Týždeň 6–8)

**Výstup:** Pracovná aplikácia (bez nehnuteľností, bez analýz).
- UI pre všetky 7 obrazoviek.
- Prehľad, transakcie, majetok, cieľ, plánovanie, nastavenia.
- Offline (Service Worker + PWA).
- E2E testy (Playwright).

**Kritériá:** Zakladateľ môže testovať na iPhone; offline funguje.

---

### Fáza 7: Rozšírené funkcie (Týždeň 8–10)

**Výstup:** História a analýzy, pokročilé scenáre.
- Grafy (kapitál v čase, scenáre, trendy).
- Export do CSV / PDF.
- Simulácia zmien (plánovanie).

**Kritériá:** Grafy sú čitateľné; export funguje.

---

### Fáza 8: Optimalizácia, detaily, bezpečnosť (Týždeň 10–12)

**Výstup:** Finálna aplikácia.
- Optimalizácia výkonu.
- Bezpečnostný audit.
- Kompatibilita (Chrome, Safari, Firefox; mobile).
- Dokumentácia a návod.

**Kritériá:** Bezpečnostný audit bez nálezov; app je rýchly a kompatibilný.

---

## 8. RIZIKÁ A OTVORENÉ ROZHODNUTIA

### Technické riziká

| Riziko | Pravdepod. | Dopad | Zmierňovanie |
|--------|---|---|---|
| **Float presnosť** | Nízka | Vysoký | Golden cases, jednotkové testy. |
| **IndexedDB nedostupná** | Nízka | Vysoký | Jasná hlášenja, export. |
| **Service Worker cache zastaralý** | Stredná | Stredný | Cache versioning. |
| **Komplexnosť majetku/záväzkov** | Stredná | Stredný | Pečlivý UI, pomôcky. |

### Rozhodnutia, ktoré NEUTVÁRام (až neskôr)

1. **Šifrovanie exportu** — Má byť voliteľné alebo povinné? (Fáza 8)
2. **Grafika scenárov** — Tabuľka, čiara, text? (Fáza 7)
3. **Notifikácie** — Systemové alebo iba in-app? (Fáza 6 / 7)
4. **Daňové upozornenia** — Presný text? (Fáza 7+)
5. **Bezpečnostné nastavenia** — CSP, CORS, ...? (Fáza 8)

---

## 9. VEDOME ODLOŽENÉ DETAILY

Tieto položky sú užitočné, ale nie kritické pre MVP:

1. Presné zaokrúhľovanie zobrazovaných hodnôt (GUI detail).
2. Animácie a prechody (ux candy).
3. Prispôsobenia farby a motívy (Design).
4. In-app pomocník (Bot).
5. Integrácia s bankou (PSD2, Fáza 2+).
6. Mobilná aplikácia (React Native, Fáza 2+).
7. Viacmenovosť (EUR, CZK, ..., Fáza 2+).
8. Viacužívateľskosť (Domácnosť, Fáza 2+).
9. Automatické oceňovanie investícií (API, Fáza 2+).
10. AI doporučenia (Fáza 2+).
11. Prispôsobenie (Preference API, Fáza 2+).
12. Daňové režimy — katalóg (Fáza 2+, právne overenie).
13. Nárok na podporu (Integrácia s `spolu-na-ceste`, Fáza 2+).

---

## 10. ĎALŠÍ KROK

Po schválení tejto **v2**:

1. **Zakladateľ** — Schválite strukturu 7 oblastí a 8 fáz?
2. **Tím** — Začneme Fázou 1 (detailné scerenáre a skice).
3. **Dokument** — Nebude sa meniť bez výrazeného rozhodnutia.

**Dôležitá poznámka:** Nemeň zdrojový kód, nemeň git. Čakám iba na váš súhlas.

---

**KONIEC DOKUMENTU V2**
