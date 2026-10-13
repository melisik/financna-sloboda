# 02 – Požiadavky používateľa

> Stav: v0.3 (2026-10-13), rozsah: MVP (fáza 1, jeden používateľ). Zdroj: `00_Project_Vision.md`, `01_Personas.md`, `decisions/Decisions.md`.

## Používateľské príbehy (MVP)

| ID | Príbeh | Zdroj |
|----|--------|-------|
| UR-01 | Ako používateľ si nastavím cieľ (ročné výdavky, miera výberu, výnos, mesačné sporenie, rezerva) s odporúčanými predvolenými hodnotami. | D-008, D-011 |
| UR-02 | Ako používateľ vidím, ktorá hodnota je odporúčanie a ktorá moja vlastná, a môžem ju zmeniť. | D-011 |
| UR-03 | Ako používateľ zadám existujúcu investíciu: aktuálnu hodnotu a predpokladaný ročný výnos. | D-010 |
| UR-04 | Ako používateľ zadám transakciu (sporenie, investícia, výdavok) – rýchlo, na telefóne. | D-006, persona 1 |
| UR-10 | Ako používateľ zadám ročné výdavky v dôchodku ručne ako odhad. | D-013 |
| UR-05 | Ako používateľ nastavím prahovú sumu pre evidenciu výdavkov (predvolene 100 €). | [user], D-013 |
| UR-06 | Ako používateľ po každej transakcii vidím prepočítaný cieľ (cieľová suma a dátum ako rozsah opatrný/základný/optimistický). | D-004, D-011 |
| UR-07 | Ako používateľ vidím históriu všetkých transakcií (záznam rozhodnutí). | D-004 |
| UR-08 | Ako používateľ môžem dáta exportovať a importovať (záloha). | D-009 |
| UR-09 | Ako používateľ vidím predpoklady a obmedzenia výpočtu (pravidlo 4 %, bez daní a poplatkov). | D-008 |

## Nefunkčné požiadavky (MVP) [predpoklad]
- **Mobile-first:** plne použiteľné na telefóne.
- **Lokálne ukladanie:** dáta ostávajú v zariadení (D-009); žiadne odosielanie na server.
- **Nízka kognitívna záťaž:** málo polí, jasný jazyk, žiadne zbytočné upozornenia; prepočet cieľa podáva informáciu, nie tlak.
- **Transparentnosť:** každý výpočet ukazuje vstupy a predpoklady.
- **Slovenčina** v rozhraní; texty pripravené na neskoršie preklady (EÚ).

## Vyriešené rozhodnutia (D-013)
- **Ročné výdavky v dôchodku** zadáva používateľ ručne (odhad celkových výdavkov); z transakcií sa neodvodzujú, pretože sa evidujú len výdavky nad prahom.
- **Mesačné sporenie a investovanie** sa odvodzuje z transakcií typu sporenie/investícia (evidujú sa vždy).
- **Prah** platí len pre výdavky. Predvolená hodnota je **100 €**, používateľ ju môže zmeniť.
- **Vplyv cielenej spotreby na cieľ:** evidovaný výdavok **znižuje kapitál** (investovateľný kapitál sa zníži o sumu výdavku), čo posunie odhadovaný dátum cieľa. Cieľová suma (ročné výdavky × 25) sa výdavkom nemení.

## Predpoklady a riziká k vyriešeným rozhodnutiam [predpoklad]
- Model „výdavok znižuje kapitál“ predpokladá, že sa výdavok hradí z naakumulovaného kapitálu. Ak ho používateľ v skutočnosti platí z bežného príjmu, aplikácia bude dátum cieľa nadhodnocovať (cieľ vyzerá ďalej, než je). Treba to používateľovi jasne povedať a zvážiť pri zadávaní výdavku voľbu „hradené z kapitálu / z príjmu“ (otvorená otázka 1).
- Aby nedochádzalo k dvojitému započítaniu, mesačné sporenie sa počíta len z transakcií sporenie/investícia.

## Návrh: zdroj úhrady a mesačné vyhodnotenie kapitálu (na potvrdenie)
Zadanie [user]: pri výdavku riešiť zdroj úhrady (z kapitálu / z príjmu); **bežný kapitál vyhodnocovať mesačne, nie denne.**

Interpretácia [predpoklad, treba potvrdiť]:
1. Pri zadaní výdavku používateľ zvolí **zdroj úhrady**: „z príjmu“ (predvolené, kapitál sa nemení) alebo „z kapitálu“ (znižuje kapitál).
2. Kapitál sa **oficiálne prepočítava raz mesačne** pri „mesačnom vyhodnotení“: používateľ zadá aktuálnu hodnotu investícií a nasporenú sumu. Tým sa kapitál zosúladí so skutočnosťou (opraví aj chyby a rozdiely z trhu) a odhadovaný dátum cieľa sa potom bere z tohto stavu.
3. Medzi mesačnými vyhodnoteniami aplikácia po každej transakcii ukáže len **predbežný dopad** (napr. „predbežne +2 mesiace“), ktorý sa pri vyhodnotení nahradí skutočným stavom.

Dôsledok pre D-004 (cieľ sa prepočíta po každom rozhodnutí): oficiálny prepočet je mesačný, po transakcii je viditeľný len predbežný dopad. Ak to chceš inak, musí sa D-004 upraviť.

Výhody [predpoklad]: menej výkyvov, ktoré by mohli demotivovať (nízka záťaž, ako sme chceli); menej údajov na zadávanie; skutočný stav sa pravidelne opravuje.
Riziko [predpoklad]: ak používateľ mesačné vyhodnotenie vynechá, kapitál a dátum cieľa zastarajú; aplikácia má pripomenúť, nie nútiť, a jasne ukázať dátum posledného vyhodnotenia.

## Otvorené otázky
1. Potvrdiť interpretáciu mesačného vyhodnotenia vyššie (najmä: kapitál = aktuálna hodnota investícií + sporenie, zadáva používateľ).
2. Kedy v mesiaci sa vyhodnotenie robí (koniec mesiaca, pevný deň, kedykoľvek raz za mesiac)?
3. Ako sa zobrazí predbežný dopad transakcie (text bez farieb a upozornení)?
