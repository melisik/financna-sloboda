# Testovacie scenáre pre externých testerov

Verejná adresa appky: **https://melisik.github.io/financna-sloboda-app/**

Appka je skúšobná. Údaje sú len v zariadení testera, nie sú zašifrované a môžu sa stratiť. **Nezadávajte skutočné údaje** (čísla účtov, skutočné zostatky, čísla dokladov). Používajte testovaciu zálohu alebo vymyslené čísla.

Hľadáte nedokonalosti: nie je potrebné nič kupovať, nič posielať ani registrovať účet.

---

## Scenár A: krok za krokom

Cieľ: overiť, že hlavné funkcie fungujú tak, ako sa majú. Robte presne tieto kroky a nič iné. Pri každom kroku zapíšte OK, alebo čo nesedí.

**Príprava**
- A.0 Otvorte adresu v prehliadači (na telefóne Safari, na počítači Chrome alebo Firefox).
- A.0b Voliteľne: na telefóne Zdieľať → Pridať na plochu, potom otvorte appku z ikony.

**1. Úvod**
- 1.1 Hore pod nadpisom „Finančná sloboda“ je žltý box, ktorý začína „Skúšobná verzia“. Je viditeľný.
- 1.2 Dole na stránke je tlačidlo **Nahlásiť pripomienku**.

**2. Testovacia záloha**
- 2.1 Prehľad → rozbaľte **Návod** (dole na stránke) → kliknite na **stiahnuť testovaciu zálohu**. Súbor sa stiahne.
- 2.2 Sekcia **Záloha** → **Vybrať súbor zálohy** → vyberte stiahnutý súbor.
- 2.3 Náhľad ukazuje „transakcií 12, vyhodnotení 2“ a text „Aktuálne dáta sa nenávratne prepíšu“.
- 2.4 Kliknite **Nahradiť dáta zálohou**. Zobrazí sa „Dáta boli nahradené zálohou.“
- 2.5 Prehľad → blok „Tento mesiac“ ukazuje sumu, nie 0 €.

**3. Výdavok**
- 3.1 Transakcie → zadajte **Suma (€)**: `12,20`, kategória: `jedlo`, dátum: dnešný. Kliknite **Uložiť transakciu**.
- 3.2 V zozname je suma **12,20 €** (nie „12 €“) a dátum má tvar **dd.mm.rrrr**.
- 3.3 Vyberte filter kategórie **jedlo**. Zobrazia sa len výdavky v tejto kategórii.

**4. Vyhodnotenie**
- 4.1 Sekcia **Vyhodnotenie** ukazuje zoznam vyhodnotení s dátumami vo formáte dd.mm.rrrr.
- 4.2 Otvorte posledné vyhodnotenie a skontrolujte, že sú v ňom čísla (K, investície, hotovosť).

**5. Nastavenia**
- 5.1 Sekcia **Nastavenia** → **Miera výberu (%)**: zadajte `5`. Má sa zobraziť upozornenie, že hodnota je mimo bežného rozsahu.
- 5.2 Zadajte späť `4` a kliknite **Uložiť nastavenia**. Zobrazí sa potvrdenie uloženia.

**6. Majetok a mimoriadna splátka**
- 6.1 Sekcia **Majetok** → **Pridať nehnuteľnosť** → vyplňte:
  - Názov: `Test hypotéka`
  - Režim: Vlastné bývanie
  - Odhad hodnoty: `300000`
  - Dátum odhadu: dnešný
  - Zostatok hypotéky: `1000`
  - Zostatok platí k: dnešný
  - Úroková sadzba: `0`
  - Mesačná splátka hypotéky: `500`
  - **Uložiť nehnuteľnosť**
- 6.2 Pod kartou je riadok „Pri tejto splátke sa zostatok splatí za 2 mesiacov.“
- 6.3 Rozbaľte **Mimoriadna splátka hypotéky**. Zadajte dátum: dnešný, **Suma (€)**: `200`, režim **Znížiť splátku**. Pod formulárom sa má zobraziť náhľad „Nová splátka: 400,00 €“.
- 6.4 Kliknite **Zapísať mimoriadnu splátku**. Karta ukáže „Hypotéka: 800,00 €“.
- 6.5 Kliknite **Vrátiť poslednú mimoriadnu splátku** → **Potvrdiť vrátenie**. Karta ukáže „Hypotéka: 1 000,00 €“.

