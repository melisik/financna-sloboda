# 04 – Funkčné požiadavky (MVP)

> Stav: v0.6 (2026-10-14). Rozsah: MVP, jeden používateľ, webová aplikácia (mobile-first), lokálne ukladanie (D-009, D-012). Odkazy: D-xxx = `decisions/Decisions.md`, UR-xx = `02_User_Requirements.md`, UX = `03_UX_Principles.md`. Označenie **[predpoklad]** = návrh Claude, treba potvrdiť.

## 1. Pojmy a model dát

| Pojem | Definícia |
|---|---|
| **Ročné výdavky (V)** | Odhad celkových ročných výdavkov pri nezávislosti, zadáva používateľ ručne (D-013). |
| **Miera výberu (p)** | Predvolene 3,7 %, rozsah 3–4 % (D-011, D-049). Hodnota je kalibrovaná na 30-ročný horizont; pri dlhšom horizonte je menej istá (D-065). |
| **Cieľová suma (T)** | T = V / p. Pri 3,7 % je T ≈ V × 27,03 (D-049), napr. pre V = 24 000 € je T = 648 649 €; pri 4 % je T = V × 25 (D-008). |
| **Kapitál (K)** | Hodnota investícií + nasporená suma (kumulatívny stav hotovosti, D-033), bez rezervy (D-011, D-017). |
| **Reálny výnos (r)** | Ročný výnos po inflácii, predvolene 3,5 %, rozsah 2–6 % (D-011, D-050). Jeden predpoklad pre investovaný kapitál K_inv; hotovosť K_cash sa nezhodnocuje, 0 % reálne (D-036, upresňuje D-025 a D-032). Počíta sa so všetkými sumami v dnešných cenách. Zobrazuje sa aj nominálne (D-063, π = 2 % [predpoklad]); poplatky sa odpočítavajú od r (D-064); pri horizonte nad 20 rokov poznámka (D-065). |
| **Mesačné sporenie (m)** | Súčet transakcií typu „sporenie“ a „investícia“ za 12 mesiacov, ktoré končia pri D_L, delený počtom mesiacov histórie (najviac 12) (D-031). Používateľ môže zadať vlastnú hodnotu (UR-02). |
| **Rezerva** | Východisková hodnota 3 mesiace výdavkov (rozsah 3–6), mimo K (D-011). Vklad do rezervy znižuje kapitál pre cieľ a výber ho zvyšuje (D-060). Stav = vklady mínus výbery (D-047). Rezerva nie je v K ani hranicou výdavkov: vklad berie z K_cash, výber ju dopĺňa (D-058; upravuje D-045, D-047, D-052). |
| **Vyhodnotenie (snapshot)** | Mesačný záznam s dátumom, hodnotou investícií a nasporenou sumou; zadáva sa na konci mesiaca (D-014). |
| **Referenčný dátum (D_L)** | Dátum posledného vyhodnotenia podľa dátumu vyhodnotenia, nie času zápisu (D-044). K_L a m sa vzťahujú k tomuto dňu. Dátum cieľa sa počíta od D_L a mení sa len pri novom vyhodnotení (D-024). |
| **Posledný stav (K_L)** | K zo snapshotu, ktorý je najnovší. Oficiálny cieľ sa počíta z neho, od D_L. |

### Entita Transakcia
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene dnes; nesmie byť v budúcnosti. |
| typ | sporenie / investícia / výdavok / rezerva (vklad) / výber z rezervy | áno | Rezerva nie je v K ani v m; stav = vklady mínus výbery (D-037, D-047). |
| suma | číslo, EUR, > 0 | áno | Na 2 desatinné miesta. |
| zdroj úhrady | z príjmu / z hotovosti / z investícií | áno pri výdavku a investícii | Predvolene „z príjmu“ (D-014). Pri investícii „z hotovosti“ ide o presun (D-045). Pri sporení a vklade do rezervy sa nezadáva; vklad sa berie z K_cash (D-058). |
| poznámka | text, max. 200 znakov | nie | |
| príznak pod prahom | áno/nie | odvodené | Výdavok pod prahom v čase zápisu; uložený a zahrnutý do predbežného dopadu aj prehľadu spotreby (D-030). |

