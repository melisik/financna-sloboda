# Návrh: číslo dokladu sa nezobrazuje

Stav: návrh na schválenie. Kód sa zatiaľ nemení.

## Rozhodnutie zakladateľa (2026-10-21)
Číslo dokladu sa nikde nezobrazuje (ani v poli, ani v zozname, ani v správach). Overenie dokladu na portáli finančnej správy zostáva. Neskôr ho zabezpečí integrácia (D-112, Fáza 3).

## Dopad na súčasný stav
- Vo formulári výdavku je pole **Číslo dokladu** s číslom viditeľným na obrazovke. Pole sa odstráni a číslo sa zobrazí len v schránke.
- Overenie na portáli zostáva. Číslo sa však nezobrazí: tlačidlo číslo len skopíruje do schránky a otvorí portál.
- V histórii sa už číslo nezobrazuje, len značka „doklad“. Ostáva.
- Položky dokladu (názvy, sumy) sa zobrazujú ako doteraz. Ich zobrazenie sa týmto nemení.

## Návrh zmeny
1. **Skener zostáva.** Po načítaní QR kódu sa uloží číslo dokladu a zobrazí sa len správa „Doklad je priradený.“ Číslo sa nevypisuje.
2. **Pole na ručné zadanie sa odstráni.** Bez čísla na obrazovke by ručné zadanie nebolo použiteľné. Ak QR kód nejde načítať, výdavok sa uloží bez dokladu.
3. **Úprava výdavku:** namiesto čísla sa zobrazí „Doklad je priradený.“ a tlačidlo **Odstrániť doklad** (aby sa dal doklad zrušiť bez zobrazenia čísla).
4. **Overenie na portáli bez zobrazenia čísla:** tlačidlo **Overiť doklad** skopíruje číslo do schránky (bez zobrazenia), otvorí portál v prehliadači a zobrazí správu „Číslo je v schránke, vložte ho na portál.“ Používateľ ho na portáli vloží. Neskôr to urobí integrácia.
5. **Zálohy:** číslo dokladu je súčasťou JSON zálohy. Treba rozhodnúť, či sa pri exporte vynechá, alebo či je to prijateľné (záloha je len v zariadení používateľa).
6. **Dokumentácia:** D-126 a FR-16 sa upravia; zmena sa zapíše do D-133.

## Testy, ktoré treba upraviť
- `tests/e2e/receipt-qr.spec.ts`, `tests/e2e/receipt-camera.spec.ts`: overujú číslo v poli. Zmeniť na „Doklad je priradený“ a overiť, že číslo nie je v DOM ani v texte stránky.
- Nový test: tlačidlo Overiť doklad skopíruje číslo do schránky a neukáže ho.
- `tests/e2e/receipt-items.spec.ts`: bez zmeny (kontroluje položky a značku).
- `tests/receipt.test.ts`: bez zmeny (validácia čísla).

## Otvorené otázky
- Má sa pri zálohe číslo dokladu vynechať? (odporúčam: áno, pri exporte vynechať a pri importe nič nemazať)
- Má ostať možnosť ručného zadania čísla bez zobrazenia (napr. pole typu heslo)? (odporúčam: nie, skener stačí)
