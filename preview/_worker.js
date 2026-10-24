// Heslo na súkromný náhľad Fázy 2 (D-270, D-271): HTTP Basic Auth na serveri, bez platby.
// Workflow preview-phase2 skopíruje tento súbor do dist/_worker.js. Verejné Pages ho nedostanú.
// Heslo je Cloudflare secret PREVIEW_PASSWORD, nie je v repozitári. Bez hesla sa obsah nepustí (zlyhá zatvorené).

const USER = "zakladatel";

function safeEqual(a, b) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function isAuthorized(header, password) {
  if (!password || !header || !header.startsWith("Basic ")) return false;
  let decoded;
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  return safeEqual(decoded.slice(0, sep), USER) && safeEqual(decoded.slice(sep + 1), password);
}

export default {
  async fetch(request, env) {
    if (!env.PREVIEW_PASSWORD) {
      return new Response("Náhľad nie je nastavený: chýba heslo.", { status: 503 });
    }
    if (!isAuthorized(request.headers.get("Authorization"), env.PREVIEW_PASSWORD)) {
      return new Response("Prihlás sa.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="preview", charset="UTF-8"' },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
