/**
 * Кто отвечает гостю.
 *
 * Оба ассистента — консьерж на сайте (app/api/chat) и телеграм-бот
 * (lib/staff-ai) — ходят сюда. Раньше у каждого был свой цикл перебора, и это
 * дважды кончалось одинаково: правишь один, забываешь второй. Теперь порядок,
 * повторы и разбор ошибок живут в одном месте, а вызывающий получает готовый
 * ответ.
 *
 * ПРОВАЙДЕРЫ
 *   1. Groq — api.groq.com, ключи GROQ_API_KEY и GROQ_API_KEY_2, модели
 *      gpt-oss-20b (обычные вопросы) и gpt-oss-120b (расчёты). Бесплатно в
 *      рамках тарифа: 8000 токенов в минуту НА КАЖДУЮ модель и каждый ключ.
 *   2. xAI напрямую — api.x.ai, ключ XAI_API_KEY. Платим xAI без посредника.
 *   3. Шлюз Vercel — ai-gateway.vercel.sh, ключ AI_GATEWAY_API_KEY. Та же
 *      модель Grok, но счёт идёт через Vercel.
 *
 * Вторая модель Groq стоит в цепочке как запас первой. Это не про качество, а
 * про минутную квоту: вопрос с инструментом — два захода по ~6000 токенов, и
 * второй упирается в лимит первой модели. С октября 2026 xAI не подключён, а
 * шлюз отвечает 401 (аккаунт Vercel заблокирован), так что вне Groq запаса нет.
 *
 * Никакого grok.com, cookies и веб-сессий: только официальные API по ключу.
 * Все ключи читаются из process.env на сервере и в браузер не попадают —
 * ни один не помечен NEXT_PUBLIC_.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const XAI_URL = "https://api.x.ai/v1/chat/completions";
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

/**
 * Самая дешёвая подходящая текстовая модель Grok — на 2026-08-11 это
 * grok-4.1-fast. Вход $0.20, выход $0.50 за миллион токенов; следующая по
 * цене (grok-4.20 / 4.3) стоит в шесть раз дороже на входе.
 *
 * Вариантов у неё два, и разница не в цене за токен, а в том, сколько токенов
 * модель потратит: reasoning тратит их на размышление. Замер на одном и том же
 * «скажи ок»: non-reasoning $0.0000363, reasoning $0.0001044 — втрое дороже
 * за одинаковый ответ. Поэтому обычные вопросы идут в non-reasoning, а
 * размышляющая версия достаётся расчётам.
 *
 * Имена у прямого API и у шлюза различаются приставкой. Оба вынесены в env на
 * случай, если xAI переименует модель раньше, чем мы соберёмся её обновить.
 */
/**
 * Groq для простых вопросов — llama-3.1-8b-instant.
 *
 * Не размышляющая модель: для «сколько стоит бассейн» размышление это чистая
 * трата токенов и секунды ожидания.
 */
/**
 * Модель для обычных вопросов.
 *
 * Была llama-3.1-8b-instant — Groq снял её с обслуживания и стал отвечать 400
 * `model_decommissioned`. Код 400 означал «мы прислали кривой запрос», цепочка
 * на нём останавливалась, и консьерж молчал целиком: ни Groq, ни запасные.
 *
 * gpt-oss-20b — та, что оператор выбрал сам для простых ответов, оставив 120b
 * на действительно сложные расчёты. Переопределяется переменной, чтобы
 * следующая замена модели не требовала деплоя.
 */
const GROQ_MODEL_FAQ = process.env.GROQ_MODEL_FAQ?.trim() || "openai/gpt-oss-20b";
/** Модель для расчётов — выбор оператора. У неё своя минутная квота. */
const GROQ_MODEL_HARD = process.env.GROQ_MODEL_HARD?.trim() || "openai/gpt-oss-120b";

const XAI_MODEL_FAQ = process.env.XAI_MODEL_FAQ?.trim() || "grok-4.1-fast-non-reasoning";
const XAI_MODEL_HARD = process.env.XAI_MODEL_HARD?.trim() || "grok-4.1-fast-reasoning";
const GW_MODEL_FAQ = "xai/grok-4.1-fast-non-reasoning";
const GW_MODEL_HARD = "xai/grok-4.1-fast-reasoning";

/** Простой вопрос или расчёт: от этого зависят модель и бюджет ответа. */
export type AiKind = "faq" | "hard";

export type AiTarget = {
  label: string;
  url: string;
  key: string;
  model: string;
};

