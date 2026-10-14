# 04 – Funkčné požiadavky (MVP)

> Stav: v0.6 (2026-10-14). Rozsah: MVP, jeden používateľ, webová aplikácia (mobile-first), lokálne ukladanie (D-009, D-012). Odkazy: D-xxx = `decisions/Decisions.md`, UR-xx = `02_User_Requirements.md`, UX = `03_UX_Principles.md`. Označenie **[predpoklad]** = návrh Claude, treba potvrdiť.

## 1. Pojmy a model dát

| Pojem | Definícia |
|---|---|
| **Ročné výdavky (V)** | Odhad celkových ročných výdavkov pri nezávislosti, zadáva používateľ ručne (D-013). |
| **Miera výberu (p)** | Predvolene 4 %, rozsah 3–4 % (D-011). |
| **Cieľová suma (T)** | T = V / p. Pri 4 % je T = V × 25 (D-008). |
| **Kapitál (K)** | Hodnota investícií + nasporená suma (kumulatívny stav hotovosti, D-033), bez rezervy (D-011, D-017). |
| **Reálny výnos (r)** | Ročný výnos po inflácii, predvolene 4 %, rozsah 2–6 % (D-011). Jeden globálny predpoklad pre celý kapitál vrátane hotovosti (D-025, D-032). Počíta sa so všetkými sumami v dnešných cenách. |
| **Mesačné sporenie (m)** | Súčet transakcií typu „sporenie“ a „investícia“ za 12 mesiacov, ktoré končia pri D_L, delený počtom mesiacov histórie (najviac 12) (D-031). Používateľ môže zadať vlastnú hodnotu (UR-02). |
| **Rezerva** | Odporúčanie 3 mesiace výdavkov (rozsah 3–6), mimo cieľa (D-011). |
| **Vyhodnotenie (snapshot)** | Mesačný záznam s dátumom, hodnotou investícií a nasporenou sumou; zadáva sa na konci mesiaca (D-014). |
| **Referenčný dátum (D_L)** | Dátum posledného vyhodnotenia podľa dátumu vyhodnotenia, nie času zápisu (D-044). K_L a m sa vzťahujú k tomuto dňu. Dátum cieľa sa počíta od D_L a mení sa len pri novom vyhodnotení (D-024). |
| **Posledný stav (K_L)** | K zo snapshotu, ktorý je najnovší. Oficiálny cieľ sa počíta z neho, od D_L. |

### Entita Transakcia
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene dnes; nesmie byť v budúcnosti. |
| typ | sporenie / investícia / výdavok / rezerva | áno | Rezerva sa nezapočítava do m ani do K; zobrazí sa ako stav rezervy (D-037). |
| suma | číslo, EUR, > 0 | áno | Na 2 desatinné miesta. |
| zdroj úhrady | z príjmu / z hotovosti / z investícií | áno pri výdavku | Predvolene „z príjmu“ (D-014). Pri sporení a investícii sa nezadáva. |
| poznámka | text, max. 200 znakov | nie | |
| príznak pod prahom | áno/nie | odvodené | Výdavok pod prahom v čase zápisu; uložený a zahrnutý do predbežného dopadu aj prehľadu spotreby (D-030). |

### Entita Vyhodnotenie
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene min(posledný deň mesiaca; dnes). Nesmie byť v budúcnosti (M2). |
| hodnota investícií | číslo ≥ 0 | áno | |
| nasporená suma | číslo ≥ 0 | áno | Kumulatívny stav hotovosti, bez rezervy (D-017, D-033). |

### Entita Nastavenie cieľa
V, p, r, rezerva (mesiace), prah výdavkov, m (odvodené z transakcií, D-031; používateľ môže zadať vlastnú hodnotu), dátum vzniku. Každý parameter má predvolenú hodnotu, odporúčaný rozsah a príznak „zmenený používateľom“ (UR-02).

## 2. Výpočty

### FR-01 – Cieľová suma
T = V / p. Ak V ≤ 0 alebo p ≤ 0, výpočet sa nespustí a zobrazí sa výzva na opravu vstupu.

