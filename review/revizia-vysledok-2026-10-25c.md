# Výsledok externej revízie 2026-10-25 (c): zmeny D-305 až D-311

Reviewer: Claude (samostatná konverzácia, nie autor dokumentov ani kódu). Podklad: `review/revizia-zadanie-2026-10-25c.md`. Vetva `claude/phase2-property-card`, HEAD `4ad7e57` (D-312, zlúčenie do `main`). Zmeny D-305 až D-311 sú `80ab377` až `c5404f2`; prešiel som diff `dbf8090..c5404f2` v `src/` a `tests/`. Nič nebolo opravené; tento súbor je jediná zmena v repozitári.

**Dodatok pred pushom:** pri `git pull` prišlo D-313 (`c5b177f`, `0137edc`, `dcc5641`), ktoré prepisuje formulár transakcie (`Transakcie.tsx`, `validate.ts`). D-313 som nerevidoval. Podľa rýchleho pohľadu na nový kód sa uložené položky pri úprave načítajú do jedného zoznamu `items`, súčet sa počíta z neho a každá položka má tlačidlo Odstrániť. **S-1 a N-4 preto na aktuálnom HEAD pravdepodobne už neplatia**; N-5 (DPH 0 pri ručnej položke) platí ďalej. Ostatné nálezy sa D-313 netýka. D-313 patrí do ďalšej revízie.

Zmeny sú už v `main` (D-312), takže nálezy nižšie platia aj pre verejnú zostavu tam, kde sa ich týka (zbalené bloky a tlačivo sú v jadre, ručné položky dokladu tiež).

## 1. Rozsah a overenie

| Rozhodnutie | Commity | Prejdené súbory (stav na HEAD) |
| --- | --- | --- |
| D-305 | `80ab377` | `src/features/zaloha/BackupSection.tsx` (export aj `onFile`), `src/ui/kit/files.ts` |
| D-306, D-307 | `fa5571b`, `0125bc4` | `src/features/dane/Dane.tsx` (`TaxFormBlock`), `taxFormPdf.ts`, `src/ui/Sekcie.tsx` (umiestnenie bloku) |
| D-308 | `7134e1e` | `Transakcie.tsx` (ručné položky, celý tok uloženia), `src/storage/validate.ts` (`validateReceiptItem`), `ReceiptToStock.tsx`, `BackupSection.tsx`, `Prehlad.tsx`, `Navod.tsx`, `Sklad.tsx`, `Recepty.tsx`, `Dane.tsx` |
| D-309 | `e208397` | `src/ui/Sekcie.tsx` |
| D-310, D-311 | `a2ea8ab`, `c5404f2` | `src/ui/kit/FoldBlock.tsx`, `Majetok.tsx` (`PropertyForm`), `Zavazky.tsx` (`LiabilityForm`), `Investicie.tsx` (`InvestmentForm`), `src/domain/property.ts` |
| testy | uvedené commity | `helpers.ts`, `clarity-55`, `property-folds`, `layout-screens`, `modules`, `tax-form-state`, `liabilities`, `investments`, `mortgage-warning`, `backup-share` a ostatné zmenené špecifikácie (len premenovanie tlačidla a volanie `openPropertyFolds` / `openFormFolds`) |

| Kontrola | Výsledok reviewera |
| --- | --- |
| `npx tsc --noEmit` (po `npm ci`) | bez chýb |
| `npx vitest run` | 551 testov, 97 súborov, všetky prešli |
| Playwright, systémové písmo prostredia (Inter) | 494 z 498 prešlo; 4 zlyhania sú len `receipt-camera.spec.ts` (oba profily): špecifikácia má vlastné `test.use({ launchOptions })`, ktoré prepíše cestu k predinštalovanému prehliadaču, takže sa prehliadač nespustil (prostredie, nie appka). Táto špecifikácia sa D-305 až D-311 netýka. |
| Playwright, vynútené DejaVu Sans (D-304) | rovnako 494 z 498 (fontconfig s DejaVu Sans namiesto `sans-serif` a `system-ui`), tie isté 4 zlyhania z rovnakej príčiny |
| Vlastné overenie v prehliadači | S-1 a N-1 som overil dočasným testom nad zostavou `dist-test` (syntetické hodnoty, testovacia záloha); test som po overení zmazal. |

