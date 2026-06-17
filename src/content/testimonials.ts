import type { LocalizedString } from "./types";

export type Testimonial = {
  name: string;
  rating: number;
  sourceUrl: string;
  sourceLabel: LocalizedString;
  meta: LocalizedString;
  quote: LocalizedString;
  /** Optional verbatim source text. Do NOT ship rewritten quotes publicly. */
  originalQuote?: string;
};

// IMPORTANT — only REAL guest reviews belong here.
// The previous entries were fabricated (all shared one Google Maps URL, carried
// a rewritten "originalQuote", and advertised a heated pool / padel court /
// overnight glamping the venue does not offer) — a false-advertising and
// arrival-day-disappointment risk, so they were removed.
//
// To re-enable the homepage reviews section, paste the owner's genuine Google
// Maps reviews below (each with its own real sourceUrl and rating). The
// carousel renders nothing while this list is empty.
export const testimonials: Testimonial[] = [];
