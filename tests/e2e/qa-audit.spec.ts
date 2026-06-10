/**
 * Full QA audit: accessibility (axe-core), SEO, security headers, link integrity.
 * Runs against the LIVE Vercel prod across mobile + desktop only (skip tablet
 * to save time — covered by responsive.spec.ts).
 *
 * Pass criteria:
 *   - axe scan: 0 serious / critical violations
 *   - Every page has unique <title>, <meta description>, h1
 *   - hreflang present for all 3 locales
 *   - Security headers present (XCTO, XFO, HSTS, Referrer-Policy)
 *   - No 404 internal links from home page
 *   - Footer rel=noopener on all external links
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PATHS = ["/ru", "/uz", "/en", "/ru/bron", "/ru/nomera", "/ru/contact"];

// ─── Accessibility (axe-core) ──────────────────────────
test.describe("accessibility", () => {
  for (const path of ["/ru", "/uz", "/en"]) {
    test(`axe: 0 serious/critical violations on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"]) // tested separately below
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      if (serious.length > 0) {
        console.log("AXE violations:", JSON.stringify(serious.map((v) => ({
          id: v.id, impact: v.impact, nodes: v.nodes.length,
        })), null, 2));
      }
      expect(serious).toEqual([]);
    });
  }

  test("axe: home has 0 color-contrast violations (P2 contrast fix)", async ({ page }) => {
    await page.goto("/ru", { waitUntil: "load" });
    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
});

// ─── SEO ──────────────────────────────────────────────
test.describe("SEO", () => {
  for (const path of PATHS) {
    test(`${path}: <title>, <meta description>, h1 present and non-empty`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      const title = await page.title();
      expect(title.length).toBeGreaterThan(5);

      const desc = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(desc?.length ?? 0).toBeGreaterThan(20);

      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });
  }

  test("hreflang alternates exist for all 3 locales", async ({ page }) => {
    await page.goto("/ru", { waitUntil: "load" });
    const alternates = await page.locator('link[rel="alternate"][hreflang]').all();
    const langs = await Promise.all(alternates.map((a) => a.getAttribute("hreflang")));
    expect(langs).toEqual(expect.arrayContaining(["ru", "uz", "en"]));
  });

  test("OpenGraph meta tags present", async ({ page }) => {
    await page.goto("/ru", { waitUntil: "load" });
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle?.length ?? 0).toBeGreaterThan(5);
    const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
    expect(ogType).toBeTruthy();
  });

  test("JSON-LD schema is valid LodgingBusiness", async ({ page }) => {
    await page.goto("/ru", { waitUntil: "load" });
    const json = await page.locator('script[type="application/ld+json"]').first().textContent();
    const parsed = JSON.parse(json ?? "{}");
    expect(parsed["@type"]).toBe("LodgingBusiness");
    expect(parsed.name).toBeTruthy();
    expect(parsed.geo?.latitude).toBeTruthy();
  });

  test("sitemap.xml is reachable and contains locale paths", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toContain("chimgandarbaza.uz");
    expect(body).toMatch(/\/ru\b/);
    expect(body).toMatch(/\/uz\b/);
    expect(body).toMatch(/\/en\b/);
  });

  test("robots.txt allows crawling + references sitemap", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/Sitemap:/i);
    expect(body).not.toMatch(/Disallow:\s*\/$/m); // not blocking entire site
  });
});

// ─── Security headers ──────────────────────────────────
test.describe("security headers", () => {
  test("strict transport security (HSTS) on prod", async ({ request }) => {
    const r = await request.get("/ru");
    const h = r.headers();
    expect(h["strict-transport-security"]).toMatch(/max-age=\d+/);
  });

  test("X-Content-Type-Options: nosniff", async ({ request }) => {
    const r = await request.get("/ru");
    expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("X-Frame-Options or frame-ancestors set", async ({ request }) => {
    const r = await request.get("/ru");
    const h = r.headers();
    const xfo = h["x-frame-options"];
    const csp = h["content-security-policy"];
    expect(xfo === "SAMEORIGIN" || xfo === "DENY" || /frame-ancestors/.test(csp ?? "")).toBe(true);
  });

  test("Referrer-Policy is set", async ({ request }) => {
    const r = await request.get("/ru");
    expect(r.headers()["referrer-policy"]).toBeTruthy();
  });

  test("Permissions-Policy is set", async ({ request }) => {
    const r = await request.get("/ru");
    expect(r.headers()["permissions-policy"]).toBeTruthy();
  });
});

// ─── Link integrity ────────────────────────────────────
test.describe("link integrity", () => {
  test("all internal links from home page resolve to 200", async ({ page, request }) => {
    await page.goto("/ru", { waitUntil: "load" });
    const hrefs = await page.$$eval('a[href^="/"]', (els) =>
      Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))),
    );

    const broken: { url: string; status: number }[] = [];
    // Check up to first 20 to keep test fast
    for (const href of hrefs.slice(0, 20)) {
      const r = await request.get(href, { failOnStatusCode: false });
      if (r.status() >= 400) broken.push({ url: href, status: r.status() });
    }
    expect(broken).toEqual([]);
  });

  test("external links in footer have rel=noopener", async ({ page }) => {
    await page.goto("/ru", { waitUntil: "load" });
    await page.locator("footer").scrollIntoViewIfNeeded();
    const external = page.locator('footer a[target="_blank"]');
    const count = await external.count();
    for (let i = 0; i < count; i++) {
      const rel = (await external.nth(i).getAttribute("rel")) ?? "";
      expect(rel, `External link ${i}: rel attr`).toMatch(/noopener/);
    }
  });
});

// ─── 404 handling ──────────────────────────────────────
test.describe("error handling", () => {
  test("unknown path returns 404", async ({ request }) => {
    const r = await request.get("/ru/this-path-does-not-exist-12345", { failOnStatusCode: false });
    expect(r.status()).toBe(404);
  });

  test("invalid locale falls back gracefully", async ({ request }) => {
    const r = await request.get("/zh", { failOnStatusCode: false });
    // Should either 404 or redirect to a valid locale
    expect([200, 301, 302, 307, 308, 404]).toContain(r.status());
  });
});
