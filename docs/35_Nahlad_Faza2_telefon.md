# 35 – Súkromný náhľad Fázy 2 na telefóne

> Stav: nastavenie pripravené (D-270). Workflow `.github/workflows/preview-phase2.yml` sa nasadzuje až po krokoch 1–4 nižšie.

Účel: zakladateľ vidí Fázu 2 z vetvy `claude/phase2-property-card` na telefóne bez počítača. Verejné Pages zostávajú bez Fázy 2 (D-248). Fáza 2 pre používateľov ostáva viazaná na G1–G5 (D-217).

## Kroky (robí zakladateľ)

1. **Cloudflare – projekt Pages.** Dashboard → Workers & Pages → Create → Pages → Upload assets (Direct Upload). Názov: `financna-sloboda-preview`. Prvý súbor môže byť ľubovoľný, workflow ho neskôr prepíše.
2. **Cloudflare – Access (skôr než prvé nasadenie).** Zero Trust → Access → Applications → Add → Self-hosted. Doména: `financna-sloboda-preview.pages.dev` a zároveň `*.financna-sloboda-preview.pages.dev`. Policy: Allow, Include → Emails → tvoja e-mailová adresa. Identity provider: One-time PIN (kód na e-mail). Bez tohto kroku je náhľad na `pages.dev` verejne dostupný.
3. **Cloudflare – tokeny.** Účet → Account ID (skopírovať). My Profile → API Tokens → Create Token → vlastný token s oprávnením Account → Cloudflare Pages → Edit, obmedzený na tento účet. Token skopírovať.
4. **GitHub – tajné hodnoty a premenná.** Repozitár `melisik/financna-sloboda` → Settings → Secrets and variables → Actions:
   - Secret `CLOUDFLARE_API_TOKEN` = token z kroku 3,
   - Secret `CLOUDFLARE_ACCOUNT_ID` = Account ID,
   - Variable `PHASE2_PREVIEW` = `true` (až po kroku 2).
5. **Spustenie.** Actions → „Súkromný náhľad Fázy 2“ → Run workflow (alebo nový push do vetvy).
6. **Telefón.** Otvor `https://phase2.financna-sloboda-preview.pages.dev` v Safari, zadaj e-mail, prepíš kód z e-mailu. Potom Zdieľať → Pridať na plochu.

## Poznámky

- Náhľad obsahuje syntetickú testovaciu zálohu (`scripts/make-test-backup.mjs`), nie reálne dáta. Tvoje dáta zostávajú v telefóne (D-026).
- Appka nerobí sieťové volania (D-009). Cloudflare slúži len na doručenie súborov a overenie prihlásenia.
- Kroky 1–4 nie sú automatizované; tajné hodnoty nikdy nepatria do repozitára ani do chatu.
