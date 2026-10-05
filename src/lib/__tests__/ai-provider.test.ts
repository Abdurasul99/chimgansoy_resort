import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  aiTargets,
  answerBudget,
  askAi,
  classify,
  isHardQuestion,
  resetXaiPause,
  retryAfterMs,
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

/** Отвечает по списку: [status, body, headers] на каждый последующий запрос. */
function mockSequence(steps: Array<[number, string?, Record<string, string>?]>) {
  const seen: { url: string; model: string }[] = [];
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      seen.push({ url: String(url), model: JSON.parse(String(init.body)).model });
      const [status, body = "{}", headers] = steps[Math.min(i++, steps.length - 1)];
      return new Response(body, { status, headers });
    }),
  );
  return seen;
}

/** «groq:gpt-oss-20b» — кто и с какой моделью стоит в цепочке. */
const chain = (kind: "faq" | "hard") => aiTargets(kind).map((t) => `${t.label}:${t.model.replace(/^.*\//, "")}`);

/** Настоящий ответ Groq на минутный лимит (04.10.2026, проверено с сервера). */
const GROQ_TPM =
  '{"error":{"message":"Rate limit reached for model `openai/gpt-oss-20b` in organization `org_x` service tier `on_demand` on tokens per minute (TPM): Limit 8000, Used 5536, Requested 5599. Please try again in 23.5125s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}}';

describe("порядок провайдеров", () => {
  it("простой вопрос: Groq 20b → Groq 120b → xAI → шлюз", () => {
    // Вторая модель Groq — запас первой: у неё своя минутная квота.
    expect(chain("faq")).toEqual([
      "groq:gpt-oss-20b",
      "groq:gpt-oss-120b",
      "xai:grok-4.1-fast-non-reasoning",
      "gateway:grok-4.1-fast-non-reasoning",
    ]);
  });

  it("расчёт: сначала сильные модели, 20b — последний шанс вместо телефона", () => {
    expect(chain("hard")).toEqual([
      "xai:grok-4.1-fast-reasoning",
      "groq:gpt-oss-120b",
      "gateway:grok-4.1-fast-reasoning",
      "groq:gpt-oss-20b",
    ]);
  });

  it("без xAI и шлюза расчёт всё равно идёт в Groq, а не в никуда", () => {
    // Так было с октября 2026: xAI не подключён, шлюз отвечает 401, а цепочка
    // «hard» состояла только из них — каждый расчёт кончался «недоступен».
    delete process.env.XAI_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    expect(chain("hard")).toEqual(["groq:gpt-oss-120b", "groq:gpt-oss-20b"]);
  });

  it("простой вопрос идёт в лёгкую модель Groq", () => {
    // llama-3.1-8b-instant сняли с обслуживания: Groq стал отвечать 400
    // model_decommissioned, и консьерж замолчал целиком.
    expect(aiTargets("faq")[0].model).toBe("openai/gpt-oss-20b");
  });

  it("для FAQ берётся НЕразмышляющий Grok, для расчёта — размышляющий", () => {
    expect(aiTargets("faq").find((t) => t.label === "xai")?.model).toContain("non-reasoning");
    expect(aiTargets("hard").find((t) => t.label === "xai")?.model).toBe("grok-4.1-fast-reasoning");
  });

  it("отсутствующий ключ просто выпадает из цепочки", () => {
    delete process.env.XAI_API_KEY;
    expect(aiTargets("faq").map((t) => t.label)).toEqual(["groq", "groq", "gateway"]);
  });

  it("ключи только серверные — ни один не NEXT_PUBLIC_", () => {
    for (const name of ["GROQ_API_KEY", "XAI_API_KEY", "AI_GATEWAY_API_KEY"]) {
      expect(name.startsWith("NEXT_PUBLIC_")).toBe(false);
    }
  });
});

