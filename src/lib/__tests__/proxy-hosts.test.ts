import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

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
const req = (host: string, path: string) => {
  const r = new NextRequest(new URL(path, `https://${host}`));
  Object.defineProperty(r, "headers", { value: new Headers({ host }) });
  return r;
};

describe("админский домен", () => {
  beforeEach(() => {
    process.env.ADMIN_HOST = "chimgansoy.com";
  });
  afterEach(() => {
    delete process.env.ADMIN_HOST;
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

  it("сама панель проходит без редиректа", () => {
    expect(proxy(req("chimgansoy.com", "/admin"))).toBeUndefined();
    expect(proxy(req("chimgansoy.com", "/admin/uslugi"))).toBeUndefined();
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
