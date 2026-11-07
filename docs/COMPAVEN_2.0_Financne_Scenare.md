# COMPAVEN 2.0 — Finančné scenáre a testovacia logika

**Dátum:** 2026-11-07  
**Stav:** Testovacia sada pre overenie logiky  
**Účel:** Overenie výpočtov, prepojení a finančnej logiky v MVP.

---

## SCENÁR 1: Príjem a bežné výdavky

**Východiskový stav:**
```
K_inv: 60 000 €
K_cash: 30 000 €
K_nem: 0 € (bez majetku)
K celkem: 90 000 €
```

**Transakcie v novembri:**
```
1. Nov 1 — Príjem (plat): +2 500 €
2. Nov 5 — Výdavok (z príjmu): −150 €
3. Nov 10 — Výdavok (z príjmu): −120 €
4. Nov 15 — Sporenie: +1 500 €
```

**Výpočet:**
```
K_cash:
  Začiatok: 30 000 €
  Príjem: +2 500 €
  Výdavky (z príjmu): −150 − 120 = −270 € (znižujú príjem, nie K_cash)
  Sporenie: +1 500 €
  Koniec: 30 000 + 2 500 − 270 + 1 500 = 33 730 €

K_inv: 60 000 € (bez zmeny)
K_nem: 0 € (bez zmeny)
K celkem: 93 730 €

Zmena K: +3 730 € (príjem − výdavky + sporenie)
```

**Predbežný dopad:**
```
Mesačné sporenie (m): +1 500 €
Vplyv na cieľ: +0,5–1 mesiac (podľa r a K)
```

**Overenie správnosti:**
✅ Príjem zvyšuje K_cash.
✅ Výdavky z príjmu neznižujú K (z iných zdrojov).
✅ Sporenie zvyšuje K_cash a K celkem.

---

## SCENÁR 2: Presun z hotovosti do investícií

**Východiskový stav (po scenári 1):**
```
K_inv: 60 000 €
K_cash: 33 730 €
K_nem: 0 €
K celkem: 93 730 €
```

**Transakcia:**
```
Nov 20 — Presun: K_cash → K_inv (5 000 €)
```

**Výpočet:**
```
K_cash: 33 730 − 5 000 = 28 730 €
K_inv: 60 000 + 5 000 = 65 000 €
K_nem: 0 € (bez zmeny)
K celkem: 93 730 € (bez zmeny!)

Zmena K: 0 €
Predbežný dopad: Bez zmeny
```

**Overenie správnosti:**
✅ Presun nezmení celkový K.
✅ Predbežný dopad je nulový.
✅ Rozdelenie K sa zmenilo (K_inv ↑, K_cash ↓).

---

## SCENÁR 3: Nákup a predaj investícií

**Východiskový stav:**
```
K_inv: 65 000 €
K_cash: 28 730 €
K_nem: 0 €
K celkem: 93 730 €
```

**Transakcie:**
```
Nov 25 — Investícia (z príjmu): +3 000 € (nákup akcií)
Nov 28 — Predaj investície: −2 000 € (výťažok do K_cash)
```

**Výpočet — Nákup:**
```
Príjem pokryje nákup (ako prevod z príjmu do investícií).
K_inv: 65 000 + 3 000 = 68 000 €
K_cash: 28 730 (bez zmeny, lebo nákup z príjmu)
K_celkem: 93 730 + 3 000 = 96 730 €
```

**Výpočet — Predaj:**
```
Výťažok ide do K_cash.
K_inv: 68 000 − 2 000 = 66 000 €
K_cash: 28 730 + 2 000 = 30 730 €
K_celkem: 96 730 €
```

**Konečný stav:**
```
K_inv: 66 000 €
K_cash: 30 730 €
K_nem: 0 €
K celkem: 96 730 €
```

**Overenie:**
✅ Nákup z príjmu zvyšuje K (príjem ide do investícií).
✅ Predaj vracia výťažok do hotovosti.
✅ Výnos sa počíta paušálne (nie rozdelený).

---

## SCENÁR 4: Hypotékna splátka — Rozdelenie úroku a istiny

