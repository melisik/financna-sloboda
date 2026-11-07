# COMPAVEN 2.0 — FÁZA 1: Kontrola a opravy

**Dátum:** 2026-11-07  
**Stav:** Výsledky kontrol na schválenie  
**Výstup:** Zoznam vykonaných kontrol, identifikované problémy, otvorené otázky, upresnenia.

---

## ZHRNUTIE KONTROL

Vykonané štyri kontroly FÁZY 1 podľa pokynov zakladateľa:

1. ✅ **Prepojenie finančných údajov** — Splátky, prevody, nákupy, čisté hodnoty
2. ✅ **Hodnota Dashboardu** — Podľa scenárov vs. skutočný prehľad
3. ✅ **Rozsah MVP** — Všetkých 7 oblastí ako jeden funkčný produkt
4. ✅ **Úplnosť obrazoviek** — Všetky 7, vrátane Nastavení

---

## KONTROLA 1: PREPOJENIE FINANČNÝCH ÚDAJOV

### Problém 1a: Splátky hypoték — Úrok a istina

**Náleza v FÁZE 1:**  
Scenár 3 spomína hypotéku a splátku, ale nehovorí jasne, ako sa splátka rozdelí na **úrok** (výdavok) a **istinu** (znižovanie záväzku).

**Problém:**
- Úrok by mal byť súčasťou mesačného toku (výdavok, znižuje dostupné peniaze).
- Istina znižuje zostatok záväzku (zmeny v MAJ, nie v toku).
- Bez jasného rozdelenia vzniká zámena: zvyšuje sa splátka hotovosti alebo len zaznamenám peniaze?

