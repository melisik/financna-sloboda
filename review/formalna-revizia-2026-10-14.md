# Formálna revízia kódu a dokumentov – 2026-10-14

Reviewer: nezávislý (Claude, samostatná konverzácia). Zadanie: `review/formalna-revizia-zadanie.md`.

## Rozsah a zdroje

- **Dokumenty:** `main` (commit `9bf3fca`). Balík `review/review-package-2026-10-14.md` je zhodný s `docs/` a `decisions/` (overené porovnaním sekcií; rozdiel je len v oddeľovači).
- **Kód:** vetva `m1-domain` (commit `b77cd05`). Na `main` nie je `src/` ani `tests/`. Zadanie uvádza `main`, pri zlúčení treba overiť, z ktorej vetvy sa kód berie.
- **Overenie spustením** (kópia kódu + dokumentov, nie pracovný strom):
  - `npm test`: 50/50 jednotkových testov prešlo.
  - `npx tsc -p tsconfig.json`: bez chýb.
  - `npx playwright test`: 6/6 prešlo (3 testy × 2 projekty: desktop, mobile-390).
  - Sondy v dočasnej kópii potvrdili R1, R2, R3, R5 a R13 (spôsob je uvedený pri nálezoch).
- **Nezávislosť:** `CLAUDE.md` vyžaduje revíziu v samostatnej konverzácii. Predchádzajúce kolá dokumentov prebiehali v konverzácii, v ktorej som sa zúčastnil. Odporúčam revíziu zopakovať v novom chate, ak autorské úpravy vznikali tam.

---

## Kritické

**R1 – `src/ui/App.tsx:94–107, 173–177, 519`: nulová miera výberu alebo nulové výdavky zhodia aplikáciu.**
`SettingsSection` ukladá bez validácie. Pri 0 v ročných výdavkoch alebo v miere výberu `targetAmountCents` vyhodí `RangeError` (overené). Výnimka vznikne v `GoalSection` a `HomeSection`. Aplikácia nemá `ErrorBoundary`, takže strom sa odpojí. Nastavenie zostane uložené, a chyba sa zopakuje pri každom načítaní.
*Dôsledok:* aplikácia je nepoužiteľná; obnova vyžaduje vymazanie dát prehliadača.
*Návrh:* validovať pred uložením (rovnako ako `validateSettings`), pridať `ErrorBoundary` s možnosťou importu zálohy.
*Rozhodnutie zakladateľa:* nie.

**R2 – `src/app/ledger.ts:15–45`, `src/ui/App.tsx:228–241`: vklad do rezervy nad hotovosť vytvára peniaze.**
Pre `rezerva` sa nekontroluje, či hotovosť stačí. `currentCapital` potom zarovná `cash` na 0 (`Math.max(0, …)`). Sonda: hotovosť 20 000 €, vklad 30 000 € → kapitál + rezerva = 130 000 € namiesto 120 000 € (+10 000 €). Rovnaký tichý zarovnávací mechanizmus sa uplatní pri úprave alebo importe nekonzistentnej transakcie.
*Návrh:* kontrola v UI pre `rezerva` (ako `payFromCash`); ledger nezarovnávať potichu, ale vrátiť chybu alebo upozornenie.
*Rozhodnutie zakladateľa:* nie.

**R3 – `src/ui/App.tsx:151–155, 271–297`: dátumy transakcií a vyhodnotení sa neoverujú.**
Vstup je textové pole. Kontroluje sa len `date > todayIso()` (reťazcové porovnanie). Prázdny reťazec alebo `2025-99-99` prejde. `validateTransaction` pri importe takéto dáta odmietne (sonda: `"transakcia: dátum musí mať tvar RRRR-MM-DD"`). Export teda môže vytvoriť zálohu, ktorú import neprijme; obnova zlyhá presne v momente, keď je potrebná (FR-17, FR-18).
*Návrh:* použiť `checkDate` pred uložením v UI; pri importe ukázať, ktorý záznam je chybný.
*Rozhodnutie zakladateľa:* nie.

---

## Vysoké

