# Research: day-use homepage redesign

## Executive finding

The homepage should sell one clear promise first: **a day in the Chimgan mountains with a topchan, food, and outdoor cooking**. It should then help a visitor choose a format, understand the price, and start a booking. The current page has strong real photography and a useful price list, but it dilutes that promise with an intro gate, two moving galleries, overnight inventory, a master plan, several repeated editorial photo sections, and hotel-style check-in/check-out fields.

This is an implementation input, not a product decision. The repository now conflicts with `AGENTS.md`: the guide says overnight stays are paused, while recent commits and the current homepage restore bookable rooms and Exely. Before implementation, the specification must state whether overnight stays remain a secondary homepage offer. Do not delete the retained room data or routes.

## Repository evidence

- `src/components/ui/LogoIntro.tsx` hides the first homepage view, locks scrolling, and finishes after 3.2 seconds. A skip button does not remove the delay for most visitors.
- `src/components/sections/BookingWidget.tsx` asks for `checkin`, `checkout`, and guests. That language and interaction model describe a hotel stay, not a day visit.
- `src/app/[locale]/page.tsx` renders at least 13 major content blocks: hero, marquee, prices, statistics, two full-height showcases, about, rooms, master plan, leisure, testimonials, two more galleries, promotion, FAQ, and map. Several blocks repeat the same proof instead of advancing the decision.
- `src/content/navigation.ts` leads with Rooms, Services, About, Attractions, and Contacts. It does not expose prices, topchans, food, or directions as first-class day-use tasks.
- `src/components/sections/PriceList.tsx` already contains the strongest day-use sales content: real price differences, inclusions, what to bring, and a booking CTA.
- `src/components/sections/HeroSlideshow.tsx` inserts three full-viewport JPEGs as CSS backgrounds. Hidden slides still reference their URLs. The three source files total about 2.2 MB, bypass `next/image` responsive selection, and all can be discovered near first paint.
- `src/components/sections/PhotoMarquee.tsx` duplicates 12 photos into 24 `<img>` elements immediately after the hero. The animation pauses on hover and honors reduced motion, but touch and keyboard users get no pause control.
- `src/components/ui/DatePicker.tsx` and `GuestSelect.tsx` use portals and native buttons, but their triggers expose no `aria-expanded`, `aria-controls`, or popup type. The calendar lacks the dialog/grid semantics and arrow-key model documented by WAI-ARIA APG.
- `src/components/sections/HeroSlideshow.tsx` puts focusable slide buttons inside an `aria-hidden="true"` ancestor. This can create keyboard stops with no accessible name or context.
- `src/app/globals.css` has a useful global reduced-motion fallback, a skip link, 16 px mobile form controls, and high-contrast CTA tokens. Preserve these strengths.

## Recommended experience and information architecture

Use this order on the homepage:

1. **Hero:** one authentic panorama, a two-line promise, one-day booking controls, one primary CTA.
2. **Choose your day:** 3–4 scannable formats derived from the real price list, not invented packages.
3. **Prices and inclusions:** compact weekday/weekend comparison, what is included, what guests may bring.
4. **How the day feels:** a short photo story—arrival, topchan, cooking, meal, mountain view.
5. **Food and cooking:** kitchen menu versus bring-your-own food; mangal, kazan, wood, and charcoal.
6. **Practical visit information:** 45 minutes from Tashkent, 1700 m, 08:00–18:00, parking, map, phone.
7. **Social proof, focused FAQ, final CTA.**

Merge or remove repeated proof blocks. A visitor should not encounter four separate galleries before reaching directions. Keep overnight inventory, master-plan content, and promotions off the primary decision path; if overnight stays are genuinely live, present them once as a clearly labeled secondary section after the day-use offer.

Recommended desktop navigation: `Prices · Topchans · Food · Nearby · Directions · Contacts`. On mobile, show the same priorities in the menu and a single sticky booking CTA after the hero. Remove the season toggle from primary navigation; automatic season imagery can remain if it does not change the offer or navigation.

## Booking conversion recommendations

### Primary day-use flow

- Ask for **visit date** and **guests** in the hero. Add a format/topchan selector only if it changes availability or routing.
- Label the CTA by outcome: “Book a topchan” / localized equivalents, not a generic “Book now.”
- Carry the selected date, guests, and format into `/bron`; never ask for the same value twice.
- Show weekday/weekend pricing and what is included before the visitor enters the booking engine.
- Keep phone/Telegram as a fallback, not a competing primary CTA.
- If Exely requires check-in/check-out, adapt the day-use selection at the integration boundary or route day-use to the request form. Do not present two hotel dates merely to satisfy an internal API.