### FR-02 – Dátum cieľa (počet mesiacov do cieľa)
Výpočet v reálnych hodnotách, mesačné sporenie na konci mesiaca, mesačná sadzba `i = (1 + r)^(1/12) − 1`. Poradie vetiev je záväzné:

1. Ak K_L ≥ T: cieľ je dosiahnutý; dátum = D_L (dátum posledného vyhodnotenia).
2. Ak `K·i + m = 0` (teda K = 0 a m = 0, alebo r = 0 a m = 0): kapitál nerastie, cieľ nie je dosiahnuteľný; zobrazí sa „Pri súčasnom sporení a výnose sa cieľ nedosiahne“ (bez dátumu). Táto vetva musí byť pred vetvou 3 (inak delenie nulou).
3. Ak r = 0 (a m > 0): `n = (T − K) / m`.
4. Inak: `n = ln((T·i + m) / (K·i + m)) / ln(1 + i)`.

Ak m = 0 a r > 0, dátum existuje aj bez sporenia (rastie len výnos), len môže byť veľmi vzdialený (viď O-5).
- Dátum cieľa = D_L + `ceil(n − 1e-6)` mesiacov, orezané na posledný deň cieľového mesiaca (interný výpočet; zobrazuje sa mesiac a rok, FR-06). ε chráni pred chybou pohyblivej desatinnej čiarky (GC-10). Počíta sa z K = K_L a m (D-024).
- Zostávajúci čas = počet mesiacov od dneška do dátumu cieľa; mení sa s časom, dátum nie. Ak dátum uplynul bez vyhodnotenia, zobrazí sa „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“, nie záporný čas (FR-10).
- **Dvojaký kapitál (D-036, D-039, D-041):** K_L = K_inv + K_cash. K_cash sa nezhodnocuje (0 % reálne). Investícia (m_inv) ide do K_inv a zhodnocuje sa; sporenie (m_cash) ide do K_cash bez zhodnotenia (D-041). Ak m_cash > 0, uzavretý tvar nestačí; viď O-11. Cieľ je dosiahnutý, keď K_L ≥ T (teda K_inv ≥ T − K_cash). Vzorce vyššie platia s K := K_inv a T := T − K_cash. Ak K_cash ≥ T, cieľ je dosiahnutý. Hradenie výdavkov z K_inv alebo K_cash je otvorené (O-10).
- **Presun do investícií (D-045):** investícia zadaná so zdrojom „z hotovosti“ presúva sumu z K_cash do K_inv. K sa nemení; mení sa len rozdelenie.
- Výnos medzi vyhodnoteniami sa na K_L nepripisuje; dátum je tak konzervatívny (D-024). Výnos r je jeden globálny predpoklad 4 % pre celý kapitál vrátane hotovosti, nastavuje ho používateľ (D-025, D-032).
- Zobrazený dátum cieľa platí k poslednému vyhodnoteniu (D_L): text „dátum platí k poslednému vyhodnoteniu“ (S6).
- Hranica „viac ako 50 rokov“ sa meria od D_L (D-019 upresnené).

**Overený príklad [predpoklad, na kontrolu]:** V = 24 000 €, K = 100 000 €, m = 500 €, r = 4 %. Dostaneme T = 600 000 €, i ≈ 0,3274 %, n ≈ 334 mesiacov (≈ 27 rokov 10 mesiacov).

### FR-03 – Rozsah dátumov (scenáre)
Tri scenáre sa počítajú rovnakým vzorcom s výnosmi odvodenými od r (D-011, S1):
- opatrný: r − 2 p. b. (dolná hranica 0 %),
- základný: r (nastavené, predvolene 4 %),
- optimistický: r + 2 p. b. (S1: scenáre sú relatívne k r, nie pevné).

Zobrazí sa ako „od – do“ (UX D-016): najskorší (optimistický) až najneskorší (opatrný) dátum. Základný je vyznačený textom, nie samostatným číslom. Všetky tri dátumy sa počítajú od D_L (D-024).

### FR-04 – Predbežný dopad transakcie
Pre každú transakciu po poslednom vyhodnotení sa počíta pracovný kapitál:

`K_pred = max(0; K_L + Σ(sporenie/investícia po D_L) − Σ(výdavky „z kapitálu“ po D_L))`

