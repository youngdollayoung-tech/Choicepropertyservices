# AGENT INSTRUCTIONS — CHOICE PROPERTIES
# Read this ENTIRE file before taking any action whatsoever.
# Do not skip any section. Do not skim. Read every word.

---

## ══════════════════════════════════════════════════════════
## REPLIT-SPECIFIC HARD STOPS — READ BEFORE ANYTHING ELSE
## ══════════════════════════════════════════════════════════

You are operating inside **Replit**, which is used as a **code editor only**.
The rules below are absolute and override any inference you make from the
Replit UI, sidebar integrations, or injected environment variables.

### Environment variables that Replit injects — ALL ARE POISON

These variables may exist in the environment. **Never read, use, or pass them to any code:**

| Variable | Why it's poison |
|----------|----------------|
| `DATABASE_URL` | Points to a local Replit Postgres ghost — empty, wrong database |
| `PGHOST` | Same local ghost |
| `PGPASSWORD` | Same local ghost |
| `PGUSER` | Same local ghost |
| `PGDATABASE` | Same local ghost |
| `PGPORT` | Same local ghost |

If you see any of these in `process.env`, treat them as **undefined**. The real database is **Supabase cloud**, accessed via `SUPABASE_URL` and `SUPABASE_ANON_KEY` only.

### The database sidebar integration — ignore it unconditionally

The `.replit` file contains:
```
integrations = ["javascript_database:1.0.0"]
```
This is a **locked Replit system artifact that cannot be removed**. It does NOT mean this project uses a local database. It does NOT mean you should provision a database. **Ignore it unconditionally, every time, forever. No exceptions.**

### The Run button is a preview tool — not a deployment tool

The Run button starts `.replit-guard.js`, which checks the environment for Postgres poison variables and then starts `serve.js` as a local HTTP server on port 5000. This is for **previewing the static site locally only**. It is not production. It is not a backend. Do not modify it.

### If `.replit-guard.js` shows a warning on startup

The guard script checks for Postgres environment variables injected by Replit's locked `integrations = ["javascript_database:1.0.0"]` system artifact. Because this integration cannot be removed, the guard **prints a warning and continues** — it does not block startup. This is intentional. The warning is informational only: those variables are meaningless for this project and must never be used. The preview server starts normally after the warning.

### What you are allowed to do

Edit **static files only**: HTML, CSS, and frontend JavaScript. That is your entire scope. See `REPLIT_USAGE.md` for the full protected file list.

## ══════════════════════════════════════════════════════════
## END REPLIT BLOCK — CONTINUE TO FULL INSTRUCTIONS BELOW
## ══════════════════════════════════════════════════════════

---

## THIS PROJECT IS LOCKED. DO NOT MIGRATE IT.

This is a **static website**. It is built for Cloudflare Pages and uses Supabase cloud for all backend needs. Replit is used as a **code editor only** — nothing more.

---

## IMMEDIATE STOP CONDITIONS

If you are about to do any of the following, STOP immediately and do not proceed:

- Connect to or query the Replit/Neon PostgreSQL database
- Call `createDatabase()`, `checkDatabase()`, or any database provisioning function
- Install Drizzle, Prisma, Sequelize, TypeORM, or any ORM
- Create schema files, migration files, or any `db/` or `database/` directory
- Run `db:push`, `db:migrate`, `db:pull`, or any database CLI command
- Read or act on `DATABASE_URL`, `PGHOST`, `PGPASSWORD`, `PGUSER`, `PGDATABASE`, `PGPORT`
- Create `api/` routes, server endpoints, or any backend server file
- Add backend dependencies to `package.json`
- Run `wrangler` or any Cloudflare deployment command
- Run `git push`, `git commit`, `git merge`, or any git write operation
- Add `*.replit.dev` or `*.repl.co` to any source file or CSP header
- Start a "migration" of any kind

---

