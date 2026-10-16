# 09 – Návrh na vysokej úrovni: nehnuteľnosti a daňové režimy

**Stav:** pracovný návrh (draft). Voľby vlastníka sú zapísané ako smery; formálne rozhodnutia v `decisions/Decisions.md` ešte nie sú. Nič sa neimplementuje.
**Projekt:** Finančná sloboda (repozitár `melisik/financna-sloboda`).
**Pôvod nápadov:** vlastník projektu, 2026-10-16 (`docs/19_Idea_Backlog.md`, položky 1 a 2).
**Umiestnenie:** tento dokument patrí do `financna-sloboda/docs/` (presunutý z iného projektu, 2026-10-16). Súvisiace nápady sú v `docs/08_Backlog_Napady.md` (N-01, N-02).

Tvrdenia o právnych a daňových pravidlách sú **predpoklad**, kým sa neoverí primárny zdroj.

---

## 1. Voľby vlastníka

| # | Otázka | Voľba | Poznámka |
|---|---|---|---|
| C2 | Ako počítať nehnuteľnosť v K | **B – čistá hodnota** (odhad hodnoty mínus zostatok hypotéky) | Odhad, nie trhová cena. |
| C3 | Nájom a splácanie | **B – záporná zložka aktíva** (s rozlíšením, viď oddiel 3) | Hypotéka je záporná zložka hodnoty nehnuteľnosti. |
| C4 | Režim a nárok na podporu | **C – aplikácia posúdi nárok a overí ho cez `spolu-na-ceste`** | Integráciu treba navrhnúť, viď oddiel 4. |
| D-067 | Daňové režimy | **Daňový scenár sa zavedie spolu s režimom** | Mení predchádzajúci smer „presun do Fázy 2“, viď oddiel 5. |

## 2. Východiská

Podľa `docs/04_Functional_Requirements.md` (§1):
- **K** = hodnota investícií + nasporená suma, **bez rezervy** (D-011, D-017, D-033). **K_inv** zhodnocuje r, **K_cash** je hotovosť bez zhodnotenia (0 % reálne, D-036, D-073).
- **m** je mesačné sporenie, teda peňažný tok z hotovosti do majetku (D-031).

## 3. C3 – nájom a splácanie (s rozlíšením)

Voľba B znamená: hypotéka sa odpočíta od hodnoty nehnuteľnosti a nájom sa eviduje ako tok. Tok sa rozdelí na dve situácie:

**a) Nájom nepokrýva splátku (doplácanie z hotovosti).**
Rozdiel je záporný tok z **K_cash**. Platí pravidlo D-058: K_cash nesmie klesnúť pod 0. Ak hotovosť nestačí, výdavok sa zablokuje a ponúkne sa zdroj (D-074).

**b) Nájom prevyšuje splátku (mierny plus).**
Rozdiel zvyšuje **K_cash** (hotovosť). Toto je rovnaký mechanizmus ako sporenie do hotovosti (D-041), len s iným zdrojom.

V oboch prípadoch:
- splátka znižuje zostatok hypotéky (záporná zložka sa zmenšuje), čo zvyšuje čistú hodnotu nehnuteľnosti v K;
- **úrok** sa musí oddeliť od istiny (istina je zníženie dlhu, úrok je náklad). Model úrok nezahŕňa, kým sa neurčí, ako sa účtuje.

Otvorené pri C3 (nie je rozhodnuté, len zaznamenané):
- Akú cieľovú splátku má model predpokladať (aktuálna splátka alebo maximálna).
- Čo sa stane s čistým nájmom po splatení hypotéky: ide do m (sporenie), alebo tvorí samostatnú zložku. Vlastník zatiaľ vybral len to, že sa najprv splácajú záväzky.

## 4. C4 – nárok na podporu a integrácia s `spolu-na-ceste`

Smer: aplikácia posúdi, či má používateľ nárok na podporu (pri zohľadnení režimu vlastníctva alebo nájmu), a overí to cez `spolu-na-ceste`.

**Čo už existuje v `spolu-na-ceste`:** `v2/assistanceEligibility.js`, `v2/assistanceEligibilityResolution.js`, `v2/assistanceSearchWithEligibility.js` (posudzovanie nárokov nad katalógom). Výskumný inventár je v `research/eligibility/`.

**Prekážka, ktorú treba riešiť pred integráciou:**
- `docs/16_Development_Plan.md` a `PROJECT_CHECKPOINT.md` zakazujú v2/v3 bridge, kým nie je k dispozícii reálne používateľské evidenciu z Fázy 0.
- `decisions/Decisions.md`, Decision 012: vzťah medzi v2/v3 a Decision Model vyžaduje explicitné rozhodnutie, kým sa implementuje.
- Integrácia medzi projektmi (`financna-sloboda` a `spolu-na-ceste`) preto **nie je bežný krok**. Je to nový most, ktorý treba zapísať ako rozhodnutie.

**Navrhovaný postup (bez kódu):**
1. Zapísať rozhodnutie, či a v akom rozsahu sa `financna-sloboda` napojí na v2 eligibility (Decision 012 a plán vývoja).
2. Definovať rozhranie: vstup (režim vlastníctva, príjem, rodinná situácia, údaje z aplikácie) a výstup (zoznam možných podpôr s odôvodnením a stavom „overené / neoverené“).
3. Overiť primárne zdroje pravidiel podpory pred ich použitím.
4. Až potom technický návrh integrácie.

