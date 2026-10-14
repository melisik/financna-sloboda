# 08 – Návrh: určenie výnosovej sadzby r (architektúra)

> Stav: **návrh, bez rozhodnutia** (2026-10-14). Nič z tohto dokumentu nie je v kóde. Rozhodnutia sa zapíšu do `decisions/Decisions.md` až po schválení. [predpoklad] = návrh Claude, treba potvrdiť.

## 1. Čo treba vyriešiť
Výpočet (FR-02, FR-03, FR-04) pracuje s **jedným číslom r** pre investovaný kapitál K_inv (D-032). Otázka je, odkiaľ r pochádza, kto ho určí, ako sa zdôvodní a ako sa zobrazí.

Požiadavky z existujúcich rozhodnutí:
- r je **reálny, pred daňou a poplatkami** (D-050, UR-09).
- Predvolená hodnota **3,5 %** s scenármi ±2 p. b. (D-050); hotovosť je 0 % (D-036).
- Používateľ ju **vidí a môže zmeniť** a je označené, či je predvolená alebo vlastná (UR-02).
- Bez sieťových volaní a bez účtov v MVP (FR-16, D-009).
- Nie je to poradenstvo a neodporúčame produkty (D-007, D-061, 06 §6).

## 2. Možnosti

| Možnosť | Popis | Výhody | Nevýhody |
|---|---|---|---|
| **A. Fixná hodnota** (súčasný stav) | Jedna predvolená hodnota z dokumentu, používateľ ju prepíše. | Jednoduché, transparentné, bez nových údajov. | Predvolená hodnota nemá viditeľné zdôvodnenie v aplikácii; používateľ nevie, čo predpokladá. |
| **B. Odvodenie z mixu** | Používateľ zadá podiely (akcie / dlhopisy / hotovosť), aplikácia vypočíta r = Σ wᵢ·Rᵢ − poplatky. Rᵢ sú verzované predpoklady pre triedy aktív. | Predpoklad je vysvetlený a zdrojovaný; r zostáva jedno číslo pre výpočet. | Viac vstupov; Rᵢ sú sami o sebe odhady a nebezpečne blízko odporúčania aktív (D-007, 06 §6); mení D-032. |
| **C. Trhové dáta** | Aplikácia načíta aktuálne výnosy z API. | Aktuálne čísla. | Porušuje FR-16 a D-009 (sieť, dáta mimo zariadenia); nevhodné pre MVP. **Zamietam.** |
| **D. Scenáre z tabuľky** | Tri hodnoty (opatrná, základná, optimistická) z verzovanej tabuľky, používateľ vyberie. | Rozsah je priamo zdrojovaný. | Ostáva voľba nezdôvodnená; viac UI než A. |

**Odporúčanie (návrh):** **A + vysvetlenie predpokladu**, s možnosťou prechodu na B v neskoršej verzii. Výpočet ostáva jednoduchý (jedno r), predvolená hodnota dostane zdroj, dátum overenia a verziu. Možnosť B nechať na rozhodnutie až po právnom posúdení (06 §6, D-028), lebo odvodenie zo zloženia portfólia sa blíži k odporúčaniu produktu.

## 3. Navrhovaná architektúra (pre A + vysvetlenie)

```
src/domain/assumptions.ts     verzovaná tabuľka predpokladov (hodnota, zdroj, dátum overenia, verzia)
src/domain/goal.ts            r sa použije len cez Settings.realReturn; žiadne nové vzorce
src/storage/types.ts          Settings.realReturn (už existuje) + voliteľné returnSource
src/ui/                       zobrazenie: hodnota, zdroj, dátum overenia, „vlastná hodnota“
```

**Tok dát:**
1. `assumptions.ts` drží predvolenú hodnotu 3,5 % s odkazom na zdroj (`review/o9-podklady.md`), dátumom overenia a verziou tabuľky.
2. Pri prvom nastavení sa hodnota zobrazí ako výzva (D-057), s textom zdroja a rozsahom 2–6 %.
3. Používateľ môže hodnotu prijať alebo zmeniť. Uloží sa `returnSource`: `default` (verzia tabuľky) alebo `manual` (dátum zmeny).
4. Výpočet dostane len číslo `realReturn`; scenáre sú ±2 p. b. (D-050) bez zmeny vzorcov.
5. Zobrazenie vždy ukáže: hodnota, že je predvolená alebo vlastná, dátum overenia zdroja a poznámku „pred daňou a poplatkami“.

**Verzovanie:** pri zmene tabuľky sa `assumptionsVersion` uloží do nastavení. Zmena predvolenej hodnoty nikdy nezmení uložené nastavenie bez súhlasu používateľa; aplikácia len ukáže, že nová verzia existuje.

**Záloha a migrácia:** nové polia sú voliteľné, `schemaVersion` zostáva 1 (rovnaké pravidlo ako pri ostatných voliteľných nastaveniach). Import starej zálohy bez polí použije predvolenú verziu.

## 4. Testy (ak sa schváli)
- Predvolená hodnota z `assumptions.ts` je 3,5 %, zdroj a dátum overenia sú vyplnené (test štruktúry tabuľky).
- Scenáre: r − 2 p. b., r, r + 2 p. b.; r sa neorezáva pod 0 pri scenári opatrný (test hraníc).
- Import zálohy bez `returnSource` zachová predvolenú hodnotu a neprepíše vlastnú.
- Zobrazenie rozlíši predvolenú a vlastnú hodnotu (komponentový test, ak bude RTL).

## 5. Otvorené rozhodnutia pre zakladateľa
1. **Model:** A (fixná hodnota so zdrojom), alebo B (odvodenie z mixu)? Odporúčam A teraz, B až po právnom posúdení.
2. **Zdroj predvolenej hodnoty:** kým nie je overený (RR29), zostáva 3,5 % ako predpoklad s poznámkou [predpoklad]. Potvrdíš, že takto ju môžeme ukázať?
3. **Poplatky:** zadávať ako samostatný vstup p. a. (áno/nie)? Ak áno, r_čisté = r − poplatky; ak nie, dokument hovorí „pred poplatkami“ (súčasný stav).
4. **Reálne vs. nominálne:** zostáva reálne (D-050), alebo prepočítať na nominálne s inflačným predpokladom?
5. **Horizont:** má aplikácia upozorniť, že dlhý horizont (40+ rokov) znižuje bezpečnosť predpokladu? Navrhujem stručnú poznámku v UI.

## 6. Konflikty s existujúcimi dokumentmi
- **D-032** („výnos sa neviaže na jednotlivé investície“): model B by ho zmenil. Model A ho nemení.
- **D-011** (4 % reálne) a **D-025** (4 %): nahradené D-050 (3,5 %). Treba označiť ako upravené.
- **UR-09 a FR-02:** text „predpoklad“ treba doplniť o zdroj a dátum overenia.
- **06 §4 riziko:** „Hotovosť 0 % reálne“ je v poriadku; výnosová sadzba má samostatné riziko (zdroj a overenie), ktoré treba doplniť.
