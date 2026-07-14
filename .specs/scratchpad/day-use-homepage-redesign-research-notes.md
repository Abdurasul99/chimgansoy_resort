# Scratchpad: day-use homepage redesign research

## Scope

Research only. No application source or task draft changed. Inputs reviewed: `AGENTS.md`, the draft task, homepage composition, hero, booking widget, custom selectors, navigation, pricing, galleries, layout overlays, image helpers, CSS, package/config, recent git history, and public image sizes.

## Raw repo observations

- Draft task has only title and original user prompt; no business analysis yet.
- `AGENTS.md` says day-use and paused overnight. Current history (`d1c20ab`, `19b3979`) and source restore bookable room content. This is the highest-risk ambiguity.
- Homepage has 13+ major sections and repeated photo proof.
- `LogoIntro`: 2.6 s handoff, 3.2 s finish; page scroll locked; shown on initial home visit.
- Hero: `100svh`, large title, lead, 4-control booking box on mobile; 3 summer CSS background slides. Source JPEGs are approximately 0.83, 0.87, and 0.50 MB.
- Booking widget: check-in, check-out, guests, submit. Day-use user needs one date.
- `PriceList` is the most complete day-use content and should be the data source for cards/comparison.
- Current primary nav includes Rooms and generic Services; old design recommendation requested day-use task labels.
- Sticky booking CTA leaves right space for floating FAQ on mobile; both can compete for attention and focus.
- Photo marquee duplicates 12 images to 24 nodes and moves forever; reduced-motion CSS exists, hover pause only.
- Hero slide selectors are buttons inside `aria-hidden`.
- DatePicker/GuestSelect have Escape/outside-click support and portal clamping, but lack full APG semantics/key behavior.
- Many meaningful photos use CSS backgrounds, so `next.config` AVIF/WebP support does not help those direct public-file requests.

## Decisions the specification must resolve

1. Are overnight glamping/cottage bookings live now? If yes, keep one secondary homepage section. If no, hide from public navigation but preserve source/routes.
2. Can Exely model a one-day/topchan product? If not, day-use should continue to the request form while overnight uses Exely.
3. Which real photos have marketing consent and accurately show currently available facilities?
4. Is a kitchen menu available as structured content? If not, the redesign can explain the choice without listing dishes.
5. Which booking completion event can Exely expose across its boundary?

## Research synthesis

- Conversion: reduce visible fields, preserve entered values, state price/inclusions early, use one primary outcome CTA.
- Visual: large truthful photographs work best when organized and congruent with the headline; shorter captions reduce cognitive load.
- Accessibility: WCAG 2.2 AA, 320 px reflow, stop automatic motion, conforming calendar/listbox, visible unobscured focus.
- Performance: one optimized LCP hero, responsive `next/image`, lazy below-fold content, stable aspect ratios, fewer duplicated image nodes and client timers.
- Validation: funnel analytics, field CWV at p75, axe plus manual keyboard/reflow checks, responsive viewports, all three locales.

## Source quality notes

- Technical claims use W3C/WAI, Next.js, and web.dev primary documentation.
- Visual claims use peer-reviewed hospitality research.
- Baymard is secondary applied research and is explicitly treated as directional, not a hotel-specific conversion guarantee.
