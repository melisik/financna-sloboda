# Výsledok externej revízie 2026-10-25 (d): zmeny D-313 až D-318

Reviewer: Claude (samostatná konverzácia, nie autor dokumentov ani kódu). Podklad: `review/revizia-zadanie-2026-10-25d.md`. Vetva `claude/phase2-property-card`, HEAD `097b4e7` (zadanie revízie; posledná zmena kódu `a91e07c`). Prešiel som diff `c5b177f~1..a91e07c` v `src/` a `tests/` (D-313 začína `c5b177f`, preto som nevychádzal z `c0b3af4`, ktorý je zlučovací commit až po D-313) a dotknuté dokumenty. Nič nebolo opravené; tento súbor je jediná zmena v repozitári.

Zmeny D-313 až D-315 sú podľa D-316 a D-317, D-318 podľa D-319 (prišlo pri `git pull` pred pushom, mení len dokumenty) už v `main`; nálezy V-1, S-1 až S-3 sa týkajú formulára transakcie a zálohy, teda jadra aj verejnej zostavy (prenos do skladu len pri Fáze 2).

## 1. Rozsah a overenie

| Rozhodnutie | Prejdené súbory (stav na HEAD) |
| --- | --- |
| D-313, D-317, D-318 | `src/features/transakcie/Transakcie.tsx` (celý tok: režimy, položky, `save`, `startEdit`, `resetForm`, potvrdenie, návrhy), `src/storage/validate.ts` (`validateReceiptItem`, `validateTransaction`, `validateStockItem`), `src/features/sklad/ReceiptToStock.tsx`, `src/domain/waste.ts`, `src/storage/indexeddb.ts` (zápis bez validácie), `src/storage/backup.ts`, `src/domain/model/entities.ts`, `src/ui/Sekcie.tsx` |
| D-314 | `src/features/dane/Dane.tsx` (`TaxFormBlock`), `src/features/zaloha/BackupSection.tsx`, `src/ui/Sprievodca.tsx` |
| D-315 | `src/ui/kit/FoldBlock.tsx`, `Majetok.tsx` (`PropertyForm`), `Zavazky.tsx` (`LiabilityForm`), `Investicie.tsx`, `Sklad.tsx`, `Sekcie.tsx` |
| dokumenty | `decisions/Decisions.md` (D-129, D-313 až D-318), `docs/57`, `docs/58`, `docs/41`, `docs/55`, `docs/pilot/scenar-formular-transakcie-2026-10-25.md`, `docs/pilot/scenar-prehliadka-2026-10-25.md` |
| testy | všetky zmenené špecifikácie zo zadania (`receipt-items`, `receipt-camera`, `receipt-qr`, `stock-waste`, `clarity-55`, `transactions-quick`, `review-b-fixes`, `transaction-modes`, `fold-behavior`, `tax-form-state`, `backup-share`) |

| Kontrola | Výsledok reviewera |
| --- | --- |
| `npx tsc --noEmit` (po `npm ci`) | bez chýb |
| `npx vitest run` | 547 testov, 96 súborov, všetky prešli |
| Playwright, systémové písmo prostredia (Inter) | 515 z 516 prešlo. Jediné zlyhanie `stock-camera.spec.ts` (desktop, čakanie na kód z falošnej kamery) bolo počas súbežného behu mojich reprodukčných testov; samostatne prešlo 4 × 4 (`--repeat-each=2`, oba profily). Považujem ho za záťaž prostredia, nie chybu appky. |
| Playwright, vynútené DejaVu Sans (D-304) | 516 z 516 prešlo (fontconfig s DejaVu Sans pred `sans-serif` a `system-ui`; `fc-match` overené), vrátane `receipt-camera` a `stock-camera` |
| Vlastné overenie v prehliadači | V-1, S-1, S-2, S-3 a N-1 som overil dočasným testom nad `dist-test` (syntetické hodnoty, `public/testovacia-zaloha.json`) mimo repozitára. |

Prostredie: Playwright 1.56 hľadá Chromium 1194, predinštalované je 1243. Namiesto `executablePath` v konfigurácii som v kontajneri (mimo repozitára) prepojil cestu `chromium_headless_shell-1194` na predinštalovaný prehliadač, takže prešla aj `receipt-camera` s vlastnými `launchOptions`. Sada ani konfigurácia sa nemenili.

