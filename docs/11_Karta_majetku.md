# 11 – Karta majetku (návrh, Fáza 2)

> Stav: **návrh na diskusiu, bez záväzného rozhodnutia.** Vývoj Fázy 2 môže začať (D-094), kód ide na vetvu `claude/phase2-property-card` a na `main` sa nedostane pred bránou Fázy 2 pre používateľov. Čo je nad rámec tohto návrhu, je predpoklad a označuje sa ako taký. Zmeny sa zapisujú sem; až schválený bod ide do `Decisions.md`.

> **Aktualizácia stavu (2026-10-26, D-323, `docs/60`):** karta majetku je implementovaná a v `main` (D-304), formulár so zbalenými blokmi (D-310). Ostatné aktíva (automobil, práva) sa do kapitálu nepočítajú (D-323). Platí `decisions/Decisions.md`.


## 1. Účel

Karta majetku eviduje nehnuteľnosť a jej čistú hodnotu (D-080), aby ju bolo vidno oddelene od ostatného kapitálu. **V prvej verzii karta nemení dátum cieľa.** Napojenie na výpočet je až v FR-02a a bude samostatný krok.

## 2. Čo karta obsahuje (v1)

| Pole | Typ | Povinné | Zdroj | Poznámka |
|---|---|---|---|---|
| Názov | text | nie | predpoklad | Napr. „byt Bratislava“. Len na orientáciu. |
| Režim | výber: bývam v nej / prenajímam / nezadané | áno | FR-20, D-093 | Predvolene „nezadané“. Režim určuje, či sa hodnota počíta do K (tabuľka v bode 3). |
| Odhad hodnoty (€) | číslo ≥ 0 | áno | FR-21, D-080 | Odhad používateľa, nie trhová cena. |
| Dátum odhadu | RRRR-MM-DD | áno | FR-20, D-089 | Ak je odhad starší ako 12 mesiacov, karta to ukáže ako pripomienku. |
| Zostatok hypotéky (€) | číslo ≥ 0 | nie (predvolene 0) | FR-22 | Len zostatok. Úrok a splátka sú mimo v1 (bod 5). |
| Mesačný nájom (€) | číslo ≥ 0 | nie | FR-23 | Zobrazí sa len pri režime „prenajímam“. Tok sa zatiaľ nepočíta. |

## 3. Výpočet zobrazený na karte

- **Čistá hodnota** = odhad hodnoty − zostatok hypotéky (D-080). Ak je zostatok vyšší ako odhad, zobrazí sa záporná hodnota s upozornením „hypotéka presahuje odhad“.
- **Počíta sa do K?** (predpoklad, D-093):

| Režim | Do K | Ako sa zobrazí |
|---|---|---|
| bývam v nej | nie | zvlášť, ako vlastné bývanie |
| prenajímam | áno (čistá hodnota) | v kapitáli K |
| nezadané | nie | s upozornením „zadaj režim“ |

- Všetky sumy majú nadpis „odhad“, nie „hodnota na trhu“ (FR-21).

## 4. Overenie

- Odhad, zostatok a nájom: číslo, nesmie byť záporné.
- Dátum odhadu: platný dátum, nie v budúcnosti (rovnaké pravidlo ako pri vyhodnotení).
- Režim: len hodnoty z tabuľky vyššie.
- Chybová hláška pomenuje len chýbajúce alebo chybné pole (rovnaké pravidlo ako v Nastaveniach).

## 5. Mimo v1 (nasledujúce kroky)

- Dátum splatenia (FR-22). Úroková sadzba a delenie splátky na úrok a istinu sú od D-100 v karte.
- Daňový režim a daňový scenár (FR-24, FR-25, D-083).
- Vplyv na dátum cieľa (FR-02a, D-092). Karta v prvej verzii nemení žiadny výpočet.
- Automatický odhad zo štatistík (D-089, D-091: Eurostat, dataset a metóda sa ešte overujú).
- Záväzky okrem hypotéky.

## 6. Dáta a záloha (FR-27, FR-28)

