import { Hono } from "hono";

// Bindings available to the Worker (declared in wrangler.toml).
type Bindings = {
  // Static Assets fetcher: serves everything in public/ (index.html, css, pdf...).
  ASSETS: Fetcher;
  // KV namespace holding the single visitor-count key.
  VIEWS: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Single KV key that stores the running total of page views.
const VIEW_KEY = "count";

// --- Visitor counter -------------------------------------------------------
// POST /api/views  ->  increment the counter and return the new total.
// Read-modify-write on KV. KV is eventually consistent, which is perfectly
// fine for a "nice to have" view counter on a personal resume.
app.post("/api/views", async (c) => {
  const current = parseInt((await c.env.VIEWS.get(VIEW_KEY)) ?? "0", 10) || 0;
  const next = current + 1;
  await c.env.VIEWS.put(VIEW_KEY, String(next));
  return c.json({ views: next });
});

// GET /api/views  ->  read the counter without incrementing (handy for checks).
app.get("/api/views", async (c) => {
  const current = parseInt((await c.env.VIEWS.get(VIEW_KEY)) ?? "0", 10) || 0;
  return c.json({ views: current });
});

// --- Static frontend -------------------------------------------------------
// Anything that isn't an /api route is served from public/ via the ASSETS
// binding (index.html, style.css, app.js, resume.pdf, ...).
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