### Entita Vyhodnotenie
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene min(posledný deň mesiaca; dnes). Nesmie byť v budúcnosti (M2). |
| hodnota investícií | číslo ≥ 0 | áno | |
| nasporená suma | číslo ≥ 0 | áno | Kumulatívny stav hotovosti, bez rezervy (D-017, D-033). |

### Entita Nastavenie cieľa
V, p, r, rezerva (mesiace), prah výdavkov, m (odvodené z transakcií, D-031; používateľ môže zadať vlastnú hodnotu). Ak v 12-mesačnom okne pred D_L nie je žiadna transakcia sporenia alebo investície, m = 0; čiastočný prvý mesiac histórie sa počíta ako celý mesiac (D-031), dátum vzniku. Každý parameter má predvolenú hodnotu, východiskový rozsah a príznak „zmenený používateľom“ (UR-02).

## 2. Výpočty

### FR-01 – Cieľová suma
T = V / p. Ak V ≤ 0 alebo p ≤ 0, výpočet sa nespustí a zobrazí sa výzva na opravu vstupu. Ak V, p alebo r chýba (prvé spustenie, prázdne polia, D-057), cieľ sa nepočíta a Prehľad vyzve na nastavenie. Ak r nie je zadané, výpočet sa nespustí. Bez histórie transakcií pre m je m = 0 (D-031, V2).

### FR-02 – Dátum cieľa (počet mesiacov do cieľa)
Výpočet v reálnych hodnotách, mesačné sporenie na konci mesiaca, mesačná sadzba `i = (1 + r)^(1/12) − 1`. Poradie vetiev je záväzné:

1. Ak K_L ≥ T: cieľ je dosiahnutý; dátum = D_L (dátum posledného vyhodnotenia).
2. Ak `K·i + m = 0` (teda K = 0 a m = 0, alebo r = 0 a m = 0): kapitál nerastie, cieľ nie je dosiahnuteľný; zobrazí sa „Pri súčasnom sporení a výnose sa cieľ nedosiahne“ (bez dátumu). Táto vetva musí byť pred vetvou 3 (inak delenie nulou).
3. Ak r = 0 (a m > 0): `n = (T − K) / m`.
4. Inak: `n = ln((T·i + m) / (K·i + m)) / ln(1 + i)`.

Ak m = 0 a r > 0, dátum existuje aj bez sporenia (rastie len výnos), len môže byť veľmi vzdialený (viď O-5).
- Dátum cieľa = D_L + `ceil(n − 1e-6)` mesiacov, orezané na posledný deň cieľového mesiaca (interný výpočet; zobrazuje sa mesiac a rok, FR-06). ε chráni pred chybou pohyblivej desatinnej čiarky (GC-10). Počíta sa z K = K_L a m (D-024).
- Zostávajúci čas = počet mesiacov od dneška do dátumu cieľa; mení sa s časom, dátum nie. Ak dátum uplynul bez vyhodnotenia, zobrazí sa „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“, nie záporný čas (FR-10).
- **Dvojaký kapitál (D-036, D-039, D-041):** K_L = K_inv + K_cash. K_cash sa nezhodnocuje (0 % reálne). Investícia (m_inv) ide do K_inv a zhodnocuje sa; sporenie (m_cash) ide do K_cash bez zhodnotenia (D-041). Uzavretý tvar (vzorec FR-02) platí len pri m_cash = 0, lebo vtedy je celé m v K_inv a zhodnocuje sa. Ak m_cash > 0, n sa počíta iteráciou po celých mesiacoch a zlomok interpoláciou (D-046). Cieľ je dosiahnutý, keď K_L ≥ T (teda K_inv ≥ T − K_cash). Vzorce vyššie platia s K := K_inv a T := T − K_cash. Ak K_cash ≥ T, cieľ je dosiahnutý. Hradenie výdavkov z K_inv alebo K_cash je otvorené (O-10).
- **Presun do investícií (D-045):** investícia zadaná so zdrojom „z hotovosti“ presúva sumu z K_cash do K_inv. K sa nemení; mení sa len rozdelenie. Presun je obmedzený na K_cash (D-058).
- Výnos medzi vyhodnoteniami sa na K_L nepripisuje; dátum je tak konzervatívny (D-024). Výnos r je jeden predpoklad (predvolene 3,5 %, D-050) pre investovaný kapitál K_inv, nastavuje ho používateľ (D-025, D-032); hotovosť K_cash je bez výnosu (D-036).
- Zobrazený dátum cieľa platí k poslednému vyhodnoteniu (D_L): text „dátum platí k poslednému vyhodnoteniu“ (S6).
- Hranica „viac ako 50 rokov“ sa meria od D_L (D-019 upresnené).

