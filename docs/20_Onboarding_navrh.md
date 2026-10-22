# 20 – Onboarding (návrh)

> Stav: **implementované (D-152, 2026-10-22).** Rozhodnutia z bodu 4 sú zapísané v D-152; nasledujúce úpravy idú cez novú kapitolu.
>
> Pôvodný stav: návrh na schválenie. Vychádza z aktuálneho sprievodcu (dva kroky), z nálezov revízií a z cieľovej skupiny (CLAUDE.md: predvídateľnosť, nízka kognitívna záťaž, rešpektujúci jazyk).

## 1. Čo máme dnes

- Krok 1 z 2: Nastavenia (cieľ a prah). Krok 2 z 2: Vyhodnotenie (investície a hotovosť). Tlačidlá Späť, Ďalej, Preskočiť na hlavnú stránku.
- Problémy z revízií:
  - Krok 1 odmietne uložiť, ak sú prázdne polia, hoci text hovorí, že ostatné majú východiskové hodnoty.
  - Nie je vysvetlené, čo výsledok znamená a čo má používateľ urobiť ďalej.
  - „Preskočiť“ nechá používateľa bez vysvetlenia, bez odkazu na to, čo chýba.
  - Žiadny krok nehovorí o zálohe, hoci strata telefónu je reálne riziko.
  - Krok 2 používa pojmy „Vyhodnotenie“ a „nasporená suma“ bez vysvetlenia.

## 2. Cieľ onboardingu

Používateľ do piatich minút:
1. vie, na čo appka slúži a že údaje zostávajú v tomto telefóne,
2. zadá len to, čo potrebuje na prvý výsledok,
3. vidí dátum cieľa alebo jasne pomenované, čo ešte chýba,
4. vie, čo má urobiť ďalej (transakcia, vyhodnotenie, záloha).

## 3. Navrhovaný tok (jedna otázka na obrazovke)

1. **Úvod.** Tri krátke vety: čo appka robí, že údaje sú len v tomto telefóne, že výsledky sú odhady. Tlačidlá: „Pokračovať“, „Preskočiť“.
2. **Výdavky.** Jedno pole: ročné výdavky, s príkladom („napr. 24 000 € ročne“). Pod ním jedna veta, čo to znamená.
3. **Miera výberu.** Predvolená hodnota (3,7 %) s vysvetlením jednou vetou („koľko z kapitálu ročne minieš“). Tlačidlo „Nechať 3,7 %“ alebo „Zmeniť“.
4. **Dnešný stav.** Investície a hotovosť, každé pole s jednou vetou, kde číslo nájsť. Tlačidlo „Uložiť a zobraziť dátum“.
5. **Výsledok.** Dátum cieľa, alebo jasné upozornenie (napr. pri nulovom sporení). Tri kroky „Čo ďalej“: zapísať transakciu, na konci mesiaca vyhodnotiť, uložiť zálohu. Tlačidlo „Otvoriť prehľad“.

Pravidlá:
- Na každej obrazovke je jedno rozhodnutie a jedno tlačidlo na pokračovanie.
- Východisková hodnota je viditeľná a vysvetlená, nie skrytá. Prázdne pole sa použije ako východisková hodnota (ak je definovaná).
- „Preskočiť“ je vždy dostupné a neničí zadané údaje.
- Priebeh (ktorý krok) sa pamätá v tomto zariadení. Je to pohodlie, nie zdroj pravdy.
- Chyba vždy povie, čo opraviť, nie len čo zlyhalo.
- Žiadny krok nevyžaduje finančnú teóriu. Žiadne odporúčanie produktov (FR-13).

## 4. Rozhodnutia (zapísané v D-152)

1. **Prázdne polia v Nastaveniach:** použiť východiskovú hodnotu, alebo vyžadovať zadanie? Odporúčam použiť východiskovú hodnotu a písať to na obrazovke (revízia, vysoká nález 3).
2. **Záloha v onboardingu:** pridať krok „Ulož si zálohu“ (odporúčam, krátky, s vysvetlením rizika straty telefónu).
3. **Invalidný dôchodok:** zostáva odložený (D-113).
4. **Preskočenie:** ponechať tlačidlo „Preskočiť“ a pri ňom jednovetový odkaz, kde nájsť návod.

## 5. Overenie

- E2E testy každého kroku a preskočenia, vrátane obnovenia priebehu po znovunačítaní.
- Pilot (docs/17): čas do prvého výsledku a počet otázok „čo to znamená?“ v prvom týždni.
- Revízia z nového podkladu na novom buildu.

## 6. Mimo rozsahu

- Osobný profil a rodinná verzia (D-115).
- Import z externých zdrojov na onboardingu (D-112).
- Automatické vyhodnotenie (D-116, na vetve Fázy 2).
