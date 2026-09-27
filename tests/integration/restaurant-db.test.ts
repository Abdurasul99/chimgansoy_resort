import { beforeAll, describe, expect, it } from "vitest";

/**
 * База ресторана на настоящем Postgres.
 *
 * Не запускается в обычном прогоне: нужна пустая тестовая база. Запуск:
 *   RESTAURANT_DB_TEST=postgres://…/тестовая_база npx vitest run tests/integration
 * Никогда не указывайте здесь рабочую базу: тест создаёт и меняет записи.
 */
const URL_ = process.env.RESTAURANT_DB_TEST;

// Через SSH-туннель каждый запрос — сотни миллисекунд, отсюда большой запас.
describe.skipIf(!URL_)("база ресторана (Postgres)", { timeout: 90_000 }, () => {
  let store: typeof import("@/lib/restaurant/store");

  beforeAll(async () => {
    process.env.DATABASE_URL = URL_;
    store = await import("@/lib/restaurant/store");
    const { sqlClient } = await import("@/lib/sql-client");
    const sql = sqlClient(URL_!);
    await sql.query("DROP TABLE IF EXISTS restaurant_status_log, restaurant_tables, restaurant_orders, restaurant_dishes, restaurant_categories, restaurant_settings CASCADE");
  });

  it("схема создаётся и когда первые запросы идут одновременно из разных процессов", async () => {
    const { ensureSchema } = await import("@/lib/restaurant/schema");
    const { sqlClient } = await import("@/lib/sql-client");
    // Разные строки подключения — разные пулы и разные ключи памяти: так
    // выглядят несколько процессов (сборка собирает страницы параллельно).
    const runs = Array.from({ length: 6 }, (_, i) => {
      const url = `${URL_}${URL_!.includes("?") ? "&" : "?"}application_name=t${i}`;
      return ensureSchema(sqlClient(url), url);
    });
    await expect(Promise.all(runs)).resolves.toHaveLength(6);
  });

  it("настройки: пусто — значения по умолчанию, сохранённое читается", async () => {
    const s = await store.readSettings();
    expect(s.state).toBe("hidden");
    await store.saveSettings({ ...s, state: "open", hoursOpen: "10:00", hoursClose: "22:00" }, "тест");
    expect(await store.readSettings()).toMatchObject({ state: "open", hoursOpen: "10:00" });
  });

  it("меню: разделы, блюда, порядок, публичная выборка", async () => {
    const soups = await store.createCategory({ ru: "Супы", uz: "Sho'rvalar", en: "Soups" });
    const hidden = await store.createCategory({ ru: "Скрытый", uz: "", en: "" });
    const base = { description: { ru: "", uz: "", en: "" }, portion: "350 г", availability: "available" as const, channels: ["hall", "takeaway", "delivery", "room"] as ("hall" | "takeaway" | "delivery" | "room")[] };
    const a = await store.createDish({ ...base, categoryId: soups, title: { ru: "Шурпа", uz: "", en: "" }, price: 45_000, state: "published" });
    const b = await store.createDish({ ...base, categoryId: soups, title: { ru: "Лагман", uz: "", en: "" }, price: 40_000, state: "published" });
    await store.createDish({ ...base, categoryId: soups, title: { ru: "Черновик", uz: "", en: "" }, price: 0, state: "hidden" });
    await store.createDish({ ...base, categoryId: hidden, title: { ru: "В скрытом разделе", uz: "", en: "" }, price: 10_000, state: "published" });
    await store.updateCategory(hidden, { visible: false });

    let menu = await store.publicMenu();
    expect(menu.categories.map((c) => c.title.ru)).toEqual(["Супы"]);
    expect(menu.dishes.map((d) => d.title.ru)).toEqual(["Шурпа", "Лагман"]);

    await store.moveDish(b, -1);
    menu = await store.publicMenu();
    expect(menu.dishes.map((d) => d.title.ru)).toEqual(["Лагман", "Шурпа"]);

    await store.setDishAvailability(a, "unavailable");
    await store.setDishPrice(a, 47_000);
    const [dish] = await store.dishesByIds([a]);
    expect(dish).toMatchObject({ availability: "unavailable", price: 47_000, channels: ["hall", "takeaway", "delivery", "room"] });

    expect(await store.setDishImage(a, "/blob/restaurant/dishes/x.webp")).toBe("");
    expect(await store.setDishImage(a, "")).toBe("/blob/restaurant/dishes/x.webp");

    // Блюдо скрытого раздела сервер не пропустит в заказ.
    const inHidden = (await store.listDishes()).find((d) => d.title.ru === "В скрытом разделе")!;
    expect((await store.dishesByIds([inHidden.id]))[0].state).toBe("hidden");

    // Удаление раздела не выставляет его блюда на сайт.
    await store.deleteCategory(hidden);
    const all = await store.listDishes();
    const orphan = all.find((d) => d.title.ru === "В скрытом разделе")!;
    expect(orphan.categoryId).toBeNull();
    expect(orphan.state).toBe("hidden");
    expect((await store.publicMenu()).dishes.some((d) => d.id === orphan.id)).toBe(false);
  });

  const newOrder = (idemKey: string) => ({
    idemKey,
    mode: "delivery" as const,
    name: "Азиз",
    phone: "+998901234567",
    details: { locality: "Чимган", address: "ул. 1" },
    desiredTime: "asap",
    items: [{ dishId: 1, title: "Шурпа", titleLocal: "Шурпа", portion: "350 г", price: 45_000, qty: 2 }],
    subtotal: 90_000,
    fee: null,
    feePending: true,
    total: 90_000,
    comment: "",
    locale: "ru",
    source: "",
    page: "",
    isTest: false,
  });

  it("заказ: один на ключ попытки, с первой строкой истории", async () => {
    const first = await store.insertOrder(newOrder("idem-aaaaaaaaaaaaaaaa"));
    const again = await store.insertOrder(newOrder("idem-aaaaaaaaaaaaaaaa"));
    expect(first.created).toBe(true);
    expect(again.created).toBe(false);
    expect(again.order.token).toBe(first.order.token);
    expect(first.order).toMatchObject({ status: "new", number: expect.stringMatching(/^R-\d{5}$/), feePending: true, fee: null });
    expect(await store.getOrderByToken(first.order.token)).toMatchObject({ id: first.order.id });
    expect(await store.getOrderByToken("не-токен")).toBeNull();
    const log = await store.history("order", first.order.id);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ from: null, to: "new", via: "site" });
  });

  it("статус: переход по правилам, гонка проигрывает, отмена требует причину", async () => {
    const { order } = await store.insertOrder(newOrder("idem-bbbbbbbbbbbbbbbb"));
    const who = { name: "Менеджер", via: "admin" as const };
    expect(await store.setOrderStatus(order.id, "cooking", who)).toMatchObject({ ok: false, error: "transition" });
    const [x, y] = await Promise.all([
      store.setOrderStatus(order.id, "confirmed", who),
      store.setOrderStatus(order.id, "confirmed", { name: "Официант", via: "telegram" }),
    ]);
    // Ровно одна из двух одновременных кнопок проводит заказ.
    expect([x.ok, y.ok].filter(Boolean)).toHaveLength(1);
    expect(await store.setOrderStatus(order.id, "cancelled", who, "")).toMatchObject({ ok: false, error: "reason" });
    const cancelled = await store.setOrderStatus(order.id, "cancelled", who, "Гость отказался");
    expect(cancelled.ok && cancelled.item.cancelReason).toBe("Гость отказался");
    await store.setOrderConfirmedTime(order.id, "19:30", who);
    await store.setOrderPayment(order.id, true, who);
    const log = await store.history("order", order.id);
    expect(log.map((l) => `${l.from}>${l.to}`)).toEqual(["null>new", "new>confirmed", "confirmed>cancelled", "cancelled>cancelled", "cancelled>cancelled"]);
    expect(log.at(-1)?.reason).toBe("оплата: оплачен");
  });

  it("сбор за доставку: утверждается и входит в итог, у самовывоза его нет", async () => {
    const { order } = await store.insertOrder(newOrder("idem-ffffffffffffffff"));
    const who = { name: "Менеджер", via: "admin" as const };
    const withFee = await store.setOrderFee(order.id, 25_000, who);
    expect(withFee).toMatchObject({ fee: 25_000, feePending: false, total: 115_000 });
    const pickup = await store.insertOrder({ ...newOrder("idem-gggggggggggggggg"), mode: "takeaway" });
    expect(await store.setOrderFee(pickup.order.id, 10_000, who)).toBeNull();
    expect((await store.history("order", order.id)).at(-1)?.reason).toBe("сбор: 25000 сум");
  });

  it("уведомление дошло не во все чаты — заказ остаётся недоставленным", async () => {
    const { order } = await store.insertOrder(newOrder("idem-hhhhhhhhhhhhhhhh"));
    expect(await store.claimNotify("order", order.id)).toBe(true);
    await store.savePartial("order", order.id, [{ chat_id: "555", message_id: 9 }]);
    expect(await store.isNotified("order", order.id)).toBe(false);
    expect(await store.pendingNotifications("order", 50)).toContain(order.id);
    // Захват снят — досылка может сразу попробовать снова.
    expect(await store.claimNotify("order", order.id)).toBe(true);
    expect((await store.getOrder(order.id))?.tgSent).toBe(1);
  });

  it("повтор находится по ключу попытки", async () => {
    const first = await store.insertOrder(newOrder("idem-iiiiiiiiiiiiiiii"));
    expect((await store.orderByIdem("idem-iiiiiiiiiiiiiiii"))?.id).toBe(first.order.id);
    expect(await store.orderByIdem("idem-нет-такого-ключа")).toBeNull();
  });

  it("уведомление: отправляет только захвативший, отправленное не досылается", async () => {
    const { order } = await store.insertOrder(newOrder("idem-cccccccccccccccc"));
    expect(await store.pendingNotifications("order", 50)).toContain(order.id);
    expect(await store.claimNotify("order", order.id)).toBe(true);
    expect(await store.claimNotify("order", order.id)).toBe(false);
    await store.releaseNotify("order", order.id);
    expect(await store.claimNotify("order", order.id)).toBe(true);
    await store.markNotified("order", order.id, [{ chat_id: "-100", message_id: 5 }]);
    expect(await store.claimNotify("order", order.id)).toBe(false);
    expect(await store.pendingNotifications("order")).not.toContain(order.id);
    expect(await store.tgMessages("order", order.id)).toEqual([{ chat_id: "-100", message_id: 5 }]);
  });

  it("досылка берёт сначала тех, кого пробовали реже", async () => {
    const a = (await store.insertOrder(newOrder("idem-jjjjjjjjjjjjjjjj"))).order.id;
    const b = (await store.insertOrder(newOrder("idem-kkkkkkkkkkkkkkkk"))).order.id;
    // Все прежние недоставленные — «пробовали» по разу, a — дважды, b — ни разу.
    for (const id of await store.pendingNotifications("order", 50)) {
      if (id === b) continue;
      await store.claimNotify("order", id);
      await store.releaseNotify("order", id);
    }
    await store.claimNotify("order", a);
    await store.releaseNotify("order", a);
    expect((await store.pendingNotifications("order", 1))[0]).toBe(b);
  });

  it("списки заказов: фильтры и тестовые", async () => {
    await store.insertOrder({ ...newOrder("idem-dddddddddddddddd"), isTest: true });
    const active = await store.listOrders("active");
    expect(active.every((o) => !o.isTest && ["new", "confirmed", "cooking", "ready"].includes(o.status))).toBe(true);
    const withTests = await store.listOrders("all", { tests: true });
    expect(withTests.some((o) => o.isTest)).toBe(true);
    expect((await store.listOrders("today")).length).toBeGreaterThan(0);
    expect((await store.countNewOrders()).orders).toBeGreaterThan(0);
  });

  it("стол: сохранение, дата без сдвига часового пояса, отказ с причиной", async () => {
    const t = {
      idemKey: "idem-tttttttttttttttt",
      date: "2026-10-03",
      time: "19:00",
      adults: 4,
      kids: 1,
      name: "Гость",
      phone: "+998901234567",
      comment: "у окна",
      locale: "uz",
      source: "",
      page: "",
      isTest: false,
    };
    const a = await store.insertTable(t);
    const b = await store.insertTable(t);
    expect(b.created).toBe(false);
    expect(a.table).toMatchObject({ date: "2026-10-03", time: "19:00", number: expect.stringMatching(/^T-\d{5}$/) });
    const res = await store.setTableStatus(a.table.id, "declined", { name: "Админ", via: "admin" }, "Нет свободных столов");
    expect(res.ok).toBe(true);
    expect((await store.getTableByToken(a.table.token))?.cancelReason).toBe("Нет свободных столов");
    expect((await store.listTables("upcoming")).some((x) => x.id === a.table.id)).toBe(false);
  });
});
