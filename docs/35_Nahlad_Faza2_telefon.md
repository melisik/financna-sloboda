# 35 – Súkromný náhľad Fázy 2 na telefóne

> Stav: nastavenie pripravené (D-270). Workflow `.github/workflows/preview-phase2.yml` sa nasadzuje až po krokoch 1–4 nižšie. Názvy tlačidiel v Cloudflare sa môžu mierne líšiť; overené podľa dokumentácie a návodov z 2026-10-24.

Účel: zakladateľ vidí Fázu 2 z vetvy `claude/phase2-property-card` na telefóne bez počítača. Verejné Pages zostávajú bez Fázy 2 (D-248). Fáza 2 pre používateľov ostáva viazaná na G1–G5 (D-217).

**Poradie je dôležité:** Access (krok 2) musí byť hotový skôr, než sa spustí nasadenie (krok 5). Inak je náhľad na `pages.dev` verejne dostupný.

## Krok 1 – Pages projekt

1. Otvor https://dash.cloudflare.com a vyber svoj účet.
2. V ľavom menu zvoľ **Workers & Pages** → **Create** → záložka **Pages** → **Upload your static files** (Direct Upload).
3. Názov projektu: `financna-sloboda-preview`. Nahraj ľubovoľný súbor, napríklad `index.html` s textom „čaká“. Dokonči cez **Create project** / **Deploy site**.
4. Obsah sa pri prvom nasadení z workflowu prepíše.

## Krok 2 – Cloudflare Access (pred nasadením)

1. V ľavom menu dashboardu zvoľ **Zero Trust**. Pri prvom otvorení ťa prevedie vytvorením tímu (názov ľubovoľný, plán Free). Ak si pýta platobnú kartu, over si pred registráciou, či je to nutné.
2. V Zero Trust otvor **Access → Applications → Add an application → Self-hosted**.
3. **Application name:** `Náhľad Fázy 2`. **Session duration:** napríklad 1 month, aby si sa na telefóne neprihlasoval často.
4. **Application domain:** pridaj dve domény:
   - `financna-sloboda-preview.pages.dev` (produkčná adresa),
   - `*.financna-sloboda-preview.pages.dev` (adresy vetiev a hash náhľadov, napríklad `phase2.financna-sloboda-preview.pages.dev`).
   Ak sa `pages.dev` v zozname domén nezobrazí, zadaj celú adresu do poľa pre doménu bez subdomény.
5. **Identity providers:** zaškrtni **One-time PIN**. Ak nie je zapnutý, zapni ho v **Settings → Authentication → Login methods**.
6. **Policies → Add a policy:**
   - Názov: `Iba ja`,
   - **Action:** Allow,
   - **Include:** Selector **Emails**, hodnota: tvoja e-mailová adresa.
   Ostatné pravidlá nevytváraj.
7. Ulož aplikáciu (**Save** / **Add application**).
8. Overenie: otvor `https://phase2.financna-sloboda-preview.pages.dev` v súkromnom okne. Očakávaš prihlasovaciu stránku Cloudflare. Až po nasadení v kroku 5 uvidíš appku.

## Krok 3 – API token a Account ID

1. **Account ID:** na domovskej stránke účtu (dashboard.cloudflare.com, Account Home) je vpravo v prehľade **Account ID**. Skopíruj ho.
2. **Token:** v pravom hornom rohu otvor profil → **My Profile** → **API Tokens** → **Create Token** → **Create Custom Token** → **Get started**.
   - Názov: `github-preview`,
   - **Permissions:** Account → **Cloudflare Pages** → **Edit**,
   - **Account Resources:** Include → **Specific account** → tvoj účet (nie „All accounts“),
   - **Continue to summary** → **Create Token**.
3. Token sa zobrazí iba raz. Skopíruj ho hneď.

## Krok 4 – GitHub: secrety a premenná

Repozitár `melisik/financna-sloboda` → **Settings** → **Secrets and variables** → **Actions**.

1. Záložka **Secrets** → **New repository secret**:
   - Name `CLOUDFLARE_API_TOKEN`, Secret = token z kroku 3,
   - Name `CLOUDFLARE_ACCOUNT_ID`, Secret = Account ID z kroku 3.
2. Záložka **Variables** → **New repository variable**:
   - Name `PHASE2_PREVIEW`, Value `true`.
   Túto premennú nastav až po kroku 2. Bez nej sa workflow nespustí.

## Krok 5 – spustenie nasadenia

1. Otvor **Actions** → vľavo **Súkromný náhľad Fázy 2** → **Run workflow**.
2. Vyber vetvu `claude/phase2-property-card` → **Run workflow**.
3. Workflow spustí testy (asi 1–2 minúty) a potom zostavu a nasadenie. Zelená ikona = nasadené. Pri červenej pošli mi text chyby, bez tokenov.

## Krok 6 – telefón

1. V Safari otvor `https://phase2.financna-sloboda-preview.pages.dev`.
2. Zadaj svoju e-mailovú adresu → **Send code**. Kód príde do e-mailu, pozri aj spam (odosielateľ je Cloudflare).
3. Prepíš kód → appka sa načíta.
4. Zdieľať (štvorček so šípkou) → **Pridať na plochu** → **Pridať**.
5. Ak vidíš starú verziu, zatvor appku a otvor ju znova. Safari môže chvíľu držať starú kópiu.

## Poznámky

- Náhľad obsahuje syntetickú testovaciu zálohu (`scripts/make-test-backup.mjs`), nie reálne dáta. Tvoje dáta zostávajú v telefóne (D-026).
- Appka nerobí sieťové volania (D-009). Cloudflare slúži len na doručenie súborov a overenie prihlásenia.
- Tajné hodnoty nikdy nepatria do repozitára ani do chatu.
- Overené údaje: wrangler-action v4 a vstup `command: pages deploy ...` z README `cloudflare/wrangler-action` (2026-10-24). Postup Access pre `pages.dev` a wildcard subdomény je z návodov tretích strán; pri prvom nastavení over, či sa `*.financna-sloboda-preview.pages.dev` správne zobrazí v zozname.
