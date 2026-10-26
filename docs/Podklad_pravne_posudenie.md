# Podklad pre právne posúdenie a bezpečnostný audit

Účel: pripraviť posúdenie pred spustením Fázy 2 pre používateľov (D-094, D-090). Dokument popisuje **stav kódu k 2026-10-26** (vetva `main`, commit `f7be2c3`, rozhodnutia do D-325; pôvodná verzia z 2026-10-21, `1746c30`). Všetko, čo tu nie je overené v kóde, je označené ako predpoklad. Dokument nie je právne stanovisko.

Aktualizované 2026-10-26 (D-325): oddiely 1 až 3, 6 a 7 podľa zmien D-301 až D-324; nové riziká 10 až 12. Doplnené 2026-10-24: šifrovaná záloha (D-276) a zbaliteľné upozornenie (D-281) boli najprv na vetve `claude/phase2-property-card`; od 2026-10-25 sú aj v `main` (D-304). Verejná zostava od D-248 Fázu 2 neobsahuje. Opravené riziká 2, 5 a 9 a otázka 5.

## 1. Čo appka robí
- Osobná evidencia príjmov, výdavkov (aj po položkách nákupu so zľavou, D-313), sporenia, majetku, záväzkov, skladu potravín s nákupným zoznamom a záznamom vyhodených potravín (D-301, D-302) a psov pre miestnu daň (D-159).
- Výpočty: odhad kapitálu a dátumu cieľa, výdrž, plnenie rozpočtu, ročný prehľad; „o koľko mesiacov skôr“ pri opakovaných výdavkoch (D-290) a hodnota vyhodených potravín (D-301). Výpočty sú odhady podľa zadaných predpokladov, nie finančné poradenstvo (text v appke).
- Výpočty daní nie sú zavedené (D-104, D-138). Appka eviduje daňový režim investícií, príjmy a výdavky z prenájmu a vyplní tlačivo 17-dp-md (D-161, D-208) do PDF, ktoré používateľ podá sám. Termíny daní sú v zásobníku (N-18); sadzby a termíny nie sú overené zo zdroja. V appke je to povedané v úvode sekcie Dane (D-323).

## 2. Aké údaje appka spracúva (kód: `src/storage/types.ts`)
| Kategória | Údaje | Citlivosť |
|---|---|---|
| Nastavenia | ročné výdavky, miera výberu, výnos, rezerva, prah | Stredná |
| Transakcie | suma, dátum, kategória, poznámka, typ | Vysoká (finančný profil) |
| Doklady | číslo dokladu z QR kódu, položky dokladu (názov, počet, cena, DPH) | Vysoká (číslo dokladu je identifikátor) |
| Vyhodnotenia | mesačné snímky K, hotovosti a investícií | Vysoká |
| Majetok | nehnuteľnosti: odhad, hypotéka, splátky, nájom, dátumy | Vysoká |
| Hypotéka a záväzky | zostatky, úroky, splátky, koniec, mimoriadne splátky | Vysoká |
| Investície a dane | pozície, hodnoty, režim (Fáza 2) | Vysoká |
| Príjmy a pravidelné výdavky | suma, periodicita, zdroj | Stredná až vysoká |
| Rozpočet a sklad | limity, položky skladu s cenou, recepty, nákupný zoznam, vyhodené potraviny | Nízka až stredná |
| Prílohy | fotky alebo PDF dokladov k výdavkom a prenájmu (D-160, D-221) | Vysoká (môžu obsahovať osobné údaje tretích strán) |
| Psy | obec a adresa chovu, plemeno, vek, evidenčné číslo (D-159) | Stredná (adresa je osobný údaj) |
| PIN | len hash PBKDF2-SHA256 so soľou (`src/features/zamok/pin.ts`) | Vysoká (hash) |

Údaje o iných osobách: appka neeviduje mená osôb, ale môže obsahovať údaje o domácnosti (napr. splátky za partnera, výdavky na dieťa). Treba posúdiť.

