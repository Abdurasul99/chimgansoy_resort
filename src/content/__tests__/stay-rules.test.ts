import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  accommodationCancellation,
  cabinOccupancy,
  dateTransfer,
  extraGuestPricing,
  stayRules,
  touristTax,
} from "@/content/pricing";
import { legalPolicies } from "@/content/policies-legal";
import { rooms } from "@/content/rooms";
import { fields } from "@/lib/price-catalog";
import { resolvePricing } from "@/lib/pricing-resolve";
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
  it("is 14:00, as the offer defines it in four separate clauses", () => {
    // Moved to 15:00 on 2026-08-05 from an informal "Прочее" list, and back on
    // 2026-08-06 when the signed offer arrived saying 14:00 in §1, §2.5, §4.2
    // and Правила пребывания §4.1 — and pricing early arrival against it in
    // §5.2.1. The document is what the guest accepts at booking.
    expect(stayRules.checkIn).toBe("14:00");
    expect(stayRules.checkOut).toBe("12:00");
  });

  it("is not contradicted anywhere in src/", () => {
    // A line only counts if it talks about arriving. "14:00" on its own is a
    // legitimate number — a kitchen hour, a cron expression — and this test has
    // no business failing on those.
    const arrival = /заезд|kirish|check-?in|checkinTime/i;
    const wrongHour = /\b15:00\b|\b3:00\s?PM\b/i;
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          // Comments are allowed to name the old hour — several of them explain
          // why it moved, and that history is the reason it stopped drifting.
          // Only text a guest could read counts.
          if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
          if (!arrival.test(line)) return;
          if (!wrongHour.test(line)) return;
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
    expect(body).toContain(`Расчётное время заезда – ${stayRules.checkIn}`);
    // Early arrival and a late departure are charged as a share of a night —
    // §5.2.1 and §5.2.2. The share matters: it is what a guest is billed.
    expect(body).toContain("плату за ранний заезд в размере 50 %");
    expect(body).toContain("Плата за поздний выезд (с 12:00 до 18:00) взимается в размере 50 %");
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

describe("refund rules — Публичная оферта и Политика возврата, ред. № 1 от 05.08.2026", () => {
  const refund = legalPolicies.find((p) => p.slug === "payment-refund");
  const offer = legalPolicies.find((p) => p.slug === "public-offer");
  const refundText = JSON.stringify(refund);
  const offerText = JSON.stringify(offer);

  it("charges 100% up front", () => {
    expect(offerText).toContain("предоплата составляет 100 % стоимости забронированных услуг");
    expect(refundText).toContain("Предоплата составляет 100 % стоимости забронированных услуг");
    // Until it is paid, nothing is held — §3.7. Guests read "booked" as "mine".
    expect(offerText).toContain("объект размещения за Заказчиком не резервирует");
  });

  it("refunds accommodation on a ladder, not never", () => {
    // The site spent a day telling guests the prepayment was non-refundable.
    // The signed policy gives all of it back five days out. Being stricter than
    // your own contract is the expensive direction to be wrong in.
    for (const doc of [offerText, refundText]) {
      expect(doc).toContain("не позднее чем за 5 суток");
      expect(doc).toContain("удерживается 50 % предоплаты");
      expect(doc).toContain("менее чем за 48 часов");
    }
    expect(accommodationCancellation.fullRefundDays).toBe(5);
    expect(accommodationCancellation.halfRefundHours).toBe(48);
  });

  it("makes day-use non-refundable AND non-transferable", () => {
    expect(refundText).toContain("является невозвратной");
    // The three ways a guest loses the money by their own doing — all three
    // spelled out, or the rule collapses into an argument about definitions.
    expect(refundText).toMatch(/неиспользовании оплаченной услуги/);
    expect(refundText).toMatch(/опоздании Заказчика/);
    expect(refundText).toMatch(/досрочном прекращении пользования услугой/);
    // Day-use must NOT pick up the accommodation ladder by association.
    expect(refundText).toMatch(/на другие даты не переносится/);
  });

  it("keeps force majeure and the resort's own fault refundable", () => {
    // The rule is about the guest's fault. A venue that keeps the money when IT
    // cancels is a different proposition, and not a lawful one.
    expect(refundText).toContain("обстоятельств непреодолимой силы");
    expect(refundText).toContain("возврат уплаченных денежных средств в полном объёме");
    expect(refundText).toMatch(/Если услуга не оказана по вине Исполнителя/);
    // The day-use section has to point at those exceptions, or it reads absolute.
    expect(refundText).toMatch(/Исключениями из настоящего раздела являются только случаи/);
    // And personal circumstances must be excluded by name, or every refusal
    // becomes a negotiation about whether flu counts as force majeure.
    expect(refundText).toMatch(/Личные обстоятельства Заказчика/);
    expect(offerText).toMatch(/болезнь, травма, беременность/);
  });

  it("makes the date transfer conditional, not a right", () => {
    expect(refundText).toContain("не является безусловным правом Заказчика");
    expect(refundText).toContain("по согласованию с Исполнителем");
    // Both directions: a peak-day booking cannot move, and nothing moves onto
    // a peak day. The site said only the first half until 2026-08-06.
    for (const doc of [offerText, refundText]) {
      expect(doc).toMatch(/приходящимся на выходные дни \(пятницу, субботу и воскресенье\)/);
      expect(doc).toMatch(/а также к переносу на такие дни/);
    }
    expect(dateTransfer.maxTimes).toBe(1);
    expect(dateTransfer.withinMonths).toBe(3);
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
      // Both rates, because they differ 36-fold and quoting one is misleading.
      expect(text).toContain(money(touristTax.resident));
      expect(text).toContain(money(touristTax.nonResident));
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
      expect(text).toMatch(/Предоплата 100%/);
      // The ladder, in figures, in both briefings. The compact one used to say
      // only "невозвратная", which is the opposite of the contract.
      expect(text).toMatch(/5 (СУТОК|суток)/);
      expect(text).toMatch(/48 (ЧАСОВ|часов)/);
      expect(text).toMatch(/50%/);
      // Day-use is the thing that IS non-refundable — kept distinct.
      expect(text).toMatch(/НЕПЕРЕНОСИМ/i);
      expect(text).toMatch(/(не автоматическое право|НЕ автоматическое право|только по согласованию)/i);
      // Personal circumstances, so the concierge does not hint at exceptions.
      expect(text).toMatch(/личные обстоятельства/i);
    });

    it(`${name}() spells out how to count the surcharge`, () => {
      expect(text).toMatch(/КАК СЧИТАТЬ ДОПЛАТУ/);
      expect(text).toMatch(/СВЕРХ СТАНДАРТА, а не сверх максимума/);
      // The worked example is the case that went wrong in production.
      expect(text).toMatch(/4 взрослых и ребёнок 6 лет в шале/);
    });
  }
});

describe("брифинги следуют правкам оператора, а не константам", () => {
  it("изменённая цена бассейна попадает в оба брифинга", () => {
    // The whole point of the pricing rewiring: an assistant that keeps quoting
    // the old figure contradicts the page it sits on, which is worse than
    // saying nothing.
    const patched = resolvePricing({ "pool.adult.weekday": 137_000 });
    expect(venueCore(patched)).toContain(money(137_000));
    expect(venueFacts(patched)).toContain(money(137_000));
  });

  it("изменённая доплата за человека тоже", () => {
    const patched = resolvePricing({ "extraGuest.adult": 555_000 });
    expect(venueCore(patched)).toContain(money(555_000));
    expect(venueFacts(patched)).toContain(money(555_000));
  });

  it("без правок брифинг тот же, что и был", () => {
    expect(venueCore(resolvePricing())).toBe(venueCore());
    expect(venueFacts(resolvePricing())).toBe(venueFacts());
  });
});