„Po K_L“ znamená transakcie s **dátumom po D_L** (dátum posledného vyhodnotenia), nie podľa času zadania. Transakcia zadaná neskôr s dátumom pred D_L je už v K_L a nepridáva sa znovu (FR-05).

Dopad = n(K_L) − n(K_pred) (surový rozdiel, nie rozdiel zaokrúhlených dátumov; N1). Ak |dopad| ≥ 1 mesiac, zobrazí sa zaokrúhlene na najbližší celý mesiac (D-014, napr. „predbežne +2 mesiace“). Ak |dopad| < 1 mesiac, zobrazí sa v dňoch (1 mesiac = 30,44 dňa) (napr. „predbežne +4 dni“), aby drobné transakcie (napr. 100 €, cca 0,12 mesiaca) nevyšli ako „bez zmeny“ (M1). Obe n sa počítajú od D_L, takže dopad nezávisí od dnešného dátumu (D-024). Kladné číslo = cieľ bližšie, záporné = ďalej.
- Výsledok sa zobrazí ako krátky text (D-014), napr. „predbežne +2 mesiace“.
- Ak je dopad 0, zobrazí sa „bez zmeny“.
- Pracovný kapitál sa **nepremieta do oficiálneho cieľa**, kým sa neurobí vyhodnotenie.
- Ak K_pred = 0 a m = 0, dopad sa nezobrazuje; zobrazí sa „Hotovosť nestačila; kapitál je 0 €“ a „bez sporenia a výnosu sa cieľ nedosiahne“ (H2).
- Ak K_L ≥ T, dopad sa nezobrazuje; zobrazí sa „cieľ je dosiahnutý“. Ak K_pred ≥ T a K_L < T, zobrazí sa „cieľ je dosiahnutý o X mesiacov skôr“ (S2).

**Príklad:** K_L = 100 000 €, m = 500 €, nová investícia 5 000 € po poslednom vyhodnotení. K_pred = 105 000 €, n klesne z ≈ 334 na ≈ 328 mesiacov → „predbežne 6 mesiacov skôr“.

### FR-05 – Mesačné vyhodnotenie
Vstupy: dátum, hodnota investícií, nasporená suma (kumulatívny stav hotovosti, D-033; UR-11). Výsledok: nový snapshot K_L = hodnota investícií + nasporená suma, prepočet cieľa a dátumov, zobrazenie „Posledné vyhodnotenie: dátum“.

- Transakcie s dátumom ≤ dátum vyhodnotenia sú už zahrnuté v zadaných hodnotách a **nepridávajú sa znovu**.
- Transakcie po dátume vyhodnotenia tvoria nový predbežný dopad (FR-04).
- Prepis predchádzajúceho vyhodnotenia je možný len s potvrdením; história snapshotov sa zachováva.

### FR-06 – Zaokrúhľovanie a formát
Sumy: EUR na celé eurá v zobrazení, 2 desatinné miesta vo vstupe a v uložených dátach. Mesiace: celé čísla; predbežný dopad pod 1 mesiac v dňoch (FR-04). Dátum cieľa: mesiac a rok. Dátumy: slovensky, mesiac slovom (napr. „marec 2038“).

## 3. Správanie a pravidlá

### FR-07 – Prah výdavkov (D-013)
- Prah sa uplatní **len na výdavky**; predvolene 100 € (rozsah 100–500 € je odporúčanie; pravidlo podľa cieľa je otvorené, O-8).
- Výdavok pod prahom sa **uloží** s príznakom „pod prahom“ a zahrnie sa do predbežného dopadu (D-030; ruší D-017 O-2; prehľad spotreby je odložený, D-038).
- Sporenie a investície sa ukladajú vždy bez ohľadu na sumu.

