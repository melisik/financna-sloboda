# Výsledok externej revízie 2026-10-25 (b): kód D-278 až D-281, D-284, D-286, D-287, D-289

Reviewer: Claude (samostatná konverzácia, nie autor dokumentov ani kódu). Podklad: `review/revizia-zadanie-2026-10-24.md` (tabuľka časti 1 a časť 2) a odporúčanie v `review/revizia-vysledok-2026-10-25.md`, oddiel 5. Vetva `claude/phase2-property-card`, HEAD `d764558`; pred pushom prišiel commit `f1c4d4f` (D-298), ktorý `Transakcie.tsx` mení len pri filtri a súčte, takže nálezy platia aj po ňom. Nič nebolo opravené; tento súbor je jediná zmena v repozitári.

Nálezy, ktoré už rieši D-295 (klávesnica na iPhone pri prilepenom pruhu) a D-296 (odpovede na revíziu 2026-10-25), sa tu neopakujú.

## 1. Rozsah a overenie

| Rozhodnutie | Commity | Prejdené súbory (stav na HEAD) |
| --- | --- | --- |
| D-278 | `4b10aa7`, `bac0071` | `index.html` (tokeny), `src/ui/kit/controls.tsx`, `NextStep.tsx`, `tests/design-tokens.test.ts`; obrazovky len výberovo |
| D-279 | `dd728d1` | `src/ui/Navigacia.tsx`, `index.html` (`.nav-sections`), `tests/e2e/nav-scroll.spec.ts` |
| D-280 | `2cdbfa6` | `src/app/features.ts`, `src/features/spatna-vazba/*`, `src/ui/Shell.tsx`, `.github/workflows/preview-phase2.yml` |
| D-281 | `88abf9d` | `src/ui/Shell.tsx`, `src/ui/trialNotice.ts`, testy, otázka 8 v `docs/Podklad_pravne_posudenie.md` |
| D-284 | `98d60d8` (časť C1) | `src/features/sklad/barcode.ts`, `CameraScanner.tsx`, `Sklad.tsx`, `public/sw.js`, `tests/e2e/bundle.spec.ts` |
| D-286, D-287 | `51ddf9c`, `fcc2503` | `src/features/transakcie/Transakcie.tsx` (celý súbor), `tests/e2e/transactions-quick.spec.ts` |
| D-289 | `8360835` | `src/features/prehlad/Vyvoj.tsx`, `progressText.ts`, `src/ui/kit/LineChart.tsx`, `chartGeometry.ts`, `src/domain/progressHistory.ts`, `annualOverview.ts`, `impact.ts` (`plural`) |

| Kontrola | Výsledok reviewera |
| --- | --- |
| `npx tsc --noEmit` | bez chýb |
| `npx vitest run` | 532 testov, 93 súborov, všetky prešli |
| `vite build` (VITE_PHASE2=1, mimo repozitára) | bez chýb; v `index.html` nie je `modulepreload` na knižnicu skenera; `ChecksumException` je len v samostatnom bloku (`esm-*.js`), nie v hlavnom balíku |
| Playwright (sada projektu) | nespustená: prostredie má prehliadač pre inú verziu Playwrightu. Dva nálezy (S-1, S-2) som overil vlastným skriptom s predinštalovaným Playwrightom nad zostavou z `vite preview` (mimo repozitára, syntetické hodnoty). |

## 2. Nálezy

### Kritické

Žiadne.

### Vysoké

Žiadne.

### Stredné

**S-1. Zdroj (a typ) transakcie sa po uložení ani po „Zrušiť úpravu“ nevráti na predvolený „z príjmu“**
- **Súbor a miesto:** `src/features/transakcie/Transakcie.tsx`, `resetForm` (riadky 130–144) nevolá `setSource` ani `setType`; `startEdit` (riadky 146–162) ich nastaví z upravovanej transakcie.
- **Problém:** predvolený zdroj „z príjmu“ (D-014, D-288) platí len pre prvý zápis po otvorení sekcie. Overené v prehliadači:
  - výdavok uložený „z investícií“ → ďalší nový výdavok má zdroj „z investícií“;
  - Upraviť (výdavok „z investícií“) → Zrušiť úpravu → nový výdavok má zdroj „z investícií“, hoci používateľ predtým zvolil „z príjmu“.
  Rovnako ostáva typ (napr. po úprave investície je ďalší zápis investícia). D-286 tento tok zosilnil: úprava je teraz hore v tom istom formulári a po nej používateľ pokračuje rovno novým zápisom.
