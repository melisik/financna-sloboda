# 58 – Návrh: zadávanie dokladu a položiek nákupu

> Stav: **návrh na schválenie** (2026-10-25). Kód sa nemení. Podnet: prehliadka zakladateľa 2026-10-25 (bod 3, D-317): „nikto nebude prepisovať text z eKasa“. D-153: bez zmeny výpočtu (mení sa len spôsob zadania položiek).

## 1. Problém

Pri nákupe po položkách (D-313) sú dnes tri cesty:
1. ručné položky (položka, množstvo, cena za kus, + a −);
2. QR kód dokladu (fotka alebo kamera): uloží len číslo dokladu na overenie, **položky nenačíta** (D-126, D-133);
3. text z portálu: používateľ otvorí portál eKasa, skopíruje text položiek a vloží ho (D-129).

Cesta 3 je na telefóne zdĺhavá (prepnúť do Safari, overiť doklad, označiť text, kopírovať, vrátiť sa) a nie je zrejmá: zakladateľ text písal ručne a appka ho odmietla. Cesta 2 vyzerá, akoby položky načítala, ale nenačíta ich. Výsledok: pri bežnom nákupe zostáva len ručné písanie každej položky.

## 2. Kontrola rozhodnutí

| Rozhodnutie | Vzťah |
| --- | --- |
| D-009, D-126, D-133 | Appka portál eKasa nevolá; externé volanie robí používateľ v prehliadači. Možnosť C by to menila. |
| D-129 | Vkladanie textu z portálu; možnosti A a D ho rušia alebo skrývajú. Uložené položky ostávajú platné. |
| D-232, D-284 | Precedens: knižnica na rozpoznávanie (čiarové kódy) beží v zariadení, načíta sa až pri použití a potom funguje offline. Možnosť B by to zopakovala. |
| D-301 | Položky výdavku idú do skladu; na spôsobe zadania nezáleží. |
| D-313, D-317 | Formulár nákupu po položkách sa nemení, mení sa len to, ako sa položky dostanú do zoznamu. |

## 3. Možnosti

### A. Len ručné položky a QR, text z portálu zrušiť
- Doklad ostane len na QR kód (overenie dokladu).
- Pole pre text z portálu zmizne.
- **Plus:** najjednoduchšie, jedna cesta. **Mínus:** dlhý nákup (15 položiek) sa píše ručne.

### B. Položky z fotky dokladu (rozpoznanie textu v zariadení)
- Tlačidlo „Odfotiť doklad“: appka rozpozná text (OCR) priamo v telefóne, rozdelí ho na položky a ukáže ich na kontrolu pred pridaním.
- Knižnica (napr. Tesseract.js so slovenčinou) má **niekoľko MB** (predpoklad, overiť); načíta sa až pri prvom použití, potom offline (ako D-284).
- **Riziká:** termopapier, zhyb a svetlo dávajú chyby v číslach. Rozpoznanie trvá na telefóne sekundy až desiatky sekúnd (predpoklad). Chybná suma položky = chybný výdavok, preto je kontrola pred pridaním povinná. Fotka dokladu ostáva v zariadení, neukladá sa (súkromie).
- **Odhad:** 3 až 5 dní vrátane testov s fotkami syntetických dokladov; presnosť treba overiť na skutočných dokladoch zakladateľa (len v zariadení, nič do repozitára).

### C. Položky z portálu eKasa podľa QR kódu
- Appka by po načítaní QR sama zavolala portál a stiahla položky.
- **Mení D-009 a D-126** (appka nič neposiela). Portál pravdepodobne nepovolí volanie z inej stránky (CORS, predpoklad), takže by bol potrebný vlastný server, cez ktorý by išli čísla dokladov a nákupy používateľov. Právne a bezpečnostné posúdenie (G1, G4).
- **Neodporúčam** v tejto fáze.

### D. Rýchlejšie ručné písanie (doplnok k A alebo B)
- Pri písaní názvu appka ponúkne položky z predchádzajúcich nákupov (napr. „chl“ → „chlieb tmavý · 1,20 €“); ťuknutím sa doplní názov aj posledná cena za kus.
- Zdroj: položky uložené pri výdavkoch (D-129, D-313) a v sklade; nič nové sa neukladá.
- **Plus:** opakované nákupy sú hlavne rovnaké veci; menej písania bez novej knižnice. **Odhad:** 1 deň.

## 4. Odporúčanie

**A + D teraz, B ako samostatný pokus po pilote.**
- Text z portálu zrušiť (A); položky uložené cez neho ostávajú.
- QR kód presunúť a premenovať na „Overiť doklad (QR)“, aby nevyvolával dojem, že načíta položky.
- Pridať návrhy z predchádzajúcich nákupov (D).
- B vyskúšať po pilote ako prototyp na fotkách syntetických dokladov a až potom rozhodnúť; zbytočne nezväčší appku pred pilotom.

## 5. Riziká

- **Kognitívna záťaž:** A + D ju znižujú (jedna cesta, menej písania). B pridáva krok kontroly.
- **Zavádzajúce údaje:** B môže prečítať nesprávnu sumu; preto kontrola pred pridaním a zvýraznený súčet.
- **Súkromie:** A a D nič nové neukladajú ani neposielajú. B spracuje fotku len v zariadení. C posiela údaje o nákupoch na server.
- **Technický dlh:** A odstráni parser textu z UI; parser a test ostanú pre obnovu starších záloh netknuté (položky sú už uložené ako dáta, parser sa pri obnove nepoužíva).

## 6. Otázky na rozhodnutie

1. Text z portálu **zrušiť (odporúčam)**, alebo nechať skrytý za odkazom „Mám text z portálu“?
2. Návrhy z predchádzajúcich nákupov (D): **áno (odporúčam)**?
3. Fotka dokladu (B): **pokus po pilote (odporúčam)**, alebo hneď?
4. Načítanie z portálu (C): **nie (odporúčam)**?
