# Architecture Overview judgment — revised

**Verdict: PASS**  
**Weighted score: 4.6/5.0**  
**Pass threshold: 3.5/5.0**

Scope: only `## Architecture Overview` in `.specs/tasks/draft/redesign-day-use-homepage.feature.md`, judged against the redesign research and codebase impact analysis.

| Criterion | Weight | Score | Weighted contribution | Judgment |
|---|---:|---:|---:|---|
| Solution Strategy Clarity | 0.30 | 4.6/5.0 | 1.38 | The strategy now defines the safe booking boundary, current failure behavior, fragment routing, schema decision, and accessibility scope. |
| Reference Integration | 0.20 | 4.6/5.0 | 0.92 | It integrates the research and the codebase-specific contracts without deleting paused inventory or disturbing the active Exely host. |
| Section Relevance | 0.25 | 4.7/5.0 | 1.18 | The section remains focused on architecture, component/content ownership, tradeoffs, risks, rollout, and rollback. |
| Expected Changes Accuracy | 0.25 | 4.4/5.0 | 1.10 | Required files now cover the accessibility work and schema correction. One fallback statement and one test-file reference remain imprecise. |
| **Total** | **1.00** |  | **4.58/5.0 → 4.6/5.0** | **PASS** |

## Re-evaluation of the five prior gaps

| Prior gap | Result | Evidence in the revision |
|---|---|---|
| Safe booking query migration | Resolved | The UI keeps `checkin` and `guests`, rejects new `date`/`product` keys without a migration plan, omits synthetic `checkout`, and adds `room-type=5075762` only after an Exely contract test. |
| Actual failure-contact and notification scope | Resolved with one wording defect | The contract preserves the current `BookingEngineSlot` direct-contact failure state, does not promise an unscoped server-action fallback, keeps current email routing, and treats Telegram restoration as separate work. |
| Localized fragments and active state | Resolved | The section specifies ``${localizePath(locale, "/")}#prices``, supports navigation from secondary pages, and explicitly avoids deriving active fragments from `pathname`. |
| Structured-data decision | Resolved | It replaces the misleading lodging/glamping schema with factual `LocalBusiness`, subject to SEO review, or removes the disputed block if no accurate type is approved. |
| `DatePicker`/`GuestSelect` accessibility scope | Resolved | Both components enter the required modification list, their APG-style keyboard/focus/ARIA contract is explicit, and their tests must be extended. |

## Remaining gaps

1. **The risk table still promises a fallback request.** “fallback-запрос до подтверждения” conflicts with the revised Exely contract, which correctly preserves `BookingEngineSlot`’s direct-contact failure state until the fallback scope is expanded. Use the same failure-state wording in both places.

2. **The test inventory should name the existing control tests.** Replace the generic instruction to add or extend tests with `src/components/ui/__tests__/DatePicker.test.tsx` and `src/components/ui/__tests__/GuestSelect.test.tsx` so the required file set is implementation-ready.

## Overall assessment

The revision fixes the material integration defects from the first review. Its contracts, tradeoffs, required and optional files, risk controls, rollout, and reverse-commit rollback now form a credible implementation architecture. The two remaining defects are minor documentation precision issues and do not block planning.
