import { afterEach, describe, expect, it, vi } from "vitest";
import { validateEnvironmentConsistency } from "../src/config/environment";
import { renderFatalError } from "../src/compaven-ui/renderFatalError";

// F-06: hodnota parametra env z URL sa nesmie dostať do DOM ani do chybovej správy.

const MALICIOUS = [
  "<img src=x onerror=alert(1)>",
  "<script>alert(1)</script>",
  "\"><svg onload=alert(1)>",
  "javascript:alert(1)",
  "REAL",
  "real ",
  "sandbox\u0000",
];

function errorOf(fn: () => void): Error {
  try {
    fn();
  } catch (e) {
    return e as Error;
  }
  throw new Error("expected function to throw");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("F-06: validácia parametra env z URL", () => {
  for (const payload of MALICIOUS) {
    it(`odmietne ${JSON.stringify(payload)} a správa ho neobsahuje`, () => {
      vi.stubEnv("VITE_COMPAVEN_ENV", "sandbox");
      const err = errorOf(() => validateEnvironmentConsistency("?env=" + encodeURIComponent(payload)));
      expect(err.message).toContain("invalid value");
      expect(err.message).not.toContain(payload);
      expect(err.message).not.toMatch(/[<>"]/);
    });
  }

  it("odmietne škodlivú hodnotu aj bez nastaveného prostredia buildu", () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "");
    const err = errorOf(() => validateEnvironmentConsistency("?env=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E"));
    expect(err.message).toContain("invalid value");
    expect(err.message).not.toContain("<img");
  });

  it("povolená, ale nezhodná hodnota neprepne prostredie a nevráti hodnotu z URL", () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "sandbox");
    const err = errorOf(() => validateEnvironmentConsistency("?env=real"));
    expect(err.message).toContain("Environment conflict");
    expect(err.message).toContain("build configuration sandbox");
    expect(err.message).not.toContain("env=real");
  });

  it("zhodná hodnota a chýbajúci parameter prejdú", () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "sandbox");
    expect(() => validateEnvironmentConsistency("?env=sandbox")).not.toThrow();
    expect(() => validateEnvironmentConsistency("")).not.toThrow();
    expect(() => validateEnvironmentConsistency("?other=1")).not.toThrow();
  });

  it("rozhoduje prvý výskyt parametra env", () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "sandbox");
    expect(() => validateEnvironmentConsistency("?env=sandbox&env=real")).not.toThrow();
    expect(() => validateEnvironmentConsistency("?env=real&env=sandbox")).toThrow("Environment conflict");
  });
});

type FakeEl = { tagName: string; textContent: string; style: Record<string, string>; children: FakeEl[]; append: (...c: FakeEl[]) => void };

function fakeRoot() {
  const forbid = (o: object) =>
    Object.defineProperty(o, "innerHTML", {
      set() {
        throw new Error("innerHTML must not be used");
      },
    });
  const doc = {
    createElement(tag: string): FakeEl {
      const el: FakeEl = { tagName: tag.toUpperCase(), textContent: "", style: {}, children: [], append: (...c) => el.children.push(...c) };
      forbid(el);
      return el;
    },
  };
  const root = { ownerDocument: doc, children: [] as FakeEl[], replaceChildren: (...c: FakeEl[]) => (root.children = c) };
  forbid(root);
  return root;
}

describe("F-06: bezpečné vykreslenie fatálnej chyby", () => {
  it("vloží správu ako text a nepoužije innerHTML", () => {
    const root = fakeRoot();
    const payload = "<img src=x onerror=alert(1)>";
    renderFatalError(root as unknown as HTMLElement, payload);
    expect(root.children).toHaveLength(1);
    const [title, detail] = root.children[0].children;
    expect(title.tagName).toBe("STRONG");
    expect(detail.tagName).toBe("PRE");
    expect(detail.textContent).toBe(payload);
  });
});
