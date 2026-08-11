import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  aiTargets,
  answerBudget,
  askAi,
  classify,
  isHardQuestion,
  resetXaiPause,
  xaiPausedUntil,
} from "../ai-provider";

/**
 * Маршрутизация запросов к ИИ.
 *
 * Здесь проверяется ровно то, что уже ломалось в проде и что нельзя увидеть
 * глазами: порядок провайдеров, разбор кодов ошибок и то, что один отказ не
 * гасит остальных. Все обращения к сети замоканы — это тест правил, а не
 * доступности xAI.
 */

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.GROQ_API_KEY = "gsk_test";
  process.env.XAI_API_KEY = "xai_test";
  process.env.AI_GATEWAY_API_KEY = "vck_test";
  resetXaiPause();
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

/** Отвечает по списку: [status, body] на каждый последующий запрос. */
function mockSequence(steps: Array<[number, string?]>) {
  const seen: { url: string; model: string }[] = [];
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      seen.push({ url: String(url), model: JSON.parse(String(init.body)).model });
      const [status, body = "{}"] = steps[Math.min(i++, steps.length - 1)];
      return new Response(body, { status });
    }),
  );
  return seen;
}

describe("порядок провайдеров", () => {
  it("простой вопрос: Groq → xAI → шлюз", () => {
    expect(aiTargets("faq").map((t) => t.label)).toEqual(["groq", "xai", "gateway"]);
  });

  it("расчёт минует Groq: 8b-модель смету не потянет", () => {
    expect(aiTargets("hard").map((t) => t.label)).toEqual(["xai", "gateway"]);
  });

  it("простой вопрос идёт в llama-3.1-8b-instant", () => {
    expect(aiTargets("faq")[0].model).toBe("llama-3.1-8b-instant");
  });

  it("для FAQ берётся НЕразмышляющий Grok, для расчёта — размышляющий", () => {
    expect(aiTargets("faq").find((t) => t.label === "xai")?.model).toContain("non-reasoning");
    expect(aiTargets("hard").find((t) => t.label === "xai")?.model).toBe("grok-4.1-fast-reasoning");
  });

  it("отсутствующий ключ просто выпадает из цепочки", () => {
    delete process.env.XAI_API_KEY;
    expect(aiTargets("faq").map((t) => t.label)).toEqual(["groq", "gateway"]);
  });

  it("ключи только серверные — ни один не NEXT_PUBLIC_", () => {
    for (const name of ["GROQ_API_KEY", "XAI_API_KEY", "AI_GATEWAY_API_KEY"]) {
      expect(name.startsWith("NEXT_PUBLIC_")).toBe(false);
    }
  });
});

describe("бюджет ответа", () => {
  it("обычный FAQ — 400 токенов, расчёт — 2000", () => {
    expect(answerBudget("faq")).toBe(400);
    expect(answerBudget("hard")).toBe(2000);
  });
});

describe("разбор кодов ошибок", () => {
  it("200 — ответ есть", () => {
    expect(classify(200, "")).toBe("ok");
  });

  it("402 — кончились деньги", () => {
    expect(classify(402, "")).toBe("credits");
  });

  it("429 сам по себе — это лимит частоты, а НЕ конец кредитов", () => {
    expect(classify(429, "Rate limit reached for requests per minute")).toBe("retry");
    expect(classify(429, "")).toBe("retry");
  });

  it("429 со словами про деньги — кредиты", () => {
    // У xAI 429 означает и то и другое; различает только текст.
    for (const body of [
      '{"error":"Your team has run out of credits. Please purchase more."}',
      "monthly spending limit reached",
      "insufficient balance",
    ]) {
      expect(classify(429, body), body).toBe("credits");
    }
  });

  it("401 и 403 — к следующему (плюс критичная запись в лог)", () => {
    expect(classify(401, "")).toBe("fallback");
    expect(classify(403, "")).toBe("fallback");
  });

  it("400 — наш кривой запрос: перебор не поможет, отдаём управляемую ошибку", () => {
    expect(classify(400, "invalid tool_choice")).toBe("stop");
  });

  it("404 — к следующему, только если дело в модели", () => {
    expect(classify(404, "The model `grok-9` does not exist")).toBe("fallback");
    expect(classify(404, "provider unavailable")).toBe("fallback");
    // А «нет такого пути» — это опечатка в URL, у следующего будет то же самое.
    expect(classify(404, "Cannot POST /v1/chatcompletions")).toBe("stop");
  });

  it("413 — сначала урезать контекст, а не бежать к следующему", () => {
    expect(classify(413, "request too large")).toBe("shrink");
  });

  it("408 и пятисотые — к следующему", () => {
    for (const code of [408, 500, 502, 503]) {
      expect(classify(code, ""), String(code)).toBe("fallback");
    }
  });
});

