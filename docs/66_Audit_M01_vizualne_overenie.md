# 66 – Audit M 0.1: Vizuálne overenie existujúceho mobilného rozhrania

> COMPAVEN PHASE M 0.1 – Doplnenie k analýze zdrojového kódu o reálne vizuálne dôkazy.
> Vytvorené: 2026-11-05. Autor: Claude Sonnet 4.6 (diagnostický audit).
> Vetva: `recovery-test`, HEAD: `40d2032`.

---

## 1. Potvrdenie Git stavu

### Pred auditom

```
HEAD: 40d2032 fix(ledger): exhaustive check transaction type
Vetva: recovery-test
Modifikované (staged): (žiadne)
Modifikované (unstaged): decisions/Decisions.md, docs/05_Technical_Architecture.md,
  docs/pilot/zmeny-pocas-pilota.md, src/domain/income.ts, src/domain/model/entities.ts,
  src/domain/monthSummary.ts, src/domain/mortgage.ts, src/domain/property.ts,
  src/domain/recurring.ts, src/features/majetok/Majetok.tsx,
  src/features/prehlad/Prehlad.tsx, src/features/prijmy/Prijmy.tsx,
  src/features/rozpocet/Rozpocet.tsx, src/storage/types.ts, src/storage/validate.ts,
  tests/backup-v2.test.ts, tests/e2e/backup-share.spec.ts, tests/income.test.ts,
  tests/mortgage.test.ts, tests/position-provider.test.ts, tests/shopping.test.ts,
  tests/stock-waste.test.ts, tests/storage.test.ts
Nové (untracked): src/domain/householdBalance.ts, tests/e2e/household-balance.spec.ts,
  tests/e2e/mortgage-last-payment.spec.ts, tests/household-balance.test.ts,
  tests/mortgage-last-payment.test.ts
```

### Po audite

Rovnaký stav. Žiadny existujúci zdrojový súbor zmenený.
Nové súbory vytvorené auditom:
- `tests/e2e/audit-m01-screenshots.spec.ts` (dočasný diagnostický spec, untracked)
- `test-results/audit-m01/*.png` (27 screenshotov)
- `docs/66_Audit_M01_vizualne_overenie.md` (tento súbor)

---

## 2. Zoznam vytvorených screenshotov

Súbory v `test-results/audit-m01/`:

### 390 × 844 px (všetkých 16 sekcií)

| Súbor | Sekcia | Veľkosť |
|---|---|---|
| `390_prehlad.png` | Prehľad | 41 kB |
| `390_nova-transakcia.png` | Transakcie | 37 kB |
| `390_scenar-vydavku.png` | Veľký výdavok (scenár) | 38 kB |
| `390_mesacny-vydavok.png` | Mesačný výdavok (scenár) | 42 kB |
| `390_prijmy.png` | Príjmy | 42 kB |
| `390_rozpocet.png` | Rozpočet | 41 kB |
| `390_vyhodnotenie.png` | Vyhodnotenie | 40 kB |
| `390_majetok.png` | Majetok | 39 kB |
| `390_zavazky.png` | Záväzky | 38 kB |
| `390_investicie.png` | Investície | 42 kB |
| `390_pravidelne-vydavky.png` | Pravidelné výdavky | 43 kB |
| `390_dane.png` | Dane | 43 kB |
| `390_sklad.png` | Sklad | 38 kB |
| `390_rocny-prehlad.png` | Ročný prehľad | 36 kB |
| `390_nastavenia.png` | Nastavenia | 34 kB |
| `390_zaloha.png` | Záloha | 37 kB |

### 320 × 700 px (4 kritické sekcie)

| Súbor | Sekcia | Veľkosť |
|---|---|---|
| `320_prehlad.png` | Prehľad | 29 kB |
| `320_nova-transakcia.png` | Transakcie | 31 kB |
| `320_majetok.png` | Majetok | 31 kB |
| `320_rocny-prehlad.png` | Ročný prehľad | 30 kB |

### Formulárový tok

