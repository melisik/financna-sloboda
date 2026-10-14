# Balík na externú revíziu – Finančná sloboda (pracovný názov)

Dátum: 2026-10-14. Verzie dokumentov sú v hlavičkách jednotlivých častí. Záznamy rozhodnutí sú na konci.

## Zadanie pre reviewera

Si nezávislý reviewer dokumentácie produktu. Nie si jej autor. Prečítaj všetky dokumenty nižšie a nájdi:

1. **Nekonzistentnosti** medzi dokumentmi a voči záznamom v `Decisions.md` (iná hodnota, iný vzorec, odkaz na zrušené rozhodnutie, chýbajúci odkaz).
2. **Chyby vo výpočtoch.** Over vzorec vo `04` (FR-02) a príklady v `04` a `07` (GC-01 až GC-12). Overiť možno tabuľkovou funkciou `NPER(i; −m; −K; T; 0)`, kde `i = (1 + r)^(1/12) − 1`.
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

> Stav: koncept, verzia 0.9 (2026-10-13). Označenie: **[user]** = povedal zakladateľ, **[predpoklad]** = doplnil Claude, treba potvrdiť.

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
- **Dynamický cieľ**: cieľ dosiahnutia finančnej slobody (suma a/alebo dátum) sa prepočíta po každom čiastkovom rozhodnutí.
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
Používateľ zadáva ručne **aktuálnu hodnotu** investície a **predpokladaný ročný výnos** (ako viditeľný predpoklad). Bez napojenia na trhové dáta; hodnotu aktualizuje používateľ.

## Odporúčania pri nastavení cieľa [user potvrdil parametre a predvolené hodnoty; MVP ukazuje aj dátum cieľa]
Odporúčania sa týkajú len parametrov cieľa, nie produktov. Parametre a predvolené hodnoty potvrdil zakladateľ, no samotné čísla sú **východiskové predpoklady, ktoré treba pred implementáciou overiť** v zdrojoch.

| Parameter | Zadáva | Predvolená hodnota | Odporúčaný rozsah | Poznámka pre používateľa |
|---|---|---|---|---|
| Ročné výdavky v dôchodku | používateľ | zadáva ručne ako odhad (D-013) | – | Základ cieľa. Aplikácia ukáže, koľko z výdavkov je pravidelných a koľko cielená spotreba. |
| Miera výberu | používateľ | 4 % (D-008) | 3 – 4 % | Pri dlhom horizonte (skorý odchod) býva opatrnejšia 3 – 3,5 %. |
| Ročný výnos investície (reálny, po inflácii) | používateľ | 4 % | 2 – 6 % | Rozsah ako opatrný / základný / optimistický. Zobrazí sa vždy s upozornením, že ide o odhad. |
| Mesačné sporenie/investovanie | používateľ | z priemeru transakcií typu sporenie/investícia | – | Spolu s výnosom určuje odhadovaný dátum cieľa. |
| Rezerva (núdzový fond) | používateľ | 3 mesiace výdavkov | 3 – 6 mesiacov | Odporúča sa mať ju mimo investícií; do cieľa sa nezapočítava. |

Pravidlá odporúčaní:
- Používateľ vždy vidí **čo je odporúčanie a čo jeho vlastná hodnota**, a môže ju zmeniť.
- Dátum cieľa sa ukazuje ako **rozsah** (opatrný – základný – optimistický), nie jedno presné číslo.
- Používame reálny výnos (po inflácii), takže výdavky sú v dnešných cenách; netreba zadávať infláciu zvlášť.
- Dane a poplatky sa v MVP neriešia (uvedie sa v upozornení).

## Čo je „rozhodnutie“ [user]
Rozhodnutie = **transakcia** (sporenie, investícia alebo výdavok). Plánovanie „čo ak“ scenárov nie je súčasťou definície rozhodnutia.

## Investície [user]
Používateľ už investíciu má; produkt s ňou počíta a uvažuje s jej výnosom. Produkt nevyberá ani nenavrhuje investície.

## Mimo rozsahu
- Odporúčanie konkrétnych investičných produktov [user].
- Ostatné zatiaľ neurčené (otvorené).

## Otvorené otázky
1. Overiť číselné hodnoty odporúčaní (miera výberu, rozsah výnosu, rezerva) v zdrojoch.
2. Monetizácia.

## Riziká a upozornenia (Claude) [predpoklad]
- **Právo/regulácia**: rozhodnutie nevyberať produkty znižuje riziko investičného poradenstva. Pri „odporúčaniach“ pri nastavení cieľa však treba strážiť, aby nešlo o osobné odporúčanie typu „investuj X do Y“. Pred rozšírením do EÚ treba právne posúdenie (MiFID II, GDPR, spotrebiteľské právo, rozdiely medzi krajinami).
- **Zavádzajúce projekcie**: dynamický cieľ závisí od predpokladaných výnosov a inflácie. Bez viditeľných predpokladov a rozsahov vzniká falošná istota.
- **Privacy/bezpečnosť**: finančné dáta sú citlivé; treba rozhodnúť o ukladaní a šifrovaní skôr než o architektúre.
- **Kognitívna a emočná záťaž**: neustále prepočítavanie cieľa môže vyvolávať stres alebo posadnutosť; treba zvážiť tón a frekvenciu zobrazovania.
- **Rozsah**: „všetko v jednom balíku“ je široké; odporúčam MVP s najmenším jadrom (záznam rozhodnutia + prepočet cieľa).

---

<!-- ===== docs/01_Personas.md ===== -->

# 01 – Persony

> Stav: v0.1 (2026-10-13). [user] = povedal zakladateľ, [predpoklad] = doplnil Claude, treba potvrdiť.

## Persona 1 – Zakladateľ (prvý používateľ, fáza 1)
- **Cieľ:** nezávislosť od zamestnania [user].
- **Frekvencia používania:** týždenne [user].
- **Zariadenie:** telefón [user] → webová aplikácia musí byť navrhnutá mobile-first.
- **Čo eviduje:** len väčšie výdavky a rozhodnutia nad prahovú sumu [user]. Prah je **parameter** a závisí od cieľa používateľa [user]; predvolená hodnota 100 € (D-013).
- **Investícia:** už nejakú má; hodnotu a predpokladaný výnos zadáva ručne [user].
- **Typická situácia** [predpoklad]: raz týždenne si sadne, zadá pár transakcií od posledného zadania a pozrie, ako sa posunul dátum cieľa.
- **Potreby** [predpoklad]: rýchle zadanie na telefóne (pár polí), jasný prehľad „kde som a kedy to dosiahnem“, istota, že dáta nezmiznú (záloha), žiadny tlak ani zbytočné upozornenia.

