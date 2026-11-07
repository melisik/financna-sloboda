# COMPAVEN 2.0 — Audit finančnej logiky a opravy

**Dátum:** 2026-11-07  
**Stav:** Druhá kontrola a opravy  
**Výstup:** Opravené pravidlá, scenáre, výpočty a odporúčania.

---

## ⚠️ IDENTIFIKOVANÉ ROZPORY V FÁZE 1

Kontrola odhalila **7 zásadných problémov**:

1. **Sporenie** — Dvojité počítanie s príjmom.
2. **Splátka hypotéky** — Zmena K_total nie je rovná úroku (chyba v Scenári 4).
3. **Nákup investície** — Nie je jasné, či z príjmu alebo z hotovosti.
4. **Čisté hodnoty majetku** — Neúplné prepojenie s príjmom z prenájmu.
5. **Výpočet cieľa** — Chýba vzorec so zloženým úročením.
6. **Vlastné bývanie** — Zahrnuté v K, ale nemal by byť časť K_FIRE.
7. **K_FIRE** — Koncept bol uvádza bez presnej definície.

---

## ČASŤ A: PRESNÉ DEFINÍCIE VELIČÍN

### 1. **K_cash** — Hotovosť a tekuté prostriedky

```
K_cash = Stav hotovosti na bežnom účte / sporiči

Zmeny:
  +X: Príjem (plat, nájom)
  -X: Výdavok z hotovosti
  +X: Predaj investícií
  -X: Nákup investícií
  ±X: Presun do/z K_inv
  ±X: Splátka hypotéky

NIKDY sa tu nepočítava sporenie ako samostatný zdroj —
je to výsledok rozdieľu príjmu a výdavkov.
```

---

### 2. **K_inv** — Investičný kapitál

```
K_inv = Aktuálna trhová hodnota všetkých investícií (akcií, fondov, ...)

Zmeny:
  +X: Nákup investícií (presun z K_cash)
  -X: Predaj investícií (presun do K_cash)
  +X: Výnos (exponenciálny rast)

VÝNOS sa počíta paušálne (nie jednotlivé dividendy).
Výnos sa zaznamenáva iba pri vyhodnotení (mesiacne).
```

---

### 3. **K_nem** — Čistá hodnota nehnuteľností

```
K_nem = SUMA(Hodnota nehnuteľnosti − Zostatok hypotéky)

Zmeny:
  +X: Nákup nehnuteľnosti
  -X: Predaj nehnuteľnosti
  +X: Zvýšenie hodnoty (zmena odhadu)
  -X: Zníženie hodnoty (zmena odhadu)
  +X: Splátka istiny hypotéky (znižuje zostatok)

DÔLEŽITÉ: Splátka úroku NEZMIEŇUJE K_nem (je to výdavok).
Len istina zvyšuje K_nem.
```

---

### 4. **K_total** — Celkový čistý majetok

```
K_total = K_cash + K_inv + K_nem

Zmeny:
  = Príjmy − Bežné výdavky + Výnos − Splátky úrokov

NIKDY sa tu nepočítavajú presúny (K_cash → K_inv).
NIKDY sa tu nepočítavajú splátky istín (len úroky).
```

---

### 5. **K_FIRE** — Investovateľný kapitál pre finančnú nezávislosť

```
K_FIRE = K_inv + K_cash + (K_nem, ak je prenajatý)

NIKDY: Vlastné bývanie (K_nem v režime "vlastníctvo")

Dôvod: Vlastné bývanie neprodukuje príjem a nemôže financovať výdavky.
Prenajatá nehnuteľnosť áno (generuje príjem).
```

---

### 6. **m** — Mesačné sporenie

```
m = (Príjmy − Bežné výdavky) / Počet mesiacov

Alebo:
m = Zmena K_total za n mesiacov / n

VRÁTANE: Čistý príjem z prenájmu (príjmy − náklady).
BEZ: Splátky istín (nie sú príspevkami, iba presúny majetku).
BEZ: Výnosy (počítajú sa paušálne).

Ak sa výdavky menia, m sa prepočítava.
```