| Súbor | Popis |
|---|---|
| `form_1_empty.png` | Prázdny formulár transakcií |
| `form_2_amount_tapped.png` | Po tapnutí na Suma |
| `form_3_amount_85.png` | Suma = 85, predbežný dopad viditeľný |
| `form_4_note_tapped.png` | Po tapnutí na Poznámka |
| `form_5_note_filled.png` | Poznámka vyplnená |
| `form_6_complete_form.png` | Vyplnený celý formulár (scrollnutý dolu) |
| `form_7_decimal.png` | Test desatinných oddeľovačov |

---

## 3. Vizuálne hodnotenie všetkých 16 sekcií (390 × 844)

> Legenda: **A** = vizuálne potvrdený problém, **B** = funkčne potvrdený, **C** = kód analýza, **D** = vyžaduje fyzické zariadenie

### 3.1 Prehľad (prehlad)

**Zmesti sa do šírky:** ✓ Áno  
**Zalamovanie textu:** ✓ Správne, dlhé vety sa lámu na viacero riadkov  
**Ovládacie prvky:** ✓ Tlačidlo „Podrobnosti ▼" a „Rozumiem, zbaliť" majú dostatočnú výšku  
**Čitateľnosť:** ✓ Všetok text je čitateľný  
**Navigácia:** 2-riadkový panel: riadok 1 (skupiny) + riadok 2 (subsekcie). OK.

**Nález A-01:** Skúšobná verzia banner (žltý panel) má výšku ≈130 px, čo tvorí ~15 % zobraziteľnej plochy 844 px. Po zbalení tlačidlom „Rozumiem, zbaliť" sa obsah posunie nahor. Banner nie je trvalý problém, ale pri prvom zobrazení skrýva časť obsahu.

---

### 3.2 Transakcie (nova-transakcia)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓ Tlačidlá „Rýchly výdavok" a „Nákup po položkách" sú dvojriadkové, čo je správne správanie  
**Ovládacie prvky:** ✓ Tlačidlá majú dostatočnú dotykovú plochu  
**Čitateľnosť:** ✓  
**Viditeľnosť Uložiť (prázdny formulár):** Tlačidlo „Uložiť transakciu" je na y=792, bottom=836, viewport=844 px → viditeľné, ale len 8 px nad spodným okrajom

**Nález A-02 (Kritický):** Tlačidlo „Uložiť transakciu" je pri prázdnom formulári iba 8 px nad dolným okrajom displeja. Keď je otvorená virtuálna klávesnica (iOS Safari posuny viewport), toto tlačidlo bude s najväčšou pravdepodobnosťou skryté.

**Nález A-03:** V prázdnom formulári nie sú viditeľné polia Typ, Zdroj a Kategória — sú pod okrajom obrazovky. Používateľ musí skrolovať, aby videl celý formulár.

---

### 3.3 Veľký výdavok – scenár (scenar-vydavku)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓ Select „z hotovosti" je plno-šírkový  
**Čitateľnosť:** ✓  
**Nález:** Formulár je jednoduchý, žiadne kritické problémy. Selector dropdown je štýlovaný HTML `<select>`, na iOS zobrazí natívny picker, čo je akceptabilné.

---

### 3.4 Mesačný výdavok – scenár (mesacny-vydavok)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓  
**Čitateľnosť:** ✓ Disclaimer text „Odhad je pred daňou..." je malý, ale čitateľný  
**Navigácia (subsekcie):** Text „Mesačný výdavok (scenár)" sa skráti na „Mesačný výdavok (sce..." keď nie je aktívny — text sa oreže a nie je scrollovateľný.

**Nález A-04:** Subsekcia „Mesačný výdavok (scenár)" v navigačnom riadku 2 je oriezaná na „Mesačny..." keď sú viditeľné aj iné subsekcie v skupine.

---

### 3.5 Príjmy (prijmy)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ⚠️ Natívny `<input type="file">` s označením „Choose File" — systémový štýl, nie mobilne prispôsobený  
**Čitateľnosť:** ✓

