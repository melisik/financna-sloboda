# Návod: povolenie domény pre cloudové prostredie Claude Code

> Znalosť pre zakladateľa (2026-10-26). Kedy: keď Claude v cloudovej session hlási, že sieťová politika prostredia odmietla adresu (napr. „CONNECT tunnel failed, response 403“ alebo „ENOTFOUND“). Prvý prípad: register subjektov NBS `subjekty.nbs.sk` pre zoznam spoločností v Investíciách. Oficiálny postup: https://code.claude.com/docs/en/cloud-environments#network-access

## Postup krok za krokom

1. Otvor session v Claude (web alebo appka).
2. V **nadpise session** (hore) ťukni na **menu cloudového prostredia** (názov prostredia).
3. Zvoľ **Edit** (Upraviť prostredie).
4. Nájdi časť **Network access** (Prístup do siete).
5. Zvoľ úroveň **Limited** (alebo **Custom**, ak appka ešte nie je aktualizovaná).
6. Do poľa **Allowed domains** pridaj doménu, každú na samostatný riadok:
   - `subjekty.nbs.sk`
   - `nbs.sk` (ak sa údaje sťahujú aj z hlavného webu NBS)
7. Políčko **Allow package managers** (pri Custom: zahrnúť predvolený zoznam správcov balíkov) **nechaj zaškrtnuté**, inak prestane fungovať `npm`.
8. **Ulož** (Save).
9. Začni **novú session** v tomto prostredí. Nastavenie siete platí od štartu session; bežiaca session ho nemusí prevziať (predpoklad).
10. V novej session napíš Claudovi, že doména je povolená; overí ju (`curl` na adresu).

## Poznámky

- Povoľuj len domény, ktoré práca potrebuje. Appka sama na tieto adresy nikdy nevolá (D-009); prístup slúži len vývoju (stiahnuť verejný zoznam a pribaliť ho do appky).
- Širšia úroveň prístupu (bez obmedzenia) funguje tiež, ale otvára prostredie všetkým adresám; odporúčam Limited so zoznamom domén.
- Zoznam povolených domén nepatrí do appky ani do zálohy; je to nastavenie prostredia.
