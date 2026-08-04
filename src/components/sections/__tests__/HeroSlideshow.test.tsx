/**
 * HeroSlideshow: rotates on desktop, stands still everywhere else.
 *
 * The static case is the one the operator asked for (2026-08-04, "чтобы
 * постоянно картинки не менялись") and it is the case a phone gets, so it is
 * tested for what actually costs money if it regresses: exactly ONE slide in
 * the DOM. A background image is fetched as soon as it is painted, opacity:0
 * or not, so three slides means three hero photos downloaded on a phone that
 * will only ever show the first.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { HeroSlideshow } from "../HeroSlideshow";

// Indicator dots live in an aria-hidden container ({hidden:true} required to query)
const getDotButtons = () => screen.getAllByRole("button", { hidden: true });

/** Slide layers are plain divs; count them by the inline background-image. */
const countSlides = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("div[style]")).filter((el) =>
    el.style.backgroundImage.includes("/images/resort/"),
  ).length;

/**
 * happy-dom's matchMedia answers `false` to everything, which would make every
 * test run the mobile path. This drives both queries the component listens to.
 */
function mockMedia({ wide, calm = false }: { wide: boolean; calm?: boolean }) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? calm : wide,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  );
}

describe("HeroSlideshow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.removeAttribute("data-season");
    window.localStorage.clear();
    mockMedia({ wide: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("desktop", () => {
    it("renders all 3 slides and 3 indicator dots", () => {
      const { container } = render(<HeroSlideshow />);
      expect(countSlides(container)).toBe(3);
      expect(getDotButtons()).toHaveLength(3);
    });

    it("clicking a dot switches to that slide", () => {
      render(<HeroSlideshow />);
      const buttons = getDotButtons();
      // Slide 0 active initially — first dot has w-8 class
      expect(buttons[0].querySelector(".w-8")).toBeInTheDocument();

      fireEvent.click(buttons[2]);
      expect(buttons[2].querySelector(".w-8")).toBeInTheDocument();
      expect(buttons[0].querySelector(".w-8")).not.toBeInTheDocument();
    });

    it("auto-advances slides on the 5.5s interval", () => {
      render(<HeroSlideshow />);
      expect(getDotButtons()[0].querySelector(".w-8")).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(5_600));
      expect(getDotButtons()[1].querySelector(".w-8")).toBeInTheDocument();
    });
  });

  describe("phone", () => {
    beforeEach(() => mockMedia({ wide: false }));

    it("renders a single slide and no dots", () => {
      const { container } = render(<HeroSlideshow />);
      expect(countSlides(container)).toBe(1);
      expect(screen.queryAllByRole("button", { hidden: true })).toHaveLength(0);
    });

    it("never advances, however long the page is left open", () => {
      const { container } = render(<HeroSlideshow />);
      const before = container.innerHTML;
      act(() => vi.advanceTimersByTime(60_000));
      expect(container.innerHTML).toBe(before);
    });
  });

  it("respects prefers-reduced-motion on a wide screen", () => {
    mockMedia({ wide: true, calm: true });
    const { container } = render(<HeroSlideshow />);
    expect(countSlides(container)).toBe(1);
    act(() => vi.advanceTimersByTime(12_000));
    expect(countSlides(container)).toBe(1);
  });

  it("winter mode renders static photo (no dots)", () => {
    // Component reads localStorage in useEffect to determine season — set it
    // before render so the effect picks it up on first commit.
    window.localStorage.setItem("cgs_season", "winter");
    render(<HeroSlideshow />);
    // useEffect runs synchronously after first commit; isWinter flips → re-render
    const dots = screen.queryAllByRole("button", { hidden: true });
    expect(dots).toHaveLength(0);
  });
});
