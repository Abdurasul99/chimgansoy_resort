/**
 * HeroSlideshow: auto-rotating background carousel + manual indicator dots.
 * Switches to a single static photo in winter mode.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { HeroSlideshow } from "../HeroSlideshow";

// Indicator dots live in an aria-hidden container ({hidden:true} required to query)
const getDotButtons = () => screen.getAllByRole("button", { hidden: true });

describe("HeroSlideshow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.removeAttribute("data-season");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("summer mode renders 3 indicator dot buttons", () => {
    render(<HeroSlideshow />);
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
