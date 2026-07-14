# Codebase impact analysis: day-use homepage redesign

## Executive summary

The repository has strong reusable day-use building blocks, but the current `master` presents two conflicting products at once. The hero and price list sell a topchan-based day visit, while navigation, room cards, metadata, JSON-LD, FAQ, and Exely copy also sell overnight accommodation. The redesign should make the homepage a focused day-use funnel without dismantling the existing Exely engine or deleting paused room assets.

The minimum implementation scope is **17 affected files**: **15 modifications, 1 new test file, and 1 deletion**. A cleaner component extraction and seasonal-effect cleanup can increase this to roughly **23–27 files**, but those are optional and should not be confused with the release-critical path.

**Overall risk: high.** The visual work itself is medium risk; the high rating comes from unresolved product-state drift (`AGENTS.md` versus current `master`), the undocumented Exely day-use date contract, global layout/structured-data changes, and mobile floating-control interactions.

## Repository baseline

| Item | Current state |
|---|---|
| Branch / HEAD | `master` / `6de2fd2` |
| Worktree at analysis start | Only `.specs/` was untracked; no application-source changes |
| Framework | Next.js 16.2.4 App Router, React 19.2.4, TypeScript strict, Tailwind CSS v4 |
| Locales | `ru`, `uz`, `en`; every public string must exist in all three |
| Type check | Pass: `tsc --noEmit` |
| Unit/component tests | Pass: 18 files, 169 tests |
| E2E default target | Live `https://chimgandarbaza.uz`; override with `E2E_BASE_URL` |

## Current homepage behavior

`src/app/[locale]/page.tsx` is a server component and directly assembles a long homepage in this order:

1. hero with slideshow, seasonal effects, and booking form;
2. two-row animated real-photo marquee;
3. day-use price list;
4. four-stat band;
5. two full-bleed editorial showcase panels;
6. about split with a glamping image;
7. public room catalogue and `/nomera` CTA;
8. CGI development master plan;
9. leisure/service cards;
10. reviews component (currently returns `null` because `testimonials` is empty);
11. bento gallery;
12. a second five-photo emotion strip;
13. promotion band, static FAQ, and map.

This is visually rich but structurally repetitive: the marquee, showcase, bento gallery, and emotion strip all perform similar photographic storytelling. It also places overnight accommodation and planned CGI between the day-use sales story and conversion path.

### First-screen behavior

- `Hero.tsx` renders at least `100svh`, pulls upward by the 4.5rem header height, and places content at the bottom.
- `HeroSlideshow.tsx` rotates three real summer photos every 5.5 seconds; winter becomes one static A-frame image.
- `Hero.tsx` also contains Santa, a Christmas tree, stars, and `SnowParticles`, all controlled by `data-season` CSS.
- The title uses `.display-xl` (`clamp(4rem, 13vw, 11rem)`) and splits the final word onto a gold italic line.
- `BookingWidget variant="hero"` renders a 2x2 card with two date pickers, guest picker, and submit button.
- `FaqPanel` is globally mounted and its mobile toggle is fixed at `bottom: 4.5rem`; it can visually compete with hero controls.
- `LogoIntro` prevents immediate access to all of the above on initial homepage load.

## Contracts and interfaces that must be preserved or deliberately migrated

### Locale and content contract

```ts
type Locale = "ru" | "uz" | "en";
type LocalizedString = { ru: string; uz: string; en: string };
```

- `dictionaries` uses `satisfies Record<Locale, object>`.
- Co-located content uses `LocalizedString` and is read through `text(value, locale)`.
- A new translation key must be added in all three dictionary blocks in the same change.
- Route generation and links must continue through `localizePath(locale, path)` for pathname links.

### Image contract

```ts
resortImages[key] = {
  src: string;
  localSrc?: string;
  position?: string;
  alt: LocalizedString;
}
```

- Prefer `localSrc` through `imageStyle()` or `img.localSrc ?? img.src`.
- Real photography is already registered under `gal*` keys.
- CGI/render keys (`hero`, `pool`, `workoutPadel`, numbered master-plan images) must not be presented as real current amenities.

### Homepage booking contract

Current component API:

```ts
type BookingWidgetProps = {
  locale: Locale;
  variant?: "compact" | "full" | "hero";
  searchParams?: Record<string, string | string[] | undefined>;
};
```

