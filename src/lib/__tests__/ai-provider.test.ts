import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { aiTargets, callAiModel, isHardQuestion, shouldFallThrough } from "../ai-provider";

/**
 * Цепочка «кто отвечает гостю» — то место, где тихая поломка стоит дороже
 * всего: консьерж просто начинает отвечать «попробуйте позже», и узнают об
 * этом от гостя, а не из лога.
 *
 * Здесь проверяется три вещи, каждая уже ломалась или могла сломаться:
 *  • шлюз подключается только когда задан ключ и не мешает, когда его нет;
 *  • запрос к шлюзу несёт закрепление провайдера — без него «только Groq»
 *    остаётся обещанием, а обслужить модель может кто угодно из восьми;
 *  • закрепление не утекает в прямой API Groq, который на чужое поле в теле
 *    отвечает ошибкой.
 */

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.GROQ_API_KEY = "test-key-1";
  delete process.env.GROQ_API_KEY_2;
  delete process.env.AI_GATEWAY_API_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe("цепочка адресатов", () => {
  it("без ключа шлюза остаются только свои аккаунты Groq", () => {
    const targets = aiTargets();
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every((t) => t.url.includes("api.groq.com"))).toBe(true);
    expect(targets.some((t) => t.label.startsWith("gateway/"))).toBe(false);
  });

  it("с ключом шлюза он добавляется В КОНЕЦ, а не в начало", () => {
    process.env.AI_GATEWAY_API_KEY = "vck_test";
    const targets = aiTargets();
    const firstGateway = targets.findIndex((t) => t.label.startsWith("gateway/"));
    const lastGroq = targets.map((t) => t.label.startsWith("groq/")).lastIndexOf(true);
    // Свои ключи бесплатны, шлюз — по счёту: платить начинаем только когда
    // бесплатная минута выбрана.
    expect(firstGateway).toBeGreaterThan(lastGroq);
  });

  it("шлюз зовёт те же модели и ни одной чужой, в том же порядке", () => {
    process.env.AI_GATEWAY_API_KEY = "vck_test";
    const models = (hard: boolean) =>
      aiTargets(hard).filter((t) => t.label.startsWith("gateway/")).map((t) => t.model);

    // Порядок у шлюза повторяет порядок своих ключей: если бесплатные аккаунты
    // кончились на 20b, платный запас начнёт с неё же, а не со 120b.
    expect(models(false)).toEqual([
      "openai/gpt-oss-20b",
      "openai/gpt-oss-120b",
      "meta/llama-3.3-70b",
    ]);
    expect(models(true)).toEqual([
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "meta/llama-3.3-70b",
    ]);
  });

  it("работает и когда свои ключи не заданы вовсе — остаётся один шлюз", () => {
    delete process.env.GROQ_API_KEY;
    process.env.AI_GATEWAY_API_KEY = "vck_test";
    const targets = aiTargets();
    expect(targets.length).toBe(3);
    expect(targets.every((t) => t.label.startsWith("gateway/"))).toBe(true);
  });
});

describe("только Groq", () => {
  /** Перехватываем сеть: нас интересует тело запроса, а не ответ. */
  function captureBody() {
    const seen: { url: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        seen.push({ url, body: JSON.parse(String(init.body)) });
        return new Response("{}", { status: 200 });
      }),
    );
    return seen;
  }

  it("запрос к шлюзу закрепляет провайдера groq", async () => {
    process.env.AI_GATEWAY_API_KEY = "vck_test";
    const seen = captureBody();
    const gateway = aiTargets().find((t) => t.label.startsWith("gateway/"))!;
    await callAiModel(gateway, { messages: [] }, 1000);

    expect(seen[0].url).toContain("ai-gateway.vercel.sh");
    // Модель у шлюза называет только МОДЕЛЬ; обслужить её могут восемь разных
    // провайдеров, и без этого поля запрос ушёл бы к любому из них.
    expect(seen[0].body.providerOptions).toEqual({ gateway: { only: ["groq"] } });
  });

  it("прямой запрос в Groq не тащит с собой поле шлюза", async () => {
    const seen = captureBody();
    const direct = aiTargets().find((t) => t.label.startsWith("groq/"))!;
    await callAiModel(direct, { messages: [] }, 1000);

    expect(seen[0].url).toContain("api.groq.com");
    expect(seen[0].body.providerOptions).toBeUndefined();
  });
});

describe("какая модель отвечает первой", () => {
  /**
   * Решение оператора 2026-08-11: обычные вопросы — 20b, 120b только на
   * настоящие расчёты. Обе остаются в цепочке; порядок решает, кого спросят
   * первым, а не кого исключат.
   */
  it("обычный вопрос начинает с 20b", () => {
    expect(aiTargets(false)[0].model).toBe("openai/gpt-oss-20b");
  });

  it("расчёт начинает со 120b", () => {
    expect(aiTargets(true)[0].model).toBe("openai/gpt-oss-120b");
  });

  it("обе модели остаются в цепочке в любом случае", () => {
    for (const hard of [false, true]) {
      const models = aiTargets(hard).map((t) => t.model);
      expect(models).toContain("openai/gpt-oss-20b");
      expect(models).toContain("openai/gpt-oss-120b");
    }
  });

  it("узнаёт вопрос, ради которого нужна старшая модель", () => {
    for (const q of [
      "Посчитай стоимость на 15 человек",
      "Рассчитайте общую стоимость на одну ночь",
      "Сколько всего выйдет за два домика и бассейн?",
      "Please calculate the total cost for our group",
      "Jami qancha bo'ladi, hisoblab bering",
    ]) {
      expect(isHardQuestion(q), q).toBe(true);
    }
  });

  it("не будит её на простом", () => {
    for (const q of [
      "Во сколько заезд?",
      "Сколько стоит бассейн?",
      "Есть ли Wi-Fi?",
      "Salom, glemping narxi qancha?",
    ]) {
      expect(isHardQuestion(q), q).toBe(false);
    }
  });
});

describe("когда переключаться на следующего", () => {
  it("429, 401, 403 и пятисотые уводят дальше по цепочке", () => {
    for (const code of [429, 401, 403, 500, 502, 503]) {
      expect(shouldFallThrough(code), String(code)).toBe(true);
    }
  });

  it("успех и ошибка запроса дальше не уводят", () => {
    for (const code of [200, 400, 404]) {
      expect(shouldFallThrough(code), String(code)).toBe(false);
    }
  });
});
