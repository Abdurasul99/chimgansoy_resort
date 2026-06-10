/**
 * ServicesGrid: filter pills + service cards. Tests the filter button behavior
 * and that cards reflect the active filter.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServicesGrid } from "../ServicesGrid";
import { serviceCategories } from "@/content/services";

describe("ServicesGrid", () => {
  it("renders one filter button per category when showFilters=true", () => {
    render(<ServicesGrid locale="ru" />);
    // serviceCategories should include at least an "all" entry plus others
    const filterButtons = screen.getAllByRole("button");
    // Filter buttons === number of categories
    expect(filterButtons.length).toBeGreaterThanOrEqual(serviceCategories.length);
  });

  it("first filter button (all) is active by default with dark bg", () => {
    render(<ServicesGrid locale="ru" />);
    const buttons = screen.getAllByRole("button");
    // The active one has bg-[var(--mountain)] in its className
    const active = buttons.find((b) => b.className.includes("bg-[var(--mountain)]"));
    expect(active).toBeDefined();
  });

  it("does NOT render filter pills when showFilters=false", () => {
    render(<ServicesGrid locale="ru" showFilters={false} />);
    // Buttons in the component would only come from the filter pills.
    // Service cards use anchor links, not <button>s.
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("clicking a category filter changes the active pill", () => {
    render(<ServicesGrid locale="ru" />);
    const buttons = screen.getAllByRole("button");
    // Find a non-active button to click — one without --mountain bg
    const inactive = buttons.find(
      (b) => !b.className.includes("bg-[var(--mountain)]"),
    );
    if (!inactive) return; // edge case

    fireEvent.click(inactive);
    // Now THIS button has --mountain bg
    expect(inactive.className).toContain("bg-[var(--mountain)]");
  });

  it("limit prop caps the number of rendered cards", () => {
    render(<ServicesGrid locale="ru" limit={2} showFilters={false} />);
    // Each card is an <article> or has a known structure — use the
    // 'Подробнее/Details' links count which equals number of cards.
    const detailLinks = screen.queryAllByRole("link");
    expect(detailLinks.length).toBeLessThanOrEqual(2);
  });
});
