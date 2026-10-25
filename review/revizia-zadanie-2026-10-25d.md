# Zadanie pre externú revíziu zmien D-313 až D-318 (2026-10-25)

Pre reviewera v **novej, samostatnej konverzácii** (CLAUDE.md). Reviewer nie je autor. Podklad pripravil autor zmien; opisuje, čo a kde sa zmenilo, nehodnotí to. Nadväzuje na `review/revizia-vysledok-2026-10-25c.md` (D-305 až D-311).

## Stav

- Vetva `claude/phase2-property-card`, zmeny od `c0b3af4` po `a91e07c` (D-313 začína commitmi `c5b177f`, `0137edc`, `dcc5641`). `main` je zlúčený (`a91e07c`).
- Podľa autora: `tsc` bez chýb, `vitest` 547 (96 súborov), Playwright 516 (258 × 2). Over sám; pri Playwrighte aj s písmom DejaVu Sans (D-304). Špecifikácia `receipt-camera` má vlastné `launchOptions`; v prostredí bez predinštalovaného prehliadača pre ňu použi `executablePath` (revízia 25c).
- Podklady: `docs/57` (formulár transakcie), `docs/58` (zadávanie dokladu), `docs/pilot/scenar-formular-transakcie-2026-10-25.md` (prehliadka zakladateľa).

## Zmeny na posúdenie

| Rozhodnutie | Čo | Kde | Na čo sa zamerať |
| --- | --- | --- | --- |
| D-313 | Formulár výdavku v dvoch režimoch: Rýchly výdavok (pole Suma) a Nákup po položkách (suma = súčet položiek, pole Suma sa neukáže). Zľava ako záporná položka. Potvrdenie po uložení so Zobraziť v histórii a Pridať do skladu. Validácia zálohy pripúšťa zápornú cenu položky. | `src/features/transakcie/Transakcie.tsx`, `src/storage/validate.ts` | Môže vzniknúť výdavok so sumou inou než súčet položiek (úprava, prepínanie režimu, typ príjem, prázdny zoznam)? Záporný alebo nulový súčet? Zmena typu na príjem pri vyplnených položkách? Čo sa uloží pri úprave starého výdavku s položkami, ktorých súčet nesedel (upozornenie „Pôvodná suma bola…“)? Prijme validácia zálohy nezmyselné položky (napr. len zľava)? |
| D-314 | Tlačivo 17-dp-md sa po zmene psa, nehnuteľnosti alebo dňa zahodí. Export zálohy pri `NotAllowedError` nestiahne súbor, ale ponúkne Uložiť pripravenú zálohu. | `src/features/dane/Dane.tsx`, `src/features/zaloha/BackupSection.tsx`, `src/ui/Sprievodca.tsx` | Kľúč údajov (`JSON.stringify`) pri veľkých dátach; prípad, keď sa údaje zmenia počas vypĺňania. Pripravená záloha v pamäti: zahodí sa pri zmene dát? Sprievodca pri `needsTap` (uvoľnenie URL). |
| D-315 | Nízke nálezy 25c: dátum zostatku záväzku pri zostatku, súhrny blokov, `FoldBlock.reopenOn`, krok „príprava údajov“, Chýbajúce na zoznam pri chybe, potvrdenie nastavení pri tlačidle. | `FoldBlock.tsx`, `Majetok.tsx`, `Zavazky.tsx`, `Investicie.tsx`, `Sklad.tsx`, `Sekcie.tsx` | Otvára `reopenOn` blok aj pri rovnakej chybe po zbalení? Súhrn Hypotéky pri splátke bez zostatku otvorí blok aj pri bežnej úprave – je to žiaduce? |
| D-317 | + a − pri množstve položky; veta o module Sklad v potvrdení. | `Transakcie.tsx`, `Sekcie.tsx` | Zaokrúhlenie sumy riadku pri desatinnom množstve (0,532 kg + 1). |
| D-318 | Zrušené vkladanie textu z portálu a parser; blok Overiť doklad (QR); návrhy položiek (`datalist`) z predchádzajúcich nákupov a skladu s doplnením poslednej ceny. | `Transakcie.tsx`; zmazané `src/domain/receiptItems.ts`, `tests/receiptItems.test.ts` | Ostali odkazy na parser alebo text v dokumentácii (`docs/41`, návod)? Návrhy: poradie „poslednej“ ceny, zľavy a ceny 0, veľký počet položiek, zobrazenie na iPhone (Safari a `datalist`). Doplnenie ceny len pri prázdnom poli. |

## Zmenené existujúce testy

- `receipt-items`, `receipt-camera`, `receipt-qr`, `stock-waste`, `clarity-55`, `transactions-quick`: najprv prepnú na Nákup po položkách; text z portálu nahradili ručné položky.
- `review-b-fixes` S-2: test nesúladu súčtu nahradil test „nákup bez položiek sa neuloží“ (nesúlad pri D-313 nemôže nastať).
- Nové: `transaction-modes`, `fold-behavior`, doplnky `tax-form-state` a `backup-share`.

Over, či niektorá zmena testu nezakrýva chybu.

## Výstup

Nálezy podľa závažnosti (súbor a miesto, problém, dôsledok, návrh, rozhodnutie zakladateľa áno/nie) do `review/revizia-vysledok-2026-10-25d.md`. Neopravuj. Pred pushom `git pull`; pushni len tento súbor na vetvu `claude/phase2-property-card`.