Fewer visible fields reduce perceived effort, especially on mobile. Baymard's checkout research finds that field count matters more than step count and that every unnecessary mobile field increases perceived complexity. Treat this as directional ecommerce evidence, then validate the actual Chimgan flow with analytics rather than importing industry conversion benchmarks.

### Measurement

Instrument a small funnel per locale and viewport:

- `home_view`
- `day_use_search_start`
- `day_use_search_submit`
- `booking_engine_loaded` or `request_form_view`
- `booking_complete` or `request_success`
- `phone_click`, `map_click`

Track search-submit rate and completion rate separately. Segment by locale, device class, and day-use versus overnight. Do not call the redesign successful from clicks alone; the primary metric is completed booking/request per eligible homepage session. Use the current site as the baseline and release changes behind an analyzable version marker or A/B test if traffic allows.

## Image-led hospitality direction

Use large, organized, truthful photographs with short captions. Hospitality studies found that larger photographs increase visual transportation, which correlates with booking intention, and that more organized photography with concise text performs better than long descriptive copy. Another experimental study found misleading hotel photos cause distrust and negative word of mouth.

For this property, the useful shot list is concrete: people seated on a topchan; kurpacha and table detail; mangal fire; kazan preparation; a served meal; children and family; arrival/parking; a person against the mountains for scale; late-afternoon light. Pair every headline with a photograph that proves it. Avoid renders, unrelated attractions, or cabin imagery in the day-use hero. Label any future render as a visualization.

Tradeoff: people add warmth and scale, but every image must have consent and should not imply a service or amenity that is unavailable. Keep a product-focused image for price/inclusions and use people in the narrative sequence.

## Responsive behavior

Design from 320 CSS px upward and verify at 320, 360, 390, 768, 1024, and 1440 px, plus 200% and 400% zoom. WCAG reflow requires content at a 320 CSS px equivalent without two-dimensional scrolling, except where the content itself requires it.

- Hero: no forced `100svh` if content plus booking controls cannot fit; use a content-driven minimum height and preserve access to the CTA at 320 px and landscape mobile.
- Forms: one column on small screens; controls at least 48 px high; no date popup wider than the viewport; no fixed element may obscure focused controls.
- Price comparison: use stacked rows with explicit “weekday” and “Fri–Sun” labels on narrow screens. Do not rely on color, italics, or a slash to distinguish prices.
- Sticky CTA and FAQ: reserve safe-area space and prevent overlap. The CTA should span the usable width; the FAQ control can move above it or appear only after the first section.
- Photography: art-direct crops so the topchan or people remain visible at mobile aspect ratios. Horizontal scrolling galleries must not contain text that requires a second scroll direction.

## Accessibility requirements

Target WCAG 2.2 AA.

- Keep text contrast at least 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful control boundaries/focus indicators. Test every text-over-image state; a fixed gradient must protect all crops.
- Use visible focus styles and keep focus unobscured by sticky CTA, FAQ, header, and portalled popups.
- Use at least the WCAG 24×24 px minimum target; prefer 44–48 px for core mobile actions.
- Replace the calendar with a native input where acceptable, or implement the WAI-ARIA date-picker dialog/grid pattern: labelled trigger, `aria-expanded`, `aria-haspopup="dialog"`, `aria-controls`, focus transfer/return, grid roles, selected/current states, arrow/Home/End/Page keyboard behavior, Escape, and localized month navigation labels.
- Implement GuestSelect as a native `<select>` or a conforming button/listbox. Support arrows, Home/End, Escape, type-ahead, selected state, and focus return.
- Give the hero carousel a labelled pause/play control and labelled slide selectors, or use one static hero image. Never put focusable descendants inside `aria-hidden`.
- Stop hero rotation, marquee, snow, and decorative motion when `prefers-reduced-motion: reduce` is active. Auto-moving content lasting more than five seconds also needs a pause/stop/hide mechanism under WCAG 2.2.2; hover-only pause is insufficient.
- Keep heading order, landmarks, skip link, localized accessible names, useful image alternatives, and empty alt text for duplicated decorative photos.

## Performance recommendations

Use the Core Web Vitals “good” thresholds at the 75th percentile as release targets: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1. Measure field data when available; use Lighthouse and Playwright traces as development signals, not substitutes for real-user data.

