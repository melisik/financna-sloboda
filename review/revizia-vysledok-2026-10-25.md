# Výsledok externej revízie 2026-10-25

Reviewer: Claude (samostatná konverzácia, nie autor dokumentov ani kódu). Podklad: `review/revizia-zadanie-2026-10-25.md`. Vetva `claude/phase2-property-card`, HEAD `23f7599` (zmeny po `604a589` vrátane). Nič nebolo opravené; tento súbor je jediná zmena v repozitári.

Revízia podľa `review/revizia-zadanie-2026-10-24.md` predtým neprebehla (v `review/` nie je jej výsledok). Preto je tu aj **časť 2**, v užšom rozsahu (pozri oddiel 5).

## 1. Overenie stavu

| Kontrola | Výsledok reviewera |
| --- | --- |
| `npx tsc --noEmit` | bez chýb |
| `npx vitest run` | 529 testov, 93 súborov, všetky prešli |
| `npx playwright test` | 456 testov (228 × 2 profily), všetky prešli (2026-10-25) |
| Úplnosť `docs/pilot/zmeny-pocas-pilota.md` | všetky rozhodnutia s dátumom od 2026-10-21 (D-131 až D-294) sú v zázname aspoň raz (overené skriptom) |

Poznámka k prostrediu: projekt má inú verziu Playwrightu, než bola predinštalovaná v prostredí reviewera. Prehliadač bol pripojený symbolickým odkazom mimo repozitára; konfigurácia ani testy sa nemenili.

## 2. Nálezy (časť 1: D-290 až D-294)

### Kritické

Žiadne.

### Vysoké

**V-1. E2E test D-290 závisí od dnešného dátumu a začne zlyhávať počas pilota**
- **Súbor a miesto:** `tests/e2e/recurring-impact.spec.ts` (oba testy), `src/domain/recurringImpact.ts` (`averageWindow` z `todayIso()`), `public/testovacia-zaloha.json` (pevné dátumy 2026-07-01 až 2026-10-16).
- **Problém:** E2E test načíta zálohu priamo z `public/` bez posunu dátumov (`scripts/make-test-backup.mjs` beží len pri nasadení) a appka počíta okno priemeru z reálneho dneška. Prepočet reviewera nad funkciami appky:
  - od 2027-01-01 má test „pri kratšej histórii“ (transakcie od 2026-09-01) okno 10/2026 až 12/2026, `hasHistory` vráti `true` a riadky „priemer za 3 mesiace“ sa zobrazia, takže test zlyhá;
  - od 2027-02-01 je okno 11/2026 až 01/2027 bez výdavkov, riadok „jedlo … priemer za 3 mesiace“ chýba a zlyhá aj hlavný test.
- **Dôsledok:** červená E2E sada v januári a februári 2027, teda ešte počas pilota (D-153: do januára 2027). Bez zmeny kódu appky to môže vyzerať ako regresia.
- **Návrh:** v teste pevný čas prehliadača (napr. `page.clock.setFixedTime`) alebo posun zálohy rovnakou funkciou ako pri nasadení. Prípadne skontrolovať aj ostatné E2E testy s testovacou zálohou.
- **Rozhodnutie zakladateľa:** nie, technická oprava testu.

### Stredné

