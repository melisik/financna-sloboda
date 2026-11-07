# COMPAVEN 2.0 — FÁZA 2: CELKOVÝ NÁVRH PRODUKTU A WIREFRAMY

**Dátum:** 2026-11-07  
**Stav:** Návrh na schválenie  
**Výstup:** Architektúra UI, navigácia, wireframy všetkých 7 obrazoviek, používateľské toky.

---

## 1. ÚVOD: PRINCÍPY NÁVRHU

### Princíp: OUTSIDE IN
Začíname s **celkovým pohľadom** na aplikáciu — navigácia, tok medzi obrazovkami, rozloženie — a až potom budú jednotlivé detaily (formuláre, gombíky).

### Princíp: LOCAL FIRST
- Aplikácia je offline-schopná (PWA).
- Bez prihlasovacích účtov.
- Dáta v IndexedDB na zariadení používateľa.
- Zálohovanie a export podľa vlastného rozhodnutia.

### Princíp: Moderná a dôveryhodná
- Čistý dizajn (bez preplnenia informácií).
- Jasná hierarchia (najdôležitejšie informácie prvé).
- Konzistentné komponenty.
- Jednoduchá navigácia.

### Cieľ
COMPAVEN 2.0 odpovedá na **4 základné otázky**:
1. **Kde som teraz?** (Môj finančný stav)
2. **Kam smerujem?** (Môj cieľ a pokrok)
3. **Ako sa mi darí?** (Trend, mesačné sporenie)
4. **Čo môžem urobiť?** (Akcie na Dashboarde)

---

## 2. ARCHITEKTÚRA APLIKÁCIE — NAVIGÁCIA

### 2.1 Navigácia na **počítači** (Desktop)

**Rozloženie:** Sidebar (ľavá strana) + Hlavný obsah (pravá strana)

```
┌─────────────────────────────────────────────────────────┐
│ COMPAVEN 2.0                          [Profil] [Menu]   │
├──────────────┬──────────────────────────────────────────┤
│              │                                            │
│ ▶ Dashboard  │ Finančný prehľad                         │
│              │ [Kapitál] [Cieľ] [Trend]                │
│ ▶ Príjmy &   │ [Mesačné sporenie] [Spustiť skúšku]     │
│   Výdavky    │ [+ Nová transakcia] [Mesiac. vyhodnotenie]
│              │                                            │
│ ▶ Majetok &  │                                            │
│   Záväzky    │                                            │
│              │                                            │
│ ▶ Finančné   │                                            │
│   ciele      │                                            │
│              │                                            │
│ ▶ História & │                                            │
│   Analýzy    │                                            │
│              │                                            │
│ ▶ Plánovanie │                                            │
│              │                                            │
│ ▶ Nastavenia │                                            │
│              │                                            │
└──────────────┴──────────────────────────────────────────┘
```

**Logika:**
- Sidebar je vždy viditeľný (fixný)
- Aktívna sekcia je zvýraznená
- Klik na sekciu → zmena obsahu vpravo
- Vrátenie na Dashboard: logo COMPAVEN alebo sekcia "Dashboard"

---

### 2.2 Navigácia na **iPhone** (Mobilný)

**Rozloženie:** Bottom Navigation + Horná lišta

```
┌─────────────────────────────────────┐
│ COMPAVEN 2.0              [Menu] ... │
├─────────────────────────────────────┤
│                                     │
│        (Obsah obrazovky)            │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ 📊    💰    🏠    🎯    📈    ⚙️  │
│Prehľ Výdat Maj  Cieľ Pláno Nast  │
└─────────────────────────────────────┘
```

**Logika:**
- Bottom navigation s 6 hlavnými sekciami (História & Analýzy sú v expandovateľnom menu)
- Klik na ikonku → zmena obrazovky
- Aktívna ikonka je zvýraznená
- Vrátenie: ikonka "Prehľad" / Dashboard

---

### 2.3 Navigačná mapa — Všetky prepojenia

```
                        ┌─── Príjmy & Výdavky
                        │    (Nové transakcie)
                        │
Dashboard (Prehľad)  ───┼─── Majetok & Záväzky
    │                   │    (Majetok, hypotéky)
    │                   │
    │                   └─── Finančné ciele
    │                        (Cieľ, časový plán)
    │
    ├─── História & Analýzy
    │    (Časový rad, trendy)
    │
    ├─── Plánovanie
    │    (Simulácia, scenáre)
    │
    └─── Nastavenia
         (Profil, záloha, export)

KRÍŽOVÉ PREPOJENIA:
- Z Príjmy & Výdavky → Finančné ciele (zobrazenie predbehy dopad)
- Z Majetok & Záväzky → História (História zmien)
- Z Finančné ciele → Plánovanie (Simulácia s novými parametrami)
- Z História → Dashboard (Vrátenie s náhľadom)
```

---

## 3. SEDEM HLAVNÝCH OBRAZOVIEK — WIREFRAMY A ÚČEL

### OBRAZOVKA 1: DASHBOARD (Finančný prehľad)

**Hlavný účel:** Rýchly náhľad na finančný stav a pokrok k cieľu.

**Otázky, na ktoré odpovedá:**
- Aký je môj aktuálny kapitál?
- Koľko majú potrebovať do cieľa?
- Keď sa dosiahnem cieľ?
- Ako sa mi darí v porovnaní s predpokladom?

**Rozloženie na počítači:**

