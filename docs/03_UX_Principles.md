# 03 – UX princípy

> Stav: v0.3 (2026-10-14), rozsah: MVP (jeden používateľ, telefón, týždenné použitie). [user] = zadanie zakladateľa, [predpoklad] = doplnil Claude, treba potvrdiť. Odkazy: D-xxx v `decisions/Decisions.md`, UR-xx v `02_User_Requirements.md`.

## Základné princípy

### 1. Nízka kognitívna záťaž
- Každá obrazovka má jednu hlavnú úlohu. [predpoklad]
- Zadanie transakcie: čo najmenej polí. Povinné: typ, suma. Voliteľné: poznámka. Pri výdavku zdroj úhrady (predvolene „z príjmu“, D-014). [predpoklad]
- Predvolené hodnoty a odporúčania všade, kde sa dajú (D-011), vždy s možnosťou zmeny.
- Žiadny odborný žargón bez vysvetlenia (napr. „miera výberu“ má krátke vysvetlenie).

### 2. Informácia, nie tlak
- Predbežný dopad transakcie sa ukáže ako krátky text, **bez farieb a upozornení** (D-014), napr. „predbežne +2 mesiace“.
- Žiadne červené/zelené hodnotenie rozhodnutí ako „dobré“ alebo „zlé“. Aplikácia nehodnotí používateľa. [predpoklad]
- Žiadne systémové notifikácie okrem jednej jemnej pripomienky mesačného vyhodnotenia, ktorú používateľ môže vypnúť (D-016, D-027). Upozornenia v aplikácii (banner po zálohe, FR-19; pri vynechanom vyhodnotení, FR-10) sú výnimka podľa D-027. [predpoklad]
- Jazyk je pokojný a vecný; žiadne vyčítavé ani pretlačajúce formulácie („Mal si…“, „Už len X dní!“). [predpoklad]

### 3. Transparentnosť a poctivosť
- Každé číslo cieľa ukazuje, z čoho vzniklo (vstupy a predpoklady, D-008).
- Dátum cieľa sa vždy ukazuje ako **rozsah** (opatrný – základný – optimistický), nikdy ako jediný presný dátum (D-011).
- Vždy je vidieť, či ide o predbežný dopad alebo o stav z mesačného vyhodnotenia, a kedy bolo posledné (D-014).
- Stručné upozornenie na obmedzenia: odhad, nie sľub; bez daní a poplatkov (D-008, D-011).
- Odporúčanie je vždy označené ako odporúčanie a odlíšené od hodnoty, ktorú nastavil používateľ (UR-02).

### 4. Predvídateľnosť
- Rovnaké akcie fungujú vždy rovnako; stabilná navigácia, rovnaké umiestnenie hlavných akcií. [predpoklad]
- Žiadne neočakávané zmeny čísel: oficiálny prepočet sa deje len pri mesačnom vyhodnotení (D-014). Dátum cieľa sa nemení ani s plynutím času; mení sa len pri vyhodnotení (D-024).
- Pred nevratnými akciami (mazanie dát, import, ktorý prepíše dáta) potvrdenie s jasným popisom následku. Pri zmazaní transakcie možnosť vrátiť späť. [predpoklad]

### 5. Mobile-first (D-012)
- Navrhované pre telefón, jednou rukou; dostatočne veľké dotykové plochy. [predpoklad]
- Číselné polia otvárajú číselnú klávesnicu; zadanie transakcie do niekoľkých dotykov. [predpoklad]
- Text čitateľný bez priblíženia; dostatočný kontrast; svetlý a tmavý režim podľa systémového nastavenia (D-016); rešpektuje systémovú veľkosť písma. [predpoklad]

### 6. Dôvera a súkromie
- Dáta ostávajú v zariadení (D-009); aplikácia to na vhodnom mieste hovorí jednoducho.
- Záloha dát (export/import) je ľahko dostupná a aplikácia pripomenie, že lokálne dáta môže prehliadač vymazať. [predpoklad]

### 7. Rešpektujúci jazyk
- Slovenčina, jednoduché vety, bez moralizovania o míňaní a sporení. [predpoklad]
- Cielená spotreba je legitímna súčasť plánu, nie „chyba“ (D-004, D-014). [predpoklad]

## Kľúčové toky (náčrt, bez návrhu obrazoviek)
1. **Prvé nastavenie:** cieľ (UR-01, UR-10) → investícia (UR-03) → prah (UR-05) → prvé vyhodnotenie. Odporúčania ako výzva pri každom kroku; polia sú prázdne (D-057). Krok na iPhone: pridanie appky na plochu je povinné (D-042). Kým nie je prvé vyhodnotenie, namiesto dátumu sa zobrazí výzva „urobte prvé vyhodnotenie“ (L6).
2. **Týždenné zadanie:** otvoriť → pridať transakciu → vidieť predbežný dopad → hotovo.
3. **Mesačné vyhodnotenie (koniec mesiaca):** zadať hodnotu investícií a sporenie → vidieť prepočítaný cieľ a dátum ako rozsah.
4. **Prehľad:** história transakcií (UR-07) a aktuálny stav cieľa.
5. **Záloha:** export/import (UR-08).

## Dostupnosť a inklúzia [predpoklad]
- Cieľ: WCAG 2.2 úroveň AA ako východisko.
- Význam sa neprenáša len farbou; podpora čítačiek obrazovky (správne popisy polí a hodnôt); navigácia klávesnicou.
- V MVP je používateľ len zakladateľ, ale princípy dostupnosti platia už teraz, aby ich nebolo treba dodatočne dorábať pre EÚ.

## Vyriešené otázky
- **Rozsah dátumov (D-016):** text „od – do“ v MVP; graf sa môže pridať neskôr.
- **Svetlý a tmavý režim (D-016):** podľa systémového nastavenia, bez vlastného prepínača v MVP.
- **Vynechané mesačné vyhodnotenie (D-016):** jemná pripomienka a viditeľný dátum posledného vyhodnotenia. Nič sa automaticky nemení ani nevynucuje; cieľ ostáva na poslednom overenom stave a aplikácia to jasne označí.
- **Rozdiel predbežný vs. skutočný stav (D-016) [predpoklad, na overenie v dizajne]:** po vyhodnotení sa zobrazí, o koľko sa zmenil dátum cieľa oproti predbežnému dopadu, jednou vetou (napr. „Po vyhodnotení: cieľ o 1 mesiac skôr než predbežne odhadnutý“).
