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
/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS maintenance script */
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

// ── paragraph processing ─────────────────────────────────────────────────────

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
    current.items.push(p.replace(/^(\d+(?:\.\d+)*)\.(?=[^\s\d])/, "$1. "));
  }
  if (current.items.length) sections.push(current);
  return sections;
}

/**
 * Aligns the Public Offer's tubing appendix with the operator's 13.08.2026
 * rules for the actual 100 cm tubes. The signed Word offer predates those
 * parameters, so regenerating it must not restore the obsolete 120 cm rule or
 * the emergency braking exception.
 */
function applyOfferTubingAmendment(sections) {
  const tubing = sections.find((section) =>
    section.title.includes("6. ПРАВИЛА ПОЛЬЗОВАНИЯ ВСЕСЕЗОННОЙ ТЮБИНГ-ГОРКОЙ"),
  );
  if (!tubing) throw new Error("public offer tubing appendix not found");

  tubing.items = [
    "6.1. Всесезонная тюбинг-горка (далее — Горка) представляет собой специально оборудованный спуск, оснащённый безопасной зоной остановки и механической лентой обратного подъёма.",
    "6.2. Режим работы Горки устанавливается Исполнителем и публикуется на Сайте и на информационных стендах. Администрация вправе изменять режим работы в зависимости от погодных условий или проведения технических работ.",
    "6.3. Услуга предоставляется в формате пакетов спусков согласно Прейскуранту. Если Посетитель добровольно прекратил катание при исправной и доступной Горке, неиспользованные спуски не компенсируются и не переносятся. При невозможности оказания услуги по вине Исполнителя, небезопасном состоянии Горки или в иных случаях, предусмотренных законодательством, возврат и перенос осуществляются по разделу 6 Соглашения, Политике возврата и законодательству Республики Узбекистан.",
    "6.4. Диаметр тюбинга составляет 100 см. Максимальная нагрузка на один тюбинг — строго до 95 кг как при одиночном, так и при совместном спуске.",
    "6.4.1. На одном тюбинге разрешён спуск только одного человека, кроме совместного спуска одного взрослого с одним ребёнком по правилам настоящего раздела.",
    "6.4.2. Самостоятельный спуск ребёнка разрешается только при полном соответствии габаритам тюбинга диаметром 100 см — обычно ребёнок ростом от 140 см — и способности самостоятельно глубоко сесть, надёжно зафиксироваться и крепко держаться за ручки.",
    "6.4.3. Если ребёнок болтается внутри тюбинга, не дотягивается до ручек или не может крепко за них держаться, самостоятельный спуск запрещён. Допускается только совместный спуск с одним совершеннолетним сопровождающим.",
    "6.4.4. При совместном спуске ребёнок садится первым лицом по ходу движения, взрослый — позади и обязан надёжно удерживать ребёнка, контролировать спуск и крепко держаться за ручки.",
    "6.4.5. Суммарный вес взрослого и ребёнка при совместном спуске не должен превышать 95 кг.",
    "6.4.6. Дети младше 4 лет к спуску не допускаются.",
    "6.5. К спуску не допускаются лица в состоянии алкогольного, наркотического или токсического опьянения; беременные женщины; лица с медицинскими противопоказаниями к активным нагрузкам; лица в одежде или обуви, создающей угрозу безопасности.",
    "6.6. Посетитель самостоятельно оценивает состояние своего здоровья и сопровождаемого ребёнка. Это условие не освобождает Исполнителя от обязанности обеспечивать безопасность услуги и исправность оборудования в соответствии с законодательством Республики Узбекистан.",
    "6.7. До спуска Посетитель обязан оплатить пакет либо подтвердить право на него, ознакомиться с настоящими Правилами, прослушать инструктаж оператора и выполнять его законные требования.",
    "6.8. Начинать спуск можно только после разрешения оператора, когда трасса и зона выката полностью освобождены от предыдущих посетителей. Оператор может разрешить одновременный параллельный спуск группы до 5 человек только по отдельным безопасным траекториям и с соблюдением дистанции.",
    "6.9. Спуск допускается исключительно сидя лицом по ходу движения. Посетитель обязан глубоко сесть в центральное углубление, откинуться назад, крепко держаться обеими руками за боковые ручки, слегка приподнять ноги и не касаться ими трассы.",
    "6.10. Запрещается спускаться стоя, на коленях, на четвереньках, на животе, лёжа, спиной или головой вперёд; тормозить руками или ногами; раскачивать или переворачивать тюбинг; связывать или сцеплять тюбинги в «паровозик»; держаться за руки при параллельном спуске; отталкиваться друг от друга или от бортов; держать посторонние предметы; покидать тюбинг до полной остановки.",
    "6.11. Посетитель, начинающий спуск, обязан дождаться разрешения оператора и свободной трассы. Ответственность Посетителя за столкновение наступает при наличии его виновного нарушения настоящих Правил и не исключает ответственность Исполнителя за недостатки услуги, оборудования, организации движения или виновные действия персонала.",
    "6.12. После полной остановки Посетитель обязан незамедлительно встать и покинуть зону выката вместе с тюбингом. Возвращаться вверх по трассе спуска запрещено. При вынужденной остановке или падении необходимо как можно быстрее переместиться к краю и подать сигнал оператору.",
    "6.13. Возврат на старт осуществляется только на механической ленте или по иному безопасному маршруту, указанному персоналом. Запрещается препятствовать работе ленты и касаться движущихся механизмов вне предусмотренной зоны.",
    "6.14. Выносить тюбинг за пределы специально выделенной трассы Горки запрещается.",
    "6.15. Посетитель возмещает документально подтверждённый прямой ущерб тюбингу, причинённый по его вине. Факт и размер ущерба оформляются в порядке раздела 9 Соглашения и Прейскуранта.",
    "6.16. Исполнитель не отвечает за последствия, вызванные исключительно виновным нарушением Посетителем настоящих Правил, сокрытием медицинских противопоказаний или действиями третьих лиц, за которых Исполнитель не отвечает, — только в пределах, допускаемых законодательством. Настоящий пункт не ограничивает ответственность Исполнителя за небезопасную или недоброкачественную услугу, неисправный инвентарь, недостатки организации Горки либо виновные действия персонала.",
    "6.17. Оператор вправе отказать в спуске при угрозе безопасности, остановить нарушение, удалить нарушителя с трассы и приостановить работу Горки из-за опасной погоды, неисправности или необходимости обслуживания.",
    "6.18. Лица, игнорирующие законные требования оператора или создающие угрозу безопасности, удаляются с территории Горки. Вопрос возврата неиспользованной части услуги решается по разделу 6 Соглашения, Политике возврата и законодательству Республики Узбекистан.",
  ];

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
    `${ind(4)}sections: [\n${body}${slug === "public-offer" ? `\n${ind(6)}tubing100cmOfferSection,` : ""}\n${ind(4)}],\n` +
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
  const rawSections = sectionise(paras, { preambleTitle: p.preambleTitle });
  const sections = p.slug === "public-offer" ? applyOfferTubingAmendment(rawSections) : rawSections;
  const items = sections.reduce((n, s) => n + s.items.length, 0);
  console.log(`${p.slug.padEnd(16)} ${String(sections.length).padStart(2)} разделов, ${items} пунктов  ← ${path.basename(p.file)}`);
  return emitPage({ ...p, sections });
});

