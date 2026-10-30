# Technický záznam D-340 – Multi-currency

Dátum záznamu: 2026-10-29
Rozhodnutie: D-340
Stav: UI transakcií hotové (commit `9c2fbf3`); Nastavenia mien čakajú; D-340 ako celok zostáva neúplné

## 1. Kontext

D-340 definuje podporu viacerých mien. Základná mena je v aktuálnom návrhu EUR. Transakcia môže obsahovať pôvodnú menu a sumu a výmenný kurz voči základnej mene. Rozhodnutie počíta aj s nastaveniami základnej meny a s manuálne zadávanými kurzami bez sieťových volaní.

Tento záznam opisuje iba zmeny vykonané v aktuálnej pracovnej úlohe. Nepredstavuje potvrdenie kompletnej implementácie D-340.

## 2. Implementované zmeny

Súbor: `src/storage/validate.ts`

- Medzi povolené polia transakcie pribudli `currency`, `exchangeRateToBase` a `originalAmountCents`.
- `currency` je nepovinné. Ak je zadané, musí zodpovedať formátu troch veľkých písmen, napr. `USD`.
- `exchangeRateToBase` je nepovinné. Ak je zadané, vyžaduje aj `currency` a musí byť konečné kladné číslo.
- `originalAmountCents` je nepovinné. Ak je zadané, vyžaduje aj `currency` a musí byť nezáporné celé číslo centov.
- Staré transakcie bez týchto polí zostávajú platné.

## 3. Testy

Nové alebo prítomné testovacie súbory:

- `tests/transaction-currency-validation.test.ts`
  - kompatibilita transakcií bez meny,
  - platná mena a súvisiace polia,
  - odmietnutie malých písmen v kóde meny,
  - odmietnutie kurzu bez meny,
  - odmietnutie nulového alebo nekonečného kurzu,
  - kontrola pôvodnej sumy a celých centov.
- `tests/backup-currency.test.ts`
  - import starej zálohy v16 bez nových polí,
  - import zálohy v17 s údajmi o mene.
- `tests/tax-manual-check.test.ts`
  - samostatný testovací súbor týkajúci sa daní; nepovažovať ho automaticky za súčasť implementácie D-340.

## 4. Overenie

Podľa výsledkov testovania v tejto pracovnej úlohe:

- Cielené testy: 12 testov úspešných v 3 súboroch.
- Kompletná testovacia sada: 616 testov úspešných v 105 súboroch.
- `npm run build`: úspešný.
- `git diff --check`: bez chýb; Git vypísal upozornenie na konverziu LF/CRLF.

Build upozorňuje na hlavný JavaScriptový balík väčší než 500 kB. Ide o upozornenie, nie o zlyhanie buildu.

## 5. Čo nie je týmto záznamom potvrdené

Nasledujúce body sú súčasťou širšieho D-340, ale ich implementáciu tento záznam nepotvrdzuje:

- `Settings.baseCurrency` s predvolenou hodnotou `EUR`.
- `Settings.savedExchangeRates` a `Settings.ratesUpdatedAt`.
- Modul `src/domain/currency.ts` s funkciou `convertToBase`.
- Konverzia pôvodnej sumy na základnú menu.
- Úplná migrácia a kompatibilita schémy zálohy v17.
- Používateľské rozhranie na výber meny a zadávanie kurzov.

Pred ďalším vývojom treba skontrolovať skutočný stav týchto častí v repozitári.

## 6. Pracovný stav Git

Pri poslednej kontrole:

- upravený súbor: `src/storage/validate.ts`,
- nové, nesledované súbory:
  - `tests/backup-currency.test.ts`,
  - `tests/tax-manual-check.test.ts`,
  - `tests/transaction-currency-validation.test.ts`.

V tejto fáze sa nevykonal commit ani push. Pred commitom treba skontrolovať celý diff a potvrdiť, ktoré nové súbory patria k aktuálnej úlohe.

## 7. Aktualizácia po audite – 2026-10-29

### Oprava validácie Settings

V `src/storage/validate.ts` bola doplnená podpora menových polí v `validateSettings()`:

- `baseCurrency` je voliteľné a pri zadaní musí mať formát troch veľkých písmen.
- `savedExchangeRates` je voliteľný objekt; kľúče musia mať formát troch veľkých písmen a hodnoty musia byť konečné kladné čísla.
- `ratesUpdatedAt` je voliteľný reťazec.
- Všetky tri polia sú povolené medzi známymi kľúčmi nastavení.

### Rozšírené testy

