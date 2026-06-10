import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "../SectionHeader";

describe("SectionHeader", () => {
  it("renders the title as a heading", () => {
    render(<SectionHeader title="Глэмпинг и коттеджи" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Глэмпинг и коттеджи");
  });

  it("renders the eyebrow text when provided", () => {
    render(<SectionHeader title="X" eyebrow="CHIMGAN DARBAZA" />);
    expect(screen.getByText("CHIMGAN DARBAZA")).toBeInTheDocument();
  });

  it("doesn't render eyebrow element when not provided", () => {
    render(<SectionHeader title="X" />);
    // Only one paragraph in DOM: the title is an h2, no eyebrow <p>
    expect(screen.queryByText("CHIMGAN DARBAZA")).not.toBeInTheDocument();
  });

  it("renders the body text when provided", () => {
    render(<SectionHeader title="X" text="Описание секции" />);
    expect(screen.getByText("Описание секции")).toBeInTheDocument();
  });

  it("applies italic style when italic=true", () => {
    render(<SectionHeader title="Editorial" italic />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("italic");
  });

  it("center-aligns when align=center", () => {
    const { container } = render(<SectionHeader title="X" align="center" />);
    // The wrapper has text-center
    const root = container.firstElementChild;
    expect(root?.className).toContain("text-center");
  });
});