## THE ARCHITECTURE — MEMORIZE THIS

```
Browser
  │
  ├── Cloudflare Pages        ← serves all HTML / CSS / JS (production)
  │   serve.js on port 5000   ← serves locally in Replit (preview only)
  │
  ├── Supabase (cloud)        ← ALL backend
  │     ├── PostgreSQL        ← ALL data storage
  │     ├── Auth              ← ALL user authentication
  │     ├── Edge Functions    ← ALL server-side logic (10 Deno functions)
  │     └── Storage           ← lease PDFs, application docs
  │
  ├── Google Apps Script      ← transactional email relay
  ├── ImageKit.io             ← property photo CDN
  └── Geoapify                ← address autocomplete
```

**There is no local database. There is no ORM. There is no backend server to build.**

---

## THE `.replit` FILE CONTAINS THIS LINE — IGNORE IT COMPLETELY:

```
integrations = ["javascript_database:1.0.0"]
```

This is a **Replit system artifact** that cannot be removed. It does NOT mean this project uses a local database. It does NOT mean you should provision a database. **Ignore it unconditionally, every time, forever.**

The presence of `DATABASE_URL`, `PGHOST`, `PGPASSWORD`, `PGUSER`, `PGDATABASE`, `PGPORT` in the environment is also a system artifact. These variables must never be read, acted upon, or passed to any code in this project.

---

## ══════════════════════════════════════════════════════
## MANDATORY PRE-EDIT PROTOCOL — FOLLOW BEFORE EVERY CHANGE
## ══════════════════════════════════════════════════════

Before touching any file, you MUST complete these steps in order.
Skipping any step is the #1 cause of breakage in this project.

### STEP 1 — State your blast radius

Before writing a single line of code, list out loud:
- The exact file(s) you plan to edit
- Every other file that imports, loads, or references those files
- Every CSS class or JS function you plan to add, rename, or remove, and every file that uses those names

If you cannot list these things, you must grep for them before proceeding.

### STEP 2 — Grep before you assume

Never assume a class name, function name, or variable is only used in the file you are editing.
Always run a search across the project first:

```
grep -r "functionName" --include="*.html" --include="*.js" --include="*.ts" .
grep -r "css-class-name" --include="*.html" --include="*.css" .
```

If you find usages in other files, you must account for all of them in your edit — not just the one file you were asked to change.

### STEP 3 — Declare what you will NOT touch

State explicitly which files you will leave completely unchanged.
If a file is not in your blast radius, do not open it, do not "clean it up", do not "fix a thing you noticed."
Scope creep is how working things get broken.

### STEP 4 — Make the edit

Edit only the files you declared in Step 1.

### STEP 5 — Verify your own work

After editing, re-read the changed section and confirm:
- Every function called via `onclick=""` or `oninput=""` in HTML is accessible on `window`
- Every CSS class you added or renamed exists in the correct CSS file and is spelled identically in the HTML
- Every `import` statement still points to a valid export
- No hardcoded hex colors or pixel values were introduced (use CSS tokens)
- CSS version strings were bumped if you changed a CSS file (see CSS RULES below)

---

## ══════════════════════════════════════════════════════
## DEPENDENCY MAP — THE HIDDEN RULES OF THIS PROJECT
## ══════════════════════════════════════════════════════

These are the relationships that cause breakage when an AI edits without understanding them.
Read every entry before editing any file.

---

### js/cp-api.js — THE CENTRAL NERVE

`cp-api.js` is loaded by every page in the project (33 HTML files).
It uses ES module `export` syntax. This creates strict rules:

**Rule 1 — Always `type="module"`**
Every `<script>` tag loading `cp-api.js` must be `<script type="module" src="...cp-api.js">`.
A plain `<script src="...cp-api.js">` will throw a SyntaxError and silently break the entire page.

