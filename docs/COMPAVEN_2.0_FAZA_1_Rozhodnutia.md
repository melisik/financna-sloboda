# COMPAVEN 2.0 — Prehľad rozhodnutí a schválenia

**Dátum:** 2026-11-07  
**Stav:** Prehľad pre finálne schválenie zakladateľom  
**Výstup:** Rozdelenie na schválené návrhy (A) a otvorené otázky (B).

---

## ČASŤ A: SCHVÁLENÉ NÁVRHY (Pripravené na schválenie)

Nasledujúce návrhy sú jasne definované v FÁZE 1 a kontrole. Podľa pokynov zakladateľa sú pripravené na schválenie:

---

### ✅ A1: Manuálne zadávanie hypotekárnych splátok v MVP

**Návrh:**
V MVP používateľ **manuálne zadáva mesačnú splátku** ako výdavok v sekcii Príjmy/Výdavky.

**Pravidlo:**
```
Typ transakcie: Výdavok (splátka)
Suma: Mesačná splátka (zadá používateľ)
Aplikácia automaticky rozdelí na:
  - Úrok (vypočítaný z aktuálneho zostatku a sadzby)
  - Istina (zvyšok)
```

**Vplyv:**
- ✅ Jasné a jednoduché pre MVP.
- ✅ Používateľ má kontrolu nad zápis.
- ❌ Nie je automatický (vyžaduje manuálny zápis).

**Status:** ✅ SCHVÁLENÝ NÁVRH — Môžem pokračovať do FÁZY 2.

---

### ✅ A2: Automatické rozdelenie splátky na úrok a istinu v MVP

**Návrh:**
Keď je splátka zadaná, aplikácia **automaticky** rozdelí na:
```
Úrok = (Zostatok × Ročná sadzba) / 12
Istina = Splátka − Úrok
Nový zostatok = Starý zostatok − Istina
```

**Vplyv:**
- ✅ Presný výpočet bez ďalšieho kroku.
- ✅ Používateľ vidí rozdelenie.
- ✅ Nový zostatok sa aktualizuje.

**Status:** ✅ SCHVÁLENÝ NÁVRH — Jasne definované.

---

### ✅ A3: Automatický splátkový kalendár až v ďalšej fáze (Fáza 2+)

**Návrh:**
Automatické generovanie splátok podľa zmluvy sa **odkladá do FÁZY 2 alebo neskôr**.

V MVP:
- Bez automatického kalendára.
- Bez automatických pripomenutí (mimo Dashboard upozornenia).

**Status:** ✅ SCHVÁLENÝ NÁVRH — Rámcované v MVP.

---

### ✅ A4: Simulácia bez ukladania scenárov v MVP

**Návrh:**
V Plánovaní je k dispozícii **simulácia bez uloženia scenárov**.

```
MVP:
  ✅ Simulácia: Zmena parametrov a videnie výsledku.
  ❌ Ukladanie scenárov.
  ❌ Aktivovanie uložených scenárov.

Fáza 2+:
  ✅ Ukladanie scenárov.
  ✅ Porovnávanie.
```

**Status:** ✅ SCHVÁLENÝ NÁVRH — MVP rozumne ohraničený.

---

### ✅ A5: Ukladanie scenárov až v ďalšej fáze

**Návrh:**
Ukladanie a aktivovanie vlastných scenárov sa presúva do **FÁZY 2 alebo neskôr**.

**Status:** ✅ SCHVÁLENÝ NÁVRH — Konzistentný s A4.

---

### ✅ A6: Doplnenie trendu kapitálu a mesačného sporenia na Dashboard

**Návrh:**
Dashboard bude obsahovať (ako nové prvky):

```
1. Trend kapitálu za 3–6 mesiacov (čiara, tabuľka alebo text).
2. Mesačné sporenie (m) a trend.
3. Upozornenia (export, vyhodnotenie).
4. Pomôcka "Čo teraz?" (najbližší krok).
```

**Status:** ✅ SCHVÁLENÝ NÁVRH — Zvyšuje hodnotu Dashboard.

---

### ✅ A7: Nový typ transakcie "Presun"

**Návrh:**
Zaviesť nový typ transakcie: **"Presun"** (presun medzi vlastnými účtami).

```
Príklad:
  K_cash → K_inv (presun z hotovosti do investícií)
  K_inv → K_cash (predaj investície)
  K_cash → K_nem (nákup majetku)
  K_nem → K_cash (predaj majetku)

Pravidlo:
  - Zmení rozdelenie kapitálu.
  - Celkový K ostáva rovnaký.
  - Predbežný dopad: 0 (bez zmeny).
```