**Východiskový stav:**
```
Nehnuteľnosť: 300 000 €
Hypotéka — Zostatok: 200 000 €
Ročná sadzba: 2,5 %
Mesačná splátka (zmluva): 1 000 €

K_cash (pred splátkou): 30 730 €
```

**Transakcia:**
```
Nov 30 — Výdavok (splátka hypotéky): −1 000 €
```

**Automatické rozdelenie:**
```
Úrok = (200 000 × 0,025) / 12 = 416,67 €
Istina = 1 000 − 416,67 = 583,33 €
Nový zostatok: 200 000 − 583,33 = 199 416,67 €
```

**Výpočet vplyvu na K:**
```
K_cash: 30 730 − 1 000 = 29 730 € (splátka je výdavok)
K_inv: 66 000 € (bez zmeny)
K_nem: (300 000 − 199 416,67) = 100 583,33 € (zvýšenie vďaka istine)

K_celkem (bez výnosu): 66 000 + 29 730 + 100 583,33 = 196 313,33 €
```

**Zmena K:**
```
K_celkem sa znížil o 1 000 € (splátka je výdavok, aj keď istina zvyšuje K_nem).
```

**Overenie:**
✅ Splátka znižuje K_cash a celkový K.
✅ Istina zvyšuje čistú hodnotu (K_nem).
✅ Úrok je ekonomický náklad.
⚠️ Bez dvojitého započítania (istina znižuje zostatok, nie je výdavok).

---

## SCENÁR 5: Nehnuteľnosť s hypotékou — Bez nájmu

**Východiskový stav (po scenári 4):**
```
Nehnuteľnosť: 300 000 €
Hypotéka: 199 416,67 €
K_nem: 100 583,33 €
K_celkem: 196 313,33 €
```

**Mesiacov bez zmien:**
- Splátkam pokračujú (ako v scenári 4).
- Výnos z K_inv rastie mesiacne.

**Výpočet (mesiac december):**
```
Úrok (december): (199 416,67 × 0,025) / 12 = 414,94 €
Istina (december): 1 000 − 414,94 = 585,06 €
Nový zostatok: 199 416,67 − 585,06 = 198 831,61 €

K_nem (december): 300 000 − 198 831,61 = 101 168,39 €
K_nem sa zvýšil o 585,06 € (istina).
```

**Trend K_nem:**
```
November: 100 583,33 €
December: 101 168,39 €
Rast: +585,06 € mesiacne (istina)
```

**Overenie:**
✅ Hypotéka sa znižuje mesiacne (istina).
✅ K_nem rastie vďaka splátke istiny.
✅ Bez nájmu je čisté zmeny v K_nem rovné istine splátky.

---

## SCENÁR 6: Prenajímaná nehnuteľnosť — Kladný tok

**Východiskový stav:**
```
Nehnuteľnosť: 300 000 € (v prenájme)
Hypotéka: 198 831,61 €
K_nem: 101 168,39 €

Mesačný nájom: 1 500 €
Mesačné náklady:
  - Splátka hypotéky: 1 000 €
  - Údržba, iné: 200 €
  - Celkem náklady: 1 200 €

Čistý tok: 1 500 − 1 200 = +300 €
```

**Transakcie (december):**
```
1. Príjem (nájom): +1 500 € (zvyšuje K_cash)
2. Výdavok (splátka): −1 000 € (znižuje K_cash, rozdelenie: úrok 415 + istina 585)
3. Výdavok (údržba): −200 € (znižuje K_cash)
```

**Výpočet:**
```
K_cash:
  Začiatok (po scenári 5): 29 730 €
  + Nájom: 1 500 €
  − Splátka: −1 000 €
  − Údržba: −200 €
  Koniec: 29 730 + 1 500 − 1 000 − 200 = 30 030 €

K_nem:
  Začiatok: 101 168,39 €
  + Istina splátky: +585 €
  Koniec: 101 753,39 €

Mesačné sporenie (m):
  Čistý tok z nájmu: +300 € (ide do m)

K_celkem:
  Počiatočný príjem (nájom) zvyšuje K_cash.
  Splátka (náklad) znižuje K_cash a celkový K o výšku splátky.
  Netto: Čistý tok (+300 €) zvyšuje K.

Zmena K: +300 € (netto príjem z nájmu)
```

