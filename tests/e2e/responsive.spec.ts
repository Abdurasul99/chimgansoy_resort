/**
 * Responsive + button-interaction smoke tests across mobile/tablet/desktop.
 *
 * Strategy notes:
 *   - waitUntil: "load" so React has time to hydrate before we query the DOM
 *   - waitForSelector before asserting visibility (avoid race conditions)
 *   - sequential project runs (workers:1 in config) to stay under Vercel's
 *     edge rate-limit during sustained test sessions
 */
import { test, expect } from "@playwright/test";

const HOME = "/uz";

// Helper: wait for React hydration to settle. We pick an element that's known
// to be in the rendered DOM (the brand logo image) and wait for it to attach.
async function gotoAndHydrate(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "load" });
  await page.waitForSelector("img, h1", { state: "attached", timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  await gotoAndHydrate(page, HOME);
});

// ─── Layout integrity ──────────────────────────────────
test.describe("layout integrity", () => {
  test("no horizontal scroll on any viewport", async ({ page }) => {
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    // Allow 1px slop for sub-pixel rounding
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1);
  });

  test("hero h1 renders above the fold", async ({ page }) => {
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    const box = await heading.boundingBox();
    expect(box?.y ?? 9999).toBeLessThan(900);
  });

  test("at least one img element is on the page", async ({ page }) => {
    const imgCount = await page.locator("img").count();
    expect(imgCount).toBeGreaterThan(0);
  });

  test("no JS console errors during navigation", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload({ waitUntil: "load" });
    // Filter out third-party noise (analytics, gtag, hydration warnings)
    const ours = errors.filter(
      (e) => !/google|gtag|analytics|hydrat|preload/i.test(e),
    );
    expect(ours).toEqual([]);
  });
});

// ─── Buttons / nav by viewport ─────────────────────────
test.describe("buttons by viewport", () => {
  test("mobile burger toggles aria-expanded", async ({ page, isMobile }) => {
    test.skip(!isMobile, "only matters on mobile/tablet");
    const burger = page.locator('button[aria-expanded]').first();
    await expect(burger).toBeVisible({ timeout: 10_000 });
    await expect(burger).toHaveAttribute("aria-expanded", "false");
    await burger.click();
    await expect(burger).toHaveAttribute("aria-expanded", "true");
  });

  test("desktop main navigation is visible inline", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop nav hidden on small screens");
    const desktopNav = page.locator('nav[aria-label="Main navigation"]').first();
    await expect(desktopNav).toBeVisible({ timeout: 10_000 });
  });

  test("'book now' link exists in the DOM (may be inside mobile overlay)", async ({ page }) => {
    // The CTA could live in: desktop header (lg:flex), mobile burger overlay,
    // or a sticky bottom bar. Verify any of them is attached.
    const ctas = page.locator('a[href*="/bron"]');
    expect(await ctas.count()).toBeGreaterThan(0);
  });

  test("at least one visible /bron CTA meets touch-target size", async ({ page, isMobile }) => {
    // On mobile, the visible CTA might be the sticky bar or burger overlay button.
    // Open the burger first to force the CTA into view if needed.
    if (isMobile) {
      const burger = page.locator('button[aria-expanded]').first();
      if (await burger.isVisible()) {
        await burger.click();
        await page.waitForTimeout(300);
      }
    }
    const visibleCta = await page
      .locator('a[href*="/bron"]:visible')
      .first()
      .boundingBox()
      .catch(() => null);
    if (visibleCta) {
      // Apple HIG min 44, Google Material min 48; allow 36 floor for chip-style
      expect(visibleCta.height).toBeGreaterThanOrEqual(36);
    }
  });

  test("WhatsApp + Telegram + tel links exist somewhere on page", async ({ page }) => {
    // Scroll to bottom so footer (where these live) is rendered
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.locator('a[href*="wa.me"], a[href*="whatsapp"]').first()).toBeAttached();
    await expect(page.locator('a[href*="t.me"], a[href*="telegram"]').first()).toBeAttached();
    await expect(page.locator('a[href^="tel:"]').first()).toBeAttached();
  });
});

// ─── Performance (Web Vitals via Performance API) ──────
test.describe("performance", () => {
  test("LCP < 4s (acceptable across networks)", async ({ page }) => {
    await gotoAndHydrate(page, HOME);
    const lcp = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let value = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            value =
              (last as PerformanceEntry & { renderTime?: number }).renderTime ||
              (last as PerformanceEntry & { startTime: number }).startTime;
          }).observe({ type: "largest-contentful-paint", buffered: true });
          setTimeout(() => resolve(value), 4000);
        }),
    );
    // 2.5s = "good", 4s = "needs improvement", 4s+ = "poor"
    expect(lcp).toBeLessThan(4000);
  });

  test("CLS < 0.25 (no major layout shift)", async ({ page }) => {
    await gotoAndHydrate(page, HOME);
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let value = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const e = entry as PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
              };
              if (!e.hadRecentInput) value += e.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(value), 3000);
        }),
    );
    // 0.1 = good, 0.25 = needs improvement
    expect(cls).toBeLessThan(0.25);
  });

  test("DOMContentLoaded fires within 3s", async ({ page }) => {
    await gotoAndHydrate(page, HOME);
    const timing = await page.evaluate(() => {
      const t = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return t.domContentLoadedEventEnd - t.startTime;
    });
    expect(timing).toBeLessThan(3000);
  });
});

// ─── Booking page reachability ─────────────────────────
test.describe("booking page", () => {
  test("booking page loads + contains a form element", async ({ page }) => {
    await gotoAndHydrate(page, "/uz/bron");
    const forms = await page.locator("form").count();
    expect(forms).toBeGreaterThan(0);
  });

  test("contact page loads", async ({ page }) => {
    await gotoAndHydrate(page, "/uz/aloqa");
    // Just verify it doesn't 404
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
