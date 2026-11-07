# COMPAVEN 2.0 — FÁZA 1: FINÁLNA VERZIA

**Dátum:** 2026-11-07  
**Stav:** Aktualizovaný návrh na schválenie  
**Zmeny:** Integrácia výsledkov kontrol, finančné pravidlá, upresnenia scenárov.

---

## ZMENY OPROTI PÔVODNEJ FÁZE 1

✅ **Integrácia výsledkov kontroly:**
- Finančné pravidlá sú teraz explicitne definované.
- Scenáre sú upresnené o rozdelenie splátok, čisté hodnoty, presun peňazí.
- Dashboard má jasný obsah (trend, sporenie, upozornenia).
- Nastavenia sú rozpísané detailne.

✅ **Nové prvky:**
- Typ transakcie "Presun" (K_cash ↔ K_inv).
- Pravidlá pre rozdelenie úroku a istiny v hypotéke.
- Výpočet čistej hodnoty nehnuteľnosti s nájmom.

✅ **Upresnenia:**
- MVP: Manuálne splátky s automatickým rozdelením (nie amortizácia).
- Plánovanie: Simulácia bez ukladania scenárov.
- Nastavenia: Úplný obsah obrazovky.

---

## ČASŤ A: FINANČNÉ PRAVIDLÁ (NOVÉ)

### 1. Kapitál a jeho zložky

```
KAPITÁL (K) = K_inv + K_cash + K_nem

K_inv   = Investičný kapitál (rastie s výnosom r)
K_cash  = Hotovosť (bez výnosu, 0% reálne)
K_nem   = Čistá hodnota nehnuteľností
        = SUMA(Hodnota nehnuteľnosti − Zostatok hypotéky) pre všetky majetky
```

**Vlastnosti:**
- K sa nemení pri prenosoch medzi vlastnými účtami.
- K sa zvyšuje pri príjmoch a sporení.
- K sa znižuje pri výdavkoch z kapitálu.

---

### 2. Transakcie — Typy a vplyv na K

| Typ | Vzorový vstup | Vplyv na K_cash | Vplyv na K_inv | Vplyv na K_nem | Vplyv na celkový K |
|-----|---|---|---|---|---|
| **Príjem** | Mesačný plat | +2 500 € | — | — | +2 500 € |
| **Výdavok** (z príjmu) | Nákup oblečenia | −100 € (z príjmu, ak ho má) | — | — | 0 (nie z K) |
| **Výdavok** (z hotovosti) | Nákup oblečenia | −100 € | — | — | −100 € |
| **Výdavok** (z investícií) | Nákup oblečenia | — | −100 € | — | −100 € |
| **Sporenie** | Mesačné sporenie | +1 500 € | — | — | +1 500 € |
| **Investícia** (z príjmu) | Nákup akcií | +X € (z príjmu) | — | — | +X € |
| **Investícia** (nákup z hotovosti) | Presun do akcií | −X € | +X € | — | 0 (presun) |
| **Presun** | K_cash → K_inv | −X € | +X € | — | 0 |
| **Splátka hypotéky** | 1 000 € (úrok + istina) | −1 000 € | — | Zmena (istina ↑) | −1 000 € |

**Dôležité:** Splátka hypotéky je **výdavok z hotovosti** (znižuje K_cash a celkový K), ale aplikácia automaticky rozdelí na:
- Úrok (~417 €): Ekonomický náklad.
- Istina (~583 €): Znižuje zostatok hypotéky (zvyšuje K_nem matematicky, ale znižuje K_cash).

---

### 3. Hypotéka — Rozdelenie splátky (MVP)

**Pravidlo:**
Keď používateľ zadá mesačnú splátku, aplikácia **automaticky rozdelí** na:

```
Úrok = (Aktuálny zostatok × Ročná sadzba) / 12
Istina = Splátka − Úrok
Nový zostatok = Starý zostatok − Istina
```

**Príklad:**
```
Vstup: Splátka = 1 000 €
Zostatok: 200 000 €
Sadzba: 2,5 % p.a.

Výpočet:
Úrok = (200 000 × 0,025) / 12 = 416,67 €
Istina = 1 000 − 416,67 = 583,33 €
Nový zostatok = 200 000 − 583,33 = 199 416,67 €

Výstup:
- K_cash znižuje sa o 1 000 € (splátka je výdavok).
- Zostatok hypotéky sa znižuje o 583,33 € (istina).
- K_nem sa zvyšuje o 583,33 € (čistá hodnota rastie).
```

