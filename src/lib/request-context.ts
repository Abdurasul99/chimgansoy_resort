/**
 * Контекст обращения — страница, с которой гость отправил заявку.
 *
 * Оператор получал «💬 Новый вопрос: имя, телефон» и звонил гостю выяснять, о
 * чём вопрос. Половину ответа даёт сам текст (в форме вопроса он теперь
 * обязателен), вторую — адрес страницы: «/ru/nomera/cottage» объясняет
 * обращение раньше, чем текст, и работает даже когда гость написал «здравствуйте».
 *
 * Поле приходит скрытым из формы, то есть от браузера, — значит доверять ему
 * нельзя. Отсюда обрезка по длине, экранирование на стороне вызова и запрет
 * всего, что не похоже на путь нашего же сайта: в сообщение оператору не должна
 * попасть чужая ссылка, по которой ему захочется кликнуть.
 */
const MAX = 120;

/** Путь вида «/ru/nomera/cottage?checkin=…» или пустая строка. */
export function pageContext(form: FormData): string {
  const raw = String(form.get("page") ?? "").trim();
  if (!raw) return "";
  // Только относительный путь: без схемы, без домена, без переводов строк.
  if (!/^\/[^\s]*$/.test(raw)) return "";
  if (raw.startsWith("//")) return "";
  return raw.slice(0, MAX);
}

/** Название раздела по пути — то, что оператор поймёт без чтения адреса. */
export function pageLabel(path: string): string {
  if (!path) return "";
  const p = path.split("?")[0].replace(/^\/(ru|uz|en)(?=\/|$)/, "") || "/";
  const KNOWN: Array<[RegExp, string]> = [
    [/^\/?$/, "главная"],
    [/^\/nomera\/pool/, "бассейн"],
    [/^\/nomera\/glamping/, "глэмпинг"],
    [/^\/nomera\/cottage/, "шале"],
    [/^\/nomera/, "номера"],
    [/^\/topchan/, "топчан"],
    [/^\/tubing/, "тюбинг"],
    [/^\/bron/, "бронирование"],
    [/^\/contact/, "контакты"],
    [/^\/services/, "услуги"],
    [/^\/place/, "окрестности"],
    [/^\/legal/, "документы"],
    [/^\/novosti/, "новости"],
  ];
  return KNOWN.find(([re]) => re.test(p))?.[1] ?? "";
}

/**
 * Готовая строка «Страница: шале (/ru/nomera/cottage)» или пустая.
 *
 * Метки utm из адреса выброшены: оператор читает эту строку глазами, а
 * «?utm_source=vizitka&utm_medium=bio&utm_campaign=instagram» — это три
 * технических слова, за которыми теряется само название страницы. Откуда
 * пришёл гость, отдельно и по-русски говорит trafficSource().
 */
export function pageLine(form: FormData): string {
  const path = pageContext(form);
  if (!path) return "";
  const [route, query = ""] = path.split("?");
  // Остальные параметры остаются: в них даты, гости и выбранный домик.
  const rest = new URLSearchParams(query);
  for (const key of [...rest.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || key.toLowerCase() === "gclid") rest.delete(key);
  }
  const tail = rest.toString();
  const shown = tail ? `${route}?${decodeURIComponent(tail)}` : route;
  const label = pageLabel(route);
  return label ? `${label} (${shown})` : shown;
}

/**
 * Откуда гость пришёл — словами, а не метками.
 *
 * В телеграм падало «utm_source=vizitka&utm_medium=bio&utm_campaign=instagram».
 * Прочитать это можно, но администратор на смене не обязан держать в голове,
 * что vizitka — это одностраничник из шапки профиля. Незнакомые метки
 * печатаются как есть: выдумывать им название хуже, чем показать сырое
 * значение.
 *
 * Значения приходят из браузера, поэтому чистятся так же, как путь.
 */
const TOKEN = (raw: string | null): string =>
  (raw ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);

/** Знакомые сочетания «источник|канал|кампания» целиком. */
const KNOWN_TRIPLETS: Record<string, string> = {
  "vizitka|bio|instagram": "визитка из шапки Instagram",
  "vizitka|bio|telegram": "визитка из шапки Telegram",
};

/** Знакомые названия по отдельности. */
const NAMES: Record<string, string> = {
  vizitka: "визитка",
  instagram: "Instagram",
  telegram: "Telegram",
  facebook: "Facebook",
  google: "Google",
  yandex: "Яндекс",
  booking: "Booking.com",
  qr: "QR-код",
  bio: "шапка профиля",
  stories: "сторис",
  story: "сторис",
  post: "пост",
  reels: "reels",
  cpc: "реклама",
  ppc: "реклама",
  ads: "реклама",
  email: "письмо",
  organic: "поиск",
  referral: "ссылка с другого сайта",
};

const named = (token: string): string => NAMES[token] ?? token;

export function trafficSource(form: FormData): string {
  const path = pageContext(form);
  if (!path) return "";
  const q = new URLSearchParams(path.split("?")[1] ?? "");
  const source = TOKEN(q.get("utm_source"));
  const medium = TOKEN(q.get("utm_medium"));
  const campaign = TOKEN(q.get("utm_campaign"));
  if (!source && !medium && !campaign) return "";

  const exact = KNOWN_TRIPLETS[`${source}|${medium}|${campaign}`];
  if (exact) return exact;

  // Кампания часто повторяет источник — второй раз печатать её незачем.
  const parts = [source, medium, campaign].filter(Boolean).map(named);
  const unique = parts.filter((part, i) => parts.indexOf(part) === i);
  return unique.join(" · ");
}
