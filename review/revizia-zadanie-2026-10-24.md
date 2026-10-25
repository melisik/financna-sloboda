# Zadanie pre externú revíziu zmien z 2026-10-24

> Pokračovanie: `review/revizia-zadanie-2026-10-25.md` (D-290 až D-294).

Pre reviewera v **novej, samostatnej konverzácii** (CLAUDE.md: revízia nesmie byť v tom istom chate, kde sa písalo). Reviewer nie je autor dokumentov ani kódu. Tento podklad pripravil autor zmien; opisuje, čo sa zmenilo a kde, ale nehodnotí, či je to správne.

## Stav

- Repozitár `melisik/financna-sloboda`, vetva `claude/phase2-property-card`. Over `git log -1`; zmeny sú po commit `05fa24e` vrátane.
- **Časť 1 (hlavná):** commity `a2894d3..05fa24e`, teda 14 commitov, rozhodnutia D-281 až D-289 a dokumenty `docs/42` až `docs/44`.
- **Časť 2 (ak ešte neprebehla revízia):** commity `94b91eb..a2894d3`, rozhodnutia D-270 až D-280 a dokumenty `docs/35` až `docs/41`. Autor nevie o externej revízii týchto zmien.
- Stav testov podľa autora (over sám):
  - `tsc` bez chýb;
  - `vitest` 520 testov (92 súborov);
  - Playwright 438 testov (219 × 2 profily).
- Vetva `main` (verejná verzia) tieto zmeny ešte nemá. Zlúčenie je verejný krok a čaká na zakladateľa.

## Časť 1: zmeny na posúdenie

| Rozhodnutie | Čo sa zmenilo | Kde | Na čo sa zamerať |
| --- | --- | --- | --- |
| D-281 | Pruh „Skúšobná verzia“ je zbaliteľný: pri prvom otvorení rozbalený, potom ako ho používateľ nechal. Úvodná veta sa presunula do pruhu. | `docs/42`, `src/ui/Shell.tsx`, `src/ui/trialNotice.ts` | Ostal obsah podľa D-144 celý? Je zbalenie po potvrdení v súlade s D-144? Je otázka 8 v `docs/Podklad_pravne_posudenie.md` položená správne? |
| D-282 | Text výnosu na Prehľade uvádza infláciu z výpočtu (4,2 %, D-263) namiesto napísaných 2 %. | `src/features/prehlad/returnLine.ts` | Sedí text s výpočtom vo všetkých miestach, kde appka infláciu spomína? |
| D-283 | Prehľad začína dátumom cieľa, pokrokom („Pokrok: X % (A z B)“) a posunom od predchádzajúceho vyhodnotenia. Blok Moduly je na telefóne zbalený (spresňuje D-164). | `docs/43` A1, `src/domain/progress.ts`, `src/features/prehlad/Prehlad.tsx`, `progressText.ts`, `src/ui/Sekcie.tsx` | Zhoduje sa pokrok s nehnuteľnosťami (hodnota mínus hypotéka) s `monthsToTargetWithRentals` v mesiaci 0? Je zaokrúhlenie percent nadol správne? Je posun počítaný s dnešnými nastaveniami zrozumiteľný a nezavádzajúci? |
| D-284 | Knižnica skenera `@zxing/library` sa načíta až v Sklade. Hlavný balík klesol z 254 900 B na 137 205 B (gzip). | `src/features/sklad/barcode.ts`, `CameraScanner.tsx`, `Sklad.tsx`, `tests/e2e/bundle.spec.ts` | Je obmedzenie offline (skener funguje bez siete, len ak bol Sklad otvorený online) prijateľné a zapísané? Je oprava vypnutia kamery pri zatvorení počas povolenia správna? |
| **D-285** | **Zmena výpočtu.** Oficiálny dátum cieľa, jeho rozsah, upozornenie na dlhý horizont, pokrok a posun sa počítajú z kapitálu pri poslednom vyhodnotení (K_L), nie z pracovného kapitálu. Predtým sa dátum hýbal s každou transakciou po vyhodnotení. | `src/domain/context.ts` (`evaluated`), `src/domain/scenario.ts`, `Prehlad.tsx`, `docs/43` oddiel 7 | Je to v súlade s FR-04, D-024 a D-121? Používa ešte niektoré miesto pracovný kapitál pre oficiálny cieľ? **Konflikt s D-153** (počas pilotu sa výpočty nemenia, `docs/17` oddiel 8): autor ho zistil dodatočne (`docs/45`, oddiel 6); zakladateľ 2026-10-25 schválil výnimku D-291 (`docs/pilot/zmeny-pocas-pilota.md`). Posúď, či je výnimka oprávnená a či záznam stačí na porovnanie výsledkov pilota. Scenáre Veľký a Mesačný výdavok ostali na pracovnom kapitáli, takže ich „dátum cieľa bez výdavku“ sa môže líšiť od Prehľadu. Je to prijateľné, alebo zavádzajúce? |
| D-286 | Formulár transakcie: suma ako prvé pole, doklad zbalený (sám sa rozbalí, keď v ňom niečo je), v histórii len Upraviť; Prílohy a Zmazať sú v úprave. | `docs/43` oddiel 8, `src/features/transakcie/Transakcie.tsx` | Môže sa chyba v položkách dokladu skryť v zbalenom bloku? Funguje vrátenie zmazania (D-160) a potvrdenie (D-199)? |
| D-287 | Predbežný dopad a Uložiť sú v pruhu prilepenom na spodku obrazovky. | `Transakcie.tsx` | Neskrýva pruh upozornenia alebo potvrdenie vyčerpania investícií? Správanie s klávesnicou na iPhone autor neoveril. |
| D-288 | Predvolený zdroj výdavku je „z príjmu“ podľa D-014; formulár mal od 2026-10-15 „z hotovosti“ bez rozhodnutia. | `Transakcie.tsx`, `docs/41` úloha 2 | Je niekde v dokumentoch ešte uvedené „z hotovosti“ ako predvolené? Scenár Veľký výdavok má vlastné predvolené „z hotovosti“ (D-274). |
| D-289 | Na Prehľade zbalený blok „Vývoj“: graf kapitálu pri vyhodnoteniach s čiarou cieľovej sumy, veta o posune dátumu cieľa od prvého vyhodnotenia a tabuľka. Oprava skloňovania: „mesiace“ len pre 2 až 4, inak „mesiacov“ (22, 63). | `docs/44`, `src/features/prehlad/Vyvoj.tsx`, `src/ui/kit/LineChart.tsx`, `chartGeometry.ts`, `src/domain/progressHistory.ts`, `src/domain/impact.ts` | Nie je graf projekciou v rozpore s D-008? Je mierka od 0 poctivá? Je pravidlo skloňovania (genitív plurálu pri zloženej číslovke písanej dovedna: „22 mesiacov“) v súlade so spisovnou normou? Over v zdroji, autor ho uviedol bez citácie. |