**Dôležité — Čo je v MVP a čo nie:**

✅ **V MVP:**
- Manuálne zadávanie splátky.
- Automatické rozdelenie na úrok a istinu.
- Úprava zostatku hypotéky.

❌ **NIE v MVP (Fáza 2):**
- Automatický splátkový kalendár.
- Generovanie splátok bez manuálneho zápisu.
- Automatické splácanie pri transakciách.

---

### 4. Nájom a čisté peňažné toky

**Pravidlo:**
```
Príjem z nájmu = Mesačný nájom
Náklady na pronájom = Splátka hypotéky + Údržba, dane, iné náklady
Čistý peňažný tok = Príjem − Náklady
Vplyv na mesačné sporenie (m) = Čistý peňažný tok
```

**Príklad:**
```
Nehnuteľnosť: 300 000 €
Hypotéka: 200 000 € (splátka 1 000 €)
Mesačný nájom: 1 500 €
Mesačné ostatné náklady: 200 € (údržba, pojistovňa, dane)

Výpočet:
Príjem = 1 500 €
Náklady = 1 000 € (splátka) + 200 € (ostatné) = 1 200 €
Čistý tok = 1 500 − 1 200 = +300 €

Výstup:
- 300 € ide do mesačného sporenia (m).
- Splátka hypotéky sa zníži zo zostatku 200 000 € (rozdelenie na úrok/istinu).
- K_cash sa zvýši o 300 € (netto príjem).
- K_nem sa zvýši o istinu (časť splátky).
```

---

### 5. Čistá hodnota nehnuteľnosti bez zmien

**Pravidlo:**
Keď sa nehnuteľnosť nebo záväzok nezmení, čistá hodnota ostáva rovnaká.

```
K_nem = V − Z (hodnota mínus záväzky)

Príklad:
V = 300 000 €, Z = 200 000 €, K_nem = 100 000 €

Ak mesiacne príde:
- Splátka: Istina 583,33 € → Z = 199 416,67 €, K_nem = 100 583,33 € (zvýšenie!)
- Nájom: +300 € → K_cash +300 € (bez zmeny K_nem)
```

---

### 6. Presun medzi vlastnými účtami (typ transakcie)

**Nový typ transakcie: "Presun"**

```
Zdroj: K_cash (hotovosť)
Cieľ: K_inv (investície)
Suma: X €

Výstup:
- K_cash znižuje sa o X €
- K_inv sa zvyšuje o X €
- Celkový K zostáva rovnaký
- Predbežný dopad: 0 (bez zmeny)
```

**Iné presúny:**
- K_inv → K_cash (predaj investície)
- K_cash → K_nem (nákup majetku)
- K_nem → K_cash (predaj majetku)

---

### 7. Investície a výnos

**Pravidlo:**
```
K_inv rastie s globálnym reálnym výnosom r (predvolene 3,5 %).
Výnos = K_inv(k) × ((1 + r)^(1/12) − 1) za mesiac k

V MVP:
- Bez sledovania jednotlivých akcií.
- Bez rozdelenia výnosu na dividendy, úroky, apreciáciu.
- Globálny r pre všetky investície.
```

---

### 8. Mesačné sporenie (m) — Výpočet

**Pravidlo:**
```
m = Priemer transakcií typu "Sporenie" a "Investícia" za posledné 12 mesiacov

m = SUMA(Sporenie + Investície za 12 mesiacov) / Počet mesiacov s históriou

Osobitne:
- Spoločné s nájmom: m += Čistý peňažný tok z pronájmu
- Bez príjmov/výdavkov: m = 0
```

---

## ČASŤ B: DETAILNÉ SCENÁRE (UPRAVENÉ)

### Scenár 1: Nový používateľ — Prvá návšteva ✅

Bez zmeny — Zachovaný.

---

### Scenár 2: Mesačný cyklus — Transakcie (UPRAVENÝ)

**Zmeny:**
- Presun z K_cash do K_inv sa teraz nazýva typ transakcie "Presun" (nie "investícia z hotovosti").
- Predbežný dopad presunu: **bez zmeny** (K sa nemení).

**Kroky:**
1. Príjem: +2 500 € (zvyšuje K_cash, žiadny dopad na K pre cieľ).
2. Sporenie: +1 500 € (zvyšuje K_cash, predbežný dopad +1 mesiac).
3. Výdavok: −120 € z príjmu (bez dopadu na K).
4. Presun: 5 000 € z K_cash do K_inv (predbežný dopad: **bez zmeny**).
5. Na konci mesiaca: Vyhodnotenie.

