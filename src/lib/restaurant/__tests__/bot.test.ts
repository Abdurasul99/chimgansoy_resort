import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Кнопки статусов в Telegram. Бот публичный, поэтому главное здесь — кто
 * может нажимать: только чаты, куда бот сам шлёт заказы (и, если задан
 * список, только эти сотрудники). Остальное — разбор кнопок и причины отмены.
 */

const h = vi.hoisted(() => ({
  answer: vi.fn(async () => null),
  edit: vi.fn(async () => null),
  setOrderStatus: vi.fn(),
  setTableStatus: vi.fn(),
}));

vi.mock("@/lib/telegram", async (orig) => ({
  ...(await orig<typeof import("@/lib/telegram")>()),
  answerCallbackQuery: h.answer,
  editMessageText: h.edit,
  sendMessage: vi.fn(async () => ({ message_id: 1 })),
}));
vi.mock("../store", () => ({
  setOrderStatus: h.setOrderStatus,
  setTableStatus: h.setTableStatus,
  getOrder: vi.fn(async () => null),
  getTable: vi.fn(async () => null),
  tgMessages: vi.fn(async () => []),
  history: vi.fn(async () => []),
}));

const { handleRestaurantCallback, tgActorName } = await import("../bot");
const { orderKeyboard, tableKeyboard, staffAllowed } = await import("../notify");

const cq = (data: string, chat = -1001, user = 42) => ({
  id: "cb1",
  from: { id: user, first_name: "Азиз", username: "aziz" },
  data,
  message: { chat: { id: chat }, message_id: 77 },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TELEGRAM_RESTAURANT_CHAT_ID", "-1001");
  vi.stubEnv("TELEGRAM_ADMIN_CHAT_ID", "555");
  vi.stubEnv("TELEGRAM_RESTAURANT_STAFF_IDS", "");
  h.setOrderStatus.mockResolvedValue({ ok: true, item: { id: 5, status: "confirmed" }, from: "new" });
  h.setTableStatus.mockResolvedValue({ ok: true, item: { id: 2, status: "confirmed" }, from: "new" });
});
afterEach(() => vi.unstubAllEnvs());

describe("доступ к кнопкам", () => {
  it("чужой чат — «нет доступа», статус не меняется", async () => {
    expect(await handleRestaurantCallback(cq("ro:5:c", 999))).toBe(true);
    expect(h.answer).toHaveBeenCalledWith("cb1", "Нет доступа");
    expect(h.setOrderStatus).not.toHaveBeenCalled();
  });

  it("группа ресторана и чат комплекса — можно", () => {
    expect(staffAllowed(-1001, 1)).toBe(true);
    expect(staffAllowed(555, 1)).toBe(true);
    expect(staffAllowed(123, 1)).toBe(false);
  });

  it("список сотрудников сужает доступ внутри разрешённого чата", async () => {
    vi.stubEnv("TELEGRAM_RESTAURANT_STAFF_IDS", "42,43");
    expect(staffAllowed(-1001, 42)).toBe(true);
    expect(staffAllowed(-1001, 99)).toBe(false);
    await handleRestaurantCallback(cq("ro:5:c", -1001, 99));
    expect(h.setOrderStatus).not.toHaveBeenCalled();
  });

  it("не наша кнопка — не трогаем, её разберёт гостевой бот", async () => {
    expect(await handleRestaurantCallback(cq("menu"))).toBe(false);
    expect(await handleRestaurantCallback(cq("reqs:2026-09-26"))).toBe(false);
    expect(h.answer).not.toHaveBeenCalled();
  });
});

describe("статусы кнопками", () => {
  it("подтверждение пишет, кто нажал", async () => {
    await handleRestaurantCallback(cq("ro:5:c"));
    expect(h.setOrderStatus).toHaveBeenCalledWith(5, "confirmed", { name: "Азиз @aziz (tg 42)", via: "telegram" }, undefined);
    expect(h.answer).toHaveBeenCalledWith("cb1", "Статус: Подтверждена");
  });

  it("отмена сначала спрашивает причину, потом отменяет с ней", async () => {
    await handleRestaurantCallback(cq("ro:5:x"));
    expect(h.setOrderStatus).not.toHaveBeenCalled();
    await handleRestaurantCallback(cq("ro:5:x2"));
    expect(h.setOrderStatus).toHaveBeenCalledWith(5, "cancelled", expect.anything(), "Не дозвонились");
  });

  it("кто-то успел раньше — честно говорим, что уже изменено", async () => {
    h.setOrderStatus.mockResolvedValue({ ok: false, error: "race", current: "cooking" });
    await handleRestaurantCallback(cq("ro:5:r"));
    expect(h.answer).toHaveBeenCalledWith("cb1", "Уже изменён: Готовится");
  });

  it("стол: отказ — с причиной из своего списка", async () => {
    await handleRestaurantCallback(cq("rt:2:n0"));
    expect(h.setTableStatus).toHaveBeenCalledWith(2, "declined", expect.anything(), "Нет свободных столов");
  });

  it("база не ответила — кнопка получает ответ, а не крутится", async () => {
    h.setOrderStatus.mockRejectedValue(new Error("db down"));
    expect(await handleRestaurantCallback(cq("ro:5:c"))).toBe(true);
    expect(h.answer).toHaveBeenCalledWith("cb1", expect.stringMatching(/Не удалось/));
  });

  it("мусор в данных кнопки не проходит", async () => {
    expect(await handleRestaurantCallback(cq("ro:5:c;DROP"))).toBe(false);
    expect(await handleRestaurantCallback(cq("ro:abc:c"))).toBe(false);
  });
});

describe("клавиатуры", () => {
  it("данные кнопок укладываются в 64 байта Telegram", () => {
    const all = [
      ...orderKeyboard({ id: 999_999_999_999, status: "new" }).flat(),
      ...orderKeyboard({ id: 999_999_999_999, status: "confirmed" }, "cancel").flat(),
      ...tableKeyboard({ id: 999_999_999_999, status: "new" }, "decline").flat(),
    ];
    for (const b of all) if (b.callback_data) expect(Buffer.byteLength(b.callback_data)).toBeLessThanOrEqual(64);
  });

  it("у закрытого заказа кнопок статусов нет", () => {
    const kb = orderKeyboard({ id: 1, status: "done" }).flat();
    expect(kb.filter((b) => b.callback_data)).toEqual([]);
  });

  it("имя сотрудника без фамилии и логина", () => {
    expect(tgActorName({ id: 7 })).toBe("Сотрудник (tg 7)");
  });
});
