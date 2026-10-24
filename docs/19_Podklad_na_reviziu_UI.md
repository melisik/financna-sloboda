# 19 – Podklad na externú revíziu UI (build z `main`)

> Účel: nezávislé posúdenie používateľského rozhrania aplikácie Finančná sloboda pred ďalším vývojom. Podklad neobsahuje odporúčania autora. Revident má hodnotiť to, čo vidí, nie to, čo autor zamýšľal.

## 1. Pre revidenta

- **Rozsah:** len obrazovky, ktoré sú dnes v hlavnej vetve (`main`): Prehľad, Transakcie, Vyhodnotenie, Nastavenia, Záloha a Návod. Fázu 2 (majetok, investície, záväzky, rozpočet, príjmy) nehodnoťte, nie je v tomto builde.
- **Dáta:** screenshoty sú zo syntetických dát (testovacia záloha v repozitári). Nejde o skutočného používateľa.
- **Cieľová skupina:** najprv zakladateľ, potom používatelia v EÚ s rôznou úrovňou finančnej gramotnosti (`docs/00_Project_Vision.md`, `docs/01_Personas.md`). Hodnoťte z pohľadu človeka, ktorý finančnú teóriu nepozná. Appka má podľa `docs/03_UX_Principles.md` mať nízku kognitívnu záťaž a byť predvídateľná.
- **Čo hodnotiť:** zrozumiteľnosť textov, poradie a rozloženie, nejasné pojmy, chybové hlášky, dôveryhodnosť čísel, prístupnosť na telefóne (390 px).
- **Čo nehodnotiť:** správnosť výpočtov (samostatné testy), právne otázky ochrany dát (D-090), dostupnosť podľa M6 (čítačky, axe-core), ktorá ešte nebola spustená.
- **Výstup:** zoznam nálezov, každý s obrazovkou, citáciou textu, závažnosťou (vysoká, stredná, nízka) a návrhom, ak ho máte. Nálezy zoraďte podľa závažnosti.

## 2. Pojmy v aplikácii

| Pojem | Význam v appke |
|---|---|
| Cieľová suma | ročné výdavky delené mierou výberu (koľko kapitálu treba na nezávislosť) |
| Dátum cieľa | kedy sa pri aktuálnom sporení a výnose dosiahne cieľová suma |
| K (kapitál) | súčet investícií (K_inv) a hotovosti (K_cash) |
| Rezerva | peniaze mimo kapitálu, nepočítajú sa do K |
| Reálny výnos r | výnos po odpočítaní inflácie |
| Vyhodnotenie | mesačný zápis stavu investícií a hotovosti; až po ňom sa dátum cieľa zmení |
| Predbežný dopad | ako by transakcie zmenili dátum cieľa, kým nebolo vyhodnotenie |

## 3. Obrazovky a otázky

### 3.1 Prehľad
Súbor: `docs/revizia/obrazovka-prehlad.png`
- Texty: „Cieľová suma“, „Dátum cieľa“, „Posledné vyhodnotenie: … Dátum sa zmení až po ďalšom vyhodnotení.“, rozbalené „Podrobnosti“ (Rozsah dátumu, Výnos, Kapitál, Predbežný dopad posledných transakcií, počet transakcií), tlačidlo „Pridať transakciu“, rozbalený „Návod“.
- Otázky: Rozumie človek bez vysvetlenia, čo je dátum cieľa a prečo sa mení len po vyhodnotení? Je jasné, že ide o odhad? Ktorý údaj je prvý a najdôležitejší? Sú Podrobnosti dobre pomenované a dajú sa nájsť?

### 3.2 Transakcie
Súbor: `docs/revizia/obrazovka-nova-transakcia.png`
- Texty: „Typ transakcie“, „Zdroj úhrady“ (pri výdavku a investícii), „Suma (€)“, „Dátum (RRRR-MM-DD)“, „Poznámka (voliteľná)“, „Uložiť transakciu“, filter typu, zoznam s označením „pod prahom“.
- Otázky: Je rozdiel medzi typmi (sporenie, investícia, výdavok, rezerva, výber z rezervy) zrejmý? Je zdroj úhrady pochopiteľný? Čo sa stane po uložení a je to vidieť? Upozornenie na vplyv („Zmena neovplyvní oficiálny cieľ…“) je dosť výrazné?