```
┌─ FINANČNÝ PREHĽAD ───────────────────────────────────────┐
│                                                            │
│  ┌─ HLAVNÉ METRIKY (Riadok 1) ──────────────────────┐   │
│  │                                                    │   │
│  │  Kapitál:          K_total                       │   │
│  │  100 000 €         ████████░░ 100k / 650k       │   │
│  │                    Cieľ: 648 649 € (do 221 m.)  │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─ KOMPONENTY KAPITÁLU (Riadok 2) ──────────────────┐   │
│  │                                                    │   │
│  │  K_inv (Investície):      60 000 €  ██████░░░░  │   │
│  │  K_cash (Hotovosť):       30 000 €  ███░░░░░░░  │   │
│  │  K_nem (Nehnuteľnosti):   10 000 €  █░░░░░░░░░  │   │
│  │                                                    │   │
│  │  K_FIRE (Investov. kap):  90 000 €  ██████░░░░  │   │
│  │  (Bez vlastného byvania)                         │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─ MESAČNÝ POKROK (Riadok 3) ─────────────────────┐   │
│  │                                                    │   │
│  │  Mesačné sporenie (m):     1 500 €              │   │
│  │  Priemer za posledných 3 mesiace:               │   │
│  │  ◀ 1 450 €  ▶ 1 500 €  ▶ 1 550 €              │   │
│  │                                                    │   │
│  │  Trend kapitálu za 6 mesiacov:                  │   │
│  │  [Jednoduchý čiarový graf: nahor idúca čiara]  │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─ UPOZORNENIA A AKCIE (Riadok 4) ──────────────────┐   │
│  │                                                    │   │
│  │  ⚠️  Posledné vyhodnotenie: 30. jún (2 mesiace) │   │
│  │      [Mesačné vyhodnotenie] [Preskočiť]        │   │
│  │                                                    │   │
│  │  ℹ️  Hypotékna splátka splatná: 5. auguste     │   │
│  │      [Zaznamenať splátku]                       │   │
│  │                                                    │   │
│  │  📋 Chceš exportovať dáta?                      │   │
│  │      [Exportovať]  [Zálohovať]  [Neskôr]       │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─ RÝCHLE AKCIE (Spodok) ──────────────────────────┐   │
│  │                                                    │   │
│  │  [+ Nová transakcia]  [Mesiac. vyhodnotenie]   │   │
│  │  [Podrobný prehľad]   [Plánovanie]              │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

**Rozloženie na iPhone:**

```
┌─────────────────────────┐
│ 📊 FINANČNÝ PREHĽAD    │
├─────────────────────────┤
│                         │
│ Kapitál: 100 000 €      │
│ ████████░░ 100k/650k   │
│ Cieľ do 221 mesiacov    │
│                         │
│ ─────────────────────── │
│                         │
│ K_inv:    60 000 €      │
│ K_cash:   30 000 €      │
│ K_nem:    10 000 €      │
│                         │
│ ─────────────────────── │
│                         │
│ m: 1 500 € / mesiac     │
│ Trend: ↗ (grafikon)     │
│                         │
│ ─────────────────────── │
│                         │
│ ⚠️ Vyhodnotenie?       │
│ [Mesiac. vyhodnotenie] │
│                         │
│ [+ Nová transakcia]     │
│                         │
└─────────────────────────┘
```

**Prázdny stav** (nový používateľ):

```
┌─────────────────────────────────────────┐
│  Vitajte v COMPAVEN 2.0                 │
│                                         │
│  Vašou cestou k finančnej slobode       │
│                                         │
│  Zatiaľ nemáte nastavené parametre.     │
│                                         │
│  [Začať — Nastavenie cieľa]             │
│                                         │
│  alebo                                  │
│                                         │
│  [Preskočiť — Ísť na Nastavenia]        │
│                                         │
└─────────────────────────────────────────┘
```

**Prepojenia z Dashboardu:**
- [+ Nová transakcia] → Príjmy & Výdavky (formulár)
- [Mesiac. vyhodnotenie] → Príjmy & Výdavky (vyhodnotenie)
- [Zaznamenať splátku] → Majetok & Záväzky (hypotéka)
- [Podrobný prehľad] → História & Analýzy
- [Plánovanie] → Plánovanie (simulácia)
- [Exportovať], [Zálohovať] → Nastavenia
- Logo/Domov → Dashboard (refresh)

---

### OBRAZOVKA 2: PRÍJMY & VÝDAVKY

**Hlavný účel:** Zaznamenávanie transakcií a vyhodnotenie mesačného stavu.

**Otázky, na ktoré odpovedá:**
- Ako zaznamenám novú transakciu?
- Ako vplýva na môj cieľ?
- Aký je stav mesiaca?

**Rozloženie (Počítač):**

```
┌─ PRÍJMY & VÝDAVKY ─────────────────────────────────────┐
│                                                         │
│  ┌─ HORNÁ LIŠTA ──────────────────────────────────┐   │
│  │  Mesiac: [Nov. 2026 ▼]                          │   │
│  │  Status: 3 transakcie, predbežný dopad: +1 % │   │
│  │  [+ Nová transakcia]  [Mesiac. vyhodnotenie]  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ ZOZNAM TRANSAKCIÍ (Tabuľka) ──────────────────┐   │
│  │                                                  │   │
│  │ Dátum    │ Typ      │ Suma    │ Zdroj  │ Stav  │   │
│  │──────────┼──────────┼─────────┼────────┼────────│   │
│  │ 1.11     │ Príjem   │ 2 500 € │ —      │ ✓     │   │
│  │ 2.11     │ Sporenie │ 1 500 € │ —      │ ✓     │   │
│  │ 3.11     │ Výdavok  │ −120 €  │ Z prí. │ ✓     │   │
│  │ 5.11     │ Investí. │ 5 000 € │ Z hot. │ ✓     │   │
│  │──────────┼──────────┼─────────┼────────┼────────│   │
│  │           Sumá mesiac: +9 000 €                  │   │
│  │           Predbežný dopad: +0,5 mesiacov skôr  │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ MESIAC. VYHODNOTENIE (Formulár) ────────────┐   │
│  │                                                  │   │
│  │  Dátum vyhodnotenia: [30.11.2026]              │   │
│  │                                                  │   │
│  │  Kapitál podľa ZLOŽIEK:                        │   │
│  │  K_inv (Investície): [  ] € (zadaj novú h.)  │   │
│  │  K_cash (Hotovosť): [  ] €                    │   │
│  │  K_nem (Nehnuteľnosti): [  ] € (ak máš)     │   │
│  │                                                  │   │
│  │  [Uložiť vyhodnotenie]                         │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Rozloženie (iPhone):**

