# Investor review — 3 November 2026

The review inspected the implemented application, not just the proposal. The screenshots revealed leaked source IDs; source inspection also found a short-answer prompt, generic numeric cards and reporting-period risks. History and database storage were already implemented and were preserved.

| Finding | Change implemented | Remaining boundary |
|---|---|---|
| Short, unstructured answers obscure the investment argument | Structured executive view, scorecard, numbered analysis, risks, conclusion and next checks; a 550–850-word broad-note target when evidence supports it | Missing evidence is not padded to meet a length target |
| Raw citation hashes appear in narrative | Prompt separates text from citations; server and renderer strip leaked IDs, including older cached answers | Citation links identify evidence; they are not semantic proof |
| Attractive business descriptions imply investment recommendations | Server-controlled valuation boundary, conditional research stance, action-only next checks | No valuation engine, price target or personalized recommendation |
| Financial values can borrow the wrong period or scope | Exact value, period and basis passages must come from the same document; explicit period, unit, scope, definition and sign checks | Text extraction and interpretation still need review; unknown scope is labeled |
| Different ROE/ROCE periods or conflicting disclosures can be mixed | Facts retain separate periods and definitions; same-period conflicting values stay visible and cannot enter comparisons | The product does not declare which conflicting source is correct |
| Graphs imply comparisons that are not financially valid | Deterministic YoY comparisons and zero-based charts only for compatible series; negative-base conventional growth is blocked | No graphic is invented when a comparable series is unavailable |
| Later periods can dominate an earlier-year question | Requested periods guide retrieval context and headline/graph eligibility; prior-year comparators remain in the table | This is bounded retrieval, not proof of complete fiscal-year coverage |
| Keyword retrieval can miss cash quality and contrary evidence | Explicit financial, cash-flow, risk, guidance and basis passages, balanced across up to four calls and one report | Primary reports may still be unavailable or partially read |
| Historical shortcuts can answer a current or multi-part question | Latest/valuation/IPO/multi-part questions cannot silently receive the reviewed historical shortcut | The reviewed guidance case remains intentionally historical |
| Auditor resignation or fraud can be collapsed as routine | Critical governance/solvency classification takes precedence over results and management keywords | Magnitude ranking remains category screening until validated amount/denominator extraction |
| An answer cache can conceal newer or corrected disclosures | Visible preparation date, saved-answer label and explicit refresh that rechecks source bytes | No continuous correction watcher or automatic invalidation |
| Research cannot be carried into another workflow | Cited Markdown export and source appendix | PDF/Word research exports are not included |
| Deployment depends on platform-specific identity and database APIs | Independent Node adapter, account-free visitor cookies, persistent Neon PostgreSQL, Docker, CI and deployment guide | GitHub Pages cannot host a dynamic backend; Render free hosting can wake slowly |

## Architecture decision

Keep one application, one structured research generation call and deterministic financial/presentation validation. Focused development reviewers helped inspect deployment and financial controls. A runtime multi-agent framework would add latency, quota consumption and another layer of failure without establishing better financial evidence.

## Acceptance focus

A report must answer the actual question, identify its reporting periods, preserve financial definitions, distinguish evidence from interpretation and show why its conclusion follows. Source IDs must not leak into readable text. Unsupported numeric claims are removed. No annual-guidance conclusion can be inferred from a quarter. History must persist across restart and remain owner-scoped. Explicit refresh must replace a fresh cache entry only with a successful result.

## Still outside this release

Automatic generic guidance ledgers and revision reconciliation, a complete sector fact extractor, full semantic entailment verification, quantitative portfolio-position attribution, complete multi-quarter coverage guarantees, autonomous background notifications, OCR and a production multi-user account system for independent hosting. These are not presented as completed.


## Final investor workflow review — follow-up release

| Investor complaint | Solution implemented | Verification |
|---|---|---|
| I must repeat the company and entire question to investigate a detail | Saved research threads; server-resolved root question and recent turns; contextual follow-up form beneath the report | Context, pronoun-question, citation and cache integration checks |
| An earlier generated claim might become accepted fact when repeated | Prior discussion is labeled context; only primary passages support new financial claims | Model input separates conversation from evidence; existing financial/citation checks remain active |
| A source error or cancellation discards the report I was reading | Keep the last good report and draft, offer a contextual retry, and do not save failed follow-ups as completed research | Failure-state integration and cancellation UI checks |
| Switching companies could carry the wrong investigation | Company changes clear active context; backend rejects cross-company parent references | Owner and company-isolation checks |
| Research history is a bag of disconnected answers | Each saved follow-up retains its root/parent; reopen earlier questions and resume after reload | History/thread reconstruction checks |
| The report tells me what to check but makes me type it again | Next-check buttons and a dedicated follow-up composer keep the report's context | Render/interaction checks |

These changes finish the two main prototype journeys: discover → investigate, and research → challenge → follow up. They do not turn the demo watchlist into actual holdings, add continuous exchange monitoring, or claim full financial-document coverage. Those limits remain visible and documented.
