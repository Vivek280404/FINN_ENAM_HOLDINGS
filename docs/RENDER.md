# Independent, account-free FINN deployment

Evaluators open the Render URL directly. There is no ChatGPT login, application account or password. A random, first-party HttpOnly cookie keeps each browser's history separate. The Gemini key stays in Render's server environment, never in GitHub or browser code.

## Deploy from GitHub

1. Push this source to `Vivek280404/FINN_ENAM_HOLDINGS`.
2. Sign in to Render, choose **New → Blueprint**, and select that repository.
3. Render reads `render.yaml`. Confirm the **Free** service plan.
4. Set `GEMINI_API_KEY` privately in Render. The model and free-tier confirmation are already configured in the blueprint.
5. For persistent history and document caching on the free service, create a free Turso database and put its URL and database token in `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. These are server settings, not repository files. Both may be omitted for a temporary SQLite demo, but its records will be lost when Render sleeps or restarts.
6. Deploy and share the resulting `https://…onrender.com` URL.

Render supplies the HTTPS origin and assigned port automatically. `/health` is the readiness check. `PUBLIC_DEMO=true` enables account-free use explicitly; the optional private password mode remains available for local or private installations.

## Free-tier limits

Render's free service sleeps after inactivity and can take about a minute to wake up. Its local disk is ephemeral. Turso keeps structured facts, extracted source text, answer caching and browser histories across Render restarts. Downloaded PDF copies on the local disk can be fetched again from their original publisher; citations retain original URLs and pages. The application uses a shared daily cap of 20 model calls and never switches to a paid provider.

References: [Render free services](https://render.com/docs/free), [Turso free database](https://turso.tech/pricing), [Render environment variables](https://render.com/docs/environment-variables).
