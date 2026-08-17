import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Clock } from "@/components/ui/Clock";

/**
 * Подсветка времени в тексте. Оператор попросил, чтобы время было видно везде,
 * и подсветка сделана в отрисовке, а не в контенте: сами строки остаются
 * чистым текстом — они же уходят в разметку для Google и в брифинги ИИ.
 */
const marks = () => screen.getAllByText((_, el) => el?.tagName === "STRONG").map((el) => el.textContent);

describe("подсветка времени", () => {
  it("выделяет диапазон целиком, а не по половинке", () => {
    render(<Clock text="Бассейн работает 10:00–20:00 ежедневно" />);
    expect(marks()).toEqual(["10:00–20:00"]);
  });

  it("выделяет одиночное время", () => {
    render(<Clock text="Заезд с 15:00" />);
    expect(marks()).toEqual(["15:00"]);
  });

  it("берёт все времена в строке, а не только первое", () => {
    render(<Clock text="Топчан 10:00–18:00, бассейн 10:00–20:00, горка 10:00–20:00" />);
    expect(marks()).toHaveLength(3);
  });

  it("понимает словесные диапазоны — «с 08:00 до 11:00»", () => {
    render(<Clock text="Завтрак с 08:00 до 11:00" />);
    // Один жирный кусок, а не два: разрыв посередине читается как две разные
    // цифры, а это один интервал.
    expect(marks()).toEqual(["08:00 до 11:00"]);
  });

  it("текст без времени остаётся без единого <strong>", () => {
    render(<Clock text="Парковка для посетителей бесплатная" />);
    expect(screen.queryAllByText((_, el) => el?.tagName === "STRONG")).toHaveLength(0);
  });

  it("не теряет ни одного символа исходного текста", () => {
    // Подсветка не должна ничего съедать: сравниваем видимый текст с исходным.
    const source = "Горка 10:00–20:00; после 20:00 катание запрещено";
    const { container } = render(<Clock text={source} />);
    expect(container.textContent).toBe(source);
  });
});