## Persony pre fázu 2 (EÚ)
Zatiaľ nedefinované. Definujeme po overení MVP na vlastnom použití. Treba počítať s rôznymi krajinami, menami a úrovňou finančnej gramotnosti.

---

<!-- ===== docs/02_User_Requirements.md ===== -->

# 02 – Požiadavky používateľa

> Stav: v0.5 (2026-10-13), rozsah: MVP (fáza 1, jeden používateľ). Zdroj: `00_Project_Vision.md`, `01_Personas.md`, `decisions/Decisions.md`.

## Používateľské príbehy (MVP)

| ID | Príbeh | Zdroj |
|----|--------|-------|
| UR-01 | Ako používateľ si nastavím cieľ (ročné výdavky, miera výberu, výnos, mesačné sporenie, rezerva) s odporúčanými predvolenými hodnotami. | D-008, D-011 |
| UR-02 | Ako používateľ vidím, ktorá hodnota je odporúčanie a ktorá moja vlastná, a môžem ju zmeniť. | D-011 |
| UR-03 | Ako používateľ zadám existujúcu investíciu: aktuálnu hodnotu a predpokladaný ročný výnos. | D-010 |
| UR-04 | Ako používateľ zadám transakciu (sporenie, investícia, výdavok) – rýchlo, na telefóne. | D-006, persona 1 |
| UR-10 | Ako používateľ zadám ročné výdavky v dôchodku ručne ako odhad. | D-013 |
| UR-05 | Ako používateľ nastavím prahovú sumu pre evidenciu výdavkov (predvolene 100 €). | [user], D-013 |
| UR-06 | Ako používateľ po každej transakcii vidím predbežný dopad na dátum cieľa (krátky text). | D-004, D-014 |
| UR-11 | Ako používateľ na konci mesiaca urobím mesačné vyhodnotenie (pripomenutie pri vynechaní, D-016): zadám hodnotu investícií a nasporenú sumu a vidím prepočítaný cieľ (cieľová suma a dátum ako rozsah opatrný/základný/optimistický). | D-011, D-014 |
| UR-12 | Ako používateľ pri zadaní výdavku zvolím zdroj úhrady (z príjmu – predvolené / z kapitálu). | D-014 |
| UR-07 | Ako používateľ vidím históriu všetkých transakcií (záznam rozhodnutí). | D-004 |
| UR-08 | Ako používateľ môžem dáta exportovať a importovať (záloha). | D-009 |
| UR-09 | Ako používateľ vidím predpoklady a obmedzenia výpočtu (pravidlo 4 %, bez daní a poplatkov). | D-008 |

## Nefunkčné požiadavky (MVP) [predpoklad]
- **Mobile-first:** plne použiteľné na telefóne.
- **Lokálne ukladanie:** dáta ostávajú v zariadení (D-009); žiadne odosielanie na server.
- **Nízka kognitívna záťaž:** málo polí, jasný jazyk, žiadne zbytočné upozornenia; prepočet cieľa podáva informáciu, nie tlak.
- **Transparentnosť:** každý výpočet ukazuje vstupy a predpoklady.
- **Slovenčina** v rozhraní; texty pripravené na neskoršie preklady (EÚ).

## Vyriešené rozhodnutia (D-013)
- **Ročné výdavky v dôchodku** zadáva používateľ ručne (odhad celkových výdavkov); z transakcií sa neodvodzujú, pretože sa evidujú len výdavky nad prahom.
- **Mesačné sporenie a investovanie** sa odvodzuje z transakcií typu sporenie/investícia (evidujú sa vždy).
- **Prah** platí len pre výdavky. Predvolená hodnota je **100 €**, používateľ ju môže zmeniť.
- **Vplyv cielenej spotreby na cieľ:** evidovaný výdavok **znižuje kapitál** (investovateľný kapitál sa zníži o sumu výdavku), čo posunie odhadovaný dátum cieľa. Cieľová suma (ročné výdavky × 25) sa výdavkom nemení.

## Predpoklady a riziká k vyriešeným rozhodnutiam [predpoklad]
- Model „výdavok znižuje kapitál“ predpokladá, že sa výdavok hradí z naakumulovaného kapitálu. Ak ho používateľ v skutočnosti platí z bežného príjmu, aplikácia bude dátum cieľa nadhodnocovať (cieľ vyzerá ďalej, než je). Treba to používateľovi jasne povedať a zvážiť pri zadávaní výdavku voľbu „hradené z kapitálu / z príjmu“ (otvorená otázka 1).
- Aby nedochádzalo k dvojitému započítaniu, mesačné sporenie sa počíta len z transakcií sporenie/investícia.

## Zdroj úhrady a mesačné vyhodnotenie kapitálu (potvrdené, D-014)
Zadanie [user]: pri výdavku riešiť zdroj úhrady (z kapitálu / z príjmu); **bežný kapitál vyhodnocovať mesačne, nie denne.**

Potvrdené zakladateľom:
1. Pri zadaní výdavku používateľ zvolí **zdroj úhrady**: „z príjmu“ (predvolené, kapitál sa nemení) alebo „z kapitálu“ (znižuje kapitál).
2. Kapitál sa **oficiálne prepočítava raz mesačne** pri „mesačnom vyhodnotení“: používateľ zadá aktuálnu hodnotu investícií a nasporenú sumu. Tým sa kapitál zosúladí so skutočnosťou (opraví aj chyby a rozdiely z trhu) a odhadovaný dátum cieľa sa potom bere z tohto stavu.
3. Medzi mesačnými vyhodnoteniami aplikácia po každej transakcii ukáže len **predbežný dopad** (napr. „predbežne +2 mesiace“) ako krátky text bez farieb a upozornení; pri vyhodnotení sa nahradí skutočným stavom.
4. Mesačné vyhodnotenie sa robí na **konci mesiaca**. Kapitál = aktuálna hodnota investícií + nasporená suma, zadáva používateľ.

