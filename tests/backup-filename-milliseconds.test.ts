import { describe, expect, it } from "vitest";

describe("Formát názvu záloh s milisekundami", () => {
  it("generuje filename s datumom, časom a milisekundami: YYYY-MM-DD_HH-mm-ss-SSS", () => {
    const now = new Date(2026, 10, 8, 13, 11, 2, 347); // Nov 8, 2026, 13:11:02.347
    const dateStr = now.toISOString().split("T")[0]; // "2026-11-08"
    const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}-${String(now.getMilliseconds()).padStart(3, "0")}`;
    const filename = `compaven-backup-${dateStr}_${timeStr}.json`;

    expect(filename).toBe("compaven-backup-2026-11-08_13-11-02-347.json");
    expect(filename).toMatch(/^compaven-backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}\.json$/);
  });

  it("milisekundy sú vzdy 3 cifry s leading zeros", () => {
    const testCases = [
      [0, "compaven-backup-2026-11-08_13-11-02-000.json"],
      [1, "compaven-backup-2026-11-08_13-11-02-001.json"],
      [10, "compaven-backup-2026-11-08_13-11-02-010.json"],
      [100, "compaven-backup-2026-11-08_13-11-02-100.json"],
      [999, "compaven-backup-2026-11-08_13-11-02-999.json"],
    ];

    testCases.forEach(([ms, expected]) => {
      const now = new Date(2026, 10, 8, 13, 11, 2, ms as number);
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}-${String(now.getMilliseconds()).padStart(3, "0")}`;
      const filename = `compaven-backup-${dateStr}_${timeStr}.json`;

      expect(filename).toBe(expected as string);
    });
  });

  it("rôzne milisekundy v rovnakej sekunde majú rôzne filenames", () => {
    const times = [
      new Date(2026, 10, 8, 13, 11, 2, 100),
      new Date(2026, 10, 8, 13, 11, 2, 200),
      new Date(2026, 10, 8, 13, 11, 2, 300),
    ];

    const filenames = times.map((now) => {
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}-${String(now.getMilliseconds()).padStart(3, "0")}`;
      return `compaven-backup-${dateStr}_${timeStr}.json`;
    });

    expect(filenames[0]).toBe("compaven-backup-2026-11-08_13-11-02-100.json");
    expect(filenames[1]).toBe("compaven-backup-2026-11-08_13-11-02-200.json");
    expect(filenames[2]).toBe("compaven-backup-2026-11-08_13-11-02-300.json");

    // Všetky sú unikátne
    const uniqueNames = new Set(filenames);
    expect(uniqueNames.size).toBe(filenames.length);
  });

  it("timestamps s rôznymi milisekundami sú unikátne", () => {
    const timestamps = [
      new Date(2026, 10, 8, 8, 0, 0, 0),
      new Date(2026, 10, 8, 8, 0, 0, 999),
      new Date(2026, 10, 8, 10, 30, 15, 500),
      new Date(2026, 10, 8, 14, 45, 59, 1),
      new Date(2026, 10, 8, 23, 59, 59, 999),
    ];

    const filenames = timestamps.map((ts) => {
      const dateStr = ts.toISOString().split("T")[0];
      const timeStr = `${String(ts.getHours()).padStart(2, "0")}-${String(ts.getMinutes()).padStart(2, "0")}-${String(ts.getSeconds()).padStart(2, "0")}-${String(ts.getMilliseconds()).padStart(3, "0")}`;
      return `compaven-backup-${dateStr}_${timeStr}.json`;
    });

    expect(filenames[0]).toBe("compaven-backup-2026-11-08_08-00-00-000.json");
    expect(filenames[1]).toBe("compaven-backup-2026-11-08_08-00-00-999.json");
    expect(filenames[2]).toBe("compaven-backup-2026-11-08_10-30-15-500.json");
    expect(filenames[3]).toBe("compaven-backup-2026-11-08_14-45-59-001.json");
    expect(filenames[4]).toBe("compaven-backup-2026-11-08_23-59-59-999.json");

    // Všetky sú unikátne
    const uniqueNames = new Set(filenames);
    expect(uniqueNames.size).toBe(filenames.length);
  });
});
