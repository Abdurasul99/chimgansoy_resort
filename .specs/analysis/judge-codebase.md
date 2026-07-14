# Judgment: day-use homepage codebase analysis

## Verdict

**PASS — 4.49 / 5.00** (threshold: 3.50)

The analysis is implementation-ready at a professional level. It identifies the main change surface, documents the high-risk contracts with unusually concrete evidence, and separates release-critical work from optional cleanup. The score is below 5.0 because a few cross-component and test-file boundaries remain underspecified.

## Weighted score

| Criterion | Weight | Score | Weighted contribution |
|---|---:|---:|---:|
| File Identification | 35% | 4.40 / 5.00 | 1.540 |
| Interface Contracts | 25% | 4.60 / 5.00 | 1.150 |
| Integration Mapping | 25% | 4.60 / 5.00 | 1.150 |
| Risks / Mitigations | 15% | 4.30 / 5.00 | 0.645 |
| **Total** | **100%** |  | **4.485 → 4.49 / 5.00** |

## Evidence by criterion

### File Identification — 4.40 / 5.00

The 17-file minimum is broken into 15 modifications, one deletion, and one new test, with responsibilities and intended impacts stated per file (`day-use-homepage-codebase.md:140-172`). Optional extractions are explicitly separated (`:174-193`), and a useful “intentionally untouched” boundary protects Exely and paused room assets (`:195-210`). Targeted spot-checking supports the matrix: the homepage directly imports the room catalogue, master plan, multiple galleries, FAQ JSON-LD, and related sections (`src/app/[locale]/page.tsx:2-26`) and renders the public room and master-plan promotions (`:197-216`).

The deduction is for two boundary gaps: the fixed-control solution depends on `StickyBookingCta.tsx`, but that file is absent from the critical matrix; and the proposed homepage server-composition smoke test has no named target file.

### Interface Contracts — 4.60 / 5.00

The analysis records locale, localized content, image, booking widget, GET query, Exely, floating-control accessibility, and intro-removal contracts (`day-use-homepage-codebase.md:53-138`). The booking details are accurate in the checked code: `BookingWidget` exposes the documented variants and search parameters (`src/components/sections/BookingWidget.tsx:9-21`), submits a full GET navigation, and currently serializes `checkin`, `checkout`, and `guests` (`:31-46`). The documented day inventory ID is grounded in `EXELY_ROOM_TYPE.day = "5075762"` (`src/content/rooms.ts:100-109`).

The one-date Exely handoff is intentionally not invented, which is the correct safety posture, but it leaves the final query contract unresolved pending live validation (`day-use-homepage-codebase.md:100-106`, `:246-254`). That prevents a near-perfect score.

### Integration Mapping — 4.60 / 5.00

The analysis correctly traces the production Exely path through the locale layout, stable container, failure observer, and `/bron` visibility wrappers (`day-use-homepage-codebase.md:110-121`). The spot-check confirms the hard-coded context and pathname-gated embed (`src/app/[locale]/layout.tsx:134-145`), stable `#be-booking-form` host and nine-second fallback (`src/components/ui/BookingEngineSlot.tsx:9-21`, `:35-68`), and global FAQ/footer suppression on `/bron` (`src/app/[locale]/layout.tsx:159-171`). It also maps shared `BookingWidget` consumers, fragment-navigation behavior, structured data, content duplication, performance, and fixed-control interactions (`day-use-homepage-codebase.md:240-282`).

The main weakness is that the analysis calls for a coordinated FAQ/sticky-CTA collision policy (`:123-128`, `:272-274`) while assigning the implementation only to `FaqPanel.tsx`. Current visibility state lives independently in `StickyBookingCta.tsx:14-39`, so a robust shared policy may require that file too.

### Risks / Mitigations — 4.30 / 5.00

Nine risks are ranked and paired with actionable controls, including live Exely validation, atomic intro removal, a scoped booking mode, preview E2E, accessibility checks, and performance gates (`day-use-homepage-codebase.md:240-327`). The staged implementation sequence and safe-handoff criteria are concrete (`:337-354`). The analysis also responsibly surfaces drift between repository instructions and current `master` rather than silently choosing one (`:223-238`).

The deduction reflects two mitigations that need sharper ownership or acceptance criteria: the schema recommendation stops at “choose the most accurate schema type with SEO review” (`:260-262`), and the Exely contract depends on an external live-loader verification without naming who records approval or where the verified contract will be documented.

## Gaps to close

1. Add `src/components/layout/StickyBookingCta.tsx` to the affected-file matrix, or explicitly prove that `FaqPanel.tsx` alone owns the collision policy.
2. Name the file that will contain the homepage server-composition smoke assertions proposed at `day-use-homepage-codebase.md:307-311`.
3. Record the verified one-date Exely query contract and approval owner before freezing implementation tests.
4. Turn the structured-data review into a concrete decision item with an approved schema type and validation criterion.

