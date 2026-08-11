/**
 * Which model answers, and in what order, for BOTH assistants.
 *
 * The site concierge (app/api/chat) and the Telegram bot (lib/staff-ai) ask
 * different questions with different tools, but they must agree on where the
 * answer comes from. Kept in one file because the alternative is the failure
 * that hides for a week: a key is rotated, the site adapts, and the bot — with
 * its own copy of the list — keeps calling the dead account. Before this the
 * bot had exactly that: a single hardcoded 20b and no use of the second key.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * The tiers, best first.
 *
 * 20b at reasoning_effort "low" could not hold the language instruction:
 * guests writing Russian got answers in Kazakh, and digit grouping came out as
 * "320 0000 сум" for a 3 200 000 rate.
 *
 * 120b fixes both — but the free tier caps it at 8 000 tokens per minute and
 * one question costs ~3 700 (the venue briefing is a big system prompt). That
 * is barely two guests a minute, so it cannot be the only model. On a 429 we
 * drop to 20b, which has a far larger allowance, rather than showing a failure.
 *
 * The third is from a different family on purpose — it has its OWN per-minute
 * bucket. The old two-model chain shared a ceiling: the log for the 502s read
 * "primary rate-limited, falling back to gpt-oss-20b" and then "both models
 * rate-limited", and a fallback that fails for the same reason as the primary
 * is not a fallback.
 */
/**
 * Порядок моделей: 20b первой, 120b — только на сложное.
 *
 * Решение оператора (2026-08-11). 20b быстрее и дешевле, и на обычных вопросах
 * («сколько стоит бассейн», «во сколько заезд») она отвечает не хуже. 120b
 * достаётся то, ради чего она нужна: сметы на группу, сравнение вариантов
 * размещения, многошаговые расчёты.
 *
 * Историческая оговорка, чтобы её не потеряли: 20b при reasoning_effort "low"
 * не удерживала правило языка — русским гостям приходили ответы по-казахски.
 * Сейчас во всех вызовах стоит "medium", на нём эта беда не воспроизводится.
 * Понизите усилие — вернётся.
 *
 * llama идёт последней и намеренно из другого семейства: у неё СВОЙ лимит в
 * минуту, а запасной вариант, упирающийся в тот же потолок, что и основной, —
 * не запасной.
 */
const MODELS_LIGHT = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"];
const MODELS_HARD = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];

/**
 * Похоже ли на расчёт, ради которого стоит будить старшую модель.
 *
 * Грубо и намеренно: цена ошибки несимметрична. Отправить простой вопрос к 120b
 * — потратить лишние полсекунды и десятую цента. Отправить смету на группу к
 * 20b — получить арифметику, за которую потом извиняется администратор.
 */
export function isHardQuestion(text: string): boolean {
  const t = text.toLowerCase();
  if (t.length > 320) return true; // длинный список требований — почти всегда смета
  return /посчита|рассчита|расчёт|расчет|смет|итог|сколько (?:всего|выйдет|обойд)|общая стоимость|hisobla|jami|calculate|total cost/.test(
    t,
  );
}

/**
 * Шлюз Vercel AI Gateway — платный запас, когда бесплатные аккаунты выбраны.
 *
 * Свободный тариф Groq упирается в 8 000 токенов в минуту, а один вопрос
 * гостя стоит около 3 700: в выходной день это две-три реплики в минуту на
 * весь курорт, после чего консьерж начинает отвечать «попробуйте позже».
 * Шлюз берёт те же модели, но по счёту, и ограничения у него другие.
 *
 * ТОЛЬКО GROQ, И ЭТО НЕ ФОРМАЛЬНОСТЬ. У шлюза модель и провайдер разведены:
 * `openai/gpt-oss-120b` — это модель, а обслужить её могут baseten, bedrock,
 * cerebras, fireworks, groq, nebius, parasail, togetherai. Без закрепления
 * запрос ушёл бы к любому из них. Поле `only` шлюз действительно уважает —
 * проверено: с чужой моделью он отвечает «No available providers match the
 * 'only' filter: groq», а не молча подставляет другого.
 *
 * Имена моделей у шлюза свои: llama называется meta/llama-3.3-70b, а не
 * llama-3.3-70b-versatile, как в прямом API Groq.
 */
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const GATEWAY_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "meta/llama-3.3-70b"];
const GATEWAY_ONLY_GROQ = { providerOptions: { gateway: { only: ["groq"] } } };

/**
 * One model + account the assistants may call.
 *
 * `bodyExtra` — то, что добавляется к телу запроса именно для этого адресата.
 * Нужен шлюзу: закрепление провайдера живёт в теле, а не в заголовке, и
 * прямой API Groq на такое поле ответил бы ошибкой.
 */
export type AiTarget = {
  label: string;
  url: string;
  key: string;
  model: string;
  bodyExtra?: Record<string, unknown>;
};

