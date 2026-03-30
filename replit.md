# Choice Properties — Developer Reference

> **For AI agents:** Read `.agents/instructions.md` before any action. This file is a reference companion — it does not override the mandatory pre-edit protocol.

---

# ══════════════════════════════════════════════════════════
# STOP — READ THIS FIRST — BEFORE ANYTHING ELSE
# ══════════════════════════════════════════════════════════
#
# IF YOU ARE AN AI AGENT (REPLIT, CURSOR, CLAUDE, OR ANY OTHER),
# THIS IS YOUR FIRST INSTRUCTION. NOTHING BELOW SUPERSEDES THIS.
#
# ┌─────────────────────────────────────────────────────────┐
# │  DO NOT START A LOCAL SERVER.                           │
# │  DO NOT CONFIGURE A WORKFLOW.                           │
# │  DO NOT RUN npm start.                                  │
# │  DO NOT SET UP A LOCAL PREVIEW.                         │
# │  DO NOT CONFIGURE DEPLOYMENT FROM REPLIT.               │
# └─────────────────────────────────────────────────────────┘
#
# THIS PROJECT IS A STATIC WEBSITE.
# THE DEPLOYMENT WORKFLOW IS:
#
#   Edit static files (HTML / CSS / JS)
#            ↓
#   Owner pushes to GitHub
#            ↓
#   Cloudflare Pages auto-deploys
#            ↓
#   Live site updates
#
# YOUR JOB ENDS AFTER STEP 1.
# YOU DO NOT DEPLOY. YOU DO NOT PREVIEW. YOU DO NOT PUSH.
#
# THE FULL BACKEND IS SUPABASE CLOUD (EXTERNAL SERVICE).
# DO NOT PROVISION A DATABASE. DO NOT INSTALL AN ORM.
# DO NOT CREATE BACKEND ROUTES. DO NOT RUN MIGRATIONS.
#
# DATABASE_URL, PGHOST, PGPASSWORD, PGUSER, PGDATABASE, PGPORT
# ARE SYSTEM ARTIFACTS. NEVER READ THEM. NEVER USE THEM. EVER.
#
# YOUR ONLY JOB: EDIT STATIC FILES (HTML, CSS, FRONTEND JS).
# ══════════════════════════════════════════════════════════

---

## ⛔ MANDATORY RULES FOR ALL AI AGENTS — READ BEFORE ANYTHING ELSE

These rules are absolute. They apply to every session, every import, every task. No exceptions.

### This project is:
- A **static website** deployed to **Cloudflare Pages**
- Connected to **Supabase cloud** for all backend needs
- **MOBILE-FIRST** — see the mandatory mobile rule below

### This project is NOT:
- A Node.js application
- A project that runs locally
- A project that needs a local server, workflow, or Replit preview
- A project that needs `npm start`

---

## 🔗 DEPENDENCY MAP — READ BEFORE EDITING ANYTHING

This section documents every invisible dependency in the project.
Breaking changes always come from ignoring these relationships.

### cp-api.js is loaded by all 33 HTML pages — three rules apply everywhere:

1. **Always `type="module"`** — Every `<script>` loading cp-api.js must be `<script type="module" src="...cp-api.js">`. A plain `<script>` tag throws a SyntaxError and breaks the entire page silently.
2. **Inline scripts need `DOMContentLoaded`** — any classic `<script>` on the same page that uses `window.CP` must be wrapped in `document.addEventListener('DOMContentLoaded', ...)` or `window.CP` will be undefined when it runs.
3. **`onclick=""` functions must be on `window`** — module-scoped functions are invisible to HTML attributes. Any function called via `onclick="foo()"` must be explicitly assigned: `window.foo = foo`.

### CSS files and their consumers — changing one breaks all consumers:

