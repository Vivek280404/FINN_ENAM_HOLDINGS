# FINN functionality audit — 31 October 2026

This is a working prototype with explicit limits. Passing unit checks does not establish that every requested investment workflow is complete.

| Area | Status | Evidence / limitation |
|---|---|---|
| Mobile-first briefing, investigation and research | Working | Dark interface; connected navigation; responsive layouts |
| Investigate without entering a question | Fixed | Defaults to business, revenue and cash-flow overview; covered by client and service tests |
| Invalid questions | Working | Visible validation; no silent native-form block |
| Failed ticker lookup | Fixed | Unverified identities do not replace the current company |
| Loading, timeout, cancellation and retry | Working | Visible status, 45-second browser bound, cancellable research/lookup and retry action |
| Portfolio | Working demo scope | 18 NSE symbols across sectors; no real holdings or assumed weights |
| Briefing time windows and routine disclosures | Working | 24-hour, 7-day and 30-day filters; routine items expand separately |
| Current portfolio filing discovery | Partial | NSE source availability and returned response window limit coverage; empty response does not prove absence |
| Company-relative financial materiality | Partial | Deterministic ratio helper exists; live filings do not yet automatically extract and validate event amounts and denominators |
| Lightweight investor preferences | Working | Performance, management and governance preferences affect ordering; critical-risk tier stays visible |
| EOD price and volume checks | Working on request | Configurable thresholds, prior 20-session baseline, stale/missing/liquidity/corporate-action safeguards |
| Continuous alerts or external notifications | Not implemented | Checks occur when requested; no claim of intraday or background monitoring |
| Financial comparison validation | Working functions | Units, scope, currency, periods, definitions, non-positive bases and percentage points are tested |
| Sector-specific automated financial analysis | Not implemented | Bank/NBFC EBITDA assumptions are avoided; dedicated extraction/analysis templates remain to be built |
| Guidance revision history | Working reviewed case | Infosys: original, three revisions and final FY26 outcome; dates and primary links retained |
| Guidance extraction for arbitrary companies | Not complete | Generic primary-document retrieval works; automatic ledger creation and full-period actual matching are not implemented |
| Unfamiliar ticker research | Working evidence retrieval | DIXON discovery and transcript parsing verified in earlier live checks; source coverage can be partial |
| Question-aware evidence retrieval | Improved, partial | Pages are balanced across selected documents; complete per-quarter and contradictory-evidence coverage is not guaranteed |
| Document deduplication | Working by content hash | Identical bytes reuse extraction; originals and source locations are retained |
| Generic event threading and corrected-filing invalidation | Not complete | Historical guidance revisions are preserved, but generic dependent-answer invalidation remains unimplemented |
| Sources and PDF page references | Working | Primary document links and retrieved page locations are inspectable |
| Full claim-level entailment verification | Partial | Citation IDs are validated; reviewed case checked manually; general semantic verification remains a release gate |
| Gemini native adapter | Working through AI Studio | Developer API accepted the key; real cited answers returned for DIXON and MARUTI. Vertex is not used. |
| Free-only generation | Guarded | AI Studio free-tier model allowlist, 20 model calls per day, 30-minute answer cache, 1,600 output-token cap, and no automatic paid fallback |
| Repository and submission package | Partial | Source is saved to the Sites repository; an ENAM GitHub repository, covering email and build-history package are not yet submitted |

## Automated regression coverage

54 tests pass: financial comparability and calculations, guidance periods and definitions, market safeguards, source URL restrictions, request validation, citation IDs, Gemini error handling, free-tier configuration gate, default Investigate behavior, ticker selection and preference ordering, balanced document retrieval, and concurrent prepared-case requests.

## Remaining submission priorities

1. Completed: connect AI Studio and verify live cited research. Google billing settings were not changed.
2. Validate three to five research demonstration companies and capture their actual document coverage.
3. Add validated live-event financial context if time permits; otherwise disclose category-only screening.
4. Finish GitHub and the covering email with accurate limits and build-history links.

Latest live checks: DIXON returned four source-linked claims in approximately 18 seconds. MARUTI returned a cited answer in approximately 22 seconds after company-host/CDN transcript discovery was repaired. Oversized annual reports remain explicitly unavailable; transcript-based answers do not claim full annual-report coverage.

