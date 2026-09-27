import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Admin session tokens — the pure half of admin-auth.ts.
 *
 * Kept free of next/headers so src/proxy.ts can import it: the proxy checks the
 * role on every request (see sessionFromToken), and a module that pulls in
 * next/headers does not belong in the proxy bundle. admin-auth.ts re-exports
 * everything here, so pages and actions keep importing from one place.
 */

export const ADMIN_COOKIE = "cd_admin";
export const MAX_AGE_S = 60 * 60 * 12; // a working day; long enough not to nag

export type AdminRole = "owner" | "manager" | "staff";
const ROLES: AdminRole[] = ["owner", "manager", "staff"];

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Администратор",
  manager: "Менеджер ресторана",
  staff: "Сотрудник ресторана",
};

export type AdminSession = { role: AdminRole; name: string };

function secret(): string {
  const s = process.env.AUTH_SECRET?.trim();
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function hmac(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Какая переменная хранит пароль роли. */
const PASSWORD_ENV: Record<AdminRole, string> = {
  owner: "ADMIN_PASSWORD",
  manager: "RESTAURANT_MANAGER_PASSWORD",
  staff: "RESTAURANT_STAFF_PASSWORD",
};

/**
 * Отпечаток текущего пароля роли внутри cookie. Сменили пароль официантов —
 * их входы перестают действовать сразу, а не через 12 часов, и владельца это
 * не выкидывает. Пароль роли убрали из окружения — роль закрыта целиком.
 */
function passwordPrint(role: AdminRole): string | null {
  const pw = process.env[PASSWORD_ENV[role]]?.trim();
  if (!pw) return null;
  return hmac(`pw:${role}:${pw}`).slice(0, 16);
}

function sign(expiresAt: number, role: AdminRole, name: string): string {
  const who = Buffer.from(name.slice(0, 60), "utf8").toString("base64url");
  const print = passwordPrint(role) ?? "none";
  const payload = `3.${expiresAt}.${role}.${who}.${print}`;
  return `${payload}.${hmac(payload)}`;
}

function sameHex(got: string, want: string): boolean {
  if (!/^[0-9a-f]+$/i.test(got)) return false;
  const a = Buffer.from(got, "hex");
  const b = Buffer.from(want, "hex");
  // Constant-time: a length mismatch alone would otherwise leak through timing.
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Session from a raw cookie value, without touching next/headers — so the
 * proxy can check it on every request. That matters: a layout does not
 * re-render on client-side navigation, so a check that lives only in the
 * layout can be stepped around with a hand-made RSC request. The proxy runs
 * for each of them (Node runtime in Next 16, so node:crypto is available).
 */
export function sessionFromToken(token: string | undefined): AdminSession | null {
  return parse(token);
}

/** A signed cookie value — for startSession and for tests. */
export function sessionToken(role: AdminRole, name = "", ttlMs = MAX_AGE_S * 1000): string {
  return sign(Date.now() + ttlMs, role, name.trim());
}

function parse(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const parts = token.split(".");
  try {
    // Before roles: `exp.mac`, signed over the expiry alone. Always the owner.
    if (parts.length === 2) {
      const [expRaw, mac] = parts;
      const exp = Number(expRaw);
      if (!exp || !mac || Number.isNaN(exp) || Date.now() > exp) return null;
      return sameHex(mac, hmac(expRaw)) ? { role: "owner", name: "" } : null;
    }
    if (parts.length === 6 && parts[0] === "3") {
      const [, expRaw, role, who, print, mac] = parts;
      const exp = Number(expRaw);
      if (!exp || Number.isNaN(exp) || Date.now() > exp) return null;
      if (!ROLES.includes(role as AdminRole)) return null;
      if (!sameHex(mac, hmac(`3.${expRaw}.${role}.${who}.${print}`))) return null;
      // Пароль роли с тех пор сменили или убрали — вход больше не действует.
      if (print !== passwordPrint(role as AdminRole)) return null;
      return { role: role as AdminRole, name: Buffer.from(who, "base64url").toString("utf8") };
    }
  } catch {
    // AUTH_SECRET missing in this environment: refuse rather than throw into
    // the render. authConfigured() is what surfaces the misconfiguration.
    return null;
  }
  return null;
}

/**
 * Which panel paths a role may open. The layout renders "no access" for the
 * rest; the actions check the role again on their own.
 */
export function roleCanOpen(role: AdminRole, pathname: string): boolean {
  if (role === "owner") return true;
  const p = pathname.replace(/\/+$/, "");
  if (role === "manager") return p === "/admin/restoran" || p.startsWith("/admin/restoran/");
  return p === "/admin/restoran" || p === "/admin/restoran/stoly";
}

/** Where a role lands after sign-in. */
export function homeFor(role: AdminRole): string {
  return role === "owner" ? "/admin" : "/admin/restoran";
}

