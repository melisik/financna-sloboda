# 50 – Prehľad rozpracovaných a neúplných oblastí

> Stav: **rozhodnuté** (2026-10-25, D-298): 1 S-B (`docs/51`), 2 áno (`docs/52`), 3 áno (`docs/53`), 4 áno (druhá revízia), 5 áno (hotové). Zostavil autor kódu z `decisions/Decisions.md`, návrhov v `docs/` a kódu. Kód sa nemení. Čo nie je v dokumentoch, je označené ako predpoklad.

## 1. Zhrnutie

| Oblasť | Hotové | Chýba | Kto | Odporúčanie |
| --- | --- | --- | --- | --- |
| **Sklad a recepty** | položky, čiarový kód, kamera, dávky, upozornenia, recepty a uvarenie | prepojenie na financie; chýba návrh, aký je cieľ skladu | zakladateľ (smer), autor | rozhodnúť smer (oddiel 2) |
| **Dane** | evidencia prenájmu, riadok 11, tlačivo 17-dp-md, psy, šablóna XML, režim investícií | overenie zdrojov, generovanie XML, termíny, predaj nehnuteľnosti, dane z investícií | zakladateľ (zdroje), autor | najprv termíny bez daňových čísel (oddiel 3) |
| Príjmy: dôchodok a dávky | zobrazenie zadaných budúcich príjmov (D-154) | odhad, pravidlá | zakladateľ | nechať tak |
| Integračná služba | formát súboru v1 (D-112) | služba neexistuje | – | nechať tak |
| Rodinná verzia | návrh na diskusiu (`docs/16`) | všetko; účty sa neplánujú (D-148) | – | nechať tak |
| Opakované výdavky | blok B1 (D-290, D-296) | pravidlo, ako sa dopĺňajú pravidelné výdavky a transakcie | zakladateľ | malý návrh (oddiel 4) |
| Revízia časti 2 | čiastočne (revízia 2026-10-25) | D-281, D-284, D-286, D-287, D-289, D-278 až D-280 riadok po riadku | reviewer | ďalšia revízia (oddiel 4) |
| Drobnosti z revízie | – | N-4, N-6, N-7, N-9 | autor | balík naraz |

## 2. Sklad a recepty

**Hotové** (D-127, D-130, D-141, D-176, D-232 až D-239, D-284): položky s množstvom a jednotkou, dátum spotreby (aj z fotky obalu), čiarový kód z fotky aj živou kamerou, rovnaký výrobok a dávky, „Použiť ako prvé“, upozornenie na spotrebu v Sklade aj na Prehľade s lehotou pri položke, výber predchádzajúceho výrobku, recepty so surovinami zo skladu a uvarenie s odpočtom.

**Čo chýba:**
- **Cieľ skladu nie je zapísaný.** Pre Sklad neexistuje návrh v `docs/` ako pre ostatné oblasti; rozsah vznikal po rozhodnutiach. `docs/43` uvádza, že Sklad je „ďaleko od jadra appky (cieľ, výdavky, vyhodnotenie)“.
- **Prepojenie na financie nie je žiadne.** Položka skladu nemá cenu. Položky dokladu (D-129) sa do skladu neprenášajú. Appka nevie, koľko stojí to, čo sa vyhodí.
- **Nákupný zoznam** neexistuje (predpoklad: bol by prirodzeným pokračovaním receptov a dávok).
- **Overenie na skutočných výrobkoch:** skener je overený falošnou kamerou v testoch (D-233); či číta reálne obaly v obchode, nie je zapísané (predpoklad: neoverené).

**Možnosti smeru:**
- **S-A Nechať ako pomocníka domácnosti.** Bez ďalšieho vývoja, len opravy. Modul ostáva voliteľný (D-162).
- **S-B Prepojiť s výdavkami (odporúčam ako ďalší krok, ak chceš Sklad rozvíjať).** Z položiek dokladu (D-129) jedným ťuknutím pridať do skladu (názov, množstvo, cena). Pri prešlej spotrebe ukázať hodnotu vyhodenej potraviny a mesačný súčet. Tak Sklad odpovie na otázku appky: koľko ma stojí plytvanie a ako to ovplyvní cieľ.
- **S-C Nákupný zoznam z receptov a minimálnych zásob.** Užitočné pre domácnosť, ale od cieľa appky ďalej než S-B.

