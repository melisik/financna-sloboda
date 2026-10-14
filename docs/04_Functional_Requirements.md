# 04 – Funkčné požiadavky (MVP)

> Stav: v0.6 (2026-10-14). Rozsah: MVP, jeden používateľ, webová aplikácia (mobile-first), lokálne ukladanie (D-009, D-012). Odkazy: D-xxx = `decisions/Decisions.md`, UR-xx = `02_User_Requirements.md`, UX = `03_UX_Principles.md`. Označenie **[predpoklad]** = návrh Claude, treba potvrdiť.

## 1. Pojmy a model dát

| Pojem | Definícia |
|---|---|
| **Ročné výdavky (V)** | Odhad celkových ročných výdavkov v dôchodku, zadáva používateľ ručne (D-013). |
| **Miera výberu (p)** | Predvolene 4 %, rozsah 3–4 % (D-011). |
| **Cieľová suma (T)** | T = V / p. Pri 4 % je T = V × 25 (D-008). |
| **Kapitál (K)** | Hodnota investícií + nasporená suma, bez rezervy (D-011, D-017). |
| **Reálny výnos (r)** | Ročný výnos po inflácii, predvolene 4 %, rozsah 2–6 % (D-011). Počíta sa so všetkými sumami v dnešných cenách. |
| **Mesačné sporenie (m)** | Súčet transakcií typu „sporenie“ a „investícia“ za posledných 12 mesiacov, delený 12 (D-017). |
| **Rezerva** | Odporúčanie 3 mesiace výdavkov (rozsah 3–6), mimo cieľa (D-011). |
| **Vyhodnotenie (snapshot)** | Mesačný záznam s dátumom, hodnotou investícií a nasporenou sumou; zadáva sa na konci mesiaca (D-014). |
| **Referenčný dátum (D_L)** | Dátum posledného vyhodnotenia (najnovší snapshot). K_L a m sa vzťahujú k tomuto dňu. Dátum cieľa sa počíta od D_L a mení sa len pri novom vyhodnotení (D-024). |
| **Posledný stav (K_L)** | K zo snapshotu, ktorý je najnovší. Oficiálny cieľ sa počíta z neho, od D_L. |

### Entita Transakcia
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene dnes; nesmie byť v budúcnosti. |
| typ | sporenie / investícia / výdavok | áno | |
| suma | číslo, EUR, > 0 | áno | Na 2 desatinné miesta. |
| zdroj úhrady | z príjmu / z kapitálu | áno pri výdavku | Predvolene „z príjmu“ (D-014). Pri sporení a investícii sa nezadáva. |
| poznámka | text, max. 200 znakov | nie | |

### Entita Vyhodnotenie
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene posledný deň mesiaca (D-014). |
| hodnota investícií | číslo ≥ 0 | áno | |
| nasporená suma | číslo ≥ 0 | áno | Bez rezervy (D-017). |

### Entita Nastavenie cieľa
V, p, r, rezerva (mesiace), prah výdavkov, dátum vzniku. Každý parameter má predvolenú hodnotu, odporúčaný rozsah a príznak „zmenený používateľom“ (UR-02).

## 2. Výpočty

### FR-01 – Cieľová suma
T = V / p. Ak V ≤ 0 alebo p ≤ 0, výpočet sa nespustí a zobrazí sa výzva na opravu vstupu.

### FR-02 – Dátum cieľa (počet mesiacov do cieľa)
Výpočet v reálnych hodnotách, mesačné sporenie na konci mesiaca, mesačná sadzba `i = (1 + r)^(1/12) − 1`:

