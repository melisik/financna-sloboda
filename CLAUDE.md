# Compaven (pracovný názov) – projektový kontext

## Stav projektu
Fáza: MVP je zadefinovaný rozhodnutiami (`decisions/Decisions.md`, D-001 až D-345) a čiastočne implementovaný. Cieľ, cieľová skupina a rozsah MVP vyplývajú z týchto rozhodnutí; nie sú to predpoklady. Kód je v `src/` (doménová vrstva, úložisko, UI), testy v `tests/` a `tests/e2e/`.

Stav overený 2026-10-30 (vetva `claude/compaven-d340-d345`, osem commitov nad `76bf0e1`, HEAD `42cc5f6` pred docs commitom): `tsc` bez chýb; `vitest` 720 jednotkových testov v 111 súboroch; `vite build` (aj s `VITE_PHASE2=1`) bez chýb; `playwright` 606 vykonaní (303 testov × 2 profily). Po commite 7 prešlo 604 vykonaní, 2 zlyhali pre pevný port v `offline.spec.ts` (opravené v `42cc5f6`). Na `42cc5f6` sa nedosiahol jeden čistý zelený plný beh, lebo hostiteľ mal málo pamäte: pri 4 workeroch 600 z 606 (zlyhania boli vyčerpané zdroje a časové limity), pri 2 workeroch 605 z 606; dotknuté testy samostatne prešli (116 z 116 s jedným workerom, `review-b-fixes` 72 z 72 opakovaní). Jednotkové testy, cielené E2E a plné E2E behy sa počítajú samostatne. Kalendár povinností, prepojenie s transakciami, deň splatnosti a pravidlo „platba pravidelnej povinnosti sa v rozpočte nerátá druhýkrát“ sú v D-345; viacmenové transakcie v D-340 (Nastavenia mien zatiaľ bez rozhrania, `docs/70`). Audit a stav nálezov sú v `docs/66_Audit_2026-10-26.md` (predchádzajúce: `docs/22_Audit_2026-10-22.md`, `docs/24_Audit_2026-10-23.md`, `docs/27_Audit_2026-10-23.md`, `docs/54_Audit_2026-10-24.md`, `docs/59_Audit_2026-10-25.md`); úplnosť milníkov a otvorené nálezy revízie sú v `review/revizia-revizny-balik-2026-10-15.md`; brána M1 je potvrdená zakladateľom 2026-10-22 (D-225).

Všetko, čo nie je v `docs/` alebo `decisions/`, je predpoklad a treba ho ako predpoklad označiť.

Projekt je len o osobnej finančnej slobode. Nesúvisí s projektom `spolu-na-ceste` (podpora navigácie pre rodiny).

## Úloha AI
Claude pracuje ako člen produktového tímu: píše dokumentáciu, rozpracúva koncepty, navrhuje riešenia a vedie iterácie dokumentov.

## Externá revízia
Dokumenty reviewuje nezávislý reviewer. Od 2026-10-13 je to aplikácia Claude (nahradila ChatGPT). Reviewer nie je autor dokumentov.

## Pracovný proces
1. Pred novým návrhom skontrolovať existujúce dokumenty a rozhodnutia.
2. Upozorniť na konflikty a navrhnúť riešenie.
3. Až potom vytvoriť alebo upraviť artefakt ako samostatný Markdown súbor.
4. Finálne rozhodnutia zapísať do `decisions/Decisions.md`.

## Pravidlá kvality
Upozorniť, ak návrh vytvára právne, regulačné, bezpečnostné alebo privacy riziko, technický dlh, alebo ak je zavádzajúci voči používateľovi. Keďže ide o financie, finančné tvrdenia a odporúčania treba odlíšiť od všeobecnej edukácie a overiť.

## Zdroj pravdy
Dokumenty v tomto repozitári. História chatu nie je dokumentácia.

## Práca na repozitári
- Zdroj pravdy je GitHub repozitár `melisik/financna-sloboda`. Pred každou úpravou `git pull`, po každej zmene commit a `git push`.
- Osobné finančné údaje (skutočné transakcie, zostatky, účty) do repozitára **nepatria**, ani lokálne commity. Testy používajú len syntetické alebo anonymizované dáta.
- Externú revíziu robí samostatná konverzácia, nie ten istý chat, v ktorom sa dokument písal.

## Jazyk
Slovenčina.

## Nezávislosť
Projekt nie je naviazaný na žiadny iný projekt. Prevzatie čohokoľvek z iných projektov musí byť výslovné a zapísané v rozhodnutiach.
