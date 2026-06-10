/**
 * SeasonToggle: a single button that swaps between summer (☀️) and winter (❄️).
 * Persists choice via SeasonDetector (which writes localStorage + data-season).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { SeasonToggle } from "../SeasonToggle";

// Mock the SeasonDetector toggleSeason side-effect — we just need to verify
// it gets called; the actual data-season write is tested elsewhere.
const toggleSpy = vi.fn();
vi.mock("../SeasonDetector", () => ({
  toggleSeason: () => toggleSpy(),
}));

describe("SeasonToggle", () => {
  beforeEach(() => {
    toggleSpy.mockClear();
    // ensure starting season is summer
    document.documentElement.setAttribute("data-season", "summer");
  });

  it("renders summer label by default", () => {
    render(<SeasonToggle onDark={false} locale="ru" />);
    // summer mode shows ☀️ + "Лето" (or whatever dict.summer says)
    expect(screen.getByRole("button")).toHaveAccessibleName(/Switch to/);
    expect(screen.getByText("☀️")).toBeInTheDocument();
  });

  it("calls toggleSeason() on click after the 200ms flash delay", () => {
    vi.useFakeTimers();
    render(<SeasonToggle onDark={false} locale="ru" />);

    fireEvent.click(screen.getByRole("button"));
    expect(toggleSpy).not.toHaveBeenCalled(); // delayed

    act(() => vi.advanceTimersByTime(220));
    expect(toggleSpy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("shows the flash overlay during the 200ms transition", () => {
    vi.useFakeTimers();
    const { container } = render(<SeasonToggle onDark={false} locale="ru" />);

    fireEvent.click(screen.getByRole("button"));
    // flash overlay has inline-style animation:"season-flash ..."
    expect(container.querySelector('div[style*="season-flash"]')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(250));
    // flash overlay removed
    expect(container.querySelector('div[style*="season-flash"]')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("reads initial state from document.data-season attribute", () => {
    document.documentElement.setAttribute("data-season", "winter");
    render(<SeasonToggle onDark={false} locale="ru" />);
    // winter mode shows ❄️
    expect(screen.getByText("❄️")).toBeInTheDocument();
  });

  it("uses sky-styled classes when onDark=true and current season is winter", () => {
    document.documentElement.setAttribute("data-season", "winter");
    render(<SeasonToggle onDark={true} locale="ru" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("sky-500/20");
  });
});
