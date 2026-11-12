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

## Long research requests

The browser uses `/api/research/stream` for progress and a final answer over one connection. Heartbeats prevent an idle connection while documents or synthesis are pending. A research operation has a three-minute stream deadline, with a four-minute browser allowance including host wake-up time. Ordinary `/api/research` remains supported for JSON clients. Errors and interrupted connections produce retry instructions; incomplete research is logged as partial and is never cached as a completed answer.

If the transport drops before the final result, the browser reconnects once within the same four-minute deadline. The reconnect retains the question and parent context but disables forced refresh, so a saved or in-flight answer can be recovered without repeating generation. Provider error packets and user cancellations are not automatically resubmitted.

## Credential fallback

Set `GEMINI_API_KEYS` privately to a JSON array of up to six credentials. `GEMINI_API_KEY` remains supported and is deduplicated against the array. No credential is returned to browsers, logged, or committed.

Authentication rejection can advance to the next credential. Temporary server/network failures allow one backup attempt. Failed credentials have short process-local cooldowns; a healthy credential is preferred on later requests. The generation stage has a 75-second attempt budget. Every attempt reserves from the same persistent 20-call daily budget; neither the model nor paid-tier settings change.

HTTP 429 stops the request and temporarily pauses the pool rather than cycling through credentials. Keys in one Google project share quota. A model-wide outage can affect all credentials, so cited evidence and existing saved reports remain the fallback when generation is unavailable.
