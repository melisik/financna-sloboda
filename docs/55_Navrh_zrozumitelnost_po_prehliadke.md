# 55 – Návrh: zrozumiteľnosť po prehliadke zakladateľa

> Stav: **otázky 1 a 2 schválené a implementované** (2026-10-25, D-308); otázky 3 a 4 čakajú. Z postrehov zakladateľa k scenáru `docs/pilot/scenar-prehliadka-2026-10-25.md`. D-153: bez zmeny výpočtu (všetko je UI).

## 1. Úpravy

| Postreh | Problém | Návrh |
| --- | --- | --- |
| 0.1 | „Návod“ na Prehľade nevyzerá ako tlačidlo. | Zbalené bloky (Návod, Podrobnosti, Vývoj a ďalšie) dostanú vzhľad tlačidla s ▾ ako ostatné zbalené bloky (D-293). |
| 6.3 | „Uložiť zálohu“ je nadpis, tlačidlo sa volá „Exportovať zálohu“. | Tlačidlo **Uložiť zálohu**, nadpis časti **Záloha do súboru**. Rovnako „Obnoviť zo zálohy“ ostáva. |
| 1.1 | Dátum cieľa má byť výraznejší. | Dátum cieľa väčším písmom ako hlavný údaj; pokrok a posun pod ním menším. |
| 4.5 | Po „Chýbajúce na zoznam“ nevidno, čo a kam pribudlo. | Potvrdenie pri recepte: „Na zoznam Nakúpiť pribudlo: mlieko 2,5 l.“ (alebo „Všetko už na zozname je.“). |
| 5.3 | Pri tlačive bez psa a nehnuteľnosti je tlačidlo vypnuté a pôsobí pokazene. | Namiesto vypnutého tlačidla veta s odkazmi Psy a Majetok; tlačidlo sa ukáže, až keď je čo vypĺňať. |
| 6.1 | Moduly, Sprievodca a PIN sú v Nastaveniach úplne dole. | Bez zmeny (D-293); na zváženie: odkaz „Moduly“ hore v Nastaveniach. Otázka 3. |

## 2. Ručné zadanie položiek dokladu (postreh 2.5)

Dnes sa položky dajú len vložiť ako text z portálu Finančnej správy (D-129). Na telefóne sa formát (tabulátory) napísať nedá, a bez položiek nefunguje ani Pridať do skladu (D-301).

**Návrh:** v bloku Doklad tlačidlo **Pridať položku ručne**: názov, množstvo, suma riadku. Položka sa uloží rovnako ako z portálu (kód „ručne“, DPH 0, jednotková cena = suma / množstvo). Nesúlad súčtu so sumou výdavku sa upozorní ako dnes (S-2, D-300).

**Riziko:** viac polí vo formulári transakcie (kognitívna záťaž, `docs/03`). Zmiernenie: len v zbalenom bloku Doklad, nič sa nemusí vypĺňať.

## 3. Otázky na rozhodnutie

1. Úpravy v oddiele 1 (0.1, 6.3, 1.1, 4.5, 5.3): **áno všetky (odporúčam)**, alebo vybrať?
2. Ručné zadanie položiek dokladu (oddiel 2): **áno (odporúčam)**, alebo nie?
3. Odkaz „Moduly“ hore v Nastaveniach: áno, alebo **nechať (odporúčam)**?
4. Zjednodušenie pridania nehnuteľnosti (postreh 5.4): pripraviť **samostatný návrh** po tom, ako si zapíšeš, čo bolo zložité?