**Nález A-05 (Stredný):** Vstup súboru integračnej služby je zobrazený ako natívny `<input type="file">` s anglickým textom „Choose File" a „No file chosen". Toto je systémový prvok, ktorý nie je štylizovaný podľa aplikácie.

---

### 3.6 Rozpočet (rozpocet)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓ Tlačidlo „Upraviť limity" je primárne  
**Čitateľnosť:** ✓ Kategórie s výdavkami sú čitateľné  
**Nález:** Žiadne kritické problémy pri 390 px.

---

### 3.7 Vyhodnotenie (vyhodnotenie)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓  
**Čitateľnosť:** ✓ Dátumový vstup zobrazuje formát `10/25/2026` (americký formát)

**Nález C-01 (Stredný, kód analýza):** Dátumový `input[type=date]` zobrazuje formát dátumu podľa nastavenia prehliadača/OS. Na slovenskom zariadení bude iný formát ako `10/25/2026`. Treba overiť na fyzickom zariadení.

---

### 3.8 Majetok (majetok)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓ Tlačidlá „Pridať nehnuteľnosť"  
**Čitateľnosť:** ✓ Vysvetľujúci text je muted, ale čitateľný  
**Navigácia:** Subsekcia „Dane" je pri 390 px čiastočne oriezaná — viditeľné len „D" na konci navigačného riadku 2

**Nález A-06 (Stredný):** Posledná podsekcia skupiny „Majetok a zásoby" (Dane) je pri 390 px oriezaná na jedno písmeno „D" v navigačnom riadku 2. Používateľ nemusí vedieť, čo toto tlačidlo robí.

---

### 3.9 Záväzky (zavazky)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓ Tlačidlá „Pridať záväzok" a „Nahlásiť pripomienku"  
**Čitateľnosť:** ✓  
**Nález:** Žiadne kritické problémy. Stav je prázdny (syntetické dáta nemajú záväzky).

---

### 3.10 Investície (investicie)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓ Dlhý text o investíciách sa správne zalamuje  
**Ovládacie prvky:** ✓  
**Čitateľnosť:** ✓  
**Nález:** Žiadne kritické problémy. Stav je prázdny (syntetické dáta nemajú investičné položky).

---

### 3.11 Pravidelné výdavky (pravidelne-vydavky)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓ Zoznam pravidelných výdavkov s „Upraviť" tlačidlami  
**Čitateľnosť:** ✓  
**Nález:** Syntetické dáta zobrazoujú spolu 697 €/mesiac. Zoznam je čitateľný. Žiadne problémy.

---

### 3.12 Dane (dane)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓ Dlhý text sekcie sa správne zalamuje  
**Ovládacie prvky:** ✓  
**Čitateľnosť:** ✓ Warning text (muted červený) o neoverených sadzbách je viditeľný  
**Nález:** Žiadne kritické problémy. Navigačný label „Dane" je oriezaný z iných sekcií skupiny (nález A-06).

---

### 3.13 Sklad (sklad)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓ Tlačidlo „Pridať položku skladu" je primárne  
**Čitateľnosť:** ✓  
**Nález:** Syntetické dáta nemajú položky skladu. Žiadne kritické problémy.

---

### 3.14 Ročný prehľad (rocny-prehlad)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓  
**Čitateľnosť:** ✓ Čísla „Kapitál na konci roka: 304 000,00 €" sú čitateľné  
**Nález:** Žiadne kritické problémy pri 390 px.

---

### 3.15 Nastavenia (nastavenia)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓ Tlačidlá „Moduly ▼", „Sprievodca ▼", „PIN ▼" sú dostupné  
**Čitateľnosť:** ✓  
**Nález:** Formulárové polia (Ročné výdavky, atď.) sú na prvej obrazovke plno-šírkové. Žiadne problémy.

---

### 3.16 Záloha (zaloha)

**Zmesti sa do šírky:** ✓  
**Zalamovanie:** ✓  
**Ovládacie prvky:** ✓  
**Čitateľnosť:** ✓  
**Nález:** Upozornenie „Záloha je staršia ako 7 dní..." je viditeľné a čitateľné. Žiadne kritické problémy.

