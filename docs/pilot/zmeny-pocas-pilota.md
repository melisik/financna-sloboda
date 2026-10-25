# Zmeny kódu počas pilota

Podľa `docs/17` (oddiel 8): zmena výpočtu počas pilota zneplatní porovnanie, preto ju môže povoliť len výnimka zapísaná v `decisions/Decisions.md`. Zmeny UI sú možné, ale zapisujú sa sem.

Zmeny sú na vetve `claude/phase2-property-card`, teda v súkromnom náhľade pre testerov. Verejná verzia z `main` ich nemá, kým sa vetva nezlúči. Pri porovnaní výsledkov pilota treba vedieť, ktorú verziu kto používal.

| Dátum | Rozhodnutie | Druh | Zmena | Vplyv na porovnanie |
|---|---|---|---|---|
| 2026-10-24 | D-285 (výnimka D-291) | **výpočet** | Oficiálny dátum cieľa, jeho rozsah, upozornenie na dlhý horizont a pokrok sa počítajú z kapitálu pri poslednom vyhodnotení. Predtým sa dátum posúval s každou transakciou po vyhodnotení. | Dátum cieľa zapísaný pred touto zmenou mohol obsahovať transakcie po vyhodnotení; od zmeny sa mení len pri vyhodnotení. Porovnávať dátumy treba od rovnakého vyhodnotenia. |
| 2026-10-24 | D-288 | UI (predvolená hodnota) | Predvolený zdroj nového výdavku je „z príjmu“ (predtým „z hotovosti“). | Výdavky zadané bez zmeny zdroja už neznižujú kapitál. Výpočet sa nemení, mení sa to, čo používateľ zvyčajne zadá. |
| 2026-10-24 | D-289 | UI (text) | Skloňovanie čísel 22 až 24, 32 až 34 a pod. („22 mesiacov“). | Len text. |
| 2026-10-24 | D-281 | UI | Pruh „Skúšobná verzia“ je zbaliteľný. | Žiadny. |
| 2026-10-24 | D-282 | UI (text) | Text výnosu uvádza infláciu 4,2 % z výpočtu namiesto 2 %. | Len text; výpočet bol už predtým so 4,2 %. |
| 2026-10-24 | D-283 | UI | Prehľad: dátum cieľa, pokrok a posun hore; Moduly na telefóne zbalené. | Žiadny na výpočet; mení sa poradie obrazovky. |
| 2026-10-24 | D-284 | UI (načítanie) | Skener čiarových kódov sa načíta až v Sklade. | Žiadny. |
| 2026-10-24 | D-286, D-287 | UI | Formulár transakcie: suma prvá, doklad zbalený, Prílohy a Zmazať v úprave, Uložiť prilepené dole. | Môže zmeniť čas a počet dotykov pri zadaní transakcie (metrika v `tyzdenny-zapis.md`). |
| 2026-10-24 | D-289 | UI | Prehľad: zbalený blok Vývoj v čase. | Žiadny na výpočet. |
| 2026-10-24 | D-290 | UI | Mesačný výdavok: zoznam opakovaných výdavkov a dátumu cieľa; doplnená testovacia záloha. | Nový zoznam; výpočet cieľa sa nemení. Testovacia záloha má viac transakcií. |

Zmeny od začiatku pilota (2026-10-21) do 2026-10-23 sem zatiaľ zapísané nie sú. Ich zoznam je v `decisions/Decisions.md` (rozhodnutia s dátumom od 2026-10-21).
