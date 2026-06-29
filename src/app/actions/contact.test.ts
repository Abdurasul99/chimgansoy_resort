/**
 * Tests for the submitContact server action.
 * Covers: validation (name/phone/dates), honeypot spam drop, email routing
 * (booking vs inquiry inbox), HTML escaping, and — critically — that the action
 * reports failure when the lead could not be delivered.
 *
 * Note: the Telegram-bot channel was intentionally removed — leads are now
 * delivered by email only (bookings themselves go through the Exely PMS).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../tests/setup";
import { submitContact } from "./contact";

const VALID_PHONE = "+998 90 123 45 67";

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("submitContact server action", () => {
  // Capture the email POSTs so we can assert routing/payload.
  let resendCalls: Array<{ url: string; body: unknown }> = [];

  beforeEach(() => {
    resendCalls = [];
    // Configure email delivery so the side-effect fires.
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("BOOKING_EMAIL_FROM", "test@chimgandarbaza.uz");
    vi.stubEnv("RESERVATIONS_EMAIL_TO", "reservations@chimgandarbaza.uz");
    vi.stubEnv("INFO_EMAIL_TO", "info@chimgandarbaza.uz");

    server.use(
      http.post("https://api.resend.com/emails", async ({ request }) => {
        resendCalls.push({ url: request.url, body: await request.json() });
        return HttpResponse.json({ id: "ok" });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("input validation", () => {
    it("rejects empty name", async () => {
      const fd = makeFormData({ name: "", phone: VALID_PHONE });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: false, error: "Укажите имя" });
      expect(resendCalls).toHaveLength(0);
    });

    it("rejects empty phone", async () => {
      const fd = makeFormData({ name: "Алексей", phone: "" });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: false, error: "Укажите номер телефона" });
    });

    it("rejects a too-short phone number", async () => {
      const fd = makeFormData({ name: "Алексей", phone: "+998" });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: false, error: "Проверьте номер телефона" });
      expect(resendCalls).toHaveLength(0);
    });

    it("rejects check-out on or before check-in", async () => {
      const fd = makeFormData({
        name: "Алина",
        phone: VALID_PHONE,
        checkin: "2026-07-10",
        checkout: "2026-07-10",
      });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: false, error: "Дата выезда должна быть позже даты заезда" });
    });

    it("trims whitespace from name before validation", async () => {
      const fd = makeFormData({ name: "   ", phone: VALID_PHONE });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: false, error: "Укажите имя" });
    });

    it("returns localized errors when locale=en", async () => {
      const fd = makeFormData({ name: "", phone: VALID_PHONE, locale: "en" });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: false, error: "Please enter your name" });
    });
  });

  describe("spam protection", () => {
    it("silently drops submissions where the honeypot is filled", async () => {
      const fd = makeFormData({
        name: "Bot",
        phone: VALID_PHONE,
        company: "https://spam.example",
      });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: true }); // pretend success, don't tip off the bot
      expect(resendCalls).toHaveLength(0);
    });
  });

  describe("happy path — booking form", () => {
    it("returns ok and dispatches the email", async () => {
      const fd = makeFormData({
        name: "Алина",
        phone: VALID_PHONE,
        formType: "booking",
        message: "Хотим домик на двоих",
      });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: true });
      expect(resendCalls).toHaveLength(1);
    });

    it("routes booking emails to RESERVATIONS_EMAIL_TO", async () => {
      const fd = makeFormData({ name: "Алина", phone: VALID_PHONE, formType: "booking" });
      await submitContact(fd);
      const emailBody = resendCalls[0].body as { to: string[] };
      expect(emailBody.to).toEqual(["reservations@chimgandarbaza.uz"]);
    });

    it("uses the booking subject for booking form", async () => {
      const fd = makeFormData({ name: "Алина", phone: VALID_PHONE, formType: "booking" });
      await submitContact(fd);
      const emailBody = resendCalls[0].body as { subject: string };
      expect(emailBody.subject).toContain("Бронь");
    });
  });

  describe("inquiry form routing", () => {
    it("routes inquiry emails to INFO_EMAIL_TO", async () => {
      const fd = makeFormData({ name: "Бобур", phone: VALID_PHONE, formType: "inquiry" });
      await submitContact(fd);
      const emailBody = resendCalls[0].body as { to: string[] };
      expect(emailBody.to).toEqual(["info@chimgandarbaza.uz"]);
    });

    it("uses the inquiry subject", async () => {
      const fd = makeFormData({ name: "Бобур", phone: VALID_PHONE, formType: "inquiry" });
      await submitContact(fd);
      const emailBody = resendCalls[0].body as { subject: string };
      expect(emailBody.subject).toContain("Вопрос");
    });

    it("defaults to booking when formType is missing/invalid", async () => {
      const fd = makeFormData({ name: "Тест", phone: VALID_PHONE }); // no formType
      await submitContact(fd);
      const emailBody = resendCalls[0].body as { to: string[] };
      expect(emailBody.to).toEqual(["reservations@chimgandarbaza.uz"]);
    });
  });

  describe("HTML escaping in email body", () => {
    it("escapes <script> tags from user input", async () => {
      const fd = makeFormData({
        name: "<script>alert(1)</script>",
        phone: VALID_PHONE,
        formType: "booking",
      });
      await submitContact(fd);
      const emailBody = resendCalls[0].body as { html: string };
      expect(emailBody.html).not.toContain("<script>alert(1)</script>");
      expect(emailBody.html).toContain("&lt;script&gt;");
    });

    it("escapes quotes to prevent attribute injection", async () => {
      const fd = makeFormData({ name: `Test"onmouseover=alert(1)`, phone: VALID_PHONE });
      await submitContact(fd);
      const emailBody = resendCalls[0].body as { html: string };
      expect(emailBody.html).toContain("&quot;");
    });
  });

  describe("delivery reliability", () => {
    it("returns ok when email is configured and succeeds", async () => {
      const fd = makeFormData({ name: "X", phone: VALID_PHONE });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: true });
      expect(resendCalls).toHaveLength(1);
    });

    it("returns ok:false when email is not configured", async () => {
      vi.unstubAllEnvs();
      const fd = makeFormData({ name: "X", phone: VALID_PHONE });
      const result = await submitContact(fd);
      expect(result.ok).toBe(false);
    });

    it("returns ok:false when the email provider fails", async () => {
      server.use(
        http.post("https://api.resend.com/emails", () => new HttpResponse(null, { status: 500 })),
      );
      const fd = makeFormData({ name: "X", phone: VALID_PHONE });
      const result = await submitContact(fd);
      expect(result.ok).toBe(false);
    });
  });

  describe("concurrent submissions", () => {
    it("handles 100 simultaneous submissions without state leaks", async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        submitContact(
          makeFormData({
            name: `Guest ${i}`,
            phone: `+998 90 000 ${String(i).padStart(2, "0")} ${String(i).padStart(2, "0")}`,
            formType: i % 2 === 0 ? "booking" : "inquiry",
          }),
        ),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      expect(results.every((r) => r.ok === true)).toBe(true);
      expect(resendCalls).toHaveLength(100);

      const reservationsCount = resendCalls.filter((c) =>
        ((c.body as { to: string[] }).to ?? []).includes("reservations@chimgandarbaza.uz"),
      ).length;
      const infoCount = resendCalls.filter((c) =>
        ((c.body as { to: string[] }).to ?? []).includes("info@chimgandarbaza.uz"),
      ).length;
      expect(reservationsCount).toBe(50);
      expect(infoCount).toBe(50);
    });
  });
});