```
┌─────────────────────────┐
│ 💰 PRÍJMY & VÝDAVKY    │
│ Nov. 2026             │
├─────────────────────────┤
│                         │
│ [+ Nová transakcia]     │
│                         │
│ 1.11 Príjem  2 500 € ✓ │
│ 2.11 Sporenie 1 500 € ✓│
│ 3.11 Výdavok −120 € ✓  │
│ 5.11 Investí. 5 000 € ✓│
│                         │
│ Suma: +9 000 €          │
│ Dopad: +0,5 m. skôr    │
│                         │
│ ─────────────────────── │
│                         │
│ [Mesiac. vyhodnotenie] │
│                         │
└─────────────────────────┘
```

**Nová transakcia — Formulár (Modal okno):**

```
┌─────────────────────────────────┐
│ Nová transakcia                 │
├─────────────────────────────────┤
│                                 │
│ Typ: [Príjem ▼]                │
│ (Príjem / Výdavok / Sporenie /  │
│  Investícia / Presun / Splátka) │
│                                 │
│ Dátum: [1.11.2026]             │
│                                 │
│ Suma: [2 500] €                │
│                                 │
│ Zdroj úhrady:                   │
│ (Ak výdavok:)                   │
│ [Z príjmu ▼]                    │
│ (Z príjmu / Z hotovosti /       │
│  Z investícií)                  │
│                                 │
│ Poznámka: [Mesačný plat]       │
│                                 │
│ ─────────────────────────────── │
│ Predbežný dopad:                │
│ K zmení sa: +2 500 €            │
│ Čas do cieľa: −5 dní            │
│                                 │
│ [Uložiť]  [Zrušiť]             │
│                                 │
└─────────────────────────────────┘
```

**Prepojenia:**
- [Nová transakcia] → Formulár
- [Mesiac. vyhodnotenie] → Vyhodnotenie
- [Späť] → Dashboard

---

### OBRAZOVKA 3: MAJETOK & ZÁVÄZKY

**Hlavný účel:** Správa nehnuteľností, investícií a hypoték.

**Otázky, na ktoré odpovedá:**
- Aké majetky vlastním?
- Aké záväzky mám?
- Ako vplýva na čistú hodnotu (K_nem)?

**Rozloženie (Počítač):**

