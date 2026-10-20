# 13 – Zoznam obrazoviek a rozhodnutí

> Stav k 2026-10-19. Zoznam sa priebežne upravuje; zmeny ide zapísať sem a rozhodnutia do `decisions/Decisions.md`. Stav „na vetve“ znamená, že kód nie je na `main`.

## 1. Obrazovky

| Obrazovka | Stav | Poznámka |
|---|---|---|
| Prehľad | na main | cieľ, dátum, vyhodnotenie, podrobnosti |
| Transakcie | na main | sporenie, investícia, výdavok, rezerva, výber z rezervy |
| Vyhodnotenie | na main | mesačné zadanie; investície sa odvodia zo súčtu položiek (D-101) |
| Majetok | na vetve | nehnuteľnosť (hypotéka, splátka s úrokom), automobil, ocenitelné právo |
| Investície | na vetve | ručné položky (D-101); tu pribudnú tretí pilier a ciele (D-105) |
| Záväzky | navrhnuté | vlastná sekcia (D-103); okrem hypotéky |
| Pravidelné príjmy | navrhnuté | len zobrazenie; m sa mení pri vyhodnotení (D-102) |
| Pravidelné výdavky | navrhnuté | predplatné, poistky, paušály |
| Rozpočet kategórií | navrhnuté | limit na kategóriu za mesiac (D-106) |
| Dane | navrhnuté | len po overení pravidiel (D-104) |
| Ročný prehľad | navrhnuté | história kapitálu a dátumu cieľa |
| Scenáre | navrhnuté | porovnanie nastavení, len na vyžiadanie |
| Pripomienky | schválené | koniec mesiaca a záloha (D-107) |
| Nastavenia | na main | |
| Záloha | na main | šifrovanie odložené (D-108) |

## 2. Odpovede vlastníka (2026-10-19)

1. Zoznam sa zapíše a bude sa ním pracovať (tento dokument).
2. Príjem len zobrazuje; sporenie mení m až zostatok na konci mesiaca (D-102).
3. Záväzky majú vlastnú sekciu (D-103).
4. Daňový scenár až po overení pravidiel (D-104).
5. Tretí pilier v karte Investície; ciele sa v Investíciách delia (D-105).
6. Otvorené: čo ešte chýba v pravidelných tokoch. Vlastník to zatiaľ nevie a odložil to.

Rozpočet kategórií je schválený (D-106). Pripomienky sú schválené (D-107). Šifrovanie môže počkať (D-108).

## 3. Otvorené body

- Zoznam kategórií pre rozpočet (D-106) a overenie pred implementáciou.
- Pravidelné toky: čo ešte chýba (odpoveď 6).
- Daňové pravidlá: kto ich overí a z akého zdroja (D-104).
- Ciele: či ich používateľ zadáva ako sumu a dátum, alebo len ako skupinu položiek (D-105).

## 4. Poradie implementácie (navrhované)

1. Pripomienky: blížiaci sa koniec mesiaca (D-107).
2. Záväzky: vlastná sekcia (D-103).
3. Pravidelné príjmy: zobrazenie (D-102).
4. Investície: tretí pilier a ciele (D-105).
5. Rozpočet kategórií (D-106) po overení zoznamu kategórií.
6. Dane (D-104) až po overení pravidiel.