**Overený príklad [predpoklad, na kontrolu]:** V = 24 000 €, K = 100 000 €, m = 500 €, r = 4 %. Dostaneme T = 600 000 €, i ≈ 0,3274 %, n ≈ 334 mesiacov (≈ 27 rokov 10 mesiacov).

### FR-02a – Nehnuteľnosť v K (Fáza 2, D-080, D-091, D-092)

> Platí len po zavedení Fázy 2 (D-086). MVP nepoužíva tento odsek. Pre MVP zostáva FR-02 podľa vyššie uvedených vetiev.

Pri nehnuteľnosti sa K_L rozšíri o tretí člen, čistú hodnotu nehnuteľnosti. Výpočet sa robí po mesiacoch od D_L (k = 0, 1, 2, …):

- `K_inv(k) = K_inv·(1+i)^k + m_inv·((1+i)^k − 1)/i`, kde `i = (1+r)^(1/12) − 1` (ako vyššie).
- `K_cash(k) = K_cash(k−1) + m_cash + N − p(k)`, kde `N` je čistý nájom po nákladoch, `P` je aktuálna splátka hypotéky podľa zmluvy (D-084) a `p(k)` je splátka v mesiaci `k`: `P`, kým hypotéka nie je splatená, inak `0` (D-087, nález T1).
- `K_nem(k) = V − Z(k)`, kde `V` je odhad hodnoty nehnuteľnosti (D-089) a `Z(k)` je zostatok hypotéky:
  `Z(k) = Z0·(1+i_h)^k − P·((1+i_h)^k − 1)/i_h`, `i_h` je reálna mesačná úroková sadzba. Pri `i_h = 0` platí `Z(k) = Z0 − P·k`.
- `K_L(k) = K_inv(k) + K_cash(k) + K_nem(k)`.

**Dátum cieľa:** najmenšie celé `k`, pri ktorom `K_L(k) ≥ T`; zlomok sa získa lineárnou interpoláciou medzi `k−1` a `k` (ako D-046). Výpočet pokračuje do 1 200 rokov (`k = 14 400`). Ak `K_L(k) < T` ani potom a K stále rastie, dátum sa nezobrazí a zobrazí sa „Viac ako 50 rokov“ (O-5, D-019, D-256). Cieľ je nedosiahnuteľný len vtedy, keď K nerastie.

**Uzavretý tvar neexistuje:** kombinácia exponenciálnych a lineárnych členov nedáva jednoduchý vzorec, preto sa `n` počíta iteráciou aj pri nehnuteľnosti.

**Obmedzenie hotovosti (D-058, D-074):** pre všetky `k ≤ n` musí platiť `K_cash(k) ≥ 0`. Ak doplácanie vyčerpá hotovosť skôr, výpočet sa zastaví, nezobrazí sa dátum a zobrazí sa mesiac vyčerpania hotovosti.

**Splatenie hypotéky (D-087, T1):** splátka `P` sa platí len do splatenia. Posledná splátka je zmenšená na zostatok, `p(k) = min(P, Z(k−1)·(1+i_h))`; potom `Z(k) = 0`, `K_nem(k) = V` a čistý nájom `N` ide do `m` ako ostatné sporenie. Vzorec pre `Z(k)` platí len pred splatením; preplatok sa nezarátava ako majetok.

