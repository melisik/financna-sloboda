# Nálezy reviewera – balík 2026-10-14

Dátum: 2026-10-14. Vstup: `review/review-package-2026-10-14.md` (commit `9bf3fca`).
Stav overený proti `main` na commite `899e27a` (po `git pull`). Niektoré nálezy z balíka už boli v `main` vyriešené; stav je uvedený pri každom bode.

Overenie výpočtov: GC-03 až GC-20 a GC-21 prepočítané skriptom (uzavretý vzorec a iteračný výpočet pre `m_cash > 0`). Všetky čísla sedia, okrem GC-21 (rozdiel 0,056 mesiaca ≈ 1,7 dňa, nie 1,8). NPER konvencia (`pv = −K`, `pmt = −m`, `fv = T`) je správna. Algebra FR-02 je správna.

## Kritické

| # | Dokument / sekcia | Problém | Stav na `main` |
|---|---|---|---|
| K1 | 04 FR-04, D-045 | Presun z hotovosti do investícií sa pripočítaval do K_pred a zároveň do m. | Vyriešené: FR-04 rozlišuje príjem a presun, D-058. |
| K2 | 04 FR-08, D-045, GC-19 | Limit výdavku z hotovosti: cieľová rezerva vs. stav rezervy; nejasné účtovanie vkladu do rezervy. | Vyriešené: D-058, D-060, GC-19 prepísaný. |
| K3 | 04 FR-02, tabuľka v 04, D-036 | Výnos r pre celý kapitál vrátane hotovosti vs. hotovosť 0 %. | Vyriešené: D-070 (r len pre K_inv). Zosúladenie 00, 02 a 05 §5 je vo vete D-070; overiť v texte. |

## Vysoké

| # | Dokument / sekcia | Problém | Stav na `main` |
|---|---|---|---|
| V1 | 02 UR-01, 03 Kľúčové toky, 04 FR-12 vs. D-057 | Predvolené hodnoty pri prvom nastavení: predvyplnené, alebo prázdne? | **Neoverené** – treba prečítať UR-01 a FR-12. |
| V2 | 04 FR-01, FR-02 | Chýbajúce r alebo p pri prvom nastavení nie je definované; prázdna história pre m vedie k deleniu nulou. | **Otvorené** (nie je v D-057 ani FR). |
| V3 | 04 FR-02, FR-12 | Plocha na iPhone: D-042 „povinné“ vs. D-034/D-035/05 §11 „odporúčané“. | Vyriešené: D-068, 05 §11 aktualizované. Treba potvrdiť, že D-034/D-035 sú označené ako nahradené. |
| V4 | 00, D-049 | Miera výberu 3,7 % je kalibrovaná na 30-ročný horizont, pri skorom odchode je menej istá. | Vyriešené zápisom: D-069, D-065. Zdroj D-049 (`o9-podklady.md`) zostáva neoverený (RR29). |
| V5 | 00, 02, 04 (slovo „odporúčanie“) | Právna citlivosť slova „odporúčanie“ pri finančných číslach. | Vyriešené: D-061 (názov „východiskové predpoklady“). |
| V6 | 04 FR-18, D-018 | Import nahradí všetky dáta bez automatickej zálohy pred importom. | **Otvorené** – D-018 nemení. Odporúčanie: export pred importom automaticky. |
| V7 | 06 §2, §4, §3; D-022, D-023 | Stav projektu: 06 uvádza Fázu 0 „prebieha“ a M1 ako „plán“, kým `main` obsahuje kód M2–M4 (`b77cd05`, `3630c25`, `f155614`). D-022 hovorí, že M1 príde až po revízii. | **Otvorené** – 06 je zastaraný; zakladateľ musí rozhodnúť, či sa D-022 ruší alebo sa kód považuje za predčasný. |

## Stredné

