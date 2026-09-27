import { describe, expect, it } from "vitest";
import type { Dish } from "../model";
import {
  DEFAULT_SETTINGS,
  canMoveOrder,
  canMoveTable,
  checkDesiredTime,
  checkTableTime,
  cleanCart,
  dishProblem,
  dishVisibleIn,
  maskPhone,
  normalizePhone,
  normalizeSettings,
  priceCart,
  tashkentMs,
  timeSlots,
  withinHours,
} from "../rules";

/**
 * Правила ресторана — то, что сервер проверяет у каждого заказа. Сумма из
 * браузера не принимается, поэтому калькулятор должен быть правильным сам.
 */

const dish = (over: Partial<Dish> = {}): Dish => ({
  id: 1,
  categoryId: null,
  title: { ru: "Шурпа", uz: "Sho'rva", en: "" },
  description: { ru: "", uz: "", en: "" },
  portion: "350 г",
  price: 45_000,
  image: "",
  availability: "available",
  channels: ["hall", "takeaway", "delivery", "room"],
  state: "published",
  sort: 0,
  ...over,
});

const open = { ...DEFAULT_SETTINGS, state: "open" as const, hoursOpen: "10:00", hoursClose: "22:00" };
// 26.09.2026 15:00 по Ташкенту.
const NOW = tashkentMs("2026-09-26", "15:00");

describe("блюдо и способ получения", () => {
  it("«временно нет» не заказать никаким способом", () => {
    expect(dishProblem(dish({ availability: "unavailable" }), "takeaway")).toBe("unavailable");
  });

  it("«по предзаказу» — только предзаказом к визиту", () => {
    const d = dish({ availability: "preorder" });
    expect(dishProblem(d, "delivery")).toBe("preorder_only");
    expect(dishProblem(d, "preorder")).toBeNull();
  });

  it("при выбранном способе блюда «только предзаказ» не показываются, «временно нет» — видно", () => {
    expect(dishVisibleIn(dish({ availability: "preorder" }), "delivery")).toBe(false);
    expect(dishVisibleIn(dish({ availability: "preorder" }), "preorder")).toBe(true);
    expect(dishVisibleIn(dish({ availability: "unavailable" }), "delivery")).toBe(true);
  });

  it("блюдо без канала «в номер» в номер не уходит и в этом режиме не показывается", () => {
    const d = dish({ channels: ["hall", "takeaway"] });
    expect(dishProblem(d, "room")).toBe("channel");
    expect(dishVisibleIn(d, "room")).toBe(false);
    expect(dishVisibleIn(d, null)).toBe(true);
  });

  it("предзаказ едят в зале — нужен канал «зал»", () => {
    expect(dishProblem(dish({ channels: ["delivery"] }), "preorder")).toBe("channel");
  });

  it("скрытое, архивное и без цены — не заказать", () => {
    expect(dishProblem(dish({ state: "hidden" }), "takeaway")).toBe("missing");
    expect(dishProblem(undefined, "takeaway")).toBe("missing");
    expect(dishProblem(dish({ price: 0 }), "takeaway")).toBe("no_price");
  });
});

