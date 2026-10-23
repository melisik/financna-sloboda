# Externá revízia: nálezy (2026-10-14)

Reviewer: Claude (nezávislá revízia balíka `Finančná sloboda: revízny balík`, 1411 riadkov, main 13182f0).
Reviewer len číta a hlási. Dokumenty nemenil. Opravy robí autor po rozhodnutí zakladateľa.

## Metóda

- Prečítané všetky sekcie balíka: 00, 01, 02, 03, 04, 05, 06, 07, 08, `Decisions.md`, prílohy (revizné záznamy, poznámky, O-9 podklady).
- Výpočty: nezávisle prepočítané (Python, uzavretý tvar FR-02 a iterácia D-046). Overené: GC-03, GC-04, GC-05, GC-06, GC-07, GC-09, GC-10, GC-12, GC-13, GC-15, GC-18, GC-20, GC-21, GC-23; príklad FR-04 (+6 mesiacov) a 100 € (0,12 mesiaca). Vzorec FR-02 je algebraicky totožný s `NPER(i; −m; −K; T; 0)`.
- Kód nebol overovaný (podľa zadania). Tvrdenia o implementácii (napr. `08` hlavička) sú len konzistenčne skontrolované.
- Všetky čísla GC v tabuľke sa zhodujú. Problémy sú v logike, konzistencii dokumentov a pokrytí testami.

## Kritické

Nenašiel som nič, čo by zmenilo zobrazený dátum pri správnom zadaní vstupov. Výpočtové vzorce sú správne.

## Vysoké

### RR32 – Na čo sa vzťahuje výnos r (00, 02, D-032 vs. D-036, 04)
- **Kde:** `00` „Existujúca investícia v MVP“ a `02` UR-03: „jeden globálny predpoklad r pre celý kapitál“. D-032: „pre celý kapitál“. `04` pojmy a FR-02: r sa uplatňuje len na K_inv, K_cash je 0 % reálne (D-036).
- **Problém:** dve pravidlá pre to, na čo sa r vzťahuje. Zdroj v `00` a `02` ešte neodráža D-036, a RR1 je označené ako uzavreté, hoci tento text ostal.
- **Prečo:** rozdiel mení výsledný dátum cieľa aj zobrazený text.
- **Návrh:** zosúladiť `00` a UR-03 s D-036 (r = K_inv). Pri D-036 doplniť, či je hotovostná sadzba nastaviteľná (text hovorí „vlastná sadzba, predvolene 0 %“), alebo fixná 0 % (FR-02 hovorí fixná). Reopen RR1.
- **Otázka pre zakladateľa:** má mať K_cash nastaviteľnú sadzbu (default 0 %), alebo je vždy 0 %?

### RR33 – Rozdelenie kapitálu a mesačného sporenia v rozhraniach (04 FR-02/FR-04, 05 §5, D-039, D-041, D-046)
- **Kde:** `05` §5 má `monthsToTarget(K, m, r, T)` a `monthlySaving(...) → m`. D-041 a D-046 vyžadujú K_inv, K_cash, m_inv, m_cash. `04` FR-04 používa jedno K na výpočet n(K_pred).
- **Problém:** signatúry funkcií nezodpovedajú pravidlám. Nie je definované, ako sa m delí na m_inv a m_cash (sporenie → m_cash, investícia → m_inv). FR-04 nedefinuje, ako sa K_pred rozdelí na K_inv a K_cash, a teda ktorú vetvu výpočtu použiť.
- **Prečo:** vývojár nevie, ako implementovať `pendingImpact` a `monthsToTarget`. Výsledok závisí od toho, koľko je v hotovosti.
- **Návrh:** doplniť do `04` pojmy a FR-02: definíciu m_inv a m_cash (zdroj: typ transakcie) a signatúru `monthsToTarget(Kinv, Kcash, minv, mcash, r, T)`. V `05` §5 zodpovedajúco upraviť `monthlySaving` (vracia dva čísla) a `pendingImpact` (vstup K_inv, K_cash). V FR-04 explicitne: K_pred sa počíta po zložkách.

