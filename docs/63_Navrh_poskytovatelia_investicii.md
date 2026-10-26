# 63 – Návrh: poskytovateľ investície zo zoznamu NBS

> Stav: **návrh na schválenie** (2026-10-26). Kód sa nemení. Nadväzuje na D-328. Zakladateľ už rozhodol: len firmy, ktoré investičné produkty ponúkajú priamo (nie agenti a sprostredkovatelia); slovenské firmy aj pobočky zahraničných firiem na Slovensku; poisťovne áno; firmy s voľným cezhraničným pôsobením nie, namiesto nich „iný poskytovateľ“ s vlastným názvom. Upozornenie „poskytovateľ nie je v NBS“ je v backlogu (N-23). D-153: bez zmeny výpočtu.

## 1. Zdroj údajov (overené 2026-10-26)

- **Register subjektov finančného trhu NBS**, export `https://subjekty.nbs.sk/api/json` (ZIP s jedným súborom JSON, 32 MB, stav k 2026-10-25). Ponúka aj XLSX (`/api/xlsx`).
- Štruktúra: `updated` (dátum), `institutions[]` so `id` (IČO), `name`, `address`, `country`, `licenses[]` (`scope` = typ oprávnenia, `valid_from`, vnorené oprávnenia, napr. „poskytovanie investičných služieb“).
- Spolu 33 823 subjektov; z toho asi 27 400 sú len agenti a sprostredkovatelia (asi 17 000 pravdepodobne fyzické osoby, odhad podľa tvaru názvu). Tých appka nepreberá.

## 2. Čo sa zaradí

| Typ oprávnenia v registri (`scope`) | Označenie v appke | Počet (2026-10-25) |
| --- | --- | --- |
| obchodník s cennými papiermi | obchodník s cennými papiermi | 20 |
| pobočka zahraničného obchodníka s cennými papiermi | obchodník s cennými papiermi (pobočka) | 7 |
| správcovská spoločnosť | správcovská spoločnosť (podielové fondy) | 10 |
| pobočka zahraničnej správcovskej spoločnosti | správcovská spoločnosť (pobočka) | 3 |
| banka, úverová inštitúcia – len s vnoreným oprávnením „poskytovanie investičných služieb“ | banka | do 8 |
| pobočka zahraničnej banky – rovnako len s investičnými službami | banka (pobočka) | do 13 |
| dôchodková správcovská spoločnosť | II. pilier | 5 |
| doplnková dôchodková spoločnosť | III. pilier | 4 |
| poisťovňa | poisťovňa | 9 |
| pobočka poisťovne z iného členského štátu | poisťovňa (pobočka) | 15 |
| poskytovateľ služieb kryptoaktív | kryptoaktíva | 6 |
| poskytovateľ služieb hromadného financovania | hromadné financovanie | 7 |

Spolu asi 90 až 105 firiem (presný počet po filtri bánk). Z každej sa prevezme len **IČO, názov a označenie typu**; adresa ani ostatné údaje nie (minimalizácia, nepotrebné na výber).

## 3. Ako sa dostane do appky

- **Skript** `scripts/nbs-providers.mjs` stiahne export, vyfiltruje podľa oddielu 2 a zapíše `src/data/nbsProviders.json` s poľom `updated` (dátum registra) a zoznamom `{ ico, name, type }`. Spúšťa sa ručne vo vývoji; v appke nič nesťahuje (D-009).
- Súbor je v repozitári a pribalí sa do zostavy (odhad desiatky kB pred kompresiou; zmeria sa).
- **Aktualizácia:** ručne pri údržbe, napr. raz za štvrťrok, a pri každom nasadení na upozornenie, ak je zoznam starší ako 6 mesiacov (otázka 3). Zmena zoznamu sa zapíše do pilotného záznamu.
- Test overí tvar súboru, že neobsahuje agentov ani adresy a že dátum je vyplnený.

## 4. Ako to uvidí používateľ

- Vo formulári investície nové nepovinné pole **Poskytovateľ** (v hlavnej časti, nie v zbalenom bloku – je to bežný údaj).
- Výber s vyhľadávaním podľa názvu (rovnaký prvok `datalist` ako návrhy položiek, D-318), zoskupený podľa typu; posledná voľba **Iný poskytovateľ** otvorí textové pole na vlastný názov (Trading 212, Interactive Brokers a pod.).
- Pod výberom malým písmom: „Zoznam firiem s povolením NBS, stav k 25. 10. 2026. Nie je to odporúčanie.“
- Na karte položky a pri zoskupení podľa poskytovateľa (otázka 4) sa zobrazí názov poskytovateľa.
- Uloží sa `provider: { ico?: string; name: string }` (IČO len pri výbere zo zoznamu). Ak firma zo zoznamu neskôr vypadne, uložený názov ostane.

## 5. Dáta a záloha

- Nové nepovinné pole v `Position`; schéma zálohy v15, staršie zálohy sa načítajú bez poskytovateľa. IndexedDB bez zmeny (pole v existujúcom zázname).
- Validácia: názov 1 až 120 znakov, IČO 6 až 8 číslic alebo chýba.

## 6. Riziká

- **Dojem odporúčania (D-028, G1):** zoznam je abecedný v rámci typu, bez hodnotenia, poradia podľa výnosu ani zvýraznenia. Veta „Nie je to odporúčanie.“ Patrí do podkladu pre právnika.
- **Zastaraný zoznam:** firma môže stratiť povolenie; zoznam nesie dátum. Kontrola aktuálnosti je N-23.
- **Osobné údaje:** agenti (aj fyzické osoby) a adresy sa nepreberajú.
- **Kognitívna záťaž:** jedno nepovinné pole s vyhľadávaním; bez neho sa položka uloží ako doteraz.
- **Podmienky použitia údajov NBS:** export je verejný; podmienky na `nbs.sk/sk/disclaimer-sk` treba prečítať pred zverejnením (predpoklad: verejné údaje registra sa smú preberať s uvedením zdroja; overí zakladateľ).

## 7. Postup

1. Test najprv: filter (typy, banky len s investičnými službami, bez agentov, bez adries), validácia poľa, záloha v15.
2. Skript a vygenerovaný zoznam; kontrola počtu a veľkosti.
3. UI vo formulári investície, E2E (výber zo zoznamu, iný poskytovateľ, zobrazenie na karte, záloha a obnova).
4. `tsc`, `vitest`, celé Playwright; zápis D-číslo, pilotný záznam, `docs/41` (úloha pre testerov), podklad pre právnika.

Odhad: 1 deň.

## 8. Otázky na rozhodnutie

1. Súhlasíš s rozsahom v oddiele 2 a s tým, že sa preberá len IČO, názov a typ?
2. Pole **Poskytovateľ nepovinné (odporúčam)**, alebo povinné?
3. Aktualizácia zoznamu: **ručne raz za štvrťrok a upozornenie pri nasadení, ak je starší ako 6 mesiacov (odporúčam)**?
4. V sekcii Investície **zoskupiť položky aj podľa poskytovateľa** (popri cieľoch, D-258), alebo zatiaľ len zobraziť na karte (**odporúčam zatiaľ len zobraziť**)?
5. Podmienky použitia údajov NBS prečítaš ty, alebo mám pripraviť výťah na kontrolu?
