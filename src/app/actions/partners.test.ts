/**
 * Заявка «🤝 Партнёрство»: проверка полей, ловушка для ботов, доставка на
 * info@ и честная ошибка, когда заявка никуда не дошла.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../tests/setup";
import { submitPartnerRequest } from "./partners";

function form(fields: Record<string, string>, consent = true): FormData {
  const fd = new FormData();
  if (consent) fd.set("privacyConsent", "on");
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID = { org: "Uzum", name: "Алишер", phone: "+998 90 123 45 67", program: "payments", locale: "ru" };

describe("submitPartnerRequest", () => {
  let mails: Array<{ to: string[]; subject: string; html: string }> = [];

  beforeEach(() => {
    mails = [];
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("BOOKING_EMAIL_FROM", "test@chimgandarbaza.uz");
    vi.stubEnv("INFO_EMAIL_TO", "info@chimgandarbaza.uz");
    server.use(
      http.post("https://api.resend.com/emails", async ({ request }) => {
        mails.push((await request.json()) as (typeof mails)[number]);
        return HttpResponse.json({ id: "ok" });
      }),
    );
  });

  afterEach(() => vi.unstubAllEnvs());

  it("без компании, имени или контакта — понятная ошибка, письма нет", async () => {
    expect(await submitPartnerRequest(form({ ...VALID, org: "" }))).toEqual({ ok: false, error: "Укажите компанию" });
    expect(await submitPartnerRequest(form({ ...VALID, name: "" }))).toEqual({ ok: false, error: "Укажите имя" });
    expect(await submitPartnerRequest(form({ ...VALID, phone: "" }))).toMatchObject({ ok: false });
    expect(mails).toHaveLength(0);
  });

  it("без согласия на обработку данных — не принимается", async () => {
    const r = await submitPartnerRequest(form(VALID, false));
    expect(r).toMatchObject({ ok: false });
    expect(mails).toHaveLength(0);
  });

  it("почта вместо телефона — годится, но кривой адрес нет", async () => {
    expect(await submitPartnerRequest(form({ ...VALID, phone: "", email: "a@uzum.uz" }))).toEqual({ ok: true });
    expect(await submitPartnerRequest(form({ ...VALID, phone: "", email: "не-почта" }))).toMatchObject({ ok: false });
  });

  it("уходит на info@ с компанией и программой, текст экранирован", async () => {
    const r = await submitPartnerRequest(form({ ...VALID, message: "<b>500 касс</b>" }));
    expect(r).toEqual({ ok: true });
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toEqual(["info@chimgandarbaza.uz"]);
    expect(mails[0].subject).toBe("Партнёрство: Uzum");
    expect(mails[0].html).toContain("Покупки и оплата");
    expect(mails[0].html).toContain("&lt;b&gt;500 касс&lt;/b&gt;");
  });

  it("сводка расчёта с рабочей панели доходит до письма, экранированной и обрезанной", async () => {
    const calc = "Отрасль: Банк; Пакет: Титульный; ROMI: −55 %; <img src=x>";
    expect(await submitPartnerRequest(form({ ...VALID, program: "", calc }))).toEqual({ ok: true });
    expect(mails[0].html).toContain("Расчёт");
    expect(mails[0].html).toContain("ROMI: −55 %");
    expect(mails[0].html).not.toContain("<img");
    await submitPartnerRequest(form({ ...VALID, calc: "x".repeat(5000) }));
    expect(mails[1].html).not.toContain("x".repeat(601));
  });

  it("неизвестная программа не попадает в письмо как есть", async () => {
    await submitPartnerRequest(form({ ...VALID, program: "<script>" }));
    expect(mails[0].html).not.toContain("<script>");
    expect(mails[0].html).toContain("Своя идея");
  });

  it("ловушка для ботов: успех без отправки", async () => {
    expect(await submitPartnerRequest(form({ ...VALID, company: "spam" }))).toEqual({ ok: true });
    expect(mails).toHaveLength(0);
  });

  describe("Telegram: свой бот партнёров", () => {
    let calls: Array<{ bot: string; chat: string }> = [];
    beforeEach(() => {
      calls = [];
      vi.stubEnv("TELEGRAM_STAFF_BOT_TOKEN", "staff-token");
      vi.stubEnv("TELEGRAM_ADMIN_CHAT_ID", "-100staff");
      server.use(
        http.post("https://api.telegram.org/:bot/sendMessage", async ({ request, params }) => {
          const body = (await request.json()) as { chat_id: string };
          const bot = String(params.bot);
          calls.push({ bot, chat: String(body.chat_id) });
          // «Сломанный» чат партнёров — Telegram отвечает ошибкой.
          if (body.chat_id === "-100broken") return HttpResponse.json({ ok: false, description: "chat not found" });
          return HttpResponse.json({ ok: true, result: {} });
        }),
      );
    });

    it("настроен — заявка уходит в чаты партнёрского бота, не в общую группу", async () => {
      vi.stubEnv("TELEGRAM_PARTNERS_BOT_TOKEN", "partners-token");
      vi.stubEnv("TELEGRAM_PARTNERS_CHAT_ID", "111, -100partners");
      expect(await submitPartnerRequest(form(VALID))).toEqual({ ok: true });
      expect(calls).toEqual(
        expect.arrayContaining([
          { bot: "botpartners-token", chat: "111" },
          { bot: "botpartners-token", chat: "-100partners" },
        ]),
      );
      expect(calls.some((c) => c.bot === "botstaff-token")).toBe(false);
    });

    it("нет чата партнёров — общая группа, как раньше", async () => {
      vi.stubEnv("TELEGRAM_PARTNERS_BOT_TOKEN", "partners-token");
      vi.stubEnv("TELEGRAM_PARTNERS_CHAT_ID", "");
      await submitPartnerRequest(form(VALID));
      expect(calls).toEqual([{ bot: "botstaff-token", chat: "-100staff" }]);
    });

    it("бот партнёров не доставил никуда — заявка не теряется, уходит в общую группу", async () => {
      vi.stubEnv("TELEGRAM_PARTNERS_BOT_TOKEN", "partners-token");
      vi.stubEnv("TELEGRAM_PARTNERS_CHAT_ID", "-100broken");
      vi.stubEnv("RESEND_API_KEY", "");
      expect(await submitPartnerRequest(form(VALID))).toEqual({ ok: true });
      expect(calls).toContainEqual({ bot: "botstaff-token", chat: "-100staff" });
    });
  });

  it("если не дошло никуда — ошибка с телефоном, а не ложный успех", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const r = await submitPartnerRequest(form({ ...VALID, locale: "uz" }));
    expect(r).toMatchObject({ ok: false });
    expect((r as { error: string }).error).toContain("+998 70 176 00 11");
  });
});