Playwright sady projektu som spustil s predinštalovaným Chromiom (`executablePath`) cez dočasný konfiguračný súbor mimo commitu; samotná sada sa nemenila.

## 2. Nálezy

### Kritické

Žiadne.

### Vysoké

Žiadne.

### Stredné

**S-1. Ručné položky pri úprave výdavku s uloženými položkami: súčet a nesúlad sa počítajú bez uložených položiek**
- **Súbor a miesto:** `src/features/transakcie/Transakcie.tsx`, `allNewItems` / `itemsTotal` / `itemsMismatch` (riadky 144–147) oproti `receiptItems` v `save` (riadok 245).
- **Problém:** pri uložení sa ručné položky **pripočítajú** k uloženým (`[...(existing?.receiptItems ?? []), ...manualItems]`, ak nie je vložený text), ale súčet, zoznam a upozornenie počítajú len s novými položkami (`[...parsedItems.items, ...manualItems]`). Overené v prehliadači: výdavok 3,17 € s ručnou položkou 3,17 € uložený; Upraviť → suma 4,17 €, ručne položka 1 € → súhrn „Doklad · priradený · súčet nesedí“, „Súčet položiek: 1,00 €“, červené „Súčet položiek sa nezhoduje so sumou výdavku 4,17 €“. Po uložení má výdavok 2 položky so súčtom 4,17 €, teda presne sedí. Opačne: ak uložené položky so sumou nesedia, upozornenie sa po pridaní ručnej položky môže ukázať alebo neukázať podľa náhody. Zoznam pod poľom ukazuje len novú položku, hoci uložia sa obe.
- **Dôsledok:** upozornenie na nesúlad je jediná ochrana pri uložení položiek (revízia 2026-10-25b, S-2). Pri úprave dáva teraz nepravdivý výsledok, takže používateľ buď „opraví“ správnu sumu výdavku na nesprávnu, alebo sa naučí upozornenie ignorovať. Suma výdavku ide do kapitálu a rozpočtu.
- **Návrh:** pri úprave bez vloženého textu počítať súčet, zoznam a nesúlad z `[...storedItems, ...manualItems]` (rovnaký zoznam, aký sa uloží); text „Uložené položky: n“ doplniť o súčet. Doplniť E2E test (uložené + ručná položka → súčet všetkých, bez falošného nesúladu).
- **Rozhodnutie zakladateľa:** nie.

**S-2 (opravené v D-314). Tlačivo 17-dp-md: Uložiť uloží staré PDF, keď sa medzitým zmenia psy alebo nehnuteľnosti**
- **Súbor a miesto:** `src/features/dane/Dane.tsx`, `ready` (riadok 90) sa nastaví po vyplnení a vymaže len pri ďalšom Vyplniť; `TaxFormBlock` v `Sekcie.tsx:146` nemá `key` podľa údajov.
- **Problém:** psy sa pridávajú a upravujú v tej istej sekcii priamo nad tlačivom (`DogSection`). Postup Vyplniť → pridať alebo upraviť psa → Uložiť tlačivo uloží PDF bez novej zmeny, rovnako odkaz „Otvoriť vyplnené PDF“ a poznámky. Pred D-307 sa PDF pri každom uložení vyplnilo znova, takže to riziko je nové. Ak sa zmažú všetky psy a nehnuteľnosti, Vyplniť zmizne, ale Uložiť tlačivo so starým PDF ostane.
- **Dôsledok:** používateľ podá priznanie k dani za psa alebo k dani z nehnuteľností so starými údajmi (napr. bez nového psa), hoci appka práve ukázala správne údaje vyššie. Daňový podklad je presne miesto, kde má byť výstup aktuálny.
- **Návrh:** pri zmene `properties`, `dogs` alebo `today` zrušiť `ready`, náhľad a poznámky (efekt so závislosťou na údajoch, alebo `key` z odtlačku údajov v `Sekcie.tsx`) a ukázať „Údaje sa zmenili, vyplň tlačivo znova“. Doplniť E2E test.
- **Rozhodnutie zakladateľa:** nie.

