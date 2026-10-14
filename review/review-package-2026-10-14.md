# Balík na externú revíziu – Finančná sloboda (pracovný názov)

Dátum: 2026-10-14. Verzie dokumentov sú v hlavičkách jednotlivých častí. Záznamy rozhodnutí sú na konci.

## Zadanie pre reviewera

Si nezávislý reviewer dokumentácie produktu. Nie si jej autor. Prečítaj všetky dokumenty nižšie a nájdi:

1. **Nekonzistentnosti** medzi dokumentmi a voči záznamom v `Decisions.md` (iná hodnota, iný vzorec, odkaz na zrušené rozhodnutie, chýbajúci odkaz).
2. **Chyby vo výpočtoch.** Over vzorec vo `04` (FR-02) a príklady v `04` a `07` (GC-01 až GC-16). Overiť možno tabuľkovou funkciou `NPER(i; −m; −K; T; 0)`, kde `i = (1 + r)^(1/12) − 1`.
3. **Medzery:** požiadavky bez testu, rozhodnutia bez milníka, chýbajúce stavy (prázdny stav, chyba, hranica).
4. **Riziká:** právne a regulačné (investičné poradenstvo, GDPR, PSD2), bezpečnosť a súkromie, kognitívna záťaž a tón (UX princípy), technický dlh, škálovateľnosť.
5. **Nejasné formulácie,** ktoré by mohli viesť k rôznej implementácii.
6. **Predpoklady** označené [predpoklad]: potvrď ich, alebo navrhni inak.

## Výstup

Zoznam nálezov zoradený podľa závažnosti (kritické, vysoké, stredné, nízke). Pre každý nález uveď:
- dokument a sekciu (napr. `04` FR-02),
- problém v jednej až dvoch vetách,
- prečo na tom záleží,
- navrhovanú úpravu,
- prípadne otázku pre zakladateľa, ak ide o rozhodnutie, ktoré reviewer nemôže urobiť sám.

Na konci krátky súhrn: čo je v poriadku a čo je najdôležitejšie pred implementáciou.

Neprepisuj dokumenty celé. Uveď konkrétne miesta. Nerozhoduj za zakladateľa.

---

<!-- ===== docs/00_Project_Vision.md ===== -->

# 00 – Vízia projektu

> Stav: koncept, verzia 0.11 (2026-10-14).

## Pracovný názov
Finančná sloboda (pracovný, zmení sa)

## Definícia cieľa
Finančná sloboda = **nezávislosť od zamestnania** [user]. Produkt má ukázať cestu, ako sa k nej dopracovať.

## Základný koncept [user]
Jeden spoločný „balík“ troch oblastí:
1. sporenie,
2. investovanie,
3. cielená (vedomá) spotreba.

Kľúčové vlastnosti:
- **Dynamický cieľ**: cieľ dosiahnutia finančnej slobody (suma a/alebo dátum) sa prepočíta pri každom mesačnom vyhodnotení (D-014). Po každom čiastkovom rozhodnutí sa ukáže len predbežný dopad (D-024, D-029).
- **Záznam rozhodnutí**: každé čiastkové rozhodnutie (sporenie, investícia, výdavok) sa zaznamená.

## Hlavná myšlienka (zhrnutie) [predpoklad]
Používateľ vidí, ako každé jeho finančné rozhodnutie posúva dátum a/alebo výšku cieľa nezávislosti od zamestnania, a má o rozhodnutiach trvalý záznam.

## Cieľová skupina [user]
1. Najprv len pre zakladateľa (osobné použitie).
2. Potom pre používateľov v EÚ.

Dôsledok [predpoklad]: v prvej fáze netreba viacužívateľskú architektúru ani súlad s EÚ reguláciou, ale dátový model a ukladanie dát sa majú navrhnúť tak, aby sa neskôr dali rozšíriť (viac používateľov, meny, krajiny, GDPR).

## Nastavenie cieľa a odporúčania [user]
- Každý používateľ si cieľ nastaví sám.
- Pri nastavovaní dostane odporúčania (napr. predvolené hodnoty a rozumné rozsahy parametrov cieľa).
- Rozsah odporúčaní [predpoklad, treba potvrdiť]: odporúčania sa týkajú **parametrov cieľa**, nie výberu konkrétnych produktov.

## Model výpočtu cieľa [user, MVP]
- MVP: **pravidlo 4 %**: cieľový kapitál = ročné výdavky × 25.
- Predpoklady (miera výberu 4 %, ročné výdavky) musia byť v aplikácii viditeľné a upraviteľné.
- Projekcia podľa výnosu a inflácie je **odložená** na neskôr (zatiaľ príliš zložitá).
- Známe obmedzenie [predpoklad]: pravidlo 4 % nezohľadňuje inflačný ani výnosový scenár ani dĺžku obdobia; v aplikácii to treba stručne uviesť.

## Typ produktu a ukladanie dát [user]
- **Fáza 1 (MVP):** webová aplikácia, ručné zadávanie transakcií, dáta uložené **lokálne** (v prehliadači).
- **Neskôr:** mobilná aplikácia s integráciami na bankový účet a aplikácie investičných produktov.
- Obmedzenia lokálneho ukladania [predpoklad]: dáta sú viazané na zariadenie a prehliadač; prehliadač ich môže vymazať. Preto má MVP obsahovať export a import dát (záloha).
- Dôsledky pre dizajn [predpoklad]: oddeliť dátovú vrstvu od UI, aby sa úložisko dalo neskôr vymeniť (backend, synchronizácia) a aby sa dali pridať importy z banky a od brokerov. Integrácie na bankové účty v EÚ typicky podliehajú PSD2 a vyžadujú licencovaného poskytovateľa; treba posúdiť neskôr.

## Existujúca investícia v MVP [user]
Používateľ zadáva ručne **aktuálnu hodnotu** investícií. Výnos sa nezadáva za jednotlivú investíciu: je to jeden globálny predpoklad r pre celý kapitál, ktorý nastavuje používateľ (D-032). Bez napojenia na trhové dáta; hodnotu aktualizuje používateľ.

## Odporúčania pri nastavení cieľa [user potvrdil parametre a predvolené hodnoty; MVP ukazuje aj dátum cieľa]
Odporúčania sa týkajú len parametrov cieľa, nie produktov. Parametre a predvolené hodnoty potvrdil zakladateľ, no samotné čísla sú **východiskové predpoklady, ktoré treba pred implementáciou overiť** v zdrojoch.

| Parameter | Zadáva | Predvolená hodnota | Odporúčaný rozsah | Poznámka pre používateľa |
|---|---|---|---|---|
| Ročné výdavky pri nezávislosti | používateľ | zadáva ručne ako odhad (D-013) | – | Základ cieľa. Aplikácia ukáže, koľko z výdavkov je pravidelných a koľko cielená spotreba (odložené do fázy 1b, D-038). |
| Miera výberu | používateľ | 4 % (D-008) | 3 – 4 % | Pri dlhom horizonte (skorý odchod) býva opatrnejšia 3 – 3,5 %. Predvolená 4 % ostáva; T je pred daňou a poplatkami (D-043). |
| Výnos r (reálny, po inflácii, globálny) | používateľ | 4 % | 2 – 6 % | Jeden predpoklad pre celý kapitál (D-032). Rozsah ako opatrný / základný / optimistický; vždy s upozornením, že ide o odhad. Východiskové hodnoty sa overia zdrojom pred M3 (M6). |
| Mesačné sporenie (m) | používateľ (odvodené, možno prepísať) | priemer za 12 mesiacov do posledného vyhodnotenia, delený počtom mesiacov histórie (D-031) | – | Spolu s výnosom určuje odhadovaný dátum cieľa. |
| Rezerva (núdzový fond) | používateľ | 3 mesiace výdavkov | 3 – 6 mesiacov | Odporúča sa mať ju mimo investícií; do cieľa sa nezapočítava. |

Pravidlá odporúčaní:
- Používateľ vždy vidí **čo je odporúčanie a čo jeho vlastná hodnota**, a môže ju zmeniť.
- Dátum cieľa sa ukazuje ako **rozsah** (opatrný – základný – optimistický), nie jedno presné číslo.
- Používame reálny výnos (po inflácii), takže výdavky sú v dnešných cenách; netreba zadávať infláciu zvlášť.
- Dane a poplatky sa v MVP neriešia (uvedie sa v upozornení).

## Čo je „rozhodnutie“ [user]
Rozhodnutie = **transakcia** (sporenie, investícia alebo výdavok). Plánovanie „čo ak“ scenárov nie je súčasťou definície rozhodnutia.

## Investície [user]
Používateľ už investíciu má; produkt s ňou počíta a uvažuje s globálnym výnosom r (D-032). Produkt nevyberá ani nenavrhuje investície.

## Mimo rozsahu
- Odporúčanie konkrétnych investičných produktov [user].
- Ostatné zatiaľ neurčené (otvorené).

## Otvorené otázky
1. Overiť číselné hodnoty odporúčaní (miera výberu, rozsah výnosu, rezerva) v zdrojoch.
2. Monetizácia.
3. Klasifikácia výdavkov na pravidelné a cielené (O-7, M7).
4. Rozsah prahu výdavkov podľa cieľa (O-8, M8).
5. Zdroj predvolených hodnôt r a miery výberu (O-9, M6).

## Riziká a upozornenia (Claude) [predpoklad]
- **Právo/regulácia**: rozhodnutie nevyberať produkty znižuje riziko investičného poradenstva. Pri „odporúčaniach“ pri nastavení cieľa však treba strážiť, aby nešlo o osobné odporúčanie typu „investuj X do Y“. Pred rozšírením do EÚ treba právne posúdenie (MiFID II, GDPR, spotrebiteľské právo, rozdiely medzi krajinami).
- **Zavádzajúce projekcie**: dynamický cieľ závisí od predpokladaných výnosov a inflácie. Bez viditeľných predpokladov a rozsahov vzniká falošná istota.
- **Privacy/bezpečnosť**: finančné dáta sú citlivé; treba rozhodnúť o ukladaní a šifrovaní skôr než o architektúre.
- **Kognitívna a emočná záťaž**: neustále prepočítavanie cieľa môže vyvolávať stres alebo posadnutosť; treba zvážiť tón a frekvenciu zobrazovania.
- **Rozsah**: „všetko v jednom balíku“ je široké; odporúčam MVP s najmenším jadrom (záznam rozhodnutia + prepočet cieľa).

---

<!-- ===== docs/01_Personas.md ===== -->

# 01 – Persony

> Stav: v0.2 (2026-10-14). [user] = povedal zakladateľ, [predpoklad] = doplnil Claude, treba potvrdiť.

## Persona 1 – Zakladateľ (prvý používateľ, fáza 1)
- **Cieľ:** nezávislosť od zamestnania [user].
- **Frekvencia používania:** týždenne [user].
- **Zariadenie:** telefón [user] → webová aplikácia musí byť navrhnutá mobile-first.
- **Čo eviduje:** všetky rozhodnutia; výdavky pod prahovú sumu sa ukladajú s príznakom a prah je filter [user, upravené podľa D-030]. Prah je **parameter** a závisí od cieľa používateľa [user]; predvolená hodnota 100 € (D-013).
- **Investícia:** už nejakú má; hodnotu a predpokladaný výnos zadáva ručne [user].
- **Typická situácia** [predpoklad]: raz týždenne si sadne, zadá pár transakcií od posledného zadania a pozrie, ako sa posunul dátum cieľa.
- **Potreby** [predpoklad]: rýchle zadanie na telefóne (pár polí), jasný prehľad „kde som a kedy to dosiahnem“, istota, že dáta nezmiznú (záloha), žiadny tlak ani zbytočné upozornenia.

## Persony pre fázu 2 (EÚ)
Zatiaľ nedefinované. Definujeme po overení MVP na vlastnom použití. Treba počítať s rôznymi krajinami, menami a úrovňou finančnej gramotnosti.

---

<!-- ===== docs/02_User_Requirements.md ===== -->

# 02 – Požiadavky používateľa

> Stav: v0.7 (2026-10-14), rozsah: MVP (fáza 1, jeden používateľ). Zdroj: `00_Project_Vision.md`, `01_Personas.md`, `decisions/Decisions.md`.

## Používateľské príbehy (MVP)