### RR34 – Nedostatok kapitálu: pravidlá sa líšia a suma sa stráca (04 FR-08, D-021, D-059, GC-15, GC-19)
- **Kde:**
  - FR-08 odrážka 2 („z hotovosti“): výdavok sa nevykoná, ponúka sa „z investícií“.
  - D-021 a O-6: upozornenie a potvrdenie, ponúka sa „z príjmu“; text „kapitál by bol vyčerpaný“ (D-021) vs. „Hotovosť nestačila; kapitál je 0 €“ (FR-08, O-6).
  - D-059 (investície): potvrdenie, K_inv = 0, zvyšok sa nikde neeviduje.
  - GC-19: výdavok 25 000 € > K_cash je zamietnutý, s ponukou „z investícií“.
- **Problém:** tri rôzne pravidlá pre nedostatok kapitálu. Pri potvrdenom prečerpaní (D-059, D-021, GC-15) suma nad kapitál zmizne bez záznamu v účtovníctve (K sa zarovná na 0, zvyšok nikde nie je).
- **Prečo:** používateľ neuvidí, odkiaľ suma pochádza. Pri mesačnom vyhodnotení sa síce hodnoty obnovia, ale predbežný dopad je medzitým skreslený.
- **Návrh:** zjednotiť pravidlo pre všetky tri zdroje (blokovať, alebo potvrdiť). Pri potvrdenom prečerpaní určiť, kam ide rozdiel (napr. automaticky „z príjmu“ pre zvyšok, alebo záznam „nekrytý výdavok“). Uviesť jediný text a zosúladiť GC-15, GC-19, D-021, D-059 a FR-08. Reopen RR10 (RR10 je uzavreté len pre K_inv).
- **Otázka pre zakladateľa:** pri nedostatku kapitálu z kapitálu: blokovať výdavok (ako GC-19), alebo potvrdiť a zvyšok zaevidovať ako „z príjmu“?

### RR35 – Predvolená miera výberu 3,7 % je z iného horizontu než aplikácia (D-049, 00, 04 pojmy, GC-07, GC-12, D-065)
- **Kde:** D-049 a `review/o9-podklady.md`: 3,7 % je Morningstar 2025, základný prípad USA, 90 % pravdepodobnosť **30 rokov**. Aplikácia počíta s 27–55 rokmi (GC-03 334 mesiacov; GC-07 549; GC-12 656; hranica 50 rokov; D-065 poznámka nad 20 rokov).
- **Problém:** predvolená hodnota je odvodená z 30-ročného horizontu, ale aplikácia ju používa na dlhšie obdobie. `00` tabuľka síce hovorí „pri dlhom horizonte 3–3,5 %“, ale predvolená hodnota sa nepoužije ani neupraví podľa horizontu.
- **Prečo:** zavádzajúce voči používateľovi. Predvolené číslo vyzerá ako overená hodnota pre celý horizont, hoci platí pre 30 rokov. Pri dlhšom horizonte je riziko vyčerpania vyššie a používateľ dostane falošnú istotu.
- **Návrh:** buď predvolená hodnota s explicitným zdôvodnením „pre horizont 30 rokov“ a upozornením pri dlhšom horizonte (už D-065 pre 20+), alebo predvolená hodnota konzervatívnejšia (napr. 3,5 %, ako r). Doplniť do D-049, že 3,7 % neplatí pre horizont nad 30 rokov.
- **Otázka pre zakladateľa:** má mať predvolená miera výberu pevný zdroj (Morningstar 30 r), alebo sa má odvodiť z horizontu?

