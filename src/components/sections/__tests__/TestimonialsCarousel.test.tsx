/**
 * TestimonialsCarousel: prev/next nav + dot pagination + auto-rotate.
 * Pauses auto-rotate on mouseEnter so the user can read.
 *
 * The reviews list is intentionally empty until real Google reviews are added
 * (see content/testimonials.ts) — the component renders nothing in that state,
 * so the data-driven cases below run only when testimonials exist.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { TestimonialsCarousel } from "../TestimonialsCarousel";
import { testimonials } from "@/content/testimonials";

describe("TestimonialsCarousel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders nothing when the reviews list is empty, else the first review", () => {
    const { container } = render(<TestimonialsCarousel locale="ru" />);
    if (testimonials.length === 0) {
      expect(container.firstChild).toBeNull();
      return;
    }
    expect(screen.getByText(testimonials[0].name)).toBeInTheDocument();
  });

  it("renders prev/next nav + N pagination dots when there are multiple testimonials", () => {
    if (testimonials.length <= 1) return; // guard for empty/single dev state
    render(<TestimonialsCarousel locale="ru" />);
    expect(screen.getByLabelText("Previous")).toBeInTheDocument();
    expect(screen.getByLabelText("Next")).toBeInTheDocument();
    // The dot buttons have aria-label "Go to review N"
    const dots = screen.getAllByLabelText(/Go to review/);
    expect(dots).toHaveLength(testimonials.length);
  });

  it("next button advances to the second testimonial", () => {
    if (testimonials.length < 2) return;
    render(<TestimonialsCarousel locale="ru" />);

    fireEvent.click(screen.getByLabelText("Next"));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText(testimonials[1].name)).toBeInTheDocument();
  });

  it("prev button wraps to the LAST testimonial when on first", () => {
    if (testimonials.length < 2) return;
    render(<TestimonialsCarousel locale="ru" />);

    fireEvent.click(screen.getByLabelText("Previous"));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText(testimonials.at(-1)!.name)).toBeInTheDocument();
  });

  it("clicking a specific dot jumps to that testimonial", () => {
    if (testimonials.length < 3) return;
    render(<TestimonialsCarousel locale="ru" />);

    const dots = screen.getAllByLabelText(/Go to review/);
    fireEvent.click(dots[2]); // 3rd review
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText(testimonials[2].name)).toBeInTheDocument();
  });

  it("auto-rotates every 6 seconds when not hovered", () => {
    if (testimonials.length < 2) return;
    render(<TestimonialsCarousel locale="ru" />);
    expect(screen.getByText(testimonials[0].name)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(6_500));
    expect(screen.getByText(testimonials[1].name)).toBeInTheDocument();
  });

  it("pauses auto-rotation on mouse enter", () => {
    if (testimonials.length < 2) return;
    const { container } = render(<TestimonialsCarousel locale="ru" />);

    // Trigger mouseEnter on the root section
    const section = container.querySelector("section")!;
    fireEvent.mouseEnter(section);

    act(() => vi.advanceTimersByTime(8_000));
    // Still on testimonial 0 because rotation was paused
    expect(screen.getByText(testimonials[0].name)).toBeInTheDocument();
  });

  it("renders a star rating row matching the review's rating", () => {
    if (testimonials.length === 0) return;
    render(<TestimonialsCarousel locale="ru" />);
    const stars = screen.getAllByText("★");
    expect(stars.length).toBe(testimonials[0].rating);
  });
});
