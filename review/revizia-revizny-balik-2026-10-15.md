# Revízia balíka „Finančná sloboda: revízny balík“ (2026-10-15)

Vstup: `Finančná sloboda_ revízny balík_1.md` (1424 riadkov, stav main 99edd2f, 2026-10-14).
Reviewer len číta a hlási. Dokumenty nemenil. Opravy robí autor po rozhodnutí zakladateľa.
Poznámka: CLAUDE.md predpisuje externú revíziu v samostatnej konverzácii. Tento výstup vznikol v inom chate, preto je to vstup pre zakladateľa, nie nezávislé overenie.

## Metóda

- Prečítaný celý balík (00–08, Decisions.md, prílohy).
- Golden cases a vzorce prepočítané nezávisle v Pythone (uzavretý tvar FR-02, iterácia D-046 a interpolácia).
- Stav predchádzajúcich nálezov (RR32–RR60, `review/externa-revizia-nalezy-2026-10-14.md`) overený proti tomuto balíku a proti HEAD repozitára.
- Kód som nečítal ani nespúšťal testy. Počty testov treba zobrať z runnera.

## Výpočty: v poriadku

| Prípad | Dokument | Prepočet |
|---|---|---|
| GC-03 | 334 mesiacov (333,92) | 333,92 ✓ |
| GC-04 | 328 (327,93), dopad +6 | 327,93, dopad 5,99 ✓ |
| GC-05 / GC-06 / GC-23 | 272 (271,67) / 557 (556,46) / 363 (362,10) | ✓ |
| GC-07 / GC-09 / GC-12 | 549 (548,21) / 489 (488,02) / 656 (655,4) | ✓ |
| GC-15 | −154 mesiacov | −154,10 ✓ |
| GC-18 | 7 mesiacov (6,24) | 6,24 ✓ |
| GC-20 / GC-21 | 418 (417,42) / 0,056 mesiaca ≈ 1,7 dňa | 417,42 / 0,0562 ✓ |
| Predvolené T | 648 649 pri 3,7 % | 648 648,6 ✓ |

Nenašiel som chybu, ktorá by zmenila zobrazený dátum pri správnych vstupoch.

## Stav predchádzajúcich nálezov (RR32–RR60)

**Vyriešené alebo rozhodnuté:** RR33 (signatúry K_inv/K_cash a m_inv/m_cash v 05 §5), RR37 (poplatky, D-067), RR35 (uvedené v 04, rozhodnuté D-069), RR46 (null vstupy vo FR-01), RR57 (GC-15 je −154 všade), RR44 (duplicitné kódy odstránené).

**Čiastočne:**
- RR32: D-036 stále hovorí „vlastná sadzba, predvolene 0 %“, FR-02 hovorí fixné 0 %.
- RR34: D-066 zapíše nekrytú sumu len do poznámky, pravidlá pre nedostatok kapitálu sa stále líšia.
- RR38: FR-12 stále hovorí „povinná výzva“ aj „dá sa preskočiť“.
- RR42: chýbajú testy pre D-055, D-057, D-059, D-060, D-063, D-064, D-065 a S10.

**Stále otvorené:**
- RR36: M3 brána „zdroj zapísaný“ je splnená, ale zdroje sú podľa vlastných podkladov neoverené.
- RR39: D-063 hovorí, že nominálne číslo je hlavné, FR-02 počíta reálne.
- RR40: 08 hlavička hovorí „Implementované“ aj „Nič z tohto nie je v kóde“; 05 §4 nemá feesRate ani returnSource.
- RR41: počty testov 63 / 70 / 76 vo viacerých dokumentoch. Repo grep dal 79 zhôd vrátane E2E.
- RR43: M1 nepokrýva GC-22 až GC-24.
- RR45: zdroj úhrady „z investícií“ pri type investícia nie je definovaný.
- RR47: FR-03 „dolná hranica 0 %“ vs. 08 §4 „r sa neorezáva pod 0“.
- RR48: rozsah prahu 100–500 € je tvrdý limit, alebo odporúčaný rozsah?
- RR49: prepis vyhodnotenia s rovnakým dátumom nie je definovaný.
- RR50: D-035 uvádza 7-dňový limit WebKit ako fakt, nie ako predpoklad.
- RR51, RR52, RR53: import novších polí bez zvýšenia schemaVersion; rozsah E2E v CI; export v plaintexte.
- RR54: text pri nedosiahnuteľnom cieli (poznámky §2) stále odporúča „zvážiť mieru výberu v rozsahu 3–4 %“.
- RR55: rozsah MVP je široký (19 FR, PWA, rezerva, poplatky, nominálne zobrazenie, dlhý horizont).
- RR56: interpolácia pri m_cash > 0 nie je pokrytá invariantom.
- RR58: chybné odkazy. 06 §8 odkazuje na D-046 namiesto D-045; D-029 odkazuje na D-024 namiesto D-014.
- RR60: S3 je stále „otvorené“, hoci D-014 a FR-08 už nastavujú predvolené „z príjmu“.

