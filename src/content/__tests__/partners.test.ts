/**
 * Партнёрский раздел: содержимое правят владелец и его ИИ, поэтому тест —
 * страховка от типичных правок мимо правил (см. шапку src/content/partners.ts).
 */
import { describe, expect, it } from "vitest";
import { partnersPage } from "../partners";
import { resortImages } from "../images";
import nextConfig from "../../../next.config";

const LOCALES = ["ru", "uz", "en"] as const;

/** Все места, где лежит текст на трёх языках, — с путём для понятной ошибки. */
function localized(node: unknown, path: string, out: Array<[string, Record<string, unknown>]> = []) {
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const o = node as Record<string, unknown>;
    if ("ru" in o && "uz" in o && "en" in o) {
      out.push([path, o]);
      return out;
    }
    for (const [k, v] of Object.entries(o)) localized(v, `${path}.${k}`, out);
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => localized(v, `${path}[${i}]`, out));
  }
  return out;
}

describe("партнёрский раздел — содержимое", () => {
  const all = localized(partnersPage, "partnersPage");

  it("у каждого текста есть все три языка, без пустых строк", () => {
    expect(all.length).toBeGreaterThan(50);
    for (const [path, value] of all) {
      for (const l of LOCALES) {
        const v = value[l];
        const filled = Array.isArray(v) ? v.length > 0 && v.every((s) => typeof s === "string" && s.trim()) : typeof v === "string" && v.trim();
        expect(filled, `${path}.${l}`).toBeTruthy();
      }
    }
  });

  it("у списков одинаковое число пунктов на всех языках", () => {
    for (const [path, value] of all) {
      if (Array.isArray(value.ru)) {
        const n = (value.ru as unknown[]).length;
        expect((value.uz as unknown[]).length, `${path}.uz`).toBe(n);
        expect((value.en as unknown[]).length, `${path}.en`).toBe(n);
      }
    }
  });

  it("каждое фото есть в реестре и лежит на диске", () => {
    const keys = [
      partnersPage.hero.image,
      partnersPage.location.image,
      ...partnersPage.territory.items.map((i) => i.image),
    ];
    for (const k of keys) {
      expect(resortImages[k], k).toBeDefined();
      expect((resortImages[k] as { localSrc?: string }).localSrc, k).toBeTruthy();
    }
  });

  it("id программ уникальны — по ним работают якоря и форма", () => {
    const ids = partnersPage.programs.items.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("other");
  });

  it("в тексте нет выручки и себестоимости — это не для чужих глаз", () => {
    const text = JSON.stringify(partnersPage);
    expect(text).not.toMatch(/себестоим|выручк|товарооборот|млн сум/i);
  });
});

describe("партнёрский раздел — только по ссылке", () => {
  it("ответ несёт X-Robots-Tag: noindex", async () => {
    const rules = await nextConfig.headers!();
    // /partners/o/:key несёт только Cache-Control — noindex ему даёт /partners/:path*.
    const forPartners = rules.filter((r) => r.source.includes("partners") && !r.source.includes("/o/"));
    expect(forPartners.length).toBeGreaterThanOrEqual(2);
    expect(rules.some((r) => r.source === "/:locale(ru|uz|en)/partners/:path*")).toBe(true);
    for (const r of forPartners) expect(r.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex, nofollow" });
  });

  it("адреса с опечатками из рассылки ведут на /partners, «adminparters» — в админку", async () => {
    const redirects = await nextConfig.redirects!();
    for (const alias of ["parters", "cabinetpartners"]) {
      expect(redirects).toContainEqual(
        expect.objectContaining({ source: `/:locale(ru|uz|en)/${alias}`, destination: "/:locale/partners" }),
      );
    }
    expect(redirects).toContainEqual(
      expect.objectContaining({ source: "/:locale(ru|uz|en)/adminparters", destination: "/:locale/adminpartners" }),
    );
  });

  it("админка и персональные страницы — noindex и не кэшируются чужими прокси", async () => {
    const rules = await nextConfig.headers!();
    const admin = rules.filter((r) => r.source.includes("adminpartners"));
    expect(admin).toHaveLength(2);
    for (const r of admin) {
      expect(r.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex, nofollow" });
      expect(r.headers).toContainEqual({ key: "Cache-Control", value: "private, no-store" });
    }
    expect(rules.find((r) => r.source.endsWith("/partners/o/:key"))?.headers).toContainEqual({ key: "Cache-Control", value: "private, no-store" });
  });

  it("в robots.txt админку не светим — её защищают noindex и пароль", async () => {
    const fs = await import("node:fs");
    expect(fs.readFileSync("src/app/robots.ts", "utf8")).not.toContain("adminpartners");
  });

  it("страницы нет в карте сайта и в навигации", async () => {
    const fs = await import("node:fs");
    expect(fs.readFileSync("src/app/sitemap.ts", "utf8")).not.toContain("/partners");
    expect(fs.readFileSync("src/content/navigation.ts", "utf8")).not.toContain("/partners");
  });
});
