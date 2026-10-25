import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TRIAL_COLLAPSED_KEY, TRIAL_DETAILS, TRIAL_SUMMARY } from "../src/ui/trialNotice";

// Revízia 2026-10-25 (b), N-3: zmena textu pruhu bez novej verzie kľúča by sa na zbalenom pruhu neukázala.
// Pri zmene textu zvýš verziu v TRIAL_COLLAPSED_KEY a sem dopíš nový odtlačok.
const FINGERPRINTS: Record<string, string> = {
  "fs-trial-note-collapsed-v1": "fd184e0918eeeb81",
};

describe("verzia kľúča pruhu Skúšobná verzia", () => {
  it("text pruhu zodpovedá verzii kľúča", () => {
    const hash = createHash("sha256").update(`${TRIAL_SUMMARY}\n${TRIAL_DETAILS}`).digest("hex").slice(0, 16);
    expect(hash, `Text pruhu sa zmenil: zvýš verziu ${TRIAL_COLLAPSED_KEY} a doplň odtlačok`).toBe(FINGERPRINTS[TRIAL_COLLAPSED_KEY]);
  });
});
