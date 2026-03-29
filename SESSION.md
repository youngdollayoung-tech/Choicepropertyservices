# Session 020 — Handoff Document
**Date:** 2026-03-28
**Session type:** Implementation
**Project:** Choice Properties (property rental marketplace)
**Based on:** Session 020 Audit ZIP (13 issues open: I-037 through I-049)

---

## What This Session Did

Implemented all 12 Session 020 issues. One issue (I-043) remains deferred to Session 021.

### Files Changed

| File | Issues |
|---|---|
| `landlord/new-listing.html` | I-037, I-038, I-039, I-040, I-041, I-042 |
| `apply.html` | I-046 (inline script), I-047, I-048 (HTML), I-049 |
| `js/apply-files.js` | I-046 (processFile) |
| `js/apply.js` | I-048 (ratio calculator removed) |
| `js/apply-property.js` | I-048 (_updateRatio call removed) |
| `js/apply-translations.js` | I-049 (English + Spanish hint text) |
| `supabase/functions/process-application/index.ts` | I-044, I-045 |
| `SETUP.sql` | I-038 (CHECK constraint) |
| `ISSUES.md` | Status updates |
| `CHANGELOG.md` | Session 020 implementation entry |
| `SESSION.md` | This file |

**Feature code NOT changed:** All other HTML pages, CSS files, `cp-api.js`, `imagekit.js`, other Edge Functions, `generate-config.js`.

---

## Issue Registry Status

| Status | Count |
|---|---|
| OPEN | 1 |
| IN PROGRESS | 0 |
| RESOLVED | 48 |
| DEFERRED | 1 |
| WONT FIX | 1 |
| **Total** | **51** |

### Only Remaining Open Issue

| ID | Severity | Title |
|---|---|---|
| I-043 | 🔴 CRITICAL | Documents silently discarded — requires Storage upload + schema change |

---

## What Was Fixed

### I-037 — `window.confirm()` → `CP.UI.cpConfirm()`
`submitListing()` in `new-listing.html` now uses the in-app modal for the duplicate address confirmation. No native browser dialogs remain.

### I-038 — Negative numbers rejected
- `#rent` now has `min="1"`, `#sqft` and `#deposit` have `min="0"`
- `SETUP.sql` `properties` table has `CHECK (monthly_rent > 0)` constraint

### I-039 — Description capped at 2000 characters
- `#description` textarea has `maxlength="2000"`
- `validate5()` also enforces the limit as a soft-bypass catch

### I-040 — Duplicate check moved before photo uploads
`submitListing()` now runs the duplicate address DB query and confirm dialog **before** any photo upload begins. Cancelling wastes no bandwidth.

### I-041 — Available date past dates blocked
`availDate.min` is set to today's date on page init via `new Date().toISOString().split('T')[0]`.

### I-042 — Draft banner warns photos not saved
The `#resumeBanner` now includes a note: "Photos are not saved in drafts — you will need to re-upload them."

### I-044 — Government ID masked server-side
New `maskGovernmentId()` function in `process-application/index.ts` stores only the last 4 characters as `***-XXXX`. Applied before the record is built.

### I-045 — Application fee fetched server-side
The property fetch (active status check) now also selects `application_fee` and `landlord_id`. The server-side fee overwrites any client-supplied value. The redundant second `landlord_id` DB query is now only a fallback for address-only (no property_id) submissions.

### I-046 — `alert()` replaced with `CP.UI.toast()`
Both occurrences removed: inline script in `apply.html` and `processFile()` in `apply-files.js`.

### I-047 — `maxlength` on all free-text inputs
44 maxlength attributes added across the application form covering names (100), addresses (200), amounts (20), employment fields (100), references (100), vehicle fields (10–50), and co-applicant fields.

### I-048 — Income-to-rent ratio removed
- `#incomeRatioResult` div removed from `apply.html`
- `updateRatio()` calculator and all event listeners removed from `apply.js`
- `this._updateRatio()` call removed from `apply-property.js`

