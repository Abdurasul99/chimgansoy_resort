import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { LOCALE_SECTIONS, proxy } from "@/proxy";
import { policies } from "@/content/policies";
import { rooms } from "@/content/rooms";

/**
 * Несуществующий адрес — фирменная 404 с кодом 404, а не «Страница не
 * найдена» с кодом 200 и не голая страница Next.
 *
 * До 17.11.2026 /ru/legal/stay-rules и /ru/nomera/что-угодно отвечали 200
 * всем, включая Googlebot (loading.tsx отдаёт страницу потоком, и код уходит
 * раньше notFound()), а /ru/nomeraa показывал белую «This page could not be
 * found» без шапки и подвала.
 */
const req = (path: string) => {
  const r = new NextRequest(new URL(path, "https://chimgandarbaza.uz"));
  Object.defineProperty(r, "headers", { value: new Headers({ host: "chimgandarbaza.uz" }) });
  return r;
};
const run = (path: string) => {
  const res = proxy(req(path));
  return { to: res?.headers.get("x-middleware-rewrite") ?? null, status: res?.status ?? null };
};

describe("proxy — несуществующие адреса", () => {
  it("неизвестный документ и домик — на /[locale]/notfound с кодом 404", () => {
    for (const p of ["/ru/legal/stay-rules", "/uz/legal/no-such-doc/", "/en/nomera/penthouse", "/ru/nomera/%E0%A4%A"]) {
      const r = run(p);
      expect(r.to, p).toMatch(new RegExp(`/${p.slice(1, 3)}/notfound/?$`));
      expect(r.status, p).toBe(404);
    }
  });

  it("неизвестный раздел верхнего уровня — тоже 404", () => {
    for (const p of ["/ru/nomeraa", "/uz/booking", "/en/wp-admin/setup.php"]) {
      const r = run(p);
      expect(r.to, p).toMatch(/\/notfound\/?$/);
      expect(r.status, p).toBe(404);
    }
  });

  it("пропускает каждый настоящий документ, домик и раздел", () => {
    for (const p of policies) expect(run(`/ru/legal/${p.slug}`).to).toBeNull();
    for (const r of rooms.filter((x) => x.available !== false)) expect(run(`/uz/nomera/${r.slug}`).to).toBeNull();
    for (const s of LOCALE_SECTIONS) expect(run(`/en/${s}`).to, s).toBeNull();
    expect(run("/ru").to).toBeNull();
    expect(run("/ru/").to).toBeNull();
  });

  it("не трогает то, чего proxy не знает", () => {
    expect(run("/ru/services/whatever").to).toBeNull(); // услуги — из базы
    expect(run("/ru/legal/public-offer/extra/segment").to).toBeNull(); // ловит [...missing]
  });

  it("список разделов совпадает с папками src/app/[locale]", () => {
    // Новая страница без строки в LOCALE_SECTIONS открывалась бы как 404 —
    // этот тест не даст её забыть.
    const dir = join(process.cwd(), "src", "app", "[locale]");
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("[") && !d.name.startsWith("_") && !d.name.startsWith("("))
      .map((d) => d.name);
    const files = readdirSync(dir).filter((f) => /^opengraph-image\.(tsx?|jsx?|png|jpg)$/.test(f)).map(() => "opengraph-image");
    expect([...LOCALE_SECTIONS].sort()).toEqual([...new Set([...folders, ...files])].sort());
  });
});
