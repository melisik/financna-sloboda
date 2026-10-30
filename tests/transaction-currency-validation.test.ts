import { describe, expect, it } from "vitest";
import { validateTransaction } from "../src/storage/validate";

const TODAY = "2026-10-29";

const transaction = (extra: Record<string, unknown> = {}) => ({
  id: "currency-test",
  date: TODAY,
  type: "vydavok",
  amountCents: 1000,
  source: "z_hotovosti",
  createdAt: `${TODAY}T10:00:00Z`,
  updatedAt: `${TODAY}T10:00:00Z`,
  ...extra,
});

describe("D-340: validácia menových údajov transakcie", () => {
  it("akceptuje starú transakciu bez menových polí", () => {
    expect(validateTransaction(transaction(), TODAY)).toEqual([]);
  });

  it("akceptuje platné menové údaje", () => {
    expect(validateTransaction(transaction({
      currency: "USD",
      exchangeRateToBase: 1.08,
      originalAmountCents: 10000,
    }), TODAY)).toEqual([]);
  });

  it("odmieta nesprávny formát meny", () => {
    expect(validateTransaction(transaction({ currency: "usd" }), TODAY).join(" "))
      .toContain("currency");
  });

  it("odmieta kurz bez meny", () => {
    expect(validateTransaction(transaction({ exchangeRateToBase: 1.08 }), TODAY).join(" "))
      .toContain("requires currency");
  });

  it("odmieta nulový a nekonečný kurz", () => {
    expect(validateTransaction(transaction({ currency: "USD", exchangeRateToBase: 0 }), TODAY).join(" "))
      .toContain("exchangeRateToBase");
    expect(validateTransaction(transaction({ currency: "USD", exchangeRateToBase: Infinity }), TODAY).join(" "))
      .toContain("exchangeRateToBase");
  });

  it("odmieta pôvodnú sumu bez meny a necelú sumu v centoch", () => {
    expect(validateTransaction(transaction({ originalAmountCents: 1000 }), TODAY).join(" "))
      .toContain("requires currency");
    expect(validateTransaction(transaction({ currency: "USD", originalAmountCents: 1.5 }), TODAY).join(" "))
      .toContain("originalAmountCents");
  });
  it("akceptuje EUR s explicitnou menou, kurzom 1 a pôvodnou sumou", () => {
    expect(validateTransaction(transaction({
      currency: "EUR",
      exchangeRateToBase: 1,
      originalAmountCents: 1000,
    }), TODAY)).toEqual([]);
  });

  it("odmieta cudziu menu bez kurzu", () => {
    expect(validateTransaction(transaction({
      currency: "USD",
      originalAmountCents: 10000,
    }), TODAY).join(" ")).toContain("exchangeRateToBase");
  });

  it("odmieta cudziu menu bez pôvodnej sumy", () => {
    expect(validateTransaction(transaction({
      currency: "USD",
      exchangeRateToBase: 1.08,
    }), TODAY).join(" ")).toContain("originalAmountCents");
  });

  it("odmieta neplatnú pôvodnú sumu", () => {
    expect(validateTransaction(transaction({
      currency: "USD",
      exchangeRateToBase: 1.08,
      originalAmountCents: -100,
    }), TODAY).join(" ")).toContain("originalAmountCents");
  });
});