**S-1. Ten istý výdavok môže byť v zozname dvakrát (pravidelný aj priemer kategórie); text „Splátky úverov a hypoték tu nie sú“ nemusí platiť**
- **Súbor a miesto:** `src/domain/recurringImpact.ts` (`recurringImpact`, `categoryAverages`), `src/features/mesacny-vydavok/OpakovaneVydavky.tsx` (poznámka pod zoznamom).
- **Problém:** priemery kategórií berú všetky výdavkové transakcie. Ak používateľ zapisuje nájom, predplatné alebo splátku hypotéky aj ako transakciu (napr. „bývanie“), ukáže sa raz ako pravidelný výdavok a raz v priemere kategórie, každý s vlastným „o N mesiacov skôr“. Appka nikde neuvádza, že pravidelné výdavky sa nemajú zapisovať aj ako transakcie (v `Pravidelne.tsx` taká veta nie je). Splátka hypotéky zapísaná ako výdavok v kategórii „bývanie“ sa do priemeru započíta, hoci text hovorí, že splátky tu nie sú. (Rovnaké dvojité započítanie je už v Rozpočte a v bloku Tento mesiac podľa D-131, nie je nové.)
- **Dôsledok:** nadhodnotenie v najviditeľnejšej skupine (nevyhnutné), mylné tvrdenie v poznámke. Pri financiách je to zavádzajúce voči používateľovi (pravidlá kvality v CLAUDE.md).
- **Návrh:** (a) upraviť text na „Splátky úverov a hypoték zo sekcie Záväzky tu nie sú; ak ich zapisuješ ako výdavky, sú v priemere kategórie“, alebo (b) pri riadku kategórie uviesť „vrátane pravidelných, ak sú zapísané ako transakcie“, alebo (c) rozhodnúť, ako sa majú pravidelné výdavky a transakcie dopĺňať (pravidlo pre celú appku, nie len B1).
- **Rozhodnutie zakladateľa:** áno (výber medzi a, b, c).

**S-2. Kategória „dôchodok“ sa ukazuje ako výdavok, ktorý by sa dal investovať**
- **Súbor a miesto:** `src/domain/recurringImpact.ts` (`categoryAverages`, `NECESSITY`); D-136.
- **Problém:** D-136 zaviedlo kategóriu „dôchodok“, „aby si používateľ uvedomoval sporenie na dôchodok“. B1 ju spracuje ako bežný výdavok: „dôchodok … o N mesiacov skôr“, teda že by sa cieľ priblížil, keby sa suma investovala namiesto sporenia na dôchodok.
- **Dôsledok:** text môže pôsobiť ako implicitné odporúčanie presmerovať dôchodkové sporenie. To je finančné tvrdenie, nie edukácia (pravidlá kvality v CLAUDE.md, D-028).
- **Návrh:** kategóriu „dôchodok“ z B1 vynechať, alebo ju označiť ako sporenie. Doplniť do podkladu pre právne posúdenie spolu s B1 (návrh v `docs/45` oddiel 5).
- **Rozhodnutie zakladateľa:** áno.

**S-3. Kontrola histórie „aspoň 3 celé mesiace“ je slabšia, než hovorí text**
- **Súbor a miesto:** `src/domain/recurringImpact.ts`, `hasHistory`.
- **Problém:** stačí ľubovoľná transakcia (aj sporenie alebo príjem) s dátumom najneskôr v prvý deň okna. Jedna stará transakcia (napr. z importu alebo jednorazový zápis spred roka) a potom zápisy až od posledného mesiaca stačia na „históriu“; súčet za 1 mesiac sa delí tromi.
  - Hranice mesiaca sú inak správne: začiatok okna je prvý deň mesiaca 3 mesiace dozadu, koniec posledný deň predchádzajúceho mesiaca (overené aj pre január a koniec roka; testy pokrývajú 07-01 a 07-02).
  - Kto začne zapisovať 2. dňa mesiaca, čaká na priemery o mesiac dlhšie; to je v súlade s textom.
- **Dôsledok:** podhodnotené priemery a menší „posun“, bez upozornenia; text pritom hovorí „keď budú zapísané výdavky aspoň za 3 celé mesiace“.
- **Návrh:** vyžadovať výdavok v každom z troch mesiacov okna, alebo aspoň rátať len výdavky; prípadne text zmierniť.
- **Rozhodnutie zakladateľa:** áno, ak sa mení pravidlo z D-290; oprava na „len výdavky“ je technická.

