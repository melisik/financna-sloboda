# COMPAVEN 2.0 — Audit dvoch testovacích verzií

**Dátum:** 2026-11-12 · **Vetva:** `recovery-test` · **HEAD:** `41a8e7a`
**Režim:** statická analýza, iba čítanie.
- Osobné finančné záznamy sa neotvárali ani nevypisovali.
- Súbory, ktoré ich môžu obsahovať, sa kontrolovali len podľa názvu a stavu v Gite.
- Úložiská prehliadačov sa kontrolovali len podľa názvov priečinkov (pozri `docs/COMPAVEN_2_FINAL_AUDIT.md`, oddiel 13.3).

**Verzie:**
- **A:** personalizovaná, s osobnými dátami zakladateľa.
- **B:** Free verzia pre externých testerov.

**Legenda:** OVERENÉ A BEZPEČNÉ · ČIASTOČNE OVERENÉ · NEOVERENÉ · RIZIKOVÉ · KRITICKÉ

---

## 1. Zhrnutie

- **Free verziu zatiaľ neposkytovať testerom.**
- Dve verzie nie sú v repozitári jednoznačne definované.
- Oddelenie dát zabezpečuje iba prehliadač (IndexedDB podľa originu a profilu).
- Na COMPAVEN stránke je zraniteľnosť XSS (F-06), ktorá ohrozuje práve dáta verzie A.
- Build zlyhá a pre COMPAVEN neexistuje žiadny E2E test.

## 2. Mapa verzií

| Prvok | Verzia A (personalizovaná) | Verzia B (Free) | Stav |
|---|---|---|---|
| Definícia v kóde: pracovný strom (necommitnutý) | build-time `VITE_COMPAVEN_ENV=real` → DB `compaven-2.0-real`, zálohy `compaven-2.0-real-backups` (`src/config/environment.ts:42-45`, `src/storage/backupDb.ts:4`) | `VITE_COMPAVEN_ENV=sandbox` → DB `compaven-2.0-sandbox` | ČIASTOČNE OVERENÉ |
| Definícia v kóde: commitnutá verzia (HEAD) | bez parametra → DB `compaven-2.0` | `?test=true` → DB `compaven-2.0-test` (`HEAD:src/compaven.tsx:16`, `HEAD:src/compaven-ui/App.tsx:27`) | OVERENÉ |
| Pojem „Free verzia“ | — | v kóde ani v `decisions/Decisions.md` neexistuje; `VITE_DEMO` nastavuje `.github/workflows/preview-phase2.yml:48`, kód ju nečíta | OVERENÉ (chýba) |
| Premenné prostredia | `VITE_COMPAVEN_ENV` nie je nastavená nikde (žiadny `.env*`, workflows ju nemajú) | rovnako | OVERENÉ |
| Nasadenie | konfigurácia nie je v repozitári | kandidáti `compaven-preview.pages.dev` a `compaven-v2-preview.pages.dev` (ručné nasadenie, žiadny workflow) | NEOVERENÉ |
| Vetva a worktree | necommitnutý stav na `recovery-test` (`phase3-ux-redesign`) | nepriradená | NEOVERENÉ |
| Rozdiel v rozhraní | — | pruh `SANDBOX PROSTREDIE (…)` (`src/compaven-ui/TestModeIndicator.tsx:27`, pracovný strom) | ČIASTOČNE OVERENÉ |

**Záver mapy:**
- V commitnutej verzii sú A a B **ten istý build na tom istom origine**. Prepína ich iba URL parameter, takže ide o oddelenie na úrovni rozhrania.
- Pracovný strom ich oddeľuje pri zostavení, čo je silnejšie. Tento kód však nie je v Gite ani nikde nastavený.

## 3. Ochrana osobných údajov (cesty úniku)

Aplikácia nemá backend ani API (výnimkou je brána s heslom `preview/_worker.js`). Dáta sú len v IndexedDB prehliadača.

