# Scenár: kompletný prechod aplikáciou (2026-10-27)

> Cieľ: odhaliť nedokončené miesta, nezrozumiteľné texty a chýbajúce funkcie vo všetkých sekciách. Vhodné pre zakladateľa alebo skúseného testera; nečaká sa predchádzajúca znalosť appky. Postup je lineárny, ale jednotlivé bloky sú na sebe nezávislé – každý sa dá preskočiť a vrátiť sa k nemu neskôr.
>
> Zariadenie: iPhone alebo Android v Chrome/Safari. Prerekvizita: Záloha → Nahradiť zálohou → `testovacia-zaloha.json` (stiahnuteľná z Prehľadu → Návod). Bez zálohy je časť krokov bezobsažná.
>
> Zapisovanie nálezov: ľubovoľná forma (poznámky, snímky obrazovky, priamo do `docs/pilot/denik-zmatkov.md`).

---

## 0. Prvý štart bez dát (preskočiť, ak zálohu už máš)

> Overuje Sprievodcu; spusti ho s prázdnymi dátami (Nastavenia → Vymazať dáta alebo čerstvý prehliadač).

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 0-1 | Otvor appku prvýkrát (bez zálohy) | Zobrazí sa Sprievodca? Je zrejmé, že ide o prvé nastavenie? |
| 0-2 | Krok 1 – Ročné výdavky: zadaj 24 000 | Je zrozumiteľné, čo „ročné výdavky" znamenajú? |
| 0-3 | Krok 2 – Miera výberu: nechaj predvolenú; prečítaj vysvetlenie | Veta „neoverený predpoklad" – je pre bežného používateľa zrozumiteľná, alebo skôr mätie? |
| 0-4 | Krok 3 – Dnešný stav: investície 50 000, hotovosť 10 000 | Vieš bez vysvetlenia, čo patrí do „investícií" a čo do „hotovosti"? |
| 0-5 | Krok 4 – Záloha: stiahni zálohu (ak je tlačidlo viditeľné) | Je záloha v tomto kroku zrozumiteľná, alebo pôsobí technicky? |
| 0-6 | Krok 5 – PIN: preskočiť | Vedia testeri, čo PIN chráni? |
| 0-7 | Krok 6 – Moduly: vyber Majetok a zásoby | Rozumieš, čo každý modul ponúka? Je zoznam vyčerpávajúci? |
| 0-8 | Krok 7 – Výsledok: prečítaj dátum cieľa | Je výsledok motivujúci, alebo vyzerá ako chybové hlásenie? |
| 0-9 | Po skončení Sprievodcu: nahraj testovaciu zálohu (Záloha → Nahradiť) | Záloha prepíše nastavenia zo Sprievodcu; je to zrejmé? |

**Hľadaj:** miesta, kde Sprievodca predpokladá znalosť pojmov (miera výberu, reálny výnos, investície vs. hotovosť).

---

## 1. Prehľad

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 1-1 | Otvor Prehľad | Vidíš dátum cieľa, pokrok a posun od posledného vyhodnotenia? Je jasné, čo každá z týchto troch hodnôt znamená? |
| 1-2 | Prečítaj riadok s výnosom pod dátumom | Riadok obsahuje výnos 3,5 %, infláciu 4,2 %, nominálny výnos. Je zrozumiteľný bežnému používateľovi, alebo pôsobí technicky? |
| 1-3 | Prečítaj upozornenie „Skúšobná verzia" (pruh hore) | Je viditeľné pri otvorení? Zbali ho ťuknutím; ostane zbalený po reloade? |
| 1-4 | Rozbaľ blok **Vývoj** | Zobrazí sa graf kapitálu? Sú body rovnomerne rozložené (nie podľa dátumu)? Je pod grafom veta o tom? Zodpovedá dátum cieľa v tabuľke dátumu v hlavičke Prehľadu? |
| 1-5 | Prečítaj posun od prvého vyhodnotenia | Je text zrozumiteľný? Skloňuje „mesiacov / mesiace" správne pri počte 1, 2, 5, 22? (Otestuj len ak máš viac vyhodnotení.) |
| 1-6 | Ťukni na **Týždenný súhrn → Poslať mailom** | Otvorí sa mailový klient s textom? Je adresa predvyplnená? |
| 1-7 | Rozbaľ **Návod** | Sú kroky aktuálne? Vidíš odkaz na testovaciu zálohu? |
| 1-8 | Na telefóne s šírkou < 700 px: posuň dolu pod obsah | Sú Moduly zbalené pod obsahom? |
| 1-9 | Na širokom displeji (> 700 px): pozri pravý stĺpec | Sú Moduly v pravom stĺpci vedľa obsahu? |

