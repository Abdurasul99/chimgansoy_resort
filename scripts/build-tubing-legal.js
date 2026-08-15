/**
 * Regenerates the tubing rules page from the operator's Word document.
 *
 * Usage:
 *   node scripts/build-tubing-legal.js "C:\\path\\to\\Правила тюбинга.docx"
 *
 * The source is intentionally not transcribed by hand. Besides avoiding legal
 * copy drift, the emitted SHA-256 lets every accepted request name the exact
 * DOCX edition the guest agreed to.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS maintenance script */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "src", "content", "policies-tubing-legal.ts");

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

function decodeXml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#xA0;|&#160;| /g, " ");
}

function paragraphText(xml) {
  const parts = [];
  const tokens = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:(br|tab)\b[^>]*\/>/g;
  for (const match of xml.matchAll(tokens)) {
    if (match[1] !== undefined) parts.push(decodeXml(match[1]));
    else parts.push(match[2] === "br" ? "\n" : "\t");
  }
  return parts.join("").replace(/[ \t]+/g, " ").trim();
}

/**
 * Word stores many visually separate numbered lines in one paragraph. Split
 * only at explicit line breaks, known metadata labels, and a following legal
 * sub-clause number; no words or punctuation are rewritten.
 */
function logicalLines(text) {
  const labels = [
    "Место утверждения:",
    "Исполнитель:",
    "ИНН:",
    "Адрес:",
    "Телефон справочной линии:",
    "E-mail:",
    "Сайт:",
    "Режим работы службы приёма и размещения:",
    "Посещение Горки означает согласие",
  ];
  let expanded = text;
  for (const label of labels) {
    expanded = expanded.replaceAll(label, `\n${label}`);
  }

  return expanded
    .split(/\n+/)
    // Negative lookbehind prevents a second split inside 1.4.1. (at 4.1.).
    .flatMap((line) => line.split(/(?<!\d\.)(?=(?:\d{1,2}\.){2,3}\s*[А-ЯЁA-Zа-яёa-z])/))
    .map((line) => line.trim())
    .filter(Boolean);
}

function paragraphs(buffer) {
  const xml = zipRead(buffer, "word/document.xml").toString("utf8");
  return [...xml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)]
    .flatMap((match) => logicalLines(paragraphText(match[1])))
    .filter(Boolean);
}

const HEADING = /^(\d{1,2})\.\s*([А-ЯЁA-Z][А-ЯЁA-Z\s,«»()\-–—0-9.]{4,})$/;

function sectionise(paras) {
  const sections = [];
  let current = { title: "Документ и реквизиты", items: [] };

  for (const paragraph of paras) {
    const heading = paragraph.match(HEADING);
    if (heading && paragraph.length < 140) {
      if (current.items.length) sections.push(current);
      current = { title: `${heading[1]}. ${heading[2].trim()}`, items: [] };
      continue;
    }
    current.items.push(paragraph.replace(/^(\d+(?:\.\d+)*)\.(?=[^\s\d])/, "$1. "));
  }
  if (current.items.length) sections.push(current);

  // In sections 10–19 Word stores the first digit of each item number in a
  // separate line ("1" + "0.1. ..."). Rejoin those fragments so the public
  // page shows 10.1, 11.1 … instead of stray bullet points containing "1".
  for (const section of sections) {
    const sectionNumber = section.title.match(/^(\d{2})\./)?.[1];
    if (!sectionNumber) continue;
    const repaired = [];
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      const next = section.items[i + 1];
      if (item === sectionNumber[0] && next?.startsWith(`${sectionNumber[1]}.`)) {
        repaired.push(`${item}${next}`);
        i++;
      } else {
        repaired.push(item);
      }
    }
    section.items = repaired;
  }

  return sections;
}

/**
 * The operator's 13.08.2026 amendment specifies the actual 100 cm inventory.
 * It supersedes the older generic passages extracted from the DOCX wherever
 * diameter, load, child fit or riding position differ. Keeping the amendment
 * in the generator prevents a future DOCX regeneration from restoring the
 * obsolete 120 cm / chain / lying-down permissions.
 */
