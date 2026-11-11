import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Вход в админку партнёров — chimgandarbaza.uz/<locale>/adminpartners.
 *
 * Отдельно от основной панели (chimgansoy.com/admin): владелец, 11.11.2026, —
 * «реализуй его на chimgandarbaza». Раз админка на публичном домене, защита
 * строже, чем у панели:
 *   • свой пароль PARTNERS_ADMIN_PASSWORD (пароль владельца ADMIN_PASSWORD
 *     тоже пускает — у него доступ ко всему);
 *   • секунда задержки на каждую попытку и блокировка адреса на 15 минут после
 *     5 неудач подряд. Сайт — один процесс на одном сервере, поэтому счётчик в
 *     памяти здесь честный (на Vercel он был бы театром — см. app/admin/actions);
 *   • сессия подписана AUTH_SECRET и несёт отпечаток пароля: сменили пароль —
 *     все старые входы недействительны сразу.
 */

export const PARTNERS_COOKIE = "cd_partners";
export const SESSION_TTL_S = 60 * 60 * 12;

type Who = "partners" | "owner";

function secret(): string | null {
  return process.env.AUTH_SECRET?.trim() || null;
}

function hmac(payload: string): string {
  const s = secret();
  if (!s) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", s).update(payload).digest("hex");
}

function passwordFor(who: Who): string | null {
  return (who === "owner" ? process.env.ADMIN_PASSWORD : process.env.PARTNERS_ADMIN_PASSWORD)?.trim() || null;
}

function print(who: Who): string {
  const pw = passwordFor(who);
  return pw ? hmac(`partners-pw:${who}:${pw}`).slice(0, 16) : "none";
}

export function partnersAuthConfigured(): boolean {
  return !!secret() && (!!passwordFor("partners") || !!passwordFor("owner"));
}

function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Чей это пароль — или null. Сравнение за постоянное время. */
export function passwordWho(password: string): Who | null {
  if (!password) return null;
  for (const who of ["partners", "owner"] as Who[]) {
    const pw = passwordFor(who);
    if (pw && sameText(password, pw)) return who;
  }
  return null;
}

export function sessionToken(who: Who, now = Date.now()): string {
  const payload = `p1.${now + SESSION_TTL_S * 1000}.${who}.${print(who)}`;
  return `${payload}.${hmac(payload)}`;
}

export function sessionValid(token: string | undefined, now = Date.now()): boolean {
  if (!token || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "p1") return false;
  const [, expRaw, who, pr, mac] = parts;
  const exp = Number(expRaw);
  if (!exp || now > exp || (who !== "partners" && who !== "owner")) return false;
  try {
    if (!/^[0-9a-f]{64}$/.test(mac)) return false;
    const want = hmac(`p1.${expRaw}.${who}.${pr}`);
    if (!timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(want, "hex"))) return false;
    return pr !== "none" && pr === print(who as Who);
  } catch {
    return false;
  }
}

// ─── Защита от подбора ─────────────────────────────────────────────────────

export const MAX_FAILS = 5;
export const LOCK_MS = 15 * 60_000;
const attempts = new Map<string, { fails: number; lockedUntil: number }>();

/** Сколько ещё ждать, мс; 0 — можно пробовать. */
export function lockedFor(ip: string, now = Date.now()): number {
  const a = attempts.get(ip);
  return a && a.lockedUntil > now ? a.lockedUntil - now : 0;
}

export function noteFailure(ip: string, now = Date.now()): void {
  const a = attempts.get(ip) ?? { fails: 0, lockedUntil: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) {
    a.lockedUntil = now + LOCK_MS;
    a.fails = 0;
  }
  attempts.set(ip, a);
  // Карта не растёт бесконечно: старые записи без блокировки — вон.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (v.lockedUntil < now) attempts.delete(k);
  }
}

export function noteSuccess(ip: string): void {
  attempts.delete(ip);
}

/** Для тестов. */
export function resetAttempts(): void {
  attempts.clear();
}
