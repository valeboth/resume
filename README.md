# Resume — resume.valegboth.win

A single-page personal resume website for **Valerian Gabriel Both**, deployed on
Cloudflare as one Worker that serves the static site and a small KV-backed
visitor counter. Auto-deploys on every push to `main`.

Live: **https://resume.valegboth.win**

---

## Architecture

One Cloudflare Worker does everything — no separate Pages project, no CORS, one
deploy:

```
Browser
  ├─ GET  /            → Worker serves public/index.html   (Static Assets)
  ├─ GET  /style.css   → Worker serves public/style.css    (Static Assets)
  ├─ GET  /app.js      → Worker serves public/app.js        (Static Assets)
  ├─ GET  /resume.pdf  → Worker serves public/resume.pdf    (Download button)
  └─ POST /api/views   → Worker increments the counter in KV, returns { views }
                                     │
                              Cloudflare KV  (binding: VIEWS)

Custom domain resume.valegboth.win  → provisioned automatically by Wrangler.
```

- **Static frontend** lives in `public/` and is served by the Worker via
  [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
  (the `ASSETS` binding). Files take priority; only non-file paths like
  `/api/*` reach the Worker's own handlers.
- **Backend** is [Hono](https://hono.dev/) in `src/index.ts` — just the two
  `/api/views` routes.
- **Custom domain** is declared in `wrangler.toml` with `custom_domain = true`,
  so Wrangler creates the DNS record + TLS certificate on first deploy (the
  `valegboth.win` zone must be in the same Cloudflare account).

### How the visitor counter works

- A single KV key, `count`, stores the running total.
- On page load, `public/app.js` sends `POST /api/views`.
- The Worker reads `count`, adds 1, writes it back, and returns `{ views }`;
  the page renders **"Views: N"** in the footer.
- `GET /api/views` reads the total without incrementing (useful for checks).
- KV is eventually consistent and the free tier allows ~1,000 writes/day —
  more than enough for a personal resume. If the counter is ever unreachable,
  the page hides it instead of showing an error.

---

## Project structure

```
resume/
├── public/               # static frontend (served by the Worker)
│   ├── index.html        # the resume page
│   ├── style.css         # responsive light/dark styling
│   ├── app.js            # visitor counter + download wiring
│   └── resume.pdf        # the downloadable resume
├── src/
│   └── index.ts          # Hono Worker: Static Assets + /api/views (KV)
├── .github/workflows/
│   ├── ci.yml            # lint + typecheck + dry-run build on PRs
│   └── deploy.yml        # wrangler deploy on push to main
├── wrangler.toml         # Worker config: assets, KV, custom domain
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

---

## Run locally

Requires Node 20+.

```bash
npm install

# Start a local dev server (Wrangler simulates Static Assets + KV locally).
npm run dev
```

Then open the URL Wrangler prints (usually http://localhost:8787). The counter
works locally against a local KV simulation, separate from production.

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # wrangler deploy --dry-run (bundles without deploying)
npm run deploy      # wrangler deploy (manual deploy; normally CI does this)
```

---

## Deployment

Deployment is automatic: **every push to `main`** runs
`.github/workflows/deploy.yml`, which runs `npx wrangler deploy`. That single
command ships the Worker + static assets and keeps the custom domain in sync.

### One-time setup

1. **Create a Cloudflare API token** — use the *"Edit Cloudflare Workers"*
   template (covers Workers Scripts, KV, and the DNS/Workers Routes needed to
   provision the custom domain). Include the `valegboth.win` zone.
2. **Find your Account ID** — Cloudflare dashboard → any domain → Overview →
   right sidebar.
3. **Create the KV namespace** and paste its id into `wrangler.toml`:
   ```bash
   npx wrangler kv namespace create VIEWS
   # copy the printed id → wrangler.toml → [[kv_namespaces]] id = "..."
   ```
4. **Add the two GitHub repo secrets** (Settings → Secrets and variables →
   Actions):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. **Push to `main`.** The Action deploys the Worker and provisions
   `resume.valegboth.win`. DNS/TLS can take a few minutes to go live the first
   time.

No secrets are stored in the repo — Cloudflare credentials live only in GitHub
Secrets and are injected into the Action at runtime.
