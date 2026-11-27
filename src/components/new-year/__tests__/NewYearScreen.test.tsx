/**
 * Новогодний экран рисуется без ошибок в среде без холста и ResizeObserver
 * (как старый браузер) и отдаёт нужные ссылки: бронь — в каталог домиков,
 * «Позвонить» — на номер ресторана, карточки — на страницы домиков и тюбинга.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewYearScene } from "../NewYearScene";
import { StayCards } from "../StayCards";
import { WishSky } from "../WishSky";
import { NEW_YEAR_READY_EVENT } from "@/content/new-year";

describe("новогодний экран", () => {
  it("первый экран: заголовок, отсчёт, бронь и звонок в ресторан", () => {
    render(<NewYearScene locale="uz" globeSrc="/images/x.jpg" bookHref="/uz/nomera" phone="+998 50 154 00 44" />);
    expect(screen.getByRole("heading", { level: 1, name: "Chimyon tog'larida Yangi yil" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bayramga bron qilish" })).toHaveAttribute("href", "/uz/nomera");
    expect(screen.getByRole("link", { name: /Qo'ng'iroq qilish/ })).toHaveAttribute("href", "tel:+998501540044");
    expect(screen.getByRole("button", { name: /Sharni silkitish/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gulchambar chiroqlarini almashtirish" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Qorli shar/ })).toBeInTheDocument();
  });

  it("сообщает шапке, что экран на месте (занавес перехода поднимается)", async () => {
    let ready = false;
    const on = () => (ready = true);
    window.addEventListener(NEW_YEAR_READY_EVENT, on);
    render(<NewYearScene locale="ru" globeSrc="/images/x.jpg" bookHref="/ru/nomera" phone="+998 50 154 00 44" />);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 20));
    window.removeEventListener(NEW_YEAR_READY_EVENT, on);
    expect(ready).toBe(true);
  });

  it("кнопки шара и гирлянды не падают без холста", () => {
    render(<NewYearScene locale="ru" globeSrc="/images/x.jpg" bookHref="/ru/nomera" phone="+998 50 154 00 44" />);
    fireEvent.click(screen.getByRole("button", { name: /Встряхнуть шар/ }));
    fireEvent.click(screen.getByRole("button", { name: "Сменить огни гирлянды" }));
  });

  it("карточки ведут на страницы домиков и тюбинга", () => {
    render(
      <StayCards
        title="Где встретить праздник"
        lead="…"
        more="Подробнее"
        cards={[
          { href: "/ru/nomera/cottage", img: { src: "/a.jpg" }, position: "center", name: "Шале", text: "…" },
          { href: "/ru/nomera/glamping", img: { src: "/b.jpg" }, position: "center", name: "Глэмпинг A-frame", text: "…" },
          { href: "/ru/tubing", img: { src: "/c.jpg" }, position: "center", name: "Тюбинг в огнях", text: "…" },
        ]}
      />,
    );
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      "/ru/nomera/cottage",
      "/ru/nomera/glamping",
      "/ru/tubing",
    ]);
  });

  it("салют: кнопка для клавиатуры и бронь на праздники", () => {
    render(<WishSky locale="en" bookHref="/en/nomera" />);
    expect(screen.getByRole("heading", { level: 2, name: "Make a wish" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Launch fireworks/ }));
    expect(screen.getByRole("link", { name: "Book for the holidays" })).toHaveAttribute("href", "/en/nomera");
  });
});