```
┌─ MAJETOK & ZÁVÄZKY ────────────────────────────────────┐
│                                                         │
│  ┌─ ZÁLOŽKY ──────────────────────────────────────┐   │
│  │  [Majetok]  [Záväzky]  [Čistá hodnota]        │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ MAJETKY (Záložka 1) ──────────────────────────┐   │
│  │                                                  │   │
│  │  [+ Nový majetok]                              │   │
│  │                                                  │   │
│  │  ┌─ Dom na Námestí                            │   │
│  │  │ Typ: Nehnuteľnosť                          │   │
│  │  │ Hodnota: 300 000 €                         │   │
│  │  │ Poslední odhad: 1.11.2026                 │   │
│  │  │ Režim: Vlastníctvo                         │   │
│  │  │ [Upraviť]  [Zmazať]  [Vznik. hoc.]        │   │
│  │  └────────────────────────────────────────────┘   │
│  │                                                  │   │
│  │  ┌─ Portfólium akcií                          │   │
│  │  │ Typ: Investícia                            │   │
│  │  │ Hodnota: 60 000 €                          │   │
│  │  │ Poslední odhad: 30.10.2026                │   │
│  │  │ Výnos: 3,5% p.a.                          │   │
│  │  │ [Upraviť]  [Zmazať]  [Transakcie]         │   │
│  │  └────────────────────────────────────────────┘   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ ZÁVÄZKY (Záložka 2) ──────────────────────────┐   │
│  │                                                  │   │
│  │  [+ Nový záväzok]                              │   │
│  │                                                  │   │
│  │  ┌─ Hypotéka na dom                           │   │
│  │  │ Typ: Hypotéka                              │   │
│  │  │ Zostatok: 200 000 €                        │   │
│  │  │ Úroková sadzba: 2,5% p.a.                 │   │
│  │  │ Mesačná splátka: 1 000 €                  │   │
│  │  │ Splanosť: 2045-11-30                      │   │
│  │  │ [Zaznamenať splátku]  [Upraviť]  [Zmaz.] │   │
│  │  └────────────────────────────────────────────┘   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ ČISTÁ HODNOTA (Záložka 3) ────────────────────┐   │
│  │                                                  │   │
│  │  K_nem = SUMA(Majetok − Záväzky)               │   │
│  │                                                  │   │
│  │  Majetok celkom: 360 000 €                     │   │
│  │  − Záväzky celkom: −200 000 €                 │   │
│  │  = K_nem: 160 000 €                            │   │
│  │                                                  │   │
│  │  Príspevok k K_total: 160 000 €               │   │
│  │  (K_nem MIMO K_FIRE — vlastné bývanie)        │   │
│  │                                                  │   │
│  │  K_FIRE príspevok (prepoň. nehnuteľnosti):    │   │
│  │  0 € (v MVP bez prenajatého majetku)          │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Rozloženie (iPhone):**

```
┌──────────────────────┐
│ 🏠 MAJETOK & ZÁVÄZK│
├──────────────────────┤
│ [Majetok] [Záväzky]  │
│                      │
│ + Dom (300k €)       │
│   Vlastníctvo        │
│   [Upraviť]          │
│                      │
│ + Akcie (60k €)      │
│   Investícia         │
│   [Upraviť]          │
│                      │
│ ─────────────────── │
│                      │
│ Hypotéka: 200k €     │
│ m: 1 000 €           │
│ [Zaznamenať splátku] │
│                      │
│ ─────────────────── │
│                      │
│ K_nem: 160 000 €     │
│ (3 majetky − 1 záv.)│
│                      │
└──────────────────────┘
```

**Prepojenia:**
- [Upraviť], [Zmazať] → Detailný formulár
- [Zaznamenať splátku] → Príjmy & Výdavky (nová transakcija)
- [História] → História & Analýzy

---

### OBRAZOVKA 4: FINANČNÉ CIELE

**Hlavný účel:** Vizualizácia cieľa a času do dosiahnutia.

**Otázky, na ktoré odpovedá:**
- Aký je môj cieľ na finančnú slobodu?
- Kedy ho dosiahnem?
- Čo sa musí zmeniť, aby som ho dosiahol skôr?

**Rozloženie (Počítač):**

```
┌─ FINANČNÉ CIELE ───────────────────────────────────────┐
│                                                         │
│  ┌─ CIEĽ NA FINANČNÚ SLOBODU ───────────────────────┐ │
│  │                                                    │ │
│  │ Cieľová suma (K_FIRE): 648 649 €                │ │
│  │                                                    │ │
│  │ Vypočítané podľa:                               │ │
│  │ Ročné výdavky (V): 24 000 €                    │ │
│  │ Miera výberu (p): 3,7%                         │ │
│  │ Vzorec: T = V / p                              │ │
│  │                                                    │ │
│  │ [Upraviť cieľ]                                  │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ POKROK K CIEĽU ───────────────────────────────┐ │
│  │                                                    │ │
│  │ Aktuálny K_FIRE: 90 000 €                       │ │
│  │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │ │
│  │ (13,9% zo 648 649 €)                           │ │
│  │                                                    │ │
│  │ Zostáva: 558 649 €                              │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ ČASOVÝ PLÁN ──────────────────────────────────┐ │
│  │                                                    │ │
│  │ Podľa súčasného tempera:                        │ │
│  │ Mesačné sporenie: 1 500 €                      │ │
│  │ Reálny výnos: 3,5% p.a.                        │ │
│  │                                                    │ │
│  │ Cieľ dosiahnutý: január 2038 (221 mesiacov)   │ │
│  │ ☐ Decembra 2037  ☑ Januára 2038  ☐ Februára  │ │
│  │                                                    │ │
│  │ Scenáre pri zmene parametrov:                  │ │
│  │ + Mesačne sporenie +250 €                     │ │
│  │   → december 2037 (−1 mesiac)                 │ │
│  │                                                    │ │
│  │ + Výnos +0,5% p.a.                             │ │
│  │   → november 2037 (−2 mesiace)                │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ AKCIE ────────────────────────────────────────┐ │
│  │                                                    │ │
│  │ [Upraviť cieľ]  [Skúšacie scenáre]             │ │
│  │ [Pridať nehnuteľnosť]  [Prepočítať]            │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Rozloženie (iPhone):**

```
┌──────────────────────┐
│ 🎯 FINANČNÉ CIELE  │
├──────────────────────┤
│                      │
│ Cieľ: 648 649 €      │
│ (V=24k€, p=3,7%)     │
│                      │
│ K_FIRE: 90 000 €     │
│ ████░░░░░░░░░░░░░░ │
│ 13,9%               │
│                      │
│ Cieľ do:             │
│ januar 2038 (221 m.) │
│                      │
│ Scenáre:             │
│ m +250€ → dec 2037  │
│ r +0,5% → nov 2037  │
│                      │
│ [Upraviť cieľ]       │
│ [Skúšacie scenáre]  │
│                      │
└──────────────────────┘
```

**Prepojenia:**
- [Upraviť cieľ] → Formulár (zmena V, p)
- [Skúšacie scenáre] → Plánovanie (simulácia)
- [Predaj vplyv] → Príjmy & Výdavky

---

### OBRAZOVKA 5: HISTÓRIA & ANALÝZY

**Hlavný účel:** Časový rad financií a trendy.

**Otázky, na ktoré odpovedá:**
- Ako sa zmenil môj kapitál v čase?
- Ako sa trendy mesiacov?
- Kde sú najväčšie výdavky?

**Rozloženie (Počítač):**

