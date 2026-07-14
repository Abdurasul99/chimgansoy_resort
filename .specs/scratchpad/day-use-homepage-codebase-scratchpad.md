# Phase 2b scratchpad — day-use homepage redesign

## Evidence gathered

- Branch: `master`; starting worktree contained only untracked `.specs/`.
- Current HEAD: `6de2fd2`; recent commits reintroduced bookable rooms and a live Exely integration after the day-use-only commits described in `AGENTS.md`.
- Baseline verification on 2026-07-14:
  - `tsc --noEmit`: pass.
  - Vitest: 18 files, 169 tests, all pass.
- Homepage composition is concentrated in `src/app/[locale]/page.tsx`; it currently renders 13+ visual blocks and mixes day-use, overnight accommodation, development renders, seasonal effects, and several galleries.
- The first screen contains `HeroSlideshow`, a very large heading, lead copy, and `BookingWidget variant="hero"`; the widget exposes check-in, check-out, guests, and submit.
- A synchronous script in `[locale]/layout.tsx`, `LogoIntro.tsx`, and intro CSS hide the whole homepage for up to 3.2 seconds (with 4/6 second failsafes).
- The desktop header exposes `SeasonToggle`; `SeasonDetector` and `HeroSlideshow` independently read `cgs_season` and `data-season`.
- The active `/bron` implementation is not the request-form flow documented in `AGENTS.md`: it is a live Exely engine injected into stable container `#be-booking-form` by the layout head script.
- The homepage GET form sends `checkin`, `checkout`, and `guests` to `/[locale]/bron`; Exely room type for day-use is `5075762` in `EXELY_ROOM_TYPE.day`, but the homepage widget currently does not send it.
- `FaqPanel` comments claim overnight entries are excluded, while `FAQ_ORDER` actually includes `glamping`, `cottage`, `checkin`, and `cancellation`.
- `navigation.ts`, homepage room section, `pageSeo.home`, JSON-LD, and translations publicly advertise stays even though `AGENTS.md` says overnight stays are paused.
- Real June 2026 photos already cover topchans, kurpacha interiors, mangal fire, kazan, food service, waiter/plov, paths, children, mountains, and territory. No new image asset is required for an initial redesign.

## Decisions used in the analysis

1. Treat the explicit day-use positioning in `AGENTS.md` and the user's design direction as the intended target, but record the current `master` contradiction as a release blocker that must be reconciled before implementation.
2. Preserve the active Exely integration and stable `/bron` container; redesign only the homepage entry point unless Exely confirms a different day-use query contract.
3. Keep paused room routes/data in the repository. Hide public promotion rather than deleting `rooms.ts` or `/nomera/[slug]`.
4. Remove the blocking intro from the runtime path. Deleting the now-unused component is preferable, while other seasonal cleanup can remain optional.
5. Prefer composition from existing sections and content modules. Extract new homepage sections only where it materially improves maintainability and testability.

## Main risks to carry forward

- Do not invent a checkout value for a one-date day-use booking. Validate whether Exely accepts only `checkin` plus `room-type=5075762`, or requires a vendor-specific same-day parameter.
- Navigation anchors need explicit fragment-safe localization; `localizePath()` simply prefixes strings and is not designed around hash-only input.
- Changing JSON-LD from `LodgingBusiness` changes the current E2E expectation and should be coordinated with metadata/SEO work.
- Removing intro code requires deleting all three layers together: head gate script, mounted component, and CSS gates. Partial removal can create an invisible homepage.
- FAQ and sticky booking controls share the lower mobile viewport. Visibility thresholds and open-panel behavior must be tested together.
- Existing E2E tests target live production by default. Use `E2E_BASE_URL` for feature-branch verification before deployment.

