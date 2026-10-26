# 64 – Výťah: podmienky používania údajov NBS (register subjektov)

> Stav: výťah na kontrolu zakladateľom (2026-10-26). **Nie je to právne stanovisko**; do podkladu pre právnika (G1) ide ako otázka. Zdroj: Podmienky používania NBS, https://www.nbs.sk/sk/disclaimer-sk (odkaz „Podmienky používania“ v päte `subjekty.nbs.sk`), načítané 2026-10-26. Údaje: export `https://subjekty.nbs.sk/api/json`, stav registra 2026-10-25.

## 1. Čo podmienky hovoria (parafráza)

1. **Ukladanie, rozmnožovanie a ďalšie použitie** informácií zverejnených na stránke NBS je povolené **bez predchádzajúceho súhlasu** NBS.
2. **NBS musí byť uvedená ako zdroj** informácií.
3. Príslušný **elektronický súbor nesmie byť obsahovo ani inak pozmeňovaný.**
4. NBS **nemôže ručiť za úplnosť a obsahovú neporušiteľnosť** informácií a pri obchodnom použití odporúča preskúmať ich správnosť; **nezodpovedá za škody** z použitia údajov.
5. Symboly NBS (logotyp, vlajka) sa smú použiť len so schválením oddelenia komunikácie; **logo nepoužijeme.**
6. Jediné platné znenie právnych predpisov je v Zbierke zákonov alebo vo Vestníku NBS (pre nás bez vplyvu).

## 2. Čo to znamená pre návrh `docs/63`

| Podmienka | Dôsledok | Riešenie v návrhu |
| --- | --- | --- |
| Uvedenie zdroja | povinné | pod výberom: „Zdroj: register subjektov finančného trhu NBS, stav k [dátum].“ + odkaz na `subjekty.nbs.sk` |
| Súbor sa nesmie pozmeňovať | **riziko:** náš výber (filter typov, bez adries) je úprava obsahu súboru | pribaliť **výťah** (každý záznam sa preberá nezmenený: IČO, názov, typ oprávnenia presne ako v registri), nie upravený súbor; v texte jasne „výber z registra“; text otázky pre právnika (oddiel 4) |
| Bez záruky NBS | zoznam môže byť neúplný alebo neaktuálny | veta „Nie je to odporúčanie ani záruka úplnosti“; dátum stavu; ručná aktualizácia raz za kvartál (zakladateľ) |
| Logo | zákaz bez schválenia | v appke sa logo NBS nepoužije |

**Otvorený bod (predpoklad):** nie je jasné, či výber niektorých záznamov z celého súboru je „pozmenenie súboru“. Odporúčam bezpečnejší postup: názvy a IČO preberať doslova (bez úpravy písma, skratiek ani poradia polí) a do appky dať **označenie zdroja** a dátum. Overí právnik (G1) alebo NBS (kontakty v päte registra).

## 3. Odkaz na detail firmy

Register má vyhľadávanie podľa IČO na `https://subjekty.nbs.sk/sk/search?q=<IČO>` (stránka sa načíta, výsledky doplní JavaScript; **neoverené v prehliadači**, preto sa pri implementácii skúsi na iPhone). Odkaz by sa otváral v novom okne ako ostatné odkazy von (D-126), bez odovzdávania údajov z appky okrem IČO firmy zo zoznamu.

## 4. Otázka pre právnika (G1) — návrh

„Appka (bez servera) obsahuje výber záznamov z verejného registra subjektov finančného trhu NBS (IČO, obchodné meno, typ oprávnenia; asi 100 firiem z 33 000), s uvedením NBS ako zdroja a dátumu stavu. Podmienky NBS povoľujú ďalšie použitie bez súhlasu, ak je uvedený zdroj a súbor nie je obsahovo ani inak pozmeňovaný. Je výber a preformátovanie záznamov v súlade s touto podmienkou, alebo treba súhlas NBS?“

## 5. Čo spraví zakladateľ

1. Prečítať oddiel 1 a 2 (5 minút) a potvrdiť, že postup „doslovný výber so zdrojom a dátumom“ je prijateľný.
2. Prípadne pri aktualizácii zoznamu (raz za kvartál) pozrieť, či sa podmienky nezmenili.
