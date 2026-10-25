# 47 – Návrh: údržba (C3, C4) a brány G1 až G5

> Stav: **rozhodnuté** (2026-10-25, D-297): 1 áno, 2 odložiť, 3 A, 4 A, 5 áno, 6 áno. Vykonanie je v D-297; podklady `docs/48` (G4) a `docs/49` (G5). Vychádza z `docs/43` (C3, C4, D4) a `docs/06` (tabuľka brán G1 až G5).

## 1. Zhrnutie

| Bod | Čo to je | Kto | Odporúčanie |
| --- | --- | --- | --- |
| C3 | Aktualizácia knižníc a akcií GitHubu | autor | Urobiť teraz, malé kroky |
| C4 | Moduly pri preskočení sprievodcu | autor | **Odložiť** po pilot (konflikt s D-163 a s testermi) |
| G1 | Právne posúdenie | zakladateľ, právnik | Poslať podklad právnikovi |
| G2 | Monetizácia | zakladateľ | Rozhodnúť „zatiaľ zadarmo, bez reklám“ |
| G3 | Účty a šifrovanie | zakladateľ | Uzavrieť rozhodnutím o šifrovaní údajov v zariadení |
| G4 | Bezpečnostný audit | zakladateľ, auditor | Najprv interná kontrola, potom externý audítor |
| G5 | Overenie person rozhovormi | zakladateľ | Spojiť s pilotom a testermi |

Brány G1 až G5 platia pre **spustenie Fázy 2 pre používateľov**, nie pre zlúčenie do `main` (D-094, D-248). Pilot a súkromný náhľad ich nevyžadujú.

**Nesúlad v dokumentoch:** `docs/06` stále uvádza „Do `main` sa nemerguje, kým nie sú splnené G1–G4“. To zrušilo D-248 (zlúčenie povolené, verejná zostava bez Fázy 2). Navrhujem vetu v `docs/06` opraviť odkazom na D-248.

## 2. C3: údržba závislostí

Stav podľa `npm outdated` (2026-10-25):

| Balík | Teraz | Najnovšia | Druh | Riziko |
| --- | --- | --- | --- | --- |
| `@playwright/test` | 1.56.0 | 1.64.1 | len vývoj (testy) | stredné: nová verzia potrebuje iný prehliadač; v cloudových sessions je nainštalovaný prehliadač pre konkrétnu verziu |
| `idb` | 8.0.0 | 8.0.4 | appka (úložisko) | nízke: opravné verzie |
| `fake-indexeddb` | 6.0.0 | 6.2.6 | len testy | nízke |
| `@zxing/library` | 0.23.0 | 0.21.3 (podľa npm) | appka (skener) | treba vysvetliť: registry hlási ako „najnovšiu“ nižšiu verziu, než máme. Nemeniť, kým sa nezistí prečo. |

**Akcie GitHubu:** `actions/checkout@v4` a `actions/setup-node@v4` bežia na Node 20, ktorý GitHub prestáva podporovať (upozornenie v behoch). Samotná zostava už používa Node 22. Riešenie: prejsť na novšie verzie akcií. Overí sa až behom na GitHube.

**Návrh postupu (každý krok samostatný commit, po každom `tsc`, `vitest` a celé Playwright):**
1. `idb` a `fake-indexeddb` na najnovšie opravné verzie.
2. Akcie GitHubu na verziu bez Node 20; overiť beh náhľadu.
3. Playwright: najprv overiť, či sa dá v prostredí spustiť nová verzia. Ak nie, ostať na 1.56 a zapísať prečo.
4. `@zxing/library`: len zistiť a zapísať príčinu, nič nemeniť.

Bez `npm audit fix` a bez zmeny `package-lock.json` naslepo. Zmena knižníc v appke (`idb`) je zmena kódu počas pilota; výpočty nemení, zapíše sa do `docs/pilot/zmeny-pocas-pilota.md`.

## 3. C4: predvolené moduly pri preskočení sprievodcu

Návrh z `docs/43`: na novom zariadení bez dát zapnúť len jadro, nie všetky moduly.

**Konflikty:**
- **D-163:** ak výber modulov nebol uložený, sú zapnuté všetky voliteľné moduly. C4 by D-163 menilo a potrebovalo by nové rozhodnutie.
- **Testeri:** návod (`docs/41`) ráta s tým, že po nahratí testovacej zálohy vidia Majetok, Investície, Dane a ďalšie sekcie. Na novom zariadení tester najprv preskočí sprievodcu, potom nahrá zálohu. S C4 by tieto sekcie nevidel a väčšina úloh z návodu by nešla.
- **Verejná verzia:** Fáza 2 je v nej skrytá (D-248), takže C4 by sa tam neprejavilo. Týkalo by sa len náhľadu, teda práve testerov.

**Odporúčanie:** C4 teraz nerobiť. Vrátiť sa k nemu pred spustením Fázy 2 pre používateľov, keď budú známe výsledky pilota (či testeri moduly menia, či ich je priveľa).

## 4. Brány G1 až G5

### G1: právne posúdenie

