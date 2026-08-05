import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cabinOccupancy, extraGuestPricing, stayRules } from "@/content/pricing";
import { legalPolicies } from "@/content/policies-legal";
import { rooms } from "@/content/rooms";
import { fields } from "@/lib/price-catalog";
import { money, venueCore, venueFacts } from "@/lib/venue-facts";

/**
 * The check-in hour has been changed three times: 15:00 → 14:00 (on the mistaken
 * reading that the public offer demanded it) → 15:00 again. It is stated in
 * about thirty places across three languages, the JSON-LD, the legal offer, the
 * Telegram bot and two AI briefings, which is why it drifted in the first
 * place — nothing tied those copies together.
 *
 * These tests are that tie. They are content assertions rather than logic
 * assertions on purpose: the bug being guarded against is not "the code is
 * wrong", it is "one of the thirty copies did not get updated".
 */

const SRC = join(process.cwd(), "src");

/** Every .ts/.tsx file under src/, excluding tests and generated output. */
function sourceFiles(dir = SRC): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      out.push(...sourceFiles(full));
      continue;
    }
    if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("stay rules — check-in hour", () => {
  it("is 15:00", () => {
    expect(stayRules.checkIn).toBe("15:00");
    expect(stayRules.checkOut).toBe("12:00");
  });

  it("is not contradicted anywhere in src/", () => {
    // A line only counts if it talks about arriving. "14:00" on its own is a
    // legitimate number — a kitchen hour, a cron expression — and this test has
    // no business failing on those.
    const arrival = /заезд|kirish|check-?in|checkinTime/i;
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (!arrival.test(line)) return;
          if (!/\b14:00\b|\b2:00\s?PM\b/i.test(line)) return;
          offenders.push(`${file.slice(SRC.length + 1)}:${i + 1}`);
        });
    }

    expect(offenders).toEqual([]);
  });

  it("is what the room pages promise, in all three languages", () => {
    for (const room of rooms.filter((r) => r.slug !== "pool")) {
      for (const locale of ["ru", "uz", "en"] as const) {
        const features = room.features[locale].join(" ");
        expect(features, `${room.slug}/${locale}`).toContain(stayRules.checkIn);
      }
    }
  });

  it("is what the public offer says", () => {
    const offer = legalPolicies.find((p) => p.slug === "public-offer");
    expect(offer).toBeDefined();
    const body = JSON.stringify(offer);
    expect(body).toContain(`заезд осуществляется с ${stayRules.checkIn}`);
    // Early check-in and late check-out are PAID — the operator's rule of
    // 2026-08-05, and the clause a guest will be shown if they dispute a charge.
    expect(body).toContain("Ранний заезд и поздний выезд предоставляются на платной основе");
  });
});

describe("stay rules — the extra-person charge", () => {
  it("has coherent age bands", () => {
    const { childFrom, childTo, freeThroughAge, adult, child } = extraGuestPricing;
    // No gap and no overlap between "free" and "child": a four-year-old must
    // fall in exactly one band.
    expect(freeThroughAge + 1).toBe(childFrom);
    expect(childFrom).toBeLessThan(childTo);
    expect(child).toBeLessThan(adult);
  });

  it("is editable from the admin panel", () => {
    const keys = fields().map((f) => f.key);
    expect(keys).toContain("extraGuest.adult");
    expect(keys).toContain("extraGuest.child");
    expect(keys).toContain("extraGuest.guestVisitCottage");
    // The old shape charged by cabin type. It was live for hours and is gone;
    // if it ever reappears the two schemes will disagree about the same guest.
    expect(keys).not.toContain("extraGuest.glamping");
    expect(keys).not.toContain("extraGuest.cottage");
  });
});

describe("stay rules — occupancy", () => {
  it("matches the operator's figures", () => {
    // "Глемпинг стандарт - 2 человека. Максимум +1. Шале стандарт 4 человека.
    // Максимум +2." (operator, 2026-08-05)
    expect(cabinOccupancy.glamping).toEqual({ base: 2, max: 3 });
    expect(cabinOccupancy.cottage).toEqual({ base: 4, max: 6 });
  });

  it("keeps base below max, so an extra place is always possible", () => {
    for (const [slug, occ] of Object.entries(cabinOccupancy)) {
      expect(occ.base, slug).toBeLessThan(occ.max);
      expect(occ.base, slug).toBeGreaterThan(0);
    }
  });

  it("states BOTH numbers on the room cards, in all three languages", () => {
    // The capacity chip used to carry only the maximum, which is the number a
    // guest plans around and the wrong one: the rate covers the base.
    for (const slug of ["glamping", "cottage"] as const) {
      const room = rooms.find((r) => r.slug === slug);
      expect(room, slug).toBeDefined();
      const occ = cabinOccupancy[slug];
      for (const locale of ["ru", "uz", "en"] as const) {
        const chip = room!.capacity[locale];
        expect(chip, `${slug}/${locale}`).toContain(String(occ.base));
        expect(chip, `${slug}/${locale}`).toContain(String(occ.max));
      }
    }
  });
});