## 2. Nálezy

### Kritické

Žiadne.

### Vysoké

**V-1. Zľava prenesená do skladu vytvorí položku, s ktorou sa záloha nedá obnoviť**
- **Súbor a miesto:** `src/features/sklad/ReceiptToStock.tsx` (ponúka všetky `receiptItems`, aj záporné), `src/domain/waste.ts:5` (`receiptItemToStock`: `unitPriceCents = round(amountCents / quantity)`, pri zľave záporné), `src/storage/indexeddb.ts:242` (`applyStockChanges` zapisuje bez validácie), `src/storage/validate.ts:189` (`validateStockItem` cez `isCents` vyžaduje cenu ≥ 0).
- **Problém:** D-313 povolilo zápornú položku „zľava“ vo výdavku a validácia zálohy ju pri výdavku prijme, ale prenos do skladu s ňou nepočíta. V potvrdení po uložení (aj v úprave) je pri zľave zaškrtávacie políčko ako pri potravine. Po zaškrtnutí vznikne položka skladu „zľava“ s cenou −0,40 € za jednotku. Úložisko ju zapíše, lebo nevaliduje. Export zálohy prebehne bez chyby, ale **obnova toho istého súboru odmietne celú zálohu**: „položka skladu 1: cena za jednotku musí byť celé číslo v centoch“. Overené v prehliadači: chlieb 2 × 1,20 €, zľava 1 × −0,40 €, Uložiť → Pridať do skladu → zaškrtnúť zľavu → Záloha → Uložiť zálohu → ten istý súbor v Obnoviť zo zálohy → chyba vyššie.
- **Dôsledok:** používateľ má zálohu, o ktorej si myslí, že je v poriadku, a zistí to až pri strate zariadenia, keď je neskoro. Pri lokálnej appke je záloha jediná ochrana dát. Záporná cena v sklade navyše skreslí hodnotu vyhodeného (`waste.ts`) a vážený priemer ceny pri zlúčení s rovnakým produktom, a ponúkne sa ako návrh ceny (D-318, N-1).
- **Návrh:** v `ReceiptToStock` neponúkať položky s `amountCents <= 0` (alebo ich ukázať bez políčka s vysvetlením „zľava sa do skladu nepridáva“). Zvážiť aj systémovú poistku: pred exportom spustiť `validateAppData` a pri chybe povedať, čo je zlé, namiesto uloženia súboru, ktorý sa neobnoví (rovnaká trieda chyby je S-1). Doplniť E2E test (zľava v potvrdení nemá políčko; záloha sa obnoví) a jednotkový test, že `validateReceiptItem` prijme zápornú položku (dnes ho nemá žiadny test).
- **Rozhodnutie zakladateľa:** nie (oprava zjavnej chyby). Systémová kontrola pred exportom je návrh na rozhodnutie.

### Stredné

**S-1. Položka so sumou riadku 0,00 € sa uloží, záloha s ňou sa neobnoví**
- **Súbor a miesto:** `Transakcie.tsx:160`, `addItem`: kontroluje `p !== 0` a `q > 0`, ale nie `amountCents = round(unitPriceCents × q)`; `validate.ts:234` odmieta `amountCents === 0`.
- **Problém:** pri malom množstve alebo cene sa suma riadku zaokrúhli na 0 (napr. korenie 0,004 × 1,00 € = 0,00 €; pole Množstvo má krok 0,001). Formulár položku prijme, zobrazí „= 0,00 €“ a výdavok uloží. Overené v prehliadači: obnova zálohy potom odmietne celý súbor („transakcia 24, položka 2: suma musí byť nenulové celé číslo v centoch“). Pri zápornej cene vznikne `-0`, ktoré validácia tiež odmietne.
- **Dôsledok:** rovnaký ako V-1 (neobnoviteľná záloha); spúšťač je menej pravdepodobný (preklep v množstve), preto stredný.
- **Návrh:** v `addItem` aj v `changeQty` odmietnuť položku, ktorej suma riadku je po zaokrúhlení 0 („Suma riadku vychádza 0,00 €; skontroluj množstvo a cenu.“). Poistka pred exportom z V-1 by pokryla aj tento prípad.
- **Rozhodnutie zakladateľa:** nie.

