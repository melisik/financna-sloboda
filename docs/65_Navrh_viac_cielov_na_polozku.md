# 65 – Návrh: jedna investícia na viac cieľov

> Stav: **schválené a implementované** (2026-10-26, D-334): percentá, zvyšok je „bez cieľa“, staré zálohy sa prevedú. Podnet: test náhľadu zakladateľom: „jednu investíciu viem alokovať len na 1 cieľ; ak mám vyššiu investíciu, potrebujem ju alokovať na viacero cieľov“. Mení D-258 („položka je najviac v jednom cieli“). D-153: bez zmeny výpočtu (ciele sú len zobrazenie, D-258).

## 1. Problém

Dnes má položka investície jedno pole `goalId`. Jedna väčšia investícia (napr. ETF za 20 000 €) sa nedá rozdeliť medzi „Dôchodok“ a „Auto“. Zakladateľ ju musí dať celú do jedného cieľa alebo vôbec.

## 2. Možnosti

| | Ako sa rozdelí | Plus | Mínus |
| --- | --- | --- | --- |
| **A. Percentá** | pri položke podiel pre každý cieľ (napr. 70 % Dôchodok, 30 % Auto); súčet najviac 100 %; zvyšok je „bez cieľa“ | pokrok rastie spolu s hodnotou položky; jednoduché na pochopenie | pri veľkej zmene hodnoty sa podiely nemenia |
| **B. Pevné sumy** | pri položke suma pre každý cieľ (napr. 14 000 € Dôchodok, 6 000 € Auto) | presne to, čo človek myslí („z toho 6 000 € je na auto“) | pri raste alebo páde hodnoty sa rozdelenie rozíde s hodnotou položky (súčet nad hodnotou položky) |
| **C. Pevná suma + zvyšok** | pevné sumy pre všetky ciele okrem jedného, ktorý berie zvyšok | rastie len jeden cieľ | zložitejšie vysvetlenie |

**Odporúčam A (percentá).** Hodnota položky sa mení s trhom a percentá sa tým menia spolu s ňou; súčet nikdy neprekročí hodnotu položky.

## 3. Návrh správania (A)

1. Pri položke: miesto jedného výberu cieľa zoznam cieľov s poľom podielu v % (prázdne = 0). Pod nimi riadok „Bez cieľa: X %“ (zvyšok do 100).
2. Vo formulári cieľa (D-331): pri každej položke zaškrtnutie ako doteraz; po zaškrtnutí pole podielu, predvolene **zvyšok položky** (100 % pri položke bez cieľa). Ak položka patrí už do iného cieľa, ukáže sa jej voľný podiel; presun sa už nerobí automaticky.
3. Pokrok cieľa = súčet (hodnota položky × podiel) cez položky cieľa. Na Prehľade aj v Investíciách sa ukáže ako doteraz („Dôchodok: 14 000 € z 30 000 € · 47 %“); pri rozdelenej položke riadok „ETF: 70 % do cieľa Dôchodok“.
4. Pri zmazaní cieľa sa podiel vráti do „bez cieľa“ (položky ostávajú, ako D-258).
5. Výpočet dátumu cieľa, kapitál a vyhodnotenie sa nemenia.

## 4. Dáta a záloha

- Nové pole `goalShares?: { goalId: string; percent: number }[]` pri položke (percent 1 až 100, celé číslo; súčet najviac 100; goalId jedinečné).
- `goalId` sa **migruje**: položka s `goalId` dostane `goalShares: [{ goalId, percent: 100 }]`, `goalId` sa zruší. Schéma zálohy v16, IndexedDB bez nového úložiska (pole v zázname, upgrade pri načítaní).
- Staršie zálohy (v15 a nižšie) sa načítajú s migráciou; validácia odmietne súčet nad 100 alebo odkaz na neexistujúci cieľ.

## 5. Riziká

- **Kognitívna záťaž:** percentá pri každej položke sú viac polí. Zmiernenie: bežný prípad (jeden cieľ) ostáva ako teraz: zaškrtnutie dá automaticky 100 %; percentá sa ukážu až pri druhom cieli.
- **Migrácia dát:** zmena schémy; zahrnúť test migrácie a obnovy staršej zálohy.
- **Zaokrúhľovanie:** podiely v celých percentách; súčet pokroku môže byť o cent nižší než hodnota položky; zobrazenie v eurách cez `Math.round` rovnako ako inde.

## 6. Postup

1. Test najprv: výpočet podielov, migrácia `goalId` na `goalShares`, validácia, záloha v16.
2. Schéma, úložisko, validácia; potom `groupByGoal` a `goalSummaries` podľa podielov.
3. UI formulára položky a cieľa; E2E (rozdelenie na dva ciele, súčet nad 100 odmietnutý, staršia záloha).
4. `tsc`, `vitest`, celé Playwright; zápis D-číslo, pilotný záznam, `docs/41`.

Odhad: 1 deň.

## 7. Otázky na rozhodnutie

1. **Percentá (A, odporúčam)**, pevné sumy (B), alebo pevná suma + zvyšok (C)?
2. Pri položke bez rozdelenia je **zvyšok „bez cieľa“ (odporúčam)**, alebo má zvyšok automaticky ísť do posledného cieľa?
3. Súhlasíš so zmenou D-258 („najviac v jednom cieli“) a s migráciou starých záloh?

## 8. Doplnenie 2026-10-26 (D-335)

Zakladateľ k otázke 2: nepriradený zvyšok má ísť automaticky do Dôchodku. Implementované ako príznak cieľa „Sem patrí všetko, čo nepatrí do iného cieľa“ (najviac jeden cieľ); bez takého cieľa zostáva zvyšok „bez cieľa“.