**S-4. Záznam zmien počas pilota: D-288 mení kapitál bez úpravy používateľa a nie je vo „Vplyve na porovnanie“**
- **Súbor a miesto:** `docs/pilot/zmeny-pocas-pilota.md`, oddiel 1 („Vplyv na porovnanie“) a oddiel 3 (riadok D-288).
- **Problém:** D-288 je zaradené ako zmena UI. Od 2026-10-21 do 2026-10-24 výdavok zadaný s predvoleným zdrojom znižoval K_cash, od 2026-10-24 nie. Pri rovnakom správaní testera sa teda inak vyvíja kapitál a tým aj dátum cieľa po ďalšom vyhodnotení. Výpočet sa nezmenil, ale zmenil sa vstup výpočtu pri rovnakom správaní. Záznam to v riadku uvádza, no vo „Vplyve na porovnanie“ chýba. Podobne D-152 (prázdne pole = východisková hodnota) a D-165/D-218 (odvodené sporenie pri obnove) menia vstupy.
- **Dôsledok:** pri vyhodnotení pilota sa môže prehliadnuť, že časť zmien kapitálu pred 2026-10-24 je spôsobená predvoleným zdrojom.
- **Návrh:** doplniť D-288 do „Vplyvu na porovnanie“ (napr. „pri výdavkoch zapísaných 2026-10-21 až 2026-10-24 skontrolovať zdroj“). Zvážiť samostatnú kategóriu „zmena predvoleného vstupu“ medzi výpočtom a UI.
- **Rozhodnutie zakladateľa:** nie pre doplnenie textu; áno, ak by sa mala D-288 posudzovať ako zmena výpočtu s výnimkou.

**S-5. Výnimky z D-153 sa zapisujú dodatočne; proces na to nemá kontrolu**
- **Súbor a miesto:** D-291, D-292; `docs/17` oddiel 8; `docs/45` oddiel 6.
- **Problém:** `docs/17` oddiel 8 je oddiel „Riziká“ s jednou vetou. Pravidlo z D-153 nemá postup (kto posudzuje, či je zmena výpočtu, kedy sa výnimka zapisuje). Výsledkom sú dve výnimky zapísané až 1 až 2 dni po zmene (D-285 → D-291, D-254 až D-263 → D-292). Konflikt zachytil autor až pri ďalšom návrhu.
- **Posúdenie výnimiek:**
  - D-291 je oprávnená: starý výpočet odporoval textu pod dátumom (FR-04, D-024), takže porovnanie skresľoval aj on. Záznam stačí, ak sa dátumy porovnávajú od rovnakého vyhodnotenia, ako uvádza D-291.
  - D-292 je oprávnená pre D-254 a D-256 (okrajové prípady nad 50 rokov). Pri D-255 a D-263 je to pre účastníkov s hypotékou skutočná zmena dátumu (GC-P2-01 z 257,25 na 237,63 mesiaca, teda o ~20 mesiacov). Záznam „porovnávať od 2026-10-23“ to rieši, len ak bol pilot pre týchto účastníkov už spustený v súkromnom náhľade (ten je od 2026-10-24, D-270) alebo na verejnej verzii s Fázou 2 (do 2026-10-23). Treba to overiť pri každom účastníkovi (oddiel 2 záznamu to požaduje).
  - Dodatočný zápis je prijateľný ako jednorazová náprava, nie ako postup.
- **Dôsledok:** ďalšia zmena výpočtu môže prejsť bez výnimky; porovnateľnosť pilota závisí od dodatočného čítania rozhodnutí.
- **Návrh:** doplniť do `docs/17` oddiel 8 krátky postup, napr. „každé rozhodnutie, ktoré mení `src/domain/` alebo vstupy výpočtu, uvedie v texte ‚D-153: bez zmeny výpočtu‘ alebo odkaz na výnimku“, a zapísať zmenu do denníka v deň schválenia.
- **Rozhodnutie zakladateľa:** áno (zmena procesu).

**S-6. Rozpočet: „Zrušiť“ v úprave limitov nezahodí rozpísané hodnoty**
- **Súbor a miesto:** `src/features/rozpocet/Rozpocet.tsx`, tlačidlo Zrušiť (`setEditing(false)` bez obnovy `limits`).
- **Problém:** `limits` sa naplní len pri prvom vykreslení. Po Zrušiť a novom „Upraviť limity“ sú v poliach neuložené hodnoty z minulej úpravy; ďalšie Uložiť ich uloží.
- **Dôsledok:** používateľ môže uložiť limity, ktoré si myslel, že zrušil. Nemení výpočet cieľa, ale mení plán v Rozpočte a na Prehľade.
- **Návrh:** pri Zrušiť obnoviť `limits` z `budgets`; doplniť E2E test (Upraviť → zmeniť → Zrušiť → Upraviť → pôvodná hodnota).
- **Rozhodnutie zakladateľa:** nie.

