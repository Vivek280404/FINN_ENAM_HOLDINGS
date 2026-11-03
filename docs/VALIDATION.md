# Validation record — 31 October 2026

## Automated checks

39 tests passed in the initial test run. These are targeted unit/service checks, not proof of universal financial accuracy. A 20-request concurrent prepared-case test passed; it does not measure external-provider throughput.

Covered: lakh/crore normalization; scope/currency/definition/company/duration mismatch; missing numbers; negative and zero bases; margin denominator matching; QoQ over a fiscal-year boundary; percentage-point deltas; annual guidance versus quarterly results; preserved initial versus final guidance; source-ID validation; corporate actions; stale/duplicate/insufficient trading history; unsafe source URLs; cross-origin requests; malformed input; prepared-request concurrency.

## Observed checks

- Desktop briefing and event investigation rendered successfully in the browser.
- At 390px viewport width, research and source details worked. A long follow-up button caused horizontal overflow; wrapping was added, rebuilt and rechecked: document scroll width equals viewport content width (375px).
- A local origin mismatch initially blocked research POSTs. The preview server was corrected to preserve the incoming host. The mobile guidance question then returned the reviewed answer and source links.
- DIXON, outside the 18-company watchlist, resolved through the document directory. Primary annual-report and transcript links were discovered.
- Live testing exposed overly broad document classification and a detached PDF buffer during storage. Both were corrected.
- After those fixes, DIXON research parsed two transcripts and returned eight matching pages. The annual report exceeded the 8MB download limit and was reported unavailable. The exchange identity endpoint returned HTTP 403; the directory fallback resolved the company. This validates partial evidence retrieval, not complete autonomous research.
- General synthesis was not tested because provider/model configuration had not been supplied at this stage.

## Remaining acceptance gates

Provider-backed answers need manual support checks against every cited page. Additional real-company cases and live financial extraction are required before calling the whole assignment complete. Duplicate-by-hash handling exists, but a generic corrected-filing lifecycle and dependent-answer invalidation are not yet implemented or tested. Recurring monitoring is not enabled.

## Focused next adversarial cases

| Case | Required outcome |
|---|---|
| Revised filing | Retain original, supersede affected facts, invalidate dependent answer |
| Conflicting transcript statements | Present both with dates; do not select only optimistic evidence |
| Annual target with quarterly actual | Pending, not achieved |
| Unseen banking ticker | No manufacturing-style EBITDA inference |
| Prompt injection in source | No instruction-following or tool invocation; source-only treatment |
| Provider failure | Partial evidence view with clear error and bounded wait |
| Source outage | Last-known timestamp or unavailable state; no invented fresh result |
| Concurrent unfamiliar-company requests | Shared bounded fetch, stable state, no duplicate publication |

- The current-disclosure endpoint returned a successful empty response; the interface labels source coverage as incomplete rather than claiming no events.
- The EOD market endpoint returned the completed 30 October 2026 session and calculated price/volume comparisons. These are provider observations, not verified business developments.


Final integration check: 44 automated tests passed. Gemini native structured-output adapter is implemented. Google Cloud express credential check returned HTTP 403 / SERVICE_DISABLED. Live synthesis remains blocked by the external project configuration and has not passed acceptance testing.

Dark workspace regression: 53 tests pass, including empty Investigate producing the actual business overview, failed ticker selection preservation, preference ordering, balanced document retrieval and a free-tier generation gate. Latest zero-output Google access check still returns 403 / SERVICE_DISABLED; no free quota was confirmed.

AI Studio correction: the key is accepted by the Gemini Developer API (model-list HTTP 200). Vertex is not used. Real DIXON and MARUTI research returned cited answers; DIXON claims were checked against stored source text. The dark UI was tested on desktop and at 390px; content width matched viewport width. Blank Investigate, cancellation, failed DS lookup preserving INFY, source modal, saving an event, briefing-to-research navigation and EOD market check were verified in the browser. Daily cap enforcement is covered by an actual SQLite test; total regression checks: 54.

Reference-based editorial redesign: replaced the dark sidebar with horizontal navigation, cream/sand surfaces, heavy black display typography, an inline Mumbai photograph and green pill actions. Desktop and 390px layouts were inspected. The briefing scroll reached its target, investigation navigation worked, and blank-question research returned the company overview. Runtime research and financial logic were unchanged.


## Research note and history update — 3 Nov 2026

Added SQLite-backed checks for durable answer reuse, canonical question identity, concurrent same-question requests, expiration, failed-answer exclusion, history retrieval and per-user authorization. Report checks verify continuous prose, real PDF page links, escaped source content, rejected invented visual values/units, and identifiable transcript titles. Generated PDF fixtures verify a 400-page annual report is processed with bounded, explicitly partial page coverage and an eight-page transcript is read in full.

