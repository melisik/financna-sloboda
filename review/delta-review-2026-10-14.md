# Zadanie a zoznam zmien pre revíziu (delta od D-029)

Stav: repozitár `main`, commit `3040b67`. Artefakt: https://claude.ai/artifact/8tNBA3fYLT1NCx8yRWycPh, verzia 8 (rovnaký obsah ako `review/review-package-2026-10-14.md`).

## Zadanie pre reviewera

Si nezávislý reviewer dokumentácie produktu. Nie si jej autor. Otvor celý balík `review/review-package-2026-10-14.md` a tento zoznam zmien.

Predchádzajúca recenzia končila pri D-029. Teraz over **len zmeny nižšie** a ich konzistenciu s celým balíkom. Hľadaj:

1. nové protirečenia medzi dokumentmi a `decisions/Decisions.md`,
2. chyby vo vzorcoch a v golden cases GC-13 až GC-16 (over ručne alebo cez NPER: `NPER(i; −m; −K; T; 0)`, kde `i = (1 + r)^(1/12) − 1`),
3. rozhodnutia v texte, ktoré nie sú zapísané v `Decisions.md`,
4. medzery v testovacom pláne (požiadavky bez testu),
5. riziká, ktoré zmeny otvárajú.

Výstup: nálezy zoradené podľa závažnosti (kritický, vysoký, stredný, nízky). Pri každom uveď dokument a sekciu, problém v 1–2 vetách, dôsledok, návrh úpravy a otázku pre zakladateľa, ak ide o rozhodnutie. Nepreprisuj dokumenty celé. Nerozhoduj za zakladateľa.

## Zoznam zmien od D-029 (`870d20e`) do `3040b67`

### Nové rozhodnutia (`Decisions.md`)
- **D-030 Prah:** výdavky pod prahom sa ukladajú s príznakom „pod prahom“, zahrnú sa do predbežného dopadu aj do prehľadu spotreby. Ruší D-017 O-2 v časti o ukladaní.
- **D-031 Mesačné sporenie m:** súčet sporenia a investícií za 12 mesiacov, ktoré končia pri D_L, delený počtom mesiacov histórie (najviac 12). Upresňuje D-017 O-4.
- **D-032 Výnos r:** jeden globálny predpoklad pre celý kapitál. Investícia sa zadáva len hodnotou. Upresňuje UR-03 a D-010.
- **D-033 Nasporená suma:** kumulatívny stav hotovosti, nie prírastok.
- **D-034 Plocha:** pridanie appky na plochu je odporúčané, nie povinné. Overenie na reálnom iPhone pred M2.

### Opravy z predchádzajúcej recenzie (`cbe6feb`, `1cd947d`)
- D-013 upresnený cez D-014 a FR-08 (výdavok znižuje kapitál len ak je hradený z kapitálu).
- Terminológia: „klient“ nahradený „používateľom“ (D-025, 04).
- 05 §7: šifrovanie podľa D-026, nie „na zvážení“.
- GC-10 dopĺňa T; ε v `ceil(n − 1e-6)`; overenie GC presne opísané (NPER len GC-03 a GC-07).
- 06: M1 akceptácia GC-01 až GC-14; FR-06 v M3; UR-09 v M4; odkaz na rozhodnutia oddiel 9.
- 07: testy pre FR-06, FR-11, FR-13, FR-14, FR-15, FR-19 a UR-09.

### Výpočty a pravidlá (`04_Functional_Requirements`)
- **FR-02:** záväzné poradie vetiev: (1) K_L ≥ T, (2) `K·i + m = 0`, (3) r = 0, (4) logaritmus. Vetva 2 je pred vetvou 3 kvôli deleniu nulou. Hranica „viac ako 50 rokov“ sa meria od D_L.
- **FR-04:** `K_pred = max(0; …)`. „Po K_L“ znamená transakcie s dátumom po D_L. Dopad pod 1 mesiac sa zobrazí v dňoch. Ak K_pred = 0 a m = 0, zobrazí sa text o vyčerpaní kapitálu.
- **FR-05:** nasporená suma je kumulatívny stav (D-033).
- **FR-06:** dátum cieľa sa zobrazuje ako mesiac a rok; dopad pod 1 mesiac v dňoch.
- **FR-07:** výdavky pod prahom sa ukladajú s príznakom (D-030). Rozsah 100–500 € je odporúčanie; pravidlo podľa cieľa je otvorené (O-8).
- **FR-08:** vyčerpanie kapitálu aj pri kumulatívnych výdavkoch po D_L (H2).
- **FR-12:** bez prvého vyhodnotenia sa zobrazí výzva „urobte prvé vyhodnotenie“; odporúčanie na plochu (D-034).
- **FR-19:** pripomienka zálohy po **14 dňoch** (predtým 30). *Návrh Claude, zakladateľ hodnotu neschválil.*
- **Entity:** Transakcia má príznak pod prahom. Vyhodnotenie: dátum nesmie byť v budúcnosti, predvolene min(koniec mesiaca; dnes). Nastavenie cieľa obsahuje m (odvodené, prepísateľné). *Návrh Claude, zakladateľ hodnotu neschválil.*
- **Otvorené:** O-7 klasifikácia spotreby (M7), O-8 rozsah prahu (M8), O-9 zdroj predvolených hodnôt r a miery výberu (M6).

### Architektúra (`05_Technical_Architecture`)
- Store `settings`: m (odvodené, prepísateľné). Store `transactions`: príznak pod prahom. Store `snapshots`: dátum ≤ dnes, nasporená suma je kumulatívny stav.
- `monthlySaving(transactions, D_L)`, `targetDate` s `ceil(n − 1e-6)`, `pendingImpact` s clamp a dňami.
- Riziko iOS: rozhodnuté D-034, overenie pred M2.

### Roadmapa (`06_Roadmap`)
- M1 akceptácia: GC-01 až GC-14 plus GC-15 (K_pred ≥ 0) a GC-16 (m pri krátkej histórii).
- M3: zdroj predvolených hodnôt r a miery výberu v Decisions (M6).
- Riziko iOS: vysoké; mitigácie: plocha, overenie pred M2, pripomienka po 14 dňoch.
- Brána Fázy 2: právne posúdenie zahŕňa odporúčania predvolených hodnôt (napr. 3–3,5 % pri skorom odchode).
- Rozhodnutie pred M2: overenie na iPhone (namiesto inštalácie na plochu pred M3).
- M5: odkaz na princíp 6 nahradený FR-16.

### Testy (`07_Testing_Strategy`)
- Pokrytie: FR-06, FR-11, FR-13 až FR-15, FR-19, UR-09; D-030; zobrazenie dopadu v dňoch; M2 dátum vyhodnotenia.
- GC-13: dátum cieľa nezmenený, zobrazený ako august 2054 (interne 2054-08-14), zostáva 332 mesiacov.
- GC-15: K_L = 100 000, dva výdavky po 60 000 € z kapitálu po D_L → K_pred = 0, dopad −154 mesiacov.
- GC-16: tri mesiace sporenia po 500 € → m = 500 (nie 125).
- Invariant: K_uzavretý(k) definovaný; nezápornosť K_pred.
- Checklist iPhone pred M2 (plocha, neaktivita 14 dní).

## Čo zostáva otvorené
- O-7, O-8, O-9 (pozri vyššie).
- Hodnoty 14 dní a m ako prepísateľná hodnota sú návrhy Claude, nie schválené rozhodnutia.
