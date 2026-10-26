# 60 – Prehľad nedokončených oblastí (2026-10-26)

> Stav: **návrh na rozhodnutie**. Kód sa nemení. Zostavil autor kódu z `docs/`, `decisions/Decisions.md` a kódu na `main` (`a6836a1`, D-322). Nadväzuje na `docs/50` (2026-10-25), ktorý pokryl Sklad a Dane; tu sú všetky oblasti, ktoré používateľ v appke vidí, a dokumenty so zastaraným stavom. Čo nie je v dokumentoch, je označené ako predpoklad.

## 1. Ako čítať

Pre pilot je dôležité, čo **tester vidí**. Nedokončená časť je problém vtedy, keď ju vidí a nevie, či je chyba, alebo zámer. Preto pri každej oblasti:
- **Viditeľné v appke:** čo tester stretne a pôsobí nedokončene.
- **Odporúčanie:** dokončiť pred pilotom (D), označiť jasnou vetou (O), skryť do pilotu (S), nechať po pilote (P).

Fáza 2 (Majetok, Záväzky, Investície, Dane, Príjmy, Sklad) je len v súkromnom náhľade (D-248), takže verejných používateľov sa netýka.

## 2. Súhrn

| Oblasť | Hotové | Chýba | Viditeľné v appke | Odporúčanie |
| --- | --- | --- | --- | --- |
| **Dane** | evidencia prenájmu (D-157), riadok 11 (D-158), tlačivo 17-dp-md (D-161, D-208, D-314), psy (D-159), daňový režim investície ako údaj (D-104) | overenie zdrojov; XML priznania krok 2b (šablóna 2a je len v `public/`, v appke nie je); termíny (N-18); predaj nehnuteľnosti; daň z investícií (FR-25) | karty daňového režimu: „Daňový scenár … zatiaľ nemá čísla po dani: pravidlá ešte nie sú overené“ | **O** – veta je pravdivá; spresniť, čo z Daní je hotové a čo príde (krátky úvod sekcie) |
| **Investície** | položky s počtom, cenou, menou a kurzom (D-101), ciele (D-258), odvodená suma vo Vyhodnotení | ceny sa zadávajú ručne; import cien súborom (docs/12 B, docs/18 „dvierka“) nie je; daňový režim bez výpočtu | pole „Daňový režim (zatiaľ bez výpočtu, FR-24)“ | **O** – text bez kódu požiadavky: „Daňový režim (len evidencia, nepočíta sa)“ |
| **Majetok – ostatné aktíva** (auto, práva) | názov, odhad, dátum (docs/11 bod 10) | rozhodnutie, či a ako sa počítajú do kapitálu | „Do K sa zatiaľ nepočítajú (predpoklad).“ a „Do K sa zatiaľ nepočíta.“ | **D** – rozhodnúť (otázka 1); slovo „predpoklad“ a skratka K sú pre testera nezrozumiteľné |
| **Majetok – nehnuteľnosť bez režimu** | – | – | „Do K sa zatiaľ nepočíta: zadaj režim.“ | **O** – nahradiť „K“ slovom „kapitál“ |
| **Príjmy – dôchodok a dávky** | zobrazenie zadaných budúcich príjmov (D-154), načítanie súboru vo formáte v1 (D-112, `storage/feed.ts`) | výpočet, vplyv na dátum cieľa (docs/14 otázka 1); integračná služba, ktorá súbor vytvorí, neexistuje | pole „Načítať údaje zo súboru integračnej služby“ (`Prijmy.tsx:127`); súbor tester nemá odkiaľ získať | **S alebo O** – otázka 2 |
| **Automatické vyhodnotenie** | odhad výnosu bez položiek, súčet položiek s nimi (D-116) | import ocenenia súborom (docs/18, oddiel 5) | nič | **P** |
| **Sklad** | celý rozsah `docs/51` | vyhodené v Opakovaných výdavkoch (N-17) | nič | **P** |
| **Transakcie – doklad** | QR, položky, návrhy (D-313 až D-320) | položky z fotky dokladu (N-19) | nič | **P** |
| **Výpočet mimo rozsahu** | – | ochrana pri výnose −100 % a zlom vstupe (N-20) | nič (vstup sa v UI nedá zadať, predpoklad) | **P** |
| **Návod LV (`docs/26`)** | čiastočne overený zakladateľom | čiastočný výpis, viac bytov, menovateľ (`Otvorene_opravy.md` bod 11) | návod v appke | **P** – zakladateľ pri príležitosti |
| **Rodinná verzia, účty, integračná služba** | len návrhy (`docs/16`, `Navrh_ucty.md` D-148, `docs/15`) | všetko | nič | **P** |

