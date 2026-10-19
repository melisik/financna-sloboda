# 16 – Rodinná verzia (návrh, nezačatý)

> Stav: **návrh na diskusiu, bez implementácie.** Dokumenty dnes predpokladajú jednoosobovú aplikáciu (vlastník, 2026-10-16: jednoosobovosť v MVP; M-05 „zdieľaný cieľ“ je odložený). Tento návrh ju rozširuje na domácnosť dvoch dospelých. Všetko, čo tu nie je v dokumentoch, je predpoklad.

## 1. Problém

Manželia alebo partneri majú viac príjmov (každý má mzdu, prípadne dávky a dôchodky), spoločné výdavky a jeden spoločný cieľ. Dnes má aplikácia jednu osobu: jeden zoznam príjmov, jeden zoznam majetku, jeden rozpočet. Pri dvoch ľuďoch sa stane jedno z dvoch: buď každý vedie vlastnú aplikáciu a spoločný obraz chýba, alebo jeden človek zapisuje všetko za oboch a pravidelné príjmy druhého sa strácajú.

## 2. Čo by sa menilo (návrh)

- **Osoba:** každý príjem, záväzok, položka investícií a majetok nesie údaj o osobe (ja, partner, spoločné). Pre jednu osobu sa nič nemení.
- **Domácnosť:** jeden cieľ a jedno vyhodnotenie pre obe osoby. Dátum cieľa sa počíta zo súčtu kapitálu.
- **Rozpočet:** kategórie sú spoločné; výdavky môžu mať osobu (napr. osobné výdavky jedného z dvoch).
- **Pohľad:** prepínač „spolu“ / „ja“ / „partner“ na obrazovkách. Hlavný výsledok je spoločný.

## 3. Možnosti

### A. Jedna domácnosť s osobami (odporúčané)
- Jedna aplikácia, jedno úložisko, dve osoby ako atribút položiek.
- Jeden zápis, jeden cieľ, jeden výpočet. Najmenej duplicít.
- Vyžaduje rozšírenie všetkých úložísk o pole osoby a zmenu zálohy (nová verzia schémy).
- Riziko: jeden z partnerov môže vidieť a meniť údaje druhého. To treba riešiť oprávneniami (E1), ktoré sú odložené.

### B. Dve samostatné aplikácie, spoločný súhrn
- Každý vedie svoje údaje; spoločný súhrn sa pripraví exportom (súbor).
- Súkromie je oddelené: každý vidí len svoje.
- Nevýhoda: dva zápisy, spoločný cieľ sa počíta z exportov a môže byť zastaraný.

### C. Len spoločný cieľ (minimum)
- Pridá sa iba spoločný cieľ a spoločný kapitál, príjmy a výdavky ostávajú v jednej aplikácii jednej osoby.
- Najmenšia zmena, ale nerieši rozdelené príjmy.

## 4. Súvislosti s existujúcimi rozhodnutiami

- **D-090 a D-026 (ochrana dát):** údaje dvoch osôb sú citlivejšie a ochrana sa musí posúdiť znova.
- **E1 a E2 (oprávnenia a bezpečnostný model):** odložené; pre A sú nevyhnutné.
- **M-05 (zdieľaný cieľ):** v dokumentoch odložený. Tento návrh ho rozpracováva.
- **Záloha a schéma (FR-28):** pridanie osoby je zmena schémy; import starých záloh musí dostať predvolenú osobu „ja“.

## 5. Otvorené otázky pre vlastníka

1. Ktorú možnosť zvoliť: A (jedna domácnosť), B (dve aplikácie), alebo C (len spoločný cieľ)?
2. Má mať každý z partnerov vlastné oprávnenie (vidí len svoje údaje), alebo sa oba údaje vidia navzájom?
3. Kto robí vyhodnotenie: obaja spoločne, alebo jeden za domácnosť?
4. Patria spoločné výdavky do rozpočtu jedného z partnerov, alebo do samostatnej kategórie domácnosti?
5. Kedy to zaradiť: až po overení pilota (Fáza 1b), alebo už do MVP? Dokumenty to zatiaľ odkladajú.