- `tests/validate-settings-appdata.test.ts` – testy validácie nových menových polí.
- `tests/backup-currency.test.ts` – test importu zálohy v17 s menovými nastaveniami a odmietnutia neplatného kurzu.

### Výsledky overenia

- Cielené testy: podľa výstupu Claude úspešné.
- Kompletná testovacia sada: 623/623 testov úspešných v 105 súboroch.
- `git diff --check`: bez chyby; upozornenie na konverziu LF/CRLF v testovacom súbore.
- `npm run build`: úspešný.
- Vite upozorňuje na JavaScriptový balík väčší než 500 kB; build napriek tomu prešiel.

### Aktuálny stav Git

Pri poslednej kontrole:
- upravené: `src/storage/validate.ts`, `tests/validate-settings-appdata.test.ts`;
- nové, nesledované: `docs/70_Technicky_zaznam_D-340_Meny.md`, `docs/71_Podklad_pre_Claude_D-340_Meny.md`, `tests/backup-currency.test.ts`, `tests/tax-manual-check.test.ts`, `tests/transaction-currency-validation.test.ts`.

Commit ani push neboli vykonané.

### Zostávajúce úlohy D-340

- Overiť, či `Settings` a zálohy správne zachovávajú všetky menové údaje.
- Integrovať `convertToBase()` do toku zadávania transakcie.
- Doplniť používateľské rozhranie na výber meny a zadávanie kurzu.
- Doplniť rozhranie na správu základnej meny a uložených kurzov.
- Overiť zobrazovanie súm a správnosť finančných výpočtov pri transakciách v cudzej mene.

**Záver:** validácia menových nastavení je doplnená a testy aj build prešli. D-340 ako celok zostáva neúplné.

## 8. Aktualizácia po commitoch – 2026-10-30

Táto sekcia dopĺňa sekcie 1 až 7, ktoré ostávajú ako história. Sekcia 6 „Pracovný stav Git“ je neaktuálna: zmeny sú commitnuté.

### Stav implementácie

Commit `9c2fbf3` (`feat(currency): support multi-currency transactions`) obsahuje:

- výber meny vo formulári transakcie (EUR, USD, CZK, GBP, CHF), uloženie `originalAmountCents` a `exchangeRateToBase`, prepočet na EUR (`convertToBase` v `src/domain/currency.ts`) a riadok „Prepočítaná suma“; pri chýbajúcom alebo neplatnom kurze sa zavádzajúca suma nezobrazí,
- formulár transakcií predvolene zbalený za „+ Pridať transakciu“ a popis poľa „Suma (EUR)“; 31 E2E špecifikácií a `tests/e2e/helpers.ts` bolo upravených,
- validáciu transakcie a nastavení v `src/storage/validate.ts` a test zálohy v17,
- testy `tests/transaction-currency-validation.test.ts`, `tests/backup-currency.test.ts`, `tests/e2e/transactions-currency.spec.ts`; rozšírený `tests/validate-settings-appdata.test.ts`.

Kalendárové zmeny nie sú súčasťou D-340; sú v D-345 (samostatné commity). Priamy test dane (`tests/tax-manual-check.test.ts`) je samostatný commit k D-339.

Číslovanie: v E2E komentároch bolo D-341 opravené na D-340. D-341 je Monte Carlo.

### Overenie (sandbox, 2026-10-30)

- Po commite 3: `tsc` bez chýb, vitest 106 súborov a 647 testov; plný E2E 574 vykonaní: 570 prešlo, 2 zlyhali pre pevný port v `offline.spec.ts`, 2 časové limity (samostatne 102 z 102).
- Po commite 7: vitest 111 súborov a 720 testov; plný E2E 606 vykonaní: 604 prešlo, 2 zlyhali pre pevný port (opravené v commite `42cc5f6`).
- Podrobnosti o celej sérii sú v `CLAUDE.md` (sekcia Stav projektu).

### Čo ostáva

- Rozhranie Nastavení pre základnú menu (`baseCurrency`) a uložené kurzy (`savedExchangeRates`, `ratesUpdatedAt`): typy a validácia existujú, rozhranie nie.
- Zoznam mien vo formulári je pevná päťica. Požiadavka z `docs/71` je komplexnejšie riešenie: používateľ vyberie ľubovoľnú menu nezávisle od krajiny alebo lokality.
- Overiť zobrazenie súm a výpočty vo všetkých sekciách pre transakcie v cudzej mene; tento záznam to nepotvrdzuje.

**Záver:** D-340 ako celok zostáva neúplné.