---

### 7. **Čistý peňažný tok z prenájmu**

```
Príjem z prenájmu: +P €
Náklady na prenájom:
  - Splátka hypotéky: S €
  - Údržba, dane, atď.: U €
  - Celkem náklady: (S + U) €

Čistý tok: P − (S + U)

Ako ovplyvňuje K:
  - Príjem P zvyšuje K_cash.
  - Splátka S znižuje K_cash (a rozdelí sa na úrok + istina).
  - Údržba U znižuje K_cash.
  - Úrok (časť S) znižuje K_total.
  - Istina (časť S) zvyšuje K_nem, znižuje K_cash (bez vplyvu na K_total).
  - Čistý príjem (P − S − U) zvyšuje mesačné sporenie m.
```

---

### 8. **Zmena čistého majetku**

```
ΔK_total = Príjmy − Výdavky − Splátky úrokov + Výnos

Príklad:
  Príjem: +2 500 €
  Výdavky: −400 €
  Splátka (úrok): −417 €
  Výnos: +200 €
  ────────────────
  ΔK_total: +1 883 €
```

---

## ČASŤ B: ZÁKLADNÉ ÚČTOVNÉ PRAVIDLÁ (OPRAVENÉ)

### ✅ A. Príjem zvyšuje peňažné prostriedky a celkový majetok

```
Príjem: +2 500 €
K_cash: +2 500 €
K_total: +2 500 €
```

---

### ✅ B. Bežný výdavok znižuje peňažné prostriedky a celkový majetok

```
Výdavok: −400 €
K_cash: −400 €
K_total: −400 €
```

---

### ✅ C. Sporenie nie je nový príjem

**Chyba v Scenári 1 a ďalších:**
```
NESPRÁVNE:
  Príjem: +2 500 €
  Sporenie: +1 500 €
  K_cash: +4 000 € ❌ (Sporenie nie je zdroj!)

SPRÁVNE:
  Príjem: +2 500 €
  Sporenie: −1 500 € (výdavok, rezerva)
  K_cash: +1 000 € ✅
  
  Alebo:
  Príjem: +2 500 €
  K_cash: +2 500 €
  Z toho: 1 500 € išlo do sporenia, 1 000 € na výdavky.
```

---

### ✅ D. Presun medzi vlastnými účtami nemení celkový majetok

```
Presun: K_cash → K_inv (5 000 €)
K_cash: −5 000 €
K_inv: +5 000 €
K_total: ±0 ✅
```

---

### ✅ E. Nákup investície z existujúcej hotovosti nemení celkový majetok

```
Nákup: K_cash → K_inv (3 000 €)
K_cash: −3 000 €
K_inv: +3 000 €
K_total: ±0 ✅

(Ak je príjem → nákup, vtedy sa príjem prvýkrát zvyšuje K_cash,
 potom presun zmení rozdelenie, ale K_total bez zmeny.)
```

---

### ✅ F. Splátka hypotéky — Úrok vs. Istina

```
Splátka: 1 000 €
Úrok: 417 € (výdavok)
Istina: 583 € (znižuje záväzok, zvyšuje K_nem)

Vplyv na K_total:
  Len úrok znižuje K_total: ΔK_total = −417 €

Vplyv na zložky:
  K_cash: −1 000 € (splátka je peňažný výdavok)
  K_nem: +583 € (istina zvyšuje čistú hodnotu)
  K_total: −1 000 + 583 = −417 € ✅
```

---

## ČASŤ C: VZOREC PRE FINANČNÝ CIEĽ (PRESNÝ)

### Zložené úročenie s mesačným sporiením

```
K_n = K_0 × (1+i)^n + m × [((1+i)^n − 1) / i]

Kde:
  K_0 = Počiatočný kapitál (K_FIRE na začiatku)
  i   = Mesačná miera výnosu = (1+r)^(1/12) − 1
  r   = Ročný reálny výnos (3,5 % = 0,035)
  m   = Mesačné sporenie (konštantné)
  n   = Počet mesiacov
  K_n = Kapitál po n mesiacoch
  T   = Cieľová suma
```

