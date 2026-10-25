# 41 – Návod pre testerov (náhľad Fázy 2)

> Stav: pripravené 2026-10-24 pre testerov súkromného náhľadu (D-270 až D-273, D-279). Heslo dostanete osobne; v tomto návode nie je. Text je určený na poslanie testerom. Stránka na zdieľanie: https://claude.ai/artifact/2WhrQGtkHfUeNPUYLaX9pQ (súkromná, kým ju zakladateľ nezdieľa).

## Čo testujete

Finančná sloboda je aplikácia na osobné financie. Ukazuje, kedy by ste pri súčasnom sporení dosiahli finančnú nezávislosť, a pomáha sledovať výdavky. Testujete **súkromný náhľad** s funkciami, ktoré zatiaľ nie sú vo verejnej verzii.

Je to skúšobná verzia. Výpočty sú odhady pred daňou a poplatkami a nie sú finančným poradenstvom.

## 1. Prístup

1. Otvorte **https://financna-sloboda-preview.pages.dev** (na iPhone v Safari, na Androide v Chrome).
2. Zadajte heslo, ktoré ste dostali. Prihlásenie platí 30 dní.
3. Pridajte si appku na plochu:
   - **iPhone:** Zdieľať → **Pridať na plochu**.
   - **Android:** ponuka ⋮ → **Pridať na plochu** alebo **Inštalovať aplikáciu**.
4. Ak ste ikonu pridali pred prihlásením, otvorte ju z plochy a prihláste sa v nej ešte raz.

## 2. Vaše údaje

- Údaje sa ukladajú **len vo vašom zariadení**, v prehliadači. Aplikácia ich nikam neposiela.
- Pri testovaní **nezadávajte skutočné údaje** (zostatky, účty, transakcie). Použite testovaciu zálohu z ďalšieho kroku.
- Ak vymažete údaje prehliadača, aplikácia bude prázdna.

## 3. Príprava: testovacia záloha

1. **Prehľad** → rozbaľte **Návod** → **stiahnuť testovaciu zálohu**.
2. **Nastavenia a záloha** → **Záloha** → **Vybrať súbor zálohy** → vyberte stiahnutý súbor → **Nahradiť dáta zálohou**.
3. **Nastavenia** → vyplňte **Ročné výdavky pri nezávislosti**, napríklad 24 000 → **Uložiť nastavenia**. Testovacia záloha ich neobsahuje a bez nich sa nedá vyčísliť dátum cieľa.

## 4. Čo vyskúšať

Každá úloha trvá 2 až 5 minút. Nemusíte robiť všetky; aj jedna poctivo vyskúšaná pomôže.

| # | Úloha | Kde | Na čo sa zamerať |
| --- | --- | --- | --- |
| 1 | Zorientovať sa | Prehľad | Viete bez návodu, čo je hlavná akcia? Je jasné, čo znamená dátum cieľa? |
| 2 | Pridať výdavok | Peniaze → Transakcie | Pred uložením sa ukáže predbežný dopad na cieľ. Pri predvolenom zdroji „z príjmu“ sa kapitál nemení („bez zmeny“); vyskúšajte aj „z hotovosti“. Uložený výdavok je v histórii, upraviť alebo zmazať ho viete cez Upraviť. História ukazuje 10 posledných záznamov (ďalšie cez Zobraziť staršie), filter je pod „Filter ▾“. |
| 3 | Veľký výdavok | Peniaze → Veľký výdavok (scenár) | Zadajte napríklad 5 000 € a skúste rôzne zdroje. Je výsledok zrozumiteľný? Do transakcií sa nič nesmie zapísať. |
| 4 | Mesačný výdavok | Peniaze → Mesačný výdavok (scenár) | Zadajte napríklad 50 €. Rozumiete, koľko mesiacov vás to stojí? Pod scenárom je zoznam opakovaných výdavkov z testovacej zálohy. Je jasné, čo „o N mesiacov skôr“ znamená? Nepôsobí ako výčitka? |
| 5 | Ročný prehľad | Plán a výsledky → Ročný prehľad | Súhrn po rokoch a výdavky podľa kategórií. Dávajú zmysel? Vyhodnotenia sú zbalené. |
| 5a | Rozpočet a pravidelné výdavky | Peniaze → Rozpočet, Pravidelné výdavky | V Rozpočte ťuknite na Upraviť limity, nastavte limit a uložte. V Pravidelných výdavkoch je pri položke len Upraviť; Ukončiť a Zmazať sú v úprave. Je to jasné? |
| 6 | Záloha s heslom | Nastavenia a záloha → Záloha | Exportujte zálohu s heslom (aspoň 8 znakov) a obnovte ju. Zlé heslo musí byť odmietnuté. |
| 7 | Týždenný súhrn mailom | Prehľad → Týždenný súhrn → Poslať mailom | Otvorí sa mailová aplikácia s textom súhrnu. Odoslať ho nemusíte. |
| 8 | Menu na telefóne | Horné menu | Prepínajte skupiny a sekcie. Riadok sekcií sa dá posúvať do strany. |
| 9 | Tmavý režim | Nastavenie telefónu | Je všetko čitateľné? |

## 5. Ako nahlásiť pripomienku

1. Dole na stránke ťuknite na **Nahlásiť pripomienku** → **Otvoriť formulár**. Odpovede vo formulári nie sú verejné.
2. Napíšte:
   - zariadenie a prehliadač (napríklad iPhone 15, Safari),
   - sekciu, v ktorej ste boli,
   - čo ste urobili, krok po kroku,
   - čo ste čakali a čo sa stalo.
3. Snímka obrazovky pomáha. Pred odoslaním skontrolujte, že na nej nie sú osobné údaje. Ak formulár snímku neprijme, opíšte ju slovami.
4. **Nikdy neposielajte** heslo, čísla účtov ani skutočné finančné údaje.

## 6. Známe obmedzenia

- Skúšobná verzia: výpočty sú odhady pred daňou a poplatkami, nie finančné poradenstvo.
- Funkcie Fázy 2 zatiaľ nie sú právne posúdené ani bezpečnostne auditované.
- Heslo zašifrovanej zálohy sa nedá obnoviť.
- Údaje v náhľade sú oddelené od verejnej verzie aplikácie.
