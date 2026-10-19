# 14 – Výhľad: starobný dôchodok a sociálne dávky (návrh)

> Stav: **návrh na diskusiu.** Kód sa nemení, kým vlastník nepotvrdí smer. Všetky pravidlá, čísla a lehoty v tomto dokumente sú **predpoklad, kým sa neoverí** v primárnom zdroji (Sociálna poisťovňa, ÚPSVaR, zákon).

## 1. Účel

Ukázať, z akých príjmov sa bude žiť v budúcnosti: starobný dôchodok, invalidný dôchodok, sociálne dávky. Používateľ vidí, aký príjem má od kedy, bez toho, aby sa mu zdanlivo odhadovalo niečo, čo nevie overiť.

## 2. Zdroj údajov

- **Sociálna poisťovňa** poskytuje výpis a predbežný výpočet dôchodku. Údaje sa **zadajú ručne** z výpisu. Automatické načítanie nie je možné, lebo D-009 a FR-16 zakazujú volania na externé služby v MVP.
- **Sociálne dávky** (ÚPSVaR, obec): výšky a nároky sa zadávajú ručne podľa rozhodnutia.
- Aplikácia neodhaduje výšku dôchodku ani dávky. Používa len číslo, ktoré zadal používateľ a ktoré má zdroj a dátum.

## 3. Čo sa eviduje (návrh)

| Údaj | Zdroj | Poznámka |
|---|---|---|
| Odhad mesačného starobného dôchodku (€) | výpis SP | zadá používateľ; uvedie sa dátum výpisu |
| Dátum výpisu | výpis SP | na zobrazenie „k akému dátumu“ |
| Plánovaný dátum odchodu do dôchodku | používateľ | predpokladaný; nie je to zákonný dátum |
| Invalidný dôchodok (€, od–do) | rozhodnutie SP | ak sa týka používateľa |
| Sociálna dávka (€, pravidelná alebo nepravidelná) | rozhodnutie ÚPSVaR | pravidelná sa počíta do mesačného súčtu |

## 4. Výhľad (zobrazenie, nie odhad)

- Starobný dôchodok sa zobrazí ako budúci príjem od plánovaného dátumu. Znázorní sa v príjmoch (D-109), nie ako zmena m.
- Ak je dátum odchodu neznámy, výhľad sa nezobrazuje, aby nevznikla falošná presnosť.
- Zobrazuje sa vždy s dátumom výpisu a upozornením, že ide o odhad zo zdroja.

## 5. Mimo návrhu (zatiaľ)

- Výpočet dôchodku z osobného účtu, dôchodkového veku a rokov služby. Pravidlá sa menia a patria do overeného zdroja, nie do aplikácie.
- Automatické úpravy dátumu cieľa podľa dôchodku (FR-02a, D-092 a rozhodnutia o daniach).
- Porovnanie s dôchodkom z druhého piliera a tretieho piliera. Tretí pilier je v Investíciách (D-105).

## 6. Riziká

- **Zavádzajúcosť:** výhľad s jedným číslom pôsobí ako istota. Preto dátum zdroja a označenie „odhad zo zdroja“ sú povinné.
- **Osobné údaje (D-090):** výpis SP obsahuje citlivé údaje. Do aplikácie sa prenesie len suma a dátum, nie celý výpis.
- **Pravidlá:** dávky a dôchodky sa menia každý rok. Aplikácia nesmie tvrdiť platnosť pravidla bez dátumu overenia.

## 7. Otvorené otázky pre vlastníka

1. Má výhľad len zobrazovať budúci príjem, alebo má ovplyvniť aj dátum cieľa (FR-02a)?
2. Máte k dispozícii výpis zo Sociálnej poisťovne, z ktorého by sa údaje prenášali?
3. Má sa invalidný dôchodok zobrazovať, ak nie je váš prípad? (Predpoklad: nie, zobrazí sa len ak je zadaný.)
4. Chcete sociálne dávky sledovať len ako nepravidelné príjmy, alebo aj ako pravidelné?