function applyOperatorAmendment(sections) {
  const byNumber = (number) => sections.find((section) => section.title.startsWith(`${number}. `));
  const document = sections.find((section) => section.title === "Документ и реквизиты");

  if (document) {
    document.items = document.items.flatMap((item) => {
      if (item === "Редакция № 1") {
        return [
          "Редакция № 2",
          "Дополнение от 13.08.2026: технические ограничения для тюбингов диаметром 100 см.",
        ];
      }
      return [item];
    });
  }

  const admission = byNumber(4);
  if (!admission) throw new Error("section 4 not found for tubing amendment");
  admission.items = [
    "4.1. К пользованию Горкой допускаются Посетители в возрасте от 4 лет при соблюдении требований настоящих Правил.",
    "4.2. Самостоятельный спуск ребёнка разрешается только тогда, когда ребёнок полностью соответствует габаритам тюбинга диаметром 100 см — обычно это рост от 140 см. Ребёнок должен самостоятельно глубоко сесть, надёжно зафиксироваться внутри тюбинга и без напряжения крепко держаться за ручки.",
    "4.3. Если ребёнок болтается внутри тюбинга, не дотягивается до ручек или не может крепко за них держаться, самостоятельный спуск запрещён. Допускается только совместный спуск с одним совершеннолетним сопровождающим на одном тюбинге.",
    "4.4. При совместном спуске ребёнок садится первым лицом по ходу движения, взрослый — позади. Взрослый обязан надёжно удерживать ребёнка ногами и руками, контролировать спуск и крепко держаться за ручки.",
    "4.5. Суммарный вес взрослого и ребёнка при совместном спуске не должен превышать 95 кг.",
    "4.6. Дети младше 4 лет к спуску с Горки не допускаются.",
    "4.7. На одном тюбинге допускается не более одного взрослого и одного ребёнка; в остальных случаях на одном тюбинге разрешён спуск только одного человека.",
    "4.8. На стартовой площадке одновременно разрешается нахождение не более 6 человек, если Администрацией не установлены иные ограничения.",
    "4.9. Одновременное количество лиц, находящихся на трассе в процессе спуска, не должно превышать 6 человек, если Администрация не установила иной порядок для отдельных полос, режимов работы или специальных сеансов.",
    "4.10. Оператор Горки вправе ограничить допуск, изменить количество одновременно спускающихся лиц, приостановить работу Горки либо полностью запретить спуск при наличии признаков угрозы жизни, здоровью, имуществу Посетителей или третьих лиц.",
    "4.11. Посетитель обязан по требованию оператора Горки сообщить возраст, рост, вес и состояние здоровья, а также подтвердить отсутствие медицинских противопоказаний. При наличии сомнений в безопасности спуска Посетитель обязан отказаться от пользования Горкой.",
    "4.12. Администрация вправе отказать в допуске к Горке без компенсации стоимости услуги в случаях несоблюдения возрастных, ростовых, весовых или иных требований безопасности; наличия признаков опьянения или опасного состояния здоровья; отказа выполнять требования персонала; использования запрещённого или неисправного инвентаря; неблагоприятных погодных условий; технического обслуживания, ремонта, закрытия Горки или нарушения настоящих Правил.",
  ];

  const equipment = byNumber(6);
  if (!equipment) throw new Error("section 6 not found for tubing amendment");
  equipment.items = [
    "6.1. Для спуска с Горки разрешается использовать только специально предназначенный инвентарь, допущенный Администрацией горного курорта «CHIMGAN DARBAZA».",
    "6.2. Диаметр используемого тюбинга составляет 100 см.",
    "6.3. Максимальная нагрузка на один тюбинг — строго до 95 кг как при одиночном, так и при совместном спуске взрослого с ребёнком.",
    "6.4. Допущенный инвентарь должен быть исправным, устойчивым, не иметь разрывов, трещин, острых краёв, торчащих элементов, повреждённых ручек и утечки воздуха.",
    "6.5. Посетитель обязан до начала спуска убедиться в безопасности инвентаря и при обнаружении дефектов немедленно сообщить оператору Горки.",
    "6.6. Администрация вправе проверить любой инвентарь и запретить его использование, если он не соответствует требованиям безопасности, может причинить вред или повредить покрытие Горки.",
    "6.7. Запрещается использовать санки и их разновидности без отдельного разрешения Администрации; лыжи, сноуборды, снегокаты, скейтборды, самокаты, велосипеды и иной транспорт; картон, плёнку, пакеты, пластиковые листы и самодельные устройства; надувные матрасы, круги и плавательные средства; инвентарь с острыми, металлическими, твёрдыми или повреждёнными элементами; иной инвентарь, способный повредить покрытие или создать опасность.",
  ];

  const descent = byNumber(8);
  if (!descent) throw new Error("section 8 not found for tubing amendment");
  descent.items = [
    "8.1. Подъём на Горку осуществляется только по специально предназначенному маршруту, лестнице, подъёмному элементу либо иному маршруту, указанному персоналом.",
    "8.2. При подъёме инвентарь должен находиться у Посетителя таким образом, чтобы не мешать другим Посетителям и не создавать опасность.",
    "8.3. Запрещается подниматься или спускаться бегом, толкаться, создавать давку, мешать персоналу и другим Посетителям.",
    "8.4. Запрещается свешиваться через элементы безопасности, перелезать через ограждения, заходить за ограничительные конструкции и находиться в служебных зонах.",
    "8.5. На стартовой площадке запрещается создавать очереди, толкаться, мешать другим Посетителям и персоналу, начинать спуск без разрешения оператора Горки.",
    "8.6. Перед началом спуска Посетитель обязан убедиться, что трасса и зона выката полностью свободны, а спуск разрешён оператором Горки.",
    "8.7. Спуск разрешается только после получения разрешения оператора Горки, при свободной трассе и достаточной дистанции от предыдущего Посетителя.",
    "8.8. Правильная посадка: исключительно сидя лицом по ходу движения. Посетитель должен глубоко сесть в центральное углубление, откинуться назад, крепко держаться обеими руками за боковые ручки, слегка приподнять ноги и не касаться ими трассы.",
    "8.9. При совместном спуске ребёнок садится первым лицом по ходу движения, взрослый — позади и удерживает ребёнка, контролируя спуск и крепко держась за ручки. Суммарный вес не должен превышать 95 кг.",
    "8.10. Запрещается начинать спуск, если на Горке, трассе или в зоне выката находятся люди, животные, предметы или иные препятствия.",
    "8.11. Категорически запрещается спускаться стоя, на коленях, на четвереньках, на животе, лёжа, спиной или головой вперёд; тормозить руками или ногами; сцеплять или связывать тюбинги; держаться за руки во время параллельного спуска; отталкиваться друг от друга; спускаться с животными, крупными, острыми или посторонними предметами.",
  ];

  const prohibitions = byNumber(10);
  if (!prohibitions) throw new Error("section 10 not found for tubing amendment");
  prohibitions.items = prohibitions.items.map((item) =>
    item === "10.12. толкать других Посетителей, сталкивать их с Горки, создавать помехи для движения;"
      ? "10.12. толкать других Посетителей, отталкиваться друг от друга, держаться за руки при параллельном спуске, сталкивать других с Горки или создавать помехи для движения;"
      : item,
  );

  return sections;
}