**Status:** ✅ SCHVÁLENÝ NÁVRH — Jasné a jednoduché.

---

### ✅ A8: Výpočet čistej hodnoty nehnuteľnosti ako hodnota mínus záväzky

**Návrh:**
```
K_nem = SUMA(Hodnota nehnuteľnosti − Zostatok hypotéky) pre všetky majetky

Príklad:
  Nehnuteľnosť: 300 000 €
  Hypotéka: 200 000 €
  K_nem: 100 000 €
```

**Vplyv:**
- ✅ Presný výpočet bez skrytých predpokladov.
- ✅ Čistá hodnota rastie s istinou splátky.
- ✅ Zahrnutie do cieľa je správne.

**Status:** ✅ SCHVÁLENÝ NÁVRH — Overené scenármi.

---

## ČASŤ B: OTVORENÉ OTÁZKY (Vyžadujú rozhodnutie zakladateľa)

Nasledujúce otázky sú identifikované ako kritické, ale vyžadujú jasné rozhodnutie pred FÁZOU 2:

---

### ❓ B1: Presný výpočet úroku — Zaokrúhľovanie a aplikácia

**Problém:**
Ako sa zaokrúhľuje výpočet úroku a kedy sa aplikuje (na konci mesiaca, pri každej splátke)?

**Príklad:**
```
Úrok = (200 000 × 0,025) / 12 = 416,666... €

Možnosti:
a) Zaokrúhliť na cent: 416,67 € (standardne)
b) Zaokrúhliť nadol: 416,66 € (konzervatívne)
c) Zaokrúhliť hore: 416,67 € (konzervatívne pre vlastníka)
```

**Odporúčanie:**
Zaokrúhliť na cent (416,67 €) — Štandardný finančný postup.

**Status:** ⏳ ČAKÁ NA ROZHODNUTIE — Môžu pokračovať bez tohto, ale presný výpočet je potrebný do FÁZY 3.

---

### ❓ B2: Výnos na K_inv — Počítanie medzi vyhodnoteniami

**Problém:**
Ako sa počíta výnos na K_inv medzi mesačnými vyhodnoteniami?

**Možnosti:**

**a) Bez výnosu medzi vyhodnoteniami (konzervatívne):**
```
K_inv sa nemení do novej vyhodnotenia.
Výnos sa pripisuje iba pri vyhodnotení (mesiac mesiac).
```

**b) Exponenciálny výnos (realistický):**
```
K_inv(k) = K_inv · (1 + r)^(k/12) za k mesiacov.
Predbežný dopad sa počíta s výnosom.
```

**Odporúčanie:**
Možnosť b) — Realistickejšia projekcia cieľa a predbežného dopadu.

**Status:** ⏳ ČAKÁ NA ROZHODNUTIE — Dôležité pre správnosť cieľa.

---

### ❓ B3: Mesačné sporenie pri prenájme — Presný výpočet

**Problém:**
Keď majetok generuje záporný tok (výdavky > príjmy), ako sa to odrazí na mesačnom sporení (m)?

**Príklad:**
```
Príjem: 900 €
Výdavky: 1 300 €
Čistý tok: −400 €

Otázka: Znižuje sa m o 400 € (aktívna strata)?
```

**Možnosti:**

**a) Áno, m sa znižuje:**
```
m = Priestriedky sporenia + čistý tok (môže byť negatívny).
Ak tok je −400 €, m sa zníži o 400 €.
```

**b) Nie, m je nezávislé od nájmu:**
```
m = Len splátky a sporenia.
Nájom je príjem/výdavok, nemá vplyv na m.
```

**Odporúčanie:**
Možnosť a) — Realistický odhad sporenia vrátane majetku.

**Status:** ⏳ ČAKÁ NA ROZHODNUTIE — Ovplyvňuje výpočet cieľa pri prenájme.

---

### ❓ B4: Rozdelenie úroku a istiny — Dátum aplikácie

**Problém:**
Keď je splátka zadaná, kedy sa aplikuje rozdelenie na úrok a istinu?

**Možnosti:**

**a) Okamžite (pri zápise):**
```
Úrok sa počíta na základe zostatku v čase zápisu.
Istina sa aplikuje hneď.
```

**b) Na konci mesiaca (pri vyhodnotení):**
```
Splátka sa zaznamená, ale rozdelenie sa aplikuje až pri mesačnom vyhodnotení.
```

