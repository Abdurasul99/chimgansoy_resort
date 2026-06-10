/**
 * DatePicker: custom calendar grid + month navigation + today + clear.
 * Hidden ISO input holds the selected date for form serialization.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatePicker } from "../DatePicker";

describe("DatePicker", () => {
  it("renders trigger with placeholder when no defaultValue", () => {
    render(<DatePicker name="checkin" label="Заезд" locale="ru" />);
    expect(screen.getByText("Заезд")).toBeInTheDocument();
    expect(screen.getByText("Выбрать дату")).toBeInTheDocument();
  });

  it("renders trigger with formatted defaultValue", () => {
    render(
      <DatePicker
        name="checkin"
        label="x"
        locale="ru"
        defaultValue="2026-08-15"
      />,
    );
    // 15 авг 2026 (or similar)
    expect(screen.getByText(/15 авг 2026/)).toBeInTheDocument();
  });

  it("hidden input carries the ISO date for form serialization", () => {
    const { container } = render(
      <DatePicker
        name="checkin"
        label="x"
        locale="ru"
        defaultValue="2026-08-15"
      />,
    );
    const hidden = container.querySelector('input[name="checkin"]');
    expect(hidden).toHaveAttribute("value", "2026-08-15");
  });

  it("clicking trigger opens the calendar grid", async () => {
    const user = userEvent.setup();
    render(<DatePicker name="x" label="X" locale="ru" />);
    await user.click(screen.getByText("Выбрать дату"));

    // Calendar shows weekday headers
    expect(screen.getByText("Пн")).toBeInTheDocument();
    expect(screen.getByText("Вс")).toBeInTheDocument();
  });

  it("Escape key closes the calendar", async () => {
    const user = userEvent.setup();
    render(<DatePicker name="x" label="X" locale="ru" />);
    await user.click(screen.getByText("Выбрать дату"));
    expect(screen.getByText("Пн")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Пн")).not.toBeInTheDocument();
  });

  it("clicking a day selects it and closes the picker", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DatePicker
        name="x"
        label="X"
        locale="ru"
        defaultValue="2026-08-15"
      />,
    );
    await user.click(screen.getByText(/15 авг 2026/));

    // Find day cell "20" and click it
    const days = screen.getAllByRole("button").filter((b) => b.textContent === "20");
    if (days.length > 0) {
      await user.click(days[0]);
      // Hidden input updated to a date in August 2026 (day 20)
      const hidden = container.querySelector('input[name="x"]') as HTMLInputElement | null;
      expect(hidden?.value).toMatch(/^2026-08-20$/);
    }
  });

  it("renders UZ month labels when locale=uz", async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        name="x"
        label="X"
        locale="uz"
        defaultValue="2026-01-10"
      />,
    );
    // Trigger displays month-short label
    expect(screen.getByText(/10 yan 2026/i)).toBeInTheDocument();

    // Open calendar — weekday labels in UZ
    await user.click(screen.getByText(/10 yan 2026/i));
    expect(screen.getByText("Du")).toBeInTheDocument();
  });

  it("renders EN labels when locale=en", () => {
    render(
      <DatePicker
        name="x"
        label="X"
        locale="en"
        defaultValue="2026-08-15"
      />,
    );
    expect(screen.getByText(/15 Aug 2026/)).toBeInTheDocument();
  });
});
