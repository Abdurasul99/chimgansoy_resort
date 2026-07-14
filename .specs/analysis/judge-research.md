# Research artifact evaluation

**Artifact:** `.specs/research/day-use-homepage-redesign.md`  
**Task:** Redesign the day-use homepage around the authentic Chimgan experience  
**Verdict:** **PASS**  
**Weighted score:** **4.57/5.00** (threshold: 3.50)  
**Confidence:** High

## Weighted assessment

| Criterion | Weight | Score | Contribution | Evidence-based assessment |
|---|---:|---:|---:|---|
| Resource Coverage | 0.30 | 4.6 | 1.380 | Strong mix of repository inspection, primary W3C/Next.js/web.dev documentation, peer-reviewed hospitality research, and clearly qualified Baymard evidence (`:9-20`, `:48-49`, `:130-143`). It also identifies relevant verification tools (Lighthouse, Playwright traces, axe) and field-data limits (`:96-106`, `:127`). Minor gap: those testing tools and analytics recommendations do not receive the same primary-documentation coverage as accessibility and images. |
| Pattern Relevance | 0.25 | 4.7 | 1.175 | Recommendations are directly actionable: proposed section order and navigation (`:22-36`), one-date booking flow (`:38-47`), concrete property shot list (`:63-70`), responsive rules (`:71-80`), and component-level accessibility/performance changes (`:81-105`). Verification inputs translate the findings into implementable checks (`:118-129`). |
| Issue Anticipation | 0.20 | 4.5 | 0.900 | The artifact anticipates the key failure modes: Exely's hotel-shaped model, SEO loss from shortening the page, misleading imagery, locale drift, duplicated prices, form-routing regression, sticky-control overlap, reduced motion, and field-versus-lab performance (`:107-117`). Gaps are minor: it does not explicitly call out the APG example's production/support caveat, analytics privacy/PII constraints, or reconcile the cited finding that large photos performed best without people with the people-led shot recommendation. |
| Reusability | 0.15 | 4.5 | 0.675 | The information-architecture, booking-friction, responsive, accessibility, image-loading, measurement, and verification patterns are reusable across hospitality conversion pages while retaining enough Chimgan-specific detail to remain practical (`:24-32`, `:42-62`, `:73-105`, `:119-129`). |
| Task Integration | 0.10 | 4.4 | 0.440 | The central promise, topchan/food/cooking emphasis, hours, location facts, authentic photography, `/bron` handoff, shared pricing source, three locales, and notification fallback are mapped clearly to this repository (`:5`, `:26-36`, `:42-47`, `:67-70`, `:114-117`). The deduction is for the unresolved-state warning at `:7`: the task draft already states that overnight stays are paused and Exely is out of scope (`.specs/tasks/draft/redesign-day-use-homepage.feature.md:13-15`, `:20`, `:46`, `:54`), so that warning can send implementation back to a decision the task has already made. |

**Calculation:** `(4.6×0.30) + (4.7×0.25) + (4.5×0.20) + (4.5×0.15) + (4.4×0.10) = 4.57`.

## Evidence and gaps

- Repository spot checks corroborate the high-value findings: `LogoIntro.tsx:89-90` uses 2.6/3.2-second timers; `BookingWidget.tsx:19-20,36-37` uses check-in/check-out; `HeroSlideshow.tsx:71-102` creates three CSS-background slides and nests buttons under `aria-hidden`; `PhotoMarquee.tsx:30-46` doubles each image row; and the custom selectors lack the popup roles/states described in the research.
- The three hero files total 2,305,691 bytes (about 2.20 MiB), supporting the payload statement at research line 16.
- Primary-source spot checks support the technical advice: the official Next.js 16 Image documentation recommends `preload`, `loading="eager"`, or `fetchPriority="high"` for the appropriate LCP case and explains that missing `sizes` implies `100vw`; W3C sources support the cited motion, reflow, focus, and target-size requirements.
- The hospitality evidence is relevant but should be represented with more nuance. Back et al. report that large photographs increased transportation, but also that large photographs were most effective without human presence. Lim and Jang support photo organization and headline congruence; Marder et al. support shorter text and more imagery. The synthesis at `:65-70` is directionally sound, not a complete account of those interactions.

## Revisions

No revision is required to clear the threshold. Recommended before implementation:

1. Replace the open decision at research line 7 with the resolved task scope: overnight promotion stays hidden, retained room assets/routes remain untouched, and Exely work is out of scope.
2. Add the WAI-ARIA APG warning that its example is illustrative and requires browser/assistive-technology testing; keep the artifact's native-control preference.
3. State explicitly that analytics events must exclude name, phone, message, exact visit date, and other form values, matching the task's anonymous-measurement requirement.
