# 33 – Návrh opravy T1: projekcia hypotéky po splatení

> Stav: návrh na schválenie. Kód sa nemení, kým zakladateľ nepotvrdí variant. Nález T1 v `docs/30_Testy_2026-10-23.md`, oddiel 3. Súvisí s D-087 a FR-02a v `docs/04_Functional_Requirements.md`. Fáza 2: vo verejnej zostave sa nenachádza (`VITE_PHASE2 "0"`, D-248).

## 1. Problém

`src/domain/rentalGoal.ts`, funkcia `monthsToTargetWithRentals` a `mortgageBalanceAt`: zostatok hypotéky sa počíta uzavretým tvarom `Z(k) = Z0·(1+i_h)^k − P·((1+i_h)^k − 1)/i_h` aj po splatení. Dôsledky:

- **Splátka sa neprestane platiť.** `P` sa ďalej odpočítava z `K_cash` (`K_cash(k) = K_cash + (m_cash + N − P)·k`).
- **Preplatok sa zarátava ako majetok.** `Z(k)` ide do záporna, takže `K_nem = V − Z(k)` rastie nad `V` a úročí sa sadzbou `i_h`. Žiadne rozhodnutie to nepredpisuje.
- **Hotovosť sa vyčerpá tam, kde nemá.** Príklad z testu: `Z0 = 1 000 €`, `P = 500 €`, `N = 300 €`, `K_cash = 1 000 €`: hotovosť klesne pod nulu v mesiaci 6, hoci po splatení v mesiaci 2 by rástla o `N` každý mesiac.

Podľa **D-087** („Čistý nájom po splatení hypotéky ide do m“) sa po splatení splátka neplatí a do `m` ide čistý nájom `N`. Súčasný kód to nerobí.

## 2. Navrhnutý model

Mesiac po mesiaci, `k = 1, 2, …`, pri `B_0 = Z0`:

- úrok: `u_k = B_{k−1}·i_h`, ak `B_{k−1} > 0`,
- splátka: `p_k = min(P, B_{k−1} + u_k)`, ak `B_{k−1} > 0`, inak `0`,
- zostatok: `B_k = B_{k−1} + u_k − p_k` (po splatení `B_k = 0`),
- hotovosť: `K_cash(k) = K_cash(k−1) + m_cash + N − p_k`,
- nehnuteľnosť: `K_nem(k) = V − B_k`; `K_inv(k)` sa nemení.

Dátum cieľa, interpolácia, kontrola `K_cash(k) ≥ 0` a horizont 600 mesiacov zostávajú rovnaké. Pred splatením je model totožný so súčasným vzorcom, takže rozdiel vzniká len po splatení.

## 3. Dôsledky (overené výpočtom)

| Prípad (docs/04) | Súčasný kód | Navrhnutý model | Zmena |
|---|---|---|---|
| GC-P2-01 (`P = 1 000`, splatenie v mesiaci ~219) | n = 257,25 | n = 257,58 | Dátum cieľa ostáva D_L + 258 mesiacov (`ceil` v oboch prípadoch) |
| GC-P2-02 (vyčerpanie v mesiaci 26, pred splatením) | mesiac 26 | mesiac 26 | žiadna |
| GC-P2-03 (vlastné bývanie, mimo K) | 362,10 | 362,10 | žiadna |
| GC-P2-04 (`P = 100`, splátka nepokrýva úrok) | n = 273,08 | n = 273,08 | žiadna (zostatok po splatení nikdy neklesne na 0) |
| T1 príklad (`Z0 = 1 000`, `P = 500`, `N = 300`) | vyčerpanie v mesiaci 6 | bez vyčerpania, hotovosť rastie od mesiaca 3 | oprava |

Jediná zmena hodnoty je GC-P2-01: **257,25 → 257,58**. Test `tests/rentalGoal.test.ts` (riadok 25–28) používa `toBeCloseTo(257.25, 1)`, takže by po zmene padal a jeho očakávanie treba upraviť po schválení.

## 4. Varianty

**A. (odporúčam) Splátka sa zastaví pri splatení, `N` ide do `m` (D-087).** Opravuje všetky tri body z oddielu 1. Mení hodnotu GC-P2-01 o 0,33 mesiaca bez zmeny dátumu.

**B. Len ohraničiť zostatok (`Z = max(0, Z)`), splátka sa platí ďalej.** Odstráni preplatok, ale `K_cash` stále odpočítava `P` po splatení. Porušuje D-087, preto nevhodné.

**C. Ponechať súčasný kód a zapísať ho ako pravidlo do FR-02a.** Preplatok by sa úročil ako majetok. Žiadne rozhodnutie to nepodporuje a D-087 zvolil iné správanie. Nevhodné.

## 5. Čo treba schváliť (rozhodnutie zakladateľa)

1. Výklad D-087: po splatení sa splátka neplatí a `N` ide do `m` (variant A).
2. Doplnenie FR-02a v `docs/04`: „Splátka sa platí len do splatenia; posledná splátka je zmenšená na zostatok; po splatení `K_nem = V`.“ Dnešný vzorec je doslovný a T1 je medzera v špecifikácii.
3. Nová hodnota GC-P2-01: **257,58** (dátum nezmenený).
4. Záznam do `decisions/Decisions.md` (číslo D-255) až po schválení.

## 6. Zmeny v kóde po schválení

- `src/domain/rentalGoal.ts`: `monthsToTargetWithRentals` prejde na mesačnú iteráciu s `B_k` a kumulatívnou `K_cash`. Uzavretý tvar `mortgageBalanceAt` sa použije len pred splatením alebo sa nahradí iteráciou. Pred zmenou skontrolujem všetky volania.
- Nový test T1 napíšem najprv a bude červený: po splatení sa `K_cash` nevyčerpá a rastie o `N`.
- `tests/rentalGoal.test.ts`: očakávanie GC-P2-01 z 257,25 na 257,58 (po schválení).
- `docs/04`, FR-02a: pravidlo a nová hodnota GC-P2-01.
- Vo verejnej zostave sa zmena neprejaví (Fáza 2 je vypnutá).

## 7. Mimo rozsahu

- T2 (horizont 600 mesiacov v nehnuteľnostnej vetve) je samostatné rozhodnutie zakladateľa.
- Predpoklady A1 až A3 v FR-02a (inflácia 2 %, náklady znižujú nájom, úrok v `P`) sa týmto návrhom nemenia.

## 8. Čo potrebujem

Potvrdenie variantu A a body 1 až 4 z oddielu 5. Po potvrdení pripravím test T1, opravu, úpravu GC-P2-01 a zmenu FR-02a.
