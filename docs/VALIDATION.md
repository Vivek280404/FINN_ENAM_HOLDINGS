# Validation record — 3 November 2026

## Automated and integration checks

The current release runs 130 targeted tests. These cover financial comparability, units, scope, fiscal periods, negative/zero bases, guidance horizons, citation IDs, source restrictions, structured reports, contextual follow-ups, owner isolation, caching, announcement screening, database migrations, persistent usage counters, streaming, interrupted connections, provider errors and bounded retries. Tests do not establish universal financial accuracy.

Run:

```sh
npm test
npm run build
npm run validate
npm run check:public
npm run check:standalone
```

The public smoke checks no-sign-in research, separate browser cookies/histories, forged-header rejection, restart persistence and the real streamed HTTP endpoint. The private standalone smoke checks its separate optional password mode.

## Live database and provider checks

- Render health reports Neon and persistent storage.
- Real Neon migrations, research history and answer reuse were checked across processes with different, empty local data directories.
- Context resolution and the 20-reservation usage ceiling were checked against PostgreSQL. A separate unit check limits simultaneous database requests.
- Repeated saved questions reopen without model generation.
- A real Dixon follow-up returned a cited verification-priorities answer, retained its parent and company context (turn 1), and saved to history without availability warnings.
- Gemini Developer API / AI Studio is configured; Vertex is not used.
- Real transient Gemini 503 failures were observed. Progress, one delayed retry, visible availability errors and honest partial results are implemented. There is no paid-model fallback.
- Live Infosys cash-flow/risk research completed in 25.8 seconds; repeating it showed a saved answer opened in 0.0 seconds of server processing. Those are observations, not an SLA.

## Demonstration coverage

| Company | Observed output | Scope |
| --- | --- | --- |
| Infosys / INFY | Fresh cited cash-flow and business-risk note; saved-answer reuse; reviewed guidance timeline | Historical reviewed case is clearly separated from current synthesis |
| Dixon / DIXON | 11 analytical claims citing 4 primary documents; cached report opened in about 2 seconds including transport | Outside the default watchlist; supports the unseen-company workflow |
| Maruti Suzuki / MARUTI | Fresh 9-claim note citing 2 primary documents in about 49 seconds; no availability warnings | Company-published Q4 FY26 transcript and FY26 annual report |

Live reports depend on publisher documents and model availability. These checks do not prove every claim semantically correct or full annual/multi-quarter coverage. Source pages remain available for manual review.

## Mobile and interaction checks

Prior browser checks covered actual CSS widths 320, 390, 430, 768 and 1280px without page-level research overflow. Briefing, investigation, source controls, watchlist, preferences, history and follow-up inputs were inspected. Long text wraps and expanding question fields remain supported.

## Known boundaries

No recurring exchange monitoring or external alerts; current filing response windows can be incomplete; quantitative materiality is not automatically extracted from all events; general guidance ledgers and corrections are not reconciled automatically; no OCR. Market-provider/source outages return availability states rather than invented signals.