/**
 * Похоже ли на расчёт, ради которого стоит будить размышляющую модель.
 *
 * Грубо и намеренно: цена ошибки несимметрична. Отправить простой вопрос в
 * размышляющую модель — потратить лишние полсекунды и десятую цента. Отправить
 * смету на группу в быструю — получить арифметику, за которую потом извиняется
 * администратор.
 */
export function isHardQuestion(text: string): boolean {
  const t = text.toLowerCase();
  if (t.length > 320) return true; // длинный список требований — почти всегда смета
  return /посчита|рассчита|расчёт|расчет|смет|итог|сколько (?:всего|выйдет|обойд)|общая стоимость|hisobla|jami|calculate|total cost/.test(
    t,
  );
}

/**
 * Бюджет ответа в токенах.
 *
 * Для обычного FAQ — 400: этого хватает на цену с оговоркой и ссылку, а
 * платим мы именно за токены. Для расчётов — 2000: смета на шесть услуг в 400
 * не помещается, и раньше ответ обрывался на полуслове.
 */
/**
 * 400 не хватало. gpt-oss-20b — модель с рассуждением: часть бюджета уходит
 * на него, и на длинных вопросах («почему бассейн не работает, проверь»)
 * ответа не оставалось вовсе — приходило пустое поле, а гость видел «Не
 * получилось ответить». В логах это видно как out=400 ровно в потолок.
 *
 * 900 хватает и на рассуждение, и на ответ, и вместе с брифингом (5400)
 * укладывается в минутную квоту Groq в 8000 токенов.
 */
const FAQ_BUDGET = 900;

export function answerBudget(kind: AiKind): number {
  return kind === "hard" ? 2000 : FAQ_BUDGET;
}

/**
 * Адресаты по порядку. Пустой ключ выпадает из цепочки молча.
 *
 *   faq:  Groq 20b → Groq 120b → xAI → шлюз
 *   hard: xAI → Groq 120b → шлюз → Groq 20b
 *
 * Расчёт сначала идёт к сильной модели, а 20b — последний шанс ответить вместо
 * телефона администратора. Внутри каждой модели — оба ключа Groq подряд.
 */
export function aiTargets(kind: AiKind = "faq"): AiTarget[] {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const groqKey2 = process.env.GROQ_API_KEY_2?.trim();
  const xaiKey = process.env.XAI_API_KEY?.trim();
  const gwKey = process.env.AI_GATEWAY_API_KEY?.trim();

  /**
   * Второй аккаунт Groq — вторая минутная квота.
   *
   * Бесплатный тариф даёт 8000 токенов в минуту, а один вопрос вместе с
   * брифингом стоит около 5400. То есть второй вопрос в ту же минуту почти
   * гарантированно получает 429 и уходит дальше по цепочке. Одинаковые ключи —
   * это одна квота, а не две, поэтому второй такой же не добавляется.
   */
  const groq = (model: string): AiTarget[] => [
    ...(groqKey ? [{ label: "groq", url: GROQ_URL, key: groqKey, model }] : []),
    ...(groqKey2 && groqKey2 !== groqKey ? [{ label: "groq-2", url: GROQ_URL, key: groqKey2, model }] : []),
  ];
  const xai: AiTarget[] = xaiKey
    ? [{ label: "xai", url: XAI_URL, key: xaiKey, model: kind === "hard" ? XAI_MODEL_HARD : XAI_MODEL_FAQ }]
    : [];
  const gateway: AiTarget[] = gwKey
    ? [{ label: "gateway", url: GATEWAY_URL, key: gwKey, model: kind === "hard" ? GW_MODEL_HARD : GW_MODEL_FAQ }]
    : [];

  return kind === "hard"
    ? [...xai, ...groq(GROQ_MODEL_HARD), ...gateway, ...groq(GROQ_MODEL_FAQ)]
    : [...groq(GROQ_MODEL_FAQ), ...groq(GROQ_MODEL_HARD), ...xai, ...gateway];
}

// ── разбор ответа ────────────────────────────────────────────────────────────

/** Что делать с полученным ответом. */
export type Verdict =
  | "ok" // отдаём вызывающему
  | "retry" // подождать и повторить у ЭТОГО же провайдера
  | "fallback" // этот не может — идём к следующему
  | "credits" // у этого кончились деньги — идём к следующему и не возвращаемся
  | "shrink" // запрос велик — повторить у него же, но с урезанным контекстом
  | "stop"; // виноват наш запрос — перебор бессмыслен, отдаём управляемую ошибку