### 3.3 Vyhodnotenie
Súbor: `docs/revizia/obrazovka-vyhodnotenie.png`
- Texty: „Na konci mesiaca zadaj hodnotu investícií a hotovosť. Dátum cieľa sa zmení až po tomto kroku.“, „Dátum vyhodnotenia (RRRR-MM-DD)“, „Hodnota investícií (€)“, „Nasporená suma, hotovosť (€)“, „Uložiť vyhodnotenie“; pri existujúcom dátume výzva na prepísanie.
- Otázky: Vie používateľ, aké číslo má zadať (hodnotu účtov vs. súčet vkladov)? Je jasné, prečo je to dôležité? Je pojem „Nasporená suma“ zrozumiteľný?

### 3.4 Nastavenia
Súbor: `docs/revizia/obrazovka-nastavenia.png`
- Texty: „Ročné výdavky pri nezávislosti (€)“, „Miera výberu (%)“, „Reálny výnos r (%)“, „Rezerva, cieľová hodnota (€)“, „Prah výdavkov (€)“, „Poplatky p. a. (%)“, „Mesačné sporenie do investícií (€), prázdne = odvodené“, tlačidlo „Vrátiť východiskovú hodnotu“ (len pri zmene), „Uložiť nastavenia“.
- Otázky: Je jasné, ktoré polia sú povinné a ktoré sa dajú nechať na východiskovej hodnote? Nápovede pod poľami („východisková hodnota …“) pomáhajú, alebo zahlcujú? Sú pojmy (miera výberu, reálny výnos) vysvetlené dosť? Ktoré polia by mal používateľ vidieť až neskôr?

### 3.5 Záloha
Súbor: `docs/revizia/obrazovka-zaloha.png`
- Texty: „Exportovať zálohu“, „Súbor zálohy“, „Import nahradí všetky aktuálne dáta“, „Pred importom stiahnuť zálohu aktuálnych dát“, „Nahradiť dáta zálohou“, „Zrušiť“.
- Otázky: Je jasné, prečo záloha existuje a kde sú dáta uložené? Je riziko straty dát dostatočne vysvetlené? Je potvrdenie importu jasné a bezpečné?

### 3.6 Návod
Súbor: súčasť obrazovky Prehľad.
- Text: päť krokov (Prvé nastavenie, Vyhodnotenie, Transakcie, Záloha, Obnova), poznámka „Výpočty sú odhady podľa zadaných predpokladov, nie finančné poradenstvo.“, odkaz na testovaciu zálohu.
- Otázky: Odpovedá návod na otázky, ktoré by si používateľ kladol? Je poradie krokov správne? Je poznámka o odhadoch dostatočne viditeľná?

## 4. Celá aplikácia

- Navigácia: päť položiek v hornom paneli, na úzkom telefóne sa dá posúvať. Je navigácia zrozumiteľná? Vie používateľ, kde je?
- Jazyk: je slovenčina prirodzená a bez interných kódov? Sú pojmy konzistentné naprieč obrazovkami?
- Kognitívna záťaž: koľko naraz treba pochopiť na jednej obrazovke? Kde je to najviac?
- Dôveryhodnosť: je jasné, že výsledky sú odhady a že údaje sú len v zariadení?
- Chyby: pomenúvajú chyby, čo chýba a ako to opraviť?
- Prvé spustenie: sprievodca dvoma krokmi a možnosť preskočiť. Je to bezpečné pre človeka, ktorý nevie, čo zadávať?

## 5. Čo podklad neobsahuje

- Fázu 2 a jej obrazovky (vetva `claude/phase2-property-card`).
- Automatické vyhodnotenie (D-116), ktoré je zatiaľ na vetve Fázy 2.
- Právne posúdenie a bezpečnostný audit (brána Fázy 2, D-094).
- Výsledky testu pilota (docs/17), ktorý ešte nezačal.

## 6. Súvisiace dokumenty

- `docs/17_Overovaci_plan_pilota.md` – plán pilota a metriky.
- `docs/06_Roadmap.md` – milníky a výstupné kritériá.
- `decisions/Decisions.md` – rozhodnutia, najmä D-094 a D-099.
