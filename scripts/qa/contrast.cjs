// axe color-contrast across key pages; groups violations by colors + class signature.
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const B = process.argv[2];
const PAGES = (process.argv[3] || "/ru,/ru/nomera,/ru/nomera/cottage,/ru/bron,/ru/tubing,/ru/contact,/ru/about,/ru/services,/ru/restaurant,/uz,/ru/place").split(",");
(async () => {
  const b = await chromium.launch();
  const groups = new Map();
  for (const w of [1440, 390]) for (const path of PAGES) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(B + path, { waitUntil: "load" });
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(40); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
    const r = await new AxeBuilder({ page: p }).withRules(["color-contrast"]).analyze();
    for (const v of r.violations) for (const n of v.nodes) {
      const m = ((n.any[0] || {}).message || "").match(/of ([\d.]+) \(foreground color: (#\w+), background color: (#\w+), font size: ([\d.]+pt)/);
      const text = await p.locator(n.target[0]).first().innerText().catch(() => "");
      const cls = (n.html.match(/class="([^"]*)"/) || [])[1] || n.html.slice(0, 60);
      const key = m ? `${m[2]} on ${m[3]} (${m[1]}:1, ${m[4]})` : "?";
      if (!groups.has(key)) groups.set(key, new Map());
      const g = groups.get(key); const k2 = cls.slice(0, 110);
      if (!g.has(k2)) g.set(k2, { pages: new Set(), text: text.replace(/\s+/g, " ").slice(0, 40) });
      g.get(k2).pages.add(`${path}@${w}`);
    }
    await ctx.close();
  }
  for (const [k, g] of groups) {
    console.log(`\n## ${k}`);
    for (const [cls, v] of g) console.log(`  «${v.text}»  ${cls}\n      ${[...v.pages].slice(0, 5).join(" ")}`);
  }
  await b.close();
})();
