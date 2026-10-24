# 37 – Návrh: mesačný výdavok (N-12b)

> Stav: **implementované** (D-275, commit `$(git rev-parse --short HEAD)`). Schválené zakladateľom 2026-10-24 („pokračuj s N-12b“; voľba 3 v `docs/36`: samostatne). Zdroj: `docs/36`, oddiel 7, bod 3: opakované menšie výdavky oddaľujú finančnú slobodu viac než jeden veľký.

## 1. Účel

Zakladateľ chce vedieť, koľko mesiacov stojí mesačný výdavok, ktorý sa opakuje, napríklad 50 € mesačne. Výdavok sa berie ako zníženie mesačného sporenia: peniaze, ktoré by išli do cieľa, pôjdu na výdavok.

## 2. Čo sa nemení

- Žiadne dáta sa nezapisujú. Nastavenia, transakcie ani vyhodnotenia sa nemenia.
- Výpočet cieľa (K, m, dátum cieľa, dopad) je rovnaký ako v `docs/36`. Mení sa len mesačné sporenie.

## 3. Správanie

**Vstup:** mesačná suma v eurách (kladná).

**Rozdelenie zníženia sporenia (rozhodnutie navrhnuté v tomto návrhu):**
1. najprv sa zníži sporenie do investícií (`mInv`),
2. zvyšok sa zníži zo sporenia do hotovosti (`mCash`).

Ak výdavok presiahne súčet oboch sporení, scenár sa nepočíta. Sporenie by bolo záporné a výpočet by to nezachytil správne. Zobrazí sa text, ktorý to vysvetlí.

**Výstup:**
1. mesačné sporenie pred a po výdavku,
2. dopad na cieľ v mesiacoch (rovnaký text ako v `docs/36`, cez `formatImpactOutcome`),
3. dátum cieľa pred a po výdavku (kalendárne), ak cieľ existuje v oboch stavoch.

**Stavy:** bez nastavení a bez vyhodnotenia sa zobrazí rovnaká výzva ako v `docs/36`, s tlačidlami na nastavenia alebo vyhodnotenie.

## 4. Miesto v appke

- Nová sekcia **Mesačný výdavok (scenár)** (`mesacny-vydavok`) v skupine **Peniaze**, vedľa Veľkého výdavku.
- Samostatná obrazovka, aby jednorazový a opakovaný scenár zostali jednoduché.

## 5. Implementácia

1. Test najprv: `monthlyExpenseScenario` v `src/domain/monthlyExpense.ts` (`tests/monthly-expense.test.ts`). Testy: neplatná suma, suma nad súčet sporení, zníženie najprv investícií, presah do hotovosti, dopad je záporný pri vyššom výdavku, dátumy sú null, ak cieľ nie je dosiahnuteľný.
2. Doména: výpočet cez `goalMonths` (rovnaká cesta ako v `docs/36`).
3. UI: `src/features/mesacny-vydavok/MesacnyVydavok.tsx`, navigácia a `Sekcie.tsx`.
4. E2E: výzva bez nastavení, výpočet so zadanými nastaveniami a vyhodnotením, kontrola, že sa nič nezapísalo.
5. Testy: `tsc`, `vitest`, celé E2E.

## 6. Otvorené voľby

Žiadne, ktoré by blokovali implementáciu. Ak nechceš takéto rozdelenie zníženia (najprv investície), povedz to a upravím.