```
┌─ HISTÓRIA & ANALÝZY ───────────────────────────────────┐
│                                                         │
│  ┌─ FILTER & OVLÁDANIE ──────────────────────────┐   │
│  │ Časové obdobie: [Nov 2025 - Nov 2026 ▼]      │   │
│  │ Zoradenie: [Chronologicky ▼]                  │   │
│  │ Typ: [Všetko ▼]  [K_inv ▼]  [K_cash ▼]      │   │
│  │ [Exportovať obdobie]                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ KAPITÁLOVÝ TREND (Čiarový graf) ────────────┐   │
│  │                                                  │   │
│  │ K_total v čase (12 mesiacov):                 │   │
│  │                                   ╱              │   │
│  │                        ╱        ╱                │   │
│  │              ╱      ╱      ╱                      │   │
│  │       ╱  ╱                                        │   │
│  │   ╱                                              │   │
│  │ N  D  J  F  M  A  M  J  J  A  S  O            │   │
│  │                                                  │   │
│  │ Trend: ↗ +8 500 € (mesiac), +3% p.a.         │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ KOMPONENTY KAPITÁLU (Vrstvový graf) ────────┐   │
│  │                                                  │   │
│  │ K_inv, K_cash, K_nem v čase:                  │   │
│  │ [Vrstvový graf s tromi farbami]                │   │
│  │                                                  │   │
│  │ K_inv: ↗ rast (výnos)                         │   │
│  │ K_cash: ↔ stabilný (sporenie, výdavky)       │   │
│  │ K_nem: ↗ rast (istina)                        │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ MESAČNÉ VÝDAVKY (Stĺpcový graf) ────────────┐   │
│  │                                                  │   │
│  │ Mesačné výdavky a príjmy:                     │   │
│  │ [Stĺpcový graf: príjmy ↑, výdavky ↓]          │   │
│  │                                                  │   │
│  │ Priemer: príjmy 2 500 €, výdavky 1 000 €     │   │
│  │ Trend: výdavky rastú (+2% p.m.)              │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ HISTÓRIA VYHODNOTENÍ (Tabuľka) ────────────┐   │
│  │                                                  │   │
│  │ Dátum      K_total   Δ Mesiac   m            │   │
│  │ ──────────────────────────────────────────   │   │
│  │ 30.9.2026  85 000 €  —          1 400 €     │   │
│  │ 31.10.2026 88 000 €  +3 000 €    1 450 €     │   │
│  │ 30.11.2026 90 500 €  +2 500 €    1 500 €     │   │
│  │ ──────────────────────────────────────────   │   │
│  │ Trend: K rastie, m rastie                    │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Rozloženie (iPhone):**

```
┌──────────────────────┐
│ 📈 HISTÓRIA & ANALÝZ│
├──────────────────────┤
│                      │
│ Periode: Nov-2026 ▼  │
│                      │
│ Kapitálový trend:    │
│ [Malý čiarový graf]  │
│ ↗ +8 500 €/mesiac   │
│                      │
│ Komponenty:          │
│ K_inv: 60k (↗ +5%)  │
│ K_cash: 30k (↔)     │
│ K_nem: 10k (↗ +8%)  │
│                      │
│ Výdavky:             │
│ Priemer: 1 000 €     │
│ Trend: ↗ +2%        │
│                      │
│ [Exportovať]         │
│                      │
└──────────────────────┘
```

**Prepojenia:**
- [Exportovať] → Nastavenia (záloha)
- Klik na graf → Detailný prehľad

---

### OBRAZOVKA 6: PLÁNOVANIE

**Hlavný účel:** Simulácia scenárov a „čo ak" otázky.

**Otázky, na ktoré odpovedá:**
- Čo sa stane, ak zvýšim mesačné sporenie?
- Čo ak sa zmení výnos?
- Ako náklady na bývanie ovplyvnia môj cieľ?

**Rozloženie (Počítač):**

```
┌─ PLÁNOVANIE ───────────────────────────────────────────┐
│                                                         │
│  ┌─ VYSVETLENIE ──────────────────────────────────┐   │
│  │ Plánovanie vám umožní testovať rôzne scenáre  │   │
│  │ bez zmeny vašich skutočných dát.              │   │
│  │                                                │   │
│  │ V MVP: Simulácia bez ukladania scenárov.      │   │
│  │ Fáza 2+: Ukladanie a porovnávanie.            │   │
│  │                                                │   │
│  │ (Bezpečnosť: Pôvodné dáta ostávajú nezmenené)│   │
│  │                                                │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ ПАРАМЕТРЫ SIMULÁCIE ──────────────────────────┐   │
│  │                                                  │   │
│  │ Začiatok simulácie: Dnešný stav               │   │
│  │ (K_inv, K_cash, K_nem, m, r)                  │   │
│  │                                                  │   │
│  │ Zmeny na testovanie:                          │   │
│  │                                                  │   │
│  │ ☐ Mesačné sporenie (m):                       │   │
│  │    Pôvodne: 1 500 €                           │   │
│  │    Simulácia: [1 500] € → [2 000] €          │   │
│  │                                                  │   │
│  │ ☐ Reálny výnos (r):                           │   │
│  │    Pôvodne: 3,5% p.a.                         │   │
│  │    Simulácia: [3,5] % → [4,5] %              │   │
│  │                                                  │   │
│  │ ☐ Nový majetok (K_nem):                       │   │
│  │    Pôvodne: 10 000 €                          │   │
│  │    Simulácia: [10 000] € → [50 000] €       │   │
│  │                                                  │   │
│  │ ☐ Ročné výdavky (V):                          │   │
│  │    Pôvodne: 24 000 €                          │   │
│  │    Simulácia: [24 000] € → [20 000] €       │   │
│  │                                                  │   │
│  │ [Spustiť simuláciu]  [Vynulovaťzmeny]        │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ VÝSLEDKY SIMULÁCIE ────────────────────────────┐   │
│  │                                                  │   │
│  │ Scenár: "m = 2 000 € + r = 4,5%"             │   │
│  │                                                  │   │
│  │ Cieľ dosiahnutý:                              │   │
│  │ ✓ júní 2036 (−19 mesiacov!)                   │   │
│  │                                                  │   │
│  │ Zmena (v porovnaní s pôvodným plánom):        │   │
│  │ • Mesačné sporenie: +500 € (Δ +33%)          │   │
│  │ • Výnos: +1% p.a. (Δ +28%)                   │   │
│  │ • Výsledok: 19 mesiacov skôr!                 │   │
│  │                                                  │   │
│  │ Kapitál v čase (Grafikon):                    │   │
│  │ [Dve čiary: pôvodný plán vs. scenár]          │   │
│  │ Pôvodný: lineárny nárast                      │   │
│  │ Scenár: strmší nárast (zložený úrok)          │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ ĎALŠÍ POSTUP ──────────────────────────────────┐   │
│  │                                                  │   │
│  │ Scenár sa v MVP neukladá.                      │   │
│  │                                                  │   │
│  │ Ak sa vám páči, implementujte zmeny ručne:    │   │
│  │ [Prejsť na Príjmy & Výdavky a zmeniť m]       │   │
│  │ [Prejsť na Finančné ciele a zmeniť V]         │   │
│  │ [Prejsť na Nastavenia a zmeniť r]             │   │
│  │                                                  │   │
│  │ [+ Nový scenár]  [Späť na Dashboard]          │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Rozloženie (iPhone):**

