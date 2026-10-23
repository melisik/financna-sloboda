# Finančná sloboda (pracovný názov) – projektový kontext

## Stav projektu
Fáza: MVP je zadefinovaný rozhodnutiami (`decisions/Decisions.md`, D-001 až D-072) a čiastočne implementovaný. Cieľ, cieľová skupina a rozsah MVP vyplývajú z týchto rozhodnutí; nie sú to predpoklady. Kód je v `src/` (doménová vrstva, úložisko, UI), testy v `tests/` a `tests/e2e/`.

Stav overený 2026-10-23 (vetva `claude/phase2-property-card`): `tsc` bez chýb, `vitest` 348 jednotkových testov (61 súborov), `vite build` (dist-test) bez chýb, `playwright` 346 E2E testov (173 × 2 profily) bez zlyhaní. Audit a stav nálezov sú v `docs/22_Audit_2026-10-22.md` a `docs/24_Audit_2026-10-23.md`; úplnosť milníkov a otvorené nálezy revízie sú v `review/revizia-revizny-balik-2026-10-15.md`; brána M1 je potvrdená zakladateľom 2026-10-22 (D-225).

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
