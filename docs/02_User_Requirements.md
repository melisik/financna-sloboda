# 02 – Požiadavky používateľa

> Stav: v0.1 (2026-10-13), rozsah: MVP (fáza 1, jeden používateľ). Zdroj: `00_Project_Vision.md`, `01_Personas.md`, `decisions/Decisions.md`.

## Používateľské príbehy (MVP)

| ID | Príbeh | Zdroj |
|----|--------|-------|
| UR-01 | Ako používateľ si nastavím cieľ (ročné výdavky, miera výberu, výnos, mesačné sporenie, rezerva) s odporúčanými predvolenými hodnotami. | D-008, D-011 |
| UR-02 | Ako používateľ vidím, ktorá hodnota je odporúčanie a ktorá moja vlastná, a môžem ju zmeniť. | D-011 |
| UR-03 | Ako používateľ zadám existujúcu investíciu: aktuálnu hodnotu a predpokladaný ročný výnos. | D-010 |
| UR-04 | Ako používateľ zadám transakciu (sporenie, investícia, výdavok) – rýchlo, na telefóne. | D-006, persona 1 |
| UR-05 | Ako používateľ nastavím prahovú sumu, od ktorej transakcie evidujem. | [user] |
| UR-06 | Ako používateľ po každej transakcii vidím prepočítaný cieľ (cieľová suma a dátum ako rozsah opatrný/základný/optimistický). | D-004, D-011 |
| UR-07 | Ako používateľ vidím históriu všetkých transakcií (záznam rozhodnutí). | D-004 |
| UR-08 | Ako používateľ môžem dáta exportovať a importovať (záloha). | D-009 |
| UR-09 | Ako používateľ vidím predpoklady a obmedzenia výpočtu (pravidlo 4 %, bez daní a poplatkov). | D-008 |

## Nefunkčné požiadavky (MVP) [predpoklad]
- **Mobile-first:** plne použiteľné na telefóne.
- **Lokálne ukladanie:** dáta ostávajú v zariadení (D-009); žiadne odosielanie na server.
- **Nízka kognitívna záťaž:** málo polí, jasný jazyk, žiadne zbytočné upozornenia; prepočet cieľa podáva informáciu, nie tlak.
- **Transparentnosť:** každý výpočet ukazuje vstupy a predpoklady.
- **Slovenčina** v rozhraní; texty pripravené na neskoršie preklady (EÚ).

## Konflikt na vyriešenie
Vo vízii (D-011) sú predvolené ročné výdavky a mesačné sporenie odvodené „z priemeru záznamov“. Ale ak používateľ eviduje **len väčšie výdavky nad prahom**, z transakcií sa **celkové ročné výdavky nedajú odvodiť** (chýbajú bežné výdavky). Návrh riešenia [predpoklad]:
- Ročné výdavky v dôchodku zadáva používateľ **ručne** (odhad celkových výdavkov), aplikácia ich z transakcií neodvodzuje.
- Mesačné sporenie a investovanie sa môže odvodiť z evidovaných transakcií typu sporenie/investícia (tie sa evidujú vždy, bez ohľadu na prah).
- Evidované výdavky nad prahom slúžia ako záznam rozhodnutí a pre „cielenú spotrebu“, nie na výpočet celkových výdavkov.

## Otvorené otázky
1. Potvrdiť riešenie konfliktu vyššie.
2. Má prah platiť len pre výdavky, alebo aj pre sporenie a investície? [predpoklad: len pre výdavky]
3. Aký vplyv má evidovaná „cielená spotreba“ na cieľ? (napr. jednorazový výdavok znižuje investovateľný kapitál alebo zvyšuje ročné výdavky?)
4. Predvolený prah: 100 € alebo 500 €? (používateľ povedal rozsah 100 – 500 €)