**R4 – `src/app/`, `src/ui/App.tsx:146–155`: mesačné sporenie `m` nie je odvodené z transakcií.**
D-031 a D-040 (a entita Nastavenie v `04` §1) hovoria, že m je súčet sporenia a investícií za 12 mesiacov do D_L, delený počtom mesiacov histórie od prvej transakcie. V kóde nie je `monthlySaving`. m sa zadáva ručne; predvolená hodnota v `DEFAULT_SETTINGS` je 500 €, odporúčanie v `recommendations.ts` je 0 €. GC-16 nie je pokrytý testom.
*Návrh:* implementovať odvodenie podľa D-040 s možnosťou ručného prepísania; doplniť test GC-16.
*Rozhodnutie zakladateľa:* nie (oprava podľa existujúceho rozhodnutia).

**R5 – `src/ui/App.tsx:228–241`: náhľad nezobrazí zmenu pri rezerve.**
Pre `rezerva` a `vyber_rezervy` sa `after` nastaví na `capital`. Ledger však pri vklade znižuje `cash`. Náhľad ukáže „bez zmeny“, po uložení sa kapitál zmení.
*Návrh:* doplniť vetvy pre tieto typy (`cash −= a`, resp. `cash += a`).

**R6 – `src/ui/App.tsx:267–281`: D-047 a kód sa rozchádzajú v hranici hotovosti.**
D-047 hovorí: „Hranica pre výdavok z hotovosti (D-045) je tento stav“, teda stav rezervy (vklady mínus výbery). Kód overuje voči cieľovej rezerve z nastavení (`s.reserveCents`, 6 000 €), nie voči `reserveBalance`, ktorý sa zobrazuje len informačne.
*Dôsledok:* výdavok z hotovosti sa povolí aj vtedy, keď by stav rezervy neumožnil, a naopak.
*Návrh:* zosúladiť kód s D-047, alebo D-047 upraviť.
*Rozhodnutie zakladateľa:* áno, ktorá hranica platí.

**R7 – `src/ui/App.tsx:267–297`, `src/domain/capital.ts:67–75`: upozornenie „kapitál by bol vyčerpaný“ sa nezobrazuje.**
`payFromInvestments` vráti `warning: "exhausted"`, ale `preview` ani `save` ho nečítajú. Ledger zarovná `inv` na 0 bez oznámenia. FR-08 a O-6 požadujú upozornenie a ponuku zmeny na „z príjmu“.
*Návrh:* zobraziť upozornenie a ponuku pred uložením.

**R8 – `docs/00` a `docs/04` vs. D-043 vs. D-049 vs. kód: predvolená miera výberu.**
D-043: „Predvolená miera výberu zostáva 4 %“. D-049: „Predvolená miera výberu je 3,7 %“, bez odkazu, že ruší D-043. Kód používa 3,7 % (`App.tsx:24–31`, `recommendations.ts`). `00` tabuľka obsahuje obe tvrdenia v jednom riadku („3,7 %“ a „Predvolená 4 % ostáva“). `04` §1 má „Predvolene 4 %“; `02` UR-09 a `07` §2 UR-09 majú „pravidlo 4 %“.
*Dôsledok:* hlavné číslo produktu je v dokumentoch rozporné.
*Rozhodnutie zakladateľa:* ktorá hodnota platí; potom zosúladiť dokumenty.

**R9 – D-042 (plocha povinná na iPhone) nie je implementovaný; chýbajú ďalšie požiadavky.**
Kód neobsahuje výzvu ani kontrolu na pridanie na plochu. Chýbajú aj:
- zostávajúci čas od dneška (FR-14, D-024),
- text „Posledné vyhodnotenie je staršie ako dátum cieľa…“ (FR-02, FR-10, GC-14),
- zoznam vyhodnotení (FR-15),
- prepis vyhodnotenia len po potvrdení; aktuálne sa pri rovnakom dátume vytvorí duplicitný záznam (FR-05),
- vypnutie pripomienky v nastaveniach (FR-11).
*Rozhodnutie zakladateľa:* pre plochu (povinná výzva, alebo len odporúčanie) a pre pripomienku.