Current GET payload:

```text
/{locale}/bron?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&guests=1..8[&promo=...]
```

The redesign wants one visible visit date. The safe migration is:

- retain the public field name `checkin` until the Exely contract is verified;
- retain `guests` and its 1..8 hidden-input behavior;
- include the day-use inventory selector only if validated, using the existing source of truth `EXELY_ROOM_TYPE.day === "5075762"` and query key `room-type`;
- do **not** fabricate `checkout=checkin`, `checkout=next-day`, or a new `date` key without testing the live Exely loader;
- preserve a normal GET navigation to `/bron`; a full navigation is intentional because Exely is initialized from the layout head script.

`DatePicker` and `GuestSelect` are client components that render visible button triggers plus hidden standard form inputs. Their internal APIs can be reused unchanged.

### Exely integration contract

The current implementation differs materially from `AGENTS.md`:

- `[locale]/layout.tsx` injects Exely only when the pathname ends in `/bron`.
- It calls `setContext` with context `BE-INT-chimgandarbaza-uz_2026-06-24` and locale.
- It embeds into the stable container `#be-booking-form`.
- `BookingEngineSlot` watches that container and shows failure contacts after 9 seconds.
- Footer and FAQ are intentionally hidden on `/bron` through `HideOnBron`.
- `ExelyWidget.tsx` is an unused, older env-gated implementation and is not the production path.

The redesign must leave the context, container ID, `/bron` loader condition, failure state, and distraction-free booking page intact unless a separately scoped Exely change is approved.

### Floating controls contract

- `StickyBookingCta` appears after `min(72vh, 620px)` of scroll and is hidden only on `/bron`.
- `FaqPanel` is always visible outside `/bron` and uses a fixed mobile toggle.
- The FAQ panel traps focus, closes on Escape, and restores focus.
- Any delayed FAQ-toggle design should preserve those accessibility behaviors and coordinate its visible state with the sticky CTA rather than simply changing z-index.

### Intro contract being removed

The intro is a three-part system:

1. synchronous `data-intro="pending"` head script in `[locale]/layout.tsx`;
2. `LogoIntro.tsx`, which locks scroll, plays for 3.2 seconds, and emits `logo-intro:done`;
3. `globals.css` selectors that hide body/header/main/footer for pending/active states.

All three must be removed together. Removing only the component can leave the shell hidden until failsafe timers run.

## Exact affected-file matrix

### Must modify — release-critical (15 files)

