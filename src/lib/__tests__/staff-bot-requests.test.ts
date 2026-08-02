import { describe, expect, it, vi, beforeEach } from "vitest";
import type { StoredRequest } from "../requests-store";

/**
 * The request log is rendered into Telegram HTML, which is unforgiving: an
 * unbalanced tag or an unescaped "&" in a guest's name makes sendMessage fail
 * silently and the operator sees nothing. These tests pin the shape of that
 * message, since a broken render is invisible until someone asks for history.
 */

const rows: StoredRequest[] = [
  {
    id: "a",
    service: "pool",
    date: "2026-08-09",
    createdAt: "2026-08-02T10:00:00+05:00",
    name: "Алишер",
    phone: "+998901234567",
    adults: 3,
    kids: 2,
    toddlers: 1,
    extras: ["полотенца ×2", "Бунгало до 4 чел."],
    total: 1_000_000,
    tariff: "Пт–Вс",
    locale: "ru",
  },
  {
    id: "b",
    service: "pool",
    date: "2026-08-09",
    createdAt: "2026-08-02T11:00:00+05:00",
    // Ampersand and angle brackets must survive as entities, not raw markup.
    name: "Ben & <Co>",
    phone: "+998977654321",
    adults: 2,
    kids: 0,
    toddlers: 0,
    extras: [],
    total: 400_000,
    tariff: "Пт–Вс",
    message: "приедем к 10",
    locale: "en",
  },
];

const store = vi.hoisted(() => ({
  storeConfigured: vi.fn(() => true),
  requestsByDate: vi.fn(),
  recentRequests: vi.fn(),
}));

vi.mock("../requests-store", () => store);
vi.mock("../staff-ai", () => ({ answerGuestQuestion: vi.fn() }));
vi.mock("../exely", () => ({ checkAvailability: vi.fn() }));
vi.mock("../telegram", async () => {
  const actual = await vi.importActual<typeof import("../telegram")>("../telegram");
  return { ...actual, sendMessage: vi.fn(), editMessageText: vi.fn(), sendPhoto: vi.fn() };
});

const { renderRequests } = await import("../staff-bot");

/** Every <tag> must have a matching </tag>, or Telegram rejects the message. */
function tagsBalanced(html: string): boolean {
  const stack: string[] = [];
  for (const [, closing, tag] of html.matchAll(/<(\/?)(\w+)[^>]*>/g)) {
    if (closing) {
      if (stack.pop() !== tag) return false;
    } else {
      stack.push(tag);
    }
  }
  return stack.length === 0;
}

beforeEach(() => {
  vi.clearAllMocks();
  store.storeConfigured.mockReturnValue(true);
  store.requestsByDate.mockResolvedValue(rows);
  store.recentRequests.mockResolvedValue(rows);
});

describe("renderRequests", () => {
  it("counts requests, guests and money for a date", async () => {
    const view = await renderRequests("2026-08-09");
    expect(store.requestsByDate).toHaveBeenCalledWith("2026-08-09");
    // 2 requests · (3+2+1) + (2) = 8 guests · 1 400 000 сум
    expect(view.text).toContain("2 заявк");
    expect(view.text).toContain("8 гост");
    expect(view.text).toContain("1 400 000 сум");
  });

  it("names every guest with a dialable phone", async () => {
    const view = await renderRequests("2026-08-09");
    expect(view.text).toContain("Алишер");
    expect(view.text).toContain("+998901234567");
    expect(view.text).toContain("+998977654321");
    // A bare international number is what makes Telegram offer to call — a
    // tel: link is rejected outright, so the number must not be wrapped.
    expect(view.text).not.toMatch(/<a href="tel:/);
  });

  it("escapes guest input and stays valid Telegram HTML", async () => {
    const view = await renderRequests("2026-08-09");
    expect(view.text).toContain("Ben &amp; &lt;Co&gt;");
    expect(view.text).not.toContain("<Co>");
    expect(tagsBalanced(view.text)).toBe(true);
  });

  it("stays under Telegram's 4096-character limit", async () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ ...rows[0], id: `x${i}` }));
    store.requestsByDate.mockResolvedValue(many);
    const view = await renderRequests("2026-08-09");
    expect(view.text.length).toBeLessThan(4096);
    expect(view.text).toContain("список обрезан");
    // Unbalanced HTML makes Telegram reject the whole message, so the trim has
    // to fall on a block boundary rather than mid-tag.
    expect(tagsBalanced(view.text)).toBe(true);
    // The count in the header still reflects the real total, not what fitted.
    expect(view.text).toContain("200 заявк");
  });

  it("falls back to recent requests without a date", async () => {
    const view = await renderRequests();
    expect(store.recentRequests).toHaveBeenCalled();
    expect(view.text).toContain("Последние заявки");
  });

  it("rejects a malformed date instead of querying", async () => {
    const view = await renderRequests("9 августа");
    expect(store.requestsByDate).not.toHaveBeenCalled();
    expect(view.text).toContain("/zayavki");
  });

  it("labels each service and never prints a price nobody has quoted", async () => {
    store.requestsByDate.mockResolvedValue([
      rows[0],
      {
        id: "c",
        service: "booking",
        date: "2026-08-09",
        createdAt: "2026-08-02T12:00:00+05:00",
        name: "Гость",
        phone: "+998901112233",
        adults: 2,
        kids: 0,
        toddlers: 0,
        extras: [],
        total: 0, // the PMS quotes accommodation later
        tariff: "",
        locale: "ru",
        checkin: "2026-08-09",
        checkout: "2026-08-11",
        room: "A-frame",
      } satisfies StoredRequest,
    ]);
    const view = await renderRequests("2026-08-09");
    expect(view.text).toContain("🏊");
    expect(view.text).toContain("🏡");
    expect(view.text).toContain("2026-08-09 → 2026-08-11");
    expect(view.text).toContain("A-frame");
    // A price next to the accommodation guest would read as a quote nobody gave.
    const bookingBlock = view.text.slice(view.text.indexOf("🏡"));
    expect(bookingBlock).not.toContain("сум");
    expect(tagsBalanced(view.text)).toBe(true);
  });

  it("says an empty date is empty, not that history is off", async () => {
    store.requestsByDate.mockResolvedValue([]);
    const view = await renderRequests("2026-08-09");
    expect(view.text).toContain("заявок нет");
  });

  it("admits when nothing is being archived at all", async () => {
    store.storeConfigured.mockReturnValue(false);
    const view = await renderRequests("2026-08-09");
    expect(view.text).toContain("не подключено");
    expect(store.requestsByDate).not.toHaveBeenCalled();
  });
});