Dôsledok pre D-004: oficiálny prepočet cieľa je mesačný, po transakcii je viditeľný len predbežný dopad (D-014 upresňuje D-004).

Výhody [predpoklad]: menej výkyvov, ktoré by mohli demotivovať (nízka záťaž, ako sme chceli); menej údajov na zadávanie; skutočný stav sa pravidelne opravuje.
Riziko [predpoklad]: ak používateľ mesačné vyhodnotenie vynechá, kapitál a dátum cieľa zastarajú; aplikácia má pripomenúť, nie nútiť, a jasne ukázať dátum posledného vyhodnotenia.

## Otvorené otázky
Žiadne. Vyriešené v D-016 (vynechané vyhodnotenie, rozdiel predbežný vs. skutočný stav) a D-014 (zdroj úhrady, mesačné vyhodnotenie).

---

<!-- ===== docs/03_UX_Principles.md ===== -->

# 03 – UX princípy

> Stav: v0.2 (2026-10-13), rozsah: MVP (jeden používateľ, telefón, týždenné použitie). [user] = zadanie zakladateľa, [predpoklad] = doplnil Claude, treba potvrdiť. Odkazy: D-xxx v `decisions/Decisions.md`, UR-xx v `02_User_Requirements.md`.

## Základné princípy

### 1. Nízka kognitívna záťaž
- Každá obrazovka má jednu hlavnú úlohu. [predpoklad]
- Zadanie transakcie: čo najmenej polí. Povinné: typ, suma. Voliteľné: poznámka. Pri výdavku zdroj úhrady (predvolene „z príjmu“, D-014). [predpoklad]
- Predvolené hodnoty a odporúčania všade, kde sa dajú (D-011), vždy s možnosťou zmeny.
- Žiadny odborný žargón bez vysvetlenia (napr. „miera výberu“ má krátke vysvetlenie).

### 2. Informácia, nie tlak
- Predbežný dopad transakcie sa ukáže ako krátky text, **bez farieb a upozornení** (D-014), napr. „predbežne +2 mesiace“.
- Žiadne červené/zelené hodnotenie rozhodnutí ako „dobré“ alebo „zlé“. Aplikácia nehodnotí používateľa. [predpoklad]
- Žiadne notifikácie okrem jednej jemnej pripomienky mesačného vyhodnotenia, ktorú používateľ môže vypnúť (D-016). [predpoklad]
- Jazyk je pokojný a vecný; žiadne vyčítavé ani pretlačajúce formulácie („Mal si…“, „Už len X dní!“). [predpoklad]

### 3. Transparentnosť a poctivosť
- Každé číslo cieľa ukazuje, z čoho vzniklo (vstupy a predpoklady, D-008).
- Dátum cieľa sa vždy ukazuje ako **rozsah** (opatrný – základný – optimistický), nikdy ako jediný presný dátum (D-011).
- Vždy je vidieť, či ide o predbežný dopad alebo o stav z mesačného vyhodnotenia, a kedy bolo posledné (D-014).
- Stručné upozornenie na obmedzenia: odhad, nie sľub; bez daní a poplatkov (D-008, D-011).
- Odporúčanie je vždy označené ako odporúčanie a odlíšené od hodnoty, ktorú nastavil používateľ (UR-02).

### 4. Predvídateľnosť
- Rovnaké akcie fungujú vždy rovnako; stabilná navigácia, rovnaké umiestnenie hlavných akcií. [predpoklad]
- Žiadne neočakávané zmeny čísel: oficiálny prepočet sa deje len pri mesačnom vyhodnotení (D-014).
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
1. **Prvé nastavenie:** cieľ (UR-01, UR-10) → investícia (UR-03) → prah (UR-05). Odporúčania a predvolené hodnoty pri každom kroku.
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

> Stav: v0.5 (2026-10-14). Rozsah: MVP, jeden používateľ, webová aplikácia (mobile-first), lokálne ukladanie (D-009, D-012). Odkazy: D-xxx = `decisions/Decisions.md`, UR-xx = `02_User_Requirements.md`, UX = `03_UX_Principles.md`. Označenie **[predpoklad]** = návrh Claude, treba potvrdiť.

## 1. Pojmy a model dát

| Pojem | Definícia |
|---|---|
| **Ročné výdavky (V)** | Odhad celkových ročných výdavkov v dôchodku, zadáva používateľ ručne (D-013). |
| **Miera výberu (p)** | Predvolene 4 %, rozsah 3–4 % (D-011). |
| **Cieľová suma (T)** | T = V / p. Pri 4 % je T = V × 25 (D-008). |
| **Kapitál (K)** | Hodnota investícií + nasporená suma, bez rezervy (D-011, D-017). |
| **Reálny výnos (r)** | Ročný výnos po inflácii, predvolene 4 %, rozsah 2–6 % (D-011). Počíta sa so všetkými sumami v dnešných cenách. |
| **Mesačné sporenie (m)** | Súčet transakcií typu „sporenie“ a „investícia“ za posledných 12 mesiacov, delený 12 (D-017). |
| **Rezerva** | Odporúčanie 3 mesiace výdavkov (rozsah 3–6), mimo cieľa (D-011). |
| **Vyhodnotenie (snapshot)** | Mesačný záznam s dátumom, hodnotou investícií a nasporenou sumou; zadáva sa na konci mesiaca (D-014). |
| **Posledný stav (K_L)** | K zo snapshotu, ktorý je najnovší. Oficiálny cieľ sa počíta z neho. |

### Entita Transakcia
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene dnes; nesmie byť v budúcnosti. |
| typ | sporenie / investícia / výdavok | áno | |
| suma | číslo, EUR, > 0 | áno | Na 2 desatinné miesta. |
| zdroj úhrady | z príjmu / z kapitálu | áno pri výdavku | Predvolene „z príjmu“ (D-014). Pri sporení a investícii sa nezadáva. |
| poznámka | text, max. 200 znakov | nie | |

