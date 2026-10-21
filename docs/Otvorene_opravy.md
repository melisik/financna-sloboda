# Otvorené opravy (pred ďalšou ukážkou)

Zoznam drobností, ktoré sa opravia v jednom balíku. Nové body pridávame sem, keď na ne narazíme pri testovaní.

| # | Kde | Čo sa deje | Čo má byť | Stav |
|---|-----|------------|-----------|------|
| 1 | Transakcie, história | Suma výdavku sa zobrazuje zaokrúhlene na celé eurá (12,20 € ako „12 €“, 1,50 € ako „2 €“). | Centy sa zobrazia, keď suma nie je celá. | Hotovo (D-144): centy všade. |
| 2 | Prehľad, Tento mesiac | Rozpis výdavkov (Nevyhnutné, Nie nevyhnutné, Ostatné) sa zobrazuje zaokrúhlene na eurá. | Rozhodnúť: nechať celé eurá, alebo centy ako v sekcii Transakcie. | Hotovo (D-144): centy všade aj v Prehľade. |
| 3 | Testovacia záloha | Blok „Tento mesiac“ počíta výdavky aktuálneho mesiaca; dáta sú z októbra 2026. | Testerom uviesť, že v inom mesiaci je blok 0 €. | Hotovo: testovacia záloha sa pri nasadení posúva na aktuálny mesiac (scripts/make-test-backup.mjs). |
| 4 | Transakcie, úprava výdavku | Číslo dokladu sa zobrazuje v poli. | Číslo sa nezobrazuje nikde; overenie na portáli ostáva cez schránku. Návrh: docs/Navrh_cislo_dokladu.md. | Hotovo (D-133), čaká na test |
| 5 | Dátumy v celej appke | Dátumy sa zobrazujú v rôznych tvaroch (napr. 2026-09-30 v zoznamoch). Vstupné polia sú v časti textové (napr. dátum ocenenia investície, dátum odhadu nehnuteľnosti), v časti natívne. | Jednotný slovenský formát a jednotný výber dátumu všade. Upravíme naraz. | Hotovo (D-144): dd.mm.rrrr a jednotný výber dátumu. |
