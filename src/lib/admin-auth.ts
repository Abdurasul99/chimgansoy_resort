import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, MAX_AGE_S, sessionFromToken, sessionToken, type AdminRole, type AdminSession, ROLE_LABEL } from "./admin-session";

export * from "./admin-session";

/**
 * Admin session for /admin — shared passwords, no user table.
 *
 * There used to be exactly one administrator and one password. The restaurant
 * (see src/lib/restaurant) changed that: it is run by a different operating
 * party, and its manager and waiters must process orders without seeing hotel
 * bookings, guest phone numbers or prices. So there are now three roles, each
 * with its own password in the environment:
 *
 *   owner   — ADMIN_PASSWORD, the whole panel, as before;
 *   manager — RESTAURANT_MANAGER_PASSWORD, the restaurant section only;
 *   staff   — RESTAURANT_STAFF_PASSWORD, restaurant orders and tables only.
 *
 * Still no user table: a role is a password, and the person's name is typed at
 * sign-in so the order history can say who pressed "confirm". Anyone with the
 * password could type any name — that is fine for a history meant to answer
 * "who was on shift", not to settle a dispute.
 *
 * The cookie carries the expiry, the role and the name, HMAC-signed with
 * AUTH_SECRET. A cookie issued before roles existed (`exp.mac`) is still
 * accepted as the owner, so nobody was signed out by the upgrade. HttpOnly
 * keeps it away from page scripts, SameSite=Lax keeps other sites from riding
 * it, Secure keeps it off plain HTTP in production.
 */

const COOKIE = ADMIN_COOKIE;

function equalSecret(input: string, expected: string | undefined): boolean {
  const want = expected?.trim();
  if (!want) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when the owner password matches. Compared in constant time. */
export function passwordMatches(input: string): boolean {
  return equalSecret(input, process.env.ADMIN_PASSWORD);
}

/**
 * Which role a password opens, or null. Every candidate is compared, match or
 * not, so the time taken does not say which password was close.
 */
export function passwordRole(input: string): AdminRole | null {
  const owner = equalSecret(input, process.env.ADMIN_PASSWORD);
  const manager = equalSecret(input, process.env.RESTAURANT_MANAGER_PASSWORD);
  const staff = equalSecret(input, process.env.RESTAURANT_STAFF_PASSWORD);
  return owner ? "owner" : manager ? "manager" : staff ? "staff" : null;
}

export async function startSession(role: AdminRole = "owner", name = ""): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sessionToken(role, name), {
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

export async function getSession(): Promise<AdminSession | null> {
  try {
    const jar = await cookies();
    return sessionFromToken(jar.get(COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function isSignedIn(): Promise<boolean> {
  return (await getSession()) !== null;
}

/**
 * Guard for every owner-only action. Throws rather than returning a falsy
 * value, so a forgotten check fails loudly instead of silently writing to the
 * store. A restaurant login is refused here: it must not reach bookings,
 * prices or the site's content.
 */
export async function requireAdmin(): Promise<void> {
  const s = await getSession();
  if (!s || s.role !== "owner") throw new Error("Not authorised");
}

/** Guard for restaurant actions: returns the session so it can be logged. */
export async function requireRole(...roles: AdminRole[]): Promise<AdminSession> {
  const s = await getSession();
  if (!s || !roles.includes(s.role)) throw new Error("Not authorised");
  return s;
}

/** «Менеджер ресторана · Азиз» — как сотрудник попадёт в историю статусов. */
export function actorName(s: AdminSession): string {
  return s.name ? `${ROLE_LABEL[s.role]} · ${s.name}` : ROLE_LABEL[s.role];
}

export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim() && process.env.AUTH_SECRET?.trim());
}
