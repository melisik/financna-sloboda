# M1 – Doménová vrstva

Vetva: `m1-domain` (D-023). Zlúči sa do `main` až po zelených testoch.

Rozsah (06 §4, M1): čisté funkcie bez UI a úložiska (05 §3).

## Úlohy
- `goal.ts`: T = V / p; dátum cieľa z D_L; scenáre r − 2 p. b., r, r + 2 p. b. (FR-01 až FR-03, D-024, D-050).
- `impact.ts`: predbežný dopad; surový rozdiel n, zobrazenie v mesiacoch alebo dňoch (FR-04, N1, D-046).
- `snapshot.ts`: prepočet pri vyhodnotení; D_L podľa dátumu vyhodnotenia (FR-05, D-044).
- `money.ts`: zaokrúhľovanie a formát EUR (FR-06).
- `monthlySaving`: m za 12 mesiacov do D_L, delené počtom mesiacov histórie, od prvej transakcie (D-031, D-040).
- Dvojaký kapitál: K_inv a K_cash, presun a zdroje úhrady (FR-02, FR-08, D-036, D-041, D-045).
- Výpočet n pri m_cash > 0: iterácia po mesiacoch a interpolácia (D-046).

## Kritériá prijatia (06 §4, M1)
- Všetky golden cases GC-01 až GC-22 prejdú (07 §3).
- Property testy zelené (07 §4), vrátane K_uzavretý pre r = 0 (K2) a nezápornosti K_pred.
- Overenie NPER pre m_cash = 0 (GC-03, GC-07). Pre m_cash > 0 sa overuje iteráciou (GC-20, GC-21).

## Mimo rozsahu M1
- UI, úložisko, export a import (M2).
- Prehľad spotreby (odložený, D-038).