Pred implementáciou S-B alebo S-C treba krátky návrh (`docs/51`) s cieľom skladu, ako pri ostatných oblastiach.

## 3. Dane

**Hotové:**
- daňový režim pri investícii ako údaj a karty v sekcii Dane (D-104, D-293);
- prenájom: dátum a cena obstarania (D-156), priebežná evidencia príjmov a výdavkov s ročným súčtom (D-157), riadok 11 tabuľky 1 podľa poučenia (D-158), prílohy k výdavkom (D-221), pojem príjmu a výdavkov (D-266), registrácia (D-267);
- šablóna XML priznania typu B za 2025 (D-220, krok 2a);
- tlačivo 17-dp-md: vyplnenie PDF z nehnuteľností a psov (D-161, D-208);
- evidencia psov (D-159).

**Čo chýba:**
1. **Overenie zdrojov** (D-267 odložené). Stránky Finančnej správy a slovensko.sk nie sú z vývojového prostredia dostupné; overiť musí zakladateľ (zoznam v `docs/Navrh_dane_uctovnictvo.md`, oddiel 8).
2. **Krok 2b: generovanie XML priznania** z ročnej evidencie. Čaká na overenie zdrojov a na test, ako portál prijme šablónu s prázdnymi prepínačmi (zakladateľ).
3. **Upozornenia na termíny.** Návrh (oddiel 6 návrhu daní) počíta s upozorneniami na termíny bez daňových čísel; v kóde nie sú. Napríklad priznanie k dani z nehnuteľností pri vzniku povinnosti, daňové priznanie z prenájmu. Termíny treba najprv overiť (bod 1).
4. **Predaj nehnuteľnosti** (dátum a suma predaja) je v zozname evidencie (oddiel 2 návrhu daní), v appke nie je.
5. **Dane z investícií** (N-02 krok 2, FR-25, D-104): výnos po dani a daň pri výbere. Neotvorené; vyžaduje overené pravidlá a právne posúdenie (G1).
6. **Daň za psa:** sadzby určuje obec (VZN); appka ich nepočíta a zatiaľ nemá prečo.

**Odporúčanie:** najprv **bod 3 (termíny)** ako pripomienky s odkazom na oficiálnu stránku, bez súm. Pred tým potrebuješ potvrdiť termíny (bod 1); autor pripraví ich zoznam na overenie. Bod 2 až po tvojom teste na portáli. Body 4 a 5 až po pilote a právnom posúdení.

Dane menia výpočty len pri bode 5; body 1 až 4 sú evidencia a upozornenia (D-153 sa ich netýka, okrem zápisu zmien UI).

## 4. Menšie otvorené body

- **Pravidelné výdavky a transakcie (D-296, S-1):** ak používateľ zapíše nájom aj ako pravidelný výdavok, aj ako transakciu, je v Rozpočte aj v bloku B1 dvakrát. Návrh pravidla: pravidelné výdavky sa nezapisujú ako transakcie; appka pri výdavku, ktorý sa zhoduje s pravidelným (kategória a suma v danom mesiaci), ponúkne upozornenie. Rozhodnutie zakladateľa.
- **Revízia časti 2:** reviewer kód D-281, D-284, D-286, D-287, D-289 a D-278 až D-280 neprechádzal riadok po riadku. Odporúča samostatnú revíziu pred zlúčením do `main`.
- **Drobnosti z revízie:** N-4 (kategória „Energie“ v testovacej zálohe), N-6 (stav zbaleného filtra), N-7 (súčet „spolu“ bez počtu), N-9 (Ukončiť zahodí neuložené zmeny). Autor ich môže urobiť v jednom balíku.
- **Návod `docs/26`** (list vlastníctva): overený len čiastočne (`docs/Otvorene_opravy.md`, bod 11).

