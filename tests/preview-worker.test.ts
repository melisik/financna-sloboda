import { describe, expect, it } from "vitest";
import worker, { isAuthorized } from "../preview/_worker";

// Heslo na súkromný náhľad Fázy 2 (D-270, D-271). Syntetické hodnoty.
const PASSWORD = "test-heslo-123";
const USER = "zakladatel";
const basic = (user: string, pass: string) => "Basic " + btoa(`${user}:${pass}`);

function assets() {
  const calls: Request[] = [];
  return {
    calls,
    fetch: async (request: Request) => {
      calls.push(request);
      return new Response("app", { status: 200 });
    },
  };
}

describe("náhľad Fázy 2: HTTP Basic Auth", () => {
  it("bez hlavičky Authorization vráti 401 a výzvu na prihlásenie, obsah nepustí", async () => {
    const a = assets();
    const res = await worker.fetch(new Request("https://náhľad.test/"), { PREVIEW_PASSWORD: PASSWORD, ASSETS: a });
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain("Basic");
    expect(a.calls).toHaveLength(0);
  });

  it("zlé heslo vráti 401", async () => {
    const a = assets();
    const req = new Request("https://náhľad.test/", { headers: { Authorization: basic(USER, "zle") } });
    const res = await worker.fetch(req, { PREVIEW_PASSWORD: PASSWORD, ASSETS: a });
    expect(res.status).toBe(401);
    expect(a.calls).toHaveLength(0);
  });

  it("zlé meno so správnym heslom vráti 401", async () => {
    const a = assets();
    const req = new Request("https://náhľad.test/", { headers: { Authorization: basic("iny", PASSWORD) } });
    const res = await worker.fetch(req, { PREVIEW_PASSWORD: PASSWORD, ASSETS: a });
    expect(res.status).toBe(401);
    expect(a.calls).toHaveLength(0);
  });

  it("správne meno a heslo pustí požiadavku na statické súbory", async () => {
    const a = assets();
    const req = new Request("https://náhľad.test/", { headers: { Authorization: basic(USER, PASSWORD) } });
    const res = await worker.fetch(req, { PREVIEW_PASSWORD: PASSWORD, ASSETS: a });
    expect(res.status).toBe(200);
    expect(a.calls).toHaveLength(1);
  });

  it("bez nastaveného hesla vráti 503 a obsah nikdy nepustí (zlyhá zatvorené)", async () => {
    const a = assets();
    const req = new Request("https://náhľad.test/", { headers: { Authorization: basic(USER, "") } });
    const res = await worker.fetch(req, { ASSETS: a });
    expect(res.status).toBe(503);
    expect(a.calls).toHaveLength(0);
  });

  it("poškodená hlavička neprejde", () => {
    expect(isAuthorized("Basic !!!nie-base64", PASSWORD)).toBe(false);
    expect(isAuthorized("Bearer " + PASSWORD, PASSWORD)).toBe(false);
    expect(isAuthorized(null, PASSWORD)).toBe(false);
  });
});
