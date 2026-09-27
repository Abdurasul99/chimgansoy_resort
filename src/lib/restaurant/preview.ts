import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Предпросмотр скрытого раздела ресторана.
 *
 * Админка живёт на chimgansoy.com, а сайт — на chimgandarbaza.uz, и cookie
 * входа в панель на сайт не попадает. Поэтому панель выдаёт подписанную
 * ссылку, по которой сайт ставит свою cookie предпросмотра. Подпись — тем же
 * AUTH_SECRET, что и вход в панель, но с другой солью: подпись предпросмотра
 * нельзя подсунуть панели как вход, и наоборот.
 */
export const PREVIEW_COOKIE = "cd_rest_preview";
/** Ссылка из панели живёт два часа; cookie по ней — сутки. */
export const LINK_TTL_MS = 2 * 3600_000;
export const COOKIE_TTL_S = 24 * 3600;

/**
 * У ссылки и у cookie разные подписи: cookie на сутки нельзя подсунуть как
 * ссылку и продлевать ею предпросмотр бесконечно.
 */
export type PreviewKind = "link" | "cookie";

function mac(payload: string, kind: PreviewKind): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`restaurant-preview-${kind}:${payload}`).digest("hex");
}

export function signPreview(expiresAt: number, kind: PreviewKind): string | null {
  const m = mac(String(expiresAt), kind);
  return m ? `${expiresAt}.${m}` : null;
}

export function verifyPreview(token: string | undefined, kind: PreviewKind, now = Date.now()): boolean {
  if (!token) return false;
  const [expRaw, got] = token.split(".");
  const exp = Number(expRaw);
  if (!exp || !got || !Number.isFinite(exp) || now > exp) return false;
  const want = mac(expRaw, kind);
  if (!want || !/^[0-9a-f]{64}$/.test(got)) return false;
  const a = Buffer.from(got, "hex");
  const b = Buffer.from(want, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
