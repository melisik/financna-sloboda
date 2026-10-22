# 25 – Životná udalosť: kúpa nehnuteľnosti

> Stav: 2026-10-22, vetva `claude/phase2-property-card`. Rozhodnutia D-206, D-208, D-209.

## 1. Tok
1. **Majetok → Pridať nehnuteľnosť.** Otvor „Predvyplniť z listu vlastníctva“ a buď vlož text z LV, alebo nahraj uloženú stránku listu (HTML, D-211). HTML je spoľahlivejší než PDF, lebo popisy a hodnoty sú v oddelených bunkách. Appka doplní obec, katastrálne územie, číslo parcely, súpisné číslo, číslo bytu a druh objektu. Text sa po použití vymaže a neukladá sa.
2. Skontroluj údaje a ulož nehnuteľnosť.
3. **Odkaz Dane a tlačivo** (D-206) sa objaví, keď existuje nehnuteľnosť. Tlačivo 17-dp-md sa vyplní jedným klepnutím (D-208).
4. Ak LV uvádza záložné právo, appka len upozorní. Hypotéku, jej zostatok a splátku zadáš ručne v karte nehnuteľnosti.

Postup pre používateľa je v `docs/26_Navod_stiahnutie_LV.md`.

## 2. Čo appka z LV berie a čo nie

Podlahová plocha: pri podiele v tvare 4574/696619 je 4574 dm² = 45,74 m² (D-212). Zaokrúhlené podiely sa nepoužijú.
- **Berie:** obec, katastrálne územie, číslo parcely (všetky), súpisné číslo, číslo bytu, druh objektu (dom alebo byt), podlahovú plochu z nezaokrúhleného podielu (D-212) a fakt, že je záložné právo.
- **Nebere a neukladá:** mená, adresy a dátumy vlastníkov, číslo LV, text listu. Dôvod: D-026 (citlivé údaje, bez šifrovania v MVP).

## 3. Obmedzenia
- Appka nevolá sieť (D-009, FR-16). Všetko beží v prehliadači.
- Parser je postavený na typických nadpisoch (Obec, Katastrálne územie, Parc. č., Súpisné číslo, Byt č.). Nebol overený na reálnom LV, lebo repozitár nesmie obsahovať skutočné údaje. Testy používajú syntetický text.
- Skenovaný LV bez textovej vrstvy sa nepredvyplní. Treba vložiť text alebo HTML ručne.
- Záložné právo v prospech ostatných vlastníkov bytov nie je hypotéka. Appka to zobrazí zvlášť.
- Nahrávanie PDF je odložené, lebo by vyžadovalo novú knižnicu na čítanie PDF.

## 4. Otvorené
- **Záložné právo:** zatiaľ len upozornenie. Hypotéku appka sama nevytvára, lebo zostatok a splátku z LV nevie. Potvrdenie zakladateľa čaká (otázka zostala bez odpovede).
