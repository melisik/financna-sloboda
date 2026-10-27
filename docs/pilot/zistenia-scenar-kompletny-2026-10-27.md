# Zistenia – kompletný testovací scenár, 2026-10-27

Zakladateľ prešiel `scenar-kompletny-2026-10-27.md` sekcie 0–2d a nahlásil nálezy.
Spracoval: Claude (D-325, denník zmätkov).

---

## Priorita 1 – Bug

### B-01: Upozornenie na pravidelný výdavok sa nezobrazilo

**Sekcia:** 2a (krok 2-8)  
**Príznaky:** Zadanie výdavku 650 € v kategórii „bývanie" nevyvolalo upozornenie na pravidelný výdavok Nájom.  
**Analýza:** Záloha obsahuje Nájom 65 000 centov, kategória `bývanie`, aktívny od 2026-01-01 bez konca. Funkcia `matchingRecurring` (tolerancia ±1 €) by mala nájsť zhodu. Kontrola v `save()` platí pre nový výdavok, keď `!confirmedRecurring`. `useEffect` na riadku 70 (`Transakcie.tsx`) resetuje `recurringConfirmed` pri zmene sumy/kategórie/dátumu.  
**Možné príčiny:**
- Záloha nebola načítaná pred týmto krokom (scenár to vyžaduje, ale mohla sa preskočiť).
- Kategória nebola vybraná pred kliknutím Uložiť.
- V aplikácii bez mockovania hodín je dnes 2026-10-27, Nájom je aktívny → bug reálny, ak záloha bola načítaná a kategória bola vybraná.  
**Stav:** Overiť repro v E2E teste. Ak zlyháva, debugovať volanie `matchingRecurring`.

---

## Priorita 2 – UX bloky (komplikujú používanie)

### U-01: Predbežný dopad ostáva po uložení

**Sekcia:** 2a (krok 2-3, 2-5)  
**Príznaky:** Dlhý blok „Predbežný dopad" zostal rozbalený aj po uložení transakcie a blokoval pohľad na nový prázdny formulár.  
**Navrhovaná akcia:** Po úspešnom uložení a reset formuláru nastaviť `previewOpen = false` (ak existuje takáto premenná), alebo schovať blok, kým nie je suma vyplnená.

### U-02: Chybová hláška sa zobrazuje dvakrát

**Sekcia:** 2a (krok 2-4)  
**Príznaky:** Pri nevyplnenom povinnom poli sa zobrazila hláška raz čiernou farbou (inline) a raz červenou (systémová chyba).  
**Navrhovaná akcia:** Identifikovať, kde vznikajú oba výpisy, a ponechať len jeden (preferovane červený pri poli).

### U-03: Starý predbežný dopad sa vrátil po zmene sumy

**Sekcia:** 2a (krok 2-4/2-5)  
**Príznaky:** Po zadaní novej sumy sa na chvíľu ukázal starý „predbežný dopad" z predchádzajúcej transakcie (1 000 000 €).  
**Navrhovaná akcia:** Overiť, či sa výpočet nespúšťa skôr, ako sa stav formuláru aktualizuje; prípadne ho sčítavať až po debounce alebo stlačení Uložiť.

### U-04: Suma z rýchleho výdavku ostáva viditeľná pri prepnutí na položky

**Sekcia:** 2b (krok 2-9)  
**Príznaky:** Suma zadaná v rýchlom výdavku zostala viditeľná v poli Suma aj po prepnutí na „Nákup po položkách", kde je suma automatický súčet.  
**Navrhovaná akcia:** Pri prepnutí na byItems vymazať/skryť pole Suma (alebo ho urobiť disabled a zobraziť len výsledný súčet).

---

## Priorita 3 – UX nejasnosti (mätú, ale dajú sa prekonať)

### N-01: Sprievodca – úvodný krok nevyzeral ako sprievodca

„Vitaj" nevyzerá ako vstup do procesu; chýba kontextová veta „Toto ti pomôže nastaviť appku na prvé použitie."

### N-02: Sprievodca – krok 1 Výdavky – nejasné kedy sa nastavujú

Krok zobrazuje len nadpis; výdavky sa nastavujú až po kliknutí Pokračovať na ďalšej obrazovke.

### N-03: Sprievodca – „neoverený predpoklad"

Termín mätie laika. Nahradiť za zrozumiteľný text, napr. „Odhadovaný cieľový príjem. Môžeš ho neskôr spresnit."

### N-04: Sprievodca – „Koľko máš dnes" – nejasné čoho

Chýba doplnenie: „… nasporeného a investovaného" alebo „… celkovo k dispozícii".

### N-05: Sprievodca – výsledok odporúča zvýšiť sporenie pred jeho nastavením

Odporúčanie „zvýš mesačné sporenie" sa zobrazilo, hoci krok sporenia ešte nenastal. Výsledok na kroku 8 by mal reflektovať len to, čo bolo nastavené.