**Návrh opravy:**
- **V MVP:** Splátka hypotéky sa zapisuje ako **jedna transakcia v PR/V** (typ „Výdavok").
- Aplikácia **automaticky** rozdelí splátku na:
  - Úrok (časť, vypočítaná z aktuálneho zostatku a sadzby).
  - Istina (zvyšok, ktorý znižuje zostatok v MAJ).
- Úrok sa **zobrazí** ako výdavok v PR/V a čítaní chýb do dostupného toku.
- Istina **znižuje zostatok hypotéky** v MAJ bez zobrazenia ako výdavok.

**Príklad:**
- Splátka: 1 000 €, Zostatok: 200 000 €, Sadzba: 2,5 % p.a. → Mesačne ~417 € úroku.
- Zápis: 1 000 € výdavok.
- Aplikácia rozdelí: Úrok 417 €, Istina 583 €.
- Zostatok sa znížu na 199 417 €.

**Status:** ✅ JASNÉ — Upresnenie pre FÁZU 3 (výpočty).

---

### Problém 1b: Prevody medzi vlastnými účtami

**Náleza v FÁZE 1:**  
Scenár 2 spomína „investícia z hotovosti" (presun z K_cash do K_inv), ale nie je jasné, či sa to počíta do predbežného dopadu.

**Problém:**
- Presun K_cash → K_inv zmení rozdelenie kapitálu, ale **nie celkový K**.
- Predbežný dopad by mal byť **žiadny** (K sa nemení).
- Bez jasnosti sa používateľ zbúra, prečo „predbežne: bez zmeny".

**Návrh opravy:**
- **Nový typ transakcie:** „Presun" (presun medzi vlastnými účtami).
- Presun: K_cash → K_inv (alebo iné kombinácie).
- **Výsledok:**
  - Celkový K sa nemení (K_cash ↓, K_inv ↑).
  - Predbežný dopad: **bez zmeny**.
  - Zobrazení: V PR/V (história) a MAJ (ak sa zobrazuje rozdelenie).

**Status:** ✅ JASNÉ — Nový typ transakcie v FÁZE 2/3.

---

### Problém 1c: Nákup a predaj investícií

**Náleza v FÁZE 1:**  
Scenáre nepokrývajú historiu jednotlivých akcií/fondov (nákup, predaj, výnos).

**Problém:**
- V realite investor kúpi akcie za 10 000 €, neskôr ich predá za 12 000 € (výťažok + výnos).
- FÁZA 1 počítá investíciu ako **odhad** (aktuálnu hodnotu), nie ako históriu transakcií.
- Bez jasnosti nie je zrejmé, ako sa zaznamenáva nákup vs. predaj vs. výnos.

**Návrh opravy:**
- **V MVP:** Investícia je **odhad hodnoty** (bez histórie jednotlivých kúskov).
- Transakcie:
  - Typ „Investícia" (+suma) — zvyšuje K_inv.
  - Typ „Predaj investície" (−suma) — znižuje K_inv, výťažok ide do K_cash.
- **Výnos:** Globálny `r` (reálny výnos) — počíta sa paušálne pre všetky investície.
- **Rozdelenie výnosu na dividendu, úrok, apreciáciu** — Nie v MVP.

**Status:** ✅ JASNÉ — MVP pracuje s odhadmi, nie s historiou jednotlivých kúskov.

---

### Problém 1d: Nákup a predaj majetku

**Náleza v FÁZE 1:**  
Scenár 3 spomína nehnuteľnosť, ale ako sa obchoduje s majetkom (nákup, predaj)?

**Návrh opravy:**
- **V MVP:** Majetok sa zapisuje s **aktuálnou hodnotou** (bez histórie nákupu/predaja).
- Transakcie:
  - Typ „Nákup majetku" — zvyšuje K_nem, znižuje K_cash.
  - Typ „Predaj majetku" — znižuje K_nem, zvyšuje K_cash.
- Výťažok z predaja sa vracia do K_cash.

**Status:** ✅ JASNÉ — Podobne ako investície.

---

### Problém 1e: Výpočet čistého majetku s hypotékou a nájmom

**Náleza v FÁZE 1:**  
Ako sa počíta K_nem, ak majetok má hypotéku a zároveň generuje nájom?

**Návrh opravy:**
- **K_nem (čistá hodnota):**
  ```
  K_nem = SUMA(Hodnota nehnuteľnosti − Zostatok hypotéky) pre všetky majetky
  ```

- **Nájom (príjem − náklady):**
  - Príjem: Mesačný nájom.
  - Náklady: Splátka hypotéky (úrok + istina), údržba, dane, poisťovňa.
  - Čistý nájom = Príjem − Náklady.
  - Čistý nájom → Ide do mesačného sporenia (m).

- **Príklad:**
  - Nehnuteľnosť: 300 000 €, Hypotéka: 200 000 €, K_nem = 100 000 €.
  - Mesačný nájom: 1 500 €, Mesačné náklady (splátka + údržba): 1 400 €, Čistý: 100 €.
  - 100 € → Ide do m (mesačného sporenia).

**Status:** ✅ JASNÉ — Upresnenie pre FÁZU 3.

---

## KONTROLA 2: HODNOTA DASHBOARDU

### Náleza v FÁZE 1

**Scenár 1 Dashboard obsahuje:**
- Kapitál (K_inv, K_cash, K_nem)
- Cieľ (suma, dátum, scenáre)
- Posledné vyhodnotenie
- Predbežný dopad

**Otázka:** Je to skutočný prehľad alebo iba súhrn údajov?

### Návrh úpravy

Dashboard by mal byť **kompas**, nie iba tabuľka. Malo by v ňom byť:

1. **Kapitál a cieľ** (aktuálne) ✅ — Už je v FÁZE 1.
2. **Trend kapitálu** (za posledné 3–6 mesiacov) — Rastie alebo klesá?
3. **Mesačné sporenie (m)** a trend — Koľko sporiť mesiacne?
4. **Upozornenie** (ak je relevantné):
   - „Export bol pred 10 dňami" (pripomenutie záloh).
   - „Mesačné vyhodnotenie dlhí: je už 10. nov." (ak sme mimo mesiaca).
5. **Prvá pomôcka** — „Čo teraz?" (odkaz na najbližšiu akciu).

### Implementačný detail

Dashboard musí **ťahať sumarizované dáta z Histórie** (bez otvorenia Histórie):
- Posledný snímok K_L a trend.
- Priemer m za posledné 3 mesiace.
- Stav posledného exportu.

**Status:** ⚠️ UPRESNENIE — FÁZA 2 (wireframy) musí rozpracovať Dashboard detailnejšie.

---

## KONTROLA 3: ROZSAH MVP

### Scenáre pokrývajú:

| Scenár | Oblasť | Status |
|--------|--------|--------|
| 1 | Nastavenie, Onboarding | ✅ OK |
| 2 | Príjmy/Výdavky, Vyhodnotenie | ✅ OK |
| 3 | Majetok, Záväzky | ⚠️ Upresnenie (Úrok vs. istina, MVP bez automatického splácania) |
| 4 | Finančné ciele | ✅ OK |
| 5 | Plánovanie | ⚠️ Upresnenie (Scenáre sa ukladajú alebo iba simulácia?) |
| 6 | História | ✅ OK |
| 7 | Nastavenia, Export/Import | ✅ OK |

### Identifikované otázky

**O1: Automatické splácanie hypotéky — MVP alebo Fáza 2?**

- **FÁZA 1 návrh (scenár 3):** Manuálne zadávanie mesačnej splátky.
- **Automatické splácanie (D-347)** — Fáza 2 (prepočet zostatku mesiac po mesiaci, záznam poslednej splátky).

**Návrh:** V MVP používateľ zadáva splátku ako výdavok; aplikácia automaticky rozdelí na úrok a istinu.

---

**O2: Plánovanie — Uložené scenáre alebo iba simulácia?**

Scenár 5 spomína „[Uložiť scenár]", ale nie je jasné, či sa scenáre ukladajú v MVP.

- **Návrh:** V MVP iba simulácia (bez uloženia). Uložené scenáre → Fáza 2.

---

### Status

✅ **Rozsah MVP je jasný:** Všetkých 7 oblastí, s upresnením pre hypotéky a plánovanie.

---

## KONTROLA 4: ÚPLNOSŤ OBRAZOVIEK

### Kontrola pokrytia

Dokument FÁZA 1 obsahuje:

| Obrazovka | Status |
|-----------|--------|
| 1. Dashboard | ✅ Spomínané, podľa scenáru 1 |
| 2. Príjmy/Výdavky | ✅ Podľa scenára 2 |
| 3. Majetok/Záväzky | ✅ Podľa scenára 3 |
| 4. Finančné ciele | ✅ Podľa scenára 4 |
| 5. História | ✅ Podľa scenára 6 |
| 6. Plánovanie | ✅ Podľa scenára 5 |
| 7. Nastavenia | ⚠️ Spomínané v časti B, ale nie detailne |

### Návrh úpravy pre Nastavenia

Nastavenia majú obsahovať:

1. **Preferenčný obsah:**
   - Jazyk (SK, EN, ...)
   - Motív (svetlý, tmavý)
   - Notifikácie (zapnuté/vypnuté)

2. **Správa údajov:**
   - Tlačidlo: [Exportovať] → Stiahne JSON.
   - Tlačidlo: [Importovať] → Vyberie súbor, overí, zobrazí náhľad, potvrdí.
   - Tlačidlo: [Vymazať všetko] — Vymaže všetky dáta (s potvrdením).

3. **Informácie:**
   - Verzia aplikácie.
   - Posledný export (dátum, ako dlho).
   - Veľkosť dát (počet transakcií, vyhodnotení, majetkov).

4. **Pomôcka:**
   - Odkaz na návod.
   - Kontakt (e-mail, odkaz na FAQ).

**Status:** ✅ JASNÉ — Nastavenia budú rozpísané v FÁZE 2 (wireframy).

---

## OTVORENÉ OTÁZKY NA ROZHODNUTIE ZAKLADATEĽA

| Otázka | Možnosti | Návrh |
|--------|----------|--------|
| **O1** — Automatické splácanie | MVP alebo Fáza 2? | MVP: manuálne + rozdelenie na úrok/istinu. Fáza 2: amortizácia. |
| **O2** — Plánovanie — Uložené scenáre | MVP alebo Fáza 2? | MVP: iba simulácia. Fáza 2: uložené scenáre. |
| **O3** — Dashboard — Trend | Nový prvok? | Áno, doplniť trend K a m za 3–6 mesiacov. |
| **O4** — Presun medzi účtami | Nový typ transakcie? | Áno, „Presun" (K_cash ↔ K_inv). |
| **O5** — Čisté hodnoty majetku | Ako sa počítajú s nájmom? | K_nem = V − Z, nájom ide do m. |

---

## STAV FÁZY 1 PO KONTROLE

### ✅ Potvrdené

- Sedem funkcí oblastí a ich prepojenia.
- Sedem detailných scenárov.
- Sedem obrazoviek.
- MVP obsahuje všetkých 7 oblastí.
- Offline-first (local first) — Zachované.

### ⚠️ Na upresnenie v FÁZE 2/3

1. Nastavenia: Detailný návrh (export/import, jazyk, motív).
2. Dashboard: Trend a pomôcka.
3. Majetok/Záväzky: Presne formulované (úrok vs. istina, čistá hodnota).
4. Scenáre v Plánovaní: Iba simulácia v MVP.

### 🚫 Odsunúť na Fázu 2+

- Uložené scenáre.
- Automatické splácanie.
- Notifikácie (okrem pripomenutí v Dashboard).

---

## ZHRNUTIE PRE ZAKLADATEĽA

1. **FÁZA 1 je funkčná ako návrh.**
2. **Potrební štyri rozhodnutia** (O1–O4 vyššie).
3. **Detaily budú rozpracované v FÁZE 2** (wireframy) a **FÁZE 3** (dátový model).
4. **Bez zmien kódu, bez commits.**

---

## ĎALŠÍ KROK

Prosím, schváľte:
- ✅ Sedem scenárov a obrazoviek.
- ✅ Prepojenia medzi oblasťami.
- 🤔 Rozhodnutia: O1 (splácanie), O2 (scenáre), O3 (Dashboard), O4 (presun).

Po schválení → **FÁZA 2: Wireframy a navigácia.**

---

**KONIEC KONTROLY FÁZY 1**