### Entita Vyhodnotenie
| Pole | Typ | Povinné | Pravidlo |
|---|---|---|---|
| dátum | dátum | áno | Predvolene posledný deň mesiaca (D-014). |
| hodnota investícií | číslo ≥ 0 | áno | |
| nasporená suma | číslo ≥ 0 | áno | Bez rezervy (D-017). |

### Entita Nastavenie cieľa
V, p, r, rezerva (mesiace), prah výdavkov, dátum vzniku. Každý parameter má predvolenú hodnotu, odporúčaný rozsah a príznak „zmenený používateľom“ (UR-02).

## 2. Výpočty

### FR-01 – Cieľová suma
T = V / p. Ak V ≤ 0 alebo p ≤ 0, výpočet sa nespustí a zobrazí sa výzva na opravu vstupu.

### FR-02 – Dátum cieľa (počet mesiacov do cieľa)
Výpočet v reálnych hodnotách, mesačné sporenie na konci mesiaca, mesačná sadzba `i = (1 + r)^(1/12) − 1`:

- Ak K ≥ T: cieľ je dosiahnutý, dátum = dnes.
- Inak: `n = ln((T·i + m) / (K·i + m)) / ln(1 + i)`
- Ak r = 0: `n = (T − K) / m`.
- Ak `K·i + m = 0` (teda K = 0 a m = 0, alebo r = 0 a m = 0): kapitál nerastie, cieľ nie je dosiahnuteľný; zobrazí sa text „Bez sporenia a výnosu sa cieľ nedosiahne“ (bez dátumu). Ak m = 0 a r > 0, dátum existuje aj bez sporenia (rastie len výnos), len môže byť veľmi vzdialený (viď O-5).
- Dátum cieľa = dnešný dátum + `ceil(n)` mesiacov, zobrazený ako mesiac a rok.

**Overený príklad [predpoklad, na kontrolu]:** V = 24 000 €, K = 100 000 €, m = 500 €, r = 4 %. Dostaneme T = 600 000 €, i ≈ 0,3274 %, n ≈ 334 mesiacov (≈ 27 rokov 10 mesiacov).

### FR-03 – Rozsah dátumov (scenáre)
Tri scenáre sa počítajú rovnakým vzorcom s inými výnosmi (D-011):
- opatrný: r = 2 %,
- základný: r = nastavené r (predvolene 4 %),
- optimistický: r = 6 %.

Zobrazí sa ako „od – do“ (UX D-016): najskorší (optimistický) až najneskorší (opatrný) dátum. Základný je vyznačený textom, nie samostatným číslom.

### FR-04 – Predbežný dopad transakcie
Pre každú transakciu po poslednom vyhodnotení sa počíta pracovný kapitál:

`K_pred = K_L + Σ(sporenie/investícia po K_L) − Σ(výdavky „z kapitálu“ po K_L)`

Dopad = n(K_L) − n(K_pred), zaokrúhlený na celé mesiace. Kladné číslo = cieľ bližšie, záporné = ďalej.
- Výsledok sa zobrazí ako krátky text (D-014), napr. „predbežne +2 mesiace“.
- Ak je zaokrúhlený dopad 0, zobrazí sa „bez zmeny v mesiacoch“.
- Pracovný kapitál sa **nepremieta do oficiálneho cieľa**, kým sa neurobí vyhodnotenie.

**Príklad:** K_L = 100 000 €, m = 500 €, nová investícia 5 000 € po poslednom vyhodnotení. K_pred = 105 000 €, n klesne z ≈ 334 na ≈ 328 mesiacov → „predbežne 6 mesiacov skôr“.

### FR-05 – Mesačné vyhodnotenie
Vstupy: dátum, hodnota investícií, nasporená suma (UR-11). Výsledok: nový snapshot K_L = hodnota investícií + nasporená suma, prepočet cieľa a dátumov, zobrazenie „Posledné vyhodnotenie: dátum“.

- Transakcie s dátumom ≤ dátum vyhodnotenia sú už zahrnuté v zadaných hodnotách a **nepridávajú sa znovu**.
- Transakcie po dátume vyhodnotenia tvoria nový predbežný dopad (FR-04).
- Prepis predchádzajúceho vyhodnotenia je možný len s potvrdením; história snapshotov sa zachováva.

### FR-06 – Zaokrúhľovanie a formát
Sumy: EUR na celé eurá v zobrazení, 2 desatinné miesta vo vstupe a v uložených dátach. Mesiace: celé čísla. Dátumy: slovensky, mesiac slovom (napr. „marec 2038“).

## 3. Správanie a pravidlá

### FR-07 – Prah výdavkov (D-013)
- Prah sa uplatní **len na výdavky**; predvolene 100 € (rozsah 100–500 € podľa cieľa).
- Výdavok pod prahom sa **neukladá** a aplikácia to pri zadaní jasne povie [predpoklad, O-2].
- Sporenie a investície sa ukladajú vždy bez ohľadu na sumu.

### FR-08 – Zdroj úhrady výdavku (D-014)
- „Z príjmu“: K sa nemení.
- „Z kapitálu“: K_pred sa znižuje o sumu. Po vyhodnotení sa zohľadní v zadanej nasporenej sume.
- Ak je výdavok z kapitálu väčší než K_L, navrhuje sa upozornenie a ponuka zmeny na „z príjmu“; ak používateľ potvrdí, K_pred = 0 a zobrazí sa „kapitál by bol vyčerpaný“ (D-021).

### FR-09 – Úprava a mazanie transakcie
- Úprava a mazanie sú možné vždy.
- Ak je dátum transakcie po poslednom vyhodnotení, prepočíta sa len predbežný dopad.
- Ak je dátum pred posledným vyhodnotením, zobrazí sa text: „Zmena neovplyvní oficiálny cieľ, kým neurobíte nové vyhodnotenie.“
- Mazanie: potvrdenie a možnosť vrátiť späť (krátko po zmazaní), UX princíp 4.

### FR-10 – Vynechané vyhodnotenie (D-016)
- Oficiálny cieľ sa **nemení automaticky**; počíta sa z K_L.
- Po uplynutí konca mesiaca bez vyhodnotenia sa zobrazí jemná pripomienka a dátum posledného vyhodnotenia.
- Predbežný dopad sa aj naďalej zobrazuje.