**Regresia:** pre `V = 0`, `Z0 = 0`, `N = P = 0` sa výsledok rovná pôvodnému FR-02 (overené: 362,10 mesiaca pre `K = 100 000`, `m = 500`, `T = 600 000`, `r = 3,5 %`).

**Predpoklady [predpoklad, overiť]:**
- A1: všetky sumy sú v dnešných cenách (D-063). `V`, `N` a `P` sú počas roka konštantné; `V` sa mení len pri ročnej aktualizácii (D-089).
- A2: `i_h` sa odvodí z nominálnej sadzby hypotéky a inflácie `π = 4,2 %` (D-263: Eurostat HICP, Slovensko, ročná miera za 2025; hodnotu uviedol zakladateľ 2026-10-23, z tohto prostredia nebola overená).
- A3: úrok je súčasťou `P`; delenie na úrok a istinu je v `Z(k)` cez `i_h` (D-085).

**Golden cases (overené nezávislým výpočtom 2026-10-20; v kóde neimplementované):**
- **GC-P2-01:** `K_inv = 100 000`, `K_cash = 0`, `m = 0`, `r = 3,5 %`, `T = 600 000`, `V = 300 000`, `Z0 = 200 000`, nominálna hypotéka 3 %, `π = 4,2 %`, `P = 1 000`, `N = 1 200`. Výsledok: `i_h ≈ −0,0965 %` mesačne, `n ≈ 237,63` mesiaca (≈ 19 rokov a 10 mesiacov; splatenie v mesiaci ≈ 183), dátum = D_L + 238 mesiacov (zaokrúhlenie hore podľa FR-02). Pred zmenou inflácie bolo 257,58 (π = 2 %).
- **GC-P2-02 (blokovaný prípad):** rovnaké vstupy, ale `K_cash = 10 000`, `N = 600`. `K_cash(k) = 10 000 − 400·k`: hotovosť je 0 v mesiaci 25; v mesiaci 26 je −400, preto sa výpočet zastaví s hlásením „nedostatok hotovosti v mesiaci 26“ (bez dátumu; K_L v tom čase ≈ 238 000 € pri π = 4,2 %, cieľ sa nedosiahol).
- **GC-P2-03 (vlastné bývanie nevplýva na K, D-093):** `K_inv = 100 000`, `m_inv = 500`, `r = 3,5 %`, `T = 600 000`, plus nehnuteľnosť v režime „vlastné bývanie“ s hodnotami z GC-P2-01 (`V = 300 000`, `Z0 = 200 000`, `P = 1 000`, `N = 1 200`). Výsledok musí byť rovnaký ako bez nehnuteľnosti: `n ≈ 362,10` mesiaca (rovnaké ako regresný príklad vyššie).
- **GC-P2-04 (malá splátka):** ako GC-P2-01, ale `P = 100`. Pri `π = 4,2 %` je reálna sadzba hypotéky záporná (−0,0965 % mesačne), takže zostatok hypotéky klesá aj pri splátke 100 €, a `K_cash(k) = 1 100·k`. Výsledok: `n ≈ 226,39` mesiaca. Zostatok hypotéky pri cieli ≈ 140 000 € (pokles od 200 000 €). Pôvodný popis „splátka nepokrýva úrok“ platil pri π = 2 %. Či má tento prípad zobraziť upozornenie (FR-22), je otvorená otázka zakladateľa.

**Stav kódu (2026-10-20):** FR-02a je implementovaný na vetve `claude/phase2-property-card` (`src/domain/rentalGoal.ts`), nie na `main`. Do K vstupuje len prenájom (D-093). GC-P2-01 až GC-P2-04 a regresia FR-02 sú overené jednotkovými testami (`tests/rentalGoal.test.ts`). Predpoklady, ktoré treba overiť: ostatné náklady znižujú čistý nájom `N`; inflácia π = 2 % (A2). E2E test prenájmu zatiaľ kontroluje len text v Majetku, nie dátum cieľa.

**Rozhodnuté (D-093):** vlastné bývanie sa do K nepočíta a zobrazí sa zvlášť. Hodnota bytu, v ktorom používateľ býva, nezvyšuje K_nem.