- Ak K_L ≥ T: cieľ je dosiahnutý, dátum = D_L (dátum posledného vyhodnotenia).
- Inak: `n = ln((T·i + m) / (K·i + m)) / ln(1 + i)`
- Ak r = 0: `n = (T − K) / m`.
- Ak `K·i + m = 0` (teda K = 0 a m = 0, alebo r = 0 a m = 0): kapitál nerastie, cieľ nie je dosiahnuteľný; zobrazí sa text „Bez sporenia a výnosu sa cieľ nedosiahne“ (bez dátumu). Ak m = 0 a r > 0, dátum existuje aj bez sporenia (rastie len výnos), len môže byť veľmi vzdialený (viď O-5).
- Dátum cieľa = D_L + `ceil(n − 1e-6)` mesiacov (ε chráni pred chybou pohyblivej desatinnej čiarky, GC-10) (orezané na posledný deň cieľového mesiaca), zobrazený ako mesiac a rok (D-024). Počíta sa z K = K_L a m, takže sa mení len pri novom vyhodnotení, nie s plynutím času.
- Zostávajúci čas = počet mesiacov od dneška do dátumu cieľa; mení sa s časom, dátum nie. Ak dátum uplynul bez vyhodnotenia, zobrazí sa „Dátum vypršal, urobte vyhodnotenie“, nie záporný čas (FR-10).
- Výnos medzi vyhodnoteniami sa na K_L nepripisuje. Dátum je tak konzervatívny; skutočné K môže byť medzitým vyššie. Pripisovanie by dátum posúvalo automaticky, čo je v rozpore s D-014 a FR-10. Výnos r je jeden predvolený predpoklad 4 % na celý kapitál vrátane hotovosti; klient si ho nastavuje sám (D-025).

**Overený príklad [predpoklad, na kontrolu]:** V = 24 000 €, K = 100 000 €, m = 500 €, r = 4 %. Dostaneme T = 600 000 €, i ≈ 0,3274 %, n ≈ 334 mesiacov (≈ 27 rokov 10 mesiacov).

### FR-03 – Rozsah dátumov (scenáre)
Tri scenáre sa počítajú rovnakým vzorcom s inými výnosmi (D-011):
- opatrný: r = 2 %,
- základný: r = nastavené r (predvolene 4 %),
- optimistický: r = 6 %.

Zobrazí sa ako „od – do“ (UX D-016): najskorší (optimistický) až najneskorší (opatrný) dátum. Základný je vyznačený textom, nie samostatným číslom. Všetky tri dátumy sa počítajú od D_L (D-024).

### FR-04 – Predbežný dopad transakcie
Pre každú transakciu po poslednom vyhodnotení sa počíta pracovný kapitál:

`K_pred = K_L + Σ(sporenie/investícia po K_L) − Σ(výdavky „z kapitálu“ po K_L)`

„Po K_L“ znamená transakcie s **dátumom po D_L** (dátum posledného vyhodnotenia), nie podľa času zadania. Transakcia zadaná neskôr s dátumom pred D_L je už v K_L a nepridáva sa znovu (FR-05).

Dopad = n(K_L) − n(K_pred), zaokrúhlený na celé mesiace. Obe n sa počítajú od D_L, takže dopad nezávisí od dnešného dátumu (D-024). Kladné číslo = cieľ bližšie, záporné = ďalej.
- Výsledok sa zobrazí ako krátky text (D-014), napr. „predbežne +2 mesiace“.
- Ak je zaokrúhlený dopad 0, zobrazí sa „bez zmeny v mesiacoch“.
- Pracovný kapitál sa **nepremieta do oficiálneho cieľa**, kým sa neurobí vyhodnotenie.

**Príklad:** K_L = 100 000 €, m = 500 €, nová investícia 5 000 € po poslednom vyhodnotení. K_pred = 105 000 €, n klesne z ≈ 334 na ≈ 328 mesiacov → „predbežne 6 mesiacov skôr“.

### FR-05 – Mesačné vyhodnotenie
Vstupy: dátum, hodnota investícií, nasporená suma (UR-11). Výsledok: nový snapshot K_L = hodnota investícií + nasporená suma, prepočet cieľa a dátumov, zobrazenie „Posledné vyhodnotenie: dátum“.

