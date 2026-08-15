import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Перевод броней Exely в строки нашей шахматки.
 *
 * Их API подменён целиком: тест не должен ходить в чужую сеть и не должен
 * зависеть от того, кто сегодня заселился. Проверяется ровно то, что делает
 * наш код — сопоставление номеров, типов, статусов и дат.
 *
 * Один из этих случаев уже стоил рабочего дня: `roomId` приходит длинным
 * идентификатором вида «9007199254834751», а первая версия разбирала из него
 * цифры и получала шестнадцатизначное число. Ни одна бронь не привязывалась к
 * строке, и шахматка выглядела пустой при 55 бронях в Exely.
 */
const listRooms = vi.fn();
const getBookingsInPeriod = vi.fn();

vi.mock("@/lib/exely-pms", () => ({
  listRooms: () => listRooms(),
  getBookingsInPeriod: (a: string, b: string) => getBookingsInPeriod(a, b),
  roomTypeName: (id: string) => (id === "T-GLAMP" ? "Глэмпинг A-frame" : id === "T-CHALET" ? "Шале" : `Категория ${id}`),
}));

// unstable_cache в тесте — просто проброс: кеш Next здесь ни при чём.
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const ROOMS = [
  { id: "9007199254834751", name: "01", roomTypeId: "T-GLAMP" },
  { id: "9007199254834755", name: "05", roomTypeId: "T-GLAMP" },
  { id: "9007199254834761", name: "11", roomTypeId: "T-CHALET" },
  { id: "9007199254834770", name: "20", roomTypeId: "T-CHALET" },
];

const stay = (over: Record<string, unknown> = {}) => ({
  id: "s1",
  roomId: "9007199254834751",
  roomTypeId: "T-GLAMP",
  checkInDateTime: "2026-09-10T15:00",
  checkOutDateTime: "2026-09-12T12:00",
  status: "New",
  guestCountInfo: { adults: 2, children: 1 },
  totalPrice: { amount: 3_000_000 },
  ...over,
});

const booking = (stays: unknown[], over: Record<string, unknown> = {}) => ({
  id: "b1",
  number: "1042",
  customer: { firstName: "Иван", lastName: "Петров", phones: ["+998901112233"] },
  roomStays: stays,
  ...over,
});

async function run(bookings: unknown[], rooms = ROOMS) {
  listRooms.mockResolvedValue({ ok: true, data: rooms });
  getBookingsInPeriod.mockResolvedValue({ ok: true, data: bookings });
  const { exelyOccupancy } = await import("@/lib/exely-occupancy");
  return exelyOccupancy("2026-09-01", "2026-09-30");
}

beforeEach(() => {
  vi.resetModules();
  listRooms.mockReset();
  getBookingsInPeriod.mockReset();
});

describe("брони Exely → строки шахматки", () => {
  it("номер берётся из справочника, а не из идентификатора", async () => {
    const [row] = await run([booking([stay()])]);
    expect(row.unit_id).toBe("glamping-01");
    expect(row.room_slug).toBe("glamping");
  });

  it("номера 11–20 — это шале с первого по десятое", async () => {
    const [row] = await run([
      booking([stay({ roomId: "9007199254834761", roomTypeId: "T-CHALET" })]),
    ]);
    expect(row.unit_id).toBe("chalet-01");
    expect(row.room_slug).toBe("cottage");
  });

  it("двадцатый номер — это шале №10, а не одиннадцатое", async () => {
    const [row] = await run([
      booking([stay({ roomId: "9007199254834770", roomTypeId: "T-CHALET" })]),
    ]);
    expect(row.unit_id).toBe("chalet-10");
  });

  it("тип определяется по номеру, когда справочник категорий его не знает", async () => {
    // Справочник набран руками и устареет при первом изменении на их стороне.
    const [row] = await run([booking([stay({ roomTypeId: "T-UNKNOWN" })])]);
    expect(row.room_slug).toBe("glamping");
  });

  it("отменённые в сетку не попадают — иначе держали бы номер", async () => {
    const rows = await run([booking([stay({ status: "Cancelled" })])]);
    expect(rows).toHaveLength(0);
  });

  it("выехавший гость — «завершена», а не «оплачена»", async () => {
    const [row] = await run([booking([stay({ status: "CheckedOut" })])]);
    expect(row.status).toBe("done");
  });

  it("заселившийся — «оплачена»", async () => {
    const [row] = await run([booking([stay({ status: "CheckedIn" })])]);
    expect(row.status).toBe("paid");
  });

  it("даты обрезаются до дня: время заезда сетке не нужно", async () => {
    const [row] = await run([booking([stay()])]);
    expect(row.checkin).toBe("2026-09-10");
    expect(row.checkout).toBe("2026-09-12");
  });

  it("идентификатор отрицательный — чужую запись нельзя спутать со своей", async () => {
    const [row] = await run([booking([stay()])]);
    expect(row.id).toBeLessThan(0);
    expect(row.source).toBe("exely");
  });

  it("неизвестный номер оставляет бронь видимой, но без строки", async () => {
    // «Есть, а где именно — смотрите в Exely» честнее, чем поставить её не в
    // тот домик. Тип при этом известен — он приходит отдельным полем.
    const [row] = await run([booking([stay({ roomId: "нет-такого" })])], []);
    expect(row.unit_id).toBeNull();
    expect(row.room_slug).toBe("glamping");
  });

  it("гость без имени подписан номером брони, а не пустотой", async () => {
    const [row] = await run([booking([stay()], { customer: null })]);
    expect(row.guest_name).toBe("Бронь 1042");
  });

  it("две комнаты в одной брони дают две строки", async () => {
    const rows = await run([
      booking([stay(), stay({ id: "s2", roomId: "9007199254834755" })]),
    ]);
    expect(rows.map((r) => r.unit_id)).toEqual(["glamping-01", "glamping-05"]);
  });

  it("молчание их API — пустая сетка, а не падение экрана", async () => {
    listRooms.mockResolvedValue({ ok: true, data: ROOMS });
    getBookingsInPeriod.mockResolvedValue({ ok: false, error: "timeout" });
    const { exelyOccupancy } = await import("@/lib/exely-occupancy");
    await expect(exelyOccupancy("2026-09-01", "2026-09-30")).resolves.toEqual([]);
  });

  it("гости и сумма переносятся как есть", async () => {
    const [row] = await run([booking([stay()])]);
    expect(row.adults).toBe(2);
    expect(row.kids).toBe(1);
    expect(row.total).toBe(3_000_000);
    expect(row.phone).toBe("+998901112233");
  });
});
