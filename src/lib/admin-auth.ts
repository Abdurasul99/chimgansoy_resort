import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin session for /admin — one shared password, no user table.
 *
 * There is exactly one administrator, and the panel holds nothing the site does
 * not already hold: prices that are printed on the public pages, and guest
 * requests that are already pushed to a Telegram group. A user table, password
 * hashes and a reset flow would be machinery with nobody to serve.
 *
 * The cookie carries no identity — only an expiry, HMAC-signed with
 * AUTH_SECRET. There is nothing in it to steal and nothing to enumerate: a
 * forged cookie needs the secret, and an old one is refused by its own
 * timestamp. HttpOnly keeps it away from any script on the page, SameSite=Lax
 * means another site cannot ride it, and Secure keeps it off plain HTTP in
 * production.
 *
 * Ported from the chimgan-uslugi services portal, where this exact module has
 * been running since 2026-08-03. It came over unchanged apart from the cookie
 * name, because it was written storage-agnostic — it was the one part of that
 * project that did not die with its unprovisioned database.
 */

const COOKIE = "cd_admin";
const MAX_AGE_S = 60 * 60 * 12; // a working day; long enough not to nag

function secret(): string {
  const s = process.env.AUTH_SECRET?.trim();
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(expiresAt: number): string {
  const mac = createHmac("sha256", secret()).update(String(expiresAt)).digest("hex");
  return `${expiresAt}.${mac}`;
}

function valid(token: string | undefined): boolean {
  if (!token) return false;
  const [expRaw, mac] = token.split(".");
  const exp = Number(expRaw);
  if (!exp || !mac || Number.isNaN(exp)) return false;
  if (Date.now() > exp) return false;
  let expected: string;
  try {
    expected = createHmac("sha256", secret()).update(expRaw).digest("hex");
  } catch {
    // AUTH_SECRET missing in this environment: refuse rather than throw into
    // the render. authConfigured() is what surfaces the misconfiguration.
    return false;
  }
  let a: Buffer;
  try {
    a = Buffer.from(mac, "hex");
  } catch {
    return false;
  }
  const b = Buffer.from(expected, "hex");
  // Constant-time: a length mismatch alone would otherwise leak through timing.
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when the password matches. Compared in constant time. */
export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sign(Date.now() + MAX_AGE_S * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isSignedIn(): Promise<boolean> {
  try {
    const jar = await cookies();
    return valid(jar.get(COOKIE)?.value);
  } catch {
    return false;
  }
}

/**
 * Guard for every admin action. Throws rather than returning a falsy value, so
 * a forgotten check fails loudly instead of silently writing to the store.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) throw new Error("Not authorised");
}

export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim() && process.env.AUTH_SECRET?.trim());
}
