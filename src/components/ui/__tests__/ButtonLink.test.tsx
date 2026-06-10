import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonLink } from "../ButtonLink";

describe("ButtonLink", () => {
  it("renders as an anchor with the right href", () => {
    render(<ButtonLink href="/bron">Забронировать</ButtonLink>);
    const link = screen.getByRole("link", { name: /Забронировать/ });
    expect(link).toHaveAttribute("href", "/bron");
  });

  it("renders the primary variant with sun token bg", () => {
    render(<ButtonLink href="/x">click</ButtonLink>);
    const link = screen.getByRole("link");
    // Primary variant uses --sun token
    expect(link.className).toContain("bg-[var(--sun)]");
  });

  it("renders the ghost variant with bordered transparent bg", () => {
    render(
      <ButtonLink href="/x" variant="ghost">
        ghost
      </ButtonLink>,
    );
    const link = screen.getByRole("link");
    expect(link.className).toContain("border-[color:var(--line-strong)]");
  });

  it("renders external links with target='_blank' and a safe rel", () => {
    render(
      <ButtonLink href="https://example.com" external>
        ext
      </ButtonLink>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    // React 19+ auto-augments rel with "noopener" for security; accept either form
    const rel = link.getAttribute("rel") ?? "";
    expect(rel).toMatch(/noreferrer/);
  });

  it("renders the children verbatim", () => {
    render(
      <ButtonLink href="/x">
        <span>Inner content</span>
      </ButtonLink>,
    );
    expect(screen.getByText("Inner content")).toBeInTheDocument();
  });
});
