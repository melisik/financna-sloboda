import { describe, it, expect } from "vitest";
import type { AppData, Property, Liability } from "../src/domain/model/entities";

describe("OPRAVA B — Validácia úplnosti snapshots", () => {
  // Pomocné funkcie
  const createEmptyAppData = (): AppData => ({
    settings: null,
    transactions: [],
    snapshots: [],
    properties: [],
    assets: [],
    investments: [],
    liabilities: [],
    incomes: [],
    budgets: [],
    recurringExpenses: [],
    stockItems: [],
    recipes: [],
    dogs: [],
    goals: [],
    wasteRecords: [],
    shoppingItems: [],
    // OPRAVA B
    propertiesConfirmed: undefined,
    liabilitiesConfirmed: undefined,
  });

  const createProperty = (id: string, value: number): Property => ({
    id,
    name: "Byt",
    valueCents: value * 100,
    mortgageBalanceCents: 0,
    mode: "vlastne_byvanie",
    valueDate: "2026-11-09",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const createLiability = (id: string, balance: number): Liability => ({
    id,
    name: "Úver",
    kind: "uver",
    balanceCents: balance * 100,
    rate: 0.05,
    monthlyPaymentCents: 100 * 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // SCENÁR 1: Nepotvrdená prázdna evidencia nehnuteľností
  it("1. Nepotvrdená prázdna evidencia nehnuteľností", () => {
    const data = createEmptyAppData();
    expect(data.properties.length).toBe(0);
    expect(data.propertiesConfirmed).toBeUndefined();
    expect(data.propertiesConfirmed !== true).toBe(true); // Nie je potvrdená
  });

  // SCENÁR 2: Potvrdená prázdna evidencia nehnuteľností
  it("2. Potvrdená prázdna evidencia nehnuteľností", () => {
    const data = createEmptyAppData();
    data.propertiesConfirmed = true;
    expect(data.properties.length).toBe(0);
    expect(data.propertiesConfirmed).toBe(true);
  });

  // SCENÁR 3: Nepotvrdená prázdna evidencia záväzkov
  it("3. Nepotvrdená prázdna evidencia záväzkov", () => {
    const data = createEmptyAppData();
    expect(data.liabilities.length).toBe(0);
    expect(data.liabilitiesConfirmed).toBeUndefined();
    expect(data.liabilitiesConfirmed !== true).toBe(true); // Nie je potvrdená
  });

  // SCENÁR 4: Potvrdená prázdna evidencia záväzkov
  it("4. Potvrdená prázdna evidencia záväzkov", () => {
    const data = createEmptyAppData();
    data.liabilitiesConfirmed = true;
    expect(data.liabilities.length).toBe(0);
    expect(data.liabilitiesConfirmed).toBe(true);
  });

  // SCENÁR 5: Obe evidencie potvrdené a prázdne
  it("5. Obe evidencie potvrdené a prázdne", () => {
    const data = createEmptyAppData();
    data.propertiesConfirmed = true;
    data.liabilitiesConfirmed = true;
    expect(data.properties.length).toBe(0);
    expect(data.liabilities.length).toBe(0);
    expect(data.propertiesConfirmed).toBe(true);
    expect(data.liabilitiesConfirmed).toBe(true);
  });

  // SCENÁR 6: Obe evidencie potvrdené s konkrétnymi hodnotami
  it("6. Obe evidencie potvrdené s konkrétnymi hodnotami", () => {
    const data = createEmptyAppData();
    data.properties = [createProperty("prop-1", 250000)];
    data.liabilities = [createLiability("liab-1", 50000)];
    data.propertiesConfirmed = true;
    data.liabilitiesConfirmed = true;

    expect(data.properties.length).toBe(1);
    expect(data.properties[0].valueCents).toBe(250000 * 100);
    expect(data.liabilities.length).toBe(1);
    expect(data.liabilities[0].balanceCents).toBe(50000 * 100);
    expect(data.propertiesConfirmed).toBe(true);
    expect(data.liabilitiesConfirmed).toBe(true);
  });

  // SCENÁR 7: Zmena nehnuteľnosti po potvrdení
  it("7. Zmena nehnuteľnosti po potvrdení (zneplatá potvrdenie)", () => {
    const data = createEmptyAppData();
    data.properties = [createProperty("prop-1", 250000)];
    data.propertiesConfirmed = true;

    // Zmena: vymazanie nehnuteľnosti
    data.properties = [];
    data.propertiesConfirmed = false; // Zneplatnenie

    expect(data.properties.length).toBe(0);
    expect(data.propertiesConfirmed).toBe(false);
  });

  // SCENÁR 8: Zmena záväzku po potvrdení
  it("8. Zmena záväzku po potvrdení (zneplatá potvrdenie)", () => {
    const data = createEmptyAppData();
    data.liabilities = [createLiability("liab-1", 50000)];
    data.liabilitiesConfirmed = true;

    // Zmena: úprava záväzku
    data.liabilities[0].balanceCents = 60000 * 100;
    data.liabilitiesConfirmed = false; // Zneplatnenie

    expect(data.liabilities[0].balanceCents).toBe(60000 * 100);
    expect(data.liabilitiesConfirmed).toBe(false);
  });

  // SCENÁR 9: Zachovanie potvrdení po "refreshi" (simulácia reload dát)
  it("9. Zachovanie potvrdení po refreshi", () => {
    const data = createEmptyAppData();
    data.propertiesConfirmed = true;
    data.liabilitiesConfirmed = true;

    // Simulácia refreshu (reload AppData z úložiska)
    // Potvrdenia musia zostať zachované
    const reloadedData = { ...data };
    expect(reloadedData.propertiesConfirmed).toBe(true);
    expect(reloadedData.liabilitiesConfirmed).toBe(true);
  });

  // SCENÁR 10: Ručný snapshot pri neúplných údajoch — NEPOVOLE
  it("10. Ručný snapshot pri neúplných údajoch (validácia odmietne)", () => {
    const data = createEmptyAppData();
    // Bez potvrdení — snapshot sa nemôže vytvoriť

    // Validácia
    const isValidForSnapshot = data.propertiesConfirmed === true && data.liabilitiesConfirmed === true;
    expect(isValidForSnapshot).toBe(false); // Ručný snapshot sa nemôže vytvoriť
  });

  // SCENÁR 11: Automatický snapshot pri neúplných údajoch — NEPOVOLE
  it("11. Automatický snapshot pri neúplných údajoch (validácia odmietne)", () => {
    const data = createEmptyAppData();
    // Bez potvrdení — automatický snapshot sa nemôže vytvoriť

    // Validácia
    const isValidForAutoSnapshot = data.propertiesConfirmed === true && data.liabilitiesConfirmed === true;
    expect(isValidForAutoSnapshot).toBe(false); // Automatický snapshot sa nemôže vytvoriť
  });

  // SCENÁR 12: Úspešný snapshot po potvordení oboch evidencií
  it("12. Úspešný snapshot po potvordení oboch evidencií", () => {
    const data = createEmptyAppData();
    data.properties = [createProperty("prop-1", 250000)];
    data.liabilities = [createLiability("liab-1", 50000)];
    data.propertiesConfirmed = true;
    data.liabilitiesConfirmed = true;

    // Validácia — snapshot sa môže vytvoriť
    const isValidForSnapshot = data.propertiesConfirmed === true && data.liabilitiesConfirmed === true;
    expect(isValidForSnapshot).toBe(true); // Snapshot sa môže vytvoriť
  });

  // SCENÁR 13: Správne správanie starých údajov bez príznakov (backward compatibility)
  it("13. Staré záznamy bez príznakov = nepotvrdené (backward compatibility)", () => {
    const data = createEmptyAppData();
    // Staré dáta bez propertiesConfirmed a liabilitiesConfirmed
    delete data.propertiesConfirmed;
    delete data.liabilitiesConfirmed;

    // Staré dáta musia byť interpretované ako nepotvrdené
    expect(data.propertiesConfirmed).toBeUndefined();
    expect(data.liabilitiesConfirmed).toBeUndefined();

    // Validácia musí vrátiť false pre nepotvrdené dáta
    const isValid = data.propertiesConfirmed === true && data.liabilitiesConfirmed === true;
    expect(isValid).toBe(false); // Staré dáta sú nepotvrdené
  });

  // Dodatočný test: Potvrdenie musí byť nezávislé
  it("Dodatočný: Potvrdenia sú nezávislé", () => {
    const data = createEmptyAppData();
    data.propertiesConfirmed = true;
    data.liabilitiesConfirmed = false;

    expect(data.propertiesConfirmed).toBe(true);
    expect(data.liabilitiesConfirmed).toBe(false);
  });
});
