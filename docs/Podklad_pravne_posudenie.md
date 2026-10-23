# Podklad pre právne posúdenie a bezpečnostný audit

Účel: pripraviť posúdenie pred spustením Fázy 2 pre používateľov (D-094, D-090). Dokument popisuje **stav kódu k 2026-10-21** (vetva `main`, commit `1746c30`). Všetko, čo tu nie je overené v kóde, je označené ako predpoklad. Dokument nie je právne stanovisko.

## 1. Čo appka robí
- Osobná evidencia príjmov, výdavkov, sporenia, majetku, záväzkov a skladu potravín.
- Výpočty: odhad K (kapitál), výdrž, plnenie rozpočtu, ročný prehľad. Výpočty sú odhady podľa zadaných predpokladov, nie finančné poradenstvo (text v appke).
- Výpočty daní nie sú zavedené (D-104, D-138). Len evidencia režimu a termínov je v návrhu.

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
| Rozpočet a sklad | limity, položky skladu, recepty | Nízka až stredná |
| PIN | len hash PBKDF2-SHA256 so soľou (`src/app/pin.ts`) | Vysoká (hash) |

Údaje o iných osobách: appka neeviduje mená osôb, ale môže obsahovať údaje o domácnosti (napr. splátky za partnera, výdavky na dieťa). Treba posúdiť.

## 3. Kde sú údaje uložené a kto k nim má prístup
- **Lokálne v prehliadači** (IndexedDB, cez knižnicu `idb`). Žiadny server appky neexistuje.
- **Zálohy:** súbor JSON, **nešifrovaný**. Export ide cez zdieľací list (iPhone) alebo sťahovanie (počítač). Používateľ si sám vyberá, kam súbor uloží.
- **Offline:** service worker (`public/sw.js`) ukladá aplikačné súbory do cache. Dáta sa nekopírujú do cache, len kód appky (predpoklad, overiť v `sw.js`).
- **Sieťová politika:** Content-Security-Policy v `index.html` má `connect-src 'self'`. Appka teda nemá technicky povolené posielať dáta na iné servery.
- **Externé odkazy, ktoré používateľ otvorí sám:**
  - overenie dokladu na portáli `opd.financnasprava.sk` (`src/domain/receipt.ts`). Číslo dokladu sa skopíruje do schránky a používateľ ho vloží na portáli.
  - formulár pripomienok (Google Forms) a GitHub Issues (`src/features/spatna-vazba/feedback.ts`). Do odkazov sa nepridávajú údaje z appky.
- **Analytika, reklamy, sledovanie:** v kóde nenájdené (overiť externe v build výstupe).

## 4. Riziká na posúdenie
1. **Šifrovanie:** údaje v zariadení nie sú šifrované (D-026). Ochrana je len zámok zariadenia a PIN, ktorý nešifruje dáta.
2. **Zálohy bez šifrovania:** JSON so všetkými údajmi, uložený napr. do Dropboxu či e-mailu. Šifrovanie zálohy je odložené (D-108).
3. **Zabudnutý PIN:** po potvrdení sa dáta v zariadení vymažú (D-135). Obnova je len zo zálohy.
4. **Čísla dokladov:** identifikátor, ktorý sa dá použiť na overenie dokladu na portáli. Nezobrazuje sa v appke (D-133), ale je v zálohe.
5. **Verejná Fáza 2:** Fáza 2 je od 2026-10-21 na verejnej adrese s upozornením na skúšobnú verziu (D-142, D-144). Podmienky pred spustením pre používateľov (D-094) sú otvorené.
6. **Chýbajú podmienky použitia a zásady ochrany súkromia.** V appke ani v repozitári nie sú (overené 2026-10-21).
7. **Finančné upozornenia:** appka sa označuje ako odhad, nie poradenstvo. Treba posúdiť, či niektorá funkcia nemá charakter finančného poradenstva (napr. odporúčania k sporeniu alebo k hypotéke).
8. **Mimoriadna splátka hypotéky a úvery:** výpočty sú odhady podľa zadaných údajov. Posúdiť zodpovednosť za nesprávny výsledok.
9. **Používatelia mladší ako 18 rokov alebo s kognitívnym znevýhodnením:** appka je cielená aj na ľudí na autistickom spektre a ich blízkych (CLAUDE.md). Posúdiť rozsah ochrany pre dieťa a zákonného zástupcu.

## 5. Otázky pre právnika
1. Je appka pri lokálnom ukladaní prevádzkovateľom osobných údajov podľa GDPR, alebo len nástrojom používateľa? Ak áno, aké povinnosti vznikajú pri verejnej stránke, aj keď dáta nikam neodchádzajú?
2. Aké dokumenty treba pred spustením: zásady ochrany súkromia, podmienky použitia, poučenie o odhadoch a zodpovednosti, pokyny pre zálohy?
3. Je potrebné posúdiť finančné poradenstvo podľa slovenského práva (napr. zákon o finančných službách)? Kde je hranica pri výpočtoch K a odporúčaniach?
4. Ako posúdiť údaje o iných osobách (partner, dieťa), ktoré používateľ zadá?
5. Stačí šifrovanie zálohy heslom, alebo je nutné šifrovanie údajov v zariadení (D-026, D-108)?
6. Aké sú podmienky pre účty a synchronizáciu, ak sa neskôr zavedú (N-07, D-148 odkladá)?
7. Aké riziká prináša zverejnenie čísel dokladov a skladu v zálohe pre testerov?

## 6. Bezpečnostný audit: rozsah
- Kód: validácia zálohy pri importe (`src/storage/validate.ts`), PIN a jeho obnova (`src/app/pin.ts`), CSP a závislosti (`npm audit`).
- Testy: 244 jednotkových a 256 E2E testov prechádza (stav 2026-10-21).
- Mimo rozsahu tohto dokumentu: hostovanie na GitHub Pages, DNS, nasadzovací proces.

## 7. Stav v repozitári
- Dokumenty: `decisions/Decisions.md` (D-026, D-090, D-094, D-108, D-133, D-135, D-142, D-144), `docs/08_Backlog_Napady.md`.
- Tento dokument sa aktualizuje po každom rozhodnutí, ktoré mení údaje alebo odkazy von.
