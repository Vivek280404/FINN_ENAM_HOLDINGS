# Build decisions

## Audit of the earlier design

No implementation existed in the selected workspace. The earlier design already covered deterministic arithmetic, period/scope checks, primary-source citations, separate document/event identities, bounded retries and a modular backend. These were proposals, not tested functionality.

The substantive gaps were product interaction, company-relative materiality, a persistent history of guidance revisions, evidence completeness and proof that unfamiliar symbols work. The first build addresses the interaction and reviewed guidance case first; it exposes incomplete coverage instead of claiming all proposed intelligence is implemented.

## Priority order

Critical: connected mobile workflows; primary evidence; financial comparability; truthful historical/current labels; source discovery outside the watchlist; working deployment; provider integration and source-supported answers before submission.

Useful next: structured financial extraction for a second sector, facts attached to live events, event-specific denominators for acquisitions/capex/fines, generic guidance ledgers, question-planned multi-quarter evidence collection, document corrections with dependent-result invalidation, portfolio position weights, three to five research demonstrations.

Production only: independent services, distributed queues, continuous monitoring, multi-user portfolio synchronization, extensive model routing, autonomous orchestration and a vector database. Add these only for measured requirements.

## Architecture

One Worker serves the interface and request handlers. The same bundle runs locally. D1/SQLite stores relational records; R2/local disk retains original documents. A persistent cache and an in-flight request map avoid repeated work. Parsing uses unpdf. No separate search service or task orchestrator is needed for this version.

Push: request exchange announcements → filter watchlist → identify duplicate source URLs → classify → rank with transparent category rules → show disclosure and link into research. This live path does not yet compute company-relative financial magnitude. The reviewed replay demonstrates a richer result investigation and explicitly identifies its priority as editorial.

Pull: validate ticker → resolve identity and discover primary links → select up to two transcripts and one annual report → fetch, hash and parse → retrieve matching pages → return inspectable source evidence → optionally synthesize through the configured provider. The prepared Infosys workflow returns a reviewed, date-bounded analysis rather than pretending to generate it live.

Calculations stay in code. Document interpretation and synthesis use the optional provider. Citation-ID checks are mechanical, not a guarantee of semantic entailment. Full claim-level verification needs a manually reviewed evaluation set.

## Financial judgments

Materiality needs event-appropriate denominators: acquisition consideration relative to company resources, capex relative to assets or cash generation, order value relative to revenue with duration identified, fines relative to profit/equity plus qualitative risk. A ratio to revenue alone does not establish acquisition attractiveness. Unknown denominators yield unknown significance.

Bank/NBFC research needs asset quality, capital, provisions and financing context. The current version avoids fabricating these metrics; automated sector templates are deferred.

Guidance range states describe observed outcomes: within, below or above the comparable range; pending when periods differ; not comparable when definitions differ. A quarter within an annual margin range is not classified as annual achievement. Qualitative commentary is never numerically scored. The timeline preserves initial and revised guidance separately.

## Next implementation order

1. Connect the user's provider and verify response format, source support, latency and cost.
2. Implement source-linked structured extraction and comparison for one additional company; retain every field's scope, period and definition.
3. Improve generic retrieval with per-quarter evidence requirements and explicit missing-period status.
4. Attach validated relative materiality to current events; preserve critical risk disclosures regardless of preferences.
5. Add generic event threads and correction invalidation only after a real corrected filing is available for testing.
6. Complete three to five research demonstrations, source-outage rehearsal, mobile review and submission packaging.

## Deliberate exclusions

No trading recommendations, broker/news evidence, invented missing figures, unverified live badges, social notifications, OCR, background scheduling, native application build, or multi-agent infrastructure.