| ID | Príbeh | Zdroj |
|----|--------|-------|
| UR-01 | Ako používateľ si nastavím cieľ (ročné výdavky, miera výberu, výnos, mesačné sporenie, rezerva) s odporúčanými predvolenými hodnotami. | D-008, D-011 |
| UR-02 | Ako používateľ vidím, ktorá hodnota je odporúčanie a ktorá moja vlastná, a môžem ju zmeniť. | D-011 |
| UR-03 | Ako používateľ zadám existujúcu investíciu: aktuálnu hodnotu. Výnos je jeden globálny predpoklad pre celý kapitál, ktorý si nastavím. | D-010, D-032 |
| UR-04 | Ako používateľ zadám transakciu (sporenie, investícia, výdavok) – rýchlo, na telefóne. | D-006, persona 1 |
| UR-10 | Ako používateľ zadám ročné výdavky pri nezávislosti ručne ako odhad. | D-013 |
| UR-05 | Ako používateľ nastavím prahovú sumu, od ktorej sa výdavok zvýrazní v prehľade; všetky výdavky sa ukladajú s príznakom (predvolene 100 €). | [user], D-013, D-030 |
| UR-06 | Ako používateľ po každej transakcii vidím predbežný dopad na dátum cieľa (krátky text). | D-004, D-014 |
| UR-11 | Ako používateľ na konci mesiaca urobím mesačné vyhodnotenie (pripomenutie pri vynechaní, D-016): zadám hodnotu investícií a nasporenú sumu a vidím prepočítaný cieľ (cieľová suma a dátum ako rozsah opatrný/základný/optimistický). | D-011, D-014 |
| UR-12 | Ako používateľ pri zadaní výdavku zvolím zdroj úhrady (z príjmu – predvolené / z kapitálu). | D-014 |
| UR-07 | Ako používateľ vidím históriu všetkých transakcií (záznam rozhodnutí). | D-004 |
| UR-08 | Ako používateľ môžem dáta exportovať a importovať (záloha). | D-009 |
| UR-09 | Ako používateľ vidím predpoklady a obmedzenia výpočtu (pravidlo 4 %, bez daní a poplatkov; hotovosť má 0 % reálne – predpoklad, D-036). | D-008 |

## Nefunkčné požiadavky (MVP) [predpoklad]
- **Mobile-first:** plne použiteľné na telefóne.
- **Lokálne ukladanie:** dáta ostávajú v zariadení (D-009); žiadne odosielanie na server.
- **Nízka kognitívna záťaž:** málo polí, jasný jazyk, žiadne zbytočné upozornenia; prepočet cieľa podáva informáciu, nie tlak.
- **Transparentnosť:** každý výpočet ukazuje vstupy a predpoklady.
- **Slovenčina** v rozhraní; texty pripravené na neskoršie preklady (EÚ).

## Vyriešené rozhodnutia (D-013)
- **Ročné výdavky pri nezávislosti** zadáva používateľ ručne (odhad celkových výdavkov); z transakcií sa neodvodzujú, pretože sa evidujú len výdavky nad prahom.
- **Mesačné sporenie a investovanie** sa odvodzuje z transakcií typu sporenie/investícia (evidujú sa vždy).
- **Prah** platí len pre výdavky. Predvolená hodnota je **100 €**, používateľ ju môže zmeniť.
- **Vplyv cielenej spotreby na cieľ:** evidovaný výdavok **znižuje kapitál len vtedy, ak je hradený z kapitálu** (zdroj úhrady, D-014 a FR-08); výdavok z príjmu kapitál nemení. Ak je hradený z kapitálu, investovateľný kapitál sa zníži o sumu výdavku a posunie sa odhadovaný dátum cieľa. Cieľová suma (ročné výdavky × 25) sa výdavkom nemení.

## Predpoklady a riziká k vyriešeným rozhodnutiam [predpoklad]
- Model „výdavok znižuje kapitál“ predpokladá, že sa výdavok hradí z naakumulovaného kapitálu. Ak ho používateľ v skutočnosti platí z bežného príjmu, aplikácia bude dátum cieľa nadhodnocovať (cieľ vyzerá ďalej, než je). Treba to používateľovi jasne povedať a zvážiť pri zadávaní výdavku voľbu „hradené z kapitálu / z príjmu“ (zdroj úhrady podľa D-014).
- Aby nedochádzalo k dvojitému započítaniu, mesačné sporenie sa počíta len z transakcií sporenie/investícia.

## Zdroj úhrady a mesačné vyhodnotenie kapitálu (potvrdené, D-014)
Zadanie [user]: pri výdavku riešiť zdroj úhrady (z kapitálu / z príjmu); **bežný kapitál vyhodnocovať mesačne, nie denne.**

Potvrdené zakladateľom:
1. Pri zadaní výdavku používateľ zvolí **zdroj úhrady**: „z príjmu“ (predvolené, kapitál sa nemení) alebo „z kapitálu“ (znižuje kapitál).
2. Kapitál sa **oficiálne prepočítava raz mesačne** pri „mesačnom vyhodnotení“: používateľ zadá aktuálnu hodnotu investícií a nasporenú sumu. Tým sa kapitál zosúladí so skutočnosťou (opraví aj chyby a rozdiely z trhu) a odhadovaný dátum cieľa sa potom bere z tohto stavu.
3. Medzi mesačnými vyhodnoteniami aplikácia po každej transakcii ukáže len **predbežný dopad** (napr. „predbežne +2 mesiace“) ako krátky text bez farieb a upozornení; pri vyhodnotení sa nahradí skutočným stavom.
4. Mesačné vyhodnotenie sa robí na **konci mesiaca**. Kapitál = aktuálna hodnota investícií + nasporená suma, zadáva používateľ. „Nasporená suma“ je kumulatívny stav hotovosti, nie prírastok (D-033).

Dôsledok pre D-004: oficiálny prepočet cieľa je mesačný, po transakcii je viditeľný len predbežný dopad (D-014 upresňuje D-004).

Výhody [predpoklad]: menej výkyvov, ktoré by mohli demotivovať (nízka záťaž, ako sme chceli); menej údajov na zadávanie; skutočný stav sa pravidelne opravuje.
Riziko [predpoklad]: ak používateľ mesačné vyhodnotenie vynechá, kapitál a dátum cieľa zastarajú; aplikácia má pripomenúť, nie nútiť, a jasne ukázať dátum posledného vyhodnotenia.

## Otvorené otázky
Žiadne. Vyriešené v D-016 (vynechané vyhodnotenie, rozdiel predbežný vs. skutočný stav) a D-014 (zdroj úhrady, mesačné vyhodnotenie).

---

<!-- ===== docs/03_UX_Principles.md ===== -->

# 03 – UX princípy

> Stav: v0.3 (2026-10-14), rozsah: MVP (jeden používateľ, telefón, týždenné použitie). [user] = zadanie zakladateľa, [predpoklad] = doplnil Claude, treba potvrdiť. Odkazy: D-xxx v `decisions/Decisions.md`, UR-xx v `02_User_Requirements.md`.

## Základné princípy

### 1. Nízka kognitívna záťaž
- Každá obrazovka má jednu hlavnú úlohu. [predpoklad]
- Zadanie transakcie: čo najmenej polí. Povinné: typ, suma. Voliteľné: poznámka. Pri výdavku zdroj úhrady (predvolene „z príjmu“, D-014). [predpoklad]
- Predvolené hodnoty a odporúčania všade, kde sa dajú (D-011), vždy s možnosťou zmeny.
- Žiadny odborný žargón bez vysvetlenia (napr. „miera výberu“ má krátke vysvetlenie).

### 2. Informácia, nie tlak
- Predbežný dopad transakcie sa ukáže ako krátky text, **bez farieb a upozornení** (D-014), napr. „predbežne +2 mesiace“.
- Žiadne červené/zelené hodnotenie rozhodnutí ako „dobré“ alebo „zlé“. Aplikácia nehodnotí používateľa. [predpoklad]
- Žiadne systémové notifikácie okrem jednej jemnej pripomienky mesačného vyhodnotenia, ktorú používateľ môže vypnúť (D-016, D-027). Upozornenia v aplikácii (banner po zálohe, FR-19; pri vynechanom vyhodnotení, FR-10) sú výnimka podľa D-027. [predpoklad]
- Jazyk je pokojný a vecný; žiadne vyčítavé ani pretlačajúce formulácie („Mal si…“, „Už len X dní!“). [predpoklad]

### 3. Transparentnosť a poctivosť
- Každé číslo cieľa ukazuje, z čoho vzniklo (vstupy a predpoklady, D-008).
- Dátum cieľa sa vždy ukazuje ako **rozsah** (opatrný – základný – optimistický), nikdy ako jediný presný dátum (D-011).
- Vždy je vidieť, či ide o predbežný dopad alebo o stav z mesačného vyhodnotenia, a kedy bolo posledné (D-014).
- Stručné upozornenie na obmedzenia: odhad, nie sľub; bez daní a poplatkov (D-008, D-011).
- Odporúčanie je vždy označené ako odporúčanie a odlíšené od hodnoty, ktorú nastavil používateľ (UR-02).

### 4. Predvídateľnosť
- Rovnaké akcie fungujú vždy rovnako; stabilná navigácia, rovnaké umiestnenie hlavných akcií. [predpoklad]
- Žiadne neočakávané zmeny čísel: oficiálny prepočet sa deje len pri mesačnom vyhodnotení (D-014). Dátum cieľa sa nemení ani s plynutím času; mení sa len pri vyhodnotení (D-024).
- Pred nevratnými akciami (mazanie dát, import, ktorý prepíše dáta) potvrdenie s jasným popisom následku. Pri zmazaní transakcie možnosť vrátiť späť. [predpoklad]

### 5. Mobile-first (D-012)
- Navrhované pre telefón, jednou rukou; dostatočne veľké dotykové plochy. [predpoklad]
- Číselné polia otvárajú číselnú klávesnicu; zadanie transakcie do niekoľkých dotykov. [predpoklad]
- Text čitateľný bez priblíženia; dostatočný kontrast; svetlý a tmavý režim podľa systémového nastavenia (D-016); rešpektuje systémovú veľkosť písma. [predpoklad]

### 6. Dôvera a súkromie
- Dáta ostávajú v zariadení (D-009); aplikácia to na vhodnom mieste hovorí jednoducho.
- Záloha dát (export/import) je ľahko dostupná a aplikácia pripomenie, že lokálne dáta môže prehliadač vymazať. [predpoklad]

### 7. Rešpektujúci jazyk
- Slovenčina, jednoduché vety, bez moralizovania o míňaní a sporení. [predpoklad]
- Cielená spotreba je legitímna súčasť plánu, nie „chyba“ (D-004, D-014). [predpoklad]

## Kľúčové toky (náčrt, bez návrhu obrazoviek)
1. **Prvé nastavenie:** cieľ (UR-01, UR-10) → investícia (UR-03) → prah (UR-05) → prvé vyhodnotenie. Odporúčania a predvolené hodnoty pri každom kroku. Krok na iPhone: pridanie appky na plochu je povinné (D-042). Kým nie je prvé vyhodnotenie, namiesto dátumu sa zobrazí výzva „urobte prvé vyhodnotenie“ (L6).
2. **Týždenné zadanie:** otvoriť → pridať transakciu → vidieť predbežný dopad → hotovo.
3. **Mesačné vyhodnotenie (koniec mesiaca):** zadať hodnotu investícií a sporenie → vidieť prepočítaný cieľ a dátum ako rozsah.
4. **Prehľad:** história transakcií (UR-07) a aktuálny stav cieľa.
5. **Záloha:** export/import (UR-08).

## Dostupnosť a inklúzia [predpoklad]
- Cieľ: WCAG 2.2 úroveň AA ako východisko.
- Význam sa neprenáša len farbou; podpora čítačiek obrazovky (správne popisy polí a hodnôt); navigácia klávesnicou.
- V MVP je používateľ len zakladateľ, ale princípy dostupnosti platia už teraz, aby ich nebolo treba dodatočne dorábať pre EÚ.

## Vyriešené otázky
- **Rozsah dátumov (D-016):** text „od – do“ v MVP; graf sa môže pridať neskôr.
- **Svetlý a tmavý režim (D-016):** podľa systémového nastavenia, bez vlastného prepínača v MVP.
- **Vynechané mesačné vyhodnotenie (D-016):** jemná pripomienka a viditeľný dátum posledného vyhodnotenia. Nič sa automaticky nemení ani nevynucuje; cieľ ostáva na poslednom overenom stave a aplikácia to jasne označí.
- **Rozdiel predbežný vs. skutočný stav (D-016) [predpoklad, na overenie v dizajne]:** po vyhodnotení sa zobrazí, o koľko sa zmenil dátum cieľa oproti predbežnému dopadu, jednou vetou (napr. „Po vyhodnotení: cieľ o 1 mesiac skôr než predbežne odhadnutý“).

---

<!-- ===== docs/04_Functional_Requirements.md ===== -->

# 04 – Funkčné požiadavky (MVP)

> Stav: v0.6 (2026-10-14). Rozsah: MVP, jeden používateľ, webová aplikácia (mobile-first), lokálne ukladanie (D-009, D-012). Odkazy: D-xxx = `decisions/Decisions.md`, UR-xx = `02_User_Requirements.md`, UX = `03_UX_Principles.md`. Označenie **[predpoklad]** = návrh Claude, treba potvrdiť.

## 1. Pojmy a model dát

