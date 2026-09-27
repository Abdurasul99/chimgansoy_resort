import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { sessionToken } from "@/lib/admin-session";

/**
 * Разделение доменов: chimgansoy.com — панель, chimgandarbaza.uz — сайт.
 *
 * Регрессия, ради которой этот файл написан: корень админского домена попадал
 * под общее правило «всё, что не /admin, — на публичный сайт», и chimgansoy.com
 * отвечал 308 на chimgandarbaza.uz. Открыть панель по её собственному адресу
 * было нельзя.
 */
// `host` — запрещённый для Request заголовок: конструктор его отбрасывает, и
// запрос приезжает в proxy вообще без хоста. Подменяем заголовки уже готовому
// объекту — отдельный Headers таких ограничений не знает.
// Cookie в happy-dom тоже теряется при конструировании (запрещённый
// заголовок), поэтому request.cookies подставляется так же, как headers.
const req = (host: string, path: string, cookie?: string) => {
  const r = new NextRequest(new URL(path, `https://${host}`));
  Object.defineProperty(r, "headers", { value: new Headers({ host }) });
  const jar = new Map<string, string>();
  if (cookie) {
    const i = cookie.indexOf("=");
    jar.set(cookie.slice(0, i), cookie.slice(i + 1));
  }
  Object.defineProperty(r, "cookies", {
    value: { get: (k: string) => (jar.has(k) ? { name: k, value: jar.get(k)! } : undefined) },
  });
  return r;
};

describe("админский домен", () => {
  beforeEach(() => {
    process.env.ADMIN_HOST = "chimgansoy.com";
    process.env.AUTH_SECRET = "test-secret";
    // В cookie входа — отпечаток пароля роли: без пароля роль закрыта.
    process.env.ADMIN_PASSWORD = "owner-pass";
    process.env.RESTAURANT_MANAGER_PASSWORD = "manager-pass";
    process.env.RESTAURANT_STAFF_PASSWORD = "staff-pass";
  });
  afterEach(() => {
    delete process.env.ADMIN_HOST;
    delete process.env.AUTH_SECRET;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.RESTAURANT_MANAGER_PASSWORD;
    delete process.env.RESTAURANT_STAFF_PASSWORD;
  });

  it("корень открывает панель, а не публичный сайт", () => {
    for (const host of ["chimgansoy.com", "www.chimgansoy.com"]) {
      const res = proxy(req(host, "/"));
      expect(res?.status, host).toBe(307);
      const to = new URL(res!.headers.get("location")!);
      expect(to.pathname, host).toBe("/admin");
      // Остаться на своём домене — весь смысл: панель не должна уводить на сайт.
      expect(to.hostname, host).toBe(host);
    }
  });

  it("/login ведёт к форме пароля, а не на публичный сайт", () => {
    const res = proxy(req("chimgansoy.com", "/login"));
    expect(res?.status).toBe(307);
    expect(new URL(res!.headers.get("location")!).pathname).toBe("/admin");
  });

  it("сама панель проходит без редиректа и с путём для layout", () => {
    const cookie = `cd_admin=${sessionToken("owner")}`;
    for (const path of ["/admin", "/admin/uslugi", "/admin/restoran/menu"]) {
      const res = proxy(req("chimgansoy.com", path, cookie));
      expect(res?.headers.get("location"), path).toBeNull();
      expect(res?.status ?? 200, path).toBe(200);
      // Layout панели решает по этому пути, пускать ли вход ресторана.
      expect(res?.headers.get("x-middleware-request-x-admin-path"), path).toBe(path);
    }
  });

  it("без входа открывается только форма пароля", () => {
    expect(proxy(req("chimgansoy.com", "/admin"))?.headers.get("location")).toBeNull();
    const res = proxy(req("chimgansoy.com", "/admin/broni"));
    expect(res?.status).toBe(307);
    expect(new URL(res!.headers.get("location")!).pathname).toBe("/admin");
  });

  it("вход ресторана не видит брони и цены гостиницы", () => {
    const manager = `cd_admin=${sessionToken("manager", "Азиз")}`;
    const staff = `cd_admin=${sessionToken("staff")}`;
    for (const path of ["/admin", "/admin/broni", "/admin/tseny", "/admin/zayavki"]) {
      const res = proxy(req("chimgansoy.com", path, manager));
      expect(res?.status, path).toBe(307);
      expect(new URL(res!.headers.get("location")!).pathname, path).toBe("/admin/restoran");
    }
    expect(proxy(req("chimgansoy.com", "/admin/restoran/menu", manager))?.headers.get("location")).toBeNull();
    // Официант: заказы и столы — да, меню и настройки — нет.
    expect(proxy(req("chimgansoy.com", "/admin/restoran/stoly", staff))?.headers.get("location")).toBeNull();
    const menu = proxy(req("chimgansoy.com", "/admin/restoran/menu", staff));
    expect(new URL(menu!.headers.get("location")!).pathname).toBe("/admin/restoran");
  });

  it("подделанная cookie роли не открывает ничего", () => {
    const forged = sessionToken("owner").replace(/.owner./, ".manager.");
    const res = proxy(req("chimgansoy.com", "/admin/restoran", `cd_admin=${forged}`));
    expect(new URL(res!.headers.get("location")!).pathname).toBe("/admin");
  });

  it("случайный адрес на админском домене уходит на публичный сайт", () => {
    const res = proxy(req("chimgansoy.com", "/ru/nomera"));
    expect(res?.status).toBe(308);
    expect(new URL(res!.headers.get("location")!).hostname).toBe("chimgandarbaza.uz");
  });
});

describe("публичный домен", () => {
  beforeEach(() => {
    process.env.ADMIN_HOST = "chimgansoy.com";
  });
  afterEach(() => {
    delete process.env.ADMIN_HOST;
  });

  it("панель на нём не отвечает и не выдаёт, куда переехала", () => {
    const res = proxy(req("chimgandarbaza.uz", "/admin"));
    expect(res?.status).toBe(404);
    expect(res?.headers.get("location")).toBeNull();
  });

  it("корень уводит на язык, а не на админский домен", () => {
    for (const host of ["chimgandarbaza.uz", "www.chimgandarbaza.uz"]) {
      const res = proxy(req(host, "/"));
      expect(res?.status, host).toBe(307);
      const to = new URL(res!.headers.get("location")!);
      expect(to.hostname, host).toBe(host);
      expect(to.pathname, host).toMatch(/^\/(ru|uz|en)$/);
    }
  });

  it("страница с языком проходит как есть", () => {
    expect(proxy(req("chimgandarbaza.uz", "/ru/services"))).toBeUndefined();
  });
});