### Nízke

**N-1. Dva kapitálové základy na jednej obrazovke Mesačný výdavok.** Scenár počíta z pracovného kapitálu (D-285), blok B1 z kapitálu pri vyhodnotení (D-290). Autor to uviedol v `docs/45` oddiel 9. Pri veľkom výdavku z investícií po vyhodnotení môže byť rozdiel citeľný; riadky B1 ukazujú len rozdiel v mesiacoch, takže dopad je malý. Návrh: jedna veta v poznámke bloku, z akého kapitálu sa počíta, alebo zjednotiť. Rozhodnutie zakladateľa: áno (ktorý základ).

**N-2. Oznam pri dosiahnutom cieli je nepresný.** `recurringImpact` vráti `no_goal` aj pri `now.months <= 0` (cieľ dosiahnutý); blok potom píše „Zoznam sa ukáže, keď bude dátum cieľa do 50 rokov“ a odkaz na Nastavenia. Rovnako pri `cash_exhausted`. Návrh: samostatný text pre dosiahnutý a nedosiahnuteľný cieľ. Rozhodnutie zakladateľa: nie.

**N-3. Kľúč riadku v B1.** `key={`${i.kind}-${i.name}`}` v `OpakovaneVydavky.tsx`: dva pravidelné výdavky s rovnakým názvom (napr. dve poistky „Poistenie“) dajú rovnaký kľúč. Návrh: použiť `id` pravidelného výdavku. Rozhodnutie zakladateľa: nie.

**N-4. Testovacia záloha: nekonzistentné zaradenie.** Transakcia „Energie“ (2026-10-08) má kategóriu „bývanie“, hoci D-136 zaviedlo „dom a energie“ (a tam je aj pravidelné „Poistenie domácnosti“). Od novembra sa „bývanie“ objaví v B1 vedľa pravidelného „Nájom“. Údaje sú syntetické (supermarket, MHD, kino, koncert, darček; okrúhle alebo vymyslené sumy), skutočné osobné údaje som nenašiel. Rozhodnutie zakladateľa: nie.

**N-5. Tolerantní pomocníci v E2E testoch.** `openBudgetLimits` klikne na „Upraviť limity“ len vtedy, keď je viditeľné, a `openDetails` len pri zatvorenom bloku. Ak by tlačidlo zmizlo (regresia), pomocník ticho pokračuje a zlyhá až neskorší krok s menej zrozumiteľnou chybou. Zakrývanie chyby to nie je, lebo ďalší krok vždy pracuje s poľom za tlačidlom. Návrh: v `openBudgetLimits` overiť, že po kliknutí sú polia viditeľné. Rozhodnutie zakladateľa: nie.

**N-6. Filter v Transakciách pri aktívnom filtri.** `<details open={filterOpen || filterActive}>`: keď je filter zapnutý a používateľ blok zbalí, prehliadač ho zatvorí, ale React atribút znovu nenastaví, takže stav a zobrazenie sa rozídu (napr. po ďalšej zmene ostane zbalený, hoci kód predpokladá rozbalený). Stav „Filter · zapnutý“ v súhrne je viditeľný stále, takže nič sa neskrýva. Rozhodnutie zakladateľa: nie.

**N-7. Text „Súčet transakcií spolu“.** Text je správny (súčet ráta všetky transakcie, nie len 10 zobrazených). „Spolu“ však nehovorí, za aké obdobie ani koľko záznamov. Návrh: „Súčet všetkých 23 transakcií“ alebo „… vo filtri (N transakcií)“. Rozhodnutie zakladateľa: nie (znenie).

