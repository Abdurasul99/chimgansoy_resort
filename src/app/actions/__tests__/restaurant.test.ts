import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, tashkentMs } from "@/lib/restaurant/rules";
import type { Dish, RestaurantSettings } from "@/lib/restaurant/model";

/**
 * Приём заказа ресторана: порядок «проверить → сохранить → уведомить» и то,
 * чего ТЗ требует при сбоях — никакого ложного успеха, никаких дублей.
 */

const h = vi.hoisted(() => ({
  settings: null as unknown as RestaurantSettings,
  dishes: [] as Dish[],
  insertOrder: vi.fn(),
  insertTable: vi.fn(),
  orderByIdem: vi.fn(async (): Promise<unknown> => null),
  tableByIdem: vi.fn(async (): Promise<unknown> => null),
  notifyOrder: vi.fn(async () => "sent"),
  notifyTable: vi.fn(async () => "sent"),
  preview: false,
}));

vi.mock("@/lib/restaurant/store", () => ({
  readSettings: async () => h.settings,
  dishesByIds: async (ids: number[]) => h.dishes.filter((d) => ids.includes(d.id)),
  insertOrder: h.insertOrder,
  insertTable: h.insertTable,
  orderByIdem: h.orderByIdem,
  tableByIdem: h.tableByIdem,
}));
vi.mock("@/lib/restaurant/notify", () => ({
  notifyOrder: h.notifyOrder,
  notifyTable: h.notifyTable,
  retryPendingNotifications: vi.fn(async () => {}),
}));
vi.mock("@/lib/restaurant/preview", () => ({
  PREVIEW_COOKIE: "cd_rest_preview",
  verifyPreview: (_t: unknown, kind: string) => kind === "cookie" && h.preview,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers({ "x-real-ip": "10.0.0.1" }),
}));
vi.mock("next/server", () => ({ after: () => {} }));

const { submitRestaurantOrder, submitRestaurantTable } = await import("../restaurant");
const { resetRateLimit } = await import("@/lib/restaurant/rate-limit");

const dish: Dish = {
  id: 7,
  categoryId: null,
  title: { ru: "Сазан жареный", uz: "", en: "Fried carp" },
  description: { ru: "", uz: "", en: "" },
  portion: "1 шт",
  price: 120_000,
  image: "",
  availability: "available",
  channels: ["hall", "takeaway", "delivery", "room"],
  state: "published",
  sort: 0,
};

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  const base = {
    locale: "ru",
    idemKey: "k-0123456789abcdefgh",
    privacyConsent: "on",
    mode: "takeaway",
    name: "Азиз",
    phone: "90 123 45 67",
    asap: "1",
    cart: JSON.stringify([{ dishId: 7, qty: 2 }]),
  };
  for (const [k, v] of Object.entries({ ...base, ...fields })) fd.set(k, v);
  return fd;
}

const saved = (over = {}) => ({
  order: { id: 12, number: "R-00012", token: "tok_abcdefghijklmnopqrstu", total: 240_000, ...over },
  created: true,
});

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimit();
  h.preview = false;
  h.dishes = [dish];
  // Без часов: «как можно скорее» не зависит от того, когда запущены тесты.
  h.settings = { ...DEFAULT_SETTINGS, state: "open" };
  h.insertOrder.mockResolvedValue(saved());
  h.insertTable.mockResolvedValue({ table: { id: 3, number: "T-00003", token: "tbl_abcdefghijklmnopqrst" }, created: true });
});

