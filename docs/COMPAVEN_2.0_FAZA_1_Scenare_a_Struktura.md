# COMPAVEN 2.0 — FÁZA 1: Detailné scenáre a celková štruktúra

**Dátum:** 2026-11-07  
**Stav:** Návrh na schválenie  
**Výstup:** Používateľské scenáre, štruktúra obrazoviek, prepojenia medzi oblasťami.

---

## ZMENY OPROTI V2 (NA ZÁKLADE SCHVÁLENIA)

✅ **História a analýza** — Posúvaná do **MVP** (nie rozšírenie).  
✅ **Export/Zálohovanie/Obnova** — V **MVP**, uvažované v architektúre.  
✅ **Všetky 7 oblastí** — Vrátane Nastavení, v celkovej štruktúre.  
✅ **Object Stores** — Pracovný návrh, upresnenie po scenároch.  
✅ **Local first** — Zachované (offline, bez účtu).  
✅ **Migrácia** — Budúca, samostatná.

---

## PRINCÍP: OUTSIDE IN PRE FÁZU 1

Nenapravujem formuláre. Opisujem **používateľské scenáre** (čo chce dosiahnuť) a **obrazovky** (ako to vidí), aby bol jasný tok medzi oblasťami.

---

## ČASŤ A: DETAILNÉ POUŽÍVATEĽSKÉ SCENÁRE

### SCENÁR 1: Nový používateľ — Prvá návšteva

**Kontext:**  
Zakladateľ otvára aplikáciu prvý raz na iPhone či počítači.

**Čo chce dosiahnuť:**
- Pochopiť, na čo je aplikácia.
- Nastaviť si základné parametre (cieľ, kapitál).
- Vidieť, kde je jeho finančný cieľ.

**Kroky:**
1. Aplikácia sa načíta (PWA, offline).
2. Zobrazí sa **Onboarding obrazovka** (krátke vysvetlenie):
   - „COMPAVEN vám pomôže pochopiť cestu k finančnej slobode."
   - „Začneme nastavením vášho cieľa."
3. Používateľ vidí **Obrazovka 1: Nastavenie cieľa** s polami:
   - Ročné výdavky (V) — predvolená hodnota 24 000 €.
   - Miera výberu (p) — predvolená 3,7 %.
   - Cieľová suma sa automaticky vypočíta (T = V / p).
   - Tlačidlo: [Ďalej]
4. **Obrazovka 2: Kapitál** — Zadať aktuálnu hodnotu:
   - Investície (K_inv) — napr. 60 000 €.
   - Hotovosť (K_cash) — napr. 30 000 €.
   - Reálny výnos (r) — predvolená 3,5 %.
   - Tlačidlo: [Ďalej]
5. **Obrazovka 3: Prvé vyhodnotenie** — Zápis mesačného stavu:
   - Dátum — dnešný deň (D_L).
   - Hodnota investícií — ako sme zadali.
   - Nasporená suma (hotovosť) — ako sme zadali.
   - Tlačidlo: [Hotovo, pokračuj]
6. Aplikácia vypočíta cieľ a scenáre.
7. Zobrazi **Prehľad (Dashboard)**:
   - „Váš cieľ: 648 649 € do januára 2038."
   - „Scenáre: december 2037 — február 2039."
   - Tlačidlo: [Zapísať transakciu] [Mesačné vyhodnotenie]

**Výstup scenára:**
- Nastavenie uložené v aplikácii.
- Prvé vyhodnotenie — D_L, K_L.
- Prehľad je pracovný.

**Prepojenia:**
- Nastavenie → Finančné ciele (výpočet cieľa).
- Kapitál → Finančný prehľad (K_L).
- Kapitál → Príjmy/Výdavky (predbežný dopad).

---

### SCENÁR 2: Mesačný cyklus — Transakcie a vyhodnotenie

**Kontext:**  
Zakladateľ používa aplikáciu počas mesiaca (november 2026).

**Čo chce dosiahnuť:**
- Zaznamenať svoje financie.
- Vidieť, ako ovplyvňujú svoj cieľ.
- Na konci mesiaca aktualizovať stav.

