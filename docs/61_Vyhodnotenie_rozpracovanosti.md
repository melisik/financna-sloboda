# 61 – Vyhodnotenie: čo ostalo rozpracované a nedokončené (2026-10-26)

> Stav: **rozhodnuté** (2026-10-26, D-325): 1 až 4 áno. Zostavil autor kódu z `docs/06` (roadmapa), `docs/04` (FR), `docs/07`, `docs/08` (backlog), `docs/60`, `decisions/Decisions.md` (D-001 až D-324) a kódu na `main` (`f7be2c3`). Na rozdiel od `docs/60` (čo vidí tester) pokrýva celý vývoj: milníky, pilot, Fázu 2, brány a dokumentáciu. Čo nie je v dokumentoch, je označené ako predpoklad.

## 1. Zhrnutie

| Oblasť | Stav | Čo chýba | Kto |
| --- | --- | --- | --- |
| **Fáza 1 – MVP (M1 až M7)** | takmer hotová | 2 ručné overenia (oddiel 2) | zakladateľ |
| **Fáza 1b – Pilot** | **len formálne začatý** | žiadne zápisy, žiadni testeri, žiadne vyhodnotenia za pilot | zakladateľ |
| **Fáza 2 – funkcie** | jadro hotové, okraje nedokončené | dane (výpočet, priznanie, termíny), import cien investícií, integračná služba | zakladateľ (zdroje), autor |
| **Fáza 2 – brány** | G2, G3 splnené | G1 právnik, G4 audit, G5 rozhovory; samotný checklist brán nie je schválený | zakladateľ, externí |
| **Dokumentácia** | rozhodnutia aktuálne | základné dokumenty 00 až 07 z 2026-10-14 | autor |
| **Neoverené predpoklady** | zapísané ako predpoklad | výnos 3,5 %, inflácia 4,2 %, daňové pravidlá a termíny | zakladateľ |

**Najväčšia medzera nie je v kóde, ale v pilote.** Appka je pripravená, no pilot (`docs/17`, D-153) zatiaľ nezbiera dáta, ktoré má overiť.

## 2. Fáza 1 – MVP

| Milník | Stav | Nedokončené |
| --- | --- | --- |
| M1 doména | hotové (GC-01 až GC-24 sedia, kontrola výpočtov 2026-10-25) | súbor `tests/golden/goal-cases.json`, ktorý `docs/07` §3 uvádza, neexistuje (GC sú priamo v testoch) |
| M2 úložisko a záloha | hotové | – |
| M3 nastavenie a transakcie | hotové | meranie „transakcia do 20 s a 5 dotykov“ je predpoklad; zmerať má pilot |
| M4 prehľad a vyhodnotenie | hotové | – |
| M5 PWA a offline | hotové (`privacy-network.spec.ts`) | – |
| M6 dostupnosť | axe-core v E2E (`a11y.spec.ts`) | **ručný checklist čítačky obrazovky (VoiceOver) nie je vyplnený**; `docs/07` riadok 24 ešte píše „axe-core nie je zavedené“ |
| M7 vydanie pre seba | hotové (export a import overené na iPhone, D-305, D-307) | – |

**Otvorené ručné overenie:** uchovanie dát na iPhone po 7 dňoch neaktivity (`docs/06` oddiel 9, plánované 2026-10-23, D-042). V rozhodnutiach výsledok nie je (predpoklad: neprebehlo alebo sa nezapísalo).

## 3. Fáza 1b – Pilot

- `docs/pilot/tyzdenny-zapis.md`: jediný riadok „2026-10-19, začiatok pilota“, bez údajov.
- `docs/pilot/denik-zmatkov.md`: prázdna šablóna. Postrehy z prehliadok sú v scenároch a v rozhodnutiach (D-305 až D-320), nie v denníku.
- Výstupné kritérium pilota (3 vyhodnotenia bez blokujúcej chyby, žiadna neočakávaná zmena čísla, round trip na reálnych anonymizovaných dátach) zatiaľ nemá ani prvý bod.
- Testeri nie sú pozvaní (pozvánky pripravené, `docs/pilot/pozvanky-testerov.md`).
- **Riziko:** pilot sa meria od 2026-10-23 (D-292), no počas neho prebehlo vyše 70 zmien UI. To je v poriadku (D-153 obmedzuje len výpočty), ale bez zápisov nebude čo vyhodnotiť.

## 4. Fáza 2 – funkcie

