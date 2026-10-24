# 39 – Návrh: jednotný vizuálny štýl (tokeny)

> Stav: **schválené a implementované** (D-278, 2026-10-24). Schválené s odporúčanými voľbami z oddielu 6. Mení sa len vzhľad: žiadne výpočty, dáta, texty tlačidiel ani popisky polí.

## 1. Stav (zistené 2026-10-24)

- **Farby** sú už premenné v `index.html` (svetlý režim, tmavý režim cez systém aj cez prepínač). Všetky dvojice text/pozadie v oboch režimoch majú kontrast aspoň 6,8 : 1 (WCAG AA vyžaduje 4,5 : 1). Farby netreba meniť.
- **Inline štýly:** 517 výskytov `style={{`. Veľkosti písma: `0.9rem` (106×), `1rem` (26×), `1.1rem` (11×), `1.05rem` (5×), `0.95rem` (3×), `0.85rem` (3×), `1.5rem` (2×), `1.25rem` (1×). Mimo troch hodnôt je 25 výskytov.
- **Tlačidlá:** sekundárne `btn` sa používa 122×, hlavné `btnPrimary` 43×. Pomocný odkaz `NextStep` používa `btn` (20×), preto vyzerá ako hlavná akcia. 19 miest prepisuje `btn` inline.
- **Opakované boxy:** muted text 109×, varovanie (`--warn-bg`) 29×, karta s rámikom 28×, podnadpis `h3` inline 3×.

## 2. Navrhované tokeny

**Farby** (hodnoty existujúcich premenných sa nemenia), pridajú sa:
- `--focus`: viditeľný okraj pri klávesnici (`outline: 3px solid var(--focus)`). Svetlý režim `#1f4e79` (kontrast 7,95 : 1), tmavý `#8ab4f8` (8,58 : 1).
- `--link`: odkazy v texte a pomocné odkazy. Rovnaké hodnoty ako `--focus` (7,95 : 1 a 8,58 : 1 na pozadí stránky).

**Typografia:** štyri veľkosti, všetky ostatné sa nahradia najbližšou:
- `--font-text` = `1rem`: text, polia, tlačidlá.
- `--font-small` = `0.9rem`: pomocný a muted text.
- `--font-heading` = `1.25rem`: nadpis sekcie.
- `--font-title` = `1.5rem`: nadpis aplikácie (už existuje v `Shell`).
- Podnadpis `h3`: `--font-text`, tučný, odsadenie nad 16 px (nahradí 3 inline výskyty).

**Tlačidlá:**
- `btnPrimary`: hlavná akcia obrazovky (uložiť, pridať). Jedna na obrazovku, na konci formulára, na telefóne na plnú šírku. Zachová sa existujúci štýl.
- `btn`: sekundárna akcia (rozpis, export, ostatné). Zachová sa existujúci štýl.
- `btnDanger`: zmazanie. Zachová sa.
- `btnLink` (nový): bez rámika, text v `--link`, podčiarknutý, výška aspoň 44 px. Pre pomocné odkazy a `NextStep`.

**Komponenty** (nové v `src/ui/kit/controls.tsx`):
- `Callout` s tónmi `info`, `warn`, `ok`, `error`: odsadenie 12 px, zaoblenie 6 px, ľavý okraj 4 px farbou tónu, text vždy `--text`. Nahradí 49 inline boxov (warn 29, ok 6, error 1 a ďalšie v kóde).
- `Card`: rámik `1px solid var(--border)`, odsadenie 12 px, zaoblenie 6 px, pozadie `--surface`. Nahradí 28 opakovaní.
- `hintStyle`: `--muted` a `--font-small`. Nahradí 109 opakovaní.

## 3. Súbory, ktorých sa to týka (odhad)

- `index.html`: nové premenné, `:focus-visible`, typografické tokeny.
- `src/ui/kit/controls.tsx`: `btn`, `btnPrimary`, `btnDanger`, nový `btnLink`, `inp`, `Section`, nové `Callout`, `Card`, `hintStyle`.
- `src/ui/kit/NextStep.tsx`: prechod na `btnLink`.
- Obrazovky s mimo-token veľkosťami písma: `Dane`, `Investicie`, `Majetok`, `Prijmy`, `Transakcie`, `Lock`, `Zavazky`, `ErrorBoundary`, `Moduly`, `Shell`, `Sprievodca` (11 súborov).
- Obrazovky s inline boxmi upozornení: 13 súborov (prekrýva sa s predchádzajúcim zoznamom).
- Obrazovky s `btn` a inline prepisom: 8 súborov.
- Spolu odhadom **20–25 súborov**. Nemenia sa `src/domain/`, `src/storage/` ani testy výpočtov.