---

## 4. Kritické obrazovky pri 320 × 700

### 4.1 Prehľad (320×700)

**Horizontálne pretekanie:** ✗ Žiadne  
**Navigácia:** Skupiny sa zobrazujú v 3 riadkoch namiesto 2: `Prehľad | Peniaze` / `Majetok a zásoby | Plán a výsledky` / `Nastavenia a záloha`. Subsekčný riadok pridáva 4. riadok.

**Nález A-07 (Stredný):** Pri 320 px navigácia zaberá 4 riadky (3× skupiny + 1× subsekcie) — odhadom ≈130–160 px z 700 px zobraziteľnej výšky (18–23 %). Obsah sa zobrazí až od ~160 px zhora. Tlačidlo „Rozumiem, zbaliť" ešte pridáva ~100 px.

**Nález A-08 (Kritický):** Pri 320 px je zobraziteľná plocha pre obsah dramaticky obmedzená: navigácia (4 riadky) + banner (ak nezbalený) zanechajú menej ako 400 px pre obsah. Používateľ musí skrolovať skôr, ako uvidí akúkoľvek informáciu.

---

### 4.2 Transakcie (320×700)

**Horizontálne pretekanie:** ✗ Žiadne — overené vizuálne  
**Navigácia:** 4 riadky (skupiny 3×, subsekcie 1×). Subsekcie v skupine Peniaze sa zobrazujú ako: `Transakcie | Veľký výdavok (scenár)` a ďalšie oriezané.  
**Formulár:** Viditeľná len hora formulára — pole Suma a tlačidlo Uložiť.

**Nález A-09 (Kritický):** Pri 320 px je po navigácii a bannerovi viditeľná len horná časť formulára. Tlačidlo „Uložiť transakciu" je pri prázdnom formulári tesne na okraji — pri otvorení virtuálnej klávesnice bude skryté.

---

### 4.3 Majetok (320×700)

**Horizontálne pretekanie:** Čiastočné — subsekčný riadok (`Majetok | Sklad | Záväzky | Inves[tície]`) je oriezaný, posledná položka nie je úplne viditeľná.