| Pojem | Definícia |
|---|---|
| **Ročné výdavky (V)** | Odhad celkových ročných výdavkov pri nezávislosti, zadáva používateľ ručne (D-013). |
| **Miera výberu (p)** | Predvolene 4 %, rozsah 3–4 % (D-011). |
| **Cieľová suma (T)** | T = V / p. Pri 4 % je T = V × 25 (D-008). |
| **Kapitál (K)** | Hodnota investícií + nasporená suma (kumulatívny stav hotovosti, D-033), bez rezervy (D-011, D-017). |
| **Reálny výnos (r)** | Ročný výnos po inflácii, predvolene 4 %, rozsah 2–6 % (D-011). Jeden globálny predpoklad pre celý kapitál vrátane hotovosti (D-025, D-032). Počíta sa so všetkými sumami v dnešných cenách. |
| **Mesačné sporenie (m)** | Súčet transakcií typu „sporenie“ a „investícia“ za 12 mesiacov, ktoré končia pri D_L, delený počtom mesiacov histórie (najviac 12) (D-031). Používateľ môže zadať vlastnú hodnotu (UR-02). |
| **Rezerva** | Odporúčanie 3 mesiace výdavkov (rozsah 3–6), mimo cieľa (D-011). Stav = vklady mínus výbery (D-047); je hranicou pre výdavok z hotovosti (D-045). |
| **Vyhodnotenie (snapshot)** | Mesačný záznam s dátumom, hodnotou investícií a nasporenou sumou; zadáva sa na konci mesiaca (D-014). |
| **Referenčný dátum (D_L)** | Dátum posledného vyhodnotenia podľa dátumu vyhodnotenia, nie času zápisu (D-044). K_L a m sa vzťahujú k tomuto dňu. Dátum cieľa sa počíta od D_L a mení sa len pri novom vyhodnotení (D-024). |
| **Posledný stav (K_L)** | K zo snapshotu, ktorý je najnovší. Oficiálny cieľ sa počíta z neho, od D_L. |

### Entita Transakcia
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene dnes; nesmie byť v budúcnosti. |
| typ | sporenie / investícia / výdavok / rezerva (vklad) / výber z rezervy | áno | Rezerva nie je v K ani v m; stav = vklady mínus výbery (D-037, D-047). |
| suma | číslo, EUR, > 0 | áno | Na 2 desatinné miesta. |
| zdroj úhrady | z príjmu / z hotovosti / z investícií | áno pri výdavku | Predvolene „z príjmu“ (D-014). Pri sporení a investícii sa nezadáva. |
| poznámka | text, max. 200 znakov | nie | |
| príznak pod prahom | áno/nie | odvodené | Výdavok pod prahom v čase zápisu; uložený a zahrnutý do predbežného dopadu aj prehľadu spotreby (D-030). |

### Entita Vyhodnotenie
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene min(posledný deň mesiaca; dnes). Nesmie byť v budúcnosti (M2). |
| hodnota investícií | číslo ≥ 0 | áno | |
| nasporená suma | číslo ≥ 0 | áno | Kumulatívny stav hotovosti, bez rezervy (D-017, D-033). |

### Entita Nastavenie cieľa
V, p, r, rezerva (mesiace), prah výdavkov, m (odvodené z transakcií, D-031; používateľ môže zadať vlastnú hodnotu), dátum vzniku. Každý parameter má predvolenú hodnotu, odporúčaný rozsah a príznak „zmenený používateľom“ (UR-02).

## 2. Výpočty

### FR-01 – Cieľová suma
T = V / p. Ak V ≤ 0 alebo p ≤ 0, výpočet sa nespustí a zobrazí sa výzva na opravu vstupu.

### FR-02 – Dátum cieľa (počet mesiacov do cieľa)
Výpočet v reálnych hodnotách, mesačné sporenie na konci mesiaca, mesačná sadzba `i = (1 + r)^(1/12) − 1`. Poradie vetiev je záväzné:

1. Ak K_L ≥ T: cieľ je dosiahnutý; dátum = D_L (dátum posledného vyhodnotenia).
2. Ak `K·i + m = 0` (teda K = 0 a m = 0, alebo r = 0 a m = 0): kapitál nerastie, cieľ nie je dosiahnuteľný; zobrazí sa „Pri súčasnom sporení a výnose sa cieľ nedosiahne“ (bez dátumu). Táto vetva musí byť pred vetvou 3 (inak delenie nulou).
3. Ak r = 0 (a m > 0): `n = (T − K) / m`.
4. Inak: `n = ln((T·i + m) / (K·i + m)) / ln(1 + i)`.

Ak m = 0 a r > 0, dátum existuje aj bez sporenia (rastie len výnos), len môže byť veľmi vzdialený (viď O-5).
- Dátum cieľa = D_L + `ceil(n − 1e-6)` mesiacov, orezané na posledný deň cieľového mesiaca (interný výpočet; zobrazuje sa mesiac a rok, FR-06). ε chráni pred chybou pohyblivej desatinnej čiarky (GC-10). Počíta sa z K = K_L a m (D-024).
- Zostávajúci čas = počet mesiacov od dneška do dátumu cieľa; mení sa s časom, dátum nie. Ak dátum uplynul bez vyhodnotenia, zobrazí sa „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“, nie záporný čas (FR-10).
- **Dvojaký kapitál (D-036, D-039, D-041):** K_L = K_inv + K_cash. K_cash sa nezhodnocuje (0 % reálne). Investícia (m_inv) ide do K_inv a zhodnocuje sa; sporenie (m_cash) ide do K_cash bez zhodnotenia (D-041). Ak m_cash > 0, n sa počíta iteráciou po celých mesiacoch a zlomok interpoláciou (D-046). Cieľ je dosiahnutý, keď K_L ≥ T (teda K_inv ≥ T − K_cash). Vzorce vyššie platia s K := K_inv a T := T − K_cash. Ak K_cash ≥ T, cieľ je dosiahnutý. Hradenie výdavkov z K_inv alebo K_cash je otvorené (O-10).
- **Presun do investícií (D-045):** investícia zadaná so zdrojom „z hotovosti“ presúva sumu z K_cash do K_inv. K sa nemení; mení sa len rozdelenie.
- Výnos medzi vyhodnoteniami sa na K_L nepripisuje; dátum je tak konzervatívny (D-024). Výnos r je jeden globálny predpoklad 4 % pre celý kapitál vrátane hotovosti, nastavuje ho používateľ (D-025, D-032).
- Zobrazený dátum cieľa platí k poslednému vyhodnoteniu (D_L): text „dátum platí k poslednému vyhodnoteniu“ (S6).
- Hranica „viac ako 50 rokov“ sa meria od D_L (D-019 upresnené).

**Overený príklad [predpoklad, na kontrolu]:** V = 24 000 €, K = 100 000 €, m = 500 €, r = 4 %. Dostaneme T = 600 000 €, i ≈ 0,3274 %, n ≈ 334 mesiacov (≈ 27 rokov 10 mesiacov).

### FR-03 – Rozsah dátumov (scenáre)
Tri scenáre sa počítajú rovnakým vzorcom s výnosmi odvodenými od r (D-011, S1):
- opatrný: r − 2 p. b. (dolná hranica 0 %),
- základný: r (nastavené, predvolene 4 %),
- optimistický: r + 2 p. b. (S1: scenáre sú relatívne k r, nie pevné).

Zobrazí sa ako „od – do“ (UX D-016): najskorší (optimistický) až najneskorší (opatrný) dátum. Základný je vyznačený textom, nie samostatným číslom. Všetky tri dátumy sa počítajú od D_L (D-024).

### FR-04 – Predbežný dopad transakcie
Pre každú transakciu po poslednom vyhodnotení sa počíta pracovný kapitál:

`K_pred = max(0; K_L + Σ(sporenie/investícia po D_L) − Σ(výdavky „z kapitálu“ po D_L))`

„Po K_L“ znamená transakcie s **dátumom po D_L** (dátum posledného vyhodnotenia), nie podľa času zadania. Transakcia zadaná neskôr s dátumom pred D_L je už v K_L a nepridáva sa znovu (FR-05).

Dopad = n(K_L) − n(K_pred) (surový rozdiel, nie rozdiel zaokrúhlených dátumov; N1). Ak |dopad| ≥ 1 mesiac, zobrazí sa zaokrúhlene na najbližší celý mesiac (D-014, napr. „predbežne +2 mesiace“). Ak |dopad| < 1 mesiac, zobrazí sa v dňoch (1 mesiac = 30,44 dňa) (napr. „predbežne +4 dni“), aby drobné transakcie (napr. 100 €, cca 0,12 mesiaca) nevyšli ako „bez zmeny“ (M1). Obe n sa počítajú od D_L, takže dopad nezávisí od dnešného dátumu (D-024). Kladné číslo = cieľ bližšie, záporné = ďalej.
- Výsledok sa zobrazí ako krátky text (D-014), napr. „predbežne +2 mesiace“.
- Ak je dopad 0, zobrazí sa „bez zmeny“.
- Pracovný kapitál sa **nepremieta do oficiálneho cieľa**, kým sa neurobí vyhodnotenie.
- Ak K_pred = 0 a m = 0, dopad sa nezobrazuje; zobrazí sa „Hotovosť nestačila; kapitál je 0 €“ a „bez sporenia a výnosu sa cieľ nedosiahne“ (H2).
- Ak K_L ≥ T, dopad sa nezobrazuje; zobrazí sa „cieľ je dosiahnutý“. Ak K_pred ≥ T a K_L < T, zobrazí sa „cieľ je dosiahnutý o X mesiacov skôr“ (S2).

**Príklad:** K_L = 100 000 €, m = 500 €, nová investícia 5 000 € po poslednom vyhodnotení. K_pred = 105 000 €, n klesne z ≈ 334 na ≈ 328 mesiacov → „predbežne 6 mesiacov skôr“.

### FR-05 – Mesačné vyhodnotenie
Vstupy: dátum, hodnota investícií, nasporená suma (kumulatívny stav hotovosti, D-033; UR-11). Výsledok: nový snapshot K_L = hodnota investícií + nasporená suma, prepočet cieľa a dátumov, zobrazenie „Posledné vyhodnotenie: dátum“.

- Transakcie s dátumom ≤ dátum vyhodnotenia sú už zahrnuté v zadaných hodnotách a **nepridávajú sa znovu**.
- Transakcie po dátume vyhodnotenia tvoria nový predbežný dopad (FR-04).
- Prepis predchádzajúceho vyhodnotenia je možný len s potvrdením; história snapshotov sa zachováva.

### FR-06 – Zaokrúhľovanie a formát
Sumy: EUR na celé eurá v zobrazení, 2 desatinné miesta vo vstupe a v uložených dátach. Mesiace: celé čísla; predbežný dopad pod 1 mesiac v dňoch (FR-04). Dátum cieľa: mesiac a rok. Dátumy: slovensky, mesiac slovom (napr. „marec 2038“).

## 3. Správanie a pravidlá

### FR-07 – Prah výdavkov (D-013)
- Prah sa uplatní **len na výdavky**; predvolene 100 € (rozsah 100–500 € je odporúčanie; pravidlo podľa cieľa je otvorené, O-8).
- Výdavok pod prahom sa **uloží** s príznakom „pod prahom“ a zahrnie sa do predbežného dopadu (D-030; ruší D-017 O-2; prehľad spotreby je odložený, D-038).
- Sporenie a investície sa ukladajú vždy bez ohľadu na sumu.

### FR-08 – Zdroj úhrady výdavku (D-014)
- „Z príjmu“: K sa nemení.
- „Z hotovosti“ (K_cash): K_pred sa znižuje o sumu, ale nesmie klesnúť pod rezervu (3 mesiace výdavkov, D-045). Ak by klesol, zobrazí sa upozornenie a ponuka zdroja „z investícií“. Po vyhodnotení sa zohľadní v nasporenej sume.
- „Z investícií“ (K_inv): K_pred sa znižuje o sumu; K_cash sa nemení (D-045).
- Ak je výdavok z kapitálu väčší než K_L, alebo ak súčet výdavkov z kapitálu po D_L presiahne K_L, navrhuje sa upozornenie a ponuka zmeny na „z príjmu“; ak používateľ potvrdí, K_pred = 0 a zobrazí sa „Hotovosť nestačila; kapitál je 0 €“ (D-021 rozšírené na kumulatívny prípad, H2).

### FR-09 – Úprava a mazanie transakcie
- Úprava a mazanie sú možné vždy.
- Ak je dátum transakcie po poslednom vyhodnotení, prepočíta sa len predbežný dopad.
- Ak je dátum pred posledným vyhodnotením, zobrazí sa text: „Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.“
- Mazanie: potvrdenie a možnosť vrátiť späť (krátko po zmazaní), UX princíp 4.

### FR-10 – Vynechané vyhodnotenie (D-016)
- Oficiálny cieľ sa **nemení automaticky**; počíta sa z K_L a D_L. Dátum cieľa sa nemení, kým sa neurobí vyhodnotenie.
- Po uplynutí konca mesiaca bez vyhodnotenia sa zobrazí jemná pripomienka a dátum posledného vyhodnotenia.
- Predbežný dopad sa aj naďalej zobrazuje.

### FR-11 – Pripomienka
- Jedna pripomienka na konci mesiaca (v aplikácii; systémová notifikácia len ak ju používateľ povolí) [predpoklad].
- Vypnuteľná v nastaveniach.

### FR-12 – Prvé nastavenie
Postupnosť: cieľ (V, p, r, rezerva) s predvolenými hodnotami → investícia (aktuálna hodnota, UR-03) → prah → prvé vyhodnotenie. Každý krok sa dá preskočiť a doplniť neskôr; chýbajúce údaje sa zobrazia ako „nezadané“, nie ako nula. Prvé vyhodnotenie nastavuje D_L; kým neexistuje, namiesto dátumu sa zobrazí výzva „urobte prvé vyhodnotenie“ (L6). Pridanie appky na plochu je na iPhone povinné (D-042; pozri D-034, D-035).

