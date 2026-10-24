import { hintStyle } from "../../ui/kit/controls";
/** Návod na používanie a odkaz na testovaciu zálohu (docs/23: časť prehľadu, D-190). Statický text bez údajov. */
export function NavodBlock() {
  return (
    <details id="navod" style={{ marginTop: 16, background: "var(--surface)", padding: 12, borderRadius: 8 }}>
      <summary style={{ fontWeight: 600, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Návod</summary>
      <ol style={{ paddingLeft: 20 }}>
        <li><strong>Prvé nastavenie:</strong> pri prvom spustení zadaj ročné výdavky a mieru výberu. Ostatné polia majú východiskové hodnoty.</li>
        <li><strong>Vyhodnotenie:</strong> mesačné vyhodnotenie vzniká automaticky. Ručne ho zadáš len na opravu. Dátum cieľa sa mení len po vyhodnotení.</li>
        <li><strong>Rozpočet:</strong> limity na kategórie sú mesačný plán. Prehľad ukáže plnenie a rozpis na nevyhnutné a nie nevyhnutné výdavky.</li>
        <li><strong>Transakcie:</strong> zapisuj sporenie, investície a výdavky. Výdavok nad prah sa zvýrazní.</li>
        <li><strong>Záloha:</strong> pravidelne exportuj zálohu. Dáta sú len v tomto zariadení; neukladaj ju do verejných priečinkov.</li>
        <li><strong>Obnova:</strong> import nahradí všetky dáta a vyžaduje potvrdenie.</li>
      </ol>
      <p>
        <strong>Ako testovať:</strong> stiahnite testovaciu zálohu nižšie a importujte ju v sekcii <a href="#zaloha">Záloha</a>. Skúste pridať výdavok s kategóriou, zadať vyhodnotenie, exportovať zálohu a znova ju importovať. Pripomienky pošlite autorovi spôsobom, ktorý ste dostali.
      </p>
      <p style={hintStyle}>
        Výpočty sú odhady podľa zadaných predpokladov, nie finančné poradenstvo.
        Testovacie dáta (syntetické): <a href="./testovacia-zaloha.json" download>stiahnuť testovaciu zálohu</a>, potom ju importuj v sekcii <a href="#zaloha">Záloha</a>.
      </p>
    </details>
  );
}