| File | Consumers |
|---|---|
| `css/main.css` | ALL 33 pages |
| `css/mobile.css` | ALL 33 pages |
| `css/admin.css` | All 9 admin pages + all 9 landlord pages |
| `css/landlord.css` | All 9 landlord pages |
| `css/listings.css` | `index.html`, `listings.html`, `landlord/profile.html` |
| `css/apply.css` | `apply.html`, `apply/lease.html`, `apply/success.html` |
| `css/property.css` | `property.html` only |

**CSS version bump rule:** Whenever you edit a CSS file, bump the `?v=` query string in every HTML file that loads it. Current versions are documented in `.agents/instructions.md`.

---

## ✅ PRE-EDIT PROTOCOL — MANDATORY BEFORE EVERY CHANGE

See `.agents/instructions.md` for the full 5-step pre-edit protocol. Short version:
1. State the exact files you'll touch and everything that references them
2. `grep` before assuming any name is only used in one file
3. Declare what you will NOT touch
4. Make the edit
5. Verify: onclick functions on window, CSS classes exist, imports valid, no hardcoded tokens, CSS version bumped

### Post-edit smoke test:
- [ ] `cp-api.js` script tags are `type="module"`
- [ ] Inline scripts calling `window.CP` are inside `DOMContentLoaded`
- [ ] No CSS class was renamed without updating all consumers
- [ ] No hardcoded hex colors or pixel values (use CSS tokens)
- [ ] CSS `?v=` bumped if any CSS file changed

---

## 📱 MOBILE-FIRST — MANDATORY DESIGN RULE FOR ALL AI AGENTS

**Primary user:** someone on a phone, outdoors, possibly on slow cell data.

### What mobile-first means here:
- Design for 375px width first. Desktop is secondary.
- Touch targets: minimum 44×44px (Apple HIG standard)
- Inputs: minimum 16px font size (prevents iOS zoom on focus)
- All interactive elements must be reachable by thumb in the lower 2/3 of the screen
- No hover-only interactions — all hover states must have a touch equivalent
- Test all layouts at 375px, 390px (iPhone 14), and 428px (iPhone 14 Plus)

### When writing or editing any HTML/CSS/JS:
- Add `css/mobile.css` overrides when desktop layout breaks at mobile widths
- Never use `px` for font sizes in new CSS — use `rem` or CSS tokens
- Never use fixed heights on containers that hold dynamic content
- Images must always have `loading="lazy"` unless they are above the fold

### Priority order (highest to lowest):
1. Works correctly on iPhone (Safari, 375–430px)
2. Works correctly on Android (Chrome, 360–430px)
3. Works on tablets (768px+)
4. Works on desktop (1024px+)

### NEVER do any of the following:
- Use `vh` units for any critical layout height (Safari iOS does not account for the address bar)
- Use `position: fixed` without testing on iOS Safari (layout shift issues)
- Use `window.scrollTo()` without `{behavior: 'smooth'}` fallback
- Rely on `:hover` for revealing actionable UI elements
- Use `alert()`, `confirm()`, or `prompt()` (use `CP.UI.cpConfirm()` instead)

---

## ⚠️ AUTHENTICATION GROUND TRUTH — MANDATORY FOR ALL AI ACTIONS

### Email Confirmation: DISABLED for all landlord and admin accounts

**Supabase Auth setting:** `Confirm email` is **OFF**.

This means:
- `supabase.auth.signUp()` for a landlord returns `{ user, session }` immediately — **session is always non-null on success**
- The landlord profile INSERT into `landlords` happens in the same call, in the same authenticated context
- There is no confirmation email step, no "check your inbox" screen, and no pending-confirmation state for landlords or admins
- If session is null after signUp, it is an error — surface it immediately, do not treat it as a normal flow

### Three distinct user types — never conflate them

| User Type | Auth Method | Email Confirmation | Session after signUp |
|-----------|-------------|-------------------|----------------------|
| **Landlord / Agent** | Email + Password | **DISABLED** | Immediate |
| **Admin** | Email + Password | **DISABLED** | Immediate (must also exist in `admin_roles`) |
| **Applicant / Tenant** | OTP (passwordless) | N/A — OTP is stateless | After OTP verify only |