### FR-03 – Rozsah dátumov (scenáre)
Tri scenáre sa počítajú rovnakým vzorcom s výnosmi odvodenými od r (D-011, S1):
- opatrný: r − 2 p. b. (dolná hranica 0 %),
- základný: r (nastavené, predvolene 3,5 %, D-050),
- optimistický: r + 2 p. b. (S1: scenáre sú relatívne k r, nie pevné).

Zobrazí sa ako „od – do“ (UX D-016): najskorší (optimistický) až najneskorší (opatrný) dátum. Základný je vyznačený textom, nie samostatným číslom. Všetky tri dátumy sa počítajú od D_L (D-024).

### FR-04 – Predbežný dopad transakcie
Pre každú transakciu po poslednom vyhodnotení sa počíta pracovný kapitál:

`K_pred = max(0; K_L + Σ(sporenie po D_L) + Σ(investícia z príjmu po D_L) + Σ(výbery z rezervy po D_L) − Σ(vklady do rezervy po D_L) − Σ(výdavky „z kapitálu“ po D_L))`. Presun z hotovosti do investícií (investícia „z hotovosti“) K nemení. Stav rezervy nie je v K (D-017, D-058); vklad do rezervy K zníži, výber ho zvýši (D-060).

„Po K_L“ znamená transakcie s **dátumom po D_L** (dátum posledného vyhodnotenia), alebo s dátumom D_L zadané **po uložení vyhodnotenia** (D-121). Transakcia zadaná neskôr s dátumom pred D_L je už v K_L a nepridáva sa znovu (FR-05).

Dopad = n(K_L) − n(K_pred) (surový rozdiel, nie rozdiel zaokrúhlených dátumov; N1). Ak |dopad| ≥ 1 mesiac, zobrazí sa zaokrúhlene na najbližší celý mesiac (D-014, napr. „predbežne +2 mesiace“). Ak |dopad| < 1 mesiac, zobrazí sa v dňoch (1 mesiac = 30,44 dňa) (napr. „predbežne +4 dni“), aby drobné transakcie (napr. 100 €, cca 0,12 mesiaca) nevyšli ako „bez zmeny“ (M1). Obe n sa počítajú od D_L, takže dopad nezávisí od dnešného dátumu (D-024). Kladné číslo = cieľ bližšie, záporné = ďalej.
- Výsledok sa zobrazí ako krátky text (D-014), napr. „predbežne +2 mesiace“.
- Ak je dopad presne 0, zobrazí sa „bez zmeny“. Nenulový dopad pod pol dňa sa zobrazí ako „predbežne +menej ako 1 deň“ (resp. „−“), nie ako „bez zmeny“ (R26).
- Pracovný kapitál sa **nepremieta do oficiálneho cieľa**, kým sa neurobí vyhodnotenie.
- Ak K_pred = 0 a m = 0, dopad sa nezobrazuje; zobrazí sa „Hotovosť nestačila; kapitál je 0 €“ a text pre nedosiahnuteľný cieľ (`UNREACHABLE_IMPACT_TEXT`, R26b): po transakcii sa cieľ pri súčasnom sporení a výnose nedosiahne a uvedené sú možnosti, ako ho dosiahnuť (H2).
- Ak K_L ≥ T, dopad sa nezobrazuje; zobrazí sa „cieľ je dosiahnutý“. Ak K_pred ≥ T a K_L < T, zobrazí sa „cieľ je dosiahnutý o X mesiacov skôr“ (S2).

**Príklad:** K_L = 100 000 €, m = 500 €, nová investícia 5 000 € po poslednom vyhodnotení. K_pred = 105 000 €, n klesne z ≈ 334 na ≈ 328 mesiacov → „predbežne 6 mesiacov skôr“.

### FR-05 – Mesačné vyhodnotenie
Vstupy: dátum, hodnota investícií, nasporená suma (kumulatívny stav hotovosti, D-033; UR-11). Výsledok: nový snapshot K_L = hodnota investícií + nasporená suma, prepočet cieľa a dátumov, zobrazenie „Posledné vyhodnotenie: dátum“.

