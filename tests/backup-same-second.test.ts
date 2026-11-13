import { describe, expect, it } from "vitest";

describe("Export v rovnakom čase — zhoda sekúnd", () => {
  it("ak je čas v rovnakej sekunde, filename by bol totožný bez UUID", () => {
    // Scenár: dva exporty v rovnakom čase (napr. oba v 13:11:02)
    const now1 = new Date(2026, 10, 8, 13, 11, 2, 100); // 13:11:02.100
    const now2 = new Date(2026, 10, 8, 13, 11, 2, 500); // 13:11:02.500

    const generateFilename = (now: Date) => {
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
      return `compaven-backup-${dateStr}_${timeStr}.json`;
    };

    const filename1 = generateFilename(now1);
    const filename2 = generateFilename(now2);

    // Oba exporty v rovnakej sekunde budú mať rovnaký filename
    expect(filename1).toBe("compaven-backup-2026-11-08_13-11-02.json");
    expect(filename2).toBe("compaven-backup-2026-11-08_13-11-02.json");
    expect(filename1).toBe(filename2);

    // POZNÁMKA: V aplikácii by sa starší súbor prepísal!
    // Riešenie: Prehliadač automaticky pridáva suffix (_1, _2, atď.)
    // Alebo: Browser API (`download` atribút) automaticky premenúva duplicitné súbory
    // Alebo: Aplikácia by mohla meniť sekúndy na milisekundy
  });

  it("ak je čas v inej sekunde, filename je odlišný", () => {
    const now1 = new Date(2026, 10, 8, 13, 11, 1);
    const now2 = new Date(2026, 10, 8, 13, 11, 2);

    const generateFilename = (now: Date) => {
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
      return `compaven-backup-${dateStr}_${timeStr}.json`;
    };

    const filename1 = generateFilename(now1);
    const filename2 = generateFilename(now2);

    expect(filename1).toBe("compaven-backup-2026-11-08_13-11-01.json");
    expect(filename2).toBe("compaven-backup-2026-11-08_13-11-02.json");
    expect(filename1).not.toBe(filename2);
  });

  it("milisekundy a mikrosekundy sú ignorované — presnosť je len na sekundu", () => {
    // Dve časové značky v rovnakej sekunde, ale rôzne milisekundy
    const timestamps = [
      new Date(2026, 10, 8, 13, 11, 2, 0),    // .000 ms
      new Date(2026, 10, 8, 13, 11, 2, 999),  // .999 ms
    ];

    const filenames = timestamps.map((ts) => {
      const dateStr = ts.toISOString().split("T")[0];
      const timeStr = `${String(ts.getHours()).padStart(2, "0")}-${String(ts.getMinutes()).padStart(2, "0")}-${String(ts.getSeconds()).padStart(2, "0")}`;
      return `compaven-backup-${dateStr}_${timeStr}.json`;
    });

    // Obe majú rovnaký filename — iba sekundy sa rozlíšujú
    expect(filenames[0]).toBe("compaven-backup-2026-11-08_13-11-02.json");
    expect(filenames[1]).toBe("compaven-backup-2026-11-08_13-11-02.json");
  });
});