**Kroky počas mesiaca:**

1. **Nov. 1** — Zobrazi sa **Prehľad (Dashboard)**:
   - Kapitál: 100 000 €, Cieľ: január 2038.
   - Tlačidlo: [+ Nová transakcia]

2. **Nov. 1** — Klik → **Formulár: Nová transakcia**:
   - Typ: [Príjem ▼]
   - Dátum: 1.11.2026 (plat)
   - Suma: 2 500 €
   - Zdroj úhrady: — (pre príjem sa nezadáva)
   - Poznámka: „Mesačný plat"
   - Tlačidlo: [Uložiť]
   
   Aplikácia zobrazí: **Predbežný dopad: bez zmeny** (príjem neovplyvňuje K).

3. **Nov. 2** — Klik → **Formulár: Nová transakcia**:
   - Typ: [Sporenie]
   - Suma: 1 500 €
   - Poznámka: „Mesačné sporenie"
   - Aplikácia vypočíta: Predbežný dopad: **+1 mesiac skôr** (K vzrastie).

4. **Nov. 3** — Klik → **Formulár: Nová transakcia**:
   - Typ: [Výdavok]
   - Suma: -120 €
   - Zdroj úhrady: [Z príjmu ▼]
   - Poznámka: „Obed"
   - Predbežný dopad: **bez zmeny** (výdavok z príjmu).

5. **Nov. 5** — Klik → **Formulár: Nová transakcia**:
   - Typ: [Investícia]
   - Suma: 5 000 €
   - Zdroj úhrady: [Z hotovosti ▼]
   - Poznámka: „Presun do investícií"
   - Predbežný dopad: **bez zmeny** (K sa nemení, len presun).

6. **Nov. 30** — Koniec mesiaca. Klik: **[Mesačné vyhodnotenie]**:
   - Zobrazí sa **Formulár: Vyhodnotenie**:
     - Dátum: 30.11.2026
     - Aktuálna hodnota investícií: 62 000 € (vzrástla o výnos)
     - Nasporená suma (hotovosť): 28 500 € (po prevode)
     - Tlačidlo: [Uložiť]
   
   Aplikácia:
   - Uloží vyhodnotenie.
   - Prepočíta cieľ: nový K_L = 90 500 €, nový dátum = január 2038 (nezmenený).
   - Predbežný dopad sa **resetuje** (nové vyhodnotenie je oficináne).

7. **Prehľad po vyhodnotení:**
   - „Kapitál: 90 500 €"
   - „Posledné vyhodnotenie: 30.11.2026"
   - História transakcií: november (11 záznamov).

**Výstup scenára:**
- Transakcie uložené.
- Vyhodnotenie uložené.
- Cieľ prepočítaný.

**Prepojenia:**
- Príjmy/Výdavky ↔ Finančný prehľad (predbežný dopad, K_L).
- Príjmy/Výdavky ↔ Finančné ciele (m — mesačné sporenie).
- Finančný prehľad → História (história transakcií a vyhodnotení).

---

### SCENÁR 3: Majetok — Nehnuteľnosť a hypotéka (Fáza 2, ale test v MVP)

**Kontext:**  
Zakladateľ vlastní dom s hypotékou a chce, aby aplikácia počítala s hypotéknym tieňom na jeho cieľ.

**Čo chce dosiahnuť:**
- Zapísať nehnuteľnosť a hypotéku.
- Vidieť, ako vplýva na finančný cieľ.
- Automatické splácanie a dopyt.

**Kroky:**

1. Klik: **[Majetok]** → **[+ Nový majetok]**:
   - Typ: [Nehnuteľnosť ▼]
   - Názov: „Dom na Námestí"
   - Aktuálna hodnota: 300 000 €
   - Dátum odhadu: 1.11.2026
   - Režim: [Vlastníctvo ▼]
   - Poznámka: „Vlastné bývanie"
   - Tlačidlo: [Uložiť]

2. Aplikácia uloží majetok; **História** ho zaznamená.

