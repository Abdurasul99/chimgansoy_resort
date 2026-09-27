import { beforeEach, describe, expect, it } from "vitest";
import { addDish, attemptKey, cartCount, clearCart, getCart, removeDishes, setCartMode, setQty } from "../cart";

/**
 * Корзина в localStorage: переживает перезагрузку, не ломается на мусоре и
 * держит один ключ попытки, пока заказ не меняется.
 */
beforeEach(() => {
  localStorage.clear();
  clearCart();
  setCartMode(null);
});

describe("корзина ресторана", () => {
  it("добавление, количество и удаление", () => {
    addDish(3);
    addDish(3);
    addDish(5);
    expect(getCart().lines).toEqual([
      { dishId: 3, qty: 2 },
      { dishId: 5, qty: 1 },
    ]);
    setQty(3, 0);
    expect(getCart().lines).toEqual([{ dishId: 5, qty: 1 }]);
    setQty(5, 500);
    expect(getCart().lines[0].qty).toBe(50);
    removeDishes([5]);
    expect(cartCount(getCart())).toBe(0);
  });

  it("лежит в localStorage и читается после перезагрузки", () => {
    addDish(9);
    setCartMode("room");
    const raw = localStorage.getItem("cd_rest_cart_v1");
    expect(JSON.parse(raw!)).toMatchObject({ lines: [{ dishId: 9, qty: 1 }], mode: "room" });
  });

  it("мусор в хранилище даёт пустую корзину, а не ошибку", () => {
    localStorage.setItem("cd_rest_cart_v1", "{не json");
    expect(getCart().lines).toEqual([]);
    localStorage.setItem("cd_rest_cart_v1", JSON.stringify({ lines: [{ dishId: "x", qty: 2 }, { dishId: 4, qty: -1 }], mode: "space" }));
    expect(getCart()).toMatchObject({ lines: [], mode: null });
  });

  it("ключ попытки один, пока не поменялся заказ", () => {
    const a = attemptKey("sig-1");
    expect(attemptKey("sig-1")).toBe(a);
    expect(a).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    const b = attemptKey("sig-2");
    expect(b).not.toBe(a);
  });

  it("после заказа корзина пуста, способ получения запомнен", () => {
    addDish(1);
    setCartMode("delivery");
    attemptKey("x");
    clearCart();
    expect(getCart()).toEqual({ lines: [], mode: "delivery", attempt: null });
  });
});
