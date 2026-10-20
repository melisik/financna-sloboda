# 15 – Integračná služba pre externé dáta (návrh)

> Stav: **rozhodnuté: možnosť A (lokálny súbor), D-112.** Aplikácia číta súbor, nevolá sieť. Integračná služba ešte neexistuje; formát v1 je v sekcii 8. Všetky údaje o službách, dávkach a dôchodkoch sú predpoklad, kým ich neoverí zdroj.

## 1. Smer

Aplikácia Finančná sloboda **nevolá externé služby**. Volania zabezpečí samostatná **integračná služba**, ktorá s nimi komunikuje a dodá údaje aplikácii. Aplikácia zostáva bez sieťových volaní smerom von, takže sieťový test (07 §7) a CSP ostávajú platné.

## 2. Čo to znamená pre existujúce pravidlá

| Pravidlo | Dôsledok |
|---|---|
| D-009, FR-16: žiadne volania na externé API v MVP | platí pre aplikáciu; integračná služba je mimo MVP |
| D-020: bez servera | súbor áno; server nie. Server je zmena D-020 |
| D-026, D-090: ochrana dát | údaje zo Sociálnej poisťovne sú citlivé; právne posúdenie pred spustením |
| 06 Roadmap §8: API je mimo plánu | integrácia patrí do Fázy 3 |

## 3. Možnosti prenosu

### A. Lokálny súbor (odporúčané najbližšie)
- Integračná služba vytvorí súbor s údajmi (napr. JSON) a používateľ ho importuje cez existujúcu sekciu Záloha alebo novú sekciu Integrácia.
- Aplikácia len číta lokálny súbor. Žiadna sieť, žiadny server.
- Nevýhoda: používateľ musí súbor preniesť (napr. cez zdieľanie na iPhone).

### B. Server integračnej služby
- Služba beží na serveri, volá externé služby a aplikácia si údaje stiahne.
- Vyžaduje server, autentifikáciu používateľa, zmenu D-020 a FR-16, právne posúdenie (D-090) a šifrovanie prenosu.
- Patrí do Fázy 3.

## 4. Údaje, ktoré by služba dodávala

| Údaj | Frekvencia zmeny | Poznámka |
|---|---|---|
| Výhľad starobného dôchodku | dynamicky | nahrádza ručný zápis (D-111) |
| Invalidný dôchodok | pri rozhodnutí | zisťuje sa v onboardingu, potom pripomienka (D-111) |
| Ošetrovné, nemocenské dávky (PN) | nepravidelne | nepravidelný príjem (D-109) |
| Pravidelné dôchodky a sociálne dávky | mesačne | pravidelný príjem (D-109) |

Každý údaj musí niesť zdroj, dátum získania a dátum platnosti. Aplikácia zobrazí údaj ako „zo zdroja k dátumu“, nie ako istotu.

## 5. Onboarding a pripomienka (D-111)

- V prvom nastavení pribudne otázka: má používateľ invalidný dôchodok? Ak áno, zadá sumu a od kedy.
- Pripomienka sa zobrazí pred dátumom, kedy sa má údaj overiť alebo obnoviť. Lehota sa určí podľa zdroja (predpoklad: ročne).

## 6. Otvorené otázky pre vlastníka

1. Preferujete lokálny súbor (A), alebo server (B) až vo Fáze 3?
2. Kto bude prevádzkovať integračnú službu (vy, alebo tím)? Mení to právne posúdenie.
3. Má integračná služba používať vašu identifikáciu u Sociálnej poisťovne? Pre každé volanie treba oddelené oprávnenie.
4. Má sa údaj zobrazovať len ako informácia, alebo ovplyvniť dátum cieľa (FR-02a)?

## 7. Riziká

- **Bezpečnosť:** prihlasovacie údaje k štátnym službám nesmú skončiť v aplikácii ani v zálohe.
- **Súkromie:** služba vidí identifikáciu a údaje o dôchodku; minimalizovať na údaje potrebné pre aplikáciu.
- **Závislosť:** zmena rozhrania externej služby rozbije integráciu. Dodávať verziu a stav.

## 8. Formát súboru v1 (možnosť A)

```json
{
  "app": "integracna-sluzba",
  "feedVersion": 1,
  "source": "Názov zdroja (max 80 znakov)",
  "fetchedAt": "2026-10-19T08:00:00Z",
  "items": [
    {
      "id": "jedinečné-id-v-súbore",
      "kind": "mzda | socialna_davka | invalidny_dochodok | starobny_dochodok | osetrovne | nemocenska_davka | ine",
      "frequency": "mesacne | nepravidelne",
      "name": "názov (max 80 znakov)",
      "amountCents": 85000,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD (nepovinné)",
      "dayOfMonth": 15
    }
  ]
}
```

- Súbor musí mať presne tieto polia; neznáme polia sa odmietnu.
- Import **nahradí všetky položky daného zdroja** (podľa poľa `source`). Opätovný import nevytvorí duplicity.
- Maximálna veľkosť súboru je 1 MB. Aplikácia nič nevolá zo siete.
- Pred importom sa zobrazí náhľad a import sa vykoná až po potvrdení.