3. Klik: **[Majetok]** → **[+ Nový záväzok]**:
   - Typ: [Hypotéka ▼]
   - Názov: „Hypotéka na dom"
   - Zostatok: 200 000 €
   - Úroková sadzba: 2,5 % p.a.
   - Mesačná splátka: 1 000 €
   - Dátum splatenia: 2045-11-30
   - Tlačidlo: [Uložiť]

4. Aplikácia:
   - Uloží záväzok.
   - Vypočíta čistú hodnotu: 300 000 − 200 000 = 100 000 €.
   - Zahrnie K_nem = 100 000 € do kapitálu.
   - Prepočíta cieľ (teraz K = K_inv + K_cash + K_nem).

5. **Prehľad sa aktualizuje:**
   - Kapitál: 190 500 € (90 500 + 100 000)
   - Cieľ: december 2037 (o mesiac skôr).

6. Klik: **[História]** → (História obsahuje záznam o majetku a hypotéke).

**Výstup scenára:**
- Majetok a záväzok uložené.
- Cieľ prepočítaný s K_nem.
- História aktualizovaná.

**Prepojenia:**
- Majetok/Záväzky ↔ Finančný prehľad (K_nem, cieľ).
- Majetok/Záväzky ↔ História (záznam majetku).
- Majetok/Záväzky ↔ Príjmy/Výdavky (ak je prenájom: nájom ako príjem).

---

### SCENÁR 4: Finančné ciele — Nastavenie parametrov

**Kontext:**  
Zakladateľ chce zmeniť parametre cieľa (napr. zvýšiť ročné výdavky).

**Čo chce dosiahnuť:**
- Zmeniť V, p, r, rezervu.
- Vidieť, ako sa zmení cieľ a scenáre.

**Kroky:**

1. Klik: **[Ciele]** → **[Zmeniť parametre]**:
   - V (Ročné výdavky): 24 000 € → **30 000 €** (zmena +25 %)
   - p (Miera výberu): 3,7 % (bez zmeny)
   - r (Výnos): 3,5 % (bez zmeny)
   - Rezerva: 3 mesiace (bez zmeny)
   - Tlačidlo: [Vypočítať]

2. Aplikácia vypočíta nový cieľ:
   - T = 30 000 / 0,037 = 810 811 €
   - Scenáre: január 2039 — march 2040
   - Predbežný dopad: cieľ sa posunul o ~12 mesiacov ďalej.

3. Zobrazí sa:
   - „Nový cieľ: 810 811 €"
   - „Nový dátum: január 2039"
   - „Posúnutie: o 12 mesiacov ďalej (lebo väčšie výdavky)"

4. Tlačidlo: **[Potvrdiť zmenu]** — Uloží zmenu v Nastaveniach.

5. **Prehľad sa aktualizuje:**
   - Kapitál: nezmenený
   - Cieľ: január 2039 (zmena z januára 2038)

**Výstup scenára:**
- Parametre zmené a uložené.
- Cieľ a scenáre prepočítané.
- Prehľad aktualizovaný.

**Prepojenia:**
- Finančné ciele ↔ Finančný prehľad (nový cieľ).
- Finančné ciele ↔ História (história zmien).

---

### SCENÁR 5: Plánovanie — Simulácia "čo ak"

**Kontext:**  
Zakladateľ chce vedieť, ako by sa zmenil cieľ, ak by zvýšil mesačné sporenie.

**Čo chce dosiahnuť:**
- Simulovať zmenu bez uloženia.
- Vidieť výsledok.
- Rozhodnúť sa, či zmenu uloží.

**Kroky:**

1. Klik: **[Plánovanie]** → **[Nový scenár]**:
   - Názov: „Agresívny — zvýšené sporenie"
   - Mesačné sporenie (m): 1 500 € → **2 500 €**
   - Ostatné parametre: bez zmeny
   - Tlačidlo: [Simulovať]

2. Aplikácia vypočíta výsledok:
   - Nový dátum: september 2037 (o 4 roky skôr)
   - Nový scenár: august 2037 — november 2037