**Rule 2 — Inline scripts on the same page need `DOMContentLoaded`**
When `cp-api.js` is a module, it executes after the document parses.
Any classic `<script>` on the same page that calls `window.CP.*` must be wrapped:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  // safe to use window.CP here
});
```
Without this, `window.CP` is undefined when the inline script runs.

**Rule 3 — `onclick=""` functions must be on `window`**
Module scripts are scoped — functions defined inside them are NOT on `window`.
Any function called via an HTML `onclick="myFunc()"` attribute must be explicitly exported:
```javascript
window.myFunc = myFunc;
```
If you add a new function called via `onclick`, you MUST add it to `window`.
If you rename a function called via `onclick`, you MUST update both the function AND the `window` assignment.

**Rule 4 — If you change an export in cp-api.js, check all 33 consumers**
Adding, removing, or renaming an export may break any of the pages listed below.
Before changing any export, grep for its name across all HTML and JS files.

**All pages that load cp-api.js:**
```
Public:       index.html, listings.html, property.html, apply.html
              about.html, faq.html, how-to-apply.html
Apply portal: apply/dashboard.html, apply/lease.html, apply/login.html
Landlord:     landlord/dashboard.html, landlord/login.html, landlord/register.html
              landlord/new-listing.html, landlord/edit-listing.html
              landlord/applications.html, landlord/inquiries.html
              landlord/profile.html, landlord/settings.html
Admin:        admin/dashboard.html, admin/login.html, admin/applications.html
              admin/leases.html, admin/listings.html, admin/messages.html
              admin/move-ins.html, admin/email-logs.html, admin/landlords.html
```

---

### js/apply.js — APPLY FORM BRAIN

`apply.js` is loaded only by `apply.html`. It depends on:
- `window.CP` being set by `cp-api.js` before it runs
- `window.CONFIG` being set by `config.js` before it runs
- `window.CONFIG.GEOAPIFY_API_KEY` for address autocomplete
- `window.CONFIG.FEATURES` for feature flags

Do not change function signatures in `apply.js` without checking `apply.html` for all call sites.
Do not rename or remove anything from `apply.js` that `apply.html` calls directly.

**The apply page color scheme and payment coordination logic are OWNER-PROTECTED.**
Do not change colors, payment flow messaging, or the manual payment process on `apply.html`.

---

### js/imagekit.js — IMAGE UPLOAD

`imagekit.js` is loaded only by landlord pages that handle photo uploads.
It calls the `imagekit-upload` Edge Function directly.
Do not change the upload interface without also checking `landlord/new-listing.html` and `landlord/edit-listing.html`.

---

### CSS FILES — SHARED STYLESHEETS

Changing a class name or removing a style from a CSS file breaks every page that uses that file.

| CSS File | Used By |
|---|---|
| `css/main.css` | ALL 33 pages — touch with extreme caution |
| `css/mobile.css` | ALL 33 pages — touch with extreme caution |
| `css/admin.css` | All 9 admin pages + all 9 landlord pages |
| `css/landlord.css` | All 9 landlord pages |
| `css/listings.css` | `index.html`, `listings.html`, `landlord/profile.html` |
| `css/apply.css` | `apply.html`, `apply/lease.html`, `apply/success.html` |
| `css/property.css` | `property.html` only |

**CSS Token Rule — NEVER hardcode values**
Always use CSS custom properties (design tokens). Never use raw hex colors or fixed pixel values.
Correct: `color: var(--color-brand)`
Wrong: `color: #006aff`

**CSS Version Bump Rule — MANDATORY**
Any time you edit a CSS file, you MUST bump the `?v=` cache-busting string in EVERY HTML file that loads it.

Current versions (update this comment when you bump):
```
css/main.css        → ?v=3   (all 33 pages)
css/mobile.css      → ?v=4   (all 33 pages)
css/admin.css       → ?v=2   (all admin + landlord pages)
css/landlord.css    → ?v=2   (all landlord pages)
css/listings.css    → ?v=6   (index.html, listings.html, landlord/profile.html)
css/apply.css       → ?v=4   (apply.html, apply/lease.html, apply/success.html)
css/property.css    → ?v=8   (property.html only)
```

