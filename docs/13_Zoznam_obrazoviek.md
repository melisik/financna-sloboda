# 13 – Zoznam obrazoviek a rozhodnutí

> Stav k 2026-10-20 (aktualizované v kroku 1 plánu Fázy 2). Zoznam sa priebežne upravuje; zmeny ide zapísať sem a rozhodnutia do `decisions/Decisions.md`. Stav „na vetve“ znamená, že kód nie je na `main`.

## 1. Obrazovky

| Obrazovka | Stav | Poznámka |
|---|---|---|
| Prehľad | na main | cieľ, dátum, vyhodnotenie, podrobnosti |
| Transakcie | na main | sporenie, investícia, výdavok, rezerva, výber z rezervy |
| Vyhodnotenie | na vetve (zoznam a mazanie vyhodnotení); mesačné zadanie na main | mesačné zadanie; investície sa odvodia zo súčtu položiek (D-101) |
| Majetok | na vetve | nehnuteľnosť (hypotéka, splátka s úrokom), automobil, ocenitelné právo |
| Investície | na vetve | ručné položky (D-101); tu pribudnú tretí pilier a ciele (D-105) |
| Záväzky | na vetve (vlastná sekcia, D-103) | vlastná sekcia (D-103); okrem hypotéky |
| Pravidelné príjmy | na vetve (len zobrazenie, D-102) | len zobrazenie; m sa mení pri vyhodnotení (D-102) |
| Pravidelné výdavky | navrhnuté | predplatné, poistky, paušály |
| Rozpočet kategórií | na vetve (D-106) | limit na kategóriu za mesiac (D-106) |
| Dane | navrhnuté | len po overení pravidiel (D-104) |
| Ročný prehľad | na vetve (docs/13, oddiel 4) | história kapitálu a dátumu cieľa |
| Scenáre | navrhnuté | porovnanie nastavení, len na vyžiadanie |
| Pripomienky | schválené; časť na main (upozornenie na zálohu a vyhodnotenie), úplný stav overiť | koniec mesiaca a záloha (D-107) |
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

## 4. Ročný prehľad (návrh, 2026-10-20; implementácia na vetve Fázy 2)

Účel: vidieť, ako sa kapitál a dátum cieľa menili medzi vyhodnoteniami. Ide o odvodený pohľad na uložené vyhodnotenia (FR-15); nové údaje a nové rozhodnutia nepotrebuje.

- **Riadky:** jeden riadok za každé vyhodnotenie, od najstaršieho po najnovšie. Auto-vyhodnotenia (D-116) sa zobrazia rovnako, s poznámkou „automaticky“.
- **Stĺpce:** dátum, K_inv, K_cash, K spolu (K_inv + K_cash), zmena K oproti predchádzajúcemu vyhodnoteniu, dátum cieľa podľa aktuálnych Nastavení (mesiac a rok alebo upozornenie z FR-02), zmena dátumu v mesiacoch oproti predchádzajúcemu riadku.
- **Nehnuteľnosti:** história majetku sa neukladá (vlastník ju neupravuje spätne). Ročný prehľad preto ukazuje K bez nehnuteľností a text to hovorí výslovne.
- **Dátum cieľa v minulosti:** počíta sa z uloženého stavu K a z **aktuálnych** Nastavení, nie z nastavení platných v čase vyhodnotenia. Text to hovorí výslovne.
- **Bez dát:** „Zatiaľ nie sú vyhodnotenia.“ Bez Nastavení sa zobrazí len K.
- **Rozsah:** len zobrazenie, bez úprav a bez exportu. Nemení dátum cieľa ani výpočty.
- **Predpoklad [overiť]:** vlastník chce vidieť zmenu K a dátumu medzi vyhodnoteniami, nie tabuľku všetkých polí transakcií.

## 5. Nálezy kroku 1 (2026-10-20)

Prechod všetkými sekciami na telefóne (390 px) a na počítači (1280 px) s prázdnymi údajmi:
- Všetkých 11 sekcií sa zobrazí, text je vyplnený, bez horizontálneho posúvania.
- Konzola: jediná chyba je chýbajúci favicon (404). Nízka priorita; oprava: pridať ikonu.
- Testované len s prázdnymi údajmi. Funkčné toky s údajmi pokrývajú E2E testy (88 na oboch profiloch).

Otvorené na overenie:
- Stav pripomienok (D-107): upozornenie na zálohu je na main, upozornenie na vyhodnotenie treba overiť.
- Zoznam chýb z používania na telefóne a v prehliadači doplní vlastník v ďalšom kroku.