3. Zobrazí sa:
   - „Ak zvýšiš mesačné sporenie na 2 500 €, dosiahnuš cieľ o 4 roky skôr."
   - Tabuľka s porovnaním (aktuálny vs. simulácia)

4. Tlačidlá: **[Uložiť scenár]** alebo **[Zrušiť]**

5. Ak **[Uložiť scenár]**:
   - Scenár sa uloží v aplikácii (bez zmeny aktuálneho).
   - Zobrazí sa v zozname uložených scenárov.
   - Kedy chcete: [Aktivovať scenár] — zmení parametre oficiálne.

**Výstup scenára:**
- Simulácia bez zmeny aktuálneho stavu.
- Scenár uložený (voliteľne).

**Prepojenia:**
- Plánovanie ↔ Finančné ciele (simulácia parametrov).
- Plánovanie → História (uložené scenáre).

---

### SCENÁR 6: História — Analýza trendov

**Kontext:**  
Zakladateľ chce vidieť, ako sa jeho finančná situácia zlepšila v čase.

**Čo chce dosiahnuť:**
- Vidieť kapitál v čase (trendy).
- Porovnať mesačné sporenie (je rastúce?).
- Expoř dáta.

**Kroky:**

1. Klik: **[História]** → **[Analýzy]**:
   - Zobrazí sa: **História vyhodnotení (Snapshots)**
   - Tabuľka s dátumom, K_inv, K_cash, K_nem, K_celkom:
     - 5.11.2026: 100 000 €
     - 5.10.2026: 98 500 €
     - 5.9.2026:  97 000 €

2. Klik: **[História]** → **[Transakcie]**:
   - Zoznam všetkých transakcií s filtrami:
   - Filter: [Typ: Všetko ▼] [Mesiac: november 2026 ▼]
   - Suma za mesiac: Príjem 2 500 €, Sporenie 1 500 €, Výdavky −120 €

3. Klik: **[História]** → **[Trendy]**:
   - Graf: Mesačné sporenie v čase (trend rastúci / klesajúci).
   - Označenie: «m = 1 500 € (priemer za posledné 3 mesiace)»

4. Klik: **[Exportovať dáta]**:
   - Možnosti: [JSON] [CSV] [PDF]
   - Aplikácia si vyberie formát a stiahne súbor.

**Výstup scenára:**
- História zobrazená a analyzovaná.
- Dáta exportované.

**Prepojenia:**
- História ↔ Príjmy/Výdavky (transakcie).
- História ↔ Finančné ciele (história zmien cieľa).
- História ↔ Majetok (história majetku).

---

### SCENÁR 7: Nastavenia — Export a import

**Kontext:**  
Zakladateľ si chce zálohovať dáta alebo ich preniesť na iné zariadenie.

**Čo chce dosiahnuť:**
- Bezpečne zálohovať dáta.
- Obnoriť dáta z úlohy.

**Kroky:**

1. Klik: **[Nastavenia]** → **[Správa údajov]**:
   - Možnosti: [Exportovať] [Importovať] [Vymazať všetko]

2. **Export:**
   - Klik: **[Exportovať]**
   - Aplikácia vygeneruje JSON súbor so všetkými dátami.
   - Upozornenie: «Ide o citlivé finančné údaje. Uložte si ho bezpečne.»
   - Tlačidlo: [Stiahnuť súbor]
   - Súbor sa stiahne (napr. `compaven-backup-2026-11-07.json`)

3. **Import:**
   - Klik: **[Importovať]**
   - Aplikácia vyzve: «Vyberte si súbor»
   - Používateľ si zvolí súbor.
   - Aplikácia overí schému a zobrazí náhľad:
     - «Počet transakcií: 150»
     - «Počet vyhodnotení: 12»
     - «Dátum exportu: 2026-11-01»
   - Upozornenie: «Import nahradí aktuálne dáta. Chcete pokračovať?»
   - Tlačidlo: **[Potvrdiť import]**
   - Aplikácia uloží staré dáta ako zálohu a importuje nové.

