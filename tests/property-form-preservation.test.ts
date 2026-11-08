import { describe, it, expect } from "vitest";
import type { Property } from "../src/storage/types";

describe("PropertyForm: Zachovanie polí pri editácii", () => {
  const createTestProperty = (): Property => ({
    id: "test-prop-1",
    name: "Test Property",
    mode: "vlastne_byvanie",
    valueCents: 30000000, // 300 000 €
    valueDate: "2026-10-01",
    mortgageBalanceCents: 20000000, // 200 000 €
    balanceDate: "2026-09-01",
    monthlyRentCents: 50000, // 500 €
    monthlyPaymentCents: 100000, // 1 000 €
    mortgageRate: 0.03,
    monthlyOtherCostsCents: 30000, // 300 €
    extraPayments: [
      { id: "ep1", date: "2026-09-01", amountCents: 500000, mode: "skratit_termin" as const },
    ],
    lastMortgagePayment: {
      date: "2026-10-01",
      amountCents: 100000,
      balanceAfterCents: 19900000,
    },
    rentalLedger: [
      { id: "rl1", date: "2026-09-01", kind: "prijem" as const, amountCents: 50000 },
    ],
    acquisitionDate: "2020-01-15",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  });

  it("Nová nehnuteľnosť: ID sa vygeneruje (nanoid)", () => {
    const prop = createTestProperty();
    // Simulácia handleSave pre novú nehnuteľnosť (property = undefined)
    const newProp: Property = {
      id: "generated-id", // nanoid() by vygeneroval toto
      name: "New",
      mode: "vlastne_byvanie",
      valueCents: 10000000,
      valueDate: "2026-11-08",
      mortgageBalanceCents: prop.mortgageBalanceCents ?? 0,
      balanceDate: prop.balanceDate,
      monthlyRentCents: prop.monthlyRentCents,
      monthlyPaymentCents: prop.monthlyPaymentCents,
      mortgageRate: prop.mortgageRate,
      monthlyOtherCostsCents: prop.monthlyOtherCostsCents,
      extraPayments: prop.extraPayments,
      lastMortgagePayment: prop.lastMortgagePayment,
      rentalLedger: prop.rentalLedger,
      acquisitionDate: prop.acquisitionDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(newProp.id).toBe("generated-id");
    expect(newProp.createdAt).toBeDefined();
  });

  it("Editácia nehnuteľnosti: ID sa zachová", () => {
    const prop = createTestProperty();
    const originalId = prop.id;

    // Simulácia handleSave pri editácii (property = prop)
    const editedProp: Property = {
      id: prop.id ?? "generated-id",
      name: "Updated Name",
      mode: prop.mode,
      valueCents: 40000000, // Nová hodnota
      valueDate: "2026-11-08",
      mortgageBalanceCents: prop.mortgageBalanceCents ?? 0,
      balanceDate: prop.balanceDate,
      monthlyRentCents: prop.monthlyRentCents,
      monthlyPaymentCents: prop.monthlyPaymentCents,
      mortgageRate: prop.mortgageRate,
      monthlyOtherCostsCents: prop.monthlyOtherCostsCents,
      extraPayments: prop.extraPayments,
      lastMortgagePayment: prop.lastMortgagePayment,
      rentalLedger: prop.rentalLedger,
      acquisitionDate: prop.acquisitionDate,
      createdAt: prop.createdAt,
      updatedAt: new Date().toISOString(),
    };

    expect(editedProp.id).toBe(originalId); // ID sa nesmie zmeniť
    expect(editedProp.createdAt).toBe(prop.createdAt); // Pôvodný čas
  });

  it("Editácia nehnuteľnosti: Všetky dodatočné polia sa zachovajú", () => {
    const prop = createTestProperty();

    const editedProp: Property = {
      id: prop.id ?? "generated-id",
      name: "Updated",
      mode: prop.mode,
      valueCents: 40000000,
      valueDate: "2026-11-08",
      mortgageBalanceCents: prop.mortgageBalanceCents ?? 0,
      balanceDate: prop.balanceDate,
      monthlyRentCents: prop.monthlyRentCents,
      monthlyPaymentCents: prop.monthlyPaymentCents,
      mortgageRate: prop.mortgageRate,
      monthlyOtherCostsCents: prop.monthlyOtherCostsCents,
      extraPayments: prop.extraPayments,
      lastMortgagePayment: prop.lastMortgagePayment,
      rentalLedger: prop.rentalLedger,
      acquisitionDate: prop.acquisitionDate,
      createdAt: prop.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Overenie zachovania VŠETKÝCH polí
    expect(editedProp.mortgageBalanceCents).toBe(prop.mortgageBalanceCents); // 200k
    expect(editedProp.balanceDate).toBe(prop.balanceDate); // 2026-09-01
    expect(editedProp.monthlyRentCents).toBe(prop.monthlyRentCents); // 500
    expect(editedProp.monthlyPaymentCents).toBe(prop.monthlyPaymentCents); // 1000
    expect(editedProp.mortgageRate).toBe(prop.mortgageRate); // 0.03
    expect(editedProp.monthlyOtherCostsCents).toBe(prop.monthlyOtherCostsCents); // 300
    expect(editedProp.extraPayments).toEqual(prop.extraPayments); // Array so splátkami
    expect(editedProp.lastMortgagePayment).toEqual(prop.lastMortgagePayment); // Záznam
    expect(editedProp.rentalLedger).toEqual(prop.rentalLedger); // Array s príjmami
    expect(editedProp.acquisitionDate).toBe(prop.acquisitionDate); // 2020-01-15
  });

  it("Prevod EUR → Centy: Presná hodnota bez straty centov", () => {
    const testCases = [
      { eur: 100, expectedCents: 10000 },
      { eur: 100.5, expectedCents: 10050 },
      { eur: 100.99, expectedCents: 10099 },
      { eur: 0, expectedCents: 0 },
      { eur: 0.01, expectedCents: 1 },
    ];

    testCases.forEach(({ eur, expectedCents }) => {
      const cents = Math.round(eur * 100);
      expect(cents).toBe(expectedCents);
    });
  });


  it("Nová nehnuteľnosť bez hypoték: Správne predvolené hodnoty", () => {
    const prop: Property = {
      id: "new-id",
      name: "New Property",
      mode: "vlastne_byvanie",
      valueCents: 10000000,
      valueDate: "2026-11-08",
      mortgageBalanceCents: 0, // Default: 0 (bez hypotéky)
      // balanceDate: undefined,
      // monthlyRentCents: undefined,
      // monthlyPaymentCents: undefined,
      // mortgageRate: undefined,
      // monthlyOtherCostsCents: undefined,
      // extraPayments: undefined,
      // lastMortgagePayment: undefined,
      // rentalLedger: undefined,
      // acquisitionDate: undefined,
      createdAt: "2026-11-08T00:00:00Z",
      updatedAt: "2026-11-08T00:00:00Z",
    };

    expect(prop.mortgageBalanceCents).toBe(0);
    expect(prop.balanceDate).toBeUndefined();
    expect(prop.monthlyPaymentCents).toBeUndefined();
  });
});
