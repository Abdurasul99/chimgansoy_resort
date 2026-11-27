import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { winterDefaultOn } from "@/content/new-year";

/**
 * Зима по умолчанию (владелец, 27.11.2026: «зимняя тема должна автоматически
 * примениться 1 декабря… по дефолту всегда зимняя»): с 1.12 по 10.01 по
 * Ташкенту главная ведёт на зимний экран. «Обычный сайт» (cookie на сессию)
 * отключает переадресацию; роботы и превью ссылок её не получают.
 */

const GUEST = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

// host и cookie — запрещённые заголовки для Request: подставляем готовому
// объекту (так же, как в proxy-hosts.test.ts).
const req = (path: string, { ua = GUEST, cookie }: { ua?: string; cookie?: string } = {}) => {
  const r = new NextRequest(new URL(path, "https://chimgandarbaza.uz"));
  Object.defineProperty(r, "headers", { value: new Headers({ host: "chimgandarbaza.uz", "user-agent": ua }) });
  Object.defineProperty(r, "cookies", {
    value: { get: (k: string) => (cookie && k === cookie.split("=")[0] ? { name: k, value: cookie.split("=")[1] } : undefined) },
  });
  return r;
};

/** Момент по Ташкенту (UTC+5). */
const at = (tashkent: string) => vi.spyOn(Date, "now").mockReturnValue(Date.parse(`${tashkent}+05:00`));

const location = (res: Response | undefined | null) => (res ? new URL(res.headers.get("location") ?? "", "https://x").pathname + new URL(res.headers.get("location") ?? "", "https://x").search : null);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("зима по умолчанию", () => {
  it("сезон: с 00:00 1 декабря по 10 января включительно, по Ташкенту", () => {
    expect(winterDefaultOn(Date.parse("2026-11-30T23:59:59+05:00"))).toBe(false);
    expect(winterDefaultOn(Date.parse("2026-12-01T00:00:00+05:00"))).toBe(true);
    expect(winterDefaultOn(Date.parse("2026-12-31T23:59:00+05:00"))).toBe(true);
    expect(winterDefaultOn(Date.parse("2027-01-10T23:59:00+05:00"))).toBe(true);
    expect(winterDefaultOn(Date.parse("2027-01-11T00:00:00+05:00"))).toBe(false);
  });

  it("до 1 декабря главная — обычная", () => {
    at("2026-11-30T23:00:00");
    expect(proxy(req("/ru"))).toBeUndefined();
  });

  it("с 1 декабря главная ведёт на зимний экран — на каждом языке, с метками", () => {
    at("2026-12-01T00:05:00");
    for (const l of ["ru", "uz", "en"]) {
      const res = proxy(req(`/${l}`));
      expect(res?.status).toBe(307);
      expect(location(res)).toBe(`/${l}/novyi-god`);
    }
    expect(location(proxy(req("/ru/")))).toBe("/ru/novyi-god");
    expect(location(proxy(req("/uz?utm_source=vizitka&utm_medium=bio")))).toBe("/uz/novyi-god?utm_source=vizitka&utm_medium=bio");
  });

  it("корень сайта — сразу на зимний экран, без промежуточной главной", () => {
    at("2026-12-15T12:00:00");
    const res = proxy(req("/"));
    expect(location(res)).toMatch(/^\/(ru|uz|en)\/novyi-god$/);
  });

  it("выбрали «Обычный сайт» — главная своя", () => {
    at("2026-12-15T12:00:00");
    expect(proxy(req("/ru", { cookie: "cd-theme=regular" }))).toBeUndefined();
  });

  it("остальные страницы не трогаем", () => {
    at("2026-12-15T12:00:00");
    for (const p of ["/ru/nomera", "/ru/nomera/cottage", "/ru/restaurant", "/ru/novyi-god", "/uz/bron"]) {
      expect(proxy(req(p))).toBeUndefined();
    }
  });

  it("роботы и превью ссылок видят обычную главную; браузеры Яндекса и Telegram — гости", () => {
    at("2026-12-15T12:00:00");
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
      "TelegramBot (like TwitterBot)",
      "facebookexternalhit/1.1",
      "WhatsApp/2.24.1 A",
    ]) {
      expect(proxy(req("/ru", { ua }))).toBeUndefined();
    }
    const yandexApp = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 YaBrowser/24.4 YandexSearch/24.4 Mobile Safari/537.36";
    const telegramApp = "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36 Telegram-Android/11.2.0";
    expect(location(proxy(req("/ru", { ua: yandexApp })))).toBe("/ru/novyi-god");
    expect(location(proxy(req("/ru", { ua: telegramApp })))).toBe("/ru/novyi-god");
  });

  it("после 10 января — снова обычная главная", () => {
    at("2027-01-11T08:00:00");
    expect(proxy(req("/ru"))).toBeUndefined();
  });
});