Mimo rozsahu: prepísanie všetkých 517 inline štýlov naraz. Zmena sa robí len pre tokeny a najčastejšie opakovania.

## 4. Čo sa zmení a čo nie

- **Mení sa:** veľkosti písma, vzhľad pomocných odkazov, výraznosť hlavnej akcie, jednotné upozornenia a karty, viditeľný okraj pri klávesnici.
- **Nemení sa:** farby, texty tlačidiel a popiskov, správanie, dáta, výpočty.

## 5. Postup po schválení

1. **Tokeny a komponenty:** `index.html`, `controls.tsx` (`Callout`, `Card`, `hintStyle`, `btnLink`, typografia). Bez zmeny obrazoviek.
2. **Pomocné odkazy:** `NextStep` na `btnLink`, overenie na všetkých obrazovkách, kde sa používa.
3. **Obrazovky:** najprv upozornenia a karty, potom veľkosti písma, nakoniec inline `btn` prepisy.
4. **Overenie** po každom kroku: `tsc`, `vitest`, celé Playwright. Už existujúce testy `tests/e2e/a11y.spec.ts` kontrolujú WCAG 2.1 AA a vodorovné posúvanie pri 320 px.
5. **Ručne:** 390 px a 1280 px, svetlý aj tmavý režim.

## 6. Otázky na schválenie

1. **Hlavná akcia:** na konci formulára (odporúčam), alebo prilepená spodná lišta na telefóne?
2. **Pomocné odkazy:** textové odkazy `btnLink` (odporúčam), nie rámiky.
3. **Tóny upozornení:** `info`, `warn`, `ok`, `error` stačia?
4. **Rozsah:** tokeny, komponenty a najčastejšie opakovania (odporúčam), nie všetky 517 inline štýlov naraz.

## 7. Výsledok implementácie (2026-10-24)

- **Tokeny** v `index.html`: `--focus`, `--link`, `--warn-border` vo svetlom aj v oboch tmavých režimoch; `--font-text`, `--font-small`, `--font-heading`, `--font-title`; `:focus-visible` s okrajom 3 px. Test: `tests/design-tokens.test.ts`.
- **Komponenty** v `src/ui/kit/controls.tsx`: `btnLink`, `card`, `hintStyle`, `calloutStyle` a `Callout` (tóny info, warn, ok, error). `btn`, `inp`, `Section` a popisky polí používajú typografické tokeny.
- **Pomocné odkazy:** `NextStep` používa `btnLink` (textový odkaz, bez rámika). Záporný zvislý okraj zachová dotykovú výšku 44 px a nezväčší riadok textu.
- **Výška tlačidiel:** `btn` a `btnLink` majú `box-sizing: border-box`. Odkazy v štýle tlačidla mali predtým 60 až 62 px, teraz majú 44 px rovnako ako tlačidlá.
- **Obrazovky:** veľkosti písma v 27 súboroch prešli na tokeny (odchýlky 0,85; 0,95; 1,05; 1,1 rem na najbližší token). Presné vzory: pomocný text 26×, varovanie 18×, ok 1×, chyba 1×, karta 2×.
- **Ostáva inline:** varianty, ktoré sa presne nezhodujú so vzorom (napr. karta s vlastným okrajom, varovanie s inou veľkosťou písma). Nemenil som ich, aby sa nezmenilo rozloženie; dajú sa migrovať postupne.
- **Hlavná akcia:** na obrazovkách Prehľad, Transakcie a Dane je hlavná akcia na konci formulára alebo bloku. Umiestnenie na ostatných obrazovkách som neprepracoval.
- **Overenie:** `tsc` bez chýb, `vitest` 483 testov (85 súborov), Playwright 392 testov vrátane testov dostupnosti WCAG 2.1 AA. Kontrola vodorovného posúvania všetkých 16 sekcií pri 390 px a 1280 px bez nálezu. Snímky Prehľadu, Transakcií a Daní pri 390 a 1280 px skontrolované.
