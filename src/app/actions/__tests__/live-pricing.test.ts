/**
 * The link nobody sees: does the SERVER charge what the form showed?
 *
 * The operator asked it plainly — "если поменять цену определённой услуги, то
 * на форме заявок поменяется?" The form is the easy half, and it is already
 * covered. The dangerous half is here: the action recomputes the total from
 * scratch, because a total posted by a browser is a suggestion. If it read the
 * build's constants while the form read the operator's edit, a guest would be
 * quoted one number and the administrator would receive another — and nobody
 * would notice until somebody argued about a bill.
 *
 * The overrides store is mocked, so no Blob and no network: this asserts the
 * wiring, not Vercel.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { EMPTY } from "@/lib/site-overrides";

const { readOverrides, deliverRequest } = vi.hoisted(() => ({
  readOverrides: vi.fn(),
  deliverRequest: vi.fn(async (_opts: unknown) => ({ telegramOk: true, emailOk: true })),
}));

vi.mock("@/lib/site-overrides", async (orig) => ({
  ...(await orig<typeof import("@/lib/site-overrides")>()),
  readOverrides,
}));

// The dispatcher is where the computed total ends up, so it is the probe.
vi.mock("@/lib/request-delivery", async (orig) => {
  const real = await orig<Record<string, unknown>>();
  return { ...real, deliverRequest };
});

import { submitTopchanRequest } from "@/app/actions/topchan";
import { submitPoolRequest } from "@/app/actions/pool";
import { topchanPricing, poolPricing } from "@/content/pricing";

/** A date that is always in the future and always a Monday — weekday band. */
function nextMonday(): string {
  const d = new Date(Date.now() + 5 * 3600_000);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/** The total the administrator was told, parsed back out of the message. */
function sentTotal(): number {
  const call = deliverRequest.mock.calls.at(-1)?.[0] as { record?: { total?: number } } | undefined;
  return call?.record?.total ?? -1;
}

beforeEach(() => {
  deliverRequest.mockClear();
  readOverrides.mockResolvedValue(EMPTY);
});

describe("топчан: сервер считает по цене из админки", () => {
  const base = { locale: "ru", name: "Тест", phone: "+998901234567", guests: "4" };

  it("без правок — по цене из кода", async () => {
    await submitTopchanRequest(form({ ...base, date: nextMonday() }));
    expect(sentTotal()).toBe(topchanPricing.rent.weekday);
  });

  it("оператор поднял цену — сервер считает по новой", async () => {
    readOverrides.mockResolvedValue({ ...EMPTY, prices: { "topchan.rent.weekday": 777_000 } });
    await submitTopchanRequest(form({ ...base, date: nextMonday() }));
    expect(sentTotal()).toBe(777_000);
  });

  it("четверо гостей — это один топчан, а не четыре билета", async () => {
    // The single most expensive misunderstanding on this form: the topchan is
    // priced per platform, up to eight guests.
    readOverrides.mockResolvedValue({ ...EMPTY, prices: { "topchan.rent.weekday": 100_000 } });
    await submitTopchanRequest(form({ ...base, guests: "4", date: nextMonday() }));
    expect(sentTotal()).toBe(100_000);
  });

  it("девять гостей — два топчана по новой цене", async () => {
    readOverrides.mockResolvedValue({ ...EMPTY, prices: { "topchan.rent.weekday": 100_000 } });
    await submitTopchanRequest(form({ ...base, guests: "9", date: nextMonday() }));
    expect(sentTotal()).toBe(200_000);
  });
});

describe("бассейн: сервер считает по цене из админки", () => {
  const base = { locale: "ru", name: "Тест", phone: "+998901234567" };

  it("без правок — по цене из кода", async () => {
    await submitPoolRequest(form({ ...base, date: nextMonday(), guests: "2", kids: "0", toddlers: "0" }));
    expect(sentTotal()).toBe(poolPricing.adult.weekday * 2);
  });

  it("оператор изменил взрослый билет — сервер считает по новому", async () => {
    readOverrides.mockResolvedValue({ ...EMPTY, prices: { "pool.adult.weekday": 111_000 } });
    await submitPoolRequest(form({ ...base, date: nextMonday(), guests: "3", kids: "0", toddlers: "0" }));
    expect(sentTotal()).toBe(333_000);
  });

  it("детский билет правится отдельно от взрослого", async () => {
    // guests — это ВЗРОСЛЫЕ, а не все гости: дети 5–15 и малыши считаются
    // отдельными полями. Легко прочитать наоборот — отсюда и этот тест.
    readOverrides.mockResolvedValue({ ...EMPTY, prices: { "pool.child.weekday": 7_000 } });
    await submitPoolRequest(form({ ...base, date: nextMonday(), guests: "3", kids: "2", toddlers: "0" }));
    expect(sentTotal()).toBe(poolPricing.adult.weekday * 3 + 14_000);
  });
});

describe("мусор в сторе не меняет счёт", () => {
  it("отрицательная цена игнорируется, считается кодовая", async () => {
    readOverrides.mockResolvedValue({ ...EMPTY, prices: { "topchan.rent.weekday": -1 } });
    await submitTopchanRequest(
      form({ locale: "ru", name: "Т", phone: "+998901234567", guests: "2", date: nextMonday() }),
    );
    expect(sentTotal()).toBe(topchanPricing.rent.weekday);
  });
});
