/**
 * Regenerates src/content/policies-legal.ts from the operator's Word documents.
 *
 * The three legal texts are authored in Word by the operator's lawyer and
 * handed over as .docx. Hand-transcribing them is how the site ended up, on
 * 2026-08-05, telling guests their prepayment was non-refundable while the
 * signed policy granted a full refund five days out. So the transcription is a
 * script now: point it at the .docx files and the page content is derived, not
 * retyped.
 *
 * Usage:
 *   node scripts/build-legal.js <оферта.docx> <возврат.docx> <конфиденциальность.docx>
 *
 * A .docx is a ZIP whose word/document.xml holds the body; paragraphs are <w:p>
 * and text runs are <w:t>. Nothing else in these documents needs interpreting —
 * no tables, no images.
 */
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const OUT = path.join(__dirname, "..", "src", "content", "policies-legal.ts");

// ── docx → plain paragraphs ──────────────────────────────────────────────────

function zipRead(buf, wanted) {
  let i = 0;
  while (i < buf.length - 4) {
    if (buf.readUInt32LE(i) !== 0x04034b50) {
      i++;
      continue;
    }
    const method = buf.readUInt16LE(i + 8);
    const compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nameLen).toString("utf8");
    const dataStart = i + 30 + nameLen + extraLen;
    if (name === wanted) {
      const data = compSize ? buf.slice(dataStart, dataStart + compSize) : buf.slice(dataStart);
      if (method === 0) return data;
      return zlib.inflateRawSync(data, compSize ? {} : { finishFlush: zlib.constants.Z_SYNC_FLUSH });
    }
    i = dataStart + (compSize || 1);
  }
  throw new Error(`entry not found in zip: ${wanted}`);
}