| Oblasť | Hotové | Nedokončené | Kde je zapísané |
| --- | --- | --- | --- |
| **Dane** | evidencia prenájmu, riadok 11, tlačivo 17-dp-md, psy, daňový režim ako údaj | overenie zdrojov (zakladateľ); XML priznania krok 2b (šablóna je, generovanie nie); termíny (N-18); predaj nehnuteľnosti; výpočet dane a daňový scenár (FR-25, D-104) | `Navrh_dane_uctovnictvo.md`, `docs/52`, `docs/50` |
| **Investície** | položky, mena a kurz, ciele, odvodená suma | import cien súborom (docs/12 B, docs/18 oddiel 5); otázky 3 až 5 v `docs/12` | `docs/12`, `docs/18` |
| **Príjmy – dôchodok a dávky** | zobrazenie zadaných údajov; čítanie súboru v1 (skryté, D-323) | integračná služba neexistuje (D-112); otázky 2 až 4 v `docs/14` | `docs/14`, `docs/15` |
| **Majetok** | nehnuteľnosti, hypotéka, nájom, LV, ostatné aktíva | nárok na podporu (FR-26) zámerne nie (D-088); návod LV čiastočne overený (`Otvorene_opravy.md` bod 11) | `docs/11`, `docs/26` |
| **Sklad** | celý `docs/51` | vyhodené v Opakovaných výdavkoch (N-17) | `docs/08` |
| **Transakcie** | dva režimy, položky, QR, návrhy | položky z fotky dokladu (N-19) | `docs/58` |
| **Výpočet** | GC v poriadku | ochrana pri vstupoch mimo rozsahu (N-20) | `docs/08` |
| **Rodinná verzia, účty, Fáza 3** | len návrhy | všetko; zámerne mimo (D-148) | `docs/16`, `Navrh_ucty.md` |

## 5. Brány Fázy 2 (pred spustením pre používateľov)

- **G1 právne posúdenie:** otvorené; podklad `docs/Podklad_pravne_posudenie.md` nie je aktualizovaný o zmeny od 2026-10-23 (predpoklad: chýba Sklad, šifrovaná záloha, kontrola zálohy).
- **G4 bezpečnostný audit:** otvorené; podklad `docs/48` z 2026-10-25.
- **G5 rozhovory:** otvorené; scenár `docs/49`, bez rozhovorov.
- **Checklist brán** v `docs/06` oddiel 6 má hlavičku „návrh … čaká na revíziu a schválenie zakladateľa“.

## 6. Dokumentácia a predpoklady

- `docs/00` až `docs/07` (vízia, persony, požiadavky, UX, FR, architektúra, roadmapa, testovanie) sú z 2026-10-14 (v0.2 až v0.9). Odvtedy ~310 rozhodnutí; napr. `docs/06` stále uvádza Fázu 0 ako „takmer hotovú“, `docs/07` stav testov 76 jednotkových a 6 E2E. Rozhodnuté (D-323): aktualizovať pred G1 a G4.
- Persony Fázy 2 v `docs/01` nie sú (D-297, bod 5).
- `RETURN_ASSUMPTIONS` (`src/domain/assumptions.ts`): výnos 3,5 % (D-050) a inflácia 4,2 % (D-263) majú `verifiedOn: null`.
- Bod 2.4 z prehliadky 2026-10-25 (nájom 650 €) je nevysvetlený.

## 7. Odporúčané poradie

1. **Rozbehnúť pilot naozaj:** poslať pozvánky; zakladateľ zapisuje týždenný zápis a denník zmätkov; prvé mesačné vyhodnotenie za október 2026 zapísať (koniec mesiaca je o 5 dní).
2. **Dve ručné overenia na iPhone:** uchovanie dát po 7 dňoch a krátky test s VoiceOver (M6). Autor pripraví 1-stranový checklist.
3. **Brány súbežne s pilotom:** aktualizovať podklad pre právnika (G1) a audítora (G4) a s nimi `docs/00` až `07`; schváliť checklist brán.
4. **Fáza 2 funkcie až podľa pilota:** dane čakajú na overenie zdrojov zakladateľom; ostatné je v backlogu po pilote.

## 8. Otázky na rozhodnutie

1. Súhlasíš, že **prioritou je rozbehnúť pilot** (bod 7.1), nie ďalší vývoj?
2. Pripraviť **checklist ručných overení na iPhone** (7 dní neaktivity, VoiceOver)?
3. Začať **aktualizáciu podkladov pre G1 a G4 a dokumentov 00 až 07** teraz, súbežne s pilotom?
4. Chceš, aby som pri každom tvojom postrehu z používania zapisoval riadok do **denníka zmätkov** (`docs/pilot/denik-zmatkov.md`), aby pilot mal dáta?
