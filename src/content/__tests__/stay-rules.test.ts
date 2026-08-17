import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  accommodationCancellation,
  cabinOccupancy,
  dateTransfer,
  extraGuestPricing,
  poolPricing,
  stayRules,
  touristTax,
  tubingPricing,
} from "@/content/pricing";
import { policies } from "@/content/policies";
import { legalPolicies } from "@/content/policies-legal";
import { amendmentSources } from "@/content/policies-legal-amendments";
import { rooms } from "@/content/rooms";
import { fields } from "@/lib/price-catalog";
import { resolvePricing } from "@/lib/pricing-resolve";
import { money, venueCore, venueFacts } from "@/lib/venue-facts";

/**
 * The check-in hour is a content contract, not a UI default. Site copy, JSON-LD,
 * legal text, the Telegram bot and the assistant all have to agree, otherwise the
 * same booking detail reads differently in different places.
 *
 * These tests keep the hour centralized and prevent drift across the public
 * surface.
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
  it("is 15:00 — the operator decides the hour, and the offer follows", () => {
    expect(stayRules.checkIn).toBe("15:00");
    expect(stayRules.checkOut).toBe("12:00");
  });

  it("is not contradicted in public-facing source text", () => {
    const arrival = /заезд|kirish|check-?in|checkinTime/i;
    const wrongHour = /\b2:00\s?PM\b/i;
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
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
  /**
   * С 2026-08-16 вилка вернулась: 600 000 с гостя от 12 лет, 400 000 с ребёнка
   * 5–11, до 4 лет включительно бесплатно. Между 10 и 16 августа ставка была
   * одна — 500 000 для всех от четырёх лет.
   */
  it("charges by age band: child, adult, and free below", () => {
    const { adult, child } = extraGuestPricing;
    expect(adult).toBe(600_000);
    expect(child).toBe(400_000);
    // Ребёнок дешевле взрослого — иначе вилка не вилка, а опечатка.
    expect(child).toBeLessThan(adult);
  });

  it("leaves no age in two bands and none in the gap", () => {
    const { freeThroughAge, childFrom, childTo, adultFromAge } = extraGuestPricing;
    // Каждый возраст попадает ровно в одну полосу. Дыра здесь означала бы
    // гостя, за которого непонятно, сколько брать, — а нахлёст спор с ним на
    // ресепшене. Двенадцатилетний идёт по взрослой ставке: оператор подтвердил
    // границу отдельно, потому что «5-12» и «12+» в его записке пересекались.
    expect(freeThroughAge + 1).toBe(childFrom);
    expect(childTo + 1).toBe(adultFromAge);
    expect(adultFromAge).toBe(12);
  });

  it("is editable from the admin panel", () => {
    const keys = fields().map((f) => f.key);
    expect(keys).toContain("extraGuest.adult");
    expect(keys).toContain("extraGuest.guestVisitCottage");
    // Детская ставка снова живая — и снова редактируется. Пока цена была одна,
    // строки здесь не было: поле, которое не читает ни один текст, — это
    // приглашение вписать число и не понять, почему оно никуда не попало.
    expect(keys).toContain("extraGuest.child");
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
      // Ставка одна — иностранная. С граждан и резидентов Узбекистана сбор не
      // взимается (уточнение оператора 2026-08-11), и брифинг обязан говорить
      // об этом прямо: иначе консьерж назовёт узбекистанцу платёж, которого
      // нет, и гость приедет с лишними деньгами в кармане и претензией.
      expect(text).toContain(money(touristTax.nonResident));
      expect(text).toMatch(/иностранн/i);
      expect(text).toMatch(/не взимается|не платят/i);
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
      expect(text).toMatch(/предоплата 100%/i);
      // Час, а не сутки (оператор, 17.08.2026), и с автоматической отменой:
      // ИИ, пообещавший гостю день на оплату, стоит потерянной брони.
      expect(text).toMatch(/в течение 1 часа/i);
      expect(text).toMatch(/аннулир/i);
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

describe("документы — поправки оператора поверх подписанного текста", () => {
  const offer = policies.find((p) => p.slug === "public-offer");
  const offerText = JSON.stringify(offer);

  it("срок предоплаты — час, и он не остался сутками ни в одном пункте", () => {
    // Оператор сократил срок 17.08.2026. Пока юрист не выпустил новую редакцию,
    // страница обязана показывать срок, по которому работает ресепшен: гость,
    // прочитавший «сутки», не заплатит через час и потеряет бронь.
    expect(offerText).toContain(`в течение ${stayRules.prepayWithin.ru} (одного) часа`);
    expect(offerText).not.toContain("24 (двадцати четырёх) часов");
    expect(offerText).toContain("автоматически аннулируется");
  });

  it("изменённый пункт помечен, а не подменён молча", () => {
    // Молчаливая правка договора — это подлог. Под каждым исправленным пунктом
    // стоит примечание: что изменено, кем и когда.
    expect(offerText).toContain("Срок предоплаты изменён распоряжением оператора от 17.08.2026");
  });

  it("исходные формулировки ещё существуют — иначе поправку пора удалить", () => {
    // Сторож на будущее. Когда придёт новая редакция .docx и старая фраза из
    // неё исчезнет, этот тест упадёт — и поправку нужно будет убрать, а не
    // оставлять висеть навсегда поверх текста, который уже исправлен.
    const raw = JSON.stringify(legalPolicies);
    for (const source of amendmentSources) {
      expect(raw, "поправка больше не находит свой исходный текст").toContain(source);
    }
  });
});

describe("правила бассейна — отдельная страница под галочку в форме", () => {
  const page = policies.find((p) => p.slug === "pool-rules");

  it("существует и открыта для индексации", () => {
    expect(page).toBeDefined();
    expect(page!.indexable).toBe(true);
  });

  it("это официальный раздел оферты, а не пересказ своими словами", () => {
    const body = JSON.stringify(page);
    // Пункты из Приложения № 1, раздел 5 — те самые, под которыми подписан
    // юрист. Второй текст о том же разошёлся бы с первым на первой правке.
    expect(body).toContain("проносить и употреблять собственные продукты питания и напитки");
    expect(body).toContain("исключительно в купальном костюме");
    expect(page!.sections.some((s) => s.title.ru.includes("ПРАВИЛА ПОСЕЩЕНИЯ ПАНОРАМНОГО БАССЕЙНА"))).toBe(true);
  });

  it("называет оба окна работы: у проживающих и у посетителей они разные", () => {
    const hours = page!.sections[0];
    for (const locale of ["ru", "uz", "en"] as const) {
      const text = hours.items[locale].join(" ");
      expect(text, locale).toContain(poolPricing.hours);
      expect(text, locale).toContain(poolPricing.hoursForStayingGuests);
    }
  });
});

describe("бассейн вокруг проживания — распоряжение оператора от 17.08.2026", () => {
  const offer = JSON.stringify(policies.find((p) => p.slug === "public-offer"));
  const poolPage = JSON.stringify(policies.find((p) => p.slug === "pool-rules"));

  it("условия приписаны к оферте и помечены как распоряжение, а не как её текст", () => {
    expect(offer).toContain("Дополнительные условия посещения бассейна (распоряжение оператора от 17.08.2026)");
    expect(offer).toContain("До заезда:");
    expect(offer).toContain("После выезда:");
  });

  it("сумма за день после выезда берётся из прайса, а не вписана в текст", () => {
    // Цифра, вписанная в документ руками, разошлась бы с админкой при первой
    // же правке оператора — и гость прочёл бы одно, а заплатил другое.
    const shown = money(poolPricing.afterCheckOut);
    expect(offer).toContain(shown);
    expect(poolPage).toContain(shown);
    expect(fields().map((f) => f.key)).toContain("pool.afterCheckout");
    expect(resolvePricing({ "pool.afterCheckout": 123_000 }).pool.afterCheckOut).toBe(123_000);
  });

  it("до заезда — бесплатно, но только с подтверждённой бронью", () => {
    expect(poolPricing.beforeCheckInFree).toBe(true);
    expect(offer).toContain("подтверждённой бронью");
    // Домик при этом не выдаётся: иначе это ранний заезд, а он платный (§5.2.1).
    expect(offer).toContain("объект размещения при этом не предоставляется");
  });

  it("оба брифинга ИИ знают про обе стороны условия", () => {
    for (const text of [venueFacts(), venueCore()]) {
      expect(text).toMatch(/до заезда/i);
      expect(text).toMatch(/после выезда/i);
      expect(text).toContain(money(poolPricing.afterCheckOut));
    }
  });
});

describe("тюбинг — голосовое распоряжение оператора от 17.08.2026", () => {
  it("работает 10:00–20:00: после восьми вечера катание запрещено", () => {
    expect(tubingPricing.hours).toBe("10:00–20:00");
  });

  it("проживающему включён один спуск НА ГОСТЯ, а не на домик", () => {
    // Прежние «2 спуска глэмпингу, 4 шале» — то же правило, посчитанное за
    // домик: 2 и 4 это ровно базовая вместимость. На гостя честнее, и при
    // доплате за дополнительное место не нужно решать заново.
    expect(tubingPricing.includedRidesPerGuest).toBe(1);
    expect(cabinOccupancy.glamping.base * tubingPricing.includedRidesPerGuest).toBe(2);
    expect(cabinOccupancy.cottage.base * tubingPricing.includedRidesPerGuest).toBe(4);
  });

  it("оба брифинга ИИ знают про часы, инструктора и оговорку «при работающей горке»", () => {
    for (const text of [venueFacts(), venueCore()]) {
      expect(text).toContain(tubingPricing.hours);
      expect(text).toMatch(/без инструктора|с инструктором|только с инструктором/i);
      expect(text).toMatch(/при работающей горке|только при работающей/i);
    }
  });

  it("нигде не осталось обещания «включено 2 спуска / 4 спуска»", () => {
    // Обещание живёт в тексте, а не в числе: правка константы его не трогает.
    // Ищем именно ВКЛЮЧЁННЫЕ спуски — «пакеты 2 или 4 спуска» это тариф, он
    // верен и остаётся.
    const included = /включ|kiritilgan|included|проживани|yashash narxiga/i;
    const fixedCount = /(2|4)\s(спуска|marta uchish|rides)/;
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
          if (!included.test(line) || !fixedCount.test(line)) return;
          offenders.push(`${file.slice(SRC.length + 1)}:${i + 1}`);
        });
    }

    expect(offenders).toEqual([]);
  });
});