**S-3 (opravené v D-314, overenie na zariadeniach čaká). D-305 / D-307: záloha s heslom na iPhone pravdepodobne stále skončí v pôvodnom probléme; správanie v počítači sa zmenilo bez overenia**
- **Súbor a miesto:** `src/features/zaloha/BackupSection.tsx`, `exportBackupFile` (riadky 20–47): `await encryptBackup(...)` pred `navigator.share`, `catch` pri inej chybe než `AbortError` spadne na stiahnutie.
- **Problém:**
  - D-307 zistilo, že Safari na iPhone otvorí zdieľací list len hneď po ťuknutí. Pri zálohe s heslom sa pred zdieľaním šifruje (PBKDF2 a AES, rádovo sekundy pri väčšej zálohe s prílohami). Ak `share` zlyhá s `NotAllowedError`, kód potichu prejde na stiahnutie, teda presne na cestu, ktorú D-305 opisuje ako príčinu („otvorí sa na celú obrazovku bez cesty späť“). D-307 to uvádza ako riziko, ktoré overí zakladateľ; v kóde ani v teste ošetrené nie je. Odporúčaná je práve šifrovaná záloha.
  - Obnova prijme staršie zálohy aj nové: `onFile` typ súboru nekontroluje, číta text a `JSON.parse`; výber súboru má `accept="application/json,.json"`, podľa koncovky teda prejde aj nový súbor. Toto je v poriadku.
  - Typ `text/plain` sa v počítači správa inak než `application/json`, ak prehliadač zdieľanie súborov podporuje (Safari na Macu, Edge a Chrome vo Windows). Predpoklad (neoverené): Chromium povoľuje zdieľanie podľa koncovky aj typu a `.json` odmietne, takže vo Windows sa súbor stiahne ako doteraz; Safari na Macu by však mohol otvoriť zdieľací list bez možnosti uložiť do priečinka. Text pri tlačidle hovorí „v počítači sa súbor stiahne do priečinka Stiahnuté“. Na Androide zdieľanie `text/plain` ponúkne aj aplikácie na poznámky a správy; nezašifrovaná záloha (finančné údaje, čísla dokladov) tak môže skončiť ako text v cloudovej aplikácii. Pred D-305 to platilo tiež pre Android, ak `application/json` povolil.
- **Dôsledok:** používateľ iPhonu, ktorý použije odporúčané heslo, sa môže opäť zaseknúť v súbore bez cesty späť; na Macu sa záloha nemusí dať uložiť do súboru.
- **Návrh:** pri šifrovaní použiť rovnaký dvojkrok ako D-307 (Pripraviť zálohu → Uložiť zálohu), alebo pri `NotAllowedError` nespadnúť na stiahnutie, ale ukázať tlačidlo „Uložiť pripravenú zálohu“. Overiť na iPhone (so zálohou s prílohou a heslom), na Macu v Safari a na Androide; doplniť do `docs/41`. E2E `backup-share` overiť aj typ zdieľaného súboru.
- **Rozhodnutie zakladateľa:** nie (overenie na zariadeniach je v D-307 už pridelené zakladateľovi).

### Nízke