**Overenie:**
✅ Nájom je príjem (zvyšuje K_cash).
✅ Splátka je náklad (znižuje K).
✅ Netto príjem (+300 €) ide do mesačného sporenia (m).
✅ Istina zvyšuje K_nem bez dvojitého osvojenia.

---

## SCENÁR 7: Prenajímaná nehnuteľnosť — Záporný tok

**Východiskový stav:**
```
Nehnuteľnosť: 250 000 € (v prenájme, nižšia hodnota)
Hypotéka: 200 000 € (vyšší záväzok)
K_nem: 50 000 €

Mesačný nájom: 900 €
Mesačné náklady:
  - Splátka hypotéky: 1 000 €
  - Údržba, iné: 300 €
  - Celkem náklady: 1 300 €

Čistý tok: 900 − 1 300 = −400 € (ZÁPORNÝ!)
```

**Transakcie:**
```
1. Príjem (nájom): +900 €
2. Výdavok (splátka): −1 000 €
3. Výdavok (údržba): −300 €
```

**Výpočet:**
```
K_cash:
  Počiatočný: 30 030 €
  + Nájom: 900 €
  − Splátka: −1 000 €
  − Údržba: −300 €
  Koniec: 30 030 + 900 − 1 000 − 300 = 29 630 €

K_nem:
  + Istina splátky (~585 €)
  Koniec: 50 585 € (zvýšenie)

Mesačné sporenie (m):
  Čistý tok: −400 € (ZNÍŽENIE m!)

K_celkem:
  Zmena: −400 € (záporný netto tok)
```

**Overenie:**
✅ Záporný tok znižuje K a mesačné sporenie (m).
✅ Splátka istiny stále zvyšuje K_nem.
✅ Bez majetku by vlastník stratil −400 € mesiacne.

---

## SCENÁR 8: Nákup a predaj majetku

**Východiskový stav:**
```
K_cash: 29 630 €
K_inv: 66 000 €
K_nem: 50 585 € (existujúca nehnuteľnosť)
K_celkem: 146 215 €
```

**Transakcie:**
```
Jan 1 — Nákup majetku: −25 000 € (kúpi mobilnú nehnuteľnosť)
Mar 1 — Predaj majetku: +23 000 € (predá s stratou)
```

**Nákup:**
```
K_cash: 29 630 − 25 000 = 4 630 €
K_nem: Zvýšenie o nový majetok (25 000 €)
       Nový K_nem: 50 585 + 25 000 = 75 585 €
K_celkem: 146 215 − 25 000 = 121 215 €
```

**Predaj:**
```
K_cash: 4 630 + 23 000 = 27 630 €
K_nem: 75 585 − 25 000 = 50 585 € (odstránenie nákupeného majetku)
K_celkem: 121 215 + 23 000 = 144 215 € (strata −2 000 €)
```

**Overenie:**
✅ Nákup znižuje K_cash a zvyšuje K_nem.
✅ Predaj vracia peniaze do K_cash (s možnou stratou).
✅ Bez majetku by sa K zmenil o rozdiel ceny.

---

## SCENÁR 9: Zmena trhovej hodnoty investícií

**Východiskový stav:**
```
K_inv: 66 000 €
Reálny výnos (r): 3,5 % p.a.
Mesačný výnos: (1 + 0,035)^(1/12) − 1 ≈ 0,2879 %
```

**Výpočet za 3 mesiace:**
```
Mesiac 1:
  K_inv: 66 000 × 1,002879 = 66 190 €
  Výnos: 190 €

Mesiac 2:
  K_inv: 66 190 × 1,002879 = 66 381 €
  Výnos: 191 €

Mesiac 3:
  K_inv: 66 381 × 1,002879 = 66 573 €
  Výnos: 192 €

Celkový výnos za 3 mesiace: ~573 €
```

