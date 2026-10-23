import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookingTermsNotice } from "../BookingTermsNotice";
import { bookingTermsCopy } from "@/content/booking-terms";
import { faqItems } from "@/content/faq";
import { accommodationCancellation, stayRules } from "@/content/pricing";
import { poolClosure } from "@/content/pool-closure";
import { topchanClosure } from "@/content/topchan-closure";
import { venueCore, venueFacts } from "@/lib/venue-facts";
import { venueTopic } from "@/lib/venue-topics";
import { buildSystemPrompt } from "@/lib/ai-context";

const LOCALES = ["ru", "uz", "en"] as const;

/**
 * Блок «Важно перед бронированием» — то, что гость читает перед оплатой.
 *
 * 23.10.2026 в нём не было ни часа на оплату, ни правил отмены, а ИИ на
 * «правила возврата» отвечал своим списком. Тесты держат три места вместе:
 * блок, сводку консьержа и FAQ.
 */
describe("блок условий брони", () => {
  for (const locale of LOCALES) {
    it(`${locale}: называет час на оплату и лестницу отмены из констант`, () => {
      const all = [...bookingTermsCopy[locale].lines, ...bookingTermsCopy[locale].refundLines].join(" ");
      expect(all).toContain(stayRules.prepayWithin[locale]);
      expect(all).toContain(String(accommodationCancellation.fullRefundDays));
      expect(all).toContain(String(accommodationCancellation.halfRefundHours));
      expect(all).toContain(String(accommodationCancellation.halfRefundShare * 100));
      expect(all).toContain(stayRules.checkIn);
    });

    it(`${locale}: на странице бронирования показывает правила отмены, а не только ссылку`, () => {
      const { container } = render(<BookingTermsNotice locale={locale} variant="booking" />);
      const text = container.textContent ?? "";
      expect(text).toContain(bookingTermsCopy[locale].refundTitle);
      for (const line of bookingTermsCopy[locale].refundLines) expect(text).toContain(line);
      expect(container.querySelector(`a[href="/${locale}/legal/payment-refund"]`)).not.toBeNull();
    });
  }

  it("на странице бронирования не говорит про «заявку»: там оформляют бронь", () => {
    const { container } = render(<BookingTermsNotice locale="ru" variant="booking" />);
    expect(container.textContent).not.toMatch(/заявк/i);
  });

  it("под формой заявки по-прежнему говорит, что заявка — не бронь", () => {
    const { container } = render(<BookingTermsNotice locale="ru" />);
    expect(container.textContent).toContain(bookingTermsCopy.ru.first);
    expect(container.textContent).toContain(bookingTermsCopy.ru.refundTitle);
  });
});

describe("ИИ говорит то же, что блок", () => {
  const ru = bookingTermsCopy.ru;
  const lines = [ru.firstBooking, ru.contactBooking, ...ru.lines, ...ru.refundLines];

  for (const [name, text] of Object.entries({ venueCore: venueCore(), venueFacts: venueFacts() })) {
    it(`${name}() содержит каждую строку блока дословно`, () => {
      for (const line of lines) expect(text, line).toContain(line);
    });

    it(`${name}() не перечисляет закрытые услуги в правилах возврата`, () => {
      const dayRule = text.split("\n").find((l) => /ДНЕВНЫЕ УСЛУГИ \(сейчас продаётся/.test(l)) ?? "";
      expect(dayRule).not.toBe("");
      const listed = dayRule.match(/\(сейчас продаётся: ([^)]*)\)/)?.[1] ?? "";
      if (poolClosure.closed) expect(listed).not.toMatch(/бассейн/);
      if (topchanClosure.closed) expect(listed).not.toMatch(/топчан/);
      expect(listed).toMatch(/тюбинг/);
    });
  }

  it("консьерж получает ссылку на правила отмены и возврата — с подписью на языке гостя", () => {
    for (const locale of LOCALES) {
      expect(buildSystemPrompt(locale)).toContain(`[${bookingTermsCopy[locale].refund}](/${locale}/legal/payment-refund)`);
    }
  });

  it("правила ответа не группируют закрытые услуги с работающими", () => {
    // Из «Цены ДНЕВНОГО отдыха (топчан, тюбинг, бассейн…)» модель собирала
    // «дневные услуги (тюбинг, топчан, бассейн)» в ответе про возврат.
    const prompt = buildSystemPrompt("ru");
    if (poolClosure.closed && topchanClosure.closed) {
      expect(prompt).not.toMatch(/\((топчан|бассейн), (тюбинг|топчан|бассейн)/);
    }
  });

  it("lookup_facts('policy') находит раздел отмены по его настоящему заголовку", () => {
    const policy = venueTopic("policy");
    expect(policy).toContain("ОТМЕНА — ПРОЖИВАНИЕ");
    expect(policy).toContain("ПЕРЕНОС ДАТ");
    expect(policy).toContain("ОТМЕНА — ДНЕВНЫЕ");
  });
});

describe("FAQ не называет предоплату за проживание невозвратной", () => {
  for (const locale of LOCALES) {
    it(locale, () => {
      const all = faqItems().map((i) => i.answer[locale]).join("\n");
      expect(all).not.toMatch(/Предоплата невозвратная|Oldindan to'lov qaytarilmaydi\.|prepayment is non-refundable/);
      for (const line of bookingTermsCopy[locale].refundLines.slice(0, 3)) expect(all).toContain(line);
    });
  }
});