**N-1 (opravené v D-315). D-311: pri úprave záväzku je dátum zostatku skrytý v zbalenom bloku.** `Zavazky.tsx`, blok Podrobnosti (`openWhen={!!err || belowInterest}`); `balanceDate` = `initial?.balanceDate ?? today`. Pred D-311 bolo pole „Zostatok platí k (dátum)“ hneď pod zostatkom; teraz sa pri úprave existujúceho záväzku blok neotvorí (overené v prehliadači: súhrn „Podrobnosti · úrok 5 %“, pole dátumu neviditeľné). Kto prepíše zostatok podľa nového výpisu, uloží ho s doterajším dátumom a automatické splácanie (`useAutomaticUpdates.ts`, `amortizeLoan`) ho môže hneď znížiť o istinu za obdobie, ktoré už vo výpise je. Dopad je malý: dátum sa pri každom otvorení appky posúva na posledný celý mesiac, takže ide spravidla najviac o jednu mesačnú istinu, a zostatok dlhu nevstupuje do kapitálu ani do dátumu cieľa (do rozpočtu ide len splátka). Pri nehnuteľnosti je dátum v tom istom bloku ako zostatok hypotéky a blok je pri hypotéke otvorený. Návrh: dátum zostatku nechať pod zostatkom mimo bloku, alebo ho ukázať v súhrne („úrok 5 % · zostatok k 1. 10. 2026“). Rozhodnutie zakladateľa: nie.

**N-2 (opravené v D-315). D-310: súhrny v nadpisoch nie sú vždy pravdivé.** `Majetok.tsx`, riadky 617–621 a súhrny blokov:
- „Hypotéka · bez hypotéky“, keď je zostatok 0, ale splátka alebo sadzba vyplnená. Splátka sa uloží (`pay > 0`) a `monthlyCostsCents` (`property.ts:9`) ju započíta do mesačných nákladov na karte; `rentalGoal.ts:34` ju použije pri nájme (podľa `housingFlowCents` sa v rozpočte pri nulovom zostatku nepočíta). Blok je zbalený, takže skrytá splátka ovplyvňuje čísla na karte a súhrn tvrdí opak. Pred D-310 bola splátka viditeľná.
- „Kúpa · vyplnené“ po prepnutí režimu z prenájmu na vlastné bývanie, keď je vyplnený len dátum začiatku prenájmu (pole je skryté a neukladá sa).
- Investície: „Cieľ a daňový režim · bez cieľa“ neukáže zvolený daňový režim (iný než predvolený).

Návrh: súhrn Hypotéky z ktoréhokoľvek vyplneného poľa (napr. „bez zostatku · splátka 300 €“) a blok otvoriť; `rentalStart` počítať len pri prenájme; do súhrnu investície doplniť režim, ak nie je predvolený. Rozhodnutie zakladateľa: nie.

**N-3 (opravené v D-315). `FoldBlock`: chyba blok znova neotvorí, kým `openWhen` ostáva pravdivé.** `src/ui/kit/FoldBlock.tsx`: efekt otvorí blok len pri zmene `openWhen` z `false` na `true`. Pri `openWhen={!!err}` sa po prvej chybe otvoria všetky bloky; ak ich používateľ zbalí a ďalšie Uložiť vráti inú chybu (napr. v dátume zostatku hypotéky), `err` ostáva neprázdne, blok sa neotvorí a chybový text pod formulárom hovorí o skrytom poli. Rovnako pri `mortgageOn` a `!isEur`. Zbalený blok teda chybu neskryje pri prvom pokuse, ale pri opakovanom áno. Upozornenie na splátku pod úrokom (`Zavazky.tsx`) je mimo bloku, to je v poriadku. Návrh: otváranie viazať na udalosť (každé neúspešné uloženie), nie na hodnotu; alebo `useEffect` so závislosťou na texte chyby. Rozhodnutie zakladateľa: nie.

