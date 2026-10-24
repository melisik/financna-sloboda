# Návrh: dane a účtovníctvo (rozpracované, bez implementácie)

Stav: návrh na rozhodnutie. Nič sa nepočíta. Daňové pravidlá sa neuvádzajú ako fakty, kým ich neoverí zdroj (D-104, FR-25).

## 1. Čo treba rozlíšiť
- **Súkromný majetok** (bývanie, osobné auto, sporenie) a **obchodný majetok** (ak používateľ podniká alebo prenajíma ako podnikateľ). Režim musí byť zadaný pri každej položke.
- **Príjem z prenájmu:** súkromný prenájom a prenájom v podnikaní sa daňovo posudzujú inak. Rozdiel medzi paušálnymi a skutočnými výdavkami treba overiť.
- **Investície (D-104):** daňový režim je už v sekcii Investície ako údaj. Výpočet daňovej povinnosti je odložený.

## 2. Čo appka môže evidovať bez výpočtu
- režim majetku (súkromný, obchodný, prenájom),
- dátum nadobudnutia a obstarávacia cena (odhad od používateľa sa nepoužíva ako daňová základňa),
- dátum a suma predaja,
- výdavky a príjmy z prenájmu s kategóriou,
- úroky z hypotéky oddelene od istiny (už je v Majetku, FR-22).
Výsledkom je prehľad a upozornenia na termíny, nie podanie.

## 3. Obchodný majetok a odpisy (len ak používateľ podniká)
Potrebné pravidlá z overeného zdroja: odpisové skupiny a doby odpisovania, metóda odpisov, limit pre zaradenie do majetku, zaobchádzanie s vlastným bývaním v podnikaní. Bez overenia sa neimplementuje.

## 4. Riziká
- **Právne:** daňový výpočet je regulovaný. Podľa D-028 je právne posúdenie podmienkou pre fázu 2.
- **Nesprávny výpočet:** používateľ môže konať podľa čísla z appky. Preto len evidencia a upozornenia, kým výpočet nie je overený.
- **Zmeny pravidiel:** každý rok sa môžu zmeniť sadzby a limity; údaje musia mať zdroj a dátum overenia.

## 5. Otázky pre zakladateľa
1. Podnikáte, alebo máte prenájom evidovaný podnikaním? Od toho závisí, či sa použije časť o obchodnom majetku.
2. Chcete v MVP len evidenciu a upozornenia, alebo aj výpočet daňovej povinnosti (väčšie riziko, až po overení)?
3. Kto overí pravidlá: daňový poradca, účtovník, alebo overenie zo zdrojov Finančnej správy? (Podľa D-104 a D-028.)

## 6. Navrhovaný postup
- **Teraz:** len údaje z bodu 2 (režim, dátumy, obstarávacia cena, výdavky a príjmy z prenájmu) a upozornenia na termíny. Bez daňových čísel.
- **Po overení:** výpočty z bodu 3 a dane z investícií (D-104), každý s odkazom na zdroj.

## 7. Odpovede zakladateľa (2026-10-22) a stav

1. **Rozsah evidencie:** len prenájom vlastných nehnuteľností. Podnikanie na iné entity sa do appky nedáva.
2. **Výpočty:** áno, ale až po overení zdroja (D-104).
   - Miestne dane (daň z nehnuteľností): priznanie sa podáva pri vzniku a zániku. Appka pripraví podklady a odkaz na oficiálnu stránku, údaje sa nahrajú tam.
   - Daň z príjmu z prenájmu: odkaz na portál Finančnej správy, vyplnenie tam. Neskôr možno pripraviť XML z podkladov a nahrať ho cez integráciu.
3. **Overenie pravidiel:** priamo zo zdrojov Finančnej správy, alebo overenie zakladateľom, alebo nájdenie relevantného zdroja.

**Krok 1 (zapracované, D-156):** pri nehnuteľnosti pribudli nepovinné údaje: dátum obstarania, obstarávacia cena a pri prenájme dátum začiatku prenájmu. Sú to údaje z dokumentov, nie daňové čísla.

**Krok 1b (zapracované, D-157):** pri prenájme priebežná evidencia príjmov a výdavkov (dátum, druh, suma, poznámka) s ročným súčtom. Súčet je podklad pre riadok 11, oddiel VI, tabuľka 1 daňového priznania. Appka nepočíta daň ani sadzby.

**Krok 2a (zapracované, D-220):** šablóna XML priznania typu rdp=1, rok 2025, je v `public/tlaciva/dpfo-rdp1-2025-sablona.xml`. Obsahuje len štruktúru a pevné hodnoty (typ, rok, klasifikáciu činnosti, názvy rokov 2020 až 2024). Test `tests/tax-xml-template.test.ts` stráží, že v nej nie sú žiadne údaje daňovníka. Význam s1 a s2 v riadku 11 tabuľky 1 je potvrdený z poučenia k DP FO 2025, s. 13 (pozri sekciu 9). Generovanie XML zostáva odložené.

