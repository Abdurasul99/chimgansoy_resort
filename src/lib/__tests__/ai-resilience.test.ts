import { describe, expect, it, vi, afterEach } from "vitest";
import { tryCallAiModel, type AiTarget } from "../ai-provider";

/**
 * Один упавший аккаунт не должен ронять всю цепочку.
 *
 * Из-за отсутствия этой обёртки телеграм-бот отвечал «Помощник сейчас
 * недоступен» при девяти живых адресатах: на тяжёлом вопросе первая модель
 * думала дольше таймаута, AbortSignal бросал исключение, и оно вылетало мимо
 * цикла перебора — остальные восемь так и не пробовались.
 */

const TARGET: AiTarget = {
  label: "test",
  url: "https://example.invalid/v1/chat",
  key: "k",
  model: "openai/gpt-oss-120b",
};

afterEach(() => vi.restoreAllMocks());

describe("tryCallAiModel", () => {
  it("таймаут превращается в null, а не в исключение", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const e = new Error("The operation was aborted");
        e.name = "TimeoutError";
        throw e;
      }),
    );
    await expect(tryCallAiModel(TARGET, { messages: [] }, 10)).resolves.toBeNull();
  });

  it("обрыв сети — тоже null", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    await expect(tryCallAiModel(TARGET, { messages: [] }, 10)).resolves.toBeNull();
  });

  it("ответ сервера отдаётся как есть — даже 429", async () => {
    // 429 это ОТВЕТ, а не сбой: решение «идти дальше» принимает
    // shouldFallThrough, и подменять его на null здесь нельзя, иначе пропадёт
    // заголовок Retry-After, по которому считается пауза.
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 429 })));
    const res = await tryCallAiModel(TARGET, { messages: [] }, 10);
    expect(res?.status).toBe(429);
  });
});