## 3. Dokumenty so zastaraným stavom

Tieto dokumenty v hlavičke tvrdia „návrh“ alebo „nič sa neimplementuje“, hoci časť je v kóde. Nový čitateľ (reviewer, audítor, právnik) by sa pomýlil.

| Dokument | Hlavička hovorí | Skutočnosť |
| --- | --- | --- |
| `docs/09_Navrh_Nehnutelnosti_Dane.md` | pracovný návrh, nič sa neimplementuje | nehnuteľnosti a dane sú implementované (D-156 až D-161, D-208) |
| `docs/11_Karta_majetku.md` | návrh na diskusiu, kód na vetve, na `main` sa nedostane | karta je v `main` (D-304), zbalené bloky D-310 |
| `docs/10_Mapa_produktu_NAVRH.md` | návrh na diskusiu | časť položiek je hotová; mapa nie je aktualizovaná |
| `docs/12_Sekcia_Investicie.md` | otázky 1 až 5 otvorené | otázky 1 a 2 rozhodnuté (D-101); 3 až 5 otvorené |
| `docs/14_Vyhlad_Dochodok_Davky.md` | otázky 1 až 4 otvorené | čiastočne rozhodnuté D-154 (len zobrazenie) |
| `docs/15_Integracna_sluzba.md` | otázky 1 až 4 otvorené | otázka 1 rozhodnutá (A, D-112); ostatné otvorené |
| `docs/18_Automaticke_vyhodnotenie.md` | otázky 1 a 2 otvorené | otázka 1 rozhodnutá (A, D-116) |
| `docs/00` až `docs/07` | verzie z 2026-10-14 | od vtedy ~300 rozhodnutí; základné dokumenty (vízia, požiadavky, architektúra, roadmapa) neodrážajú Fázu 2 ani pilot |

Návrh: doplniť do hlavičiek stav podľa rozhodnutí (bez prepisovania obsahu). Základné dokumenty `00` až `07` sú väčšia práca; navrhujem ich aktualizovať až pred bránou G1 (právnik) a G4 (audit), ktoré z nich budú vychádzať.

## 4. Riziká

- **Kognitívna záťaž a dôvera:** vety so skratkou „K“, kódom „FR-24“ alebo slovom „predpoklad“ tester nepochopí a môže ich považovať za chybu.
- **Zavádzanie:** tlačidlo na súbor, ktorý nikto nemá, vyzerá ako nefunkčná funkcia.
- **Technický dlh v dokumentácii:** zastarané hlavičky a základné dokumenty sťažia externé posúdenie (G1, G4).
- Nič z prehľadu nemení výpočty (D-153).

## 5. Otázky na rozhodnutie

1. **Ostatné aktíva (auto, práva):** (a) **nepočítať do kapitálu a povedať to jasne** („Slúži len na prehľad majetku; do dátumu cieľa sa nepočíta.“) – odporúčam, auto sa bežne nepredáva na financovanie cieľa; (b) počítať do kapitálu (zmena výpočtu počas pilota, D-153, potrebuje výnimku).
2. **Načítanie súboru v Príjmoch:** (a) **skryť, kým neexistuje integračná služba** – odporúčam; (b) nechať s vetou, že súbor zatiaľ nič nevytvára.
3. **Texty s „K“, „FR-xx“ a „predpoklad“ v appke:** prepísať na bežné slová (kapitál, „len evidencia, nepočíta sa“) – **áno (odporúčam)**?
4. **Úvod sekcie Dane:** krátky odstavec, čo je hotové (evidencia, tlačivo) a čo nie (výpočet dane, priznanie z prenájmu) – **áno (odporúčam)**?
5. **Hlavičky dokumentov (oddiel 3):** opraviť teraz – **áno (odporúčam)**; základné dokumenty 00 až 07 až pred G1 a G4?
