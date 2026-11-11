import { beforeAll, describe, expect, it } from "vitest";

/**
 * Хранилище партнёрских предложений на настоящем Postgres.
 *
 *   PARTNERS_DB_TEST=postgres://…/тестовая_база npx vitest run tests/integration/partners-db.test.ts
 *
 * Только на выброшенной базе — НИКОГДА на рабочей: тест создаёт и удаляет
 * записи. Без переменной пропускается.
 */
const URL_ = process.env.PARTNERS_DB_TEST;

describe.skipIf(!URL_)("база партнёрских предложений (Postgres)", { timeout: 90_000 }, () => {
  let store: typeof import("@/lib/partners/store");
  let model: typeof import("@/lib/partners/model");

  beforeAll(async () => {
    process.env.DATABASE_URL = URL_;
    store = await import("@/lib/partners/store");
    model = await import("@/lib/partners/model");
  });

  const input = () => {
    const r = model.normalizeOfferInput({
      company: "Uzum",
      contact: "Алишер, маркетинг",
      lead: "По итогам встречи",
      programs: ["payments", "zones"],
      packages: [{ title: "Зима", price: "150 000 000", items: "Кассы\nКешбэк", note: "без монтажа" }],
      validUntil: "2026-12-31",
      status: "sent",
    });
    if (!r.ok) throw new Error(r.error);
    return r.value;
  };

  it("создаёт таблицу сам, сохраняет и читает предложение целиком", async () => {
    const key = model.makeOfferKey("Uzum");
    const id = await store.createOffer(key, input());
    const offer = await store.getOffer(id);
    expect(offer).toMatchObject({
      key,
      company: "Uzum",
      programs: ["payments", "zones"],
      packages: [{ title: "Зима", price: 150_000_000, items: ["Кассы", "Кешбэк"], note: "без монтажа" }],
      validUntil: "2026-12-31",
      status: "sent",
      revoked: false,
      views: 0,
    });
    expect(await store.getOfferByKey(key)).toMatchObject({ id });
  });

  it("открытия считаются, статус «отправлено» → «открыто», переговоры не откатываются", async () => {
    const key = model.makeOfferKey("Visa");
    const id = await store.createOffer(key, input());
    const v1 = await store.recordView(key, model.statusAfterView);
    expect(v1?.views).toBe(1);
    expect(v1?.lastNotifiedAt).toBeNull();
    await store.markNotified(id);
    await store.recordView(key, model.statusAfterView);
    let o = await store.getOffer(id);
    expect(o).toMatchObject({ views: 2, status: "opened" });
    expect(o?.firstViewedAt).toBeTruthy();
    expect(o?.lastNotifiedAt).toBeTruthy();

    await store.markContractRequested(id, model.statusAfterContractRequest(o!.status));
    await store.recordView(key, model.statusAfterView);
    o = await store.getOffer(id);
    expect(o).toMatchObject({ views: 3, status: "negotiation" });
    expect(o?.contractRequestedAt).toBeTruthy();
  });

  it("отозванная ссылка не открывается и не считает открытия; новый ключ отменяет старый", async () => {
    const key = model.makeOfferKey("Beeline");
    const id = await store.createOffer(key, input());
    await store.setOfferRevoked(id, true);
    expect(await store.recordView(key, model.statusAfterView)).toBeNull();
    expect((await store.getOffer(id))?.views).toBe(0);

    await store.setOfferRevoked(id, false);
    const fresh = model.makeOfferKey("Beeline");
    await store.rekeyOffer(id, fresh);
    expect(await store.getOfferByKey(key)).toBeNull();
    expect((await store.getOfferByKey(fresh))?.id).toBe(id);
  });

  it("логотип: возвращает прежний файл для удаления; удаление записи — тоже", async () => {
    const id = await store.createOffer(model.makeOfferKey("Click"), input());
    expect(await store.setOfferLogo(id, "https://x/a.webp")).toBe("");
    expect(await store.setOfferLogo(id, "https://x/b.webp")).toBe("https://x/a.webp");
    expect(await store.deleteOffer(id)).toBe("https://x/b.webp");
    expect(await store.getOffer(id)).toBeNull();
  });

  it("правка сохраняет всё, а чужой статус база не примет", async () => {
    const id = await store.createOffer(model.makeOfferKey("Ucell"), input());
    await store.updateOffer(id, { ...input(), company: "Ucell", packages: [], validUntil: null, status: "contract" });
    expect(await store.getOffer(id)).toMatchObject({ company: "Ucell", packages: [], validUntil: null, status: "contract" });
    await expect(store.updateOffer(id, { ...input(), status: "hacked" as never })).rejects.toThrow();
  });

  it("одинаковый ключ дважды не записать", async () => {
    const key = model.makeOfferKey("Payme");
    await store.createOffer(key, input());
    await expect(store.createOffer(key, input())).rejects.toMatchObject({ code: "23505" });
  });

  it("список — свежие сверху", async () => {
    const list = await store.listOffers();
    expect(list.length).toBeGreaterThanOrEqual(5);
    const times = list.map((o) => o.updatedAt);
    expect([...times].sort().reverse()).toEqual(times);
  });
});
