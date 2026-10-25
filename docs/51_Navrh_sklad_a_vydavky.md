# 51 – Návrh: Sklad prepojený s výdavkami (S-B)

> Stav: **schválené a implementované** (2026-10-25): etapa 1 (3.1 až 3.4) v D-301, etapa 2 (nákupný zoznam 3.5, otázky 5 a 6) v D-302. Otvorená je len otázka 3 (vyhodené v bloku Opakované výdavky).

## 1. Cieľ skladu

Sklad doteraz nemal zapísaný cieľ (`docs/50`). Návrh: **Sklad pomáha neplytvať a ukazuje, koľko stojí to, čo sa vyhodí.** Tým sa pripája k otázke appky (výdavky a cieľ). Ostatné funkcie skladu (dávky, upozornenia, recepty) slúžia tomu istému: použiť, čo už je kúpené.

## 2. Kontrola rozhodnutí

| Rozhodnutie | Vzťah |
| --- | --- |
| D-129: položky dokladu pri výdavku (kód, názov, počet, DPH, jednotková cena, suma) | Zdroj údajov pre sklad. Kód je kód predajcu, nie čiarový kód výrobku. |
| D-232, D-234, D-238: čiarový kód, rovnaký výrobok, výber predchádzajúceho výrobku | Položka z dokladu nemá čiarový kód; spojenie s existujúcim výrobkom ide cez výber predchádzajúceho výrobku. |
| D-127, D-141: recepty a odpočet | Bez zmeny; uvarenie nie je plytvanie. |
| D-162: Sklad je voliteľný modul | Ostáva; kto Sklad nepoužíva, nič nové nevidí. |
| D-028, D-275: odhad, nie odporúčanie | Text o vyhodených potravinách je vecný, bez hodnotenia. |
| D-153: pilot | Bez zmeny výpočtu; zmena UI a dát sa zapíše do `docs/pilot/zmeny-pocas-pilota.md`. |

Konflikt nevidím. Zmena schémy (cena pri položke, záznam vyhodených) vyžaduje novú verziu zálohy a migráciu, ako pri D-239.

## 3. Návrh

### 3.1 Z dokladu do skladu
1. Pri výdavku s položkami dokladu (D-129) je v úprave tlačidlo **Pridať do skladu**.
2. Ukáže zoznam položiek dokladu so zaškrtávacím políčkom. Predvolene **nezaškrtnuté** (doklad z drogérie či čerpacej stanice by inak zaplnil sklad). Otázka 1.
3. Pri zaškrtnutej položke: názov (predvyplnený z dokladu, dá sa upraviť), množstvo (z dokladu), jednotka (predvolene ks), dátum spotreby (prázdny), alebo výber predchádzajúceho výrobku (D-238), ktorý doplní názov, jednotku a čiarový kód.
4. Uloží sa položka skladu s **cenou za jednotku** z dokladu a odkazom na výdavok.
5. Výdavok ani kapitál sa nemenia; peniaze sa minuli pri nákupe.

### 3.2 Cena pri položke
- Nové nepovinné pole **Cena za jednotku (€)** pri ručnom zadaní položky.
- Pri pripočítaní rovnakého výrobku (D-234) sa cena prepočíta váženým priemerom.

### 3.3 Vyhodené
- Pri položke nová akcia **Vyhodiť** (vedľa Upraviť): množstvo (predvolene celé), potvrdenie.
- Uloží sa záznam: dátum, názov, množstvo, hodnota (množstvo × cena; bez ceny 0 € a poznámka „bez ceny“).
- Pri prešlej spotrebe (D-237) upozornenie ponúkne **Vyhodiť** aj **Ešte použiteľné** (posunie dátum, nič nezaznamená).

### 3.4 Prehľad plytvania
- V Sklade riadok: „Vyhodené tento mesiac: 12,40 € (3 položky) · tento rok: 86,20 €“, rozbaliteľný zoznam.
- Bez hodnotenia a bez porovnania s inými.
- **Neskôr (otázka 3):** priemer za 3 mesiace v bloku Opakované výdavky a dátum cieľa (D-290) ako ďalší riadok „vyhodené potraviny“.

### 3.5 Nákupný zoznam (zakladateľ 2026-10-25: zapracovať)
- Nový zoznam **Nakúpiť** v Sklade: názov, množstvo a jednotka (nepovinné), zaškrtnutie „kúpené“.
- **Zdroje položiek:**
  1. ručne (tlačidlo Pridať na zoznam);
  2. **z receptu:** pri recepte tlačidlo „Chýbajúce na zoznam“ pridá suroviny, ktorých je v sklade menej, než recept potrebuje (rozdiel);
  3. **došlo:** keď množstvo položky klesne na 0 (uvarením alebo Vyhodiť), appka ponúkne „Pridať na zoznam?“ (otázka 5);
  4. **minimálna zásoba** pri položke (nepovinné pole): pod ňou sa položka ponúkne na zoznam (otázka 6).