**R10 – `.github/workflows/pages.yml`, `docs/07` §12: CI nespúšťa E2E a deploy publikuje nezrevidovaný kód.**
CI spúšťa `npm test` a `npm run build`, nie Playwright (07 §12 hovorí o E2E pri zlúčení do main). Workflow beží pri push do `m1-domain` aj `main` a publikuje `dist/` do verejného repozitára. Vetva `m1-domain` sa teda nasadzuje pred revíziou.
*Návrh:* pridať E2E do CI; nasadzovať len z `main` po zlúčení.
*Rozhodnutie zakladateľa:* áno, ktoré vetvy sa majú nasadzovať.

---

## Stredné

**R11 – `src/ui/App.tsx:24–31, 151–155, 201–203`: predvyplnené fiktívne hodnoty.**
Ročné výdavky 24 000 €, mesačné sporenie 500 €; pri prvom vyhodnotení investície 100 000 € a hotovosť 20 000 €. UR-10 hovorí, že výdavky zadáva používateľ sám, a odporúčanie pre sporenie je 0 €.
*Návrh:* prázdne polia, alebo odporúčaná hodnota s jasným označením.

**R12 – `src/ui/App.tsx:271–297`: úprava transakcie kontroluje hotovosť proti stavu, v ktorom už je pôvodná transakcia.**
Príklad: hotovosť pred výdavkom 2 000 €, pôvodný výdavok 1 000 €, rezerva 300 €. Úprava na 1 500 € je zamietnutá (1 000 − 1 500 < 300), hoci 2 000 − 1 500 = 500 ≥ 300.
*Návrh:* pri úprave vylúčiť pôvodný záznam z výpočtu kapitálu.

**R13 – `src/app/reminders.ts:7–9`: falošná pripomienka prvého dňa mesiaca.**
`reviewOverdue` porovnáva mesiac posledného vyhodnotenia s dnešným mesiacom. Vyhodnotenie 31. 10. sa 1. 11. označí ako chýbajúce (sonda: `reviewOverdue("2026-10-31","2026-11-01") = true`). Test v `tests/reminders.test.ts` tento prípad nepokrýva.
*Návrh:* definovať pravidlo (napr. chýba vyhodnotenie za predchádzajúci mesiac) a doplniť test pre 31. 10.

**R14 – `src/ui/App.tsx:17`: `todayIso()` používa UTC.**
`new Date().toISOString()` dá v CEST od 00:00 do 02:00 včerajší dátum. Predvolený dátum transakcie je potom včerajší a dnešný dátum je odmietnutý ako „v budúcnosti“.
*Návrh:* lokálny dátum (`getFullYear/getMonth/getDate`).

**R15 – `src/storage/indexeddb.ts`, `src/ui/App.tsx:155, 297`: chyby úložiska nie sú ošetrené.**
`addTransaction`, `addSnapshot`, `saveSettings` nemajú `try/catch`. Pri `QuotaExceededError` je výnimka neošetrená a používateľ nedostane správu (04 §5, 07 §6).
*Návrh:* try/catch s hláškou a ponukou exportu.

**R16 – `src/storage/validate.ts`, `src/storage/backup.ts`: import nekontroluje jedinečnosť `id`.**
Duplicitné `id` sa pri `put` potichu prepíšu, a náhľad ukáže aj duplicitné počty (sonda: 2 transakcie s rovnakým id → náhľad „2 transakcie“, v databáze 1).
*Návrh:* odmietnuť duplicitné `id`; náhľad počítať len unikátne záznamy.

**R17 – `index.html`: chýba CSP meta tag.**
`05` §7 a `07` §7 požadujú CSP bez `unsafe-inline` pre skripty; v `index.html` nie je žiadny.
*Návrh:* doplniť meta CSP a test.

**R18 – testy vs. `docs/07`: tvrdenia sa nezhodujú s kódom.**
Chýbajú fast-check (property testy, 07 §4), React Testing Library a axe-core (komponentové a dostupnostné testy, 07 §2), súbor `tests/golden/goal-cases.json` (07 §3). Pre FR-07, FR-09, FR-10, FR-11, FR-13, FR-14, FR-15, FR-19 a UR-09 nie je komponentový test. GC-04–07, 09, 10, 12, 13, 14, 16 nie sú automatizované. E2E „6 testov“ sú 3 testy × 2 projekty.
*Návrh:* dopísať testy, alebo upraviť `07`, aby popisovala skutočný stav.

