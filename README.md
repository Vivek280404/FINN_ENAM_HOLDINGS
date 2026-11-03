# FINN — Financial Investment Research

A mobile-first investor briefing and primary-source research application for the ENAM build challenge. Research, source citations, financial validation, browser history and follow-up questions work without visitor accounts or sign-in.

**Live app:** https://finn-investment-research-86hh.onrender.com/ — no visitor sign-in required.

## Deploy

[Deploy to Render](https://render.com/deploy?repo=https://github.com/Vivek280404/FINN_ENAM_HOLDINGS)

Use the **Free** service plan. Set `GEMINI_API_KEY` in Render's private environment settings. Never place a real key in this repository. `render.yaml` configures the model, free-tier-only operation and public demo mode. See [the independent deployment guide](docs/RENDER.md).

For durable free storage, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Without them, the server uses SQLite on its local disk; Render's free local disk resets when the service sleeps or restarts.

## Run locally

Requires Node.js 24 or later.

```sh
npm ci
npm test
npm run build
npm start
```

Open http://127.0.0.1:4173 . To test account-free public mode locally, set `PUBLIC_DEMO=true`. Each browser receives its own history cookie automatically. For a public host, use HTTPS and set `APP_ORIGIN` (Render supplies its origin automatically).

## What works

- Portfolio briefing → event investigation → evidence-linked company research.
- Validated financial figures, comparable calculations and guidance-versus-delivery analysis.
- Primary company/exchange documents with original links and page citations.
- On-demand NSE company discovery, cached answers, browser-specific history and contextual follow-ups.
- Explicit source gaps, bounded processing and a shared daily research budget.

The reviewed Infosys example is historical and labeled as such. Current research depends on available publisher documents. The Gemini Developer API is used only with a confirmed free-tier project; there is no paid fallback.

## Validation

```sh
npm test
npm run build
npm run validate
npm run check:public
npm run check:standalone
```

The public-mode smoke verifies account-free research, separate browser histories, forged-header rejection and restarting/reopening saved reports. Free Render instances can have a cold start after inactivity. Docker and GitHub Actions configuration are included.
