# 06 – Roadmapa

> Stav: v0.2 (2026-10-14). Veľkosti milníkov sú relatívne (S / M / L), nie dátumy. Kapacita: hodiny denne (potvrdené zakladateľom); presný odhad trvania doplníme po M1 podľa skutočného tempa. **[predpoklad]** = návrh Claude.

## 1. Princípy plánovania
- **Poradie fáz:** najprv hodnota pre zakladateľa, potom EÚ, potom mobil a integrácie (D-005, zadanie).
- **Merateľné kritériá:** každý milník má výstupné kritérium, nie len zoznam úloh.
- **Brány:** do ďalšej fázy sa ide až po splnení kritérií a potrebných rozhodnutí.
- **Rozhodnutia pred implementáciou:** otvorené body sa uzavrú v dokumentoch a zapíšu do `decisions/Decisions.md`.
- **Minimum pred rozšírením:** MVP sa overí na vlastnom používaní, až potom sa rozširuje.

## 2. Prehľad fáz

| Fáza | Cieľ | Stav | Brána na vstup |
|---|---|---|---|
| 0 – Discovery a dokumentácia | vízia, požiadavky, architektúra, testy | prebieha | externá revízia dokumentov |
| 1 – MVP (osobné použitie) | webová PWA pre zakladateľa | plán | rozhodnutia z oddielu 9 |
| 1b – Pilot | 3 mesiace reálneho používania | plán | dokončené M1–M7 |
| 2 – EÚ webový produkt | viac používateľov, účty, GDPR, jazyky | plán | právne posúdenie, monetizácia, rozhodnutie o účtoch a šifrovaní |
| 3 – Mobil a integrácie | natívna appka, banka a investičné appky | plán | licencie a zmluvy, bezpečnostný audit |

## 3. Fáza 0 – Discovery (takmer hotová)
**Výstupy:** `00_Project_Vision`, `01_Personas`, `02_User_Requirements`, `03_UX_Principles`, `04_Functional_Requirements`, `05_Technical_Architecture`, `07_Testing_Strategy`, tento dokument.

**Čo ešte chýba:**
- externá revízia dokumentov (Claude ako reviewer, podľa `CLAUDE.md`),
- rozhodnutie o hostingu a šifrovaní v MVP. O-6 je uzavretý (D-021).

**Výstupná brána:** pripomienky z revízie sú zapracované a rozhodnutia zapísané v `Decisions.md`.

## 4. Fáza 1 – MVP (osobné použitie)

| Milník | Obsah | Veľkosť | Výstupné kritérium | Požiadavky |
|---|---|---|---|---|
| **M1 Doménová vrstva** | cieľ, dátumy (scenáre), predbežný dopad, mesačné vyhodnotenie – čisté funkcie | M | všetky GC-01 až GC-12 prejdú; property testy zelené; overenie NPER | FR-01 až FR-05, FR-07, FR-08 |
| **M2 Úložisko a záloha** | IndexedDB, CRUD, export a import s validáciou a atomicitou, schéma v1 | M | round trip test zelený; neplatný import nič nezmení | FR-16 až FR-19 |
| **M3 Nastavenie a transakcie** | prvé nastavenie s odporúčaniami, investícia, prah, zadanie transakcie so zdrojom úhrady, história | L | zadanie transakcie do 20 s a do 5 dotykov [predpoklad]; komponentové testy | UR-01 až UR-05, UR-07, UR-10, UR-12, FR-12, FR-13, FR-15 |
| **M4 Prehľad a vyhodnotenie** | domovská obrazovka s rozsahom dátumov, predbežný dopad, mesačné vyhodnotenie, pripomienka, upozornenie pri vynechaní | M | E2E tok „transakcia → vyhodnotenie → dátum“ prejde | UR-06, UR-11, FR-09, FR-10, FR-11, FR-14 |
| **M5 PWA a offline** | service worker, manifest, ikony, inštalácia na plochu | S | všetky toky offline; sieťový test súkromia zelený | FR-16, UX princíp 6 |
| **M6 Dostupnosť a kvalita** | axe-core bez vážnych chýb, čítačky, tmavý režim, zoom 200 % | S | nulové vážne porušenia; checklist čítačiek vyplnený | UX, 07 oddiel 9 |
| **M7 Vydanie 0.1 pre seba** | nasadenie na HTTPS, návod v appke, prvá ručná záloha | S | nasadené; export a import fungujú na reálnom telefóne | Definícia hotového (07 oddiel 13) |

**Poradie:** M1 → M2 → M3 → M4 → M5 → M6 → M7. M5 a M6 sa dajú začať paralelne s M4, ak to kapacita dovolí.

