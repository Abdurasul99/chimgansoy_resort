// Summarize crawl report: group identical issues across widths/locales.
const r = require(process.argv[2]);
const groups = new Map();
const add = (kind, msg, e) => {
  const k = kind + "|" + msg;
  if (!groups.has(k)) groups.set(k, { kind, msg, hits: [] });
  groups.get(k).hits.push(`${e.loc}${e.r || "/"}@${e.w}`);
};
const status = {};
for (const e of r) {
  status[e.status] = (status[e.status] || 0) + 1;
  if (e.fatal) add("FATAL", e.fatal, e);
  for (const k of ["overflow", "clipped", "brokenImg", "errors", "failed", "rawText"]) for (const v of e[k] || []) add(k, v.replace(/\[\-?\d+\.\.\d+\]/, "[..]").replace(/\(\d+>\d+\)/, ""), e);
  if (e.loc !== "ru") for (const v of e.cyrillic || []) add("cyrillic-" + e.loc, v, e);
  if (e.w < 768) for (const v of e.tinyTargets || []) add("tiny", v.replace(/ \d+x\d+$/, ""), e);
  if (e.lang !== e.loc && e.status === 200) add("lang-attr", `html lang=${e.lang}`, e);
  if (e.status === 200 && (!e.h1 || e.h1.length !== 1)) add("h1", `h1 count ${e.h1 ? e.h1.length : 0}: ${(e.h1 || []).join(" / ").slice(0, 80)}`, e);
}
console.log("statuses:", JSON.stringify(status), "pages:", r.length);
const order = ["FATAL", "errors", "failed", "overflow", "brokenImg", "clipped", "rawText", "lang-attr", "h1", "cyrillic-uz", "cyrillic-en", "tiny"];
const filter = process.argv[3];
for (const kind of order) {
  if (filter && !filter.split(",").includes(kind)) continue;
  const list = [...groups.values()].filter((g) => g.kind === kind).sort((a, b) => b.hits.length - a.hits.length);
  if (!list.length) continue;
  console.log(`\n### ${kind} (${list.length} distinct)`);
  for (const g of list.slice(0, kind.startsWith("cyrillic") ? 60 : 25)) {
    const widths = [...new Set(g.hits.map((h) => h.split("@")[1]))].sort((a, b) => a - b).join(",");
    const pages = [...new Set(g.hits.map((h) => h.split("@")[0]))];
    console.log(`- [${g.hits.length}× w=${widths}] ${g.msg.slice(0, 150)}\n    pages: ${pages.slice(0, 6).join(" ")}${pages.length > 6 ? ` …+${pages.length - 6}` : ""}`);
  }
}
