# Plan

## Goal
A clean, modern, responsive single-page resume for Valerian Gabriel Both,
deployed to Cloudflare at **resume.valegboth.win**, with a KV-backed visitor
counter and CI/CD that auto-deploys on push to `main`. Same tooling as the
Cinemate project (Cloudflare Workers + Static Assets, TypeScript, Wrangler,
GitHub Actions with secrets).

## Approach
- **One Worker, not Pages.** A single Cloudflare Worker serves the static site
  (`public/`) via Static Assets and exposes `/api/views` for the counter. This
  mirrors Cinemate exactly and keeps everything to one project and one deploy.
- **Custom domain via config.** `custom_domain = true` in `wrangler.toml` makes
  Wrangler provision DNS + TLS for `resume.valegboth.win`.
- **Counter in KV.** One key (`count`), incremented per page load.

## Manual steps (owner)
1. Create Cloudflare API token ("Edit Cloudflare Workers" template).
2. Get Cloudflare Account ID.
3. `npx wrangler kv namespace create VIEWS` → paste id into `wrangler.toml`.
4. Create public GitHub repo; add secrets `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`.
5. Push to `main`; verify the custom domain came up (dashboard fallback if not).

## Done / automated
- Scaffolded frontend, Worker, config, CI + deploy workflows, README.
- `wrangler deploy` on push to `main` ships everything.