4. Po importe:
   - Aplikácia sa obnoví s novými dátami.
   - Prehľad a všetky časti sa aktualizujú.

**Výstup scenára:**
- Dáta zálohované a obnovené.

**Prepojenia:**
- Nastavenia ↔ všetky ostatné oblasti (komplexný export/import).

---

## ČASŤ B: CELKOVÁ ŠTRUKTÚRA APLIKÁCIE

### Mapy navigácie

```
┌──────────────────────────────────────────────────────────────┐
│                     COMPAVEN 2.0                             │
│                   (7 hlavných sekcií)                        │
└──────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │   FINANČNÝ PREHĽAD (DASHBOARD)      │
        │  (Domovská obrazovka)               │
        └───────────┬─────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────┬───────────┐
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
    ┌───────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
    │PR/V   │ │MAJ   │ │CIEL  │ │HIS   │ │PLAN  │ │NAV   │
    │       │ │      │ │      │ │      │ │      │ │      │
    └───────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
    
  PR/V = Príjmy a výdavky
  MAJ = Majetok a záväzky
  CIEL = Finančné ciele
  HIS = História a analýzy
  PLAN = Plánovanie
  NAV = Nastavenia
```

### Prepojenia medzi oblasťami

**Príjmy/Výdavky (PR/V):**
- ← Prehľad (vidieť predbežný dopad)
- → Finančný prehľad (aktualizuje K_L)
- → História (záznam transakcií)
- → Finančné ciele (počítanie m)

**Majetok/Záväzky (MAJ):**
- ← Prehľad (vidieť K_nem)
- → Finančný prehľad (aktualizuje K_nem)
- → História (záznam majetku)
- → Príjmy/Výdavky (nájom ako príjem)

**Finančné ciele (CIEL):**
- ← Prehľad (vidieť cieľ)
- ← Príjmy/Výdavky (počítanie m)
- ← Majetok/Záväzky (počítanie K_nem)
- → Prehľad (aktualizuje cieľ)
- → História (história zmien)

**História a analýzy (HIS):**
- ← Príjmy/Výdavky (história transakcií)
- ← Majetok/Záväzky (história majetku)
- ← Finančné ciele (história cieľov)
- → Plánovanie (porovnávanie scenárov)

**Plánovanie (PLAN):**
- ← Historia (porovnávania dáta)
- ↔ Finančné ciele (simulácia parametrov)

**Nastavenia (NAV):**
- ↔ Všetky oblasti (export/import celej aplikácie)

---

## ČASŤ C: PREHĽAD OBRAZOVIEK

### 1. FINANČNÝ PREHĽAD (DASHBOARD)

**Primárny obsah:**
- Kapitál (K_inv, K_cash, K_nem, K_total)
- Cieľ (suma, dátum, scenáre)
- Posledné vyhodnotenie (dátum)
- Predbežný dopad (od posledného vyhodnotenia)

**Navigácia:**
- Tlačidlá: [+ Transakcia] [+ Vyhodnotenie]
- Záložky: [PR/V] [MAJ] [CIEL] [HIS] [PLAN] [NAV]

**Funkcionalita:**
- Bez skrolovania — všetko na jednej obrazovke.
- Kliknutie na sekcii otvorí detailnú oblasť.

---

### 2. PRÍJMY A VÝDAVKY

**Primárny obsah:**
- Tlačidlo: [+ Nová transakcia]
- Zoznam transakcií (posledný mesiac).
- Filtre: Typ, Mesiac.
- Súčty: Príjmy, Výdavky, Sporenie, Investície.
- Predbežný dopad (ak sú nezaložené transakcie).

**Podoblasti:**
- Formulár: Nová transakcia (typ, dátum, suma, zdroj, poznámka).
- História: Všetky transakcie s filtrami.

---

### 3. MAJETOK A ZÁVÄZKY

