import type { NextRequest } from "next/server";
import { buildSystemPrompt } from "@/lib/ai-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

type ChatMsg = { role: "user" | "assistant"; content: string };

/**
 * AI assistant endpoint (Groq, OpenAI-compatible). Grounds the model in the
 * resort's knowledge base via buildSystemPrompt(). Best-effort: returns a clear
 * error the client can turn into a "message us" fallback if the key/network fail.
 * Requires GROQ_API_KEY in the environment (free key from console.groq.com).
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

  const systemPrompt = buildSystemPrompt(locale);
  // TEMP debug: echo the exact rendered prompt to compare local vs deployed.
  if (history[history.length - 1].content === "__debugprompt__") {
    return Response.json({ reply: systemPrompt });
  }
  const messages = [{ role: "system" as const, content: systemPrompt }, ...history];

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.25,
        max_tokens: 1000,
        // gpt-oss is a reasoning model — keep the chain-of-thought short so the
        // answer stays fast and fits the token budget (final text is in `content`).
        reasoning_effort: "low",
      }),
      // Fail fast so the client can show the contact fallback quickly.
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[chat] Groq ${res.status}: ${detail.slice(0, 300)}`);
      return Response.json({ error: "ai_failed" }, { status: 502 });
    }

    const data = await res.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) return Response.json({ error: "ai_failed" }, { status: 502 });

    return Response.json({ reply });
  } catch (err) {
    console.error("[chat] request threw:", err);
    return Response.json({ error: "ai_failed" }, { status: 502 });
  }
}
