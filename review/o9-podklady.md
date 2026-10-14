# O-9: zdroj predvolených hodnôt r a miery výberu (podklady)

> Stav: 2026-10-14. Podklad pre rozhodnutie zakladateľa, nie rozhodnutie. Zdroje sú sekundárne a treba ich overiť priamo v primárnych dokumentoch pred zapísaním do `Decisions.md` (CLAUDE.md: overenie finančných tvrdení).

## 1. Miera výberu (predvolene 4 %)

**Pôvod pravidla:** Trinity study (1998) ukázal, že pri 50/50 portfóliu akcií a dlhopisov USA a 30-ročnom horizonte úvodný výber 4 % s infláčnou úpravou prežil v 95 % historických klzných období. Údaje sú americké, z minulosti.
- Zdroj: [FPA Journal, aktualizácia Trinity study (2015)](https://financialplanningassociation.org/article/journal/AUG15-sustainable-retirement-spending-low-interest-rates-updating-trinity-study). Sekundárny prehľad: [ChooseFI](https://choosefi.com/four-percent-rule).

**Výhrady z rovnakých zdrojov:**
- Výsledok závisí od zloženia portfólia a od dĺžky horizontu. Pri 40 až 50 rokoch klesá úspešnosť a bezpečná miera je nižšia (asi 3,25 až 3,5 % pri 50 rokoch, podľa jedného zdroja).
- Poplatky znižujú úspešnosť: podľa Pfaua 96 % bez poplatkov, 84 % pri 1 %, 65 % pri 2 % (zdroj ChooseFI, treba overiť).

**Novší prístup:** Morningstar používa prognózy výnosov namiesto historických údajov. Základný prípad pre USA je **3,7 %** (2025), pri 90 % pravdepodobnosti, že peniaze vydržia 30 rokov. Pre Austrálsku verziu je 3,9 %.
- Zdroje: [Morningstar, bezpečná miera výberu 2025](https://www.morningstar.com/retirement/how-retirees-can-determine-safe-withdrawal-rate-2025), [Morningstar AU](https://morningstar.com.au/personal-finance/higher-valuations-lower-safe-withdrawal-rate-in-retirement). Čísla z vyhľadávania sa rozchádzajú (USA vs. Austrália), overiť v primárnej správe.

**Zhrnutie pre rozhodnutie:** 4 % je z historického výskumu USA s 50/50 portfóliom. Prognózne prístupy dávajú nižšie číslo (približne 3,7 %). Dátum cieľa je citlivý na túto hodnotu: podľa VISION 3,5 % zväčší T o 14 % oproti 4 %.

## 2. Reálny výnos r (predvolene 4 %)

**Dlhodobé reálne výnosy (Credit Suisse / UBS Global Investment Returns Yearbook, vydanie 2020, ~120 rokov):**
- globálne akcie: približne **5,2 % reálne ročne**,
- dlhopisy: približne **2,0 %**,
- štátne pokladničné poukážky: približne **0,8 %**.

Zdroj: [Cambridge JBS, The Long View (2020)](https://www.jbs.cam.ac.uk/2020/the-long-view/). Aktuálne vydanie 2025: [UBS Yearbook 2025](https://www.ubs.com/global/en/investment-bank/insights-and-data/2025/global-investment-returns-yearbook-2025). Čísla z vydania 2025 som nenašiel vo výsledkoch, treba ich overiť.

**Orientačný výpočet (nie odporúčanie):** portfólio 50 % akcií a 50 % dlhopisov s údajmi z roku 2020 dáva približne 3,6 % reálne pred poplatkami a daňami. Čisto akciové portfólio by dalo približne 5,2 %, čo je nad 4 %, ale ide o vysokú volatilitu.

**Zhrnutie pre rozhodnutie:** predvolených 4 % reálne na celý kapitál (D-025, D-032) je v hornej časti rozsahu pre zmiešané portfólio. Ak predvolená hodnota má zodpovedať ako investičnému, tak aj bezpečnému portfóliu, je 3,5 % konzervatívnejšie. Pri hotovosti je už 0 % (D-036).

## 3. Čo tieto podklady neriešia

- **Dane a poplatky:** nie sú v r ani v miere výberu (D-008, D-043). Pri daňovom režime investícií (backlog N-02) sa čistý výnos zníži.
- **Právna brána:** odporúčanie predvolených hodnôt môže byť blízko poradenstva (06 §6, D-028). Treba ho posúdiť pred Fázou 2.
- **Overenie zdrojov:** všetky čísla sú zo sekundárnych zdrojov a výsledkov vyhľadávania. Pred zápisom do `Decisions.md` ich overiť v primárnych dokumentoch (Trinity study, Morningstar 2025, Yearbook 2025).
