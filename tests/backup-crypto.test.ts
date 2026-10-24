import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, decryptBackup, encryptBackup, isEncryptedBackup } from "../src/storage/backupCrypto";

// Šifrovaná záloha (N-05, D-276). Syntetické hodnoty. Produkcia používa 600 000 iterácií.
const PLAIN = JSON.stringify({ app: "financna-sloboda", transactions: [{ id: "t1", note: "syntetická poznámka" }] });
const FAST = 100_000; // najnižšia povolená hodnota, aby testy ostali rýchle

describe("šifrovaná záloha (N-05, D-276)", () => {
  it("zašifrovanú zálohu obnoví správne heslo", async () => {
    const env = await encryptBackup(PLAIN, "heslo-na-test", FAST);
    expect(await decryptBackup(env, "heslo-na-test")).toBe(PLAIN);
  });

  it("v zašifrovanom súbore nie sú dáta čitateľné", async () => {
    const env = await encryptBackup(PLAIN, "heslo-na-test", FAST);
    const text = JSON.stringify(env);
    expect(text).not.toContain("syntetická poznámka");
    expect(text).not.toContain("transactions");
  });

  it("zlé heslo sa odmietne a nevráti dáta", async () => {
    const env = await encryptBackup(PLAIN, "heslo-na-test", FAST);
    await expect(decryptBackup(env, "iné-heslo-999")).rejects.toThrow();
  });

  it("upravený šifrovaný súbor sa odmietne", async () => {
    const env = await encryptBackup(PLAIN, "heslo-na-test", FAST);
    const tampered = { ...env, data: env.data.slice(0, -8) + "AAAAAAAA" };
    await expect(decryptBackup(tampered, "heslo-na-test")).rejects.toThrow();
  });

  it("heslo kratšie než minimum sa nepoužije na šifrovanie", async () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    await expect(encryptBackup(PLAIN, "kratke", FAST)).rejects.toThrow();
  });

  it("rozpozná šifrovanú zálohu a odlíši ju od bežnej", async () => {
    const env = await encryptBackup(PLAIN, "heslo-na-test", FAST);
    expect(isEncryptedBackup(env)).toBe(true);
    expect(isEncryptedBackup(JSON.parse(PLAIN))).toBe(false);
    expect(isEncryptedBackup(null)).toBe(false);
  });

  it("nevhodný počet iterácií v súbore sa odmietne skôr než sa odvodí kľúč", async () => {
    const env = await encryptBackup(PLAIN, "heslo-na-test", FAST);
    await expect(decryptBackup({ ...env, iterations: 1 }, "heslo-na-test")).rejects.toThrow();
  });

  it("predvolený počet iterácií je aspoň 600 000", async () => {
    const env = await encryptBackup(PLAIN, "heslo-na-test");
    expect(env.iterations).toBeGreaterThanOrEqual(600_000);
  });
});
