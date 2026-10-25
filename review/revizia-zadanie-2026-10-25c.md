# Zadanie pre externú revíziu zmien D-305 až D-311 (2026-10-25)

Pre reviewera v **novej, samostatnej konverzácii** (CLAUDE.md). Reviewer nie je autor. Podklad pripravil autor zmien; opisuje, čo a kde sa zmenilo, nehodnotí to. Nadväzuje na `review/revizia-vysledok-2026-10-25.md` a `review/revizia-vysledok-2026-10-25b.md` (D-295 až D-304 sú nimi pokryté alebo vznikli z nich).

## Stav

- Vetva `claude/phase2-property-card`, zmeny po D-304 (`5f799ed`) vrátane. `main` je zlúčený (`c5404f2`, D-311).
- Podľa autora: `tsc` bez chýb, `vitest` 551, Playwright 498 (249 × 2). Over sám; pri Playwrighte aj s písmom DejaVu Sans (D-304).
- Zmeny vznikli z prehliadky zakladateľa: `docs/pilot/scenar-prehliadka-2026-10-25.md`, `docs/55`, `docs/56`.

## Zmeny na posúdenie

| Rozhodnutie | Čo | Kde | Na čo sa zamerať |
| --- | --- | --- | --- |
| D-305 | Záloha sa zdieľa ako `text/plain` s koncovkou `.json` (iPhone). | `src/features/zaloha/BackupSection.tsx` | Prijme obnova všetky staršie zálohy? Nevznikne problém na Androide alebo v počítači? |
| D-306, D-307 | Tlačivo 17-dp-md: hlásenie kroku a dôvodu chyby; vyplnenie a uloženie sú dva kroky. | `src/features/dane/Dane.tsx` | Neprezradí hlásenie citlivé údaje? Ostáva náhľad PDF uvoľnený (`revokeObjectURL`)? |
| D-308 | Návod ako tlačidlo, Uložiť zálohu, väčší dátum cieľa, potvrdenie chýbajúcich surovín, tlačivo bez tlačidla bez údajov, **ručné položky dokladu**. | `Transakcie.tsx`, `BackupSection.tsx`, `Prehlad.tsx`, `Navod.tsx`, `Sklad.tsx`, `Recepty.tsx`, `Dane.tsx` | Ručné položky: zlučovanie s uloženými a vloženými položkami pri úprave; vyčistenie po uložení a zrušení; validácia (kód „ručne“, DPH 0); súčet a nesúlad. |
| D-309 | Moduly, Sprievodca a PIN nad formulárom Nastavení. | `src/ui/Sekcie.tsx` | Len poradie? |
| D-310, D-311 | Formuláre nehnuteľnosti, záväzku a investície so zbalenými blokmi; spoločný `FoldBlock`. | `src/ui/kit/FoldBlock.tsx`, `Majetok.tsx`, `Zavazky.tsx`, `Investicie.tsx` | Neskryje zbalený blok chybu alebo upozornenie (napr. splátka pod úrokom, iná mena)? Otvorí sa blok pri úprave existujúcej položky s údajmi? Súhrny v nadpisoch pravdivé? |

## Zmenené existujúce testy

- Tlačidlo „Exportovať zálohu“ → „Uložiť zálohu“ v E2E testoch; nadpis „Uložiť zálohu“ → „Záloha do súboru“.
- Testy tlačiva klikajú Vyplniť a potom Uložiť; v Daniach bez údajov tlačidlo nie je (`modules`, `tax-form-state`).
- Testy nehnuteľností, záväzkov a investícií volajú `openPropertyFolds` / `openFormFolds` pred vypĺňaním polí.
- `layout-screens`: polia Nastavení sa počítajú bez zbalených blokov.

Over, či niektorá zmena testu nezakrýva chybu.

## Výstup

Nálezy podľa závažnosti (súbor a miesto, problém, dôsledok, návrh, rozhodnutie zakladateľa áno/nie) do `review/revizia-vysledok-2026-10-25c.md`. Neopravuj. Pred pushom `git pull`; pushni len tento súbor.
