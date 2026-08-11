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
const GROQ_MODEL_FAQ = process.env.GROQ_MODEL_FAQ?.trim() || "llama-3.1-8b-instant";

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
  | "credits"; // у этого кончились деньги — идём к следующему и не возвращаемся

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

export function classify(status: number, body: string): Verdict {
  if (status >= 200 && status < 300) return "ok";
  if (status === 402) return "credits";
  if (status === 429) return CREDIT_WORDS.test(body) ? "credits" : "retry";
  return "fallback";
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

export type AiAnswer = { res: Response; target: AiTarget } | null;

/**
 * Один запрос — с повторами и переходом на второго провайдера.
 *
 * Возвращает первый ответ, который можно отдать вызывающему, либо null, если
 * не смог никто. Тело ответа не читается: его читает вызывающий, а здесь берётся
 * только клон для разбора ошибки — иначе поток был бы уже израсходован.
 */
export async function askAi(
  kind: AiKind,
  body: Record<string, unknown>,
  timeoutMs = 15_000,
): Promise<AiAnswer> {
  const targets = aiTargets(kind);
  if (targets.length === 0) {
    console.error("[ai] нет ключей: ни XAI_API_KEY, ни AI_GATEWAY_API_KEY");
    return null;
  }

  for (const target of targets) {
    // xAI на паузе из-за кредитов — не тратим на него время гостя.
    if (target.label === "xai" && Date.now() < xaiBlockedUntil) {
      console.warn("[ai] xai пропущен: кредиты кончились, пауза до " + new Date(xaiBlockedUntil).toISOString());
      continue;
    }

    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await post(target, body, timeoutMs);
      } catch (e) {
        // Таймаут или обрыв связи — это «он не ответил», а не «никто не ответит».
        console.warn(`[ai] ${target.label} ${target.model} не ответил (${e instanceof Error ? e.name : e})`);
        break;
      }

      const verdict = classify(res.status, res.ok ? "" : await res.clone().text().catch(() => ""));

      if (verdict === "ok") return { res, target };

      if (verdict === "credits") {
        if (target.label === "xai") xaiBlockedUntil = Date.now() + CREDIT_PAUSE_MS;
        console.error(`[ai] ${target.label}: кончились кредиты (${res.status}) — уходим к следующему`);
        break;
      }

      if (verdict === "retry" && attempt < maxRetriesFor(target.label)) {
        const wait = backoffMs(attempt, res.headers.get("retry-after"));
        console.warn(`[ai] ${target.label} 429 (лимит частоты), повтор через ${wait} мс`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      console.warn(`[ai] ${target.label} ${target.model} отдал ${res.status} — идём к следующему`);
      break;
    }
  }

  return null;
}