### FR-13 – Odporúčania
- Odporúčanie je viditeľne označené a odlíšené od hodnoty používateľa (UR-02).
- Používateľ môže kedykoľvek vrátiť odporúčanú hodnotu jedným úkonom.
- Odporúčania sa týkajú len parametrov (D-007); aplikácia neodporúča produkty.

### FR-14 – Prehľad
Domovská obrazovka: cieľová suma, dátum cieľa ako rozsah (od D_L) a zostávajúci čas od dneška (D-024), predbežný dopad posledných transakcií, dátum posledného vyhodnotenia, tlačidlo na pridanie transakcie.

### FR-15 – História
Zoznam transakcií od najnovšej, filter podľa typu a obdobia, súčty za obdobie. Zobrazenie vyhodnotení (snapshotov) v samostatnej časti (UR-07).

## 4. Dáta, záloha a stav aplikácie

### FR-16 – Lokálne ukladanie (D-009)
- Všetky dáta sa ukladajú v zariadení (v úložisku prehliadača vhodnom na väčšie objemy dát, nie len v malých kľúč-hodnota položkách) [predpoklad, rieši architektúra].
- Žiadne odosielanie dát na server.
- Aplikácia funguje offline po prvom načítaní [predpoklad].

### FR-17 – Export
- Export do jedného súboru (JSON) so všetkými transakciami, vyhodnoteniami a nastaveniami.
- Súbor obsahuje číslo verzie schémy a dátum exportu.
- Aplikácia pri exporte pripomenie, že ide o citlivé finančné údaje.

### FR-18 – Import
- Import načíta súbor, overí verziu schémy a zobrazí náhľad (počet transakcií, vyhodnotení, dátum exportu).
- Import **nahradí** aktuálne dáta až po potvrdení (D-018).
- Neplatný súbor sa neimportuje a nič sa nezmení.
- Neznáme polia sa odmietnu (nie ticho ignorujú), overia sa typy, rozsahy a maximálna veľkosť súboru (návrh: 5 MB; N11, S5).

### FR-19 – Pripomenutie zálohy
Ak neboli exportované dáta viac ako 7 dní (alebo nikdy), zobrazí sa jemná pripomienka v prehľade [predpoklad; D-035: 7 dní kvôli 7-dňovému limitu WebKit pre Safari, H4].

## 5. Chybové a hraničné stavy

| Situácia | Správanie |
|---|---|
| Dátum cieľa uplynul bez vyhodnotenia | „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“; bez záporného zostávajúceho času; dátum sa nepreposúva automaticky (D-024). |
| Cieľ je dosiahnutý (K_L ≥ T) | „Cieľ je dosiahnutý“; dátum = D_L (D-024). |
| Cieľ nie je dosiahnuteľný (bez kapitálu a sporenia) | „Pri súčasnom sporení a výnose sa cieľ nedosiahne“, bez dátumu (D-019). |
| Dátum ďalej ako 50 rokov | „viac ako 50 rokov“ (D-019). |
| Chýbajúce údaje (napr. žiadne vyhodnotenie) | „Nezadané“, nie nula; výpočet pracuje s dostupnými údajmi a uvedie, čo chýba. |
| Záporná hodnota vstupu | Zablokovanie s vecnou správou. |
| Zmena po vyhodnotení | Viď FR-09. |
| Vyčerpaný kapitál (K_pred = 0) | „Hotovosť nestačila; kapitál je 0 €“. Ak je zároveň m = 0, dopad sa nezobrazuje (H2, L4). |
| Úložisko prehliadača plné alebo nedostupné | Jasná správa, dáta sa neprepíšu; ponuka exportu. |
| Prehliadač vymazal dáta | Prázdny stav s výzvou na import zálohy; žiadne tiché obnovy. |

## 6. Mimo rozsahu MVP
- Viacužívateľský režim, účty, synchronizácia na server.
- Integrácie na bankový účet alebo brokera (neskôr, mobilná aplikácia).
- Projekcia podľa výnosu a inflácie v grafe (odložená, D-008).
- Daně, poplatky, viac mien, viac krajín (fáza 2).
- Automatické oceňovanie investícií z trhových dát.

## 7. Rozhodnuté a otvorené otázky
**Rozhodnuté:**
- **O-1 Rezerva:** nie je v kapitáli K ani v cieli (D-017).
- **O-2 Výdavky pod prahom:** sa neukladajú (D-017).
- **O-3 Import zálohy:** nahradí aktuálne dáta po potvrdení (D-018).
- **O-4 Priemer sporenia:** za 12 mesiacov do D_L, delené počtom mesiacov histórie, najviac 12 (D-031; upresňuje D-017).
- **O-5 Veľmi vzdialený dátum:** do 50 rokov, ďalej „viac ako 50 rokov“; bez kapitálu a sporenia text bez dátumu (D-019).
- **O-6 Výdavok z kapitálu väčší než kapitál:** upozornenie a ponuka zmeny na „z príjmu“; pri potvrdení K_pred = 0 a text „Hotovosť nestačila; kapitál je 0 €“ (D-021).

- **Rozhodnuté ďalej (D-030 až D-034):** prah a príznak pod prahom, m = za 12 mesiacov do D_L delené počtom mesiacov, globálne r, nasporená suma je stav, plocha odporúčaná (nie povinná).

**Otvorené:**
- **O-7 Klasifikácia spotreby (M7), odložené do fázy 1b (D-038):** pravidelná vs. cielená spotreba; pravidlo a kategórie treba zadať pred implementáciou prehľadu.
- **O-8 Rozsah prahu podľa cieľa (M8):** 100–500 € je odporúčanie; pravidlo výberu prahu nie je určené.
- **O-11 Výpočet n pri m_cash > 0: vyriešené D-046.**
- **O-10 Zdroj úhrady výdavku z kapitálu: vyriešené D-045.**
- **O-9 Zdroj predvolených hodnôt r a miery výberu (M6):** overiť zdrojom a zapísať do Decisions pred M3.

---

<!-- ===== docs/05_Technical_Architecture.md ===== -->

# 05 – Technická architektúra (MVP)

> Stav: v0.5 (2026-10-14). Rozsah: webová aplikácia, mobile-first, jeden používateľ, lokálne dáta (D-009, D-012). Vychádza z `02`, `03`, `04` a `decisions/Decisions.md`. **[predpoklad]** = návrh Claude, treba potvrdiť.

## 1. Prehľad
Statická single-page aplikácia (PWA) bez servera. Všetky dáta a výpočty bežia v prehliadači na zariadení.

```
┌──────────────────────── Prehliadač (zariadenie) ────────────────────────┐
│  UI (React)  ──►  Aplikačná vrstva (use-case funkcie)                    │
│                        │                     │                           │
│                        ▼                     ▼                           │
│               Doménové výpočty         Repozitár dát (rozhranie)         │
│               (čisté funkcie,          │                                 │
│                bez UI a úložiska)      ▼                                 │
│                                  IndexedDB (lokálne dáta)                │
│  Service Worker (offline) · Manifest (pridanie na plochu)                │
└──────────────────────────────────────────────────────────────────────────┘
```

Žiadny backend, žiadne účty, žiadne volania na externé API v MVP (FR-16).

## 2. Technológie

| Oblasť | Voľba | Dôvod |
|---|---|---|
| Jazyk | TypeScript (strict) | Chyby v sumách a dátumoch sa chytia pri kompilácii. |
| UI | React | Známy, veľký ekosystém, jednoduché komponenty. |
| Build | Vite | Rýchly vývoj, jednoduchý výstup ako statické súbory. |
| PWA | Service Worker + Web App Manifest (cez vite-plugin-pwa alebo ručne) | Offline a pridanie na plochu telefónu (FR-16). |
| Úložisko | IndexedDB (cez malú knižnicu, napr. idb) | Väčší objem dát než localStorage; transakčné zápisy. |
| Testy | Vitest (jednotkové), Playwright (end-to-end, neskôr) | Výpočty sa testujú bez prehliadača. |
| Štýly | CSS moduly alebo jednoduché CSS premenné | Tokeny pre svetlý/tmavý režim (D-016). Bez veľkého UI frameworku. |
| Dátum a čas | Natívne `Date` + malá knižnica pre mesiace (napr. date-fns) [predpoklad] | Mesiace a zobrazenie v slovenčine. |

Jazyk UI: slovenčina; texty v jednom súbore pripravenom na preklady (fáza 2) [predpoklad].

## 3. Štruktúra kódu

```
src/
  domain/          čisté funkcie, žiadny React ani IndexedDB
    goal.ts        T = V / p, dátum cieľa, scenáre (FR-01 až FR-03)
    impact.ts      predbežný dopad (FR-04)
    snapshot.ts    prepočet pri mesačnom vyhodnotení (FR-05)
    types.ts       Transakcia, Vyhodnotenie, Nastavenie
    money.ts       zaokrúhľovanie a formát EUR
  storage/
    repository.ts  rozhranie (čítanie/zápis transakcií, vyhodnotení, nastavení)
    indexeddb.ts   implementácia rozhrania
    backup.ts      export/import JSON + validácia schémy (FR-17, FR-18)
  app/             use-case funkcie (zadaj transakciu, urob vyhodnotenie...)
  ui/              React komponenty a obrazovky
  i18n/sk.ts       všetky texty
tests/             jednotkové testy domain/ a storage/
```

**Pravidlo závislostí:** `domain` nesmie importovať nič z `storage`, `app` ani `ui`. `ui` komunikuje len cez `app`. Tým sa `domain` dá použiť aj v budúcej mobilnej appke (fáza 2) bez prepisovania.

## 4. Dátový model

### Úložisko (IndexedDB, databáza `financna-sloboda`, verzia 1)
| Store | Kľúč | Indexy | Obsah |
|---|---|---|---|
| `transactions` | `id` (UUID) | `date`, `type` | dátum, typ (sporenie / investícia / výdavok / rezerva – vklad / výber z rezervy; D-037, D-047), suma (cent), zdroj úhrady, príznak pod prahom (D-030), poznámka, `createdAt`, `updatedAt` |
| `snapshots` | `id` (UUID) | `date` | dátum vyhodnotenia (nesmie byť v budúcnosti, M2), hodnota investícií (cent), nasporená suma = kumulatívny stav hotovosti (cent, D-033), `createdAt` |
| `settings` | `key` (jediný záznam `"current"`) | – | V, p, r, rezerva (mesiace), prah výdavkov, m (odvodené; voliteľné prepísanie), a pre každý parameter príznak „zmenený používateľom“ (UR-02) |
| `meta` | `key` | – | `schemaVersion`, `lastExportAt` (FR-19) |

- **Sumy ukladáme ako celé centy** (integer), nie ako float. Zamedzí chybám zaokrúhľovania.
- **Dátumy** ako ISO reťazec `YYYY-MM-DD` (bez času, bez časového pásma) [predpoklad].
- Ak sa niečo v indexe nedá použiť, transakcie sa filtrujú v pamäti; objem je malý (desiatky až stovky záznamov za rok).

### Export JSON (FR-17)
```json
{
  "app": "financna-sloboda",
  "schemaVersion": 1,
  "exportedAt": "2026-10-14T10:00:00Z",
  "settings": { ... },
  "transactions": [ ... ],
  "snapshots": [ ... ]
}
```
Import: validácia schémy (typy, rozsahy, povinné polia, neznáme polia sa odmietnu, limit veľkosti 5 MB; N11) → náhľad → nahradenie dát v jednej transakcii (D-018). Pri chybe sa nič nezmení.

## 5. Výpočty (domain)

Čisté funkcie, bez vedľajších účinkov. Vstupy: hodnoty v centoch a dátumy, výstup: sumy a počet mesiacov.

- `targetAmount(V, p) → T` (FR-01).
- `monthsToTarget(K, m, r, T) → n | null` podľa vzorca z FR-02 (`null` = nedosiahnuteľné, viď D-019).
- `dateEstimates(K, m, T, {r_optimistic, r_base, r_cautious}) → {from, base, to}` (FR-03).
- `pendingImpact(snapshot, transactionsAfter, settings) → {K_pred, deltaMonths | deltaDays}` (K_pred = max(0, …) podľa FR-04, H2; dopad v dňoch pod 1 mesiac podľa FR-04).
- `monthlySaving(transactions, D_L) → m` (sporenie + investície za 12 mesiacov do D_L, delené počtom mesiacov histórie, najviac 12; D-031).
- `lastReviewDate(snapshots) → D_L` (dátum najnovšieho snapshotu; bez snapshotu `null`, D-024).
- `targetDate(D_L, n) → date` (D_L + ceil(n − 1e-6) mesiacov, orezané na posledný deň mesiaca; D-024). Počíta sa z K_L, takže sa mení len pri novom vyhodnotení.
- `monthsLeft(today, targetDate) → mesiace | null` (zostávajúci čas od dneška; záporná hodnota = dátum uplynul, zobrazí sa „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“; D-024).

Zaokrúhľovanie až pri zobrazení (FR-06). Dátum z mesiacov: `ceil(n − 1e-6)` mesiacov od D_L (D-024), nie od dnešného dňa.

