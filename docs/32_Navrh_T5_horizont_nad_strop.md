# 32 – Návrh opravy T5: horizont nad strop 14 400 mesiacov

> Stav: schválené (variant B, D-254), opravené v commite `60d1739`. Vetva `claude/phase2-property-card`. Nález T5 v `docs/30_Testy_2026-10-23.md`, oddiel 3.

## 1. Problém

`src/domain/capital.ts:10, 49–56`: slučka `monthsToTargetSplit` prehľadá len mesiace k ≤ 14 400 (1 200 rokov). Ak cieľ nie je dosiahnutý ani v tomto rozsahu, funkcia vráti `null`.

`null` sa v aplikácii berie ako „nedosiahnuteľné“: `goalMonths` vráti `unreachable` a Prehľad zobrazí „Pri súčasnom sporení a výnose sa cieľ nedosiahne“ aj s možnosťami (1) až (4). Podľa D-019 a O-5 má pre cieľ nad 50 rokov (600 mesiacov) platiť text „Viac ako 50 rokov“. Ten už existuje: `src/domain/goalDisplay.ts` mení `months > 600` na `over50`. Strop 14 400 túto vetvu nikdy nedosiahne.

## 2. Kedy to nastane (overené výpočtom)

- Cieľ 600 000 €, bez investícií, r = 3,5 %: `null` pri sporení do hotovosti **pod 41,67 € mesačne** (4 167 centov). Pri 40 € mesačne je cieľ 15 000 mesiacov (1 250 rokov). Je dosiahnuteľný, ale nad 50 rokov, a mal by sa zobraziť ako „Viac ako 50 rokov“.
- Pri r = 0 a sporení 10 €: 60 000 mesiacov, `null`.
- Pretečenie `(1 + i)^k` nastane až pri približne 247 000 mesiacoch (asi 20 600 rokov), takže strop 14 400 je prvý, ktorý zasiahne.

Zobrazený text je zavádzajúci: tvrdí, že cieľ sa nedosiahne, a radí meniť sporenie, hoci ide o horizont nad 50 rokov. Matematicky nejde o chybu výpočtu v rámci zobrazeného horizontu.

## 3. Varianty

**A. Strop nahradiť hľadaním hranice.** Exponenciálne hľadanie hornej hranice a potom binárne hľadanie, rovnaká lineárna interpolácia ako dnes. Vracia presné čísla aj nad 14 400 mesiacov. Pretečenie sa ošetrí ako `Infinity`. Zmena je zhruba 15 riadkov a nové testy. Výsledky v dnes fungujúcom rozsahu (1 až 14 400) zostanú rovnaké.

**B. Vrátiť `Infinity` namiesto `null`, keď slučka dôjde na koniec.** Zmena je jeden riadok, komentár a úprava testu. Výsledky do 14 400 mesiacov zostanú rovnaké. `goalDisplay` pri `Infinity` vráti `over50`, čo zodpovedá D-019.

**C. Ponechať `null` a zmeniť len text.** Nedoporučujem. `null` by stále znamenal „nedosiahnuteľné“ a zavádzal by v ďalších miestach, ktoré s ním pracujú.

## 4. Odporúčanie: variant B

- Presné číslo nad 50 rokov sa nikde nezobrazuje. `goalDisplay` ho zmení na `over50`, takže variant A by pridal kód bez viditeľného prínosu.
- Oprava je v zmysle D-019 a zvyšuje sa len zobrazený text v prípadoch nad 50 rokov.
- Vedľajší efekt: dopad medzi dvoma stavmi nad stropom dá `Infinity − Infinity = NaN` a dopad medzi konečným a nad-stropovým stavom dá `±Infinity`. Obidva prípady už `formatImpact` zachytí (oprava T7, commit `a615b25`) a zobrazí „dopad sa nedá vyčísliť“. Pri cieli viac ako 50 rokov je to prijateľné.

## 5. Zmeny v kóde (variant B, až po schválení)

- `src/domain/capital.ts`: na konci slučky `return null` nahradiť za `return Infinity`. Komentár: „Nad strop 14 400 mesiacov (1 200 rokov) vráti Infinity; zobrazí sa ako viac ako 50 rokov (D-019).“
- `tests/capital-horizon.test.ts`: test T5 dnes očakáva presné číslo `60_000_000`. Pri variante B sa očakávanie zmení na `Infinity` a pridá sa kontrola cez `goalDisplay`, ktorá musí dať `over50`. **Mení sa tým očakávanie testu, ktoré pochádza z nálezu T5.** Ak chcete presné čísla, zvoľte variant A.
- `decisions/Decisions.md`: nový záznam (číslo D-254) až po schválení.
- `docs/30`, oddiel 7: stav T5 po oprave a commit.

Postup: najprv upravený test, ktorý padá, potom oprava, potom `tsc`, `vitest` a commit.

## 6. Mimo rozsahu

Horizont 600 mesiacov v nehnuteľnostnej vetve (`src/domain/rentalGoal.ts`, `RENTAL_HORIZON_MONTHS`) je nález T2 a rieši ho samostatné rozhodnutie zakladateľa. Tento návrh sa ho netýka.

## 7. Čo potrebujem

Potvrdenie varianta B, alebo výber variantu A. Po potvrdení pripravím zmeny podľa oddielu 5.
