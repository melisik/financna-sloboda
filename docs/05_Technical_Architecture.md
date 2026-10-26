# 05 – Technická architektúra (MVP)

> Stav: v0.6 (2026-10-14). Rozsah: webová aplikácia, mobile-first, jeden používateľ, lokálne dáta (D-009, D-012). Vychádza z `02`, `03`, `04` a `decisions/Decisions.md`. **[predpoklad]** = návrh Claude, treba potvrdiť.

> **Aktualizácia stavu (2026-10-26, D-325):** základ platí (PWA, IndexedDB, bez servera, CSP `connect-src 'self'`). Zmeny: moduly a balíky `docs/21`, `docs/23` (D-162, D-171, D-174), schéma zálohy v14 a IndexedDB v11 (D-302), voliteľne šifrovaná záloha (D-276), súkromný náhľad na Cloudflare Pages (D-270 až D-273), OCR a skener v zariadení (D-232, D-284). Prepracovanie pred bránou G4.

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
    assumptions.ts verzovaná tabuľka výnosových predpokladov, nominálne zobrazenie, poplatky (D-062 až D-065)
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
| `transactions` | `id` (UUID) | `date`, `type` | dátum, typ (sporenie / investícia / výdavok / rezerva – vklad / výber z rezervy; D-037, D-047), suma (cent), zdroj úhrady, príznak pod prahom (D-030), poznámka, `createdAt`, `updatedAt` |
| `snapshots` | `id` (UUID) | `date` | dátum vyhodnotenia (nesmie byť v budúcnosti, M2), hodnota investícií (cent), nasporená suma = kumulatívny stav hotovosti (cent, D-033), `createdAt` |
| `settings` | `key` (jediný záznam `"current"`) | – | V, p, r, rezerva (mesiace), prah výdavkov, m (odvodené; voliteľné prepísanie), a pre každý parameter príznak „zmenený používateľom“ (UR-02) |
| `meta` | `key` | – | `schemaVersion`, `lastExportAt` (FR-19) |

- **Sumy ukladáme ako celé centy** (integer), nie ako float. Zamedzí chybám zaokrúhľovania.
- **Dátumy** ako ISO reťazec `YYYY-MM-DD` (bez času, bez časového pásma) [predpoklad].
- Ak sa niečo v indexe nedá použiť, transakcie sa filtrujú v pamäti; objem je malý (desiatky až stovky záznamov za rok).

### Export JSON (FR-17)
```json
{
  "app": "financna-sloboda",
  "schemaVersion": 1,
  "exportedAt": "2026-10-14T10:00:00Z",
  "settings": { ... },
  "transactions": [ ... ],
  "snapshots": [ ... ]
}
```
Import: validácia schémy (typy, rozsahy, povinné polia, neznáme polia sa odmietnu, limit veľkosti 5 MB; N11) → náhľad → nahradenie dát v jednej transakcii (D-018). Pri chybe sa nič nezmení.

## 5. Výpočty (domain)

Čisté funkcie, bez vedľajších účinkov. Vstupy: hodnoty v centoch a dátumy, výstup: sumy a počet mesiacov.

- `targetAmount(V, p) → T` (FR-01).
- `monthsToTargetSplit(K_inv, K_cash, m_inv, m_cash, r, T) → n | null` podľa vzorca z FR-02 a D-046 (m_cash = 0 dá uzavretý tvar; r sa uplatní len na K_inv, D-036) (`null` = nedosiahnuteľné, viď D-019).
- `dateEstimates(K, m, T, {r_optimistic, r_base, r_cautious}) → {from, base, to}` (FR-03).
- `pendingImpact(snapshot, transactionsAfter, settings)` (K_inv a K_cash sa počítajú zvlášť podľa D-041 a D-058; m sa delí na m_inv a m_cash podľa typu transakcie) → {K_pred, deltaMonths | deltaDays} (K_pred = max(0, …) podľa FR-04, H2; dopad v dňoch pod 1 mesiac podľa FR-04).
- `monthlySaving(transactions, D_L) → m` (sporenie + investície za 12 mesiacov do D_L, delené počtom mesiacov histórie, najviac 12; D-031).
- `lastReviewDate(snapshots) → D_L` (dátum najnovšieho snapshotu; bez snapshotu `null`, D-024).
- `targetDate(D_L, n) → date` (D_L + ceil(n − 1e-6) mesiacov, orezané na posledný deň mesiaca; D-024). Počíta sa z K_L, takže sa mení len pri novom vyhodnotení.
- `monthsLeft(today, targetDate) → mesiace | null` (zostávajúci čas od dneška; záporná hodnota = dátum uplynul, zobrazí sa „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“; D-024).

Zaokrúhľovanie až pri zobrazení (FR-06). Dátum z mesiacov: `ceil(n − 1e-6)` mesiacov od D_L (D-024), nie od dnešného dňa.

### Overené príklady (jednotkové testy)
| Vstup | Očakávaný výsledok |
|---|---|
| V = 24 000, p = 4 % | T = 600 000 |
| K = 100 000, m = 500, r = 4 %, T = 600 000 | n ≈ 333,9 → 334 mesiacov (FR-02) |
| to isté, K_pred = 105 000 | n ≈ 327,9 → dopad 6 mesiacov skôr (FR-04) |
| K = 100 000, m = 0, r = 4 %, T = 600 000 | n ≈ 548,2 → 549 mesiacov ≈ 45,7 roka → do 50 rokov, zobrazí sa dátum |
| K = 0, m = 0 | „Pri súčasnom sporení a výnose sa cieľ nedosiahne“ (D-019) |
| K ≥ T | cieľ dosiahnutý |
| r = 0, m = 500 | n = (T − K) / m |