**Krok 2b (nezapracovaný, čaká na overenie zdroja a na prijatie na portáli):** generovanie XML z ročnej evidencie (D-157). Čaká na overenie zdrojov (sekcia 8) a na to, ako portál prijíma prázdne prepínače (TODO v šablóne).

- Miestne dane: tlačivo 17-dp-md appka už vypĺňa (D-161, D-208). Zostáva overiť zdroje k termínom a správcovi dane (sekcia 8).
- Daň za psa: rovnaký typ podkladu; sadzby určuje obec (VZN), preto sa zavedie až s konkrétnou obcou.
- Pojem príjmu (dátum prijatia) a uznanie výdavkov (doklady alebo paušál) sa potvrdia pred výpočtom.

## 8. Stav overenia zdrojov (2026-10-22)

Vyhľadávanie našlo tieto zdroje. Pri každom je uvedené, čo sa podarilo overiť.

| Zdroj | Čo tvrdí | Stav |
|---|---|---|
| slovensko.sk, Daň z nehnuteľností (https://www.slovensko.sk/sk/zivotne-situacie/zivotna-situacia/_dan-z-nehnutelnosti) | vznik a zánik povinnosti, priznanie do 31. januára, správca dane je obec | **nenačítané** (z vyhľadávania, nie zo stránky) |
| podpora.financnasprava.sk, 800764 (príjmy z prenájmu, § 6 ods. 3) | vymedzenie príjmov z prenájmu | **nenačítané** (prostredie nemá prístup) |
| články advokátskej kancelárie (ddadsstornala.sk) | sadzba 19 %, oslobodenie 500 € | **neoverené**, tretia strana, nepoužiť bez primárneho zdroja |

Dôvod: z prostredia vývoja nie je prístup na stránky Finančnej správy ani slovensko.sk (DNS). Overenie musí urobiť zakladateľ alebo overovateľ s prístupom k týmto stránkam. Kým nebude overené, appka nezobrazuje žiadne sadzby, sumy ani termíny.

**Čo treba overiť (zoznam pre zakladateľa):**
- Daň z nehnuteľností: vznik a zánik, termín priznania, či sa priznanie podáva len pri vzniku a zániku, odkaz na správcu dane (obec).
- Daň z príjmu z prenájmu: vymedzenie, sadzba, hranica oslobodenia, výdavky, odkaz na portál.
- Registrácia na daňovom úrade pri prenájme časti bytu (vrátane oddelenej vstupu a služieb).

## 9. Podklady z oficiálnych tlačív (2026-10-22)

- **Tlačivo 17-dp-md** (priznanie k dani z nehnuteľností, dani za psa, predajné automaty, hracie prístroje): PDF má 1 688 editovateľných polí. Oddiely: I daňovník, II pozemky, III stavby, IV byty, V pes (25 riadkov, dátum vzniku a zániku). Vyplnenie z údajov v appke je implementované (D-161, D-208).
- **Poučenie k DP FO 2025 (typ B), s. 13:** riadok 11 tabuľky 1 (oddiel VI). Stĺpec 1 = kladný rozdiel medzi príjmom z prenájmu a 500 € (§ 9 ods. 1 písm. g). Stĺpec 2 = výdavky × stĺpec 1 / celkový príjem z prenájmu (rovnaký pomer). Riadok 13 tabuľky 1 sa prenáša do riadkov 58 (príjmy) a 59 (výdavky). Výdavky percentom sa pri prenájme neuplatňujú. Príklad v poučení (3 595,75 €) sa nezhoduje s vzorcom (3 594,76 € pri príjme 9 948 € a výdavkoch 3 785 €) — overiť s účtovníkom.
- **Príjem:** podľa dátumu, kedy prišiel na účet (zadanie zakladateľa). **Výdavky:** doklady sa pripájajú k jednotlivým výdavkom z prenájmu (D-221) aj k výdavkom z transakcií (D-160). Prílohy sa zálohujú spolu s dátami.
- **Daň za psa:** evidencia psov je zavedená (D-159): obec, adresa, miesto držania, účel, dátumy vzniku a zániku, počet psov dnes. Sadzby určuje obec a appka ich nepočíta.

## 10. Stav po odpovediach zakladateľa (2026-10-23)

| Bod | Odpoveď | Stav | Rozhodnutie |
|---|---|---|---|
| 1. Overenie zdrojov | odložiť | odložené | D-267 |
| 2. Pojem príjmu | platí dátum prijatia pre celé priznanie | rozhodnuté | D-266 |
| 3. Uznanie výdavkov | paušál neexistuje, rozdiel len pri obchodnom majetku | rozhodnuté (obchodný majetok mimo rozsahu) | D-266 |
| 4. Nezhoda v príklade poučenia (3 595,75 € vs 3 594,76 €) | overí zakladateľ | otvorené | — |
| 5. Registrácia na daňovom úrade | vždy povinná | rozhodnuté | D-267 |
| 6. Papierové podanie a portál | papierovo možné, ak nie sú iné príjmy; portál vyskúša zakladateľ | otvorené (test na portáli) | D-267 |

Krok 2b (generovanie XML) zostáva nezapracovaný, kým sa neoverí bod 1 a bod 6.
