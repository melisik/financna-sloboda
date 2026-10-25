# 53 – Návrh: pravidelné výdavky a transakcie bez dvojitého zápisu

> Stav: **schválené a implementované** (2026-10-25, D-299): P-A + P-B, tolerancia ±1 €. Upozornenie sa ukáže len pri novom výdavku, nie pri úprave existujúceho; „Neukladať“ vyprázdni formulár. Vychádza z externej revízie 2026-10-25 (S-1), D-296 a `docs/50` oddiel 4.

## 1. Problém

Pravidelné výdavky (D-124) sa do Rozpočtu a bloku Tento mesiac rátajú automaticky. Appka nikde nehovorí, že sa nemajú zapisovať aj ako transakcie. Kto zapíše nájom aj ako pravidelný výdavok, aj ako mesačnú transakciu, má ho:
- v Rozpočte a na Prehľade dvakrát (D-131);
- v bloku Opakované výdavky a dátum cieľa raz ako pravidelný a raz v priemere kategórie (D-290).

Dátum cieľa to neovplyvní: počíta sa z kapitálu pri vyhodnotení a výdavok „z príjmu“ kapitál nemení (D-288). Ovplyvní to rozpočet a prehľad výdavkov.

## 2. Kontrola rozhodnutí

| Rozhodnutie | Vzťah |
| --- | --- |
| D-124: pravidelné výdavky | Pravidlo spresňuje, ako sa používajú. |
| D-131: rozpočet a Tento mesiac rátajú pravidelné aj transakcie | Nemení sa; mení sa len to, čo používateľ zapíše. |
| D-288: predvolený zdroj „z príjmu“ | Dvojitý zápis teda nemení kapitál ani dátum cieľa. |
| D-153: pilot | P-A a P-B menia len UI; P-C by menilo súčty rozpočtu, preto ho neodporúčam počas pilota. |

## 3. Možnosti

- **P-A Pravidlo a veta (odporúčam spolu s P-B).** V Pravidelných výdavkoch a v návode: „Pravidelné výdavky sa rátajú automaticky každý mesiac. Nezapisuj ich aj ako transakciu.“
- **P-B Upozornenie pri zápise (odporúčam).** Pri ukladaní výdavku, ktorý sa zhoduje s aktívnym pravidelným výdavkom (rovnaká kategória a suma ±1 € v rovnakom mesiaci), sa ukáže: „Toto vyzerá ako pravidelný výdavok „Nájom“, ktorý sa už ráta automaticky. Uložiť aj tak?“ s tlačidlami Uložiť aj tak a Neukladať. Nič sa neblokuje.
- **P-C Automatické vynechanie.** Zhodnú transakciu appka vynechá zo súčtov. Mení súčty rozpočtu bez vedomia používateľa a je ťažko predvídateľné (`docs/03`); neodporúčam.

## 4. Riziká

- **Falošné upozornenie** pri náhodne rovnakej sume (napr. dve predplatné po 9,99 €). Preto len upozornenie s „Uložiť aj tak“, nie blokovanie.
- **Ročné pravidelné výdavky** (poistka 120 € ročne): zhoda sa porovnáva s ročnou sumou v mesiaci platby, nie s mesačným podielom.
- **Kognitívna záťaž:** jedno dialógové okno navyše len pri zhode.

## 5. Rozsah

P-A: texty v `src/features/pravidelne/Pravidelne.tsx` a `docs/41`. P-B: čistá funkcia zhody v `src/domain/recurring.ts` s testami, upozornenie vo formulári transakcie (dáta pravidelných výdavkov cez kontext, bez importu inej feature, D-174). Odhad: pol dňa.

## 6. Otázky na rozhodnutie

1. **P-A + P-B (odporúčam)**, len P-A, alebo P-C?
2. Tolerancia zhody sumy **±1 € (odporúčam)**, alebo presná zhoda?