```
┌──────────────────────┐
│ 📊 PLÁNOVANIE      │
├──────────────────────┤
│                      │
│ Testujem scenáre:    │
│                      │
│ m: [1 500€] → [2 0] │
│ r: [3,5%] → [4,5%]  │
│ V: [24k€] → [20k€]  │
│                      │
│ [Spustiť simuláciu]  │
│                      │
│ ─────────────────── │
│                      │
│ Výsledok:            │
│ Cieľ: jún 2036      │
│ (−19 mesiacov!)      │
│                      │
│ m +500€ (Δ+33%)     │
│ r +1% (Δ+28%)       │
│                      │
│ [Implementovať]      │
│ [Ďalší scenár]       │
│                      │
└──────────────────────┘
```

**Prepojenia:**
- [Implementovať] → Príjmy & Výdavky alebo Finančné ciele
- [Späť na Dashboard] → Dashboard

---

### OBRAZOVKA 7: NASTAVENIA

**Hlavný účel:** Konfigurácia aplikácie a správa dát.

**Otázky, na ktoré odpovedá:**
- Ako exportujem svoje dáta?
- Ako si zálohnem aplikáciu?
- Ako môžem všetko vynulovaťi alebo zmeniť?

**Rozloženie (Počítač):**

```
┌─ NASTAVENIA ───────────────────────────────────────────┐
│                                                         │
│  ┌─ PROFIL ──────────────────────────────────────┐   │
│  │                                                │   │
│  │ Meno aplikácie: COMPAVEN 2.0                 │   │
│  │ Verzia: 1.0                                  │   │
│  │ Posledné vyhodnotenie: 30.11.2026           │   │
│  │ Počet mesiacov dát: 13                      │   │
│  │ Veľkosť dátového balíka: 2,3 MB             │   │
│  │                                                │   │
│  │ [Zmeniť nastavenia výnos]  [Zmeniť cieľ]    │   │
│  │                                                │   │
│  └────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ ZÁLOHOVANIE & EXPORT ────────────────────────┐   │
│  │                                                │   │
│  │ ✅ Automatická záloha: Zapnutá               │   │
│  │    Frekvencia: Mesačne                       │   │
│  │    Poslední zálohm: 30.11.2026              │   │
│  │                                                │   │
│  │ [Zálohuj teraz]  [Obnoviť zo zálohy]        │   │
│  │                                                │   │
│  │ ─────────────────────────────────────────── │   │
│  │                                                │   │
│  │ Ručný export:                                │   │
│  │ Exportuj všetky dáta ako JSON alebo CSV      │   │
│  │ (Pre analýzu v exceľi, transferr, analýzu)  │   │
│  │                                                │   │
│  │ [Exportovať ako JSON]  [Exportovať ako CSV] │   │
│  │                                                │   │
│  │ ─────────────────────────────────────────── │   │
│  │                                                │   │
│  │ Import dát:                                  │   │
│  │ Nahrajte zastaraný zálohu alebo JSON:       │   │
│  │                                                │   │
│  │ [Vybrať súbor]  [Importovať]                │   │
│  │                                                │   │
│  └────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ RESETOVANIE ──────────────────────────────────┐   │
│  │                                                  │   │
│  │ ⚠️  Pozor: Tieto akcie sú nezvrátiteľné!      │   │
│  │                                                  │   │
│  │ [Vynulovaťaplikáciu]                          │   │
│  │ Zmaž všetky dáta a začni nanovo.             │   │
│  │ (Pred tým robim zálohm!)                     │   │
│  │                                                  │   │
│  │ [Vynulovaň parametry]                         │   │
│  │ Vynuluj iba cieľ a výnos.                    │   │
│  │ (Históriu udržíme)                           │   │
│  │                                                  │   │
│  └────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ O APLIKÁCII ──────────────────────────────────┐   │
│  │                                                  │   │
│  │ COMPAVEN 2.0                                  │   │
│  │ Osobná finančná aplikácia na cestu             │   │
│  │ k finančnej slobode                           │   │
│  │                                                  │   │
│  │ LOCAL FIRST — Bez cloudovej synchronizácie    │   │
│  │ Offline — Funguje bez internetu               │   │
│  │ Bez účtu — Všetky dáta sú len vaše            │   │
│  │                                                  │   │
│  │ Kontakt: support@compaven.sk                  │   │
│  │ Dokumentácia: docs.compaven.sk                │   │
│  │                                                  │   │
│  └────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Rozloženie (iPhone):**

```
┌──────────────────────┐
│ ⚙️ NASTAVENIA      │
├──────────────────────┤
│                      │
│ 📊 Profil            │
│ Verzia: 1.0          │
│ Dáta: 13 mesiacov    │
│ [Zmeniť]             │
│                      │
│ 💾 Zálohovanie       │
│ Posledne: 30.11      │
│ [Zálohovať teraz]    │
│ [Obnoviť]            │
│                      │
│ 📤 Export            │
│ [JSON]  [CSV]        │
│                      │
│ 📥 Import            │
│ [Vybrať súbor]       │
│                      │
│ 🔄 Reset             │
│ [Vynulovať app]      │
│ (Pozor: nezvrátiteľ) │
│                      │
│ ℹ️  O aplikácii      │
│ LOCAL FIRST          │
│ OFFLINE              │
│                      │
└──────────────────────┘
```

**Prepojenia:**
- [Zmeniť cieľ] → Finančné ciele
- [Zmeniť výnos] → Nastavenia (podformulár)
- [Obnoviť] → Modal s výberom zálohy
- [Exportovať] → Download súboru

---

## 4. POUŽÍVATEĽSKÉ TOKY — HLAVNÉ SCENÁRE

### TOK 1: Nový používateľ

```
START
  ↓