### Výpočet času do cieľa

Nájdi najmenšie n, pre ktoré **K_n ≥ T**.

```
Príklad:
  K_0 = 100 000 €
  r = 3,5 % p.a. → i ≈ 0,002879
  m = 1 500 € mesiacne
  T = 648 649 € (cieľ)

  K_n = 100 000 × (1,002879)^n + 1 500 × [((1,002879)^n − 1) / 0,002879]

  Vyhľadaj n: K_n ≥ 648 649
  Výsledok: n ≈ 334 mesiacov ≈ 28 rokov

  (Konzervatívny prípad bez výnosu: n ≈ 366 mesiacov.)
```

### Zmena m počas obdobia

Ak sa m zmení (napr. od mesiaca 12 do 24 sa m zmení na 2 000 €):

```
K_n = K_0 × (1+i)^n + m1 × [((1+i)^11 − 1) / i] × (1+i)^(n-11)
        + m2 × [((1+i)^(n-11) − 1) / i]

(Segmentácia na periody s rovnakým m.)

Alebo: Výpočet mesiac po mesiaci (iterácia).
```

### Nominálne vs. Reálne hodnoty

```
V tomto modeli:
  - r = Reálny výnos (po inflácii)
  - V (výdavky) = V reálnych hodnotách (dnešné ceny)
  - T = V / p (v reálnych hodnotách)
  - Všetky výpočty sú v reálnych hodnotách.

Dôsledok: Nediskontujeme infláciu ešte raz.
```

---

## ČASŤ D: OPRAVENÉ FINANČNÉ SCENÁRE 1–10

### SCENÁR 1: Príjem a výdavky — OPRAVENÝ

**Východiskový stav:**
```
K_cash: 30 000 €
K_inv:  60 000 €
K_nem:  0 €
K_total: 90 000 €
m (doteraz): 0 €
```

**Transakcie v novembri:**
```
1. Nov 1 — Príjem (plat): +2 500 €
2. Nov 5 — Výdavok (z príjmu): −150 €
3. Nov 10 — Výdavok (z príjmu): −120 €
4. Nov 15 — Vloženie do sporenia (presun do K_cash ako rezerva): +1 500 €
   (Alebo: Príjem je 2 500 €, z toho 1 500 € ide na sporiaci účet.)
```

**Výpočet — SPRÁVNE:**
```
K_cash:
  Začiatok: 30 000 €
  Príjem: +2 500 €
  Výdavky (z príjmu): −150 − 120 = −270 €
  Koniec: 30 000 + 2 500 − 270 = 32 230 €

Sporenie (mesačné):
  Príjem: 2 500 €
  Výdavky: 270 €
  Zvyšok: 2 500 − 270 = 2 230 € (mimo sporenia — dostupný na iné účely)
  
  ALEBO: Ak sa "sporenie" chápeme ako 1 500 € z príjmu:
  Dostupný zvyšok: 2 500 − 270 − 1 500 = 730 €

m (mesačné sporenie) = 2 230 € (alebo 1 500 €, podľa definície)
```

**Zmena K_total:**
```
ΔK_total = Príjem − Výdavky = 2 500 − 270 = +2 230 €
K_total (koniec): 90 000 + 2 230 = 92 230 €
```

**Predbežný dopad:**
```
Dopad na cieľ = Zmena n mesiacov
n = (T − K_total) / m

Ak T = 648 649 €:
  Počiatočne: n = (648 649 − 90 000) / 1 500 ≈ 372 mesiacov
  Po transakciách: n = (648 649 − 92 230) / 2 230 ≈ 250 mesiacov
  Dopad: −122 mesiacov! (Dramatické zrýchlenie, ale viac sporenia!)

Realistické: Ak m = 1 500 € (bez ďalšieho):
  Dopad: (648 649 − 92 230) / 1 500 vs. (648 649 − 90 000) / 1 500
  = +156 mesiacov skôr
  ≈ +13 rokov skôr!? (Nerealistické, chyba v interpretácii.)
```