| File | Current responsibility | Required impact |
|---|---|---|
| `src/app/[locale]/page.tsx` | Full homepage composition and several inline content blocks | Reorder to one day-use narrative; remove public rooms/master-plan promotion from home; consolidate duplicate galleries; add stable section IDs for navigation; keep price, services/experience, map, FAQ, and final conversion path. |
| `src/app/[locale]/layout.tsx` | Global shell, JSON-LD, Exely loader, intro gate, floating UI | Remove intro gate/import/mount; change overnight-oriented schema only after choosing an accurate day-use business type; preserve Exely loader and `#be-booking-form` integration. |
| `src/app/globals.css` | Brand tokens, typography, intro gates, season themes, global animation utilities | Remove intro-only selectors; tune responsive hero/type/floating-control rules; keep palette tokens and reduced-motion support. |
| `src/components/layout/Header.tsx` | Global navigation, season toggle, language switcher, booking CTA | Remove visible season toggle; consume the day-use navigation model; support home section links without breaking non-home navigation or active states; preserve locale switch and full `/bron` navigation. |
| `src/components/sections/Hero.tsx` | Hero copy, seasonal decoration, booking placement | Simplify mobile hierarchy, shorten visible lead, prioritize one-date day-use booking, and prevent FAQ overlap. Seasonal illustration reduction can be a follow-up if not included here. |
| `src/components/sections/BookingWidget.tsx` | Shared GET booking widget on home and five other pages | Introduce a day-use-safe mode/contract rather than silently changing every consumer; expose one visible date on hero while preserving compact/full behavior elsewhere until product scope is resolved. |
| `src/components/ui/FaqPanel.tsx` | Global searchable FAQ and fixed toggle | Remove overnight IDs from `FAQ_ORDER`, correct misleading comments, delay/hide toggle over the first hero viewport, and preserve focus trap/search/contact fallback. |
| `src/content/translations.ts` | Three-locale UI dictionary | Add day-use labels (`visitDate`, topchan-oriented CTA, revised hero/nav/footer/SEO-facing copy); remove intro keys only when `LogoIntro` is deleted; update all three locales atomically. |
| `src/content/navigation.ts` | Header and footer navigation data | Remove `/nomera` from main navigation; promote prices/topchans/menu/directions/contacts using valid localized paths/fragments; keep paused room links out of public primary navigation. |
| `src/content/assistant-knowledge.ts` | FAQ answers and keyword matching | Reconcile glamping/cottage/check-in/cancellation/parking/restaurant claims with day-use-only operation; retain paused entries only as dormant data if desired. |
| `src/content/seo.ts` | Localized per-page metadata | Remove glamping/cottages from homepage description and align home title/description with day-use intent; do not broadly rewrite room-page SEO unless those pages are separately re-paused/noindexed. |
| `src/components/sections/__tests__/BookingWidget.test.tsx` | GET form/date/guest contract tests | Add explicit hero day-use assertions and ensure non-hero compatibility; replace assumptions that every variant has `checkout`. |
| `src/components/layout/__tests__/Header.test.tsx` | Header/navigation/mobile interactions | Assert season control is absent and day-use links are present; keep burger, scroll state, locale, and `/bron` tests. |
| `tests/e2e/responsive.spec.ts` | Cross-viewport smoke, performance, booking reachability | Test one-date hero flow, first-screen visibility, no FAQ/CTA overlap, touch targets, and no horizontal overflow; use feature environment during development. |
| `tests/e2e/qa-audit.spec.ts` | Live accessibility, SEO, JSON-LD, links | Update the hard-coded `LodgingBusiness` expectation if schema changes; add day-use content/nav assertions and ensure hidden overnight links are absent from primary navigation. |

### Must delete (1 file)

| File | Reason |
|---|---|
| `src/components/ui/LogoIntro.tsx` | The requested immediate-entry experience conflicts with a blocking 3.2-second modal intro. Once layout and CSS references are removed, retaining this 300-line unused component adds drift and maintenance cost. |

### Must create (1 file)

| File | Purpose |
|---|---|
| `src/components/ui/__tests__/FaqPanel.test.tsx` | Cover curated day-use order, absence of overnight questions, delayed mobile toggle, search, Escape/focus restoration, and contact fallback. |

### Optional modifications / extractions

These are useful but should not block the minimum redesign unless the final task explicitly includes them.

| File | Optional work |
|---|---|
| `src/components/sections/HeroSlideshow.tsx` | Reduce slideshow motion, make localized alt text data-driven, or use one stronger photo. It can remain unchanged if automatic seasonal photography is retained. |
| `src/components/effects/SnowParticles.tsx` | Remove or reduce winter decoration to match the calmer year-round direction. |
| `src/components/ui/SeasonToggle.tsx` and its test | Delete as dead code after Header stops rendering it. `SeasonDetector` can remain for automatic season selection. |
| `src/components/ui/SeasonDetector.tsx` | Remove persisted manual override logic only if the product wants strictly automatic season selection. |
| `src/components/sections/PhotoMarquee.tsx` | Remove from composition or convert to a calmer static story strip; component deletion is optional if it remains reusable elsewhere. |
| `src/components/sections/BentoGallery.tsx` | Re-curate as the single gallery/story section after removing duplicate visual strips. |
| `src/components/sections/LeisureShowcase.tsx` | Adapt headings and card order into “Choose your day” rather than create a parallel card system. |
| `src/components/sections/PriceList.tsx` | Add section ID, tighten mobile density, and move hard-coded localized copy into content; the underlying price data need not change. |
| `src/content/pricing.ts` | Change only if the operator updates actual prices/inclusions. Existing 6-item contract is reusable. |
| `src/content/home-showcase.ts` | Reuse or reduce to a single “how the day unfolds” story; no need if content is moved into a new module. |
| `src/content/images.ts` | Add keys only if newly supplied photography arrives. Existing real `gal*` assets cover the proposed story. |
| `src/components/sections/DayJourney.tsx` (new) | Optional extracted timeline/photo-story section: arrive → settle in → cook/eat → walk → finish the day. |
| `src/components/sections/FinalBookingCta.tsx` (new) | Optional reusable closing conversion block before FAQ/map/footer. |
| `src/content/home-day-use.ts` (new) | Optional typed, localized home-only story data to reduce inline locale ternaries in `page.tsx`. |