## 6. Správanie offline a aktualizácie
- Service Worker ukladá aplikáciu do cache po prvom načítaní; funguje offline (FR-16).
- Nová verzia sa načíta pri ďalšom otvorení; aplikácia neprepíše dáta.
- Migrácie databázy: číslo verzie IndexedDB + funkcie migrácie v `storage/` [predpoklad].

## 7. Bezpečnosť a súkromie
- Žiadne dáta odchádzajú zo zariadenia; žiadne analytické ani chybové nástroje tretích strán v MVP [predpoklad].
- **Šifrovanie v kľude:** v MVP nie je. Dáta sú v prehliadači chránené len sandboxom prehliadača a zámkom zariadenia. Riziko: iný človek s prístupom k odomknutému zariadeniu alebo k exportu. Pripomenie sa to v exporte (FR-17). Rozhodnuté v D-026: v MVP sa nerieši, rieši sa pred fázou 2.
- Export obsahuje citlivé údaje: žiadne automatické odosielanie, žiadne ukladanie do verejných priečinkov.
- Závislosti: minimum, pravidelný audit (npm audit) [predpoklad].
- Content Security Policy v meta tagu bez inline skriptov (ochrana pred injekciou). GitHub Pages nevie nastaviť HTTP hlavičky, takže CSP je len meta tag; direktívy `frame-ancestors`, `report-uri` a `sandbox` v meta tagu nefungujú a nepoužijú sa (S4).

## 8. Nasadenie
- Statický build (`dist/`) na ľubovoľný statický hosting (napr. GitHub Pages) [predpoklad]. Hosting nepozná dáta používateľa.
- Hosting musí byť HTTPS (Service Worker a inštalácia vyžadujú HTTPS).
- Verzia aplikácie v `package.json`, tag v gite pri každom vydaní.

## 9. Kvalita a testovanie (zhoda s `07_Testing_Strategy`)
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
1. **Hosting:** uzavreté: GitHub Pages (D-056; nasadzuje sa len z main).
2. **Šifrovanie dát v kľude:** rozhodnuté (D-026): v MVP nie je, rieši sa pred Fázou 2.
3. **Názov a doména:** pracovný názov sa zmení (D-002); nasadenie zatiaľ bez vlastnej domény.
4. **Riziko iOS Safari:** dáta môžu byť vymazané po neaktivite, ak appka nie je na ploche. Rozhodnuté (D-042, D-053): na iPhone je plocha povinná výzva; kým appka nie je na ploche, zobrazí sa len návod (pôvodne východiskové, D-034). Overenie na reálnom iPhone pred M2 (07 §6).


## 12. Fáza 2 – technický návrh (neimplementované)

> Stav: návrh. Nič z tejto sekcie nie je v kóde. Brána: právne posúdenie a bezpečnostný audit (`06_Roadmap.md`).

### 12.1 Dátový model (koncept)
- `asset`: `id`, `typ` (investícia | nehnuteľnosť), `režim` (podľa typu), `hodnota`, `dátumOdhadu`, `zdrojOdhadu`, `poznámka`.
- `liability`: `id`, `assetId`, `zostatok`, `úrokováSadzba`, `splátka`, `dátumSplatenia`, `zdroj` (zmluva).
- `taxRegime`: `id`, `názov`, `parametre` (verzované), `zdroj`, `platnosťOd`, `stav` (overené | neoverené).
- `statSource`: `id`, `dataset`, `metóda`, `platnosťOd`, `stav`, `poslednáAktualizácia`.
- `schemaVersion` sa zvýši. Migrácia z v1 pridá prázdne polia (nezadané), nič sa nezmaže.

### 12.2 Výpočtová vrstva
- Čisté funkcie v `domain/`, bez UI, ako v M1:
  - `netPropertyValue(asset, liability)` = odhad − zostatok (D-080);
  - `splitPayment(payment, rate, balance)` → úrok, istina (D-085);
  - `rentalFlow(rent, payment)` → zmena K_cash, alebo doplatok z K_cash (D-081, D-058);
  - `taxScenario(state, regimes)` → samostatný výstup (D-083).
- **Schválené (D-092):** nehnuteľnosť je tretí typ kapitálu v K. Vzorec FR-02 (`monthsToTargetSplit`) sa upraví v dokumente a overí golden cases pred kódom.

### 12.3 Zdroj štatistiky (ročný odhad)
- Adaptér `ValuationSource` s rozhraním `getIndex(series, period)`. Zdroj: Eurostat, indexy cien nehnuteľností (D-091). Konkrétny dataset a metóda sa overia pred implementáciou.
- Dáta sa stiahnu raz ročne a uložia lokálne. Aplikácia funguje offline s poslednou uloženou hodnotou.
- **Súkromie:** požiadavka obsahuje len názov série a obdobie, nikdy údaje používateľa. Žiadny účet ani identifikátor.

### 12.4 Testy
- Golden cases pre nehnuteľnosť s hypotékou a pre tok nájmu (doplatok, plus, po splatení).
- Golden cases pre daňový scenár: stav „neoverené“ sa zobrazí len ako odhad.
- Migračný test: import z v1 bez straty.
- Test, že daňový scenár nemení hlavný výstup.

### 12.5 Riziká a brány
| Riziko | Opatrenie |
|---|---|
| Chybný daňový parameter | stav „neoverené“, zdroj a dátum, právne posúdenie pred spustením |
| Zmena vzorca FR-02 | najprv rozhodnutie a golden cases, potom kód |
| Výpadok štatistického zdroja | lokálna posledná hodnota, zobrazenie dátumu odhadu |
| Únik citlivých údajov | lokálne uloženie, zákonné kritériá (D-090), bezpečnostný audit |
