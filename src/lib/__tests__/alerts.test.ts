import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Заявка не дошла в группу заявок → тревога с самой заявкой уходит через бота
 * заявок в личные чаты ответственных. Партнёрский бот не участвует (владелец,
 * 19.11.2026).
 */
describe("alertDeliveryFailure", () => {
  const sent: Array<{ url: string; chat: unknown; text: string }> = [];
  beforeEach(() => {
    sent.length = 0;
    vi.resetModules();
    vi.stubEnv("TELEGRAM_STAFF_BOT_TOKEN", "staff-token");
    vi.stubEnv("TELEGRAM_PARTNERS_BOT_TOKEN", "partners-token");
    vi.stubEnv("TELEGRAM_PARTNERS_CHAT_ID", "-100777");
    vi.stubEnv("TELEGRAM_ALERT_CHAT_IDS", "111, 222");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        sent.push({ url, chat: body.chat_id, text: body.text });
        return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }));
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("шлёт заявку целиком ботом заявок в личные чаты, с причиной", async () => {
    const { alertDeliveryFailure } = await import("@/lib/alerts");
    const ok = await alertDeliveryFailure("Заявка на проживание: Шале — Ilxom", "🏡 <b>Заявка</b>\nИмя: Ilxom\nТелефон: +998901234567");
    expect(ok).toBe(true);
    expect(sent.map((s) => String(s.chat)).sort()).toEqual(["111", "222"]);
    expect(sent.every((s) => s.url.includes("/botstaff-token/"))).toBe(true);
    expect(sent[0].text).toContain("НЕ дошла в группу заявок");
    expect(sent[0].text).toContain("Телефон: +998901234567");
  });

  it("партнёрский бот и его группа не используются никогда", async () => {
    const { alertDeliveryFailure } = await import("@/lib/alerts");
    await alertDeliveryFailure("форма", "заявка");
    expect(sent.some((s) => s.url.includes("partners-token") || String(s.chat) === "-100777")).toBe(false);
  });

  it("без личных чатов — ничего не шлёт, только пишет в журнал", async () => {
    vi.stubEnv("TELEGRAM_ALERT_CHAT_IDS", "");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { alert } = await import("@/lib/alerts");
    expect(await alert("тест")).toBe(false);
    expect(sent).toHaveLength(0);
    expect(errors.mock.calls.some((a) => String(a[0]).includes("TELEGRAM_ALERT_CHAT_IDS"))).toBe(true);
    errors.mockRestore();
  });
});