### RR36 – Právne a regulačné riziko východiskových hodnôt (00 riziká, D-028, D-061, 08 §1, O-9 §3)
- **Kde:** predvolené 3,5 % reálny výnos, miera výberu 3,7 %, rozsahy 2–6 % a 3–4 %, „bezpečná miera“ (Trinity/Morningstar), zobrazenie dátumu cieľa ako odhadu.
- **Problém:** kombinácia predvolených investičných predpokladov, bezpečnej miery výberu a výsledného dátumu blízko hranice investičného poradenstva (MiFID II, označené v `00`). D-061 premenovanie („východiskové predpoklady“) rizikovú povahu nemení. D-028 riziko prijal zakladateľ pre fázu 1, ale podklady výslovne hovoria, že zdroje sú sekundárne (O-9 §3), a RR29 je otvorené.
- **Prečo:** ak sa aplikácia zdieľa (aj jednému ďalšiemu používateľovi), vzniká otázka poradenstva. Roadmapa M3 má výstupné kritérium „zdroj zapísaný v Decisions“, ale 00 hovorí, že hodnoty sa majú overiť pred M3 (M6), a RR29 je otvorené. Brána M3 nie je reálne splnená.
- **Návrh:** (1) v 06 §9 doplniť rozhodnutie „overenie zdrojov r a miery výberu pred M3“ s vlastníkom a termínom; (2) v M3 kritériu rozlíšiť „zdroj zapísaný“ a „zdroj overený v primárnom dokumente“; (3) pred zdieľaním s kýmkoľvek mimo zakladateľa právne posúdenie predvolených hodnôt.
- **Otázka pre zakladateľa:** overiť primárne zdroje (Morningstar 2025, UBS Yearbook 2025) pred M3, alebo ponechať sekundárne a označiť?

### RR37 – Poplatky: MVP rozsah v rozpore (00 Východiskové, 04 §6, D-064, 08 §7)
- **Kde:** `00`: „Dane a poplatky sa v MVP neriešia“. `04` §6 „Mimo rozsahu MVP: Daně, poplatky“. D-064 a `08` §7: poplatky ako samostatný vstup v MVP (predvolene 0 %), odpočítavajú sa od r; `04` pojmy a FR-02 to už uvádzajú.
- **Problém:** scope je opísaný dvakrát, s opačným záverom. Implementácia (podľa 08) zahŕňa poplatky, dokumenty ich vylučujú.
- **Prečo:** nejasné, či poplatky patria do MVP; ovplyvňuje to testy aj text pre používateľa.
- **Návrh:** upraviť `00` a `04` §6: poplatky sú vstup v MVP (predvolene 0 %), dane sú mimo. Doplniť do 07 §14 a 06 §8, že dane sú mimo a poplatky sú v MVP. Doplniť, ako poplatky vstupujú do scenárov FR-03 (RR47).

### RR38 – iPhone: plocha „povinná“, ale onboarding ju dá preskočiť (04 FR-12, D-042, D-053, 05 §11)
- **Kde:** FR-12: „Každý krok sa dá preskočiť a doplniť neskôr“. D-042: plocha na iPhone je **povinná**. D-053: „povinná výzva pri prvom otvorení v Safari“. 05 §11: „kým appka nie je na ploche, zobrazí sa len návod“.
- **Problém:** tri formulácie: povinné, preskočiteľné, len návod. Výsledok na iPhone nie je určený.
- **Prečo:** iPhone je jediná kópia dát a zdroj rizika straty dát (06 §4, D-035). Ak sa dá obísť, mitigácia nefunguje.
- **Návrh:** rozhodnúť: (a) výzva blokuje ďalší krok (dáta sa zapisujú až po pridaní na plochu), alebo (b) výzva je silná, ale preskočiteľná s viditeľným upozornením a pripomienkou zálohy. Upraviť FR-12, D-053, 05 §11 a 03 kľúčové toky tak, aby zodpovedali zvolenej možnosti.
- **Otázka pre zakladateľa:** blokovať prvé nastavenie na iPhone, kým appka nie je na ploche, alebo povoliť preskočenie s upozornením?

## Stredné

### RR39 – Reálne a nominálne zobrazenie (D-063, 00 Východiskové, 04 §6, 08 §7)
- **Problém:** D-063 hovorí, že nominálne číslo je „hlavné zobrazenie“, ale výpočet je reálny (FR-02). Nie je jasné, či sa dátum cieľa zobrazuje nominálne (s nominálnym r a T v nominálnych eurách), alebo sa len vedľa reálneho zobrazí nominálny výnos. `00` hovorí, že projekcia podľa inflácie je odložená, a D-063 ju zavádza do MVP. Aj m je nominálny vklad, ale FR-02 hovorí „v reálnych hodnotách“ bez vysvetlenia.
- **Návrh:** rozhodnúť, čo je hlavné číslo; definovať, či sa m a T vnímajú reálne (dnešné eury) a zobrazenie nominálneho dátumu. Zosúladiť 00 s D-063. π = 2 % ostáva ako predpoklad (RR29).

