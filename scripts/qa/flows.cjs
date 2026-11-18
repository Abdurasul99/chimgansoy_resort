// Functional QA flows against a local build (delivery disabled). Prints PASS/FAIL per check.
const { chromium } = require("playwright");
const B = process.argv[2] || "http://localhost:3123";
const OUT = process.argv[3];
const results = [];
const check = (name, ok, info = "") => { results.push({ name, ok, info }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`); };

(async () => {
  for (let i = 0; i < 90; i++) { try { const r = await fetch(B + "/ru"); if (r.ok) break; } catch {} await new Promise((r) => setTimeout(r, 1000)); }
  const browser = await chromium.launch();
  const mobile = () => browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const desktop = () => browser.newContext({ viewport: { width: 1440, height: 900 } });

  // 1. Honest 404s and localized not-found
  for (const [p, want] of [["/ru/legal/stay-rules", 404], ["/uz/nomera/penthouse", 404], ["/en/legal/no-doc", 404], ["/ru/nomeraa", 404], ["/uz/about/extra", 200], ["/ru/legal/public-offer", 200], ["/uz/nomera/cottage", 200], ["/en/nomera/pool", 200]]) {
    const r = await fetch(B + p, { redirect: "manual" });
    check(`статус ${p} = ${want}`, r.status === want, `получено ${r.status}`);
  }
  {
    const ctx = await mobile(); const pg = await ctx.newPage();
    await pg.goto(B + "/uz/nomera/penthouse");
    const h1 = await pg.locator("h1").first().innerText();
    const home = await pg.locator("a", { hasText: /Bosh sahifaga/ }).first().getAttribute("href");
    check("404 на /uz — по-узбекски и ведёт на /uz", /topilmadi/i.test(h1) && home === "/uz", `h1="${h1}", ссылка=${home}`);
    await ctx.close();
  }

  // 2. No hydration errors on home in every locale (fresh build = the stale-date case)
  for (const loc of ["ru", "uz", "en"]) for (const mk of [mobile, desktop]) {
    const ctx = await mk(); const pg = await ctx.newPage(); const errs = [];
    pg.on("pageerror", (e) => errs.push(e.message.slice(0, 120)));
    await pg.goto(`${B}/${loc}`, { waitUntil: "load" }); await pg.waitForTimeout(2500);
    check(`без ошибок JS: /${loc} ${mk === mobile ? "390" : "1440"}`, errs.length === 0, errs.join(" | "));
    await ctx.close();
  }

  // 3. Weather date renders after hydration, in Uzbek format
  {
    const ctx = await desktop(); const pg = await ctx.newPage();
    await pg.goto(`${B}/uz`, { waitUntil: "load" });
    await pg.waitForFunction(() => /d{1,2}-noyabr|d{1,2}-dekabr/.test(document.body.innerText), null, { timeout: 8000 }).catch(() => {});
    const txt = await pg.evaluate(() => document.body.innerText);
    check("дата в виджете погоды на /uz — «17-noyabr, …»", /\b\d{1,2}-(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)\b/i.test(txt));
    await ctx.close();
  }

  // 4. Mobile menu opens, fits, closes
  for (const loc of ["ru", "uz"]) {
    const ctx = await mobile(); const pg = await ctx.newPage();
    await pg.goto(`${B}/${loc}/nomera`, { waitUntil: "load" }); await pg.waitForTimeout(800);
    const burger = pg.locator("button[aria-expanded]").first();
    await burger.click(); await pg.waitForTimeout(600);
    const nav = pg.locator('nav[aria-label="Mobile navigation"]');
    const vis = await nav.isVisible();
    const box = vis ? await nav.boundingBox() : null;
    const links = vis ? await nav.locator("a").count() : 0;
    check(`мобильное меню /${loc}: открылось, ${links} ссылок, в пределах экрана`, vis && links >= 4 && box.x >= 0 && box.x + box.width <= 391, JSON.stringify(box));
    await pg.keyboard.press("Escape"); await pg.waitForTimeout(500);
    const closed = !(await nav.isVisible()) || (await burger.getAttribute("aria-expanded")) === "false";
    check(`мобильное меню /${loc}: закрывается Escape`, closed);
    await ctx.close();
  }

  // 5. Language switch keeps the page
  {
    const ctx = await desktop(); const pg = await ctx.newPage();
    await pg.goto(`${B}/ru/nomera/cottage`, { waitUntil: "load" });
    const uzLink = pg.locator('[aria-label="Language switcher"] a', { hasText: /^uz$/i }).first();
    const href = await uzLink.getAttribute("href").catch(() => null);
    check("переключатель языка с /ru/nomera/cottage ведёт на /uz/nomera/cottage", href === "/uz/nomera/cottage", `href=${href}`);
    await ctx.close();
  }

  // 6. Room gallery + lightbox in Uzbek
  {
    const ctx = await mobile(); const pg = await ctx.newPage();
    await pg.goto(`${B}/uz/nomera/cottage`, { waitUntil: "load" }); await pg.waitForTimeout(800);
    const tile = pg.locator("button.cursor-zoom-in").first();
    const label = await tile.getAttribute("aria-label");
    check("галерея шале на /uz: подпись кадра по-узбекски", !!label && !/[А-Яа-яЁё]/.test(label), label);
    await tile.click(); await pg.waitForTimeout(700);
    const lb = pg.locator('[role="dialog"][aria-modal="true"]');
    const closeLabel = await lb.locator('button[aria-label="Yopish"]').count();
    check("полноэкранный просмотр на /uz: открыт, кнопка «Yopish»", (await lb.count()) > 0 && closeLabel > 0);
    await pg.keyboard.press("Escape"); await pg.waitForTimeout(1500);
    check("полноэкранный просмотр закрывается Escape", (await lb.count()) === 0);
    await ctx.close();
  }

  // 7. Exely failure state (CDN cert expired) — Uzbek copy + cabin links
  {
    const ctx = await mobile(); const pg = await ctx.newPage();
    // Exely то грузится, то нет (истёкший сертификат CDN) — отказ имитируем сами.
    await ctx.route(/hopenapi.com/, (r) => r.abort());
    await pg.goto(`${B}/uz/bron`, { waitUntil: "load" }); await pg.waitForTimeout(11000);
    const txt = await pg.evaluate(() => document.body.innerText);
    const hrefs = await pg.locator("a[href='/uz/nomera/glamping'], a[href='/uz/nomera/cottage']").count();
    check("/uz/bron без Exely: понятный текст и ссылки на заявки по домикам", /Onlayn bron hozircha ishlamayapti/.test(txt) && hrefs >= 2, `ссылок: ${hrefs}`);
    if (OUT) await pg.screenshot({ path: OUT + "/bron-fallback-uz-390.png" });
    await ctx.close();
  }

  // 8. Concierge launcher opens and closes
  {
    const ctx = await desktop(); const pg = await ctx.newPage();
    await pg.goto(`${B}/en`, { waitUntil: "load" }); await pg.waitForTimeout(3500);
    const launcher = pg.locator("button.cg-btn").first();
    await launcher.click(); await pg.waitForTimeout(800);
    const dialog = pg.locator('[role="dialog"]');
    const opened = (await dialog.count()) > 0 && (await dialog.first().isVisible());
    check("консьерж открывается", opened);
    await pg.keyboard.press("Escape"); await pg.waitForTimeout(700);
    check("консьерж закрывается Escape", (await dialog.count()) === 0 || !(await dialog.first().isVisible()));
    await ctx.close();
  }

  // 9. Stay request form: empty submit is blocked; filled submit gives a clear outcome
  // На боевом сайте заявку не отправляем — она ушла бы менеджерам в Telegram.
  if (!/chimgandarbaza\.uz/.test(B)) {
    const ctx = await mobile(); const pg = await ctx.newPage(); const errs = [];
    pg.on("pageerror", (e) => errs.push(e.message.slice(0, 120)));
    await pg.goto(`${B}/uz/nomera/glamping`, { waitUntil: "load" }); await pg.waitForTimeout(800);
    const form = pg.locator("form:has(input[name=checkin])").first();
    await form.scrollIntoViewIfNeeded();
    await form.locator("button[type=submit]").click(); await pg.waitForTimeout(500);
    const invalid = await form.evaluate((f) => !f.checkValidity());
    check("заявка на домик: пустую не отправить (обязательные поля)", invalid);
    await form.locator("input[name=name]").fill("QA Test");
    await form.locator("input[name=phone]").fill("+998 90 000 00 00");
    for (const cb of await form.locator("input[type=checkbox][required]").all()) await cb.check();
    await form.locator("button[type=submit]").click(); await pg.waitForTimeout(4000);
    const after = await pg.evaluate(() => document.body.innerText);
    const kept = await form.locator("input[name=name]").inputValue().catch(() => "");
    const keptConsent = await form.locator("input[type=checkbox][required]").first().isChecked().catch(() => false);
    check("заявка на домик: после ошибки имя и согласия не стёрты", kept === "QA Test" && keptConsent, `имя="${kept}", согласие=${keptConsent}`);
    const msg = after.match(/(Ariza qabul qilindi[^\n]*|Arizangiz[^\n]*|xato[^\n]*|sanalarni tanlang[^\n]*|sanasini tanlang[^\n]*|Sana[^\n]*kerak[^\n]*)/i)?.[0] || "";
    check("заявка на домик: после отправки гость видит понятный ответ", !!msg, msg.slice(0, 120));
    check("заявка на домик: без ошибок JS", errs.length === 0, errs.join(" | "));
    if (OUT) await form.screenshot({ path: OUT + "/stay-form-uz.png" }).catch(() => {});
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nИТОГО: ${results.length - failed} PASS, ${failed} FAIL`);
})();