**S-2. Prepnutie na Rýchly výdavok potichu zahodí položky, aj pri úprave uloženého nákupu**
- **Súbor a miesto:** `Transakcie.tsx:342` (`setMode("rychly")` bez kontroly), `:266` (`receiptItems = byItems ? items : undefined`).
- **Problém:** v režime Nákup po položkách sa ťuknutím na Rýchly výdavok položky skryjú, ale ostanú v stave; pri uložení sa nezapíšu. Pri úprave uloženého nákupu sa tak položky z výdavku natrvalo vymažú bez upozornenia (overené: výdavok 1,50 € s 1 položkou → Upraviť → Rýchly výdavok → Uložiť → v histórii už nie je „položiek: 1“). Tlačidlo Späť (vrátiť) pri úprave nie je. Opačne: suma napísaná v Rýchlom výdavku sa po prepnutí na položky a späť vymaže (efekt na riadku 159 nastaví `amount` na „“). V Rýchlom výdavku sa tiež skryje blok Overiť doklad, ale číslo dokladu priradené predtým (alebo pri starom rýchlom výdavku s dokladom) sa uloží ďalej bez možnosti ho vidieť či odstrániť.
- **Dôsledok:** strata zapísaných údajov jedným ťuknutím na prepínač, ktorý vyzerá ako neškodná voľba zobrazenia. Odkazy `sourceTransactionId` v sklade ostanú, položky výdavku nie.
- **Návrh:** pri prepnutí na Rýchly výdavok s neprázdnym zoznamom položiek sa opýtať („Položky (n) sa zahodia; suma ostane X €. Pokračovať?“), alebo položky ponechať a uložiť ich, kým ich používateľ výslovne nezmaže. Sumu z Rýchleho výdavku pri prepnutí neprepisovať, kým nepribudne prvá položka. Blok Overiť doklad ukázať, ak je priradené číslo dokladu, aj v Rýchlom výdavku. Doplniť E2E test.
- **Rozhodnutie zakladateľa:** áno, či má Rýchly výdavok položky zahodiť s otázkou, alebo ponechať.

**S-3. Vyplnená, ale nepridaná položka sa pri uložení potichu stratí; komentár tvrdí opak**
- **Súbor a miesto:** `Transakcie.tsx:265–266` (komentár „Vložený text, ktorý ešte nebol pridaný, sa nesmie potichu stratiť (D-129)“ nad riadkom, ktorý nič také nerobí).
- **Problém:** keď má zoznam aspoň jednu položku a používateľ vyplní Položka a Cena za kus ďalšej, ale ťukne rovno Uložiť transakciu, výdavok sa uloží bez nej (overené: jogurt 0,50 € v zozname, syr 2,00 € vyplnený a nepridaný → „Zapísané: výdavok 0,50 €“). Pri prázdnom zozname appka povie „Pridaj aspoň jednu položku.“, hoci ju používateľ práve napísal. Ochrana pre nevložený text z portálu (D-129, D-313 až D-317) zanikla s parserom; komentár ostal a zavádza ďalšieho autora.
- **Dôsledok:** podhodnotený výdavok (suma ide do kapitálu a rozpočtu). Na telefóne je Uložiť v prilepenom pruhu stále na očiach, takže krok „zabudnúť ťuknúť Pridať položku“ je pravdepodobný. Scenár zakladateľa 3.2 (`docs/pilot/scenar-formular-transakcie-2026-10-25.md`) očakáva, že appka v tomto prípade povie, čo spraviť.
- **Návrh:** pri uložení s vyplneným názvom alebo cenou nepridanej položky buď položku pridať automaticky (ak je platná), alebo zastaviť s „Položku „syr“ si ešte nepridal. Pridaj ju alebo vymaž pole.“ Komentár opraviť. Doplniť E2E test.
- **Rozhodnutie zakladateľa:** áno, či pridať automaticky, alebo zastaviť.

### Nízke

