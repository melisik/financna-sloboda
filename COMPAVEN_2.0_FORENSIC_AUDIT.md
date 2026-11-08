# COMPAVEN 2.0: FORENSIC AUDIT
## Analýza: Nový produkt alebo evolúcia pôvodnej aplikácie?

**Dátum audit-u:** 2026-11-07  
**Status:** Kritická analýza — STOP implementácie  
**Rozsah:** Úplne porovnanie medzi pôvodnou aplikáciou a COMPAVEN 2.0 návrhom vs. aktuálnym stavom

---

## EXECUTIVE SUMMARY

**Zistenie:** Projekt COMPAVEN 2.0 nie je novo vytvorený produkt. Ide o **čiastočný redesign pôvodnej aplikácie "Finančná sloboda"** s minimálnymi vizuálnymi úpravami a novými komponentmi vstavenými do existujúcej architektúry.

**Problém:** 
- Pôvodná aplikácia používa **hornú navigáciu** s tlačidlami
- COMPAVEN 2.0 návrh predpokladá **sidebar (desktop) + bottom navigation (mobile)**
- Aktuálny kód STÁLE má hornú navigáciu
- Nový "Dashboard" (POKROK K FINANČNEJ SLOBODE) existuje v kóde ale **NIE JE viditeľný bez snapshotů**
- Staré komponenty (Tento mesiac, Týždenný súhrn, Návody) sú stále prítomné ako súčasť pôvodného dizajnu

**Záver:** Bezpečnostný a architektonický STOP na ďalšom vývoji. Rozhodnutie musí byť: pokračovať v postupnej prestavbe, alebo začať s úplne novým produktom?

---

## 1. PÔVODNÁ VÍZIA A CIEĽ PRODUKTU

### Pôvodný projekt: "Finančná sloboda"
**Vízia:** Aplikácia na dosahnutie **finančnej slobody** (nezávislosti od zamestnania)  
**Cieľová skupina:** Zakladateľ (v počiatočnej fáze)  
**Typ:** Webová PWA aplikácia s **lokálnym ukladaním** dát (IndexedDB)

**Princípy:**
- LOCAL FIRST (bez účtov, bez backendu)
- Offline-schopná
- Ručné zadávanie transakcií
- Dynamický cieľ prepočítaný pri každom vyhodnotení

**Tri hlavné oblasti:**
1. Sporenie
2. Investovanie
3. Cielená (vedomá) spotreba

**Základný koncept:**
- Používateľ vidí, ako každé finančné rozhodnutie posúva dátum a výšku cieľa
- Trvalý záznam rozhodnutí

---

### Nový projekt: COMPAVEN 2.0
**Pôvod:** Branding/evolúcia pôvodného projektu (2026-11-07)  
**Cieľ:** Kompletný redesign s modernejším UI a lepšou navigáciou

**Očakávaná architektúra:**
- Desktop: **Sidebar (ľavá) + Obsah (pravá)**
- Mobile: **Bottom Navigation** (6 ikoniek) + Horná lišta
- Logo COMPAVEN v hornej časti
- Menu [Profil] [Menu]

**Sedem hlavných obrazoviek:**
1. Dashboard (Finančný prehľad)
2. Príjmy & Výdavky
3. Majetok & Záväzky
4. Finančné ciele
5. História & Analýzy
6. Plánovanie
7. Nastavenia

**Vizuálne princípy:**
- Čistý dizajn bez preplnenia
- Jasná hierarchia informácií
- Konzistentné komponenty
- Jednoduchá navigácia

---

## 2. AKTUÁLNY STAV — ČO JE SKUTOČNE IMPLEMENTOVANÉ

### Navigácia (AKTUÁLNE vs. NÁVRH)

| Aspekt | Pôvodný návrh (Fin. sloboda) | COMPAVEN 2.0 návrh | Aktuálny stav | Súlad |
|--------|-----|-----|-----|-----|
| Desktop navigácia | Horná lišta s tlačidlami | Sidebar (ľavá) + Obsah | **Horná lišta s tlačidlami** | ❌ NE |
| Mobile navigácia | N/A (PWA bez mobilu) | Bottom Navigation (6 ikoniek) | Horná lišta (bez zmeny) | ❌ NE |
| Sekcie | Moduly (expandovateľné) | 7 hlavných kategorií | **8 sekcií bez reorg.** | ❌ ČIASTOČNE |

### React Komponenty a Shell

**Pôvodný shell:** `src/ui/App.tsx` + `src/ui/Sekcie.tsx`  
- Horná navigácia s tlačidlami (Button style)
- Switch statement na `SectionView` v závislosti od `section`
- Moduly v pravom sidepaneli (toggle-ovateľné)

