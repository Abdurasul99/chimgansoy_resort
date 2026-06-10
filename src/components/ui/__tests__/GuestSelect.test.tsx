/**
 * GuestSelect: custom dropdown for number of guests (1-6, 8). Hidden input
 * holds the selected value so the parent <form> can serialise it on submit.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuestSelect } from "../GuestSelect";

describe("GuestSelect", () => {
  it("renders default value (2 guests) and label", () => {
    render(<GuestSelect name="guests" label="ГОСТИ" locale="ru" />);
    expect(screen.getByText("ГОСТИ")).toBeInTheDocument();
    expect(screen.getByText("2 гостя")).toBeInTheDocument();
  });

  it("hidden input carries the selected value for form serialization", () => {
    const { container } = render(
      <GuestSelect name="guests" label="g" locale="ru" defaultValue="4" />,
    );
    const hidden = container.querySelector('input[name="guests"]');
    expect(hidden).toHaveAttribute("value", "4");
  });

  it("opens dropdown on trigger click and shows all 7 options", async () => {
    const user = userEvent.setup();
    render(<GuestSelect name="guests" label="g" locale="ru" />);
    const trigger = screen.getByRole("button", { name: /2 гостя/ });
    await user.click(trigger);

    expect(screen.getByText("1 гость")).toBeInTheDocument();
    expect(screen.getByText("8 гостей (макс.)")).toBeInTheDocument();
    const optionButtons = screen.getAllByRole("button");
    // 1 trigger + 7 options
    expect(optionButtons.length).toBe(8);
  });

  it("clicking an option updates value + closes dropdown + updates trigger text", async () => {
    const user = userEvent.setup();
    const { container } = render(<GuestSelect name="guests" label="g" locale="ru" />);
    await user.click(screen.getByRole("button", { name: /2 гостя/ }));
    await user.click(screen.getByRole("button", { name: /5\+ гостей/ }));

    // hidden input updated
    expect(container.querySelector('input[name="guests"]')).toHaveAttribute("value", "5");
    // trigger now displays the new label
    expect(screen.getByText("5+ гостей")).toBeInTheDocument();
    // dropdown closed — only one button (the trigger) remains
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("Escape key closes the dropdown", async () => {
    const user = userEvent.setup();
    render(<GuestSelect name="guests" label="g" locale="ru" />);
    await user.click(screen.getByRole("button", { name: /2 гостя/ }));
    expect(screen.getByText("1 гость")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("1 гость")).not.toBeInTheDocument();
  });

  it("outside click closes the dropdown", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button data-testid="outside">other</button>
        <GuestSelect name="guests" label="g" locale="ru" />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: /2 гостя/ }));
    expect(screen.getByText("1 гость")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("1 гость")).not.toBeInTheDocument();
  });

  it("renders Uzbek labels when locale=uz", () => {
    render(<GuestSelect name="guests" label="g" locale="uz" />);
    expect(screen.getByText("2 mehmon")).toBeInTheDocument();
  });

  it("renders English labels when locale=en", () => {
    render(<GuestSelect name="guests" label="g" locale="en" />);
    expect(screen.getByText("2 guests")).toBeInTheDocument();
  });

  it("highlights the currently-selected option with a checkmark", async () => {
    const user = userEvent.setup();
    render(<GuestSelect name="guests" label="g" locale="en" defaultValue="3" />);
    await user.click(screen.getByRole("button", { name: /3 guests/ }));
    // The selected option button should have the bg-[var(--accent)]/10 class
    const opts = screen.getAllByRole("button");
    const selected = opts.find((b) =>
      b !== opts[0] && // not the trigger
      b.textContent?.includes("3 guests") &&
      b.className.includes("bg-[var(--accent)]/10"),
    );
    expect(selected).toBeDefined();
  });
});