## 5. Otázky na rozhodnutie

1. **Sklad:** S-A (nechať), **S-B (prepojiť s výdavkami, odporúčam, ak ho chceš rozvíjať)**, alebo S-C (nákupný zoznam)?
2. **Dane:** začať **upozorneniami na termíny (odporúčam)**? Autor pripraví zoznam termínov na tvoje overenie.
3. **Pravidelné výdavky a transakcie:** pripraviť malý návrh pravidla?
4. **Revízia časti 2:** spustiť ďalšiu samostatnú revíziu?
5. **Drobnosti z revízie:** urobiť balík N-4, N-6, N-7, N-9?

## 6. Doplnenie po druhej externej revízii (2026-10-25, `review/revizia-vysledok-2026-10-25b.md`)

Kritické ani vysoké nálezy nie sú. Pred zlúčením do `main` reviewer odporúča opraviť S-1 až S-3.

| Nález | Čo | Kto | Odporúčanie autora |
| --- | --- | --- | --- |
| **S-1** | Po uložení alebo zrušení úpravy ostane vo formulári typ a zdroj z poslednej transakcie (napr. „z investícií“), nie predvolené „z príjmu“ (D-288). Nechcený zdroj mení kapitál. | **zakladateľ:** pri sérii nových zápisov pamätať posledný zdroj, alebo vždy „z príjmu“? Návrat po úprave je technická oprava. | Vždy vrátiť na „výdavok, z príjmu“ (predvídateľné, `docs/03`). |
| **S-2** | Zbalený blok Doklad skryje upozornenie, že súčet položiek nesedí so sumou. | autor | Opraviť: stav v súhrne („Doklad · súčet nesedí“) a jeden zdroj stavu `open`, test. |
| **S-3** | Skener bez siete hlási „Kamera nie je dostupná“, hoci sa nenačítala knižnica; obmedzenie platí znova po každej aktualizácii appky. | autor | Opraviť hlášku, spresniť D-284 a `docs/43`, veta do `docs/41`. |
| N-1 | Upozornenie a potvrdenie vyčerpania investícií nie sú v prilepenom pruhu pri tlačidle. | autor | Posunúť políčko do zobrazenia pri tejto chybe. |
| N-2 | Oprava vypnutia kamery (D-284) nemá test. | autor | Doplniť test. |
| N-3 | Zmena textu pruhu Skúšobná verzia bez zvýšenia verzie kľúča by sa neukázala. | autor | Test viazaný na text. |
| N-4 | Otázka 8 pre právnika je užšia než správanie (pruh sa zbalí aj ťuknutím; potom na Prehľade nie je iné upozornenie). | autor | Spresniť podklad pre právnika. |
| N-5 | Texty o poplatkoch si odporujú („pred daňou a poplatkami“ vs. výnos po poplatkoch). | autor | Zjednotiť na „pred daňou, po poplatkoch, ak ich zadáš“. |
| N-6 | Body grafu Vývoj sú rovnomerne, nie podľa dátumu. | autor | Veta pod grafom alebo os podľa dátumu. |
| N-7 | Skloňovanie „22 mesiacov“: pravdepodobne prípustné obe formy; primárny zdroj neoverený. | zakladateľ alebo Jazyková poradňa | Nemeniť; overiť pri príležitosti. |
| N-8 | Posúvateľný riadok sekcií nemá vždy signál, že pokračuje; obrys zamerania môže byť orezaný. | autor | Okraj riadku a jemný signál; overiť úlohou v `docs/41`. |
| N-9 | Blok pripomienok vyká v náhľade, inde appka tyká. | autor | Zjednotiť na tykanie. |

Poradie po oboch revíziách: (1) S-1 až S-3 a nízke nálezy N-1 až N-6, N-8, N-9 ako jeden balík opráv; (2) Sklad etapa 1 (`docs/51`); (3) termíny daní po overení (`docs/52`); (4) zlúčenie do `main` na pokyn zakladateľa.
