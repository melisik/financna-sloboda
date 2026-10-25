# Zadanie pre externú revíziu zmien z 2026-10-24 a 2026-10-25

Pre reviewera v **novej, samostatnej konverzácii** (CLAUDE.md: revízia nesmie byť v tom istom chate, kde sa písalo). Reviewer nie je autor dokumentov ani kódu. Tento podklad pripravil autor zmien; opisuje, čo sa zmenilo a kde, ale nehodnotí, či je to správne.

Nadväzuje na `review/revizia-zadanie-2026-10-24.md`. Ak revízia podľa toho podkladu ešte neprebehla, urob najprv ju (časť 2 nižšie).

## Stav

- Repozitár `melisik/financna-sloboda`, vetva `claude/phase2-property-card`. Over `git log -1`; zmeny sú po commit `604a589` vrátane.
- **Časť 1 (hlavná):** commity `bd78c0b..604a589`, rozhodnutia D-290 až D-294 a dokumenty `docs/45`, `docs/46` a `docs/pilot/zmeny-pocas-pilota.md`.
- **Časť 2 (ak ešte neprebehla):** všetko z `review/revizia-zadanie-2026-10-24.md` (D-270 až D-289, commity `94b91eb..05fa24e`).
- Stav testov podľa autora (over sám):
  - `tsc` bez chýb;
  - `vitest` 529 testov (93 súborov);
  - Playwright 456 testov (228 × 2 profily).
- Vetva `main` (verejná verzia) tieto zmeny ešte nemá. Zlúčenie je verejný krok a čaká na zakladateľa.
- Súkromný náhľad pre testerov (Cloudflare Pages z tejto vetvy, D-270) zmeny už má. Testeri ich teda vidia počas pilota.

## Časť 1: zmeny na posúdenie

| Rozhodnutie | Čo sa zmenilo | Kde | Na čo sa zamerať |
| --- | --- | --- | --- |
| D-290 | V sekcii Mesačný výdavok je blok „Opakované výdavky a dátum cieľa“: pri pravidelných výdavkoch a priemeroch kategórií za posledné 3 celé mesiace ukáže, o koľko mesiacov skôr by bol cieľ, keby sa suma investovala. Testovacia záloha má 23 transakcií namiesto 12. | `docs/45`, `src/domain/recurringImpact.ts`, `src/features/mesacny-vydavok/`, `public/testovacia-zaloha.json`; `eurKeep` presunutý z `progressText.ts` do `src/ui/kit/format.ts` bez zmeny správania | Je výpočet opakom D-275 a používa kapitál z posledného vyhodnotenia (D-285)? Ráta sa ročný výdavok ako ročná suma / 12 (D-124)? Je pravidlo „aspoň 3 celé mesiace histórie“ správne pri začiatku a konci mesiaca? Nepôsobí text ako odporúčanie alebo výčitka (D-275, pravidlá kvality v CLAUDE.md)? Neobsahuje testovacia záloha skutočné údaje? |
| D-291 | Výnimka z D-153 pre D-285 (zmena výpočtu dátumu cieľa počas pilota). | `decisions/Decisions.md`, `docs/45` oddiel 6, `docs/pilot/zmeny-pocas-pilota.md` | Je výnimka oprávnená? Stačí záznam na férové porovnanie výsledkov pilota? |
| D-292 | Výnimka z D-153 pre D-254, D-255, D-256 a D-263 (zmeny výpočtu z 2026-10-23 schválené bez výnimky). | ako D-291 | Ako D-291. Navyše: je výnimka zapísaná dodatočne prijateľný postup, alebo treba upraviť proces (`docs/17` oddiel 8)? |
| — | Záznam všetkých zmien kódu od začiatku pilota (2026-10-21): zmeny výpočtu, ktorú verziu mal kto, zmeny UI, rozhodnutia bez zmeny správania a výnimky. Zostavil ho autor kódu z `decisions/Decisions.md`. | `docs/pilot/zmeny-pocas-pilota.md` | Je zoznam úplný? Over náhodne niekoľko rozhodnutí z D-133 až D-294, či sú zaradené správne (výpočet, UI, bez zmeny správania). Nie je niektorá zmena výpočtu zaradená ako UI? |
| D-293 | Usporiadanie obrazoviek (`docs/46`, priority 1 a 2). Nastavenia v skupinách, Moduly, Sprievodca a PIN zbalené. Rozpočet ako prehľad, polia až po „Upraviť limity“. Pravidelné výdavky: pri položke len Upraviť, Ukončiť a Zmazať v úprave. Transakcie: filter zbalený, 10 záznamov a „Zobraziť staršie“. Ročný prehľad: nové poradie, zbalené Vyhodnotenia, porovnanie s minulým rokom len pri údajoch. Dane: bez investícií jedna veta namiesto kariet s nulami. | `docs/46` (oddiely 3 a 8), `src/features/nastavenia/Nastavenia.tsx`, `src/features/zamok/Lock.tsx`, `src/ui/Sekcie.tsx`, `src/features/rozpocet/Rozpocet.tsx`, `src/features/pravidelne/Pravidelne.tsx`, `src/features/transakcie/Transakcie.tsx`, `src/features/rocny-prehlad/RocnyPrehlad.tsx`, `src/features/dane/Dane.tsx` | Mení sa naozaj len UI, nie výpočet (D-153)? Neskrýva niektorý zbalený blok chybu alebo upozornenie (`docs/46` oddiel 1, zásada 3)? Súčet v histórii ráta všetky transakcie vo filtri, nie 10 zobrazených; je text „Súčet transakcií spolu / vo filtri“ jednoznačný? Dane ukážu karty už pri jednej investícii bez režimu (odchýlka od návrhu, `docs/46` oddiel 8): je to správne? Je Ukončiť v úprave pravidelného výdavku stále dosť nájditeľné? Ostáva potvrdenie zmazania (D-199)? |
| D-294 | Záloha v dvoch častiach s nadpismi „Uložiť zálohu“ a „Obnoviť zo zálohy“; správa o exporte je pod tlačidlom Exportovať. | `docs/46` oddiel 8.1, `src/features/zaloha/BackupSection.tsx` | Nie je upozornenie pred nahradením dát (že sa prepíšu) menej viditeľné? Zobrazí sa správa o exporte pri zrušení aj pri krátkom hesle? |

