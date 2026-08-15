import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DayProductPage } from "../DayProductPage";

vi.mock("next/image", () => ({
  default: ({ priority, alt = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    void priority;
    return (
      // The production component still uses next/image; a plain img keeps the
      // assertion focused on the guest-visible source and alternative text.
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} {...props} />
    );
  },
}));

vi.mock("@/components/sections/PageHero", () => ({
  PageHero: () => <div data-testid="hero" />,
}));

vi.mock("@/components/sections/TopchanRequestForm", () => ({
  TopchanRequestForm: () => <form data-testid="topchan-form" />,
}));

vi.mock("@/components/sections/TubingRequestForm", () => ({
  TubingRequestForm: () => <form data-testid="tubing-form" />,
}));

vi.mock("@/components/sections/MediaArchive", () => ({
  MediaArchive: () => null,
}));

vi.mock("@/components/sections/VideoReel", () => ({
  VideoReel: () => null,
}));

vi.mock("@/lib/pricing-live", () => ({
  getPricing: vi.fn(async () => ({})),
}));

describe("DayProductPage tubing safety poster", () => {
  it("shows the supplied rules poster before the tubing request form", async () => {
    render(await DayProductPage({ locale: "ru", slug: "tubing" }));

    const poster = screen.getByRole("img", {
      name: "Плакат с правилами пользования тюбингами диаметром 100 см",
    });
    const form = screen.getByTestId("tubing-form");

    expect(poster).toHaveAttribute("src", "/images/resort/tubing-rules-100cm-ru.jpg");
    expect(poster.closest("a")).toHaveAttribute("href", "/images/resort/tubing-rules-100cm-ru.jpg");
    expect(poster.closest("a")).toHaveAttribute("target", "_blank");
    expect(poster.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not show the tubing poster on the topchan page", async () => {
    render(await DayProductPage({ locale: "ru", slug: "topchan" }));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