## 3. Kde sú údaje uložené a kto k nim má prístup
- **Lokálne v prehliadači** (IndexedDB, cez knižnicu `idb`). Žiadny server appky neexistuje.
- **Zálohy:** súbor JSON, voliteľne šifrovaný heslom (D-276, vo verejnej verzii aj v náhľade); bez hesla nešifrovaný. Export ide cez zdieľací list ako textový súbor (D-305, kvôli iPhonu) alebo sťahovanie (počítač); používateľ si sám vyberá, kam súbor uloží. Pred uložením appka overí, že sa záloha dá obnoviť (D-320).
- **Offline:** service worker (`public/sw.js`) ukladá aplikačné súbory do cache. Do cache sa ukladajú len odpovede na GET z vlastného pôvodu (kód, štýly, ikony, `index.html`); údaje používateľa sú v IndexedDB a do cache nejdú (overené v `public/sw.js` 2026-10-26).
- **Sieťová politika:** Content-Security-Policy v `index.html` má `connect-src 'self'`. Appka teda nemá technicky povolené posielať dáta na iné servery.
- **Externé odkazy, ktoré používateľ otvorí sám:**
  - overenie dokladu na portáli `opd.financnasprava.sk` (`src/domain/receipt.ts`). Číslo dokladu sa skopíruje do schránky a používateľ ho vloží na portáli.
  - formulár pripomienok (Google Forms) a GitHub Issues (`src/features/spatna-vazba/feedback.ts`). V súkromnom náhľade je len formulár, lebo GitHub Issues sú verejné (D-280). Do odkazov sa nepridávajú údaje z appky.
- **Analytika, reklamy, sledovanie:** v kóde nenájdené (overiť externe v build výstupe).

## 4. Riziká na posúdenie
1. **Šifrovanie:** údaje v zariadení nie sú šifrované (D-026). Ochrana je len zámok zariadenia a PIN, ktorý nešifruje dáta. Zakladateľ to prijal pri uzavretí brány G3 (D-297); ak právne posúdenie šifrovanie vyžaduje, otvorí sa znova.
2. **Zálohy:** JSON so všetkými údajmi, uložený napr. do Dropboxu či e-mailu. Šifrovanie heslom je voliteľné (D-276, mení odloženie z D-108): PBKDF2-SHA256 so 600 000 iteráciami, AES-GCM-256, heslo aspoň 8 znakov. Zabudnuté heslo sa nedá obnoviť. Záloha bez hesla zostáva nešifrovaná. Od 2026-10-25 aj vo verejnej verzii (zlúčenie D-304).
3. **Zabudnutý PIN:** po potvrdení sa dáta v zariadení vymažú (D-135). Obnova je len zo zálohy.
4. **Čísla dokladov:** identifikátor, ktorý sa dá použiť na overenie dokladu na portáli. Nezobrazuje sa v appke (D-133), ale je v zálohe.
5. **Fáza 2 u testerov:** Fáza 2 bola od 2026-10-21 na verejnej adrese (D-142). Podľa D-217 a D-248 ju verejná zostava z `main` neobsahuje (`pages.yml`: `VITE_PHASE2` „0“, overené v `main` 2026-10-24). Fázu 2 vidia len testeri v súkromnom náhľade za heslom (D-270 až D-273), s upozornením na skúšobnú verziu (D-144, D-281). Podmienky pred spustením pre používateľov (D-094) sú otvorené.
6. **Chýbajú podmienky použitia a zásady ochrany súkromia.** V appke ani v repozitári nie sú (overené 2026-10-21).
7. **Finančné upozornenia:** appka sa označuje ako odhad, nie poradenstvo. Treba posúdiť, či niektorá funkcia nemá charakter finančného poradenstva (napr. odporúčania k sporeniu alebo k hypotéke). Patrí sem aj blok „Opakované výdavky a dátum cieľa“ (D-290, `docs/45`): pri pravidelných výdavkoch a priemeroch kategórií ukáže, o koľko mesiacov skôr by bol cieľ, keby sa suma investovala. Je označený ako odhad, nie odporúčanie; kategória dôchodok v ňom nie je (D-296).
8. **Mimoriadna splátka hypotéky a úvery:** výpočty sú odhady podľa zadaných údajov. Posúdiť zodpovednosť za nesprávny výsledok.
9. **Deti ako používatelia:** appka nemá účty (D-148), preto nevie, kto ju používa, a nemá vekovú hranicu. Sekcia pre dieťa v rodinnom účte je len nápad v zásobníku (N-07, N-08). Posúdiť, či treba vekovú hranicu alebo upozornenie, a čo by sa zmenilo, ak by sa účty zaviedli. (Pôvodné znenie uvádzalo ako cieľovú skupinu ľudí na autistickom spektre s odkazom na CLAUDE.md. To platí pre iný projekt; tento projekt je len o osobnej finančnej slobode.)