**N-4 (nahradené D-313). D-308: ručné položky sa nedajú odobrať a rozpísaná položka sa pri uložení potichu stratí.** `Transakcie.tsx`: zoznam položiek nemá tlačidlo Odobrať, chybnú ručnú položku zruší len „Zrušiť úpravu“ (celý formulár). Ak používateľ vyplní názov a sumu, ale neťukne „Pridať položku ručne“ a rovno uloží výdavok, položka sa neuloží a nič na to neupozorní. Uložené položky sa naďalej dajú odstrániť len vložením nového textu. Návrh: Odobrať pri každej novej položke; pri uložení s vyplnenými poľami ručnej položky ju pridať alebo upozorniť. Rozhodnutie zakladateľa: nie.

**N-5 (nahradené D-313). D-308: „DPH 0 %“ pri ručnej položke vyzerá ako údaj.** Zoznam ukáže „Syntetický jogurt: 2 ks, DPH 0 %, 3,00 €“; DPH používateľ nezadal a v skutočnosti je 10 až 23 %. Výpočet ju nepoužíva (overené: `vatPercent` číta len validácia a parser), takže ide len o text. Validácia zálohy kód „ručne“ aj DPH 0 prijme (`validateReceiptItem`), obnova zálohy s ručnými položkami teda funguje. Návrh: pri kóde „ručne“ zobraziť „DPH neuvedená“, alebo DPH v zozname vynechať. Rozhodnutie zakladateľa: nie.

**N-6 (opravené v D-315). D-306: krok v hlásení môže byť nesprávny a po úspešnom uložení ostane stará chyba.** `Dane.tsx`: `buildTaxFormFields` beží pred `fetch`, ale chyba v ňom sa ohlási ako krok „načítanie tlačiva“ (pôvod v údajoch, nie v sieti). Po zlyhaní Uložiť a následnom úspešnom Uložiť sa `err` nevymaže, takže sa ukáže zelené „uložené“ aj červená chyba naraz. Citlivé údaje hlásenie podľa mňa neprezradí: správy pdf-lib obsahujú nanajvýš znak, ktorý sa nedá zakódovať, alebo názov poľa, `setText` je v `taxFormPdf.ts` v `try`, správa je skrátená na 120 znakov a zobrazí sa len lokálne. Náhľad sa uvoľňuje správne (`revokeObjectURL` v upratovaní efektu pri novom náhľade aj pri zatvorení sekcie). Návrh: samostatný krok „príprava údajov“; `setErr(null)` pred uložením. Rozhodnutie zakladateľa: nie.

**N-7 (opravené v D-315). D-308: Chýbajúce na zoznam pri chybe úložiska ohlási, že položky pribudli.** `Sklad.tsx`, `addEntries` vráti `added` aj vtedy, keď `saveShoppingItems` zlyhá; `Recepty.tsx` potom ukáže „Na zoznam Nakúpiť … pribudlo: …“ a pod sekciou chybu úložiska. Návrh: pri chybe vrátiť prázdny výsledok so stavom chyby a vetu neukázať. Rozhodnutie zakladateľa: nie.

**N-8 (opravené v D-315). D-309: potvrdenie „Nastavenia sú uložené“ je ďalej od tlačidla.** `Sekcie.tsx`: hlásenie je hore v sekcii, nad tromi zbalenými blokmi, a formulár s tlačidlom Uložiť je teraz pod nimi. Na telefóne po uložení potvrdenie pravdepodobne nie je na obrazovke (neoverené v prehliadači). Inak je zmena len poradie a okraj (`marginTop` 24 → 0, prázdny `div` 16 px); obsah blokov a ich správanie sa nemenia. Návrh: potvrdenie aj pri tlačidle, alebo posunúť k nemu. Rozhodnutie zakladateľa: nie.

