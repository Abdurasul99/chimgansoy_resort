// Фоновые фото: у каждого элемента с фоном картинка реально загрузилась,
// и сколько весят картинки страницы. node scripts/qa/bg-check.cjs <base> [страницы]
const { chromium } = require("playwright");
const B = process.argv[2] || "http://localhost:3123";
const PAGES = (process.argv[3] || "/ru,/uz/nomera,/ru/nomera/cottage,/en/tubing,/ru/about,/ru/place").split(",");
(async () => {
  for (let i = 0; i < 90; i++) { try { if ((await fetch(B + "/ru")).ok) break; } catch {} await new Promise((r) => setTimeout(r, 1000)); }
  const b = await chromium.launch();
  for (const [label, vp] of [["390", { width: 390, height: 844, isMobile: true }], ["1440", { width: 1440, height: 900 }]]) {
    for (const path of PAGES) {
      const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile });
      const p = await ctx.newPage();
      let bytes = 0, n = 0; const bad = [];
      p.on("response", async (r) => {
        const ct = r.headers()["content-type"] || "";
        if (/image/.test(ct)) { n++; bytes += Number(r.headers()["content-length"] || 0); }
        if (r.status() >= 400 && /_next\/image|\/images\//.test(r.url())) bad.push(`${r.status()} ${r.url().slice(-80)}`);
      });
      await p.goto(B + path, { waitUntil: "load" });
      const h = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 800) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(80); }
      await p.waitForTimeout(1500);
      // каждый элемент с --bg-sm: вычисленный background-image — адрес оптимизатора нужной ширины
      const bg = await p.evaluate((w) => {
        const els = [...document.querySelectorAll('[style*="--bg-sm"]')];
        const want = w < 640 ? "w=1080" : "w=1920";
        const wrong = els.filter((e) => { const v = getComputedStyle(e).backgroundImage; return !(v.includes(want) || v.includes("/blob/") || v.startsWith("url(\"http")); }).length;
        return { total: els.length, wrong };
      }, vp.width);
      console.log(`${label.padStart(4)} ${path.padEnd(20)} фонов ${String(bg.total).padStart(3)}, не той ширины ${bg.wrong}, картинок ${n}, ${Math.round(bytes / 1024)} КБ${bad.length ? "  ОШИБКИ: " + bad.slice(0, 3).join("; ") : ""}`);
      await ctx.close();
    }
  }
  await b.close();
})();