- Transakcie zadané pred uložením vyhodnotenia s dátumom pred dátumom vyhodnotenia sú už zahrnuté v zadaných hodnotách a **nepridávajú sa znovu** (D-123). Transakcia zadaná až po uložení vyhodnotenia sa počíta do K aj vtedy, ak má dátum pred vyhodnotením (zabudnutý výdavok, D-123).
- Transakcie s dátumom po dátume vyhodnotenia, alebo s rovnakým dátumom zadané po uložení vyhodnotenia, tvoria nový predbežný dopad (FR-04) a do K sa počítajú (D-121).
- Prepis predchádzajúceho vyhodnotenia je možný len s potvrdením; história snapshotov sa zachováva.

### FR-06 – Zaokrúhľovanie a formát
Sumy: EUR na celé eurá v zobrazení, 2 desatinné miesta vo vstupe a v uložených dátach. Mesiace: celé čísla; predbežný dopad pod 1 mesiac v dňoch (FR-04). Dátum cieľa: mesiac a rok. Dátumy: slovensky, mesiac slovom (napr. „marec 2038“).

## 3. Správanie a pravidlá

### FR-07 – Prah výdavkov (D-013)
- Prah sa uplatní **len na výdavky**; predvolene 100 €; používateľ ho zmení v rozsahu 100–500 € (východiskový rozsah, bez automatického pravidla; D-048).
- Výdavok pod prahom sa **uloží** s príznakom „pod prahom“ a zahrnie sa do predbežného dopadu (D-030; ruší D-017 O-2; prehľad spotreby je odložený, D-038).
- Sporenie a investície sa ukladajú vždy bez ohľadu na sumu.

### FR-08 – Zdroj úhrady výdavku (D-014)
- „Z príjmu“: K sa nemení.
- „Z hotovosti“ (K_cash): K_pred sa znižuje o sumu, ale K_cash nesmie klesnúť pod 0 (D-058; rezerva je mimo K_cash a do kontroly nevstupuje). Ak by nestačil, výdavok sa nevykoná, zobrazí sa upozornenie a ponuka zdroja „z investícií“. Po vyhodnotení sa zohľadní v nasporenej sume.
- „Z investícií“ (K_inv): K_pred sa znižuje o sumu; K_cash sa nemení (D-045). Ak suma presiahne K_inv, výdavok sa neuloží, zobrazí sa „Investície nestačia“ a navrhne sa zdroj „z príjmu“ (D-074; mení D-059).
- Ak je výdavok z kapitálu väčší než dostupný kapitál, alebo ak súčet výdavkov z kapitálu po D_L presiahne K_L, výdavok sa neuloží a navrhne sa zdroj „z príjmu“ (D-021 v časti upozornenia; potvrdenie prečerpania nahrádza D-074, H2).

### FR-09 – Úprava a mazanie transakcie
- Úprava a mazanie sú možné vždy.
- Ak je dátum transakcie po poslednom vyhodnotení, prepočíta sa len predbežný dopad.
- Ak je dátum pred posledným vyhodnotením, zobrazí sa text: „Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.“
- Mazanie transakcie: bez potvrdenia; možnosť vrátiť späť 8 sekúnd (D-054, UX princíp 4). Mazanie všetkých dát a import potvrdenie vyžadujú (D-018).

### FR-10 – Vynechané vyhodnotenie (D-016)
- Oficiálny cieľ sa **nemení automaticky**; počíta sa z K_L a D_L. Dátum cieľa sa nemení, kým sa neurobí vyhodnotenie.
- Po uplynutí konca mesiaca bez vyhodnotenia sa zobrazí jemná pripomienka a dátum posledného vyhodnotenia.
- Predbežný dopad sa aj naďalej zobrazuje.

### FR-11 – Pripomienka
- Jedna pripomienka na konci mesiaca (v aplikácii; systémová notifikácia len ak ju používateľ povolí) [predpoklad].
- Vypnuteľná v nastaveniach.