describe("корзина", () => {
  it("чистит мусор из браузера и складывает повторы", () => {
    const lines = cleanCart([
      { dishId: 1, qty: 2 },
      { dishId: 1, qty: 3 },
      { dishId: "2", qty: 1 },
      { dishId: -1, qty: 1 },
      { dishId: 3, qty: 0 },
      { dishId: 4, qty: 999 },
      "мусор",
      null,
    ]);
    expect(lines).toEqual([
      { dishId: 1, qty: 5 },
      { dishId: 2, qty: 1 },
      { dishId: 4, qty: 50 },
    ]);
    expect(cleanCart("не массив")).toEqual([]);
  });

  it("сумму считает сервер по своим ценам, а сбор не утверждён — не выдумывает", () => {
    const res = priceCart(
      [{ dishId: 1, qty: 2 }, { dishId: 2, qty: 1 }],
      [dish(), dish({ id: 2, title: { ru: "Плов", uz: "", en: "Plov" }, price: 60_000 })],
      "delivery",
      open,
      "en",
    );
    expect(res.subtotal).toBe(150_000);
    expect(res.fee).toBeNull();
    expect(res.feePending).toBe(true);
    expect(res.total).toBe(150_000);
    // Снимок названия — по-русски для кухни и на языке гостя для его страницы.
    expect(res.items[1]).toMatchObject({ title: "Плов", titleLocal: "Plov", price: 60_000, qty: 1 });
    // Нет перевода — берётся русский.
    expect(res.items[0].titleLocal).toBe("Шурпа");
  });

  it("утверждённый сбор входит в итог, самовывоз бесплатен", () => {
    const s = { ...open, deliveryFee: 30_000 };
    expect(priceCart([{ dishId: 1, qty: 1 }], [dish()], "delivery", s, "ru").total).toBe(75_000);
    expect(priceCart([{ dishId: 1, qty: 1 }], [dish()], "takeaway", s, "ru")).toMatchObject({ fee: 0, feePending: false, total: 45_000 });
  });

  it("проблемные блюда не попадают в сумму, а называются", () => {
    const res = priceCart([{ dishId: 1, qty: 1 }, { dishId: 9, qty: 1 }], [dish({ availability: "unavailable" })], "takeaway", open, "ru");
    expect(res.items).toEqual([]);
    expect(res.problems.map((p) => p.problem)).toEqual(["unavailable", "missing"]);
  });
});

describe("время заказа", () => {
  it("«как можно скорее» — только пока кухня работает", () => {
    expect(checkDesiredTime(open, "takeaway", { asap: true, date: "", time: "" }, NOW)).toEqual({ ok: true, value: "asap" });
    const night = tashkentMs("2026-09-26", "23:10");
    expect(checkDesiredTime(open, "takeaway", { asap: true, date: "", time: "" }, night)).toEqual({ ok: false, error: "closed" });
  });

  it("предзаказ — только ко времени и не раньше, чем за сутки", () => {
    expect(checkDesiredTime(open, "preorder", { asap: true, date: "", time: "" }, NOW).ok).toBe(false);
    expect(checkDesiredTime(open, "preorder", { asap: false, date: "2026-09-27", time: "12:00" }, NOW)).toEqual({ ok: false, error: "lead" });
    expect(checkDesiredTime(open, "preorder", { asap: false, date: "2026-09-27", time: "16:00" }, NOW).ok).toBe(true);
  });

  it("прошедшее, вне часов и слишком далёкое — отказ с причиной", () => {
    const t = (date: string, time: string) => checkDesiredTime(open, "delivery", { asap: false, date, time }, NOW);
    expect(t("2026-09-26", "15:10")).toEqual({ ok: false, error: "past" });
    expect(t("2026-09-26", "22:30")).toEqual({ ok: false, error: "hours" });
    // Минута закрытия — уже не рабочая.
    expect(t("2026-09-26", "22:00")).toEqual({ ok: false, error: "hours" });
    expect(t("2026-10-20", "12:00")).toEqual({ ok: false, error: "too_far" });
    expect(t("2026-09-26", "18:00")).toEqual({ ok: true, value: "2026-09-26 18:00" });
    expect(t("26.09", "18:00")).toEqual({ ok: false, error: "invalid" });
  });

  it("часы через полночь: ночные слоты уходят с датой следующего дня", () => {
    const late = { hoursOpen: "12:00", hoursClose: "02:00" };
    expect(withinHours(late, 23 * 60)).toBe(true);
    expect(withinHours(late, 60)).toBe(true);
    expect(withinHours(late, 2 * 60)).toBe(false);
    expect(withinHours(late, 5 * 60)).toBe(false);
    const slots = timeSlots(late, "2026-09-27", { now: NOW });
    // Вечер 27-го — сначала, потом ночь на 28-е с датой 28-го.
    expect(slots[0]).toEqual({ date: "2026-09-27", time: "12:00", nextDay: false });
    expect(slots.at(-1)).toEqual({ date: "2026-09-28", time: "01:30", nextDay: true });
    expect(slots.some((s) => s.date === "2026-09-27" && s.time < "12:00")).toBe(false);
  });

  it("сегодня после полуночи видны слоты этой ночи", () => {
    const late = { hoursOpen: "12:00", hoursClose: "02:00" };
    const night = tashkentMs("2026-09-27", "00:10");
    const slots = timeSlots(late, "2026-09-27", { now: night });
    expect(slots[0]).toEqual({ date: "2026-09-27", time: "01:00", nextDay: false });
  });

  it("без часов — ограничения нет, слоты 08:00–23:30, сегодняшние — не раньше чем через полчаса", () => {
    const none = { hoursOpen: "", hoursClose: "" };
    const today = timeSlots(none, "2026-09-26", { now: NOW });
    expect(today[0].time).toBe("15:30");
    expect(today.at(-1)?.time).toBe("23:30");
    expect(timeSlots(none, "2026-09-25", { now: NOW })).toEqual([]);
  });

  it("предзаказ: слоты не ближе, чем за сутки", () => {
    const slots = timeSlots(open, "2026-09-27", { now: NOW, leadMs: 24 * 3600_000 });
    expect(slots[0].time).toBe("15:00");
  });

  it("стол: та же логика времени, но на два месяца вперёд", () => {
    expect(checkTableTime(open, "2026-11-20", "19:00", NOW).ok).toBe(true);
    expect(checkTableTime(open, "2027-01-20", "19:00", NOW)).toEqual({ ok: false, error: "too_far" });
  });
});