**Nález A-10 (Stredný):** Subsekčný riadok skupiny „Majetok a zásoby" pri 320 px oreže poslednú podsekciu. Text „Investície" (resp. „Dane") nie je celý viditeľný. Používateľ vidí iba začiatok názvu.

---

### 4.4 Ročný prehľad (320×700)

**Horizontálne pretekanie:** ✗ Žiadne  
**Obsah:** Subsekčný riadok `Vyhodnotenie | Ročný prehľad` sa zmestí úplne.  
**Čísla:** Čísla zo zálohy sa zobrazujú korektne.

**Nález:** Žiadne kritické problémy v obsahu. Navigačný problém A-07 platí aj tu.

---

## 5. Virtuálna klávesnica – výsledky (simulované v Playwright)

> **Upozornenie:** Všetky výsledky sú zo simulácie v Playwright Chromium s `isMobile: true`. Správanie fyzickej iOS Safari virtuálnej klávesnice (posúvanie viewport, scroll do view, ukrytie elementov) **NIE JE** touto simuláciou overiteľné. Výsledky sú označené ako simulované.

### 5.1 Viditeľnosť tlačidla Uložiť (simulované)

```
SAVE_VISIBLE=true  y=792  bottom=836  vp_h=844
```

**Zistenie (B – funkčne potvrdené v simulácii):** Tlačidlo „Uložiť transakciu" je viditeľné v Playwright simulácii. Avšak nachádza sa len 8 px od dolného okraja viewportu (y=792, bottom=836, viewport=844). Keď iOS Safari zobrazí virtuálnu klávesnicu, zmenší dostupnú výšku o ~300 px (iPhone 14: 844 → ~540 px). Tlačidlo sa pri otvorení klávesnice pravdepodobne skryje.

### 5.2 Zadávanie sumy (simulované)

**Bodka ako desatinný oddeľovač:** ✓ Funguje — `input='12.50'` → `value='12.50'`

**Čiarka ako desatinný oddeľovač:** ✗ Kriticky nefunguje

Playwright sám nedokáže zadať čiarku do `input[type=number]` (error: *Cannot type text into input[type=number]*). Keď bola čiarka vynútená cez JavaScript DOM manipulation, `input[type=number]` vrátil prázdny reťazec:

```
DECIMAL_COMMA: forced='12,50' => element.value=''
```

**Nález B-01 (Kritický):** Pole Suma (€) používa `input[type=number]` bez `inputMode="decimal"`. Na slovenských mobilných klávesniciach je predvoleným desatinným oddeľovačom čiarka. Ak používateľ zadá čiarku, pole sa stane prázdnym — suma sa nezapíše, formulár zlyhá bez jasnej chybovej hlášky.

### 5.3 Viditeľnosť predbežného dopadu (simulované)

**Zistenie (simulované):** Predbežný dopad „bez zmeny" / „Kapitál bude X €" sa zobrazuje pod poľom Suma priamo na stránke bez scrollovania pri 390 px. Pri vyplnenom formulári (form_6) je viditeľný po scrollnutí.

### 5.4 Pohodlné dokončenie formulára (simulované)

**Zistenie (simulované):** Formulár Transakcie vyžaduje scrollovanie, aby bolo vidno Typ, Zdroj, Kategória, Dátum a Poznámka. Tlačidlo Uložiť je na konci, čo je štandardné, ale na malých obrazovkách s otvorenou klávesnicou toto bude problematické (nález B-01, A-02).

---

## 6. Kontrola číselných vstupov

### 6.1 Prehľad použitia `input[type=number]` a `inputMode`

| Súbor | Pole | type | inputMode | Problém |
|---|---|---|---|---|
| `Transakcie.tsx:374` | Suma (€) | number | _žiadny_ | **B-01** |
| `controls.tsx:27` | Všetky `Field` bez inputMode | number | _žiadny_ | C-02 |
| `controls.tsx:21` | `Field` s inputMode | number | "numeric" alebo "text" | C-03 |
| `Sprievodca.tsx:189–190` | PIN (nový, zopakuj) | password | "numeric" | ✓ OK |
| `Lock.tsx:79,153,159–160` | PIN polia | password | "numeric" | ✓ OK |
| `Recepty.tsx:182` | Množstvo suroviny | number | "decimal" | ✓ OK |

### 6.2 Problémy

**Nález B-01 (Kritický):** Pole `Suma (€)` v `Transakcie.tsx:374` nemá `inputMode`. Na iOS Safari zobrazí `type="number"` numerickú klávesnicu bez desatinnej čiarky alebo bodky. Ak používateľ potrebuje zadať desatinnú hodnotu, musí nájsť spôsob ako prepnúť klávesnicu.

**Nález C-02 (Stredný, kód analýza):** Väčšina finančných polí (`Field` bez inputMode) používa `type="number"` bez `inputMode="decimal"`. Na iOS bude zobrazená numerická klávesnica bez desatinného oddeľovača. Treba pridať `inputMode="decimal"` pre všetky finančné sumy.

**Nález C-03 (Nízky, kód analýza):** Typ `inputMode` v `Field` komponente (`controls.tsx:21`) akceptuje len `"numeric" | "text"`, nie `"decimal"`. Chýba `"decimal"` varianta, ktorú potrebujú finančné polia.

### 6.3 Ako spracúva aplikácia desatinnú čiarku

- HTML `input[type=number]` akceptuje len bodku `.` ako desatinný oddeľovač v DOM
- Ak používateľ na SK klávesnici zadá čiarku, vstup je buď ignorovaný alebo vráti `NaN`
- Aplikácia prevádza hodnotu cez `Number(e.target.value)` → `NaN` pre čiarku → pole sa stane prázdnym
- Nie je implementovaný žiadny prekladač čiarky → bodka

---

## 7. Zoznam problémov zoradených podľa závažnosti

| ID | Typ | Závažnosť | Popis |
|---|---|---|---|
| B-01 | B | **Kritická** | `Suma (€)` bez `inputMode="decimal"` — čiarka spôsobí prázdne pole |
| A-02 | A | **Kritická** | Tlačidlo „Uložiť transakciu" je 8 px od dolného okraja — skryje sa pri klávesnici |
| A-08 | A | **Vysoká** | Pri 320 px: obsah sa zobrazí až pod 4-riadkovou navigáciou + bannerom |
| A-09 | A | **Vysoká** | Pri 320 px: Transakcie — viditeľná len horná časť formulára, Uložiť mimo obrazovky |
| A-01 | A | **Stredná** | Skúšobná verzia banner zaberá ~15 % viewportu pred zbalením |
| A-06 | A | **Stredná** | Subsekcia „Dane" oriezaná na „D" v navigačnom riadku pri 390 px |
| A-07 | A | **Stredná** | Pri 320 px: navigácia zaberá 18–23 % viewportu |
| A-10 | A | **Stredná** | Pri 320 px: subsekcie skupiny Majetok sú horizontálne oriezané |
| A-03 | A | **Stredná** | Polia Typ/Zdroj/Kategória nie sú viditeľné bez scrollovania (pri 390 px) |
| C-02 | C | **Stredná** | Všetky finančné `Field` bez `inputMode="decimal"` |
| A-04 | A | **Nízka** | „Mesačný výdavok (scenár)" orezie text v subsekčnom riadku |
| A-05 | A | **Nízka** | Natívny `<input type="file">` s anglickým textom v Príjmoch |
| C-01 | C | **Nízka** | Dátumový vstup zobrazuje formát podľa prehliadača (treba overiť na iOS) |
| C-03 | C | **Nízka** | `Field.inputMode` nepodporuje "decimal" variant |

---

## 8. Čo treba overiť na fyzickom telefóne

Tieto body **nie je možné overiť** v Playwright simulácii Chromium:

| # | Čo overiť | Prečo nemožno simulovať |
|---|---|---|
| P-01 | Správanie iOS Safari pri otvorení virtuálnej klávesnice | Chromium simulácia neposúva viewport |
| P-02 | Viditeľnosť „Uložiť transakciu" pri otvorenej klávesnici | Závisí od reálneho viewport resize iOS Safari |
| P-03 | Zadanie čiarky na SK klávesnici do `Suma (€)` | Reálna iOS klávesnica vs. Playwright fill() |
| P-04 | Scroll pri vyplnení formulára s otvorenou klávesnicou | iOS Safe Area a notch |
| P-05 | Dátumový formát v `input[type=date]` na SK iOS | Locale-dependent render |
| P-06 | Výkon animácií a prechodov na fyzickom zariadení | Simulácia nereprezentuje GPU výkon |
| P-07 | Správanie „Pridať na plochu" (PWA, A2HS) | Vyžaduje fyzické Safari |
| P-08 | Scroll-to-focused-element v Safari pri focuse `input` | WebKit-specific behavior |
| P-09 | Viditeľnosť predbežného dopadu pri otvorenej klávesnici | iOS keyboard window resize |
| P-10 | Dark mode — farby a kontrasty | Playwright nemá dark mode emulácii s viewport |

---

## 9. Opravené počítanie sekcií

Dokument `docs/13_Zoznam_obrazoviek.md`, sekcia 5 (Nálezy kroku 1, 2026-10-20) uvádza: *„Všetkých 11 sekcií sa zobrazí"*. Tento údaj bol správny v čase písania (pred Fázou 2 s VITE_PHASE2).

**Aktuálny počet sekcií (recovery-test, VITE_PHASE2=1): 16**

| # | ID sekcie | Skupina |
|---|---|---|
| 1 | prehlad | Prehľad |
| 2 | nova-transakcia | Peniaze |
| 3 | scenar-vydavku | Peniaze |
| 4 | mesacny-vydavok | Peniaze |
| 5 | prijmy | Peniaze |
| 6 | rozpocet | Peniaze |
| 7 | pravidelne-vydavky | Peniaze |
| 8 | majetok | Majetok a zásoby |
| 9 | sklad | Majetok a zásoby |
| 10 | zavazky | Majetok a zásoby |
| 11 | investicie | Majetok a zásoby |
| 12 | dane | Majetok a zásoby |
| 13 | vyhodnotenie | Plán a výsledky |
| 14 | rocny-prehlad | Plán a výsledky |
| 15 | nastavenia | Nastavenia a záloha |
| 16 | zaloha | Nastavenia a záloha |

Bez VITE_PHASE2: pravdepodobne menej (neoverované v tomto audite).

---

## 10. Odporúčané poradie ďalších implementačných etáp

Zoradené podľa dopadu na mobilný UX:

### Etapa M1 – Kritické opravy vstupov (jednoduchá implementácia, vysoký dopad)

1. **Pridať `inputMode="decimal"` na všetky finančné polia** (`Field` komponent, všetky `Suma (€)` bez inputMode) — odstraňuje B-01 a C-02
2. **Rozšíriť typ `inputMode` v `Field` o `"decimal"`** (`controls.tsx:21`) — odstraňuje C-03
3. **Skrolovanie pri klávesnici: `scrollIntoView` alebo sticky Save tlačidlo** — odstraňuje A-02

### Etapa M2 – Navigácia na malých obrazovkách (vyžaduje dizajnové rozhodnutie)

4. **Navigácia pri 320 px**: Skryť subsekčný riadok alebo ho urobiť scrollovateľným, nie oriezaným — odstraňuje A-04, A-06, A-10
5. **Kompaktnejšia navigácia** pre zariadenia <375 px: možnosť hamburgera alebo skrytia skupinových labels

### Etapa M3 – Formulár transakcií (overenie na fyzickom zariadení pred implementáciou)

6. **Overiť na fyzickom iPhone** body P-01 až P-09 (sekcia 8)
7. **Sticky tlačidlo Uložiť** alebo presun na vrchol formulára (ak to overenie potvrdí ako problém)
8. **Prekladač čiarky → bodka** v onChange handleri finančných polí

### Etapa M4 – Drobné vylepšenia

9. Štylizovať `<input type="file">` v Príjmoch — odstraňuje A-05
10. Zbaliť Skúšobná verzia banner automaticky po prvom zobrazení — odstraňuje A-01 (čiastočne)
11. Skrátiť dlhé názvy sekcií v navigácii (scenáre) — odstraňuje A-04

---

## 11. Čo bolo skutočne overené a čo zostáva otvorené

### Overené v tomto audite (Playwright Chromium, mobile emulation)

- ✅ Všetkých 16 sekcií sa zobrazí a navigácia medzi nimi funguje (390 × 844)
- ✅ Žiadne horizontálne pretekanie pri 390 × 844
- ✅ Čiastočné horizontálne pretekanie (oriezanie) subsekčného navigačného riadku pri 320 × 700
- ✅ Tlačidlo „Uložiť transakciu" je pri prázdnom formulári v Playwright viditeľné (y=792/844)
- ✅ Bodka funguje ako desatinný oddeľovač v `input[type=number]`
- ✅ Čiarka ako desatinný oddeľovač spôsobí prázdne pole (funkčne potvrdené)
- ✅ Všetky screenshoty vytvorené s testovacou zálohou (syntetické dáta)
- ✅ Git stav pred a po audite: žiadne existujúce zdrojové súbory nezmenené

### Zostáva otvorené (vyžaduje fyzické zariadenie)

- ❌ Správanie iOS Safari virtuálnej klávesnice (body P-01 až P-10)
- ❌ Reálne správanie pri zadávaní čiarky na SK iOS klávesnici
- ❌ Dátumový formát v `input[type=date]` na SK iOS
- ❌ PWA/A2HS správanie na iOS 26
- ❌ Výkon na fyzickom zariadení

---

*Audit M 0.1 dokončený. Čakám na rozhodnutie o ďalšom postupe.*