- **Dôsledok:** výdavok zapísaný s nechceným zdrojom zníži K_inv alebo K_cash, teda pracovný kapitál a po ďalšom vyhodnotení aj dátum cieľa. Zdroj je vo formulári viditeľný, ale je to presne chyba, ktorú D-288 malo odstrániť. Súvisí aj s nálezom S-4 z revízie 2026-10-25 (porovnanie kapitálu počas pilota podľa zdroja).
- **Návrh:** po úprave (uložení aj zrušení) vrátiť typ a zdroj na predvolené; pri sérii nových zápisov rozhodnúť, či si formulár pamätá posledný zdroj. Doplniť E2E test (Upraviť → Zrušiť úpravu → zdroj „z príjmu“).
- **Rozhodnutie zakladateľa:** áno pre správanie pri sérii nových zápisov (pamätať posledný zdroj, alebo vždy „z príjmu“); návrat po úprave je technická oprava.

**S-2. Zbalený „Doklad“ skryje upozornenie na nesúlad súčtu položiek**
- **Súbor a miesto:** `Transakcie.tsx`, `<details open={docShown} onToggle={… setDocOpen(…)}>` (riadok 312), `docShown` (riadok 272), upozornenie `itemsMismatch` (riadky 366–368).
- **Problém:** keď je v poli položiek text, `docShown` je stále `true`. Používateľ môže blok zbaliť ťuknutím na súhrn: prehliadač ho zatvorí, `docOpen` sa nastaví na `false`, ale hodnota atribútu `open` sa pre React nezmení (`true` → `true`), takže ho znovu neotvorí. Stav a zobrazenie sa rozídu (rovnaký mechanizmus ako N-6 z revízie 2026-10-25; D-298 ho počas tejto revízie opravilo pri filtri, pri Doklade nie). Overené v prehliadači: po zbalení je text „Súčet položiek sa nezhoduje so sumou výdavku…“ neviditeľný a ostane neviditeľný aj po zmene sumy. Súhrn ukazuje „· priradený“ len pri čísle dokladu alebo uložených položkách, nie pri rozpísanom texte alebo nesúlade.
- **Dôsledok:** výdavok sa dá uložiť s položkami, ktorých súčet nesedí, bez viditeľného upozornenia (uloženie pri nesúlade je zámerne povolené, upozornenie je jediná ochrana). Nerozpoznané riadky zablokujú uloženie a chyba sa ukáže v prilepenom pruhu, blok sa však sám neotvorí. Zadanie sa pýtalo práve na toto („Môže sa chyba v položkách dokladu skryť v zbalenom bloku?“): áno.
- **Návrh:** blok buď nedovoliť zbaliť, kým obsahuje nesúlad alebo nerozpoznané riadky, alebo ukázať stav v súhrne („Doklad · súčet nesedí“, „· nerozpoznané riadky“); stav `open` riadiť jedným zdrojom (ako pri pruhu Skúšobná verzia v `Shell.tsx`). Doplniť E2E test.
- **Rozhodnutie zakladateľa:** nie.

**S-3. Skener offline: zlyhanie načítania knižnice sa hlási ako problém s kamerou; obmedzenie platí znova po každej aktualizácii**
- **Súbor a miesto:** `src/features/sklad/CameraScanner.tsx` (`catch` → `cameraError()`), `barcode.ts` (`readBarcode` vráti `undefined` pri akejkoľvek chybe), `public/sw.js` (cache `fin-sloboda-v1`, „cache najprv“ pre skripty).
- **Problém:**
  - Knižnica sa načíta pred kamerou (`createBarcodeReader` pred `getUserMedia`). Ak sa nenačíta (offline, Sklad nebol otvorený online), používateľ dostane „Kamera nie je dostupná. Povoľ ju v prehliadači alebo použi fotku obalu.“ Rada meniť povolenie je mylná. Pri fotke obalu sa ukáže „Čiarový kód sa z fotky nenašiel.“, teda chyba používateľa, nie appky.
  - Blok knižnice má v názve hash. Po aktualizácii appky, ktorá ho zmení (napr. nová verzia knižnice alebo zostavovača), nový blok v cache nie je, kým používateľ neotvorí Sklad online. Zapísané obmedzenie („ak bol Sklad aspoň raz otvorený online“, D-284, `docs/43`) je teda presnejšie „od poslednej aktualizácie“.
  - Obmedzenie nie je uvedené pre používateľa ani v návode pre testerov (`docs/41`); je len v D-284 a `docs/43`.