- Údaje sú lokálne v IndexedDB, ako ostatné dáta (FR-16). Nikdy sa nedávajú do repozitára; testy používajú len syntetické hodnoty.
- Nová tabuľka „majetok“. Schéma zálohy sa zvýši na **verziu 2** s poľom `properties`.
- Import zálohy verzie 1 (bez `properties`) musí načítať všetko bez straty dát a karta bude prázdna (FR-28).
- Záloha verzie 2 v starej aplikácii sa odmietne. Používa sa už teraz pravidlo z `parseBackup` pre novšiu verziu.
- Šifrovanie exportu je otvorené (D-026, FR-27) a riešia sa pred spustením pre používateľov.

## 7. Konflikty a riziká

- **Navigácia (D-095, D-097, D-099):** nehnuteľnosti nepatria do navigácie MVP. Položka „Majetok“ je možná len na vetve Fázy 2. Na telefóne bude šiesta položka v paneli, ktorý sa dá posúvať. Ak sa to ukáže ako zmätočné, karta môže byť pod Nastaveniami.
- **D-093 vs. FR-21:** rozlíšenie je v režime „bývam v nej“, ktorý nie je v K. Túto otázku treba potvrdiť (otázka 1).
- **Osobné údaje (D-090):** karta obsahuje bydlisko, hodnotu a dlh. Pred spustením pre používateľov je nutné právne posúdenie (brána Fázy 2).
- **Kognitívna záťaž:** tri polia sú povinné (režim, odhad, dátum). Ostatné sú voliteľné. Pri režime „nezadané“ sa neprezentuje žiadny výpočet.
- **Zavádzajúcosť:** odhad bez trhovej ceny môže vyzerať ako presná hodnota. Preto každý údaj nesie označenie „odhad“ a dátum.

## 8. Otvorené otázky pre vlastníka

1. **Vlastníctvo bez bývania a prenájmu** (napr. chata, pozemok): má sa počítať do K, a ak áno, ako samostatný režim?
2. **Režim „nezadané“:** má byť mimo K (ako v tomto návrhu), alebo sa má počítať ako prenájom?
3. **Pripomienka dátumu odhadu:** stačí 12 mesiacov, alebo iná lehota?
4. **Dátum cieľa:** má karta v prvej verzii zostať bez vplyvu (ako je navrhnuté), alebo už má zmeniť dátum?
5. **Navigácia:** šiesta položka „Majetok“ v paneli, alebo karta pod Nastaveniami?

## 9. Predpoklady

- Jeden byt alebo dom na používateľa v prvej verzii. Viac nehnuteľností sa zapisuje ako viac kariet; súčet sa počíta len pre K.
- Odhad zadáva používateľ; aplikácia ho nezisťuje sama.
- Nájom je mesačný a rovnaký každý mesiac.

## 10. Ďalšie karty majetku (návrh, predpoklad)

Vlastník žiada ďalšie typy aktív: **automobil** a **ocenitelné práva**. Obe karty majú len názov, odhad hodnoty a dátum odhadu. Nemajú hypotéku, nájom ani splátky, a bez rozhodnutia sa nepočítajú do K.

| Typ | Polia | Do K | Stav |
|---|---|---|---|
| Automobil | názov, odhad hodnoty (€), dátum odhadu | nie (predpoklad) | návrh |
| Ocenitelné právo | názov (napr. podiel, licencia), odhad hodnoty (€), dátum odhadu | nie (predpoklad) | návrh |

Dôvody predpokladu: vozidlo sa znehodnocuje a nie je investícia (FR-20 eviduje investíciu a nehnuteľnosť, nie vozidlo). Ocenitelné právo nemá v projekte definované pravidlá výnosu ani daňového režimu.

Otvorené otázky:
6. Má sa automobil počítať do K, alebo len zobrazovať zvlášť?
7. Ktoré ocenitelné práva sa majú evidovať (napr. podiel v spoločnosti, licencia, patent)? Pre každé je potrebné samostatné pravidlo ocenenia.
8. Zobrazovať odpisy alebo znehodnotenie automobilu, alebo stačí jednorazový odhad s dátumom?