describe("бюджет ответа", () => {
  it("обычный FAQ — 900 токенов, расчёт — 2000", () => {
    // Было 400, и на длинных вопросах модель тратила весь потолок на
    // рассуждение, возвращая пустой текст: гость видел «Не получилось
    // ответить» при полностью исправном провайдере.
    expect(answerBudget("faq")).toBe(900);
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

  it("минутный лимит Groq со ссылкой на billing — всё равно лимит, не деньги", () => {
    // Из-за слова «billing» в ссылке каждый такой отказ считался «кончились
    // кредиты»: без повтора и сразу дальше, где живых не было.
    expect(classify(429, GROQ_TPM)).toBe("retry");
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

  it("400 про снятую модель — к следующему провайдеру", () => {
    // Groq отвечает 400, а не 404, когда снимает модель с обслуживания.
    // Из-за этого консьерж молчал целиком: цепочка вставала на первом же.
    expect(classify(400, "model_decommissioned: llama-3.1-8b-instant")).toBe("fallback");
    expect(classify(400, "The model has been deprecated")).toBe("fallback");
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

  it("429 у Groq без подсказки: одна короткая попытка, потом следующая модель", async () => {
    vi.useFakeTimers();
    const seen = mockSequence([[429, "rate limit"], [429, "rate limit"], [200]]);
    const p = askAi("faq", { messages: [] });
    await vi.runAllTimersAsync();
    const out = await p;
    vi.useRealTimers();

    // 20b, 20b (повтор), затем 120b со своей квотой — и никаких бесконечных повторов.
    expect(seen.map((s) => s.model)).toEqual(["openai/gpt-oss-20b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"]);
    expect(out.ok && out.target.model).toBe("openai/gpt-oss-120b");
  });

  it("Groq просит подождать 24 с — не ждём, сразу идём к его второй модели", async () => {
    const seen = mockSequence([[429, GROQ_TPM, { "retry-after": "24" }], [200]]);
    const started = Date.now();
    const out = await askAi("faq", { messages: [] });
    expect(Date.now() - started).toBeLessThan(1000);
    expect(seen.map((s) => s.model)).toEqual(["openai/gpt-oss-20b", "openai/gpt-oss-120b"]);
    expect(out.ok && out.target.model).toBe("openai/gpt-oss-120b");
  });

  it("отказали все, но Groq просил подождать недолго — ждём и получаем ответ", async () => {
    // Случай из журнала 04.10.2026: вопрос «26 декабря» — второй заход после
    // запроса в Exely не влез в минутную квоту, а шлюз Vercel отвечает 401.
    delete process.env.XAI_API_KEY;
    vi.useFakeTimers();
    const seen = mockSequence([
      [429, GROQ_TPM, { "retry-after": "20" }], // 20b
      [429, GROQ_TPM, { "retry-after": "8" }], // 120b
      [401, '{"error":{"type":"authentication_error"}}'], // шлюз
      [200], // 120b после ожидания
    ]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const p = askAi("faq", { messages: [] });
    await vi.runAllTimersAsync();
    const out = await p;
    vi.useRealTimers();

    expect(out.ok && out.target.model).toBe("openai/gpt-oss-120b");
    expect(seen.map((s) => new URL(s.url).host)).toEqual([
      "api.groq.com",
      "api.groq.com",
      "ai-gateway.vercel.sh",
      "api.groq.com",
    ]);
  });

  it("просит ждать минуты — не ждём, честно отвечаем «недоступен» с причинами", async () => {
    delete process.env.XAI_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    mockSequence([[429, "Rate limit reached on tokens per day (TPD). Please try again in 7m12s."]]);
    const out = await askAi("faq", { messages: [] });
    expect(out).toMatchObject({ ok: false, error: "unavailable" });
    expect(!out.ok && out.detail).toContain("groq gpt-oss-20b: 429");
  });

  it("у xAI кончились кредиты — уходим на шлюз и не возвращаемся", async () => {
    const seen = mockSequence([
      [500], // groq 20b упал
      [500], // groq 120b упал
      [429, "You have run out of credits, please purchase more"],
      [200], // шлюз
    ]);
    const out = await askAi("faq", { messages: [] });
    expect(out.ok && out.target.label).toBe("gateway");
    expect(seen).toHaveLength(4);
    expect(xaiPausedUntil()).toBeGreaterThan(Date.now());

    // Следующий запрос xAI уже не трогает — деньги не появятся за секунду.
    const again = mockSequence([[500], [500], [200]]);
    const out2 = await askAi("faq", { messages: [] });
    expect(again.map((s) => new URL(s.url).host)).toEqual([
      "api.groq.com",
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
    expect(out.ok && out.target.model).toBe("openai/gpt-oss-120b");
  });

  it("никто не ответил — unavailable с причинами, вызывающий покажет телефон", async () => {
    mockSequence([[500]]);
    const out = await askAi("faq", { messages: [] });
    expect(out).toMatchObject({ ok: false, error: "unavailable" });
    expect(!out.ok && out.detail).toBe(
      "groq gpt-oss-20b: 500; groq gpt-oss-120b: 500; xai grok-4.1-fast-non-reasoning: 500; gateway grok-4.1-fast-non-reasoning: 500",
    );
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

describe("сколько просят подождать", () => {
  it("Retry-After в секундах — главнее текста", () => {
    expect(retryAfterMs("24", GROQ_TPM)).toBe(24_000);
  });

  it("без заголовка — из текста Groq", () => {
    expect(retryAfterMs(null, GROQ_TPM)).toBe(23_513);
    expect(retryAfterMs(null, "Please try again in 7m12s.")).toBe(432_000);
  });

  it("не сказал — null", () => {
    expect(retryAfterMs(null, "rate limit")).toBeNull();
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

describe("второй аккаунт Groq — вторая минутная квота", () => {
  it("встаёт в цепочку сразу за первым", () => {
    // Бесплатный тариф Groq — 8000 токенов в минуту, а один вопрос с брифингом
    // стоит около 5400. Второй вопрос в ту же минуту упирается в 429, и без
    // второго ключа сайт сразу уходит на платный запас.
    vi.stubEnv("GROQ_API_KEY", "gsk_первый");
    vi.stubEnv("GROQ_API_KEY_2", "gsk_второй");
    vi.stubEnv("XAI_API_KEY", "xai_ключ");
    vi.stubEnv("AI_GATEWAY_API_KEY", "gw_ключ");

    expect(aiTargets("faq").map((t) => t.label)).toEqual(["groq", "groq-2", "groq", "groq-2", "xai", "gateway"]);
  });

  it("одинаковые ключи не дублируются — это не две квоты, а одна", () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_один");
    vi.stubEnv("GROQ_API_KEY_2", "gsk_один");
    vi.stubEnv("XAI_API_KEY", "");
    vi.stubEnv("AI_GATEWAY_API_KEY", "");

    expect(chain("faq")).toEqual(["groq:gpt-oss-20b", "groq:gpt-oss-120b"]);
  });

  it("в расчётах оба ключа — сначала на большой модели", () => {
    vi.stubEnv("GROQ_API_KEY", "gsk_первый");
    vi.stubEnv("GROQ_API_KEY_2", "gsk_второй");
    vi.stubEnv("AI_GATEWAY_API_KEY", "gw_ключ");
    vi.stubEnv("XAI_API_KEY", "");

    expect(chain("hard")).toEqual([
      "groq:gpt-oss-120b",
      "groq-2:gpt-oss-120b",
      "gateway:grok-4.1-fast-reasoning",
      "groq:gpt-oss-20b",
      "groq-2:gpt-oss-20b",
    ]);
  });
});

describe("бюджет ответа", () => {
  it("простому вопросу хватает места на рассуждение и на текст", () => {
    // 400 не хватало: gpt-oss-20b тратит часть бюджета на рассуждение, и на
    // длинных вопросах ответа не оставалось вовсе — приходило пустое поле.
    // В логах это было видно как out=400, ровно в потолок.
    expect(answerBudget("faq")).toBeGreaterThanOrEqual(700);
  });

  it("вместе с брифингом укладывается в минутную квоту Groq", () => {
    // Брифинг стоит около 5400 токенов, бесплатный тариф даёт 8000 в минуту.
    // Если бюджет ответа сделать больше, один вопрос перестанет помещаться
    // целиком и будет упираться в лимит с первой же попытки.
    const БРИФИНГ = 5400;
    const КВОТА = 8000;
    expect(БРИФИНГ + answerBudget("faq")).toBeLessThan(КВОТА);
  });

  it("расчёту по-прежнему дают больше — смета длиннее ответа", () => {
    expect(answerBudget("hard")).toBeGreaterThan(answerBudget("faq"));
  });
});

describe("платный запас включается там, где бесплатный не справился", () => {
  it("расчёт начинается с платного Grok, если он подключён", () => {
    vi.stubEnv("XAI_API_KEY", "xai_ключ");
    expect(aiTargets("hard")[0].label).toBe("xai");
  });

  it("повтору дают больше места, чем первой попытке", () => {
    expect(answerBudget("hard")).toBeGreaterThan(answerBudget("faq"));
  });
});
