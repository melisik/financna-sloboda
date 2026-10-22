import { describe, expect, it } from "vitest";
import { parseLvText } from "../src/domain/listVlastnictva";

// Predvyplnenie z listu vlastníctva (D-209). Syntetický text, žiadne reálne údaje.
const DOM = `LIST VLASTNÍCTVA (syntetický vzor)
Okres: Testovací okres
Obec: Testovacia obec
Katastrálne územie: Testovo
A. Parcely
Parc. č. 123/4 zastavaná plocha a nádvorie, výmera 250 m2
B. Stavby
Súpisné číslo 55, rodinný dom na parcele 123/4
C. Vlastníci
Vlastník: Vzorový Vlastník, bytom Testovacia 1
`;

const BYT = `Obec: Iná obec
Katastrálne územie: Iné
Parc. č. 9
Byt č. 12, súpisné číslo 7
Záložné právo v prospech banky, zmluva č. 555
Vlastník: Vzorová Vlastníčka
`;

describe("predvyplnenie z listu vlastníctva (D-209)", () => {
  it("nájde údaje pre daň z domu", () => {
    const f = parseLvText(DOM);
    expect(f.taxMunicipality).toBe("Testovacia obec");
    expect(f.cadastralArea).toBe("Testovo");
    expect(f.parcelNumber).toBe("123/4");
    expect(f.buildingNumber).toBe("55");
    expect(f.flatNumber).toBeUndefined();
    expect(f.taxObjectKind).toBe("dom");
    expect(f.hasPledge).toBe(false);
  });

  it("byt sa pozná podľa čísla bytu a záložné právo sa len označí", () => {
    const f = parseLvText(BYT);
    expect(f.flatNumber).toBe("12");
    expect(f.taxObjectKind).toBe("byt");
    expect(f.parcelNumber).toBe("9");
    expect(f.hasPledge).toBe(true);
  });

  it("vlastníkov ani číslo LV do výsledku nedáva", () => {
    const f = parseLvText(DOM);
    expect(JSON.stringify(f)).not.toContain("Vzorový");
    expect(Object.keys(f)).not.toContain("owners");
  });

  it("text bez údajov nevráti nič", () => {
    const f = parseLvText("nič zaujímavé tu nie je");
    expect(f.found).toEqual([]);
    expect(f.hasPledge).toBe(false);
  });

  it("hodnoty obce a k. ú. bez kódu a časových údajov z hlavičky", () => {
    const f = parseLvText("Obec: 123456 Testovacia obec Čas vyhotovenia : 10:00:00\nKatastrálne územie: 654321 Testovo Údaje platné k : 21.10.2026 18:00:00\n");
    expect(f.taxMunicipality).toBe("Testovacia obec");
    expect(f.cadastralArea).toBe("Testovo");
  });

  it("zoberie všetky parcely bez duplicít", () => {
    const f = parseLvText("Parcela č. 111/1 zastavaná plocha\nParcela č. 111/2 záhrada\nParcela č. 111/1 (opakovaný výpis)\n");
    expect(f.parcelNumber).toBe("111/1, 111/2");
  });

  it("súpisné číslo v rôznych tvaroch", () => {
    expect(parseLvText("Súp. č. 56, rodinný dom").buildingNumber).toBe("56");
    expect(parseLvText("stavba so súpisným číslom 57").buildingNumber).toBe("57");
    expect(parseLvText("Súpisné číslo budovy 58").buildingNumber).toBe("58");
  });
});