10. **Záloha ako textový súbor (D-305):** na Androide zdieľací list ponúkne aj aplikácie na poznámky a správy; nešifrovaná záloha tak môže skončiť ako text v cloudovej službe (revízia 2026-10-25c, S-3). V appke sa odporúča heslo.
11. **Prílohy a adresy:** fotky dokladov a adresa chovu psa sú osobné údaje (aj tretích strán, napr. predajcu alebo nájomcu na zmluve). Sú v zariadení a v zálohe.
12. **Postrehy testerov:** pripomienky idú cez Google formulár zakladateľa (D-280); appka do neho nič nevkladá, ale tester môže priložiť snímku obrazovky so svojimi údajmi.

## 5. Otázky pre právnika
1. Je appka pri lokálnom ukladaní prevádzkovateľom osobných údajov podľa GDPR, alebo len nástrojom používateľa? Ak áno, aké povinnosti vznikajú pri verejnej stránke, aj keď dáta nikam neodchádzajú?
2. Aké dokumenty treba pred spustením: zásady ochrany súkromia, podmienky použitia, poučenie o odhadoch a zodpovednosti, pokyny pre zálohy?
3. Je potrebné posúdiť finančné poradenstvo podľa slovenského práva (napr. zákon o finančných službách)? Kde je hranica pri výpočtoch K a odporúčaniach?
4. Ako posúdiť údaje o iných osobách (partner, dieťa), ktoré používateľ zadá?
5. Šifrovanie zálohy heslom je voliteľné (D-276). Stačí to, alebo má byť povinné, prípadne je nutné šifrovanie údajov v zariadení (D-026)?
6. Monetizácia: appka je zatiaľ zadarmo, bez reklám a bez zberu údajov (D-297). Aké podmienky by platili pri jednorazovom nákupe alebo príspevku? Aké sú podmienky pre účty a synchronizáciu, ak sa neskôr zavedú (N-07, D-148 odkladá)?
7. Aké riziká prináša zverejnenie čísel dokladov a skladu v zálohe pre testerov?
8. Stačí, ak je upozornenie na skúšobnú verziu (bez záruky, nie je finančné poradenstvo, riziko straty údajov) pri prvom otvorení rozbalené a po potvrdení používateľom zbalené na jednu vetu? Alebo musia byť „bez záruky“ a „nie je finančné poradenstvo“ viditeľné stále (D-144, D-281)? Spresnenie (revízia 2026-10-25b, N-4): pruh sa zbalí tlačidlom „Rozumiem, zbaliť“ aj ťuknutím na jeho súhrn; v zbalenom stave na Prehľade nie je iné upozornenie, že appka nie je finančné poradenstvo (scenáre a dopad transakcie ho majú vo vlastnom texte).

## 6. Bezpečnostný audit: rozsah
- Kód: validácia zálohy pri importe (`src/storage/validate.ts`), PIN a jeho obnova (`src/features/zamok/pin.ts`, `src/features/zamok/Lock.tsx`), CSP a závislosti (`npm audit`).
- Testy: 562 jednotkových a 524 E2E testov prechádza (stav 2026-10-25); E2E bežia pred každým verejným nasadením aj pred nasadením náhľadu (D-322). Podrobný rozsah auditu je v `docs/48`.
- Mimo rozsahu tohto dokumentu: hostovanie na GitHub Pages, DNS, nasadzovací proces.

## 7. Stav v repozitári
- Dokumenty: `decisions/Decisions.md` (D-026, D-090, D-094, D-108, D-133, D-135, D-142, D-144, D-148, D-217, D-248, D-270 až D-273, D-276, D-280, D-281, D-290, D-301, D-302, D-305, D-313, D-320, D-323), `docs/08_Backlog_Napady.md`, podklad pre audit `docs/48`.
- Tento dokument sa aktualizuje po každom rozhodnutí, ktoré mení údaje alebo odkazy von.
