# Poznámky k revízii – stav po read-only kontrole (2026-10-14)

Stav repozitára: `main`, po commite s rozhodnutím A (D-058). Balík `review/review-package-2026-10-14.md` je regenerovaný z dokumentov na `main`.

## 1. Čo sa zmenilo po nálezoch z read-only kontroly

| Nález | Stav | Kde |
|---|---|---|
| 1. Výnos na hotovosť v `04` (tabuľka pojmov) | opravené: hotovosť K_cash je bez výnosu (0 % reálne, D-036); tabuľka teraz hovorí, že výnos je pre K_inv | `04` pojmy, odsek Výnos |
| 2. Rezerva dvakrát (ledger vs. kontrola výdavku) | **rozhodnuté: voľba A (D-058)**. Rezerva nie je v K_cash a do kontroly výdavku ani presunu nevstupuje. Limit je K_cash ≥ 0. D-045 a D-052 sú v časti o rezerve nahradené. | D-058; `capital.ts` (`payFromCash`, `transferToInvestments` bez parametra rezervy); GC-19 |
| 3. T = V × 27 pri 3,7 % | opravené: T = V / p ≈ V × 27,03 (pre V = 24 000 € je T = 648 649 €) | `00`, `04` pojmy, D-049 |
| 4. Dva texty pre uplynutý dátum cieľa | opravené: jeden text, podľa FR-10 | D-024, `04`, `05`, `07` |
| 5. Počet testov (50 vs. 63) | opravené: zadanie uvádza 63 jednotkových a 6 E2E | `review/formalna-revizia-zadanie.md` |
| 6. GC-21 zaokrúhlenie | opravené: 417,417 − 417,360 = 0,056 mesiaca ≈ **1,7 dňa** (prepočet cez kód) | `07` GC-21 |
| 7. Commit v zadaní (`b77cd05`) a nesledovaný súbor | zadanie hovorí „alebo novší“; aktuálny commit balíka je v jeho hlavičke. Súbor `review/formalna-revizia-2026-10-14.md` nie je v našom repozitári, je to vaša lokálna kópia. | – |

Testy po zmene: `tsc` bez chýb, 63 jednotkových testov prechádza. E2E po zmene rezervy nebolo spustené (zmena sa dotýka len jednotkovej logiky a textov).

## 2. Zvyšné poznámky k revízii (návrhy, bez rozhodnutia)

**R26 – uzavreté (schválené zakladateľom).** Presne nulový dopad je „bez zmeny“; nenulový pod pol dňa je „predbežne +menej ako 1 deň“ (resp. „−“). Test v `tests/impact.test.ts`, FR-04 v `04`.

**Null v dopade – uzavreté (schválené zakladateľom).** Namiesto krátkeho textu sa zobrazí `UNREACHABLE_IMPACT_TEXT`: po transakcii sa cieľ pri súčasnom sporení a výnose nedosiahne, a uvedené sú možnosti, ako cieľ dosiahnuť (zvýšiť sporenie, znížiť výdavky, zvoliť zdroj „z príjmu“, zvážiť mieru výberu v rozsahu 3–4 % s upozornením na riziko). Text je bez finančného poradenstva a s upozornením na odhad pred daňou a poplatkami.

**Otvorené položky z predchádzajúcej evidencie** (`review/revizne-zaznamy.md`):
- S3 – predvolený zdroj úhrady výdavku (otvorené).
- S5 – heslo na export zálohy (otvorené; backlog N-05).
- V6 – dane v texte pre používateľa (otvorené; teraz v backlogu, `06` oddiel 8).
- M6 a M8 sa uzavreli rozhodnutiami D-049, D-050, D-051 a D-048.

**Mimo kódu, čaká na používateľa:**
- Test na iPhone po 8 dňoch neaktivity (najskôr 2026-10-22), výsledok do `review/ios-overenie.md`.
- Android: model a verzia systému.

## 3. Čo reviewer nemá overiť znova
- Vzorec FR-02, poradie vetiev a `targetDate` boli overené v read-only kontrole.
- Hodnoty GC-03 až GC-21 okrem GC-21 zodpovedajú (GC-21 je opravené na 1,7 dňa).

## 4. Druhé kolo (po read-only revízii balíka)

Kód a testy sú na `main` pri commite aktualizovanom touto zmenou (70 jednotkových testov, 6 E2E). Opravy dokumentov sú bez nových rozhodnutí, okrem rozhodnutia A (D-058), ktoré už bolo zapísané.

**Otvorené otázky pre zakladateľa (všetky tri zodpovedané, D-059 až D-061):**
1. **Prečerpanie K_inv (RR10, D-059):** zodpovedané, orez na 0 s potvrdením. zamietnuť výdavok z investícií, alebo orez K_inv na 0 s potvrdením? Dnes UI výdavok z investícií nad K_inv zamietne, ale `ledger.ts` a D-021 počítajú s orezom na 0 a textom „kapitál je 0 €“.
2. **Vklad do rezervy znižuje cieľový kapitál (RR8, V1, D-060):** zodpovedané, áno. je to zámer? Podľa D-058 áno, lebo vklad berie z K_cash. Potvrď, alebo zadaj inú možnosť.
3. **Odporúčania a MiFID (RR22, S9, D-061):** zodpovedané, premenované na východiskové predpoklady. premenovať „odporúčania“ v UI na „východiskové predpoklady“? Navrhujem áno.

**Už rozhodnuté (len zosúladené dokumenty):** mazanie transakcie bez potvrdenia s undo 8 s (D-054), povinná plocha na iPhone (D-042, D-053), prázdne polia pri prvom spustení (D-057), prah 100 € s rozsahom 100–500 € (D-048).

**Opravené chyby, ktoré reviewer nenašiel:** vzorec K_pred vo FR-04 počítal investíciu „z hotovosti“ ako prírastok K (presun K nemení); tabuľka transakcií nepripúšťala zdroj pri investícii, hoci ho kód a D-045 používajú.
