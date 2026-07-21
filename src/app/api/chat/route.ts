import type { NextRequest } from "next/server";
import { buildSystemPrompt } from "@/lib/ai-context";
import { checkAvailability } from "@/lib/exely";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

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
      description:
        "Проверить РЕАЛЬНУЮ доступность номеров, цены проживания и платные доп. услуги (бассейн) на конкретные даты в системе бронирования (Exely). Вызывай всегда, когда гость спрашивает про свободные номера, цену проживания (Шале/Глэмпинг), стоимость услуг/бассейна или бронь на конкретную дату/период. Даты — в формате YYYY-MM-DD.",
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
];

async function callGroq(apiKey: string, messages: GroqMsg[], withTools: boolean): Promise<Response> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.25,
    max_tokens: 1000,
    reasoning_effort: "low",
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
    let res = await callGroq(apiKey, messages, true);
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[chat] Groq ${res.status}: ${detail.slice(0, 300)}`);
      return Response.json({ error: "ai_failed" }, { status: 502 });
    }
    let data = (await res.json()) as GroqResponse;
    let msg = data.choices?.[0]?.message;

    if (msg?.tool_calls?.length) {
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let args: { checkin?: string; checkout?: string; adults?: number } = {};
        try {
          args = JSON.parse(tc.function?.arguments || "{}");
        } catch {
          /* leave empty */
        }
        const result =
          tc.function?.name === "check_availability"
            ? await checkAvailability(args)
            : { ok: false, error: "unknown_tool" };
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      // Second pass — model turns the tool result into a natural answer.
      res = await callGroq(apiKey, messages, false);
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(`[chat] Groq(2) ${res.status}: ${detail.slice(0, 300)}`);
        return Response.json({ error: "ai_failed" }, { status: 502 });
      }
      data = (await res.json()) as GroqResponse;
      msg = data.choices?.[0]?.message;
    }

    const reply = msg?.content?.trim() ?? "";
    if (!reply) return Response.json({ error: "ai_failed" }, { status: 502 });

    return Response.json({ reply });
  } catch (err) {
    console.error("[chat] request threw:", err);
    return Response.json({ error: "ai_failed" }, { status: 502 });
  }
}