### FR-11 – Pripomienka
- Jedna pripomienka na konci mesiaca (v aplikácii; systémová notifikácia len ak ju používateľ povolí) [predpoklad].
- Vypnuteľná v nastaveniach.

### FR-12 – Prvé nastavenie
Postupnosť: cieľ (V, p, r, rezerva) s predvolenými hodnotami → investícia (aktuálna hodnota, predpokladaný výnos, UR-03) → prah → prvé vyhodnotenie. Každý krok sa dá preskočiť a doplniť neskôr; chýbajúce údaje sa zobrazia ako „nezadané“, nie ako nula.

### FR-13 – Odporúčania
- Odporúčanie je viditeľne označené a odlíšené od hodnoty používateľa (UR-02).
- Používateľ môže kedykoľvek vrátiť odporúčanú hodnotu jedným úkonom.
- Odporúčania sa týkajú len parametrov (D-007); aplikácia neodporúča produkty.

### FR-14 – Prehľad
Domovská obrazovka: cieľová suma, aktuálny dátum cieľa ako rozsah, predbežný dopad posledných transakcií, dátum posledného vyhodnotenia, tlačidlo na pridanie transakcie.

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

### FR-19 – Pripomenutie zálohy
Ak neboli exportované dáta viac ako 30 dní (alebo nikdy), zobrazí sa jemná pripomienka v prehľade [predpoklad].

## 5. Chybové a hraničné stavy

| Situácia | Správanie |
|---|---|
| Cieľ je dosiahnutý (K ≥ T) | „Cieľ je dosiahnutý“; výpočet dátumu sa neukazuje. |
| Cieľ nie je dosiahnuteľný (bez kapitálu a sporenia) | „Bez sporenia a výnosu sa cieľ nedosiahne“, bez dátumu (D-019). |
| Dátum ďalej ako 50 rokov | „viac ako 50 rokov“ (D-019). |
| Chýbajúce údaje (napr. žiadne vyhodnotenie) | „Nezadané“, nie nula; výpočet pracuje s dostupnými údajmi a uvedie, čo chýba. |
| Záporná hodnota vstupu | Zablokovanie s vecnou správou. |
| Zmena po vyhodnotení | Viď FR-09. |
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
- **O-4 Priemer sporenia:** za posledných 12 mesiacov, delený 12 (D-017).
- **O-5 Veľmi vzdialený dátum:** do 50 rokov, ďalej „viac ako 50 rokov“; bez kapitálu a sporenia text bez dátumu (D-019).
- **O-6 Výdavok z kapitálu väčší než kapitál:** upozornenie a ponuka zmeny na „z príjmu“; pri potvrdení K_pred = 0 a text „kapitál by bol vyčerpaný“ (D-021).

**Otvorené:** žiadne.

---

<!-- ===== docs/05_Technical_Architecture.md ===== -->

# 05 – Technická architektúra (MVP)

> Stav: v0.2 (2026-10-13). Rozsah: webová aplikácia, mobile-first, jeden používateľ, lokálne dáta (D-009, D-012). Vychádza z `02`, `03`, `04` a `decisions/Decisions.md`. **[predpoklad]** = návrh Claude, treba potvrdiť.

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
| `transactions` | `id` (UUID) | `date`, `type` | dátum, typ (sporenie / investícia / výdavok), suma (cent), zdroj úhrady, poznámka, `createdAt`, `updatedAt` |
| `snapshots` | `id` (UUID) | `date` | dátum vyhodnotenia, hodnota investícií (cent), nasporená suma (cent), `createdAt` |
| `settings` | `key` (jediný záznam `"current"`) | – | V, p, r, rezerva (mesiace), prah výdavkov, a pre každý parameter príznak „zmenený používateľom“ (UR-02) |
| `meta` | `key` | – | `schemaVersion`, `lastExportAt` (FR-19) |

- **Sumy ukladáme ako celé centy** (integer), nie ako float. Zamedzí chybám zaokrúhľovania.
- **Dátumy** ako ISO reťazec `YYYY-MM-DD` (bez času, bez časového pásma) [predpoklad].
- Ak sa niečo v indexe nedá použiť, transakcie sa filtrujú v pamäti; objem je malý (desiatky až stovky záznamov za rok).

### Export JSON (FR-17)
```json
{
  "app": "financna-sloboda",
  "schemaVersion": 1,
  "exportedAt": "2038-03-31T10:00:00Z",
  "settings": { ... },
  "transactions": [ ... ],
  "snapshots": [ ... ]
}
```
Import: validácia schémy (typy, rozsahy, povinné polia) → náhľad → nahradenie dát v jednej transakcii (D-018). Pri chybe sa nič nezmení.

## 5. Výpočty (domain)

Čisté funkcie, bez vedľajších účinkov. Vstupy: hodnoty v centoch a dátumy, výstup: sumy a počet mesiacov.

- `targetAmount(V, p) → T` (FR-01).
- `monthsToTarget(K, m, r, T) → n | null` podľa vzorca z FR-02 (`null` = nedosiahnuteľné, viď D-019).
- `dateEstimates(K, m, T, {r_optimistic, r_base, r_cautious}) → {from, base, to}` (FR-03).
- `pendingImpact(snapshot, transactionsAfter, settings) → {K_pred, deltaMonths}` (FR-04, FR-08).
- `monthlySaving(transactions, today) → m` (súčet sporenia a investícií za 12 mesiacov ÷ 12, D-017).

Zaokrúhľovanie až pri zobrazení (FR-06). Dátum z mesiacov: `ceil(n)` mesiacov od dnešného dňa.

### Overené príklady (jednotkové testy)
| Vstup | Očakávaný výsledok |
|---|---|
| V = 24 000, p = 4 % | T = 600 000 |
| K = 100 000, m = 500, r = 4 %, T = 600 000 | n ≈ 333,9 → 334 mesiacov (FR-02) |
| to isté, K_pred = 105 000 | n ≈ 327,9 → dopad 6 mesiacov skôr (FR-04) |
| K = 100 000, m = 0, r = 4 %, T = 600 000 | n ≈ 548,2 → 549 mesiacov ≈ 45,7 roka → do 50 rokov, zobrazí sa dátum |
| K = 0, m = 0 | „Bez sporenia a výnosu sa cieľ nedosiahne“ (D-019) |
| K ≥ T | cieľ dosiahnutý |
| r = 0, m = 500 | n = (T − K) / m |

