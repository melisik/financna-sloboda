# 05 – Technická architektúra (MVP)

> Stav: v0.2 (2026-10-13). Rozsah: webová aplikácia, mobile-first, jeden používateľ, lokálne dáta (D-009, D-012). Vychádza z `02`, `03`, `04` a `decisions/Decisions.md`. **[predpoklad]** = návrh Claude, treba potvrdiť.

## 1. Prehľad
Statická single-page aplikácia (PWA) bez servera. Všetky dáta a výpočty bežia v prehliadači na zariadení.

```
┌──────────────────────── Prehliadač (zariadenie) ────────────────────────┐
│  UI (React)  ──►  Aplikačná vrstva (use-case funkcie)                    │
│                        │                     │                           │
│                        ▼                     ▼                           │
│               Doménové výpočty         Repozitár dát (rozhranie)         │
│               (čisté funkcie,          │                                 │
│                bez UI a úložiska)      ▼                                 │
│                                  IndexedDB (lokálne dáta)                │
│  Service Worker (offline) · Manifest (pridanie na plochu)                │
└──────────────────────────────────────────────────────────────────────────┘
```

Žiadny backend, žiadne účty, žiadne volania na externé API v MVP (FR-16).

## 2. Technológie

| Oblasť | Voľba | Dôvod |
|---|---|---|
| Jazyk | TypeScript (strict) | Chyby v sumách a dátumoch sa chytia pri kompilácii. |
| UI | React | Známy, veľký ekosystém, jednoduché komponenty. |
| Build | Vite | Rýchly vývoj, jednoduchý výstup ako statické súbory. |
| PWA | Service Worker + Web App Manifest (cez vite-plugin-pwa alebo ručne) | Offline a pridanie na plochu telefónu (FR-16). |
| Úložisko | IndexedDB (cez malú knižnicu, napr. idb) | Väčší objem dát než localStorage; transakčné zápisy. |
| Testy | Vitest (jednotkové), Playwright (end-to-end, neskôr) | Výpočty sa testujú bez prehliadača. |
| Štýly | CSS moduly alebo jednoduché CSS premenné | Tokeny pre svetlý/tmavý režim (D-016). Bez veľkého UI frameworku. |
| Dátum a čas | Natívne `Date` + malá knižnica pre mesiace (napr. date-fns) [predpoklad] | Mesiace a zobrazenie v slovenčine. |

Jazyk UI: slovenčina; texty v jednom súbore pripravenom na preklady (fáza 2) [predpoklad].

## 3. Štruktúra kódu

```
src/
  domain/          čisté funkcie, žiadny React ani IndexedDB
    goal.ts        T = V / p, dátum cieľa, scenáre (FR-01 až FR-03)
    impact.ts      predbežný dopad (FR-04)
    snapshot.ts    prepočet pri mesačnom vyhodnotení (FR-05)
    types.ts       Transakcia, Vyhodnotenie, Nastavenie
    money.ts       zaokrúhľovanie a formát EUR
  storage/
    repository.ts  rozhranie (čítanie/zápis transakcií, vyhodnotení, nastavení)
    indexeddb.ts   implementácia rozhrania
    backup.ts      export/import JSON + validácia schémy (FR-17, FR-18)
  app/             use-case funkcie (zadaj transakciu, urob vyhodnotenie...)
  ui/              React komponenty a obrazovky
  i18n/sk.ts       všetky texty
tests/             jednotkové testy domain/ a storage/
```

**Pravidlo závislostí:** `domain` nesmie importovať nič z `storage`, `app` ani `ui`. `ui` komunikuje len cez `app`. Tým sa `domain` dá použiť aj v budúcej mobilnej appke (fáza 2) bez prepisovania.

## 4. Dátový model

### Úložisko (IndexedDB, databáza `financna-sloboda`, verzia 1)
| Store | Kľúč | Indexy | Obsah |
|---|---|---|---|
| `transactions` | `id` (UUID) | `date`, `type` | dátum, typ (sporenie / investícia / výdavok), suma (cent), zdroj úhrady, poznámka, `createdAt`, `updatedAt` |
| `snapshots` | `id` (UUID) | `date` | dátum vyhodnotenia, hodnota investícií (cent), nasporená suma (cent), `createdAt` |
| `settings` | `key` (jediný záznam `"current"`) | – | V, p, r, rezerva (mesiace), prah výdavkov, a pre každý parameter príznak „zmenený používateľom“ (UR-02) |
| `meta` | `key` | – | `schemaVersion`, `lastExportAt` (FR-19) |

- **Sumy ukladáme ako celé centy** (integer), nie ako float. Zamedzí chybám zaokrúhľovania.
- **Dátumy** ako ISO reťazec `YYYY-MM-DD` (bez času, bez časového pásma) [predpoklad].
- Ak sa niečo v indexe nedá použiť, transakcie sa filtrujú v pamäti; objem je malý (desiatky až stovky záznamov za rok).

### Export JSON (FR-17)
```json
{
  "app": "financna-sloboda",
  "schemaVersion": 1,
  "exportedAt": "2038-03-31T10:00:00Z",
  "settings": { ... },
  "transactions": [ ... ],
  "snapshots": [ ... ]
}
```
Import: validácia schémy (typy, rozsahy, povinné polia) → náhľad → nahradenie dát v jednej transakcii (D-018). Pri chybe sa nič nezmení.

## 5. Výpočty (domain)

