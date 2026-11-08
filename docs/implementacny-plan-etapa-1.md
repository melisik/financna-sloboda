# IMPLEMENTAČNÝ PLÁN: ETAPA 1 — Základná Evidencia Nehnuteľností

**Dátum:** 2026-11-08  
**Status:** Čaká na schválenie užívateľa  
**Cieľ:** Implementácia CRUD operácií pre nehnuteľnosti bez hypoték

---

## 📋 OVERVIEW

**Čo bude implementované:**
- Zoznam nehnuteľností (empty state, list view, card display)
- Formulár na pridávanie/úpravu nehnuteľností (4 polia: názov, režim, odhad, dátum)
- Mazanie nehnuteľností s potvrdením
- Uloženie a načítanie z IndexedDB
- K_nem sa zobrazí v Dashboard (JUŽ HOTOVÉ)

**Čo NEBUDE v Etape 1:**
- ❌ Hypotéka (žiadne polia)
- ❌ Prenájom (žiadne polia)
- ❌ Extra payments, LV parser, Assets, Liabilities

---

## 📁 SÚBORY: PRESNÝ ZOZNAM

### **NOVÉ SÚBORY (2)**

1. **`src/compaven-ui/PropertyForm.tsx`** (150-200 riadkov)
   - Jednoduchý formulár s 4 polami (názov, režim, odhad, dátum)
   - State management pre edit mode (new vs. update)
   - Validácia
   - Save/Cancel handlers

2. **`src/compaven-ui/PropertySection.tsx`** (200-250 riadkov)
   - Zoznam nehnuteľností
   - PropertyCard s údajmi a K_nem príspevkom
   - Add/Edit/Delete handlers
   - Delete confirmation dialog

### **ZMENIŤ (1 súbor)**

**`src/compaven-ui/App.tsx`** — 2 zmeny
- Import PropertySection (riadok ~15)
- Render PropertySection na "assets" page (riadok ~193)

---

## 🧪 TESTY: PRESNÝ ZOZNAM

### **NOVÉ TESTY (2)**

1. **`tests/property-section-e2e.test.ts`** (100-150 riadkov)
   - Empty state test
   - Add/Edit/Delete CRUD tests
   - Card display test
   - K_nem display test

2. **`tests/property-integration-k_nem.test.ts`** (80-100 riadkov)
   - K_nem updates when property added
   - K_nem = odhad (bez hypoték)
   - K_total = K_inv + K_cash + K_nem
   - K_FIRE unchanged (bez hypoték)

### **EXISTUJÚCE TESTY (bez zmien)**

✅ `tests/property.card.test.ts` — pokrýva `netPropertyValueCents()`  
✅ `tests/etapa1-scenario.test.ts` — pokrýva K_nem výpočty

---

## ✅ KRITÉRIÁ ÚSPEŠNOSTI

**Technické:**
- [ ] `npm run build` bez chýb
- [ ] `npm run test` — oba nové testy prejdú
- [ ] Bez nových failov (okrem existujúcich 11 schemaVersion)
- [ ] `repo.saveProperty()` uloží do IndexedDB
- [ ] `repo.getData().properties` vráti uložené údaje

**UI:**
- [ ] Formulár sa otvorí pri kliknutí
- [ ] Záznam sa zobrazí po Save
- [ ] Karta zobrazuje: názov, režim, odhad, dátum, K_nem
- [ ] Edit: Formulár sa naplní údajmi
- [ ] Delete: Potvrdenie dialóg funguje
- [ ] Záznam sa zmaže

**Dashboard:**
- [ ] K_nem sa zobrazí (JUŽ HOTOVÉ)
- [ ] Zmena K_nem sa zobrazí (keď sa pridá nehnuteľnosť)
- [ ] Scenár: Pridaj 200 000 EUR → K_nem +200 000 EUR

**Bez Regresií:**
- [ ] Existujúce testy — bez nových failov
- [ ] Dashboard — bez zmien

---

## ⏱️ CELKOVÝ ČAS: 8-10 HODÍN

- PropertyForm.tsx: ~2 hodiny
- PropertySection.tsx: ~3 hodiny
- App.tsx integrácia: ~30 minút
- Testy: ~1.5 hodiny
- Manual testing: ~1 hodina

---

## 🔐 BEZPEČNOSŤ

✅ Worktree `phase3-ux-redesign` ostane izolovaný  
✅ Žiadne zmeny v databáze (schéma v20)  
✅ Bez zmien v rozhodnutiach (`decisions/`)  
✅ Commit na vetve `recovery-test` (nie na `main`)

---

**Status:** ✅ **PRIPRAVENÉ NA SCHVÁLENIE A IMPLEMENTÁCIU**