### RR40 – Stav implementácie a schéma nastavení (08 hlavička a §7, 05 §4)
- **Kde:** `08` hlavička: „Implementované (2026-10-14) ... Nič z tohto dokumentu nie je v kóde.“ Tie dve tvrdenia si odporujú. `08` §7 hovorí „Implementácia (hotová)“. `05` §4 (settings) neobsahuje `feesRate`, `returnSource`, `assumptionsVersion`, hoci 08 ich zavádza.
- **Návrh:** opraviť hlavičku `08`. Doplniť nové polia do `05` §4 a do FR-17/FR-18 (zálohy).

### RR41 – Počet testov je v dokumentoch rôzny (RR5, RR15, 07 §2, poznámky §1 a §4)
- **Kde:** 63 jednotkových (RR5, poznámky §1, „tsc“ a „63 prechádza“), 70 (RR15 „07 §2 (70 testov)“, poznámky §4), 76 (07 §2 text „76 jednotkových testov Vitest a 6 E2E“).
- **Návrh:** zjednotiť na jedno číslo z aktuálneho stavu repozitára. Reopen RR5 a RR15 (označené uzavreté, ale nie sú zosúladené).

### RR42 – Rozhodnutia bez testu (07 §2 a §6, D-055, D-057, D-059, D-060, D-063, D-064, D-065, S10)
- **Problém:** tieto rozhodnutia nemajú testovaciu položku ani v tabuľke pokrytia (07 §2), ani v §6 (úložisko): D-055 (prepis vyhodnotenia s potvrdením), D-057 (prázdne polia a výzva), D-059 (prečerpanie investícií s potvrdením), D-060 (náhľad vkladu do rezervy), D-063 (nominálne zobrazenie), D-064 (poplatky), D-065 (poznámka nad 20 rokov), S10 (text z poznámky a importu sa nevykoná).
- **Návrh:** doplniť riadky do 07 §2 (tabuľka pokrytia), ku každému typ testu (jednotkový/komponentový/E2E).

### RR43 – Milníky nepokrývajú všetky GC prípady (06 §4 M1, 07 §3)
- **Problém:** M1 uvádza GC-01 až GC-14, GC-15, GC-16 a GC-17 až GC-21. GC-22, GC-23 a GC-24 nie sú v žiadnom milníku. GC-22 (rezerva ledger) nemá označený test (07 §3).
- **Návrh:** doplniť GC-22 až GC-24 do M1 (výstupné kritérium), alebo ich zaradiť do M3 s odôvodnením. Zosúladiť tvrdenie „všetky GC-01 až GC-14 prejdú“.

### RR44 – Kódy nálezov: duplicity a tvrdenie o označení (revizne-zaznamy.md, RR20)
- **Problém:** kódy L1, L2, L3 a L4 sa použili dvakrát pre rôzne témy (riadky „L1 Dátum“ a „L1 Verzia 00“, atď.). RR20 tvrdí, že D-011, D-019, D-025, D-035, D-039 a D-047 sú označené ako zastarané, ale v `Decisions.md` sú označené len D-043 a D-052 (a D-045 v texte). D-017 (÷ 12) nie je označené, hoci D-031 ho mení.
- **Návrh:** premenovať duplicitné kódy (napr. L1a/L1b). Reopen RR20 a doplniť označenie „(nahradené D-xxx)“ do riadkov D-011, D-017, D-019, D-025, D-035, D-039 a D-047.

### RR45 – Investícia so zdrojom „z investícií“ je nedefinovaná (04 entita Transakcia, FR-04, FR-08)
- **Problém:** `04` povoľuje pri investícii zdroj „z príjmu / z hotovosti / z investícií“. FR-04 definuje „investícia z príjmu“ (zvyšuje K) a „investícia z hotovosti“ (presun, K sa nemení). Zdroj „z investícií“ pri typu investícia nemá definované správanie (K_pred).
- **Návrh:** zakázať kombináciu (zdroj „z investícií“ len pre výdavok), alebo definovať (presun z K_inv, nič sa nemení).

