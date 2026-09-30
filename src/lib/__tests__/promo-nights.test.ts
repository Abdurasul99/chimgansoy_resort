import { describe, expect, it } from "vitest";
import { promotions } from "@/content/promotions";
import { stayNightRates } from "@/content/pricing";
import {
  discountMath,
  nightsBetween,
  promoActive,
  promoBookable,
  promoBreakdown,
  promoCheapestNight,
  promoCheapestPerPerson,
  promoHint,
  rangeQualifies,
} from "@/lib/promo-nights";

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

  it("вторник → пятница: три ночи, выезд в пятницу", () => {
    expect(rangeQualifies("2026-09-08", "2026-09-11", СЕГОДНЯ)).toBe(true);
  });

  it("четверг → воскресенье не подходит, хотя ночей тоже три", () => {
    // Ловушка условий: проверять длину мало, выезд не должен уходить в
    // выходные. Заезд в четверг + три ночи = выезд в воскресенье.
    expect(rangeQualifies("2026-09-10", "2026-09-13", СЕГОДНЯ)).toBe(false);
  });

  it("заезд в пятницу не подходит — выезд ушёл бы за пятницу", () => {
    expect(rangeQualifies("2026-09-11", "2026-09-13", СЕГОДНЯ)).toBe(false);
  });

  it("понедельник → пятница не подходит: только 3 ночи, четыре — уже нет", () => {
    expect(rangeQualifies("2026-09-07", "2026-09-11", СЕГОДНЯ)).toBe(false);
  });

  it("воскресенье → среда: три ночи — с 24.09.2026 тоже по акции", () => {
    // 13.09.2026 — воскресенье, 16.09 — среда.
    expect(rangeQualifies("2026-09-13", "2026-09-16", СЕГОДНЯ)).toBe(true);
  });

  it("с воскресенья — только три ночи: Вс→Чт это четыре, не подходит", () => {
    expect(rangeQualifies("2026-09-13", "2026-09-17", СЕГОДНЯ)).toBe(false);
  });

  it("суббота → вторник и среда → суббота не подходят, хотя ночей три", () => {
    // Суббота — не день заезда; из среды три ночи упираются в субботу, а
    // выезд по условиям не позже пятницы.
    expect(rangeQualifies("2026-09-12", "2026-09-15", СЕГОДНЯ)).toBe(false);
    expect(rangeQualifies("2026-09-09", "2026-09-12", СЕГОДНЯ)).toBe(false);
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

  it("две ночи с воскресенья: предлагаем третью до среды", () => {
    expect(promoHint("2026-09-13", "2026-09-15", СЕГОДНЯ)).toEqual({ kind: "offer-third", extendTo: "2026-09-16" });
  });

  it("три ночи с воскресенья: третья бесплатна", () => {
    expect(promoHint("2026-09-13", "2026-09-16", СЕГОДНЯ)).toEqual({ kind: "third-free" });
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

  it("ночи считаются как ночи, а не как дни", () => {
    expect(nightsBetween("2026-09-07", "2026-09-10")).toBe(3);
    expect(nightsBetween("2026-09-07", "2026-09-07")).toBe(0);
    expect(nightsBetween("", "2026-09-10")).toBe(0);
  });
});

describe("срок акций", () => {
  // Правила при заданном сроке — в promo-deadline.test.ts (срок там подставлен).
  // Поведение акции без срока — в promo-open.test.ts (срок там снят).
  it("«2+1» без срока — в октябре идёт вместе с «−20% на Chalet»", () => {
    // Оператор, 30.09.2026: в октябре четыре акции — «Всё включено», «2+1»,
    // «−20%», «Выходной без спешки».
    expect(promotions.find((p) => p.slug === "2plus1")?.until).toBeUndefined();
    expect(promoActive("2026-10-01")).toBe(true);
    expect(promoBookable("2026-10-15")).toBe(true);
    expect(rangeQualifies("2026-10-04", "2026-10-07", "2026-10-01")).toBe(true);
  });

  it("в октябре четыре акции", () => {
    expect(promotions.map((p) => p.slug).sort()).toEqual(["2plus1", "all-inclusive", "chalet-october", "slow-weekend"]);
  });

  it("«Всё включено» сроком не ограничена", () => {
    expect(promotions.find((p) => p.slug === "all-inclusive")?.until).toBeUndefined();
  });

  it("«Выходной без спешки» сроком не ограничен", () => {
    expect(promotions.find((p) => p.slug === "slow-weekend")?.until).toBeUndefined();
  });

  it("условия без срока не называют срок", () => {
    // Строка «до 30 сентября» в условиях при бессрочной акции — это отказ
    // гостю, который прочтёт её в октябре.
    for (const p of promotions.filter((x) => !x.until)) {
      expect(JSON.stringify(p.terms), p.slug).not.toMatch(/сентябр|sentabr|September/);
    }
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

  it("с человека при полном размещении — 500 000: глэмпинг на двоих, шале на четверых", () => {
    // Довод оператора (30.09.2026): «всего от 500 000 сум с человека за ночь».
    // Шале рассчитано на четверых — прежнее «гости сверх двоих» в условиях
    // брало бы доплату с третьего и четвёртого гостя шале.
    const rows = promoBreakdown();
    expect(rows.map((r) => [r.label.ru, r.guests, r.perPerson])).toEqual([
      ["Глэмпинг", 2, 500_000],
      ["Шале", 4, 500_000],
    ]);
    expect(promoCheapestPerPerson()).toBe(500_000);
  });

  it("цифра «с человека» в условиях совпадает с расчётом", () => {
    // Условия — текст, расчёт — из тарифа. Поменяют тариф — тест покажет, что
    // строка в условиях врёт.
    const promo = promotions.find((p) => p.slug === "2plus1")!;
    const per = String(promoCheapestPerPerson()).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    expect(promo.terms.ru.join(" ")).toContain(`от ${per} сум с человека за ночь`);
    expect(promo.terms.uz.join(" ")).toContain(`kechasiga ${per} so'mdan`);
    expect(promo.terms.en.join(" ")).toContain(`from ${per} UZS per person per night`);
    expect(promo.terms.ru.join(" ")).toContain("Завтраки включены");
    expect(JSON.stringify(promo.terms)).not.toContain("сверх двоих");
  });

  it("бейдж — «Будни», как у оператора", () => {
    // Оператор вернул своё слово 30.09.2026; дни заезда — в условиях рядом.
    const promo = promotions.find((p) => p.slug === "2plus1")!;
    expect(promo.badge.ru).toBe("Будни · −33%");
    expect(promo.terms.ru[0]).toContain("воскресенье");
  });
});

describe("«−20% на Chalet весь октябрь»", () => {
  const chalet = promotions.find((p) => p.slug === "chalet-october")!;

  it("расчёт оператора: 3 000 000 → 2 400 000, экономия 600 000, с человека 600 000", () => {
    expect(discountMath(chalet.discount!)).toEqual({
      base: 3_000_000,
      price: 2_400_000,
      saving: 600_000,
      percent: 20,
      guests: 4,
      perPerson: 600_000,
    });
  });

  it("база — будничная ночь шале из прайса, срок — последний день октября", () => {
    expect(chalet.discount!.base).toBe(stayNightRates.cottage.sunThu);
    expect(chalet.until).toBe("2026-10-31");
  });

  it("не суммируется с другими акциями — сказано в условиях", () => {
    expect(chalet.terms.ru.join(" ")).toContain("Не суммируется с другими акциями");
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