### Intentionally untouched in this task

| File/group | Why it should remain untouched |
|---|---|
| `src/app/[locale]/bron/page.tsx` | Active Exely host page; homepage redesign should only change how guests arrive. |
| `src/components/sections/ExelyBookingEngine.tsx`, `src/components/ui/BookingEngineSlot.tsx`, `src/components/ui/HideOnBron.tsx` | Stable Exely host/failure/distraction contracts. |
| `src/content/rooms.ts`, `src/app/[locale]/nomera/[slug]/page.tsx` | Paused accommodation is explicitly retained for future return; do not delete data or detail pages. |
| `src/components/sections/BookingRequestForm.tsx`, `src/app/[locale]/contact/page.tsx` | Broader contact/Exely chooser behavior is inconsistent but outside a homepage-only change; track separately unless scope expands. |
| `src/app/actions/contact.ts`, `src/components/layout/ContactForm.tsx` | Footer inquiry delivery is unrelated to visual homepage composition and currently has passing tests. |
| `src/components/ui/DatePicker.tsx`, `GuestSelect.tsx` and tests | Reusable hidden-input controls already cover localization, serialization, Escape, selection, and 1..8 guests. |
| `src/content/services.ts` | Contrary to the stale note in `AGENTS.md`, current service records are largely day-use aligned and reusable. |
| `src/content/contacts.ts`, `integrations.ts`, `src/lib/maps.ts`, `MapBlock.tsx` | Address, 08:00–18:00 schedule, coordinates, map, and contact actions remain valid. |
| `src/content/attractions.ts`, `/place` | Nearby attractions remain part of the proposed story. |
| `src/i18n/*` | Locale routing itself does not need redesign; only fragment construction may need a small helper if anchors are chosen. |
| `public/images/resort/**` | No asset deletion. CGI and paused-stay photos must remain available but not masquerade as current day-use features. |
| Exely context/IDs | `BE-INT-chimgandarbaza-uz_2026-06-24`, `#be-booking-form`, and `EXELY_ROOM_TYPE` must stay stable. |

## Reusable patterns and components

- **Price presentation:** `PriceList` already expresses weekday/weekend pricing, inclusions, what to bring, and a CTA in the correct brand language.
- **Day-use service content:** `services.ts` has five focused records: topchan, outdoor cooking, picnic, kitchen menu, and nearby mountain activities.
- **Editorial story data:** `homeShowcase` already contains day-use copy for territory, topchan, and nearby mountains.
- **Map/contact close:** `MapBlock` combines schedule, address, directions, direct actions, and lazy map embed.
- **FAQ rich results:** `Faq` plus `FaqJsonLd` already renders a page section; it should be kept consistent with the global `FaqPanel` knowledge set.
- **Real photo library:** use `galTopchanInside`, `galTopchanPeaks`, `galTopchanRow`, `galMangalFire`, `galKazanStone`, `galFoodServing`, `galWaiterPlov`, `galKidsSwing`, `galPathway`, `galTerritoryPanorama`, and `galMountainView`.
- **Design tokens:** retain `--paper`, `--surface*`, `--ink`, `--forest*`, `--sun*`, `--line*`, and shadow/easing tokens. The proposed “modern Uzbek mountain dacha” direction is achievable without a new design system.
- **Accessibility patterns:** Header scroll state, modal/focus trap in FAQ, `prefers-reduced-motion`, hidden standard form inputs, skip link, and minimum-height CTA controls should be preserved.

## Inconsistencies with `AGENTS.md`

These are not small documentation errors; they affect the target architecture and release decision.

