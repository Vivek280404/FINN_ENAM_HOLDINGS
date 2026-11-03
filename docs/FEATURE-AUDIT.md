# Assignment coverage — 3 November 2026

This audit compares the supplied ENAM brief with the implemented prototype. The brief explicitly treats feature examples as a menu and values one or two reliable workflows over completeness. It does not require chat, voice, a native app, or every financial output.

| Requirement / workflow | Implemented behavior | Boundary |
| --- | --- | --- |
| Mobile-first working prototype | Responsive briefing, event investigation and company research; black/gold interface; phone navigation and touch controls | Responsive web, not an app-store package |
| Mock portfolio of 15–20 companies | 18 NSE companies across sectors | Watchlist, not connected brokerage holdings |
| Windowed portfolio digest | 24-hour, 7-day and 30-day views; prioritised disclosures; routine items collapsed; event-to-research navigation | Current feed depends on the exchange response window; historical replay is explicitly labeled |
| Triggered observations | Configurable EOD price/volume thresholds and on-request market checks | No continuous background monitor, device push or email alerts |
| Announcement judgment | Category screening, investor interests and protected critical-risk tiers | Live relative financial materiality is not automatically extracted |
| On-demand company research | Company discovery, annual reports/transcripts, executive view, analysis, risks, financial facts, conclusion and next checks | Evidence can be partial; no claim of exhaustive multi-period research |
| Chat / interaction | Ask a follow-up beneath a report; company and thread retained; earlier turns reopen from history | Contextual research conversation, not a general-purpose chatbot; chat is optional in the brief |
| Guidance versus delivery | Reviewed Infosys original guidance, revisions and comparable full-year outcome; deterministic comparison rules | Generic automatic guidance-ledger extraction is not complete |
| Research generalises beyond demo | Dynamic NSE ticker lookup and primary-source discovery; Dixon is outside the 18-company watchlist | Missing reports and blocked publishers remain visible |
| Three demonstration companies | Infosys, Dixon and Maruti have returned live cited research | Only Infosys has a manually reviewed full guidance timeline; see VALIDATION.md |
| Primary-source discipline | Research evidence from company/exchange reports and transcripts; directory used only to discover links | No broker/news enrichment for research; citations are inspectable, not an independent audit |
| Financial reliability | Period/unit/currency/scope/definition/sign checks, compatible calculations and chart eligibility | Unsupported facts are omitted; sector-specific completeness is not guaranteed |
| Efficiency and persistence | Neon PostgreSQL; 24-hour answer cache; document/discovery caches; in-flight reuse; persistent usage counter | Free-provider availability and daily 20-call cap remain |
| Failures and latency | Live progress stream, bounded timeouts/retry, visible provider failure reason, previous report preserved | Google can still return 503/429; incomplete answers are not cached as completed |
| Public delivery | Render app and public GitHub; no visitor sign-in; server-side credentials | Free hosting may wake slowly |
| Covering note | Template in SUBMISSION.md covers decisions, exclusions and next work | Candidate must send the email |
| Actual coding-agent build history | Still required separately | BUILD-DECISIONS.md and Git commits are not substitutes for a real conversation export/share link |

## Deliberately outside prototype scope

Continuous monitoring, external notifications, management biography enrichment, complete quarterly Revenue/EBITDA/PBT/PAT extraction for every live event, automatic corrected-filing invalidation, universal guidance reconciliation, OCR, valuation/price targets and portfolio-position attribution.

The app must not be presented as implementing all of these. The strongest demonstrations are briefing → event → guidance investigation, and company research → cited answer → contextual follow-up → saved history.