- **Čo treba:** písomné posúdenie právnika (MiFID II, GDPR, spotrebiteľské právo, predvolené hodnoty). Uložené mimo repozitára, v `Decisions.md` len zhrnutie.
- **Čo existuje:** `docs/Podklad_pravne_posudenie.md` s rizikami a otázkami (naposledy doplnená otázka 8, D-281).
- **Ďalší krok:** zakladateľ vyberie právnika a pošle mu podklad. Autor môže pred odoslaním podklad zaktualizovať o zmeny od 2026-10-24 (D-290 až D-294; nič z toho nemení právne riziká, len texty a usporiadanie).
- **Kto:** zakladateľ. Autor právne posúdenie nerobí.

### G2: monetizácia

- **Čo treba:** rozhodnutie v `Decisions.md`. Otvorený bod z `docs/00`.
- **Možnosti:**
  - **A. Zatiaľ zadarmo, bez reklám a bez zberu údajov** (odporúčam pre pilot a prvé spustenie). Zodpovedá D-009 (appka nič neodosiela) a nemení právne riziká.
  - **B. Jednorazový nákup alebo dobrovoľný príspevok.** Vyžaduje platobnú cestu mimo appky a otázku pre právnika (G1, spotrebiteľské právo).
  - **C. Predplatné.** Zmysel má až s funkciami, ktoré stoja peniaze (napr. synchronizácia), a tie sú mimo plánu (D-148).
- Reklamy a predaj údajov odporúčam vylúčiť výslovne: odporujú D-009 a dôvere pri financiách.
- **Kto:** zakladateľ.

### G3: účty, synchronizácia a šifrovanie

- **Čo je už rozhodnuté:** účty a synchronizácia nebudú, appka ostáva lokálna (D-148, možnosť A). Záloha sa dá zašifrovať heslom (D-276). PIN je len prístupová brána, nie šifrovanie (D-119).
- **Čo ostáva:** údaje uložené v zariadení (IndexedDB) nie sú zašifrované. Ochranu dáva zámok telefónu a PIN appky. Upozornenie na skúšobnú verziu to hovorí (D-144).
- **Možnosti:**
  - **A. Uzavrieť G3 tak, ako je:** bez účtov, šifrovaná záloha, údaje v zariadení chránené zámkom telefónu. Rozhodnutie zapísať a uviesť obmedzenie v upozornení a v podklade pre právnika (odporúčam).
  - **B. Šifrovať údaje v zariadení heslom.** Veľká zmena: heslo pri každom otvorení, strata hesla znamená stratu údajov, nové testy a migrácia. Odporúčam len ak to bude žiadať právnik (G1) alebo audit (G4).
- **Kto:** zakladateľ.

### G4: bezpečnostný audit

- **Čo treba:** správa z auditu uložená mimo repozitára; nálezy opravené alebo prijaté rozhodnutím.
- **Čo existuje:** interné audity `docs/22`, `docs/24`, `docs/27` (nie sú bezpečnostný audit nezávislou osobou), CSP (D-203), test, že appka neodosiela údaje.
- **Návrh:**
  1. Autor pripraví podklad pre audítora: čo appka ukladá, kde, čo posiela (nič), CSP, šifrovanie zálohy (D-276), súkromný náhľad (`preview/_worker.js`, D-273: bez limitu pokusov o heslo).
  2. Pred externým auditom interná bezpečnostná kontrola v samostatnej session, ako pri revízii.
  3. Externý audítor podľa výberu zakladateľa.
- **Kto:** zakladateľ vyberá audítora; autor pripraví podklad.

### G5: overenie person rozhovormi

- **Čo treba:** zápisy alebo zhrnutie rozhovorov s cieľovou skupinou v `docs/`.
- **Návrh:** spojiť s pilotom. Testeri dostávajú pozvánky (`docs/pilot/pozvanky-testerov.md`); s 3 až 5 z nich, najmä z verzie C (produktívny vek, hlavná cieľová skupina), urobiť krátky rozhovor (15 minút) podľa pripraveného scenára. Autor pripraví scenár otázok z `docs/01` (persony) a `docs/07` oddiel 10.
- Zhrnutie sa ukladá **anonymizované**, bez mien a bez finančných údajov (CLAUDE.md, `docs/pilot/README.md`).
- **Kto:** rozhovory vedie zakladateľ; autor pripraví scenár a šablónu zhrnutia.

## 5. Odporúčané poradie

1. **Teraz (autor):** C3 kroky 1 a 2; oprava vety v `docs/06` (D-248).
2. **Teraz (zakladateľ):** rozhodnúť G2 a G3 (stačí odpovedať na otázky nižšie).
3. **Počas pilota:** G5 (scenár rozhovoru pripraví autor), podklad pre G4.
4. **Pred spustením Fázy 2 pre používateľov:** G1 a G4 externe; C4 podľa výsledkov pilota.

## 6. Otázky na rozhodnutie

1. C3: súhlasíš s postupom v oddiele 2 (malé kroky, Playwright len ak pôjde v prostredí)?
2. C4: odložiť po pilot (odporúčam), alebo urobiť teraz?
3. G2: **A – zatiaľ zadarmo, bez reklám a bez zberu údajov (odporúčam)**, B, alebo C?
4. G3: **A – uzavrieť bez šifrovania údajov v zariadení (odporúčam)**, alebo B?
5. G4 a G5: mám pripraviť podklad pre audítora a scenár rozhovorov?
6. `docs/06`: opraviť vetu o zlúčení podľa D-248?