**Hľadaj:** nezrozumiteľné finančné pojmy, chýbajúce vysvetlenia k dátumu cieľa.

---

## 2. Transakcie (Nová transakcia)

### 2a. Rýchly výdavok

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 2-1 | Zadaj sumu 50 €, zdroj „z príjmu", ulož | Predbežný dopad na cieľ je „bez zmeny" (hotovosť ani investície sa nemenia). Je to zrozumiteľné? |
| 2-2 | Zadaj sumu 50 €, zdroj „z hotovosti", ulož | Dopad ukazuje zmenu kapitálu. Je rozdiel voči „z príjmu" zrejmý bez vysvetlenia? |
| 2-3 | Zadaj veľkú sumu (1 000 000 €), zdroj „z investícií", skús uložiť | Objaví sa políčko na potvrdenie vyčerpania investícií? Je viditeľné, alebo ho treba skrútiť? Pruh s tlačidlom ho neprekrýva? |
| 2-4 | Zadaj sumu 50 €, zdroj „z hotovosti" (hotovosť je len 10 000 €), suma 15 000 €, skús uložiť | Zobrazí sa chybová hláška o nedostatku hotovosti? |
| 2-5 | Uloži transakciu, potom ťukni Upraviť | Je po zrušení úpravy zdroj späť „z príjmu"? Typ späť „výdavok"? |
| 2-6 | V histórii ťukni Upraviť, zmeň sumu, ulož | Transakcia v histórii sa aktualizuje? |
| 2-7 | Ťukni Upraviť → Zmazať transakciu → Zmazať | Objaví sa možnosť Vrátiť späť? Funguje vrátenie? |
| 2-8 | Zapíš výdavok 650 € v kategórii „bývanie" | Appka upozorní, že nájom sa ráta automaticky? Sú tlačidlá „Uložiť aj tak" a „Neukladať" jasné? |

### 2b. Nákup po položkách

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 2-9 | Prepni na **Nákup po položkách** | Je prepnutie zrozumiteľné? Čo sa stane s predtým zadanou sumou? |
| 2-10 | Pridaj položku (napr. Mlieko, 1 ks, 1,29 €), potom ďalšiu (Chlieb, 1 ks, 1,80 €) | Súčet sa ukazuje? Je správny? |
| 2-11 | Zmeň množstvo položky tlačidlami − a + | Zmení sa suma riadku? |
| 2-12 | Pridaj zápornou cenou „zľava –5 %" (napr. −0,15 €) | Celkový súčet klesne? Je postup intuitívny? |
| 2-13 | Skús uložiť bez položiek | Zobrazí sa chyba „Pridaj aspoň jednu položku"? |
| 2-14 | Ulož nákup s položkami | Po uložení ponúkne „Pridať do skladu"? (Len ak je modul Sklad zapnutý.) |
| 2-15 | Prepni späť na Rýchly výdavok, keď sú položky zadané | Zobrazí sa varovanie, že položky sa zahodia? |