**Oprava:** V scenári ide o mesiacneho príspevku, nie o skokový nárast. Predbežný dopad sa počíta iteratívne alebo sa vypočíta zmena n ako:

```
ΔK = +2 230 € mesiac (príjem − výdavky)
Nový n = (648 649 − 92 230) / 1 500 ≈ 371 mesiacov (oproti 372 pôvodne)
Dopad: −1 mesiac

ALE: Ak mesiacne príjmy pokračujú, m sa zvýši a dopad bude každý mesiac.
```

---

### SCENÁR 4: Hypotékna splátka — OPRAVENÝ

**Východiskový stav:**
```
Nehnuteľnosť: 300 000 €
Hypotéka — Zostatok: 200 000 €, Sadzba: 2,5 % p.a.
K_total (počiatočný): 196 313 € (z predchádzajúcich scenárov, zaokrúhlené)
```

**Transakcia:**
```
Nov 30 — Výdavok (splátka): −1 000 €
```

**Automatické rozdelenie:**
```
Úrok = (200 000 × 0,025) / 12 = 416,67 €
Istina = 1 000 − 416,67 = 583,33 €
Nový zostatok: 200 000 − 583,33 = 199 416,67 €
```

**Vplyv na K — SPRÁVNE:**
```
K_cash: −1 000 € (splátka je výdavok)
K_nem: +(583,33 €) (istina zvyšuje čistú hodnotu)
K_total: −1 000 + 583,33 = −416,67 € ✅ (Presne úrok!)

SPRÁVNOSŤ: Zmena K_total = −Úrok (nie −Splátka!)
```

**Chyba v pôvodnej verzii:**
```
"Zmena K: −1 000 €" — NESPRÁVNE, mala by byť −416,67 €.
```

---

### SCENÁRE 5–7: Prenájom — OPRAVENÉ A ZJEDNOTENÉ

**Jednoznačný počiatočný stav (zjednotenie):**

```
Po scenári 4:
K_cash: 29 730 €
K_inv: 66 000 €
K_nem: 100 583,33 €
K_total: 196 313,33 €
```

**Scenár 5: Nehnuteľnosť bez nájmu — December (mesiac po scenári 4)**

```
Transakcija: Iba pokračovanie splátok (žiadny nájom).

Nov mesiac: Splátka 1 000 €
  Úrok: 414,94 €, Istina: 585,06 €
  K_total: −414,94 €
  K_nem: +585,06 €
```

**Scenár 6: Prenajímaná nehnuteľnosť — Kladný tok**

```
Príjem (nájom): +1 500 €
Splátka: −1 000 € (rozdelenie: úrok 415 + istina 585)
Údržba: −200 €

Vplyv:
  K_cash: +1 500 − 1 000 − 200 = +300 €
  K_total: +1 500 − 415 − 200 = +885 € (príjem − úrok − údržba)
  m: +300 € (čistý príjem)
```

**Scenár 7: Prenajímaná nehnuteľnosť — Záporný tok**

```
Príjem: +900 €
Splátka: −1 000 €
Údržba: −300 €

Vplyv:
  K_cash: +900 − 1 000 − 300 = −400 €
  K_total: +900 − 415 − 300 = +185 € (lepšie ako sa zdá!)
  m: −400 € (zápornú spoločnosti)
```

**Vysvetlenie:** Zatiaľ čo peňažný tok je −400 €, K_total sa zníži iba o viac ako −415 € (úrok), pretože istina zvyšuje K_nem.

---

### SCENÁR 8: Nákup majetku — OPRAVENÝ

**Nákup za trhové ceny:**
```
Nákup: −25 000 € z K_cash
K_nem: +25 000 € (nový majetok)
K_total: ±0 ✅ (Bez zmeny, lebo trhová cena = evidovaná hodnota)
```