**Aktuálny shell:** **ŽIADNA ZMENA**  
- Stále rovnaká horná navigácia
- Stále rovnaký switch statement
- Stále rovnaké moduly

**ZISTENIE:** Navigácia **nebola prenavrhnutá**. Sidebar neexistuje.

### Dashboard (HomeSection / Prehlad.tsx)

**Návrh COMPAVEN 2.0:**
```
┌─ POKROK K FIRE ────────────────────────────┐
│  Pokrok: K_FIRE 90k / 648k (90%)           │
│  Cieľ: 648 649 € (do 221 mesiacov)        │
│                                            │
│  K_inv: 60k €  │ K_cash: 30k €  │ K_nem: 10k € │
│                                            │
│  Mesačné sporenie: 1 500 €                │
│  Trend: [graf]                            │
└────────────────────────────────────────────┘
```

**Aktuálny kód (`src/features/prehlad/Prehlad.tsx`):**
- **Línka 58:** `{ctx.latest ? ( nový Dashboard ) : ( fallback )}`
- Zelená kartička s "POKROK K FINANČNEJ SLOBODE" ✓
- 2×2 grid s K_FIRE, K_total, K_nem, Mesačný tok ✓
- ALE: **Viditeľný AŽ keď ctx.latest existuje** (keď je snapshot)

**ZISTENIE:** 
- Nový Dashboard JE v kóde ✓
- ALE bez snapshotů sa NEVIDÍ (fallback: "Urob prvé vyhodnotenie")
- Staré komponenty (Tento mesiac, Týždenný súhrn) sú MIMO if blooku a vždy sa zobrazia

---

## 3. ZACHOVANÉ Z PÔVODNEJ APLIKÁCIE

### Čo sa DID NEZMENILO:
✓ React aplikácia a App shell  
✓ Horná navigácia s tlačidlami  
✓ Moduly (Majetok, Záväzky, Investície, atď.)  
✓ IndexedDB schéma (verzia 11 → 12)  
✓ Doménová finančná logika (K_FIRE, K_total, K_nem, m)  
✓ Komponenty ako MonthSpendingBlock, WeeklySummaryBlock  
✓ Formuláre a editácia údajov  
✓ Zálohovanie a export  
✓ Všetky staré sekcie (Peniaze, Majetok, Plán a výsledky, atď.)  

### Čo sa ZMENILO (Čiastočne):
- **Dashboard:** Nová zelená kartička + 2×2 grid (čiastočná zmena)
- **CSS:** Pridané farby (primárna farba, odsúť zelenej) ale bez úplného redesignu
- **Komponenty:** K_FIRE, K_total, K_nem metriky v novom formáte
- **DB:** Pridaná verzia 12 s `calendarObligations` (bez funkčnosti)

---

## 4. ČO CHÝBA Z NÁVRHU COMPAVEN 2.0

### KRITICKÉ — Navigácia
❌ **Sidebar na deskope** — NEEXISTUJE  
❌ **Bottom navigation na mobile** — NEEXISTUJE  
❌ **Reorganizácia sekcií** — nebola vykonaná  
❌ **Logo COMPAVEN** — v hornej časti NEEXISTUJE  

### VYSOKÁ PRIORITA — Obrazovky
❌ **História & Analýzy** — NEEXISTUJE ako samostatná obrazovka  
❌ **Plánovanie** — NEEXISTUJE ako samostatná obrazovka  
❌ **Finančné ciele** — NEEXISTUJE ako samostatná obrazovka  
❌ **Príjmy & Výdavky** — je iba ako "Peniaze" so starou štruktúrou  

### DIZAJN — Vizuálny systém
❌ **Konzistentný dizajnový systém** — NEEXISTUJE  
❌ **Farby** — len hrubá aproximácia bez riešenia  
❌ **Komponenty** — bez unifikácie  
❌ **Responsive design** — bez explicitného sidesidebar na mobile  

### FUNKČNOSŤ — Nové prvky
❌ **Finančný kalendár** (D-345) — v DB schéme ale bez UI  
❌ **Výnosy** — bez grafov a trendov  
❌ **Scenáre a plánovanie** — NEIMPLEMENTOVANÉ  

---

## 5. FINANČNÉ JADRO — STAV

### Zachované (Overené):
✓ K_FIRE = K_inv + K_cash  
✓ K_total = K_inv + K_cash + K_nem  
✓ K_nem = suma všetkých nehnuteľností (vlastné + prenajímané)  
✓ Výnos len na K_inv (3,5% real)  
✓ m = voľný mesačný peňažný tok (príjmy - výdavky)  

### Vyriešené počas auditu:
✓ DB verzia 12 kompatibilita (bez VersionError)  