### FR-08 – Zdroj úhrady výdavku (D-014)
- „Z príjmu“: K sa nemení.
- „Z hotovosti“ (K_cash): K_pred sa znižuje o sumu, ale nesmie klesnúť pod rezervu (3 mesiace výdavkov, D-045). Ak by klesol, zobrazí sa upozornenie a ponuka zdroja „z investícií“. Po vyhodnotení sa zohľadní v nasporenej sume.
- „Z investícií“ (K_inv): K_pred sa znižuje o sumu; K_cash sa nemení (D-045).
- Ak je výdavok z kapitálu väčší než K_L, alebo ak súčet výdavkov z kapitálu po D_L presiahne K_L, navrhuje sa upozornenie a ponuka zmeny na „z príjmu“; ak používateľ potvrdí, K_pred = 0 a zobrazí sa „Hotovosť nestačila; kapitál je 0 €“ (D-021 rozšírené na kumulatívny prípad, H2).

### FR-09 – Úprava a mazanie transakcie
- Úprava a mazanie sú možné vždy.
- Ak je dátum transakcie po poslednom vyhodnotení, prepočíta sa len predbežný dopad.
- Ak je dátum pred posledným vyhodnotením, zobrazí sa text: „Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.“
- Mazanie: potvrdenie a možnosť vrátiť späť (krátko po zmazaní), UX princíp 4.

### FR-10 – Vynechané vyhodnotenie (D-016)
- Oficiálny cieľ sa **nemení automaticky**; počíta sa z K_L a D_L. Dátum cieľa sa nemení, kým sa neurobí vyhodnotenie.
- Po uplynutí konca mesiaca bez vyhodnotenia sa zobrazí jemná pripomienka a dátum posledného vyhodnotenia.
- Predbežný dopad sa aj naďalej zobrazuje.

### FR-11 – Pripomienka
- Jedna pripomienka na konci mesiaca (v aplikácii; systémová notifikácia len ak ju používateľ povolí) [predpoklad].
- Vypnuteľná v nastaveniach.

### FR-12 – Prvé nastavenie
Postupnosť: cieľ (V, p, r, rezerva) s predvolenými hodnotami → investícia (aktuálna hodnota, UR-03) → prah → prvé vyhodnotenie. Každý krok sa dá preskočiť a doplniť neskôr; chýbajúce údaje sa zobrazia ako „nezadané“, nie ako nula. Prvé vyhodnotenie nastavuje D_L; kým neexistuje, namiesto dátumu sa zobrazí výzva „urobte prvé vyhodnotenie“ (L6). Pridanie appky na plochu je na iPhone povinné (D-042; pozri D-034, D-035).

### FR-13 – Odporúčania
- Odporúčanie je viditeľne označené a odlíšené od hodnoty používateľa (UR-02).
- Používateľ môže kedykoľvek vrátiť odporúčanú hodnotu jedným úkonom.
- Odporúčania sa týkajú len parametrov (D-007); aplikácia neodporúča produkty.

### FR-14 – Prehľad
Domovská obrazovka: cieľová suma, dátum cieľa ako rozsah (od D_L) a zostávajúci čas od dneška (D-024), predbežný dopad posledných transakcií, dátum posledného vyhodnotenia, tlačidlo na pridanie transakcie.

### FR-15 – História
Zoznam transakcií od najnovšej, filter podľa typu a obdobia, súčty za obdobie. Zobrazenie vyhodnotení (snapshotov) v samostatnej časti (UR-07).

## 4. Dáta, záloha a stav aplikácie

### FR-16 – Lokálne ukladanie (D-009)
- Všetky dáta sa ukladajú v zariadení (v úložisku prehliadača vhodnom na väčšie objemy dát, nie len v malých kľúč-hodnota položkách) [predpoklad, rieši architektúra].
- Žiadne odosielanie dát na server.
- Aplikácia funguje offline po prvom načítaní [predpoklad].

### FR-17 – Export
- Export do jedného súboru (JSON) so všetkými transakciami, vyhodnoteniami a nastaveniami.
- Súbor obsahuje číslo verzie schémy a dátum exportu.
- Aplikácia pri exporte pripomenie, že ide o citlivé finančné údaje.

### FR-18 – Import
- Import načíta súbor, overí verziu schémy a zobrazí náhľad (počet transakcií, vyhodnotení, dátum exportu).
- Import **nahradí** aktuálne dáta až po potvrdení (D-018).
- Neplatný súbor sa neimportuje a nič sa nezmení.
- Neznáme polia sa odmietnu (nie ticho ignorujú), overia sa typy, rozsahy a maximálna veľkosť súboru (návrh: 5 MB; N11, S5).