**7. Pripomienky**
- 7.1 Dole kliknite **Nahlásiť pripomienku**. Zobrazia sa dve tlačidlá: **Mám účet na GitHube** a **Nemám účet**.
- 7.2 Kliknite **Nemám účet**. Otvorí sa formulár. Pošlite krátky testovací záznam: sekcia `Test`, čo sa stalo `test`.
- 7.3 Kliknite **Zrušiť**, ak chcete voľbu zavrieť.

**8. Záloha späť**
- 8.1 Sekcia **Záloha** → **Exportovať zálohu**. Súbor sa uloží (na telefóne cez zdieľací list, na počítači sa stiahne).
- 8.2 Vyberte pre istotu iný súbor, napr. ľubovoľný textový súbor s príponou `.json`. Zobrazí sa chyba slovami a dáta sa nezmenia.

**Čo nám napísať po scenári A**
Pre každý krok: číslo kroku, OK alebo chyba. Pri chybe napíšte, čo ste očakávali a čo sa stalo. Screenshot pridajte, ak viete.

---

## Scenár B: voľné testovanie

Cieľ: nájsť to, čo nefunguje dobre, je nejasné alebo vás zmätie. Nemusíte dokončiť všetko. Skúste si predstaviť, že appku používate každý mesiac.

**Čas:** 30 až 45 minút.

**Úlohy (robte ich v ľubovoľnom poradí):**
1. Naplňte appku aspoň desiatimi výdavkami z posledného týždňa (vymyslené). Skúste ich zatriediť do kategórií a nájsť, koľko ste minuli na jedlo.
2. Zistite, koľko ste minuli tento mesiac a či ste nad prahom.
3. Skúste nastaviť aj rozpočet alebo pravidelné výdavky. Zistite, či rozumiete výsledku.
4. Pridajte nehnuteľnosť, záväzok alebo položku skladu. Zistite, čo tam ide a čo nie.
5. Vyskúšajte vyhodnotenie: uložte ho, upravte a skontrolujte, či sa zmenia čísla v Ročnom prehľade.
6. Vyskúšajte, čo sa stane, keď zadáte nezmyselné hodnoty (záporné sumy, dátum v budúcnosti, prázdne polia, veľmi veľké čísla).
7. Vyskúšajte to na telefóne aj na počítači. Overte, či sa všetko zmestí na obrazovku a či sa dá všetko kliknúť.
8. Zapnite tmavý režim v nastaveniach zariadenia a pozrite sa, či sú texty čitateľné.

**Na čo si dajte pozor (nie je to zoznam chýb, len smer):**
- Texty, ktorým nerozumiete alebo ktoré sú príliš technické.
- Čísla, ktoré sa zdajú zvláštne, a čísla, ktoré sa nezhodujú medzi sekciami.
- Miesta, kde nie je jasné, čo bude nasledovať po kliknutí.
- Tlačidlá, ktoré sa nedajú nájsť alebo sú príliš malé.
- Správy, ktoré vás nasmerujú nesprávnym smerom.

**Čo nám napísať po scenári B**
- Čo ste robili (aspoň tri body).
- Čo vás prekvapilo, zmiatlo alebo nefungovalo.
- Čo by ste zmenili, ak by ste mohli.
- Screenshoty, ak ich máte.

---

## Ako nahlásiť nález

Najľahšie je tlačidlo **Nahlásiť pripomienku** dole na stránke:
- **Mám účet na GitHube:** otvorí sa nové hlásenie so šablónou. Pred odoslaním skontrolujte, že neobsahuje osobné údaje.
- **Nemám účet:** otvorí sa formulár. Odpovedať môžete vlastnými slovami.

Do pripomienky nepíšte čísla účtov, mená ani skutočné zostatky.

---

## Po teste

Ak chcete appku vrátiť do východiskového stavu, sekcia **Záloha** → **Vybrať súbor zálohy** → testovacia záloha → **Nahradiť dáta zálohou**. Pozor, toto nahradí všetky dáta v zariadení.