**N-8. Dane: názov premennej.** V `Dane.tsx` sa `hasRegime = positions.length > 0` správa ako „aspoň jedna investícia“ (odchýlka zapísaná v `docs/46` oddiel 8 je správna: pri investícii bez režimu sa ukáže karta „Nezadané“ a nič sa neskryje). Názov a komentár „Bez investícií s daňovým režimom“ sú zavádzajúce pre ďalšieho autora. Rozhodnutie zakladateľa: nie.

**N-9. Pravidelné výdavky: Ukončiť a neuložené zmeny.** „Ukončiť od zajtra“ je v úprave pod Uložiť a Zrušiť, oddelené čiarou; nájditeľnosť je primeraná (overuje to úloha 6 v `docs/41`). Ukončiť v úprave zahodí rozpísané zmeny formulára bez upozornenia. Potvrdenie zmazania (D-199) ostalo. Návrh: overiť nájditeľnosť pri testeroch (úloha 6), prípadne upozorniť na neuložené zmeny. Rozhodnutie zakladateľa: nie.

**N-10. `docs/13`, riadok 37:** „Šifrovanie môže počkať (D-108)“ ostalo, hoci tabuľka už uvádza šifrovanie (D-276). Rozhodnutie zakladateľa: nie.

## 3. Osobitné otázky zo zadania

### 3.1 Zakrýva niektorá zmena testu chybu?

Nie. Každú zmenenú očakávanú hodnotu podopiera rozhodnutie:
- 12 → 23 transakcií: D-290, záloha má naozaj 23 transakcií.
- „Plán ešte nie je nastavený“, „z plánu 150 €“, „prekročené o 40 €“ v riadku kategórie, riadok „jedlo: minuté … · limit … · zostáva …“: D-293. Prekročenie je naďalej viditeľné (červené) v prehľade aj pod poľom v úprave.
- Ukončiť a Zmazať cez Upraviť: D-293. Test zmazania stále klikne dvakrát („Zmazať“ a potvrdenie), takže D-199 ostáva overené.
- „Súčet transakcií spolu“: D-293, text zodpovedá kódu.

Výhrady: V-1 (nový test závisí od dátumu) a N-5 (tolerantní pomocníci). Pre S-6 test chýba.

### 3.2 Mení D-293 alebo D-294 výpočet?

Nie. Prešiel som celý diff `bd78c0b..HEAD` v `Nastavenia.tsx`, `Lock.tsx`, `Sekcie.tsx`, `Rozpocet.tsx`, `Pravidelne.tsx`, `Transakcie.tsx`, `RocnyPrehlad.tsx`, `Dane.tsx` a `BackupSection.tsx`:
- výpočty Rozpočtu (`spentInMonthCents`, pravidelné, `housingFlowCents`, `budgetStatus`) sú len presunuté do `rows`;
- súčet v Transakciách ráta celý `list` (vo filtri), stránkovanie mení len `slice` pri vykreslení;
- Nastavenia menia len poradie polí a nadpisy, ukladanie (`save`) je rovnaké;
- Ročný prehľad len mení poradie a skrýva stĺpec minulého roka, ak má samé nuly;
- Záloha mení len to, kde sa zobrazí správa o exporte.

Zbalené bloky neskrývajú chybu ani upozornenie (`docs/46`, zásada 3):
- v Rozpočte sú zbalené len kategórie bez limitu a s nulovým minutým;
- filter sa pri zapnutí rozbalí a súhrn ukáže „zapnutý“;
- PIN ukáže „zapnutý“;
- Vyhodnotenia v Ročnom prehľade nemajú upozornenia.

Záloha (D-294): upozornenie „Aktuálne dáta sa nenávratne prepíšu“ je v náhľade obnovy rovnako viditeľné ako predtým (nezmenené). Správa o exporte sa zobrazí aj pri zrušení, aj pri krátkom hesle (`setExportStatus` vo všetkých troch vetvách); E2E test overuje zatiaľ len jednu z nich.

### 3.3 Je `docs/pilot/zmeny-pocas-pilota.md` úplný?

