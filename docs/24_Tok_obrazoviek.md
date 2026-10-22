# 24 – Tok obrazoviek a prepojenia

> Stav: 2026-10-22, vetva `claude/phase2-property-card`. Mapa zachytáva, ako sa medzi obrazovkami prechádza. Odkazy v texte sú z D-204, skupiny v hornom paneli z D-205.

## 1. Ako sa dnes prechádza
- **Horný panel** (`src/ui/Navigacia.tsx`, skupiny v `src/app/navigation.ts`): päť skupín v prvom riadku; sekcie aktívnej skupiny sú v druhom riadku (D-205). Zoznam skupín je v kapitole 4.
- **Odkazy v texte** (`href="#id"`): pred D-204 len 6, po ňom 13. Zoznam v kapitole 2.
- **Tlačidlá**: „Pridať transakciu“ (Prehľad), „Spustiť sprievodcu znova“ (Nastavenia).
- **Prvé spustenie**: sprievodca (8 krokov), potom Prehľad. Sprievodca nemá odkazy na sekcie; počas kroku sa z neho neodchádza.

## 2. Mapa odkazov po D-204
| Odkiaľ | Kam | Ako | Stav |
|---|---|---|---|
| Prehľad | Vyhodnotenie | text „Urob prvé vyhodnotenie“ | existuje |
| Prehľad | Rozpočet | text „Limity nastavíš v Rozpočte“ | existuje |
| Prehľad | Pravidelné výdavky | „Pozrieť“ | existuje |
| Prehľad | Transakcie | tlačidlo „Pridať transakciu“ | existuje |
| Prehľad | Nastavenia | „Cieľová suma“ a upozornenie na nastavenia | existuje |
| Prehľad | Investície | „v sekcii Investície“ | D-204 |
| Prehľad (Návod) | Záloha | dva odkazy v Návode | D-204 |
| Transakcie | Vyhodnotenie | „Najprv urob vyhodnotenie“ | existuje |
| Vyhodnotenie | Investície | „súčet položiek v sekcii Investície“ | D-204 |
| Vyhodnotenie | Záloha | „stiahni zálohu“ pri mazaní | D-204 |
| Investície | Vyhodnotenie | „Vo Vyhodnotení sa suma zadáva ručne“ | D-204 |
| Záväzky | Majetok | „Hypotéku evidujte v sekcii Majetok“ | D-204 |
| Príjmy | Majetok | „Nájom z nehnuteľnosti eviduj v Majetku“ | D-204 |
| Nastavenia | Sprievodca | tlačidlo „Spustiť sprievodcu znova“ | existuje |
| Sprievodca | Prehľad, Záloha, Nastavenia | iba text | zámer, bez odkazov |

## 3. Chýbajúce alebo slabé prepojenia (kandidáti, zatiaľ nezavedené)
- **Majetok → Záväzky:** hypotéka je v Majetku, úvery a kreditné karty v Záväzkoch. Majetok na to zatiaľ neodkazuje.
- **Dane → Majetok:** text „údaje o nehnuteľnostiach“ bez odkazu.
- **Pravidelné výdavky → Rozpočet:** pravidelné výdavky sa počítajú do mesačného plánu.
- **Transakcie → Rozpočet:** po zápise výdavku nie je vidieť, koľko je z limitu kategórie.
- **Návrat na Prehľad:** Majetok, Investície, Dane, Sklad, Záloha a Ročný prehľad nemajú odkaz späť; návrat je len cez horný panel.

## 4. Horný panel: skupiny (D-205)
| Skupina | Sekcie |
|---|---|
| Prehľad | Prehľad |
| Peniaze | Transakcie, Príjmy, Rozpočet, Pravidelné výdavky |
| Majetok a zásoby | Majetok, Sklad, Záväzky, Investície, Dane |
| Plán a výsledky | Vyhodnotenie, Ročný prehľad |
| Nastavenia a záloha | Nastavenia, Záloha |

Klepnutie na skupinu otvorí jej prvú viditeľnú sekciu. Sekcia z inej skupiny sa dosiahne dvoma klepnutiami. Skupina s jednou sekciou sa otvorí jedným klepnutím.

## 5. Otvorené
- Kandidáti z kapitoly 3, ktoré ešte nie sú zavedené: Pravidelné výdavky → Rozpočet, návrat z detailov na Prehľad, Sklad a Ročný prehľad.

## 6. Podmienené odkazy na ďalší krok (D-206)
Skryté tlačidlá (`NextStep`, `src/ui/kit/NextStep.tsx`) sa zobrazia len vtedy, keď dáta ukazujú, že ich používateľ potrebuje.

| Obrazovka | Podmienka | Odkaz |
|---|---|---|
| Majetok | aspoň jedna nehnuteľnosť | Dane a tlačivo |
| Majetok | aspoň jedna nehnuteľnosť s hypotékou | Záväzky (úver, kreditná karta) |
| Dane | žiadna nehnuteľnosť | Majetok (tlačivo potrebuje nehnuteľnosť) |
| Dane | žiadna položka investícií | Investície (daňový režim sa zadáva pri položkách) |
| Investície | aspoň jedna položka | Vyhodnotenie (súčet ide do vyhodnotenia) |
| Transakcie | výdavok s kategóriou, ktorá má limit | Rozpočet |
| Vyhodnotenie | existuje uložené vyhodnotenie | Prehľad (dátum cieľa) |
| Nastavenia | po uložení nastavení | Prehľad |

Pravidlo: odkaz sa nezobrazuje, ak cieľ je už vyplnený. Napríklad Dane neponúknu Majetok, keď nehnuteľnosť existuje.
Overené v `tests/e2e/flow-links.spec.ts`.