**Dokumenty bez zmeny kódu:**
- `docs/41` (návod pre testerov): úloha 2 a nová úloha 6 (Rozpočet a pravidelné výdavky); číslovanie úloh 7 až 10. Sedí návod s appkou?
- `docs/13` (zoznam obrazoviek): stĺpec poznámok podľa D-293 a D-294; Záloha už nie je „šifrovanie odložené“.

## Zmenené existujúce testy

Over, či je každá zmena oprávnená (správanie sa zmenilo rozhodnutím), alebo test len prispôsobený, aby prešiel.

| Test | Zmena | Dôvod podľa autora |
| --- | --- | --- |
| `tests/backup-v2.test.ts`, `tests/demo-backup.test.ts`, `tests/e2e/testable.spec.ts` | počet transakcií v testovacej zálohe 12 → 23 | D-290: doplnená história júl až september |
| `tests/e2e/helpers.ts` | nové pomocné funkcie `openDetails` (otvorí zbalený blok, ak je zatvorený) a `openBudgetLimits` (klikne Upraviť limity, ak je vidno) | D-293 |
| `annual-summary`, `modules`, `pin-limit`, `pin-recovery`, `rerun-wizard`, `text-fixes`, `m3-transactions`, `transactions-filter`, `budget`, `flow-links`, `home-month` (`tests/e2e/*.spec.ts`) | pred použitím poľa sa otvorí zbalený blok alebo „Upraviť limity“ | D-293; overované správanie sa nemení |
| `tests/e2e/budget-ux.spec.ts` | „Zatiaľ nie je nastavený žiadny limit.“ → „Plán ešte nie je nastavený.“; „Plán spolu: 150 €“ → „… z plánu 150 €“; „Prekročené o 40 €.“ pod poľom → „prekročené o 40 €“ v riadku kategórie | D-293: súhrn a zoznam namiesto polí |
| `tests/e2e/budget.spec.ts`, `recurring-expenses.spec.ts` | text pod poľom limitu („minuté tento mesiac … ; zostáva …“) → riadok kategórie („jedlo: minuté … · limit … · zostáva …“) | D-293 |
| `tests/e2e/recurring-end.spec.ts`, `recurring-expenses.spec.ts` | Ukončiť od zajtra a Zmazať až po kliknutí na Upraviť | D-293 |
| `tests/e2e/text-fixes.spec.ts` | „Súčet zobrazených transakcií“ → „Súčet transakcií spolu“ | D-293: zobrazuje sa 10 záznamov, súčet ráta všetky |

Nové testy: `tests/recurring-impact.test.ts`, `tests/e2e/recurring-impact.spec.ts` (D-290), `tests/e2e/layout-screens.spec.ts` (D-293, D-294).

## Mimo rozsah

- Funkcie, ktoré sa od 2026-10-24 nemenili.
- Brány G1 až G5 a právne posúdenie samotné.
- Vizuálny dizajn nad rámec toho, čo mení čitateľnosť alebo význam.

## Známe obmedzenia (uvedené vedome)

- Prilepený pruh v Transakciách (D-287) nie je overený na iPhone s otvorenou klávesnicou.
- Stránka Záloha je po D-294 o 67 px dlhšia (dva nadpisy a oddelenie).
- Merania dĺžky stránok v `docs/46` sú z testovacej zálohy, nie z reálneho používania.

## Čo chceme ako výstup

- Zoznam nálezov zoradený podľa závažnosti (kritický, vysoký, stredný, nízky). Pri každom uveď:
  - súbor a miesto;
  - problém;
  - dôsledok;
  - návrh;
  - či ide o rozhodnutie zakladateľa.
- Osobitne:
  - či niektorá zmena testu len zakrýva chybu;
  - či D-293 alebo D-294 nemení výpočet;
  - či je `docs/pilot/zmeny-pocas-pilota.md` úplný.
- Súhrn: čo je v poriadku a čo treba opraviť pred zlúčením do `main`.
- Nerozhoduj za zakladateľa. Neopravuj, len hláš.

## Ako overiť lokálne

```
git checkout claude/phase2-property-card
npm ci
npx tsc --noEmit
npm test                 # vitest, 529 testov
npx playwright test      # 456 E2E testov (desktop a mobile-390)
git log --oneline bd78c0b..HEAD
git diff --stat bd78c0b..HEAD
```
