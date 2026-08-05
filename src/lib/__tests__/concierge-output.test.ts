import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/ai-context";
import type { AvailOption } from "@/lib/exely";

/**
 * Three faults the operator caught in one screenshot on 2026-08-05, asking the
 * live concierge about 20 August:
 *
 *   1. it answered with a raw Markdown pipe table, which the chat panel shows
 *      character for character;
 *   2. it stayed in English after the guest switched language;
 *   3. it promised "free cancellation up to 48 hours before check-in" on a
 *      prepayment the public offer makes non-refundable.
 *
 * (3) is the expensive one: it is a written commitment to a guest that
 * contradicts the contract they accept at booking.
 */

describe("concierge — the promise it must never make", () => {
  it("has no cancellation terms in the availability payload", () => {
    // A type-level assertion: the tool result is serialised straight into the
    // model's context, so any field here is something the model can quote.
    const option: AvailOption = { name: "Шале", price: 3_000_000 };
    expect(Object.keys(option).sort()).toEqual(["name", "price"]);

    // @ts-expect-error — Exely's rate plan exposes free_cancellation; it must
    // not travel with the price. See the note on AvailOption.
    const leaked: AvailOption = { name: "Шале", price: 3_000_000, freeCancellation: true };
    expect(leaked).toBeTruthy();
  });

  it("is told the engine is not the source of cancellation terms", () => {
    const prompt = buildSystemPrompt("ru");
    expect(prompt).toMatch(/инструмент бронирования НЕ является источником условий отмены/i);
    expect(prompt).toMatch(/free cancellation/i);
    expect(prompt).toMatch(/предоплата невозвратная/i);
  });
});

describe("concierge — formatting", () => {
  const prompt = buildSystemPrompt("ru");

  it("forbids the markup the chat panel cannot render", () => {
    expect(prompt).toMatch(/ЗАПРЕЩЕНЫ: таблицы Markdown/);
    // Links are the one thing the panel does render, so they must stay allowed.
    expect(prompt).toMatch(/Единственная разрешённая разметка — ссылки/);
  });
});

describe("concierge — language", () => {
  for (const locale of ["ru", "uz", "en"] as const) {
    it(`${locale}: says the language is decided per message, not per conversation`, () => {
      const prompt = buildSystemPrompt(locale);
      expect(prompt).toMatch(/Язык определяется ЗАНОВО для КАЖДОГО ответа/);
      expect(prompt).toMatch(/предыдущие пять реплик были на английском/);
    });
  }
});
