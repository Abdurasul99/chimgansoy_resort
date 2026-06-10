/**
 * Header: sticky top bar with logo, desktop nav, season+currency toggles,
 * language switcher, book CTA, and mobile burger that opens a full-screen overlay.
 *
 * We don't render the whole tree per test — just verify each interactive
 * element does what it should.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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

  it("renders 'book now' CTA link to /bron", () => {
    render(<Header locale="ru" />);
    const ctas = screen.getAllByRole("link").filter((l) =>
      l.getAttribute("href")?.endsWith("/bron"),
    );
    expect(ctas.length).toBeGreaterThan(0);
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

  it("header gains glass-nav class after the 48px scroll threshold", () => {
    const { container } = render(<Header locale="ru" />);
    const header = container.querySelector("header")!;
    expect(header.className).toContain("bg-transparent"); // initial

    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(header.className).toContain("glass-nav");
  });
});