**N-9 (opravené v D-315). Zmenené testy chybu nezakrývajú, ale nové správanie blokov testujú len čiastočne.** `openPropertyFolds` a `openFormFolds` otvoria všetky zbalené bloky pred vypĺňaním, takže pôvodné testy overujú to isté ako predtým (polia, výpočet, upozornenia). Tým však už neoverujú, čo by bez helpera videl používateľ. Bez testu ostáva: otvorenie bloku pri úprave existujúcej položky s údajmi (hypotéka, iná mena), otvorenie blokov pri chybe, otvorenie Podrobností pri splátke pod úrokom, sám sa otvárajúci blok Mena a kurz (v `investments.spec` sa otvorí helperom skôr, než sa zadá USD). `layout-screens`: filter `l !== ""` vynechá polia bez popisu `span`; na obsah formulára Nastavení to nevplýva (prvých osem polí je rovnakých). `modules` a `tax-form-state`: nahradenie kontroly tlačidla kontrolou oblasti a `toHaveCount(0)` zodpovedá D-308. Návrh: jeden E2E test na každý formulár bez helpera (úprava položky s údajmi → blok otvorený; chyba → blok otvorený). Rozhodnutie zakladateľa: nie.

## 3. Ďalej overené bez nálezu

- **D-305:** obnova číta súbor bez ohľadu na typ, prijme staršie zálohy (`application/json`) aj nové (`text/plain` s `.json`); názov súboru a koncovka sa nemenia; zdieľanie a stiahnutie ostali v jednej funkcii.
- **D-307:** zdieľanie PDF sa spúšťa priamo z ťuknutia Uložiť; `AbortError` vráti „Súbor sa neuložil… klepni na Uložiť tlačivo znova“, čo zodpovedá novému tlačidlu.
- **D-308, ručné položky:** vyčistenie po uložení (`resetForm` → `setManualItems([])`) aj pri Zrušiť úpravu a pri začatí inej úpravy (`startEdit`); validácia (názov, množstvo a suma väčšie ako 0, názov do 200 znakov); kľúč zoznamu je s indexom, takže viac položiek s kódom „ručne“ nekoliduje (aj v `ReceiptToStock`); pri vloženom texte sa uložené položky nahradia novými a ručné sa pridajú, ako hovorí text pri poli; prázdny zoznam sa neukladá (`receiptItems.length > 0`); ručná položka otvorí Doklad (`docHasContent`). Pridať do skladu z ručnej položky funguje (aj test `clarity-55`).
- **D-308, ostatné:** Návod ako tlačidlo, väčší dátum cieľa, premenovanie tlačidla a nadpisu zálohy (aj vo vete pred importom), tlačivo bez tlačidla bez údajov; text výsledku Chýbajúce na zoznam rozlišuje prípad „už na zozname“.
- **D-310, D-311:** zbalený blok nemá rozpor stavu (`open` aj `onToggle` z jedného `useState`, rovnako ako oprava S-2 z revízie 2026-10-25b); hypotéka a iná mena sa pri úprave existujúcej položky otvoria (`useState(openWhen)`); pri prvej chybe sa otvoria všetky bloky; upozornenie na splátku pod úrokom je mimo bloku a blok otvorí; upozornenie na záložné právo z LV odkazuje na blok Hypotéka; súhrn Hypotéky a Mesačných nákladov ukazuje sumu. Výpočet sa nemení (D-153): `save` vo všetkých troch formulároch je bez zmeny.

## 4. Súhrn

**V poriadku:** `tsc`, `vitest` (551) a Playwright (494 z 498, zvyšok len prostredie, aj s DejaVu Sans); obnova prijme staré aj nové zálohy; ručné položky sa ukladajú a validujú správne a fungujú so skladom aj so zálohou; D-309 mení len poradie; zbalené bloky nemajú rozpor stavu a pri prvej chybe sa otvoria.

**Odporúčam opraviť (zmeny sú už v `main`):**
1. S-1: súčet a nesúlad ručných položiek pri úprave počítať spolu s uloženými.
2. S-2: Uložiť tlačivo nesmie uložiť PDF so starými údajmi.
3. S-3: dvojkrok aj pre šifrovanú zálohu a overenie na iPhone, Macu a Androide.

**Rozhodnutie zakladateľa:** žiadny nález ho nevyžaduje. Zlúčenie opráv do `main` ostáva na zakladateľovi.