- **Dôsledok:** tester offline (napr. v obchode alebo v pivnici pri sklade) dostane nesprávnu radu a môže nahlásiť chybu kamery.
- **Návrh:** rozlíšiť chybu načítania knižnice („Skener sa nepodarilo načítať bez siete. Otvor Sklad raz s pripojením.“) od chyby kamery, a pri fotke rovnako; doplniť vetu do `docs/41` a spresniť znenie obmedzenia v D-284 / `docs/43`.
- **Rozhodnutie zakladateľa:** nie (prijateľnosť obmedzenia samotného je už rozhodnutá v D-284).

### Nízke

**N-1. D-287: upozornenie a potvrdenie vyčerpania investícií nie sú v prilepenom pruhu.** `Transakcie.tsx`, riadky 375–382 sú nad pruhom (riadok 387). Pruh nič neprekrýva natrvalo (pri posunutí k jeho miestu je všetko viditeľné), ale pri dlhom formulári (rozbalený doklad) používateľ po stlačení Uložiť vidí v pruhu len chybu „Potvrď, že investície sa vyčerpajú.“, kým text upozornenia a zaškrtávacie políčko sú pod okrajom obrazovky. Rovnako veta „Vklad do rezervy zníži kapitál pre cieľ…“. Návrh: dať `preview.note` a políčko do pruhu, alebo pri tejto chybe posunúť políčko do zobrazenia. Odpoveď na otázku zo zadania („Neskrýva pruh upozornenia alebo potvrdenie?“): neskrýva, ale oddeľuje ich od tlačidla. Rozhodnutie zakladateľa: nie.

**N-2. D-284: oprava vypnutia kamery nemá test.** Logika v `CameraScanner.tsx` je správna: pri zatvorení počas načítania knižnice sa kamera vôbec nezapne (`if (!alive) return` pred `getUserMedia`), pri zatvorení počas pýtania povolenia sa stopy hneď zastavia, upratanie volá `reader?.reset()` aj pri ešte nevytvorenom čítači. Žiadny test to však neoveruje (v `tests/e2e/` sa skener otvára len v `privacy-network.spec.ts`). Návrh: E2E s podvrhnutým `getUserMedia`, ktoré sa vyrieši až po Zrušiť, a kontrola, že `track.stop()` bol zavolaný. Rozhodnutie zakladateľa: nie.

**N-3. D-281: zmena textu pruhu bez zvýšenia verzie kľúča by sa používateľom neukázala.** `trialNotice.ts`: kľúč `fs-trial-note-collapsed-v1` sa musí pri podstatnej zmene textu zvýšiť ručne; test kontroluje len, že kľúč má číslo verzie. Kto zmení `TRIAL_DETAILS` (napr. po právnom posúdení, otázka 8), ľahko zabudne, a zbalený pruh novú vetu neukáže. Návrh: test, ktorý viaže text na verziu (napr. pevný odtlačok textu v teste so správou „zvýš verziu kľúča“). Rozhodnutie zakladateľa: nie.

**N-4. D-281: otázka 8 pre právnika je o niečo užšia než správanie appky.** Otázka hovorí o zbalení „po potvrdení používateľom“. Pruh sa však zbalí a voľba sa uloží aj ťuknutím na súhrn, bez tlačidla „Rozumiem, zbaliť“ (`onToggle` → `change`). V súlade s D-281 („zostane, ako ho používateľ nechal“), ale právnik by mal vedieť, že potvrdenie nie je jediná cesta. Ďalej: v zbalenom stave nie je „bez záruky“ ani „nie je finančné poradenstvo“ na Prehľade nikde inde viditeľné (scenáre a dopad ho majú vo vlastnom texte). Obsah D-144 je v pruhu celý (overené aj testom `tests/trial-notice.test.ts`). Návrh: doplniť do otázky 8 „zbalí sa potvrdením alebo ťuknutím na súhrn“ a „na Prehľade potom nie je iné upozornenie na finančné poradenstvo“. Rozhodnutie zakladateľa: nie (spresnenie podkladu); odpoveď na otázku 8 je na právnikovi.