### I-049 — Contact method hint corrected
- `apply.html` hint updated to: "Select at least one — you can choose both"
- English translation in `apply-translations.js` updated to match
- Spanish translation updated to: "Seleccione al menos uno — puede elegir ambos"

---

## Deferred to Session 021

| ID | Severity | Title |
|---|---|---|
| I-043 | 🔴 CRITICAL | Documents silently discarded — full Storage upload + schema change |

Session 021 plan is already written in `IMPLEMENTATION-PLAN-020.md` under "Session 021 — Deferred: I-043 Document Upload".

---

## Owner Actions Required

**Before Session 021 can deploy:**
1. Deploy updated `process-application` Edge Function to Supabase (I-044 + I-045 changes)
2. Create `application-docs` private Storage bucket in Supabase (required for I-043)
3. Run `ALTER TABLE applications ADD COLUMN document_urls TEXT[] DEFAULT '{}';` in Supabase SQL editor (required for I-043)

**Carry-forward from Session 019 (still pending):**
4. Add `SITE_URL` env var in Cloudflare Pages dashboard
5. Seed 3–5 listings via landlord dashboard

---

## CSS Version Bumps

No CSS files were changed this session. No version bumps required.

Current versions remain:
```
main.css     v=3  |  mobile.css  v=4
admin.css    v=3  |  landlord.css v=3
listings.css v=6  |  apply.css   v=4
property.css v=8
```

---

## Project Context (for AI picking up from this ZIP)

**What it is:** A nationwide property rental marketplace.

**Stack:**
- Frontend: Static HTML + vanilla JavaScript (no build tools, no framework)
- Backend: Supabase (PostgreSQL, RLS, Edge Functions, Storage)
- Media: ImageKit CDN
- Email relay: Google Apps Script (GAS)
- Hosting: Cloudflare Pages (static CDN)

**Key constraints:**
- Managed from mobile — no terminal access
- Deployments via GitHub push → Cloudflare Pages auto-deploys
- Mobile-first: primary design target is mobile; desktop secondary
- Replit is code editor only — never run migrations or provision a database there

**Build command (Cloudflare Pages):** `node generate-config.js`
**Build output directory:** `.`

**Key files:**
| File | Purpose |
|---|---|
| `config.js` / `config.example.js` | All env vars, feature flags, company info |
| `generate-config.js` | The build script — single source of truth |
| `js/cp-api.js` | Shared API client — all methods return `{ ok, data, error }` |
| `js/apply.js` | Rental application core |
| `js/imagekit.js` | ImageKit upload client |
| `landlord/new-listing.html` | 6-step property listing wizard |
| `apply.html` | 7-step rental application form |
| `SETUP.sql` | Complete database schema |
| `ISSUES.md` | Live issue registry (I-043 is the only open issue) |
| `IMPLEMENTATION-PLAN-020.md` | Contains Session 021 plan for I-043 |
| `.agents/instructions.md` | Mandatory pre-edit protocol + project rules |

## CRITICAL — DO NOT TOUCH

- Payment flow — `apply.html` payment copy, `mark-paid` Edge Function, `cp-api.js markPaid()`, `payment_status` logic in `admin/applications.html`. Owner-protected. Never change.
- `apply.html` color scheme — do not change.
- `apply.js` and companion modules — only change what the next session plan specifies.
- Edge Functions — only `process-application` changes were made in Session 020. For Session 021, only `process-application` and `get-application-status` should change.
- `build.js` — **deleted intentionally in Session 019.** Do not recreate.

---

## Supabase Project Reference
- **Project URL:** fapbtawlgtmwdrudrukp.supabase.co
- **GAS URL fragment:** AKfycbxRo3T68MfK1pT7SiIsbSgVQTtWJB2wSzQA8G9NTcpZqkYSI7SKl7HpHjL5e-wc98AK
- **Apply page:** /apply.html
