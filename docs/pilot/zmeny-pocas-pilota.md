# Zmeny kódu počas pilota

Podľa `docs/17` (oddiel 8): zmena výpočtu počas pilota zneplatní porovnanie, preto ju má povoliť výnimka zapísaná v `decisions/Decisions.md`. Zmeny UI sú možné, ale zapisujú sa sem.

Pilot začal 2026-10-21. Plán pilota s týmto pravidlom schválil zakladateľ 2026-10-22 (D-153). Záznam zostavil autor kódu 2026-10-25 z `decisions/Decisions.md` (rozhodnutia s dátumom od 2026-10-21). Zaradenie každého rozhodnutia je jeho čítanie textu rozhodnutia, nie overenie v kóde. Ak niečo nesedí, treba to opraviť tu aj v rozhodnutí.

## 1. Zmeny výpočtu

| Dátum | Rozhodnutie | Zmena | Koho sa týka | Výnimka z D-153 |
|---|---|---|---|---|
| 2026-10-21 | D-137 | Zostatok hypotéky sa automaticky znižuje o istinu za uplynulé mesiace; bývanie v rozpočte sú splátky mínus nájom. | Fáza 2: cieľ s nehnuteľnosťou v prenájme; rozpočet | pred schválením D-153 |
| 2026-10-21 | D-139, D-145, D-150 | Mimoriadna splátka hypotéky (znížiť splátku alebo skrátiť termín) a jej vrátenie. | Fáza 2: nehnuteľnosť s hypotékou | pred schválením D-153 |
| 2026-10-21 | D-140 | Zostatok úveru sa automaticky znižuje; splátky úverov sú v Prehľade nevyhnutné výdavky. | Rozpočet a blok Tento mesiac, nie dátum cieľa | pred schválením D-153 |
| 2026-10-22 | D-166 | Cieľ pri nulovom alebo zápornom sporení (r = 0) je nedosiahnuteľný namiesto chybného dátumu. | Okrajový prípad; oprava chyby | v deň schválenia D-153 |
| 2026-10-22 | D-169 | Ročný prehľad: dátum cieľa s nehnuteľnosťami v prenájme; tok K s rovnakou hranicou ako K. | Ročný prehľad, nie hlavný dátum cieľa | v deň schválenia D-153 |
| 2026-10-22 | D-203 (nález 9) | Automatický výnos v automatickom vyhodnotení sa počíta len z hodnoty na začiatku obdobia; vklady v období sú bez výnosu. | Kapitál v automatickom vyhodnotení, a tým dátum cieľa | v deň schválenia D-153 |
| 2026-10-23 | D-254 | Cieľ nad stropom výpočtu sa zobrazí ako „Viac ako 50 rokov“ (T5). | Okrajový prípad | D-292 |
| 2026-10-23 | D-255 | Po splatení hypotéky sa splátka už neodpočítava a čistý nájom ide do sporenia (T1). | Fáza 2: nehnuteľnosť v prenájme s hypotékou | D-292 |
| 2026-10-23 | D-256 | Horizont nad 50 rokov vo výpočte s nehnuteľnosťou (T2). | Fáza 2, okrajový prípad | D-292 |
| 2026-10-23 | D-263 | Inflácia 4,2 % pre prevod hypotéky na reálnu sadzbu. | Fáza 2: cieľ s hypotékou | D-292 |
| 2026-10-24 | D-285 | Oficiálny dátum cieľa, jeho rozsah, upozornenie na dlhý horizont a pokrok sa počítajú z kapitálu pri poslednom vyhodnotení. Predtým sa dátum posúval s každou transakciou po vyhodnotení. | Všetci | D-291 |

