# 26 – Návod: ako získať list vlastníctva a nahrať ho do appky

> Stav: 2026-10-22, vetva `claude/phase2-property-card`. Overené zakladateľom na skutočnom portáli: výpis je bez registrácie a zadarmo; Ctrl+S funguje; vlastník vyberá byt. Neoverené zostáva: presné texty v dialógu ukladania (Edge aj Chrome), výber bytu na reálnom LV s viacerými bytmi a pravidlo menovateľa na inom LV. Postup overenia je v kapitole 6.
> Súvisí s D-209 (vloženie textu), D-211 (HTML), D-212 (podlahová plocha) a `docs/25`.

## 1. Prečo HTML a nie PDF
PDF rozloží text podľa polohy na strane, takže hodnota sa môže dostať do iného riadku než jej popis. Uložená webová stránka má popisy a hodnoty v oddelených bunkách tabuľky. Appka ich čítavať vie presne. Ak nemáš HTML, funguje aj skopírovanie textu zo stránky.

## 2. Čo potrebuješ
- Číslo listu vlastníctva (LV) a katastrálne územie. Nájdeš ich na výpise, na zmluve alebo v katastri.
- Prehliadač (Edge alebo Chrome) a internet na otvorenie katastrálneho portálu.

## 3. Postup
1. Otvor katastrálny portál a vyhľadaj list vlastníctva podľa čísla LV a katastrálneho územia. Výpis je dostupný bez registrácie a zadarmo (overené zakladateľom 2026-10-22).
2. Otvor výpis z listu vlastníctva, aby sa zobrazil celý (nie len jeho časť). Výpis sa načítava na stránke.
3. Ulož stránku: stlač **Ctrl+S** (Mac: Cmd+S). Funguje v Edge aj v Chrome (overené zakladateľom 2026-10-22). V Chrome je ten istý príkaz v menu **Cast, save, and share → Save page as…** (overené zakladateľom na screenshote).
   - V dialógu zvoľ úplnú stránku: v angličtine **Webpage, Complete** (Chrome) a **Webpage, complete** (Edge). Slovenské názvy **Webová stránka, kompletná** (Chrome) a **Webová stránka, úplne** (Edge) sú zatiaľ predpoklad, neoverené. Presný text v rozbaľovacom zozname zakladateľ zatiaľ neuviedol.
   - Vznikne súbor `.html` a priečinok `_files`. Stačí súbor `.html`. Priečinok môžeš zmazať.
4. V appke otvor **Majetok → Pridať nehnuteľnosť**. Klikni na **Predvyplniť z listu vlastníctva**.
5. Klikni na **Nahrať uloženú stránku listu (HTML)** a vyber uložený súbor. Alebo otvor súbor v prehliadači, označ všetko (Ctrl+A), skopíruj (Ctrl+C) a vlož do poľa **Text z listu vlastníctva**.
6. Skontroluj polia: obec, katastrálne územie, číslo parcely, súpisné číslo, číslo bytu, druh objektu a podlahová plocha. Doplň, čo chýba. Ulož nehnuteľnosť.
7. Súbor `.html` zmaž z priečinka Stiahnuté. Obsahuje mená a adresy vlastníkov a appka ich nepotrebuje.

## 3a. Čiastočný výpis a viac bytov
- **Čiastočný výpis** (vygenerovaný len pre teba alebo tvoj byt) je pre appku lepší: obsahuje menej údajov iných osôb a jednoznačne ukazuje tvoj byt. Ak portál túto možnosť ponúka, zvoľ ju. Overiť treba na portáli (kapitola 6).
- Ak je v liste **viac bytov**, appka nevyberie prvý potichu. Zobrazí zoznam bytov (číslo, poschodie, súpisné číslo). Vyber svoj. Údaje a podlahová plocha sa berú z tvojho bytu.
- Pri jednom byte sa výber nezobrazí a údaje sa doplnia hneď.

## 4. Čo appka z listu berie a čo nie
- **Berie:** obec, katastrálne územie, všetky parcely, súpisné číslo, číslo bytu, druh objektu, podlahovú plochu z nezaokrúhleného podielu (D-212) a upozornenie na záložné právo.
- **Nebere a neukladá:** mená a adresy vlastníkov, dátumy narodenia, číslo LV a samotný text listu.
- Súbor sa nikam neodosiela. Appka nevolá sieť (D-009).

## 5. Ak niečo nesedí
- **Chýbajú polia:** skontroluj, že si uložil celú stránku, nie len jej časť. Skús Ctrl+A a Ctrl+C z celej stránky a vlož text.
- **Stránka je prázdna alebo sa načíta až po chvíli:** počkaj, kým sa výpis úplne zobrazí, a až potom ulož.
- **Skenovaný LV bez textu:** appka text nepreberie. Údaje zadaj ručne.
- **Podlahová plocha chýba:** appka ju doplní len vtedy, keď menovateľ podielu nie je zaokrúhlený (nie je násobkom 100) a je aspoň 10 000 (D-212, D-219). Pri zaokrúhlenom menovateli plochu z listu nevyčítame; zadaj ju ručne.
- **Viac parciel:** appka uvedie všetky, oddelené čiarkou. Tlačivo 17-dp-md má na parcely obmedzené miesto, preto môže byť potrebné doplniť ich v PDF ručne.

## 6. Overenie pred vydaním návodu
- [ ] Prejsť celý postup na skutočnom portáli (kroky 1–3) a potvrdiť texty v dialógu ukladania (Edge aj Chrome). Ctrl+S funguje v oboch (overené zakladateľom 2026-10-22); položka Save page as… v Chrome potvrdená screenshotom.
- [x] Zistiť, či je výpis na portáli dostupný bez registrácie: áno (overené zakladateľom 2026-10-22).
- [x] Zistiť, či výpis na portáli stojí poplatok: nestojí (overené zakladateľom 2026-10-22).
- [ ] Overiť, že HTML z portálu má rovnakú štruktúru ako vzor v `tests/fixtures/lv-synthetic.html`.
- [ ] Overiť, či portál ponúka čiastočný výpis len pre vlastníka alebo byt, a ako sa volá.
- [ ] Overiť výber bytu na výpise s viacerými bytmi (`tests/fixtures/lv-synthetic-viac-bytov.html` je len syntetický vzor). UX potvrdené zakladateľom: vlastník vyberie, ktorý byt sa načíta; parsovanie na reálnom výpise ostáva neoverené.
- [ ] Overiť pravidlo menovateľa (D-219) na inom reálnom LV: pri zaokrúhlenom menovateli (násobok 100) plocha chýba; pri nezaokrúhlenom sa zobrazí v m² (čitateľ / 100).