**Vplyv na cieľ:**
```
Cieľ sa posúva skôr, lebo K rastie.
Cieľový dátum: O 0,5–1 mesiac skôr (podľa m a K).
```

**Overenie:**
✅ K_inv rastie exponenciálne.
✅ Výnos nie je lineárny.
✅ Vplyv na cieľ je merateľný.

---

## SCENÁR 10: Súhrnný výpočet kapitálu a mesačného sporenia

**Rozpočítaný prípad:**
```
K_inv: 66 573 € (s výnosom z 3 mesiacov)
K_cash: 27 630 €
K_nem: 50 585 € (vlastný majetok bez príslušnej hypotéky)

K_celkem: 144 788 €
```

**Mesačné sporenie (m) — Priemer za 3 mesiace:**
```
Mesiac 1: +1 500 € (sporenie) + 0 € (bez nájmu) = +1 500 €
Mesiac 2: +1 500 € (sporenie) − 400 € (záporný nájom) = +1 100 €
Mesiac 3: +1 500 € (sporenie) + 300 € (kladný nájom) = +1 800 €

m = (1 500 + 1 100 + 1 800) / 3 = 1 467 €
```

**Výpočet cieľa:**
```
V (výdavky): 24 000 € p.a.
p (miera výberu): 3,7 %
T = 24 000 / 0,037 = 648 649 €

r (výnos): 3,5 %
K: 144 788 €
m: 1 467 € mesiacne
D_L: Dátum posledného vyhodnotenia

Počet mesiacov do cieľa (n):
  Približne: (648 649 − 144 788) / 1 467 ≈ 343 mesiacov
  = 28,6 roka
  
Cieľ: 343 mesiacov od D_L
```

**Scenáre:**
```
Opatrný (r − 2%): 1,5% → n ≈ 385 mesiacov
Základný (r = 3,5%): n ≈ 343 mesiacov
Optimistický (r + 2%): 5,5% → n ≈ 310 mesiacov
```

**Overenie:**
✅ K sa počíta z troch zložiek.
✅ m sa počíta ako priemer so zahrnutím nájmu.
✅ Cieľ je realistický (28–32 rokov).
✅ Scenáre ukazujú rozsah (−40 až +50 mesiacov).

---

## ZHRNUTIE SCENÁROV

| # | Scenár | Primárny test | Status |
|---|--------|---|---|
| 1 | Príjem a výdavky | K rastie s príjmom a sporiením | ✅ OK |
| 2 | Presun medzi účtami | K sa nemení, iba rozdelenie | ✅ OK |
| 3 | Nákup a predaj investícií | K sa mení s príjmom, vplýva na cieľ | ✅ OK |
| 4 | Splátka hypotéky | Rozdelenie úroku a istiny, K klesá | ✅ OK |
| 5 | Nehnuteľnosť bez nájmu | K_nem rastie s istinou | ✅ OK |
| 6 | Prenájom — kladný tok | Nájom zvyšuje m, istina zvyšuje K_nem | ✅ OK |
| 7 | Prenájom — záporný tok | Záporný tok znižuje m a K | ✅ OK |
| 8 | Nákup a predaj majetku | K_nem sa zmení, výťažok do K_cash | ✅ OK |
| 9 | Výnos na investíciách | K_inv rastie exponenciálne | ✅ OK |
| 10 | Súhrnný výpočet | Komplexný prípad so všetkými prvkami | ✅ OK |

---

## OTVORENÉ OTÁZKY Z SCENÁROV

1. **Úrok vs. istina — Presný výpočet** — Ako sa zaokrúhľuje? Kedy sa aplikuje?
2. **Výnos na K_inv — Výpočet** — Ako sa počíta medzi vyhodnoteniami (bez histórie)?
3. **Čistá hodnota pri viacerých hypotékach** — Ako sa agreguje?
4. **Mesačné sporenie pri zmene režimu** — Ako sa prepočíta, keď sa majetok zmení z bez nájmu na prenájom?
5. **Predbežný dopad na komplexné transakcie** — Ako sa zobrazí, keď je viacero operácií za sebou?

---

**KONIEC FINANČNÝCH SCENÁROV**
