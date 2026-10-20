# 12 – Sekcia Investície (návrh, rozhodnutie čaká)

> Stav: **rozhodnuté (D-101): možnosť A, suma odvodená zo súčtu položiek.** Externé volania sú odložené do Fázy 3. Pôvodný návrh nižšie je zachovaný. Zdroj cien a kurzov je otvorený konflikt s D-009 a FR-16. Čo je nad rámec dokumentov, je predpoklad.

## 1. Účel

Sekcia Investície má ukázať, z čoho sa skladá K_inv (investičná časť kapitálu), v jednotlivých položkách: akcie, ETF, fondy a iné investície. Cieľ je mať rozpis, ktorý sa dá aktualizovať, a nie len jedno číslo vo Vyhodnotení.

## 2. Konflikt: externý zdroj cien a kurzov

Požiadavka: aktuálne hodnoty akcií a menových kurzov z API alebo z burzy. Dokumenty to zatiaľ nepovoľujú:

| Dokument | Čo hovorí | Dôsledok |
|---|---|---|
| D-009, FR-16 | žiadne volania na externé API v MVP; údaje sú lokálne | automatický kurz porušuje MVP |
| 06 Roadmap §8 | API na pravidelné dáta je „zámerne mimo plánu“, patrí do Fázy 3 | presun do Fázy 3 alebo rozhodnutie o zmene |
| 07 Testovacia stratégia §7 | sieťový test zakazuje externé volania | test by zlyhal, kým sa nezmení pravidlo |
| CSP (R17) | `default-src 'self'`, `connect-src` nie je povolený | prehliadač by požiadavku zablokoval |
| D-091 | Eurostat pre odhad nehnuteľnosti je odložený na neskôr | rovnaký druh rozhodnutia |

Ďalšie riziko: samotná požiadavka na kurz alebo cenu prezrádza, aké aktíva má používateľ (napr. ticker akcie). To je súkromný údaj, aj keď neodosielame hodnoty (D-090).

## 3. Možnosti

### A. Ručné zadanie (odporúčané na teraz)
- Používateľ zadá položku: názov, typ, počet kusov, cena za kus, mena, dátum ocenenia.
- Hodnota v eurách = počet × cena × kurz. Kurz zadáva používateľ spolu s cenou.
- Žiadna sieť, žiadny konflikt s D-009 ani FR-16.
- Nevýhoda: ručné aktualizácie, treba ich robiť pravidelne.

### B. Import súboru z brokera alebo kurzov (odporúčaná cesta do Fázy 3)
- Používateľ si stiahne CSV výpis z brokera alebo kurzy zo zdroja (napr. Európska centrálna banka) a nahrá ho do aplikácie.
- Aplikácia len číta lokálny súbor; žiadne externé volanie. Zhoduje sa s roadmapou §8, bod 2 (import CSV výpisu).
- Nevýhoda: manuálny krok, ale súkromie zostáva v zariadení.

### C. Priame napojenie na API (vyžaduje zmenu D-009 a FR-16)
- Aplikácia sama načíta ceny a kurzy.
- Pred implementáciou treba: právne posúdenie (D-090), zmenu CSP a sieťového testu, rozhodnutie o tom, ktoré údaje smú odísť (len ticker, bez počtu kusov), a overenie zdroja.
- Odporúčanie: zatiaľ neimplementovať.

## 4. Vzťah k existujúcim rozhodnutiam

- **K_inv:** Vyhodnotenie dnes zadáva investície ako jednu sumu (`investmentsCents`). Sekcia rozpisu sa nesmie stať druhým zdrojom pravdy. Musí sa rozhodnúť, či sa suma vo Vyhodnotení odvodí zo súčtu položiek (odporúčam), alebo ostane ručná a rozpis je len informatívny.
- **Mena:** Väčšina investícií je v eurách. Cudzia mena vyžaduje kurz; podľa D-009 ho zadáva používateľ alebo ho načíta zo súboru.
- **Daňový režim:** FR-24 a D-083 sú Fáza 2 a neriešia sa tu.
- **Navigácia:** Investície by boli ďalšia položka v paneli. Doteraz je panel päťprvkový (D-097). Rovnaká otázka ako pri Majetku (docs/11, bod 8).

## 5. Otvorené otázky pre vlastníka

1. Ktorú možnosť zvoliť teraz: A (ručné), B (import súboru), alebo C (API, vyžaduje zmenu D-009)?
2. Má byť suma investícií vo Vyhodnotení odvodená zo súčtu položiek, alebo ostať ručná?
3. Aké typy investícií evidovať prvé (akcie, ETF, podielové fondy, iné)?
4. Ako často by sa mali ceny aktualizovať (pri vyhodnotení na konci mesiaca, alebo častejšie)?
5. Má sa pri C zmeniť D-009 a FR-16? Ak áno, zaradiť to do Fázy 3, alebo ešte do pilota?

## 6. Predpoklady

- Používateľ eviduje najviac desiatky položiek, nie tisíce obchodov.
- Kurz sa pri ručnom zadaní zadá na deň ocenenia; aplikácia nepočíta históriu kurzov.
- Výnosy z jednotlivých položiek sa nepočítajú; výnos r zostáva v Nastaveniach (D-070).