Čisté funkcie, bez vedľajších účinkov. Vstupy: hodnoty v centoch a dátumy, výstup: sumy a počet mesiacov.

- `targetAmount(V, p) → T` (FR-01).
- `monthsToTarget(K, m, r, T) → n | null` podľa vzorca z FR-02 (`null` = nedosiahnuteľné, viď D-019).
- `dateEstimates(K, m, T, {r_optimistic, r_base, r_cautious}) → {from, base, to}` (FR-03).
- `pendingImpact(snapshot, transactionsAfter, settings) → {K_pred, deltaMonths}` (FR-04, FR-08).
- `monthlySaving(transactions, today) → m` (súčet sporenia a investícií za 12 mesiacov ÷ 12, D-017).

Zaokrúhľovanie až pri zobrazení (FR-06). Dátum z mesiacov: `ceil(n)` mesiacov od dnešného dňa.

### Overené príklady (jednotkové testy)
| Vstup | Očakávaný výsledok |
|---|---|
| V = 24 000, p = 4 % | T = 600 000 |
| K = 100 000, m = 500, r = 4 %, T = 600 000 | n ≈ 333,9 → 334 mesiacov (FR-02) |
| to isté, K_pred = 105 000 | n ≈ 327,9 → dopad 6 mesiacov skôr (FR-04) |
| K = 100 000, m = 0, r = 4 %, T = 600 000 | n ≈ 548,2 → 549 mesiacov ≈ 45,7 roka → do 50 rokov, zobrazí sa dátum |
| K = 0, m = 0 | „Bez sporenia a výnosu sa cieľ nedosiahne“ (D-019) |
| K ≥ T | cieľ dosiahnutý |
| r = 0, m = 500 | n = (T − K) / m |

Poznámka: v predchádzajúcom popise som uviedol približne 60 rokov pre prípad bez sporenia. Presný výpočet je približne 46 rokov (K = 100 000, T = 600 000, r = 4 %); toto je správna hodnota (viď `07_Testing_Strategy`, GC-07).

## 6. Správanie offline a aktualizácie
- Service Worker ukladá aplikáciu do cache po prvom načítaní; funguje offline (FR-16).
- Nová verzia sa načíta pri ďalšom otvorení; aplikácia neprepíše dáta.
- Migrácie databázy: číslo verzie IndexedDB + funkcie migrácie v `storage/` [predpoklad].

## 7. Bezpečnosť a súkromie
- Žiadne dáta odchádzajú zo zariadenia; žiadne analytické ani chybové nástroje tretích strán v MVP [predpoklad].
- **Šifrovanie v kľude:** v MVP nie je. Dáta sú v prehliadači chránené len sandboxom prehliadača a zámkom zariadenia. Riziko: iný človek s prístupom k odomknutému zariadeniu alebo k exportu. Pripomenie sa to v exporte (FR-17). Na zvážení pred fázou 2 [predpoklad].
- Export obsahuje citlivé údaje: žiadne automatické odosielanie, žiadne ukladanie do verejných priečinkov.
- Závislosti: minimum, pravidelný audit (npm audit) [predpoklad].
- Content Security Policy bez inline skriptov (ochrana pred injekciou), ak to nasadenie podporuje.

## 8. Nasadenie
- Statický build (`dist/`) na ľubovoľný statický hosting (napr. GitHub Pages) [predpoklad]. Hosting nepozná dáta používateľa.
- Hosting musí byť HTTPS (Service Worker a inštalácia vyžadujú HTTPS).
- Verzia aplikácie v `package.json`, tag v gite pri každom vydaní.

## 9. Kvalita a testovanie (zhoda s `07_Testing_Strategy`, ešte nevytvorený)
- **Jednotkové testy domain/:** všetky vzorce a hraničné stavy z FR-02, FR-04, FR-05 a tabuľky vyššie.
- **Testy storage/:** zápis, čítanie, migrácia, import s neplatným súborom (nič sa nezmení).
- **End-to-end (neskôr):** prvé nastavenie → transakcia → vyhodnotenie → export → import.
- **Ručné testy na telefóne:** veľkosti dotykových plôch, čitateľnosť, offline režim (UX princípy).

## 10. Riziká a technický dlh [predpoklad]
| Riziko | Dopad | Opatrenie |
|---|---|---|
| Prehliadač vymaže dáta | strata údajov | pripomienka zálohy (FR-19), export, jasný prázdny stav |
| Zmena schémy dát | nečitateľné zálohy | `schemaVersion` + migrácie od prvej verzie |
| Chyby vo vzorcoch | zlý dátum cieľa | jednotkové testy s overenými príkladmi, čisté funkcie |
| Závislosť na IndexedDB v starých prehliadačoch | nefunkčné úložisko | cieľ: aktuálne prehliadače; zobraziť správu pri nepodpore |
| Prechod na mobilnú appku (fáza 2) | duplicita logiky | `domain/` bez UI, zdieľateľný balík |

## 11. Otvorené otázky
1. **Hosting:** GitHub Pages stačí, alebo iný? (rozhodne sa pred prvým nasadením)
2. **Šifrovanie dát v kľude:** odložiť na fázu 2 (navrhované), alebo doplniť heslo už v MVP?
3. **Názov a doména:** pracovný názov sa zmení (D-002); nasadenie zatiaľ bez vlastnej domény.
4. **Riziko iOS Safari:** dáta môžu byť po dlhšom nepoužívaní vymazané, ak appka nie je na ploche (07 oddiel 6). Potvrdiť odporúčanie pridať na plochu.