### RR46 – Prázdne a nulové vstupy a prázdne stavy (04 FR-01, FR-02, FR-12, D-057, 04 §5)
- **Problém:** FR-01 rieši V ≤ 0 a p ≤ 0, ale nie prázdne (null) hodnoty, hoci D-057 hovorí, že polia sú pri prvom spustení prázdne. Pri prázdnom V alebo p nie je jasné, či sa T počíta, zobrazí sa „nezadané“, alebo výzva. Chýba prázdny stav histórie a snapshotov (FR-15).
- **Návrh:** doplniť do FR-01 a 04 §5: hodnota null = „nezadané“, výpočet sa nespustí, výzva na zadanie. Doplniť prázdny stav histórie a bez snapshotu.

### RR47 – Scenáre: dolná hranica 0 % a poplatky (04 FR-03, 08 §4)
- **Problém:** FR-03: „opatrný: r − 2 p. b. (dolná hranica 0 %)“. 08 §4: „r sa neorezáva pod 0 pri scenári opatrný“. Dve znenia, opačný význam (orezať vs. neorezávať). FR-03 nehovorí, či poplatky (D-064) ovplyvňujú scenáre.
- **Návrh:** zvoliť jedno (odporúčam orezať na 0 % a zobraziť upozornenie), doplniť, či poplatky sa odpočítavajú pred scenármi.

### RR48 – Rozsah prahu 100–500 € (04 FR-07, D-048, 02 UR-05)
- **Problém:** FR-07: „používateľ ho zmení v rozsahu 100–500 €“, ale D-048 a FR-07 hovoria „východiskový rozsah, bez automatického pravidla“. Nie je jasné, či je rozsah vynútený (validácia), alebo len odporúčaný.
- **Návrh:** rozhodnúť: tvrdý limit (validácia), alebo odporúčaný rozsah (voľný vstup). Test pre hranicu.

### RR49 – Prepis vyhodnotenia s rovnakým dátumom (D-055, FR-05, 05 §4, D-044)
- **Problém:** D-055 hovorí, že vyhodnotenie sa „prepíše“, ale história sa zachová. Ak je prepísanie nová snapshot s rovnakým dátumom, D_L a K_L sú nejednoznačné (D-044 hovorí o najneskoršom dátume, nie o poradí). 05 §4 má snapshot s UUID a indexom na dátum.
- **Návrh:** definovať: prepísanie = nový snapshot s „nahrádza“ odkazom; D_L a K_L vyberá posledný platný snapshot (podľa času zápisu pri rovnakom dátume).

### RR50 – Tvrdenie o WebKit 7 dňoch nie je označené ako predpoklad (D-035, H4, 05 §11)
- **Problém:** D-035 hovorí „WebKit obmedzuje skriptovateľné úložisko v Safari na 7 dní bez interakcie“ ako fakt, bez zdroja a bez označenia. 06 §4 a 07 §8 ho označujú ako „overiť“. Je to rozhodujúca premisa pre pripomienku po 7 dňoch aj pre plochu na iPhone.
- **Návrh:** označiť v D-035 ako predpoklad, doplniť zdroj (aktuálna dokumentácia WebKit) a overenie pred M2.

### RR51 – Import odmieta neznáme polia, ale nové polia sú „voliteľné“ (04 FR-18, 08 §3, 05 §4)
- **Problém:** FR-18: „Neznáme polia sa odmietnu“. 08 §3: nové polia (`feesRate`, `returnSource`) sú voliteľné a schéma zostáva 1. Starší build tak odmietne zálohu z novšieho buildu, hoci verzia schémy je rovnaká. Tvrdenie „zálohy vo verzii 1 zostanú čitateľné“ (07 §6) platí len spätne.
- **Návrh:** zvýšiť schemaVersion pri pridaní polí, alebo povoliť voliteľné polia v importe. Doplniť test „import novšieho buildu do staršieho“.