---

### EDGE FUNCTIONS — SUPABASE DENO FUNCTIONS

These run in Supabase cloud. You cannot test them locally.
Do not edit them unless the user explicitly asks.
If you do edit one, the function must be redeployed manually by the user via the Supabase dashboard.

| Function | Called By |
|---|---|
| `process-application` | `js/apply.js` |
| `get-application-status` | `js/cp-api.js` |
| `update-status` | `js/cp-api.js` |
| `generate-lease` | `js/cp-api.js`, `admin/leases.html` |
| `sign-lease` | `js/cp-api.js`, `admin/applications.html`, `admin/leases.html` |
| `send-inquiry` | `js/cp-api.js`, `apply/dashboard.html` |
| `send-message` | `js/cp-api.js` |
| `mark-paid` | `js/cp-api.js` |
| `mark-movein` | `js/cp-api.js` |
| `imagekit-upload` | `js/imagekit.js` |

---

### AUTHENTICATION — THREE SEPARATE FLOWS, NEVER MIX THEM

| User Type | Auth Method | Session After Login |
|---|---|---|
| Landlord / Agent | Email + Password (`signInWithPassword`) | Immediate — session always non-null on success |
| Admin | Email + Password (`signInWithPassword`) | Immediate — must also exist in `admin_roles` table |
| Applicant / Tenant | OTP passwordless (`signInWithOtp`) | Only after OTP verification |

Email confirmation is DISABLED for landlords and admins.
`supabase.auth.signUp()` for a landlord returns `{ user, session }` immediately.
If `session` is null after landlord signup, it is a bug — surface it, do not treat it as normal.

**Sign-out routing — do not change these:**
- On `/apply/` paths → route to `/apply/login.html`
- On `/admin/` paths → route to `/admin/login.html`
- On `/landlord/` paths → route to `/landlord/login.html`

---

### CONFIG — RUNTIME VARIABLES

