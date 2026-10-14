# Overenie na iPhone (D-035, D-042)

Zariadenie: iPhone 16, iOS 26.6.2. Prehliadač: Safari, appka pridaná na plochu.
Adresa: https://melisik.github.io/financna-sloboda-app/

## Výsledky

| Krok | Popis | Výsledok | Dátum |
|---|---|---|---|
| 1 | Pridanie na plochu, otvorenie z ikony bez panelu Safari | prebehlo (podľa používateľa) | 2026-10-14 |
| 2 | Vyhodnotenie a transakcia „sporenie 250 €“ v appke z plochy | prebehlo, dáta uložené | 2026-10-14 15:20 |
| 3 | Offline načítanie z ikony, dáta sú tam, zápis offline | prebehlo (podľa používateľa) | 2026-10-14 |
| 4 | Zatvorenie appky úplne a opätovné otvorenie, dáta zostávajú | prebehlo (podľa používateľa) | 2026-10-14 |

Poznámka: údaje zadané v Safari sa v appke z plochy nezobrazia. iOS má pre appku na ploche oddelené úložisko (zistené počas testu).

## Otvorené

- **Dlhý test neaktivity:** appka z plochy aj Safari tab bez použitia 8 dní. Kontrola najskôr **2026-10-22**. Očakávanie: v Safari tabe sa dáta môžu po 7 dňoch vymazať, appka z plochy by mala zostať (WebKit, D-035).
  - Výsledok appky z plochy: _čaká_
  - Výsledok Safari tabu: _čaká_
