# Zadanie pre formálnu revíziu kódu a dokumentov

Pre reviewera v **novej, samostatnej konverzácii** (CLAUDE.md: revízia nesmie byť v tom istom chate, kde sa písalo). Reviewer nie je autor.

## Stav
- Repozitár: `melisik/financna-sloboda`, vetva `main`, commit `b77cd05` (alebo novší; over `git log -1`).
- Dokumenty a rozhodnutia: `docs/00`–`08`, `decisions/Decisions.md` (D-001 až D-050), `review/`.
- Kód: `src/` (doména, úložisko, UI), testy: `tests/` (50 jednotkových, 6 E2E).
- Nasadenie: https://melisik.github.io/financna-sloboda-app/ (verejné repo s buildom).
- Overenie na zariadení: iPhone 16, iOS 26.6.2, `review/ios-overenie.md`.

## Rozsah
1. **Dokumenty vs. kód:** či kód zodpovedá FR-01 až FR-19, UR-01 až UR-12 a rozhodnutiam D-001 až D-050. Najdôležitejšie: FR-02 (vetvy vzorca, dátum od D_L), FR-04 (dopad, surový rozdiel, dni pod mesiac), FR-05, FR-08 a D-045 (zdroje úhrady), D-046 (m_cash iterácia), D-047 (rezerva), FR-17 a FR-18 (záloha, atomický import), FR-10 a FR-19 (pripomienky).
2. **Výpočty:** golden cases GC-01 až GC-22 (`docs/07` §3) oproti `src/domain/`. Pozor na tvar pri m_cash > 0 (iterácia, interpolácia) a pri r = 0.
3. **Úložisko:** `src/storage/`. Validácia, atomicita zápisu (`replaceAll`), chybové cesty.
4. **Súkromie:** sieťový test a `public/sw.js`: žiadne požiadavky mimo vlastného pôvodu, žiadne logovanie finančných údajov.
5. **Testy:** či pokrývajú to, čo tvrdia dokumenty; či sú testy správne, nie len zelené.

## Mimo rozsah (neposudzuj)
- Vizuálny dizajn, tmavý režim, zoom 200 % a čítačky (M6, odložené na neskôr).
- Prehľad spotreby pravidelná vs. cielená (odložený, D-038).
- Nehnuteľnosti, daňové režimy, export so šifrovaním (backlog, `docs/08`).

## Známe obmedzenia (uvedené vedome)
- **Rezerva:** vklad do rezervy znižuje K_cash a výber ho zvyšuje (`src/app/ledger.ts`). Je to interpretácia, nie je zapísaná v `Decisions.md`. Over, či je v súlade s D-037 a D-047.
- **Presun a m_cash:** D-041 a D-046 sú implementované, ale v UI sa m_cash zadáva len ako mesačné sporenie, bez vplyvu na rezervu.
- **Zmena vyhodnotenia:** pri viacerých vyhodnoteniach sa berie najnovšie podľa dátumu (FR-05). Overiť, či sa staré nezapočítavajú dvakrát.
- **iOS:** správanie úložiska v Safari (7 dní bez interakcie, D-035) je overené len na appke z plochy; Safari tab sa test neaktivity ešte neskončil.
- **Android:** nie je testovaný.

## Čo chceme ako výstup
- Zoznam nálezov zoradený podľa závažnosti (kritický, vysoký, stredný, nízky). Pri každom: súbor a sekcia, problém, dôsledok, návrh, a či ide o rozhodnutie zakladateľa.
- Súhrn: čo je v poriadku a čo treba opraviť pred ďalším krokom.
- Nerozhoduj za zakladateľa; nepreprisuj kód ani dokumenty celé.
- Neopravuj, len hláš. Opravy urobí autor v ďalšom kroku.

## Ako overiť lokálne
```
npm ci
npm test            # 50 jednotkových testov
npx tsc -p tsconfig.json
npx playwright install --with-deps chromium   # alebo použi preinštalovaný prehliadač
npx playwright test # 6 E2E testov
```
