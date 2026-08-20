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

/** Готовая строка «Страница: шале (/ru/nomera/cottage)» или пустая. */
export function pageLine(form: FormData): string {
  const path = pageContext(form);
  if (!path) return "";
  const label = pageLabel(path);
  return label ? `${label} (${path})` : path;
}