const esc = (value) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

function emitSections(sections) {
  return sections
    .map(
      (section) =>
        `    {\n      title: L("${esc(section.title)}"),\n      items: LL([\n` +
        section.items.map((item) => `        "${esc(item)}",`).join("\n") +
        "\n      ]),\n    },",
    )
    .join("\n");
}

const source = process.argv[2];
if (!source) {
  console.error('usage: node scripts/build-tubing-legal.js "<правила тюбинга.docx>"');
  process.exit(1);
}

const buffer = fs.readFileSync(source);
const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
const sections = applyOperatorAmendment(sectionise(paragraphs(buffer)));
const numbered = sections.filter((section) => /^\d+\.\s/.test(section.title));
if (numbered.length !== 19) {
  throw new Error(`expected 19 numbered sections, got ${numbered.length}`);
}

const output = `import type { PolicyPage } from "./policies";
import { tubing100cmPolicySections, tubing100cmRulesVersion } from "./tubing-100cm-rules";

/* ─────────────────────────────────────────────────────────────────────────────
   ГЕНЕРИРУЕМЫЙ ФАЙЛ — НЕ ПРАВИТЬ РУКАМИ.

   Источник: Правила тюбинга.docx
   Команда: node scripts/build-tubing-legal.js "<Правила тюбинга.docx>"
   SHA-256 источника: ${sha256}

   Основа предоставлена оператором в DOCX. Дополнение от 13.08.2026 о тюбингах
   диаметром 100 см встроено генератором и имеет приоритет в части диаметра,
   нагрузки, посадки, допуска детей и совместного спуска. Ключевые ограничения
   дополнительно опубликованы на русском, узбекском и английском языках.
   ───────────────────────────────────────────────────────────────────────────── */
const L = (value: string) => ({ ru: value, uz: value, en: value });
const LL = (value: string[]) => ({ ru: value, uz: value, en: value });

export const tubingRulesVersion = {
  ...tubing100cmRulesVersion,
  sha256: "${sha256}",
} as const;

export const tubingLegalPolicy: PolicyPage = {
  slug: "tubing-rules",
  indexable: true,
  title: {
    ru: "Правила тюбинговой горки",
    uz: "Tubing gorkasidan foydalanish qoidalari",
    en: "Tubing hill rules",
  },
  description: {
    ru: "Правила пользования и требования безопасности на всесезонной тюбинговой горке CHIMGAN DARBAZA.",
    uz: "CHIMGAN DARBAZA tubing gorkasidan foydalanish va xavfsizlik qoidalari. Rasmiy matn rus tilida.",
    en: "Use and safety rules for the CHIMGAN DARBAZA all-season tubing hill. The official text is in Russian.",
  },
  sections: [
    ...tubing100cmPolicySections,
${emitSections(sections)}
  ],
};
`;

fs.writeFileSync(OUT, output, "utf8");
console.log(`tubing-rules ${numbered.length} numbered sections, ${sections.reduce((sum, section) => sum + section.items.length, 0)} items`);
console.log(`SHA-256 ${sha256}`);
console.log(`→ ${path.relative(path.join(__dirname, ".."), OUT)}`);