**N-5. Texty o poplatkoch si odporujú (súvisí s presunom vety v D-281).** Prehľad: „Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.“ (`Prehlad.tsx`, `trialNotice.ts`). Scenáre Veľký a Mesačný výdavok a text dopadu: „Odhad je pred daňou a poplatkami…“ (`ScenarVydavku.tsx:85`, `MesacnyVydavok.tsx:67`, `impact.ts:14`), hoci počítajú s `ctx.realReturn`, teda s výnosom po poplatkoch (`netRealReturn` v `context.ts:37`). Nie je to nové v D-281, ale je to rovnaký typ nezrovnalosti ako inflácia v D-282. Návrh: zjednotiť na „pred daňou, po poplatkoch, ak ich zadáš“. Rozhodnutie zakladateľa: nie (znenie).

**N-6. D-289: body grafu sú rozložené rovnomerne, nie podľa dátumu.** `chartGeometry.ts`, `chartPoints`. Pod grafom sú len dátumy začiatku a konca, takže os pôsobí ako časová. Pri nepravidelných vyhodnoteniach (napr. dve v jednom mesiaci, potom pauza pol roka) je sklon čiary skreslený. `docs/44` to neuvádza. Ostatné z otázok zadania je v poriadku: graf ukazuje len uložené vyhodnotenia (žiadna projekcia, D-008), mierka je od 0 a zahŕňa cieľovú sumu (poctivé, aj keď pri malom kapitáli je čiara pri spodku), chýbajúce nehnuteľnosti sú vysvetlené, dátumy cieľa v tabuľke a vo vete sa zhodujú s Prehľadom (rovnaký základný dátum vyhodnotenia a dnešné nastavenia). Návrh: x podľa dátumu, alebo veta „body sú vyhodnotenia v poradí, nie časová os“. Rozhodnutie zakladateľa: nie.