/**
 * КОДЫ ОШИБОК И ЧТО ЗНАЧАТ.
 *
 * Оговорка, которая важнее остального: у xAI **429 означает и то и другое**.
 * Это и «слишком часто», и «кончились кредиты» — различает их только текст
 * ответа («purchase more credits», «monthly spending limit»). Поэтому 429 сам
 * по себе поводом уходить не считается, как и просили: сначала пауза и
 * повтор, и лишь по словам в теле — немедленный уход на шлюз.
 *
 *   200        ok        ответ есть
 *   402        credits   Payment Required — денег нет, повторять бессмысленно
 *   429 + «credit / billing / spend / balance / purchase» → credits
 *   429 прочее retry     лимит частоты: пауза с ростом, потом fallback
 *   401 / 403  fallback  ключ не тот или нет прав — руками, не в рантайме
 *   400 / 404 / 422      fallback: провайдеры расходятся в мелочах, и то, что
 *                        отверг один, второй нередко принимает
 *   408 / 5xx  fallback  временная беда на их стороне
 */
const CREDIT_WORDS =
  /credit|billing|balance|spend(ing)?[ _-]?limit|purchase|payment|insufficient|out of funds|top ?up/i;

/**
 * Лимит частоты, а не деньги — даже если в тексте есть «billing».
 *
 * Groq на минутный лимит отвечает «Rate limit reached … Please try again in
 * 23.5s. Need more tokens? Upgrade … console.groq.com/settings/billing». Слово
 * «billing» из ссылки делало каждый такой отказ «кончились кредиты»: без
 * повтора, сразу к следующему — а следующих живых не было, и бот отвечал гостю
 * «помощник недоступен» на вопрос, который через полминуты прошёл бы.
 */
const RATE_WORDS = /rate limit reached|rate_limit_exceeded|per minute|per day|try again in/i;

/**
 * 404 бывает про разное, и разница существенная.
 *
 * «Модели нет у этого провайдера» — повод спросить следующего: у него она
 * может быть. «Нет такого пути» — это наша ошибка в URL, и следующий ответит
 * тем же. Различаем по телу.
 */
const MODEL_GONE =
  /model|provider|deprecated|decommission|does not exist|not found|unavailable|no such/i;

export function classify(status: number, body: string): Verdict {
  if (status >= 200 && status < 300) return "ok";

  // Наш запрос кривой. Тот же кривой запрос у другого провайдера даст тот же
  // ответ — перебор только потратит секунды гостя и деньги на попытки.
  /**
   * 400 обычно значит «мы прислали кривой запрос» — чинить это должен я, и
   * перебирать провайдеров бессмысленно. Но Groq отвечает тем же кодом, когда
   * снимает модель с обслуживания: `model_decommissioned` приходит как 400, а
   * не 404. Проверено на проде — концierge молчал целиком, потому что цепочка
   * останавливалась на первом же провайдере вместо перехода к запасному.
   *
   * Поэтому 400 со словами про модель — повод пойти дальше по цепочке.
   */
  if (status === 400) return MODEL_GONE.test(body) ? "fallback" : "stop";

  if (status === 401 || status === 403) return "fallback";
  if (status === 402) return "credits";
  if (status === 404) return MODEL_GONE.test(body) ? "fallback" : "stop";
  if (status === 408) return "fallback";

  // Слишком большой запрос: сначала урезаем контекст и пробуем ещё раз здесь же.
  if (status === 413) return "shrink";

  if (status === 429) return !RATE_WORDS.test(body) && CREDIT_WORDS.test(body) ? "credits" : "retry";
  if (status >= 500) return "fallback";
  return "fallback";
}

/** Критичное в лог отдельной строкой: это чинит человек, а не рантайм. */
function critical(label: string, status: number, body: string) {
  console.error(
    `[ai] КРИТИЧНО: ${label} отдал ${status} — проверьте ключ и права доступа. ${body.slice(0, 200)}`,
  );
}

/**
 * Урезанный контекст для повтора после 413.
 *
 * Оставляем системную часть и последнюю реплику гостя — то, без чего ответа не
 * будет вовсе. Выбрасывается история: именно она растёт от разговора к
 * разговору и именно она обычно и переполняет запрос. Бюджет ответа тоже
 * прижимается: 413 считает и его тоже.
 */
function shrinkBody(body: Record<string, unknown>): Record<string, unknown> | null {
  const msgs = body.messages;
  if (!Array.isArray(msgs) || msgs.length <= 2) return null; // резать уже нечего

  const system = msgs.filter((m) => (m as { role?: string }).role === "system").slice(0, 1);
  const lastUser = [...msgs].reverse().find((m) => (m as { role?: string }).role === "user");
  if (!lastUser) return null;

  const budget = typeof body.max_tokens === "number" ? Math.min(body.max_tokens, 600) : 600;
  return { ...body, messages: [...system, lastUser], max_tokens: budget };
}

