// UI QA crawl: every route × locale × width. Writes JSON report + screenshots.
// Usage: node crawl.cjs <baseURL> <outDir> [widths] [locales] [--no-images] [--content-only]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.argv[2];
const OUT = process.argv[3];
const WIDTHS = (process.argv[4] || "320,360,390,414,768,1024,1280,1440,1920").split(",").map(Number);
const LOCALES = (process.argv[5] || "ru,uz,en").split(",");
const NO_IMAGES = process.argv.includes("--no-images");
const CONTENT_ONLY = process.argv.includes("--content-only");
const SHOT_WIDTHS = new Set([320, 390, 768, 1440]);
const ROUTES = [
  "", "/about", "/bron", "/contact", "/nomera", "/nomera/cottage", "/nomera/glamping", "/nomera/pool",
  "/place", "/restaurant", "/services", "/services/tubing", "/services/pool", "/services/restaurant",
  "/services/experience", "/services/outdoor-cooking", "/services/picnic-zone", "/tubing", "/topchan",
  "/novosti", "/partners",
  "/legal/payment-refund", "/legal/pool-rules", "/legal/privacy-policy", "/legal/public-offer",
  "/legal/sertifikat", "/legal/tubing-rules", "/legal/accommodation-rules", "/legal/how-to-get-there",
  "/legal/resort-visiting-rules", "/legal/user-agreement",
  "/legal/stay-rules", "/no-such-page",
];
fs.mkdirSync(path.join(OUT, "shots"), { recursive: true });

async function inspect(page, locale, width) {
  return page.evaluate(({ locale, width, contentOnly }) => {
    const res = {};
    const de = document.documentElement;
    res.lang = de.getAttribute("lang");
    res.title = document.title;
    res.desc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    res.h1 = [...document.querySelectorAll("h1")].filter((h) => h.offsetParent !== null || getComputedStyle(h).position === "fixed").map((h) => h.innerText.trim().slice(0, 80));
    const vw = de.clientWidth;
    res.scrollWidth = de.scrollWidth; res.clientWidth = vw;
    const visible = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const clippedByAncestor = (el) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (["hidden", "auto", "scroll", "clip"].includes(cs.overflowX)) {
          const r = a.getBoundingClientRect();
          if (r.right <= vw + 1 && r.left >= -1) return true;
        }
        if (cs.position === "fixed") return true;
      }
      return false;
    };
    const sel = (el) => {
      let s = el.tagName.toLowerCase();
      if (el.id) s += "#" + el.id;
      const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).slice(0, 3).join(".");
      if (cls) s += "." + cls;
      const t = (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return t ? `${s} «${t}»` : s;
    };
    if (!contentOnly) {
      // Horizontal overflow and its sources
      res.overflow = [];
      if (de.scrollWidth > vw + 1) {
        const all = [...document.body.querySelectorAll("*")];
        const off = all.filter((el) => {
          const r = el.getBoundingClientRect();
          return (r.right > vw + 1 || r.left < -1) && visible(el) && !clippedByAncestor(el) && getComputedStyle(el).position !== "fixed";
        });
        // keep outermost offenders only
        const outer = off.filter((el) => !off.includes(el.parentElement));
        res.overflow = outer.slice(0, 6).map((el) => { const r = el.getBoundingClientRect(); return `${sel(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`; });
      }
      // Text that does not fit its own box (clipped)
      res.clipped = [];
      for (const el of document.body.querySelectorAll("a,button,label,h1,h2,h3,h4,p,span,li,td,th,summary,strong,b")) {
        if (!visible(el) || el.children.length > 3 || el.closest(".sr-only")) continue;
        const cs = getComputedStyle(el);
        if (!["hidden", "clip"].includes(cs.overflowX) && !["hidden", "clip"].includes(cs.overflow)) continue;
        if (cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none" && cs.webkitLineClamp) continue;
        if (el.scrollWidth > el.clientWidth + 2 && (el.innerText || "").trim().length > 1) res.clipped.push(sel(el) + ` (${el.scrollWidth}>${el.clientWidth})`);
      }
      res.clipped = res.clipped.slice(0, 8);
      // Broken images
      res.brokenImg = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src") && !i.getAttribute("src").startsWith("data:") && visible(i)).map((i) => i.currentSrc || i.src).slice(0, 8);
      res.noAlt = [...document.images].filter((i) => !i.hasAttribute("alt")).map((i) => i.src).slice(0, 5);
      // Interactive elements narrower/lower than 24px on touch widths
      if (width < 768) {
        res.tinyTargets = [...document.querySelectorAll("a[href],button,input,select,summary,[role=button]")]
          .filter((el) => { if (!visible(el)) return false; const r = el.getBoundingClientRect(); return (r.width < 24 || r.height < 24) && !el.closest("p,li,td") ; })
          .map((el) => { const r = el.getBoundingClientRect(); return `${sel(el)} ${Math.round(r.width)}x${Math.round(r.height)}`; }).slice(0, 8);
      }
    }
    // Content checks
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const cyr = new Set(), raw = new Set();
    for (let n; (n = walker.nextNode()); ) {
      const t = n.nodeValue.replace(/\s+/g, " ").trim();
      if (!t) continue;
      const p = n.parentElement;
      if (!p || ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(p.tagName)) continue;
      if (p.closest("[lang]:not(html)")?.getAttribute("lang")?.startsWith("ru")) continue;
      if (!visible(p) && getComputedStyle(p).display === "none") continue;
      if (locale !== "ru" && /[А-Яа-яЁё]/.test(t)) cyr.add(t.slice(0, 120));
      if (/\b(undefined|NaN|\[object Object\])\b/.test(t) || /\b(home|nav|footer|booking|common|dict)\.[a-z][A-Za-z]+\b/.test(t)) raw.add(t.slice(0, 120));
    }
    // Cyrillic in attributes that users see (alt, placeholder, aria-label, title)
    if (locale !== "ru") for (const el of document.querySelectorAll("[alt],[placeholder],[aria-label],[title]")) {
      for (const a of ["alt", "placeholder", "aria-label", "title"]) { const v = el.getAttribute(a); if (v && /[А-Яа-яЁё]/.test(v)) cyr.add(`@${a}: ${v.slice(0, 100)}`); }
    }
    if (locale !== "ru" && /[А-Яа-яЁё]/.test(document.title + res.desc)) cyr.add(`@meta: ${document.title} | ${res.desc.slice(0, 80)}`);
    res.cyrillic = [...cyr].slice(0, 40);
    res.rawText = [...raw].slice(0, 10);
    return res;
  }, { locale, width, contentOnly: CONTENT_ONLY });
}