**N-1. Návrhy položiek (D-318): cena sa doplní aj pri inom produkte; poradie a zdroj „poslednej“ ceny**
- **Súbor a miesto:** `Transakcie.tsx:130–141` (`itemSuggestions`, `pickName`).
- **Problém:**
  - `pickName` beží pri každom znaku. Pri písaní „chlieb tmavý“ sa pri medzistave „chlieb“ (známa položka) doplní cena chleba a ostane, lebo pole už nie je prázdne (overené: cena 1,2 pri „chlieb tmavý“). D-318 hovorí o doplnení „pri zhode názvu“; tu sa doplní pri zhode predpony počas písania.
  - Ceny zo skladu sa vložia prvé a každý výdavok s rovnakým názvom ich prepíše, aj starší než posledná úprava skladu; cena v sklade je navyše vážený priemer (`waste.ts`) a za jednotku skladu (kg, l), nie „posledná cena za kus“. Pri zľave prenesenej do skladu (V-1) sa ponúkne záporná cena (filter `> 0` je len pri výdavkoch).
  - Poradie v `datalist` je poradie vloženia do `Map` (sklad, potom najstaršie nákupy), nie abecedné ani podľa posledného použitia; počet nie je obmedzený.
  - iPhone: Safari `datalist` podporuje, ale návrhy ukáže v lište nad klávesnicou a atribút `label` (cena) pravdepodobne nezobrazí (**predpoklad**, neoverené na zariadení). Na stolnom Chrome sa cena ukáže.
- **Dôsledok:** nesprávna cena predvyplnená bez upozornenia; používateľ ju vidí v susednom poli, preto nízke.
- **Návrh:** cenu doplniť len pri výbere z návrhu alebo pri opustení poľa (`onBlur`), nie pri každom znaku; pri výdavkoch a sklade brať naozaj najnovší záznam podľa dátumu a ignorovať ceny ≤ 0 aj zo skladu; obmedziť a zoradiť zoznam (napr. 50 naposledy použitých). Overiť na iPhone.
- **Rozhodnutie zakladateľa:** nie.

**N-2. Úprava starého výdavku s nesúladom súčtu zmení sumu pri akejkoľvek úprave**
- **Súbor a miesto:** `Transakcie.tsx:159` (efekt prepíše `amount` súčtom pri otvorení úpravy), `:373` (upozornenie „Pôvodná suma bola…“).
- **Problém:** podľa D-313 sa pri úprave uloží súčet a appka upozorní; to funguje. Pred D-313 sa však nesúlad dal vedome uložiť (zľava nezapísaná ako položka, D-129). Ak chce používateľ pri takom výdavku zmeniť len kategóriu alebo dátum, zmení sa aj suma, teda kapitál a rozpočet minulého mesiaca. Upozornenie neradí, ako pôvodnú sumu zachovať (pridať položku „zľava“ alebo „rozdiel“).
- **Dôsledok:** tichá zmena historických čísel pri bežnej úprave; podľa testovacej zálohy (súčet sedí) sa to v testoch neprejaví. Skutočné pilotné dáta môžu také výdavky mať (**predpoklad**).
- **Návrh:** do upozornenia doplniť tlačidlo „Zachovať pôvodnú sumu“, ktoré pridá položku „rozdiel“ so zápornou alebo kladnou sumou. Doplniť E2E test s výdavkom, ktorého súčet nesedí (dnes nie je pokrytý žiadnym testom, pozri časť 3).
- **Rozhodnutie zakladateľa:** áno (D-313 rozhodlo „uloží sa súčet“; doplnenie je zmena rozhodnutia).

**N-3. `FoldBlock.reopenOn`: rovnaká chyba po zbalení blok znova neotvorí**
- **Súbor a miesto:** `src/ui/kit/FoldBlock.tsx:11` (efekt so závislosťou `[openWhen, reopenOn]`); `Zavazky.tsx` `save` (a podobne ostatné formuláre) pred kontrolou nevolá `setErr(null)`.
- **Problém:** pri tej istej chybe sa `err` nezmení (rovnaký reťazec), efekt nebeží a zbalený blok ostane zbalený. Odpoveď na otázku zo zadania: **nie**, otvára sa len pri inej chybe. Test `fold-behavior` overuje len prechod na inú chybu. Chybová veta je pri tlačidle viditeľná, takže dopad je malý.
- **Návrh:** buď `setErr(null)` na začiatku `save` (React dávku zlúči, preto skôr počítadlo pokusov ako `reopenOn`), alebo to vedome prijať a opraviť komentár v `FoldBlock` („pri každej novej chybe“ → „pri inej chybe“).
- **Rozhodnutie zakladateľa:** nie.
- **Hypotéka (otázka zo zadania):** otvorenie bloku pri splátke alebo sadzbe bez zostatku aj pri bežnej úprave považujem za žiaduce: je to nekonzistentný stav (splátka ide do mesačných nákladov, D-315 N-2) a súhrn ho pomenuje. Hodnota 0 sa za vyplnenú nepovažuje, takže bežná nehnuteľnosť bez hypotéky (0, 0, 0) blok neotvorí. Nález nie je.