## 5. D-067 – daňový scenár spolu s režimom

Zadanie: daňový scenár sa zavedie **spolu s režimom**, aby aplikácia vedela presne určiť aktuálny stav. Toto mení predchádzajúci smer „presun do Fázy 2“: daňový scenár nepôjde len do Fázy 2, ale pri zavedení režimu. Otvorené zostáva, či sa Fáza 2 týka aj samotného režimu, alebo len daňového scenára. (Potvrdiť.)

Dôsledky:
- Výpočet musí byť **verzovaný** podľa platných pravidiel (parametre s dátumom platnosti a zdrojom, stav „neoverené“ kým sa neoverí).
- Daňový scenár je **samostatný výstup** vedľa hlavného nominálneho výpočtu (D-077), nie jeho náhrada.
- Pravidlá sa musia overiť pred zobrazením ako „aktuálny stav“. Do overenia zobrazovať ako odhad.

## 6. Konflikty s existujúcimi pravidlami

| Pravidlo | Dotknutý návrh | Stav |
|---|---|---|
| D-067 (dane mimo MVP) | Daňový scenár | Mení sa smerom vlastníka: scenár spolu s režimom. Treba formálne zapísať. |
| D-032, D-036 (globálne r, K_cash 0 %) | Tok z nájmu do K_cash | Nezmenené: K_cash zostáva 0 %. |
| D-058, D-074 (limity K_cash a K_inv) | Doplácanie z hotovosti | Platia pre tok z nájmu rovnako ako pre výdavky. |
| D-033, D-017 (K bez rezervy) | C2 | Nehnuteľnosť je v K ako čistá hodnota (B). |
| FR-02 (vzorec dátumu cieľa) | C2, C3 | Vzorec platí len pre pevný tvar K a m. Zmena závisí od úrokov a splácania. |
| D-026 (bez šifrovania v MVP) | Nehnuteľnosť, záväzky | Citlivé údaje. Pred spustením riešiť ochranu dát. |
| Decision 012, plán vývoja | C4 integrácia | Nový most, vyžaduje rozhodnutie. Nesmie sa zaviesť len tak. |

## 7. Fázovanie a brány

- **Teraz:** tento návrh, formalizácia voľieb (C2 = B, C3 = B, C4 = C, D-067 spolu s režimom) v `Decisions.md`.
- **Bez kódu, kým:** nie sú vyriešené otvorené body z oddielu 3 a 4 (1–2), a nie je zapísané rozhodnutie o moste.
- **Právne posúdenie a bezpečnostný audit:** nie sú brány pre návrh. Počkajú, kým sa funkcie nespustia ostro.
- **Overenie zdrojov:** pred daňovými parametrami a pravidlami podpory.

## 8. Riziká

- **Chybné daňové alebo podporné pravidlá:** najväčšie riziko, lebo ide o rozhodnutia s právnymi dôsledkami. Mitigácia: overené zdroje, stav „neoverené“, právne posúdenie pred spustením.
- **Nepresné odhady hodnoty:** preto B (čistá hodnota) je konzervatívnejšie, ale stále závisí od odhadu. Zobrazovať ako odhad.
- **Úroky mimo modelu:** bez úrokov je dátum cieľa optimistický. Treba rozhodnúť, ako sa účtujú.
- **Záťaž používateľa:** viac polí. Mitigácia: voliteľné údaje, predvolené „nezadané“.

## 9. Rozhodnuté body (voľby vlastníka, 2026-10-16)

Tieto voľby sú zaznamenané ako smery. Formálny zápis do `financna-sloboda/decisions/Decisions.md` čaká na pokyn.

1. **Splátka pre model:** aktuálna splátka zo zmluvy (nie maximálna).
2. **Úroky:** zahrnú sa ako výdavok z toku; splátka sa rozdelí na úrok a istinu.
3. **D-067 / D-083 a Fáza 2:** režim aj daňový scenár patria do Fázy 2 spolu.
4. **Čistý nájom po splatení hypotéky:** ide do m (mesačné sporenie).

## 10. Stav po voľbách z 2026-10-16

Zapísané ako D-084 až D-087 (`financna-sloboda/decisions/Decisions.md`, `main`):
splátka = aktuálna, úroky = výdavok z toku, režim aj scenár do Fázy 2, čistý nájom po splatení ide do m.

Ďalšie voľby vlastníka (zatiaľ nie sú v `Decisions.md`):
1. **Integrácia C4 so `spolu-na-ceste`:** odložená. Nerieši sa, kým nie je rozhodnutie podľa Decision 012 a dôkaz z Fázy 0.
2. **Odhad hodnoty nehnuteľnosti:** aktualizuje sa **ročne** na základe štátnych štatistických údajov. Zdroj a metódu treba ešte určiť a overiť (predpoklad, nie je to overené).
3. **Ochrana dát:** splnia sa **zákonné kritériá**. Konkrétny rozsah (napr. GDPR a slovenský zákon o ochrane osobných údajov, pravidlá pre finančné údaje) treba overiť právnikom pred spustením.