const header = `import type { PolicyPage } from "./policies";
import { tubing100cmOfferSection } from "./tubing-100cm-rules";

/* ─────────────────────────────────────────────────────────────────────────────
   ГЕНЕРИРУЕМЫЙ ФАЙЛ — НЕ ПРАВИТЬ РУКАМИ.

   Собран из .docx оператора командой:
     node scripts/build-legal.js "<оферта>" "<возврат>" "<конфиденциальность>"

   Юридические тексты пишет юрист оператора в Word. Ручной перенос уже один раз
   разошёлся с оригиналом: 5 августа 2026 сайт утверждал, что предоплата
   невозвратная, тогда как подписанная политика давала полный возврат за 5 суток
   до заезда. Поэтому текст теперь выводится из документа, а не перепечатывается.

   Основные DOCX составлены на русском; L()/LL() отдают этот текст на всех
   локалях. Дополнение от 13.08.2026 о тюбингах диаметром 100 см встроено
   генератором, а его ключевые правила опубликованы также на узбекском и
   английском языках.
   ───────────────────────────────────────────────────────────────────────────── */
const L = (s: string) => ({ ru: s, uz: s, en: s });
const LL = (a: string[]) => ({ ru: a, uz: a, en: a });

export const legalPolicies: PolicyPage[] = [
`;

fs.writeFileSync(OUT, header + built.join("\n") + "\n];\n", "utf8");
console.log(`\n→ ${path.relative(path.join(__dirname, ".."), OUT)}`);