### 2c. Doklad (QR kód)

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 2-16 | Rozbaľ blok **Overiť doklad (QR)** | Je blok predvolene zbalený? |
| 2-17 | Naskenuj QR kód z dokladu (alebo nahraj obrázok) | Nájde číslo dokladu? Je text potvrdzujúci načítanie zrozumiteľný? |
| 2-18 | Ťukni **Overiť doklad na portáli** | Skopíruje sa číslo do schránky a otvorí sa portál? |
| 2-19 | Preskúšaj kameru (Skenovať QR kód kamerou) | Funguje? Je zariadenie bez siete (offline) a skener sa ešte nepoužil po poslednej aktualizácii? – Zobrazí sa správna hláška (nie „Povolenie kamery")? |
| 2-20 | Ťukni na súhrn „Overiť doklad (QR) ▾" a zbal blok | Ostane zbalený? Dá sa znovu rozbaliť? |

### 2d. Filter histórie

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 2-21 | Rozbaľ **Filter ▾** | Je zbalený predvolene? |
| 2-22 | Nastav filter na typ „výdavok" | História sa prefiltruje? Súčet sedí? |
| 2-23 | Nastav rozsah dátumov | Funguje kombinovaný filter? |
| 2-24 | Ťukni **Zrušiť filter** | Obnoví sa plná história? |
| 2-25 | Posúvaj históriu; ťukni **Zobraziť staršie** | Načíta sa ďalších 10 záznamov? |

**Hľadaj:** nezrozumiteľný text „bez zmeny" pri zdroji z príjmu, skryté pole potvrdenia vyčerpania investícií, chýbajúci návod na zadávanie zľavy.

---

## 3. Scenár: Veľký výdavok

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 3-1 | Otvor sekciu **Veľký výdavok** | Je zrejmý rozdiel oproti Novej transakcii? |
| 3-2 | Zadaj 5 000 €, vyskúšaj všetky zdroje | Je slovný opis dopadu pre každý zdroj zrozumiteľný? |
| 3-3 | Zadaj sumu väčšiu ako celý kapitál | Zobrazí sa rozumné upozornenie? |
| 3-4 | Skontroluj, že v Transakciách nepribudol žiadny záznam | Scenár nesmie zapisovať. |
| 3-5 | Prečítaj vetu o poplatku a dani pod výsledkom | Znie „pred daňou, po poplatkoch, ak ich zadáš" – je to zrozumiteľné? |

---

## 4. Scenár: Mesačný výdavok

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 4-1 | Otvor **Mesačný výdavok** | Je zrejmé, na čo slúži (čistý dopad nového opakovaného výdavku)? |
| 4-2 | Zadaj 100 € mesačne | Zobrazí sa, o koľko mesiacov sa cieľ posunie? Je formulácia „o N mesiacov skôr / neskôr" motivačná alebo výčitková? |
| 4-3 | Pod výsledkom pozri zoznam opakovaných výdavkov | Sú viditeľné z testovacej zálohy? Je jasné, ako sú triedené? |
| 4-4 | Zadaj výdavok väčší ako mesačné sporenie | Zobrazí sa informácia, že tento scenár to nepočíta? |

---

## 5. Vyhodnotenie

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 5-1 | Otvor **Vyhodnotenie** | Je zrejmé, kedy urobiť vyhodnotenie (raz za mesiac, raz za kvartál)? |
| 5-2 | Zadaj aktuálnu hodnotu investícií a hotovosti, ulož | Je jasné, čo „investície" a „hotovosť" zahŕňajú? Čo nespadá do ani jednej? |
| 5-3 | Po uložení sa vráť na Prehľad | Aktualizoval sa dátum cieľa? Objavil sa posun? |
| 5-4 | Urob druhé vyhodnotenie s mierne inými hodnotami | Zobrazí sa v bloku Vývoj nový bod? |
| 5-5 | Skús uložiť vyhodnotenie s budúcim dátumom | Zobrazí sa chyba? |

---

## 6. Ročný prehľad

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 6-1 | Otvor **Ročný prehľad** | Je rok predvolene aktuálny? |
| 6-2 | Prečítaj riadky v tabuľke | Sú stĺpce zrozumiteľné (príjmy, výdavky, sporenie)? |
| 6-3 | Rozbaľ Výdavky podľa kategórie | Sedí súčet s celkovými výdavkami? |
| 6-4 | Prepni rok späť | Zmenia sa dáta? Funguje, aj keď pre daný rok nie sú vyhodnotenia? |

---

## 7. Majetok (len s modulom Majetok)

### 7a. Nehnuteľnosť

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 7-1 | Pridaj nehnuteľnosť bez režimu | Zobrazí sa „Do kapitálu sa nepočíta, kým nezadáš režim." – je K → kapitál zrozumiteľné? |
| 7-2 | Nastav režim **vlastné bývanie** | Čo sa zobrazí? Počíta sa do kapitálu? |
| 7-3 | Nastav režim **prenájom** | Objaví sa formulár na príjmy z prenájmu a výdavky? Je zrozumiteľný? |
| 7-4 | Nastav režim **predaj** | Je jasné, kedy to dáva zmysel? |
| 7-5 | Zadaj hypotéku | Vidíš zostatok hypotéky a vplyv na čistú hodnotu? Je výpočet čistej hodnoty (odhad mínus zostatok hypotéky) viditeľný? |
| 7-6 | Skús pridať zo súpisu LV (Katastrálny portál) | Funguje návod na načítanie LV zo súpisu? Kde je? |
| 7-7 | Pozri, čo sa zobrazí, keď nie je zadaná žiadna nehnuteľnosť | Je sekcia prázdna, alebo je tam výzva? |

### 7b. Ostatné aktíva

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 7-8 | Pridaj auto (Ostatné aktíva) | Zobrazí sa „Slúži len na prehľad majetku; do kapitálu ani do dátumu cieľa sa nepočíta." – je to jasné, alebo pôsobí ako chyba? |
| 7-9 | Zadaj odhad ceny | Vidíš odhad v zozname? Spočíta sa s hodnotou nehnuteľností? |

**Hľadaj:** skratka „K" (namiesto „kapitálu"), nejasnosť, prečo auto nevplýva na dátum cieľa.

