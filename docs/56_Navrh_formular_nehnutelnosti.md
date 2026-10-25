# 56 – Návrh: prehľadnejší formulár nehnuteľnosti

> Stav: **návrh na schválenie** (2026-10-25). Kód sa nemení. Z postrehu zakladateľa 5.4: „priveľa polí, niektoré môžu byť zbalené; menej dôležité veci sú graficky rovnako významné ako dôležitejšie“. D-153: bez zmeny výpočtu (mení sa len rozloženie formulára).

## 1. Dnes

Formulár nehnuteľnosti (`src/features/majetok/Majetok.tsx`) má jeden dlhý zoznam asi 22 polí rovnakého vzhľadu: režim, názov, odhad a dátum odhadu, obstaranie, list vlastníctva, údaje pre daň (druh objektu, obec, katastrálne územie, parcela, súpisné číslo, byt, plocha), hypotéka (zostatok, dátum, sadzba, splátka), náklady, nájom.

## 2. Návrh: tri úrovne

1. **Vždy viditeľné (to, čo ovplyvní cieľ):** režim (bývam / prenajímam), názov, **odhad hodnoty** a dátum odhadu. Pri prenájme aj mesačný nájom. Toto stačí na uloženie.
2. **Zbalené bloky s ▾ a súhrnom v nadpise**, ako pri Doklade a filtri (D-293, D-300):
   - **Hypotéka ▾** (zostatok, platí k, sadzba, splátka). Súhrn: „Hypotéka · 120 000 €“ alebo „bez hypotéky“. Ak je zostatok vyplnený, rozbalí sa sám.
   - **Mesačné náklady ▾** (ostatné náklady).
   - **Údaje pre daň z nehnuteľností ▾** (druh objektu, obec, katastrálne územie, parcela, súpisné číslo, byt, plocha). Súhrn: „vyplnené“ / „nevyplnené“.
   - **Kúpa ▾** (dátum obstarania, obstarávacia cena, začiatok prenájmu).
   - **Predvyplniť z listu vlastníctva ▾** (už dnes zbalené).
3. **Vizuálna hierarchia:** povinné polia hore normálnym písmom; zbalené bloky ako tlačidlá s ▾; nepovinné polia v blokoch s menším popisom. Uložiť ostáva na konci formulára (D-278).

Ak blok obsahuje chybu (napr. neplatná sadzba), sám sa rozbalí (zásada 3, `docs/46`).

## 3. Očakávaný účinok

Pri novej nehnuteľnosti bez hypotéky 5 polí namiesto 22. Dĺžku formulára pri 390 px zmeriam pred a po (ako v `docs/46`).

## 4. Riziká

- Používateľ s hypotékou ju môže prehliadnuť: preto súhrn „bez hypotéky“ priamo v nadpise bloku a sám sa rozbalí pri existujúcom zostatku.
- Existujúce E2E testy hľadajú polia priamo; dostanú krok „otvoriť blok“ ako pri D-293.

## 5. Otázky na rozhodnutie

1. Tri úrovne podľa oddielu 2: **áno (odporúčam)**?
2. Mesačný nájom pri prenájme vždy viditeľný (ovplyvňuje cieľ): **áno (odporúčam)**?
3. Rovnaký prístup neskôr aj pre Záväzky a Investície: áno, po overení na nehnuteľnosti?