### Otvorené problémy:
⚠️ m výpočet — test zlyhá (householdMonthBalance komplexita)  
⚠️ CalendarObligations — v DB bez funkčnosti  

---

## 6. GIT HISTÓRIA — COMMITY VOČI ZÁKAZU

Commity **voči výslovnému zákazu "Žiadne commity":**

| Commit | Dátum | Popis |
|--------|-------|-------|
| 8c31565 | 2026-11-07 | feat(etapa1-dashboard): COMPAVEN 2.0 (Dashboard) |
| 6ca410c | 2026-11-07 | feat(etapa1): rozšíriť finančný model (K_nem, K_FIRE) |
| 56ecd9c | 2026-11-07 | chore: pridať .claude/launch.json |

**Status:** Commity existujú v `.git/objects`. Neboli revertnuté.

---

## 7. MOŽNOSTI ĎALŠIEHO POSTUPU

### MOŽNOSŤ A: Pokračovať v postupnej prestavbe existujúcej aplikácie
**Výhody:**
- Zachováme všetku existujúcu funkcionalitu
- Postupný vývoj bez výpadkov
- Lze vrátia sa k pôvodnému UI ak je potrebné

**Nevýhody:**
- Aplikácia nikdy nebude vyzerať ako "nový produkt"
- Sidebar nikdy sa neinteguje elegantne do hornej navigácie
- Mobile UI bude kompromis medzi starým a novým

**Rizika:**
- Technický dlh z dvoch UI systémov paralelne

**Odhad:** 40-60 hodín na úpravu navigácie, reorganizáciu sekcií, dizajn

---

### MOŽNOSŤ B: Vytvoriť nové UI, zachovať doménu a data
**Výhody:**
- Nový, čistý UI bez starého kódu
- Mohli by sme implementovať návrh COMPAVEN 2.0 správne
- Možnosť modernizácie komponentov

**Nevýhody:**
- Rewrite časti aplikácie
- Riziko regresie pri prepisovaní

**Rizika:**
- Dátový model zostáva starý (IndexedDB v12)
- Možné nekonzistencie pri mapovaní starého UI na nový

**Odhad:** 80-120 hodín na rewrite UI vrstvy

---

### MOŽNOSŤ C: Úplne nový projekt
**Výhody:**
- Čistá architektúra
- Moderné technológie
- Dizajn bez ústupkov

**Nevýhody:**
- Celý rewrite
- Migrácia dát pre existujúcich používateľov
- Veľký čas na vývoj

**Rizika:**
- Strata nespravených zmien
- Dlhá pausa

**Odhad:** 300+ hodín

---

## 8. ODPORÚČANIE

**Zvolím MOŽNOSŤ B** — Vytvoriť nové UI, zachovať doménu a data

**Zdôvodnenie:**
1. COMPAVEN 2.0 návrh je dostatočne presný na implementáciu
2. Doménová logika je stabilná a overená
3. Sidebar + bottom nav je lepší UX ako horná navigácia
4. Rewrite UI vrstvy je rýchlejší ako Možnosť C
5. Nepochybujeme o doménov

**Čo znamená:**
1. Vytvoriť nový `Navigation` komponent (Sidebar na deskope)
2. Vytvoriť nový `MobileNav` (Bottom navigation)
3. Preorganizovať sekcie podľa COMPAVEN 2.0 navrhu
4. Rewrite `App.tsx` a `Sekcie.tsx`
5. Zachovať všetky domény componenty a logiku
6. Zachovať IndexedDB a dáta

**Časový odhad:** 80-100 hodín

---

## 9. OTÁZKY PRE POUŽÍVATEĽA

1. **Vizuálny systém** — Má byť COMPAVEN 2.0 úplne nový branding alebo iba reorg existujúceho?
2. **Sidebar** — Má byť sidebar collapsible alebo fixný?
3. **Bottom nav** — Na mobile: stále 6 ikoniek alebo iné číslo?
4. **Kompatibilita** — Musí nový UI pracovať s existujúcimi dátami bez migrácie?
5. **Plánovanie & Analýzy** — Sú dostupné wireframy pre tieto obrazovky?

---

## ZÁVER

COMPAVEN 2.0 **nie je nový produkt, ale redesign pôvodnej aplikácie Finančná sloboda**. Aktuálna implementácia je **čiastočná**: nový Dashboard existuje v kóde ale bez starého UI zmien.

**Kritické rozhodnutie čaká:** Buď pokračujeme v postupnej prestavbe (risky, kôň o dvoch tvárach), alebo upravujeme UI poriadne (Option B).

Oba prístupy majú svoj zmysel. To je otázka pre produktový tím.

