# 24 – Tok obrazoviek a prepojenia

> Stav: 2026-10-22, vetva `claude/phase2-property-card`. Mapa zachytáva, ako sa dnes medzi obrazovkami prechádza, a čo sa doplnilo (D-204).

## 1. Ako sa dnes prechádza
- **Horný panel** (`src/ui/Navigacia.tsx`): všetky viditeľné sekcie naraz (14 pri Fáze 2). Je to jediné globálne miesto, odkiaľ sa dá ísť kamkoľvek (D-170).
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

## 4. Otvorené
- Rozsah horného panela (zmenšiť na skupiny, nahradiť domovom na Prehľade, alebo ponechať) je rozhodnutie zakladateľa; mení D-170.
