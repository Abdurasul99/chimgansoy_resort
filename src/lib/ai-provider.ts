/**
 * Which model answers, and in what order, for BOTH assistants.
 *
 * The site concierge (app/api/chat) and the Telegram bot (lib/staff-ai) ask
 * different questions with different tools, but they must agree on where the
 * answer comes from. Kept in one file because the alternative is the failure
 * that hides for a week: a balance runs dry, the site falls back to Groq, and
 * the bot — with its own copy of the list — keeps calling the dead provider.
 *
 * Every provider here speaks the OpenAI chat-completions shape, so switching
 * between them is a URL, a key and a model name.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

/**
 * DeepSeek first, Groq behind it.
 *
 * Groq's free tier allows 8 000 tokens a minute and one venue question costs
 * ~3 700 of them, which is what forced the model-juggling below and what cut
 * the knowledge base down to size. DeepSeek is paid, so it has no such cliff,
 * and measured against this project's own prompt it answered in 280–440 ms
 * while holding Russian and grouping digits correctly — the two things
 * gpt-oss-20b could not do. Its prompt cache charges $0.0028 per million on a
 * hit against $0.14 on a miss, and the venue briefing is the same static block
 * every time, so nearly all of our input tokens are hits.
 *
 * Groq stays underneath rather than being deleted: it is free, and a prepaid
 * balance can run out at 2am. When it does, the guest gets a slower answer
 * instead of an error.
 */
const MODEL_DEEPSEEK = "deepseek-v4-flash";

/**
 * The Groq tiers, best first.
 *
 * 20b at reasoning_effort "low" could not hold the language instruction:
 * guests writing Russian got answers in Kazakh, and digit grouping came out as
 * "320 0000 сум" for a 3 200 000 rate. 120b fixes both but has the tightest
 * per-minute allowance, so it cannot be the only one. The third is from a
 * different family on purpose — it has its OWN token bucket, and a fallback
 * that fails for the same reason as the primary is not a fallback.
 */
const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];

/** One provider + model + key the assistants may call. */
export type AiTarget = { label: string; url: string; key: string; model: string; groq: boolean };

/**
 * Every configured provider, best first. Blank or missing keys drop out, so
 * removing DEEPSEEK_API_KEY in Vercel returns both assistants to the Groq-only
 * behaviour they had before, with no code change.
 *
 * Among the Groq entries keys are the INNER loop and models the outer one: a
 * second key is a second per-minute allowance rather than a spare, so asking
 * 120b again on the other account beats dropping to 20b on the exhausted one.
 */
export function aiTargets(): AiTarget[] {
  const out: AiTarget[] = [];

  const deepseek = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseek) {
    out.push({ label: "deepseek", url: DEEPSEEK_URL, key: deepseek, model: MODEL_DEEPSEEK, groq: false });
  }

  const groqKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2]
    .map((k) => k?.trim())
    .filter((k): k is string => Boolean(k));
  for (const model of GROQ_MODELS) {
    groqKeys.forEach((key, i) =>
      out.push({ label: `groq/key${i + 1}`, url: GROQ_URL, key, model, groq: true }),
    );
  }

  return out;
}

/**
 * "This provider cannot serve the request — try the next one."
 *
 * 429 is Groq's per-minute ceiling. 402 is how DeepSeek reports an empty
 * balance, and without it here a spent balance would hand the guest a 502
 * while a perfectly good free tier sat unused one entry below.
 *
 * 401/403 are here because of how this list first got tested: a stale key from
 * the old DeepSeek integration was still set in the environment, shadowed the
 * new one, and every single guest question returned a 502 — with two working
 * Groq accounts configured and idle. A wrong credential is an operator problem
 * and it belongs in the log, but there is no version of it the guest should
 * have to see.
 */
export function shouldFallThrough(status: number): boolean {
  return status === 429 || status === 402 || status === 401 || status === 403 || status >= 500;
}

/**
 * One call. The caller owns the body — tools, temperature and token budget
 * differ between the site and the bot — this only adds what is provider-
 * specific and puts the request on the wire.
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
      // A gpt-oss knob, not a standard one: "low" starved the language and
      // price-formatting rules of attention. Sent only to Groq — no other
      // provider has reason to accept a field it never defined.
      ...(target.groq ? { reasoning_effort: "medium" } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
}