Poznámka: v predchádzajúcom popise som uviedol približne 60 rokov pre prípad bez sporenia. Presný výpočet je približne 46 rokov (K = 100 000, T = 600 000, r = 4 %); toto je správna hodnota (viď `07_Testing_Strategy`, GC-07).

## 6. Správanie offline a aktualizácie
- Service Worker ukladá aplikáciu do cache po prvom načítaní; funguje offline (FR-16).
- Nová verzia sa načíta pri ďalšom otvorení; aplikácia neprepíše dáta.
- Migrácie databázy: číslo verzie IndexedDB + funkcie migrácie v `storage/` [predpoklad].

## 7. Bezpečnosť a súkromie
- Žiadne dáta odchádzajú zo zariadenia; žiadne analytické ani chybové nástroje tretích strán v MVP [predpoklad].
- **Šifrovanie v kľude:** v MVP nie je. Dáta sú v prehliadači chránené len sandboxom prehliadača a zámkom zariadenia. Riziko: iný človek s prístupom k odomknutému zariadeniu alebo k exportu. Pripomenie sa to v exporte (FR-17). Na zvážení pred fázou 2 [predpoklad].
- Export obsahuje citlivé údaje: žiadne automatické odosielanie, žiadne ukladanie do verejných priečinkov.
- Závislosti: minimum, pravidelný audit (npm audit) [predpoklad].
- Content Security Policy bez inline skriptov (ochrana pred injekciou), ak to nasadenie podporuje.

## 8. Nasadenie
- Statický build (`dist/`) na ľubovoľný statický hosting (napr. GitHub Pages) [predpoklad]. Hosting nepozná dáta používateľa.
- Hosting musí byť HTTPS (Service Worker a inštalácia vyžadujú HTTPS).
- Verzia aplikácie v `package.json`, tag v gite pri každom vydaní.

## 9. Kvalita a testovanie (zhoda s `07_Testing_Strategy`, ešte nevytvorený)
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
2. **Šifrovanie dát v kľude:** odložiť na fázu 2 (navrhované), alebo doplniť heslo už v MVP?
3. **Názov a doména:** pracovný názov sa zmení (D-002); nasadenie zatiaľ bez vlastnej domény.
4. **Riziko iOS Safari:** dáta môžu byť po dlhšom nepoužívaní vymazané, ak appka nie je na ploche (07 oddiel 6). Potvrdiť odporúčanie pridať na plochu.

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
| 1 – MVP (osobné použitie) | webová PWA pre zakladateľa | plán | rozhodnutia z oddielu 6 |
| 1b – Pilot | 3 mesiace reálneho používania | plán | dokončené M1–M7 |
| 2 – EÚ webový produkt | viac používateľov, účty, GDPR, jazyky | plán | právne posúdenie, monetizácia, rozhodnutie o účtoch a šifrovaní |
| 3 – Mobil a integrácie | natívna appka, banka a investičné appky | plán | licencie a zmluvy, bezpečnostný audit |

## 3. Fáza 0 – Discovery (takmer hotová)
**Výstupy:** `00_Project_Vision`, `01_Personas`, `02_User_Requirements`, `03_UX_Principles`, `04_Functional_Requirements`, `05_Technical_Architecture`, `07_Testing_Strategy`, tento dokument.

**Čo ešte chýba:**
- externá revízia dokumentov (Claude ako reviewer, podľa `CLAUDE.md`),
- rozhodnutie o hostingu a šifrovaní v MVP. O-6 je uzavretý (D-021).

**Výstupná brána:** pripomienky z revízie sú zapracované a rozhodnutia zapísané v `Decisions.md`.

## 4. Fáza 1 – MVP (osobné použitie)

| Milník | Obsah | Veľkosť | Výstupné kritérium | Požiadavky |
|---|---|---|---|---|
| **M1 Doménová vrstva** | cieľ, dátumy (scenáre), predbežný dopad, mesačné vyhodnotenie – čisté funkcie | M | všetky GC-01 až GC-12 prejdú; property testy zelené; overenie NPER | FR-01 až FR-05, FR-07, FR-08 |
| **M2 Úložisko a záloha** | IndexedDB, CRUD, export a import s validáciou a atomicitou, schéma v1 | M | round trip test zelený; neplatný import nič nezmení | FR-16 až FR-19 |
| **M3 Nastavenie a transakcie** | prvé nastavenie s odporúčaniami, investícia, prah, zadanie transakcie so zdrojom úhrady, história | L | zadanie transakcie do 20 s a do 5 dotykov [predpoklad]; komponentové testy | UR-01 až UR-05, UR-07, UR-10, UR-12, FR-12, FR-13, FR-15 |
| **M4 Prehľad a vyhodnotenie** | domovská obrazovka s rozsahom dátumov, predbežný dopad, mesačné vyhodnotenie, pripomienka, upozornenie pri vynechaní | M | E2E tok „transakcia → vyhodnotenie → dátum“ prejde | UR-06, UR-11, FR-09, FR-10, FR-11, FR-14 |
| **M5 PWA a offline** | service worker, manifest, ikony, inštalácia na plochu | S | všetky toky offline; sieťový test súkromia zelený | FR-16, UX princíp 6 |
| **M6 Dostupnosť a kvalita** | axe-core bez vážnych chýb, čítačky, tmavý režim, zoom 200 % | S | nulové vážne porušenia; checklist čítačiek vyplnený | UX, 07 oddiel 9 |
| **M7 Vydanie 0.1 pre seba** | nasadenie na HTTPS, návod v appke, prvá ručná záloha | S | nasadené; export a import fungujú na reálnom telefóne | Definícia hotového (07 oddiel 13) |

**Poradie:** M1 → M2 → M3 → M4 → M5 → M6 → M7. M5 a M6 sa dajú začať paralelne s M4, ak to kapacita dovolí.

