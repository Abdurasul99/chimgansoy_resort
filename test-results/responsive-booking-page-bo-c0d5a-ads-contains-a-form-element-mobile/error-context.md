# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive.spec.ts >> booking page >> booking page loads + contains a form element
- Location: tests\e2e\responsive.spec.ts:175:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Asosiy qismga o'tish" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "CHIMGAN DARBAZA Resort" [ref=e5] [cursor=pointer]:
        - /url: /uz
        - img "CHIMGAN DARBAZA Resort" [ref=e8]
      - button "Menyu" [ref=e9]:
        - generic [ref=e10]: Menyu
        - img [ref=e11]
  - generic:
    - generic:
      - generic:
        - img
      - button:
        - img
    - navigation:
      - list:
        - listitem:
          - link:
            - /url: /uz
            - text: Bosh sahifa
        - listitem:
          - link:
            - /url: /uz/nomera
            - text: Xonalar
        - listitem:
          - link:
            - /url: /uz/services
            - text: Xizmatlar
        - listitem:
          - link:
            - /url: /uz/about
            - text: Joy haqida
        - listitem:
          - link:
            - /url: /uz/place
            - text: Atrofdagi joylar
        - listitem:
          - link:
            - /url: /uz/contact
            - text: Aloqa
    - generic:
      - link:
        - /url: /uz/bron
        - text: Bron qilish
      - generic:
        - link:
          - /url: tel:+998701760011
          - text: +998 70 176 00 11
        - generic:
          - link:
            - /url: /uz/bron
            - text: UZ
          - link:
            - /url: /ru/bron
            - text: RU
          - link:
            - /url: /en/bron
            - text: EN
  - main [ref=e13]:
    - region "Dam olishni bron qilish" [ref=e14]:
      - img "Yashil maysazordagi tayyor A-frame glemping" [ref=e15]
      - generic [ref=e18]:
        - paragraph [ref=e19]: CHIMGAN DARBAZA
        - heading "Dam olishni bron qilish" [level=1] [ref=e20]
        - paragraph [ref=e21]: Sanalarni tanlang va bron qiling — bronni tasdiqlaymiz va barcha savollarga javob beramiz.
    - generic [ref=e26]:
      - iframe [ref=e27]:
        - generic [ref=f3e2]:
          - img [ref=f3e3]
          - paragraph [ref=f3e8]: Sayohatingizdan manfaat oling — saytmizda bron qiling
      - iframe [ref=e28]:
        
  - alert [ref=e29]