**N-4. Pripravená záloha (D-314) a Sprievodca**
- **Súbor a miesto:** `BackupSection.tsx:104–128`, `Sprievodca.tsx:98–103`.
- **Problém:** pripravený súbor v pamäti sa nezahodí pri zmene dát (napr. obnova zo zálohy v tej istej sekcii, alebo zmena údajov v inom okne). Ťuknutie na Uložiť pripravenú zálohu potom uloží starší stav, hoci `lastExportAt` dostane správny čas prípravy, takže pripomienka zálohy sa neoklame. Sprievodca pri `needsTap` stiahne súbor cez odkaz, ktorý nepridá do dokumentu a jeho URL neuvoľní (malý únik pamäte); na iPhone ide o cestu, ktorej sa D-305 snažilo vyhnúť, ale D-314 to rozhodlo vedome (záloha bez hesla sa nešifruje, oneskorenie je menej pravdepodobné).
- **Návrh:** `pending` vynulovať pri zmene `data` (efekt alebo `key`) a pri obnove; v Sprievodcovi `URL.revokeObjectURL` po kliknutí.
- **Rozhodnutie zakladateľa:** nie.

**N-5. Tlačivo 17-dp-md: kľúč údajov (D-314)**
- **Súbor a miesto:** `Dane.tsx:94` (`JSON.stringify([properties, dogs, today])` pri každom vykreslení).
- **Zistenie:** zmena údajov počas vypĺňania je ošetrená správne: `run` uloží kľúč z uzáveru pri štarte, takže ak sa údaje počas `await` zmenia, efekt výsledok zahodí. Kľúč zahŕňa aj polia, ktoré tlačivo nepoužíva (napr. `rentalLedger`), takže zápis nájmu zahodí pripravené PDF zbytočne; pri bežných objemoch (jednotky nehnuteľností) je cena serializácie zanedbateľná (**predpoklad**, nemerané). Nález nie je; len poznámka, ak by nehnuteľnosti niesli dlhé knihy nájmu.

**N-6. Validácia zálohy prijme nezmyselné položky**
- **Súbor a miesto:** `validate.ts:226–235`, `validateTransaction` (`:35–43`).
- **Problém:** záloha prijme výdavok, ktorého položky sú len zľavy (súčet záporný) pri kladnej sume, položku so zápornou cenou a kladnou sumou riadku (nesúlad znamienok) aj súčet položiek odlišný od sumy výdavku. UI nič z toho nevytvorí (okrem staršieho nesúladu, N-2), takže ide len o ručne upravené alebo poškodené súbory. Odpoveď na otázku zo zadania: **áno, prijme**.
- **Návrh:** pri položkách vyžadovať rovnaké znamienko `unitPriceCents` a `amountCents` a kladný súčet položiek; nesúlad súčtu so sumou ponechať (staršie dáta), prípadne len poznámka v náhľade importu.
- **Rozhodnutie zakladateľa:** nie.

**N-7. Zostatky po zrušenom parseri v dokumentácii a kóde (D-318)**
- `docs/pilot/scenar-formular-transakcie-2026-10-25.md`, časť 3 („Doklad z portálu alebo QR“, „Pridať z textu“): opisuje funkciu, ktorú D-318 zrušilo (tlačidlo „Pridať z textu“ bolo v kóde od D-313 po D-317). Scenár je už prejdený (D-317), ale ak sa použije znova, chce poznámku „zrušené D-318“.
- `docs/57_Navrh_formular_transakcie.md:26`: „alebo sa vloží text z portálu“, „suma riadku“; chce poznámku, že D-318 to zmenilo.
- `src/domain/model/entities.ts:25–31`: „Položka dokladu z portálu“, `unitPriceCents` „0 alebo viac“, `amountCents` „kladné“; po D-313 neplatí (zľava je záporná). `:45` „položky dokladu z portálu“.
- `Transakcie.tsx:265`: komentár o vloženom texte (S-3).
- `docs/41_Navod_pre_testerov.md:44`: „Pri výdavku s položkami dokladu skúste v úprave Pridať do skladu“ platí ďalej, ale hlavná cesta je teraz potvrdenie po uložení; veta to môže spomenúť. Zmienky v `docs/55` a `docs/pilot/scenar-prehliadka-2026-10-25.md` sú historické záznamy, oprava netreba.
- V `src/` nezostal žiadny import ani odkaz na `parseReceiptItems` alebo `receiptItems.ts`.
- **Rozhodnutie zakladateľa:** nie.

