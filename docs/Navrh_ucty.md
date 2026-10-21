# Návrh: účty a rodinné zdieľanie (N-07)

Stav: **návrh na rozhodnutie, nie rozhodnutie.** Žiadny kód sa zatiaľ nemení. Dokument pripravuje cestu k rozhodnutiam, ktoré mení D-009, D-020 a D-119.

## 1. Čo sa žiada
- Prihlásenie účtom, aby sa dáta dali otvoriť na viacerých zariadeniach.
- Rodinné zdieľanie: rodič alebo blízky vidí údaje dieťaťa alebo partnera so súhlasom.
- Sekcia podľa prihláseného používateľa, vrátane dieťaťa podľa kognitívnych schopností (N-07, N-08).

## 2. Konflikty s existujúcimi rozhodnutiami
| Rozhodnutie | Čo hovorí | Dôsledok |
|---|---|---|
| D-009 | MVP je lokálne, bez servera; účty sú až neskôr | Účty menia základný model ukladania. |
| D-020 | Statická PWA bez servera, IndexedDB | Účty si vyžadujú server aspoň na prihlásenie a synchronizáciu. |
| D-119 | Prihlásenie je lokálny PIN, bez servera a účtov | Lokálny PIN sa musí nahradiť alebo doplniť účtom. |
| D-026 | Šifrovanie sa rieši pred Fázou 2 (účty a synchronizácia) | Účty bez šifrovania nie sú možné. |
| D-090 | Ochrana dát pre nehnuteľnosti, záväzky a dane sa overí s právnikom | Synchronizované finančné dáta spúšťajú GDPR povinnosti. |

## 3. Možnosti
**A. Ostať lokálne (stav dnes).** Žiadny server, žiadne účty. Rodinné zdieľanie cez export a import zálohy. Najmenšie riziko, najmenšia pohodlnosť.

**B. Účet a synchronizácia s end-to-end šifrovaním.** Server ukladá len zašifrované dáta; kľúč odvodený z hesla alebo PIN-u drží zariadenie. Server nevidí čísla. Vyžaduje hosting, zálohovanie servera a obnovu hesla, ktorá nesmie vyzradiť dáta.

**C. Účet bez synchronizácie, len zdieľanie.** Jeden vlastník exportuje šifrovaný balík pre člena rodiny, ktorý ho otvorí vo svojom účte. Jednoduchšie než B, ale bez priebežnej aktualizácie.

## 4. Model rodiny a dieťaťa (predbežne)
- Účet dieťaťa spravuje dospelý (zákonný zástupca alebo dohodnutá osoba). Dieťa vidí len to, čo mu zástupca povolí.
- Zdieľanie je viditeľné a dá sa kedykoľvek zrušiť.
- Rozsah zobrazenia (napr. len rozpočet, nie majetok) sa nastavuje pri zdieľaní.

## 5. Čo treba rozhodnúť (zakladateľ)
1. Ktorá možnosť A, B alebo C pre nasledujúcu verziu?
2. Kto je hostiteľ servera a kde sú údaje (SR, EÚ)?
3. Heslo na účet alebo PIN na zariadení, a ako sa obnovuje?
4. Model dieťaťa: zástupca spravuje účet, alebo dieťa má vlastný účet s dohľadom?
5. Zmeniť D-009, D-020 a D-119, alebo účty zaviesť ako samostatnú verziu (D-114, D-115)?

## 6. Navrhovaný postup
1. Rozhodnúť bod 1 a 5 (možnosti a zmena rozhodnutí).
2. Právne posúdenie ochrany dát (D-090) pred prvým účtom.
3. Návrh šifrovania a obnovy hesla (D-026) ako samostatný dokument.
4. Až potom prototyp prihlasovania.