1. Remove `LogoIntro` from the normal homepage path. It deliberately delays access and can postpone the meaningful hero experience by 3.2 seconds.
2. Render the hero with `next/image` using `fill`, explicit `sizes`, and one high-priority/eager LCP candidate. Next.js 16 recommends `preload`, eager loading, or `fetchPriority="high"` for the true LCP image; do not prioritize multiple competing slides.
3. Load only the first hero image initially. Fetch later slides after the load/LCP window or on interaction; a static hero is the lowest-risk option.
4. Replace CSS background photos used as content with `<Image>` so the browser gets `srcset`, `sizes`, dimensions, lazy loading, and AVIF/WebP delivery. Keep CSS backgrounds for decoration only.
5. Remove the duplicated marquee from the critical path or replace it with a small responsive grid. If retained, avoid duplicate image downloads/DOM nodes and provide explicit pause.
6. Give every image a stable aspect ratio to protect CLS. Lazy-load below-fold images and use accurate `sizes`; missing `sizes` can make the browser assume `100vw` and download oversized files.
7. Keep the homepage mostly server-rendered. Limit client components to the booking controls and genuinely interactive elements; remove timers and observers that do not advance the booking task.
8. Test on a throttled mid/low-end mobile profile. Large source files and animated overlays can behave acceptably on desktop while harming mobile LCP, decode time, battery, and INP.

## Tradeoffs and pitfalls

- **Static hero versus slideshow:** a static hero improves message consistency, accessibility, and loading; a slideshow provides variety but adds bytes, timers, controls, and crop risks. Prefer static until data proves rotation adds bookings.
- **Day-use form versus Exely model:** the honest user model is one date. Preserve the simple UI even if an adapter must translate it for Exely. If Exely cannot represent day use, keep the request form fallback explicit.
- **Shorter homepage versus SEO:** remove duplicate presentation, not useful facts. Preserve localized text about topchans, cooking, prices, location, hours, and nearby attractions in meaningful sections and metadata.
- **Authentic photos versus polished renders:** authentic current-state photos build trust. Renders belong only in a labelled future/master-plan context, never mixed with bookable inventory.
- **Overnight state drift:** recent commits contradict `AGENTS.md`. Confirm with the operator before hiding a live revenue stream, and update repository guidance in the implementation task.
- **Three locales:** every new string, accessible label, anchor name, metadata field, and structured-data claim must exist in Russian, Uzbek, and English.
- **Price truth:** derive UI from `src/content/pricing.ts`; do not copy prices into JSX or translations.
- **Booking resilience:** retain the existing request-form fallback and `formType="booking"`; visual redesign must not weaken Telegram/email routing.

## Implementation-ready verification inputs

- One primary `h1`, one day-use promise, and one primary CTA appear without an intro gate.
- A visitor can submit date plus guests at 320 px with keyboard only and with a screen reader.
- The day-use UI never says check-in, check-out, room, or overnight unless the visitor explicitly chooses overnight.
- All automatic motion can stop; reduced-motion mode shows no rotating or continuously moving content.
- No focusable element is inside `aria-hidden`; focus remains visible and returns correctly from popups.
- Prices, opening hours, capacity, distance, and inclusions come from shared content and match all three locales.
- Only one hero image receives high fetch priority; below-fold images are responsive and lazy.
- Lighthouse/trace checks cover 360×800 mobile and desktop; automated axe checks cover the homepage and booking start; manual checks cover calendar keyboard behavior and 400% reflow.
- Analytics distinguish day-use from overnight and record search submit through confirmed booking/request.

## Sources

1. W3C, [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) — normative contrast, focus, target-size, and interaction requirements.
2. W3C WAI, [Understanding SC 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide) — auto-moving content controls.
3. W3C WAI, [Understanding SC 1.4.10: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) — 320 CSS px and zoom behavior.
4. W3C WAI-ARIA APG, [Date Picker Combobox Example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/) and [Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — calendar/listbox semantics and keyboard model.
5. Next.js, [Image Component](https://nextjs.org/docs/app/api-reference/components/image) — Next.js 16 responsive image, `sizes`, preload, and LCP guidance.
6. web.dev, [How Core Web Vitals thresholds were defined](https://web.dev/articles/defining-core-web-vitals-thresholds) — current LCP, INP, and CLS thresholds.
7. Back et al., [Effects of hotel website photograph size and human images on perceived transportation and behavioral intentions](https://doi.org/10.1016/j.ijhm.2020.102545) — peer-reviewed hospitality image research.
8. Lim & Jang, [Does photo presentation matter for increasing booking intention?](https://doi.org/10.1080/19368623.2022.2107593) — peer-reviewed findings on photo organization and headline congruence.
9. Marder et al., [Effects of hotel website photographs and length of textual descriptions on viewers' emotions and behavioral intentions](https://doi.org/10.1016/j.ijhm.2019.102378) — peer-reviewed image/text balance research.
10. Kim et al., [Seeing isn't always believing: misleading photos in the hotel industry](https://doi.org/10.1016/j.ijhm.2024.103934) — peer-reviewed authenticity and trust findings.
11. Baymard Institute, [Checkout Optimization: Minimize Form Fields](https://baymard.com/blog/checkout-flow-average-form-fields) — large-scale ecommerce usability evidence; use directionally for booking forms.
