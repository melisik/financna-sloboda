# 62 – Strom vývoja: kde ostal len výhonok (2026-10-26)

> Stav: **návrh na rozhodnutie**. Kód sa nemení. Zostavil autor kódu prechodom kódu na `main` (`f7be2c3`) a rozhodnutí D-001 až D-325. Doplňuje `docs/60` (čo vidí tester) a `docs/61` (fázy a brány): tu ide o miesta, kde vývoj **začal, ale ďalej nevyrástol**. Metóda: exporty, ktoré nikto v appke nepoužíva; moduly, ktoré nikto neimportuje; polia dát, ktoré appka nezapisuje; verejné súbory bez použitia; rozhodnutia so slovami „neskôr“, „krok 2“, „odložené“, „čaká“. Čo nie je overené v kóde, je označené ako predpoklad.

## 1. Kmeň (hotové a používané)

Prehľad, transakcie, vyhodnotenie, nastavenia, záloha, rozpočet, pravidelné výdavky, scenáre výdavkov, ročný prehľad, zámok; vo Fáze 2 majetok, záväzky, investície, dane (evidencia a tlačivo), príjmy (zobrazenie), sklad. Každý z týchto modulov sa importuje a jeho funkcie appka volá. Žiadny modul v `src/features/` nie je prázdny (najmenší `spatna-vazba` má 48 riadkov a je v appke).

## 2. Výhonky v kóde (kód existuje, ale nič nerobí)

| # | Čo | Kde | Prečo je to výhonok | Návrh |
| --- | --- | --- | --- | --- |
| K1 | **Model ZŤP** (držiteľ preukazu ŤZP pre tlačivo 17-dp-md, oddiel I a V) | `src/domain/ztp.ts` | prázdny objekt „placeholder“, nikde importovaný; komentár: „náplň sa doplní po rozhodnutí o potrebe údajov“; rozhodnutie nie je | zmazať (a); alebo navrhnúť náplň (b), ak má tlačivo vypĺňať oslobodenie ZŤP |
| K2 | **Šablóna XML priznania typu B** (D-220, krok 2a) | `public/tlaciva/dpfo-rdp1-2025-sablona.xml`, test `tests/tax-xml-template.test.ts` | appka šablónu nepoužíva; krok 2b (generovanie) čaká na overenie zdrojov a test na portáli zakladateľom | nechať; súčasť N-18 a overenia daní |
| K3 | **Načítanie súboru integračnej služby** | `src/storage/feed.ts`, `Prijmy.tsx` | služba neexistuje (D-112); pre používateľa skryté (D-323) | nechať skryté; rozhodnúť po pilote |
| K4 | **Staré výpočty dopadu** `impactMonths`, `impactMonthsSplit` | `src/domain/impact.ts`, `src/domain/capital.ts` | appka ich nevolá (dopad počíta `impactWithRentals` a nasl.), volajú ich len testy | zmazať aj s ich testami, ak test nekryje niečo, čo inak pokryté nie je (overí autor) |
| K5 | **Komponent `Callout`** | `src/ui/kit/controls.tsx:90` | nikde použitý; appka používa `calloutStyle` | zmazať |
| K6 | **`groupOf`** | `src/app/navigation.ts` | len v testoch | nechať (malé, testuje skupiny menu) alebo zmazať |
| K7 | **Pole `Settings.lastReviewDate`** | typ a validácia (`validate.ts:363`) | appka ho nezapisuje; dátum posledného vyhodnotenia sa berie z vyhodnotení | nechať kvôli starším zálohám, doplniť komentár „len čítanie starých záloh“ |
| K8 | **Pole `Transaction.belowThreshold`** | typ a validácia | od D-120 sa značka počíta pri zobrazení, uložený príznak sa nepoužíva | nechať kvôli starším zálohám (zámer D-120); doplniť komentár |

Ostatné exporty, ktoré appka priamo nevolá (napr. `validateDog`, `needsRestock`, `recommendedReserveCents`), sa používajú vnútri vlastného súboru a sú exportované pre testy. Nie sú to výhonky.