/**
 * Сколько провайдер просит подождать: Retry-After, а без него — «try again in
 * 23.5s» / «7m12s» из текста Groq. null — не сказал.
 */
export function retryAfterMs(header: string | null, body: string): number | null {
  const told = Number(header) * 1000;
  if (header && Number.isFinite(told) && told > 0) return told;
  const m = /try again in\s+(?:(\d+)m)?\s*(?:([\d.]+)s)?/i.exec(body);
  if (!m || (!m[1] && !m[2])) return null;
  return Math.round((Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * 1000);
}

/**
 * Дольше этого у одного провайдера не ждём — сразу идём к следующему.
 *
 * За этой чертой гость в чате решает, что бот умер; у следующего в цепочке
 * (у Groq — другая модель со своей квотой) ответ, скорее всего, есть сейчас.
 */
const WAIT_NOW_MS = 3_000;

/**
 * Последний шанс: все отказали, но кто-то просил подождать не дольше этого.
 *
 * Минутная квота Groq восстанавливается за полминуты, и ответ через 20 секунд
 * лучше, чем «помощник недоступен» и телефон. Дольше — уже нет: вебхук
 * Telegram и гость на сайте ждут не бесконечно.
 */
const LAST_WAIT_MS = 25_000;

/** Пауза перед повтором при 429 без подсказки провайдера: 400 мс → 1200 мс → 3000 мс. */
function backoffMs(attempt: number): number {
  return Math.min(400 * 3 ** attempt, WAIT_NOW_MS);
}

/**
 * Сколько раз повторять при 429, прежде чем уйти к следующему.
 *
 * У Groq — одна короткая попытка: за ним в цепочке его же вторая модель со
 * своей квотой. У xAI — две: там уже заплачено, и вернуться к нему выгоднее,
 * чем уходить на шлюз.
 *
 * Ни в одном случае это не «бесконечные повторы»: после исчерпания попыток
 * адресат меняется, а не опрашивается снова.
 */
function maxRetriesFor(label: string): number {
  return label.startsWith("groq") ? 1 : 2;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Кредиты у xAI кончились — не долбиться в него каждым запросом.
 *
 * Без этого каждый гость оплачивал бы одну лишнюю ходку в сеть, чтобы получить
 * тот же отказ. Память живёт в процессе: на холодном старте забудется, и это
 * ровно то, что нужно — пополнили баланс, и через несколько минут прод сам
 * начнёт снова пробовать xAI без деплоя.
 */
const CREDIT_PAUSE_MS = 10 * 60_000;
let xaiBlockedUntil = 0;

/** Для тестов и диагностики: когда xAI снова будет опрошен. */
export function xaiPausedUntil(): number {
  return xaiBlockedUntil;
}
export function resetXaiPause(): void {
  xaiBlockedUntil = 0;
}

// ── сам вызов ────────────────────────────────────────────────────────────────

function post(target: AiTarget, body: Record<string, unknown>, timeoutMs: number) {
  return fetch(target.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${target.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, model: target.model }),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/**
 * Итог обращения к ИИ.
 *
 * Отказ бывает разный, и вызывающему важно, какой именно: «никто не ответил» —
 * повод показать телефон администратора, а `bad_request` — наша собственная
 * ошибка, которую надо чинить в коде, а не показывать гостю как перегрузку.
 */
export type AiOutcome =
  | { ok: true; res: Response; target: AiTarget }
  | { ok: false; error: AiError; status?: number; detail?: string };

export type AiError =
  | "no_keys" // ключей нет вовсе
  | "bad_request" // 400 или «неизвестный путь» 404 — виноват наш запрос
  | "too_large" // 413 не ушёл даже после урезания контекста
  | "unavailable"; // все провайдеры по очереди отказались

export async function askAi(
  kind: AiKind,
  body: Record<string, unknown>,
  timeoutMs = 15_000,
): Promise<AiOutcome> {
  const targets = aiTargets(kind);
  if (targets.length === 0) {
    console.error("[ai] нет ни одного ключа: GROQ_API_KEY, XAI_API_KEY, AI_GATEWAY_API_KEY");
    return { ok: false, error: "no_keys" };
  }

  // Почему отказал каждый — для администратора: «unavailable» без причин
  // ничего не говорит человеку, который читает тревогу в Telegram.
  const tried: string[] = [];
  // Кто просил подождать, но недолго: к нему вернёмся, если не ответит никто.
  let soonest: { target: AiTarget; payload: Record<string, unknown>; at: number } | null = null;

  for (const target of targets) {
    const name = `${target.label} ${target.model.replace(/^.*\//, "")}`;
    // xAI на паузе из-за кредитов — не тратим на него время гостя.
    if (target.label === "xai" && Date.now() < xaiBlockedUntil) {
      console.warn(
        "[ai] xai пропущен: кредиты кончились, пауза до " + new Date(xaiBlockedUntil).toISOString(),
      );
      tried.push(`${name}: пауза — кончились кредиты`);
      continue;
    }

    let payload = body;
    let shrunk = false;

    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await post(target, payload, timeoutMs);
      } catch (e) {
        // Таймаут или обрыв связи — «он не ответил», а не «никто не ответит».
        console.warn(
          `[ai] ${target.label} ${target.model} не ответил (${e instanceof Error ? e.name : e})`,
        );
        tried.push(`${name}: не ответил`);
        break;
      }

      const detail = res.ok ? "" : await res.clone().text().catch(() => "");
      const verdict = classify(res.status, detail);

      if (verdict === "ok") return { ok: true, res, target };

      if (verdict === "stop") {
        console.error(
          `[ai] ${target.label} ${res.status}: запрос отвергнут — перебор не поможет. ${detail.slice(0, 300)}`,
        );
        return { ok: false, error: "bad_request", status: res.status, detail: detail.slice(0, 300) };
      }

      if (verdict === "shrink") {
        const smaller = !shrunk ? shrinkBody(payload) : null;
        if (smaller) {
          console.warn(`[ai] ${target.label} 413 — повтор с урезанным контекстом`);
          payload = smaller;
          shrunk = true;
          continue;
        }
        // Урезать больше нечего: дальше по цепочке, а если никто не возьмёт —
        // вызывающий получит too_large и покажет гостю телефон.
        console.error(`[ai] ${target.label} 413 и после урезания — идём к следующему`);
        tried.push(`${name}: 413 запрос велик`);
        break;
      }

      if (verdict === "credits") {
        if (target.label === "xai") xaiBlockedUntil = Date.now() + CREDIT_PAUSE_MS;
        console.error(`[ai] ${name}: кончились кредиты (${res.status}) — к следующему`);
        tried.push(`${name}: ${res.status} кончились кредиты`);
        break;
      }

      if (res.status === 401 || res.status === 403) critical(target.label, res.status, detail);

      if (verdict === "retry") {
        const told = retryAfterMs(res.headers.get("retry-after"), detail);
        if (told === null && attempt < maxRetriesFor(target.label)) {
          const wait = backoffMs(attempt);
          console.warn(`[ai] ${name} 429 (лимит частоты), повтор через ${wait} мс`);
          await sleep(wait);
          continue;
        }
        if (told !== null && told <= WAIT_NOW_MS && attempt < maxRetriesFor(target.label)) {
          console.warn(`[ai] ${name} 429 (лимит частоты), повтор через ${told} мс`);
          await sleep(told);
          continue;
        }
        // Ждать долго — к следующему, но запомнить: если откажут все, вернёмся сюда.
        if (told !== null && told <= LAST_WAIT_MS && (!soonest || Date.now() + told < soonest.at)) {
          soonest = { target, payload, at: Date.now() + told };
        }
        const after = told === null ? "" : `, просит подождать ${Math.ceil(told / 1000)} с`;
        console.warn(`[ai] ${name} 429 (лимит частоты${after}) — к следующему`);
        tried.push(`${name}: 429 лимит в минуту${after}`);
        break;
      }

      console.warn(`[ai] ${name} отдал ${res.status} — к следующему`);
      tried.push(`${name}: ${res.status}`);
      break;
    }
  }

  /**
   * Никто не ответил сразу, но кто-то просил подождать недолго — ждём и
   * спрашиваем его ещё раз. Так одна бесплатная квота Groq отвечает на вопрос
   * с инструментом, второй заход которого не помещается в ту же минуту.
   */
  if (soonest) {
    const { target, payload, at } = soonest;
    const wait = Math.max(0, at - Date.now()) + 250;
    console.warn(`[ai] все отказали — ждём ${target.label} ${target.model} ${wait} мс и пробуем ещё раз`);
    await sleep(wait);
    try {
      const res = await post(target, payload, timeoutMs);
      if (res.ok) return { ok: true, res, target };
      tried.push(`${target.label} ${target.model.replace(/^.*\//, "")} после ожидания: ${res.status}`);
    } catch (e) {
      tried.push(`${target.label} после ожидания: ${e instanceof Error ? e.name : "ошибка"}`);
    }
  }

  return { ok: false, error: "unavailable", detail: tried.join("; ").slice(0, 600) };
}