### Overené príklady (jednotkové testy)
| Vstup | Očakávaný výsledok |
|---|---|
| V = 24 000, p = 4 % | T = 600 000 |
| K = 100 000, m = 500, r = 4 %, T = 600 000 | n ≈ 333,9 → 334 mesiacov (FR-02) |
| to isté, K_pred = 105 000 | n ≈ 327,9 → dopad 6 mesiacov skôr (FR-04) |
| K = 100 000, m = 0, r = 4 %, T = 600 000 | n ≈ 548,2 → 549 mesiacov ≈ 45,7 roka → do 50 rokov, zobrazí sa dátum |
| K = 0, m = 0 | „Pri súčasnom sporení a výnose sa cieľ nedosiahne“ (D-019) |
| K ≥ T | cieľ dosiahnutý |
| r = 0, m = 500 | n = (T − K) / m |

## 6. Správanie offline a aktualizácie
- Service Worker ukladá aplikáciu do cache po prvom načítaní; funguje offline (FR-16).
- Nová verzia sa načíta pri ďalšom otvorení; aplikácia neprepíše dáta.
- Migrácie databázy: číslo verzie IndexedDB + funkcie migrácie v `storage/` [predpoklad].

## 7. Bezpečnosť a súkromie
- Žiadne dáta odchádzajú zo zariadenia; žiadne analytické ani chybové nástroje tretích strán v MVP [predpoklad].
- **Šifrovanie v kľude:** v MVP nie je. Dáta sú v prehliadači chránené len sandboxom prehliadača a zámkom zariadenia. Riziko: iný človek s prístupom k odomknutému zariadeniu alebo k exportu. Pripomenie sa to v exporte (FR-17). Rozhodnuté v D-026: v MVP sa nerieši, rieši sa pred fázou 2.
- Export obsahuje citlivé údaje: žiadne automatické odosielanie, žiadne ukladanie do verejných priečinkov.
- Závislosti: minimum, pravidelný audit (npm audit) [predpoklad].
- Content Security Policy v meta tagu bez inline skriptov (ochrana pred injekciou). GitHub Pages nevie nastaviť HTTP hlavičky, takže CSP je len meta tag; direktívy `frame-ancestors`, `report-uri` a `sandbox` v meta tagu nefungujú a nepoužijú sa (S4).

## 8. Nasadenie
- Statický build (`dist/`) na ľubovoľný statický hosting (napr. GitHub Pages) [predpoklad]. Hosting nepozná dáta používateľa.
- Hosting musí byť HTTPS (Service Worker a inštalácia vyžadujú HTTPS).
- Verzia aplikácie v `package.json`, tag v gite pri každom vydaní.

## 9. Kvalita a testovanie (zhoda s `07_Testing_Strategy`)
- **Jednotkové testy domain/:** všetky vzorce a hraničné stavy z FR-02, FR-04, FR-05 a tabuľky vyššie.
- **Testy storage/:** zápis, čítanie, migrácia, import s neplatným súborom (nič sa nezmení).
- **End-to-end (neskôr):** prvé nastavenie → transakcia → vyhodnotenie → export → import.
- **Ručné testy na telefóne:** veľkosti dotykových plôch, čitateľnosť, offline režim (UX princípy).

## 10. Riziká a technický dlh [predpoklad]
| Riziko | Dopad | Opatrenie |
|---|---|---|
| Prehliadač vymaže dáta | strata údajov | pripomienka zálohy (FR-19), export, jasný prázdny stav |
| Zmena schémy dát | nečitateľné zálohy | `schemaVersion` + migrácie od prvej verzie |
| Chyby vo vzorcoch | zlý dátum cieľa | jednotkové testy s overenými príkladmi, čisté funkcie |
| Závislosť na IndexedDB v starých prehliadačoch | nefunkčné úložisko | cieľ: aktuálne prehliadače; zobraziť správu pri nepodpore |
| Prechod na mobilnú appku (fáza 2) | duplicita logiky | `domain/` bez UI, zdieľateľný balík |

## 11. Otvorené otázky
1. **Hosting:** GitHub Pages stačí, alebo iný? (rozhodne sa pred prvým nasadením)
2. **Šifrovanie dát v kľude:** rozhodnuté (D-026): v MVP nie je, rieši sa pred Fázou 2.
3. **Názov a doména:** pracovný názov sa zmení (D-002); nasadenie zatiaľ bez vlastnej domény.
4. **Riziko iOS Safari:** dáta môžu byť vymazané po neaktivite, ak appka nie je na ploche. Rozhodnuté (D-034): plocha je odporúčaná, nie povinná. Overenie na reálnom iPhone pred M2 (07 §6).

---

<!-- ===== docs/06_Roadmap.md ===== -->

# 06 – Roadmapa

> Stav: v0.2 (2026-10-14). Veľkosti milníkov sú relatívne (S / M / L), nie dátumy. Kapacita: hodiny denne (potvrdené zakladateľom); presný odhad trvania doplníme po M1 podľa skutočného tempa. **[predpoklad]** = návrh Claude.

## 1. Princípy plánovania
- **Poradie fáz:** najprv hodnota pre zakladateľa, potom EÚ, potom mobil a integrácie (D-005, zadanie).
- **Merateľné kritériá:** každý milník má výstupné kritérium, nie len zoznam úloh.
- **Brány:** do ďalšej fázy sa ide až po splnení kritérií a potrebných rozhodnutí.
- **Rozhodnutia pred implementáciou:** otvorené body sa uzavrú v dokumentoch a zapíšu do `decisions/Decisions.md`.
- **Minimum pred rozšírením:** MVP sa overí na vlastnom používaní, až potom sa rozširuje.

## 2. Prehľad fáz

| Fáza | Cieľ | Stav | Brána na vstup |
|---|---|---|---|
| 0 – Discovery a dokumentácia | vízia, požiadavky, architektúra, testy | prebieha | externá revízia dokumentov |
| 1 – MVP (osobné použitie) | webová PWA pre zakladateľa | plán | rozhodnutia z oddielu 9 |
| 1b – Pilot | 3 mesiace reálneho používania | plán | dokončené M1–M7 |
| 2 – EÚ webový produkt | viac používateľov, účty, GDPR, jazyky | plán | právne posúdenie, monetizácia, rozhodnutie o účtoch a šifrovaní |
| 3 – Mobil a integrácie | natívna appka, banka a investičné appky | plán | licencie a zmluvy, bezpečnostný audit |

## 3. Fáza 0 – Discovery (takmer hotová)
**Výstupy:** `00_Project_Vision`, `01_Personas`, `02_User_Requirements`, `03_UX_Principles`, `04_Functional_Requirements`, `05_Technical_Architecture`, `07_Testing_Strategy`, tento dokument.

**Čo ešte chýba:**
- externá revízia dokumentov (Claude ako reviewer, podľa `CLAUDE.md`),
- rozhodnutie o hostingu. Šifrovanie v MVP je rozhodnuté (D-026: nie). O-6 je uzavretý (D-021).

**Výstupná brána:** pripomienky z revízie sú zapracované a rozhodnutia zapísané v `Decisions.md`.

## 4. Fáza 1 – MVP (osobné použitie)

| Milník | Obsah | Veľkosť | Výstupné kritérium | Požiadavky |
|---|---|---|---|---|
| **M1 Doménová vrstva** | cieľ, dátumy (scenáre), predbežný dopad, mesačné vyhodnotenie – čisté funkcie | M | všetky GC-01 až GC-14 prejdú (vrátane GC-13 a GC-14 pre stabilitu dátumu, D-024; GC-15 pre K_pred ≥ 0 a GC-16 pre m pri krátkej histórii, D-031; GC-17 až GC-21 pre rozdelený kapitál, rezervu a m_cash > 0, D-036, D-039, D-045, D-046); property testy zelené; overenie NPER | FR-01 až FR-05, FR-07, FR-08 |
| **M2 Úložisko a záloha** | IndexedDB, CRUD, export a import s validáciou a atomicitou, schéma v1 | M | round trip test zelený; neplatný import nič nezmení | FR-16 až FR-19 |
| **M3 Nastavenie a transakcie** | prvé nastavenie s odporúčaniami, investícia, prah, zadanie transakcie so zdrojom úhrady, história | L | zadanie transakcie do 20 s a do 5 dotykov [predpoklad]; komponentové testy; predvolené hodnoty r a miery výberu majú zdroj zapísaný v Decisions (M6) | UR-01 až UR-05, UR-07, UR-10, UR-12, FR-06, FR-12, FR-13, FR-15 |
| **M4 Prehľad a vyhodnotenie** | domovská obrazovka s rozsahom dátumov, predbežný dopad, mesačné vyhodnotenie, pripomienka, upozornenie pri vynechaní | M | E2E tok „transakcia → vyhodnotenie → dátum“ prejde | UR-06, UR-11, FR-09, FR-10, FR-11, FR-14, UR-09 |
| **M5 PWA a offline** | service worker, manifest, ikony, inštalácia na plochu | S | všetky toky offline; sieťový test súkromia zelený | FR-16 |
| **M6 Dostupnosť a kvalita** | axe-core bez vážnych chýb, čítačky, tmavý režim, zoom 200 % | S | nulové vážne porušenia; checklist čítačiek vyplnený | UX, 07 oddiel 9 |
| **M7 Vydanie 0.1 pre seba** | nasadenie na HTTPS, návod v appke, prvá ručná záloha | S | nasadené; export a import fungujú na reálnom telefóne | Definícia hotového (07 oddiel 13) |

**Poradie:** M1 → M2 → M3 → M4 → M5 → M6 → M7. M5 a M6 sa dajú začať paralelne s M4, ak to kapacita dovolí.

**Hlavné riziká fázy 1:**
- **Dáta na iOS Safari** (vysoké riziko, jediná kópia dát): povinná inštalácia na plochu na iPhone (D-042), overenie na reálnom iPhone pred M2, pripomienka zálohy po 7 dňoch (FR-19, D-035). [predpoklad, overiť].
- **Právne riziko rozsahov v MVP:** rozsahy výnosu (2–6 %) a výberu (3–4 %) sa zobrazujú už vo Fáze 1, kým právne posúdenie je brána pre Fázu 2 (D-028). Prijaté zakladateľom; mitigácia: viditeľné predpoklady a upozornenie, že ide o odhad, nie o radu.
- **Hotovosť 0 % reálne:** predpoklad, že hotovosť len drží kúpnu silu, je konzervatívny vo výnose, ale nezachytí infláciu nad rámec predpokladu. Viditeľné v UR-09 (D-036).
- **Chyba vo vzorci** by viedla k zlému rozhodnutiu. Mitigácia: GC testy, NPER overenie, property testy.
- **Pretiahnutý rozsah** („všetko v jednom“, D-003). Mitigácia: MVP je presne to, čo je v milníkoch; čokoľvek navyše ide do backlogu.
- **Motivácia a kapacita** pri osobnom projekte. Mitigácia: malé milníky s jasným koncom.

## 5. Fáza 1b – Pilot (3 mesiace)
- **Používanie:** týždenné zadávanie a tri po sebe idúce mesačné vyhodnotenia.
- **Zber dát:** denník zmätkov, počet dotykov, čo bolo nejasné, každé nezrovnalé číslo.
- **Výstupy:** nové rozhodnutia D-xxx, úpravy FR a UX, backlog pre fázu 2.
- **Výstupné kritérium:**
  - tri vyhodnotenia bez blokujúcej chyby;
  - žiadna neočakávaná zmena čísla;
  - história rozhodnutí je úplná;
  - aspoň jeden round trip export → import na reálnych (anonymizovaných) dátach.
- **Čo pilot overí:** či sú odporúčania a predvolené hodnoty zrozumiteľné a či sa predbežný dopad dá pochopiť bez vysvetlenia. Výnos sa za 3 mesiace overiť nedá.

## 6. Fáza 2 – EÚ webový produkt

**Brány (musia byť splnené pred začiatkom):**
1. **Právne posúdenie:** hranica investičného poradenstva (MiFID II), GDPR (správca, právny základ, práva dotknutých osôb), spotrebiteľské právo, rozdiely medzi krajinami a odporúčania predvolených hodnôt (napr. 3–3,5 % pri skorom odchode; D-028, M6).
2. **Monetizácia:** otvorený bod z `00_Project_Vision` (zatiaľ nerozhodnuté).
3. **Účty a synchronizácia:** cloud alebo lokálne; s tým spojené rozhodnutie o šifrovaní (odložené z MVP).
4. **Persony EÚ:** definované v `01_Personas` a overené rozhovormi s cieľovou skupinou (07 oddiel 10).

**Milníky (predbežne):**
- viacmenovosť (EUR a lokálne meny) a preklady textov;
- účty a prihlásenie;
- synchronizácia a šifrované zálohy;
- nástroje GDPR: export údajov používateľa, vymazanie účtu;
- onboarding pre nových používateľov;
- podpora a dokumentácia pre používateľov.

**Architektúra:** pribudne backend (API, autentifikácia, úložisko na serveri). Doménová vrstva `domain/` zostane nezmenená; to je hlavný dôvod, prečo sme ju oddelili (05 oddiel 3).

**Riziká:** nová zodpovednosť za dáta na serveri, GDPR, rast nákladov na prevádzku a údržbu.

