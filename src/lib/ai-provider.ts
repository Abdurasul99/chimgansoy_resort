/**
 * Кто отвечает гостю: xAI напрямую, а при отказе — через шлюз Vercel.
 *
 * Оба ассистента — консьерж на сайте (app/api/chat) и телеграм-бот
 * (lib/staff-ai) — ходят сюда. Раньше у каждого был свой цикл перебора, и это
 * дважды кончалось одинаково: правишь один, забываешь второй. Теперь порядок,
 * повторы и разбор ошибок живут в одном месте, а вызывающий получает готовый
 * ответ.
 *
 * ТРИ ПРОВАЙДЕРА, В ЭТОМ ПОРЯДКЕ
 *   1. Groq — api.groq.com, ключ GROQ_API_KEY, модель llama-3.1-8b-instant.
 *      Берёт на себя обычные вопросы: цены, услуги, часы, бронирование. Быстрая
 *      и бесплатная в рамках тарифа, поэтому стоит первой.
 *   2. xAI напрямую — api.x.ai, ключ XAI_API_KEY. Платим xAI без посредника.
 *   3. Шлюз Vercel — ai-gateway.vercel.sh, ключ AI_GATEWAY_API_KEY. Та же
 *      модель Grok, но счёт идёт через Vercel.
 *
 * Groq участвует ТОЛЬКО в простых вопросах. Смету на группу 8b-модель не
 * потянет, и подсовывать её туда — это арифметика, за которую потом извиняется
 * администратор; расчёты сразу уходят к Grok.
 *
 * Никакого grok.com, cookies и веб-сессий: только официальные API по ключу.
 * Все три ключа читаются из process.env на сервере и в браузер не попадают —
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
export function answerBudget(kind: AiKind): number {
  return kind === "hard" ? 2000 : 400;
}

/** Адресаты по порядку. Пустой ключ выпадает из цепочки молча. */
export function aiTargets(kind: AiKind = "faq"): AiTarget[] {
  const out: AiTarget[] = [];
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const xaiKey = process.env.XAI_API_KEY?.trim();
  const gwKey = process.env.AI_GATEWAY_API_KEY?.trim();

  // Только простые вопросы: 8b-модель хороша на «сколько стоит» и беспомощна
  // на смете для группы из пятнадцати человек.
  if (groqKey && kind === "faq") {
    out.push({ label: "groq", url: GROQ_URL, key: groqKey, model: GROQ_MODEL_FAQ });
  }
  if (xaiKey) {
    out.push({
      label: "xai",
      url: XAI_URL,
      key: xaiKey,
      model: kind === "hard" ? XAI_MODEL_HARD : XAI_MODEL_FAQ,
    });
  }
  if (gwKey) {
    out.push({
      label: "gateway",
      url: GATEWAY_URL,
      key: gwKey,
      model: kind === "hard" ? GW_MODEL_HARD : GW_MODEL_FAQ,
    });
  }
  return out;
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

  if (status === 429) return CREDIT_WORDS.test(body) ? "credits" : "retry";
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
 * Пауза перед повтором при 429.
 *
 * Уважаем Retry-After, если он есть: провайдер знает лучше. Иначе растущая
 * задержка. Потолок в три секунды — за этой чертой гость в чате решает, что
 * бот умер, и уходит; лучше ответить со шлюза.
 */
function backoffMs(attempt: number, retryAfter: string | null): number {
  const told = Number(retryAfter) * 1000;
  if (Number.isFinite(told) && told > 0) return Math.min(told, 3_000);
  return Math.min(400 * 3 ** attempt, 3_000); // 400 мс → 1200 мс → 3000 мс
}

/**
 * Сколько раз повторять при 429, прежде чем уйти к следующему.
 *
 * У Groq — одна короткая попытка: он бесплатный и первый в очереди, ждать у
 * него дольше секунды незачем, за ним стоят двое платных. У xAI — две: там уже
 * заплачено, и вернуться к нему выгоднее, чем уходить на шлюз.
 *
 * Ни в одном случае это не «бесконечные повторы»: после исчерпания попыток
 * адресат меняется, а не опрашивается снова.
 */
function maxRetriesFor(label: string): number {
  return label === "groq" ? 1 : 2;
}

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

  for (const target of targets) {
    // xAI на паузе из-за кредитов — не тратим на него время гостя.
    if (target.label === "xai" && Date.now() < xaiBlockedUntil) {
      console.warn(
        "[ai] xai пропущен: кредиты кончились, пауза до " + new Date(xaiBlockedUntil).toISOString(),
      );
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
        break;
      }

      if (verdict === "credits") {
        if (target.label === "xai") xaiBlockedUntil = Date.now() + CREDIT_PAUSE_MS;
        console.error(`[ai] ${target.label}: кончились кредиты (${res.status}) — к следующему`);
        break;
      }

      if (res.status === 401 || res.status === 403) critical(target.label, res.status, detail);

      if (verdict === "retry" && attempt < maxRetriesFor(target.label)) {
        const wait = backoffMs(attempt, res.headers.get("retry-after"));
        console.warn(`[ai] ${target.label} 429 (лимит частоты), повтор через ${wait} мс`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      console.warn(`[ai] ${target.label} ${target.model} отдал ${res.status} — к следующему`);
      break;
    }
  }

  return { ok: false, error: "unavailable" };
}
