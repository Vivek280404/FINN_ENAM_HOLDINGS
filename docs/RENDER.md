# Independent, account-free FINN deployment

Evaluators open the Render URL directly. There is no ChatGPT login, application account or password. A random, first-party HttpOnly cookie keeps each browser's history separate. The Gemini key stays in Render's server environment, never in GitHub or browser code.

## Deploy from GitHub

1. Push this source to `Vivek280404/FINN_ENAM_HOLDINGS`.
2. Sign in to Render, choose **New → Blueprint**, and select that repository.
3. Render reads `render.yaml`. Confirm the **Free** service plan.
4. Set `GEMINI_API_KEY` privately in Render. The model and free-tier confirmation are already configured in the blueprint.
5. For persistent history and document caching, create a free Neon project and put its PostgreSQL connection string in `DATABASE_URL`. This is a private server setting, not a repository file. Without it, the temporary SQLite demo loses its records when Render sleeps or restarts.
6. Deploy and share the resulting `https://…onrender.com` URL.

Render supplies the HTTPS origin and assigned port automatically. `/health` is the readiness check. `PUBLIC_DEMO=true` enables account-free use explicitly; the optional private password mode remains available for local or private installations.

## Free-tier limits

Render's free service sleeps after inactivity and can take about a minute to wake up. Its local disk is ephemeral. Neon keeps stored documents, extracted source text, cached answers, model usage and browser histories across Render restarts. Downloaded PDF copies on local disk can be fetched again from their publisher; citations retain original URLs and pages. The application uses a shared daily cap of 20 model calls and never switches to a paid provider.

References: [Render free services](https://render.com/docs/free), [Neon database](https://neon.com/docs/introduction), [Render environment variables](https://render.com/docs/environment-variables).

## Persistent caching

Successful answers are reused for 24 hours, company discovery for one hour and extracted documents for 24 hours. Follow-ups use conversation-aware cache keys. Refresh bypasses saved results; unsuccessful answers are not cached as completed research. Browser history requires its visitor cookie; non-personal research answers can be reused across visitors. The daily model-call counter is atomic and persistent in Neon.

Startup applies versioned PostgreSQL migrations in transactions. Millisecond timestamps use BIGINT. A configured database failure stops startup instead of silently switching to local storage. The legacy Turso adapter remains supported; do not configure both providers.
