# 08 – Backlog nápadov

> Stav: v0.1 (2026-10-14). Nápady nie sú rozhodnutia. Zapisujú sa na neskoršie spracovanie; zaradenie do milníka a záväzné pravidlá sa urobia v `Decisions.md`, keď sa k nim dospeje.

## N-01 Nehnuteľný majetok (vlastníctvo vs. prenájom)
- **Cieľ:** zakomponovať nehnuteľnosti postupne, každý režim samostatne.
- **Režim vlastníctva:** hodnota nehnuteľnosti (odhad, nie trhová cena), hypotéka (záporná zložka), náklady údržby, daň z nehnuteľnosti.
- **Režim prenájmu:** príjem z nájmu, náklady, neobsadenosť, daň z príjmu z prenájmu.
- **Otázky na neskôr:** patrí vlastný byt do K? Ako sa oceňuje bez trhových dát? Je hypotéka záporný kapitál? Je čistý príjem z nájmu tretia zložka okrem K_inv a K_cash, alebo súčasť sporenia?
- **Súvis:** nehnuteľnosť je tretí typ kapitálu (vedľa K_inv a K_cash, D-036, D-039). Vyžaduje rozšírenie domény, nové entity a pravidlá pre výdavky a príjmy.

## N-02 Daňové režimy investícií a výberu
- **Cieľ:** investície v rôznych daňových režimoch a dane pri výbere.
- **Krok 1 (MVP, navrhnuté):** voliteľné pole „daňový režim“ pri každej investícii, zobrazené a neovplyvňujúce výpočet; upozornenie, že výnos je pred daňou (rozšírenie D-008).
- **Krok 2 (neskôr):** r po dani na investíciu, s pravidlami overenými zdrojom a daňovým poradcom.
- **Výber 4 %:** pravidlo je pred daňou; dane z výberu sa líšia podľa režimu.
- **Súvis:** D-032 (globálne r) sa bude musieť upraviť, ak sa r stane závislé od režimu.

## N-03 Prehľad spotreby: pravidelná vs. cielená
- Odložené do fázy 1b (D-038). Vyžaduje klasifikáciu výdavkov (O-7).

## N-04 Predvyplnenie nasporenej sumy (zaradené do MVP, D-096)
- Pri vyhodnotení predvyplniť K z predchádzajúceho stavu a od D_L pridať sporenie. Znižuje riziko ručného zadávania chyby (recenzia S7).

## N-05 Voliteľné heslo na export (odložené, D-096)
- Export zašifrovaný heslom cez Web Crypto, voliteľný. Nie je to šifrovanie v kľude, ktoré je mimo MVP (D-026). Zmierňuje riziko úniku exportného súboru (recenzia S5).

## N-06 Viac kapitálových typov a daňových režimov v jednom modeli
- Spojí N-01 a N-02: každý typ kapitálu má vlastný režim (zhodnotenie, dane, pravidlá výberu). Architektonický nápad na fázu 2, nie na MVP.