Načítanie aplikácie (PWA, offline)
  ↓
[Stránka s vitajte]
  ↓
[Začať — Nastavenie cieľa]
  ↓
Formulár: Cieľ (V, p) → Dashboard
  ↓
Formulár: Kapitál (K_inv, K_cash, r) → Dashboard
  ↓
Formulár: Vyhodnotenie (D_L, K_L) → Dashboard
  ↓
[Dashboard s prvou návštevou]
  ↓
Používateľ vidí: "Váš cieľ je xxx, do xxx mesiacov"
  ↓
END
```

### TOK 2: Mesačný cyklus

```
START
  ↓
[Dashboard] — Zobrazenie aktuálneho stavu
  ↓
[+ Nová transakcia] → Formulár → Uloženie → Dashboard (predbežný dopad)
  ↓
... (ďalšie transakcie v mesiaci) ...
  ↓
[Mesiac. vyhodnotenie] → Formulár → Uloženie → Dashboard (finálny stav)
  ↓
K_total sa aktualizuje, cieľ sa prepočíta
  ↓
[História & Analýzy] — Trend sa zmení
  ↓
END
```

### TOK 3: Majetok a záväzky

```
START
  ↓
[Dashboard] → [Majetok & Záväzky]
  ↓
[+ Nový majetok] → Formulár → Uloženie
  ↓
[+ Nový záväzok] → Formulár → Uloženie
  ↓
K_nem sa prepočíta, K_FIRE sa zmení
  ↓
[Dashboard] sa aktualizuje (nové K_nem)
  ↓
[Finančné ciele] — Cieľ sa prepočíta
  ↓
END
```

### TOK 4: Simulácia scenára

```
START
  ↓
[Dashboard] → [Plánovanie]
  ↓
[Zmeny parametrov] (m, r, V, K_nem)
  ↓
[Spustiť simuláciu]
  ↓
Aplikácia vypočíta nový cieľ a čas
  ↓
[Výsledky scenára] — Grafikon, comparácia
  ↓
[Implementovať] → Zmeny sa presunú do príslušných obrazoviek
  ↓
END
```

---

## 5. RESPONZÍVNY DIZAJN

### Breakpointy

| Zariadenie | Šírka | Navigácia | Rozloženie |
|---|---|---|---|
| **Desktop** | ≥ 1024px | Sidebar (fixný) | 2-stĺpcové |
| **Tablet** | 768–1023px | Top nav + Sidebar zvinutý | 1–2 stĺpcové |
| **iPhone** | < 768px | Bottom nav | 1-stĺpcové, fullscreen |

### Príklady responzivitasu

**Prípad 1: Desktop (1440px)**
```
[Sidebar (220px)] [Obsah (1220px)]
     Menu             Hlavný obsah
     Icons             Tabuľky, grafikony
```

**Prípad 2: Tablet (768px)**
```
[Zvinutý sidebar] [Obsah (600px)]
    Ikony            Rearrangovaný obsah
    (Hover)          Menšie tabuľky
```

**Prípad 3: iPhone (375px)**
```
     [Obsah (375px)]
    Full-screen obsah
    Bottom navigation
```

---

## 6. KOMPONENTY A VZORY

### Gombíky a Akcie

**Primárne akcie:** Modrá farba (CTA)
```
[+ Nová transakcia]  [Spustiť simuláciu]  [Uložiť]
```

**Sekundárne akcie:** Sivá farba
```
[Späť]  [Zrušiť]  [Preskočiť]
```

**Nebezpečné akcie:** Červená farba
```
[Vynulovaťaplikáciu]  [Zmazať]
```

### Formuláre

**Štandard:**
```
┌─ Pole ────────────────┐
│ Label                 │
│ [Vstup alebo select]  │
│ Hint (ak treba)       │
└───────────────────────┘
```

**Príklad:**
```
Mesačné sporenie (m)
[1500] €