**Primárny obsah:**
- Tlačidlá: [+ Nový majetok] [+ Nový záväzok]
- Zoznam majetku (typ, hodnota, čistá hodnota ak je s záväzkom).
- Zoznam záväzkov (typ, zostatok, splátka, dátum splatenia).
- Zoznam nájmu (ak sú nehnuteľnosti v prenájme).

**Podoblasti:**
- Formulár: Nový majetok (typ, názov, hodnota, režim).
- Formulár: Nový záväzok (typ, názov, zostatok, sadzba, splátka).

---

### 4. FINANČNÉ CIELE

**Primárny obsah:**
- Parametre: V, p, r, rezerva.
- Cieľová suma (T = V / p).
- Cieľový dátum (n mesiacov od D_L).
- Tri scenáre (opatrný, základný, optimistický).
- Tlačidlo: [Zmeniť parametre]

**Podoblasti:**
- Formulár: Zmeniť parametre.
- Simulácia: Dopad zmeny (bez uloženia).

---

### 5. HISTÓRIA A ANALÝZY

**Primárny obsah:**
- Záložky: [Snapshots] [Transakcie] [Trendy] [Majetok]
- Snapshots: Tabuľka s históriou vyhodnotení (K_L v čase).
- Transakcie: Zoznam s filtrami.
- Trendy: Grafy (mesačné sporenie, kapitál, scenáre).
- Majetok: História zmien majetku a záväzkov.

**Podoblasti:**
- Tlačidlo: [Exportovať dáta] (JSON, CSV, PDF).

---

### 6. PLÁNOVANIE

**Primárny obsah:**
- Tlačidlo: [Nový scenár]
- Zoznam uložených scenárov.
- Porovnanie: Aktuálny vs. simulácia.

**Podoblasti:**
- Formulár: Nový scenár (zmeniť parametre, simulovať).

---

### 7. NASTAVENIA A SPRÁVA ÚDAJOV

**Primárny obsah:**
- Jazyk, motív, notifikácie.
- Tlačidlá: [Exportovať] [Importovať] [Vymazať všetko]
- Informácie: Verzia aplikácie, posledný export.

**Podoblasti:**
- Formulár: Exportovať (výber formátu).
- Formulár: Importovať (výber súboru, náhľad, potvrdenie).

---

## ČASŤ D: HLAVNÉ POUŽÍVATEĽSKÉ SITUÁCIE

### 1. Správne rozhodnutia o finančnom toku

**Situácia:**  
Používateľ zapisuje transakciu a chce vedieť, ako vplýva na cieľ.

**Požiadavka:**
- Predbežný dopad sa zobrazí hneď po zadaní transakcie.
- Dopad sa vypočíta bez uloženia (pracovný kapitál K_pred).
- Text: „Predbežne +2 mesiace" alebo „bez zmeny" alebo „nedostatok hotovosti".

**Implementácia:**
- Formulár → Výpočet dopadu → Zobrazenie textu.

---

### 2. Mesačné vyhodnotenie bez chýb

**Situácia:**  
Koniec mesiaca — používateľ chce aktualizovať K_L (kapitál).

**Požiadavka:**
- Vyhodnotenie sa uloží presne s dátumom D_L.
- Staré vyhodnotenie si možno zapísať znovu (s potvrdením).
- Cieľ sa prepočíta len od nového D_L.

**Implementácia:**
- Formulár vyhodnotenia → Validácia dátumu → Uloženie → Prepočet.

---

### 3. Hypotékarne splátky bez porúch

**Situácia:**  
Používateľ má hypotéku a aplikácia musí vedieť, koľko zarábam/strácam mesiacne.

**Požiadavka:**
- Automatické splácanie bez chýb (špeciálne v scenári D-347).
- Aplikácia počíta splátku mesiac po mesiaci.
- Nájom počúť ako príjem.

**Implementácia:**
- Hypotékarne výpočty v jadre.
- Testy na golden cases (GC-P2-01 až GC-P2-04).

---

### 4. Ochrana údajov pri exporte/importe

**Situácia:**  
Používateľ si chce zálohovať dáta alebo ich preniesť.