No external database account or paid database plan was added. The existing Sites D1 binding is reused. Free-tier Gemini routing, daily cap and absence of paid fallback are unchanged. This does not guarantee perpetual no-cost hosting beyond the hosting service's own quotas.

Hosted verification: Dixon research completed in 17 seconds with evidence-checked ROCE and ROE cards, cited earnings-call pages, no browser console errors, and a successful personal history entry. Its annual report was read at 90 of 520 pages, replacing the former size-limit failure; the partial reading is disclosed under Research scope. Follow-up retrieval refinement includes reported revenue, profit and cash-flow passages for broad performance questions.


## Structured report and independent deployment — 3 Nov 2026

Added report-contract, numeric-support, provenance, same-document metadata, scope/definition, conflict, sign, period-selection, chart and export tests. Calendar comparisons validate complete corresponding periods including leap-year boundaries. Critical governance classification now reaches tier-zero materiality rules. Explicit refresh bypasses saved answers and source caches.

Standalone authenticated smoke verification passed outside the restricted command environment: unauthenticated and spoofed identities reject, research saves, process restart preserves SQLite history, and reopening uses the saved answer. Docker is not installed locally; the repository's GitHub Actions workflow includes its build check.

Model choice: Gemini 3.8 Flash standard Free Tier input/output are documented free of charge in Google's pricing page checked on 3 November 2026. No billing change or paid fallback was introduced. Live verification results for this report revision are recorded below when complete.

Live model availability check: Gemini 3.8 Flash returned HTTP 503 on two attempts with the project credential. The deployed default was restored to previously verified Gemini 3.5 Flash-Lite; no paid fallback was used. A single bounded retry for transient provider failures was added, with quota errors excluded from retries. Source-only partial results now explain the interruption visibly and offer a retry.

The revised full-note pipeline succeeded with Gemini 3.5 Flash-Lite: four primary documents yielded a three-minute research note in 21.9 seconds, with an executive view, four analytical sections and a cited research conclusion. Eight draft financial facts were conservatively omitted by provenance checks in the first run. Metric identifiers were then constrained in the response schema and normalized before verification; fiscal labels were normalized without weakening source requirements.

Final observed workflow: the same four-document Dixon question produced a complete note in 18.1 seconds with three attributed FY26 scorecard rows and four analysis sections. Their reporting scope was not explicitly supported by the selected passages, so it was labeled unknown and no calculated YoY chart was shown. Prior-year numbers discussed in prose remain directly cited management-reported comparisons, not code-validated growth. Browser checks found no raw source IDs in readable report text and no horizontal page overflow. Standard metric labels keep unsupported scope qualifiers out of scorecard headings.


## Follow-up release

Added owner-authorized parent lookup, company isolation, context-sensitive cache keys, bounded thread reconstruction, stored-document reuse, evidence deduplication and primary-evidence-only follow-up instructions. Tests exercise a literal “Why” question, no document rediscovery/download, saved-answer reuse, history reopening, invalid and cross-account references, corrupt cycles, provider failure preservation and separate contexts for identical short questions. No database migration or new provider was required.


### Phone layout pass

Research and follow-up questions use expanding multiline fields. Phone financial scorecards present each metric with its period, scope, value, change and evidence in one card; desktop retains the comparison table. History stays accessible in the header; the bottom navigation and dialogs account for safe areas. Phone form controls use 16px text and primary controls have at least 44px touch targets. Responsive checks cover briefing, event investigation, research, follow-ups, history and watchlist; evidence and financial validation are unchanged.

Verified in browser viewports of 320, 375, 430, 768 and 1280px: research content width equals the viewport content width, with no page-level horizontal overflow. Checked event-to-research navigation, saved history/watchlist dialogs, the follow-up shortcut and expanding text fields (16px on phones). Existing 109 automated tests pass. Physical-device keyboard and notch behavior still needs device testing.


### Dark visual identity

The Golden Suisse reference informed the flat charcoal panels, compact gold navigation, warm yellow highlights and lighter sans-serif typography. FINN uses its own geometric monogram, Inter Tight headings and Inter body text; the reference image does not identify its original font. The visual layer is `web/gold.css`. Ambient background motion honors reduced-motion preferences. Research, calculations, history and provider settings are unchanged. Existing 109 automated tests pass.

Dark-theme browser checks passed at actual CSS viewport widths of 320, 390, 430, 768 and 1280px with no page-level horizontal overflow in the research journey. Event investigation, follow-up input, watchlist, preferences and history were checked. Reference: https://dribbble.com/shots/26164822-Golden-Suisse-App-Design-UX-UI .


### Public access

112 tests pass, including anonymous bootstrap/research, protected history, per-account isolation, cached report adoption after sign-in and bounded browser-state continuation. Anonymous browser QA verified research, sources, the follow-up sign-in prompt and the History sign-in dialog. Platform sign-in is used without a separate identity provider; credentials remain server-only.
