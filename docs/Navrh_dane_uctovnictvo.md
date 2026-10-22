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

**Krok 2 (nezapracované):** výpočty a odkazy na portály čakajú na overenie zdroja.

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