| `AGENTS.md` says | Current `master` does | Impact |
|---|---|---|
| Overnight stays are paused and `/nomera` is removed from main nav | `/nomera` is in main and footer nav; homepage renders `RoomCatalog`; rooms page is indexable | Homepage must explicitly hide overnight promotion; operator should confirm whether the later commits intentionally superseded the guide. |
| `/nomera` is a coming-soon noindex page | It is a live, indexable room catalogue | Outside-home SEO/nav behavior needs a separate decision; do not silently delete it in this task. |
| `/bron` contains Exely slot above a request-form fallback | `/bron` contains only the active Exely booking engine; request chooser is on `/contact` | Preserve the current live engine, not the stale described fallback. |
| Exely waits for env-gated embed code | A hard-coded Exely context and loader are active; env-gated `ExelyWidget` is unused | `ExelyWidget.tsx` is not an integration point for this redesign. |
| Telegram plus email delivery, both best-effort | `submitContact` explicitly removed Telegram and reports failure unless email is sent | Do not base homepage conversion messaging on the stale delivery model. |
| `FAQ_ORDER` hides glamping/cottage/check-in/cancellation | It includes all four | Must fix to avoid contradicting day-use positioning. |
| `rooms.ts` is paused content | Glamping is treated as available/bookable; cottage has no `available:false`, so both are bookable | Hide promotion without destroying retained data; resolve availability separately. |
| `/services` may still advertise pool/padel/playground | Current `services.ts` is already day-use focused | Reuse it; the guide's open issue is stale. |
| FAQ knowledge is partly stale | It contains both “day-only/no overnight” and active overnight/cancellation answers | This is a direct customer-facing contradiction and a must-fix content risk. |
| Schema/site identity implies day-use venue | Layout emits `LodgingBusiness` with Glamping amenity | Structured data should match the final confirmed operating model. |

## Integration points and migration risks

### 1. Product-state conflict — high

The latest code history appears to intentionally re-enable stays, while the supplied repository instructions explicitly say they are paused. Implementation must treat the user's current day-use request as authoritative for the homepage, but a release note should call out that this reverses recent public-facing work. Do not infer deletion of the overnight product.

### 2. One-date Exely handoff — high

The browser GET form and Exely loader are only loosely coupled through URL query parameters. There is no local adapter or documented schema validation. Before merging:

1. use a feature environment with the actual Exely loader;
2. submit a day visit using one visible date;
3. confirm selected date, guests, and day inventory arrive correctly;
4. confirm back/refresh/locales retain or safely reset state;
5. only then freeze the new query contract in tests.

### 3. Global navigation anchors — medium/high

The proposed menu includes homepage concepts rather than only pages. `localizePath(locale, "#prices")` would generate an invalid-looking pathname (`/{locale}/#prices` behavior must be intentionally constructed), and Header's active-state logic compares `pathname`, which excludes fragments. Recommended pattern: store explicit paths such as `/#prices` and teach a small helper/header branch to produce `/${locale}#prices`, while non-home clicks navigate home plus fragment.

### 4. Structured data and SEO — medium/high

Changing the visible offer but leaving glamping/cottage in metadata or `LodgingBusiness` creates search-result mismatch. Conversely, changing only global schema can affect every locale/page and the existing E2E test. Choose the most accurate schema type with SEO review; do not guess amenities.

### 5. Intro removal — medium

Partial removal can blank the site. Delete head gate, component mount/import, CSS gates, and translation keys in one atomic change, then test initial paint with JS enabled, reduced motion, and a throttled bundle.

### 6. Shared `BookingWidget` — medium

It is used on hero plus `/about`, `/nomera`, `/place`, `/services`, and service detail pages. A global removal of `checkout` would change all of those flows. Add an explicit day-use variant/mode or keep the visual change scoped to `variant="hero"` until other pages are repositioned.

### 7. Mobile fixed controls — medium

FAQ and sticky booking use independent visibility logic and adjacent z-indexes. Test 320px width, safe-area insets, open FAQ, calendar open, guest picker open, mobile menu open, and scroll threshold transitions. A shared collision policy is safer than offsets tuned by eye.

### 8. Performance — medium

The homepage preloads an 850KB hero JPEG and then immediately loads multiple animated gallery rows. Consolidating galleries should improve performance, but new client animation or oversized images can reverse the gain. Keep the hero photo preload aligned with the actual first slide and retain lazy loading below the fold.

### 9. Content duplication — medium

Day-use facts exist in `translations.ts`, `pricing.ts`, `home-showcase.ts`, `services.ts`, `faq.ts`, and `assistant-knowledge.ts`. Avoid adding another untyped inline copy block. If new story copy is substantial, create a typed `home-day-use.ts` content module with all locales.

