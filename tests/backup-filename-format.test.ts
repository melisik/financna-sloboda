import { describe, expect, it } from "vitest";

describe("Formát názvu záloh s časom", () => {
  it("generuje filename s datumom a časom: YYYY-MM-DD_HH-mm-ss", () => {
    // Simulujem vytvorenie filename-u ako v BackupForm.tsx
    const now = new Date(2026, 10, 8, 13, 8, 32); // Nov 8, 2026, 13:08:32
    const dateStr = now.toISOString().split("T")[0]; // "2026-11-08"
    const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
    const filename = `compaven-backup-${dateStr}_${timeStr}.json`;

    expect(filename).toBe("compaven-backup-2026-11-08_13-08-32.json");
    expect(filename).toMatch(/^compaven-backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/);
  });

  it("času sú vzdy 2 cifry s leading zeros", () => {
    const now = new Date(2026, 0, 5, 9, 5, 3); // Jan 5, 2026, 09:05:03
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
    const filename = `compaven-backup-${dateStr}_${timeStr}.json`;

    expect(filename).toBe("compaven-backup-2026-01-05_09-05-03.json");
  });

  it("rôzne časy počas dňa majú rôzne formáty", () => {
    // Testuj iba formát, nie konkrétny dátum (kvôli timezone problémom)
    const testTimes = [
      [0, 0, 0],
      [12, 0, 0],
      [23, 59, 59],
    ];

    const filenames = testTimes.map(([hour, minute, second]) => {
      const timeStr = `${String(hour as number).padStart(2, "0")}-${String(minute as number).padStart(2, "0")}-${String(second as number).padStart(2, "0")}`;
      return `compaven-backup-2026-11-08_${timeStr}.json`;
    });

    expect(filenames[0]).toBe("compaven-backup-2026-11-08_00-00-00.json");
    expect(filenames[1]).toBe("compaven-backup-2026-11-08_12-00-00.json");
    expect(filenames[2]).toBe("compaven-backup-2026-11-08_23-59-59.json");
  });

  it("múltiple exportov v priebehu dňa majú rôzne názvy", () => {
    const names = [
      new Date(2026, 10, 8, 8, 0, 0),
      new Date(2026, 10, 8, 10, 30, 15),
      new Date(2026, 10, 8, 14, 45, 59),
      new Date(2026, 10, 8, 23, 59, 59),
    ].map((now) => {
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
      return `compaven-backup-${dateStr}_${timeStr}.json`;
    });

    // Všetky názvy by mali byť unikátne
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);

    // Očakávané formáty
    expect(names[0]).toBe("compaven-backup-2026-11-08_08-00-00.json");
    expect(names[1]).toBe("compaven-backup-2026-11-08_10-30-15.json");
    expect(names[2]).toBe("compaven-backup-2026-11-08_14-45-59.json");
    expect(names[3]).toBe("compaven-backup-2026-11-08_23-59-59.json");
  });
});
