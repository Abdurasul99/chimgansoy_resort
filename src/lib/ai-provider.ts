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
const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];

/** One model + account the assistants may call. */
export type AiTarget = { label: string; url: string; key: string; model: string };

/**
 * Every configured account, best model first. Blank or missing keys drop out,
 * so deleting GROQ_API_KEY_2 in Vercel is all it takes to go back to one.
 *
 * Keys are the INNER loop and models the outer one: the per-minute allowance is
 * per account, so a second key is a second allowance rather than a spare, and
 * asking 120b again on the other account beats dropping to 20b on the
 * exhausted one. Dropping a tier happens only when every account is out.
 */
export function aiTargets(): AiTarget[] {
  const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2]
    .map((k) => k?.trim())
    .filter((k): k is string => Boolean(k));

  const out: AiTarget[] = [];
  for (const model of GROQ_MODELS) {
    keys.forEach((key, i) => out.push({ label: `groq/key${i + 1}`, url: GROQ_URL, key, model }));
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
  return status === 429 || status === 401 || status === 403 || status >= 500;
}

/**
 * One call. The caller owns the body — tools, temperature and token budget
 * differ between the site and the bot — this only adds what is account-specific
 * and puts the request on the wire.
 */
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
      model: target.model,
      // "low" starved the language and price-formatting rules of attention.
      reasoning_effort: "medium",
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
}
