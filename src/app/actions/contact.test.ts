/**
 * Tests for the submitContact server action.
 * Covers: validation, Telegram dispatch, email routing (booking vs inquiry inbox),
 * HTML escaping, and graceful degradation when env vars are missing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../tests/setup";
import { submitContact } from "./contact";

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("submitContact server action", () => {
  // Capture spies of the env-gated POSTs so we can assert routing/payload.
  let telegramCalls: Array<{ url: string; body: unknown }> = [];
  let resendCalls: Array<{ url: string; body: unknown }> = [];

  beforeEach(() => {
    telegramCalls = [];
    resendCalls = [];
    // Set up env so both side-effects fire
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-bot-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("BOOKING_EMAIL_FROM", "test@chimgandarbaza.uz");
    vi.stubEnv("RESERVATIONS_EMAIL_TO", "reservations@chimgandarbaza.uz");
    vi.stubEnv("INFO_EMAIL_TO", "info@chimgandarbaza.uz");

    server.use(
      http.post("https://api.telegram.org/*", async ({ request }) => {
        telegramCalls.push({ url: request.url, body: await request.json() });
        return HttpResponse.json({ ok: true });
      }),
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
      // Arrange
      const fd = makeFormData({ name: "", phone: "+998 90 123 45 67" });
      // Act
      const result = await submitContact(fd);
      // Assert
      expect(result).toEqual({ ok: false, error: "Укажите имя" });
      expect(telegramCalls).toHaveLength(0);
      expect(resendCalls).toHaveLength(0);
    });

    it("rejects empty phone", async () => {
      const fd = makeFormData({ name: "Алексей", phone: "" });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: false, error: "Укажите номер телефона" });
    });

    it("trims whitespace from name and phone before validation", async () => {
      const fd = makeFormData({ name: "   ", phone: "+998..." });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: false, error: "Укажите имя" });
    });
  });

  describe("happy path — booking form", () => {
    it("returns ok and dispatches both Telegram + email", async () => {
      // Arrange
      const fd = makeFormData({
        name: "Алина",
        phone: "+998 90 123 45 67",
        formType: "booking",
        message: "Хотим домик на двоих",
      });

      // Act
      const result = await submitContact(fd);

      // Assert
      expect(result).toEqual({ ok: true });
      expect(telegramCalls).toHaveLength(1);
      expect(resendCalls).toHaveLength(1);
    });

    it("routes booking emails to RESERVATIONS_EMAIL_TO", async () => {
      const fd = makeFormData({
        name: "Алина",
        phone: "+998 90 123 45 67",
        formType: "booking",
      });
      await submitContact(fd);

      const emailBody = resendCalls[0].body as { to: string[] };
      expect(emailBody.to).toEqual(["reservations@chimgandarbaza.uz"]);
    });

    it("uses bookings telegram header for booking form", async () => {
      const fd = makeFormData({
        name: "Алина",
        phone: "+998 90 123 45 67",
        formType: "booking",
      });
      await submitContact(fd);

      const tgBody = telegramCalls[0].body as { text: string };
      expect(tgBody.text).toContain("Новая бронь");
    });
  });

  describe("inquiry form routing", () => {
    it("routes inquiry emails to INFO_EMAIL_TO", async () => {
      const fd = makeFormData({
        name: "Бобур",
        phone: "+998",
        formType: "inquiry",
      });
      await submitContact(fd);

      const emailBody = resendCalls[0].body as { to: string[] };
      expect(emailBody.to).toEqual(["info@chimgandarbaza.uz"]);
    });

    it("uses inquiry telegram header", async () => {
      const fd = makeFormData({
        name: "Бобур",
        phone: "+998",
        formType: "inquiry",
      });
      await submitContact(fd);

      const tgBody = telegramCalls[0].body as { text: string };
      expect(tgBody.text).toContain("Новый вопрос");
    });

    it("defaults to booking when formType is missing/invalid", async () => {
      const fd = makeFormData({ name: "X", phone: "Y" }); // no formType
      await submitContact(fd);

      const emailBody = resendCalls[0].body as { to: string[] };
      expect(emailBody.to).toEqual(["reservations@chimgandarbaza.uz"]);
    });
  });

  describe("HTML escaping in email body", () => {
    it("escapes <script> tags from user input", async () => {
      const fd = makeFormData({
        name: "<script>alert(1)</script>",
        phone: "+998",
        formType: "booking",
      });
      await submitContact(fd);

      const emailBody = resendCalls[0].body as { html: string };
      expect(emailBody.html).not.toContain("<script>alert(1)</script>");
      expect(emailBody.html).toContain("&lt;script&gt;");
    });

    it("escapes quotes to prevent attribute injection", async () => {
      const fd = makeFormData({
        name: `Test"onmouseover=alert(1)`,
        phone: "+998",
      });
      await submitContact(fd);
      const emailBody = resendCalls[0].body as { html: string };
      expect(emailBody.html).toContain("&quot;");
    });
  });

  describe("graceful degradation when env is missing", () => {
    it("still returns ok=true when TELEGRAM_BOT_TOKEN is missing", async () => {
      vi.unstubAllEnvs();
      vi.stubEnv("RESEND_API_KEY", "re_test");
      vi.stubEnv("BOOKING_EMAIL_FROM", "from@x.uz");
      vi.stubEnv("RESERVATIONS_EMAIL_TO", "to@x.uz");

      const fd = makeFormData({ name: "X", phone: "Y" });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: true });
      expect(telegramCalls).toHaveLength(0); // skipped silently
      expect(resendCalls).toHaveLength(1);
    });

    it("still returns ok=true when RESEND_API_KEY is missing", async () => {
      vi.unstubAllEnvs();
      vi.stubEnv("TELEGRAM_BOT_TOKEN", "t");
      vi.stubEnv("TELEGRAM_CHAT_ID", "c");

      const fd = makeFormData({ name: "X", phone: "Y" });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: true });
      expect(telegramCalls).toHaveLength(1);
      expect(resendCalls).toHaveLength(0); // skipped silently
    });

    it("doesn't crash if Telegram API itself errors", async () => {
      server.use(
        http.post("https://api.telegram.org/*", () =>
          HttpResponse.error(),
        ),
      );
      const fd = makeFormData({ name: "X", phone: "Y" });
      const result = await submitContact(fd);
      expect(result).toEqual({ ok: true }); // form still ok
    });
  });

  describe("concurrent submissions", () => {
    it("handles 100 simultaneous submissions without state leaks", async () => {
      // Arrange — fire 100 submissions in parallel; each must succeed independently.
      const promises = Array.from({ length: 100 }, (_, i) =>
        submitContact(
          makeFormData({
            name: `Guest ${i}`,
            phone: `+998 90 000 ${String(i).padStart(2, "0")} ${String(i).padStart(2, "0")}`,
            formType: i % 2 === 0 ? "booking" : "inquiry",
          }),
        ),
      );

      // Act
      const results = await Promise.all(promises);

      // Assert — all succeed
      expect(results).toHaveLength(100);
      expect(results.every((r) => r.ok === true)).toBe(true);

      // Both dispatches fired 100 times
      expect(telegramCalls).toHaveLength(100);
      expect(resendCalls).toHaveLength(100);

      // Email routing was correctly split between the two inboxes
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