(async () => {
  for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE + "/ru"); if (r.ok) break; } catch {} await new Promise((r) => setTimeout(r, 1000)); }
  const browser = await chromium.launch();
  const report = [];
  const jobs = [];
  for (const w of WIDTHS) for (const loc of LOCALES) for (const r of ROUTES) jobs.push({ w, loc, r });
  let done = 0;
  const contexts = {};
  const ctxFor = async (w) => {
    if (!contexts[w]) {
      contexts[w] = await browser.newContext({ viewport: { width: w, height: w < 768 ? 800 : 900 }, isMobile: w < 768, hasTouch: w < 1024, deviceScaleFactor: 1, reducedMotion: "reduce" });
      if (NO_IMAGES) await contexts[w].route(/\.(png|jpe?g|webp|avif|gif|mp4|webm|woff2?)(\?|$)/i, (rt) => rt.abort());
    }
    return contexts[w];
  };
  async function run(job) {
    const { w, loc, r } = job;
    const url = `${BASE}/${loc}${r}`;
    const ctx = await ctxFor(w);
    const page = await ctx.newPage();
    const errors = [], failed = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
    page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
    page.on("response", (resp) => { const u = resp.url(); if (resp.status() >= 400 && u.startsWith(BASE) && u !== url && !u.includes("/blob/")) failed.push(`${resp.status()} ${u.replace(BASE, "")}`); });
    page.on("requestfailed", (rq) => { const f = rq.failure()?.errorText || ""; if (!/ERR_ABORTED|ERR_FAILED/.test(f) || !NO_IMAGES) if (!/ERR_ABORTED/.test(f)) failed.push(`FAIL ${f} ${rq.url().slice(0, 120)}`); });
    let status = 0, entry = { url, w, loc, r };
    try {
      const resp = await page.goto(url, { waitUntil: "load", timeout: 45000 });
      status = resp ? resp.status() : 0;
      if (!CONTENT_ONLY) {
        // scroll through to trigger lazy images and reveal animations
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < h; y += 700) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
      } else await page.waitForTimeout(300);
      Object.assign(entry, { status }, await inspect(page, loc, w));
      if (!CONTENT_ONLY && SHOT_WIDTHS.has(w) && (loc === "ru" || (loc === "uz" && w === 320))) {
        const name = `${loc}${r.replace(/\//g, "_") || "_home"}-${w}.jpg`;
        await page.screenshot({ path: path.join(OUT, "shots", name), fullPage: true, type: "jpeg", quality: 60 }).catch(() => {});
      }
    } catch (e) { entry.status = status; entry.fatal = e.message.slice(0, 200); }
    entry.errors = [...new Set(errors)].slice(0, 10);
    entry.failed = [...new Set(failed)].slice(0, 10);
    report.push(entry);
    await page.close();
    if (++done % 25 === 0) console.log(`${done}/${jobs.length}`);
  }
  const CONC = 3;
  let idx = 0;
  await Promise.all(Array.from({ length: CONC }, async () => { while (idx < jobs.length) { const j = jobs[idx++]; await run(j); } }));
  await browser.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
  console.log("done", report.length);
})();