---

### Scenár 3: Majetok — Hypotéka (PODROBNE UPRAVENÝ)

**Nové — Rozdelenie splátky:**

1. Zápis nehnuteľnosti a hypotéky (ako v pôvodnej verzii).

2. **Nový krok — Splátka hypotéky v PR/V:**
   ```
   Typ: Výdavok (splátka)
   Suma: 1 000 €
   Poznámka: "Mesačná splátka hypotéky"
   ```

3. Aplikácia automaticky rozdelí:
   ```
   Úrok: 416,67 € (výdavok)
   Istina: 583,33 € (znižuje zostatok)
   ```

4. Výsledok:
   ```
   K_cash: −1 000 € (splátka je výdavok)
   Zostatok hypotéky: 200 000 − 583,33 = 199 416,67 €
   K_nem: +583,33 € (zvyšuje sa vďaka istine)
   Celkový K: −1 000 € (splátka znižuje kapitál)
   ```

5. Prehľad sa aktualizuje:
   ```
   Kapitál: nezmenený (ale rozdelenie sa zmeniló)
   Zostatok hypotéky: nižší
   K_nem: vyšší (čistá hodnota vzrástla)
   Cieľ: nezmenený (K sa nezmenil, len jeho rozdelenie)
   ```

**Dôležitý poznámka:**
- Splátka hypotéky je **výdavok** (znižuje K_cash a celkový K).
- Ale: Istina zvyšuje čistú hodnotu (K_nem).
- **Čistý efekt:** K klesá o 1 000 €, lebo splátka je peňažný výdavok.

---

### Scenár 4: Zmena parametrov cieľa ✅

Bez zmeny — Zachovaný.

---

### Scenár 5: Plánovanie — Simulácia (UPRAVENÝ)

**Zmena:** V MVP sa scenáre **neukladajú**, iba simulujú.

1. Klik: **[Plánovanie]** → **[Nový scenár]**
2. Aplikácia zobrazí simuláciu.
3. Tlačidlá: **[Zatvoriť]** (bez uloženia).
4. Text: "Simulácia — zmeny sa neukladajú."

**Ukladanie scenárov → Fáza 2.**

---

### Scenár 6: História — Analýzy ✅

Bez zmeny — Zachovaný.

---

### Scenár 7: Nastavenia — Export/Import (PODROBNE ROZŠÍRENÝ)

**Nový obsah obrazovky:**

1. **Preferenčný obsah:**
   - Jazyk: [SK ▼] (SK, EN, DE, ...).
   - Motív: [Svetlý ▼] (Svetlý, Tmavý, Automatický).
   - Notifikácie: [Zapnuté ▼] (Zapnuté, Vypnuté).

2. **Správa údajov:**
   - [Exportovať] — Stiahne JSON súbor s dátumom.
   - [Importovať] — Vyberie súbor, overí schému, zobrazí náhľad, potvrdia.
   - [Vymazať všetko] — S potvrdením "Budú vymazané všetky dáta."

3. **Informácie:**
   - Verzia aplikácie: v1.0.0
   - Posledný export: 2026-11-05 (pred 2 dňami)
   - Počet transakcií: 150
   - Počet vyhodnotení: 12

4. **Pomôcka:**
   - [Návod] — Link na dokumentáciu.
   - [Pomôcka] — FAQ.
   - [Spätná väzba] — Email.

---

## ČASŤ C: DASHBOARD — DETAILNÝ OBSAH

**Nový obsah:**

1. **Kapitál a cieľ** (ako je):
   - Kapitál: 100 000 € (K_inv 60k, K_cash 30k, K_nem 10k)
   - Cieľ: január 2038
   - Scenáre: december 2037 — február 2038

2. **Trend** (NOVÝ):
   ```
   Kapitál za 6 mesiacov:
   └─ Mesiac 1: 90 000 €
   └─ Mesiac 2: 91 500 €
   └─ Mesiac 3: 93 000 €
   └─ Mesiac 4: 94 500 €
   └─ Mesiac 5: 96 000 €
   └─ Mesiac 6: 100 000 € (dnešný stav)
   
   Interpretácia: Kapitál rastie +1 500 € mesiacne (trend ✓)
   ```

3. **Mesačné sporenie (m)** (NOVÝ):
   ```
   Mesačné sporenie: 1 500 € (priemer za 3 mesiace)
   Trend: Stabilný
   ```