**Hlavné riziká fázy 1:**
- **Dáta na iOS Safari** môžu byť vymazané po dlhšom nepoužívaní [predpoklad, overiť]. Mitigácia: odporúčanie pridať na plochu, pripomienka zálohy.
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
1. **Právne posúdenie:** hranica investičného poradenstva (MiFID II), GDPR (správca, právny základ, práva dotknutých osôb), spotrebiteľské právo, rozdiely medzi krajinami.
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
| pred M2 | šifrovanie dát v MVP (áno/nie) | zakladateľ |
| pred M5 | hosting (GitHub Pages, alebo iný) | zakladateľ |
| pred M3 | odporúčanie pridať appku na plochu v prvom nastavení | zakladateľ |
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

> Stav: v0.2 (2026-10-14). Pokrýva `04_Functional_Requirements` (FR), `03_UX_Principles` (UX) a `05_Technical_Architecture`. **[predpoklad]** = návrh Claude, treba potvrdiť.

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
3. **Porovnávacie** – uzavretý vzorec vs. mesačná simulácia (oddiel 3).
4. **Úložisko (Vitest + fake-indexeddb)** – CRUD, migrácie, import/export, atomicita.
5. **Komponentové (React Testing Library)** – formuláre, validácie, texty predbežného dopadu, pripomienky, prázdne stavy.
6. **End-to-end (Playwright)** – kľúčové toky z `03_UX` (prvé nastavenie, týždenné zadanie, mesačné vyhodnotenie, záloha), na mobilných viewportoch, aj offline.
7. **Dostupnosť** – axe-core na každej obrazovke v komponentových aj E2E testoch; manuálne čítačky (oddiel 9).
8. **Súkromie a bezpečnosť** – sieťové testy, npm audit, CSP (oddiel 7).
9. **Používateľské** – self-test zakladateľa a checklist kognitívnej záťaže (oddiel 10).

## 3. Zlaté prípady (golden cases)
Hodnoty sú overené tromi spôsobmi: uzavretým vzorcom (FR-02), mesačnou simuláciou a tabuľkovou funkciou NPER (viď nižšie). Všetky sú uložené v `tests/golden/goal-cases.json` a každý má odkaz na požiadavku.

| ID | Vstup | Očakávaný výsledok | Zdroj |
|---|---|---|---|
| GC-01 | V = 24 000 €, p = 4 % | T = 600 000 € | FR-01 |
| GC-02 | V = 24 000 €, p = 3 % | T = 800 000 € | FR-01, D-011 |
| GC-03 | K = 100 000, m = 500, r = 4 %, T = 600 000 | n = 333,92 → **334 mesiacov** | FR-02 |
| GC-04 | K = 105 000 (predbežne), m = 500, r = 4 % | n = 327,93 → **328**; dopad **+6 mesiacov skôr** | FR-04 |
| GC-05 | K = 100 000, m = 500, r = 6 % (optimistický) | n = 256,01 → **257** | FR-03 |
| GC-06 | K = 100 000, m = 500, r = 2 % (opatrný) | n = 489,11 → **490** | FR-03 |
| GC-07 | K = 100 000, m = 0, r = 4 % | n = 548,21 → **549** (≈ 45,7 roka, dátum sa zobrazí, pretože je do 50 rokov) | FR-02, D-019 |
| GC-08 | K = 0, m = 0, r = 4 % | bez dátumu: „Bez sporenia a výnosu sa cieľ nedosiahne“ | D-019 |
| GC-09 | K = 0, m = 500, r = 4 % | n = 488,02 → **489** | FR-02 |
| GC-10 | K = 100 000, m = 500, r = 0 % | n = (T − K) / m = **1 000** | FR-02 |
| GC-11 | K ≥ T | cieľ dosiahnutý, dátum = dnes | FR-02 |
| GC-12 | K = 100 000, m = 500, r = 4 %, T = 1 000 000 | zobrazí sa dátum ďalej ako 50 rokov → „viac ako 50 rokov“ | D-019 |

**Overenie tabuľkou (NPER):** `NPER(i; −m; −K; T; 0)`, kde `i = (1 + r)^(1/12) − 1`. Výsledok musí zodpovedať n z FR-02. Hodnoty GC-03 a GC-07 sú overené touto metódou. Pri GC-08 funkcia nevráti číslo, čo je očakávané.

**Tolerancia:** porovnávame celé mesiace po `ceil`; interné hodnoty n sa porovnávajú s presnosťou 1e-6.

## 4. Invarianty (property-based testy)
Pre náhodné vstupy (K ∈ [0, 10 000 000], m ∈ [0, 10 000], r ∈ [0; 0,10], T ∈ [1 000; 10 000 000]):
- **Hraničná podmienka:** pre n = `monthsToTarget(...)` platí K_uzavretý(⌊n⌋) < T ≤ K_uzavretý(⌈n⌉). Toto je presnejšie než porovnanie so simuláciou a zachytí chybu v zaokrúhľovaní.
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
- Dátum cieľa = dnes + ⌈n⌉ mesiacov s **orezaním na posledný deň cieľového mesiaca** (31. 1. + 1 mesiac = 28. 2.). Test s falošnými hodinami (fake timers) pre dni 1., 28., 29., 30. a 31.
- Pripomienka konca mesiaca sa testuje s nastavenou časovou zónou.

## 6. Dáta a úložisko
| Scenár | Očakávané správanie | Typ |
|---|---|---|
| Prázdne úložisko po vymazaní prehliadačom | prázdny stav s výzvou na import zálohy, žiadne tiché obnovy | E2E |
| Import neplatného JSON | chyba, žiadna zmena dát | jednotkový |
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
- **CSP:** test hlavičky alebo meta tagu bez `unsafe-inline` pre skripty.

## 8. Zariadenia a prehliadače
| Prostredie | Typ testu | Kedy |
|---|---|---|
| Android Chrome, emulácia viewportu 412 × 915 | automatizované E2E | každý PR |
| iOS Safari, emulácia viewportu 390 × 844 | automatizované E2E (WebKit) | každý PR |
| Reálny iPhone 16 (iOS 26.6.2) | manuálny checklist: dotyky, inštalácia na plochu, offline, Safari úložisko | pred každým vydaním |
| Reálny Android | manuálny checklist – **nie je k dispozícii**; do získania zariadenia len emulácia | pred vydaním, keď bude zariadenie |
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
- manuálny checklist na reálnom iPhone 16 je podpísaný v dokumente vydania (Android, keď bude k dispozícii);
- prebehol round trip export → import na reálnych dátach (anonymizovaných);
- offline tok a inštalácia na plochu fungujú;
- self-test za posledný týždeň neobsahuje blokujúcu chybu.

