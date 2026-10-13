# 03 – UX princípy

> Stav: v0.1 (2026-10-13), rozsah: MVP (jeden používateľ, telefón, týždenné použitie). [user] = zadanie zakladateľa, [predpoklad] = doplnil Claude, treba potvrdiť. Odkazy: D-xxx v `decisions/Decisions.md`, UR-xx v `02_User_Requirements.md`.

## Základné princípy

### 1. Nízka kognitívna záťaž
- Každá obrazovka má jednu hlavnú úlohu. [predpoklad]
- Zadanie transakcie: čo najmenej polí. Povinné: typ, suma. Voliteľné: poznámka. Pri výdavku zdroj úhrady (predvolene „z príjmu“, D-014). [predpoklad]
- Predvolené hodnoty a odporúčania všade, kde sa dajú (D-011), vždy s možnosťou zmeny.
- Žiadny odborný žargón bez vysvetlenia (napr. „miera výberu“ má krátke vysvetlenie).

### 2. Informácia, nie tlak
- Predbežný dopad transakcie sa ukáže ako krátky text, **bez farieb a upozornení** (D-014), napr. „predbežne +2 mesiace“.
- Žiadne červené/zelené hodnotenie rozhodnutí ako „dobré“ alebo „zlé“. Aplikácia nehodnotí používateľa. [predpoklad]
- Žiadne notifikácie okrem jednej pripomienky mesačného vyhodnotenia, ktorú používateľ môže vypnúť. [predpoklad]
- Jazyk je pokojný a vecný; žiadne vyčítavé ani pretlačajúce formulácie („Mal si…“, „Už len X dní!“). [predpoklad]

### 3. Transparentnosť a poctivosť
- Každé číslo cieľa ukazuje, z čoho vzniklo (vstupy a predpoklady, D-008).
- Dátum cieľa sa vždy ukazuje ako **rozsah** (opatrný – základný – optimistický), nikdy ako jediný presný dátum (D-011).
- Vždy je vidieť, či ide o predbežný dopad alebo o stav z mesačného vyhodnotenia, a kedy bolo posledné (D-014).
- Stručné upozornenie na obmedzenia: odhad, nie sľub; bez daní a poplatkov (D-008, D-011).
- Odporúčanie je vždy označené ako odporúčanie a odlíšené od hodnoty, ktorú nastavil používateľ (UR-02).

### 4. Predvídateľnosť
- Rovnaké akcie fungujú vždy rovnako; stabilná navigácia, rovnaké umiestnenie hlavných akcií. [predpoklad]
- Žiadne neočakávané zmeny čísel: oficiálny prepočet sa deje len pri mesačnom vyhodnotení (D-014).
- Pred nevratnými akciami (mazanie dát, import, ktorý prepíše dáta) potvrdenie s jasným popisom následku. Pri zmazaní transakcie možnosť vrátiť späť. [predpoklad]

### 5. Mobile-first (D-012)
- Navrhované pre telefón, jednou rukou; dostatočne veľké dotykové plochy. [predpoklad]
- Číselné polia otvárajú číselnú klávesnicu; zadanie transakcie do niekoľkých dotykov. [predpoklad]
- Text čitateľný bez priblíženia; dostatočný kontrast; podpora tmavého režimu a systémového nastavenia veľkosti písma. [predpoklad]

### 6. Dôvera a súkromie
- Dáta ostávajú v zariadení (D-009); aplikácia to na vhodnom mieste hovorí jednoducho.
- Záloha dát (export/import) je ľahko dostupná a aplikácia pripomenie, že lokálne dáta môže prehliadač vymazať. [predpoklad]

### 7. Rešpektujúci jazyk
- Slovenčina, jednoduché vety, bez moralizovania o míňaní a sporení. [predpoklad]
- Cielená spotreba je legitímna súčasť plánu, nie „chyba“ (D-004, D-014). [predpoklad]

## Kľúčové toky (náčrt, bez návrhu obrazoviek)
1. **Prvé nastavenie:** cieľ (UR-01, UR-10) → investícia (UR-03) → prah (UR-05). Odporúčania a predvolené hodnoty pri každom kroku.
2. **Týždenné zadanie:** otvoriť → pridať transakciu → vidieť predbežný dopad → hotovo.
3. **Mesačné vyhodnotenie (koniec mesiaca):** zadať hodnotu investícií a sporenie → vidieť prepočítaný cieľ a dátum ako rozsah.
4. **Prehľad:** história transakcií (UR-07) a aktuálny stav cieľa.
5. **Záloha:** export/import (UR-08).

## Dostupnosť a inklúzia [predpoklad]
- Cieľ: WCAG 2.2 úroveň AA ako východisko.
- Význam sa neprenáša len farbou; podpora čítačiek obrazovky (správne popisy polí a hodnôt); navigácia klávesnicou.
- V MVP je používateľ len zakladateľ, ale princípy dostupnosti platia už teraz, aby ich nebolo treba dodatočne dorábať pre EÚ.

## Otvorené otázky
1. Má byť aplikácia vo svetlom aj tmavom režime od začiatku, alebo stačí sledovať systémové nastavenie?
2. Ako presne ukážeme rozdiel medzi predbežným a skutočným stavom po mesačnom vyhodnotení (prenesené z požiadaviek)?
3. Ako sa vizuálne vyjadrí rozsah dátumov (text „od – do“, alebo jednoduchý graf)? Odporúčam v MVP text, bez grafu.
4. Čo robiť pri vynechanom mesačnom vyhodnotení (prenesené z požiadaviek)?