**Dokumenty bez zmeny kódu:**
- `docs/Podklad_pravne_posudenie.md`:
  - riziko 2 a otázka 5 (šifrovaná záloha D-276);
  - riziko 5 (Fáza 2 už nie je verejná, D-248);
  - riziko 9 (odstránená cieľová skupina z iného projektu);
  - nová otázka 8.
- `docs/19`: cieľová skupina podľa `docs/00` a `docs/01`.
- `docs/43`: hodnotenie stavu, ktoré písal autor kódu. Obsahuje dve opravy autorových chýb: C2 bolo už vyriešené (D-132) a tvrdenie o tlačidle Uložiť v A3 nebolo overené.

## Zmenené existujúce testy

Over, či je každá zmena oprávnená (správanie sa zmenilo rozhodnutím), alebo test len prispôsobený, aby prešiel.

| Test | Zmena | Dôvod podľa autora |
| --- | --- | --- |
| `tests/capital.test.ts` (GC-15) | „−154 mesiace“ → „−154 mesiacov“ | `docs/07` GC-15 a názov testu uvádzajú „mesiacov“; D-289 |
| `tests/context.test.ts` | nové testy D-285 | dátum sa po výdavku po vyhodnotení nezmení |
| `tests/scenario.test.ts` | doplnené `evaluated` v ručne skladanom kontexte | nové pole v `Ctx` (D-285) |
| `tests/impact-plural.test.ts` | nový prípad 22 až 24, 63 a pod. | D-289 |
| `tests/e2e/details-control.spec.ts` | „Kapitál: investície“ → „Kapitál pri vyhodnotení: investície“; veta o dani a inflácia 4,2 % | D-281, D-282, D-285 |
| `tests/e2e/same-day-evaluation.spec.ts`, `forgotten-expense.spec.ts` | kontrola pracovného kapitálu v riadku „Po transakciách od vyhodnotenia (predbežne)“ | D-285; pôvodný zámer (D-121, D-123) ostáva |
| `tests/e2e/skip-onboarding.spec.ts` | „Cieľová suma: 648…“ → „Pokrok: … z 648…“ | D-283 |
| `tests/e2e/modules.spec.ts` | Moduly na telefóne zbalené | D-283 (spresňuje D-164) |
| `tests/e2e/home.spec.ts`, `attachments.spec.ts`, `transactions-filter.spec.ts` | Zmazať a Prílohy cez Upraviť | D-286 |
| `tests/e2e/receipt-items.spec.ts`, `receipt-camera.spec.ts` | pred použitím dokladu sa otvorí „Doklad“ | D-286 |
| `tests/e2e/m3-transactions.spec.ts`, `threshold.spec.ts` | „(z hotovosti)“ → „(z príjmu)“ v očakávanom texte riadku | D-288; testy overujú prah, nie zdroj |

