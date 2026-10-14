# 00 – Vízia projektu

> Stav: koncept, verzia 0.12 (2026-10-14).

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

## Nastavenie cieľa a východiskové predpoklady [user]
- Každý používateľ si cieľ nastaví sám.
- Pri nastavovaní dostane východiskové predpoklady (napr. predvolené hodnoty a rozumné rozsahy parametrov cieľa).
- Rozsah východiskových [predpoklad, treba potvrdiť]: východiskové predpoklady sa týkajú **parametrov cieľa**, nie výberu konkrétnych produktov.

## Model výpočtu cieľa [user, MVP]
- MVP: cieľový kapitál = ročné výdavky / miera výberu; predvolená miera výberu je 3,7 % (D-049), čo dáva T = V / p ≈ V × 27,03 (pre V = 24 000 € je T = 648 649 €). Pravidlo 4 % (T = V × 25) zostáva ako historická referencia (D-008).
- Predpoklady (miera výberu, ročné výdavky) musia byť v aplikácii viditeľné a upraviteľné.
- Projekcia podľa výnosu a inflácie je **odložená** na neskôr (zatiaľ príliš zložitá).
- Známe obmedzenie [predpoklad]: predvolená miera výberu 3,7 % (D-049) nezohľadňuje inflačný ani výnosový scenár ani dĺžku obdobia; v aplikácii to treba stručne uviesť. Pravidlo 4 % (D-008) je len historická referencia.

## Typ produktu a ukladanie dát [user]
- **Fáza 1 (MVP):** webová aplikácia, ručné zadávanie transakcií, dáta uložené **lokálne** (v prehliadači).
- **Neskôr:** mobilná aplikácia s integráciami na bankový účet a aplikácie investičných produktov.
- Obmedzenia lokálneho ukladania [predpoklad]: dáta sú viazané na zariadenie a prehliadač; prehliadač ich môže vymazať. Preto má MVP obsahovať export a import dát (záloha).
- Dôsledky pre dizajn [predpoklad]: oddeliť dátovú vrstvu od UI, aby sa úložisko dalo neskôr vymeniť (backend, synchronizácia) a aby sa dali pridať importy z banky a od brokerov. Integrácie na bankové účty v EÚ typicky podliehajú PSD2 a vyžadujú licencovaného poskytovateľa; treba posúdiť neskôr.

## Existujúca investícia v MVP [user]
Používateľ zadáva ručne **aktuálnu hodnotu** investícií. Výnos sa nezadáva za jednotlivú investíciu: je to jeden globálny predpoklad r pre investovaný kapitál K_inv, ktorý nastavuje používateľ (D-032, D-036); hotovosť je bez výnosu (0 % reálne). Bez napojenia na trhové dáta; hodnotu aktualizuje používateľ.

## Východiskové predpoklady pri nastavení cieľa [user potvrdil parametre a predvolené hodnoty; MVP ukazuje aj dátum cieľa]
Východiskové predpoklady sa týkajú len parametrov cieľa, nie produktov. Parametre a predvolené hodnoty potvrdil zakladateľ, no samotné čísla sú **východiskové predpoklady, ktoré treba pred implementáciou overiť** v zdrojoch.

| Parameter | Zadáva | Predvolená hodnota | Východiskový rozsah | Poznámka pre používateľa |
|---|---|---|---|---|
| Ročné výdavky pri nezávislosti | používateľ | zadáva ručne ako odhad (D-013) | – | Základ cieľa. Aplikácia ukáže, koľko z výdavkov je pravidelných a koľko cielená spotreba (odložené do fázy 1b, D-038). |
| Miera výberu | používateľ | 3,7 % (D-049, D-051) | 3 – 4 % | Pri dlhom horizonte (skorý odchod) býva opatrnejšia 3 – 3,5 %. Predvolená 3,7 % (D-051); T je pred daňou a poplatkami (D-043, D-049). |
| Výnos r (reálny, po inflácii, globálny) | používateľ | 3,5 % (D-050) | 2 – 6 % | Jeden predpoklad pre investovaný kapitál K_inv (D-032, D-036). Rozsah ako opatrný / základný / optimistický; vždy s upozornením, že ide o odhad. Východiskové hodnoty sa overia zdrojom pred M3 (kód M6 v review/revizne-zaznamy.md). |
| Mesačné sporenie (m) | používateľ (odvodené, možno prepísať) | priemer za 12 mesiacov do posledného vyhodnotenia, delený počtom mesiacov histórie (D-031) | – | Spolu s výnosom určuje odhadovaný dátum cieľa. |
| Rezerva (núdzový fond) | používateľ | 3 mesiace výdavkov | 3 – 6 mesiacov | Predpoklad: mať ju mimo investícií; do cieľa sa nezapočítava. |

Pravidlá východiskových:
- Používateľ vždy vidí **čo je východisková hodnota a čo jeho vlastná hodnota**, a môže ju zmeniť.
- Dátum cieľa sa ukazuje ako **rozsah** (opatrný – základný – optimistický), nie jedno presné číslo.
- Používame reálny výnos (po inflácii), takže výdavky sú v dnešných cenách; netreba zadávať infláciu zvlášť.
- Dane sa v MVP neriešia (uvedie sa v upozornení). Poplatky sú voliteľný vstup v nastaveniach, predvolene 0 % (D-064).

## Čo je „rozhodnutie“ [user]
Rozhodnutie = **transakcia** (sporenie, investícia alebo výdavok). Plánovanie „čo ak“ scenárov nie je súčasťou definície rozhodnutia.

## Investície [user]
Používateľ už investíciu má; produkt s ňou počíta a uvažuje s globálnym výnosom r (D-032). Produkt nevyberá ani nenavrhuje investície.

## Mimo rozsahu
- Východisková hodnota konkrétnych investičných produktov [user].
- Ostatné zatiaľ neurčené (otvorené).

## Otvorené otázky
1. Overiť číselné hodnoty východiskových (miera výberu, rozsah výnosu, rezerva) v zdrojoch.
2. Monetizácia.
3. Klasifikácia výdavkov na pravidelné a cielené (O-7, M7).
4. Prah výdavkov: pevná predvolená hodnota 100 €, zmena používateľom (vyriešené D-048).
5. Zdroj predvolených hodnôt r a miery výberu: vyriešené D-049 a D-050 (podklady review/o9-podklady.md).

## Riziká a upozornenia (Claude) [predpoklad]
- **Právo/regulácia**: rozhodnutie nevyberať produkty znižuje riziko investičného poradenstva. Pri „východiskové predpokladych“ pri nastavení cieľa však treba strážiť, aby nešlo o osobné východisková hodnota typu „investuj X do Y“. Pred rozšírením do EÚ treba právne posúdenie (MiFID II, GDPR, spotrebiteľské právo, rozdiely medzi krajinami).
- **Zavádzajúce projekcie**: dynamický cieľ závisí od predpokladaných výnosov a inflácie. Bez viditeľných predpokladov a rozsahov vzniká falošná istota.
- **Privacy/bezpečnosť**: finančné dáta sú citlivé; treba rozhodnúť o ukladaní a šifrovaní skôr než o architektúre.
- **Kognitívna a emočná záťaž**: neustále prepočítavanie cieľa môže vyvolávať stres alebo posadnutosť; treba zvážiť tón a frekvenciu zobrazovania.
- **Rozsah**: „všetko v jednom balíku“ je široké; odporúčam MVP s najmenším jadrom (záznam rozhodnutia + prepočet cieľa).
