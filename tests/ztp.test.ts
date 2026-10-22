import { describe, expect, it } from "vitest";
import { createZtpModel } from "../src/domain/ztp";

// Model ZŤP je zatiaľ prázdny objekt (box) bez náplne (D-161).
describe("model ZŤP (placeholder)", () => {
  it("vytvorí prázdny objekt s príznakom placeholder", () => {
    expect(createZtpModel()).toEqual({ placeholder: true });
  });
});
