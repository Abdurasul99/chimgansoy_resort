/**
 * Кнопка «Новый год» на самом новогоднем экране — «Обычный сайт»: обратно
 * туда, откуда пришли на праздник, а без этого — на главную (27.11.2026:
 * владелец не нашёл, как вернуться с праздничного экрана).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const nav = vi.hoisted(() => ({ pathname: "/ru", push: vi.fn(), prefetch: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, prefetch: nav.prefetch, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Без занавеса: переход сразу, его и проверяем.
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => true,
}));

import { NewYearLink } from "../NewYearLink";

describe("кнопка «Новый год» ↔ «Обычный сайт»", () => {
  beforeEach(() => {
    sessionStorage.clear();
    // Выбор «Обычный сайт» из прошлого теста не должен подсказывать следующему.
    document.cookie = "cd-theme=; path=/; max-age=0";
    nav.push.mockClear();
  });
  afterEach(() => {
    nav.pathname = "/ru";
    vi.restoreAllMocks();
  });

  it("на праздничном экране кнопка ведёт обратно на обычный сайт", () => {
    nav.pathname = "/ru/novyi-god";
    const { container } = render(
      <>
        <NewYearLink locale="ru" variant="pill" />
        <NewYearLink locale="ru" variant="icon" />
        <NewYearLink locale="ru" variant="drawer" />
      </>,
    );
    const links = [...container.querySelectorAll("[data-new-year-link]")];
    expect(links).toHaveLength(3);
    expect(links.every((a) => a.getAttribute("href") === "/ru" && a.hasAttribute("data-new-year-back"))).toBe(true);
    expect(screen.getAllByRole("link", { name: "Вернуться на обычный сайт" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Обычный сайт")).toBeInTheDocument();
  });

  it("возвращает туда, откуда ушли на праздник — даже после смены языка", () => {
    nav.pathname = "/ru/nomera/cottage";
    const first = render(<NewYearLink locale="ru" variant="pill" />);
    fireEvent.click(screen.getByRole("link", { name: /Зима в горах Чимгана/ }));
    expect(nav.push).toHaveBeenLastCalledWith("/ru/novyi-god");
    first.unmount();

    nav.pathname = "/uz/novyi-god"; // на празднике переключили язык
    render(<NewYearLink locale="uz" variant="pill" />);
    fireEvent.click(screen.getByRole("link", { name: "Oddiy saytga qaytish" }));
    expect(nav.push).toHaveBeenLastCalledWith("/uz/nomera/cottage");
  });

  it("пришли по прямой ссылке — обратно на главную", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-28T12:00:00+05:00")); // до сезона
    nav.pathname = "/en/novyi-god";
    render(<NewYearLink locale="en" variant="icon" />);
    fireEvent.click(screen.getByRole("link", { name: "Back to the regular site" }));
    expect(nav.push).toHaveBeenLastCalledWith("/en");
  });

  it("зимой «Обычный сайт» запоминает выбор и грузит главную заново — не из кэша роутера", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-12-10T12:00:00+05:00"));
    const assign = vi.fn();
    const realLocation = window.location;
    Object.defineProperty(window, "location", { value: { ...realLocation, protocol: "https:", assign }, configurable: true });
    try {
      nav.pathname = "/ru/novyi-god";
      render(<NewYearLink locale="ru" variant="pill" />);
      fireEvent.click(screen.getByRole("link", { name: "Вернуться на обычный сайт" }));
      expect(document.cookie).toContain("cd-theme=regular");
      expect(assign).toHaveBeenCalledWith("/ru");
      expect(nav.push).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "location", { value: realLocation, configurable: true });
      document.cookie = "cd-theme=; path=/; max-age=0";
    }
  });

  it("Ctrl+клик — обычная ссылка, без перехвата", () => {
    nav.pathname = "/ru/novyi-god";
    render(<NewYearLink locale="ru" variant="pill" />);
    fireEvent.click(screen.getByRole("link", { name: "Вернуться на обычный сайт" }), { ctrlKey: true });
    expect(nav.push).not.toHaveBeenCalled();
  });
});