4. **Upozornenia** (NOVÝ):
   - "Export bol pred 5 dňami. Zvážte vytvorenie novej zálohy."
   - "Mesačné vyhodnotenie čaká: je 7. november."

5. **Čo teraz?** (NOVÝ — Pomôcka):
   - [+ Zapísať transakciu]
   - [Mesačné vyhodnotenie]
   - [Pozrieť históriu]

---

## ČASŤ D: PREPOJENIA MEDZI OBLASŤAMI (DETAILNE)

```
┌─────────────────────────────────────────────────────────────┐
│              FINANČNÝ PREHĽAD (DASHBOARD)                   │
│         (K, trend, m, upozornenia, pomôcka)                 │
└────────────────┬─────────────────────────┬──────────────────┘
                 │                         │
      ┌──────────┴──────────┐              │
      ▼                     ▼              ▼
┌──────────────┐     ┌──────────────┐ ┌─────────┐
│  PR/V        │     │  MAJ/ZAV     │ │  CIEL   │
│ (Transakcie) │     │ (Majetok,    │ │ (Cieľ,  │
│ (Typ, suma,  │     │  záväzky,    │ │ scenáre)│
│  dopad)      │     │  nájom)      │ │         │
└──┬───────────┘     └──┬───────────┘ └────┬────┘
   │                    │                  │
   │      ┌─────────────┴──────────┐      │
   │      │                        │      │
   └──────┼────────────────────────┼──────┘
          │                        │
          ▼                        ▼
    ┌──────────────────────────────────────┐
    │   HISTÓRIA A ANALÝZY                 │
    │ (Snapshots, transakcie, trendy)      │
    └──────────────┬───────────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  PLÁNOVANIE      │
          │  (Simulácia)     │
          └──────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ┌─────────┐        ┌──────────────┐
    │VŠETKY   │        │NASTAVENIA    │
    │(Export) │        │(Export/Impo) │
    └─────────┘        └──────────────┘
```

---

## ČASŤ E: SEDEM OBRAZOVIEK — FINÁLNY POPIS

| # | Obrazovka | Primárny obsah | Podoblasti |
|---|-----------|---|---|
| 1 | Dashboard | K, trend, m, cieľ, upozornenia | Bez |
| 2 | PR/V | Transakcie, história, filtre, dopad | Nová transakcija, histórie |
| 3 | MAJ/ZAV | Majetok, záväzky, nájom | Nový majetok, nový záväzok |
| 4 | Ciele | Parametre, T, n, scenáre | Zmena parametrov |
| 5 | História | Snapshots, transakcie, trendy, export | Tabuľky, grafy |
| 6 | Plánovanie | Simulácia, výsledok | Nový scenár (bez uloženia) |
| 7 | Nastavenia | Jazyk, motív, export/import, info | Formuláre, potvrdenia |

---

## ČASŤ F: KLÚČOVÉ VLASTNOSTI MVP (FINALIZOVANÉ)

✅ **Musí byť v MVP:**

- Finančný prehľad (K, trend, m, cieľ)
- Príjmy a výdavky (transakcie, história)
- Majetok a záväzky (nehnuteľnosti, hypotéky)
- Finančné ciele (cieľ, scenáre, dopad)
- História a analýzy (snapshots, trendy, export)
- Plánovanie (simulácia bez uloženia)
- Nastavenia (export/import, jazyk, motív)
- Offline prvý (PWA, IndexedDB, bez API)
- Automatické rozdelenie splátok (úrok/istina)

❌ **Odsunúť na Fázu 2+:**

- Uložené scenáre
- Automatický splátkový kalendár
- Notifikácie (mimo Dashboard upozornení)
- Detailné rozdelenie výnosu na investíciách
- Integrácia s bankou (PSD2)

---

## ZÁVER — STATUS FÁZY 1

✅ **Finálne schválené:**
- 7 funkcí oblastí
- 7 detailných scenárov
- 7 obrazoviek
- Finančné pravidlá
- Prepojenia medzi oblasťami
- MVP rozsah

⏳ **Pripravené na schválenie zakladateľa:**
- Rozhodnutia A1–A8 (pozri ďalší dokument)
- Otvorené otázky B1–B5 (pozri ďalší dokument)

---

**FÁZA 1 je pripravená na prechodú do FÁZY 2 (Wireframy).**

**KONIEC FÁZY 1 — FINÁLNA VERZIA**
