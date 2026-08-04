import { chromium } from "playwright";
import fs from "node:fs";

const SP = process.argv[2];
const env = Object.fromEntries(
  fs
    .readFileSync(SP, "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1);
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return [l.slice(0, i), v];
    }),
);

const pwFromEnv = env.ADMIN_PASSWORD;
console.log("ADMIN_PASSWORD from Vercel, raw JSON:", JSON.stringify(pwFromEnv));

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
});

async function tryLogin(pw, label) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto("https://chimgan-uslugi.vercel.app/admin", { waitUntil: "networkidle" });
  const before = (await p.locator("body").innerText()).slice(0, 200).replace(/\s+/g, " ");
  console.log(`[${label}] before login, body starts: ${before}`);
  await p.fill('input[name="password"]', pw);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(4000);
  const after = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  console.log(`[${label}] after login, FULL body: ${after}`);
  const controls = await p.$$eval("button, a, input, textarea", (els) =>
    els.map((e) => (e.innerText || e.getAttribute("name") || e.tagName).trim()).filter(Boolean),
  );
  console.log(`[${label}] controls: ${JSON.stringify(controls)}`);
  await ctx.close();
}

await tryLogin("tIajiHYpUPgn", "documented-pw");
if (pwFromEnv && pwFromEnv !== "tIajiHYpUPgn") await tryLogin(pwFromEnv, "vercel-pw");

// homepage control enumeration
await page.goto("https://chimgan-uslugi.vercel.app/", { waitUntil: "networkidle" });
const home = await page.$$eval("button, a, form, input", (els) =>
  els.map((e) => `${e.tagName}:${(e.innerText || "").trim().slice(0, 40)}`),
);
console.log("HOME controls:", JSON.stringify(home));
console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
