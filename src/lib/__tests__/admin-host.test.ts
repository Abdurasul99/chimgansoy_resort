import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { adminHost, isAdminHost, requestHost } from "@/lib/admin-host";

/**
 * Moving the panel to its own domain is a two-sided change — code and DNS — and
 * the dangerous half is the moment between them. These tests pin the property
 * that makes the deploy safe: with ADMIN_HOST unset, nothing changes at all.
 */

const original = process.env.ADMIN_HOST;

beforeEach(() => {
  delete process.env.ADMIN_HOST;
});

afterEach(() => {
  if (original === undefined) delete process.env.ADMIN_HOST;
  else process.env.ADMIN_HOST = original;
});

describe("пока переменная не задана — ничего не меняется", () => {
  it("панель работает на любом хосте", () => {
    expect(adminHost()).toBeNull();
    for (const host of ["chimgandarbaza.uz", "chimgansoy.com", "localhost:3000", null]) {
      expect(isAdminHost(host), String(host)).toBe(true);
    }
  });
});

describe("когда переменная задана", () => {
  beforeEach(() => {
    process.env.ADMIN_HOST = "chimgansoy.com";
  });

  it("панель признаёт свой хост и www к нему", () => {
    expect(isAdminHost("chimgansoy.com")).toBe(true);
    expect(isAdminHost("www.chimgansoy.com")).toBe(true);
  });

  it("и не признаёт публичный сайт", () => {
    expect(isAdminHost("chimgandarbaza.uz")).toBe(false);
    expect(isAdminHost("www.chimgandarbaza.uz")).toBe(false);
  });

  it("не путается в регистре и порте", () => {
    // Заголовок Host приходит как угодно: браузеры не нормализуют регистр,
    // а локальная разработка добавляет порт.
    expect(isAdminHost("CHIMGANSOY.com")).toBe(true);
    expect(isAdminHost("chimgansoy.com:443")).toBe(true);
  });

  it("похожий, но чужой хост не проходит", () => {
    // Иначе кто угодно, поднявший chimgansoy.com.evil.net, оказался бы «своим».
    expect(isAdminHost("chimgansoy.com.evil.net")).toBe(false);
    expect(isAdminHost("notchimgansoy.com")).toBe(false);
    expect(isAdminHost("admin.chimgansoy.com")).toBe(false);
  });

  it("пустой и отсутствующий Host — не админ-хост", () => {
    expect(isAdminHost(null)).toBe(false);
    expect(isAdminHost("")).toBe(false);
  });
});

describe("значение переменной терпит человеческий ввод", () => {
  it("схема и слэш отбрасываются", () => {
    for (const raw of [
      "chimgansoy.com",
      "https://chimgansoy.com",
      "https://chimgansoy.com/",
      "http://chimgansoy.com/admin",
      "  CHIMGANSOY.COM  ",
    ]) {
      process.env.ADMIN_HOST = raw;
      expect(adminHost(), raw).toBe("chimgansoy.com");
    }
  });
});

describe("requestHost", () => {
  it("приводит к сравнимому виду", () => {
    expect(requestHost("Example.COM:8080")).toBe("example.com");
    expect(requestHost(null)).toBe("");
  });
});
