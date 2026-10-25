# 52 – Návrh: upozornenia na daňové termíny

> Stav: **návrh upravený podľa odpovedí zakladateľa** (2026-10-25, oddiel 6); čaká na overenie termínov a potvrdenie oddielu 6. Kód sa nemení. Zakladateľ zvolil začať termínmi (`docs/50` oddiel 3, otázka 2). Appka neukáže žiadnu sumu dane. D-153: bez zmeny výpočtu.

## 1. Termíny na overenie

**Všetky termíny v tabuľke sú predpoklad** zo všeobecných znalostí autora, nie z overeného zdroja. Stránky Finančnej správy a slovensko.sk nie sú z vývojového prostredia dostupné (`docs/Navrh_dane_uctovnictvo.md`, oddiel 8). Pred implementáciou ich musí overiť zakladateľ a zapísať zdroj a dátum overenia (D-104, FR-25). Termín, ktorý sa neoverí, sa v appke neukáže.

| # | Termín (predpoklad) | Kedy sa týka používateľa | Údaje v appke, podľa ktorých sa to pozná | Zdroj na overenie |
| --- | --- | --- | --- | --- |
| T1 | Priznanie k dani z nehnuteľností do **31. januára** roka po roku, v ktorom nehnuteľnosť nadobudol (stav k 1. januáru). Podáva sa len pri vzniku, zmene alebo zániku povinnosti. | nová nehnuteľnosť alebo zmena | dátum obstarania nehnuteľnosti (D-156) | zákon o miestnych daniach, stránka obce, slovensko.sk |
| T2 | Rovnaké priznanie (17-dp-md) pri **psovi** do 31. januára roka po roku, keď psa začal držať. | nový pes | dátum vzniku pri psovi (D-159) | VZN obce, slovensko.sk |
| T3 | Pri zániku povinnosti (predaj nehnuteľnosti, pes uhynul) čiastkové priznanie alebo oznámenie v lehote, ktorú treba overiť (predpoklad: 30 dní). | zánik | dátum zániku pri psovi; predaj nehnuteľnosti appka zatiaľ neeviduje (`docs/50`) | zákon o miestnych daniach |
| T4 | Daňové priznanie typu B (príjem z prenájmu) do **31. marca** nasledujúceho roka; odklad o 3 mesiace oznámením do 31. marca (predpoklad). Daň je splatná v lehote na podanie. | prenájom s príjmom nad hranicou oslobodenia | evidencia prenájmu (D-157), riadok 11 (D-158) | zákon o dani z príjmov, podpora.financnasprava.sk |
| T5 | Registrácia na daňovom úrade pri prenájme (D-267: vždy povinná); **lehota** na overenie. | začiatok prenájmu | dátum začiatku prenájmu (D-156) | zákon o správe daní |
| T6 | Splatnosť dane z nehnuteľností a za psa podľa rozhodnutia obce (predpoklad: do 15 dní od právoplatnosti, alebo v splátkach podľa VZN). | každý rok | – | rozhodnutie obce |

T6 navrhujem **neukazovať** ako termín: dátum je v rozhodnutí obce, appka ho nepozná. Stačí veta s odkazom, že splatnosť je v rozhodnutí.

## 2. Návrh správania

1. **Kde:** v sekcii Dane blok „Termíny“ a na Prehľade pripomienka rovnakého typu ako ostatné (D-107), keď sa termín blíži.
2. **Kedy:** pripomienka **30 dní** pred termínom (otázka 2) a do termínu. Po termíne jedna veta „Termín bol 31.01.; ak si priznanie podal, pripomienku skry.“
3. **Len keď sa používateľa týka:** podľa údajov v appke (stĺpec „Údaje“). Bez nehnuteľnosti, psa a prenájmu sa nič neukáže.
4. **Text:** čo, do kedy, odkaz na oficiálnu stránku alebo na tlačivo v appke (17-dp-md, D-161). Bez súm a bez rady.
5. **Skryť:** „Podané“ skryje pripomienku pre daný rok (uloží sa pri položke; v zálohe).
6. Pri každom termíne malým písmom: „Termín overený k [dátum overenia]“.

## 3. Riziká

- **Nesprávny termín** môže spôsobiť pokutu. Preto len overené termíny, so zdrojom a dátumom overenia; každý rok kontrola (pripomienka kontroly nastavení, D-151, sa môže rozšíriť).
- **Neúplné údaje:** bez dátumu obstarania appka nevie, či sa T1 týka. Vtedy nič neukáže a v Daniach bude veta, že termíny sa ukážu po doplnení dátumu.
- **Právne:** pripomienka nie je daňové poradenstvo; doplniť do podkladu pre právnika (G1).

