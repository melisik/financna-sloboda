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
