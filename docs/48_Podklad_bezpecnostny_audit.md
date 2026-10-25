# 48 – Podklad pre bezpečnostný audit (brána G4)

> Stav: pripravené 2026-10-25 (D-297) pre externého audítora. Pripravil autor kódu; nie je to audit, len opis, čo a kde kontrolovať. Výsledná správa audítora sa ukladá mimo repozitára, do `decisions/Decisions.md` ide len zhrnutie (`docs/06`, G4).

## 1. Čo appka je

- Progresívna webová aplikácia (React 19, TypeScript, Vite), bez servera a bez účtov (D-009, D-148).
- Všetky údaje sú v prehliadači zariadenia (IndexedDB). Appka ich nikam neposiela.
- Dve nasadenia:
  - **verejná verzia:** GitHub Pages z vetvy `main`, bez Fázy 2 (`.github/workflows/pages.yml`, `VITE_PHASE2 "0"`, D-248);
  - **súkromný náhľad pre testerov:** Cloudflare Pages z vetvy `claude/phase2-property-card`, s Fázou 2, za heslom (`.github/workflows/preview-phase2.yml`, `preview/_worker.js`, D-270 až D-273).

## 2. Údaje

| Údaj | Kde | Citlivosť |
| --- | --- | --- |
| Transakcie, vyhodnotenia, nastavenia, rozpočet, pravidelné výdavky, majetok, záväzky, investície, sklad | IndexedDB (`src/storage/indexeddb.ts`, typy `src/storage/types.ts`) | finančné údaje používateľa |
| Prílohy (fotky dokladov) | IndexedDB (`src/storage/attachments.ts`) | môžu obsahovať osobné údaje |
| Čísla dokladov z QR kódu | IndexedDB, nezobrazujú sa (D-133) | identifikátor dokladu |
| PIN | `src/features/zamok/pin.ts` | prístupová brána, nie šifrovanie (D-119) |
| Výber modulov, preskočenie sprievodcu | localStorage | nízka |
| Záloha | súbor JSON, voliteľne šifrovaný (`src/storage/backup.ts`, `backupCrypto.ts`, D-276) | všetky údaje |

Údaje v zariadení nie sú šifrované; ochranu dáva zámok zariadenia a PIN appky. Zakladateľ to prijal pri uzavretí G3 (D-297).

## 3. Oblasti na kontrolu

1. **Sieťová izolácia (FR-16, D-009).**
   - CSP v `index.html`: `connect-src 'self'`, `script-src 'self' 'wasm-unsafe-eval'` (pre OCR), `object-src 'none'`.
   - Testy: `tests/csp.test.ts`, `tests/e2e/privacy-network.spec.ts` (žiadna sekcia, skener, OCR ani import nepošle požiadavku mimo vlastného pôvodu), `tests/e2e/offline.spec.ts`.
   - OCR (`tesseract.js`) a jazykové dáta sa načítajú z vlastného pôvodu (`src/features/sklad/ocr.ts`).
   - Odkazy von, ktoré otvára používateľ (nie požiadavky appky): formulár pripomienok (`src/features/spatna-vazba/feedback.ts`), overenie dokladu na portáli finančnej správy (`src/domain/receipt.ts`), `mailto:` pri týždennom súhrne (D-277). Overiť, že žiadny z nich neprenáša údaje z appky v adrese okrem toho, čo používateľ vidí a potvrdí.
2. **Import zálohy a súborov.** Validácia `src/storage/validate.ts`, `backup.ts`; limit 100 MB (D-132); import listu vlastníctva (HTML/PDF, Fáza 2); súbor od integračnej služby (`src/storage/feed.ts`). Hľadať: obídenie validácie, prototype pollution, nadmerná pamäť, HTML v texte, ktorý sa vykreslí.
3. **Šifrovaná záloha (D-276).** `src/storage/backupCrypto.ts`: PBKDF2-SHA256 600 000 iterácií, soľ 16 B a IV 12 B náhodne pri každom exporte, AES-GCM-256 s AAD, rozsah iterácií pri importe 100 000 až 2 000 000. Externá revízia 2026-10-25 nenašla chybu; audítor overí nezávisle.
4. **PIN (D-119, D-135, D-203).** `src/features/zamok/pin.ts`, `pinLimit.ts`, `Lock.tsx`: uloženie PIN-u, obmedzenie pokusov, obnova vymazaním dát.
5. **Súkromný náhľad (D-271 až D-273).** `preview/_worker.js`: prihlásenie heslom, cookie podpísaná HMAC-SHA256, HttpOnly, Secure, SameSite=Lax, 30 dní; bez hesla odpoveď 503. **Známe obmedzenie:** bez limitu pokusov o heslo (revízia 2026-10-25, S-7); zakladateľ mení heslo na dlhé náhodné (D-296).
6. **Závislosti.** `package.json` a `package-lock.json`; `npm audit` (2026-10-25: 0 zraniteľností). Údržba podľa `docs/47` (D-297).
7. **Nasadenie.** GitHub Actions s tajomstvami pre Cloudflare (`CLOUDFLARE_API_TOKEN` a pod. v nastaveniach repozitára, nie v kóde); heslo náhľadu je Cloudflare secret `PREVIEW_PASSWORD`.
8. **Service worker a cache (PWA).** Čo sa ukladá do cache, či sa pri odhlásení z náhľadu neukazuje obsah z cache.

## 4. Mimo rozsah

- Právne posúdenie (G1, `docs/Podklad_pravne_posudenie.md`).
- Bezpečnosť zariadenia používateľa (zámok, zálohy mimo appky).
- Infraštruktúra GitHubu a Cloudflare samotná.

## 5. Ako spustiť

```
git checkout claude/phase2-property-card
npm ci
npx tsc --noEmit
npm test
npx playwright test
npm audit
```

## 6. Čo chceme ako výstup

Nálezy so závažnosťou, miestom, dôsledkom a návrhom. Pri každom: oprava pred spustením Fázy 2 pre používateľov, alebo prijateľné riziko na rozhodnutie zakladateľa.