## 4. Postup

1. Zakladateľ overí T1 až T5 a pošle zdroj a dátum overenia (stačí odkaz alebo citát).
2. Autor zapíše overené termíny do tohto dokumentu, rozhodnutie a až potom implementuje (test najprv).
3. Zápis do `docs/pilot/zmeny-pocas-pilota.md` (UI) a `docs/41`.

## 5. Otázky na rozhodnutie

1. Súhlasíš so správaním v oddiele 2?
2. Pripomienka **30 dní vopred (odporúčam)**, alebo inak?
3. T6 (splatnosť podľa rozhodnutia obce) len ako veta, nie termín: súhlas?
4. Overíš T1 až T5? Stačí poslať odkaz na zdroj pri každom.

## 6. Odpovede zakladateľa (2026-10-25) a upravený návrh

**Čo zakladateľ uviedol** (zo skúsenosti; zdroj ešte nie je zapísaný):
- Priznanie k miestnym daniam (nehnuteľnosť, pes) sa podáva **len raz**, pri vzniku povinnosti. Pripomienka na podanie má zmysel.
- **Splatnosť miestnych daní je do 15 dní od doručenia výmeru** obce. Pripomienka 30 dní vopred sa sem nehodí: appka nevie, kedy výmer príde.
- Pri dani z príjmu (DPFO) ostáva pripomienka 30 dní vopred, na **podanie aj zaplatenie**.
- 30 dní vopred tam, kde sa dá.

**Čo sú T1 až T5:** riadky tabuľky v oddiele 1, teda jednotlivé termíny, ktoré treba overiť:
- **T1:** priznanie k dani z nehnuteľností (do 31. januára po nadobudnutí, len raz);
- **T2:** to isté priznanie pri psovi;
- **T3:** lehota pri zániku (predaj nehnuteľnosti, pes uhynul);
- **T4:** daňové priznanie z prenájmu a jeho zaplatenie (31. marca, prípadne odklad);
- **T5:** lehota na registráciu na daňovom úrade pri začiatku prenájmu.

Overiť znamená: pri každom termíne poslať odkaz na oficiálny zdroj (stránka obce, slovensko.sk, Finančná správa), z ktorého autor dátum prepíše do appky. Bez zdroja sa termín v appke neukáže.

**Upravený návrh:**

| Pripomienka | Kedy sa ukáže | Ako appka vie dátum |
| --- | --- | --- |
| Podať priznanie k dani z nehnuteľností (T1) | 30 dní pred 31. januárom po roku nadobudnutia; len raz | dátum obstarania nehnuteľnosti (D-156) |
| Podať priznanie pri psovi (T2) | 30 dní pred 31. januárom po roku vzniku; len raz | dátum vzniku pri psovi (D-159) |
| Zánik (T3) | podľa overenej lehoty | dátum zániku pri psovi; pri nehnuteľnosti až s evidenciou predaja |
| **Zaplatiť miestnu daň (T6)** | **hneď po zadaní dátumu doručenia výmeru**, termín = doručenie + 15 dní | nové nepovinné pole v Daniach: „Výmer doručený dňa“ (za rok, za nehnuteľnosti a psov spolu, alebo osobitne; otázka 7) |
| Podať a zaplatiť DPFO (T4) | 30 dní pred termínom podania | evidencia prenájmu s príjmom v predchádzajúcom roku (D-157) |
| Registrácia (T5) | podľa overenej lehoty od začiatku prenájmu | dátum začiatku prenájmu (D-156) |

T6 sa tým mení z vety (pôvodná otázka 3) na pripomienku, ktorá sa ukáže len po zadaní dátumu doručenia výmeru. Sumu dane appka nepočíta ani nežiada.

**Otázky:**
5. Súhlasíš s upravenou tabuľkou (najmä T6 cez dátum doručenia výmeru)?
6. Lehotu 15 dní od doručenia výmeru máš zo skúsenosti; vieš k nej poslať aj zdroj (napr. text výmeru alebo VZN obce)?
7. Výmer býva jeden za nehnuteľnosti aj psa spolu, alebo osobitne? Od toho závisí, či je pole jedno, alebo pri každej položke.
8. Overíš T1 až T5 podľa vysvetlenia vyššie?