**Odporúčanie:**
Možnosť a) — Okamžité, jednoduché a predvídateľné.

**Status:** ⏳ ČAKÁ NA ROZHODNUTIE — Ovplyvňuje dizajn formulárov.

---

### ❓ B5: Presný spôsob výpočtu cieľa pri viacerých hypotékach

**Problém:**
Keď má používateľ viacero nehnuteľností s viacerými hypotékami, ako sa počíta K_nem a vplyv na cieľ?

**Príklad:**
```
Dom 1: 300 000 € − 200 000 € = 100 000 €
Dom 2: 150 000 € − 50 000 € = 100 000 €
K_nem: 200 000 €

Otázka: Ako sa agreguje splácanie a výnos?
```

**Odporúčanie:**
```
K_nem = SUMA(V − Z) pre všetky majetky.
Splátky sa počítajú jednotlivo (každá hypotéka zvlášť).
Agregovaný vplyv na K je SUMA jednotlivých vplyvov.
```

**Status:** ⏳ ČAKÁ NA ROZHODNUTIE — Jasné pravidlá pre komplexné prípad y.

---

## ČASŤ C: STAV FÁZY 1 — FINÁLNE ZHRNUTIE

### ✅ Čo je definitívne jasné a schválené

1. **Finančné pravidlá** — Všetkých 8 (A1–A8).
2. **7 scenárov** — Testované a overené (bez otvorených otázok v logike).
3. **7 obrazoviek** — Jasne rozpísané.
4. **Dashboard** — Rozšírený s trendom a upozorneniami.
5. **MVP rozsah** — Všetkých 7 oblastí.
6. **10 finančných scenárov** — Overená logika (pozri COMPAVEN_2.0_Financne_Scenare.md).

### ⏳ Čo čaká na rozhodnutie zakladateľa

1. **B1** — Zaokrúhľovanie úroku.
2. **B2** — Výpočet výnosu medzi vyhodnoteniami.
3. **B3** — Mesačné sporenie pri prenájme.
4. **B4** — Dátum aplikácie úroku/istiny.
5. **B5** — Agregácia pri viacerých hypotékach.

### 🚀 Je FÁZA 1 pripravená na prechod do FÁZY 2?

**ÁNO — ALE S PODMIENKOU:**
- ✅ Všetky základné prvky sú jasné.
- ✅ Finančná logika je overená.
- ⏳ Päť otvorených otázok (B1–B5) musí byť rozhodnutých predĺženia do FÁZY 2.

---

## ČASŤ D: ĎALŠÍ POSTUP

### 1. **Zakladateľ** — Rozhodnutia na otvorené otázky

Prosím, schváliť alebo modifikovať:
- **B1** — Zaokrúhľovanie: Možnosť a) (na cent) ✓
- **B2** — Výnos: Možnosť b) (exponenciálny) ✓
- **B3** — Mesačné sporenie: Možnosť a) (s prenájmom) ✓
- **B4** — Dátum aplikácie: Možnosť a) (okamžite) ✓
- **B5** — Viacero hypoték: SUMA jednotlivých ✓

### 2. **Po schválení** — FÁZA 2

FÁZA 2 bude zameraná na:
1. **Wireframy siedmich obrazoviek** (nie pixel-perfect, iba logika).
2. **Navigácia** medzi obrazovkami.
3. **Hierarchia informácií**.
4. **Rozloženie na počítači a iPhone**.
5. **Základný návrh Nastavení**.

### 3. **Bez zmien kódu**

- ❌ Žiadne commits.
- ❌ Žiadny merge.
- ❌ Žiadny deployment.
- ✅ Iba dokumentácia a návrhy.

---

## ZÁVER

**FÁZA 1 je hotová a pripravená na schválenie zakladateľa.**

Dokumenty:
1. [`COMPAVEN_2.0_FAZA_1_FINAL.md`](COMPAVEN_2.0_FAZA_1_FINAL.md) — Finálna FÁZA 1 s integrovanými pravidlami.
2. [`COMPAVEN_2.0_Financne_Scenare.md`](COMPAVEN_2.0_Financne_Scenare.md) — 10 testovacích scenárov s numerickými výpočtami.
3. [`COMPAVEN_2.0_FAZA_1_Rozhodnutia.md`](COMPAVEN_2.0_FAZA_1_Rozhodnutia.md) — Tento dokument.

**Čakám na vaše rozhodnutia k otvorným otázkam (B1–B5) a potom pokračujem do FÁZY 2.**

---

**KONIEC PREHĽADU ROZHODNUTÍ A FÁZY 1**
