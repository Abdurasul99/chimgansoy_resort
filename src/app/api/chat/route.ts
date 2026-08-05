import type { NextRequest } from "next/server";
import { buildSystemPrompt } from "@/lib/ai-context";
import { checkAvailability } from "@/lib/exely";
import { getChimganWeather, weatherInfo } from "@/lib/bot-weather";
import { venueTopic, type Topic } from "@/lib/venue-topics";
import { aiTargets, callAiModel, shouldFallThrough, type AiTarget } from "@/lib/ai-provider";

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


type ChatMsg = { role: "user" | "assistant"; content: string };
type ToolCall = { id: string; function: { name: string; arguments: string } };
type GroqMsg = {
  role: string;
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};
type GroqUsage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
type GroqResponse = { choices?: Array<{ message?: GroqMsg }>; usage?: GroqUsage };

/**
 * Prompt and completion tokens, separately, in the log.
 *
 * The quota header gives a total; billing everywhere charges input and output
 * at different rates — often by an order of magnitude — so a total cannot
 * answer "what would this cost elsewhere". This can.
 */
function logUsage(where: string, model: string, usage?: GroqUsage) {
  if (!usage) return;
  console.log(
    `[chat] usage ${where} ${model}: in=${usage.prompt_tokens ?? "?"} out=${usage.completion_tokens ?? "?"} total=${usage.total_tokens ?? "?"}`,
  );
}

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
      name: "lookup_facts",
      description:
        "Подробности о курорте, которых нет в кратком брифинге: полный тариф бассейна с бунгало и полотенцами (pool), меню ресторана и правила своей еды (menu), дорога, координаты и ссылки на карты (directions), условия отмены, переноса, предоплаты, депозита и животных (policy), аренда мангала/казана, дрова, уголь, парковка (extras), подробный состав шале и глэмпинга (rooms). Вызывай ВМЕСТО того, чтобы отвечать «уточните у администратора».",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: ["pool", "menu", "directions", "policy", "extras", "rooms"],
            description: "Тема, по которой нужны подробности",
          },
        },
        required: ["topic"],
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

async function callModel(target: AiTarget, messages: GroqMsg[], withTools: boolean): Promise<Response> {
  const body: Record<string, unknown> = { messages, temperature: 0.15, max_tokens: 700 };
  if (withTools) {
    body.tools = TOOLS;
    body.tool_choice = "auto";
  }
  const res = await callAiModel(target, body, 30_000);

  /**
   * The quota, in the log, on every call.
   *
   * Groq reports the remaining per-minute allowance in response headers. Without
   * this the only signal that the site is at its ceiling is a guest getting a
   * 502 — which is how the concierge managed to be down all day unnoticed. One
   * line per call makes "how close are we" answerable before it breaks, and
   * makes the case for a paid tier a measurement rather than an argument.
   */
  const remaining = res.headers.get("x-ratelimit-remaining-tokens");
  const limit = res.headers.get("x-ratelimit-limit-tokens");
  if (limit) {
    console.log(
      `[chat] quota ${target.model}: ${remaining ?? "?"}/${limit} tokens left this minute` +
        ` (reset ${res.headers.get("x-ratelimit-reset-tokens") ?? "?"}, http ${res.status})`,
    );
  }

  return res;
}

/**
 * Walks the provider list until one answers. A guest waiting on a price should
 * never see an error because another guest asked a question ten seconds ago,
 * nor because a prepaid balance ran dry overnight.
 */
async function callWithFallback(
  targets: AiTarget[],
  messages: GroqMsg[],
  withTools: boolean,
): Promise<{ res: Response; target: AiTarget }> {
  let last: Response | null = null;

  for (const target of targets) {
    const res = await callModel(target, messages, withTools);
    if (!shouldFallThrough(res.status)) return { res, target };
    last = res;
    console.warn(`[chat] ${target.label} ${target.model} unavailable (${res.status})`);
  }

  /**
   * Every provider is out at once.
   *
   * Groq says how long to wait in Retry-After; honouring it once turns a visible
   * failure into a slower answer, which is what a guest waiting on a price would
   * choose. Capped so nobody stares at a spinner — past that the caller shows
   * the "call us" fallback.
   */
  const retry = targets[targets.length - 1];
  const wait = Math.min((Number(last?.headers.get("retry-after")) || 4) * 1000, 6_000);
  console.error(`[chat] every provider unavailable, retrying ${retry.model} in ${wait}ms`);
  await new Promise((r) => setTimeout(r, wait));
  return { res: await callModel(retry, messages, withTools), target: retry };
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
  const stripped = reply
    .replace(/\s*[«"]?\s*(я\s+могу\s+ошибаться|i\s+may\s+be\s+wrong|men\s+xato\s+qilishim)[\s\S]*$/i, "")
    .trim();
  /**
   * "Always places it last" is a prompt instruction, not a guarantee. A model
   * that opens with the disclaimer instead has its entire answer cut here, and
   * the caller turns the empty string into a 502 — which is exactly how every
   * weather question started failing the moment a new provider phrased things
   * its own way. An unwanted sentence is a far smaller problem than no answer.
   */
  return stripped || reply;
}

/**
 * AI concierge endpoint (DeepSeek, then Groq — both OpenAI-compatible, so one
 * request shape serves every provider). Grounded in the resort's
 * facts via buildSystemPrompt(), and able to read live availability/prices
 * from Exely via the check_availability tool. Best-effort: returns a clear
 * error the client turns into a "message us" fallback if the key/network fail.
 */
export async function POST(req: NextRequest) {
  const targets = aiTargets();
  if (targets.length === 0) {
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
    let { res, target } = await callWithFallback(targets, messages, true);
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[chat] ${target.label} ${res.status}: ${detail.slice(0, 300)}`);
      return Response.json({ error: "ai_failed" }, { status: 502 });
    }
    let data = (await res.json()) as GroqResponse;
    logUsage("pass1", target.model, data.usage);
    let msg = data.choices?.[0]?.message;

    const toolsUsed = new Set<string>();
    if (msg?.tool_calls?.length) {
      msg.tool_calls.forEach((tc) => tc.function?.name && toolsUsed.add(tc.function.name));
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let args: { checkin?: string; checkout?: string; adults?: number; topic?: string } = {};
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
              : name === "lookup_facts"
                ? { ok: true, topic: args.topic, facts: venueTopic((args.topic as Topic) ?? "policy") }
                : { ok: false, error: "unknown_tool" };
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      // Second pass — model turns the tool result into a natural answer. Stay
      // on whichever model answered the first pass so the voice doesn't switch
      // mid-conversation.
      res = await callModel(target, messages, false);
      if (shouldFallThrough(res.status)) {
        // Second pass has no tools, so it is cheap; walk the rest of the chain
        // rather than losing an answer the guest has already waited for.
        for (const next of targets) {
          if (next === target) continue;
          res = await callModel(next, messages, false);
          target = next;
          if (!shouldFallThrough(res.status)) break;
        }
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(`[chat] ${target.label}(2) ${res.status}: ${detail.slice(0, 300)}`);
        return Response.json({ error: "ai_failed" }, { status: 502 });
      }
      data = (await res.json()) as GroqResponse;
      logUsage("pass2", target.model, data.usage);
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