`config.js` is generated at server start by `generate-config.js` from Replit Secrets.
It sets `window.CONFIG` with: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IMAGEKIT_URL_ENDPOINT`,
`GEOAPIFY_API_KEY`, `COMPANY_NAME`, `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_ADDRESS`, `FEATURES`.

Never read `process.env` in any frontend file.
Never hardcode any config value — always use `CONFIG.*`.
`config.js` is always the first `<script>` on every page, loaded as a classic script.

---

## ══════════════════════════════════════════════════════
## REGRESSION SMOKE TEST — VERIFY AFTER EVERY EDIT
## ══════════════════════════════════════════════════════

After completing any edit, verify each applicable item below.
If you cannot confirm an item, say so explicitly so the user knows to test it manually.

### Always check after any edit:
- [ ] Pages that load any file you edited still have correct `<script>` tags (type, src path)
- [ ] Any function called via `onclick=""` is defined at top level AND assigned to `window`
- [ ] No CSS class you relied on was renamed or removed from its stylesheet
- [ ] No hardcoded colors or pixel values were introduced
- [ ] If a CSS file was changed, `?v=` was bumped in all consuming HTML files

### If you edited cp-api.js:
- [ ] All changed or added exports are still correctly named
- [ ] All 33 pages that import from it still reference valid export names
- [ ] `window.CP` is still assigned at the bottom of the file

### If you edited an admin page:
- [ ] `cp-api.js` is `type="module"`
- [ ] The inline data script uses `DOMContentLoaded`
- [ ] All `onclick` functions are in a classic `<script>`, not inside a module

### If you edited a landlord page:
- [ ] `requireAuth()` is still called on page load
- [ ] `signOut()` still routes to `/landlord/login.html`

### If you edited apply.html or apply.js:
- [ ] Color scheme and payment coordination logic are unchanged
- [ ] Manual payment process is intact
- [ ] `window.CP` is available before `apply.js` runs

### If you edited a CSS file:
- [ ] `?v=` bumped in every HTML file that loads it
- [ ] No existing class names were renamed
- [ ] All new classes use CSS token values, not hardcoded hex

---

## YOUR ROLE

Your only job is to **edit static files** — HTML, CSS, and the frontend JavaScript files.

The workflow `Start application` runs `node serve.js` which:
1. Reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Replit Secrets
2. Writes `config.js` so the browser can connect to Supabase
3. Serves all static files on port 5000

That is the entire local stack. Nothing else runs locally.

---

## WHAT THE USER WANTS FROM YOU

1. Follow the Pre-Edit Protocol above before every change — no exceptions
2. Edit only the files declared in your blast radius
3. Complete the Regression Smoke Test after every change
4. Respect the mobile-first design rules in `replit.md`
5. Never touch the backend, database, deployment, or git
6. Update `CHANGELOG.md` with a dated entry for every change made

See `replit.md` for the complete project rules, design system, and architecture reference.

---

## ══════════════════════════════════════════════════════
## LAUNCH FIX BACKLOG — WORK THROUGH THIS IN ORDER
## ══════════════════════════════════════════════════════

This section was added in Session 017. The project is feature-complete and
has passed a full audit. The remaining work before public launch is a set of
targeted configuration, build, and UX fixes documented below.

**Read all entries before touching any file. Then work Phase 1 top to bottom,
one issue at a time, updating ISSUES.md status after each fix.**

---

### PAYMENT FLOW — OWNER-PROTECTED. DO NOT CHANGE.

The application fee collection process is intentional offline/manual.
`apply.html` copy, the `mark-paid` Edge Function, `cp-api.js` `markPaid()`,
and all `payment_status` logic in `admin/applications.html` must not be
altered under any circumstances. No Stripe integration. No payment gate
before application review. This is a deliberate product decision.

Issues DF-002 (no pre-review fee gate) and any audit finding about "unfinished
payment flow" are WONT FIX by owner decision. Never reopen them.

---

### Phase 1 — Must fix before launch (work in this order)

| ID | Title | Files | Status |
|---|---|---|---|
| I-029 | sitemap.xml + robots.txt contain YOUR-DOMAIN.com placeholder | `generate-config.js`, `sitemap.xml`, `robots.txt` | ✅ RESOLVED |
| I-030 | og:url hardcoded to staging domain on 7 pages | `js/components.js` | ✅ RESOLVED |
| I-031 | Build command incomplete — generate-config.js never runs on Cloudflare Pages | `package.json` | ✅ RESOLVED |
| I-032 | gallery_2x + strip presets missing from generated config | `generate-config.js` | ✅ RESOLVED |
| I-033 | Homepage shows blank section when zero listings exist | `index.html` | ✅ RESOLVED |
| I-034 | COMPANY_EMAIL has no fallback — blank mailto links if env var missing | `generate-config.js` | ✅ RESOLVED |

### Phase 2 — High value, do before or shortly after launch (work in this order)

| ID | Title | Files | Status |
|---|---|---|---|
| I-035 | property.html shows blank page when ?id= param is missing | `property.html` | OPEN |
| I-036 | DASHBOARD_URL secret undocumented — lease signing links silently break | `SETUP.md` | OPEN |

### Phase 3 — Post-launch improvements (future sessions)

| ID | Title | Notes |
|---|---|---|
| — | Saved listings tenant UI | Backend complete (table + trigger). Needs a /apply/saved.html page. |
| — | Step indicator overflow on 320px screens | Test on iPhone SE first. Fix only if confirmed broken. |
| — | Database-backed rate limiting | Replace in-memory Map in Edge Functions. Large effort. |
| — | Lazy load translation strings | apply-translations.js loaded on every apply page entry regardless of locale. |

---

### Fix details — read before implementing each issue

**I-029 — sitemap.xml + robots.txt domain fix**
Have `generate-config.js` read a `SITE_URL` environment variable and rewrite
both `sitemap.xml` and `robots.txt` at build time, replacing every occurrence
of `YOUR-DOMAIN.com` with the real domain. Add `SITE_URL` to the required env
var list with a warning (not a hard failure) if missing. Also add `SITE_URL`
to `config.example.js` documentation comment.

**I-030 — og:url dynamic fix**
In `js/components.js`, after the component loader runs, add one line that sets
`document.querySelector('meta[property="og:url"]')?.setAttribute('content', location.href)`.
This covers all 7 affected pages in one place. Do not touch the individual
HTML files. `property.html` already sets `#ogUrl` dynamically — leave it alone.