### RR52 – Rozsah CI a E2E (07 §8, 07 §12, D-056)
- **Problém:** 07 §8: E2E na Android a iOS viewporte „každý PR“. 07 §12: pri PR len lint, typecheck, jednotkové, komponentové, npm audit, axe; plné E2E až pri zlúčení do main. D-056: vetvy spúšťajú testy vrátane E2E.
- **Návrh:** zvoliť jeden rozsah (odporúčam: E2E každý PR, plné pri main) a zapísať do D-056 a 07 §12.

### RR53 – Export ako súbor mimo zariadenia (FR-17, 05 §7, D-026)
- **Problém:** export je neošifrovaný JSON s citlivými údajmi. Cez zdieľanie na iPhone sa môže dostať do cloudu. FR-17 len pripomína citlivosť. D-026 šifrovanie v MVP odmieta (zakladateľ prijal).
- **Návrh:** pri exporte doplniť konkrétnu výzvu (uložiť len na zariadenie, nie do zdieľaného cloudu), alebo zvážiť voliteľné heslo na export (S5 je otvorené). Zachovať D-026 ako prijaté riziko, ale zapísať dôsledok.

### RR54 – Text pri nedosiahnuteľnom cieli odporúča zmenu miery výberu (poznámky §2, UNREACHABLE_IMPACT_TEXT, D-007, D-061)
- **Problém:** text hovorí: „zvážiť mieru výberu v rozsahu 3–4 %“. To je odporúčanie parametra investičnej stratégie, čo protirečí D-007 a princípu „informácia, nie tlak“ (03 §2) a kroku D-061.
- **Návrh:** odstrániť odporúčanie miery výberu z textu. Ponechať iba výpočet (sporenie, výdavky, zdroj „z príjmu“) a odkaz na vlastnú hodnotu používateľa.

### RR55 – Rozsah MVP je široký (00 riziká, 06 §4)
- **Problém:** `00` odporúča „MVP s najmenším jadrom (záznam rozhodnutia + prepočet cieľa)“. Dokumenty ale definujú 19 funkčných požiadaviek (FR-01 až FR-19), export/import, PWA, rezervu, poplatky, nominálne zobrazenie a dlhý horizont. 06 má len všeobecné riziko „pretiahnutý rozsah“ bez rozhodnutia.
- **Návrh:** rozhodnúť, ktoré FR sú nutné pre M7 (vydanie 0.1), a zvyšok označiť ako backlog (napr. nominálne zobrazenie, poplatky, dlhý horizont).

## Nízke

### RR56 – Dve metódy pre zlomok mesiaca (D-046, 07 §4)
- **Problém:** pri m_cash = 0 sa používa uzavretý tvar (presný zlomok), pri m_cash > 0 lineárna interpolácia medzi celými mesiacmi. Na hranici m_cash → 0 je n nespojitá (malá chyba interpolácie). Invariant „n nerastie“ (07 §4) sa nevzťahuje na rozdelený prípad, a nie je definovaný.
- **Návrh:** pridať invariant pre rozdelený prípad a odhad chyby interpolácie (napr. max. 0,1 mesiaca).

### RR57 – GC-15: rozdielne hodnoty dopadu (07 GC-15, revizne-zaznamy H2 a K1)
- **Problém:** 07 GC-15 a FR-04 (surový rozdiel, N1): dopad = −154 mesiacov. `revizne-zaznamy` H2: „GC-15 (−155)“ a K1: „ceil rozdiel“. Podľa FR-04 je správne −154.
- **Návrh:** zjednotiť na −154 (FR-04), v revizných záznamoch opraviť H2 a K1.

### RR58 – Chybné odkazy a text (D-021, D-029, 06 §8)
- **Problém:**
  - D-029 odkazuje na D-024 pre predbežný dopad; správny odkaz je D-014.
  - 06 §8 odkazuje na D-046 pre „presun ostáva manuálny“; D-046 je o iterácii, presun je v D-045.
  - 06 §8 má preklep „východiskovýchm“.
  - D-021 má text „kapitál by bol vyčerpaný“, FR-08 a O-6 „Hotovosť nestačila; kapitál je 0 €“ (viď RR34).
- **Návrh:** opraviť odkazy a preklep.