Hint: Voľný peňažný tok po všetkých výdavkoch
```

### Tabuľky

**Na desktope:** Plná tabuľka
```
Dátum | Typ | Suma | Stav
─────┼─────┼──────┼────
1.11 | ... | ...  | ✓
```

**Na iPhone:** Karty s horizontálnym scrollom
```
┌─────────────┐
│ 1.11        │
│ Príjem      │
│ 2 500 €     │
└─────────────┘
```

---

## 7. FINANČNÉ PRAVIDLÁ V UI

### K_FIRE na Dashboarde

**Zobrazenie:**
```
K_FIRE = K_inv + K_cash + K_nem_prenajatý
(Bez vlastného byvania — to je informačne na K_nem)

K_total = K_inv + K_cash + K_nem
(Vrátane vlastného byvania)
```

### Výnos na K_inv

**Zobrazenie v História & Analýzy:**
```
K_inv v čase s výnosom:
- Trend: ↗ rast z výnosu
- Formula: K_inv(n) = K_inv(n-1) × (1+i) + vklady
- Výnos sa počíta IBA na investovaný kapitál
```

### Mesačné sporenie (m)

**Zobrazenie:**
```
m = Príjmy − Výdavky − Splátky − Ostatné náklady
= Voľný peňažný tok

Nezahŕňa:
- Istinu (je to presun, nie výdavok)
- Presuny medzi účtami (K_cash → K_inv)
```

---

## 8. OTVORENÉ PRODUKTOVÉ ROZHODNUTIA

Na základe FÁZY 1 sú všetky finančné rozhodnutia (B1–B7) uzavreté. Na základe FÁZY 2 identifikujem **nasledujúce otvorené otázky**, ktoré by mohli vyžadovať rozhodnutie pred pokračovaním do FÁZY 3 (Implementácia):

### **P1: Farba a Branding**

Aké farby majú reprezentovať COMPAVEN 2.0?
- Modro-zelená (bezpečnosť, rast)?
- Modrá (profesionálnosť)?
- Fialová (inovácia)?

**Vplyv:** Vizuálny vzhľad, konzistentnosť.

### **P2: Grafikony a Trendy**

Ktoré trendy majú byť na Dashboarde v MVP a ktoré v Fáze 2+?

**V MVP:**
- Kapitálový trend (čiara)
- Komponenty kapitálu (vrstvový graf)
- Mesačný pokrok (text + čiara)

**V Fáze 2+:**
- Podrobné mesačné výdavky
- Predpokladané výdavky

### **P3: Onboarding — Povinný alebo Voliteľný**

Má nový používateľ absolvovať onboarding (3 formuláre) alebo môže preskočiť na Nastavenia?

**Vplyv:** UX prvej návštěvy.

---

## 9. OVERENIE NÁVRHU

### Kontrolný zoznam: Všetkých 7 obrazoviek

- ✅ **Dashboard** — Odpoveda na 4 otázky (Kde? Kam? Ako? Čo?)
- ✅ **Príjmy & Výdavky** — Formuláre, história, vyhodnotenie
- ✅ **Majetok & Záväzky** — Správa majetkov, hypoték, čistej hodnoty
- ✅ **Finančné ciele** — Cieľ, pokrok, scenáre
- ✅ **História & Analýzy** — Trendy, grafikony, export
- ✅ **Plánovanie** — Simulácia bez ukladania
- ✅ **Nastavenia** — Profil, záloha, export, reset

### Kontrolný zoznam: Návrh

- ✅ Všetkých 7 obrazoviek má jasný účel
- ✅ Navigácia je jednoduchá (Sidebar + Bottom nav)
- ✅ Dashboard je najdôležitejšia (centrálne pozisanie)
- ✅ Responzívny dizajn (Desktop + iPhone)
- ✅ Finančné pravidlá sú zakomponované
- ✅ Všetky scenáre z FÁZY 1 sú aplikovateľné
- ✅ K_FIRE a K_total sú jasne oddelené
- ✅ Výnos sa počíta správne
- ✅ Mesačné sporenie (m) je správne definované

---

## 10. ZÁVER A ODPORÚČANIE

### NÁVRH JE UCELE

NEJ A REALIZOVATEĽNÝ

COMPAVEN 2.0 FÁZA 2 apresentuje:

1. **Celkovú navigáciu** — Jednoduchú a intuitívnu (Sidebar + Bottom nav).
2. **Sedem obrazoviek** — Každá s jasným účelom a prepojeniami.
3. **Dashboard-centric dizajn** — Najdôležitejšia obrazovka v centre.
4. **Finansial logic integrated** — Všetky pravidlá z FÁZY 1 sú zakomponované.
5. **Responzívny dizajn** — Počítač, tablet, iPhone.
6. **Používateľské toky** — Nový používateľ, mesačný cyklus, simulácia.
7. **Malý počet otvorených otázok** — Iba 3 (branding, grafikony, onboarding).

### ĎALŠÍ POSTUP

Po vašom schválení FÁZY 2:

1. **FÁZA 3: DETAILNÝ NÁVRH** — Jednotlivé formuláre, komponenty, interakcie.
2. **FÁZA 4: PROTOTYPOVANIE** — Interaktívny prototype (Figma/Adobe XD).
3. **FÁZA 5: IMPLEMENTÁCIA** — Kód, testy, nasadenie.

**FÁZA 2 je pripravená na schválenie zakladateľom.**

---

**KONIEC FÁZY 2: CELKOVÝ NÁVRH PRODUKTU**