### FR-12 – Prvé nastavenie
Postupnosť: cieľ (V, p, r, rezerva) s východiskovými hodnotami ako výzvou (D-057) → investícia (aktuálna hodnota, UR-03) → prah → prvé vyhodnotenie. Pridanie na plochu (iPhone) je blokujúci krok, ktorý sa nedá preskočiť (D-042, D-053, D-075); ostatné kroky sa dajú preskočiť a doplniť neskôr; chýbajúce údaje sa zobrazia ako „nezadané“, nie ako nula. Prvé vyhodnotenie nastavuje D_L; kým neexistuje, namiesto dátumu sa zobrazí výzva „urobte prvé vyhodnotenie“ (L6). Pridanie appky na plochu je na iPhone povinné (D-042; pozri D-034, D-035).

### FR-13 – Východiskové predpoklady
- Východisková hodnota je viditeľne označené a odlíšené od hodnoty používateľa (UR-02).
- Používateľ môže kedykoľvek vrátiť východiskovú hodnotu jedným úkonom.
- Východiskové predpoklady sa týkajú len parametrov (D-007); aplikácia neodporúča produkty.

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
- Import **nahradí** aktuálne dáta až po potvrdení (D-018). Pred nahradením sa ponúkne stiahnutie zálohy aktuálnych dát; uloží sa len po potvrdení používateľa (D-078; mení D-071).
- Texty z poznámky a z importovaného súboru sa zobrazujú len ako text (bez vkladania HTML) a nikdy sa nevykonávajú (S10).
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
| Vyčerpaný kapitál (K_pred = 0) | „Hotovosť nestačila; kapitál je 0 €“. Ak je zároveň m = 0, dopad sa nezobrazuje (H2, L11). |
| Úložisko prehliadača plné alebo nedostupné | Jasná správa, dáta sa neprepíšu; ponuka exportu. |
| Prehliadač vymazal dáta | Prázdny stav s výzvou na import zálohy; žiadne tiché obnovy. |

## 6. Mimo rozsahu MVP
- Viacužívateľský režim, účty, synchronizácia na server.
- Integrácie na bankový účet alebo brokera (neskôr, mobilná aplikácia).
- Projekcia podľa výnosu a inflácie v grafe (odložená, D-008).
- Daně, viac mien, viac krajín (fáza 2). Poplatky sú v MVP voliteľný vstup (D-064).
- Automatické oceňovanie investícií z trhových dát.

## 7. Rozhodnuté a otvorené otázky
**Rozhodnuté:**
- **O-1 Rezerva:** nie je v kapitáli K ani v cieli (D-017).
- **O-2 Výdavky pod prahom:** nahradené D-030 (ukladajú sa s príznakom).
- **O-3 Import zálohy:** nahradí aktuálne dáta po potvrdení (D-018).
- **O-4 Priemer sporenia:** za 12 mesiacov do D_L, delené počtom mesiacov histórie, najviac 12 (D-031; upresňuje D-017).
- **O-5 Veľmi vzdialený dátum:** do 50 rokov, ďalej „viac ako 50 rokov“; bez kapitálu a sporenia text bez dátumu (D-019).
- **O-6 Výdavok z kapitálu väčší než kapitál:** výdavok sa neuloží; upozornenie a ponuka zmeny na „z príjmu“ (D-021, D-074; pre investície nahrádza D-059).

- **Rozhodnuté ďalej (D-030 až D-034):** prah a príznak pod prahom, m = za 12 mesiacov do D_L delené počtom mesiacov, globálne r, nasporená suma je stav. Plocha (iPhone): pôvodne východisková (D-034), upravené na povinnú výzvu (D-042, D-053).
- **Vyriešené (O-8 až O-11):** rozsah prahu D-048, zdroj predvolených r a výberu D-049 a D-050, zdroj úhrady výdavku z kapitálu D-045, výpočet n pri m_cash > 0 D-046.

**Otvorené:**
- **O-7 Klasifikácia spotreby (M7), odložené do fázy 1b (D-038):** pravidelná vs. cielená spotreba; pravidlo a kategórie treba zadať pred implementáciou prehľadu.