**Hlavné riziká fázy 1:**
- **Dáta na iOS Safari** môžu byť vymazané po dlhšom nepoužívaní [predpoklad, overiť]. Mitigácia: odporúčanie pridať na plochu, pripomienka zálohy.
- **Chyba vo vzorci** by viedla k zlému rozhodnutiu. Mitigácia: GC testy, NPER overenie, property testy.
- **Pretiahnutý rozsah** („všetko v jednom“, D-003). Mitigácia: MVP je presne to, čo je v milníkoch; čokoľvek navyše ide do backlogu.
- **Motivácia a kapacita** pri osobnom projekte. Mitigácia: malé milníky s jasným koncom.

## 5. Fáza 1b – Pilot (3 mesiace)
- **Používanie:** týždenné zadávanie a tri po sebe idúce mesačné vyhodnotenia.
- **Zber dát:** denník zmätkov, počet dotykov, čo bolo nejasné, každé nezrovnalé číslo.
- **Výstupy:** nové rozhodnutia D-xxx, úpravy FR a UX, backlog pre fázu 2.
- **Výstupné kritérium:**
  - tri vyhodnotenia bez blokujúcej chyby;
  - žiadna neočakávaná zmena čísla;
  - história rozhodnutí je úplná;
  - aspoň jeden round trip export → import na reálnych (anonymizovaných) dátach.
- **Čo pilot overí:** či sú odporúčania a predvolené hodnoty zrozumiteľné a či sa predbežný dopad dá pochopiť bez vysvetlenia. Výnos sa za 3 mesiace overiť nedá.

## 6. Fáza 2 – EÚ webový produkt

**Brány (musia byť splnené pred začiatkom):**
1. **Právne posúdenie:** hranica investičného poradenstva (MiFID II), GDPR (správca, právny základ, práva dotknutých osôb), spotrebiteľské právo, rozdiely medzi krajinami.
2. **Monetizácia:** otvorený bod z `00_Project_Vision` (zatiaľ nerozhodnuté).
3. **Účty a synchronizácia:** cloud alebo lokálne; s tým spojené rozhodnutie o šifrovaní (odložené z MVP).
4. **Persony EÚ:** definované v `01_Personas` a overené rozhovormi s cieľovou skupinou (07 oddiel 10).

**Milníky (predbežne):**
- viacmenovosť (EUR a lokálne meny) a preklady textov;
- účty a prihlásenie;
- synchronizácia a šifrované zálohy;
- nástroje GDPR: export údajov používateľa, vymazanie účtu;
- onboarding pre nových používateľov;
- podpora a dokumentácia pre používateľov.

**Architektúra:** pribudne backend (API, autentifikácia, úložisko na serveri). Doménová vrstva `domain/` zostane nezmenená; to je hlavný dôvod, prečo sme ju oddelili (05 oddiel 3).

**Riziká:** nová zodpovednosť za dáta na serveri, GDPR, rast nákladov na prevádzku a údržbu.

## 7. Fáza 3 – Mobilná appka a integrácie

**Brány:**
- **Prístup k bankovým dátam:** PSD2 vyžaduje licencovaného poskytovateľa alebo spoluprácu s agregátorom. Rozhodnutie o spôsobe.
- **Investičné aplikácie:** zmluvy alebo technický prístup od poskytovateľov.
- **Bezpečnostný audit** pred napojením na citlivé dáta.

**Milníky (predbežne):**
1. natívna mobilná appka nad zdieľanou doménovou vrstvou;
2. **import výpisov (CSV)** ako prvý krok – nevyžaduje licenciu a prináša väčšinu hodnoty [predpoklad, zvážiť];
3. napojenie na bankový účet (po splnení brány);
4. napojenie na investičné aplikácie (po splnení brány).

## 8. Zámerne mimo plánu
- graf projekcie podľa výnosu a inflácie (odložený, D-008);
- daňové výpočty (mimo MVP, D-008 a 04 oddiel 6);
- odporúčanie konkrétnych produktov (vylúčené, D-007).

## 9. Rozhodnutia potrebné pred ďalšími krokmi

| Kedy | Rozhodnutie | Kto |
|---|---|---|
| pred M2 | šifrovanie dát v MVP (áno/nie) | zakladateľ |
| pred M5 | hosting (GitHub Pages, alebo iný) | zakladateľ |
| pred M3 | odporúčanie pridať appku na plochu v prvom nastavení | zakladateľ |
| pred fázou 2 | monetizácia, právne posúdenie, účty a šifrovanie | zakladateľ, právnik |
| po M1 | presnejší odhad trvania milníkov podľa tempa | zakladateľ |

## 10. Metriky úspechu [predpoklad]
- **Fáza 1:** tri po sebe idúce mesačné vyhodnotenia; nula strát dát; transakcia do 20 sekúnd.
- **Fáza 1b:** úplná história rozhodnutí; žiadna neočakávaná zmena čísla.
- **Fáza 2:** aktívni používatelia po 30 dňoch, miera návratov, nula incidentov s ochranou údajov.

## 11. Otvorené otázky
Zodpovedané: kapacita (hodiny denne) a zariadenie (iPhone 16, iOS 26.6.2, viď 07 oddiel 8).

1. **Fáza 3:** chceš ju plánovať podrobnejšie už teraz, alebo až po pilote?