| Cesta | Mechanizmus | Hodnotenie | Dôkaz |
|---|---|---|---|
| Databázové pripojenie a zdieľaná DB | neexistuje; každý prehliadač má vlastnú IndexedDB podľa originu | OVERENÉ A BEZPEČNÉ (na rôznych zariadeniach) | architektúra, `docs/05` |
| XSS cez `?env=` | chybová správa s hodnotou z URL ide do `innerHTML`; `compaven.html` nemá CSP; odkaz od testera otvorený zakladateľom na origine A by umožnil prečítať a odoslať všetky dáta A | **KRITICKÉ** | `src/compaven.tsx:22`, `src/config/environment.ts:73-78` |
| Záloha a import | import prijme akúkoľvek platnú zálohu; v sandboxe sa pôvod nekontroluje; únik nastane rozšírením súboru so zálohou A | RIZIKOVÉ | `src/compaven-ui/BackupForm.tsx`, HO §4.4 |
| Seed a demo dáta | `public/testovacia-zaloha.json` a `public/modelova-domacnost.json` idú do každého buildu; `scripts/make-test-backup.mjs` len posúva dátumy; obsah neoverený | NEOVERENÉ | `ls public`, skript |
| Súbory v repozitári | repozitár je **verejný**; diagnostické `COMPAVEN_*DIAGNOSTIC_429167_*.md` v koreni sú nesledované a nie sú na origin; obsah neoverený | RIZIKOVÉ pri `git add -A` | `git ls-files`, `git cat-file` |
| localStorage | iba značka prostredia a názov DB | OVERENÉ A BEZPEČNÉ | `environment.ts:88-89` |
| Logy a diagnostika | `console.log` vypíše prostredie a názov DB, nie dáta | ČIASTOČNE OVERENÉ | `src/compaven-ui/App.tsx:41` |
| Cache (service worker) | `compaven-sw.js` registrovaný v produkcii; čo cachuje, je neoverené (dáta sú v IndexedDB, nie v cache) | NEOVERENÉ | `src/compaven.tsx:7-12` |
| Cloudflare a premenné prostredia | konfigurácia projektov nie je v repozitári | NEOVERENÉ | — |
| Spoločné zariadenie alebo profil prehliadača | nie sú účty, takže všetci v profile vidia rovnaké dáta | RIZIKOVÉ | architektúra |

## 4. Bezpečnosť Free verzie

| Požiadavka | Ochrana v rozhraní | Skutočná ochrana dát | Hodnotenie |
|---|---|---|---|
| Tester vidí iba svoje dáta | — | áno, vlastná IndexedDB v jeho prehliadači | OVERENÉ A BEZPEČNÉ (rôzne zariadenia) |
| Žiadny prístup k dátam A | — | áno priamo; nie pri XSS (F-06) alebo zdieľanom súbore so zálohou | **KRITICKÉ** |
| Nemôže zmeniť konfiguráciu DB | — | pracovný strom: áno (build-time); HEAD: `?test=true` prepína DB v rámci originu | ČIASTOČNE OVERENÉ |
| Nemôže cez URL prepnúť do A | — | pracovný strom: nie, iba chyba (s XSS); HEAD: áno v rámci vlastného prehliadača, dáta A tam nie sú | RIZIKOVÉ (XSS) |
| Prístup cez API | — | API neexistuje | OVERENÉ A BEZPEČNÉ |
| Obnova cudzej zálohy | — | technicky možná, ak súbor dostane | RIZIKOVÉ |
| Export cudzích dát | — | exportuje iba dáta vlastného prehliadača | OVERENÉ A BEZPEČNÉ |

## 5. Porovnanie verzií

| Oblasť | Personalizovaná verzia (A) | Free verzia (B) | Riziko |
|---|---|---|---|
| Databáza | `compaven-2.0-real` (pracovný strom) / `compaven-2.0` (HEAD) | `compaven-2.0-sandbox` / `compaven-2.0-test` | na rovnakom origine iba iný názov DB; F-01 (premenovanie bez migrácie) |
| Identita používateľa | žiadna | žiadna | spoločný profil prehliadača = spoločné dáta |
| Údaje | osobné, v prehliadači zakladateľa (kandidátske originy v oddiele 13.3 FINAL_AUDIT) | testerove a demo súbory z `public/` | demo dáta neoverené |
| Ukladanie | IndexedDB (`src/storage/indexeddb.ts`) | IndexedDB | rovnaký kód; oddelenie len menom DB a originom |
| Zálohy | ručný export; pred importom záloha do `compaven-2.0-real-backups` (`BackupForm.tsx:86-106`) | ručný export a import, bez kontroly pôvodu | záloha je neúplná (F-02, F-03); import odmietne vlastné nastavenia (F-04) |
| API | žiadne | žiadne | — |
| Konfigurácia | `VITE_COMPAVEN_ENV=real`, nikde nenastavená | `sandbox`, nikde nenastavená | build bez premennej skončí FATAL |
| Nasadenie | nedefinované | nedefinované, ručné na Cloudflare | neznáme, čo je nasadené a odkiaľ |
| Bezpečnosť | ochrana pre REAL (zákaz resetu a mazania príloh) len v necommitnutom kóde (`Lock.tsx:69`, `indexeddb.ts:182`) | sandbox reset povolený | XSS F-06 bez CSP |

