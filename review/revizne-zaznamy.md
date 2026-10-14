# Revízny záznam: kódy nálezov a ich stav

Účel: každý kód z recenzií (H, M, L, K, V, S, L) musí mať miesto v dokumentoch alebo v `Decisions.md`. Stav: **uzavreté** = zapracované, **rozhodnuté** = zapísané v `Decisions.md`, **otvorené** = čaká na zakladateľa, **odložené** = backlog.

| Kód | Téma | Stav | Kde |
|---|---|---|---|
| H1 | Výdavky pod prahom sa ukladajú | rozhodnuté | D-030; 04 FR-07 |
| H2 | Záporný K_pred | uzavreté | 04 FR-04; GC-15 (−155) |
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
| L1 | Verzia 00, výnos | uzavreté | 00 hlavička; 00 investícia |
| L2 | Tón hlásení | uzavreté | 02, 04, 05, 07 (D-019, D-021 ponechané) |
| L3 | Nedefinované kódy | uzavreté | tento súbor |
| L4 | Vyčerpaný kapitál v tabuľke | uzavreté | 04 §5 |
| RR1 | Výnos na hotovosť (read-only) | uzavreté | D-036; 04 pojmy a FR-02 |
| RR2 | Rezerva dvakrát (ledger vs. kontrola) | rozhodnuté | D-058 (voľba A); GC-19 |
| RR3 | T = V × 27 pri 3,7 % | uzavreté | 00, 04, D-049 (T = V / p) |
| RR4 | Dva texty uplynutého dátumu | uzavreté | D-024, 04 FR-10 |
| RR5 | Počet testov v zadaní | uzavreté | zadanie (63 + 6 E2E) |
| RR6 | GC-21 zaokrúhlenie | uzavreté | 07 GC-21 (1,7 dňa) |
| RR7 | Commit v zadaní | uzavreté | zadanie („alebo novší“) |
| R26 | Nulový a takmer nulový dopad | uzavreté | 04 FR-04; formatImpact; tests/impact.test.ts |
| R26b | Text „cieľ sa nedosiahne“ pri dopade | uzavreté | `UNREACHABLE_IMPACT_TEXT` v `impact.ts`; 04 FR-04 |
