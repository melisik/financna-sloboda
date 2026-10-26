# 68 – Návrh: rozšírenie vízie – modulárna appka pre domácnosť

> Stav: **čiastočne rozhodnuté** (2026-10-26, D-337). Podnet zakladateľa: „Rozdelme to na takú appku, aby si tam každý vybral to svoje." Otázky 1, 2 a 4 rozhodnuté; otázka 3 (názov) ostáva otvorená. Neimplementuje sa; slúži na ujasnenie smeru pred ďalším vývojom a pred bránami G1 a G5.

## 1. Čo sa zmenilo v myslení

Pôvodná vízia (`docs/00`): appka odpovie na otázku *kedy dosiahnem finančnú nezávislosť?*

Počas vývoja pribudol Sklad – modul, kde nie sú takmer žiadne peniaze, ale je dôležitý ako súčasť správy domácnosti (zásoby, nákupné zoznamy, recepty). Zakladateľ vidí potenciál rozšíriť appku tak, aby si každý používateľ zvolil, čo mu je užitočné – finančná nezávislosť môže byť len jedným z modulov.

## 2. Dve verzie vízie

### Verzia A – Finančná sloboda (súčasný zámer)
- Appka odpovedá na jednu otázku: *kedy dosiahnem finančnú nezávislosť?*
- Sklad, transakcie a investície slúžia tejto otázke.
- Jasné zameranie, jednoduchšia komunikácia, nižšie právne riziko.
- Obmedzenie: používateľ, ktorý nechce sledovať finančnú nezávislosť, nemá dôvod appku používať.

### Verzia B – Modulárna appka pre domácnosť
- Appka je centrum osobného a rodinného života.
- Používateľ si zapne len to, čo potrebuje: financie, zásoby, recepty, plánovanie…
- Finančná sloboda je jeden z modulov, nie celý produkt.
- Širšie publikum; nižšia hustota finančného obsahu → nižšie riziko dojmu poradenstva.
- Väčší scope, iný názov, iná architektúra zdieľania.

## 3. Možné moduly (Verzia B)

| Modul | Čo rieši | Stav dnes | Poznámka |
| --- | --- | --- | --- |
| **Finančná nezávislosť** | kedy dosiahnem cieľ | implementované (jadro) | dnešný hlavný modul |
| **Transakcie a rozpočet** | výdavky, príjmy, limity | implementované | |
| **Majetok a záväzky** | nehnuteľnosti, hypotéka | implementované | |
| **Investície** | položky, ciele, poskytovatelia | implementované | |
| **Dane** | evidencia, tlačivo | čiastočne | výpočet čaká na overenie |
| **Sklad a zásoby** | čo mám doma, čo mi vyprší | implementované | prvý „nefinančný" modul |
| **Recepty a jedálniček** | zdieľanie receptov, plánovanie jedál | nie | vyžaduje zdieľanie → server alebo export |
| **Nákupný zoznam** | čo kúpiť, zdieľanie so rodinou | čiastočne (v Sklade) | zdieľanie čaká na rozhodnutie |
| **Stavebné sporenie / II. pilier** | špecifické slovenské produkty | nie | dá sa ako podtyp investície |
| **Poistenie** | prehľad poistiek, termíny | nie | |
| **Podnikanie / SZČO** | príjmy a výdavky živnostníka | nie | iný daňový režim |

## 4. Čo zdieľanie receptov mení

Zdieľanie receptov medzi zariadeniami alebo používateľmi predpokladá:
- **Server alebo synchronizačnú vrstvu** (mení D-009: appka dnes nič neposiela),
- **alebo** export/import receptov ako súboru (bez servera, podobne ako záloha).

Export/import je konzistentný s DNA projektu a neohrozuje súkromie. Server je väčšia zmena s právnymi a bezpečnostnými dôsledkami (G1, G4).

## 5. Čo sa nemení bez ohľadu na verziu

- Offline-first, dáta v zariadení (D-009).
- Žiadne odporúčania, len evidencia a výpočet.
- Slovenský trh v prvom kroku.
- Appka je zadarmo / bez predplatného (zatiaľ nezapísané rozhodnutie – predpoklad).

## 6. Riziká

- **Fokus:** modulárna appka môže stratiť jasný hlavný prísľub; „robia všetko" appky sú ťažko poziciovateľné.
- **Scope:** väčší scope = dlhší vývoj pred G1 a G5; pilot testuje len dnešný rozsah.
- **Názov:** „Finančná sloboda" nefunguje ako názov appky, ktorá rieši aj recepty. Zmena názvu je rozhodnutie s dosahom na doménu, komunikáciu a prípadnú registráciu.
- **Právne:** nefinančné moduly znižujú riziko dojmu poradenstva, ale pridávajú iné otázky (ochrana receptov, zdieľanie osobných dát medzi zariadeniami).

## 7. Rozhodnutia (D-337)

1. **Smer:** Verzia A je „vlajková loď" – finančná nezávislosť je hlavný prísľub. K nej pribudnú ďalšie moduly, ktoré dávajú zmysel (sklad, recepty, …); každý používateľ využíva len časť. **Kľúčová podmienka: prehľadnosť.** Appka nesmie byť neprehľadná tým, že má veľa modulov.
2. **Zdieľanie:** Zatiaľ export/import súborom (bez servera, konzistentné s D-009). Server/synchronizácia príde neskôr ako samostatné rozhodnutie.
3. **Názov:** „Finančná sloboda" (pracovný názov) nefunguje ako názov modulárnej appky. **Otvorené – treba premyslieť pred G1.**
4. **Pilot:** Čaká na vyriešenie otázky názvu a smeru; pozvánky nie sú zatiaľ odoslané.

## 8. Ďalší krok

- Navrhnúť kandidátov na nový názov appky (samostatný doc alebo brainstorming).
- Po rozhodnutí o názve: aktualizovať `docs/00` (vízia) a spustiť pilot.
