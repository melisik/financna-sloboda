# 57 – Návrh: formulár transakcie so sumou zadanou len raz

> Stav: **návrh na schválenie** (2026-10-25). Kód sa nemení. Z prehliadky zakladateľa: „sumy zadávam na rôznych miestach a nerozumiem prečo“. Zakladateľ už rozhodol: bez zľavy a zaokrúhlenia (suma = súčet položiek), pri položke aj množstvo. D-153: bez zmeny výpočtu (mení sa len spôsob zadania; uložená transakcia má rovnaké polia).

## 1. Problém

Pri nákupe s dokladom sa suma zadáva dvakrát: hore pole Suma a v bloku Doklad suma každej položky (z portálu alebo ručne, D-129, D-308). Appka potom hlási nesúlad súčtu (D-300). Po uložení nie je vidno žiadne potvrdenie, a „Pridať do skladu“ je až v úprave (D-301).

## 2. Kontrola rozhodnutí

| Rozhodnutie | Vzťah |
| --- | --- |
| D-129, D-308: položky dokladu z portálu a ručne | Ostávajú; v režime Nákup po položkách sú jediným zdrojom sumy. |
| D-300 (S-2): upozornenie na nesúlad súčtu | Pri novom zápise zanikne (nesúlad nemôže vzniknúť). Pri starých transakciách s nesúladom ostane v úprave. |
| D-286, D-287: suma prvá, prilepený pruh Uložiť | Platí v režime Rýchly výdavok. |
| D-288: predvolený zdroj z príjmu | Bez zmeny v oboch režimoch. |
| D-299: upozornenie na dvojitý zápis pravidelného výdavku | Bez zmeny. |
| D-301: Pridať do skladu | Presúva sa aj k uloženiu nákupu po položkách. |
| D-133: číslo dokladu z QR | Ostáva v bloku Doklad; v režime Nákup po položkách. |

## 3. Návrh

### 3.1 Dva spôsoby zápisu výdavku
Hore vo formulári pri type výdavok prepínač:
- **Rýchly výdavok** (predvolený): Suma, zdroj, kategória, dátum, poznámka. Bez bloku Doklad.
- **Nákup po položkách:** bez poľa Suma. Položky (názov, množstvo, cena za kus alebo suma riadku) sa pridávajú ručne, alebo sa vloží text z portálu, alebo načíta QR. **Celková suma sa vypočíta** a je zobrazená veľkým písmom nad tlačidlom Uložiť („Spolu 5,86 €“). Položku sa dá upraviť alebo odstrániť.

Iné typy transakcií (sporenie, investícia, rezerva) majú len pole Suma.

### 3.2 Po uložení
- Potvrdenie v pruhu: „Výdavok 5,86 € je uložený.“ s odkazom „Zobraziť v histórii“; zmizne po ďalšom zápise.
- Pri nákupe po položkách a zapnutom Sklade aj **Pridať položky do skladu** (výber ako v D-301, predvolene nevybrané).

### 3.3 Úprava existujúcej transakcie
- Transakcia s položkami sa otvorí v režime Nákup po položkách.
- Ak je v starej transakcii súčet položiek iný ako suma (vznikla pred týmto návrhom), úprava ukáže upozornenie a ponúkne „Upraviť sumu podľa položiek“ alebo „Odstrániť položky“.

### 3.4 Poradie v histórii
Overiť a opraviť: zápis z toho istého dňa sa má ukázať navrchu (zakladateľ nevidel nový výdavok nad staršími z rovnakého dňa). Predpoklad: v histórii sa radí podľa dátumu a času vytvorenia, ale nový zápis bol zaradený inak; overí sa testom.

## 4. Riziká
- **Zvyk testerov:** blok Doklad sa mení na režim. Zmena sa spomenie v návode `docs/41`.
- **Zľavy na doklade:** položka so zľavou sa zadá zápornou položkou „zľava“ (zakladateľ nechce rozdiel sumy). Zvážiť, či povoliť zápornú položku. Otázka 1.
- **Testy:** viaceré E2E testy dokladu (`receipt-items`, `receipt-camera`, `review-b-fixes`, `clarity-55`, `stock-waste`) sa prepíšu na nový spôsob.

## 5. Otázky na rozhodnutie
1. Zľava na doklade ako záporná položka „zľava“: **áno (odporúčam)**, alebo zľavy neevidovať?
2. Pri položke zadávať **cenu za kus (odporúčam)**, alebo sumu riadku? Druhá hodnota sa dopočíta.
3. Potvrdenie po uložení aj pri rýchlom výdavku: **áno (odporúčam)**?