## Časť 2: D-270 až D-280 (ak ešte neprebehla revízia)

| Rozhodnutie | Téma | Dokument |
| --- | --- | --- |
| D-270 až D-273 | Súkromný náhľad Fázy 2 na Cloudflare Pages, heslo a prihlasovacia cookie (`preview/_worker.js`) | `docs/35` |
| D-274, D-275 | Scenár veľkého výdavku (N-12) a mesačného výdavku (N-12b) | `docs/36`, `docs/37` |
| D-276 | Šifrovaná záloha: PBKDF2-SHA256 600 000 iterácií, AES-GCM-256 | `docs/38` |
| D-277 | Týždenný súhrn mailom (odkaz `mailto:`) | backlog N-10 |
| D-278, D-279 | Jednotný vizuálny štýl, výška menu na telefóne | `docs/39`, `docs/40` |
| D-280 | Pripomienky v náhľade len formulárom | `docs/41` |

Pri D-271 až D-273 a D-276 zameraj pozornosť na bezpečnosť:
- podpis cookie a jej platnosť;
- čo sa stane bez nastaveného hesla;
- odvodenie kľúča a formát šifrovanej zálohy.

## Mimo rozsah

- Funkcie Fázy 2, ktoré sa 2026-10-24 nemenili (majetok, záväzky, dane, sklad okrem skenera).
- Brány G1 až G5 a právne posúdenie samotné.
- Vizuálny dizajn nad rámec toho, čo mení čitateľnosť alebo význam.

## Známe obmedzenia (uvedené vedome)

- Prilepený pruh v Transakciách nie je overený na iPhone s otvorenou klávesnicou.
- Skener funguje offline, len ak bol Sklad aspoň raz otvorený online.
- Pri šírke 320 × 844 px je „Pridať transakciu“ na Prehľade pod okrajom obrazovky (873 px); pri 390 × 844 px nad ním (777 px).
- Graf vývoja neobsahuje nehnuteľnosti v prenájme, lebo ich minulé hodnoty sa neukladajú; appka to pri grafe vysvetlí.
- Dátumy cieľa pre minulé vyhodnotenia sa počítajú s dnešnými nastaveniami a dnešnými hodnotami nehnuteľností (rovnako ako Ročný prehľad).

## Čo chceme ako výstup

- Zoznam nálezov zoradený podľa závažnosti (kritický, vysoký, stredný, nízky). Pri každom uveď:
  - súbor a miesto;
  - problém;
  - dôsledok;
  - návrh;
  - či ide o rozhodnutie zakladateľa.
- Osobitne:
  - či niektorá zmena testu len zakrýva chybu;
  - či D-285 nemá ďalšie miesta s pracovným kapitálom v oficiálnom cieli.
- Súhrn: čo je v poriadku a čo treba opraviť pred zlúčením do `main`.
- Nerozhoduj za zakladateľa. Neopravuj, len hláš.

## Ako overiť lokálne

```
git checkout claude/phase2-property-card
npm ci
npx tsc --noEmit
npm test                 # vitest, 520 testov
npx playwright test      # 438 E2E testov (desktop a mobile-390)
git log --oneline a2894d3..HEAD
git diff --stat a2894d3..HEAD
```
