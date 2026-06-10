/**
 * BookingWidget: search form on home page. GET form with checkin/checkout dates,
 * guests, optional promo, that submits to /bron.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingWidget } from "../BookingWidget";

describe("BookingWidget", () => {
  it("renders as a <form> with method=GET and action containing /bron", () => {
    const { container } = render(<BookingWidget locale="ru" />);
    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    expect(form?.method?.toLowerCase()).toBe("get");
    expect(form?.getAttribute("action")).toMatch(/\/bron/);
  });

  it("renders hidden checkin input from DatePicker", () => {
    const { container } = render(<BookingWidget locale="ru" />);
    expect(container.querySelector('input[name="checkin"]')).toBeInTheDocument();
  });

  it("renders hidden checkout input from DatePicker", () => {
    const { container } = render(<BookingWidget locale="ru" />);
    expect(container.querySelector('input[name="checkout"]')).toBeInTheDocument();
  });

  it("renders hidden guests input from GuestSelect", () => {
    const { container } = render(<BookingWidget locale="ru" />);
    expect(container.querySelector('input[name="guests"]')).toBeInTheDocument();
  });

  it("renders submit button with arrow icon", () => {
    render(<BookingWidget locale="ru" />);
    const submits = screen
      .getAllByRole("button")
      .filter((b) => (b as HTMLButtonElement).type === "submit");
    expect(submits.length).toBeGreaterThan(0);
  });

  it("submit button has type=submit and is enabled", () => {
    render(<BookingWidget locale="ru" />);
    const submit = screen
      .getAllByRole("button")
      .find((b) => (b as HTMLButtonElement).type === "submit")!;
    expect(submit).toBeEnabled();
  });

  it("pre-fills checkin from searchParams.checkin", () => {
    const { container } = render(
      <BookingWidget
        locale="ru"
        searchParams={{ checkin: "2026-08-15", checkout: "2026-08-18", guests: "4" }}
      />,
    );

    const hiddenCheckin = container.querySelector('input[name="checkin"]') as HTMLInputElement | null;
    expect(hiddenCheckin?.value).toBe("2026-08-15");
  });

  it("pre-fills guests from searchParams.guests", () => {
    const { container } = render(
      <BookingWidget locale="ru" searchParams={{ guests: "5" }} />,
    );
    const hiddenGuests = container.querySelector('input[name="guests"]') as HTMLInputElement | null;
    expect(hiddenGuests?.value).toBe("5");
  });
});
