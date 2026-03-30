# AGENT INSTRUCTIONS — CHOICE PROPERTIES
# Read this ENTIRE file before taking any action whatsoever.
# Do not skip any section. Do not skim. Read every word.

---

## ══════════════════════════════════════════════════════════
## PERMANENT HARD STOP — READ BEFORE ANYTHING ELSE
## ══════════════════════════════════════════════════════════

This rule applies in every environment — Replit, Cursor, GitHub Codespaces, any AI tool.
It is permanent. It does not change based on which platform you are on.

### ┌─────────────────────────────────────────────────────────┐
### │  DO NOT START A LOCAL SERVER.                           │
### │  DO NOT CONFIGURE A WORKFLOW OR RUN BUTTON.            │
### │  DO NOT RUN npm start (it exits with an error by design)│
### │  DO NOT SET UP A LOCAL PREVIEW.                        │
### │  DO NOT CONFIGURE DEPLOYMENT FROM ANY EDITOR.         │
### └─────────────────────────────────────────────────────────┘

The deployment path for this project is, and will always be:

```
Edit static files (HTML / CSS / JS)
         ↓
Owner pushes to GitHub
         ↓
Cloudflare Pages auto-deploys
         ↓
Live site updates
```

Your job ends after step 1. You do not run the site. You do not preview the site.
You do not push to git. You do not deploy anything.

---

## ENVIRONMENT VARIABLES INJECTED BY REPLIT — ALL ARE POISON

If operating inside Replit, these variables may exist in the environment.
**Never read, use, or pass them to any code:**

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

The `.replit` file may contain:
```
integrations = ["javascript_database:1.0.0"]
```
This is a **locked Replit system artifact that cannot be removed**. It does NOT mean this project uses a local database. It does NOT mean you should provision a database. **Ignore it unconditionally, every time, forever. No exceptions.**

---

## THIS PROJECT IS LOCKED. DO NOT MIGRATE IT.

This is a **static website**. It is built for Cloudflare Pages and uses Supabase cloud for all backend needs.

---

## IMMEDIATE STOP CONDITIONS

If you are about to do any of the following, STOP immediately and do not proceed:

- Start a local HTTP server of any kind
- Configure a workflow, run button, or process manager
- Run `npm start` (it exits with an error by design — do not work around it)
- Configure deployment from Replit or any editor
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
  │   (no local server)       ← there is no local equivalent — edit and push to GitHub
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

## THE `.replit` FILE MAY CONTAIN THIS LINE — IGNORE IT COMPLETELY:

```
integrations = ["javascript_database:1.0.0"]
```

This is a **Replit system artifact** that cannot be removed. It does NOT mean this project uses a local database. It does NOT mean you should provision a database. **Ignore it unconditionally, every time, forever.**

The presence of `DATABASE_URL`, `PGHOST`, `PGPASSWORD`, `PGUSER`, `PGDATABASE`, `PGPORT` in the environment is also a system artifact. These variables must never be read, acted upon, or passed to any code in this project.

---

## ══════════════════════════════════════════════════
## MANDATORY PRE-EDIT PROTOCOL — FOLLOW BEFORE EVERY CHANGE
## ══════════════════════════════════════════════════

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

`config.js` is generated at **Cloudflare Pages build time** by `generate-config.js` from environment variables set in the Cloudflare Pages dashboard.
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

That is the entire scope. Nothing else. No servers. No workflows. No deployment.

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

**I-035 — property.html missing ?id= guard**
At the top of the inline script in `property.html`, after the `DOMContentLoaded`
listener opens, check for the `id` param. If missing or empty, redirect to
`/listings.html` immediately. No flash of content, no console errors.

**I-036 — DASHBOARD_URL documentation**
In `SETUP.md`, add a dedicated section for Supabase Edge Function secrets.
Document `DASHBOARD_URL` explicitly: it must be set to the public Cloudflare Pages
URL (e.g. `https://choiceproperties.pages.dev`) so that lease signing links in
outgoing emails resolve correctly. Add it to the required secrets table.
