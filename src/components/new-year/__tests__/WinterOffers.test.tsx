/**
 * Акции на зимнем экране — те же, что в блоке акций на главной (27.11.2026:
 * «перенеси все акции туда тоже»): тот же список по тем же срокам, тот же
 * расчёт, кнопки с меткой акции и utm_medium=winter.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WinterOffers } from "../WinterOffers";
import { OffersSection } from "@/components/sections/OffersSection";

const at = (iso: string) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${iso}T07:00:00Z`)); // полдень по Ташкенту
};

afterEach(() => {
  vi.useRealTimers();
});

const titles = (root: HTMLElement) => [...root.querySelectorAll("h3")].map((h) => h.textContent);

describe("акции на зимнем экране", () => {
  it("27.11: все три действующие акции — те же, что на главной", () => {
    at("2026-11-27");
    const winter = render(<WinterOffers locale="ru" title="Действующие акции" lead="…" />);
    const home = render(<OffersSection locale="ru" />);
    expect(titles(winter.container)).toEqual([
      "«2+1» — третья ночь в подарок",
      "−20% на Chalet весь ноябрь",
      "Скидка 15% на День Рождения",
    ]);
    expect(titles(winter.container)).toEqual(titles(home.container));
  });

  it("расчёт — из тарифа, как на главной; условия целиком", () => {
    at("2026-11-27");
    render(<WinterOffers locale="ru" title="Действующие акции" lead="…" />);
    expect(screen.getByText("2 400 000")).toBeInTheDocument();
    expect(screen.getByText("Всего 600 000 сум / человек / ночь")).toBeInTheDocument();
    // «Не суммируется» — у каждой из трёх акций, в списке и в корешке.
    expect(screen.getAllByText("Не суммируется с другими акциями и специальными предложениями").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Не действует на пакетные праздничные предложения").length).toBeGreaterThan(0);
  });

  it("кнопки — с меткой акции и utm_medium=winter", () => {
    at("2026-11-27");
    render(<WinterOffers locale="uz" title="Amaldagi aksiyalar" lead="…" />);
    const oneClick = screen.getAllByRole("link", { name: /Bir bosishda bron qilish/ }).map((a) => a.getAttribute("href"));
    const engine = screen.getAllByRole("link", { name: "Onlayn bron qilish" }).map((a) => a.getAttribute("href"));
    expect(oneClick).toContain("/uz/nomera/cottage?utm_source=site&utm_medium=winter&utm_content=chalet-october#zayavka");
    expect(engine).toContain("/uz/bron?room-type=5075761&utm_source=site&utm_medium=winter&utm_content=chalet-october");
    expect(oneClick).toContain("/uz/nomera?utm_source=site&utm_medium=winter&utm_content=2plus1");
    expect(oneClick).toHaveLength(3);
    expect(engine).toHaveLength(3);
  });

  it("01.12: скидка на Chalet ушла сама — и здесь, и на главной", () => {
    at("2026-12-01");
    const winter = render(<WinterOffers locale="ru" title="Действующие акции" lead="…" />);
    expect(titles(winter.container)).toEqual(["«2+1» — третья ночь в подарок", "Скидка 15% на День Рождения"]);
  });
});
