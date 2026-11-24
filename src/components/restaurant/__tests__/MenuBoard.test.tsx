import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Category, Dish } from "@/lib/restaurant/model";
import { MenuBoard } from "../MenuBoard";
// Данные меню лежат в .mjs — их же читает скрипт выгрузки в базу.
import { DISH_COUNT, MENU } from "../../../../scripts/restaurant-menu/menu-2026-11.mjs";

/**
 * Меню «доской» (24.11.2026) и меню из PDF ресторана.
 */
const cat = (id: number, ru: string, uz: string): Category => ({ id, title: { ru, uz, en: ru }, sort: id, visible: true });
let nextId = 1;
const dish = (categoryId: number, ru: string, uz: string, price: number, extra: Partial<Dish> = {}): Dish => ({
  id: nextId++,
  categoryId,
  title: { ru, uz, en: ru },
  description: { ru: "", uz: "", en: "" },
  portion: "",
  price,
  image: "",
  availability: "available",
  state: "published",
  sort: nextId,
  ...extra,
});

const categories = [cat(1, "Блюда из теста", "Xamirli taomlar"), cat(2, "Блюда на заказ", "Buyurtma bo'yicha taomlar")];
const dishes = [
  dish(1, "Тухум-барак", "Tuxum barak", 35_000, { portion: "0,5 порции" }),
  dish(1, "Тухум-барак", "Tuxum barak", 55_000, { portion: "1 порция" }),
  dish(1, "Шивит оши", "Shivit oshi", 70_000, { image: "/images/restaurant/dish/shivit-oshi.jpg" }),
  dish(2, "Праздничный плов", "Bayram oshi", 500_000, { portion: "1 кг", availability: "preorder" }),
  dish(2, "Вагури", "Vaguri", 800_000, { portion: "1 кг", availability: "preorder" }),
];

describe("меню доской", () => {
  it("две порции одного блюда — одна строка с двумя ценами, порции на языке страницы", () => {
    render(<MenuBoard locale="uz" categories={categories} dishes={dishes} />);
    expect(screen.getAllByText("Tuxum barak")).toHaveLength(1);
    expect(screen.getByText("35 000 / 55 000")).toBeInTheDocument();
    expect(screen.getByText("0,5 porsiya / 1 porsiya")).toBeInTheDocument();
  });

  it("раздел целиком «под заказ» — пометка один раз над разделом, не у каждой строки", () => {
    render(<MenuBoard locale="ru" categories={categories} dishes={dishes} />);
    const section = document.getElementById("c2")!;
    expect(within(section).getByText(/Готовим по предварительному заказу/)).toBeInTheDocument();
    expect(within(section).queryByText("Под заказ")).toBeNull();
  });

  it("на узбекской версии находит блюдо и по русскому названию", () => {
    render(<MenuBoard locale="uz" categories={categories} dishes={dishes} />);
    fireEvent.click(screen.getByRole("button", { name: "Taom qidirish" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "шивит" } });
    expect(screen.getByText("Shivit oshi")).toBeInTheDocument();
    expect(screen.queryByText("Tuxum barak")).toBeNull();
  });

  it("блюдо с фото открывается крупно и закрывается по Esc", () => {
    render(<MenuBoard locale="ru" categories={categories} dishes={dishes} />);
    fireEvent.click(screen.getByRole("button", { name: /Шивит оши/ }));
    const dialog = screen.getByRole("dialog", { name: "Шивит оши" });
    expect(within(dialog).getByText("70 000")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("меню из PDF (Sazanchik_Chimgan_A3_Print.pdf)", () => {
  type Row = [string, string, string, number, string?, string?];
  const sections = MENU as unknown as { title: string[]; dishes: Row[] }[];
  const all: Row[] = sections.flatMap((c) => c.dishes);

  it("19 разделов, 131 позиция листа (барак — по две порции)", () => {
    expect(MENU).toHaveLength(19);
    expect(DISH_COUNT).toBe(135);
    expect(all).toHaveLength(135);
  });

  it("у каждого блюда и раздела есть узбекское и английское название и цена", () => {
    for (const c of sections) expect(c.title.every(Boolean)).toBe(true);
    for (const [ru, uz, en, price] of all) {
      expect(uz, ru).toBeTruthy();
      expect(en, ru).toBeTruthy();
      expect(price, ru).toBeGreaterThan(0);
    }
  });

  it("цены — из текста PDF, а не со старой картинки под ним", () => {
    const price = (ru: string) => all.find((r) => r[0] === ru)?.[3];
    expect(price("Цезарь с креветками")).toBe(100_000); // на картинке 90 000
    expect(price("Мясное ассорти")).toBe(350_000); // на картинке 300 000
    expect(price("Шивит оши")).toBe(70_000);
    expect(price("Осётр")).toBe(500_000);
  });

  it("фото блюд лежат в public", () => {
    for (const r of all) if (r[5]) expect(existsSync(join(process.cwd(), "public", r[5])), r[5]).toBe(true);
  });
});