### What this means for the RLS policies

The `landlords_own_write` policy is:
```sql
USING (user_id = auth.uid())
```
This works correctly because landlord signUp always returns a live session, so `auth.uid()` is never null at the time of the `landlords` INSERT.

### Future email confirmation

If email confirmation is ever re-enabled for landlords or admins, the `signUp()` flow in `js/cp-api.js` **must be restructured** — the landlord INSERT cannot happen at signUp time without a live session. This would require a Supabase Auth database trigger or a deferred insert on first login.

### Applicant OTP is unaffected

Applicants (`/apply/`) use a completely separate passwordless OTP flow (`supabase.auth.signInWithOtp()`). This must never be changed to email+password.

---

## Project Overview

Choice Properties is a nationwide rental marketplace — a **static site** deployed to Cloudflare Pages. All backend logic runs as **Supabase Edge Functions** hosted on Supabase cloud. There is no local database and no ORM.

---

## How Changes Go Live

```
AI edits static files
         ↓
Owner reviews changes
         ↓
Owner pushes to GitHub
         ↓
Cloudflare Pages auto-deploys
         ↓
Live site updates
```

The AI's job ends after step 1.

---

## Database Setup (New Supabase Project)

**Run one file:**
```
SETUP.sql
```
Paste the entire file into Supabase → SQL Editor → New query → Run.

That is the only file needed. It includes the complete schema, all security patches, all RLS policies, all functions, views, storage configuration, and indexes.

After running SETUP.sql:
1. **Disable email confirmation**: Supabase → Authentication → Providers → Email → toggle **"Confirm email" OFF**
2. **Enable Email OTP** (for applicants only): Supabase → Authentication → Providers → Email → enable OTP
3. Add your admin: `INSERT INTO admin_roles (user_id, email) VALUES ('uid', 'email');`
4. Set Edge Function secrets (see SETUP.md for the full list)

See **SETUP.md** for the complete step-by-step new project guide.

---

## Architecture

- **Frontend**: Static HTML/CSS/JS files served from the project root
- **Build**: `generate-config.js` runs at Cloudflare Pages build time to generate `config.js`
- **Backend API**: Supabase Edge Functions (Deno, hosted on Supabase cloud)
- **Database**: Supabase Postgres (hosted on Supabase cloud)
- **Image CDN**: ImageKit
- **Email relay**: Google Apps Script (GAS) relay for transactional emails
- **Address autocomplete**: Geoapify

---

## Current Database State

- The **properties table is empty** — no listings are currently seeded
- Add listings through the landlord portal: a registered landlord logs in at `/landlord/login.html` and posts properties via `/landlord/new-listing.html`
- Property photos are uploaded to **ImageKit** via the landlord portal form
- Property IDs are auto-generated server-side in `PROP-XXXXXXXX` format

---

## Key Files

| File | Purpose |
|------|---------| 
| `SETUP.sql` | **Single authoritative database setup** — run this for any new Supabase project |
| `SETUP.md` | Complete step-by-step new project setup guide |
| `config.js` | Auto-generated at Cloudflare Pages build time from env vars (gitignored — never commit) |
| `config.example.js` | Template showing all config fields with placeholder values |
| `generate-config.js` | Cloudflare Pages build-time config generator (the build command) |
| `js/cp-api.js` | Shared Supabase API client used by all pages |
| `js/apply.js` | Rental application form logic |
| `js/imagekit.js` | ImageKit upload helper |
| `supabase/functions/` | Edge Function source (deployed to Supabase cloud, version-controlled here) |

---

## Pages

- `/` — Public listings homepage
- `/listings.html` — Browse & filter all properties
- `/property.html` — Individual property detail page
- `/apply.html` — Rental application form
- `/apply/dashboard.html` — Applicant status dashboard
- `/apply/lease.html` — Lease signing page
- `/admin/` — Admin dashboard (login, applications, listings, leases, messages)
- `/landlord/` — Landlord portal (dashboard, listings, applications, messages)