### RR59 – Revízne zadanie uvádza GC-01 až GC-16 (review/formalna-revizia-zadanie.md, zadanie v balíku)
- **Problém:** zadanie hovorí o GC-01 až GC-16; balík má GC-01 až GC-24. Overenie nezahŕňa GC-17 až GC-24 bez upozornenia.
- **Návrh:** aktualizovať zadanie na GC-01 až GC-24 (pri ďalšej revízii).

### RR60 – Stale stav „otvorené“ pre predvolený zdroj úhrady (revizne-zaznamy S3, D-014, 04 FR-08)
- **Problém:** S3 je „otvorené; čaká na rozhodnutie“, ale D-014 a FR-08 už nastavujú predvolené „z príjmu“.
- **Návrh:** buď uzavrieť S3 odkazom na D-014, alebo otvoriť znova, ak predvolená hodnota nie je schválená.

## Čo je v poriadku

- **Výpočty:** FR-02 (vzorec, poradie vetiev, `ceil(n − 1e-6)`) a FR-04 (dopad) sú správne. Číselne prepočítané GC-03, GC-04, GC-05, GC-06, GC-07, GC-09, GC-10, GC-12, GC-18, GC-20, GC-21, GC-23 sa zhodujú s dokumentom. GC-08, GC-11, GC-14, GC-16, GC-17, GC-19, GC-22 a GC-24 sú skontrolované logicky, nie numericky. NPER identita sedí. GC-21 (1,7 dňa) sedí.
- **Dátum a čas:** D_L ako referenčný dátum (D-024, D-044), orezanie na koniec mesiaca, GC-13 a GC-14 sú konzistentné.
- **Rezerva:** D-058 (voľba A) je konzistentne aplikovaná v FR-04, FR-08 a GC-19, GC-22 a GC-24.
- **Súkromie:** lokálne dáta, bez sieťových volaní (FR-16, 07 §7), sieťový test, CSP bez inline skriptov, bez tretích strán.
- **Dokumentácia rozhodnutí:** `Decisions.md` je úplný záznam a väčšina zmien je označená.

## Čo je najdôležitejšie pred implementáciou

1. **RR33 a RR32:** rozdelenie kapitálu (K_inv, K_cash) a mesačného sporenia (m_inv, m_cash) na úrovni signatúr a pravidiel. Bez toho nie je možné implementovať `monthsToTarget` a `pendingImpact` tak, ako sú popísané.
2. **RR34:** jednotné pravidlo pri nedostatku kapitálu a zaevidovanie nekrytej sumy.
3. **RR35 a RR36:** predvolená miera výberu a východiskové hodnoty (horizont, zdroje, právny rámec) pred M3.
4. **RR37 a RR38:** scope poplatkov a správanie na iPhone pri prvom nastavení.

## Otázky pre zakladateľa

1. **RR32:** má mať K_cash nastaviteľnú sadzbu (predvolene 0 %), alebo je vždy 0 %?
2. **RR34:** pri nedostatku kapitálu z kapitálu blokovať výdavok, alebo potvrdiť a zvyšok zaevidovať ako „z príjmu“?
3. **RR35:** má predvolená miera výberu zostať 3,7 % (zdroj: 30-ročný horizont), alebo ju zosúladiť s horizontom používateľa?
4. **RR36:** overiť primárne zdroje (Morningstar 2025, UBS Yearbook 2025) pred M3, alebo ponechať sekundárne a označiť?
5. **RR38:** blokovať prvé nastavenie na iPhone, kým appka nie je na ploche, alebo povoliť preskočenie s upozornením?

## Poznámka k repozitáru

- `review/formalna-revizia-2026-10-14.md` je v pracovnom priečinku ako nesledovaný súbor (`??`). Nebol som ho čítať ani meniť. Poznámky k revízii (§1 bod 7) hovoria, že tento súbor nie je v repozitári, takže je pravdepodobne vaša lokálna kópia.
- Tento súbor je nový a nesledovaný. Necommitoval som ho ani nepushol, lebo ste o to nežiadali. CLAUDE.md predpisuje commit a push po zmene; ak chcete, commitnem ho.

## Nové kódy

Kódy RR32 až RR60 sú nové a zapisujú sa do `review/revizne-zaznamy.md` po schválení zakladateľom. Reopen: RR1, RR5, RR10, RR15, RR20.
