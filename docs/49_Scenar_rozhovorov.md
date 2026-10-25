# 49 – Scenár rozhovorov s testermi (brána G5)

> Stav: pripravené 2026-10-25 (D-297). Rozhovory vedie zakladateľ. Výsledok: anonymizované zhrnutie v `docs/pilot/rozhovory-zhrnutie.md` (vznikne po prvých rozhovoroch).

## 1. Prečo a s kým

- **Brána G5** (`docs/06`): persony EÚ overené rozhovormi s cieľovou skupinou. `docs/07` oddiel 10 počíta s 3 až 5 ľuďmi.
- **Nesúlad:** `docs/01` persony pre Fázu 2 ešte nemá („Zatiaľ nedefinované“). Rozhovory preto slúžia najprv na ich **návrh** a až ďalšie kolo na overenie. Navrhujem: po 3 rozhovoroch autor navrhne 1 až 2 persony do `docs/01`, ďalšie 2 rozhovory ich overia.
- **S kým:** 3 až 5 testerov, hlavne z verzie C pozvánky (produktívny vek, hlavná cieľová skupina). Jeden rozhovor s testerom z verzie A alebo B pomôže zistiť, kde appka nie je zrozumiteľná pre iných.
- **Kedy:** po tom, ako tester appku vyskúšal (aspoň úlohy 1 a 2 z návodu).

## 2. Pravidlá

- 15 minút, osobne, telefonicky alebo videohovorom.
- Na začiatku povedať: rozhovor je o appke, nie o jeho peniazoch. **Nepýtať sa na sumy, zostatky ani účty** a nezapisovať ich, ani keď ich tester povie sám.
- Súhlas so zápisom poznámok. Bez nahrávania, ak to nie je nutné.
- Pýtať sa otvorene, nenavádzať („Čo ste čakali?“, nie „Bolo to jasné, však?“). Nevysvetľovať appku počas rozhovoru; ak tester niečomu nerozumie, je to zistenie.
- Do repozitára len anonymizované zhrnutie: bez mien, bez kontaktov, bez finančných údajov (CLAUDE.md, `docs/pilot/README.md`).

## 3. Scenár

**Úvod (1 minúta)**
> Ďakujem, že ste appku vyskúšali. Chcem sa porozprávať, ako ste ju vnímali. Nie sú správne ani nesprávne odpovede; keď vám niečo nebolo jasné, je to chyba appky. Nebudem sa pýtať na vaše peniaze.

**A. Kontext (3 minúty)** – na persony
1. Ako dnes sledujete svoje výdavky alebo sporenie, ak vôbec? (appka, tabuľka, banka, nič)
2. Premýšľali ste niekedy, kedy by ste mohli prestať pracovať alebo pracovať menej? Čo by ste na to potrebovali vedieť?
3. Čo vás na téme peňazí a sporenia najviac odrádza alebo stresuje?

**B. Prvý dojem (3 minúty)**
4. Keď ste appku otvorili prvýkrát, čo ste si mysleli, že robí?
5. Čo podľa vás znamená „Dátum cieľa“? Prečo sa mení len po vyhodnotení?
6. Bolo niečo, čo vás zmiatlo alebo kde ste nevedeli, kam ťuknúť?

**C. Používanie (4 minúty)**
7. Ako sa vám zapisoval výdavok? Koľko vám to trvalo?
8. Ktorú časť appky by ste používali pravidelne a ktorú nikdy?
9. Blok „Opakované výdavky a dátum cieľa“: ako ste pochopili „o N mesiacov skôr“? Pôsobilo to ako rada, výčitka, alebo informácia?

**D. Dôvera a súkromie (2 minúty)**
10. Zadali by ste do appky skutočné údaje? Čo by vás od toho odradilo alebo presvedčilo?
11. Vadí vám, že údaje sú len v telefóne a treba si robiť zálohu?

**E. Záver (2 minúty)**
12. Keby ste mohli zmeniť jednu vec, ktorá by to bola?
13. Používali by ste appku? Platili by ste za ňu? (len áno, nie, neviem; monetizácia je zatiaľ „zadarmo“, D-297)

## 4. Šablóna zhrnutia (jeden rozhovor)

```
## Rozhovor R-01 (dátum, verzia pozvánky A/B/C)
- Profil (bez identifikácie): vek v pásme (napr. 30–45), sleduje financie: áno/nie/čím
- Pochopil dátum cieľa: áno / čiastočne / nie – citát bez osobných údajov
- Zmätky: obrazovka + jedna veta (zapísať aj do docs/pilot/denik-zmatkov.md)
- Čo by používal / nepoužíval:
- Opakované výdavky (otázka 9): rada / výčitka / informácia
- Dôvera (otázky 10, 11):
- Jedna zmena (otázka 12):
- Používal by / platil by:
```

## 5. Čo z toho vznikne

- Po 3 rozhovoroch: návrh person Fázy 2 do `docs/01` (autor) na schválenie zakladateľom.
- Po 5 rozhovoroch: zhrnutie a záznam splnenia G5 do `decisions/Decisions.md`, ak persony obstoja.
- Zmätky a návrhy zmien idú do bežného procesu (návrh → schválenie); počas pilota platí postup z `docs/17` oddiel 8.