describe("заказ ресторана", () => {
  it("сохраняет заказ с суммой из базы, а не из браузера, и только потом шлёт в Telegram", async () => {
    const order: string[] = [];
    h.insertOrder.mockImplementation(async () => {
      order.push("save");
      return saved();
    });
    h.notifyOrder.mockImplementation(async () => {
      order.push("notify");
      return "sent";
    });
    const res = await submitRestaurantOrder(form({ cart: JSON.stringify([{ dishId: 7, qty: 2, price: 1 }]) }));
    expect(res).toEqual({ ok: true, token: "tok_abcdefghijklmnopqrstu", duplicate: false });
    expect(order).toEqual(["save", "notify"]);
    const arg = h.insertOrder.mock.calls[0][0];
    expect(arg).toMatchObject({ mode: "takeaway", phone: "+998901234567", subtotal: 240_000, total: 240_000, desiredTime: "asap", isTest: false });
    expect(arg.items).toEqual([{ dishId: 7, title: "Сазан жареный", titleLocal: "Сазан жареный", portion: "1 шт", price: 120_000, qty: 2 }]);
  });

  it("повтор с тем же ключом не шлёт уведомление второй раз", async () => {
    h.insertOrder.mockResolvedValue({ ...saved(), created: false });
    const res = await submitRestaurantOrder(form({}));
    expect(res).toMatchObject({ ok: true, duplicate: true });
    expect(h.notifyOrder).not.toHaveBeenCalled();
  });

  it("повтор уже сохранённого заказа возвращает его сразу, даже если время успело «пройти»", async () => {
    h.orderByIdem.mockResolvedValueOnce({ token: "old_token_abcdefghijklmn" });
    const res = await submitRestaurantOrder(form({ asap: "", date: "2020-01-01", time: "10:00" }));
    expect(res).toEqual({ ok: true, token: "old_token_abcdefghijklmn", duplicate: true });
    expect(h.insertOrder).not.toHaveBeenCalled();
  });

  it("цену поменяли, пока гость оформлял, — не сохраняем, а просим проверить", async () => {
    const res = await submitRestaurantOrder(form({ clientSubtotal: "200000" }));
    expect(res).toMatchObject({ ok: false, priceChanged: true });
    expect(h.insertOrder).not.toHaveBeenCalled();
    expect((await submitRestaurantOrder(form({ clientSubtotal: "240000" }))).ok).toBe(true);
  });

  it("база не сохранила — гостю ошибка и телефон, в Telegram ничего", async () => {
    h.insertOrder.mockRejectedValue(new Error("connection refused"));
    const res = await submitRestaurantOrder(form({}));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Позвоните нам/);
    expect(h.notifyOrder).not.toHaveBeenCalled();
  });

  it("Telegram не ответил — заказ всё равно принят: он в базе и в панели", async () => {
    h.notifyOrder.mockResolvedValue("failed");
    const res = await submitRestaurantOrder(form({}));
    expect(res.ok).toBe(true);
  });

  it("после открытия раздела cookie предпросмотра не делает заказ тестовым", async () => {
    h.preview = true;
    await submitRestaurantOrder(form({}));
    expect(h.insertOrder.mock.calls[0][0].isTest).toBe(false);
  });

  it("раздел не открыт — заказ не принимается, а в предпросмотре уходит тестовым", async () => {
    h.settings = { ...h.settings, state: "announce" };
    expect((await submitRestaurantOrder(form({}))).ok).toBe(false);
    expect(h.insertOrder).not.toHaveBeenCalled();
    h.preview = true;
    expect((await submitRestaurantOrder(form({}))).ok).toBe(true);
    expect(h.insertOrder.mock.calls[0][0].isTest).toBe(true);
  });

  it("выключенный способ не принимается даже в предпросмотре", async () => {
    h.settings = { ...h.settings, modes: { ...h.settings.modes, delivery: false } };
    h.preview = true;
    const res = await submitRestaurantOrder(form({ mode: "delivery", locality: "Чимган", address: "ул. 1" }));
    expect(res.ok).toBe(false);
  });

  it("у каждого способа свои обязательные поля", async () => {
    expect((await submitRestaurantOrder(form({ mode: "delivery" }))).ok).toBe(false);
    expect((await submitRestaurantOrder(form({ mode: "delivery", locality: "Чимган" }))).ok).toBe(false);
    expect((await submitRestaurantOrder(form({ mode: "delivery", locality: "Чимган", address: "ул. 1" }))).ok).toBe(true);
    expect((await submitRestaurantOrder(form({ mode: "room" }))).ok).toBe(false);
    expect((await submitRestaurantOrder(form({ mode: "room", unitType: "chalet", unitNo: "7" }))).ok).toBe(true);
    expect(h.insertOrder.mock.calls.at(-1)![0].details).toEqual({ unitType: "chalet", unitNo: "7" });
  });

  it("снятое с продажи блюдо возвращается гостю списком, заказ не создаётся", async () => {
    h.dishes = [{ ...dish, availability: "unavailable" }];
    const res = await submitRestaurantOrder(form({}));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.problems).toEqual([{ dishId: 7, title: "Сазан жареный", problem: "unavailable" }]);
    expect(h.insertOrder).not.toHaveBeenCalled();
  });

  it("без согласия, без ключа попытки и с неверным телефоном — отказ", async () => {
    expect((await submitRestaurantOrder(form({ privacyConsent: "" }))).ok).toBe(false);
    expect((await submitRestaurantOrder(form({ idemKey: "short" }))).ok).toBe(false);
    expect((await submitRestaurantOrder(form({ phone: "123" }))).ok).toBe(false);
    expect(h.insertOrder).not.toHaveBeenCalled();
  });

  it("бот, заполнивший ловушку, получает тихий успех и ничего не сохраняет", async () => {
    const res = await submitRestaurantOrder(form({ company: "Acme" }));
    expect(res).toEqual({ ok: true, token: "" });
    expect(h.insertOrder).not.toHaveBeenCalled();
  });

  it("очередь заказов с одного адреса упирается в лимит", async () => {
    for (let i = 0; i < 12; i++) await submitRestaurantOrder(form({}));
    const res = await submitRestaurantOrder(form({}));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Слишком много/);
  });
});

describe("бронь стола", () => {
  const next = new Date(Date.now() + 2 * 86_400_000 + 5 * 3600_000).toISOString().slice(0, 10);

  it("сохраняется и уходит в Telegram", async () => {
    const fd = form({ date: next, time: "19:00", adults: "4", kids: "1" });
    const res = await submitRestaurantTable(fd);
    expect(res).toEqual({ ok: true, token: "tbl_abcdefghijklmnopqrst", duplicate: false });
    expect(h.insertTable.mock.calls[0][0]).toMatchObject({ date: next, time: "19:00", adults: 4, kids: 1 });
    expect(h.notifyTable).toHaveBeenCalledWith(3);
  });

  it("брони выключены — отказ", async () => {
    h.settings = { ...h.settings, tables: false };
    expect((await submitRestaurantTable(form({ date: next, time: "19:00", adults: "2" }))).ok).toBe(false);
  });

  it("гостей от 1 до 40, время — в будущем", async () => {
    expect((await submitRestaurantTable(form({ date: next, time: "19:00", adults: "0" }))).ok).toBe(false);
    expect((await submitRestaurantTable(form({ date: "2020-01-01", time: "19:00", adults: "2" }))).ok).toBe(false);
    expect(tashkentMs(next, "19:00")).toBeGreaterThan(Date.now());
  });
});