## 3. Výhonky v rozhodnutiach (rozhodnuté, v kóde nezačaté)

| # | Rozhodnutie | Čo malo vzniknúť | Stav | Návrh |
| --- | --- | --- | --- | --- |
| R1 | **D-089, D-091** | odhad hodnoty nehnuteľnosti sa každý rok aktualizuje podľa indexu cien nehnuteľností (Eurostat) | v kóde nič; hodnotu mení len používateľ ručne. Eurostat je v kóde len pri inflácii (`assumptions.ts`, D-263) | rozhodnúť: (a) zrušiť a nechať ručný odhad s pripomienkou raz ročne; (b) ponechať na Fázu 3 (vyžaduje volanie API, mení D-009) |
| R2 | **D-114** | rodinná verzia, možnosť A (dve osoby v domácnosti) | len návrh `docs/16`; čaká na oprávnenia (E1) a zaradenie do fázy; D-148 bez účtov | presunúť do backlogu ako „po pilote“, aby nevyzeralo ako rozbehnuté |
| R3 | **D-209** | predvyplnenie z listu vlastníctva aj z PDF | funguje text a HTML, PDF odložené (nová závislosť, sken bez OCR) | nechať odložené |
| R4 | **D-198** | samostatné npm balíky `packages/core`, `packages/ui-kit` (krok 5 z `docs/23`) | odložené | nechať odložené; zapísať do backlogu |
| R5 | **D-104, FR-25** | daňový scenár (čísla po dani) | čaká na overené pravidlá | súčasť overenia daní |
| R6 | **`docs/12`, `docs/18` oddiel 5** | import cien investícií súborom („dvierka“) | v kóde nič | backlog po pilote |
| R7 | **N-17 až N-20** | vyhodené v Opakovaných výdavkoch, termíny daní, položky z fotky, ochrana výpočtu | backlog po pilote | bez zmeny |

## 4. Rozhodnutia, ktoré vyzerajú otvorené, ale sú uzavreté neskorším

Pri prechode sa ukázali vety „čaká“ alebo „neskôr“, ktoré už neplatia: D-110 (výhľad dôchodku → D-154), D-149 (odkaz na GitHub → D-280), D-167 (prečerpanie Q2 → D-215), D-241 (Fáza 2 vo verejnej verzii → D-248). V `Decisions.md` sa nemenia (história), ale v novších záznamoch na ne odkazy sú.

## 5. Riziká

- **Technický dlh:** K1, K4, K5 sú mŕtvy kód; mätie ďalšieho autora a reviewera (napr. ZŤP vyzerá ako rozbehnutá funkcia tlačiva).
- **Očakávanie zakladateľa:** R1 je rozhodnutie z 2026-10-16, ktoré sa nikdy nezačalo; ak sa s ním počíta (hodnota nehnuteľnosti ide do kapitálu pri prenájme), používateľ by mal vedieť, že odhad je len jeho.
- Odstránenie K1, K4, K5 nemení výpočty ani UI (D-153); K4 sa overí testami.

## 6. Otázky na rozhodnutie

1. **Mŕtvy kód K1 (ZŤP), K4 (staré výpočty dopadu), K5 (`Callout`):** zmazať – **áno (odporúčam)**? Pri ZŤP: alebo chceš oslobodenie ZŤP v tlačive riešiť (potom návrh)?
2. **K7, K8 (staré polia):** nechať kvôli starším zálohám a doplniť komentár – **áno (odporúčam)**?
3. **R1, ročná aktualizácia odhadu nehnuteľnosti podľa Eurostatu:** (a) **zrušiť, nechať ručný odhad a pripomenúť ho raz ročne (odporúčam;** volanie API by menilo D-009); (b) nechať na Fázu 3?
4. **R2 (rodinná verzia) a R4 (npm balíky):** zapísať do backlogu ako „po pilote“ – **áno (odporúčam)**?