describe("статусы", () => {
  it("заказ идёт вперёд, отменяется до выдачи и не переоткрывается", () => {
    expect(canMoveOrder("new", "confirmed")).toBe(true);
    expect(canMoveOrder("new", "cooking")).toBe(false);
    expect(canMoveOrder("confirmed", "ready")).toBe(true);
    expect(canMoveOrder("ready", "cancelled")).toBe(true);
    expect(canMoveOrder("done", "cancelled")).toBe(false);
    expect(canMoveOrder("cancelled", "new")).toBe(false);
  });

  it("бронь стола: подтверждена или отказ, затем визит", () => {
    expect(canMoveTable("new", "declined")).toBe(true);
    expect(canMoveTable("confirmed", "done")).toBe(true);
    expect(canMoveTable("declined", "confirmed")).toBe(false);
  });
});

describe("настройки из базы", () => {
  it("битая запись не роняет страницы — берутся значения по умолчанию", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    const s = normalizeSettings({
      state: "взлом",
      hoursOpen: "25:00",
      instagram: "javascript:alert(1)",
      phones: ["+998 95 521 00 14", "<script>"],
      deliveryFee: "-5",
      preorderLeadHours: 9999,
      modes: { delivery: false, room: "да" },
    });
    expect(s.state).toBe("hidden");
    expect(s.hoursOpen).toBe("");
    expect(s.instagram).toBe("");
    expect(s.phones).toEqual(["+998 95 521 00 14"]);
    expect(s.deliveryFee).toBeNull();
    expect(s.preorderLeadHours).toBe(24);
    expect(s.modes).toEqual({ takeaway: true, delivery: false, room: true, preorder: false });
  });

  it("раздел по умолчанию скрыт, предзаказ выключен до согласования", () => {
    expect(DEFAULT_SETTINGS.state).toBe("hidden");
    expect(DEFAULT_SETTINGS.modes.preorder).toBe(false);
  });
});

describe("телефон", () => {
  it("узбекский номер приводится к +998, мусор отклоняется", () => {
    expect(normalizePhone("90 123 45 67")).toBe("+998901234567");
    expect(normalizePhone("998901234567")).toBe("+998901234567");
    expect(normalizePhone("+998 (90) 123-45-67")).toBe("+998901234567");
    expect(normalizePhone("+7 916 123 45 67")).toBe("+79161234567");
    expect(normalizePhone("12345")).toBeNull();
  });

  it("номер с «восьмёркой» по-старому — не иностранный", () => {
    expect(normalizePhone("8 90 123 45 67")).toBe("+998901234567");
    expect(normalizePhone("8 916 123 45 67")).toBe("+79161234567");
    expect(normalizePhone("0 90 123 45 67")).toBe("+998901234567");
  });

  it("на странице статуса номер виден не целиком", () => {
    expect(maskPhone("+998901234567")).toBe("+998 90 *** ** 67");
    expect(maskPhone("123")).toBe("***");
  });
});
