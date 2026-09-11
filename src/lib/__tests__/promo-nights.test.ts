import { describe, expect, it } from "vitest";
import { promotions } from "@/content/promotions";
import { nightsBetween, promoActive, promoBreakdown, promoCheapestNight, promoHint, rangeQualifies } from "@/lib/promo-nights";

/**
 * Акция «2+1» на конкретных датах.
 *
 * Сентябрь 2026: 1-е — вторник. Значит 7, 14, 21, 28 — понедельники.
 */
const СЕГОДНЯ = "2026-09-09";

describe("акция «2+1» — какие даты подходят", () => {
  it("понедельник → четверг: три ночи, выезд в четверг", () => {
    expect(rangeQualifies("2026-09-07", "2026-09-10", СЕГОДНЯ)).toBe(true);
  });

  it("четверг → воскресенье не подходит, хотя ночей тоже три", () => {
    // Ловушка условий: проверять длину мало, выезд не должен уходить в
    // выходные. Заезд в четверг + три ночи = выезд в воскресенье.
    expect(rangeQualifies("2026-09-10", "2026-09-13", СЕГОДНЯ)).toBe(false);
  });

  it("заезд в пятницу не подходит — акция только на будни", () => {
    expect(rangeQualifies("2026-09-11", "2026-09-13", СЕГОДНЯ)).toBe(false);
  });

  it("акция кончается 30 сентября", () => {
    expect(promoActive("2026-09-30")).toBe(true);
    expect(promoActive("2026-10-01")).toBe(false);
    // Выезд за границу срока тоже не считается.
    expect(rangeQualifies("2026-09-28", "2026-10-01", "2026-09-28")).toBe(false);
  });
});

describe("что показать гостю под датами", () => {
  it("две ночи в будни: предлагаем третью бесплатно", () => {
    const hint = promoHint("2026-09-07", "2026-09-09", СЕГОДНЯ);
    expect(hint).toEqual({ kind: "offer-third", extendTo: "2026-09-10" });
  });

  it("три ночи в будни: говорим, что третья бесплатна", () => {
    expect(promoHint("2026-09-07", "2026-09-10", СЕГОДНЯ)).toEqual({ kind: "third-free" });
  });

  it("две ночи со среды: объясняем условия, а не молчим", () => {
    // Ср→Пт: продление увело бы выезд в субботу, акция не действует. Молчать
    // здесь нельзя — оператор проверил ровно эти даты, ничего не увидел и
    // решил, что подсказка не работает вовсе.
    expect(promoHint("2026-09-09", "2026-09-11", СЕГОДНЯ)).toEqual({ kind: "explain" });
  });

  it("одна ночь — объяснение, неделя — молчим", () => {
    // На одну ночь акция ещё может сработать, если сдвинуть даты, — объясняем.
    // На неделю она не сработает никак: выезд всё равно уйдёт за пятницу.
    expect(promoHint("2026-09-07", "2026-09-08", СЕГОДНЯ)).toEqual({ kind: "explain" });
    expect(promoHint("2026-09-07", "2026-09-14", СЕГОДНЯ)).toBeNull();
  });

  it("после 30 сентября подсказка не появляется вовсе", () => {
    expect(promoHint("2026-10-05", "2026-10-07", "2026-10-01")).toBeNull();
  });

  it("ночи считаются как ночи, а не как дни", () => {
    expect(nightsBetween("2026-09-07", "2026-09-10")).toBe(3);
    expect(nightsBetween("2026-09-07", "2026-09-07")).toBe(0);
    expect(nightsBetween("", "2026-09-10")).toBe(0);
  });
});

describe("акция исчезает сама", () => {
  it("у «2+1» проставлен срок — иначе она висела бы вечно", () => {
    const promo = promotions.find((p) => p.slug === "2plus1");
    expect(promo?.until).toBe("2026-09-30");
  });

  it("бессрочные акции сроком не ограничены", () => {
    // «Всё включено» и «Выходной без спешки» действуют, пока оператор не
    // скажет иначе: у них until нет, и фильтр их не трогает.
    const ongoing = promotions.filter((p) => p.slug !== "2plus1");
    expect(ongoing.every((p) => !p.until)).toBe(true);
  });

  it("срок указан и в условиях, которые читает гость", () => {
    // Дата в коде без даты в тексте — это скидка, которая пропадёт без
    // предупреждения.
    const promo = promotions.find((p) => p.slug === "2plus1")!;
    expect(promo.terms.ru.join(" ")).toContain("30 сентября");
    expect(promo.terms.en.join(" ")).toContain("30 September");
  });
});

describe("расчёт «2+1» — как его объясняет оператор", () => {
  it("глэмпинг: 3 ночи за 3 000 000, то есть 1 000 000 за ночь", () => {
    const g = promoBreakdown().find((r) => r.label.ru === "Глэмпинг")!;
    expect(g.night).toBe(1_500_000);
    expect(g.total).toBe(3_000_000);
    expect(g.perNight).toBe(1_000_000);
  });

  it("шале: 3 ночи за 6 000 000, то есть 2 000 000 за ночь", () => {
    const c = promoBreakdown().find((r) => r.label.ru === "Шале")!;
    expect(c.night).toBe(3_000_000);
    expect(c.total).toBe(6_000_000);
    expect(c.perNight).toBe(2_000_000);
  });

  it("на первый экран идёт самая дешёвая ночь — 1 000 000", () => {
    expect(promoCheapestNight()).toBe(1_000_000);
  });
});

describe("«Всё включено» — питание по дням", () => {
  it("расписание есть, и обеда после выезда в нём нет", () => {
    // Прежний макет обещал обед в 13:00 после выезда. Оператор 11.09.2026
    // расписал питание заново: в день выезда только завтрак.
    const ai = promotions.find((p) => p.slug === "all-inclusive")!;
    const lines = ai.howItWorks!.lines.ru.join(" ");
    expect(lines).toContain("в день выезда — завтрак");
    expect(JSON.stringify(ai)).not.toContain("13:00");
  });
});
