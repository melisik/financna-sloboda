# 02 – Požiadavky používateľa

> Stav: v0.8 (2026-10-14), rozsah: MVP (fáza 1, jeden používateľ). Zdroj: `00_Project_Vision.md`, `01_Personas.md`, `decisions/Decisions.md`.

> **Aktualizácia stavu (2026-10-26, D-325):** požiadavky MVP (UR) platia; sú implementované (M1 až M7, `docs/06`). Požiadavky Fázy 2 nie sú vedené ako UR, ale v rozhodnutiach a návrhoch `docs/09` až `docs/58`. Prepracovanie na celý rozsah pred bránou G1 (D-323, D-325).

## Používateľské príbehy (MVP)

| ID | Príbeh | Zdroj |
|----|--------|-------|
| UR-01 | Ako používateľ si nastavím cieľ (ročné výdavky, miera výberu, výnos, mesačné sporenie, rezerva) s východiskovými hodnotami, ktoré sa zobrazia ako výzva; polia sú pri prvom spustení prázdne (D-057). | D-008, D-011 |
| UR-02 | Ako používateľ vidím, ktorá hodnota je východisková hodnota a ktorá moja vlastná, a môžem ju zmeniť. | D-011 |
| UR-03 | Ako používateľ zadám existujúcu investíciu: aktuálnu hodnotu. Výnos je jeden globálny predpoklad pre investovaný kapitál K_inv, ktorý si nastavím; hotovosť je bez výnosu (D-036). | D-010, D-032 |
| UR-04 | Ako používateľ zadám transakciu (sporenie, investícia, výdavok) – rýchlo, na telefóne. | D-006, persona 1 |
| UR-10 | Ako používateľ zadám ročné výdavky pri nezávislosti ručne ako odhad. | D-013 |
| UR-05 | Ako používateľ nastavím prahovú sumu, od ktorej sa výdavok zvýrazní v prehľade; všetky výdavky sa ukladajú s príznakom (predvolene 100 €). | [user], D-013, D-030 |
| UR-06 | Ako používateľ po každej transakcii vidím predbežný dopad na dátum cieľa (krátky text). | D-004, D-014 |
| UR-11 | Ako používateľ na konci mesiaca urobím mesačné vyhodnotenie (pripomenutie pri vynechaní, D-016): zadám hodnotu investícií a nasporenú sumu a vidím prepočítaný cieľ (cieľová suma a dátum ako rozsah opatrný/základný/optimistický). | D-011, D-014 |
| UR-12 | Ako používateľ pri zadaní výdavku zvolím zdroj úhrady (z príjmu – predvolené / z hotovosti / z investícií; D-045). | D-014, D-045 |
| UR-07 | Ako používateľ vidím históriu všetkých transakcií (záznam rozhodnutí). | D-004 |
| UR-08 | Ako používateľ môžem dáta exportovať a importovať (záloha). | D-009 |
| UR-09 | Ako používateľ vidím predpoklady a obmedzenia výpočtu (pravidlo 4 %, predvolene miera výberu 3,7 % (D-051), bez daní a poplatkov; hotovosť má 0 % reálne – predpoklad, D-036). | D-008 |

## Nefunkčné požiadavky (MVP) [predpoklad]
- **Mobile-first:** plne použiteľné na telefóne.
- **Lokálne ukladanie:** dáta ostávajú v zariadení (D-009); žiadne odosielanie na server.
- **Nízka kognitívna záťaž:** málo polí, jasný jazyk, žiadne zbytočné upozornenia; prepočet cieľa podáva informáciu, nie tlak.
- **Transparentnosť:** každý výpočet ukazuje vstupy a predpoklady.
- **Slovenčina** v rozhraní; texty pripravené na neskoršie preklady (EÚ).

## Vyriešené rozhodnutia (D-013)
- **Ročné výdavky pri nezávislosti** zadáva používateľ ručne (odhad celkových výdavkov); z transakcií sa neodvodzujú, pretože sa evidujú len výdavky nad prahom.
- **Mesačné sporenie a investovanie** sa odvodzuje z transakcií typu sporenie/investícia (evidujú sa vždy).
- **Prah** platí len pre výdavky. Predvolená hodnota je **100 €**, používateľ ju môže zmeniť.
- **Vplyv cielenej spotreby na cieľ:** evidovaný výdavok **znižuje kapitál len vtedy, ak je hradený z kapitálu** (zdroj úhrady, D-014 a FR-08); výdavok z príjmu kapitál nemení. Ak je hradený z kapitálu, investovateľný kapitál sa zníži o sumu výdavku a posunie sa odhadovaný dátum cieľa. Cieľová suma (T = V / p, D-049) sa výdavkom nemení.

## Predpoklady a riziká k vyriešeným rozhodnutiam [predpoklad]
- Model „výdavok znižuje kapitál“ predpokladá, že sa výdavok hradí z naakumulovaného kapitálu. Ak ho používateľ v skutočnosti platí z bežného príjmu, aplikácia bude dátum cieľa nadhodnocovať (cieľ vyzerá ďalej, než je). Treba to používateľovi jasne povedať a zvážiť pri zadávaní výdavku voľbu „hradené z kapitálu / z príjmu“ (zdroj úhrady podľa D-014).
- Aby nedochádzalo k dvojitému započítaniu, mesačné sporenie sa počíta len z transakcií sporenie/investícia.

## Zdroj úhrady a mesačné vyhodnotenie kapitálu (potvrdené, D-014)
Zadanie [user]: pri výdavku riešiť zdroj úhrady (z kapitálu / z príjmu); **bežný kapitál vyhodnocovať mesačne, nie denne.**

Potvrdené zakladateľom:
1. Pri zadaní výdavku používateľ zvolí **zdroj úhrady**: „z príjmu“ (predvolené, kapitál sa nemení) alebo „z hotovosti“ či „z investícií“ (znižuje kapitál).
2. Kapitál sa **oficiálne prepočítava raz mesačne** pri „mesačnom vyhodnotení“: používateľ zadá aktuálnu hodnotu investícií a nasporenú sumu. Tým sa kapitál zosúladí so skutočnosťou (opraví aj chyby a rozdiely z trhu) a odhadovaný dátum cieľa sa potom bere z tohto stavu.
3. Medzi mesačnými vyhodnoteniami aplikácia po každej transakcii ukáže len **predbežný dopad** (napr. „predbežne +2 mesiace“) ako krátky text bez farieb a upozornení; pri vyhodnotení sa nahradí skutočným stavom.
4. Mesačné vyhodnotenie sa robí na **konci mesiaca**. Kapitál = aktuálna hodnota investícií + nasporená suma, zadáva používateľ. „Nasporená suma“ je kumulatívny stav hotovosti, nie prírastok (D-033).

Dôsledok pre D-004: oficiálny prepočet cieľa je mesačný, po transakcii je viditeľný len predbežný dopad (D-014 upresňuje D-004).

Výhody [predpoklad]: menej výkyvov, ktoré by mohli demotivovať (nízka záťaž, ako sme chceli); menej údajov na zadávanie; skutočný stav sa pravidelne opravuje.
Riziko [predpoklad]: ak používateľ mesačné vyhodnotenie vynechá, kapitál a dátum cieľa zastarajú; aplikácia má pripomenúť, nie nútiť, a jasne ukázať dátum posledného vyhodnotenia.

## Otvorené otázky
Žiadne. Vyriešené v D-016 (vynechané vyhodnotenie, rozdiel predbežný vs. skutočný stav) a D-014 (zdroj úhrady, mesačné vyhodnotenie).