## 6. Testovateľnosť a pripravenosť pre testerov

| Kritérium | Stav |
|---|---|
| Štart s čistými testovacími dátami | áno, nová IndexedDB v prehliadači testera (ČIASTOČNE OVERENÉ) |
| Obnova demo dát | `public/testovacia-zaloha.json` existuje; postup pre COMPAVEN nie je zdokumentovaný (NEOVERENÉ) |
| Realistické a anonymizované dáta | NEOVERENÉ, zakladateľ musí potvrdiť |
| Oddelenie medzi testermi | áno na rôznych zariadeniach |
| Bezpečný reset | v sandboxe áno (`Lock.tsx`, pracovný strom), netestované |
| Postup pri nahlásení chyby | `docs/41_Navod_pre_testerov.md` existuje len pre legacy |
| Bez technických a osobných údajov iných | áno (nie sú iní používatelia); chybová stránka však vypisuje technické detaily |
| Kvalita | `npm run build` zlyhá (`tsc`), 65 z 1087 unit testov zlyhá, 0 E2E pre `compaven.html` |

## 7. Kritické scenáre

| # | Scenár | Výsledok | Hodnotenie |
|---|---|---|---|
| 1 | Zmena `env` v URL | pracovný strom: prostredie sa neprepne, chyba sa však vykreslí cez `innerHTML` (XSS); HEAD: `?test=true` prepne DB vo vlastnom prehliadači | **KRITICKÉ** (XSS) |
| 2 | Vymazanie localStorage a IndexedDB | zmaže len dáta toho prehliadača | OVERENÉ A BEZPEČNÉ pre A (iné zariadenie) |
| 3 | Obnova zálohy z A | možná, ak tester súbor dostane | RIZIKOVÉ (procesné) |
| 4 | Import súboru z A | rovnako ako 3 | RIZIKOVÉ |
| 5 | Zmena identifikátora používateľa alebo DB | identita neexistuje; DB určuje build (pracovný strom) alebo URL (HEAD), vždy len vo vlastnom prehliadači | ČIASTOČNE OVERENÉ |
| 6 | Dvaja testeri súčasne | rôzne zariadenia sú oddelené; spoločný profil zdieľa dáta | ČIASTOČNE OVERENÉ |
| 7 | Spoločné API alebo backend | neexistuje | OVERENÉ A BEZPEČNÉ (sieťové volania COMPAVEN čiastočne overené) |
| 8 | Zmena konfigurácie ovplyvní druhé prostredie | závisí od oddelenia projektov na Cloudflare | NEOVERENÉ |

## 8. Záverečné hodnotenie

| Oblasť | Klasifikácia |
|---|---|
| Oddelenie databáz | ČIASTOČNE OVERENÉ |
| Ochrana osobných údajov pred testermi | **KRITICKÉ** (F-06) |
| Konfigurácia a nasadenie verzií | NEOVERENÉ |
| Demo dáta | NEOVERENÉ |
| API a backend | OVERENÉ A BEZPEČNÉ (neexistuje) |
| Pripravenosť pre testerov | RIZIKOVÉ |

