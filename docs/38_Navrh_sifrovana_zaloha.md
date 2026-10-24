# 38 – Návrh: šifrovaná záloha (N-05)

> Stav: **implementované** (D-276, commit `1513c67`). Schválené zakladateľom 2026-10-24 („začnime na N-05“). Zrušuje odloženie z D-096 pre heslo na export; ochrana dát v zariadení (D-026) zostáva.

## 1. Účel

Záloha obsahuje finančné údaje a čísla dokladov. Voliteľné heslo chráni exportný súbor, ak sa dostane mimo zariadenie (cloud, e-mail, zdieľanie).

## 2. Rozhodnutia

- **Voliteľné:** bez hesla sa exportuje bežný JSON, ako doteraz.
- **Heslo:** aspoň 8 znakov. Nedá sa obnoviť; bez neho sa záloha neotvorí.
- **Kľúč:** PBKDF2-SHA256, 600 000 iterácií (odporúčanie OWASP), 16-bajtová soľ.
- **Šifrovanie:** AES-GCM-256, 12-bajtový nonce, pevné údaje naviazané na formát (AAD), takže zmena formátu alebo parametrov sa odhalí.
- **Import:** počet iterácií v súbore musí byť v rozsahu 100 000 až 2 000 000, inak sa súbor odmietne skôr, než sa odvodí kľúč.
- **Názov súboru:** pri zašifrovanom exporte má príponu `-sifrovana.json`.
- **Bez servera:** všetko beží cez Web Crypto v prehliadači (D-009).

## 3. Obmedzenia (pre zakladateľa)

- Heslo chráni súbor, nie zariadenie. Kto má súbor a slabé heslo, môže ho skúšať offline bez limitu pokusov. Preto odporúčam dlhé heslo.
- Staršie verzie appky zašifrovanú zálohu neotvoria.
- Zašifrovaný súbor ostáva citlivý aj s heslom. Neukladaj ho do verejných priečinkov.

## 4. Mimo rozsahu

- Šifrovanie dát v zariadení (D-026).
- Zmena hesla existujúcej zálohy (stačí nový export).