## 7. Fáza 3 – Mobilná appka a integrácie

**Brány:**
- **Prístup k bankovým dátam:** PSD2 vyžaduje licencovaného poskytovateľa alebo spoluprácu s agregátorom. Rozhodnutie o spôsobe.
- **Investičné aplikácie:** zmluvy alebo technický prístup od poskytovateľov.
- **Bezpečnostný audit** pred napojením na citlivé dáta.

**Milníky (predbežne):**
1. natívna mobilná appka nad zdieľanou doménovou vrstvou;
2. **import výpisov (CSV)** ako prvý krok – nevyžaduje licenciu a prináša väčšinu hodnoty [predpoklad, zvážiť];
3. napojenie na bankový účet (po splnení brány);
4. napojenie na investičné aplikácie (po splnení brány).

## 8. Zámerne mimo plánu
- graf projekcie podľa výnosu a inflácie (odložený, D-008);
- daňové výpočty (mimo MVP, D-008 a 04 oddiel 6);
- odporúčanie konkrétnych produktov (vylúčené, D-007).

## 9. Rozhodnutia potrebné pred ďalšími krokmi

| Kedy | Rozhodnutie | Kto |
|---|---|---|
| pred M5 | hosting (GitHub Pages, alebo iný) | zakladateľ |
| pred M2 | overenie uchovania dát na reálnom iPhone (plocha, neaktivita); plocha na iPhone povinná (D-042) | zakladateľ |
| pred fázou 2 | monetizácia, právne posúdenie, účty a šifrovanie | zakladateľ, právnik |
| po M1 | presnejší odhad trvania milníkov podľa tempa | zakladateľ |

## 10. Metriky úspechu [predpoklad]
- **Fáza 1:** tri po sebe idúce mesačné vyhodnotenia; nula strát dát; transakcia do 20 sekúnd.
- **Fáza 1b:** úplná história rozhodnutí; žiadna neočakávaná zmena čísla.
- **Fáza 2:** aktívni používatelia po 30 dňoch, miera návratov, nula incidentov s ochranou údajov.

## 11. Otvorené otázky
Zodpovedané: kapacita (hodiny denne) a zariadenie (iPhone 16, iOS 26.6.2, viď 07 oddiel 8).

1. **Fáza 3:** chceš ju plánovať podrobnejšie už teraz, alebo až po pilote?

---

<!-- ===== docs/07_Testing_Strategy.md ===== -->

# 07 – Testovacia stratégia (MVP)

> Stav: v0.6 (2026-10-14). Pokrýva `04_Functional_Requirements` (FR), `03_UX_Principles` (UX) a `05_Technical_Architecture`. **[predpoklad]** = návrh Claude, treba potvrdiť.

## 1. Priority testovania
Stratégia sa riadi rizikom. Chyba v jednej z týchto oblastí má väčšiu váhu než chyba v ostatných:

| Oblasť | Riziko | Dôsledok chyby | Úroveň testov |
|---|---|---|---|
| Správnosť cieľa a dátumu | zlý vzorec, zaokrúhľovanie, mesiace | používateľ robí rozhodnutia na zlom čísle | jednotkové, property-based, porovnanie so simuláciou, tabuľkové overenie |
| Integrita dát | strata alebo poškodenie transakcií | nenávratná strata histórie rozhodnutí | úložisko, export/import round trip, atomicita |
| Súkromie | nechtené odosielanie dát | únik citlivých finančných údajov | sieťové testy, kontrola závislostí |
| Použiteľnosť na telefóne | zlé dotykové plochy, dlhé toky | vyššia záťaž, opustenie appky | E2E na mobilných viewportoch, používateľské testy |
| Dostupnosť | čítačky, klávesnica, kontrast | používateľ nemôže dokončiť úlohu | axe-core, manuálne testy s čítačkou |
| Offline a inštalácia | PWA sa nespustí bez siete | nefunkčná appka v chvíli potreby | E2E offline, manuálna inštalácia |

## 2. Úrovne testov
1. **Jednotkové (Vitest)** – čisté funkcie v `domain/` (FR-01 až FR-05, FR-07, FR-08). Cieľ: všetky vetvy výpočtov pokryté [predpoklad].
2. **Property-based (fast-check)** – invarianty z oddielu 4.
3. **Porovnávacie** – uzavretý vzorec vs. mesačná simulácia (oddiel 3; simulácia zatiaľ nie je spustená, doplní sa v M1).
4. **Úložisko (Vitest + fake-indexeddb)** – CRUD, migrácie, import/export, atomicita.
5. **Komponentové (React Testing Library)** – formuláre, validácie, texty predbežného dopadu, pripomienky, prázdne stavy.
6. **End-to-end (Playwright)** – kľúčové toky z `03_UX` (prvé nastavenie, týždenné zadanie, mesačné vyhodnotenie, záloha), na mobilných viewportoch, aj offline.
7. **Dostupnosť** – axe-core na každej obrazovke v komponentových aj E2E testoch; manuálne čítačky (oddiel 9).
8. **Súkromie a bezpečnosť** – sieťové testy, npm audit, CSP (oddiel 7).
9. **Používateľské** – self-test zakladateľa a checklist kognitívnej záťaže (oddiel 10).

**Pokrytie požiadaviek bez výpočtovej GC (doplnené po revízii):**

| Požiadavka | Test | Typ |
|---|---|---|
| FR-06 Formát | zobrazenie sumy v celých eurách, mesiace celé čísla, dátum slovensky („marec 2038“) | jednotkový |
| FR-11 Pripomienka | pripomienka na konci mesiaca bez vyhodnotenia; vypnutie v nastaveniach; systémová notifikácia len po povolení | komponentový |
| FR-13 Odporúčania | odporúčanie je označené odlišne od vlastnej hodnoty; vrátenie odporúčanej hodnoty jedným úkonom | komponentový |
| FR-14 Prehľad | cieľ, dátum ako rozsah od D_L, zostávajúci čas, predbežný dopad, dátum posledného vyhodnotenia | komponentový, E2E |
| FR-15 História | zoradenie od najnovšej, filter podľa typu a obdobia, súčty za obdobie | komponentový |
| FR-19 Pripomenutie zálohy | banner po 7 dňoch bez exportu alebo ak sa nikdy neexportovalo; zmizne po exporte | komponentový |
| D-030 výdavok pod prahom | uložený s príznakom, zahrnutý do predbežného dopadu (prehľad spotreby odložený, D-038) | jednotkový, komponentový |
| FR-04 zobrazenie pod 1 mesiac | dopad 100 € (≈ 0,12 mesiaca) sa zobrazí v dňoch, nie ako „bez zmeny“ | jednotkový |
| M2 dátum vyhodnotenia | dátum v budúcnosti sa odmietne; predvolená hodnota je min(koniec mesiaca; dnes) | jednotkový, komponentový |
| FR-01 neplatný vstup | V ≤ 0 alebo p ≤ 0: výpočet sa nespustí, zobrazí sa výzva na opravu | jednotkový |
| FR-05 transakcia s dátumom ≤ D_L | nepridá sa znovu do K_L | jednotkový |
| FR-07 prah ako filter | výdavok pod prahom sa uloží s príznakom a zobrazí sa podľa filtra | komponentový |
| FR-09 úprava a mazanie | prepočíta sa len predbežný dopad; mazanie ponúka vrátenie späť | komponentový |
| FR-10 pripomienka | pripomienka sa zobrazí po konci mesiaca bez vyhodnotenia, nie len text o dátume | komponentový |
| FR-12 prvé nastavenie | bez vyhodnotenia sa zobrazí výzva „urobte prvé vyhodnotenie“, nie dátum | komponentový, E2E |
| Stav „Nezadané“ | chýbajúci údaj sa zobrazí ako „Nezadané“, nie ako nula | komponentový |
| D-037 rezerva | sporenie do rezervy sa nezapočíta do m ani do K; zobrazí sa ako stav rezervy | jednotkový |
| UR-09 Predpoklady | na obrazovke výpočtu sú viditeľné pravidlo 4 %, reálny výnos a upozornenie bez daní a poplatkov | komponentový |

## 3. Zlaté prípady (golden cases)
Hodnoty sú overené uzavretým vzorcom (FR-02). GC-03 a GC-07 sú navyše overené tabuľkovou funkciou NPER (viď nižšie). Mesačná simulácia a overenie ostatných prípadov nie sú zatiaľ spustené; doplnia sa v M1. Prípady budú uložené v `tests/golden/goal-cases.json` a každý bude mať odkaz na požiadavku.

| ID | Vstup | Očakávaný výsledok | Zdroj |
|---|---|---|---|
| GC-01 | V = 24 000 €, p = 4 % | T = 600 000 € | FR-01 |
| GC-02 | V = 24 000 €, p = 3 % | T = 800 000 € | FR-01, D-011 |
| GC-03 | K = 100 000, m = 500, r = 4 %, T = 600 000 | n = 333,92 → **334 mesiacov** | FR-02 |
| GC-04 | K = 105 000 (predbežne), m = 500, r = 4 % | n = 327,93 → **328**; dopad **+6 mesiacov skôr** | FR-04 |
| GC-05 | K = 100 000, m = 500, r = 6 % (optimistický) | n = 256,01 → **257** | FR-03 |
| GC-06 | K = 100 000, m = 500, r = 2 % (opatrný) | n = 489,11 → **490** | FR-03 |
| GC-07 | K = 100 000, m = 0, r = 4 % | n = 548,21 → **549** (≈ 45,7 roka, dátum sa zobrazí, pretože je do 50 rokov) | FR-02, D-019 |
| GC-08 | K = 0, m = 0, r = 4 % | bez dátumu: „Pri súčasnom sporení a výnose sa cieľ nedosiahne“ | D-019 |
| GC-09 | K = 0, m = 500, r = 4 % | n = 488,02 → **489** | FR-02 |
| GC-10 | K = 100 000, T = 600 000, m = 500, r = 0 % | n = (T − K) / m = **1 000** (presne celé číslo; `ceil(n − 1e-6)` musí dať 1 000, nie 1 001) | FR-02 |
| GC-11 | K_L ≥ T | cieľ dosiahnutý, dátum = D_L (dátum posledného vyhodnotenia) | FR-02, D-024 |
| GC-12 | K = 100 000, m = 500, r = 4 %, T = 2 000 000 | n ≈ 655,4 → **656 mesiacov** (≈ 54,6 roka); zobrazí sa „viac ako 50 rokov“ | FR-02, D-019 |
| GC-13 | D_L = 2026-10-14, K = 100 000, m = 500, r = 4 %, T = 600 000; dnes = 2026-12-14 (bez nového vyhodnotenia) | dátum cieľa **nezmenený**: august 2054 (interne 2054-08-14 = D_L + 334 mesiacov); zostávajúci čas = **332 mesiacov** | D-024, FR-02 |
| GC-14 | D_L = 2026-10-14, K = 100 000, m = 500, r = 4 %, T = 600 000; dnes = 2055-01-01 (po dátume cieľa) | „Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie“; žiadny záporný čas; dátum sa nemení | FR-10, D-024 |
| GC-15 | K_L = 100 000, m = 500, r = 4 %, T = 600 000; po D_L dva výdavky z kapitálu po 60 000 € | K_pred = max(0; −20 000) = **0**; dopad = n(K_L) − n(0) = 333,92 − 488,02 = **−154 mesiacov** (zaokrúhlené; N1: surový rozdiel); text „Hotovosť nestačila; kapitál je 0 €“, žiadny záporný kapitál | FR-04, FR-08, H2 |
| GC-16 | sporenie 500 € v každom z troch mesiacov pred D_L, žiadne staršie transakcie | m = 1 500 / 3 = **500** (nie 125; D-031) | D-031 |
| GC-17 | D_L = 2026-10-14, K_inv = 50 000, K_cash = 60 000, m = 500, r = 4 %, T = 100 000 | K_L = 110 000 ≥ T → cieľ dosiahnutý, dátum = D_L (hotovosť sa počíta v K) | FR-02, D-036 |
| GC-18 | D_L = 2026-10-14, K_inv = 90 000, K_cash = 5 000, m = 500 (investícia, m_inv), r = 4 %, T = 100 000 | T′ = T − K_cash = 95 000; n ≈ 6,24 → **7 mesiacov** (dátum D_L + 7 mesiacov) | FR-02, D-036, D-039 |
| GC-19 | V = 24 000 €, K_cash = 20 000 €, rezerva = 3 × 2 000 = 6 000 €, výdavok 15 000 € z hotovosti | zostatok 5 000 € < rezerva 6 000 € → upozornenie a ponuka „z investícií“; výdavok z investícií je povolený | FR-08, D-045 |
| GC-20 | K_inv = 100 000, K_cash = 0, m_inv = 0, m_cash = 500, r = 4 %, T = 600 000 | n ≈ 417,42 → **418 mesiacov** (iterácia po celých mesiacoch, D-046); pri m_cash = 0 je uzavretý tvar 333,92 | D-046 |
| GC-21 | ako GC-20, ale K_cash = 100 € navyše | dopad = 417,42 − 417,36 ≈ **0,06 mesiaca ≈ 1,7 dňa** (interpolácia); zobrazí sa v dňoch | FR-04, D-046 |
| GC-22 | vklad do rezervy 6 000 €, potom výber z rezervy 1 000 € | stav rezervy = 6 000 − 1 000 = **5 000 €** (vklady mínus výbery); K sa nemení | D-047 |

