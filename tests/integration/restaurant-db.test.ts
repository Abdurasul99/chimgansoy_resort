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
    await sql.query("DROP TABLE IF EXISTS restaurant_dishes, restaurant_categories, restaurant_settings CASCADE");
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

  it("настройки: пусто — значения по умолчанию, сохранённое читается, галерея — тоже", async () => {
    const s = await store.readSettings();
    expect(s.state).toBe("hidden");
    expect(s.gallery).toEqual([]);
    await store.saveSettings({ ...s, state: "open", hoursOpen: "10:00", hoursClose: "22:00", gallery: ["/blob/restaurant/gallery/a.webp"] }, "тест");
    expect(await store.readSettings()).toMatchObject({ state: "open", hoursOpen: "10:00", gallery: ["/blob/restaurant/gallery/a.webp"] });
  });

  it("меню: разделы, блюда, порядок, публичная выборка", async () => {
    const soups = await store.createCategory({ ru: "Супы", uz: "Sho'rvalar", en: "Soups" });
    const hidden = await store.createCategory({ ru: "Скрытый", uz: "", en: "" });
    const base = { description: { ru: "", uz: "", en: "" }, portion: "350 г", availability: "available" as const };
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
    const dish = (await store.listDishes()).find((d) => d.id === a);
    expect(dish).toMatchObject({ availability: "unavailable", price: 47_000 });

    expect(await store.setDishImage(a, "/blob/restaurant/dishes/x.webp")).toBe("");
    expect(await store.setDishImage(a, "")).toBe("/blob/restaurant/dishes/x.webp");

    // Удаление раздела не выставляет его блюда на сайт.
    await store.deleteCategory(hidden);
    const all = await store.listDishes();
    const orphan = all.find((d) => d.title.ru === "В скрытом разделе")!;
    expect(orphan.categoryId).toBeNull();
    expect(orphan.state).toBe("hidden");
    expect((await store.publicMenu()).dishes.some((d) => d.id === orphan.id)).toBe(false);
  });
});