function paragraphs(file) {
  const xml = zipRead(fs.readFileSync(file), "word/document.xml").toString("utf8");
  return [...xml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)]
    .map((m) =>
      [...m[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
        .map((r) => r[1])
        .join("")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/ /g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

// ── операторский час заезда поверх документа ─────────────────────────────────

/**
 * Час заезда берётся у оператора, а не из .docx.
 *
 * Юрист выпустил оферту с 14:00 (пп. 1, 2.5, 4.2 и Правила пребывания 4.1,
 * плюс расчёт раннего заезда в 5.2.1). Оператор 2026-08-08, зная про это
 * расхождение, попросил на сайте 15:00. Оставить сайт на 15:00, а оферту на
 * 14:00 нельзя: оферту гость акцептует при бронировании, и противоречие
 * толкуется против нас.
 *
 * Поэтому час подменяется здесь — и КРИЧИТ об этом в консоль при каждой
 * пересборке. Молча вернуть 14:00 при следующем обновлении документов было бы
 * худшим из возможных поведений: сайт разъехался бы с самим собой, и никто не
 * понял бы, почему.
 *
 * Убрать этот блок, как только придёт .docx с 15:00.
 */
const OPERATOR_CHECK_IN = "15:00";
const DOCUMENT_CHECK_IN = "14:00";
let overridden = 0;

function enforceCheckIn(text) {
  if (!text.includes(DOCUMENT_CHECK_IN)) return text;
  const out = text.split(DOCUMENT_CHECK_IN).join(OPERATOR_CHECK_IN);
  overridden += text.split(DOCUMENT_CHECK_IN).length - 1;
  return out;
}

// ── paragraphs → sections ────────────────────────────────────────────────────

/** "1.ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ" or "1. ТЕРМИНЫ..." — a numbered ALL-CAPS heading. */
const HEADING = /^(\d{1,2})\.\s*([А-ЯЁA-Z][А-ЯЁA-Z\s,«»()\-–—0-9.]{4,})$/;
/** Standalone caps headings that carry no number (appendix titles). */
const BARE_HEADING = /^(ПРИЛОЖЕНИЕ|ПРАВИЛА ПРЕБЫВАНИЯ)/;

function sectionise(paras, { preambleTitle }) {
  const sections = [];
  let current = { title: preambleTitle, items: [] };
  let prefix = "";

  for (const p of paras) {
    if (BARE_HEADING.test(p)) {
      // The appendix restarts numbering at 1, so its sections get a prefix or
      // they collide with the agreement's own sections in the page outline.
      if (current.items.length) sections.push(current);
      if (/^ПРИЛОЖЕНИЕ/.test(p)) {
        prefix = "Приложение № 1. ";
        current = { title: p, items: [] };
        continue;
      }
      current = { title: p, items: [] };
      continue;
    }
    const m = p.match(HEADING);
    if (m && p.length < 120) {
      if (current.items.length) sections.push(current);
      current = { title: `${prefix}${m[1]}. ${m[2].trim()}`, items: [] };
      continue;
    }
    // Re-space the "6.4.При отмене" style the converter produces.
    current.items.push(enforceCheckIn(p.replace(/^(\d+(?:\.\d+)*)\.(?=[^\s\d])/, "$1. ")));
  }
  if (current.items.length) sections.push(current);
  return sections;
}

// ── emit ─────────────────────────────────────────────────────────────────────

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const ind = (n) => " ".repeat(n);

function emitPage({ slug, title, description, sections }) {
  const body = sections
    .map(
      (s) =>
        `${ind(6)}{ title: L("${esc(s.title)}"), items: LL([\n` +
        s.items.map((i) => `${ind(8)}"${esc(i)}",`).join("\n") +
        `\n${ind(6)}]) },`,
    )
    .join("\n");
  return (
    `${ind(2)}{\n` +
    `${ind(4)}slug: "${slug}",\n` +
    `${ind(4)}indexable: true,\n` +
    `${ind(4)}title: L("${esc(title)}"),\n` +
    `${ind(4)}description: L("${esc(description)}"),\n` +
    `${ind(4)}sections: [\n${body}\n${ind(4)}],\n` +
    `${ind(2)}},`
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

const [offerDoc, refundDoc, privacyDoc] = process.argv.slice(2);
if (!offerDoc || !refundDoc || !privacyDoc) {
  console.error("usage: node scripts/build-legal.js <оферта.docx> <возврат.docx> <конфиденциальность.docx>");
  process.exit(1);
}

const PAGES = [
  {
    file: refundDoc,
    slug: "payment-refund",
    title: "Политика возврата и отмены",
    description:
      "Порядок изменения и отмены бронирований и возврата денежных средств. Горный курорт CHIMGAN DARBAZA.",
    preambleTitle: "Общие положения",
  },
  {
    file: privacyDoc,
    slug: "privacy-policy",
    title: "Политика конфиденциальности",
    description:
      "Порядок обработки и защиты персональных данных пользователей сайта и гостей курорта CHIMGAN DARBAZA.",
    preambleTitle: "Общие положения",
  },
  {
    file: offerDoc,
    slug: "public-offer",
    title: "Публичная оферта",
    description:
      "Условия оказания услуг размещения и дневного отдыха на территории горного курорта CHIMGAN DARBAZA.",
    preambleTitle: "Общие положения",
  },
];

const built = PAGES.map((p) => {
  const paras = paragraphs(p.file);
  const sections = sectionise(paras, { preambleTitle: p.preambleTitle });
  const items = sections.reduce((n, s) => n + s.items.length, 0);
  console.log(`${p.slug.padEnd(16)} ${String(sections.length).padStart(2)} разделов, ${items} пунктов  ← ${path.basename(p.file)}`);
  return emitPage({ ...p, sections });
});

const header = `import type { PolicyPage } from "./policies";

/* ─────────────────────────────────────────────────────────────────────────────
   ГЕНЕРИРУЕМЫЙ ФАЙЛ — НЕ ПРАВИТЬ РУКАМИ.

   Собран из .docx оператора командой:
     node scripts/build-legal.js "<оферта>" "<возврат>" "<конфиденциальность>"

   Юридические тексты пишет юрист оператора в Word. Ручной перенос уже один раз
   разошёлся с оригиналом: 5 августа 2026 сайт утверждал, что предоплата
   невозвратная, тогда как подписанная политика давала полный возврат за 5 суток
   до заезда. Поэтому текст теперь выводится из документа, а не перепечатывается.

   Тексты составлены на русском; по оферте русская редакция имеет юридическую
   силу, поэтому L()/LL() отдают один и тот же русский текст на всех локалях.
   ───────────────────────────────────────────────────────────────────────────── */
const L = (s: string) => ({ ru: s, uz: s, en: s });
const LL = (a: string[]) => ({ ru: a, uz: a, en: a });

export const legalPolicies: PolicyPage[] = [
`;

fs.writeFileSync(OUT, header + built.join("\n") + "\n];\n", "utf8");
console.log(`\n→ ${path.relative(path.join(__dirname, ".."), OUT)}`);

if (overridden) {
  console.log(
    `\n${"!".repeat(72)}\n` +
      `ВНИМАНИЕ: час заезда подменён ${overridden} раз(а): ` +
      `${DOCUMENT_CHECK_IN} в документе → ${OPERATOR_CHECK_IN} на сайте.\n` +
      `Присланная оферта всё ещё говорит ${DOCUMENT_CHECK_IN}. Опубликованный текст\n` +
      `отличается от файла юриста — нужна новая редакция .docx, после чего блок\n` +
      `enforceCheckIn в этом скрипте надо удалить.\n` +
      `${"!".repeat(72)}`,
  );
}
