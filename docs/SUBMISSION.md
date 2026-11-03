# Submission checklist

The original brief requests a mobile-first working prototype, GitHub repository, actual coding-agent/LLM build conversations and a short covering email describing choices, trade-offs, exclusions and next steps. It specifies assessment@enam.com and subject "ENAM - IIT screening - 2027".

- Live app: https://finn-investment-research-86hh.onrender.com/
- Research entry: https://finn-investment-research-86hh.onrender.com/#research
- Repository: https://github.com/Vivek280404/FINN_ENAM_HOLDINGS
- Demo instructions: [EVALUATOR-GUIDE.md](EVALUATOR-GUIDE.md)
- Scope: [FEATURE-AUDIT.md](FEATURE-AUDIT.md)
- Build decisions: [BUILD-DECISIONS.md](BUILD-DECISIONS.md)
- Actual coding-agent conversation export: [BUILD-CONVERSATION.md](BUILD-CONVERSATION.md).

BUILD-CONVERSATION.md contains the actual original user/assistant messages, with credentials and private metadata redacted. Tool calls, internal reasoning and attachment bytes are omitted. It is not a generated development summary. No keys are needed by evaluators to use the live app.

## Covering email

To: assessment@enam.com
Subject: ENAM - IIT screening - 2027

Hi ENAM team,

I'm sharing FINN, my mobile-first investment research prototype for the AI Engineer challenge.

I focused on two connected workflows: an 18-company portfolio briefing that leads into event investigation, and a company research desk with primary-source citations, financial comparisons, contextual follow-up questions and saved research history.

The guidance-versus-delivery example traces Infosys management's original expectations, revisions and comparable full-year outcome. The research pipeline also discovers documents for other NSE tickers; Infosys, Dixon and Maruti have been tested. Missing evidence is shown explicitly, and calculations check periods, units and accounting basis.

I kept the backend modular, used deterministic calculations where possible, and added persistent Neon caching/history to avoid repeated work. The prototype deliberately leaves out continuous background alerts, OCR and universal guidance reconciliation. Current filing and EOD checks are on request. Next I would deepen live-event financial context and automate guidance/revision tracking.

Live app: https://finn-investment-research-86hh.onrender.com/
GitHub: https://github.com/Vivek280404/FINN_ENAM_HOLDINGS
AI build history: https://github.com/Vivek280404/FINN_ENAM_HOLDINGS/blob/main/docs/BUILD-CONVERSATION.md

The app requires no sign-in. Free hosting may need a short initial wake-up, and model/source availability can affect new research.

Best,
Harshit Anand