**Vplyv na porovnanie:**
- Dátum cieľa zapísaný pred 2026-10-24 mohol obsahovať transakcie po vyhodnotení (D-285). Dátumy treba porovnávať od rovnakého vyhodnotenia.
- Pri účastníkoch s nehnuteľnosťou v prenájme sa dátum cieľa mohol zmeniť aj 2026-10-23 (D-255, D-256, D-263).
- Kapitál v automatickom vyhodnotení sa počíta inak od 2026-10-22 (D-203).
- Predvolený zdroj výdavku sa 2026-10-24 zmenil z „z hotovosti“ na „z príjmu“ (D-288). Výpočet je rovnaký, ale pri rovnakom správaní testera sa inak vyvíja kapitál: výdavky zapísané 2026-10-21 až 2026-10-24 bez zmeny zdroja znížili hotovosť, neskoršie nie. Pri porovnaní skontrolovať zdroj týchto výdavkov (externá revízia 2026-10-25, S-4).

## 2. Ktorú verziu mal kto

- **Verejná verzia** (GitHub Pages z `main`):
  - od 2026-10-21 s Fázou 2 (D-142);
  - od zlúčenia 2026-10-23 bez Fázy 2 (D-248, D-251, commit `8943d4c`).
  - Obsahuje zmeny do 2026-10-23 (posledný commit `d654ef7`). Na vetve je navyše z 2026-10-23 len `daa4596`, vzhľad tlačidla „Rozpis výdavkov“.
  - Od 2026-10-25 (D-304, beh #130, `5f799ed`) obsahuje všetky zmeny jadra do D-304; Fáza 2 ostáva skrytá.
  - Od 2026-10-25 večer (D-312, beh #131, `c5404f2`) obsahuje zmeny jadra do D-311.
  - Od 2026-10-25 neskoro večer (D-316, beh #132, `fcd518f`) obsahuje zmeny jadra do D-315.
  - Od 2026-10-25 v noci (D-319, beh #134, `a91e07c`) obsahuje zmeny jadra do D-318.
  - Od 2026-10-25 v noci (D-321, beh #136, `7e60628`) obsahuje zmeny jadra do D-320.
  - Od 2026-10-26 (D-324, beh #138, `e7ef590`) obsahuje zmeny jadra do D-323.
- **Súkromný náhľad pre testerov** (Cloudflare Pages z vetvy `claude/phase2-property-card`, s Fázou 2): od 2026-10-24 (D-270 až D-273). Obsahuje aj všetky zmeny z 2026-10-24.
- Pri vyhodnotení pilota treba pri každom účastníkovi vedieť, ktorú verziu používal a od kedy.

## 3. Zmeny UI, vstupov a dát

Výpočet cieľa tieto zmeny nemenia. Niektoré však menia, čo a ako používateľ zadáva. To môže ovplyvniť metriky pilota (čas a počet dotykov pri transakcii, počet otázok).

| Dátum | Rozhodnutia | Zmena |
|---|---|---|
| 2026-10-21 | D-131, D-136 | Prehľad: blok Tento mesiac (plnenie plánu, rozpis na nevyhnutné a nie nevyhnutné); nové kategórie dom a energie, voľný čas a dovolenka, dôchodok. |
| 2026-10-21 | D-133, D-134, D-143 | Číslo dokladu z QR sa nezobrazuje; Záloha ukazuje dátum poslednej zálohy a náhľad pred importom; import nevynucuje uloženie aktuálnych dát. |
| 2026-10-21 | D-135 | Zabudnutý PIN: vymazanie dát až po potvrdení. |
| 2026-10-21 | D-139 | Ocenenie investícií staršie ako 3 mesiace sa označí. |
| 2026-10-21 | D-141 | Sklad: dátum spotreby, uvarenie s potvrdením, hlásenia pri receptoch. |
| 2026-10-21 | D-144 | Upozornenie na skúšobnú verziu; sumy vždy s centami; dátumy dd.mm.rrrr. |
| 2026-10-21 | D-146 | Testovacia záloha sa pri nasadení posúva na aktuálny mesiac. |
| 2026-10-21 | D-149, D-151 | Tlačidlo „Nahlásiť pripomienku“; pripomienka ročnej kontroly nastavení. |
| 2026-10-22 | D-152 | Sprievodca prvým nastavením. Prázdne polia v Nastaveniach použijú východiskové hodnoty, takže pri prázdnom poli sa mení vstup výpočtu. |
| 2026-10-22 | D-154, D-155 | Výhľad príjmov (len zobrazenie); týždenný súhrn výdavkov. |
| 2026-10-22 | D-156 až D-159, D-161, D-208, D-220 | Dane (Fáza 2): evidencia prenájmu a psov, tlačivo 17-dp-md a šablóna priznania. Daň sa nepočíta. |
| 2026-10-22 | D-160, D-221 | Prílohy k výdavkom a k výdavkom z prenájmu (nová schéma zálohy). |
| 2026-10-22 | D-162 až D-164 | Moduly: voliteľné sekcie sa dajú skryť. |
| 2026-10-22 | D-165, D-218 | Záporné mesačné sporenie sa odmietne; stará záloha sa načíta bez neho. |
| 2026-10-22 | D-167, D-215 | Prečerpanie investícií sa zobrazí v Prehľade; kapitál sa nemení (D-045). |
| 2026-10-22 | D-168 | iPhone: výzva „Pridaj na plochu“ povinná len v Safari. |
| 2026-10-22 | D-170, D-204 až D-207 | Navigácia: päť skupín, odkazy medzi sekciami, tlačidlá na ďalší krok. |
| 2026-10-22 | D-171 až D-198 | Presun kódu do vrstiev a features. Podľa rozhodnutí sa správanie nemení. |
| 2026-10-22 | D-199 až D-202 | Vzhľad tlačidiel a riadkov histórie; oprava zostavy na Windows. |
| 2026-10-22 | D-203 (okrem nálezu 9) | Obmedzenie pokusov pri PIN-e, kontrola dátumov pravidelných výdavkov, CSP. |
| 2026-10-22 | D-209 až D-214, D-216, D-219 | Predvyplnenie nehnuteľnosti z listu vlastníctva (Fáza 2). |
| 2026-10-22 | D-224, D-227 | Znenie hlásení pri cieli (GC-08, GC-14); pripomienka konca mesiaca. |
| 2026-10-23 | D-132 | Limit veľkosti súboru zálohy 100 MB. |
| 2026-10-23 | D-229 až D-231 | Výpis listu vlastníctva v HTML a výber bytu (Fáza 2). |
| 2026-10-23 | D-232 až D-239 | Sklad: čiarový kód, kamera, dávky, upozornenie na spotrebu (aj na Prehľade). |
| 2026-10-23 | D-240, D-249, D-252, D-253, D-262, D-264 | Texty: rozsahy a východiskové hodnoty sú neoverený predpoklad; vysvetlenie horizontu. |
| 2026-10-23 | D-242 | Drobné nálezy auditu (robustnosť vstupov, sieťová izolácia, testy). |
| 2026-10-23 | D-258, D-259 | Ciele v sekcii Investície (len zobrazenie). |
| 2026-10-23 | D-260 | Potvrdenie pri zmene kapitálu o viac ako 50 % vo vyhodnotení. |
| 2026-10-23 | D-265 | Upozornenie na splátku hypotéky pod nominálnym úrokom (Fáza 2). |
| 2026-10-23 | D-266 až D-268 | Dane z prenájmu: pojem príjmu, výdavky, vzorec riadku 11 tlačiva (Fáza 2). Dátum cieľa nemenia. |
| 2026-10-23 | D-269 | Ročný prehľad: porovnanie výdavkov v kategóriách s predchádzajúcim rokom. |
| 2026-10-24 | D-274, D-275 | Scenáre Veľký výdavok a Mesačný výdavok (nič sa neukladá). |
| 2026-10-24 | D-276, D-277 | Šifrovaná záloha; týždenný súhrn mailom. |
| 2026-10-24 | D-278 až D-280 | Vizuálny štýl, menu na telefóne, pripomienky v náhľade len formulárom. |
| 2026-10-24 | D-281 | Pruh „Skúšobná verzia“ je zbaliteľný. |
| 2026-10-24 | D-282 | Text výnosu uvádza infláciu 4,2 % z výpočtu namiesto 2 % (len text). |
| 2026-10-24 | D-283 | Prehľad: dátum cieľa, pokrok a posun hore; Moduly na telefóne zbalené. |
| 2026-10-24 | D-284 | Skener čiarových kódov sa načíta až v Sklade. |
| 2026-10-24 | D-286, D-287 | Formulár transakcie: suma prvá, doklad zbalený, Prílohy a Zmazať v úprave, Uložiť prilepené dole. Môže zmeniť čas a počet dotykov pri transakcii (metrika v `tyzdenny-zapis.md`). |
| 2026-10-24 | D-288 | Predvolený zdroj nového výdavku je „z príjmu“ (predtým „z hotovosti“). Výdavok zadaný bez zmeny zdroja už neznižuje kapitál. |
| 2026-10-24 | D-289 | Prehľad: zbalený blok Vývoj v čase; skloňovanie „22 mesiacov“ (len text). |
| 2026-10-24 | D-290 | Mesačný výdavok: zoznam opakovaných výdavkov a dátumu cieľa; doplnená testovacia záloha (viac transakcií). |
| 2026-10-25 | D-293 | Usporiadanie obrazoviek: Nastavenia v skupinách (Moduly, Sprievodca a PIN zbalené), Rozpočet ako prehľad s „Upraviť limity“, Pravidelné výdavky s jedným tlačidlom, filter histórie zbalený a 10 záznamov, Ročný prehľad a Dane s menej nulami. Výpočty sa nemenia. |
| 2026-10-26 | D-326 | Prehľad: pripomienka, keď je odhad hodnoty nehnuteľnosti starší ako rok; zmazaný nepoužívaný kód. Bez zmeny výpočtu. |
| 2026-10-26 | D-323 | Texty bez skratky K a kódov požiadaviek; ostatné aktíva jasne mimo kapitálu; úvod sekcie Dane; skryté načítanie súboru integračnej služby. Bez zmeny výpočtu. |
| 2026-10-25 | D-320 | Transakcie: otázka pred zahodením položiek, nepridaná položka sa uloží, Zachovať pôvodnú sumu, zľava sa nepridá do skladu; Záloha: kontrola pred uložením. Bez zmeny výpočtu. |
| 2026-10-25 | D-318 | Transakcie: zrušené vkladanie textu z portálu; Overiť doklad (QR); návrhy položiek z predchádzajúcich nákupov s poslednou cenou. Bez zmeny výpočtu. |
| 2026-10-25 | D-317 | Transakcie: + a − pri množstve položky, jasnejšie pole pre text z portálu, veta o module Sklad pri potvrdení. Bez zmeny výpočtu. |
| 2026-10-25 | D-315 | Drobnosti z revízie: dátum zostatku záväzku pri zostatku, presnejšie súhrny zbalených blokov, blok sa otvorí pri každej chybe, potvrdenie nastavení pri tlačidle. Bez zmeny výpočtu. |
| 2026-10-25 | D-314 | Dane: po zmene psa alebo nehnuteľnosti treba tlačivo vyplniť znova. Záloha: pri odmietnutom zdieľaní tlačidlo Uložiť pripravenú zálohu. Bez zmeny výpočtu. |
| 2026-10-25 | D-313 | Transakcie: dva režimy výdavku (Rýchly výdavok, Nákup po položkách so sumou zo súčtu položiek), zľava ako záporná položka, potvrdenie po uložení. Bez zmeny výpočtu. |
| 2026-10-25 | D-311 | Záväzky a Investície: menej časté polia v zbalených blokoch. |
| 2026-10-25 | D-310 | Majetok: formulár nehnuteľnosti s hlavnými poľami hore a zbalenými blokmi (hypotéka, náklady, kúpa, daň). |
| 2026-10-25 | D-309 | Nastavenia: Moduly, Sprievodca a PIN nad formulárom. |
| 2026-10-25 | D-308 | Návod ako tlačidlo, Uložiť zálohu, väčší dátum cieľa, potvrdenie chýbajúcich surovín, tlačivo bez tlačidla bez údajov, ručné položky dokladu. |
| 2026-10-25 | D-306, D-307 | Tlačivo 17-dp-md: hlásenie chyby s krokom; vyplnenie a uloženie sú dva samostatné kroky (zdieľanie na iPhone). |
| 2026-10-25 | D-305 | Záloha na iPhone sa ukladá cez zdieľací list (typ súboru text), aby sa dalo vrátiť do appky. |
| 2026-10-25 | D-304 | Zlúčenie do main; rozloženie pri širšom písme (tabuľka Vývoj, polia, odsadenie pod menu a nad pruhom Uložiť). |
| 2026-10-25 | D-302 | Sklad: nákupný zoznam (ručne, z receptu, po dôjdení), minimálna zásoba pri položke, poslanie zoznamu ako text; záloha v14. |
| 2026-10-25 | D-301 | Sklad: cena pri položke, prenos položiek dokladu do skladu, Vyhodiť a súhrn vyhodeného; nová verzia zálohy (v13). |
| 2026-10-25 | D-300 | Transakcie: po uložení a zrušení úpravy späť na výdavok z príjmu; zbalený Doklad ukáže nesúlad súčtu; Sklad: správna hláška pri skeneri bez siete; texty o poplatkoch a tykanie v pripomienkach. Môže zmeniť zdroj výdavkov zapísaných po úprave (predtým ostal zdroj z úpravy). |
| 2026-10-25 | D-299 | Transakcie: upozornenie pri výdavku zhodnom s pravidelným výdavkom (Uložiť aj tak / Neukladať); veta v Pravidelných výdavkoch. |
| 2026-10-25 | D-298 | Transakcie: súčet s počtom, filter sa dá zbaliť; Pravidelné výdavky: Ukončiť len bez neuložených zmien; testovacia záloha: Energie v kategórii dom a energie. |
| 2026-10-25 | D-297 | Opravné verzie knižnice úložiska `idb` (8.0.4); akcie GitHubu v5. Bez zmeny správania a výpočtu. |
| 2026-10-25 | D-296 | Opakované výdavky a dátum cieľa (D-290): bez kategórie dôchodok, priemery až pri výdavku v každom z 3 mesiacov, presnejšie poznámky; Rozpočet: Zrušiť zahodí rozpísané limity; Prehľad: text „skontroluj výnos“ namiesto inflácie. Dátum cieľa sa nemení. |
| 2026-10-25 | D-294 | Záloha: časti Uložiť zálohu a Obnoviť zo zálohy s nadpismi; správa o exporte pri tlačidle Exportovať. |

## 4. Rozhodnutia bez zmeny správania appky

Proces, dokumenty, návrhy, testy a nasadenie, ktoré správanie appky nemenia:
- D-138, D-147, D-148, D-153, D-193, D-217, D-222, D-223, D-225, D-226, D-228, D-241, D-243 až D-248, D-250, D-251, D-257, D-261;
- D-270 až D-273: súkromný náhľad a jeho prístup;
- D-291: výnimka pre D-285.
- D-295: prilepený pruh pri klávesnici na iPhone ostáva (bez zmeny kódu);
- D-303: otvorené otázky do backlogu, návod pre testerov.

Pri D-248 a D-251 sa mení nasadenie (verejná verzia bez Fázy 2), pozri oddiel 2.

## 5. Výnimky

- D-291 (2026-10-25): výnimka pre D-285.
- D-292 (2026-10-25): výnimka pre D-254, D-255, D-256 a D-263. Dátumy cieľa účastníkov s nehnuteľnosťou sa porovnávajú až od 2026-10-23.
- Zmeny výpočtu z 2026-10-21 a 2026-10-22 vznikli pred schválením D-153 alebo v deň schválenia, preto výnimku nemajú. Pri vyhodnotení pilota sa porovnáva až od 2026-10-23 (pri D-285 od 2026-10-24).