- Transakcie s dátumom ≤ dátum vyhodnotenia sú už zahrnuté v zadaných hodnotách a **nepridávajú sa znovu**.
- Transakcie po dátume vyhodnotenia tvoria nový predbežný dopad (FR-04).
- Prepis predchádzajúceho vyhodnotenia je možný len s potvrdením; história snapshotov sa zachováva.

### FR-06 – Zaokrúhľovanie a formát
Sumy: EUR na celé eurá v zobrazení, 2 desatinné miesta vo vstupe a v uložených dátach. Mesiace: celé čísla. Dátumy: slovensky, mesiac slovom (napr. „marec 2038“).

## 3. Správanie a pravidlá

### FR-07 – Prah výdavkov (D-013)
- Prah sa uplatní **len na výdavky**; predvolene 100 € (rozsah 100–500 € podľa cieľa).
- Výdavok pod prahom sa **neukladá** a aplikácia to pri zadaní jasne povie [predpoklad, O-2].
- Sporenie a investície sa ukladajú vždy bez ohľadu na sumu.

### FR-08 – Zdroj úhrady výdavku (D-014)
- „Z príjmu“: K sa nemení.
- „Z kapitálu“: K_pred sa znižuje o sumu. Po vyhodnotení sa zohľadní v zadanej nasporenej sume.
- Ak je výdavok z kapitálu väčší než K_L, navrhuje sa upozornenie a ponuka zmeny na „z príjmu“; ak používateľ potvrdí, K_pred = 0 a zobrazí sa „kapitál by bol vyčerpaný“ (D-021).

### FR-09 – Úprava a mazanie transakcie
- Úprava a mazanie sú možné vždy.
- Ak je dátum transakcie po poslednom vyhodnotení, prepočíta sa len predbežný dopad.
- Ak je dátum pred posledným vyhodnotením, zobrazí sa text: „Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.“
- Mazanie: potvrdenie a možnosť vrátiť späť (krátko po zmazaní), UX princíp 4.

### FR-10 – Vynechané vyhodnotenie (D-016)
- Oficiálny cieľ sa **nemení automaticky**; počíta sa z K_L a D_L. Dátum cieľa sa nemení, kým sa neurobí vyhodnotenie.
- Po uplynutí konca mesiaca bez vyhodnotenia sa zobrazí jemná pripomienka a dátum posledného vyhodnotenia.
- Predbežný dopad sa aj naďalej zobrazuje.

### FR-11 – Pripomienka
- Jedna pripomienka na konci mesiaca (v aplikácii; systémová notifikácia len ak ju používateľ povolí) [predpoklad].
- Vypnuteľná v nastaveniach.

### FR-12 – Prvé nastavenie
Postupnosť: cieľ (V, p, r, rezerva) s predvolenými hodnotami → investícia (aktuálna hodnota, predpokladaný výnos, UR-03) → prah → prvé vyhodnotenie. Každý krok sa dá preskočiť a doplniť neskôr; chýbajúce údaje sa zobrazia ako „nezadané“, nie ako nula. Prvé vyhodnotenie nastavuje D_L; kým neexistuje, dátum cieľa sa nezobrazuje.

### FR-13 – Odporúčania
- Odporúčanie je viditeľne označené a odlíšené od hodnoty používateľa (UR-02).
- Používateľ môže kedykoľvek vrátiť odporúčanú hodnotu jedným úkonom.
- Odporúčania sa týkajú len parametrov (D-007); aplikácia neodporúča produkty.

### FR-14 – Prehľad
Domovská obrazovka: cieľová suma, dátum cieľa ako rozsah (od D_L) a zostávajúci čas od dneška (D-024), predbežný dopad posledných transakcií, dátum posledného vyhodnotenia, tlačidlo na pridanie transakcie.