Formálne áno: každé rozhodnutie D-131 až D-294 (s dátumom od 2026-10-21) je v zázname aspoň raz. Náhodná kontrola zaradenia (D-137, D-139, D-145, D-150, D-152, D-165, D-167, D-169, D-203, D-215, D-218, D-257, D-260, D-264, D-266, D-274, D-282, D-288): zaradenie zodpovedá textu rozhodnutí. Výhrady:
- D-288 patrí aj do „Vplyvu na porovnanie“ (S-4).
- D-290 je zaradené ako UI. Súhlasím: dátum cieľa nemení, je to nový výstup z existujúcej funkcie `goalMonths` (ako D-274, D-275). Pri vyhodnotení pilota však treba vedieť, že od 2026-10-24 testeri v náhľade videli nový finančný údaj, ktorý môže ovplyvniť ich správanie.
- Zaradenie je podľa záznamu „čítanie textu rozhodnutia, nie overenie v kóde“. Overenie v kóde som urobil len pre D-285, D-288, D-290, D-293 a D-294.

## 4. Ostatné body zo zadania (časť 1)

- **D-290, výpočet:** je opakom D-275 (suma sa pripočíta k `mInv`, D-275 ju odpočíta najprv z `mInv`), kapitál je `ctx.evaluated` (D-285), ročný výdavok je `amountCents / 12` cez `monthlyShareCents` (D-124). Ukončené a budúce pravidelné výdavky sa nerátajú. Horizont 600 mesiacov sa zhoduje s `goalDisplay`.
- **D-290, tón:** úvod je vecný („Odhad pred daňou a poplatkami, nie odporúčanie“), skupiny sú v poradí podľa V3 a nevyhnutné sú na konci. Výhrady S-2 (dôchodok) a S-1 (dvojité riadky). Odporúčam doplniť B1 do podkladu pre právne posúdenie, ako navrhuje `docs/45` oddiel 5; v `docs/Podklad_pravne_posudenie.md` som to neoveroval.
- **`eurKeep`:** presun bez zmeny správania (rovnaký výraz).
- **`docs/41`:** úlohy 2, 4, 5 a 6 zodpovedajú appke (Upraviť limity, Ukončiť a Zmazať v úprave, filter „Filter ▾“, 10 záznamov). Číslovanie 1 až 10 je súvislé.
- **`docs/13`:** stĺpec poznámok zodpovedá D-293 a D-294; výnimka je N-10.

## 5. Časť 2: zmeny z `review/revizia-zadanie-2026-10-24.md` (užší rozsah)

Kontrolované: bezpečnosť náhľadu a šifrovanej zálohy, D-285 (pracovný kapitál v oficiálnom cieli), D-288, D-282 a D-283. Kód D-281, D-284, D-286, D-287, D-289 (graf) a D-278 až D-280 som neprechádzal riadok po riadku; spolieham sa na prechádzajúce testy. Odporúčam ich dorevidovať samostatne.

### Stredné

**S-7. Prihlásenie do náhľadu bez limitu pokusov (D-273)**
- **Súbor a miesto:** `preview/_worker.js`, `login`.
- **Problém:** heslo sa dá skúšať bez obmedzenia; jediná ochrana je dĺžka hesla. D-273 to uvádza ako obmedzenie. Inak je implementácia v poriadku: HMAC-SHA256 nad dátumom platnosti, porovnanie bez skratky, cookie HttpOnly, Secure, SameSite=Lax, bez hesla odpoveď 503 (zlyhá zatvorene), zmena hesla zneplatní cookie.
- **Dôsledok:** pri krátkom hesle je prístup k náhľadu otázkou času. Dopad je obmedzený: náhľad obsahuje kód a syntetickú zálohu, nie dáta testerov (tie sú v prehliadači zariadenia).
- **Návrh:** dlhé náhodné heslo (napr. 20+ znakov, zapísané v D-273 ako požiadavka), prípadne Cloudflare Rate Limiting rule na `/prihlasenie`.
- **Rozhodnutie zakladateľa:** áno.

### Nízke

