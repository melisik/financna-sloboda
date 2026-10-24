# 34 – Návrh: ciele v sekcii Investície (D-105)

> Stav: schválené (variant B, D-258), implementované v commitoch `9916a0b` (schéma 12, úložisko, záloha) a `b4b3ffa` (zoskupenie a UI). Zdroj: D-105 („Ciele sa v Investíciách zoskupujú: skupina položiek s cieľovou sumou“) a `docs/13_Zoznam_obrazoviek.md` (riadok Investície: „tu pribudnú tretí pilier a ciele“).

## 1. Stav

- Sekcia Investície (`src/features/investicie/Investicie.tsx`) má ručné položky a druhy vrátane tretieho piliera (D-101, D-105).
- Ciele (zoskupenie položiek s cieľovou sumou) v kóde nie sú. Dátový model `Position` (`src/domain/model/entities.ts`) nemá pole pre cieľ.
- Prehľad a Vyhodnotenie používajú súčet investícií, ten sa nemení.

## 2. Čo nie je predmetom návrhu

- Výpočet cieľa nezávislosti (T = V / p, dátum cieľa) sa nemení. Ciele v Investíciách sú len zobrazenie, rovnako ako D-102 pre vklady do tretieho piliera.
- Ciele neovplyvnia K, m ani dátum cieľa nezávislosti. Toto je potrebné potvrdiť (oddiel 5).

## 3. Varianty

**A. Pole `goal` priamo na položke** (názov skupiny, bez cieľovej sumy). Bez zmeny schémy a migrácie. Cieľová suma by sa muselo zadávať na každej položke zvlášť a mohla by sa rozísť, preto nesplní D-105 úplne.

**B. Nová kolekcia `goals` (id, názov, cieľová suma v centoch) a pole `goalId` na položke** (odporúčam). Správny model: jedna cieľová suma na skupinu, súčet a pokrok sa počíta z položiek. Vyžaduje:
- zvýšenie `SCHEMA_VERSION` z 11 na 12 a upgrade v `src/storage/indexeddb.ts`,
- rozšírenie zálohy (export, import, validácia, `READABLE_SCHEMA_VERSIONS`), podobne ako pri verzii 3 až 7 (D-124, D-127, D-129, D-159),
- UI: výber skupiny pri položke, nová skupina s názvom a cieľovou sumou, zobrazenie skupín so súčtom a pokrokom v percentách.

## 4. Odporúčanie

Variant B. Je to jediný variant, ktorý zachytáva cieľovú sumu skupiny podľa D-105. Zmena je väčšia, ale rovnaký postup (verzia schémy, záloha, testy) je už overený pri predchádzajúcich zmenách.

## 5. Čo treba potvrdiť

1. Variant B.
2. Ciele sú len zobrazenie a nemenia výpočet cieľa nezávislosti, K, m ani dátum cieľa.
3. Položka môže byť v najviac jednom cieli. Položka bez cieľa je v skupine „Bez cieľa“.
4. Pokrok sa zobrazuje ako pomer súčtu položiek k cieľovej sume. Ak je súčet vyšší než cieľ, zobrazí sa cieľ ako dosiahnutý, bez záporných hodnôt.

## 6. Postup po schválení

1. Test najprv: zoskupenie položiek podľa cieľa a pokrok (červené).
2. Doména: funkcie `groupByGoal` a `goalProgress` v `src/domain/investments.ts`.
3. Úložisko a záloha: verzia 12, upgrade, export a import, testy zálohy.
4. UI: sekcia Investície, formulár pre cieľ, zobrazenie skupín.
5. Testy: `tsc`, `vitest`, `vite build`, celé E2E na desktope aj mobile-390.
6. Zápis do `decisions/Decisions.md` a aktualizácia `docs/13`.

## 7. Poznámka k ďalším sekciám

Príjmy a Sklad som porovnal s `docs/13`. V dokumentácii nie je otvorená vývojová položka, ktorá by v kóde chýbala. Ak chcete rozvíjať niektorú z nich, povedzte, ktorú funkciu.