### FR-15 – História
Zoznam transakcií od najnovšej, filter podľa typu a obdobia, súčty za obdobie. Zobrazenie vyhodnotení (snapshotov) v samostatnej časti (UR-07).

## 4. Dáta, záloha a stav aplikácie

### FR-16 – Lokálne ukladanie (D-009)
- Všetky dáta sa ukladajú v zariadení (v úložisku prehliadača vhodnom na väčšie objemy dát, nie len v malých kľúč-hodnota položkách) [predpoklad, rieši architektúra].
- Žiadne odosielanie dát na server.
- Aplikácia funguje offline po prvom načítaní [predpoklad].

### FR-17 – Export
- Export do jedného súboru (JSON) so všetkými transakciami, vyhodnoteniami a nastaveniami.
- Súbor obsahuje číslo verzie schémy a dátum exportu.
- Aplikácia pri exporte pripomenie, že ide o citlivé finančné údaje.

### FR-18 – Import
- Import načíta súbor, overí verziu schémy a zobrazí náhľad (počet transakcií, vyhodnotení, dátum exportu).
- Import **nahradí** aktuálne dáta až po potvrdení (D-018).
- Neplatný súbor sa neimportuje a nič sa nezmení.

### FR-19 – Pripomenutie zálohy
Ak neboli exportované dáta viac ako 30 dní (alebo nikdy), zobrazí sa jemná pripomienka v prehľade [predpoklad].

## 5. Chybové a hraničné stavy

| Situácia | Správanie |
|---|---|
| Dátum cieľa uplynul bez vyhodnotenia | „Dátum vypršal, urobte vyhodnotenie“; bez záporného zostávajúceho času; dátum sa nepreposúva automaticky (D-024). |
| Cieľ je dosiahnutý (K_L ≥ T) | „Cieľ je dosiahnutý“; dátum = D_L (D-024). |
| Cieľ nie je dosiahnuteľný (bez kapitálu a sporenia) | „Bez sporenia a výnosu sa cieľ nedosiahne“, bez dátumu (D-019). |
| Dátum ďalej ako 50 rokov | „viac ako 50 rokov“ (D-019). |
| Chýbajúce údaje (napr. žiadne vyhodnotenie) | „Nezadané“, nie nula; výpočet pracuje s dostupnými údajmi a uvedie, čo chýba. |
| Záporná hodnota vstupu | Zablokovanie s vecnou správou. |
| Zmena po vyhodnotení | Viď FR-09. |
| Úložisko prehliadača plné alebo nedostupné | Jasná správa, dáta sa neprepíšu; ponuka exportu. |
| Prehliadač vymazal dáta | Prázdny stav s výzvou na import zálohy; žiadne tiché obnovy. |

## 6. Mimo rozsahu MVP
- Viacužívateľský režim, účty, synchronizácia na server.
- Integrácie na bankový účet alebo brokera (neskôr, mobilná aplikácia).
- Projekcia podľa výnosu a inflácie v grafe (odložená, D-008).
- Daně, poplatky, viac mien, viac krajín (fáza 2).
- Automatické oceňovanie investícií z trhových dát.

## 7. Rozhodnuté a otvorené otázky
**Rozhodnuté:**
- **O-1 Rezerva:** nie je v kapitáli K ani v cieli (D-017).
- **O-2 Výdavky pod prahom:** sa neukladajú (D-017).
- **O-3 Import zálohy:** nahradí aktuálne dáta po potvrdení (D-018).
- **O-4 Priemer sporenia:** za posledných 12 mesiacov, delený 12 (D-017).
- **O-5 Veľmi vzdialený dátum:** do 50 rokov, ďalej „viac ako 50 rokov“; bez kapitálu a sporenia text bez dátumu (D-019).
- **O-6 Výdavok z kapitálu väčší než kapitál:** upozornenie a ponuka zmeny na „z príjmu“; pri potvrdení K_pred = 0 a text „kapitál by bol vyčerpaný“ (D-021).

**Otvorené:** žiadne.
