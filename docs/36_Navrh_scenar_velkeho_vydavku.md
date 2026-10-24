# 36 – Návrh: scenár veľkého výdavku (N-12)

> Stav: **schválené a implementované** (D-274, commit `9daec64`). Rozhodnutia zakladateľa: zdroj predvolene z hotovosti, dátum cieľa aj kalendárne, opakované menšie výdavky samostatne (N-12b), miesto v skupine Peniaze. Zdroj: `docs/08` (N-12: „Scenár veľkého výdavku (napr. auto): ukáže dopad na cieľ bez zápisu do transakcií“). Výpočet nemení: používa rovnaké funkcie ako predbežný dopad v Transakciách (FR-04, D-121).

## 1. Účel

Zakladateľ chce vedieť, čo by veľký výdavok (napríklad auto) znamenal pre dátum cieľa nezávislosti, **skôr než sa rozhodne**. Dnes sa dopad ukáže len vo formulári transakcie, a to až po vyplnení celého formulára. Scenár to rieši rýchlo a bez zápisu.

## 2. Čo sa nemení

- Žiadna transakcia, vyhodnotenie ani záznam sa nevytvorí. Nič sa neukladá do úložiska ani do zálohy.
- Výpočty K, m, dátumu cieľa a predbežného dopadu v Transakciách zostávajú. Scenár ich len znovu použije.
- Nová sa neberie žiadna hodnota z vonku. Všetko je lokálne (D-009).

## 3. Existujúce časti, ktoré sa použijú

- `impactWithRentals` a `formatImpactOutcome` (`src/domain/rentalGoal.ts`, `src/domain/impact.ts`), rovnako ako v Transakciách.
- `UNREACHABLE_IMPACT_TEXT` pre prípad, keď cieľ nedosiahne ani bez výdavku.
- `goalDateText` (`src/domain/goalText.ts`) pre text dátumu cieľa.
- `SOURCES` (`src/domain/model/entities.ts`): `z_prijmu`, `z_hotovosti`, `z_investicii`.
- Kontext `Ctx` (`src/domain/context.ts`) s aktuálnym kapitálom a nastaveniami.

## 4. Správanie

**Vstup:**
- suma v eurách (kladná, väčšia než 0),
- zdroj: z hotovosti / z investícií / z príjmu.

**Výstup:**
1. Predbežný dopad na cieľ, rovnaký text ako v Transakciách (napr. „predbežne +2 mesiace“ alebo „cieľ sa vyčerpá v mesiaci 26“).
2. Dátum cieľa bez výdavku a s výdavkom (kalendárne, cez `goalDateText`).
3. Pri zdroji „z príjmu“ sa kapitál nezmení, takže dopad je nulový. Text to hovorí výslovne.

**Stavy:**
- bez nastavení: „Zadaj nastavenia, aby sa dal dopad vyčísliť.“ (rovnako ako dnes),
- cieľ nedosiahnuteľný: `UNREACHABLE_IMPACT_TEXT`,
- vyčerpanie hotovosti: text z `formatImpactOutcome`, nie „nedosiahne“.

**Poznámka:** odhad je pred daňou a poplatkami a nie je finančným poradenstvom (rovnaký text ako dnes).

## 5. Miesto v appke

- Nová položka v skupine **Peniaze** (`src/app/navigation.ts`), názov „Veľký výdavok (scenár)“, identifikátor `scenar-vydavku`.
- Obrazovka bez ukladania, bez tlačidla „Uložiť“. Hodnoty sa stratia pri odchode, lebo nič neukladáme.

## 6. Implementácia (po schválení)

1. Test najprv: čistá funkcia `bigExpenseScenario(ctx, amountCents, source)` v `src/domain/expenseScenario.ts` (súbor `src/domain/scenario.ts` už existuje a patrí k Prehľadu) vracia dopad a dátumy bez a s výdavkom. Testy: zdroj z hotovosti znižuje hotovosť, z investícií znižuje investície, z príjmu nemení nič, neplatná suma sa odmietne, nedosiahnuteľný cieľ dá správny stav.
2. Doména: funkcia `bigExpenseScenario` používa `payFromCash`, `payFromInvestments` a `impactWithRentals` (rovnako ako Transakcie).
3. UI: obrazovka `src/features/scenar-vydavku/`, položka v navigácii, zoznam obrazoviek v `docs/13`.
4. E2E: nastavenia a vyhodnotenie, otvorenie scenára, zadanie sumy, overenie textu dopadu a dátumu, a overenie, že počet transakcií sa nezmenil.
5. Testy: `tsc`, `vitest`, celé E2E na desktope aj mobile-390.
6. Zápis do `decisions/Decisions.md` (D-269 je už použitá, ďalšie číslo podľa stavu v čase zápisu).

## 7. Otvorené voľby (rozhodnutie zakladateľa)

1. **Predvolený zdroj:** z hotovosti (odporúčam), alebo z investícií.
2. **Dátum cieľa:** zobraziť aj kalendárny dátum popri mesiacoch (odporúčam áno).
3. **Opakované menšie výdavky:** zakladateľ upozornil, že menšie opakované rozhodnutia oddaľujú finančnú slobodu viac než jeden veľký. Navrhujem to ako **samostatný krok N-12b**: „koľko mesiacov stojí mesačný výdavok X €“, teda zníženie mesačného sporenia. Ide o rovnakú výpočtovú cestu, len s úpravou mesačného sporenia. Chceš to zaradiť do tohto kroku, alebo ako ďalší krok?
4. **Miesto v menu:** skupina Peniaze (odporúčam), alebo Prehľad.

## 8. Mimo rozsahu

- viac výdavkov naraz a porovnanie scenárov,
- uloženie scenára alebo jeho pripomenutie,
- daňové účinky výdavku.