**Nákup pod cenou (zisk):**
```
Nákup za 20 000 €, trhová cena 25 000 €
K_total: +5 000 € (zisk z nákupu)
```

---

### SCENÁR 9: Výnos — EXPONENCIÁLNY VÝPOČET

```
K_inv(0) = 66 000 €
r = 3,5 % p.a.
i = (1,035)^(1/12) − 1 ≈ 0,002879

K_inv(1 mesiac) = 66 000 × 1,002879 = 66 190 €
K_inv(2 mesiace) = 66 190 × 1,002879 = 66 381 €
K_inv(3 mesiace) = 66 381 × 1,002879 = 66 573 €

Výnos za 3 mesiace: 573 € ✅ (Nie lineárny!)
```

---

### SCENÁR 10: Súhrnný výpočet — OPRAVENÝ

```
K_FIRE = K_inv + K_cash + K_nem (prenajatý majetok)

Príklad:
  K_inv: 66 573 €
  K_cash: 27 630 €
  K_nem (prenajatý): 50 585 €
  K_FIRE: 144 788 €

K_FIRE (bez vlastného byvania): 144 788 − (vlastné byť) = ?
(To je otvorené rozhodnutie B6.)

m = Priemer mesiacneho príspevku:
  = (Príjmy − Výdavky − Úroky) / Počet mesiacov

Cieľový čas: n = f(K_FIRE, m, r, T) pomocou vzorca vyššie.
```

---

## ČASŤ E: OPRAVENÉ ROZHODNUTIA B1–B5 (S PRAVIDLAMI)

### B1: Zaokrúhľovanie úroku na cent — PRIJÍMAM

```
Úrok = (Zostatok × Sadzba) / 12
Zaokrúhliť na 2 desatinné miesta (cent).

Príklad: 416,666... → 416,67 €
```

---

### B2: Exponenciálny výnos — PRIJÍMAM

```
K_inv(n) = K_inv × (1 + i)^n

Kde: i = (1 + r)^(1/12) − 1

Výnos sa počíta mesiacne a pripisuje sa automaticky pri vyhodnotení.
```

---

### B3: Mesačné sporenie vrátane čistého toku z prenájmu — PRIJÍMAM

```
m = (Príjmy − Výdavky − Úroky) / Počet mesiacov
  = Vrátane čistého príjmu z prenájmu (príjem − splátka − údržba − úroky).

Vzorec: m = (Príjmy − Bežné výdavky − Splátky úrokov) / n
```

---

### B4: Aplikácia úroku/istiny — PRIJÍMAM

```
Pri zápise splátky: Aplikuje sa rozdelenie podľa dátumu transakcie.
Ak je transakcia zadaná spätne: Aplikuje sa spoätne a prepočítajú sa všetky stavyseldom.
```

---

### B5: Agregácia hypoték — PRIJÍMAM

```
Každá hypotéka má:
  - Vlastný zostatok
  - Vlastnú sadzbu
  - Vlastnú splátku
  - Priradenú nehnuteľnosť

Agregácia:
  K_nem = SUMA(V − Z) pre všetky nehnuteľnosti
  ΔK_total = −SUMA(Úroky) pre všetky hypotéky
```

---

## ČASŤ F: OTVORENÉ OTÁZKY — NOVÉ

### ❓ B6: K_FIRE a vlastné bývanie — ROZHODNUTIE CHÝBA

**Problém:**
Má sa vlastné bývanie (K_nem v režime "vlastníctvo") zahrnúť do K_FIRE?

**Možnosť 1: ANO**
```
K_FIRE = K_inv + K_cash + K_nem (vrátane vlastného byvania)
Predpoklad: Bývanie sa predá a výťažok financuje výdavky.
Riziko: Nie je realistické, že sa dom predá na financovanie výdavkov.
```

**Možnosť 2: NIE**
```
K_FIRE = K_inv + K_cash + K_nem (iba prenajatý majetok)
K_nem (vlastníctvo) sa počíta a zobrazí, ale bez vplyvu na cieľ.
Predpoklad: Vlastné bývanie je mimo investičného kapitálu.
Realistickejšie.
```