### FR-19 – Pripomenutie zálohy
Ak neboli exportované dáta viac ako 7 dní (alebo nikdy), zobrazí sa jemná pripomienka v prehľade [predpoklad; D-035: 7 dní kvôli 7-dňovému limitu WebKit pre Safari, H4].

## 5. Chybové a hraničné stavy

| Situácia | Správanie |
|---|---|
| Dátum cieľa uplynul bez vyhodnotenia | „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“; bez záporného zostávajúceho času; dátum sa nepreposúva automaticky (D-024). |
| Cieľ je dosiahnutý (K_L ≥ T) | „Cieľ je dosiahnutý“; dátum = D_L (D-024). |
| Cieľ nie je dosiahnuteľný (bez kapitálu a sporenia) | „Pri súčasnom sporení a výnose sa cieľ nedosiahne“, bez dátumu (D-019). |
| Dátum ďalej ako 50 rokov | „viac ako 50 rokov“ (D-019). |
| Chýbajúce údaje (napr. žiadne vyhodnotenie) | „Nezadané“, nie nula; výpočet pracuje s dostupnými údajmi a uvedie, čo chýba. |
| Záporná hodnota vstupu | Zablokovanie s vecnou správou. |
| Zmena po vyhodnotení | Viď FR-09. |
| Vyčerpaný kapitál (K_pred = 0) | „Hotovosť nestačila; kapitál je 0 €“. Ak je zároveň m = 0, dopad sa nezobrazuje (H2, L4). |
| Úložisko prehliadača plné alebo nedostupné | Jasná správa, dáta sa neprepíšu; ponuka exportu. |
| Prehliadač vymazal dáta | Prázdny stav s výzvou na import zálohy; žiadne tiché obnovy. |

## 6. Mimo rozsahu MVP
- Viacužívateľský režim, účty, synchronizácia na server.
- Integrácie na bankový účet alebo brokera (neskôr, mobilná aplikácia).
- Projekcia podľa výnosu a inflácie v grafe (odložená, D-008).
- Daně, poplatky, viac mien, viac krajín (fáza 2).
- Automatické oceňovanie investícií z trhových dát.

## 7. Rozhodnuté a otvorené otázky
**Rozhodnuté:**
- **O-1 Rezerva:** nie je v kapitáli K ani v cieli (D-017).
- **O-2 Výdavky pod prahom:** sa neukladajú (D-017).
- **O-3 Import zálohy:** nahradí aktuálne dáta po potvrdení (D-018).
- **O-4 Priemer sporenia:** za 12 mesiacov do D_L, delené počtom mesiacov histórie, najviac 12 (D-031; upresňuje D-017).
- **O-5 Veľmi vzdialený dátum:** do 50 rokov, ďalej „viac ako 50 rokov“; bez kapitálu a sporenia text bez dátumu (D-019).
- **O-6 Výdavok z kapitálu väčší než kapitál:** upozornenie a ponuka zmeny na „z príjmu“; pri potvrdení K_pred = 0 a text „Hotovosť nestačila; kapitál je 0 €“ (D-021).

- **Rozhodnuté ďalej (D-030 až D-034):** prah a príznak pod prahom, m = za 12 mesiacov do D_L delené počtom mesiacov, globálne r, nasporená suma je stav, plocha odporúčaná (nie povinná).

**Otvorené:**
- **O-7 Klasifikácia spotreby (M7), odložené do fázy 1b (D-038):** pravidelná vs. cielená spotreba; pravidlo a kategórie treba zadať pred implementáciou prehľadu.
- **O-8 Rozsah prahu podľa cieľa (M8):** 100–500 € je odporúčanie; pravidlo výberu prahu nie je určené.
- **O-11 Výpočet n pri m_cash > 0 (blokuje M1):** uzavretý tvar platí len pre m_cash = 0. Treba určiť iteráciu po mesiacoch a zobrazenie dopadu pod 1 mesiac.
- **O-10 Zdroj úhrady výdavku z kapitálu: vyriešené D-045.**
- **O-9 Zdroj predvolených hodnôt r a miery výberu (M6):** overiť zdrojom a zapísať do Decisions pred M3.