describe("refund rules — Роман's answers of 2026-08-05", () => {
  const refund = legalPolicies.find((p) => p.slug === "payment-refund");
  const offer = legalPolicies.find((p) => p.slug === "public-offer");
  const refundText = JSON.stringify(refund);
  const offerText = JSON.stringify(offer);

  it("charges 100% up front, not 50%", () => {
    expect(offerText).toContain("Предоплата вносится в размере 100 % стоимости");
    // The old ladder must be gone from both documents, or a guest can point at
    // whichever clause suits them.
    expect(offerText).not.toContain("50 % стоимости");
    expect(refundText).not.toContain("удерживается 50 %");
  });

  it("makes day-use non-refundable AND non-transferable", () => {
    expect(refundText).toContain("невозвратной и непереносимой");
    // The operator named the three ways a guest loses the money by their own
    // doing; all three have to be written down or the rule is unenforceable.
    expect(refundText).toMatch(/Неиспользование забронированной услуги/);
    expect(refundText).toMatch(/опоздание Заказчика/);
    expect(refundText).toMatch(/прекращение получения услуги по инициативе Заказчика/);
    // ...and the old full-refund-at-24h promise must not survive anywhere.
    expect(refundText).not.toContain("не позднее чем за 24 часа до даты визита");
    expect(offerText).not.toContain("не позднее чем за 24 часа до визита предоплата возвращается");
  });

  it("keeps force majeure and the resort's own fault refundable", () => {
    // The rule is about the guest's fault. A venue that keeps the money when IT
    // cancels is a different proposition, and not a lawful one.
    expect(refundText).toContain("обстоятельствам непреодолимой силы");
    expect(refundText).toContain("возврат денежных средств в полном объёме");
    expect(refundText).toMatch(/Если услуга не оказана по вине Исполнителя/);
    // §2 has to point at those exceptions, otherwise it reads as absolute.
    expect(refundText).toContain("Исключения из пунктов 2.1–2.3");
  });

  it("makes the date transfer conditional, not a right", () => {
    expect(refundText).toContain("не является безусловным правом Заказчика");
    expect(refundText).toContain("по согласованию с Исполнителем");
    expect(refundText).toMatch(/приходятся на выходные и праздничные дни/);
    expect(offerText).toMatch(/не распространяется на выходные и праздничные дни/);
  });
});

describe("stay rules — what the AI is briefed on", () => {
  // The concierge answers from these two strings and nothing else, so a fact
  // that is missing here is a fact the AI will either omit or invent.
  const briefings = { venueFacts: venueFacts(), venueCore: venueCore() };

  for (const [name, text] of Object.entries(briefings)) {
    it(`${name}() carries the hours, the levy and the passport rule`, () => {
      expect(text).toContain(`Заезд с ${stayRules.checkIn}`);
      expect(text).toMatch(/туристский сбор/i);
      expect(text).toMatch(/паспорт/i);
      // The two briefings word it differently — "ранний заезд" in the compact
      // one, "раннее заселение" in the full one — but both must say PAID.
      expect(text).toMatch(/(ранний заезд|раннее заселение) и поздний выезд платные/i);
    });

    it(`${name}() carries the extra-person figures`, () => {
      // money() is the briefing own formatter. Grouping the number any other
      // way here would pass a search that the rendered briefing fails.
      expect(text).toContain(money(extraGuestPricing.adult));
      expect(text).toContain(money(extraGuestPricing.child));
    });
  }

  it("venueFacts() explains the guest visit as its own product", () => {
    expect(venueFacts()).toMatch(/ГОСТЕВОЙ ВИЗИТ В ШАЛЕ/);
  });

  for (const [name, text] of Object.entries(briefings)) {
    it(`${name}() states base occupancy, not just the maximum`, () => {
      // Asked about four adults and a six-year-old in a chalet on 2026-08-05,
      // the concierge answered "5 человек — дополнительная плата не требуется".
      // It was reasoning from the only number it had, which was the maximum.
      for (const occ of Object.values(cabinOccupancy)) {
        expect(text).toContain(String(occ.base));
        expect(text).toContain(String(occ.max));
      }
      expect(text).toMatch(/стандарт/i);
      expect(text).toMatch(/максимум/i);
    });

    it(`${name}() carries the refund rules the AI must not soften`, () => {
      expect(text).toMatch(/Предоплата 100% стоимости/);
      expect(text).toMatch(/НЕВОЗВРАТНАЯ/);
      // Both the conditionality of a transfer and the day-use rule, because the
      // concierge has already been caught inventing friendlier terms than these.
      expect(text).toMatch(/(не автоматическое право|НЕ автоматическое право|только по согласованию)/i);
      expect(text).toMatch(/(выходные и праздничные|праздничные и выходные)/i);
      expect(text).toMatch(/НЕПЕРЕНОСИМ/i);
    });

    it(`${name}() spells out how to count the surcharge`, () => {
      expect(text).toMatch(/КАК СЧИТАТЬ ДОПЛАТУ/);
      expect(text).toMatch(/СВЕРХ СТАНДАРТА, а не сверх максимума/);
      // The worked example is the case that went wrong in production.
      expect(text).toMatch(/4 взрослых и ребёнок 6 лет в шале/);
    });
  }
});