**R19 – `src/ui/App.tsx:349–350`: mazanie bez potvrdenia.**
Mazanie je okamžité; možnosť vrátiť späť trvá 8 sekúnd. FR-09 a UX princíp 4 požadujú potvrdenie pred nevratnou akciou.
*Rozhodnutie zakladateľa:* stačí vrátenie späť, alebo je potrebný dialóg?

**R20 – `src/domain/impact.ts:31`: zaokrúhľovanie v `formatImpact` nie je symetrické.**
`Math.round` dá −2,5 → −2, ale +2,5 → +3.
*Návrh:* zaokrúhľovať absolútnu hodnotu a pridať znamienko.

---

## Nízke

- **R21 –** `src/domain/capital.ts:22–52`: pri `m_cash > 0` sa používa lineárna interpolácia, pri `m_cash = 0` uzavretý tvar; prechod nie je spojitý. GC-21 v `docs/07` uvádza „≈ 1,7 dňa“, výpočet dá ≈ 1,8 dňa.
- **R22 –** predvolené hodnoty sú na dvoch miestach (`App.tsx:24–31` a `recommendations.ts`). Zjednotiť.
- **R23 –** `docs/02` UR-09 a `docs/07` §2 UR-09: „pravidlo 4 %“ (pozri R8); `docs/04` §1 „Predvolene 4 %“. Hlavičky verzií `01`, `02`, `05`, `07` nezodpovedajú obsahu.
- **R24 –** `public/sw.js`: `skipWaiting` bez obnovy klientov; názov cache sa nemení pri vydaniach.
- **R25 –** `src/storage/validate.ts`: `source` nie je viazaný na typ transakcie (napr. `sporenie` so `source` prejde).
- **R26 –** `src/domain/capital.ts:86–97`: `impactMonthsSplit` vráti `null`, ak niektorý scenár nedosiahne cieľ; UI to zobrazí rovnako aj pri dopade blízko nuly, čo nie je konzistentné.

---

## Čo je v poriadku

- Vzorec FR-02 (`src/domain/goal.ts`): poradie vetiev je správne, delenie nulou je ošetrené, `targetDate` orezáva na koniec mesiaca (testy vrátane priestupného roka).
- Sumy sú v centoch (celé čísla); `replaceAll` beží v jednej transakcii (atomicita, FR-18).
- Validácia importu odmieta neznáme polia, zlý dátum, zápornú sumu a vyššiu verziu schémy.
- Žiadne externé požiadavky ani logovanie sumy (kontrola `fetch`, `console`, `localStorage`); E2E test sieťového pôvodu prechádza.
- Testy GC-01/02/03/08/11/13/15/17–22 sa zhodujú s dokumentmi.
- Vrstvy `domain`, `app`, `storage`/`ui` sú oddelené podľa `05` §3.
- Balík `review/review-package-2026-10-14.md` je zosúladený s dokumentmi na `main`.

## Najdôležitejšie pred ďalším krokom

1. **R1, R2, R3** (kritické): pády pri nulových hodnotách, vytváranie peňazí pri rezerve, neimportovateľné zálohy.
2. **R4, R5, R6, R7**: odvodenie `m`, náhľad rezervy, hranica výdavku z hotovosti podľa D-047, upozornenie na vyčerpanie.
3. **R8, R9**: rozporné predvolené hodnoty (3,7 % vs. 4 %) a nezrealizované povinné požiadavky.

## Otázky pre zakladateľa

1. Predvolená miera výberu: 3,7 % (D-049), alebo 4 % (D-043)? (R8)
2. Limit výdavku z hotovosti: stav rezervy (D-047), alebo cieľová rezerva z nastavení? (R6)
3. Plocha na iPhone: povinná výzva, alebo odporúčanie (D-042)? (R9)
4. Zmazanie transakcie: stačí vrátenie späť, alebo chcete potvrdenie? (R19)
5. Prepis vyhodnotenia na ten istý dátum: povoliť len s potvrdením (FR-05), alebo zakázať duplicitu? (R9)
6. Nasadzovať z `m1-domain`, alebo len z `main`? (R10)
7. Predvyplnené hodnoty pri prvom spustení: prázdne, alebo odporúčané? (R11)

Opravy nie sú urobené; autor ich urobí v ďalšom kroku.
