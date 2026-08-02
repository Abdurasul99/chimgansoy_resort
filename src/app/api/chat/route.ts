import type { NextRequest } from "next/server";
import { buildSystemPrompt } from "@/lib/ai-context";
import { checkAvailability } from "@/lib/exely";
import { getChimganWeather, weatherInfo } from "@/lib/bot-weather";

/**
 * Live weather for the concierge, shaped for a model rather than a chat card.
 * Same open-meteo source and 10-minute cache the Telegram bot uses, so the two
 * assistants can't quote different temperatures for the same afternoon.
 */
async function weatherForConcierge() {
  const res = await getChimganWeather();
  if (!res.ok) return { ok: false, error: "weather_unavailable" };
  const w = res.data;
  const { desc } = weatherInfo(w.code);
  return {
    ok: true,
    place: "Chimgan Darbaza, 1700 м",
    now: { tempC: w.tempC, feelsLikeC: w.feelsC, windKmh: w.windKmh, description: desc },
    today: { minC: w.todayMin, maxC: w.todayMax },
    tomorrow: { minC: w.tomorrowMin, maxC: w.tomorrowMax },
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
/**
 * Two models on purpose.
 *
 * 20b at reasoning_effort "low" was what shipped, and it could not hold the
 * language instruction: guests writing Russian got answers in Kazakh, and digit
 * grouping came out as "320 0000 сум" for a 3 200 000 rate.
 *
 * 120b fixes both — but Groq's free tier caps it at 8 000 tokens per minute and
 * one request costs ~3 700 (the venue knowledge base is a big system prompt).
 * That is barely two guests a minute before everyone starts seeing errors, so
 * it cannot be the only model. On a 429 we drop to 20b, which has a far larger
 * TPM allowance, rather than showing the guest a failure.
 *
 * Raising the Groq plan above the free tier would let 120b serve every request.
 */
const MODEL_PRIMARY = "openai/gpt-oss-120b";
const MODEL_FALLBACK = "openai/gpt-oss-20b";

type ChatMsg = { role: "user" | "assistant"; content: string };
type ToolCall = { id: string; function: { name: string; arguments: string } };
type GroqMsg = {
  role: string;
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};
type GroqResponse = { choices?: Array<{ message?: GroqMsg }> };

// The one tool the concierge can call: live availability + prices from Exely.
const TOOLS = [
  {
    type: "function",
    function: {
      name: "check_availability",
      // The description used to end "...стоимость услуг/бассейна", which sent
      // the model to Exely for the pool — and a tool description outweighs a
      // prose rule, so it went there despite three separate instructions not
      // to. Exely returns one per-person figure the operator does not maintain
      // for day passes, quietly replacing the four-band tariff.
      description:
        "Проверить РЕАЛЬНУЮ доступность и цены ПРОЖИВАНИЯ (Шале / Глэмпинг) на конкретные даты в системе бронирования (Exely). Вызывай, когда гость спрашивает про свободные номера, цену ночёвки или бронь на конкретную дату/период. НЕ вызывай для дневных услуг — бассейн, топчан, тюбинг, въезд и аренда имеют фиксированный прайс, он есть в знаниях выше. Даты — в формате YYYY-MM-DD.",
      parameters: {
        type: "object",
        properties: {
          checkin: { type: "string", description: "Дата заезда, формат YYYY-MM-DD" },
          checkout: { type: "string", description: "Дата выезда YYYY-MM-DD; если не указана — одна ночь" },
          adults: { type: "integer", description: "Число гостей (взрослых), по умолчанию 2" },
        },
        required: ["checkin"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Живая погода в Чимгане на территории курорта (1700 м): сейчас, минимум/максимум сегодня и завтра. Вызывай ВСЕГДА, когда гость спрашивает про погоду, температуру, холодно ли, что надеть, стоит ли ехать. Без вызова температуру не называй.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function callGroq(
  apiKey: string,
  messages: GroqMsg[],
  withTools: boolean,
  model: string = MODEL_PRIMARY,
): Promise<Response> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.15,
    max_tokens: 1000,
    // "low" was starving the language and price-formatting rules of attention.
    reasoning_effort: "medium",
  };
  if (withTools) {
    body.tools = TOOLS;
    body.tool_choice = "auto";
  }
  return fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
}

/**
 * Calls the good model, and silently drops to the lighter one when Groq says we
 * are over the per-minute token allowance. A guest waiting on a price should
 * never see an error because another guest asked a question ten seconds ago.
 */
async function callWithFallback(
  apiKey: string,
  messages: GroqMsg[],
  withTools: boolean,
): Promise<{ res: Response; model: string }> {
  const res = await callGroq(apiKey, messages, withTools, MODEL_PRIMARY);
  if (res.status !== 429) return { res, model: MODEL_PRIMARY };

  console.warn("[chat] primary model rate-limited, falling back to", MODEL_FALLBACK);
  const fb = await callGroq(apiKey, messages, withTools, MODEL_FALLBACK);
  if (fb.status !== 429) return { res: fb, model: MODEL_FALLBACK };

  /**
   * Both models over the per-minute allowance.
   *
   * The system prompt is around 6 000 tokens of Russian, so on the free tier a
   * single question very nearly is the minute's budget — two guests a minute
   * apart is enough to land here. Groq says how long to wait in Retry-After;
   * honouring it once turns a visible failure into a slower answer, which is
   * what a guest waiting on a price would choose. Capped so nobody stares at a
   * spinner: past that, the caller shows the "call us" fallback.
   */
  const wait = Math.min((Number(fb.headers.get("retry-after")) || 4) * 1000, 6_000);
  console.warn(`[chat] both models rate-limited, retrying in ${wait}ms`);
  await new Promise((r) => setTimeout(r, wait));
  return { res: await callGroq(apiKey, messages, withTools, MODEL_FALLBACK), model: MODEL_FALLBACK };
}

/**
 * The "I may be wrong — the administrator will confirm" line belongs on prices
 * and availability, where a human really does decide. On a weather answer it
 * reads as nonsense: the temperature comes from open-meteo, not from the front
 * desk. The prompt says so, but a 20–120B model still tacks it on maybe a third
 * of the time, so this enforces it.
 *
 * Only fires when the turn used the weather tool and did NOT touch availability
 * — a mixed answer ("it's 22° and the chalet costs …") keeps the line.
 */
function stripDisclaimer(reply: string, toolsUsed: Set<string>): string {
  if (!toolsUsed.has("get_weather") || toolsUsed.has("check_availability")) return reply;
  // Cut from the disclaimer to the end rather than dropping whole lines: the
  // model often puts it in the same paragraph as the forecast, so a line filter
  // would either miss it or take the weather with it. The prompt always places
  // it last, so everything after the opening words is safe to drop.
  return reply
    .replace(/\s*[«"]?\s*(я\s+могу\s+ошибаться|i\s+may\s+be\s+wrong|men\s+xato\s+qilishim)[\s\S]*$/i, "")
    .trim();
}

/**
 * AI concierge endpoint (Groq, OpenAI-compatible). Grounded in the resort's
 * facts via buildSystemPrompt(), and able to read live availability/prices
 * from Exely via the check_availability tool. Best-effort: returns a clear
 * error the client turns into a "message us" fallback if the key/network fail.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ai_not_configured" }, { status: 503 });
  }

  let body: { messages?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const locale = body.locale === "uz" || body.locale === "en" ? body.locale : "ru";

  const raw = Array.isArray(body.messages) ? (body.messages as ChatMsg[]) : [];
  const history = raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return Response.json({ error: "empty" }, { status: 400 });
  }

  const messages: GroqMsg[] = [{ role: "system", content: buildSystemPrompt(locale) }, ...history];

  try {
    // First pass — the model may ask to check live availability.
    let { res, model } = await callWithFallback(apiKey, messages, true);
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[chat] Groq ${res.status}: ${detail.slice(0, 300)}`);
      return Response.json({ error: "ai_failed" }, { status: 502 });
    }
    let data = (await res.json()) as GroqResponse;
    let msg = data.choices?.[0]?.message;

    const toolsUsed = new Set<string>();
    if (msg?.tool_calls?.length) {
      msg.tool_calls.forEach((tc) => tc.function?.name && toolsUsed.add(tc.function.name));
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let args: { checkin?: string; checkout?: string; adults?: number } = {};
        try {
          args = JSON.parse(tc.function?.arguments || "{}");
        } catch {
          /* leave empty */
        }
        const name = tc.function?.name;
        const result =
          name === "check_availability"
            ? await checkAvailability(args)
            : name === "get_weather"
              ? await weatherForConcierge()
              : { ok: false, error: "unknown_tool" };
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      // Second pass — model turns the tool result into a natural answer. Stay
      // on whichever model answered the first pass so the voice doesn't switch
      // mid-conversation.
      res = await callGroq(apiKey, messages, false, model);
      if (res.status === 429 && model === MODEL_PRIMARY) {
        model = MODEL_FALLBACK;
        res = await callGroq(apiKey, messages, false, model);
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(`[chat] Groq(2) ${res.status}: ${detail.slice(0, 300)}`);
        return Response.json({ error: "ai_failed" }, { status: 502 });
      }
      data = (await res.json()) as GroqResponse;
      msg = data.choices?.[0]?.message;
    }

    const reply = stripDisclaimer(msg?.content?.trim() ?? "", toolsUsed);
    if (!reply) return Response.json({ error: "ai_failed" }, { status: 502 });

    return Response.json({ reply });
  } catch (err) {
    console.error("[chat] request threw:", err);
    return Response.json({ error: "ai_failed" }, { status: 502 });
  }
}
