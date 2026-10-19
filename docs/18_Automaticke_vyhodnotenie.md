# 18 – Automatické vyhodnotenie (návrh)

> Stav: **rozhodnuté (D-116): vyhodnotenie je automatické.** Spôsob ocenenia investícií medzi vyhodnoteniami je otvorený a je potrebný pred implementáciou.

## 1. Čo sa mení

- Pri otvorení aplikácie sa vytvorí vyhodnotenie za posledný ukončený mesiac (napr. v novembri za október). Používateľ nič nezadáva.
- Kapitál sa vypočíta z transakcií od posledného vyhodnotenia (rovnaká logika ako dnes). Hotovosť sa tak posunie o sporenie a výdavky.
- Ručné vyhodnotenie zostáva len na opravu, napr. ak ste zadali chybnú transakciu.
- Pripomienka vyhodnotenia (D-107) a jej nastavenie v Nastaveniach sa zrušia, lebo nie je čo pripomínať.
- Dátum cieľa sa mení len pri vyhodnotení (zachované z FR-10 a D-024).

## 2. Čo ostáva nevyriešené

**Hodnota investícií.** Aplikácia nepozná trhovú cenu. Ak je položka v sekcii Investície, hodnota je posledná zadaná cena. Ak ju nezmeníte, investície v automatickom vyhodnotení nerastú ani neklesajú. Dátum cieľa tak stojí na zastaranom čísle. Toto je hlavné riziko automatizácie.

Možnosti:

- **A. Odhad výnosu:** každé automatické vyhodnotenie pripočíta investíciám mesačný výnos podľa r (D-070), označený ako odhad. Výsledok je konzistentný s projekciou, ale nie je to trhová hodnota.
- **B. Posledná zadaná hodnota:** investície sa menia len pri úprave položky. Presné, ale zastarané.
- **C. Import hodnôt zo súboru** (docs/15, možnosť A) raz mesačne. Presnejšie, ale znova vyžaduje krok od používateľa.

## 3. Ďalšie dôsledky

- **Chýbajúci mesiac:** ak aplikácia dlho neotvoríte, vznikne jedno vyhodnotenie za posledný ukončený mesiac, nie viac. Transakcie za vynechané mesiace sa zarátajú do kapitálu.
- **Prvé vyhodnotenie:** zostáva ručné, lebo bez východiskového stavu nie je z čoho počítať (D-031).
- **História:** každé automatické vyhodnotenie sa označí, aby bolo odlíšiteľné od ručného (dôležité pre pilot, docs/17).
- **Záloha a schéma:** nové pole „automatické“ v vyhodnotení je zmena schémy (FR-28).

## 4. Otvorené otázky

1. Ktorú možnosť pre investície zvoliť: A (odhad výnosu), B (posledná zadaná hodnota), alebo C (mesačný import)?
2. Má mať automatické vyhodnotenie viditeľný riadok v Prehľade („vyhodnotené automaticky k …“)?