---

## 8. Záväzky

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 8-1 | Pridaj záväzok (napr. dlh kamarátovi, 2 000 €) | Opisuje sekcia rozdiel medzi záväzkom a hypotékou? |
| 8-2 | Skontroluj, či sa záväzok odráža v Prehľade | Ovplyvňuje záväzok kapitál alebo dátum cieľa? Je to vysvetlené? |

---

## 9. Investície

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 9-1 | Otvor **Investície** | Je zrejmé, čo zadávať (portfólio, nie individuálne akcie)? |
| 9-2 | Pridaj položku, v poli Poskytovateľ začni písať „Finax" | Objaví sa autocomplete so zoznamom NBS? Je zrejmé, že zoznam nie je odporúčanie? |
| 9-3 | Ťukni na odkaz **Overiť v registri NBS** | Otvorí sa stránka NBS? |
| 9-4 | Zadaj vlastný názov (napr. „Trading 212") | Uloží sa bez chyby? |
| 9-5 | Nastav daňový režim položky | Vidíš text „len evidencia, nepočíta sa"? Je zrozumiteľný? |
| 9-6 | Ťukni na záložku **Ciele** | Pridaj cieľ „Dôchodok" 100 000 € | |
| 9-7 | Pri položke investície prirad 50 % do cieľa Dôchodok | Vidíš na Prehľade plnenie cieľa? |
| 9-8 | Zaškrtni „Sem patrí všetko, čo nepatrí do iného cieľa" | Je text zrozumiteľný? Čo sa stane, keď žiadny cieľ toto zaškrtnuté nemá? |
| 9-9 | Preplň cieľ (prirad viac ako je jeho hodnota) | Zobrazí sa text o presmerovaní prebytku? Je zrozumiteľný? |

---

## 10. Príjmy

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 10-1 | Otvor **Príjmy** | Čo sekcia ukazuje? Je zrejmé, na čo slúži? |
| 10-2 | Pozri, či je viditeľné pole „Načítať údaje zo súboru integračnej služby" | Malo by byť skryté (D-323). Ak ho vidíš, nahlásiť. |
| 10-3 | Zadaj budúci príjem (napr. dôchodok od roku 2055, 600 €/mes.) | Zobrazí sa v zozname? Ovplyvňuje dátum cieľa? (Malo by, ale zatiaľ nie – je to jasne označené?) |

---

## 11. Pravidelné výdavky

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 11-1 | Otvor **Pravidelné výdavky** | Je zoznam z testovacej zálohy viditeľný? |
| 11-2 | Ťukni na položku (napr. Nájom) | Je možné len Upraviť? Kde sú Ukončiť a Zmazať? |
| 11-3 | V úprave nájdi Zmazať a Ukončiť | Je rozdiel medzi nimi zrozumiteľný? |
| 11-4 | Pridaj novú položku | Zapíše sa? Objaví sa v zozname? |
| 11-5 | Skontroluj, ako sa výdavky spočítavajú v Mesačnom výdavku | Vidíš ich vplyv? |

---

## 12. Rozpočet

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 12-1 | Otvor **Rozpočet** | Sú kategórie z testovacej zálohy viditeľné s limitmi? |
| 12-2 | Ťukni **Upraviť limity** | Funguje editácia? |
| 12-3 | Nastav limit 200 € pre kategóriu „potraviny" | Uloží sa? |
| 12-4 | Zapíš výdavok 250 € v kategórii potraviny (v Transakciách) | Zobrazí sa pri zadávaní výdavku zmienka o limite? |
| 12-5 | Vráť sa do Rozpočtu | Je viditeľné prekročenie limitu? Je jasné, že ide o aktuálny mesiac? |

---

## 13. Dane

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 13-1 | Otvor **Dane** | Zobrazí sa úvod sekcie? Je jasné, čo je hotové (evidencia, tlačivo) a čo nie (výpočet dane)? |
| 13-2 | Prečítaj vetu „Daňový scenár je samostatný a zatiaľ nemá čísla po dani: pravidlá ešte nie sú overené." | Je to zrozumiteľné bežnému testerovi, alebo pôsobí ako chyba? |
| 13-3 | Karty daňového režimu investície (z Investícií) | Vidíš „len evidencia, nepočíta sa"? Je to jasné? |
| 13-4 | Zadaj príjmy z prenájmu (za rok) | Uloží sa? Prenajímaná nehnuteľnosť sa tu zobrazí automaticky? |
| 13-5 | Pridaj psa | Uloží sa? Čo zobrazí appka o sadzbe? (Sadzbu určuje obec; appka ju nepočíta.) |
| 13-6 | Ťukni **Zobraziť tlačivo 17-dp-md** (ak je nehnuteľnosť v prenájme) | Vygeneruje sa predvyplnené tlačivo? Je viditeľné, ktoré polia sú vyplnené automaticky a ktoré ručne? |
| 13-7 | Skúšaj export XML daňového priznania | Je tlačidlo prítomné? Funguje (krok 2b nie je implementovaný – malo by to byť jasne označené)? |

---

## 14. Sklad

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 14-1 | Otvor **Sklad** | Je sekcia prázdna bez dát? Vidíš výzvu na pridanie prvej položky? |
| 14-2 | Pridaj položku (napr. Mlieko, 2 litre, cena 1,29 €/kus, spotreba o 7 dní) | Formulár je zrozumiteľný? |
| 14-3 | Pri položke ťukni **Vyhodiť** a zadaj 0,5 litra | Zobrazí sa v „Vyhodené tento mesiac"? Suma? |
| 14-4 | Zmeň dátum spotreby na minulosť | Objaví sa upozornenie na prešlý dátum? Čo ponúkne appka? |
| 14-5 | Ťukni **Ešte použiteľné** | Zmizne upozornenie? |
| 14-6 | Blok **Nakúpiť** – pridaj položku do nákupného zoznamu | Uloží sa? |
| 14-7 | Zaškrtni položku ako kúpenú → **Do skladu** | Pridá sa do skladu? |
| 14-8 | Ťukni **Poslať zoznam** | Otvorí sa zdieľanie alebo mailová aplikácia? |
| 14-9 | Blok **Recepty** – pridaj recept (napr. Cestoviny, suroviny: 200 g cestovín, 1 pohár smotany) | Uloží sa? |
| 14-10 | Pri recepte ťukni **Chýbajúce na zoznam** | Presunú sa chýbajúce suroviny do Nakúpiť? |
| 14-11 | Skenovanie čiarového kódu (živá kamera) | Funguje offline po predchádzajúcom online otvorení? |
| 14-12 | Skenovanie z fotky obalu | Nájde kód? Je text pri nerozoznanom kóde zrozumiteľný? |
| 14-13 | V Transakciách (Nákup po položkách), v Úprave existujúceho nákupu: **Pridať do skladu** | Presunú sa položky do skladu bez duplikatov? |

**Hľadaj:** chýbajúce prepojenie s Opakovanými výdavkami (N-17 – nie je implementované).

---

## 15. Záloha

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 15-1 | Otvor **Záloha** | Vidíš dátum poslednej zálohy? Je výzva na zálohovanie zrozumiteľná? |
| 15-2 | **Uložiť zálohu** (bez hesla) | Stiahne sa súbor? Je meno súboru zrozumiteľné? |
| 15-3 | **Uložiť zálohu s heslom** (aspoň 8 znakov) | Stiahne sa šifrovaný súbor? |
| 15-4 | Nahradiť zálohou – zlé heslo | Zobrazí sa chyba? Je jasná? |
| 15-5 | Nahradiť zálohou – správne heslo | Obnovia sa dáta? |
| 15-6 | Záloha zo staršej verzie (ak je k dispozícii) | Načíta sa správne? |
| 15-7 | Skontroluj upozornenie, keď záloha chýba viac ako 30 dní | Zobrazí sa? |

---

## 16. Nastavenia

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 16-1 | Otvor **Nastavenia** | Sú ročné výdavky predvyplnené z testovacej zálohy? |
| 16-2 | Zmeň ročné výdavky | Aktualizuje sa dátum cieľa na Prehľade? |
| 16-3 | Zmeň mieru výberu mimo rozsahu 3–4 % | Zobrazí sa upozornenie? Je pochopiteľné? |
| 16-4 | Zmeň výnos mimo rozsahu 2–6 % | Rovnaké upozornenie? |
| 16-5 | Ťukni **Vrátiť na odporúčané** | Obnovia sa predvolené hodnoty? |
| 16-6 | Prepni **Prahová hodnota** (threshold) pre veľké výdavky | Zobrazí sa v histórii transakcií „nad prahom"? |
| 16-7 | Moduly – vypni a zapni Sklad | Sekcia Sklad zmizne/objaví sa v navigácii? |
| 16-8 | **PIN** – nastav 4-ciferný PIN | Pri ďalšom otvorení appky (napr. po zatvorení a opätovnom otvorení) sa pýta PIN? |
| 16-9 | Zabudnutý PIN – čo sa stane? | Je postup obnovenia zrozumiteľný? |
| 16-10 | **Vymazať dáta** | Zobrazí sa potvrdenie? Vymažú sa všetky dáta vrátane zálohy? |

---

## 17. Navigácia a UI

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 17-1 | Prejdi všetky skupiny v menu (Peniaze, Plán a výsledky, Majetok a zásoby, Nastavenia a záloha) | Sú skupiny zrozumiteľné? Sú správne sekcie v správnych skupinách? |
| 17-2 | Posuň riadok sekcií do strany (telefón < 600 px) | Dá sa posunúť? Je viditeľné, že pokračuje? |
| 17-3 | Ťukni na aktívnu sekciu v menu | Skočí na vrchol stránky? |
| 17-4 | Tmavý režim (nastavenie telefónu) | Je všetko čitateľné? Sú tlačidlá a texty kontrastné? |
| 17-5 | Väčšie písmo (nastavenie prístupnosti) | Presahuje niečo okraj? Sú tlačidlá stále dostatočne veľké (min. 44 px)? |
| 17-6 | VoiceOver / TalkBack – základná navigácia | Majú interaktívne prvky zrozumiteľné popisy? (Neformálne overenie; formálny checklist v `docs/07` riadok 24 čaká na vyplnenie.) |
| 17-7 | Skúšobný pruh hore – ťukni na súhrn | Zbalí sa? Ostane zbalený po reloade? |

---

## 18. Offline a PWA

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 18-1 | Pridaj appku na plochu (iPhone: Zdieľať → Pridať na plochu) | Funguje ikonka? Je fullscreen bez lišty prehliadača? |
| 18-2 | Vypni internet (Lietadlový režim) | Načíta sa appka zo service workera? Zobrazí sa upozornenie o offline stave? |
| 18-3 | Offline: zadaj transakciu, vylož zálohu | Funguje? |
| 18-4 | Offline: otvor Sklad, skús skenovať čiarový kód | Funguje? (Platí len ak bol Sklad otvorený online po poslednej aktualizácii.) |
| 18-5 | Zapni internet | Aktualizuje sa appka automaticky na novú verziu (ak je dostupná)? |

---

## 19. Nahlásiť pripomienku (Spätná väzba)

| Krok | Čo urobiť | Čo sledovať |
| --- | --- | --- |
| 19-1 | Dole na stránke ťukni **Nahlásiť pripomienku → Otvoriť formulár** | Otvorí sa? Je text tlačidla jasný? |
| 19-2 | V náhľade: sú kanály (GitHub / e-mail) správne? | GitHub by sa nemal zobrazovať v súkromnom náhľade. |
| 19-3 | Tyká alebo vyká appka v bloku pripomienok? | Zvyšok appky tyká; zjednotiť. |

---

## Súhrn: kde hľadať nedokončené miesta

Na základe `docs/60` a `docs/61` sú tieto oblasti zámerne nedokončené – overovaním sa potvrdí, či sú viditeľne označené, alebo môžu testera zmiasť:

| Oblasť | Čo chýba (zámer) | Je to v appke jasné? |
| --- | --- | --- |
| Dane – výpočet | výpočet dane z investícií, termíny, XML krok 2b | Veta „zatiaľ nemá čísla po dani" – overiť v kroku 13-2 |
| Investície – import cien | ceny sa zadávajú ručne | Žiadna výzva v appke? |
| Príjmy – integračná služba | súbor zatiaľ nič nevytvára (skrytý, D-323) | Pole by nemalo byť viditeľné – overiť v kroku 10-2 |
| Ostatné aktíva – vplyv na cieľ | auto sa nepočíta do kapitálu | Veta je; overiť, či je zrozumiteľná (krok 7-8) |
| Sklad – Opakované výdavky | položky zo skladu sa neobjavujú v Pravidelných | Žiadny text; bude tester zmätený? |
| VoiceOver checklist | ručné overenie čítačky obrazovky (M6) | Nie je vyplnený; overiť aspoň základnú navigáciu (krok 17-6) |
| Dáta v prehliadači (M7) | uchovanie po 7 dňoch nečinnosti na iPhone | Výsledok testu nie je zapísaný (krok 5-2 v `docs/61`) |