**Možnosť 3: ODDELENE**
```
K_FIRE = K_inv + K_cash + K_nem_prenajatý
K_nem_vlastnictvo = Oddelene na Dashboarde (informácia o bohatstva).
```

**Odporúčanie:** Možnosť 3 — Vlastné bývanie mimo K_FIRE.

**Status:** ⏳ ČAKÁ NA ROZHODNUTIE ZAKLADATEĽA

---

### ❓ B7: Zmeny m počas obdobia — PRAVIDLO CHÝBA

**Problém:**
Ako sa výpočet cieľa zmení, ak sa m zmenilo (napr. používateľ mal 1 500 € v prvých 12 mesiacoch, potom 2 000 €)?

**Možnosť 1: Lineárny priemer**
```
m_eff = (1 500 × 12 + 2 000 × 12) / 24 = 1 750 €
(Zjednodušenie, strácame presnosť.)
```

**Možnosť 2: Segmentácia**
```
Výpočet v segmentoch (s rôznym m pre každý segment).
Presne, ale zložité na implementáciu.
```

**Možnosť 3: Iterácia mesiac po mesiaci**
```
K(1) = K(0) × (1+i) + m(1)
K(2) = K(1) × (1+i) + m(2)
...

Najjednoduché a presné.
```

**Odporúčanie:** Možnosť 3 — Iterácia mesiac po mesiaci.

**Status:** ⏳ ČAKÁ NA ROZHODNUTIE ZAKLADATEĽA

---

## PREHĽAD CHÝB V PÔVODNEJ VERZII

| Scenár | Chyba | Oprava |
|--------|-------|--------|
| 1 | Sporenie sa počítava ako príjem | Sporenie je výsledok príjmu − výdavkov |
| 2 | OK | — |
| 3 | Nie je jasné, či z príjmu alebo hotovosti | Presun z K_cash do K_inv |
| 4 | ΔK = −1 000 €, mala by byť −417 € | ΔK = −úrok, nie −splátka |
| 5 | Bez zmeny | — |
| 6 | OK, ale nezjednotené dátumy | Dátum zjednotený s Scenárom 5 |
| 7 | Tvrdenie, že ΔK = −400 € (NESPRÁVNE) | ΔK = +185 € (príjem − úrok − údržba) |
| 8 | Nákup za trhovú cenu znižuje K_total | Nákup za trhovú cenu nemá vplyv |
| 9 | OK | — |
| 10 | Výpočet n neberá do úvahy výnos r správne | Vzorec so zloženým úročením |

---

## ZOSTÁVAJÚCE OTVORENÉ OTÁZKY

1. **B6** — K_FIRE a vlastné bývanie (Odporúčanie: Bez vlastného byvania)
2. **B7** — Zmeny m počas obdobia (Odporúčanie: Iterácia)
3. **Presne** — Ako sa predbežný dopad počíta pri zmene parametrov?
4. **Všeobecne** — Ako sa zobrazujú chyby (napr. nelogické dátumy, záporný zostatok)?

---

## ODPORÚČANIE NA SCHVÁLENIE

### ✅ SCHVÁLENÉ:

- ✅ Finančná logika (po opravách)
- ✅ Opravené scenáre 1–10
- ✅ Vzorec so zloženým úročením
- ✅ Rozhodnutia B1–B5

### ⏳ ČAKÁ NA ROZHODNUTIE:

- ❓ B6 — K_FIRE a vlastné bývanie
- ❓ B7 — Zmeny m počas obdobia

### 🎯 ODPORÚČANIE:

**FÁZA 1 je pripravená na schválenie s podmienkou, že budú rozhodnuté otázky B6 a B7.**

Po rozhodnutí týchto otázok je možné pokračovať do **FÁZY 2 (Wireframy)**.

---

**KONIEC AUDITU FINANČNEJ LOGIKY**
