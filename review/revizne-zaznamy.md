# Revízny záznam: kódy nálezov a ich stav

Účel: každý kód z recenzií (H, M, L, K, V, S, L) musí mať miesto v dokumentoch alebo v `Decisions.md`. Stav: **uzavreté** = zapracované, **rozhodnuté** = zapísané v `Decisions.md`, **otvorené** = čaká na zakladateľa, **odložené** = backlog.

| Kód | Téma | Stav | Kde |
|---|---|---|---|
| H1 | Výdavky pod prahom sa ukladajú | rozhodnuté | D-030; 04 FR-07 |
| H2 | Záporný K_pred | uzavreté | 04 FR-04; GC-15 (−154) |
| H3 | Okno m do D_L | rozhodnuté | D-031, D-040 |
| H4 | Riziko iOS, plocha | rozhodnuté | D-034, D-035 |
| M1 | Dopad pod 1 mesiac v dňoch | uzavreté | 04 FR-04, FR-06 |
| M2 | Dátum vyhodnotenia nie v budúcnosti | uzavreté | 04 entita Vyhodnotenie |
| M3 | Jedno globálne r | rozhodnuté | D-032 |
| M4 | m v nastaveniach | uzavreté | 04 entita Nastavenie; 05 store settings |
| M5 | Nasporená suma = stav | rozhodnuté | D-033 |
| M6 | Zdroj predvolených r a výberu | rozhodnuté | D-049, D-050, D-051 |
| M7 | Klasifikácia spotreby | odložené (O-7, 1b) | D-038; backlog N-03 |
| M8 | Rozsah prahu podľa cieľa | rozhodnuté | D-048 |
| L1 | Dátum: mesiac a rok, interne orezanie | uzavreté | 04 FR-06; GC-13 |
| L2 | ceil(n − 1e-6) všade | uzavreté | 04 FR-02, 05 §5, 07 §3, §5 |
| L3 | Poradie vetiev FR-02 | uzavreté | 04 FR-02 |
| L4 | Simulácia a K_uzavretý | uzavreté | 07 §2, §4 |
| L5 | Odkaz na princíp 6 v M5 | uzavreté | 06 M5 (FR-16) |
| L6 | Prvé vyhodnotenie a dátum | uzavreté | 04 FR-12; 03 kľúčové toky |
| L7 | „50 rokov“ od D_L | uzavreté | 04 FR-02 |
| K1 | Zaokrúhľovanie dopadu | uzavreté | 04 FR-04; GC-15 (ceil rozdiel) |
| K2 | Uzavretý vzorec pre r = 0 | uzavreté | 07 §4 (K + m·k) |
| V1 | Sadzba pre hotovosť | rozhodnuté | D-036, D-039; 04 FR-02 |
| V2 | Záloha 7 dní, plocha | rozhodnuté | D-035 |
| V3 | Prah a staré znenie | uzavreté | D-012 (upresnené), 01, UR-05 |
| V4 | Prehľad spotreby | rozhodnuté (1b) | D-038 |
| V5 | Rezerva ako typ | rozhodnuté | D-037; 04 typ transakcie |
| V6 | Dane a text pre používateľa | otvorené (dane) | backlog N-02; 00 |
| V7 | D_L, história m | rozhodnuté | D-040, D-031 |
| S1 | Scenáre relatívne k r | uzavreté | 04 FR-03 |
| S2 | Dosiahnutý cieľ a K_pred ≥ T | uzavreté | 04 FR-04 |
| S3 | Predvolený zdroj úhrady | otvorené | 02 riziká; čaká na rozhodnutie |
| S4 | CSP len cez meta tag | uzavreté | 05 §7; 07 §7 |
| S5 | Import a heslo na export | otvorené (heslo) | 05 §4; backlog N-05 |
| S6 | Dátum platí k D_L | uzavreté | 04 FR-02 |
| S7 | Predvyplnenie sumy | odložené | backlog N-04 |
| S8 | Chýbajúce testy | uzavreté | 07 §2 pokrytie |
| S9 | Terminológia „v dôchodku“ | uzavreté | 00, 02, 04 (D-013 ponechané ako história) |
| L8 | Verzia 00, výnos | uzavreté | 00 hlavička; 00 investícia |
| L9 | Tón hlásení | uzavreté | 02, 04, 05, 07 (D-019, D-021 ponechané) |
| L10 | Nedefinované kódy | uzavreté | tento súbor |
| L11 | Vyčerpaný kapitál v tabuľke | uzavreté | 04 §5 |
| RR1 | Výnos na hotovosť (read-only) | uzavreté | D-036; 04 pojmy a FR-02 |
| RR2 | Rezerva dvakrát (ledger vs. kontrola) | rozhodnuté | D-058 (voľba A); GC-19 |
| RR3 | T = V × 27 pri 3,7 % | uzavreté | 00, 04, D-049 (T = V / p) |
| RR4 | Dva texty uplynutého dátumu | uzavreté | D-024, 04 FR-10 |
| RR5 | Počet testov v zadaní | uzavreté | zadanie (63 + 6 E2E) |
| RR6 | GC-21 zaokrúhlenie | uzavreté | 07 GC-21 (1,7 dňa) |
| RR7 | Commit v zadaní | uzavreté | zadanie („alebo novší“) |
| R26 | Nulový a takmer nulový dopad | uzavreté | 04 FR-04; formatImpact; tests/impact.test.ts |
| R26b | Text „cieľ sa nedosiahne“ pri dopade | uzavreté | `UNREACHABLE_IMPACT_TEXT` v `impact.ts`; 04 FR-04 |
| RR8 | Predbežný dopad ignoruje rezervu (V1) | uzavreté | 04 FR-04 K_pred (vklad −, výber +); ledger; GC-24 |
| RR9 | Investícia „z hotovosti“ v K_pred (nový nález) | uzavreté | 04 FR-04 (presun nemení K) |
| RR10 | Prečerpanie K_inv: zamietnutie, alebo orez na 0 s potvrdením (V2) | rozhodnuté | D-059 (orez s potvrdením); UI a FR-08 zosúladené |
| RR11 | Stará definícia rezervy (V3) | uzavreté | 04 §1 Rezerva; D-045, D-047, D-052 označené D-058 |
| RR12 | Rozhodnutý zoznam tvrdí opak FR-07 (V4) | uzavreté | 04 §7: O-2 nahradené D-030 |
| RR13 | Stará formula cieľa × 25 (V5) | uzavreté | 00, 02 (T = V / p, D-049) |
| RR14 | GC-05 a GC-06 nezodpovedajú D-050 (S1) | uzavreté | 07 GC-05 (272), GC-06 (557), GC-23 (363); testy v capital.test.ts |
| RR15 | Počty testov a kategórie (S2) | uzavreté | 07 §2 (70 testov); FR a GC zoznamy zosúladené |
| RR16 | Mazanie: undo, alebo potvrdenie (S3) | uzavreté | D-054 (undo 8 s); 04 FR-09 |
| RR17 | Plocha na iPhone: povinná, alebo nie (S4) | uzavreté | D-042, D-053; 05 §11; D-034 a D-035 označené |
| RR18 | Predvolené hodnoty pri prvom spustení (S5) | uzavreté | D-057 (prázdne polia, výzva); 02 UR-01, 03, 04 FR-12 |
| RR19 | Vklad do rezervy bez zdroja úhrady (S6) | uzavreté | 04 tabuľka transakcií; D-058 |
| RR20 | Zastarané rozhodnutia bez označenia (S7) | uzavreté | D-011, D-019, D-025, D-035, D-039, D-047 označené |
| RR21 | Pravidlá m, m_cash a delenie nulou (S8) | čiastočne | 04 FR-02 (uzavretý tvar iba pri m_cash = 0); 04 m (prvý mesiac, žiadna transakcia). Otázka zákona o odporúčaniach (S9) je samostatná |
| RR22 | Odporúčania a MiFID (S9) | rozhodnuté | D-061; UI a aktívne dokumenty |
| RR23 | Escapovanie textu z poznámky a importu (S10) | uzavreté | 04 FR-18; React zobrazuje text bez HTML |
| RR24 | Hraničné testy 50 rokov a r = 0, m = 0 (N1) | čiastočne | tests: r = 0, m = 0 pri K > 0 → null; hranica 600 mesiacov zatiaľ bez testu |
| RR25 | Hosting ako otvorený (N2) | uzavreté | 05 §11 bod 1; 06 §9 (D-056) |
| RR26 | Otvorené položky už vyriešené (N3) | uzavreté | 04 §7 (O-8 až O-11 presunuté k rozhodnutým) |
| RR27 | UR-12 dve možnosti, FR-03 tri (N4) | uzavreté | 02 UR-12 (tri možnosti, D-045) |
| RR28 | Kódy a zdroje v balíku nie sú definované (N5) | uzavreté | prílohy balíka: tento súbor a poznámky |
| RR29 | Zdroj 3,5 % a 3,7 % (Morningstar 2025) mimo balíka (N6) | otvorené | podklad je v review/o9-podklady.md (príloha balíka); overenie zdroja nie je v repozitári |
| RR30 | Chýba SW cache a interpolácia (R24, R21 z predchádzajúcej evidencie) | otvorené (poznámka) | – |
| RR31 | Vklad do rezervy znižuje cieľový kapitál (V1, S6) | rozhodnuté | D-060; náhľad ukáže vplyv na cieľ |
| RR32 | r pre celý kapitál vs. K_inv (00, UR-03) | rozhodnuté | D-070; 00, 02 |
| RR33 | Signatúry v 05 §5 bez K_inv/K_cash, m_inv/m_cash | uzavreté | 05 §5 |
| RR34 | Tri pravidlá pri prečerpaní; suma nad kapitál bez záznamu | rozhodnuté | D-059, D-066 (poznámka transakcie) |
| RR35 | Predvolená 3,7 % kalibrovaná na 30 rokov | rozhodnuté | D-069; 04 p |
| RR37 | Poplatky vs. MVP | rozhodnuté | D-067; 00, 04 §6 |
| RR38 | Plocha povinná vs. preskočiteľné kroky | rozhodnuté | D-068; 04 FR-12 |