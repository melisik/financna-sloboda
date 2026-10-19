# 17 – Overovací plán pilota (Fáza 1b)

> Stav: **návrh na schválenie.** Vychádza z `06_Roadmap.md` §5 (pilot) a §10 (metriky). Čísla označené [predpoklad] sa overia v pilote. Plán nemení kód ani výpočty.

## 1. Účel

Overiť, že aplikácia je zrozumiteľná a dá sa používať bez vysvetlenia, a že čísla sú konzistentné. Výnos sa za tri mesiace overiť nedá (roadmapa §5), preto sa overuje pochopenie, zadávanie a spoľahlivosť výpočtu.

## 2. Účastníci

- **Vlastník** (zakladateľ): používa aplikáciu denne a vedie denník zmätkov.
- **Tester mimo tímu** (ak je k dispozícii): dostane len návod a testovaciu zálohu, nie osobné údaje vlastníka. Bez testera sa pilot berie ako „pilot jednej osoby“ a výsledky sa to tak aj označia.
- Pilot **nezahŕňa rodinnú verziu** (D-115).

## 3. Trvanie a rytmus

- **3 mesiace** (roadmapa §5). Začiatok: po zlúčení do `main` a overení na iPhone.
- **Týždenne:** zadanie transakcií, kontrola, či sa zobrazuje správny stav (5 minút).
- **Mesačne:** tri po sebe idúce vyhodnotenia (roadmapa §5). Vyhodnotenie sa robí v posledných troch dňoch mesiaca (D-107).
- **Raz na konci mesiaca:** záloha a overenie importu (roadmapa §5: aspoň jeden round trip).

## 4. Čo sa meria

| Metrika | Cieľ | Zdroj | Poznámka |
|---|---|---|---|
| Tri po sebe idúce vyhodnotenia bez blokujúcej chyby | 3 z 3 | aplikácia, denník | roadmapa §5 |
| Žiadna neočakávaná zmena čísla | 0 incidentov | porovnanie pred/po zmene | každá zmena dátumu cieľa sa vysvetlí |
| História rozhodnutí úplná | áno | `Decisions.md` | roadmapa §5 |
| Round trip export → import | aspoň 1× | záloha | na anonymizovaných dátach |
| Transakcia do 20 s | ≤ 20 s | stopky, 5 vzoriek | roadmapa §10, [predpoklad] |
| Počet dotykov na transakciu | ≤ 5 | počítanie | M3 [predpoklad] |
| Počet otázok „čo to znamená?“ | klesajúci trend | denník zmätkov | zrozumiteľnosť |
| Čas do prvého pochopenia dátumu cieľa | ≤ 2 min bez pomoci | test s testerom | ak je tester |

## 5. Denník zmätkov

Každý zmätok sa zapíše s dátumom, obrazovkou a jednou vetou, čo bolo nejasné. **Bez skutočných súm a bez osobných údajov.** Denník sa vedie v dokumentoch (`docs/pilot/`), nie v kóde. Ak zmätok vedie k zmene, zapíše sa ako rozhodnutie v `Decisions.md`.

## 6. Čo pilot neoveruje

- Správnosť výnosu (roadmapa §5).
- Daňový scenár, nehnuteľnosti, záväzky, rodinnú verziu (Fáza 2).
- Dostupnosť podľa M6 (axe-core a čítačky) – samostatný milník.

## 7. Výstupné kritérium

Pilot je úspešný, ak sú splnené všetky body z roadmapy §5 a metriky z tabuľky sú v cieli alebo majú zapísané rozhodnutie, prečo nie. Výsledok sa zapíše do `06_Roadmap.md` a `Decisions.md`.

## 8. Riziká

- **Nepravidelné používanie:** ak sa vynechá týždenný zápis, výsledky nebudú reprezentatívne. Pripomienky (D-107) majú pomôcť.
- **Zmena kódu počas pilotu:** každá zmena výpočtu zneplatní porovnanie. Zmeny UI sú možné, ale zapíšu sa do denníka.
- **Privacy:** údaje ostávajú lokálne (FR-16). Do repozitára sa dávajú len anonymizované výsledky.

## 9. Otvorené otázky

1. Bude mať pilot tretiu osobu, alebo len vlastníka?
2. Má sa pilot spustiť až po iPhone overení (roadmapa, 2026-10-23), alebo skôr?
3. Ako dlho držať pravidelnú kontrolu bez zmien kódu, aby výsledky boli porovnateľné?
