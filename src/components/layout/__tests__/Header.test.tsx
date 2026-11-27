/**
 * Header: sticky top bar with logo, desktop nav, season+currency toggles,
 * language switcher, book CTA, and mobile burger that opens a full-screen overlay.
 *
 * We don't render the whole tree per test — just verify each interactive
 * element does what it should.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// usePathname is mocked globally to "/ru" in tests/setup.ts
import { Header } from "../Header";

describe("Header", () => {
  beforeEach(() => {
    // start every test at the top of the page
    window.scrollY = 0;
  });

  it("renders the brand logo image", () => {
    render(<Header locale="ru" />);
    const logos = screen.getAllByAltText(/CHIMGAN DARBAZA/);
    expect(logos.length).toBeGreaterThan(0);
  });

  it("renders main nav links (desktop)", () => {
    render(<Header locale="ru" />);
    // Desktop nav has multiple items — verify at least 3 anchor links
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(3);
  });

  it("language switcher shows all 3 locales (RU/UZ/EN)", () => {
    render(<Header locale="ru" />);
    expect(screen.getAllByText("RU").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("UZ").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("EN").length).toBeGreaterThanOrEqual(1);
  });

  it("кнопка брони ведёт в каталог домиков и есть на телефоне", () => {
    // Вела на /bron, где стоял движок Exely. Движок скрыли, страница осталась
    // почти пустой — единственная золотая кнопка уводила гостя в тупик.
    render(<Header locale="ru" />);
    const ctas = screen.getAllByRole("link").filter((l) => l.getAttribute("href")?.endsWith("/nomera"));
    expect(ctas.length).toBeGreaterThan(0);
    // Одна для десктопа, одна для телефона: на телефоне кнопка жила только
    // внутри бургер-меню, и гость не видел ни одной кнопки на экране.
    expect(ctas.some((l) => l.className.includes("lg:hidden"))).toBe(true);
  });

  it("mobile burger button toggles aria-expanded", async () => {
    const user = userEvent.setup();
    render(<Header locale="ru" />);
    // The mobile burger has aria-expanded
    const burger = screen.getAllByRole("button").find(
      (b) => b.getAttribute("aria-expanded") !== null,
    );
    expect(burger).toBeDefined();
    expect(burger).toHaveAttribute("aria-expanded", "false");

    await user.click(burger!);
    expect(burger).toHaveAttribute("aria-expanded", "true");
  });

  it("Escape закрывает мобильное меню", async () => {
    const user = userEvent.setup();
    render(<Header locale="ru" />);
    const burger = screen.getAllByRole("button").find((b) => b.getAttribute("aria-expanded") !== null)!;
    await user.click(burger);
    expect(burger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(burger).toHaveAttribute("aria-expanded", "false");
  });

  it("burger click locks body scroll (overflow: hidden)", async () => {
    const user = userEvent.setup();
    render(<Header locale="ru" />);
    const burger = screen.getAllByRole("button").find(
      (b) => b.getAttribute("aria-expanded") !== null,
    )!;

    await user.click(burger);
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(burger); // close
    expect(document.body.style.overflow).toBe("");
  });

  // The header reads scroll from the shared rAF scroll engine rather than
  // handling `scroll` events inline, so the class lands on the next frame.
  it("header gains glass-nav class after the 48px scroll threshold", async () => {
    const { container } = render(<Header locale="ru" />);
    const header = container.querySelector("header")!;
    expect(header.className).toContain("bg-transparent"); // initial

    window.scrollY = 100;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => expect(header.className).toContain("glass-nav"));
  });

  it("header hides on scroll down past the hero and returns on scroll up", async () => {
    const { container } = render(<Header locale="ru" />);
    const header = container.querySelector("header")! as HTMLElement;

    window.scrollY = 1200;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(header.style.translate).toBe("0 -100%"));

    window.scrollY = 900;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(header.style.translate).toBe("0 0"));
  });

  describe("кнопка «Новый год» (27.11.2026)", () => {
    const nyLinks = (container: HTMLElement) => [...container.querySelectorAll("[data-new-year-link]")];

    it("ведёт на /novyi-god: надпись и иконка на компьютере, иконка и строка меню на телефоне", () => {
      const now = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-12-20T07:00:00Z"));
      const { container } = render(<Header locale="uz" newYear />);
      const links = nyLinks(container);
      expect(links.map((a) => a.getAttribute("data-new-year-link")).sort()).toEqual(["drawer", "icon", "icon", "pill"]);
      expect(links.every((a) => a.getAttribute("href") === "/uz/novyi-god")).toBe(true);
      // Иконка без текста — имя для экранного диктора из aria-label.
      const icon = links.find((a) => a.getAttribute("data-new-year-link") === "icon")!;
      expect(icon.getAttribute("aria-label")).toMatch(/Yangi yil/);
      now.mockRestore();
    });

    it("без разрешения сервера кнопки нет", () => {
      const { container } = render(<Header locale="ru" />);
      expect(nyLinks(container)).toHaveLength(0);
    });

    it("после 10 января браузер прячет кнопку, даже если страница собрана раньше", () => {
      const now = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2027-01-11T06:00:00Z"));
      const { container } = render(<Header locale="ru" newYear />);
      expect(nyLinks(container)).toHaveLength(0);
      now.mockRestore();
    });

    it("с кнопкой промежутки меню уже — иначе с рестораном меню переносится", () => {
      const now = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-12-20T07:00:00Z"));
      const { container } = render(<Header locale="ru" newYear />);
      const nav = container.querySelector('nav[aria-label="Main navigation"]')!;
      expect(nav.className).toContain("gap-4");
      expect(nav.className).not.toContain("gap-8");
      now.mockRestore();
    });
  });
});