**Overenie tabuľkou (NPER):** `NPER(i; −m; −K; T; 0)`, kde `i = (1 + r)^(1/12) − 1`. Výsledok musí zodpovedať n z FR-02. Hodnoty GC-03 a GC-07 sú overené touto metódou. Pri GC-08 funkcia nevráti číslo, čo je očakávané.

**Tolerancia:** porovnávame celé mesiace po `ceil(n − 1e-6)`; interné hodnoty n sa porovnávajú s presnosťou 1e-6.

## 4. Invarianty (property-based testy)
Pre náhodné vstupy (K ∈ [0, 10 000 000], m ∈ [0, 10 000], r ∈ [0; 0,10], T ∈ [1 000; 10 000 000]):
- **Hraničná podmienka:** pre n = `monthsToTarget(...)` platí K_uzavretý(⌈n − 1e-6⌉ − 1) < T ≤ K_uzavretý(⌈n − 1e-6⌉), kde K_uzavretý(k) = K·(1+i)^k + m·((1+i)^k − 1)/i je kapitál po k mesiacoch (D-024) pre i > 0; pre i = 0 (r = 0) je K_uzavretý(k) = K + m·k. Property test pokrýva r = 0 samostatne (K2). Toto je presnejšie než porovnanie so simuláciou a zachytí chybu v zaokrúhľovaní.
- **Nezápornosť:** K_pred ≥ 0 pre ľubovoľnú postupnosť výdavkov z kapitálu po D_L (H2).
- **Monotónnosť:** n nerastie so zvyšovaním K, m alebo r; n nerastie s klesaním T.
- **Predbežný dopad:**
  - bez transakcií po poslednom vyhodnotení je dopad 0;
  - výdavok „z príjmu“ nemení n;
  - sporenie alebo investícia nikdy nezhorší dátum (n_pred ≤ n_base);
  - výdavok „z kapitálu“ nikdy nezlepší dátum (n_pred ≥ n_base).
- **Peniaze:** všetky sumy v úložisku sú celé čísla (centy); súčty sa nerobia v plávajúcej desatinnej čiarke.

## 5. Dátum a čas
- Dátumy sa ukladajú ako `YYYY-MM-DD` bez časovej zóny; test, že sa pri prechode na letný čas (Europe/Bratislava) dátum neposúva o deň.
- Hranice mesiaca: transakcia dňa 31. a vyhodnotenie dňa 30. (FR-05, „≤ dátum vyhodnotenia“); priestupný rok (29. 2.).
- Dátum cieľa = D_L + ⌈n − 1e-6⌉ mesiacov (D-024) s **orezaním na posledný deň cieľového mesiaca** (31. 1. + 1 mesiac = 28. 2.). Test s falošnými hodinami (fake timers) pre dni 1., 28., 29., 30. a 31.
- Pripomienka konca mesiaca sa testuje s nastavenou časovou zónou.

## 6. Dáta a úložisko
| Scenár | Očakávané správanie | Typ |
|---|---|---|
| Prázdne úložisko po vymazaní prehliadačom | prázdny stav s výzvou na import zálohy, žiadne tiché obnovy | E2E |
| Import neplatného JSON | chyba, žiadna zmena dát | jednotkový |
| Import s neznámym poľom alebo nadmernou veľkosťou | odmietnutie, žiadna zmena | jednotkový |
| Import so zápornou sumou, budúcim dátumom alebo chýbajúcim poľom | odmietnutie s konkrétnou správou, žiadna zmena | jednotkový |
| Import súboru s vyššou verziou schémy | odmietnutie s vecnou správou | jednotkový |
| Import zlyhá uprostred zápisu | celá transakcia sa zruší, pôvodné dáta zostanú | úložisko |
| Úložisko plné (`QuotaExceededError`) | správa, žiadny čiastočný zápis, ponuka exportu | úložisko |
| Export → import → export | výstupy sú zhodné (okrem `exportedAt`) | round trip |
| Zálohy vo verzii 1 zostanú čitateľné aj po budúcich zmenách | fixture `tests/fixtures/export-v1.json` sa importuje v každom vydaní | regresia |
| Dve karty naraz | zápis v jednej karte sa prejaví v druhej (BroadcastChannel); žiadne prepísanie | manuálny, neskôr E2E |

**Riziko iOS Safari [predpoklad, overiť aktuálne správanie]:** Safari môže po dlhšom nepoužívaní webu vymazať dáta uložené skriptom vrátane IndexedDB, ak aplikácia nie je pridaná na plochu. Test: manuálne na reálnom iPhone (pridanie na plochu, neskoré otvorenie). Mitigácia: odporúčanie pridať na plochu v prvom nastavení a pripomienka zálohy (FR-19).

**Pravidlo pre fixtures:** v repozitári sú len anonymizované alebo syntetické dáta. Žiadne reálne finančné údaje.

## 7. Súkromie a bezpečnosť
- **Sieťový test:** Playwright zachytí všetky požiadavky počas kľúčových tokov. Povolený je len pôvod aplikácie. Zakázané sú externé volania, vrátane externých fontov (MVP ich nepoužíva, písma sú lokálne).
- **Logy:** v produkcii sa nelogujú sumy ani transakcie. Test: lint pravidlo alebo kontrola kódu proti `console.log` nad doménovými dátami.
- **Export:** obsahuje varovanie o citlivých údajoch (FR-17); test prítomnosti textu.
- **Závislosti:** `npm audit` v CI; kontrola licencií.
- **CSP:** test meta tagu bez `unsafe-inline` pre skripty; hlavičky sa netestujú, lebo GitHub Pages ich nenastavuje (S4).

## 8. Zariadenia a prehliadače
| Prostredie | Typ testu | Kedy |
|---|---|---|
| Android Chrome, emulácia viewportu 412 × 915 | automatizované E2E | každý PR |
| iOS Safari, emulácia viewportu 390 × 844 | automatizované E2E (WebKit) | každý PR |
| Reálny iPhone 16 (iOS 26.6.2) | manuálny checklist: plocha a neaktivita (IndexedDB po 7 dňoch bez použitia), dotyky, offline, Safari úložisko | pred M2 a pred každým vydaním |
| Reálny Android (zariadenie k dispozícii; model a verzia systému sa doplnia) | manuálny checklist: dotyky, inštalácia na plochu, offline | pred každým vydaním |
| Desktop Chrome, Firefox, Safari | základné toky | pred vydaním |
| Viewporty 360, 390, 768, 1280 px | bez horizontálneho scrollu, čitateľnosť | každý PR |
| Zoom 200 % a najväčšie systémové písmo | žiadna stratená informácia | pred vydaním |

**Kontrolné body:** dotykové plochy aspoň 44 × 44 px [predpoklad]; žiadny horizontálny scroll; offline tok funguje po prvom načítaní.

## 9. Dostupnosť (WCAG 2.2 AA)
- axe-core: nulové kritické a vážne porušenia pre zlúčenie.
- Klávesnica: všetky akcie dosiahnuteľné, viditeľný focus.
- Čítačky: manuálny checklist pre VoiceOver (iOS) a TalkBack (Android) pri každom vydaní.
- Kontrast: text aspoň 4,5 : 1, ovládacie prvky aspoň 3 : 1, rovnako v tmavom režime.
- Význam nie je len farbou: predbežný dopad je text, nie len zelená alebo červená.

## 10. Používateľské testovanie a kognitívna záťaž
- **Self-test:** po každom milníku (M3, M4) aplikáciu používam týždeň a vediem denník: čo ma zmiatlo, koľkokrát som sa musel vrátiť.
- **Metriky [predpoklad]:**
  - zadanie transakcie do 20 sekúnd a do 5 dotykov (bez poznámky);
  - mesačné vyhodnotenie do 3 minút;
  - čísla sa menia len po transakcii alebo vyhodnotení, nikdy inak (invariant z UX princípu 4).
- **Checklist záťaže** pri každej obrazovke: jedna hlavná úloha, predvolené hodnoty, žiadny žargón bez vysvetlenia, žiadne vyčítavé formulácie (UX princípy 1, 2 a 7).
- **Pre fázu 2:** rozhovory s 3–5 ľuďmi z cieľovej skupiny EÚ (mimo rozsahu MVP, povinné pred rozšírením).

## 11. Výkon
- Výpočty v `domain/`: pod 50 ms pre celý prepočet.
- Štart aplikácie: do 2 sekúnd na strednom Androide [predpoklad].
- Záťažový test: 5 000 transakcií (desiatky rokov aktívneho používania) bez spomalenia zoznamu histórie.

## 12. Prostredie, automatizácia a CI
- **Lokálne pred commitom:** lint, typový kontrola, jednotkové testy zmenených modulov [predpoklad: husky].
- **Pri každom PR (GitHub Actions):** lint, typecheck, jednotkové, komponentové, npm audit, axe-core.
- **Pri zlúčení do main:** plné E2E (Android a iOS viewport, offline), sieťový test súkromia.
- **Nasadenie** až po zelenom výsledku všetkých kontrol.
- **Reprodukovateľnosť:** lock file, pevné verzie závislostí.

## 13. Definícia hotového (Definition of Done)
**Funkcia je hotová, keď:**
- prejdú jednotkové, komponentové a E2E testy pre jej tok;
- axe-core nehlási vážne porušenia;
- je overená na mobilnom viewporte;
- dokumenty sú aktualizované (verzia, odkazy na D-xxx);
- rozhodnutia sú zapísané v `decisions/Decisions.md`.

**Vydanie je hotové, keď:**
- všetky automatizované kontroly sú zelené;
- manuálny checklist na reálnom iPhone 16 aj na reálnom Androide je podpísaný v dokumente vydania;
- prebehol round trip export → import na reálnych dátach (anonymizovaných);
- offline tok a inštalácia na plochu fungujú;
- self-test za posledný týždeň neobsahuje blokujúcu chybu.

## 14. Mimo rozsahu MVP
Bankové a investičné integrácie, viacužívateľské scenáre, daňové výpočty, graf projekcie (odložený, D-008), právne texty a ich overenie.

## 15. Otvorené otázky
Zodpovedané:
- **Zariadenia:** iPhone 16 (iOS 26.6.2) a Android zariadenie (model a verzia systému sa doplnia).
- **O-6 (D-021):** výdavok z kapitálu väčší než kapitál sa rieši upozornením a ponukou zmeny na „z príjmu“.

Otvorené:
- **Riziko iOS Safari:** rozhodnuté (D-042): plocha je na iPhone povinná. Overenie na reálnom iPhone pred M2 (nie po M2).

---

<!-- ===== decisions/Decisions.md ===== -->

# Rozhodnutia

