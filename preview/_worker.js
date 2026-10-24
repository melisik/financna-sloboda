// Prihlásenie do súkromného náhľadu Fázy 2 (D-270, D-271, D-273): formulár a cookie na 30 dní.
// Workflow preview-phase2 skopíruje tento súbor do dist/_worker.js. Verejné Pages ho nedostanú.
// Heslo je Cloudflare secret PREVIEW_PASSWORD, nie je v repozitári. Bez hesla sa obsah nepustí (zlyhá zatvorene).
// Cookie je podpísaná HMAC-SHA256 heslom; zmena hesla všetky staré prihlásenia zneplatní.

const COOKIE = "nahlad";
const LOGIN_PATH = "/prihlasenie";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();

function safeEqual(a, b) {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(password, expires) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(String(expires))));
}

export async function makeToken(password, expires) {
  return `${expires}.${await sign(password, expires)}`;
}

export async function isValidToken(token, password, now = Date.now()) {
  if (!password || !token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expires = Number(token.slice(0, dot));
  if (!Number.isFinite(expires) || expires <= now) return false;
  return safeEqual(token.slice(dot + 1), await sign(password, expires));
}

function readCookie(request) {
  for (const part of (request.headers.get("Cookie") ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=");
  }
  return null;
}

function loginPage(message) {
  return `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prihlásenie</title>
<style>
body { font-family: system-ui, sans-serif; max-width: 360px; margin: 12vh auto; padding: 0 16px; }
input, button { font: inherit; width: 100%; padding: 12px; box-sizing: border-box; }
button { margin-top: 12px; }
p { color: #b00020; }
</style>
</head>
<body>
<h1>Náhľad Fázy 2</h1>
<form method="post" action="${LOGIN_PATH}">
<label>Heslo <input type="password" name="heslo" autocomplete="current-password" required></label>
<button type="submit">Prihlásiť</button>
</form>
<p>${message}</p>
</body>
</html>`;
}

function html(body, status) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function login(request, password) {
  const form = await request.formData();
  if (!safeEqual(String(form.get("heslo") ?? ""), password)) {
    return html(loginPage("Heslo nesedí."), 401);
  }
  const token = await makeToken(password, Date.now() + MAX_AGE_SECONDS * 1000);
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Set-Cookie": `${COOKIE}=${token}; Max-Age=${MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

export default {
  async fetch(request, env) {
    const password = env.PREVIEW_PASSWORD;
    if (!password) {
      return new Response("Náhľad nie je nastavený: chýba heslo.", { status: 503 });
    }
    if (new URL(request.url).pathname === LOGIN_PATH) {
      return request.method === "POST" ? login(request, password) : html(loginPage(""), 200);
    }
    if (await isValidToken(readCookie(request), password)) {
      return env.ASSETS.fetch(request);
    }
    return new Response(null, { status: 302, headers: { Location: LOGIN_PATH } });
  },
};