### N-06: Sprievodca – chýba súhrn po dokončení

Po poslednom kroku nie je vidieť, čo appka nastavila. Vhodný by bol súhrnný pohľad (aké moduly, aký cieľ, aká suma).

### N-07: Sprievodca – suma 648 648,65 € bez kontextu

Výsledná suma nie je vysvetlená ani zaokrúhlená. Treba: (a) zaokrúhliť na celé stovky/tisíce, (b) pridať vetu, čo suma znamená.

### N-08: Sprievodca – pomenovanie modulov

- „Sklad" je zrozumiteľnejší ako alternatívy; ponechať.
- „tlačivo 17-dp-md" ako názov modulu je technický kód. Nahradiť za „Nehnuteľnosť" alebo „Dane z prenájmu".

### N-09: Prehľad – „Viac ako 50 rokov"

Nezrozumiteľné. Vhodnejší formát: „Cieľ dosiahneš cca v roku 2077" alebo „za viac ako 50 rokov (pri zachovaní dnešného trendu)".

### N-10: Prehľad – „Podrobnosti" nie je vizuálne odlíšené ako odkaz

Používateľ nevedel, že je klikateľný. Vizuálne odlíšiť (podčiarknutie, šípka, chevron).

### N-11: Prehľad – e-mail bez adresy príjemcu

Adresa príjemcu týždenného súhrnu nie je predvyplnená. Predvyplniť z nastavení profilu, ak je k dispozícii.

### N-12: Transakcie – „z príjmu" vs „z hotovosti" nejasný rozdiel

Používateľ nevedel, ktorý zdroj zvoliť. Pridať krátky tooltip alebo vysvetľujúci text.

### N-13: Transakcie – Zmazať / Vrátiť späť – chaotické rozloženie

Tlačidlá pri úprave transakcie sú usporiadané mätúco. Zrevidovať hierarchiu akcií (primárna = Uložiť, sekundárna = Zrušiť, deštruktívna = Zmazať).

### N-14: Transakcie – prázdny zoznam návrhov

Rozbaľovací zoznam návrhov sa otvoril prázdny. Overiť: (a) záloha bez histórie → prázdny je správny stav, (b) ak história existuje a je prázdny → bug. Pridať prázdny stav s textom „Zatiaľ žiadne návrhy".

### N-15: Transakcie – Odstrániť pri položke nákupu

Tlačidlo „Odstrániť" sa zdalo zbytočné; intuitívnejšia alternatíva je ikona koša alebo swipe.

### N-16: Transakcie – zadanie zľavy nie je intuitívne

Postup pre zadanie zľavy pri položke nie je zrejmý. Zvážiť: dedikované pole „Zľava (€)" vedľa ceny.

### N-17: Transakcie – prepnutie na rýchly výdavok bez varovania

Pri prepnutí z „nákupu po položkách" na rýchly výdavok sa položky stratia bez varovania. Pridať potvrdzovací dialóg ak `items.length > 0`.

### N-18: Transakcie – blok QR viditeľný len v režime položiek

Používateľ v rýchlom výdavku nevidel možnosť skenovať QR kód. Ak má QR zmysel aj pri rýchlom výdavku, zobraziť ho tam tiež.

### N-19: Transakcie – príliš veľa správ QR naraz

Po otvorení QR skenera sa zobrazilo viac správ naraz. Zobraziť postupne alebo len jednu v danom momente.

### N-20: Transakcie – chýba potvrdenie o skopírovaní do schránky

Po skopírovaní čísla dokladu do schránky nebola žiadna spätná väzba. Pridať krátky toast „Skopírované".

---

## Priorita 4 – Chýbajúce testovacie dáta

### D-01: Graf Vývoj – záloha s 1 vyhodnotením

Graf sa nezobrazí, lebo minimum sú 2 vyhodnotenia. Testovacia záloha musí obsahovať aspoň 2 vyhodnotenia (syntetické dáta).

### D-02: Filter histórie – záloha len s výdavkami

Filter histórie nebol testovateľný, lebo záloha obsahuje len transakcie jedného druhu (výdavky). Záloha musí obsahovať príjmy, investičné výdavky a rôzne kategórie.

---

## Sekcie scenára – zostatok

Otestované: 0 (Sprievodca), 1 (Prehľad), 2a (Rýchly výdavok), 2b (Nákup po položkách), 2c (Doklad QR), 2d (Filter histórie – čiastočne).  
Neotestované: 2e (Editácia), 2f (História), 3 (Veľký výdavok), 4 (Sklad), 5 (Záloha), 6 (Dane), 7 (Majetok), 8 (Investície), 9 (Nastavenia), 10 (Sprievodca – 2. priechod), 11 (Offline), 12 (PIN).
