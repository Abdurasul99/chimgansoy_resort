import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Заявка не дошла в группу заявок → тревога с самой заявкой уходит через
 * партнёрского бота (другой токен и чат) — 11–19.11.2026 о сбое неделю никто
 * не знал.
 */
describe("alertDeliveryFailure", () => {
  const sent: Array<{ url: string; chat: unknown; text: string }> = [];
  beforeEach(() => {
    sent.length = 0;
    vi.resetModules();
    vi.stubEnv("TELEGRAM_PARTNERS_BOT_TOKEN", "partners-token");
    vi.stubEnv("TELEGRAM_PARTNERS_CHAT_ID", "-100777");
    vi.stubEnv("TELEGRAM_STAFF_BOT_TOKEN", "staff-token");
    vi.stubEnv("TELEGRAM_ALERT_CHAT_IDS", "");
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

  it("шлёт заявку целиком через партнёрского бота, с причиной", async () => {
    const { alertDeliveryFailure } = await import("@/lib/alerts");
    const ok = await alertDeliveryFailure("Заявка на проживание: Шале — Ilxom", "🏡 <b>Заявка</b>\nИмя: Ilxom\nТелефон: +998901234567");
    expect(ok).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toContain("/botpartners-token/sendMessage");
    expect(sent[0].chat).toBe("-100777");
    expect(sent[0].text).toContain("НЕ дошла в группу заявок");
    expect(sent[0].text).toContain("Телефон: +998901234567");
  });

  it("личные чаты из TELEGRAM_ALERT_CHAT_IDS — через основного бота", async () => {
    vi.stubEnv("TELEGRAM_ALERT_CHAT_IDS", "111, 222");
    const { alert } = await import("@/lib/alerts");
    await alert("тест");
    expect(sent.filter((s) => s.url.includes("/botstaff-token/")).map((s) => String(s.chat)).sort()).toEqual(["111", "222"]);
  });
});
