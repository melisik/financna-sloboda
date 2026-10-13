# 00 – Vízia projektu

> Stav: koncept, verzia 0.2 (2026-10-13). Označenie: **[user]** = povedal zakladateľ, **[predpoklad]** = doplnil Claude, treba potvrdiť.

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

## Čo je „rozhodnutie“ [user]
Rozhodnutie = **transakcia** (sporenie, investícia alebo výdavok). Plánovanie „čo ak“ scenárov nie je súčasťou definície rozhodnutia.

## Investície [user]
Používateľ už investíciu má; produkt s ňou počíta a uvažuje s jej výnosom. Produkt nevyberá ani nenavrhuje investície.

## Mimo rozsahu
- Odporúčanie konkrétnych investičných produktov [user].
- Ostatné zatiaľ neurčené (otvorené).

## Otvorené otázky
1. Ako sa počíta cieľ? (napr. ročné výdavky × 25 podľa pravidla 4 %, očakávaný výnos, inflácia) – treba zvoliť model a ukázať predpoklady.
2. Ako sa zadávajú dáta: ručne, import z banky/brokera?
3. Ako sa oceňuje existujúca investícia a odkiaľ pochádza jej výnos (zadaný ručne, historický, odhad)?
4. Ukladanie dát: lokálne alebo cloud? (citlivé údaje)
5. Typ produktu: webová/mobilná aplikácia, tabuľka, jednoduchý nástroj?
6. Aké presne budú odporúčania pri nastavení cieľa a odkiaľ sa vezmú hodnoty?
7. Monetizácia.

## Riziká a upozornenia (Claude) [predpoklad]
- **Právo/regulácia**: rozhodnutie nevyberať produkty znižuje riziko investičného poradenstva. Pri „odporúčaniach“ pri nastavení cieľa však treba strážiť, aby nešlo o osobné odporúčanie typu „investuj X do Y“. Pred rozšírením do EÚ treba právne posúdenie (MiFID II, GDPR, spotrebiteľské právo, rozdiely medzi krajinami).
- **Zavádzajúce projekcie**: dynamický cieľ závisí od predpokladaných výnosov a inflácie. Bez viditeľných predpokladov a rozsahov vzniká falošná istota.
- **Privacy/bezpečnosť**: finančné dáta sú citlivé; treba rozhodnúť o ukladaní a šifrovaní skôr než o architektúre.
- **Kognitívna a emočná záťaž**: neustále prepočítavanie cieľa môže vyvolávať stres alebo posadnutosť; treba zvážiť tón a frekvenciu zobrazovania.
- **Rozsah**: „všetko v jednom balíku“ je široké; odporúčam MVP s najmenším jadrom (záznam rozhodnutia + prepočet cieľa).
