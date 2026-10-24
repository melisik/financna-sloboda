import { describe, expect, it } from "vitest";
import worker, { isValidToken, makeToken } from "../preview/_worker";

// Prihlásenie do súkromného náhľadu Fázy 2: formulár a cookie na 30 dní (D-271, D-273). Syntetické hodnoty.
const PASSWORD = "test-heslo-123";
const BASE = "https://náhľad.test";
const DAY_MS = 24 * 60 * 60 * 1000;

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

function loginForm(heslo: string): Request {
  return new Request(`${BASE}/prihlasenie`, {
    method: "POST",
    body: new URLSearchParams({ heslo }),
  });
}

function cookieFrom(res: Response): string {
  const header = res.headers.get("Set-Cookie") ?? "";
  const match = header.match(/nahlad=([^;]+)/);
  expect(match).not.toBeNull();
  return match![1];
}

describe("náhľad Fázy 2: prihlásenie formulárom a cookie", () => {
  it("bez cookie presmeruje na prihlásenie a obsah nepustí", async () => {
    const a = assets();
    const res = await worker.fetch(new Request(`${BASE}/`), { PREVIEW_PASSWORD: PASSWORD, ASSETS: a });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/prihlasenie");
    expect(a.calls).toHaveLength(0);
  });

  it("GET na prihlásenie zobrazí formulár s poľom pre heslo", async () => {
    const res = await worker.fetch(new Request(`${BASE}/prihlasenie`), { PREVIEW_PASSWORD: PASSWORD, ASSETS: assets() });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('type="password"');
    expect(body).toContain('name="heslo"');
  });

  it("správne heslo nastaví cookie na 30 dní, HttpOnly a Secure, a presmeruje na úvod", async () => {
    const res = await worker.fetch(loginForm(PASSWORD), { PREVIEW_PASSWORD: PASSWORD, ASSETS: assets() });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/");
    const setCookie = res.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("Max-Age=2592000");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("Path=/");
  });

  it("zlé heslo vráti 401, nenastaví cookie a obsah nepustí", async () => {
    const a = assets();
    const res = await worker.fetch(loginForm("zle-heslo"), { PREVIEW_PASSWORD: PASSWORD, ASSETS: a });
    expect(res.status).toBe(401);
    expect(res.headers.get("Set-Cookie")).toBeNull();
    expect(a.calls).toHaveLength(0);
  });

  it("platná cookie pustí požiadavku na statické súbory", async () => {
    const token = await makeToken(PASSWORD, Date.now() + DAY_MS);
    const a = assets();
    const req = new Request(`${BASE}/`, { headers: { Cookie: `nahlad=${token}` } });
    const res = await worker.fetch(req, { PREVIEW_PASSWORD: PASSWORD, ASSETS: a });
    expect(res.status).toBe(200);
    expect(a.calls).toHaveLength(1);
  });

  it("cookie z prihlásenia funguje pri ďalšej požiadavke", async () => {
    const env = { PREVIEW_PASSWORD: PASSWORD, ASSETS: assets() };
    const login = await worker.fetch(loginForm(PASSWORD), env);
    const req = new Request(`${BASE}/`, { headers: { Cookie: `nahlad=${cookieFrom(login)}` } });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
  });

  it("cookie podpísaná iným heslom neprejde", async () => {
    const forged = await makeToken("iné-heslo-999", Date.now() + DAY_MS);
    const a = assets();
    const req = new Request(`${BASE}/`, { headers: { Cookie: `nahlad=${forged}` } });
    const res = await worker.fetch(req, { PREVIEW_PASSWORD: PASSWORD, ASSETS: a });
    expect(res.status).toBe(302);
    expect(a.calls).toHaveLength(0);
  });

  it("expirovaná cookie neprejde", async () => {
    const expired = await makeToken(PASSWORD, Date.now() - 1000);
    expect(await isValidToken(expired, PASSWORD)).toBe(false);
  });

  it("poškodená cookie neprejde", async () => {
    expect(await isValidToken("nie-je-token", PASSWORD)).toBe(false);
    expect(await isValidToken(null, PASSWORD)).toBe(false);
  });

  it("bez nastaveného hesla vráti 503 na každej ceste a obsah nikdy nepustí (zlyhá zatvorene)", async () => {
    const a = assets();
    const token = await makeToken(PASSWORD, Date.now() + DAY_MS);
    const req = new Request(`${BASE}/`, { headers: { Cookie: `nahlad=${token}` } });
    const res = await worker.fetch(req, { ASSETS: a });
    expect(res.status).toBe(503);
    const login = await worker.fetch(loginForm(PASSWORD), { ASSETS: a });
    expect(login.status).toBe(503);
    expect(a.calls).toHaveLength(0);
  });
});