- **Kúpené:** zaškrtnutá položka sa dá jedným ťuknutím pridať do skladu (predvyplní názov, jednotku, čiarový kód z predchádzajúceho výrobku, D-238), alebo len odstrániť zo zoznamu. Ak sa nákup zapíše z dokladu (3.1), zoznam sa s ním nespája automaticky (názvy na doklade sú skrátené).
- **Zdieľanie:** zoznam sa dá odoslať ako text cez zdieľací list (rovnako ako týždenný súhrn, D-155, D-277), napríklad partnerovi do správy. Nič sa neodosiela samo.
- Zoznam nemení výdavky ani rozpočet.

## 4. Čo sa nemení

- Transakcie, kapitál, dátum cieľa, rozpočet.
- Recepty a uvarenie.
- Kto nepoužíva položky dokladu, môže zadať cenu ručne alebo ju nechať prázdnu.

## 5. Riziká

- **Kognitívna záťaž:** ďalšie pole a akcia pri položke. Zmiernenie: cena je nepovinná, Vyhodiť je jedno tlačidlo, prenos z dokladu je dobrovoľný.
- **Skrátené názvy na dokladoch** („RAJC.CHERRY 250G“): názov sa dá upraviť pri prenose a výber predchádzajúceho výrobku ho nahradí.
- **Jednotky:** doklad nemá jednotku; pri váženom tovare (0,532 kg) ju používateľ vyberie.
- **Dvojité započítanie:** vyhodené sa nesmie rátať ako výdavok (už bol pri nákupe). Text to povie a výpočty to nerátajú.
- **Súkromie:** nové údaje ostávajú v zariadení a v zálohe ako ostatné (G3, D-297).

## 6. Rozsah a postup

1. Test najprv: prenos z dokladu, cena pri pripočítaní, Vyhodiť, súčet za mesiac, záloha a migrácia.
2. Schéma: `StockItem.unitPriceCents?`, `StockItem.sourceTransactionId?`, nový zoznam `wasteRecords`; nová verzia zálohy a IndexedDB.
3. UI v `src/features/sklad/` a tlačidlo v úprave výdavku (bez importu inej feature, D-174: cez vykresľovaciu funkciu ako pri prílohách, D-195).
4. Overenie: `tsc`, `vitest`, celé Playwright; zápis do pilotného záznamu, `docs/41` (nová úloha pre testerov), D-číslo.

Odhad: 1 až 2 dni bez nákupného zoznamu; nákupný zoznam ďalší 1 deň. Navrhujem dve etapy: najprv 3.1 až 3.4, potom 3.5.

## 7. Otázky na rozhodnutie

1. Položky dokladu pri prenose: **predvolene nezaškrtnuté (odporúčam)**, alebo zaškrtnuté?
2. Pri prešlej spotrebe ponúknuť **Vyhodiť** a **Ešte použiteľné**: áno (odporúčam)?
3. Vyhodené potraviny v bloku Opakované výdavky a dátum cieľa: **neskôr, po pilote (odporúčam)**, alebo hneď?
4. ~~Nákupný zoznam zatiaľ nerobiť~~ → zakladateľ: zapracovať (oddiel 3.5).

**Vysvetlenie k otázke 3:** na obrazovke Mesačný výdavok je blok „Opakované výdavky a dátum cieľa“ (D-290). Pri každom opakovanom výdavku ukazuje, o koľko mesiacov skôr by bol cieľ, keby sa tá suma mesačne investovala, napríklad „Streaming 12 € mesačne · o 1 mesiac skôr“. Otázka je, či tam má pribudnúť aj riadok **„vyhodené potraviny“** s mesačným priemerom za posledné 3 mesiace (napr. „vyhodené potraviny 15 € mesačne · o 2 mesiace skôr“). Odporúčam to až po pilote: priemer potrebuje aspoň 3 mesiace záznamov o vyhodení, ktoré zatiaľ nikto nemá.

**Nové otázky:**
5. Keď množstvo klesne na 0, ponúknuť „Pridať na zoznam?“: **áno (odporúčam)**?
6. Minimálna zásoba pri položke: **zatiaľ nie, až keď zoznam začneš používať (odporúčam)**, alebo hneď?
