# 00 – Vízia projektu

> Stav: koncept, verzia 0.1 (2026-10-13). Označenie: **[user]** = povedal zakladateľ, **[predpoklad]** = doplnil Claude, treba potvrdiť.

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

## Cieľová skupina
Zatiaľ neurčená (otvorené).

## Mimo rozsahu
Zatiaľ neurčené (otvorené).

## Otvorené otázky
1. Pre koho: len pre teba, alebo pre verejnosť? Ak verejnosť, ktorá krajina a legislatíva?
2. Typ produktu: webová/mobilná aplikácia, tabuľka, jednoduchý nástroj?
3. Ako sa počíta cieľ? (napr. výdavky × násobok, miera výberu, očakávaný výnos, inflácia) – treba zvoliť model a jasne ukázať predpoklady.
4. Čo je „rozhodnutie“: iba transakcie, alebo aj plány („čo ak“ scenáre pred rozhodnutím)?
5. Dáta: zadávať ručne, importovať z banky, alebo napojiť na brokera?
6. Kde budú dáta uložené (len lokálne / cloud)? Ide o citlivé finančné údaje.
7. Monetizácia.

## Riziká a upozornenia (Claude) [predpoklad]
- **Právo/regulácia**: nástroj, ktorý odporúča konkrétne investície, môže byť považovaný za investičné poradenstvo. Treba držať hranicu: výpočty a evidencia vs. odporúčania.
- **Zavádzajúce projekcie**: dynamický cieľ závisí od predpokladaných výnosov a inflácie. Bez viditeľných predpokladov a rozsahov vzniká falošná istota.
- **Privacy/bezpečnosť**: finančné dáta sú citlivé; treba rozhodnúť o ukladaní a šifrovaní skôr než o architektúre.
- **Kognitívna a emočná záťaž**: neustále prepočítavanie cieľa môže vyvolávať stres alebo posadnutosť; treba zvážiť tón a frekvenciu zobrazovania.
- **Rozsah**: „všetko v jednom balíku“ je široké; odporúčam MVP s najmenším jadrom (záznam rozhodnutia + prepočet cieľa).