| ID | Dátum | Rozhodnutie | Dôvod |
|----|-------|-------------|-------|
| D-001 | 2026-10-13 | Projekt je samostatný a nenadväzuje na existujúce projekty. | Voľný štart; prevzatie z iných projektov len vedome. |
| D-002 | 2026-10-13 | Názov „Finančná sloboda“ je pracovný. | Predpoklad zmeny názvu. |
| D-003 | 2026-10-13 | Finančná sloboda = nezávislosť od zamestnania; produkt spája sporenie, investovanie a cielenú spotrebu v jednom balíku. | Zadanie zakladateľa. |
| D-004 | 2026-10-13 | Cieľ sa dynamicky prepočítava po každom čiastkovom rozhodnutí a každé rozhodnutie sa zaznamenáva. | Zadanie zakladateľa. |
| D-005 | 2026-10-13 | Fáza 1: len pre zakladateľa; fáza 2: používatelia v EÚ. | Zadanie zakladateľa. |
| D-006 | 2026-10-13 | „Rozhodnutie“ = transakcia (typy: sporenie, investícia, výdavok, rezerva; D-037). | Zadanie zakladateľa. |
| D-007 | 2026-10-13 | Produkt nevyberá ani neodporúča investície; počíta s výnosom existujúcej investície používateľa. Cieľ si nastaví používateľ s podporou odporúčaní. | Zadanie zakladateľa; rozsah odporúčaní treba potvrdiť. |
| D-008 | 2026-10-13 | MVP počíta cieľ podľa pravidla 4 % (ročné výdavky × 25) s viditeľnými predpokladmi; projekcia podľa výnosu a inflácie je odložená. | Jednoduchosť pre MVP; zadanie zakladateľa. |
| D-009 | 2026-10-13 | MVP je webová aplikácia s ručným zadávaním transakcií a lokálnym ukladaním dát (s exportom/importom). Neskôr mobilná aplikácia s integráciami na banku a investičné aplikácie. | Jednoduchosť a ochrana citlivých dát v osobnej fáze; zadanie zakladateľa. |
| D-010 | 2026-10-13 | Existujúca investícia sa v MVP zadáva ručne: aktuálna hodnota a predpokladaný ročný výnos (viditeľný predpoklad). | Jednoduchosť; bez trhových dát. |
| D-011 | 2026-10-13 | Odporúčania pri nastavení cieľa: parametre a predvolené hodnoty podľa tabuľky vo vízii v0.9 (výdavky, miera výberu 4 % [3–4 %], reálny výnos 4 % [2–6 %], mesačné sporenie, rezerva 3 mesiace [3–6]). MVP ukazuje aj odhadovaný dátum cieľa ako rozsah. | Potvrdené zakladateľom; číselné hodnoty treba overiť v zdrojoch. |
| D-012 | 2026-10-13 | MVP je mobile-first (telefón), používanie týždenne; evidujú sa len výdavky nad prahovú sumu (100–500 €), prah je parameter. Upresnené D-030: všetky výdavky sa ukladajú s príznakom; prah je filter. | Zadanie zakladateľa. |
| D-013 | 2026-10-13 | Ročné výdavky v dôchodku zadáva používateľ ručne; mesačné sporenie sa odvodzuje z transakcií sporenie/investícia; prah platí len pre výdavky, predvolene 100 €; evidovaný výdavok znižuje kapitál len vtedy, ak je hradený z kapitálu (upresnené D-014 a FR-08) (cieľová suma sa nemení). Upresňuje D-011. | Potvrdené zakladateľom; vyriešený konflikt prahu a odvodzovania výdavkov. |
| D-014 | 2026-10-13 | Pri výdavku sa volí zdroj úhrady (predvolene z príjmu; z kapitálu znižuje kapitál). Kapitál sa oficiálne prepočítava raz mesačne na konci mesiaca (hodnota investícií + sporenie zadáva používateľ); po transakcii sa ukáže len predbežný dopad ako krátky text bez farieb. Upresňuje D-004 a D-013. | Potvrdené zakladateľom; nižšia záťaž, menej výkyvov. |
| D-015 | 2026-10-13 | Externý reviewer dokumentov je aplikácia Claude (nahradila ChatGPT). | Rozhodnutie zakladateľa. |
| D-016 | 2026-10-13 | UX MVP: rozsah dátumov ako text „od – do“ (graf neskôr); svetlý/tmavý režim podľa systému; pri vynechanom mesačnom vyhodnotení jemná pripomienka a viditeľný dátum posledného vyhodnotenia, bez automatických zmien; po vyhodnotení jedna veta o rozdiele oproti predbežnému dopadu. | Zadanie zakladateľa; štvrtá otázka navrhnutá Claude a schválená zakladateľom. |
| D-017 | 2026-10-13 | FR: rezerva nie je v kapitáli ani v cieli; výdavky pod prahom sa neukladajú; mesačné sporenie = súčet sporenia a investícií za 12 mesiacov ÷ 12. | Potvrdené zakladateľom (O-1, O-2, O-4). |
| D-018 | 2026-10-13 | Import zálohy nahradí aktuálne dáta až po potvrdení; zlúčenie sa môže doplniť neskôr. | Potvrdené zakladateľom (O-3). |
| D-019 | 2026-10-13 | Dátum cieľa sa zobrazuje do 50 rokov; ďalej „viac ako 50 rokov“. Bez kapitálu a sporenia: „Bez sporenia a výnosu sa cieľ nedosiahne“. | Potvrdené zakladateľom (O-5). |
| D-020 | 2026-10-13 | Technológia MVP: statická PWA (TypeScript, React, Vite), IndexedDB, bez servera; výpočty v čistej doménovej vrstve oddelenej od UI a úložiska. | Potvrdené zakladateľom; lokálne dáta (D-009), offline a neskorší prechod na mobil. |
| D-021 | 2026-10-14 | Výdavok z kapitálu väčší než nasporený kapitál: pri zadaní upozornenie a ponuka zmeny na „z príjmu“; ak používateľ potvrdí „z kapitálu“, kapitál sa počíta ako 0 a zobrazí sa „kapitál by bol vyčerpaný“. | Potvrdené zakladateľom (O-6). |
| D-022 | 2026-10-14 | Poradie: najprv externá revízia dokumentov (balík `review/review-package-2026-10-14.md`), až potom M1 (doménová vrstva). | Rozhodnutie zakladateľa; revízia môže zmeniť vzorce alebo GC prípady, ktoré by M1 inak natvrdo zakódoval. |
| D-023 | 2026-10-14 | Vetvenie: dokumenty a rozhodnutia ostávajú priamo na `main`; kód (M1 a ďalšie milníky) ide na samostatnú vetvu a na `main` sa zlúči až po zelených testoch. | Rozhodnutie zakladateľa. |
| D-024 | 2026-10-14 | Referenčný dátum cieľa: dátum cieľa sa počíta od dátumu posledného vyhodnotenia (D_L), nie od dneška. Mení sa len pri novom vyhodnotení; zostávajúci čas sa počíta od dneška. Ak dátum uplynie bez vyhodnotenia, zobrazí sa „Dátum vypršal, urobte vyhodnotenie“ a dátum sa nepreposúva. Výnos medzi vyhodnoteniami sa na K_L nepripisuje (dátum je konzervatívny). | Potvrdené zakladateľom (revízia, nález 1). Upresňuje FR-02, FR-03, FR-04, FR-10, FR-12, FR-14 a D-014. |
| D-025 | 2026-10-14 | Výnos r (predvolene 4 %) sa uplatňuje na celý kapitál K vrátane nasporenej sumy; sadzbu si nastavuje používateľ sám. Samostatná sadzba pre hotovosť v MVP nie je; zjednodušenie je viditeľné ako predpoklad (UR-09). | Potvrdené zakladateľom (revízia, nález 4): „pracujme so 4 %, toto si používateľ nastaví sám“. |
| D-026 | 2026-10-14 | Šifrovanie dát v kľude v MVP nie je. Dáta sú chránené sandboxom prehliadača a zámkom zariadenia; export pripomína citlivosť údajov (FR-17). Šifrovanie sa rieši pred Fázou 2 (účty a synchronizácia). | Rozhodnutie zakladateľa (revízia, nález 4); uzatvára otvorenú otázku z 05 §11 a 06 §9. |
| D-027 | 2026-10-14 | Notifikácie: systémová notifikácia je najviac jedna mesačná pripomienka (UX princíp 2). Upozornenia v aplikácii (banner po zálohe podľa FR-19 a pri vynechanom vyhodnotení podľa FR-10) nie sú systémové notifikácie a sú výnimkou z tohto pravidla. | Rozhodnutie zakladateľa (revízia, nález 9). |
| D-028 | 2026-10-14 | Právne posúdenie zostáva bránou pre Fázu 2. Rozsahy výnosu (2–6 %) a výberu (3–4 %) sa zobrazujú už v MVP a riziko je zapísané v 06 §4. | Rozhodnutie zakladateľa (revízia, nález 13): riziko prijaté, posúdenie sa nepresúva. |
| D-029 | 2026-10-14 | Vízia: dynamický cieľ sa prepočíta pri každom mesačnom vyhodnotení (D-014); po každom rozhodnutí sa ukazuje len predbežný dopad (D-024). Upresňuje D-004 a text vízie. | Rozhodnutie zakladateľa (revízia, nález 3). |
| D-030 | 2026-10-14 | Výdavky pod prahom sa ukladajú s príznakom „pod prahom“ (ruší D-017 O-2 pre ukladanie). Zahrnú sa do predbežného dopadu (prehľad spotreby odložený, D-038; M7). Prah zostáva len filtrom zobrazenia a predvolenou hodnotou 100 €. | Rozhodnutie zakladateľa (revízia, H1 a M7). |
| D-031 | 2026-10-14 | Mesačné sporenie m = súčet sporenia a investícií za 12 mesiacov, ktoré končia pri D_L (posledné vyhodnotenie), delený počtom mesiacov histórie, ak je menej ako 12 mesiacov. Upresňuje D-017 O-4 (okno aj delenie). | Rozhodnutie zakladateľa (revízia, H3). |
| D-032 | 2026-10-14 | Výnos r je jeden globálny predpoklad pre celý kapitál (potvrdzuje D-025). Investícia sa zadáva len hodnotou; výnos sa neviaže na jednotlivé investície. Upresňuje UR-03 a D-010. | Rozhodnutie zakladateľa (revízia, M3). |
| D-033 | 2026-10-14 | Nasporená suma pri vyhodnotení je kumulatívny stav hotovosti (nie prírastok). Transakcie s dátumom pred D_L sa do K nepripočítavajú (FR-05). | Rozhodnutie zakladateľa (revízia, M5). |
| D-034 | 2026-10-14 | Inštalácia na plochu (iPhone) je odporúčaný krok prvého nastavenia, nie povinný (od D-042 povinný na iPhone). Riziko vymazania dát v IndexedDB zostáva zapísané a overí sa na reálnom iPhone pred M2. | Rozhodnutie zakladateľa (revízia, H4). |
| D-035 | 2026-10-14 | Pripomienka zálohy a banner po **7 dňoch** bez exportu (nie 14). Pri prvom nastavení sa silne odporúča pridať appku na plochu; nie je povinné. Dôvod: WebKit obmedzuje skriptovateľné úložisko v Safari na 7 dní bez interakcie; aplikácie na ploche majú vlastné počítadlo. Upresňuje D-034. | Rozhodnutie zakladateľa (revízia, V2). |
| D-036 | 2026-10-14 | Hotovosť má vlastnú sadzbu, predvolene 0 % reálne; investovaný kapitál má r (predvolene 4 %). Upresňuje D-025 a D-032. Zapracované do FR-02 (odsek Dvojaký kapitál); smer m je rozhodnutý v D-039. | Rozhodnutie zakladateľa (revízia, V1). |
| D-037 | 2026-10-14 | Sporenie do rezervy je samostatný typ transakcie „rezerva“. Nezapočítava sa do m ani do K, zobrazuje sa ako stav rezervy v mesiacoch výdavkov (V/12 × mesiace). | Rozhodnutie zakladateľa (revízia, V5). |
| D-038 | 2026-10-14 | Prehľad spotreby (pravidelná vs. cielená, O-7) je odložený do fázy 1b. V MVP nie je vo FR ani v milníku M3/M4. | Rozhodnutie zakladateľa (revízia, V4). |
| D-039 | 2026-10-14 | Mesačné sporenie m smeruje do investovaného kapitálu K_inv (zhodnocuje sa r). Hotovosť K_cash je pevná (0 % reálne, D-036). | Rozhodnutie zakladateľa (revízia, V1). |
| D-040 | 2026-10-14 | História pre m sa počíta od prvej transakcie. Okno 12 mesiacov končí pri D_L (D-031). | Rozhodnutie zakladateľa (revízia, V7). |
| D-041 | 2026-10-14 | Typ transakcie určuje kapitál: sporenie → K_cash (bez zhodnotenia), investícia → K_inv (zhodnocuje sa r). m_cash a m_inv sa počítajú osobitne. Upresňuje D-039. | Rozhodnutie zakladateľa (opätovná recenzia N2). |
| D-042 | 2026-10-14 | Pridanie appky na plochu je na iPhone **povinné** (nie odporúčané). Ruší odporúčanie v D-034 a D-035 v časti o povinnosti. | Rozhodnutie zakladateľa (opätovná recenzia N3). |
| D-043 | 2026-10-14 | Predvolená miera výberu zostáva 4 % aj pri skorom odchode, s upozornením, že pri dlhom horizonte je 3–3,5 % konzervatívnejšie. T je pred daňou a poplatkami. | Rozhodnutie zakladateľa (opätovná recenzia N8, V6). |
| D-044 | 2026-10-14 | Referenčný dátum D_L je vyhodnotenie s najneskorším dátumom vyhodnotenia, nie čas zápisu. Spätné vyhodnotenie s dátumom pred D_L nezmení D_L. | Rozhodnutie zakladateľa (opätovná recenzia N9). |
| D-045 | 2026-10-14 | Zdroj úhrady: výdavok z hotovosti (K_cash) sa smie znížiť najviac na rezervu (3 mesiace výdavkov, D-011); presah sa upozorní a ponúkne sa zdroj „z investícií“ (K_inv). Presun hotovosti do investícií (doinvestovanie) nie je výdavok: K sa nemení, K_cash klesne a K_inv vzrastie o rovnakú sumu, len ak hotovosť zostane nad rezervou. Uzatvára O-10. | Rozhodnutie zakladateľa (zadanie: reinvestovanie z K_inv, doinvestovanie z K_cash nad kritickú hranicu; hranica = rezerva). |
| D-046 | 2026-10-14 | Keď m_cash > 0, n sa počíta iteráciou po celých mesiacoch: najmenšie k, pre ktoré K_inv(k) + K_cash + m_cash·k ≥ T, kde K_inv(k) = K_inv·(1+i)^k + m_inv·((1+i)^k − 1)/i. Zlomok sa získa lineárnou interpoláciou medzi k−1 a k. Dopad pod mesiac sa zobrazuje v dňoch (interpoláciou), aj pri m_cash = 0. Uzatvára O-11. | Rozhodnutie zakladateľa (O-11: v dňoch, interpoláciou). Postup overený GC-20 a GC-21. |
| D-047 | 2026-10-14 | Stav rezervy = vklady mínus výbery. Vklad je transakcia typu „rezerva“, výber je transakcia typu „výber z rezervy“. Rezerva nie je v K a nezhodnocuje sa. Hranica pre výdavok z hotovosti (D-045) je tento stav. Upresňuje D-037. | Rozhodnutie zakladateľa (N5). |

---
