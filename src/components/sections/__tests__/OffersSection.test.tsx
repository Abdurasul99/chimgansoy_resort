/**
 * Блок акций на границе сроков — рендер с подменённым часами.
 *
 * Поймал бы регрессию, которую нашла перепроверка: 29–30.09 «2+1» снята, и
 * «Всё включено» становилась ведущей карточкой, а ведущий шаблон не умел
 * расписание питания — оно пропадало на два дня.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OffersSection } from "../OffersSection";

const at = (iso: string) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  // Полдень по Ташкенту (UTC+5).
  vi.setSystemTime(new Date(`${iso}T07:00:00Z`));
};

afterEach(() => {
  vi.useRealTimers();
});

describe("блок акций по датам", () => {
  it("28.09: «2+1» ещё видна — это последний день заезда", () => {
    at("2026-09-28");
    render(<OffersSection locale="ru" />);
    expect(screen.getByText("«2+1» — третья ночь в подарок")).toBeInTheDocument();
  });

  it("29.09: «2+1» снята, а у «Всё включено» расписание питания на месте", () => {
    at("2026-09-29");
    render(<OffersSection locale="ru" />);
    expect(screen.queryByText("«2+1» — третья ночь в подарок")).toBeNull();
    expect(screen.getByText("Тариф «Всё включено»")).toBeInTheDocument();
    expect(screen.getByText("Как это работает")).toBeInTheDocument();
    expect(screen.getByText("в день выезда — завтрак")).toBeInTheDocument();
  });

  it("01.10: сентябрьских акций нет", () => {
    at("2026-10-01");
    render(<OffersSection locale="ru" />);
    expect(screen.queryByText("«2+1» — третья ночь в подарок")).toBeNull();
    expect(screen.queryByText("Тариф «Всё включено»")).toBeNull();
  });
});