**I-031 — Build command fix**
`build.js` was a stale duplicate of `generate-config.js` and has been deleted (Session 019).
The build command in `package.json` is now simply `node generate-config.js`.
`generate-config.js` is the single authoritative config generator — do not recreate `build.js`.

**I-032 — Missing ImageKit presets**
In `generate-config.js`, inside the `transforms` object in the `CONFIG.img`
function template string, add the two missing presets after `card:`:
  `gallery_2x: 'tr:w-2400,q-85,f-webp',`
  `strip:      'tr:w-80,h-60,c-maintain_ratio,q-70,f-webp',`
Copy exact values from `config.example.js`. These are used by `property.html`
for retina srcset (`gallery_2x`) and the thumbnail strip (`strip`).

**I-033 — Homepage empty state**
In `index.html`, in `loadFeaturedListings()`, the current code returns silently
when `!props || !props.length`. Instead, show a warm empty-state message inside
`#featuredGrid`: a centred paragraph with an icon, heading "Listings Coming Soon",
and subtext "We're just getting started — check back shortly for available
properties." Use existing CSS tokens only (no hardcoded colours). Still call
`section.style.display = ''` so the section is visible. The empty state must be
responsive and look intentional, not broken.

**I-034 — COMPANY_EMAIL fallback**
In `generate-config.js`, change the `COMPANY_EMAIL` line from:
  `COMPANY_EMAIL: process.env.COMPANY_EMAIL || '',`
to:
  `COMPANY_EMAIL: process.env.COMPANY_EMAIL || 'hello@choiceproperties.com',`
This prevents blank `mailto:` links in nav and footer if the env var is not set.

**I-035 — property.html missing ?id= guard**
At the top of the inline script in `property.html`, after the `DOMContentLoaded`
listener opens, check for the `id` param. If missing or empty, redirect to
`/listings.html` and show a toast via `CP.UI.toast('Property not found.', 'error')`
before redirecting. Do not show a blank page.

**I-036 — DASHBOARD_URL documentation**
In `SETUP.md`, in the Supabase Secrets section (wherever `IMAGEKIT_PRIVATE_KEY`
and other secrets are listed), add `DASHBOARD_URL` with a clear description:
"Your public site base URL (e.g. https://your-domain.com). Used by
generate-lease and sign-lease Edge Functions to build the signing link sent
to tenants. If missing, lease signing links will be broken."

---

### After completing all Phase 1 fixes

1. Update each issue's status in `ISSUES.md` (OPEN → RESOLVED)
2. Update the Summary Snapshot counts in `ISSUES.md`
3. Add a dated entry to `CHANGELOG.md`
4. Update `SESSION.md` with a new handoff document
5. Repackage the full project ZIP and deliver to the owner

---

### Content task — not a code fix (owner must do this manually)

Before launch, seed at least 3–5 real or demo listings in the database so the
homepage Featured Listings section shows live content. The empty state added
in I-033 protects against a blank section, but a populated marketplace is
essential for first-impression trust. This cannot be automated — the owner
must add listings via the landlord dashboard.
