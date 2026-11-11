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

  it("неизвестная программа не попадает в письмо как есть", async () => {
    await submitPartnerRequest(form({ ...VALID, program: "<script>" }));
    expect(mails[0].html).not.toContain("<script>");
    expect(mails[0].html).toContain("Своя идея");
  });

  it("ловушка для ботов: успех без отправки", async () => {
    expect(await submitPartnerRequest(form({ ...VALID, company: "spam" }))).toEqual({ ok: true });
    expect(mails).toHaveLength(0);
  });

  it("если не дошло никуда — ошибка с телефоном, а не ложный успех", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const r = await submitPartnerRequest(form({ ...VALID, locale: "uz" }));
    expect(r).toMatchObject({ ok: false });
    expect((r as { error: string }).error).toContain("+998 70 176 00 11");
  });
});
