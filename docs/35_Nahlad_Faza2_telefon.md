# 35 – Súkromný náhľad Fázy 2 na telefóne

> Stav: nastavenie pripravené (D-270, D-271). Ochrana je heslom cez Pages Functions, nie Cloudflare Access, lebo Access vyžaduje platobný spôsob. Workflow `.github/workflows/preview-phase2.yml` sa spustí až po krokoch 2–4.

Účel: zakladateľ vidí Fázu 2 z vetvy `claude/phase2-property-card` na telefóne bez počítača. Verejné Pages zostávajú bez Fázy 2 (D-248). Fáza 2 pre používateľov ostáva viazaná na G1–G5 (D-217).

## Čo je hotové
- Pages projekt `financna-sloboda-preview` existuje (krok 1 je hotový).
- Placeholder na `financna-sloboda-preview.pages.dev` je verejný, ale obsahuje len text. Nič z Fázy 2 tam nie je.

## Krok 2 – heslo v Cloudflare (pred prvým nasadením)

1. Cloudflare dashboard → **Workers & Pages** → projekt `financna-sloboda-preview` → **Settings** → **Environment variables**.
2. Pridaj premennú pre prostredie **Production**. Náhľad sa nasadzuje do produkčnej vetvy projektu `main` (D-272):
   - **Variable name:** `PREVIEW_PASSWORD`
   - **Value:** tvoje heslo. Odporúčam aspoň 16 znakov, len ASCII (bez diakritiky), nepoužité inde.
   - Zaškrtni **Encrypt** (secret), ak ti to ponúkne.
3. **Save**. Heslo nikdy nevkladaj do chatu ani do repozitára.

## Krok 3 – API token a Account ID (pre nasadenie z GitHubu)

1. **Account ID:** domovská stránka účtu (Account Home), vpravo v prehľade.
2. Pravý horný roh → profil → **My Profile** → **API Tokens** → **Create Token** → **Create Custom Token** → **Get started**.
   - Názov: `github-preview`
   - **Permissions:** Account → **Cloudflare Pages** → **Edit**
   - **Account Resources:** Include → **Specific account** → tvoj účet
   - **Continue to summary** → **Create Token**. Token sa zobrazí iba raz, skopíruj ho.

## Krok 4 – GitHub: secrety a premenná

Repozitár `melisik/financna-sloboda` → **Settings** → **Secrets and variables** → **Actions**.

1. **Secrets** → **New repository secret**: `CLOUDFLARE_API_TOKEN` (token z kroku 3), `CLOUDFLARE_ACCOUNT_ID` (Account ID).
2. **Variables** → **New repository variable**: `PHASE2_PREVIEW` = `true`. Nastav až po kroku 2. Bez nej sa workflow nespustí.

## Krok 5 – spustenie

1. **Actions** → vľavo **Súkromný náhľad Fázy 2** → **Run workflow** → vetva `claude/phase2-property-card` → **Run workflow**.
2. Workflow najprv spustí testy (1–2 minúty), potom zostavu a nasadenie. Zelená = nasadené. Pri chybe pošli text chyby bez tokenov a hesla.
3. Ak si premennú v kroku 2 pridal až po nasadení, spusti workflow znova.

## Krok 6 – telefón

1. Safari → `https://financna-sloboda-preview.pages.dev`.
2. Prehliadač zobrazí okno na prihlásenie. Meno: `zakladatel`. Heslo: z kroku 2. Ulož ho do iCloud Keychain, ak sa to ponúkne.
3. Zdieľať → **Pridať na plochu** → **Pridať**.
4. Pri spustení z plochy môže Safari heslo pýtať znova. Ak áno, napíš mi, lebo to overím na tvojom telefóne.

## Poznámky

- Náhľad obsahuje syntetickú testovaciu zálohu (`scripts/make-test-backup.mjs`), nie reálne dáta. Tvoje dáta zostávajú v telefóne (D-026).
- Appka nerobí sieťové volania (D-009). Cloudflare slúži len na doručenie súborov a kontrolu hesla.
- **Obmedzenia (D-271):** je to jedno heslo, nie prihlásenie e-mailom. Overenie beží na serveri a bez hesla náhľad zlyhá zatvorene (503). Správanie pri prekročení denného limitu funkcií v bezplatnom pláne som neoveril. Ak sa ti zdá, že náhľad je dostupný bez hesla, okamžite zmaž premennú `PHASE2_PREVIEW` v GitHube.
- Ak neskôr získaš platobný spôsob, Cloudflare Access je silnejšia ochrana (prihlásenie e-mailom). Dá sa prepnúť bez zmeny appky.
