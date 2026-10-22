# 26 – Návod: ako získať list vlastníctva a nahrať ho do appky

> Stav: 2026-10-22, vetva `claude/phase2-property-card`. Návod je pripravený, ale ešte nebol prejdený celý od začiatku na skutočnom portáli. Názvy volieb sa môžu líšiť podľa prehliadača. Overiť treba postupom z kapitoly 5.
> Súvisí s D-209 (vloženie textu), D-211 (HTML), D-212 (podlahová plocha) a `docs/25`.

## 1. Prečo HTML a nie PDF
PDF rozloží text podľa polohy na strane, takže hodnota sa môže dostať do iného riadku než jej popis. Uložená webová stránka má popisy a hodnoty v oddelených bunkách tabuľky. Appka ich čítavať vie presne. Ak nemáš HTML, funguje aj skopírovanie textu zo stránky.

## 2. Čo potrebuješ
- Číslo listu vlastníctva (LV) a katastrálne územie. Nájdeš ich na výpise, na zmluve alebo v katastri.
- Prehliadač (Edge alebo Chrome) a internet na otvorenie katastrálneho portálu.

## 3. Postup
1. Otvor katastrálny portál a vyhľadaj list vlastníctva podľa čísla LV a katastrálneho územia. Portál môže vyžadovať prihlásenie alebo poplatok; over si podmienky priamo na portáli.
2. Otvor výpis z listu vlastníctva, aby sa zobrazil celý (nie len jeho časť). Výpis sa načítava na stránke.
3. Ulož stránku: stlač **Ctrl+S** (Mac: Cmd+S).
   - V Edge zvoľ **Webová stránka, úplne** (v angličtine „Webpage, complete“).
   - V Chrome zvoľ **Webová stránka, kompletná** („Webpage, Complete“).
   - Vznikne súbor `.html` a priečinok `_files`. Stačí súbor `.html`. Priečinok môžeš zmazať.
4. V appke otvor **Majetok → Pridať nehnuteľnosť**. Klikni na **Predvyplniť z listu vlastníctva**.
5. Klikni na **Nahrať uloženú stránku listu (HTML)** a vyber uložený súbor. Alebo otvor súbor v prehliadači, označ všetko (Ctrl+A), skopíruj (Ctrl+C) a vlož do poľa **Text z listu vlastníctva**.
6. Skontroluj polia: obec, katastrálne územie, číslo parcely, súpisné číslo, číslo bytu, druh objektu a podlahová plocha. Doplň, čo chýba. Ulož nehnuteľnosť.
7. Súbor `.html` zmaž z priečinka Stiahnuté. Obsahuje mená a adresy vlastníkov a appka ich nepotrebuje.

## 4. Čo appka z listu berie a čo nie
- **Berie:** obec, katastrálne územie, všetky parcely, súpisné číslo, číslo bytu, druh objektu, podlahovú plochu z nezaokrúhleného podielu (D-212) a upozornenie na záložné právo.
- **Nebere a neukladá:** mená a adresy vlastníkov, dátumy narodenia, číslo LV a samotný text listu.
- Súbor sa nikam neodosiela. Appka nevolá sieť (D-009).

## 5. Ak niečo nesedí
- **Chýbajú polia:** skontroluj, že si uložil celú stránku, nie len jej časť. Skús Ctrl+A a Ctrl+C z celej stránky a vlož text.
- **Stránka je prázdna alebo sa načíta až po chvíli:** počkaj, kým sa výpis úplne zobrazí, a až potom ulož.
- **Skenovaný LV bez textu:** appka text nepreberie. Údaje zadaj ručne.
- **Podlahová plocha chýba:** appka ju doplní len vtedy, keď je v podiele nezaokrúhlený zlomok s veľkým menovateľom (D-212). Inak zadaj ručne.
- **Viac parciel:** appka uvedie všetky, oddelené čiarkou. Tlačivo 17-dp-md má na parcely obmedzené miesto, preto môže byť potrebné doplniť ich v PDF ručne.

## 6. Overenie pred vydaním návodu
- [ ] Prejsť celý postup na skutočnom portáli (kroky 1–3) a potvrdiť názvy volieb v Edge a Chrome.
- [ ] Zistiť, či je výpis na portáli dostupný bez registrácie alebo poplatku.
- [ ] Overiť, že HTML z portálu má rovnakú štruktúru ako vzor v `tests/fixtures/lv-synthetic.html`.
