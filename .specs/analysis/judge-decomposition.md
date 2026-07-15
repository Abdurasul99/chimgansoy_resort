# Decomposition Judgment — Day-use Homepage

**Verdict: PASS**  
**Weighted score: 4.58 / 5.00**  
**Threshold: 3.50 / 5.00**  
**Scope:** only `## Implementation Process`, lines 358–655 of `.specs/tasks/draft/redesign-day-use-homepage.feature.md`.  
**Confidence:** High.

## Weighted assessment

| Dimension | Weight | Score | Weighted |
|---|---:|---:|---:|
| Step Quality | 0.30 | 4.30 | 1.290 |
| Testable Success Criteria | 0.25 | 4.60 | 1.150 |
| Risk Coverage | 0.25 | 4.70 | 1.175 |
| Completeness | 0.20 | 4.80 | 0.960 |
| **Total** | **1.00** |  | **4.575 → 4.58** |

### Step Quality — 4.30 / 5.00

All nine steps state a concrete goal, file scope, dependencies, observable result, subtasks, success criteria, risks, and an S/M/L estimate. The summary and critical path make the intended order easy to follow (`:364-374`, `:634-636`). The main deduction is that steps 3, 7, 8, and 9 each combine several implementation and verification tracks despite being capped at L (`:440-461`, `:552-573`, `:581-602`, `:610-632`). There is also a sequencing ambiguity: step 4 formally depends on step 3, which depends on step 1, while the parallelism note permits visual step-4 work before the step-1 Exely gate resolves (`:442`, `:469`, `:636`).

### Testable Success Criteria — 4.60 / 5.00

Every step names exact create/change/delete/read-only paths, and the subtasks include concrete boundary values, viewport sizes, commands, environments, and performance thresholds (`:382-397`, `:440-455`, `:581-596`, `:610-626`). Observable outcomes are consistently linked to AC identifiers. A few manual checks do not identify the browser/OS, screen-reader or audit tool, expected evidence format, or responsible tester (`:424`, `:480`, `:622`).

### Risk Coverage — 4.70 / 5.00

The process covers Exely uncertainty, shared booking regressions, fixed/popover collisions, localization, SEO/schema, preview-only E2E, deployment, and rollback with actionable mitigations and fallbacks (`:395-401`, `:457-459`, `:569-571`, `:598-600`, `:628-650`). The remaining weakness is governance of external gates: required parties are named, but deadlines, escalation owners, and the canonical approval-evidence location are not.

### Completeness — 4.80 / 5.00

The decomposition covers all material architecture and delivery areas: shell/content/i18n, booking state, hero, navigation and homepage IA, FAQ/accessibility, SEO/performance, tests, release, and preservation of paused overnight assets (`:362-374`, `:405-632`). It also includes a summary table, explicit critical path and join, optional work outside the critical path, approval gates, and a release Definition of Done (`:634-655`). The handoff is slightly incomplete because accountable roles and canonical evidence locations are not assigned for approvals and manual audits.

## Gaps (prioritized)

1. **Split broad L-sized steps.** Steps 3, 7, 8, and 9 bundle multiple implementation, integration, audit, and release concerns (`:440-461`, `:552-573`, `:581-602`, `:610-632`). Split them into independently testable units with explicit joins so the stated two-to-three-day L ceiling remains credible.
2. **Resolve the step 1/3/4 ordering ambiguity.** Dependencies require step 1 → 3 → 4, but the critical-path note permits part of step 4 while step 1 is unresolved (`:442`, `:469`, `:636`). Define an Exely-independent visual substep and a booking integration substep.
3. **Make manual evidence reproducible.** The throttling, contrast, cross-browser, screen-reader, and reduced-motion checks lack consistent platform/tool/assertion/evidence details (`:424`, `:480`, `:622`). Name the test matrix and PR-relative output location.
4. **Operationalize external approval gates.** The plan identifies approvers and gates but not a decision deadline, escalation path, accountable role, or canonical record location (`:384`, `:643-651`). Add those fields to each gate.

## Self-verification

- Judged only lines 358–655; AC identifiers were assessed for explicit linkage, not by importing claims from their definitions elsewhere.
- Checked summary dependencies against detailed dependencies and the critical-path statement; this reduced Step Quality to 4.30.
- Distinguished named checks from reproducible checks; underspecified manual audits reduced Testable Success Criteria to 4.60.
- Weights total 1.00; raw total is 4.575 and only the final total was rounded.
- The score is below 5.00 because the cited sizing, sequencing, reproducibility, and approval-governance gaps are substantive.
- Four non-duplicative gaps are reported, within the maximum of five.