**Požiadavka:**
- Export musí obsahovať všetky dáta bez straty.
- Import musí validovať schému a chrániť staré dáta.
- Aplikácia musí pracovať offline bez zmeny.

**Implementácia:**
- Export: JSON so schémou.
- Import: Validácia, náhľad, potvrdenie, zálohá staré dáta.

---

### 5. Plynulý offlinový režim

**Situácia:**  
Používateľ nemá internet a chce pracovať s aplikáciou.

**Požiadavka:**
- PWA: Service Worker cahes aplikáciu.
- Všetky výpočty bežia lokálne.
- Bez API volaní.

**Implementácia:**
- Service Worker + Web App Manifest.
- IndexedDB na ukladanie.

---

## ČASŤ E: PREPOJENIA MEDZI OBLASŤAMI (GRAFICKY)

```
                ┌─────────────────────────────┐
                │  FINANČNÝ PREHĽAD           │
                │  (K, cieľ, dopad)           │
                └────────────┬────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │PR/V      │      │MAJ       │      │CIEL      │
    │(Tok)     │      │(K_nem)   │      │(Cieľ)    │
    └────┬─────┘      └────┬─────┘      └────┬─────┘
         │                 │                 │
         │    ┌────────────┴─────────────┐   │
         │    │                          │   │
         ▼    ▼                          ▼   ▼
    ┌──────────────────────────────────────────┐
    │ HISTÓRIA A ANALÝZY                       │
    │ (Snapshots, transakcie, trendy, majetok) │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ PLÁNOVANIE       │
              │ ("Čo ak" scen.)  │
              └──────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         ▼                            ▼
   ┌──────────────┐         ┌──────────────────┐
   │VŠETKY ZVÄZKY│         │NASTAVENIA        │
   │ (Export)     │         │(Export/Import)   │
   └──────────────┘         └──────────────────┘
```

---

## ČASŤ F: KLÚČOVÉ VLASTNOSTI MVP

### ✅ Musí byť v MVP:

1. **Finančný prehľad** — Všetko na jednej obrazovke.
2. **Príjmy a výdavky** — Transakcie, história.
3. **Majetok a záväzky** — Nehnuteľnosti, hypotéky.
4. **Finančné ciele** — Cieľ, scenáre, dopad.
5. **História a analýzy** — Snapshots, transakcie, trendy, export.
6. **Plánovanie** — Simulácia (bez uloženia do scenárov v MVP).
7. **Nastavenia** — Export/import, jazyk, motív.
8. **Offline prvý** — PWA, IndexedDB, bez API.

### ⏱️ Odsunúť na neskôr (nie MVP):

- Notifikácie (okrem upozornenia na export)
- Integrácia s bankou
- Mobilná aplikácia (natívna)
- Viacmenovosť
- Viacužívateľskosť

---

## ZHRNUTIE SCENÁROV

| Scenár | Primárna oblasť | Prepojenia | Výstup |
|--------|---|---|---|
| 1. Nový užívateľ | Nastavenie + Prehľad | Ciel | Inicializovaná aplikácia |
| 2. Mesačný cyklus | PR/V + Vyhodnotenie | Prehľad, Ciel | Prepočítaný cieľ |
| 3. Majetok/Hypotéka | MAJ | Prehľad, Ciel, HIS | K_nem zahrnutý v cieli |
| 4. Zmena parametrov | CIEL | Prehľad, HIS | Nový cieľ a scenáre |
| 5. Plánovanie | PLAN | CIEL, HIS | Uložený scenár |
| 6. História | HIS | PR/V, MAJ, CIEL | Trendy a export |
| 7. Export/Import | NAV | Všetky | Záloha a obnova |

---

## ĎALŠÍ KROK

1. **Zakladateľ** — Schvaľuje scenáre a obrazovky?
2. **Tím** — Chápete toky a prepojenia?
3. **Po schválení** — Prejdeme na **FÁZU 2: Návrh aplikácie a obrazoviek** (detailné wireframy).

**Bez zmien kódu. Bez commits. Čakáme.**

---

**KONIEC FÁZY 1**