/**
 * Every configured account, best model first. Blank or missing keys drop out,
 * so deleting GROQ_API_KEY_2 in Vercel is all it takes to go back to one.
 *
 * Keys are the INNER loop and models the outer one: the per-minute allowance is
 * per account, so a second key is a second allowance rather than a spare, and
 * asking 120b again on the other account beats dropping to 20b on the
 * exhausted one. Dropping a tier happens only when every account is out.
 */
export function aiTargets(hard = false): AiTarget[] {
  const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2]
    .map((k) => k?.trim())
    .filter((k): k is string => Boolean(k));

  // Обычный вопрос начинает с 20b, расчёт — с 120b. Обе остаются в цепочке:
  // порядок решает, кого спрашивают первым, а не кого исключают.
  const models = hard ? MODELS_HARD : MODELS_LIGHT;

  const out: AiTarget[] = [];
  for (const model of models) {
    keys.forEach((key, i) => out.push({ label: `groq/key${i + 1}`, url: GROQ_URL, key, model }));
  }

  /**
   * Шлюз идёт последним, а не первым, и это осознанно: свои ключи бесплатны,
   * шлюз — по счёту. Пока бесплатная минута не выбрана, платить незачем; как
   * только выбрана — гость не должен этого заметить.
   *
   * Модели перечислены тем же порядком «сильная → запасная», так что если
   * бесплатные аккаунты кончились на 120b, шлюз начнёт с неё же, а не с 20b.
   */
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (gatewayKey) {
    // Тот же порядок, что и у своих ключей: имена у шлюза свои, смысл тот же.
    const gwModels = hard
      ? GATEWAY_MODELS
      : [GATEWAY_MODELS[1], GATEWAY_MODELS[0], ...GATEWAY_MODELS.slice(2)];
    for (const model of gwModels) {
      out.push({
        label: `gateway/${model}`,
        url: GATEWAY_URL,
        key: gatewayKey,
        model,
        bodyExtra: GATEWAY_ONLY_GROQ,
      });
    }
  }
  return out;
}

/**
 * "This account cannot serve the request — try the next one."
 *
 * 429 is the per-minute ceiling, the case this chain was built for. 401/403
 * are here because of an incident while testing it: one bad credential in the
 * environment made every single guest question return a 502 while healthy
 * accounts sat idle one entry below. A wrong or rotated key is an operator
 * problem and it belongs in the log, but there is no version of it the guest
 * should have to see.
 */
export function shouldFallThrough(status: number): boolean {
  /**
   * 400 здесь не потому, что от смены аккаунта кривой запрос станет ровным.
   *
   * Провайдеры расходятся в мелочах: один принимает поле, другой отвечает 400.
   * Пока 400 означал «конец перебора», один такой ответ гасил всю цепочку из
   * девяти адресатов — именно так гость получал телефон администратора при
   * живых моделях. Девять быстрых попыток дешевле одного несостоявшегося
   * разговора; если ошибка в нашем теле, цепочка всё равно закончится отказом,
   * только чуть позже.
   */
  return (
    status === 400 || status === 429 || status === 401 || status === 403 || status >= 500
  );
}

/**
 * One call. The caller owns the body — tools, temperature and token budget
 * differ between the site and the bot — this only adds what is account-specific
 * and puts the request on the wire.
 */
/**
 * Тот же вызов, но упавший считается «этот аккаунт не ответил», а не концом света.
 *
 * Из-за отсутствия этой обёртки бот отвечал «Помощник сейчас недоступен» при
 * девяти живых адресатах: тяжёлый вопрос заставлял первую модель думать дольше
 * таймаута, AbortSignal бросал исключение — и оно вылетало мимо цикла перебора,
 * прерывая его на первом же адресате. Остальные восемь так и не пробовались.
 *
 * Сюда попадают только сетевые сбои и таймаут. HTTP-коды по-прежнему разбирает
 * shouldFallThrough: 429 — это ответ сервера, а не сбой связи.
 */
export async function tryCallAiModel(
  target: AiTarget,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<Response | null> {
  try {
    return await callAiModel(target, body, timeoutMs);
  } catch (e) {
    const why = e instanceof Error ? e.name : String(e);
    console.warn(`[ai] ${target.label} ${target.model} не ответил (${why}) — пробуем следующий`);
    return null;
  }
}

export function callAiModel(
  target: AiTarget,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<Response> {
  return fetch(target.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${target.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      ...(target.bodyExtra ?? {}),
      model: target.model,
      /**
       * "low" starved the language and price-formatting rules of attention, so
       * medium is the default — но именно default, а не жёсткая настройка.
       * Раньше это поле стояло последним и затирало всё, что передал вызывающий;
       * теперь оно уступает, потому что у рассуждения и ответа ОДИН бюджет
       * токенов, и на тяжёлом вопросе бывает выгоднее думать меньше, но успеть
       * дописать ответ.
       */
      reasoning_effort: body.reasoning_effort ?? "medium",
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
}
