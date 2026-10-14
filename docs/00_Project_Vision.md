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
| Ročné výdavky v dôchodku | používateľ | zadáva ručne ako odhad (D-013) | – | Základ cieľa. Aplikácia ukáže, koľko z výdavkov je pravidelných a koľko cielená spotreba (odložené do fázy 1b, D-038). |
| Miera výberu | používateľ | 4 % (D-008) | 3 – 4 % | Pri dlhom horizonte (skorý odchod) býva opatrnejšia 3 – 3,5 %. |
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
Používateľ už investíciu má; produkt s ňou počíta a uvažuje s jej výnosom. Produkt nevyberá ani nenavrhuje investície.

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
