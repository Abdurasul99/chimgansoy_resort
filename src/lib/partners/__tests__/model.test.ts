import { describe, expect, it } from "vitest";
import {
  CONTRACT_GAP_MS,
  VIEW_NOTIFY_GAP_MS,
  canRequestContract,
  isExpired,
  isOfferKey,
  makeOfferKey,
  money,
  normalizeOfferInput,
  parsePrice,
  shouldNotifyView,
  statusAfterContractRequest,
  statusAfterView,
} from "../model";

describe("ключ ссылки", () => {
  it("имя латиницей + 6 случайных символов, кириллица транслитерируется", () => {
    expect(makeOfferKey("Uzum Market")).toMatch(/^uzum-market-[a-zA-Z0-9]{6}$/);
    expect(makeOfferKey("Яндекс Go")).toMatch(/^yandeks-go-[a-zA-Z0-9]{6}$/);
    expect(makeOfferKey("«»!!!")).toMatch(/^p-[a-zA-Z0-9]{6}$/);
  });

  it("каждый раз новый — по имени чужую ссылку не угадать", () => {
    const keys = new Set(Array.from({ length: 200 }, () => makeOfferKey("Uzum")));
    expect(keys.size).toBe(200);
  });

  it("isOfferKey пропускает только выданное — без путей и мусора", () => {
    for (let i = 0; i < 50; i++) expect(isOfferKey(makeOfferKey("Visa Uzbekistan"))).toBe(true);
    expect(isOfferKey("uzum")).toBe(false);
    expect(isOfferKey("../etc/passwd-abcdef")).toBe(false);
    expect(isOfferKey("uzum-abc")).toBe(false);
    expect(isOfferKey("UZUM-abcdef")).toBe(false);
  });
});

describe("форма админки", () => {
  const base = { company: "Uzum", programs: ["payments", "evil"], packages: [] };

  it("без компании — ошибка", () => {
    expect(normalizeOfferInput({ company: "  " })).toEqual({ ok: false, error: "Укажите компанию." });
  });

  it("программы — только из списка на странице", () => {
    const r = normalizeOfferInput(base);
    expect(r.ok && r.value.programs).toEqual(["payments"]);
  });

  it("пакеты: пустые слоты пропускаются, цена с пробелами читается, пункты — по строкам", () => {
    const r = normalizeOfferInput({
      ...base,
      packages: [
        { title: "Зима · Оплата", price: "150 000 000", items: "- Кассы\n• Кешбэк 10 %\n\n", note: "" },
        { title: "", price: "", items: "", note: "" },
        { title: "Год", price: "", items: "Всё", note: "по запросу" },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.packages).toEqual([
      { title: "Зима · Оплата", price: 150_000_000, items: ["Кассы", "Кешбэк 10 %"], note: "" },
      { title: "Год", price: 0, items: ["Всё"], note: "по запросу" },
    ]);
  });

  it("пакет без названия или с ценой-словом — понятная ошибка с номером", () => {
    expect(normalizeOfferInput({ ...base, packages: [{ title: "", price: "100" }] })).toEqual({ ok: false, error: "Пакет 1: нужно название." });
    expect(normalizeOfferInput({ ...base, packages: [{ title: "A", price: "сто" }] })).toMatchObject({ ok: false });
  });

  it("не больше трёх пакетов; неизвестный статус — черновик; кривая дата — ошибка", () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ title: `P${i}`, price: "1" }));
    const r = normalizeOfferInput({ ...base, packages: many, status: "hacked" });
    expect(r.ok && r.value.packages.length).toBe(3);
    expect(r.ok && r.value.status).toBe("draft");
    expect(normalizeOfferInput({ ...base, validUntil: "31.12.2026" })).toMatchObject({ ok: false });
  });

  it("parsePrice", () => {
    expect(parsePrice("")).toBe(0);
    expect(parsePrice("1 500 000")).toBe(1_500_000);
    expect(parsePrice("1 500")).toBe(1500);
    expect(parsePrice("1.5")).toBeNull();
    expect(parsePrice("-5")).toBeNull();
  });
});

describe("статусы и частота уведомлений", () => {
  it("открытие двигает только «отправлено/черновик» → «открыто»", () => {
    expect(statusAfterView("sent")).toBe("opened");
    expect(statusAfterView("draft")).toBe("opened");
    expect(statusAfterView("negotiation")).toBe("negotiation");
    expect(statusAfterView("contract")).toBe("contract");
    expect(statusAfterView("declined")).toBe("declined");
  });

  it("запрос договора — переговоры, но договор не откатывает", () => {
    expect(statusAfterContractRequest("opened")).toBe("negotiation");
    expect(statusAfterContractRequest("contract")).toBe("contract");
  });

  it("«открыл» — первый раз всегда, дальше не чаще раза в 30 минут", () => {
    const now = Date.parse("2026-11-11T10:00:00Z");
    expect(shouldNotifyView(null, now)).toBe(true);
    expect(shouldNotifyView(new Date(now - VIEW_NOTIFY_GAP_MS + 1000).toISOString(), now)).toBe(false);
    expect(shouldNotifyView(new Date(now - VIEW_NOTIFY_GAP_MS).toISOString(), now)).toBe(true);
  });

  it("договор с одной ссылки — не чаще раза в 10 минут", () => {
    const now = Date.parse("2026-11-11T10:00:00Z");
    expect(canRequestContract(null, now)).toBe(true);
    expect(canRequestContract(new Date(now - 60_000).toISOString(), now)).toBe(false);
    expect(canRequestContract(new Date(now - CONTRACT_GAP_MS).toISOString(), now)).toBe(true);
  });

  it("срок: последний день ещё действует", () => {
    expect(isExpired({ validUntil: "2026-11-30" }, "2026-11-30")).toBe(false);
    expect(isExpired({ validUntil: "2026-11-30" }, "2026-12-01")).toBe(true);
    expect(isExpired({ validUntil: null }, "2030-01-01")).toBe(false);
  });

  it("money — неразрывные пробелы", () => {
    expect(money(150_000_000)).toBe("150 000 000");
  });
});