**N-11. Text na Prehľade odkazuje na infláciu v Nastaveniach.** `src/features/prehlad/Prehlad.tsx:136`: „Skontroluj infláciu, rezervu a mieru výberu v sekcii Nastavenia.“ Nastavenia pole pre infláciu nemajú (inflácia je konštanta 4,2 %, D-263, D-282). Súvisí s otázkou D-282 („všetky miesta, kde appka infláciu spomína“). Text výnosu (`returnLine.ts`) je inak správne naviazaný na `RETURN_ASSUMPTIONS.inflation`. Rozhodnutie zakladateľa: nie (znenie), áno, ak sa má inflácia dať nastaviť.

**N-12. D-285: sprievodca predvypĺňa pracovný kapitál.** `src/ui/App.tsx:102` predvyplní „dnešný stav“ v znovu spustenom sprievodcovi z `ctx.capital`, nie z `ctx.evaluated`. Je to v súlade s D-285 („predvyplnenie vyhodnotenia“ ostáva na pracovnom kapitáli), uvádzam to pre úplnosť. Iné miesto, kde by oficiálny dátum cieľa, pokrok alebo posun používal pracovný kapitál, som nenašiel (`context.ts`, `progress.ts`, `scenario.ts`, `annualOverview.ts`, `Prehlad.tsx`). Scenáre Veľký a Mesačný výdavok ostávajú na pracovnom kapitáli a ich dátum „bez výdavku“ sa môže líšiť od Prehľadu (pozri N-1). Rozhodnutie zakladateľa: nie.

**Ďalej overené bez nálezu:**
- šifrovaná záloha (`src/storage/backupCrypto.ts`): PBKDF2-SHA256 600 000 iterácií, náhodná soľ 16 B a IV 12 B pri každom exporte, AES-GCM-256 s AAD viazaným na formát, kontrola dĺžky soli a IV, rozsah iterácií pri importe 100 000 až 2 000 000 (chráni pred podvrhnutým súborom s extrémnym počtom), rovnaká chyba pri zlom hesle aj poškodení;
- D-283: pokrok (`goalProgress`) počíta nehnuteľnosti ako hodnota mínus zostatok hypotéky, rovnako ako `monthsToTargetWithRentals` v mesiaci 0; percentá nadol, 100 % len pri dosiahnutí;
- D-288: v `docs/02`, `docs/04` a `docs/41` je predvolené „z príjmu“; „z hotovosti“ ako predvolené ostáva len pri scenári Veľký výdavok (D-274, `docs/36`), čo je zámer;
- D-289, skloňovanie: pravidlo „22 mesiacov“ (genitív plurálu pri zloženej číslovke písanej dovedna) zodpovedá pravidlu, ktoré poznám zo slovenskej normy. V primárnom zdroji (Pravidlá slovenského pravopisu) som ho z tohto prostredia neoveril.

## 6. Súhrn

**V poriadku:**
- `tsc`, `vitest` (529) a Playwright podľa oddielu 1.
- D-293 a D-294 menia len UI; zbalené bloky neskrývajú chyby ani upozornenia; potvrdenie zmazania (D-199) ostalo.
- Výpočet D-290 zodpovedá D-275, D-285 a D-124; testovacia záloha je syntetická.
- Výnimky D-291 a D-292 sú vecne oprávnené.
- Záznam zmien počas pilota je formálne úplný.

**Pred zlúčením do `main` odporúčam opraviť:**
1. V-1: test D-290 nezávislý od dátumu (inak zlyhá v januári 2027).
2. S-1 a S-2: text o splátkach, dvojité riadky a kategória „dôchodok“ v B1 (rozhodnutie zakladateľa).
3. S-6: Zrušiť v Rozpočte.
4. S-4: doplniť D-288 do „Vplyvu na porovnanie“.

**Rozhodnutie zakladateľa:** S-1, S-2, S-3 (ak sa mení pravidlo), S-5 (postup pre výnimky z D-153), S-7 (heslo náhľadu), N-1.

Zlúčenie do `main` je verejný krok a ostáva na zakladateľovi. Pri ňom treba vyriešiť aj otvorené D-241 (`VITE_PHASE2` v `pages.yml`); D-248 a D-251 ho podľa záznamu riešia, ale overiť sa to oplatí v rámci zlúčenia (mimo rozsahu tejto revízie).