**Odpovede:**
1. **Sú verzie technicky oddelené?** Len čiastočne, prehliadačom (origin a profil). V repozitári nie sú verzie zadefinované a v commitnutej verzii ich prepína URL parameter.
2. **Sú osobné údaje chránené pred testermi?** Priamo áno, keďže backend neexistuje. Kvôli XSS (F-06) a možnému šíreniu súborov so zálohou však nie spoľahlivo.
3. **Môžeme Free verziu poskytnúť prvým testerom?** **Nie.**
4. **Podmienky pred sprístupnením:**
   - Free build iba s `VITE_COMPAVEN_ENV=sandbox`, v samostatnom projekte Cloudflare na inom origine, než používa zakladateľ.
   - Verzia A len lokálne alebo za heslom.
   - Nasadenie cez workflow s povinným schválením, nie ručne.
   - Potvrdiť, že `public/testovacia-zaloha.json` a `modelova-domacnost.json` sú syntetické.
   - Žiadne osobné súbory v repozitári ani v `dist/`.
   - Modul prostredia zapísať do Gitu.
   - Zapísať rozhodnutie o verziách A a B do `Decisions.md`.
   - Návod pre testerov COMPAVEN s resetom, obnovou demo dát a postupom na nahlásenie chyby.
5. **Chyby, ktoré treba odstrániť pred prvým externým testovaním:**
   - F-06 (XSS a CSP);
   - F-08 (build);
   - F-04, F-02 a F-03 (import a záloha);
   - F-05 (nesprávne čísla);
   - F-01 (názvy DB pre verziu A);
   - E2E testy pre `compaven.html`.

## 9. Čo sa nepodarilo overiť
- čo je nasadené na `compaven-preview` a `compaven-v2-preview`, z ktorej vetvy a s akou konfiguráciou;
- obsah demo dát a diagnostických súborov (zámerne neotvorené);
- čo cachuje `compaven-sw.js`;
- že COMPAVEN nevolá žiadny externý server (úplná kontrola sieťových volaní);
- správanie importu pri zálohe z iného prostredia;
- kde presne sú dáta verzie A (pozri `docs/COMPAVEN_2_FINAL_AUDIT.md`, oddiel 13.3).

## 10. Zvolený variant A1: personalizovaná verzia iba lokálne (2026-11-12)

**Rozhodnutie zakladateľky:** verzia A beží iba lokálne, bez verejného prístupu. Zapísanie do `decisions/Decisions.md` je na zakladateľke.

**Implementované:**
- `package.json`:
  - `build:real`: `tsc` a `vite build --mode real` do `dist-real/`;
  - `preview:real`: `vite preview` iba na `127.0.0.1:4300`;
  - `build:sandbox`: `tsc` a `vite build --mode sandbox` do `dist-sandbox/`;
  - `dev:sandbox`: vývojový server v režime sandbox.
- `vite.config.ts`, funkcia `applyCompavenMode`:
  - `--mode real` alebo `--mode sandbox` nastaví `VITE_COMPAVEN_ENV` (súbory `.env` sa nepoužívajú);
  - odporujúca premenná zo shellu build zastaví.
- `.gitignore`: `dist-real/` a `dist-sandbox/` sa nedostanú do verejného repozitára.

**Overené:**
- obe zostavy prejdú;
- `dist-sandbox` má zapečené `env=sandbox` a `isRealEnv=false`, `dist-real` má `env=real` a `isRealEnv=true`;
- obe majú CSP v `compaven.html`;
- poistka zastavila build `VITE_COMPAVEN_ENV=real` pri `--mode sandbox`.
- REAL zostava sa v prehliadači neotvárala, takže žiadna DB `compaven-2.0-real` nevznikla.

**Postup pre zakladateľku:**
1. Vytvoriť v Chrome samostatný profil „COMPAVEN REAL“. Nepripájať k nemu Claude in Chrome ani rozšírenia, ktoré nepotrebuje.
2. Spustiť `npm run build:real` a potom `npm run preview:real`.
3. Aplikáciu otvárať **iba** v tomto profile na `http://127.0.0.1:4300/src/compaven.html`.
4. Pravidelne exportovať zálohu na externé médium. Súbory so zálohou neposielať testerom a nedávať do repozitára.
5. Na každodenný vývoj používať `npm run dev:sandbox`, nikdy REAL.

**Obmedzenia:**
- REAL dáta zo staršej DB `compaven-2.0` (iný origin, F-01) sa do novej DB nepresunú automaticky. Prenos je možný exportom a importom zálohy po oprave F-02, F-03 a F-04.
- Port 4300 je súčasťou originu. Pri zmene portu by aplikácia otvorila prázdnu databázu.