```

# Test source

```ts
  78  | 
  79  |   test("'book now' link exists in the DOM (may be inside mobile overlay)", async ({ page }) => {
  80  |     // The CTA could live in: desktop header (lg:flex), mobile burger overlay,
  81  |     // or a sticky bottom bar. Verify any of them is attached.
  82  |     const ctas = page.locator('a[href*="/bron"]');
  83  |     expect(await ctas.count()).toBeGreaterThan(0);
  84  |   });
  85  | 
  86  |   test("at least one visible /bron CTA meets touch-target size", async ({ page, isMobile }) => {
  87  |     // On mobile, the visible CTA might be the sticky bar or burger overlay button.
  88  |     // Open the burger first to force the CTA into view if needed.
  89  |     if (isMobile) {
  90  |       const burger = page.locator('button[aria-expanded]').first();
  91  |       if (await burger.isVisible()) {
  92  |         await burger.click();
  93  |         await page.waitForTimeout(300);
  94  |       }
  95  |     }
  96  |     const visibleCta = await page
  97  |       .locator('a[href*="/bron"]:visible')
  98  |       .first()
  99  |       .boundingBox()
  100 |       .catch(() => null);
  101 |     if (visibleCta) {
  102 |       // Apple HIG min 44, Google Material min 48; allow 36 floor for chip-style
  103 |       expect(visibleCta.height).toBeGreaterThanOrEqual(36);
  104 |     }
  105 |   });
  106 | 
  107 |   test("WhatsApp + Telegram + tel links exist somewhere on page", async ({ page }) => {
  108 |     // Scroll to bottom so footer (where these live) is rendered
  109 |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  110 |     await page.waitForTimeout(500);
  111 |     await expect(page.locator('a[href*="wa.me"], a[href*="whatsapp"]').first()).toBeAttached();
  112 |     await expect(page.locator('a[href*="t.me"], a[href*="telegram"]').first()).toBeAttached();
  113 |     await expect(page.locator('a[href^="tel:"]').first()).toBeAttached();
  114 |   });
  115 | });
  116 | 
  117 | // ─── Performance (Web Vitals via Performance API) ──────
  118 | test.describe("performance", () => {
  119 |   test("LCP < 4s (acceptable across networks)", async ({ page }) => {
  120 |     await gotoAndHydrate(page, HOME);
  121 |     const lcp = await page.evaluate(
  122 |       () =>
  123 |         new Promise<number>((resolve) => {
  124 |           let value = 0;
  125 |           new PerformanceObserver((list) => {
  126 |             const entries = list.getEntries();
  127 |             const last = entries[entries.length - 1];
  128 |             value =
  129 |               (last as PerformanceEntry & { renderTime?: number }).renderTime ||
  130 |               (last as PerformanceEntry & { startTime: number }).startTime;
  131 |           }).observe({ type: "largest-contentful-paint", buffered: true });
  132 |           setTimeout(() => resolve(value), 4000);
  133 |         }),
  134 |     );
  135 |     // 2.5s = "good", 4s = "needs improvement", 4s+ = "poor"
  136 |     expect(lcp).toBeLessThan(4000);
  137 |   });
  138 | 
  139 |   test("CLS < 0.25 (no major layout shift)", async ({ page }) => {
  140 |     await gotoAndHydrate(page, HOME);
  141 |     const cls = await page.evaluate(
  142 |       () =>
  143 |         new Promise<number>((resolve) => {
  144 |           let value = 0;
  145 |           new PerformanceObserver((list) => {
  146 |             for (const entry of list.getEntries()) {
  147 |               const e = entry as PerformanceEntry & {
  148 |                 value: number;
  149 |                 hadRecentInput: boolean;
  150 |               };
  151 |               if (!e.hadRecentInput) value += e.value;
  152 |             }
  153 |           }).observe({ type: "layout-shift", buffered: true });
  154 |           setTimeout(() => resolve(value), 3000);
  155 |         }),
  156 |     );
  157 |     // 0.1 = good, 0.25 = needs improvement
  158 |     expect(cls).toBeLessThan(0.25);
  159 |   });
  160 | 
  161 |   test("DOMContentLoaded fires within 3s", async ({ page }) => {
  162 |     await gotoAndHydrate(page, HOME);
  163 |     const timing = await page.evaluate(() => {
  164 |       const t = performance.getEntriesByType(
  165 |         "navigation",
  166 |       )[0] as PerformanceNavigationTiming;
  167 |       return t.domContentLoadedEventEnd - t.startTime;
  168 |     });
  169 |     expect(timing).toBeLessThan(3000);
  170 |   });
  171 | });
  172 | 
  173 | // ─── Booking page reachability ─────────────────────────
  174 | test.describe("booking page", () => {
  175 |   test("booking page loads + contains a form element", async ({ page }) => {
  176 |     await gotoAndHydrate(page, "/uz/bron");
  177 |     const forms = await page.locator("form").count();
> 178 |     expect(forms).toBeGreaterThan(0);
      |                   ^ Error: expect(received).toBeGreaterThan(expected)
  179 |   });
  180 | 
  181 |   test("contact page loads", async ({ page }) => {
  182 |     await gotoAndHydrate(page, "/uz/aloqa");
  183 |     // Just verify it doesn't 404
  184 |     const title = await page.title();
  185 |     expect(title.length).toBeGreaterThan(0);
  186 |   });
  187 | });
  188 | 
```