## 14. Mimo rozsahu MVP
Bankové a investičné integrácie, viacužívateľské scenáre, daňové výpočty, graf projekcie (odložený, D-008), právne texty a ich overenie.

## 15. Otvorené otázky
Zodpovedané:
- **Zariadenia:** iPhone 16, iOS 26.6.2. Android nemáme, takže Android sa testuje len emuláciou. Pri manuálnych testoch to znamená, že Android nie je overený na reálnom zariadení.
- **O-6 (D-021):** výdavok z kapitálu väčší než kapitál sa rieši upozornením a ponukou zmeny na „z príjmu“.

Otvorené:
- **Riziko iOS Safari:** potvrdiť, či má byť v prvom nastavení odporúčanie pridať na plochu (predpokladám áno). Overenie možno urobiť na tvojom iPhone 16 po M2.

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
| D-006 | 2026-10-13 | „Rozhodnutie“ = transakcia. | Zadanie zakladateľa. |
| D-007 | 2026-10-13 | Produkt nevyberá ani neodporúča investície; počíta s výnosom existujúcej investície používateľa. Cieľ si nastaví používateľ s podporou odporúčaní. | Zadanie zakladateľa; rozsah odporúčaní treba potvrdiť. |
| D-008 | 2026-10-13 | MVP počíta cieľ podľa pravidla 4 % (ročné výdavky × 25) s viditeľnými predpokladmi; projekcia podľa výnosu a inflácie je odložená. | Jednoduchosť pre MVP; zadanie zakladateľa. |
| D-009 | 2026-10-13 | MVP je webová aplikácia s ručným zadávaním transakcií a lokálnym ukladaním dát (s exportom/importom). Neskôr mobilná aplikácia s integráciami na banku a investičné aplikácie. | Jednoduchosť a ochrana citlivých dát v osobnej fáze; zadanie zakladateľa. |
| D-010 | 2026-10-13 | Existujúca investícia sa v MVP zadáva ručne: aktuálna hodnota a predpokladaný ročný výnos (viditeľný predpoklad). | Jednoduchosť; bez trhových dát. |
| D-011 | 2026-10-13 | Odporúčania pri nastavení cieľa: parametre a predvolené hodnoty podľa tabuľky vo vízii v0.6 (výdavky, miera výberu 4 % [3–4 %], reálny výnos 4 % [2–6 %], mesačné sporenie, rezerva 3 mesiace [3–6]). MVP ukazuje aj odhadovaný dátum cieľa ako rozsah. | Potvrdené zakladateľom; číselné hodnoty treba overiť v zdrojoch. |
| D-012 | 2026-10-13 | MVP je mobile-first (telefón), používanie týždenne; evidujú sa len výdavky nad prahovú sumu (100–500 €), prah je parameter. | Zadanie zakladateľa. |
| D-013 | 2026-10-13 | Ročné výdavky v dôchodku zadáva používateľ ručne; mesačné sporenie sa odvodzuje z transakcií sporenie/investícia; prah platí len pre výdavky, predvolene 100 €; evidovaný výdavok znižuje kapitál (cieľová suma sa nemení). Upresňuje D-011. | Potvrdené zakladateľom; vyriešený konflikt prahu a odvodzovania výdavkov. |
| D-014 | 2026-10-13 | Pri výdavku sa volí zdroj úhrady (predvolene z príjmu; z kapitálu znižuje kapitál). Kapitál sa oficiálne prepočítava raz mesačne na konci mesiaca (hodnota investícií + sporenie zadáva používateľ); po transakcii sa ukáže len predbežný dopad ako krátky text bez farieb. Upresňuje D-004 a D-013. | Potvrdené zakladateľom; nižšia záťaž, menej výkyvov. |
| D-015 | 2026-10-13 | Externý reviewer dokumentov je aplikácia Claude (nahradila ChatGPT). | Rozhodnutie zakladateľa. |
| D-016 | 2026-10-13 | UX MVP: rozsah dátumov ako text „od – do“ (graf neskôr); svetlý/tmavý režim podľa systému; pri vynechanom mesačnom vyhodnotení jemná pripomienka a viditeľný dátum posledného vyhodnotenia, bez automatických zmien; po vyhodnotení jedna veta o rozdiele oproti predbežnému dopadu. | Zadanie zakladateľa; štvrtá otázka navrhnutá Claude a schválená zakladateľom. |
| D-017 | 2026-10-13 | FR: rezerva nie je v kapitáli ani v cieli; výdavky pod prahom sa neukladajú; mesačné sporenie = súčet sporenia a investícií za 12 mesiacov ÷ 12. | Potvrdené zakladateľom (O-1, O-2, O-4). |
| D-018 | 2026-10-13 | Import zálohy nahradí aktuálne dáta až po potvrdení; zlúčenie sa môže doplniť neskôr. | Potvrdené zakladateľom (O-3). |
| D-019 | 2026-10-13 | Dátum cieľa sa zobrazuje do 50 rokov; ďalej „viac ako 50 rokov“. Bez kapitálu a sporenia: „Bez sporenia a výnosu sa cieľ nedosiahne“. | Potvrdené zakladateľom (O-5). |
| D-020 | 2026-10-13 | Technológia MVP: statická PWA (TypeScript, React, Vite), IndexedDB, bez servera; výpočty v čistej doménovej vrstve oddelenej od UI a úložiska. | Potvrdené zakladateľom; lokálne dáta (D-009), offline a neskorší prechod na mobil. |
| D-021 | 2026-10-14 | Výdavok z kapitálu väčší než nasporený kapitál: pri zadaní upozornenie a ponuka zmeny na „z príjmu“; ak používateľ potvrdí „z kapitálu“, kapitál sa počíta ako 0 a zobrazí sa „kapitál by bol vyčerpaný“. | Potvrdené zakladateľom (O-6). |

---