## Nové nálezy v tomto balíku

### Vysoké – proces: M2–M4 sú na main pred bránou M1
- **Kde:** D-072, 06 §2 a §4, D-023.
- **Problém:** D-023 hovorí, že kód ide na vetvu a na `main` až po zelených testoch. Roadmapa určuje poradie M1 → M2 → M3. D-072 uvádza len výnimku z D-022, nie z D-023. Brána M1 nie je splnená: podľa 07 §3 nemajú označený test GC-07, GC-09, GC-10, GC-12, GC-14 a GC-22.
- **Návrh:** doplniť výnimku z D-023 do D-072, alebo uviesť M1 ako neuzavretý a dopísať, ktoré GC sú otvorené.

### Stredné – súkromie: automatická záloha pri importe (D-071)
- **Kde:** D-071, FR-18.
- **Problém:** pred nahradením dát sa automaticky stiahne neošifrovaný JSON so celou históriou. Nevyžaduje potvrdenie. Odporuje to 05 §7 („žiadne ukladanie do verejných priečinkov“) a D-026. Nemá to ani test (07 §6 a §7).
- **Návrh:** záloha len po potvrdení používateľa, alebo jasné upozornenie pred uložením. Doplniť test.

### Stredné – rezerva a cieľ
- **Kde:** 00 (Východiskové predpoklady), 04 pojmy (Rezerva), D-037, D-060.
- **Problém:** 00 a 04 hovoria, že rezerva je „mimo cieľa“ a „do cieľa sa nezapočítava“. D-060 hovorí, že vklad do rezervy znižuje cieľový kapitál. Používateľ bude čakať, že rezerva cieľ nezmení.
- **Návrh:** zosúladiť texty, v náhľade transakcie výslovne uviesť vplyv vkladu na cieľ (D-060 to už žiada).

### Stredné – nekrytá suma pri investičnom výdavku (D-059, D-066)
- **Kde:** D-059, D-066, FR-08, GC-15.
- **Problém:** pri výdavku nad K_inv sa K_inv nastaví na 0, K_cash sa nezmení a zvyšok sa zapíše len do poznámky. Projekcia tak tiše stratí sumu, ktorú používateľ reálne minul.
- **Návrh:** rozhodnúť, či zvyšok ide z K_cash, alebo sa výdavok blokuje. Poznámka nestačí.

### Stredné – zdroj 3,7 % (D-049) a právny rámec
- **Kde:** D-049, `review/o9-podklady.md`, 00 (tabuľka), 06 §8 (M3 brána).
- **Problém:** D-049 zapisuje 3,7 % ako rozhodnutie so zdrojom Morningstar 2025. Tie isté podklady hovoria, že čísla sa rozchádzajú (USA vs. Austrália) a treba ich overiť. Text v 00 („pri dlhom horizonte býva opatrnejšia 3–3,5 %“) je blízko odporúčania konkrétnej hodnoty pre konkrétneho človeka. Spolu s RR54 ide o otázku pre právne posúdenie.
- **Návrh:** označiť 3,7 % ako neoverený predpoklad až do overenia primárneho zdroja.

### Nízke
- **FR-02:** nie je definované, či „m“ v kontrole vetvy 2 (K·i + m = 0) je celkové m, alebo m_inv. Pri m_cash > 0 to rozhoduje o vetve.
- **07 §2:** tabuľka pokrytia nemá riadky pre D-059, D-060, D-063, D-064, D-065, D-071 a S10.

## Otázky pre zakladateľa

1. K_cash: fixných 0 %, alebo nastaviteľná sadzba (D-036)?
2. Nedostatok kapitálu: blokovať výdavok (ako GC-19), alebo potvrdiť a zvyšok zaevidovať do K_cash?
3. iPhone pri prvom nastavení: blokovať, kým nie je appka na ploche, alebo povoliť preskočenie s upozornením?
4. Overiť primárne zdroje 3,5 % a 3,7 % pred M3, alebo zmeniť bránu M3 a označiť ich ako neoverené?
5. Hlavné zobrazenie: nominálne (D-063), alebo reálne (FR-02)?
6. Automatická záloha pri importe (D-071): ponechať, alebo len po potvrdení?

## Čo je v poriadku

- Vzorec FR-02, poradie vetiev, `ceil(n − 1e-6)` a FR-04 sú správne. Všetky prepočítané GC sa zhodujú.
- Dátum a čas: referenčný dátum D_L, orezanie na koniec mesiaca, GC-13 a GC-14 sú konzistentné.
- Rezerva: D-058 je konzistentne aplikovaná vo FR-04, FR-08 a GC-19, GC-22, GC-24.
- Súkromie: lokálne dáta, bez sieťových volaní, CSP bez inline skriptov (okrem D-071, viď vyššie).
- Decisions.md je úplný záznam a väčšina zmien je označená.