**N-8. Zaokrúhlenie pri desatinnom množstve (D-317, otázka zo zadania)**
- `changeQty` zaokrúhli množstvo na tisíciny a sumu riadku `Math.round(unitPriceCents × quantity)`; 0,532 kg × 2,49 € = 1,32 €, po + 1,532 × 2,49 € = 3,81 €. Výsledok sa zhoduje s bežným riadkom dokladu; súčet je súčtom zaokrúhlených riadkov, rovnako ako na doklade. Tlačidlo − je pri množstve ≤ 1 vypnuté, pri 1,532 zníži na 0,532. Nález nie je; okrajový prípad sumy 0 je S-1. Pretrváva N-5 z revízie 25c (DPH 0 pri ručnej položke), nové položky ho majú tiež.

## 3. Zmenené testy: zakrývajú niečo?

- `review-b-fixes` S-2: nahradenie testu nesúladu testom „nákup bez položiek sa neuloží“ je v poriadku pre nový nákup, ale **nesúlad stále nastať môže pri úprave starého výdavku** (N-2, upozornenie „Pôvodná suma bola…“). Táto vetva nemá žiadny test; navrhujem ho doplniť namiesto odstráneného.
- `receipt-items`, `stock-waste`, `clarity-55`: prepis na ručné položky zachováva pôvodné tvrdenia (súčet, uloženie, zobrazenie v úprave, prenos do skladu). `stock-waste` a `clarity-55` testujú Pridať do skladu z úpravy, nie z nového potvrdenia; potvrdenie pokrýva `transaction-modes`. Chybu nezakrývajú.
- `receipt-items` overuje doplnenie ceny len pri presnej zhode (`fill`), nie písanie po znakoch, preto N-1 neodhalí.
- `transaction-modes` neobsahuje: zľavu v prenose do skladu (V-1), sumu riadku 0 (S-1), prepnutie režimu s položkami (S-2), nepridanú položku (S-3), zmenu typu na príjem pri vyplnených položkách.
- Jednotkový test pre `validateReceiptItem` so zápornou položkou chýba (zmena validácie D-313 je pokrytá len nepriamo cez E2E, ktoré zálohu neexportuje).
- `transactions-quick`, `receipt-camera`, `receipt-qr`: len prepnutie do režimu položiek a nový názov bloku; v poriadku.
- `tax-form-state`, `backup-share`, `fold-behavior`: pokrývajú hlavné cesty D-314 a D-315; `fold-behavior` neoverí rovnakú chybu po zbalení (N-3), `backup-share` neoverí zmenu dát pri pripravenej zálohe (N-4).

## 4. Odpovede na ostatné otázky zo zadania

- **Suma iná než súčet položiek:** pri novom nákupe nie; `amount` sa nastavuje efektom zo súčtu a pole Suma sa neukáže. Pri úprave starého výdavku áno, vedome (N-2). Pri prepnutí na Rýchly výdavok ostane suma = súčet, ale položky sa zahodia (S-2).
- **Záporný alebo nulový súčet:** zablokovaný („Súčet položiek musí byť kladný.“); len zľava sa neuloží. V poriadku.
- **Zmena typu na príjem pri vyplnených položkách:** `byItems` je nepravda, položky sa neuložia (príjem ich mať nesmie), pole Suma ukáže súčet. Návrat na výdavok položky obnoví. V poriadku; zmena typu je výslovná voľba, na rozdiel od prepínača režimu v S-2.
- **Prázdny zoznam:** „Pridaj aspoň jednu položku.“ (aj keď je položka vyplnená, ale nepridaná, S-3).
- **Návrhy pri veľkom počte položiek a ceny 0:** ceny ≤ 0 z výdavkov sa vynechajú (zľavy sa neponúknu), zo skladu nie (N-1); zoznam nie je obmedzený.
- **Doplnenie ceny len pri prázdnom poli:** áno, ale pri každom znaku (N-1).
