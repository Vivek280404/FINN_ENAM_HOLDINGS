# Build decisions

## Product choice

Two connected workflows: a portfolio briefing that opens an investigation, and evidence-led company research that supports follow-up questions. The reviewed Infosys guidance timeline demonstrates management promises versus comparable full-year delivery. Other tickers use dynamic discovery and source-based synthesis.

The assignment offers examples, not a completeness checklist. We prioritised a working mobile-first experience, financial comparability, traceable sources and usable research over a broad autonomous platform.

## Current architecture

One modular application serves the interface and API. An ESM request-handler bundle runs behind a Node.js 24 HTTP adapter on Render. Neon PostgreSQL stores extracted documents, research answers, browser-specific history, cache entries and usage/run records. Local SQLite remains available for offline development. Downloaded PDF copies can be ephemeral; publisher URLs and extracted evidence persist.

Push-style briefing: fetch exchange announcements on request → filter the 18-company watchlist → group duplicate source URLs → classify and rank → collapse routine disclosures → open the source or continue into research. EOD price/volume checks use a prior-20-completed-session baseline and configurable thresholds. This is not continuous background monitoring.

Pull: validate ticker and question → check saved answer → discover company/primary documents → fetch/hash/parse bounded source text → retrieve question-aware pages → generate one structured research response → validate financial facts, references and comparable calculations → store answer/history → render an integrated note with original links. Follow-ups resolve the parent server-side and reuse source evidence; earlier generated text is context, never primary evidence.

## Efficiency and reliability

Successful answers have a 24-hour cache; discovery and extracted documents have separate expiry policies. Concurrent identical questions share work. Contextual cache keys distinguish follow-ups. Refresh rechecks sources. Neon retains cache/history and an atomic 20-call daily budget across Render restarts.

The browser receives streamed progress and heartbeats during longer work. Source/model timeouts are bounded. Temporary model-server errors receive one delayed retry, never a paid fallback. Incomplete answers preserve usable evidence and do not become completed cache entries.

## Financial boundaries

Calculations use code, not generated arithmetic. Company, period, unit, currency, standalone/consolidated scope and definitions must agree. Unknown scope or incompatible periods block comparisons. Negative bases show absolute changes. Quarterly results cannot settle annual guidance. Bank/NBFC prompts avoid industrial EBITDA assumptions.

Citation validity and exact financial quotes are checked mechanically. They do not prove every interpretation or establish complete quarterly coverage. A business-quality stance is separate from a valuation-based investment recommendation.

## Deliberate exclusions and next work

No runtime multi-agent orchestration, vector database, microservices, native app package, broker research, automatic trading recommendations, continuous notifications or OCR.

Next: validated financial context attached to live events; generic guidance ledger/revision reconciliation; corrected-filing invalidation; deeper sector-specific and multi-period evidence checks. Add infrastructure only when these workflows justify it.

This file records engineering decisions. It does not replace ENAM's requested original coding-agent conversation export.