## Suggested test strategy

### Unit/component tests

1. `BookingWidget` hero/day-use mode:
   - GET action ends in `/{locale}/bron`;
   - one visible date picker and `input[name="checkin"]`;
   - no visible checkout control in day-use mode;
   - guests defaults to 2 and supports 1..8;
   - validated `room-type=5075762` is serialized if Exely requires it;
   - compact/full legacy variants retain their documented fields.
2. `Header`:
   - no season-toggle control in desktop navigation;
   - primary nav has no `/nomera` item;
   - home-fragment links resolve correctly from both `/ru` and `/ru/contact`;
   - mobile menu still locks/unlocks scroll and closes after navigation;
   - locale switch preserves the non-fragment pathname safely.
3. `FaqPanel` (new test file):
   - overnight question IDs never render in default curated list;
   - toggle is absent/hidden before the hero threshold and appears afterward;
   - search matches question, answer, and keyword fallback;
   - Escape closes panel and restores focus;
   - empty results expose contact fallbacks.
4. Homepage server composition smoke:
   - exactly one `h1`;
   - price/topchan/food/directions section IDs are unique;
   - no `RoomCatalog` or `MasterPlan` public promotion on the homepage;
   - final CTA points to localized `/bron`.
5. Translation/type checks:
   - compile-time all-locale parity remains the primary guard;
   - add direct assertions for high-risk CTA/date labels if copy keys are refactored.

### Integration/E2E tests

1. Run mobile/tablet/desktop against a preview via `E2E_BASE_URL`, not production.
2. At 320×568 and iPhone 13 sizes, assert hero title, lead, visit date, guest trigger, and CTA are usable without overlap.
3. Open DatePicker, GuestSelect, mobile menu, and FAQ independently; assert no clipped popup and correct Escape/focus behavior.
4. Submit the hero day-use form and verify URL parameters and Exely's selected day inventory/date/guest state.
5. Verify primary navigation fragment scrolling from home and from a secondary page in `ru`, `uz`, and `en`.
6. Run Axe serious/critical and color-contrast scans on all three home locales.
7. Preserve performance gates: no horizontal overflow, LCP under 4 seconds, CLS under 0.25, DOMContentLoaded under 3 seconds.
8. Assert the homepage primary nav and visible homepage copy do not advertise rooms/glamping/cottages.
9. Validate JSON-LD parses and matches the approved day-use business type/amenities.
10. Verify `/bron` still renders `#be-booking-form`, hides footer/FAQ, and falls back to direct contacts after loader failure.

### Manual/visual QA

- Real-photo authenticity: no CGI or paused lodging presented without an explicit future/visualization label.
- The “modern Uzbek mountain dacha” direction is visible through topchan, kurpacha, fire, kazan, food, wood/stone, people, and mountain context—not through generic hotel-room imagery.
- Hero and navigation remain legible on every summer slide and the winter photo.
- Reduced-motion users see all content immediately and do not receive autoplay-dependent information.
- Russian, Uzbek, and English line wrapping is checked at 320, 390, 768, 1024, and 1440 widths.

## Recommended implementation sequence

1. Confirm product source of truth and Exely's one-date day-use query behavior.
2. Update content/navigation/SEO/FAQ contracts across all locales.
3. Remove the intro atomically from layout, CSS, translations, and component tree.
4. Add an explicit day-use booking mode and tests without changing all shared widget consumers.
5. Recompose the homepage from existing day-use sections; extract only the day-journey/final-CTA pieces that need their own components.
6. Adjust Header and FaqPanel mobile behavior, then run component/a11y checks.
7. Run type check, full Vitest, preview E2E, visual QA, and live Exely verification before any `master` push.

## Definition of safe handoff

- The homepage communicates only the confirmed day-use offer above the fold and through its primary navigation.
- One clear booking action reaches the existing Exely day inventory with verified parameters.
- Paused room data/pages remain in the repository but are not promoted from the redesigned homepage or primary nav.
- The blocking logo intro and manual season switch are absent from the user journey.
- FAQ, metadata, JSON-LD, and visible copy tell the same operating story.
- TypeScript and all 169 baseline tests remain green, with new coverage for the changed day-use, FAQ, and navigation behavior.

