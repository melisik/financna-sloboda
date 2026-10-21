# 08 – Backlog nápadov

> Stav: v0.1 (2026-10-14). Nápady nie sú rozhodnutia. Zapisujú sa na neskoršie spracovanie; zaradenie do milníka a záväzné pravidlá sa urobia v `Decisions.md`, keď sa k nim dospeje.

## N-01 Nehnuteľný majetok (vlastníctvo vs. prenájom)
- **Cieľ:** zakomponovať nehnuteľnosti postupne, každý režim samostatne.
- **Režim vlastníctva:** hodnota nehnuteľnosti (odhad, nie trhová cena), hypotéka (záporná zložka), náklady údržby, daň z nehnuteľnosti.
- **Režim prenájmu:** príjem z nájmu, náklady, neobsadenosť, daň z príjmu z prenájmu.
- **Otázky na neskôr:** patrí vlastný byt do K? Ako sa oceňuje bez trhových dát? Je hypotéka záporný kapitál? Je čistý príjem z nájmu tretia zložka okrem K_inv a K_cash, alebo súčasť sporenia?
- **Súvis:** nehnuteľnosť je tretí typ kapitálu (vedľa K_inv a K_cash, D-036, D-039). Vyžaduje rozšírenie domény, nové entity a pravidlá pre výdavky a príjmy.

## N-02 Daňové režimy investícií a výberu
- **Cieľ:** investície v rôznych daňových režimoch a dane pri výbere.
- **Krok 1 (MVP, navrhnuté):** voliteľné pole „daňový režim“ pri každej investícii, zobrazené a neovplyvňujúce výpočet; upozornenie, že výnos je pred daňou (rozšírenie D-008).
- **Krok 2 (neskôr):** r po dani na investíciu, s pravidlami overenými zdrojom a daňovým poradcom.
- **Výber 4 %:** pravidlo je pred daňou; dane z výberu sa líšia podľa režimu.
- **Súvis:** D-032 (globálne r) sa bude musieť upraviť, ak sa r stane závislé od režimu.

## N-03 Prehľad spotreby: pravidelná vs. cielená
- Odložené do fázy 1b (D-038). Vyžaduje klasifikáciu výdavkov (O-7).

## N-04 Predvyplnenie nasporenej sumy (zaradené do MVP, D-096)
- Pri vyhodnotení predvyplniť K z predchádzajúceho stavu a od D_L pridať sporenie. Znižuje riziko ručného zadávania chyby (recenzia S7).

## N-05 Voliteľné heslo na export (odložené, D-096)
- Export zašifrovaný heslom cez Web Crypto, voliteľný. Nie je to šifrovanie v kľude, ktoré je mimo MVP (D-026). Zmierňuje riziko úniku exportného súboru (recenzia S5).

## N-06 Viac kapitálových typov a daňových režimov v jednom modeli
- Spojí N-01 a N-02: každý typ kapitálu má vlastný režim (zhodnotenie, dane, pravidlá výberu). Architektonický nápad na fázu 2, nie na MVP.

## Návrhy z 2026-10-21 (stav: návrh, nie rozhodnutie)

### Účty a rodinné zdieľanie
- **N-07 Účty:** prihlásenie účtom, rodinné zdieľanie, sekcia podľa prihláseného používateľa (vrátane dieťaťa podľa kognitívnych schopností). **Konflikt:** D-119 (bez servera a bez účtov), D-009 a D-020 (bez servera). Vyžaduje nové rozhodnutie zakladateľa a zmenu týchto rozhodnutí. Pôvodne súvisí s rodinnou verziou (D-114, D-115, až po pilote).

### Zobrazenie podľa životnej etapy (N-08)
Personas v `docs/01_Personas.md` sú zatiaľ len zakladateľ (fáza 1) a fáza 2 je nedefinovaná. Návrhy treba najprv zapísať ako persony a potom rozhodnúť, ktoré patria do MVP.
- **Dieťa alebo dorast:** jednoduchý režim s jedným údajom („koľko mám do konca mesiaca“); cieľ s postupom a odhadom dátumu; rodičovský režim (rodič vidí výdavky len po súhlase dieťaťa; súvisí s D-114); kategórie pre študenta (školské potreby, záujmy, predplatné).
- **Dospelý v produktívnom veku:** pohľad „Kam ide moja mzda“ (rozpis príjmu na výdavky, sporenie a rezervu); porovnanie plánu s realitou za posledné tri mesiace; upozornenia na predplatné a splátky; režim „dovolenka“ alebo „rodičovská“ s nižším príjmom bez zmeny cieľa.
- **Dôchodca:** hlavný pohľad „koľko mesačne vyberiem a ako dlho to vydrží“ (z K a výhľadu, D-110); pravidelné príjmy oproti pravidelným výdavkom, bez porovnania s cieľom; veľké písmo a jednoduchší panel (M6); upozornenie na zmenu dôchodku alebo dávky; režim zdieľania pre blízkeho len na čítanie.

### Ďalšie nápady
- **N-09** Prepínač zobrazenia podľa etapy v Nastaveniach (výber, čo je na Prehľade).
- **N-10** Týždenný súhrn na export alebo odoslanie mailom, bez dát v cloude.
- **N-11** Porovnanie výdavkov v kategóriách s predchádzajúcim rokom.
- **N-12** Scenár veľkého výdavku (napr. auto): ukáže dopad na cieľ bez zápisu do transakcií.
- **N-13** Pripomienka ročnej kontroly nastavení (inflácia, rezerva, miera výberu).

- **N-14 Súhrnný majetok (odložené, D-137):** spoločný súhrn všetkého majetku. Automobily a ocenitelné práva sa odkladajú, lebo sú skôr zahraničný aspekt.
- **N-15 Mimoriadna splátka hypotéky (dohodnuté 2026-10-21):** pole s dátumom a sumou mimoriadnej splátky. Appka prepočíta zostatok a novú splátku (na zmluvný termín alebo na zmluvnú splátku, voľba zakladateľa). Súvisí s D-137.
- **N-16 Pripomienka na starý odhad investícií (navrh):** upozornenie, ak je ocenenie staršie ako 3 mesiace (číslo na potvrdenie).
