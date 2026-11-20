import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Заявка не дошла в группу заявок → тревога с самой заявкой уходит ПИСЬМОМ на
 * ALERT_EMAIL_TO. В Telegram тревоги не идут никогда (владелец, 20.11.2026).
 * Пока Resend не пускает на чужие адреса (домен не подтверждён) — в ящик заявок.
 */
type Sent = { url: string; to?: string[]; subject?: string; html?: string; chat?: unknown };

describe("тревога о сбое заявки — только письмом", () => {
  const sent: Sent[] = [];
  let rejectDirect = false;
  let rejectAll = false;

  beforeEach(() => {
    sent.length = 0;
    rejectDirect = false;
    rejectAll = false;
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("BOOKING_EMAIL_FROM", "onboarding@resend.dev");
    vi.stubEnv("ALERT_EMAIL_TO", "owner@example.com");
    vi.stubEnv("RESERVATIONS_EMAIL_TO", "manager@example.com");
    // Всё телеграмное задано — и всё равно не должно использоваться.
    vi.stubEnv("TELEGRAM_STAFF_BOT_TOKEN", "staff-token");
    vi.stubEnv("TELEGRAM_ADMIN_CHAT_ID", "-100555");
    vi.stubEnv("TELEGRAM_ALERT_CHAT_IDS", "111, 222");
    vi.stubEnv("TELEGRAM_PARTNERS_BOT_TOKEN", "partners-token");
    vi.stubEnv("TELEGRAM_PARTNERS_CHAT_ID", "-100777");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        sent.push({ url, to: body.to, subject: body.subject, html: body.html, chat: body.chat_id });
        const isDirect = Array.isArray(body.to) && body.to.includes("owner@example.com");
        if (rejectAll || (rejectDirect && isDirect)) {
          return new Response(
            JSON.stringify({ statusCode: 403, message: "You can only send testing emails to your own email address" }),
            { status: 403 },
          );
        }
        return new Response(JSON.stringify({ id: "email-1" }));
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("шлёт заявку целиком письмом на ALERT_EMAIL_TO, с причиной и меткой в теме", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { alertDeliveryFailure } = await import("@/lib/alerts");
    const ok = await alertDeliveryFailure("Заявка на проживание: Шале — Ilxom", "🏡 <b>Заявка</b>\nИмя: Ilxom\nТелефон: +998901234567");
    expect(ok).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe("https://api.resend.com/emails");
    expect(sent[0].to).toEqual(["owner@example.com"]);
    expect(sent[0].subject).toMatch(/^\[Сбой заявок\] заявка не дошла в группу Telegram/);
    expect(sent[0].html).toContain("НЕ дошла в группу заявок");
    expect(sent[0].html).toContain("Телефон: +998901234567");
    // в журнал — без имени и телефона гостя
    const logged = errors.mock.calls.map((a) => String(a[0])).join("\n");
    expect(logged).toContain("письмо-тревога: ушло");
    expect(logged).not.toContain("Ilxom");
    expect(logged).not.toContain("998901234567");
    errors.mockRestore();
  });

  it("в Telegram не идёт ничего — ни ботом заявок, ни партнёрским", async () => {
    const { alertDeliveryFailure, alert } = await import("@/lib/alerts");
    await alertDeliveryFailure("форма", "заявка");
    rejectAll = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    await alert("тест", "всё упало");
    expect(sent.length).toBeGreaterThan(0);
    expect(sent.some((s) => s.url.includes("api.telegram.org"))).toBe(false);
  });

  it("Resend не пускает на ALERT_EMAIL_TO (домен не подтверждён) — то же письмо уходит в ящик заявок", async () => {
    rejectDirect = true;
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { alert } = await import("@/lib/alerts");
    expect(await alert("сайт не открывается", "🚨 <b>Сайт</b> лежит")).toBe(true);
    expect(sent.map((s) => s.to)).toEqual([["owner@example.com"], ["manager@example.com"]]);
    expect(sent[1].subject).toBe(sent[0].subject);
    expect(sent[1].subject).toMatch(/^\[Сбой заявок\] /);
    errors.mockRestore();
  });

  it("не дошло никуда — false и строка, по которой сторож пишет отдельно", async () => {
    rejectAll = true;
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { alertDeliveryFailure, UNDELIVERED_MARK } = await import("@/lib/alerts");
    expect(await alertDeliveryFailure("форма", "заявка")).toBe(false);
    expect(errors.mock.calls.some((a) => String(a[0]).includes(UNDELIVERED_MARK))).toBe(true);
    errors.mockRestore();
  });

  it("без ALERT_EMAIL_TO — ничего не шлёт, только пишет в журнал", async () => {
    vi.stubEnv("ALERT_EMAIL_TO", "");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { alert } = await import("@/lib/alerts");
    expect(await alert("тест", "тест")).toBe(false);
    expect(sent).toHaveLength(0);
    expect(errors.mock.calls.some((a) => String(a[0]).includes("ALERT_EMAIL_TO"))).toBe(true);
    errors.mockRestore();
  });

  it("сторож на сервере ищет в журнале ту же строку и ту же метку темы", async () => {
    const { ALERT_TAG, UNDELIVERED_MARK } = await import("@/lib/alerts");
    const monitor = readFileSync(join(process.cwd(), "scripts", "monitor", "chimgan-monitor.py"), "utf8");
    expect(monitor).toContain(UNDELIVERED_MARK);
    expect(monitor).toContain(`ALERT_TAG = "${ALERT_TAG}"`);
    expect(monitor).not.toContain("api.telegram.org");
  });
});