| # | Dokument / sekcia | Problém | Stav |
|---|---|---|---|
| S1 | 07 §10 vs. 04 FR-02, FR-14 | „Čísla sa menia len po transakcii alebo vyhodnotení“ vs. zostávajúci čas, ktorý sa mení s dňom. | **Neoverené**. |
| S2 | 04 FR-04 | Backdatovaná transakcia pred D_L zadaná po vyhodnotení sa nezapočíta a aplikácia nič nehlási (tichá strata). | **Otvorené**. |
| S3 | 04 FR-02, 00 | Dátum cieľa je pred daňou; zobrazené riziko je v texte, bez daňového scenára. | Čiastočne: D-067 (dane mimo MVP) a upozornenie v texte. |
| S4 | 04 §1 (m) | „Mesiace histórie“ nie je jednoznačné (od prvej transakcie, D-040). Jednorazová veľká investícia tesne pred D_L zdvihne m. | **Otvorené**. |
| S5 | 04 FR-05 vs. D-055 | „Prepíše“ vs. „história sa zachová“: čo sa stane s prepísaným vyhodnotením. | **Neoverené**. |
| S6 | 04 FR-07 vs. D-048 | Prah 100–500 €: tvrdý limit, alebo odporúčaný rozsah? | **Neoverené**. |
| S7 | 04 FR-01 | Chýba validácia r (negatívne r, scenár opatrný môže klesnúť na 0 %). | **Otvorené**. |
| S8 | 04 FR-02, GC-01 až GC-21 | Príklady používajú r = 4 % a p = 4 %, nie predvolené 3,5 % a 3,7 %. | **Otvorené**: označiť ako testovacie vstupy. |

## Nízke

| # | Dokument / sekcia | Problém | Stav |
|---|---|---|---|
| N1 | 04 FR-04 vs. D-024 vs. D-019 vs. D-021 | Nezhodné texty: „Dátum vypršal“ / „Posledné vyhodnotenie je staršie“; „bez sporenia a výnosu“ / „pri súčasnom sporení a výnose“; „kapitál by bol vyčerpaný“ / „Hotovosť nestačila“. | **Čiastočne** (D-019 zjednotený s FR). Ostatné neoverené. |
| N2 | 07 §3 | GC-01 a GC-02 nie sú v zozname „označených“ ani „zatiaľ nemajú test“. | **Neoverené**. |
| N3 | D-039, D-011, D-025 | Nahradené rozhodnutia nie sú označené (D-039 → D-041; D-011 a D-025 → D-050). | **Neoverené**. |
| N4 | 05 §4 (`date`, `cent`) | Presnosť zaokrúhľovania T pri `T = V / p` nie je zapísaná. | **Otvorené**. |
| N5 | celý balík | Kódy z predošlých revízií (H2, S1, N1, L6, R18, V1, RR…) nie sú definované v balíku. | **Otvorené**: pridať legendu alebo odkaz. |
| N6 | 05 §10 (hosting) | GitHub Pages vidí IP adresy návštevníkov; veta „hosting nepozná dáta používateľa“ je presná len pre obsah v zariadení. | **Otvorené**. |

## Čo je v poriadku

- Algebra FR-02, poradie vetiev a ošetrenie delenia nulou.
- Všetky GC čísla okrem GC-21 (drobná odchýlka).
- Konvencia NPER a ceil s toleranciou 1e-6.
- Ukladanie súm v centoch ako celých číslach.
- Referenčný dátum D_L (D-024, D-044).
- Poznámka, že CSP v meta tagu nepodporuje `frame-ancestors`, `report-uri` a `sandbox`.

## Otvorené otázky pre zakladateľa

1. Ruší sa D-022 (revízia pred M1), alebo sa kód M2–M4 považuje za výnimku? (V7)
2. Predvyplnené alebo prázdne polia pri prvom nastavení? (V1, D-057)
3. Čo je „mesiac histórie“ pre m a ako sa počíta pri jednorazovej veľkej investícii? (S4)
4. Má import automaticky vytvoriť zálohu pred nahradením dát? (V6)
5. Je prah 100–500 € tvrdý limit, alebo odporúčaný rozsah? (S6)
6. Overiť zdroj 3,5 % a 3,7 % (RR29, `review/o9-podklady.md`) pred M3, alebo ich ponechať ako predpoklad s upozornením?