**N-7. D-289: pravidlo skloňovania som ani teraz nepotvrdil primárnym zdrojom.** Kód (`plural`: „mesiace“ len pre 2 až 4) volajú všetky miesta s absolútnou hodnotou, takže záporné čísla nevadia; „22 dní“ je tiež v poriadku. Vyhľadávanie našlo len pravidlo o písaní zložených čísloviek dovedna v základnom tvare a príklad „dvadsaťosem žiakov“ ([TASR, jazykový stĺpček](https://www.teraz.sk/slovencina/slovencina-jednoslovne-viacslovne-cislov/343961-clanok.html), [učebný text](https://ucimsadoma.weblahko.sk/Hviezdoslav/1.kategoria_poezia/SJL%20Cislovky%20-%20teoria%20+%20test%20s%20riesenim%20-%207.%20rocnik.pdf)); ten väzbu pri 22 až 24 nerozhoduje. Článok JÚĽŠ o zložených číslovkách ([Jarošová, SAV](https://www.sav.sk/journals/uploads/12101101zlozene-cislovky-so-zretelom-na-pisanie-spolu-a-oddelene.pdf)) uvádza, že pravidlá z rokov 1991 a 1998 pripúšťajú dvojtvary. Pravdepodobne sú teda prípustné obe formy („dvadsaťdva mesiacov“ aj „dvadsať dva mesiace“) a zvolený tvar nie je chyba. Návrh: overiť v Jazykovej poradni JÚĽŠ a citovať v `docs/30` (T3). Rozhodnutie zakladateľa: nie.

**N-8. D-279: posúvateľný riadok sekcií nemá zaručený signál, že pokračuje.** `docs/40` sa spolieha na orezaný posledný štítok. Či je orezaný, závisí od šírky obrazovky a veľkosti písma; keď hrana štítka padne na okraj riadku, alebo keď sa riadok posunie k aktívnej sekcii vpravo (štítky vľavo zmiznú), signál chýba a iOS posuvník nezobrazí. Ďalej: riadok má `overflow-x: auto` a nulový horný okraj, takže obrys zamerania klávesnicou (`:focus-visible`, 3 px + odsadenie 2 px, D-278) bude pravdepodobne hore a dole orezaný (v prehliadači som neoveroval). Návrh: jemný prechod alebo šípka na okraji riadku a horný/dolný okraj riadku aspoň 6 px; overiť úlohou 9 v `docs/41`. Rozhodnutie zakladateľa: nie.

**N-9. D-280: oslovenie v bloku pripomienok sa mení podľa zostavy.** V náhľade „Pripomienku pošlite… Nepíšte…“ (vykanie), vo verejnej zostave „Vyber, ako pripomienku pošleš. Nepíš…“ (tykanie), zvyšok appky tyká. Funkčne je D-280 v poriadku: GitHub sa v náhľade neponúka (`feedbackChannels`), iný odkaz na GitHub v `src/` nie je, `VITE_PREVIEW` nastavuje len `preview-phase2.yml` a do odkazu na formulár sa nepridávajú údaje. Návrh: zjednotiť oslovenie. Rozhodnutie zakladateľa: nie.

## 3. Ďalej overené bez nálezu

- **D-278:** tokeny `--focus`, `--link`, `--warn-border` a veľkosti písma sú vo svetlom režime aj v oboch tmavých; `btn`, `btnPrimary`, `btnDanger` a `btnLink` majú `minHeight: 44` s `box-sizing: border-box` (aj zmenšené varianty s `padding: "2px 8px"`, lebo `minHeight` ostáva). Záporný zvislý okraj `btnLink` (−10 px) zodpovedá výške riadku 24 px, takže odkaz v texte nezväčší riadok. Kontrast hlavných dvojíc farieb som odhadom prepočítal (text a tlačidlá vo svetlom aj tmavom režime) a spĺňa AA. Skok na aktívnu sekciu (`bac0071`) je v `Navigacia.tsx` vyriešený `preventDefault` a `scrollTo(0, 0)`.
- **D-279:** riadok sa posúva do strany len pod 600 px; posun aktívnej sekcie do zobrazenia mení `scrollLeft` riadku, nie stránku; test kontroluje výšku menu, presah stránky a viditeľnosť aktívnej sekcie.
- **D-281:** obsah D-144 je celý (súhrn + podrobnosti); bez úložiska je pruh rozbalený; ovládaný `<details>` s `onToggle` nemá rozpor stavu (na rozdiel od S-2); odkaz Záloha sa nezobrazuje v sekcii Záloha ani bez menu.
- **D-284:** v zostave nie je `modulepreload` na blok knižnice, takže sa naozaj nenačíta pri štarte; `preloadBarcodeReader` chybu ticho zahodí (v poriadku, skutočné použitie ju ohlási, pozri S-3).
- **D-286:** vrátenie zmazania (D-160) funguje aj zo zmazania v úprave (prílohy sa načítajú pred zmazaním a obnovia sa); zmazanie má potvrdenie (D-199); zmazaním upravovanej transakcie sa formulár vyprázdni. Zmenené E2E testy (`home`, `attachments`, `transactions-filter`, `receipt-items`, `receipt-camera`) len menia cestu k tlačidlám (cez Upraviť, otvorenie Dokladu) a stále overujú pôvodné správanie; chybu nezakrývajú.
- **D-287:** pruh je vnútri sekcie, takže pri posúvaní k histórii sa vráti na svoje miesto a históriu neprekrýva; chyba uloženia je v pruhu.
- **D-289:** `historyShift` sa nepočíta pri menej ako dvoch vyhodnoteniach ani pri cieli, ktorý nie je dátum; text je vecný a pod grafom je „Je to minulosť, nie odhad budúcnosti“.

## 4. Súhrn

**V poriadku:** `tsc` a `vitest` (532); D-278, D-279 a D-280 menia len vzhľad, rozloženie a ponuku odkazov bez vplyvu na výpočet; D-281 zachováva obsah D-144; D-284 naozaj zmenšuje hlavný balík a oprava kamery je správna; D-289 je bez projekcie (D-008) a s poctivou mierkou.

**Pred zlúčením do `main` odporúčam opraviť:**
1. S-1: návrat typu a zdroja na predvolené po úprave (a rozhodnúť správanie pri sérii zápisov).
2. S-2: zbalený Doklad nesmie skryť nesúlad súčtu položiek.
3. S-3: správna hláška pri skeneri bez siete.

**Rozhodnutie zakladateľa:** len S-1 (či si formulár pamätá posledný zdroj pri sérii nových zápisov). Ostatné nálezy sú technické alebo znenie.

Zlúčenie do `main` ostáva na zakladateľovi.
