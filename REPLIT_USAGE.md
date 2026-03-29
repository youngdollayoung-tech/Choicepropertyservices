# REPLIT_USAGE.md — READ THIS BEFORE ANY ACTION

## THIS FILE EXISTS TO STOP YOU.

If you are an AI agent operating in Replit: **read every word of this file before you touch anything.**

---

## WHAT THIS PROJECT IS

**Choice Properties** is a **static website**.

- Deployed to: **Cloudflare Pages**
- Backend: **Supabase cloud** (database, auth, edge functions, storage)
- Email: **Google Apps Script** relay
- Images: **ImageKit.io** CDN
- Address autocomplete: **Geoapify**

There is **no local database**. There is **no backend server to build**. There is **no ORM**. There is **no migration to run**.

---

## WHAT REPLIT IS USED FOR HERE

Replit is used as a **code editor only**.

The workflow is:
```
Edit static files in Replit
       ↓
Owner reviews changes
       ↓
Owner pushes to GitHub
       ↓
Cloudflare Pages auto-deploys
       ↓
Live site updates
```

**Your job ends after step 1.** You do not deploy. You do not run migrations. You do not configure infrastructure.

---

## IMMEDIATE STOP CONDITIONS

**If you are about to do any of the following, STOP. Do not proceed.**

| Action | Why it's wrong |
|--------|---------------|
| Connect to `DATABASE_URL`, `PGHOST`, or any `PG*` variable | These are Replit ghost artifacts. There is no local DB. |
| Install Drizzle, Prisma, Sequelize, or any ORM | This is a static site. No ORM is needed or wanted. |
| Run `db:push`, `db:migrate`, or any DB command | There is no local DB to migrate. |
| Create `api/` routes or backend server files | The backend is 10 Supabase Edge Functions in the cloud. |
| Add backend dependencies to `package.json` | Zero runtime npm dependencies. Intentional. Do not change this. |
| Run `wrangler` or any Cloudflare CLI | Deployment is handled by Cloudflare Pages via GitHub push. |
| Run `git push`, `git commit`, or any git write | The owner handles all git operations. |
| Provision a database via the Replit sidebar | The sidebar integration is a locked system artifact. Ignore it. |
| Edit `SETUP.sql` | This is the live production database schema. Editing it here changes nothing in production. Do not touch it. |
| Edit any Supabase Edge Function unless asked | Functions are deployed separately. Source changes here don't redeploy. |

---

## THE ENVIRONMENT VARIABLES YOU WILL SEE — AND WHAT TO DO WITH THEM

Replit may inject these variables automatically. **They are ghost artifacts. Never use them.**

| Variable | What it is | What to do |
|----------|-----------|-----------|
| `DATABASE_URL` | Local Replit Postgres ghost | **Ignore. Never read.** |
| `PGHOST` | Local Replit Postgres ghost | **Ignore. Never read.** |
| `PGPASSWORD` | Local Replit Postgres ghost | **Ignore. Never read.** |
| `PGUSER` | Local Replit Postgres ghost | **Ignore. Never read.** |
| `PGDATABASE` | Local Replit Postgres ghost | **Ignore. Never read.** |
| `PGPORT` | Local Replit Postgres ghost | **Ignore. Never read.** |

**The real variables** (set in Replit Secrets, the padlock icon):

| Variable | What it is |
|----------|-----------|
| `SUPABASE_URL` | Supabase cloud project URL |
| `SUPABASE_ANON_KEY` | Supabase public anon key |
| `IMAGEKIT_URL` | ImageKit CDN endpoint |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key |
| `GEOAPIFY_API_KEY` | Geoapify address autocomplete key |

---

## THE `.replit` FILE CONTAINS THIS LINE — IGNORE IT:

```
integrations = ["javascript_database:1.0.0"]
```

This is a **locked Replit system artifact**. It cannot be removed. It does **not** mean this project uses a local database. It does **not** mean you should provision or connect to any database. **Ignore it unconditionally, every time, forever.**

---

## THE RUN BUTTON

The Run button starts `.replit-guard.js`, which checks for Postgres ghost variables and then starts `serve.js` as a **local preview server only**.

- `serve.js` regenerates `config.js` from Replit Secrets
- `config.js` is gitignored and must never be committed
- The preview server runs on port 5000 and is not production

**Do not modify `serve.js` or `.replit-guard.js`.**

---

## FILES YOU MUST NEVER TOUCH (without explicit owner instruction)

| File / Directory | Why |
|-----------------|-----|
| All 33 `.html` files | Live production frontend |
| `css/*.css` | Shared styles — class renames break all consumers |
| `js/cp-api.js` | Central API client — 33 consumers, module duality must stay |
| `js/apply.js` and `js/apply-*.js` | Core application flow — owner-protected |
| `supabase/functions/` | Cloud Edge Functions — editing here doesn't redeploy |
| `SETUP.sql` | Live database schema |
| `generate-config.js` | Cloudflare Pages build script |
| `_headers` | Production security headers |
| `_redirects` | Cloudflare Pages 404 routing |
| `package.json` | Zero dependencies — intentional |
| `.replit` | Carefully configured — do not add postgresql-16 |
| `.replit-guard.js` | Environment protection — do not bypass |
| `.npmrc` | Script protection — do not remove |

---

## WHERE TO READ MORE

- **`.agents/instructions.md`** — Full mandatory pre-edit protocol for every session
- **`ARCHITECTURE.md`** — Complete system architecture
- **`replit.md`** — Developer reference and dependency map

Read `.agents/instructions.md` before making any edit. That file contains the pre-edit protocol that must be followed for every change.