## 8. Fáza 2 – funkčné požiadavky (návrh, neimplementované)

> Stav: návrh podľa D-080 až D-090 a D-086. Fáza 2 sa spustí až po splnení brány v `06_Roadmap.md` (právne posúdenie, bezpečnostný audit). MVP tieto požiadavky nezahŕňa. Čísla FR-20 a ďalej sú rezervované pre Fázu 2.

### FR-20 – Aktíva
- Typ: investícia, alebo nehnuteľnosť. Pri každom aktíve sa eviduje hodnota a dátum odhadu.
- Investícia má daňový režim z katalógu (FR-24), predvolene „nezadané“.
- Nehnuteľnosť má režim: vlastníctvo, prenájom, alebo „nezadané“ (D-080, D-086).

### FR-21 – Nehnuteľnosť v kapitáli K
- Nehnuteľnosť sa počíta do K ako **čistá hodnota**: odhad hodnoty mínus zostatok hypotéky (D-080).
- Odhad hodnoty zadáva používateľ alebo ho načíta zo štátnej štatistiky (neskôr cez API). Aktualizuje sa **ročne** (D-089). Zdroj a metóda sa overia pred použitím.
- Odhad je vždy zobrazený ako odhad, nie ako trhová cena.

### FR-22 – Záväzok (hypotéka)
- Evidujú sa: zostatok, úroková sadzba, aktuálna splátka podľa zmluvy, dátum splatenia (D-084).
- Splátka sa delí na úrok a istinu. Istina znižuje zostatok, úrok je výdavok z toku (D-085).
- Upozornenie (D-265): ak splátka nepokryje nominálny úrok za mesiac (zostatok × nominálna sadzba / 12), karta nehnuteľnosti zobrazí výstrahu, že zostatok sa nezníži. Projekcia FR-02a počíta v reálnych hodnotách (A2), výstraha používa nominálny úrok.

### FR-23 – Nájom a tok
- Nájom sa eviduje ako mesačný príjem.
- Ak nájom nepokrýva splátku, rozdiel sa hradí z K_cash. K_cash nesmie klesnúť pod 0 (D-058, D-074). Ak nestačí, výdavok sa zablokuje a ponúkne sa iný zdroj.
- Ak nájom splátku prevyšuje, rozdiel zvyšuje K_cash (D-081).
- Po splatení hypotéky ide čistý nájom do m, teda do mesačného sporenia (D-087).

### FR-24 – Daňový režim investície
- Katalóg režimov je verzovaný. Každý parameter má zdroj, dátum platnosti a stav „overené“ alebo „neoverené“ (princíp D-076).
- Investícia sa priradí k režimu. Výnos r sa nemení bez rozhodnutia (D-070, D-073).

### FR-25 – Daňový scenár
- Daňový scenár je **samostatný výstup** vedľa hlavného nominálneho výpočtu (D-077). Nenahrádza ho.
- Pri parametroch s stavom „neoverené“ sa scenár zobrazí len ako odhad.
- Scenár zobrazuje aktuálny stav po dani pre investície s režimom a pre nehnuteľnosť v režime prenájmu (D-083).

### FR-26 – Režim a nárok na podporu
- Aplikácia eviduje režim vlastníctva alebo nájmu, ale v Fáze 2 **nevyhodnocuje nárok na podporu** (C4 odložené, D-088).
- Integrácia s `spolu-na-ceste` nie je súčasťou tejto fázy.

### FR-27 – Ochrana dát
- Údaje zostávajú lokálne (FR-16). Ukladanie a export citlivých údajov (záväzky, nehnuteľnosť, daňové údaje) musia spĺňať zákonné kritériá pred spustením (D-090).
- Konkrétny rozsah (napr. GDPR a slovenská úprava) overí právnik. Šifrovanie exportu je otvorené a rozhodne sa pred spustením (D-026).
- Záloha pri importe sa stiahne len po potvrdení (D-078).

### FR-28 – Verzia schémy a import
- Schéma sa zvýši. Import zo staršej verzie (v1) musí načítať dáta bez straty (FR-18).