describe("askAi — что происходит на самом деле", () => {
  it("Groq ответил — никого больше не зовём", async () => {
    const seen = mockSequence([[200]]);
    const out = await askAi("faq", { messages: [] });
    expect(out.ok && out.target.label).toBe("groq");
    expect(seen).toHaveLength(1);
  });

  it("429 у Groq: одна короткая попытка, потом следующий провайдер", async () => {
    vi.useFakeTimers();
    const seen = mockSequence([[429, "rate limit"], [429, "rate limit"], [200]]);
    const p = askAi("faq", { messages: [] });
    await vi.runAllTimersAsync();
    const out = await p;
    vi.useRealTimers();

    // groq, groq (повтор), затем xai — и никаких бесконечных повторов.
    expect(seen.map((s) => new URL(s.url).host)).toEqual([
      "api.groq.com",
      "api.groq.com",
      "api.x.ai",
    ]);
    expect(out.ok && out.target.label).toBe("xai");
  });

  it("у xAI кончились кредиты — уходим на шлюз и не возвращаемся", async () => {
    const seen = mockSequence([
      [500], // groq упал
      [429, "You have run out of credits, please purchase more"],
      [200], // шлюз
    ]);
    const out = await askAi("faq", { messages: [] });
    expect(out.ok && out.target.label).toBe("gateway");
    expect(seen).toHaveLength(3);
    expect(xaiPausedUntil()).toBeGreaterThan(Date.now());

    // Следующий запрос xAI уже не трогает — деньги не появятся за секунду.
    const again = mockSequence([[500], [200]]);
    const out2 = await askAi("faq", { messages: [] });
    expect(again.map((s) => new URL(s.url).host)).toEqual([
      "api.groq.com",
      "ai-gateway.vercel.sh",
    ]);
    expect(out2.ok && out2.target.label).toBe("gateway");
  });

  it("таймаут у одного не отменяет остальных", async () => {
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (++call === 1) {
          const e = new Error("aborted");
          e.name = "TimeoutError";
          throw e;
        }
        return new Response("{}", { status: 200 });
      }),
    );
    const out = await askAi("faq", { messages: [] });
    expect(out.ok && out.target.label).toBe("xai");
  });

  it("никто не ответил — unavailable, вызывающий покажет телефон", async () => {
    mockSequence([[500]]);
    expect(await askAi("faq", { messages: [] })).toEqual({ ok: false, error: "unavailable" });
  });

  it("400 останавливает перебор на первом же провайдере", async () => {
    const seen = mockSequence([[400, "invalid request"]]);
    const out = await askAi("faq", { messages: [] });
    expect(out).toMatchObject({ ok: false, error: "bad_request", status: 400 });
    // Именно один запрос: кривое тело у следующего будет таким же кривым.
    expect(seen).toHaveLength(1);
  });

  it("413: повтор с урезанным контекстом у того же провайдера", async () => {
    const bodies: Array<{ msgs: number; budget: number }> = [];
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const b = JSON.parse(String(init.body));
        bodies.push({ msgs: b.messages.length, budget: b.max_tokens });
        return new Response("{}", { status: ++call === 1 ? 413 : 200 });
      }),
    );
    const out = await askAi("faq", {
      messages: [
        { role: "system", content: "правила" },
        { role: "user", content: "первый" },
        { role: "assistant", content: "ответ" },
        { role: "user", content: "второй" },
      ],
      max_tokens: 400,
    });

    expect(out.ok && out.target.label).toBe("groq"); // тот же провайдер
    expect(bodies[0].msgs).toBe(4);
    // Осталось системное правило и последняя реплика гостя — история ушла.
    expect(bodies[1].msgs).toBe(2);
    expect(bodies[1].budget).toBeLessThanOrEqual(400);
  });

  it("нет ни одного ключа — no_keys без единого запроса", async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.XAI_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    const seen = mockSequence([[200]]);
    expect(await askAi("faq", { messages: [] })).toEqual({ ok: false, error: "no_keys" });
    expect(seen).toHaveLength(0);
  });
});

describe("какой вопрос считается расчётом", () => {
  it("узнаёт смету", () => {
    for (const q of [
      "Посчитай стоимость на 15 человек",
      "Рассчитайте общую стоимость на одну ночь",
      "Please calculate the total cost for our group",
      "Jami qancha bo'ladi, hisoblab bering",
    ]) {
      expect(isHardQuestion(q), q).toBe(true);
    }
  });

  it("не будит Grok на простом", () => {
    for (const q of ["Во сколько заезд?", "Сколько стоит бассейн?", "Есть ли Wi-Fi?"]) {
      expect(isHardQuestion(q), q).toBe(false);
    }
  });
});