---

## Supabase Edge Functions

All deployed to Supabase cloud — not run locally:

| Function | Purpose |
|----------|---------| 
| `process-application` | Receives application form, saves to DB, fires emails |
| `get-application-status` | Rate-limited status lookup for applicants |
| `generate-lease` | Admin-triggered lease generation with state compliance |
| `sign-lease` | Tenant/co-applicant signing, lease HTML generation, void action |
| `update-status` | Admin/landlord application status updates |
| `send-message` | Admin/landlord → tenant messaging |
| `send-inquiry` | Property inquiry emails + app-ID recovery |
| `mark-paid` | Mark application fee as paid |
| `mark-movein` | Record tenant move-in |
| `imagekit-upload` | Server-side ImageKit upload (keeps private key secure) |

---

## Database Tables

| Table | Purpose |
|-------|---------| 
| `admin_roles` | Tracks which Supabase Auth users have admin access |
| `landlords` | Landlord/property manager profiles |
| `properties` | Property listings |
| `inquiries` | Property inquiry messages from prospective tenants |
| `applications` | Rental applications (core table — all applicant + lease data) |
| `messages` | Admin/landlord ↔ tenant message threads |
| `email_logs` | Log of all transactional email sends |
| `saved_properties` | Tenant property saves (ownership-based RLS) |

## Key Database Functions (RPC)

| Function | Caller | Purpose |
|----------|--------|---------|
| `get_application_status(app_id)` | anon/auth | Returns applicant-safe status + messages |
| `get_lease_financials(app_id, last_name)` | anon/auth | Returns financial terms + sign token (last-name gated) |
| `get_my_applications()` | authenticated | Returns all apps linked to the current user |
| `claim_application(app_id, email)` | authenticated | Links legacy app to a Supabase Auth account |
| `get_apps_by_email(email)` | **authenticated only** | Returns app IDs for email recovery (restricted — PII) |
| `get_app_id_by_email(email)` | **authenticated only** | Returns most recent app_id for email (restricted — PII) |
| `submit_tenant_reply(app_id, msg, name)` | anon/auth | Inserts a tenant reply message |
| `sign_lease(app_id, signature, ip)` | authenticated | Primary applicant lease signing (token verified by Edge Function) |
| `sign_lease_co_applicant(app_id, sig, ip)` | authenticated | Co-applicant signing |
| `mark_expired_leases()` | admin or cron only | Bulk-marks stale sent leases as expired |
| `generate_property_id()` | authenticated | Generates PROP-XXXXXXXX IDs server-side |
| `generate_app_id()` | authenticated | Generates CP-YYYYMMDD-XXXXXXNNN IDs server-side |
| `increment_counter(table, id, col)` | anon/auth | Increments property view counts (properties.views_count only) |

---

## CSS Architecture

All styles split by concern and loaded in order:
- `css/main.css` — Design tokens, base resets, shared component library
- `css/mobile.css` — Responsive layer (loaded last everywhere)
- `css/listings.css` — Homepage hero, property grid, filters
- `css/property.css` — Gallery mosaic, lightbox, detail layout
- `css/apply.css` — Multi-step application form wizard
- `css/admin.css` — Dark-themed admin dashboard
- `css/landlord.css` — Landlord portal

## Property Detail Gallery System

- **Mosaic layout**: 3:2 grid (hero + 2×2 side panels) with LQIP blur-up
- **Responsive height**: `clamp(300px,48vw,660px)` → scales up to 2560px
- **Mobile**: single-column carousel with velocity-aware swipe, dot indicators
- **Lightbox**: fullscreen with LQIP, velocity-aware swipe, focus trap, keyboard nav, thumbnail filmstrip
- **Accessibility**: `aria-modal`, `aria-live` counter, focus trap, focus restoration on close
